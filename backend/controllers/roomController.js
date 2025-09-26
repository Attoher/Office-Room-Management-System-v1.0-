import pool from '../db.js';

export const getAllRooms = async (req, res) => {
  try {
    console.log('📦 Fetching all rooms...');
    const result = await pool.query('SELECT * FROM rooms ORDER BY id');
    console.log(`✅ Found ${result.rows.length} rooms`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching rooms:', error);
    res.status(500).json({ 
      error: 'Failed to fetch rooms',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
};

export const createRoom = async (req, res) => {
  try {
    const { nama_ruangan, luas, kapasitas_max } = req.body;
    
    // Validation
    if (!nama_ruangan || !luas || !kapasitas_max) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const result = await pool.query(
      'INSERT INTO rooms (nama_ruangan, luas, kapasitas_max) VALUES ($1, $2, $3) RETURNING *',
      [nama_ruangan, luas, kapasitas_max]
    );
    
    console.log('✅ Room created:', result.rows[0].nama_ruangan);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error creating room:', error);
    
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Room name already exists' });
    }
    
    res.status(500).json({ 
      error: 'Failed to create room',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_ruangan, luas, kapasitas_max } = req.body;
        
        const result = await pool.query(
            'UPDATE rooms SET nama_ruangan = $1, luas = $2, kapasitas_max = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
            [nama_ruangan, luas, kapasitas_max, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Room not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM rooms WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Room not found' });
        }
        
        res.json({ message: 'Room deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateOccupancy = async (req, res) => {
    try {
        const { id } = req.params;
        const { occupancy } = req.body;
        
        // Validate occupancy doesn't exceed max capacity
        const roomResult = await pool.query('SELECT kapasitas_max FROM rooms WHERE id = $1', [id]);
        if (roomResult.rows.length === 0) {
            return res.status(404).json({ error: 'Room not found' });
        }
        
        const maxCapacity = roomResult.rows[0].kapasitas_max;
        if (occupancy > maxCapacity) {
            return res.status(400).json({ error: 'Occupancy cannot exceed maximum capacity' });
        }
        
        const result = await pool.query(
            'UPDATE rooms SET occupancy = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [occupancy, id]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};