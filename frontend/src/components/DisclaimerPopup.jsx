import { useState, useEffect } from 'react';
import { Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DisclaimerPopup = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Show after a short delay
        setIsVisible(true);
        /*
        const timer = setTimeout(() => {
            const hasSeen = localStorage.getItem('hasSeenDisclaimer');
            if (!hasSeen) {
                setIsVisible(true);
            }
        }, 1500);

        return () => clearTimeout(timer);
        */
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem('hasSeenDisclaimer', 'true');
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, x: -50, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -20, scale: 0.9 }}
                    className="fixed bottom-6 left-6 z-[100] max-w-[340px] bg-slate-900/90 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl movie-card-shadow text-left"
                >
                    <button
                        onClick={handleClose}
                        className="absolute top-3 right-3 p-1 text-slate-500 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-start gap-4">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center mt-0.5">
                            <Info className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-[13px] text-slate-200 leading-relaxed font-medium">
                                All movie titles, posters, and media belong to their respective production and distribution companies.
                            </p>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                                This site is for informational purposes only. All rights reserved to the original copyright owners.
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default DisclaimerPopup;
