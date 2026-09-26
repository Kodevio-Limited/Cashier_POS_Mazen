'use client';

// Shift & Cash Drawer Management — close the active shift (Z-Report). Guarded:
// only reachable while a shift is active; closing it ends the shift session and
// returns the app to the Start Shift screen.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Clock, CreditCard, DollarSign, Lock, Printer, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { endShift, getActiveShift, subscribeShift, type ActiveShift } from '@/lib/shift-session';

export default function ShiftClosePage() {
  const router = useRouter();
  const [shift, setShift] = useState<ActiveShift | null>(null);

  // Guard: no active shift → back to Start Shift.
  useEffect(() => {
    const current = getActiveShift();
    if (!current) {
      router.replace('/shift');
      return;
    }
    setShift(current);
    return subscribeShift(() => {
      const next = getActiveShift();
      if (!next) router.replace('/shift');
      else setShift(next);
    });
  }, [router]);

  if (!shift) return null;

  return <ShiftDashboard shift={shift} />;
}

/* ── Shift dashboard (shown after shift starts) ─────────────────────────── */
function ShiftDashboard({ shift }: { shift: ActiveShift }) {
  const router = useRouter();
  const { openingFloat, cashierName, startedAt } = shift;

  const [actualCash, setActualCash] = useState('650.50');
  const [paidOutAmount, setPaidOutAmount] = useState('');
  const [paidOutReason, setPaidOutReason] = useState('');
  const [showPaidOutModal, setShowPaidOutModal] = useState(false);
  const [paidOutEntries, setPaidOutEntries] = useState<{ amount: number; reason: string }[]>([]);

  const cashSales = 480.5;
  const cardSales = 840.2;
  const paidOutTotal = paidOutEntries.reduce((s, e) => s + e.amount, 0) + 30.0;
  const expectedCash = openingFloat + cashSales - paidOutTotal;
  const actualCashNumber = parseFloat(actualCash) || 0;
  const variance = actualCashNumber - expectedCash;

  function handleCloseShift() {
    if (confirm('Are you sure you want to close the current shift and print the Z-Report?')) {
      endShift();
      router.replace('/shift');
    }
  }

  function handleAddPaidOut() {
    const amount = parseFloat(paidOutAmount);
    if (!Number.isFinite(amount) || amount <= 0 || !paidOutReason.trim()) return;
    setPaidOutEntries((prev) => [...prev, { amount, reason: paidOutReason.trim() }]);
    setPaidOutAmount('');
    setPaidOutReason('');
    setShowPaidOutModal(false);
  }

  const startedLabel = new Date(startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex min-h-[calc(100vh-38px)] flex-col gap-3 pb-20">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E9E9E9] bg-white px-5 py-3.5">
        <div className="min-w-0">
          <h1 className="text-xl font-medium text-black">Shift &amp; Cash Drawer Management</h1>
          <p className="text-xs font-normal text-neutral-400">Active Cashier: {cashierName} • Shift started {startedLabel}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowPaidOutModal(true)}
            className="whitespace-nowrap rounded-full border border-zinc-300 bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-200"
          >
            Paid Out / Expense
          </button>
          <button
            onClick={handleCloseShift}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-rose-600 px-4 py-2 text-xs font-medium text-white shadow-xs transition-colors hover:bg-rose-700"
          >
            <Lock size={14} />
            <span>Close Shift &amp; Print Z-Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center justify-between rounded-xl border border-[#E9E9E9] bg-white p-4">
          <div>
            <p className="text-xs font-normal text-neutral-400">Opening Cash Float</p>
            <p className="text-xl font-bold text-black">${openingFloat.toFixed(2)}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 font-bold text-zinc-700">$</div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-[#E9E9E9] bg-white p-4">
          <div>
            <p className="text-xs font-normal text-neutral-400">Cash Sales Today</p>
            <p className="text-xl font-bold text-emerald-700">${cashSales.toFixed(2)}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-[#E9E9E9] bg-white p-4">
          <div>
            <p className="text-xs font-normal text-neutral-400">Card / Digital Sales</p>
            <p className="text-xl font-bold text-blue-700">${cardSales.toFixed(2)}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <CreditCard size={20} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-[#E9E9E9] bg-white p-4">
          <div>
            <p className="text-xs font-normal text-neutral-400">Total Net Revenue</p>
            <p className="text-xl font-bold text-[#026F4F]">${(cashSales + cardSales).toFixed(2)}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-[#026F4F]">
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      {/* Cash Drawer Reconciliation Grid */}
      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col justify-between rounded-xl border border-[#E9E9E9] bg-white p-5">
          <div>
            <h3 className="mb-4 text-lg font-semibold text-black">Cash Drawer Calculation</h3>
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between border-b border-zinc-100 py-2">
                <span className="text-neutral-500">Starting Cash Float</span>
                <span className="font-medium text-black">${openingFloat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-100 py-2">
                <span className="text-neutral-500">(+ ) Total Cash Sales Received</span>
                <span className="font-medium text-emerald-700">+${cashSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-100 py-2">
                <span className="text-neutral-500">(-) Paid Out / Expenses</span>
                <span className="font-medium text-rose-600">-${paidOutTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 py-2 text-sm font-bold">
                <span className="text-black">Expected Drawer Balance</span>
                <span className="text-[#026F4F]">${expectedCash.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => alert('Printing X-Report Shift Breakdown...')}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-200"
          >
            <Printer size={16} />
            <span>Print Mid-Shift X-Report</span>
          </button>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-[#E9E9E9] bg-white p-5">
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-black">Shift Reconciliation Count</h3>
            <div className="flex flex-col gap-2">
              <label htmlFor="actual-cash" className="text-xs font-medium text-stone-500">
                Actual Cash Counted in Drawer ($)
              </label>
              <input
                id="actual-cash"
                type="number"
                step="0.01"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                className="h-12 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 text-lg font-bold text-black outline-none focus:border-[#026F4F]"
              />
            </div>
            <div
              className={cn(
                'flex items-center justify-between rounded-xl border p-4',
                variance === 0
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : variance > 0
                    ? 'border-blue-200 bg-blue-50 text-blue-800'
                    : 'border-rose-200 bg-rose-50 text-rose-800',
              )}
            >
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold">
                  <Clock size={14} />
                  Cash Variance
                </p>
                <p className="text-xs opacity-80">
                  {variance === 0 ? 'Drawer perfectly balanced' : variance > 0 ? 'Over cash in drawer' : 'Shortage detected'}
                </p>
              </div>
              <span className="text-lg font-bold">{variance >= 0 ? `+$${variance.toFixed(2)}` : `-$${Math.abs(variance).toFixed(2)}`}</span>
            </div>
          </div>

          <button
            onClick={handleCloseShift}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#026F4F] text-sm font-medium text-white shadow-xs transition-colors hover:bg-[#015c42]"
          >
            <Check size={18} />
            <span>Confirm &amp; Close Shift</span>
          </button>
        </div>
      </div>

      {/* Paid Out modal */}
      {showPaidOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="flex w-[400px] max-w-full flex-col gap-4 rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-black">Paid Out / Expense</h3>
            <div className="flex flex-col gap-2">
              <label htmlFor="paidout-amount" className="text-xs font-medium text-stone-500">
                Amount ($)
              </label>
              <input
                id="paidout-amount"
                type="number"
                step="0.01"
                value={paidOutAmount}
                onChange={(e) => setPaidOutAmount(e.target.value)}
                placeholder="0.00"
                className="h-11 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 text-sm text-black outline-none focus:border-[#026F4F]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="paidout-reason" className="text-xs font-medium text-stone-500">
                Reason
              </label>
              <input
                id="paidout-reason"
                type="text"
                value={paidOutReason}
                onChange={(e) => setPaidOutReason(e.target.value)}
                placeholder="e.g. Supplier payment"
                className="h-11 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 text-sm text-black outline-none focus:border-[#026F4F]"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPaidOutModal(false)}
                className="h-10 flex-1 rounded-xl bg-zinc-100 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPaidOut}
                className="h-10 flex-1 rounded-xl bg-[#026F4F] text-xs font-medium text-white transition-colors hover:bg-[#015c42]"
              >
                Save Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
