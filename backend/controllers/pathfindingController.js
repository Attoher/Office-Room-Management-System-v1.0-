import pool from '../db.js';

class Graph {
    constructor() {
        this.nodes = new Map();
    }

    addNode(room) {
        this.nodes.set(room.id, {
            ...room,
            neighbors: new Set()
        });
    }

    addEdge(from, to) {
        if (this.nodes.has(from) && this.nodes.has(to)) {
            this.nodes.get(from).neighbors.add(to);
            this.nodes.get(to).neighbors.add(from);
        }
    }

    bfs(startId, endId) {
        const visited = new Set();
        const queue = [[startId, [startId]]];
        
        while (queue.length > 0) {
            const [currentId, path] = queue.shift();
            
            if (currentId === endId) {
                return path;
            }
            
            if (!visited.has(currentId)) {
                visited.add(currentId);
                const currentNode = this.nodes.get(currentId);
                
                for (const neighborId of currentNode.neighbors) {
                    if (!visited.has(neighborId)) {
                        queue.push([neighborId, [...path, neighborId]]);
                    }
                }
            }
        }
        
        return null;
    }
}

export const findPath = async (req, res) => {
    try {
        const { tujuan } = req.body;
        
        if (!tujuan) {
            return res.status(400).json({ error: 'Tujuan is required' });
        }
        
        // Get all rooms and connections
        const roomsResult = await pool.query('SELECT * FROM rooms');
        const connectionsResult = await pool.query('SELECT * FROM connections');
        
        // Build graph
        const graph = new Graph();
        roomsResult.rows.forEach(room => graph.addNode(room));
        connectionsResult.rows.forEach(conn => {
            graph.addEdge(conn.room_from, conn.room_to);
        });
        
        // Find target room
        const targetRoom = roomsResult.rows.find(r => 
            r.nama_ruangan.toLowerCase() === tujuan.toLowerCase()
        );
        
        if (!targetRoom) {
            return res.status(404).json({ error: 'Ruangan tujuan tidak ditemukan' });
        }
        
        // Check target room capacity
        const occupancyPercentage = (targetRoom.occupancy / targetRoom.kapasitas_max) * 100;
        if (occupancyPercentage >= 90) {
            return res.json({
                status: 'penuh',
                message: 'Harap tunggu - ruangan tujuan penuh',
                ruangan_tujuan: targetRoom.nama_ruangan,
                occupancy: `${occupancyPercentage.toFixed(1)}%`
            });
        }
        
        // Find entrance (assume room with lowest ID as entrance)
        const entrance = roomsResult.rows.reduce((prev, current) => 
            prev.id < current.id ? prev : current
        );
        
        // Find path using BFS
        const path = graph.bfs(entrance.id, targetRoom.id);
        
        if (!path) {
            return res.status(404).json({ error: 'Tidak ada jalur menuju ruangan tujuan' });
        }
        
        // Check capacity along the path
        const pathRooms = path.map(roomId => 
            roomsResult.rows.find(r => r.id === roomId)
        );
        
        const problematicRooms = pathRooms.filter(room => {
            const percentage = (room.occupancy / room.kapasitas_max) * 100;
            return percentage >= 90;
        });
        
        if (problematicRooms.length > 0) {
            return res.json({
                status: 'penuh',
                message: 'Harap tunggu - jalur melewati ruangan penuh',
                ruangan_penuh: problematicRooms.map(r => r.nama_ruangan),
                occupancy: problematicRooms.map(r => 
                    `${((r.occupancy / r.kapasitas_max) * 100).toFixed(1)}%`
                )
            });
        }
        
        // Return optimal path
        res.json({
            status: 'aman',
            message: 'Jalur tersedia',
            jalur_optimal: pathRooms.map(r => r.nama_ruangan),
            ruangan_tujuan: targetRoom.nama_ruangan,
            occupancy_tujuan: `${occupancyPercentage.toFixed(1)}%`,
            detail_path: pathRooms.map(room => ({
                nama: room.nama_ruangan,
                occupancy: `${((room.occupancy / room.kapasitas_max) * 100).toFixed(1)}%`,
                status: (room.occupancy / room.kapasitas_max) * 100 < 70 ? 'hijau' : 
                       (room.occupancy / room.kapasitas_max) * 100 < 90 ? 'kuning' : 'merah'
            }))
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};