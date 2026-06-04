import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { apiService, ChatHistoryMessage } from '../services/api';
import { MessageSquare, Send, Trash2, Cpu, Mic, MicOff, Star, Copy, Volume2 } from 'lucide-react';
import AssistantMascot, { MascotHandle } from './AssistantMascot';
import omniImg from './omni-walk.png';

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
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  interface FavoriteMessage {
    key: string;
    content: string;
    date: string;
  }

  const [favorites, setFavorites] = useState<FavoriteMessage[]>(() => {
    try {
      const favs = localStorage.getItem('chat_favorites_v2');
      return favs ? JSON.parse(favs) : [];
    } catch { return []; }
  });

  const [showFavoritesModal, setShowFavoritesModal] = useState(false);

  const toggleFavorite = (msg: ChatHistoryMessage, index: number) => {
    const key = msg.id ? msg.id.toString() : `temp-${index}-${msg.content.substring(0, 10)}`;
    setFavorites(prev => {
      const exists = prev.find(f => f.key === key);
      let newFavs;
      if (exists) {
        newFavs = prev.filter(f => f.key !== key);
      } else {
        newFavs = [...prev, { key, content: msg.content, date: new Date().toISOString() }];
        // Performans optimizasyonu: En fazla 50 favori tut (kasmasını engellemek için)
        if (newFavs.length > 50) {
          newFavs = newFavs.slice(newFavs.length - 50);
        }
      }
      localStorage.setItem('chat_favorites_v2', JSON.stringify(newFavs));
      return newFavs;
    });
  };

  const isFavorited = (msg: ChatHistoryMessage, index: number) => {
    const key = msg.id ? msg.id.toString() : `temp-${index}-${msg.content.substring(0, 10)}`;
    return favorites.some(f => f.key === key);
  };

  const scrollToMessage = (key: string) => {
    setShowFavoritesModal(false);
    setTimeout(() => {
      const el = document.getElementById(`chat-msg-${key}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.transition = 'background-color 0.5s ease';
        el.style.backgroundColor = 'rgba(245, 158, 11, 0.15)'; // Amber highlight
        setTimeout(() => {
          el.style.backgroundColor = 'transparent';
        }, 2000);
      } else {
        alert("This message is from an older session or was cleared.");
      }
    }, 100);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a small toast here if desired
  };

  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR'; // Default to Turkish since Omni usually speaks Turkish
    window.speechSynthesis.speak(utterance);
  };

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

  const prevMessagesLength = useRef(0);

  useEffect(() => {
    const isBulkLoad = messages.length - prevMessagesLength.current > 1;
    messagesEndRef.current?.scrollIntoView({ behavior: isBulkLoad ? 'auto' : 'smooth' });
    prevMessagesLength.current = messages.length;
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

  const handleToggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setIsLoading(true);

          try {
            const response = await apiService.sendVoiceMessage(sessionId, audioBlob);
            
            // Add what we heard as user message
            if (response.transcribedText) {
              setMessages(prev => [...prev, { role: 'user', sessionId, content: `🎤 ${response.transcribedText}` }]);
            }

            // Add AI response
            setMessages(prev => [...prev, { role: 'assistant', sessionId, content: response.reply }]);
            mascotRef.current?.celebrate();
          } catch (error) {
            console.error("Failed to post voice message", error);
            setMessages(prev => [...prev, { role: 'assistant', sessionId, content: "Could not process your voice command. Please try again." }]);
          } finally {
            setIsLoading(false);
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("Please allow microphone access to use voice commands.");
      }
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFavoritesModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-all font-bold text-xs uppercase tracking-wider flex items-center gap-2"
          >
            <Star size={14} /> Saved
          </button>
          <button
            onClick={handleClearChat}
            className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all font-bold text-xs uppercase tracking-wider flex items-center gap-2"
          >
            <Trash2 size={14} /> Clear History
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-6 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <div className="max-w-4xl mx-auto w-full space-y-8 py-4">
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              id={`chat-msg-${msg.id ? msg.id.toString() : `temp-${index}-${msg.content.substring(0, 10)}`}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-6 w-full transition-colors ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] mt-1">
                  <img src={omniImg} alt="Omni" className="w-full h-full object-cover scale-150" />
                </div>
              )}

              <div className={`relative group max-w-[85%] ${msg.role === 'user'
                  ? 'bg-slate-800/80 px-6 py-4 rounded-3xl text-slate-200 shadow-sm border border-white/5 text-[15px] leading-relaxed'
                  : 'text-slate-200 text-[15px] leading-relaxed pt-2 pb-8'
                }`}>
                {msg.content.split('\n').map((line, lIdx) => (
                  <p key={lIdx} className={lIdx > 0 ? 'mt-4' : ''}>{line}</p>
                ))}

                {msg.role === 'assistant' && (
                  <div className="absolute -bottom-2 left-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => speakText(msg.content)} className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors" title="Read Aloud">
                      <Volume2 size={14} />
                    </button>
                    <button onClick={() => copyToClipboard(msg.content)} className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors" title="Copy text">
                      <Copy size={14} />
                    </button>
                    <button onClick={() => toggleFavorite(msg, index)} className={`p-1.5 rounded-lg transition-colors ${isFavorited(msg, index) ? 'text-amber-400 bg-slate-800' : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800'}`} title="Favorite">
                      <Star size={14} fill={isFavorited(msg, index) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <div className="flex gap-6 w-full justify-start">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] mt-1">
                <img src={omniImg} alt="Omni" className="w-full h-full object-cover scale-150" />
              </div>
              <div className="pt-4 pb-8 flex items-center gap-1.5 h-[52px]">
                <span className="typing-dot bg-emerald-400/60"></span>
                <span className="typing-dot bg-emerald-400/60"></span>
                <span className="typing-dot bg-emerald-400/60"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
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
            disabled={isLoading || isRecording}
            placeholder="Send a message to Aegis..."
            className="flex-1 px-4 py-4 pl-12 rounded-2xl bg-slate-950/80 border border-slate-800 focus:border-emerald-500/50 outline-none text-slate-200 disabled:opacity-50 transition-all text-sm shadow-inner"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={handleToggleRecording}
            className={`px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all ${
              isRecording 
                ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                : 'bg-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-slate-700'
            }`}
          >
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!inputValue.trim() || isLoading || isRecording}
            className="px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-extrabold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:shadow-none transition-all"
          >
            <span>SEND</span>
            <Send size={16} />
          </motion.button>
        </form>
      </div>

      {/* Favorites Modal */}
      {showFavoritesModal && (
        <div className="absolute inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl relative">
             <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-800/50 rounded-t-3xl">
               <h3 className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-2"><Star size={16} fill="currentColor" /> Saved Messages</h3>
               <button onClick={() => setShowFavoritesModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">Close</button>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
                {favorites.length === 0 ? (
                  <p className="text-center text-slate-500 py-10 font-medium">You haven't saved any messages yet.</p>
                ) : (
                  favorites.map(fav => (
                    <div key={fav.key} 
                         className="bg-slate-800/50 p-4 rounded-xl border border-white/5 text-slate-300 text-sm relative group pr-16 cursor-pointer hover:bg-slate-800 transition-colors"
                         onClick={() => scrollToMessage(fav.key)}>
                      {fav.content.split('\n').map((line, idx) => <p key={idx} className={idx > 0 ? 'mt-2' : ''}>{line}</p>)}
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(fav.content);
                          }} 
                          className="text-slate-500 hover:text-emerald-400 p-1"
                          title="Copy"
                        >
                          <Copy size={14} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const n = favorites.filter(f => f.key !== fav.key);
                            setFavorites(n);
                            localStorage.setItem('chat_favorites_v2', JSON.stringify(n));
                          }} 
                          className="text-slate-500 hover:text-red-400 p-1"
                          title="Remove from favorites"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-2 font-bold flex items-center gap-1">
                         <span>CLICK TO JUMP</span>
                      </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
