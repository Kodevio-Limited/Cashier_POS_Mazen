'use client';

import { useState } from 'react';
import { Search, Calendar, Filter, Printer, RefreshCw, Eye, ArrowUpRight, DollarSign, CreditCard, ChevronRight, X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoryOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  date: string;
  time: string;
  table: string;
  type: 'Dine In' | 'Takeaway' | 'Delivery';
  paymentMethod: 'Cash' | 'Credit Card' | 'Apple Pay';
  itemsCount: number;
  subtotal: number;
  tax: number;
  total: number;
  cashier: string;
  status: 'Completed' | 'Refunded' | 'Cancelled';
  items: { name: string; qty: number; price: number }[];
}

const SAMPLE_HISTORY: HistoryOrder[] = [
  {
    id: 'h1',
    orderNumber: '#ORD-0043',
    customerName: 'Marcus Wright',
    date: '7 Apr 2026',
    time: '11:15 AM',
    table: 'Table 04',
    type: 'Dine In',
    paymentMethod: 'Credit Card',
    itemsCount: 3,
    subtotal: 42.00,
    tax: 4.20,
    total: 46.20,
    cashier: 'Alex Chen',
    status: 'Completed',
    items: [
      { name: 'Tonkotsu Ramen', qty: 2, price: 18.00 },
      { name: 'Iced Green Tea', qty: 1, price: 6.00 },
    ],
  },
  {
    id: 'h2',
    orderNumber: '#ORD-0042',
    customerName: 'Elena Rostova',
    date: '7 Apr 2026',
    time: '10:45 AM',
    table: 'Takeaway #08',
    type: 'Takeaway',
    paymentMethod: 'Cash',
    itemsCount: 2,
    subtotal: 28.50,
    tax: 2.85,
    total: 31.35,
    cashier: 'Alex Chen',
    status: 'Completed',
    items: [
      { name: 'Classic Burger', qty: 1, price: 18.50 },
      { name: 'French Fries', qty: 1, price: 10.00 },
    ],
  },
  {
    id: 'h3',
    orderNumber: '#ORD-0041',
    customerName: 'James Carter',
    date: '7 Apr 2026',
    time: '10:10 AM',
    table: 'Table 02',
    type: 'Dine In',
    paymentMethod: 'Apple Pay',
    itemsCount: 4,
    subtotal: 65.00,
    tax: 6.50,
    total: 71.50,
    cashier: 'Sarah Jenkins',
    status: 'Completed',
    items: [
      { name: 'Shoyu Ramen', qty: 2, price: 20.00 },
      { name: 'Gyoza Dumplings', qty: 1, price: 15.00 },
      { name: 'Matcha Latte', qty: 1, price: 10.00 },
    ],
  },
  {
    id: 'h4',
    orderNumber: '#ORD-0040',
    customerName: 'David Lee',
    date: '7 Apr 2026',
    time: '09:50 AM',
    table: 'Delivery #02',
    type: 'Delivery',
    paymentMethod: 'Credit Card',
    itemsCount: 2,
    subtotal: 22.00,
    tax: 2.20,
    total: 24.20,
    cashier: 'Sarah Jenkins',
    status: 'Refunded',
    items: [
      { name: 'Spicy Chicken Wings', qty: 1, price: 14.00 },
      { name: 'Soda', qty: 1, price: 8.00 },
    ],
  },
];

export default function OrderHistoryPage() {
  const [historyOrders, setHistoryOrders] = useState<HistoryOrder[]>(SAMPLE_HISTORY);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'Refunded' | 'Cancelled'>('All');
  const [selectedOrder, setSelectedOrder] = useState<HistoryOrder | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const filteredHistory = historyOrders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.table.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalSales = historyOrders.filter((o) => o.status === 'Completed').reduce((sum, o) => sum + o.total, 0);
  const totalCompleted = historyOrders.filter((o) => o.status === 'Completed').length;
  const totalRefunded = historyOrders.filter((o) => o.status === 'Refunded').length;

  return (
    <div className="flex h-[calc(100vh-24px)] flex-col gap-3 bg-[#F2F2F2] p-1.5 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-5 py-3.5 bg-white rounded-xl border border-[#E9E9E9]">
        <div>
          <h1 className="text-black text-xl font-medium font-['Inter']">Order History & Receipts</h1>
          <p className="text-neutral-400 text-xs font-normal font-['Inter']">Review past completed sales, print receipts, and issue refunds</p>
        </div>

        {/* Search Input */}
        <div className="relative w-72">
          <Search size={16} className="absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search order #, customer, table..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-zinc-100 border border-zinc-200 rounded-full text-xs text-black focus:outline-hidden focus:border-[#026F4F]"
          />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-[#E9E9E9] flex items-center justify-between">
          <div>
            <p className="text-neutral-400 text-xs">Total Sales Today</p>
            <p className="text-[#026F4F] text-xl font-bold">${totalSales.toFixed(2)}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#026F4F] flex items-center justify-center font-bold">
            $
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-[#E9E9E9] flex items-center justify-between">
          <div>
            <p className="text-neutral-400 text-xs">Completed Orders</p>
            <p className="text-black text-xl font-bold">{totalCompleted}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-[#E9E9E9] flex items-center justify-between">
          <div>
            <p className="text-neutral-400 text-xs">Refunded Orders</p>
            <p className="text-rose-600 text-xl font-bold">{totalRefunded}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
            <RefreshCw size={18} />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-[#E9E9E9]">
        <div className="flex items-center gap-2">
          {(['All', 'Completed', 'Refunded', 'Cancelled'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all',
                statusFilter === st
                  ? 'bg-[#026F4F] text-white shadow-xs'
                  : 'bg-[#F2F2F2] text-stone-500 hover:text-black',
              )}
            >
              {st}
            </button>
          ))}
        </div>
        <span className="text-xs text-neutral-400">Showing {filteredHistory.length} transactions</span>
      </div>

      {/* Orders Table */}
      <div className="flex-1 bg-white rounded-xl overflow-hidden border border-[#E9E9E9] flex flex-col">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left text-xs text-black">
            <thead className="bg-[#F2F2F2] text-neutral-500 font-medium sticky top-0 border-b border-zinc-200">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Table / Type</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredHistory.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-black">{order.orderNumber}</td>
                  <td className="py-3 px-4">{order.customerName}</td>
                  <td className="py-3 px-4 text-neutral-400">{order.date}, {order.time}</td>
                  <td className="py-3 px-4">{order.table}</td>
                  <td className="py-3 px-4 font-medium">{order.paymentMethod}</td>
                  <td className="py-3 px-4">{order.itemsCount} items</td>
                  <td className="py-3 px-4 font-bold text-[#026F4F]">${order.total.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-[10px] font-semibold',
                        order.status === 'Completed' && 'bg-emerald-100 text-emerald-800',
                        order.status === 'Refunded' && 'bg-rose-100 text-rose-800',
                        order.status === 'Cancelled' && 'bg-zinc-200 text-zinc-700',
                      )}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowReceiptModal(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium transition-colors"
                    >
                      Receipt
                    </button>
                    {order.status === 'Completed' && (
                      <button
                        onClick={() => {
                          if (confirm(`Issue refund for order ${order.orderNumber}?`)) {
                            setHistoryOrders((prev) =>
                              prev.map((o) => (o.id === order.id ? { ...o, status: 'Refunded' } : o)),
                            );
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium transition-colors"
                      >
                        Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="w-80 bg-white rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
              <span className="font-bold text-black">Receipt Preview</span>
              <button onClick={() => setShowReceiptModal(false)} className="text-neutral-400 hover:text-black">
                <X size={18} />
              </button>
            </div>

            <div className="bg-zinc-50 rounded-xl p-4 flex flex-col gap-3 font-mono text-xs text-black border border-zinc-200">
              <div className="text-center pb-2 border-b border-dashed border-zinc-300">
                <p className="font-bold text-sm">EMSA7 RESTAURANT</p>
                <p className="text-[10px] text-neutral-400">123 Culinary St, Food City</p>
              </div>

              <div className="flex justify-between text-[11px]">
                <span>Order: {selectedOrder.orderNumber}</span>
                <span>{selectedOrder.date}</span>
              </div>
              <div className="flex justify-between text-[11px] text-neutral-400">
                <span>Table: {selectedOrder.table}</span>
                <span>{selectedOrder.time}</span>
              </div>

              <div className="border-t border-dashed border-zinc-300 my-1" />

              <div className="flex flex-col gap-1">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.qty}x {item.name}</span>
                    <span>${(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-zinc-300 my-1" />

              <div className="flex justify-between font-bold text-sm">
                <span>Total Paid ({selectedOrder.paymentMethod})</span>
                <span className="text-[#026F4F]">${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                alert(`Receipt for ${selectedOrder.orderNumber} sent to printer!`);
                setShowReceiptModal(false);
              }}
              className="w-full h-10 bg-[#026F4F] hover:bg-[#015c42] text-white rounded-xl font-medium text-xs flex items-center justify-center gap-2"
            >
              <Printer size={16} />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
