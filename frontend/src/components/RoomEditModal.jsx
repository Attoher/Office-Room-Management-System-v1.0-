// frontend/src/components/RoomEditModal.jsx
import React, { useState, useEffect } from 'react';
import { roomsAPI } from '../services/api';

const RoomEditModal = ({ room, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    nama_ruangan: '',
    luas: '',
    kapasitas_max: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (room) {
      setFormData({
        nama_ruangan: room.nama_ruangan,
        luas: room.luas,
        kapasitas_max: room.kapasitas_max
      });
    }
  }, [room]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await roomsAPI.update(room.id, formData);
      onUpdate();
    } catch (error) {
      setError(error.response?.data?.error || 'Gagal mengupdate ruangan');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!room) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Edit Ruangan</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nama Ruangan</label>
              <input
                type="text"
                name="nama_ruangan"
                value={formData.nama_ruangan}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Luas (m²)</label>
              <input
                type="number"
                step="0.01"
                name="luas"
                value={formData.luas}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Kapasitas Maksimum</label>
              <input
                type="number"
                name="kapasitas_max"
                value={formData.kapasitas_max}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                disabled={loading}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RoomEditModal;