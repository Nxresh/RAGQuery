import React, { useState } from 'react';

interface Source {
    id: number;
    title: string;
    type: string;
    content: string;
    created_at: string;
}

interface LibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    sources: Source[];
}

export const LibraryModal: React.FC<LibraryModalProps> = ({ isOpen, onClose, sources }) => {
    const [activeTab, setActiveTab] = useState<'images' | 'audio'>('images');

    if (!isOpen) return null;

    const images = sources.filter(s => s.type === 'image');
    const audioFiles = sources.filter(s => s.type === 'audio');

    return (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl shadow-orange-900/20">
                {/* Header */}
                <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
                            <path d="M3 6h18M3 12h18M3 18h18" />
                        </svg>
                        Library
                    </h2>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-neutral-800">
                    <button
                        onClick={() => setActiveTab('images')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'images' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-neutral-400 hover:text-neutral-200'}`}
                    >
                        Images ({images.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('audio')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'audio' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-neutral-400 hover:text-neutral-200'}`}
                    >
                        Audio ({audioFiles.length})
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'images' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {images.map(img => (
                                <div key={img.id} className="group relative aspect-square bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700">
                                    {/* Since we don't store the actual image URL in DB (just text analysis), we can't show the image itself easily without storing the blob. 
                                        For now, we'll show a placeholder with the title. 
                                        In a real app, we'd store the file path or base64. */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-600 mb-2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                            <polyline points="21 15 16 10 5 21" />
                                        </svg>
                                        <span className="text-xs text-neutral-400 line-clamp-2">{img.title}</span>
                                    </div>
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                                        <p className="text-xs text-white line-clamp-4">{img.content}</p>
                                    </div>
                                </div>
                            ))}
                            {images.length === 0 && (
                                <div className="col-span-full text-center py-12 text-neutral-500">
                                    No images uploaded yet.
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'audio' && (
                        <div className="space-y-3">
                            {audioFiles.map(audio => (
                                <div key={audio.id} className="bg-neutral-800/50 border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500 mt-1">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                                <line x1="12" y1="19" x2="12" y2="23"></line>
                                                <line x1="8" y1="23" x2="16" y2="23"></line>
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-medium text-white truncate mb-1">{audio.title}</h3>
                                            <p className="text-xs text-neutral-400 line-clamp-2">{audio.content}</p>
                                            <div className="mt-2 text-[10px] text-neutral-600 uppercase tracking-wider">
                                                {new Date(audio.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {audioFiles.length === 0 && (
                                <div className="text-center py-12 text-neutral-500">
                                    No audio files uploaded yet.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
