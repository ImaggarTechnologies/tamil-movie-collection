import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Film, Menu, X, Sun, Moon } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const { isDarkMode, toggleTheme, theme } = useTheme();
    const location = useLocation();
    const isEditorPage = location.pathname === '/meme-editor';

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setIsMenuOpen(false);
        }
    };

    return (
        <nav className="sticky top-4 z-50 px-4">
            <div className={`container mx-auto h-16 ${theme.card} rounded-2xl border ${theme.border} shadow-2xl flex items-center justify-between px-6`}>
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-indigo-600 group-hover:bg-indigo-500' : 'bg-slate-100 group-hover:bg-slate-200 border border-slate-300'}`}>
                        <Film className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-slate-700'}`} />
                    </div>
                    <span className={`text-xl font-bold ${isDarkMode ? 'bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400' : 'text-slate-900'}`}>
                        Open Memes
                    </span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex flex-grow max-w-2xl mx-8 items-center gap-6 justify-end">
                    {!isEditorPage && (
                        <>
                            {/* Search */}
                            <form onSubmit={handleSearch} className="flex-grow relative">
                                <input
                                    type="text"
                                    placeholder="Search movies or actors..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`w-full ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-white/80 border-slate-200'} border rounded-full py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all ${theme.text}`}
                                />
                                <button
                                    type="submit"
                                    className={cn(
                                        "absolute right-3 top-1/2 -translate-y-1/2 transition-colors",
                                        isDarkMode
                                            ? "text-slate-400 hover:text-white"
                                            : "text-slate-700 hover:text-slate-900"
                                    )}
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                            </form>
                        </>
                    )}

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    {/* Meme Editor Link */}
                    <Link
                        to="/meme-editor"
                        className="shrink-0 text-sm font-medium transition-colors hover:opacity-80"
                    >
                        <span className={isDarkMode ? "px-3 py-1.5 bg-indigo-600 text-white rounded-lg shadow-lg shadow-indigo-600/20" : "px-3 py-1.5 bg-white text-slate-900 rounded-lg border border-slate-300 shadow-sm shadow-slate-300/30"}>
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
                `md:hidden absolute top-16 left-0 w-full ${theme.card} border-b ${theme.border} transition-all duration-300 overflow-hidden`,
                isMenuOpen ? "max-h-64" : "max-h-0"
            )}>
                <div className="p-4 space-y-4">
                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white/90 border-slate-200'} border rounded-lg py-2 pl-4 pr-10 focus:outline-none focus:border-indigo-500 ${theme.text}`}
                        />
                        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Search className={`w-4 h-4 ${theme.textTertiary}`} />
                        </button>
                    </form>
                    <div className="flex flex-col gap-2">
                        <Link
                            to="/"
                            className={cn(
                                "p-2 rounded-lg transition-colors",
                                isDarkMode ? "hover:bg-slate-800 text-slate-100" : "hover:bg-slate-100 text-slate-800"
                            )}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Home
                        </Link>
                        <Link
                            to="/meme-editor"
                            className={cn(
                                "p-2 rounded-lg transition-colors font-medium",
                                isDarkMode ? "hover:bg-slate-800 text-indigo-200" : "hover:bg-slate-100 text-indigo-700"
                            )}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Meme Editor
                        </Link>
                        <button
                            onClick={toggleTheme}
                            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} transition-colors flex items-center gap-2`}
                        >
                            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
