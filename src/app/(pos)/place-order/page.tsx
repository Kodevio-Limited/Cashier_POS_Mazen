'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Minus, Trash2, Tag, Check, CreditCard, Banknote, PauseCircle, Split, GitMerge, Phone, User, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { loadDraft, saveDraft, clearDraft } from '@/lib/order-draft';
import { loadSession, clearSession, sessionLabel, type OrderSession } from '@/lib/order-session';
import {
  CollectPaymentModal,
  SplitBillModal,
  MergeOrdersModal,
  ConfirmMergeModal,
} from '@/components/pos/PaymentModals';

interface OrderLineItem {
  id: string;
  /** Unique cart-line id — several lines can share the same menu `id`. */
  lineId: string;
  name: string;
  price: number;
  qty: number;
  emoji?: string;
  modifiers?: string[];
  texture?: string;
  instructions?: string;
}

const INITIAL_ITEMS: OrderLineItem[] = [
  { id: '1', lineId: 'demo-1', name: 'Shoyu Ramen', price: 15.99, qty: 2, emoji: '🍜', modifiers: ['Mayo', 'Extra Chili'] },
  { id: '2', lineId: 'demo-2', name: 'Classic Burger', price: 15.99, qty: 1, emoji: '🍔' },
  { id: '3', lineId: 'demo-3', name: 'Coca-Cola', price: 2.99, qty: 2, emoji: '🥤' },
];

export default function PlaceOrderPage() {
  const router = useRouter();
  // Prefer the live cart drafted on the Menu (/order) page; fall back to demo
  // items only on a direct visit with no draft. Edits here are saved back so
  // the "<-" back-arrow returns to the Menu with the same items.
  const [items, setItems] = useState<OrderLineItem[]>(() => loadDraft() ?? INITIAL_ITEMS);
  const [session, setSession] = useState<OrderSession | null>(null);

  useEffect(() => {
    saveDraft(items);
  }, [items]);

  useEffect(() => {
    setSession(loadSession());
  }, []);

  const orderNumber = session?.orderNumber ?? 'ORD-1025';

  // Customer details
  const [phone, setPhone] = useState('+1 (555) 234-5678');
  const [name, setName] = useState('Sarah Jessie');
  const [email, setEmail] = useState('sarah.jessie@example.com');
  const [notes, setNotes] = useState('');

  // Checkout options
  const [promo, setPromo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card'>('Card');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showConfirmMergeModal, setShowConfirmMergeModal] = useState(false);
  const [selectedMergeOrders, setSelectedMergeOrders] = useState<string[]>(['ro1', 'ro2']);

  // Operate on the unique cart-line id, NOT the menu item id: two lines can be
  // the same dish with different customizations (e.g. Classic Burger plain and
  // with extra mayo) and must be editable independently.
  function incQty(lineId: string) {
    setItems((prev) => prev.map((item) => (item.lineId === lineId ? { ...item, qty: item.qty + 1 } : item)));
  }

  function decQty(lineId: string) {
    // Minimum quantity is 1 — items can only be removed via the delete button.
    setItems((prev) =>
      prev.map((item) => (item.lineId === lineId ? { ...item, qty: Math.max(1, item.qty - 1) } : item)),
    );
  }

  function removeItem(lineId: string) {
    setItems((prev) => prev.filter((item) => item.lineId !== lineId));
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const promoApplied = promo.trim().length > 0;
  const discount = promoApplied ? subtotal * 0.1 : 0;
  const serviceCharge = (subtotal - discount) * 0.1; // 10%
  const total = subtotal - discount + serviceCharge;

  return (
    <div className="flex h-[calc(100vh-38px)] gap-3">
      {/* ── Main Content Area: Order Line Items ─────────────────── */}
      <div className="flex flex-1 flex-col min-w-0 bg-white rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.05)] p-5">
        {/* Top bar: Order ID */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F2F2F2]">
          <div className="flex items-center gap-3">
            <Link
              href="/order"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F2F2F2] text-[#2D2F33] hover:bg-[#E9E9E9] transition-colors"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-[20px] text-[#2D2F33]">Order #{orderNumber}</h1>
                {session && (
                  <span className="rounded-full bg-[#026F4F] px-2.5 py-0.5 text-[11px] font-medium text-white">
                    {sessionLabel(session)}
                  </span>
                )}
              </div>
              <p className="text-[13px] text-[#686868]">Review items and customer details</p>
            </div>
          </div>
        </div>

        {/* Current Details Header */}
        <div className="pt-4 pb-2 flex justify-between items-center">
          <h2 className="font-medium text-[15px] text-[#2D2F33]">Current Details</h2>
          <span className="text-xs text-[#989898]">{items.length} items</span>
        </div>

        {/* Items Table */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-[#F2F2F2] rounded-lg text-xs font-medium text-[#686868] mb-3">
            <div className="col-span-6">Dish</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-2 text-center">Quantity</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Table Rows */}
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-[#989898] text-sm">
              <p>No items in this check.</p>
              <Link href="/order" className="mt-2 text-[#026F4F] font-medium hover:underline">
                + Add items from menu
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {items.map((item) => (
                <div
                  key={item.lineId}
                  className="grid grid-cols-12 gap-3 items-center px-4 py-3 bg-white border border-[#E9E9E9] rounded-xl hover:border-[#026F4F]/40 transition-all"
                >
                  {/* Dish */}
                  <div className="col-span-6 flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#F2F2F2] rounded-lg text-2xl">
                      {item.emoji ?? '🍜'}
                    </div>
                    <div>
                      <p className="font-medium text-[14px] text-[#2D2F33]">{item.name}</p>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <p className="text-xs text-[#989898] mt-0.5">
                          + {item.modifiers.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="col-span-2 text-right font-semibold text-[14px] text-[#026F4F]">
                    ${(item.price * item.qty).toFixed(2)}
                  </div>

                  {/* Quantity */}
                  <div className="col-span-2 flex items-center justify-center gap-2">
                    <button
                      onClick={() => decQty(item.lineId)}
                      disabled={item.qty <= 1}
                      title={item.qty <= 1 ? 'Minimum quantity is 1' : 'Decrease quantity'}
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
                        item.qty <= 1
                          ? 'cursor-not-allowed bg-zinc-100 text-zinc-300'
                          : 'bg-emerald-100 text-[#026F4F] hover:bg-emerald-200',
                      )}
                    >
                      <Minus size={13} strokeWidth={2.4} />
                    </button>
                    <span className="w-5 text-center font-medium text-sm text-[#2D2F33]">{item.qty}</span>
                    <button
                      onClick={() => incQty(item.lineId)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-[#026F4F] text-white hover:bg-[#015c42] transition-colors"
                    >
                      <Plus size={13} strokeWidth={2.4} />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 text-right">
                    <button
                      onClick={() => removeItem(item.lineId)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add More Items button */}
        <div className="pt-3 border-t border-[#F2F2F2] flex justify-end">
          <Link
            href="/order"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium text-[#026F4F] bg-emerald-50 hover:bg-emerald-100 transition-colors"
          >
            <Plus size={15} />
            <span>Add More Items</span>
          </Link>
        </div>
      </div>

      {/* ── Right Panel: Customer Details & Checkout (Figma Node 1127:353) ── */}
      <div className="w-[343px] shrink-0 flex flex-col bg-white rounded-xl overflow-hidden shadow-[0_1px_6px_rgba(0,0,0,0.08)]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[rgba(185,185,185,0.37)] flex justify-between items-center">
          <h2 className="font-medium text-[19px] text-[#2D2F33]">Customer Details</h2>
          <button
            onClick={() => {
              setPhone('');
              setName('');
              setEmail('');
              setNotes('');
            }}
            className="w-9 h-9 rounded-lg bg-red-400 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
            title="Clear customer fields"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3.5">
          {/* Phone */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#686868] flex items-center gap-1">
              <Phone size={12} />
              <span>Phone Number (Optional)</span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full h-10 bg-[#E9E9E9] rounded-full px-4 text-xs text-[#2D2F33] outline-none focus:ring-1 focus:ring-[#026F4F]"
            />
          </div>

          {/* Full Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#686868] flex items-center gap-1">
              <User size={12} />
              <span>Full Name (Optional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Customer Name"
              className="w-full h-10 bg-[#E9E9E9] rounded-full px-4 text-xs text-[#2D2F33] outline-none focus:ring-1 focus:ring-[#026F4F]"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#686868]">Send Receipt to Email (Optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@email.com"
              className="w-full h-10 bg-[#E9E9E9] rounded-full px-4 text-xs text-[#2D2F33] outline-none focus:ring-1 focus:ring-[#026F4F]"
            />
          </div>

          {/* Promo code input (no apply button) */}
          <div className="border border-[#B9B9B9] rounded-xl p-1 flex items-center gap-2 bg-white mt-1">
            <Tag size={16} className="text-[#989898] ml-3 shrink-0" />
            <input
              type="text"
              value={promo}
              onChange={(e) => setPromo(e.target.value.toUpperCase())}
              placeholder="ENTER PROMO CODE"
              className="flex-1 bg-transparent text-xs uppercase font-medium text-[#2D2F33] placeholder:text-[#B9B9B9] outline-none"
            />
          </div>

          {/* Payment Method Switcher */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-[#2D2F33]">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('Cash')}
                className={cn(
                  'flex items-center justify-center gap-2 h-10 rounded-lg text-xs font-medium border transition-all',
                  paymentMethod === 'Cash'
                    ? 'border-[#026F4F] bg-emerald-50 text-[#026F4F]'
                    : 'border-[#E9E9E9] bg-white text-[#686868] hover:border-[#B9B9B9]',
                )}
              >
                <Banknote size={16} />
                <span>Cash</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('Card')}
                className={cn(
                  'flex items-center justify-center gap-2 h-10 rounded-lg text-xs font-medium border transition-all',
                  paymentMethod === 'Card'
                    ? 'border-[#026F4F] bg-emerald-50 text-[#026F4F]'
                    : 'border-[#E9E9E9] bg-white text-[#686868] hover:border-[#B9B9B9]',
                )}
              >
                <CreditCard size={16} />
                <span>Card</span>
              </button>
            </div>
          </div>

          {/* Payment Details Box */}
          <div className="bg-[#F2F2F2] rounded-lg p-3 flex flex-col gap-2">
            <p className="font-medium text-[14px] text-[#2D2F33]">Payments Details</p>
            <div className="flex justify-between text-xs text-[#686868]">
              <span>Subtotal ({items.reduce((s, i) => s + i.qty, 0)} items)</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-xs text-emerald-700">
                <span>Promo Discount (10%)</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-[#686868]">
              <span>Service Charge (10%)</span>
              <span>${serviceCharge.toFixed(2)}</span>
            </div>
            <div className="border-t border-dashed border-[#989898] my-0.5" />
            <div className="flex justify-between text-sm font-medium text-[#2D2F33]">
              <span>Total</span>
              <span className="font-semibold text-[#026F4F]">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 flex flex-col gap-2.5 border-t border-[#F2F2F2] bg-white">
          {/* Split Bill & Merge Bill */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => items.length > 0 && setShowSplitModal(true)}
              disabled={items.length === 0}
              className={cn(
                'flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-zinc-100 text-xs font-medium text-[#2D2F33] transition-colors hover:bg-zinc-200',
                items.length === 0 && 'cursor-not-allowed opacity-50 hover:bg-zinc-100',
              )}
            >
              <Split size={15} className="shrink-0" />
              <span>Split Bill</span>
            </button>
            <button
              type="button"
              onClick={() => items.length > 0 && setShowMergeModal(true)}
              disabled={items.length === 0}
              className={cn(
                'flex h-9 flex-1 items-center justify-center gap-1 rounded-md bg-zinc-100 text-xs font-medium text-[#2D2F33] transition-colors hover:bg-zinc-200',
                items.length === 0 && 'cursor-not-allowed opacity-50 hover:bg-zinc-100',
              )}
            >
              <GitMerge size={15} className="shrink-0" />
              <span>Merge Bill</span>
            </button>
          </div>

          {/* Keep Check Running */}
          <button
            onClick={() => router.push('/running-order')}
            className="w-full h-[46px] rounded-full border border-[#B9B9B9] bg-[#E9E9E9] hover:bg-[#E0E0E0] text-[#2D2F33] text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <PauseCircle size={18} className="text-[#686868]" />
            <span>Keep Check Running</span>
          </button>

          {/* Confirm & Pay */}
          <button
            onClick={() => {
              if (items.length === 0) return;
              // Card is charged automatically — place the order right away;
              // only Cash needs the Collect Payment modal to enter tendered amount.
              if (paymentMethod === 'Card') {
                setShowSuccessModal(true);
              } else {
                setShowPaymentModal(true);
              }
            }}
            disabled={items.length === 0}
            className={cn(
              'w-full h-[50px] rounded-full font-medium text-[16px] text-white transition-all shadow-[0_4px_16px_11px_rgba(0,0,0,0.12)] flex items-center justify-center gap-2',
              items.length > 0
                ? 'bg-[#026F4F] hover:bg-[#015c42] active:scale-95'
                : 'bg-[#B9B9B9] cursor-not-allowed shadow-none',
            )}
          >
            <Check size={20} />
            <span>Confirm & Pay</span>
          </button>
        </div>
      </div>

      {/* ── Collect Payment Modal ─────────────────────────────────── */}
      {showPaymentModal && (
        <CollectPaymentModal
          total={total}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={() => {
            setShowPaymentModal(false);
            setShowSuccessModal(true);
          }}
          onSplit={() => setShowSplitModal(true)}
          onMerge={() => setShowMergeModal(true)}
        />
      )}

      {/* ── Split Bill Modal ───────────────────────────────────────── */}
      {showSplitModal && (
        <SplitBillModal items={items} total={total} onClose={() => setShowSplitModal(false)} />
      )}

      {/* ── Merge Orders Modal ─────────────────────────────────────── */}
      {showMergeModal && (
        <MergeOrdersModal
          onClose={() => setShowMergeModal(false)}
          onProceedToConfirm={() => {
            setShowMergeModal(false);
            setShowConfirmMergeModal(true);
          }}
          selectedOrders={selectedMergeOrders}
          currentOrder={{ id: 'current', label: orderNumber, total, itemsCount: items.length }}
          onToggleSelect={(id) => {
            setSelectedMergeOrders((prev) =>
              prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
            );
          }}
        />
      )}

      {/* ── Confirm Merge Modal ────────────────────────────────────── */}
      {showConfirmMergeModal && (
        <ConfirmMergeModal
          ordersCount={selectedMergeOrders.length}
          combinedTotal={selectedMergeOrders.reduce((sum, id) => {
            const totals: Record<string, number> = { ro1: 45.99, ro2: 32.5, ro3: 54, ro4: 18.99 };
            return sum + (totals[id] ?? 0);
          }, 0)}
          onClose={() => setShowConfirmMergeModal(false)}
          onConfirm={() => {
            setShowConfirmMergeModal(false);
            setShowMergeModal(false);
          }}
        />
      )}

      {/* ── Success Modal ────────────────────────────────────────── */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="w-[450px] bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-[#026F4F]">
              <Check size={36} strokeWidth={3} />
            </div>

            <h3 className="font-semibold text-2xl text-[#2D2F33]">Order Placed & Paid!</h3>
            <p className="text-sm text-[#686868]">
              Order <span className="font-medium text-[#2D2F33]">#{orderNumber}</span> has been confirmed and dispatched to kitchen.
            </p>

            <div className="w-full bg-[#F2F2F2] rounded-xl p-4 flex justify-between text-sm text-[#2D2F33] my-2">
              <span>Total Paid ({paymentMethod}):</span>
              <span className="font-bold text-[#026F4F]">${total.toFixed(2)}</span>
            </div>

            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={() => {
                  window.print();
                  setShowSuccessModal(false);
                  clearDraft();
                  clearSession();
                  setItems([]);
                  router.push('/floor-plan');
                }}
                className="flex-1 h-12 rounded-full border border-[#B9B9B9] bg-white text-[#2D2F33] font-medium text-sm hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2"
              >
                <Printer size={16} />
                Print Receipt
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  clearDraft();
                  clearSession();
                  setItems([]);
                  router.push('/floor-plan');
                }}
                className="flex-1 h-12 rounded-full bg-[#026F4F] hover:bg-[#015c42] text-white font-medium text-sm transition-colors shadow-md"
              >
                New Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
