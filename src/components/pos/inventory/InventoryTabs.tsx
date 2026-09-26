'use client';

import { useState } from 'react';
import { Plus, ShoppingCart, ArrowLeftRight, ChevronDown, ReceiptText } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { PrimaryAction, StockPill, TableHead, Field, PillSelect, pillInputClass } from './InventoryShell';

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
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <PrimaryAction icon={<Plus size={20} />} label="Add Ingredient" onClick={onAdd} />
      </div>
      <div className="overflow-hidden rounded-[8px] bg-white">
        <div className="overflow-x-auto">
          <div className="min-w-[680px]">
            <TableHead>
              <div className="grid w-full grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_110px] items-center gap-2 px-2">
                <span>INGREDIENT NAME</span>
                <span>CURRENT STOCK</span>
                <span>AVERAGE PRICE</span>
                <span className="flex items-center gap-1">STATUS <ChevronDown size={12} /></span>
                <span>LAST UPDATED</span>
                <span>ACTIONS</span>
              </div>
            </TableHead>
            <div className="flex flex-col">
              {ingredients.map((ing) => {
                const state = stockStateOf(ing);
                return (
                  <div key={ing.id} className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_110px] items-center gap-2 border-b border-[#F2F2F2] px-6 py-[14px] last:border-0">
                    <span className="truncate text-[15.3px] font-medium leading-[1.4] text-[#2D2F33]">{ing.name}</span>
                    <span className="whitespace-nowrap text-[12.7px] font-medium leading-[1.4] text-black">
                      {ing.qty} / {ing.capacity} <span className="font-normal text-[#989898]">{ing.unit}</span>
                    </span>
                    <span className="whitespace-nowrap text-[12.7px] font-medium leading-[1.4] text-[#026F4F]">
                      ${ing.avgPrice.toFixed(2)}<span className="font-normal text-[#989898]">/{ing.unit}</span>
                    </span>
                    <span><StockPill state={state} /></span>
                    <span className="whitespace-nowrap text-[12.7px] font-normal leading-[1.4] text-[#2D2F33]">{ing.updatedAgo}</span>
                    <span className="flex items-center gap-[7px]">
                      <button
                        onClick={() => onEdit(ing)}
                        aria-label={`Edit ${ing.name}`}
                        className="flex h-[35px] w-[35px] items-center justify-center rounded-[5px] bg-[#E9E9E9] text-[#2D2F33] transition-colors hover:bg-[#E0E0E0]"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                      </button>
                      <button
                        onClick={() => onDelete(ing.id)}
                        aria-label={`Delete ${ing.name}`}
                        className="flex h-[35px] w-[35px] items-center justify-center rounded-[5px] bg-[#E85E5E] text-white transition-colors hover:bg-[#d94a4a]"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                      </button>
                    </span>
                  </div>
                );
              })}
              {ingredients.length === 0 && (
                <p className="px-6 py-10 text-center text-sm text-[#989898]">No ingredients yet. Add your first ingredient.</p>
              )}
            </div>
          </div>
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
  const visible = recipes.filter((r) => (subTab === 'Main Menu Item' ? r.kind === 'main' : r.kind === 'addon'));
  const compact = subTab === 'Add on & Extras';
  return (
    <div className="flex flex-col gap-4">
      {/* Sub tabs */}
      <div className="flex items-center gap-6 border-b border-[#B9B9B9] px-1">
        {(['Main Menu Item', 'Add on & Extras'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={cn(
              'border-b-4 px-4 py-[10px] text-[14px] font-normal leading-[1.4] transition-colors',
              subTab === t ? 'border-[#026F4F] text-[#026F4F]' : 'border-transparent text-[#989898] hover:text-[#2D2F33]',
            )}
          >
            {t}
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
                  <span className={cn('absolute left-[6px] top-[7px] rounded-[5px] px-[7.5px] py-[6px] text-[9px] font-medium leading-[1.4] text-white', available ? 'bg-[#10D935]' : 'bg-[#D91010]')}>
                    {available ? 'AVAILABLE' : 'OUT OF STOCK'}
                  </span>
                </div>
              )}
              {compact && (
                <span className={cn('self-start rounded-[5px] px-[7.5px] py-[6px] text-[9px] font-medium leading-[1.4] text-white', available ? 'bg-[#10D935]' : 'bg-[#D91010]')}>
                  {available ? 'AVAILABLE' : 'OUT OF STOCK'}
                </span>
              )}
              <p className={cn('truncate font-satoshi text-[14.3px] font-medium leading-[1.4] text-[#2D2F33]', compact ? 'mt-[22px]' : 'mt-[8px]')}>{recipe.name}</p>
              <div className="mt-[8px] flex min-h-[53px] flex-col justify-center gap-[9px] rounded-[3.3px] bg-[#F2F2F2] px-[9px] py-[7px]">
                {recipe.maps.length === 0 ? (
                  <span className="text-[10.7px] font-normal leading-[1.4] text-[#989898]">No ingredients mapped</span>
                ) : (
                  (compact ? recipe.maps.slice(0, 1) : recipe.maps).map((m, i) => {
                    const ing = ingredients.find((x) => x.id === m.ingredientId);
                    const bad = m.missing || !ing;
                    return (
                      <div key={i} className="flex items-center justify-between text-[10.7px] leading-[1.4]">
                        <span className={cn('font-normal', bad ? 'text-[#EE2929]' : 'text-[#989898]')}>
                          {ing ? ing.name : 'Missing ingredient'}
                        </span>
                        <span className={cn('font-normal', bad ? 'text-[#EE2929]' : 'text-[#989898]')}>
                          {m.qty} {m.unit}
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
                Edit Recipe
              </button>
            </div>
          );
        })}
        {visible.length === 0 && (
          <p className="py-10 text-center text-sm text-[#989898]">No recipes in this section yet.</p>
        )}
      </div>
    </div>
  );
}

// ─── PURCHASES ────────────────────────────────────────────────────────────────
export function PurchasesTab({ purchases, onLogPurchase }: { purchases: Purchase[]; onLogPurchase: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <PrimaryAction icon={<ShoppingCart size={20} />} label="Log Purchase" onClick={onLogPurchase} />
      </div>
      <div className="overflow-hidden rounded-[8px] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] table-fixed border-collapse">
            <thead>
              <tr className="h-[44px] bg-[#E9E9E9] text-[10.7px] font-medium leading-[1.4] text-[#686868]">
                <th className="w-[150px] pl-6 pr-2 text-right font-medium">ORDER ID/ DATE</th>
                <th className="w-[200px] px-2 text-center font-medium">INGREDIENT</th>
                <th className="w-[150px] px-2 text-center font-medium">QUANTITY BOUGHT</th>
                <th className="w-[110px] px-2 text-center font-medium">TOTAL</th>
                <th className="w-[230px] py-2 pl-2 pr-6 text-left font-medium">SUPPLIER</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id} className="border-b border-[#F2F2F2] last:border-0">
                  <td className="py-[16px] pl-6 pr-2 text-right align-middle">
                    <div className="text-[15.4px] font-medium leading-[1.4] text-[#2D2F33]">{p.id}</div>
                    <div className="mt-[8px] text-[12.7px] font-normal leading-[1.4] text-[#989898]">{p.date}</div>
                  </td>
                  <td className="px-2 py-[16px] text-center align-middle">
                    <div className="truncate text-[15.4px] font-medium leading-[1.4] text-[#2D2F33]">{p.ingredient}</div>
                    <div className="mx-auto mt-[9px] w-fit whitespace-nowrap rounded-[14px] bg-[#B7FABB] px-[7px] py-[4px] text-[9.3px] font-normal leading-[1.4] text-[#218944]">
                      Avg Cost: ${p.avgCost.toFixed(2)}/{p.unit}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-2 py-[16px] text-center align-middle text-[12.7px] font-medium leading-[1.4] text-black">
                    {p.qty} <span className="font-normal text-[#989898]">{p.unit}</span>
                  </td>
                  <td className="px-2 py-[16px] text-center align-middle text-[12px] font-semibold leading-[1.4] text-[#026F4F]">
                    ${p.total.toFixed(2)}
                  </td>
                  <td className="py-[16px] pl-2 pr-6 align-middle">
                    <span className="flex items-center gap-[5px] text-[12.7px] font-normal leading-[1.4] text-[#2D2F33]">
                      <ReceiptText size={16} className="shrink-0 text-[#989898]" />
                      <span className="truncate">{p.supplier}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {purchases.length === 0 && (
            <p className="px-6 py-10 text-center text-sm text-[#989898]">No purchases logged yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TRANSFERS ────────────────────────────────────────────────────────────────
export function TransfersTab({ transfers, onNewTransfer }: { transfers: Transfer[]; onNewTransfer: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <PrimaryAction icon={<ArrowLeftRight size={18} />} label="New Transfer" onClick={onNewTransfer} />
      </div>
      <div className="overflow-hidden rounded-[8px] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] table-fixed border-collapse">
            <thead>
              <tr className="h-[44px] bg-[#E9E9E9] text-[10.7px] font-medium leading-[1.4] text-[#686868]">
                <th className="w-[150px] pl-6 pr-2 text-right font-medium">TRANSFER ID/ DATE</th>
                <th className="w-[170px] px-2 text-center font-medium">INGREDIENT</th>
                <th className="w-[130px] px-2 text-center font-medium">QUANTITY</th>
                <th className="w-[230px] px-2 text-center font-medium">FROM → TO</th>
                <th className="w-[160px] py-2 pl-2 pr-6 text-left font-medium">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((t) => (
                <tr key={t.id} className="border-b border-[#F2F2F2] last:border-0">
                  <td className="py-[16px] pl-6 pr-2 text-right align-middle">
                    <div className="text-[15.4px] font-medium leading-[1.4] text-[#2D2F33]">{t.id}</div>
                    <div className="mt-[8px] text-[12.7px] font-normal leading-[1.4] text-[#989898]">{t.date}</div>
                  </td>
                  <td className="truncate px-2 py-[16px] text-center align-middle text-[15.4px] font-medium leading-[1.4] text-[#2D2F33]">
                    {t.ingredient}
                  </td>
                  <td className="whitespace-nowrap px-2 py-[16px] text-center align-middle text-[12.7px] font-medium leading-[1.4] text-black">
                    {t.qty} <span className="font-normal text-[#989898]">{t.unit}</span>
                  </td>
                  <td className="px-2 py-[16px] text-center align-middle text-[10.7px] font-medium leading-[1.4] text-black">
                    {t.from} → {t.to}
                  </td>
                  <td className="py-[16px] pl-2 pr-6 align-middle">
                    <span className={cn(
                      'inline-flex h-[26.7px] w-[96px] items-center justify-center rounded-[14.7px] px-[10px] text-[10px] font-normal leading-[1.4]',
                      t.status === 'COMPLETED' ? 'bg-[#CEFFD7] text-[#139615]' : 'bg-[#FFF0E6] text-[#E85D00]',
                    )}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transfers.length === 0 && (
            <p className="px-6 py-10 text-center text-sm text-[#989898]">No transfers yet.</p>
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

  const maxV = 100;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[324px_1fr]">
        {/* Log form */}
        <div className="rounded-[12px] bg-white p-[15px]">
          <p className="text-center text-[16px] font-medium leading-[1.4] text-black">Log Physical Count</p>
          <div className="mt-[20px] flex flex-col gap-[23px]">
            <Field label="Quantity">
              <PillSelect
                ariaLabel="Ingredient"
                value={ingredientId}
                onChange={setIngredientId}
                options={['', ...ingredients.map((i) => i.id)]}
              />
            </Field>
            <Field label="Actual Physical Count">
              <input
                value={phys}
                onChange={(e) => setPhys(e.target.value)}
                inputMode="decimal"
                placeholder="$120.00"
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
            Submit Count
          </button>
        </div>

        {/* Variance chart */}
        <div className="min-w-0 rounded-[12px] bg-white p-[15px]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[16px] font-medium leading-[1.4] text-black">Weekly Variance Trend (Spoilage/Overportioning)</p>
            <span className="flex items-center gap-2 rounded-[6px] bg-[rgba(233,233,233,0.42)] px-[18px] py-[6px] font-satoshi text-[16px] text-[#686868]">
              Week <ChevronDown size={14} />
            </span>
          </div>
          {/* Variance chart */}
          <div className="mt-4 overflow-x-auto">
            <div className="min-w-[420px]">
              <div className="flex gap-2">
                {/* Y axis */}
                <div className="flex h-[200px] w-[30px] shrink-0 flex-col justify-between text-right text-[12px] leading-[1] text-[rgba(0,0,0,0.7)]">
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
                              title={`${s.label}: ${s.values[gi]}`}
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
              <div className="ml-[38px] flex justify-around">
                {VARIANCE_DAYS.map((day) => (
                  <span key={day} className="flex-1 text-center text-[12px] text-[rgba(0,0,0,0.7)]">{day}</span>
                ))}
              </div>
            </div>
          </div>
          {/* Legend */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            {VARIANCE_SERIES.map((s) => (
              <span key={s.label} className="flex items-center gap-1 p-1 text-[12px] text-[rgba(0,0,0,0.7)]">
                <span className="h-[12px] w-[12px] border border-white" style={{ backgroundColor: s.color }} />
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Recent counts */}
      <div className="overflow-hidden rounded-[12px] bg-white">
        <p className="px-[22px] pt-[14px] text-[16px] font-medium leading-[1.4] text-black">Recent Counts</p>
        <div className="mt-[14px] overflow-x-auto pb-[18px]">
          <table className="w-full min-w-[620px] table-fixed border-collapse">
            <thead>
              <tr className="h-[40px] bg-[#E9E9E9] text-[10.7px] font-medium leading-[1.4] text-[#686868]">
                <th className="w-[130px] pl-[22px] pr-2 text-right font-medium">DATE</th>
                <th className="w-[190px] px-2 text-left font-medium">INGREDIENT</th>
                <th className="w-[90px] px-2 text-center font-medium">THEO</th>
                <th className="w-[90px] px-2 text-center font-medium">PHYS</th>
                <th className="w-[120px] py-2 pl-2 pr-[22px] text-center font-medium">VARIANCE</th>
              </tr>
            </thead>
            <tbody>
              {counts.map((c) => (
                <tr key={c.id} className="border-b border-[#F7F7F7] last:border-0">
                  <td className="py-[12px] pl-[22px] pr-2 text-right align-middle text-[10.7px] font-medium text-black">{c.date}</td>
                  <td className="truncate px-2 py-[12px] align-middle text-[10.7px] font-medium text-black">{c.ingredient}</td>
                  <td className="px-2 py-[12px] text-center align-middle text-[10.7px] font-medium text-black">{c.theo}</td>
                  <td className="px-2 py-[12px] text-center align-middle text-[10.7px] font-medium text-black">{c.phys}</td>
                  <td className="py-[12px] pl-2 pr-[22px] text-center align-middle text-[10.7px] font-medium text-[#F23232]">{c.phys - c.theo}</td>
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

  const unit = ingredients.find((i) => i.id === ingredientId)?.unit ?? 'pcs';

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[324px_1fr]">
      {/* Log form */}
      <div className="rounded-[12px] bg-white p-[15px]">
        <p className="text-center text-[16px] font-medium leading-[1.4] text-black">Log Wasted Item</p>
        <div className="mt-[20px] flex flex-col gap-[13px]">
          <Field label="Ingredient">
            <PillSelect ariaLabel="Ingredient" value={ingredientId} onChange={setIngredientId} options={ingredients.map((i) => i.id)} />
          </Field>
          <Field label="Quantity Wasted">
            <div className="relative">
              <input
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                inputMode="decimal"
                placeholder="e.g. 2"
                className={cn(pillInputClass, 'h-[41px] pr-[48px]')}
              />
              <span className="absolute right-[14px] top-1/2 -translate-y-1/2 font-satoshi text-[10.7px] text-[#989898]">{unit.toUpperCase()}</span>
            </div>
          </Field>
          <Field label="Reason for Waste">
            <PillSelect ariaLabel="Reason" value={reason} onChange={setReason} options={WASTE_REASONS} />
          </Field>
          <Field label="Responsible">
            <input
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              placeholder="Choose who is responsible for"
              className={cn(pillInputClass, 'h-[41px]')}
            />
          </Field>
          <Field label="Notes (Optional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add Context..."
              rows={3}
              className="h-[74px] w-full resize-none rounded-[9px] bg-[#F2F2F2] p-[11px] font-satoshi text-[10.7px] font-medium leading-[1.4] text-[#2D2F33] outline-none placeholder:text-[#989898] focus:ring-2 focus:ring-[#026F4F]"
            />
          </Field>
        </div>
        <button
          onClick={() => {
            if (!ingredientId || !qty) return;
            onSubmit({ ingredientId, qty: parseFloat(qty) || 0, unit, reason, responsible: responsible || 'Unassigned', notes });
            setQty('');
            setNotes('');
          }}
          className="mt-[20px] flex h-[39px] w-full items-center justify-center rounded-[20px] bg-[#026F4F] text-[12.7px] font-medium leading-[1.4] text-white shadow-[0px_2.7px_5.4px_rgba(0,0,0,0.12)] transition-colors hover:bg-[#015c42]"
        >
          Submit Count
        </button>
      </div>

      {/* History */}
      <div className="min-w-0 overflow-hidden rounded-[12px] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 px-[17px] pt-[14px]">
          <p className="text-[16px] font-medium leading-[1.4] text-black">Waste Log History</p>
          <span className="flex items-center gap-2 rounded-[37px] border border-[#B9B9B9] bg-white px-[12.5px] py-[8px] text-[11.9px] text-[#686868]">
            Per Month <ChevronDown size={12} />
          </span>
        </div>
        <div className="mt-[14px] overflow-x-auto pb-[14px]">
          <table className="w-full min-w-[680px] table-fixed border-collapse">
            <thead>
              <tr className="h-[40px] bg-[#E9E9E9] text-[10.7px] font-medium leading-[1.4] text-[#686868]">
                <th className="w-[110px] pl-[17px] pr-2 text-right font-medium">DATE</th>
                <th className="w-[190px] px-2 text-left font-medium">ITEM</th>
                <th className="w-[110px] px-2 text-center font-medium">QTY WASTED</th>
                <th className="w-[120px] px-2 text-center font-medium">REASON</th>
                <th className="w-[150px] py-2 pl-2 pr-[17px] text-left font-medium">LOGGED BY</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((w) => (
                <tr key={w.id} className="border-b border-[#F7F7F7] last:border-0">
                  <td className="py-[12px] pl-[17px] pr-2 text-right align-middle text-[10.7px] font-medium text-black">{w.date}</td>
                  <td className="px-2 py-[12px] align-middle">
                    <div className="truncate text-[12px] font-medium text-black">{w.item}</div>
                    <div className="mt-[2px] truncate text-[10.7px] font-normal text-[#989898]">{w.note}</div>
                  </td>
                  <td className="whitespace-nowrap px-2 py-[12px] text-center align-middle text-[12px] font-medium text-[#F23232]">{w.qty} {w.unit}</td>
                  <td className="px-2 py-[12px] text-center align-middle text-[10.7px] font-medium text-black">{w.reason}</td>
                  <td className="truncate py-[12px] pl-2 pr-[17px] align-middle text-[12px] font-medium text-[#2D2F33]">{w.loggedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
