import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Film, Sparkles, Layout, Image as ImageIcon, Search } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const LandingPage = () => {
    const navigate = useNavigate();
    const { isDarkMode, theme } = useTheme();

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
                duration: 0.8,
                ease: "easeOut"
            }
        }
    };

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center relative overflow-hidden ${isDarkMode ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
            {/* Ambient Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />
            </div>

            <motion.div 
                className="container mx-auto px-6 relative z-10 flex flex-col items-center text-center"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Hero Section */}
                <motion.h1 
                    variants={itemVariants}
                    className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-[1.1]"
                >
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                        Open Memes
                    </span>
                </motion.h1>

                <motion.p 
                    variants={itemVariants}
                    className={`max-w-2xl text-lg md:text-xl ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} mb-10 leading-relaxed`}
                >
                    The Ultimate Tamil Movie Database & Creative Meme Studio. Explore the magic of Tamil cinema and create iconic memes all in one place.
                </motion.p>

                {/* Main Action Call */}
                <motion.div 
                    variants={itemVariants}
                    className="flex flex-col items-center gap-4 mb-20"
                >
                    <button
                        onClick={() => navigate('/home')}
                        className="group relative px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <span className="relative">
                            Get Started
                        </span>
                    </button>
                </motion.div>

                {/* Features Grid */}
                <motion.div 
                    variants={itemVariants}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl"
                >
                    {[
                        { icon: Film, title: "Curated Library", desc: "Handpicked selection of the best Tamil cinema across all genres." },
                        { icon: Search, title: "Smart Search", desc: "Find your favorite movies and actors with our advanced search engine." },
                        { icon: ImageIcon, title: "Meme Studio", desc: "Create and share hilarious memes using our built-in editor." }
                    ].map((feature, idx) => (
                        <div 
                            key={idx}
                            className={`p-6 rounded-3xl border transition-all duration-300 ${isDarkMode ? 'bg-slate-900/40 border-slate-800 hover:bg-slate-900/60' : 'bg-white/60 border-slate-200 hover:bg-white'} hover:shadow-2xl hover:-translate-y-1`}
                        >
                            <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                <feature.icon className="w-6 h-6 text-indigo-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                            <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600 text-sm'}>{feature.desc}</p>
                        </div>
                    ))}
                </motion.div>
            </motion.div>

            {/* Footer decoration */}
            <div className="mt-20 opacity-50 flex items-center gap-2 text-sm font-medium">
                <Film className="w-4 h-4" />
                <span>Tamil Movies Collection © 2026</span>
            </div>
        </div>
    );
};

export default LandingPage;
