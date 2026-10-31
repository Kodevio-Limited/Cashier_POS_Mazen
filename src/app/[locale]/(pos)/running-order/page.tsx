'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Clock, UtensilsCrossed, CookingPot, Package, Check, X, ArrowLeft, Phone, Mail, Scissors, ShoppingBag, Bike, Search, MapPin, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getOrders,
  updateOrderStatus,
  markOrderPaid,
  removeOrder,
  subscribeOrders,
  nextStatus,
  STATUS_STEPS,
  DELIVERY_STATUS_STEPS,
  type OrderStatus,
  type OrderType,
  type RunningOrder,
} from '@/lib/running-orders';
import { locStr, mapEnum, locTable } from '@/lib/locale-fields';
import { foodImage } from '@/lib/menu-images';
import { useBodyScrollLock } from '@/lib/use-body-scroll-lock';

const ORDER_TYPE_KEY_MAP: Record<string, string> = {
  All: 'all',
  'Dine In': 'dineIn',
  Takeaway: 'takeaway',
  Delivery: 'delivery',
};

const STATUS_KEY_MAP: Record<string, string> = {
  Placed: 'placed',
  Preparing: 'preparing',
  Ready: 'ready',
  Served: 'served',
  'Out for Delivery': 'outForDelivery',
  Delivered: 'delivered',
};

const STATUS_ICON: Record<OrderStatus, typeof Clock> = {
  Placed: Clock,
  Preparing: CookingPot,
  Ready: Package,
  Served: UtensilsCrossed,
  'Out for Delivery': Bike,
  Delivered: Check,
  Completed: Check,
};

export default function RunningOrderPage() {
  const t = useTranslations('runningOrder');
  const tTypes = useTranslations('common.orderTypes');
  const tStatus = useTranslations('runningOrder.statusActions');
  const tPay = useTranslations('common.status');
  const tMethod = useTranslations('common.paymentMethods');
  const tTable = useTranslations('common.table');
  const locale = useLocale();
  const [orders, setOrders] = useState<RunningOrder[]>([]);
  const [activeTypeTab, setActiveTypeTab] = useState<OrderType>('All');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  // Cash on delivery: opened when a delivery order is marked Delivered so the
  // cashier collects the money (Bug-70) and the card flips to Paid.
  const [collecting, setCollecting] = useState<RunningOrder | null>(null);
  const [collectReceived, setCollectReceived] = useState('');
  useBodyScrollLock(collecting !== null);
  const initialized = useRef(false);

  useEffect(() => {
    const load = () => {
      const list = getOrders();
      setOrders(list);
      // Figma shows the order-detail panel open by default — select the first
      // order once on first load so the screen matches the reference.
      if (!initialized.current && list.length > 0) {
        initialized.current = true;
        setSelectedOrderId(list[0].id);
      }
    };
    load();
    return subscribeOrders(load);
  }, []);

  const filteredOrders = orders
    .filter((o) => {
      if (activeTypeTab !== 'All' && o.type !== activeTypeTab) return false;
      const q = search.trim().toLowerCase().replace(/^#/, '');
      if (!q) return true;
      return (
        o.orderNumber.toLowerCase().replace(/^#/, '').includes(q) ||
        (o.table ? o.table.toLowerCase().includes(q) : false) ||
        o.customerName.toLowerCase().includes(q)
      );
    })
    // Pending acceptance (Placed) always float to the top.
    .sort((a, b) => Number(b.status === 'Placed') - Number(a.status === 'Placed'));

  const selectedOrder =
    filteredOrders.find((o) => o.id === selectedOrderId) ??
    filteredOrders[0] ??
    null;

  function handleTypeTabChange(tab: OrderType) {
    setActiveTypeTab(tab);
    const q = search.trim().toLowerCase().replace(/^#/, '');
    const nextFiltered = orders
      .filter((o) => {
        if (tab !== 'All' && o.type !== tab) return false;
        if (!q) return true;
        return (
          o.orderNumber.toLowerCase().replace(/^#/, '').includes(q) ||
          (o.table ? o.table.toLowerCase().includes(q) : false) ||
          o.customerName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => Number(b.status === 'Placed') - Number(a.status === 'Placed'));
    if (nextFiltered.length > 0) {
      setSelectedOrderId(nextFiltered[0].id);
    }
  }

  /** Advance one step. Delivery orders end at Delivered, where an unpaid
      (cash-on-delivery) check is collected right away. */
  function advanceStatus(order: RunningOrder) {
    const next = nextStatus(order);
    if (next === 'Delivered' && !order.isPaid) {
      // Cash on delivery: the money changes hands once the food is delivered.
      setCollecting(order);
      return;
    }
    updateOrderStatus(order.id, next);
  }

  return (
    <div className="flex h-[calc(100vh-12px)] -mt-[26px] gap-[15px] bg-[#F2F2F2] relative">
      {/* ── Left: Running Orders workspace ─────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col pt-[26px]">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-[7px]">
            <h1 className="text-[19px] font-medium leading-[1.4] text-black">{t('title')}</h1>
            <p className="text-[13px] font-normal leading-[1.4] text-[#989898]">{t('subtitle')}</p>
          </div>
        </div>

        {/* Filter pills + search */}
        <div className="mt-[24px] flex items-center gap-[11px]">
          {!searchOpen && (
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-[11px]">
              {(['All', 'Dine In', 'Takeaway', 'Delivery'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTypeTabChange(tab)}
                  className={cn(
                    'flex h-[45px] items-center rounded-full px-[16px] text-[16px] font-medium leading-[1.3] transition-all',
                    activeTypeTab === tab ? 'bg-[#026F4F] text-white shadow-xs' : 'bg-white text-[#686868] hover:text-[#2D2F33]',
                  )}
                >
                  {tTypes(mapEnum(tab, ORDER_TYPE_KEY_MAP))}
                </button>
              ))}
            </div>
          )}

          {/* Search — collapsed to a button on right, expands over the row */}
          {searchOpen ? (
            <div className="flex h-[45px] min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-4 outline outline-1 outline-offset-[-1px] outline-[#E9E9E9] animate-in fade-in zoom-in-95 duration-200">
              <Search size={18} className="shrink-0 text-[#989898]" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearch('');
                    setSearchOpen(false);
                  }
                }}
                placeholder={t('searchPlaceholder')}
                className="w-full min-w-0 bg-transparent text-[13px] text-[#2D2F33] outline-none placeholder:text-[#989898]"
              />
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSearchOpen(false);
                }}
                aria-label={t('clearSearch')}
                className="shrink-0 text-[#989898] transition-colors hover:text-[#2D2F33]"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label={t('searchPlaceholder')}
              title={t('searchPlaceholder')}
              className="ms-auto flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-full bg-white text-[#686868] outline outline-1 outline-offset-[-1px] outline-[#E9E9E9] transition-colors hover:text-[#026F4F] hover:outline-[#026F4F]"
            >
              <Search size={18} />
            </button>
          )}
        </div>

        {/* Cards grid — pt/px keep the selected card's 2px ring from being
            clipped by the scroll container's padding box */}
        <div className="mt-[24px] flex-1 overflow-y-auto px-1 pb-20 pt-1">
          {filteredOrders.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-xl bg-white text-sm text-[#989898]">
              <Clock size={32} className="mb-2" />
              <p>{t('noOrders')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-[9px] sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-[1800px]:grid-cols-5">
              {filteredOrders.map((order) => {
                const isSelected = order.id === selectedOrderId;
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={cn(
                      'relative flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-[12px] bg-white p-3 transition-all hover:shadow-md',
                      isSelected ? 'ring-2 ring-[#026F4F]/30' : '',
                    )}
                  >
                    {/* Header: name + paid + order no */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-[14px] font-medium leading-[1.4] text-black">{order.customerName}</span>
                        <span
                          className={cn(
                            'flex shrink-0 items-center gap-[4px] rounded-full px-[5px] py-[2px] text-[8px] font-normal leading-[1.4] text-white',
                            order.isPaid ? 'bg-[#16C722]' : 'bg-[#E85E5E]',
                          )}
                        >
                          <Check size={11} strokeWidth={3} className={order.isPaid ? '' : 'hidden'} />
                          <span>{order.isPaid ? tPay('paid') : tPay('unpaid')}</span>
                        </span>
                      </div>
                      <span className="shrink-0 text-[11px] font-normal leading-[1.4] text-[#989898]">{order.orderNumber}</span>
                    </div>

                    {/* Meta */}
                    <div className="mt-2 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} strokeWidth={1.6} className="shrink-0 text-[#989898]" />
                        <span className="truncate text-[11px] font-normal leading-[1.4] text-[#989898]">{locStr(order.date, order.dateAr, locale)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {order.type === 'Takeaway' ? (
                          <ShoppingBag size={13} strokeWidth={1.6} className="shrink-0 text-[#989898]" />
                        ) : order.type === 'Delivery' ? (
                          <Bike size={13} strokeWidth={1.6} className="shrink-0 text-[#989898]" />
                        ) : (
                          <UtensilsCrossed size={13} strokeWidth={1.6} className="shrink-0 text-[#989898]" />
                        )}
                        <span className="truncate text-[11px] font-normal leading-[1.4] text-[#989898]">
                          {order.type === 'Takeaway'
                            ? tTypes('takeaway')
                            : order.type === 'Delivery'
                              ? tTypes('delivery')
                              : locTable(order.table, locale, tTable)}
                        </span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="mt-2.5 flex flex-col">
                      {order.items.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 border-b border-[#F2F2F2] py-2 last:border-0">
                          <div className="h-[54px] w-[54px] shrink-0 overflow-hidden rounded-[8px] bg-[#F2F2F2]">
                            <img src={foodImage(item.emoji)} alt="" className="h-full w-full object-contain p-[6px]" />
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="truncate text-[13px] font-medium leading-[1.4] text-[#2D2F33]">{locStr(item.name, item.nameAr, locale)}</span>
                            <span className="truncate text-[10.7px] font-normal leading-[1.4] text-[#989898]">&ldquo;{locStr(item.modifier || 'Standard', item.modifierAr || t('standardModifier'), locale)}&rdquo;</span>
                            <span className="text-[12.7px] font-semibold leading-[1.4] text-[#026F4F]">${item.price.toFixed(2)}</span>
                          </div>
                          <span className="shrink-0 text-[12.7px] font-semibold leading-[1.4] text-[#2D2F33]">{t('qty', { count: item.qty })}</span>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex flex-col gap-[8px]">
                        <span className="text-[8.4px] font-normal leading-[1.4] text-[#686868]">
                          {t('moreItems', { count: Math.max(0, order.items.length - 2) })}
                        </span>
                        <span className="text-[12px] font-semibold leading-[1.4] text-[#026F4F]">${order.total.toFixed(2)}</span>
                      </div>
                      {order.status === 'Placed' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeOrder(order.id);
                            }}
                            aria-label={t('rejectAria')}
                            title={t('reject')}
                            className="flex h-[40px] w-[44px] shrink-0 items-center justify-center rounded-[12px] bg-[#E85E5E] text-white transition-colors hover:bg-[#d94a4a]"
                          >
                            <X size={18} strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(order.id, 'Preparing');
                            }}
                            aria-label={t('acceptAria')}
                            title={t('accept')}
                            className="flex h-[40px] w-[44px] shrink-0 items-center justify-center rounded-[12px] bg-[#64C864] text-white transition-colors hover:bg-[#4fb84f]"
                          >
                            <Check size={18} strokeWidth={2.8} />
                          </button>
                        </div>
                      )}
                      {order.status === 'Preparing' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeOrder(order.id);
                            }}
                            aria-label={t('rejectAria')}
                            className="flex h-9 shrink-0 items-center justify-center gap-1 rounded-[10px] bg-[#E85E5E] px-2.5 text-[11.5px] font-medium text-white transition-colors hover:bg-[#d94a4a]"
                          >
                            <X size={14} strokeWidth={2.5} />
                            <span>{t('reject')}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(order.id, 'Ready');
                            }}
                            className="h-9 shrink-0 rounded-[62px] bg-[#F97316] px-3.5 text-[12px] font-medium text-white transition-all hover:bg-[#ea690b] active:scale-95"
                          >
                            {t('markReady')}
                          </button>
                        </div>
                      )}
                      {order.status === 'Ready' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order.id, order.type === 'Delivery' ? 'Out for Delivery' : 'Served');
                          }}
                          className="rounded-full bg-green-600 px-4 py-2 text-xs font-medium text-white shadow-xs transition-all hover:bg-green-700 active:scale-95"
                        >
                          {order.type === 'Delivery' ? t('sendOutForDelivery') : t('complete')}
                        </button>
                      )}
                      {order.status === 'Out for Delivery' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            advanceStatus(order);
                          }}
                          className="rounded-full bg-[#F97316] px-4 py-2 text-xs font-medium text-white shadow-xs transition-all hover:bg-[#ea690b] active:scale-95"
                        >
                          {t('markDelivered')}
                        </button>
                      )}
                      {(order.status === 'Served' || order.status === 'Completed' || order.status === 'Delivered') && (
                        <button
                          disabled
                          className="cursor-not-allowed rounded-full bg-zinc-300 px-4 py-2 text-xs font-medium text-white"
                        >
                          {order.status === 'Delivered' ? t('statusActions.delivered') : t('served')}
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
        <div className="flex h-full w-[343px] max-w-[calc(100vw-140px)] shrink-0 flex-col overflow-hidden bg-white shadow-[0_1px_6px_rgba(0,0,0,0.08)] max-lg:fixed max-lg:bottom-3 max-lg:end-3 max-lg:top-3 max-lg:z-40 max-lg:rounded-lg max-lg:shadow-2xl lg:rounded-none">
          {/* Header */}
          <div className="flex items-center justify-between px-3 pt-3">
            <button
              onClick={() => setSelectedOrderId('')}
              className="flex h-[28px] w-[28px] items-center justify-center rounded-full text-[#2D2F33] transition-colors hover:bg-[#F2F2F2]"
              aria-label={t('backToOrders')}
            >
              <ArrowLeft size={20} className="rtl:scale-x-[-1]" />
            </button>
            <div className="flex flex-col items-center gap-[7px]">
              <p className="text-[19px] font-medium leading-[1.4] text-black">{selectedOrder.orderNumber}</p>
              <div className="flex items-center gap-[6px]">
                {selectedOrder.type === 'Takeaway' ? (
                  <ShoppingBag size={13} strokeWidth={1.6} className="shrink-0 text-[#686868]" />
                ) : selectedOrder.type === 'Delivery' ? (
                  <Bike size={13} strokeWidth={1.6} className="shrink-0 text-[#686868]" />
                ) : (
                  <UtensilsCrossed size={13} strokeWidth={1.6} className="shrink-0 text-[#686868]" />
                )}
                <p className="text-[10.5px] font-normal leading-[1.4] text-[#686868]">
                  {selectedOrder.type === 'Takeaway'
                    ? tTypes('takeaway')
                    : selectedOrder.type === 'Delivery'
                      ? tTypes('delivery')
                      : locTable(selectedOrder.table, locale, tTable)}
                </p>
                <span
                  className={cn(
                    'rounded-full px-[7px] py-[2px] text-[9px] font-medium leading-[1.4] text-white',
                    selectedOrder.isPaid ? 'bg-[#16C722]' : 'bg-[#E85E5E]',
                  )}
                >
                  {selectedOrder.isPaid ? tPay('paid') : tPay('unpaid')}
                </span>
              </div>
            </div>
            <div className="h-[28px] w-[28px]" />
          </div>

          <div className="mt-4 flex-1 overflow-y-auto px-[11px] pb-2">
            {/* Customer info */}
            <div className="flex flex-col gap-2 rounded-[10px] bg-[#F2F2F2] px-3.5 py-3">
              <p className="text-[14px] font-medium leading-[1.4] text-[#2D2F33]">{locStr(selectedOrder.customerName, selectedOrder.customerNameAr, locale)}</p>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Phone size={15} className="shrink-0 text-[#989898]" />
                  <span className="text-[12px] font-normal leading-[1.4] text-[#989898]" dir="ltr">{selectedOrder.phone}</span>
                </div>
                {/* Delivery orders carry no email, so the row is skipped entirely
                    rather than leaving a bare icon behind (Bug-70). */}
                {selectedOrder.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail size={15} className="shrink-0 text-[#989898]" />
                    <span className="text-[12px] font-normal leading-[1.4] text-[#989898]" dir="ltr">{selectedOrder.email}</span>
                  </div>
                )}
                {/* Delivery — instructions sit right under the email, then the address */}
                {selectedOrder.type === 'Delivery' && selectedOrder.instructions && (
                  <div className="flex items-start gap-1.5">
                    <MessageSquare size={15} className="mt-[2px] shrink-0 text-[#989898]" />
                    <span className="text-[12px] font-normal leading-[1.4] text-[#989898]">{locStr(selectedOrder.instructions, selectedOrder.instructionsAr, locale)}</span>
                  </div>
                )}
                {selectedOrder.type === 'Delivery' && selectedOrder.address && (
                  <div className="flex items-start gap-1.5">
                    <MapPin size={15} className="mt-[2px] shrink-0 text-[#989898]" />
                    <span className="text-[12px] font-normal leading-[1.4] text-[#989898]">{locStr(selectedOrder.address, selectedOrder.addressAr, locale)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status stepper — delivery orders walk Preparing → Ready → Out for
                Delivery → Delivered; dine-in / takeaway keep Served. */}
            <div className="mt-[20px] rounded-[10px] bg-[#F2F2F2] px-[16px] pt-[13px] pb-[13px]">
              <p className="text-[13px] font-medium leading-[1.4] text-black">{t('statusHeading')}</p>
              <div className="relative mt-[6px] flex items-start justify-between">
                {(selectedOrder.type === 'Delivery' ? DELIVERY_STATUS_STEPS : STATUS_STEPS).map((key, i, steps) => {
                  const idx = steps.findIndex((s) => s === selectedOrder.status);
                  const isDone = idx >= 0 ? i <= idx : false;
                  const Icon = STATUS_ICON[key];
                  return (
                    <Fragment key={key}>
                      {/* Connector — in-flow so it tracks the real step spacing */}
                      {i > 0 && (
                        <div
                          className={cn(
                            'mt-[15px] h-0 min-w-[16px] flex-1 border-t-2 border-dashed',
                            isDone ? 'border-[#026F4F]' : 'border-[#B9B9B9]',
                          )}
                        />
                      )}
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            'flex h-[32px] w-[32px] items-center justify-center rounded-full border',
                            isDone ? 'border-[#026F4F] bg-[#E6F1ED] text-[#026F4F]' : 'border-[#B9B9B9] bg-white text-[#989898]',
                          )}
                        >
                          <Icon size={18} strokeWidth={1.6} />
                        </div>
                        <span className={cn('mt-[8px] text-[9px] font-normal leading-[1.4]', isDone ? 'text-[#026F4F]' : 'text-[#B9B9B9]')}>
                          {tStatus(mapEnum(key, STATUS_KEY_MAP))}
                        </span>
                      </div>
                    </Fragment>
                  );
                })}
              </div>
            </div>

            {/* Order summary — compact rows, no photos (Bug-66) */}
            <div className="mt-[10px] flex flex-col gap-[6px]">
              <p className="text-[12px] font-semibold leading-[1.4] text-[#2D2F33]">{t('orderSummary')}</p>
              <div className="flex flex-col gap-[8px]">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-[10px] rounded-[10px] bg-[#F2F2F2] p-2">
                    <div className="h-[54px] w-[54px] shrink-0 overflow-hidden rounded-[8px] bg-white">
                      <img src={foodImage(item.emoji)} alt="" className="h-full w-full object-contain p-[6px]" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-[13.5px] font-medium leading-[1.4] text-[#2D2F33]">{locStr(item.name, item.nameAr, locale)}</span>
                      <span className="truncate text-[11px] leading-[1.4]">
                        {/* Only render the add-on row when the line actually has
                            one — real orders can be plain, and defaulting to a
                            fabricated "Mayo" misreports the dish. */}
                        {item.modifier && (
                          <>
                            <span className="font-semibold text-[#64C864]">+</span>{' '}
                            <span className="text-[#989898]">{locStr(item.modifier, item.modifierAr, locale)}</span>
                          </>
                        )}
                      </span>
                      <span className="flex items-center gap-[3px] text-[11px] italic leading-[1.4] text-[#026F4F]">
                        <Scissors size={14} strokeWidth={1.6} />
                        {t('cutInHalf')}
                      </span>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-[13.5px] font-semibold leading-[1.4] text-[#026F4F]">${(item.price * item.qty).toFixed(2)}</span>
                      <span className="text-[11px] font-medium leading-[1.4] text-[#686868]">{t('qty', { count: item.qty })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payments — kept compact so Subtotal → Tax → Tips → Total all fit
                above the fold of this narrow panel (Bugs 3/6). */}
            <div className="mt-[12px] flex min-h-[158px] flex-col rounded-[7px] bg-[#F2F2F2] px-[9px] py-[10px]">
              <p className="text-[15px] font-medium leading-[1.4] text-[#2D2F33]">{t('paymentsDetails')}</p>
              <div className="mt-[10px] flex flex-col gap-[9px] text-[13px] leading-[1.4]">
                <div className="flex items-center justify-between">
                  <span className="font-normal text-[#989898]">{t('subtotalItems', { count: selectedOrder.items.reduce((s, i) => s + i.qty, 0) })}</span>
                  <span className="font-medium text-[#686868]">${selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-normal text-[#989898]">{t('serviceCharge')}</span>
                  <span className="font-medium text-[#686868]">${selectedOrder.serviceCharge.toFixed(2)}</span>
                </div>
                {typeof selectedOrder.tax === 'number' && (
                  <div className="flex items-center justify-between">
                    <span className="font-normal text-[#989898]">{t('tax')}</span>
                    <span className="font-medium text-[#686868]">${selectedOrder.tax.toFixed(2)}</span>
                  </div>
                )}
                {typeof selectedOrder.tips === 'number' && (
                  <div className="flex items-center justify-between">
                    <span className="font-normal text-[#989898]">{t('tips')}</span>
                    <span className="font-medium text-[#686868]">${selectedOrder.tips.toFixed(2)}</span>
                  </div>
                )}
                {/* Delivery — how the money is coming in: prepaid online, or
                    cash collected on delivery. */}
                {selectedOrder.type === 'Delivery' && selectedOrder.paymentMethod && (
                  <div className="flex items-center justify-between">
                    <span className="font-normal text-[#989898]">{t('paymentMethod')}</span>
                    <span className="font-medium text-[#686868]">
                      {selectedOrder.paymentMethod === 'Online'
                        ? t('payMethod.online')
                        : selectedOrder.paymentMethod === 'Cash on Delivery'
                          ? t('payMethod.cod')
                          : tMethod(mapEnum(selectedOrder.paymentMethod, { Card: 'card', Cash: 'cash' }))}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-[12px] border-t border-dashed border-[#989898]" />
              <div className="mt-[10px] flex items-center justify-between text-[14px] leading-[1.4]">
                <span className="font-medium text-black">{t('total')}</span>
                <span className="font-semibold text-[#026F4F]">${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Advance the order — the label follows the (possibly delivery-only)
              status chain; a finished order shows Completed. */}
          <div className="p-[11px]">
            {(() => {
              const done =
                selectedOrder.type === 'Delivery'
                  ? selectedOrder.status === 'Delivered'
                  : selectedOrder.status === 'Served' || selectedOrder.status === 'Completed';
              const label = selectedOrder.type === 'Delivery'
                ? selectedOrder.status === 'Placed'
                  ? t('markPreparing')
                  : selectedOrder.status === 'Preparing'
                    ? t('markReady')
                    : selectedOrder.status === 'Ready'
                      ? t('sendOutForDelivery')
                      : selectedOrder.status === 'Out for Delivery'
                        ? t('markDelivered')
                        : t('completed')
                : selectedOrder.status === 'Placed'
                  ? t('markPreparing')
                  : selectedOrder.status === 'Preparing'
                    ? t('markReady')
                    : selectedOrder.status === 'Ready'
                      ? t('serveOrder')
                      : t('completed');
              return (
                <button
                  onClick={() => advanceStatus(selectedOrder)}
                  disabled={done}
                  className={cn(
                    'flex h-[44px] w-full items-center justify-center rounded-[30px] text-[16px] font-medium leading-[1.4] text-white shadow-[0px_4px_16.3px_11px_rgba(0,0,0,0.12)] transition-all active:scale-[0.99]',
                    done
                      ? 'cursor-not-allowed bg-zinc-300 shadow-none'
                      : 'bg-[#F97316] hover:bg-[#ea690b]',
                  )}
                >
                  {label}
                </button>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Cash on delivery: collect the money when a delivery order lands ── */}
      {collecting && (
        <div className="pos-overlay z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="pos-overlay__panel flex w-[420px] max-w-full animate-in flex-col gap-4 rounded-2xl bg-white p-6 shadow-2xl zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="text-xl font-bold text-black">{t('collectCashOnDelivery.title')}</h3>
              <button
                onClick={() => setCollecting(null)}
                aria-label={t('backToOrders')}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-1 rounded-xl bg-[#F2F2F2] p-4">
              <span className="text-xs text-[#989898]">{t('collectCashOnDelivery.due')}</span>
              <span className="text-3xl font-semibold text-black"><bdi dir="ltr">${collecting.total.toFixed(2)}</bdi></span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#686868]">{t('collectCashOnDelivery.amountReceived')}</label>
              <input
                type="number"
                dir="ltr"
                inputMode="decimal"
                autoFocus
                value={collectReceived}
                onChange={(e) => setCollectReceived(e.target.value)}
                placeholder={collecting.total.toFixed(2)}
                className="h-12 w-full rounded-xl bg-[#F2F2F2] px-4 text-lg font-medium text-[#2D2F33] outline-none [appearance:textfield] placeholder:text-[#989898] focus:ring-2 focus:ring-[#026F4F] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-black">{t('collectCashOnDelivery.changeDue')}</span>
              <span className="text-lg font-semibold text-[#026F4F]">
                <bdi dir="ltr">${Math.max(0, (parseFloat(collectReceived) || 0) - collecting.total).toFixed(2)}</bdi>
              </span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setCollecting(null)}
                className="h-11 flex-1 rounded-xl bg-zinc-100 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200"
              >
                {t('collectCashOnDelivery.cancel')}
              </button>
              <button
                onClick={() => {
                  updateOrderStatus(collecting.id, 'Delivered');
                  markOrderPaid(collecting.id, 'Cash');
                  setCollecting(null);
                  setCollectReceived('');
                }}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#026F4F] text-sm font-medium text-white transition-colors hover:bg-[#015c42]"
              >
                <Check size={16} strokeWidth={2.6} />
                {t('collectCashOnDelivery.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}