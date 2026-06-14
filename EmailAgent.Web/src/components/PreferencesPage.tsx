import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService, UserPreferences } from '../services/api';
import { ArrowLeft, Save, Key, Sparkles, Mail, Cpu, Eye, EyeOff, MessageCircle, Send, User, Bell, Clock, Sliders } from 'lucide-react';

interface PreferencesPageProps {
  onBackToDashboard: () => void;
}

export const PreferencesPage: React.FC<PreferencesPageProps> = ({ onBackToDashboard }) => {
  const [prefs, setPrefs] = useState<UserPreferences>({
    assistantPersona: 'You are a highly professional operations assistant.',
    userEmail: '',
    city: 'Istanbul',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    aiProvider: 'Claude',
    apiKey: '',
    whatsAppSid: '',
    whatsAppToken: '',
    whatsAppFrom: '',
    whatsAppTo: '',
    telegramBotToken: '',
    telegramChatId: '',
    pairingCode: '',
    shoppingTrackerIntervalHours: 12,
    enableEmailFeature: true,
    enableShoppingFeature: true,
    enableFinanceFeature: true,
    enableWebSearchFeature: true,
    enableDocumentAnalysisFeature: true,
    enableRemindersFeature: true,
    enableCalendarFeature: true
  });
  
  const [activeTab, setActiveTab] = useState<'profile' | 'ai' | 'personality' | 'capabilities' | 'notifications'>('profile');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const data = await apiService.getPreferences();
        if (!data.timezone) {
          data.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        }
        setPrefs(data);
      } catch (error) {
        console.error("Failed to load preferences", error);
      }
    };
    fetchPrefs();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMsg(null);
    try {
      await apiService.savePreferences(prefs);
      setStatusMsg({ type: 'success', text: 'Settings updated successfully!' });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (error) {
      console.error("Failed to save preferences", error);
      setStatusMsg({ type: 'error', text: 'Database sync error.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="px-1 py-4 flex flex-col gap-6 max-w-4xl mx-auto w-full font-geist">
      {/* Header Panel */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBackToDashboard}
            className="p-2.5 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <ArrowLeft size={16} />
          </motion.button>
          <div>
            <h1 className="text-xl md:text-headline-lg font-semibold tracking-tight text-on-surface">
              System Settings
            </h1>
            <p className="text-on-surface-variant mt-0.5 text-xs">
              Manage your profile, AI integrations, and automation preferences.
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-on-primary transition-all text-xs font-semibold disabled:opacity-50"
        >
          <Save size={14} />
          <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {statusMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3.5 rounded-lg border text-xs font-data-mono ${statusMsg.type === 'success'
                ? 'bg-secondary/10 border-secondary/25 text-secondary'
                : 'bg-tertiary/10 border-tertiary-container/25 text-tertiary-container'
              }`}
          >
            {statusMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-outline-variant/20 mb-2 px-2 overflow-x-auto hide-scrollbar">
        {[
          { id: 'profile', icon: User, label: 'Profile & Tracker' },
          { id: 'ai', icon: Cpu, label: 'AI Engine' },
          { id: 'personality', icon: Sliders, label: 'Personality' },
          { id: 'capabilities', icon: Sparkles, label: 'Capabilities' },
          { id: 'notifications', icon: Bell, label: 'Notifications' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-3 text-label-sm font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${isActive ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="min-h-[350px]">
        {/* Profile & Tracker Tab */}
        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass-panel p-6 rounded-xl border border-outline-variant/30 flex flex-col relative overflow-hidden">
              <div className="flex items-center gap-2.5 mb-2 border-b border-outline-variant/20 pb-3">
                <div className="p-2 rounded bg-primary/10 text-primary border border-primary/20">
                  <User size={14} />
                </div>
                <h2 className="text-xs font-semibold text-on-surface uppercase tracking-wider">Account Information</h2>
              </div>
              <div className="flex flex-col gap-4 max-w-md mt-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-on-surface-variant/70 uppercase tracking-widest font-data-mono">Gmail Account</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={prefs.userEmail || ''}
                      readOnly
                      placeholder="Not connected"
                      className="w-full px-4 py-2 pl-10 rounded-lg bg-surface-container-lowest/30 border border-outline-variant/20 text-xs text-on-surface-variant/80 cursor-not-allowed outline-none"
                    />
                    <Mail size={14} className="absolute left-3.5 top-3 text-on-surface-variant/50" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="text-[10px] font-semibold text-on-surface-variant/70 uppercase tracking-widest font-data-mono">City (For Weather)</label>
                  <input
                    type="text"
                    value={prefs.city || ''}
                    onChange={(e) => setPrefs(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="e.g. Istanbul, London"
                    className="w-full px-4 py-2 rounded-lg bg-surface-container-low/40 border border-outline-variant/30 text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="text-[10px] font-semibold text-on-surface-variant/70 uppercase tracking-widest font-data-mono">Timezone (Auto-detected)</label>
                  <input
                    type="text"
                    value={prefs.timezone || ''}
                    readOnly
                    className="w-full px-4 py-2 rounded-lg bg-surface-container-lowest/30 border border-outline-variant/20 text-xs text-secondary/80 cursor-not-allowed outline-none font-data-mono"
                  />
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-xl border border-outline-variant/30 flex flex-col relative overflow-hidden">
              <div className="flex items-center gap-2.5 mb-2 border-b border-outline-variant/20 pb-3">
                <div className="p-2 rounded bg-primary/10 text-primary border border-primary/20">
                  <Clock size={14} />
                </div>
                <h2 className="text-xs font-semibold text-on-surface uppercase tracking-wider">Tracker Automation</h2>
              </div>
              <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
                Choose how often the AI should scan your tracked categories for deals.
              </p>

              <div className="flex flex-col gap-1.5 max-w-md">
                <label className="text-[10px] font-semibold text-on-surface-variant/70 uppercase tracking-widest font-data-mono">Scan Interval</label>
                <div className="relative">
                  <select
                    value={prefs.shoppingTrackerIntervalHours || 12}
                    onChange={(e) => setPrefs(prev => ({ ...prev, shoppingTrackerIntervalHours: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 pl-10 rounded-lg bg-surface-container-low/40 border border-outline-variant/30 text-xs focus:border-primary outline-none text-on-surface cursor-pointer appearance-none transition-all"
                  >
                    <option value={1}>Every 1 Hour (Aggressive)</option>
                    <option value={6}>Every 6 Hours</option>
                    <option value={12}>Every 12 Hours (Default)</option>
                    <option value={24}>Every 24 Hours (Relaxed)</option>
                  </select>
                  <Clock size={14} className="absolute left-3.5 top-3.5 text-on-surface-variant/50 pointer-events-none" />
                  <div className="absolute right-3.5 top-3 text-on-surface-variant/60 pointer-events-none flex items-center">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* AI Engine Tab */}
        {activeTab === 'ai' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass-panel p-6 rounded-xl border border-outline-variant/30 flex flex-col relative overflow-hidden">
              <div className="flex items-center gap-2.5 mb-2 border-b border-outline-variant/20 pb-3">
                <div className="p-2 rounded bg-primary/10 text-primary border border-primary/20">
                  <Sparkles size={14} />
                </div>
                <h2 className="text-xs font-semibold text-on-surface uppercase tracking-wider">AI Configuration</h2>
              </div>
              <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
                Select your preferred AI brain and provide the necessary API keys.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-on-surface-variant/70 uppercase tracking-widest font-data-mono">Cognitive Provider</label>
                  <select
                    value={prefs.aiProvider || 'Claude'}
                    onChange={(e) => setPrefs(prev => ({ ...prev, aiProvider: e.target.value as UserPreferences['aiProvider'] }))}
                    className="w-full px-4 py-2 rounded-lg bg-surface-container-low/40 border border-outline-variant/30 text-xs focus:border-primary outline-none text-on-surface cursor-pointer transition-all"
                  >
                    <option value="Claude">Anthropic Claude (Sonnet 3.5)</option>
                    <option value="Gemini">Google Gemini (1.5 Pro/Flash)</option>
                    <option value="Groq">Groq (Llama 3.3)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-on-surface-variant/70 uppercase tracking-widest font-data-mono">API Secret Key</label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={prefs.apiKey || ''}
                      onChange={(e) => setPrefs(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="Enter API Key..."
                      className="w-full px-4 py-2 pl-10 pr-10 rounded-lg bg-surface-container-low/40 border border-outline-variant/30 text-xs focus:border-primary outline-none text-on-surface font-mono transition-all"
                    />
                    <Key size={14} className="absolute left-3.5 top-3 text-on-surface-variant/50" />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3.5 top-2.5 text-on-surface-variant/60 hover:text-on-surface"
                    >
                      {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Personality Tab */}
        {activeTab === 'personality' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
            <div className="glass-panel p-6 rounded-xl border border-outline-variant/30 flex flex-col min-h-[350px]">
              <div className="flex items-center gap-2.5 mb-2 border-b border-outline-variant/20 pb-3">
                <div className="p-2 rounded bg-primary/10 text-primary border border-primary/20">
                  <Sliders size={14} />
                </div>
                <h2 className="text-xs font-semibold text-on-surface uppercase tracking-wider">Assistant Persona</h2>
              </div>
              <p className="text-xs text-on-surface-variant mt-2 mb-4">
                Describe the personality, tone, and behavior. The cognitive engine will follow these directives in all chats and inbox summaries.
              </p>
              <textarea
                value={prefs.assistantPersona || ''}
                onChange={(e) => setPrefs(prev => ({ ...prev, assistantPersona: e.target.value }))}
                placeholder="Directives..."
                className="flex-1 w-full p-4 rounded-lg bg-surface-container-low/40 border border-outline-variant/30 focus:border-primary outline-none text-xs md:text-sm text-on-surface resize-none min-h-[200px] leading-relaxed font-geist"
              />
            </div>
          </motion.div>
        )}

        {/* Capabilities Tab */}
        {activeTab === 'capabilities' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass-panel p-6 rounded-xl border border-outline-variant/30 flex flex-col relative overflow-hidden">
              <div className="flex items-center gap-2.5 mb-2 border-b border-outline-variant/20 pb-3">
                <div className="p-2 rounded bg-primary/10 text-primary border border-primary/20">
                  <Sparkles size={14} />
                </div>
                <h2 className="text-xs font-semibold text-on-surface uppercase tracking-wider">Active Bot Capabilities</h2>
              </div>
              <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
                Toggle the features you want Aegis to have access to. Disabling a capability restricts the agent's operations in that node.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'enableEmailFeature', label: 'Email Integration', desc: 'Read, parse, and send emails via Gmail API.' },
                  { id: 'enableShoppingFeature', label: 'Shopping & Tracking', desc: 'Monitor prices, compare products, and track discounts.' },
                  { id: 'enableFinanceFeature', label: 'Finance & Crypto', desc: 'Fetch real-time cryptocurrency and stock prices.' },
                  { id: 'enableWebSearchFeature', label: 'Web Search', desc: 'Search the internet and read web pages for live data.' },
                  { id: 'enableDocumentAnalysisFeature', label: 'Document Analysis', desc: 'Read and analyze uploaded PDFs and documents.' },
                  { id: 'enableRemindersFeature', label: 'Reminders & Alerts', desc: 'Set time-based reminders and notifications.' },
                  { id: 'enableCalendarFeature', label: 'Calendar & Agenda', desc: 'Sync events with Google Calendar and schedule meetings.' },
                ].map((feature) => (
                  <div key={feature.id} className="flex items-center justify-between p-4 bg-surface-container-low/30 border border-outline-variant/20 rounded-xl hover:border-primary/20 transition-colors">
                    <div>
                      <h4 className="text-xs md:text-sm font-semibold text-on-surface">{feature.label}</h4>
                      <p className="text-[10px] text-on-surface-variant mt-1">{feature.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={prefs[feature.id as keyof UserPreferences] as boolean ?? true}
                        onChange={(e) => setPrefs(prev => ({ ...prev, [feature.id]: e.target.checked }))}
                      />
                      <div className="w-9 h-5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline-variant after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass-panel p-6 rounded-xl border border-outline-variant/30 flex flex-col relative overflow-hidden">
              <div className="flex items-center gap-2.5 mb-2 border-b border-outline-variant/20 pb-3">
                <div className="p-2 rounded bg-primary/10 text-primary border border-primary/20">
                  <Send size={14} />
                </div>
                <h2 className="text-xs font-semibold text-on-surface uppercase tracking-wider">Telegram Notification Bot</h2>
              </div>
              <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
                Interact with your AI Assistant directly from Telegram. Use the pairing code to link your account.
              </p>
              <div className="bg-surface-container-low/40 p-4 rounded-xl border border-outline-variant/20 space-y-4 max-w-xl">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                  <div>
                    <h4 className="font-semibold text-on-surface text-xs md:text-sm">Telegram Bot Integration</h4>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">Connect to @AegisAssistanttBot</p>
                  </div>
                  <div className={`text-[9px] font-semibold font-data-mono px-2 py-0.5 rounded border ${prefs.telegramChatId ? 'bg-secondary/15 text-secondary border-secondary/20' : 'bg-primary/10 text-primary border-primary/20 animate-pulse'}`}>
                    {prefs.telegramChatId ? 'PAIRED' : 'NOT PAIRED'}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-on-surface-variant/75 uppercase tracking-wider font-data-mono">Pairing Verification Code</label>
                  <div className="flex gap-2 mt-2">
                    <div className="flex-1 bg-surface-container-lowest/50 border border-outline-variant/30 rounded-lg px-3 py-2 text-xs font-mono text-primary select-all overflow-hidden text-ellipsis">
                      {prefs.pairingCode || 'Loading...'}
                    </div>
                  </div>
                  <a href={`https://t.me/AegisAssistanttBot?start=${prefs.pairingCode}`} target="_blank" rel="noreferrer" className="inline-flex mt-4 items-center gap-2 px-5 py-2.5 bg-primary/10 border border-primary/30 text-primary text-xs font-semibold rounded-lg hover:bg-primary hover:text-on-primary transition-all cursor-pointer">
                    Connect via Deep Link
                  </a>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-xl border border-outline-variant/30 flex flex-col relative overflow-hidden">
              <div className="flex items-center gap-2.5 mb-2 border-b border-outline-variant/20 pb-3">
                <div className="p-2 rounded bg-primary/10 text-primary border border-primary/20">
                  <MessageCircle size={14} />
                </div>
                <h2 className="text-xs font-semibold text-on-surface uppercase tracking-wider">WhatsApp Notifications</h2>
              </div>
              <div className="flex flex-col gap-1.5 max-w-md mt-4">
                <label className="text-[10px] font-semibold text-on-surface-variant/70 uppercase tracking-widest font-data-mono">Your WhatsApp Number</label>
                <input
                  type="text"
                  value={prefs.whatsAppTo || ''}
                  onChange={(e) => setPrefs(prev => ({ ...prev, whatsAppTo: e.target.value }))}
                  placeholder="whatsapp:+90532XXXXXXX"
                  className="w-full px-4 py-2 rounded-lg bg-surface-container-low/40 border border-outline-variant/30 text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
