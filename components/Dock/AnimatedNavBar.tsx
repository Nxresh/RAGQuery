'use client';

import { motion, useMotionValue, useSpring, useTransform, MotionValue } from 'framer-motion';
import { useRef, ReactNode } from 'react';

interface AnimatedNavItemProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    mouseX: MotionValue<number>;
    spring: any;
    distance: number;
    magnification: number;
    baseScale: number;
    isActive?: boolean;
}

function AnimatedNavItem({ children, className = '', onClick, mouseX, spring, distance, magnification, baseScale, isActive }: AnimatedNavItemProps) {
    const ref = useRef<HTMLDivElement>(null);

    const mouseDistance = useTransform(mouseX, (val: number) => {
        if (val === Infinity || typeof val !== 'number') return distance + 1;

        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return distance + 1;

        return val - rect.x - rect.width / 2;
    });

    const targetScale = useTransform(mouseDistance, [-distance, 0, distance], [baseScale, magnification, baseScale]);
    const scale = useSpring(targetScale, spring);

    return (
        <motion.div
            ref={ref}
            initial={{ scale: baseScale }}
            style={{ scale, zIndex: isActive ? 10 : 1 }}
            whileHover={{ zIndex: 20 }}
            onClick={onClick}
            className={`relative flex items-center justify-center cursor-pointer transition-colors duration-200 ${className}`}
            tabIndex={0}
            role="button"
        >
            {children}
        </motion.div>
    );
}

interface AnimatedNavProps {
    items: {
        id: string;
        icon: ReactNode;
        label: string;
        onClick: () => void;
        isActive?: boolean;
        className?: string
    }[];
    className?: string;
    itemClassName?: string;
    spring?: { mass: number; stiffness: number; damping: number };
    magnification?: number; // Target scale (e.g., 1.2)
    distance?: number;
    baseScale?: number;
}

export default function AnimatedNavBar({
    items,
    className = '',
    itemClassName = '',
    spring = { mass: 0.1, stiffness: 150, damping: 12 },
    magnification = 1.15, // Reduced magnification to minimize "shaking" feel
    distance = 100,
    baseScale = 1
}: AnimatedNavProps) {
    const mouseX = useMotionValue(Infinity);

    return (
        <motion.div
            onMouseMove={({ pageX }) => mouseX.set(pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
            className={`flex items-center gap-2 px-2 py-1 ${className}`}
        >
            {items.map((item) => (
                <AnimatedNavItem
                    key={item.id}
                    onClick={item.onClick}
                    className={`${itemClassName} ${item.className || ''}`}
                    mouseX={mouseX}
                    spring={spring}
                    distance={distance}
                    magnification={magnification}
                    baseScale={baseScale}
                    isActive={item.isActive}
                >
                    <div className={`
                        flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 border
                        ${item.isActive
                            ? 'bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/50 text-orange-100 shadow-[0_0_20px_-5px_rgba(249,115,22,0.3)]'
                            : 'bg-white/5 border-white/5 text-neutral-400 hover:bg-white/10 hover:border-white/10 hover:text-neutral-200'
                        }
                    `}>
                        <div className={`transition-transform duration-300 ${item.isActive ? 'text-orange-400' : ''}`}>
                            {item.icon}
                        </div>
                        <span className="font-medium text-sm tracking-wide whitespace-nowrap">{item.label}</span>

                        {item.isActive && (
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/10 to-transparent opacity-50 blur-sm pointer-events-none" />
                        )}
                    </div>
                </AnimatedNavItem>
            ))}
        </motion.div>
    );
}
