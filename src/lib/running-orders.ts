// Shared running-orders store for the POS.
// Lives outside the Running Orders page so the sidebar can show the pending
// (not-yet-accepted) order count at all times. Persisted to localStorage and
// broadcast via a custom event.

export type OrderStatus = 'Placed' | 'Preparing' | 'Ready' | 'Served' | 'Completed';
export type OrderType = 'All' | 'Dine In' | 'Takeaway' | 'Delivery';

export interface RunningOrderItem {
  name: string;
  qty: number;
  price: number;
  modifier?: string;
  emoji: string;
}

export interface RunningOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  phone?: string;
  email?: string;
  isPaid: boolean;
  date: string;
  table: string;
  type: 'Dine In' | 'Takeaway' | 'Delivery';
  status: OrderStatus;
  items: RunningOrderItem[];
  subtotal: number;
  serviceCharge: number;
  total: number;
}

const KEY = 'pos-running-orders';
const EVT = 'pos-running-orders-changed';

export const INITIAL_RUNNING_ORDERS: RunningOrder[] = [
  {
    id: 'ro1',
    orderNumber: '#044',
    customerName: 'Robert Fox',
    phone: '+01284980',
    email: 'mike.t@example.com',
    isPaid: true,
    date: '7 Apr, 11:30 AM',
    table: 'Table 03',
    type: 'Dine In',
    status: 'Preparing',
    items: [
      { name: 'Shoyu Ramen', qty: 1, price: 15.99, modifier: 'No Spice', emoji: '🍜' },
      { name: 'Iced Green Tea', qty: 1, price: 15.99, modifier: 'No Spice', emoji: '🍵' },
    ],
    subtotal: 25.99,
    serviceCharge: 2.6,
    total: 30.99,
  },
  {
    id: 'ro2',
    orderNumber: '#045',
    customerName: 'Mike Thompson',
    phone: '+01284980',
    email: 'mike.t@example.com',
    isPaid: true,
    date: '7 Apr, 11:45 AM',
    table: 'Table 07',
    type: 'Dine In',
    status: 'Ready',
    items: [
      { name: 'Shoyu Ramen', qty: 1, price: 15.99, modifier: 'Extra Chili', emoji: '🍜' },
      { name: 'Coca-Cola', qty: 1, price: 2.99, modifier: 'Standard', emoji: '🥤' },
    ],
    subtotal: 18.98,
    serviceCharge: 1.9,
    total: 20.88,
  },
  {
    id: 'ro3',
    orderNumber: '#046',
    customerName: 'David K.',
    phone: '+01284980',
    email: 'david.k@example.com',
    isPaid: false,
    date: '7 Apr, 12:00 PM',
    table: 'Takeaway #12',
    type: 'Takeaway',
    status: 'Placed',
    items: [
      { name: 'Classic Burger', qty: 2, price: 15.99, modifier: 'Standard', emoji: '🍔' },
      { name: 'French Fries', qty: 1, price: 4.99, modifier: 'Standard', emoji: '🍟' },
    ],
    subtotal: 36.97,
    serviceCharge: 3.7,
    total: 40.67,
  },
];

function emit() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVT));
}

function write(list: RunningOrder[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // storage unavailable — orders stay in-memory this session
  }
  emit();
}

export function getOrders(): RunningOrder[] {
  if (typeof window === 'undefined') return INITIAL_RUNNING_ORDERS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as RunningOrder[];
    }
  } catch {
    // fall through to seed
  }
  write(INITIAL_RUNNING_ORDERS);
  return INITIAL_RUNNING_ORDERS;
}

export function updateOrderStatus(id: string, status: OrderStatus): void {
  write(getOrders().map((o) => (o.id === id ? { ...o, status } : o)));
}

export function removeOrder(id: string): void {
  write(getOrders().filter((o) => o.id !== id));
}

/** Orders still awaiting cashier acceptance. */
export function pendingCount(orders: RunningOrder[]): number {
  return orders.filter((o) => o.status === 'Placed').length;
}

/** Subscribe to order-list changes (same tab + other tabs). Returns an unsubscribe fn. */
export function subscribeOrders(cb: () => void): () => void {
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
