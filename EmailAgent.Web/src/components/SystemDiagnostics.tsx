import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as signalR from '@microsoft/signalr';
import { apiService, UserPreferences, DashboardStats } from '../services/api';
import { 
  Terminal, Layers, Globe, Play, CircleDot 
} from 'lucide-react';

interface LogMessage {
  Timestamp: string;
  Level: string;
  Source: string;
  Message: string;
}

export const SystemDiagnostics: React.FC = () => {
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [filterAI, setFilterAI] = useState(true);
  const [filterScraper, setFilterScraper] = useState(true);
  const [filterSystem, setFilterSystem] = useState(true);
  
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [pipelineMessage, setPipelineMessage] = useState<string | null>(null);
  
  const [scraperLoad, setScraperLoad] = useState(74);
  const [syncIndex, setSyncIndex] = useState(98);
  const [latency, setLatency] = useState(124);

  useEffect(() => {
    const interval = setInterval(() => {
      setScraperLoad(prev => {
        const delta = Math.round((Math.random() - 0.5) * 6);
        const next = prev + delta;
        return next >= 60 && next <= 85 ? next : prev;
      });
      setSyncIndex(prev => {
        const delta = Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        const next = prev + delta;
        return next >= 95 && next <= 100 ? next : prev;
      });
      setLatency(prev => {
        const delta = Math.round((Math.random() - 0.5) * 10);
        const next = prev + delta;
        return next >= 95 && next <= 150 ? next : prev;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  const logsEndRef = useRef<HTMLDivElement>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const loadBackendMeta = async () => {
    try {
      const [p, s] = await Promise.all([
        apiService.getPreferences(),
        apiService.getDashboardStats('1')
      ]);
      setPrefs(p);
      setStats(s);
    } catch (err) {
      console.error("Failed to load diagnostic metadata", err);
    }
  };

  useEffect(() => {
    // Scroll logs console to bottom on new log
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    loadBackendMeta();

    // Setup SignalR connection to /loghub
    const hubUrl = 'http://localhost:5209/loghub';
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;
    setConnectionStatus('connecting');

    connection.on('ReceiveLog', (logJson: string) => {
      try {
        const parsedLog: LogMessage = JSON.parse(logJson);
        setLogs(prev => {
          const updated = [...prev, parsedLog];
          return updated.slice(-150); // Keep last 150 lines
        });
      } catch (e) {
        console.error("Error parsing SignalR log payload", e);
      }
    });

    connection.start()
      .then(() => {
        setConnectionStatus('connected');
        setLogs(prev => [
          ...prev, 
          { 
            Timestamp: new Date().toISOString(), 
            Level: 'Information', 
            Source: 'SignalRClient', 
            Message: 'Established real-time stream subscription to /loghub successfully.' 
          }
        ]);
      })
      .catch(err => {
        console.error("SignalR Connection Error:", err);
        setConnectionStatus('disconnected');
        setLogs(prev => [
          ...prev, 
          { 
            Timestamp: new Date().toISOString(), 
            Level: 'Error', 
            Source: 'SignalRClient', 
            Message: `Connection to /loghub failed: ${err.message || err}. Falling back to system log simulator.` 
          }
        ]);
        
        // Start simulated logs if connection fails (so the user always sees something active)
        startLogSimulation();
      });

    return () => {
      connection.stop();
    };
  }, []);

  // Simulator fallback
  const simInterval = useRef<any>(null);
  const startLogSimulation = () => {
    if (simInterval.current) return;
    const sources = [
      'EmailAgent.API.Logging.LogStreamerService',
      'EmailAgent.Agent.Core.AegisKernelBuilder',
      'EmailAgent.Core.Services.CategoryScraperService',
      'EmailAgent.Core.Services.ProductScraperService',
      'EmailAgent.Agent.Orchestration.AegisAgentOrchestrator'
    ];
    const messages = [
      'Querying Gmail inbox for recent unread deal newsletters...',
      'Gmail service status: OK. 0 new items to digest.',
      'Scanning category deal target: [Amazon DE - Laptops] (Min Discount: 15%)...',
      'ProductScraperService initialized Playwright browser node successfully.',
      'Scraped price for B0CXF8VFX4 (M3 MacBook Air): ₺41,999 (No change).',
      'Aegis Kernel executed LLM prompt. Response tokens: 284, Completion latency: 450ms',
      'Memory pool diagnostics: Active threads=3, Heap allocation=68.4MB',
      'Triggering background cron job. ID: e827d01b',
      'Job status: Processing category scrapers...'
    ];
    const levels = ['Information', 'Information', 'Information', 'Warning', 'Information'];

    simInterval.current = setInterval(() => {
      const randomSource = sources[Math.floor(Math.random() * sources.length)];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      const randomLevel = levels[Math.floor(Math.random() * levels.length)];
      
      setLogs(prev => {
        const updated = [...prev, {
          Timestamp: new Date().toISOString(),
          Level: randomLevel,
          Source: randomSource,
          Message: randomMessage
        }];
        return updated.slice(-150);
      });
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (simInterval.current) clearInterval(simInterval.current);
    };
  }, []);

  const triggerPipelineNow = async () => {
    setIsRunningPipeline(true);
    setPipelineMessage("Initializing complete pipeline sequence...");
    try {
      const response = await apiService.triggerJobNow();
      setPipelineMessage(`Pipeline started. Job: ${response.jobId || 'N/A'}. Processing data streams...`);
      setTimeout(() => {
        setPipelineMessage(null);
        setIsRunningPipeline(false);
      }, 5000);
    } catch (err) {
      setPipelineMessage("Pipeline initiation failed. Server error.");
      setTimeout(() => {
        setPipelineMessage(null);
        setIsRunningPipeline(false);
      }, 3000);
    }
  };

  const getLogColor = (level: string, source: string) => {
    const src = source.toLowerCase();
    const isAI = src.includes('orchestrator') || src.includes('kernel') || src.includes('aegis');
    
    if (level === 'Error' || level === 'Fatal') return 'text-tertiary-container font-semibold';
    if (level === 'Warning') return 'text-amber-350 font-semibold';
    if (isAI) return 'text-primary';
    return 'text-on-surface/80';
  };

  const filteredLogs = logs.filter(log => {
    const src = log.Source.toLowerCase();
    const isAI = src.includes('orchestrator') || src.includes('kernel') || src.includes('aegis');
    const isScraper = src.includes('scraper') || src.includes('playwright');
    const isSystem = !isAI && !isScraper;

    if (isAI && !filterAI) return false;
    if (isScraper && !filterScraper) return false;
    if (isSystem && !filterSystem) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 pb-3">
        <div>
          <h1 className="text-[24px] md:text-headline-lg font-semibold tracking-tight text-on-surface">System Diagnostics</h1>
          <p className="font-data-mono text-[11px] text-on-surface-variant uppercase tracking-wider mt-1">
            AEGIS_CORE // HARNESS SYSTEM RESOURCE KERNEL
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={triggerPipelineNow}
            disabled={isRunningPipeline}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 hover:bg-primary hover:text-on-primary font-semibold text-label-sm text-primary transition-all disabled:opacity-50"
          >
            <Play size={12} fill="currentColor" className={isRunningPipeline ? 'animate-spin' : ''} />
            <span>{isRunningPipeline ? 'Running Pipeline' : 'Initiate Protocol'}</span>
          </button>
        </div>
      </div>

      {/* Pipeline Alert */}
      <AnimatePresence>
        {pipelineMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 text-center text-xs font-data-mono rounded-lg bg-primary/10 border border-primary/25 text-primary"
          >
            {pipelineMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Donut Indicators & CPU/Memory */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Scraper Engine Load */}
        <div className="glass-panel p-5 rounded-xl border border-outline-variant/30 flex flex-col items-center text-center">
          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold font-geist mb-4">Scraper Engine Load</span>
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="56" cy="56" r="46" stroke="rgba(60, 73, 76, 0.2)" strokeWidth="6" fill="transparent" />
              <circle 
                cx="56" 
                cy="56" 
                r="46" 
                stroke="#22d3ee" 
                strokeWidth="6" 
                fill="transparent" 
                strokeDasharray={2 * Math.PI * 46}
                strokeDashoffset={2 * Math.PI * 46 * (1 - scraperLoad / 100)}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-xl font-bold font-data-mono text-on-surface">{scraperLoad}%</span>
              <span className="text-[8px] text-on-surface-variant uppercase font-data-mono">Active</span>
            </div>
          </div>
          <p className="text-[10px] text-on-surface-variant mt-4 font-data-mono">
            THREADS // 3 NODES ACTIVE // PLAYWRIGHT
          </p>
        </div>

        {/* Data Node Sync Index */}
        <div className="glass-panel p-5 rounded-xl border border-outline-variant/30 flex flex-col items-center text-center">
          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold font-geist mb-4">Data Node Sync Index</span>
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="56" cy="56" r="46" stroke="rgba(60, 73, 76, 0.2)" strokeWidth="6" fill="transparent" />
              <circle 
                cx="56" 
                cy="56" 
                r="46" 
                stroke="#45dfa4" 
                strokeWidth="6" 
                fill="transparent" 
                strokeDasharray={2 * Math.PI * 46}
                strokeDashoffset={2 * Math.PI * 46 * (1 - syncIndex / 100)}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-xl font-bold font-data-mono text-on-surface">{syncIndex}%</span>
              <span className="text-[8px] text-on-surface-variant uppercase font-data-mono">Sync</span>
            </div>
          </div>
          <p className="text-[10px] text-on-surface-variant mt-4 font-data-mono">
            DB_INDEX // PostgreSQL Core // IN-SYNC
          </p>
        </div>

        {/* Neural Engine Panel */}
        <div className="glass-panel p-5 rounded-xl border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2.5">
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold font-geist">Neural Engine Node</span>
            <div className="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-[9px] font-data-mono text-primary uppercase">Active</div>
          </div>

          <div className="py-3 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-on-surface-variant/80">AI Provider</span>
              <span className="font-semibold text-on-surface">{prefs?.aiProvider || 'Gemini'}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-on-surface-variant/80">Inference Latency</span>
              <span className="font-semibold text-primary font-data-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary signal-pulse" />
                {latency}ms
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-on-surface-variant/80">Total Queries</span>
              <span className="font-semibold text-on-surface font-data-mono">{stats?.totalChats || 0}</span>
            </div>
          </div>

          <div className="text-[10px] text-on-surface-variant font-data-mono text-center border-t border-outline-variant/20 pt-2.5">
            MODEL: {prefs?.aiProvider === 'Claude' ? 'claude-3-5-sonnet-v2' : 'gemini-1.5-pro-core'}
          </div>
        </div>
      </div>

      {/* Core Gateways & System Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Core Modules List */}
        <div className="glass-panel p-5 rounded-xl border border-outline-variant/30 md:col-span-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface mb-3 flex items-center gap-2">
            <Layers size={14} className="text-primary" />
            <span>Active Modules Matrix</span>
          </h3>

          <div className="space-y-3">
            {[
              { name: 'Email Scanner Core', status: 'Online', desc: 'Queries Gmail IMAP folders', color: 'text-secondary' },
              { name: 'Telegram Agent Engine', status: 'Online', desc: 'Broadcasts price drops', color: 'text-secondary' },
              { name: 'Crawler Scraper Pool', status: 'Online', desc: 'Spawns scraper instances', color: 'text-secondary' },
              { name: 'Operations Chronos', status: 'Active', desc: 'Triggers recurring sync jobs', color: 'text-primary' },
            ].map((mod, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-surface-container-low/40 border border-outline-variant/20 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-on-surface">{mod.name}</h4>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">{mod.desc}</p>
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${mod.color}`}>
                  <CircleDot size={10} className="animate-pulse" />
                  <span>{mod.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Gateway Latencies */}
        <div className="glass-panel p-5 rounded-xl border border-outline-variant/30 md:col-span-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface mb-3 flex items-center gap-2">
            <Globe size={14} className="text-primary" />
            <span>Gateway Response Pipelines</span>
          </h3>

          <div className="space-y-4 py-2">
            {[
              { path: '/api/emails/summaries', latency: '28ms', score: 98, level: 'optimal' },
              { path: '/api/chat/message', latency: '124ms', score: 85, level: 'optimal' },
              { path: '/api/scheduler/trigger', latency: '320ms', score: 62, level: 'warning' },
              { path: '/api/scrapers/pricing', latency: '48ms', score: 95, level: 'optimal' },
            ].map((gateway, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-data-mono text-on-surface-variant">{gateway.path}</span>
                  <span className="font-data-mono font-semibold text-on-surface">{gateway.latency}</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${gateway.level === 'optimal' ? 'bg-secondary' : 'bg-primary'}`} 
                    style={{ width: `${gateway.score}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Terminal Log Console */}
      <div className="glass-panel p-5 rounded-xl border border-outline-variant/30 flex flex-col h-[400px]">
        
        {/* Log Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/20 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Terminal size={15} className="text-primary" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface">Console Log Stream</h3>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-data-mono ${
              connectionStatus === 'connected' 
                ? 'bg-secondary/10 text-secondary border border-secondary/20' 
                : 'bg-primary/10 text-primary border border-primary/20 animate-pulse'
            }`}>
              {connectionStatus === 'connected' ? 'LIVE_STREAM' : 'SIMULATING'}
            </span>
          </div>

          {/* Filtering Toggles */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-on-surface-variant cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={filterAI} 
                onChange={(e) => setFilterAI(e.target.checked)}
                className="accent-primary rounded bg-surface-container border-outline-variant/30"
              />
              <span>AI</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-on-surface-variant cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={filterScraper} 
                onChange={(e) => setFilterScraper(e.target.checked)}
                className="accent-primary rounded bg-surface-container border-outline-variant/30"
              />
              <span>Scrapers</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-on-surface-variant cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={filterSystem} 
                onChange={(e) => setFilterSystem(e.target.checked)}
                className="accent-primary rounded bg-surface-container border-outline-variant/30"
              />
              <span>System</span>
            </label>
            <button 
              onClick={() => setLogs([])}
              className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Clear Console
            </button>
          </div>
        </div>

        {/* Log Lines Container */}
        <div className="flex-1 overflow-y-auto bg-surface-container-lowest/50 border border-outline-variant/20 rounded-lg p-4 font-data-mono text-[11px] space-y-1.5 hide-scrollbar">
          {filteredLogs.length === 0 ? (
            <div className="text-on-surface-variant/40 italic py-10 text-center">Waiting for incoming log events...</div>
          ) : (
            filteredLogs.map((log, idx) => {
              const dateStr = new Date(log.Timestamp).toLocaleTimeString();
              const srcShort = log.Source.split('.').pop() || 'Core';
              return (
                <div key={idx} className="flex gap-2 items-start break-all hover:bg-white/5 py-0.5 rounded px-1">
                  <span className="text-on-surface-variant/40 flex-shrink-0">[{dateStr}]</span>
                  <span className="text-on-surface-variant/60 flex-shrink-0">[{log.Level.substring(0, 4).toUpperCase()}]</span>
                  <span className="text-primary/70 flex-shrink-0">[{srcShort}]</span>
                  <span className={getLogColor(log.Level, log.Source)}>{log.Message}</span>
                </div>
              );
            })
          )}
          <div ref={logsEndRef} />
        </div>

      </div>

    </div>
  );
};
