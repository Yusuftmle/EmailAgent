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

  // Navigation tab states
  const [activeOuterTab, setActiveOuterTab] = useState<'overview' | 'tracking' | 'activity'>('overview');
  const [activeTrackingTab, setActiveTrackingTab] = useState<'products' | 'categories' | 'comparisons'>('products');
  const [activeActivityTab, setActiveActivityTab] = useState<'notifications' | 'system'>('notifications');

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
      
      {/* Outer Tab Selector */}
      <div className="flex border-b border-outline-variant/25 gap-6">
        {[
          { id: 'overview', label: 'Overview & Stats', icon: <Clock size={14} /> },
          { id: 'tracking', label: 'Tracking Hub', icon: <ShoppingCart size={14} /> },
          { id: 'activity', label: 'Activity Logs', icon: <Mail size={14} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveOuterTab(tab.id as any)}
            className={`pb-3 text-xs md:text-sm font-semibold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 -mb-[2px] ${
              activeOuterTab === tab.id
                ? 'text-primary border-primary'
                : 'text-on-surface-variant border-transparent hover:text-on-surface'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="w-full">
        {activeOuterTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'Time Saved', value: `${stats?.hoursSaved || 0}h`, icon: <Clock size={16} /> },
                { label: 'Total Savings', value: `₺${stats?.totalSavings?.toLocaleString() || 0}`, icon: <ShoppingCart size={16} /> },
                { label: 'Emails Processed', value: stats?.totalEmails || 0, icon: <Mail size={16} /> },
                { label: 'Active Trackers', value: stats?.totalTrackedProducts || 0, icon: <ShoppingCart size={16} /> },
                { label: 'Total Queries', value: stats?.totalChats || 0, icon: <Activity size={16} /> },
              ].map((stat, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: i * 0.05 }} 
                  className="p-5 rounded-xl bg-surface-container/30 border border-outline-variant/20 flex flex-col justify-between group hover:bg-surface-container-high/40 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">{stat.label}</span>
                    <div className="p-1.5 rounded bg-surface-container-high/60 text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary transition-colors border border-outline-variant/10">
                      {stat.icon}
                    </div>
                  </div>
                  <div className="text-2xl font-semibold font-data-mono tracking-tight text-on-surface mt-3">
                    {isLoading ? <span className="animate-pulse">--</span> : stat.value}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick Summary Card */}
            <div className="glass-panel p-6 rounded-xl border border-outline-variant/30 flex flex-col gap-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface">Operations Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-2">
                <div className="p-4 rounded-lg bg-surface-container-low/40 border border-outline-variant/20 flex flex-col gap-1">
                  <span className="text-[9px] font-data-mono text-on-surface-variant uppercase">Core Engine status</span>
                  <span className="text-xs font-semibold text-secondary flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary signal-pulse" />
                    System Online
                  </span>
                </div>
                <div className="p-4 rounded-lg bg-surface-container-low/40 border border-outline-variant/20 flex flex-col gap-1">
                  <span className="text-[9px] font-data-mono text-on-surface-variant uppercase">Primary Database</span>
                  <span className="text-xs font-semibold text-primary mt-1">PostgreSQL Active</span>
                </div>
                <div className="p-4 rounded-lg bg-surface-container-low/40 border border-outline-variant/20 flex flex-col gap-1">
                  <span className="text-[9px] font-data-mono text-on-surface-variant uppercase">Timezone / Host</span>
                  <span className="text-xs font-semibold text-on-surface mt-1">UTC+3 (Turkey Standard)</span>
                </div>
                <div className="p-4 rounded-lg bg-surface-container-low/40 border border-outline-variant/20 flex flex-col gap-1">
                  <span className="text-[9px] font-data-mono text-on-surface-variant uppercase">Active Pipelines</span>
                  <span className="text-xs font-semibold text-on-surface mt-1">{categories.length} Cron Job Nodes</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeOuterTab === 'tracking' && (
          <div className="flex flex-col gap-6">
            
            {/* Inner Sub-Tab Selector for Tracking */}
            <div className="flex border-b border-outline-variant/15 gap-4">
              {[
                { id: 'products', label: 'Product Price Alerts' },
                { id: 'categories', label: 'Category Scanners' },
                { id: 'comparisons', label: 'Cross-Border Comparisons' },
              ].map(subTab => (
                <button
                  key={subTab.id}
                  onClick={() => setActiveTrackingTab(subTab.id as any)}
                  className={`pb-2 text-[11px] font-semibold uppercase tracking-wider transition-all border-b-2 -mb-[2px] ${
                    activeTrackingTab === subTab.id
                      ? 'text-secondary border-secondary'
                      : 'text-on-surface-variant border-transparent hover:text-on-surface'
                  }`}
                >
                  {subTab.label}
                </button>
              ))}
            </div>

            {/* Inner Sub-Tab Content */}
            <div>
              {activeTrackingTab === 'products' && (
                <div className="glass-panel p-6 rounded-xl border border-outline-variant/30 flex flex-col">
                  <div className="flex items-center justify-between mb-4 border-b border-outline-variant/20 pb-4">
                    <div className="flex items-center gap-2 text-primary">
                      <ShoppingCart size={16} />
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-on-surface">Live Tracked Products</h2>
                    </div>
                    <button 
                      onClick={fetchData} 
                      className="p-1.5 rounded bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-on-surface transition-all"
                    >
                      <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1 hide-scrollbar">
                    {isLoading ? (
                      <div className="text-xs text-on-surface-variant/60 text-center py-8">Loading active trackers...</div>
                    ) : products.length === 0 ? (
                      <div className="text-xs text-on-surface-variant/60 text-center py-8">
                        You aren't tracking any products yet.
                      </div>
                    ) : (
                      <AnimatePresence>
                        {products.map(p => (
                          <motion.div 
                            key={p.id} 
                            initial={{ opacity: 0, scale: 0.98 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            className="flex-shrink-0 flex flex-col rounded-xl bg-surface-container-low/30 border border-outline-variant/20 hover:border-primary/30 transition-all overflow-hidden group"
                          >
                            <div 
                              className="flex items-center justify-between p-4 cursor-pointer"
                              onClick={() => handleProductClick(p.id)}
                            >
                              <div className="flex flex-col gap-1 overflow-hidden flex-1 pr-4">
                                <span className="text-xs md:text-sm font-semibold text-on-surface truncate">{decodeHTMLEntities(p.title) || p.url}</span>
                                <a href={p.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[10px] font-data-mono text-on-surface-variant hover:text-primary flex items-center gap-1 w-fit transition-colors">
                                  VIEW_SOURCE <ExternalLink size={10} />
                                </a>
                              </div>
                              <div className="flex items-center gap-5 text-right flex-shrink-0">
                                <div className="flex flex-col items-end">
                                  <span className="text-[9px] font-semibold text-on-surface-variant/60 uppercase tracking-wider">Target</span>
                                  <span className="text-xs font-semibold text-secondary font-data-mono">{p.targetPrice} {p.currency}</span>
                                </div>
                                <div className="flex flex-col items-end w-16">
                                  <span className="text-[9px] font-semibold text-on-surface-variant/60 uppercase tracking-wider">Current</span>
                                  <span className="text-xs font-semibold text-on-surface font-data-mono">{p.lastKnownPrice} {p.currency}</span>
                                </div>
                                <div className="text-on-surface-variant p-1 flex-shrink-0">
                                  {expandedProductId === p.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </div>
                              </div>
                            </div>
                            
                            <AnimatePresence>
                              {expandedProductId === p.id && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }} 
                                  animate={{ height: 'auto', opacity: 1 }} 
                                  exit={{ height: 0, opacity: 0 }}
                                  className="px-4 pb-4 border-t border-outline-variant/20 pt-4 bg-surface-container-low/20"
                                >
                                  <h4 className="text-[10px] font-semibold text-on-surface-variant mb-2 uppercase tracking-wider font-data-mono">Price History Feed</h4>
                                  {priceHistoryData.length === 0 ? (
                                    <div className="text-xs text-on-surface-variant/50">Not enough history data yet.</div>
                                  ) : (
                                    <div className="w-full h-36">
                                      <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={priceHistoryData}>
                                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(60, 73, 76, 0.15)" />
                                          <XAxis 
                                            dataKey="checkedAt" 
                                            tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
                                            stroke="rgba(187, 201, 205, 0.4)" 
                                            fontSize={9} 
                                            fontFamily="JetBrains Mono"
                                          />
                                          <YAxis 
                                            domain={['auto', 'auto']}
                                            stroke="rgba(187, 201, 205, 0.4)" 
                                            fontSize={9}
                                            fontFamily="JetBrains Mono"
                                            width={35}
                                          />
                                          <Tooltip 
                                            contentStyle={{ backgroundColor: '#191f31', borderColor: '#3c494c', borderRadius: '8px' }}
                                            itemStyle={{ color: '#22d3ee', fontSize: '11px', fontFamily: 'JetBrains Mono', fontWeight: 'bold' }}
                                            labelFormatter={(label) => new Date(label).toLocaleString()}
                                            labelStyle={{ color: '#bbc9cd', fontSize: '9px', fontFamily: 'JetBrains Mono' }}
                                          />
                                          <Line type="monotone" dataKey="price" stroke="#22d3ee" strokeWidth={1.5} dot={{ r: 2, fill: '#22d3ee' }} activeDot={{ r: 4 }} />
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
              )}

              {activeTrackingTab === 'categories' && (
                <div className="glass-panel p-6 rounded-xl border border-outline-variant/30 flex flex-col">
                  <div className="flex items-center justify-between mb-4 border-b border-outline-variant/20 pb-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Search size={16} />
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-on-surface">Tracked Categories</h2>
                    </div>
                    <button 
                      onClick={fetchData} 
                      className="p-1.5 rounded bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-on-surface transition-all"
                    >
                      <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1 hide-scrollbar">
                    {isLoading ? (
                      <div className="text-xs text-on-surface-variant/60 text-center py-8">Loading active categories...</div>
                    ) : categories.length === 0 ? (
                      <div className="text-xs text-on-surface-variant/60 text-center py-8">
                        You aren't tracking any search categories yet.
                      </div>
                    ) : (
                      <AnimatePresence>
                        {categories.map(c => (
                          <motion.div 
                            key={c.id} 
                            initial={{ opacity: 0, scale: 0.98 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            className="flex-shrink-0 flex items-center justify-between p-4 rounded-xl bg-surface-container-low/30 border border-outline-variant/20 hover:border-primary/30 transition-all group"
                          >
                            <div className="flex flex-col gap-1 overflow-hidden pr-4">
                              <span className="text-xs md:text-sm font-semibold text-on-surface truncate">{decodeHTMLEntities(c.categoryName) || 'Unnamed Category'}</span>
                              <a href={c.categoryUrl} target="_blank" rel="noreferrer" className="text-[10px] font-data-mono text-on-surface-variant hover:text-primary flex items-center gap-1 w-fit transition-colors">
                                SEARCH_LINK <ExternalLink size={10} />
                              </a>
                            </div>
                            <div className="flex items-center gap-4 text-right flex-shrink-0">
                              <div className="flex flex-col items-end">
                                <span className="text-[9px] font-semibold text-on-surface-variant/60 uppercase tracking-wider">Min Discount</span>
                                <span className="text-xs font-semibold text-secondary font-data-mono">%{c.minDiscountPercentage}</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                  </div>
                </div>
              )}

              {activeTrackingTab === 'comparisons' && (
                <div className="glass-panel p-6 rounded-xl border border-outline-variant/30 flex flex-col">
                  <div className="flex items-center justify-between mb-4 border-b border-outline-variant/20 pb-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Activity size={16} />
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-on-surface">Cross-Border Comparisons</h2>
                    </div>
                    <button 
                      onClick={fetchData} 
                      className="p-1.5 rounded bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-on-surface transition-all"
                    >
                      <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-1 hide-scrollbar">
                    {isLoading ? (
                      <div className="text-xs text-on-surface-variant/60 text-center py-8">Loading comparisons...</div>
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
                          <div className="text-xs text-on-surface-variant/60 text-center py-8">
                            You don't have any active cross-border comparison groups. Ask the AI to compare stores!
                          </div>
                        );
                      }

                      return (
                        <AnimatePresence>
                          {comparisonGroups.map((group, idx) => (
                            <motion.div 
                              key={idx} 
                              initial={{ opacity: 0, scale: 0.98 }} 
                              animate={{ opacity: 1, scale: 1 }} 
                              className="flex-shrink-0 flex flex-col p-4 rounded-xl bg-surface-container-low/30 border border-outline-variant/20 hover:border-primary/30 transition-all"
                            >
                              <div className="text-[10px] font-semibold text-on-surface-variant mb-4 text-center tracking-widest uppercase border-b border-outline-variant/20 pb-2 font-data-mono">
                                COMPARISON // BATTLE
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 text-center bg-surface-container-high/40 border border-outline-variant/25 rounded-lg p-4 relative overflow-hidden group">
                                  <span className="block text-xs md:text-sm font-semibold text-on-surface mb-1">{decodeHTMLEntities(group[0].categoryName) || 'Store A'}</span>
                                  <a href={group[0].categoryUrl} target="_blank" rel="noreferrer" className="text-[10px] font-data-mono text-on-surface-variant hover:text-primary inline-flex items-center gap-1 relative z-10 transition-colors">
                                    VIEW_STORE <ExternalLink size={10} />
                                  </a>
                                </div>

                                <div className="flex-shrink-0 flex flex-col items-center">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/40 flex items-center justify-center shadow-lg">
                                    <span className="text-[10px] font-bold text-primary">VS</span>
                                  </div>
                                  <span className="text-[9px] text-on-surface-variant/70 mt-2 font-semibold whitespace-nowrap font-data-mono">DIFF: {group[0].minDiscountPercentage}%</span>
                                </div>

                                <div className="flex-1 text-center bg-surface-container-high/40 border border-outline-variant/25 rounded-lg p-4 relative overflow-hidden group">
                                  <span className="block text-xs md:text-sm font-semibold text-on-surface mb-1">{decodeHTMLEntities(group[1].categoryName) || 'Store B'}</span>
                                  <a href={group[1].categoryUrl} target="_blank" rel="noreferrer" className="text-[10px] font-data-mono text-on-surface-variant hover:text-primary inline-flex items-center gap-1 relative z-10 transition-colors">
                                    VIEW_STORE <ExternalLink size={10} />
                                  </a>
                                </div>
                              </div>
                              {group.length > 2 && (
                                <div className="mt-3 text-[10px] text-on-surface-variant/50 text-center font-data-mono">
                                  + {group.length - 2} contender nodes in comparison block
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeOuterTab === 'activity' && (
          <div className="flex flex-col gap-6">
            
            {/* Inner Sub-Tab Selector for Activity */}
            <div className="flex border-b border-outline-variant/15 gap-4">
              {[
                { id: 'notifications', label: 'Notification History' },
                { id: 'system', label: 'Diagnostics Log Summary' },
              ].map(subTab => (
                <button
                  key={subTab.id}
                  onClick={() => setActiveActivityTab(subTab.id as any)}
                  className={`pb-2 text-[11px] font-semibold uppercase tracking-wider transition-all border-b-2 -mb-[2px] ${
                    activeActivityTab === subTab.id
                      ? 'text-secondary border-secondary'
                      : 'text-on-surface-variant border-transparent hover:text-on-surface'
                  }`}
                >
                  {subTab.label}
                </button>
              ))}
            </div>

            {/* Inner Sub-Tab Content */}
            <div>
              {activeActivityTab === 'notifications' && (
                <div className="glass-panel p-6 rounded-xl border border-outline-variant/30 flex flex-col">
                  <div className="flex items-center justify-between mb-4 border-b border-outline-variant/20 pb-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Mail size={16} />
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-on-surface">Notification History</h2>
                    </div>
                    <button 
                      onClick={fetchData} 
                      className="p-1.5 rounded bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-on-surface transition-all"
                    >
                      <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1 hide-scrollbar">
                    {isLoading ? (
                      <div className="text-xs text-on-surface-variant/60 text-center py-8">Loading history...</div>
                    ) : logs.length === 0 ? (
                      <div className="text-xs text-on-surface-variant/60 text-center py-8">
                        No notifications sent yet.
                      </div>
                    ) : (
                      <AnimatePresence>
                        {logs.map(log => (
                          <motion.div 
                            key={log.id} 
                            initial={{ opacity: 0, scale: 0.98 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            className="flex-shrink-0 flex flex-col p-4 rounded-xl bg-surface-container-low/30 border border-outline-variant/20 hover:border-primary/30 transition-all"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[9px] font-semibold text-primary uppercase tracking-wider font-data-mono">{log.type}</span>
                              <span className="text-[10px] text-on-surface-variant/50 font-data-mono">{new Date(log.sentAt).toLocaleString()}</span>
                            </div>
                            <div className="text-xs md:text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">{log.message}</div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                  </div>
                </div>
              )}

              {activeActivityTab === 'system' && (
                <div className="glass-panel p-6 rounded-xl border border-outline-variant/30 flex flex-col">
                  <div className="flex items-center justify-between mb-4 border-b border-outline-variant/20 pb-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Activity size={16} />
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-on-surface">Diagnostics Log Summary</h2>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs md:text-sm text-on-surface-variant leading-relaxed">
                    <p>Below is a summary of the current active scraping tasks and data collection records in the system:</p>
                    <div className="border border-outline-variant/20 rounded-lg overflow-hidden bg-surface-container-low/20">
                      <table className="min-w-full divide-y divide-outline-variant/20">
                        <thead className="bg-surface-container-high/40">
                          <tr>
                            <th className="px-4 py-2 text-left text-[9px] font-semibold uppercase tracking-wider text-on-surface-variant">Module</th>
                            <th className="px-4 py-2 text-left text-[9px] font-semibold uppercase tracking-wider text-on-surface-variant">Log Details</th>
                            <th className="px-4 py-2 text-left text-[9px] font-semibold uppercase tracking-wider text-on-surface-variant">Metric status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10 text-[11px] font-data-mono">
                          <tr>
                            <td className="px-4 py-3 text-on-surface font-semibold">Playwright Scraper</td>
                            <td className="px-4 py-3 text-on-surface-variant">Scraping node successfully launched.</td>
                            <td className="px-4 py-3 text-secondary">OK (0 Errors)</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 text-on-surface font-semibold">Gemini Intelligence</td>
                            <td className="px-4 py-3 text-on-surface-variant">Processing and summarizing deal notifications.</td>
                            <td className="px-4 py-3 text-secondary">ACTIVE</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 text-on-surface font-semibold">Hangfire Scheduler</td>
                            <td className="px-4 py-3 text-on-surface-variant">Executing category tracker cron nodes.</td>
                            <td className="px-4 py-3 text-primary">RUNNING</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
