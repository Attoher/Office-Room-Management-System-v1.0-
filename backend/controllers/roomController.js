import pool from '../db.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';
import { logger } from '../utils/logger.js';

export const getAllRooms = async (req, res) => {
  try {
    logger.info('Fetching all rooms');
    
    const result = await pool.query('SELECT * FROM rooms ORDER BY id');
    
    logger.info(`Found ${result.rows.length} rooms`);
    sendSuccess(res, result.rows, 'Rooms fetched successfully');
  } catch (error) {
    logger.error('Failed to fetch rooms', error);
    sendError(res, error);
  }
};

export const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Fetching room with ID: ${id}`);
    
    const result = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      logger.warn(`Room not found with ID: ${id}`);
      return sendError(res, new Error('Room not found'), 404);
    }
    
    sendSuccess(res, result.rows[0], 'Room fetched successfully');
  } catch (error) {
    logger.error(`Failed to fetch room with ID: ${req.params.id}`, error);
    sendError(res, error);
  }
};

export const createRoom = async (req, res) => {
  try {
    const { nama_ruangan, luas, kapasitas_max, occupancy = 0 } = req.body;
    
    logger.info('Creating new room', { nama_ruangan, luas, kapasitas_max, occupancy });
    
    const result = await pool.query(
      `INSERT INTO rooms (nama_ruangan, luas, kapasitas_max, occupancy) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [nama_ruangan, luas, kapasitas_max, occupancy]
    );
    
    logger.info(`Room created successfully: ${result.rows[0].nama_ruangan}`);
    sendSuccess(res, result.rows[0], 'Room created successfully', 201);
  } catch (error) {
    logger.error('Failed to create room', error, { nama_ruangan: req.body.nama_ruangan });
    
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
    
    logger.info(`Updating room ${id}`, { nama_ruangan, luas, kapasitas_max, occupancy });
    
    // Check if room exists first
    const existingRoom = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);
    if (existingRoom.rows.length === 0) {
      logger.warn(`Room not found for update: ${id}`);
      return sendError(res, new Error('Room not found'), 404);
    }

    const result = await pool.query(
      `UPDATE rooms 
       SET nama_ruangan = $1, luas = $2, kapasitas_max = $3, occupancy = $4, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5 
       RETURNING *`,
      [nama_ruangan, luas, kapasitas_max, occupancy, id]
    );
    
    logger.info(`Room updated successfully: ${result.rows[0].nama_ruangan}`);
    sendSuccess(res, result.rows[0], 'Room updated successfully');
  } catch (error) {
    logger.error(`Failed to update room: ${req.params.id}`, error);
    sendError(res, error);
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Deleting room ${id}`);
    
    // Check if room exists first
    const existingRoom = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);
    if (existingRoom.rows.length === 0) {
      logger.warn(`Room not found for deletion: ${id}`);
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
    
    logger.info(`Room deleted successfully: ${result.rows[0].nama_ruangan}`);
    sendSuccess(res, result.rows[0], 'Room deleted successfully');
  } catch (error) {
    logger.error(`Failed to delete room: ${req.params.id}`, error);
    sendError(res, error);
  }
};

export const updateOccupancy = async (req, res) => {
  try {
    const { id } = req.params;
    const { occupancy } = req.body;
    
    logger.info(`Updating occupancy for room ${id}`, { occupancy });
    
    // Validate room exists and occupancy doesn't exceed max capacity
    const roomResult = await pool.query(
      'SELECT kapasitas_max FROM rooms WHERE id = $1', 
      [id]
    );
    
    if (roomResult.rows.length === 0) {
      logger.warn(`Room not found for occupancy update: ${id}`);
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
    
    const responseData = {
      ...updatedRoom,
      occupancy_percentage: `${percentage.toFixed(1)}%`,
      status: percentage < 70 ? 'hijau' : percentage < 90 ? 'kuning' : 'merah'
    };
    
    logger.info(`Occupancy updated successfully for room: ${updatedRoom.nama_ruangan}`);
    sendSuccess(res, responseData, 'Occupancy updated successfully');
  } catch (error) {
    logger.error(`Failed to update occupancy for room: ${req.params.id}`, error);
    sendError(res, error);
  }
};

export const getRoomStats = async (req, res) => {
  try {
    logger.info('Calculating room statistics');
    
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
      },
      rooms_by_status: {
        hijau: rooms.filter(r => (r.occupancy / r.kapasitas_max) * 100 < 70)
          .map(r => ({ id: r.id, name: r.nama_ruangan })),
        kuning: rooms.filter(r => {
          const percent = (r.occupancy / r.kapasitas_max) * 100;
          return percent >= 70 && percent < 90;
        }).map(r => ({ id: r.id, name: r.nama_ruangan })),
        merah: rooms.filter(r => (r.occupancy / r.kapasitas_max) * 100 >= 90)
          .map(r => ({ id: r.id, name: r.nama_ruangan }))
      }
    };
    
    logger.info('Room statistics calculated successfully', {
      total_rooms: stats.total_rooms,
      status_breakdown: stats.status_breakdown
    });
    
    sendSuccess(res, stats, 'Room statistics calculated successfully');
  } catch (error) {
    logger.error('Failed to calculate room statistics', error);
    sendError(res, error);
  }
};