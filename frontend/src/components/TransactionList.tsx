import React, { useState, useMemo, useRef } from 'react';
import { Transaction, Category } from '../types';
import { 
  Search, 
  Trash2, 
  Edit3, 
  Download, 
  Upload, 
  Filter, 
  MoreHorizontal, 
  Plus, 
  RefreshCw,
  PlusCircle,
  FileSpreadsheet
} from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onAddClick: () => void;
  onEditClick: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onImport: (newTransactions: Transaction[]) => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onShowConfirm?: (message: string, onConfirm: () => void, title?: string) => void;
}

export default function TransactionList({
  transactions,
  onAddClick,
  onEditClick,
  onDelete,
  onImport,
  onShowToast,
  onShowConfirm
}: TransactionListProps) {
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
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Process Filter and Sort
  const filteredAndSortedTransactions = useMemo(() => {
    let list = [...transactions];

    // Note Search Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => 
        (t.note && t.note.toLowerCase().includes(q)) || 
        t.title.toLowerCase().includes(q)
      );
    }

    // Type Filter
    if (typeFilter !== 'all') {
      list = list.filter(t => t.type === typeFilter);
    }

    // Sort Handler
    list.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.date + 'T00:00:00').getTime() - new Date(a.date + 'T00:00:00').getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.date + 'T00:00:00').getTime() - new Date(b.date + 'T00:00:00').getTime();
      }
      if (sortBy === 'amount-desc') {
        return b.amount - a.amount;
      }
      if (sortBy === 'amount-asc') {
        return a.amount - b.amount;
      }
      return 0;
    });

    return list;
  }, [transactions, search, typeFilter, sortBy]);

  // 2. Export Ledger directly to standard CSV format
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      notify('Your transaction ledger is empty. Register entries before exporting.', 'error');
      return;
    }

    const headers = ['ID', 'Type', 'Title', 'Amount', 'Date', 'Note'];
    const csvRows = [headers.join(',')];

    transactions.forEach(t => {
      // Escape commas or quotes in notes
      const escapedNote = (t.note || '').replace(/"/g, '""');
      const row = [
        t.id,
        t.type,
        `"${t.title}"`,
        t.amount,
        t.date,
        `"${escapedNote}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    // Dynamic naming based on local timestamp
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `Ledger_Export_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Import JSON logic
  const handleJSONImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const importedData = JSON.parse(text);

        if (!Array.isArray(importedData)) {
          notify('Invalid format. The JSON import must be an array of transactions.', 'error');
          return;
        }

        // Structural verification validate schemas
        const validatedTransactions: Transaction[] = [];
        for (const item of importedData) {
          if (
            typeof item.amount === 'number' &&
            ['income', 'expense'].includes(item.type) &&
            typeof item.title === 'string' &&
            typeof item.date === 'string'
          ) {
            validatedTransactions.push({
              id: item.id || 'imported-' + Math.random().toString(36).substring(2, 9),
              type: item.type,
              amount: item.amount,
              title: item.title,
              date: item.date,
              note: item.note || ''
            });
          }
        }

        if (validatedTransactions.length === 0) {
          notify('Could not find any matching transaction payloads in this file.', 'error');
          return;
        }

        onImport(validatedTransactions);
        notify(`Successfully imported ${validatedTransactions.length} transaction entries!`, 'success');
      } catch (err) {
        notify('Could not compile JSON format. Check file integrity.', 'error');
      }
    };
    reader.readAsText(file);
    // Reset file input value to allow uploading same file again
    if (e.target) e.target.value = '';
  };



  return (
    <div className="space-y-4" id="ledger-management-container">
      {/* Search and interactive custom filters line */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
        
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search titles or memo notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-slate-300 text-xs rounded-xl focus:outline-hidden focus:ring-0 text-slate-700"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Flow Type selector */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 text-xs rounded-lg font-medium cursor-pointer transition ${
                typeFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`px-3 py-1 text-xs rounded-lg font-medium cursor-pointer transition ${
                typeFilter === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Income only
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-1 text-xs rounded-lg font-medium cursor-pointer transition ${
                typeFilter === 'expense' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Expenses only
            </button>
          </div>

          {/* Sorter Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 focus:outline-hidden cursor-pointer"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Buttons actions line */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
        <div className="flex flex-wrap items-center gap-2">
          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 bg-white rounded-lg cursor-pointer hover:bg-slate-50 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>

          {/* JSON Import Input Hidden */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={handleJSONImportClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 bg-white rounded-lg cursor-pointer hover:bg-slate-50 transition"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Import JSON</span>
          </button>
        </div>

        {/* Quick Add */}
        <button
          onClick={onAddClick}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg cursor-pointer transition shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record Entry</span>
        </button>
      </div>

      {/* Primary Table Ledger Grid */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden" id="ledger-table-card">
        <div className="overflow-x-auto">
          {filteredAndSortedTransactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-semibold">No transactions match your current filters.</p>
              <p className="text-xs text-slate-300 mt-1">Clear searching or add entries to list details.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse" id="main-ledger-table">
              <thead>
                <tr className="border-b border-rose-50 bg-slate-50/50 text-slate-400 text-xs font-mono">
                  <th className="py-3.5 px-5 font-medium">DATE</th>
                  <th className="py-3.5 px-4 font-medium">TITLE</th>
                  <th className="py-3.5 px-4 font-medium">MEMO TEXT</th>
                  <th className="py-3.5 px-4 font-semibold text-right">AMOUNT (INR)</th>
                  <th className="py-3.5 px-5 text-right font-medium">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-sans">
                {filteredAndSortedTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-5 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(t.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-100 text-slate-800 border-slate-200">
                        {t.title}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium truncate max-w-xs" title={t.note}>
                      {t.note || <span className="text-slate-300 italic">No notes</span>}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-semibold text-sm ${t.type === 'income' ? 'text-emerald-600 font-bold' : 'text-slate-700'}`}>
                      {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEditClick(t)}
                          className="p-1 px-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                          title="Edit transaction info"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            askConfirm('Delete this ledger entry permanently?', () => {
                              onDelete(t.id);
                            }, 'Delete Ledger Entry');
                          }}
                          className="p-1 px-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
