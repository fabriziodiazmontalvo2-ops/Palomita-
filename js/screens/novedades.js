// Ventana de novedades: una vez después de actualizar Palomita, o cuando se pide desde Ajustes.
//   maybeShowNews() → Promise<boolean>   la muestra si la versión cambió desde la última vez (no en la primera instalación)
//   showNews({ all })                      la muestra ahora (all: todas las versiones)
import * as state from '../core/state.js';
import { VERSION } from '../core/version.js';
import { NEWS } from '../data/novedades.js';
import { h, modal } from '../core/ui.js';
import { sfx } from '../core/audio.js';

export function showNews({ all = false } = {}) {
  const list = all ? NEWS : NEWS.filter(n => n.version === VERSION);
  if (!list.length) return Promise.resolve(false);
  sfx('sparkle');
  const m = modal({
    title: list[0].title, icon: '🎉', className: 'news-modal',
    body: list.map((n, i) => h('div', { class: 'news' },
      i > 0 ? h('h3', { class: 'news__v' }, n.title) : null,
      h('ul', { class: 'news__list' }, n.items.map(it => h('li', null, h('span', { 'aria-hidden': 'true' }, it.icon), h('span', null, it.text)))))),
    buttons: [{ label: '¡Genial!', kind: 'sun' }],
  });
  return m.closed.then(() => true);
}

export async function maybeShowNews() {
  const seen = state.flag('lastVersion');
  if (seen === VERSION) return false;
  state.setFlag('lastVersion', VERSION);
  // Sin marca anterior: si la palomita ya había llegado, es una actualización desde la 1.2 o antes; si no, es nueva.
  if (!seen && !state.flag('arrived')) return false;
  return showNews();
}
