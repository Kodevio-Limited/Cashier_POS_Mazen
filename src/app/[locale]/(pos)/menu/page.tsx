'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { locStr } from '@/lib/locale-fields';
import {
  ADDON_CATALOG,
  MENU_CATALOG,
  MENU_CATEGORIES,
  OPTION_CATALOG,
  getMenuAvailability,
  isAddonAvailable,
  isItemAvailable,
  isOptionAvailable,
  setAddonAvailability,
  setItemAvailability,
  setOptionAvailability,
  subscribeMenuAvailability,
  type MenuAvailability,
} from '@/lib/menu-availability';

type StatusFilter = 'all' | 'available' | 'unavailable';

function AvailabilityToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
        checked ? 'bg-[#026F4F]' : 'bg-[#D9D9D9]',
      )}
    >
      <span
        className={cn(
          'absolute top-[3px] h-[17px] w-[17px] rounded-full bg-white shadow transition-all',
          checked ? 'start-[24px]' : 'start-[3px]',
        )}
      />
    </button>
  );
}

export default function CashierMenuPage() {
  const t = useTranslations('menu');
  const tCat = useTranslations('order.categories');
  const locale = useLocale();

  const [availability, setAvailability] = useState<MenuAvailability>(() => getMenuAvailability());
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setAvailability(getMenuAvailability());
    return subscribeMenuAvailability(() => setAvailability(getMenuAvailability()));
  }, []);

  const filtered = MENU_CATALOG.filter((item) => {
    const available = isItemAvailable(item.id, availability);
    if (status === 'available' && !available) return false;
    if (status === 'unavailable' && available) return false;
    if (activeCategory !== 'All' && item.category !== activeCategory) return false;
    const q = search.trim().toLowerCase();
    if (q) {
      const hay = `${item.name} ${item.nameAr ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const statusTabs: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: t('filters.all') },
    { id: 'available', label: t('filters.available') },
    { id: 'unavailable', label: t('filters.unavailable') },
  ];

  return (
    <div className="flex min-h-[calc(100vh-38px)] flex-col gap-3">
      {/* ── Header card ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-[19px] font-medium leading-7 text-[#2D2F33]">{t('title')}</h1>
        </div>

        {/* Filters — single scrollable line: search + status + categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <div className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-[#F2F2F2] px-4">
            <Search size={14} className="shrink-0 text-[#989898]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-36 bg-transparent text-[13px] text-[#2D2F33] outline-none placeholder:text-[#989898]"
            />
          </div>
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatus(tab.id)}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-200',
                status === tab.id
                  ? 'bg-[#026F4F] text-white shadow-xs'
                  : 'border border-[#E9E9E9] bg-white text-[#686868] hover:border-[#026F4F] hover:text-[#026F4F]',
              )}
            >
              {tab.label}
            </button>
          ))}
          <span aria-hidden className="h-6 w-px shrink-0 bg-[#E9E9E9]" />
          {MENU_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'flex-shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-200',
                activeCategory === cat
                  ? 'bg-[#2D2F33] text-white shadow-xs'
                  : 'border border-[#E9E9E9] bg-white text-[#686868] hover:border-[#026F4F] hover:text-[#026F4F]',
              )}
            >
              {tCat(cat.toLowerCase())}
            </button>
          ))}
        </div>
      </div>

      {/* ── Items grid (toggle-only — no add/edit/delete for cashiers) ── */}
      <div className="rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
        <h2 className="text-[15px] font-medium leading-6 text-[#2D2F33]">{t('items')}</h2>
        {filtered.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-[14px] text-[#989898]">
            {t('noItemsFound')}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map((item) => {
              const available = isItemAvailable(item.id, availability);
              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex flex-col rounded-2xl bg-white p-[7px] outline outline-1 outline-offset-[-1px] transition-all',
                    available ? 'outline-zinc-200/80' : 'outline-[#E85E5E]/40 bg-[#FFF7F7]',
                  )}
                >
                  <div className="relative flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 text-5xl">
                    {item.emoji}
                    <span
                      className={cn(
                        'absolute start-2 top-2 inline-flex items-center rounded-md px-2 py-1 text-[10.5px] font-medium leading-4 text-white',
                        available ? 'bg-[#026F4F]' : 'bg-[#E85E5E]',
                      )}
                    >
                      {available ? t('available') : t('unavailable')}
                    </span>
                  </div>
                  <div className="mt-2 flex w-full flex-col items-start gap-1">
                    <div className="w-full truncate text-base font-medium leading-5 text-zinc-800">
                      {locStr(item.name, item.nameAr, locale)}
                    </div>
                    <div className="w-full text-xs font-normal uppercase leading-4 tracking-wider text-neutral-400">
                      {tCat(item.category.toLowerCase())}
                    </div>
                    <div className="w-full text-base font-medium leading-5 text-emerald-700">
                      ${item.price.toFixed(2)}
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between border-t border-[#E9E9E9] pt-2.5">
                    <span className="text-[12px] font-medium text-[#686868]">
                      {available ? t('available') : t('unavailable')}
                    </span>
                    <AvailabilityToggle
                      checked={available}
                      onChange={(next) => setItemAvailability(item.id, next)}
                      label={`${locStr(item.name, item.nameAr, locale)} — ${t('toggleAria')}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add-ons & Customizations (toggle-only) ─────────────────── */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <h2 className="text-[15px] font-medium leading-6 text-[#2D2F33]">{t('addons')}</h2>
          <p className="mt-0.5 text-[12.5px] font-normal leading-5 text-[#989898]">{t('addonsHint')}</p>
          <div className="mt-3 flex flex-col divide-y divide-[#F2F2F2]">
            {ADDON_CATALOG.map((addon) => {
              const available = isAddonAvailable(addon.id, availability);
              return (
                <div key={addon.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-[14px] font-medium leading-5 text-[#2D2F33]">
                      {locStr(addon.name, addon.nameAr, locale)}
                    </span>
                    <span className="text-[12px] font-normal leading-5 text-[#989898]">
                      + ${addon.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                        available ? 'bg-[#E6F1ED] text-[#026F4F]' : 'bg-[#FFE6E6] text-[#E85E5E]',
                      )}
                    >
                      {available ? t('available') : t('unavailable')}
                    </span>
                    <AvailabilityToggle
                      checked={available}
                      onChange={(next) => setAddonAvailability(addon.id, next)}
                      label={`${locStr(addon.name, addon.nameAr, locale)} — ${t('toggleAria')}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <h2 className="text-[15px] font-medium leading-6 text-[#2D2F33]">{t('customizations')}</h2>
          <p className="mt-0.5 text-[12.5px] font-normal leading-5 text-[#989898]">
            {t('customizationsHint')}
          </p>
          <div className="mt-3 flex flex-col divide-y divide-[#F2F2F2]">
            {OPTION_CATALOG.map((opt) => {
              const available = isOptionAvailable(opt.id, availability);
              return (
                <div key={opt.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-[14px] font-medium leading-5 text-[#2D2F33]">
                      {locStr(opt.name, opt.nameAr, locale)}
                    </span>
                    <span className="text-[12px] font-normal leading-5 text-[#989898]">
                      {t('free')}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                        available ? 'bg-[#E6F1ED] text-[#026F4F]' : 'bg-[#FFE6E6] text-[#E85E5E]',
                      )}
                    >
                      {available ? t('available') : t('unavailable')}
                    </span>
                    <AvailabilityToggle
                      checked={available}
                      onChange={(next) => setOptionAvailability(opt.id, next)}
                      label={`${locStr(opt.name, opt.nameAr, locale)} — ${t('toggleAria')}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
