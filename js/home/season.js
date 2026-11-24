// El año litúrgico y la hora del día en la casa de la palomita:
//   - la capilla se viste con el color del tiempo (morado, blanco, verde, rojo, rosado);
//   - en Adviento, la corona con las velas de cada semana encendidas;
//   - del 16 de diciembre al 6 de enero, el Nacimiento se arma figura por figura (el Niño llega el 24);
//   - en Navidad la musiquita es «Noche de paz»; dormida, una canción de cuna;
//   - las ventanas siguen la hora real (amanecer, día, atardecer, noche).
//
//   const info = await applySeason(world, fecha)   → { season, special, feast, line, christmas } o null
import { setTheme } from '../core/audio.js';
import { skyFor } from '../pet/rooms.js';

// Nacimiento: qué figura llega cada día de la novena (16 al 24 de diciembre) y dónde va.
const CRIB = [
  [{ emoji: '🛖', x: 0, z: -0.28, size: 0.62 }, { emoji: '🌾', x: 0, z: 0.05, size: 0.2 }],
  [{ emoji: '🐂', x: -0.34, z: -0.18, size: 0.3 }, { emoji: '🫏', x: 0.34, z: -0.18, size: 0.3 }],
  [{ emoji: '🐑', x: -0.5, z: 0.12, size: 0.22 }, { emoji: '🐑', x: 0.52, z: 0.16, size: 0.2 }],
  [{ emoji: '🧑‍🌾', x: -0.66, z: -0.02, size: 0.32 }],
  [{ emoji: '⭐', x: 0.05, y: 0.78, z: -0.3, size: 0.2 }],
  [{ emoji: '👼', x: -0.42, y: 0.5, z: -0.3, size: 0.24 }],
  [{ emoji: '🧔', x: 0.22, z: 0.0, size: 0.32 }],
  [{ emoji: '👩', x: -0.2, z: 0.0, size: 0.3 }],
  [{ emoji: '👶', x: 0, y: 0.03, z: 0.07, size: 0.16 }],
];
const md = d => (d.getMonth() + 1) * 100 + d.getDate();

export async function applySeason(world, date = new Date()) {
  try { world.setSky(skyFor(date)); } catch { /* sin mundo 3D */ }
  let L, F;
  try { [L, F] = await Promise.all([import('../core/liturgy.js'), import('../data/fiestas.js')]); } catch { return null; }
  const season = L.seasonOf(date);
  const special = season.special ? F.SPECIAL_DAYS?.[season.special] || null : null;
  const feasts = L.feastsOn(date) || [];
  const feast = feasts[0] || null;
  // Capilla: color y corona de Adviento
  world.setLiturgy({ color: L.colorHex(season.color), advent: season.id === 'adviento', candles: L.adventCandles(date) });
  // Nacimiento: del 16/12 (día 1 de la novena) al 6/1
  const n = L.novenaDay(date);
  const m = md(date);
  const days = n || (m >= 1225 || m <= 106 ? 9 : 0);
  world.setCrib(days ? CRIB.slice(0, days).flat() : []);
  const christmas = m >= 1224 || m <= 106;
  const line = special?.kidLine || (feast ? `¡Hoy es fiesta: ${feast.title}! ${feast.emoji || '🎉'}` : '') || F.SEASONS?.[season.id]?.kidLine || '';
  return { season, special, feast, line, christmas, novena: n ? F.NOVENA?.[n - 1] || null : null };
}

// Musiquita según el momento: canción de cuna si duerme, villancico en Navidad, la de siempre el resto.
export function musicFor({ sleeping = false, christmas = false } = {}) {
  setTheme(sleeping ? 'cuna' : christmas ? 'navidad' : null);
}
