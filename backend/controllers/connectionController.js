import pool from '../db.js';

export const getAllConnections = async (req, res) => {
  try {
    console.log('Fetching all connections...');
    
    // FIXED: Query with LEFT JOIN to get room names
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
    
    console.log('Connections fetched:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({ error: error.message });
  }
};

export const createConnection = async (req, res) => {
  try {
    const { room_from, room_to } = req.body;
    
    console.log('Creating connection:', { room_from, room_to });

    // Validate input
    if (!room_from || !room_to) {
      return res.status(400).json({ error: 'room_from dan room_to harus diisi' });
    }

    if (room_from === room_to) {
      return res.status(400).json({ error: 'room_from dan room_to tidak boleh sama' });
    }

    // FIXED: Normalize connection direction - always store smaller ID as from, larger as to
    const actualFrom = Math.min(parseInt(room_from), parseInt(room_to));
    const actualTo = Math.max(parseInt(room_from), parseInt(room_to));

    console.log('Normalized connection:', { actualFrom, actualTo });

    // Check if rooms exist
    const roomCheck = await pool.query(
      'SELECT id, nama_ruangan FROM rooms WHERE id = $1 OR id = $2', 
      [actualFrom, actualTo]
    );
    
    if (roomCheck.rows.length !== 2) {
      return res.status(404).json({ 
        error: 'Satu atau kedua ruangan tidak ditemukan',
        available_rooms: roomCheck.rows.map(r => ({ id: r.id, name: r.nama_ruangan }))
      });
    }

    // FIXED: Check if connection already exists (only need to check one direction now)
    const existingConnection = await pool.query(
      'SELECT * FROM connections WHERE room_from = $1 AND room_to = $2',
      [actualFrom, actualTo]
    );

    if (existingConnection.rows.length > 0) {
      return res.status(400).json({ error: 'Koneksi sudah ada antara kedua ruangan' });
    }

    // FIXED: Create connection with normalized direction
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

    console.log('Connection created:', connectionWithNames.rows[0]);
    res.status(201).json(connectionWithNames.rows[0]);
  } catch (error) {
    console.error('Error creating connection:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteConnection = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Deleting connection:', id);

    const result = await pool.query(
      'DELETE FROM connections WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Koneksi tidak ditemukan' });
    }

    console.log('Connection deleted:', result.rows[0]);
    res.json({ message: 'Koneksi berhasil dihapus', deleted: result.rows[0] });
  } catch (error) {
    console.error('Error deleting connection:', error);
    res.status(500).json({ error: error.message });
  }
};

// Debug endpoint to check database state
export const debugConnections = async (req, res) => {
  try {
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
    
    res.json({
      rooms: roomsResult.rows,
      connections: connectionsResult.rows,
      joined_connections: joinedResult.rows
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
};