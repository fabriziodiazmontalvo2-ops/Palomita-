// «El Credo, frase por frase»: cada renglón del Credo de los Apóstoles con una explicación para niños y un atajo al
// tema de «Mi camino» que lo cuenta mejor (CREDO_PHRASES de js/data/oraciones-extra.js).
//   go('credo')
import * as state from '../core/state.js';
import * as tts from '../core/tts.js';
import { h, button } from '../core/ui.js';
import { sfx } from '../core/audio.js';
import { go, back } from '../core/router.js';
import { arr, txt, deco, loadData, lifecycle, shell, soon, speakBtn, grant, rewardRow, celebrate } from './catequesis.js';

const PRIZE = { coins: 15, fe: 5, xp: 8 };

export async function mount(el, params = {}) {
  const life = lifecycle();
  const sh = shell(el, { title: 'El Credo', onBack: () => back(), cls: 'fe cr' });
  let P = [], topics = [];
  try {
    const [x, cat] = await Promise.all([import('../data/oraciones-extra.js'), loadData('catechism')]);
    P = arr(x.CREDO_PHRASES).filter(p => p && p.line);
    topics = arr(cat);
  } catch { /* sin datos */ }
  if (life.dead) return { unmount() {} };
  if (!P.length) { sh.fill(soon()); return { unmount() { life.end(); sh.root.remove(); } }; }
  const topicOf = id => topics.find(t => t.id === id) || null;
  const voiceOn = () => tts.available() && state.setting('voice') !== false;

  function intro() {
    sh.setChip(null);
    sh.fill(
      h('div', { class: 'ct-intro cr-hero' },
        h('div', { class: 'cr-hero__icon', 'aria-hidden': 'true' }, '✝️'),
        h('h2', null, 'El Credo, frase por frase'),
        h('p', null, '«Credo» quiere decir «creo». Es lo que creemos todos los cristianos del mundo. Vamos a entenderlo despacito, una frase a la vez.')),
      h('ol', { class: 'cr-all' }, P.map((p, i) => h('li', null, h('button', { type: 'button', class: 'cr-line', onclick: () => { sfx('pop'); phrase(i); } }, txt(p.line))))),
      button('Empezar', { kind: 'sun', block: true, icon: '▶️', onClick: () => phrase(0) }),
      button('Rezar el Credo', { kind: 'ghost', small: true, icon: '🙏', onClick: () => go('bible', { prayer: 'credo' }) }));
  }

  function phrase(i) {
    tts.stop();
    const p = P[i];
    const t = p.topic ? topicOf(p.topic) : null;
    sh.setChip({ icon: '✝️', text: `${i + 1}/${P.length}`, label: `Frase ${i + 1} de ${P.length}` });
    const last = i === P.length - 1;
    sh.fill(
      h('div', { class: 'cr-dots', 'aria-hidden': 'true' }, P.map((_, k) => h('i', { class: k < i ? 'is-done' : k === i ? 'is-now' : '' }))),
      h('section', { class: 'cr-card' },
        h('p', { class: 'eyebrow' }, `Frase ${i + 1} de ${P.length}`),
        h('p', { class: 'cr-card__line' }, `«${txt(p.line).replace(/[,.]$/, '')}»`),
        h('p', { class: 'cr-card__text' }, txt(p.explain)),
        h('div', { class: 'ct-tools' }, speakBtn(() => [txt(p.line), txt(p.explain)], { label: 'Escuchar' }),
          t ? button(`Aprende más: ${txt(t.title)}`, { kind: 'ghost', small: true, icon: '👣', onClick: () => go('bible', { topic: t.id }) }) : null)),
      h('div', { class: 'ro-btns' },
        i > 0 ? button('Anterior', { kind: 'ghost', small: true, icon: '◀️', onClick: () => phrase(i - 1) }) : null,
        button(last ? 'Terminar' : 'Siguiente', { kind: 'sun', icon: last ? '🏁' : '▶️', onClick: () => (last ? finish() : phrase(i + 1)) })));
    if (voiceOn() && params.auto) tts.speak([txt(p.line), txt(p.explain)]);
  }

  function finish() {
    tts.stop();
    const first = state.markRead('credo:frases');
    const gains = first ? grant(PRIZE) : [];
    sfx(first ? 'win' : 'sparkle');
    if (first) celebrate(sh.page, ['✝️', '✨', '💛']);
    sh.setChip(null);
    sh.fill(
      h('div', { class: 'ct-intro ro-end' }, h('div', { class: 'ro-end__icon', 'aria-hidden': 'true' }, '✝️'),
        h('h2', null, '¡Ya entiendes el Credo!'),
        h('p', null, 'Ahora, cuando lo reces en la Misa, sabrás lo que dices. ¡Dilo con todo el corazón!'),
        rewardRow(gains)),
      h('div', { class: 'ro-btns' },
        button('Rezar el Credo', { kind: 'sun', icon: '🙏', onClick: () => go('bible', { prayer: 'credo' }) }),
        button('Ganar su sello', { kind: 'grape', small: true, icon: '🎫', onClick: () => go('memoria', { id: 'credo' }) }),
        button('Ver todas las frases', { kind: 'ghost', small: true, icon: '📜', onClick: intro })));
  }

  intro();
  return { unmount() { life.end(); sh.root.remove(); } };
}
