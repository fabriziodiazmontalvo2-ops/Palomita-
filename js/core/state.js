// Estado y progreso del juego (se guarda en el navegador del niño; nada sale del dispositivo).
//
// API principal
//   init()                         carga la partida, aplica el tiempo transcurrido y el cambio de día
//   get()                          objeto de estado vivo (solo lectura por convención)
//   on(evento, fn) -> off()        eventos: 'change' | 'stat' | 'coins' | 'level' | 'sleep' | 'inventory' | 'wear' | 'settings' | 'reset'
//   stat(n) / addStat(n, d) / setStat(n, v)      n ∈ STATS; valores 0..100
//   addCoins(n) / spendCoins(n) -> bool / addXp(n) -> { leveled, level }
//   addItem(id, n) / useItem(id) -> bool / countItem(id)
//   own(id) / owns(id) / wear(slot, id|null) / setDecor(clave, id)
//   gameResult(id, { score, won, goal }) -> { best, newBest, firstSticker, plays }
//   markRead(id) -> bool (true la primera vez) / isRead(id) / markQuiz(id) / quizDone(id)
//   prayed(id) -> { firstToday } / dailyOnce(clave) -> bool (true la primera vez de hoy)
//   setSleeping(bool) / tick(segundos) / mood() / wellbeing()
//   setting(k) / setSetting(k, v) / flag(k) / setFlag(k, v) / save() / reset()

const KEY = 'palomita.save.v1';

export const STATS = ['hambre', 'energia', 'limpieza', 'alegria', 'fe'];
export const STAT_META = {
  hambre: { label: 'Comida', icon: '🍞', color: 'var(--st-hambre)' },
  energia: { label: 'Sueño', icon: '🌙', color: 'var(--st-energia)' },
  limpieza: { label: 'Baño', icon: '🫧', color: 'var(--st-limpieza)' },
  alegria: { label: 'Alegría', icon: '🎈', color: 'var(--st-alegria)' },
  fe: { label: 'Fe', icon: '🕯️', color: 'var(--st-fe)' },
};
export const COIN = { name: 'semillas', one: 'semilla', icon: '🌱' };

// Cambio por minuto. La fe baja muy despacio y nunca se apaga del todo.
const DECAY_AWAKE = { hambre: -1.0, energia: -0.6, limpieza: -0.5, alegria: -0.8, fe: -0.12 };
const DECAY_ASLEEP = { hambre: -0.4, energia: +6, limpieza: 0, alegria: 0, fe: 0 };
const FLOOR = { hambre: 0, energia: 0, limpieza: 0, alegria: 0, fe: 15 };
const OFFLINE_FLOOR = 25;           // al volver, la palomita nunca está "abandonada"
const OFFLINE_CAP_MIN = 12 * 60;

function defaults() {
  const now = Date.now();
  return {
    v: 1,
    name: 'Palomita',
    kid: '',
    created: now,
    lastSeen: now,
    stats: { hambre: 72, energia: 85, limpieza: 80, alegria: 70, fe: 45 },
    sleeping: false,
    coins: 60,
    xp: 0,
    level: 1,
    inventory: { pan: 3, agua: 3, manzana: 2, uvas: 1 },
    owned: [],
    wearing: { head: null, neck: null, beak: null },
    decor: {},
    games: {},
    read: {},
    quiz: {},
    prayers: {},
    daily: { date: '', done: {} },
    days: 0,
    settings: { sound: true, music: true, voice: true },
    flags: {},
  };
}

let S = defaults();
let storageOk = true;
let saveTimer = 0;
const listeners = new Map();

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function on(evt, fn) {
  if (!listeners.has(evt)) listeners.set(evt, new Set());
  listeners.get(evt).add(fn);
  return () => listeners.get(evt)?.delete(fn);
}
function emit(evt, data) {
  for (const fn of listeners.get(evt) || []) { try { fn(data); } catch (e) { console.error(e); } }
  if (evt !== 'change') for (const fn of listeners.get('change') || []) { try { fn({ evt, data }); } catch (e) { console.error(e); } }
}

function merge(base, saved) {
  if (!saved || typeof saved !== 'object') return base;
  for (const k of Object.keys(base)) {
    const b = base[k], s = saved[k];
    if (s === undefined || s === null) continue;
    if (b && typeof b === 'object' && !Array.isArray(b)) base[k] = { ...b, ...(typeof s === 'object' && !Array.isArray(s) ? s : {}) };
    else if (Array.isArray(b)) base[k] = Array.isArray(s) ? s.slice() : b;
    else if (typeof s === typeof b) base[k] = s;
  }
  return base;
}

export function init() {
  S = defaults();
  let fresh = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { merge(S, JSON.parse(raw)); fresh = false; }
  } catch { storageOk = false; }
  for (const n of STATS) S.stats[n] = clamp(Number(S.stats[n]) || 0, 0, 100);
  if (!fresh) applyOffline();
  rollDay();
  S.lastSeen = Date.now();
  save();
  return { fresh };
}

function applyOffline() {
  const mins = clamp((Date.now() - (S.lastSeen || Date.now())) / 60000, 0, OFFLINE_CAP_MIN);
  if (mins < 0.5) return;
  const rate = S.sleeping ? DECAY_ASLEEP : DECAY_AWAKE;
  for (const n of STATS) {
    const before = S.stats[n];
    let v = before + rate[n] * mins;
    if (rate[n] < 0) v = Math.max(v, Math.min(before, n === 'fe' ? FLOOR.fe : OFFLINE_FLOOR));
    S.stats[n] = clamp(v, FLOOR[n], 100);
  }
  // Si durmió lo suficiente, amanece despierta.
  if (S.sleeping && S.stats.energia >= 99) S.sleeping = false;
}

function rollDay() {
  const today = todayKey();
  if (S.daily.date !== today) {
    S.daily = { date: today, done: {} };
    S.days = (S.days || 0) + 1;
    return true;
  }
  return false;
}

export function get() { return S; }

export function save() {
  S.lastSeen = Date.now();
  if (!storageOk) return;
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { storageOk = false; }
}
function saveSoon() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => { saveTimer = 0; save(); }, 800);
}

export function reset() {
  S = defaults();
  rollDay();
  save();
  emit('reset');
}

// ── Medidores ──
export function stat(n) { return S.stats[n] ?? 0; }
export function setStat(n, v) {
  if (!STATS.includes(n)) return 0;
  const nv = clamp(v, FLOOR[n], 100);
  if (nv !== S.stats[n]) { S.stats[n] = nv; emit('stat', { name: n, value: nv }); saveSoon(); }
  return nv;
}
export function addStat(n, d) { return setStat(n, stat(n) + d); }

export function wellbeing() {
  const s = S.stats;
  return (s.hambre + s.energia + s.limpieza + s.alegria) / 4;
}
// Estado de ánimo derivado, para la animación de la palomita.
export function mood() {
  const s = S.stats;
  if (S.sleeping) return 'sleepy';
  if (s.energia < 22) return 'sleepy';
  if (s.hambre < 22) return 'hungry';
  const low = Math.min(s.hambre, s.energia, s.limpieza, s.alegria);
  if (low < 18 || wellbeing() < 35) return 'sad';
  if (wellbeing() > 82 && s.alegria > 75) return 'excited';
  if (wellbeing() > 55) return 'happy';
  return 'neutral';
}
// Qué necesita más ahora (o null si está bien): 'hambre' | 'energia' | 'limpieza' | 'alegria'
export function need() {
  const s = S.stats;
  let worst = null, min = 40;
  for (const n of ['hambre', 'energia', 'limpieza', 'alegria']) if (s[n] < min) { min = s[n]; worst = n; }
  return worst;
}

export function setSleeping(on) {
  on = !!on;
  if (S.sleeping === on) return;
  S.sleeping = on;
  emit('sleep', on);
  save();
}

// Avance del tiempo dentro de la sesión.
export function tick(seconds) {
  const mins = seconds / 60;
  const rate = S.sleeping ? DECAY_ASLEEP : DECAY_AWAKE;
  let changed = false;
  for (const n of STATS) {
    if (!rate[n]) continue;
    const nv = clamp(S.stats[n] + rate[n] * mins, FLOOR[n], 100);
    if (Math.round(nv) !== Math.round(S.stats[n])) changed = true;
    S.stats[n] = nv;
  }
  if (rollDay()) { changed = true; emit('day'); }
  if (changed) { emit('stat', { name: '*' }); saveSoon(); }
}

// ── Semillas (monedas), experiencia y nivel ──
export const MAX_LEVEL = 100;
// Experiencia para pasar del nivel `level` al siguiente. Crecer hasta el 100 es un camino largo, como en las mascotas virtuales.
export function xpForLevel(level) { return 30 + level * 6; }
export function addCoins(n) {
  n = Math.round(n);
  if (!n) return S.coins;
  S.coins = Math.max(0, S.coins + n);
  emit('coins', { coins: S.coins, delta: n });
  saveSoon();
  return S.coins;
}
export function spendCoins(n) {
  if (S.coins < n) return false;
  addCoins(-n);
  return true;
}
export function addXp(n) {
  if (S.level >= MAX_LEVEL) { S.xp = 0; saveSoon(); return { leveled: false, level: S.level }; }
  S.xp += Math.max(0, Math.round(n));
  const from = S.level;
  while (S.level < MAX_LEVEL && S.xp >= xpForLevel(S.level)) {
    S.xp -= xpForLevel(S.level);
    S.level++;
  }
  if (S.level >= MAX_LEVEL) S.xp = 0;
  const leveled = S.level > from;
  // Los premios de cada nivel nuevo los entrega js/core/rewards.js al escuchar este evento.
  if (leveled) emit('level', { level: S.level, from });
  else emit('change', { evt: 'xp' });
  saveSoon();
  return { leveled, level: S.level };
}

// ── Inventario, accesorios y decoración ──
export function countItem(id) { return S.inventory[id] || 0; }
export function addItem(id, n = 1) {
  S.inventory[id] = Math.max(0, countItem(id) + n);
  emit('inventory', { id, count: S.inventory[id] });
  saveSoon();
  return S.inventory[id];
}
export function useItem(id) {
  if (countItem(id) <= 0) return false;
  addItem(id, -1);
  return true;
}
export function owns(id) { return S.owned.includes(id); }
export function own(id) {
  if (!owns(id)) { S.owned.push(id); emit('inventory', { id, owned: true }); saveSoon(); }
}
export function wear(slot, id) {
  S.wearing[slot] = id || null;
  emit('wear', { slot, id: id || null });
  saveSoon();
}
export function setDecor(key, id) {
  S.decor[key] = id;
  emit('wear', { decor: key, id });
  saveSoon();
}

// ── Juegos ──
export function gameInfo(id) { return S.games[id] || { plays: 0, best: 0, sticker: false }; }
export function gameResult(id, { score = 0, won = false, goal = 0 } = {}) {
  const g = S.games[id] || (S.games[id] = { plays: 0, best: 0, sticker: false });
  g.plays++;
  const newBest = score > g.best;
  if (newBest) g.best = score;
  let firstSticker = false;
  if (!g.sticker && (won || (goal > 0 && score >= goal))) { g.sticker = true; firstSticker = true; }
  save();
  emit('change', { evt: 'game', id });
  return { best: g.best, newBest, firstSticker, plays: g.plays };
}
export function stickers() { return Object.keys(S.games).filter(id => S.games[id].sticker); }

// ── Niveles de cada juego (1 a 100) ──
// games[id].lv = nivel más alto desbloqueado · games[id].st = estrellas de cada nivel ("0".."3", un carácter por nivel)
// games[id].medals = medallas ganadas (25, 50, 75, 100)
export function levelProgress(id) {
  const g = S.games[id] || {};
  const st = typeof g.st === 'string' ? g.st : '';
  let total = 0;
  for (const c of st) total += +c || 0;
  return {
    unlocked: Math.max(1, Math.min(MAX_LEVEL, g.lv || 1)),
    stars: n => +(st[n - 1] || 0),
    total,
    cleared: [...st].filter(c => +c > 0).length,
    medals: Array.isArray(g.medals) ? g.medals.slice() : [],
  };
}
export function recordLevel(id, n, { won = false, stars = 0, score = 0 } = {}) {
  const g = S.games[id] || (S.games[id] = { plays: 0, best: 0, sticker: false });
  g.plays = (g.plays || 0) + 1;
  if (score > (g.best || 0)) g.best = score;
  let st = typeof g.st === 'string' ? g.st : '';
  if (st.length < MAX_LEVEL) st = st.padEnd(MAX_LEVEL, '0');
  const prev = +st[n - 1] || 0;
  const got = won ? Math.max(1, Math.min(3, stars | 0)) : 0;
  const best = Math.max(prev, got);
  g.st = st.slice(0, n - 1) + best + st.slice(n);
  const firstClear = won && prev === 0;
  let unlockedNow = false;
  if (won && n >= (g.lv || 1) && n < MAX_LEVEL) { g.lv = n + 1; unlockedNow = true; }
  if (won && !g.sticker) g.sticker = true;
  let medal = null;
  if (firstClear && [25, 50, 75, 100].includes(n)) {
    g.medals = Array.isArray(g.medals) ? g.medals : [];
    if (!g.medals.includes(n)) { g.medals.push(n); medal = n; }
  }
  save();
  emit('change', { evt: 'level', id, n });
  return { firstClear, prevStars: prev, stars: best, gainedStars: Math.max(0, got - prev), unlockedNow, medal };
}
export function totalStars() {
  let t = 0;
  for (const id of Object.keys(S.games)) t += levelProgress(id).total;
  return t;
}

// ── Lecturas, preguntas y oraciones ──
export function isRead(id) { return !!S.read[id]; }
export function markRead(id) {
  if (S.read[id]) return false;
  S.read[id] = Date.now();
  save();
  emit('change', { evt: 'read', id });
  return true;
}
export function quizDone(id) { return !!S.quiz[id]; }
export function markQuiz(id) {
  if (S.quiz[id]) return false;
  S.quiz[id] = true;
  save();
  emit('change', { evt: 'quiz', id });
  return true;
}
// Marca algo como hecho hoy. Devuelve true solo la primera vez del día.
export function dailyOnce(key) {
  rollDay();
  if (S.daily.done[key]) return false;
  S.daily.done[key] = true;
  saveSoon();
  return true;
}
export function doneToday(key) { rollDay(); return !!S.daily.done[key]; }
export function prayed(id) {
  S.prayers[id] = (S.prayers[id] || 0) + 1;
  const firstToday = dailyOnce('pray:' + id);
  saveSoon();
  emit('change', { evt: 'pray', id });
  return { firstToday, count: S.prayers[id] };
}

// ── Ajustes y marcas ──
export function setting(k) { return S.settings[k]; }
export function setSetting(k, v) { S.settings[k] = v; emit('settings', { key: k, value: v }); save(); }
export function flag(k) { return S.flags[k]; }
export function setFlag(k, v = true) { S.flags[k] = v; saveSoon(); }
export function setNames({ name, kid } = {}) {
  if (typeof name === 'string' && name.trim()) S.name = name.trim().slice(0, 14);
  if (typeof kid === 'string') S.kid = kid.trim().slice(0, 14);
  save();
  emit('change', { evt: 'names' });
}
