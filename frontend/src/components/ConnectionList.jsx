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
        alert('Error menghapus koneksi: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">📋 Daftar Koneksi</h3>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {connections.length} koneksi
        </span>
      </div>
      
      {connections.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🔗</div>
          <p className="text-gray-500 mb-2">Belum ada koneksi yang dibuat</p>
          <p className="text-xs text-gray-400">
            Koneksi diperlukan untuk menghubungkan ruangan dalam pathfinding
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {connections.map((conn, index) => (
            <div key={conn.id} className="group hover:bg-gray-50 p-3 rounded-lg border border-gray-200 transition-all">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded mr-3">
                      #{index + 1}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded text-sm">
                        📍 {conn.from_name || `Room ID: ${conn.room_from}`}
                      </span>
                      <span className="text-gray-400">⟷</span>
                      <span className="font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded text-sm">
                        🎯 {conn.to_name || `Room ID: ${conn.room_to}`}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-gray-500 ml-12">
                    Connection ID: {conn.id} • Room IDs: {conn.room_from} ↔ {conn.room_to}
                  </div>
                </div>
                
                <button
                  onClick={() => deleteConnection(conn.id)}
                  className="bg-red-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 flex items-center"
                  title="Hapus koneksi"
                >
                  🗑️ <span className="ml-1 hidden sm:inline">Hapus</span>
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