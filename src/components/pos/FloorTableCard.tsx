'use client';

import { Clock } from 'lucide-react';

export type FloorTableStatus = 'occupied' | 'available' | 'reserved';

const STATUS: Record<FloorTableStatus, { label: string; body: string; badge: string }> = {
  occupied: { label: 'OCCUPIED', body: '#F9EFA8', badge: '#E8AD0D' },
  available: { label: 'AVAILABLE', body: '#A8F9B1', badge: '#1FB711' },
  reserved: { label: 'RESERVED', body: '#C5F0FB', badge: '#0DADE8' },
};

interface FloorTableCardProps {
  name: string;
  zone: string;
  status: FloorTableStatus;
  itemsCount?: number;
  bill?: string;
  time?: string;
  onClick?: () => void;
}

/**
 * Rail-style table card, pixel-matched to Figma Floor Plan (1759:345).
 * Natural size 256 x 198. Status colors: yellow = occupied, green = available, blue = reserved.
 */
export function FloorTableCard({ name, zone, status, itemsCount, bill, time, onClick }: FloorTableCardProps) {
  const { label, body, badge } = STATUS[status];
  const rail = { backgroundColor: body };

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onClick?.();
      }}
      className="relative h-[198px] w-[256px] shrink-0 cursor-pointer transition-transform duration-200 hover:-translate-y-1"
    >
      {/* Top / bottom rails */}
      <div className="absolute left-[63px] top-0 h-[13px] w-[130px] rounded-full border border-[#B9B9B9]" style={rail} />
      <div className="absolute bottom-0 left-[63px] h-[13px] w-[130px] rounded-full border border-[#B9B9B9]" style={rail} />
      {/* Left / right rails */}
      <div className="absolute left-0 top-[34px] h-[130px] w-[13px] rounded-full border border-[#B9B9B9]" style={rail} />
      <div className="absolute right-0 top-[34px] h-[130px] w-[13px] rounded-full border border-[#B9B9B9]" style={rail} />

      {/* Body */}
      <div
        className="absolute left-[21px] top-[21px] h-[155px] w-[214px] overflow-hidden rounded-[8px] border border-[#B9B9B9]"
        style={{ backgroundColor: body }}
      >
        {/* Name + badge */}
        <div className="absolute left-[11px] right-[11px] top-[11px] flex items-center justify-between gap-2">
          <span className="font-satoshi truncate text-[19.5px] font-medium leading-[1.4] text-black">{name}</span>
          <span
            className="flex h-[26px] shrink-0 items-center justify-center whitespace-nowrap rounded-full px-[10px] text-[11px] font-medium leading-[1.4] text-white"
            style={{ backgroundColor: badge }}
          >
            {label}
          </span>
        </div>

        {/* Zone */}
        <p className="absolute left-[11px] top-[44px] text-[13.5px] font-medium leading-[1.4] text-[#989898]">{zone}</p>

        {/* Items (occupied) */}
        {status === 'occupied' && typeof itemsCount === 'number' && (
          <p className="absolute left-[11px] top-[69px] text-[13px] font-medium leading-[1.4] text-[#2D2F33]">
            {itemsCount} Items
          </p>
        )}

        {/* Bill + time (occupied) */}
        {status === 'occupied' && (bill || time) && (
          <div className="absolute inset-x-[11px] bottom-[11px] flex items-center justify-between gap-2">
            {bill && <span className="text-[21px] font-semibold leading-[1.4] text-[#026F4F]">{bill}</span>}
            {time && (
              <span className="flex items-center gap-1">
                <Clock size={21} strokeWidth={1.5} className="shrink-0 text-[#989898]" />
                <span className="whitespace-nowrap text-[15.5px] font-normal leading-[1.4] text-[#989898]">{time}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
