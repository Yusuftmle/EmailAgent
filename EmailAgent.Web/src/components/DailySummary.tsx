import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmailAnalysis, apiService } from '../services/api';
import { EmailCard } from './EmailCard';
import { RefreshCcw, MailWarning, Settings, Inbox, AlertTriangle, ShieldCheck } from 'lucide-react';

interface DailySummaryProps {
  onGoToPreferences: () => void;
}

export const DailySummary: React.FC<DailySummaryProps> = ({ onGoToPreferences }) => {
  const [emails, setEmails] = useState<EmailAnalysis[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'important' | 'normal' | 'spam'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const fetchEmails = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getDailySummary();
      setEmails(data);
    } catch (error) {
      console.error('Error fetching email summaries', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncStatus("Querying Gmail inbox feed...");
    try {
      const response = await apiService.triggerJobNow();
      setSyncStatus(`Syncing. Job ${response.jobId} is processing background queues...`);
      
      setTimeout(async () => {
        await fetchEmails();
        setIsSyncing(false);
        setSyncStatus("Inbox synchronized successfully!");
        setTimeout(() => setSyncStatus(null), 3000);
      }, 2500);
    } catch (error) {
      console.error("Failed to run agent", error);
      setIsSyncing(false);
      setSyncStatus("Synchronization failed.");
      setTimeout(() => setSyncStatus(null), 3000);
    }
  };

  const handleUpdateEmail = (updated: EmailAnalysis) => {
    setEmails(prev => prev.map(e => e.id === updated.id ? updated : e));
  };

  // Grouped Counts
  const totalCount = emails.length;
  const importantCount = emails.filter(e => e.importance === 'important').length;
  const normalCount = emails.filter(e => e.importance === 'normal').length;
  const spamCount = emails.filter(e => e.importance === 'spam').length;

  const filteredEmails = emails.filter(e => {
    if (activeTab === 'all') return true;
    return e.importance === activeTab;
  });

  // Stagger variants for list animation
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeInOut" as any } }
  };

  return (
    <div className="px-1 py-4">
      {/* Top dashboard controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            AI Inbox <span className="gradient-text">Orchestrator</span>
          </h1>
          <p className="text-slate-400 mt-1 text-xs md:text-sm">
            Interactive cognitive inbox agent analyzing your latest emails.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onGoToPreferences}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-white/5 hover:bg-slate-850 hover:text-white transition-all text-xs font-semibold text-slate-300"
          >
            <Settings size={15} />
            <span>Preferences</span>
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-bg hover:opacity-90 active:scale-[0.98] transition-all text-xs font-bold text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            <RefreshCcw size={15} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Inbox'}</span>
          </motion.button>
        </div>
      </div>

      {/* Dynamic status alert */}
      <AnimatePresence>
        {syncStatus && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-3 text-center text-xs font-semibold rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400"
          >
            {syncStatus}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Statistics Panels */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel p-4 rounded-2xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Processed</span>
            <h3 className="text-2xl font-black mt-1 text-slate-200">{totalCount}</h3>
          </div>
          <Inbox className="text-slate-500" size={24} />
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-red-500/10 bg-red-950/5 flex items-center justify-between glow-hover transition-all duration-300">
          <div>
            <span className="text-[10px] text-red-400/80 uppercase tracking-widest font-semibold">Important</span>
            <h3 className="text-2xl font-black mt-1 text-red-400">{importantCount}</h3>
          </div>
          <AlertTriangle className="text-red-400/60 animate-pulse" size={24} />
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-indigo-500/10 bg-indigo-950/5 flex items-center justify-between glow-hover transition-all duration-300">
          <div>
            <span className="text-[10px] text-indigo-400/80 uppercase tracking-widest font-semibold">Normal</span>
            <h3 className="text-2xl font-black mt-1 text-indigo-400">{normalCount}</h3>
          </div>
          <ShieldCheck className="text-indigo-400/60" size={24} />
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-500/10 bg-slate-900/5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Junk/Spam</span>
            <h3 className="text-2xl font-black mt-1 text-slate-400">{spamCount}</h3>
          </div>
          <MailWarning className="text-slate-500/50" size={24} />
        </div>
      </div>

      {/* Tabs list with indicator */}
      <div className="flex border-b border-white/5 mb-6 overflow-x-auto">
        {(['all', 'important', 'normal', 'spam'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === tab 
                ? tab === 'important' ? 'border-red-500 text-red-400' :
                  tab === 'spam' ? 'border-slate-500 text-slate-400' :
                  'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'all' ? 'All Inbox' : tab} ({
              tab === 'all' ? totalCount :
              tab === 'important' ? importantCount :
              tab === 'normal' ? normalCount :
              spamCount
            })
          </button>
        ))}
      </div>

      {/* Staggered lists layout */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400 mt-4 font-semibold uppercase tracking-wider">Syncing with database core...</span>
        </div>
      ) : filteredEmails.length === 0 ? (
        <div className="glass-panel py-20 px-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center">
          <Inbox size={36} className="text-slate-600 mb-3" />
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Queue Clear</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
            There are no active records matching "{activeTab}" in today's mailbox list. Click "Sync Inbox" to check again.
          </p>
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-4"
        >
          {filteredEmails.map(email => (
            <motion.div key={email.id} variants={itemVariants}>
              <EmailCard email={email} onUpdate={handleUpdateEmail} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};
