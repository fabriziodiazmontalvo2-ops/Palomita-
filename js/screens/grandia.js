// «Mi gran día»: la celebración de la Primera Comunión paso a paso, con cuenta regresiva
// y una tarea cortita para cada uno de los últimos 9 días.
//   go('grandia')
import * as R from '../core/reminders.js';
import { h, clear, button } from '../core/ui.js';
import { sfx } from '../core/audio.js';
import { back, go } from '../core/router.js';
import { goLink } from '../core/links.js';
import { arr, txt, deco, smooth, lifecycle, shell, soon, speakBtn, miniScene } from './catequesis.js';

const WHO = { sacerdote: { icon: '🧔', label: 'El sacerdote dice' }, todos: { icon: '🙋', label: 'Todos respondemos' }, yo: { icon: '🧒', label: 'Yo digo' }, catequista: { icon: '👩‍🏫', label: 'La catequista dice' } };

export async function mount(el, params = {}) {
  const life = lifecycle();
  const sh = shell(el, { title: 'Mi gran día', onBack: () => back(), cls: 'fe' });
  let G = null;
  try { G = (await import('../data/gran-dia.js')).GRAN_DIA; } catch { /* sin datos */ }
  if (!G) { sh.fill(soon()); return { unmount() { life.end(); sh.root.remove(); } }; }
  const steps = arr(G.steps).filter(s => s && s.title);
  let idx = Math.max(0, Math.min(steps.length - 1, Number(params.step) || 0));

  const ev = R.nextEvent('comunion');
  const countdownCard = () => {
    if (!ev && R.events().some(e => e.kind === 'comunion')) return null;
    if (!ev) return h('div', { class: 'fe-note' }, deco('🗓️'), h('p', null, 'Cuando tu catequista diga la fecha, un grande la anota en «Mi parroquia» y aquí verás cuántos días faltan.'),
      button('Ir a Mi parroquia', { kind: 'ghost', small: true, icon: '⛪', onClick: () => go('parroquia', { tab: 'catequesis' }) }));
    const big = ev.days === 0 ? '¡Es hoy!' : ev.days === 1 ? '¡Es mañana!' : `Faltan ${ev.days} días`;
    const task = arr(G.countdown).find(t => t.daysLeft === ev.days);
    return h('div', { class: 'fe-count' },
      h('p', { class: 'fe-count__eyebrow' }, 'Mi Primera Comunión'),
      h('p', { class: 'fe-count__big' }, big),
      h('p', { class: 'fe-count__when' }, `${R.fmtDate(ev.start)} · ${R.fmtTime(ev.time)}`),
      ev.days === 0 && G.dayOf ? h('p', { class: 'fe-count__msg' }, txt(G.dayOf.text)) : null,
      task ? h('div', { class: 'fe-task' }, h('p', { class: 'fe-task__h' }, deco(task.emoji || '⭐'), 'Tu tarea de hoy'), h('p', null, txt(task.text)),
        h('div', { class: 'fe-acc__tools' }, speakBtn(() => txt(task.text), { compact: true, label: 'Escuchar la tarea' }),
          task.link ? button(txt(task.link.label) || 'Ir', { kind: 'sun', small: true, icon: '👉', onClick: () => goLink(task.link) }) : null)) : null);
  };

  const stepBox = h('div', { class: 'fe-steps' });
  function paintStep() {
    const st = steps[idx];
    const emojis = arr(st.emojis).slice(0, 4);
    const actors = emojis.map((e, k) => ({ e, x: [24, 74, 50, 86][k] ?? 50, y: [64, 62, 30, 28][k] ?? 50, s: k < 2 ? 1.15 : 0.8 }));
    const dialogue = arr(st.dialogue).filter(d => d && txt(d.text));
    clear(stepBox).append(
      h('div', { class: 'cf-steps__top' }, h('p', { class: 'eyebrow' }, `Paso ${idx + 1} de ${steps.length}`),
        h('div', { class: 'cf-dots', 'aria-hidden': 'true' }, steps.map((_, k) => h('i', { class: k < idx ? 'is-done' : k === idx ? 'is-now' : '' })))),
      h('article', { class: 'cf-step fe-step', 'aria-label': `Paso ${idx + 1}: ${txt(st.title)}` },
        miniScene(st.bg, actors, 'fe-step__art'),
        h('div', { class: 'cf-step__head' },
          h('span', { class: 'cf-step__emoji', 'aria-hidden': 'true' }, txt(st.emoji) || '⭐'),
          h('h2', null, txt(st.title)),
          speakBtn(() => [txt(st.title), txt(st.text), ...dialogue.map(d => txt(d.text))], { compact: true, label: 'Escuchar este paso' })),
        h('p', { class: 'cf-step__text' }, txt(st.text)),
        dialogue.length ? h('div', { class: 'fe-dialog' }, dialogue.map(d => {
          const w = WHO[d.who] || WHO.todos;
          return h('div', { class: `cf-bubble cf-bubble--${d.who === 'sacerdote' ? 'priest' : 'me'}` },
            h('span', { class: 'cf-bubble__face', 'aria-hidden': 'true' }, w.icon),
            h('div', { class: 'cf-bubble__box' }, h('span', { class: 'cf-bubble__who' }, w.label), h('p', null, txt(d.text))));
        })) : null,
        st.tip ? h('p', { class: 'fe-tip' }, deco('💡'), txt(st.tip)) : null),
      h('div', { class: 'cf-steps__nav' },
        button('Anterior', { kind: 'ghost', small: true, icon: '◀️', attrs: { disabled: idx === 0 ? '' : null }, onClick: () => { idx = Math.max(0, idx - 1); sfx('page'); paintStep(); top(); } }),
        idx === steps.length - 1
          ? button('Mis dudas', { kind: 'sun', small: true, icon: '💬', onClick: () => go('dudas') })
          : button('Siguiente', { kind: 'sun', small: true, icon: '▶️', onClick: () => { idx++; sfx('page'); paintStep(); top(); } })));
  }
  const top = () => stepBox.scrollIntoView({ behavior: smooth(), block: 'start' });
  paintStep();

  // Después de la Primera Comunión: un mensaje para seguir caminando con Jesús.
  const today = R.isoDate(new Date());
  const done = !ev && R.events().some(e => e.kind === 'comunion' && e.date < today);
  const after = done && G.after ? h('div', { class: 'fe-note fe-note--after' }, deco('🕊️'), h('div', null, h('b', null, txt(G.after.title)), h('p', null, txt(G.after.text)))) : null;
  sh.fill(
    countdownCard(),
    h('div', { class: 'ct-intro' }, h('h2', null, txt(G.title) || 'Mi gran día'), arr(G.intro).map(p => h('p', null, txt(p))),
      h('div', { class: 'ct-tools' }, speakBtn(() => arr(G.intro).map(txt)))),
    stepBox,
    after);
  return { unmount() { life.end(); sh.root.remove(); } };
}
