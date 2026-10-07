'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  ChevronDown,
  X,
  Trash2,
  Warehouse,
  ScrollText,
  PackageOpen,
  TrendingUp,
  ClipboardList,
  FileWarning,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBodyScrollLock } from '@/lib/use-body-scroll-lock';
import { INV_TABS, type InvTab, type StockState } from './types';

// ─── Page header + tab bar (Owner Dashboard design) ──────────────────────────
const TAB_ICONS: Record<InvTab, typeof Warehouse> = {
  Stock: Warehouse,
  Recipe: ScrollText,
  Purchases: PackageOpen,
  Transfers: TrendingUp,
  'Physical Count': ClipboardList,
  'Waste log': FileWarning,
};

export function InventoryHeader({ activeTab, onTabChange }: { activeTab: InvTab; onTabChange: (t: InvTab) => void }) {
  const t = useTranslations('inventory');
  return (
    <div className="flex flex-col gap-[20px]">
      <div className="flex flex-col gap-[2px]">
        <h1 className="text-[22px] font-medium leading-[30px] text-[#2D2F33] sm:text-[26px] sm:leading-[36px] xl:text-[30px] xl:leading-[40px]">
          {t('title')}
        </h1>
        <p className="text-[13px] text-[#989898] sm:text-[15px] xl:text-base">{t('subtitle')}</p>
      </div>

      {/* Filter tabs */}
      <div className="inline-flex flex-wrap items-center gap-1.5">
        {INV_TABS.map((tab) => {
          const Icon = TAB_ICONS[tab];
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={cn(
                'inline-flex h-10 items-center justify-center gap-2 rounded-3xl px-4 transition-colors',
                activeTab === tab ? 'bg-white text-emerald-700' : 'text-neutral-400 hover:bg-gray-100',
              )}
            >
              <Icon size={15} />
              <span className="text-center text-sm font-normal leading-5">{t(`tabs.${tabKey(tab)}`)}</span>
            </button>
          );
        })}
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

// ─── Primary pill action button (Owner Dashboard style) ──────────────────────
export function PrimaryAction({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-12 shrink-0 items-center gap-2 rounded-[30px] bg-emerald-700 px-6 text-white transition-colors hover:bg-emerald-800"
    >
      {icon}
      <span className="whitespace-nowrap text-lg font-medium leading-7">{label}</span>
    </button>
  );
}

// ─── Stock status badge (Owner Dashboard style: tinted pill + dot) ───────────
const STOCK_BADGE: Record<StockState, { bg: string; dot: string; text: string }> = {
  'IN STOCK': { bg: 'bg-green-100', dot: 'bg-green-500', text: 'text-green-700' },
  'LOW STOCK': { bg: 'bg-yellow-100', dot: 'bg-yellow-500', text: 'text-yellow-700' },
  'OUT OF STOCK': { bg: 'bg-red-100', dot: 'bg-red-500', text: 'text-red-700' },
};

export function StockPill({ state }: { state: StockState }) {
  const t = useTranslations('inventory.stockState');
  const label = state === 'IN STOCK' ? t('in') : state === 'LOW STOCK' ? t('low') : t('out');
  const s = STOCK_BADGE[state];
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium', s.bg, s.text)}>
      <span className={cn('h-2 w-2 rounded-full', s.dot)} />
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

// ─── Small row action buttons (Owner Dashboard style) ────────────────────────
export function EditBtn({ onClick, label }: { onClick: (e: React.MouseEvent) => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-zinc-100 hover:text-emerald-600"
    >
      <Image src="/images/figma/pencil.svg" alt="" width={18} height={18} className="size-[18px]" />
    </button>
  );
}

export function DeleteBtn({ onClick, label }: { onClick: (e: React.MouseEvent) => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
    >
      <Trash2 size={18} />
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
