// Shared table-request store for the POS.
// Requests originate from customers (QR/waiter call); the cashier sees them from
// the sidebar at all times. Persisted to localStorage and broadcast via a custom
// event so the sidebar badge, the request modal, and the toast stay in sync.

export interface TableRequest {
  id: string;
  table: string;
  timeAgo: string;
  type: 'Waiter Requested' | 'Check Requested';
  paymentMethod?: 'Card' | 'Cash';
  createdAt: number;
}

const KEY = 'pos-table-requests';
const EVT = 'pos-table-requests-changed';

export const INITIAL_TABLE_REQUESTS: TableRequest[] = [
  { id: 'tr1', table: 'Table 9', timeAgo: '33 min ago', type: 'Waiter Requested', createdAt: Date.now() - 33 * 60_000 },
  { id: 'tr2', table: 'Table 9', timeAgo: '33 min ago', type: 'Check Requested', paymentMethod: 'Card', createdAt: Date.now() - 33 * 60_000 },
  { id: 'tr3', table: 'Table 9', timeAgo: '33 min ago', type: 'Check Requested', paymentMethod: 'Cash', createdAt: Date.now() - 33 * 60_000 },
];

function emit() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVT));
}

function write(list: TableRequest[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // storage unavailable — requests stay in-memory this session
  }
  emit();
}

export function getRequests(): TableRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as TableRequest[];
      return [];
    }
  } catch {
    // fall through to seed
  }
  // First ever load: seed the demo requests (without broadcasting a toast).
  write(INITIAL_TABLE_REQUESTS);
  return INITIAL_TABLE_REQUESTS;
}

export function addRequest(req: Omit<TableRequest, 'id' | 'createdAt' | 'timeAgo'> & Partial<Pick<TableRequest, 'timeAgo'>>): TableRequest {
  const entry: TableRequest = {
    id: `tr-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
    timeAgo: req.timeAgo ?? 'Just now',
    createdAt: Date.now(),
    table: req.table,
    type: req.type,
    paymentMethod: req.paymentMethod,
  };
  write([...getRequests(), entry]);
  return entry;
}

export function handleRequest(id: string): void {
  write(getRequests().filter((r) => r.id !== id));
}

export function dismissAllRequests(): void {
  write([]);
}

/** Subscribe to request-list changes (same tab + other tabs). Returns an unsubscribe fn. */
export function subscribeRequests(cb: () => void): () => void {
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
