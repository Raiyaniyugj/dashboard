import React, { useState, useMemo } from 'react';
import { SavingsGoal } from '../types';
import { Sparkles, Trash2, Milestone, Plus, PiggyBank, Flame } from 'lucide-react';

interface SavingsGoalsListProps {
  goals: SavingsGoal[];
  onAddGoal: (name: string, targetAmount: number, deadline: string) => void;
  onUpdateGoalProgress: (id: string, amountToAdd: number) => void;
  onDeleteGoal: (id: string) => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onShowConfirm?: (message: string, onConfirm: () => void, title?: string) => void;
}

export default function SavingsGoalsList({
  goals,
  onAddGoal,
  onUpdateGoalProgress,
  onDeleteGoal,
  onShowToast,
  onShowConfirm
}: SavingsGoalsListProps) {
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
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [incrementAmounts, setIncrementAmounts] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Savings goal theme name is required.');
      return;
    }

    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0) {
      setError('Please set a valid target savings amount greater than zero.');
      return;
    }

    if (!deadline) {
      setError('Goal completion target date is required.');
      return;
    }

    onAddGoal(name, target, deadline);
    setName('');
    setTargetAmount('');
    setDeadline('');
    notify(`Created a new savings goal: "${name}"!`, 'success');
  };

  const handleUpdateProgress = (id: string) => {
    const amountStr = incrementAmounts[id];
    if (!amountStr || isNaN(parseFloat(amountStr))) {
      notify('Please input a valid sum value to contribute.', 'error');
      return;
    }

    const contribution = parseFloat(amountStr);
    onUpdateGoalProgress(id, contribution);
    notify(`Deposited $${contribution.toLocaleString()} into savings objective!`, 'success');

    setIncrementAmounts(prev => ({
      ...prev,
      [id]: ''
    }));
  };

  return (
    <div className="space-y-6" id="savings-goals-container">
      <div>
        <h2 className="text-xl font-sans font-medium tracking-tight text-slate-900">Savings Target Incubator</h2>
        <p className="text-sm text-slate-500">Dedicate and accumulate assets toward dreams and safety nets.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="savings-split-layout">
        
        {/* Establish Savings Goal Form */}
        <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-xs self-start" id="create-savings-goal-card">
          <h3 className="text-sm font-sans font-semibold text-slate-800 mb-4 flex items-center gap-1.5 animate-pulse">
            <PiggyBank className="w-4 h-4 text-emerald-500" />
            <span>Fund Visual Target</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Goal Description Name</label>
              <input
                type="text"
                placeholder="e.g. Dream Trip to Japan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Target Sum (USD)</label>
              <input
                type="number"
                placeholder="e.g. 5000.00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Target Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 focus:outline-hidden"
                required
              />
            </div>

            {error && <p className="text-xs text-rose-500">{error}</p>}

            <button
              type="submit"
              className="w-full py-2.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl cursor-pointer transition shadow-xs"
            >
              Configure Target Goal
            </button>
          </form>
        </div>

        {/* List of savings targets */}
        <div className="lg:col-span-2 space-y-4" id="savings-targets-list">
          {goals.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-100 rounded-2xl text-slate-400">
              <Milestone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">No active savings targets set.</p>
              <p className="text-xs text-slate-300 mt-1">Harness high-interest saving habits by configuring your first target fund!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map((g) => {
                const percent = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
                const isAchieved = percent >= 100;

                return (
                  <div 
                    key={g.id} 
                    className="p-5 bg-white border border-slate-100 rounded-2xl shadow-xs space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      {/* Title block */}
                      <div className="flex items-start justify-between gap-1.5">
                        <div>
                          <span className="font-semibold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                            {g.name}
                            {isAchieved && <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-bounce" />}
                          </span>
                          <span className="block text-[10px] text-slate-400 mt-0.5 font-mono">Deadline: {g.deadline}</span>
                        </div>
                        
                        <button
                          onClick={() => {
                            askConfirm(`Remove custom savings goal: ${g.name}?`, () => {
                              onDeleteGoal(g.id);
                              notify(`Savings goal "${g.name}" removed successfully.`, 'info');
                            }, 'Remove Savings Goal');
                          }}
                          className="p-1 px-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="Remove Goal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Math figures */}
                      <div className="flex items-baseline justify-between mt-4">
                        <div className="text-xs text-slate-500">
                          Saved: <span className="font-bold text-emerald-600">${g.currentAmount.toLocaleString()}</span> <span className="text-[10px] text-slate-400">/ ${g.targetAmount.toLocaleString()}</span>
                        </div>
                        <div className="text-xs font-semibold text-slate-600">
                          {percent.toFixed(0)}%
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2.5">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${isAchieved ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                    </div>

                    {/* Quick Contribution form actions */}
                    {!isAchieved && (
                      <div className="pt-3 border-t border-slate-50 flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-xs">$</span>
                          <input
                            type="number"
                            placeholder="Add sum..."
                            value={incrementAmounts[g.id] || ''}
                            onChange={(e) => setIncrementAmounts(prev => ({
                              ...prev,
                              [g.id]: e.target.value
                            }))}
                            className="w-full pl-6 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden"
                          />
                        </div>
                        <button
                          onClick={() => handleUpdateProgress(g.id)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer transition shadow-xs flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Deposit</span>
                        </button>
                      </div>
                    )}

                    {isAchieved && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
                        <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Visual target accomplished! Claim budget allocation.</span>
                      </div>
                    )}
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
