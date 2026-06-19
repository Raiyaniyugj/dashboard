import React, { useState, useEffect } from 'react';
import { Transaction, Category, Reminder } from './types';
import { DEFAULT_CATEGORIES } from './data';
import Dashboard from './components/Dashboard';
import TransactionModal from './components/TransactionModal';
import TransactionList from './components/TransactionList';
import RemindersList from './components/RemindersList';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import {
  LayoutDashboard,
  Receipt,
  PlusCircle,
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Info,
  Bell,
  LogOut,
  User
} from 'lucide-react';

type AuthPage = 'login' | 'register' | 'forgot' | 'reset';

// ─── Inner App (has access to AuthContext) ────────────────────────────────────
function AppContent() {
  const { user, logout, authFetch, loading: authLoading } = useAuth();

  // Auth page routing
  const [authPage, setAuthPage] = useState<AuthPage>('login');
  const [resetToken, setResetToken] = useState('');

  // Detect /reset-password/:token in URL on mount
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/\/reset-password\/([A-Za-z0-9]+)/);
    if (match) {
      setResetToken(match[1]);
      setAuthPage('reset');
    }
  }, []);

  // ─── Dashboard State ─────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data when user logs in
  useEffect(() => {
    if (!user) return;
    async function fetchData() {
      setLoading(true);
      try {
        const [txRes, remRes] = await Promise.all([
          authFetch('/api/transactions'),
          authFetch('/api/reminders')
        ]);
        if (txRes.ok && remRes.ok) {
          setTransactions(await txRes.json());
          setReminders(await remRes.json());
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    title?: string;
  }>({ isOpen: false, message: '', onConfirm: () => {} });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const showConfirm = (message: string, onConfirm: () => void, title = 'Confirm Action') => {
    setConfirmDialog({ isOpen: true, message, onConfirm, title });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ─── Transaction Handlers ─────────────────────────────────────────────────────
  const handleAddNewTransactionClick = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleEditTransactionClick = (t: Transaction) => {
    setEditingTransaction(t);
    setIsModalOpen(true);
  };

  const handleSaveTransaction = async (payload: Omit<Transaction, 'id'> & { id?: string }) => {
    try {
      if (payload.id) {
        const res = await authFetch(`/api/transactions/${payload.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        const updatedTx = await res.json();
        setTransactions(prev => prev.map(t => t.id === payload.id ? updatedTx : t));
        showToast('Transaction updated successfully!', 'success');
      } else {
        const res = await authFetch('/api/transactions', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        const newTx = await res.json();
        setTransactions(prev => [newTx, ...prev]);
        showToast('Transaction recorded successfully!', 'success');
      }
    } catch (err) {
      showToast('Failed to save transaction.', 'error');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const res = await authFetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTransactions(prev => prev.filter(t => t.id !== id));
        showToast('Transaction deleted.', 'info');
      }
    } catch {
      showToast('Failed to delete transaction.', 'error');
    }
  };

  const handleImportTransactions = async (imported: Transaction[]) => {
    try {
      const promises = imported.map(t =>
        authFetch('/api/transactions', {
          method: 'POST',
          body: JSON.stringify({ type: t.type, amount: t.amount, title: t.title, date: t.date, note: t.note })
        }).then(res => res.json())
      );
      const newTransactions = await Promise.all(promises);
      setTransactions(prev => [...newTransactions, ...prev]);
      showToast(`Imported ${newTransactions.length} entries!`, 'success');
    } catch {
      showToast('Failed to import transactions.', 'error');
    }
  };

  // ─── Reminder Handlers ────────────────────────────────────────────────────────
  const handleAddReminder = async (title: string, amount: number, date: string, subject: string) => {
    try {
      const res = await authFetch('/api/reminders', {
        method: 'POST',
        body: JSON.stringify({ title, amount, date, subject, completed: false })
      });
      const newReminder = await res.json();
      setReminders(prev => [...prev, newReminder]);
      showToast('Reminder created successfully!', 'success');
    } catch {
      showToast('Failed to create reminder.', 'error');
    }
  };

  const handleToggleReminder = async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;
    try {
      const res = await authFetch(`/api/reminders/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ completed: !reminder.completed })
      });
      const updatedReminder = await res.json();
      setReminders(prev => prev.map(r => r.id === id ? updatedReminder : r));
    } catch {
      showToast('Failed to update reminder.', 'error');
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      const res = await authFetch(`/api/reminders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReminders(prev => prev.filter(r => r.id !== id));
        showToast('Reminder deleted.', 'info');
      }
    } catch {
      showToast('Failed to delete reminder.', 'error');
    }
  };

  // ─── Auth page loading state ──────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-slate-700 border-t-emerald-400 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-mono">Loading session…</p>
        </div>
      </div>
    );
  }

  // ─── Show auth pages if not logged in ────────────────────────────────────────
  if (!user) {
    if (authPage === 'register') return <Register onNavigate={setAuthPage} />;
    if (authPage === 'forgot') return <ForgotPassword onNavigate={setAuthPage} />;
    if (authPage === 'reset') return <ResetPassword token={resetToken} onNavigate={setAuthPage} />;
    return <Login onNavigate={setAuthPage} />;
  }

  // ─── Main Dashboard ───────────────────────────────────────────────────────────
  const activeTabClass = "inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs transition duration-200 shadow-sm cursor-pointer";
  const inactiveTabClass = "inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-semibold text-xs transition duration-200 cursor-pointer";

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans antialiased text-slate-800" id="main-layout">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100" id="brand-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-md">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-none">Wealth Capital</h1>
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">Ledger Track v2</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-slate-400 border border-slate-100 px-3 py-1.5 rounded-xl bg-slate-50">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>

            {/* User badge + logout */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold select-none border border-slate-800 shadow-xs">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline max-w-[120px] truncate">{user.name}</span>
              </div>
              <button
                onClick={() => {
                  showConfirm('Are you sure you want to sign out?', logout, 'Sign Out');
                }}
                title="Sign out"
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-4 bg-white p-2.5 rounded-2xl border border-slate-100 shadow-2xs" id="navigation-bar">
          <div className="flex flex-wrap items-center gap-1.5" id="nav-tabs-list">
            <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? activeTabClass : inactiveTabClass}>
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Overview Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </button>
            <button onClick={() => setActiveTab('transactions')} className={activeTab === 'transactions' ? activeTabClass : inactiveTabClass}>
              <Receipt className="w-4 h-4" />
              <span className="hidden sm:inline">Log Entry</span>
              <span className="sm:hidden">Entry</span>
            </button>
            <button onClick={() => setActiveTab('reminders')} className={activeTab === 'reminders' ? activeTabClass : inactiveTabClass}>
              <Bell className="w-4 h-4 text-indigo-500" />
              <span className="hidden sm:inline">Reminders</span>
              <span className="sm:hidden">Alerts</span>
            </button>
          </div>

          <button
            onClick={handleAddNewTransactionClick}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition duration-200 cursor-pointer"
            id="register-activity-btn"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Cash flow</span>
          </button>
        </div>

        <div className="bg-transparent" id="active-screen-stage">
          {activeTab === 'dashboard' && (
            <Dashboard transactions={transactions} categories={categories} onNavigateToTab={setActiveTab} />
          )}
          {activeTab === 'transactions' && (
            <TransactionList
              transactions={transactions}
              onAddClick={handleAddNewTransactionClick}
              onEditClick={handleEditTransactionClick}
              onDelete={handleDeleteTransaction}
              onImport={handleImportTransactions}
              onShowToast={showToast}
              onShowConfirm={showConfirm}
            />
          )}
          {activeTab === 'reminders' && (
            <RemindersList
              reminders={reminders}
              onAddReminder={handleAddReminder}
              onToggleReminder={handleToggleReminder}
              onDeleteReminder={handleDeleteReminder}
              onShowToast={showToast}
              onShowConfirm={showConfirm}
            />
          )}
        </div>
      </main>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        editingTransaction={editingTransaction}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3.5 rounded-xl border border-slate-100 bg-white/95 backdrop-blur-md shadow-lg animate-in slide-in-from-bottom duration-300 max-w-sm" id="custom-toast">
          {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-sky-500 shrink-0" />}
          <span className="text-xs font-semibold text-slate-700">{toast.message}</span>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="confirm-modal-overlay">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 border border-slate-100 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-slate-500" />
              <span>{confirmDialog.title || 'Confirm Action'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex items-center justify-end gap-3 mt-5 pt-3 border-t border-slate-50">
              <button
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg cursor-pointer transition"
              >Cancel</button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg cursor-pointer transition shadow-sm"
              >Confirm</button>
            </div>
          </div>
        </div>
      )}

      <footer className="py-6 mt-12 bg-white border-t border-slate-100 text-center text-xs text-slate-400 font-mono" id="main-footer">
        © 2026 Wealth Capital Inc. • Logged in as {user.email}
      </footer>
    </div>
  );
}

// ─── Root App with AuthProvider wrapper ───────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
