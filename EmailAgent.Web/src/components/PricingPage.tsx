import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('jwt');
  const [isAnnual, setIsAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Prices configuration
  const prices = {
    sentinel: isAnnual ? 9 : 12,
    core: isAnnual ? 29 : 35,
  };

  const faqData = [
    {
      q: 'Aegis WhatsApp ve Telegram botu nasıl kurulur?',
      a: 'Hesabınızı oluşturduktan sonra kullanıcı panelinizden size özel Telegram eşleştirme kodunu (pairing code) alabilirsiniz. WhatsApp için ise belirlenen numaraya /start mesajı göndererek hızlıca entegrasyonu tamamlayabilirsiniz.',
    },
    {
      q: 'Görsel Analiz (Visual Evaluator) hangi kategorileri destekliyor?',
      a: 'Aegis V3.0; araç ilanları (kaporta ve boya hasar kontrolü), laptop ve elektronik ürünler (kozmetik çizik, ekran çatlağı analizi) ve giyim/moda ilanları için optimize edilmiş özel görsel değerlendirme modelleri sunmaktadır.',
    },
    {
      q: 'Fiyat takibi (Scraper) ne kadar sıklıkla çalışıyor?',
      a: 'Sentinel planında fiyat taramaları her 4 saatte bir çalışırken, Aegis Core planında bu sıklık 15 dakikaya kadar iner. Nexus Prime planında ise gerçek zamanlı veya dakikalık tarama periyotları ayarlayabilirsiniz.',
    },
    {
      q: 'Kendi yapay zeka API anahtarlarımı (BYOK) ekleyebilir miyim?',
      a: 'Evet! Aegis, Bring-Your-Own-Key (BYOK) mimarisini destekler. Kendi OpenAI, Anthropic (Claude) veya Google (Gemini) API anahtarlarınızı girerek sorgu başına ek bir Aegis ücreti ödemeden asistanınızı çalıştırabilirsiniz.',
    },
    {
      q: 'Gmail AI Yanıt Taslakları nasıl çalışıyor?',
      a: 'Aegis, belirlediğiniz kurallara göre gelen e-postalarınızı okur, yapay zeka ile özet çıkartır ve size özel taslak yanıtları hazırlayarak doğrudan Gmail "Taslaklar" klasörünüze yükler. Siz onaylamadan hiçbir e-posta gönderilmez.',
    }
  ];

  return (
    <div className="text-slate-900 bg-[#f7f9fb] overflow-x-hidden min-h-screen">
      {/* Hero Header */}
      <section className="max-w-6xl mx-auto px-6 pt-32 pb-16 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6">
          Invest in <span className="bg-gradient-to-r from-slate-900 to-[#06b6d4] bg-clip-text text-transparent">Precision</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Scale your cognitive assistant to match your personal or business workflow. Select the tier that matches your deployment.
        </p>

        {/* Toggle Switch */}
        <div className="flex items-center justify-center gap-4 font-semibold text-sm">
          <span className={`${!isAnnual ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-12 h-6 rounded-full bg-slate-900 p-0.5 transition-colors focus:outline-none relative flex items-center"
            aria-label="Toggle billing interval"
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                isAnnual ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`flex items-center gap-2 ${isAnnual ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
            <span>Annually</span>
            <span className="bg-cyan-500/10 text-[#06b6d4] px-2 py-0.5 rounded-full font-mono text-[10px]">Save 20%</span>
          </span>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="max-w-6xl mx-auto px-6 py-8 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-5xl mx-auto">
          {/* Sentinel Tier */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-slate-200 hover:-translate-y-1 transition-transform duration-300 flex flex-col justify-between h-full shadow-lg shadow-slate-100/50">
            <div className="space-y-6">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] mb-3 border border-slate-200">
                  Individual
                </span>
                <h3 className="text-2xl font-bold text-slate-900">Sentinel</h3>
                <p className="text-slate-500 text-xs mt-1">Essential email digest and listing price checks.</p>
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl md:text-5xl font-bold text-slate-900">${prices.sentinel}</span>
                  <span className="text-slate-500 text-sm">/mo</span>
                </div>
                <p className="text-[10px] font-mono text-slate-400 mt-1">
                  {isAnnual ? `Billed annually at $${prices.sentinel * 12}` : 'Billed monthly'}
                </p>
              </div>
              <ul className="space-y-3.5 text-xs text-slate-700 pt-2 border-t border-slate-100">
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-[#06b6d4] shrink-0 mt-0.5" />
                  <span>1,000 processed emails/mo</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-[#06b6d4] shrink-0 mt-0.5" />
                  <span>5 active deal tracking URLs</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-[#06b6d4] shrink-0 mt-0.5" />
                  <span>Google Calendar Tasks Sync</span>
                </li>
                <li className="flex items-start gap-2 text-slate-400">
                  <Minus size={16} className="shrink-0 mt-0.5" />
                  <span>No AI draft reply generator</span>
                </li>
                <li className="flex items-start gap-2 text-slate-400">
                  <Minus size={16} className="shrink-0 mt-0.5" />
                  <span>No WhatsApp/Telegram bots</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => navigate(isAuthenticated ? '/app' : '/login')}
              className="mt-8 w-full py-3 rounded-xl border border-slate-900 text-slate-900 font-semibold text-sm hover:bg-slate-50 transition-colors duration-200 active:scale-95"
            >
              Start Free Trial
            </button>
          </div>

          {/* Aegis Core Tier (Highlighted Card) */}
          <div className="bg-white rounded-2xl p-9 border-2 border-[#06b6d4] hover:-translate-y-1 transition-transform duration-300 flex flex-col justify-between h-full relative shadow-xl shadow-slate-100/60 md:scale-105 z-10">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1 rounded-full font-mono text-[9px] uppercase tracking-wider shadow-md flex items-center gap-1">
              <Star size={10} className="text-[#06b6d4] fill-[#06b6d4]" />
              <span>Most Popular</span>
            </div>
            <div className="space-y-6">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-cyan-50 text-[#06b6d4] font-mono text-[10px] mb-3 border border-cyan-100">
                  Professional
                </span>
                <h3 className="text-2xl font-bold text-slate-900">Aegis Core</h3>
                <p className="text-slate-500 text-xs mt-1">Full-featured cognitive pipeline for heavy users.</p>
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl md:text-5xl font-bold text-slate-900">${prices.core}</span>
                  <span className="text-slate-500 text-sm">/mo</span>
                </div>
                <p className="text-[10px] font-mono text-[#06b6d4] mt-1 font-semibold">
                  {isAnnual ? `Billed annually at $${prices.core * 12}` : 'Billed monthly'}
                </p>
              </div>
              <ul className="space-y-3.5 text-xs text-slate-700 pt-2 border-t border-slate-100">
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-[#06b6d4] shrink-0 mt-0.5" />
                  <span className="font-semibold text-slate-900">10,000 processed emails/mo</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-[#06b6d4] shrink-0 mt-0.5" />
                  <span className="font-semibold text-slate-900">50 active deal tracking URLs</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-[#06b6d4] shrink-0 mt-0.5" />
                  <span>AI Reply draft generator</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-[#06b6d4] shrink-0 mt-0.5" />
                  <span>WhatsApp & Telegram bots</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-[#06b6d4] shrink-0 mt-0.5" />
                  <span>AI Visual inspection scanning</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => navigate(isAuthenticated ? '/app' : '/login')}
              className="mt-8 w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all duration-200 shadow-md shadow-slate-900/10 active:scale-95"
            >
              Deploy Aegis Core
            </button>
          </div>

          {/* Nexus Prime Tier */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-slate-200 hover:-translate-y-1 transition-transform duration-300 flex flex-col justify-between h-full shadow-lg shadow-slate-100/50">
            <div className="space-y-6">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] mb-3 border border-slate-200">
                  Global
                </span>
                <h3 className="text-2xl font-bold text-slate-900">Nexus Prime</h3>
                <p className="text-slate-500 text-xs mt-1">Dedicated node clusters for business integrations.</p>
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900">Custom</span>
                </div>
                <p className="text-[10px] font-mono text-slate-400 mt-1">Volume-based custom limits</p>
              </div>
              <ul className="space-y-3.5 text-xs text-slate-700 pt-2 border-t border-slate-100">
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-slate-900 shrink-0 mt-0.5" />
                  <span>Unlimited processed emails</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-slate-900 shrink-0 mt-0.5" />
                  <span>Unlimited active scraper URLs</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-slate-900 shrink-0 mt-0.5" />
                  <span>BYOK Multi-LLM model configuration</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-slate-900 shrink-0 mt-0.5" />
                  <span>On-Premise deployment execution</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => navigate(isAuthenticated ? '/app' : '/login')}
              className="mt-8 w-full py-3 rounded-xl border border-slate-900 text-slate-900 font-semibold text-sm hover:bg-slate-50 transition-colors duration-200 active:scale-95"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="max-w-6xl mx-auto px-6 py-12 border-t border-slate-100">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">Compare Capabilities</h2>
          <p className="text-slate-500 text-base">A detailed breakdown of features across all network tiers.</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-6 font-bold text-slate-800 text-sm w-1/4">Features</th>
                <th className="p-6 font-bold text-slate-800 text-sm w-1/4">Sentinel</th>
                <th className="p-6 font-bold text-[#06b6d4] bg-cyan-50/20 border-x border-cyan-100/50 text-sm w-1/4 relative">
                  Aegis Core
                </th>
                <th className="p-6 font-bold text-slate-800 text-sm w-1/4">Nexus Prime</th>
              </tr>
            </thead>
            <tbody className="text-slate-600 text-xs divide-y divide-slate-100">
              {/* Category Header */}
              <tr className="bg-slate-50/30">
                <td className="p-4 font-mono text-[9px] uppercase tracking-wider text-slate-400 font-bold" colSpan={4}>
                  Processing Capacity
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-6 font-semibold text-slate-800">Monthly Email Limit</td>
                <td className="p-6">1,000 / mo</td>
                <td className="p-6 bg-cyan-50/20 border-x border-cyan-100/50 font-bold text-slate-900">10,000 / mo</td>
                <td className="p-6">Unlimited custom limit</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-6 font-semibold text-slate-800">Active URL Scrapers</td>
                <td className="p-6">5 URLs</td>
                <td className="p-6 bg-cyan-50/20 border-x border-cyan-100/50 font-bold text-slate-900">50 URLs</td>
                <td className="p-6">Unlimited</td>
              </tr>

              {/* Category Header */}
              <tr className="bg-slate-50/30">
                <td className="p-4 font-mono text-[9px] uppercase tracking-wider text-slate-400 font-bold" colSpan={4}>
                  Intelligence Engine
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-6 font-semibold text-slate-800">AI Reply Generator</td>
                <td className="p-6 text-slate-300">Not included</td>
                <td className="p-6 bg-cyan-50/20 border-x border-cyan-100/50 text-[#06b6d4] font-bold">
                  <Check size={18} />
                </td>
                <td className="p-6 text-slate-900 font-bold">
                  <Check size={18} />
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-6 font-semibold text-slate-800">Visual Evaluation Ajanı</td>
                <td className="p-6 text-slate-300">Not included</td>
                <td className="p-6 bg-cyan-50/20 border-x border-cyan-100/50 text-[#06b6d4] font-bold">
                  <Check size={18} />
                </td>
                <td className="p-6 text-slate-900 font-bold">
                  <Check size={18} />
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-6 font-semibold text-slate-800">WhatsApp & Telegram Integration</td>
                <td className="p-6 text-slate-300">Not included</td>
                <td className="p-6 bg-cyan-50/20 border-x border-cyan-100/50 text-[#06b6d4] font-bold">
                  <Check size={18} />
                </td>
                <td className="p-6 text-slate-900 font-bold">
                  <Check size={18} />
                </td>
              </tr>

              {/* Category Header */}
              <tr className="bg-slate-50/30">
                <td className="p-4 font-mono text-[9px] uppercase tracking-wider text-slate-400 font-bold" colSpan={4}>
                  Support &amp; SLA
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-6 font-semibold text-slate-800">Uptime SLA</td>
                <td className="p-6">99.0%</td>
                <td className="p-6 bg-cyan-50/20 border-x border-cyan-100/50 font-bold text-slate-900">99.9%</td>
                <td className="p-6">99.99%</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-6 font-semibold text-slate-800">Support SLA</td>
                <td className="p-6">Email support (48h)</td>
                <td className="p-6 bg-cyan-50/20 border-x border-cyan-100/50 font-bold text-slate-900">Priority (4h)</td>
                <td className="p-6">24/7 Phone + Slack channel</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section className="max-w-4xl mx-auto px-6 py-20 border-t border-slate-100">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
          <p className="text-slate-500 text-base">Clear answers to help you get started with Aegis.</p>
        </div>

        <div className="space-y-4">
          {faqData.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx} 
                className="bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-colors duration-200 hover:border-slate-300"
              >
                <button
                  className="w-full p-5 text-left flex justify-between items-center gap-4 focus:outline-none"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                >
                  <span className="font-bold text-slate-800 text-sm md:text-base">{faq.q}</span>
                  <span className="text-slate-500 shrink-0">
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="p-5 pt-0 text-slate-600 text-xs md:text-sm border-t border-slate-100 bg-slate-50/30 leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
export default PricingPage;
