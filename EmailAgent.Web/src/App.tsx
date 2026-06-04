import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DailySummary } from './components/DailySummary';
import { PreferencesPage } from './components/PreferencesPage';
import { ChatBot } from './components/ChatBot';
import { CommandCenter } from './components/CommandCenter';
import { ChatView } from './components/ChatView';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import AgendaPage from './components/AgendaPage';
import omniImg from './components/omni-walk.png';

const CozyParticles: React.FC<{ mode: 'morning' | 'afternoon' | 'night' }> = ({ mode }) => {
  const particleCount = 20; // soft and cozy amount for the main dashboard!
  const particles = React.useMemo(() => {
    return Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      bottom: `${Math.random() * 10}%`,
      size: Math.random() * 5 + 3,
      delay: `${Math.random() * 8}s`,
      duration: `${Math.random() * 14 + 12}s`,
      color: mode === 'morning'
        ? '#fbbf24'
        : mode === 'afternoon'
          ? '#c084fc'
          : '#fb923c',
    }));
  }, [mode]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            bottom: p.bottom,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            filter: 'blur(1px) drop-shadow(0 0 3px currentColor)',
            animation: `cozyFloatMain ${p.duration} ease-in-out ${p.delay} infinite`,
            opacity: 0,
          }}
        />
      ))}
      <style>{`
        @keyframes cozyFloatMain {
          0% {
            transform: translateY(10%) translateX(0px);
            opacity: 0;
          }
          15% {
            opacity: 0.5;
          }
          85% {
            opacity: 0.5;
          }
          100% {
            transform: translateY(-800px) translateX(45px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export const AppLayout: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'chat' | 'plugins' | 'agenda' | 'preferences'>('dashboard');

  // ── Determine time of day ──
  const [timeMode] = useState<'morning' | 'afternoon' | 'night'>(() => {
    const hr = new Date().getHours();
    if (hr >= 6 && hr < 12) return 'morning';
    if (hr >= 12 && hr < 18) return 'afternoon';
    return 'night';
  });

  const bgGradient =
    timeMode === 'morning' ? 'from-[#0f172a] via-[#1e293b] to-[#0f172a]' :
      timeMode === 'afternoon' ? 'from-[#020617] via-[#0f172a] to-[#020617]' :
        'from-[#000000] via-[#09090b] to-[#000000]'; // Sleeker dark modes

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgGradient} text-slate-100 flex flex-col font-['Inter',sans-serif] relative overflow-x-hidden`}>

      {/* Modern Mesh Gradient Background Layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/10 blur-[150px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-indigo-500/10 blur-[150px]" />
      </div>

      <CozyParticles mode={timeMode} />

      {/* Glowing Glass Navbar */}
      <nav className="sticky top-0 z-40 px-4 pt-6 pb-2">
        <div className="max-w-6xl mx-auto bg-slate-900/60 border border-emerald-500/20 rounded-2xl py-3 px-6 shadow-[0_8px_30px_rgb(0,0,0,0.4)] backdrop-blur-2xl flex items-center justify-between hover:border-emerald-500/40 transition-colors duration-500">
          
          {/* Logo & Mascot */}
          <div 
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center gap-4 cursor-pointer group"
          >
            <div className="w-14 h-14 relative flex items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] group-hover:border-emerald-400/50 transition-all duration-300">
               <img src={omniImg} alt="Omni Mascot" className="w-[160%] max-w-none h-auto absolute top-[-10%] left-[-25%] object-cover object-top group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-2xl flex items-center gap-1.5 bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-teal-500 drop-shadow-sm">
                Omni <span className="text-emerald-500 font-black">Agent</span>
              </span>
              <span className="text-[10px] text-emerald-400/80 font-bold tracking-widest uppercase">AI Executive Assistant</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 p-1.5 bg-black/40 rounded-xl border border-white/5 shadow-inner">
            {[
              { id: 'dashboard', label: 'Overview' },
              { id: 'chat', label: 'Intelligence' },
              { id: 'agenda', label: 'Agenda' },
              { id: 'plugins', label: 'Analysis' },
              { id: 'preferences', label: 'Settings' }
            ].map(nav => (
              <button
                key={nav.id}
                onClick={() => setCurrentView(nav.id as any)}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-300 relative overflow-hidden ${
                  currentView === nav.id
                    ? 'text-white bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.3)] border border-emerald-500/30'
                    : 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                }`}
              >
                {nav.label}
              </button>
            ))}
            
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}
              className="px-5 py-2 rounded-lg text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300 ml-2"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area (Single Column, Centered) */}
      <div className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8 relative z-10 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 w-full"
          >
            {currentView === 'dashboard' && <CommandCenter onNavigate={(view) => setCurrentView(view as any)} />}
            {currentView === 'chat' && <ChatView />}
            {currentView === 'agenda' && <AgendaPage />}
            {currentView === 'plugins' && <DailySummary onGoToPreferences={() => setCurrentView('preferences')} />}
            {currentView === 'preferences' && <PreferencesPage onBackToDashboard={() => setCurrentView('dashboard')} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Assistant Chatbot Widget */}
      {currentView !== 'chat' && <ChatBot />}

      {/* Sleek Footer */}
      <footer className="py-8 border-t border-white/5 bg-transparent relative z-10 text-xs text-slate-500 text-center select-none">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <span>&copy; {new Date().getFullYear()} Aegis Core. Crafted for Executive Control.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-emerald-400 transition-colors">API References</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
};


export const App: React.FC = () => {
  const token = localStorage.getItem('jwt');
  const isAuthenticated = !!token;

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="*" element={isAuthenticated ? <AppLayout /> : <Navigate to="/login" />} />
    </Routes>
  );
};

export default App;
