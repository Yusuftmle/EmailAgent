import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmailAnalysis, apiService } from '../services/api';
import { ChevronDown, ChevronUp, Copy, RefreshCw, Mail, Check, MessageSquare, ShieldAlert, BadgeInfo } from 'lucide-react';

interface EmailCardProps {
  email: EmailAnalysis;
  onUpdate: (updated: EmailAnalysis) => void;
}

export const EmailCard: React.FC<EmailCardProps> = ({ email, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [editableDraft, setEditableDraft] = useState(email.draftReply);

  const getBadgeColor = () => {
    switch (email.importance) {
      case 'important':
        return 'bg-red-500/10 border-red-500/25 text-red-400';
      case 'spam':
        return 'bg-slate-500/10 border-slate-500/20 text-slate-400';
      default:
        return 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400';
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editableDraft);
      setIsCopying(true);
      setTimeout(() => setIsCopying(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleRegenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRegenerating(true);
    try {
      const updated = await apiService.regenerateDraft(email.id);
      setEditableDraft(updated.draftReply);
      onUpdate(updated);
    } catch (error) {
      console.error('Failed to regenerate draft', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <motion.div 
      layout
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`holo-card rounded-2xl overflow-hidden ${
        email.importance === 'important' ? 'border-red-500/20 shadow-md shadow-red-500/5' : ''
      }`}
    >
      {/* Header clickable section */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-5 flex items-center justify-between cursor-pointer select-none bg-slate-900/10"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-3 rounded-xl ${
              email.importance === 'important' 
                ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                : email.importance === 'spam' 
                ? 'bg-slate-500/10 text-slate-400 border border-slate-500/15' 
                : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
            }`}
          >
            <Mail size={18} />
          </motion.div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${getBadgeColor()}`}>
                {email.importance}
              </span>
              <span className="text-[10px] text-slate-500">
                {new Date(email.processedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            
            <h3 className="font-bold text-slate-100 truncate text-sm md:text-base tracking-wide">
              {email.subject}
            </h3>
            <p className="text-xs text-slate-400 truncate">
              {email.from}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 ml-4">
          {email.importance !== 'spam' && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="p-2 rounded-xl bg-slate-800/80 border border-white/5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors disabled:opacity-50"
              title="Regenerate AI Draft"
            >
              <RefreshCw size={14} className={isRegenerating ? 'animate-spin' : ''} />
            </motion.button>
          )}
          <div className="text-slate-500 p-1">
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </div>

      {/* Expandable Details Container via Framer Motion */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-5 pb-5 border-t border-white/5 bg-slate-950/40">
              
              {/* Executive Summary */}
              <div className="mt-5">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-2 flex items-center gap-1.5">
                  <BadgeInfo size={13} /> AI Executive Summary
                </h4>
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-900 text-xs md:text-sm leading-relaxed text-slate-300 italic">
                  {email.summary}
                </div>
              </div>

              {/* Draft Reply (Non-Spam) */}
              {email.importance !== 'spam' && (
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
                      <MessageSquare size={13} /> AI Draft Reply
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-500 italic">Editable</span>
                      <motion.button 
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleCopy}
                        className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-colors"
                      >
                        {isCopying ? (
                          <>
                            <Check size={11} className="text-emerald-400" />
                            <span className="text-emerald-400 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={11} />
                            <span>Copy</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                  <textarea
                    value={editableDraft}
                    onChange={(e) => setEditableDraft(e.target.value)}
                    rows={6}
                    className="w-full p-4 rounded-xl bg-slate-950/80 border border-slate-900 text-xs md:text-sm leading-relaxed text-slate-200 font-mono focus:border-indigo-500/40 outline-none resize-none transition-all"
                  />
                </div>
              )}

              {/* Spam Warning */}
              {email.importance === 'spam' && (
                <div className="mt-5 flex items-center gap-2.5 p-4 rounded-xl bg-red-950/15 border border-red-500/15 text-red-400/80 text-xs">
                  <ShieldAlert size={16} className="text-red-400 flex-shrink-0" />
                  <span>This email was classified as **Spam**. Custom draft replies are blocked for safety.</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
