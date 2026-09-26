'use client';

// Shift & Cash Drawer Management — close the active shift (Z-Report). Guarded:
// only reachable while a shift is active; closing it ends the shift session and
// returns the app to the Start Shift screen.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Clock, CreditCard, DollarSign, Printer, ShieldCheck } from 'lucide-react';
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

  const [actualCash, setActualCash] = useState('');
  const [cashError, setCashError] = useState('');

  const cashSales = 480.5;
  const cardSales = 840.2;
  // TODO: derive from real paid-out/expense data once the API provides it.
  const paidOutTotal = 30.0;
  const expectedCash = openingFloat + cashSales - paidOutTotal;
  const actualCashNumber = parseFloat(actualCash);
  const hasCount = actualCash.trim() !== '' && Number.isFinite(actualCashNumber);
  const variance = hasCount ? actualCashNumber - expectedCash : 0;

  function handleCloseShift() {
    if (!hasCount) {
      setCashError('Please enter the actual cash counted in the drawer to close the shift.');
      return;
    }
    setCashError('');
    if (confirm('Are you sure you want to close the current shift and print the Z-Report?')) {
      endShift();
      router.replace('/shift');
    }
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
                onChange={(e) => {
                  setActualCash(e.target.value);
                  if (cashError) setCashError('');
                }}
                placeholder="0.00"
                className="h-12 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 text-lg font-bold text-black outline-none focus:border-[#026F4F]"
              />
              {cashError && <p className="text-xs font-medium text-red-600">{cashError}</p>}
            </div>
            <div
              className={cn(
                'flex items-center justify-between rounded-xl border p-4',
                !hasCount
                  ? 'border-zinc-200 bg-zinc-50 text-zinc-500'
                  : variance === 0
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
                  {!hasCount
                    ? 'Awaiting cash count'
                    : variance === 0
                      ? 'Drawer perfectly balanced'
                      : variance > 0
                        ? 'Over cash in drawer'
                        : 'Shortage detected'}
                </p>
              </div>
              <span className="text-lg font-bold">
                {!hasCount ? '—' : variance >= 0 ? `+$${variance.toFixed(2)}` : `-$${Math.abs(variance).toFixed(2)}`}
              </span>
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
    </div>
  );
}
