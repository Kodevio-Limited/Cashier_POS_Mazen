// Shared draft of the current POS order, persisted to localStorage so the cart
// survives navigation between /order (Menu) and /place-order (checkout).
// The back-arrow beside "Order #ORD-1025" must return to the Menu with items intact.

const KEY = 'pos-current-order';

export interface DraftItem {
  /** Menu item id (e.g. 'm1' for Classic Burger). Two lines can share this. */
  id: string;
  /**
   * Unique per cart line. Two Classic Burgers with different customizations are
   * separate lines with separate lineIds; only truly identical configurations
   * merge, and then only in quantity.
   */
  lineId: string;
  name: string;
  price: number;
  qty: number;
  emoji?: string;
  texture?: string;
  modifiers?: string[];
  instructions?: string;
}

let lineIdCounter = 0;

/** New unique cart-line id; menu `id` alone is NOT unique across lines. */
export function newLineId(): string {
  lineIdCounter += 1;
  return `line-${Date.now().toString(36)}-${lineIdCounter}`;
}

/**
 * Loads the draft and guarantees every line has a unique `lineId` (backfills
 * one for drafts saved before lineId existed, and de-dupes any accidental
 * duplicates so React keys and per-line buttons stay correct).
 */
export function loadDraft(): DraftItem[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const seen = new Set<string>();
    const lines: DraftItem[] = [];
    for (const i of parsed) {
      if (
        !i || typeof i.id !== 'string' || typeof i.name !== 'string' ||
        typeof i.price !== 'number' || typeof i.qty !== 'number'
      ) {
        continue;
      }
      const lineId =
        typeof i.lineId === 'string' && i.lineId !== '' && !seen.has(i.lineId)
          ? i.lineId
          : newLineId();
      seen.add(lineId);
      lines.push({ ...i, lineId });
    }
    return lines;
  } catch {
    return null;
  }
}

export function saveDraft(items: DraftItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // storage unavailable — cart simply won't survive navigation
  }
}

export function clearDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
