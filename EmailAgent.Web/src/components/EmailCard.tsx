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
        return 'bg-tertiary/10 border-tertiary-container/30 text-tertiary-container';
      case 'spam':
        return 'bg-outline-variant/10 border-outline-variant/20 text-on-surface-variant/70';
      default:
        return 'bg-primary/10 border-primary/25 text-primary';
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
      className={`glass-panel glass-panel-hover rounded-xl overflow-hidden ${
        email.importance === 'important' ? 'border-tertiary-container/30 shadow-md shadow-tertiary-container/5' : 'border-outline-variant/20'
      }`}
    >
      {/* Header clickable section */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-5 flex items-center justify-between cursor-pointer select-none bg-surface-container-low/30 hover:bg-surface-container-low/50 transition-colors"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <motion.div 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`p-3 rounded-lg ${
              email.importance === 'important' 
                ? 'bg-tertiary/10 text-tertiary-container border border-tertiary-container/20' 
                : email.importance === 'spam' 
                ? 'bg-outline-variant/10 text-on-surface-variant/70 border border-outline-variant/15' 
                : 'bg-primary/10 text-primary border border-primary/20'
            }`}
          >
            <Mail size={18} />
          </motion.div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${getBadgeColor()}`}>
                {email.importance}
              </span>
              <span className="text-[10px] text-on-surface-variant/60 font-data-mono">
                {new Date(email.processedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            
            <h3 className="font-bold text-on-surface truncate text-sm md:text-base tracking-wide">
              {email.subject}
            </h3>
            <p className="text-xs text-on-surface-variant truncate">
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
              className="p-2 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50"
              title="Regenerate AI Draft"
            >
              <RefreshCw size={14} className={isRegenerating ? 'animate-spin' : ''} />
            </motion.button>
          )}
          <div className="text-on-surface-variant p-1">
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
            <div className="px-5 pb-5 border-t border-outline-variant/20 bg-surface-container-low/20">
              
              {/* Executive Summary */}
              <div className="mt-5">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-1.5">
                  <BadgeInfo size={13} /> AI Executive Summary
                </h4>
                <div className="p-4 rounded-lg bg-surface-container-high/40 border border-outline-variant/20 text-xs md:text-sm leading-relaxed text-on-surface/90 italic font-geist">
                  {email.summary}
                </div>
              </div>

              {/* Draft Reply (Non-Spam) */}
              {email.importance !== 'spam' && (
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                      <MessageSquare size={13} /> AI Draft Reply
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-on-surface-variant/60 font-data-mono italic">Editable</span>
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCopy}
                        className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/30 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
                      >
                        {isCopying ? (
                          <>
                            <Check size={11} className="text-secondary" />
                            <span className="text-secondary font-semibold">Copied!</span>
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
                    className="w-full p-4 rounded-lg bg-surface-container-high/60 border border-outline-variant/30 text-xs md:text-sm leading-relaxed text-on-surface font-mono focus:border-primary/55 outline-none resize-none transition-all"
                  />
                </div>
              )}

              {/* Spam Warning */}
              {email.importance === 'spam' && (
                <div className="mt-5 flex items-center gap-2.5 p-4 rounded-lg bg-tertiary/5 border border-tertiary-container/20 text-tertiary-container text-xs">
                  <ShieldAlert size={16} className="text-tertiary-container flex-shrink-0" />
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
