import React, { KeyboardEvent } from 'react';

interface QueryBarProps {
    onSubmit: (query: string) => void;
    isLoading: boolean;
    disabled: boolean;
    value: string;
    onChange: (value: string) => void;
}

export const QueryBar: React.FC<QueryBarProps> = ({ onSubmit, isLoading, disabled, value, onChange }) => {
    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (value.trim() && !disabled) {
            onSubmit(value.trim());
            onChange('');
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
                <div className="flex items-end gap-3 bg-neutral-900 border-2 border-neutral-800 rounded-2xl p-4 hover:border-orange-500/50 transition-all duration-300 focus-within:border-orange-500 focus-within:shadow-lg focus-within:shadow-orange-500/20">
                    <div className="flex-shrink-0 text-2xl mb-2">💬</div>
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a question about your sources..."
                        className="flex-1 bg-transparent text-neutral-100 placeholder-neutral-500 outline-none text-lg resize-none min-h-[60px] max-h-[200px]"
                        disabled={disabled || isLoading}
                        rows={2}
                    />
                    <button
                        type="submit"
                        disabled={!value.trim() || disabled || isLoading}
                        className="flex-shrink-0 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/30"
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </button>
                </div>
            </form>

            {/* Helper text */}
            <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
                <span>Press Enter to send, Shift+Enter for new line</span>
                <span>{value.length} characters</span>
            </div>

            {disabled && (
                <div className="mt-2 text-sm text-orange-400 text-center">
                    Please add at least one source to ask questions
                </div>
            )}
        </div>
    );
};
