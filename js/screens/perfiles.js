// «¿Quién va a jugar?»: con varios niños en el mismo teléfono, cada uno entra a su palomita.
// Aparece al abrir la app (una vez por apertura) y desde Ajustes. Cambiar de niño recarga la app.
import * as profiles from '../core/profiles.js';
import { h, button } from '../core/ui.js';
import { sfx } from '../core/audio.js';
import { go, back } from '../core/router.js';
import { grownGate } from '../core/grown.js';

const COLORS = ['#ffcf5c', '#8fd3ff', '#ffb3c7', '#b7e88f'];

export function mount(el, params = {}) {
  const list = profiles.list();
  const pick = id => {
    sfx('pop');
    profiles.markPicked();
    if (id === profiles.activeId()) go('home', {}, { replace: true });
    else profiles.switchTo(id);
  };
  el.append(h('div', { class: 'pf' },
    h('h1', { class: 'pf__title' }, '¿Quién va a jugar?'),
    h('p', { class: 'pf__lead' }, 'Toca tu palomita'),
    h('div', { class: 'pf__grid' }, list.map((p, i) => {
      const b = h('button', { type: 'button', class: `pf-card${p.id === profiles.activeId() ? ' is-active' : ''}`, onclick: () => pick(p.id) },
        h('span', { class: 'pf-card__bird', 'aria-hidden': 'true' }, '🕊️'),
        h('span', { class: 'pf-card__kid' }, p.kid || 'Sin nombre'),
        h('span', { class: 'pf-card__pet' }, `${p.name} · nivel ${p.level}`));
      b.style.setProperty('--c', COLORS[i % COLORS.length]);
      return b;
    })),
    profiles.canAdd() ? button('Agregar otro niño', { kind: 'ghost', small: true, icon: '➕', onClick: async () => {
      if (!(await grownGate({ reason: 'Para agregar la palomita de otro niño.' }))) return;
      const id = profiles.add();
      if (id) profiles.switchTo(id);
    } }) : null,
    params.fromSettings ? button('Volver', { kind: 'ghost', small: true, icon: '↩️', onClick: () => back() }) : null));
  return {};
}
