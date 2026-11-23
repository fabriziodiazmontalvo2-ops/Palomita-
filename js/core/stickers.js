// Colección de figuritas: sobres, figuritas pegadas, repetidas, cambios y premios por página.
// Se guarda aparte de la partida principal (clave 'palomita.stickers.v1').
//
//   grantPack(n = 1, reason = '')         regala n sobres (reason: texto corto para el aviso, p. ej. 'Regalo del día')
//   grantPackOnce(key, n, reason)         igual, pero una sola vez por clave (p. ej. 'lesson:creacion'); true si se dio
//   packsAvailable()                       sobres sin abrir
//   openPack()                             abre un sobre → { cards: [{ sticker, isNew, count }], prizes } o null
//   buyPack()                              compra un sobre con semillas → true/false
//   tradeDuplicates()                      cambia TRADE_COST repetidas por una figurita que falta → { sticker, used } o null
//   progress()                             { owned, total, pages: { [pageId]: { owned, total, done, claimed } }, packs, dupes }
//   count(id) / has(id) / isUnseen(id) / markSeen(id) / duplicates()
//   on(evento, fn) → off()                 eventos: 'packs' ({ packs, delta, reason }), 'change'
//   reset()                                borra la colección (para «empezar de nuevo»)
import * as state from './state.js';
import { STICKERS, PAGES, RARITY, PACK_SIZE, PACK_PRICE, TRADE_COST, PAGE_PRIZE, ALBUM_PRIZE } from '../data/stickers.js';

const KEY = 'palomita.stickers.v1';
const BY_ID = new Map(STICKERS.map(s => [s.id, s]));

function fresh() {
  return { v: 1, owned: {}, packs: 0, opened: 0, dry: 0, claimed: {}, once: {}, unseen: {}, album: false };
}
let S = load();
const listeners = new Map();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const d = JSON.parse(raw);
    const base = fresh();
    for (const k of Object.keys(base)) if (d && d[k] !== undefined && typeof d[k] === typeof base[k]) base[k] = d[k];
    // Solo se conservan figuritas que existen.
    for (const id of Object.keys(base.owned)) if (!BY_ID.has(id) || !(base.owned[id] > 0)) delete base.owned[id];
    return base;
  } catch { return fresh(); }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* sin almacenamiento: se juega igual */ } }
function emit(evt, data) {
  for (const fn of listeners.get(evt) || []) { try { fn(data); } catch (e) { console.error(e); } }
  if (evt !== 'change') for (const fn of listeners.get('change') || []) { try { fn({ evt, data }); } catch (e) { console.error(e); } }
  try { window.dispatchEvent(new CustomEvent('palomita:stickers', { detail: { evt, data } })); } catch { /* nada */ }
}
export function on(evt, fn) {
  if (!listeners.has(evt)) listeners.set(evt, new Set());
  listeners.get(evt).add(fn);
  return () => listeners.get(evt)?.delete(fn);
}

export const all = () => STICKERS;
export const byId = id => BY_ID.get(id) || null;
export const pageOf = id => PAGES.find(p => p.id === BY_ID.get(id)?.page) || null;
export const count = id => S.owned[id] || 0;
export const has = id => count(id) > 0;
export const isUnseen = id => !!S.unseen[id];
export function markSeen(id) { if (S.unseen[id]) { delete S.unseen[id]; save(); } }
export const packsAvailable = () => S.packs;
export const missing = () => STICKERS.filter(s => !has(s.id));
export function duplicates() { return STICKERS.filter(s => count(s.id) > 1).map(s => ({ sticker: s, extra: count(s.id) - 1 })); }
const dupeTotal = () => duplicates().reduce((a, d) => a + d.extra, 0);

export function progress() {
  const pages = {};
  for (const p of PAGES) {
    const list = STICKERS.filter(s => s.page === p.id);
    const owned = list.filter(s => has(s.id)).length;
    pages[p.id] = { owned, total: list.length, done: owned === list.length, claimed: !!S.claimed[p.id] };
  }
  const owned = STICKERS.filter(s => has(s.id)).length;
  return { owned, total: STICKERS.length, pages, packs: S.packs, dupes: dupeTotal(), opened: S.opened, complete: owned === STICKERS.length };
}

export function grantPack(n = 1, reason = '') {
  n = Math.max(0, Math.round(n));
  if (!n) return S.packs;
  S.packs += n;
  save();
  emit('packs', { packs: S.packs, delta: n, reason });
  return S.packs;
}
export function grantPackOnce(key, n = 1, reason = '') {
  if (!key || S.once[key]) return false;
  S.once[key] = Date.now();
  grantPack(n, reason);
  return true;
}
export function buyPack() {
  if (!state.spendCoins(PACK_PRICE)) return false;
  grantPack(1, 'Compraste un sobre');
  return true;
}

// ── Sorteo ──
function pickRarity(rand) {
  const total = Object.values(RARITY).reduce((a, r) => a + r.weight, 0);
  let x = rand() * total;
  for (const [k, r] of Object.entries(RARITY)) { x -= r.weight; if (x < 0) return k; }
  return 'comun';
}
// Dentro de una rareza, las que faltan salen el doble de seguido (así la colección avanza con alegría).
function pickSticker(rarity, rand, exclude) {
  const pool = STICKERS.filter(s => s.rarity === rarity && !exclude.has(s.id));
  const list = pool.length ? pool : STICKERS.filter(s => !exclude.has(s.id));
  const w = s => (has(s.id) ? 1 : 2);
  const total = list.reduce((a, s) => a + w(s), 0);
  let x = rand() * total;
  for (const s of list) { x -= w(s); if (x < 0) return s; }
  return list[list.length - 1];
}

export function openPack(rand = Math.random) {
  if (S.packs <= 0) return null;
  const exclude = new Set();
  const picks = [];
  const firstEver = S.opened === 0;
  for (let i = 0; i < PACK_SIZE; i++) {
    let s;
    // El primer sobre de la vida trae solo figuritas distintas y una de ellas es Jesús Resucitado.
    if (firstEver && i === 0) s = BY_ID.get('resucitado');
    else s = pickSticker(pickRarity(rand), rand, exclude);
    exclude.add(s.id);
    picks.push(s);
  }
  // Garantía: como mínimo una figurita nueva cada 2 sobres.
  const anyNew = picks.some(s => !has(s.id));
  const miss = missing().filter(s => !exclude.has(s.id));
  if (!anyNew && S.dry >= 1 && miss.length) {
    const k = picks.length - 1;
    picks[k] = miss[Math.floor(rand() * miss.length)];
  }
  S.packs--;
  S.opened++;
  const before = progress();
  const cards = picks.map(s => {
    const isNew = !has(s.id);
    S.owned[s.id] = count(s.id) + 1;
    if (isNew) S.unseen[s.id] = 1;
    return { sticker: s, isNew, count: S.owned[s.id] };
  });
  S.dry = cards.some(c => c.isNew) ? 0 : S.dry + 1;
  const prizes = checkPrizes(before);
  save();
  emit('packs', { packs: S.packs, delta: -1 });
  emit('opened', { cards, prizes });
  return { cards, prizes };
}

export function tradeDuplicates(rand = Math.random) {
  const miss = missing();
  if (!miss.length || dupeTotal() < TRADE_COST) return null;
  const before = progress();
  // Se entregan primero las que más se repiten.
  let left = TRADE_COST;
  const used = [];
  while (left > 0) {
    const d = duplicates().sort((a, b) => b.extra - a.extra || b.sticker.n - a.sticker.n)[0];
    if (!d) break;
    S.owned[d.sticker.id]--;
    used.push(d.sticker);
    left--;
  }
  const s = miss[Math.floor(rand() * miss.length)];
  S.owned[s.id] = 1;
  S.unseen[s.id] = 1;
  const prizes = checkPrizes(before);
  save();
  emit('traded', { sticker: s, used, prizes });
  return { sticker: s, used, prizes };
}

// Premios por páginas completas y por el álbum entero (una sola vez cada uno).
function checkPrizes() {
  const out = [];
  const p = progress();
  for (const pg of PAGES) {
    if (p.pages[pg.id].done && !S.claimed[pg.id]) {
      S.claimed[pg.id] = Date.now();
      out.push({ page: pg, ...give(PAGE_PRIZE) });
    }
  }
  if (p.complete && !S.album) {
    S.album = true;
    out.push({ album: true, ...give(ALBUM_PRIZE) });
  }
  return out;
}
function give({ coins = 0, xp = 0, fe = 0, accessory = null }) {
  const items = [];
  if (coins) { state.addCoins(coins); items.push({ icon: state.COIN.icon, text: `+${coins} ${state.COIN.name}` }); }
  if (fe) { state.addStat('fe', fe); items.push({ icon: '🕯️', text: `+${fe} de Fe` }); }
  if (xp) { state.addXp(xp); items.push({ icon: '⭐', text: `+${xp} de experiencia` }); }
  if (accessory && !state.owns(accessory)) { state.own(accessory); items.push({ icon: '🔔', text: 'Un accesorio nuevo: ¡la Campanita!', big: true }); }
  return { items };
}

export function reset() { S = fresh(); save(); emit('packs', { packs: 0, delta: 0 }); }

// Para pruebas: window.__stickers
try { window.__stickers = { grantPack, openPack, progress, reset, tradeDuplicates }; } catch { /* nada */ }
