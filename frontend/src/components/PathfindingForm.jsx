import React, { useState } from 'react';
import GraphVisualization from './GraphVisualization';
import { pathfindingAPI } from '../services/api';

const PathfindingForm = ({ rooms, connections }) => {
  const [asal, setAsal] = useState('');
  const [tujuan, setTujuan] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!asal || !tujuan) {
      alert('Pilih ruangan asal dan tujuan terlebih dahulu');
      return;
    }
    
    if (asal === tujuan) {
      alert('Ruangan asal dan tujuan tidak boleh sama');
      return;
    }
    
    setLoading(true);
    setResult(null);
    setSelectedRoom(null);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const response = await pathfindingAPI.findPath(asal, tujuan);
      
      if (!response.data) {
        throw new Error('Invalid response from server');
      }
      
      if (!response.data.jalur_optimal || !Array.isArray(response.data.jalur_optimal)) {
        throw new Error('Invalid path data from server');
      }
      
      const freshResult = { ...response.data };
      setResult(freshResult);
      
      setTimeout(() => {
        const targetRoom = rooms.find(
          r => r.nama_ruangan.trim().toLowerCase() === response.data.ruangan_tujuan.trim().toLowerCase()
        );
        if (targetRoom) {
          setSelectedRoom(targetRoom);
        }
      }, 500);
      
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

  const handleNodeClick = (room) => {
    setSelectedRoom(room);
  };

  const getAvailableTujuan = () => 
    rooms.filter(room => room.nama_ruangan.trim().toLowerCase() !== asal.trim().toLowerCase());
  const getAvailableAsal = () => 
    rooms.filter(room => room.nama_ruangan.trim().toLowerCase() !== tujuan.trim().toLowerCase());

  const resetForm = () => {
    setAsal('');
    setTujuan('');
    setResult(null);
    setSelectedRoom(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Cek Jalur untuk Tamu</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ruangan Asal (Start)
              </label>
              <select
                value={asal}
                onChange={(e) => {
                  setAsal(e.target.value);
                  setResult(null);
                  setSelectedRoom(null);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Pilih Ruangan Asal</option>
                {getAvailableAsal().map(room => (
                  <option key={room.id} value={room.nama_ruangan}>
                    {room.nama_ruangan} ({room.occupancy}/{room.kapasitas_max})
                  </option>
                ))}
              </select>
              {asal && (
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  Start point: {asal}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ruangan Tujuan (Target)
              </label>
              <select
                value={tujuan}
                onChange={(e) => {
                  setTujuan(e.target.value);
                  setResult(null);
                  setSelectedRoom(null);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Pilih Ruangan Tujuan</option>
                {getAvailableTujuan().map(room => (
                  <option key={room.id} value={room.nama_ruangan}>
                    {room.nama_ruangan} ({room.occupancy}/{room.kapasitas_max})
                  </option>
                ))}
              </select>
              {tujuan && (
                <p className="text-xs text-purple-600 mt-1 flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-1"></span>
                  Target point: {tujuan}
                </p>
              )}
            </div>
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="submit"
              disabled={loading || !asal || !tujuan}
              className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-all font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Mencari Jalur...
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
              className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              🔄 Reset
            </button>
          </div>

          {asal && tujuan && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">
                Rute yang akan dicari:
              </p>
              <div className="flex items-center mt-1">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">🚀 {asal}</span>
                <span className="mx-2 text-blue-400">→</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">🎯 {tujuan}</span>
              </div>
              
              {/* Show all possible routes preview */}
              <div className="mt-2 text-xs text-blue-600">
                💡 Sistem akan mencari semua kemungkinan rute dan memberikan rekomendasi optimal berdasarkan occupancy dan jarak
              </div>
            </div>
          )}
        </form>

        {result && (
          <div className={`p-4 rounded-lg border ${
            result.status === 'aman' ? 'bg-green-50 border-green-200' : 
            result.status === 'penuh' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
          }`}>
            <h4 className={`font-semibold mb-2 ${
              result.status === 'aman' ? 'text-green-800' : 
              result.status === 'penuh' ? 'text-red-800' : 'text-gray-800'
            }`}>
              {result.status === 'aman' ? '✅ Jalur Ditemukan' : 
               result.status === 'penuh' ? '❌ Jalur Terhalang' : '⚠️ Hasil'}
            </h4>
            
            {result.status === 'aman' && result.jalur_optimal && (
              <div className="space-y-4">
                {/* Optimal Path */}
                <div>
                  <p className="font-medium text-green-800 mb-2">🏆 Jalur Optimal (Rekomendasi):</p>
                  <div className="flex items-center flex-wrap gap-1 mb-2">
                    {result.jalur_optimal.map((room, index) => (
                      <div key={index} className="flex items-center">
                        {index > 0 && <span className="mx-1 text-gray-400">→</span>}
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          index === 0 ? 'bg-blue-100 text-blue-800' :
                          index === result.jalur_optimal.length - 1 ? 'bg-purple-100 text-purple-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {room}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    Total {result.jalur_optimal.length - 1} langkah • Occupancy tujuan: {result.occupancy_tujuan}
                  </p>
                </div>

                {/* All Possible Routes */}
                {result.semua_kemungkinan_rute && result.semua_kemungkinan_rute.length > 1 && (
                  <div className="border-t pt-4">
                    <p className="font-medium text-gray-800 mb-3">
                      🗺️ Semua Kemungkinan Rute ({result.semua_kemungkinan_rute.length}):
                    </p>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {result.semua_kemungkinan_rute.map((route, index) => (
                        <div key={index} className={`p-3 rounded-lg border-2 ${
                          route.is_optimal 
                            ? 'bg-green-50 border-green-300' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center">
                              <span className={`px-2 py-1 rounded text-xs font-bold mr-2 ${
                                route.is_optimal 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-gray-400 text-white'
                              }`}>
                                {route.is_optimal ? '🏆 OPTIMAL' : `Opsi ${index + 1}`}
                              </span>
                              <span className="text-sm font-medium">
                                {route.langkah} langkah
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-600">Efisiensi vs Optimal:</div>
                              <div className={`text-sm font-bold ${
                                parseFloat(route.perbandingan_dengan_optimal) >= 90 
                                  ? 'text-green-600' 
                                  : parseFloat(route.perbandingan_dengan_optimal) >= 70
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                              }`}>
                                {route.perbandingan_dengan_optimal}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center flex-wrap gap-1 mb-2">
                            {route.rute.map((room, roomIndex) => (
                              <div key={roomIndex} className="flex items-center">
                                {roomIndex > 0 && <span className="mx-1 text-gray-400 text-xs">→</span>}
                                <span className={`px-2 py-1 rounded text-xs ${
                                  roomIndex === 0 ? 'bg-blue-100 text-blue-700' :
                                  roomIndex === route.rute.length - 1 ? 'bg-purple-100 text-purple-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {room}
                                </span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Avg Occupancy: {route.avg_occupancy}</span>
                            <span>Score: {route.efisiensi_score}/100</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                      <strong>💡 Penjelasan:</strong> Jalur optimal dipilih berdasarkan kombinasi jarak terpendek (40%) 
                      dan tingkat occupancy terendah (60%). Semakin tinggi score efisiensi, semakin baik rute tersebut.
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {result.status === 'penuh' && result.ruangan_penuh && (
              <div className="space-y-3">
                <div>
                  <p className="font-medium">Ruangan Penuh di Jalur:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {result.ruangan_penuh.map((room, index) => (
                      <span key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                        {room} ({result.occupancy[index]})
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Show alternative routes even when blocked */}
                {result.semua_kemungkinan_rute && result.semua_kemungkinan_rute.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="font-medium text-gray-700 mb-2">
                      🔄 Rute Alternatif (Tunggu sampai ruangan kosong):
                    </p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {result.semua_kemungkinan_rute.slice(0, 3).map((route, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          <span className="font-medium">Opsi {index + 1}:</span> {route.rute.join(' → ')} 
                          <span className="text-xs ml-2">({route.langkah} langkah)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <GraphVisualization
          rooms={rooms}
          connections={connections}
          pathResult={result}
          startRoom={asal}
          targetRoom={tujuan}
          onNodeClick={handleNodeClick}
        />
      </div>
    </div>
  );
};

export default PathfindingForm;