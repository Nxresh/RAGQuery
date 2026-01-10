import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SmoothScroll } from './SmoothScroll';
import { ScrollProgress } from './ScrollProgress';
import { LuxuryShowroom } from './scenes/LuxuryShowroom';
import { MacroZoom } from './scenes/MacroZoom';
import { BrandReveal } from './scenes/BrandReveal';
import { FinalCTA } from './scenes/FinalCTA';

interface CinematicLandingProps {
    onComplete: () => void;
}

export function CinematicLanding({ onComplete }: CinematicLandingProps) {
    const [isExiting, setIsExiting] = useState(false);

    const handleGetStarted = () => {
        setIsExiting(true);
        // Smooth fade out before transition
        setTimeout(() => {
            onComplete();
        }, 800);
    };

    return (
        <div className="relative z-[100] bg-black">
            <SmoothScroll>
                <div className="relative bg-black min-h-screen">
                    <ScrollProgress />

                    <main className="relative">
                        <LuxuryShowroom />
                        <MacroZoom />
                        <BrandReveal />
                        <FinalCTA onGetStarted={handleGetStarted} />
                    </main>

                    {/* Skip button for accessibility */}
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 3 }}
                        onClick={handleGetStarted}
                        className="fixed bottom-8 right-8 z-50 px-6 py-3 bg-gray-900/80 backdrop-blur-sm text-white/70 text-sm border border-gray-700/50 rounded-full hover:bg-gray-800 hover:text-white hover:border-gray-600 transition-all duration-300"
                        aria-label="Skip animation"
                    >
                        Skip Experience
                    </motion.button>
                </div>
            </SmoothScroll>

            {/* Exit transition overlay */}
            <AnimatePresence>
                {isExiting && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed inset-0 z-[200] bg-black pointer-events-none"
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
