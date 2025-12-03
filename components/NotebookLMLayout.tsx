import React, { useState, useEffect, useRef } from 'react';
import { LinkInput } from './SourceInput/LinkInput';
import { FileUploadGrid } from './SourceInput/FileUploadGrid';
import { SourceManager } from './SourceInput/SourceManager';
import { RAGResult } from '../types';
import { TypewriterText } from './TypewriterText';
import { SidebarProvider, SidebarInset } from "./ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { LibraryModal } from './LibraryModal';
import { User } from 'firebase/auth';
import './ChatStyles.css';
import { StudioLayout } from './Studio/StudioLayout';
import { LayoutDashboard, MessageSquare, Home, Archive, Settings, User as UserIcon } from 'lucide-react';
import { QueryBar } from './QueryInput/QueryBar';
import AnimatedNavBar from './Dock/AnimatedNavBar';
import { Button } from './ui/button';
import { CollapsedSidebarTrigger } from './CollapsedSidebarTrigger';

interface Source {
    id: number;
    title: string;
    type: string;
    content: string;
    created_at: string;
    is_starred?: boolean;
}

interface ConversationItem {
    id: number;
    query: string;
    result?: RAGResult;
    timestamp: Date;
}

interface Project {
    id: number;
    name: string;
    source_ids: number[];
    created_at?: string;
}

interface NotebookLMLayoutProps {
    onSignOut: () => void;
    user?: User | null;
}

export const NotebookLMLayout: React.FC<NotebookLMLayoutProps> = ({ onSignOut, user }) => {
    const [sources, setSources] = useState<Source[]>([]);
    const [selectedSources, setSelectedSources] = useState<number[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isQuerying, setIsQuerying] = useState(false);
    const [conversations, setConversations] = useState<ConversationItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    // const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Handled by SidebarProvider
    const [currentQuery, setCurrentQuery] = useState('');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // View State
    const [activeView, setActiveView] = useState<'chat' | 'studio'>('chat');

    // Projects & Search State
    const [projects, setProjects] = useState<Project[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);

    // Load sources and projects from backend
    useEffect(() => {
        if (user) {
            fetchSources();
            fetchProjects();
        }
    }, [user]);

    useEffect(() => {
        scrollToBottom();
    }, [conversations, isQuerying]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchSources = async () => {
        try {
            const response = await fetch('/api/documents', {
                headers: {
                    'X-User-Id': user?.uid || ''
                }
            });
            const data = await response.json();
            setSources(data.documents || []);
            // Only reset selected sources if we're not in a project view (optional logic)
            // setSelectedSources((data.documents || []).map((s: Source) => s.id));
        } catch (err) {
            console.error('Failed to fetch sources:', err);
        }
    };

    const fetchProjects = async () => {
        try {
            const response = await fetch('/api/projects', {
                headers: {
                    'X-User-Id': user?.uid || ''
                }
            });
            const data = await response.json();
            setProjects(data.projects || []);
        } catch (err) {
            console.error('Failed to fetch projects:', err);
        }
    };

    const saveSource = async (title: string, content: string, type: string, isStarred: boolean = false) => {
        const response = await fetch('/api/documents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': user?.uid || ''
            },
            body: JSON.stringify({ title, content, type, isStarred })
        });

        if (!response.ok) throw new Error('Failed to save source');
    };

    const handleLinkSubmit = async (url: string, isStarred: boolean) => {
        setIsProcessing(true);
        setError(null);

        try {
            const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

            if (isYouTube) {
                const response = await fetch('/api/process/youtube', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });

                if (!response.ok) throw new Error('Failed to process YouTube video');

                const data = await response.json();
                await saveSource(data.title, data.content, 'youtube', isStarred);
            } else {
                const response = await fetch('/api/proxy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'scrape',
                        payload: { url }
                    })
                });

                if (!response.ok) throw new Error('Failed to scrape website');

                const data = await response.json();
                await saveSource(url, data.content, 'url', isStarred);
            }

            await fetchSources();
            setIsUploadModalOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process URL');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileUpload = async (file: File, type: string) => {
        setIsProcessing(true);
        setError(null);

        try {
            if (type === 'pdf') {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    headers: {
                        'X-User-Id': user?.uid || ''
                    },
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || `Upload failed: ${response.status}`);
                }

                const data = await response.json();
                // Server already saves to DB, but we need to refresh the sources list
                console.log('[Upload] PDF uploaded successfully:', data.title);

            } else if (type === 'image') {
                const formData = new FormData();
                formData.append('image', file);

                const response = await fetch('/api/process/image', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || `Image processing failed: ${response.status}`);
                }

                const data = await response.json();
                await saveSource(file.name, data.text, 'image');

            } else if (type === 'audio') {
                const formData = new FormData();
                formData.append('audio', file);

                const response = await fetch('/api/process/audio', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error('Failed to transcribe audio');

                const data = await response.json();
                await saveSource(file.name, data.transcript, 'audio');
            }

            await fetchSources();
            setIsUploadModalOpen(false);
        } catch (err) {
            console.error('Upload error:', err);
            setError(err instanceof Error ? err.message : 'Failed to process file');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleTextUpload = async () => {
        const text = prompt('Paste your text here:');
        if (!text) return;

        setIsProcessing(true);
        try {
            await saveSource('Pasted Text', text, 'text');
            await fetchSources();
            setIsUploadModalOpen(false);
        } catch (err) {
            setError('Failed to save text');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteSource = async (id: number) => {
        try {
            await fetch(`/api/documents/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-User-Id': user?.uid || ''
                }
            });
            await fetchSources();
            setSelectedSources(prev => prev.filter(sid => sid !== id));
        } catch (err) {
            setError('Failed to delete source');
        }
    };

    const handleToggleSource = (id: number) => {
        setSelectedSources(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const handleToggleAll = () => {
        if (selectedSources.length === sources.length) {
            setSelectedSources([]);
        } else {
            setSelectedSources(sources.map(s => s.id));
        }
    };

    const handleQuery = async () => {
        if (!currentQuery.trim()) return;
        if (selectedSources.length === 0) {
            setError('Please select at least one source');
            return;
        }

        setIsQuerying(true);
        setError(null);

        // Add user message immediately (Optimistic UI)
        const tempId = Date.now();
        const query = currentQuery;
        setCurrentQuery('');

        setConversations(prev => [...prev, {
            id: tempId,
            query,
            timestamp: new Date()
        }]);

        try {
            const selectedSourcesData = sources.filter(s => selectedSources.includes(s.id));
            const combinedContent = selectedSourcesData.map(s => s.content).join('\n\n');

            const response = await fetch('/api/proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'rag',
                    payload: {
                        documentContent: combinedContent,
                        query
                    }
                })
            });

            if (!response.ok) throw new Error('Query failed');

            const data = await response.json();

            // Update the placeholder message with the actual result
            setConversations(prev => prev.map(msg =>
                msg.id === tempId ? { ...msg, result: data } : msg
            ));
        } catch (err) {
            console.error('Query error:', err);
            setError(err instanceof Error ? err.message : 'Query failed');
            // Remove the optimistic message on failure
            setConversations(prev => prev.filter(msg => msg.id !== tempId));
            setCurrentQuery(query);
        } finally {
            setIsQuerying(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleQuery();
        }
    };

    const handleCreateProject = async () => {
        if (selectedSources.length === 0) {
            alert('Please select at least one source to create a project.');
            return;
        }
        if (selectedSources.length > 5) {
            alert('You can select a maximum of 5 sources for a project.');
            return;
        }

        const name = prompt('Enter project name:');
        if (!name) return;

        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': user?.uid || ''
                },
                body: JSON.stringify({ name, source_ids: selectedSources })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create project');
            }

            await fetchProjects();
            alert('Project created successfully!');
        } catch (err) {
            console.error('Create project error:', err);
            alert(err instanceof Error ? err.message : 'Failed to create project');
        }
    };

    const handleRenameProject = async (project: Project) => {
        const newName = prompt('Enter new project name:', project.name);
        if (!newName || newName === project.name) return;

        try {
            const response = await fetch(`/api/projects/${project.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': user?.uid || ''
                },
                body: JSON.stringify({ name: newName })
            });

            if (!response.ok) throw new Error('Failed to rename project');

            await fetchProjects();
        } catch (err) {
            console.error('Rename project error:', err);
            alert('Failed to rename project');
        }
    };

    const handleDeleteProject = async (project: Project) => {
        if (!confirm(`Are you sure you want to delete project "${project.name}"?`)) return;

        try {
            const response = await fetch(`/api/projects/${project.id}`, {
                method: 'DELETE',
                headers: {
                    'X-User-Id': user?.uid || ''
                }
            });

            if (!response.ok) throw new Error('Failed to delete project');

            await fetchProjects();
            // If the deleted project was selected, clear selection
            if (selectedSources.length > 0 && JSON.stringify(selectedSources) === JSON.stringify(project.source_ids)) {
                setSelectedSources([]);
                setConversations([]);
                setCurrentQuery('');
            }
        } catch (err) {
            console.error('Delete project error:', err);
            alert('Failed to delete project');
        }
    };

    const handleSelectProject = (project: Project) => {
        setSelectedSources(project.source_ids);
        setConversations([]); // Optional: clear chat when switching projects
        setCurrentQuery('');
    };

    // Filter sources based on search query
    const filteredSources = sources.filter(source =>
        source.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleNewChat = () => {
        setConversations([]);
        setCurrentQuery('');
    };

    return (
        <>
            <SidebarProvider>
                <div className="flex h-screen bg-black overflow-hidden w-full">
                    {/* Sidebar */}
                    <AppSidebar
                        user={user || undefined}
                        onNewChat={handleNewChat}
                        projects={projects}
                        onSelectProject={handleSelectProject}
                        onCreateProject={handleCreateProject}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onRenameProject={handleRenameProject}
                        onDeleteProject={handleDeleteProject}
                        onOpenLibrary={() => setIsLibraryOpen(true)}
                    >
                        <div className="mb-4">
                            <h2 className="text-xs font-medium text-neutral-500 mb-2 px-2 uppercase tracking-wider">Sources</h2>
                            <SourceManager
                                sources={filteredSources}
                                onDelete={handleDeleteSource}
                                selectedSources={selectedSources}
                                onToggleSource={handleToggleSource}
                                onToggleAll={handleToggleAll}
                            />
                        </div>
                    </AppSidebar>

                    <SidebarInset className="bg-black flex-1 flex flex-col min-w-0">
                        {/* ========== TOP BAR ========== */}
                        <div className="topbar">
                            <div className="topbar-left">
                                <CollapsedSidebarTrigger />
                                <div className="flex items-center gap-2">
                                    <AnimatedNavBar
                                        items={[
                                            {
                                                id: 'chat',
                                                label: 'Chat',
                                                icon: <MessageSquare size={16} />,
                                                onClick: () => setActiveView('chat'),
                                                isActive: activeView === 'chat'
                                            },
                                            {
                                                id: 'studio',
                                                label: 'Studio',
                                                icon: <LayoutDashboard size={16} />,
                                                onClick: () => setActiveView('studio'),
                                                isActive: activeView === 'studio'
                                            }
                                        ]}
                                        magnification={1.1}
                                        distance={60}
                                        baseScale={1}
                                        className="!bg-transparent !border-none !p-0"
                                    />
                                </div>
                            </div>

                            <div className="topbar-center">
                                Enterprise Intelligence
                            </div>

                            <div className="topbar-right">
                                <Button
                                    variant="premium"
                                    size="icon"
                                    onClick={() => setIsUploadModalOpen(true)}
                                    title="Upload Documents"
                                    className="rounded-full"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="17 8 12 3 7 8"></polyline>
                                        <line x1="12" y1="3" x2="12" y2="15"></line>
                                    </svg>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onSignOut}
                                    title="Sign Out"
                                    className="rounded-full text-neutral-400 hover:text-white"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                        <polyline points="16 17 21 12 16 7"></polyline>
                                        <line x1="21" y1="12" x2="9" y2="12"></line>
                                    </svg>
                                </Button>
                            </div>
                        </div>

                        {/* ========== CONTENT WRAPPER ========== */}
                        {activeView === 'studio' ? (
                            <div className="flex-1 overflow-hidden">
                                <StudioLayout
                                    sources={sources}
                                    selectedSources={selectedSources}
                                    onFileUpload={handleFileUpload}
                                    isProcessing={isProcessing}
                                />
                            </div>
                        ) : (
                            <div className="chat-wrapper">
                                <div className="chat-messages">
                                    {conversations.length === 0 ? (
                                        <div className="welcome-container">
                                            <h1 className="text-2xl font-bold mb-2 text-white">Welcome to ARES</h1>
                                            <p className="text-sm mb-6 text-neutral-400 max-w-md">
                                                Upload documents or add links to get started.
                                            </p>

                                            <div className="w-full max-w-4xl space-y-12">
                                                {/* Link Input Card - No heading */}
                                                <div className="p-1">
                                                    <LinkInput onSubmit={handleLinkSubmit} isLoading={isProcessing} />
                                                </div>

                                                {/* File Upload Card - No background */}
                                                <div className="p-1">
                                                    <FileUploadGrid
                                                        onFileUpload={handleFileUpload}
                                                        onTextUpload={handleTextUpload}
                                                        isProcessing={isProcessing}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="max-w-3xl mx-auto w-full">
                                            {conversations.map((item) => (
                                                <React.Fragment key={item.id}>
                                                    {/* User Message */}
                                                    <div className="message-row user">
                                                        <div className="message-avatar user-avatar">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                                        </div>
                                                        <div className="message-content">
                                                            <div className="whitespace-pre-wrap">{item.query}</div>
                                                        </div>
                                                    </div>

                                                    {/* Model Message */}
                                                    <div className="message-row model">
                                                        <div className="message-avatar model-avatar">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h1a7 7 0 0 1 7-7V5.73C9.4 5.39 9 4.74 9 4a2 2 0 0 1 2-2z"></path><path d="M8 14h8"></path><path d="M11 17h2"></path></svg>
                                                        </div>
                                                        <div className="message-content">
                                                            {item.result ? (
                                                                <>
                                                                    <div className="prose prose-invert prose-sm max-w-none">
                                                                        <TypewriterText text={item.result.synthesizedAnswer || ''} speed={10} />
                                                                    </div>

                                                                    {/* Sources */}
                                                                    {item.result.rankedChunks && item.result.rankedChunks.length > 0 && (
                                                                        <div className="mt-4 pt-4 border-t border-neutral-800">
                                                                            <p className="text-xs font-semibold text-neutral-500 mb-2">Sources:</p>
                                                                            <div className="space-y-2">
                                                                                {item.result.rankedChunks.slice(0, 3).map((chunk, idx) => (
                                                                                    <div key={idx} className="bg-neutral-900 border border-neutral-800 rounded p-2 text-xs text-neutral-400">
                                                                                        <div className="flex justify-between mb-1">
                                                                                            <span className="font-medium text-orange-500">Relevance: {chunk.relevanceScore}%</span>
                                                                                        </div>
                                                                                        <p className="line-clamp-2">{chunk.chunkText}</p>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <div className="flex items-center gap-3 h-full">
                                                                    <div className="flex gap-1.5 items-center">
                                                                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                                    </div>
                                                                    <span className="text-sm text-neutral-400 animate-pulse">Analyzing sources...</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </React.Fragment>
                                            ))}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    )}
                                </div>

                                {/* ========== INPUT BOX ========== */}
                                <div className="p-4 bg-black border-t border-neutral-800">
                                    {error && (
                                        <div className="mb-4 bg-red-900/80 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm flex justify-between items-center backdrop-blur-sm">
                                            <span>{error}</span>
                                            <button onClick={() => setError(null)} className="text-red-200 hover:text-white">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                            </button>
                                        </div>
                                    )}
                                    <QueryBar
                                        onSubmit={handleQuery}
                                        onFileUpload={handleFileUpload}
                                        onLinkSubmit={(url) => handleLinkSubmit(url, false)}
                                        onTextSubmit={async (text) => {
                                            setIsProcessing(true);
                                            try {
                                                await saveSource('Pasted Text', text, 'text');
                                                await fetchSources();
                                            } catch (err) {
                                                setError('Failed to save text');
                                            } finally {
                                                setIsProcessing(false);
                                            }
                                        }}
                                        isLoading={isQuerying || isProcessing}
                                        disabled={isQuerying || isProcessing}
                                        value={currentQuery}
                                        onChange={setCurrentQuery}
                                    />
                                </div>
                            </div>
                        )}
                    </SidebarInset>
                </div>

                {/* Upload Modal (Optional/Secondary Access) */}
                {isUploadModalOpen && (
                    <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-orange-900/20">
                            <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-white">Add Data Sources</h2>
                                <button onClick={() => setIsUploadModalOpen(false)} className="text-neutral-400 hover:text-white">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                            <div className="p-6 space-y-8">
                                <section>
                                    <h3 className="text-sm font-medium text-neutral-400 mb-3">Add from URL</h3>
                                    <LinkInput onSubmit={handleLinkSubmit} isLoading={isProcessing} />
                                </section>

                                <section>
                                    <h3 className="text-sm font-medium text-neutral-400 mb-3">Upload Files</h3>
                                    <FileUploadGrid
                                        onFileUpload={handleFileUpload}
                                        onTextUpload={handleTextUpload}
                                        isProcessing={isProcessing}
                                    />
                                </section>

                                {error && (
                                    <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg text-sm">
                                        {error}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <LibraryModal
                    isOpen={isLibraryOpen}
                    onClose={() => setIsLibraryOpen(false)}
                    sources={sources}
                />
            </SidebarProvider>
        </>
    );
};
