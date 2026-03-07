import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Film, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setIsMenuOpen(false);
        }
    };

    return (
        <nav className="sticky top-0 z-50 glass border-b border-slate-800">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="p-2 bg-indigo-600 rounded-lg group-hover:bg-indigo-500 transition-colors">
                        <Film className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Open Memes
                    </span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex flex-grow max-w-2xl mx-8 items-center gap-6">
                    {/* Search */}
                    <form onSubmit={handleSearch} className="flex-grow relative">
                        <input
                            type="text"
                            placeholder="Search movies or actors..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-full py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                        />
                        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                            <Search className="w-4 h-4" />
                        </button>
                    </form>

                    {/* Meme Editor Link */}
                    <Link
                        to="/meme-editor"
                        className="shrink-0 text-sm font-medium transition-colors hover:opacity-80"
                    >
                        <span className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg shadow-lg shadow-indigo-600/20">
                            Meme Editor
                        </span>
                    </Link>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Drawer */}
            <div className={cn(
                "md:hidden absolute top-16 left-0 w-full glass border-b border-slate-800 transition-all duration-300 overflow-hidden",
                isMenuOpen ? "max-h-64" : "max-h-0"
            )}>
                <div className="p-4 space-y-4">
                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-4 pr-10 focus:outline-none focus:border-indigo-500"
                        />
                        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Search className="w-4 h-4 text-slate-400" />
                        </button>
                    </form>
                    <div className="flex flex-col gap-2">
                        <Link to="/" className="p-2 hover:bg-slate-800 rounded-lg transition-colors" onClick={() => setIsMenuOpen(false)}>Home</Link>
                        <Link to="/meme-editor" className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-indigo-400 font-medium" onClick={() => setIsMenuOpen(false)}>Meme Editor</Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
