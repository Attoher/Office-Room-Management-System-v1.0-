import React, { useState, useEffect } from 'react';
import RoomForm from './components/RoomForm';
import RoomList from './components/RoomList';
import ConnectionForm from './components/ConnectionForm';
import ConnectionList from './components/ConnectionList';
import PathfindingForm from './components/PathfindingForm';
import RoomEditModal from './components/RoomEditModal';
import { roomsAPI, connectionsAPI } from './services/api';

function App() {
  const [activeTab, setActiveTab] = useState('monitoring');
  const [rooms, setRooms] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [editingRoom, setEditingRoom] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Test koneksi backend
  const testBackendConnection = async () => {
    try {
      setConnectionStatus('checking');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      
      const response = await fetch(`${apiUrl}/health`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      setConnectionStatus('connected');
      return true;
    } catch (error) {
      setConnectionStatus('failed');
      return false;
    }
  };

  // Fetch data dengan better loading handling
  const fetchData = async (retryCount = 0) => {
    try {
      setError('');
      setLoading(true);
      
      const isConnected = await testBackendConnection();
      if (!isConnected) {
        throw new Error('Tidak dapat terhubung ke server backend');
      }

      const [roomsResponse, connectionsResponse] = await Promise.all([
        roomsAPI.getAll(),
        connectionsAPI.getAll()
      ]);
      
      setRooms(roomsResponse.data);
      setConnections(connectionsResponse.data);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      
      if (retryCount < 2) {
        setTimeout(() => fetchData(retryCount + 1), 1000);
        return;
      }
      
      setError('Gagal memuat data. Pastikan backend server berjalan di port 3000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // CRUD Handlers
  const handleRoomAdded = () => {
    fetchData();
  };

  const handleRoomEdit = (room) => {
    setEditingRoom(room);
    setIsEditModalOpen(true);
  };

  const handleRoomUpdate = () => {
    setIsEditModalOpen(false);
    setEditingRoom(null);
    fetchData();
  };

  const handleRoomDelete = async (roomId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus ruangan ini? Semua koneksi yang terkait juga akan dihapus.')) {
      try {
        await roomsAPI.delete(roomId);
        fetchData();
      } catch (error) {
        console.error('Error deleting room:', error);
        alert('Gagal menghapus ruangan: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleConnectionAdded = () => {
    fetchData();
  };

  const handleConnectionDeleted = () => {
    fetchData();
  };

  // Tab configuration
  const tabs = [
    { id: 'monitoring', name: 'Monitoring Ruangan', icon: '📊' },
    { id: 'management', name: 'Manajemen Data', icon: '⚙️' },
    { id: 'pathfinding', name: 'Cek Jalur Tamu', icon: '🧭' }
  ];

  // Connection status component
  const ConnectionStatus = () => {
    const statusConfig = {
      checking: { color: 'text-yellow-600', bg: 'bg-yellow-100', text: 'Checking connection...' },
      connected: { color: 'text-green-600', bg: 'bg-green-100', text: 'Connected to backend' },
      failed: { color: 'text-red-600', bg: 'bg-red-100', text: 'Backend disconnected' }
    };
    
    const config = statusConfig[connectionStatus];
    
    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.color}`}>
        <div className={`w-2 h-2 rounded-full mr-2 ${
          connectionStatus === 'checking' ? 'bg-yellow-500 animate-pulse' :
          connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
        }`}></div>
        {config.text}
      </div>
    );
  };

  // Loading component dengan skeleton screen
  const LoadingScreen = () => (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin"></div>
          <div className="w-20 h-20 border-4 border-blue-500 rounded-full animate-ping absolute top-0 left-0"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mt-4">Office Room Management</h2>
        <p className="text-gray-600 mt-2">Menyiapkan sistem...</p>
        <ConnectionStatus />
      </div>
    </div>
  );

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <h1 className="text-3xl font-bold">Office Room Management</h1>
              <p className="text-blue-200">v1.0 - Sistem Manajemen Occupancy & Decision Making</p>
            </div>
            <div className="flex items-center space-x-4">
              <ConnectionStatus />
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center ${
                      activeTab === tab.id
                        ? 'bg-white text-blue-600 shadow-md'
                        : 'bg-blue-500 text-white hover:bg-blue-400'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="container mx-auto px-4 mt-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <strong>Error: </strong>
                {error}
              </div>
              <button 
                onClick={fetchData}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
              >
                🔄 Coba Lagi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Monitoring Tab */}
          {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Main Monitoring Content - 3/4 width */}
              <div className="xl:col-span-3">
                <div className="bg-white rounded-xl shadow-lg p-6 h-full">
                  <h2 className="text-2xl font-bold mb-2">Monitoring Status Ruangan</h2>
                  <p className="text-gray-600 mb-6">
                    Pantau occupancy ruangan secara real-time. Status warna: 
                    <span className="inline-flex items-center ml-2 space-x-2">
                      <span className="flex items-center">
                        <span className="w-3 h-3 bg-green-500 rounded-full mr-1"></span>
                        <span className="text-sm">Hijau (&lt;70%)</span>
                      </span>
                      <span className="flex items-center">
                        <span className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></span>
                        <span className="text-sm">Kuning (70-90%)</span>
                      </span>
                      <span className="flex items-center">
                        <span className="w-3 h-3 bg-red-500 rounded-full mr-1"></span>
                        <span className="text-sm">Merah (≥90%)</span>
                      </span>
                    </span>
                  </p>
                  
                  {rooms.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🏢</div>
                      <p className="text-gray-500 text-lg mb-4">Belum ada ruangan yang ditambahkan</p>
                      <button 
                        onClick={() => setActiveTab('management')}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
                      >
                        Tambah Ruangan Pertama
                      </button>
                    </div>
                  ) : (
                    <RoomList 
                      rooms={rooms} 
                      onRoomUpdate={fetchData}
                      onRoomEdit={handleRoomEdit}
                      onRoomDelete={handleRoomDelete}
                    />
                  )}
                </div>
              </div>

              {/* Statistics Sidebar - 1/4 width */}
              <div className="xl:col-span-1">
                <div className="bg-white rounded-xl shadow-lg p-6 h-full">
                  <h3 className="text-lg font-bold mb-4 text-gray-800">Statistics</h3>
                  
                  {rooms.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">📊</div>
                      <p className="text-sm">Data statistics akan muncul setelah ruangan ditambahkan</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Total Rooms */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-blue-600">{rooms.length}</p>
                            <p className="text-sm text-blue-800 font-medium">Total Ruangan</p>
                          </div>
                          <div className="text-2xl text-blue-500">🏢</div>
                        </div>
                      </div>

                      {/* Average Occupancy */}
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-green-600">
                              {((rooms.reduce((sum, room) => sum + (room.occupancy / room.kapasitas_max), 0) / rooms.length) * 100).toFixed(1)}%
                            </p>
                            <p className="text-sm text-green-800 font-medium">Avg Occupancy</p>
                          </div>
                          <div className="text-2xl text-green-500">👥</div>
                        </div>
                      </div>

                      {/* Total Connections */}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-purple-600">{connections.length}</p>
                            <p className="text-sm text-purple-800 font-medium">Total Koneksi</p>
                          </div>
                          <div className="text-2xl text-purple-500">🔗</div>
                        </div>
                      </div>

                      {/* Status Breakdown */}
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-800 mb-3">Status Breakdown</h4>
                        <div className="space-y-2">
                          {(() => {
                            const statusCount = {
                              hijau: rooms.filter(r => (r.occupancy / r.kapasitas_max) * 100 < 70).length,
                              kuning: rooms.filter(r => {
                                const percent = (r.occupancy / r.kapasitas_max) * 100;
                                return percent >= 70 && percent < 90;
                              }).length,
                              merah: rooms.filter(r => (r.occupancy / r.kapasitas_max) * 100 >= 90).length
                            };

                            return (
                              <>
                                <div className="flex justify-between items-center">
                                  <span className="flex items-center text-sm">
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Hijau
                                  </span>
                                  <span className="font-semibold">{statusCount.hijau}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="flex items-center text-sm">
                                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                                    Kuning
                                  </span>
                                  <span className="font-semibold">{statusCount.kuning}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="flex items-center text-sm">
                                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                    Merah
                                  </span>
                                  <span className="font-semibold">{statusCount.merah}</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                        <h4 className="font-semibold text-orange-800 mb-3">Quick Actions</h4>
                        <div className="space-y-2">
                          <button 
                            onClick={() => {
                              // Reset all occupancies to 0
                              if (window.confirm('Reset semua occupancy ke 0?')) {
                                rooms.forEach(async room => {
                                  try {
                                    await roomsAPI.updateOccupancy(room.id, 0);
                                  } catch (error) {
                                    console.error('Error resetting room:', error);
                                  }
                                });
                                setTimeout(fetchData, 500);
                              }
                            }}
                            className="w-full bg-orange-500 text-white py-2 rounded text-sm hover:bg-orange-600 transition-colors"
                          >
                            Reset All to 0
                          </button>
                          <button 
                            onClick={() => setActiveTab('pathfinding')}
                            className="w-full bg-blue-500 text-white py-2 rounded text-sm hover:bg-blue-600 transition-colors"
                          >
                            Cek Jalur Tamu
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Management Tab */}
        {activeTab === 'management' && (
          <div className="space-y-8">
            {/* Room Management Section */}
            <section className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Manajemen Ruangan</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <RoomForm onRoomAdded={handleRoomAdded} />
                <div>
                  <h3 className="text-lg font-semibold mb-4">Daftar Ruangan ({rooms.length})</h3>
                  {rooms.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">📝</div>
                      <p>Belum ada ruangan yang ditambahkan</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {rooms.map(room => (
                        <RoomItem 
                          key={room.id} 
                          room={room} 
                          onEdit={handleRoomEdit}
                          onDelete={handleRoomDelete}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Connection Management Section */}
            <section className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Manajemen Koneksi</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ConnectionForm 
                  rooms={rooms} 
                  onConnectionAdded={handleConnectionAdded} 
                />
                <ConnectionList 
                  connections={connections} 
                  onConnectionDeleted={handleConnectionDeleted} 
                />
              </div>
            </section>
          </div>
        )}

        {/* Pathfinding Tab */}
        {activeTab === 'pathfinding' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-2">Decision Making & Pathfinding</h2>
              <p className="text-gray-600 mb-6">
                Cek ketersediaan jalur untuk tamu dengan algoritma BFS
              </p>
              
              {rooms.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🚧</div>
                  <p className="text-gray-500 text-lg mb-4">Belum ada ruangan yang ditambahkan</p>
                  <button 
                    onClick={() => setActiveTab('management')}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
                  >
                    Tambah Ruangan Pertama
                  </button>
                </div>
              ) : connections.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔗</div>
                  <p className="text-gray-500 text-lg mb-4">Belum ada koneksi antar ruangan</p>
                  <button 
                    onClick={() => setActiveTab('management')}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
                  >
                    Tambah Koneksi
                  </button>
                </div>
              ) : (
                <PathfindingForm rooms={rooms} />
              )}
            </div>

            {/* Graph Visualization */}
            {connections.length > 0 && rooms.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Visualisasi Koneksi Ruangan</h3>
                <div className="flex flex-wrap gap-6 justify-center p-4">
                  {rooms.map(room => (
                    <RoomNode key={room.id} room={room} connections={connections} />
                  ))}
                </div>
              </div>
            )}
            {/* Statistics */}
            {rooms.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-transform">
                  <div className="text-4xl mb-3">🏢</div>
                  <h3 className="font-semibold text-gray-600">Total Ruangan</h3>
                  <p className="text-4xl font-bold text-blue-600 mt-2">{rooms.length}</p>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-transform">
                  <div className="text-4xl mb-3">👥</div>
                  <h3 className="font-semibold text-gray-600">Rata-rata Occupancy</h3>
                  <p className="text-4xl font-bold text-green-600 mt-2">
                    {((rooms.reduce((sum, room) => sum + (room.occupancy / room.kapasitas_max), 0) / rooms.length) * 100).toFixed(1)}%
                  </p>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-transform">
                  <div className="text-4xl mb-3">🔗</div>
                  <h3 className="font-semibold text-gray-600">Total Koneksi</h3>
                  <p className="text-4xl font-bold text-purple-600 mt-2">{connections.length}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Edit Room Modal */}
      {isEditModalOpen && (
        <RoomEditModal
          room={editingRoom}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingRoom(null);
          }}
          onUpdate={handleRoomUpdate}
        />
      )}

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            Office Room Management System v1.0 &copy; 2025. Developed by ATHA ITS.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Room Item Component untuk management tab
const RoomItem = ({ room, onEdit, onDelete }) => {
  const percentage = (room.occupancy / room.kapasitas_max) * 100;
  let statusColor = 'bg-green-100 text-green-800';
  if (percentage >= 90) statusColor = 'bg-red-100 text-red-800';
  else if (percentage >= 70) statusColor = 'bg-yellow-100 text-yellow-800';

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all group">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-lg group-hover:text-blue-600 transition-colors">
          {room.nama_ruangan}
        </span>
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
          {percentage.toFixed(1)}%
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
        <span>Luas: {room.luas} m²</span>
        <span>Kapasitas: {room.kapasitas_max}</span>
        <span>Occupancy: {room.occupancy}</span>
        <span>ID: {room.id}</span>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => onEdit(room)}
          className="flex-1 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
        >
          ✏️ Edit
        </button>
        <button
          onClick={() => onDelete(room.id)}
          className="flex-1 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
        >
          🗑️ Hapus
        </button>
      </div>
    </div>
  );
};

// Room Node Component untuk visualisasi
const RoomNode = ({ room, connections }) => {
  const roomConnections = connections.filter(
    conn => conn.room_from === room.id || conn.room_to === room.id
  );
  const percentage = (room.occupancy / room.kapasitas_max) * 100;
  
  let statusColor = 'bg-green-500';
  if (percentage >= 90) statusColor = 'bg-red-500';
  else if (percentage >= 70) statusColor = 'bg-yellow-500';
  
  return (
    <div className="text-center group relative">
      <div 
        className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg transition-all group-hover:scale-110 ${statusColor}`}
        title={`${room.nama_ruangan} - ${percentage.toFixed(1)}% occupied`}
      >
        {room.nama_ruangan.split(' ').map(word => word[0]).join('').toUpperCase()}
      </div>
      <p className="text-sm font-medium mt-2 max-w-[100px] truncate">{room.nama_ruangan}</p>
      <p className="text-xs text-gray-500">{room.occupancy}/{room.kapasitas_max}</p>
      <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
        {roomConnections.length}
      </div>
    </div>
  );
};

export default App;