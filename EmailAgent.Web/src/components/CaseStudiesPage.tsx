import React, { useEffect, useRef, useState } from 'react';
import { Shield, Activity, CheckCircle, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

// Glassmorphic scanner graphic fallback component
const VisualScannerFallback: React.FC = () => {
  return (
    <div className="w-full h-full bg-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0891b2_1px,transparent_1px),linear-gradient(to_bottom,#0891b2_1px,transparent_1px)] bg-[size:20px_20px] opacity-[0.07]" />
      
      {/* Frosted Glass Frame */}
      <div className="w-[85%] h-[75%] rounded-xl border border-white/10 bg-white/5 backdrop-blur-md relative flex flex-col justify-between p-4 shadow-2xl">
        <div className="flex justify-between items-center text-[10px] font-mono text-cyan-400">
          <span>TARGET: VECHICLE_FRAME_#89AC</span>
          <span>SCANNING...</span>
        </div>
        
        {/* Abstract car silhouette sketch */}
        <div className="flex-1 flex items-center justify-center my-2">
          <svg className="w-40 h-20 text-cyan-500/30" viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M 5,28 C 10,25 15,25 20,20 C 25,15 35,12 45,12 C 55,12 65,15 70,20 C 75,25 80,25 85,28 H 95 V 34 H 5 Z" />
            <circle cx="25" cy="34" r="5" />
            <circle cx="75" cy="34" r="5" />
          </svg>
        </div>

        <div className="flex justify-between items-end text-[9px] font-mono text-slate-400">
          <span>AI PERSONA: CAR_EXPERT</span>
          <span>Score: 94%</span>
        </div>

        {/* Scan Laser effect */}
        <motion.div 
          className="absolute left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_10px_#22d3ee] z-20"
          animate={{ top: ['10%', '90%', '10%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#06b6d4]/10 rounded-full blur-2xl pointer-events-none" />
    </div>
  );
};

interface CaseImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

const CaseImage: React.FC<CaseImageProps> = ({ src, alt, className = '', fallback }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <div className="w-full h-full">{fallback || <div className="bg-slate-100 w-full h-full" />}</div>;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
};

export const CaseStudiesPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = 600;
    let particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }> = [];

    const resize = () => {
      width = canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.offsetHeight || 600;
    };

    window.addEventListener('resize', resize);
    resize();

    // Create particles
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
      });
    }

    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw connections
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.04)';
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw and update particles
      ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="text-slate-900 bg-[#f7f9fb] overflow-x-hidden min-h-screen">
      {/* Hero section */}
      <section className="relative min-h-[480px] flex items-center overflow-hidden bg-white border-b border-slate-100">
        <div className="absolute inset-0 z-0 opacity-80 pointer-events-none">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-6 w-full py-20 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 mb-2">
            <Shield size={14} className="text-[#06b6d4]" />
            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">Case Studies</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 max-w-4xl mx-auto">
            Proven Intelligence
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Explore real-world applications of Aegis V3.0. See how our background agents deliver real speed, safety, and business operations improvements.
          </p>
        </div>
      </section>

      {/* Case studies list */}
      <section className="max-w-6xl mx-auto px-6 py-20 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Case 1: E-commerce Scrapers (Span 8 cols) */}
          <article className="lg:col-span-8 group relative rounded-2xl overflow-hidden bg-white border border-slate-200/60 shadow-lg shadow-slate-100/50 hover:-translate-y-1 transition-all duration-500 flex flex-col justify-end min-h-[480px]">
            <div className="absolute inset-0 z-0">
              <CaseImage
                alt="Case Study: E-commerce pricing scrapers"
                className="w-full h-full object-cover opacity-60 group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC29fp5HGqI-5vRb4cON6O0KsScjWNuj0PysckP4l2keb_HnqiW2OyQZf7MOp_v9rVgA8MoHLCxCIQBLgGrX96om5VD1Bkyh6nRCY4OPM6BnbafIg4AhYFzmC-QDF2TlYo69vxMpscV3i2LH5syMefF2cpThQ5B7O1lRpKbqoCONwNI8UdhICrEaNkXZp3BCQ5i9S-4R3y19HzNW_BqFUJ3J6OidFAyKHRRRkxGVwdwfsVjzQxvkFm29ix7d2kZ4WsJ75PULeMPRxU"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-transparent" />
            </div>
            <div className="relative z-10 p-8 md:p-12 space-y-4">
              <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-cyan-500/20 shadow-sm w-max">
                <CheckCircle size={14} className="text-[#06b6d4]" />
                <span className="font-mono text-[10px] text-slate-900 font-bold">Sentinel Verified</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Autonomous E-Commerce Price Monitoring</h2>
              <p className="text-slate-600 text-sm leading-relaxed max-w-xl">
                When a major quantitative product hub needed to track price-drop deltas on thousands of e-commerce listings, Aegis V3.0 deployed parallel scraping agents. The scrapers monitored price deltas with under 1s latency, triggering instant Telegram notifications.
              </p>
              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                <div>
                  <p className="font-mono text-[10px] text-slate-400 mb-1">PROCURMENT ROI (YEAR 1)</p>
                  <p className="text-2xl font-bold text-[#06b6d4]">324%</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] text-slate-400 mb-1">PRICE DISCOVERY LATENCY</p>
                  <p className="text-2xl font-bold text-slate-900">&lt; 1s</p>
                </div>
              </div>
            </div>
          </article>

          {/* Case 2: Zero-Touch Email (Span 4 cols) */}
          <article className="lg:col-span-4 group relative rounded-2xl overflow-hidden bg-white border border-slate-200/60 shadow-lg shadow-slate-100/50 hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between min-h-[480px]">
            <div className="absolute inset-0 z-0">
              <CaseImage
                alt="Case Study: Email agent"
                className="w-full h-full object-cover opacity-30 group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAycbk3KpH6vngPCaJSrT_Jq2A4NdRYNGqTtCAVkcjxQBY-dHiKjlmVULBL2u8GjJzxf0PjjegibLxa5U75eqQAjuA9lkJWhgh0NyjFpPXwJK0gzFXhfBptsB8J84gTQ3Z35HDrtJoG3Z60T2cEk2vW_BQOT72HDfRcuQKFluhx7I467KBAqaU0WgS0-otlBD_WR87x56KvsgPDGCwh-5QxwrmNIn6-injk2045_m-mglVThljH58IBTH2nEBP8jEApQkVqf2M7uQQ"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
            </div>
            <div className="relative z-10 p-8 flex flex-col justify-between h-full space-y-6">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center text-[#06b6d4] border border-cyan-100">
                  <Activity size={18} />
                </div>
                <CheckCircle size={18} className="text-[#06b6d4]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Zero-Touch Support Replies</h3>
                <p className="text-slate-600 text-xs mt-2 leading-relaxed">
                  A high-volume consumer service hub integrated Aegis V3.0's Gmail cognitive processor. Incoming messages are analyzed, summarized, and automatically drafted for reviewer execution.
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <p className="font-mono text-[9px] text-slate-400 mb-1">TRIAGE TIME REDUCTION</p>
                <p className="text-2xl font-bold text-purple-600">-92%</p>
              </div>
            </div>
          </article>
        </div>

        {/* Case 3: Automotive Visual Inspection AI (Span 12 cols, side-by-side) */}
        <article className="group relative rounded-2xl overflow-hidden bg-white border border-slate-200/60 shadow-lg shadow-slate-100/50 hover:-translate-y-1 transition-all duration-500 grid grid-cols-1 lg:grid-cols-12 min-h-[420px]">
          {/* Visual Fallback Container */}
          <div className="lg:col-span-5 relative w-full h-[280px] lg:h-full min-h-[280px]">
            <CaseImage
              src="/images/case-study-car.png"
              alt="Case Study: Automotive Visual Inspection"
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700 ease-out"
              fallback={<VisualScannerFallback />}
            />
          </div>

          {/* Text Content */}
          <div className="lg:col-span-7 p-8 md:p-12 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-cyan-500/20 shadow-sm w-max">
                <Eye size={14} className="text-[#06b6d4]" />
                <span className="font-mono text-[10px] text-slate-900 font-bold">Visual Evaluator Ajanı</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Visual Inspection Automation in Auto Sales</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                A major digital car listing platform deployed the Aegis Visual Evaluator agent to automatically analyze customer-submitted vehicle photos. The agent inspects vehicle bodywork for scratches, paint mismatch, kaporta dents, and logs condition reports automatically.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 border-t border-slate-100 pt-6">
              <div>
                <p className="font-mono text-[9px] text-slate-400 mb-1">INSPECTION ACCURACY</p>
                <p className="text-2xl font-bold text-emerald-500">99.4%</p>
              </div>
              <div>
                <p className="font-mono text-[9px] text-slate-400 mb-1">ANALYSIS SPEED</p>
                <p className="text-2xl font-bold text-slate-900">&lt; 3.0s</p>
              </div>
              <div className="col-span-2 md:col-span-1">
                <p className="font-mono text-[9px] text-slate-400 mb-1">PROCESS REDUCTION</p>
                <p className="text-2xl font-bold text-purple-600">80% Faster</p>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
};
export default CaseStudiesPage;
