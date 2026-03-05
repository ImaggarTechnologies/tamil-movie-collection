import { useState, useEffect } from 'react';
import { movieApi } from '../api';
import MovieCard from '../components/MovieCard';
import { ChevronLeft, ChevronRight, Loader2, Film } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const HomePage = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMovies = async () => {
            setLoading(true);
            try {
                const response = await movieApi.getAll(page);
                if (response.data.success) {
                    setMovies(response.data.movies);
                    setTotalPages(response.data.totalPages);
                }
            } catch (err) {
                setError("Failed to fetch movies. Please try again later.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchMovies();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="text-red-400 font-medium">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-indigo-600 rounded-full hover:bg-indigo-500 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {/* Movie Grid Section */}
            <section className="space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold border-l-4 border-indigo-500 pl-4">Latest Movies</h2>
                    <div className="text-slate-500 text-sm">
                        Page {page} of {totalPages}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                            {movies.map((movie) => (
                                <MovieCard key={movie.tmdb_id} movie={movie} />
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="flex justify-center items-center gap-4 mt-12 pb-8">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="p-2 bg-slate-900 border border-slate-700 rounded-full disabled:opacity-30 hover:bg-slate-800 transition-colors"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>

                            <div className="flex gap-2">
                                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) pageNum = i + 1;
                                    else if (page <= 3) pageNum = i + 1;
                                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                                    else pageNum = page - 2 + i;

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setPage(pageNum)}
                                            className={cn(
                                                "w-10 h-10 rounded-full text-sm font-bold transition-all",
                                                page === pageNum
                                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                                    : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
                                            )}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="p-2 bg-slate-900 border border-slate-700 rounded-full disabled:opacity-30 hover:bg-slate-800 transition-colors"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
};

export default HomePage;
