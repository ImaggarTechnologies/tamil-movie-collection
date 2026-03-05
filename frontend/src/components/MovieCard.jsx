import { Link } from 'react-router-dom';
import { Star, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { getImageUrl } from '../lib/utils';

const MovieCard = ({ movie }) => {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="group relative flex flex-col bg-slate-900/50 rounded-xl overflow-hidden glass hover:border-indigo-500/50 transition-colors"
        >
            <Link to={`/movie/${movie.tmdb_id}`} className="block relative aspect-[2/3] overflow-hidden">
                <img
                    src={getImageUrl(movie.poster_path)}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                {/* Rating Badge */}
                {movie.rating > 0 && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md border border-white/10">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-bold text-white">{movie.rating.toFixed(1)}</span>
                    </div>
                )}
            </Link>

            <div className="p-4 flex flex-col flex-grow gap-2">
                <Link to={`/movie/${movie.tmdb_id}`}>
                    <h3 className="text-sm md:text-base font-bold text-slate-50 line-clamp-1 group-hover:text-indigo-400 transition-colors">
                        {movie.title}
                    </h3>
                </Link>
                <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{movie.release_year}</span>
                    </div>
                    {movie.genres && movie.genres[0] && (
                        <span className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">
                            {movie.genres[0]}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default MovieCard;
