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
      setFormData({
        selectedRooms: currentSelected.filter(id => id !== roomId)
      });
    } else if (currentSelected.length < 2) {
      setFormData({
        selectedRooms: [...currentSelected, roomId]
      });
    }
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
      const response = await connectionsAPI.create({
        room_from: formData.selectedRooms[0],
        room_to: formData.selectedRooms[1]
      });
      
      console.log('Connection created successfully:', response.data);
      setFormData({ selectedRooms: [] });
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
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Tambah Koneksi</h3>
        <span className="text-2xl">🔗</span>
      </div>
      
      <p className="text-sm text-gray-600">
        Pilih 2 ruangan untuk dihubungkan. Koneksi akan bersifat dua arah.
      </p>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-lg text-sm">
          <strong>Error: </strong>
          {error}
        </div>
      )}
      
      {/* Room Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          🏢 Pilih Ruangan ({formData.selectedRooms.length}/2)
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
          {rooms.length === 0 ? (
            <div className="col-span-2 text-center py-6 text-gray-500">
              <div className="text-3xl mb-2">🏢</div>
              <p className="text-sm">Tidak ada ruangan tersedia</p>
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
                  className={`p-3 rounded-lg border-2 text-left transition-all text-sm min-h-[80px] ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-md' 
                      : isDisabled 
                      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-1">
                        <span className="text-base mr-2">{status}</span>
                        <span className="font-medium text-xs truncate">
                          {room.nama_ruangan}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {room.occupancy}/{room.kapasitas_max} ({percentage.toFixed(0)}%)
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        ID: {room.id}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-blue-500 text-lg flex-shrink-0 ml-2">✓</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
      
      {/* Preview of connection */}
      {selectedRoomObjects.length === 2 && (
        <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <div className="text-sm font-medium text-gray-800 mb-2 text-center">
            🔗 Preview Koneksi:
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="text-center">
              <div className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium text-sm shadow-sm max-w-[120px] truncate">
                📍 {selectedRoomObjects[0]?.nama_ruangan}
              </div>
              <div className="text-xs text-gray-500 mt-1">ID: {selectedRoomObjects[0]?.id}</div>
            </div>
            <div className="text-xl text-blue-500 animate-pulse">⟷</div>
            <div className="text-center">
              <div className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg font-medium text-sm shadow-sm max-w-[120px] truncate">
                🎯 {selectedRoomObjects[1]?.nama_ruangan}
              </div>
              <div className="text-xs text-gray-500 mt-1">ID: {selectedRoomObjects[1]?.id}</div>
            </div>
          </div>
          <div className="text-xs text-gray-600 text-center mt-2">
            ✅ Koneksi dua arah
          </div>
        </div>
      )}
      
      {/* Selection Status */}
      {formData.selectedRooms.length === 1 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 text-center">
            ⚠️ Pilih 1 ruangan lagi
          </p>
        </div>
      )}
      
      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || formData.selectedRooms.length !== 2}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-4 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-md text-base min-h-[52px] flex items-center justify-center"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Membuat Koneksi...
          </span>
        ) : formData.selectedRooms.length !== 2 ? (
          <span className="flex items-center justify-center">
            <span className="text-lg mr-2">🏢</span>
            Pilih 2 Ruangan
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <span className="text-lg mr-2">✅</span>
            Buat Koneksi
          </span>
        )}
      </button>
      
      {/* Tips */}
      <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <span className="text-lg mt-0.5">💡</span>
          <div>
            <strong>Tips:</strong> Klik ruangan untuk memilih/membatalkan pilihan. 
            <br/>Koneksi berfungsi dua arah untuk pathfinding.
          </div>
        </div>
      </div>
    </form>
  );
};

export default ConnectionForm;