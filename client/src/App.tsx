import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import HostView   from './components/HostView';
import PlayerView from './components/PlayerView';
import GMView     from './components/GMView';

const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-8 p-4">
      <h1 className="text-6xl font-black text-cyan-400 tracking-widest drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">OVERDRIVE</h1>
      <p className="text-xl text-slate-300">Select your interface protocol:</p>
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl">
        <button onClick={() => navigate('/play')} className="flex-1 p-6 border-2 border-fuchsia-500 rounded-lg hover:bg-fuchsia-500/20 transition-all group">
          <h2 className="text-2xl font-bold text-fuchsia-400 group-hover:text-fuchsia-300">CYBER-DECK</h2>
          <p className="text-sm mt-2 opacity-80">Player Controller</p>
        </button>
        <button onClick={() => navigate('/host')} className="flex-1 p-6 border-2 border-cyan-500 rounded-lg hover:bg-cyan-500/20 transition-all group">
          <h2 className="text-2xl font-bold text-cyan-400 group-hover:text-cyan-300">MAIN SCREEN</h2>
          <p className="text-sm mt-2 opacity-80">Public Display Host</p>
        </button>
        <button onClick={() => navigate('/gm')} className="flex-1 p-6 border-2 border-amber-500 rounded-lg hover:bg-amber-500/20 transition-all group">
          <h2 className="text-2xl font-bold text-amber-400 group-hover:text-amber-300">MASTER DECK</h2>
          <p className="text-sm mt-2 opacity-80">GM Control</p>
        </button>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"     element={<Home />} />
        <Route path="/host" element={<HostView />} />
        <Route path="/play" element={<PlayerView />} />
        <Route path="/gm"   element={<GMView />} />
      </Routes>
    </Router>
  );
}
