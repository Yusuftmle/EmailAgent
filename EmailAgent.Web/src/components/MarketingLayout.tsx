import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Shield, ArrowRight } from 'lucide-react';

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export const MarketingLayout: React.FC<MarketingLayoutProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem('jwt');

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { label: 'Platform', path: '/' },
    { label: 'Solutions', path: '/solutions' },
    { label: 'Pricing', path: '/pricing' },
    { label: 'Case Studies', path: '/case-studies' },
    { label: 'API Docs', path: '/docs' }
  ];

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] min-h-screen font-sans antialiased selection:bg-cyan-500/30 selection:text-slate-900 relative">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#f7f9fb]/80 backdrop-blur-xl border-b border-slate-200 shadow-sm transition-all duration-200">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link to="/" className="text-xl md:text-2xl font-bold text-[#0f172a] tracking-tight flex items-center gap-2 select-none">
            <Shield className="text-[#06b6d4] fill-[#06b6d4]/10" size={24} />
            <span>Aegis V3.0</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`font-semibold text-sm transition-colors duration-200 ${
                    active
                      ? 'text-[#0f172a] border-b-2 border-[#06b6d4] pb-1'
                      : 'text-slate-600 hover:text-[#0f172a]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/app')}
                className="bg-[#0f172a] text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-slate-800 transition-all duration-200 active:scale-95 shadow-sm flex items-center gap-1.5"
              >
                <span>Go to Cockpit</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="text-sm font-semibold text-slate-600 hover:text-[#0f172a] transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-[#0f172a] text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-slate-800 transition-all duration-200 active:scale-95 shadow-sm"
                >
                  Get Started
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-slate-700 hover:text-slate-900 p-2 focus:outline-none"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isOpen && (
          <div className="md:hidden bg-[#f7f9fb] border-b border-slate-200 absolute w-full left-0 z-40 px-6 py-4 flex flex-col gap-4 shadow-lg animate-fadeIn">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`font-semibold text-base py-1 border-b border-slate-100 last:border-none ${
                    active ? 'text-[#06b6d4]' : 'text-slate-600 hover:text-[#0f172a]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="flex flex-col gap-3 pt-2">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/app');
                  }}
                  className="w-full bg-[#0f172a] text-white font-semibold py-3 rounded-xl hover:bg-slate-800 text-center text-sm shadow"
                >
                  Go to Cockpit
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/login');
                    }}
                    className="w-full border border-slate-300 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-100 text-center text-sm"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/login');
                    }}
                    className="w-full bg-[#0f172a] text-white font-semibold py-3 rounded-xl hover:bg-slate-800 text-center text-sm shadow"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Wrapper */}
      <main className="min-h-[calc(100vh-80px)]">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-16 w-full text-slate-500">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="text-lg font-bold text-[#0f172a] flex items-center gap-2 mb-4">
              <Shield className="text-[#06b6d4] fill-[#06b6d4]/10" size={20} />
              <span>Aegis V3.0</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-500 max-w-xs">
              The cognitive intelligence layer for autonomous communication and product tracking. Watching, analyzing, and alerting.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <span className="font-bold text-slate-800 text-sm mb-1">Platform</span>
            <Link to="/" className="text-sm hover:text-[#0f172a] transition-colors">Features</Link>
            <Link to="/solutions" className="text-sm hover:text-[#0f172a] transition-colors">Solutions</Link>
            <Link to="/docs" className="text-sm hover:text-[#0f172a] transition-colors">API Documentation</Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className="font-bold text-slate-800 text-sm mb-1">Company</span>
            <Link to="/pricing" className="text-sm hover:text-[#0f172a] transition-colors">Pricing</Link>
            <Link to="/case-studies" className="text-sm hover:text-[#0f172a] transition-colors">Case Studies</Link>
            <a href="#" className="text-sm hover:text-[#0f172a] transition-colors">Privacy Policy</a>
          </div>
          <div className="flex flex-col gap-3">
            <span className="font-bold text-slate-800 text-sm mb-1">Legal</span>
            <a href="#" className="text-sm hover:text-[#0f172a] transition-colors">Terms of Service</a>
            <a href="#" className="text-sm hover:text-[#0f172a] transition-colors">Security Audit</a>
            <a href="#" className="text-sm hover:text-[#0f172a] transition-colors">Compliance</a>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 border-t border-slate-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>© 2026 Aegis Sentinel Systems. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="font-mono text-slate-400">STATUS // SYSTEM_OPERATIONAL</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
