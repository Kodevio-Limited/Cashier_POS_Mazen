'use client';

import { useEffect, useRef, useState } from 'react';
import { Link } from '@/i18n/routing';
import { useRouter } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, Plus, Minus, Trash2, Tag, Check, CreditCard, Banknote, PauseCircle, Split, GitMerge, Phone, User, Printer, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { loadDraft, saveDraft, clearDraft, lineTotal, MODIFIER_PRICES } from '@/lib/order-draft';
import { loadSession, clearSession, sessionLabel, type OrderSession } from '@/lib/order-session';
import {
  loadDeliveryDetails,
  saveDeliveryDetails,
  emptyDeliveryDetails,
  isDeliveryDetailsComplete,
  loadCustomerByPhone,
  saveCustomer,
  type DeliveryDetails,
} from '@/lib/delivery-details';
import { locStr, locTimeAgo } from '@/lib/locale-fields';
import { foodImage } from '@/lib/menu-images';
import { useQueryModal } from '@/lib/use-query-modal';
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
  /** Arabic twin of `name` (cart lines carry it through edits). */
  nameAr?: string;
  price: number;
  qty: number;
  emoji?: string;
  modifiers?: string[];
  modTotal?: number;
  texture?: string;
  instructions?: string;
}

const INITIAL_ITEMS: OrderLineItem[] = [
  { id: '1', lineId: 'demo-1', name: 'Shoyu Ramen', nameAr: 'رامن شويو', price: 15.99, qty: 2, emoji: '🍜', modifiers: ['Mayo', 'Extra Chili'] },
  { id: '2', lineId: 'demo-2', name: 'Classic Burger', nameAr: 'برجر كلاسيك', price: 15.99, qty: 1, emoji: '🍔' },
  { id: '3', lineId: 'demo-3', name: 'Coca-Cola', nameAr: 'كوكا كولا', price: 2.99, qty: 2, emoji: '🥤' },
];

export default function PlaceOrderPage() {
  const router = useRouter();
  const t = useTranslations('placeOrder');
  const td = useTranslations('order.delivery');
  const tSess = useTranslations('orderSession');
  const locale = useLocale();
  // Prefer the live cart drafted on the Menu (/order) page; fall back to demo
  // items only on a direct visit with no draft. Edits here are saved back so
  // the "<-" back-arrow returns to the Menu with the same items.
  const [items, setItems] = useState<OrderLineItem[]>(() => loadDraft() ?? INITIAL_ITEMS);
  const [session, setSession] = useState<OrderSession | null>(null);
  // Distinguishes "still loading" from "no table / take-out / delivery picked"
  // so the missing-session block (Bug-64) never flashes on a valid visit.
  const [sessionReady, setSessionReady] = useState(false);
  const to = useTranslations('order');

  useEffect(() => {
    saveDraft(items);
  }, [items]);

  useEffect(() => {
    setSession(loadSession());
    setSessionReady(true);
  }, []);

  // Bug-64: an order cannot be created without a table / take-out / delivery.
  const missingSession = sessionReady && !session;

  const orderNumber = session?.orderNumber ?? 'ORD-1025';

  // Customer details
  // Demo customer defaults are localized at first render via messages
  // (placeOrder.demo*) so the seeded form matches the active locale.
  // Delivery sessions prefill from the address captured on the Order tab.
  const [phone, setPhone] = useState(() => loadDeliveryDetails()?.phone || t('demoPhone'));
  const [name, setName] = useState(() => loadDeliveryDetails()?.name || t('demoName'));
  // Delivery address (delivery sessions only) — edited here in Customer
  // Details, shared with the Order tab through the same store.
  const [deliveryForm, setDeliveryForm] = useState<DeliveryDetails>(() => loadDeliveryDetails() ?? emptyDeliveryDetails());
  const setDeliveryField = (key: keyof DeliveryDetails) => (value: string) =>
    setDeliveryForm((prev) => {
      const next = { ...prev, [key]: value };
      saveDeliveryDetails(next);
      return next;
    });
  const applySavedAddress = (idx: number) => {
    const found = loadCustomerByPhone(deliveryForm.phone);
    const addr = found?.addresses[idx];
    if (!addr) return;
    setDeliveryForm((prev) => {
      const next = {
        ...prev,
        name: prev.name.trim() ? prev.name : found.name,
        addressLabel: addr.label,
        address: addr.address,
        street: addr.street,
        landmark: addr.landmark,
        floor: addr.floor,
        apartment: addr.apartment,
        instructions: addr.instructions ?? prev.instructions,
      };
      saveDeliveryDetails(next);
      return next;
    });
  };
  const handleDeliveryPhoneBlur = () => {
    const found = loadCustomerByPhone(deliveryForm.phone);
    if (!found) return;
    setDeliveryForm((prev) => {
      if (prev.name.trim() && prev.address.trim()) return prev;
      const first = found.addresses[0];
      const next = {
        ...prev,
        name: prev.name.trim() ? prev.name : found.name,
        secondaryPhone: prev.secondaryPhone?.trim() ? prev.secondaryPhone : (found.secondaryPhone ?? ''),
        addressLabel: first?.label ?? prev.addressLabel,
        address: prev.address.trim() ? prev.address : (first?.address ?? ''),
        street: prev.street.trim() ? prev.street : (first?.street ?? ''),
      };
      saveDeliveryDetails(next);
      return next;
    });
  };
  const deliveryOk = session?.type !== 'delivery' || isDeliveryDetailsComplete(deliveryForm);
  const [email, setEmail] = useState(() => t('demoEmail'));
  const [notes, setNotes] = useState('');

  // Checkout options
  const [promo, setPromo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card'>('Card');
  // Query-driven checkout overlays: ?modal=payment|split-bill|merge-orders|
  // confirm-merge|order-success. Back walks back through them.
  const [successOpen, setSuccessOpen] = useQueryModal('order-success');
  const successArmed = useRef(false);
  const [paymentOpen, setPaymentOpen] = useQueryModal('payment');
  const [splitOpen, setSplitOpen] = useQueryModal('split-bill');
  const [mergeOpen, setMergeOpen] = useQueryModal('merge-orders');
  const [confirmMergeOpen, setConfirmMergeOpen] = useQueryModal('confirm-merge');
  const confirmMergeArmed = useRef(false);
  const [selectedMergeOrders, setSelectedMergeOrders] = useState<string[]>(['ro1', 'ro2']);

  const openSuccess = () => {
    successArmed.current = true;
    setSuccessOpen(true);
  };
  const closeSuccess = () => {
    setSuccessOpen(false);
    successArmed.current = false;
  };
  const openConfirmMerge = () => {
    confirmMergeArmed.current = true;
    setConfirmMergeOpen(true);
  };
  const closeConfirmMerge = () => {
    setConfirmMergeOpen(false);
    confirmMergeArmed.current = false;
  };

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

  const subtotal = items.reduce((sum, i) => sum + lineTotal(i), 0);
  const promoApplied = promo.trim().length > 0;
  const discount = promoApplied ? subtotal * 0.1 : 0;
  const serviceCharge = (subtotal - discount) * 0.1; // 10%
  const total = subtotal - discount + serviceCharge;

  return (
    <div className="flex h-[calc(100vh-38px)] gap-[15px]">
      {/* ── Main Content Area: Order Line Items (on page background, Figma 1032:832) ── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar: Order ID */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/order"
              className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-white text-[#2D2F33] shadow-xs transition-colors hover:bg-[#F2F2F2]"
            >
              <ArrowLeft size={18} className="rtl:scale-x-[-1]" />
            </Link>
            <div>
              <h1 className="font-medium text-[20px] leading-[1.4] text-[#2D2F33]">{t('orderTitle', { number: orderNumber })}</h1>
              <p className="text-[13px] text-[#686868]">
                {session
                  ? [sessionLabel(session, locale, {
                      takeOut: tSess('takeOut'),
                      delivery: tSess('delivery'),
                      dineIn: tSess('dineIn'),
                    }), session.tableName].filter(Boolean).join(' • ')
                  : t('reviewSubtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Current Details Header */}
        <div className="pb-2 pt-5 flex justify-between items-center">
          <h2 className="font-medium text-[15px] text-[#2D2F33]">{t('currentDetails')}</h2>
        </div>

        {/* Missing session block (Bug-64): pick a table / take-out / delivery first */}
        {missingSession && (
          <div className="mb-3 flex flex-col gap-2 rounded-xl bg-[#FFF7ED] px-4 py-3 outline outline-1 outline-offset-[-1px] outline-[#FDBA74]">
            <p className="text-[13px] font-medium leading-5 text-[#9A3412]">
              {to('sessionRequired')}
            </p>
            <button
              onClick={() => router.push('/floor-plan')}
              className="h-10 rounded-full bg-[#026F4F] text-[13px] font-medium text-white transition-colors hover:bg-[#015c42]"
            >
              {to('goToFloorPlan')}
            </button>
          </div>
        )}

        {/* Items Table */}
        <div className="flex-1 overflow-y-auto pe-1">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-[#F2F2F2] rounded-lg text-xs font-medium text-[#686868] mb-3">
            <div className="col-span-6">{t('colDish')}</div>
            <div className="col-span-2 text-end">{t('colAmount')}</div>
            <div className="col-span-2 text-center">{t('colQuantity')}</div>
            <div className="col-span-2 text-end">{t('colActions')}</div>
          </div>

          {/* Table Rows */}
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-[#989898] text-sm">
              <p>{t('emptyCheck')}</p>
              <Link href="/order" className="mt-2 text-[#026F4F] font-medium hover:underline">
                {t('addFromMenu')}
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
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#F2F2F2]">
                      <img src={foodImage(item.emoji)} alt="" className="h-full w-full object-contain p-[6px]" />
                    </div>
                    <div>
                      <p className="font-medium text-[14px] text-[#2D2F33]">{locStr(item.name, item.nameAr, locale)}</p>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <p className="text-xs text-[#989898] mt-0.5">
                          + {item.modifiers.map((m) => `${m}${(MODIFIER_PRICES[m] ?? 0) > 0 ? ` · $${MODIFIER_PRICES[m].toFixed(2)}` : ''}`).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="col-span-2 text-right font-semibold text-[14px] text-[#026F4F]">
                    ${lineTotal(item).toFixed(2)}
                  </div>

                  {/* Quantity */}
                  <div className="col-span-2 flex items-center justify-center gap-2">
                    <button
                      onClick={() => decQty(item.lineId)}
                      disabled={item.qty <= 1}
                      title={item.qty <= 1 ? t('minQty') : t('decQty')}
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
                      title={t('removeItem')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add More Items */}
        <div className="flex justify-end pt-3">
          <Link
            href="/order"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#026F4F] transition-colors hover:underline"
          >
            <Plus size={15} />
            <span>{t('addMoreItems')}</span>
          </Link>
        </div>
      </div>

      {/* ── Right Panel: Customer Details & Checkout (Figma Node 1127:353) ── */}
      <div className="w-[343px] shrink-0 flex flex-col bg-white rounded-xl overflow-hidden shadow-[0_1px_6px_rgba(0,0,0,0.08)]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[rgba(185,185,185,0.37)] flex justify-between items-center">
          <h2 className="font-medium text-[19px] text-[#2D2F33]">{t('customerDetails')}</h2>
          <button
            onClick={() => {
              setPhone('');
              setName('');
              setEmail('');
              setNotes('');
              setDeliveryForm(emptyDeliveryDetails());
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E56767] text-white transition-colors hover:bg-[#d95454]"
            title={t('clearFields')}
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3.5">
          {session?.type === 'delivery' ? (
            <>
              {/* Name */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#686868] flex items-center gap-1">
                  <User size={12} />
                  <span>{td('name')} <span className="text-[#E85E5E]">*</span></span>
                </label>
                <input
                  type="text"
                  value={deliveryForm.name}
                  onChange={(e) => setDeliveryField('name')(e.target.value)}
                  placeholder={td('namePlaceholder')}
                  className="w-full h-10 bg-[#E9E9E9] rounded-full px-4 text-xs text-[#2D2F33] outline-none placeholder:text-[#B9B9B9] focus:ring-1 focus:ring-[#026F4F]"
                />
              </div>

              {/* Phone Number */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#686868] flex items-center gap-1">
                  <Phone size={12} />
                  <span>{td('phone')} <span className="text-[#E85E5E]">*</span></span>
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={deliveryForm.phone}
                  onChange={(e) => setDeliveryField('phone')(e.target.value)}
                  onBlur={handleDeliveryPhoneBlur}
                  placeholder={td('phonePlaceholder')}
                  className="w-full h-10 bg-[#E9E9E9] rounded-full px-4 text-xs text-[#2D2F33] outline-none placeholder:text-[#B9B9B9] focus:ring-1 focus:ring-[#026F4F]"
                />
              </div>

              {/* Secondary number (optional, Bug-12) */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#686868] flex items-center gap-1">
                  <Phone size={12} />
                  <span>Secondary Number <span className="font-normal text-[#989898]">(optional)</span></span>
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={deliveryForm.secondaryPhone ?? ''}
                  onChange={(e) => setDeliveryField('secondaryPhone')(e.target.value)}
                  placeholder="+20 1XXX XXX XXX"
                  className="w-full h-10 bg-[#E9E9E9] rounded-full px-4 text-xs text-[#2D2F33] outline-none placeholder:text-[#B9B9B9] focus:ring-1 focus:ring-[#026F4F]"
                />
              </div>

              {/* Saved addresses (Bug-12) */}
              {(() => {
                const found = loadCustomerByPhone(deliveryForm.phone);
                return found && found.addresses.length > 1 ? (
                  <div className="flex flex-wrap gap-2">
                    {found.addresses.map((a, i) => (
                      <button
                        key={`${a.label}-${i}`}
                        type="button"
                        onClick={() => applySavedAddress(i)}
                        className="rounded-full bg-[#026F4F]/10 px-3 py-1 text-[11px] font-medium text-[#026F4F] transition-colors hover:bg-[#026F4F] hover:text-white"
                      >
                        {a.label || `Address ${i + 1}`}
                      </button>
                    ))}
                  </div>
                ) : null;
              })()}

              {/* Address / Street (required) + Landmark (optional, Bug-12) */}
              {(
                [
                  { key: 'address', label: td('address'), placeholder: td('addressPlaceholder'), required: true },
                  { key: 'street', label: td('street'), placeholder: td('streetPlaceholder'), required: true },
                  { key: 'landmark', label: td('landmark'), placeholder: td('landmarkPlaceholder'), required: false },
                ] as const
              ).map((f) => (
                <div key={f.key} className="flex flex-col gap-1">
                  <label className="text-xs text-[#686868]">
                    {f.label}{' '}
                    {f.required ? (
                      <span className="text-[#E85E5E]">*</span>
                    ) : (
                      <span className="font-normal text-[#989898]">(optional)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={deliveryForm[f.key]}
                    onChange={(e) => setDeliveryField(f.key)(e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full h-10 bg-[#E9E9E9] rounded-full px-4 text-xs text-[#2D2F33] outline-none placeholder:text-[#B9B9B9] focus:ring-1 focus:ring-[#026F4F]"
                  />
                </div>
              ))}

              {/* Floor / Apartment (optional, Bug-12) */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[#686868]">
                    {td('floor')} <span className="font-normal text-[#989898]">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={deliveryForm.floor}
                    onChange={(e) => setDeliveryField('floor')(e.target.value)}
                    placeholder={td('floorPlaceholder')}
                    className="w-full h-10 bg-[#E9E9E9] rounded-full px-4 text-xs text-[#2D2F33] outline-none placeholder:text-[#B9B9B9] focus:ring-1 focus:ring-[#026F4F]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[#686868]">
                    {td('apartment')} <span className="font-normal text-[#989898]">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={deliveryForm.apartment}
                    onChange={(e) => setDeliveryField('apartment')(e.target.value)}
                    placeholder={td('apartmentPlaceholder')}
                    className="w-full h-10 bg-[#E9E9E9] rounded-full px-4 text-xs text-[#2D2F33] outline-none placeholder:text-[#B9B9B9] focus:ring-1 focus:ring-[#026F4F]"
                  />
                </div>
              </div>

              {/* Specific Instructions (optional) */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#686868]">
                  {td('instructions')} <span className="font-normal text-[#989898]">{td('optional')}</span>
                </label>
                <textarea
                  value={deliveryForm.instructions ?? ''}
                  onChange={(e) => setDeliveryField('instructions')(e.target.value)}
                  placeholder={td('instructionsPlaceholder')}
                  rows={2}
                  className="w-full resize-none rounded-xl bg-[#E9E9E9] px-4 py-2.5 text-xs text-[#2D2F33] outline-none placeholder:text-[#B9B9B9] focus:ring-1 focus:ring-[#026F4F]"
                />
              </div>
            </>
          ) : (
            <>
              {/* Phone */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#686868]">{t('phoneLabel')}</label>
                <div className="relative">
                  <Phone size={14} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-[#989898]" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('phonePlaceholder')}
                    className="w-full h-10 bg-[#E9E9E9] rounded-full pe-4 ps-10 text-xs text-[#2D2F33] outline-none focus:ring-1 focus:ring-[#026F4F]"
                  />
                </div>
              </div>

              {/* Full Name */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#686868]">{t('nameLabel')}</label>
                <div className="relative">
                  <User size={14} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-[#989898]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('namePlaceholder')}
                    className="w-full h-10 bg-[#E9E9E9] rounded-full pe-4 ps-10 text-xs text-[#2D2F33] outline-none focus:ring-1 focus:ring-[#026F4F]"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#686868]">{t('emailLabel')}</label>
                <div className="relative">
                  <Mail size={14} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-[#989898]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    className="w-full h-10 bg-[#E9E9E9] rounded-full pe-4 ps-10 text-xs text-[#2D2F33] outline-none focus:ring-1 focus:ring-[#026F4F]"
                  />
                </div>
              </div>
            </>
          )}

          {/* Promo code input (no apply button) */}
          <div className="border border-[#B9B9B9] rounded-xl p-1 flex items-center gap-2 bg-white mt-1">
            <Tag size={16} className="text-[#989898] ms-3 shrink-0" />
            <input
              type="text"
              value={promo}
              onChange={(e) => setPromo(e.target.value.toUpperCase())}
              placeholder={t('promoPlaceholder')}
              className="flex-1 bg-transparent text-xs uppercase font-medium text-[#2D2F33] placeholder:text-[#B9B9B9] outline-none"
            />
          </div>

          {/* Split Bill & Merge Bill */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => items.length > 0 && setSplitOpen(true)}
              disabled={items.length === 0}
              className={cn(
                'flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#026F4F] bg-[#E6F1ED] text-xs font-medium text-[#026F4F] transition-colors hover:bg-[#D6E9E1]',
                items.length === 0 && 'cursor-not-allowed opacity-50',
              )}
            >
              <Split size={15} className="shrink-0" />
              <span>{t('splitBill')}</span>
            </button>
            <button
              type="button"
              onClick={() => items.length > 0 && setMergeOpen(true)}
              disabled={items.length === 0}
              className={cn(
                'flex h-10 flex-1 items-center justify-center gap-1 rounded-lg bg-[#F2F2F2] text-xs font-medium text-[#686868] transition-colors hover:bg-[#E9E9E9]',
                items.length === 0 && 'cursor-not-allowed opacity-50',
              )}
            >
              <GitMerge size={15} className="shrink-0" />
              <span>{t('mergeBill')}</span>
            </button>
          </div>

          {/* Payment Details Box */}
          <div className="bg-[#F2F2F2] rounded-lg p-3 flex flex-col gap-2">
            <p className="font-medium text-[14px] text-[#2D2F33]">{t('paymentsDetails')}</p>
            <div className="flex justify-between text-xs text-[#686868]">
              <span>{t('subtotalItems', { count: items.reduce((s, i) => s + i.qty, 0) })}</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-xs text-emerald-700">
                <span>{t('promoDiscount')}</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-[#686868]">
              <span>{t('serviceCharge')}</span>
              <span>${serviceCharge.toFixed(2)}</span>
            </div>
            <div className="border-t border-dashed border-[#989898] my-0.5" />
            <div className="flex justify-between text-sm font-medium text-[#2D2F33]">
              <span>{t('total')}</span>
              <span className="font-semibold text-[#026F4F]">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Switcher */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-[#2D2F33]">{t('paymentMethod')}</label>
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
                <span>{t('payMethod.cash')}</span>
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
                <span>{t('payMethod.card')}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-2.5 px-4 pb-4 pt-2.5">
          {/* Keep Check Running */}
          <button
            onClick={() => router.push('/running-order')}
            className="w-full h-[46px] rounded-full border border-[#B9B9B9] bg-[#E9E9E9] hover:bg-[#E0E0E0] text-[#2D2F33] text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <PauseCircle size={18} className="text-[#686868]" />
            <span>{t('keepRunning')}</span>
          </button>

          {/* Confirm & Pay (delivery orders require the address first; Bug-64: session required) */}
          {session?.type === 'delivery' && !deliveryOk && (
            <p className="text-center text-xs font-medium text-[#E85E5E]">{td('deliveryRequired')}</p>
          )}
          <button
            onClick={() => {
              if (items.length === 0 || !deliveryOk || missingSession) return;
              if (session?.type === 'delivery') saveCustomer(deliveryForm);
              // Card is charged automatically — place the order right away;
              // only Cash needs the Collect Payment modal to enter tendered amount.
              if (paymentMethod === 'Card') {
                openSuccess();
              } else {
                setPaymentOpen(true);
              }
            }}
            disabled={items.length === 0 || !deliveryOk || missingSession}
            className={cn(
              'w-full h-[50px] rounded-full font-medium text-[16px] text-white transition-all shadow-[0_4px_16px_11px_rgba(0,0,0,0.12)] flex items-center justify-center gap-2',
              items.length > 0 && deliveryOk && !missingSession
                ? 'bg-[#026F4F] hover:bg-[#015c42] active:scale-95'
                : 'bg-[#B9B9B9] cursor-not-allowed shadow-none',
            )}
          >
            <Check size={20} />
            <span>{t('confirmPay')}</span>
          </button>
        </div>
      </div>

      {/* ── Collect Payment Modal ─────────────────────────────────── */}
      {paymentOpen && (
        <CollectPaymentModal
          total={total}
          onClose={() => setPaymentOpen(false)}
          onConfirm={() => {
            setPaymentOpen(false);
            openSuccess();
          }}
          onSplit={() => setSplitOpen(true)}
          onMerge={() => setMergeOpen(true)}
        />
      )}

      {/* ── Split Bill Modal ───────────────────────────────────────── */}
      {splitOpen && (
        <SplitBillModal items={items} total={total} onClose={() => setSplitOpen(false)} />
      )}

      {/* ── Merge Orders Modal ─────────────────────────────────────── */}
      {mergeOpen && (
        <MergeOrdersModal
          onClose={() => setMergeOpen(false)}
          onProceedToConfirm={() => {
            setMergeOpen(false);
            openConfirmMerge();
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

      {/* ── Confirm Merge Modal (Bug-68: current order counts as a selection) ── */}
      {confirmMergeOpen && confirmMergeArmed.current && (
        <ConfirmMergeModal
          ordersCount={selectedMergeOrders.length + 1}
          combinedTotal={selectedMergeOrders.reduce((sum, id) => {
            const totals: Record<string, number> = { ro1: 45.99, ro2: 32.5, ro3: 54, ro4: 18.99 };
            return sum + (totals[id] ?? 0);
          }, total)}
          onClose={closeConfirmMerge}
          onConfirm={() => {
            closeConfirmMerge();
            setMergeOpen(false);
          }}
        />
      )}

      {/* ── Success Modal ────────────────────────────────────────── */}
      {successOpen && successArmed.current && (
        <div className="pos-overlay z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="pos-overlay__panel w-[450px] bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-[#026F4F]">
              <Check size={36} strokeWidth={3} />
            </div>

            <h3 className="font-semibold text-2xl text-[#2D2F33]">{t('successTitle')}</h3>
            <p className="text-sm text-[#686868]">
              {t('successBody', { number: orderNumber })}
            </p>

            <div className="w-full bg-[#F2F2F2] rounded-xl p-4 flex justify-between text-sm text-[#2D2F33] my-2">
              <span>{t('totalPaid', { method: t('payMethod.' + paymentMethod.toLowerCase()) })}</span>
              <span className="font-bold text-[#026F4F]">${total.toFixed(2)}</span>
            </div>

            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={() => {
                  window.print();
                  closeSuccess();
                  clearDraft();
                  clearSession();
                  setItems([]);
                  router.push('/floor-plan');
                }}
                className="flex-1 h-12 rounded-full border border-[#B9B9B9] bg-white text-[#2D2F33] font-medium text-sm hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2"
              >
                <Printer size={16} />
                {t('printReceipt')}
              </button>
              <button
                onClick={() => {
                  closeSuccess();
                  clearDraft();
                  clearSession();
                  setItems([]);
                  router.push('/floor-plan');
                }}
                className="flex-1 h-12 rounded-full bg-[#026F4F] hover:bg-[#015c42] text-white font-medium text-sm transition-colors shadow-md"
              >
                {t('newOrder')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
