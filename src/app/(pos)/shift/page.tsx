'use client';

import { useState } from 'react';
import { Clock, DollarSign, CreditCard, Lock, Printer, ArrowUpRight, ArrowDownLeft, ShieldCheck, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ShiftPage() {
  const [openingFloat, setOpeningFloat] = useState<number>(200.00);
  const [actualCash, setActualCash] = useState<string>('650.50');
  const [paidOutAmount, setPaidOutAmount] = useState<string>('');
  const [paidOutReason, setPaidOutReason] = useState<string>('');
  const [showPaidOutModal, setShowPaidOutModal] = useState<boolean>(false);
  const [shiftClosed, setShiftClosed] = useState<boolean>(false);

  const cashSales = 480.50;
  const cardSales = 840.20;
  const paidOutTotal = 30.00;
  const expectedCash = openingFloat + cashSales - paidOutTotal;
  const actualCashNumber = parseFloat(actualCash) || 0;
  const variance = actualCashNumber - expectedCash;

  function handleCloseShift() {
    if (confirm('Are you sure you want to close the current shift and print the Z-Report?')) {
      setShiftClosed(true);
      alert('Shift successfully closed. Z-Report printed.');
    }
  }

  return (
    <div className="flex h-[calc(100vh-24px)] flex-col gap-3 bg-[#F2F2F2] p-1.5 rounded-2xl overflow-hidden">
      {/* Top Header */}
      <div className="flex justify-between items-center px-5 py-3.5 bg-white rounded-xl border border-[#E9E9E9]">
        <div>
          <h1 className="text-black text-xl font-medium font-['Inter']">Shift & Cash Drawer Management</h1>
          <p className="text-neutral-400 text-xs font-normal font-['Inter']">Active Cashier: Alex Chen • Shift started at 08:00 AM</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPaidOutModal(true)}
            className="px-4 py-2 rounded-full bg-zinc-100 border border-zinc-300 text-zinc-800 text-xs font-medium hover:bg-zinc-200 transition-colors"
          >
            Paid Out / Expense
          </button>

          <button
            onClick={handleCloseShift}
            disabled={shiftClosed}
            className={cn(
              'px-4 py-2 rounded-full text-xs font-medium text-white transition-colors shadow-xs flex items-center gap-1.5',
              shiftClosed ? 'bg-zinc-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700',
            )}
          >
            <Lock size={14} />
            <span>{shiftClosed ? 'Shift Closed' : 'Close Shift & Print Z-Report'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-[#E9E9E9] flex justify-between items-center">
          <div>
            <p className="text-neutral-400 text-xs font-normal">Opening Cash Float</p>
            <p className="text-black text-xl font-bold">${openingFloat.toFixed(2)}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center font-bold">
            $
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E9E9E9] flex justify-between items-center">
          <div>
            <p className="text-neutral-400 text-xs font-normal">Cash Sales Today</p>
            <p className="text-emerald-700 text-xl font-bold">${cashSales.toFixed(2)}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E9E9E9] flex justify-between items-center">
          <div>
            <p className="text-neutral-400 text-xs font-normal">Card / Digital Sales</p>
            <p className="text-blue-700 text-xl font-bold">${cardSales.toFixed(2)}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
            <CreditCard size={20} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E9E9E9] flex justify-between items-center">
          <div>
            <p className="text-neutral-400 text-xs font-normal">Total Net Revenue</p>
            <p className="text-[#026F4F] text-xl font-bold">${(cashSales + cardSales).toFixed(2)}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#026F4F] flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      {/* Cash Drawer Reconciliation Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cash Balance Breakdown */}
        <div className="bg-white rounded-xl p-5 border border-[#E9E9E9] flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-lg text-black mb-4">Cash Drawer Calculation</h3>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between py-2 border-b border-zinc-100">
                <span className="text-neutral-500">Starting Cash Float</span>
                <span className="font-medium text-black">${openingFloat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-100">
                <span className="text-neutral-500">(+) Total Cash Sales Received</span>
                <span className="font-medium text-emerald-700">+${cashSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-100">
                <span className="text-neutral-500">(-) Paid Out / Expenses</span>
                <span className="font-medium text-rose-600">-${paidOutTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 font-bold text-sm bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                <span className="text-black">Expected Drawer Balance</span>
                <span className="text-[#026F4F]">${expectedCash.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => alert('Printing X-Report Shift Breakdown...')}
            className="w-full h-11 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl font-medium text-xs flex items-center justify-center gap-2 mt-4"
          >
            <Printer size={16} />
            <span>Print Mid-Shift X-Report</span>
          </button>
        </div>

        {/* Actual Count & Reconciliation */}
        <div className="bg-white rounded-xl p-5 border border-[#E9E9E9] flex flex-col justify-between">
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-lg text-black">Shift Reconciliation Count</h3>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-stone-500 font-medium">Actual Cash Counted in Drawer ($)</label>
              <input
                type="number"
                step="0.01"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                className="w-full h-12 px-4 bg-zinc-50 border border-zinc-300 rounded-xl text-lg font-bold text-black focus:outline-hidden focus:border-[#026F4F]"
              />
            </div>

            <div className={cn('p-4 rounded-xl border flex justify-between items-center', variance === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : variance > 0 ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-rose-50 border-rose-200 text-rose-800')}>
              <div>
                <p className="text-xs font-semibold">Cash Variance</p>
                <p className="text-xs opacity-80">{variance === 0 ? 'Drawer perfectly balanced' : variance > 0 ? 'Over cash in drawer' : 'Shortage detected'}</p>
              </div>
              <span className="text-lg font-bold">
                {variance >= 0 ? `+$${variance.toFixed(2)}` : `-$${Math.abs(variance).toFixed(2)}`}
              </span>
            </div>
          </div>

          <button
            onClick={handleCloseShift}
            disabled={shiftClosed}
            className="w-full h-12 bg-[#026F4F] hover:bg-[#015c42] text-white rounded-xl font-medium text-sm transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            <Check size={18} />
            <span>{shiftClosed ? 'Shift Closed' : 'Confirm & Close Shift'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
