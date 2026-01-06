import React, { useState, useRef, useEffect } from 'react';
import { Youtube, Bot, Sparkles, ChevronDown, BookOpen } from 'lucide-react';
import { YouTubeAgent } from './YouTubeAgent';
import { ConfluenceAgent } from './ConfluenceAgent';
import AnimatedNavBar from '../Dock/AnimatedNavBar';
import { HistoryPanel, HistoryItem } from '../HistoryPanel';

interface AgentsLayoutProps {
    sources?: any[];
    selectedSources?: number[];
    userId?: string;
}

export const AgentsLayout: React.FC<AgentsLayoutProps> = ({ sources = [], selectedSources = [], userId }) => {
    const [activeAgent, setActiveAgent] = useState('youtube');
    const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const [smartSuggestions, setSmartSuggestions] = useState<string[]>([
        "Summarize this YouTube video",
        "Extract key insights from video",
        "Create documentation from content",
        "Generate SOP from video"
    ]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [activeSuggestion, setActiveSuggestion] = useState<string>('');
    const [restoredContent, setRestoredContent] = useState<any>(null);

    const handleSuggestionClick = (suggestion: string) => {
        setActiveSuggestion(suggestion);
    };

    // Calculate which sources to use (selected or all if none selected)
    const activeSources = sources.filter(s => selectedSources.includes(s.id));
    const sourcesToUse = activeSources.length > 0 ? activeSources : sources;

    // Fetch AI suggestions based on active agent
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (sources.length === 0 && selectedSources.length === 0) {
                // Agent-specific default suggestions
                if (activeAgent === 'youtube') {
                    setSmartSuggestions([
                        "Summarize YouTube video",
                        "Extract key points from video",
                        "Create notes from video content",
                        "Generate transcript summary"
                    ]);
                } else {
                    setSmartSuggestions([
                        "Create Confluence page",
                        "Generate SOP documentation",
                        "Build knowledge article",
                        "Create how-to guide"
                    ]);
                }
                return;
            }

            setIsLoadingSuggestions(true);
            try {
                const agentContext = {
                    youtube: "YouTube video analysis and summarization",
                    confluence: "Confluence documentation and SOP creation"
                };

                const response = await fetch('/api/suggestions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sourceIds: sourcesToUse.slice(0, 3).map(s => s.id),
                        userId: userId || 'anonymous',
                        featureType: 'agents',
                        featureContext: agentContext[activeAgent as keyof typeof agentContext]
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.suggestions?.length > 0) {
                        setSmartSuggestions(data.suggestions);
                    }
                }
            } catch (err) {
                console.error('[Agent Suggestions] Failed:', err);
            } finally {
                setIsLoadingSuggestions(false);
            }
        };

        fetchSuggestions();
    }, [selectedSources, activeAgent, userId, sources.length]);

    return (
        <div className="flex flex-col h-full bg-transparent text-white">
            {/* Collapsible Header */}
            <div
                className={`flex items-center justify-between gap-4 border-b border-white/10 bg-black/40 backdrop-blur-md transition-all duration-300 cursor-pointer ${isHeaderCollapsed ? 'px-4 py-1' : 'px-4 py-2'}`}
                onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
            >
                <div className="flex items-center gap-3">
                    <div className={`rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center transition-all ${isHeaderCollapsed ? 'w-6 h-6' : 'w-8 h-8'}`}>
                        <Bot size={isHeaderCollapsed ? 12 : 16} className="text-white" />
                    </div>
                    {!isHeaderCollapsed && (
                        <>
                            <div>
                                <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                                    Agents
                                </h1>
                            </div>
                            <div className="ml-4">
                                <AnimatedNavBar
                                    items={[
                                        {
                                            id: 'youtube',
                                            label: 'YouTube',
                                            icon: <Youtube size={14} />,
                                            onClick: () => setActiveAgent('youtube'),
                                            isActive: activeAgent === 'youtube'
                                        },
                                        {
                                            id: 'confluence',
                                            label: 'Confluence',
                                            icon: <BookOpen size={14} />,
                                            onClick: () => setActiveAgent('confluence'),
                                            isActive: activeAgent === 'confluence'
                                        },
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
                        <span className="text-sm font-medium text-neutral-400">
                            Agents • {activeAgent === 'youtube' ? 'YouTube' : 'Confluence'}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center transition-all duration-200 group">
                        <div className={`text-neutral-500 group-hover:text-white transition-all duration-200 ${isHeaderCollapsed ? '' : 'rotate-180'}`}>
                            <ChevronDown size={16} />
                        </div>
                    </button>
                    {!isHeaderCollapsed && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                            <Sparkles size={10} className="text-purple-400" />
                            MCP
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area with History Sidebar */}
            <div className="flex-1 flex overflow-hidden">
                {/* History Sidebar */}
                <div className="w-56 border-r border-white/5 bg-black/30 flex-shrink-0 overflow-y-auto">
                    <HistoryPanel
                        storageKey="ares_agents_history"
                        title="Agent History"
                        onSelectItem={(item) => {
                            const storedContent = localStorage.getItem(`ares_agent_${item.id}`);
                            if (storedContent) {
                                try {
                                    const data = JSON.parse(storedContent);
                                    console.log('[Agent History] Restoring:', item.query, data);
                                    if (data.agent) setActiveAgent(data.agent);
                                    setRestoredContent(data.content);
                                } catch (e) {
                                    console.error('[Agent History] Failed to restore:', e);
                                }
                            } else {
                                console.warn('[Agent History] No content found for:', item.id);
                            }
                        }}
                    />
                </div>

                {/* Agent Content */}
                <div ref={contentRef} className="flex-1 overflow-auto relative">
                    {/* Smart Suggestions */}
                    <div className="p-4 border-b border-white/5 bg-black/20">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={14} className="text-purple-400" />
                            <span className="text-xs text-neutral-400 uppercase tracking-wider">AI Suggestions</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {isLoadingSuggestions ? (
                                <span className="text-xs text-neutral-500">Generating suggestions...</span>
                            ) : (
                                smartSuggestions.map((suggestion, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className="px-3 py-1.5 text-xs bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 rounded-full text-neutral-300 hover:text-purple-400 transition-all cursor-pointer"
                                    >
                                        {suggestion}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {activeAgent === 'youtube' && <YouTubeAgent initialQuery={activeSuggestion} restoredContent={restoredContent} onClearRestored={() => setRestoredContent(null)} />}
                    {activeAgent === 'confluence' && <ConfluenceAgent initialInput={activeSuggestion} restoredContent={restoredContent} onClearRestored={() => setRestoredContent(null)} />}
                </div>
            </div>
        </div>
    );
};
