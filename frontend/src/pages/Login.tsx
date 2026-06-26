import React, { useState } from 'react';
import { TrendingUp, Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';

interface Props {
  onNavigate: (page: 'register' | 'forgot') => void;
}

export default function Login({ onNavigate }: Props) {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, rememberMe);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: '#112D4E' }}>
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ backgroundColor: '#3F72AF' }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ backgroundColor: '#3F72AF' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-3xl opacity-5" style={{ backgroundColor: '#DBE2EF' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border" style={{ backgroundColor: 'rgba(249,247,247,0.05)', borderColor: 'rgba(219,226,239,0.15)' }}>

          {/* Header */}
          <div className="px-8 pt-10 pb-6 text-center" style={{ borderBottom: '1px solid rgba(219,226,239,0.12)' }}>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ backgroundColor: 'rgba(63,114,175,0.2)', border: '1px solid rgba(63,114,175,0.4)' }}>
              <TrendingUp className="w-7 h-7" style={{ color: '#DBE2EF' }} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#F9F7F7' }}>Welcome back</h1>
            <p className="text-sm mt-1" style={{ color: '#DBE2EF' }}>Sign in to your Wealth Capital account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#DBE2EF' }}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#3F72AF' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition"
                  style={{
                    backgroundColor: 'rgba(219,226,239,0.08)',
                    border: '1px solid rgba(219,226,239,0.2)',
                    color: '#F9F7F7',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#3F72AF'; e.target.style.boxShadow = '0 0 0 3px rgba(63,114,175,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(219,226,239,0.2)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#DBE2EF' }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#3F72AF' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-11 py-3 rounded-xl text-sm outline-none transition"
                  style={{
                    backgroundColor: 'rgba(219,226,239,0.08)',
                    border: '1px solid rgba(219,226,239,0.2)',
                    color: '#F9F7F7',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#3F72AF'; e.target.style.boxShadow = '0 0 0 3px rgba(63,114,175,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(219,226,239,0.2)'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 transition" style={{ color: '#3F72AF' }}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  onClick={() => setRememberMe(v => !v)}
                  className="w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer"
                  style={{
                    backgroundColor: rememberMe ? '#3F72AF' : 'transparent',
                    border: rememberMe ? '2px solid #3F72AF' : '2px solid rgba(219,226,239,0.4)',
                  }}
                >
                  {rememberMe && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm" style={{ color: '#DBE2EF' }}>Remember me</span>
              </label>
              <button type="button" onClick={() => onNavigate('forgot')} className="text-sm font-medium transition" style={{ color: '#DBE2EF' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#F9F7F7')}
                onMouseLeave={e => (e.currentTarget.style.color = '#DBE2EF')}
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 font-bold rounded-xl text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#3F72AF', color: '#F9F7F7', boxShadow: '0 4px 24px rgba(63,114,175,0.35)' }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><LogIn className="w-4 h-4" /> Sign In</>
              )}
            </button>
            
            <div className="flex items-center gap-3 pt-2">
              <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(219,226,239,0.2)' }} />
              <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'rgba(219,226,239,0.6)' }}>Or</span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(219,226,239,0.2)' }} />
            </div>

            <div className="flex justify-center pb-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    setError('');
                    setLoading(true);
                    const result = await signInWithPopup(auth, googleProvider);
                    const idToken = await result.user.getIdToken();
                    await loginWithGoogle(idToken);
                  } catch (err: any) {
                    setError(err.message || 'Google Login Failed');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition"
                style={{ backgroundColor: '#DBE2EF', color: '#112D4E' }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="px-8 pb-8 text-center">
            <p className="text-sm" style={{ color: '#DBE2EF' }}>
              Don't have an account?{' '}
              <button onClick={() => onNavigate('register')} className="font-semibold transition" style={{ color: '#F9F7F7' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#DBE2EF')}
                onMouseLeave={e => (e.currentTarget.style.color = '#F9F7F7')}
              >
                Create one
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-xs mt-6 font-mono" style={{ color: 'rgba(219,226,239,0.3)' }}>
          Wealth Capital — Secure Personal Finance Tracker
        </p>
      </div>
    </div>
  );
}
