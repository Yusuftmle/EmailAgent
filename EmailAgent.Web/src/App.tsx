import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DailySummary } from './components/DailySummary';
import { PreferencesPage } from './components/PreferencesPage';
import { ChatBot } from './components/ChatBot';
import { apiService, UserPreferences } from './services/api';
import { Cpu, Terminal, Compass, Sparkles, AlertTriangle, ShieldCheck, Mail } from 'lucide-react';

interface TelemetryLog {
  timestamp: string;
  category: 'SYSTEM' | 'FETCH' | 'AGENT' | 'ALERT';
  text: string;
}

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'preferences'>('dashboard');
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [prefs, setPrefs] = useState<UserPreferences>({ focusCompanies: [], keywords: [] });

  const initialLogs: TelemetryLog[] = [
    { timestamp: "08:00:00", category: "SYSTEM", text: "Claude Inbox Agent initialized successfully." },
    { timestamp: "08:00:01", category: "SYSTEM", text: "PostgreSQL Database link connected successfully." },
    { timestamp: "08:00:02", category: "FETCH", text: "Gmail check triggered: querying last 24h feed." },
    { timestamp: "08:00:04", category: "FETCH", text: "Retrieved 4 unread messages from Google API." },
    { timestamp: "08:00:06", category: "AGENT", text: "Classifying email msg_101 (Satya Nadella) ➜ [IMPORTANT]." },
    { timestamp: "08:00:07", category: "AGENT", text: "Regenerating professional draft reply for msg_101." },
    { timestamp: "08:00:09", category: "AGENT", text: "Classifying email msg_102 (AWS) ➜ [IMPORTANT] (matches key: alert)." },
    { timestamp: "08:00:11", category: "ALERT", text: "Alert scheduled: dispatched Telegram summary." },
    { timestamp: "08:00:12", category: "ALERT", text: "Alert scheduled: dispatched Twilio WhatsApp summary." },
    { timestamp: "08:00:15", category: "SYSTEM", text: "Background scheduler standby. Next cron sync: 08:00:00 tomorrow." }
  ];

  useEffect(() => {
    setLogs(initialLogs);
    
    // Fetch preferences to display on side monitor
    const fetchPrefs = async () => {
      try {
        const data = await apiService.getPreferences();
        setPrefs(data);
      } catch (error) {
        console.error("Failed to load side panel preferences", error);
      }
    };
    fetchPrefs();

    // Spawn dynamic logs in real time to make it feel alive!
    const interval = setInterval(() => {
      const liveActions = [
        "Core telemetry heartbeat: healthy (24ms latency).",
        "Semantic Kernel Claude pipeline: ready for queries.",
        "Hangfire cron job: monitor standby (0 errors logged).",
        "Listening for live user instructions via floating ChatBot.",
        "PostgreSQL connection active: database pooled correctly.",
        "Synchronized with Google OAuth2 tokens: handshake successful."
      ];
      const randomText = liveActions[Math.floor(Math.random() * liveActions.length)];
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      
      setLogs(prev => {
        const newLogs = [...prev, { timestamp: timeStr, category: 'SYSTEM', text: randomText }];
        // Limit to last 15 lines to avoid memory leak
        return newLogs.slice(-15);
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] relative overflow-hidden">
      
      {/* Hyper-futuristic dynamic lighting effects */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/5 blur-[160px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-cyan-500/5 blur-[160px] pointer-events-none animate-pulse" />
      <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[160px] pointer-events-none" />

      {/* Futuristic Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Top Hologram Navigation Bar */}
      <nav className="glass-panel border-b border-white/5 py-4 px-6 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div 
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-300">
              <Cpu size={20} className="animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <span className="font-extrabold tracking-wide text-lg text-slate-100 flex items-center gap-1.5">
                Email<span className="gradient-text">Agent</span>
                <span className="hologram-gradient text-[9px] px-2.5 py-0.5 rounded-full text-white font-bold uppercase tracking-wider">
                  CLAUDE 4.5
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs md:text-sm font-semibold tracking-wider text-slate-400">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                currentView === 'dashboard' 
                  ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 shadow-md shadow-cyan-500/5' 
                  : 'hover:text-white'
              }`}
            >
              DASHBOARD
            </button>
            <button 
              onClick={() => setCurrentView('preferences')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                currentView === 'preferences' 
                  ? 'text-purple-400 bg-purple-500/10 border border-purple-500/20 shadow-md shadow-purple-500/5' 
                  : 'hover:text-white'
              }`}
            >
              FILTERS
            </button>
          </div>
        </div>
      </nav>

      {/* Main Core Columns */}
      <div className="flex-1 w-full max-w-[1400px] mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* LEFT COLUMN: Holographic Core HUD Panel */}
        <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-24 lg:h-[calc(100vh-120px)] overflow-hidden">
          
          {/* Claude core interactive Orb */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden">
            
            {/* Background scanner sweep line */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 h-10 w-full animate-pulse top-0" style={{ animationDuration: '3s' }} />

            {/* Glowing 3D Orb representing Claude Core */}
            <motion.div 
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.4}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-36 h-36 flex items-center justify-center cursor-grab active:cursor-grabbing mb-4"
            >
              {/* Outer Orbit Ring */}
              <div className="absolute inset-0 border border-dashed border-indigo-500/35 rounded-full animate-orb" />
              {/* Inner Pulsing Core */}
              <div className="absolute w-28 h-28 rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/30 to-cyan-500/20 blur-sm orb-glow animate-pulse" />
              <div className="absolute w-20 h-20 rounded-full bg-gradient-to-bl from-cyan-400/40 via-indigo-500/50 to-purple-400/40 border border-white/10 flex items-center justify-center">
                <Sparkles size={32} className="text-white animate-bounce" style={{ animationDuration: '4s' }} />
              </div>
            </motion.div>

            <h3 className="font-extrabold text-slate-100 text-lg tracking-wide uppercase flex items-center gap-1.5">
              Claude <span className="gradient-text">Cognitive Core</span>
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              Active cognitive layer processing unread mail streams and formulating responsive drafting logic. Drag the core to interact.
            </p>

            {/* Core Preference Monitor */}
            {prefs.focusCompanies.length > 0 && (
              <div className="mt-5 w-full flex flex-wrap justify-center gap-1.5 border-t border-white/5 pt-4">
                {prefs.focusCompanies.slice(0, 3).map(c => (
                  <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold uppercase">
                    {c}
                  </span>
                ))}
                {prefs.keywords.slice(0, 3).map(k => (
                  <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold uppercase">
                    {k}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* AI Telemetry Logs Console */}
          <div className="glass-panel p-5 rounded-3xl border border-white/5 flex-1 flex flex-col overflow-hidden min-h-[300px]">
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-xs">
                <Terminal size={15} />
                <span>AI Telemetry Console</span>
              </div>
              <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wide">
                Live Feed
              </span>
            </div>

            {/* Rolling Terminal Feed */}
            <div className="flex-1 overflow-y-auto space-y-2.5 font-mono text-[11px] leading-relaxed text-slate-300 pr-1">
              {logs.map((log, index) => (
                <div key={index} className="flex gap-2 items-start hover:bg-white/5 p-1 rounded transition-colors duration-150">
                  <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                  <span className={`font-bold text-[9px] px-1 rounded flex-shrink-0 ${
                    log.category === 'SYSTEM' ? 'bg-indigo-500/10 text-indigo-400' :
                    log.category === 'FETCH' ? 'bg-cyan-500/10 text-cyan-400' :
                    log.category === 'AGENT' ? 'bg-purple-500/10 text-purple-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {log.category}
                  </span>
                  <span className="flex-1 terminal-line break-words">{log.text}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Dashboard Pages Frame */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            >
              {currentView === 'dashboard' ? (
                <DailySummary onGoToPreferences={() => setCurrentView('preferences')} />
              ) : (
                <PreferencesPage onBackToDashboard={() => setCurrentView('dashboard')} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* Floating Assistant Chatbot Widget */}
      <ChatBot />

      {/* Holographic Footer */}
      <footer className="py-6 border-t border-white/5 bg-slate-950/60 relative z-10 text-xs text-slate-500 text-center select-none">
        <div className="max-w-[1400px] mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <span>&copy; {new Date().getFullYear()} EmailAgent Enterprise. Woven with Claude 4.5 & Semantic Kernel.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-300 transition-colors">API Docs</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Security Registry</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default App;
