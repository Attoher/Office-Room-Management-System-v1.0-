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

// Enhanced response interceptor untuk handle format backend
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`);
    
    // Normalize response structure - backend mengembalikan data langsung
    if (response.data && typeof response.data === 'object') {
      // Jika backend mengembalikan { status: 'success', data: [...], message: '' }
      if (response.data.status === 'success' && response.data.data !== undefined) {
        response.normalizedData = response.data.data;
      } else {
        // Jika backend mengembalikan data langsung
        response.normalizedData = response.data;
      }
    }
    
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.error || error.message,
    });

    if (error.response) {
      const serverError = {
        status: error.response.status,
        message: error.response.data?.error || 'Server Error',
        details: error.response.data?.details,
        data: error.response.data
      };
      return Promise.reject(serverError);
    } else if (error.request) {
      return Promise.reject({
        status: 0,
        message: 'Network Error: Cannot connect to server',
        details: 'Please check your internet connection and server status'
      });
    } else {
      return Promise.reject({
        status: -1,
        message: 'Request Error: ' + error.message
      });
    }
  }
);

// Helper function untuk extract data
const extractData = (response) => {
  return response.normalizedData || response.data?.data || response.data;
};

// Test API connection
export const testAPI = {
  health: () => api.get('/health').then(extractData),
  dbTest: () => api.get('/db-test').then(extractData),
};

// Rooms API - FIXED: Return normalized data
export const roomsAPI = {
  // Get all rooms - RETURN NORMALIZED DATA
  getAll: () => api.get('/rooms').then(extractData),

  // Get room by ID - RETURN NORMALIZED DATA
  getById: (id) => api.get(`/rooms/${id}`).then(extractData),

  // Create new room - RETURN NORMALIZED DATA
  create: (roomData) => {
    const data = {
      nama_ruangan: roomData.nama_ruangan,
      luas: parseFloat(roomData.luas),
      kapasitas_max: parseInt(roomData.kapasitas_max),
      occupancy: parseInt(roomData.occupancy) || 0
    };
    
    return api.post('/rooms', data).then(extractData);
  },

  // Update room - RETURN NORMALIZED DATA
  update: (id, roomData) => {
    const data = {
      nama_ruangan: roomData.nama_ruangan,
      luas: parseFloat(roomData.luas),
      kapasitas_max: parseInt(roomData.kapasitas_max),
      occupancy: parseInt(roomData.occupancy) || 0
    };
    
    return api.put(`/rooms/${id}`, data).then(extractData);
  },

  // Delete room - RETURN NORMALIZED DATA
  delete: (id) => api.delete(`/rooms/${id}`).then(extractData),

  // Update occupancy only - RETURN NORMALIZED DATA
  updateOccupancy: (id, occupancy) => {
    const data = {
      occupancy: parseInt(occupancy)
    };
    
    return api.put(`/rooms/${id}/occupancy`, data).then(extractData);
  },

  // Get room statistics
  getStats: () => api.get('/rooms/stats').then(extractData)
};

// Connections API - FIXED: Return normalized data
export const connectionsAPI = {
  // Get all connections with room names - RETURN NORMALIZED DATA
  getAll: () => api.get('/connections').then(extractData),

  // Create new connection - RETURN NORMALIZED DATA
  create: (connectionData) => {
    const data = {
      room_from: parseInt(connectionData.room_from),
      room_to: parseInt(connectionData.room_to)
    };
    
    return api.post('/connections', data).then(extractData);
  },

  // Delete connection - RETURN NORMALIZED DATA
  delete: (id) => api.delete(`/connections/${id}`).then(extractData),

  // Get connections for specific room
  getRoomConnections: (roomId) => api.get(`/connections/room/${roomId}`).then(extractData),

  // Debug connections
  debug: () => api.get('/connections/debug').then(extractData)
};

// Pathfinding API - FIXED: Return normalized data untuk format baru
export const pathfindingAPI = {
  findPath: (tujuan, start = 1) => {
    console.log('🗺️ Pathfinding Request:', { start, tujuan });
    
    const requestData = {
      tujuan: tujuan,
      start: parseInt(start)
    };

    return api.post('/pathfinding', requestData)
      .then(response => {
        console.log('✅ Pathfinding Response:', response.data);
        // Kembalikan data yang sudah dinormalisasi
        return extractData(response);
      })
      .catch(error => {
        console.error('❌ Pathfinding Error:', error);
        throw error;
      });
  },
  
  // Health check
  health: () => api.get('/pathfinding/health').then(extractData),
  
  // Graph structure
  getGraph: () => api.get('/pathfinding/graph').then(extractData),

  // Legacy pathfinding
  legacy: (tujuan, start = 1) => {
    const requestData = {
      tujuan: tujuan,
      start: parseInt(start)
    };
    return api.post('/pathfinding/legacy', requestData).then(extractData);
  }
};

// Utility functions
export const apiUtils = {
  // Check if API is reachable
  checkConnection: async () => {
    try {
      const response = await api.get('/health');
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

  // Test database connection
  testDatabase: () => api.get('/db-test').then(extractData)
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