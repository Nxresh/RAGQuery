import React, { useState } from 'react';

interface Source {
    id: number;
    title: string;
    type: string;
    created_at: string;
    is_starred?: boolean;
}

interface SourceManagerProps {
    sources: Source[];
    onDelete: (id: number) => void;
    onRename: (id: number, newTitle: string) => void;
    selectedSources: number[];
    onToggleSource: (id: number) => void;
    onToggleAll: () => void;
}

export const SourceManager: React.FC<SourceManagerProps> = ({
    sources,
    onDelete,
    onRename,
    selectedSources,
    onToggleSource,
    onToggleAll
}) => {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingTitle, setEditingTitle] = useState('');

    const handleStartEdit = (e: React.MouseEvent, source: Source) => {
        e.stopPropagation();
        setEditingId(source.id);
        setEditingTitle(source.title);
    };

    const handleSaveEdit = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        if (editingId && editingTitle.trim()) {
            onRename(editingId, editingTitle.trim());
        }
        setEditingId(null);
        setEditingTitle('');
    };

    const handleCancelEdit = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        setEditingId(null);
        setEditingTitle('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveEdit(e);
        } else if (e.key === 'Escape') {
            handleCancelEdit(e);
        }
    };

    if (sources.length === 0) {
        return null;
    }

    const allSelected = sources.length > 0 && selectedSources.length === sources.length;

    const getFileBadge = (type: string) => {
        const baseClasses = "w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-bold border shadow-sm";
        switch (type) {
            case 'pdf': return <div className={`${baseClasses} bg-red-500/10 border-red-500/20 text-red-400`}>PDF</div>;
            case 'image': return <div className={`${baseClasses} bg-purple-500/10 border-purple-500/20 text-purple-400`}>IMG</div>;
            case 'audio': return <div className={`${baseClasses} bg-blue-500/10 border-blue-500/20 text-blue-400`}>MP3</div>;
            case 'url': return <div className={`${baseClasses} bg-cyan-500/10 border-cyan-500/20 text-cyan-400`}>WEB</div>;
            case 'youtube': return <div className={`${baseClasses} bg-red-600/10 border-red-600/20 text-red-500`}>YT</div>;
            case 'text': return <div className={`${baseClasses} bg-neutral-500/10 border-neutral-500/20 text-neutral-400`}>TXT</div>;
            default: return <div className={`${baseClasses} bg-neutral-500/10 border-neutral-500/20 text-neutral-400`}>FILE</div>;
        }
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-6 px-2">
                <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
                    Your Sources ({sources.length})
                </h3>
                <button
                    onClick={onToggleAll}
                    className="text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors"
                >
                    {allSelected ? 'Deselect All' : 'Select All'}
                </button>
            </div>
            <div className="space-y-3">
                {sources.map((source, index) => {
                    const isSelected = selectedSources.includes(source.id);
                    const isEditing = editingId === source.id;
                    return (
                        <div
                            key={source.id}
                            onClick={() => !isEditing && onToggleSource(source.id)}
                            className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 border ${isSelected
                                ? 'bg-neutral-800 border-orange-500/50 shadow-lg shadow-orange-500/5'
                                : 'bg-neutral-900/50 border-transparent hover:bg-gradient-to-br hover:from-orange-500/10 hover:to-red-500/10 hover:border-orange-500/50 hover:shadow-[0_0_15px_-3px_rgba(249,115,22,0.2)]'
                                }`}
                        >
                            {/* Number Badge */}
                            <div className="absolute -left-2 -top-2 w-5 h-5 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[10px] text-neutral-500 font-medium shadow-sm z-10">
                                {index + 1}
                            </div>

                            {/* File Icon */}
                            <div className="flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
                                {getFileBadge(source.type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                {isEditing ? (
                                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                        <input
                                            type="text"
                                            value={editingTitle}
                                            onChange={(e) => setEditingTitle(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            autoFocus
                                            className="flex-1 bg-neutral-700 text-white text-sm px-2 py-1 rounded border border-orange-500/50 focus:outline-none focus:border-orange-500"
                                        />
                                        <button
                                            onClick={handleSaveEdit}
                                            className="p-1 text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded"
                                            title="Save"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-600 rounded"
                                            title="Cancel"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <div className={`text-sm font-medium truncate transition-colors ${isSelected ? 'text-white' : 'text-neutral-300 group-hover:text-white'
                                                }`}>
                                                {source.title}
                                            </div>
                                            {source.is_starred && (
                                                <svg className="w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                                </svg>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-neutral-500 mt-0.5">
                                            {new Date(source.created_at).toLocaleDateString()}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Action Buttons */}
                            {!isEditing && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                    {/* Rename Button */}
                                    <button
                                        onClick={(e) => handleStartEdit(e, source)}
                                        className="p-1.5 text-neutral-500 hover:text-orange-400 hover:bg-orange-400/10 rounded-lg transition-all duration-200"
                                        title="Rename source"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>

                                    {/* Delete Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(source.id);
                                        }}
                                        className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                                        title="Delete source"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            {/* Selection Checkmark */}
                            {isSelected && (
                                <div className="absolute right-2 top-2 w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
