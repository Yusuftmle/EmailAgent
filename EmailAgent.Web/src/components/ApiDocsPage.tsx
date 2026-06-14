import React from 'react';
import { Lock, Mail, RefreshCw, Terminal, CheckCircle2, FileText, Settings, Key } from 'lucide-react';

export const ApiDocsPage: React.FC = () => {
  return (
    <div className="text-slate-900 bg-[#f7f9fb] overflow-x-hidden min-h-screen">
      {/* Layout Grid */}
      <main className="max-w-6xl mx-auto px-6 pt-32 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Sidebar Nav */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-32 bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 space-y-6 shadow-lg shadow-slate-100/50">
            <div>
              <h3 className="font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-3 font-bold">Endpoints</h3>
              <nav className="flex flex-col space-y-1.5">
                <a
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 font-semibold text-slate-900 text-xs hover:bg-slate-100 transition-colors"
                  href="#auth"
                >
                  <span>Authentication</span>
                  <Key size={12} className="text-[#06b6d4]" />
                </a>
                <a
                  className="flex items-center justify-between p-2.5 rounded-xl font-medium text-slate-500 text-xs hover:bg-slate-50 transition-colors"
                  href="#gmail"
                >
                  <span>Gmail Cognitive</span>
                  <Mail size={12} className="text-slate-400" />
                </a>
                <a
                  className="flex items-center justify-between p-2.5 rounded-xl font-medium text-slate-500 text-xs hover:bg-slate-50 transition-colors"
                  href="#scrapers"
                >
                  <span>Deal Scrapers</span>
                  <RefreshCw size={12} className="text-slate-400" />
                </a>
                <a
                  className="flex items-center justify-between p-2.5 rounded-xl font-medium text-slate-500 text-xs hover:bg-slate-50 transition-colors"
                  href="#telemetry"
                >
                  <span>Diagnostics logs</span>
                  <Terminal size={12} className="text-slate-400" />
                </a>
              </nav>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h3 className="font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-3 font-bold">Resources</h3>
              <ul className="space-y-2.5 text-xs font-semibold text-slate-600">
                <li>
                  <a className="hover:text-[#06b6d4] flex items-center gap-2" href="#">
                    <FileText size={14} className="text-slate-400" /> SDK Guides
                  </a>
                </li>
                <li>
                  <a className="hover:text-[#06b6d4] flex items-center gap-2" href="#">
                    <Settings size={14} className="text-slate-400" /> Rate Limits
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </aside>

        {/* API Docs Content */}
        <div className="col-span-1 lg:col-span-9 space-y-16 text-left">
          {/* Header */}
          <header className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-100 text-xs font-mono text-[#06b6d4]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#06b6d4] animate-ping" />
              v3.0.4 - Stable Release
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">Developer Nexus</h1>
            <p className="text-slate-500 text-base leading-relaxed max-w-2xl">
              Integrate high-stakes cognitive intelligence and periodic e-commerce scrapers directly into your custom pipelines. Our RESTful API provides secure access to the Aegis Sentinel Core.
            </p>
          </header>

          {/* Section 1: Authentication */}
          <section id="auth" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 border border-slate-200">
                <Lock size={18} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Authentication</h2>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Text */}
              <div className="xl:col-span-1 bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-slate-200 flex flex-col justify-between shadow-lg shadow-slate-100/50">
                <div className="space-y-4">
                  <p className="text-slate-600 text-xs leading-relaxed">
                    All API endpoints require a JWT Bearer token passed in the Authorization header. You can authorize via Google OAuth or retrieve a local dev bypass token.
                  </p>
                  <ul className="space-y-2 text-[11px] font-semibold text-slate-700">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 size={14} className="text-[#06b6d4] shrink-0" />
                      <span>Stateless HTTP Bearer flow</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 size={14} className="text-[#06b6d4] shrink-0" />
                      <span>Google OAuth scopes validation</span>
                    </li>
                  </ul>
                </div>
                <a className="text-[#06b6d4] hover:underline font-mono text-[10px] uppercase font-bold mt-4 flex items-center gap-1" href="#">
                  <span>Manage API credentials</span>
                  <span>→</span>
                </a>
              </div>

              {/* Code */}
              <div className="xl:col-span-2 bg-[#0f172a] text-slate-300 rounded-2xl p-5 relative overflow-hidden flex flex-col font-mono text-[11px] border border-slate-800 shadow-xl">
                <div className="absolute top-0 right-0 px-3 py-1 bg-white/10 text-slate-400 rounded-bl-lg text-[9px]">
                  BASH // CURL
                </div>
                <div className="flex gap-1.5 mb-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <pre className="overflow-x-auto pb-4">
                  <code>
{`curl -X POST "http://localhost:5209/api/auth/google" \\
  -H "Content-Type: application/json" \\
  -d '{
    "code": "4/0AeaYSH...",
    "redirectUri": "postmessage"
  }'`}
                  </code>
                </pre>
                <div className="border-t border-slate-800 pt-4 mt-auto">
                  <div className="text-slate-500 text-[10px] mb-2">// Response (200 OK):</div>
                  <pre className="text-emerald-400">
                    <code>
{`{
  "token": "eyJhbGciOiJIUzI1Ni...",
  "user": { "id": "f89d...", "email": "user@gmail.com" }
}`}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Gmail Cognitive */}
          <section id="gmail" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 border border-slate-200">
                <Mail size={18} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Gmail Cognitive API</h2>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
              {/* Endpoint item */}
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-cyan-500/10 text-[#06b6d4] px-2 py-0.5 rounded font-mono text-[10px] font-bold">GET</span>
                    <span className="font-mono text-xs font-bold text-slate-950">/api/emails/summarize</span>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Retrieve semantic thread summaries and unread summaries computed by LLM cores.
                  </p>
                </div>
                <button className="shrink-0 px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold text-xs transition-colors">
                  View Specs
                </button>
              </div>

              {/* Endpoint item */}
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded font-mono text-[10px] font-bold">POST</span>
                    <span className="font-mono text-xs font-bold text-slate-950">/api/emails/draft</span>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Generate an AI reply draft for a given message ID and sync it back directly to Gmail drafts queue.
                  </p>
                </div>
                <button className="shrink-0 px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold text-xs transition-colors">
                  View Specs
                </button>
              </div>
            </div>
          </section>

          {/* Section 3: Deal Scrapers */}
          <section id="scrapers" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 border border-slate-200">
                <RefreshCw size={18} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">E-Commerce Scraper API</h2>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
              {/* Endpoint item */}
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-cyan-500/10 text-[#06b6d4] px-2 py-0.5 rounded font-mono text-[10px] font-bold">GET</span>
                    <span className="font-mono text-xs font-bold text-slate-950">/api/deals/monitor</span>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Retrieve active product monitoring links, price deltas, and Telegram message alert thresholds.
                  </p>
                </div>
                <button className="shrink-0 px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold text-xs transition-colors">
                  View Specs
                </button>
              </div>

              {/* Endpoint item */}
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded font-mono text-[10px] font-bold">POST</span>
                    <span className="font-mono text-xs font-bold text-slate-950">/api/deals/monitor</span>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Register a new product link (Amazon, Google Shop) to initialize background cron scraper jobs.
                  </p>
                </div>
                <button className="shrink-0 px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold text-xs transition-colors">
                  View Specs
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
export default ApiDocsPage;
