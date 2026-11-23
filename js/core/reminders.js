// Avisos de la parroquia: Misas y catequesis.
//
// Guarda lo que escriben los papás o el catequista (localStorage 'palomita.parroquia.v1'):
//   { v: 1, masses: null | [{ id, day, time, label }], remind: { idMisa: true },
//     classes: [{ id, date: 'AAAA-MM-DD' | null, weekly: 0–6 | null, time: 'HH:MM', note }],
//     avisos: { on: true, lead: 'ambos' | 'hora' | 'dia' } }
// masses = null → se usan los horarios oficiales de js/data/parroquia.js (MASS_TIMES).
//
//   upcoming(days)   próximos encuentros (Misas marcadas con 🔔 y toda la catequesis), ordenados
//   todayBanner()    { icon, text, when: 'hoy' | 'mañana', kind } para la pantalla principal, o null
//   sync()           en la app de Android programa las notificaciones del teléfono (las próximas 4 semanas)
//   requestPermission() → Promise<boolean>   pide permiso para notificaciones (Android 13 o más nuevo)
import { MASS_TIMES, PARISH, DAYS } from '../data/parroquia.js';

const KEY = 'palomita.parroquia.v1';
const MASS_MIN = 60;          // lo que dura más o menos una Misa (para el aviso de «hoy»)
const CLASS_MIN = 90;         // lo que dura más o menos la catequesis
const AHEAD_DAYS = 28;        // notificaciones programadas por adelantado
const MAX_ALARMS = 64;

const blank = () => ({ v: 1, masses: null, remind: {}, classes: [], avisos: { on: true, lead: 'ambos' } });
let data = null;
const listeners = new Set();

function load() {
  if (data) return data;
  data = blank();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && typeof d === 'object') {
        data.masses = Array.isArray(d.masses) ? d.masses.filter(validMass) : null;
        data.remind = d.remind && typeof d.remind === 'object' ? d.remind : {};
        data.classes = Array.isArray(d.classes) ? d.classes.filter(validClass) : [];
        if (d.avisos && typeof d.avisos === 'object') data.avisos = { on: d.avisos.on !== false, lead: ['ambos', 'hora', 'dia'].includes(d.avisos.lead) ? d.avisos.lead : 'ambos' };
      }
    }
  } catch { /* sin guardado: se empieza en blanco */ }
  return data;
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* sin espacio o bloqueado: queda en memoria */ }
  for (const fn of listeners) { try { fn(); } catch (e) { console.error(e); } }
  sync();
}
export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function validMass(m) { return m && Number.isInteger(m.day) && m.day >= 0 && m.day <= 6 && TIME_RE.test(m.time || ''); }
function validClass(c) { return c && TIME_RE.test(c.time || '') && (DATE_RE.test(c.date || '') || (Number.isInteger(c.weekly) && c.weekly >= 0 && c.weekly <= 6)); }
const newId = p => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const byTime = (a, b) => a.day - b.day || a.time.localeCompare(b.time);

// ── Horarios de Misa ──
export function massesEdited() { return Array.isArray(load().masses); }
export function masses() {
  const d = load();
  const list = d.masses ?? MASS_TIMES.filter(validMass).map(m => ({ id: `of-${m.day}-${m.time}`, day: m.day, time: m.time, label: m.label || '' }));
  return list.map(m => ({ ...m, remind: !!d.remind[m.id] })).sort(byTime);
}
function editableMasses() {
  const d = load();
  if (!Array.isArray(d.masses)) d.masses = masses().map(({ remind, ...m }) => m);
  return d.masses;
}
export function addMass({ day, time, label = '' }) {
  const m = { id: newId('m'), day: Number(day), time: String(time), label: String(label).slice(0, 40) };
  if (!validMass(m)) return null;
  editableMasses().push(m);
  save();
  return m;
}
export function updateMass(id, patch) {
  const list = editableMasses();
  const m = list.find(x => x.id === id);
  if (!m) return false;
  const next = { ...m, ...patch, day: Number(patch.day ?? m.day), label: String(patch.label ?? m.label).slice(0, 40) };
  if (!validMass(next)) return false;
  Object.assign(m, next);
  save();
  return true;
}
export function removeMass(id) {
  const list = editableMasses();
  const i = list.findIndex(x => x.id === id);
  if (i < 0) return false;
  list.splice(i, 1);
  delete load().remind[id];
  save();
  return true;
}
export function setRemind(id, on) { const d = load(); if (on) d.remind[id] = true; else delete d.remind[id]; save(); }

// ── Catequesis ──
export function classes() {
  return load().classes.slice().sort((a, b) => {
    const ka = a.date ? `0${a.date}` : `1${a.weekly}`;
    const kb = b.date ? `0${b.date}` : `1${b.weekly}`;
    return ka.localeCompare(kb) || a.time.localeCompare(b.time);
  });
}
export function addClass({ date = null, weekly = null, time, note = '' }) {
  const c = { id: newId('c'), date: date || null, weekly: weekly === null || weekly === '' ? null : Number(weekly), time: String(time), note: String(note).slice(0, 80) };
  if (c.date) c.weekly = null;
  if (!validClass(c)) return null;
  load().classes.push(c);
  save();
  return c;
}
export function updateClass(id, patch) {
  const c = load().classes.find(x => x.id === id);
  if (!c) return false;
  const next = { ...c, ...patch };
  next.weekly = next.date ? null : (next.weekly === null || next.weekly === '' ? null : Number(next.weekly));
  next.date = next.date || null;
  next.note = String(next.note || '').slice(0, 80);
  if (!validClass(next)) return false;
  Object.assign(c, next);
  save();
  return true;
}
export function removeClass(id) {
  const list = load().classes;
  const i = list.findIndex(x => x.id === id);
  if (i < 0) return false;
  list.splice(i, 1);
  save();
  return true;
}

// ── Avisos ──
export function avisos() { return { ...load().avisos }; }
export function setAvisos(patch) { Object.assign(load().avisos, patch); save(); }

// ── Formatos (hora del Perú: «7:00 p. m.») ──
export function fmtTime(t) {
  const m = TIME_RE.exec(t || '');
  if (!m) return t || '';
  const hh = Number(m[1]);
  return `${hh % 12 || 12}:${m[2]} ${hh < 12 ? 'a. m.' : 'p. m.'}`;
}
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export function fmtDate(d, { weekday = true } = {}) {
  return `${weekday ? `${DAYS[d.getDay()].toLowerCase()} ` : ''}${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}
export function parseDate(s) {
  if (!DATE_RE.test(s || '')) return null;
  const [y, mo, da] = s.split('-').map(Number);
  return new Date(y, mo - 1, da);
}
export function isoDate(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function at(day, time) {
  const [hh, mm] = time.split(':').map(Number);
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hh, mm, 0, 0);
  return d;
}
const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Todos los encuentros entre «from» y «from + days» (incluye los de hoy que todavía no terminan).
// all: true → también las Misas sin 🔔 (para mostrar la agenda completa).
export function upcoming(days = 14, { from = new Date(), all = false } = {}) {
  const out = [];
  const day0 = startOfDay(from);
  const ms = masses().filter(m => all || m.remind);
  const cs = classes();
  for (let k = 0; k <= days; k++) {
    const day = new Date(day0.getFullYear(), day0.getMonth(), day0.getDate() + k);
    for (const m of ms) {
      if (m.day !== day.getDay()) continue;
      const start = at(day, m.time);
      if (start.getTime() + MASS_MIN * 60000 < from.getTime()) continue;
      out.push({ id: `${m.id}@${isoDate(day)}`, ref: m.id, kind: 'misa', icon: '⛪', start, title: m.label || 'Santa Misa', note: '', remind: m.remind });
    }
    for (const c of cs) {
      const hit = c.date ? c.date === isoDate(day) : c.weekly === day.getDay();
      if (!hit) continue;
      const start = at(day, c.time);
      if (start.getTime() + CLASS_MIN * 60000 < from.getTime()) continue;
      out.push({ id: `${c.id}@${isoDate(day)}`, ref: c.id, kind: 'catequesis', icon: '📖', start, title: 'Catequesis', note: c.note || '', remind: true });
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

// Aviso para la pantalla principal: algo de hoy (que no haya terminado) o de mañana.
export function todayBanner(now = new Date()) {
  const list = upcoming(1, { from: now });
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  let e = list.find(x => sameDay(x.start, now)) || list.find(x => sameDay(x.start, tomorrow));
  if (e) {
    const when = sameDay(e.start, now) ? 'hoy' : 'mañana';
    const hour = fmtTime(`${String(e.start.getHours()).padStart(2, '0')}:${String(e.start.getMinutes()).padStart(2, '0')}`);
    const started = e.start <= now;
    const text = e.kind === 'misa'
      ? (started ? '¡La Misa ya empezó! Jesús te espera.' : `${when === 'hoy' ? 'Hoy' : 'Mañana'} hay Misa a las ${hour}`)
      : (started ? '¡Es hora de catequesis!' : `${when === 'hoy' ? 'Hoy' : 'Mañana'} tienes catequesis a las ${hour}`);
    return { icon: e.icon, text, when, kind: e.kind, at: e.start, note: e.note };
  }
  // Sin Misa marcada: si mañana (o hoy) es domingo y hay Misas ese día, un recordatorio amable.
  const sunday = now.getDay() === 0 ? now : now.getDay() === 6 ? tomorrow : null;
  if (sunday) {
    const all = upcoming(1, { from: now, all: true }).filter(x => x.kind === 'misa' && sameDay(x.start, sunday));
    if (all.length) {
      const first = all[0];
      const hour = fmtTime(`${String(first.start.getHours()).padStart(2, '0')}:${String(first.start.getMinutes()).padStart(2, '0')}`);
      return { icon: '⛪', text: sunday === now ? `Hoy es domingo: ¡día de ir a Misa! (${hour})` : `Mañana es domingo: ¡día de ir a Misa! (${hour})`, when: sunday === now ? 'hoy' : 'mañana', kind: 'misa', at: first.start, note: '' };
    }
  }
  return null;
}

const dot = s => (/[.!?…]$/.test(s) ? s : `${s}.`);
// Lista de notificaciones para el teléfono.
export function notifications(now = new Date()) {
  const { on, lead } = avisos();
  if (!on) return [];
  const out = [];
  const place = PARISH.name;
  for (const e of upcoming(AHEAD_DAYS, { from: now })) {
    const hour = fmtTime(`${String(e.start.getHours()).padStart(2, '0')}:${String(e.start.getMinutes()).padStart(2, '0')}`);
    const extra = e.note ? ` · ${e.note}` : '';
    // El teléfono puede entregar un aviso un poco tarde: el título dice la hora (no «en una hora»)
    // y cada aviso tiene vencimiento (expiresMillis): si llega cuando ya no sirve, no se muestra.
    if (lead === 'ambos' || lead === 'hora') {
      const t = e.start.getTime() - 60 * 60000;
      if (t > now.getTime()) {
        const expiresMillis = e.start.getTime();
        out.push(e.kind === 'misa'
          ? { id: `${e.id}#h`, atMillis: t, expiresMillis, title: `⛪ Hoy hay Misa a las ${hour}`, text: `En la ${place}. ¡Jesús te espera!` }
          : { id: `${e.id}#h`, atMillis: t, expiresMillis, title: `📖 Hoy tienes catequesis a las ${hour}`, text: dot(`Hoy a las ${hour}${extra}`) + ' ¡Lleva tu cuaderno y muchas ganas de aprender!' });
      }
    }
    if (lead === 'ambos' || lead === 'dia') {
      const eve = new Date(e.start.getFullYear(), e.start.getMonth(), e.start.getDate() - 1, 18, 0, 0, 0).getTime();
      if (eve > now.getTime()) {
        const dname = DAYS[e.start.getDay()].toLowerCase();
        const expiresMillis = new Date(e.start.getFullYear(), e.start.getMonth(), e.start.getDate()).getTime();   // ya es el mismo día: no sirve
        out.push(e.kind === 'misa'
          ? { id: `${e.id}#d`, atMillis: eve, expiresMillis, title: '⛪ Mañana hay Misa', text: `Mañana ${dname} a las ${hour} en la ${place}. ¡Prepárate con alegría!` }
          : { id: `${e.id}#d`, atMillis: eve, expiresMillis, title: '📖 Mañana tienes catequesis', text: dot(`Mañana ${dname} a las ${hour}${extra}`) });
      }
    }
  }
  const list = out.sort((a, b) => a.atMillis - b.atMillis).slice(0, MAX_ALARMS - 1);
  // Los avisos se programan solo para las próximas 4 semanas (y cada vez que se abre Palomita se renuevan).
  // Si en todo ese tiempo nadie abre la app, un último aviso pide abrirla para seguir avisando.
  const renewAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + AHEAD_DAYS - 3, 17, 0, 0, 0).getTime();
  const more = upcoming(AHEAD_DAYS * 4, { from: now }).some(e => e.start.getTime() > renewAt);
  if (more && renewAt > now.getTime()) {
    list.push({ id: 'renovar-avisos', atMillis: Math.min(renewAt, list.length >= MAX_ALARMS - 1 ? list[list.length - 1].atMillis + 60000 : renewAt),
      title: '🕊️ Abre Palomita un momento', text: 'Así te sigo avisando de la Misa y la catequesis de las próximas semanas.' });
  }
  return list;
}

// ── Puente con Android ──
const bridge = () => (typeof window !== 'undefined' && window.PalomitaAndroid && typeof window.PalomitaAndroid.scheduleReminders === 'function' ? window.PalomitaAndroid : null);
export function nativeAvailable() { return !!bridge(); }

export function sync() {
  const b = bridge();
  if (!b) return false;
  try { b.scheduleReminders(JSON.stringify(notifications())); return true; } catch (e) { console.warn(e); return false; }
}

// 'granted' | 'denied' | 'default' | 'unsupported'
export function permissionState() {
  const b = bridge();
  if (b) { try { return b.notificationsAllowed() ? 'granted' : 'default'; } catch { return 'unsupported'; } }
  return 'unsupported';
}

let pendingAsk = null;
if (typeof window !== 'undefined') {
  window.__palomitaNotif = granted => {
    const r = pendingAsk; pendingAsk = null;
    r?.(!!granted);
    if (granted) sync();
    if (!r) for (const fn of listeners) { try { fn(); } catch (e) { console.warn(e); } }   // respuesta tardía: que se repinte
  };
  // Cada vez que Palomita vuelve a primer plano, se renuevan las próximas 4 semanas de avisos.
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (!document.hidden) { try { sync(); } catch { /* nada */ } } });
}
export function requestPermission() {
  const b = bridge();
  if (!b) return Promise.resolve(false);
  try { if (b.notificationsAllowed()) return Promise.resolve(true); } catch { /* sigue */ }
  return new Promise(resolve => {
    pendingAsk = resolve;
    try { b.askNotifications(); } catch { pendingAsk = null; resolve(false); return; }
    // El teléfono siempre contesta (aunque se cierre el cuadro); esto es solo por si algo se pierde.
    setTimeout(() => { if (pendingAsk === resolve) { pendingAsk = null; resolve(permissionState() === 'granted'); } }, 120000);
  });
}

// Abrir el marcador o el mapa: en Android lo hace el teléfono (la app no abre enlaces por sí sola).
export function dial() {
  const b = typeof window !== 'undefined' ? window.PalomitaAndroid : null;
  if (b && typeof b.openDial === 'function') { try { b.openDial(PARISH.phoneDial); return true; } catch { /* sigue */ } }
  return false;
}
export function openMap() {
  const b = typeof window !== 'undefined' ? window.PalomitaAndroid : null;
  if (b && typeof b.openMap === 'function') { try { b.openMap(PARISH.mapsQuery); return true; } catch { /* sigue */ } }
  return false;
}
export const mapsUrl = () => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(PARISH.mapsQuery)}`;
