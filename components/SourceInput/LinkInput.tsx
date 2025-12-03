import React, { useState, useRef, useEffect } from 'react';
import { Info, Star } from 'lucide-react';

interface LinkInputProps {
    onSubmit: (url: string, isStarred: boolean) => void;
    isLoading: boolean;
}

export const LinkInput: React.FC<LinkInputProps> = ({ onSubmit, isLoading }) => {
    const [url, setUrl] = useState('');
    const [showInfo, setShowInfo] = useState(false);
    const [isStarred, setIsStarred] = useState(false);
    const infoRef = useRef<HTMLDivElement>(null);

    // Close info tooltip when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (infoRef.current && !infoRef.current.contains(event.target as Node)) {
                setShowInfo(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url.trim()) {
            onSubmit(url.trim(), isStarred);
            setUrl('');
            setIsStarred(false); // Reset star after submit
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto relative">
            <form onSubmit={handleSubmit} className="relative group">
                {/* Address Bar Container */}
                <div className="flex items-center gap-3 bg-[#202124] rounded-full px-4 py-3 border border-transparent group-focus-within:border-neutral-700 transition-all duration-200 shadow-sm">

                    {/* Left Icon (Info) */}
                    <div
                        className="flex-shrink-0 text-neutral-400 hover:text-neutral-200 cursor-pointer transition-colors relative"
                        onClick={() => setShowInfo(!showInfo)}
                        title="Supported Sources"
                    >
                        <Info size={18} strokeWidth={2} />
                    </div>

                    {/* Prefix and Input Wrapper */}
                    <div className="flex-1 flex items-center min-w-0">
                        <span className="text-neutral-500 font-medium mr-0.5 select-none">https://</span>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Paste a web link or YouTube URL..."
                            className="flex-1 bg-transparent text-neutral-200 placeholder-neutral-600 outline-none text-base font-normal min-w-0"
                            disabled={isLoading}
                            autoComplete="off"
                        />
                    </div>

                    {/* Right Icon (Star) */}
                    <div
                        className={`flex-shrink-0 cursor-pointer transition-colors ${isStarred ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-400 hover:text-neutral-200'}`}
                        onClick={() => setIsStarred(!isStarred)}
                        title={isStarred ? "Remove from Favorites" : "Mark as Favorite"}
                    >
                        <Star size={18} strokeWidth={2} fill={isStarred ? "currentColor" : "none"} />
                    </div>
                </div>
            </form>

            {/* Info Tooltip */}
            {showInfo && (
                <div ref={infoRef} className="absolute top-full left-0 mt-2 p-4 bg-[#202124] border border-neutral-800 rounded-xl shadow-xl z-50 w-64 animate-in fade-in zoom-in-95 duration-200">
                    <h4 className="text-sm font-semibold text-white mb-2">Supported Sources</h4>
                    <ul className="space-y-2 text-xs text-neutral-400">
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                            Public Websites & Articles
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            YouTube Videos
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            PDF URLs
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};
