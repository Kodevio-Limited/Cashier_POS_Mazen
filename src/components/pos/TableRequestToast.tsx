'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCircle2, X } from 'lucide-react';
import { getRequests, subscribeRequests, type TableRequest } from '@/lib/table-requests';

/** Small transient notification for a newly arrived table request. */
export function TableRequestToast() {
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

  const isWaiter = toast.type === 'Waiter Requested';

  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(new Event('pos-open-table-requests'));
        setToast(null);
      }}
      className="fixed bottom-6 right-6 z-[80] flex w-[320px] max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl bg-white p-4 text-left shadow-[0_8px_30px_rgba(0,0,0,0.18)] ring-1 ring-black/5 animate-in slide-in-from-bottom-4 fade-in duration-300"
    >
      <span
        className={
          isWaiter
            ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fuchsia-100 text-fuchsia-700'
            : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700'
        }
      >
        {isWaiter ? <Bell size={20} /> : <CheckCircle2 size={20} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-[#2D2F33]">New Table Request</span>
          <span className="text-[11px] text-[#989898]">Just now</span>
        </span>
        <span className="mt-0.5 block truncate text-[13px] text-[#686868]">
          <span className="font-medium text-[#026F4F]">{toast.table}</span> · {toast.type}
        </span>
      </span>
      <span
        role="button"
        tabIndex={0}
        aria-label="Dismiss notification"
        onClick={(e) => {
          e.stopPropagation();
          setToast(null);
        }}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#989898] transition-colors hover:bg-zinc-100 hover:text-black"
      >
        <X size={14} />
      </span>
    </button>
  );
}
