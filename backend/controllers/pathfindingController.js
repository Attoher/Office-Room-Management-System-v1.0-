import pool from '../db.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';
import { logger } from '../utils/logger.js';

/**
 * Enhanced DFS untuk mencari semua kemungkinan rute dengan depth limit
 */
const findAllPaths = (graph, startId, targetId, maxPaths = 10, maxDepth = 8) => {
  const results = [];
  
  const dfs = (currentId, path, visited, depth) => {
    if (depth > maxDepth) return;
    if (currentId === targetId) {
      results.push([...path]);
      return;
    }
    
    for (const neighbor of graph[currentId] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        dfs(neighbor, [...path, neighbor], visited, depth + 1);
        visited.delete(neighbor);
        
        // Early return jika sudah cukup paths
        if (results.length >= maxPaths) return;
      }
    }
  };
  
  dfs(startId, [startId], new Set([startId]), 0);
  return results.slice(0, maxPaths);
};

/**
 * Hitung skor efisiensi untuk sebuah rute
 */
const calculateRouteEfficiency = (path, rooms) => {
  const roomData = path.map(id => rooms.find(r => r.id === id)).filter(Boolean);
  
  if (roomData.length === 0) {
    return {
      efficiency_score: 0,
      avg_occupancy: '0%',
      length: 0
    };
  }
  
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
    
    logger.info('Pathfinding request received', { tujuan, start });
    
    // Dapatkan semua ruangan dan koneksi
    const [roomsResult, connectionsResult] = await Promise.all([
      pool.query('SELECT * FROM rooms'),
      pool.query('SELECT * FROM connections')
    ]);
    
    const rooms = roomsResult.rows;
    const connections = connectionsResult.rows;
    
    logger.debug(`Loaded ${rooms.length} rooms and ${connections.length} connections`);
    
    // Cari ruangan asal dan tujuan
    const startRoom = rooms.find(room => room.id === parseInt(start));
    const targetRoom = rooms.find(room => 
      room.nama_ruangan.toLowerCase().includes(tujuan.toLowerCase())
    );
    
    if (!startRoom) {
      logger.warn('Start room not found', { start });
      return sendError(res, new Error(`Start room with ID ${start} not found`), 404);
    }
    
    if (!targetRoom) {
      logger.warn('Target room not found', { tujuan });
      return sendError(res, new Error(`Target room "${tujuan}" not found`), 404);
    }
    
    logger.info('Pathfinding parameters', {
      start: startRoom.nama_ruangan,
      target: targetRoom.nama_ruangan
    });
    
    // Bangun graph dari koneksi
    const graph = {};
    rooms.forEach(room => {
      graph[room.id] = [];
    });
    
    connections.forEach(conn => {
      graph[conn.room_from].push(conn.room_to);
      graph[conn.room_to].push(conn.room_from); // Bi-directional
    });
    
    logger.debug('Graph structure built', { 
      nodes: Object.keys(graph).length,
      total_edges: connections.length * 2 // bidirectional
    });
    
    // Cari SEMUA kemungkinan rute (maksimal 10)
    const allPaths = findAllPaths(graph, startRoom.id, targetRoom.id, 10);
    
    if (allPaths.length === 0) {
      logger.warn('No path found to target room', {
        start: startRoom.nama_ruangan,
        target: targetRoom.nama_ruangan
      });
      return sendError(res, new Error('No path found to target room'), 404);
    }
    
    logger.info(`Found ${allPaths.length} possible routes`);
    
    // Hitung efisiensi untuk setiap rute
    const routesWithEfficiency = allPaths.map((path, index) => {
      const efficiency = calculateRouteEfficiency(path, rooms);
      const roomNames = path.map(id => {
        const room = rooms.find(r => r.id === id);
        return room ? room.nama_ruangan : `Unknown (${id})`;
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
    
    logger.info('Pathfinding completed successfully', {
      status: response.status,
      optimal_route_steps: optimalRoute.rute.length - 1,
      total_routes_found: routesWithComparison.length,
      has_full_rooms: hasFullRooms
    });
    
    sendSuccess(res, response, 'Path found successfully');
    
  } catch (error) {
    logger.error('Pathfinding failed', error, {
      tujuan: req.body.tujuan,
      start: req.body.start
    });
    sendError(res, error);
  }
};

export const pathfindingHealth = async (req, res) => {
  try {
    const [roomsResult, connectionsResult] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM rooms'),
      pool.query('SELECT COUNT(*) FROM connections')
    ]);
    
    const healthInfo = {
      service: 'Pathfinding',
      status: 'operational',
      rooms_count: parseInt(roomsResult.rows[0].count),
      connections_count: parseInt(connectionsResult.rows[0].count),
      timestamp: new Date().toISOString(),
      algorithm: 'Enhanced DFS with efficiency scoring',
      max_paths: 10,
      max_depth: 8
    };
    
    logger.debug('Pathfinding health check', healthInfo);
    res.json(healthInfo);
  } catch (error) {
    logger.error('Pathfinding health check failed', error);
    res.status(500).json({ 
      service: 'Pathfinding',
      status: 'degraded',
      error: error.message 
    });
  }
};

export const getGraphStructure = async (req, res) => {
  try {
    const [roomsResult, connectionsResult] = await Promise.all([
      pool.query('SELECT id, nama_ruangan FROM rooms ORDER BY id'),
      pool.query('SELECT * FROM connections ORDER BY id')
    ]);
    
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
        total_edges: connectionsResult.rowCount,
        average_connectivity: (connectionsResult.rowCount * 2 / roomsResult.rowCount).toFixed(2)
      }
    };
    
    logger.debug('Graph structure fetched', graphData.summary);
    res.json(graphData);
  } catch (error) {
    logger.error('Failed to get graph structure', error);
    res.status(500).json({ error: error.message });
  }
};