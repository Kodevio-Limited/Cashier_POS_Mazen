'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, Check, Clock, DollarSign, CreditCard, Lock, Printer, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const CASHIERS = ['Alex m', 'Sarah J', 'Mike T'];

export default function ShiftPage() {
  const [started, setStarted] = useState(false);
  const [cashier, setCashier] = useState(CASHIERS[0]);
  const [pin, setPin] = useState('');
  const [floatInput, setFloatInput] = useState('$50.00');
  const [formError, setFormError] = useState('');

  function parseFloatAmount(raw: string): number {
    const n = parseFloat(raw.replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : NaN;
  }

  function handleStartShift() {
    if (!pin.trim()) {
      setFormError('Please enter your PIN code to start the shift.');
      return;
    }
    const amount = parseFloatAmount(floatInput);
    if (!Number.isFinite(amount)) {
      setFormError('Please enter a valid starting cash amount.');
      return;
    }
    setFormError('');
    setStarted(true);
  }

  if (!started) {
    return <StartShiftScreen cashier={cashier} onCashierChange={setCashier} pin={pin} onPinChange={setPin} floatInput={floatInput} onFloatChange={setFloatInput} formError={formError} onStart={handleStartShift} />;
  }

  return <ShiftDashboard openingFloat={parseFloatAmount(floatInput) || 0} cashierName={cashier} />;
}

/* ── Start Shift screen — pixel-matched to Figma (737:746) ─────────────── */
function StartShiftScreen({
  cashier,
  onCashierChange,
  pin,
  onPinChange,
  floatInput,
  onFloatChange,
  formError,
  onStart,
}: {
  cashier: string;
  onCashierChange: (v: string) => void;
  pin: string;
  onPinChange: (v: string) => void;
  floatInput: string;
  onFloatChange: (v: string) => void;
  formError: string;
  onStart: () => void;
}) {
  return (
    <div className="flex min-h-[calc(100vh-24px)] items-center justify-center py-8">
      <div className="w-[690px] max-w-full rounded-[30px] bg-white px-[56px] pb-[76px] pt-[40px] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="relative h-[54px] w-[184px]">
            <Image src="/images/logo-69e842.png" alt="Restaurant logo" fill priority sizes="184px" className="object-contain" />
          </div>
        </div>

        {/* Title */}
        <div className="mt-[25px] flex flex-col items-center gap-[14px] text-center">
          <h1 className="text-[31px] font-semibold leading-[1.4] text-black">Start Shift</h1>
          <p className="text-[19px] font-normal leading-[1.4] text-[#989898]">Ready for a great day</p>
        </div>

        {/* Form */}
        <div className="mt-[66px] flex flex-col gap-[31px]">
          <div className="flex flex-col gap-[8px]">
            <label htmlFor="cashier-name" className="text-[15px] font-medium leading-[1.4] text-[#686868]">
              Cashier Name
            </label>
            <div className="relative">
              <select
                id="cashier-name"
                value={cashier}
                onChange={(e) => onCashierChange(e.target.value)}
                className="h-[53px] w-full appearance-none rounded-[87px] bg-[#F2F2F2] py-[16px] pl-[16px] pr-[52px] font-satoshi text-[16px] font-medium leading-[1.4] text-[#2D2F33] outline-none focus:ring-2 focus:ring-[#026F4F]"
              >
                {CASHIERS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown size={24} className="pointer-events-none absolute right-[16px] top-1/2 -translate-y-1/2 text-[#989898]" />
            </div>
          </div>

          <div className="flex flex-col gap-[8px]">
            <label htmlFor="pin-code" className="text-[15px] font-medium leading-[1.4] text-[#686868]">
              Pin Code
            </label>
            <input
              id="pin-code"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => onPinChange(e.target.value)}
              placeholder="********"
              className="h-[53px] w-full rounded-[87px] bg-[#F2F2F2] p-[16px] font-satoshi text-[16px] font-medium leading-[1.4] text-[#2D2F33] outline-none placeholder:text-[#989898] focus:ring-2 focus:ring-[#026F4F]"
            />
          </div>

          <div className="flex flex-col gap-[8px]">
            <label htmlFor="starting-float" className="text-[15px] font-medium leading-[1.4] text-[#686868]">
              Enter Starting Cash (Float)
            </label>
            <input
              id="starting-float"
              type="text"
              inputMode="decimal"
              value={floatInput}
              onChange={(e) => onFloatChange(e.target.value)}
              placeholder="$50.00"
              className="h-[53px] w-full rounded-[87px] bg-[#F2F2F2] p-[16px] font-satoshi text-[16px] font-medium leading-[1.4] text-[#2D2F33] outline-none placeholder:text-[#989898] focus:ring-2 focus:ring-[#026F4F]"
            />
          </div>
        </div>

        {formError && <p className="mt-4 text-center text-sm font-medium text-red-600">{formError}</p>}

        {/* Submit */}
        <button
          onClick={onStart}
          className="mt-[60px] flex h-[59px] w-full items-center justify-center rounded-[30px] bg-[#026F4F] text-[19px] font-medium leading-[1.4] text-white shadow-[0px_4px_16.3px_11px_rgba(0,0,0,0.12)] transition-all hover:bg-[#015c42] active:scale-[0.99]"
        >
          Start Shift
        </button>
      </div>
    </div>
  );
}

/* ── Shift dashboard (shown after shift starts) ─────────────────────────── */
function ShiftDashboard({ openingFloat, cashierName }: { openingFloat: number; cashierName: string }) {
  const [actualCash, setActualCash] = useState('650.50');
  const [paidOutAmount, setPaidOutAmount] = useState('');
  const [paidOutReason, setPaidOutReason] = useState('');
  const [showPaidOutModal, setShowPaidOutModal] = useState(false);
  const [paidOutEntries, setPaidOutEntries] = useState<{ amount: number; reason: string }[]>([]);
  const [shiftClosed, setShiftClosed] = useState(false);

  const cashSales = 480.5;
  const cardSales = 840.2;
  const paidOutTotal = paidOutEntries.reduce((s, e) => s + e.amount, 0) + 30.0;
  const expectedCash = openingFloat + cashSales - paidOutTotal;
  const actualCashNumber = parseFloat(actualCash) || 0;
  const variance = actualCashNumber - expectedCash;

  function handleCloseShift() {
    if (confirm('Are you sure you want to close the current shift and print the Z-Report?')) {
      setShiftClosed(true);
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

  return (
    <div className="flex min-h-[calc(100vh-24px)] flex-col gap-3 pb-20">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E9E9E9] bg-white px-5 py-3.5">
        <div className="min-w-0">
          <h1 className="text-xl font-medium text-black">Shift & Cash Drawer Management</h1>
          <p className="text-xs font-normal text-neutral-400">Active Cashier: {cashierName} • Shift started just now</p>
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
            disabled={shiftClosed}
            className={cn(
              'flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium text-white shadow-xs transition-colors',
              shiftClosed ? 'cursor-not-allowed bg-zinc-400' : 'bg-rose-600 hover:bg-rose-700',
            )}
          >
            <Lock size={14} />
            <span>{shiftClosed ? 'Shift Closed' : 'Close Shift & Print Z-Report'}</span>
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
                <span className="text-neutral-500">(+) Total Cash Sales Received</span>
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
            disabled={shiftClosed}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#026F4F] text-sm font-medium text-white shadow-xs transition-colors hover:bg-[#015c42] disabled:bg-zinc-300"
          >
            <Check size={18} />
            <span>{shiftClosed ? 'Shift Closed' : 'Confirm & Close Shift'}</span>
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
