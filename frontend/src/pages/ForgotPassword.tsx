import React, { useState } from 'react';
import { TrendingUp, Mail, ArrowLeft, AlertCircle, Send, Copy, CheckCircle } from 'lucide-react';

interface Props {
  onNavigate: (page: 'login') => void;
}

export default function ForgotPassword({ onNavigate }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetData, setResetData] = useState<{ resetUrl: string; token: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed.');
      setResetData({ resetUrl: data.resetUrl, token: data.token });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (!resetData) return;
    navigator.clipboard.writeText(resetData.resetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: '#112D4E' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-15" style={{ backgroundColor: '#3F72AF' }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ backgroundColor: '#DBE2EF' }} />
      </div>

      <div className="relative w-full max-w-md">
        <div className="backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border" style={{ backgroundColor: 'rgba(249,247,247,0.05)', borderColor: 'rgba(219,226,239,0.15)' }}>

          <div className="px-8 pt-10 pb-6 text-center" style={{ borderBottom: '1px solid rgba(219,226,239,0.12)' }}>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ backgroundColor: 'rgba(63,114,175,0.2)', border: '1px solid rgba(63,114,175,0.4)' }}>
              <TrendingUp className="w-7 h-7" style={{ color: '#DBE2EF' }} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#F9F7F7' }}>Reset your password</h1>
            <p className="text-sm mt-1" style={{ color: '#DBE2EF' }}>
              {resetData ? 'Your reset link is ready below' : "Enter your email to generate a reset link"}
            </p>
          </div>

          <div className="px-8 py-7">
            {!resetData ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
                    <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#DBE2EF' }}>Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#3F72AF' }} />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition"
                      style={{ backgroundColor: 'rgba(219,226,239,0.08)', border: '1px solid rgba(219,226,239,0.2)', color: '#F9F7F7' }}
                      onFocus={e => { e.target.style.borderColor = '#3F72AF'; e.target.style.boxShadow = '0 0 0 3px rgba(63,114,175,0.15)'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(219,226,239,0.2)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 font-bold rounded-xl text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#3F72AF', color: '#F9F7F7', boxShadow: '0 4px 24px rgba(63,114,175,0.35)' }}
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send className="w-4 h-4" /> Generate Reset Link</>}
                </button>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: 'rgba(63,114,175,0.15)', border: '1px solid rgba(63,114,175,0.3)' }}>
                  <CheckCircle className="w-5 h-5 shrink-0" style={{ color: '#DBE2EF' }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#F9F7F7' }}>Reset link generated!</p>
                    <p className="text-xs mt-0.5" style={{ color: '#DBE2EF' }}>Valid for 1 hour</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#DBE2EF' }}>Your Reset Link</label>
                  <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: 'rgba(219,226,239,0.08)', border: '1px solid rgba(219,226,239,0.2)' }}>
                    <p className="flex-1 text-xs font-mono truncate" style={{ color: '#DBE2EF' }}>{resetData.resetUrl}</p>
                    <button onClick={copyLink} className="shrink-0 p-1.5 rounded-lg transition" style={{ color: '#3F72AF' }}>
                      {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button onClick={() => window.location.href = resetData.resetUrl}
                  className="w-full py-3.5 font-bold rounded-xl text-sm transition-all duration-200"
                  style={{ backgroundColor: '#3F72AF', color: '#F9F7F7', boxShadow: '0 4px 24px rgba(63,114,175,0.35)' }}
                >
                  Open Reset Link →
                </button>
              </div>
            )}
          </div>

          <div className="px-8 pb-8 text-center">
            <button onClick={() => onNavigate('login')}
              className="inline-flex items-center gap-1.5 text-sm transition"
              style={{ color: 'rgba(219,226,239,0.5)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#DBE2EF')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(219,226,239,0.5)')}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </button>
          </div>
        </div>
        <p className="text-center text-xs mt-6 font-mono" style={{ color: 'rgba(219,226,239,0.3)' }}>
          Wealth Capital — Secure Personal Finance Tracker
        </p>
      </div>
    </div>
  );
}
