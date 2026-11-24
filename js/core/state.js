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
//   setSleeping(bool) / tick(segundos) / resume(segundos) / takeAway() / mood() / wellbeing()
//   setting(k) / setSetting(k, v) / flag(k) / setFlag(k, v) / save() / reset()
//   Fechas especiales: date(k) / setDate(k, 'AAAA-MM-DD')                     k: cumple | bautismo
//   Misiones de buenas obras: mission() / acceptMission({ text, from }) / missionDone() / missionLater() / deeds()
//   Pasaporte de Misa: massKey(fecha) / massLog() / logMass(clave, datos) / massStamped(clave)
//   Lo sé de memoria: memorized(id) / setMemorized(id, 'nino' | 'grande' | null)
//   Mis repasos: reviewMiss(clave) / reviewHit(clave) / reviewDue() / reviewCount() / reviewNext() / reviewDrop(clave)
//   Intenciones y diario: intentions() / addIntention(it) / removeIntention(at) / journal() / addJournal(entry)
//   Actividad (para el informe de los papás): logActivity(puntos) / activity(días)
//   Género de la palomita: gender() → 'varon' | 'mujer' | null (todavía no lo eligió) / setGender(g, { refund })
//
// Cada niño (perfil) tiene su propia partida: ver js/core/profiles.js. Una vez al día se guarda una copia
// de la partida anterior (clave + '.prev') para poder recuperarla si algo se daña o se borra sin querer.
import { keyFor } from './profiles.js';
import { ACCESSORIES } from '../data/items.js';

const KEY = keyFor('palomita.save.v1');
const VERSION_DATA = 2;

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
    gender: null,           // 'varon' | 'mujer': lo elige el niño al empezar (null = todavía no)
    wearing: { body: null, head: null, face: null, neck: null, beak: null, feet: null },
    decor: {},
    games: {},
    read: {},
    quiz: {},
    prayers: {},
    daily: { date: '', done: {} },
    days: 0,
    settings: { sound: true, music: true, voice: true },
    flags: {},
    dates: { cumple: '', bautismo: '' },
    mission: null,          // { text, from, at, day, later }  misión de buenas obras aceptada
    deeds: [],              // [{ day, text }]  misiones cumplidas (cada una es una flor en la jardinera)
    massLog: {},            // { 'AAAA-MM-DD' del domingo: { at, color, liked, ok } }  ok = lo confirmó un grande
    memorized: {},          // { id: { at, by: 'nino' | 'grande' } }
    review: {},             // { clave: { box: 1–4, due: 'AAAA-MM-DD' } }
    intentions: [],         // [{ id, label, emoji, at, sick }]  (máximo 5)
    journal: [],            // [{ day, thanks: [ids], text }]   (máximo 60)
    activity: {},           // { 'AAAA-MM-DD': puntos }        (últimos 60 días)
  };
}

let S = defaults();
let storageOk = true;
let saveTimer = 0;
let away = 0;               // minutos que estuvo sin verla (al abrir o al volver del segundo plano)
let recovered = false;      // la partida estaba dañada y se recuperó la copia del día anterior
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
    else if (b === null || typeof s === typeof b) base[k] = s;      // null en la partida nueva: lo guardado vale (p. ej. gender)
  }
  return base;
}

export function init() {
  S = defaults();
  let fresh = true, raw = null;
  try { raw = localStorage.getItem(KEY); } catch { storageOk = false; }
  if (raw) {
    try { merge(S, JSON.parse(raw)); fresh = false; }
    catch {
      // Partida dañada: se intenta con la copia del día anterior antes de empezar de cero.
      try {
        const prev = localStorage.getItem(KEY + '.prev');
        if (prev) { merge(S, JSON.parse(prev)); fresh = false; recovered = true; raw = null; }
      } catch { /* tampoco sirve */ }
      if (fresh) { storageOk = false; S = defaults(); }   // no se sobrescribe lo dañado: quizá se pueda rescatar
    }
  }
  migrate(S);
  for (const n of STATS) S.stats[n] = clamp(Number(S.stats[n]) || 0, 0, 100);
  if (!fresh) away = applyOffline((Date.now() - (S.lastSeen || Date.now())) / 60000);
  // Copia de la partida del día anterior (una vez por día, la primera vez que se abre).
  const today = todayKey();
  if (raw && storageOk && S.flags.snapDay !== today) {
    try { localStorage.setItem(KEY + '.prev', raw); S.flags.snapDay = today; } catch { /* sin espacio: no pasa nada */ }
  }
  rollDay();
  S.lastSeen = Date.now();
  save();
  return { fresh, recovered };
}

// Pone al día partidas guardadas por versiones anteriores (los campos nuevos los completa merge()).
function migrate(st) {
  if (!st.v || st.v < 2) {
    // Antes de la 1.3 los cuestionarios se guardaban con «true»: siguen contando como hechos, sin fecha.
    st.v = 2;
  }
  if (!Array.isArray(st.deeds)) st.deeds = [];
  // 1.4: la palomita tiene género y ropa nueva (ropa, lentes y zapatos)
  if (st.gender !== 'varon' && st.gender !== 'mujer') st.gender = null;
  st.wearing = { body: null, head: null, face: null, neck: null, beak: null, feet: null, ...(st.wearing || {}) };
  if (!Array.isArray(st.intentions)) st.intentions = [];
  if (!Array.isArray(st.journal)) st.journal = [];
  if (st.v > VERSION_DATA) st.v = VERSION_DATA;
}

// Tiempo sin verla (al abrir la app o al volver del segundo plano): los medidores bajan, pero nunca la encuentra
// «en cero»: se quedan en un mínimo amable y se cuenta como mucho 12 horas.
function applyOffline(minutes) {
  const mins = clamp(minutes, 0, OFFLINE_CAP_MIN);
  if (mins < 0.5) return 0;
  const rate = S.sleeping ? DECAY_ASLEEP : DECAY_AWAKE;
  for (const n of STATS) {
    const before = S.stats[n];
    let v = before + rate[n] * mins;
    if (rate[n] < 0) v = Math.max(v, Math.min(before, n === 'fe' ? FLOOR.fe : OFFLINE_FLOOR));
    S.stats[n] = clamp(v, FLOOR[n], 100);
  }
  // Si durmió lo suficiente, amanece despierta.
  if (S.sleeping && S.stats.energia >= 99) S.sleeping = false;
  return mins;
}
// Al volver a la app después de tenerla en segundo plano (sin cerrarla).
export function resume(seconds) {
  const mins = seconds / 60;
  if (mins < 0.5) { tick(seconds); return { mins }; }
  const wasSleeping = S.sleeping;
  const got = applyOffline(mins);
  away = Math.max(away, got);
  if (rollDay()) emit('day');
  if (wasSleeping !== S.sleeping) emit('sleep', S.sleeping);
  emit('stat', { name: '*' });
  emit('resume', { mins: got });
  save();
  return { mins: got };
}
// Minutos que estuvo sin verla desde la última vez que alguien preguntó (para el «¡Te extrañé!»).
export function takeAway() { const a = away; away = 0; return a; }
export function wasRecovered() { const r = recovered; recovered = false; return r; }

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
  // Antes de borrar, se guarda una copia para poder «Recuperar mi avance anterior».
  try { localStorage.setItem(KEY + '.prev', JSON.stringify(S)); } catch { /* sin espacio */ }
  S = defaults();
  rollDay();
  save();
  emit('reset');
}
// ¿Hay una copia anterior que se pueda recuperar? → { level, name, kid, at } o null
export function prevInfo() {
  try {
    const p = JSON.parse(localStorage.getItem(KEY + '.prev') || 'null');
    if (!p || typeof p !== 'object') return null;
    return { level: Number(p.level) || 1, name: String(p.name || 'Palomita'), kid: String(p.kid || ''), at: Number(p.lastSeen) || 0 };
  } catch { return null; }
}
// Vuelve a la copia anterior (la actual pasa a ser la copia). Después hay que recargar la app.
export function restorePrev() {
  try {
    const prev = localStorage.getItem(KEY + '.prev');
    if (!prev) return false;
    JSON.parse(prev);
    localStorage.setItem(KEY + '.prev', JSON.stringify(S));
    localStorage.setItem(KEY, prev);
    return true;
  } catch { return false; }
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
export function xpForLevel(level) { return 25 + level * 5; }
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
// Género: se quita lo puesto que no es para ese género (queda en «Mis cosas» por si vuelve a cambiar).
// refund: la primera vez que lo elige quien ya usaba la app, se devuelven las semillas de lo comprado del otro género
// y esas cosas salen de sus cosas. Devuelve las semillas devueltas.
export function gender() { return S.gender || null; }
export function setGender(g, { refund = false } = {}) {
  if (g !== 'varon' && g !== 'mujer') return 0;
  S.gender = g;
  let back = 0;
  for (const a of ACCESSORIES) {
    if (!a.gender || a.gender === g) continue;
    if (S.wearing[a.slot] === a.id) S.wearing[a.slot] = null;
    if (refund && S.owned.includes(a.id)) { S.owned = S.owned.filter(x => x !== a.id); back += a.reward ? 0 : a.price; }
  }
  if (back) { S.coins += back; emit('coins', { coins: S.coins, delta: back }); }
  save();
  emit('wear', { gender: g });
  emit('change', { evt: 'gender', gender: g });
  return back;
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
  if (won) dailyOnce('level');     // para «Mi día»
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
  dailyOnce('read:' + id);        // para «Mi día»: leyó algo hoy
  if (String(id).startsWith('lesson:')) dailyOnce('learn');
  if (S.read[id]) return false;
  S.read[id] = Date.now();
  logActivity(1);
  save();
  emit('change', { evt: 'read', id });
  return true;
}
export function quizDone(id) { return !!S.quiz[id]; }
// Cuándo se aprobó (desde la versión 1.3; antes se guardaba sin fecha → null).
export function quizAt(id) { const v = S.quiz[id]; return typeof v === 'number' ? v : null; }
export function markQuiz(id) {
  if (S.quiz[id]) return false;
  dailyOnce('learn');
  S.quiz[id] = Date.now();
  logActivity(2);
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
  dailyOnce('prayed');
  if (firstToday) logActivity(1);
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

// ── Fechas especiales del niño (las de la parroquia están en js/core/reminders.js) ──
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export function date(k) { return S.dates?.[k] || ''; }
export function setDate(k, iso) {
  if (!['cumple', 'bautismo'].includes(k)) return false;
  if (iso && !DATE_RE.test(iso)) return false;
  S.dates = { ...S.dates, [k]: iso || '' };
  save();
  emit('change', { evt: 'dates' });
  return true;
}

// ── Misiones de buenas obras ──
// El niño acepta una misión (de un juego o de una parábola). Al día siguiente la palomita le pregunta si la cumplió.
export function mission() { return S.mission; }
export function acceptMission({ text, from = '' }) {
  if (typeof text !== 'string' || !text.trim()) return false;
  S.mission = { text: text.trim().slice(0, 240), from: String(from).slice(0, 60), at: Date.now(), day: todayKey(), later: '' };
  save();
  emit('change', { evt: 'mission' });
  return true;
}
// ¿Toca preguntar hoy? (se aceptó otro día y hoy no se preguntó todavía)
export function missionDue() {
  const m = S.mission;
  return !!m && m.day !== todayKey() && m.later !== todayKey();
}
export function missionDone() {
  const m = S.mission;
  if (!m) return 0;
  S.deeds = [...S.deeds, { day: todayKey(), text: m.text }].slice(-60);
  S.mission = null;
  logActivity(2);
  save();
  emit('change', { evt: 'deed' });
  return S.deeds.length;
}
export function missionLater() { if (S.mission) { S.mission.later = todayKey(); save(); } }
export function dropMission() { S.mission = null; save(); emit('change', { evt: 'mission' }); }
export function deeds() { return S.deeds.slice(); }

// ── Pasaporte de la Misa del domingo ──
// La Misa de la tarde del sábado (desde las 5 p. m.) ya cuenta para el domingo.
export function massKey(d = new Date()) {
  const day = d.getDay();
  if (day === 0) return todayKey(d);
  if (day === 6 && d.getHours() >= 17) return todayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));
  if (day === 1) return todayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));   // el lunes todavía se puede contar
  return '';
}
export function massLog() { return { ...S.massLog }; }
export function massStamped(key) { return !!(key && S.massLog[key]); }
export function logMass(key, { color = '', liked = '', ok = false } = {}) {
  if (!key) return false;
  const prev = S.massLog[key] || {};
  S.massLog = { ...S.massLog, [key]: { at: prev.at || Date.now(), color: color || prev.color || '', liked: liked || prev.liked || '', ok: !!(ok || prev.ok) } };
  logActivity(2);
  save();
  emit('change', { evt: 'mass', key });
  return true;
}
export function unlogMass(key) { if (S.massLog[key]) { const m = { ...S.massLog }; delete m[key]; S.massLog = m; save(); emit('change', { evt: 'mass', key }); } }

// ── Lo sé de memoria ──
export function memorized(id) { return S.memorized[id] || null; }
export function setMemorized(id, by = 'nino') {
  const m = { ...S.memorized };
  if (!by) delete m[id];
  else if (by === 'nino' && m[id]?.by === 'grande') return m[id];        // el sello verde de un grande no se pierde
  else m[id] = { at: Date.now(), by };
  S.memorized = m;
  if (by) logActivity(2);
  save();
  emit('change', { evt: 'memorized', id });
  return m[id] || null;
}

// ── Mis repasos (cajitas: lo que costó vuelve al día siguiente, luego a los 3 días, a la semana…) ──
const BOX_DAYS = [0, 1, 3, 7, 14];
const addDays = (n, d = new Date()) => todayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
export function reviewMiss(key) {
  if (!key) return;
  S.review = { ...S.review, [key]: { box: 1, due: addDays(1) } };
  saveSoon();
}
export function reviewHit(key) {
  const r = S.review[key];
  if (!r) return;
  const box = Math.min(4, (r.box || 1) + 1);
  const next = { ...S.review };
  if (box >= 4) delete next[key];                 // ya lo sabe: sale de los repasos
  else next[key] = { box, due: addDays(BOX_DAYS[box]) };
  S.review = next;
  saveSoon();
}
export function reviewDue() {
  const t = todayKey();
  return Object.entries(S.review).filter(([, r]) => r && r.due <= t).map(([k]) => k);
}
export function reviewCount() { return Object.keys(S.review).length; }
// La fecha del próximo repaso que todavía no toca ('' si no hay ninguno).
export function reviewNext() {
  const t = todayKey();
  return Object.values(S.review).map(r => r?.due).filter(d => d && d > t).sort()[0] || '';
}
export function reviewBox(key) { return S.review[key]?.box || 0; }
// Quita una pregunta que ya no existe (cambió el texto en una versión nueva).
export function reviewDrop(key) { if (S.review[key]) { const n = { ...S.review }; delete n[key]; S.review = n; saveSoon(); } }

// ── Intenciones (por quién rezo) y diario de gracias ──
export function intentions() { return S.intentions.slice(); }
export function addIntention({ id, label, emoji = '🙏', sick = false }) {
  if (!label) return;
  const list = S.intentions.filter(x => x.id !== id || id === 'otro');
  list.unshift({ id: String(id || 'otro'), label: String(label).slice(0, 60), emoji, sick: !!sick, at: Date.now() });
  S.intentions = list.slice(0, 5);
  save();
}
export function removeIntention(at) { S.intentions = S.intentions.filter(x => x.at !== at); save(); }
export function journal() { return S.journal.slice(); }
export function addJournal({ thanks = [], text = '' } = {}) {
  const day = todayKey();
  const others = S.journal.filter(e => e.day !== day);
  S.journal = [...others, { day, thanks: thanks.slice(0, 6), text: String(text || '').slice(0, 200) }].slice(-60);
  logActivity(1);
  save();
}

// ── Actividad de cada día (solo para el informe de los papás; se guardan los últimos 60 días) ──
export function logActivity(points = 1) {
  const t = todayKey();
  const a = { ...S.activity, [t]: (S.activity[t] || 0) + points };
  const keys = Object.keys(a).sort();
  while (keys.length > 60) delete a[keys.shift()];
  S.activity = a;
  saveSoon();
}
export function activity(days = 14) {
  const out = [];
  for (let i = days - 1; i >= 0; i--) { const k = addDays(-i); out.push({ day: k, points: S.activity[k] || 0 }); }
  return out;
}
