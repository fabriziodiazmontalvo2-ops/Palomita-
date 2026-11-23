// Guía de la Primera Confesión: ¿Qué es? · Examen de conciencia · Paso a paso (con ensayo) · Preguntas.
//   go('confesion')
//
// PRIVACIDAD: lo que el niño marca en el examen («Esto me pasó») vive SOLO en una variable de esta pantalla.
// No se guarda en localStorage, ni en el estado del juego, ni en los parámetros del router; al salir se borra.
import * as state from '../core/state.js';
import * as tts from '../core/tts.js';
import { h, clear, button, confirmDialog } from '../core/ui.js';
import { sfx } from '../core/audio.js';
import { back } from '../core/router.js';
import { arr, txt, deco, smooth, loadData, lifecycle, shell, tabBar, soon, quiz, speakBtn, miniScene } from './catequesis.js';

const TABS = [
  { id: 'que', label: '¿Qué es?', icon: '🤗', step: true },
  { id: 'examen', label: 'Examen', icon: '📝', step: true },
  { id: 'pasos', label: 'Paso a paso', icon: '👣', step: true },
  { id: 'preguntas', label: 'Preguntas', icon: '🎯', step: true },
];
const PRIZE = { coins: 10, fe: 5 };
const WHO = {
  sacerdote: { name: 'Sacerdote', icon: '🧔' },
  yo: { name: 'Yo', icon: '🧒' },
};
const PRIVACY = 'Lo que marques es solo entre tú y Dios. No se guarda ni se envía a nadie, y se borra al salir de esta pantalla.';

export async function mount(el, params = {}) {
  const life = lifecycle();
  const sh = shell(el, { title: 'Confesión', onBack: () => back(), cls: 'cf' });
  const C = await loadData('confession');
  if (!C) {
    sh.fill(soon('Muy pronto', 'La guía para tu Primera Confesión se está preparando con mucho cariño.', '🤗'));
    return { unmount() { life.end(); sh.root.remove(); } };
  }
  const exam = arr(C.exam).filter(g => g && g.id && arr(g.questions).length);
  const steps = arr(C.steps).filter(s => s && (s.title || s.text));

  // Mi lista: solo en memoria.
  let mine = new Set();
  let tab = null;
  let stepIdx = 0;
  let viewOffs = [];
  const endView = () => { tts.stop(); for (const off of viewOffs.splice(0)) { try { off(); } catch (e) { console.error(e); } } };

  const tabs = tabBar(TABS, id => pick(id), 'Partes de la guía de Confesión');
  sh.root.insertBefore(tabs, sh.page);
  const floatPill = h('button', { type: 'button', class: 'ct-float', hidden: true, onclick: () => { sfx('tap'); document.getElementById('cf-list')?.scrollIntoView({ behavior: smooth(), block: 'start' }); } });
  sh.page.append(floatPill);

  function pick(id) {
    if (tab === id) { sh.scroll.scrollTo({ top: 0, behavior: smooth() }); return; }
    sfx('page');
    show(id);
  }
  function show(id) {
    endView();
    tab = id;
    tabs.select(id);
    sh.scroll.setAttribute('role', 'tabpanel');
    sh.scroll.setAttribute('aria-labelledby', `ct-tab-${id}`);
    floatPill.hidden = true;
    const body = { que: viewQue, examen: viewExamen, pasos: viewPasos, preguntas: viewPreguntas }[id]();
    sh.fill(body);
  }
  const nextTab = (id, label) => button(label, { kind: 'sun', block: true, icon: '▶️', sound: 'pop', onClick: () => { show(id); tabs.button(id)?.focus({ preventScroll: true }); } });

  // ── (a) ¿Qué es? ──
  function viewQue() {
    const intro = C.intro || {};
    const paras = arr(intro.paragraphs).map(txt).filter(Boolean);
    const title = txt(intro.title) || '¿Qué es la Confesión?';
    return [
      h('div', { class: 'cf-hero' },
        miniScene('jardin', [{ e: '🤗', x: 50, y: 58, s: 1.7 }, { e: '💛', x: 22, y: 30, s: 0.9, anim: 'float' }, { e: '🕊️', x: 78, y: 26, s: 1, anim: 'float' }], 'cf-hero__art'),
        h('h2', { class: 'cf-hero__title' }, title)),
      h('div', { class: 'ct-tools' }, speakBtn(() => [title, ...paras])),
      h('div', { class: 'ct-text' }, paras.map(p => h('p', null, p))),
      h('div', { class: 'cf-hug' },
        h('span', { class: 'cf-hug__icon', 'aria-hidden': 'true' }, '💛'),
        h('p', null, 'No tengas miedo: confesarte es recibir un abrazo de Dios. Él te quiere siempre y se alegra cuando vuelves a Él.')),
      nextTab('examen', 'Siguiente: mi examen'),
    ];
  }

  // ── (b) Examen de conciencia ──
  function viewExamen() {
    const listBox = h('section', { class: 'cf-list', id: 'cf-list', 'aria-label': 'Mi lista' });
    const counters = new Map();
    const rows = new Map();

    function paintList() {
      clear(listBox);
      const picked = [];
      for (const g of exam) arr(g.questions).forEach((q, i) => { if (mine.has(`${g.id}:${i}`)) picked.push({ g, i, q: txt(q) }); });
      listBox.append(h('h2', { class: 'ct-h2' }, deco('📝'), 'Mi lista secreta', h('span', { class: 'ct-count' }, String(picked.length))));
      if (!picked.length) {
        listBox.append(h('p', { class: 'cf-list__empty' }, 'Todavía no marcaste nada. Lee cada pregunta con calma y piensa en tu semana.'));
      } else {
        listBox.append(h('ol', { class: 'cf-list__items' }, picked.map(({ g, i, q }) => h('li', null,
          h('span', { class: 'cf-list__q' }, q),
          h('button', { type: 'button', class: 'cf-list__x', 'aria-label': `Quitar de mi lista: ${q}`, title: 'Quitar', onclick: () => { sfx('tap'); toggle(g.id, i); } }, deco('✕'))))),
        h('p', { class: 'cf-list__note' }, deco('🤗'), 'Cuando te confieses, dile al sacerdote estas cosas con tus propias palabras. Dios te perdona con mucho amor.'),
        button('Borrar mi lista', { kind: 'ghost', small: true, icon: '🧽', onClick: async () => {
          const ok = await confirmDialog('Se borrará todo lo que marcaste. ¿Quieres borrarlo?', { title: 'Borrar mi lista', icon: '🧽', yes: 'Sí, borrar', no: 'No' });
          if (!ok) return;
          mine = new Set();
          sfx('whoosh');
          repaint();
        } }));
      }
      listBox.append(h('p', { class: 'cf-list__private' }, deco('🔒'), 'Al salir de esta pantalla tu lista se borra sola.'));
    }
    function paintPill() {
      const k = mine.size;
      clear(floatPill).append(deco('📝'), `Mi lista · ${k}`, deco('⬇️'));
      floatPill.setAttribute('aria-label', `Ver mi lista: ${k} ${k === 1 ? 'cosa' : 'cosas'}`);
      floatPill.hidden = !k || listVisible;
    }
    function repaint() {
      for (const [key, b] of rows) b.setAttribute('aria-pressed', String(mine.has(key)));
      for (const [gid, c] of counters) {
        const k = [...mine].filter(x => x.startsWith(`${gid}:`)).length;
        c.textContent = k ? `${k} ✓` : '';
        c.hidden = !k;
      }
      paintList();
      paintPill();
    }
    function toggle(gid, i) {
      const key = `${gid}:${i}`;
      if (mine.has(key)) mine.delete(key); else { mine.add(key); sfx('pop'); }
      repaint();
    }

    const groups = exam.map((g, k) => {
      const panel = h('div', { class: 'cf-qs', id: `cf-g-${g.id}`, hidden: k !== 0 },
        arr(g.questions).map((q, i) => {
          const key = `${g.id}:${i}`;
          const b = h('button', { type: 'button', class: 'cf-q', 'aria-pressed': 'false', onclick: () => toggle(g.id, i) },
            h('span', { class: 'cf-q__text' }, txt(q)),
            h('span', { class: 'cf-q__pill', 'aria-hidden': 'true' }, h('span', { class: 'cf-q__off' }, 'Esto me pasó'), h('span', { class: 'cf-q__on' }, '✓ En mi lista')));
          rows.set(key, b);
          return b;
        }));
      const count = h('span', { class: 'cf-group__n', hidden: true });
      counters.set(g.id, count);
      const head = h('button', { type: 'button', class: 'cf-group__head', 'aria-expanded': String(k === 0), 'aria-controls': panel.id, onclick: () => {
        const open = panel.hidden;
        sfx(open ? 'pop' : 'tap');
        panel.hidden = !open;
        head.setAttribute('aria-expanded', String(open));
        box.classList.toggle('is-open', open);
        if (open) life.later(() => box.scrollIntoView({ behavior: smooth(), block: 'nearest' }), 40);
      } },
      h('span', { class: 'cf-group__icon', 'aria-hidden': 'true' }, txt(g.emoji) || '💭'),
      h('span', { class: 'cf-group__title' }, txt(g.title)),
      count,
      h('span', { class: 'ct-chev', 'aria-hidden': 'true' }));
      const box = h('section', { class: `cf-group${k === 0 ? ' is-open' : ''}` }, head, panel);
      return box;
    });

    let listVisible = false;
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => { listVisible = es[es.length - 1].isIntersecting; paintPill(); }, { root: sh.scroll });
      io.observe(listBox);
      viewOffs.push(() => io.disconnect());
    }
    viewOffs.push(() => { floatPill.hidden = true; });
    repaint();

    return [
      h('div', { class: 'cf-private', role: 'note' },
        h('span', { class: 'cf-private__icon', 'aria-hidden': 'true' }, '🔒'),
        h('p', null, txt(C.privacy) || PRIVACY)),
      h('div', { class: 'ct-intro' },
        h('h2', null, 'Mi examen de conciencia'),
        h('p', null, 'Piensa con calma en tu semana. Si algo te pasó, toca «Esto me pasó» y se guardará en tu lista secreta.')),
      groups,
      listBox,
      nextTab('pasos', 'Siguiente: paso a paso'),
    ];
  }

  // ── (c) Paso a paso, con ensayo del diálogo ──
  function viewPasos() {
    if (!steps.length) return soon('Muy pronto', 'Los pasos de la Confesión están por llegar.', '👣');
    const wrap = h('div', { class: 'cf-steps' });
    function paint() {
      endView();
      const st = steps[stepIdx];
      const dots = h('div', { class: 'cf-dots', 'aria-hidden': 'true' }, steps.map((_, k) => h('i', { class: k < stepIdx ? 'is-done' : k === stepIdx ? 'is-now' : '' })));
      const dialogue = arr(st.dialogue).filter(d => d && txt(d.text));
      const last = stepIdx === steps.length - 1;
      clear(wrap).append(
        h('div', { class: 'cf-steps__top' }, h('p', { class: 'eyebrow' }, `Paso ${stepIdx + 1} de ${steps.length}`), dots),
        h('article', { class: 'cf-step', 'aria-label': `Paso ${stepIdx + 1}: ${txt(st.title)}` },
          h('div', { class: 'cf-step__head' },
            h('span', { class: 'cf-step__emoji', 'aria-hidden': 'true' }, txt(st.emoji) || '👣'),
            h('h2', null, txt(st.title)),
            speakBtn(() => [txt(st.title), txt(st.text)], { compact: true, label: 'Escuchar este paso' })),
          h('p', { class: 'cf-step__text' }, txt(st.text)),
          dialogue.length ? rehearsal(dialogue) : null),
        h('div', { class: 'cf-steps__nav' },
          button('Anterior', { kind: 'ghost', small: true, icon: '◀️', attrs: { disabled: stepIdx === 0 ? '' : null }, onClick: () => { stepIdx = Math.max(0, stepIdx - 1); paint(); top(); } }),
          last ? button('Ir a las preguntas', { kind: 'sun', small: true, icon: '🎯', onClick: () => show('preguntas') })
            : button('Siguiente', { kind: 'sun', small: true, icon: '▶️', onClick: () => { stepIdx++; paint(); top(); } })));
    }
    const top = () => sh.scroll.scrollTo({ top: 0, behavior: smooth() });
    paint();
    return [
      h('div', { class: 'ct-intro' },
        h('h2', null, 'Así es la Confesión'),
        h('p', null, 'Mira cada paso. Donde hay diálogo, puedes ensayar lo que vas a decir.')),
      wrap,
    ];
  }

  // Ensayo: globitos que aparecen al tocar «Siguiente» (sacerdote a la izquierda, yo a la derecha).
  function rehearsal(dialogue) {
    let shown = 1;
    const list = h('div', { class: 'cf-chat', role: 'log', 'aria-live': 'polite' });
    const ctrl = h('div', { class: 'cf-chat__ctrl' });
    const bubble = d => {
      const who = WHO[d.who] || WHO.yo;
      return h('div', { class: `cf-bubble cf-bubble--${d.who === 'sacerdote' ? 'priest' : 'me'}` },
        h('span', { class: 'cf-bubble__face', 'aria-hidden': 'true' }, who.icon),
        h('div', { class: 'cf-bubble__box' },
          h('span', { class: 'cf-bubble__who' }, d.who === 'yo' ? 'Yo digo' : 'El sacerdote dice'),
          h('p', null, txt(d.text)),
          speakBtn(() => txt(d.text), { compact: true, label: 'Escuchar este globito' })));
    };
    function paint() {
      clear(list).append(...dialogue.slice(0, shown).map(bubble));
      list.lastChild?.classList.add('is-new');
      clear(ctrl);
      if (shown < dialogue.length) {
        const nextWho = dialogue[shown].who === 'yo' ? 'Ahora tú' : 'Sigue el sacerdote';
        ctrl.append(button(`Siguiente · ${nextWho}`, { kind: 'grape', small: true, icon: '💬', onClick: () => { shown++; sfx('pop'); paint(); list.lastChild?.scrollIntoView({ behavior: smooth(), block: 'nearest' }); } }));
      } else {
        ctrl.append(h('p', { class: 'cf-chat__done' }, deco('🌟'), '¡Muy bien! Ya sabes qué decir.'),
          button('Ensayar otra vez', { kind: 'ghost', small: true, icon: '🔄', onClick: () => { shown = 1; paint(); } }));
      }
    }
    paint();
    return h('section', { class: 'cf-rehearse', 'aria-label': 'Ensayo' },
      h('h3', null, deco('🎭'), 'Ensayemos'),
      list, ctrl);
  }

  // ── (d) Preguntas ──
  function viewPreguntas() {
    const q = quiz(C.quiz, { key: 'confesion', prize: PRIZE, perfectOnly: true, title: 'Preguntas', fx: sh.page,
      onFinish: (slot, { perfect }) => {
        slot.append(h('p', { class: 'cf-bye' }, deco('🕊️'), perfect ? '¡Estás listo! Dios te espera con los brazos abiertos.' : 'Repasa con calma: Dios te espera con los brazos abiertos.'));
      } });
    return [
      h('div', { class: 'ct-intro' },
        h('h2', null, '¿Qué aprendiste?'),
        h('p', null, state.quizDone('confesion') ? 'Ya ganaste el premio. ¡Puedes repasar cuando quieras!' : 'Responde todo bien y gana un premio.')),
      q || soon('Muy pronto', 'Las preguntas están por llegar.', '🎯'),
    ];
  }

  show(TABS.some(t => t.id === params.tab) ? params.tab : 'que');

  return {
    unmount() {
      mine.clear();
      mine = new Set();
      endView();
      life.end();
      sh.root.remove();
    },
  };
}
