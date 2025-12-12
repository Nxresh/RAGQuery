import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ReactFlow, {
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    MarkerType,
    ReactFlowProvider,
    useReactFlow,
    Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Sparkles, Loader2, ZoomIn, ZoomOut, Maximize, Network } from 'lucide-react';
import { StudioDropZone } from './StudioDropZone';
import { MindMapNode } from './MindMapNode';

const nodeTypes = {
    mindmap: MindMapNode,
};

// Simple tree layout algorithm
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const childrenMap = new Map<string, string[]>();

    // Build children map
    edges.forEach(edge => {
        const current = childrenMap.get(edge.source) || [];
        current.push(edge.target);
        childrenMap.set(edge.source, current);
    });

    // Find root (node with no incoming edges)
    const targets = new Set(edges.map(e => e.target));
    const roots = nodes.filter(n => !targets.has(n.id));

    let currentY = 0;
    const X_SPACING = 350; // Increased spacing for pill shape
    const Y_SPACING = 50;

    const traverse = (nodeId: string, level: number) => {
        const children = childrenMap.get(nodeId) || [];

        if (children.length === 0) {
            const node = nodeMap.get(nodeId);
            if (node) {
                node.position = { x: level * X_SPACING, y: currentY };
                currentY += Y_SPACING;
            }
            return;
        }

        // Process children
        const childrenYStart = currentY;
        children.forEach(childId => traverse(childId, level + 1));
        const childrenYEnd = currentY - Y_SPACING;

        // Center parent relative to children
        const node = nodeMap.get(nodeId);
        if (node) {
            const childrenCenterY = (childrenYStart + childrenYEnd) / 2;
            node.position = { x: level * X_SPACING, y: childrenCenterY };
        }
    };

    roots.forEach(root => traverse(root.id, 0));

    return { nodes, edges };
};

export const MindMapGenerator = ({ sources, onFileUpload, isProcessing }: { sources: any[], onFileUpload: (file: File, type: string) => void, isProcessing: boolean }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [topic, setTopic] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rfInstance, setRfInstance] = useState<any>(null);

    // Fix: Use ref to access latest edges in onNodeToggle without adding it to dependency array
    // This prevents the handler from being recreated and stale closures in node data
    const edgesRef = React.useRef(edges);
    useEffect(() => {
        edgesRef.current = edges;
    }, [edges]);

    const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    const onNodeToggle = useCallback((nodeId: string) => {
        setNodes((nds) => {
            const node = nds.find((n) => n.id === nodeId);
            if (!node) return nds;

            const isExpanded = !node.data.isExpanded;

            // Helper to recursively update visibility based on hierarchy
            const updateVisibility = (currentNodes: Node[], parentId: string, parentExpanded: boolean): Node[] => {
                const parent = currentNodes.find(n => n.id === parentId);
                if (!parent || !parent.data.childrenIds) return currentNodes;

                let updatedNodes = [...currentNodes];

                parent.data.childrenIds.forEach((childId: string) => {
                    const childIndex = updatedNodes.findIndex(n => n.id === childId);
                    if (childIndex !== -1) {
                        const child = updatedNodes[childIndex];
                        // Child is visible ONLY if parent is expanded
                        const isVisible = parentExpanded;

                        updatedNodes[childIndex] = {
                            ...child,
                            hidden: !isVisible
                        };

                        // Recurse: Grandchildren are visible ONLY if (Parent is Expanded AND Child is Expanded)
                        updatedNodes = updateVisibility(updatedNodes, childId, isVisible && child.data.isExpanded);
                    }
                });

                return updatedNodes;
            };

            // 1. Update the clicked node's expansion state
            const nodesWithToggle = nds.map((n) => {
                if (n.id === nodeId) {
                    return { ...n, data: { ...n.data, isExpanded } };
                }
                return n;
            });

            // 2. Recursively update visibility of all descendants
            const updatedNodes = updateVisibility(nodesWithToggle, nodeId, isExpanded);

            // Auto-fit view when expanding/collapsing
            setTimeout(() => {
                if (rfInstance) {
                    // If expanding, focus on the expanded section (Parent + Children)
                    if (isExpanded) {
                        const clickedNode = updatedNodes.find(n => n.id === nodeId);
                        const childrenIds = clickedNode?.data.childrenIds || [];

                        // Focus ONLY on the clicked node and its newly revealed children
                        const nodesToFit = updatedNodes.filter(n =>
                            n.id === nodeId || childrenIds.includes(n.id)
                        );

                        rfInstance.fitView({
                            nodes: nodesToFit.map(n => ({ id: n.id })),
                            duration: 1200, // Slightly slower for smoother transition
                            padding: 0.3,   // Comfortable padding
                            minZoom: 0.5,
                            maxZoom: 1.5    // Allow slightly closer zoom
                        });
                    } else {
                        // If collapsing, fit view to all visible nodes to maintain context
                        rfInstance.fitView({
                            duration: 800,
                            padding: 0.2
                        });
                    }
                }
            }, 100);

            return updatedNodes;
        });
    }, [setNodes, rfInstance]);

    // Effect to sync edge visibility with node visibility
    useEffect(() => {
        setEdges(eds => eds.map(e => {
            const sourceNode = nodes.find(n => n.id === e.source);
            const targetNode = nodes.find(n => n.id === e.target);

            if (sourceNode?.hidden || targetNode?.hidden) {
                return { ...e, hidden: true };
            }
            return { ...e, hidden: false };
        }));
    }, [nodes, setEdges]);


    const [isFullscreen, setIsFullscreen] = useState(false);

    const generateMindMap = async () => {
        if (!topic) return;
        setLoading(true);
        setError(null);

        const context = sources.map(s => s.content || s.text || '').join('\n\n').slice(0, 20000);

        try {
            const res = await fetch('/api/generate-mindmap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, context })
            });

            if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            // Parse Hierarchical Data
            const newNodes: Node[] = [];
            const newEdges: Edge[] = [];

            const traverse = (item: any, parentId: string | null = null, level = 0): string => {
                const id = Math.random().toString(36).substr(2, 9);
                const isRoot = parentId === null;
                const childrenIds: string[] = [];

                // First, process children to get their IDs
                if (item.children) {
                    item.children.forEach((child: any) => {
                        const childId = traverse(child, id, level + 1);
                        childrenIds.push(childId);
                    });
                }

                newNodes.push({
                    id,
                    type: 'mindmap',
                    data: {
                        label: item.label,
                        details: item.details,
                        isExpanded: level === 0, // Root starts expanded
                        hasChildren: childrenIds.length > 0,
                        childrenIds, // Store explicit children IDs
                        onToggle: onNodeToggle,
                        id
                    },
                    position: { x: 0, y: 0 },
                    hidden: level > 1, // Root (0) and its children (1) are visible
                });

                if (parentId) {
                    newEdges.push({
                        id: `e${parentId}-${id}`,
                        source: parentId,
                        target: id,
                        type: 'smoothstep',
                        animated: true,
                        style: { stroke: '#f97316', strokeWidth: 2 },
                    });
                }

                return id;
            };

            traverse(data);

            const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges);
            setNodes(layoutedNodes);
            setEdges(layoutedEdges);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error generating mindmap');
        } finally {
            setLoading(false);
        }
    };

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedNodeId(node.id);
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNodeId(null);
    }, []);

    const selectedNodeData = useMemo(() => {
        if (!selectedNodeId) return null;
        const node = nodes.find(n => n.id === selectedNodeId);
        return node ? node.data : null;
    }, [selectedNodeId, nodes]);

    const containerRef = React.useRef<HTMLDivElement>(null);

    const toggleFullscreen = useCallback(async () => {
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            try {
                await containerRef.current.requestFullscreen();
                setIsFullscreen(true);
            } catch (err) {
                console.error("Error attempting to enable fullscreen:", err);
            }
        } else {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
            // Force resize when entering/exiting
            if (rfInstance) {
                setTimeout(() => rfInstance.fitView(), 100);
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [rfInstance]);

    return (
        <div
            ref={containerRef}
            className={`flex flex-col relative transition-all duration-300 ${isFullscreen ? 'bg-black' : 'h-full bg-black'} overflow-hidden`}
        >

            {/* Animated Background (Alien Style) */}
            {/* Default Background (Transparent/App Background) */}


            <style>{`
                @keyframes scan {
                    0%, 100% { top: 0; }
                    50% { top: 100%; }
                }
                .animate-scan {
                    animation: scan 2s ease-in-out infinite;
                }
            `}</style>

            {/* Header Area */}
            {isFullscreen ? (
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40 backdrop-blur-sm relative z-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <Maximize size={20} className="text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{topic || 'Mindmap'}</h2>
                            <p className="text-xs text-neutral-400">Fullscreen Mode</p>
                        </div>
                    </div>
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
                    >
                        <ZoomOut size={20} /> <span className="text-sm font-medium">Exit Fullscreen</span>
                    </button>
                </div>
            ) : (
                <div className="p-4 flex gap-2 border-b border-white/10 bg-black/20 relative z-10">
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Enter a topic..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 placeholder-neutral-600"
                    />
                    <button
                        onClick={generateMindMap}
                        disabled={loading || !topic}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-orange-900/20"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                        Generate
                    </button>
                    {nodes.length > 0 && (
                        <button
                            onClick={toggleFullscreen}
                            className="bg-white/5 hover:bg-white/10 text-white px-3 py-2 rounded-lg transition-colors border border-white/10"
                            title="Fullscreen"
                        >
                            <Maximize size={18} />
                        </button>
                    )}
                </div>
            )}

            {error && !isFullscreen && (
                <div className="mx-4 mt-4 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm relative z-10">
                    {error}
                </div>
            )}

            {sources.length === 0 && !isFullscreen && (
                <div className="p-4 relative z-10">
                    <StudioDropZone onFileUpload={onFileUpload} isProcessing={isProcessing} />
                </div>
            )}

            {nodes.length === 0 && !loading && !error && sources.length > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500 z-10 pointer-events-none">
                    <div className="w-24 h-24 bg-neutral-900 rounded-full flex items-center justify-center mb-6 border border-neutral-800">
                        <Network size={48} className="opacity-20" />
                    </div>
                    <p className="text-xl font-medium text-neutral-400">Ready to generate your mindmap</p>
                    <p className="text-sm text-neutral-600 mt-2">Enter a topic above to begin</p>
                </div>
            )}

            <div className="flex-1 relative flex overflow-hidden z-0">
                <div className="flex-1 relative">
                    <ReactFlowProvider>
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onNodeClick={onNodeClick}
                            onPaneClick={onPaneClick}
                            onInit={setRfInstance}
                            nodeTypes={nodeTypes}
                            fitView
                            fitViewOptions={{ padding: 0.2, minZoom: 0.5, maxZoom: 2 }}
                            minZoom={0.1}
                            className="bg-transparent"
                        >
                            <Background color="#333" gap={24} size={1} className="opacity-20" />
                            <Controls className="bg-neutral-900 border-neutral-800 [&>button]:bg-neutral-900 [&>button]:border-neutral-800 [&>button]:text-neutral-400 [&>button:hover]:bg-neutral-800 [&>button:hover]:text-white [&>button]:transition-colors" />
                        </ReactFlow>
                    </ReactFlowProvider>
                </div>

                {/* Side Panel for Details */}
                {selectedNodeData && (
                    <div className="w-80 border-l border-white/10 bg-black/80 backdrop-blur-xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300 absolute right-0 top-0 bottom-0 z-10 shadow-2xl">
                        <div className="flex items-start justify-between mb-6">
                            <h3 className="text-xl font-bold text-white leading-tight">{selectedNodeData.label}</h3>
                            <button
                                onClick={() => setSelectedNodeId(null)}
                                className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-white"
                            >
                                <ZoomOut size={16} className="rotate-45" />
                            </button>
                        </div>

                        <div className="prose prose-invert prose-sm">
                            <p className="text-neutral-300 leading-relaxed text-base">
                                {selectedNodeData.details || "No additional details available."}
                            </p>
                        </div>

                        {selectedNodeData.hasChildren && (
                            <div className="mt-8 pt-6 border-t border-white/10">
                                <p className="text-xs font-medium text-orange-500 uppercase tracking-wider mb-3">Subtopics</p>
                                <div className="space-y-2">
                                    {nodes
                                        .filter(n => edges.some(e => e.source === selectedNodeData.id && e.target === n.id))
                                        .map(child => (
                                            <button
                                                key={child.id}
                                                onClick={() => setSelectedNodeId(child.id)}
                                                className="block w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-neutral-300 transition-colors border border-white/5 hover:border-orange-500/30"
                                            >
                                                {child.data.label}
                                            </button>
                                        ))
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
