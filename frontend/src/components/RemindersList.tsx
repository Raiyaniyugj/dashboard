import React, { useState, useMemo } from 'react';
import { Reminder } from '../types';
import { Bell, Calendar, Plus, Trash2, CheckCircle, Clock, Info, IndianRupee, FileText } from 'lucide-react';

interface RemindersListProps {
  reminders: Reminder[];
  onAddReminder: (title: string, amount: number, date: string, subject: string) => void;
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onShowConfirm?: (message: string, onConfirm: () => void, title?: string) => void;
}

export default function RemindersList({
  reminders,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  onShowToast,
  onShowConfirm
}: RemindersListProps) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [subject, setSubject] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [error, setError] = useState('');

  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (onShowToast) {
      onShowToast(msg, type);
    } else {
      alert(msg);
    }
  };

  const askConfirm = (msg: string, onConfirmAction: () => void, titleDialog?: string) => {
    if (onShowConfirm) {
      onShowConfirm(msg, onConfirmAction, titleDialog);
    } else if (confirm(msg)) {
      onConfirmAction();
    }
  };

  const filteredReminders = useMemo(() => {
    return reminders.filter(r => {
      if (filter === 'active') return !r.completed;
      if (filter === 'completed') return r.completed;
      return true;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [reminders, filter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide a title for the reminder.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please set a valid amount greater than zero.');
      return;
    }

    if (!date) {
      setError('Please select a due date.');
      return;
    }

    onAddReminder(title.trim(), numAmount, date, subject.trim());
    setTitle('');
    setAmount('');
    setDate('');
    setSubject('');
    notify('Successfully established a new bill reminder!', 'success');
  };

  return (
    <div className="space-y-6" id="reminders-management-container">
      <div>
        <h2 className="text-xl font-sans font-medium tracking-tight text-slate-900">Upcoming Bill Guard</h2>
        <p className="text-sm text-slate-500">Keep track of pending payments, subscriptions, and financial obligations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="reminders-grid-split">
        {/* Left: Add Reminder Form */}
        <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-xs self-start" id="create-reminder-card">
          <h3 className="text-sm font-sans font-semibold text-slate-800 mb-4 flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-indigo-500 animate-bounce" />
            <span>Set Bill Reminder</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Title / Merchant</label>
              <input
                type="text"
                placeholder=""
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Amount (INR)</label>
              <div className="relative rounded-xl overflow-hidden border border-slate-200">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 text-slate-800 text-xs focus:outline-hidden"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Due Date</label>
              <div className="relative rounded-xl overflow-hidden border border-slate-200">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 text-slate-800 text-xs focus:outline-hidden"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Subject / Description</label>
              <div className="relative rounded-xl overflow-hidden border border-slate-200">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FileText className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Monthly recurring autopay"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 text-slate-800 text-xs focus:outline-hidden"
                />
              </div>
            </div>

            {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}

            <button
              type="submit"
              className="w-full py-2.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl cursor-pointer transition shadow-xs"
            >
              Add Reminder
            </button>
          </form>
        </div>

        {/* Right: Reminders Feed */}
        <div className="lg:col-span-2 space-y-4" id="reminders-feed">
          {/* Filters Bar */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start max-w-xs">
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold cursor-pointer transition ${filter === 'active' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold cursor-pointer transition ${filter === 'completed' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              Paid
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold cursor-pointer transition ${filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              All
            </button>
          </div>

          {filteredReminders.length === 0 ? (
            <div className="p-10 text-center bg-white border border-slate-100 rounded-2xl text-slate-400">
              <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">No reminders found.</p>
              <p className="text-xs text-slate-300 mt-1">
                {filter === 'active'
                  ? 'All bills are currently settled! Set reminders for utilities or subscriptions.'
                  : filter === 'completed'
                    ? 'No payment history yet.'
                    : 'Start tracking payment obligations.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReminders.map((item) => {
                const isOverdue = new Date(item.date).getTime() < new Date().setHours(0, 0, 0, 0) && !item.completed;

                return (
                  <div
                    key={item.id}
                    className={`p-5 bg-white border rounded-2xl shadow-2xs flex flex-col justify-between space-y-4 transition ${item.completed
                      ? 'opacity-70 border-slate-100'
                      : isOverdue
                        ? 'border-rose-100 bg-rose-50/20'
                        : 'border-slate-100 hover:border-slate-200'
                      }`}
                  >
                    <div>
                      {/* Name & Complete / Delete Buttons */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={`font-semibold text-slate-800 text-sm tracking-tight ${item.completed ? 'line-through text-slate-400' : ''}`}>
                            {item.title}
                          </span>
                          <span className={`block text-[10px] font-mono mt-0.5 uppercase tracking-wider font-semibold ${item.completed
                            ? 'text-emerald-500'
                            : isOverdue
                              ? 'text-rose-500 animate-pulse'
                              : 'text-indigo-500'
                            }`}>
                            {item.completed ? 'Settled' : isOverdue ? 'Overdue!' : 'Pending'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onToggleReminder(item.id)}
                            className={`p-1 px-1.5 rounded-lg border transition cursor-pointer ${item.completed
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                              }`}
                            title={item.completed ? 'Mark Active' : 'Mark Paid'}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              askConfirm(`Delete reminder for ${item.title}?`, () => {
                                onDeleteReminder(item.id);
                                notify('Reminder removed.', 'info');
                              }, 'Delete Reminder');
                            }}
                            className="p-1 px-1.5 rounded-lg border border-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Delete Reminder"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Amounts line */}
                      <div className="flex items-baseline justify-between mt-4">
                        <div className="text-xs text-slate-500">
                          Due Amount: <span className="font-semibold text-slate-800">₹{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      {/* Date Indicator Badge */}
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 border border-slate-100 px-2 py-1 rounded-lg bg-slate-50 mt-3 w-fit">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                      </div>
                    </div>

                    {/* Subject/Memo */}
                    {item.subject && (
                      <div className="pt-2 border-t border-slate-50 flex items-start gap-1.5 text-[11px] text-slate-500 italic">
                        <Info className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                        <span className="leading-tight">{item.subject}</span>
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
