import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { useAuth } from '../context/AuthContext';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';

interface DeletedEntriesHistoryProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function DeletedEntriesHistory({ onShowToast }: DeletedEntriesHistoryProps) {
  const { authFetch } = useAuth();
  const [deletedTransactions, setDeletedTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeleted = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/transactions/deleted/history');
      if (res.ok) {
        const data = await res.json();
        setDeletedTransactions(data);
      }
    } catch (err) {
      console.error('Failed to fetch deleted history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeleted();
  }, []);

  const handleRestore = async (id: string) => {
    try {
      const res = await authFetch(`/api/transactions/${id}/restore`, { method: 'PUT' });
      if (res.ok) {
        setDeletedTransactions(prev => prev.filter(t => t.id !== id));
        onShowToast('Entry restored successfully. Please refresh your dashboard.', 'success');
      } else {
        onShowToast('Failed to restore entry.', 'error');
      }
    } catch (err) {
      onShowToast('An error occurred while restoring.', 'error');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this entry? This cannot be undone.")) return;
    
    try {
      const res = await authFetch(`/api/transactions/${id}/permanent`, { method: 'DELETE' });
      if (res.ok) {
        setDeletedTransactions(prev => prev.filter(t => t.id !== id));
        onShowToast('Entry permanently deleted.', 'info');
      } else {
        onShowToast('Failed to permanently delete entry.', 'error');
      }
    } catch (err) {
      onShowToast('An error occurred during permanent deletion.', 'error');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-6 sm:p-8 mt-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl">
          <Trash2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Deleted Entries History</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review and restore recently deleted transactions.</p>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-slate-500 dark:text-slate-400">Loading deleted entries...</div>
      ) : deletedTransactions.length === 0 ? (
        <div className="py-12 text-center text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
          <Trash2 className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">Trash is empty.</p>
          <p className="text-xs mt-1">No deleted entries found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs font-mono">
                <th className="py-3 font-medium">DATE</th>
                <th className="py-3 font-medium">TITLE</th>
                <th className="py-3 font-medium">AMOUNT</th>
                <th className="py-3 font-medium text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
              {deletedTransactions.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-4 font-mono text-slate-500 dark:text-slate-400 text-xs">
                    {t.date}
                  </td>
                  <td className="py-4 font-medium text-slate-700 dark:text-slate-300">
                    {t.title}
                  </td>
                  <td className={`py-4 font-semibold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString()}
                  </td>
                  <td className="py-4 text-right space-x-2">
                    <button
                      onClick={() => handleRestore(t.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/40 rounded-lg text-xs font-semibold transition cursor-pointer"
                      title="Undo Delete"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Restore
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(t.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg text-xs font-semibold transition cursor-pointer"
                      title="Permanently Delete"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
