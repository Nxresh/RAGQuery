import React from 'react';
import { RAGResult } from '../types';
import { ResultsDisplay } from './ResultsDisplay';

interface ConversationItem {
    id: number;
    query: string;
    result: RAGResult;
    timestamp: Date;
}

interface ConversationHistoryProps {
    conversations: ConversationItem[];
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({ conversations }) => {
    if (conversations.length === 0) {
        return null;
    }

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-neutral-100 mb-6 flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                    💬
                </span>
                Conversation History
            </h2>

            {conversations.map((item, index) => (
                <div key={item.id} className="space-y-4">
                    {/* Question Card */}
                    <div className="bg-gradient-to-r from-neutral-900/80 to-neutral-900/40 border border-neutral-800 rounded-2xl p-5 hover:border-orange-500/30 transition-all duration-300">
                        <div className="flex items-start gap-4">
                            {/* Question Number Badge */}
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/30">
                                Q{index + 1}
                            </div>

                            {/* Question Content */}
                            <div className="flex-1 min-w-0">
                                <p className="text-neutral-100 text-lg font-medium leading-relaxed">
                                    {item.query}
                                </p>
                                <div className="flex items-center gap-2 mt-3">
                                    <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-xs text-neutral-500">
                                        {item.timestamp.toLocaleTimeString()} • {item.timestamp.toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Answer Section */}
                    <div className="ml-14 relative">
                        {/* Connection Line */}
                        <div className="absolute -left-7 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-500/50 to-transparent" />

                        {/* Answer Badge */}
                        <div className="absolute -left-[42px] top-4 w-10 h-10 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 border-2 border-orange-500/50 flex items-center justify-center text-orange-400 font-bold shadow-lg">
                            A{index + 1}
                        </div>

                        {/* Answer Content */}
                        <div className="bg-neutral-950/50 border border-neutral-800/50 rounded-2xl p-6">
                            <ResultsDisplay
                                results={item.result}
                                isLoading={false}
                                error={null}
                                hasSubmitted={true}
                            />
                        </div>
                    </div>

                    {/* Divider between conversations */}
                    {index < conversations.length - 1 && (
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-neutral-800" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-black px-4 text-xs text-neutral-600">
                                    {conversations.length - index - 1} more {conversations.length - index - 1 === 1 ? 'question' : 'questions'} below
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
