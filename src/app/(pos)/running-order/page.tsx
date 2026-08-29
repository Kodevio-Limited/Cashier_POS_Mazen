'use client';

import { useState } from 'react';
import { Clock, Bell, Check, Calendar, MapPin, Scissors, Printer, X, CheckCircle2 } from 'lucide-react';
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
  isUnpaid: boolean;
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

// ─── Sample Data ───────────────────────────────────────────────────────────────
const INITIAL_RUNNING_ORDERS: RunningOrder[] = [
  {
    id: 'ro1',
    orderNumber: '#044',
    customerName: 'Robert Fox',
    phone: '+01284980',
    email: 'mike.t@example.com',
    isUnpaid: true,
    date: '7 Apr, 11:30 AM',
    table: 'Table 03',
    type: 'Dine In',
    status: 'Preparing',
    items: [
      { name: 'Shoyu Ramen', qty: 1, price: 15.99, modifier: 'No Spice', emoji: '🍜' },
      { name: 'Iced Green Tea', qty: 1, price: 15.99, modifier: 'No Spice', emoji: '🍵' },
    ],
    subtotal: 25.99,
    serviceCharge: 2.60,
    total: 30.99,
  },
  {
    id: 'ro2',
    orderNumber: '#045',
    customerName: 'Mike Thompson',
    phone: '+01284980',
    email: 'mike.t@example.com',
    isUnpaid: false,
    date: '7 Apr, 11:45 AM',
    table: 'Table 07',
    type: 'Dine In',
    status: 'Ready',
    items: [
      { name: 'Shoyu Ramen', qty: 1, price: 15.99, modifier: 'Extra Chili', emoji: '🍜' },
      { name: 'Coca-Cola', qty: 1, price: 2.99, modifier: 'Standard', emoji: '🥤' },
    ],
    subtotal: 18.98,
    serviceCharge: 1.90,
    total: 20.88,
  },
  {
    id: 'ro3',
    orderNumber: '#046',
    customerName: 'David K.',
    phone: '+01284980',
    email: 'david.k@example.com',
    isUnpaid: true,
    date: '7 Apr, 12:00 PM',
    table: 'Takeaway #12',
    type: 'Takeaway',
    status: 'Placed',
    items: [
      { name: 'Classic Burger', qty: 2, price: 15.99, modifier: 'Standard', emoji: '🍔' },
      { name: 'French Fries', qty: 1, price: 4.99, modifier: 'Standard', emoji: '🍟' },
    ],
    subtotal: 36.97,
    serviceCharge: 3.70,
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
  const [selectedOrderId, setSelectedOrderId] = useState<string>('ro1');
  const [showTableRequestModal, setShowTableRequestModal] = useState<boolean>(false);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];

  const filteredOrders = orders.filter((o) => {
    if (activeTypeTab === 'All') return true;
    return o.type === activeTypeTab;
  });

  function updateOrderStatus(id: string, newStatus: OrderStatus) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)),
    );
  }

  function handleDismissAllRequests() {
    setRequests([]);
  }

  function handleRequestHandled(id: string) {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="flex h-[calc(100vh-24px)] gap-3 bg-[#F2F2F2] p-1.5 rounded-2xl overflow-hidden relative">
      {/* ── Running Orders Main Workspace ──────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <div className="flex justify-between items-center px-4 py-3 bg-white rounded-xl mb-3 border border-[#E9E9E9]">
          <div>
            <h1 className="text-black text-lg font-medium font-['Inter']">Running Orders</h1>
            <p className="text-neutral-400 text-xs font-normal font-['Inter']">Live order tracking & actions</p>
          </div>

          {/* Table Request Pill Trigger with Red Count Badge */}
          <button
            onClick={() => setShowTableRequestModal(true)}
            className="px-4 py-1.5 rounded-full bg-white border border-[#E9E9E9] text-stone-500 hover:border-[#026F4F] text-xs font-medium transition-all flex items-center gap-2 relative shadow-xs"
          >
            <Bell size={14} className="text-[#026F4F]" />
            <span>Table Request</span>
            {requests.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-medium flex items-center justify-center -mr-1">
                {requests.length}
              </span>
            )}
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 mb-3">
          {(['All', 'Dine In', 'Takeaway', 'Delivery'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTypeTab(tab)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-normal font-['Inter'] transition-all",
                activeTypeTab === tab
                  ? 'bg-[#026F4F] text-white shadow-xs'
                  : 'bg-white text-stone-500 border border-[#E9E9E9] hover:text-[#2D2F33]',
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Running Orders Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 bg-white rounded-xl text-[#989898] text-sm">
              <Clock size={32} className="mb-2 text-[#989898]" />
              <p>No active running orders for this filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
              {filteredOrders.map((order) => {
                const isSelected = order.id === selectedOrderId;
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={cn(
                      'w-full h-80 bg-white rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer border flex flex-col justify-between p-3.5 relative',
                      isSelected ? 'border-[#026F4F] ring-2 ring-[#026F4F]/20' : 'border-transparent',
                    )}
                  >
                    {/* Customer & Order Header */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-black text-base font-medium font-['Inter'] truncate">
                            {order.customerName}
                          </span>
                          {order.isUnpaid ? (
                            <span className="px-2 py-0.5 bg-red-500 text-white text-[8px] font-normal font-['Inter'] rounded-full shrink-0">
                              Unpaid
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-green-600 text-white text-[8px] font-normal font-['Inter'] rounded-full shrink-0">
                              Paid
                            </span>
                          )}
                        </div>
                        <span className="text-neutral-400 text-xs font-normal font-['Inter'] shrink-0">{order.orderNumber}</span>
                      </div>

                      <div className="flex flex-col gap-1 text-neutral-400 text-xs font-normal font-['Inter']">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="shrink-0" />
                          <span>{order.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} className="shrink-0" />
                          <span>{order.table}</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full border-t border-dashed border-neutral-300 my-1" />

                    {/* Items */}
                    <div className="flex flex-col gap-2 flex-1 justify-center">
                      {order.items.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-12 bg-zinc-100 rounded-sm flex items-center justify-center text-xl shrink-0">
                              {item.emoji}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-zinc-800 text-xs font-medium font-['Inter'] truncate">{item.name}</span>
                              <span className="text-neutral-400 text-[9px] font-normal font-['Inter']">"{item.modifier || 'Standard'}"</span>
                              <span className="text-emerald-700 text-xs font-semibold font-['Inter']">${item.price.toFixed(2)}</span>
                            </div>
                          </div>
                          <span className="text-stone-500 text-[10px] font-medium font-['Inter'] shrink-0">Qty: {item.qty}</span>
                        </div>
                      ))}
                    </div>

                    <div className="w-full border-t border-dashed border-neutral-300 my-1" />

                    {/* Footer */}
                    <div className="flex justify-between items-center w-full pt-1">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-stone-500 text-[9px] font-normal font-['Inter']">+{order.items.length} Items</span>
                        <span className="text-emerald-700 text-sm font-semibold font-['Inter']">${order.total.toFixed(2)}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (order.status === 'Preparing') updateOrderStatus(order.id, 'Ready');
                          else updateOrderStatus(order.id, 'Completed');
                        }}
                        className={cn(
                          'px-4 py-2 rounded-full text-xs font-medium text-white shadow-xs transition-all active:scale-95',
                          order.status === 'Preparing' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700',
                        )}
                      >
                        {order.status === 'Preparing' ? 'Mark Ready' : 'Complete'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Right Panel: Side Drawer ────────────────────────────────────────── */}
      {selectedOrder && (
        <div className="w-80 shrink-0 flex flex-col justify-between bg-white rounded-xl overflow-hidden shadow-[0_1px_6px_rgba(0,0,0,0.08)] border border-[#E9E9E9]">
          <div className="pt-4 pb-3 border-b border-zinc-200 flex flex-col items-center gap-0.5">
            <span className="text-black text-lg font-medium font-['Inter']">{selectedOrder.orderNumber}</span>
            <span className="text-stone-500 text-xs font-normal font-['Inter']">{selectedOrder.table}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-4">
            <div className="bg-zinc-100 rounded-[10px] p-3 flex flex-col gap-1">
              <span className="text-zinc-800 text-base font-medium font-['Inter']">{selectedOrder.customerName}</span>
              <div className="flex flex-col gap-0.5 text-neutral-400 text-xs font-normal font-['Inter']">
                <span>{selectedOrder.phone || '+01284980'}</span>
                <span>{selectedOrder.email || 'mike.t@example.com'}</span>
              </div>
            </div>

            <div className="bg-zinc-100 rounded-[10px] p-3 flex flex-col gap-2">
              <span className="text-black text-xs font-medium font-['Inter']">Status</span>
              <div className="flex items-center justify-between pt-1 relative">
                {(['Placed', 'Preparing', 'Ready', 'Served'] as const).map((st, i) => {
                  const stepIndex = ['Placed', 'Preparing', 'Ready', 'Served'].indexOf(selectedOrder.status);
                  const isDone = i <= stepIndex;
                  return (
                    <div key={st} className="flex flex-col items-center gap-1 z-10">
                      <div
                        className={cn(
                          'w-7 h-7 rounded-full border flex items-center justify-center text-[10px] font-bold bg-white transition-all',
                          isDone ? 'border-teal-700 text-teal-700' : 'border-zinc-400 text-zinc-400',
                        )}
                      >
                        {isDone ? <Check size={12} strokeWidth={3} /> : i + 1}
                      </div>
                      <span className={cn('text-[9px] font-normal', isDone ? 'text-emerald-700' : 'text-zinc-400')}>
                        {st}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-zinc-800 text-xs font-semibold font-['Inter']">Order Summary</span>
              <div className="flex flex-col gap-3">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center gap-2">
                    <div className="w-12 h-14 bg-zinc-100 rounded-md flex items-center justify-center text-2xl shrink-0">
                      {item.emoji}
                    </div>
                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                      <span className="text-zinc-800 text-sm font-medium font-['Inter'] truncate">{item.name}</span>
                      <div className="flex items-center gap-1 text-xs font-['Inter']">
                        <span className="text-green-500 font-medium">+</span>
                        <span className="text-neutral-400">{item.modifier || 'Mayo'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-700 text-xs font-['Inter']">
                        <Scissors size={12} />
                        <span>Cut in Half</span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col gap-1 shrink-0">
                      <span className="text-emerald-700 text-base font-semibold font-['Inter']">${(item.price * item.qty).toFixed(2)}</span>
                      <span className="text-stone-500 text-xs font-medium font-['Inter']">Qty: {item.qty}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-100 rounded-md p-3 flex flex-col gap-2">
              <span className="text-zinc-800 text-base font-medium font-['Inter']">Payments Details</span>
              <div className="flex justify-between text-xs text-neutral-400 font-['Inter']">
                <span>Subtotal ({selectedOrder.items.reduce((s, i) => s + i.qty, 0)} items)</span>
                <span className="text-stone-500 font-medium">${selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-400 font-['Inter']">
                <span>Service Charge (10%)</span>
                <span className="text-stone-500 font-medium">${selectedOrder.serviceCharge.toFixed(2)}</span>
              </div>
              <div className="border-t border-neutral-400 my-1" />
              <div className="flex justify-between text-sm font-medium text-black font-['Inter']">
                <span>Total</span>
                <span className="text-emerald-700 font-semibold">${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="p-3 border-t border-zinc-200 bg-white">
            <button
              onClick={() => {
                if (selectedOrder.status === 'Placed') updateOrderStatus(selectedOrder.id, 'Preparing');
                else if (selectedOrder.status === 'Preparing') updateOrderStatus(selectedOrder.id, 'Ready');
                else if (selectedOrder.status === 'Ready') updateOrderStatus(selectedOrder.id, 'Served');
                else updateOrderStatus(selectedOrder.id, 'Completed');
              }}
              className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white rounded-[30px] font-medium text-base shadow-md transition-all active:scale-95 flex items-center justify-center font-['Inter']"
            >
              {selectedOrder.status === 'Placed' ? 'Mark Preparing' : selectedOrder.status === 'Preparing' ? 'Mark Ready' : selectedOrder.status === 'Ready' ? 'Serve Order' : 'Complete Order'}
            </button>
          </div>
        </div>
      )}

      {/* ── Table Request Vertical Modal (Figma Exact Code & Layout) ──────── */}
      {showTableRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="w-96 h-[800px] max-h-[calc(100vh-32px)] bg-zinc-100 rounded-lg overflow-hidden relative shadow-2xl flex flex-col p-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-3 border-b border-zinc-400/40">
              <span className="text-black text-lg font-medium font-['Inter']">Table Request</span>
              <button
                onClick={() => setShowTableRequestModal(false)}
                className="w-6 h-6 flex items-center justify-center text-black hover:bg-zinc-200 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sub-header Meta: Sorted by oldest & Dismiss All */}
            <div className="flex justify-between items-center py-3">
              <div className="flex items-center gap-1 text-neutral-400 text-xs font-normal font-['Inter']">
                <Clock size={14} />
                <span>Sorted by oldest first</span>
              </div>
              <button
                onClick={handleDismissAllRequests}
                className="text-emerald-700 text-xs font-medium font-['Inter'] hover:underline"
              >
                Dismiss All
              </button>
            </div>

            {/* Cards List */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-0.5">
              {requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-neutral-400 text-xs">
                  <CheckCircle2 size={32} className="mb-2 text-[#026F4F]" />
                  <span>All table requests have been handled.</span>
                </div>
              ) : (
                requests.map((req) => (
                  <div key={req.id} className="w-80 h-36 shrink-0 bg-white rounded-xl p-3.5 flex flex-col justify-between shadow-xs relative self-center">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <span className="text-black text-2xl font-medium font-['Inter']">{req.table}</span>
                        {req.paymentMethod && (
                          <div className="px-1.5 py-1 bg-zinc-100 rounded-[20px] flex items-center gap-1">
                            <span className={cn('w-2 h-2 rounded-full', req.paymentMethod === 'Card' ? 'bg-yellow-500' : 'bg-green-600')} />
                            <span className="text-zinc-800 text-[8px] font-normal font-['Inter']">{req.paymentMethod}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-red-600 text-xs font-normal font-['Inter']">
                        <Clock size={14} />
                        <span>{req.timeAgo}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {req.type === 'Waiter Requested' ? (
                        <div className="px-2.5 py-1.5 bg-fuchsia-200 rounded-2xl text-fuchsia-800 text-xs font-normal font-['Inter'] flex items-center gap-1.5">
                          <Bell size={13} />
                          <span>Waiter Requested</span>
                        </div>
                      ) : (
                        <div className="px-2.5 py-1.5 bg-blue-100 rounded-2xl text-blue-900 text-xs font-normal font-['Inter'] flex items-center gap-1.5">
                          <CheckCircle2 size={13} />
                          <span>Check Requested</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {req.type === 'Check Requested' && (
                        <button
                          onClick={() => alert(`Printing receipt for ${req.table}`)}
                          className="w-36 h-9 bg-gray-200 border border-zinc-400 rounded-2xl text-zinc-800 text-sm font-medium font-['Inter'] flex items-center justify-center gap-1 hover:bg-gray-300 transition-colors"
                        >
                          <Printer size={14} />
                          <span>Print</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleRequestHandled(req.id)}
                        className={cn(
                          "h-9 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-sm font-medium font-['Inter'] flex items-center justify-center shadow-xs transition-colors",
                          req.type === 'Check Requested' ? 'w-36' : 'w-72',
                        )}
                      >
                        Handled
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
