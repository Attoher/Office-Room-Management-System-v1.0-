import axios from 'axios';

// Gunakan environment variable, fallback ke localhost untuk development
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

console.log('🔗 API Base URL:', API_BASE);

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor untuk logging
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
    if (config.data) {
      console.log('📦 Request Data:', config.data);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor untuk error handling yang lebih baik
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`);
    if (response.data) {
      console.log('📨 Response Data:', response.data);
    }
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.error || error.message,
      data: error.response?.data
    });

    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const serverError = {
        status: error.response.status,
        message: error.response.data?.error || 'Server Error',
        details: error.response.data?.details,
        data: error.response.data
      };
      throw serverError;
    } else if (error.request) {
      // Request was made but no response received
      throw {
        status: 0,
        message: 'Network Error: Cannot connect to server',
        details: 'Please check your internet connection and server status'
      };
    } else {
      // Something else happened
      throw {
        status: -1,
        message: 'Request Error: ' + error.message
      };
    }
  }
);

// Test API connection
export const testAPI = {
  health: () => api.get('/health'),
  dbTest: () => api.get('/db-test'),
};

// Rooms API - Updated to match server.js structure
export const roomsAPI = {
  // Get all rooms
  getAll: () => api.get('/rooms')
    .then(response => response.data)
    .catch(error => {
      console.error('Error fetching rooms:', error);
      throw error;
    }),

  // Get room by ID
  getById: (id) => api.get(`/rooms/${id}`)
    .then(response => response.data)
    .catch(error => {
      console.error(`Error fetching room ${id}:`, error);
      throw error;
    }),

  // Create new room
  create: (roomData) => {
    const data = {
      nama_ruangan: roomData.nama_ruangan,
      luas: parseFloat(roomData.luas),
      kapasitas_max: parseInt(roomData.kapasitas_max),
      occupancy: parseInt(roomData.occupancy) || 0
    };
    
    return api.post('/rooms', data)
      .then(response => response.data)
      .catch(error => {
        console.error('Error creating room:', error);
        throw error;
      });
  },

  // Update room
  update: (id, roomData) => {
    const data = {
      nama_ruangan: roomData.nama_ruangan,
      luas: parseFloat(roomData.luas),
      kapasitas_max: parseInt(roomData.kapasitas_max),
      occupancy: parseInt(roomData.occupancy) || 0
    };
    
    return api.put(`/rooms/${id}`, data)
      .then(response => response.data)
      .catch(error => {
        console.error(`Error updating room ${id}:`, error);
        throw error;
      });
  },

  // Delete room
  delete: (id) => api.delete(`/rooms/${id}`)
    .then(response => response.data)
    .catch(error => {
      console.error(`Error deleting room ${id}:`, error);
      throw error;
    }),

  // Update occupancy only
  updateOccupancy: (id, occupancy) => {
    const data = {
      occupancy: parseInt(occupancy)
    };
    
    return api.put(`/rooms/${id}/occupancy`, data)
      .then(response => response.data)
      .catch(error => {
        console.error(`Error updating occupancy for room ${id}:`, error);
        throw error;
      });
  },

  // Get room statistics
  getStats: () => {
    return api.get('/rooms')
      .then(response => {
        const rooms = response.data.data || response.data;
        const totalRooms = rooms.length;
        const totalCapacity = rooms.reduce((sum, room) => sum + room.kapasitas_max, 0);
        const totalOccupancy = rooms.reduce((sum, room) => sum + room.occupancy, 0);
        const averageOccupancy = totalRooms > 0 ? (totalOccupancy / totalCapacity) * 100 : 0;

        const statusCount = {
          safe: 0,
          warning: 0,
          full: 0
        };

        rooms.forEach(room => {
          const occupancyRate = (room.occupancy / room.kapasitas_max) * 100;
          if (occupancyRate >= 90) statusCount.full++;
          else if (occupancyRate >= 70) statusCount.warning++;
          else statusCount.safe++;
        });

        return {
          totalRooms,
          totalCapacity,
          totalOccupancy,
          averageOccupancy: Math.round(averageOccupancy * 100) / 100,
          statusCount
        };
      })
      .catch(error => {
        console.error('Error calculating room stats:', error);
        throw error;
      });
  }
};

// Connections API - Updated to match server.js structure
export const connectionsAPI = {
  // Get all connections with room names
  getAll: () => api.get('/connections')
    .then(response => response.data)
    .catch(error => {
      console.error('Error fetching connections:', error);
      throw error;
    }),

  // Create new connection
  create: (connectionData) => {
    const data = {
      room_from: parseInt(connectionData.room_from),
      room_to: parseInt(connectionData.room_to)
    };
    
    return api.post('/connections', data)
      .then(response => response.data)
      .catch(error => {
        console.error('Error creating connection:', error);
        throw error;
      });
  },

  // Delete connection
  delete: (id) => api.delete(`/connections/${id}`)
    .then(response => response.data)
    .catch(error => {
      console.error(`Error deleting connection ${id}:`, error);
      throw error;
    }),

  // Debug endpoint to get all data
  debug: () => api.get('/connections/debug')
    .then(response => response.data)
    .catch(error => {
      console.error('Error fetching debug data:', error);
      throw error;
    }),

  // Get connections for graph visualization
  getGraphData: async () => {
    try {
      const [roomsResponse, connectionsResponse] = await Promise.all([
        api.get('/rooms'),
        api.get('/connections')
      ]);

      const rooms = roomsResponse.data.data || roomsResponse.data;
      const connections = connectionsResponse.data.data || connectionsResponse.data;

      return {
        nodes: rooms.map(room => ({
          id: room.id,
          label: room.nama_ruangan,
          capacity: room.kapasitas_max,
          occupancy: room.occupancy,
          status: room.occupancy >= room.kapasitas_max ? 'full' : 
                 room.occupancy >= room.kapasitas_max * 0.7 ? 'warning' : 'safe'
        })),
        edges: connections.map(conn => ({
          from: conn.room_from,
          to: conn.room_to,
          id: conn.id
        }))
      };
    } catch (error) {
      console.error('Error fetching graph data:', error);
      throw error;
    }
  }
};

// Pathfinding API - Updated to match server.js structure
export const pathfindingAPI = {
  // Find path to target room
  findPath: (tujuan, start = 1) => {
    console.log('🗺️ Pathfinding Request:', { start, tujuan });
    
    const requestData = {
      tujuan: tujuan,
      start: parseInt(start)
    };

    return api.post('/pathfinding', requestData)
      .then(response => {
        console.log('✅ Pathfinding Response:', response.data);
        return response.data;
      })
      .catch(error => {
        console.error('❌ Pathfinding Error:', error);
        
        // Enhanced error handling for pathfinding
        if (error.status === 404) {
          throw {
            ...error,
            userMessage: `Ruangan "${tujuan}" tidak ditemukan atau tidak dapat diakses`
          };
        } else if (error.status === 0) {
          throw {
            ...error,
            userMessage: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'
          };
        } else {
          throw {
            ...error,
            userMessage: error.message || 'Terjadi kesalahan saat mencari jalur'
          };
        }
      });
  },

  // Find path with enhanced data processing
  findPathEnhanced: async (tujuan, start = 1) => {
    try {
      const result = await pathfindingAPI.findPath(tujuan, start);
      
      // Process the path data for better display
      if (result.data && result.data.path) {
        const processedPath = result.data.path.map((room, index) => ({
          ...room,
          step: index + 1,
          isStart: index === 0,
          isEnd: index === result.data.path.length - 1,
          occupancyRate: Math.round((room.occupancy / room.kapasitas_max) * 100),
          capacityColor: room.occupancy >= room.kapasitas_max ? 'red' : 
                        room.occupancy >= room.kapasitas_max * 0.7 ? 'yellow' : 'green'
        }));

        return {
          ...result,
          data: {
            ...result.data,
            path: processedPath,
            hasFullRooms: processedPath.some(room => room.capacityColor === 'red'),
            hasWarningRooms: processedPath.some(room => room.capacityColor === 'yellow')
          }
        };
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  }
};

// Utility functions
export const apiUtils = {
  // Check if API is reachable
  checkConnection: async () => {
    try {
      const response = await testAPI.health();
      return {
        connected: true,
        status: response.data.status,
        environment: response.data.environment
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  },

  // Get API status with detailed information
  getStatus: async () => {
    try {
      const [health, dbTest] = await Promise.all([
        testAPI.health(),
        testAPI.dbTest()
      ]);

      return {
        api: {
          status: 'connected',
          environment: health.data.environment,
          timestamp: health.data.timestamp
        },
        database: {
          status: 'connected',
          name: dbTest.data.database?.name,
          version: dbTest.data.database?.version
        },
        overall: 'healthy'
      };
    } catch (error) {
      return {
        api: {
          status: 'disconnected',
          error: error.message
        },
        database: {
          status: 'unknown'
        },
        overall: 'unhealthy'
      };
    }
  }
};

// Export the axios instance for custom requests
export { api };

export default {
  testAPI,
  roomsAPI,
  connectionsAPI,
  pathfindingAPI,
  apiUtils
};