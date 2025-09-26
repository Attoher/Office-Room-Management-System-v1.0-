import React, { useState } from 'react';
import { pathfindingAPI } from '../services/api';

const PathfindingForm = ({ rooms }) => {
  const [tujuan, setTujuan] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    
    try {
      const response = await pathfindingAPI.findPath(tujuan);
      setResult(response.data);
    } catch (error) {
      console.error('Error finding path:', error);
      setResult({
        status: 'error',
        message: error.response?.data?.error || 'Terjadi kesalahan'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Cek Jalur untuk Tamu</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Ruangan Tujuan</label>
          <select
            value={tujuan}
            onChange={(e) => setTujuan(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            required
          >
            <option value="">Pilih Ruangan Tujuan</option>
            {rooms.map(room => (
              <option key={room.id} value={room.nama_ruangan}>{room.nama_ruangan}</option>
            ))}
          </select>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Mencari Jalur...' : 'Cek Jalur'}
        </button>
      </form>
      
      {result && (
        <div className={`p-4 rounded border ${
          result.status === 'aman' ? 'room-status-hijau' : 
          result.status === 'penuh' ? 'room-status-merah' : 'bg-gray-100 border-gray-300'
        }`}>
          <h4 className="font-semibold mb-2">Hasil Pencarian Jalur:</h4>
          <p className="mb-3">{result.message}</p>
          
          {result.status === 'aman' && (
            <div>
              <p><strong>Jalur Optimal:</strong> {result.jalur_optimal.join(' → ')}</p>
              <p><strong>Occupancy Tujuan:</strong> {result.occupancy_tujuan}</p>
              
              {result.detail_path && (
                <div className="mt-3">
                  <p className="font-semibold">Detail Jalur:</p>
                  <ul className="space-y-1 mt-1">
                    {result.detail_path.map((room, index) => (
                      <li key={index} className="flex justify-between">
                        <span>{room.nama}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          room.status === 'hijau' ? 'bg-green-100 text-green-800' :
                          room.status === 'kuning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {room.occupancy} ({room.status})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {result.status === 'penuh' && (
            <div>
              {result.ruangan_penuh && (
                <p><strong>Ruangan Penuh:</strong> {result.ruangan_penuh.join(', ')}</p>
              )}
              <p><strong>Occupancy:</strong> {result.occupancy}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PathfindingForm;