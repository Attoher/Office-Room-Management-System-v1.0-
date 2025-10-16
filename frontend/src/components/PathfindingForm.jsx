import React, { useState } from 'react';
import GraphVisualization from './GraphVisualization';
import { pathfindingAPI } from '../services/api';

const PathfindingForm = ({ rooms, connections }) => {
  const [asal, setAsal] = useState('');
  const [tujuan, setTujuan] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🔍 Form values:', { asal, tujuan }); // DEBUG
    
    if (!asal || !tujuan) {
      setError('Pilih ruangan asal dan tujuan terlebih dahulu');
      return;
    }
    
    if (asal === tujuan) {
      setError('Ruangan asal dan tujuan tidak boleh sama');
      return;
    }
    
    setLoading(true);
    setResult(null);
    setSelectedRoom(null);
    setError('');
    
    try {
      // ✅ PERBAIKAN: Cari ID ruangan dari nama yang dipilih
      const startRoom = rooms.find(room => room.nama_ruangan === asal);
      const targetRoom = rooms.find(room => room.nama_ruangan === tujuan);
      
      if (!startRoom) {
        throw new Error(`Ruangan asal "${asal}" tidak ditemukan`);
      }
      
      if (!targetRoom) {
        throw new Error(`Ruangan tujuan "${tujuan}" tidak ditemukan`);
      }
      
      console.log('🎯 Sending pathfinding request:', {
        tujuan: targetRoom.nama_ruangan,
        start: startRoom.id // ✅ Gunakan ID, bukan nama
      });
      
      // ✅ PERBAIKAN: Kirim request dengan parameter yang benar
      const response = await pathfindingAPI.findPath(tujuan, startRoom.id);
      
      console.log('✅ Pathfinding response:', response);
      
      // ✅ PERBAIKAN: Handle response data
      const resultData = response.data || response;
      
      if (!resultData) {
        throw new Error('Invalid response from server');
      }
      
      if (resultData.status === 'error') {
        throw new Error(resultData.error || 'Pathfinding failed');
      }
      
      setResult(resultData);
      
      // Auto-select target room for visualization
      setTimeout(() => {
        if (targetRoom) {
          setSelectedRoom(targetRoom);
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ Error finding path:', error);
      setError(error.message || 'Terjadi kesalahan saat mencari jalur');
      setResult({
        status: 'error',
        message: error.message || 'Terjadi kesalahan'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = (room) => {
    setSelectedRoom(room);
  };

  // ✅ PERBAIKAN: Filter available rooms dengan benar
  const getAvailableTujuan = () => 
    rooms.filter(room => room.nama_ruangan !== asal);
  
  const getAvailableAsal = () => 
    rooms.filter(room => room.nama_ruangan !== tujuan);

  const resetForm = () => {
    setAsal('');
    setTujuan('');
    setResult(null);
    setSelectedRoom(null);
    setError('');
  };

  // ✅ PERBAIKAN: Auto-fill form ketika room di-click dari graph
  const handleRoomSelectFromGraph = (room) => {
    if (!asal) {
      setAsal(room.nama_ruangan);
    } else if (!tujuan) {
      setTujuan(room.nama_ruangan);
    } else {
      // Jika kedua field sudah terisi, ganti tujuan
      setTujuan(room.nama_ruangan);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-2xl font-bold mb-2">🧭 Decision Making & Pathfinding</h3>
        <p className="text-gray-600 mb-6">
          Cari jalur optimal untuk tamu dengan algoritma BFS dan analisis occupancy ruangan
        </p>
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            <strong>Error: </strong>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🚀 Ruangan Asal (Start)
              </label>
              <select
                value={asal}
                onChange={(e) => {
                  setAsal(e.target.value);
                  setResult(null);
                  setSelectedRoom(null);
                  setError('');
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
                disabled={loading}
              >
                <option value="">Pilih Ruangan Asal</option>
                {getAvailableAsal().map(room => {
                  const percentage = (room.occupancy / room.kapasitas_max) * 100;
                  return (
                    <option key={room.id} value={room.nama_ruangan}>
                      {room.nama_ruangan} ({room.occupancy}/{room.kapasitas_max} - {percentage.toFixed(1)}%)
                    </option>
                  );
                })}
              </select>
              {asal && (
                <p className="text-xs text-green-600 mt-2 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Start point: <strong className="ml-1">{asal}</strong>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎯 Ruangan Tujuan (Target)
              </label>
              <select
                value={tujuan}
                onChange={(e) => {
                  setTujuan(e.target.value);
                  setResult(null);
                  setSelectedRoom(null);
                  setError('');
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
                disabled={loading}
              >
                <option value="">Pilih Ruangan Tujuan</option>
                {getAvailableTujuan().map(room => {
                  const percentage = (room.occupancy / room.kapasitas_max) * 100;
                  return (
                    <option key={room.id} value={room.nama_ruangan}>
                      {room.nama_ruangan} ({room.occupancy}/{room.kapasitas_max} - {percentage.toFixed(1)}%)
                    </option>
                  );
                })}
              </select>
              {tujuan && (
                <p className="text-xs text-purple-600 mt-2 flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  Target point: <strong className="ml-1">{tujuan}</strong>
                </p>
              )}
            </div>
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="submit"
              disabled={loading || !asal || !tujuan}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all font-medium shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  🔍 Mencari Jalur Optimal...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  🚀 Cari Jalur Optimal
                </span>
              )}
            </button>
            
            <button
              type="button"
              onClick={resetForm}
              disabled={loading}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors font-medium"
            >
              🔄 Reset
            </button>
          </div>

          {asal && tujuan && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-2">
                📍 Rute yang akan dicari:
              </p>
              <div className="flex items-center justify-center space-x-4">
                <div className="text-center">
                  <div className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium text-sm shadow-sm">
                    🚀 {asal}
                  </div>
                </div>
                <div className="text-2xl text-blue-500 animate-pulse">⟶</div>
                <div className="text-center">
                  <div className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg font-medium text-sm shadow-sm">
                    🎯 {tujuan}
                  </div>
                </div>
              </div>
              
              <div className="mt-3 text-xs text-blue-600 text-center">
                💡 Sistem akan mencari jalur menggunakan algoritma BFS dengan analisis occupancy
              </div>
            </div>
          )}
        </form>

        {/* Results Section */}
        {result && (
          <div className={`p-6 rounded-xl border-2 ${
            result.status === 'aman' ? 'bg-green-50 border-green-300' : 
            result.status === 'penuh' ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-300'
          } transition-all duration-300`}>
            <h4 className={`text-xl font-bold mb-4 ${
              result.status === 'aman' ? 'text-green-800' : 
              result.status === 'penuh' ? 'text-red-800' : 'text-gray-800'
            }`}>
              {result.status === 'aman' ? '✅ JALUR OPTIMAL DITEMUKAN' : 
               result.status === 'penuh' ? '❌ JALUR TERHALANG' : '⚠️ HASIL PENCARIAN'}
            </h4>
            
            {result.status === 'aman' && result.jalur_optimal && (
              <div className="space-y-6">
                {/* Optimal Path */}
                <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                  <p className="font-semibold text-green-800 mb-3 text-lg">🏆 JALUR OPTIMAL:</p>
                  <div className="flex items-center justify-center flex-wrap gap-2 mb-3">
                    {result.jalur_optimal.map((room, index) => (
                      <div key={index} className="flex items-center">
                        {index > 0 && (
                          <span className="mx-2 text-gray-400 text-lg font-bold">→</span>
                        )}
                        <span className={`px-3 py-2 rounded-lg text-sm font-bold ${
                          index === 0 ? 'bg-blue-500 text-white shadow-md' :
                          index === result.jalur_optimal.length - 1 ? 'bg-purple-500 text-white shadow-md' :
                          'bg-yellow-500 text-white shadow-md'
                        }`}>
                          {index === 0 ? '🚀' : index === result.jalur_optimal.length - 1 ? '🎯' : `📍${index}`}
                          <span className="ml-2">{room}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>📏 Total {result.jalur_optimal.length - 1} langkah</span>
                    <span>👥 Occupancy tujuan: {result.occupancy_tujuan || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
            
            {result.status === 'penuh' && result.ruangan_penuh && (
              <div className="space-y-4">
                <div className="bg-red-100 p-4 rounded-lg border border-red-300">
                  <p className="font-semibold text-red-800 mb-3">🚫 RUANGAN PENUH DI JALUR:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.ruangan_penuh.map((room, index) => (
                      <span key={index} className="bg-red-200 text-red-800 px-3 py-2 rounded-lg text-sm font-medium border border-red-300">
                        ❌ {room} ({result.occupancy?.[index] || '100%'})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Graph Visualization */}
        <div className="mt-8">
          <GraphVisualization
            rooms={rooms}
            connections={connections}
            pathResult={result}
            startRoom={asal}
            targetRoom={tujuan}
            onNodeClick={handleRoomSelectFromGraph} // ✅ PERBAIKAN: Gunakan handler baru
          />
        </div>
      </div>
    </div>
  );
};

export default PathfindingForm;