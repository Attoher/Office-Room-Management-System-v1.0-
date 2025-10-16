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
      return Promise.reject(serverError);
    } else if (error.request) {
      // Request was made but no response received
      return Promise.reject({
        status: 0,
        message: 'Network Error: Cannot connect to server',
        details: 'Please check your internet connection and server status'
      });
    } else {
      // Something else happened
      return Promise.reject({
        status: -1,
        message: 'Request Error: ' + error.message
      });
    }
  }
);

// Test API connection
export const testAPI = {
  health: () => api.get('/health'),
  dbTest: () => api.get('/db-test'),
};

// Rooms API - FIXED: Return full response for consistency
export const roomsAPI = {
  // Get all rooms - RETURN FULL RESPONSE
  getAll: () => api.get('/rooms'),

  // Get room by ID - RETURN FULL RESPONSE
  getById: (id) => api.get(`/rooms/${id}`),

  // Create new room - RETURN FULL RESPONSE
  create: (roomData) => {
    const data = {
      nama_ruangan: roomData.nama_ruangan,
      luas: parseFloat(roomData.luas),
      kapasitas_max: parseInt(roomData.kapasitas_max),
      occupancy: parseInt(roomData.occupancy) || 0
    };
    
    return api.post('/rooms', data);
  },

  // Update room - RETURN FULL RESPONSE
  update: (id, roomData) => {
    const data = {
      nama_ruangan: roomData.nama_ruangan,
      luas: parseFloat(roomData.luas),
      kapasitas_max: parseInt(roomData.kapasitas_max),
      occupancy: parseInt(roomData.occupancy) || 0
    };
    
    return api.put(`/rooms/${id}`, data);
  },

  // Delete room - RETURN FULL RESPONSE
  delete: (id) => api.delete(`/rooms/${id}`),

  // Update occupancy only - RETURN FULL RESPONSE
  updateOccupancy: (id, occupancy) => {
    const data = {
      occupancy: parseInt(occupancy)
    };
    
    return api.put(`/rooms/${id}/occupancy`, data);
  }
};

// Connections API - FIXED: Return full response
export const connectionsAPI = {
  // Get all connections with room names - RETURN FULL RESPONSE
  getAll: () => api.get('/connections'),

  // Create new connection - RETURN FULL RESPONSE
  create: (connectionData) => {
    const data = {
      room_from: parseInt(connectionData.room_from),
      room_to: parseInt(connectionData.room_to)
    };
    
    return api.post('/connections', data);
  },

  // Delete connection - RETURN FULL RESPONSE
  delete: (id) => api.delete(`/connections/${id}`)
};

// Pathfinding API - FIXED: Return full response
export const pathfindingAPI = {
  findPath: (tujuan, start = 1) => {
    console.log('🗺️ Pathfinding Request:', { start, tujuan });
    
    const requestData = {
      tujuan: tujuan,
      start: parseInt(start) // ✅ Pastikan start adalah number
    };

    return api.post('/pathfinding', requestData)
      .then(response => {
        console.log('✅ Pathfinding Response:', response.data);
        return response;
      })
      .catch(error => {
        console.error('❌ Pathfinding Error:', error);
        throw error;
      });
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