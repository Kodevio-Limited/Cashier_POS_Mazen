// Shared running-orders store for the POS.
// Lives outside the Running Orders page so the sidebar can show the pending
// (not-yet-accepted) order count at all times. Persisted to localStorage and
// broadcast via a custom event.

// Delivery orders run their own chain (Preparing → Ready → Out for Delivery →
// Delivered) because "Served" is meaningless for them — the food leaves the
// restaurant and payment is collected after delivery (Bug-70).
export type OrderStatus =
  | 'Placed'
  | 'Preparing'
  | 'Ready'
  | 'Served'
  | 'Completed'
  | 'Out for Delivery'
  | 'Delivered';
export type OrderType = 'All' | 'Dine In' | 'Takeaway' | 'Delivery';

/** Dine-in / takeaway steps shown in the order-detail stepper. */
export const STATUS_STEPS: OrderStatus[] = ['Placed', 'Preparing', 'Ready', 'Served'];
/** Delivery steps shown in the order-detail stepper. */
export const DELIVERY_STATUS_STEPS: OrderStatus[] = ['Preparing', 'Ready', 'Out for Delivery', 'Delivered'];

/** The status an order moves to when the cashier advances it one step. */
export function nextStatus(order: Pick<RunningOrder, 'type' | 'status'>): OrderStatus {
  if (order.type === 'Delivery') {
    switch (order.status) {
      case 'Placed':
        return 'Preparing';
      case 'Preparing':
        return 'Ready';
      case 'Ready':
        return 'Out for Delivery';
      default:
        return 'Delivered';
    }
  }
  switch (order.status) {
    case 'Placed':
      return 'Preparing';
    case 'Preparing':
      return 'Ready';
    case 'Ready':
      return 'Served';
    default:
      return 'Completed';
  }
}

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
  /** How the order is/was paid. Delivery orders are either prepaid online or
      cash on delivery, collected once the order is marked Delivered. */
  paymentMethod?: 'Cash' | 'Card' | 'Online' | 'Cash on Delivery';
  subtotal: number;
  serviceCharge: number;
  /** Tax (VAT) line in the payments breakdown. */
  tax?: number;
  /** Tips line in the payments breakdown. */
  tips?: number;
  total: number;
  /** Delivery-only details, shown under the customer's email. */
  address?: string;
  /** Arabic twin of `address` for mock data. */
  addressAr?: string;
  instructions?: string;
  /** Arabic twin of `instructions` for mock data. */
  instructionsAr?: string;
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
    tax: 3.64,
    tips: 2.0,
    total: 34.23,
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
    tax: 2.66,
    tips: 1.5,
    total: 25.04,
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
    table: '',
    type: 'Takeaway',
    status: 'Placed',
    items: [
      { name: 'Classic Burger', nameAr: 'برجر كلاسيك', qty: 2, price: 15.99, modifier: 'Standard', modifierAr: 'عادي', emoji: '🍔' },
      { name: 'French Fries', nameAr: 'بطاطس مقلية', qty: 1, price: 4.99, modifier: 'Standard', modifierAr: 'عادي', emoji: '🍟' },
    ],
    subtotal: 36.97,
    serviceCharge: 3.7,
    tax: 5.18,
    tips: 3.0,
    total: 48.85,
  },
  {
    id: 'ro4',
    orderNumber: '#047',
    customerName: 'Sarah Jenkins',
    customerNameAr: 'سارة جنكينز',
    phone: '+01284984',
    email: 'sarah.j@example.com',
    date: '7 Apr, 12:15 PM',
    dateAr: '٧ أبريل، ١٢:١٥ م',
    table: '',
    type: 'Delivery',
    status: 'Preparing',
    items: [
      { name: 'Shoyu Ramen', nameAr: 'رامن شويو', qty: 1, price: 15.99, modifier: 'No Spice', modifierAr: 'بدون بهار', emoji: '🍜' },
      { name: 'Coca-Cola', nameAr: 'كوكا كولا', qty: 1, price: 2.99, modifier: 'Standard', modifierAr: 'عادي', emoji: '🥤' },
    ],
    subtotal: 18.98,
    serviceCharge: 1.9,
    tax: 2.66,
    tips: 2.5,
    total: 26.04,
    // Cash on delivery: still unpaid, payment is collected once it is Delivered.
    isPaid: false,
    paymentMethod: 'Cash on Delivery',
    address: '12 Nile Corniche, Apt 4B',
    addressAr: '١٢ كورنيش النيل، شقة ٤ب',
    instructions: 'Leave at the front desk — call on arrival',
    instructionsAr: 'اترك الطلب عند الاستقبال — واتصل عند الوصول',
  },
  {
    id: 'ro5',
    orderNumber: '#049',
    customerName: 'Omar Nasser',
    customerNameAr: 'عمر ناصر',
    phone: '+01284992',
    email: 'omar.n@example.com',
    isPaid: true,
    paymentMethod: 'Online',
    date: '7 Apr, 12:30 PM',
    dateAr: '٧ أبريل، ١٢:٣٠ م',
    table: '',
    type: 'Delivery',
    status: 'Ready',
    items: [
      { name: 'Tonkotsu Ramen', nameAr: 'رامن تونكوتسو', qty: 1, price: 18.99, modifier: 'Medium', modifierAr: 'متوسط', emoji: '🍜' },
      { name: 'French Fries', nameAr: 'بطاطس مقلية', qty: 1, price: 4.99, modifier: 'Standard', modifierAr: 'عادي', emoji: '🍟' },
    ],
    subtotal: 23.98,
    serviceCharge: 2.4,
    tax: 3.36,
    tips: 3.0,
    total: 32.74,
    address: '88 Sheikh Zayed St, Villa 12',
    addressAr: '٨٨ شارع الشيخ زايد، فيلا ١٢',
    instructions: 'Ring the bell twice — leave with the guard if no answer',
    instructionsAr: 'دق الجرس مرتين — اترك الطلب مع الحارس إن لا أحد يرد',
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

/** Record a newly created checkout as a running order (newest first). */
export function addOrder(order: RunningOrder): void {
  write([order, ...getOrders()]);
}

/** Delivery was cash on delivery: collect the money and mark it paid. */
export function markOrderPaid(id: string, method: 'Cash' | 'Card' | 'Online' = 'Cash'): void {
  write(getOrders().map((o) => (o.id === id ? { ...o, isPaid: true, paymentMethod: method } : o)));
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
