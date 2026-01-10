import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';

interface FinalCTAProps {
    onGetStarted: () => void;
}

export function FinalCTA({ onGetStarted }: FinalCTAProps) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start start', 'end end']
    });

    const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

    return (
        <div ref={ref} className="relative h-screen bg-gradient-to-b from-black via-gray-950 to-black">
            <motion.div
                style={{ opacity }}
                className="h-screen flex items-center justify-center"
            >
                {/* Background effects */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(217,119,6,0.15)_0%,_transparent_60%)]" />

                <div className="text-center max-w-4xl mx-auto px-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                        viewport={{ once: true }}
                        className="mb-16"
                    >
                        <h2 className="text-5xl md:text-8xl font-extralight tracking-tight text-white mb-8">
                            Ready to Begin?
                        </h2>
                        <p className="text-xl md:text-2xl text-gray-400 font-light max-w-2xl mx-auto">
                            Experience the future of intelligent document processing
                        </p>
                    </motion.div>

                    {/* CTA Button */}
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        viewport={{ once: true }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onGetStarted}
                        className="group relative inline-flex items-center gap-4 px-14 py-6 bg-gradient-to-r from-amber-500 to-amber-400 text-black text-xl font-medium rounded-full overflow-hidden transition-all duration-300 shadow-[0_0_40px_rgba(217,119,6,0.3)] hover:shadow-[0_0_60px_rgba(217,119,6,0.5)]"
                    >
                        <span className="relative z-10">Get Started</span>
                        <ArrowRight className="relative z-10 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />

                        {/* Shine effect */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 0.6 }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        />
                    </motion.button>

                    {/* Trust indicators */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.6 }}
                        viewport={{ once: true }}
                        className="mt-20 flex flex-wrap items-center justify-center gap-6 md:gap-10 text-gray-500 text-sm"
                    >
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            Enterprise Ready
                        </span>
                        <span className="hidden md:block w-1 h-1 bg-gray-600 rounded-full" />
                        <span>Secure & Private</span>
                        <span className="hidden md:block w-1 h-1 bg-gray-600 rounded-full" />
                        <span>24/7 Support</span>
                    </motion.div>
                </div>

                {/* Animated scroll indicator (to show there's more) */}
                <motion.div
                    animate={{ y: [0, 8, 0], opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2"
                >
                    <div className="w-6 h-10 border-2 border-gray-600 rounded-full flex items-start justify-center p-1.5">
                        <motion.div
                            animate={{ y: [0, 14, 0] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-1.5 h-3 bg-amber-400 rounded-full"
                        />
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
