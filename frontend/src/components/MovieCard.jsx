import { Link } from 'react-router-dom';
import { Star, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { getImageUrl } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

const MovieCard = ({ movie }) => {
    const { isDarkMode, theme } = useTheme();

    return (
        <motion.div
            whileHover={{ y: -5 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`group relative flex flex-col ${isDarkMode ? 'bg-slate-900/50 glass' : 'bg-white/90 border border-slate-200'} rounded-xl overflow-hidden ${isDarkMode ? 'hover:border-indigo-500/50' : 'hover:border-slate-300/50'} transition-colors`}
        >
            <Link to={`/movie/${movie.tmdb_id}`} className="block relative aspect-[2/3] overflow-hidden">
                <img
                    src={getImageUrl(movie.poster_path)}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${isDarkMode ? 'from-slate-950 via-transparent' : 'from-slate-150 via-transparent'} to-transparent opacity-60 group-hover:opacity-40 transition-opacity`} />

                {/* Rating Badge */}
                {movie.rating > 0 && (
                    <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 ${isDarkMode ? 'bg-black/60' : 'bg-white/70'} backdrop-blur-md rounded-md border ${theme.border}`}>
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className={`text-xs font-bold ${theme.text}`}>{movie.rating.toFixed(1)}</span>
                    </div>
                )}
            </Link>

            <div className="p-4 flex flex-col flex-grow gap-2">
                <Link to={`/movie/${movie.tmdb_id}`}>
                    <h3 className={`text-sm md:text-base font-bold ${theme.text} line-clamp-1 group-hover:text-indigo-400 transition-colors`}>
                        {movie.title}
                    </h3>
                </Link>
                <div className={`flex items-center justify-between text-xs ${theme.textTertiary}`}>
                    <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{movie.release_year}</span>
                    </div>
                    {movie.genres && movie.genres[0] && (
                        <span className={`px-1.5 py-0.5 ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} rounded`}>
                            {movie.genres[0]}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default MovieCard;
