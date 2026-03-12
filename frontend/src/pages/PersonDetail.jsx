import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { personApi } from '../api';
import MovieCard from '../components/MovieCard';
import { getImageUrl, formatDate, cn } from '../lib/utils';
import { Loader2, ArrowLeft, MapPin, Calendar, Star, Film } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const PersonDetail = () => {
    const { id } = useParams();
    const [person, setPerson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isDarkMode, theme } = useTheme();

    useEffect(() => {
        const fetchPerson = async () => {
            setLoading(true);
            try {
                const response = await personApi.getById(id);
                if (response.data.success) {
                    setPerson(response.data.person);
                }
            } catch (err) {
                setError("Person not found.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchPerson();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [id]);

    if (loading) return (
        <div className="flex justify-center items-center h-[60vh]">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        </div>
    );

    if (error || !person) return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <p className={`text-xl ${theme.textTertiary}`}>{error || "Person not found"}</p>
            <Link to="/" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
        </div>
    );

    return (
        <div className="space-y-16 pb-12">
            {/* Header Info */}
            <section className="flex flex-col md:flex-row gap-12 items-start">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full md:w-80 flex-shrink-0"
                >
                    <div className="aspect-[2/3] rounded-3xl overflow-hidden glass border-2 border-white/10 movie-card-shadow">
                        <img
                            src={getImageUrl(person.profile_path, "h632")}
                            alt={person.name}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="mt-8 space-y-6 px-4">
                        <h3 className={`font-bold uppercase tracking-widest text-sm border-b pb-2 ${isDarkMode ? 'text-slate-100 border-slate-800' : 'text-slate-700 border-slate-200'}`}>Personal Info</h3>
                        <div className={`space-y-4 text-sm ${theme.text}`}>
                            <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-indigo-400" />
                                <div>
                                    <p className={`text-xs uppercase tracking-widest font-bold ${theme.textTertiary}`}>Birthday</p>
                                    <p className={theme.textSecondary}>{formatDate(person.birthday)}</p>
                                </div>
                            </div>
                            {person.birthplace && (
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-4 h-4 text-indigo-400" />
                                    <div>
                                        <p className={`text-xs uppercase tracking-widest font-bold ${theme.textTertiary}`}>Place of Birth</p>
                                        <p className={theme.textSecondary}>{person.birthplace}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <Star className="w-4 h-4 text-indigo-400" />
                                <div>
                                    <p className={`text-xs uppercase tracking-widest font-bold ${theme.textTertiary}`}>Popularity</p>
                                    <p className={theme.textSecondary}>{person.popularity?.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Film className="w-4 h-4 text-indigo-400" />
                                <div>
                                    <p className={`text-xs uppercase tracking-widest font-bold ${theme.textTertiary}`}>Known For</p>
                                    <p className={theme.textSecondary}>{person.known_for_department}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-grow space-y-10"
                >
                    <div className="space-y-4">
                        <h1 className={`text-5xl md:text-7xl font-black ${theme.text}`}>{person.name}</h1>
                    </div>

                    <div className="space-y-6">
                        <h2 className={`text-2xl font-bold border-l-4 border-indigo-500 pl-4 uppercase tracking-wider ${theme.text}`}>Biography</h2>
                        <p className={`text-lg leading-relaxed max-w-4xl ${theme.textSecondary}`}>
                            {person.biography || `We don't have a biography for ${person.name} yet.`}
                        </p>
                    </div>

                    {/* Featured Movies in DB */}
                    {person.tamil_movies?.length > 0 && (
                        <div className="space-y-8">
                            <h2 className="text-2xl font-bold border-l-4 border-indigo-500 pl-4 uppercase tracking-wider">Tamil Filmography</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {person.tamil_movies.map((movie) => (
                                    <MovieCard key={movie.tmdb_id} movie={movie} />
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </section>

            {/* Full Filmography Table */}
            {person.all_movie_credits?.length > 0 && (
                <section className="space-y-8">
                    <h2 className="text-2xl font-bold border-l-4 border-indigo-500 pl-4 uppercase tracking-wider">Full Credits</h2>
                    <div className={cn(
                        "rounded-3xl overflow-hidden border transition-all",
                        isDarkMode ? "glass border-white/10" : "bg-white border-slate-200 shadow-sm"
                    )}>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className={cn(
                                    "border-b transition-colors",
                                    isDarkMode ? "bg-slate-900/50 border-white/5 whitespace-nowrap" : "bg-slate-50 border-slate-200"
                                )}>
                                    <th className={cn("px-6 py-4 text-xs font-bold uppercase tracking-widest", isDarkMode ? "text-slate-500" : "text-slate-400")}>Year</th>
                                    <th className={cn("px-6 py-4 text-xs font-bold uppercase tracking-widest", isDarkMode ? "text-slate-500" : "text-slate-400")}>Title</th>
                                    <th className={cn("px-6 py-4 text-xs font-bold uppercase tracking-widest", isDarkMode ? "text-slate-500" : "text-slate-400")}>Character</th>
                                </tr>
                            </thead>
                            <tbody>
                                {person.all_movie_credits
                                    .sort((a, b) => new Date(b.release_date) - new Date(a.release_date))
                                    .map((credit, idx) => (
                                        <tr key={idx} className={cn(
                                            "border-b last:border-0 transition-colors",
                                            isDarkMode ? "border-white/5 hover:bg-white/5" : "border-slate-100 hover:bg-slate-50 shadow-sm"
                                        )}>
                                            <td className={cn("px-6 py-4 font-medium", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                                                {credit.release_date ? new Date(credit.release_date).getFullYear() : '—'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn("font-bold", isDarkMode ? "text-slate-100" : "text-slate-900")}>{credit.title}</span>
                                            </td>
                                            <td className={cn("px-6 py-4 italic", isDarkMode ? "text-slate-500" : "text-slate-400")}>
                                                {credit.character || '—'}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    );
};

export default PersonDetail;
