// Navegación entre pantallas. Solo hay una pantalla montada a la vez dentro de #screen.
//
// Una pantalla es un módulo que exporta:
//   export function mount(el, params) { …; return { unmount() {} } }   // el = contenedor vacío (#screen); puede ser async
//
//   register('biblia', () => import('../screens/bible.js'))
//   go('biblia', { tab: 'oraciones' })     abre una pantalla (guarda la anterior para volver)
//   back()                                 vuelve a la anterior (o a la de inicio)
//   current()                              { name, params }
import { h, clear, button } from './ui.js';

const screens = new Map();
const stack = [];
let active = null;      // { name, params, handle }
let busy = false;
let home = 'home';

export function register(name, loader) { screens.set(name, loader); }
export function setHome(name) { home = name; }
// "Atrás" dentro de la pantalla actual (p. ej. de una historia al índice de la Biblia). true si la pantalla lo usó.
export function screenBack() {
  try { return !!active?.handle?.back?.(); } catch (e) { console.error(e); return false; }
}
export function current() { return active ? { name: active.name, params: active.params } : null; }

function container() { return document.getElementById('screen'); }

async function show(name, params) {
  const el = container();
  if (active) {
    try { active.handle?.unmount?.(); } catch (e) { console.error(e); }
    active = null;
  }
  clear(el);
  el.dataset.screen = name;
  let handle = null;
  try {
    const loader = screens.get(name);
    if (!loader) throw new Error(`Pantalla desconocida: ${name}`);
    const mod = await loader();
    handle = (await mod.mount(el, params || {})) || {};
  } catch (e) {
    console.error(`[pantalla ${name}]`, e);
    window.__screenError = String(e && e.stack || e);
    clear(el);
    el.append(h('div', { class: 'splash' },
      h('div', { class: 'splash__bird', 'aria-hidden': 'true' }, '🛠️'),
      h('h2', null, 'Esta parte todavía no está lista'),
      name !== home ? button('Volver', { kind: 'ghost', icon: '↩️', onClick: () => back() }) : null));
  }
  active = { name, params: params || {}, handle };
  window.dispatchEvent(new CustomEvent('palomita:screen', { detail: { name } }));
}

export async function go(name, params = {}, { replace = false } = {}) {
  if (busy) return;
  busy = true;
  try {
    if (active && !replace) stack.push({ name: active.name, params: active.params });
    if (name === home) stack.length = 0;
    await show(name, params);
  } finally { busy = false; }
}

export async function back() {
  if (busy) return;
  busy = true;
  try {
    const prev = stack.pop() || { name: home, params: {} };
    await show(prev.name, prev.params);
  } finally { busy = false; }
}
