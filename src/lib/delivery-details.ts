// Delivery details for delivery-type POS orders (Bug-57). Persisted to
// localStorage so the address entered on the Order tab is still there on
// /place-order. All fields required except `instructions`.

export interface DeliveryDetails {
  name: string;
  phone: string;
  address: string;
  street: string;
  landmark: string;
  floor: string;
  apartment: string;
  instructions?: string;
}

const KEY = 'pos-delivery-details';

const EMPTY: DeliveryDetails = {
  name: '',
  phone: '',
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
  return [d.name, d.phone, d.address, d.street, d.landmark, d.floor, d.apartment]
    .every((v) => v.trim().length > 0);
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
