import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';

import roomRoutes from './routes/rooms.js';
import connectionRoutes from './routes/connections.js';
import pathfindingRoutes from './routes/pathfinding.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Database connection test endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    res.json({ 
      status: 'Database connected', 
      time: result.rows[0].current_time,
      version: result.rows[0].db_version
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ 
      error: 'Database connection failed',
      details: error.message 
    });
  }
});

// Enhanced health check
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT 1 as test');
    
    res.json({ 
      status: 'OK', 
      message: 'Server and database are running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'ERROR',
      message: 'Database connection failed',
      error: error.message 
    });
  }
});

// Routes
app.use('/api/rooms', roomRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/pathfinding', pathfindingRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Office Room Management API v1.0',
    endpoints: {
      health: '/api/health',
      dbTest: '/api/db-test',
      rooms: '/api/rooms',
      connections: '/api/connections',
      pathfinding: '/api/pathfinding'
    }
  });
});

// 404 handler for debugging
app.use('/api/*', (req, res) => {
  console.log(`404 - Endpoint not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'Endpoint not found',
    method: req.method,
    path: req.path,
    available_endpoints: [
      'GET /api/health',
      'GET /api/rooms',
      'POST /api/rooms',
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

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled Error:', error);
  res.status(500).json({ 
    error: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { details: error.message, stack: error.stack })
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log('🚀 Office Room Management Backend Started');
  console.log(`📍 Port: ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: ${process.env.DB_URL ? 'Configured' : 'Not configured'}`);
  console.log(`🔗 Health Check: http://localhost:${port}/api/health`);
  console.log(`🔗 DB Test: http://localhost:${port}/api/db-test`);
});

export default app;