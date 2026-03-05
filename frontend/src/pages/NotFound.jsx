import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

const NotFound = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
            <div className="relative">
                <AlertCircle className="w-24 h-24 text-slate-800" />
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl font-black text-indigo-500">404</span>
            </div>

            <div className="space-y-4">
                <h1 className="text-3xl font-bold text-white">Oops! Page not found.</h1>
                <p className="text-slate-400 max-w-sm mx-auto">
                    The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </p>
            </div>

            <Link
                to="/"
                className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
            >
                <Home className="w-5 h-5" />
                Back to Home
            </Link>
        </div>
    );
};

export default NotFound;
