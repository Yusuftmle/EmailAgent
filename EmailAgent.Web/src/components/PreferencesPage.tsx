import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService, UserPreferences } from '../services/api';
import { ArrowLeft, Save, Plus, X, Building, Key, Sparkles, Mail, Cpu, Eye, EyeOff, MessageCircle, Send } from 'lucide-react';

interface PreferencesPageProps {
  onBackToDashboard: () => void;
}

export const PreferencesPage: React.FC<PreferencesPageProps> = ({ onBackToDashboard }) => {
  const [prefs, setPrefs] = useState<UserPreferences>({ 
    focusCompanies: [], 
    keywords: [], 
    userEmail: '', 
    aiProvider: 'Claude', 
    apiKey: '',
    whatsAppSid: '',
    whatsAppToken: '',
    whatsAppFrom: '',
    whatsAppTo: '',
    telegramBotToken: '',
    telegramChatId: ''
  });
  const [companyInput, setCompanyInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const data = await apiService.getPreferences();
        setPrefs(data);
      } catch (error) {
        console.error("Failed to load preferences", error);
      }
    };
    fetchPrefs();
  }, []);

  const handleAddCompany = () => {
    const trimmed = companyInput.trim();
    if (trimmed && !prefs.focusCompanies.includes(trimmed)) {
      setPrefs(prev => ({
        ...prev,
        focusCompanies: [...prev.focusCompanies, trimmed]
      }));
      setCompanyInput('');
    }
  };

  const handleRemoveCompany = (company: string) => {
    setPrefs(prev => ({
      ...prev,
      focusCompanies: prev.focusCompanies.filter(c => c !== company)
    }));
  };

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !prefs.keywords.includes(trimmed)) {
      setPrefs(prev => ({
        ...prev,
        keywords: [...prev.keywords, trimmed]
      }));
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setPrefs(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMsg(null);
    try {
      await apiService.savePreferences(prefs);
      setStatusMsg({ type: 'success', text: 'Cognitive filters & AI engine config updated successfully!' });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (error) {
      console.error("Failed to save preferences", error);
      setStatusMsg({ type: 'error', text: 'Database sync error.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="px-1 py-4 flex flex-col gap-6">
      
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
              Cognitive <span className="gradient-text">Preferences</span>
            </h1>
            <p className="text-slate-400 mt-0.5 text-xs md:text-sm">
              Define focus targets and configure your customized AI Engine credentials and model selection.
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
          <span>{isSaving ? 'Syncing...' : 'Save Filters'}</span>
        </motion.button>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {statusMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl border text-xs font-semibold ${
              statusMsg.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            {statusMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. NEW FULL-WIDTH CARD: Holographic AI Engine Credentials Card */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/0 via-purple-500/2 to-cyan-500/0 pointer-events-none" />
        <div className="flex items-center gap-2.5 mb-2 border-b border-white/5 pb-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/15">
            <Sparkles size={16} />
          </div>
          <h2 className="text-base font-bold text-slate-200 uppercase tracking-wider">AI Engine & Gmail Credentials</h2>
        </div>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Configure your targeted Gmail address and select your desired AI Provider. If an API Key is specified here, the backend will dynamically override system defaults and route all Semantic Kernel tasks directly to your chosen provider!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gmail Account</label>
            <div className="relative">
              <input
                type="email"
                value={prefs.userEmail || ''}
                readOnly
                placeholder="Not connected"
                className="w-full px-4 py-2.5 pl-10 rounded-xl bg-slate-950/60 border border-slate-900 text-xs focus:border-indigo-500/40 outline-none text-slate-200 placeholder-slate-600 transition-all opacity-80 cursor-not-allowed"
              />
              <Mail size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
            </div>
            <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1"><Sparkles size={10} /> Connected via OAuth</p>
          </div>

          {/* AI Provider Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cognitive Provider</label>
            <div className="relative">
              <select
                value={prefs.aiProvider || 'Claude'}
                onChange={(e) => setPrefs(prev => ({ ...prev, aiProvider: e.target.value }))}
                className="w-full px-4 py-2.5 pl-10 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:border-indigo-500/40 outline-none text-slate-200 cursor-pointer appearance-none transition-all"
              >
                <option value="Claude">Anthropic Claude (Sonnet 4.5 / 3.5)</option>
                <option value="Gemini">Google Gemini (2.5 Flash / Pro)</option>
                <option value="OpenAI">OpenAI (GPT-4o / 4o-mini)</option>
                <option value="Groq">Groq (Llama 3.3 / 3.1)</option>
                <option value="OpenRouter">OpenRouter Free (Qwen 2.5 / Llama 3.1)</option>
              </select>
              <Cpu size={14} className="absolute left-3.5 top-3.5 text-slate-500 pointer-events-none" />
              <div className="absolute right-3.5 top-3.5 text-slate-500 pointer-events-none flex items-center">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
              </div>
            </div>
          </div>

          {/* Custom API Key input */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active API Secret Key</label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={prefs.apiKey || ''}
                onChange={(e) => setPrefs(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder={prefs.apiKey ? '••••••••••••••••••••' : 'Enter API Secret Key...'}
                className="w-full px-4 py-2.5 pl-10 pr-10 rounded-xl bg-slate-950/60 border border-slate-900 text-xs focus:border-indigo-500/40 outline-none text-slate-200 font-mono transition-all"
              />
              <Key size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                title="Toggle Visibility"
              >
                {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Double Column Keywords & Focus Companies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Focus Companies */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col min-h-[350px]">
          <div className="flex items-center gap-2.5 mb-2 border-b border-white/5 pb-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/15">
              <Building size={16} />
            </div>
            <h2 className="text-base font-bold text-slate-200 uppercase tracking-wider">Focus Companies</h2>
          </div>

          <div className="flex gap-2 mb-6 mt-3">
            <input
              type="text"
              value={companyInput}
              onChange={(e) => setCompanyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCompany()}
              placeholder="e.g. Microsoft, Google..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-900 text-xs focus:border-indigo-500/40 outline-none text-slate-200 placeholder-slate-600 transition-all"
            />
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddCompany}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors shadow-md shadow-indigo-500/10"
            >
              <Plus size={18} />
            </motion.button>
          </div>

          <div className="flex-1 flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Matching Companies</span>
            <div className="flex flex-wrap gap-2 overflow-y-auto max-h-[160px] pr-1">
              <AnimatePresence>
                {prefs.focusCompanies.map(company => (
                  <motion.span 
                    key={company}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300"
                  >
                    <span>{company}</span>
                    <button 
                      onClick={() => handleRemoveCompany(company)}
                      className="p-0.5 rounded-full hover:bg-indigo-500/25 text-indigo-400 hover:text-white transition-all"
                    >
                      <X size={11} />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
              {prefs.focusCompanies.length === 0 && (
                <span className="text-xs text-slate-600 italic">No companies listed.</span>
              )}
            </div>
          </div>
        </div>

        {/* Focus Keywords */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col min-h-[350px]">
          <div className="flex items-center gap-2.5 mb-2 border-b border-white/5 pb-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/15">
              <Key size={16} />
            </div>
            <h2 className="text-base font-bold text-slate-200 uppercase tracking-wider">Focus Keywords</h2>
          </div>

          <div className="flex gap-2 mb-6 mt-3">
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
              placeholder="e.g. alignment, alert..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-900 text-xs focus:border-cyan-500/40 outline-none text-slate-200 placeholder-slate-600 transition-all"
            />
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddKeyword}
              className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center transition-colors shadow-md shadow-cyan-500/10"
            >
              <Plus size={18} />
            </motion.button>
          </div>

          <div className="flex-1 flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Matching Terms</span>
            <div className="flex flex-wrap gap-2 overflow-y-auto max-h-[160px] pr-1">
              <AnimatePresence>
                {prefs.keywords.map(keyword => (
                  <motion.span 
                    key={keyword}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-xs font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-300"
                  >
                    <span>{keyword}</span>
                    <button 
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="p-0.5 rounded-full hover:bg-cyan-500/25 text-cyan-400 hover:text-white transition-all"
                    >
                      <X size={11} />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
              {prefs.keywords.length === 0 && (
                <span className="text-xs text-slate-600 italic">No keywords listed.</span>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 3. NEW FULL-WIDTH CARD: WhatsApp Notifications Setup */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-green-500/0 via-green-500/2 to-emerald-500/0 pointer-events-none" />
        <div className="flex items-center gap-2.5 mb-2 border-b border-white/5 pb-3">
          <div className="p-2 rounded-xl bg-green-500/10 text-green-400 border border-green-500/15">
            <MessageCircle size={16} />
          </div>
          <h2 className="text-base font-bold text-slate-200 uppercase tracking-wider">WhatsApp Notifications</h2>
        </div>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Enable instant WhatsApp alerts for important emails. Just enter your phone number below. (System uses our centralized Twilio service).
        </p>

        <div className="grid grid-cols-1 gap-6">
          {/* WhatsApp To */}
          <div className="flex flex-col gap-2 max-w-md">
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
      </div>
      {/* 4. NEW FULL-WIDTH CARD: Telegram Assistant Setup */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col relative overflow-hidden mt-6">
        <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/0 via-sky-500/2 to-blue-500/0 pointer-events-none" />
        <div className="flex items-center gap-2.5 mb-2 border-b border-white/5 pb-3">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/15">
            <Send size={16} />
          </div>
          <h2 className="text-base font-bold text-slate-200 uppercase tracking-wider">Telegram AI Assistant</h2>
        </div>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Interact with your AI Assistant directly from Telegram. Use the pairing code below to link your account.
        </p>

        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 space-y-4">
          <div className="flex items-center gap-3 border-b border-white/5 pb-3">
            <div className="w-8 h-8 rounded-lg bg-[#0088cc]/20 flex items-center justify-center text-[#0088cc]">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.11.03-1.84 1.18-5.2 3.45-.49.34-.93.5-1.33.49-.44-.01-1.28-.25-1.91-.45-.77-.25-1.38-.38-1.33-.8.03-.22.34-.44.93-.66 3.64-1.58 6.06-2.63 7.27-3.13 3.45-1.43 4.17-1.68 4.64-1.69.1 0 .33.02.46.12.11.08.14.19.15.28-.01.07-.01.16-.02.25z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-200">Telegram Bot Integration</h4>
              <p className="text-xs text-slate-400">Connect to the central @OmniAgentBot</p>
            </div>
            <div className={`text-[10px] font-bold px-2 py-1 rounded-full border ${prefs.telegramChatId ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
              {prefs.telegramChatId ? 'PAIRED' : 'NOT PAIRED'}
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <label className="text-xs font-semibold text-slate-300">Your Unique Pairing Code</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm font-mono text-cyan-400 select-all overflow-hidden text-ellipsis whitespace-nowrap">
                {prefs.pairingCode || 'Loading...'}
              </div>
              <button 
                onClick={() => {
                  if (prefs.pairingCode) {
                    navigator.clipboard.writeText(prefs.pairingCode);
                    alert("Pairing code copied to clipboard!");
                  }
                }}
                className="px-3 py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 transition-colors border border-indigo-500/20"
              >
                Copy
              </button>
            </div>
            
            <div className="flex items-center gap-3 mt-4">
              <a 
                href={`https://t.me/AegisAssistanttBot?start=${prefs.pairingCode}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0088cc] to-[#0077b5] hover:scale-105 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-[#0088cc]/30 transition-all cursor-pointer"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.11.03-1.84 1.18-5.2 3.45-.49.34-.93.5-1.33.49-.44-.01-1.28-.25-1.91-.45-.77-.25-1.38-.38-1.33-.8.03-.22.34-.44.93-.66 3.64-1.58 6.06-2.63 7.27-3.13 3.45-1.43 4.17-1.68 4.64-1.69.1 0 .33.02.46.12.11.08.14.19.15.28-.01.07-.01.16-.02.25z" />
                </svg>
                Telefonda Tek Tıkla Bağla (Deep Link)
              </a>
              <p className="text-[10px] text-slate-500 leading-relaxed flex-1">
                Tıkladığınız an Telegram açılır ve kodunuz otomatik olarak sisteme gönderilir. (Copy-paste yapmanıza gerek yok!)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
