import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved ? saved === 'dark' : true;
    });

    useEffect(() => {
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        const root = document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.add('light');
            root.classList.remove('dark');
        }
    }, [isDarkMode]);

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    const theme = isDarkMode ? {
        bg: 'bg-slate-950',
        bgSecondary: 'bg-slate-900',
        bgTertiary: 'bg-slate-800',
        text: 'text-slate-50',
        textSecondary: 'text-slate-300',
        textTertiary: 'text-slate-400',
        border: 'border-white/10',
        input: 'bg-slate-900/50 border-slate-700',
        card: 'glass',
        gradient: 'bg-slate-950',
    } : {
        bg: 'bg-gradient-to-tr from-white via-slate-100 to-slate-200',
        bgSecondary: 'bg-slate-100',
        bgTertiary: 'bg-slate-200',
        text: 'text-slate-900',
        textSecondary: 'text-slate-700',
        textTertiary: 'text-slate-500',
        border: 'border-slate-300',
        input: 'bg-slate-100 border-slate-300',
        card: 'bg-white/80 border border-slate-300',
        gradient: 'bg-gradient-to-tr from-white via-slate-100 to-slate-200',
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};
