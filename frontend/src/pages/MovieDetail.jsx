import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { movieApi } from '../api';
import PersonCard from '../components/PersonCard';
import { getImageUrl, formatDate } from '../lib/utils';
import { Star, Clock, Calendar, Globe, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const MovieDetail = () => {
    const { id } = useParams();
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isDarkMode, theme } = useTheme();

    useEffect(() => {
        const fetchMovie = async () => {
            setLoading(true);
            try {
                const response = await movieApi.getById(id);
                if (response.data.success) {
                    setMovie(response.data.movie);
                }
            } catch (err) {
                setError("Movie not found.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchMovie();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [id]);

    if (loading) return (
        <div className="flex justify-center items-center h-[60vh]">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        </div>
    );

    if (error || !movie) return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <p className={`text-xl ${theme.textTertiary}`}>{error || "Movie not found"}</p>
            <Link to="/" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
        </div>
    );

    return (
        <div className="space-y-12 pb-12">
            {/* Backdrop & Hero */}
            <section className="relative -mx-4 h-[400px] md:h-[600px] overflow-hidden">
                <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent' : 'bg-gradient-to-t from-white via-slate-100/60 to-transparent'} z-10`} />
                <img
                    src={getImageUrl(movie.backdrop_path, "original")}
                    alt={movie.title}
                    className="w-full h-full object-cover scale-105"
                />

                <div className="absolute inset-0 z-20 container mx-auto px-4 flex flex-col md:flex-row items-end gap-8 pb-12">
                    {/* Poster */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`hidden md:block w-72 aspect-[2/3] rounded-2xl overflow-hidden ${isDarkMode ? 'glass border-2 border-white/10' : 'border-2 border-slate-200'} movie-card-shadow`}
                    >
                        <img src={getImageUrl(movie.poster_path)} alt={movie.title} className="w-full h-full object-cover" />
                    </motion.div>

                    {/* Info */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex-grow space-y-4"
                    >
                        <div className="flex flex-wrap items-center gap-3">
                            {movie.genres?.map(genre => (
                                <span key={genre} className={`px-3 py-1 ${isDarkMode ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/20' : 'bg-indigo-400/20 text-indigo-700 border border-indigo-300/50'} backdrop-blur-md rounded-full text-xs font-bold`}>
                                    {genre}
                                </span>
                            ))}
                        </div>
                        <h1 className={`text-4xl md:text-6xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} leading-tight`}>
                            {movie.title}
                        </h1>
                        <div className={`flex flex-wrap items-center gap-6 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'} text-sm md:text-base font-medium`}>
                            <div className="flex items-center gap-2">
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{movie.rating?.toFixed(1)}</span>
                                <span className={isDarkMode ? 'text-slate-500' : 'text-slate-500'}>({movie.vote_count})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-indigo-400" />
                                <span>{movie.runtime} min</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-indigo-400" />
                                <span>{movie.release_year}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Globe className="w-5 h-5 text-indigo-400" />
                                <span className="uppercase">{movie.language}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <section className="lg:col-span-2 space-y-12">
                    {/* Overview */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <h2 className={`text-2xl font-bold border-l-4 border-indigo-500 pl-4 uppercase tracking-wider ${theme.text}`}>Synopsis</h2>
                            {movie.tagline && (
                                <span className={`${theme.textTertiary} text-sm font-medium italic`}>— "{movie.tagline}"</span>
                            )}
                        </div>
                        <p className={`text-lg ${theme.textSecondary} leading-relaxed max-w-none`}>
                            {movie.overview}
                        </p>
                    </div>

                    {/* Cast */}
                    <div className="space-y-8">
                        <h2 className={`text-2xl font-bold border-l-4 border-indigo-500 pl-4 uppercase tracking-wider ${theme.text}`}>Top Cast</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {movie.cast?.map((person) => (
                                <PersonCard key={person.tmdb_id} person={person} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* Sidebar */}
                <aside className="space-y-10">
                    <div className={`p-8 ${isDarkMode ? 'glass bg-slate-900/40 border-slate-800' : 'bg-white/80 border border-slate-200'} rounded-3xl space-y-8`}>
                        <h3 className={`text-xl font-bold ${theme.text} mb-6`}>Movie Info</h3>
                        <div className="space-y-6">
                            <div>
                                <p className={`${theme.textTertiary} text-xs uppercase font-bold tracking-widest mb-1`}>Status</p>
                                <p className={`${theme.text} font-medium`}>{movie.status}</p>
                            </div>
                            <div>
                                <p className={`${theme.textTertiary} text-xs uppercase font-bold tracking-widest mb-1`}>Release Date</p>
                                <p className={`${theme.text} font-medium`}>{formatDate(movie.release_date)}</p>
                            </div>
                            <div>
                                <p className={`${theme.textTertiary} text-xs uppercase font-bold tracking-widest mb-1`}>Budget</p>
                                <p className={`${theme.text} font-medium`}>
                                    {movie.budget > 0 ? `$${movie.budget.toLocaleString()}` : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className={`${theme.textTertiary} text-xs uppercase font-bold tracking-widest mb-1`}>Revenue</p>
                                <p className={`${theme.text} font-medium`}>
                                    {movie.revenue > 0 ? `$${movie.revenue.toLocaleString()}` : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className={`${theme.textTertiary} text-xs uppercase font-bold tracking-widest mb-1`}>Production Companies</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {movie.production_companies?.map(company => (
                                        <span key={company} className={`px-2 py-1 ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} rounded text-xs`}>{company}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default MovieDetail;
