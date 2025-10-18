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
    
    console.log('🔍 Form values:', { asal, tujuan });
    
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
        start: startRoom.id
      });
      
      // FIXED: Langsung menggunakan response yang sudah dinormalisasi
      const resultData = await pathfindingAPI.findPath(tujuan, startRoom.id);
      
      console.log('✅ Pathfinding response:', resultData);
      
      if (!resultData) {
        throw new Error('Invalid response from server');
      }
      
      if (resultData.status === 'error') {
        throw new Error(resultData.error || 'Pathfinding failed');
      }
      
      setResult(resultData);
      
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

  const handleRoomSelectFromGraph = (room) => {
    if (!asal) {
      setAsal(room.nama_ruangan);
    } else if (!tujuan) {
      setTujuan(room.nama_ruangan);
    } else {
      setTujuan(room.nama_ruangan);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Decision Making & Pathfinding</h3>
            <p className="text-gray-600 text-sm mt-1">
              Cari jalur optimal dengan algoritma BFS dan analisis occupancy
            </p>
          </div>
          <span className="text-3xl">🧭</span>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm">
            <div className="flex items-center">
              <span className="text-lg mr-2">❌</span>
              <div>
                <strong>Error: </strong>
                {error}
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="grid grid-cols-1 gap-4">
            {/* Asal Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🚀 Ruangan Asal
              </label>
              <select
                value={asal}
                onChange={(e) => {
                  setAsal(e.target.value);
                  setResult(null);
                  setSelectedRoom(null);
                  setError('');
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
                  Start: <strong className="ml-1">{asal}</strong>
                </p>
              )}
            </div>

            {/* Tujuan Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎯 Ruangan Tujuan
              </label>
              <select
                value={tujuan}
                onChange={(e) => {
                  setTujuan(e.target.value);
                  setResult(null);
                  setSelectedRoom(null);
                  setError('');
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
                  Target: <strong className="ml-1">{tujuan}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
            <button
              type="submit"
              disabled={loading || !asal || !tujuan}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-4 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all font-medium shadow-md text-base min-h-[52px] flex items-center justify-center"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Mencari Jalur...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <span className="text-lg mr-2">🚀</span>
                  Cari Jalur Optimal
                </span>
              )}
            </button>
            
            <button
              type="button"
              onClick={resetForm}
              disabled={loading}
              className="px-4 py-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors font-medium text-base min-h-[52px] flex items-center justify-center"
            >
              <span className="flex items-center justify-center">
                <span className="text-lg mr-2">🔄</span>
                Reset
              </span>
            </button>
          </div>

          {/* Route Preview */}
          {asal && tujuan && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-2 text-center">
                📍 Rute yang akan dicari:
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="text-center">
                  <div className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium text-sm shadow-sm max-w-[140px] truncate">
                    🚀 {asal}
                  </div>
                </div>
                <div className="text-xl text-blue-500 animate-pulse">⟶</div>
                <div className="text-center">
                  <div className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg font-medium text-sm shadow-sm max-w-[140px] truncate">
                    🎯 {tujuan}
                  </div>
                </div>
              </div>
              
              <div className="mt-2 text-xs text-blue-600 text-center">
                💡 Sistem akan mencari jalur menggunakan algoritma BFS
              </div>
            </div>
          )}
        </form>

        {/* Results Section */}
        {result && (
          <div className={`p-4 rounded-xl border-2 ${
            result.status === 'aman' ? 'bg-green-50 border-green-300' : 
            result.status === 'penuh' ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-300'
          } transition-all duration-300`}>
            <div className="flex items-center mb-4">
              <span className={`text-2xl mr-2 ${
                result.status === 'aman' ? 'text-green-600' : 
                result.status === 'penuh' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {result.status === 'aman' ? '✅' : 
                result.status === 'penuh' ? '❌' : '⚠️'}
              </span>
              <h4 className={`text-lg font-bold ${
                result.status === 'aman' ? 'text-green-800' : 
                result.status === 'penuh' ? 'text-red-800' : 'text-gray-800'
              }`}>
                {result.status === 'aman' ? 'JALUR OPTIMAL DITEMUKAN' : 
                result.status === 'penuh' ? 'JALUR TERHALANG' : 'HASIL PENCARIAN'}
              </h4>
            </div>
            
            {result.status === 'aman' && result.jalur_optimal && (
              <div className="space-y-4">
                {/* Optimal Path */}
                <div className="bg-white p-3 rounded-lg border border-green-200 shadow-sm">
                  <p className="font-semibold text-green-800 mb-3 text-sm">🏆 JALUR OPTIMAL:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {result.jalur_optimal.map((room, index) => (
                      <div key={index} className="flex items-center">
                        <span className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center min-w-[120px] ${
                          index === 0 ? 'bg-blue-500 text-white shadow-md' :
                          index === result.jalur_optimal.length - 1 ? 'bg-purple-500 text-white shadow-md' :
                          'bg-yellow-500 text-white shadow-md'
                        }`}>
                          <span className="mr-2">
                            {index === 0 ? '🚀' : index === result.jalur_optimal.length - 1 ? '🎯' : `📍`}
                          </span>
                          <span className="truncate">{room}</span>
                        </span>
                        {index < result.jalur_optimal.length - 1 && (
                          <span className="mx-2 text-gray-400 text-sm font-bold">→</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center text-xs text-gray-600 mt-3 space-y-1 sm:space-y-0">
                    <span>📏 {result.jalur_optimal.length - 1} langkah</span>
                    <span>👥 Occupancy: {result.occupancy_tujuan || 'N/A'}</span>
                  </div>
                </div>

                {/* All Possible Routes - NEW: Tampilkan semua kemungkinan rute */}
                {result.semua_kemungkinan_rute && result.semua_kemungkinan_rute.length > 1 && (
                  <div className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm">
                    <p className="font-semibold text-blue-800 mb-3 text-sm">📊 SEMUA KEMUNGKINAN RUTE:</p>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {result.semua_kemungkinan_rute.map((route, index) => (
                        <div key={index} className={`p-2 rounded-lg border ${
                          route.is_optimal ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">
                              Rute {index + 1} {route.is_optimal && '🏆'}
                            </span>
                            <div className="text-xs text-gray-600 space-x-2">
                              <span>Skor: {route.efisiensi_score || 0}</span>
                              <span>Langkah: {route.langkah || 0}</span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 flex items-center space-x-1 truncate">
                            <span>{route.rute?.join(' → ')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {result.status === 'penuh' && result.ruangan_penuh && (
              <div className="space-y-3">
                <div className="bg-red-100 p-3 rounded-lg border border-red-300">
                  <p className="font-semibold text-red-800 mb-2 text-sm">🚫 RUANGAN PENUH DI JALUR:</p>
                  <div className="flex flex-col space-y-2">
                    {result.ruangan_penuh.map((room, index) => (
                      <div key={index} className="bg-red-200 text-red-800 px-3 py-2 rounded-lg text-sm font-medium border border-red-300 flex items-center">
                        <span className="mr-2">❌</span>
                        <span className="truncate">{room}</span>
                        <span className="ml-2 text-xs opacity-75">
                          ({result.occupancy?.[index] || '100%'})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Tips */}
        <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <span className="text-lg mt-0.5">💡</span>
            <div className="text-xs text-gray-600">
              <strong>Tips:</strong> Pilih ruangan asal dan tujuan, atau klik langsung pada visualisasi graph untuk memilih ruangan dengan cepat.
            </div>
          </div>
        </div>
      </div>

      {/* Graph Visualization */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Visualisasi Graph</h3>
          <span className="text-2xl">📊</span>
        </div>
        <GraphVisualization
          rooms={rooms}
          connections={connections}
          pathResult={result}
          startRoom={asal}
          targetRoom={tujuan}
          onNodeClick={handleRoomSelectFromGraph}
        />
      </div>
    </div>
  );
};

export default PathfindingForm;