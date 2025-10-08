import React, { useState } from 'react';
import { connectionsAPI } from '../services/api';

const ConnectionForm = ({ rooms, onConnectionAdded }) => {
  const [formData, setFormData] = useState({
    selectedRooms: []
  });
  const [loading, setLoading] = useState(false);

  const handleRoomToggle = (roomId) => {
    const currentSelected = formData.selectedRooms;
    if (currentSelected.includes(roomId)) {
      // Remove room if already selected
      setFormData({
        selectedRooms: currentSelected.filter(id => id !== roomId)
      });
    } else if (currentSelected.length < 2) {
      // Add room if less than 2 selected
      setFormData({
        selectedRooms: [...currentSelected, roomId]
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.selectedRooms.length !== 2) {
      alert('Pilih tepat 2 ruangan untuk dihubungkan');
      return;
    }
    
    setLoading(true);
    
    try {
      // Backend will automatically normalize the direction
      await connectionsAPI.create({
        room_from: formData.selectedRooms[0],
        room_to: formData.selectedRooms[1]
      });
      
      setFormData({ selectedRooms: [] });
      onConnectionAdded();
    } catch (error) {
      console.error('Error creating connection:', error);
      alert('Error membuat koneksi: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const selectedRoomObjects = formData.selectedRooms.map(id => 
    rooms.find(room => room.id == id)
  ).filter(Boolean);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold">🔗 Tambah Koneksi Antar Ruangan</h3>
      <p className="text-sm text-gray-600 mb-4">
        Pilih 2 ruangan untuk dihubungkan. Koneksi akan bersifat dua arah dan digunakan dalam pencarian jalur optimal.
      </p>
      
      {/* Room Selection Grid */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          🏢 Pilih Ruangan ({formData.selectedRooms.length}/2)
        </label>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-2">
          {rooms.map(room => {
            const percentage = (room.occupancy / room.kapasitas_max) * 100;
            const status = percentage < 70 ? '🟢' : percentage < 90 ? '🟡' : '🔴';
            const isSelected = formData.selectedRooms.includes(room.id);
            const isDisabled = !isSelected && formData.selectedRooms.length >= 2;
            
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => handleRoomToggle(room.id)}
                disabled={isDisabled}
                className={`p-3 rounded-lg border-2 text-left transition-all text-sm ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 text-blue-800' 
                    : isDisabled 
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-xs">
                    {status} {room.nama_ruangan}
                  </span>
                  {isSelected && (
                    <span className="text-blue-500 text-lg">✓</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {room.occupancy}/{room.kapasitas_max} ({percentage.toFixed(0)}%)
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Preview of connection */}
      {selectedRoomObjects.length === 2 && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-sm font-medium text-gray-800 mb-2">
            🔗 Preview Koneksi:
          </div>
          <div className="flex items-center justify-center">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded font-medium text-sm">
              📍 {selectedRoomObjects[0]?.nama_ruangan}
            </span>
            <span className="mx-3 text-gray-400">⟷</span>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded font-medium text-sm">
              🎯 {selectedRoomObjects[1]?.nama_ruangan}
            </span>
          </div>
          <div className="text-xs text-gray-600 text-center mt-2">
            Koneksi akan dibuat dua arah (dapat dilewati dari kedua sisi)
          </div>
        </div>
      )}
      
      {/* Selection Status */}
      {formData.selectedRooms.length === 1 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ Pilih 1 ruangan lagi untuk membuat koneksi
          </p>
        </div>
      )}
      
      <button
        type="submit"
        disabled={loading || formData.selectedRooms.length !== 2}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            🔄 Membuat Koneksi...
          </span>
        ) : formData.selectedRooms.length !== 2 ? (
          <span className="flex items-center justify-center">
            🏢 Pilih 2 Ruangan untuk Menghubungkan
          </span>
        ) : (
          <span className="flex items-center justify-center">
            ✅ Buat Koneksi Baru
          </span>
        )}
      </button>
      
      <div className="text-xs text-gray-500">
        💡 <strong>Tips:</strong> Klik ruangan untuk memilih/membatalkan pilihan. Koneksi akan disimpan dalam satu arah tetapi berfungsi dua arah untuk pathfinding.
      </div>
    </form>
  );
};

export default ConnectionForm;