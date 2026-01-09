import { useState } from 'react';
import { motion, PanInfo, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

interface IntroSwipeProps {
    onComplete: () => void;
}

export function IntroSwipe({ onComplete }: IntroSwipeProps) {
    const [swiped, setSwiped] = useState(false);

    const handleDragEnd = (_: any, info: PanInfo) => {
        if (info.offset.y < -100) {
            setSwiped(true);
            setTimeout(onComplete, 800); // Wait for exit animation
        }
    };

    return (
        <AnimatePresence>
            {!swiped && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, y: '-100%' }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black text-white p-8 cursor-grab active:cursor-grabbing"
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={0.2}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex-1 flex flex-col items-center justify-center pointer-events-none">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-4xl md:text-6xl font-bold tracking-[0.2em]"
                        >
                            RAGQUERY
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="mt-4 text-neutral-500 tracking-widest text-sm uppercase"
                        >
                            Experience Intelligence
                        </motion.p>
                    </div>

                    <div className="pointer-events-none flex flex-col items-center gap-4 mb-12">
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        >
                            <ChevronUp className="w-6 h-6 text-neutral-400" />
                        </motion.div>
                        <motion.p
                            className="text-neutral-500 text-xs tracking-[0.3em] uppercase"
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        >
                            Swipe Up to Enter
                        </motion.p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
