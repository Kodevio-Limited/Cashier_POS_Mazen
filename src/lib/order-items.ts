// Merging identical order lines.
//
// A cashier can tap the same dish several times, and the cart keeps a separate
// line for each tap so every copy can be customized on its own. Once the order
// lands in Running Orders / History, though, two lines that ended up with the
// SAME dish, price, add-ons and comment are indistinguishable on screen — the
// client wants those shown as ONE row with the quantities added up (Bug-19).

export interface MergeableOrderItem {
  name: string;
  qty: number;
  /** Unit price. Two lines are only merged when it matches too, so a row's
      displayed amount (price × qty) can never come out wrong. */
  price: number;
  /** Add-on shown on the row, when the store carries one. */
  modifier?: string;
  /** Per-item comment / special instructions, when the store carries one. */
  note?: string;
}

/**
 * Collapse rows that are identical in dish, price, add-ons and comment into a
 * single row whose `qty` is the sum of theirs. Order of first appearance is
 * preserved; everything else about the kept row (emoji, Arabic twins…) is
 * untouched. Returns the input array unchanged when nothing merges, so it is
 * safe to call on every render.
 */
export function mergeIdenticalItems<T extends MergeableOrderItem>(items: readonly T[]): T[] {
  const merged: T[] = [];
  const indexByKey = new Map<string, number>();

  for (const item of items) {
    // NUL separator: dish names are free text, so a bare concatenation could
    // make "Burger1 + 5" collide with "Burger + 15".
    const key = [item.name, item.price, item.modifier ?? '', item.note ?? ''].join('\u0000');
    const at = indexByKey.get(key);
    if (at === undefined) {
      indexByKey.set(key, merged.length);
      merged.push({ ...item });
    } else {
      merged[at] = { ...merged[at], qty: merged[at].qty + item.qty };
    }
  }

  return merged;
}
