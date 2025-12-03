import React, { useState } from 'react';
import { Network, BarChart, Presentation, FileText } from 'lucide-react';
import { MindMapGenerator } from './MindMapGenerator';
import { InfographicGenerator } from './InfographicGenerator';
import { SlideDeckGenerator } from './SlideDeckGenerator';
import { ReportGenerator } from './ReportGenerator';
import AnimatedNavBar from '../Dock/AnimatedNavBar';

interface StudioLayoutProps {
    sources: any[];
    selectedSources: number[];
    onFileUpload: (file: File, type: string) => void;
    isProcessing: boolean;
}

export const StudioLayout = ({ sources, selectedSources, onFileUpload, isProcessing }: StudioLayoutProps) => {
    const [activeTab, setActiveTab] = useState('mindmap');

    const activeSources = sources.filter(s => selectedSources.includes(s.id));
    const sourcesToUse = activeSources.length > 0 ? activeSources : sources;

    return (
        <div className="flex flex-col h-full bg-[#09090b] text-white">
            <div className="flex flex-col gap-6 p-6 border-b border-white/10 bg-black/40 backdrop-blur-md">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 bg-clip-text text-transparent tracking-tight">
                        Studio
                    </h1>
                    <div className="text-xs font-medium text-neutral-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                        {sourcesToUse.length} Active Source{sourcesToUse.length !== 1 ? 's' : ''}
                    </div>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto p-4 scrollbar-hide">
                    <AnimatedNavBar
                        items={[
                            { id: 'mindmap', label: 'Mind Map', icon: <Network size={16} />, onClick: () => setActiveTab('mindmap'), isActive: activeTab === 'mindmap' },
                            { id: 'infographic', label: 'Infographic', icon: <BarChart size={16} />, onClick: () => setActiveTab('infographic'), isActive: activeTab === 'infographic' },
                            { id: 'slidedeck', label: 'Slide Deck', icon: <Presentation size={16} />, onClick: () => setActiveTab('slidedeck'), isActive: activeTab === 'slidedeck' },
                            { id: 'report', label: 'Report', icon: <FileText size={16} />, onClick: () => setActiveTab('report'), isActive: activeTab === 'report' },
                        ]}
                        magnification={1.15}
                        distance={80}
                        baseScale={1}
                        className="!bg-transparent !border-none !p-0 !gap-4"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'mindmap' && <MindMapGenerator sources={sourcesToUse} onFileUpload={onFileUpload} isProcessing={isProcessing} />}
                {activeTab === 'infographic' && <InfographicGenerator sources={sourcesToUse} onFileUpload={onFileUpload} isProcessing={isProcessing} />}
                {activeTab === 'slidedeck' && <SlideDeckGenerator sources={sourcesToUse} onFileUpload={onFileUpload} isProcessing={isProcessing} />}
                {activeTab === 'report' && <ReportGenerator sources={sourcesToUse} onFileUpload={onFileUpload} isProcessing={isProcessing} />}
            </div>
        </div>
    );
};
