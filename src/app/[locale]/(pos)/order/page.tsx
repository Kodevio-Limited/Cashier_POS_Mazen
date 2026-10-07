'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { Search, Minus, Plus, X, Trash2, Scissors, MapPin, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { loadDraft, saveDraft, newLineId, clearDraft, modifierTotal, lineTotal, MODIFIER_PRICES } from '@/lib/order-draft';
import { locStr } from '@/lib/locale-fields';
import { foodImage, CATEGORY_IMAGE, FOOD_IMAGES } from '@/lib/menu-images';
import { loadSession, clearSession, sessionLabel, type OrderSession } from '@/lib/order-session';
import { DeliveryDetailsModal } from '@/components/pos/DeliveryDetailsModal';
import { useQueryModal, readQueryParam, writeQueryParam } from '@/lib/use-query-modal';
import {
  loadDeliveryDetails,
  saveDeliveryDetails,
  clearDeliveryDetails,
  isDeliveryDetailsComplete,
  saveCustomer,
  type DeliveryDetails,
} from '@/lib/delivery-details';
import {
  MENU_CATALOG,
  MENU_CATEGORIES,
  getMenuAvailability,
  getOrderableAddonNames,
  getOrderableOptionNames,
  isItemAvailable,
  subscribeMenuAvailability,
  type MenuAvailability,
} from '@/lib/menu-availability';

// ─── Types ────────────────────────────────────────────────────────────────────
interface MenuItem {
  id: string;
  name: string;
  /** Arabic twin of `name` for mock data (picked by active locale). */
  nameAr?: string;
  category: string;
  price: number;
  emoji: string;
  options?: string[];
}

interface OrderItem {
  id: string;
  /** Unique cart-line id — menu `id` is shared by lines that differ only in customization. */
  lineId: string;
  name: string;
  /** Arabic twin of `name` (carried with the cart line so it survives editing). */
  nameAr?: string;
  price: number;
  qty: number;
  texture?: string;
  /** Snapshot of the item's required options, saved with the line so the edit
      modal never depends on looking the menu definition back up. */
  options?: string[];
  modifiers?: string[];
  /** Snapshot of the add-on total at save time (Bug-58). */
  modTotal?: number;
  instructions?: string;
  emoji?: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────
// Single source of truth lives in @/lib/menu-availability (shared with the
// cashier Menu Management page, Bug-63). Unavailable items are hidden here
// so they also disappear from the customer-facing menu.
const CATEGORIES = MENU_CATEGORIES;
const MENU_ITEMS: MenuItem[] = MENU_CATALOG;

// Arabic twins for the required noodle-texture options.
const OPTION_AR: Record<string, string> = {
  'Firm (Kata)': 'قوام صلب (كاتا)',
  'Medium': 'متوسط',
  'Soft (Yawa)': 'قوام طري (ياوا)',
};

// Arabic twins for the optional add-on modifiers.
const MODIFIER_AR: Record<string, string> = {
  'Mayo': 'مايونيز',
  'Extra Chili': 'فلفل إضافي',
  'Boiled Egg': 'بيضة مسلوقة',
  'Bamboo Shoots': 'براعم الخيزران',
  'No Spice': 'بدون بهار',
  'Standard': 'عادي',
};

// ─── Menu Item Card ───────────────────────────────────────────────────────────
function ProductCard({ item, onSelect }: { item: MenuItem; onSelect: () => void }) {
  const t = useTranslations('order');
  const tCat = useTranslations('order.categories');
  const locale = useLocale();
  return (
    <button
      onClick={onSelect}
      className="relative flex h-[227px] w-full flex-col overflow-hidden rounded-[8px] bg-white p-[7px] text-left outline outline-1 outline-offset-[-1px] outline-[#E9E9E9] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:outline-emerald-700/60 active:scale-95"
    >
      <div className="h-[118px] w-full shrink-0 overflow-hidden rounded-[6px] bg-[#F2F2F2]">
        <img src={foodImage(item.emoji)} alt={locStr(item.name, item.nameAr, locale)} className="h-full w-full object-contain p-[12px]" />
      </div>
      <div className="mt-[9px] flex w-full min-w-0 flex-1 flex-col items-start gap-[3px] px-[6px]">
        <div className="w-full truncate text-[16px] font-medium leading-[1.3] text-[#2D2F33]">
          {locStr(item.name, item.nameAr, locale)}
        </div>
        <div className="w-full truncate text-[12px] font-normal uppercase leading-[1.3] tracking-wider text-[#989898]">
          {tCat(item.category.toLowerCase())}
        </div>
        <div className="w-full text-[16px] font-medium leading-[1.3] text-[#026F4F]">
          ${item.price.toFixed(2)}
        </div>
      </div>
    </button>
  );
}

// ─── Cart line identity ─────────────────────────────────────────────────────
// Two cart lines are the "same item" only when item id AND all customizations
// match. Add-ons and instructions are order-insensitive; texture/required
// option is a single choice. Used both when quick-adding and when saving the
// customize modal, so differently-customized copies of one item stay separate.
function orderLineKey(o: Pick<OrderItem, 'id' | 'texture' | 'modifiers' | 'instructions'>): string {
  return [
    o.id,
    o.texture ?? '',
    [...(o.modifiers ?? [])].sort().join('|'),
    o.instructions ?? '',
  ].join('~');
}

// ─── Main Order Page ───────────────────────────────────────────────────────────
export default function OrderPage() {
  const router = useRouter();
  const t = useTranslations('order');
  const tCat = useTranslations('order.categories');
  const td = useTranslations('order.delivery');
  const locale = useLocale();
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>(() => loadDraft() ?? []);
  const [session, setSession] = useState<OrderSession | null>(null);
  const [delivery, setDelivery] = useState<DeliveryDetails | null>(null);
  // Query-driven overlays: ?modal=delivery-details, ?modal=customize-item[&menuId=]
  const [deliveryOpen, setDeliveryOpen] = useQueryModal('delivery-details');
  const deliveryPrompted = useRef(false);
  const tSess = useTranslations('orderSession');
  const [customizeOpen, setCustomizeOpen] = useQueryModal('customize-item');
  const [panelOpen, setPanelOpen] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<{ item: MenuItem | OrderItem; isEditingIndex?: number } | null>(null);
  // Menu availability toggled by the cashier (Menu page, Bug-63) — shared via
  // localStorage so unavailable items vanish from this order grid too.
  const [availability, setAvailability] = useState<MenuAvailability>(() => getMenuAvailability());

  useEffect(() => {
    setAvailability(getMenuAvailability());
    return subscribeMenuAvailability(() => setAvailability(getMenuAvailability()));
  }, []);

  // Keep the draft in sync so /place-order (and the back-arrow there) sees the same cart.
  useEffect(() => {
    saveDraft(orderItems);
  }, [orderItems]);

  // Load the table / Take Out / Delivery selection made on the Floor Plan.
  useEffect(() => {
    setSession(loadSession());
    setDelivery(loadDeliveryDetails());
  }, []);

  const openDelivery = () => setDeliveryOpen(true);
  const closeDelivery = () => setDeliveryOpen(false);
  const openCustomize = (item: MenuItem | OrderItem, isEditingIndex?: number) => {
    setCustomizingItem({ item, isEditingIndex });
    writeQueryParam('menuId', 'id' in item ? item.id : null, false);
    setCustomizeOpen(true);
  };
  const closeCustomize = () => {
    setCustomizingItem(null);
    setCustomizeOpen(false);
    writeQueryParam('menuId', null, false);
  };

  // Cold load: ?modal=customize-item&menuId= opens the customizer for that dish.
  useEffect(() => {
    if (readQueryParam('modal') === 'customize-item') {
      const menuId = readQueryParam('menuId');
      const found = menuId ? MENU_ITEMS.find((m) => m.id === menuId) : undefined;
      if (found) setCustomizingItem({ item: found });
    }
  }, []);

  // Delivery orders need an address: prompt once when arriving with a delivery
  // session and no saved details yet.
  useEffect(() => {
    if (!session || session.type !== 'delivery' || deliveryPrompted.current) return;
    const saved = loadDeliveryDetails();
    if (!saved || !isDeliveryDetailsComplete(saved)) {
      deliveryPrompted.current = true;
      openDelivery();
    }
  }, [session]);

  // Filter menu items — unavailable items (toggled off in Menu Management)
  // are hidden from ordering and from the customer menu. Search matches both
  // English and Arabic names so filtering works in either language.
  const orderableItems = MENU_ITEMS.filter((item) => isItemAvailable(item.id, availability));
  const filtered = orderableItems.filter((item) => {
    const matchCat = activeCategory === 'All' || item.category === activeCategory;
    const q = search.trim().toLowerCase();
    const matchSearch =
      q === '' || `${item.name} ${item.nameAr ?? ''}`.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  // Clicking a product adds it straight to the Current Order, except items
  // with a Required selection (options) which open the customize modal first.
  // Every click adds a NEW line (even for the same menu item) so the cashier can
  // give each copy its own customization; identical configs are only merged by
  // the customize modal's explicit save.
  function handleProductClick(item: MenuItem) {
    if (item.options && item.options.length > 0) {
      openCustomize(item);
      return;
    }
    setOrderItems((prev) => [
      ...prev,
      {
        id: item.id,
        lineId: newLineId(),
        name: item.name,
        nameAr: item.nameAr,
        price: item.price,
        qty: 1,
        emoji: item.emoji,
      },
    ]);
  }

  // Order actions
  function incQty(index: number) {
    setOrderItems((prev) => prev.map((o, i) => (i === index ? { ...o, qty: o.qty + 1 } : o)));
  }

  // Minimum quantity is 1 — decrementing never deletes the line.
  // Explicit removal stays on the trash icon (removeItem).
  function decQty(index: number) {
    setOrderItems((prev) => prev.map((o, i) => (i === index ? { ...o, qty: Math.max(1, o.qty - 1) } : o)));
  }

  function removeItem(index: number) {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  }

  // Cancel the whole order: wipe the cart + table selection and return to the
  // Floor Plan, which is the first screen of the order flow.
  function cancelOrder() {
    clearDraft();
    clearSession();
    clearDeliveryDetails();
    setOrderItems([]);
    setDelivery(null);
    closeDelivery();
    router.push('/floor-plan');
  }

  // Calculations (add-on prices fold into each line total via lineTotal).
  const subtotal = orderItems.reduce((sum, o) => sum + lineTotal(o), 0);
  const serviceCharge = subtotal * 0.10; // 10% Service Charge
  const total = subtotal + serviceCharge;
  const itemCount = orderItems.reduce((s, o) => s + o.qty, 0);

  return (
    <div className="flex h-[calc(100vh-38px)] gap-[15px] transition-all duration-300">
      {/* ── Center: Menu Section (sits directly on the page background, Figma 617:4597) ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Title */}
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-[20px] font-medium leading-[1.4] text-[#2D2F33]">{t('title')}</span>
          <span className="text-[15px] leading-[1.4] text-[#989898]">
            {t('itemCount', { count: orderableItems.length })}
          </span>
        </div>

        {/* Category pills (left) + search (right) */}
        <div className="mt-[13px] flex flex-wrap items-center gap-x-[14px] gap-y-2">
          <div className="flex min-w-0 flex-1 items-center gap-[14px] overflow-x-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'flex h-[33px] shrink-0 items-center gap-[6px] rounded-full pe-[13px] ps-[5px] text-[13px] font-medium leading-[1.4] transition-all duration-200',
                  activeCategory === cat
                    ? 'bg-[#026F4F] text-white shadow-xs'
                    : 'bg-white text-[#686868] outline outline-1 outline-offset-[-1px] outline-[#E9E9E9] hover:text-[#026F4F] hover:outline-[#026F4F]',
                )}
              >
                <img src={CATEGORY_IMAGE[cat] ?? FOOD_IMAGES.nachos} alt="" className="h-[23px] w-[23px] shrink-0 rounded-full object-cover" />
                {tCat(cat.toLowerCase())}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex h-[33px] w-[254px] max-w-full shrink-0 items-center gap-2 rounded-full bg-[#F2F2F2] px-4">
            <Search size={14} className="shrink-0 text-[#989898]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full min-w-0 bg-transparent text-[13px] text-[#2D2F33] outline-none placeholder:text-[#989898]"
            />
          </div>
        </div>

        {/* Menu grid — 4 columns at the reference width (Figma card 182×227, gap 20/15) */}
        <div className="mt-[24px] flex-1 overflow-y-auto pb-4">
          {filtered.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-[14px] text-[#989898]">
              {t('noItemsFound')}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-[15px] sm:grid-cols-3 lg:grid-cols-4">
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

      {/* ── Right Panel: Current Order (Side Modal - Always visible) ── */}
      <div className={`w-full lg:w-[343px] h-full shrink-0 flex flex-col justify-between bg-white rounded-xl overflow-hidden shadow-[0_1px_6px_rgba(0,0,0,0.08)] relative max-lg:absolute max-lg:inset-y-3 max-lg:end-3 max-lg:z-40 max-lg:w-[calc(100%-104px-24px)] ${panelOpen ? '' : 'max-lg:hidden'}`}>
          {/* Header */}
          <div className="px-3 pt-3 pb-2.5 border-b border-[#E9E9E9]">
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <button
                  onClick={() => setPanelOpen(false)}
                  aria-label={t('currentOrder')}
                  className="lg:hidden -ms-1 me-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#2D2F33] transition-colors hover:bg-[#F2F2F2]"
                >
                  <X size={18} />
                </button>
                <span className="text-[19px] font-medium leading-[1.4] text-black">{t('currentOrder')}</span>
                <span className="text-[13px] font-normal leading-[1.4] text-neutral-400">({itemCount})</span>
              </div>
              <button
                onClick={cancelOrder}
                title={t('cancelOrder')}
                aria-label={t('cancelOrder')}
                className="flex h-[39px] w-[39px] shrink-0 items-center justify-center rounded-[8px] bg-[#E56767] text-white transition-colors hover:bg-[#d95454]"
              >
                <Trash2 size={20} strokeWidth={2} />
              </button>
            </div>

            {/* Order number + table / Take Out / Delivery — always visible */}
            {session && (
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-[#2D2F33] font-['Inter']">{session.orderNumber}</span>
                <span className="rounded-full bg-[#026F4F] px-2.5 py-0.5 text-[11px] font-medium text-white">
                  {sessionLabel(session, locale, {
                    takeOut: tSess('takeOut'),
                    delivery: tSess('delivery'),
                    dineIn: tSess('dineIn'),
                  })}
                </span>
                {session.type === 'delivery' && (
                  <button
                    onClick={() => openDelivery()}
                    className="inline-flex items-center gap-1 rounded-full bg-[#E6F1ED] px-2.5 py-0.5 text-[11px] font-medium text-[#026F4F] transition-colors hover:bg-[#D6E9E1]"
                  >
                    <MapPin size={12} />
                    <span className="max-w-[140px] truncate">
                      {delivery && isDeliveryDetailsComplete(delivery)
                        ? `${delivery.name} · ${delivery.phone}`
                        : td('addDetails')}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-4 divide-y divide-zinc-400/30">
            {orderItems.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-1 py-10 text-center">
                <p className="text-zinc-800 text-sm font-medium font-['Inter']">{t('noItemsYet')}</p>
                <p className="text-neutral-400 text-xs font-normal font-['Inter']">
                  {t('noItemsHint')}
                </p>
              </div>
            ) : (
              orderItems.map((item, idx) => (
              <div
                key={item.lineId}
                onClick={() => openCustomize(item, idx)}
                title={t('editItem')}
                className="w-full flex items-start gap-2.5 pt-3.5 first:pt-0 cursor-pointer"
              >
                {/* Thumbnail */}
                <div className="size-20 shrink-0 overflow-hidden rounded-md bg-zinc-100">
                  <img src={foodImage(item.emoji)} alt="" className="h-full w-full object-contain p-[10px]" />
                </div>

                {/* Details */}
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      title={locStr(item.name, item.nameAr, locale)}
                      className="min-w-0 flex-1 break-words text-zinc-800 text-base font-medium font-['Inter'] leading-5 line-clamp-2"
                    >
                      {locStr(item.name, item.nameAr, locale)}
                    </p>
                    <p className="shrink-0 text-emerald-700 text-lg font-semibold font-['Inter'] leading-6">
                      ${lineTotal(item).toFixed(2)}
                    </p>
                  </div>

                  {/* Custom field (e.g. noodle texture) */}
                  {item.texture && (
                    <p className="break-words text-neutral-500 text-xs font-normal font-['Inter'] leading-5">
                      {item.texture}
                    </p>
                  )}

                  {/* Modifiers (+ Mayo · $0.50, + Extra Chili · $0.75) */}
                  {item.modifiers && item.modifiers.length > 0 && (
                    <div className="flex flex-wrap items-start gap-x-1.5 gap-y-0.5">
                      {item.modifiers.map((mod, mi) => (
                        <span key={mi} className="break-words">
                          <span className="text-green-500 text-sm font-normal font-['Inter'] leading-5">+</span>
                          <span className="text-neutral-400 text-xs font-normal font-['Inter'] leading-5 ms-0.5">{mod}</span>
                          {(MODIFIER_PRICES[mod] ?? 0) > 0 && (
                            <span className="text-neutral-400 text-xs font-normal font-['Inter'] leading-5"> · <bdi dir="ltr">${MODIFIER_PRICES[mod].toFixed(2)}</bdi></span>
                          )}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          openCustomize(item, idx);
                        }}
                        title={t('editItemAria')}
                        className="size-6 relative flex items-center justify-center text-neutral-400 hover:text-zinc-800 transition-colors"
                      >
                        <Image src="/images/figma/pencil.svg" alt="" width={18} height={18} className="size-[18px]" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(idx);
                        }}
                        title={t('deleteItemAria')}
                        className="size-6 relative flex items-center justify-center text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={18} strokeWidth={1.8} />
                      </button>
                    </div>

                    {/* Right: Quantity controls */}
                    <div className="w-20 flex justify-end items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          decQty(idx);
                        }}
                        className="size-7 bg-emerald-200 hover:bg-emerald-300 text-emerald-900 rounded-full flex items-center justify-center transition-colors"
                      >
                        <Minus size={14} strokeWidth={2.2} />
                      </button>
                      <div className="justify-start text-black text-base font-medium font-['Inter'] leading-5 min-w-3 text-center">
                        {item.qty}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          incQty(idx);
                        }}
                        className="size-7 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full flex items-center justify-center transition-colors shadow-xs"
                      >
                        <Plus size={14} strokeWidth={2.2} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>

          {/* Session required (Bug-64): no table / take-out / delivery, no order */}
          {!session && (
            <div className="mx-3 flex flex-col gap-2 rounded-lg bg-[#FFF7ED] px-3 py-2.5 outline outline-1 outline-offset-[-1px] outline-[#FDBA74]">
              <p className="text-[12px] font-medium leading-5 text-[#9A3412]">
                {t('sessionRequired')}
              </p>
              <button
                onClick={() => router.push('/floor-plan')}
                className="h-9 rounded-full bg-[#026F4F] text-[13px] font-medium text-white transition-colors hover:bg-[#015c42]"
              >
                {t('goToFloorPlan')}
              </button>
            </div>
          )}

          {/* Payments Details Box & Place Order Button */}
          <div className="px-3 pb-3 pt-2 flex flex-col gap-3.5 bg-white">
            <div className="self-stretch relative bg-[#F2F2F2] rounded-[8px] p-[10px] flex flex-col gap-3">
              <div className="text-zinc-800 text-[15px] font-medium font-['Inter'] leading-[1.4]">
                {t('paymentsDetails')}
              </div>
              <div className="flex flex-col gap-2">
                <div className="self-stretch inline-flex justify-between items-center">
                  <div className="text-neutral-400 text-xs font-normal font-['Inter'] leading-5">
                    {t('subtotal', { count: itemCount })}
                  </div>
                  <div className="text-stone-500 text-xs font-medium font-['Inter'] leading-5">
                    ${subtotal.toFixed(2)}
                  </div>
                </div>
                <div className="self-stretch inline-flex justify-between items-center">
                  <div className="text-neutral-400 text-xs font-normal font-['Inter'] leading-5">
                    {t('serviceCharge')}
                  </div>
                  <div className="text-stone-500 text-xs font-medium font-['Inter'] leading-5">
                    ${serviceCharge.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="w-full h-0 border-t border-dashed border-neutral-400" />
              <div className="self-stretch inline-flex justify-between items-center">
                <div className="text-black text-sm font-medium font-['Inter'] leading-5">{t('total')}</div>
                <div className="text-emerald-700 text-sm font-semibold font-['Inter'] leading-5">
                  ${total.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Place Order Button (Bug-64: blocked until a table / take-out / delivery is picked) */}
            <button
              onClick={() => {
                if (!session) {
                  router.push('/floor-plan');
                  return;
                }
                if (orderItems.length > 0) router.push('/place-order');
              }}
              disabled={orderItems.length === 0}
              className={cn(
                'w-full h-[50px] rounded-[30px] inline-flex justify-center items-center gap-5 text-[19px] font-medium font-[\'Inter\'] leading-[1.4] text-white transition-all',
                orderItems.length > 0
                  ? 'bg-[#026F4F] hover:bg-[#015c42] active:scale-95'
                  : 'bg-[#B9B9B9] cursor-not-allowed shadow-none',
              )}
            >
              {t('placeOrder')}
            </button>
          </div>
        </div>

      {/* ── Floating current-order toggle (tablet / small screens) ─── */}
      <button
        onClick={() => setPanelOpen(true)}
        className={`lg:hidden fixed bottom-4 end-4 z-30 flex h-14 items-center gap-2 rounded-full bg-[#026F4F] px-5 text-white shadow-[0_6px_20px_rgba(0,0,0,0.25)] transition-colors hover:bg-[#015c42] ${panelOpen ? 'hidden' : ''}`}
      >
        <ShoppingCart size={20} />
        <span className="text-sm font-medium">{itemCount}</span>
      </button>

      {/* ── Delivery Details Modal (delivery sessions) ─────────────── */}
      {deliveryOpen && (
        <DeliveryDetailsModal
          initial={delivery}
          onClose={closeDelivery}
          onSave={(d) => {
            setDelivery(d);
            saveDeliveryDetails(d);
            saveCustomer(d);
            closeDelivery();
          }}
        />
      )}

      {/* ── Edit / Customize Item Modal ─────────────────────────────── */}
      {customizeOpen && customizingItem && (
        <CustomizeItemModal
          data={customizingItem.item}
          onClose={closeCustomize}
          onSave={(customized) => {
            if (customizingItem.isEditingIndex !== undefined) {
              // Replace the line's config, keeping its unique lineId.
              setOrderItems((prev) =>
                prev.map((o, i) =>
                  i === customizingItem.isEditingIndex ? { ...customized, lineId: o.lineId } : o,
                ),
              );
            } else {
              // Merge into an identical line if one exists, else append a new line.
              setOrderItems((prev) => {
                const idx = prev.findIndex((o) => orderLineKey(o) === orderLineKey(customized));
                if (idx >= 0) {
                  return prev.map((o, i) => (i === idx ? { ...o, qty: o.qty + customized.qty } : o));
                }
                return [...prev, { ...customized, lineId: newLineId() }];
              });
            }
            closeCustomize();
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
  const t = useTranslations('order');
  const tc = useTranslations('order.customize');
  const locale = useLocale();
  // Required options come from the cart line's own snapshot first (saved at
  // add time), falling back to the menu definition. Either way the Required
  // section shows both when adding AND when editing — never just the
  // optional add-ons alone. Unavailable customizations (toggled off in Menu
  // Management) are hidden here and from the customer menu.
  const [availability, setModalAvailability] = useState<MenuAvailability>(() => getMenuAvailability());
  useEffect(() => {
    setModalAvailability(getMenuAvailability());
    return subscribeMenuAvailability(() => setModalAvailability(getMenuAvailability()));
  }, []);
  const menuOptions: string[] = MENU_ITEMS.find((m) => m.id === data.id)?.options ?? [];
  const baseOptions: string[] =
    'options' in data && Array.isArray(data.options) && data.options.length > 0
      ? data.options
      : menuOptions;
  const optionList: string[] = getOrderableOptionNames(baseOptions, availability);
  const orderableAddons: string[] = getOrderableAddonNames(availability);
  const savedTexture = 'texture' in data && data.texture ? data.texture : '';
  const [texture, setTexture] = useState<string>(
    savedTexture && optionList.includes(savedTexture)
      ? savedTexture
      : (optionList[0] ?? ''),
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
    <div className="pos-overlay z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="pos-overlay__panel w-[651px] max-w-full rounded-[17px] bg-white px-8 pb-8 pt-[26px] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-[23px] font-medium leading-[1.4] text-black">{tc('title')}</h2>
          <button onClick={onClose} aria-label={tc('title')} className="text-black transition-colors hover:text-zinc-500">
            <X size={24} strokeWidth={2} />
          </button>
        </div>

        <div className="mt-[25px] flex flex-col gap-6">
          {/* Item */}
          <div className="flex items-start gap-[13px]">
            <div className="flex size-[84px] shrink-0 overflow-hidden rounded-[7px] bg-[#F2F2F2]">
              <img src={foodImage(data.emoji)} alt="" className="h-full w-full object-contain p-[10px]" />
            </div>
            <div className="flex flex-col items-start gap-[15px] leading-[1.4]">
              <p className="text-[19px] font-medium text-[#2D2F33]">{locStr(data.name, data.nameAr, locale)}</p>
              <p className="text-[17.5px] font-semibold text-[#026F4F]">${data.price.toFixed(2)}</p>
            </div>
          </div>

          {/* Options (e.g. Noodle Texture) — only when the item has options */}
          {optionList.length > 0 && (
            <div className="flex flex-col gap-[29px]">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[19px] font-semibold leading-[1.4] text-[#2D2F33]">{tc('noodleTexture')}</p>
                <span className="flex w-[86px] shrink-0 items-center justify-center whitespace-nowrap rounded-[16px] bg-[#2D2F33] px-[10px] py-[3px] text-[13px] font-normal leading-[1.63] text-white">
                  {tc('required')}
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
                    <span className="text-[16px] font-normal leading-[1.4] text-[#2D2F33]">{locale === 'ar' ? OPTION_AR[opt] ?? opt : opt}</span>
                    <span className="flex items-center gap-[13px]">
                      <span className="text-[13px] font-normal leading-[1.4] text-[#989898]">{tc('free')}</span>
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

          {/* Extra add-ons (priced — Bug-58; unavailable ones hidden) */}
          <div className="flex flex-col gap-2.5">
            <p className="text-sm font-semibold text-[#2D2F33]">{tc('extraAddons')}</p>
            <div className="flex flex-wrap gap-2">
              {orderableAddons.map((mod) => {
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
                    + {locale === 'ar' ? MODIFIER_AR[mod] ?? mod : mod} <bdi dir="ltr" className={cn(isSelected ? 'text-white/80' : 'text-[#989898]')}>${MODIFIER_PRICES[mod].toFixed(2)}</bdi>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Special instructions */}
          <div className="flex flex-col gap-[17px]">
            <p className="text-[19px] font-semibold leading-[1.4] text-[#2D2F33]">{tc('specialInstructions')}</p>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={tc('notePlaceholder')}
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
                aria-label={tc('decreaseQty')}
                className="flex size-10 items-center justify-center rounded-full bg-emerald-200 text-emerald-900 transition-colors hover:bg-emerald-300"
              >
                <Minus size={18} strokeWidth={2.4} />
              </button>
              <span className="min-w-5 text-center text-[23px] font-medium leading-[1.4] text-black">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                aria-label={tc('increaseQty')}
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
                  lineId: 'lineId' in data && data.lineId ? data.lineId : '',
                  name: data.name,
                  nameAr: data.nameAr,
                  price: data.price,
                  qty,
                  texture: texture || undefined,
                  options: optionList.length > 0 ? optionList : undefined,
                  modifiers,
                  modTotal: modifierTotal(modifiers),
                  instructions: instructions || undefined,
                  emoji: data.emoji,
                });
              }}
              className="h-[55px] w-[438px] max-w-full shrink rounded-[30px] bg-[#026F4F] text-[19px] font-medium leading-[1.4] text-white shadow-[0px_4px_16.3px_11px_rgba(0,0,0,0.12)] transition-all hover:bg-[#015c42] active:scale-[0.99]"
            >
              {tc('done')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
