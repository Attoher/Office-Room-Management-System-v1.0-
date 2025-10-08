import React, { useRef, useEffect, useState } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';

const GraphVisualization = ({ rooms, connections, pathResult, startRoom, targetRoom, onNodeClick }) => {
  const networkRef = useRef(null);
  const [network, setNetwork] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    if (!networkRef.current || rooms.length === 0) return;

    console.log('=== GRAPH VISUALIZATION DEBUG ===', new Date().toLocaleTimeString());
    console.log('Props received:');
    console.log('- startRoom:', startRoom, '(type:', typeof startRoom, ')');
    console.log('- targetRoom:', targetRoom, '(type:', typeof targetRoom, ')');
    console.log('- pathResult:', pathResult, '(type:', typeof pathResult, ')');
    
    if (pathResult) {
      console.log('- pathResult.jalur_optimal:', pathResult.jalur_optimal);
      console.log('- pathResult.ruangan_asal:', pathResult.ruangan_asal);
      console.log('- pathResult.ruangan_tujuan:', pathResult.ruangan_tujuan);
    }
    
    console.log('- rooms:', rooms.map(r => ({ id: r.id, nama: r.nama_ruangan })));
    
    // Create nodes from rooms
    const nodes = new DataSet(
      rooms.map(room => {
        const percentage = (room.occupancy / room.kapasitas_max) * 100;
        
        // Enhanced start/target room matching
        const normalizeRoomName = (name) => {
          return name ? name.trim().toLowerCase().replace(/\s+/g, ' ') : '';
        };

        const roomNormalized = normalizeRoomName(room.nama_ruangan);
        const startNormalized = normalizeRoomName(startRoom);
        const targetNormalized = normalizeRoomName(targetRoom);

        const isStart = startRoom && roomNormalized === startNormalized;
        const isTarget = targetRoom && roomNormalized === targetNormalized;
        
        // Enhanced path checking with better logging
        const isInPath = pathResult?.jalur_optimal?.some(pathRoom => {
          const pathNormalized = normalizeRoomName(pathRoom);
          const match = pathNormalized === roomNormalized;
          console.log(`Path check: "${pathRoom}" (${pathNormalized}) === "${room.nama_ruangan}" (${roomNormalized}) = ${match}`);
          return match;
        });
        
        console.log(`[${new Date().toLocaleTimeString()}] Room "${room.nama_ruangan}":`, {
          normalized: roomNormalized,
          isStart,
          isTarget,
          isInPath,
          startComparison: `"${roomNormalized}" === "${startNormalized}" = ${roomNormalized === startNormalized}`,
          targetComparison: `"${roomNormalized}" === "${targetNormalized}" = ${roomNormalized === targetNormalized}`
        });

        const isSelected = selectedNode === room.id;

        if (isStart) {
          console.log('✅ IDENTIFIED START ROOM:', room.nama_ruangan, 'ID:', room.id);
        }
        if (isTarget) {
          console.log('✅ IDENTIFIED TARGET ROOM:', room.nama_ruangan, 'ID:', room.id);
        }
        if (isInPath) {
          console.log('📍 ROOM IN PATH:', room.nama_ruangan);
        }

        // FIXED: New Color and Shape Logic
        // ALL nodes use box shape
        let shape = 'box';  // FIXED: Always box for all nodes
        let size = 25;
        let fontsize = 14;
        let borderWidth = 1;
        let shadow = true;

        // FIXED: Color Logic - Prioritize occupancy colors as default
        let finalColor;
        
        if (isSelected) {
          // Selected nodes: orange
          finalColor = {
            background: '#FF6B00',
            border: '#E55A00',
            highlight: {
              background: '#FF8C42',
              border: '#FF6B00'
            }
          };
          size = 35;
          borderWidth = 2;
          fontsize = 16;
        } else if (isStart) {
          // Start room: BLUE box (override occupancy color)
          console.log('🚀 APPLYING START ROOM STYLING to:', room.nama_ruangan);
          size = 30;
          fontsize = 16;
          borderWidth = 3;
          
          finalColor = {
            background: '#3B82F6', // blue
            border: '#2563EB',
            highlight: { background: '#60A5FA', border: '#3B82F6' }
          };
        } else if (isTarget) {
          // Target room: BLUE box (override occupancy color)
          console.log('🎯 APPLYING TARGET ROOM STYLING to:', room.nama_ruangan);
          size = 30;
          fontsize = 16;
          borderWidth = 3;
          
          finalColor = {
            background: '#3B82F6', // blue
            border: '#2563EB',
            highlight: { background: '#60A5FA', border: '#3B82F6' }
          };
        } else if (isInPath) {
          // Rooms in path: YELLOW box (override occupancy color)
          finalColor = {
            background: '#F59E0B', // yellow for path
            border: '#D97706',
            highlight: {
              background: '#FBBF24',
              border: '#F59E0B'
            }
          };
          size = 28;
          fontsize = 15;
          borderWidth = 3;
        } else {
          // FIXED: Default colors based on occupancy percentage
          if (percentage < 70) {
            // Hijau (<70%)
            finalColor = {
              background: '#10B981', // green
              border: '#059669',
              highlight: {
                background: '#34D399',
                border: '#10B981'
              }
            };
          } else if (percentage < 90) {
            // Kuning (70-90%)
            finalColor = {
              background: '#F59E0B', // yellow
              border: '#D97706',
              highlight: {
                background: '#FBBF24',
                border: '#F59E0B'
              }
            };
          } else {
            // Merah (≥90%)
            finalColor = {
              background: '#EF4444', // red
              border: '#DC2626',
              highlight: {
                background: '#F87171',
                border: '#EF4444'
              }
            };
          }
        }

        // Tooltip content
        const tooltipContent = `
          <div class="p-2 max-w-xs">
            <div class="font-bold text-lg mb-2">${room.nama_ruangan}</div>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between">
                <span>Luas:</span>
                <span class="font-semibold">${room.luas} m²</span>
              </div>
              <div class="flex justify-between">
                <span>Kapasitas:</span>
                <span class="font-semibold">${room.occupancy}/${room.kapasitas_max}</span>
              </div>
              <div class="flex justify-between">
                <span>Occupancy:</span>
                <span class="font-semibold">${percentage.toFixed(1)}%</span>
              </div>
              <div class="flex justify-between">
                <span>Status:</span>
                <span class="font-semibold ${
                  percentage < 70 ? 'text-green-600' : 
                  percentage < 90 ? 'text-yellow-600' : 'text-red-600'
                }">
                  ${percentage < 70 ? 'Hijau' : percentage < 90 ? 'Kuning' : 'Merah'}
                </span>
              </div>
              ${isStart ? '<div class="text-blue-600 font-semibold">🚀 Start Point</div>' : ''}
              ${isTarget ? '<div class="text-purple-600 font-semibold">🎯 Target Point</div>' : ''}
              ${isInPath ? '<div class="text-yellow-600 font-semibold">📍 Dalam Jalur Optimal</div>' : ''}
            </div>
          </div>
        `;

        return {
          id: room.id,
          // FIXED: Always show full room name, no truncation
          label: room.nama_ruangan,  // Remove the length check and truncation
          title: tooltipContent,
          color: finalColor,
          shape: shape,
          size: size,
          font: { 
            size: fontsize, 
            color: '#1F2937',
            face: 'Inter, system-ui, sans-serif',
            bold: isStart || isTarget || isSelected,
            // FIXED: Add text wrapping and multi-line support
            multi: true,
            maxWdt: 120,  // Maximum width for text wrapping
            align: 'center'
          },
          borderWidth: borderWidth,
          shadow: shadow,
          mass: isStart || isTarget ? 2 : 1,
          // FIXED: Ensure minimum size for longer text
          widthConstraint: {
            minimum: 80,
            maximum: 150
          },
          heightConstraint: {
            minimum: 40,
            maximum: 80
          }
        };
      })
    );

    console.log('[' + new Date().toLocaleTimeString() + '] Final nodes created:', nodes.get().map(n => ({ id: n.id, label: n.label, shape: n.shape, color: n.color.background })));
    
    // Create edges from connections with YELLOW color for path edges
    const edges = new DataSet(
        connections.map(conn => {
            let isInPath = false;

            // Check if this edge is part of the optimal path
            if (pathResult?.jalur_optimal?.length > 1) {
                for (let i = 0; i < pathResult.jalur_optimal.length - 1; i++) {
                    const currentRoomName = pathResult.jalur_optimal[i].trim().toLowerCase();
                    const nextRoomName = pathResult.jalur_optimal[i + 1].trim().toLowerCase();

                    const fromRoom = rooms.find(r => r.nama_ruangan.trim().toLowerCase() === currentRoomName);
                    const toRoom = rooms.find(r => r.nama_ruangan.trim().toLowerCase() === nextRoomName);

                    // Check if this connection matches the path segment
                    if (
                        (fromRoom?.id === conn.room_from && toRoom?.id === conn.room_to) ||
                        (fromRoom?.id === conn.room_to && toRoom?.id === conn.room_from)
                    ) {
                        isInPath = true;
                        console.log(`Edge ${conn.room_from}-${conn.room_to} is in path: ${currentRoomName} -> ${nextRoomName}`);
                        break;
                    }
                }
            }

            const isConnectedToSelected = selectedNode && 
                (conn.room_from === selectedNode || conn.room_to === selectedNode);

            return {
                id: conn.id,
                from: conn.room_from,
                to: conn.room_to,
                // FIXED: Path edges are YELLOW, others are gray
                color: isInPath
                    ? { color: '#F59E0B', highlight: '#FBBF24', hover: '#F59E0B', opacity: 1 } // Yellow for path
                    : isConnectedToSelected
                    ? { color: '#FF6B00', highlight: '#FF8C42', hover: '#FF6B00', opacity: 1 } // Orange for selected
                    : { color: '#9CA3AF', highlight: '#6B7280', hover: '#9CA3AF', opacity: 0.7 }, // Gray for normal
                width: isInPath ? 4 : isConnectedToSelected ? 3 : 2,
                dashes: isInPath || isConnectedToSelected ? false : [5, 5],
                arrows: { to: { enabled: false }, from: { enabled: false } },
                smooth: { enabled: true, type: 'continuous', roundness: 0.5 },
                shadow: isInPath || isConnectedToSelected,
                hoverWidth: width => width + 1,
                selectionWidth: width => width + 1
            };
        })
    );

    const data = { nodes, edges };
    
    const options = {
      layout: {
        improvedLayout: true,
        randomSeed: 42,
        hierarchical: {
          enabled: false
        }
      },
      physics: {
        enabled: true,
        stabilization: {
          enabled: true,
          iterations: 500,  // FIXED: More iterations for better spacing
          updateInterval: 10
        },
        barnesHut: {
          gravitationalConstant: -2000,  // FIXED: Reduce gravity for wider spacing
          springConstant: 0.005,         // FIXED: Very soft springs for longer edges
          springLength: 450,             // FIXED: Increase to 450px for longer edges
          damping: 0.4,                  // FIXED: Higher damping for stability
          avoidOverlap: 4.0              // FIXED: Strong overlap avoidance
        },
        solver: 'barnesHut',
        timestep: 0.15,
        repulsion: {
          nodeDistance: 450,             // FIXED: Increase repulsion distance to 450px
          springLength: 450,
          springConstant: 0.005,
          centralGravity: 0.003
        },
        maxVelocity: 15,
        minVelocity: 1,
        stabilizationIterations: 500
      },
      interaction: {
        hover: true,
        hoverConnectedEdges: true,
        tooltipDelay: 100,
        hideEdgesOnDrag: false,
        hideNodesOnDrag: false,
        selectConnectedEdges: true,
        multiselect: false,
        dragNodes: true,  // FIXED: Enable node dragging
        dragView: true,
        zoomView: true,
        navigationButtons: false
      },
      nodes: {
        physics: true,  // FIXED: Enable physics for nodes
        fixed: {
          x: false,  // FIXED: Allow X movement
          y: false   // FIXED: Allow Y movement
        },
        shapeProperties: {
          useBorderWithImage: true,
          interpolation: false
        },
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.2)',
          size: 10,
          x: 5,
          y: 5
        },
        font: {
          multi: true,
          maxWdt: 120,
          align: 'center'
        },
        widthConstraint: {
          minimum: 80,
          maximum: 150
        },
        heightConstraint: {
          minimum: 40,
          maximum: 80
        },
        // FIXED: Keep node margin same, focus on distance
        margin: {
          top: 25,
          right: 25,
          bottom: 25,
          left: 25
        },
        scaling: {
          min: 15,    // FIXED: Keep node size same
          max: 35,
          label: {
            enabled: true,
            min: 12,
            max: 18,
            maxVisible: 30,
            drawThreshold: 5
          }
        },
        size: 40,     // FIXED: Keep node size same
        borderWidth: 3,
        chosen: {
          node: function(values, id, selected, hovering) {
            values.shadowSize = 15;
            values.shadowX = 3;
            values.shadowY = 3;
            values.borderWidth = 5;
          }
        }
      },
      edges: {
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.2)',
          size: 5,
          x: 3,
          y: 3
        },
        smooth: {
          enabled: true,
          type: 'straightCross',
          forceDirection: 'none',
          roundness: 0.02  // FIXED: Minimal curve
        },
        length: 450,      // FIXED: Increase edge length to 450px
        physics: false,
        scaling: {
          min: 1,
          max: 2
        },
        endPointOffset: {
          from: 35,       // FIXED: Increase offset for longer edges
          to: 35
        },
        color: {
          inherit: false
        }
      },
      height: '400px',  // FIXED: Reduce from 500px to 400px
      width: '100%',
      autoResize: true,
      clickToUse: false,
      configure: {
        enabled: false,
        filter: 'nodes,edges',
        showButton: false
      }
    };

    // Destroy existing network if any
    if (network) {
      network.destroy();
    }

    const networkInstance = new Network(networkRef.current, data, options);
    
    // FIXED: Simplified stabilization - allow nodes to be movable after stabilization
    networkInstance.on('stabilizationIterationsDone', () => {
      console.log('Network stabilization completed');
      
      setTimeout(() => {
        const nodePositions = networkInstance.getPositions();
        const nodeIds = Object.keys(nodePositions);
        
        const minDistance = 400;  // FIXED: Minimum distance 400px between nodes
        const adjustedPositions = {};
        const maxIterations = 8;  // FIXED: More iterations for better spacing
        let iteration = 0;
        
        while (iteration < maxIterations) {
          let hasCollisions = false;
          
          nodeIds.forEach((nodeId) => {
            const currentPos = nodePositions[nodeId] || adjustedPositions[nodeId];
            let adjustedPos = { ...currentPos };
            
            nodeIds.forEach((otherNodeId) => {
              if (nodeId !== otherNodeId) {
                const otherPos = nodePositions[otherNodeId] || adjustedPositions[otherNodeId];
                const distance = Math.sqrt(
                  Math.pow(currentPos.x - otherPos.x, 2) + 
                  Math.pow(currentPos.y - otherPos.y, 2)
                );
                
                if (distance < minDistance) {
                  hasCollisions = true;
                  const angle = Math.atan2(currentPos.y - otherPos.y, currentPos.x - otherPos.x);
                  const pushDistance = (minDistance - distance) / 2 + 50;  // FIXED: Stronger push
                  
                  adjustedPos.x += Math.cos(angle) * pushDistance;
                  adjustedPos.y += Math.sin(angle) * pushDistance;
                }
              }
            });
            
            adjustedPositions[nodeId] = adjustedPos;
          });
          
          Object.keys(adjustedPositions).forEach(nodeId => {
            nodePositions[nodeId] = adjustedPositions[nodeId];
          });
          
          iteration++;
          if (!hasCollisions) break;
        }
        
        networkInstance.setPositions(adjustedPositions);
        
        // FIXED: Don't fix nodes after positioning - keep them movable
        const finalUpdateData = nodeIds.map(nodeId => ({
          id: parseInt(nodeId),
          fixed: {
            x: false,  // FIXED: Keep movable
            y: false   // FIXED: Keep movable
          },
          physics: true  // FIXED: Keep physics enabled
        }));
        
        nodes.update(finalUpdateData);
        
        setTimeout(() => {
          networkInstance.fit({
            animation: {
              duration: 2000,  // FIXED: Longer animation for better view
              easingFunction: 'easeInOutQuad'
            }
          });
        }, 300);
      }, 1000);  // FIXED: Longer delay for better stabilization
    });

    // FIXED: Add drag event handlers to maintain interactivity
    networkInstance.on('dragStart', (properties) => {
      if (properties.nodes.length > 0) {
        networkRef.current.style.cursor = 'grabbing';
      }
    });

    networkInstance.on('dragging', (properties) => {
      // Optional: Add any dragging behavior here
    });

    networkInstance.on('dragEnd', (properties) => {
      networkRef.current.style.cursor = 'grab';
    });

    // Add event listeners
    networkInstance.on('click', (properties) => {
      if (properties.nodes.length > 0) {
        const nodeId = properties.nodes[0];
        setSelectedNode(nodeId);
        const room = rooms.find(r => r.id === nodeId);
        if (room && onNodeClick) {
          onNodeClick(room);
        }
        
        // Highlight connected edges
        networkInstance.selectNodes([nodeId]);
      } else {
        setSelectedNode(null);
        networkInstance.unselectAll();
      }
    });

    networkInstance.on('doubleClick', (properties) => {
      if (properties.nodes.length > 0) {
        const nodeId = properties.nodes[0];
        networkInstance.focus(nodeId, {
          scale: 1.5,
          animation: {
            duration: 1000,
            easingFunction: 'easeInOutQuad'
          }
        });
      }
    });

    networkInstance.on('hoverNode', (properties) => {
      networkInstance.canvas.body.container.style.cursor = 'pointer';
    });

    networkInstance.on('blurNode', (properties) => {
      networkInstance.canvas.body.container.style.cursor = 'default';
    });

    networkInstance.on('stabilizationIterationsDone', () => {
      networkInstance.fit({
        animation: {
          duration: 1000,
          easingFunction: 'easeInOutQuad'
        }
      });
    });

    setNetwork(networkInstance);

    // Cleanup function
    return () => {
      if (networkInstance) {
        networkInstance.off('click');
        networkInstance.off('doubleClick');
        networkInstance.off('hoverNode');
        networkInstance.off('blurNode');
        networkInstance.off('stabilizationIterationsDone');
        networkInstance.off('dragStart');  // FIXED: Add cleanup for drag events
        networkInstance.off('dragging');
        networkInstance.off('dragEnd');
        networkInstance.destroy();
      }
    };
  }, [rooms, connections, pathResult, startRoom, targetRoom, selectedNode]);

  // Utility functions
  const focusOnNode = (roomName) => {
    if (!network) return;
    const room = rooms.find(r => r.nama_ruangan === roomName);
    if (room) {
      setSelectedNode(room.id);
      // Focus on the node by moving the view
      network.focus(room.id, {
        scale: 1.3,
        animation: {
          duration: 800,
          easingFunction: 'easeInOutQuad'
        }
      });
      network.selectNodes([room.id]);
    }
  };

  const resetView = () => {
    if (network) {
      setSelectedNode(null);
      network.unselectAll();
      // Reset view to fit all nodes
      network.fit({
        animation: {
          duration: 1000,
          easingFunction: 'easeInOutQuad'
        }
      });
    }
  };

  const zoomIn = () => {
    if (network) {
      const currentScale = network.getScale();
      network.moveTo({
        scale: Math.min(currentScale * 1.2, 3), // Max zoom limit
        animation: {
          duration: 300,
          easingFunction: 'easeInOutQuad'
        }
      });
    }
  };

  const zoomOut = () => {
    if (network) {
      const currentScale = network.getScale();
      network.moveTo({
        scale: Math.max(currentScale * 0.8, 0.3), // Min zoom limit
        animation: {
          duration: 300,
          easingFunction: 'easeInOutQuad'
        }
      });
    }
  };

  const exportGraph = () => {
    if (network) {
      const dataUrl = network.canvas.frame.canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `graph-visualization-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Visualisasi Graph Ruangan</h3>
          <p className="text-sm text-gray-600">
            {rooms.length} ruangan • {connections.length} koneksi
            {pathResult?.jalur_optimal && ` • ${pathResult.jalur_optimal.length} langkah jalur optimal`}
            <span className="ml-2 text-gray-500 italic">(Jarak antar node: 400px minimum)</span>
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* FIXED: Re-add zoom controls since zoom is enabled */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={zoomOut}
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              title="Zoom Out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <button
              onClick={resetView}
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              title="Reset View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={zoomIn}
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              title="Zoom In"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          
          <button
            onClick={exportGraph}
            className="bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600 transition-colors flex items-center"
            title="Export as PNG"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-sm">Start (🚀)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-sm">Target (🎯)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm">Hijau (&lt;70%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
          <span className="text-sm">Kuning (70-90%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
          <span className="text-sm">Merah (≥90%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-6 h-1 bg-yellow-500 mr-2"></div>
          <span className="text-sm">Jalur Optimal</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-orange-500 rounded-full mr-2"></div>
          <span className="text-sm">Selected</span>
        </div>
      </div>

      {/* Path Navigation */}
      {pathResult?.jalur_optimal && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-blue-800">Navigasi Jalur:</h4>
            <span className="text-sm text-blue-600">
              {pathResult.jalur_optimal.length} ruangan • {pathResult.jalur_optimal.length - 1} langkah
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {pathResult.jalur_optimal.map((roomName, index) => (
              <button
                key={index}
                onClick={() => focusOnNode(roomName)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all hover:scale-105 ${
                  index === 0 ? 'bg-blue-500 text-white' :
                  index === pathResult.jalur_optimal.length - 1 ? 'bg-purple-500 text-white' :
                  'bg-yellow-500 text-white'
                }`}
                title={`Focus ke ${roomName}`}
              >
                {index === 0 ? '🚀' : index === pathResult.jalur_optimal.length - 1 ? '🎯' : `📍${index}`}
                <span className="ml-1">{roomName}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Graph Container */}
      <div className="relative">
        <div 
          ref={networkRef} 
          className="border border-gray-200 rounded-lg bg-gray-50 cursor-grab active:cursor-grabbing"
          style={{ height: '400px', minHeight: '400px' }}  // FIXED: Reduce from 500px/800px to 400px
        />
        
        {/* Loading Overlay */}
        {!network && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-80 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Menyiapkan visualisasi graph...</p>
            </div>
          </div>
        )}
      </div>

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h4 className="font-semibold text-orange-800 mb-2">Ruangan Terpilih</h4>
          {(() => {
            const room = rooms.find(r => r.id === selectedNode);
            if (!room) return null;
            const percentage = (room.occupancy / room.kapasitas_max) * 100;
            
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-sm text-orange-600">Nama:</span>
                  <p className="font-semibold">{room.nama_ruangan}</p>
                </div>
                <div>
                  <span className="text-sm text-orange-600">Occupancy:</span>
                  <p className="font-semibold">{room.occupancy}/${room.kapasitas_max}</p>
                </div>
                <div>
                  <span className="text-sm text-orange-600">Status:</span>
                  <p className={`font-semibold ${
                    percentage < 70 ? 'text-green-600' :
                    percentage < 90 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {percentage.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <span className="text-sm text-orange-600">Luas:</span>
                  <p className="font-semibold">{room.luas} m²</p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 text-xs text-gray-500">
        <p>💡 <strong>Tips:</strong> Klik node untuk detail • Drag node untuk memindahkan • Drag canvas untuk menggeser view • Scroll mouse untuk zoom</p>
      </div>
    </div>
  );
};

export default GraphVisualization;