import React from 'react';
import { useSidebar, SidebarTrigger } from './ui/sidebar';

export const CollapsedSidebarTrigger = () => {
    const { open } = useSidebar();

    if (open) return null;

    return (
        <div className="mr-2">
            <SidebarTrigger className="text-neutral-400 hover:text-white" />
        </div>
    );
};
