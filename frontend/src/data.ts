import { Category, Transaction, Budget, SavingsGoal } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  // Income Categories
  { id: 'salary', name: 'Salary', icon: 'Briefcase', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600', textColor: 'text-emerald-700', type: 'income' },
  { id: 'freelance', name: 'Freelance & Side Hustles', icon: 'Laptop', color: 'bg-teal-500/10 border-teal-500/20 text-teal-600', textColor: 'text-teal-700', type: 'income' },
  { id: 'investments', name: 'Investments', icon: 'TrendingUp', color: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-600', textColor: 'text-cyan-700', type: 'income' },
  { id: 'refunds', name: 'Gifts & Refunds', icon: 'Gift', color: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600', textColor: 'text-indigo-700', type: 'income' },

  // Expense Categories
  { id: 'housing', name: 'Rent & Housing', icon: 'Home', color: 'bg-blue-500/10 border-blue-500/20 text-blue-600', textColor: 'text-blue-700', type: 'expense' },
  { id: 'food', name: 'Food & Dining', icon: 'Utensils', color: 'bg-amber-500/10 border-amber-500/20 text-amber-600', textColor: 'text-amber-700', type: 'expense' },
  { id: 'utilities', name: 'Utilities & Bills', icon: 'Zap', color: 'bg-violet-500/10 border-violet-500/20 text-violet-600', textColor: 'text-violet-700', type: 'expense' },
  { id: 'transit', name: 'Transportation', icon: 'Car', color: 'bg-orange-500/10 border-orange-500/20 text-orange-600', textColor: 'text-orange-700', type: 'expense' },
  { id: 'leisure', name: 'Leisure & Entertainment', icon: 'Film', color: 'bg-pink-500/10 border-pink-500/20 text-pink-600', textColor: 'text-pink-700', type: 'expense' },
  { id: 'shopping', name: 'Shopping', icon: 'ShoppingBag', color: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-600', textColor: 'text-fuchsia-700', type: 'expense' },
  { id: 'health', name: 'Health & Wellness', icon: 'HeartPulse', color: 'bg-rose-500/10 border-rose-500/20 text-rose-600', textColor: 'text-rose-700', type: 'expense' },
  { id: 'travel', name: 'Travel', icon: 'Globe', color: 'bg-sky-500/10 border-sky-500/20 text-sky-600', textColor: 'text-sky-700', type: 'expense' },
  { id: 'education', name: 'Education', icon: 'BookOpen', color: 'bg-purple-500/10 border-purple-500/20 text-purple-600', textColor: 'text-purple-700', type: 'expense' },
  { id: 'other', name: 'Other & Miscellaneous', icon: 'MoreHorizontal', color: 'bg-slate-500/10 border-slate-500/20 text-slate-600', textColor: 'text-slate-700', type: 'expense' }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_BUDGETS: Budget[] = [
  { id: 'b1', category: 'Food & Dining', limitAmount: 500 },
  { id: 'b2', category: 'Leisure & Entertainment', limitAmount: 250 },
  { id: 'b3', category: 'Shopping', limitAmount: 400 },
  { id: 'b4', category: 'Transportation', limitAmount: 200 },
  { id: 'b5', category: 'Utilities & Bills', limitAmount: 180 }
];

export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [
  { id: 's1', name: 'Japan Travel Fund', targetAmount: 4000, currentAmount: 1450, deadline: '2026-12-15' },
  { id: 's2', name: 'Emergency Safety Net', targetAmount: 10000, currentAmount: 4800, deadline: '2027-03-01' }
];
