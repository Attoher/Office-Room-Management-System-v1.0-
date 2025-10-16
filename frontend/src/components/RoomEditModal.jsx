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
        nama_ruangan: room.nama_ruangan || '',
        luas: room.luas || '',
        kapasitas_max: room.kapasitas_max || ''
      });
    }
  }, [room]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // ✅ PERBAIKAN: Handle response yang benar
      const response = await roomsAPI.update(room.id, formData);
      console.log('Room updated successfully:', response.data);
      
      // Notify parent
      onUpdate();
      
    } catch (error) {
      console.error('Error updating room:', error);
      setError(error.message || 'Gagal mengupdate ruangan. Periksa koneksi Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  if (!room) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">✏️ Edit Ruangan</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Error: </strong>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Ruangan *
              </label>
              <input
                type="text"
                name="nama_ruangan"
                value={formData.nama_ruangan}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Luas (m²) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="luas"
                value={formData.luas}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kapasitas Maksimum *
              </label>
              <input
                type="number"
                min="1"
                name="kapasitas_max"
                value={formData.kapasitas_max}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
                disabled={loading}
              />
            </div>
            
            {/* Current Room Info */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">📊 Info Saat Ini:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>Occupancy:</div>
                <div className="font-medium">{room.occupancy} orang</div>
                <div>Persentase:</div>
                <div className="font-medium">
                  {((room.occupancy / room.kapasitas_max) * 100).toFixed(1)}%
                </div>
                <div>Room ID:</div>
                <div className="font-mono">{room.id}</div>
              </div>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-400 transition-all disabled:opacity-50 font-medium"
                disabled={loading}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all font-medium shadow-md"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </span>
                ) : (
                  '💾 Simpan Perubahan'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RoomEditModal;