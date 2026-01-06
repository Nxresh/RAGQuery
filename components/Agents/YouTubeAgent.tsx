import React, { useState, useEffect } from 'react';
import { Youtube, Send, Loader2, Play, FileText, MessageSquare, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import { addToHistory } from '../HistoryPanel';

interface AgentResponse {
    videoId: string;
    transcript: string;
    transcriptLength: number;
    query: string;
    answer: string;
}

export const YouTubeAgent: React.FC<{ initialQuery?: string, restoredContent?: any, onClearRestored?: () => void }> = ({ initialQuery, restoredContent, onClearRestored }) => {
    const [videoUrl, setVideoUrl] = useState('');
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [response, setResponse] = useState<AgentResponse | null>(null);

    useEffect(() => {
        if (initialQuery) setQuery(initialQuery);
    }, [initialQuery]);

    // Restore from history
    useEffect(() => {
        if (restoredContent) {
            console.log('[YouTube] Restoring content:', restoredContent);
            if (restoredContent.response) setResponse(restoredContent.response);
            if (restoredContent.videoUrl) setVideoUrl(restoredContent.videoUrl);
            if (restoredContent.query) setQuery(restoredContent.query);
            if (onClearRestored) setTimeout(onClearRestored, 100);
        }
    }, [restoredContent, onClearRestored]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!videoUrl.trim() || !query.trim()) return;

        setIsLoading(true);
        setError(null);
        setResponse(null);

        try {
            const res = await fetch('/api/agents/youtube', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoUrl: videoUrl.trim(), query: query.trim() })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to process request');
            }

            setResponse(data);
            // Save to history with content
            const historyItems = addToHistory('ares_agents_history', query.trim(), 'YouTube');
            const historyId = historyItems[0].id;
            localStorage.setItem(`ares_agent_${historyId}`, JSON.stringify({
                content: { response: data, videoUrl: videoUrl.trim(), query: query.trim() },
                agent: 'youtube'
            }));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const extractVideoId = (url: string): string | null => {
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes('youtube.com')) {
                return urlObj.searchParams.get('v');
            } else if (urlObj.hostname.includes('youtu.be')) {
                return urlObj.pathname.slice(1);
            }
        } catch {
            return null;
        }
        return null;
    };

    const videoId = extractVideoId(videoUrl);
    const [isInputCollapsed, setIsInputCollapsed] = useState(false);

    // Auto-collapse when response is received
    React.useEffect(() => {
        if (response) {
            setIsInputCollapsed(true);
        }
    }, [response]);

    return (
        <div className="h-full flex flex-col">
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Input Card - Collapsible */}
                    <div className={`bg-gradient-to-br from-red-500/5 to-orange-500/5 border border-red-500/20 rounded-2xl transition-all duration-300 ${isInputCollapsed ? 'p-3' : 'p-6 space-y-6'}`}>
                        <div
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => response && setIsInputCollapsed(!isInputCollapsed)}
                        >
                            <div className={`rounded-xl bg-red-500/10 flex items-center justify-center transition-all ${isInputCollapsed ? 'w-8 h-8' : 'w-12 h-12'}`}>
                                <Youtube size={isInputCollapsed ? 16 : 24} className="text-red-500" />
                            </div>
                            <div className="flex-1">
                                <h2 className={`font-bold text-white ${isInputCollapsed ? 'text-sm' : 'text-lg'}`}>
                                    {isInputCollapsed && videoId ? `YouTube: ${videoId}` : 'YouTube Video Agent'}
                                </h2>
                                {!isInputCollapsed && <p className="text-sm text-neutral-400">Analyze any YouTube video by its transcript</p>}
                            </div>
                            {response && (
                                <button className="text-neutral-500 hover:text-white transition-colors p-1">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isInputCollapsed ? '' : 'rotate-180'}`}>
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Collapsible content */}
                        {!isInputCollapsed && (
                            <>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Video URL Input */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-neutral-300">Video URL</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={videoUrl}
                                                onChange={(e) => setVideoUrl(e.target.value)}
                                                placeholder="https://youtube.com/watch?v=..."
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
                                                disabled={isLoading}
                                            />
                                            {videoId && (
                                                <a
                                                    href={videoUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-red-500 transition-colors"
                                                >
                                                    <ExternalLink size={16} />
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Video Preview Thumbnail */}
                                    {videoId && (
                                        <div className="relative rounded-xl overflow-hidden bg-black/40 aspect-video max-w-xs">
                                            <img
                                                src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                                                alt="Video thumbnail"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-xs text-white/80">
                                                <Play size={12} className="fill-current" />
                                                Video Preview
                                            </div>
                                        </div>
                                    )}

                                    {/* Query Input */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-neutral-300">Your Question</label>
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                value={query}
                                                onChange={(e) => setQuery(e.target.value)}
                                                placeholder="Summarize this video, What are the key points?, etc."
                                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                                                disabled={isLoading}
                                            />
                                            <Button
                                                type="submit"
                                                disabled={!videoUrl.trim() || !query.trim() || isLoading}
                                                className="px-6 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl shadow-lg shadow-red-500/20"
                                            >
                                                {isLoading ? (
                                                    <Loader2 size={18} className="animate-spin" />
                                                ) : (
                                                    <Send size={18} />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </form>

                                {/* Quick Suggestions */}
                                <div className="flex flex-wrap gap-2">
                                    {['Summarize this video', 'What are the key points?', 'Explain the main concept', 'List all tips mentioned'].map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            onClick={() => setQuery(suggestion)}
                                            className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:border-red-500/50 hover:bg-red-500/10 transition-all"
                                            disabled={isLoading}
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
                            <p className="font-medium">Error</p>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                <Loader2 size={24} className="text-purple-400 animate-spin" />
                            </div>
                            <div>
                                <p className="font-medium text-white">Processing your request...</p>
                                <p className="text-sm text-neutral-400">Fetching transcript and analyzing with AI</p>
                            </div>
                        </div>
                    )}

                    {/* Response Display */}
                    {response && (
                        <div className="space-y-4">
                            {/* Transcript Info */}
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-blue-400 mb-2">
                                    <FileText size={16} />
                                    <span className="text-sm font-medium">Transcript ({response.transcriptLength.toLocaleString()} characters)</span>
                                </div>
                                <p className="text-xs text-neutral-500 leading-relaxed line-clamp-3">
                                    {response.transcript}
                                </p>
                            </div>

                            {/* ARES Response */}
                            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    {/* ARES Logo - Orange accent */}
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 via-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                            <path d="M2 17l10 5 10-5" />
                                            <path d="M2 12l10 5 10-5" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-semibold text-orange-400 tracking-wide">ARES Response</span>
                                </div>
                                <div className="prose prose-sm max-w-none">
                                    <div
                                        className="text-neutral-300 text-sm leading-relaxed font-normal"
                                        style={{ fontWeight: 400 }}
                                        dangerouslySetInnerHTML={{
                                            __html: response.answer
                                                .replace(/^# (.*?)$/gm, '<h1 class="text-xl font-bold text-white mt-4 mb-2">$1</h1>')
                                                .replace(/^## (.*?)$/gm, '<h2 class="text-lg font-bold text-white mt-3 mb-2">$1</h2>')
                                                .replace(/^### (.*?)$/gm, '<h3 class="text-base font-bold text-white mt-2 mb-1">$1</h3>')
                                                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
                                                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                                .replace(/^- (.*?)$/gm, '<li class="ml-4 list-disc">$1</li>')
                                                .replace(/^\d+\. (.*?)$/gm, '<li class="ml-4 list-decimal">$1</li>')
                                                .replace(/\n/g, '<br/>')
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
