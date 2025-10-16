import React from 'react';
import { connectionsAPI } from '../services/api';

const ConnectionList = ({ connections, onConnectionDeleted }) => {
  const deleteConnection = async (connectionId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus koneksi ini?')) {
      try {
        // ✅ PERBAIKAN: Handle response yang benar
        await connectionsAPI.delete(connectionId);
        onConnectionDeleted();
      } catch (error) {
        console.error('Error deleting connection:', error);
        alert('Error menghapus koneksi: ' + (error.message || 'Unknown error'));
      }
    }
  };

  // ✅ PERBAIKAN: Helper function untuk mendapatkan nama ruangan
  const getRoomName = (connection, roomId, type) => {
    // Coba akses properti yang mungkin ada dari backend
    if (type === 'from' && connection.from_name) return connection.from_name;
    if (type === 'to' && connection.to_name) return connection.to_name;
    
    // Fallback ke room ID
    return `Room ${roomId}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">📋 Daftar Koneksi</h3>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
          {connections.length} koneksi
        </span>
      </div>
      
      {connections.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🔗</div>
          <p className="text-gray-500 mb-2">Belum ada koneksi yang dibuat</p>
          <p className="text-xs text-gray-400">
            Buat koneksi pertama di form sebelah kiri
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
          {connections.map((conn, index) => (
            <div 
              key={conn.id} 
              className="group hover:bg-gray-50 p-4 rounded-lg border border-gray-200 transition-all hover:shadow-md"
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded mr-3 font-mono">
                      #{index + 1}
                    </span>
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded text-sm border border-blue-200">
                        📍 {getRoomName(conn, conn.room_from, 'from')}
                      </span>
                      <span className="text-gray-400 text-lg">↔</span>
                      <span className="font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded text-sm border border-purple-200">
                        🎯 {getRoomName(conn, conn.room_to, 'to')}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 ml-12 space-y-1">
                    <div>Connection ID: <span className="font-mono">{conn.id}</span></div>
                    <div>Room IDs: <span className="font-mono">{conn.room_from}</span> ↔ <span className="font-mono">{conn.room_to}</span></div>
                  </div>
                </div>
                
                <button
                  onClick={() => deleteConnection(conn.id)}
                  className="bg-red-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-600 transition-all opacity-70 group-hover:opacity-100 flex items-center shadow-sm"
                  title="Hapus koneksi"
                >
                  🗑️ 
                  <span className="ml-1 hidden sm:inline">Hapus</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {connections.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            💡 <strong>Info:</strong> Koneksi bersifat dua arah. Setiap koneksi memungkinkan perpindahan dari kedua ruangan ke ruangan lainnya dalam algoritma pathfinding.
          </p>
        </div>
      )}
    </div>
  );
};

export default ConnectionList;