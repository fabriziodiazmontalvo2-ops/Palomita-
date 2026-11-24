// Avisos de la parroquia: Misas y catequesis.
//
// Guarda lo que escriben los papás o el catequista (localStorage 'palomita.parroquia.v1'):
//   { v: 1, masses: null | [{ id, day, time, label }], remind: { idMisa: true },
//     classes: [{ id, date: 'AAAA-MM-DD' | null, weekly: 0–6 | null, time: 'HH:MM', note, task?: [{ type, id }], origin? }],
//     events: [{ id, kind, date, time, title, note, bring: [], origin? }],     kind: comunion | confesion | retiro | ensayo | padres | otro
//     customs: { contrition, communion, posture },                            costumbres de la parroquia (vacío = como viene la app)
//     requirements: [{ id, title, deadline, done, origin? }],                 lo que pide la parroquia (lo anotan los grandes)
//     group: { name, version },                                               grupo de catequesis (si se pegó el código del catequista)
//     feed: { url, on, at, items, app },                                       tablón de avisos por internet (opcional, apagado)
//     avisos: { on: true, lead: 'ambos' | 'hora' | 'dia' } }
// masses = null → se usan los horarios oficiales de js/data/parroquia.js (MASS_TIMES).
// origin: 'grupo' marca lo que llegó con el código del catequista (al pegar uno nuevo se reemplaza; lo de la familia queda).
//
//   upcoming(days)   próximos encuentros (Misas marcadas con 🔔, la catequesis y los eventos), ordenados
//   todayBanner()    { icon, text, when: 'hoy' | 'mañana', kind } para la pantalla principal, o null
//   nextEvent(kind)  { ...evento, start, days } del próximo evento de ese tipo (p. ej. 'comunion'), o null
//   sync()           en la app de Android programa las notificaciones del teléfono (las próximas 4 semanas)
//   requestPermission() → Promise<boolean>   pide permiso para notificaciones (Android 13 o más nuevo)
//   exportCode(nombre) / parseCode(texto) / importCode(datos)   código «PALOMITA:v1:…» para compartir con el grupo
//   feedSettings() / setFeed({ url, on }) / refreshFeed() / feedItems()   tablón de avisos por internet
import { MASS_TIMES, PARISH, DAYS } from '../data/parroquia.js';
import * as state from './state.js';

const KEY = 'palomita.parroquia.v1';
const MASS_MIN = 60;          // lo que dura más o menos una Misa (para el aviso de «hoy»)
const CLASS_MIN = 90;         // lo que dura más o menos la catequesis
const AHEAD_DAYS = 28;        // notificaciones programadas por adelantado
const MAX_ALARMS = 64;

const blank = () => ({ v: 1, masses: null, remind: {}, classes: [], events: [], customs: {}, requirements: [], group: { name: '', version: 0 },
  feed: { url: '', on: false, at: 0, items: [], app: null }, avisos: { on: true, lead: 'ambos' } });
export const EVENT_KINDS = {
  comunion: { icon: '🕊️', title: 'Primera Comunión' },
  confesion: { icon: '🤗', title: 'Primera Confesión' },
  retiro: { icon: '🌿', title: 'Retiro' },
  ensayo: { icon: '⛪', title: 'Ensayo' },
  padres: { icon: '👪', title: 'Reunión de padres' },
  otro: { icon: '📌', title: 'Evento de la parroquia' },
};
const TASK_TYPES = ['cat', 'lesson', 'prayer', 'story'];
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
        data.classes = Array.isArray(d.classes) ? d.classes.filter(validClass).map(c => ({ ...c, task: cleanTask(c.task) })) : [];
        data.events = Array.isArray(d.events) ? d.events.filter(validEvent) : [];
        data.customs = d.customs && typeof d.customs === 'object' ? cleanCustoms(d.customs) : {};
        data.requirements = Array.isArray(d.requirements) ? d.requirements.filter(validReq) : [];
        if (d.group && typeof d.group === 'object') data.group = { name: String(d.group.name || '').slice(0, 60), version: Number(d.group.version) || 0 };
        if (d.feed && typeof d.feed === 'object') data.feed = { url: validUrl(d.feed.url) ? d.feed.url : '', on: !!d.feed.on && validUrl(d.feed.url), at: Number(d.feed.at) || 0,
          items: Array.isArray(d.feed.items) ? d.feed.items.filter(validFeedItem) : [], app: d.feed.app && typeof d.feed.app === 'object' ? d.feed.app : null };
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
function validEvent(e) { return e && EVENT_KINDS[e.kind] && DATE_RE.test(e.date || '') && TIME_RE.test(e.time || '') && typeof e.id === 'string'; }
function validReq(r) { return r && typeof r.id === 'string' && typeof r.title === 'string' && r.title.trim() && (!r.deadline || DATE_RE.test(r.deadline)); }
function cleanTask(t) {
  return Array.isArray(t) ? t.filter(x => x && TASK_TYPES.includes(x.type) && typeof x.id === 'string' && /^[a-z0-9:-]{1,60}$/.test(x.id))
    .map(x => ({ type: x.type, id: x.id, title: String(x.title || '').slice(0, 60) })).slice(0, 6) : [];
}
// ¿Ya hizo esta tarea? (tema de Mi camino, lección, oración o historia de la Biblia)
export function taskDone(t) {
  if (!t) return false;
  if (t.type === 'cat') return state.quizDone(`cat:${t.id}`);
  if (t.type === 'lesson') return state.isRead(`lesson:${t.id}`);
  if (t.type === 'prayer') return (state.get().prayers?.[t.id] || 0) > 0 || !!state.memorized(t.id);
  if (t.type === 'story') return state.isRead(t.id);
  return false;
}
const CUSTOM_VALUES = { contrition: /^[a-z0-9-]{1,40}$/, communion: /^(boca|mano|ambas)$/, posture: /^(rodillas|pie)$/ };
function cleanCustoms(c) { const out = {}; for (const [k, re] of Object.entries(CUSTOM_VALUES)) if (typeof c[k] === 'string' && re.test(c[k])) out[k] = c[k]; return out; }
function validUrl(u) { return typeof u === 'string' && /^https:\/\/[a-z0-9.-]+(?::\d+)?\/[^\s<>"']*$/i.test(u) && u.length < 300; }
function validFeedItem(x) { return x && typeof x.title === 'string' && x.title.trim() && (!x.until || DATE_RE.test(x.until)); }
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
export function addClass({ date = null, weekly = null, time, note = '', task = [] }) {
  const c = { id: newId('c'), date: date || null, weekly: weekly === null || weekly === '' ? null : Number(weekly), time: String(time), note: String(note).slice(0, 80), task: cleanTask(task) };
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
  next.task = cleanTask(next.task);
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

// ── Eventos especiales (Primera Comunión, Primera Confesión, retiro, ensayo, reunión de padres…) ──
export function events() { return load().events.slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)); }
function makeEvent(v, id) {
  const kind = EVENT_KINDS[v.kind] ? v.kind : 'otro';
  return { id: id || newId('e'), kind, date: String(v.date || ''), time: String(v.time || '10:00'),
    title: String(v.title || '').trim().slice(0, 60), note: String(v.note || '').trim().slice(0, 120),
    bring: (Array.isArray(v.bring) ? v.bring : String(v.bring || '').split(/[,\n]/)).map(x => String(x).trim().slice(0, 40)).filter(Boolean).slice(0, 8),
    ...(v.origin ? { origin: v.origin } : {}) };
}
export function addEvent(v) {
  const e = makeEvent(v);
  if (!validEvent(e)) return null;
  // Solo una Primera Comunión y una Primera Confesión: si ya había, se reemplaza.
  if (kindUnique(e.kind)) load().events = load().events.filter(x => x.kind !== e.kind);
  load().events.push(e);
  save();
  return e;
}
const kindUnique = k => k === 'comunion' || k === 'confesion';
export function updateEvent(id, patch) {
  const list = load().events;
  const i = list.findIndex(x => x.id === id);
  if (i < 0) return false;
  const e = makeEvent({ ...list[i], ...patch }, id);
  if (!validEvent(e)) return false;
  list[i] = e;
  save();
  return true;
}
export function removeEvent(id) {
  const list = load().events;
  const i = list.findIndex(x => x.id === id);
  if (i < 0) return false;
  list.splice(i, 1);
  save();
  return true;
}
// Próximo evento de un tipo (aunque falte mucho): { ...evento, start, days } o null. Incluye el de hoy.
export function nextEvent(kind, now = new Date()) {
  const today = startOfDay(now);
  const list = load().events.filter(e => e.kind === kind).map(e => ({ ...e, start: at(parseDate(e.date), e.time) }))
    .filter(e => startOfDay(e.start) >= today).sort((a, b) => a.start - b.start);
  if (!list.length) return null;
  const e = list[0];
  return { ...e, days: Math.round((startOfDay(e.start) - today) / 86400000), icon: EVENT_KINDS[e.kind].icon, label: e.title || EVENT_KINDS[e.kind].title };
}

// ── Costumbres de la parroquia (Acto de contrición, forma de comulgar, postura después del Cordero de Dios) ──
export function customs() { return { ...load().customs }; }
export function setCustoms(patch) { load().customs = cleanCustoms({ ...load().customs, ...patch }); save(); }

// ── Lo que pide la parroquia (requisitos y trámites) ──
export function requirements() { return load().requirements.slice(); }
export function addRequirement({ title, deadline = '' }) {
  const r = { id: newId('r'), title: String(title || '').trim().slice(0, 80), deadline: DATE_RE.test(deadline || '') ? deadline : '', done: false };
  if (!validReq(r)) return null;
  load().requirements.push(r);
  save();
  return r;
}
export function toggleRequirement(id, done) { const r = load().requirements.find(x => x.id === id); if (r) { r.done = done ?? !r.done; save(); } }
export function removeRequirement(id) { load().requirements = load().requirements.filter(x => x.id !== id); save(); }

// ── Grupo de catequesis (llega con el código del catequista) ──
export function group() { return { ...load().group }; }

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
      out.push({ id: `${c.id}@${isoDate(day)}`, ref: c.id, kind: 'catequesis', icon: '📖', start, title: 'Catequesis', note: c.note || '', remind: true, task: c.task || [] });
    }
    for (const e of load().events) {
      if (e.date !== isoDate(day)) continue;
      const start = at(day, e.time);
      if (start.getTime() + 120 * 60000 < from.getTime()) continue;
      const k = EVENT_KINDS[e.kind];
      out.push({ id: `${e.id}@${e.date}`, ref: e.id, kind: 'evento', sub: e.kind, icon: k.icon, start, title: e.title || k.title, note: e.note || '', bring: e.bring || [], remind: true });
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
      : e.kind === 'evento'
        ? (started ? `¡Ya es la hora: ${e.title}!` : `${when === 'hoy' ? 'Hoy' : 'Mañana'}: ${e.title} a las ${hour}`)
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
          : e.kind === 'evento'
            ? { id: `${e.id}#h`, atMillis: t, expiresMillis, title: `${e.icon} Hoy: ${e.title} a las ${hour}`, text: e.sub === 'comunion' ? '¡Hoy recibes a Jesús por primera vez! Que la palomita te acompañe con su alegría.' : dot(`Hoy a las ${hour}${extra}`) }
            : { id: `${e.id}#h`, atMillis: t, expiresMillis, title: `📖 Hoy tienes catequesis a las ${hour}`, text: dot(`Hoy a las ${hour}${extra}`) + ' ¡Lleva tu cuaderno y muchas ganas de aprender!' });
      }
    }
    // Eventos especiales: también una semana antes (a las 6 p. m.).
    if (e.kind === 'evento') {
      const week = new Date(e.start.getFullYear(), e.start.getMonth(), e.start.getDate() - 7, 18, 0, 0, 0).getTime();
      if (week > now.getTime()) {
        out.push({ id: `${e.id}#s`, atMillis: week, expiresMillis: new Date(e.start.getFullYear(), e.start.getMonth(), e.start.getDate() - 5).getTime(),
          title: `${e.icon} Falta una semana: ${e.title}`, text: dot(`${DAYS[e.start.getDay()]} ${e.start.getDate()} a las ${hour}${extra}`) + (e.bring?.length ? ` Lleva: ${e.bring.join(', ')}.` : '') });
      }
    }
    if (lead === 'ambos' || lead === 'dia' || e.kind === 'evento') {
      const eve = new Date(e.start.getFullYear(), e.start.getMonth(), e.start.getDate() - 1, 18, 0, 0, 0).getTime();
      if (eve > now.getTime()) {
        const dname = DAYS[e.start.getDay()].toLowerCase();
        const expiresMillis = new Date(e.start.getFullYear(), e.start.getMonth(), e.start.getDate()).getTime();   // ya es el mismo día: no sirve
        const pending = (e.task || []).filter(t => !taskDone(t)).map(t => t.title).filter(Boolean);
        out.push(e.kind === 'misa'
          ? { id: `${e.id}#d`, atMillis: eve, expiresMillis, title: '⛪ Mañana hay Misa', text: `Mañana ${dname} a las ${hour} en la ${place}. ¡Prepárate con alegría!` }
          : e.kind === 'evento'
            ? { id: `${e.id}#d`, atMillis: eve, expiresMillis, title: `${e.icon} Mañana: ${e.title}`, text: dot(`Mañana ${dname} a las ${hour}${extra}`) + (e.bring?.length ? ` Lleva: ${e.bring.join(', ')}.` : '') }
            : { id: `${e.id}#d`, atMillis: eve, expiresMillis, title: '📖 Mañana tienes catequesis', text: dot(`Mañana ${dname} a las ${hour}${extra}`) + (pending.length ? ` Te falta: ${pending.join(', ')}.` : '') });
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

// ── Código del grupo: el catequista anota una vez los horarios y fechas, y los comparte por WhatsApp ──
// El mensaje lleva un resumen para leer y, al final, una línea «PALOMITA:v1:…» (los datos en base64url).
// Los papás copian TODO el mensaje y lo pegan en Mi parroquia → «Pegar el código del catequista».
const CODE_RE = /PALOMITA:v1:([A-Za-z0-9_-]{8,})/;
function b64urlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s) {
  let b = s.replace(/-/g, '+').replace(/_/g, '/');
  while (b.length % 4) b += '=';
  const bin = atob(b);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
const fmtIso = iso => { const d = parseDate(iso); return d ? fmtDate(d) : iso; };

export function exportCode(groupName = '') {
  const d = load();
  const name = String(groupName || d.group.name || '').trim().slice(0, 60);
  const payload = {
    g: name, v: (d.group.version || 0) + 1, at: Date.now(),
    m: Array.isArray(d.masses) ? d.masses.map(x => [x.day, x.time, x.label || '']) : null,
    c: d.classes.map(x => [x.date, x.weekly, x.time, x.note || '', (x.task || []).map(t => [t.type, t.id, t.title || ''])]),
    e: d.events.map(x => [x.kind, x.date, x.time, x.title || '', x.note || '', x.bring || []]),
    r: d.requirements.map(x => [x.title, x.deadline || '']),
    k: { ...d.customs },
    f: d.feed.url || '',
  };
  d.group = { name, version: payload.v };
  save();
  const code = `PALOMITA:v1:${b64urlEncode(JSON.stringify(payload))}`;
  const lines = [`📅 Horarios y fechas de catequesis${name ? ` · ${name}` : ''}`, PARISH.name, ''];
  const ms = masses();
  if (Array.isArray(d.masses) && ms.length) lines.push(`⛪ Misas: ${ms.map(m => `${DAYS[m.day].toLowerCase()} ${fmtTime(m.time)}`).join(', ')}`);
  for (const c of classes()) lines.push(`📖 Catequesis: ${c.date ? fmtIso(c.date) : `cada ${DAYS[c.weekly].toLowerCase()}`} a las ${fmtTime(c.time)}${c.note ? ` (${c.note})` : ''}${c.task?.length ? ` · Tarea: ${c.task.map(t => t.title).filter(Boolean).join(', ')}` : ''}`);
  for (const e of events()) lines.push(`${EVENT_KINDS[e.kind].icon} ${e.title || EVENT_KINDS[e.kind].title}: ${fmtIso(e.date)} a las ${fmtTime(e.time)}${e.bring?.length ? ` · Llevar: ${e.bring.join(', ')}` : ''}`);
  for (const r of d.requirements) lines.push(`📋 ${r.title}${r.deadline ? ` (hasta el ${fmtIso(r.deadline)})` : ''}`);
  lines.push('', 'Para tenerlos en Palomita con avisos: copien TODO este mensaje y en la app vayan a Mi parroquia → «Pegar el código del catequista».', code);
  return { code, text: lines.join('\n') };
}

// Revisa un texto pegado (puede ser el mensaje entero). → { ok, error, data, summary }
export function parseCode(text) {
  const m = CODE_RE.exec(String(text || ''));
  if (!m) return { ok: false, error: 'No encontramos el código. Copien el mensaje completo del catequista, con la línea que empieza con «PALOMITA:».' };
  let p;
  try { p = JSON.parse(b64urlDecode(m[1])); } catch { return { ok: false, error: 'El código está incompleto o dañado. Pídanle al catequista que lo envíe otra vez.' }; }
  if (!p || typeof p !== 'object') return { ok: false, error: 'El código está dañado.' };
  const massesIn = Array.isArray(p.m) ? p.m.map(([day, time, label]) => ({ day: Number(day), time: String(time || ''), label: String(label || '').slice(0, 40) })).filter(validMass) : null;
  const classesIn = Array.isArray(p.c) ? p.c.map(([date, weekly, time, note, task]) => ({ date: date || null, weekly: weekly === null || weekly === undefined ? null : Number(weekly), time: String(time || ''), note: String(note || '').slice(0, 80),
    task: cleanTask((Array.isArray(task) ? task : []).map(([type, id, title]) => ({ type, id, title }))) })).filter(validClass) : [];
  const eventsIn = Array.isArray(p.e) ? p.e.map(([kind, date, time, title, note, bring]) => makeEvent({ kind, date, time, title, note, bring, origin: 'grupo' })).filter(validEvent) : [];
  const reqIn = Array.isArray(p.r) ? p.r.map(([title, deadline]) => ({ id: newId('r'), title: String(title || '').trim().slice(0, 80), deadline: DATE_RE.test(deadline || '') ? deadline : '', done: false, origin: 'grupo' })).filter(validReq) : [];
  const data = { group: { name: String(p.g || '').slice(0, 60), version: Number(p.v) || 1 }, masses: massesIn, classes: classesIn, events: eventsIn,
    requirements: reqIn, customs: cleanCustoms(p.k || {}), feed: validUrl(p.f) ? p.f : '' };
  return { ok: true, data, summary: { group: data.group.name, masses: massesIn ? massesIn.length : 0, classes: classesIn.length, events: eventsIn.map(e => `${EVENT_KINDS[e.kind].icon} ${e.title || EVENT_KINDS[e.kind].title}: ${fmtIso(e.date)}`), requirements: reqIn.length } };
}

// Aplica un código revisado: lo del grupo anterior se reemplaza; lo que anotó la familia se queda.
export function importCode(p) {
  const d = load();
  if (Array.isArray(p.masses) && p.masses.length) {
    const keep = new Set(masses().filter(m => m.remind).map(m => `${m.day}-${m.time}`));
    d.masses = p.masses.map(m => ({ id: `g-${m.day}-${m.time.replace(':', '')}`, day: m.day, time: m.time, label: m.label || '' }));
    d.remind = {};
    for (const m of d.masses) if (keep.has(`${m.day}-${m.time}`)) d.remind[m.id] = true;
  }
  d.classes = [...d.classes.filter(c => c.origin !== 'grupo'), ...p.classes.map(c => ({ ...c, id: newId('c'), origin: 'grupo' }))];
  const uniqueKinds = new Set(p.events.filter(e => kindUnique(e.kind)).map(e => e.kind));
  d.events = [...d.events.filter(e => e.origin !== 'grupo' && !uniqueKinds.has(e.kind)), ...p.events];
  const doneTitles = new Set(d.requirements.filter(r => r.done).map(r => r.title));
  d.requirements = [...d.requirements.filter(r => r.origin !== 'grupo'), ...p.requirements.map(r => ({ ...r, done: doneTitles.has(r.title) }))];
  d.customs = { ...d.customs, ...p.customs };
  if (p.feed) d.feed = { ...d.feed, url: p.feed };
  d.group = { ...p.group };
  save();
  return true;
}

// ── Tablón de avisos de la parroquia por internet (opcional: lo enciende un grande) ──
// Un archivo JSON publicado por la parroquia (por ejemplo en GitHub Pages):
//   { "avisos": [{ "id": "colecta", "title": "Colecta del domingo", "text": "…", "until": "AAAA-MM-DD" }],
//     "app": { "version": "1.3.0", "note": "Pidan la versión nueva a su catequista" } }
// Se pide como mucho una vez al día, al abrir la app, sin datos del niño ni del teléfono (solo la dirección IP llega al servidor).
const feedBridge = () => (typeof window !== 'undefined' && window.PalomitaAndroid && typeof window.PalomitaAndroid.setFeedHost === 'function' ? window.PalomitaAndroid : null);
export function feedSettings() { const f = load().feed; return { url: f.url, on: f.on, at: f.at }; }
export function setFeed({ url, on } = {}) {
  const f = load().feed;
  if (url !== undefined) f.url = validUrl(String(url).trim()) ? String(url).trim() : '';
  if (on !== undefined) f.on = !!on && !!f.url;
  if (!f.on) { f.items = []; f.app = null; f.at = 0; }
  try { feedBridge()?.setFeedHost(f.on ? new URL(f.url).hostname : ''); } catch { /* nada */ }
  save();
  return { ...f };
}
export async function refreshFeed({ force = false } = {}) {
  const f = load().feed;
  if (!f.on || !validUrl(f.url)) return false;
  if (!force && Date.now() - f.at < 20 * 3600 * 1000) return false;
  try { feedBridge()?.setFeedHost(new URL(f.url).hostname); } catch { /* nada */ }
  try {
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const t = ctrl ? setTimeout(() => ctrl.abort(), 12000) : 0;
    const r = await fetch(f.url, { cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', signal: ctrl?.signal });
    clearTimeout(t);
    if (!r.ok) return false;
    const j = await r.json();
    const items = (Array.isArray(j?.avisos) ? j.avisos : []).slice(0, 10).map(x => ({ id: String(x?.id || '').slice(0, 40), title: String(x?.title || '').slice(0, 80), text: String(x?.text || '').slice(0, 300), until: DATE_RE.test(x?.until || '') ? x.until : '' })).filter(validFeedItem);
    const app = j?.app && typeof j.app === 'object' && /^\d+\.\d+(\.\d+)?$/.test(String(j.app.version || '')) ? { version: String(j.app.version), note: String(j.app.note || '').slice(0, 160) } : null;
    Object.assign(f, { items, app, at: Date.now() });
    save();
    return true;
  } catch { return false; }
}
export function feedItems(now = new Date()) {
  const f = load().feed;
  if (!f.on) return [];
  const today = isoDate(now);
  return f.items.filter(x => !x.until || x.until >= today);
}
export function feedApp() { const f = load().feed; return f.on ? f.app : null; }
