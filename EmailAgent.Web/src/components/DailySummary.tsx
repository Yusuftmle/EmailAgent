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
          <h1 className="text-[24px] md:text-headline-lg font-semibold tracking-tight text-on-surface">
            Intelligence Nexus
          </h1>
          <p className="text-on-surface-variant mt-1 text-xs font-data-mono uppercase tracking-wider">
            SYSTEM // INBOX COGNITIVE AGENT // ANALYZING LATEST FEEDS
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onGoToPreferences}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container border border-outline-variant/30 hover:bg-surface-container-high hover:text-on-surface transition-all text-label-sm font-semibold text-on-surface-variant"
          >
            <Settings size={14} />
            <span>Preferences</span>
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary/10 border border-primary/30 hover:bg-primary hover:text-on-primary transition-all text-label-sm font-semibold text-primary disabled:opacity-50"
          >
            <RefreshCcw size={14} className={isSyncing ? 'animate-spin' : ''} />
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
            className="mb-6 p-3 text-center text-xs font-data-mono rounded-lg bg-primary/10 border border-primary/25 text-primary"
          >
            {syncStatus}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Statistics Panels */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel p-4 rounded-xl border border-outline-variant/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-on-surface-variant/75 uppercase tracking-widest font-semibold font-geist">Processed</span>
            <h3 className="text-2xl font-semibold font-data-mono mt-1 text-on-surface">{totalCount}</h3>
          </div>
          <Inbox className="text-on-surface-variant/40" size={20} />
        </div>

        <div className="glass-panel p-4 rounded-xl border border-tertiary-container/30 bg-tertiary-container/5 flex items-center justify-between transition-all duration-300">
          <div>
            <span className="text-[10px] text-tertiary uppercase tracking-widest font-semibold font-geist">Important</span>
            <h3 className="text-2xl font-semibold font-data-mono mt-1 text-tertiary-container">{importantCount}</h3>
          </div>
          <AlertTriangle className="text-tertiary-container/60 animate-pulse" size={20} />
        </div>

        <div className="glass-panel p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between transition-all duration-300">
          <div>
            <span className="text-[10px] text-primary uppercase tracking-widest font-semibold font-geist">Normal</span>
            <h3 className="text-2xl font-semibold font-data-mono mt-1 text-primary">{normalCount}</h3>
          </div>
          <ShieldCheck className="text-primary/60" size={20} />
        </div>

        <div className="glass-panel p-4 rounded-xl border border-outline-variant/35 bg-surface-container-low/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-on-surface-variant/60 uppercase tracking-widest font-semibold font-geist">Junk/Spam</span>
            <h3 className="text-2xl font-semibold font-data-mono mt-1 text-on-surface-variant/80">{spamCount}</h3>
          </div>
          <MailWarning className="text-on-surface-variant/40" size={20} />
        </div>
      </div>

      {/* Tabs list with indicator */}
      <div className="flex border-b border-outline-variant/20 mb-6 overflow-x-auto hide-scrollbar">
        {(['all', 'important', 'normal', 'spam'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 border-b-2 text-label-sm font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === tab 
                ? tab === 'important' ? 'border-tertiary text-tertiary-container' :
                  tab === 'spam' ? 'border-outline text-on-surface-variant' :
                  'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
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
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-panel p-5 rounded-xl border border-outline-variant/20 flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg shimmer-bg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/4 rounded shimmer-bg" />
                  <div className="h-3 w-1/2 rounded shimmer-bg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredEmails.length === 0 ? (
        <div className="glass-panel py-20 px-6 rounded-2xl border border-outline-variant/20 flex flex-col items-center justify-center text-center">
          <Inbox size={32} className="text-on-surface-variant/40 mb-3" />
          <h3 className="text-sm font-semibold text-on-surface uppercase tracking-wider">Queue Clear</h3>
          <p className="text-xs text-on-surface-variant mt-1 max-w-xs leading-relaxed">
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
