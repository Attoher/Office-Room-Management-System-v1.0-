import React, { useState } from 'react';
import { connectionsAPI } from '../services/api';

const ConnectionForm = ({ rooms, onConnectionAdded }) => {
  const [formData, setFormData] = useState({
    selectedRooms: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    // Clear error when user interacts
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.selectedRooms.length !== 2) {
      setError('Pilih tepat 2 ruangan untuk dihubungkan');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // ✅ PERBAIKAN: Handle response yang benar
      const response = await connectionsAPI.create({
        room_from: formData.selectedRooms[0],
        room_to: formData.selectedRooms[1]
      });
      
      console.log('Connection created successfully:', response.data);
      
      // Reset form
      setFormData({ selectedRooms: [] });
      
      // Notify parent
      onConnectionAdded();
      
    } catch (error) {
      console.error('Error creating connection:', error);
      setError(error.message || 'Gagal membuat koneksi. Periksa koneksi Anda.');
    } finally {
      setLoading(false);
    }
  };

  const getRoomById = (id) => rooms.find(room => room.id == id);
  const selectedRoomObjects = formData.selectedRooms.map(id => getRoomById(id)).filter(Boolean);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800">🔗 Tambah Koneksi Antar Ruangan</h3>
      <p className="text-sm text-gray-600 mb-4">
        Pilih 2 ruangan untuk dihubungkan. Koneksi akan bersifat dua arah dan digunakan dalam pencarian jalur optimal.
      </p>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error: </strong>
          {error}
        </div>
      )}
      
      {/* Room Selection Grid */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          🏢 Pilih Ruangan ({formData.selectedRooms.length}/2)
        </label>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-2 border border-gray-200 rounded-lg">
          {rooms.length === 0 ? (
            <div className="col-span-3 text-center py-8 text-gray-500">
              <div className="text-2xl mb-2">🏢</div>
              <p>Tidak ada ruangan tersedia</p>
              <p className="text-xs">Tambahkan ruangan terlebih dahulu</p>
            </div>
          ) : (
            rooms.map(room => {
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
                      ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-md' 
                      : isDisabled 
                      ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-xs truncate">
                      {status} {room.nama_ruangan}
                    </span>
                    {isSelected && (
                      <span className="text-blue-500 text-lg flex-shrink-0">✓</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {room.occupancy}/{room.kapasitas_max} ({percentage.toFixed(0)}%)
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    ID: {room.id}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
      
      {/* Preview of connection */}
      {selectedRoomObjects.length === 2 && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <div className="text-sm font-medium text-gray-800 mb-2 text-center">
            🔗 Preview Koneksi:
          </div>
          <div className="flex items-center justify-center space-x-4">
            <div className="text-center">
              <div className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium text-sm shadow-sm">
                📍 {selectedRoomObjects[0]?.nama_ruangan}
              </div>
              <div className="text-xs text-gray-500 mt-1">Room ID: {selectedRoomObjects[0]?.id}</div>
            </div>
            <div className="text-2xl text-blue-500 animate-pulse">⟷</div>
            <div className="text-center">
              <div className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg font-medium text-sm shadow-sm">
                🎯 {selectedRoomObjects[1]?.nama_ruangan}
              </div>
              <div className="text-xs text-gray-500 mt-1">Room ID: {selectedRoomObjects[1]?.id}</div>
            </div>
          </div>
          <div className="text-xs text-gray-600 text-center mt-3">
            ✅ Koneksi akan dibuat dua arah (dapat dilewati dari kedua sisi)
          </div>
        </div>
      )}
      
      {/* Selection Status */}
      {formData.selectedRooms.length === 1 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 text-center">
            ⚠️ Pilih 1 ruangan lagi untuk membuat koneksi
          </p>
        </div>
      )}
      
      <button
        type="submit"
        disabled={loading || formData.selectedRooms.length !== 2}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-md"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            🔄 Membuat Koneksi...
          </span>
        ) : formData.selectedRooms.length !== 2 ? (
          <span className="flex items-center justify-center">
            🏢 Pilih 2 Ruangan
          </span>
        ) : (
          <span className="flex items-center justify-center">
            ✅ Buat Koneksi
          </span>
        )}
      </button>
      
      <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
        💡 <strong>Tips:</strong> Klik ruangan untuk memilih/membatalkan pilihan. 
        <br/>Koneksi akan disimpan dalam satu arah tetapi berfungsi dua arah untuk pathfinding.
      </div>
    </form>
  );
};

export default ConnectionForm;