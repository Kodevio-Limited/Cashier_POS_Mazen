'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Bell, CheckCircle2, Clock } from 'lucide-react';
import { locStr, locTimeAgo } from '@/lib/locale-fields';

export type FloorTableStatus = 'occupied' | 'available' | 'reserved';

export interface TableRequestBadge {
  type: 'Waiter Requested' | 'Check Requested';
  paymentMethod?: 'Card' | 'Cash';
  timeAgo?: string;
}

const STATUS: Record<FloorTableStatus, { body: string; badge: string }> = {
  occupied: { body: '#F9EFA8', badge: '#E8AD0D' },
  available: { body: '#A8F9B1', badge: '#1FB711' },
  reserved: { body: '#C5F0FB', badge: '#0DADE8' },
};

interface FloorTableCardProps {
  name: string;
  zone: string;
  status: FloorTableStatus;
  itemsCount?: number;
  bill?: string;
  time?: string;
  requests?: TableRequestBadge[];
  onClick?: () => void;
}

/**
 * Rail-style table card, pixel-matched to Figma Floor Plan (1759:345).
 * Natural size 256 x 198. Status colors: yellow = occupied, green = available, blue = reserved.
 *
 * Fluid: the card is a `container-type: inline-size` box whose internals are
 * expressed in `cqw` (1% of the card's own width), so every dimension and type
 * size scales from the 256px reference. The grid gives it `minmax(256px, 1fr)`
 * tracks, so it grows to fill wide viewports and stays 256px at narrow ones.
 */
export function FloorTableCard({ name, zone, status, itemsCount, bill, time, requests, onClick }: FloorTableCardProps) {
  const t = useTranslations('floorPlan');
  const tTime = useTranslations('common.time');
  const locale = useLocale();
  const { body, badge } = STATUS[status];
  const statusLabel = t(`status.${status}`).toUpperCase();
  const rail = { backgroundColor: body };
  const waiterCount = (requests ?? []).filter((r) => r.type === 'Waiter Requested').length;
  const checkCount = (requests ?? []).filter((r) => r.type === 'Check Requested').length;
  const zoneLabel = t(`zones.${zone.toLowerCase()}`, { default: zone } as never);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onClick?.();
      }}
      style={{ containerType: 'inline-size' }}
      className="relative aspect-[256/198] w-full min-w-[256px] cursor-pointer transition-transform duration-200 hover:-translate-y-1"
    >
      {/* Active table requests (waiter / check) */}
      {requests && requests.length > 0 && (
        <div className="absolute -end-1 -top-3 z-10 flex flex-col items-end gap-1">
          {waiterCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-fuchsia-600 px-2 py-1 text-[10px] font-semibold text-white shadow-md">
              <Bell size={12} strokeWidth={2.4} />
              <span>{waiterCount > 1 ? `${waiterCount} ` : ''}{t('waiterBadge')}</span>
            </span>
          )}
          {checkCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white shadow-md">
              <CheckCircle2 size={12} strokeWidth={2.4} />
              <span>{checkCount > 1 ? `${checkCount} ` : ''}{t('checkBadge')}</span>
            </span>
          )}
        </div>
      )}

      {/* Top / bottom rails */}
      <div className="absolute left-[24.609cqw] top-0 h-[5.078cqw] w-[50.781cqw] rounded-full border border-[#B9B9B9]" style={rail} />
      <div className="absolute bottom-0 left-[24.609cqw] h-[5.078cqw] w-[50.781cqw] rounded-full border border-[#B9B9B9]" style={rail} />
      {/* Left / right rails */}
      <div className="absolute left-0 top-[13.281cqw] h-[50.781cqw] w-[5.078cqw] rounded-full border border-[#B9B9B9]" style={rail} />
      <div className="absolute right-0 top-[13.281cqw] h-[50.781cqw] w-[5.078cqw] rounded-full border border-[#B9B9B9]" style={rail} />

      {/* Body */}
      <div
        className="absolute left-[8.203cqw] top-[8.203cqw] h-[60.547cqw] w-[83.594cqw] overflow-hidden rounded-[3.125cqw] border border-[#B9B9B9]"
        style={{ backgroundColor: body }}
      >
        {/* Name + badge */}
        <div className="absolute left-[4.297cqw] right-[4.297cqw] top-[4.297cqw] flex items-center justify-between gap-2">
          <span className="font-satoshi truncate text-[7.617cqw] font-medium leading-[1.4] text-black">{name}</span>
          <span
            className="flex h-[10.156cqw] shrink-0 items-center justify-center whitespace-nowrap rounded-full px-[3.906cqw] text-[4.297cqw] font-medium leading-[1.4] text-white"
            style={{ backgroundColor: badge }}
          >
            {statusLabel}
          </span>
        </div>

        {/* Zone */}
        <p className="absolute left-[4.297cqw] top-[17.188cqw] text-[5.273cqw] font-medium leading-[1.4] text-[#989898]">{zoneLabel}</p>

        {/* Items (occupied) */}
        {status === 'occupied' && typeof itemsCount === 'number' && (
          <p className="absolute left-[4.297cqw] top-[26.953cqw] text-[5.078cqw] font-medium leading-[1.4] text-[#2D2F33]">
            {t('itemsOnTable', { count: itemsCount })}
          </p>
        )}

        {/* Bill + time (occupied) */}
        {status === 'occupied' && (bill || time) && (
          <div className="absolute inset-x-[4.297cqw] bottom-[4.297cqw] flex items-center justify-between gap-2">
            {bill && <span className="text-[8.203cqw] font-semibold leading-[1.4] text-[#026F4F]">{bill}</span>}
            {time && (
              <span className="flex items-center gap-1">
                <Clock size={21} strokeWidth={1.5} className="shrink-0 text-[#989898]" />
                <span className="whitespace-nowrap text-[6.055cqw] font-normal leading-[1.4] text-[#989898]">{locTimeAgo(time, locale, tTime)}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
