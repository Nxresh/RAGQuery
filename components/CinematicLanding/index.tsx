import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IntroSwipe } from './IntroSwipe';
import { CinematicExperience } from './CinematicExperience';

interface CinematicLandingProps {
    onComplete: () => void;
}

export function CinematicLanding({ onComplete }: CinematicLandingProps) {
    const [introFinished, setIntroFinished] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    const handleExit = () => {
        setIsExiting(true);
        // Wait for fade out animation before unmounting
        setTimeout(() => {
            onComplete();
        }, 1000);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black text-white overflow-hidden">
            {/* Hand Swipe Intro */}
            <AnimatePresence>
                {!introFinished && (
                    <IntroSwipe onComplete={() => setIntroFinished(true)} />
                )}
            </AnimatePresence>

            {/* 3D Experience */}
            <div
                className={`absolute inset-0 transition-opacity duration-1000 ${introFinished ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            >
                <CinematicExperience onEnter={handleExit} />
            </div>

            {/* Exit Transition Overlay */}
            <AnimatePresence>
                {isExiting && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0 z-[200] bg-black pointer-events-none"
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
