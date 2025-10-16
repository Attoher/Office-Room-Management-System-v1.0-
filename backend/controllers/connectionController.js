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
  console.error('❌ Connections Controller Error:', error);
  res.status(statusCode).json({
    status: 'error',
    error: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      details: error.details 
    })
  });
};

export const getAllConnections = async (req, res) => {
  try {
    console.log('🔗 Fetching all connections...');
    
    const result = await pool.query(`
      SELECT 
        c.id,
        c.room_from,
        c.room_to,
        c.created_at,
        r1.nama_ruangan as from_name,
        r2.nama_ruangan as to_name
      FROM connections c
      LEFT JOIN rooms r1 ON c.room_from = r1.id
      LEFT JOIN rooms r2 ON c.room_to = r2.id
      ORDER BY c.id
    `);
    
    console.log(`✅ Found ${result.rows.length} connections`);
    sendSuccess(res, result.rows, 'Connections fetched successfully');
  } catch (error) {
    sendError(res, error);
  }
};

export const createConnection = async (req, res) => {
  try {
    const { room_from, room_to } = req.body;
    
    console.log('🆕 Creating connection:', { room_from, room_to });

    // Enhanced validation
    if (!room_from || !room_to) {
      return sendError(res, new Error('room_from dan room_to harus diisi'), 400);
    }

    if (room_from === room_to) {
      return sendError(res, new Error('room_from dan room_to tidak boleh sama'), 400);
    }

    // Normalize connection direction - always store smaller ID as from, larger as to
    const actualFrom = Math.min(parseInt(room_from), parseInt(room_to));
    const actualTo = Math.max(parseInt(room_from), parseInt(room_to));

    console.log('🔄 Normalized connection:', { actualFrom, actualTo });

    // Check if rooms exist
    const roomCheck = await pool.query(
      'SELECT id, nama_ruangan FROM rooms WHERE id = $1 OR id = $2', 
      [actualFrom, actualTo]
    );
    
    if (roomCheck.rows.length !== 2) {
      const foundRooms = roomCheck.rows.map(r => ({ id: r.id, name: r.nama_ruangan }));
      const missingRooms = [actualFrom, actualTo].filter(id => 
        !foundRooms.some(room => room.id === id)
      );
      
      return sendError(res, new Error(
        `Ruangan dengan ID ${missingRooms.join(', ')} tidak ditemukan. ` +
        `Ruangan yang tersedia: ${foundRooms.map(r => `${r.name} (ID: ${r.id})`).join(', ')}`
      ), 404);
    }

    // Check if connection already exists (only need to check one direction now)
    const existingConnection = await pool.query(
      'SELECT * FROM connections WHERE room_from = $1 AND room_to = $2',
      [actualFrom, actualTo]
    );

    if (existingConnection.rows.length > 0) {
      return sendError(res, new Error('Koneksi sudah ada antara kedua ruangan'), 400);
    }

    // Create connection with normalized direction
    const result = await pool.query(
      `INSERT INTO connections (room_from, room_to) 
       VALUES ($1, $2) 
       RETURNING *`,
      [actualFrom, actualTo]
    );

    // Get the created connection with room names
    const connectionWithNames = await pool.query(`
      SELECT 
        c.id,
        c.room_from,
        c.room_to,
        c.created_at,
        r1.nama_ruangan as from_name,
        r2.nama_ruangan as to_name
      FROM connections c
      LEFT JOIN rooms r1 ON c.room_from = r1.id
      LEFT JOIN rooms r2 ON c.room_to = r2.id
      WHERE c.id = $1
    `, [result.rows[0].id]);

    console.log('✅ Connection created:', connectionWithNames.rows[0]);
    sendSuccess(res, connectionWithNames.rows[0], 'Connection created successfully', 201);
  } catch (error) {
    sendError(res, error);
  }
};

export const deleteConnection = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ Deleting connection:', id);

    const result = await pool.query(
      'DELETE FROM connections WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return sendError(res, new Error('Koneksi tidak ditemukan'), 404);
    }

    console.log('✅ Connection deleted:', result.rows[0]);
    sendSuccess(res, result.rows[0], 'Connection deleted successfully');
  } catch (error) {
    sendError(res, error);
  }
};

// Debug endpoint to check database state
export const debugConnections = async (req, res) => {
  try {
    console.log('🐛 Debugging connections database...');
    
    // Check rooms table
    const roomsResult = await pool.query('SELECT * FROM rooms ORDER BY id');
    
    // Check connections table
    const connectionsResult = await pool.query('SELECT * FROM connections ORDER BY id');
    
    // Check joined data
    const joinedResult = await pool.query(`
      SELECT 
        c.id,
        c.room_from,
        c.room_to,
        r1.nama_ruangan as from_name,
        r2.nama_ruangan as to_name
      FROM connections c
      LEFT JOIN rooms r1 ON c.room_from = r1.id
      LEFT JOIN rooms r2 ON c.room_to = r2.id
      ORDER BY c.id
    `);
    
    const debugData = {
      rooms: roomsResult.rows,
      connections: connectionsResult.rows,
      joined_connections: joinedResult.rows,
      summary: {
        total_rooms: roomsResult.rowCount,
        total_connections: connectionsResult.rowCount,
        rooms_without_connections: roomsResult.rows.filter(room => 
          !joinedResult.rows.some(conn => 
            conn.room_from === room.id || conn.room_to === room.id
          )
        ).map(r => r.nama_ruangan)
      }
    };
    
    sendSuccess(res, debugData, 'Debug information fetched successfully');
  } catch (error) {
    sendError(res, error);
  }
};

// Get connections for a specific room
export const getRoomConnections = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    console.log(`🔗 Fetching connections for room ${roomId}...`);
    
    const result = await pool.query(`
      SELECT 
        c.id,
        c.room_from,
        c.room_to,
        r1.nama_ruangan as from_name,
        r2.nama_ruangan as to_name,
        CASE 
          WHEN c.room_from = $1 THEN 'outgoing'
          WHEN c.room_to = $1 THEN 'incoming'
        END as direction
      FROM connections c
      LEFT JOIN rooms r1 ON c.room_from = r1.id
      LEFT JOIN rooms r2 ON c.room_to = r2.id
      WHERE c.room_from = $1 OR c.room_to = $1
      ORDER BY c.id
    `, [parseInt(roomId)]);
    
    sendSuccess(res, result.rows, `Connections for room ${roomId} fetched successfully`);
  } catch (error) {
    sendError(res, error);
  }
};