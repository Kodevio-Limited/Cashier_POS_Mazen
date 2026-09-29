'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { locStr, locUnit, LOCATIONS_KEY } from '@/lib/locale-fields';
import { UNITS, LOCATIONS, compatibleUnits, convertQty, type Ingredient, type RecipeMap } from './types';
import { Drawer, FormCard, Field, PillSelect, pillInputClass } from './InventoryShell';

function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function formatDisplayDate(iso: string, locale: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  // Latin digits in both locales (seed data keeps numbers Western by design).
  return d.toLocaleDateString(locale === 'ar' ? 'ar-u-nu-latn' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function locationLabel(v: string, t: (key: string) => string): string {
  const key = LOCATIONS_KEY[v];
  return key ? t(key) : v;
}

// ─── ADD / EDIT INGREDIENT (Figma 1148:3330) ─────────────────────────────────
export interface IngredientForm {
  name: string;
  qty: number;
  unit: string;
  threshold: number;
  avgPrice: number;
}

export function AddIngredientDrawer({
  initial,
  onBack,
  onSave,
}: {
  initial?: Ingredient;
  onBack: () => void;
  onSave: (f: IngredientForm) => void;
}) {
  const t = useTranslations('inventory');
  const tActions = useTranslations('common.actions');
  const [name, setName] = useState(initial?.name ?? '');
  const [qty, setQty] = useState(initial ? String(initial.qty) : '');
  const [unit, setUnit] = useState(initial?.unit ?? UNITS[0]);
  const [threshold, setThreshold] = useState(initial ? String(initial.threshold) : '');
  const [avgPrice, setAvgPrice] = useState(initial ? String(initial.avgPrice) : '');

  return (
    <Drawer
      title={initial ? t('editIngredient') : t('addIngredient')}
      onBack={onBack}
      onCancel={onBack}
      saveLabel={tActions('save')}
      onSave={() => {
        if (!name.trim()) return;
        onSave({ name: name.trim(), qty: parseFloat(qty) || 0, unit, threshold: parseFloat(threshold) || 0, avgPrice: parseFloat(avgPrice) || 0 });
      }}
    >
      <FormCard title={t('formBasicInfo')}>
        <Field label={t('fieldNameIngredient')}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('phIngredientName')} className={pillInputClass} />
        </Field>
      </FormCard>

      <FormCard title={t('formStockTracking')}>
        <div className="grid grid-cols-2 gap-[17px]">
          <Field label={t('fieldNameInitialQty')}>
            <input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="decimal" placeholder="120" className={pillInputClass} />
          </Field>
          <Field label={t('fieldNameUnitType')}>
            <PillSelect ariaLabel={t('fieldNameUnitType')} value={unit} onChange={setUnit} options={UNITS} getLabel={(u) => locUnit(u, t)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-[17px]">
          <Field label={t('fieldNameThreshold')}>
            <input value={threshold} onChange={(e) => setThreshold(e.target.value)} inputMode="decimal" placeholder="50" className={pillInputClass} />
          </Field>
          <Field label={t('fieldNameAvgPrice')}>
            <input value={avgPrice} onChange={(e) => setAvgPrice(e.target.value)} inputMode="decimal" dir="ltr" placeholder="1.50" className={pillInputClass} />
          </Field>
        </div>
      </FormCard>
    </Drawer>
  );
}

// ─── LOG PURCHASE ORDER (Figma 1148:4163) ────────────────────────────────────
export interface PurchaseForm {
  ingredientName: string;
  qty: number;
  totalCost: number;
  supplier: string;
  date: string;
}

export function LogPurchaseDrawer({
  ingredients,
  onBack,
  onSave,
}: {
  ingredients: Ingredient[];
  onBack: () => void;
  onSave: (f: PurchaseForm) => void;
}) {
  const t = useTranslations('inventory');
  const tActions = useTranslations('common.actions');
  const locale = useLocale();
  const [ingredientName, setIngredientName] = useState(ingredients[0]?.name ?? '');
  const [qty, setQty] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [supplier, setSupplier] = useState('');
  const [date, setDate] = useState(todayISO());

  return (
    <Drawer
      title={t('drawerLogPurchase')}
      onBack={onBack}
      onCancel={onBack}
      saveLabel={t('saveLogPurchase')}
      onSave={() => {
        if (!ingredientName || !qty) return;
        onSave({ ingredientName, qty: parseFloat(qty) || 0, totalCost: parseFloat(totalCost) || 0, supplier: supplier.trim() || t('defaultSupplier'), date: formatDisplayDate(date, locale) });
      }}
    >
      <FormCard>
        <Field label={t('fieldNameDate')}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={pillInputClass} />
        </Field>
        <Field label={t('fieldNameIngredient')}>
          <PillSelect
            ariaLabel={t('fieldNameIngredient')}
            value={ingredientName}
            onChange={setIngredientName}
            options={ingredients.map((i) => i.name)}
            getLabel={(v) => {
              const ing = ingredients.find((i) => i.name === v);
              return ing ? locStr(ing.name, ing.nameAr, locale) : v;
            }}
          />
        </Field>
        <div className="grid grid-cols-2 gap-[17px]">
          <Field label={t('fieldNameQty')}>
            <input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="decimal" placeholder="120" className={pillInputClass} />
          </Field>
          <Field label={t('fieldNameTotalCost')}>
            <input value={totalCost} onChange={(e) => setTotalCost(e.target.value)} inputMode="decimal" dir="ltr" placeholder="$120.00" className={pillInputClass} />
          </Field>
        </div>
        <Field label={t('fieldNameSupplier')}>
          <input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder={t('phSupplier')} className={pillInputClass} />
        </Field>
        <p className="text-[8.7px] font-normal leading-[1.4] text-[#52D269]">
          {t('purchaseHint')}
        </p>
      </FormCard>
    </Drawer>
  );
}

// ─── RECIPE MAPPING (Figma 1220:1318) ────────────────────────────────────────
interface MapRow {
  key: number;
  ingredientName: string;
  qty: string;
  unit: string;
}

export function RecipeMappingDrawer({
  recipeName,
  ingredients,
  initialMaps,
  onBack,
  onSave,
}: {
  recipeName: string;
  ingredients: Ingredient[];
  initialMaps: RecipeMap[];
  onBack: () => void;
  onSave: (maps: RecipeMap[]) => void;
}) {
  const t = useTranslations('inventory');
  const tActions = useTranslations('common.actions');
  const locale = useLocale();
  const nameOf = (id: string) => ingredients.find((i) => i.id === id)?.name ?? '';
  const stockUnitOf = (name: string) => ingredients.find((i) => i.name === name)?.unit ?? 'pcs';
  const [rows, setRows] = useState<MapRow[]>(() => {
    if (initialMaps.length > 0) {
      return initialMaps.map((m, i) => {
        const ing = ingredients.find((x) => x.id === m.ingredientId);
        const stockUnit = ing?.unit ?? 'pcs';
        const unit = compatibleUnits(stockUnit).includes(m.unit) ? m.unit : stockUnit;
        return { key: i, ingredientName: nameOf(m.ingredientId), qty: String(m.qty), unit };
      });
    }
    const first = ingredients[0];
    return [{ key: 0, ingredientName: first?.name ?? '', qty: '1', unit: first?.unit ?? 'pcs' }];
  });

  function setRowUnit(row: MapRow, unit: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== row.key) return r;
        const qtyNum = parseFloat(r.qty);
        const converted = Number.isFinite(qtyNum) ? convertQty(qtyNum, r.unit, unit) : NaN;
        return {
          ...r,
          unit,
          qty: Number.isFinite(converted) ? String(Math.round(converted * 1000) / 1000) : r.qty,
        };
      }),
    );
  }

  function rowBad(row: MapRow): boolean {
    const ing = ingredients.find((i) => i.name === row.ingredientName);
    if (!ing) return true;
    const qtyNum = parseFloat(row.qty) || 0;
    if (ing.qty <= 0) return true;
    // Compare in the ingredient's stock unit (e.g. 500 g against 1 kg stock).
    return convertQty(qtyNum, row.unit, ing.unit) > ing.qty;
  }

  return (
    <Drawer
      title={t('drawerRecipeMapping')}
      onBack={onBack}
      onCancel={onBack}
      saveLabel={tActions('save')}
      onSave={() => {
        const maps: RecipeMap[] = rows
          .filter((r) => r.ingredientName)
          .map((r) => {
            const ing = ingredients.find((i) => i.name === r.ingredientName);
            return {
              ingredientId: ing?.id ?? '',
              qty: parseFloat(r.qty) || 0,
              unit: r.unit,
              missing: !ing || ing.qty <= 0,
            };
          });
        onSave(maps);
      }}
    >
      <p className="text-center font-satoshi text-[14.3px] font-medium leading-[1.4] text-[#2D2F33]">{recipeName}</p>

      <div className="rounded-[8.7px] bg-white p-[12px]">
        <div className="mb-[10px] flex items-center justify-between">
          <p className="text-[12.7px] font-medium leading-[1.4] text-[#2D2F33]">{t('mappingIngredients')}</p>
          <button
            onClick={() => {
              const first = ingredients[0];
              setRows((prev) => [...prev, { key: Date.now(), ingredientName: first?.name ?? '', qty: '1', unit: first?.unit ?? 'pcs' }]);
            }}
            className="flex items-center gap-1 text-[10.7px] font-medium leading-[1.4] text-[#026F4F]"
          >
            <span className="text-[12.7px]">+</span> {t('addRow')}
          </button>
        </div>
        <div className="flex flex-col gap-[10px]">
          {rows.map((row) => {
            const bad = rowBad(row);
            const ing = ingredients.find((i) => i.name === row.ingredientName);
            const units = compatibleUnits(ing?.unit ?? 'pcs');
            return (
              <div key={row.key} className="flex items-center gap-[8px]">
                <div className="min-w-0 flex-1">
                  <PillSelect
                    ariaLabel={t('fieldNameIngredient')}
                    value={row.ingredientName}
                    onChange={(v) =>
                      setRows((prev) =>
                        prev.map((r) => (r.key === row.key ? { ...r, ingredientName: v, unit: stockUnitOf(v) } : r)),
                      )
                    }
                    options={ingredients.map((i) => i.name)}
                    getLabel={(v) => {
                      const sel = ingredients.find((i) => i.name === v);
                      return sel ? locStr(sel.name, sel.nameAr, locale) : v;
                    }}
                  />
                </div>
                <div className="flex items-center gap-[6px]">
                  <input
                    value={row.qty}
                    onChange={(e) => setRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, qty: e.target.value } : r)))}
                    inputMode="decimal"
                    dir="ltr"
                    aria-label={t('qtyAria')}
                    className={cn('h-[35px] w-[36px] rounded-[58px] px-1 text-center font-satoshi text-[10.7px] font-medium text-[#989898] outline-none focus:ring-2 focus:ring-[#026F4F]', bad ? 'bg-[#FFE6E6]' : 'bg-[#F2F2F2]')}
                  />
                  {units.length > 1 ? (
                    <select
                      value={row.unit}
                      onChange={(e) => setRowUnit(row, e.target.value)}
                      aria-label={t('unitAria')}
                      className="h-[35px] shrink-0 cursor-pointer rounded-[58px] bg-[#F2F2F2] px-1 text-center font-satoshi text-[10.7px] font-medium text-[#2D2F33] outline-none focus:ring-2 focus:ring-[#026F4F]"
                    >
                      {units.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="w-[28px] text-[8.7px] font-medium leading-[1.4] text-[#989898]">{row.unit}</span>
                  )}
                </div>
                <button
                  onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                  aria-label={t('removeRowAria')}
                  className="shrink-0 text-[#E85E5E] transition-colors hover:text-[#d94a4a]"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            );
          })}
          {rows.length === 0 && (
            <p className="py-2 text-center text-xs text-[#989898]">{t('emptyMapping')}</p>
          )}
        </div>
      </div>
    </Drawer>
  );
}

// ─── TRANSFER STOCK (same drawer language) ───────────────────────────────────
export interface TransferForm {
  ingredientName: string;
  qty: number;
  from: string;
  to: string;
  date: string;
  responsible: string;
}

export function TransferStockDrawer({
  ingredients,
  onBack,
  onSave,
}: {
  ingredients: Ingredient[];
  onBack: () => void;
  onSave: (f: TransferForm) => void;
}) {
  const t = useTranslations('inventory');
  const tActions = useTranslations('common.actions');
  const tLoc = useTranslations('inventory.locations');
  const locale = useLocale();
  const [ingredientName, setIngredientName] = useState(ingredients[0]?.name ?? '');
  const [qty, setQty] = useState('');
  const [from, setFrom] = useState(LOCATIONS[1]);
  const [to, setTo] = useState(LOCATIONS[0]);
  const [date, setDate] = useState(todayISO());
  const [responsible, setResponsible] = useState('');

  return (
    <Drawer
      title={t('drawerTransferStock')}
      onBack={onBack}
      onCancel={onBack}
      saveLabel={tActions('save')}
      onSave={() => {
        if (!ingredientName || !qty || from === to) return;
        onSave({ ingredientName, qty: parseFloat(qty) || 0, from, to, date: formatDisplayDate(date, locale), responsible: responsible || t('unassigned') });
      }}
    >
      <FormCard>
        <Field label={t('fieldNameDate')}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={pillInputClass} />
        </Field>
        <Field label={t('fieldNameIngredient')}>
          <PillSelect
            ariaLabel={t('fieldNameIngredient')}
            value={ingredientName}
            onChange={setIngredientName}
            options={ingredients.map((i) => i.name)}
            getLabel={(v) => {
              const ing = ingredients.find((i) => i.name === v);
              return ing ? locStr(ing.name, ing.nameAr, locale) : v;
            }}
          />
        </Field>
        <Field label={t('fieldNameQty')}>
          <input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="decimal" placeholder="120" className={pillInputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-[17px]">
          <Field label={t('fieldNameFrom')}>
            <PillSelect ariaLabel={t('ariaFrom')} value={from} onChange={setFrom} options={LOCATIONS} getLabel={(v) => locationLabel(v, tLoc)} />
          </Field>
          <Field label={t('fieldNameTo')}>
            <PillSelect ariaLabel={t('ariaTo')} value={to} onChange={setTo} options={LOCATIONS} getLabel={(v) => locationLabel(v, tLoc)} />
          </Field>
        </div>
        <Field label={t('fieldNameResponsible')}>
          <input value={responsible} onChange={(e) => setResponsible(e.target.value)} placeholder={t('phResponsible')} className={pillInputClass} />
        </Field>
      </FormCard>
    </Drawer>
  );
}
