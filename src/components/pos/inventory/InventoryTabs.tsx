'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Plus, ShoppingCart, ArrowLeftRight, ChevronDown, ReceiptText } from 'lucide-react';
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
import { PrimaryAction, StockPill, Field, PillSelect, pillInputClass } from './InventoryShell';

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
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <PrimaryAction icon={<Plus size={20} />} label={t('addIngredient')} onClick={onAdd} />
      </div>
      <div className="overflow-hidden rounded-[8px] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] table-fixed border-collapse">
            <thead>
              <tr className="h-[44px] bg-[#E9E9E9] text-[10.7px] font-medium leading-[1.4] text-[#686868]">
                <th className="w-[130px] ps-6 pe-2 text-start font-medium">{t('col.name')}</th>
                <th className="w-[110px] px-2 text-start font-medium">{t('col.currentStock')}</th>
                <th className="w-[110px] px-2 text-start font-medium">{t('col.avgPrice')}</th>
                <th className="w-[110px] px-2 text-center font-medium">{t('col.status')}</th>
                <th className="w-[110px] px-2 text-start font-medium">{t('col.lastUpdated')}</th>
                <th className="w-[110px] py-2 ps-2 pe-6 text-start font-medium">{t('col.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ing) => {
                const state = stockStateOf(ing);
                return (
                  <tr key={ing.id} className="border-b border-[#F2F2F2] last:border-0">
                    <td className="py-[14px] ps-6 pe-2 text-start align-middle">
                      <span className="block truncate text-[15.3px] font-medium leading-[1.4] text-[#2D2F33]">{locStr(ing.name, ing.nameAr, locale)}</span>
                    </td>
                    <td className="px-2 py-[14px] text-start align-middle">
                      <span className="block truncate text-[12.7px] font-medium leading-[1.4] text-black">
                        {ing.qty} / {ing.capacity} <span className="font-normal text-[#989898]">{locUnit(ing.unit, t)}</span>
                      </span>
                    </td>
                    <td className="px-2 py-[14px] text-start align-middle">
                      <span className="block truncate text-[12.7px] font-medium leading-[1.4] text-[#026F4F]">
                        ${ing.avgPrice.toFixed(2)}<span className="font-normal text-[#989898]">/{locUnit(ing.unit, t)}</span>
                      </span>
                    </td>
                    <td className="px-2 py-[14px] text-center align-middle"><StockPill state={state} /></td>
                    <td className="px-2 py-[14px] text-start align-middle">
                      <span className="block truncate text-[12.7px] font-normal leading-[1.4] text-[#2D2F33]">{locTimeAgo(ing.updatedAgo, locale, tTime)}</span>
                    </td>
                    <td className="py-[14px] ps-2 pe-6 text-start align-middle">
                      <span className="flex items-center gap-[7px]">
                        <button
                          onClick={() => onEdit(ing)}
                          aria-label={t('editIngredientAria', { name: locStr(ing.name, ing.nameAr, locale) })}
                          className="flex h-[35px] w-[35px] shrink-0 items-center justify-center rounded-[5px] bg-[#E9E9E9] text-[#2D2F33] transition-colors hover:bg-[#E0E0E0]"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                        </button>
                        <button
                          onClick={() => onDelete(ing.id)}
                          aria-label={t('deleteIngredientAria', { name: locStr(ing.name, ing.nameAr, locale) })}
                          className="flex h-[35px] w-[35px] shrink-0 items-center justify-center rounded-[5px] bg-[#E85E5E] text-white transition-colors hover:bg-[#d94a4a]"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                        </button>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {ingredients.length === 0 && (
            <p className="px-6 py-10 text-center text-sm text-[#989898]">{t('emptyIngredients')}</p>
          )}
        </div>
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
  const t = useTranslations('inventory');
  const locale = useLocale();
  const visible = recipes.filter((r) => (subTab === 'Main Menu Item' ? r.kind === 'main' : r.kind === 'addon'));
  const compact = subTab === 'Add on & Extras';
  return (
    <div className="flex flex-col gap-4">
      {/* Sub tabs */}
      <div className="flex items-center gap-6 border-b border-[#B9B9B9] px-1">
        {(['Main Menu Item', 'Add on & Extras'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setSubTab(st)}
            className={cn(
              'border-b-4 px-4 py-[10px] text-[14px] font-normal leading-[1.4] transition-colors',
              subTab === st ? 'border-[#026F4F] text-[#026F4F]' : 'border-transparent text-[#989898] hover:text-[#2D2F33]',
            )}
          >
            {st === 'Main Menu Item' ? t('subTab.main') : t('subTab.addon')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {visible.map((recipe) => {
          const available = recipeAvailable(recipe, ingredients);
          return (
            <div key={recipe.id} className="flex min-w-0 flex-col rounded-[15px] bg-white p-[10px]">
              {!compact && (
                <div className="relative flex h-[176px] items-center justify-center overflow-hidden rounded-[7.5px] bg-[#F2F2F2] text-[64px]">
                  {recipe.emoji}
                  <span className={cn('absolute start-[6px] top-[7px] rounded-[5px] px-[7.5px] py-[6px] text-[9px] font-medium leading-[1.4] text-white', available ? 'bg-[#10D935]' : 'bg-[#D91010]')}>
                    {available ? t('stockState.in') : t('stockState.out')}
                  </span>
                </div>
              )}
              {compact && (
                <span className={cn('self-start rounded-[5px] px-[7.5px] py-[6px] text-[9px] font-medium leading-[1.4] text-white', available ? 'bg-[#10D935]' : 'bg-[#D91010]')}>
                  {available ? t('stockState.in') : t('stockState.out')}
                </span>
              )}
              <p className={cn('truncate font-satoshi text-[14.3px] font-medium leading-[1.4] text-[#2D2F33]', compact ? 'mt-[22px]' : 'mt-[8px]')}>{locStr(recipe.name, recipe.nameAr, locale)}</p>
              <div className="mt-[8px] flex min-h-[53px] flex-col justify-center gap-[9px] rounded-[3.3px] bg-[#F2F2F2] px-[9px] py-[7px]">
                {recipe.maps.length === 0 ? (
                  <span className="text-[10.7px] font-normal leading-[1.4] text-[#989898]">{t('noIngredientsMapped')}</span>
                ) : (
                  (compact ? recipe.maps.slice(0, 1) : recipe.maps).map((m, i) => {
                    const ing = ingredients.find((x) => x.id === m.ingredientId);
                    const bad = m.missing || !ing;
                    return (
                      <div key={i} className="flex items-center justify-between text-[10.7px] leading-[1.4]">
                        <span className={cn('font-normal', bad ? 'text-[#EE2929]' : 'text-[#989898]')}>
                          {ing ? locStr(ing.name, ing.nameAr, locale) : t('missingIngredient')}
                        </span>
                        <span className={cn('font-normal', bad ? 'text-[#EE2929]' : 'text-[#989898]')}>
                          {m.qty} {locUnit(m.unit, t)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
              <button
                onClick={() => onEditRecipe(recipe)}
                className="mt-[14px] flex h-[35px] w-full items-center justify-center rounded-[30px] bg-[#026F4F] text-[12.7px] font-medium leading-[1.4] text-white shadow-[0px_2.7px_5.4px_rgba(0,0,0,0.12)] transition-colors hover:bg-[#015c42]"
              >
                {t('editRecipe')}
              </button>
            </div>
          );
        })}
        {visible.length === 0 && (
          <p className="py-10 text-center text-sm text-[#989898]">{t('emptyRecipes')}</p>
        )}
      </div>
    </div>
  );
}

// ─── PURCHASES ────────────────────────────────────────────────────────────────
export function PurchasesTab({ purchases, onLogPurchase }: { purchases: Purchase[]; onLogPurchase: () => void }) {
  const t = useTranslations('inventory');
  const locale = useLocale();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <PrimaryAction icon={<ShoppingCart size={20} />} label={t('logPurchase')} onClick={onLogPurchase} />
      </div>
      <div className="overflow-hidden rounded-[8px] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] table-fixed border-collapse">
            <thead>
              <tr className="h-[44px] bg-[#E9E9E9] text-[10.7px] font-medium leading-[1.4] text-[#686868]">
                <th className="w-[150px] ps-6 pe-2 text-start font-medium">{t('col.orderDate')}</th>
                <th className="w-[200px] px-2 text-center font-medium">{t('col.ingredient')}</th>
                <th className="w-[150px] px-2 text-center font-medium">{t('col.qtyBought')}</th>
                <th className="w-[110px] px-2 text-center font-medium">{t('col.total')}</th>
                <th className="w-[230px] py-2 ps-2 pe-6 text-center font-medium">{t('col.supplier')}</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id} className="border-b border-[#F2F2F2] last:border-0">
                  <td className="py-[16px] ps-6 pe-2 text-start align-middle">
                    <div className="text-[15.4px] font-medium leading-[1.4] text-[#2D2F33]">{p.id}</div>
                    <div className="mt-[8px] text-[12.7px] font-normal leading-[1.4] text-[#989898]">{locStr(p.date, p.dateAr, locale)}</div>
                  </td>
                  <td className="px-2 py-[16px] text-center align-middle">
                    <div className="truncate text-[15.4px] font-medium leading-[1.4] text-[#2D2F33]">{locStr(p.ingredient, p.ingredientAr, locale)}</div>
                    <div className="mx-auto mt-[9px] w-fit whitespace-nowrap rounded-[14px] bg-[#B7FABB] px-[7px] py-[4px] text-[9.3px] font-normal leading-[1.4] text-[#218944]">
                      {t('avgCost', { price: p.avgCost.toFixed(2), unit: locUnit(p.unit, t) })}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-2 py-[16px] text-center align-middle text-[12.7px] font-medium leading-[1.4] text-black">
                    {p.qty} <span className="font-normal text-[#989898]">{locUnit(p.unit, t)}</span>
                  </td>
                  <td className="px-2 py-[16px] text-center align-middle text-[12px] font-semibold leading-[1.4] text-[#026F4F]">
                    ${p.total.toFixed(2)}
                  </td>
                  <td className="py-[16px] ps-2 pe-6 text-center align-middle">
                    <span className="inline-flex items-center justify-center gap-[5px] text-[12.7px] font-normal leading-[1.4] text-[#2D2F33]">
                      <ReceiptText size={16} className="shrink-0 text-[#989898]" />
                      <span className="truncate">{locStr(p.supplier, p.supplierAr, locale)}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {purchases.length === 0 && (
            <p className="px-6 py-10 text-center text-sm text-[#989898]">{t('emptyPurchases')}</p>
          )}
        </div>
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
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <PrimaryAction icon={<ArrowLeftRight size={18} />} label={t('newTransfer')} onClick={onNewTransfer} />
      </div>
      <div className="overflow-hidden rounded-[8px] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[990px] table-fixed border-collapse">
            <thead>
              <tr className="h-[44px] bg-[#E9E9E9] text-[10.7px] font-medium leading-[1.4] text-[#686868]">
                <th className="w-[150px] ps-6 pe-2 text-start font-medium">{t('col.transferDate')}</th>
                <th className="w-[170px] px-2 text-center font-medium">{t('col.ingredient')}</th>
                <th className="w-[130px] px-2 text-center font-medium">{t('col.qty')}</th>
                <th className="w-[230px] px-2 text-center font-medium">{t('col.fromTo')}</th>
                <th className="w-[130px] px-2 text-center font-medium">{t('col.status')}</th>
                <th className="w-[180px] py-2 ps-2 pe-6 text-center font-medium">{t('col.responsible')}</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((tr) => (
                <tr key={tr.id} className="border-b border-[#F2F2F2] last:border-0">
                  <td className="py-[16px] ps-6 pe-2 text-start align-middle">
                    <div className="text-[15.4px] font-medium leading-[1.4] text-[#2D2F33]">{tr.id}</div>
                    <div className="mt-[8px] text-[12.7px] font-normal leading-[1.4] text-[#989898]">{locStr(tr.date, tr.dateAr, locale)}</div>
                  </td>
                  <td className="truncate px-2 py-[16px] text-center align-middle text-[15.4px] font-medium leading-[1.4] text-[#2D2F33]">
                    {locStr(tr.ingredient, tr.ingredientAr, locale)}
                  </td>
                  <td className="whitespace-nowrap px-2 py-[16px] text-center align-middle text-[12.7px] font-medium leading-[1.4] text-black">
                    {tr.qty} <span className="font-normal text-[#989898]">{locUnit(tr.unit, t)}</span>
                  </td>
                  <td className="px-2 py-[16px] text-center align-middle text-[10.7px] font-medium leading-[1.4] text-black">
                    <span dir="auto">
                      {LOCATIONS_KEY[tr.from] ? tLoc(LOCATIONS_KEY[tr.from]) : tr.from} → {LOCATIONS_KEY[tr.to] ? tLoc(LOCATIONS_KEY[tr.to]) : tr.to}
                    </span>
                  </td>
                  <td className="px-2 py-[16px] text-center align-middle">
                    <span className={cn(
                      'inline-flex h-[26.7px] w-[96px] items-center justify-center rounded-[14.7px] px-[10px] text-[10px] font-normal leading-[1.4]',
                      tr.status === 'COMPLETED' ? 'bg-[#CEFFD7] text-[#139615]' : 'bg-[#FFF0E6] text-[#E85D00]',
                    )}>
                      {tStatus(tr.status === 'COMPLETED' ? 'completed' : 'pending')}
                    </span>
                  </td>
                  <td className="truncate py-[16px] ps-2 pe-6 text-center align-middle text-[12.7px] font-medium text-[#2D2F33]">
                    {tr.responsible}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transfers.length === 0 && (
            <p className="px-6 py-10 text-center text-sm text-[#989898]">{t('emptyTransfers')}</p>
          )}
        </div>
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
        <div className="rounded-[12px] bg-white p-[15px]">
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
        <div className="min-w-0 rounded-[12px] bg-white p-[15px]">
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
      <div className="overflow-hidden rounded-[12px] bg-white">
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
      <div className="rounded-[12px] bg-white p-[15px]">
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
      <div className="min-w-0 overflow-hidden rounded-[12px] bg-white">
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
