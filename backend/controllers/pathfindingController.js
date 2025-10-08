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
            console.log(`Edge added: ${from} <-> ${to}`);
        } else {
            console.log(`Failed to add edge: ${from} <-> ${to} (nodes exist: ${this.nodes.has(from)}, ${this.nodes.has(to)})`);
        }
    }

    // Debug method to print graph structure
    printGraph() {
        console.log('\n=== GRAPH STRUCTURE ===');
        for (const [nodeId, node] of this.nodes) {
            const neighbors = Array.from(node.neighbors);
            console.log(`Node ${nodeId} (${node.nama_ruangan}): connected to [${neighbors.join(', ')}]`);
        }
        console.log('========================\n');
    }

    bfs(startId, endId) {
        console.log(`\n=== BFS ALGORITHM ===`);
        console.log(`Starting BFS from ${startId} to ${endId}`);
        
        // Verify start and end nodes exist
        if (!this.nodes.has(startId)) {
            console.error(`❌ Start node ${startId} does not exist in graph!`);
            return null;
        }
        if (!this.nodes.has(endId)) {
            console.error(`❌ End node ${endId} does not exist in graph!`);
            return null;
        }
        
        const visited = new Set();
        const queue = [[startId, [startId]]];
        let iteration = 0;
        
        while (queue.length > 0) {
            iteration++;
            const [currentId, path] = queue.shift();
            console.log(`Iteration ${iteration}: Processing node ${currentId}, path: [${path.join(' -> ')}]`);
            
            // Check if we reached the target
            if (currentId === endId) {
                console.log(`✅ TARGET FOUND! Final path: [${path.join(' -> ')}]`);
                console.log(`Path length: ${path.length} nodes`);
                console.log(`=== END BFS ===\n`);
                return path;
            }
            
            // Skip if already visited
            if (visited.has(currentId)) {
                console.log(`  Node ${currentId} already visited, skipping`);
                continue;
            }
            
            // Mark as visited
            visited.add(currentId);
            const currentNode = this.nodes.get(currentId);
            
            if (currentNode && currentNode.neighbors && currentNode.neighbors.size > 0) {
                const neighbors = Array.from(currentNode.neighbors);
                console.log(`  Node ${currentId} has neighbors: [${neighbors.join(', ')}]`);
                
                for (const neighborId of neighbors) {
                    if (!visited.has(neighborId)) {
                        const newPath = [...path, neighborId];
                        queue.push([neighborId, newPath]);
                        console.log(`    Adding to queue: ${neighborId} with path [${newPath.join(' -> ')}]`);
                    } else {
                        console.log(`    Skipping visited neighbor: ${neighborId}`);
                    }
                }
            } else {
                console.log(`  Node ${currentId} has no neighbors or is invalid`);
            }
            
            console.log(`  Queue after processing: ${queue.map(q => `[${q[0]}: ${q[1].join('->')}]`).join(', ')}`);
            console.log(`  Visited: [${Array.from(visited).join(', ')}]\n`);
        }
        
        console.log(`❌ NO PATH FOUND from ${startId} to ${endId}`);
        console.log(`Final visited nodes: [${Array.from(visited).join(', ')}]`);
        console.log(`=== END BFS ===\n`);
        return null;
    }
}

// Helper function to normalize room names for comparison
const normalizeRoomName = (name) => {
    return name ? name.trim().toLowerCase().replace(/\s+/g, ' ') : '';
};

export const findPath = async (req, res) => {
    try {
        const { asal, tujuan } = req.body;
        
        console.log('\n' + '='.repeat(50));
        console.log('=== PATHFINDING REQUEST START ===');
        console.log('='.repeat(50));
        console.log('Received pathfinding request:', { asal, tujuan });
        
        if (!asal || !tujuan) {
            return res.status(400).json({ error: 'Asal dan tujuan harus diisi' });
        }
        
        if (asal === tujuan) {
            return res.status(400).json({ error: 'Asal dan tujuan tidak boleh sama' });
        }
        
        // Get all rooms and connections
        const roomsResult = await pool.query('SELECT * FROM rooms ORDER BY id');
        const connectionsResult = await pool.query('SELECT * FROM connections ORDER BY id');
        
        console.log('\n=== DATABASE DATA ===');
        console.log('Available rooms:', roomsResult.rows.map(r => ({ id: r.id, nama: r.nama_ruangan })));
        console.log('Available connections:', connectionsResult.rows.map(c => ({ 
            id: c.id, 
            from: c.room_from, 
            to: c.room_to,
            room_names: `${roomsResult.rows.find(r => r.id === c.room_from)?.nama_ruangan} <-> ${roomsResult.rows.find(r => r.id === c.room_to)?.nama_ruangan}`
        })));
        
        // Build graph
        console.log('\n=== BUILDING GRAPH ===');
        const graph = new Graph();
        
        // Add all nodes first
        roomsResult.rows.forEach(room => {
            console.log(`Adding node: ${room.id} - "${room.nama_ruangan}"`);
            graph.addNode(room);
        });
        
        // Then add all edges
        connectionsResult.rows.forEach(conn => {
            const fromRoom = roomsResult.rows.find(r => r.id === conn.room_from);
            const toRoom = roomsResult.rows.find(r => r.id === conn.room_to);
            console.log(`Adding edge: ${conn.room_from} (${fromRoom?.nama_ruangan}) <-> ${conn.room_to} (${toRoom?.nama_ruangan})`);
            graph.addEdge(conn.room_from, conn.room_to);
        });
        
        // FIXED: Add edges bidirectionally even though stored in one direction
        connectionsResult.rows.forEach(conn => {
            const fromRoom = roomsResult.rows.find(r => r.id === conn.room_from);
            const toRoom = roomsResult.rows.find(r => r.id === conn.room_to);
            console.log(`Adding bidirectional edge: ${conn.room_from} (${fromRoom?.nama_ruangan}) <-> ${conn.room_to} (${toRoom?.nama_ruangan})`);
            
            // FIXED: Always add edge in both directions for pathfinding
            graph.addEdge(conn.room_from, conn.room_to);
            // The addEdge method in Graph class already handles bidirectional connections
        });
        
        // Print complete graph structure
        graph.printGraph();
        
        // Normalize input room names
        const normalizedAsal = normalizeRoomName(asal);
        const normalizedTujuan = normalizeRoomName(tujuan);
        
        console.log('=== ROOM MATCHING ===');
        console.log('Input rooms:', { asal, tujuan });
        console.log('Normalized input:', { normalizedAsal, normalizedTujuan });
        
        // Find start and target rooms using normalized comparison
        console.log('Searching for start room...');
        const startRoom = roomsResult.rows.find(r => {
            const normalized = normalizeRoomName(r.nama_ruangan);
            console.log(`Comparing "${normalized}" with "${normalizedAsal}": ${normalized === normalizedAsal}`);
            return normalized === normalizedAsal;
        });
        
        console.log('Searching for target room...');
        const targetRoom = roomsResult.rows.find(r => {
            const normalized = normalizeRoomName(r.nama_ruangan);
            console.log(`Comparing "${normalized}" with "${normalizedTujuan}": ${normalized === normalizedTujuan}`);
            return normalized === normalizedTujuan;
        });
        
        console.log('Found rooms:', { 
            startRoom: startRoom ? { id: startRoom.id, nama: startRoom.nama_ruangan } : null,
            targetRoom: targetRoom ? { id: targetRoom.id, nama: targetRoom.nama_ruangan } : null
        });
        
        if (!startRoom) {
            console.log(`❌ Start room "${asal}" not found`);
            return res.status(404).json({ 
                error: `Ruangan asal "${asal}" tidak ditemukan`,
                available_rooms: roomsResult.rows.map(r => r.nama_ruangan)
            });
        }
        
        if (!targetRoom) {
            console.log(`❌ Target room "${tujuan}" not found`);
            return res.status(404).json({ 
                error: `Ruangan tujuan "${tujuan}" tidak ditemukan`,
                available_rooms: roomsResult.rows.map(r => r.nama_ruangan)
            });
        }
        
        // Check target room capacity
        const occupancyPercentage = (targetRoom.occupancy / targetRoom.kapasitas_max) * 100;
        if (occupancyPercentage >= 90) {
            return res.json({
                status: 'penuh',
                message: 'Harap tunggu - ruangan tujuan penuh',
                ruangan_tujuan: targetRoom.nama_ruangan,
                ruangan_asal: startRoom.nama_ruangan,
                occupancy: `${occupancyPercentage.toFixed(1)}%`
            });
        }
        
        // Find path using BFS from start to target
        console.log('\n=== PATHFINDING ===');
        console.log(`Finding path from ${startRoom.id} (${startRoom.nama_ruangan}) to ${targetRoom.id} (${targetRoom.nama_ruangan})`);
        
        const pathIds = graph.bfs(startRoom.id, targetRoom.id);
        
        console.log('\n=== PATHFINDING RESULT ===');
        console.log('BFS returned path IDs:', pathIds);
        
        if (!pathIds || pathIds.length === 0) {
            console.log('❌ No path found between rooms');
            return res.status(404).json({ 
                error: 'Tidak ada jalur menuju ruangan tujuan',
                startRoom: startRoom.nama_ruangan,
                targetRoom: targetRoom.nama_ruangan
            });
        }
        
        // Convert path IDs to room objects and names
        console.log('=== PATH CONVERSION ===');
        const pathRooms = pathIds.map((roomId, index) => {
            const room = roomsResult.rows.find(r => r.id === roomId);
            console.log(`Step ${index}: ID ${roomId} -> Room "${room ? room.nama_ruangan : 'NOT FOUND'}"`);
            if (!room) {
                console.error(`❌ Room with ID ${roomId} not found in database!`);
            }
            return room;
        }).filter(room => room !== undefined);
        
        console.log('Path rooms (objects):', pathRooms.map(r => ({ id: r.id, nama: r.nama_ruangan })));
        
        const pathRoomNames = pathRooms.map(r => r.nama_ruangan);
        console.log('Path room names:', pathRoomNames);
        
        // Verify the path starts and ends correctly
        console.log('=== PATH VALIDATION ===');
        console.log(`Expected start: "${startRoom.nama_ruangan}"`);
        console.log(`Actual start: "${pathRoomNames[0]}"`);
        console.log(`Expected end: "${targetRoom.nama_ruangan}"`);
        console.log(`Actual end: "${pathRoomNames[pathRoomNames.length - 1]}"`);
        
        if (pathRoomNames[0] !== startRoom.nama_ruangan) {
            console.error(`❌ CRITICAL ERROR: Path should start with "${startRoom.nama_ruangan}" but starts with "${pathRoomNames[0]}"`);
            console.error('This indicates a serious bug in the pathfinding algorithm!');
            console.error('PathIDs:', pathIds);
            console.error('StartRoom ID:', startRoom.id);
            console.error('Expected first ID should be:', startRoom.id);
            console.error('Actual first ID is:', pathIds[0]);
            
            // This should not happen - let's return an error
            return res.status(500).json({ 
                error: 'Pathfinding algorithm error: incorrect start room',
                debug_info: {
                    expected_start: startRoom.nama_ruangan,
                    actual_start: pathRoomNames[0],
                    path_ids: pathIds,
                    expected_start_id: startRoom.id
                }
            });
        }
        
        if (pathRoomNames[pathRoomNames.length - 1] !== targetRoom.nama_ruangan) {
            console.error(`❌ CRITICAL ERROR: Path should end with "${targetRoom.nama_ruangan}" but ends with "${pathRoomNames[pathRoomNames.length - 1]}"`);
            
            return res.status(500).json({ 
                error: 'Pathfinding algorithm error: incorrect end room',
                debug_info: {
                    expected_end: targetRoom.nama_ruangan,
                    actual_end: pathRoomNames[pathRoomNames.length - 1],
                    path_ids: pathIds,
                    expected_end_id: targetRoom.id
                }
            });
        }
        
        // Check capacity along the path
        const problematicRooms = pathRooms.filter(room => {
            const percentage = (room.occupancy / room.kapasitas_max) * 100;
            return percentage >= 90;
        });
        
        if (problematicRooms.length > 0) {
            const response = {
                status: 'penuh',
                message: 'Harap tunggu - jalur melewati ruangan penuh',
                ruangan_penuh: problematicRooms.map(r => r.nama_ruangan),
                ruangan_asal: startRoom.nama_ruangan, // FIXED: Include start room
                ruangan_tujuan: targetRoom.nama_ruangan,
                occupancy: problematicRooms.map(r => 
                    `${((r.occupancy / r.kapasitas_max) * 100).toFixed(1)}%`
                ),
                jalur_optimal: pathRoomNames
            };
            
            console.log('=== FINAL RESPONSE (PENUH) ===');
            console.log(JSON.stringify(response, null, 2));
            console.log('='.repeat(50) + '\n');
            return res.json(response);
        }
        
        // Return optimal path
        const response = {
            status: 'aman',
            message: 'Jalur tersedia',
            jalur_optimal: pathRoomNames,
            ruangan_asal: startRoom.nama_ruangan, // FIXED: Include start room
            ruangan_tujuan: targetRoom.nama_ruangan,
            occupancy_tujuan: `${occupancyPercentage.toFixed(1)}%`,
            detail_path: pathRooms.map(room => ({
                id: room.id,
                nama: room.nama_ruangan,
                occupancy: `${((room.occupancy / room.kapasitas_max) * 100).toFixed(1)}%`,
                status: (room.occupancy / room.kapasitas_max) * 100 < 70 ? 'hijau' : 
                       (room.occupancy / room.kapasitas_max) * 100 < 90 ? 'kuning' : 'merah'
            }))
        };
        
        console.log('=== FINAL RESPONSE (AMAN) ===');
        console.log(JSON.stringify(response, null, 2));
        console.log('='.repeat(50) + '\n');
        res.json(response);
        
    } catch (error) {
        console.error('❌ PATHFINDING ERROR:', error);
        console.error(error.stack);
        res.status(500).json({ error: error.message });
    }
};