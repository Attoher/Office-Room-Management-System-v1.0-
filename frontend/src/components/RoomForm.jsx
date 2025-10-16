import React, { useState } from 'react';
import { roomsAPI } from '../services/api';

const RoomForm = ({ onRoomAdded }) => {
  const [formData, setFormData] = useState({
    nama_ruangan: '',
    luas: '',
    kapasitas_max: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // ✅ PERBAIKAN: Handle response yang benar
      const response = await roomsAPI.create(formData);
      
      // ✅ PERBAIKAN: Reset form setelah success
      setFormData({ 
        nama_ruangan: '', 
        luas: '', 
        kapasitas_max: '' 
      });
      
      // ✅ Notifikasi success
      console.log('Room created successfully:', response.data);
      
      // ✅ Panggil callback untuk refresh data
      onRoomAdded();
      
    } catch (error) {
      console.error('Error creating room:', error);
      // ✅ PERBAIKAN: Tampilkan error ke user
      setError(error.message || 'Gagal menambahkan ruangan. Periksa koneksi Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // ✅ Clear error ketika user mulai mengetik lagi
    if (error) setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800">Tambah Ruangan Baru</h3>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error: </strong>
          {error}
        </div>
      )}
      
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
          placeholder="Contoh: Meeting Room A"
          required
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
          placeholder="Contoh: 25.5"
          required
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
          placeholder="Contoh: 15"
          required
        />
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-md"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Menambahkan...
          </span>
        ) : (
          '➕ Tambah Ruangan'
        )}
      </button>
      
      <p className="text-xs text-gray-500 text-center">
        * Wajib diisi
      </p>
    </form>
  );
};

export default RoomForm;