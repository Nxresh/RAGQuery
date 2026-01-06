import { useState, useRef, useEffect } from 'react';
import { Network, BarChart, Presentation, FileText, Palette, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import { MindMapGenerator } from './MindMapGenerator';
import { InfographicGenerator } from './InfographicGenerator';
import { SlideDeckGenerator } from './SlideDeckGenerator';
import { ReportGenerator } from './ReportGenerator';
import AnimatedNavBar from '../Dock/AnimatedNavBar';
import { HistoryPanel } from '../HistoryPanel';

interface StudioLayoutProps {
    sources: any[];
    selectedSources: number[];
    onFileUpload: (file: File, type: string) => void;
    isProcessing: boolean;
    userId?: string;
}

export const StudioLayout = ({ sources, selectedSources, onFileUpload, isProcessing, userId }: StudioLayoutProps) => {
    const [activeTab, setActiveTab] = useState('mindmap');
    const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    // State for storing/restoring generated content
    const [restoredContent, setRestoredContent] = useState<any>(null);

    // AI-powered smart suggestions for Studio features
    const [smartSuggestions, setSmartSuggestions] = useState<string[]>([
        "Create a visual summary",
        "Generate concept overview",
        "Build presentation from key points",
        "Create detailed report"
    ]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [activeSuggestion, setActiveSuggestion] = useState<string>('');

    const activeSources = sources.filter(s => selectedSources.includes(s.id));
    const sourcesToUse = activeSources.length > 0 ? activeSources : sources;

    const tabLabels: Record<string, string> = {
        mindmap: 'Mind Map',
        infographic: 'Infographic',
        slidedeck: 'Slide Deck',
        report: 'Report',
    };

    const handleSuggestionClick = (suggestion: string) => {
        setActiveSuggestion(suggestion);
        // Clear it after a short delay so it can be re-selected if needed, 
        // or keep it to show what was selected.
        // For input population, we just need to trigger the useEffect in child.
        // Child should depend on [initialTopic] and maybe check if it's different.
    };

    // Fetch AI suggestions based on active tab and sources
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (sourcesToUse.length === 0) return;

            setIsLoadingSuggestions(true);
            try {
                // Generate feature-specific suggestions
                const featureContext = {
                    mindmap: "mind map visualization with connected concepts",
                    infographic: "infographic with visual data representation",
                    slidedeck: "presentation slide deck",
                    report: "detailed document report"
                };

                const response = await fetch('/api/suggestions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sourceIds: sourcesToUse.slice(0, 3).map(s => s.id),
                        userId: userId || 'anonymous',
                        featureType: 'studio',
                        featureContext: featureContext[activeTab as keyof typeof featureContext]
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.suggestions?.length > 0) {
                        setSmartSuggestions(data.suggestions);
                    }
                }
            } catch (err) {
                console.error('[Studio Suggestions] Failed:', err);
            } finally {
                setIsLoadingSuggestions(false);
            }
        };

        fetchSuggestions();
    }, [selectedSources, activeTab, userId]);

    // Header only collapses on button click, not auto-scroll

    return (
        <div className="flex flex-col h-full bg-transparent text-white">
            {/* Collapsible Header */}
            <div
                className={`flex items-center justify-between gap-4 border-b border-white/10 bg-black/40 backdrop-blur-md transition-all duration-300 cursor-pointer ${isHeaderCollapsed ? 'px-4 py-1' : 'px-4 py-2'
                    }`}
                onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
            >
                <div className="flex items-center gap-3">
                    <div className={`rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center transition-all ${isHeaderCollapsed ? 'w-6 h-6' : 'w-8 h-8'
                        }`}>
                        <Palette size={isHeaderCollapsed ? 12 : 16} className="text-white" />
                    </div>
                    {!isHeaderCollapsed && (
                        <>
                            <div>
                                <h1 className="text-lg font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                                    Studio
                                </h1>
                            </div>
                            {/* Tab Navigation - Inline */}
                            <div className="ml-4">
                                <AnimatedNavBar
                                    items={[
                                        { id: 'mindmap', label: 'Mind Map', icon: <Network size={14} />, onClick: () => setActiveTab('mindmap'), isActive: activeTab === 'mindmap' },
                                        { id: 'infographic', label: 'Infographic', icon: <BarChart size={14} />, onClick: () => setActiveTab('infographic'), isActive: activeTab === 'infographic' },
                                        { id: 'slidedeck', label: 'Slide Deck', icon: <Presentation size={14} />, onClick: () => setActiveTab('slidedeck'), isActive: activeTab === 'slidedeck' },
                                        { id: 'report', label: 'Report', icon: <FileText size={14} />, onClick: () => setActiveTab('report'), isActive: activeTab === 'report' },
                                    ]}
                                    magnification={1.1}
                                    distance={60}
                                    baseScale={1}
                                    className="!bg-transparent !border-none !p-0 !gap-2"
                                />
                            </div>
                        </>
                    )}
                    {isHeaderCollapsed && (
                        <span className="text-sm font-medium text-neutral-400">Studio • {tabLabels[activeTab]}</span>
                    )}
                </div>

                {/* Right side - Toggle Button and Badge */}
                <div className="flex items-center gap-3">
                    {/* Toggle Button */}
                    <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center transition-all duration-200 group">
                        <div className={`text-neutral-500 group-hover:text-white transition-all duration-200 ${isHeaderCollapsed ? '' : 'rotate-180'}`}>
                            <ChevronDown size={16} />
                        </div>
                    </button>
                    {!isHeaderCollapsed && (
                        <div className="text-xs font-medium text-neutral-500 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                            {sourcesToUse.length} Source{sourcesToUse.length !== 1 ? 's' : ''}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area with History Sidebar */}
            <div className="flex-1 flex overflow-hidden">
                {/* History Sidebar */}
                <div className="w-56 border-r border-white/5 bg-black/30 flex-shrink-0 overflow-y-auto">
                    <HistoryPanel
                        storageKey="ares_studio_history"
                        title="Studio History"
                        onSelectItem={(item) => {
                            // Try to restore content from localStorage
                            const storedContent = localStorage.getItem(`ares_studio_${item.id}`);
                            if (storedContent) {
                                try {
                                    const data = JSON.parse(storedContent);
                                    console.log('[Studio History] Restoring:', item.query, data);
                                    setRestoredContent(data.content);
                                    if (data.tab) setActiveTab(data.tab);
                                } catch (e) {
                                    console.error('[Studio History] Failed to restore:', e);
                                }
                            } else {
                                console.warn('[Studio History] No content found for:', item.id);
                            }
                        }}
                    />
                </div>

                {/* Content */}
                <div ref={contentRef} className="flex-1 overflow-auto relative">
                    {/* Smart Suggestions */}
                    {sourcesToUse.length > 0 && (
                        <div className="p-4 border-b border-white/5 bg-black/20">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles size={14} className="text-orange-400" />
                                <span className="text-xs text-neutral-400 uppercase tracking-wider">AI Suggestions</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {isLoadingSuggestions ? (
                                    <span className="text-xs text-neutral-500">Analyzing sources...</span>
                                ) : (
                                    smartSuggestions.map((suggestion, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSuggestionClick(suggestion)}
                                            className="px-3 py-1.5 text-xs bg-white/5 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/30 rounded-full text-neutral-300 hover:text-orange-400 transition-all cursor-pointer"
                                        >
                                            {suggestion}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'mindmap' && <MindMapGenerator sources={sourcesToUse} onFileUpload={onFileUpload} isProcessing={isProcessing} initialTopic={activeSuggestion} restoredContent={restoredContent} onClearRestored={() => setRestoredContent(null)} />}
                    {activeTab === 'infographic' && <InfographicGenerator sources={sourcesToUse} onFileUpload={onFileUpload} isProcessing={isProcessing} initialTopic={activeSuggestion} restoredContent={restoredContent} onClearRestored={() => setRestoredContent(null)} />}
                    {activeTab === 'slidedeck' && <SlideDeckGenerator sources={sourcesToUse} onFileUpload={onFileUpload} isProcessing={isProcessing} initialTopic={activeSuggestion} restoredContent={restoredContent} onClearRestored={() => setRestoredContent(null)} />}
                    {activeTab === 'report' && <ReportGenerator sources={sourcesToUse} onFileUpload={onFileUpload} isProcessing={isProcessing} initialTopic={activeSuggestion} restoredContent={restoredContent} onClearRestored={() => setRestoredContent(null)} />}
                </div>
            </div>
        </div>
    );
};
