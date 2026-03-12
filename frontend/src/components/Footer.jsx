import { Heart } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Footer = () => {
    const { isDarkMode, theme } = useTheme();

    return (
        <footer className={`border-t ${theme.border} py-12 ${theme.bg}`}>
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <span className={`text-xl font-bold ${theme.text}`}>Open Memes</span>
                        <p className={`${theme.textTertiary} text-sm`}>The ultimate database for Tamil cinema.</p>
                    </div>


                    <div className={`flex gap-6 text-sm ${theme.textTertiary}`}>
                        <a href="#" className={`hover:${theme.text} transition-colors`}>Privacy</a>
                        <a href="#" className={`hover:${theme.text} transition-colors`}>Terms</a>
                        <a href="#" className={`hover:${theme.text} transition-colors`}>API docs</a>
                    </div>
                </div>

                <div className={`mt-8 pt-8 border-t ${theme.border} text-center ${theme.textTertiary} text-xs`}>
                    © {new Date().getFullYear()} Open Memes Collection. Powered by TMDB API.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
