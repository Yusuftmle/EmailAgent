import React, { useState, useRef, useCallback } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Shield, Mail, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AssistantMascot, { MascotHandle } from './AssistantMascot';

const CozyParticles: React.FC<{ mode: 'morning' | 'afternoon' | 'night' }> = ({ mode }) => {
  const particleCount = 18;
  const particles = React.useMemo(() => {
    return Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      bottom: `${Math.random() * 10}%`, // start from bottom area
      size: Math.random() * 5 + 3, // 3px to 8px
      delay: `${Math.random() * 10}s`,
      duration: `${Math.random() * 12 + 10}s`,
      color: mode === 'morning' 
        ? '#fbbf24' // golden sunbeam
        : mode === 'afternoon'
        ? '#c084fc' // lavender sky
        : '#fb923c', // warm orange firefly
    }));
  }, [mode]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            bottom: p.bottom,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            filter: 'blur(1px) drop-shadow(0 0 3px currentColor)',
            animation: `cozyFloat ${p.duration} ease-in-out ${p.delay} infinite`,
            opacity: 0,
          }}
        />
      ))}
      <style>{`
        @keyframes cozyFloat {
          0% {
            transform: translateY(10%) translateX(0px);
            opacity: 0;
          }
          15% {
            opacity: 0.55;
          }
          85% {
            opacity: 0.55;
          }
          100% {
            transform: translateY(-800px) translateX(40px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mascotRef = useRef<MascotHandle>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // ── Determine time of day ──
  const [timeMode] = useState<'morning' | 'afternoon' | 'night'>(() => {
    const hr = new Date().getHours();
    if (hr >= 6 && hr < 12) return 'morning';
    if (hr >= 12 && hr < 18) return 'afternoon';
    return 'night';
  });

  // ── Button hover: attract Omni to the button ──
  const handleButtonEnter = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const buttonCenterX = rect.left + rect.width / 2;
    mascotRef.current?.attractToX(buttonCenterX);
  }, []);

  const handleButtonLeave = useCallback(() => {
    mascotRef.current?.attractToX(null);
  }, []);

  const login = useGoogleLogin({
    flow: 'auth-code',
    scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send',
    onSuccess: async (codeResponse) => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.post('/api/auth/google', {
          code: codeResponse.code,
          redirectUri: 'postmessage',
        });

        const { token, user } = res.data;
        localStorage.setItem('jwt', token);
        localStorage.setItem('user', JSON.stringify(user));

        // 🎉 Trigger celebration animation before navigating
        mascotRef.current?.celebrate();
        setTimeout(() => navigate('/'), 2800);

      } catch (err: any) {
        console.error('Login Error', err);
        setError(err.response?.data?.message || err.message || 'Authentication failed');
        setLoading(false);
      }
    },
    onError: (errorResponse) => {
      console.error(errorResponse);
      setError('Google Login was cancelled or failed.');
      setLoading(false);
    },
  });

  const handleDeveloperLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/api/auth/dev-login');
      const { token, user } = res.data;
      localStorage.setItem('jwt', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      mascotRef.current?.celebrate();
      setTimeout(() => {
        window.location.href = '/';
      }, 2800);
    } catch (err: any) {
      console.error('Dev Login Error', err);
      setError(err.message || 'Local Dev Authentication failed. Is the .NET API running?');
      setLoading(false);
    }
  };

  const bgGradient = 
    timeMode === 'morning' ? 'from-[#0a0f1d] via-[#121c32] to-[#25152a]' :
    timeMode === 'afternoon' ? 'from-[#0b1420] via-[#0f212f] to-[#0f2a20]' :
    'from-[#05080e] via-[#09101f] to-[#120b20]';

  return (
    <div className={`relative min-h-screen bg-gradient-to-br ${bgGradient} text-slate-200 flex flex-col justify-center items-center p-4 overflow-hidden`}>

      {/* Repeating Telegram-Style Cute Doodle Wallpaper */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.032] pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="telegram-doodles" width="120" height="120" patternUnits="userSpaceOnUse">
            {/* Doodle 1: Mail Envelope */}
            <path d="M10,15 L30,15 L30,30 L10,30 Z M10,15 L20,23 L30,15" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            {/* Doodle 2: Cute Cloud */}
            <path d="M55,23 C53,23 51,21 51,19 C51,16 53,14 56,14 C57,12 60,12 61,14 C63,14 65,16 65,19 C65,21 63,23 61,23 Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
            {/* Doodle 3: Tiny Star */}
            <path d="M90,15 L92,19 L96,19 L93,22 L94,26 L90,24 L86,26 L87,22 L84,19 L88,19 Z" fill="none" stroke="currentColor" strokeWidth="1" />
            {/* Doodle 4: Coffee Cup */}
            <path d="M20,65 L32,65 C32,65 32,73 30,75 C28,77 24,77 22,75 C20,73 20,65 20,65 Z M32,67 C34,67 34,71 32,71" fill="none" stroke="currentColor" strokeWidth="1.2" />
            {/* Doodle 5: Robot Smiley (Omni!) */}
            <rect x="52" y="62" width="16" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="56" cy="67" r="0.8" fill="currentColor" />
            <circle cx="64" cy="67" r="0.8" fill="currentColor" />
            <path d="M57,70 Q60,72 63,70" fill="none" stroke="currentColor" strokeWidth="1" />
            {/* Doodle 6: Chat Bubble */}
            <path d="M85,65 C85,61 90,61 93,61 C96,61 98,63 98,66 C98,69 95,70 93,70 L90,70 L88,72 L88,70 C85,70 85,67 85,65 Z" fill="none" stroke="currentColor" strokeWidth="1" />
            {/* Doodle 7: Sparkles & dots */}
            <circle cx="10" cy="100" r="1" fill="currentColor" />
            <circle cx="105" cy="100" r="0.8" fill="currentColor" />
            <circle cx="112" cy="50" r="1" fill="currentColor" />
            <circle cx="45" cy="45" r="0.8" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#telegram-doodles)" />
      </svg>

      {/* Dynamic Background Glow Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {timeMode === 'morning' && (
          <>
            <div className="absolute -top-20 -left-20 w-[45vw] h-[45vw] rounded-full bg-pink-500/10 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute -bottom-20 -right-20 w-[50vw] h-[50vw] rounded-full bg-amber-500/8 blur-[130px] animate-pulse" style={{ animationDuration: '10s' }} />
          </>
        )}
        {timeMode === 'afternoon' && (
          <>
            <div className="absolute -top-20 -right-20 w-[45vw] h-[45vw] rounded-full bg-teal-500/8 blur-[120px] animate-pulse" style={{ animationDuration: '9s' }} />
            <div className="absolute -bottom-20 -left-20 w-[50vw] h-[50vw] rounded-full bg-indigo-500/10 blur-[130px] animate-pulse" style={{ animationDuration: '11s' }} />
          </>
        )}
        {timeMode === 'night' && (
          <>
            <div className="absolute -bottom-40 right-20 w-[55vw] h-[55vw] rounded-full bg-amber-500/12 blur-[140px] animate-pulse" style={{ animationDuration: '12s' }} />
            <div className="absolute -top-20 -left-20 w-[40vw] h-[40vw] rounded-full bg-purple-900/10 blur-[120px]" />
          </>
        )}
      </div>

      {/* Cozy Firefly/Sunbeam particles drifting up */}
      <CozyParticles mode={timeMode} />

      {/* Animated Robot Mascot — walks freely behind everything */}
      <AssistantMascot ref={mascotRef} />

      <div className="relative z-10 max-w-md w-full bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="p-8 text-center border-b border-slate-700/50 flex flex-col items-center">
          <h1 className="text-3xl font-bold text-white mb-2">OmniAgent</h1>
          <p className="text-slate-400">Your intelligent autonomous email assistant.</p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 shrink-0">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="font-medium text-slate-200">Gmail Integration</h3>
                <p className="text-sm text-slate-400">OmniAgent reads and drafts replies on your behalf using the power of AI.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 shrink-0">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="font-medium text-slate-200">Privacy First</h3>
                <p className="text-sm text-slate-400">We do not store your emails. They are only fetched on-the-fly when OmniAgent processes them.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 shrink-0">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="font-medium text-slate-200">Secure Access</h3>
                <p className="text-sm text-slate-400">Connect securely via Google OAuth. You can revoke access at any time.</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            ref={buttonRef}
            id="google-login-btn"
            onClick={() => login()}
            disabled={loading}
            onMouseEnter={handleButtonEnter}
            onMouseLeave={handleButtonLeave}
            className={`w-full py-3 px-4 flex items-center justify-center gap-3 bg-white text-slate-900 rounded-xl font-medium transition-all ${
              loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  <path fill="none" d="M1 1h22v22H1z" />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Local developer admin bypass button */}
          <button
            onClick={handleDeveloperLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 flex items-center justify-center gap-2 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 hover:border-amber-500/40 rounded-xl text-slate-400 hover:text-slate-200 text-[10px] font-bold uppercase tracking-wider transition-all mt-4 hover:scale-[1.02] active:scale-[0.98]"
          >
            Dev Admin Login (Local Test)
          </button>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
