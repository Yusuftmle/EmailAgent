import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, ShoppingCart, Mail, ExternalLink, RefreshCw, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { apiService, DashboardStats, TrackedProduct, TrackedCategory, PriceHistory } from '../services/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface DashboardAnalyticsProps {
  userId?: string;
}

const decodeHTMLEntities = (text: string | null | undefined) => {
  if (!text) return '';
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
};

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({ userId }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<TrackedProduct[]>([]);
  const [categories, setCategories] = useState<TrackedCategory[]>([]);
  const [logs, setLogs] = useState<import('../services/api').NotificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [priceHistoryData, setPriceHistoryData] = useState<PriceHistory[]>([]);

  const handleProductClick = async (productId: string) => {
    if (expandedProductId === productId) {
      setExpandedProductId(null);
      setPriceHistoryData([]);
    } else {
      setExpandedProductId(productId);
      const history = await apiService.getPriceHistory(productId);
      setPriceHistoryData(history);
    }
  };

  const fetchData = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const uid = userId;
      const s = await apiService.getDashboardStats(uid);
      const p = await apiService.getTrackedProducts(uid);
      const c = await apiService.getTrackedCategories(uid);
      const l = await apiService.getNotificationLogs(uid);
      setStats(s);
      setProducts(p);
      setCategories(c);
      setLogs(l);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  return (
    <div className="flex flex-col gap-6 mt-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Time Saved', value: `${stats?.hoursSaved || 0}h`, icon: <Clock size={18} className="text-slate-400" /> },
          { label: 'Total Savings', value: `₺${stats?.totalSavings?.toLocaleString() || 0}`, icon: <ShoppingCart size={18} className="text-slate-400" /> },
          { label: 'Emails Proc', value: stats?.totalEmails || 0, icon: <Mail size={18} className="text-slate-400" /> },
          { label: 'Tracked', value: stats?.totalTrackedProducts || 0, icon: <ShoppingCart size={18} className="text-slate-400" /> },
          { label: 'Queries', value: stats?.totalChats || 0, icon: <Activity size={18} className="text-slate-400" /> },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 flex flex-col justify-between group hover:bg-slate-800/60 transition-colors">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-medium text-slate-400">{stat.label}</span>
              <div className="p-1.5 rounded-lg bg-white/5 text-slate-300 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-colors">
                {stat.icon}
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-white mt-3">
              {isLoading ? <span className="animate-pulse">--</span> : stat.value}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Tracked Products Tracker */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
            <div className="flex items-center gap-2 text-indigo-400">
              <ShoppingCart size={18} />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">Live Tracked Products</h2>
            </div>
            <button onClick={fetchData} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {isLoading ? (
              <div className="text-xs text-slate-500 text-center py-6">Loading active trackers...</div>
            ) : products.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-6">
                You aren't tracking any products yet.
              </div>
            ) : (
              <AnimatePresence>
                {products.map(p => (
                  <motion.div key={p.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-shrink-0 flex flex-col rounded-2xl bg-slate-900/50 border border-white/5 hover:border-indigo-500/30 transition-all overflow-hidden group">
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer"
                      onClick={() => handleProductClick(p.id)}
                    >
                      <div className="flex flex-col gap-1 overflow-hidden flex-1 pr-4">
                        <span className="text-sm font-semibold text-slate-200 truncate">{decodeHTMLEntities(p.title) || p.url}</span>
                        <a href={p.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[11px] text-slate-500 hover:text-emerald-400 flex items-center gap-1 w-fit transition-colors">
                          View Source <ExternalLink size={10} />
                        </a>
                      </div>
                      <div className="flex items-center gap-6 text-right flex-shrink-0">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-medium text-slate-500 uppercase">Target</span>
                          <span className="text-xs font-semibold text-emerald-400">{p.targetPrice} {p.currency}</span>
                        </div>
                        <div className="flex flex-col items-end w-16">
                          <span className="text-[10px] font-medium text-slate-500 uppercase">Current</span>
                          <span className="text-sm font-bold text-slate-100">{p.lastKnownPrice} {p.currency}</span>
                        </div>
                        <div className="text-slate-500 flex-shrink-0">
                          {expandedProductId === p.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>
                    </div>
                    {/* Expandable Chart Area */}
                    <AnimatePresence>
                      {expandedProductId === p.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }} 
                          exit={{ height: 0, opacity: 0 }}
                          className="px-4 pb-4 border-t border-white/5 pt-4"
                        >
                          <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Price History</h4>
                          {priceHistoryData.length === 0 ? (
                            <div className="text-xs text-slate-500">Not enough history data yet.</div>
                          ) : (
                            <div className="w-full h-40">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={priceHistoryData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                  <XAxis 
                                    dataKey="checkedAt" 
                                    tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
                                    stroke="#ffffff50" 
                                    fontSize={10} 
                                  />
                                  <YAxis 
                                    domain={['auto', 'auto']}
                                    stroke="#ffffff50" 
                                    fontSize={10}
                                    width={40}
                                  />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#ffffff20', borderRadius: '8px' }}
                                    itemStyle={{ color: '#818cf8', fontSize: '12px', fontWeight: 'bold' }}
                                    labelFormatter={(label) => new Date(label).toLocaleString()}
                                    labelStyle={{ color: '#94a3b8', fontSize: '10px' }}
                                  />
                                  <Line type="monotone" dataKey="price" stroke="#818cf8" strokeWidth={2} dot={{ r: 3, fill: '#818cf8' }} activeDot={{ r: 5 }} />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Live Tracked Categories Tracker */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
            <div className="flex items-center gap-2 text-pink-400">
              <Search size={18} />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">Tracked Categories</h2>
            </div>
            <button onClick={fetchData} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {isLoading ? (
              <div className="text-xs text-slate-500 text-center py-6">Loading active categories...</div>
            ) : categories.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-6">
                You aren't tracking any search categories yet.
              </div>
            ) : (
              <AnimatePresence>
                {categories.map(c => (
                  <motion.div key={c.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-shrink-0 flex items-center justify-between p-4 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-pink-500/30 transition-all group">
                    <div className="flex flex-col gap-1 overflow-hidden pr-4">
                      <span className="text-sm font-semibold text-slate-200 truncate">{decodeHTMLEntities(c.categoryName) || 'Unnamed Category'}</span>
                      <a href={c.categoryUrl} target="_blank" rel="noreferrer" className="text-[11px] text-slate-500 hover:text-pink-400 flex items-center gap-1 w-fit transition-colors">
                        Search Link <ExternalLink size={10} />
                      </a>
                    </div>
                    <div className="flex items-center gap-4 text-right flex-shrink-0">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-medium text-slate-500 uppercase">Min Discount</span>
                        <span className="text-sm font-bold text-emerald-400">%{c.minDiscountPercentage}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* Cross-Border Comparisons Tracker */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col mb-6">
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2 text-yellow-400">
            <Activity size={18} />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">Cross-Border Comparisons</h2>
          </div>
          <button onClick={fetchData} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {isLoading ? (
            <div className="text-xs text-slate-500 text-center py-6">Loading comparisons...</div>
          ) : (() => {
            const grouped = categories.reduce((acc, cat) => {
              if (cat.comparisonGroupId) {
                if (!acc[cat.comparisonGroupId]) acc[cat.comparisonGroupId] = [];
                acc[cat.comparisonGroupId].push(cat);
              }
              return acc;
            }, {} as Record<string, TrackedCategory[]>);

            const comparisonGroups = Object.values(grouped).filter(g => g.length >= 2);

            if (comparisonGroups.length === 0) {
              return (
                <div className="text-xs text-slate-500 text-center py-6">
                  You don't have any active cross-border comparison groups. Ask the AI to compare two Amazon regions!
                </div>
              );
            }

            return (
              <AnimatePresence>
                {comparisonGroups.map((group, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-shrink-0 flex flex-col p-4 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-yellow-500/30 transition-all">
                    <div className="text-[10px] font-medium text-slate-500 mb-4 text-center tracking-widest uppercase border-b border-white/5 pb-2">
                      Comparison Battle
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      {/* Left Side */}
                      <div className="flex-1 text-center bg-white/5 rounded-xl p-4 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="block text-sm font-bold text-slate-200 mb-1">{decodeHTMLEntities(group[0].categoryName) || 'Unnamed Store'}</span>
                        <a href={group[0].categoryUrl} target="_blank" rel="noreferrer" className="text-[10px] text-slate-500 hover:text-pink-400 inline-flex items-center gap-1 relative z-10 transition-colors">
                          View Store <ExternalLink size={10} />
                        </a>
                      </div>

                      {/* VS Badge */}
                      <div className="flex-shrink-0 flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                          <span className="text-[10px] font-bold text-white">VS</span>
                        </div>
                        <span className="text-[9px] text-slate-500 mt-2 font-medium whitespace-nowrap">Need {group[0].minDiscountPercentage}% Diff</span>
                      </div>

                      {/* Right Side */}
                      <div className="flex-1 text-center bg-white/5 rounded-xl p-4 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-bl from-transparent to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="block text-sm font-bold text-slate-200 mb-1">{decodeHTMLEntities(group[1].categoryName) || 'Unnamed Store'}</span>
                        <a href={group[1].categoryUrl} target="_blank" rel="noreferrer" className="text-[10px] text-slate-500 hover:text-indigo-400 inline-flex items-center gap-1 relative z-10 transition-colors">
                          View Store <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                    {group.length > 2 && (
                      <div className="mt-3 text-[10px] text-slate-500 text-center">
                        + {group.length - 2} more contenders in this group
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            );
          })()}
        </div>
      </div>
      {/* Notification History */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col mb-6">
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2 text-purple-400">
            <Mail size={18} />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">Notification History</h2>
          </div>
          <button onClick={fetchData} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {isLoading ? (
            <div className="text-xs text-slate-500 text-center py-6">Loading history...</div>
          ) : logs.length === 0 ? (
            <div className="text-xs text-slate-500 text-center py-6">
              No notifications sent yet.
            </div>
          ) : (
            <AnimatePresence>
              {logs.map(log => (
                <motion.div key={log.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-shrink-0 flex flex-col p-4 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-purple-500/30 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-medium text-purple-400 uppercase tracking-widest">{log.type}</span>
                    <span className="text-[10px] text-slate-500">{new Date(log.sentAt).toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{log.message}</div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};
