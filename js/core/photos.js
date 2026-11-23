// Álbum de fotos de la palomita (solo de la escena 3D: no usa la cámara del teléfono).
// Se guarda aparte de la partida, en este dispositivo, con un máximo de fotos para no llenar la memoria.
const KEY = 'palomita.photos.v1';
const MAX = 12;

export function list() {
  try { const a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; } catch { return []; }
}
export function add(dataUrl, caption = '') {
  const a = list();
  a.unshift({ src: dataUrl, at: Date.now(), caption });
  while (a.length > MAX) a.pop();
  for (let tries = 0; tries < 4; tries++) {
    try { localStorage.setItem(KEY, JSON.stringify(a)); return true; } catch { a.pop(); }
  }
  return false;
}
export function remove(at) {
  const a = list().filter(p => p.at !== at);
  try { localStorage.setItem(KEY, JSON.stringify(a)); } catch { /* nada */ }
}
export const MAX_PHOTOS = MAX;
