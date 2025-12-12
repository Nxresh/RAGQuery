
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, Loader2, FileText, Download, Printer, Maximize, ZoomOut, Mail, MessageSquare, ChevronDown, Check, BookOpen, PenTool, Briefcase, FileCode, Lightbulb, Layers, ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend } from 'recharts';
import { StudioDropZone } from './StudioDropZone';

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#333333', '#4b5563'];

interface ReportSection {
    heading: string;
    content: string;
    chart?: {
        type: string;
        title: string;
        description?: string;
        xAxisLabel?: string;
        yAxisLabel?: string;
        data: any[];
    };
}

interface ReportData {
    title: string;
    summary: string;
    sections: ReportSection[];
}

export const ReportGenerator = ({ sources, onFileUpload, isProcessing }: { sources: any[], onFileUpload: (file: File, type: string) => void, isProcessing: boolean }) => {
    const [topic, setTopic] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [report, setReport] = useState<ReportData | null>(null);
    const [format, setFormat] = useState<string>('briefing_doc');
    const [isFormatOpen, setIsFormatOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsFormatOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const formats = [
        { id: 'briefing_doc', label: 'Briefing Doc', description: 'Overview of your sources featuring key insights and quotes', icon: FileText },
        { id: 'study_guide', label: 'Study Guide', description: 'Short-answer quiz, suggested essay questions, and glossary', icon: BookOpen },
        { id: 'blog_post', label: 'Blog Post', description: 'Insightful takeaways distilled into a highly readable article', icon: PenTool },
        { id: 'executive_summary', label: 'Executive Summary', description: 'An overview of the topic for business and technical audiences', icon: Briefcase },
        { id: 'technical_whitepaper', label: 'Technical Whitepaper', description: 'A technical explanation of the framework or concept', icon: FileCode },
        { id: 'explanatory_article', label: 'Explanatory Article', description: 'Learn the basics with a simple analogy', icon: Lightbulb },
        { id: 'concept_breakdown', label: 'Concept Breakdown', description: 'Explore the key problems that this concept solves', icon: Layers },
    ];

    const selectedFormat = formats.find(f => f.id === format);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const generateReport = async () => {
        if (!topic) return;
        setLoading(true);
        setError(null);
        setReport(null);

        // Combine text from sources
        const context = sources.map(s => s.content || s.text || '').join('\n\n').slice(0, 20000);

        console.log('Generating report with format:', format);

        try {
            const res = await fetch('/api/generate-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, context, format })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to generate report');
            }

            setReport(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
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
                            <h2 className="text-xl font-bold text-white">{report?.title || topic || 'Report'}</h2>
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
                /* Toolbar */
                <div className="p-4 flex gap-2 border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-10">
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsFormatOpen(!isFormatOpen)}
                            className="h-10 px-3 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center gap-2 text-neutral-200 hover:bg-neutral-800 hover:border-neutral-700 transition-all min-w-[200px] justify-between shadow-[0_0_15px_-5px_rgba(0,0,0,0.5)]"
                        >
                            <div className="flex items-center gap-2">
                                {selectedFormat && <selectedFormat.icon size={16} className="text-orange-500" />}
                                <span className="text-sm font-medium truncate max-w-[140px]">{selectedFormat?.label}</span>
                            </div>
                            <ChevronDown size={14} className={`text-neutral-500 transition-transform ${isFormatOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isFormatOpen && (
                            <div className="absolute top-full left-0 mt-2 w-72 bg-[#0a0a0a] border border-neutral-800 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 max-h-[400px] overflow-y-auto custom-scrollbar">
                                <div className="p-1">
                                    {formats.map((f) => (
                                        <button
                                            key={f.id}
                                            onClick={() => {
                                                setFormat(f.id);
                                                setIsFormatOpen(false);
                                            }}
                                            className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${format === f.id
                                                ? 'bg-orange-500/10 text-orange-500'
                                                : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
                                                }`}
                                        >
                                            <f.icon size={16} className={`mt-0.5 ${format === f.id ? 'text-orange-500' : 'text-neutral-500'}`} />
                                            <div className="flex-1 text-left">
                                                <div className="font-medium">{f.label}</div>
                                                <div className="text-xs text-neutral-500 line-clamp-2">{f.description}</div>
                                            </div>
                                            {format === f.id && <Check size={14} className="mt-0.5" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Enter topic..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors"
                    />
                    <button
                        onClick={generateReport}
                        disabled={loading || !topic}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-orange-900/20"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                        Generate Report
                    </button>
                    {report && (
                        <>
                            <button
                                onClick={() => setReport(null)}
                                className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors mr-2"
                                title="Back to Selection"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <button className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Download PDF">
                                <Download size={20} />
                            </button>
                            <button className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Print">
                                <Printer size={20} />
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

            {/* Error Message */}
            {error && (
                <div className="mx-4 mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-200">
                    <div className="p-2 bg-red-500/20 rounded-full">
                        <Sparkles size={16} className="text-red-500 rotate-45" />
                    </div>
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {sources.length === 0 && !report && !error && (
                <div className="p-4">
                    <StudioDropZone onFileUpload={onFileUpload} isProcessing={isProcessing} />
                </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[#09090b]">
                {report ? (
                    <div className="max-w-4xl mx-auto bg-white text-black min-h-[1100px] shadow-2xl shadow-black/50 rounded-sm overflow-hidden">
                        {/* Cover Page */}
                        <div className="h-[1100px] flex flex-col justify-center p-20 bg-gradient-to-br from-neutral-50 to-neutral-200 relative">
                            <div className="absolute top-0 left-0 w-full h-4 bg-orange-600"></div>
                            <div className="mb-12">
                                <span className="text-orange-600 font-bold tracking-widest uppercase text-sm">Confidential Report</span>
                            </div>
                            <h1 className="text-6xl font-extrabold text-neutral-900 mb-8 leading-tight">
                                {report.title}
                            </h1>
                            <div className="w-24 h-2 bg-orange-600 mb-12"></div>
                            <p className="text-xl text-neutral-600 leading-relaxed max-w-2xl">
                                {report.summary}
                            </p>
                            <div className="mt-auto pt-20 border-t border-neutral-300 flex justify-between text-neutral-500 text-sm">
                                <span>Generated by RAG Query Studio</span>
                                <span>{new Date().toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Content Pages */}
                        <div className="p-20 bg-white">
                            {report.sections?.map((section, idx) => (
                                <section key={idx} className="mb-16 last:mb-0">
                                    <h2 className="text-3xl font-bold text-neutral-900 mb-6 pb-4 border-b-2 border-orange-100 flex items-center gap-3">
                                        <span className="text-orange-600 text-lg font-mono">0{idx + 1}</span>
                                        {section.heading}
                                    </h2>
                                    <div className="prose prose-lg max-w-none text-neutral-700 mb-8">
                                        <ReactMarkdown>{section.content}</ReactMarkdown>
                                    </div>

                                    {/* Chart Section */}
                                    {section.chart && (
                                        <div className="my-8 p-6 bg-neutral-50 rounded-xl border border-neutral-200 shadow-sm break-inside-avoid">
                                            <h3 className="text-lg font-bold text-neutral-800 mb-2 text-center">{section.chart.title}</h3>
                                            {section.chart.description && (
                                                <p className="text-sm text-neutral-500 text-center mb-6 max-w-2xl mx-auto italic">
                                                    {section.chart.description}
                                                </p>
                                            )}
                                            <div className="h-[350px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    {section.chart.type === 'pie' || section.chart.type === 'donut' ? (
                                                        <PieChart>
                                                            <Pie
                                                                data={section.chart.data}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={section.chart.type === 'donut' ? 60 : 0}
                                                                outerRadius={100}
                                                                paddingAngle={5}
                                                                dataKey="value"
                                                                stroke="none"
                                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                            >
                                                                {section.chart.data?.map((_entry: any, index: number) => (
                                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                                            <Legend />
                                                        </PieChart>
                                                    ) : section.chart.type === 'line' ? (
                                                        <LineChart data={section.chart.data}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                            <XAxis dataKey="name" axisLine={false} tickLine={false} label={{ value: section.chart.xAxisLabel, position: 'insideBottom', offset: -5 }} />
                                                            <YAxis axisLine={false} tickLine={false} label={{ value: section.chart.yAxisLabel, angle: -90, position: 'insideLeft' }} />
                                                            <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                                            <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={3} dot={{ fill: '#f97316' }} />
                                                        </LineChart>
                                                    ) : section.chart.type === 'area' ? (
                                                        <AreaChart data={section.chart.data}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                            <XAxis dataKey="name" axisLine={false} tickLine={false} label={{ value: section.chart.xAxisLabel, position: 'insideBottom', offset: -5 }} />
                                                            <YAxis axisLine={false} tickLine={false} label={{ value: section.chart.yAxisLabel, angle: -90, position: 'insideLeft' }} />
                                                            <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                                            <Area type="monotone" dataKey="value" stroke="#f97316" fill="#f97316" fillOpacity={0.2} />
                                                        </AreaChart>
                                                    ) : (
                                                        <BarChart data={section.chart.data}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                            <XAxis dataKey="name" axisLine={false} tickLine={false} label={{ value: section.chart.xAxisLabel, position: 'insideBottom', offset: -5 }} />
                                                            <YAxis axisLine={false} tickLine={false} label={{ value: section.chart.yAxisLabel, angle: -90, position: 'insideLeft' }} />
                                                            <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                                            <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} label={{ position: 'top' }} />
                                                        </BarChart>
                                                    )}
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Format Selection Grid */
                    <div className="max-w-5xl mx-auto">
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold text-white mb-2">Create Your Own</h2>
                            <p className="text-neutral-400">Craft reports your way by specifying structure, style, tone, and more</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                            {formats.slice(0, 3).map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => setFormat(f.id)}
                                    className={`p-6 rounded-xl border text-left transition-all group relative overflow-hidden ${format === f.id
                                        ? 'bg-orange-500/10 border-orange-500/50 shadow-[0_0_20px_-5px_rgba(249,115,22,0.3)]'
                                        : 'bg-neutral-900/50 border-white/5 hover:border-white/10 hover:bg-neutral-900'
                                        }`}
                                >
                                    <div className={`p-3 rounded-lg w-fit mb-4 ${format === f.id ? 'bg-orange-500 text-white' : 'bg-white/5 text-neutral-400 group-hover:text-white group-hover:bg-white/10'}`}>
                                        <f.icon size={24} />
                                    </div>
                                    <h3 className={`font-semibold mb-2 ${format === f.id ? 'text-orange-500' : 'text-neutral-200 group-hover:text-white'}`}>{f.label}</h3>
                                    <p className="text-sm text-neutral-500 leading-relaxed">{f.description}</p>
                                    {format === f.id && (
                                        <div className="absolute top-4 right-4 text-orange-500">
                                            <Check size={20} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="mb-8 flex items-center gap-2">
                            <Sparkles size={18} className="text-orange-500" />
                            <h2 className="text-xl font-semibold text-white">Suggested Format</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {formats.slice(3).map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => setFormat(f.id)}
                                    className={`p-6 rounded-xl border text-left transition-all group relative overflow-hidden ${format === f.id
                                        ? 'bg-orange-500/10 border-orange-500/50 shadow-[0_0_20px_-5px_rgba(249,115,22,0.3)]'
                                        : 'bg-neutral-900/50 border-white/5 hover:border-white/10 hover:bg-neutral-900'
                                        }`}
                                >
                                    <div className={`p-3 rounded-lg w-fit mb-4 ${format === f.id ? 'bg-orange-500 text-white' : 'bg-white/5 text-neutral-400 group-hover:text-white group-hover:bg-white/10'}`}>
                                        <f.icon size={24} />
                                    </div>
                                    <h3 className={`font-semibold mb-2 ${format === f.id ? 'text-orange-500' : 'text-neutral-200 group-hover:text-white'}`}>{f.label}</h3>
                                    <p className="text-sm text-neutral-500 leading-relaxed">{f.description}</p>
                                    {format === f.id && (
                                        <div className="absolute top-4 right-4 text-orange-500">
                                            <Check size={20} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
