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
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Daftar Koneksi</h3>
      
      {connections.length === 0 ? (
        <p className="text-gray-500">Belum ada koneksi yang dibuat</p>
      ) : (
        <div className="space-y-2">
          {connections.map(conn => (
            <div key={conn.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
              <span>
                <strong>{conn.from_name}</strong> ↔ <strong>{conn.to_name}</strong>
              </span>
              <button
                onClick={() => deleteConnection(conn.id)}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConnectionList;