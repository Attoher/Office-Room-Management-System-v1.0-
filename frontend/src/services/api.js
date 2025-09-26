import axios from 'axios';

// Gunakan environment variable, fallback ke localhost untuk development
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tambahkan error handling yang lebih baik
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    throw error;
  }
);

// Rooms API
export const roomsAPI = {
  getAll: () => api.get('/rooms'),
  getById: (id) => api.get(`/rooms/${id}`),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`),
  updateOccupancy: (id, occupancy) => api.put(`/rooms/${id}/occupancy`, { occupancy }),
};

// Connections API
export const connectionsAPI = {
  getAll: () => api.get('/connections'),
  create: (data) => api.post('/connections', data),
  delete: (id) => api.delete(`/connections/${id}`),
};

// Pathfinding API
export const pathfindingAPI = {
  findPath: (tujuan) => api.post('/pathfinding', { tujuan }),
};

export default api;