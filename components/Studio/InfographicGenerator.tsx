import { useState, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, RadialBarChart, RadialBar, FunnelChart, Funnel, LabelList, ComposedChart, ScatterChart, Scatter, ZAxis } from 'recharts';
import { Sparkles, Loader2, Activity, Users, TrendingUp, DollarSign, BarChart as BarChartIcon, Download, Share2, Maximize, ZoomOut, Info, RefreshCw } from 'lucide-react';

import { StudioDropZone } from './StudioDropZone';
import { addToHistory } from '../HistoryPanel';

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#333333', '#4b5563'];

const CustomTooltip = ({ active, payload, label, unit }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-[#171717] border border-[#333] p-4 rounded-lg shadow-xl max-w-xs z-50">
                <p className="text-white font-bold mb-2">{data.name || label}</p>

                {/* Handle Scatter/Bubble Charts (X, Y, Z) */}
                {data.x !== undefined && data.y !== undefined ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3 text-sm">
                        <div className="text-neutral-400">X-Axis:</div>
                        <div className="text-orange-500 font-mono font-bold">{data.x.toLocaleString()}</div>
                        <div className="text-neutral-400">Y-Axis:</div>
                        <div className="text-orange-500 font-mono font-bold">{data.y.toLocaleString()}</div>
                        {data.z !== undefined && (
                            <>
                                <div className="text-neutral-400">Size:</div>
                                <div className="text-orange-500 font-mono font-bold">{data.z.toLocaleString()}</div>
                            </>
                        )}
                    </div>
                ) : (
                    /* Handle Standard & Multi-Series Charts */
                    <div className="flex flex-col gap-2 mb-3">
                        {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill || '#f97316' }} />
                                    <span className="text-neutral-400 text-xs capitalize">
                                        {entry.name === 'value' ? 'Primary' : entry.name === 'value2' ? 'Secondary' : entry.name === 'value3' ? 'Tertiary' : entry.name}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-white font-mono font-bold">
                                        {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                                    </span>
                                    {unit && <span className="text-neutral-500 text-[10px] font-medium">{unit}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {data.explanation && (
                    <div className="text-xs text-neutral-400 leading-relaxed border-t border-white/10 pt-2 mt-2">
                        <span className="text-orange-500/50 font-semibold text-[10px] uppercase tracking-wider block mb-1">Insight</span>
                        {data.explanation}
                    </div>
                )}
            </div>
        );
    }
    return null;
};

export const InfographicGenerator = ({ sources, onFileUpload, isProcessing, initialTopic, restoredContent, onClearRestored }: {
    sources: any[],
    onFileUpload: (file: File, type: string) => void,
    isProcessing: boolean,
    initialTopic?: string,
    restoredContent?: any,
    onClearRestored?: () => void
}) => {
    const [topic, setTopic] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (initialTopic) setTopic(initialTopic);
    }, [initialTopic]);

    // Restore from history
    useEffect(() => {
        if (restoredContent && restoredContent.data) {
            console.log('[Infographic] Restoring content:', restoredContent);
            setData(restoredContent.data);
            if (restoredContent.topic) setTopic(restoredContent.topic);
            if (onClearRestored) setTimeout(onClearRestored, 100);
        }
    }, [restoredContent, onClearRestored]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const generateInfographic = async () => {
        if (!topic) return;
        setLoading(true);

        // Combine text from sources
        const context = sources.map(s => s.content || s.text || '').join('\n\n').slice(0, 20000);

        try {
            const res = await fetch('/api/generate-infographic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, context, mode: 'advanced' })
            });
            const result = await res.json();
            setData(result);

            // Save to history
            const historyItems = addToHistory('ares_studio_history', topic, 'Infographic');
            const historyId = historyItems[0].id;
            localStorage.setItem(`ares_studio_${historyId}`, JSON.stringify({
                content: { data: result, topic },
                tab: 'infographic'
            }));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'activity': return <Activity className="text-orange-500" size={18} />;
            case 'users': return <Users className="text-blue-500" size={18} />;
            case 'trending-up': return <TrendingUp className="text-green-500" size={18} />;
            case 'dollar-sign': return <DollarSign className="text-yellow-500" size={18} />;
            case 'bar-chart': return <BarChartIcon className="text-purple-500" size={18} />;
            default: return <Info className="text-neutral-500" size={18} />;
        }
    };

    const formatText = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <span key={index} className="font-bold text-orange-500">{part.slice(2, -2)}</span>;
            }
            return part;
        });
    };

    return (
        <div ref={containerRef} className={`h-full flex flex-col bg-[#09090b] ${isFullscreen ? 'overflow-hidden' : ''}`}>
            {isFullscreen ? (
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40 backdrop-blur-sm sticky top-0 z-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <Maximize size={20} className="text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{data?.title || topic || 'Infographic'}</h2>
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
                <div className="p-4 flex gap-2 border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-10">
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Enter a topic for infographic..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors"
                    />
                    <button
                        onClick={generateInfographic}
                        disabled={loading || !topic}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-orange-900/20"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                        Generate
                    </button>
                    {data && (
                        <>
                            <button className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Download Image">
                                <Download size={20} />
                            </button>
                            <button className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Share">
                                <Share2 size={20} />
                            </button>
                        </>
                    )}
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Fullscreen"
                    >
                        <Maximize size={20} />
                    </button>

                </div>
            )}

            {sources.length === 0 && !data && (
                <div className="p-4">
                    <StudioDropZone onFileUpload={onFileUpload} isProcessing={isProcessing} />
                </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[#09090b]">
                {data ? (
                    <div className="max-w-6xl mx-auto space-y-8">
                        {/* Header */}
                        <div className="text-center space-y-4 mb-12">
                            <h2 className="text-5xl font-extrabold bg-gradient-to-r from-orange-400 via-red-500 to-orange-600 bg-clip-text text-transparent pb-2">
                                {data.title}
                            </h2>
                            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">Comprehensive data analysis and visual insights generated from your knowledge base.</p>
                        </div>

                        {/* Stats Grid */}
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Key Statistics</h3>
                            <button onClick={generateInfographic} disabled={loading} className="text-xs flex items-center gap-2 text-neutral-500 hover:text-orange-500 transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 hover:border-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed">
                                {loading ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" /> Refreshing...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw size={14} /> Refresh Data
                                    </>
                                )}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {data.stats?.map((stat: any, idx: number) => (
                                <div key={idx} className="bg-neutral-900/50 border border-white/5 p-6 rounded-2xl flex items-start gap-4 hover:bg-neutral-900 transition-colors group">
                                    <div className="p-3 bg-orange-500/10 rounded-xl group-hover:bg-orange-500/20 transition-colors">
                                        {getIcon(stat.icon)}
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                                        <div className="text-sm font-medium text-orange-500 mb-1">{stat.label}</div>
                                        {stat.description && (
                                            <div className="text-xs text-neutral-500 leading-relaxed">{stat.description}</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {data.charts?.map((chart: any, idx: number) => (
                                <div key={idx} className="bg-neutral-900/50 border border-white/5 p-6 rounded-2xl min-h-[400px] flex flex-col">
                                    <h3 className="text-lg font-semibold mb-2 text-white flex items-center gap-2">
                                        <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
                                        {chart.title}
                                    </h3>
                                    {chart.description && (
                                        <p className="text-xs text-neutral-400 mb-4 ml-3">{chart.description}</p>
                                    )}
                                    <div className="flex-1 min-h-[300px]">
                                        {chart.type === 'pie' ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={chart.data}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={80}
                                                        outerRadius={110}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                        stroke="none"
                                                    >
                                                        {chart.data?.map((_entry: any, index: number) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip content={<CustomTooltip unit={chart.unit} />} cursor={{ stroke: '#ffffff20' }} />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : chart.type === 'line' ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={chart.data}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                                    <XAxis dataKey="name" stroke="#666" tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                                                    <YAxis stroke="#666" tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                                                    <Tooltip content={<CustomTooltip unit={chart.unit} />} cursor={{ stroke: '#ffffff20' }} />
                                                    <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={3} dot={{ fill: '#f97316', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        ) : chart.type === 'area' || chart.type === 'streamgraph' ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chart.type === 'streamgraph' ? chart.data.map((d: any) => ({
                                                    ...d,
                                                    value: Number(String(d.value).replace(/,/g, '')),
                                                    value2: d.value2 ? Number(String(d.value2).replace(/,/g, '')) : Number(String(d.value).replace(/,/g, '')) * 0.8,
                                                    value3: d.value3 ? Number(String(d.value3).replace(/,/g, '')) : Number(String(d.value).replace(/,/g, '')) * 0.6
                                                })) : chart.data.map((d: any) => {
                                                    const val = typeof d.value === 'string' ? parseFloat(d.value.replace(/,/g, '')) : Number(d.value);
                                                    return {
                                                        ...d,
                                                        value: val,
                                                        value2: d.value2 ?? val * 1.4,
                                                        value3: d.value3 ?? val * 1.8
                                                    };
                                                })} stackOffset={chart.type === 'streamgraph' ? "silhouette" : "none"}>
                                                    <defs>
                                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.9} />
                                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0.2} />
                                                        </linearGradient>
                                                        <linearGradient id="colorValue2" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.8} />
                                                            <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.2} />
                                                        </linearGradient>
                                                        <linearGradient id="colorValue3" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#ea580c" stopOpacity={0.6} />
                                                            <stop offset="95%" stopColor="#ea580c" stopOpacity={0.1} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                                    <XAxis dataKey="name" stroke="#666" tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                                                    <YAxis stroke="#666" tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                                                    <Tooltip content={<CustomTooltip unit={chart.unit} />} cursor={{ stroke: '#ffffff20' }} />
                                                    <Area type="monotone" dataKey="value3" stroke="#ea580c" strokeWidth={2} fillOpacity={1} fill="url(#colorValue3)" />
                                                    <Area type="monotone" dataKey="value2" stroke="#fbbf24" strokeWidth={2} fillOpacity={1} fill="url(#colorValue2)" />
                                                    <Area type="monotone" dataKey="value" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : chart.type === 'radar' ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chart.data}>
                                                    <PolarGrid stroke="#333" />
                                                    <PolarAngleAxis dataKey="name" tick={{ fill: '#888', fontSize: 12 }} />
                                                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#666' }} axisLine={false} />
                                                    <Radar name="Value" dataKey="value" stroke="#f97316" strokeWidth={2} fill="#f97316" fillOpacity={0.3} />
                                                    <Tooltip content={<CustomTooltip unit={chart.unit} />} cursor={{ stroke: '#ffffff20' }} />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        ) : chart.type === 'radial' ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" barSize={10} data={chart.data}>
                                                    <RadialBar
                                                        label={{ position: 'insideStart', fill: '#fff' }}
                                                        background
                                                        dataKey="value"
                                                    >
                                                        {chart.data?.map((_entry: any, index: number) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </RadialBar>
                                                    <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{ right: 0 }} />
                                                    <Tooltip content={<CustomTooltip unit={chart.unit} />} cursor={{ stroke: '#ffffff20' }} />
                                                </RadialBarChart>
                                            </ResponsiveContainer>
                                        ) : chart.type === 'funnel' ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <FunnelChart>
                                                    <Tooltip content={<CustomTooltip unit={chart.unit} />} cursor={{ stroke: '#ffffff20' }} />
                                                    <Funnel
                                                        dataKey="value"
                                                        data={chart.data}
                                                        isAnimationActive
                                                    >
                                                        <LabelList position="right" fill="#fff" stroke="none" dataKey="name" />
                                                        {chart.data?.map((_entry: any, index: number) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Funnel>
                                                </FunnelChart>
                                            </ResponsiveContainer>
                                        ) : chart.type === 'mixed' ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ComposedChart data={chart.data}>
                                                    <CartesianGrid stroke="#333" strokeDasharray="3 3" vertical={false} />
                                                    <XAxis dataKey="name" stroke="#666" tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                                                    <YAxis stroke="#666" tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                                                    <Tooltip content={<CustomTooltip unit={chart.unit} />} cursor={{ stroke: '#ffffff20' }} />
                                                    <Legend />
                                                    <Bar dataKey="value" barSize={20} fill="#f97316" radius={[4, 4, 0, 0]} />
                                                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                                                </ComposedChart>
                                            </ResponsiveContainer>
                                        ) : chart.type === 'bubble' || chart.type === 'scatter' ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ScatterChart>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                                    <XAxis type="number" dataKey="x" name="X Axis" stroke="#666" tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                                                    <YAxis type="number" dataKey="y" name="Y Axis" stroke="#666" tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                                                    <ZAxis type="number" dataKey="z" range={[50, 400]} name="Size" />
                                                    <Tooltip content={<CustomTooltip unit={chart.unit} />} cursor={{ strokeDasharray: '3 3' }} />
                                                    <Scatter name="Values" data={chart.data} fill="#f97316" />
                                                </ScatterChart>
                                            </ResponsiveContainer>
                                        ) : chart.type === 'donut' ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={chart.data}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={100}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                        stroke="none"
                                                    >
                                                        {chart.data?.map((_entry: any, index: number) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip content={<CustomTooltip unit={chart.unit} />} cursor={{ stroke: '#ffffff20' }} />
                                                    <Legend />
                                                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-white text-xl font-bold">
                                                        {chart.data.reduce((acc: number, cur: any) => acc + (Number(cur.value) || 0), 0)}
                                                    </text>
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : chart.type === 'network' ? (
                                            <div className="relative w-full h-full flex items-center justify-center bg-black/20 rounded-lg overflow-hidden">
                                                {chart.data?.nodes && Array.isArray(chart.data.nodes) && chart.data.nodes.length > 0 ? (
                                                    <svg width="100%" height="100%" viewBox="0 0 400 300" className="overflow-visible">
                                                        <defs>
                                                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="22" refY="3.5" orient="auto">
                                                                <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
                                                            </marker>
                                                        </defs>
                                                        {chart.data.links?.map((link: any, i: number) => {
                                                            // Robust finding: Handle case sensitivity and string/number mismatch
                                                            const sourceIndex = chart.data.nodes.findIndex((n: any) => String(n.id).toLowerCase() === String(link.source).toLowerCase());
                                                            const targetIndex = chart.data.nodes.findIndex((n: any) => String(n.id).toLowerCase() === String(link.target).toLowerCase());

                                                            if (sourceIndex === -1 || targetIndex === -1) return null;

                                                            // Force Circular Layout
                                                            const totalNodes = chart.data.nodes.length;
                                                            const centerX = 200;
                                                            const centerY = 150;
                                                            const radius = 100;

                                                            const sx = centerX + radius * Math.cos((sourceIndex * 2 * Math.PI) / totalNodes);
                                                            const sy = centerY + radius * Math.sin((sourceIndex * 2 * Math.PI) / totalNodes);
                                                            const tx = centerX + radius * Math.cos((targetIndex * 2 * Math.PI) / totalNodes);
                                                            const ty = centerY + radius * Math.sin((targetIndex * 2 * Math.PI) / totalNodes);

                                                            return <line key={i} x1={sx} y1={sy} x2={tx} y2={ty} stroke="#666" strokeWidth={1} markerEnd="url(#arrowhead)" opacity={0.6} />;
                                                        })}
                                                        {chart.data.nodes.map((node: any, i: number) => {
                                                            // Force Circular Layout
                                                            const totalNodes = chart.data.nodes.length;
                                                            const centerX = 200;
                                                            const centerY = 150;
                                                            const radius = 100;
                                                            const x = centerX + radius * Math.cos((i * 2 * Math.PI) / totalNodes);
                                                            const y = centerY + radius * Math.sin((i * 2 * Math.PI) / totalNodes);

                                                            return (
                                                                <g key={i} className="cursor-pointer hover:opacity-80 transition-opacity">
                                                                    <circle cx={x} cy={y} r={24} fill="#f97316" stroke="#fff" strokeWidth={2} />
                                                                    <text x={x} y={y} dy={5} textAnchor="middle" fill="#fff" fontSize={10} fontWeight="bold" pointerEvents="none">
                                                                        {String(node.id).substring(0, 2).toUpperCase()}
                                                                    </text>
                                                                    <text x={x} y={y + 40} textAnchor="middle" fill="#ccc" fontSize={11} className="bg-black/50 px-2 py-1 rounded font-medium">
                                                                        {node.label || node.id}
                                                                    </text>
                                                                </g>
                                                            );
                                                        })}
                                                    </svg>
                                                ) : (
                                                    <div className="text-center p-4">
                                                        <p className="text-neutral-500 mb-2">Network data unavailable</p>
                                                        <p className="text-xs text-neutral-600">Try regenerating the infographic</p>
                                                    </div>
                                                )}
                                                <div className="absolute bottom-2 right-2 text-xs text-neutral-500 bg-black/40 px-2 py-1 rounded">Network View</div>
                                            </div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={chart.data}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                                    <XAxis dataKey="name" stroke="#666" tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                                                    <YAxis stroke="#666" tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                                                    <Tooltip content={<CustomTooltip unit={chart.unit} />} cursor={{ fill: '#ffffff20' }} />
                                                    <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                    {chart.detailed_analysis && (
                                        <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/5">
                                            <div className="flex items-start gap-3">
                                                <Info className="text-orange-500 shrink-0 mt-0.5" size={16} />
                                                <p className="text-sm text-neutral-300 leading-relaxed">{chart.detailed_analysis}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Key Points / Sections */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {data.sections?.map((section: any, idx: number) => (
                                <div key={idx} className="bg-gradient-to-br from-neutral-900 to-black border border-white/5 p-8 rounded-2xl">
                                    <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-3">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500/20 text-orange-500 text-sm font-mono">
                                            {String(idx + 1).padStart(2, '0')}
                                        </span>
                                        {section.title}
                                    </h3>
                                    <ul className="space-y-4">
                                        {section.items?.map((item: string, i: number) => (
                                            <li key={i} className="flex items-start gap-3 group">
                                                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-neutral-600 group-hover:bg-orange-500 transition-colors shrink-0" />
                                                <span className="text-neutral-400 group-hover:text-neutral-300 leading-relaxed transition-colors">{formatText(item)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-500">
                        <div className="w-24 h-24 bg-neutral-900 rounded-full flex items-center justify-center mb-6 border border-neutral-800">
                            <BarChartIcon size={48} className="opacity-20" />
                        </div>
                        <p className="text-xl font-medium text-neutral-400">Ready to generate your infographic</p>
                        <p className="text-sm text-neutral-600 mt-2">Enter a topic above to begin</p>
                    </div>
                )}
            </div>
        </div>
    );
};
