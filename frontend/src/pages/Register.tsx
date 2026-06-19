import React, { useState } from 'react';
import { TrendingUp, Mail, Lock, Eye, EyeOff, User, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Props {
  onNavigate: (page: 'login') => void;
}

export default function Register({ onNavigate }: Props) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordStrength = (() => {
    if (password.length === 0) return 0;
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][passwordStrength];
  const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#3F72AF', '#22c55e'][passwordStrength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Please enter your name.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      await register(name.trim(), email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: 'rgba(219,226,239,0.08)',
    border: '1px solid rgba(219,226,239,0.2)',
    color: '#F9F7F7',
  };
  const focusIn = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = '#3F72AF'; e.target.style.boxShadow = '0 0 0 3px rgba(63,114,175,0.15)'; };
  const focusOut = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = 'rgba(219,226,239,0.2)'; e.target.style.boxShadow = 'none'; };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: '#112D4E' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ backgroundColor: '#3F72AF' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-15" style={{ backgroundColor: '#DBE2EF' }} />
      </div>

      <div className="relative w-full max-w-md">
        <div className="backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border" style={{ backgroundColor: 'rgba(249,247,247,0.05)', borderColor: 'rgba(219,226,239,0.15)' }}>

          <div className="px-8 pt-10 pb-6 text-center" style={{ borderBottom: '1px solid rgba(219,226,239,0.12)' }}>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ backgroundColor: 'rgba(63,114,175,0.2)', border: '1px solid rgba(63,114,175,0.4)' }}>
              <TrendingUp className="w-7 h-7" style={{ color: '#DBE2EF' }} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#F9F7F7' }}>Create your account</h1>
            <p className="text-sm mt-1" style={{ color: '#DBE2EF' }}>Start tracking your wealth for free</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-7 space-y-4">
            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
                <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
              </div>
            )}

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#DBE2EF' }}>Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#3F72AF' }} />
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#DBE2EF' }}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#3F72AF' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#DBE2EF' }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#3F72AF' }} />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" required
                  className="w-full pl-10 pr-11 py-3 rounded-xl text-sm outline-none transition" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: '#3F72AF' }}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ backgroundColor: i <= passwordStrength ? strengthColor : 'rgba(219,226,239,0.15)' }} />
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: 'rgba(219,226,239,0.5)' }}>
                    Strength: <span style={{ color: '#DBE2EF' }}>{strengthLabel}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#DBE2EF' }}>Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#3F72AF' }} />
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" required
                  className="w-full pl-10 pr-11 py-3 rounded-xl text-sm outline-none transition" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                {confirmPassword.length > 0 && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    {confirmPassword === password
                      ? <CheckCircle className="w-4 h-4" style={{ color: '#3F72AF' }} />
                      : <AlertCircle className="w-4 h-4 text-red-400" />}
                  </div>
                )}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 font-bold rounded-xl text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{ backgroundColor: '#3F72AF', color: '#F9F7F7', boxShadow: '0 4px 24px rgba(63,114,175,0.35)' }}
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><UserPlus className="w-4 h-4" /> Create Account</>}
            </button>
          </form>

          <div className="px-8 pb-8 text-center">
            <p className="text-sm" style={{ color: '#DBE2EF' }}>
              Already have an account?{' '}
              <button onClick={() => onNavigate('login')} className="font-semibold transition" style={{ color: '#F9F7F7' }}>Sign in</button>
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
