import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Sparkles, Zap, Shield } from 'lucide-react';

export function BrandReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start start', 'end start']
    });

    const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.3], [0.8, 1]);
    const logoScale = useTransform(scrollYProgress, [0.1, 0.3], [0.5, 1]);
    const logoOpacity = useTransform(scrollYProgress, [0.1, 0.25], [0, 1]);

    const features = [
        { icon: Sparkles, title: 'Intelligent', desc: 'AI-powered insights' },
        { icon: Zap, title: 'Lightning Fast', desc: 'Real-time processing' },
        { icon: Shield, title: 'Secure', desc: 'Enterprise-grade protection' }
    ];

    return (
        <div ref={ref} className="relative h-[200vh] bg-black">
            <motion.div
                style={{ opacity }}
                className="sticky top-0 h-screen flex items-center justify-center overflow-hidden"
            >
                {/* Animated background gradients */}
                <div className="absolute inset-0">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vh] h-[150vh] bg-[conic-gradient(from_0deg,transparent,rgba(217,119,6,0.1),transparent)] opacity-50"
                    />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(217,119,6,0.08)_0%,_transparent_50%)]" />
                </div>

                <motion.div
                    style={{ scale }}
                    className="relative z-10 text-center max-w-5xl mx-auto px-8"
                >
                    {/* Logo Section */}
                    <motion.div
                        style={{ scale: logoScale, opacity: logoOpacity }}
                        className="mb-16"
                    >
                        <div className="relative inline-block">
                            {/* Rotating glow ring */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                                className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-300 blur-3xl opacity-40 scale-150"
                            />

                            {/* Logo container */}
                            <div className="relative w-28 h-28 md:w-40 md:h-40 mx-auto flex items-center justify-center">
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                    className="absolute inset-0 border-2 border-amber-400/50 rounded-full"
                                />
                                <div className="absolute inset-3 border border-amber-300/30 rounded-full" />
                                <Sparkles className="w-12 h-12 md:w-16 md:h-16 text-amber-400" />
                            </div>
                        </div>
                    </motion.div>

                    {/* Brand Name */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-6xl md:text-9xl font-extralight tracking-tight text-white mb-8">
                            RAG<span className="text-amber-400">QUERY</span>
                        </h2>
                        <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: '8rem' }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            viewport={{ once: true }}
                            className="h-px mx-auto bg-gradient-to-r from-transparent via-amber-400 to-transparent mb-8"
                        />
                        <p className="text-2xl md:text-4xl text-gray-300 font-light tracking-wide mb-20">
                            Intelligence. Redefined.
                        </p>
                    </motion.div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 + index * 0.15, ease: [0.22, 1, 0.36, 1] }}
                                viewport={{ once: true }}
                                whileHover={{ scale: 1.03, y: -5 }}
                                className="group p-8 border border-gray-800/50 rounded-2xl bg-gradient-to-b from-gray-900/50 to-gray-950/50 backdrop-blur-sm hover:border-amber-500/30 transition-all duration-500"
                            >
                                <feature.icon className="w-10 h-10 text-amber-400 mb-4 mx-auto group-hover:scale-110 transition-transform duration-300" />
                                <h3 className="text-2xl text-white font-light mb-2">{feature.title}</h3>
                                <p className="text-gray-400 font-light">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
