import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Import database pool
import pool from './db.js';

// Import routes
import roomRoutes from './routes/roomRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import pathfindingRoutes from './routes/pathfindingRoutes.js';

// Import utils
import { logger } from './utils/logger.js';

dotenv.config();

// Test database connection
const testDatabaseConnection = async () => {
  try {
    const client = await pool.connect();
    logger.info('Database connected successfully');
    const result = await client.query('SELECT NOW() as current_time');
    logger.debug(`Database time: ${result.rows[0].current_time}`);
    client.release();
    return true;
  } catch (error) {
    logger.error('Database connection failed', error);
    return false;
  }
};

const app = express();
const port = process.env.PORT || 3000;

// Enhanced CORS configuration
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
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      logger.warn('CORS blocked for origin', { origin });
      return callback(new Error(`CORS policy blocks access from origin: ${origin}`), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    status: 'error',
    error: 'Too many requests, please try again later'
  }
});

const pathfindingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // max 10 pathfinding requests per minute
  message: {
    status: 'error',
    error: 'Too many pathfinding requests, please try again later'
  }
});

app.use(generalLimiter);
app.use('/api/pathfinding', pathfindingLimiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  logger.info(`${req.method} ${req.path}`, {
    origin: req.headers.origin || 'No Origin',
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
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
    logger.error('Database connection test failed', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Database connection failed',
      details: error.message
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
    await pool.query('SELECT 1 as test');
    healthCheck.database = 'connected';
    
    res.json(healthCheck);
  } catch (error) {
    logger.error('Health check - Database connection failed', error);
    healthCheck.status = 'WARNING';
    healthCheck.database = 'disconnected';
    healthCheck.error = error.message;
    
    res.status(503).json(healthCheck);
  }
});

// ==================== LEGACY PATHFINDING ENDPOINT ====================

app.post('/api/pathfinding/legacy', async (req, res) => {
  try {
    const { tujuan, start = 1 } = req.body;
    
    logger.info('Legacy pathfinding request', { tujuan, start });
    
    if (!tujuan) {
      return res.status(400).json({
        status: 'error',
        error: 'Missing required field: tujuan'
      });
    }
    
    // Implementasi legacy pathfinding...
    // [Kode legacy yang sama...]
    
  } catch (error) {
    logger.error('Error in legacy pathfinding', error);
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
  logger.warn('API endpoint not found', {
    method: req.method,
    path: req.originalUrl
  });
  
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
  logger.error('Unhandled error', error, {
    path: req.path,
    method: req.method
  });
  
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
  logger.info('Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

// Initialize server
const startServer = async () => {
  try {
    const dbConnected = await testDatabaseConnection();
    
    if (!dbConnected && process.env.NODE_ENV === 'production') {
      logger.error('Cannot start server without database connection');
      process.exit(1);
    }
    
    app.listen(port, '0.0.0.0', () => {
      logger.info('Office Room Management Backend Started Successfully', {
        port,
        environment: process.env.NODE_ENV || 'development',
        database: dbConnected ? 'Connected' : 'Disconnected'
      });
      
      console.log('\n🚀 Office Room Management Backend Started Successfully');
      console.log('═'.repeat(60));
      console.log(`📍 Port: ${port}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: ${dbConnected ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`🔗 Health Check: http://localhost:${port}/api/health`);
      console.log('═'.repeat(60));
      console.log('🎯 Enhanced Pathfinding Algorithm: ACTIVE');
      console.log('📈 Multiple Route Analysis: ENABLED');
      console.log('🔍 Efficiency Scoring: IMPLEMENTED');
      console.log('🔄 Controller Architecture: OPTIMIZED');
      console.log('🛡️ Rate Limiting: ENABLED');
      console.log('📝 Enhanced Logging: ACTIVE');
      console.log('═'.repeat(60));
    });
    
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();

export default app;