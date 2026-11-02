// Single source of truth for money in the Cashier POS.
//
// The restaurant bills in Egyptian Pounds, so every amount rendered anywhere
// in the app goes through `money()` / `moneySigned()` instead of hand-writing a
// currency symbol at each call site. Digits stay Western (the app's mock data
// and AR locale deliberately keep Latin numerals), and the "EGP" label travels
// with the number so an amount can never be read as another currency.

export const CURRENCY_CODE = 'EGP';
/** Short label shown next to amounts. */
export const CURRENCY_LABEL = 'EGP';

/** Format an amount as `EGP 12.34`. */
export function money(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  return `${CURRENCY_LABEL} ${n.toFixed(2)}`;
}

/** Format a delta with an explicit sign, e.g. `+EGP 12.34`. */
export function moneySigned(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  return `${n < 0 ? '-' : '+'}${CURRENCY_LABEL} ${Math.abs(n).toFixed(2)}`;
}
