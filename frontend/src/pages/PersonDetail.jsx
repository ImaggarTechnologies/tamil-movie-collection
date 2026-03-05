import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { personApi } from '../api';
import MovieCard from '../components/MovieCard';
import { getImageUrl, formatDate } from '../lib/utils';
import { Loader2, ArrowLeft, MapPin, Calendar, Star, Film } from 'lucide-react';
import { motion } from 'framer-motion';

const PersonDetail = () => {
    const { id } = useParams();
    const [person, setPerson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
            <p className="text-xl text-slate-400">{error || "Person not found"}</p>
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
                        <h3 className="font-bold text-slate-100 uppercase tracking-widest text-sm border-b border-slate-800 pb-2">Personal Info</h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-indigo-400" />
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Birthday</p>
                                    <p className="text-slate-300">{formatDate(person.birthday)}</p>
                                </div>
                            </div>
                            {person.birthplace && (
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-4 h-4 text-indigo-400" />
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Place of Birth</p>
                                        <p className="text-slate-300">{person.birthplace}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <Star className="w-4 h-4 text-indigo-400" />
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Popularity</p>
                                    <p className="text-slate-300">{person.popularity?.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Film className="w-4 h-4 text-indigo-400" />
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Known For</p>
                                    <p className="text-slate-300">{person.known_for_department}</p>
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
                        <h1 className="text-5xl md:text-7xl font-black text-white">{person.name}</h1>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold border-l-4 border-indigo-500 pl-4 uppercase tracking-wider">Biography</h2>
                        <p className="text-lg text-slate-300 leading-relaxed max-w-4xl">
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
                    <div className="glass rounded-3xl overflow-hidden border-slate-800">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900/50 border-b border-slate-800">
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Year</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Title</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Character</th>
                                </tr>
                            </thead>
                            <tbody>
                                {person.all_movie_credits
                                    .sort((a, b) => new Date(b.release_date) - new Date(a.release_date))
                                    .map((credit, idx) => (
                                        <tr key={idx} className="border-b border-slate-900 hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 text-slate-400 font-medium">
                                                {credit.release_date ? new Date(credit.release_date).getFullYear() : '—'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-slate-100 font-bold">{credit.title}</span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 italic">
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
