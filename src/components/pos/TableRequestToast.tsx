'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { getRequests, subscribeRequests, type TableRequest } from '@/lib/table-requests';
import { locTable } from '@/lib/locale-fields';

/** Small transient notification for a newly arrived table request. */
export function TableRequestToast() {
  const t = useTranslations('tableRequests');
  const tTable = useTranslations('common.table');
  const locale = useLocale();
  const [toast, setToast] = useState<TableRequest | null>(null);
  const known = useRef<Set<string> | null>(null);

  useEffect(() => {
    known.current = new Set(getRequests().map((r) => r.id));
    const unsubscribe = subscribeRequests(() => {
      const list = getRequests();
      const fresh = list.filter((r) => !known.current?.has(r.id));
      fresh.forEach((r) => known.current?.add(r.id));
      if (fresh.length > 0) setToast(fresh[fresh.length - 1]);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  // One short line: "Table A05 Waiter" / "Table A05 Check Cash" / "…Check Card".
  const table = locTable(toast.table, locale, tTable);
  const line =
    toast.type === 'Waiter Requested'
      ? t('toastWaiter', { table })
      : toast.paymentMethod === 'Card'
        ? t('toastCheckCard', { table })
        : toast.paymentMethod === 'Cash'
          ? t('toastCheckCash', { table })
          : t('toastCheck', { table });

  return (
    <div className="fixed left-1/2 top-6 z-[80] -translate-x-1/2">
      <button
        type="button"
        onClick={() => {
          window.dispatchEvent(new Event('pos-open-table-requests'));
          setToast(null);
        }}
        className="flex items-center rounded-full bg-white py-2.5 ps-5 pe-8 text-start shadow-[0_8px_30px_rgba(0,0,0,0.18)] ring-1 ring-black/5 animate-in slide-in-from-top-4 fade-in duration-300"
      >
        <span className="whitespace-nowrap text-sm font-semibold text-[#2D2F33]">{line}</span>
      </button>
      {/* Bigger close target, hanging slightly outside the popup */}
      <button
        type="button"
        aria-label={t('dismissToast')}
        onClick={() => setToast(null)}
        className="absolute -end-2.5 -top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#686868] shadow-[0_2px_8px_rgba(0,0,0,0.18)] ring-1 ring-black/10 transition-colors hover:bg-zinc-100 hover:text-black"
      >
        <X size={18} strokeWidth={2.2} />
      </button>
    </div>
  );
}
