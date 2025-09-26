import React, { useState } from 'react';
import { connectionsAPI } from '../services/api';

const ConnectionForm = ({ rooms, onConnectionAdded }) => {
  const [formData, setFormData] = useState({
    room_from: '',
    room_to: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.room_from === formData.room_to) {
      alert('Ruangan asal dan tujuan tidak boleh sama');
      return;
    }
    
    setLoading(true);
    
    try {
      await connectionsAPI.create(formData);
      setFormData({ room_from: '', room_to: '' });
      onConnectionAdded();
    } catch (error) {
      console.error('Error creating connection:', error);
      alert('Error membuat koneksi: ' + error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold">Tambah Koneksi Antar Ruangan</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Dari Ruangan</label>
          <select
            value={formData.room_from}
            onChange={(e) => setFormData({...formData, room_from: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            required
          >
            <option value="">Pilih Ruangan</option>
            {rooms.map(room => (
              <option key={room.id} value={room.id}>{room.nama_ruangan}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Ke Ruangan</label>
          <select
            value={formData.room_to}
            onChange={(e) => setFormData({...formData, room_to: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            required
          >
            <option value="">Pilih Ruangan</option>
            {rooms.map(room => (
              <option key={room.id} value={room.id}>{room.nama_ruangan}</option>
            ))}
          </select>
        </div>
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Menambahkan...' : 'Tambah Koneksi'}
      </button>
    </form>
  );
};

export default ConnectionForm;