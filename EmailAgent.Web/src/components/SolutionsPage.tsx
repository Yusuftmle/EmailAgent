import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShaderCanvas } from './ShaderCanvas';
import { 
  Check, 
  ArrowRight, 
  Activity, 
  Mail, 
  RefreshCw, 
  Eye, 
  Calendar, 
  TrendingDown, 
  Sparkles, 
  Bell 
} from 'lucide-react';
import { motion } from 'framer-motion';

// Coded React + Framer Motion Interactive Pipeline Flow Component
const PipelineFlow: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 5);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { title: '1. Web Scraping', desc: 'Background HTML fetch & dynamic parsing', icon: RefreshCw },
    { title: '2. Delta Price Check', desc: 'Checks lists for price anomalies', icon: TrendingDown },
    { title: '3. LLM Reasoning', desc: 'Evaluate price drops & generate summaries', icon: Sparkles },
    { title: '4. Visual Analysis', desc: 'Inspects listing photos via Vision AI', icon: Eye },
    { title: '5. Instant Alert Dispatch', desc: 'Sends WhatsApp / Telegram notifications', icon: Bell },
  ];

  return (
    <div className="w-full bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-slate-200/50 shadow-xl mt-12 relative overflow-hidden text-left">
      <div className="mb-8 space-y-2">
        <span className="font-mono text-[10px] text-[#06b6d4] uppercase tracking-wider font-bold">Execution Workflow</span>
        <h3 className="text-2xl font-bold text-slate-900">Aegis Agent Pipeline In Action</h3>
        <p className="text-slate-500 text-sm">Watch the real-time background orchestration flow from ingestion to push alert.</p>
      </div>

      {/* Dynamic line glow */}
      <div className="absolute top-[9.5rem] left-[10%] right-[10%] h-1 bg-slate-200/60 hidden md:block z-0">
        <motion.div 
          className="h-full bg-gradient-to-r from-[#06b6d4] via-indigo-500 to-emerald-400"
          initial={{ width: '0%' }}
          animate={{ 
            width: `${(activeStep / 4) * 100}%` 
          }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{ position: 'absolute', left: 0 }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10 pt-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === activeStep;
          const isCompleted = idx <= activeStep;
          
          return (
            <div key={idx} className="flex flex-col items-center text-center space-y-4">
              {/* Node Circle */}
              <div className="relative">
                <motion.div
                  animate={{
                    scale: isActive ? [1, 1.12, 1] : 1,
                    borderColor: isActive ? '#06b6d4' : isCompleted ? '#06b6d4' : '#e2e8f0',
                    backgroundColor: isActive ? '#ecfeff' : isCompleted ? '#ecfeff' : '#ffffff',
                    color: isActive ? '#06b6d4' : isCompleted ? '#06b6d4' : '#64748b',
                  }}
                  transition={{ duration: 0.4 }}
                  className="w-14 h-14 rounded-full border-2 flex items-center justify-center shadow-md cursor-pointer"
                  onClick={() => setActiveStep(idx)}
                >
                  <Icon size={20} />
                </motion.div>
                
                {/* Glowing ring for active node */}
                {isActive && (
                  <span className="absolute inset-0 rounded-full border-4 border-[#06b6d4]/20 animate-ping pointer-events-none" />
                )}
              </div>

              {/* Node Title & Desc */}
              <div className="space-y-1">
                <h4 className={`text-xs font-bold font-mono tracking-tight transition-colors duration-300 ${
                  isActive ? 'text-[#06b6d4]' : 'text-slate-800'
                }`}>
                  {step.title}
                </h4>
                <p className="text-slate-500 text-[11px] max-w-[130px] mx-auto leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const SolutionsPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('jwt');

  return (
    <div className="text-slate-900 bg-[#f7f9fb] overflow-x-hidden min-h-screen">
      {/* Header Hero Section */}
      <header className="max-w-6xl mx-auto px-6 pt-32 pb-16 text-center relative py-12 md:py-20">
        {/* Shader canvas background on header hero card */}
        <div className="absolute inset-0 w-full h-full -z-10 opacity-10 pointer-events-none rounded-3xl overflow-hidden">
          <ShaderCanvas />
        </div>
        <div className="relative z-10 space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
            Tailored for Every <br />
            <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#06b6d4] bg-clip-text text-transparent">
              Operational Edge
            </span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Deploy cognitive background agents and alert systems to run scrapers, write email draft replies, analyze photos, and manage calendar tasks.
          </p>
        </div>
      </header>

      {/* Solution Bento Grid */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Solution 1: Gmail Reply Generator */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-8 flex flex-col justify-between h-[480px] relative overflow-hidden group shadow-lg shadow-slate-100/50 hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-500" />
            <div className="mb-auto relative z-10 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-cyan-500/20 text-[#06b6d4]">
                <Mail size={22} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Cognitive Gmail AI</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Connect your Gmail inbox for bulk reading, semantic classification, email summary aggregation, and automated draft replies tailored by LLM context matching.
              </p>
            </div>
            <div className="relative z-10 space-y-6">
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-xs font-mono text-slate-700">
                  <Check size={14} className="text-[#06b6d4]" />
                  <span>AI DRAFT GENERATION</span>
                </li>
                <li className="flex items-center gap-2 text-xs font-mono text-slate-700">
                  <Check size={14} className="text-[#06b6d4]" />
                  <span>THREAD SUMMARIZATION</span>
                </li>
              </ul>
              <button
                onClick={() => navigate(isAuthenticated ? '/app' : '/login')}
                className="w-full py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-800 text-sm transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>Deploy Module</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Solution 2: Price Scrapers */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-8 flex flex-col justify-between h-[480px] relative overflow-hidden group shadow-lg shadow-slate-100/50 hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-400/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-500" />
            <div className="mb-auto relative z-10 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-purple-500/20 text-purple-600">
                <RefreshCw size={22} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Deal Tracker Scrapers</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Automatically scrape listings and store pages, log pricing history data, and check deltas. Dispatches alert summaries immediately on WhatsApp and Telegram.
              </p>
            </div>
            <div className="relative z-10 space-y-6">
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-xs font-mono text-slate-700">
                  <Check size={14} className="text-purple-600" />
                  <span>DELTA PRICE ALERTS</span>
                </li>
                <li className="flex items-center gap-2 text-xs font-mono text-slate-700">
                  <Check size={14} className="text-purple-600" />
                  <span>HISTORY LOG TRACKING</span>
                </li>
              </ul>
              <button
                onClick={() => navigate(isAuthenticated ? '/app' : '/login')}
                className="w-full py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-800 text-sm transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>Deploy Module</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Solution 3: Visual Inspection */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-8 flex flex-col justify-between h-[480px] relative overflow-hidden group shadow-lg shadow-slate-100/50 hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-500" />
            <div className="mb-auto relative z-10 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-emerald-500/20 text-emerald-600">
                <Eye size={22} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">AI Visual Evaluator</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Use specialized vision agents to audit images of listings automatically. Evaluates vehicles for kaporta condition, laptops for cosmetics, and fashion items.
              </p>
            </div>
            <div className="relative z-10 space-y-6">
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-xs font-mono text-slate-700">
                  <Check size={14} className="text-emerald-600" />
                  <span>DOMAIN PERSONAS</span>
                </li>
                <li className="flex items-center gap-2 text-xs font-mono text-slate-700">
                  <Check size={14} className="text-emerald-600" />
                  <span>IMAGE SCANNING</span>
                </li>
              </ul>
              <button
                onClick={() => navigate(isAuthenticated ? '/app' : '/login')}
                className="w-full py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-800 text-sm transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>Deploy Module</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Solution 4: Calendar Sync */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-8 flex flex-col justify-between h-[480px] relative overflow-hidden group shadow-lg shadow-slate-100/50 hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-500" />
            <div className="mb-auto relative z-10 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-amber-500/20 text-amber-600">
                <Calendar size={22} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Task Scheduling</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Connect your Google Calendar account. Schedule background worker jobs to run web searches, execute checks, or trigger voice commands exactly when due.
              </p>
            </div>
            <div className="relative z-10 space-y-6">
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-xs font-mono text-slate-700">
                  <Check size={14} className="text-amber-600" />
                  <span>CALENDAR INTEGRATION</span>
                </li>
                <li className="flex items-center gap-2 text-xs font-mono text-slate-700">
                  <Check size={14} className="text-amber-600" />
                  <span>TIME BASED REMINDERS</span>
                </li>
              </ul>
              <button
                onClick={() => navigate(isAuthenticated ? '/app' : '/login')}
                className="w-full py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-800 text-sm transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>Deploy Module</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Solution 5: Cockpit Telemetry */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-8 flex flex-col justify-between h-[480px] relative overflow-hidden group shadow-lg shadow-slate-100/50 hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-500" />
            <div className="mb-auto relative z-10 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-indigo-500/20 text-indigo-600">
                <Activity size={22} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Cockpit Telemetry</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Monitor your background worker loops live. Real-time logging streaming console powered by SignalR web-sockets for absolute execution diagnostic oversight.
              </p>
            </div>
            <div className="relative z-10 space-y-6">
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-xs font-mono text-slate-700">
                  <Check size={14} className="text-indigo-600" />
                  <span>SIGNALR EVENT STREAM</span>
                </li>
                <li className="flex items-center gap-2 text-xs font-mono text-slate-700">
                  <Check size={14} className="text-indigo-600" />
                  <span>LATENCY AUDITING</span>
                </li>
              </ul>
              <button
                onClick={() => navigate(isAuthenticated ? '/app' : '/login')}
                className="w-full py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-800 text-sm transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>Deploy Module</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Coded Interactive Pipeline flow section */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <PipelineFlow />
      </section>

      {/* Meet Omni Architectural Details */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200/60 bg-white p-8 md:p-20 min-h-[540px] flex items-center">
          {/* Background Video */}
          <video
            src="/Robot_holding_wrench_pointing_se…_202606111501.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover z-0 scale-[1.2] translate-x-[5%] translate-y-[5%]"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 via-[42%] to-transparent z-10" />

          {/* Text Content */}
          <div className="relative z-20 max-w-xl space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-100 bg-cyan-50 text-xs font-mono text-[#06b6d4]">
              <span>Core Architecture</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
              Meet Omni
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              Omni is our core cognitive assistant layer. It orchestrates background deal trackers, Gmail classification pipelines, and calendar workflows. Query or direct Aegis bots directly from WhatsApp and Telegram to inspect web pages, evaluate images, or trigger text commands.
            </p>
            <div className="grid grid-cols-2 gap-6 pt-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Gmail AI Agent</h4>
                <p className="text-slate-500 text-xs mt-1">Auto-syncs context-aware email replies directly to your Gmail draft folder.</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Command Bots</h4>
                <p className="text-slate-500 text-xs mt-1">Trigger scraper cycles, view logs, or receive delta warnings on WhatsApp and Telegram.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capability Comparison Table */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-slate-100">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">Aegis vs Legacy</h2>
          <p className="text-slate-500 text-base">The operational cost of outdated manual workflow execution.</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-2xl overflow-hidden border border-slate-200 shadow-xl shadow-slate-100/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="p-6 font-bold text-slate-700 text-sm border-b border-slate-200">Capability</th>
                  <th className="p-6 font-bold text-[#06b6d4] text-sm border-b border-slate-200 bg-slate-50/50 w-1/3">Aegis V3.0</th>
                  <th className="p-6 font-bold text-slate-500 text-sm border-b border-slate-200 w-1/3">Legacy Operations</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-6 font-semibold text-slate-800">Email Processing Latency</td>
                  <td className="p-6 text-[#06b6d4] font-semibold flex items-center gap-1.5">
                    <Activity size={14} className="animate-pulse" />
                    <span>Real-time (&lt; 30s)</span>
                  </td>
                  <td className="p-6 text-slate-500">Manual triage (Hours to Days)</td>
                </tr>
                <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-6 font-semibold text-slate-800">Price Anomaly Interception</td>
                  <td className="p-6 text-slate-800">Autonomous (Background Scrapers)</td>
                  <td className="p-6 text-slate-500">Periodic manual bookmark reviews</td>
                </tr>
                <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-6 font-semibold text-slate-800">Visual Evaluation</td>
                  <td className="p-6 text-slate-800">Vision AI Scanning (Automated)</td>
                  <td className="p-6 text-slate-500">Manual inspection of listings</td>
                </tr>
                <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-6 font-semibold text-slate-800">Integration Control</td>
                  <td className="p-6 text-slate-800">WhatsApp & Telegram (Bidirectional)</td>
                  <td className="p-6 text-slate-500">None (Check web dashboard only)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
export default SolutionsPage;
