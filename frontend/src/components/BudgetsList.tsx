import React, { useState, useMemo, useEffect } from 'react';
import { Budget, Category, Transaction } from '../types';
import { Target, Plus, Trash2, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

interface BudgetsListProps {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  onAddBudget: (category: string, limitAmount: number) => void;
  onDeleteBudget: (id: string) => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onShowConfirm?: (message: string, onConfirm: () => void, title?: string) => void;
}

export default function BudgetsList({
  budgets,
  categories,
  transactions,
  onAddBudget,
  onDeleteBudget,
  onShowToast,
  onShowConfirm
}: BudgetsListProps) {
  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (onShowToast) {
      onShowToast(msg, type);
    } else {
      alert(msg);
    }
  };

  const askConfirm = (msg: string, onConfirmAction: () => void, title?: string) => {
    if (onShowConfirm) {
      onShowConfirm(msg, onConfirmAction, title);
    } else if (confirm(msg)) {
      onConfirmAction();
    }
  };
  const [newBudgetCategory, setNewBudgetCategory] = useState('');
  const [newBudgetLimit, setNewBudgetLimit] = useState('');
  const [error, setError] = useState('');

  // Get available expense categories (only categories who do not already have an active budget)
  const availableCategoriesForBudget = useMemo(() => {
    const budgetedCategories = budgets.map(b => b.category);
    return categories
      .filter(c => c.type === 'expense' && !budgetedCategories.includes(c.name));
  }, [categories, budgets]);

  // Set default category when available list shifts
  useEffect(() => {
    if (availableCategoriesForBudget.length > 0) {
      setNewBudgetCategory(availableCategoriesForBudget[0].name);
    } else {
      setNewBudgetCategory('');
    }
  }, [availableCategoriesForBudget]);

  // Calculate actual spending per category
  const budgetedItems = useMemo(() => {
    return budgets.map(b => {
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category === b.category)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const percent = b.limitAmount > 0 ? (spent / b.limitAmount) * 100 : 0;
      const remaining = b.limitAmount - spent;

      return {
        ...b,
        spent,
        percent,
        remaining
      };
    });
  }, [budgets, transactions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newBudgetCategory) {
      setError('Please select an expense category.');
      return;
    }

    const limit = parseFloat(newBudgetLimit);
    if (isNaN(limit) || limit <= 0) {
      setError('Please set a valid budget limit greater than zero.');
      return;
    }

    onAddBudget(newBudgetCategory, limit);
    setNewBudgetLimit('');
    notify(`Created a new spending budget for ${newBudgetCategory}!`, 'success');
  };

  return (
    <div className="space-y-6" id="budgets-management-container">
      <div>
        <h2 className="text-xl font-sans font-medium tracking-tight text-slate-900">Spending Threshold Guard</h2>
        <p className="text-sm text-slate-500">Track and constrain monthly spending thresholds to safe targets.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="budgets-grid-split">
        {/* Left: Add Threshold Form */}
        <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-xs self-start" id="create-budget-card">
          <h3 className="text-sm font-sans font-semibold text-slate-800 mb-4 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-violet-500" />
            <span>Establish Category Cap</span>
          </h3>

          {availableCategoriesForBudget.length === 0 ? (
            <p className="text-xs text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100">
              All available expense categories successfully carry active budget limits! Go to the ledger list to add custom categories.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Expense Category</label>
                <select
                  value={newBudgetCategory}
                  onChange={(e) => setNewBudgetCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 focus:outline-hidden cursor-pointer"
                  required
                >
                  {availableCategoriesForBudget.map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Monthly Limit (USD)</label>
                <input
                  type="number"
                  placeholder="e.g. 350.00"
                  value={newBudgetLimit}
                  onChange={(e) => setNewBudgetLimit(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 focus:outline-hidden"
                  required
                />
              </div>

              {error && <p className="text-xs text-rose-500">{error}</p>}

              <button
                type="submit"
                className="w-full py-2.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl cursor-pointer transition shadow-xs"
              >
                Hook Custom Threshold
              </button>
            </form>
          )}
        </div>

        {/* Right: Active Budget Enforcements List */}
        <div className="lg:col-span-2 space-y-4" id="budget-thresholds-list">
          {budgetedItems.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-100 rounded-2xl text-slate-400">
              <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">No active budget thresholds currently enforced.</p>
              <p className="text-xs text-slate-300 mt-1">Protect against overspending by setting up dining or shopping caps.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {budgetedItems.map((item) => {
                const isOver = item.percent > 100;
                const isClose = item.percent >= 80 && item.percent <= 100;
                
                // Categorize progress bars colors
                const progressColorClass = isOver 
                  ? 'bg-rose-500' 
                  : isClose 
                    ? 'bg-amber-500' 
                    : 'bg-emerald-500';

                return (
                  <div 
                    key={item.id} 
                    className="p-5 bg-white border border-slate-100 rounded-2xl shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Name & Clear Button */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-semibold text-slate-800 text-sm tracking-tight">{item.category}</span>
                          <span className="block text-[10px] text-slate-400 uppercase mt-0.5 font-mono">Enforced Threshold</span>
                        </div>
                        
                        <button
                          onClick={() => {
                            askConfirm(`Remove custom limit for ${item.category}?`, () => {
                              onDeleteBudget(item.id);
                              notify(`Budget limit for ${item.category} removed.`, 'info');
                            }, 'Delete Budget Limit');
                          }}
                          className="p-1 px-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="Delete Threshold Limit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Amounts line */}
                      <div className="flex items-baseline justify-between mt-4">
                        <div className="text-xs text-slate-500">
                          Spent: <span className="font-semibold text-slate-800">${item.spent.toLocaleString()}</span> text-cap <span className="font-mono text-[10px] text-slate-400">/ ${item.limitAmount}</span>
                        </div>
                        <div className={`text-xs font-semibold ${isOver ? 'text-rose-600' : isClose ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {item.percent.toFixed(0)}% Used
                        </div>
                      </div>

                      {/* Progress Bar Container */}
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2.5">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${progressColorClass}`}
                          style={{ width: `${Math.min(100, item.percent)}%` }}
                        />
                      </div>
                    </div>

                    {/* Alerts notification alerts */}
                    <div className="pt-2 border-t border-slate-50 flex items-center gap-2">
                      {isOver ? (
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg w-full">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Cap exceeded by ${Math.abs(item.remaining).toLocaleString()}! Tweak spend patterns.</span>
                        </div>
                      ) : isClose ? (
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg w-full">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Close to Cap. Remaining: ${item.remaining.toLocaleString()}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg w-full">
                          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Safe track. Remaining: ${item.remaining.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
