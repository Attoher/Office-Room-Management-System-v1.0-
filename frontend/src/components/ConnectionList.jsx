import React from 'react';
import { connectionsAPI } from '../services/api';

const ConnectionList = ({ connections, onConnectionDeleted }) => {
  const deleteConnection = async (connectionId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus koneksi ini?')) {
      try {
        await connectionsAPI.delete(connectionId);
        onConnectionDeleted();
      } catch (error) {
        console.error('Error deleting connection:', error);
        alert('Error menghapus koneksi: ' + (error.message || 'Unknown error'));
      }
    }
  };

  const getRoomName = (connection, roomId, type) => {
    if (type === 'from' && connection.from_name) return connection.from_name;
    if (type === 'to' && connection.to_name) return connection.to_name;
    return `Room ${roomId}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">📋</span>
          <h3 className="text-lg font-semibold text-gray-800">Daftar Koneksi</h3>
        </div>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
          {connections.length} koneksi
        </span>
      </div>
      
      {connections.length === 0 ? (
        <div className="text-center py-6">
          <div className="text-4xl mb-3">🔗</div>
          <p className="text-gray-500 text-sm mb-1">Belum ada koneksi yang dibuat</p>
          <p className="text-xs text-gray-400">
            Buat koneksi pertama di form sebelah
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {connections.map((conn, index) => (
            <div 
              key={conn.id} 
              className="group hover:bg-gray-50 p-3 rounded-lg border border-gray-200 transition-all hover:shadow-md bg-white"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                {/* Connection Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center mb-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded mr-2 font-mono flex-shrink-0">
                      #{index + 1}
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 min-w-0">
                      <span className="font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs border border-blue-200 truncate max-w-[120px]">
                        📍 {getRoomName(conn, conn.room_from, 'from')}
                      </span>
                      <span className="text-gray-400 text-sm hidden sm:block">↔</span>
                      <span className="text-gray-400 text-sm sm:hidden text-center">↓</span>
                      <span className="font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded text-xs border border-purple-200 truncate max-w-[120px]">
                        🎯 {getRoomName(conn, conn.room_to, 'to')}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 ml-10 space-y-1">
                    <div className="flex flex-wrap items-center space-x-2">
                      <span>ID: <span className="font-mono">{conn.id}</span></span>
                      <span className="hidden sm:inline">•</span>
                      <span>Rooms: <span className="font-mono">{conn.room_from}</span>↔<span className="font-mono">{conn.room_to}</span></span>
                    </div>
                  </div>
                </div>
                
                {/* Delete Button */}
                <button
                  onClick={() => deleteConnection(conn.id)}
                  className="bg-red-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-600 transition-all opacity-70 group-hover:opacity-100 flex items-center justify-center shadow-sm min-h-[40px] sm:w-auto w-full"
                  title="Hapus koneksi"
                >
                  <span className="mr-1">🗑️</span>
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {connections.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <span className="text-lg mt-0.5">💡</span>
            <p className="text-xs text-blue-700">
              <strong>Info:</strong> Koneksi bersifat dua arah. Dapat dilewati dari kedua ruangan dalam pathfinding.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionList;