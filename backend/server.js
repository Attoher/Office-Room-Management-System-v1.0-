import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';

// Import routes
import roomRoutes from './routes/roomRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import pathfindingRoutes from './routes/pathfindingRoutes.js';

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

// ==================== ROUTES REGISTRATION ====================

// Register routes
app.use('/api/rooms', roomRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/pathfinding', pathfindingRoutes);

// ==================== CORE API ENDPOINTS ====================

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
    database: 'checking...',
    routes: {
      rooms: 'registered',
      connections: 'registered',
      pathfinding: 'registered'
    }
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

// ==================== ENHANCED PATHFINDING ALGORITHM ====================

/**
 * Enhanced BFS untuk mencari semua kemungkinan rute
 */
const findAllPaths = (graph, startId, targetId, maxPaths = 10) => {
  const queue = [{ id: startId, path: [startId], visited: new Set([startId]) }];
  const allPaths = [];
  
  while (queue.length > 0 && allPaths.length < maxPaths) {
    const { id, path, visited } = queue.shift();
    
    if (id === targetId) {
      allPaths.push(path);
      continue;
    }
    
    for (const neighbor of graph[id] || []) {
      if (!visited.has(neighbor)) {
        const newVisited = new Set(visited);
        newVisited.add(neighbor);
        queue.push({ 
          id: neighbor, 
          path: [...path, neighbor], 
          visited: newVisited 
        });
      }
    }
  }
  
  return allPaths;
};

/**
 * Hitung skor efisiensi untuk sebuah rute
 */
const calculateRouteEfficiency = (path, rooms) => {
  const roomData = path.map(id => rooms.find(r => r.id === id));
  
  // Hitung average occupancy rate (lower is better)
  const avgOccupancy = roomData.reduce((sum, room) => {
    return sum + (room.occupancy / room.kapasitas_max);
  }, 0) / roomData.length;
  
  // Skor berdasarkan panjang rute (shorter is better) dan occupancy (lower is better)
  const lengthScore = Math.max(0, 1 - (path.length - 1) * 0.1); // -10% per step
  const occupancyScore = 1 - avgOccupancy; // Lower occupancy = higher score
  
  // Weighted score: 40% length, 60% occupancy
  const efficiencyScore = (lengthScore * 0.4 + occupancyScore * 0.6) * 100;
  
  return {
    efficiency_score: Math.round(efficiencyScore),
    avg_occupancy: (avgOccupancy * 100).toFixed(1) + '%',
    length: path.length - 1
  };
};

// ==================== LEGACY PATHFINDING ENDPOINT (FOR COMPATIBILITY) ====================

app.post('/api/pathfinding/legacy', async (req, res) => {
  try {
    const { tujuan, start = 1 } = req.body;
    
    console.log('🚀 Legacy Pathfinding request:', { tujuan, start });
    
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
    
    console.log(`📊 Loaded ${rooms.length} rooms and ${connections.length} connections`);
    
    // Cari ruangan asal dan tujuan
    const startRoom = rooms.find(room => room.id === parseInt(start));
    const targetRoom = rooms.find(room => 
      room.nama_ruangan.toLowerCase().includes(tujuan.toLowerCase())
    );
    
    if (!startRoom) {
      return res.status(404).json({
        status: 'error',
        error: `Start room with ID ${start} not found`
      });
    }
    
    if (!targetRoom) {
      return res.status(404).json({
        status: 'error',
        error: `Target room "${tujuan}" not found`
      });
    }
    
    console.log(`📍 Start: ${startRoom.nama_ruangan}, Target: ${targetRoom.nama_ruangan}`);
    
    // Bangun graph dari koneksi
    const graph = {};
    rooms.forEach(room => {
      graph[room.id] = [];
    });
    
    connections.forEach(conn => {
      graph[conn.room_from].push(conn.room_to);
      graph[conn.room_to].push(conn.room_from); // Bi-directional
    });
    
    console.log('🔗 Graph structure:', graph);
    
    // Cari SEMUA kemungkinan rute (maksimal 10)
    const allPaths = findAllPaths(graph, startRoom.id, targetRoom.id, 10);
    
    if (allPaths.length === 0) {
      return res.status(404).json({
        status: 'error',
        error: 'No path found to target room'
      });
    }
    
    console.log(`🛣️ Found ${allPaths.length} possible routes`);
    
    // Hitung efisiensi untuk setiap rute
    const routesWithEfficiency = allPaths.map((path, index) => {
      const efficiency = calculateRouteEfficiency(path, rooms);
      const roomNames = path.map(id => {
        const room = rooms.find(r => r.id === id);
        return room.nama_ruangan;
      });
      
      return {
        rute: roomNames,
        langkah: path.length - 1,
        efisiensi_score: efficiency.efficiency_score,
        avg_occupancy: efficiency.avg_occupancy,
        is_optimal: index === 0 // Rute pertama adalah yang terpendek
      };
    });
    
    // Sort routes by efficiency score (descending)
    routesWithEfficiency.sort((a, b) => b.efisiensi_score - a.efisiensi_score);
    
    // Tentukan rute optimal (yang memiliki skor tertinggi)
    const optimalRoute = routesWithEfficiency[0];
    
    // Cek jika ada ruangan penuh di rute optimal
    const fullRoomsInOptimalPath = optimalRoute.rute.filter(roomName => {
      const room = rooms.find(r => r.nama_ruangan === roomName);
      return room && room.occupancy >= room.kapasitas_max;
    });
    
    const hasFullRooms = fullRoomsInOptimalPath.length > 0;
    
    // Hitung persentase perbandingan dengan optimal untuk setiap rute
    const routesWithComparison = routesWithEfficiency.map(route => ({
      ...route,
      perbandingan_dengan_optimal: Math.round((route.efisiensi_score / optimalRoute.efisiensi_score) * 100) + '%'
    }));
    
    // Siapkan response
    const response = {
      status: hasFullRooms ? 'penuh' : 'aman',
      jalur_optimal: optimalRoute.rute,
      semua_kemungkinan_rute: routesWithComparison,
      ruangan_asal: startRoom.nama_ruangan,
      ruangan_tujuan: targetRoom.nama_ruangan,
      occupancy_tujuan: `${targetRoom.occupancy}/${targetRoom.kapasitas_max} (${((targetRoom.occupancy / targetRoom.kapasitas_max) * 100).toFixed(1)}%)`
    };
    
    if (hasFullRooms) {
      response.ruangan_penuh = fullRoomsInOptimalPath;
      response.occupancy = fullRoomsInOptimalPath.map(roomName => {
        const room = rooms.find(r => r.nama_ruangan === roomName);
        return `${room.occupancy}/${room.kapasitas_max}`;
      });
    }
    
    console.log('✅ Pathfinding completed successfully');
    console.log('📤 Response:', {
      status: response.status,
      optimal_route_steps: optimalRoute.rute.length - 1,
      total_routes_found: routesWithComparison.length,
      has_full_rooms: hasFullRooms
    });
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error in pathfinding:', error);
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
        getStats: 'GET /api/rooms/stats',
        getOne: 'GET /api/rooms/:id',
        create: 'POST /api/rooms',
        update: 'PUT /api/rooms/:id',
        delete: 'DELETE /api/rooms/:id',
        updateOccupancy: 'PUT /api/rooms/:id/occupancy'
      },
      connections: {
        getAll: 'GET /api/connections',
        getRoomConnections: 'GET /api/connections/room/:roomId',
        debug: 'GET /api/connections/debug',
        create: 'POST /api/connections',
        delete: 'DELETE /api/connections/:id'
      },
      pathfinding: {
        health: 'GET /api/pathfinding/health',
        graph: 'GET /api/pathfinding/graph',
        findPath: 'POST /api/pathfinding',
        legacy: 'POST /api/pathfinding/legacy'
      }
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
      'GET /api/rooms/stats',
      'GET /api/rooms/:id',
      'POST /api/rooms',
      'PUT /api/rooms/:id',
      'DELETE /api/rooms/:id',
      'PUT /api/rooms/:id/occupancy',
      'GET /api/connections',
      'GET /api/connections/debug',
      'GET /api/connections/room/:roomId',
      'POST /api/connections',
      'DELETE /api/connections/:id',
      'GET /api/pathfinding/health',
      'GET /api/pathfinding/graph',
      'POST /api/pathfinding',
      'POST /api/pathfinding/legacy'
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
      console.log('═'.repeat(60));
      console.log(`📍 Port: ${port}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: ${dbConnected ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`🔗 Health Check: http://localhost:${port}/api/health`);
      console.log(`🔗 DB Test: http://localhost:${port}/api/db-test`);
      console.log(`🔗 API Root: http://localhost:${port}/`);
      console.log('═'.repeat(60));
      console.log('🎯 Enhanced Pathfinding Algorithm: ACTIVE');
      console.log('📈 Multiple Route Analysis: ENABLED');
      console.log('🔍 Efficiency Scoring: IMPLEMENTED');
      console.log('🔄 Controller Architecture: IMPLEMENTED');
      console.log('═'.repeat(60));
      console.log('\n📋 Registered Routes:');
      console.log('  🏢 Rooms:');
      console.log('    GET    /api/rooms');
      console.log('    GET    /api/rooms/stats');
      console.log('    GET    /api/rooms/:id');
      console.log('    POST   /api/rooms');
      console.log('    PUT    /api/rooms/:id');
      console.log('    DELETE /api/rooms/:id');
      console.log('    PUT    /api/rooms/:id/occupancy');
      console.log('  🔗 Connections:');
      console.log('    GET    /api/connections');
      console.log('    GET    /api/connections/debug');
      console.log('    GET    /api/connections/room/:roomId');
      console.log('    POST   /api/connections');
      console.log('    DELETE /api/connections/:id');
      console.log('  🧭 Pathfinding:');
      console.log('    GET    /api/pathfinding/health');
      console.log('    GET    /api/pathfinding/graph');
      console.log('    POST   /api/pathfinding');
      console.log('    POST   /api/pathfinding/legacy');
      console.log('═'.repeat(60));
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;