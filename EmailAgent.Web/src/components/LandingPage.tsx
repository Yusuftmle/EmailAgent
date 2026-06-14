import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Play, 
  Activity, 
  Layers, 
  MessageSquare, 
  Eye, 
  Calendar, 
  TrendingDown, 
  Key, 
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Interactive WhatsApp -> Graph -> Notification Demonstration
interface InteractiveDemoProps {
  className?: string;
}

const InteractiveDemo: React.FC<InteractiveDemoProps> = ({ className = 'max-w-5xl' }) => {
  const [step, setStep] = useState(0);

  // Keyboard typing state
  const targetText = "Monitor MacBook Air price";
  const [typedText, setTypedText] = useState("");
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [showBotResponse, setShowBotResponse] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 3);
    }, 9000); // Expanded step duration to allow typing to complete
    return () => clearInterval(timer);
  }, []);

  // Handle typing sequence on Step 0
  useEffect(() => {
    if (step !== 0) {
      setTypedText("");
      setShowTypingIndicator(false);
      setShowBotResponse(false);
      return;
    }

    let index = 0;
    setTypedText("");
    let replyTimeout: any;

    const typeInterval = setInterval(() => {
      if (index < targetText.length) {
        setTypedText(targetText.substring(0, index + 1));
        index++;
      } else {
        clearInterval(typeInterval);
        setShowTypingIndicator(true);
        replyTimeout = setTimeout(() => {
          setShowTypingIndicator(false);
          setShowBotResponse(true);
        }, 1500);
      }
    }, 70); // Typings speed

    return () => {
      clearInterval(typeInterval);
      if (replyTimeout) clearTimeout(replyTimeout);
    };
  }, [step]);

  return (
    <div className={`w-full ${className} mx-auto bg-white/90 backdrop-blur-xl border border-white/60 rounded-2xl shadow-xl overflow-hidden min-h-[460px] flex flex-col transition-all duration-300`}>
      {/* Header */}
      <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold tracking-wider font-mono uppercase text-slate-300">AEGIS BOT WORKFLOW</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
        </div>
      </div>

      <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">
        {/* Centered PC Layout */}
        <div className="max-w-2xl mx-auto w-full text-left">
          
          {/* Dynamic Step Logic */}
          <div className="flex flex-col justify-center min-h-[280px]">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="whatsapp"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-5 font-sans"
                >
                  <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-2">
                    Step 1: Bot Command via WhatsApp
                  </div>
                  <div className="space-y-4">
                    {/* User Message with Keyboard typing indicator cursor */}
                    <div className="flex justify-end">
                      <div className="bg-[#d9fdd3] text-slate-800 text-sm px-4.5 py-3 rounded-2xl rounded-tr-none max-w-[85%] shadow-sm leading-relaxed flex items-center gap-0.5">
                        <span>{typedText}</span>
                        {typedText.length < targetText.length && (
                          <motion.span 
                            animate={{ opacity: [1, 0, 1] }} 
                            transition={{ repeat: Infinity, duration: 0.8 }}
                            className="inline-block w-1.5 h-4 bg-slate-700 ml-0.5"
                          />
                        )}
                      </div>
                    </div>
                    {/* Typing Indicator */}
                    {showTypingIndicator && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                      >
                        <div className="bg-white text-slate-800 text-sm px-4 py-3 rounded-2xl rounded-tl-none max-w-[80%] shadow-sm flex items-center gap-1.5 border border-slate-100">
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </motion.div>
                    )}
                    {/* Bot Response */}
                    {showBotResponse && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="bg-white text-slate-800 text-sm px-4.5 py-3.5 rounded-2xl rounded-tl-none max-w-[85%] shadow-sm leading-relaxed border border-slate-100">
                          <span className="font-semibold text-emerald-600 block mb-1">Aegis WhatsApp Bot:</span>
                          ✅ MacBook Air M3 is now being monitored. <br />
                          Starting Price: <span className="font-semibold text-slate-900">$1,099</span>. <br />
                          You will receive instant notifications on Telegram or WhatsApp when the price changes.
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="chart"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4 font-sans w-full"
                >
                  <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">
                    Step 2: Scraper Delta Monitoring
                  </div>
                  <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 relative">
                    <div className="flex justify-between items-center text-xs text-slate-400 mb-3 font-mono">
                      <span>URL: APPLE_STORE_TRACKER</span>
                      <span className="text-[#06b6d4] animate-pulse">RUNNING...</span>
                    </div>
                    {/* Simple SVG Graph */}
                    <div className="h-36 w-full relative pt-2">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40">
                        <defs>
                          <linearGradient id="demo-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Fill Area */}
                        <motion.path
                          d="M 5,10 H 30 L 55,10 L 80,30 L 95,30 L 95,40 L 5,40 Z"
                          fill="url(#demo-gradient)"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 2.5, ease: "easeInOut" }}
                        />
                        {/* Graph Line */}
                        <motion.path
                          d="M 5,10 H 30 L 55,10 L 80,30 L 95,30"
                          fill="none"
                          stroke="#06b6d4"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 2.5, ease: "easeInOut" }}
                        />
                        {/* Anomaly circle */}
                        <motion.circle
                          cx="80"
                          cy="30"
                          r="2.5"
                          fill="#ef4444"
                          initial={{ scale: 0 }}
                          animate={{ scale: [1, 2.5, 1] }}
                          transition={{ delay: 2.2, repeat: Infinity, duration: 1.5 }}
                        />
                      </svg>
                      {/* Tooltip / Label */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 2.4 }}
                        className="absolute top-2 right-4 bg-red-950/80 border border-red-800 text-red-400 px-2 py-1 rounded text-[10px] font-mono"
                      >
                        PRICE DROPPED! -18%
                      </motion.div>
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono pt-3 border-t border-slate-800 text-slate-400 mt-3">
                      <span>Price: $1,099</span>
                      <span className="text-[#06b6d4] font-bold">New: $899</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="notification"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4 font-sans"
                >
                  <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">
                    Step 3: Instant Push Alert Dispatch
                  </div>
                  <div className="relative bg-slate-100 rounded-xl p-6 flex flex-col items-center justify-center border border-slate-200 min-h-[180px]">
                    <div className="absolute top-2.5 w-16 h-1 bg-slate-300 rounded-full" />
                    
                    <motion.div
                      initial={{ y: -30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 120, delay: 0.4 }}
                      className="w-full bg-white/95 backdrop-blur shadow-lg border border-slate-200/60 p-4 rounded-xl flex items-start gap-4 mt-2"
                    >
                      <div className="w-10 h-10 rounded-lg bg-sky-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                        <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15.75-.8 3.93-1.13 5.71-.14.75-.42 1-.69 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.2-.02-.08.02-1.3 0.83-3.68 2.44-.35.24-.66.36-.94.35-.3-.01-.89-.17-1.33-.31-.54-.18-.97-.27-.93-.57.02-.16.24-.32.67-.5 2.62-1.14 4.37-1.89 5.25-2.26 2.5-.99 3.02-1.16 3.36-1.17.07 0 .24.02.35.12.09.08.12.18.13.26-.01.07-.01.14-.02.21z" />
                        </svg>
                      </div>
                      <div className="text-left space-y-1 w-full">
                        <div className="flex justify-between items-center w-full">
                          <span className="text-xs font-bold text-slate-800">Telegram Alert // Aegis Bot</span>
                          <span className="text-[10px] text-slate-400 font-mono">now</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          🔴 <strong>Price Dropped!</strong> MacBook Air M3 dropped from $1,099 to <strong>$899</strong> (-18%).
                        </p>
                      </div>
                    </motion.div>
                    
                    {/* Glow ring */}
                    <div className="absolute inset-0 border-2 border-[#06b6d4]/15 rounded-xl pointer-events-none animate-pulse" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Progress Dots */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              step === i ? 'bg-[#06b6d4] w-5' : 'bg-slate-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('jwt');

  return (
    <div className="text-slate-900 bg-[#f7f9fb] overflow-x-hidden min-h-screen">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-24 md:pt-40 pb-20 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Copy */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-xs font-mono text-slate-500">
              <span className="w-2 h-2 rounded-full bg-[#06b6d4] animate-pulse" />
              Introducing Aegis V3.0
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
              The AI Agent Layer for{' '}
              <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#06b6d4] bg-clip-text text-transparent">
                Everyday Automation
              </span>
            </h1>
            <p className="text-lg text-slate-600 max-w-xl leading-relaxed">
              Automate Gmail replies, track item prices, and monitor your web processes from WhatsApp and Telegram with your own multi-provider AI assistant.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={() => navigate(isAuthenticated ? '/app' : '/login')}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-slate-900/10 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                <span>Get Started</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/solutions')}
                className="px-8 py-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Play size={16} className="text-[#06b6d4] fill-[#06b6d4]/10" />
                <span>Explore Solutions</span>
              </button>
            </div>
          </div>

          {/* Robot Mascot Video Container */}
          <div className="lg:col-span-6 relative w-full h-[350px] md:h-[500px] flex items-center justify-center">
            {/* Mascot Video */}
            <div className="w-full h-full flex items-center justify-center rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white">
              <video
                src="/Robot_sips_coffee_and_waves_202606111436.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Channel Messaging Integrations Showcase Container */}
      <section className="max-w-[1440px] mx-auto px-6 py-20 border-t border-slate-100">
        <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200/50 bg-[#f7f9fb] p-8 md:p-20 min-h-[540px] flex items-center">
          {/* Background Video */}
          <video
            src="/Glassmorphic_cards_with_icons_202606111458.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover z-0 scale-[1.12] translate-x-[3%] translate-y-[3%] brightness-[1.05] saturate-[1.25] contrast-[1.05]"
          />
          {/* Gradient overlay: solid base background on the left for maximum text contrast, fading rapidly to transparent for the video */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#f7f9fb] via-[#f7f9fb]/95 via-[33%] to-transparent z-10" />

          {/* Text Content */}
          <div className="relative z-20 max-w-xl space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-100 bg-cyan-50 text-xs font-mono text-[#06b6d4]">
              <span>Omni Core Connect</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
              Command & Alert <br />
              <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#06b6d4] bg-clip-text text-transparent">
                Via Messaging Bots
              </span>
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Ditch manual management. Interact directly with Aegis V3.0 on your phone. Dispatch scrape commands or request log summaries on the go by chatting directly with our bot handlers on WhatsApp and Telegram.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 border border-green-100 text-xs font-mono">
                  WP
                </div>
                <span className="text-xs font-semibold text-slate-700">Direct WhatsApp commands (/monitor, /summarize)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-600 border border-sky-100 text-xs font-mono">
                  TG
                </div>
                <span className="text-xs font-semibold text-slate-700">Telegram Price Anomaly Push Notifications</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Powerful Features, Engineered to Automate</h2>
          <p className="text-slate-500 max-w-xl mx-auto text-base">
            Modular intelligence working in harmony to streamline your daily communication, web research, and tracking tasks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Large Span for Gmail */}
          <div className="md:col-span-2 bg-[#f1f5f9] hover:bg-white border border-slate-100 hover:shadow-xl hover:shadow-slate-100/50 hover:-translate-y-1 transition-all duration-300 p-8 rounded-2xl flex flex-col justify-between group min-h-[300px]">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm text-slate-800 border border-slate-100">
                <Mail className="text-[#06b6d4]" size={22} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Gmail AI Draft Reply Generator</h3>
              <p className="text-slate-600 max-w-md leading-relaxed text-sm">
                Aegis V3.0 reads your Gmail feed in the background, groups unread threads, extracts context, and automatically drafts high-quality email replies for your review.
              </p>
            </div>
            <div className="flex gap-4 text-xs font-mono text-[#06b6d4] mt-6 border-t border-slate-200/50 pt-4">
              <span>// AUTOMATIC_DRAFTS</span>
              <span>// THREAD_SUMMARIES</span>
            </div>
          </div>

          {/* Card 2: Scrapers */}
          <div className="bg-[#f1f5f9] hover:bg-white border border-slate-100 hover:shadow-xl hover:shadow-slate-100/50 hover:-translate-y-1 transition-all duration-300 p-8 rounded-2xl flex flex-col justify-between min-h-[300px]">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm text-slate-800 border border-slate-100">
                <TrendingDown className="text-purple-500" size={22} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Background Web Scrapers</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Connect product and listing URLs. Our background agents scrape pages periodically to log price histories and calculate price deltas.
              </p>
            </div>
            <div className="flex gap-2 text-xs font-mono text-purple-500 mt-6 border-t border-slate-200/50 pt-4">
              <span>// DELTA_CHECKS</span>
              <span>// WEB_SCRAPING</span>
            </div>
          </div>

          {/* Card 3: Multi-Channel Messaging */}
          <div className="bg-[#f1f5f9] hover:bg-white border border-slate-100 hover:shadow-xl hover:shadow-slate-100/50 hover:-translate-y-1 transition-all duration-300 p-8 rounded-2xl flex flex-col justify-between min-h-[300px]">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm text-slate-800 border border-slate-100">
                <MessageSquare className="text-emerald-500" size={22} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">WhatsApp & Telegram Integration</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Send commands like /monitor or /summarize on WhatsApp. Set pairing codes and receive price drop alert summaries on Telegram.
              </p>
            </div>
            <div className="flex gap-2 text-xs font-mono text-emerald-500 mt-6 border-t border-slate-200/50 pt-4">
              <span>// TELEGRAM_PUSH</span>
              <span>// WHATSAPP_BOT</span>
            </div>
          </div>

          {/* Card 4: Visual Evaluator */}
          <div className="bg-[#f1f5f9] hover:bg-white border border-slate-100 hover:shadow-xl hover:shadow-slate-100/50 hover:-translate-y-1 transition-all duration-300 p-8 rounded-2xl flex flex-col justify-between min-h-[300px]">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm text-slate-800 border border-slate-100">
                <Eye className="text-sky-500" size={22} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">AI Visual Evaluator</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Scan product images with visual domain personas. Evaluates car conditions, laptop cosmetics, and fashion listings instantly.
              </p>
            </div>
            <div className="flex gap-2 text-xs font-mono text-sky-500 mt-6 border-t border-slate-200/50 pt-4">
              <span>// VISION_ANALYSIS</span>
              <span>// AUTO_INSPECTION</span>
            </div>
          </div>

          {/* Card 5: Smart Calendar & Tasks */}
          <div className="bg-[#f1f5f9] hover:bg-white border border-slate-100 hover:shadow-xl hover:shadow-slate-100/50 hover:-translate-y-1 transition-all duration-300 p-8 rounded-2xl flex flex-col justify-between min-h-[300px]">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm text-slate-800 border border-slate-100">
                <Calendar className="text-amber-500" size={22} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Google Calendar & Tasks</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Sync with your Google Calendar to track tasks, schedule reminders, and receive notification summaries exactly when items are due.
              </p>
            </div>
            <div className="flex gap-2 text-xs font-mono text-amber-500 mt-6 border-t border-slate-200/50 pt-4">
              <span>// CALENDAR_SYNC</span>
              <span>// SCHEDULING</span>
            </div>
          </div>

          {/* Card 6: Live Telemetry Diagnostics */}
          <div className="md:col-span-2 bg-slate-900 text-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-8 rounded-2xl flex flex-col justify-between min-h-[300px]">
            <div className="flex justify-between items-start">
              <div className="space-y-4 max-w-md">
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                  <Activity className="text-emerald-400" size={22} />
                </div>
                <h3 className="text-2xl font-bold text-white">Live Diagnostics Telemetry</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  Real-time monitoring console powered by SignalR. Audit scraper workloads, API call frequencies, database latency, and execution queues.
                </p>
              </div>
              <div className="hidden sm:block">
                <div className="w-24 h-24 rounded-full border border-slate-800 flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping" />
                  <Layers className="text-[#06b6d4] opacity-50 animate-pulse" size={28} />
                </div>
              </div>
            </div>
            <div className="flex gap-4 text-xs font-mono text-slate-500 mt-6 border-t border-slate-800 pt-4">
              <span>STATUS // SIGNALR_COMM_ACTIVE</span>
              <span className="text-emerald-400">// LIVE_STREAMING</span>
            </div>
          </div>

          {/* Card 7: Multi-Provider BYOK AI */}
          <div className="bg-[#f1f5f9] hover:bg-white border border-slate-100 hover:shadow-xl hover:shadow-slate-100/50 hover:-translate-y-1 transition-all duration-300 p-8 rounded-2xl flex flex-col justify-between min-h-[300px]">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm text-slate-800 border border-slate-100">
                <Key className="text-indigo-500" size={22} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">BYOK Model Selection</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Connect your preferred LLM engine. Aegis supports Claude 3.5, Gemini 1.5, and Groq with Bring-Your-Own-Key configuration.
              </p>
            </div>
            <div className="flex gap-2 text-xs font-mono text-indigo-500 mt-6 border-t border-slate-200/50 pt-4">
              <span>// CLAUDE_GEMINI_GROQ</span>
              <span>// CUSTOM_API_KEYS</span>
            </div>
          </div>
        </div>
      </section>

      {/* Command Cockpit Mock Preview */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-slate-100">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">Aegis Bot Workflow</h2>
          <p className="text-slate-500 max-w-xl mx-auto text-base">
            Watch the Aegis Sentinel bot orchestrate email replies, check price deltas, and dispatch instant alerts.
          </p>
        </div>

        <div className="max-w-5xl mx-auto relative">
          <InteractiveDemo className="max-w-5xl" />
        </div>
      </section>

      {/* Aegis in Numbers Metrics Section */}
      <section className="bg-slate-50 py-20 border-y border-slate-200/50">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-12">
          <div className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-widest text-[#06b6d4]">
              Operational Metrics
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Aegis In Numbers</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-2 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="text-3xl md:text-4xl font-extrabold text-slate-900 font-mono">12,480+</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Emails Processed</div>
            </div>
            
            <div className="space-y-2 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="text-3xl md:text-4xl font-extrabold text-[#06b6d4] font-mono">48,910+</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Price Scrapes</div>
            </div>
            
            <div className="space-y-2 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="text-3xl md:text-4xl font-extrabold text-purple-600 font-mono">1,850+</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Telegram Alerts</div>
            </div>
            
            <div className="space-y-2 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="text-3xl md:text-4xl font-extrabold text-emerald-500 font-mono">&lt; 12ms</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Latency</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="relative rounded-3xl p-10 md:p-20 text-center bg-slate-900 text-slate-100 overflow-hidden shadow-2xl">
          {/* Subtle decoration */}
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
              Secure Your Communication Edge.
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto text-base">
              Deploy your own autonomous email triaging and price alerts system today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <button
                onClick={() => navigate(isAuthenticated ? '/app' : '/login')}
                className="bg-[#06b6d4] hover:bg-cyan-500 text-slate-950 font-bold px-8 py-4 rounded-xl shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              >
                Get Started Now
              </button>
              <button
                onClick={() => navigate('/docs')}
                className="px-8 py-4 border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl transition-all duration-200"
              >
                View API Documentation
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
export default LandingPage;
