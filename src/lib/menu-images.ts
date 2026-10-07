// Food photos used across the POS (menu grid, cart lines, running orders, etc.).
// Sourced from the Figma file so the UI shows real pictures instead of emoji.

export const FOOD_IMAGES = {
  ramen: '/images/menu/ramen.png',
  nachos: '/images/menu/nachos.png',
  grill: '/images/menu/grill.png',
  coffee: '/images/menu/coffee.jpg',
  tea: '/images/menu/tea.jpg',
} as const;

// Mock-data items carry an emoji (🍔, 🍜, …). Map each to the closest photo.
const BY_EMOJI: Record<string, string> = {
  '🍔': FOOD_IMAGES.grill,
  '🥙': FOOD_IMAGES.nachos,
  '🍜': FOOD_IMAGES.ramen,
  '🍵': FOOD_IMAGES.tea,
  '🍟': FOOD_IMAGES.grill,
  '🧅': FOOD_IMAGES.nachos,
  '🥤': FOOD_IMAGES.coffee,
  '🍋': FOOD_IMAGES.tea,
};

/** Resolve a food photo from a mock item's emoji (falls back to ramen). */
export function foodImage(emoji?: string): string {
  return (emoji && BY_EMOJI[emoji]) || FOOD_IMAGES.ramen;
}

// Small picture shown inside each category pill.
export const CATEGORY_IMAGE: Record<string, string> = {
  All: FOOD_IMAGES.nachos,
  Burgers: FOOD_IMAGES.grill,
  Ramen: FOOD_IMAGES.ramen,
  Sides: FOOD_IMAGES.grill,
  Drinks: FOOD_IMAGES.coffee,
  Desserts: FOOD_IMAGES.tea,
};
