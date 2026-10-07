'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Check, X, Split, GitMerge, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBodyScrollLock } from '@/lib/use-body-scroll-lock';
import { mapEnum } from '@/lib/locale-fields';

const ORDER_TYPE_KEY_MAP: Record<string, string> = {
  'Dine In': 'dineIn',
  Takeaway: 'takeaway',
  Delivery: 'delivery',
  All: 'all',
};

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
  useBodyScrollLock(true);
  const t = useTranslations('collectPayment');
  const tCommon = useTranslations('common.actions');

  // Auto-focus the amount field so the tablet numpad keyboard opens immediately.
  const amountRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    amountRef.current?.focus();
    amountRef.current?.select();
  }, []);

  return (
    <div className="pos-overlay z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="pos-overlay__panel w-[651px] max-w-full rounded-[17px] bg-white px-[32px] pb-[27px] pt-[26px] shadow-2xl">
        {/* Title & Close */}
        <div className="flex items-center justify-between">
          <h2 className="text-[23px] font-medium leading-[1.4] text-black">{t('title')}</h2>
          <button onClick={onClose} aria-label={tCommon('close')} className="text-black transition-colors hover:text-zinc-500">
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
            <span>{t('splitBill')}</span>
          </button>
          <button
            type="button"
            onClick={onMerge}
            className="flex h-9 flex-1 items-center justify-center gap-1 rounded-md bg-zinc-100 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-200"
          >
            <GitMerge size={15} className="shrink-0" />
            <span>{t('mergeBill')}</span>
          </button>
        </div>

        {/* Total Due Box */}
        <div className="mt-[25px] flex h-[105px] w-full flex-col items-center justify-center gap-[12px] rounded-[9px] border border-[#B9B9B9] bg-[#F2F2F2]">
          <span className="text-[13px] font-medium leading-[1.4] text-[#686868]">{t('totalDue')}</span>
          <span className="text-[36px] font-semibold leading-[1.4] text-black">${total.toFixed(2)}</span>
        </div>

        {/* Amount Received */}
        <div className="mt-[29px] flex flex-col gap-[13px]">
          <label className="text-[16px] font-normal leading-[1.4] text-[#686868]">{t('amountReceived')}</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-[17px] top-1/2 -translate-y-1/2 text-[21px] font-medium leading-[1.4] text-[#989898]">
              $
            </span>
            {/* Currency amount: intentionally LTR in both locales (physical $ prefix) */}
            <input
              ref={amountRef}
              type="number"
              dir="ltr"
              value={received}
              onChange={(e) => setReceived(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              className="h-[61px] w-full rounded-[10px] bg-[#E9E9E9] pl-[38px] pr-[17px] text-[21px] font-medium leading-[1.4] text-[#2D2F33] outline-none placeholder:text-[#989898] focus:ring-2 focus:ring-[#026F4F] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
        </div>

        {/* Change Due */}
        <div className="mt-[19px] flex items-center justify-between">
          <span className="text-[21px] font-medium leading-[1.4] text-black">{t('changeDue')}</span>
          <span className="text-[28px] font-semibold leading-[1.4] text-black">${change.toFixed(2)}</span>
        </div>

        {/* Action Buttons */}
        <div className="mt-[10px] flex flex-col justify-between gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="h-[52px] w-full rounded-[30px] border border-[#B9B9B9] bg-[#E9E9E9] font-satoshi text-[19px] font-medium leading-[1.4] text-[#2D2F33] transition-colors hover:bg-[#E0E0E0] sm:w-[280px]"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-[52px] w-full rounded-[30px] bg-[#026F4F] font-satoshi text-[19px] font-medium leading-[1.4] text-white shadow-[0px_4px_16.3px_11px_rgba(0,0,0,0.12)] transition-all hover:bg-[#015c42] active:scale-[0.99] sm:w-[280px]"
          >
            {t('complete')}
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
  const t = useTranslations('splitBill');
  const tCommon = useTranslations('common.actions');

  // Distribute the total across N bills, last bill absorbs the cent remainder.
  const perBill = Math.floor((total / ways) * 100) / 100;
  const remainder = Math.round((total - perBill * ways) * 100) / 100;
  useBodyScrollLock(true);

  return (
    <div className="pos-overlay z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="pos-overlay__panel w-[554px] max-w-full rounded-[17px] bg-white px-[33px] pb-[27px] pt-[26px] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-[23px] font-medium leading-[1.4] text-black">{t('title')}</h2>
          <button onClick={onClose} aria-label={tCommon('close')} className="text-black transition-colors hover:text-zinc-500">
            <X size={24} />
          </button>
        </div>

        <p className="mt-2 text-[13px] font-normal leading-[1.4] text-[#989898]">
          {t('summary', { count: items.length, total: total.toFixed(2) })}
        </p>

        {/* Ways stepper */}
        <div className="mt-6 flex items-center justify-between rounded-[10px] bg-[#F2F2F2] p-4">
          <div>
            <p className="text-[15px] font-medium leading-[1.4] text-[#2D2F33]">{t('splitInto')}</p>
            <p className="text-[12px] leading-[1.4] text-[#989898]">{t('equalWays')}</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setWays((w) => Math.max(2, w - 1))}
              aria-label={t('fewerWays')}
              className="flex size-9 items-center justify-center rounded-full bg-emerald-200 text-emerald-900 transition-colors hover:bg-emerald-300"
            >
              <Minus size={16} strokeWidth={2.4} />
            </button>
            <span className="w-8 text-center text-[22px] font-medium leading-[1.4] text-black">{ways}</span>
            <button
              type="button"
              onClick={() => setWays((w) => Math.min(8, w + 1))}
              aria-label={t('moreWays')}
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
                <span className="text-[14px] font-medium text-[#2D2F33]">{t('billN', { number: i + 1 })}</span>
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
            {tCommon('cancel')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-[52px] w-full rounded-[30px] bg-[#026F4F] font-satoshi text-[19px] font-medium leading-[1.4] text-white shadow-[0px_4px_16.3px_11px_rgba(0,0,0,0.12)] transition-all hover:bg-[#015c42] active:scale-[0.99] sm:w-[241px]"
          >
            {t('confirm')}
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
  currentOrder,
  onToggleSelect,
}: {
  onClose: () => void;
  onProceedToConfirm: () => void;
  selectedOrders: string[];
  currentOrder?: { id: string; label: string; total: number; itemsCount: number };
  onToggleSelect: (id: string) => void;
}) {
  const [filter, setFilter] = useState<'All' | 'Dine In' | 'Takeaway' | 'Delivery'>('All');
  const [search, setSearch] = useState('');
  const t = useTranslations('mergeOrders');
  const tTypes = useTranslations('common.orderTypes');

  // Lock background scrolling while the merge modal is open; only the order list scrolls.
  useBodyScrollLock(true);

  const filtered = SAMPLE_RUNNING_ORDERS.filter((o) => {
    const matchFilter = filter === 'All' || o.type === filter;
    const matchSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.table.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  // Bug-68: the pinned current order counts as a selection — merging it with
  // one more order is a merge of 2, so it joins the count and the total.
  const mergedCount = selectedOrders.length + (currentOrder ? 1 : 0);
  const combinedTotal =
    selectedOrders.reduce((s, id) => {
      const o = SAMPLE_RUNNING_ORDERS.find((r) => r.id === id);
      return s + (o ? o.total : 0);
    }, 0) + (currentOrder?.total ?? 0);

  return (
    <div className="pos-overlay z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="pos-overlay__panel w-[343px] max-w-full rounded-xl bg-white shadow-2xl flex flex-col justify-between overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-zinc-200 p-4">
          <div className="flex items-center justify-between">
            <button onClick={onClose} aria-label={t('title')} className="text-black transition-colors hover:text-zinc-500">
              <X size={22} />
            </button>
            <h3 className="text-[19px] font-medium leading-[1.4] text-black">{t('title')}</h3>
            <div className="h-[22px] w-[22px]" />
          </div>

          {/* Search bar */}
          <div className="flex h-10 items-center gap-2 rounded-full bg-[#E9E9E9] px-4">
            <Search size={16} className="text-[#989898]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
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
                {tTypes(mapEnum(t, ORDER_TYPE_KEY_MAP))}
              </button>
            ))}
          </div>
        </div>

        {/* Order Cards List */}
        <div className="flex flex-col">
          {/* Pinned Current Order */}
          {currentOrder && (
            <div className="shrink-0 border-b border-[#026F4F]/30 bg-[#E6F1ED] p-3">
              <div className="flex flex-col gap-2 rounded-lg border border-[#026F4F] bg-white p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-5 items-center justify-center rounded-full border border-[#026F4F] bg-[#026F4F]">
                      <Check size={12} className="text-white" strokeWidth={3} />
                    </div>
                    <span className="text-sm font-semibold text-[#2D2F33]">{currentOrder.label}</span>
                    <span className="rounded bg-[#026F4F] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                      {t('currentOrder')}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-[#026F4F]">${currentOrder.total.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 ps-7 text-xs text-[#686868]">
                  <span className="rounded bg-[#E9E9E9] px-2 py-0.5 text-[11px]">{t('thisCheck')}</span>
                  <span>•</span>
                  <span>{t('itemsCount', { count: currentOrder.itemsCount })}</span>
                </div>
              </div>
            </div>
          )}

          {/* Scrollable list of other orders */}
          <div className="flex max-h-[45vh] flex-1 flex-col gap-3 overflow-y-auto p-3">
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
                <div className="flex items-center gap-2 ps-7 text-xs text-[#686868]">
                  <span className="rounded bg-[#E9E9E9] px-2 py-0.5 text-[11px]">{order.table}</span>
                  <span>•</span>
                  <span>{t('itemsCount', { count: order.itemsCount })}</span>
                </div>
              </div>
            );
          })}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col gap-2 border-t border-zinc-200 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#2D2F33]">{t('selectedOrders', { count: mergedCount })}</span>
            <div className="text-right">
              <p className="text-[10px] text-[#989898]">{t('combinedTotal')}</p>
              <p className="text-sm font-semibold text-[#026F4F]">
                ${combinedTotal.toFixed(2)}
              </p>
            </div>
          </div>

          <button
            onClick={onProceedToConfirm}
            disabled={mergedCount < 2}
            className={cn(
              'h-12 w-full rounded-[30px] text-base font-medium text-white transition-all shadow-[0px_4px_16.3px_11px_rgba(0,0,0,0.12)]',
              mergedCount >= 2
                ? 'bg-[#026F4F] hover:bg-[#015c42]'
                : 'cursor-not-allowed bg-zinc-300 shadow-none',
            )}
          >
            {t('mergeN', { count: mergedCount })}
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
  const t = useTranslations('confirmMerge');
  const tCommon = useTranslations('common.actions');
  return (
    <div className="pos-overlay z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="pos-overlay__panel w-[554px] max-w-full rounded-[17px] bg-white px-[33px] pb-[27px] pt-[56px] shadow-2xl">
        {/* Graphic — Figma puzzle-piece illustration */}
        <svg
          className="mx-auto h-[229px] w-[229px]"
          viewBox="0 0 228 228"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M0 206.202V21.7973C0 9.75893 9.75893 0 21.7973 0H111.093V38.3092C111.093 38.6706 110.68 38.8718 110.393 38.6527C106.379 35.5905 101.484 33.9267 96.3774 33.9267C90.1671 33.9267 84.3367 36.3541 79.9603 40.7615C75.5841 45.1688 73.1982 51.0177 73.2423 57.2308C73.2851 63.2745 75.6627 68.9853 79.9373 73.3114C84.2125 77.638 89.8947 80.0828 95.9372 80.1954C101.207 80.2951 106.258 78.6312 110.391 75.4756C110.679 75.2558 111.093 75.4568 111.093 75.8188V154.58C111.093 156.632 112.312 158.485 114.198 159.299C116.078 160.111 118.255 159.729 119.744 158.326C123.057 155.204 127.395 153.536 131.954 153.616C136.472 153.7 140.724 155.532 143.927 158.774C147.131 162.016 148.912 166.29 148.944 170.81C148.977 175.463 147.191 179.843 143.914 183.143C140.637 186.443 136.272 188.26 131.622 188.26C127.198 188.26 122.986 186.593 119.764 183.566C118.261 182.154 116.07 181.77 114.182 182.586C112.306 183.398 111.093 185.246 111.093 187.294V228H21.7973C9.75893 228 0 218.241 0 206.202Z"
            fill="#4D6FFF"
          />
          <path
            d="M227.999 206.202C227.999 218.241 218.241 228 206.202 228H116.906V189.69C116.906 189.329 117.319 189.128 117.607 189.347C121.62 192.409 126.515 194.073 131.622 194.073C137.832 194.073 143.663 191.645 148.039 187.238C152.415 182.831 154.801 176.982 154.757 170.768C154.714 164.725 152.337 159.014 148.062 154.688C143.787 150.361 138.105 147.917 132.062 147.804C126.79 147.702 121.741 149.368 117.608 152.524C117.32 152.744 116.906 152.543 116.906 152.181V73.4198C116.906 71.3672 115.688 69.5147 113.802 68.7005C111.922 67.8891 109.744 68.271 108.256 69.6737C104.942 72.7959 100.608 74.469 96.0457 74.3837C91.5279 74.2995 87.2755 72.4677 84.0722 69.2257C80.8689 65.9837 79.087 61.7093 79.0552 57.1895C79.022 52.5367 80.8086 48.1569 84.0853 44.8569C87.3623 41.5568 91.7278 39.7392 96.3778 39.7392C100.802 39.7392 105.013 41.4064 108.236 44.4335C109.739 45.8453 111.93 46.2299 113.817 45.4132C115.694 44.6013 116.906 42.7533 116.906 40.7053V0H206.203C218.241 0 228 9.75893 228 21.7973V206.202H227.999Z"
            fill="#FFD93B"
          />
        </svg>

        {/* Title */}
        <h3 className="mt-[36px] text-center font-satoshi text-[28px] font-medium leading-[1.4] text-black">
          {t('title')}
        </h3>

        {/* Subtitle */}
        <p className="mx-auto mt-[17px] w-[448px] max-w-full text-center text-[16px] font-normal leading-[1.4] text-[#989898]">
          {t('body', { count: ordersCount })}
        </p>

        {/* Combined Total Box */}
        <div className="mt-[23px] flex h-[106px] w-full flex-col items-center justify-center rounded-[7px] bg-[#F2F2F2]">
          <span className="text-[15px] font-medium leading-[1.4] text-[#989898]">{t('newTotal')}</span>
          <span className="text-[37px] font-semibold leading-[1.4] text-[#026F4F]">${combinedTotal.toFixed(2)}</span>
        </div>

        {/* Buttons */}
        <div className="mt-[28px] flex flex-col justify-between gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="h-[52px] w-full rounded-[30px] border border-[#B9B9B9] bg-[#E9E9E9] font-satoshi text-[19px] font-medium leading-[1.4] text-[#2D2F33] transition-colors hover:bg-[#E0E0E0] sm:w-[241px]"
          >
            {tCommon('cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-[52px] w-full rounded-[30px] bg-[#026F4F] font-satoshi text-[19px] font-medium leading-[1.4] text-white shadow-[0px_4px_16.3px_11px_rgba(0,0,0,0.12)] transition-all hover:bg-[#015c42] active:scale-[0.99] sm:w-[241px]"
          >
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}