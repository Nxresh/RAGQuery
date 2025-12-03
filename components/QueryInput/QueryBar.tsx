import React, { KeyboardEvent, useState, useRef, useEffect } from 'react';
import { Plus, AudioLines, Send, Loader2, FileText, Link as LinkIcon, Image as ImageIcon, Mic, FileUp, X } from 'lucide-react';
import { Button } from '../ui/button';

interface QueryBarProps {
    onSubmit: (query: string) => void;
    onFileUpload?: (file: File, type: 'pdf' | 'image' | 'audio') => void;
    onLinkSubmit?: (url: string) => void;
    onTextSubmit?: (text: string) => void;
    isLoading: boolean;
    disabled: boolean;
    value: string;
    onChange: (value: string) => void;
}

export const QueryBar: React.FC<QueryBarProps> = ({
    onSubmit,
    onFileUpload,
    onLinkSubmit,
    onTextSubmit,
    isLoading,
    disabled,
    value,
    onChange
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const [mode, setMode] = useState<'chat' | 'link' | 'text'>('chat');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!value.trim() || disabled || isLoading) return;

        if (mode === 'chat') {
            onSubmit(value.trim());
        } else if (mode === 'link' && onLinkSubmit) {
            onLinkSubmit(value.trim());
            setMode('chat');
        } else if (mode === 'text' && onTextSubmit) {
            onTextSubmit(value.trim());
            setMode('chat');
        }
        onChange('');
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        } else if (e.key === 'Escape') {
            setMode('chat');
            setShowMenu(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !onFileUpload) return;

        const type = file.type.includes('pdf') ? 'pdf' :
            file.type.includes('image') ? 'image' :
                file.type.includes('audio') ? 'audio' : null;

        if (type) {
            onFileUpload(file, type as 'pdf' | 'image' | 'audio');
        } else {
            alert('Unsupported file type');
        }
        setShowMenu(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const getPlaceholder = () => {
        switch (mode) {
            case 'link': return "Paste URL here...";
            case 'text': return "Paste text content here...";
            default: return "Send a message...";
        }
    };

    const getIcon = () => {
        switch (mode) {
            case 'link': return <LinkIcon size={20} className="text-blue-500" />;
            case 'text': return <FileText size={20} className="text-green-500" />;
            default: return <AudioLines size={20} className="text-neutral-500" />;
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto relative">
            {/* Menu */}
            {showMenu && (
                <div ref={menuRef} className="absolute bottom-full left-0 mb-4 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl overflow-hidden min-w-[200px] z-50 animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-2 space-y-1">
                        {onFileUpload && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white rounded-lg transition-colors text-left"
                            >
                                <FileUp size={16} className="text-orange-500" />
                                Upload File
                            </button>
                        )}
                        {onLinkSubmit && (
                            <button
                                onClick={() => { setMode('link'); setShowMenu(false); inputRef.current?.focus(); }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white rounded-lg transition-colors text-left"
                            >
                                <LinkIcon size={16} className="text-blue-500" />
                                Add Link
                            </button>
                        )}
                        {onTextSubmit && (
                            <button
                                onClick={() => { setMode('text'); setShowMenu(false); inputRef.current?.focus(); }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white rounded-lg transition-colors text-left"
                            >
                                <FileText size={16} className="text-green-500" />
                                Paste Text
                            </button>
                        )}
                    </div>
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,image/*,audio/*"
                onChange={handleFileSelect}
            />

            <form onSubmit={handleSubmit} className="relative flex items-center gap-3">
                {/* Plus Button */}
                <button
                    type="button"
                    onClick={() => mode === 'chat' ? setShowMenu(!showMenu) : setMode('chat')}
                    className={`flex-shrink-0 w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-200 ${mode !== 'chat'
                        ? 'bg-red-500/10 border-red-500/50 text-red-500 hover:bg-red-500/20'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                        }`}
                >
                    {mode !== 'chat' ? <X size={20} /> : <Plus size={20} />}
                </button>

                {/* Input Pill */}
                <div className={`flex-1 flex items-center bg-neutral-900 border rounded-full px-4 py-2 transition-all duration-200 ${mode === 'link' ? 'border-blue-500/50 ring-1 ring-blue-500/20' :
                    mode === 'text' ? 'border-green-500/50 ring-1 ring-green-500/20' :
                        'border-neutral-800 hover:border-neutral-700 focus-within:border-orange-500/50 focus-within:ring-1 focus-within:ring-orange-500/50'
                    }`}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={getPlaceholder()}
                        className="flex-1 bg-transparent text-neutral-200 placeholder-neutral-500 outline-none text-sm min-h-[24px]"
                        disabled={disabled || isLoading}
                        autoComplete="off"
                    />
                    <div className="flex-shrink-0 ml-2">
                        {getIcon()}
                    </div>
                </div>

                {/* Send Button */}
                <Button
                    type="submit"
                    variant="premium-subtle"
                    size="icon"
                    disabled={!value.trim() || disabled || isLoading}
                    className="flex-shrink-0 rounded-full shadow-lg"
                >
                    {isLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <Send size={18} className="ml-0.5" />
                    )}
                </Button>
            </form>

            {/* Helper text */}
            <div className="mt-2 flex items-center justify-between text-xs text-neutral-600 px-2">
                <span>
                    {mode === 'chat' ? 'Press Enter to send' :
                        mode === 'link' ? 'Press Enter to add link' :
                            'Press Enter to add text'}
                </span>
                <span>{value.length} chars</span>
            </div>

            {disabled && mode === 'chat' && (
                <div className="mt-2 text-sm text-orange-400 text-center">
                    Please add at least one source to ask questions
                </div>
            )}
        </div>
    );
};
