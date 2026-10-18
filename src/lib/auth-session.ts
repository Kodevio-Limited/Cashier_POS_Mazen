// Mock auth session for the Cashier POS. Persisted to localStorage so the
// login → shift → floor-plan flow works without a backend yet. Real auth will
// come from the API; swap the body of these helpers when it lands.

export interface AuthSession {
  email: string;
  loggedInAt: number;
}

const KEY = 'pos-auth-session';
const EVT = 'pos-auth-session-changed';

function emit() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVT));
}

export function getAuthSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || typeof s.email !== 'string' || typeof s.loggedInAt !== 'number') return null;
    return s as AuthSession;
  } catch {
    return null;
  }
}

export function setAuthSession(email: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ email, loggedInAt: Date.now() } satisfies AuthSession),
    );
  } catch {
    // storage unavailable — session won't survive reloads
  }
  emit();
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  emit();
}

/** Subscribe to login/logout changes (same tab + other tabs). */
export function subscribeAuthSession(cb: () => void): () => void {
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
