import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DisclaimerPopup from './components/DisclaimerPopup';
import HomePage from './pages/HomePage';
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
  const isEditor = location.pathname === '/meme-editor';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <Navbar />
      <Routes>
        <Route path="/" element={<StandardLayout><HomePage /></StandardLayout>} />
        <Route path="/movie/:id" element={<StandardLayout><MovieDetail /></StandardLayout>} />
        <Route path="/person/:id" element={<StandardLayout><PersonDetail /></StandardLayout>} />
        <Route path="/search" element={<StandardLayout><SearchPage /></StandardLayout>} />
        <Route path="/meme-editor" element={<MemeEditor />} />
        <Route path="*" element={<StandardLayout><NotFound /></StandardLayout>} />
      </Routes>
      {!isEditor && <Footer />}
      <DisclaimerPopup />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
