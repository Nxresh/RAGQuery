import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader2, ChevronLeft, ChevronRight, MonitorPlay, Presentation, LayoutTemplate, Maximize, ZoomOut, X, RefreshCcw } from 'lucide-react';
import { StudioDropZone } from './StudioDropZone';
import { addToHistory } from '../HistoryPanel';

export const SlideDeckGenerator = ({ sources, onFileUpload, isProcessing, initialTopic, restoredContent, onClearRestored }: {
    sources: any[],
    onFileUpload: (file: File, type: string) => void,
    isProcessing: boolean,
    initialTopic?: string,
    restoredContent?: any,
    onClearRestored?: () => void
}) => {
    const [topic, setTopic] = useState('');
    const [loading, setLoading] = useState(false);
    const [slides, setSlides] = useState<any[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [deckTitle, setDeckTitle] = useState('');
    const [deckSubtitle, setDeckSubtitle] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [regeneratingVisual, setRegeneratingVisual] = useState<{ slideIdx: number, visualIdx: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (initialTopic) setTopic(initialTopic);
    }, [initialTopic]);

    // Restore from history
    useEffect(() => {
        if (restoredContent && restoredContent.slides) {
            console.log('[SlideDeck] Restoring content:', restoredContent);
            setSlides(restoredContent.slides);
            setDeckTitle(restoredContent.deckTitle || '');
            setDeckSubtitle(restoredContent.deckSubtitle || '');
            if (restoredContent.topic) setTopic(restoredContent.topic);
            setCurrentSlide(0);
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

    const [error, setError] = useState<string | null>(null);

    const generateDeck = async () => {
        if (!topic) return;
        setLoading(true);
        setError(null);

        // Combine text from sources
        const context = sources.map(s => s.content || s.text || '').join('\n\n').slice(0, 10000);

        try {
            const res = await fetch('/api/generate-slidedeck', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, context })
            });

            if (!res.ok) {
                throw new Error(`Failed to generate deck: ${res.statusText}`);
            }

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            if (data.slides) {
                setSlides(data.slides);
                setDeckTitle(data.title);
                setDeckSubtitle(data.subtitle);
                setCurrentSlide(0);

                // Save to history
                const historyItems = addToHistory('ares_studio_history', topic, 'Slide Deck');
                const historyId = historyItems[0].id;
                localStorage.setItem(`ares_studio_${historyId}`, JSON.stringify({
                    content: { slides: data.slides, deckTitle: data.title, deckSubtitle: data.subtitle, topic },
                    tab: 'slidedeck'
                }));
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to generate slide deck');
        } finally {
            setLoading(false);
        }
    };

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) setCurrentSlide(c => c + 1);
    };

    const prevSlide = () => {
        if (currentSlide > 0) setCurrentSlide(c => c - 1);
    };

    const removeVisual = (slideIdx: number, visualIdx: number) => {
        setSlides(prevSlides => {
            const newSlides = [...prevSlides];
            const slide = { ...newSlides[slideIdx] };
            if (slide.visual_svgs && Array.isArray(slide.visual_svgs)) {
                slide.visual_svgs = slide.visual_svgs.filter((_: any, idx: number) => idx !== visualIdx);
                newSlides[slideIdx] = slide;
            }
            return newSlides;
        });
    };

    const handleRegenerate = async (slideIdx: number, visualIdx: number, instruction?: string) => {
        setRegeneratingVisual({ slideIdx, visualIdx });
        try {
            const slide = slides[slideIdx];
            const res = await fetch('/api/regenerate-visual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slide_content: slide.content.join('\n'),
                    user_instruction: instruction,
                    current_visual_description: slide.image_description
                })
            });

            if (!res.ok) throw new Error('Failed to regenerate');

            const data = await res.json();
            if (data.visual_svg) {
                setSlides(prevSlides => {
                    const newSlides = [...prevSlides];
                    const newSlide = { ...newSlides[slideIdx] };
                    if (newSlide.visual_svgs) {
                        newSlide.visual_svgs[visualIdx] = data.visual_svg;
                    }
                    newSlides[slideIdx] = newSlide;
                    return newSlides;
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setRegeneratingVisual(null);
        }
    };

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [currentSlide]);

    return (
        <div ref={containerRef} className={`h-full flex flex-col bg-[#09090b] ${isFullscreen ? 'overflow-hidden' : ''}`}>
            {isFullscreen ? (
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40 backdrop-blur-sm sticky top-0 z-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <Maximize size={20} className="text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{deckTitle || topic || 'Presentation'}</h2>
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
                        placeholder="Enter presentation topic..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors"
                    />
                    <button
                        onClick={generateDeck}
                        disabled={loading || !topic}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-orange-900/20"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                        Generate Deck
                    </button>
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Fullscreen"
                    >
                        <Maximize size={20} />
                    </button>
                </div>
            )}

            {error && (
                <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                    {error}
                </div>
            )}

            {sources.length === 0 && slides.length === 0 && (
                <div className="p-4">
                    <StudioDropZone onFileUpload={onFileUpload} isProcessing={isProcessing} />
                </div>
            )}

            <div className="flex-1 flex overflow-hidden">
                {slides.length > 0 ? (
                    <>
                        {/* Sidebar */}
                        <div className="w-64 border-r border-white/10 bg-black/20 overflow-y-auto custom-scrollbar p-4 space-y-3 hidden md:block">
                            <div className="mb-4 px-2">
                                <h3 className="text-sm font-medium text-white line-clamp-1">{deckTitle}</h3>
                                <p className="text-xs text-neutral-500">{slides.length} slides</p>
                            </div>
                            {slides.map((slide, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentSlide(idx)}
                                    className={`w-full text-left p-3 rounded-lg border transition-all group ${currentSlide === idx
                                        ? 'bg-orange-500/10 border-orange-500/50'
                                        : 'bg-white/5 border-transparent hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`text-xs font-mono ${currentSlide === idx ? 'text-orange-500' : 'text-neutral-500'}`}>
                                            {String(idx + 1).padStart(2, '0')}
                                        </span>
                                        <LayoutTemplate size={14} className={currentSlide === idx ? 'text-orange-500' : 'text-neutral-600'} />
                                    </div>
                                    <p className={`text-xs font-medium line-clamp-2 ${currentSlide === idx ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-300'}`}>
                                        {slide.title}
                                    </p>
                                </button>
                            ))}
                        </div>

                        {/* Main View */}
                        <div className="flex-1 flex flex-col bg-[#111] relative overflow-hidden">
                            <div ref={scrollContainerRef} className="flex-1 flex justify-center p-4 md:p-8 py-12 overflow-y-auto custom-scrollbar">
                                <div className="w-full max-w-6xl min-h-[600px] h-auto bg-white text-black rounded-xl shadow-2xl flex flex-col my-auto">
                                    {/* Slide Content */}
                                    <div className="flex-1 p-8 md:p-12 flex flex-col relative z-10">
                                        {/* Header */}
                                        <div className="mb-8 border-b-4 border-orange-500 pb-4">
                                            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 leading-tight mb-2">
                                                {slides[currentSlide].title}
                                            </h2>
                                            {currentSlide === 0 && deckSubtitle && (
                                                <p className="text-lg text-neutral-500 font-light">{deckSubtitle}</p>
                                            )}
                                        </div>

                                        {/* Body */}
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                                            <div className="space-y-4">
                                                {slides[currentSlide].content.map((point: string, idx: number) => (
                                                    <div key={idx} className="flex items-start gap-3 group">
                                                        <div className="mt-2 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 group-hover:scale-125 transition-transform" />
                                                        <p className="text-lg text-neutral-700 leading-relaxed font-medium break-words">
                                                            {point}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Visual Placeholder */}
                                            <div className="bg-neutral-50 rounded-xl flex flex-col items-center justify-center border-4 border-dashed border-neutral-300 relative overflow-hidden group p-4 text-center min-h-[500px]">
                                                {slides[currentSlide].visual_svgs && Array.isArray(slides[currentSlide].visual_svgs) && slides[currentSlide].visual_svgs.length > 0 ? (
                                                    <div className="w-full h-full flex flex-col gap-6 p-2 overflow-y-auto custom-scrollbar">
                                                        {slides[currentSlide].visual_svgs.map((svg: string, idx: number) => (
                                                            <div key={idx} className="relative w-full flex-1 min-h-[300px] group/visual">
                                                                <div
                                                                    className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:drop-shadow-lg transition-transform hover:scale-105 duration-500 bg-white/50 rounded-lg p-4"
                                                                    dangerouslySetInnerHTML={{ __html: svg }}
                                                                />

                                                                {/* Controls */}
                                                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover/visual:opacity-100 transition-all z-10">
                                                                    <button
                                                                        onClick={() => handleRegenerate(currentSlide, idx)}
                                                                        className="p-1.5 bg-white/90 rounded-full shadow-sm hover:bg-blue-50 hover:text-blue-500 transition-colors"
                                                                        title="Refresh variation"
                                                                    >
                                                                        <RefreshCcw size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => removeVisual(currentSlide, idx)}
                                                                        className="p-1.5 bg-white/90 rounded-full shadow-sm hover:bg-red-50 hover:text-red-500 transition-colors"
                                                                        title="Remove visual"
                                                                    >
                                                                        <X size={16} />
                                                                    </button>
                                                                </div>

                                                                {/* Custom Prompt Input */}


                                                                {/* Loading Overlay */}
                                                                {regeneratingVisual?.slideIdx === currentSlide && regeneratingVisual?.visualIdx === idx && (
                                                                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-30">
                                                                        <div className="flex flex-col items-center gap-2">
                                                                            <Loader2 className="animate-spin text-purple-600" size={32} />
                                                                            <span className="text-sm font-medium text-purple-600">Regenerating...</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : slides[currentSlide].visual_svg ? (
                                                    <div
                                                        className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-h-[250px] [&>svg]:drop-shadow-lg transition-transform hover:scale-105 duration-500"
                                                        dangerouslySetInnerHTML={{ __html: slides[currentSlide].visual_svg }}
                                                    />
                                                ) : (
                                                    <>
                                                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        <div className="relative z-10 max-w-sm">
                                                            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                                                <MonitorPlay size={40} className="text-orange-500" />
                                                            </div>
                                                            <p className="text-sm text-neutral-500 font-bold uppercase tracking-wider mb-3">Suggested Visual</p>
                                                            <p className="text-base text-neutral-700 italic leading-relaxed font-medium">
                                                                "{slides[currentSlide].image_description || 'A relevant image or chart illustrating the slide content.'}"
                                                            </p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="bg-neutral-100 p-4 flex justify-between items-center text-xs text-neutral-500 font-medium uppercase tracking-widest border-t border-neutral-200 mt-auto">
                                        <span>{deckTitle}</span>
                                        <span>{currentSlide + 1} / {slides.length}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Fixed Control Bar & Speaker Notes */}
                            <div className="bg-[#09090b] border-t border-white/10 p-4 shrink-0 z-50">
                                <div className="max-w-6xl mx-auto w-full flex flex-col gap-4">
                                    {/* Speaker Notes */}
                                    <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                        <p className="text-xs text-orange-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                                            <Presentation size={12} /> Speaker Notes
                                        </p>
                                        <p className="text-sm text-neutral-400 leading-relaxed line-clamp-2 hover:line-clamp-none transition-all cursor-default">
                                            {slides[currentSlide].notes}
                                        </p>
                                    </div>

                                    {/* Controls */}
                                    <div className="flex items-center justify-between gap-4">
                                        <button
                                            onClick={prevSlide}
                                            disabled={currentSlide === 0}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                                        >
                                            <ChevronLeft size={16} /> Previous
                                        </button>

                                        <div className="flex items-center gap-2 text-sm font-mono text-neutral-500 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                                            <span className="text-white">{currentSlide + 1}</span>
                                            <span>/</span>
                                            <span>{slides.length}</span>
                                        </div>

                                        <button
                                            onClick={nextSlide}
                                            disabled={currentSlide === slides.length - 1}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium text-sm shadow-lg shadow-orange-900/20"
                                        >
                                            Next <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-neutral-500">
                        <div className="w-24 h-24 bg-neutral-900 rounded-full flex items-center justify-center mb-6 border border-neutral-800">
                            <Presentation size={48} className="opacity-20" />
                        </div>
                        <p className="text-xl font-medium text-neutral-400">Ready to create your presentation</p>
                        <p className="text-sm text-neutral-600 mt-2">Enter a topic above to begin</p>
                    </div>
                )}
            </div>
        </div >
    );
};
