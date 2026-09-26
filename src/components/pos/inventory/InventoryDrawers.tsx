'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UNITS, LOCATIONS, compatibleUnits, convertQty, type Ingredient, type RecipeMap } from './types';
import { Drawer, FormCard, Field, PillSelect, pillInputClass } from './InventoryShell';

function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function formatDisplayDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
  const [name, setName] = useState(initial?.name ?? '');
  const [qty, setQty] = useState(initial ? String(initial.qty) : '');
  const [unit, setUnit] = useState(initial?.unit ?? UNITS[0]);
  const [threshold, setThreshold] = useState(initial ? String(initial.threshold) : '');
  const [avgPrice, setAvgPrice] = useState(initial ? String(initial.avgPrice) : '');

  return (
    <Drawer
      title={initial ? 'Edit Ingredient' : 'Add Ingredient'}
      onBack={onBack}
      onCancel={onBack}
      saveLabel="Save"
      onSave={() => {
        if (!name.trim()) return;
        onSave({ name: name.trim(), qty: parseFloat(qty) || 0, unit, threshold: parseFloat(threshold) || 0, avgPrice: parseFloat(avgPrice) || 0 });
      }}
    >
      <FormCard title="Basic Info">
        <Field label="Ingredient Name">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Beef Patties" className={pillInputClass} />
        </Field>
      </FormCard>

      <FormCard title="Stock Tracking">
        <div className="grid grid-cols-2 gap-[17px]">
          <Field label="Initial Quantity">
            <input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="decimal" placeholder="120" className={pillInputClass} />
          </Field>
          <Field label="Unit Type">
            <PillSelect ariaLabel="Unit type" value={unit} onChange={setUnit} options={UNITS} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-[17px]">
          <Field label="Low Stock Threshold">
            <input value={threshold} onChange={(e) => setThreshold(e.target.value)} inputMode="decimal" placeholder="50" className={pillInputClass} />
          </Field>
          <Field label="Average Price ($)">
            <input value={avgPrice} onChange={(e) => setAvgPrice(e.target.value)} inputMode="decimal" placeholder="1.50" className={pillInputClass} />
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
  const [ingredientName, setIngredientName] = useState(ingredients[0]?.name ?? '');
  const [qty, setQty] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [supplier, setSupplier] = useState('');
  const [date, setDate] = useState(todayISO());

  return (
    <Drawer
      title="Log Purchase Order"
      onBack={onBack}
      onCancel={onBack}
      saveLabel="Log Purchase"
      onSave={() => {
        if (!ingredientName || !qty) return;
        onSave({ ingredientName, qty: parseFloat(qty) || 0, totalCost: parseFloat(totalCost) || 0, supplier: supplier.trim() || 'General Supplier', date: formatDisplayDate(date) });
      }}
    >
      <FormCard>
        <Field label="Date">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={pillInputClass} />
        </Field>
        <Field label="Ingredient Name">
          <PillSelect ariaLabel="Ingredient" value={ingredientName} onChange={setIngredientName} options={ingredients.map((i) => i.name)} />
        </Field>
        <div className="grid grid-cols-2 gap-[17px]">
          <Field label="Quantity">
            <input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="decimal" placeholder="120" className={pillInputClass} />
          </Field>
          <Field label="Total Cost ($)">
            <input value={totalCost} onChange={(e) => setTotalCost(e.target.value)} inputMode="decimal" placeholder="$120.00" className={pillInputClass} />
          </Field>
        </div>
        <Field label="Supplier (Optional)">
          <input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="e.g. Metro Meats Co." className={pillInputClass} />
        </Field>
        <p className="text-[8.7px] font-normal leading-[1.4] text-[#52D269]">
          Logging this purchase will automatically update your current stock and recalculate the Average Cost per unit for profit margin tracking.
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
      title="Recipe Mapping"
      onBack={onBack}
      onCancel={onBack}
      saveLabel="Save"
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
          <p className="text-[12.7px] font-medium leading-[1.4] text-[#2D2F33]">Ingredients</p>
          <button
            onClick={() => {
              const first = ingredients[0];
              setRows((prev) => [...prev, { key: Date.now(), ingredientName: first?.name ?? '', qty: '1', unit: first?.unit ?? 'pcs' }]);
            }}
            className="flex items-center gap-1 text-[10.7px] font-medium leading-[1.4] text-[#026F4F]"
          >
            <span className="text-[12.7px]">+</span> Add Row
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
                    ariaLabel="Ingredient"
                    value={row.ingredientName}
                    onChange={(v) =>
                      setRows((prev) =>
                        prev.map((r) => (r.key === row.key ? { ...r, ingredientName: v, unit: stockUnitOf(v) } : r)),
                      )
                    }
                    options={ingredients.map((i) => i.name)}
                  />
                </div>
                <div className="flex items-center gap-[6px]">
                  <input
                    value={row.qty}
                    onChange={(e) => setRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, qty: e.target.value } : r)))}
                    inputMode="decimal"
                    aria-label="Quantity"
                    className={cn('h-[35px] w-[36px] rounded-[58px] px-1 text-center font-satoshi text-[10.7px] font-medium text-[#989898] outline-none focus:ring-2 focus:ring-[#026F4F]', bad ? 'bg-[#FFE6E6]' : 'bg-[#F2F2F2]')}
                  />
                  {units.length > 1 ? (
                    <select
                      value={row.unit}
                      onChange={(e) => setRowUnit(row, e.target.value)}
                      aria-label="Unit"
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
                  aria-label="Remove row"
                  className="shrink-0 text-[#E85E5E] transition-colors hover:text-[#d94a4a]"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            );
          })}
          {rows.length === 0 && (
            <p className="py-2 text-center text-xs text-[#989898]">No ingredients. Add a row to map.</p>
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
  const [ingredientName, setIngredientName] = useState(ingredients[0]?.name ?? '');
  const [qty, setQty] = useState('');
  const [from, setFrom] = useState(LOCATIONS[1]);
  const [to, setTo] = useState(LOCATIONS[0]);
  const [date, setDate] = useState(todayISO());

  return (
    <Drawer
      title="Transfer Stock"
      onBack={onBack}
      onCancel={onBack}
      saveLabel="Save"
      onSave={() => {
        if (!ingredientName || !qty || from === to) return;
        onSave({ ingredientName, qty: parseFloat(qty) || 0, from, to, date: formatDisplayDate(date) });
      }}
    >
      <FormCard>
        <Field label="Date">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={pillInputClass} />
        </Field>
        <Field label="Ingredient Name">
          <PillSelect ariaLabel="Ingredient" value={ingredientName} onChange={setIngredientName} options={ingredients.map((i) => i.name)} />
        </Field>
        <Field label="Quantity">
          <input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="decimal" placeholder="120" className={pillInputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-[17px]">
          <Field label="From Location">
            <PillSelect ariaLabel="From" value={from} onChange={setFrom} options={LOCATIONS} />
          </Field>
          <Field label="To Location">
            <PillSelect ariaLabel="To" value={to} onChange={setTo} options={LOCATIONS} />
          </Field>
        </div>
      </FormCard>
    </Drawer>
  );
}
