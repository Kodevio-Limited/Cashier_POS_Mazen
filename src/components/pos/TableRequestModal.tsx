'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Clock, Bell, CheckCircle2, Printer, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBodyScrollLock } from '@/lib/use-body-scroll-lock';
import type { TableRequest } from '@/lib/table-requests';
import { getOrders, subscribeOrders, type RunningOrder } from '@/lib/running-orders';
import { mapEnum, locStr, locTimeAgo, locTable } from '@/lib/locale-fields';

const PAYMENT_METHOD_KEY_MAP: Record<string, string> = { Card: 'card', Cash: 'cash' };

export function TableRequestModal({
  requests,
  onClose,
  onDismissAll,
  onHandled,
}: {
  requests: TableRequest[];
  onClose: () => void;
  onDismissAll: () => void;
  onHandled: (id: string) => void;
}) {
  const t = useTranslations('tableRequests');
  const tType = useTranslations('floorPlan.modal');
  const tPay = useTranslations('floorPlan.paymentMethod');
  const tTime = useTranslations('common.time');
  const tTable = useTranslations('common.table');
  const locale = useLocale();
  const [orders, setOrders] = useState<RunningOrder[]>([]);
  useBodyScrollLock(true);

  useEffect(() => {
    setOrders(getOrders());
    return subscribeOrders(() => setOrders(getOrders()));
  }, []);

  /** Items ordered at this table but not paid for yet. */
  const unpaidItemsFor = (table: string) =>
    orders.filter((o) => !o.isPaid && o.table === table).flatMap((o) => o.items);

  return (
    <div className="pos-overlay z-50 flex items-stretch justify-start bg-black/40 backdrop-blur-xs">
      <div className="flex h-full w-[384px] max-w-[calc(100vw-1rem)] flex-col rounded-s-none rounded-e-2xl bg-zinc-100 p-5 shadow-2xl animate-in ltr:slide-in-from-left rtl:slide-in-from-right duration-300">
        <div className="flex items-start justify-between border-b border-zinc-400/40 pb-3">
          <span className="text-lg font-medium text-black">{t('title')}</span>
          <button
            onClick={onClose}
            aria-label={t('title')}
            className="flex h-6 w-6 items-center justify-center rounded-full text-black transition-colors hover:bg-zinc-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-1 text-xs font-normal text-neutral-400">
            <Clock size={14} />
            <span>{t('sortedHint')}</span>
          </div>
          <button
            onClick={onDismissAll}
            disabled={requests.length === 0}
            className="text-xs font-medium text-emerald-700 enabled:hover:underline disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('dismissAll')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {requests.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-xs text-neutral-400">
              <CheckCircle2 size={32} className="mb-2 text-[#026F4F]" />
              <span>{t('empty')}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {requests.map((req) => {
                const unpaid = unpaidItemsFor(req.table);
                const unpaidTotal = unpaid.reduce((s, i) => s + i.price * i.qty, 0);
                return (
                  <div key={req.id} className="flex shrink-0 flex-col justify-between gap-2.5 rounded-xl bg-white p-3.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl font-medium text-black">{locTable(req.table, locale, tTable)}</span>
                        {req.paymentMethod && (
                          <div className="flex items-center gap-1 rounded-[20px] bg-zinc-100 px-1.5 py-1">
                            <Image
                              src={req.paymentMethod === 'Card' ? '/images/figma/payment-card.png' : '/images/figma/payment-cash.png'}
                              alt=""
                              width={req.paymentMethod === 'Card' ? 14 : 12}
                              height={req.paymentMethod === 'Card' ? 14 : 8}
                              className={cn('shrink-0', req.paymentMethod === 'Card' ? 'h-3.5 w-3.5' : 'h-2 w-3')}
                            />
                            <span className="text-[8px] font-normal text-zinc-800">{tPay(mapEnum(req.paymentMethod, PAYMENT_METHOD_KEY_MAP))}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs font-normal text-red-600">
                        <Clock size={14} />
                        <span>{locTimeAgo(req.timeAgo, locale, tTime)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {req.type === 'Waiter Requested' ? (
                        <div className="flex items-center gap-1.5 rounded-2xl bg-fuchsia-200 px-2.5 py-1.5 text-xs font-normal text-fuchsia-800">
                          <Bell size={13} />
                          <span>{tType('waiterRequested')}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 rounded-2xl bg-blue-100 px-2.5 py-1.5 text-xs font-normal text-blue-900">
                          <CheckCircle2 size={13} />
                          <span>{tType('checkRequested')}</span>
                        </div>
                      )}
                    </div>

                    {/* Unpaid items — what the customer ordered but has not paid for yet */}
                    <div className="rounded-lg bg-zinc-50 p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">{t('unpaidItems')}</span>
                        {unpaidTotal > 0 && (
                          <span className="text-[11px] font-semibold text-emerald-700"><bdi dir="ltr">${unpaidTotal.toFixed(2)}</bdi></span>
                        )}
                      </div>
                      {unpaid.length === 0 ? (
                        <p className="mt-1 text-[11px] text-neutral-400">{t('noUnpaidItems')}</p>
                      ) : (
                        <ul className="mt-1 flex flex-col gap-1">
                          {unpaid.map((item, i) => (
                            <li key={i} className="flex items-center justify-between gap-2 text-[11px] text-zinc-700">
                              <span className="min-w-0 flex-1 truncate">
                                {locStr(item.name, item.nameAr, locale)} <span className="text-neutral-400">× {item.qty}</span>
                              </span>
                              <span className="shrink-0 font-medium text-[#026F4F]"><bdi dir="ltr">${(item.price * item.qty).toFixed(2)}</bdi></span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {req.type === 'Check Requested' && (
                        <button
                          onClick={() => alert(t('printReceiptFor', { table: req.table }))}
                          className="flex h-9 w-36 items-center justify-center gap-1 rounded-2xl border border-zinc-400 bg-gray-200 text-sm font-medium text-zinc-800 transition-colors hover:bg-gray-300"
                        >
                          <Printer size={14} />
                          <span>{t('print')}</span>
                        </button>
                      )}
                      <button
                        onClick={() => onHandled(req.id)}
                        className={cn(
                          'flex h-9 items-center justify-center rounded-2xl bg-orange-500 text-sm font-medium text-white shadow-xs transition-colors hover:bg-orange-600',
                          req.type === 'Check Requested' ? 'w-36' : 'w-full',
                        )}
                      >
                        {t('handled')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
