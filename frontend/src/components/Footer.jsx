import { Heart } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="border-t border-slate-900 py-12 bg-slate-950">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <span className="text-xl font-bold text-white">Open Memes</span>
                        <p className="text-slate-500 text-sm">The ultimate database for Tamil cinema.</p>
                    </div>


                    <div className="flex gap-6 text-sm text-slate-400">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">API docs</a>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-900 text-center text-slate-600 text-xs">
                    © {new Date().getFullYear()} Open Memes Collection. Powered by TMDB API.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
