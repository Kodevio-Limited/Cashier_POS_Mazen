// Persisted set of floor-plan tables whose running check was collected via
// "Collect Payment & Clear Table" (checkout with collectOnly). The floor-plan
// mock resets its in-memory table state on every mount, so the cleared names
// are stored here to keep paid tables available across navigation.

const KEY = 'pos-cleared-tables';

export function getClearedTables(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n): n is string => typeof n === 'string') : [];
  } catch {
    return [];
  }
}

export function addClearedTable(name: string): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getClearedTables();
    if (!list.includes(name)) {
      window.localStorage.setItem(KEY, JSON.stringify([...list, name]));
    }
  } catch {
    // storage unavailable — table clearing won't survive navigation
  }
}

export function removeClearedTable(name: string): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getClearedTables().filter((n) => n !== name);
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}
