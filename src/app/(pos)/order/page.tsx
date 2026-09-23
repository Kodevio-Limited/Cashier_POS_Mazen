'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Minus, Plus, X, Trash2, Pencil, Scissors, Split, GitMerge, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  emoji: string;
  options?: string[];
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  texture?: string;
  modifiers?: string[];
  instructions?: string;
  emoji?: string;
}

interface ExistingOrder {
  id: string;
  orderNumber: string;
  table: string;
  itemsCount: number;
  total: number;
  type: 'Dine In' | 'Takeaway' | 'Delivery';
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const CATEGORIES = ['All', 'Burgers', 'Ramen', 'Sides', 'Drinks', 'Desserts'];

const MENU_ITEMS: MenuItem[] = [
  { id: 'm1', name: 'Classic Burger', category: 'Burgers', price: 15.99, emoji: '🍔' },
  { id: 'm2', name: 'Shoyu Ramen', category: 'Ramen', price: 15.99, emoji: '🍜', options: ['Firm (Kata)', 'Medium', 'Soft (Yawa)'] },
  { id: 'm3', name: 'Tonkotsu Ramen', category: 'Ramen', price: 18.99, emoji: '🍜', options: ['Firm (Kata)', 'Medium', 'Soft (Yawa)'] },
  { id: 'm4', name: 'Miso Ramen', category: 'Ramen', price: 16.99, emoji: '🍜', options: ['Firm (Kata)', 'Medium', 'Soft (Yawa)'] },
  { id: 'm5', name: 'Cheese Burger', category: 'Burgers', price: 17.99, emoji: '🍔' },
  { id: 'm6', name: 'BBQ Bacon Burger', category: 'Burgers', price: 19.99, emoji: '🍔' },
  { id: 'm7', name: 'Veggie Burger', category: 'Burgers', price: 14.99, emoji: '🥙' },
  { id: 'm8', name: 'Chicken Burger', category: 'Burgers', price: 16.49, emoji: '🍔' },
  { id: 'm9', name: 'French Fries', category: 'Sides', price: 4.99, emoji: '🍟' },
  { id: 'm10', name: 'Onion Rings', category: 'Sides', price: 5.49, emoji: '🧅' },
  { id: 'm11', name: 'Coca-Cola', category: 'Drinks', price: 2.99, emoji: '🥤' },
  { id: 'm12', name: 'Lemonade', category: 'Drinks', price: 3.49, emoji: '🍋' },
];

const SAMPLE_RUNNING_ORDERS: ExistingOrder[] = [
  { id: 'ro1', orderNumber: 'ORD-123', table: 'Table 07', itemsCount: 3, total: 45.99, type: 'Dine In' },
  { id: 'ro2', orderNumber: 'ORD-124', table: 'Table 04', itemsCount: 2, total: 32.50, type: 'Dine In' },
  { id: 'ro3', orderNumber: 'ORD-125', table: 'Takeaway #12', itemsCount: 4, total: 54.00, type: 'Takeaway' },
  { id: 'ro4', orderNumber: 'ORD-126', table: 'Delivery #05', itemsCount: 1, total: 18.99, type: 'Delivery' },
];

// ─── Menu Item Card ───────────────────────────────────────────────────────────
function ProductCard({ item, onSelect }: { item: MenuItem; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="w-full h-56 relative bg-white rounded-2xl outline outline-1 outline-offset-[-1px] outline-zinc-200/80 hover:outline-emerald-700/60 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:scale-95 text-left p-[7px] flex flex-col"
    >
      <div className="w-full h-28 bg-zinc-100 rounded-lg overflow-hidden flex items-center justify-center text-5xl shrink-0">
        {item.emoji}
      </div>
      <div className="w-full mt-2 flex flex-col justify-start items-start gap-1">
        <div className="w-full text-zinc-800 text-base font-medium font-['Inter'] leading-5 truncate">
          {item.name}
        </div>
        <div className="w-full text-neutral-400 text-xs font-normal font-['Inter'] leading-4 uppercase tracking-wider">
          {item.category}
        </div>
        <div className="w-full text-emerald-700 text-base font-medium font-['Inter'] leading-5">
          ${item.price.toFixed(2)}
        </div>
      </div>
    </button>
  );
}

// ─── Main Order Page ───────────────────────────────────────────────────────────
export default function OrderPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | 'delivery'>('dine-in');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showConfirmMergeModal, setShowConfirmMergeModal] = useState(false);
  const [selectedMergeOrders, setSelectedMergeOrders] = useState<string[]>(['ro1', 'ro2']);
  const [customizingItem, setCustomizingItem] = useState<{ item: MenuItem | OrderItem; isEditingIndex?: number } | null>(null);

  // Filter menu items
  const filtered = MENU_ITEMS.filter((item) => {
    const matchCat = activeCategory === 'All' || item.category === activeCategory;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Every product click opens the customize modal (Figma 961:2999) —
  // the same modal whether the item is new or already in the order.
  function handleProductClick(item: MenuItem) {
    setCustomizingItem({ item });
  }

  // Order actions
  function incQty(index: number) {
    setOrderItems((prev) => prev.map((o, i) => (i === index ? { ...o, qty: o.qty + 1 } : o)));
  }

  function decQty(index: number) {
    setOrderItems((prev) => {
      const item = prev[index];
      if (!item) return prev;
      if (item.qty === 1) return prev.filter((_, i) => i !== index);
      return prev.map((o, i) => (i === index ? { ...o, qty: o.qty - 1 } : o));
    });
  }

  function removeItem(index: number) {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  }

  function clearOrder() {
    setOrderItems([]);
  }

  // Calculations
  const subtotal = orderItems.reduce((sum, o) => sum + o.price * o.qty, 0);
  const serviceCharge = subtotal * 0.10; // 10% Service Charge
  const total = subtotal + serviceCharge;
  const itemCount = orderItems.reduce((s, o) => s + o.qty, 0);

  const isCartOpen = orderItems.length > 0;

  return (
    <div className="flex h-[calc(100vh-24px)] gap-3 transition-all duration-300">
      {/* ── Center: Menu Section ─────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0 bg-white rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between px-5 pt-4 pb-3 border-b border-[#F2F2F2] gap-3">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[19px] text-[#2D2F33]">Menu</span>
            <span className="text-[13px] text-[#989898]">({MENU_ITEMS.length} items)</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 bg-[#F2F2F2] rounded-full px-4 h-9">
              <Search size={14} className="text-[#989898]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu..."
                className="bg-transparent outline-none text-[13px] text-[#2D2F33] placeholder:text-[#989898] w-36"
              />
            </div>

            {/* Order type switcher */}
            <div className="hidden sm:flex gap-1 bg-[#F2F2F2] rounded-full p-0.5">
              {(['dine-in', 'takeaway', 'delivery'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setOrderType(t)}
                  className={cn(
                    'px-3 h-8 rounded-full text-[12px] font-medium capitalize transition-all',
                    orderType === t
                      ? 'bg-white text-[#2D2F33] shadow-xs'
                      : 'text-[#989898] hover:text-[#2D2F33]',
                  )}
                >
                  {t === 'dine-in' ? 'Dine-in' : t === 'takeaway' ? 'Takeaway' : 'Delivery'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-2 px-5 py-3 overflow-x-auto border-b border-[#F2F2F2]">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'flex-shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200',
                activeCategory === cat
                  ? 'bg-[#026F4F] text-white shadow-xs'
                  : 'bg-white border border-[#E9E9E9] text-[#686868] hover:border-[#026F4F] hover:text-[#026F4F]',
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu grid - Exactly 5 items per row */}
        <div className="flex-1 overflow-y-auto p-5">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-[#989898] text-[14px]">
              No items found.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  onSelect={() => handleProductClick(item)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right Panel: Current Order (Side Modal - Only appears when an item is selected) ── */}
      {isCartOpen && (
        <div className="w-full md:w-80 h-full shrink-0 flex flex-col justify-between bg-white rounded-lg overflow-hidden shadow-[0_1px_6px_rgba(0,0,0,0.08)] relative animate-in fade-in slide-in-from-right-4 duration-300 max-md:absolute max-md:inset-y-3 max-md:right-3 max-md:z-40 max-md:w-[calc(100%-104px-24px)]">
          {/* Header */}
          <div className="px-3 pt-3 pb-2.5 flex justify-between items-center border-b border-zinc-400/40">
            <div className="flex items-center gap-1.5">
              <span className="text-black text-lg font-medium font-['Inter'] leading-7">Current Order</span>
              <span className="text-neutral-400 text-xs font-normal font-['Inter'] leading-5">({itemCount})</span>
            </div>
            <button
              onClick={clearOrder}
              title="Clear order"
              className="size-10 bg-red-400 hover:bg-red-500 rounded-lg flex items-center justify-center text-white transition-colors"
            >
              <Trash2 size={18} strokeWidth={2} />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-4 divide-y divide-zinc-400/30">
            {orderItems.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="w-full flex items-start gap-2.5 pt-3.5 first:pt-0">
                {/* Thumbnail */}
                <div className="size-20 shrink-0 bg-zinc-100 rounded-md overflow-hidden flex items-center justify-center text-4xl">
                  {item.emoji ?? '🍜'}
                </div>

                {/* Details */}
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      title={item.name}
                      className="min-w-0 flex-1 break-words text-zinc-800 text-base font-medium font-['Inter'] leading-5 line-clamp-2"
                    >
                      {item.name}
                    </p>
                    <p className="shrink-0 text-emerald-700 text-lg font-semibold font-['Inter'] leading-6">
                      ${(item.price * item.qty).toFixed(2)}
                    </p>
                  </div>

                  {/* Custom field (e.g. noodle texture) */}
                  {item.texture && (
                    <p className="break-words text-neutral-500 text-xs font-normal font-['Inter'] leading-5">
                      {item.texture}
                    </p>
                  )}

                  {/* Modifiers (+ Mayo, + Extra Chili) */}
                  {item.modifiers && item.modifiers.length > 0 && (
                    <div className="flex flex-wrap items-start gap-x-1.5 gap-y-0.5">
                      {item.modifiers.map((mod, mi) => (
                        <span key={mi} className="break-words">
                          <span className="text-green-500 text-sm font-normal font-['Inter'] leading-5">+</span>
                          <span className="text-neutral-400 text-xs font-normal font-['Inter'] leading-5 ml-0.5">{mod}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Special instructions */}
                  {item.instructions && (
                    <div className="flex items-start gap-[3px]">
                      <Scissors size={14} className="mt-0.5 text-emerald-700 shrink-0" />
                      <p
                        title={item.instructions}
                        className="min-w-0 flex-1 break-words text-emerald-700 text-xs font-normal font-['Inter'] leading-5 line-clamp-3"
                      >
                        {item.instructions}
                      </p>
                    </div>
                  )}

                  {/* Actions & Qty Row */}
                  <div className="flex justify-between items-center pt-1">
                    {/* Left: Edit Icon and Delete Icon */}
                    <div className="w-16 flex justify-start items-center gap-3">
                      <button
                        onClick={() => setCustomizingItem({ item, isEditingIndex: idx })}
                        title="Edit Item"
                        className="size-6 relative flex items-center justify-center text-neutral-400 hover:text-zinc-800 transition-colors"
                      >
                        <Pencil size={18} strokeWidth={1.8} />
                      </button>
                      <button
                        onClick={() => removeItem(idx)}
                        title="Delete Item"
                        className="size-6 relative flex items-center justify-center text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={18} strokeWidth={1.8} />
                      </button>
                    </div>

                    {/* Right: Quantity controls */}
                    <div className="w-20 flex justify-end items-center gap-2">
                      <button
                        onClick={() => decQty(idx)}
                        className="size-7 bg-emerald-200 hover:bg-emerald-300 text-emerald-900 rounded-full flex items-center justify-center transition-colors"
                      >
                        <Minus size={14} strokeWidth={2.2} />
                      </button>
                      <div className="justify-start text-black text-base font-medium font-['Inter'] leading-5 min-w-3 text-center">
                        {item.qty}
                      </div>
                      <button
                        onClick={() => incQty(idx)}
                        className="size-7 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full flex items-center justify-center transition-colors shadow-xs"
                      >
                        <Plus size={14} strokeWidth={2.2} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Split Bill & Merge Bill Buttons (User Specification) ── */}
          <div className="px-3 pt-2 pb-1 border-t border-zinc-200 bg-white">
            <div className="self-stretch inline-flex justify-start items-center gap-2.5">
              {/* Split Bill */}
              <button
                onClick={() => alert('Split Bill options opened: Select items or split by head.')}
                className="w-40 h-9 relative bg-zinc-100 rounded-md outline outline-1 outline-offset-[-1px] outline-emerald-700 overflow-hidden hover:bg-emerald-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Split size={15} className="text-emerald-700 shrink-0" />
                <span className="text-emerald-700 text-xs font-medium font-['Inter'] leading-5">Split Bill</span>
              </button>

              {/* Merge Bill */}
              <button
                onClick={() => setShowMergeModal(true)}
                className="w-40 h-9 relative bg-zinc-100 rounded-md hover:bg-zinc-200 overflow-hidden transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <GitMerge size={15} className="text-neutral-400 shrink-0" />
                <span className="text-neutral-400 text-xs font-medium font-['Inter'] leading-5">Merge Bill</span>
              </button>
            </div>
          </div>

          {/* Payments Details Box & Place Order Button */}
          <div className="px-3 pb-3 pt-2 flex flex-col gap-3.5 bg-white">
            <div className="self-stretch relative bg-zinc-100 rounded-md p-2.5 flex flex-col gap-3">
              <div className="text-zinc-800 text-base font-medium font-['Inter'] leading-5">
                Payments Details
              </div>
              <div className="flex flex-col gap-2">
                <div className="self-stretch inline-flex justify-between items-center">
                  <div className="text-neutral-400 text-xs font-normal font-['Inter'] leading-5">
                    Subtotal ({itemCount} items)
                  </div>
                  <div className="text-stone-500 text-xs font-medium font-['Inter'] leading-5">
                    ${subtotal.toFixed(2)}
                  </div>
                </div>
                <div className="self-stretch inline-flex justify-between items-center">
                  <div className="text-neutral-400 text-xs font-normal font-['Inter'] leading-5">
                    Service Charge (10%)
                  </div>
                  <div className="text-stone-500 text-xs font-medium font-['Inter'] leading-5">
                    ${serviceCharge.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="w-full h-0 border-t border-dashed border-neutral-400" />
              <div className="self-stretch inline-flex justify-between items-center">
                <div className="text-black text-sm font-medium font-['Inter'] leading-5">Total</div>
                <div className="text-emerald-700 text-sm font-semibold font-['Inter'] leading-5">
                  ${total.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              onClick={() => router.push('/place-order')}
              className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 rounded-[30px] shadow-[0px_4px_16.3px_11px_rgba(0,0,0,0.12)] inline-flex justify-center items-center gap-5 text-white text-lg font-medium font-['Inter'] leading-7 transition-all active:scale-95"
            >
              Place Order
            </button>
          </div>
        </div>
      )}

      {/* ── Edit / Customize Item Modal ─────────────────────────────── */}
      {customizingItem && (
        <CustomizeItemModal
          data={customizingItem.item}
          onClose={() => setCustomizingItem(null)}
          onSave={(customized) => {
            if (customizingItem.isEditingIndex !== undefined) {
              setOrderItems((prev) =>
                prev.map((o, i) => (i === customizingItem.isEditingIndex ? customized : o)),
              );
            } else {
              // Merge into an identical line if one exists, else append a new line.
              setOrderItems((prev) => {
                const lineKey = (o: OrderItem) =>
                  [o.id, o.texture ?? '', [...(o.modifiers ?? [])].sort().join('|'), o.instructions ?? ''].join('~');
                const idx = prev.findIndex((o) => lineKey(o) === lineKey(customized));
                if (idx >= 0) {
                  return prev.map((o, i) => (i === idx ? { ...o, qty: o.qty + customized.qty } : o));
                }
                return [...prev, customized];
              });
            }
            setCustomizingItem(null);
          }}
        />
      )}

      {/* ── Collect Payment Modal (Figma 1730-290) ──────────────────── */}
      {showPaymentModal && (
        <CollectPaymentModal
          total={total}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={() => {
            clearOrder();
            setShowPaymentModal(false);
          }}
        />
      )}

      {/* ── Merge Orders Modal (Figma 1069-271) ──────────────────────── */}
      {showMergeModal && (
        <MergeOrdersModal
          onClose={() => setShowMergeModal(false)}
          onProceedToConfirm={() => {
            setShowMergeModal(false);
            setShowConfirmMergeModal(true);
          }}
          selectedOrders={selectedMergeOrders}
          onToggleSelect={(id) => {
            setSelectedMergeOrders((prev) =>
              prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
            );
          }}
        />
      )}

      {/* ── Confirm Merge Modal (Figma 1084-531) ────────────────────── */}
      {showConfirmMergeModal && (
        <ConfirmMergeModal
          ordersCount={selectedMergeOrders.length}
          combinedTotal={45.99}
          onClose={() => setShowConfirmMergeModal(false)}
          onConfirm={() => {
            setShowConfirmMergeModal(false);
            alert('Orders merged successfully!');
          }}
        />
      )}
    </div>
  );
}

// ─── Customize / Edit Item Modal (Figma 961:2999) ─────────────────────────────
function CustomizeItemModal({
  data,
  onClose,
  onSave,
}: {
  data: MenuItem | OrderItem;
  onClose: () => void;
  onSave: (item: OrderItem) => void;
}) {
  const optionList: string[] = 'options' in data && Array.isArray(data.options) ? data.options : [];
  const [texture, setTexture] = useState<string>(
    ('texture' in data && data.texture) ? data.texture : (optionList[0] ?? ''),
  );
  const [modifiers, setModifiers] = useState<string[]>(
    ('modifiers' in data && data.modifiers) ? data.modifiers : [],
  );
  const [instructions, setInstructions] = useState<string>(
    ('instructions' in data && data.instructions) ? (data.instructions ?? '') : '',
  );
  const [qty, setQty] = useState<number>(
    ('qty' in data && data.qty) ? data.qty : 1,
  );

  function toggleModifier(mod: string) {
    setModifiers((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod],
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-xs">
      <div className="my-auto w-[651px] max-w-full rounded-[17px] bg-white px-8 pb-8 pt-[26px] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-[23px] font-medium leading-[1.4] text-black">Current Order</h2>
          <button onClick={onClose} aria-label="Close" className="text-black transition-colors hover:text-zinc-500">
            <X size={24} strokeWidth={2} />
          </button>
        </div>

        <div className="mt-[25px] flex flex-col gap-6">
          {/* Item */}
          <div className="flex items-start gap-[13px]">
            <div className="flex size-[84px] shrink-0 items-center justify-center overflow-hidden rounded-[7px] bg-[#F2F2F2] text-[52px] leading-none">
              {data.emoji ?? '🍜'}
            </div>
            <div className="flex flex-col items-start gap-[15px] leading-[1.4]">
              <p className="text-[19px] font-medium text-[#2D2F33]">{data.name}</p>
              <p className="text-[17.5px] font-semibold text-[#026F4F]">${data.price.toFixed(2)}</p>
            </div>
          </div>

          {/* Options (e.g. Noodle Texture) — only when the item has options */}
          {optionList.length > 0 && (
            <div className="flex flex-col gap-[29px]">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[19px] font-semibold leading-[1.4] text-[#2D2F33]">Noodle Texture</p>
                <span className="flex w-[86px] shrink-0 items-center justify-center whitespace-nowrap rounded-[16px] bg-[#2D2F33] px-[10px] py-[3px] text-[13px] font-normal leading-[1.63] text-white">
                  Required
                </span>
              </div>
              <div className="flex flex-col gap-[21px]">
                {optionList.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setTexture(opt)}
                    className="flex w-full items-center justify-between gap-2 text-left"
                  >
                    <span className="text-[16px] font-normal leading-[1.4] text-[#2D2F33]">{opt}</span>
                    <span className="flex items-center gap-[13px]">
                      <span className="text-[13px] font-normal leading-[1.4] text-[#989898]">Free</span>
                      <span
                        className={cn(
                          'flex size-6 items-center justify-center rounded-full border-2 transition-all',
                          texture === opt ? 'border-[#026F4F]' : 'border-[#B9B9B9] bg-white',
                        )}
                      >
                        {texture === opt && <span className="size-2.5 rounded-full bg-[#026F4F]" />}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Extra add-ons */}
          <div className="flex flex-col gap-2.5">
            <p className="text-sm font-semibold text-[#2D2F33]">Extra Add-ons</p>
            <div className="flex flex-wrap gap-2">
              {['Mayo', 'Extra Chili', 'Boiled Egg', 'Bamboo Shoots'].map((mod) => {
                const isSelected = modifiers.includes(mod);
                return (
                  <button
                    key={mod}
                    type="button"
                    onClick={() => toggleModifier(mod)}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-xs font-medium transition-all',
                      isSelected
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200',
                    )}
                  >
                    + {mod}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Special instructions */}
          <div className="flex flex-col gap-[17px]">
            <p className="text-[19px] font-semibold leading-[1.4] text-[#2D2F33]">Special instructions</p>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Add note (e.g. no spicy, less salt)"
              rows={4}
              className="h-[105px] w-full resize-none rounded-[9px] border border-[#B9B9B9] bg-[#F2F2F2] p-[15px] pt-[11px] text-[13px] font-medium leading-[1.4] text-[#2D2F33] outline-none placeholder:text-[#B9B9B9] focus:border-[#026F4F]"
            />
          </div>

          {/* Stepper + Done */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex shrink-0 items-center gap-[13px]">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="flex size-10 items-center justify-center rounded-full bg-emerald-200 text-emerald-900 transition-colors hover:bg-emerald-300"
              >
                <Minus size={18} strokeWidth={2.4} />
              </button>
              <span className="min-w-5 text-center text-[23px] font-medium leading-[1.4] text-black">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                aria-label="Increase quantity"
                className="flex size-10 items-center justify-center rounded-full bg-emerald-700 text-white shadow-xs transition-colors hover:bg-emerald-800"
              >
                <Plus size={18} strokeWidth={2.4} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                onSave({
                  id: data.id,
                  name: data.name,
                  price: data.price,
                  qty,
                  texture: texture || undefined,
                  modifiers,
                  instructions: instructions || undefined,
                  emoji: data.emoji,
                });
              }}
              className="h-[55px] w-[438px] max-w-full shrink rounded-[30px] bg-[#026F4F] text-[19px] font-medium leading-[1.4] text-white shadow-[0px_4px_16.3px_11px_rgba(0,0,0,0.12)] transition-all hover:bg-[#015c42] active:scale-[0.99]"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Collect Payment Modal (Figma Node 1730:290 Exact Design) ─────────────────
function CollectPaymentModal({
  total,
  onClose,
  onConfirm,
}: {
  total: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [received, setReceived] = useState('50.00');
  const receivedNum = parseFloat(received) || 0;
  const change = Math.max(0, receivedNum - total);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-[650px] bg-white rounded-2xl p-6 md:p-8 shadow-2xl relative flex flex-col gap-6">
        {/* Title & Close */}
        <div className="flex justify-between items-center">
          <h2 className="text-[#2D2F33] text-xl md:text-2xl font-medium font-['Inter'] leading-8">Collect Payment</h2>
          <button onClick={onClose} className="text-[#989898] hover:text-[#2D2F33] transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Total Due Box */}
        <div className="w-full bg-[#F2F2F2] border border-[#B9B9B9] rounded-xl p-5 flex flex-col items-center justify-center gap-2">
          <span className="text-[#686868] text-xs font-medium font-['Inter'] uppercase tracking-wider">Total Due</span>
          <span className="text-[#2D2F33] text-[36px] font-semibold font-['Inter']">${total.toFixed(2)}</span>
        </div>

        {/* Amount Received Input */}
        <div className="flex flex-col gap-3">
          <label className="text-[#686868] text-base font-normal font-['Inter']">Amount Received ($)</label>
          <input
            type="number"
            value={received}
            onChange={(e) => setReceived(e.target.value)}
            placeholder="0.00"
            className="w-full h-[61px] bg-[#E9E9E9] rounded-lg px-4 text-[21px] font-medium text-[#2D2F33] outline-none focus:ring-2 focus:ring-[#026F4F]"
          />
        </div>

        {/* Change Due Row */}
        <div className="flex justify-between items-center">
          <span className="text-[#2D2F33] text-[21px] font-medium font-['Inter']">Change Due:</span>
          <span className="text-[#026F4F] text-[28px] font-semibold font-['Inter']">${change.toFixed(2)}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-[280px] h-[52px] rounded-[30px] border border-[#B9B9B9] bg-[#E9E9E9] hover:bg-[#E0E0E0] text-[#2D2F33] font-medium text-base transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-[280px] h-[52px] rounded-[30px] bg-[#026F4F] hover:bg-[#015c42] text-white font-medium text-base shadow-[0px_4px_16.3px_11px_rgba(0,0,0,0.12)] transition-all active:scale-95"
          >
            Complete Order
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Merge Orders Modal (Figma Node 1069:271) ──────────────────────────────────
function MergeOrdersModal({
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
      <div className="w-[343px] h-[770px] bg-white rounded-xl overflow-hidden shadow-2xl flex flex-col justify-between relative animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-white border-b border-zinc-200 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className="text-zinc-800 text-lg font-medium font-['Inter']">Merge Orders</h3>
            <button onClick={onClose} className="text-neutral-400 hover:text-zinc-800">
              <X size={20} />
            </button>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 bg-[#E9E9E9] rounded-full px-4 h-10">
            <Search size={16} className="text-[#989898]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order ID or Table Number..."
              className="bg-transparent outline-none text-xs text-[#2D2F33] placeholder:text-[#989898] w-full"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-1.5 overflow-x-auto">
            {(['All', 'Dine In', 'Takeaway', 'Delivery'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap',
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
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
          {filtered.map((order) => {
            const isSelected = selectedOrders.includes(order.id);
            return (
              <div
                key={order.id}
                onClick={() => onToggleSelect(order.id)}
                className={cn(
                  'p-3 rounded-lg border transition-all cursor-pointer flex flex-col gap-2',
                  isSelected
                    ? 'bg-[#E6F1ED] border-[#026F4F]'
                    : 'bg-white border-zinc-200 hover:border-zinc-300',
                )}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full border flex items-center justify-center transition-colors',
                        isSelected ? 'bg-[#026F4F] border-[#026F4F]' : 'border-zinc-400 bg-white',
                      )}
                    >
                      {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className="font-medium text-sm text-[#2D2F33]">{order.orderNumber}</span>
                  </div>
                  <span className="font-semibold text-sm text-[#026F4F]">${order.total.toFixed(2)}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#686868] pl-7">
                  <span className="bg-[#E9E9E9] px-2 py-0.5 rounded text-[11px]">{order.table}</span>
                  <span>•</span>
                  <span>{order.itemsCount} Items</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Bar */}
        <div className="p-3 bg-white border-t border-zinc-200 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-[#2D2F33]">Selected Orders ({selectedOrders.length})</span>
            <div className="text-right">
              <p className="text-[10px] text-[#989898]">Combined Total</p>
              <p className="font-semibold text-sm text-[#026F4F]">$45.99</p>
            </div>
          </div>

          <button
            onClick={onProceedToConfirm}
            disabled={selectedOrders.length < 2}
            className={cn(
              'w-full h-12 rounded-[30px] font-medium text-base text-white transition-all shadow-[0px_4px_16.3px_11px_rgba(0,0,0,0.12)]',
              selectedOrders.length >= 2
                ? 'bg-[#026F4F] hover:bg-[#015c42]'
                : 'bg-zinc-300 cursor-not-allowed shadow-none',
            )}
          >
            Merge {selectedOrders.length} Orders
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Merge Modal (Figma Node 1084:531) ──────────────────────────────────
function ConfirmMergeModal({
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-[553px] bg-white rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col items-center text-center gap-6 animate-in zoom-in-95 duration-200">
        {/* Graphic */}
        <div className="w-32 h-32 md:w-48 md:h-48 bg-[#E6F1ED] rounded-full flex items-center justify-center text-[#026F4F]">
          <GitMerge size={60} strokeWidth={1.8} className="md:hidden" />
          <GitMerge size={80} strokeWidth={1.8} className="hidden md:block" />
        </div>

        {/* Title */}
        <h3 className="font-bold text-[28px] text-[#2D2F33] leading-tight">Confirm Merge?</h3>

        {/* Subtitle */}
        <p className="text-sm text-[#989898] max-w-md">
          You are about to merge <span className="font-semibold text-[#1E1E1E]">{ordersCount} orders</span> into one bill. This action cannot be undone.
        </p>

        {/* Combined Total Box */}
        <div className="w-full bg-[#F2F2F2] rounded-lg p-5 flex flex-col items-center justify-center gap-1">
          <span className="text-[#989898] text-sm font-medium">New Combined Total</span>
          <span className="text-[#026F4F] text-[37px] font-semibold">${combinedTotal.toFixed(2)}</span>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 w-full pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-[241px] h-[52px] rounded-[30px] border border-[#B9B9B9] bg-[#E9E9E9] hover:bg-[#E0E0E0] text-[#2D2F33] font-medium text-base transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-[241px] h-[52px] rounded-[30px] bg-[#026F4F] hover:bg-[#015c42] text-white font-medium text-base shadow-[0px_4px_16.3px_11px_rgba(0,0,0,0.12)] transition-all active:scale-95"
          >
            Confirm Merge
          </button>
        </div>
      </div>
    </div>
  );
}
