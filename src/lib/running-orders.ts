// Shared running-orders store for the POS.
// Lives outside the Running Orders page so the sidebar can show the pending
// (not-yet-accepted) order count at all times. Persisted to localStorage and
// broadcast via a custom event.

export type OrderStatus = 'Placed' | 'Preparing' | 'Ready' | 'Served' | 'Completed';
export type OrderType = 'All' | 'Dine In' | 'Takeaway' | 'Delivery';

export interface RunningOrderItem {
  name: string;
  /** Arabic twin of `name` for mock data (picked by active locale). */
  nameAr?: string;
  qty: number;
  price: number;
  modifier?: string;
  /** Arabic twin of `modifier`. */
  modifierAr?: string;
  emoji: string;
}

export interface RunningOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  /** Arabic twin of `customerName` for mock data. */
  customerNameAr?: string;
  phone?: string;
  email?: string;
  isPaid: boolean;
  date: string;
  /** Arabic twin of `date` (mock data). */
  dateAr?: string;
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
    customerNameAr: 'روبرت فوكس',
    phone: '+01284980',
    email: 'mike.t@example.com',
    isPaid: true,
    date: '7 Apr, 11:30 AM',
    dateAr: '٧ أبريل، ١١:٣٠ ص',
    table: 'Table 03',
    type: 'Dine In',
    status: 'Preparing',
    items: [
      { name: 'Shoyu Ramen', nameAr: 'رامن شويو', qty: 1, price: 15.99, modifier: 'No Spice', modifierAr: 'بدون بهار', emoji: '🍜' },
      { name: 'Iced Green Tea', nameAr: 'شاي أخضر مثلج', qty: 1, price: 15.99, modifier: 'No Spice', modifierAr: 'بدون بهار', emoji: '🍵' },
    ],
    subtotal: 25.99,
    serviceCharge: 2.6,
    total: 30.99,
  },
  {
    id: 'ro2',
    orderNumber: '#045',
    customerName: 'Mike Thompson',
    customerNameAr: 'مايك تومسون',
    phone: '+01284980',
    email: 'mike.t@example.com',
    isPaid: true,
    date: '7 Apr, 11:45 AM',
    dateAr: '٧ أبريل، ١١:٤٥ ص',
    table: 'Table 07',
    type: 'Dine In',
    status: 'Ready',
    items: [
      { name: 'Shoyu Ramen', nameAr: 'رامن شويو', qty: 1, price: 15.99, modifier: 'Extra Chili', modifierAr: 'فلفل إضافي', emoji: '🍜' },
      { name: 'Coca-Cola', nameAr: 'كوكا كولا', qty: 1, price: 2.99, modifier: 'Standard', modifierAr: 'عادي', emoji: '🥤' },
    ],
    subtotal: 18.98,
    serviceCharge: 1.9,
    total: 20.88,
  },
  {
    id: 'ro3',
    orderNumber: '#046',
    customerName: 'David K.',
    customerNameAr: 'ديفيد ك.',
    phone: '+01284980',
    email: 'david.k@example.com',
    isPaid: false,
    date: '7 Apr, 12:00 PM',
    dateAr: '٧ أبريل، ١٢:٠٠ م',
    table: 'Takeaway #12',
    type: 'Takeaway',
    status: 'Placed',
    items: [
      { name: 'Classic Burger', nameAr: 'برجر كلاسيك', qty: 2, price: 15.99, modifier: 'Standard', modifierAr: 'عادي', emoji: '🍔' },
      { name: 'French Fries', nameAr: 'بطاطس مقلية', qty: 1, price: 4.99, modifier: 'Standard', modifierAr: 'عادي', emoji: '🍟' },
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
