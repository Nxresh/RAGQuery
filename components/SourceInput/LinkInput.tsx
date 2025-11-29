import React, { useState } from 'react';

interface LinkInputProps {
    onSubmit: (url: string) => void;
    isLoading: boolean;
}

export const LinkInput: React.FC<LinkInputProps> = ({ onSubmit, isLoading }) => {
    const [url, setUrl] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url.trim()) {
            onSubmit(url.trim());
            setUrl('');
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
                <div className="flex items-center gap-2 rounded-md p-1.5 transition-all duration-200">
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Enter web link or YouTube URL..."
                        className="flex-1 bg-neutral-900 text-neutral-100 placeholder-neutral-500 outline-none text-sm px-3 py-1.5 rounded-md focus:ring-1 focus:ring-orange-500/50"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!url.trim() || isLoading}
                        className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-medium rounded-md hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                        {isLoading ? 'Processing...' : 'Add'}
                    </button>
                </div>
            </form>
        </div>
    );
};
