'use client';

import { useState } from 'react';
import { Clock, Calendar, UtensilsCrossed, CookingPot, Package, Check, X, ArrowLeft, Phone, Mail, Bell, CheckCircle2, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
type OrderStatus = 'Placed' | 'Preparing' | 'Ready' | 'Served' | 'Completed';
type OrderType = 'All' | 'Dine In' | 'Takeaway' | 'Delivery';

interface RunningOrderItem {
  name: string;
  qty: number;
  price: number;
  modifier?: string;
  emoji: string;
}

interface RunningOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  phone?: string;
  email?: string;
  isPaid: boolean;
  date: string;
  table: string;
  type: 'Dine In' | 'Takeaway' | 'Delivery';
  status: OrderStatus;
  items: RunningOrderItem[];
  subtotal: number;
  serviceCharge: number;
  total: number;
}

interface TableRequestItem {
  id: string;
  table: string;
  timeAgo: string;
  type: 'Waiter Requested' | 'Check Requested';
  paymentMethod?: 'Card' | 'Cash';
}

const STATUS_STEPS: { key: OrderStatus; label: string; icon: typeof Clock }[] = [
  { key: 'Placed', label: 'Placed', icon: Clock },
  { key: 'Preparing', label: 'Preparing', icon: CookingPot },
  { key: 'Ready', label: 'Ready', icon: Package },
  { key: 'Served', label: 'Served', icon: UtensilsCrossed },
];

// ─── Sample Data ───────────────────────────────────────────────────────────────
const INITIAL_RUNNING_ORDERS: RunningOrder[] = [
  {
    id: 'ro1',
    orderNumber: '#044',
    customerName: 'Robert Fox',
    phone: '+01284980',
    email: 'mike.t@example.com',
    isPaid: true,
    date: '7 Apr, 11:30 AM',
    table: 'Table 03',
    type: 'Dine In',
    status: 'Preparing',
    items: [
      { name: 'Shoyu Ramen', qty: 1, price: 15.99, modifier: 'No Spice', emoji: '🍜' },
      { name: 'Iced Green Tea', qty: 1, price: 15.99, modifier: 'No Spice', emoji: '🍵' },
    ],
    subtotal: 25.99,
    serviceCharge: 2.6,
    total: 30.99,
  },
  {
    id: 'ro2',
    orderNumber: '#045',
    customerName: 'Mike Thompson',
    phone: '+01284980',
    email: 'mike.t@example.com',
    isPaid: true,
    date: '7 Apr, 11:45 AM',
    table: 'Table 07',
    type: 'Dine In',
    status: 'Ready',
    items: [
      { name: 'Shoyu Ramen', qty: 1, price: 15.99, modifier: 'Extra Chili', emoji: '🍜' },
      { name: 'Coca-Cola', qty: 1, price: 2.99, modifier: 'Standard', emoji: '🥤' },
    ],
    subtotal: 18.98,
    serviceCharge: 1.9,
    total: 20.88,
  },
  {
    id: 'ro3',
    orderNumber: '#046',
    customerName: 'David K.',
    phone: '+01284980',
    email: 'david.k@example.com',
    isPaid: false,
    date: '7 Apr, 12:00 PM',
    table: 'Takeaway #12',
    type: 'Takeaway',
    status: 'Placed',
    items: [
      { name: 'Classic Burger', qty: 2, price: 15.99, modifier: 'Standard', emoji: '🍔' },
      { name: 'French Fries', qty: 1, price: 4.99, modifier: 'Standard', emoji: '🍟' },
    ],
    subtotal: 36.97,
    serviceCharge: 3.7,
    total: 40.67,
  },
];

const INITIAL_TABLE_REQUESTS: TableRequestItem[] = [
  { id: 'tr1', table: 'Table 9', timeAgo: '33 min ago', type: 'Waiter Requested' },
  { id: 'tr2', table: 'Table 9', timeAgo: '33 min ago', type: 'Check Requested', paymentMethod: 'Card' },
  { id: 'tr3', table: 'Table 9', timeAgo: '33 min ago', type: 'Check Requested', paymentMethod: 'Cash' },
];

export default function RunningOrderPage() {
  const [orders, setOrders] = useState<RunningOrder[]>(INITIAL_RUNNING_ORDERS);
  const [requests, setRequests] = useState<TableRequestItem[]>(INITIAL_TABLE_REQUESTS);
  const [activeTypeTab, setActiveTypeTab] = useState<OrderType>('All');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [showTableRequestModal, setShowTableRequestModal] = useState<boolean>(false);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  const filteredOrders = orders.filter((o) => {
    if (activeTypeTab === 'All') return true;
    return o.type === activeTypeTab;
  });

  function updateOrderStatus(id: string, newStatus: OrderStatus) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
  }

  function advanceStatus(order: RunningOrder) {
    const next: Record<OrderStatus, OrderStatus> = {
      Placed: 'Preparing',
      Preparing: 'Ready',
      Ready: 'Served',
      Served: 'Completed',
      Completed: 'Completed',
    };
    updateOrderStatus(order.id, next[order.status]);
  }

  function handleDismissAllRequests() {
    setRequests([]);
  }

  function handleRequestHandled(id: string) {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="flex min-h-[calc(100vh-24px)] gap-3 bg-[#F2F2F2] relative">
      {/* ── Left: Running Orders workspace ─────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-[7px]">
            <h1 className="text-[19px] font-medium leading-[1.4] text-black">Running Orders</h1>
            <p className="text-[13px] font-normal leading-[1.4] text-[#989898]">Live order tracking & actions</p>
          </div>
          <button
            onClick={() => setShowTableRequestModal(true)}
            className="flex items-center gap-2 rounded-full border border-[#E9E9E9] bg-white px-4 py-1.5 text-xs font-medium text-stone-500 shadow-xs transition-all hover:border-[#026F4F]"
          >
            <Bell size={14} className="text-[#026F4F]" />
            <span>Table Request</span>
            {requests.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[11px] font-medium text-white">
                {requests.length}
              </span>
            )}
          </button>
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
              <p>No active running orders for this filter.</p>
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
                    {/* Header: name + paid + order no */}
                    <div className="flex items-center justify-between">
                      <div className="flex min-w-0 items-center gap-[9px]">
                        <span className="truncate text-[16.8px] font-medium leading-[1.4] text-black">{order.customerName}</span>
                        <span
                          className={cn(
                            'flex shrink-0 items-center gap-[5px] rounded-[19.7px] px-[5px] py-[3px] text-[8px] font-normal leading-[1.4] text-white',
                            order.isPaid ? 'bg-[#16C722]' : 'bg-[#E85E5E]',
                          )}
                        >
                          <Check size={13} strokeWidth={3} className={order.isPaid ? '' : 'hidden'} />
                          <span>{order.isPaid ? 'Paid' : 'Unpaid'}</span>
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

                    {/* Footer */}
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex flex-col gap-[8px]">
                        <span className="text-[8.4px] font-normal leading-[1.4] text-[#686868]">
                          +{Math.max(0, order.items.length - 2)} Items
                        </span>
                        <span className="text-[12px] font-semibold leading-[1.4] text-[#026F4F]">${order.total.toFixed(2)}</span>
                      </div>
                      {order.status === 'Placed' && (
                        <div className="flex items-center gap-[11px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOrders((prev) => prev.filter((o) => o.id !== order.id));
                            }}
                            aria-label="Reject order"
                            className="flex h-[39px] w-[39px] items-center justify-center rounded-[6px] bg-[#E85E5E] text-white transition-colors hover:bg-[#d94a4a]"
                          >
                            <X size={18} strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(order.id, 'Preparing');
                            }}
                            aria-label="Accept order"
                            className="flex h-[39px] w-[39px] items-center justify-center rounded-[6px] bg-[#64C864] text-white transition-colors hover:bg-[#4fb84f]"
                          >
                            <Check size={18} strokeWidth={3} />
                          </button>
                        </div>
                      )}
                      {order.status === 'Preparing' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order.id, 'Ready');
                          }}
                          className="rounded-full bg-[#F97316] px-4 py-2 text-xs font-medium text-white shadow-xs transition-all hover:bg-[#ea690b] active:scale-95"
                        >
                          Mark Ready
                        </button>
                      )}
                      {order.status === 'Ready' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order.id, 'Served');
                          }}
                          className="rounded-full bg-green-600 px-4 py-2 text-xs font-medium text-white shadow-xs transition-all hover:bg-green-700 active:scale-95"
                        >
                          Complete
                        </button>
                      )}
                      {(order.status === 'Served' || order.status === 'Completed') && (
                        <button
                          disabled
                          className="cursor-not-allowed rounded-full bg-zinc-300 px-4 py-2 text-xs font-medium text-white"
                        >
                          Served
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel: order detail (overlay drawer below lg) ─────── */}
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
              <p className="text-[19px] font-medium leading-[1.4] text-black">{selectedOrder.orderNumber}</p>
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

            {/* Status stepper */}
            <div className="mt-[20px] h-[114px] rounded-[10px] bg-[#F2F2F2] px-[16px] pt-[13px]">
              <p className="text-[13px] font-medium leading-[1.4] text-black">Status</p>
              <div className="relative mt-[6px] flex items-start justify-between">
                {STATUS_STEPS.map((step, i) => {
                  const idx = STATUS_STEPS.findIndex((s) => s.key === selectedOrder.status);
                  const isDone = i <= idx;
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="flex flex-col items-center">
                      <div
                        className={cn(
                          'flex h-[32px] w-[32px] items-center justify-center rounded-full border',
                          isDone ? 'border-[#026F4F] bg-[#E6F1ED] text-[#026F4F]' : 'border-[#B9B9B9] bg-white text-[#989898]',
                        )}
                      >
                        <Icon size={18} strokeWidth={1.6} />
                      </div>
                      <span className={cn('mt-[8px] text-[9px] font-normal leading-[1.4]', isDone ? 'text-[#026F4F]' : 'text-[#B9B9B9]')}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
                {/* connectors */}
                {STATUS_STEPS.slice(0, 3).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'absolute top-[16px] h-[2px] w-[45px]',
                      i + 1 <= STATUS_STEPS.findIndex((s) => s.key === selectedOrder.status)
                        ? 'bg-[#026F4F]'
                        : 'bg-[#B9B9B9]',
                    )}
                    style={{ left: 16 + i * 81.5 }}
                  />
                ))}
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

          {/* Mark Ready */}
          <div className="p-[11px]">
            <button
              onClick={() => advanceStatus(selectedOrder)}
              className="flex h-[44px] w-full items-center justify-center rounded-[30px] bg-[#F97316] text-[16px] font-medium leading-[1.4] text-white shadow-[0px_4px_16.3px_11px_rgba(0,0,0,0.12)] transition-all hover:bg-[#ea690b] active:scale-[0.99]"
            >
              {selectedOrder.status === 'Placed'
                ? 'Mark Preparing'
                : selectedOrder.status === 'Preparing'
                  ? 'Mark Ready'
                  : selectedOrder.status === 'Ready'
                    ? 'Serve Order'
                    : 'Completed'}
            </button>
          </div>
        </div>
      )}

      {/* ── Table Request Modal ───────────────────────────────────────── */}
      {showTableRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="flex h-[720px] w-[384px] max-w-full flex-col rounded-lg bg-zinc-100 p-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-zinc-400/40 pb-3">
              <span className="text-lg font-medium text-black">Table Request</span>
              <button onClick={() => setShowTableRequestModal(false)} className="flex h-6 w-6 items-center justify-center rounded-full text-black transition-colors hover:bg-zinc-200">
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-1 text-xs font-normal text-neutral-400">
                <Clock size={14} />
                <span>Sorted by oldest first</span>
              </div>
              <button onClick={handleDismissAllRequests} className="text-xs font-medium text-emerald-700 hover:underline">
                Dismiss All
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {requests.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center text-xs text-neutral-400">
                  <CheckCircle2 size={32} className="mb-2 text-[#026F4F]" />
                  <span>All table requests have been handled.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {requests.map((req) => (
                    <div key={req.id} className="flex h-36 shrink-0 flex-col justify-between rounded-xl bg-white p-3.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl font-medium text-black">{req.table}</span>
                          {req.paymentMethod && (
                            <div className="flex items-center gap-1 rounded-[20px] bg-zinc-100 px-1.5 py-1">
                              <span className={cn('h-2 w-2 rounded-full', req.paymentMethod === 'Card' ? 'bg-yellow-500' : 'bg-green-600')} />
                              <span className="text-[8px] font-normal text-zinc-800">{req.paymentMethod}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-normal text-red-600">
                          <Clock size={14} />
                          <span>{req.timeAgo}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {req.type === 'Waiter Requested' ? (
                          <div className="flex items-center gap-1.5 rounded-2xl bg-fuchsia-200 px-2.5 py-1.5 text-xs font-normal text-fuchsia-800">
                            <Bell size={13} />
                            <span>Waiter Requested</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 rounded-2xl bg-blue-100 px-2.5 py-1.5 text-xs font-normal text-blue-900">
                            <CheckCircle2 size={13} />
                            <span>Check Requested</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        {req.type === 'Check Requested' && (
                          <button
                            onClick={() => alert(`Printing receipt for ${req.table}`)}
                            className="flex h-9 w-36 items-center justify-center gap-1 rounded-2xl border border-zinc-400 bg-gray-200 text-sm font-medium text-zinc-800 transition-colors hover:bg-gray-300"
                          >
                            <Printer size={14} />
                            <span>Print</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleRequestHandled(req.id)}
                          className={cn(
                            'flex h-9 items-center justify-center rounded-2xl bg-orange-500 text-sm font-medium text-white shadow-xs transition-colors hover:bg-orange-600',
                            req.type === 'Check Requested' ? 'w-36' : 'w-72',
                          )}
                        >
                          Handled
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}