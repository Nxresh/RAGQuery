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
import { AgentsLayout } from './Agents/AgentsLayout';
import { LayoutDashboard, MessageSquare, Home, Archive, Settings, User as UserIcon, Bot } from 'lucide-react';
import { QueryBar } from './QueryInput/QueryBar';
import AnimatedNavBar from './Dock/AnimatedNavBar';
import { Button } from './ui/button';
import { CollapsedSidebarTrigger } from './CollapsedSidebarTrigger';
import { addToHistory, HistoryItem } from './HistoryPanel';
import { AntigravityParticles } from './CursorParticles';

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
    const abortControllerRef = useRef<AbortController | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [isStopped, setIsStopped] = useState(false);

    // View State
    const [activeView, setActiveView] = useState<'chat' | 'studio' | 'agents'>('chat');

    // Projects & Search State
    const [projects, setProjects] = useState<Project[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);

    // AI-powered smart suggestions
    const [smartSuggestions, setSmartSuggestions] = useState<string[]>([
        "What are the key points?",
        "Summarize the main topics",
        "Explain the core concepts",
        "List important details"
    ]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

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

    // Fetch AI-powered smart suggestions when sources are selected
    useEffect(() => {
        const fetchSmartSuggestions = async () => {
            if (selectedSources.length === 0) {
                setSmartSuggestions([
                    "What are the key points?",
                    "Summarize the main topics",
                    "Explain the core concepts",
                    "List important details"
                ]);
                return;
            }

            setIsLoadingSuggestions(true);
            try {
                const response = await fetch('/api/suggestions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-Id': user?.uid || ''
                    },
                    body: JSON.stringify({
                        sourceIds: selectedSources,
                        userId: user?.uid || 'anonymous'
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.suggestions && data.suggestions.length > 0) {
                        setSmartSuggestions(data.suggestions);
                        console.log('[Suggestions] AI suggestions loaded:', data.suggestions);
                    }
                }
            } catch (err) {
                console.error('[Suggestions] Failed to fetch:', err);
            } finally {
                setIsLoadingSuggestions(false);
            }
        };

        fetchSmartSuggestions();
    }, [selectedSources, user]);

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

    const saveSource = async (title: string, content: string, type: string, isStarred: boolean = false, thumbnail?: string): Promise<number> => {
        const response = await fetch('/api/documents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': user?.uid || ''
            },
            body: JSON.stringify({ title, content, type, isStarred, thumbnail })
        });

        if (!response.ok) throw new Error('Failed to save source');
        const data = await response.json();
        return data.id; // Return the new document ID
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

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to process YouTube video');
                }

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

                // Convert image to base64 for thumbnail storage
                const reader = new FileReader();
                const thumbnailPromise = new Promise<string>((resolve) => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                });
                const thumbnail = await thumbnailPromise;

                const data = await response.json();
                const newDocId = await saveSource(file.name, data.text, 'image', false, thumbnail);
                // Auto-select the newly uploaded source
                setSelectedSources(prev => [...prev, newDocId]);

            } else if (type === 'audio') {
                const formData = new FormData();
                formData.append('audio', file);

                const response = await fetch('/api/process/audio', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error('Failed to transcribe audio');

                const data = await response.json();
                const newDocId = await saveSource(file.name, data.transcript, 'audio');
                // Auto-select the newly uploaded source
                setSelectedSources(prev => [...prev, newDocId]);
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

    const handleRenameSource = async (id: number, newTitle: string) => {
        try {
            await fetch(`/api/documents/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': user?.uid || ''
                },
                body: JSON.stringify({ title: newTitle })
            });
            await fetchSources();
        } catch (err) {
            setError('Failed to rename source');
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

        // Save query to history for Netflix-style suggestions
        const storedHistory = localStorage.getItem('ragQueryHistory');
        const queryHistory: string[] = storedHistory ? JSON.parse(storedHistory) : [];
        const newHistory = [currentQuery, ...queryHistory.filter(q => q !== currentQuery)].slice(0, 10);
        localStorage.setItem('ragQueryHistory', JSON.stringify(newHistory));

        setIsQuerying(true);
        setError(null);
        setIsStopped(false); // Reset stop state for new query

        // Add user message immediately (Optimistic UI)
        const tempId = Date.now();
        const query = currentQuery;
        setCurrentQuery('');

        setConversations(prev => [...prev, {
            id: tempId,
            query,
            timestamp: new Date()
        }]);

        // Save to history and get the history item ID for conversation storage
        const historyItems = addToHistory('ares_chat_history', query);
        const historyId = historyItems[0]?.id; // Most recent item is first

        try {
            const selectedSourcesData = sources.filter(s => selectedSources.includes(s.id));
            const combinedContent = selectedSourcesData.map(s => s.content).join('\n\n');

            // Create AbortController for this request
            abortControllerRef.current = new AbortController();

            const response = await fetch('/api/proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'rag',
                    payload: {
                        documentContent: combinedContent,
                        query,
                        sourceDetails: selectedSourcesData.map(s => ({ id: s.id, title: s.title })),
                        hybridSearch: true,
                        sophisticatedProcessing: true
                    }
                }),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error('Query failed');
            }

            const data = await response.json();

            // Start typing animation
            setIsTyping(true);

            // Update the placeholder message with the actual result
            setConversations(prev => {
                const updated = prev.map(msg =>
                    msg.id === tempId ? { ...msg, result: data } : msg
                );

                // Store conversation with history ID for later restore
                if (historyId) {
                    localStorage.setItem(`ares_convo_${historyId}`, JSON.stringify(updated));
                    console.log('[History] Stored conversation for:', historyId);
                }

                return updated;
            });
        } catch (err) {
            // Don't show error if request was aborted by user
            if (err instanceof Error && err.name === 'AbortError') {
                console.log('[Query] Request cancelled by user');
                // Keep the user's message but mark it as cancelled
                setConversations(prev => prev.map(msg =>
                    msg.id === tempId ? { ...msg, result: { synthesizedAnswer: '⚠️ Generation stopped by user', rankedChunks: [] } } : msg
                ));
            } else {
                console.error('Query error:', err);
                setError(err instanceof Error ? err.message : 'Query failed');
                // Remove the optimistic message on failure
                setConversations(prev => prev.filter(msg => msg.id !== tempId));
                setCurrentQuery(query);
            }
        } finally {
            setIsQuerying(false);
            abortControllerRef.current = null;
        }
    };

    const handleStopQuery = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            console.log('[Query] Abort signal sent');
        }
        // Stop typing animation immediately
        setIsStopped(true);
        setIsTyping(false);
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

    // Netflix-style: Mix exploitation (history) + exploration (source keywords)
    const getSuggestions = (): string[] => {
        // Get query history from localStorage
        const storedHistory = localStorage.getItem('ragQueryHistory');
        const queryHistory: string[] = storedHistory ? JSON.parse(storedHistory) : [];

        // Extract keywords from source titles
        const sourceKeywords: string[] = [];
        sources.forEach(src => {
            const words = src.title
                .replace(/\.[^/.]+$/, '') // Remove extension
                .replace(/[_-]/g, ' ')
                .split(/\s+/)
                .filter(w => w.length > 3)
                .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
            sourceKeywords.push(...words);
        });
        const uniqueKeywords = [...new Set(sourceKeywords)];

        // Default suggestions if no history/sources
        if (queryHistory.length === 0 && sources.length === 0) {
            return [
                "Summarize the key points",
                "What are the main topics?",
                "Explain the main concept",
                "List all important details"
            ];
        }

        const suggestions: string[] = [];

        // 80% Exploitation: From query history (max 2)
        suggestions.push(...queryHistory.slice(0, 2));

        // 20% Exploration: From source keywords
        if (uniqueKeywords.length > 0) {
            const randomKeyword = uniqueKeywords[Math.floor(Math.random() * uniqueKeywords.length)];
            suggestions.push(`Tell me about ${randomKeyword}`);
        }

        // Fill remaining with source-based
        if (suggestions.length < 4 && sources.length > 0) {
            suggestions.push(`Summarize "${sources[0].title}"`);
        }

        // Fallback defaults
        const defaults = ["Summarize the key points", "What are the main topics?", "List all important details"];
        while (suggestions.length < 4) {
            const next = defaults[suggestions.length % defaults.length];
            if (!suggestions.includes(next)) suggestions.push(next);
            else break;
        }

        return suggestions.slice(0, 4);
    };

    return (
        <>
            {/* Dark background layer */}
            <div className="fixed inset-0 bg-black z-0" />

            {/* Antigravity-style particle effect - blue shards with magnetic cursor attraction */}
            <AntigravityParticles />

            <SidebarProvider>
                <div className="flex h-screen bg-transparent overflow-hidden w-full relative z-10">
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
                        onHistorySelect={(item: HistoryItem) => {
                            // Try to restore conversation from localStorage
                            const storedConvo = localStorage.getItem(`ares_convo_${item.id}`);
                            if (storedConvo) {
                                try {
                                    const restoredConvo = JSON.parse(storedConvo);
                                    setConversations(restoredConvo);
                                    console.log('[History] Restored conversation:', item.query);
                                } catch (e) {
                                    console.error('[History] Failed to restore:', e);
                                    // Fallback: just set the query
                                    setCurrentQuery(item.query);
                                }
                            } else {
                                // No stored conversation, just put query in input
                                setCurrentQuery(item.query);
                            }
                        }}
                    >
                        <div className="mb-4">
                            <h2 className="text-xs font-medium text-neutral-500 mb-2 px-2 uppercase tracking-wider">Sources</h2>
                            <SourceManager
                                sources={filteredSources}
                                onDelete={handleDeleteSource}
                                onRename={handleRenameSource}
                                selectedSources={selectedSources}
                                onToggleSource={handleToggleSource}
                                onToggleAll={handleToggleAll}
                            />
                        </div>
                    </AppSidebar>

                    <SidebarInset className="bg-black/40 backdrop-blur-md flex-1 flex flex-col min-w-0">
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
                                            },
                                            {
                                                id: 'agents',
                                                label: 'Agents',
                                                icon: <Bot size={16} />,
                                                onClick: () => setActiveView('agents'),
                                                isActive: activeView === 'agents'
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
                                {/* New Chat Button - only show when there are conversations */}
                                {conversations.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleNewChat}
                                        title="New Chat"
                                        className="rounded-full text-neutral-400 hover:text-orange-500 hover:bg-orange-500/10"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"></path>
                                        </svg>
                                    </Button>
                                )}
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
                                    userId={user?.uid}
                                />
                            </div>
                        ) : activeView === 'agents' ? (
                            <div className="flex-1 overflow-hidden">
                                <AgentsLayout
                                    sources={sources}
                                    selectedSources={selectedSources}
                                    userId={user?.uid}
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
                                                                        <TypewriterText
                                                                            text={item.result.synthesizedAnswer || ''}
                                                                            speed={10}
                                                                            onComplete={() => setIsTyping(false)}
                                                                            stopped={isStopped}
                                                                        />
                                                                    </div>

                                                                    {/* Sources with enhanced metadata */}
                                                                    {item.result.rankedChunks && item.result.rankedChunks.length > 0 && (
                                                                        <div className="mt-4 pt-4 border-t border-neutral-800">
                                                                            <p className="text-xs font-semibold text-neutral-400 mb-3 flex items-center gap-2">
                                                                                <svg className="w-3.5 h-3.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                                </svg>
                                                                                Sources Referenced
                                                                            </p>
                                                                            <div className="space-y-2">
                                                                                {item.result.rankedChunks.slice(0, 3).map((chunk, idx) => (
                                                                                    <details key={idx} className="group rounded-lg border border-neutral-800 bg-neutral-900/50 hover:border-orange-500/30 transition-all duration-200">
                                                                                        <summary className="px-4 py-3 cursor-pointer list-none select-none">
                                                                                            <div className="flex items-center justify-between">
                                                                                                <div className="flex items-center gap-3">
                                                                                                    <div className="flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20">
                                                                                                        <span className="text-[10px] font-bold text-orange-400">{chunk.sourceIndex || idx + 1}</span>
                                                                                                    </div>
                                                                                                    <div className="flex flex-col">
                                                                                                        <span className="text-xs font-medium text-neutral-200">
                                                                                                            {chunk.documentTitle || `Source ${chunk.sourceIndex || idx + 1}`}
                                                                                                        </span>
                                                                                                        <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                                                                                                            {chunk.pageNumber && <span>Page {chunk.pageNumber}</span>}
                                                                                                            {chunk.sectionId && <span>§{chunk.sectionId}</span>}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className="flex items-center gap-3">
                                                                                                    <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                                                                                        {chunk.relevanceScore}% match
                                                                                                    </span>
                                                                                                    <svg className="w-4 h-4 text-neutral-500 transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                                                    </svg>
                                                                                                </div>
                                                                                            </div>
                                                                                            <p className="mt-2 text-xs text-neutral-400 leading-relaxed line-clamp-2 group-open:hidden">{chunk.chunkText}</p>
                                                                                        </summary>
                                                                                        <div className="px-4 pb-4 pt-2 border-t border-neutral-800/50">
                                                                                            <div className="p-3 rounded-md bg-neutral-950/80 border border-neutral-800/50 max-h-64 overflow-y-auto">
                                                                                                <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap font-mono">
                                                                                                    {chunk.chunkText}
                                                                                                </p>
                                                                                            </div>
                                                                                        </div>
                                                                                    </details>
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

                                    {/* Quick Suggestions - AI-powered smart suggestions */}
                                    {selectedSources.length > 0 && conversations.length === 0 && (
                                        <div className="mb-3 flex flex-wrap gap-2 justify-center">
                                            {isLoadingSuggestions ? (
                                                <div className="flex items-center gap-2 text-neutral-500 text-sm">
                                                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                                                    <span>Analyzing sources...</span>
                                                </div>
                                            ) : (
                                                smartSuggestions.map((suggestion, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setCurrentQuery(suggestion)}
                                                        className="px-4 py-2 text-sm bg-white/5 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/30 rounded-full text-neutral-300 hover:text-orange-400 transition-all duration-200"
                                                    >
                                                        {suggestion}
                                                    </button>
                                                ))
                                            )}
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
                                        onNewChat={handleNewChat}
                                        onStop={handleStopQuery}
                                        hasMessages={conversations.length > 0}
                                        isLoading={isQuerying || isProcessing || isTyping}
                                        disabled={isQuerying || isProcessing || selectedSources.length === 0}
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
