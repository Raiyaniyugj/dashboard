export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  title: string;
  date: string; // YYYY-MM-DD
  note: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Name of Lucide icon
  color: string; // Tailwind bg- class or custom hex / color name
  textColor: string; // Tailwind text- class
  type: 'income' | 'expense';
}

export interface Budget {
  id: string;
  category: string; // matches Category name or id
  limitAmount: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // YYYY-MM-DD
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
}

export interface Reminder {
  id: string;
  title: string;
  amount: number;
  date: string;
  subject: string;
  completed: boolean;
}
