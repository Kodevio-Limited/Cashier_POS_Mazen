// Locale-aware display helpers for POS mock/seed data.
//
// Mock data lives in the stores below (src/lib/*) with parallel Arabic fields
// added next to each English key (name/nameAr, modifier/modifierAr, ...).
// Components call these helpers with the active next-intl locale so the same
// localStorage record renders in the visitor's language. English data is never
// overwritten — Arabic fields are additive, so a record saved before this
// change still renders fine (it just falls back to English until reseeded).

export type Locale = string;

/** Pick `field` or `fieldAr` based on the active locale (ar → *Ar). */
export function localized<T extends Record<string, unknown>>(
  record: T,
  field: string,
  locale: Locale,
): string {
  if (locale === 'ar') {
    const ar = record[`${field}Ar`];
    if (typeof ar === 'string' && ar.length > 0) return ar;
  }
  const value = record[field];
  return typeof value === 'string' ? value : '';
}

/** Localize a plain string that may carry an Arabic twin on the same record. */
export function locStr(en: string, ar: string | undefined, locale: Locale): string {
  return locale === 'ar' && ar ? ar : en;
}

/** Map an enum-ish English value (statuses, types) through a translation key. */
export function mapEnum(en: string, map: Record<string, string>): string {
  return map[en] ?? en;
}

// ─── Enum → translation-key maps (values live in messages/*.json) ────────────

export const ORDER_STATUS_KEY: Record<string, string> = {
  Placed: 'placed',
  Preparing: 'preparing',
  Ready: 'ready',
  Served: 'served',
  Completed: 'completed',
};

export const ORDER_TYPE_KEY: Record<string, string> = {
  'Dine In': 'dineIn',
  Takeaway: 'takeaway',
  Delivery: 'delivery',
};

export const PAY_STATE_KEY: Record<string, string> = {
  Paid: 'paid',
  Refunded: 'refunded',
  Unpaid: 'unpaid',
};

export const FOOTER_STATE_KEY: Record<string, string> = {
  Completed: 'completed',
  Cancelled: 'cancelled',
};

export const REQUEST_TYPE_KEY: Record<string, string> = {
  'Waiter Requested': 'waiterRequested',
  'Check Requested': 'checkRequested',
};

export const PAYMENT_METHOD_KEY: Record<string, string> = {
  Card: 'card',
  Cash: 'cash',
};

export const FLOOR_STATUS_KEY: Record<string, string> = {
  occupied: 'occupied',
  available: 'available',
  reserved: 'reserved',
};

export const ZONE_KEY: Record<string, string> = {
  Indoor: 'indoor',
  Outdoor: 'outdoor',
  Patio: 'patio',
};

/**
 * Localize "Table A05"-style names: the numeric/code suffix stays Latin and
 * direction-isolated, only the leading word is translated (common.table).
 * Non-matching names ("Takeaway #12") pass through untouched.
 */
export function locTable(
  name: string,
  locale: Locale,
  t: (key: string) => string,
): string {
  if (locale !== 'ar') return name;
  const m = name.match(/^Table\s+(.+)$/i);
  if (m) return `${t('table')} ${m[1]}`;
  return name;
}

// ─── Inventory enum → key maps (values live in messages/*.json) ──────────────

/** Unit codes → inventory.units keys (en values mirror the codes). */
export const UNIT_KEY: Record<string, string> = {
  pcs: 'pcs',
  kg: 'kg',
  L: 'l',
  g: 'g',
  ml: 'ml',
  box: 'box',
};

/** Storage locations → inventory.locations keys (stored values stay English). */
export const LOCATIONS_KEY: Record<string, string> = {
  'Downtown (Main)': 'downtownMain',
  Uptown: 'uptown',
  Warehouse: 'warehouse',
};

/** Localize a unit code through inventory.units (falls back to the raw code). */
export function locUnit(unit: string, t: (key: string) => string): string {
  const key = UNIT_KEY[unit];
  return key ? t(`units.${key}`) : unit;
}

/**
 * Localize relative time strings like "33 min ago" / "Just now" that were
 * baked into seed data. Numbers stay Western by design.
 */
export function locTimeAgo(
  value: string,
  locale: Locale,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
): string {
  if (locale !== 'ar') return value;
  const m = value.match(/^(\d+)\s*min(s)?\s*ago$/i);
  if (m) return t('minsAgo', { count: Number(m[1]) });
  if (/^just now$/i.test(value)) return t('justNow');
  return value;
}
