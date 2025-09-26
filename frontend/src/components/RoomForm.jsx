import React, { useState } from 'react';
import { roomsAPI } from '../services/api';

const RoomForm = ({ onRoomAdded }) => {
  const [formData, setFormData] = useState({
    nama_ruangan: '',
    luas: '',
    kapasitas_max: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await roomsAPI.create(formData);
      setFormData({ nama_ruangan: '', luas: '', kapasitas_max: '' });
      onRoomAdded();
    } catch (error) {
      console.error('Error creating room:', error);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold">Tambah Ruangan Baru</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Nama Ruangan</label>
        <input
          type="text"
          name="nama_ruangan"
          value={formData.nama_ruangan}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
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
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
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
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          required
        />
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Menambahkan...' : 'Tambah Ruangan'}
      </button>
    </form>
  );
};

export default RoomForm;