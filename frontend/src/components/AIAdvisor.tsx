import React, { useState } from 'react';
import { Transaction, Category, Budget, SavingsGoal } from '../types';
import Markdown from 'react-markdown';
import { 
  Sparkles, 
  RefreshCw, 
  CheckCircle, 
  HelpCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  BrainCircuit,
  MessageSquareDiff
} from 'lucide-react';

interface AIAdvisorProps {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: SavingsGoal[];
}

const IN_FLIGHT_TIPS = [
  "Aggregating recent transaction histories...",
  "Auditing spending caps and budget violations...",
  "Analyzing savings velocity on active targets...",
  "Scanning category ledger allocations for leaks...",
  "Consulting wealth generation models...",
  "Formulating personalized optimization playbooks..."
];

export default function AIAdvisor({ transactions, categories, budgets, goals }: AIAdvisorProps) {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipIndex, setTipIndex] = useState(0);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    setInsights(null);

    // Dynamic tip alternator to engage user (Vibe and User experience)
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % IN_FLIGHT_TIPS.length);
    }, 2800);

    try {
      const currentMonthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${baseUrl}/api/insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transactions,
          budgets,
          goals,
          currentMonth: currentMonthLabel
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to acquire financial recommendations.');
      }

      setInsights(data.insights);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected failure occurred while fetching your advisory report.');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" id="ai-advisor-container">
      {/* Visual Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-sans font-medium tracking-tight text-slate-900 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-indigo-600" />
            <span>AI Wealth Advisor & Strategy Coach</span>
          </h2>
          <p className="text-sm text-slate-500">Acquire instantaneous professional spending analysis, anomaly detections, and wealth strategies.</p>
        </div>

        <button
          onClick={fetchInsights}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-350 rounded-xl cursor-pointer transition shadow-xs self-start shrink-0"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing Ledger...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-indigo-200 animate-pulse" />
              <span>Generate Wealth Report</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container Layout */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-3xl shadow-xs space-y-4" id="ai-loading-stage">
          {/* Animated pulsing elements */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-ping" />
            <div className="relative p-5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-md">
              <BrainCircuit className="w-8 h-8 animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <h4 className="text-sm font-semibold text-slate-800">Compiling Wealth Analytics</h4>
            <p className="text-xs text-indigo-600 font-medium font-mono h-4 animate-fade-in">
              {IN_FLIGHT_TIPS[tipIndex]}
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3.5" id="ai-error-stage">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-rose-800">Financial Analysis Aborted</h4>
            <p className="text-rose-600 font-medium leading-relaxed">{error}</p>
            <p className="text-rose-400 mt-2">
              If you haven't configured your <strong className="font-semibold text-rose-700">GEMINI_API_KEY</strong> yet, head over to the <strong className="font-semibold text-rose-700">Settings &gt; Secrets</strong> panel in the AI Studio sidebar, add the key, and try again!
            </p>
            <button
              onClick={fetchInsights}
              className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 text-white hover:bg-rose-700 rounded-lg font-semibold cursor-pointer transition shadow-xs"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry Advisory Report</span>
            </button>
          </div>
        </div>
      ) : insights ? (
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden" id="insights-report-stage">
          {/* Report Header decoration */}
          <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-indigo-950">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-300 font-semibold">Gemini AI Wealth Engine</span>
              <h3 className="text-base font-semibold font-sans tracking-tight">Active Financial Advisory Report</h3>
            </div>
            
            <button
              onClick={fetchInsights}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-lg text-xs font-semibold cursor-pointer transition"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Regenerate Report</span>
            </button>
          </div>

          {/* Render Markdown Text */}
          <div className="p-8 prose prose-slate max-w-none text-xs leading-relaxed" id="markdown-scroller">
            <div className="markdown-body">
              <Markdown>{insights}</Markdown>
            </div>
          </div>

          {/* Report Footer branding */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400 font-mono">
            Generated via Google Gemini 3.5 Flash • Protected Server Side Proxy
          </div>
        </div>
      ) : (
        <div className="p-10 text-center bg-white border border-slate-100 rounded-3xl shadow-xs" id="ai-blank-stage">
          <BrainCircuit className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-sm font-sans font-semibold text-slate-700">Financial Insight Engine Ready</h3>
          <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            Let Gemini analyze your transaction categories, current caps, savings rates, and goals in one unified pass to detect leak structures and formulate high-impact thrift routines.
          </p>
          <button
            onClick={fetchInsights}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-md"
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>Produce AI Advisory Plan</span>
          </button>
        </div>
      )}
    </div>
  );
}
