import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { apiService, ChatHistoryMessage } from '../services/api';
import { MessageSquare, Send, Trash2, Cpu } from 'lucide-react';
import AssistantMascot, { MascotHandle } from './AssistantMascot';

const CozyParticles: React.FC<{ mode: 'morning' | 'afternoon' | 'night' }> = ({ mode }) => {
  const particleCount = 14; // slightly fewer for chat pane to keep it clean!
  const particles = React.useMemo(() => {
    return Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      bottom: `${Math.random() * 10}%`,
      size: Math.random() * 4 + 2.5, // 2.5px to 6.5px
      delay: `${Math.random() * 8}s`,
      duration: `${Math.random() * 12 + 10}s`,
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
            animation: `cozyFloatChat ${p.duration} ease-in-out ${p.delay} infinite`,
            opacity: 0,
          }}
        />
      ))}
      <style>{`
        @keyframes cozyFloatChat {
          0% {
            transform: translateY(10%) translateX(0px);
            opacity: 0;
          }
          15% {
            opacity: 0.45;
          }
          85% {
            opacity: 0.45;
          }
          100% {
            transform: translateY(-500px) translateX(30px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<ChatHistoryMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.id) return user.id;
      }
    } catch(e) {}
    return '00000000-0000-0000-0000-000000000000';
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mascotRef = useRef<MascotHandle>(null);

  // ── Determine time of day ──
  const [timeMode] = useState<'morning' | 'afternoon' | 'night'>(() => {
    const hr = new Date().getHours();
    if (hr >= 6 && hr < 12) return 'morning';
    if (hr >= 12 && hr < 18) return 'afternoon';
    return 'night';
  });

  const loadHistory = async () => {
    try {
      const data = await apiService.getChatHistory(sessionId);
      if (data.length === 0) {
        setMessages([
          {
            role: 'assistant',
            sessionId,
            content: "Hello! I am Aegis, your General AI Assistant. I can process your emails, summarize data, or just have a chat. How can I help you today?"
          }
        ]);
      } else {
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to load chat history', error);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatHistoryMessage = {
      role: 'user',
      sessionId,
      content: text,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await apiService.sendChatMessage(sessionId, text);

      const assistantMsg: ChatHistoryMessage = {
        role: 'assistant',
        sessionId,
        content: response.reply,
      };

      setMessages(prev => [...prev, assistantMsg]);
      mascotRef.current?.celebrate();
    } catch (error) {
      console.error("Failed to post chat message", error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          sessionId,
          content: "Connection to the cognitive backend server timed out."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (window.confirm("Are you sure you want to clear this conversation history?")) {
      try {
        await apiService.clearChatHistory(sessionId);
        setMessages([
          {
            role: 'assistant',
            sessionId,
            content: "Conversation history cleared. How can I assist you now?"
          }
        ]);
      } catch (error) {
        console.error("Failed to clear chat history", error);
      }
    }
  };

  const suggestionChips = [
    "Check my new emails",
    "What plugins are active?",
    "Summarize my daily tasks",
  ];

  const bgGradient =
    timeMode === 'morning' ? 'from-[#0a0f1d] via-[#121c32] to-[#25152a]' :
      timeMode === 'afternoon' ? 'from-[#0b1420] via-[#0f212f] to-[#0f2a20]' :
        'from-[#05080e] via-[#09101f] to-[#120b20]';

  return (
    <div className={`glass-panel rounded-3xl border border-white/5 flex flex-col h-[calc(100vh-160px)] overflow-hidden relative bg-gradient-to-br ${bgGradient}`}>

      {/* Repeating Telegram-Style Cute Doodle Wallpaper */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.026] pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="telegram-doodles-chat" width="120" height="120" patternUnits="userSpaceOnUse">
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
        <rect width="100%" height="100%" fill="url(#telegram-doodles-chat)" />
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

      {/* Cozy Fireflies particles drifting up */}
      <CozyParticles mode={timeMode} />

      {/* Omni Mascot Walking on top of the message input bar */}
      <div className="absolute left-0 right-0 top-0 bottom-[80px] overflow-hidden pointer-events-none z-0">
        <AssistantMascot ref={mascotRef} />
      </div>

      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between relative z-10 bg-slate-900/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 shadow-inner">
            <Cpu size={24} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-100 uppercase tracking-widest">Aegis AI Chat</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Cognitive Engine Active</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleClearChat}
          className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all font-bold text-xs uppercase tracking-wider flex items-center gap-2"
        >
          <Trash2 size={14} /> Clear History
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6 relative z-10 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {messages.map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex gap-4 max-w-[80%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-extrabold ${msg.role === 'user'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
              }`}>
              {msg.role === 'user' ? 'USR' : 'AI'}
            </div>

            <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-lg ${msg.role === 'user'
                ? 'bg-indigo-600/90 text-white rounded-tr-none border border-indigo-500/50'
                : 'bg-slate-900/80 border border-emerald-500/20 text-slate-200 rounded-tl-none'
              }`}>
              {msg.content.split('\n').map((line, lIdx) => (
                <p key={lIdx} className={lIdx > 0 ? 'mt-2' : ''}>{line}</p>
              ))}
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <div className="flex gap-4 max-w-[80%]">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center text-xs font-extrabold shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              AI
            </div>
            <div className="p-4 rounded-2xl rounded-tl-none bg-slate-900/80 border border-emerald-500/20 text-slate-400 flex items-center gap-1.5 h-[52px]">
              <span className="typing-dot bg-emerald-400"></span>
              <span className="typing-dot bg-emerald-400"></span>
              <span className="typing-dot bg-emerald-400"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900/50 border-t border-white/5 relative z-10">
        {messages.length === 1 && !isLoading && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
            {suggestionChips.map(chip => (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                key={chip}
                onClick={() => handleSendMessage(chip)}
                className="whitespace-nowrap px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:border-emerald-500/40 text-slate-300 text-xs font-bold transition-all"
              >
                {chip}
              </motion.button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputValue);
          }}
          className="flex gap-3 relative"
        >
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            <MessageSquare size={18} />
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            placeholder="Send a message to Aegis..."
            className="flex-1 px-4 py-4 pl-12 rounded-2xl bg-slate-950/80 border border-slate-800 focus:border-emerald-500/50 outline-none text-slate-200 disabled:opacity-50 transition-all text-sm shadow-inner"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-extrabold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:shadow-none transition-all"
          >
            <span>SEND</span>
            <Send size={16} />
          </motion.button>
        </form>
      </div>
    </div>
  );
};
