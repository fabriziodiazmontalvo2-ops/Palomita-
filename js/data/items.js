// Catálogo de la tienda: alimentos y accesorios.
//
// FOODS: lo que come la palomita. Son alimentos que aparecen en la Biblia (más un par de premios de fiesta).
//   id, name, emoji, price (semillas), hambre (cuánto llena), alegria (extra), level (nivel mínimo para comprarlo)
//   Cada alimento tiene un dato bíblico en js/data/phrases.js → FOOD_FACTS[id].
// ACCESSORIES: ropa y cosas que la palomita puede ponerse, una por lugar (slot):
//   'body' ropa · 'head' cabeza · 'face' lentes · 'neck' cuello · 'beak' pico · 'feet' zapatos (en las dos patitas).
//   gender: 'varon' | 'mujer' → solo aparece (en la tienda, el ropero y los premios) si la palomita es de ese género.
//           Sin gender: es para todos (cosas de la fe, del Perú, de fiesta…).
//   reward: N → no se vende: se gana al juntar N estrellas en los juegos (ver js/core/rewards.js).
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
  // ── Moda de varón ──
  { id: 'polo-seleccion', name: 'Camiseta de la Selección', emoji: '👕', slot: 'body', price: 150, level: 2, gender: 'varon' },
  { id: 'polera-capucha', name: 'Polera con capucha', emoji: '🧥', slot: 'body', price: 180, level: 4, gender: 'varon' },
  { id: 'casaca-jean', name: 'Casaca jean', emoji: '🧥', slot: 'body', price: 220, level: 7, gender: 'varon' },
  { id: 'camisa-terno', name: 'Camisa y chaleco de fiesta', emoji: '🤵', slot: 'body', price: 260, level: 10, gender: 'varon' },
  { id: 'gorra-urbana', name: 'Gorra al revés', emoji: '🧢', slot: 'head', price: 110, level: 3, gender: 'varon' },
  { id: 'audifonos', name: 'Audífonos', emoji: '🎧', slot: 'head', price: 160, level: 6, gender: 'varon' },
  { id: 'lentes-sol', name: 'Lentes de sol', emoji: '🕶️', slot: 'face', price: 120, level: 3, gender: 'varon' },
  { id: 'corbata', name: 'Corbata roja', emoji: '👔', slot: 'neck', price: 100, level: 5, gender: 'varon' },
  { id: 'zapatillas', name: 'Zapatillas deportivas', emoji: '👟', slot: 'feet', price: 140, level: 2, gender: 'varon' },
  { id: 'gorra', name: 'Gorra roja', emoji: '🧢', slot: 'head', price: 60, level: 2, gender: 'varon' },
  { id: 'corbatin', name: 'Corbatín', emoji: '🤵', slot: 'neck', price: 65, level: 2, gender: 'varon' },
  { id: 'corona-rey', name: 'Corona de Rey Mago', emoji: '👑', slot: 'head', price: 200, level: 8, gender: 'varon' },
  { id: 'gorro-marinero', name: 'Gorro de marinero', emoji: '⚓', slot: 'head', price: 170, level: 20, gender: 'varon' },
  { id: 'pajarita-dorada', name: 'Corbatín dorado', emoji: '✨', slot: 'neck', price: 220, level: 30, gender: 'varon' },
  // ── Moda de mujer ──
  { id: 'vestido-flores', name: 'Vestido de flores', emoji: '👗', slot: 'body', price: 150, level: 2, gender: 'mujer' },
  { id: 'falda-tutu', name: 'Falda tutú', emoji: '🩰', slot: 'body', price: 170, level: 4, gender: 'mujer' },
  { id: 'chompa-corazones', name: 'Chompa de corazones', emoji: '💗', slot: 'body', price: 220, level: 7, gender: 'mujer' },
  { id: 'vestido-comunion', name: 'Vestido blanco de fiesta', emoji: '🤍', slot: 'body', price: 260, level: 10, gender: 'mujer' },
  { id: 'vincha-brillos', name: 'Vincha con brillos', emoji: '💎', slot: 'head', price: 110, level: 3, gender: 'mujer' },
  { id: 'tiara-princesa', name: 'Tiara', emoji: '👸', slot: 'head', price: 160, level: 6, gender: 'mujer' },
  { id: 'lentes-corazon', name: 'Lentes de corazón', emoji: '😍', slot: 'face', price: 120, level: 3, gender: 'mujer' },
  { id: 'bolsito', name: 'Bolsito', emoji: '👛', slot: 'neck', price: 100, level: 5, gender: 'mujer' },
  { id: 'zapatitos', name: 'Zapatitos de charol', emoji: '🥿', slot: 'feet', price: 140, level: 2, gender: 'mujer' },
  { id: 'lazo', name: 'Moño rosado', emoji: '🎀', slot: 'head', price: 40, level: 1, gender: 'mujer' },
  { id: 'sombrero-paja', name: 'Sombrero de paja', emoji: '👒', slot: 'head', price: 80, level: 3, gender: 'mujer' },
  { id: 'corona-flores', name: 'Corona de flores', emoji: '🌸', slot: 'head', price: 110, level: 4, gender: 'mujer' },
  { id: 'collar-flores', name: 'Collar de flores', emoji: '🌺', slot: 'neck', price: 150, level: 15, gender: 'mujer' },
  { id: 'diadema-mariposa', name: 'Diadema de mariposa', emoji: '🦋', slot: 'head', price: 320, level: 60, gender: 'mujer' },
  // ── Para todos ──
  { id: 'gorro-lana', name: 'Gorro de lana', emoji: '🧶', slot: 'head', price: 90, level: 5 },
  { id: 'gorro-fiesta', name: 'Gorro de fiesta', emoji: '🥳', slot: 'head', price: 70, level: 6 },
  { id: 'panuelo', name: 'Pañuelo', emoji: '🧣', slot: 'neck', price: 45, level: 1 },
  { id: 'bufanda', name: 'Bufanda', emoji: '🧣', slot: 'neck', price: 85, level: 4 },
  { id: 'collar-cruz', name: 'Crucecita de madera', emoji: '✝️', slot: 'neck', price: 120, level: 3 },
  { id: 'medalla', name: 'Medallita', emoji: '🏅', slot: 'neck', price: 150, level: 6 },
  { id: 'lazo-comunion', name: 'Lazo de Primera Comunión', emoji: '🤍', slot: 'neck', price: 180, level: 7 },
  { id: 'ramita-olivo', name: 'Ramita de olivo', emoji: '🌿', slot: 'beak', price: 50, level: 2 },
  { id: 'flor', name: 'Florecita', emoji: '🌼', slot: 'beak', price: 35, level: 1 },
  // Se desbloquean al subir de nivel
  { id: 'corazon', name: 'Corazoncito', emoji: '💗', slot: 'beak', price: 90, level: 10 },
  { id: 'boina', name: 'Boina', emoji: '🎨', slot: 'head', price: 140, level: 12 },
  { id: 'espiga', name: 'Espiga de trigo', emoji: '🌾', slot: 'beak', price: 160, level: 25 },
  { id: 'estrella', name: 'Estrellita', emoji: '⭐', slot: 'beak', price: 250, level: 40 },
  { id: 'gorro-chef', name: 'Gorro de cocinero', emoji: '👨‍🍳', slot: 'head', price: 300, level: 50 },
  { id: 'chalina-andina', name: 'Chalina andina', emoji: '🧣', slot: 'neck', price: 350, level: 70 },
  { id: 'chullo', name: 'Chullo andino', emoji: '🧶', slot: 'head', price: 380, level: 80 },
  { id: 'collar-estrellas', name: 'Collar de estrellas', emoji: '🌟', slot: 'neck', price: 500, level: 100 },
  // Premios por estrellas en los juegos (no se venden). En 75 hay uno para cada género.
  { id: 'corona-olivo', name: 'Corona de olivo', emoji: '🌿', slot: 'head', price: 0, level: 1, reward: 25 },
  { id: 'collar-perlas', name: 'Collar de perlas', emoji: '🦪', slot: 'neck', price: 0, level: 1, reward: 75, gender: 'mujer' },
  { id: 'lentes-aviador', name: 'Lentes de aviador', emoji: '🕶️', slot: 'face', price: 0, level: 1, reward: 75, gender: 'varon' },
  { id: 'bufanda-arcoiris', name: 'Bufanda arcoíris', emoji: '🌈', slot: 'neck', price: 0, level: 1, reward: 150 },
  { id: 'gorro-estrellas', name: 'Gorro de estrellas', emoji: '🌟', slot: 'head', price: 0, level: 1, reward: 300 },
  { id: 'sombrero-pastor', name: 'Sombrero de pastor', emoji: '🐑', slot: 'head', price: 0, level: 1, reward: 600 },
  { id: 'campanita', name: 'Campanita', emoji: '🔔', slot: 'neck', price: 0, level: 1, reward: 1000 },
  { id: 'corona-trigo', name: 'Corona de trigo', emoji: '👑', slot: 'head', price: 0, level: 1, reward: 2000 },
];

// Los lugares donde va cada cosa, en el orden en que se muestran.
export const SLOTS = ['body', 'head', 'face', 'neck', 'beak', 'feet'];
export const SLOT_NAMES = { body: 'Ropa', head: 'Para la cabeza', face: 'Lentes', neck: 'Para el cuello', beak: 'Para el pico', feet: 'Zapatos' };
export const SLOT_SHORT = { body: 'Ropa', head: 'Cabeza', face: 'Cara', neck: 'Cuello', beak: 'Pico', feet: 'Patitas' };

export const food = id => FOODS.find(f => f.id === id) || null;
export const accessory = id => ACCESSORIES.find(a => a.id === id) || null;
