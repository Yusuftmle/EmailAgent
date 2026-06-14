import React, { useState, useEffect, useRef } from 'react';
import { apiService, TrackedProduct, TrackedCategory, NotificationLog } from './services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { DailySummary } from './components/DailySummary';
import { PreferencesPage } from './components/PreferencesPage';
import { ChatBot } from './components/ChatBot';
import { CommandCenter } from './components/CommandCenter';
import { ChatView } from './components/ChatView';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import AgendaPage from './components/AgendaPage';
import { SystemDiagnostics } from './components/SystemDiagnostics';
import { DashboardAnalytics } from './components/DashboardAnalytics';

// Marketing imports
import { MarketingLayout } from './components/MarketingLayout';
import LandingPage from './components/LandingPage';
import SolutionsPage from './components/SolutionsPage';
import PricingPage from './components/PricingPage';
import CaseStudiesPage from './components/CaseStudiesPage';
import ApiDocsPage from './components/ApiDocsPage';


// ═══════════════════════════════════════════════════════
// AEGIS V3.0 — Professional Command Cockpit Shell
// Sidebar (Desktop) + Bottom Nav (Mobile) + TopBar
// ═══════════════════════════════════════════════════════

type ViewType = 'dashboard' | 'chat' | 'agenda' | 'plugins' | 'preferences' | 'diagnostics' | 'archives';

// ── Sidebar Navigation Items ──
const sidebarNav = [
  { id: 'dashboard',   label: 'Dashboard',   icon: 'monitoring' },
  { id: 'chat',        label: 'Command',     icon: 'terminal' },
  { id: 'agenda',      label: 'Calendar',    icon: 'calendar_month' },
  { id: 'plugins',     label: 'Email Hub',   icon: 'mail' },
  { id: 'diagnostics', label: 'Diagnostics', icon: 'analytics' },
  { id: 'archives',    label: 'Archives',    icon: 'archive' },
] as const;

// ── Bottom Nav Items (Mobile) ──
const bottomNav = [
  { id: 'dashboard', label: 'Dashboard', icon: 'analytics' },
  { id: 'chat',      label: 'Command',   icon: 'terminal' },
  { id: 'agenda',    label: 'Schedule',   icon: 'event_note' },
  { id: 'plugins',   label: 'Analysis',   icon: 'query_stats' },
] as const;

// ── Material Symbols Icon Component ──
const MIcon: React.FC<{ name: string; fill?: boolean; className?: string; size?: number }> = 
  ({ name, fill = false, className = '', size = 20 }) => (
  <span 
    className={`material-symbols-outlined ${className}`} 
    style={{ 
      fontSize: size, 
      fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0" 
    }}
  >
    {name}
  </span>
);

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

export const AppLayout: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);

  const handleTriggerPipeline = async () => {
    if (isRunningPipeline) return;
    setIsRunningPipeline(true);
    try {
      await apiService.triggerJobNow();
      alert("Aegis scraping pipeline triggered successfully!");
    } catch (err) {
      console.error("Failed to run pipeline:", err);
      alert("Failed to trigger pipeline. Please verify API is running.");
    } finally {
      setIsRunningPipeline(false);
    }
  };
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; type: 'product' | 'category'; title: string; url: string }[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Dynamic user data
  const [userProfile] = useState<{ name: string; email: string }>(() => {
    try {
      const uStr = localStorage.getItem('user');
      if (uStr) {
        const u = JSON.parse(uStr);
        return {
          name: u.name || u.Name || 'Dev Admin',
          email: u.email || u.Email || 'admin@aegis.com'
        };
      }
    } catch(e) {}
    return { name: 'Dev Admin', email: 'admin@aegis.com' };
  });

  // Dynamic notifications & search items
  const [recentNotifications, setRecentNotifications] = useState<NotificationLog[]>([]);
  const [productsList, setProductsList] = useState<TrackedProduct[]>([]);
  const [categoriesList, setCategoriesList] = useState<TrackedCategory[]>([]);

  useEffect(() => {
    const loadHeaderData = async () => {
      try {
        const uid = getUserId();
        const [p, c, n] = await Promise.all([
          apiService.getTrackedProducts(uid),
          apiService.getTrackedCategories(uid),
          apiService.getNotificationLogs(uid)
        ]);
        setProductsList(p);
        setCategoriesList(c);
        setRecentNotifications(n);
      } catch (err) {
        console.error("Header data load failed:", err);
      }
    };
    loadHeaderData();

    // Set up timer to check notifications periodically
    const interval = setInterval(loadHeaderData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowSearchDropdown(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showSearchDropdown && target && !target.closest('.search-container')) {
        setShowSearchDropdown(false);
      }
      if (showNotificationsDropdown && target && !target.closest('.notifications-container')) {
        setShowNotificationsDropdown(false);
      }
      if (showProfileDropdown && target && !target.closest('.profile-container')) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSearchDropdown, showNotificationsDropdown, showProfileDropdown]);

  // Handle Search input change
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    const query = val.toLowerCase();
    const matches: { id: string; type: 'product' | 'category'; title: string; url: string }[] = [];
    
    productsList.forEach(p => {
      if (p.title.toLowerCase().includes(query)) {
        matches.push({ id: p.id, type: 'product', title: p.title, url: p.url });
      }
    });

    categoriesList.forEach(c => {
      if (c.categoryName.toLowerCase().includes(query)) {
        matches.push({ id: c.id, type: 'category', title: c.categoryName, url: c.categoryUrl });
      }
    });

    setSearchResults(matches);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#020617] text-on-surface font-sans">

      {/* ═══ Global Background Layers ═══ */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-secondary/5 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-40" />
      </div>

      {/* ═══ DESKTOP SIDEBAR (hidden on mobile) ═══ */}
      <aside className="hidden md:flex flex-col h-screen w-64 flex-shrink-0 bg-surface-container-low/60 backdrop-blur-sm border-r border-outline-variant/20 z-40 py-6 relative">
        
        {/* ── Brand Header ── */}
        <div className="px-6 mb-8 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center border border-outline-variant/30 relative">
              <MIcon name="shield_with_heart" fill className="text-primary" size={22} />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-secondary rounded-full">
                <div className="w-full h-full rounded-full bg-secondary signal-pulse" />
              </div>
            </div>
            <div>
              <h2 className="font-semibold text-headline-md text-[18px] text-primary tracking-tight">Aegis V3.0</h2>
              <p className="font-data-mono text-[10px] text-on-surface-variant">CORE_V3.0 // ONLINE</p>
            </div>
          </div>
        </div>

        {/* ── Navigation Links ── */}
        <nav className="flex-1 px-4 flex flex-col gap-1">
          {sidebarNav.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as ViewType)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group text-left w-full ${
                currentView === item.id
                  ? 'bg-secondary/10 text-secondary border-r-2 border-secondary relative overflow-hidden'
                  : 'text-on-surface-variant hover:text-secondary/70 hover:bg-white/5 hover:translate-x-1'
              }`}
            >
              {currentView === item.id && (
                <div className="absolute inset-0 shimmer-bg opacity-30" />
              )}
              <MIcon 
                name={item.icon} 
                fill={currentView === item.id} 
                className={`relative z-10 ${currentView === item.id ? 'text-secondary' : 'group-hover:text-secondary'} transition-colors`} 
                size={18} 
              />
              <span className="text-[11px] font-semibold uppercase tracking-wider relative z-10">
                {item.label}
              </span>
            </button>
          ))}

          <button
            onClick={() => setCurrentView('preferences')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group text-left w-full mt-1 ${
              currentView === 'preferences'
                ? 'bg-secondary/10 text-secondary border-r-2 border-secondary'
                : 'text-on-surface-variant hover:text-secondary/70 hover:bg-white/5 hover:translate-x-1'
            }`}
          >
            <MIcon name="settings" fill={currentView === 'preferences'} className="group-hover:text-secondary transition-colors" size={18} />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Settings</span>
          </button>
        </nav>

        {/* ── CTA & Footer ── */}
        <div className="mt-auto px-4 flex flex-col gap-4">
          <button 
            onClick={handleTriggerPipeline}
            disabled={isRunningPipeline}
            className="w-full py-3 bg-secondary/10 border border-secondary/30 text-secondary text-[11px] font-semibold uppercase tracking-wider rounded-lg hover:bg-secondary hover:text-on-secondary transition-colors flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            <MIcon 
              name="bolt" 
              fill 
              className={isRunningPipeline ? 'animate-spin' : 'group-hover:animate-spin'} 
              size={16} 
            />
            {isRunningPipeline ? 'RUNNING...' : 'RUN PIPELINE'}
          </button>

          <div className="border-t border-outline-variant/20 pt-4 flex flex-col gap-1">
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); setShowSupportModal(true); }}
              className="flex items-center gap-3 px-4 py-2 rounded-lg text-on-surface-variant hover:text-secondary/70 hover:bg-white/5 transition-all group"
            >
              <MIcon name="help" className="opacity-70 group-hover:opacity-100" size={16} />
              <span className="font-data-mono text-[11px] opacity-80 group-hover:opacity-100">Support</span>
            </a>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); setCurrentView('diagnostics'); }}
              className="flex items-center gap-3 px-4 py-2 rounded-lg text-on-surface-variant hover:text-secondary/70 hover:bg-white/5 transition-all group"
            >
              <MIcon name="terminal" className="opacity-70 group-hover:opacity-100" size={16} />
              <span className="font-data-mono text-[11px] opacity-80 group-hover:opacity-100">Logs</span>
            </a>
          </div>

          {/* ── Logout ── */}
          <button
            onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-tertiary-container hover:text-tertiary hover:bg-tertiary-container/10 transition-all group text-left w-full"
          >
            <MIcon name="logout" className="opacity-70 group-hover:opacity-100" size={16} />
            <span className="font-data-mono text-[11px] opacity-80 group-hover:opacity-100">Log out</span>
          </button>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT WRAPPER ═══ */}
      <div className="flex-1 flex flex-col min-w-0 h-screen relative z-10">

        {/* ═══ TOP NAVIGATION BAR ═══ */}
        <header className="w-full sticky top-0 z-30 bg-surface/40 backdrop-blur-md border-b border-outline-variant/30 flex justify-between items-center px-4 md:px-8 h-14">
          <div className="flex items-center gap-6">
            {/* Mobile: Show logo text */}
            <div className="flex md:hidden items-center gap-2">
              <MIcon name="shield_with_heart" fill className="text-primary" size={22} />
              <span className="font-semibold text-primary text-[16px] tracking-tight uppercase">AEGIS V3.0</span>
            </div>

            {/* Desktop: Nav Tabs */}
            <nav className="hidden lg:flex items-center gap-1 h-full">
              {[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'chat',      label: 'Command' },
                { id: 'plugins',   label: 'Email Hub' },
                { id: 'agenda',    label: 'Calendar' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as ViewType)}
                  className={`px-4 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors rounded-t-md ${
                    currentView === item.id
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative hidden md:block w-56 search-container">
              <MIcon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setShowSearchDropdown(true)}
                className="w-full bg-surface-container-lowest/50 border border-outline-variant/40 rounded-lg py-1.5 pl-9 pr-3 font-data-mono text-[12px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                placeholder="Search parameters..."
                type="text"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/30 text-[9px] font-data-mono text-on-surface-variant/70">⌘K</div>

              {/* Search Dropdown */}
              {showSearchDropdown && searchQuery.trim() && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-surface-container border border-outline-variant/30 rounded-xl shadow-2xl z-50 overflow-hidden font-sans">
                  <div className="p-3 border-b border-outline-variant/20 bg-surface-container-low flex justify-between items-center">
                    <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest font-data-mono">Search Results ({searchResults.length})</span>
                    <button onClick={() => setShowSearchDropdown(false)} className="text-[10px] text-on-surface-variant hover:text-on-surface">Close</button>
                  </div>
                  <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                    {searchResults.length === 0 ? (
                      <div className="p-4 text-center text-xs text-on-surface-variant/60">No results found for "{searchQuery}"</div>
                    ) : (
                      searchResults.map(res => (
                        <div 
                          key={`${res.type}-${res.id}`}
                          onClick={() => {
                            window.open(res.url, '_blank');
                            setShowSearchDropdown(false);
                            setSearchQuery('');
                          }}
                          className="p-2 rounded-lg bg-surface-container-low/40 hover:bg-primary/10 border border-outline-variant/10 hover:border-primary/35 transition-all cursor-pointer flex justify-between items-center group text-left"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <span className="block text-xs font-semibold text-on-surface truncate group-hover:text-primary transition-colors">{res.title}</span>
                            <span className="block text-[9px] font-data-mono text-on-surface-variant/80 uppercase mt-0.5 tracking-wider">{res.type}</span>
                          </div>
                          <span className="material-symbols-outlined text-on-surface-variant/50 group-hover:text-primary transition-colors" style={{ fontSize: 16 }}>open_in_new</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative notifications-container">
              <button 
                onClick={() => {
                  setShowNotificationsDropdown(!showNotificationsDropdown);
                  setShowProfileDropdown(false);
                  setShowSearchDropdown(false);
                }}
                className={`p-2 rounded-full hover:bg-white/5 transition-colors relative ${showNotificationsDropdown ? 'text-primary bg-white/5' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                <MIcon name="notifications_active" size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border border-surface" />
              </button>

              {/* Notifications Dropdown */}
              {showNotificationsDropdown && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-surface-container border border-outline-variant/30 rounded-xl shadow-2xl z-50 overflow-hidden font-sans">
                  <div className="p-3 border-b border-outline-variant/20 bg-surface-container-low flex justify-between items-center">
                    <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest font-data-mono">Recent Operations Logs</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-3 space-y-3">
                    {recentNotifications.length === 0 ? (
                      <div className="text-center text-xs text-on-surface-variant/50 py-8 italic">No notifications logs recorded yet.</div>
                    ) : (
                      recentNotifications.slice(0, 5).map((log, idx) => {
                        const timeStr = new Date(log.sentAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                        const cleanMsg = log.message.replace(/\*\*|🚨|⏰|🌍|🥇|🥈|🏆/g, '').trim();
                        return (
                          <div key={log.id || idx} className="flex gap-2 items-start border-b border-outline-variant/10 pb-2 last:border-0 last:pb-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                            <div className="min-w-0 flex-1 text-left">
                              <div className="flex justify-between items-baseline gap-2">
                                <span className="text-[9px] font-data-mono text-primary/80 uppercase font-semibold">{log.type}</span>
                                <span className="text-[8px] font-data-mono text-on-surface-variant/50">{timeStr}</span>
                              </div>
                              <p className="text-[11px] text-on-surface-variant leading-snug mt-0.5 break-words">{cleanMsg}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div 
                    onClick={() => {
                      setCurrentView('archives');
                      setShowNotificationsDropdown(false);
                    }}
                    className="p-3 bg-surface-container-low/80 border-t border-outline-variant/20 text-center font-data-mono text-[10px] text-primary hover:text-primary-container font-semibold tracking-wider cursor-pointer uppercase transition-colors"
                  >
                    VIEW ALL SYSTEM LOGS
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => {
                setCurrentView('preferences');
                setShowNotificationsDropdown(false);
                setShowProfileDropdown(false);
                setShowSearchDropdown(false);
              }}
              className="p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
              title="System Settings"
            >
              <MIcon name="settings" size={18} />
            </button>

            {/* Profile Dropdown */}
            <div className="relative profile-container">
              <button 
                onClick={() => {
                  setShowProfileDropdown(!showProfileDropdown);
                  setShowNotificationsDropdown(false);
                  setShowSearchDropdown(false);
                }}
                className={`p-2 rounded-full hover:bg-white/5 transition-colors ${showProfileDropdown ? 'text-primary bg-white/5' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                <MIcon name="account_circle" size={18} />
              </button>

              {showProfileDropdown && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-surface-container border border-outline-variant/30 rounded-xl shadow-2xl z-50 overflow-hidden font-sans">
                  <div className="p-4 bg-surface-container-low flex items-center gap-3 border-b border-outline-variant/20">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
                      {userProfile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <span className="block text-xs font-semibold text-on-surface truncate">{userProfile.name}</span>
                      <span className="block text-[10px] text-on-surface-variant truncate">{userProfile.email}</span>
                    </div>
                  </div>
                  <div className="p-2 space-y-0.5">
                    <button
                      onClick={() => {
                        setCurrentView('preferences');
                        setShowProfileDropdown(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">settings</span>
                      <span>System Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        setCurrentView('diagnostics');
                        setShowProfileDropdown(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">analytics</span>
                      <span>Diagnostics Hub</span>
                    </button>
                    <div className="border-t border-outline-variant/15 my-1" />
                    <button
                      onClick={() => {
                        localStorage.clear();
                        window.location.href = '/login';
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs text-error hover:bg-error/10 transition-all font-semibold"
                    >
                      <span className="material-symbols-outlined text-[16px]">logout</span>
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ═══ MAIN CONTENT AREA ═══ */}
        <main className="flex-1 overflow-y-auto z-10 relative">
          <div className="max-w-[1920px] mx-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="w-full"
              >
                {currentView === 'dashboard'   && <CommandCenter onNavigate={(view) => setCurrentView(view as ViewType)} />}
                {currentView === 'chat'         && <ChatView />}
                {currentView === 'agenda'       && <AgendaPage />}
                {currentView === 'plugins'      && <DailySummary onGoToPreferences={() => setCurrentView('preferences')} />}
                {currentView === 'preferences'  && <PreferencesPage onBackToDashboard={() => setCurrentView('dashboard')} />}
                {currentView === 'diagnostics'  && <SystemDiagnostics />}
                {currentView === 'archives'     && <DashboardAnalytics userId={getUserId()} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* ═══ FLOATING CHATBOT WIDGET (Desktop only) ═══ */}
      <div className="hidden md:block">
        {currentView !== 'chat' && <ChatBot />}
      </div>

      {/* ═══ MOBILE BOTTOM NAV BAR ═══ */}
      <nav className="bottom-nav flex md:hidden items-center justify-around py-2 px-2">
        {bottomNav.map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id as ViewType)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[60px] ${
              currentView === item.id
                ? 'text-primary bg-primary/10'
                : 'text-on-surface-variant'
            }`}
          >
            <MIcon 
              name={item.icon} 
              fill={currentView === item.id} 
              size={20} 
            />
            <span className="text-[9px] font-semibold uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
        <button
          onClick={() => setCurrentView('preferences')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[60px] ${
            currentView === 'preferences'
              ? 'text-primary bg-primary/10'
              : 'text-on-surface-variant'
          }`}
        >
          <MIcon name="settings" fill={currentView === 'preferences'} size={20} />
          <span className="text-[9px] font-semibold uppercase tracking-wider">System</span>
        </button>
      </nav>

      {/* ═══ SUPPORT MODAL ═══ */}
      <AnimatePresence>
        {showSupportModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-6 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface-container border border-outline-variant/30 rounded-2xl w-full max-w-md p-6 shadow-2xl relative font-sans text-left"
            >
              <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <span className="material-symbols-outlined text-[22px]">help</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface">Aegis Operations Support</h3>
                  <span className="font-data-mono text-[9px] text-on-surface-variant uppercase tracking-wider block mt-0.5">CORE_VERSION // V3.0.4</span>
                </div>
              </div>
              
              <div className="space-y-4 text-xs md:text-sm text-on-surface-variant/90 leading-relaxed">
                <p>Aegis V3.0 is a local cognitive intelligence environment. If you encounter any bugs, please check the local server console diagnostics or contact the Aegis Dev team.</p>
                
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-2">
                  <span className="block font-data-mono text-[10px] text-primary uppercase font-bold tracking-wider">Operational Info:</span>
                  <div className="flex justify-between items-center text-xs">
                    <span>Active User ID:</span>
                    <span className="font-data-mono text-on-surface font-semibold truncate max-w-[180px]">{getUserId()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>API Endpoint:</span>
                    <span className="font-data-mono text-on-surface font-semibold">http://localhost:5209</span>
                  </div>
                </div>
                
                <div className="text-[11px] text-on-surface-variant/65">
                  Telegram notifications and automated alert parameters can be adjusted directly from the <strong>Settings</strong> page.
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowSupportModal(false)}
                  className="px-5 py-2 rounded-lg bg-primary/10 border border-primary/30 hover:bg-primary hover:text-on-primary text-primary font-semibold text-xs transition-all uppercase tracking-wider"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


const RequireAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('jwt');
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicOnly: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('jwt');
  return isAuthenticated ? <Navigate to="/app" replace /> : children;
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Marketing Routes wrapped under MarketingLayout */}
      <Route path="/" element={<MarketingLayout><LandingPage /></MarketingLayout>} />
      <Route path="/solutions" element={<MarketingLayout><SolutionsPage /></MarketingLayout>} />
      <Route path="/pricing" element={<MarketingLayout><PricingPage /></MarketingLayout>} />
      <Route path="/case-studies" element={<MarketingLayout><CaseStudiesPage /></MarketingLayout>} />
      <Route path="/docs" element={<MarketingLayout><ApiDocsPage /></MarketingLayout>} />

      {/* Authentication */}
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />

      {/* Private Cockpit Operations App Shell */}
      <Route path="/app/*" element={<RequireAuth><AppLayout /></RequireAuth>} />

      {/* Fallback redirects to Landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
