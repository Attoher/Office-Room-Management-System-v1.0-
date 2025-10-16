import React, { useRef, useEffect, useState } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';

const GraphVisualization = ({ rooms, connections, pathResult, startRoom, targetRoom, onNodeClick }) => {
  const networkRef = useRef(null);
  const [network, setNetwork] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!networkRef.current || rooms.length === 0) {
      setIsLoading(false);
      return;
    }

    console.log('=== GRAPH VISUALIZATION DEBUG ===', new Date().toLocaleTimeString());
    console.log('Props received:');
    console.log('- startRoom:', startRoom);
    console.log('- targetRoom:', targetRoom);
    console.log('- pathResult:', pathResult);
    console.log('- rooms count:', rooms.length);
    console.log('- connections count:', connections.length);

    // Handle both response formats
    const normalizedPathResult = pathResult?.data || pathResult;
    
    if (normalizedPathResult) {
      console.log('- jalur_optimal:', normalizedPathResult.jalur_optimal);
      console.log('- ruangan_asal:', normalizedPathResult.ruangan_asal);
      console.log('- ruangan_tujuan:', normalizedPathResult.ruangan_tujuan);
    }

    setIsLoading(true);

    // Create nodes from rooms
    const nodes = new DataSet(
      rooms.map(room => {
        const percentage = (room.occupancy / room.kapasitas_max) * 100;
        
        // Enhanced room name normalization
        const normalizeRoomName = (name) => {
          if (!name) return '';
          return name.toString().trim().toLowerCase().replace(/\s+/g, ' ');
        };

        const roomNormalized = normalizeRoomName(room.nama_ruangan);
        const startNormalized = normalizeRoomName(startRoom);
        const targetNormalized = normalizeRoomName(targetRoom);

        const isStart = startRoom && roomNormalized === startNormalized;
        const isTarget = targetRoom && roomNormalized === targetNormalized;
        
        // Enhanced path checking
        const isInPath = normalizedPathResult?.jalur_optimal?.some(pathRoom => {
          const pathNormalized = normalizeRoomName(pathRoom);
          return pathNormalized === roomNormalized;
        });
        
        const isSelected = selectedNode === room.id;

        // Debug logging for important nodes
        if (isStart) console.log('✅ START ROOM:', room.nama_ruangan, 'ID:', room.id);
        if (isTarget) console.log('🎯 TARGET ROOM:', room.nama_ruangan, 'ID:', room.id);
        if (isInPath) console.log('📍 PATH ROOM:', room.nama_ruangan);

        // Node styling configuration
        let shape = 'box';
        let size = 25;
        let fontSize = 14;
        let borderWidth = 2;
        let shadow = true;

        // Color logic with priority: Selected > Start/Target > Path > Occupancy
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
          size = 30;
          fontSize = 16;
          borderWidth = 3;
        } else if (isStart) {
          // Start room: BLUE
          finalColor = {
            background: '#3B82F6',
            border: '#2563EB',
            highlight: { 
              background: '#60A5FA', 
              border: '#3B82F6' 
            }
          };
          size = 28;
          fontSize = 15;
          borderWidth = 3;
        } else if (isTarget) {
          // Target room: PURPLE
          finalColor = {
            background: '#8B5CF6',
            border: '#7C3AED',
            highlight: { 
              background: '#A78BFA', 
              border: '#8B5CF6' 
            }
          };
          size = 28;
          fontSize = 15;
          borderWidth = 3;
        } else if (isInPath) {
          // Path rooms: YELLOW
          finalColor = {
            background: '#F59E0B',
            border: '#D97706',
            highlight: {
              background: '#FBBF24',
              border: '#F59E0B'
            }
          };
          size = 26;
          fontSize = 14;
          borderWidth = 3;
        } else {
          // Default: based on occupancy
          if (percentage < 70) {
            finalColor = {
              background: '#10B981',
              border: '#059669',
              highlight: {
                background: '#34D399',
                border: '#10B981'
              }
            };
          } else if (percentage < 90) {
            finalColor = {
              background: '#F59E0B',
              border: '#D97706',
              highlight: {
                background: '#FBBF24',
                border: '#F59E0B'
              }
            };
          } else {
            finalColor = {
              background: '#EF4444',
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
          <div class="p-3 max-w-xs bg-white rounded-lg shadow-lg border border-gray-200">
            <div class="font-bold text-gray-900 text-base mb-2">${room.nama_ruangan}</div>
            <div class="space-y-2 text-sm text-gray-700">
              <div class="flex justify-between">
                <span class="text-gray-600">Luas:</span>
                <span class="font-semibold">${room.luas} m²</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Kapasitas:</span>
                <span class="font-semibold">${room.occupancy}/${room.kapasitas_max}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Occupancy:</span>
                <span class="font-semibold ${percentage < 70 ? 'text-green-600' : percentage < 90 ? 'text-yellow-600' : 'text-red-600'}">
                  ${percentage.toFixed(1)}%
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Status:</span>
                <span class="font-semibold ${percentage < 70 ? 'text-green-600' : percentage < 90 ? 'text-yellow-600' : 'text-red-600'}">
                  ${percentage < 70 ? 'Hijau' : percentage < 90 ? 'Kuning' : 'Merah'}
                </span>
              </div>
              ${isStart ? '<div class="mt-2 p-1 bg-blue-100 text-blue-800 text-xs font-bold text-center rounded">🚀 START POINT</div>' : ''}
              ${isTarget ? '<div class="mt-2 p-1 bg-purple-100 text-purple-800 text-xs font-bold text-center rounded">🎯 TARGET POINT</div>' : ''}
              ${isInPath ? '<div class="mt-2 p-1 bg-yellow-100 text-yellow-800 text-xs font-bold text-center rounded">📍 DALAM JALUR OPTIMAL</div>' : ''}
            </div>
          </div>
        `;

        return {
          id: room.id,
          label: room.nama_ruangan,
          title: tooltipContent,
          color: finalColor,
          shape: shape,
          size: size,
          font: { 
            size: fontSize, 
            color: isStart || isTarget || isSelected ? '#FFFFFF' : '#1F2937',
            face: 'Inter, system-ui, sans-serif',
            bold: isStart || isTarget || isSelected,
            multi: true,
            maxWdt: 120,
            align: 'center'
          },
          borderWidth: borderWidth,
          shadow: shadow,
          mass: isStart || isTarget ? 2 : 1,
          widthConstraint: {
            minimum: 80,
            maximum: 150
          },
          heightConstraint: {
            minimum: 40,
            maximum: 80
          },
          physics: true
        };
      })
    );

    // Create edges from connections
    const edges = new DataSet(
      connections.map(conn => {
        let isInPath = false;

        // Check if this edge is part of the optimal path
        if (normalizedPathResult?.jalur_optimal?.length > 1) {
          for (let i = 0; i < normalizedPathResult.jalur_optimal.length - 1; i++) {
            const currentRoomName = normalizedPathResult.jalur_optimal[i]?.toString().trim().toLowerCase();
            const nextRoomName = normalizedPathResult.jalur_optimal[i + 1]?.toString().trim().toLowerCase();

            const fromRoom = rooms.find(r => 
              r.nama_ruangan.trim().toLowerCase() === currentRoomName
            );
            const toRoom = rooms.find(r => 
              r.nama_ruangan.trim().toLowerCase() === nextRoomName
            );

            // Check both directions since connections are bidirectional
            if (
              (fromRoom?.id === conn.room_from && toRoom?.id === conn.room_to) ||
              (fromRoom?.id === conn.room_to && toRoom?.id === conn.room_from)
            ) {
              isInPath = true;
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
          color: isInPath
            ? { 
                color: '#F59E0B', 
                highlight: '#FBBF24', 
                hover: '#F59E0B', 
                opacity: 1 
              }
            : isConnectedToSelected
            ? { 
                color: '#FF6B00', 
                highlight: '#FF8C42', 
                hover: '#FF6B00', 
                opacity: 1 
              }
            : { 
                color: '#9CA3AF', 
                highlight: '#6B7280', 
                hover: '#9CA3AF', 
                opacity: 0.7 
              },
          width: isInPath ? 4 : isConnectedToSelected ? 3 : 2,
          dashes: isInPath || isConnectedToSelected ? false : [5, 5],
          arrows: { to: { enabled: false }, from: { enabled: false } },
          smooth: { enabled: true, type: 'continuous', roundness: 0.3 },
          shadow: isInPath || isConnectedToSelected,
          hoverWidth: width => width + 1,
          selectionWidth: width => width + 1,
          physics: false
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
          iterations: 1000,
          updateInterval: 25
        },
        barnesHut: {
          gravitationalConstant: -2000,
          springConstant: 0.04,
          springLength: 200,
          damping: 0.09,
          avoidOverlap: 0.8
        },
        solver: 'barnesHut',
        timestep: 0.5,
        adaptiveTimestep: true,
        repulsion: {
          nodeDistance: 200,
          centralGravity: 0.2,
          springLength: 200,
          springConstant: 0.05,
          damping: 0.09
        },
        maxVelocity: 50,
        minVelocity: 0.1
      },
      interaction: {
        hover: true,
        hoverConnectedEdges: true,
        tooltipDelay: 200,
        hideEdgesOnDrag: false,
        hideNodesOnDrag: false,
        selectConnectedEdges: true,
        multiselect: false,
        dragNodes: true,
        dragView: true,
        zoomView: true,
        navigationButtons: false,
        keyboard: {
          enabled: true,
          speed: { x: 10, y: 10, zoom: 0.02 },
          bindToWindow: true
        }
      },
      nodes: {
      physics: true,
      fixed: {
        x: false,
        y: false
      },
      shapeProperties: {
        useBorderWithImage: false,
        useImageSize: false,
        interpolation: false
      },
      shadow: {
        enabled: true,
        color: 'rgba(0,0,0,0.3)',
        size: 8,
        x: 3,
        y: 3
      },
      font: {
        multi: true,
        // PERBAIKAN: Ganti maxWdt dengan size
        size: 14,
        face: 'Inter, system-ui, sans-serif',
        align: 'center',
        strokeWidth: 2,
        strokeColor: 'rgba(255,255,255,0.8)'
      },
      // PERBAIKAN: Gunakan properti yang valid untuk constraints
      widthConstraint: {
        minimum: 80
        // Hapus maximum karena tidak valid
      },
      margin: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
      },
      scaling: {
        min: 10,
        max: 30,
        label: {
          enabled: true,
          min: 8,
          max: 16,
          maxVisible: 25,
          drawThreshold: 3
        }
      },
      chosen: {
        // PERBAIKAN: Hapus edge dari nodes.chosen
        node: function(values, id, selected, hovering) {
          if (selected || hovering) {
            values.shadowSize = 15;
            values.shadowX = 5;
            values.shadowY = 5;
            values.borderWidth = 4;
          }
        }
        // Hapus edge property dari sini
      }
    },
    
    edges: {
      shadow: {
        enabled: true,
        color: 'rgba(0,0,0,0.2)',
        size: 3,
        x: 2,
        y: 2
      },
      smooth: {
        enabled: true,
        type: 'continuous',
        forceDirection: 'none',
        roundness: 0.2
      },
      length: 150,
      physics: false,
      scaling: {
        min: 1,
        max: 5
      },
      chosen: {
        // PERBAIKAN: Pindah edge chosen ke sini
        edge: function(values, id, selected, hovering) {
          if (selected || hovering) {
            values.width = values.width * 1.5;
          }
        }
      }
    },
      height: '500px',
      width: '100%',
      autoResize: true,
      clickToUse: false,
      configure: {
        enabled: false,
        filter: 'nodes,edges',
        showButton: false
      },
      manipulation: {
        enabled: false
      }
    };

    // Clean up existing network
    if (network) {
      try {
        network.off('click');
        network.off('doubleClick');
        network.off('hoverNode');
        network.off('blurNode');
        network.off('stabilizationIterationsDone');
        network.off('dragStart');
        network.off('dragging');
        network.off('dragEnd');
        network.destroy();
      } catch (error) {
        console.warn('Error cleaning up network:', error);
      }
    }

    // Create new network instance
    const networkInstance = new Network(networkRef.current, data, options);
    
    // Event handlers
    networkInstance.on('stabilizationIterationsDone', () => {
      console.log('Network stabilization completed');
      setIsLoading(false);
      
      // Fit to view after stabilization
      setTimeout(() => {
        networkInstance.fit({
          animation: {
            duration: 1500,
            easingFunction: 'easeInOutQuad'
          }
        });
      }, 500);
    });

    networkInstance.on('stabilizationProgress', (params) => {
      console.log(`Stabilization progress: ${params.iterations} / ${params.total}`);
    });

    networkInstance.on('click', (properties) => {
      if (properties.nodes.length > 0) {
        const nodeId = properties.nodes[0];
        setSelectedNode(nodeId);
        const room = rooms.find(r => r.id === nodeId);
        if (room && onNodeClick) {
          onNodeClick(room);
        }
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
          scale: 1.8,
          animation: {
            duration: 800,
            easingFunction: 'easeInOutQuad'
          }
        });
      }
    });

    networkInstance.on('hoverNode', (properties) => {
      networkRef.current.style.cursor = 'pointer';
    });

    networkInstance.on('blurNode', (properties) => {
      networkRef.current.style.cursor = 'grab';
    });

    networkInstance.on('dragStart', (properties) => {
      if (properties.nodes.length > 0) {
        networkRef.current.style.cursor = 'grabbing';
      }
    });

    networkInstance.on('dragEnd', (properties) => {
      networkRef.current.style.cursor = 'grab';
    });

    networkInstance.on('zoom', (properties) => {
      // Optional: Handle zoom events
    });

    // Handle window resize
    const handleResize = () => {
      if (networkInstance) {
        setTimeout(() => {
          networkInstance.redraw();
          networkInstance.fit({
            animation: { duration: 500 }
          });
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);

    setNetwork(networkInstance);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      if (networkInstance) {
        try {
          networkInstance.off('click');
          networkInstance.off('doubleClick');
          networkInstance.off('hoverNode');
          networkInstance.off('blurNode');
          networkInstance.off('stabilizationIterationsDone');
          networkInstance.off('stabilizationProgress');
          networkInstance.off('dragStart');
          networkInstance.off('dragEnd');
          networkInstance.off('zoom');
          networkInstance.destroy();
        } catch (error) {
          console.warn('Error during network cleanup:', error);
        }
      }
    };
  }, [rooms, connections, pathResult, startRoom, targetRoom, selectedNode]);

  // Utility functions
  const focusOnNode = (roomName) => {
    if (!network) return;
    const room = rooms.find(r => r.nama_ruangan === roomName);
    if (room) {
      setSelectedNode(room.id);
      network.focus(room.id, {
        scale: 1.6,
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
        scale: Math.min(currentScale * 1.3, 5),
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
        scale: Math.max(currentScale * 0.7, 0.1),
        animation: {
          duration: 300,
          easingFunction: 'easeInOutQuad'
        }
      });
    }
  };

  const exportGraph = () => {
    if (network) {
      try {
        const dataUrl = network.canvas.frame.canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `office-room-graph-${new Date().toISOString().split('T')[0]}.png`;
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('Error exporting graph:', error);
        alert('Gagal mengexport graph. Silakan coba lagi.');
      }
    }
  };

  const normalizedPathResult = pathResult?.data || pathResult;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-800 mb-2">🗺️ Visualisasi Graph Ruangan</h3>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
              {rooms.length} Ruangan
            </span>
            <span className="flex items-center">
              <div className="w-3 h-3 bg-gray-400 rounded mr-2"></div>
              {connections.length} Koneksi
            </span>
            {normalizedPathResult?.jalur_optimal && (
              <span className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
                {normalizedPathResult.jalur_optimal.length} Langkah Jalur
              </span>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Zoom Controls */}
          <div className="flex bg-gray-100 rounded-lg p-1 shadow-sm">
            <button
              onClick={zoomOut}
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              title="Zoom Out"
              disabled={isLoading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <button
              onClick={resetView}
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              title="Reset View"
              disabled={isLoading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={zoomIn}
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              title="Zoom In"
              disabled={isLoading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          
          {/* Export Button */}
          <button
            onClick={exportGraph}
            className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 transition-colors flex items-center shadow-sm"
            title="Export as PNG"
            disabled={isLoading}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 rounded mr-2 shadow-sm"></div>
          <span className="text-sm font-medium">Start (🚀)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-purple-500 rounded mr-2 shadow-sm"></div>
          <span className="text-sm font-medium">Target (🎯)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded mr-2 shadow-sm"></div>
          <span className="text-sm font-medium">Hijau (&lt;70%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-500 rounded mr-2 shadow-sm"></div>
          <span className="text-sm font-medium">Kuning (70-90%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded mr-2 shadow-sm"></div>
          <span className="text-sm font-medium">Merah (≥90%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-6 h-2 bg-yellow-500 rounded mr-2 shadow-sm"></div>
          <span className="text-sm font-medium">Jalur Optimal</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-orange-500 rounded mr-2 shadow-sm"></div>
          <span className="text-sm font-medium">Selected</span>
        </div>
      </div>

      {/* Path Navigation */}
      {normalizedPathResult?.jalur_optimal && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-blue-800 text-lg">🧭 Navigasi Jalur Optimal</h4>
            <span className="text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full font-medium">
              {normalizedPathResult.jalur_optimal.length} ruangan • {normalizedPathResult.jalur_optimal.length - 1} langkah
            </span>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {normalizedPathResult.jalur_optimal.map((roomName, index) => (
              <button
                key={index}
                onClick={() => focusOnNode(roomName)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all hover:scale-105 hover:shadow-md ${
                  index === 0 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : index === normalizedPathResult.jalur_optimal.length - 1 
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'bg-yellow-500 text-white shadow-md'
                }`}
                title={`Focus ke ${roomName}`}
                disabled={isLoading}
              >
                {index === 0 ? '🚀' : index === normalizedPathResult.jalur_optimal.length - 1 ? '🎯' : `📍${index}`}
                <span className="ml-2">{roomName}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Graph Container */}
      <div className="relative">
        <div 
          ref={networkRef} 
          className="border-2 border-gray-200 rounded-lg bg-white cursor-grab active:cursor-grabbing shadow-inner"
          style={{ 
            height: '500px', 
            minHeight: '500px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
          }}
        />
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Menyiapkan visualisasi graph...</p>
              <p className="text-sm text-gray-500 mt-1">Stabilizing network layout</p>
            </div>
          </div>
        )}
      </div>

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="mt-6 p-5 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-300 rounded-xl shadow-sm">
          <h4 className="font-bold text-orange-800 text-lg mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Ruangan Terpilih
          </h4>
          {(() => {
            const room = rooms.find(r => r.id === selectedNode);
            if (!room) return null;
            const percentage = (room.occupancy / room.kapasitas_max) * 100;
            const isStart = startRoom && room.nama_ruangan === startRoom;
            const isTarget = targetRoom && room.nama_ruangan === targetRoom;
            const isInPath = normalizedPathResult?.jalur_optimal?.includes(room.nama_ruangan);
            
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-3 rounded-lg border border-orange-200">
                  <span className="text-sm text-orange-600 font-medium">Nama:</span>
                  <p className="font-bold text-gray-800 text-lg">{room.nama_ruangan}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-orange-200">
                  <span className="text-sm text-orange-600 font-medium">Occupancy:</span>
                  <p className="font-bold text-gray-800 text-lg">{room.occupancy}/{room.kapasitas_max}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-orange-200">
                  <span className="text-sm text-orange-600 font-medium">Status:</span>
                  <p className={`font-bold text-lg ${
                    percentage < 70 ? 'text-green-600' :
                    percentage < 90 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {percentage.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-orange-200">
                  <span className="text-sm text-orange-600 font-medium">Luas:</span>
                  <p className="font-bold text-gray-800 text-lg">{room.luas} m²</p>
                </div>
                
                {/* Special Indicators */}
                <div className="md:col-span-2 lg:col-span-4 flex flex-wrap gap-2 mt-2">
                  {isStart && (
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium border border-blue-200">
                      🚀 Ruangan Asal
                    </span>
                  )}
                  {isTarget && (
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium border border-purple-200">
                      🎯 Ruangan Tujuan
                    </span>
                  )}
                  {isInPath && (
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium border border-yellow-200">
                      📍 Dalam Jalur Optimal
                    </span>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-700 font-medium mb-2">💡 Tips Interaksi:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-center">
            <span className="bg-gray-200 px-2 py-1 rounded mr-2 font-mono">Click</span>
            <span>Pilih ruangan untuk melihat detail</span>
          </div>
          <div className="flex items-center">
            <span className="bg-gray-200 px-2 py-1 rounded mr-2 font-mono">Double Click</span>
            <span>Zoom ke ruangan</span>
          </div>
          <div className="flex items-center">
            <span className="bg-gray-200 px-2 py-1 rounded mr-2 font-mono">Drag Node</span>
            <span>Pindahkan ruangan</span>
          </div>
          <div className="flex items-center">
            <span className="bg-gray-200 px-2 py-1 rounded mr-2 font-mono">Drag Canvas</span>
            <span>Geser view</span>
          </div>
          <div className="flex items-center">
            <span className="bg-gray-200 px-2 py-1 rounded mr-2 font-mono">Scroll</span>
            <span>Zoom in/out</span>
          </div>
          <div className="flex items-center">
            <span className="bg-gray-200 px-2 py-1 rounded mr-2 font-mono">Hover</span>
            <span>Lihat tooltip detail</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphVisualization;