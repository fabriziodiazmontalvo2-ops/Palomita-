// Catálogo de la tienda: alimentos y accesorios.
//
// FOODS: lo que come la palomita. Son alimentos que aparecen en la Biblia (más un par de premios de fiesta).
//   id, name, emoji, price (semillas), hambre (cuánto llena), alegria (extra), level (nivel mínimo para comprarlo)
//   Cada alimento tiene un dato bíblico en js/data/phrases.js → FOOD_FACTS[id].
// ACCESSORIES: cosas que la palomita puede ponerse. slot: 'head' | 'neck' | 'beak' (uno por lugar).
//   id, name, emoji (para la tienda), slot, price, level. El modelo 3D de cada uno lo construye js/pet/accessories.js con el mismo id.
export const FOODS = [
  { id: 'pan', name: 'Pan', emoji: '🍞', price: 5, hambre: 18, alegria: 2, level: 1 },
  { id: 'agua', name: 'Agua', emoji: '💧', price: 2, hambre: 6, alegria: 1, level: 1 },
  { id: 'manzana', name: 'Manzana', emoji: '🍎', price: 6, hambre: 14, alegria: 4, level: 1 },
  { id: 'uvas', name: 'Uvas', emoji: '🍇', price: 8, hambre: 15, alegria: 6, level: 1 },
  { id: 'trigo', name: 'Trigo', emoji: '🌾', price: 4, hambre: 12, alegria: 2, level: 1 },
  { id: 'leche', name: 'Leche', emoji: '🥛', price: 7, hambre: 14, alegria: 4, level: 2 },
  { id: 'pescado', name: 'Pescado', emoji: '🐟', price: 12, hambre: 28, alegria: 4, level: 2 },
  { id: 'higos', name: 'Higos', emoji: '🫐', price: 9, hambre: 16, alegria: 7, level: 3 },
  { id: 'aceitunas', name: 'Aceitunas', emoji: '🫒', price: 8, hambre: 12, alegria: 5, level: 3 },
  { id: 'queso', name: 'Queso', emoji: '🧀', price: 11, hambre: 22, alegria: 5, level: 4 },
  { id: 'datiles', name: 'Dátiles', emoji: '🌴', price: 10, hambre: 15, alegria: 9, level: 4 },
  { id: 'lentejas', name: 'Lentejas', emoji: '🍲', price: 14, hambre: 34, alegria: 3, level: 5 },
  { id: 'miel', name: 'Miel', emoji: '🍯', price: 13, hambre: 12, alegria: 14, level: 5 },
  { id: 'granada', name: 'Granada', emoji: '🍑', price: 12, hambre: 16, alegria: 10, level: 6 },
  { id: 'galleta', name: 'Galleta', emoji: '🍪', price: 9, hambre: 8, alegria: 14, level: 2 },
  { id: 'torta', name: 'Torta de fiesta', emoji: '🎂', price: 30, hambre: 30, alegria: 30, level: 7 },
];

export const ACCESSORIES = [
  { id: 'lazo', name: 'Moño rosado', emoji: '🎀', slot: 'head', price: 40, level: 1 },
  { id: 'gorra', name: 'Gorra', emoji: '🧢', slot: 'head', price: 60, level: 2 },
  { id: 'sombrero-paja', name: 'Sombrero de paja', emoji: '👒', slot: 'head', price: 80, level: 3 },
  { id: 'corona-flores', name: 'Corona de flores', emoji: '🌸', slot: 'head', price: 110, level: 4 },
  { id: 'gorro-lana', name: 'Gorro de lana', emoji: '🧶', slot: 'head', price: 90, level: 5 },
  { id: 'gorro-fiesta', name: 'Gorro de fiesta', emoji: '🥳', slot: 'head', price: 70, level: 6 },
  { id: 'corona-rey', name: 'Corona de Rey Mago', emoji: '👑', slot: 'head', price: 200, level: 8 },
  { id: 'panuelo', name: 'Pañuelo', emoji: '🧣', slot: 'neck', price: 45, level: 1 },
  { id: 'corbatin', name: 'Corbatín', emoji: '🤵', slot: 'neck', price: 65, level: 2 },
  { id: 'bufanda', name: 'Bufanda', emoji: '🧣', slot: 'neck', price: 85, level: 4 },
  { id: 'collar-cruz', name: 'Crucecita de madera', emoji: '✝️', slot: 'neck', price: 120, level: 3 },
  { id: 'medalla', name: 'Medallita', emoji: '🏅', slot: 'neck', price: 150, level: 6 },
  { id: 'lazo-comunion', name: 'Lazo de Primera Comunión', emoji: '🤍', slot: 'neck', price: 180, level: 7 },
  { id: 'ramita-olivo', name: 'Ramita de olivo', emoji: '🌿', slot: 'beak', price: 50, level: 2 },
  { id: 'flor', name: 'Florecita', emoji: '🌼', slot: 'beak', price: 35, level: 1 },
];

export const food = id => FOODS.find(f => f.id === id) || null;
export const accessory = id => ACCESSORIES.find(a => a.id === id) || null;
