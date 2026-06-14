import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService, ChatHistoryMessage } from '../services/api';
import { MessageSquare, Send, Trash2, Cpu, Mic, MicOff, Star, Copy, Volume2, Check, Paperclip } from 'lucide-react';

export const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<ChatHistoryMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  interface FavoriteMessage {
    key: string;
    content: string;
    date: string;
  }

  const [favorites, setFavorites] = useState<FavoriteMessage[]>(() => {
    try {
      const favs = localStorage.getItem('chat_favorites_v3');
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
        if (newFavs.length > 50) {
          newFavs = newFavs.slice(newFavs.length - 50);
        }
      }
      localStorage.setItem('chat_favorites_v3', JSON.stringify(newFavs));
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
        el.style.backgroundColor = 'rgba(34, 211, 238, 0.1)';
        setTimeout(() => {
          el.style.backgroundColor = 'transparent';
        }, 2000);
      }
    }, 100);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
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

  const loadHistory = async () => {
    try {
      const data = await apiService.getChatHistory(sessionId);
      if (data.length === 0) {
        setMessages([
          {
            role: 'assistant',
            sessionId,
            content: "Welcome to Aegis Command Room. I am your cognitive operations assistant. I process and scan incoming feeds, analyze anomalies, and orchestrate pipeline automation workflows.\n\nAsk me to 'run diagnostics', 'check latest emails', or 'summarize tracked products'."
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
    } catch (error) {
      console.error("Failed to post chat message", error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          sessionId,
          content: "System timeout. Connection to the cognitive engine failed."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
    } else {
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
            
            if (response.transcribedText) {
              setMessages(prev => [...prev, { role: 'user', sessionId, content: `🎤 ${response.transcribedText}` }]);
            }

            setMessages(prev => [...prev, { role: 'assistant', sessionId, content: response.reply }]);
          } catch (error) {
            console.error("Failed to post voice message", error);
            setMessages(prev => [...prev, { role: 'assistant', sessionId, content: "Speech recognition service error. Please try again." }]);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    e.target.value = '';

    setMessages(prev => [...prev, { role: 'user', sessionId, content: `📄 [Yüklenen Dosya: ${file.name}]` }]);

    try {
      const response = await apiService.uploadDocument(sessionId, file);
      setMessages(prev => [...prev, { role: 'assistant', sessionId, content: response.reply }]);
    } catch (error: any) {
      console.error("Failed to upload document", error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        sessionId, 
        content: `Belge yükleme hatası: ${error.response?.data || error.message || 'Sunucu hatası'}` 
      }]);
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
            content: "Conversation history cleared. System initialized."
          }
        ]);
      } catch (error) {
        console.error("Failed to clear chat history", error);
      }
    }
  };

  const suggestionChips = [
    "Check recent emails",
    "Show active diagnostics",
    "List system anomalies",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] overflow-hidden rounded-2xl border border-outline-variant/35 bg-surface-container-low/30 backdrop-blur-md shadow-2xl relative">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between z-10 bg-surface-container-low/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <Cpu size={18} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-on-surface">Intelligence Console</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary">
                <span className="absolute w-1.5 h-1.5 bg-secondary rounded-full signal-pulse" />
              </span>
              <span className="font-data-mono text-[9px] text-on-surface-variant uppercase tracking-wider">COGNITIVE_CORE // SECURE</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFavoritesModal(true)}
            className="px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface-variant hover:text-on-surface transition-all font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1.5"
          >
            <Star size={12} />
            <span>Saved</span>
          </button>
          <button
            onClick={handleClearChat}
            className="px-3 py-1.5 rounded-lg bg-tertiary/10 border border-tertiary/20 text-tertiary-container hover:text-tertiary hover:bg-tertiary/20 transition-all font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1.5"
          >
            <Trash2 size={12} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-6 overflow-y-auto relative z-10 hide-scrollbar bg-[#020617]/10">
        <div className="max-w-5xl mx-auto w-full space-y-4 py-2">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const timeStr = msg.createdAt 
              ? new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
              : new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={index}
                id={`chat-msg-${msg.id ? msg.id.toString() : `temp-${index}-${msg.content.substring(0, 10)}`}`}
                className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`relative group max-w-[70%] rounded-2xl px-5 py-3 border transition-all duration-200 shadow-md ${
                    isUser
                      ? 'bg-secondary/10 border-secondary/25 text-white rounded-tr-none'
                      : 'bg-surface-container-high/40 border-outline-variant/20 text-on-surface rounded-tl-none'
                  }`}
                >
                  <div className="space-y-2 text-xs md:text-sm leading-relaxed whitespace-pre-line font-geist">
                    {msg.content}
                  </div>
                  
                  <span className="block text-[9px] text-on-surface-variant/40 text-right mt-1 font-data-mono">
                    {timeStr}
                  </span>

                  {!isUser && (
                    <div className="absolute -bottom-3 right-3 flex items-center gap-1 bg-surface-container-low border border-outline-variant/30 rounded-lg py-0.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                      <button 
                        onClick={() => speakText(msg.content)} 
                        className="p-1 text-on-surface-variant hover:text-primary transition-colors" 
                        title="Read Aloud"
                      >
                        <Volume2 size={12} />
                      </button>
                      <button 
                        onClick={() => copyToClipboard(msg.content, index)} 
                        className="p-1 text-on-surface-variant hover:text-primary transition-colors" 
                        title="Copy"
                      >
                        {copiedIndex === index ? <Check size={12} className="text-secondary" /> : <Copy size={12} />}
                      </button>
                      <button 
                        onClick={() => toggleFavorite(msg, index)} 
                        className={`p-1 transition-colors ${isFavorited(msg, index) ? 'text-amber-400' : 'text-on-surface-variant hover:text-amber-400'}`} 
                        title="Favorite"
                      >
                        <Star size={12} fill={isFavorited(msg, index) ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex w-full justify-start">
              <div className="bg-surface-container-high/40 border border-outline-variant/25 rounded-2xl rounded-tl-none px-5 py-3.5 flex items-center gap-1 h-[44px]">
                <span className="typing-dot bg-primary/60"></span>
                <span className="typing-dot bg-primary/60"></span>
                <span className="typing-dot bg-primary/60"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-outline-variant/20 bg-surface-container-low/40 relative z-10">
        {messages.length === 1 && !isLoading && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 hide-scrollbar max-w-5xl mx-auto">
            {suggestionChips.map(chip => (
              <button
                key={chip}
                onClick={() => handleSendMessage(chip)}
                className="whitespace-nowrap px-3.5 py-1.5 rounded-lg bg-surface-container border border-outline-variant/20 hover:border-primary/45 text-on-surface-variant hover:text-on-surface text-label-sm font-semibold transition-all"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputValue);
          }}
          className="flex gap-2.5 max-w-5xl mx-auto relative"
        >
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none">
            <MessageSquare size={16} />
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading || isRecording}
            placeholder="Instruct Aegis core..."
            className="flex-1 px-4 py-3 pl-11 rounded-xl bg-surface-container-lowest/40 border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-on-surface placeholder:text-on-surface-variant/40 disabled:opacity-50 transition-all text-xs md:text-sm font-geist"
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            accept=".pdf,.txt,.md,.json,.csv"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isRecording}
            className="px-3.5 rounded-xl flex items-center justify-center border bg-surface-container border-outline-variant/30 text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-all"
            title="Upload Document"
          >
            <Paperclip size={16} />
          </button>
          <button
            type="button"
            onClick={handleToggleRecording}
            className={`px-3.5 rounded-xl flex items-center justify-center border transition-all ${
              isRecording 
                ? 'bg-tertiary/10 text-tertiary-container border-tertiary/40 animate-pulse' 
                : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
            }`}
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading || isRecording}
            className="px-5 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary hover:text-on-primary text-primary font-semibold text-label-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:hover:bg-primary/10 disabled:hover:text-primary"
          >
            <span>Execute</span>
            <Send size={12} />
          </button>
        </form>
      </div>

      {/* Favorites Modal */}
      <AnimatePresence>
        {showFavoritesModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-surface/80 z-50 flex items-center justify-center p-6 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface-container border border-outline-variant/30 rounded-2xl w-full max-w-xl max-h-[70vh] flex flex-col shadow-2xl relative"
            >
               <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low rounded-t-2xl">
                 <h3 className="text-primary font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5"><Star size={14} fill="currentColor" /> Saved Instructions</h3>
                 <button onClick={() => setShowFavoritesModal(false)} className="text-on-surface-variant hover:text-on-surface font-semibold text-[11px] uppercase tracking-wider">Close</button>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar">
                  {favorites.length === 0 ? (
                    <p className="text-center text-on-surface-variant/60 py-10 text-xs">No saved instructions found.</p>
                  ) : (
                    favorites.map(fav => (
                      <div key={fav.key} 
                           className="bg-surface-container-low/50 p-4 rounded-xl border border-outline-variant/20 text-on-surface-variant text-xs relative group pr-16 cursor-pointer hover:bg-surface-container-high/45 transition-colors"
                           onClick={() => scrollToMessage(fav.key)}>
                        <p className="whitespace-pre-line leading-relaxed">{fav.content}</p>
                        <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(fav.content, 9999);
                            }} 
                            className="text-on-surface-variant hover:text-primary p-1"
                            title="Copy"
                          >
                            <Copy size={12} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const n = favorites.filter(f => f.key !== fav.key);
                              setFavorites(n);
                              localStorage.setItem('chat_favorites_v3', JSON.stringify(n));
                            }} 
                            className="text-on-surface-variant hover:text-tertiary-container p-1"
                            title="Remove"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <div className="text-[9px] text-primary mt-2 font-semibold font-data-mono tracking-wider">
                           JUMP_TO_POSITION
                        </div>
                      </div>
                    ))
                  )}
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
