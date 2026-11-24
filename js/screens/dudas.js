// «Mis dudas»: lo que los niños suelen preguntar sobre la Confesión y la Primera Comunión.
//   go('dudas')
import { h, button } from '../core/ui.js';
import { sfx } from '../core/audio.js';
import { back } from '../core/router.js';
import { goLink } from '../core/links.js';
import { arr, txt, deco, lifecycle, shell, soon, speakBtn } from './catequesis.js';

export async function mount(el) {
  const life = lifecycle();
  const sh = shell(el, { title: 'Mis dudas', onBack: () => back(), cls: 'fe' });
  let DUDAS = [];
  try { DUDAS = arr((await import('../data/dudas.js')).DUDAS); } catch { /* sin datos */ }
  if (!DUDAS.length) { sh.fill(soon('Muy pronto', 'Estamos preparando las respuestas a tus dudas.', '💬')); return { unmount() { life.end(); sh.root.remove(); } }; }
  const item = (d, i) => h('details', { class: 'fe-acc', open: i === 0 ? true : null, ontoggle: e => { if (e.target.open) sfx('pop'); } },
    h('summary', null, deco('💭'), h('span', null, txt(d.q))),
    h('div', { class: 'fe-acc__body' },
      h('p', null, txt(d.a)),
      h('div', { class: 'fe-acc__tools' },
        speakBtn(() => [txt(d.q), txt(d.a)], { compact: true, label: 'Escuchar la respuesta' }),
        d.link ? button(txt(d.link.label) || 'Ver', { kind: 'ghost', small: true, icon: '👉', onClick: () => goLink(d.link) }) : null)));
  sh.fill(
    h('div', { class: 'ct-intro' }, h('h2', null, '¿Tienes una duda?'),
      h('p', null, 'Aquí están las preguntas que hacen muchos niños antes de su Primera Confesión y su Primera Comunión. Si tu duda no está, pregúntale con confianza a tu catequista o al sacerdote.')),
    h('div', { class: 'fe-list' }, DUDAS.map(item)));
  return { unmount() { life.end(); sh.root.remove(); } };
}
