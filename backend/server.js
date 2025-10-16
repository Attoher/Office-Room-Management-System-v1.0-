import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();

const { Pool } = pkg;

// Database configuration dengan SSL untuk production
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.DB_URL,
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false 
  } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
const testDatabaseConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    const result = await client.query('SELECT NOW() as current_time');
    console.log(`📊 Database time: ${result.rows[0].current_time}`);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

const app = express();
const port = process.env.PORT || 3000;

// Enhanced CORS configuration untuk production
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'https://office-room-frontend.vercel.app',
  'https://office-room-management.vercel.app',
  'https://office-room-management-system-v1-0.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      console.warn('CORS blocked for origin:', origin);
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - Origin: ${req.headers.origin || 'No Origin'}`);
  next();
});

// Database connection test endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT NOW() as current_time, version() as db_version, current_database() as db_name'
    );
    
    res.json({ 
      status: 'success',
      message: 'Database connected successfully',
      database: {
        time: result.rows[0].current_time,
        version: result.rows[0].db_version,
        name: result.rows[0].db_name
      },
      connection: {
        environment: process.env.NODE_ENV || 'development',
        ssl_enabled: process.env.NODE_ENV === 'production'
      }
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Database connection failed',
      details: error.message,
      connection_string: process.env.DATABASE_URL ? '***' : 'Not set'
    });
  }
});

// Enhanced health check
app.get('/api/health', async (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Office Room Management API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: 'checking...'
  };

  try {
    // Test database connection
    await pool.query('SELECT 1 as test');
    healthCheck.database = 'connected';
    
    res.json(healthCheck);
  } catch (error) {
    console.error('Health check - Database connection failed:', error);
    healthCheck.status = 'WARNING';
    healthCheck.database = 'disconnected';
    healthCheck.error = error.message;
    
    res.status(503).json(healthCheck);
  }
});

// Routes untuk Rooms
app.get('/api/rooms', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM rooms ORDER BY id'
    );
    res.json({
      status: 'success',
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch rooms',
      details: error.message
    });
  }
});

app.get('/api/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM rooms WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        error: 'Room not found'
      });
    }
    
    res.json({
      status: 'success',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch room',
      details: error.message
    });
  }
});

app.post('/api/rooms', async (req, res) => {
  try {
    const { nama_ruangan, luas, kapasitas_max, occupancy = 0 } = req.body;
    
    // Validation
    if (!nama_ruangan || !luas || !kapasitas_max) {
      return res.status(400).json({
        status: 'error',
        error: 'Missing required fields: nama_ruangan, luas, kapasitas_max'
      });
    }
    
    const result = await pool.query(
      `INSERT INTO rooms (nama_ruangan, luas, kapasitas_max, occupancy) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [nama_ruangan, parseFloat(luas), parseInt(kapasitas_max), parseInt(occupancy)]
    );
    
    res.status(201).json({
      status: 'success',
      message: 'Room created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating room:', error);
    
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({
        status: 'error',
        error: 'Room name already exists'
      });
    }
    
    res.status(500).json({
      status: 'error',
      error: 'Failed to create room',
      details: error.message
    });
  }
});

app.put('/api/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_ruangan, luas, kapasitas_max, occupancy } = req.body;
    
    const result = await pool.query(
      `UPDATE rooms 
       SET nama_ruangan = $1, luas = $2, kapasitas_max = $3, occupancy = $4 
       WHERE id = $5 
       RETURNING *`,
      [nama_ruangan, parseFloat(luas), parseInt(kapasitas_max), parseInt(occupancy), id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        error: 'Room not found'
      });
    }
    
    res.json({
      status: 'success',
      message: 'Room updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to update room',
      details: error.message
    });
  }
});

app.delete('/api/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Hapus koneksi yang terkait terlebih dahulu
    await pool.query(
      'DELETE FROM connections WHERE room_from = $1 OR room_to = $1',
      [id]
    );
    
    const result = await pool.query(
      'DELETE FROM rooms WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        error: 'Room not found'
      });
    }
    
    res.json({
      status: 'success',
      message: 'Room deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to delete room',
      details: error.message
    });
  }
});

app.put('/api/rooms/:id/occupancy', async (req, res) => {
  try {
    const { id } = req.params;
    const { occupancy } = req.body;
    
    if (occupancy === undefined || occupancy === null) {
      return res.status(400).json({
        status: 'error',
        error: 'Occupancy value is required'
      });
    }
    
    const result = await pool.query(
      'UPDATE rooms SET occupancy = $1 WHERE id = $2 RETURNING *',
      [parseInt(occupancy), id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        error: 'Room not found'
      });
    }
    
    res.json({
      status: 'success',
      message: 'Occupancy updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating occupancy:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to update occupancy',
      details: error.message
    });
  }
});

// Routes untuk Connections
app.get('/api/connections', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, 
             r1.nama_ruangan as from_name,
             r2.nama_ruangan as to_name
      FROM connections c
      JOIN rooms r1 ON c.room_from = r1.id
      JOIN rooms r2 ON c.room_to = r2.id
      ORDER BY c.id
    `);
    
    res.json({
      status: 'success',
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch connections',
      details: error.message
    });
  }
});

app.post('/api/connections', async (req, res) => {
  try {
    const { room_from, room_to } = req.body;
    
    if (!room_from || !room_to) {
      return res.status(400).json({
        status: 'error',
        error: 'Missing required fields: room_from, room_to'
      });
    }
    
    // Cek jika koneksi sudah ada
    const existing = await pool.query(
      'SELECT * FROM connections WHERE room_from = $1 AND room_to = $2',
      [room_from, room_to]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({
        status: 'error',
        error: 'Connection already exists'
      });
    }
    
    const result = await pool.query(
      `INSERT INTO connections (room_from, room_to) 
       VALUES ($1, $2) 
       RETURNING *`,
      [parseInt(room_from), parseInt(room_to)]
    );
    
    res.status(201).json({
      status: 'success',
      message: 'Connection created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating connection:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to create connection',
      details: error.message
    });
  }
});

app.delete('/api/connections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM connections WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        error: 'Connection not found'
      });
    }
    
    res.json({
      status: 'success',
      message: 'Connection deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting connection:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to delete connection',
      details: error.message
    });
  }
});

// Debug endpoint untuk connections
app.get('/api/connections/debug', async (req, res) => {
  try {
    const rooms = await pool.query('SELECT * FROM rooms ORDER BY id');
    const connections = await pool.query('SELECT * FROM connections ORDER BY id');
    
    res.json({
      status: 'success',
      rooms: rooms.rows,
      connections: connections.rows,
      summary: {
        total_rooms: rooms.rowCount,
        total_connections: connections.rowCount
      }
    });
  } catch (error) {
    console.error('Error in connections debug:', error);
    res.status(500).json({
      status: 'error',
      error: 'Debug endpoint failed',
      details: error.message
    });
  }
});

// Routes untuk Pathfinding
app.post('/api/pathfinding', async (req, res) => {
  try {
    const { tujuan, start = 1 } = req.body;
    
    if (!tujuan) {
      return res.status(400).json({
        status: 'error',
        error: 'Missing required field: tujuan'
      });
    }
    
    // Dapatkan semua ruangan dan koneksi
    const roomsResult = await pool.query('SELECT * FROM rooms');
    const connectionsResult = await pool.query('SELECT * FROM connections');
    
    const rooms = roomsResult.rows;
    const connections = connectionsResult.rows;
    
    // Cari ruangan tujuan berdasarkan nama
    const targetRoom = rooms.find(room => 
      room.nama_ruangan.toLowerCase().includes(tujuan.toLowerCase())
    );
    
    if (!targetRoom) {
      return res.status(404).json({
        status: 'error',
        error: 'Target room not found'
      });
    }
    
    // Bangun graph dari koneksi
    const graph = {};
    rooms.forEach(room => {
      graph[room.id] = [];
    });
    
    connections.forEach(conn => {
      graph[conn.room_from].push(conn.room_to);
      graph[conn.room_to].push(conn.room_from); // Bi-directional
    });
    
    // BFS Algorithm untuk mencari jalur terpendek
    const bfs = (startId, targetId) => {
      const queue = [{ id: startId, path: [startId] }];
      const visited = new Set([startId]);
      
      while (queue.length > 0) {
        const { id, path } = queue.shift();
        
        if (id === targetId) {
          return path;
        }
        
        for (const neighbor of graph[id] || []) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push({ id: neighbor, path: [...path, neighbor] });
          }
        }
      }
      
      return null; // No path found
    };
    
    const pathIds = bfs(parseInt(start), targetRoom.id);
    
    if (!pathIds) {
      return res.status(404).json({
        status: 'error',
        error: 'No path found to target room'
      });
    }
    
    // Map IDs ke data ruangan lengkap
    const pathRooms = pathIds.map(id => 
      rooms.find(room => room.id === id)
    );
    
    // Hitung status kapasitas untuk setiap ruangan di jalur
    const pathWithCapacity = pathRooms.map(room => ({
      ...room,
      capacity_status: room.occupancy >= room.kapasitas_max ? 'FULL' : 
                     room.occupancy >= room.kapasitas_max * 0.7 ? 'WARNING' : 'SAFE'
    }));
    
    res.json({
      status: 'success',
      data: {
        path: pathWithCapacity,
        total_steps: pathWithCapacity.length - 1,
        target_room: targetRoom,
        capacity_check: pathWithCapacity.every(room => room.capacity_status !== 'FULL')
      }
    });
    
  } catch (error) {
    console.error('Error in pathfinding:', error);
    res.status(500).json({
      status: 'error',
      error: 'Pathfinding failed',
      details: error.message
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: '🏢 Office Room Management API v1.0',
    description: 'Smart office room management system with real-time monitoring and pathfinding',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/api/health',
      dbTest: '/api/db-test',
      rooms: {
        getAll: 'GET /api/rooms',
        getOne: 'GET /api/rooms/:id',
        create: 'POST /api/rooms',
        update: 'PUT /api/rooms/:id',
        delete: 'DELETE /api/rooms/:id',
        updateOccupancy: 'PUT /api/rooms/:id/occupancy'
      },
      connections: {
        getAll: 'GET /api/connections',
        create: 'POST /api/connections',
        delete: 'DELETE /api/connections/:id',
        debug: 'GET /api/connections/debug'
      },
      pathfinding: 'POST /api/pathfinding'
    },
    documentation: 'Check README.md for complete API documentation'
  });
});

// 404 handler untuk API routes
app.use('/api/*', (req, res) => {
  console.log(`404 - API endpoint not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    status: 'error',
    error: 'API endpoint not found',
    method: req.method,
    path: req.originalUrl,
    available_endpoints: [
      'GET /api/health',
      'GET /api/db-test',
      'GET /api/rooms',
      'POST /api/rooms',
      'GET /api/rooms/:id',
      'PUT /api/rooms/:id',
      'DELETE /api/rooms/:id',
      'PUT /api/rooms/:id/occupancy',
      'GET /api/connections',
      'POST /api/connections',
      'DELETE /api/connections/:id',
      'GET /api/connections/debug',
      'POST /api/pathfinding'
    ]
  });
});

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error('🚨 Unhandled Error:', error);
  res.status(500).json({ 
    status: 'error',
    error: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { 
      details: error.message,
      stack: error.stack 
    })
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

// Initialize server
const startServer = async () => {
  try {
    // Test database connection sebelum start server
    const dbConnected = await testDatabaseConnection();
    
    if (!dbConnected && process.env.NODE_ENV === 'production') {
      console.error('❌ Cannot start server without database connection');
      process.exit(1);
    }
    
    app.listen(port, '0.0.0.0', () => {
      console.log('\n🚀 Office Room Management Backend Started Successfully');
      console.log('═'.repeat(50));
      console.log(`📍 Port: ${port}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: ${dbConnected ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`🔗 Health Check: http://localhost:${port}/api/health`);
      console.log(`🔗 DB Test: http://localhost:${port}/api/db-test`);
      console.log(`🔗 API Root: http://localhost:${port}/`);
      console.log('═'.repeat(50));
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;