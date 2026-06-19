import React, { useMemo } from 'react';
import { Transaction, Category, FinancialSummary } from '../types';
import { ArrowUpRight, ArrowDownLeft, Wallet, Percent } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

interface DashboardProps {
  transactions: Transaction[];
  onNavigateToTab: (tab: string) => void;
}

export default function Dashboard({ transactions, onNavigateToTab }: DashboardProps) {
  // 1. Calculate overall financial summary
  const summary = useMemo<FinancialSummary>(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach(t => {
      if (t.type === 'income') {
        income += t.amount;
      } else {
        expense += t.amount;
      }
    });
    const savings = income - expense;
    const rate = income > 0 ? (savings / income) * 100 : 0;
    return {
      totalIncome: income,
      totalExpense: expense,
      netSavings: savings,
      savingsRate: rate
    };
  }, [transactions]);

  // 2. Aggregate expenses by title for Pie Chart
  const categoryChartData = useMemo(() => {
    const expenseMap: Record<string, number> = {};
    
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const titleName = t.title;
      expenseMap[titleName] = (expenseMap[titleName] || 0) + t.amount;
    });

    const colors = [
      'bg-blue-500/10 text-blue-600',
      'bg-amber-500/10 text-amber-600',
      'bg-violet-500/10 text-violet-600',
      'bg-orange-500/10 text-orange-600',
      'bg-pink-500/10 text-pink-600',
      'bg-fuchsia-500/10 text-fuchsia-600',
      'bg-rose-500/10 text-rose-600',
      'bg-sky-500/10 text-sky-600',
      'bg-purple-500/10 text-purple-600',
      'bg-emerald-500/10 text-emerald-600',
    ];

    return Object.entries(expenseMap)
      .map(([name, value], index) => {
        return {
          name,
          value,
          color: colors[index % colors.length]
        };
      })
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // 3. Trends over time: Group transactions by day for current month
  const dailyChartData = useMemo(() => {
    const dailyMap: Record<string, { income: number; expense: number }> = {};
    
    // We can pre-fill or just aggregate based on transaction dates in the last 15 days or current month sorted
    transactions.forEach(t => {
      // Get short date key like 'June 12' or '06-12'
      let dateLabel = '';
      try {
        const parsedDate = new Date(t.date + 'T00:00:00');
        dateLabel = parsedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
      } catch (e) {
        dateLabel = t.date;
      }

      if (!dailyMap[dateLabel]) {
        dailyMap[dateLabel] = { income: 0, expense: 0 };
      }

      if (t.type === 'income') {
        dailyMap[dateLabel].income += t.amount;
      } else {
        dailyMap[dateLabel].expense += t.amount;
      }
    });

    // Sort chronologically (simplistic parse approach)
    return Object.entries(dailyMap)
      .map(([date, data]) => ({
        date,
        income: data.income,
        expense: data.expense
      }))
      .slice(-10); // Show last 10 days of activities to avoid clutter
  }, [transactions]);





  return (
    <div className="space-y-6" id="dashboard-container">
      {/* 1. Header & Quick Analytics Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-sans font-medium tracking-tight text-slate-900">Financial Command Center</h2>
          <p className="text-sm text-slate-500">Real-time balances, income flow, and budget checks.</p>
        </div>
        

      </div>

      {/* 2. KPI Cards Minimal Setup */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-grid">
        {/* Net Worth */}
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-3" id="net-balance-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Net Balance</span>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-700">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
              {summary.netSavings >= 0 ? '' : '-'}₹{Math.abs(summary.netSavings).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1">Available cash pool</p>
          </div>
        </div>

        {/* Total Income */}
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-3" id="total-income-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Total Income</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
              ₹{summary.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1">Earnings received</p>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-3" id="total-expense-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Total Expenses</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
              ₹{summary.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1">Cash outflow registered</p>
          </div>
        </div>

        {/* Savings Rate */}
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-3" id="savings-rate-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Savings Rate</span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
              {summary.savingsRate.toFixed(1)}%
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  summary.savingsRate >= 30 ? 'bg-emerald-500' : summary.savingsRate >= 10 ? 'bg-cyan-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, summary.savingsRate))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Visualizations Row / Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-charts-layout">
        
        {/* Cash Flow Timeline (2/3 width on large screen) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-100 shadow-xs" id="cash-flow-chart-container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-sans font-semibold text-slate-800">Cash Flow History</h3>
              <p className="text-xs text-slate-400">Income vs. Expenses across latest dates</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-600">Expense</span>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full" id="timeline-chart">
            {dailyChartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                <p className="text-sm">No transaction historical points to map</p>
                <p className="text-xs text-slate-300">Add transactions to see visual cash lines</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="date" 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                    formatter={(value: any) => [`₹${value}`, undefined]}
                  />
                  <Bar dataKey="income" radius={[4, 4, 0, 0]} fill="#10b981" />
                  <Bar dataKey="expense" radius={[4, 4, 0, 0]} fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Expenses Category Breakout */}
        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between" id="category-distribution-card">
          <div>
            <h3 className="text-sm font-sans font-semibold text-slate-800">Expense Allocation</h3>
            <p className="text-xs text-slate-400 mb-6">Distribution by spending categories</p>
            
            <div className="h-44 w-full relative flex items-center justify-center" id="pie-chart">
              {categoryChartData.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <p className="text-sm">No expense records</p>
                  <p className="text-xs text-slate-300">File your first expense</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => {
                        // Extract color style hex dynamically if possible or map colors
                        let fillHex = '#f59e0b'; // generic fallback
                        if (entry.color.includes('blue')) fillHex = '#3b82f6';
                        else if (entry.color.includes('rose')) fillHex = '#f43f5e';
                        else if (entry.color.includes('orange')) fillHex = '#ea580c';
                        else if (entry.color.includes('violet')) fillHex = '#8b5cf6';
                        else if (entry.color.includes('amber')) fillHex = '#f59e0b';
                        else if (entry.color.includes('pink')) fillHex = '#ec4899';
                        else if (entry.color.includes('fuchsia')) fillHex = '#d946ef';
                        else if (entry.color.includes('purple')) fillHex = '#a855f7';
                        else if (entry.color.includes('sky')) fillHex = '#0ea5e9';
                        
                        return <Cell key={`cell-${index}`} fill={fillHex} />;
                      })}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9' }}
                      formatter={(value: any) => [`₹${value}`, undefined]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1 mt-4" id="category-chart-legend">
            {categoryChartData.slice(0, 4).map((item, index) => {
              const totalExp = summary.totalExpense || 1;
              const percent = ((item.value / totalExp) * 105).toFixed(0); // scale gracefully
              return (
                <div key={index} className="flex items-center justify-between text-xs font-sans">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color.split(' ')[0]} border border-slate-200`} />
                    <span className="text-slate-600 font-medium truncate max-w-28">{item.name}</span>
                  </div>
                  <div className="text-slate-500 font-medium">
                    ₹{item.value.toLocaleString()} <span className="text-[10px] text-slate-400">({percent}%)</span>
                  </div>
                </div>
              );
            })}
            {categoryChartData.length > 4 && (
              <p className="text-[10px] text-center text-slate-400 mt-1 cursor-pointer hover:underline" onClick={() => onNavigateToTab('transactions')}>
                + {categoryChartData.length - 4} more entries. View full list.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 4. Mini Transactions Feed */}
      <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-xs" id="quick-activity-log">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-sans font-semibold text-slate-800">Recent Cash Updates</h3>
            <p className="text-xs text-slate-400">Quick view of your latest entries</p>
          </div>
          <button 
            onClick={() => onNavigateToTab('transactions')}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold cursor-pointer transition"
          >
            Manage Entries
          </button>
        </div>

        <div className="overflow-x-auto">
          {transactions.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <p className="text-sm font-medium">No ledger records on account yet.</p>
              <p className="text-xs text-slate-300 mt-1">Add details regarding your income/expenses to populate the board.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse" id="mini-transactions-table">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-mono">
                  <th className="py-2.5 font-medium">DATE</th>
                  <th className="py-2.5 font-medium">TITLE</th>
                  <th className="py-2.5 font-bold">FLOW EFFECT</th>
                  <th className="py-2.5 font-medium">NOTES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {transactions.slice(0, 5).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 font-mono text-slate-500">
                      {new Date(t.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                    </td>
                    <td className="py-3 font-sans font-medium text-slate-700">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-slate-100 text-slate-800 border-slate-200">
                        {t.title}
                      </span>
                    </td>
                    <td className={`py-3 font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-700'}`}>
                      {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-slate-500 truncate max-w-sm font-sans" title={t.note}>
                      {t.note || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
