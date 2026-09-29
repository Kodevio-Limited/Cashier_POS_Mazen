// ─── Inventory Management shared types + seed data ────────────────────────────
//
// English values are the canonical keys; every display string carries an
// additive `*Ar` twin rendered via locStr() (see src/lib/locale-fields.ts).
// Records saved before this change still render (they fall back to English).

export type InvTab = 'Stock' | 'Recipe' | 'Purchases' | 'Transfers' | 'Physical Count' | 'Waste log';

export const INV_TABS: InvTab[] = ['Stock', 'Recipe', 'Purchases', 'Transfers', 'Physical Count', 'Waste log'];

export type StockState = 'IN STOCK' | 'LOW STOCK' | 'OUT OF STOCK';

export interface Ingredient {
  id: string;
  name: string;
  nameAr?: string;
  qty: number;
  capacity: number;
  unit: string;
  threshold: number;
  /** Average price per unit — editable in Add/Edit, recalculated on purchase log. */
  avgPrice: number;
  updatedAgo: string;
}

export function stockStateOf(ing: Ingredient): StockState {
  if (ing.qty <= 0) return 'OUT OF STOCK';
  if (ing.qty <= ing.threshold) return 'LOW STOCK';
  return 'IN STOCK';
}

export interface RecipeMap {
  ingredientId: string;
  qty: number;
  unit: string;
  missing?: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  nameAr?: string;
  emoji: string;
  kind: 'main' | 'addon';
  maps: RecipeMap[];
}

export function recipeAvailable(recipe: Recipe, ingredients: Ingredient[]): boolean {
  if (recipe.maps.length === 0) return true;
  return recipe.maps.every((m) => {
    if (m.missing) return false;
    const ing = ingredients.find((i) => i.id === m.ingredientId);
    if (!ing) return false;
    // Compare in the ingredient's stock unit (e.g. 500 g against 1 kg stock).
    return ing.qty >= convertQty(m.qty, m.unit, ing.unit);
  });
}

export interface Purchase {
  id: string;
  date: string;
  dateAr?: string;
  ingredient: string;
  ingredientAr?: string;
  qty: number;
  unit: string;
  avgCost: number;
  total: number;
  supplier: string;
  supplierAr?: string;
}

export interface Transfer {
  id: string;
  date: string;
  dateAr?: string;
  ingredient: string;
  ingredientAr?: string;
  qty: number;
  unit: string;
  from: string;
  to: string;
  status: 'COMPLETED' | 'PENDING';
  responsible: string;
}

export interface CountEntry {
  id: string;
  date: string;
  dateAr?: string;
  ingredient: string;
  ingredientAr?: string;
  theo: number;
  phys: number;
}

export interface WasteEntry {
  id: string;
  date: string;
  dateAr?: string;
  item: string;
  itemAr?: string;
  note: string;
  noteAr?: string;
  qty: number;
  unit: string;
  reason: string;
  loggedBy: string;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

export const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 'ing1', name: 'Beef Patties', nameAr: 'أقراص لحم البقر', qty: 120, capacity: 150, unit: 'pcs', threshold: 50, avgPrice: 1.5, updatedAgo: '10 mins ago' },
  { id: 'ing2', name: 'Chicken Breast', nameAr: 'صدور دجاج', qty: 120, capacity: 150, unit: 'L', threshold: 50, avgPrice: 2.1, updatedAgo: '10 mins ago' },
  { id: 'ing3', name: 'Burger Buns', nameAr: 'خبز البرجر', qty: 70, capacity: 150, unit: 'pcs', threshold: 50, avgPrice: 0.4, updatedAgo: '10 mins ago' },
  { id: 'ing4', name: 'Cheddar Cheese', nameAr: 'جبنة شيدر', qty: 120, capacity: 150, unit: 'pcs', threshold: 50, avgPrice: 0.9, updatedAgo: '10 mins ago' },
  { id: 'ing5', name: 'Lettuce', nameAr: 'خس', qty: 0, capacity: 150, unit: 'kg', threshold: 50, avgPrice: 0.35, updatedAgo: '10 mins ago' },
  { id: 'ing6', name: 'Tomatoes', nameAr: 'طماطم', qty: 120, capacity: 150, unit: 'pcs', threshold: 50, avgPrice: 0.5, updatedAgo: '10 mins ago' },
];

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'r1',
    name: 'Classic Burger',
    nameAr: 'برجر كلاسيك',
    emoji: '🍔',
    kind: 'main',
    maps: [
      { ingredientId: 'ing1', qty: 1, unit: 'pcs' },
      { ingredientId: 'ing3', qty: 1, unit: 'pcs' },
    ],
  },
  {
    id: 'r2',
    name: 'Shoyu Ramen',
    nameAr: 'رامن شويو',
    emoji: '🍜',
    kind: 'main',
    maps: [
      { ingredientId: 'ing1', qty: 1, unit: 'pcs' },
      { ingredientId: 'ing5', qty: 1, unit: 'pcs', missing: true },
    ],
  },
  { id: 'r3', name: 'Cheese Burger', nameAr: 'برجر جبن', emoji: '🍔', kind: 'main', maps: [] },
  {
    id: 'r4',
    name: 'Tonkotsu Ramen',
    nameAr: 'رامن تونكوتسو',
    emoji: '🍜',
    kind: 'main',
    maps: [
      { ingredientId: 'ing2', qty: 1, unit: 'L' },
      { ingredientId: 'ing4', qty: 1, unit: 'pcs' },
    ],
  },
  {
    id: 'a1',
    name: 'Extra Cheese (Cheddar)',
    nameAr: 'جبنة شيدر إضافية',
    emoji: '🧀',
    kind: 'addon',
    maps: [{ ingredientId: 'ing4', qty: 2, unit: 'pcs' }],
  },
  {
    id: 'a2',
    name: 'Extra Patty',
    nameAr: 'قرص لحم إضافي',
    emoji: '🥩',
    kind: 'addon',
    maps: [{ ingredientId: 'ing1', qty: 2, unit: 'pcs' }],
  },
  {
    id: 'a3',
    name: 'Avocado Add-on',
    nameAr: 'إضافة أفوكادو',
    emoji: '🥑',
    kind: 'addon',
    maps: [{ ingredientId: 'ing6', qty: 2, unit: 'pcs' }],
  },
  {
    id: 'a4',
    name: 'Bacon Strips',
    nameAr: 'شرائح بيكون',
    emoji: '🥓',
    kind: 'addon',
    maps: [{ ingredientId: 'ing2', qty: 2, unit: 'pcs' }],
  },
  {
    id: 'a5',
    name: 'Extra Sauce',
    nameAr: 'صلصة إضافية',
    emoji: '🧂',
    kind: 'addon',
    maps: [{ ingredientId: 'ing4', qty: 1, unit: 'pcs' }],
  },
];

export const INITIAL_PURCHASES: Purchase[] = [
  { id: 'PO-886', date: 'Jul 28, 2026', dateAr: '28 يوليو 2026', ingredient: 'Beef Patties', ingredientAr: 'أقراص لحم البقر', qty: 120, unit: 'pcs', avgCost: 1.5, total: 15.99, supplier: 'General Supplier', supplierAr: 'المورّد العام' },
  { id: 'PO-885', date: 'Jul 28, 2026', dateAr: '28 يوليو 2026', ingredient: 'Chicken Breast', ingredientAr: 'صدور دجاج', qty: 80, unit: 'L', avgCost: 2.1, total: 168.0, supplier: 'Metro Meats Co.', supplierAr: 'شركة ميترو ميتس' },
  { id: 'PO-884', date: 'Jul 27, 2026', dateAr: '27 يوليو 2026', ingredient: 'Burger Buns', ingredientAr: 'خبز البرجر', qty: 200, unit: 'pcs', avgCost: 0.4, total: 80.0, supplier: 'General Supplier', supplierAr: 'المورّد العام' },
  { id: 'PO-883', date: 'Jul 27, 2026', dateAr: '27 يوليو 2026', ingredient: 'Cheddar Cheese', ingredientAr: 'جبنة شيدر', qty: 60, unit: 'pcs', avgCost: 0.9, total: 54.0, supplier: 'Dairy Fresh', supplierAr: 'ديري فريش' },
];

export const INITIAL_TRANSFERS: Transfer[] = [
  { id: 'TR-886', date: 'Jul 28, 2026', dateAr: '28 يوليو 2026', ingredient: 'Beef Patties', ingredientAr: 'أقراص لحم البقر', qty: 120, unit: 'pcs', from: 'Uptown', to: 'Downtown (Main)', status: 'COMPLETED', responsible: 'John. D' },
  { id: 'TR-885', date: 'Jul 28, 2026', dateAr: '28 يوليو 2026', ingredient: 'Burger Buns', ingredientAr: 'خبز البرجر', qty: 60, unit: 'pcs', from: 'Uptown', to: 'Downtown (Main)', status: 'COMPLETED', responsible: 'Sarah J.' },
  { id: 'TR-884', date: 'Jul 27, 2026', dateAr: '27 يوليو 2026', ingredient: 'Cheddar Cheese', ingredientAr: 'جبنة شيدر', qty: 40, unit: 'pcs', from: 'Downtown (Main)', to: 'Uptown', status: 'COMPLETED', responsible: 'John. D' },
  { id: 'TR-883', date: 'Jul 27, 2026', dateAr: '27 يوليو 2026', ingredient: 'Lettuce', ingredientAr: 'خس', qty: 25, unit: 'kg', from: 'Uptown', to: 'Downtown (Main)', status: 'COMPLETED', responsible: 'Mike T.' },
];

export const INITIAL_COUNTS: CountEntry[] = [
  { id: 'c1', date: '2023-10-25', dateAr: '25 أكتوبر 2023', ingredient: 'Beef Patties', ingredientAr: 'أقراص لحم البقر', theo: 125, phys: 120 },
  { id: 'c2', date: '2023-10-25', dateAr: '25 أكتوبر 2023', ingredient: 'Burger Buns', ingredientAr: 'خبز البرجر', theo: 90, phys: 88 },
  { id: 'c3', date: '2023-10-25', dateAr: '25 أكتوبر 2023', ingredient: 'Cheddar Cheese', ingredientAr: 'جبنة شيدر', theo: 60, phys: 60 },
  { id: 'c4', date: '2023-10-24', dateAr: '24 أكتوبر 2023', ingredient: 'Lettuce', ingredientAr: 'خس', theo: 40, phys: 32 },
  { id: 'c5', date: '2023-10-24', dateAr: '24 أكتوبر 2023', ingredient: 'Tomatoes', ingredientAr: 'طماطم', theo: 70, phys: 70 },
  { id: 'c6', date: '2023-10-23', dateAr: '23 أكتوبر 2023', ingredient: 'Chicken Breast', ingredientAr: 'صدور دجاج', theo: 100, phys: 96 },
];

export const INITIAL_WASTE: WasteEntry[] = [
  { id: 'w1', date: '2023-10-25', dateAr: '25 أكتوبر 2023', item: 'Beef Patties', itemAr: 'أقراص لحم البقر', note: 'Grill was too hot', noteAr: 'كانت الشواية ساخنة جدًا', qty: 3, unit: 'pcs', reason: 'Burned', loggedBy: 'John. D' },
  { id: 'w2', date: '2023-10-25', dateAr: '25 أكتوبر 2023', item: 'Burger Buns', itemAr: 'خبز البرجر', note: 'Left overnight', noteAr: 'تُرك طوال الليل', qty: 5, unit: 'pcs', reason: 'Spoiled', loggedBy: 'John. D' },
  { id: 'w3', date: '2023-10-24', dateAr: '24 أكتوبر 2023', item: 'Lettuce', itemAr: 'خس', note: 'Wilted leaves', noteAr: 'أوراق ذابلة', qty: 2, unit: 'kg', reason: 'Spoiled', loggedBy: 'Sarah J.' },
  { id: 'w4', date: '2023-10-24', dateAr: '24 أكتوبر 2023', item: 'Cheddar Cheese', itemAr: 'جبنة شيدر', note: 'Over portioned', noteAr: 'حصة أكبر من اللازم', qty: 1, unit: 'pcs', reason: 'Overportion', loggedBy: 'John. D' },
];

export const VARIANCE_SERIES = [
  { label: 'Beef Patties', color: '#8979FF', values: [18, 46, 26, 18, 26] },
  { label: 'Buns', color: '#FF928A', values: [37, 78, 31, 23, 27] },
  { label: 'Cheese', color: '#3CC3DF', values: [63, 69, 89, 43, 70] },
];

export const VARIANCE_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export const UNITS = ['pcs', 'kg', 'L', 'g', 'ml', 'box'];
export const LOCATIONS = ['Downtown (Main)', 'Uptown', 'Warehouse'];

// ─── Compatible sub-units ────────────────────────────────────────────────────
// A recipe can measure an ingredient in a sub-unit of its stock unit:
// grams alongside kilograms, millilitres alongside litres.

const UNIT_FACTOR: Record<string, number> = { kg: 1000, g: 1, L: 1000, ml: 1, pcs: 1, box: 1 };

/** Units the cashier may pick for an ingredient stocked in `stockUnit`. */
export function compatibleUnits(stockUnit: string): string[] {
  if (stockUnit === 'kg' || stockUnit === 'g') return ['kg', 'g'];
  if (stockUnit === 'L' || stockUnit === 'ml') return ['L', 'ml'];
  return [stockUnit];
}

/** Convert `qty` from one compatible unit to another (identity if incompatible). */
export function convertQty(qty: number, from: string, to: string): number {
  if (from === to) return qty;
  if (!compatibleUnits(from).includes(to)) return qty;
  const f = UNIT_FACTOR[from] ?? 1;
  const t = UNIT_FACTOR[to] ?? 1;
  return (qty * f) / t;
}
