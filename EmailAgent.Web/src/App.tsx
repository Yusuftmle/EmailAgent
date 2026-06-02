import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DailySummary } from './components/DailySummary';
import { PreferencesPage } from './components/PreferencesPage';
import { ChatBot } from './components/ChatBot';
import { CommandCenter } from './components/CommandCenter';
import { ChatView } from './components/ChatView';
import { apiService, UserPreferences } from './services/api';
import { Cpu, Terminal } from 'lucide-react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import { OmniRobot } from './components/AssistantMascot';

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

export interface TelemetryLog {
  timestamp: string;
  category: 'SYSTEM' | 'FETCH' | 'AGENT' | 'ALERT';
  text: string;
}

export const AppLayout: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'chat' | 'plugins' | 'preferences'>('dashboard');
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [prefs, setPrefs] = useState<UserPreferences>({ focusCompanies: [], keywords: [] });

  // ── Mascot states & handlers for the HUD Cognitive Core ──
  const [isCoreHovered, setIsCoreHovered] = useState(false);
  const [waveAngle, setWaveAngle] = useState(0);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Waving timer tick
  useEffect(() => {
    if (!isCoreHovered) {
      setWaveAngle(0);
      return;
    }
    let t = 0;
    const intervalId = setInterval(() => {
      t += 0.28;
      setWaveAngle(-80 + Math.sin(t) * 55);
    }, 16);
    return () => clearInterval(intervalId);
  }, [isCoreHovered]);

  // Card mouse handlers for gaze tracking
  const handleCardMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cardCenterX = rect.left + rect.width / 2;
    const cardCenterY = rect.top + rect.height / 2;
    const dx = e.clientX - cardCenterX;
    const dy = e.clientY - cardCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;
    const maxOffset = 5.5;
    setMouseOffset({
      x: (dx / dist) * Math.min(maxOffset, dist * 0.04),
      y: (dy / dist) * Math.min(maxOffset * 0.6, dist * 0.025),
    });
  }, []);

  const handleCardMouseLeave = useCallback(() => {
    setIsCoreHovered(false);
    setMouseOffset({ x: 0, y: 0 });
  }, []);

  // ── Determine time of day ──
  const [timeMode] = useState<'morning' | 'afternoon' | 'night'>(() => {
    const hr = new Date().getHours();
    if (hr >= 6 && hr < 12) return 'morning';
    if (hr >= 12 && hr < 18) return 'afternoon';
    return 'night';
  });


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
        const newLogs: TelemetryLog[] = [...prev, { timestamp: timeStr, category: 'SYSTEM' as const, text: randomText }];
        // Limit to last 15 lines to avoid memory leak
        return newLogs.slice(-15);
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const bgGradient =
    timeMode === 'morning' ? 'from-[#0a0f1d] via-[#121c32] to-[#25152a]' :
      timeMode === 'afternoon' ? 'from-[#0b1420] via-[#0f212f] to-[#0f2a20]' :
        'from-[#05080e] via-[#09101f] to-[#120b20]';

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgGradient} text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] relative overflow-hidden`}>

      {/* Repeating Telegram-Style Cute Doodle Wallpaper */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.02] pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="telegram-doodles-app" width="120" height="120" patternUnits="userSpaceOnUse">
            {/* Doodle 1: Mail Envelope */}
            <path d="M10,15 L30,15 L30,30 L10,30 Z M10,15 L20,23 L30,15" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            {/* Doodle 2: Cute Cloud */}
            <path d="M55,23 C53,23 51,21 51,19 C51,16 53,14 56,14 C57,12 60,12 61,14 C63,14 65,16 65,19 C65,21 63,23 61,23 Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
            {/* Doodle 3: Tiny Star */}
            <path d="M90,15 L92,19 L96,19 L93,22 L94,26 L90,24 L86,26 L87,22 L84,19 L88,19 Z" fill="none" stroke="currentColor" strokeWidth="1" />
            {/* Doodle 4: Coffee Cup */}
            <path d="M20,65 L32,65 C32,65 32,73 30,75 C28,77 24,77 22,75 C20,73 20,65 20,65 Z M32,67 C34,67 34,71 32,71" fill="none" stroke="currentColor" strokeWidth="1.2" />
            {/* Doodle 5: Robot Smiley (Omni!) */}
            <rect x="52" y="62" width="16" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="56" cy="67" r="0.8" fill="currentColor" />
            <circle cx="64" cy="67" r="0.8" fill="currentColor" />
            <path d="M57,70 Q60,72 63,70" fill="none" stroke="currentColor" strokeWidth="1" />
            {/* Doodle 6: Chat Bubble */}
            <path d="M85,65 C85,61 90,61 93,61 C96,61 98,63 98,66 C98,69 95,70 93,70 L90,70 L88,72 L88,70 C85,70 85,67 85,65 Z" fill="none" stroke="currentColor" strokeWidth="1" />
            {/* Doodle 7: Sparkles & dots */}
            <circle cx="10" cy="100" r="1" fill="currentColor" />
            <circle cx="105" cy="100" r="0.8" fill="currentColor" />
            <circle cx="112" cy="50" r="1" fill="currentColor" />
            <circle cx="45" cy="45" r="0.8" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#telegram-doodles-app)" />
      </svg>

      {/* Dynamic Background Glow Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {timeMode === 'morning' && (
          <>
            <div className="absolute -top-20 -left-20 w-[45vw] h-[45vw] rounded-full bg-pink-500/10 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute -bottom-20 -right-20 w-[50vw] h-[50vw] rounded-full bg-amber-500/8 blur-[130px] animate-pulse" style={{ animationDuration: '10s' }} />
          </>
        )}
        {timeMode === 'afternoon' && (
          <>
            <div className="absolute -top-20 -right-20 w-[45vw] h-[45vw] rounded-full bg-teal-500/8 blur-[120px] animate-pulse" style={{ animationDuration: '9s' }} />
            <div className="absolute -bottom-20 -left-20 w-[50vw] h-[50vw] rounded-full bg-indigo-500/10 blur-[130px] animate-pulse" style={{ animationDuration: '11s' }} />
          </>
        )}
        {timeMode === 'night' && (
          <>
            <div className="absolute -bottom-40 right-20 w-[55vw] h-[55vw] rounded-full bg-amber-500/12 blur-[140px] animate-pulse" style={{ animationDuration: '12s' }} />
            <div className="absolute -top-20 -left-20 w-[40vw] h-[40vw] rounded-full bg-purple-900/10 blur-[120px]" />
          </>
        )}
      </div>

      {/* Cozy Firefly/Sunbeam particles drifting up */}
      <CozyParticles mode={timeMode} />

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
                Omni<span className="gradient-text">Agent</span>
                <span className="hologram-gradient text-[9px] px-2.5 py-0.5 rounded-full text-white font-bold uppercase tracking-wider">
                  AEGIS CORE
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs md:text-sm font-semibold tracking-wider text-slate-400">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-3 py-1.5 rounded-lg transition-all ${currentView === 'dashboard'
                  ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 shadow-md shadow-cyan-500/5'
                  : 'hover:text-white'
                }`}
            >
              COMMAND CENTER
            </button>
            <button
              onClick={() => setCurrentView('chat')}
              className={`px-3 py-1.5 rounded-lg transition-all ${currentView === 'chat'
                  ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shadow-md shadow-emerald-500/5'
                  : 'hover:text-white'
                }`}
            >
              CHAT
            </button>
            <button
              onClick={() => setCurrentView('plugins')}
              className={`px-3 py-1.5 rounded-lg transition-all ${currentView === 'plugins'
                  ? 'text-orange-400 bg-orange-500/10 border border-orange-500/20 shadow-md shadow-orange-500/5'
                  : 'hover:text-white'
                }`}
            >
              PLUGINS
            </button>
            <button
              onClick={() => setCurrentView('preferences')}
              className={`px-3 py-1.5 rounded-lg transition-all ${currentView === 'preferences'
                  ? 'text-purple-400 bg-purple-500/10 border border-purple-500/20 shadow-md shadow-purple-500/5'
                  : 'hover:text-white'
                }`}
            >
              SETTINGS
            </button>
          </div>
        </div>
      </nav>

      {/* Main Core Columns */}
      <div className="flex-1 w-full max-w-[1400px] mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">

        {/* LEFT COLUMN: Holographic Core HUD Panel */}
        <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-24 lg:h-[calc(100vh-120px)] overflow-hidden">

          {/* Claude core interactive Orb */}
          <div
            ref={cardRef}
            onMouseMove={handleCardMouseMove}
            onMouseEnter={() => setIsCoreHovered(true)}
            onMouseLeave={handleCardMouseLeave}
            className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-300 hover:border-indigo-500/25 shadow-lg group"
          >

            {/* Background scanner sweep line */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 h-10 w-full animate-pulse top-0" style={{ animationDuration: '3s' }} />

            {/* Glowing 3D Orb area replaced with OmniRobot Capsule */}
            <div className="relative w-36 h-36 flex items-center justify-center mb-4 select-none cursor-pointer">
              {/* Outer Orbit Ring */}
              <div className="absolute inset-0 border border-dashed border-indigo-500/35 rounded-full animate-orb" />
              {/* Inner Pulsing Core / Ambient Hologram Glow */}
              <div className="absolute w-28 h-28 rounded-full bg-gradient-to-tr from-indigo-500/10 via-purple-500/20 to-cyan-500/10 blur-md opacity-75 animate-pulse" />

              {/* Scale animation wrapper for hover feedback (Spring feel) */}
              <div
                style={{
                  transform: isCoreHovered ? 'scale(1.08)' : 'scale(1)',
                  transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
                className="flex items-center justify-center z-10 animate-floating"
              >
                <OmniRobot
                  behavior={isCoreHovered ? 'wave' : 'idle'}
                  facingLeft={false}
                  walkCycle={0}
                  jumpY={0}
                  waveAngle={waveAngle}
                  mouseEyeOffset={mouseOffset}
                  headOnly={true}
                />
              </div>
            </div>

            <h3 className="font-extrabold text-slate-100 text-lg tracking-wide uppercase flex items-center gap-1.5">
              Aegis <span className="gradient-text">Cognitive Core</span>
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              Active cognitive layer processing background tasks, plugins, and generating responses. Hover the core to interact.
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
                  <span className={`font-bold text-[9px] px-1 rounded flex-shrink-0 ${log.category === 'SYSTEM' ? 'bg-indigo-500/10 text-indigo-400' :
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
              {currentView === 'dashboard' && (
                <CommandCenter onNavigate={(view) => setCurrentView(view as any)} />
              )}
              {currentView === 'chat' && (
                <ChatView />
              )}
              {currentView === 'plugins' && (
                <DailySummary onGoToPreferences={() => setCurrentView('preferences')} />
              )}
              {currentView === 'preferences' && (
                <PreferencesPage onBackToDashboard={() => setCurrentView('dashboard')} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* Floating Assistant Chatbot Widget */}
      {currentView !== 'chat' && <ChatBot />}

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
