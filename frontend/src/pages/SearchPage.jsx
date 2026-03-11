import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { movieApi, personApi } from '../api';
import MovieCard from '../components/MovieCard';
import PersonCard from '../components/PersonCard';
import { Search, Loader2, Frown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SearchPage = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    const [movieResults, setMovieResults] = useState([]);
    const [personResults, setPersonResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('movies');

    useEffect(() => {
        const fetchResults = async () => {
            if (!query) return;
            setLoading(true);
            try {
                const [movieRes, personRes] = await Promise.all([
                    movieApi.search(query),
                    personApi.search(query)
                ]);

                if (movieRes.data.success) setMovieResults(movieRes.data.movies);
                if (personRes.data.success) setPersonResults(personRes.data.persons);

                // Auto-switch tab if one has results and the other doesn't
                if (movieRes.data.movies.length === 0 && personRes.data.persons.length > 0) {
                    setActiveTab('persons');
                } else {
                    setActiveTab('movies');
                }
            } catch (err) {
                console.error("Search failed:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [query]);

    const hasResults = movieResults.length > 0 || personResults.length > 0;

    return (
        <div className="space-y-12 pb-12">
            {/* Search Header */}
            <section className="text-center space-y-6 pt-8">
                <div className="inline-flex items-center justify-center p-4 bg-indigo-500/10 rounded-full border border-indigo-500/20 mb-4">
                    <Search className="w-8 h-8 text-indigo-400" />
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-white">
                    Search Results for <span className="text-indigo-400">"{query}"</span>
                </h1>
                <p className="text-slate-400">
                    Found {movieResults.length} movies and {personResults.length} people
                </p>
            </section>

            {/* Tabs */}
            <div className="flex justify-center border-b border-slate-900 sticky top-16 z-30 glass py-2 -mx-4 px-4">
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                        onClick={() => setActiveTab('movies')}
                        className={`px-8 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'movies'
                            ? 'bg-indigo-600 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Movies ({movieResults.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('persons')}
                        className={`px-8 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'persons'
                            ? 'bg-indigo-600 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        People ({personResults.length})
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                </div>
            ) : !hasResults ? (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                    <Frown className="w-16 h-16 text-slate-700" />
                    <h2 className="text-2xl font-bold text-slate-500">No results found</h2>
                    <p className="text-slate-600">Try searching for something else, like "Leo" or "Rajinikanth".</p>
                </div>
            ) : (
                <div className="min-h-[40vh]">
                    <AnimatePresence mode="wait">
                        {activeTab === 'movies' ? (
                            <motion.div
                                key="movies-grid"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
                            >
                                {movieResults.map((movie) => (
                                    <MovieCard key={movie.tmdb_id} movie={movie} />
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="persons-grid"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6"
                            >
                                {personResults.map((person) => (
                                    <PersonCard key={person.tmdb_id} person={person} />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default SearchPage;
