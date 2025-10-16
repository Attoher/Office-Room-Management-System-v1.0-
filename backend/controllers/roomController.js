import pool from '../db.js';

// Helper function untuk standardized response
const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    status: 'success',
    data,
    message,
    count: Array.isArray(data) ? data.length : undefined
  });
};

const sendError = (res, error, statusCode = 500) => {
  console.error('❌ Controller Error:', error);
  res.status(statusCode).json({
    status: 'error',
    error: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      details: error.details,
      stack: error.stack 
    })
  });
};

export const getAllRooms = async (req, res) => {
  try {
    console.log('📦 Fetching all rooms...');
    const result = await pool.query('SELECT * FROM rooms ORDER BY id');
    console.log(`✅ Found ${result.rows.length} rooms`);
    
    sendSuccess(res, result.rows, 'Rooms fetched successfully');
  } catch (error) {
    sendError(res, error);
  }
};

export const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📦 Fetching room with ID: ${id}`);
    
    const result = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return sendError(res, new Error('Room not found'), 404);
    }
    
    sendSuccess(res, result.rows[0], 'Room fetched successfully');
  } catch (error) {
    sendError(res, error);
  }
};

export const createRoom = async (req, res) => {
  try {
    const { nama_ruangan, luas, kapasitas_max, occupancy = 0 } = req.body;
    
    console.log('🆕 Creating new room:', { nama_ruangan, luas, kapasitas_max, occupancy });
    
    // Enhanced validation
    if (!nama_ruangan?.trim()) {
      return sendError(res, new Error('Room name is required'), 400);
    }
    if (!luas || parseFloat(luas) <= 0) {
      return sendError(res, new Error('Valid room area is required'), 400);
    }
    if (!kapasitas_max || parseInt(kapasitas_max) <= 0) {
      return sendError(res, new Error('Valid maximum capacity is required'), 400);
    }

    const result = await pool.query(
      `INSERT INTO rooms (nama_ruangan, luas, kapasitas_max, occupancy) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [nama_ruangan.trim(), parseFloat(luas), parseInt(kapasitas_max), parseInt(occupancy)]
    );
    
    console.log('✅ Room created:', result.rows[0].nama_ruangan);
    sendSuccess(res, result.rows[0], 'Room created successfully', 201);
  } catch (error) {
    console.error('❌ Error creating room:', error);
    
    if (error.code === '23505') {
      sendError(res, new Error('Room name already exists'), 400);
    } else {
      sendError(res, error);
    }
  }
};

export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_ruangan, luas, kapasitas_max, occupancy } = req.body;
    
    console.log(`✏️ Updating room ${id}:`, { nama_ruangan, luas, kapasitas_max, occupancy });
    
    // Check if room exists first
    const existingRoom = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);
    if (existingRoom.rows.length === 0) {
      return sendError(res, new Error('Room not found'), 404);
    }

    const result = await pool.query(
      `UPDATE rooms 
       SET nama_ruangan = $1, luas = $2, kapasitas_max = $3, occupancy = $4, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5 
       RETURNING *`,
      [nama_ruangan, parseFloat(luas), parseInt(kapasitas_max), parseInt(occupancy), id]
    );
    
    sendSuccess(res, result.rows[0], 'Room updated successfully');
  } catch (error) {
    sendError(res, error);
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting room ${id}...`);
    
    // Check if room exists first
    const existingRoom = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);
    if (existingRoom.rows.length === 0) {
      return sendError(res, new Error('Room not found'), 404);
    }

    // Delete related connections first
    await pool.query(
      'DELETE FROM connections WHERE room_from = $1 OR room_to = $1',
      [id]
    );
    
    const result = await pool.query(
      'DELETE FROM rooms WHERE id = $1 RETURNING *', 
      [id]
    );
    
    console.log('✅ Room deleted:', result.rows[0].nama_ruangan);
    sendSuccess(res, result.rows[0], 'Room deleted successfully');
  } catch (error) {
    sendError(res, error);
  }
};

export const updateOccupancy = async (req, res) => {
  try {
    const { id } = req.params;
    const { occupancy } = req.body;
    
    console.log(`👥 Updating occupancy for room ${id}: ${occupancy}`);
    
    if (occupancy === undefined || occupancy === null) {
      return sendError(res, new Error('Occupancy value is required'), 400);
    }

    // Validate room exists and occupancy doesn't exceed max capacity
    const roomResult = await pool.query(
      'SELECT kapasitas_max FROM rooms WHERE id = $1', 
      [id]
    );
    
    if (roomResult.rows.length === 0) {
      return sendError(res, new Error('Room not found'), 404);
    }
    
    const maxCapacity = roomResult.rows[0].kapasitas_max;
    const occupancyValue = parseInt(occupancy);
    
    if (occupancyValue > maxCapacity) {
      return sendError(res, new Error(`Occupancy cannot exceed maximum capacity of ${maxCapacity}`), 400);
    }
    
    if (occupancyValue < 0) {
      return sendError(res, new Error('Occupancy cannot be negative'), 400);
    }

    const result = await pool.query(
      `UPDATE rooms 
       SET occupancy = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [occupancyValue, id]
    );
    
    const updatedRoom = result.rows[0];
    const percentage = (updatedRoom.occupancy / updatedRoom.kapasitas_max) * 100;
    
    sendSuccess(res, {
      ...updatedRoom,
      occupancy_percentage: `${percentage.toFixed(1)}%`,
      status: percentage < 70 ? 'hijau' : percentage < 90 ? 'kuning' : 'merah'
    }, 'Occupancy updated successfully');
  } catch (error) {
    sendError(res, error);
  }
};

// Additional utility endpoint
export const getRoomStats = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rooms ORDER BY id');
    const rooms = result.rows;
    
    const stats = {
      total_rooms: rooms.length,
      total_capacity: rooms.reduce((sum, room) => sum + room.kapasitas_max, 0),
      total_occupancy: rooms.reduce((sum, room) => sum + room.occupancy, 0),
      average_occupancy: rooms.length > 0 ? 
        (rooms.reduce((sum, room) => sum + (room.occupancy / room.kapasitas_max), 0) / rooms.length * 100).toFixed(1) + '%' : '0%',
      status_breakdown: {
        hijau: rooms.filter(r => (r.occupancy / r.kapasitas_max) * 100 < 70).length,
        kuning: rooms.filter(r => {
          const percent = (r.occupancy / r.kapasitas_max) * 100;
          return percent >= 70 && percent < 90;
        }).length,
        merah: rooms.filter(r => (r.occupancy / r.kapasitas_max) * 100 >= 90).length
      }
    };
    
    sendSuccess(res, stats, 'Room statistics calculated successfully');
  } catch (error) {
    sendError(res, error);
  }
};