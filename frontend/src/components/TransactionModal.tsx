import React, { useState, useEffect } from 'react';
import { Transaction, Category } from '../types';
import { X, IndianRupee, Calendar, FileText, ChevronDown } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'> & { id?: string }) => void;
  editingTransaction?: Transaction | null;
}

export default function TransactionModal({
  isOpen,
  onClose,
  onSave,
  editingTransaction
}: TransactionModalProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // When editing value shifts, prepopulate or reset fields
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(String(editingTransaction.amount));
      setTitle(editingTransaction.title);
      setDate(editingTransaction.date);
      setNote(editingTransaction.note || '');
      setErrors({});
    } else {
      setType('expense');
      setAmount('');
      setTitle('');
      // Automatically default to today's date in local time
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setNote('');
      setErrors({});
    }
  }, [editingTransaction, isOpen]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than zero.';
    }
    if (!title.trim()) {
      newErrors.title = 'A transaction title is required.';
    }
    if (!date) {
      newErrors.date = 'Please set a transaction execution date.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      id: editingTransaction?.id,
      type,
      amount: parseFloat(amount),
      title,
      date,
      note
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="transaction-modal-overlay">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Dialog container */}
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-100 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" id="transaction-modal">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-base font-semibold font-sans text-slate-800">
            {editingTransaction ? 'Edit Transaction Details' : 'Record New Transaction'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
          {/* 1. Transaction Type Toggle */}
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category Flow Goal</span>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 ${type === 'expense'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                Expense Outflow
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 ${type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                Income Flow
              </button>
            </div>
          </div>

          {/* 2. Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Amount (INR)</label>
            <div className="relative rounded-xl overflow-hidden shadow-xs border border-slate-200">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <IndianRupee className="w-4 h-4" />
              </div>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white text-slate-800 text-sm focus:outline-hidden focus:ring-1 focus:ring-slate-400"
                required
                id="amount-input"
              />
            </div>
            {errors.amount && <p className="text-xs text-rose-500 mt-1">{errors.amount}</p>}
          </div>

          {/* 3. Title Input (Manual Entry) */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Title</label>
            <div className="relative rounded-xl overflow-hidden shadow-xs border border-slate-200">
              <input
                type="text"
                placeholder=""
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-slate-800 text-sm focus:outline-hidden focus:ring-1 focus:ring-slate-400"
                required
                id="title-input"
              />
            </div>
            {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title}</p>}
          </div>

          {/* 4. Date and Note Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
              <div className="relative rounded-xl overflow-hidden shadow-xs border border-slate-200">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white text-slate-800 text-sm focus:outline-hidden focus:ring-1 focus:ring-slate-400"
                  required
                  id="date-input"
                />
              </div>
              {errors.date && <p className="text-xs text-rose-500 mt-1">{errors.date}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Memo / Notes (Optional)</label>
              <div className="relative rounded-xl overflow-hidden shadow-xs border border-slate-200">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FileText className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder=""
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white text-slate-800 text-sm focus:outline-hidden focus:ring-1 focus:ring-slate-400"
                  id="note-input"
                />
              </div>
            </div>
          </div>

          {/* 5. Button controllers */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-transparent rounded-lg hover:bg-slate-50 transition cursor-pointer"
            >
              Discard
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-xs font-semibold text-white rounded-lg cursor-pointer transition shadow-sm ${type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-800 hover:bg-slate-900'
                }`}
            >
              {editingTransaction ? 'Apply Alterations' : 'Commit Ledger'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
