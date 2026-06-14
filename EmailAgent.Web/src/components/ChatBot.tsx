import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService, ChatHistoryMessage } from '../services/api';
import { MessageSquare, X, Send, Cpu, Trash2 } from 'lucide-react';

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatHistoryMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user) return user.id || user.Id || '00000000-0000-0000-0000-000000000000';
      }
    } catch (e) {}
    return '00000000-0000-0000-0000-000000000000';
  });

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
            content: "Hello! I am your AI assistant. How can I help you manage your operational pipeline or review logs today?"
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
          content: "System timeout. Connection to the cognitive engine failed."
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
    "Today's active items",
    "Run full scan",
    "List anomalies",
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Action Button */}
      {!isOpen && (
        <motion.button
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.05, rotate: 3 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 border border-primary/30 text-primary shadow-2xl relative hover:bg-primary hover:text-on-primary transition-all duration-300"
        >
          <MessageSquare size={20} />
          <span className="absolute top-0 right-0 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
          </span>
        </motion.button>
      )}

      {/* Expanded Sliding Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="glass-panel w-[350px] sm:w-[380px] h-[500px] rounded-xl border border-outline-variant/30 shadow-2xl flex flex-col overflow-hidden"
          >
            
            {/* Header */}
            <div className="p-4 bg-surface-container border-b border-outline-variant/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <Cpu size={14} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-semibold text-on-surface text-xs tracking-wider uppercase">Aegis Core</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    <span className="font-data-mono text-[9px] text-on-surface-variant uppercase tracking-wider">ONLINE</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button 
                  onClick={handleClearChat}
                  className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-tertiary-container transition-colors"
                  title="Clear Chat"
                >
                  <Trash2 size={13} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
                  title="Close Chat"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Message Body */}
            <div 
              ref={chatContainerRef}
              className="flex-1 p-4 overflow-y-auto space-y-4 bg-surface-container-lowest/30 hide-scrollbar"
            >
              {messages.map((msg, index) => (
                <div 
                  key={index}
                  className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-[9px] font-bold ${
                    msg.role === 'user' 
                      ? 'bg-primary/10 text-primary border border-primary/20' 
                      : 'bg-outline-variant/20 text-on-surface-variant border border-outline-variant/30'
                  }`}>
                    {msg.role === 'user' ? 'U' : 'AI'}
                  </div>

                  <div className={`p-3 rounded-xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-surface-container-high/70 border border-primary/20 text-on-surface rounded-tr-none'
                      : 'bg-surface-container/20 border border-outline-variant/20 text-on-surface-variant rounded-tl-none'
                  }`}>
                    {msg.content.split('\n').map((line, lIdx) => (
                      <p key={lIdx} className={lIdx > 0 ? 'mt-1' : ''}>{line}</p>
                    ))}
                  </div>
                </div>
              ))}

              {/* Loader */}
              {isLoading && (
                <div className="flex gap-2.5 max-w-[85%]">
                  <div className="w-6 h-6 rounded bg-outline-variant/20 text-on-surface-variant border border-outline-variant/30 flex items-center justify-center text-[9px] font-bold">
                    AI
                  </div>
                  <div className="p-3 rounded-xl rounded-tl-none bg-surface-container/20 border border-outline-variant/20 text-on-surface-variant flex items-center gap-1">
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
              <div className="px-4 py-2 border-t border-outline-variant/20 bg-surface-container-low/40 flex flex-col gap-1.5">
                <span className="text-[9px] text-on-surface-variant/60 uppercase tracking-widest font-semibold font-geist">Suggestions</span>
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {suggestionChips.map(chip => (
                    <button
                      key={chip}
                      onClick={() => handleSendMessage(chip)}
                      className="text-[10px] px-2.5 py-1 rounded bg-surface-container border border-outline-variant/20 hover:border-primary/40 text-on-surface-variant hover:text-on-surface text-left transition-all truncate max-w-full"
                    >
                      {chip}
                    </button>
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
              className="p-3 bg-surface-container border-t border-outline-variant/20 flex gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                placeholder="Ask Aegis..."
                className="flex-1 px-3 py-2 rounded bg-surface-container-lowest/60 border border-outline-variant/30 text-xs focus:border-primary outline-none text-on-surface disabled:opacity-50 transition-all font-geist"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="px-3 rounded bg-primary/10 border border-primary/30 hover:bg-primary hover:text-on-primary text-primary transition-all text-xs font-semibold flex items-center justify-center disabled:opacity-50"
              >
                <Send size={12} />
              </motion.button>
            </form>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
