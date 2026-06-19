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

  const openResetLink = () => {
    if (!resetData) return;
    window.location.href = resetData.resetUrl;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="px-8 pt-10 pb-6 text-center border-b border-slate-800">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
              <TrendingUp className="w-7 h-7 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Reset your password</h1>
            <p className="text-slate-400 text-sm mt-1">
              {resetData ? 'Your reset link is ready below' : "Enter your email and we'll generate a reset link"}
            </p>
          </div>

          <div className="px-8 py-7">
            {!resetData ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="flex items-center gap-2.5 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-white font-bold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-amber-500/20 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Generate Reset Link
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-5">
                {/* Success state */}
                <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-400">Reset link generated!</p>
                    <p className="text-xs text-emerald-400/70 mt-0.5">Valid for 1 hour</p>
                  </div>
                </div>

                {/* Reset URL */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Reset Link</label>
                  <div className="flex items-center gap-2 p-3 bg-slate-800/60 border border-slate-700 rounded-xl">
                    <p className="flex-1 text-xs text-slate-300 font-mono truncate">{resetData.resetUrl}</p>
                    <button
                      onClick={copyLink}
                      className="shrink-0 p-1.5 hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-white"
                    >
                      {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={openResetLink}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-emerald-500/20"
                >
                  Open Reset Link →
                </button>
              </div>
            )}
          </div>

          <div className="px-8 pb-8 text-center">
            <button
              onClick={() => onNavigate('login')}
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </button>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6 font-mono">
          Wealth Capital — Secure Personal Finance Tracker
        </p>
      </div>
    </div>
  );
}
