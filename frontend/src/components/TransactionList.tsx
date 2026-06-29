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
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchSuggestions = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    const titles = new Set<string>();
    transactions.forEach(t => {
      if (t.title.toLowerCase().includes(q) && t.title.toLowerCase() !== q) {
        titles.add(t.title);
      }
    });
    return Array.from(titles).slice(0, 5);
  }, [search, transactions]);

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

    // Date Range Filter
    if (fromDate) {
      list = list.filter(t => t.date >= fromDate);
    }
    if (toDate) {
      list = list.filter(t => t.date <= toDate);
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
  }, [transactions, search, typeFilter, sortBy, fromDate, toDate]);

  const filteredTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredAndSortedTransactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    });
    return { income, expense, net: income - expense };
  }, [filteredAndSortedTransactions]);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs">
        
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search titles or memo notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-slate-300 dark:focus:border-slate-600 text-xs rounded-xl focus:outline-hidden focus:ring-0 text-slate-700 dark:text-slate-200 transition placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          {/* Suggestions Dropdown */}
          {isSearchFocused && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {searchSuggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex items-center transition"
                  onClick={() => setSearch(suggestion)}
                >
                  <Search className="w-3.5 h-3.5 mr-2.5 text-slate-400 dark:text-slate-500" />
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Flow Type selector */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded-xl">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 text-xs rounded-lg font-medium cursor-pointer transition ${
                typeFilter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`px-3 py-1 text-xs rounded-lg font-medium cursor-pointer transition ${
                typeFilter === 'income' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Income only
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-1 text-xs rounded-lg font-medium cursor-pointer transition ${
                typeFilter === 'expense' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Expenses only
            </button>
          </div>

          {/* Date Range selectors */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded-xl">
            <span className="text-xs text-slate-500 dark:text-slate-400 pl-2 font-medium">From:</span>
            <input 
              type="date" 
              value={fromDate} 
              onChange={(e) => setFromDate(e.target.value)} 
              className="bg-transparent border-none text-xs font-mono text-slate-700 dark:text-slate-300 outline-none focus:ring-0 cursor-pointer p-1" 
            />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">To:</span>
            <input 
              type="date" 
              value={toDate} 
              onChange={(e) => setToDate(e.target.value)} 
              className="bg-transparent border-none text-xs font-mono text-slate-700 dark:text-slate-300 outline-none focus:ring-0 cursor-pointer p-1" 
            />
            {(fromDate || toDate) && (
              <button 
                onClick={() => { setFromDate(''); setToDate(''); }} 
                className="px-2 py-1 mx-1 text-[10px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-200 dark:hover:bg-rose-900/50 transition cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sorter Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 focus:outline-hidden cursor-pointer"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Buttons actions line */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition print:hidden"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Import JSON</span>
          </button>
          
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition print:hidden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 dark:text-slate-500"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            <span>Print</span>
          </button>
        </div>

        {/* Quick Add */}
        <button
          onClick={onAddClick}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 dark:bg-white dark:text-slate-900 hover:bg-slate-900 dark:hover:bg-slate-100 rounded-lg cursor-pointer transition shadow-sm print:hidden"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record Entry</span>
        </button>
      </div>

      {/* Primary Table Ledger Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden" id="ledger-table-card">
        {filteredAndSortedTransactions.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {search.trim() ? `Totals for "${search}"` : 'Current View Totals'}
            </span>
            <div className="flex items-center gap-4">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                Income: ₹{filteredTotals.income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                Expense: ₹{filteredTotals.expense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-slate-900 dark:text-white font-bold">
                Remaining Amount: {filteredTotals.net >= 0 ? '+' : '-'}₹{Math.abs(filteredTotals.net).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          {filteredAndSortedTransactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <p className="text-sm font-semibold">No transactions match your current filters.</p>
              <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Clear searching or add entries to list details.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse" id="main-ledger-table">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-xs font-mono">
                  <th className="py-3.5 px-5 font-medium">DATE</th>
                  <th className="py-3.5 px-4 font-medium">TITLE</th>
                  <th className="py-3.5 px-4 font-medium">MEMO TEXT</th>
                  <th className="py-3.5 px-4 font-semibold text-right">AMOUNT (INR)</th>
                  <th className="py-3.5 px-5 text-right font-medium">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-sans">
                {filteredAndSortedTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-5 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(t.date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700">
                        {t.title}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium truncate max-w-xs" title={t.note}>
                      {t.note || <span className="text-slate-300 dark:text-slate-600 italic">No notes</span>}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-semibold text-sm ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400'}`}>
                      {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEditClick(t)}
                          className="p-1 px-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
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
                          className="p-1 px-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
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
