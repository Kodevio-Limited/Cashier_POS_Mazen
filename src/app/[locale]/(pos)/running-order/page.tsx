'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Clock, UtensilsCrossed, CookingPot, Package, Check, X, ArrowLeft, Phone, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getOrders,
  updateOrderStatus,
  removeOrder,
  subscribeOrders,
  type OrderStatus,
  type OrderType,
  type RunningOrder,
} from '@/lib/running-orders';
import { locStr, mapEnum, locTable } from '@/lib/locale-fields';

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
};

const STATUS_STEPS: { key: OrderStatus; label: string; icon: typeof Clock }[] = [
  { key: 'Placed', label: 'Placed', icon: Clock },
  { key: 'Preparing', label: 'Preparing', icon: CookingPot },
  { key: 'Ready', label: 'Ready', icon: Package },
  { key: 'Served', label: 'Served', icon: UtensilsCrossed },
];

export default function RunningOrderPage() {
  const t = useTranslations('runningOrder');
  const tTypes = useTranslations('common.orderTypes');
  const tStatus = useTranslations('runningOrder.statusActions');
  const tPay = useTranslations('common.status');
  const tTable = useTranslations('common.table');
  const locale = useLocale();
  const [orders, setOrders] = useState<RunningOrder[]>([]);
  const [activeTypeTab, setActiveTypeTab] = useState<OrderType>('All');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
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

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  const filteredOrders = orders
    .filter((o) => activeTypeTab === 'All' || o.type === activeTypeTab)
    // Pending acceptance (Placed) always float to the top.
    .sort((a, b) => Number(b.status === 'Placed') - Number(a.status === 'Placed'));

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

  return (
    <div className="flex min-h-[calc(100vh-38px)] gap-[15px] bg-[#F2F2F2] relative">
      {/* ── Left: Running Orders workspace ─────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-[7px]">
            <h1 className="text-[19px] font-medium leading-[1.4] text-black">{t('title')}</h1>
            <p className="text-[13px] font-normal leading-[1.4] text-[#989898]">{t('subtitle')}</p>
          </div>
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
              {tTypes(mapEnum(tab, ORDER_TYPE_KEY_MAP))}
            </button>
          ))}
        </div>

        {/* Cards grid */}
        <div className="mt-[24px] flex-1 overflow-y-auto pb-20">
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
                        <UtensilsCrossed size={13} strokeWidth={1.6} className="shrink-0 text-[#989898]" />
                        <span className="truncate text-[11px] font-normal leading-[1.4] text-[#989898]">{locTable(order.table, locale, tTable)}</span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="mt-2.5 flex flex-col">
                      {order.items.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 border-b border-[#F2F2F2] py-2 last:border-0">
                          <div className="flex h-[54px] w-[54px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-[#F2F2F2] text-[26px]">
                            {item.emoji}
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
                            updateOrderStatus(order.id, 'Served');
                          }}
                          className="rounded-full bg-green-600 px-4 py-2 text-xs font-medium text-white shadow-xs transition-all hover:bg-green-700 active:scale-95"
                        >
                          {t('complete')}
                        </button>
                      )}
                      {(order.status === 'Served' || order.status === 'Completed') && (
                        <button
                          disabled
                          className="cursor-not-allowed rounded-full bg-zinc-300 px-4 py-2 text-xs font-medium text-white"
                        >
                          {t('served')}
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
        <div className="flex w-[343px] max-w-[calc(100vw-140px)] shrink-0 flex-col overflow-hidden rounded-lg bg-white shadow-[0_1px_6px_rgba(0,0,0,0.08)] max-lg:fixed max-lg:bottom-3 max-lg:end-3 max-lg:top-3 max-lg:z-40 max-lg:shadow-2xl">
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
              <p className="text-[10.5px] font-normal leading-[1.4] text-[#686868]">{t('tableLabel', { table: '03' })}</p>
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
                <div className="flex items-center gap-1.5">
                  <Mail size={15} className="shrink-0 text-[#989898]" />
                  <span className="text-[12px] font-normal leading-[1.4] text-[#989898]" dir="ltr">{selectedOrder.email}</span>
                </div>
              </div>
            </div>

            {/* Status stepper */}
            <div className="mt-[20px] h-[114px] rounded-[10px] bg-[#F2F2F2] px-[16px] pt-[13px]">
              <p className="text-[13px] font-medium leading-[1.4] text-black">{t('statusHeading')}</p>
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
                        {tStatus(mapEnum(step.key, STATUS_KEY_MAP))}
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

            {/* Order summary — compact rows, no photos (Bug-66) */}
            <div className="mt-[10px] flex flex-col gap-[6px]">
              <p className="text-[12px] font-semibold leading-[1.4] text-[#2D2F33]">{t('orderSummary')}</p>
              <div className="flex flex-col rounded-[10px] bg-[#F2F2F2] px-3 py-1">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 border-b border-[#E4E4E4] py-2 last:border-0">
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-[13px] font-medium leading-[1.4] text-[#2D2F33]">{locStr(item.name, item.nameAr, locale)}</span>
                      <span className="truncate text-[11px] font-normal leading-[1.4] text-[#989898]">+ {locStr(item.modifier || 'Mayo', item.modifierAr || t('mayoModifier'), locale)}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-[13px] font-semibold leading-[1.4] text-[#026F4F]">${(item.price * item.qty).toFixed(2)}</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold leading-[1.4] text-[#2D2F33]">{t('qty', { count: item.qty })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payments */}
            <div className="mt-[20px] flex h-[158px] flex-col rounded-[7px] bg-[#F2F2F2] px-[9px] py-[10px]">
              <p className="text-[15px] font-medium leading-[1.4] text-[#2D2F33]">{t('paymentsDetails')}</p>
              <div className="mt-[16px] flex flex-col gap-[12px] text-[13px] leading-[1.4]">
                <div className="flex items-center justify-between">
                  <span className="font-normal text-[#989898]">{t('subtotalItems', { count: selectedOrder.items.reduce((s, i) => s + i.qty, 0) })}</span>
                  <span className="font-medium text-[#686868]">${selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-normal text-[#989898]">{t('serviceCharge')}</span>
                  <span className="font-medium text-[#686868]">${selectedOrder.serviceCharge.toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-[12px] border-t border-dashed border-[#989898]" />
              <div className="mt-[10px] flex items-center justify-between text-[14px] leading-[1.4]">
                <span className="font-medium text-black">{t('total')}</span>
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
                ? t('markPreparing')
                : selectedOrder.status === 'Preparing'
                  ? t('markReady')
                  : selectedOrder.status === 'Ready'
                    ? t('serveOrder')
                    : t('completed')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}