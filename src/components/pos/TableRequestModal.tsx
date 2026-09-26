'use client';

import { Clock, Bell, CheckCircle2, Printer, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TableRequest } from '@/lib/table-requests';

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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="flex h-[720px] max-h-[calc(100vh-2rem)] w-[384px] max-w-full flex-col rounded-lg bg-zinc-100 p-5 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between border-b border-zinc-400/40 pb-3">
          <span className="text-lg font-medium text-black">Table Request</span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-6 w-6 items-center justify-center rounded-full text-black transition-colors hover:bg-zinc-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-1 text-xs font-normal text-neutral-400">
            <Clock size={14} />
            <span>Sorted by oldest first</span>
          </div>
          <button onClick={onDismissAll} className="text-xs font-medium text-emerald-700 hover:underline">
            Dismiss All
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {requests.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-xs text-neutral-400">
              <CheckCircle2 size={32} className="mb-2 text-[#026F4F]" />
              <span>All table requests have been handled.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {requests.map((req) => (
                <div key={req.id} className="flex h-36 shrink-0 flex-col justify-between rounded-xl bg-white p-3.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl font-medium text-black">{req.table}</span>
                      {req.paymentMethod && (
                        <div className="flex items-center gap-1 rounded-[20px] bg-zinc-100 px-1.5 py-1">
                          <span className={cn('h-2 w-2 rounded-full', req.paymentMethod === 'Card' ? 'bg-yellow-500' : 'bg-green-600')} />
                          <span className="text-[8px] font-normal text-zinc-800">{req.paymentMethod}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs font-normal text-red-600">
                      <Clock size={14} />
                      <span>{req.timeAgo}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {req.type === 'Waiter Requested' ? (
                      <div className="flex items-center gap-1.5 rounded-2xl bg-fuchsia-200 px-2.5 py-1.5 text-xs font-normal text-fuchsia-800">
                        <Bell size={13} />
                        <span>Waiter Requested</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 rounded-2xl bg-blue-100 px-2.5 py-1.5 text-xs font-normal text-blue-900">
                        <CheckCircle2 size={13} />
                        <span>Check Requested</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {req.type === 'Check Requested' && (
                      <button
                        onClick={() => alert(`Printing receipt for ${req.table}`)}
                        className="flex h-9 w-36 items-center justify-center gap-1 rounded-2xl border border-zinc-400 bg-gray-200 text-sm font-medium text-zinc-800 transition-colors hover:bg-gray-300"
                      >
                        <Printer size={14} />
                        <span>Print</span>
                      </button>
                    )}
                    <button
                      onClick={() => onHandled(req.id)}
                      className={cn(
                        'flex h-9 items-center justify-center rounded-2xl bg-orange-500 text-sm font-medium text-white shadow-xs transition-colors hover:bg-orange-600',
                        req.type === 'Check Requested' ? 'w-36' : 'w-72',
                      )}
                    >
                      Handled
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
