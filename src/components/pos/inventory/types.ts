// ─── Inventory Management shared types + seed data ────────────────────────────

export type InvTab = 'Stock' | 'Recipe' | 'Purchases' | 'Transfers' | 'Physical Count' | 'Waste log';

export const INV_TABS: InvTab[] = ['Stock', 'Recipe', 'Purchases', 'Transfers', 'Physical Count', 'Waste log'];

export type StockState = 'IN STOCK' | 'LOW STOCK' | 'OUT OF STOCK';

export interface Ingredient {
  id: string;
  name: string;
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
  emoji: string;
  kind: 'main' | 'addon';
  maps: RecipeMap[];
}

export function recipeAvailable(recipe: Recipe, ingredients: Ingredient[]): boolean {
  if (recipe.maps.length === 0) return true;
  return recipe.maps.every((m) => {
    if (m.missing) return false;
    const ing = ingredients.find((i) => i.id === m.ingredientId);
    return !!ing && ing.qty >= m.qty;
  });
}

export interface Purchase {
  id: string;
  date: string;
  ingredient: string;
  qty: number;
  unit: string;
  avgCost: number;
  total: number;
  supplier: string;
}

export interface Transfer {
  id: string;
  date: string;
  ingredient: string;
  qty: number;
  unit: string;
  from: string;
  to: string;
  status: 'COMPLETED' | 'PENDING';
}

export interface CountEntry {
  id: string;
  date: string;
  ingredient: string;
  theo: number;
  phys: number;
}

export interface WasteEntry {
  id: string;
  date: string;
  item: string;
  note: string;
  qty: number;
  unit: string;
  reason: string;
  loggedBy: string;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

export const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 'ing1', name: 'Beef Patties', qty: 120, capacity: 150, unit: 'pcs', threshold: 50, avgPrice: 1.5, updatedAgo: '10 mins ago' },
  { id: 'ing2', name: 'Chicken Breast', qty: 120, capacity: 150, unit: 'L', threshold: 50, avgPrice: 2.1, updatedAgo: '10 mins ago' },
  { id: 'ing3', name: 'Burger Buns', qty: 70, capacity: 150, unit: 'pcs', threshold: 50, avgPrice: 0.4, updatedAgo: '10 mins ago' },
  { id: 'ing4', name: 'Cheddar Cheese', qty: 120, capacity: 150, unit: 'pcs', threshold: 50, avgPrice: 0.9, updatedAgo: '10 mins ago' },
  { id: 'ing5', name: 'Lettuce', qty: 0, capacity: 150, unit: 'kg', threshold: 50, avgPrice: 0.35, updatedAgo: '10 mins ago' },
  { id: 'ing6', name: 'Tomatoes', qty: 120, capacity: 150, unit: 'pcs', threshold: 50, avgPrice: 0.5, updatedAgo: '10 mins ago' },
];

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'r1',
    name: 'Classic Burger',
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
    emoji: '🍜',
    kind: 'main',
    maps: [
      { ingredientId: 'ing1', qty: 1, unit: 'pcs' },
      { ingredientId: 'ing5', qty: 1, unit: 'pcs', missing: true },
    ],
  },
  { id: 'r3', name: 'Cheese Burger', emoji: '🍔', kind: 'main', maps: [] },
  {
    id: 'r4',
    name: 'Tonkotsu Ramen',
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
    emoji: '🧀',
    kind: 'addon',
    maps: [{ ingredientId: 'ing4', qty: 2, unit: 'pcs' }],
  },
  {
    id: 'a2',
    name: 'Extra Patty',
    emoji: '🥩',
    kind: 'addon',
    maps: [{ ingredientId: 'ing1', qty: 2, unit: 'pcs' }],
  },
  {
    id: 'a3',
    name: 'Avocado Add-on',
    emoji: '🥑',
    kind: 'addon',
    maps: [{ ingredientId: 'ing6', qty: 2, unit: 'pcs' }],
  },
  {
    id: 'a4',
    name: 'Bacon Strips',
    emoji: '🥓',
    kind: 'addon',
    maps: [{ ingredientId: 'ing2', qty: 2, unit: 'pcs' }],
  },
  {
    id: 'a5',
    name: 'Extra Sauce',
    emoji: '🧂',
    kind: 'addon',
    maps: [{ ingredientId: 'ing4', qty: 1, unit: 'pcs' }],
  },
];

export const INITIAL_PURCHASES: Purchase[] = [
  { id: 'PO-886', date: 'Jul 28, 2026', ingredient: 'Beef Patties', qty: 120, unit: 'pcs', avgCost: 1.5, total: 15.99, supplier: 'General Supplier' },
  { id: 'PO-885', date: 'Jul 28, 2026', ingredient: 'Chicken Breast', qty: 80, unit: 'L', avgCost: 2.1, total: 168.0, supplier: 'Metro Meats Co.' },
  { id: 'PO-884', date: 'Jul 27, 2026', ingredient: 'Burger Buns', qty: 200, unit: 'pcs', avgCost: 0.4, total: 80.0, supplier: 'General Supplier' },
  { id: 'PO-883', date: 'Jul 27, 2026', ingredient: 'Cheddar Cheese', qty: 60, unit: 'pcs', avgCost: 0.9, total: 54.0, supplier: 'Dairy Fresh' },
];

export const INITIAL_TRANSFERS: Transfer[] = [
  { id: 'TR-886', date: 'Jul 28, 2026', ingredient: 'Beef Patties', qty: 120, unit: 'pcs', from: 'Uptown', to: 'Downtown (Main)', status: 'COMPLETED' },
  { id: 'TR-885', date: 'Jul 28, 2026', ingredient: 'Burger Buns', qty: 60, unit: 'pcs', from: 'Uptown', to: 'Downtown (Main)', status: 'COMPLETED' },
  { id: 'TR-884', date: 'Jul 27, 2026', ingredient: 'Cheddar Cheese', qty: 40, unit: 'pcs', from: 'Downtown (Main)', to: 'Uptown', status: 'COMPLETED' },
  { id: 'TR-883', date: 'Jul 27, 2026', ingredient: 'Lettuce', qty: 25, unit: 'kg', from: 'Uptown', to: 'Downtown (Main)', status: 'COMPLETED' },
];

export const INITIAL_COUNTS: CountEntry[] = [
  { id: 'c1', date: '2023-10-25', ingredient: 'Beef Patties', theo: 125, phys: 120 },
  { id: 'c2', date: '2023-10-25', ingredient: 'Burger Buns', theo: 90, phys: 88 },
  { id: 'c3', date: '2023-10-25', ingredient: 'Cheddar Cheese', theo: 60, phys: 60 },
  { id: 'c4', date: '2023-10-24', ingredient: 'Lettuce', theo: 40, phys: 32 },
  { id: 'c5', date: '2023-10-24', ingredient: 'Tomatoes', theo: 70, phys: 70 },
  { id: 'c6', date: '2023-10-23', ingredient: 'Chicken Breast', theo: 100, phys: 96 },
];

export const INITIAL_WASTE: WasteEntry[] = [
  { id: 'w1', date: '2023-10-25', item: 'Beef Patties', note: 'Grill was too hot', qty: 3, unit: 'pcs', reason: 'Burned', loggedBy: 'John. D' },
  { id: 'w2', date: '2023-10-25', item: 'Burger Buns', note: 'Left overnight', qty: 5, unit: 'pcs', reason: 'Spoiled', loggedBy: 'John. D' },
  { id: 'w3', date: '2023-10-24', item: 'Lettuce', note: 'Wilted leaves', qty: 2, unit: 'kg', reason: 'Spoiled', loggedBy: 'Sarah J.' },
  { id: 'w4', date: '2023-10-24', item: 'Cheddar Cheese', note: 'Over portioned', qty: 1, unit: 'pcs', reason: 'Overportion', loggedBy: 'John. D' },
];

export const VARIANCE_SERIES = [
  { label: 'Beef Patties', color: '#8979FF', values: [18, 46, 26, 18, 26] },
  { label: 'Buns', color: '#FF928A', values: [37, 78, 31, 23, 27] },
  { label: 'Cheese', color: '#3CC3DF', values: [63, 69, 89, 43, 70] },
];

export const VARIANCE_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export const UNITS = ['pcs', 'kg', 'L', 'g', 'ml', 'box'];
export const LOCATIONS = ['Downtown (Main)', 'Uptown', 'Warehouse'];
