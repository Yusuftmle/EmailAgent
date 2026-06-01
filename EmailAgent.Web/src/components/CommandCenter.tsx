import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Mail, MessageSquare, Send, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import { apiService, UserPreferences } from '../services/api';

interface CommandCenterProps {
  onNavigate: (view: string) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({ onNavigate }) => {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);

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

  const plugins = [
    {
      name: 'Email Integration',
      icon: <Mail size={24} className="text-orange-400" />,
      status: prefs?.userEmail ? 'Active' : 'Not Configured',
      color: 'orange',
      action: () => onNavigate('plugins'),
      bg: 'bg-orange-500/10'
    },
    {
      name: 'Telegram Bot',
      icon: <Send size={24} className="text-sky-400" />,
      status: prefs?.telegramBotToken ? 'Connected' : 'Pending Setup',
      color: 'sky',
      action: () => onNavigate('preferences'),
      bg: 'bg-sky-500/10'
    },
    {
      name: 'Chat Assistant',
      icon: <MessageSquare size={24} className="text-emerald-400" />,
      status: 'Ready',
      color: 'emerald',
      action: () => onNavigate('chat'),
      bg: 'bg-emerald-500/10'
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-2">
            Aegis <span className="gradient-text">Command Center</span>
            <Sparkles size={24} className="text-indigo-400 animate-pulse" />
          </h1>
          <p className="text-slate-400 max-w-xl text-sm leading-relaxed">
            Welcome to your centralized Artificial Intelligence hub. Monitor active plugins, review global telemetry, and interact with the cognitive core from one unified interface.
          </p>
        </div>
      </div>

      {/* System Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">System Health</span>
          <div className="flex items-center gap-2 mt-1">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span className="text-lg font-bold text-white">Optimal</span>
          </div>
        </div>
        
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Active AI Provider</span>
          <div className="flex items-center gap-2 mt-1">
            <Activity size={18} className="text-indigo-400" />
            <span className="text-lg font-bold text-white">{prefs?.aiProvider || 'Claude'}</span>
          </div>
        </div>
      </div>

      {/* Plugins / Skills Module */}
      <div>
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
          <ShieldAlert size={16} className="text-slate-500" />
          Core Plugins & Integrations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plugins.map((plugin, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={plugin.action}
              className={`glass-panel p-6 rounded-3xl border border-white/5 cursor-pointer flex flex-col gap-4 relative overflow-hidden group hover:border-${plugin.color}-500/30 transition-all`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-${plugin.color}-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-all group-hover:bg-${plugin.color}-500/20`} />
              
              <div className={`w-12 h-12 rounded-2xl ${plugin.bg} flex items-center justify-center border border-${plugin.color}-500/20`}>
                {plugin.icon}
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-white mb-1">{plugin.name}</h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-${plugin.color}-500/10 text-${plugin.color}-400 border border-${plugin.color}-500/20`}>
                  {plugin.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
