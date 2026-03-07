import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/movie/:id" element={<MovieDetail />} />
            <Route path="/person/:id" element={<PersonDetail />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/meme-editor" element={<MemeEditor />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        <DisclaimerPopup />
      </div>
    </Router>
  );
}

export default App;
