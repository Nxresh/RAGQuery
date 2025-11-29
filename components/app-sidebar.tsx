import React from "react"
import { User } from "firebase/auth"
import { useSidebar } from "./ui/sidebar"

interface Project {
    id: number;
    name: string;
    source_ids: number[];
    created_at?: string;
}

interface AppSidebarProps extends React.ComponentProps<"div"> {
    user?: User;
    onNewChat: () => void;
    children?: React.ReactNode;
    projects?: Project[];
    onSelectProject?: (project: Project) => void;
    onCreateProject?: () => void;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    onRenameProject?: (project: Project) => void;
    onDeleteProject?: (project: Project) => void;
    onOpenLibrary?: () => void;
}

export function AppSidebar({
    user,
    onNewChat,
    children,
    className,
    projects = [],
    onSelectProject,
    onCreateProject,
    searchQuery = '',
    onSearchChange,
    onRenameProject,
    onDeleteProject,
    onOpenLibrary,
    ...props
}: AppSidebarProps) {
    const { open } = useSidebar()

    return (
        <div
            className={`flex flex-col h-full bg-black text-neutral-200 border-r border-neutral-800 transition-[width] duration-200 ease-linear ${open ? "w-[260px]" : "w-0 overflow-hidden border-none"
                } ${className}`}
            {...props}
        >
            {/* Top Section */}
            <div className="p-3 space-y-4">
                {/* New Chat Button */}
                <button
                    onClick={onNewChat}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-900 rounded-md transition-colors border border-neutral-700/50 hover:border-neutral-700"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    <span>New chat</span>
                    <span className="ml-auto text-neutral-500">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="9" y1="3" x2="9" y2="21" />
                        </svg>
                    </span>
                </button>

                {/* Navigation Links */}
                <nav className="space-y-1">
                    {/* Search Input */}
                    <div className="px-3 py-2">
                        <div className="relative">
                            <svg className="absolute left-2 top-2.5 h-4 w-4 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search sources..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange?.(e.target.value)}
                                className="w-full bg-neutral-900 text-neutral-200 text-sm rounded-md pl-8 pr-3 py-2 border border-neutral-800 focus:border-neutral-700 focus:outline-none placeholder-neutral-600"
                            />
                        </div>
                    </div>

                    <button
                        onClick={onOpenLibrary}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-900 rounded-md transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M3 12h18M3 18h18" />
                        </svg>
                        <span>Library</span>
                    </button>

                    {/* Projects Section */}
                    <div className="pt-2">
                        <div className="flex items-center justify-between px-3 py-1 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            <span>Projects</span>
                            <button onClick={onCreateProject} className="hover:text-neutral-300" title="Create Project">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="mt-1 space-y-0.5">
                            {projects.map(project => (
                                <div key={project.id} className="group flex items-center w-full hover:bg-neutral-900 rounded-md transition-colors pr-2">
                                    <button
                                        onClick={() => onSelectProject?.(project)}
                                        className="flex-1 flex items-center gap-3 px-3 py-2 text-sm text-neutral-300 truncate text-left"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500 flex-shrink-0">
                                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                        </svg>
                                        <span className="truncate">{project.name}</span>
                                    </button>
                                    <div className="hidden group-hover:flex items-center gap-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onRenameProject?.(project); }}
                                            className="p-1 text-neutral-500 hover:text-white"
                                            title="Rename"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDeleteProject?.(project); }}
                                            className="p-1 text-neutral-500 hover:text-red-400"
                                            title="Delete"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {projects.length === 0 && (
                                <div className="px-3 py-2 text-xs text-neutral-600 italic">No projects yet</div>
                            )}
                        </div>
                    </div>
                </nav>
            </div>

            {/* Content Section (Sources) */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
                {children}
            </div>

            {/* User Profile Section */}
            <div className="p-3 border-t border-neutral-800">
                {user ? (
                    <div className="flex items-center gap-3 px-2 py-2 hover:bg-neutral-900 rounded-md cursor-pointer transition-colors group">
                        <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-medium text-xs">
                            {user.email ? user.email.substring(0, 2).toUpperCase() : 'NN'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-neutral-200 truncate">
                                {user.displayName || 'Naresh N'}
                            </div>
                            <div className="text-xs text-neutral-500 truncate">Free</div>
                        </div>
                        <button className="px-2 py-1 text-xs font-medium text-neutral-200 bg-neutral-800 rounded-md hover:bg-neutral-700 transition-colors">
                            Upgrade
                        </button>
                    </div>
                ) : (
                    <div className="px-2 py-2 text-sm text-neutral-400">
                        Not signed in
                    </div>
                )}
            </div>
        </div>
    )
}
