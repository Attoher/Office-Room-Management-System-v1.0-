import React, { useState } from 'react';
import StatusIndicator from './StatusIndicator';
import { roomsAPI } from '../services/api';

const RoomList = ({ rooms, onRoomUpdate, onRoomEdit, onRoomDelete }) => {
  const [updatingRooms, setUpdatingRooms] = useState({});

  const updateOccupancy = async (roomId, newOccupancy) => {
    try {
      // ✅ PERBAIKAN: Set loading state untuk room tertentu
      setUpdatingRooms(prev => ({ ...prev, [roomId]: true }));
      
      // ✅ PERBAIKAN: Handle response yang benar
      await roomsAPI.updateOccupancy(roomId, newOccupancy);
      
      // ✅ Refresh data
      onRoomUpdate();
      
    } catch (error) {
      console.error('Error updating occupancy:', error);
      alert('Gagal update occupancy: ' + (error.message || 'Unknown error'));
    } finally {
      // ✅ PERBAIKAN: Clear loading state
      setUpdatingRooms(prev => ({ ...prev, [roomId]: false }));
    }
  };

  // Generate options untuk dropdown (0 sampai max capacity)
  const generateOptions = (maxCapacity) => {
    return Array.from({ length: maxCapacity + 1 }, (_, i) => i);
  };

  if (rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏢</div>
        <p className="text-gray-500 text-lg">Tidak ada ruangan untuk ditampilkan</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {rooms.map(room => {
        const isUpdating = updatingRooms[room.id];
        const percentage = (room.occupancy / room.kapasitas_max) * 100;
        
        return (
          <div 
            key={room.id} 
            className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border-2 ${
              percentage >= 90 ? 'border-red-200' : 
              percentage >= 70 ? 'border-yellow-200' : 'border-green-200'
            } ${isUpdating ? 'opacity-50' : ''}`}
          >
            {/* Loading Overlay */}
            {isUpdating && (
              <div className="absolute inset-0 bg-white bg-opacity-70 rounded-xl flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}

            {/* Header dengan action buttons */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 truncate" title={room.nama_ruangan}>
                {room.nama_ruangan}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => onRoomEdit(room)}
                  disabled={isUpdating}
                  className="text-blue-500 hover:text-blue-700 p-1 transition-colors disabled:opacity-50"
                  title="Edit ruangan"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => onRoomDelete(room.id)}
                  disabled={isUpdating}
                  className="text-red-500 hover:text-red-700 p-1 transition-colors disabled:opacity-50"
                  title="Hapus ruangan"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Status Indicator */}
            <div className="flex justify-between items-center mb-3">
              <StatusIndicator 
                occupancy={room.occupancy} 
                maxCapacity={room.kapasitas_max} 
              />
            </div>
            
            {/* Room Details */}
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex justify-between">
                <span>Luas:</span>
                <span className="font-medium">{room.luas} m²</span>
              </div>
              <div className="flex justify-between">
                <span>Kapasitas Maks:</span>
                <span className="font-medium">{room.kapasitas_max} orang</span>
              </div>
              <div className="flex justify-between">
                <span>Occupancy Saat Ini:</span>
                <span className="font-medium">{room.occupancy} orang</span>
              </div>
              <div className="flex justify-between">
                <span>Persentase:</span>
                <span className={`font-medium ${
                  percentage >= 90 ? 'text-red-600' : 
                  percentage >= 70 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {percentage.toFixed(1)}%
                </span>
              </div>
            </div>
            
            {/* Occupancy Controls */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ubah Jumlah Orang:
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => updateOccupancy(room.id, Math.max(0, room.occupancy - 1))}
                  disabled={room.occupancy === 0 || isUpdating}
                  className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md"
                  title="Kurangi 1 orang"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                
                <select
                  value={room.occupancy}
                  onChange={(e) => updateOccupancy(room.id, parseInt(e.target.value))}
                  disabled={isUpdating}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                >
                  {generateOptions(room.kapasitas_max).map(number => (
                    <option key={number} value={number}>
                      {number} orang
                    </option>
                  ))}
                </select>
                
                <button
                  onClick={() => updateOccupancy(room.id, Math.min(room.kapasitas_max, room.occupancy + 1))}
                  disabled={room.occupancy === room.kapasitas_max || isUpdating}
                  className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md"
                  title="Tambah 1 orang"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              
              {/* Quick actions */}
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={() => updateOccupancy(room.id, 0)}
                  disabled={room.occupancy === 0 || isUpdating}
                  className="flex-1 bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Kosongkan
                </button>
                <button
                  onClick={() => updateOccupancy(room.id, room.kapasitas_max)}
                  disabled={room.occupancy === room.kapasitas_max || isUpdating}
                  className="flex-1 bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Penuhi
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RoomList;