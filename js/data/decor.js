// Decoración del Nido: cuadros, cuadrito, planta, alfombra y cortinas. Se compran con semillas en la tienda
// (pestaña «Casa») o se ganan. Los id empiezan con «d-» para no confundirse con los accesorios.
//   slot: 'cuadro' | 'cuadrito' | 'planta' | 'alfombra' | 'cortinas'
//   default: true → lo que trae la casa (no se compra)
//   earn: 'misa8' | 'flores7' → se gana (no se vende); note explica cómo
//   El dibujo de cada uno lo hace js/pet/rooms.js con el mismo id.
export const DECOR_SLOTS = [
  { id: 'cuadro', name: 'Cuadro grande', icon: '🖼️' },
  { id: 'cuadrito', name: 'Cuadrito', icon: '🔲' },
  { id: 'planta', name: 'Planta', icon: '🪴' },
  { id: 'alfombra', name: 'Alfombra', icon: '🟠' },
  { id: 'cortinas', name: 'Cortinas', icon: '🪟' },
];

export const DECOR = [
  { id: 'd-paisaje', slot: 'cuadro', name: 'Paisaje con sol', emoji: '🏞️', price: 0, level: 1, default: true },
  { id: 'd-buen-pastor', slot: 'cuadro', name: 'El Buen Pastor', emoji: '🐑', price: 120, level: 3 },
  { id: 'd-arca', slot: 'cuadro', name: 'El arca de Noé', emoji: '🌈', price: 140, level: 5 },
  { id: 'd-paloma-paz', slot: 'cuadro', name: 'La paloma de la paz', emoji: '🕊️', price: 160, level: 8 },
  { id: 'd-maria', slot: 'cuadro', name: 'La Virgen María', emoji: '💙', price: 180, level: 10 },
  { id: 'd-parroquia', slot: 'cuadro', name: 'Mi parroquia', emoji: '⛪', price: 0, level: 1, earn: 'misa8', note: 'Se gana con 8 sellos en el pasaporte de la Misa' },
  { id: 'd-estrella-belen', slot: 'cuadro', name: 'La estrella de Belén', emoji: '⭐', price: 0, level: 1, earn: 'flores7', note: 'Se gana con 7 flores de buenas obras' },

  { id: 'd-corazon', slot: 'cuadrito', name: 'Corazón', emoji: '❤️', price: 0, level: 1, default: true },
  { id: 'd-cruz', slot: 'cuadrito', name: 'Crucecita', emoji: '✝️', price: 40, level: 1 },
  { id: 'd-girasol', slot: 'cuadrito', name: 'Girasol', emoji: '🌻', price: 40, level: 2 },
  { id: 'd-manos', slot: 'cuadrito', name: 'Manos que rezan', emoji: '🙏', price: 50, level: 3 },
  { id: 'd-rosario', slot: 'cuadrito', name: 'Rosario', emoji: '📿', price: 60, level: 4 },

  { id: 'd-arbusto', slot: 'planta', name: 'Arbustito', emoji: '🌿', price: 0, level: 1, default: true },
  { id: 'd-cactus', slot: 'planta', name: 'Cactus', emoji: '🌵', price: 70, level: 2 },
  { id: 'd-girasoles', slot: 'planta', name: 'Girasoles', emoji: '🌻', price: 90, level: 3 },
  { id: 'd-rosas', slot: 'planta', name: 'Rosas', emoji: '🌹', price: 110, level: 5 },
  { id: 'd-olivo', slot: 'planta', name: 'Olivo', emoji: '🫒', price: 130, level: 7 },

  { id: 'd-redonda', slot: 'alfombra', name: 'Alfombra naranja', emoji: '🟠', price: 0, level: 1, default: true },
  { id: 'd-arcoiris', slot: 'alfombra', name: 'Arcoíris', emoji: '🌈', price: 100, level: 4 },
  { id: 'd-estrellas', slot: 'alfombra', name: 'Estrellas', emoji: '✨', price: 100, level: 6 },
  { id: 'd-andina', slot: 'alfombra', name: 'Andina', emoji: '🦙', price: 150, level: 9 },

  { id: 'd-rosadas', slot: 'cortinas', name: 'Rosadas', emoji: '🎀', price: 0, level: 1, default: true, color: '#ff9db5' },
  { id: 'd-celestes', slot: 'cortinas', name: 'Celestes', emoji: '💧', price: 50, level: 2, color: '#7cc8f5' },
  { id: 'd-amarillas', slot: 'cortinas', name: 'Amarillas', emoji: '🌼', price: 50, level: 2, color: '#ffd95e' },
  { id: 'd-verdes', slot: 'cortinas', name: 'Verdes', emoji: '🍀', price: 50, level: 3, color: '#8fd16a' },
  { id: 'd-moradas', slot: 'cortinas', name: 'Moradas', emoji: '🍇', price: 60, level: 4, color: '#b39af0' },
];

export const decorItem = id => DECOR.find(d => d.id === id) || null;
export const decorDefault = slot => DECOR.find(d => d.slot === slot && d.default) || null;
