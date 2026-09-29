'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Clock, Bell, CheckCircle2, Printer, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBodyScrollLock } from '@/lib/use-body-scroll-lock';
import type { TableRequest } from '@/lib/table-requests';
import { mapEnum, locTimeAgo, locTable } from '@/lib/locale-fields';

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
  useBodyScrollLock(true);
  return (
    <div className="pos-overlay z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="pos-overlay__panel flex max-h-full w-[384px] max-w-full flex-col rounded-lg bg-zinc-100 p-5 shadow-2xl animate-in zoom-in-95 duration-200">
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
          <button onClick={onDismissAll} className="text-xs font-medium text-emerald-700 hover:underline">
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
              {requests.map((req) => (
                <div key={req.id} className="flex h-36 shrink-0 flex-col justify-between rounded-xl bg-white p-3.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl font-medium text-black">{locTable(req.table, locale, tTable)}</span>
                      {req.paymentMethod && (
                        <div className="flex items-center gap-1 rounded-[20px] bg-zinc-100 px-1.5 py-1">
                          <span className={cn('h-2 w-2 rounded-full', req.paymentMethod === 'Card' ? 'bg-yellow-500' : 'bg-green-600')} />
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
                        req.type === 'Check Requested' ? 'w-36' : 'w-72',
                      )}
                    >
                      {t('handled')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
