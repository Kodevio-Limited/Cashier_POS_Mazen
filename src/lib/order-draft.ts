// Shared draft of the current POS order, persisted to localStorage so the cart
// survives navigation between /order (Menu) and /place-order (checkout).
// The back-arrow beside "Order #ORD-1025" must return to the Menu with items intact.

export interface DraftItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  emoji?: string;
  texture?: string;
  modifiers?: string[];
  instructions?: string;
}

const KEY = 'pos-current-order';

export function loadDraft(): DraftItem[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (i): i is DraftItem =>
        !!i && typeof i.id === 'string' && typeof i.name === 'string' &&
        typeof i.price === 'number' && typeof i.qty === 'number',
    );
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
