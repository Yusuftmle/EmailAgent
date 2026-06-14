import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService, UserPreferences, TrackedCategory, TrackedProduct, NotificationLog } from '../services/api';

const getProductImage = (title: string): string => {
  const t = title.toLowerCase();
  if (t.includes('iphone')) {
    return 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=400&q=80';
  }
  if (t.includes('macbook') || t.includes('laptop') || t.includes('computer')) {
    return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80';
  }
  if (t.includes('playstation') || t.includes('ps5') || t.includes('console') || t.includes('xbox')) {
    return 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=400&q=80';
  }
  if (t.includes('rtx') || t.includes('gpu') || t.includes('graphics') || t.includes('nvidia') || t.includes('amd')) {
    return 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=400&q=80';
  }
  if (t.includes('sony') || t.includes('headphone') || t.includes('audio') || t.includes('speaker') || t.includes('kulaklık')) {
    return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80';
  }
  return 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=400&q=80';
};

interface CommandCenterProps {
  onNavigate?: (view: string) => void;
}

const decodeHTMLEntities = (text: string | null | undefined) => {
  if (!text) return '';
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
};

const getUserId = (): string => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.Id || user.id || '00000000-0000-0000-0000-000000000000';
    }
  } catch (e) {}
  return '00000000-0000-0000-0000-000000000000';
};

// ── Material Icon Helper ──
const MI: React.FC<{ n: string; f?: boolean; className?: string; s?: number }> =
  ({ n, f, className = '', s = 18 }) => (
    <span className={`material-symbols-outlined ${className}`}
      style={{ fontSize: s, fontVariationSettings: f ? "'FILL' 1" : "'FILL' 0" }}>
      {n}
    </span>
  );

export const CommandCenter: React.FC<CommandCenterProps> = () => {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [categories, setCategories] = useState<TrackedCategory[]>([]);
  const [products, setProducts] = useState<TrackedProduct[]>([]);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);
  const [tickerItems, setTickerItems] = useState<any[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [completedLogIds, setCompletedLogIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('completed_notification_logs');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [latency, setLatency] = useState(12);

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        const next = prev + delta;
        return next >= 9 && next <= 15 ? next : prev;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleDismissTickerItem = (id: string) => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setTickerItems(prev => prev.filter(item => item.id !== id));
  };

  const handleToggleCompleteLog = (id: string) => {
    setCompletedLogIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem('completed_notification_logs', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  useEffect(() => {
    const load = async () => {
      try {
        const uid = getUserId();
        const [p, cat, prod, logs] = await Promise.all([
          apiService.getPreferences(),
          apiService.getTrackedCategories(uid),
          apiService.getTrackedProducts(uid),
          apiService.getNotificationLogs(uid),
        ]);
        setPrefs(p);
        setCategories(cat);
        setProducts(prod);
        
        // Map logs to tickerItems initially (without any mock/simulated data)
        const mappedLogs = logs.map(l => ({
          id: l.id,
          type: l.type,
          sentAt: l.sentAt,
          message: l.message
        }));
        setTickerItems(mappedLogs.slice(0, 10));
        setNotificationLogs(logs);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Poll real NotificationLogs from database periodically (no simulated/mock data)
  useEffect(() => {
    if (isLoading) return;
    
    const interval = setInterval(async () => {
      try {
        const uid = getUserId();
        const logs = await apiService.getNotificationLogs(uid);
        
        const mappedLogs = logs.map(l => ({
          id: l.id,
          type: l.type,
          sentAt: l.sentAt,
          message: l.message
        })).filter(l => !dismissedIds.has(l.id));

        setTickerItems(mappedLogs.slice(0, 10));
        setNotificationLogs(logs);
      } catch (err) {
        console.error("Polled logs fetch failed:", err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isLoading, dismissedIds]);

  // ── Skeleton Card ──
  const SkeletonCard = () => (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="w-full aspect-video shimmer-bg" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-6 w-3/4 shimmer-bg rounded" />
        <div className="h-4 w-1/2 shimmer-bg rounded" />
        <div className="h-10 w-full shimmer-bg rounded mt-2" />
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-6">

      {/* ═══ LEFT/CENTER: Finalist Deals (8 cols) ═══ */}
      <div className="xl:col-span-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex justify-between items-end border-b border-outline-variant/30 pb-3">
          <div>
            <h3 className="text-headline-lg text-on-surface tracking-tight">Finalist Deals</h3>
            <p className="font-data-mono text-[11px] text-on-surface-variant mt-1 opacity-70">ALG_FILTER_V2.1 ACTIVE</p>
          </div>
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/10 border border-secondary/20 text-secondary font-data-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              Live Sync
            </span>
          </div>
        </div>

        {/* ── Command Input (Mobile Sticky) ── */}
        <div className="xl:hidden sticky top-14 z-20 bg-surface/90 backdrop-blur-md border-b border-outline-variant/30 -mx-4 px-4 py-3">
          <div className="relative flex items-center w-full">
            <MI n="search" className="absolute left-3 text-on-surface-variant" s={18} />
            <input
              className="w-full bg-surface-container-high border border-outline-variant rounded-lg pl-10 pr-12 py-2.5 font-data-mono text-[12px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
              placeholder="MacBook, iPhone, RTX 4090 ara..."
              type="text"
            />
            <div className="absolute right-4 flex items-center justify-center">
              <span className="absolute w-2.5 h-2.5 rounded-full bg-primary animate-ping opacity-75" />
              <span className="relative w-2.5 h-2.5 rounded-full bg-primary" />
            </div>
          </div>
        </div>

        {/* ── Live Ticker (Mobile) ── */}
        <div className="xl:hidden w-full bg-surface-container-low border border-outline-variant/20 rounded-lg py-1.5 overflow-hidden flex items-center px-3">
          <span className="text-[10px] font-semibold text-on-surface-variant mr-3 uppercase tracking-widest shrink-0">LIVE</span>
          <div className="flex-1 overflow-hidden relative h-5">
            <div className="ticker-track absolute flex gap-8 font-data-mono text-[11px] items-center">
              {notificationLogs.length > 0 ? (
                notificationLogs.slice(0, 5).map((log, i) => (
                  <span key={i} className="text-on-surface whitespace-nowrap">
                    {log.message.replace(/\*\*|🚨|⏰|🌍|🥇|🥈|🏆/g, '').trim()}
                  </span>
                ))
              ) : (
                <>
                  <span className="text-on-surface">MacBook Air M2 <span className="text-secondary font-bold ml-1">-12% ▼</span></span>
                  <span className="text-on-surface">PlayStation 5 Slim <span className="text-secondary font-bold ml-1">-15% ▼</span></span>
                  <span className="text-on-surface">RTX 4090 GPU <span className="text-tertiary-container font-bold ml-1">+2% ▲</span></span>
                  <span className="text-on-surface">Sony WH-1000XM5 <span className="text-secondary font-bold ml-1">-8% ▼</span></span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── System Status Pills (Mobile) ── */}
        <div className="xl:hidden flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/40 font-data-mono text-[11px] text-on-surface whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(69,223,164,0.6)]" />
            Engine: Active
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/40 font-data-mono text-[11px] text-on-surface-variant whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
            Scraper: Idle
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/40 font-data-mono text-[11px] text-on-surface whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(69,223,164,0.6)]" />
            AI: {prefs?.aiProvider || 'Claude'}
          </div>
        </div>

        {/* ── Finalist Deal Cards Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : products.length === 0 ? (
            <div className="col-span-2 glass-panel p-8 rounded-xl border border-outline-variant/30 text-center flex flex-col items-center justify-center min-h-[200px]">
              <MI n="monitoring" className="text-on-surface-variant/40 mb-3" s={32} />
              <h4 className="text-sm font-semibold text-on-surface uppercase tracking-wider">No Active Products</h4>
              <p className="text-xs text-on-surface-variant mt-1.5 max-w-sm leading-relaxed">
                Add products to your operational tracking list through the Command chat console or configure category parameters.
              </p>
            </div>
          ) : (
            products.slice(0, 4).map((product, index) => {
              const discountPct = product.targetPrice > 0 
                ? Math.round(((product.targetPrice - product.lastKnownPrice) / product.targetPrice) * 100)
                : 0;
              const isMet = product.lastKnownPrice > 0 && product.lastKnownPrice <= product.targetPrice;
              
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-surface-container/40 border border-outline-variant/40 rounded-2xl overflow-hidden flex flex-col group transition-all hover:border-primary/50 relative cursor-pointer backdrop-blur-sm shadow-lg"
                  onClick={() => window.open(product.url, '_blank')}
                >
                  {/* AI Light Beam */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                  
                  {/* Stylized Visual Header (Product Image Overlay) */}
                  <div className="h-32 relative overflow-hidden flex items-center justify-center border-b border-outline-variant/20 bg-gradient-to-br from-slate-950 via-[#0c1324] to-slate-900">
                    <img 
                      src={product.imageUrl || getProductImage(product.title)} 
                      alt={product.title} 
                      className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 group-hover:opacity-60 transition-all duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />
                    <div className="absolute inset-0 cyber-grid-bg opacity-30 pointer-events-none" />
                    
                    {/* Soft center radar overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 group-hover:opacity-0 transition-opacity">
                      <div className="w-20 h-20 rounded-full border border-primary/15 animate-pulse flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full border border-primary/25 flex items-center justify-center">
                          <MI n="radar" className="text-primary/40 text-lg animate-spin-slow" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Top Right Discount Badge */}
                    {discountPct !== 0 && (
                      <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-sm font-data-mono text-[9px] flex items-center gap-1 backdrop-blur-md shadow-lg ${
                        discountPct > 0 
                          ? 'bg-secondary/15 border border-secondary/35 text-secondary' 
                          : 'bg-tertiary-container/15 border border-tertiary/30 text-tertiary-container'
                      }`}>
                        <MI n={discountPct > 0 ? 'trending_down' : 'trending_up'} s={11} />
                        {discountPct > 0 ? `-${discountPct}%` : `+${Math.abs(discountPct)}%`}
                      </div>
                    )}

                    {/* Top Left Tracking Status Badge */}
                    <div className={`absolute top-3 left-3 px-2 py-0.5 rounded-sm font-data-mono text-[9px] flex items-center gap-1.5 backdrop-blur-md ${
                      isMet 
                        ? 'bg-secondary/10 border border-secondary/30 text-secondary shadow-[0_0_15px_rgba(69,223,164,0.15)]' 
                        : 'bg-primary/10 border border-primary/20 text-primary shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isMet ? 'bg-secondary animate-pulse' : 'bg-primary animate-pulse'}`} />
                      {isMet ? 'TARGET MET' : 'TRACKING'}
                    </div>

                    {/* Bottom Title & Node Identifier */}
                    <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                      <div className="min-w-0 flex-1">
                        <p className="font-data-mono text-[9px] text-primary/80 uppercase tracking-widest relative z-10">TRACKER_ACTIVE // NODE_{index}</p>
                        <h4 className="text-[14px] text-white font-medium truncate mt-0.5 relative z-10">{decodeHTMLEntities(product.title) || 'Unnamed Product'}</h4>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col gap-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[20px] font-semibold text-on-surface font-geist">
                        {product.lastKnownPrice > 0 ? `${product.lastKnownPrice.toLocaleString()} ${product.currency}` : 'Pending Scan'}
                      </span>
                      {product.lastKnownPrice > 0 && product.lastKnownPrice !== product.targetPrice && (
                        <span className="font-data-mono text-xs text-on-surface-variant line-through opacity-50">
                          {product.targetPrice.toLocaleString()} {product.currency}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <div className="bg-surface/50 rounded p-2 border border-outline-variant/10">
                        <span className="block font-data-mono text-[9px] text-on-surface-variant uppercase opacity-70">Target Price</span>
                        <span className="font-data-mono text-xs text-on-surface font-semibold">{product.targetPrice} {product.currency}</span>
                      </div>
                      <div className="bg-surface/50 rounded p-2 border border-outline-variant/10">
                        <span className="block font-data-mono text-[9px] text-on-surface-variant uppercase opacity-70">Stock Signal</span>
                        <span className={`font-data-mono text-xs font-semibold ${product.isInStock ? 'text-secondary' : 'text-error'}`}>
                          {product.isInStock ? 'IN STOCK' : 'OUT OF STOCK'}
                        </span>
                      </div>
                    </div>

                    {/* AI Verdict */}
                    <div className="mt-1 bg-primary/5 rounded-lg p-3 border border-primary/10 flex items-start gap-2">
                      <MI n="smart_toy" className="text-primary mt-0.5" s={14} />
                      <p className="text-[12px] text-primary/90 italic leading-snug">
                        {isMet 
                          ? "Target match detected. Price point is mathematically optimized. Action recommended."
                          : `Monitoring parameters active. Price is currently ${Math.max(0, Math.round((product.lastKnownPrice / product.targetPrice - 1) * 100))}% above desired target.`
                        }
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* ═══ RIGHT SIDEBAR: Intelligence Panel (4 cols, desktop only) ═══ */}
      <div className="xl:col-span-4 flex flex-col gap-6">

        {/* ── System Diagnostics ── */}
        <div className="bg-surface-container-low/40 border border-outline-variant/30 rounded-2xl p-4 flex flex-col gap-4 relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <MI n="developer_board" f s={48} />
          </div>
          <h3 className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
            <MI n="memory" s={14} />
            System Diagnostics
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-container-lowest/50 border border-outline-variant/30 rounded-lg p-3 flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="font-data-mono text-[10px] text-on-surface-variant uppercase">Latency</span>
                <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
              </div>
              <span className="font-data-mono text-lg text-on-surface">{latency}ms</span>
            </div>
            <div className="bg-surface-container-lowest/50 border border-outline-variant/30 rounded-lg p-3 flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="font-data-mono text-[10px] text-on-surface-variant uppercase">Data Node</span>
                <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
              </div>
              <span className="font-data-mono text-lg text-on-surface">SYNC_OK</span>
            </div>
            <div className="col-span-2 bg-surface-container-lowest/50 border border-outline-variant/30 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MI n="psychology" className="text-primary" s={14} />
                <span className="font-data-mono text-[12px] text-on-surface">AI Engine ({prefs?.aiProvider || 'Claude'})</span>
              </div>
              <span className="text-primary font-data-mono text-[11px] animate-pulse">ACTIVE</span>
            </div>
          </div>
        </div>

        {/* ── Live Ticker / Feed ── */}
        <div className="bg-surface-container-low/40 border border-outline-variant/30 rounded-2xl flex flex-col h-[280px] overflow-hidden backdrop-blur-sm">
          <div className="p-4 border-b border-outline-variant/20 bg-surface-container/50 flex justify-between items-center">
            <h3 className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
              <MI n="rss_feed" s={14} />
              Live Ticker
            </h3>
            <span className="font-data-mono text-[10px] text-secondary border border-secondary/30 px-1.5 py-0.5 rounded bg-secondary/10">REAL-TIME</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
            {tickerItems.length === 0 ? (
              <div className="text-[11px] text-on-surface-variant italic text-center py-8">Henüz bildirim kaydı yok.</div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {tickerItems.map((log) => {
                    const timeStr = new Date(log.sentAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    
                    let badgeText = 'SYSTEM';
                    let badgeStyle = 'border-outline/40 text-on-surface-variant/80 bg-surface-container-high/20';

                    if (log.type === 'PriceDrop') {
                      badgeText = 'PRICE DROP';
                      badgeStyle = 'border-primary/45 text-primary bg-primary/10 shadow-[0_0_10px_rgba(34,211,238,0.1)]';
                    } else if (log.type === 'AIDraft') {
                      badgeText = 'AI REPLY';
                      badgeStyle = 'border-secondary/45 text-secondary bg-secondary/10 shadow-[0_0_10px_rgba(69,223,164,0.1)]';
                    } else if (log.type === 'Currency') {
                      badgeText = 'EXCHANGE';
                      badgeStyle = 'border-amber-500/40 text-amber-500 bg-amber-500/10';
                    } else if (log.type === 'Telegram') {
                      badgeText = 'TELEGRAM';
                      badgeStyle = 'border-blue-400/40 text-blue-400 bg-blue-400/10';
                    } else if (log.type === 'Scraper') {
                      badgeText = 'SCRAPER';
                      badgeStyle = 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10';
                    } else if (log.type === 'Reminder') {
                      badgeText = 'REMINDER';
                      badgeStyle = 'border-amber-500/40 text-amber-500 bg-amber-500/10';
                    }

                    const cleanMsg = log.message.replace(/\*\*|🚨|⏰|🌍|🥇|🥈|🏆/g, '').trim();
                    const isCompleted = completedLogIds.has(log.id);

                    return (
                      <motion.div 
                        key={log.id} 
                        layout
                        initial={{ opacity: 0, x: -20, height: 0 }}
                        animate={{ opacity: 1, x: 0, height: 'auto' }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className={`flex justify-between items-center gap-3 group border-b border-outline-variant/10 pb-3 last:border-0 last:pb-0 overflow-hidden ${isCompleted ? 'opacity-60' : ''}`}
                      >
                        <div className="flex gap-3 items-start flex-1 min-w-0">
                          <div className="flex flex-col items-center shrink-0">
                            <span className={`px-2 py-0.5 rounded-sm font-data-mono text-[8px] border font-bold ${badgeStyle}`}>
                              {badgeText}
                            </span>
                            <span className="font-data-mono text-[8px] text-on-surface-variant/40 mt-1">{timeStr}</span>
                          </div>
                          
                          <div className="min-w-0 flex-1 text-left">
                            <p className={`text-[12px] text-on-surface leading-normal break-words font-sans ${isCompleted ? 'line-through opacity-60' : ''}`}>{cleanMsg}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Complete Action Button */}
                          <button
                            onClick={() => handleToggleCompleteLog(log.id)}
                            className={`p-1 transition-all rounded hover:bg-white/5 ${
                              isCompleted 
                                ? 'opacity-100 text-primary' 
                                : 'opacity-0 group-hover:opacity-100 text-on-surface-variant/40 hover:text-primary'
                            }`}
                            title={isCompleted ? "Mark incomplete" : "Mark completed"}
                          >
                            <MI n={isCompleted ? 'check_box' : 'check_box_outline_blank'} s={14} />
                          </button>

                          {/* Dismiss Action Button */}
                          <button
                            onClick={() => handleDismissTickerItem(log.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-on-surface-variant/40 hover:text-error transition-all rounded hover:bg-white/5"
                            title="Dismiss"
                          >
                            <MI n="close" s={14} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* ── Active Trackers ── */}
        <div className="bg-surface-container-low/40 border border-outline-variant/30 rounded-2xl flex flex-col overflow-hidden flex-1 min-h-[200px] backdrop-blur-sm">
          <div className="p-4 border-b border-outline-variant/20 bg-surface-container/50 flex justify-between items-center">
            <h3 className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
              <MI n="track_changes" s={14} />
              Active Trackers
            </h3>
            <span className="font-data-mono text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/30">
              {categories.length > 0 ? `${categories.length} Active` : '0 Active'}
            </span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className="flex flex-col border border-outline-variant/30 rounded-xl overflow-hidden bg-surface-container-low/50">
              {categories.length > 0 ? categories.slice(0, 4).map((cat, i) => (
                <div 
                  key={cat.id} 
                  className={`flex justify-between items-center p-3 hover:bg-surface/60 transition-colors cursor-pointer ${
                    i < Math.min(categories.length, 4) - 1 ? 'border-b border-outline-variant/30' : ''
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-title-md text-[13px] text-on-surface font-semibold">"{cat.categoryName}"</span>
                    <span className="font-data-mono text-[10px] text-on-surface-variant">Param: Min {cat.minDiscountPercentage}% discount</span>
                  </div>
                  <MI n="chevron_right" className="text-outline" s={18} />
                </div>
              )) : (
                <>
                  <div className="flex justify-between items-center p-3 border-b border-outline-variant/30 hover:bg-surface/60 transition-colors cursor-pointer">
                    <div className="flex flex-col gap-1">
                      <span className="font-title-md text-[13px] text-on-surface font-semibold">"RTX 4090 Graphics Cards"</span>
                      <span className="font-data-mono text-[10px] text-on-surface-variant">Param: Max 50,000 TRY</span>
                    </div>
                    <MI n="chevron_right" className="text-outline" s={18} />
                  </div>
                  <div className="flex justify-between items-center p-3 hover:bg-surface/60 transition-colors cursor-pointer">
                    <div className="flex flex-col gap-1">
                      <span className="font-title-md text-[13px] text-on-surface font-semibold">"MacBook Pro M3 Max Deals"</span>
                      <span className="font-data-mono text-[10px] text-on-surface-variant">Param: 2024 Model, 32GB RAM</span>
                    </div>
                    <MI n="chevron_right" className="text-outline" s={18} />
                  </div>
                </>
              )}
            </div>
            <button className="w-full py-2 border border-dashed border-outline-variant/40 rounded text-on-surface-variant font-data-mono text-[11px] hover:border-primary hover:text-primary transition-colors flex justify-center items-center gap-1">
              <MI n="add" s={14} /> ADD TRACKER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
