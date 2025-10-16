import pool from '../db.js';

// Helper function untuk standardized response
const sendSuccess = (res, data, message = 'Success') => {
  res.json(data); // Frontend mengharapkan response langsung, tanpa wrapper
};

const sendError = (res, error, statusCode = 500) => {
  console.error('❌ Pathfinding Controller Error:', error);
  res.status(statusCode).json({ 
    error: error.message || 'Pathfinding failed'
  });
};

/**
 * Enhanced BFS untuk mencari semua kemungkinan rute
 */
const findAllPaths = (graph, startId, targetId, maxPaths = 10) => {
  const queue = [{ id: startId, path: [startId], visited: new Set([startId]) }];
  const allPaths = [];
  
  while (queue.length > 0 && allPaths.length < maxPaths) {
    const { id, path, visited } = queue.shift();
    
    if (id === targetId) {
      allPaths.push(path);
      continue;
    }
    
    for (const neighbor of graph[id] || []) {
      if (!visited.has(neighbor)) {
        const newVisited = new Set(visited);
        newVisited.add(neighbor);
        queue.push({ 
          id: neighbor, 
          path: [...path, neighbor], 
          visited: newVisited 
        });
      }
    }
  }
  
  return allPaths;
};

/**
 * Hitung skor efisiensi untuk sebuah rute
 */
const calculateRouteEfficiency = (path, rooms) => {
  const roomData = path.map(id => rooms.find(r => r.id === id));
  
  // Hitung average occupancy rate (lower is better)
  const avgOccupancy = roomData.reduce((sum, room) => {
    return sum + (room.occupancy / room.kapasitas_max);
  }, 0) / roomData.length;
  
  // Skor berdasarkan panjang rute (shorter is better) dan occupancy (lower is better)
  const lengthScore = Math.max(0, 1 - (path.length - 1) * 0.1);
  const occupancyScore = 1 - avgOccupancy;

  // Weighted score: 40% length, 60% occupancy
  const efficiencyScore = (lengthScore * 0.4 + occupancyScore * 0.6) * 100;
  
  return {
    efficiency_score: Math.round(efficiencyScore),
    avg_occupancy: (avgOccupancy * 100).toFixed(1) + '%',
    length: path.length - 1
  };
};

export const findPath = async (req, res) => {
  try {
    const { tujuan, start = 1 } = req.body;
    
    console.log('🚀 Pathfinding request:', { tujuan, start });
    
    if (!tujuan) {
      return sendError(res, new Error('Missing required field: tujuan'), 400);
    }
    
    // Dapatkan semua ruangan dan koneksi
    const roomsResult = await pool.query('SELECT * FROM rooms');
    const connectionsResult = await pool.query('SELECT * FROM connections');
    
    const rooms = roomsResult.rows;
    const connections = connectionsResult.rows;
    
    console.log(`📊 Loaded ${rooms.length} rooms and ${connections.length} connections`);
    
    // Cari ruangan asal dan tujuan
    const startRoom = rooms.find(room => room.id === parseInt(start));
    const targetRoom = rooms.find(room => 
      room.nama_ruangan.toLowerCase().includes(tujuan.toLowerCase())
    );
    
    if (!startRoom) {
      return sendError(res, new Error(`Start room with ID ${start} not found`), 404);
    }
    
    if (!targetRoom) {
      return sendError(res, new Error(`Target room "${tujuan}" not found`), 404);
    }
    
    console.log(`📍 Start: ${startRoom.nama_ruangan}, Target: ${targetRoom.nama_ruangan}`);
    
    // Bangun graph dari koneksi
    const graph = {};
    rooms.forEach(room => {
      graph[room.id] = [];
    });
    
    connections.forEach(conn => {
      graph[conn.room_from].push(conn.room_to);
      graph[conn.room_to].push(conn.room_from); // Bi-directional
    });
    
    console.log('🔗 Graph structure:', graph);
    
    // Cari SEMUA kemungkinan rute (maksimal 10)
    const allPaths = findAllPaths(graph, startRoom.id, targetRoom.id, 10);
    
    if (allPaths.length === 0) {
      return sendError(res, new Error('No path found to target room'), 404);
    }
    
    console.log(`🛣️ Found ${allPaths.length} possible routes`);
    
    // Hitung efisiensi untuk setiap rute
    const routesWithEfficiency = allPaths.map((path, index) => {
      const efficiency = calculateRouteEfficiency(path, rooms);
      const roomNames = path.map(id => {
        const room = rooms.find(r => r.id === id);
        return room.nama_ruangan;
      });
      
      return {
        rute: roomNames,
        langkah: path.length - 1,
        efisiensi_score: efficiency.efficiency_score,
        avg_occupancy: efficiency.avg_occupancy,
        is_optimal: index === 0
      };
    });
    
    // Sort routes by efficiency score (descending)
    routesWithEfficiency.sort((a, b) => b.efisiensi_score - a.efisiensi_score);
    
    // Tentukan rute optimal (yang memiliki skor tertinggi)
    const optimalRoute = routesWithEfficiency[0];
    
    // Cek jika ada ruangan penuh di rute optimal
    const fullRoomsInOptimalPath = optimalRoute.rute.filter(roomName => {
      const room = rooms.find(r => r.nama_ruangan === roomName);
      return room && room.occupancy >= room.kapasitas_max;
    });
    
    const hasFullRooms = fullRoomsInOptimalPath.length > 0;
    
    // Hitung persentase perbandingan dengan optimal untuk setiap rute
    const routesWithComparison = routesWithEfficiency.map(route => ({
      ...route,
      perbandingan_dengan_optimal: Math.round((route.efisiensi_score / optimalRoute.efisiensi_score) * 100) + '%'
    }));
    
    // Siapkan response - format yang diharapkan frontend
    const response = {
      status: hasFullRooms ? 'penuh' : 'aman',
      jalur_optimal: optimalRoute.rute,
      semua_kemungkinan_rute: routesWithComparison,
      ruangan_asal: startRoom.nama_ruangan,
      ruangan_tujuan: targetRoom.nama_ruangan,
      occupancy_tujuan: `${targetRoom.occupancy}/${targetRoom.kapasitas_max} (${((targetRoom.occupancy / targetRoom.kapasitas_max) * 100).toFixed(1)}%)`
    };
    
    if (hasFullRooms) {
      response.ruangan_penuh = fullRoomsInOptimalPath;
      response.occupancy = fullRoomsInOptimalPath.map(roomName => {
        const room = rooms.find(r => r.nama_ruangan === roomName);
        return `${room.occupancy}/${room.kapasitas_max}`;
      });
    }
    
    console.log('✅ Pathfinding completed successfully');
    console.log('📤 Response:', {
      status: response.status,
      optimal_route_steps: optimalRoute.rute.length - 1,
      total_routes_found: routesWithComparison.length,
      has_full_rooms: hasFullRooms
    });
    
    sendSuccess(res, response, 'Path found successfully');
    
  } catch (error) {
    console.error('❌ Error in pathfinding:', error);
    sendError(res, error);
  }
};

// Health check untuk pathfinding service
export const pathfindingHealth = async (req, res) => {
  try {
    const roomsResult = await pool.query('SELECT COUNT(*) FROM rooms');
    const connectionsResult = await pool.query('SELECT COUNT(*) FROM connections');
    
    const healthInfo = {
      service: 'Pathfinding',
      status: 'operational',
      rooms_count: parseInt(roomsResult.rows[0].count),
      connections_count: parseInt(connectionsResult.rows[0].count),
      timestamp: new Date().toISOString()
    };
    
    res.json(healthInfo);
  } catch (error) {
    console.error('Pathfinding health check error:', error);
    res.status(500).json({ 
      service: 'Pathfinding',
      status: 'degraded',
      error: error.message 
    });
  }
};

// Get graph structure untuk debugging
export const getGraphStructure = async (req, res) => {
  try {
    const roomsResult = await pool.query('SELECT id, nama_ruangan FROM rooms ORDER BY id');
    const connectionsResult = await pool.query('SELECT * FROM connections ORDER BY id');
    
    const graph = {};
    roomsResult.rows.forEach(room => {
      graph[room.id] = {
        name: room.nama_ruangan,
        neighbors: []
      };
    });
    
    connectionsResult.rows.forEach(conn => {
      if (graph[conn.room_from]) {
        graph[conn.room_from].neighbors.push(conn.room_to);
      }
      if (graph[conn.room_to]) {
        graph[conn.room_to].neighbors.push(conn.room_from);
      }
    });
    
    const graphData = {
      nodes: roomsResult.rows,
      edges: connectionsResult.rows,
      graph_structure: graph,
      summary: {
        total_nodes: roomsResult.rowCount,
        total_edges: connectionsResult.rowCount
      }
    };
    
    res.json(graphData);
  } catch (error) {
    console.error('Error getting graph structure:', error);
    res.status(500).json({ error: error.message });
  }
};