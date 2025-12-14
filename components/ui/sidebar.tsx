import React, { createContext, useContext, useState } from "react"

const SidebarContext = createContext<{
    open: boolean
    setOpen: (open: boolean) => void
    toggleSidebar: () => void
} | null>(null)

export function useSidebar() {
    const context = useContext(SidebarContext)
    if (!context) {
        throw new Error("useSidebar must be used within a SidebarProvider")
    }
    return context
}

export function SidebarProvider({
    children,
    style,
}: {
    children: React.ReactNode
    style?: React.CSSProperties
}) {
    const [open, setOpen] = useState(false) // Start collapsed by default

    return (
        <SidebarContext.Provider
            value={{
                open,
                setOpen,
                toggleSidebar: () => setOpen((prev) => !prev),
            }}
        >
            <div
                style={style}
                className="group/sidebar-wrapper flex min-h-screen w-full has-[[data-variant=inset]]:bg-sidebar"
            >
                {children}
            </div>
        </SidebarContext.Provider>
    )
}

export function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
    return (
        <main
            className={`relative flex min-h-screen flex-1 flex-col bg-background peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow ${className}`}
            {...props}
        />
    )
}

import { Button } from "./button"

export function SidebarTrigger({ className, ...props }: React.ComponentProps<"button">) {
    const { toggleSidebar } = useSidebar()
    return (
        <Button
            onClick={toggleSidebar}
            variant="premium-subtle"
            size="icon"
            className={className}
            {...props}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M9 3v18" /></svg>
            <span className="sr-only">Toggle Sidebar</span>
        </Button>
    )
}
