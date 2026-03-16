import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DisclaimerPopup from './components/DisclaimerPopup';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import MovieDetail from './pages/MovieDetail';
import PersonDetail from './pages/PersonDetail';
import SearchPage from './pages/SearchPage';
import MemeEditor from './pages/MemeEditor';
import NotFound from './pages/NotFound';
import './App.css';

const StandardLayout = ({ children }) => (
  <main className="flex-grow max-w-[1440px] w-[calc(100%-32px)] mx-auto py-8">
    {children}
  </main>
);

const AppContent = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const isEditor = location.pathname === '/meme-editor';
  const { theme, isDarkMode } = useTheme();

  return (
    <div className={`min-h-screen ${isDarkMode ? theme.bg : 'bg-gradient-to-tr from-white via-slate-50 to-slate-100'} ${theme.text} flex flex-col`}>
      {!isLandingPage && <Navbar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<StandardLayout><HomePage /></StandardLayout>} />
        <Route path="/movie/:id" element={<StandardLayout><MovieDetail /></StandardLayout>} />
        <Route path="/person/:id" element={<StandardLayout><PersonDetail /></StandardLayout>} />
        <Route path="/search" element={<StandardLayout><SearchPage /></StandardLayout>} />
        <Route path="/meme-editor" element={<MemeEditor />} />
        <Route path="*" element={<StandardLayout><NotFound /></StandardLayout>} />
      </Routes>
      {!isEditor && !isLandingPage && <Footer />}
      {!isEditor && !isLandingPage && <DisclaimerPopup />}
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
