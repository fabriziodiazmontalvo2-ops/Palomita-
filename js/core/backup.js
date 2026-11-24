// Copia de seguridad: todo el avance de Palomita en un archivo, para cambiar de teléfono o por si algo se borra.
// Incluye las partidas de todos los niños (perfiles), sus figuritas, los datos de la parroquia y, si se elige,
// las fotos. Es un archivo de texto (JSON) que la familia guarda donde quiera (Drive, WhatsApp, una memoria USB).
//
//   collect({ photos }) → objeto listo para guardar        fileName() → 'palomita-copia-AAAA-MM-DD.json'
//   inspect(texto) → { ok, error, data, kids: [{ kid, name, level }], at, photos }   revisa sin cambiar nada
//   apply(data) → true si se pudo escribir (después hay que recargar la app)
import { VERSION } from './version.js';
import { todayKey } from './state.js';

const FORMAT = 1;
const PREFIX = 'palomita.';
// Claves que nunca viajan en la copia: la clave de grandes y la calidad gráfica son de cada teléfono.
const SKIP = new Set(['palomita.grandes.v1', 'palomita.gfx.v1', 'palomita.device.v1']);

function keys() {
  const out = [];
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(PREFIX) && !SKIP.has(k)) out.push(k); } } catch { /* sin acceso */ }
  return out.sort();
}

export function collect({ photos = false } = {}) {
  const data = {};
  for (const k of keys()) {
    if (!photos && k.startsWith('palomita.photos.')) continue;
    if (k.endsWith('.prev')) continue;                      // las copias del día anterior no hacen falta
    try { const v = localStorage.getItem(k); if (v !== null) data[k] = v; } catch { /* nada */ }
  }
  return { app: 'palomita', format: FORMAT, version: VERSION, at: Date.now(), photos: !!photos, data };
}
export function fileName() { return `palomita-copia-${todayKey()}.json`; }

export function inspect(text) {
  let obj;
  try { obj = JSON.parse(String(text || '')); } catch { return { ok: false, error: 'El archivo no es una copia de Palomita.' }; }
  if (!obj || obj.app !== 'palomita' || typeof obj.data !== 'object' || !obj.data) return { ok: false, error: 'El archivo no es una copia de Palomita.' };
  if (obj.format > FORMAT) return { ok: false, error: 'Esta copia es de una versión más nueva de Palomita. Actualiza la app primero.' };
  const kids = [];
  for (const [k, v] of Object.entries(obj.data)) {
    if (typeof k !== 'string' || !k.startsWith(PREFIX) || typeof v !== 'string') return { ok: false, error: 'La copia está dañada.' };
    if (k === 'palomita.save.v1' || k.startsWith('palomita.save.v1@')) {
      try { const s = JSON.parse(v); kids.push({ kid: String(s.kid || ''), name: String(s.name || 'Palomita'), level: Number(s.level) || 1 }); }
      catch { return { ok: false, error: 'La copia está dañada.' }; }
    } else {
      try { JSON.parse(v); } catch { return { ok: false, error: 'La copia está dañada.' }; }
    }
  }
  if (!kids.length) return { ok: false, error: 'La copia no trae ninguna partida.' };
  return { ok: true, data: obj.data, kids, at: Number(obj.at) || 0, photos: !!obj.photos };
}

// Reemplaza el avance de este teléfono por el de la copia (antes guarda lo actual como «.prev» por si acaso).
export function apply(data) {
  try {
    for (const k of keys()) {
      if (k.endsWith('.prev')) continue;
      if (!data[k] && !(k.startsWith('palomita.photos.'))) {
        const v = localStorage.getItem(k);
        if (v !== null) localStorage.setItem(k + '.prev', v);
        localStorage.removeItem(k);
      }
    }
    for (const [k, v] of Object.entries(data)) {
      const cur = localStorage.getItem(k);
      if (cur !== null && !k.startsWith('palomita.photos.')) localStorage.setItem(k + '.prev', cur);
      localStorage.setItem(k, v);
    }
    return true;
  } catch { return false; }
}
