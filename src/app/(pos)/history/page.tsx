'use client';

import { useState } from 'react';
import { Clock, UtensilsCrossed, Phone, Mail, ArrowLeft, X, RotateCcw, CircleAlert } from 'lucide-react';
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

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<HistoryOrder[]>(INITIAL_HISTORY);
  const [activeTypeTab, setActiveTypeTab] = useState<OrderType>('All');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [showRefundModal, setShowRefundModal] = useState(false);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  const filteredOrders = orders.filter((o) => {
    if (activeTypeTab === 'All') return true;
    return o.type === activeTypeTab;
  });

  function handleConfirmRefund(amount: number) {
    if (!selectedOrder) return;
    setOrders((prev) =>
      prev.map((o) => (o.id === selectedOrder.id ? { ...o, payState: 'Refunded' as PayState, footerState: 'Cancelled' as FooterState } : o)),
    );
    setShowRefundModal(false);
  }

  return (
    <div className="relative flex min-h-[calc(100vh-24px)] gap-3 bg-[#F2F2F2]">
      {/* ── Left: history workspace ──────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex flex-col gap-[7px]">
          <h1 className="text-[19px] font-medium leading-[1.4] text-black">Order History</h1>
          <p className="text-[13px] font-normal leading-[1.4] text-[#989898]">View and manage past orders</p>
        </div>

        {/* Filter pills */}
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
        </div>

        {/* Cards grid */}
        <div className="mt-[24px] flex-1 overflow-y-auto pb-20">
          {filteredOrders.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-xl bg-white text-sm text-[#989898]">
              <Clock size={32} className="mb-2" />
              <p>No past orders for this filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-[9px] sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredOrders.map((order) => {
                const isSelected = order.id === selectedOrderId;
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={cn(
                      'relative flex h-[326px] min-w-0 cursor-pointer flex-col overflow-hidden rounded-[12px] bg-white p-[14px] transition-all hover:shadow-md',
                      isSelected ? 'ring-2 ring-[#026F4F]/30' : '',
                    )}
                  >
                    {/* Header: name + pay pill + order no */}
                    <div className="flex items-center justify-between">
                      <div className="flex min-w-0 items-center gap-[9px]">
                        <span className="truncate text-[16.8px] font-medium leading-[1.4] text-black">{order.customerName}</span>
                        <span className={cn('shrink-0 rounded-[19.7px] px-[5px] py-[3px] text-[8px] font-normal leading-[1.4]', PAY_PILL[order.payState])}>
                          {order.payState}
                        </span>
                      </div>
                      <span className="shrink-0 text-[11.4px] font-normal leading-[1.4] text-[#989898]">{order.orderNumber}</span>
                    </div>

                    {/* Meta */}
                    <div className="mt-[9px] flex flex-col gap-[8px]">
                      <div className="flex items-center gap-[6px]">
                        <Clock size={15.6} strokeWidth={1.6} className="shrink-0 text-[#989898]" />
                        <span className="text-[11.4px] font-normal leading-[1.4] text-[#989898]">{order.date}</span>
                      </div>
                      <div className="flex items-center gap-[6px]">
                        <UtensilsCrossed size={15.6} strokeWidth={1.6} className="shrink-0 text-[#989898]" />
                        <span className="text-[11.4px] font-normal leading-[1.4] text-[#989898]">{order.table}</span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="mt-[15px] flex flex-col">
                      {order.items.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="flex items-end justify-between gap-3 py-[14px] first:pt-0">
                          <div className="flex items-center gap-[12px]">
                            <div className="flex h-[56px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-[4px] bg-[#F2F2F2] text-2xl">
                              {item.emoji}
                            </div>
                            <div className="flex min-w-0 flex-col gap-[7px]">
                              <span className="truncate text-[11.4px] font-medium leading-[1.4] text-[#2D2F33]">{item.name}</span>
                              <span className="truncate text-[8px] font-normal leading-[1.4] text-[#989898]">&ldquo;{item.modifier || 'Standard'}&rdquo;</span>
                              <span className="text-[10.8px] font-semibold leading-[1.4] text-[#026F4F]">${item.price.toFixed(2)}</span>
                            </div>
                          </div>
                          <span className="shrink-0 text-[8px] font-medium leading-[1.4] text-[#686868]">Qty: {item.qty}</span>
                        </div>
                      ))}
                    </div>

                    {/* Footer: status badge + totals */}
                    <div className="mt-auto flex items-end justify-between">
                      <span className={cn('flex h-[23px] items-center justify-center rounded-[29px] px-[7px] text-[11px] font-normal leading-[1.4]', FOOTER_BADGE[order.footerState])}>
                        {order.footerState}
                      </span>
                      <div className="flex flex-col items-end gap-[8px]">
                        <span className="text-[8.4px] font-normal leading-[1.4] text-[#686868]">
                          +{Math.max(0, order.items.length - 2)} Items
                        </span>
                        <span className="text-[15px] font-semibold leading-[1.4] text-[#026F4F]">${order.total.toFixed(2)}</span>
                      </div>
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

          {/* Refund */}
          <div className="p-[11px]">
            {selectedOrder.payState === 'Refunded' ? (
              <button disabled className="flex h-[44px] w-full cursor-not-allowed items-center justify-center rounded-[30px] bg-zinc-300 text-[16px] font-medium leading-[1.4] text-white">
                Refunded
              </button>
            ) : (
              <button
                onClick={() => setShowRefundModal(true)}
                className="flex h-[44px] w-full items-center justify-center gap-[3px] rounded-[30px] bg-[#F97316] text-[16px] font-medium leading-[1.4] text-white shadow-[0px_4px_16.3px_11px_rgba(0,0,0,0.12)] transition-all hover:bg-[#ea690b] active:scale-[0.99]"
              >
                <RotateCcw size={24} />
                <span>Refund</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Process Refund modal (Figma 1129:2000) ───────────────────── */}
      {showRefundModal && selectedOrder && (
        <RefundModal
          orderNumber={selectedOrder.orderNumber}
          total={selectedOrder.total}
          onClose={() => setShowRefundModal(false)}
          onConfirm={handleConfirmRefund}
        />
      )}
    </div>
  );
}

// ─── Process Refund modal ──────────────────────────────────────────────────
function RefundModal({
  orderNumber,
  total,
  onClose,
  onConfirm,
}: {
  orderNumber: string;
  total: number;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}) {
  const [amount, setAmount] = useState(total.toFixed(2));
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-xs">
      <div className="my-auto w-[560px] max-w-full rounded-[17px] bg-white px-[32px] pb-[26px] pt-[26px] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-[23px] font-medium leading-[1.4] text-black">Process Refund</h2>
          <button onClick={onClose} aria-label="Close" className="text-black transition-colors hover:text-zinc-500">
            <X size={24} />
          </button>
        </div>
        <p className="mt-[7px] text-[16px] font-normal leading-[1.4] text-[#989898]">Order {orderNumber}</p>

        {/* Amount */}
        <div className="mt-[37px] flex flex-col gap-[13px]">
          <label className="text-[16px] font-normal leading-[1.4] text-[#686868]">Refund Amount ($)</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-[17px] top-1/2 -translate-y-1/2 text-[19px] font-normal leading-[1.4] text-[#989898]">
              $
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              className="h-[61px] w-full rounded-[10px] bg-[#E9E9E9] pl-[38px] pr-[17px] text-[19px] font-normal leading-[1.4] text-[#2D2F33] outline-none placeholder:text-[#989898] focus:ring-2 focus:ring-[#026F4F]"
            />
          </div>
        </div>

        {/* Warning */}
        <div className="mt-[26px] flex items-start gap-[11px]">
          <CircleAlert size={24} className="shrink-0 text-[#8C1818]" />
          <p className="text-[13px] font-light leading-[1.4] text-[#8C1818]">
            This action cannot be undone. The amount will be returned to the customer&apos;s original payment method.
          </p>
        </div>

        {/* Reason */}
        <div className="mt-[26px] flex flex-col gap-[13px]">
          <label className="text-[16px] font-normal leading-[1.4] text-[#686868]">Reason for a Refund</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason....."
            rows={4}
            className="h-[117px] w-full resize-none rounded-[10px] bg-[#E9E9E9] p-[17px] text-[19px] font-normal leading-[1.4] text-[#2D2F33] outline-none placeholder:text-[#989898] focus:ring-2 focus:ring-[#026F4F]"
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
            onClick={() => onConfirm(parseFloat(amount) || 0)}
            className="h-[52px] w-full rounded-[30px] bg-[#026F4F] font-satoshi text-[19px] font-medium leading-[1.4] text-white shadow-[0px_4px_16.3px_11px_rgba(0,0,0,0.12)] transition-all hover:bg-[#015c42] active:scale-[0.99] sm:w-[241px]"
          >
            Confirm Refund
          </button>
        </div>
      </div>
    </div>
  );
}
