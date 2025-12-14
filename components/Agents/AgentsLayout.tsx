import React, { useState, useRef } from 'react';
import { Youtube, Bot, Sparkles, ChevronDown, BookOpen } from 'lucide-react';
import { YouTubeAgent } from './YouTubeAgent';
import { ConfluenceAgent } from './ConfluenceAgent';
import AnimatedNavBar from '../Dock/AnimatedNavBar';
import { HistoryPanel, HistoryItem } from '../HistoryPanel';

interface AgentsLayoutProps {
    sources?: any[];
    selectedSources?: number[];
}

export const AgentsLayout: React.FC<AgentsLayoutProps> = () => {
    const [activeAgent, setActiveAgent] = useState('youtube');
    const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    // Header only collapses on button click, not auto-scroll

    return (
        <div className="flex flex-col h-full bg-[#09090b] text-white">
            {/* Collapsible Header */}
            <div
                className={`flex items-center justify-between gap-4 border-b border-white/10 bg-black/40 backdrop-blur-md transition-all duration-300 cursor-pointer ${isHeaderCollapsed ? 'px-4 py-1' : 'px-4 py-2'
                    }`}
                onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
            >
                <div className="flex items-center gap-3">
                    <div className={`rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center transition-all ${isHeaderCollapsed ? 'w-6 h-6' : 'w-8 h-8'
                        }`}>
                        <Bot size={isHeaderCollapsed ? 12 : 16} className="text-white" />
                    </div>
                    {!isHeaderCollapsed && (
                        <>
                            <div>
                                <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                                    Agents
                                </h1>
                            </div>
                            {/* Agent Navigation - Inline */}
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

                {/* Right side - Toggle Button and Badge */}
                <div className="flex items-center gap-3">
                    {/* Toggle Button */}
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
                            // Could restore query here if needed
                            console.log('Selected history item:', item);
                        }}
                    />
                </div>

                {/* Agent Content */}
                <div ref={contentRef} className="flex-1 overflow-auto relative">
                    {activeAgent === 'youtube' && <YouTubeAgent />}
                    {activeAgent === 'confluence' && <ConfluenceAgent />}
                </div>
            </div>
        </div>
    );
};
