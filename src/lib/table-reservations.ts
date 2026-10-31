// Persisted floor-plan reservations (name / phone / guests / time). The
// floor-plan page keeps its table list in memory only, so reservations are
// stored here to survive navigation and reloads — same pattern as
// cleared-tables.ts. A reservation flips a table to `reserved`; seating the
// guests or cancelling it removes the entry again.

export interface TableReservation {
  /** Floor-table display name, e.g. 'Table A04'. */
  table: string;
  /** Arabic twin of `table` (mock data), set when reserving in Arabic. */
  tableAr?: string;
  /** Guest name on the reservation. */
  name: string;
  /** Arabic twin of `name`. */
  nameAr?: string;
  phone: string;
  /** Number of guests expected. */
  guests: number;
  /** Reservation time label, e.g. '7:30 PM'. */
  time: string;
}

const KEY = 'pos-table-reservations';

export function getReservations(): TableReservation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TableReservation[]) : [];
  } catch {
    return [];
  }
}

export function saveReservation(r: TableReservation): void {
  if (typeof window === 'undefined') return;
  try {
    const all = getReservations().filter((x) => x.table !== r.table);
    window.localStorage.setItem(KEY, JSON.stringify([...all, r]));
  } catch {
    // storage unavailable — reservation stays in memory this session
  }
}

export function removeReservation(table: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(getReservations().filter((x) => x.table !== table)));
  } catch {
    // ignore
  }
}
