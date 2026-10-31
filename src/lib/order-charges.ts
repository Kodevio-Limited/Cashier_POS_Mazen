// Charge rules shared by the checkout (place-order) and everything that
// renders its totals: 10% service charge, 14% VAT (same rate the mock
// running orders / history data was seeded with) and selectable tips.

/** Service charge applied to the discounted subtotal. */
export const SERVICE_RATE = 0.1;
/** VAT applied to the discounted subtotal. */
export const TAX_RATE = 0.14;
/** Quick tip choices offered to the cashier (% of the discounted subtotal). */
export const TIP_PRESETS = [0.1, 0.15, 0.2] as const;

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Discounted subtotal — the base every percentage charge is computed from. */
export function chargeableBase(subtotal: number, discount: number): number {
  return Math.max(0, subtotal - discount);
}

export function tipFromPreset(base: number, preset: number): number {
  return round2(base * preset);
}
