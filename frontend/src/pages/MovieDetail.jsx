import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { movieApi } from '../api';
import PersonCard from '../components/PersonCard';
import { getImageUrl, formatDate } from '../lib/utils';
import { Star, Clock, Calendar, Globe, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const MovieDetail = () => {
    const { id } = useParams();
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
            <p className="text-xl text-slate-400">{error || "Movie not found"}</p>
            <Link to="/" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
        </div>
    );

    return (
        <div className="space-y-12 pb-12">
            {/* Backdrop & Hero */}
            <section className="relative -mt-8 -mx-4 h-[400px] md:h-[600px] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent z-10" />
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
                        className="hidden md:block w-72 aspect-[2/3] rounded-2xl overflow-hidden glass border-2 border-white/10 movie-card-shadow"
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
                                <span key={genre} className="px-3 py-1 bg-indigo-600/30 backdrop-blur-md rounded-full text-indigo-300 text-xs font-bold border border-indigo-500/20">
                                    {genre}
                                </span>
                            ))}
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">
                            {movie.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-6 text-slate-300 text-sm md:text-base font-medium">
                            <div className="flex items-center gap-2">
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                <span className="text-white font-bold">{movie.rating?.toFixed(1)}</span>
                                <span className="text-slate-500">({movie.vote_count})</span>
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
                            <h2 className="text-2xl font-bold border-l-4 border-indigo-500 pl-4 uppercase tracking-wider">Synopsis</h2>
                            {movie.tagline && (
                                <span className="text-slate-500 text-sm font-medium italic">— "{movie.tagline}"</span>
                            )}
                        </div>
                        <p className="text-lg text-slate-300 leading-relaxed max-w-none">
                            {movie.overview}
                        </p>
                    </div>

                    {/* Cast */}
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold border-l-4 border-indigo-500 pl-4 uppercase tracking-wider">Top Cast</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {movie.cast?.map((person) => (
                                <PersonCard key={person.tmdb_id} person={person} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* Sidebar */}
                <aside className="space-y-10">
                    <div className="p-8 glass bg-slate-900/40 rounded-3xl space-y-8 border-slate-800">
                        <h3 className="text-xl font-bold text-white mb-6">Movie Info</h3>
                        <div className="space-y-6">
                            <div>
                                <p className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-1">Status</p>
                                <p className="text-white font-medium">{movie.status}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-1">Release Date</p>
                                <p className="text-white font-medium">{formatDate(movie.release_date)}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-1">Budget</p>
                                <p className="text-white font-medium">
                                    {movie.budget > 0 ? `$${movie.budget.toLocaleString()}` : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-1">Revenue</p>
                                <p className="text-white font-medium">
                                    {movie.revenue > 0 ? `$${movie.revenue.toLocaleString()}` : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-1">Production Companies</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {movie.production_companies?.map(company => (
                                        <span key={company} className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">{company}</span>
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
