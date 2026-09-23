'use client';

import { useState } from 'react';
import { Search, Check, X, Split, GitMerge, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OrderLine {
  id: string;
  name: string;
  price: number;
  qty: number;
}

interface RunningOrder {
  id: string;
  orderNumber: string;
  table: string;
  itemsCount: number;
  total: number;
  type: 'Dine In' | 'Takeaway' | 'Delivery';
}

const SAMPLE_RUNNING_ORDERS: RunningOrder[] = [
  { id: 'ro1', orderNumber: 'ORD-123', table: 'Table 07', itemsCount: 3, total: 45.99, type: 'Dine In' },
  { id: 'ro2', orderNumber: 'ORD-124', table: 'Table 04', itemsCount: 2, total: 32.5, type: 'Dine In' },
  { id: 'ro3', orderNumber: 'ORD-125', table: 'Takeaway #12', itemsCount: 4, total: 54.0, type: 'Takeaway' },
  { id: 'ro4', orderNumber: 'ORD-126', table: 'Delivery #05', itemsCount: 1, total: 18.99, type: 'Delivery' },
];

/* ─── Collect Payment Modal (Figma 1730:290) ────────────────────────────── */
export function CollectPaymentModal({
  total,
  onClose,
  onConfirm,
  onSplit,
  onMerge,
}: {
  total: number;
  onClose: () => void;
  onConfirm: () => void;
  onSplit: () => void;
  onMerge: () => void;
}) {
  const [received, setReceived] = useState('50.00');
  const receivedNum = parseFloat(received) || 0;
  const change = Math.max(0, receivedNum - total);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="w-[651px] max-w-full rounded-[17px] bg-white px-[32px] pb-[27px] pt-[26px] shadow-2xl">
        {/* Title & Close */}
        <div className="flex items-center justify-between">
          <h2 className="text-[23px] font-medium leading-[1.4] text-black">Collect Payment</h2>
          <button onClick={onClose} aria-label="Close" className="text-black transition-colors hover:text-zinc-500">
            <X size={24} />
          </button>
        </div>

        {/* Split Bill & Merge Bill */}
        <div className="mt-[25px] flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onSplit}
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-zinc-100 text-xs font-medium text-emerald-700 outline outline-1 outline-offset-[-1px] outline-emerald-700 transition-colors hover:bg-emerald-50"
          >
            <Split size={15} className="shrink-0" />
            <span>Split Bill</span>
          </button>
          <button
            type="button"
            onClick={onMerge}
            className="flex h-9 flex-1 items-center justify-center gap-1 rounded-md bg-zinc-100 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-200"
          >
            <GitMerge size={15} className="shrink-0" />
            <span>Merge Bill</span>
          </button>
        </div>

        {/* Total Due Box */}
        <div className="mt-[25px] flex h-[105px] w-full flex-col items-center justify-center gap-[12px] rounded-[9px] border border-[#B9B9B9] bg-[#F2F2F2]">
          <span className="text-[13px] font-medium leading-[1.4] text-[#686868]">Total Due</span>
          <span className="text-[36px] font-semibold leading-[1.4] text-black">${total.toFixed(2)}</span>
        </div>

        {/* Amount Received */}
        <div className="mt-[29px] flex flex-col gap-[13px]">
          <label className="text-[16px] font-normal leading-[1.4] text-[#686868]">Amount Received ($)</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-[17px] top-1/2 -translate-y-1/2 text-[21px] font-medium leading-[1.4] text-[#989898]">
              $
            </span>
            <input
              type="number"
              value={received}
              onChange={(e) => setReceived(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              className="h-[61px] w-full rounded-[10px] bg-[#E9E9E9] pl-[38px] pr-[17px] text-[21px] font-medium leading-[1.4] text-[#2D2F33] outline-none placeholder:text-[#989898] focus:ring-2 focus:ring-[#026F4F]"
            />
          </div>
        </div>

        {/* Change Due */}
        <div className="mt-[19px] flex items-center justify-between">
          <span className="text-[21px] font-medium leading-[1.4] text-black">Change Due:</span>
          <span className="text-[28px] font-semibold leading-[1.4] text-black">${change.toFixed(2)}</span>
        </div>

        {/* Action Buttons */}
        <div className="mt-[10px] flex flex-col justify-between gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="h-[52px] w-full rounded-[30px] border border-[#B9B9B9] bg-[#E9E9E9] font-satoshi text-[19px] font-medium leading-[1.4] text-[#2D2F33] transition-colors hover:bg-[#E0E0E0] sm:w-[280px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-[52px] w-full rounded-[30px] bg-[#026F4F] font-satoshi text-[19px] font-medium leading-[1.4] text-white shadow-[0px_4px_16.3px_11px_rgba(0,0,0,0.12)] transition-all hover:bg-[#015c42] active:scale-[0.99] sm:w-[280px]"
          >
            Complete Order
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Split Bill Modal ────────────────────────────────────────────────────── */
export function SplitBillModal({
  items,
  total,
  onClose,
}: {
  items: OrderLine[];
  total: number;
  onClose: () => void;
}) {
  const [ways, setWays] = useState(2);

  // Distribute the total across N bills, last bill absorbs the cent remainder.
  const perBill = Math.floor((total / ways) * 100) / 100;
  const remainder = Math.round((total - perBill * ways) * 100) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="w-[554px] max-w-full rounded-[17px] bg-white px-[33px] pb-[27px] pt-[26px] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-[23px] font-medium leading-[1.4] text-black">Split Bill</h2>
          <button onClick={onClose} aria-label="Close" className="text-black transition-colors hover:text-zinc-500">
            <X size={24} />
          </button>
        </div>

        <p className="mt-2 text-[13px] font-normal leading-[1.4] text-[#989898]">
          Split {items.length} {items.length === 1 ? 'item' : 'items'} • Total ${total.toFixed(2)}
        </p>

        {/* Ways stepper */}
        <div className="mt-6 flex items-center justify-between rounded-[10px] bg-[#F2F2F2] p-4">
          <div>
            <p className="text-[15px] font-medium leading-[1.4] text-[#2D2F33]">Split into</p>
            <p className="text-[12px] leading-[1.4] text-[#989898]">Equal ways</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setWays((w) => Math.max(2, w - 1))}
              aria-label="Fewer ways"
              className="flex size-9 items-center justify-center rounded-full bg-emerald-200 text-emerald-900 transition-colors hover:bg-emerald-300"
            >
              <Minus size={16} strokeWidth={2.4} />
            </button>
            <span className="w-8 text-center text-[22px] font-medium leading-[1.4] text-black">{ways}</span>
            <button
              type="button"
              onClick={() => setWays((w) => Math.min(8, w + 1))}
              aria-label="More ways"
              className="flex size-9 items-center justify-center rounded-full bg-emerald-700 text-white shadow-xs transition-colors hover:bg-emerald-800"
            >
              <Plus size={16} strokeWidth={2.4} />
            </button>
          </div>
        </div>

        {/* Per-bill breakdown */}
        <div className="mt-4 flex max-h-[220px] flex-col gap-2 overflow-y-auto">
          {Array.from({ length: ways }).map((_, i) => {
            const amount = i === ways - 1 ? perBill + remainder : perBill;
            return (
              <div
                key={i}
                className="flex items-center justify-between rounded-[10px] border border-[#E9E9E9] bg-white px-4 py-3"
              >
                <span className="text-[14px] font-medium text-[#2D2F33]">Bill {i + 1}</span>
                <span className="text-[16px] font-semibold text-[#026F4F]">${amount.toFixed(2)}</span>
              </div>
            );
          })}
        </div>

        {/* Buttons */}
        <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="h-[52px] w-full rounded-[30px] border border-[#B9B9B9] bg-[#E9E9E9] font-satoshi text-[19px] font-medium leading-[1.4] text-[#2D2F33] transition-colors hover:bg-[#E0E0E0] sm:w-[241px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-[52px] w-full rounded-[30px] bg-[#026F4F] font-satoshi text-[19px] font-medium leading-[1.4] text-white shadow-[0px_4px_16.3px_11px_rgba(0,0,0,0.12)] transition-all hover:bg-[#015c42] active:scale-[0.99] sm:w-[241px]"
          >
            Confirm Split
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Merge Orders Modal (Figma 1069:271) ─────────────────────────────────── */
export function MergeOrdersModal({
  onClose,
  onProceedToConfirm,
  selectedOrders,
  onToggleSelect,
}: {
  onClose: () => void;
  onProceedToConfirm: () => void;
  selectedOrders: string[];
  onToggleSelect: (id: string) => void;
}) {
  const [filter, setFilter] = useState<'All' | 'Dine In' | 'Takeaway' | 'Delivery'>('All');
  const [search, setSearch] = useState('');

  const filtered = SAMPLE_RUNNING_ORDERS.filter((o) => {
    const matchFilter = filter === 'All' || o.type === filter;
    const matchSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.table.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="w-[343px] max-w-full rounded-xl bg-white shadow-2xl flex flex-col justify-between overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-zinc-200 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-zinc-800">Merge Orders</h3>
            <button onClick={onClose} className="text-neutral-400 hover:text-zinc-800">
              <X size={20} />
            </button>
          </div>

          {/* Search bar */}
          <div className="flex h-10 items-center gap-2 rounded-full bg-[#E9E9E9] px-4">
            <Search size={16} className="text-[#989898]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order ID or Table Number..."
              className="w-full bg-transparent text-xs text-[#2D2F33] outline-none placeholder:text-[#989898]"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-1.5 overflow-x-auto">
            {(['All', 'Dine In', 'Takeaway', 'Delivery'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={cn(
                  'whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-all',
                  filter === t
                    ? 'bg-[#026F4F] text-white shadow-xs'
                    : 'bg-[#F2F2F2] text-[#989898] hover:text-[#2D2F33]',
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Order Cards List */}
        <div className="flex max-h-[50vh] flex-1 flex-col gap-3 overflow-y-auto p-3">
          {filtered.map((order) => {
            const isSelected = selectedOrders.includes(order.id);
            return (
              <div
                key={order.id}
                onClick={() => onToggleSelect(order.id)}
                className={cn(
                  'flex cursor-pointer flex-col gap-2 rounded-lg border p-3 transition-all',
                  isSelected
                    ? 'border-[#026F4F] bg-[#E6F1ED]'
                    : 'border-zinc-200 bg-white hover:border-zinc-300',
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'flex size-5 items-center justify-center rounded-full border transition-colors',
                        isSelected ? 'border-[#026F4F] bg-[#026F4F]' : 'border-zinc-400 bg-white',
                      )}
                    >
                      {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className="text-sm font-medium text-[#2D2F33]">{order.orderNumber}</span>
                  </div>
                  <span className="text-sm font-semibold text-[#026F4F]">${order.total.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 pl-7 text-xs text-[#686868]">
                  <span className="rounded bg-[#E9E9E9] px-2 py-0.5 text-[11px]">{order.table}</span>
                  <span>•</span>
                  <span>{order.itemsCount} Items</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col gap-2 border-t border-zinc-200 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#2D2F33]">Selected Orders ({selectedOrders.length})</span>
            <div className="text-right">
              <p className="text-[10px] text-[#989898]">Combined Total</p>
              <p className="text-sm font-semibold text-[#026F4F]">
                ${selectedOrders.reduce((s, id) => {
                  const o = SAMPLE_RUNNING_ORDERS.find((r) => r.id === id);
                  return s + (o ? o.total : 0);
                }, 0).toFixed(2)}
              </p>
            </div>
          </div>

          <button
            onClick={onProceedToConfirm}
            disabled={selectedOrders.length < 2}
            className={cn(
              'h-12 w-full rounded-[30px] text-base font-medium text-white transition-all shadow-[0px_4px_16.3px_11px_rgba(0,0,0,0.12)]',
              selectedOrders.length >= 2
                ? 'bg-[#026F4F] hover:bg-[#015c42]'
                : 'cursor-not-allowed bg-zinc-300 shadow-none',
            )}
          >
            Merge {selectedOrders.length} Orders
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Confirm Merge Modal (Figma 1084:531) ────────────────────────────────── */
export function ConfirmMergeModal({
  ordersCount,
  combinedTotal,
  onClose,
  onConfirm,
}: {
  ordersCount: number;
  combinedTotal: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="w-[554px] max-w-full rounded-[17px] bg-white px-[33px] pb-[27px] pt-[56px] shadow-2xl">
        {/* Graphic */}
        <div className="mx-auto flex h-[229px] w-[229px] items-center justify-center rounded-full bg-[#E6F1ED] text-[#026F4F]">
          <GitMerge size={96} strokeWidth={1.8} />
        </div>

        {/* Title */}
        <h3 className="mt-[36px] text-center font-satoshi text-[28px] font-medium leading-[1.4] text-black">
          Confirm Merge?
        </h3>

        {/* Subtitle */}
        <p className="mx-auto mt-[17px] w-[448px] max-w-full text-center text-[16px] font-normal leading-[1.4] text-[#989898]">
          You are about to merge{' '}
          <span className="text-[18px] font-medium text-[#1E1E1E]">{ordersCount} orders</span> into one bill. This
          action cannot be undone.
        </p>

        {/* Combined Total Box */}
        <div className="mt-[23px] flex h-[106px] w-full flex-col items-center justify-center rounded-[7px] bg-[#F2F2F2]">
          <span className="text-[15px] font-medium leading-[1.4] text-[#989898]">New Combined Total</span>
          <span className="text-[37px] font-semibold leading-[1.4] text-[#026F4F]">${combinedTotal.toFixed(2)}</span>
        </div>

        {/* Buttons */}
        <div className="mt-[28px] flex flex-col justify-between gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="h-[52px] w-full rounded-[30px] border border-[#B9B9B9] bg-[#E9E9E9] font-satoshi text-[19px] font-medium leading-[1.4] text-[#2D2F33] transition-colors hover:bg-[#E0E0E0] sm:w-[241px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-[52px] w-full rounded-[30px] bg-[#026F4F] font-satoshi text-[19px] font-medium leading-[1.4] text-white shadow-[0px_4px_16.3px_11px_rgba(0,0,0,0.12)] transition-all hover:bg-[#015c42] active:scale-[0.99] sm:w-[241px]"
          >
            Confirm Merge
          </button>
        </div>
      </div>
    </div>
  );
}