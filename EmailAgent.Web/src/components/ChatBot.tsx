import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService, ChatHistoryMessage } from '../services/api';
import { MessageSquare, X, Send, Sparkles, Trash2 } from 'lucide-react';

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatHistoryMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState('user-session-101');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const loadHistory = async () => {
    try {
      const data = await apiService.getChatHistory(sessionId);
      if (data.length === 0) {
        setMessages([
          {
            role: 'assistant',
            sessionId,
            content: "Hello! I am your AI Email Assistant. I have loaded today's parsed emails. How can I help you manage your daily inbox today?"
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
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

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
    "Today's important emails",
    "Any Microsoft partnership updates?",
    "AWS database billing alert status",
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Floating Action Button */}
      {!isOpen && (
        <motion.button
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.08, rotate: 6 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center justify-center w-14 h-14 rounded-full gradient-bg text-white shadow-2xl shadow-indigo-500/35 relative hover:shadow-indigo-500/50 glow-hover duration-300"
        >
          <MessageSquare size={22} />
          <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-400"></span>
          </span>
        </motion.button>
      )}

      {/* Expanded Sliding Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="glass-panel w-[350px] sm:w-[380px] h-[520px] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
          >
            
            {/* Header */}
            <div className="p-4 bg-slate-900/40 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8.5 h-8.5 rounded-lg gradient-bg flex items-center justify-center text-white shadow-inner">
                  <Sparkles size={14} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-100 text-xs tracking-wider uppercase">Claude Assistant</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Active</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button 
                  onClick={handleClearChat}
                  className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-red-400 transition-colors"
                  title="Clear Chat"
                >
                  <Trash2 size={14} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
                  title="Close Chat"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Message Body */}
            <div 
              ref={chatContainerRef}
              className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/20"
            >
              {messages.map((msg, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                    msg.role === 'user' 
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                      : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  }`}>
                    {msg.role === 'user' ? 'U' : 'AI'}
                  </div>

                  <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10'
                      : 'bg-slate-900/80 border border-white/5 text-slate-200 rounded-tl-none'
                  }`}>
                    {msg.content.split('\n').map((line, lIdx) => (
                      <p key={lIdx} className={lIdx > 0 ? 'mt-1.5' : ''}>{line}</p>
                    ))}
                  </div>
                </motion.div>
              ))}

              {/* Loader */}
              {isLoading && (
                <div className="flex gap-2.5 max-w-[85%]">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center text-[10px] font-bold">
                    AI
                  </div>
                  <div className="p-3.5 rounded-2xl rounded-tl-none bg-slate-900/80 border border-white/5 text-slate-400 flex items-center gap-1">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chips */}
            {messages.length === 1 && !isLoading && (
              <div className="px-4 py-2 border-t border-white/5 bg-slate-950/40 flex flex-col gap-1.5">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Inquire Claude</span>
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {suggestionChips.map(chip => (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      key={chip}
                      onClick={() => handleSendMessage(chip)}
                      className="text-[10px] px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/20 hover:bg-slate-800 text-slate-300 text-left transition-all truncate max-w-full"
                    >
                      {chip}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="p-3 bg-slate-900/40 border-t border-white/5 flex gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                placeholder="Ask Claude..."
                className="flex-1 px-4 py-2 rounded-xl bg-slate-950/60 border border-slate-900 text-xs focus:border-cyan-500/40 outline-none text-slate-200 disabled:opacity-50 transition-all"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="p-2.5 rounded-xl gradient-bg text-white font-medium flex items-center justify-center shadow-md disabled:opacity-40 transition-all"
              >
                <Send size={14} />
              </motion.button>
            </form>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
