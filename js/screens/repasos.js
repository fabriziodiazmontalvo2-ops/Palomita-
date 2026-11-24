// «Mis repasos»: las preguntas que costaron vuelven otro día (al día siguiente, a los 3 días, a la semana) hasta que
// el niño las sabe. Las anota cualquier cuestionario de la app (js/core/review.js); aquí se repasan las que tocan hoy.
//   go('repasos')
import * as state from '../core/state.js';
import * as Rv from '../core/review.js';
import { h, button } from '../core/ui.js';
import { sfx } from '../core/audio.js';
import { go, back } from '../core/router.js';
import { arr, txt, deco, shuffle, loadData, lifecycle, shell, quiz, grant, rewardRow, celebrate } from './catequesis.js';

const MAX = 10;                        // preguntas por repaso
const PRIZE = { coins: 12, fe: 3, xp: 6 };

// Todas las preguntas de la app, cada una con su clave y de dónde viene.
async function buildBank() {
  const [lessons, cat, at, nt, mi, ars, parables, conf, mass, trivia] = await Promise.all(
    ['lessons', 'catechism', 'at', 'nt', 'milagros', 'ars', 'parables', 'confession', 'mass', 'trivia'].map(loadData));
  const bank = new Map();
  // from: lo que se ve sobre la pregunta · name: el botón para volver a leer · open: cómo llegar allí
  const add = (q, from, name, open) => {
    if (!q || !txt(q.q) || arr(q.options).length < 2 || !Number.isInteger(q.answer)) return;
    const k = Rv.keyOf(q);
    if (k && !bank.has(k)) bank.set(k, { q, from, name, open });
  };
  for (const l of arr(lessons)) for (const q of arr(l.quiz)) add(q, `De la lección «${txt(l.title)}»`, txt(l.title), () => go('lesson', { id: l.id }));
  for (const c of arr(cat)) for (const q of arr(c.quiz)) add(q, `Del tema «${txt(c.title)}»`, txt(c.title), () => go('bible', { topic: c.id }));
  for (const s of [...arr(at), ...arr(nt), ...arr(mi), ...arr(ars)]) for (const q of arr(s.quiz)) add(q, `De la historia «${txt(s.title)}»`, txt(s.title), () => go('bible', { story: s.id }));
  for (const p of Object.values(parables || {})) if (p) for (const q of arr(p.quiz)) add(q, `De «${txt(p.title)}»`, txt(p.title), () => go('bible', { parable: p.id }));
  for (const q of arr(conf?.quiz)) add(q, 'De «Mi Primera Confesión»', 'Mi Primera Confesión', () => go('confesion'));
  for (const q of arr(mass?.quiz)) add(q, 'De «La Misa paso a paso»', 'La Misa paso a paso', () => go('misa', { tab: 'preguntas' }));
  for (const q of arr(trivia)) add(q, 'Del Reto de fe', '', null);
  return bank;
}

function whenText(day) {
  if (!day) return '';
  const [y, m, d] = day.split('-').map(Number);
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const n = Math.round((new Date(y, m - 1, d) - t) / 86400000);
  return n <= 1 ? 'mañana' : n < 7 ? `en ${n} días` : n < 14 ? 'en una semana' : 'en dos semanas';
}

export async function mount(el) {
  const life = lifecycle();
  const sh = shell(el, { title: 'Mis repasos', onBack: () => back(), cls: 'fe rv' });
  const bank = await buildBank();
  if (life.dead) return { unmount() {} };
  // Las preguntas que ya no existen (cambió el texto en una versión nueva) salen de la lista, toquen hoy o no.
  for (const k of Object.keys(state.get().review || {})) if (!bank.has(k)) state.reviewDrop(k);

  function due() {
    const keys = state.reviewDue();
    const items = [];
    for (const k of keys) {
      const it = bank.get(k);
      if (it) items.push({ k, ...it });
      else state.reviewDrop(k);          // esa pregunta ya no existe en esta versión
    }
    return items;
  }

  function viewStart() {
    const items = due();
    const total = state.reviewCount();
    const later = total - items.length;
    sh.setChip(items.length ? { icon: '📚', text: String(items.length), label: `Te tocan ${items.length} preguntas hoy` } : null);
    if (!items.length) {
      sh.fill(
        h('div', { class: 'ct-intro rv-hero' },
          h('div', { class: 'rv-hero__icon', 'aria-hidden': 'true' }, total ? '🌟' : '📚'),
          h('h2', null, total ? '¡Estás al día!' : 'Todavía no hay repasos'),
          h('p', null, total
            ? `Hoy no te toca repasar. ${later === 1 ? 'Una pregunta vuelve' : `${later} preguntas vuelven`} ${whenText(state.reviewNext())}.`
            : 'Cuando una pregunta te cueste en una lección, una historia o el Reto de fe, aparecerá aquí otro día para que la repases.')),
        h('section', { class: 'fe-note' }, deco('💡'), h('div', null, h('b', null, '¿Cómo funciona?'),
          h('p', null, 'Lo que te cuesta vuelve al día siguiente. Si lo respondes bien, vuelve a los tres días y luego a la semana. ¡Cuando ya lo sabes, sale solito de la lista!'))),
        button('Jugar el Reto de fe', { kind: 'sky', block: true, icon: '🏆', onClick: () => go('reto') }));
      return;
    }
    sh.fill(
      h('div', { class: 'ct-intro rv-hero' },
        h('div', { class: 'rv-hero__icon', 'aria-hidden': 'true' }, '📚'),
        h('h2', null, items.length === 1 ? 'Hoy te toca una pregunta' : `Hoy te tocan ${Math.min(items.length, MAX)} preguntas`),
        h('p', null, 'Son preguntas que te costaron un poquito. ¡A ver cuánto recuerdas ahora!')),
      h('ul', { class: 'rv-from' }, [...new Set(items.slice(0, MAX).map(x => x.from))].slice(0, 4).map(f => h('li', null, deco('📌'), f))),
      button('Empezar a repasar', { kind: 'sun', block: true, icon: '▶️', onClick: run }));
  }

  function run() {
    const items = due().slice(0, MAX);
    if (!items.length) { viewStart(); return; }
    // Opciones barajadas: así no se aprende «la de arriba» sino la respuesta.
    const qs = items.map(({ q, from }) => {
      const order = shuffle(arr(q.options).map((_, i) => i));
      return { ...q, options: order.map(i => q.options[i]), answer: order.indexOf(q.answer), from };
    });
    sh.setChip({ icon: '📚', text: String(items.length), label: `Repasando ${items.length} preguntas` });
    const box = quiz(qs, { key: null, title: 'Mis repasos', fx: sh.page, again: false, onFinish: (slot, { hits, total }) => {
      const first = state.dailyOnce('repasos');
      state.dailyOnce('learn');
      state.logActivity(2);
      const gains = first ? grant(PRIZE) : [];
      if (first) celebrate(sh.page, ['📚', '⭐', '✨']);
      const left = due();
      // Las que falló quedan en la primera cajita: para ellas, un atajo a volver a leer de dónde vienen.
      const toRead = [...new Map(items.filter(x => x.open && state.reviewBox(x.k) === 1).map(x => [x.from, x])).values()];
      slot.append(...[
        rewardRow(gains),
        h('p', { class: 'rv-end' }, hits === total ? '¡Lo recordaste todo! Esas preguntas volverán más adelante, por si acaso.'
          : 'Las que fallaste vuelven mañana. ¡Poco a poco se aprenden!'),
        toRead.length ? h('div', { class: 'rv-read' }, h('p', null, 'Para repasar mejor, vuelve a leer:'),
          toRead.slice(0, 3).map(x => button(x.name, { kind: 'ghost', small: true, icon: '📖', onClick: () => x.open() }))) : null,
        button(left.length ? `Repasar ${left.length} más` : 'Listo', { kind: 'sun', small: true, icon: left.length ? '📚' : '✅', onClick: () => (left.length ? run() : back()) })].filter(Boolean));
    } });
    sh.fill(box);
  }

  viewStart();
  return { unmount() { life.end(); sh.root.remove(); } };
}
