import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Particles } from '../Particles';

export function MacroZoom() {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start start', 'end start']
    });

    const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 2.5, 3.5]);
    const opacity = useTransform(scrollYProgress, [0, 0.15, 0.7, 1], [0, 1, 1, 0]);
    const rotateZ = useTransform(scrollYProgress, [0, 1], [0, 180]);
    const textOpacity = useTransform(scrollYProgress, [0.25, 0.4, 0.6, 0.75], [0, 1, 1, 0]);
    const blurAmount = useTransform(scrollYProgress, [0.7, 1], [0, 10]);

    return (
        <div ref={ref} className="relative h-[300vh] bg-gradient-to-b from-black via-gray-950 to-black">
            <motion.div
                style={{ opacity }}
                className="sticky top-0 h-screen flex items-center justify-center overflow-hidden"
            >
                <Particles count={100} opacity={0.3} color="#d97706" />

                {/* Radial gradient background */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(217,119,6,0.08)_0%,_transparent_60%)]" />

                <motion.div className="relative z-10">
                    <motion.div
                        style={{ scale, rotateZ, filter: `blur(${blurAmount}px)` } as any}
                        className="relative"
                    >
                        {/* Intense glow at this scale */}
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-amber-900/20 blur-[100px] scale-150" />

                        <img
                            src="/watch.png"
                            alt="Watch Detail"
                            className="w-[90vw] max-w-4xl h-auto object-contain"
                            style={{
                                maskImage: 'radial-gradient(circle at center, black 30%, transparent 70%)',
                                WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 70%)'
                            }}
                        />
                    </motion.div>

                    {/* Precision text overlay */}
                    <motion.div
                        style={{ opacity: textOpacity }}
                        className="absolute inset-0 flex items-center justify-center z-20"
                    >
                        <div className="text-center text-white space-y-6 backdrop-blur-sm bg-black/20 px-16 py-12 rounded-3xl">
                            <motion.h2
                                initial={{ letterSpacing: '0.5em' }}
                                whileInView={{ letterSpacing: '0.2em' }}
                                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                                className="text-5xl md:text-8xl font-extralight tracking-tight"
                            >
                                PRECISION
                            </motion.h2>
                            <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: '100%' }}
                                transition={{ duration: 1, delay: 0.3 }}
                                className="h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto"
                            />
                            <p className="text-xl md:text-2xl text-amber-100/80 font-light tracking-wide">
                                Crafted to perfection
                            </p>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Vignette overlay */}
                <motion.div
                    style={{ opacity: useTransform(scrollYProgress, [0.8, 1], [0, 1]) }}
                    className="absolute inset-0 bg-black pointer-events-none"
                />
            </motion.div>
        </div>
    );
}
