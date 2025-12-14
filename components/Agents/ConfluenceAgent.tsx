import React, { useState } from 'react';
import { FileText, Send, Loader2, Upload, RefreshCw, Check, ExternalLink, Edit3, BookOpen, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { addToHistory } from '../HistoryPanel';

type Step = 'input' | 'review' | 'publish' | 'success';

interface GenerateResponse {
    sopContent: string;
    suggestedTitle: string;
    inputLength: number;
}

interface PublishResponse {
    success: boolean;
    message: string;
    pageUrl: string;
}

export const ConfluenceAgent: React.FC = () => {
    const [currentStep, setCurrentStep] = useState<Step>('input');
    const [knowledge, setKnowledge] = useState('');
    const [title, setTitle] = useState('');
    const [sopContent, setSopContent] = useState('');
    const [spaceKey, setSpaceKey] = useState('DOCS');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [publishResult, setPublishResult] = useState<PublishResponse | null>(null);

    const handleGenerate = async () => {
        if (!knowledge.trim() || knowledge.length < 10) {
            setError('Please enter at least 10 characters of knowledge');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/agents/confluence/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ knowledge: knowledge.trim(), title: title.trim() || undefined })
            });

            const data: GenerateResponse = await res.json();

            if (!res.ok) {
                throw new Error((data as any).error || 'Failed to generate SOP');
            }

            setSopContent(data.sopContent);
            if (data.suggestedTitle && !title) {
                setTitle(data.suggestedTitle);
            }
            // Save to history
            addToHistory('ares_agents_history', title || data.suggestedTitle || 'SOP Generation', 'Confluence');
            setCurrentStep('review');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePublish = async () => {
        if (!sopContent || !title || !spaceKey) {
            setError('Missing required fields');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/agents/confluence/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    content: sopContent,
                    spaceKey,
                    action: 'create'
                })
            });

            const data: PublishResponse = await res.json();

            if (!res.ok) {
                throw new Error((data as any).error || 'Failed to publish');
            }

            setPublishResult(data);
            setCurrentStep('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const resetFlow = () => {
        setCurrentStep('input');
        setKnowledge('');
        setTitle('');
        setSopContent('');
        setError(null);
        setPublishResult(null);
    };

    const stepIndicator = (step: Step, label: string, index: number) => {
        const steps: Step[] = ['input', 'review', 'publish', 'success'];
        const currentIndex = steps.indexOf(currentStep);
        const stepIndex = steps.indexOf(step);
        const isActive = stepIndex === currentIndex;
        const isCompleted = stepIndex < currentIndex;

        return (
            <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${isCompleted ? 'bg-green-500 text-white' :
                    isActive ? 'bg-orange-500 text-white' :
                        'bg-white/10 text-neutral-500'
                    }`}>
                    {isCompleted ? <Check size={16} /> : index}
                </div>
                <span className={`text-sm ${isActive ? 'text-white font-medium' : 'text-neutral-500'}`}>
                    {label}
                </span>
                {index < 4 && <ChevronRight size={16} className="text-neutral-600 mx-2" />}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                                <BookOpen size={24} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Confluence SOP Generator</h2>
                                <p className="text-sm text-neutral-400">Create & publish SOPs directly to Confluence</p>
                            </div>
                        </div>

                        {/* Step Indicator */}
                        <div className="flex items-center justify-center py-4 bg-black/20 rounded-xl">
                            {stepIndicator('input', 'Input', 1)}
                            {stepIndicator('review', 'Review', 2)}
                            {stepIndicator('publish', 'Publish', 3)}
                            {stepIndicator('success', 'Done', 4)}
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
                            <p className="font-medium">Error</p>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                    )}

                    {/* Step 1: Input */}
                    {currentStep === 'input' && (
                        <div className="space-y-4">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300">Title (Optional)</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g., How to Deploy to Production"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300">Your Knowledge</label>
                                    <textarea
                                        value={knowledge}
                                        onChange={(e) => setKnowledge(e.target.value)}
                                        placeholder="Describe the process, steps, or knowledge you want to document as an SOP. Be as detailed as you like - the AI will structure it properly.

Example:
When deploying to production, first we need to run the test suite. Then create a PR and get it reviewed. After approval, merge to main and the CI/CD pipeline will handle the rest. Make sure to monitor the deployment in Datadog..."
                                        className="w-full h-64 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none"
                                        disabled={isLoading}
                                    />
                                    <p className="text-xs text-neutral-500">{knowledge.length} characters</p>
                                </div>

                                <Button
                                    onClick={handleGenerate}
                                    disabled={knowledge.length < 10 || isLoading}
                                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl shadow-lg shadow-orange-500/20"
                                >
                                    {isLoading ? (
                                        <><Loader2 size={18} className="animate-spin mr-2" /> Generating SOP...</>
                                    ) : (
                                        <><FileText size={18} className="mr-2" /> Generate SOP</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Review */}
                    {currentStep === 'review' && (
                        <div className="space-y-4">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <Edit3 size={18} /> Review & Edit SOP
                                    </h3>
                                    <Button
                                        onClick={() => setCurrentStep('input')}
                                        variant="ghost"
                                        className="text-neutral-400 hover:text-white"
                                    >
                                        <RefreshCw size={16} className="mr-2" /> Regenerate
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300">Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300">SOP Content (Editable)</label>
                                    <textarea
                                        value={sopContent}
                                        onChange={(e) => setSopContent(e.target.value)}
                                        className="w-full h-96 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all resize-none"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => setCurrentStep('publish')}
                                        className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl shadow-lg shadow-green-500/20"
                                    >
                                        <Check size={18} className="mr-2" /> Confirm & Continue
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Publish */}
                    {currentStep === 'publish' && (
                        <div className="space-y-4">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Upload size={18} /> Publish to Confluence
                                </h3>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300">Space Key</label>
                                    <select
                                        value={spaceKey}
                                        onChange={(e) => setSpaceKey(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
                                    >
                                        <option value="DOCS">Documentation (DOCS)</option>
                                        <option value="TEAM">Team Space (TEAM)</option>
                                        <option value="KB">Knowledge Base (KB)</option>
                                    </select>
                                </div>

                                <div className="bg-black/30 rounded-xl p-4">
                                    <p className="text-sm text-neutral-400 mb-2">Publishing:</p>
                                    <p className="text-white font-medium">{title}</p>
                                    <p className="text-xs text-neutral-500 mt-1">{sopContent.length} characters</p>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => setCurrentStep('review')}
                                        variant="outline"
                                        className="flex-1 py-4 border-white/20 text-white hover:bg-white/10 rounded-xl"
                                    >
                                        Back to Edit
                                    </Button>
                                    <Button
                                        onClick={handlePublish}
                                        disabled={isLoading}
                                        className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl shadow-lg shadow-orange-500/20"
                                    >
                                        {isLoading ? (
                                            <><Loader2 size={18} className="animate-spin mr-2" /> Publishing...</>
                                        ) : (
                                            <><Send size={18} className="mr-2" /> Publish to Confluence</>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Success */}
                    {currentStep === 'success' && publishResult && (
                        <div className="space-y-4">
                            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-8 text-center">
                                <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
                                    <Check size={32} className="text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Published Successfully!</h3>
                                <p className="text-neutral-400 mb-6">{publishResult.message}</p>

                                <div className="flex gap-3 justify-center">
                                    <a
                                        href={publishResult.pageUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                                    >
                                        <ExternalLink size={18} /> View in Confluence
                                    </a>
                                    <Button
                                        onClick={resetFlow}
                                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl"
                                    >
                                        Create Another SOP
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
