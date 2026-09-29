'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBodyScrollLock } from '@/lib/use-body-scroll-lock';
import { INV_TABS, type InvTab, type StockState } from './types';

// ─── Page header + horizontal tab bar (Figma 1996:2494) ───────────────────────
export function InventoryHeader({ activeTab, onTabChange }: { activeTab: InvTab; onTabChange: (t: InvTab) => void }) {
  const t = useTranslations('inventory');
  return (
    <div className="flex flex-col gap-[19px]">
      <div className="flex flex-col gap-[3px]">
        <h1 className="text-[26.7px] font-medium leading-[1.4] text-[#2D2F33]">{t('title')}</h1>
        <p className="whitespace-nowrap text-[15.4px] font-normal leading-[1.4] text-[#989898]">
          {t('subtitle')}
        </p>
      </div>
      <div className="max-w-full overflow-x-auto rounded-[33.4px] bg-[#E3E3E3] p-[2.3px]">
        <div className="flex items-center gap-[3.3px]">
          {INV_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={cn(
                'h-[31.4px] w-[121.5px] shrink-0 rounded-[18px] px-[10px] text-center text-[12.7px] leading-[1.4] transition-all',
                activeTab === tab ? 'bg-white font-medium text-[#026F4F] shadow-xs' : 'font-normal text-[#989898] hover:text-[#2D2F33]',
              )}
            >
              {t(`tabs.${tabKey(tab)}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Locale-neutral tab keys for translation lookup.
function tabKey(tab: InvTab): string {
  switch (tab) {
    case 'Stock': return 'stock';
    case 'Recipe': return 'recipe';
    case 'Purchases': return 'purchases';
    case 'Transfers': return 'transfers';
    case 'Physical Count': return 'physicalCount';
    case 'Waste log': return 'wasteLog';
  }
}

// ─── Primary pill action button (top-right of content) ───────────────────────
export function PrimaryAction({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-[39px] shrink-0 items-center gap-[8px] rounded-[85px] bg-[#026F4F] px-[23px] text-[15.4px] font-medium leading-[1.4] text-white shadow-[0px_2.7px_5.4px_rgba(0,0,0,0.12)] transition-colors hover:bg-[#015c42]"
    >
      {icon}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

// ─── Stock status pill ───────────────────────────────────────────────────────
const STOCK_PILL: Record<StockState, string> = {
  'IN STOCK': 'bg-[#E6FFEB] text-[#139615]',
  'LOW STOCK': 'bg-[#FFF0E6] text-[#E85D00]',
  'OUT OF STOCK': 'bg-[#FFE6E6] text-[#961313]',
};

export function StockPill({ state }: { state: StockState }) {
  const t = useTranslations('inventory.stockState');
  const label = state === 'IN STOCK' ? t('in') : state === 'LOW STOCK' ? t('low') : t('out');
  return (
    <span className={cn('inline-flex h-[26.6px] w-[96px] items-center justify-center rounded-[14.7px] px-[10px] text-[10px] font-normal leading-[1.4]', STOCK_PILL[state])}>
      {label}
    </span>
  );
}

// ─── Table header bar ────────────────────────────────────────────────────────
export function TableHead({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[44px] items-center bg-[#E9E9E9] px-4 text-[10.7px] font-medium leading-[1.4] text-[#686868]">
      {children}
    </div>
  );
}

// ─── Drawer shell (right slide-over, Figma drawers) ──────────────────────────
export function Drawer({
  title,
  onBack,
  onCancel,
  onSave,
  saveLabel,
  children,
}: {
  title: string;
  onBack: () => void;
  onCancel: () => void;
  onSave: () => void;
  saveLabel: string;
  children: ReactNode;
}) {
  useBodyScrollLock(true);
  const tCommon = useTranslations('common.actions');
  const tBack = useTranslations('history');
  return (
    <div className="pos-overlay z-50 bg-black/40">
      <aside className="absolute bottom-3 end-3 top-3 flex w-[413px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-[16px] bg-[#F2F2F2] shadow-2xl animate-in slide-in-from-right-8 duration-200">
        {/* Header */}
        <div className="flex items-center gap-3 px-[20px] pt-[33px]">
          <button
            onClick={onBack}
            aria-label={tBack('back')}
            className="flex h-[33px] w-[33px] shrink-0 items-center justify-center rounded-full bg-[#E9E9E9] text-black transition-colors hover:bg-[#E0E0E0]"
          >
            <ArrowLeft size={16} className="rtl:scale-x-[-1]" />
          </button>
          <h2 className="flex-1 text-center text-[22px] font-medium leading-[1.4] text-black">{title}</h2>
          <div className="h-[33px] w-[33px] shrink-0" />
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-[13px] overflow-y-auto px-[20px] pt-[32px]">{children}</div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-[5px] px-[20px] pb-[19px] pt-[13px]">
          <button
            onClick={onCancel}
            className="h-[39px] w-[185px] max-w-[48%] rounded-[20px] border border-[#B9B9B9] bg-[#E9E9E9] font-satoshi text-[12.7px] font-medium leading-[1.4] text-[#2D2F33] transition-colors hover:bg-[#E0E0E0]"
          >
            {tCommon('cancel')}
          </button>
          <button
            onClick={onSave}
            className="h-[39px] w-[185px] max-w-[48%] rounded-[20px] bg-[#026F4F] font-satoshi text-[12.7px] font-medium leading-[1.4] text-white shadow-[0px_2.7px_5.4px_rgba(0,0,0,0.12)] transition-colors hover:bg-[#015c42]"
          >
            {saveLabel}
          </button>
        </div>
      </aside>
    </div>
  );
}

// ─── White form card ─────────────────────────────────────────────────────────
export function FormCard({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-[8.7px] bg-white p-[13px]">
      {title && <p className="mb-[10px] text-[12.7px] font-medium leading-[1.4] text-[#2D2F33]">{title}</p>}
      <div className="flex flex-col gap-[10px]">{children}</div>
    </div>
  );
}

// ─── Labeled pill field ──────────────────────────────────────────────────────
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[5px]">
      <label className="text-[12px] font-medium leading-[1.4] text-[#686868]">{label}</label>
      {children}
    </div>
  );
}

export const pillInputClass =
  'h-[35px] w-full rounded-[58px] bg-[#F2F2F2] px-[11px] font-satoshi text-[12px] font-medium leading-[1.4] text-[#2D2F33] outline-none placeholder:text-[#989898] focus:ring-2 focus:ring-[#026F4F]';

// ─── Pill select (native select styled as Figma pill) ────────────────────────
export function PillSelect({
  value,
  onChange,
  options,
  ariaLabel,
  getLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  ariaLabel?: string;
  /** Optional display label per option value (values stay the stored keys). */
  getLabel?: (value: string) => string;
}) {
  return (
    <div className="relative">
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[35px] w-full appearance-none rounded-[58px] bg-[#F2F2F2] py-[10px] ps-[11px] pe-[32px] font-satoshi text-[12px] font-medium leading-[1.4] text-[#2D2F33] outline-none focus:ring-2 focus:ring-[#026F4F]"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {getLabel ? getLabel(o) : o}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute end-[11px] top-1/2 -translate-y-1/2 text-[#989898]" />
    </div>
  );
}

// ─── Small square icon buttons (edit gray / delete red) ──────────────────────
export function EditBtn({ onClick, label }: { onClick: (e: React.MouseEvent) => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-[35px] w-[35px] items-center justify-center rounded-[5px] bg-[#E9E9E9] text-[#2D2F33] transition-colors hover:bg-[#E0E0E0]"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      </svg>
    </button>
  );
}

export function DeleteBtn({ onClick, label }: { onClick: (e: React.MouseEvent) => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-[35px] w-[35px] items-center justify-center rounded-[5px] bg-[#E85E5E] text-white transition-colors hover:bg-[#d94a4a]"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    </button>
  );
}

// ─── Modal close X ───────────────────────────────────────────────────────────
export function CloseX({ onClick }: { onClick: () => void }) {
  const t = useTranslations('common.actions');
  return (
    <button onClick={onClick} aria-label={t('close')} className="text-black transition-colors hover:text-zinc-500">
      <X size={24} />
    </button>
  );
}
