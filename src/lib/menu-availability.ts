// Cashier Menu Management (Bug-63) — shared catalog + availability store.
//
// The cashier may ONLY toggle availability (available ↔ unavailable) for:
//   1. menu items, 2. add-ons & extras, 3. customizations (e.g. noodle texture).
// No add/edit/delete, no price changes — that stays in the Owner Dashboard.
//
// Unavailable entries are hidden from ordering (POS order grid + customize
// modal) so they also disappear from the customer-facing menu once the real
// API syncs this map. State persists to localStorage and is shared live
// between the Menu page and the Order page via subscription (same pattern as
// running-orders / shift-session). English data is never overwritten — Arabic
// twins are additive fields picked by locale at render time.

export interface PosMenuItem {
  id: string;
  name: string;
  nameAr?: string;
  category: string;
  price: number;
  emoji: string;
  /** Required single-choice customizations (e.g. noodle texture). */
  options?: string[];
}

export interface PosAddon {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
}

export interface PosOption {
  id: string;
  name: string;
  nameAr?: string;
}

// ─── Catalog (single source of truth — mirrors the Order page menu) ──────────

export const MENU_CATEGORIES = ['All', 'Burgers', 'Ramen', 'Sides', 'Drinks', 'Desserts'] as const;

export const MENU_CATALOG: PosMenuItem[] = [
  { id: 'm1', name: 'Classic Burger', nameAr: 'برجر كلاسيك', category: 'Burgers', price: 15.99, emoji: '🍔' },
  { id: 'm2', name: 'Shoyu Ramen', nameAr: 'رامن شويو', category: 'Ramen', price: 15.99, emoji: '🍜', options: ['Firm (Kata)', 'Medium', 'Soft (Yawa)'] },
  { id: 'm3', name: 'Tonkotsu Ramen', nameAr: 'رامن تونكوتسو', category: 'Ramen', price: 18.99, emoji: '🍜', options: ['Firm (Kata)', 'Medium', 'Soft (Yawa)'] },
  { id: 'm4', name: 'Miso Ramen', nameAr: 'رامن ميسو', category: 'Ramen', price: 16.99, emoji: '🍜', options: ['Firm (Kata)', 'Medium', 'Soft (Yawa)'] },
  { id: 'm5', name: 'Cheese Burger', nameAr: 'برجر بالجبن', category: 'Burgers', price: 17.99, emoji: '🍔' },
  { id: 'm6', name: 'BBQ Bacon Burger', nameAr: 'برجر باربيكي بيكون', category: 'Burgers', price: 19.99, emoji: '🍔' },
  { id: 'm7', name: 'Veggie Burger', nameAr: 'برجر نباتي', category: 'Burgers', price: 14.99, emoji: '🥙' },
  { id: 'm8', name: 'Chicken Burger', nameAr: 'برجر دجاج', category: 'Burgers', price: 16.49, emoji: '🍔' },
  { id: 'm9', name: 'French Fries', nameAr: 'بطاطس مقلية', category: 'Sides', price: 4.99, emoji: '🍟' },
  { id: 'm10', name: 'Onion Rings', nameAr: 'حلقات البصل', category: 'Sides', price: 5.49, emoji: '🧅' },
  { id: 'm11', name: 'Coca-Cola', nameAr: 'كوكا كولا', category: 'Drinks', price: 2.99, emoji: '🥤' },
  { id: 'm12', name: 'Lemonade', nameAr: 'ليموناضة', category: 'Drinks', price: 3.49, emoji: '🍋' },
];

export const ADDON_CATALOG: PosAddon[] = [
  { id: 'addon-mayo', name: 'Mayo', nameAr: 'مايونيز', price: 0.5 },
  { id: 'addon-chili', name: 'Extra Chili', nameAr: 'فلفل إضافي', price: 0.75 },
  { id: 'addon-egg', name: 'Boiled Egg', nameAr: 'بيضة مسلوقة', price: 1.5 },
  { id: 'addon-bamboo', name: 'Bamboo Shoots', nameAr: 'براعم الخيزران', price: 1.25 },
];

export const OPTION_CATALOG: PosOption[] = [
  { id: 'opt-firm', name: 'Firm (Kata)', nameAr: 'قوام صلب (كاتا)' },
  { id: 'opt-medium', name: 'Medium', nameAr: 'متوسط' },
  { id: 'opt-soft', name: 'Soft (Yawa)', nameAr: 'قوام طري (ياوا)' },
];

/** Add-on key used by order-draft MODIFIER_PRICES → availability id. */
export function addonIdForModifier(mod: string): string | null {
  const found = ADDON_CATALOG.find((a) => a.name === mod);
  return found ? found.id : null;
}

/** Customization option name → availability id. */
export function optionIdForName(name: string): string | null {
  const found = OPTION_CATALOG.find((o) => o.name === name);
  return found ? found.id : null;
}

// ─── Availability state ─────────────────────────────────────────────────────

export interface MenuAvailability {
  /** item id → available (absent = true). */
  items: Record<string, boolean>;
  /** addon id → available (absent = true). */
  addons: Record<string, boolean>;
  /** option id → available (absent = true). */
  options: Record<string, boolean>;
}

const KEY = 'pos-menu-availability-v1';

const EMPTY: MenuAvailability = { items: {}, addons: {}, options: {} };

function read(): MenuAvailability {
  if (typeof window === 'undefined') return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw);
    return {
      items: parsed?.items && typeof parsed.items === 'object' ? parsed.items : {},
      addons: parsed?.addons && typeof parsed.addons === 'object' ? parsed.addons : {},
      options: parsed?.options && typeof parsed.options === 'object' ? parsed.options : {},
    };
  } catch {
    return { ...EMPTY };
  }
}

function write(state: MenuAvailability): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage unavailable — toggles apply for this session only
  }
}

type Listener = () => void;
const listeners = new Set<Listener>();

function emit(): void {
  listeners.forEach((l) => l());
}

export function subscribeMenuAvailability(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getMenuAvailability(): MenuAvailability {
  return read();
}

function setEntry(
  scope: keyof MenuAvailability,
  id: string,
  available: boolean,
): MenuAvailability {
  const next = read();
  next[scope] = { ...next[scope], [id]: available };
  write(next);
  emit();
  return next;
}

export function setItemAvailability(id: string, available: boolean): MenuAvailability {
  return setEntry('items', id, available);
}

export function setAddonAvailability(id: string, available: boolean): MenuAvailability {
  return setEntry('addons', id, available);
}

export function setOptionAvailability(id: string, available: boolean): MenuAvailability {
  return setEntry('options', id, available);
}

export function isItemAvailable(id: string, state?: MenuAvailability): boolean {
  const s = state ?? read();
  return s.items[id] !== false;
}

export function isAddonAvailable(id: string, state?: MenuAvailability): boolean {
  const s = state ?? read();
  return s.addons[id] !== false;
}

export function isOptionAvailable(id: string, state?: MenuAvailability): boolean {
  const s = state ?? read();
  return s.options[id] !== false;
}

export function isAddonNameAvailable(name: string, state?: MenuAvailability): boolean {
  const id = addonIdForModifier(name);
  if (!id) return true;
  return isAddonAvailable(id, state);
}

export function isOptionNameAvailable(name: string, state?: MenuAvailability): boolean {
  const id = optionIdForName(name);
  if (!id) return true;
  return isOptionAvailable(id, state);
}

/** Items visible for ordering — unavailable ones are hidden from the customer menu. */
export function getOrderableItems(state?: MenuAvailability): PosMenuItem[] {
  const s = state ?? read();
  return MENU_CATALOG.filter((item) => isItemAvailable(item.id, s));
}

/** Add-on names orderable for the customize modal (names match MODIFIER_PRICES). */
export function getOrderableAddonNames(state?: MenuAvailability): string[] {
  const s = state ?? read();
  return ADDON_CATALOG.filter((a) => isAddonAvailable(a.id, s)).map((a) => a.name);
}

/** Customization option names orderable for the customize modal. */
export function getOrderableOptionNames(all: string[], state?: MenuAvailability): string[] {
  const s = state ?? read();
  return all.filter((name) => isOptionNameAvailable(name, s));
}
