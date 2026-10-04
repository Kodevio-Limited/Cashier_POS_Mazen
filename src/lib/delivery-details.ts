// Delivery details for delivery-type POS orders. Persisted to
// localStorage so the address entered on the Order tab is still there on
// /place-order. Only name/phone/address/street are required (Bug-12);
// landmark/floor/apartment/secondaryPhone are optional. Repeat customers
// are remembered by phone with multiple labeled addresses (Bug-12).

export interface SavedAddress {
  label: string;
  address: string;
  street: string;
  landmark: string;
  floor: string;
  apartment: string;
  instructions?: string;
}

export interface CustomerProfile {
  name: string;
  phone: string;
  secondaryPhone?: string;
  addresses: SavedAddress[];
}

export interface DeliveryDetails {
  name: string;
  phone: string;
  secondaryPhone?: string;
  addressLabel?: string;
  address: string;
  street: string;
  landmark: string;
  floor: string;
  apartment: string;
  instructions?: string;
}

const KEY = 'pos-delivery-details';
const CUSTOMERS_KEY = 'pos-delivery-customers';

const EMPTY: DeliveryDetails = {
  name: '',
  phone: '',
  secondaryPhone: '',
  addressLabel: '',
  address: '',
  street: '',
  landmark: '',
  floor: '',
  apartment: '',
  instructions: '',
};

export function emptyDeliveryDetails(): DeliveryDetails {
  return { ...EMPTY };
}

export function isDeliveryDetailsComplete(d: DeliveryDetails): boolean {
  // Bug-12: landmark / floor / apartment / secondaryPhone are optional.
  return [d.name, d.phone, d.address, d.street]
    .every((v) => (v ?? '').trim().length > 0);
}

export function optionalLabel(): string {
  return 'optional';
}

export function loadDeliveryDetails(): DeliveryDetails | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const str = (v: unknown) => (typeof v === 'string' ? v : '');
    return {
      name: str(parsed.name),
      phone: str(parsed.phone),
      secondaryPhone: str((parsed as Record<string, unknown>).secondaryPhone),
      addressLabel: str((parsed as Record<string, unknown>).addressLabel),
      address: str(parsed.address),
      street: str(parsed.street),
      landmark: str(parsed.landmark),
      floor: str(parsed.floor),
      apartment: str(parsed.apartment),
      instructions: str(parsed.instructions),
    };
  } catch {
    return null;
  }
}

export function saveDeliveryDetails(d: DeliveryDetails): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    // storage unavailable — details simply won't survive navigation
  }
}

export function clearDeliveryDetails(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

// ── Customer book (Bug-12): remembered by phone, multiple labeled addresses ──
// Frontend-only store (localStorage). TODO(api): replace with backend
// customer lookup so profiles follow the cashier across devices.

function readCustomers(): Record<string, CustomerProfile> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CUSTOMERS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed as Record<string, CustomerProfile> : {};
  } catch {
    return {};
  }
}

function writeCustomers(all: Record<string, CustomerProfile>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(all));
  } catch {
    // storage unavailable — book simply won't persist
  }
}

export function normalizePhone(phone: string): string {
  return (phone ?? '').replace(/[\s-]/g, '');
}

export function loadCustomerByPhone(phone: string): CustomerProfile | null {
  const key = normalizePhone(phone);
  if (!key) return null;
  const all = readCustomers();
  return all[key] ?? null;
}

/** Save/merge the current delivery form into the customer book. */
export function saveCustomer(d: DeliveryDetails): void {
  const key = normalizePhone(d.phone);
  if (!key || !d.name.trim()) return;
  const all = readCustomers();
  const existing = all[key];
  const addr: SavedAddress = {
    label: d.addressLabel?.trim() || 'Home',
    address: d.address,
    street: d.street,
    landmark: d.landmark,
    floor: d.floor,
    apartment: d.apartment,
    instructions: d.instructions,
  };
  const addresses = [...(existing?.addresses ?? [])];
  const dupIdx = addresses.findIndex(
    (a) => a.address === addr.address && a.street === addr.street && a.apartment === addr.apartment,
  );
  if (dupIdx >= 0) {
    addresses[dupIdx] = { ...addresses[dupIdx], ...addr };
  } else {
    addresses.push(addr);
  }
  all[key] = {
    name: d.name,
    phone: d.phone,
    secondaryPhone: d.secondaryPhone || existing?.secondaryPhone || '',
    addresses,
  };
  writeCustomers(all);
}
