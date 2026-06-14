import React, { useState, useRef, useCallback } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Shield, Mail, Lock, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AssistantMascot, { MascotHandle } from './AssistantMascot';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mascotRef = useRef<MascotHandle>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // ── Button hover: attract mascot to the button ──
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
    scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar.events',
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

        mascotRef.current?.celebrate();
        setTimeout(() => navigate('/app'), 2800);

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
        window.location.href = '/app';
      }, 2800);
    } catch (err: any) {
      console.error('Dev Login Error', err);
      setError(err.message || 'Local Dev Authentication failed. Is the .NET API running?');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#020617] text-on-surface flex flex-col justify-center items-center p-4 overflow-hidden font-geist">

      {/* Global Background Glow Layers */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-secondary/5 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-40" />
      </div>

      {/* Animated Robot Mascot — walks freely behind everything */}
      <AssistantMascot ref={mascotRef} />

      <div className="relative z-10 max-w-md w-full bg-surface-container-low/60 backdrop-blur-md rounded-xl border border-outline-variant/30 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="p-8 text-center border-b border-outline-variant/20 flex flex-col items-center">
          <div className="w-16 h-16 rounded-lg bg-surface-container-high flex items-center justify-center border border-outline-variant/30 relative mb-4">
            <Cpu size={32} className="text-primary" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-secondary rounded-full">
              <div className="w-full h-full rounded-full bg-secondary signal-pulse" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-on-surface mb-1">Aegis V3.0</h1>
          <p className="text-on-surface-variant text-xs font-data-mono uppercase tracking-wider">Cognitive Automation Terminal</p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded border border-primary/20 text-primary shrink-0">
                <Mail size={16} />
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-semibold text-on-surface">Gmail Operations Pipeline</h3>
                <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">Reads, analyzes, and drafts smart context-aware replies on your behalf using AI.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-secondary/10 rounded border border-secondary/20 text-secondary shrink-0">
                <Shield size={16} />
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-semibold text-on-surface">Privacy First Architecture</h3>
                <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">Your email summaries are decrypted only on demand and never logged long-term.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded border border-primary/20 text-primary shrink-0">
                <Lock size={16} />
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-semibold text-on-surface">Secure OAuth Access</h3>
                <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">Connect securely via Google OAuth. Session revocation can be triggered instantly.</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-tertiary/10 border border-tertiary-container/20 rounded text-tertiary-container text-xs text-center font-data-mono">
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
            className={`w-full py-3 px-4 flex items-center justify-center gap-3 bg-white text-slate-900 rounded-lg font-semibold transition-all ${
              loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-slate-100 hover:scale-[1.01] active:scale-[0.99]'
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
            className="w-full py-2.5 px-4 flex items-center justify-center gap-2 bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all mt-4 hover:scale-[1.01] active:scale-[0.99]"
          >
            Dev Admin Login (Local Test)
          </button>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
