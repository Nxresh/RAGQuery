
import { SidebarTrigger } from "./ui/sidebar"

export function SiteHeader() {
    return (
        <header className="flex h-[--header-height] w-full items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger className="text-neutral-500 hover:text-neutral-900" />
            <div className="w-px h-4 bg-neutral-200" />
            <div className="flex items-center gap-2 text-sm text-neutral-500">
                <span>Application</span>
                <span>/</span>
                <span className="font-medium text-neutral-900">Dashboard</span>
            </div>
        </header>
    )
}
