// Active shift session for the POS, persisted to localStorage so the app stays
// locked to the Start Shift screen until a shift is started (and after it is
// closed / the cashier logs out). Mirrors the pattern used by order-session.ts
// and table-requests.ts. Broadcasts a custom event so open tabs stay in sync.

export interface ActiveShift {
  cashierName: string;
  openingFloat: number;
  startedAt: number;
}

const KEY = 'pos-active-shift';
const EVT = 'pos-active-shift-changed';

function emit() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVT));
}

export function getActiveShift(): ActiveShift | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || typeof s.cashierName !== 'string' || typeof s.openingFloat !== 'number' || typeof s.startedAt !== 'number') {
      return null;
    }
    return s as ActiveShift;
  } catch {
    return null;
  }
}

export function startShift(cashierName: string, openingFloat: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ cashierName, openingFloat, startedAt: Date.now() } satisfies ActiveShift));
  } catch {
    // storage unavailable — shift won't survive reloads
  }
  emit();
}

export function endShift(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  emit();
}

/** Subscribe to active-shift changes (same tab + other tabs). Returns an unsubscribe fn. */
export function subscribeShift(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener(EVT, cb);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener('storage', onStorage);
  };
}
