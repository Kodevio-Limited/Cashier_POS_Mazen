// Shared POS order session: which table (or Take Out / Delivery) the current
// order belongs to, plus its order number. Persisted to localStorage so the
// selection made on the Floor Plan stays visible across /order and /place-order.

export type OrderType = 'dine-in' | 'take-out' | 'delivery';

export interface OrderSession {
  /** e.g. 'ORD-1025' */
  orderNumber: string;
  type: OrderType;
  /** e.g. 'Table A02' — only for dine-in. */
  tableName?: string;
}

const KEY = 'pos-order-session';

/** Human label shown next to the order number. */
export function sessionLabel(s: OrderSession): string {
  if (s.type === 'take-out') return 'Take Out';
  if (s.type === 'delivery') return 'Delivery';
  return s.tableName ?? 'Dine In';
}

export function newOrderNumber(): string {
  return `ORD-${1000 + Math.floor(Math.random() * 9000)}`;
}

export function loadSession(): OrderSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || typeof s.orderNumber !== 'string' || typeof s.type !== 'string') return null;
    if (!['dine-in', 'take-out', 'delivery'].includes(s.type)) return null;
    return { orderNumber: s.orderNumber, type: s.type, tableName: s.tableName };
  } catch {
    return null;
  }
}

export function saveSession(session: OrderSession): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // storage unavailable — selection simply won't survive navigation
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
