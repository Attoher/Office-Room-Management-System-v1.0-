import pool from '../db.js';

export const getAllConnections = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, r1.nama_ruangan as from_name, r2.nama_ruangan as to_name 
            FROM connections c
            JOIN rooms r1 ON c.room_from = r1.id
            JOIN rooms r2 ON c.room_to = r2.id
            ORDER BY c.id
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createConnection = async (req, res) => {
    try {
        const { room_from, room_to } = req.body;
        
        // Check if rooms exist
        const roomCheck = await pool.query('SELECT id FROM rooms WHERE id IN ($1, $2)', [room_from, room_to]);
        if (roomCheck.rows.length !== 2) {
            return res.status(400).json({ error: 'One or both rooms not found' });
        }
        
        // Check if connection already exists
        const existingConnection = await pool.query(
            'SELECT id FROM connections WHERE (room_from = $1 AND room_to = $2) OR (room_from = $2 AND room_to = $1)',
            [room_from, room_to]
        );
        
        if (existingConnection.rows.length > 0) {
            return res.status(400).json({ error: 'Connection already exists' });
        }
        
        const result = await pool.query(
            'INSERT INTO connections (room_from, room_to) VALUES ($1, $2) RETURNING *',
            [room_from, room_to]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteConnection = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM connections WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Connection not found' });
        }
        
        res.json({ message: 'Connection deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};