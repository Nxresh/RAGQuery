import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Particles } from '../Particles';

export function LuxuryShowroom() {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start start', 'end start']
    });

    const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1, 1.1]);
    const y = useTransform(scrollYProgress, [0, 1], [0, -150]);
    const textY = useTransform(scrollYProgress, [0, 0.5], [0, -50]);

    return (
        <div ref={ref} className="relative h-[200vh] bg-black">
            <motion.div
                style={{ opacity, y }}
                className="sticky top-0 h-screen flex items-center justify-center overflow-hidden"
            >
                <Particles count={40} opacity={0.15} color="#d97706" />

                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 z-10" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_black_70%)] z-10" />

                <motion.div
                    style={{ scale }}
                    className="relative z-20 max-w-5xl mx-auto px-8 flex flex-col items-center"
                >
                    {/* Hero Text */}
                    <motion.div
                        style={{ y: textY }}
                        className="text-center mb-8"
                    >
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="text-7xl md:text-9xl font-extralight tracking-tight text-white mb-6"
                        >
                            Time
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            className="text-xl md:text-3xl text-gray-300 font-light tracking-wide"
                        >
                            is not measured. It is experienced.
                        </motion.p>
                    </motion.div>

                    {/* Watch Image */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 1.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="relative w-full max-w-2xl"
                    >
                        {/* Cinematic Glow Behind */}
                        <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 via-amber-900/20 to-transparent blur-[100px] scale-150" />

                        <div className="relative">
                            <img
                                src="/watch.png"
                                alt="Luxury Timepiece"
                                className="relative w-full h-auto object-contain z-10"
                                style={{
                                    maskImage: 'linear-gradient(to bottom, black 0%, black 60%, transparent 95%)',
                                    WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 60%, transparent 95%)'
                                }}
                            />

                            {/* Creative Blend Overlay - Bottom Fade */}
                            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/80 to-transparent z-20" />

                            {/* Reflection/Shine Effect */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 0.3, 0] }}
                                transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
                                className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent z-20 pointer-events-none"
                            />
                        </div>
                    </motion.div>
                </motion.div>

                {/* Scroll indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 2 }}
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30"
                >
                    <div className="flex flex-col items-center gap-3 text-white/50">
                        <span className="text-xs tracking-[0.3em] uppercase font-light">Scroll</span>
                        <motion.div
                            animate={{ y: [0, 12, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="w-px h-16 bg-gradient-to-b from-amber-400/60 to-transparent"
                        />
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
