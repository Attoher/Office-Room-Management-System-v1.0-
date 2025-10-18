import pool from '../db.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';
import { logger } from '../utils/logger.js';

export const getAllConnections = async (req, res) => {
  try {
    logger.info('Fetching all connections');
    
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
    
    logger.info(`Found ${result.rows.length} connections`);
    sendSuccess(res, result.rows, 'Connections fetched successfully');
  } catch (error) {
    logger.error('Failed to fetch connections', error);
    sendError(res, error);
  }
};

export const createConnection = async (req, res) => {
  try {
    const { room_from, room_to } = req.body;
    
    logger.info('Creating connection', { room_from, room_to });

    // Normalize connection direction - always store smaller ID as from, larger as to
    const actualFrom = Math.min(room_from, room_to);
    const actualTo = Math.max(room_from, room_to);

    logger.debug('Normalized connection', { actualFrom, actualTo });

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
      
      logger.warn('Rooms not found for connection', { missingRooms, foundRooms });
      
      return sendError(res, new Error(
        `Ruangan dengan ID ${missingRooms.join(', ')} tidak ditemukan. ` +
        `Ruangan yang tersedia: ${foundRooms.map(r => `${r.name} (ID: ${r.id})`).join(', ')}`
      ), 404);
    }

    // Check if connection already exists
    const existingConnection = await pool.query(
      'SELECT * FROM connections WHERE room_from = $1 AND room_to = $2',
      [actualFrom, actualTo]
    );

    if (existingConnection.rows.length > 0) {
      logger.warn('Connection already exists', { room_from: actualFrom, room_to: actualTo });
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

    logger.info('Connection created successfully', {
      connectionId: result.rows[0].id,
      from: actualFrom,
      to: actualTo
    });
    
    sendSuccess(res, connectionWithNames.rows[0], 'Connection created successfully', 201);
  } catch (error) {
    logger.error('Failed to create connection', error, { 
      room_from: req.body.room_from, 
      room_to: req.body.room_to 
    });
    sendError(res, error);
  }
};

export const deleteConnection = async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info(`Deleting connection: ${id}`);

    const result = await pool.query(
      'DELETE FROM connections WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      logger.warn(`Connection not found for deletion: ${id}`);
      return sendError(res, new Error('Koneksi tidak ditemukan'), 404);
    }

    logger.info('Connection deleted successfully', { connectionId: id });
    sendSuccess(res, result.rows[0], 'Connection deleted successfully');
  } catch (error) {
    logger.error(`Failed to delete connection: ${req.params.id}`, error);
    sendError(res, error);
  }
};

export const debugConnections = async (req, res) => {
  try {
    logger.info('Debugging connections database');
    
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
        ).map(r => ({ id: r.id, name: r.nama_ruangan }))
      }
    };
    
    logger.info('Debug information fetched successfully', {
      total_rooms: debugData.summary.total_rooms,
      total_connections: debugData.summary.total_connections
    });
    
    sendSuccess(res, debugData, 'Debug information fetched successfully');
  } catch (error) {
    logger.error('Failed to fetch debug information', error);
    sendError(res, error);
  }
};

export const getRoomConnections = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    logger.info(`Fetching connections for room: ${roomId}`);
    
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
    
    logger.info(`Found ${result.rows.length} connections for room: ${roomId}`);
    sendSuccess(res, result.rows, `Connections for room ${roomId} fetched successfully`);
  } catch (error) {
    logger.error(`Failed to fetch connections for room: ${req.params.roomId}`, error);
    sendError(res, error);
  }
};