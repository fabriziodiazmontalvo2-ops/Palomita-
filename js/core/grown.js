// «Solo para grandes»: una clave de 4 números que saben los papás o el catequista.
// Protege lo que un niño no debería cambiar solo: anotar fechas y horarios, empezar de nuevo, encender el
// micrófono por primera vez, ver o enviar el informe, las copias de seguridad y los perfiles.
// La clave es de todo el teléfono (no de cada niño) y se guarda solo aquí, en 'palomita.grandes.v1'.
// No es una medida de seguridad fuerte: es un candado para niños.
//
//   hasPin() / setPin('1234') / clearPin()
//   grownGate({ reason }) → Promise<boolean>   pide la clave (la primera vez ofrece crearla); queda abierta 10 minutos
//   unlocked() / lock()                         ¿está abierto ahora? / cerrar ya (al salir de «Para grandes»)
//   choosePin() → Promise<boolean>              crear o cambiar la clave (pide la actual si hay una)
import { h, modal, toast } from './ui.js';
import { sfx } from './audio.js';

const KEY = 'palomita.grandes.v1';
const OPEN_MS = 10 * 60 * 1000;
let openUntil = 0;
let fails = 0, waitUntil = 0;

function read() { try { return JSON.parse(localStorage.getItem(KEY) || 'null') || {}; } catch { return {}; } }
function write(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch { return false; } }
function hash(pin, salt) {
  let x = 0x811c9dc5;
  const s = `${salt}:${pin}`;
  for (let r = 0; r < 500; r++) for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i) + r; x = Math.imul(x, 0x01000193) >>> 0; }
  return x.toString(36);
}

export function hasPin() { return !!read().pin; }
export function setPin(pin) {
  if (!/^\d{4}$/.test(pin)) return false;
  const salt = Math.random().toString(36).slice(2, 10);
  return write({ pin: hash(pin, salt), salt, at: Date.now() });
}
export function clearPin() { write({}); }
function check(pin) { const d = read(); return !!d.pin && hash(pin, d.salt) === d.pin; }

export function unlocked() { return Date.now() < openUntil; }
export function lock() { openUntil = 0; }
function open() { openUntil = Date.now() + OPEN_MS; }
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (document.hidden) lock(); });

// ── Teclado de 4 números ──
function keypad({ onDone }) {
  let val = '';
  const dots = h('div', { class: 'gk-dots', 'aria-hidden': 'true' }, [0, 1, 2, 3].map(() => h('i')));
  const live = h('p', { class: 'gk-sr', role: 'status', 'aria-live': 'polite' });
  const paint = () => { [...dots.children].forEach((d, i) => d.classList.toggle('is-on', i < val.length)); live.textContent = `${val.length} de 4`; };
  const press = k => {
    if (k === 'del') { val = val.slice(0, -1); paint(); sfx('tap'); return; }
    if (val.length >= 4) return;
    val += k; paint(); sfx('tick');
    if (val.length === 4) { const v = val; setTimeout(() => { onDone(v); }, 120); }
  };
  const keys = h('div', { class: 'gk-keys' },
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map(k => k === ''
      ? h('span')
      : h('button', { type: 'button', class: `gk-key${k === 'del' ? ' gk-key--del' : ''}`, 'aria-label': k === 'del' ? 'Borrar' : k, onclick: () => press(k) }, k === 'del' ? '⌫' : k)));
  const el = h('div', { class: 'gk' }, dots, live, keys);
  const onKey = e => { if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('del'); };
  window.addEventListener('keydown', onKey);
  paint();
  return { el, reset() { val = ''; paint(); }, shake() { el.classList.remove('is-wrong'); void el.offsetWidth; el.classList.add('is-wrong'); }, off() { window.removeEventListener('keydown', onKey); } };
}

// Pide (o crea) la clave. reason: para qué se pide, en una frase («Para anotar la fecha de la Primera Comunión»).
export function grownGate({ reason = '' } = {}) {
  if (unlocked()) { open(); return Promise.resolve(true); }
  return hasPin() ? askPin(reason) : firstTime(reason);
}

function askPin(reason) {
  return new Promise(resolve => {
    let ok = false, mode = 'pin', pad = null;
    const msg = h('p', { class: 'gk-msg', role: 'status', 'aria-live': 'polite' });
    const m = modal({
      title: 'Solo para grandes', icon: '🔐', className: 'gk-modal',
      body: [reason ? h('p', { class: 'gk-lead' }, reason) : null, h('p', { class: 'gk-lead' }, 'Escribe la clave de 4 números.'),
        (pad = keypad({ onDone: v => {
          if (Date.now() < waitUntil) { msg.textContent = 'Espera un momento antes de intentar de nuevo.'; pad.reset(); return; }
          if (check(v)) { ok = true; fails = 0; open(); sfx('good'); m.close(); return; }
          fails++; sfx('wrong'); pad.shake(); pad.reset();
          if (fails >= 3) { waitUntil = Date.now() + 30000; fails = 0; msg.textContent = 'Clave equivocada. Espera 30 segundos.'; }
          else msg.textContent = 'Esa no es la clave.';
        } })).el, msg],
      buttons: [
        { label: 'Olvidé la clave', kind: 'ghost', small: true, onClick: () => { mode = 'forgot'; } },
        { label: 'Cancelar', kind: 'ghost', small: true },
      ],
    });
    m.closed.then(async () => {
      pad?.off();
      if (mode === 'forgot') { const r = await forgot(); if (r) open(); resolve(r); }
      else resolve(ok);
    });
  });
}

function firstTime(reason) {
  return new Promise(resolve => {
    let result = false;
    const m = modal({
      title: 'Solo para grandes', icon: '🔐', className: 'gk-modal',
      body: [reason ? h('p', { class: 'gk-lead' }, reason) : null,
        h('p', { class: 'gk-lead' }, 'Para que los niños no cambien estas cosas sin querer, creen una clave de 4 números que solo sepan los grandes (papá, mamá o el catequista).'),
        h('p', { class: 'gk-note' }, 'Se guarda solo en este teléfono. Si la olvidan, se puede volver a crear respondiendo una pregunta difícil.')],
      buttons: [
        { label: 'Ahora no', kind: 'ghost', small: true, value: 'math' },
        { label: 'Crear la clave', kind: 'sun', small: true, value: 'pin' },
      ],
    });
    m.closed.then(async v => {
      if (v === 'pin') result = await createPin();
      else if (v === 'math') result = await mathGate();
      if (result) open();
      resolve(result);
    });
  });
}

// Crear o cambiar la clave: dos veces la misma.
export async function choosePin() {
  if (hasPin() && !unlocked()) { const ok = await askPin('Para cambiar la clave, primero escribe la actual.'); if (!ok) return false; }
  return createPin();
}
function createPin() {
  return new Promise(resolve => {
    let first = '', ok = false, pad = null;
    const title = h('p', { class: 'gk-lead' }, 'Elige 4 números.');
    const msg = h('p', { class: 'gk-msg', role: 'status', 'aria-live': 'polite' });
    const m = modal({
      title: 'Nueva clave', icon: '🔐', className: 'gk-modal',
      body: [title, (pad = keypad({ onDone: v => {
        if (!first) { first = v; title.textContent = 'Escríbelos otra vez para confirmar.'; msg.textContent = ''; pad.reset(); return; }
        if (v === first) { ok = setPin(v); sfx('good'); toast(ok ? 'Clave guardada. ¡No la olviden!' : 'No se pudo guardar la clave', { icon: '🔐' }); m.close(); return; }
        sfx('wrong'); pad.shake(); first = ''; pad.reset(); title.textContent = 'Elige 4 números.'; msg.textContent = 'No coincidían. Empecemos de nuevo.';
      } })).el, msg],
      buttons: [{ label: 'Cancelar', kind: 'ghost', small: true }],
    });
    m.closed.then(() => { pad?.off(); if (ok) open(); resolve(ok); });
  });
}

// Sin clave: una multiplicación que un niño pequeño no resuelve de memoria.
function mathGate() {
  return new Promise(resolve => {
    let a, b, ok = false;
    const q = h('p', { class: 'gk-q' });
    const input = h('input', { class: 'gk-in', type: 'text', inputmode: 'numeric', pattern: '[0-9]*', maxlength: '4', autocomplete: 'off', 'aria-label': 'Respuesta' });
    const msg = h('p', { class: 'gk-msg', role: 'status', 'aria-live': 'polite' });
    const ask = () => { a = 12 + Math.floor(Math.random() * 8); b = 3 + Math.floor(Math.random() * 7); q.textContent = `¿Cuánto es ${a} × ${b}?`; input.value = ''; };
    ask();
    const m = modal({
      title: 'Solo para grandes', icon: '🧑‍🏫', className: 'gk-modal',
      body: [h('p', { class: 'gk-lead' }, 'Responde para seguir.'), q, input, msg],
      buttons: [
        { label: 'Cancelar', kind: 'ghost', small: true },
        { label: 'Entrar', kind: 'sun', small: true, onClick: () => {
          if (Number(input.value.trim()) === a * b) { ok = true; return true; }
          sfx('wrong'); msg.textContent = 'Esa no es. Prueba con esta otra.'; ask(); input.focus(); return false;
        } },
      ],
    });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') m.el.querySelector('.btn--sun')?.click(); });
    setTimeout(() => input.focus({ preventScroll: true }), 60);
    m.closed.then(() => resolve(ok));
  });
}

// Olvidé la clave: una cuenta difícil y un minuto de espera; luego se borra la clave y se puede crear otra.
function forgot() {
  return new Promise(resolve => {
    const a = 112 + Math.floor(Math.random() * 80), b = 13 + Math.floor(Math.random() * 6);
    let left = 60, ok = false, timer = 0;
    const q = h('p', { class: 'gk-q' }, `¿Cuánto es ${a} × ${b}?`);
    const input = h('input', { class: 'gk-in', type: 'text', inputmode: 'numeric', pattern: '[0-9]*', maxlength: '5', autocomplete: 'off', 'aria-label': 'Respuesta' });
    const msg = h('p', { class: 'gk-msg', role: 'status', 'aria-live': 'polite' });
    const count = h('p', { class: 'gk-note' });
    const m = modal({
      title: 'Olvidé la clave', icon: '🔑', className: 'gk-modal', dismissible: false,
      body: [h('p', { class: 'gk-lead' }, 'Para borrar la clave y crear otra, un grande responde esta cuenta. Después hay que esperar un minuto.'), q, input, count, msg],
      buttons: [
        { label: 'Cancelar', kind: 'ghost', small: true },
        { label: 'Borrar la clave', kind: 'sun', small: true, onClick: () => {
          if (Number(input.value.trim()) !== a * b) { sfx('wrong'); msg.textContent = 'Esa no es la respuesta.'; return false; }
          if (left > 0) { msg.textContent = `Falta esperar ${left} segundos.`; return false; }
          clearPin(); ok = true; toast('Se borró la clave. Pueden crear una nueva.', { icon: '🔑' }); return true;
        } },
      ],
    });
    const tick = () => { left = Math.max(0, left - 1); count.textContent = left ? `Espera ${left} segundos…` : 'Ya puedes borrar la clave.'; if (left) timer = setTimeout(tick, 1000); };
    count.textContent = `Espera ${left} segundos…`;
    timer = setTimeout(tick, 1000);
    m.closed.then(async () => {
      clearTimeout(timer);
      if (ok) { ok = await createPin(); }
      resolve(ok);
    });
  });
}
