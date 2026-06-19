import React, { useState, useEffect } from 'react';
import { Transaction, Category, Reminder } from './types';
import { 
  DEFAULT_CATEGORIES, 
  INITIAL_TRANSACTIONS 
} from './data';
import Dashboard from './components/Dashboard';
import TransactionModal from './components/TransactionModal';
import TransactionList from './components/TransactionList';
import RemindersList from './components/RemindersList';

import { 
  LayoutDashboard, 
  Receipt, 
  PlusCircle, 
  Calendar, 
  User, 
  DollarSign,
  TrendingUp,
  Sliders,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Info,
  Bell
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data from Backend MongoDB REST API
  useEffect(() => {
    async function fetchData() {
      try {
        const [txRes, remRes] = await Promise.all([
          fetch('/api/transactions'),
          fetch('/api/reminders')
        ]);
        if (txRes.ok && remRes.ok) {
          const txData = await txRes.json();
          const remData = await remRes.json();
          setTransactions(txData);
          setReminders(remData);
        }
      } catch (err) {
        console.error("Error loading data from server:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);



  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Custom visual toast notifications and confirm dialog states
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    title?: string;
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => {}
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const showConfirm = (message: string, onConfirm: () => void, title = 'Confirm Action') => {
    setConfirmDialog({
      isOpen: true,
      message,
      onConfirm,
      title
    });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);





  // 3. Transactions Handlers
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
        // Edit mode
        const res = await fetch(`/api/transactions/${payload.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const updatedTx = await res.json();
        setTransactions(prev => prev.map(t => t.id === payload.id ? updatedTx : t));
        showToast("Transaction updated successfully!", "success");
      } else {
        // Create mode
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const newTx = await res.json();
        setTransactions(prev => [newTx, ...prev]);
        showToast("Transaction recorded successfully!", "success");
      }
    } catch (err) {
      console.error("Error saving transaction:", err);
      showToast("Failed to save transaction.", "error");
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setTransactions(prev => prev.filter(t => t.id !== id));
        showToast("Transaction deleted.", "info");
      }
    } catch (err) {
      console.error("Error deleting transaction:", err);
      showToast("Failed to delete transaction.", "error");
    }
  };

  const handleImportTransactions = async (imported: Transaction[]) => {
    try {
      const promises = imported.map(t => 
        fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: t.type,
            amount: t.amount,
            title: t.title,
            date: t.date,
            note: t.note
          })
        }).then(res => res.json())
      );
      const newTransactions = await Promise.all(promises);
      setTransactions(prev => [...newTransactions, ...prev]);
      showToast(`Imported ${newTransactions.length} entries!`, "success");
    } catch (err) {
      console.error("Error importing transactions:", err);
      showToast("Failed to import transactions.", "error");
    }
  };

  // Reminders Handlers
  const handleAddReminder = async (title: string, amount: number, date: string, subject: string) => {
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, amount, date, subject, completed: false })
      });
      const newReminder = await res.json();
      setReminders(prev => [...prev, newReminder]);
      showToast("Reminder created successfully!", "success");
    } catch (err) {
      console.error("Error creating reminder:", err);
      showToast("Failed to create reminder.", "error");
    }
  };

  const handleToggleReminder = async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !reminder.completed })
      });
      const updatedReminder = await res.json();
      setReminders(prev => prev.map(r => r.id === id ? updatedReminder : r));
    } catch (err) {
      console.error("Error toggling reminder:", err);
      showToast("Failed to update reminder.", "error");
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setReminders(prev => prev.filter(r => r.id !== id));
        showToast("Reminder deleted.", "info");
      }
    } catch (err) {
      console.error("Error deleting reminder:", err);
      showToast("Failed to delete reminder.", "error");
    }
  };



  const activeTabClass = "inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs transition duration-200 shadow-sm cursor-pointer";
  const inactiveTabClass = "inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-semibold text-xs transition duration-200 cursor-pointer";

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans antialiased text-slate-800" id="main-layout">
      
      {/* 1. Header Banner Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100" id="brand-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo Identity */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-md">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-none">Wealth Capital</h1>
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">Ledger Track v2</span>
            </div>
          </div>

          {/* Quick Date Display & User Indicator */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-slate-400 border border-slate-100 px-3 py-1.5 rounded-xl bg-slate-50">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold select-none border border-slate-800 shadow-xs">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xs:inline">Owner Account</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Body stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Tab Selection Navigation Bar */}
        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-4 bg-white p-2.5 rounded-2xl border border-slate-100 shadow-2xs" id="navigation-bar">
          <div className="flex flex-wrap items-center gap-1.5" id="nav-tabs-list">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={activeTab === 'dashboard' ? activeTabClass : inactiveTabClass}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Overview Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </button>
            
            <button
              onClick={() => setActiveTab('transactions')}
              className={activeTab === 'transactions' ? activeTabClass : inactiveTabClass}
            >
              <Receipt className="w-4 h-4" />
              <span className="hidden sm:inline">Log Entry</span>
              <span className="sm:hidden">Entry</span>
            </button>

            <button
              onClick={() => setActiveTab('reminders')}
              className={activeTab === 'reminders' ? activeTabClass : inactiveTabClass}
            >
              <Bell className="w-4 h-4 text-indigo-500 font-bold" />
              <span className="hidden sm:inline">Reminders</span>
              <span className="sm:hidden">Alerts</span>
            </button>


          </div>

          {/* Core Action triggers */}
          <button
            onClick={handleAddNewTransactionClick}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition duration-200 cursor-pointer"
            id="register-activity-btn"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Cash flow</span>
          </button>
        </div>

        {/* 3. Core Tab Screens Renderer */}
        <div className="bg-transparent" id="active-screen-stage">
          {activeTab === 'dashboard' && (
            <Dashboard 
              transactions={transactions} 
              categories={categories} 
              onNavigateToTab={setActiveTab}
            />
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

      {/* 4. Overlay Modals */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        editingTransaction={editingTransaction}
      />

      {/* Lightweight non-blocking system toasts */}
      {toast && (
        <div 
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3.5 rounded-xl border border-slate-100 bg-white/95 backdrop-blur-md shadow-lg animate-in slide-in-from-bottom duration-300 max-w-sm" 
          id="custom-toast"
        >
          {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-sky-500 shrink-0" />}
          <span className="text-xs font-semibold text-slate-700">{toast.message}</span>
        </div>
      )}

      {/* Custom micro confirmation dialog box */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="confirm-modal-overlay">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
            onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} 
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 border border-slate-100 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-slate-500" />
              <span>{confirmDialog.title || "Confirm Action"}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex items-center justify-end gap-3 mt-5 pt-3 border-t border-slate-50">
              <button
                type="button"
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg cursor-pointer transition shadow-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Clean minimal Footer */}
      <footer className="py-6 mt-12 bg-white border-t border-slate-100 text-center text-xs text-slate-400 font-mono" id="main-footer">
        © 2026 Wealth Capital Inc. • Offline Secure Mode Enabled
      </footer>
    </div>
  );
}
