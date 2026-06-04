import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService, UserPreferences } from '../services/api';
import { ArrowLeft, Save, Key, Sparkles, Mail, Cpu, Eye, EyeOff, MessageCircle, Send, User, Bell, Clock, Sliders } from 'lucide-react';

interface PreferencesPageProps {
  onBackToDashboard: () => void;
}

export const PreferencesPage: React.FC<PreferencesPageProps> = ({ onBackToDashboard }) => {
  const [prefs, setPrefs] = useState<UserPreferences>({
    assistantPersona: 'Sen enerjik, samimi ve motive edici bir yapay zeka asistanısın.',
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
        // Fallback to browser timezone if not set in DB
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
    <div className="px-1 py-4 flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* Header Panel */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBackToDashboard}
            className="p-2.5 rounded-xl bg-slate-900 border border-white/5 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </motion.button>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
              System <span className="gradient-text">Settings</span>
            </h1>
            <p className="text-slate-400 mt-0.5 text-xs md:text-sm">
              Manage your profile, AI integrations, and automation preferences.
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-bg text-xs md:text-sm font-bold text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50"
        >
          <Save size={15} />
          <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {statusMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl border text-xs font-semibold ${statusMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}
          >
            {statusMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-white/10 mb-2 px-2 overflow-x-auto hide-scrollbar">
        {[
          { id: 'profile', icon: User, label: 'Profile & Tracker' },
          { id: 'ai', icon: Cpu, label: 'AI Engine' },
          { id: 'personality', icon: Sliders, label: 'Personality' },
          { id: 'capabilities', icon: Sparkles, label: 'Bot Capabilities' },
          { id: 'notifications', icon: Bell, label: 'Notifications' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-3 text-sm font-bold transition-all whitespace-nowrap ${isActive ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="min-h-[400px]">
        {/* Profile & Tracker Tab */}
        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-800/0 via-indigo-500/5 to-slate-800/0 pointer-events-none" />
              <div className="flex items-center gap-2.5 mb-2 border-b border-white/5 pb-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/15">
                  <User size={16} />
                </div>
                <h2 className="text-base font-bold text-slate-200 uppercase tracking-wider">Account Information</h2>
              </div>
              <div className="flex flex-col gap-4 max-w-md mt-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gmail Account</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={prefs.userEmail || ''}
                      readOnly
                      placeholder="Not connected"
                      className="w-full px-4 py-2.5 pl-10 rounded-xl bg-slate-950/60 border border-slate-900 text-xs focus:border-indigo-500/40 outline-none text-slate-200 opacity-80 cursor-not-allowed"
                    />
                    <Mail size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">City (For Weather)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={prefs.city || ''}
                      onChange={(e) => setPrefs(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="e.g. Adana, Istanbul, New York"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-900 text-xs focus:border-indigo-500/40 outline-none text-slate-200 transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Timezone (Auto-detected)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={prefs.timezone || ''}
                      readOnly
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-900 text-xs text-emerald-400 opacity-90 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/0 via-orange-500/2 to-red-500/0 pointer-events-none" />
              <div className="flex items-center gap-2.5 mb-2 border-b border-white/5 pb-3">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/15">
                  <Clock size={16} />
                </div>
                <h2 className="text-base font-bold text-slate-200 uppercase tracking-wider">Shopping Tracker Automation</h2>
              </div>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Choose how often the AI should scan your tracked categories for deals.
              </p>

              <div className="flex flex-col gap-2 max-w-md">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Scan Interval (Hours)</label>
                <div className="relative">
                  <select
                    value={prefs.shoppingTrackerIntervalHours || 12}
                    onChange={(e) => setPrefs(prev => ({ ...prev, shoppingTrackerIntervalHours: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2.5 pl-10 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:border-orange-500/40 outline-none text-slate-200 cursor-pointer appearance-none transition-all"
                  >
                    <option value={1}>Every 1 Hour (Aggressive)</option>
                    <option value={6}>Every 6 Hours</option>
                    <option value={12}>Every 12 Hours (Default)</option>
                    <option value={24}>Every 24 Hours (Relaxed)</option>
                  </select>
                  <Clock size={14} className="absolute left-3.5 top-3.5 text-slate-500 pointer-events-none" />
                  <div className="absolute right-3.5 top-3.5 text-slate-500 pointer-events-none flex items-center">
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
            <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/0 via-purple-500/2 to-cyan-500/0 pointer-events-none" />
              <div className="flex items-center gap-2.5 mb-2 border-b border-white/5 pb-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/15">
                  <Sparkles size={16} />
                </div>
                <h2 className="text-base font-bold text-slate-200 uppercase tracking-wider">AI Provider Configuration</h2>
              </div>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Select your preferred AI brain and provide the necessary API keys.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cognitive Provider</label>
                  <div className="relative">
                    <select
                      value={prefs.aiProvider || 'Claude'}
                      onChange={(e) => setPrefs(prev => ({ ...prev, aiProvider: e.target.value as UserPreferences['aiProvider'] }))}
                      className="w-full px-4 py-2.5 pl-10 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:border-purple-500/40 outline-none text-slate-200 cursor-pointer appearance-none transition-all"
                    >
                      <option value="Claude">Anthropic Claude (Sonnet 4.5 / 3.5)</option>
                      <option value="Gemini">Google Gemini (2.5 Flash / Pro)</option>
                      <option value="OpenAI">OpenAI (GPT-4o / 4o-mini)</option>
                      <option value="Groq">Groq (Llama 3.3 / 3.1)</option>
                    </select>
                    <Cpu size={14} className="absolute left-3.5 top-3.5 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">API Secret Key</label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={prefs.apiKey || ''}
                      onChange={(e) => setPrefs(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="Enter API Secret Key..."
                      className="w-full px-4 py-2.5 pl-10 pr-10 rounded-xl bg-slate-950/60 border border-slate-900 text-xs focus:border-purple-500/40 outline-none text-slate-200 font-mono transition-all"
                    />
                    <Key size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
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
            <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col min-h-[350px]">
              <div className="flex items-center gap-2.5 mb-2 border-b border-white/5 pb-3">
                <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/15">
                  <User size={16} />
                </div>
                <h2 className="text-base font-bold text-slate-200 uppercase tracking-wider">Assistant Persona</h2>
              </div>
              <p className="text-xs text-slate-400 mt-2 mb-4">
                Tell your AI assistant how to act. Describe its personality, tone, and behavior. The assistant will strictly follow these instructions in all chats and reports.
              </p>
              <textarea
                value={prefs.assistantPersona || ''}
                onChange={(e) => setPrefs(prev => ({ ...prev, assistantPersona: e.target.value }))}
                placeholder="e.g. You are a highly professional and strict corporate assistant. Always use formal language."
                className="flex-1 w-full p-4 rounded-xl bg-slate-950/60 border border-slate-900 focus:border-pink-500/40 outline-none text-sm text-slate-200 resize-none min-h-[250px] leading-relaxed"
              />
            </div>
          </motion.div>
        )}

        {/* Capabilities Tab */}
        {activeTab === 'capabilities' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/0 via-emerald-500/2 to-teal-500/0 pointer-events-none" />
              <div className="flex items-center gap-2.5 mb-2 border-b border-white/5 pb-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                  <Sparkles size={16} />
                </div>
                <h2 className="text-base font-bold text-slate-200 uppercase tracking-wider">Active Bot Capabilities</h2>
              </div>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Toggle the features you want Omni Agent to have access to. Disabling a feature removes the AI's ability to perform tasks related to it.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'enableEmailFeature', label: 'Email Integration', desc: 'Read, parse, and send emails via Gmail API.' },
                  { id: 'enableShoppingFeature', label: 'Shopping & Tracking', desc: 'Monitor prices, compare products, and track discounts.' },
                  { id: 'enableFinanceFeature', label: 'Finance & Crypto', desc: 'Fetch real-time cryptocurrency and stock prices.' },
                  { id: 'enableWebSearchFeature', label: 'Web Search', desc: 'Search the internet and read web pages for live data.' },
                  { id: 'enableDocumentAnalysisFeature', label: 'Document Analysis', desc: 'Read and analyze uploaded PDFs and documents.' },
                  { id: 'enableRemindersFeature', label: 'Reminders', desc: 'Set time-based reminders and alerts.' },
                  { id: 'enableCalendarFeature', label: 'Calendar & Agenda', desc: 'Sync events with Google Calendar and schedule meetings.' },
                ].map((feature) => (
                  <div key={feature.id} className="flex items-center justify-between p-4 bg-slate-900/50 border border-white/5 rounded-2xl hover:border-emerald-500/20 transition-colors">
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">{feature.label}</h4>
                      <p className="text-[10px] text-slate-400 mt-1">{feature.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={prefs[feature.id as keyof UserPreferences] as boolean ?? true}
                        onChange={(e) => setPrefs(prev => ({ ...prev, [feature.id]: e.target.checked }))}
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
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
            <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/0 via-sky-500/2 to-blue-500/0 pointer-events-none" />
              <div className="flex items-center gap-2.5 mb-2 border-b border-white/5 pb-3">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/15">
                  <Send size={16} />
                </div>
                <h2 className="text-base font-bold text-slate-200 uppercase tracking-wider">Telegram AI Assistant</h2>
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Interact with your AI Assistant directly from Telegram. Use the pairing code to link your account.
              </p>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 space-y-4 max-w-xl">
                <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-200 text-sm">Telegram Bot Integration</h4>
                    <p className="text-xs text-slate-400">Connect to @AegisAssistanttBot</p>
                  </div>
                  <div className={`text-[10px] font-bold px-2 py-1 rounded-full border ${prefs.telegramChatId ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                    {prefs.telegramChatId ? 'PAIRED' : 'NOT PAIRED'}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Your Pairing Code</label>
                  <div className="flex gap-2 mt-2">
                    <div className="flex-1 bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm font-mono text-cyan-400 select-all overflow-hidden text-ellipsis">
                      {prefs.pairingCode || 'Loading...'}
                    </div>
                  </div>
                  <a href={`https://t.me/AegisAssistanttBot?start=${prefs.pairingCode}`} target="_blank" rel="noreferrer" className="inline-flex mt-4 items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0088cc] to-[#0077b5] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#0088cc]/30 transition-all cursor-pointer">
                    Connect via Deep Link
                  </a>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-green-500/0 via-green-500/2 to-emerald-500/0 pointer-events-none" />
              <div className="flex items-center gap-2.5 mb-2 border-b border-white/5 pb-3">
                <div className="p-2 rounded-xl bg-green-500/10 text-green-400 border border-green-500/15">
                  <MessageCircle size={16} />
                </div>
                <h2 className="text-base font-bold text-slate-200 uppercase tracking-wider">WhatsApp Notifications</h2>
              </div>
              <div className="flex flex-col gap-2 max-w-md mt-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Your WhatsApp Number</label>
                <input
                  type="text"
                  value={prefs.whatsAppTo || ''}
                  onChange={(e) => setPrefs(prev => ({ ...prev, whatsAppTo: e.target.value }))}
                  placeholder="whatsapp:+90532XXXXXXX"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-900 text-xs focus:border-green-500/40 outline-none text-slate-200 transition-all"
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
