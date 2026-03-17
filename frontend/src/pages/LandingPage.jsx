import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Film, Sparkles, Layout, Image as ImageIcon, Search, ChevronDown, Rocket, PlayCircle, Star, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import cinematicBg from '../assets/cinematic_bg.png';

const CinematicBackground = ({ isTransitioning, opacity }) => {
    return (
        <motion.div
            style={{ opacity }}
            className="absolute inset-0 z-0 overflow-hidden"
        >
            <motion.img
                src={cinematicBg}
                alt="Cinematic Background"
                className="w-full h-full object-cover object-top"
                animate={{
                    scale: [1, 1.05],
                    transition: { duration: 25, repeat: Infinity, repeatType: "reverse", ease: "linear" }
                }}
            />
            {/* Very light overlays to ensure text is readable while keeping the image visible */}
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/20" />
        </motion.div>
    );
};

const LandingPage = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [isTransitioning, setIsTransitioning] = useState(false);
    const containerRef = useRef(null);

    const { scrollYProgress } = useScroll({
        container: containerRef
    });

    // Figma-style background color transition (Fixed layer behind everything)
    const backgroundColor = useTransform(
        scrollYProgress,
        [0, 0.5, 1],
        ["#020617", "#0f172a", "#1e1b4b"] // Deep Black -> Slate -> Indigo
    );

    // Fade the cinematic image as we move to section 2
    const bgOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

    const handleGetStarted = () => {
        setIsTransitioning(true);
        setTimeout(() => {
            navigate('/home');
        }, 1200);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1]
            }
        }
    };

    return (
        <div className="relative h-screen bg-slate-950 overflow-hidden">
            {/* FIXED BACKGROUND COLOR LAYER */}
            <motion.div
                style={{ backgroundColor }}
                className="absolute inset-0 z-[-10]"
            />

            {/* SCROLLABLE CONTENT */}
            <motion.div
                ref={containerRef}
                className="h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth hide-scrollbar text-slate-50"
            >
                <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

                {/* Section 1: Cinematic Entrance */}
                <section className="h-screen w-full snap-start relative flex flex-col items-center justify-center overflow-hidden">
                    <AnimatePresence>
                        {!isTransitioning && (
                            <CinematicBackground opacity={bgOpacity} />
                        )}
                    </AnimatePresence>

                    {/* Netflix Iris Wipe */}
                    {isTransitioning && (
                        <motion.div
                            className="fixed inset-0 z-[100] bg-slate-950"
                            initial={{ clipPath: 'circle(0% at 50% 50%)' }}
                            animate={{ clipPath: 'circle(150% at 50% 50%)' }}
                            transition={{ duration: 1, ease: "easeInOut" }}
                        />
                    )}

                    <motion.div
                        className="relative z-10 container mx-auto px-6 text-center"
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        animate={isTransitioning ? { scale: 0.9, opacity: 0, filter: 'blur(10px)' } : {}}
                    >
                        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm font-medium tracking-wide uppercase">Experience Cinema Like Never Before</span>
                        </motion.div>

                        <motion.h1
                            variants={itemVariants}
                            className="text-7xl md:text-9xl font-extrabold mb-6 tracking-tighter leading-none"
                        >
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                                Open Memes
                            </span>
                        </motion.h1>

                        <motion.p
                            variants={itemVariants}
                            className="max-w-2xl mx-auto text-xl md:text-2xl text-slate-300 mb-12 font-light"
                        >
                            The Ultimate Tamil Movie Database meets a Creative Meme Studio. A new concept in digital entertainment.
                        </motion.p>

                        <motion.div variants={itemVariants}>
                            <button
                                onClick={handleGetStarted}
                                disabled={isTransitioning}
                                className="group relative px-12 py-6 bg-white text-black rounded-full font-black text-xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl hover:shadow-indigo-500/40"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="relative flex items-center gap-3 group-hover:text-white transition-colors">
                                    {isTransitioning ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Get Started <Rocket className="w-6 h-6" /></>}
                                </span>
                            </button>
                        </motion.div>
                    </motion.div>

                    {/* Scroll Indicator */}
                    <motion.div
                        style={{ opacity: bgOpacity }}
                        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer opacity-50"
                        onClick={() => containerRef.current?.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                    >
                        <span className="text-xs uppercase tracking-widest font-bold">Discovery</span>
                        <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                            <ChevronDown className="w-6 h-6" />
                        </motion.div>
                    </motion.div>
                </section>

                {/* Section 2: Features */}
                <section className="min-h-screen w-full snap-start relative flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,#4f46e5_0%,transparent_70%)]" />

                    <motion.div
                        className="container mx-auto max-w-7xl z-10"
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        <motion.div variants={itemVariants} className="text-center mb-16">
                            <h2 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight">A Universe of Creativity</h2>
                            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">One platform, endless possibilities. Discover, search, and create with state-of-the-art tools.</p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { icon: Film, title: "Curated Library", color: "indigo", desc: "Handpicked selection of the best Tamil cinema across all genres." },
                                { icon: Search, title: "Smart Search", color: "purple", desc: "Find any movie, actor, or dialogue in seconds with neural search." },
                                { icon: Sparkles, title: "Meme Studio", color: "pink", desc: "Turn iconic scenes into viral legends with professional tools." }
                            ].map((feature, idx) => (
                                <motion.div
                                    key={idx}
                                    variants={itemVariants}
                                    whileHover={{ y: -10, scale: 1.02 }}
                                    className="group relative p-10 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-2xl transition-all hover:border-indigo-500/50"
                                >
                                    <div className={`absolute -right-10 -top-10 w-40 h-40 bg-${feature.color}-500 blur-[100px] opacity-0 group-hover:opacity-20 transition-opacity`} />
                                    <div className="w-16 h-16 rounded-2xl mb-8 flex items-center justify-center bg-white/5 border border-white/10 group-hover:border-indigo-400/50">
                                        <feature.icon className={`w-8 h-8 text-${feature.color}-400`} />
                                    </div>
                                    <h3 className="text-3xl font-bold mb-4">{feature.title}</h3>
                                    <p className="text-slate-400 text-lg leading-relaxed">{feature.desc}</p>
                                </motion.div>
                            ))}
                        </div>

                        <motion.div variants={itemVariants} className="mt-24 pt-10 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-8 text-slate-500 font-medium">
                            <div className="flex items-center gap-8">
                                <span>© 2026 Tamil Movies Collection</span>
                                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                            </div>
                            <div className="flex items-center gap-4 px-6 py-2 rounded-full bg-white/5 border border-white/10">
                                <Star className="w-5 h-5 fill-indigo-500 text-indigo-500" />
                                <span className="text-slate-300">Crafted for Movie Lovers</span>
                            </div>
                        </motion.div>
                    </motion.div>
                </section>
            </motion.div>
        </div>
    );
};

export default LandingPage;
