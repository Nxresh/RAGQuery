import { useState, useRef } from 'react';
import { Network, BarChart, Presentation, FileText, Palette, ChevronUp, ChevronDown } from 'lucide-react';
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
}

export const StudioLayout = ({ sources, selectedSources, onFileUpload, isProcessing }: StudioLayoutProps) => {
    const [activeTab, setActiveTab] = useState('mindmap');
    const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const activeSources = sources.filter(s => selectedSources.includes(s.id));
    const sourcesToUse = activeSources.length > 0 ? activeSources : sources;

    const tabLabels: Record<string, string> = {
        mindmap: 'Mind Map',
        infographic: 'Infographic',
        slidedeck: 'Slide Deck',
        report: 'Report'
    };

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
                            console.log('Selected studio history:', item);
                        }}
                    />
                </div>

                {/* Content */}
                <div ref={contentRef} className="flex-1 overflow-auto relative">
                    {activeTab === 'mindmap' && <MindMapGenerator sources={sourcesToUse} onFileUpload={onFileUpload} isProcessing={isProcessing} />}
                    {activeTab === 'infographic' && <InfographicGenerator sources={sourcesToUse} onFileUpload={onFileUpload} isProcessing={isProcessing} />}
                    {activeTab === 'slidedeck' && <SlideDeckGenerator sources={sourcesToUse} onFileUpload={onFileUpload} isProcessing={isProcessing} />}
                    {activeTab === 'report' && <ReportGenerator sources={sourcesToUse} onFileUpload={onFileUpload} isProcessing={isProcessing} />}
                </div>
            </div>
        </div>
    );
};
