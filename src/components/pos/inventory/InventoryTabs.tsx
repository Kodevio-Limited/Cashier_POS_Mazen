'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronDown, Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { locStr, locTimeAgo, locUnit, LOCATIONS_KEY } from '@/lib/locale-fields';
import {
  stockStateOf,
  recipeAvailable,
  VARIANCE_SERIES,
  VARIANCE_DAYS,
  type Ingredient,
  type Recipe,
  type Purchase,
  type Transfer,
  type CountEntry,
  type WasteEntry,
} from './types';
import { StockPill, Field, PillSelect, pillInputClass, PrimaryAction, EditBtn, DeleteBtn } from './InventoryShell';

// ─── STOCK ────────────────────────────────────────────────────────────────────
export function StockTab({
  ingredients,
  onAdd,
  onEdit,
  onDelete,
}: {
  ingredients: Ingredient[];
  onAdd: () => void;
  onEdit: (ing: Ingredient) => void;
  onDelete: (id: string) => void;
}) {
  const t = useTranslations('inventory');
  const tTime = useTranslations('common.time');
  const locale = useLocale();
  const [search, setSearch] = useState('');
  const filtered = ingredients.filter((i) =>
    locStr(i.name, i.nameAr, locale).toLowerCase().includes(search.trim().toLowerCase()),
  );
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search size={20} className="absolute start-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchIngredients')}
            className="h-12 w-full rounded-xl border border-neutral-200 bg-white ps-12 pe-4 text-base outline-none transition-colors focus:border-emerald-500"
          />
        </div>
        <PrimaryAction icon={<Plus size={20} />} label={t('addIngredient')} onClick={onAdd} />
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[26%]" />
            <col className="w-[15%]" />
            <col className="w-[16%]" />
            <col className="w-[19%]" />
            <col className="w-[24%]" />
          </colgroup>
          <thead>
            <tr className="divide-x divide-[#E0E0E0] border-b border-neutral-100 bg-gray-200">
              <th className="px-3 py-3 text-center text-sm font-medium leading-6 text-stone-500 sm:px-4 sm:text-base lg:px-6 lg:py-4">{t('col.name')}</th>
              <th className="whitespace-nowrap px-3 py-3 text-center text-sm font-medium leading-6 text-stone-500 sm:px-4 sm:text-base lg:px-6 lg:py-4">{t('col.currentStock')}</th>
              <th className="whitespace-nowrap px-3 py-3 text-center text-sm font-medium leading-6 text-stone-500 sm:px-4 sm:text-base lg:px-6 lg:py-4">{t('col.status')}</th>
              <th className="whitespace-nowrap px-3 py-3 text-center text-sm font-medium leading-6 text-stone-500 sm:px-4 sm:text-base lg:px-6 lg:py-4">{t('col.lastUpdated')}</th>
              <th className="whitespace-nowrap px-3 py-3 text-center text-sm font-medium leading-6 text-stone-500 sm:px-4 sm:text-base lg:px-6 lg:py-4">{t('col.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ing) => {
              const state = stockStateOf(ing);
              return (
                <tr key={ing.id} className="divide-x divide-[#F0F0F0] border-b border-neutral-50 transition-colors hover:bg-neutral-50">
                  <td className="px-3 py-3 align-middle sm:px-4 sm:py-4 lg:px-6 lg:py-5">
                    <div className="truncate text-center text-sm font-medium text-zinc-800 sm:text-base">{locStr(ing.name, ing.nameAr, locale)}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-center align-middle text-sm font-medium text-zinc-800 sm:px-4 sm:py-4 sm:text-base lg:px-6 lg:py-5">
                    {ing.qty} / {ing.capacity} <span className="font-normal text-neutral-400">{locUnit(ing.unit, t)}</span>
                  </td>
                  <td className="px-3 py-3 text-center align-middle sm:px-4 sm:py-4 lg:px-6 lg:py-5"><StockPill state={state} /></td>
                  <td className="whitespace-nowrap px-3 py-3 text-center align-middle text-xs text-neutral-500 sm:px-4 sm:py-4 sm:text-sm lg:px-6 lg:py-5">{locTimeAgo(ing.updatedAgo, locale, tTime)}</td>
                  <td className="px-3 py-3 align-middle sm:px-4 sm:py-4 lg:px-6 lg:py-5">
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <EditBtn onClick={() => onEdit(ing)} label={t('editIngredientAria', { name: locStr(ing.name, ing.nameAr, locale) })} />
                      <DeleteBtn onClick={() => onDelete(ing.id)} label={t('deleteIngredientAria', { name: locStr(ing.name, ing.nameAr, locale) })} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-neutral-400">{t('emptyIngredients')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── RECIPE ───────────────────────────────────────────────────────────────────
export function RecipeTab({
  recipes,
  ingredients,
  onEditRecipe,
}: {
  recipes: Recipe[];
  ingredients: Ingredient[];
  onEditRecipe: (r: Recipe) => void;
}) {
  const [subTab, setSubTab] = useState<'Main Menu Item' | 'Add on & Extras'>('Main Menu Item');
  const [search, setSearch] = useState('');
  const t = useTranslations('inventory');
  const locale = useLocale();
  const visible = recipes.filter(
    (r) =>
      (subTab === 'Main Menu Item' ? r.kind === 'main' : r.kind === 'addon') &&
      locStr(r.name, r.nameAr, locale).toLowerCase().includes(search.trim().toLowerCase()),
  );
  const compact = subTab === 'Add on & Extras';

  const ingredientRows = (recipe: Recipe, max: number) =>
    recipe.maps.slice(0, max).map((m, i) => {
      const ing = ingredients.find((x) => x.id === m.ingredientId);
      const bad = m.missing || !ing;
      const cls = bad ? 'text-[#D91010]' : 'text-[#989898]';
      return (
        <div key={i} className="flex items-center justify-between">
          <span className={cls}>{ing ? locStr(ing.name, ing.nameAr, locale) : t('missingIngredient')}</span>
          <span className={cls}>{m.qty} {locUnit(m.unit, t)}</span>
        </div>
      );
    });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search size={20} className="absolute start-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchRecipes')}
            className="h-12 w-full rounded-xl border border-neutral-200 bg-white ps-12 pe-4 text-base outline-none transition-colors focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Sub-tabs: Main Menu Item | Add on & Extras */}
      <div className="flex items-center gap-6 border-b border-[#B9B9B9]">
        {(['Main Menu Item', 'Add on & Extras'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setSubTab(st)}
            className={cn(
              'border-b-2 px-1 pb-3 text-[16px] leading-[1.4] transition-colors',
              subTab === st ? 'border-[#026F4F] font-medium text-[#026F4F]' : 'border-transparent text-[#989898] hover:text-[#2D2F33]',
            )}
          >
            {st === 'Main Menu Item' ? t('subTab.main') : t('subTab.addon')}
          </button>
        ))}
      </div>

      {!compact ? (
        <div className="grid grid-cols-1 justify-items-center gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {visible.map((recipe) => {
            const available = recipeAvailable(recipe, ingredients);
            return (
              <div key={recipe.id} className="flex w-full max-w-[324px] flex-col items-start gap-[21px] overflow-clip rounded-[22.517px] bg-white p-[14.64px]">
                <div className="flex w-full flex-col gap-[11px]">
                  <div className="relative aspect-[295/263] w-full overflow-clip rounded-[11.258px] bg-[#F2F2F2]">
                    <img
                      src="/images/figma/recipe-food.png"
                      alt={locStr(recipe.name, recipe.nameAr, locale)}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className={cn('absolute start-[9px] top-[10px] inline-flex items-center justify-center rounded-[7.881px] px-[11.258px] py-[9.007px]', available ? 'bg-[#10D935]' : 'bg-[#D91010]')}>
                      <span className="text-[13.51px] font-medium leading-[1.4] text-white">{available ? t('stockState.in') : t('stockState.out')}</span>
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-[12px]">
                    <h3 className="w-full truncate font-satoshi text-[21.391px] font-medium leading-[1.4] text-[#2D2F33]">{locStr(recipe.name, recipe.nameAr, locale)}</h3>
                    <div className="relative h-[80px] w-full overflow-clip rounded-[5px] bg-[#F2F2F2]">
                      {recipe.maps.length > 0 ? (
                        <div className="absolute start-1/2 top-[11px] flex w-[93.2%] -translate-x-1/2 flex-col gap-[13px] text-[16px] font-normal leading-[1.4]">
                          {ingredientRows(recipe, 2)}
                        </div>
                      ) : (
                        <div className="absolute start-[13.84px] top-[10.92px] text-[16px] font-normal leading-[1.4] text-[#989898]">{t('noIngredientsMapped')}</div>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onEditRecipe(recipe)}
                  className="flex h-[53px] w-full shrink-0 items-center justify-center whitespace-nowrap rounded-[30px] bg-[#026F4F] text-[19px] font-medium leading-[1.4] text-white shadow-[0px_4px_8.15px_rgba(0,0,0,0.12)] transition-colors hover:bg-emerald-800"
                >
                  {t('editRecipe')}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {visible.map((recipe) => {
            const available = recipeAvailable(recipe, ingredients);
            return (
              <div key={recipe.id} className="flex w-full flex-col gap-[12px] rounded-[22.5px] bg-white p-[13.94px]">
                <span className={cn('inline-flex w-fit items-center justify-center rounded-[7.9px] px-[11.29px] py-[9.03px] text-[13.5px] font-medium leading-[1.4] text-white', available ? 'bg-[#10D935]' : 'bg-[#D91010]')}>
                  {available ? t('stockState.in') : t('stockState.out')}
                </span>
                <h3 className="truncate font-satoshi text-[21.4px] font-medium leading-[1.4] text-[#2D2F33]">{locStr(recipe.name, recipe.nameAr, locale)}</h3>
                <div className="flex min-h-[45px] items-center rounded-[5px] bg-zinc-100 px-[9px]">
                  {recipe.maps.length > 0 ? (
                    <div className="flex w-full items-center justify-between text-[16px] font-normal leading-[1.4]">
                      {ingredientRows(recipe, 1)}
                    </div>
                  ) : (
                    <span className="text-[16px] font-normal leading-[1.4] text-neutral-400">{t('noIngredientsMapped')}</span>
                  )}
                </div>
                <button
                  onClick={() => onEditRecipe(recipe)}
                  className="flex h-[53px] w-full items-center justify-center rounded-[30px] bg-[#026F4F] text-[19px] font-medium leading-[1.4] text-white shadow-[0px_4px_8.15px_rgba(0,0,0,0.12)] transition-colors hover:bg-emerald-800"
                >
                  {t('editRecipe')}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {visible.length === 0 && (
        <p className="py-10 text-center text-sm text-[#989898]">{t('emptyRecipes')}</p>
      )}
    </div>
  );
}

// ─── PURCHASES ────────────────────────────────────────────────────────────────
export function PurchasesTab({ purchases, onLogPurchase }: { purchases: Purchase[]; onLogPurchase: () => void }) {
  const t = useTranslations('inventory');
  const locale = useLocale();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative w-72">
            <Search size={20} className="absolute start-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder={t('searchPurchases')}
              className="h-12 w-full rounded-xl border border-neutral-200 bg-white ps-12 pe-4 text-base outline-none transition-colors focus:border-emerald-500"
            />
          </div>
          <div className="flex h-12 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-neutral-400">
            <span className="text-base">{t('allTime')}</span>
            <ChevronDown size={16} />
          </div>
        </div>
        <PrimaryAction icon={<Plus size={20} />} label={t('logPurchase')} onClick={onLogPurchase} />
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[20%]" />
            <col className="w-[26%]" />
            <col className="w-[16%]" />
            <col className="w-[16%]" />
            <col className="w-[22%]" />
          </colgroup>
          <thead>
            <tr className="divide-x divide-[#E0E0E0] bg-gray-200">
              <th className="whitespace-nowrap px-3 py-3 text-center text-sm font-medium leading-6 text-stone-500 sm:px-4 sm:text-base lg:px-6 lg:py-4">{t('col.orderDate')}</th>
              <th className="px-3 py-3 text-center text-sm font-medium leading-6 text-stone-500 sm:px-4 sm:text-base lg:px-6 lg:py-4">{t('col.ingredient')}</th>
              <th className="whitespace-nowrap px-3 py-3 text-center text-sm font-medium leading-6 text-stone-500 sm:px-4 sm:text-base lg:px-6 lg:py-4">{t('col.qtyBought')}</th>
              <th className="whitespace-nowrap px-3 py-3 text-center text-sm font-medium leading-6 text-stone-500 sm:px-4 sm:text-base lg:px-6 lg:py-4">{t('col.total')}</th>
              <th className="whitespace-nowrap px-3 py-3 text-center text-sm font-medium leading-6 text-stone-500 sm:px-4 sm:text-base lg:px-6 lg:py-4">{t('col.supplier')}</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.id} className="divide-x divide-[#F0F0F0] border-b border-neutral-50 transition-colors hover:bg-neutral-50">
                <td className="whitespace-nowrap px-3 py-3 text-center align-middle sm:px-4 sm:py-4 lg:px-6 lg:py-5">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-sm font-medium leading-6 text-zinc-800 sm:text-base">{p.id}</span>
                    <span className="text-xs leading-5 text-neutral-400 sm:text-sm">{locStr(p.date, p.dateAr, locale)}</span>
                  </div>
                </td>
                <td className="px-3 py-3 align-middle sm:px-4 sm:py-4 lg:px-6 lg:py-5">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="max-w-[150px] truncate text-sm font-medium leading-6 text-zinc-800 sm:max-w-[200px] sm:text-base lg:max-w-none">{locStr(p.ingredient, p.ingredientAr, locale)}</span>
                    <span className="inline-flex whitespace-nowrap rounded-3xl bg-green-200 px-2.5 py-1 text-xs font-normal leading-5 text-green-700 sm:text-sm">
                      {t('avgCost', { price: p.avgCost.toFixed(2), unit: locUnit(p.unit, t) })}
                    </span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-center align-middle text-sm text-neutral-400 sm:px-4 sm:py-4 sm:text-base lg:px-6 lg:py-5">{p.qty} {locUnit(p.unit, t)}</td>
                <td className="whitespace-nowrap px-3 py-3 text-center align-middle sm:px-4 sm:py-4 lg:px-6 lg:py-5">
                  <span className="text-sm font-semibold leading-6 text-emerald-700 sm:text-base"><bdi dir="ltr">${p.total.toFixed(2)}</bdi></span>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-center align-middle sm:px-4 sm:py-4 lg:px-6 lg:py-5">
                  <span className="block max-w-[110px] truncate text-sm font-normal leading-7 text-zinc-800 sm:max-w-[160px] sm:text-base lg:max-w-none">{locStr(p.supplier, p.supplierAr, locale)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── TRANSFERS ────────────────────────────────────────────────────────────────
export function TransfersTab({ transfers, onNewTransfer }: { transfers: Transfer[]; onNewTransfer: () => void }) {
  const t = useTranslations('inventory');
  const tStatus = useTranslations('inventory.transferStatus');
  const tLoc = useTranslations('inventory.locations');
  const locale = useLocale();
  const completed = (s: Transfer['status']) => s === 'COMPLETED';
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-72">
          <Search size={20} className="absolute start-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder={t('searchTransfers')}
            className="h-12 w-full rounded-xl border border-neutral-200 bg-white ps-12 pe-4 text-base outline-none transition-colors focus:border-emerald-500"
          />
        </div>
        <PrimaryAction icon={<Plus size={20} />} label={t('newTransfer')} onClick={onNewTransfer} />
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[18%]" />
            <col className="w-[18%]" />
            <col className="w-[14%]" />
            <col className="w-[18%]" />
            <col className="w-[14%]" />
            <col className="w-[18%]" />
          </colgroup>
          <thead>
            <tr className="divide-x divide-[#E0E0E0] bg-gray-200">
              <th className="whitespace-nowrap px-3 py-3 text-center text-sm font-medium leading-6 text-stone-500 sm:px-4 sm:text-base lg:px-6 lg:py-4">{t('col.transferDate')}</th>
              <th className="px-3 py-3 text-center text-sm font-medium leading-6 text-stone-500 sm:px-4 sm:text-base lg:px-6 lg:py-4">{t('col.ingredient')}</th>
              <th className="whitespace-nowrap px-3 py-3 text-center text-sm font-medium leading-6 text-stone-500 sm:px-4 sm:text-base lg:px-6 lg:py-4">{t('col.qty')}</th>
              <th className="whitespace-nowrap px-3 py-3 text-center text-sm font-medium leading-6 text-stone-500 sm:px-4 sm:text-base lg:px-6 lg:py-4">{t('col.fromTo')}</th>
              <th className="whitespace-nowrap px-3 py-3 text-center text-sm font-medium leading-6 text-stone-500 sm:px-4 sm:text-base lg:px-6 lg:py-4">{t('col.status')}</th>
              <th className="whitespace-nowrap px-3 py-3 text-center text-sm font-medium leading-6 text-stone-500 sm:px-4 sm:text-base lg:px-6 lg:py-4">{t('col.responsible')}</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((tr) => (
              <tr key={tr.id} className="divide-x divide-[#F0F0F0] border-b border-neutral-50 transition-colors hover:bg-neutral-50">
                <td className="whitespace-nowrap px-3 py-3 text-center align-middle sm:px-4 sm:py-4 lg:px-6 lg:py-5">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-sm font-medium leading-6 text-zinc-800 sm:text-base">{tr.id}</span>
                    <span className="text-xs leading-5 text-neutral-400 sm:text-sm">{locStr(tr.date, tr.dateAr, locale)}</span>
                  </div>
                </td>
                <td className="max-w-[110px] truncate px-3 py-3 text-center align-middle text-sm font-medium text-zinc-800 sm:max-w-[160px] sm:px-4 sm:py-4 sm:text-base lg:max-w-none lg:px-6 lg:py-5">
                  {locStr(tr.ingredient, tr.ingredientAr, locale)}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-center align-middle text-sm text-neutral-500 sm:px-4 sm:py-4 sm:text-base lg:px-6 lg:py-5">
                  {tr.qty} {locUnit(tr.unit, t)}
                </td>
                <td className="max-w-[140px] truncate px-3 py-3 text-center align-middle text-sm text-neutral-500 sm:px-4 sm:py-4 sm:text-base lg:max-w-none lg:px-6 lg:py-5">
                  <span dir="auto">
                    {LOCATIONS_KEY[tr.from] ? tLoc(LOCATIONS_KEY[tr.from]) : tr.from} → {LOCATIONS_KEY[tr.to] ? tLoc(LOCATIONS_KEY[tr.to]) : tr.to}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-center align-middle sm:px-4 sm:py-4 lg:px-6 lg:py-5">
                  <span className={cn(
                    'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium',
                    completed(tr.status) ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700',
                  )}>
                    <span className={cn('h-2 w-2 shrink-0 rounded-full', completed(tr.status) ? 'bg-green-500' : 'bg-yellow-500')} />
                    {tStatus(completed(tr.status) ? 'completed' : 'pending')}
                  </span>
                </td>
                <td className="px-3 py-3 text-center align-middle sm:px-4 sm:py-4 lg:px-6 lg:py-5">
                  <span className="block max-w-[140px] truncate text-sm font-medium text-zinc-800 sm:max-w-[180px] sm:text-base lg:max-w-none">{tr.responsible}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── PHYSICAL COUNT ───────────────────────────────────────────────────────────
export function PhysicalCountTab({
  counts,
  ingredients,
  onSubmit,
}: {
  counts: CountEntry[];
  ingredients: Ingredient[];
  onSubmit: (ingredientId: string, phys: number) => void;
}) {
  const [ingredientId, setIngredientId] = useState('');
  const [phys, setPhys] = useState('');
  const t = useTranslations('inventory');
  const locale = useLocale();
  const tDays = useTranslations('inventory.days');
  const tSeries = useTranslations('inventory.series');

  const maxV = 100;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[324px_1fr]">
        {/* Log form */}
        <div className="rounded-xl bg-white p-[15px] shadow-sm">
          <p className="text-center text-[16px] font-medium leading-[1.4] text-black">{t('logPhysicalCount')}</p>
          <div className="mt-[20px] flex flex-col gap-[23px]">
            <Field label={t('col.ingredient')}>
              <PillSelect
                ariaLabel={t('col.ingredient')}
                value={ingredientId}
                onChange={setIngredientId}
                options={['', ...ingredients.map((i) => i.id)]}
                getLabel={(v) => {
                  if (!v) return t('chooseIngredient');
                  const ing = ingredients.find((i) => i.id === v);
                  return ing ? locStr(ing.name, ing.nameAr, locale) : v;
                }}
              />
            </Field>
            <Field label={t('actualPhysicalCount')}>
              <input
                value={phys}
                onChange={(e) => setPhys(e.target.value)}
                inputMode="decimal"
                dir="ltr"
                placeholder="120"
                className={cn(pillInputClass, 'h-[41px]')}
              />
            </Field>
          </div>
          <button
            onClick={() => {
              if (!ingredientId || !phys) return;
              onSubmit(ingredientId, parseFloat(phys) || 0);
              setPhys('');
            }}
            className="mt-[20px] flex h-[39px] w-full items-center justify-center rounded-[20px] bg-[#026F4F] text-[12.7px] font-medium leading-[1.4] text-white shadow-[0px_2.7px_5.4px_rgba(0,0,0,0.12)] transition-colors hover:bg-[#015c42]"
          >
            {t('submitCount')}
          </button>
        </div>

        {/* Variance chart */}
        <div className="min-w-0 rounded-xl bg-white p-[15px] shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[16px] font-medium leading-[1.4] text-black">{t('weeklyVariance')}</p>
            <span className="flex items-center gap-2 rounded-[6px] bg-[rgba(233,233,233,0.42)] px-[18px] py-[6px] font-satoshi text-[16px] text-[#686868]">
              {t('week')} <ChevronDown size={14} />
            </span>
          </div>
          {/* Variance chart */}
          <div className="mt-4 overflow-x-auto">
            <div className="min-w-[420px]">
              <div className="flex gap-2">
                {/* Y axis */}
                <div className="flex h-[200px] w-[30px] shrink-0 flex-col justify-between text-end text-[12px] leading-[1] text-[rgba(0,0,0,0.7)]">
                  {[100, 80, 60, 40, 20, 0].map((v) => (
                    <span key={v}>{v}</span>
                  ))}
                </div>
                {/* Plot */}
                <div className="relative h-[200px] min-w-0 flex-1">
                  {/* grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between py-[2px]">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-px w-full bg-[rgba(0,0,26,0.12)]" />
                    ))}
                  </div>
                  {/* bars */}
                  <div className="absolute inset-0 flex items-stretch justify-around px-2">
                    {VARIANCE_DAYS.map((day, gi) => (
                      <div key={day} className="flex h-full flex-1 items-end justify-center gap-[3px] bg-[rgba(214,219,237,0.18)] px-1">
                        {VARIANCE_SERIES.map((s) => {
                          const pct = Math.min(100, (s.values[gi] / maxV) * 100);
                          return (
                            <div
                              key={s.label}
                              title={`${tSeries(s.label === 'Buns' ? 'buns' : s.label === 'Cheese' ? 'cheese' : 'beef')}: ${s.values[gi]}`}
                              className="w-full max-w-[24px] rounded-t-[2px] opacity-80"
                              style={{ height: `${pct}%`, minHeight: 4, backgroundColor: s.color }}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* X labels */}
              <div className="ms-[38px] flex justify-around">                        {VARIANCE_DAYS.map((day) => (
                  <span key={day} className="flex-1 text-center text-[12px] text-[rgba(0,0,0,0.7)]">{tDays(day.toLowerCase())}</span>
                ))}
              </div>
            </div>
          </div>
          {/* Legend */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            {VARIANCE_SERIES.map((s) => (
              <span key={s.label} className="flex items-center gap-1 p-1 text-[12px] text-[rgba(0,0,0,0.7)]">
                <span className="h-[12px] w-[12px] border border-white" style={{ backgroundColor: s.color }} />
                {tSeries(s.label === 'Buns' ? 'buns' : s.label === 'Cheese' ? 'cheese' : 'beef')}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Recent counts */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <p className="px-[22px] pt-[14px] text-[16px] font-medium leading-[1.4] text-black">{t('recentCounts')}</p>
        <div className="mt-[14px] overflow-x-auto pb-[18px]">
          <table className="w-full min-w-[620px] table-fixed border-collapse">
            <thead>
              <tr className="h-[40px] bg-[#E9E9E9] text-[10.7px] font-medium leading-[1.4] text-[#686868]">
                <th className="w-[130px] ps-[22px] pe-2 text-start font-medium">{t('col.date')}</th>
                <th className="w-[190px] px-2 text-center font-medium">{t('col.ingredient')}</th>
                <th className="w-[90px] px-2 text-center font-medium">{t('col.theo')}</th>
                <th className="w-[90px] px-2 text-center font-medium">{t('col.phys')}</th>
                <th className="w-[120px] py-2 ps-2 pe-[22px] text-center font-medium">{t('col.variance')}</th>
              </tr>
            </thead>
            <tbody>
              {counts.map((c) => (
                <tr key={c.id} className="border-b border-[#F7F7F7] last:border-0">
                  <td className="py-[12px] ps-[22px] pe-2 text-start align-middle text-[10.7px] font-medium text-black">{locStr(c.date, c.dateAr, locale)}</td>
                  <td className="truncate px-2 py-[12px] text-center align-middle text-[10.7px] font-medium text-black">{locStr(c.ingredient, c.ingredientAr, locale)}</td>
                  <td className="px-2 py-[12px] text-center align-middle text-[10.7px] font-medium text-black">{c.theo}</td>
                  <td className="px-2 py-[12px] text-center align-middle text-[10.7px] font-medium text-black">{c.phys}</td>
                  <td className="py-[12px] ps-2 pe-[22px] text-center align-middle text-[10.7px] font-medium text-[#F23232]">{c.phys - c.theo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── WASTE LOG ────────────────────────────────────────────────────────────────
const WASTE_REASONS = ['Burned', 'Spoiled', 'Overportion', 'Expired', 'Dropped'];

function wasteReasonKey(reason: string): string {
  switch (reason) {
    case 'Burned': return 'burned';
    case 'Spoiled': return 'spoiled';
    case 'Overportion': return 'overportion';
    case 'Expired': return 'expired';
    case 'Dropped': return 'dropped';
    default: return 'dropped';
  }
}

export function WasteLogTab({
  entries,
  ingredients,
  onSubmit,
}: {
  entries: WasteEntry[];
  ingredients: Ingredient[];
  onSubmit: (e: { ingredientId: string; qty: number; unit: string; reason: string; responsible: string; notes: string }) => void;
}) {
  const [ingredientId, setIngredientId] = useState(ingredients[0]?.id ?? '');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState(WASTE_REASONS[0]);
  const [responsible, setResponsible] = useState('');
  const [notes, setNotes] = useState('');
  const t = useTranslations('inventory');
  const tReason = useTranslations('inventory.wasteReasons');
  const locale = useLocale();

  const selected = ingredients.find((i) => i.id === ingredientId);
  const unit = selected?.unit ?? 'pcs';

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[324px_1fr]">
      {/* Log form */}
      <div className="rounded-xl bg-white p-[15px] shadow-sm">
        <p className="text-center text-[16px] font-medium leading-[1.4] text-black">{t('logWastedItem')}</p>
        <div className="mt-[20px] flex flex-col gap-[13px]">
          <Field label={t('col.ingredient')}>
            <PillSelect
              ariaLabel={t('col.ingredient')}
              value={ingredientId}
              onChange={setIngredientId}
              options={ingredients.map((i) => i.id)}
              getLabel={(v) => {
                const ing = ingredients.find((i) => i.id === v);
                return ing ? locStr(ing.name, ing.nameAr, locale) : v;
              }}
            />
          </Field>
          <Field label={t('qtyWasted')}>
            <div className="relative">
              <input
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                inputMode="decimal"
                dir="ltr"
                placeholder="2"
                className={cn(pillInputClass, 'h-[41px] pe-[48px]')}
              />
              <span className="absolute end-[14px] top-1/2 -translate-y-1/2 font-satoshi text-[10.7px] text-[#989898]">{locUnit(unit, t).toUpperCase()}</span>
            </div>
          </Field>
          <Field label={t('reasonForWaste')}>
            <PillSelect
              ariaLabel={t('reasonForWaste')}
              value={reason}
              onChange={setReason}
              options={WASTE_REASONS}
              getLabel={(v) => tReason(wasteReasonKey(v))}
            />
          </Field>
          <Field label={t('responsible')}>
            <input
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              placeholder={t('chooseResponsible')}
              className={cn(pillInputClass, 'h-[41px]')}
            />
          </Field>
          <Field label={t('notesOptional')}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('addContext')}
              rows={3}
              className="h-[74px] w-full resize-none rounded-[9px] bg-[#F2F2F2] p-[11px] font-satoshi text-[10.7px] font-medium leading-[1.4] text-[#2D2F33] outline-none placeholder:text-[#989898] focus:ring-2 focus:ring-[#026F4F]"
            />
          </Field>
        </div>
        <button
          onClick={() => {
            if (!ingredientId || !qty) return;
            onSubmit({ ingredientId, qty: parseFloat(qty) || 0, unit, reason, responsible: responsible || t('unassigned'), notes: notes || tReason(wasteReasonKey(reason)) });
            setQty('');
            setNotes('');
          }}
          className="mt-[20px] flex h-[39px] w-full items-center justify-center rounded-[20px] bg-[#026F4F] text-[12.7px] font-medium leading-[1.4] text-white shadow-[0px_2.7px_5.4px_rgba(0,0,0,0.12)] transition-colors hover:bg-[#015c42]"
        >
          {t('submitCount')}
        </button>
      </div>

      {/* History */}
      <div className="min-w-0 overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 px-[17px] pt-[14px]">
          <p className="text-[16px] font-medium leading-[1.4] text-black">{t('wasteLogHistory')}</p>
          <span className="flex items-center gap-2 rounded-[37px] border border-[#B9B9B9] bg-white px-[12.5px] py-[8px] text-[11.9px] text-[#686868]">
            {t('perMonth')} <ChevronDown size={12} />
          </span>
        </div>
        <div className="mt-[14px] overflow-x-auto pb-[14px]">
          <table className="w-full min-w-[680px] table-fixed border-collapse">
            <thead>
              <tr className="h-[40px] bg-[#E9E9E9] text-[10.7px] font-medium leading-[1.4] text-[#686868]">
                <th className="w-[110px] ps-[17px] pe-2 text-start font-medium">{t('col.date')}</th>
                <th className="w-[190px] px-2 text-center font-medium">{t('col.item')}</th>
                <th className="w-[110px] px-2 text-center font-medium">{t('col.qtyWasted')}</th>
                <th className="w-[120px] px-2 text-center font-medium">{t('col.reason')}</th>
                <th className="w-[150px] py-2 ps-2 pe-[17px] text-center font-medium">{t('col.responsible')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((w) => (
                <tr key={w.id} className="border-b border-[#F7F7F7] last:border-0">
                  <td className="py-[12px] ps-[17px] pe-2 text-start align-middle text-[10.7px] font-medium text-black">{locStr(w.date, w.dateAr, locale)}</td>
                  <td className="px-2 py-[12px] text-center align-middle">
                    <div className="truncate text-[12px] font-medium text-black">{locStr(w.item, w.itemAr, locale)}</div>
                    <div className="mt-[2px] truncate text-[10.7px] font-normal text-[#989898]">{locStr(w.note, w.noteAr, locale)}</div>
                  </td>
                  <td className="whitespace-nowrap px-2 py-[12px] text-center align-middle text-[12px] font-medium text-[#F23232]">{w.qty} {locUnit(w.unit, t)}</td>
                  <td className="px-2 py-[12px] text-center align-middle text-[10.7px] font-medium text-black">{tReason(wasteReasonKey(w.reason))}</td>
                  <td className="truncate py-[12px] ps-2 pe-[17px] text-center align-middle text-[12px] font-medium text-[#2D2F33]">{w.loggedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
