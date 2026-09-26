'use client';

import { useState } from 'react';
import { Clock, UtensilsCrossed, Phone, Mail, ArrowLeft, X, RotateCcw, CircleAlert, Plus, Minus, Check, Ban, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
type OrderType = 'All' | 'Dine In' | 'Takeaway' | 'Delivery';
type PayState = 'Paid' | 'Refunded' | 'Unpaid';
type FooterState = 'Completed' | 'Cancelled';

interface HistoryItem {
  name: string;
  qty: number;
  price: number;
  modifier?: string;
  note?: string;
  emoji: string;
}

interface HistoryOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string;
  payState: PayState;
  footerState: FooterState;
  date: string;
  table: string;
  type: 'Dine In' | 'Takeaway' | 'Delivery';
  items: HistoryItem[];
  subtotal: number;
  serviceCharge: number;
  total: number;
}

const PAY_PILL: Record<PayState, string> = {
  Paid: 'bg-[#16C722] text-white',
  Refunded: 'bg-[#F8AB68] text-white',
  Unpaid: 'bg-[#E85E5E] text-white',
};

const FOOTER_BADGE: Record<FooterState, string> = {
  Completed: 'bg-[rgba(124,239,132,0.37)] text-[#24BE36]',
  Cancelled: 'bg-[rgba(239,124,124,0.37)] text-[#BE2424]',
};

// ─── Sample Data ───────────────────────────────────────────────────────────────
const INITIAL_HISTORY: HistoryOrder[] = [
  {
    id: 'h1',
    orderNumber: '#044',
    customerName: 'Robert Fox',
    phone: '+01284980',
    email: 'mike.t@example.com',
    payState: 'Paid',
    footerState: 'Completed',
    date: '7 Apr, 11:30 AM',
    table: 'Table 03',
    type: 'Dine In',
    items: [
      { name: 'Shoyu Ramen', qty: 1, price: 15.99, modifier: 'No Spice', emoji: '🍜' },
      { name: 'Iced Green Tea', qty: 1, price: 15.99, modifier: 'No Spice', emoji: '🍵' },
    ],
    subtotal: 25.99,
    serviceCharge: 2.6,
    total: 30.99,
  },
  {
    id: 'h2',
    orderNumber: '#044',
    customerName: 'Robert Fox',
    phone: '+01284980',
    email: 'mike.t@example.com',
    payState: 'Refunded',
    footerState: 'Cancelled',
    date: '7 Apr, 11:30 AM',
    table: 'Table 03',
    type: 'Dine In',
    items: [
      { name: 'Shoyu Ramen', qty: 1, price: 15.99, modifier: 'No Spice', emoji: '🍜' },
      { name: 'Iced Green Tea', qty: 1, price: 15.99, modifier: 'No Spice', emoji: '🍵' },
    ],
    subtotal: 25.99,
    serviceCharge: 2.6,
    total: 30.99,
  },
  {
    id: 'h3',
    orderNumber: '#044',
    customerName: 'Robert Fox',
    phone: '+01284980',
    email: 'mike.t@example.com',
    payState: 'Unpaid',
    footerState: 'Completed',
    date: '7 Apr, 11:30 AM',
    table: 'Table 03',
    type: 'Takeaway',
    items: [
      { name: 'Shoyu Ramen', qty: 1, price: 15.99, modifier: 'No Spice', emoji: '🍜' },
      { name: 'Iced Green Tea', qty: 1, price: 15.99, modifier: 'No Spice', emoji: '🍵' },
    ],
    subtotal: 25.99,
    serviceCharge: 2.6,
    total: 30.99,
  },
  {
    id: 'h4',
    orderNumber: '#045',
    customerName: 'Mike Thompson',
    phone: '+01284980',
    email: 'mike.t@example.com',
    payState: 'Paid',
    footerState: 'Completed',
    date: '7 Apr, 11:45 AM',
    table: 'Table 07',
    type: 'Delivery',
    items: [
      { name: 'Shoyu Ramen', qty: 1, price: 15.99, modifier: 'Extra Chili', emoji: '🍜' },
      { name: 'Coca-Cola', qty: 1, price: 2.99, modifier: 'Standard', emoji: '🥤' },
    ],
    subtotal: 18.98,
    serviceCharge: 1.9,
    total: 20.88,
  },
];

// ─── Mock ingredient lists (stand-in for the menu/inventory API) ──────────────
const ITEM_INGREDIENTS: Record<string, string[]> = {
  'Shoyu Ramen': ['Ramen Noodles', 'Shoyu Broth', 'Chashu Pork', 'Soft Egg', 'Nori', 'Scallions'],
  'Classic Burger': ['Burger Bun', 'Beef Patty', 'Cheddar Cheese', 'Lettuce', 'Tomato', 'Burger Sauce'],
  'French Fries': ['Potatoes', 'Frying Oil', 'Salt'],
  'Coca-Cola': ['Coca-Cola Syrup', 'Soda Water', 'Ice'],
  'Iced Green Tea': ['Green Tea', 'Ice', 'Sugar Syrup', 'Lemon'],
};

const GENERIC_INGREDIENTS = ['Main Component', 'Side Component', 'Sauce', 'Garnish'];

function ingredientsFor(itemName: string): string[] {
  return ITEM_INGREDIENTS[itemName] ?? GENERIC_INGREDIENTS;
}

type RefundMode = 'refund' | 'cancel';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<HistoryOrder[]>(INITIAL_HISTORY);
  const [activeTypeTab, setActiveTypeTab] = useState<OrderType>('All');
  const [search, setSearch] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  // Step 1: pick items (+ reason). Step 2: log waste.
  const [refundMode, setRefundMode] = useState<RefundMode | null>(null);
  const [refundQty, setRefundQty] = useState<Record<number, number>>({});
  const [refundReason, setRefundReason] = useState('');
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [wasteLog, setWasteLog] = useState<Record<number, boolean>>({});
  const [wasteIngredients, setWasteIngredients] = useState<Record<number, string[]>>({});
  const [customOpen, setCustomOpen] = useState<number | null>(null);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  const filteredOrders = orders.filter((o) => {
    if (activeTypeTab !== 'All' && o.type !== activeTypeTab) return false;
    const q = search.trim().toLowerCase().replace(/^#/, '');
    if (!q) return true;
    return (
      o.orderNumber.toLowerCase().replace(/^#/, '').includes(q) ||
      o.table.toLowerCase().includes(q)
    );
  });

  const refundLines = (selectedOrder?.items ?? [])
    .map((item, idx) => ({ item, idx, qty: refundQty[idx] ?? 0 }))
    .filter((l) => l.qty > 0);
  const refundTotal = refundLines.reduce((s, l) => s + l.item.price * l.qty, 0);

  function openRefundFlow(mode: RefundMode) {
    setRefundMode(mode);
    setRefundQty({});
    setRefundReason('');
    setShowWasteModal(false);
    setWasteLog({});
    setWasteIngredients({});
    setCustomOpen(null);
  }

  // Step 1 confirm → carry the chosen lines into the Log Waste step.
  function confirmItems() {
    const initialLog: Record<number, boolean> = {};
    refundLines.forEach((l) => {
      initialLog[l.idx] = true;
    });
    setWasteLog(initialLog);
    setWasteIngredients({});
    setCustomOpen(null);
    setShowWasteModal(true);
  }

  // Step 2 confirm → apply refund/cancel to the order.
  function confirmWaste() {
    if (!selectedOrder || !refundMode) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === selectedOrder.id
          ? {
              ...o,
              payState: (refundMode === 'refund' ? 'Refunded' : o.payState) as PayState,
              footerState: 'Cancelled' as FooterState,
            }
          : o,
      ),
    );
    setRefundMode(null);
    setShowWasteModal(false);
  }

  function closeFlow() {
    setRefundMode(null);
    setShowWasteModal(false);
  }

  return (
    <div className="relative flex min-h-[calc(100vh-38px)] gap-3 bg-[#F2F2F2]">
      {/* ── Left: history workspace ──────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex flex-col gap-[7px]">
          <h1 className="text-[19px] font-medium leading-[1.4] text-black">Order History</h1>
          <p className="text-[13px] font-normal leading-[1.4] text-[#989898]">View and manage past orders</p>
        </div>

        {/* Filter pills + search */}
        <div className="mt-[24px] flex flex-wrap items-center gap-[11px]">
          {(['All', 'Dine In', 'Takeaway', 'Delivery'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTypeTab(tab)}
              className={cn(
                'rounded-[33.8px] px-[12px] py-[5px] text-[13.5px] font-normal leading-[1.4] transition-all',
                activeTypeTab === tab ? 'bg-[#026F4F] text-white shadow-xs' : 'bg-white text-[#686868] hover:text-[#2D2F33]',
              )}
            >
              {tab}
            </button>
          ))}
          <div className="ml-auto flex h-9 min-w-[200px] flex-1 items-center gap-2 rounded-full bg-white px-4 sm:max-w-[280px] sm:flex-none">
            <Search size={14} className="shrink-0 text-[#989898]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order # or table..."
              className="w-full bg-transparent text-[13px] text-[#2D2F33] outline-none placeholder:text-[#989898]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="shrink-0 text-[#989898] transition-colors hover:text-[#2D2F33]"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Cards grid */}
        <div className="mt-[24px] flex-1 overflow-y-auto pb-20">
          {filteredOrders.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-xl bg-white text-sm text-[#989898]">
              <Clock size={32} className="mb-2" />
              <p>No past orders for this filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredOrders.map((order) => {
                const isSelected = order.id === selectedOrderId;
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={cn(
                      'flex min-w-0 cursor-pointer items-center gap-2.5 overflow-hidden rounded-xl bg-white px-3 py-2.5 transition-all hover:shadow-md',
                      isSelected ? 'ring-2 ring-[#026F4F]/40' : '',
                    )}
                  >
                    {/* Order no + table/time */}
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[14px] font-semibold leading-[1.3] text-[#2D2F33]">{order.orderNumber}</span>
                        <span className="flex shrink-0 items-center gap-1 text-[11px] font-normal leading-[1.3] text-[#989898]">
                          <UtensilsCrossed size={12} strokeWidth={1.8} />
                          <span className="truncate">{order.table}</span>
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] font-normal leading-[1.3] text-[#989898]">
                        <Clock size={12} strokeWidth={1.8} />
                        <span className="truncate">{order.date}</span>
                      </span>
                    </div>

                    {/* Pay status + completed/cancelled */}
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium leading-[1.4]', PAY_PILL[order.payState])}>
                        {order.payState}
                      </span>
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium leading-[1.4]', FOOTER_BADGE[order.footerState])}>
                        {order.footerState}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel: order detail (overlay drawer below lg) ──────── */}
      {selectedOrder && (
        <div className="flex w-[343px] max-w-[calc(100vw-140px)] shrink-0 flex-col overflow-hidden rounded-lg bg-white shadow-[0_1px_6px_rgba(0,0,0,0.08)] max-lg:fixed max-lg:bottom-3 max-lg:right-3 max-lg:top-3 max-lg:z-40 max-lg:shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-3 pt-3">
            <button
              onClick={() => setSelectedOrderId('')}
              className="flex h-[28px] w-[28px] items-center justify-center rounded-full text-[#2D2F33] transition-colors hover:bg-[#F2F2F2]"
              aria-label="Back to orders"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex flex-col items-center gap-[7px]">
              <p className="text-[19px] font-medium leading-[1.4] text-black">Order {selectedOrder.orderNumber}</p>
              <p className="text-[10.5px] font-normal leading-[1.4] text-[#686868]">Table: 03</p>
            </div>
            <div className="h-[28px] w-[28px]" />
          </div>

          <div className="mt-4 flex-1 overflow-y-auto px-[11px] pb-2">
            {/* Customer info */}
            <div className="flex h-[116px] flex-col gap-[14px] rounded-[10px] bg-[#F2F2F2] px-[18px] py-[16px]">
              <p className="text-[16px] font-medium leading-[1.4] text-[#2D2F33]">{selectedOrder.customerName}</p>
              <div className="flex flex-col gap-[10px]">
                <div className="flex items-center gap-[8px]">
                  <Phone size={19} className="shrink-0 text-[#989898]" />
                  <span className="text-[13px] font-normal leading-[1.4] text-[#989898]">{selectedOrder.phone}</span>
                </div>
                <div className="flex items-center gap-[8px]">
                  <Mail size={19} className="shrink-0 text-[#989898]" />
                  <span className="text-[13px] font-normal leading-[1.4] text-[#989898]">{selectedOrder.email}</span>
                </div>
              </div>
            </div>

            {/* Order summary */}
            <div className="mt-[10px] flex flex-col gap-[10px]">
              <p className="text-[12px] font-semibold leading-[1.4] text-[#2D2F33]">Order Summary</p>
              <div className="flex flex-col gap-[11px]">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-[10px]">
                    <div className="flex h-[77px] w-[82px] shrink-0 items-center justify-center rounded-[7px] bg-[#F2F2F2] text-3xl">
                      {item.emoji}
                    </div>
                    <div className="flex min-w-0 flex-1 gap-[21px]">
                      <div className="flex min-w-0 flex-col gap-[8px]">
                        <span className="truncate text-[14.5px] font-medium leading-[1.4] text-[#2D2F33]">{item.name}</span>
                        <span className="text-[12.6px] font-normal leading-[1.4] text-[#989898]">+ {item.modifier || 'Mayo'}</span>
                        <span className="flex items-center gap-[3px] text-[12.6px] italic leading-[1.4] text-[#026F4F]">
                          <UtensilsCrossed size={19} strokeWidth={1.4} />
                          Cut in Half
                        </span>
                      </div>
                      <div className="ml-auto flex shrink-0 flex-col items-end gap-[36px]">
                        <span className="text-[17px] font-semibold leading-[1.4] text-[#026F4F]">${(item.price * item.qty).toFixed(2)}</span>
                        <span className="text-[11.6px] font-medium leading-[1.4] text-[#686868]">Qty: {item.qty}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payments */}
            <div className="mt-[20px] flex h-[158px] flex-col rounded-[7px] bg-[#F2F2F2] px-[9px] py-[10px]">
              <p className="text-[15px] font-medium leading-[1.4] text-[#2D2F33]">Payments Details</p>
              <div className="mt-[16px] flex flex-col gap-[12px] text-[13px] leading-[1.4]">
                <div className="flex items-center justify-between">
                  <span className="font-normal text-[#989898]">Subtotal ({selectedOrder.items.reduce((s, i) => s + i.qty, 0)} items)</span>
                  <span className="font-medium text-[#686868]">${selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-normal text-[#989898]">Service Charge (10%)</span>
                  <span className="font-medium text-[#686868]">${selectedOrder.serviceCharge.toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-[12px] border-t border-dashed border-[#989898]" />
              <div className="mt-[10px] flex items-center justify-between text-[14px] leading-[1.4]">
                <span className="font-medium text-black">Total</span>
                <span className="font-semibold text-[#026F4F]">${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Refund / Cancel — paid orders refund, unpaid orders cancel */}
          <div className="p-[11px]">
            {selectedOrder.footerState === 'Cancelled' || selectedOrder.payState === 'Refunded' ? (
              <button disabled className="flex h-[44px] w-full cursor-not-allowed items-center justify-center rounded-[30px] bg-zinc-300 text-[16px] font-medium leading-[1.4] text-white">
                {selectedOrder.payState === 'Refunded' ? 'Refunded' : 'Cancelled'}
              </button>
            ) : selectedOrder.payState === 'Paid' ? (
              <button
                onClick={() => openRefundFlow('refund')}
                className="flex h-[44px] w-full items-center justify-center gap-[3px] rounded-[30px] bg-[#F97316] text-[16px] font-medium leading-[1.4] text-white shadow-[0px_4px_16.3px_11px_rgba(0,0,0,0.12)] transition-all hover:bg-[#ea690b] active:scale-[0.99]"
              >
                <RotateCcw size={24} />
                <span>Refund</span>
              </button>
            ) : (
              <button
                onClick={() => openRefundFlow('cancel')}
                className="flex h-[44px] w-full items-center justify-center gap-[3px] rounded-[30px] bg-[#E85E5E] text-[16px] font-medium leading-[1.4] text-white shadow-[0px_4px_16.3px_11px_rgba(0,0,0,0.12)] transition-all hover:bg-[#d94a4a] active:scale-[0.99]"
              >
                <Ban size={22} />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Step 1: pick items to refund / cancel ─────────────────────── */}
      {refundMode && selectedOrder && !showWasteModal && (
        <RefundItemsModal
          mode={refundMode}
          orderNumber={selectedOrder.orderNumber}
          items={selectedOrder.items}
          refundQty={refundQty}
          onQtyChange={(idx, qty) => setRefundQty((prev) => ({ ...prev, [idx]: qty }))}
          reason={refundReason}
          onReasonChange={setRefundReason}
          total={refundTotal}
          onClose={closeFlow}
          onConfirm={confirmItems}
        />
      )}

      {/* ── Step 2: log waste ─────────────────────────────────────────── */}
      {refundMode && selectedOrder && showWasteModal && (
        <LogWasteModal
          mode={refundMode}
          lines={refundLines}
          wasteLog={wasteLog}
          onToggleLog={(idx) => setWasteLog((prev) => ({ ...prev, [idx]: !prev[idx] }))}
          wasteIngredients={wasteIngredients}
          customOpen={customOpen}
          onToggleCustom={(idx) => setCustomOpen((prev) => (prev === idx ? null : idx))}
          onToggleIngredient={(idx, ing) =>
            setWasteIngredients((prev) => {
              const cur = prev[idx] ?? [];
              return {
                ...prev,
                [idx]: cur.includes(ing) ? cur.filter((i) => i !== ing) : [...cur, ing],
              };
            })
          }
          onBack={() => setShowWasteModal(false)}
          onConfirm={confirmWaste}
        />
      )}
    </div>
  );
}

// ─── Step 1: choose which items to refund / cancel ───────────────────────────
function RefundItemsModal({
  mode,
  orderNumber,
  items,
  refundQty,
  onQtyChange,
  reason,
  onReasonChange,
  total,
  onClose,
  onConfirm,
}: {
  mode: RefundMode;
  orderNumber: string;
  items: HistoryItem[];
  refundQty: Record<number, number>;
  onQtyChange: (idx: number, qty: number) => void;
  reason: string;
  onReasonChange: (v: string) => void;
  total: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const selectedCount = Object.values(refundQty).filter((q) => q > 0).length;
  const title = mode === 'refund' ? 'Process Refund' : 'Cancel Order Items';
  const confirmLabel = mode === 'refund' ? 'Confirm Refund' : 'Confirm Cancellation';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-xs">
      <div className="my-auto w-[600px] max-w-full rounded-[17px] bg-white px-[32px] pb-[26px] pt-[26px] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-[23px] font-medium leading-[1.4] text-black">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-black transition-colors hover:text-zinc-500">
            <X size={24} />
          </button>
        </div>
        <p className="mt-[7px] text-[16px] font-normal leading-[1.4] text-[#989898]">Order {orderNumber}</p>

        {/* Item picker */}
        <p className="mt-[24px] text-[16px] font-medium leading-[1.4] text-[#2D2F33]">
          Select items {mode === 'refund' ? 'to refund' : 'to cancel'}
        </p>
        <div className="mt-[12px] flex max-h-[280px] flex-col gap-2 overflow-y-auto">
          {items.map((item, idx) => {
            const qty = refundQty[idx] ?? 0;
            const isSelected = qty > 0;
            return (
              <div
                key={idx}
                onClick={() => onQtyChange(idx, isSelected ? 0 : Math.min(1, item.qty))}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all',
                  isSelected ? 'border-[#026F4F] bg-[#E6F1ED]' : 'border-[#E9E9E9] bg-white hover:border-[#B9B9B9]',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                    isSelected ? 'border-[#026F4F] bg-[#026F4F]' : 'border-[#B9B9B9] bg-white',
                  )}
                >
                  {isSelected && <Check size={14} strokeWidth={3} className="text-white" />}
                </span>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#F2F2F2] text-2xl">
                  {item.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium text-[#2D2F33]">{item.name}</span>
                  <span className="text-[12px] text-[#989898]">
                    ${item.price.toFixed(2)} × {item.qty} ordered
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={qty <= (isSelected ? 1 : 0)}
                    onClick={() => onQtyChange(idx, Math.max(qty - 1, 1))}
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
                      qty <= 1 ? 'bg-zinc-100 text-zinc-300' : 'bg-emerald-200 text-emerald-900 hover:bg-emerald-300',
                    )}
                  >
                    <Minus size={13} strokeWidth={2.4} />
                  </button>
                  <span className="w-5 text-center text-sm font-medium text-[#2D2F33]">{qty}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={qty >= item.qty}
                    onClick={() => onQtyChange(idx, Math.min(qty + 1, item.qty))}
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
                      qty >= item.qty ? 'bg-zinc-100 text-zinc-300' : 'bg-[#026F4F] text-white hover:bg-[#015c42]',
                    )}
                  >
                    <Plus size={13} strokeWidth={2.4} />
                  </button>
                </span>
              </div>
            );
          })}
        </div>

        {/* Warning */}
        <div className="mt-[20px] flex items-start gap-[11px]">
          <CircleAlert size={24} className="shrink-0 text-[#8C1818]" />
          <p className="text-[13px] font-light leading-[1.4] text-[#8C1818]">
            This action cannot be undone.
            {mode === 'refund' ? ' The amount will be returned to the customer\u2019s original payment method.' : ''}
          </p>
        </div>

        {/* Reason */}
        <div className="mt-[20px] flex flex-col gap-[13px]">
          <label className="text-[16px] font-normal leading-[1.4] text-[#686868]">
            Reason for {mode === 'refund' ? 'a Refund' : 'Cancellation'}
          </label>
          <textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Reason....."
            rows={3}
            className="h-[88px] w-full resize-none rounded-[10px] bg-[#E9E9E9] p-[17px] text-[16px] font-normal leading-[1.4] text-[#2D2F33] outline-none placeholder:text-[#989898] focus:ring-2 focus:ring-[#026F4F]"
          />
        </div>

        {/* Buttons */}
        <div className="mt-[24px] flex flex-col justify-between gap-[19px] sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="h-[52px] w-full rounded-[30px] border border-[#B9B9B9] bg-[#E9E9E9] font-satoshi text-[19px] font-medium leading-[1.4] text-[#2D2F33] transition-colors hover:bg-[#E0E0E0] sm:w-[241px]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={onConfirm}
            className={cn(
              'h-[52px] w-full rounded-[30px] font-satoshi text-[19px] font-medium leading-[1.4] text-white transition-all sm:w-[241px]',
              selectedCount === 0
                ? 'cursor-not-allowed bg-zinc-300'
                : 'bg-[#026F4F] shadow-[0px_4px_16.3px_11px_rgba(0,0,0,0.12)] hover:bg-[#015c42] active:scale-[0.99]',
            )}
          >
            {confirmLabel} (${total.toFixed(2)})
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: log waste (+ per-item Custom ingredient picker) ─────────────────
function LogWasteModal({
  mode,
  lines,
  wasteLog,
  onToggleLog,
  wasteIngredients,
  customOpen,
  onToggleCustom,
  onToggleIngredient,
  onBack,
  onConfirm,
}: {
  mode: RefundMode;
  lines: { item: HistoryItem; idx: number; qty: number }[];
  wasteLog: Record<number, boolean>;
  onToggleLog: (idx: number) => void;
  wasteIngredients: Record<number, string[]>;
  customOpen: number | null;
  onToggleCustom: (idx: number) => void;
  onToggleIngredient: (idx: number, ing: string) => void;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-xs">
      <div className="my-auto w-[600px] max-w-full rounded-[17px] bg-white px-[32px] pb-[26px] pt-[26px] shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-[23px] font-medium leading-[1.4] text-black">Log Waste</h2>
          <button onClick={onBack} aria-label="Back" className="text-black transition-colors hover:text-zinc-500">
            <X size={24} />
          </button>
        </div>
        <p className="mt-[7px] text-[15px] font-normal leading-[1.4] text-[#989898]">
          Choose whether to log the {mode === 'refund' ? 'refunded' : 'cancelled'} items as waste.
        </p>

        <div className="mt-[20px] flex max-h-[320px] flex-col gap-3 overflow-y-auto">
          {lines.map(({ item, idx, qty }) => {
            const log = wasteLog[idx] ?? true;
            const selectedIngs = wasteIngredients[idx] ?? [];
            const isCustomOpen = customOpen === idx;
            return (
              <div key={idx} className="rounded-xl border border-[#E9E9E9] bg-white p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#F2F2F2] text-2xl">
                    {item.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium text-[#2D2F33]">
                      {item.name} <span className="text-[#989898]">× {qty}</span>
                    </span>
                    <span className="text-[12px] text-[#989898]">${(item.price * qty).toFixed(2)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleCustom(idx)}
                    className={cn(
                      'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all',
                      isCustomOpen || selectedIngs.length > 0
                        ? 'bg-[#026F4F] text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200',
                    )}
                  >
                    Custom{selectedIngs.length > 0 ? ` (${selectedIngs.length})` : ''}
                  </button>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={log}
                    onClick={() => onToggleLog(idx)}
                    className={cn(
                      'flex h-7 w-[52px] shrink-0 items-center rounded-full p-1 transition-colors',
                      log ? 'justify-end bg-[#026F4F]' : 'justify-start bg-zinc-300',
                    )}
                    title={log ? 'Log as waste' : 'Do not log as waste'}
                  >
                    <span className="h-5 w-5 rounded-full bg-white shadow" />
                  </button>
                </div>
                <p className="mt-1 text-right text-[11px] text-[#989898]">
                  {log ? 'Logged as waste' : 'Not logged'}
                </p>

                {isCustomOpen && (
                  <div className="mt-2 rounded-lg bg-[#F2F2F2] p-3">
                    <p className="mb-2 text-[13px] font-medium text-[#2D2F33]">
                      Which ingredients were wasted?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ingredientsFor(item.name).map((ing) => {
                        const active = selectedIngs.includes(ing);
                        return (
                          <button
                            key={ing}
                            type="button"
                            onClick={() => onToggleIngredient(idx, ing)}
                            className={cn(
                              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                              active
                                ? 'bg-[#026F4F] text-white shadow-xs'
                                : 'bg-white text-zinc-700 hover:bg-zinc-200',
                            )}
                          >
                            {active && <Check size={12} strokeWidth={3} />}
                            {ing}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-[24px] flex flex-col justify-between gap-[19px] sm:flex-row">
          <button
            type="button"
            onClick={onBack}
            className="h-[52px] w-full rounded-[30px] border border-[#B9B9B9] bg-[#E9E9E9] font-satoshi text-[19px] font-medium leading-[1.4] text-[#2D2F33] transition-colors hover:bg-[#E0E0E0] sm:w-[241px]"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-[52px] w-full rounded-[30px] bg-[#026F4F] font-satoshi text-[19px] font-medium leading-[1.4] text-white shadow-[0px_4px_16.3px_11px_rgba(0,0,0,0.12)] transition-all hover:bg-[#015c42] active:scale-[0.99] sm:w-[241px]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
