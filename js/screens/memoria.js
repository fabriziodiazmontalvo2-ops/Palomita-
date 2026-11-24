// «Lo sé de memoria»: el pasaporte de las oraciones y listas que se aprenden para la Primera Comunión (MEMORY_SET de
// js/data/oraciones-extra.js). Cada una tiene dos retos: ordenar los renglones y completar lo que falta (en las listas,
// «¿cuál va en su lugar?»). Con los dos superados el niño gana su sello: state.setMemorized(id, 'nino').
// El sello verde lo pone un grande en «Para grandes» → Sellos, cuando el niño se la recita sin mirar.
//   go('memoria')              el pasaporte
//   go('memoria', { id })      directo a una oración (desde «Mis oraciones»)
import * as state from '../core/state.js';
import * as tts from '../core/tts.js';
import * as R from '../core/reminders.js';
import { h, button, toast } from '../core/ui.js';
import { sfx } from '../core/audio.js';
import { go, back } from '../core/router.js';
import { arr, txt, deco, shuffle, lifecycle, shell, soon, speakBtn, grant, rewardRow, celebrate, progressMeter } from './catequesis.js';

const CHUNK = 5;                         // renglones por ronda al ordenar (las oraciones largas van por partes)
const BLANKS = 5;                        // palabras que faltan por reto
const PRIZE = { coins: 30, fe: 5, xp: 12 };
const ALL_PRIZE = { coins: 100, fe: 10, xp: 30 };
// «el primer mandamiento», «el tercer sacramento»: antes de un sustantivo masculino se acortan.
const ORD = ['primer', 'segundo', 'tercer', 'cuarto', 'quinto', 'sexto', 'séptimo', 'octavo', 'noveno', 'décimo'];
const NOUN = { mandamientos: 'mandamiento', sacramentos: 'sacramento' };
const STOP = new Set(['para', 'pero', 'porque', 'como', 'esta', 'este', 'estas', 'estos', 'ellos', 'ellas', 'entre', 'hasta', 'sobre']);
const bare = w => w.replace(/[^\p{L}\p{N}]/gu, '');
const candidate = w => bare(w).length >= 4 && !STOP.has(bare(w).toLowerCase());
const passed = (id, k) => !!state.flag(`memo:${id}:${k}`);

export async function mount(el, params = {}) {
  const life = lifecycle();
  let view = 'index', cur = null, seenIndex = false;
  const sh = shell(el, { title: 'Lo sé de memoria', onBack: () => goBack(), cls: 'fe mm' });
  let SET = [], PR = [], VAR = [];
  try {
    const [x, p] = await Promise.all([import('../data/oraciones-extra.js'), import('../data/prayers.js')]);
    SET = arr(x.MEMORY_SET); PR = arr(p.PRAYERS); VAR = arr(x.CONTRITION_VARIANTS);
  } catch { /* sin datos */ }
  if (life.dead) return { unmount() {} };
  // Si la catequista eligió otro Acto de contrición (Mi parroquia → Costumbres), el sello usa ese.
  const cc = R.customs().contrition;
  const variant = cc && cc !== 'jesus-mi-senor' ? VAR.find(v => v.id === cc) : null;
  const items = SET.map(m => {
    const p = PR.find(x => x.id === m.id);
    let lines = m.type === 'list' ? arr(m.lines) : arr(p?.lines);
    if (m.id === 'acto-de-contricion' && variant) lines = arr(variant.lines);
    return { ...m, title: txt(m.title || p?.title || m.id), emoji: m.emoji || p?.emoji || '🙏', parish: m.id === 'acto-de-contricion' && !!variant,
      lines: lines.map(txt).filter(Boolean) };
  }).filter(m => m.lines.length);
  if (!items.length) { sh.fill(soon()); return { unmount() { life.end(); sh.root.remove(); } }; }

  function goBack() {
    tts.stop();
    if (view === 'game') { sfx('page'); open(cur); return; }
    if (view === 'item' && seenIndex) { sfx('page'); index(); return; }
    back();
  }
  const stamp = id => state.memorized(id);           // null | { by: 'nino' | 'grande', at }
  const retoLabel = (m, k) => (k === 'orden' ? 'Ordena los renglones' : m.type === 'list' ? '¿Cuál va en su lugar?' : '¿Qué palabra falta?');
  const play = (m, k) => (k === 'orden' ? playOrder(m) : m.type === 'list' ? playPlace(m) : playBlanks(m));

  // ───────── El pasaporte ─────────
  function index() {
    view = 'index'; cur = null; seenIndex = true;
    sh.setTitle('Lo sé de memoria');
    const n = items.filter(m => stamp(m.id)).length;
    sh.setChip({ icon: '🎫', text: `${n}/${items.length}`, label: `Sellos: ${n} de ${items.length}` });
    sh.fill(
      h('div', { class: 'ct-intro' }, h('h2', null, 'Mi pasaporte de oraciones'),
        h('p', null, 'Aprende de memoria lo que se reza y se sabe para la Primera Comunión. Supera los dos retos de cada una y ¡gana su sello!')),
      progressMeter((n / items.length) * 100, 'var(--grape)', `Sellos: ${n} de ${items.length}`),
      h('div', { class: 'mm-grid' }, items.map((m, i) => {
        const s = stamp(m.id);
        const half = !s && (passed(m.id, 'orden') || passed(m.id, 'falta'));
        return h('button', { type: 'button', class: `mm-stamp${s ? ` is-${s.by}` : half ? ' is-half' : ''}`, dataset: { memo: m.id },
          'aria-label': `${m.title}. ${s?.by === 'grande' ? 'Sello verde: se la recitaste a un grande.' : s ? 'Ya tienes su sello.' : half ? 'Te falta un reto.' : 'Por aprender.'}`,
          onclick: () => { sfx('pop'); open(m); } },
        h('span', { class: 'mm-stamp__n', 'aria-hidden': 'true' }, String(i + 1)),
        h('span', { class: 'mm-stamp__icon', 'aria-hidden': 'true' }, m.emoji),
        h('span', { class: 'mm-stamp__title' }, m.title),
        h('span', { class: 'mm-stamp__state', 'aria-hidden': 'true' }, s?.by === 'grande' ? '✅ Sello verde' : s ? '⭐ ¡Lo sé!' : half ? '1 de 2 retos' : 'Por aprender'));
      })),
      h('section', { class: 'fe-note fe-note--after' }, deco('✅'),
        h('p', null, 'Cuando ya te la sepas, recítasela sin mirar a tu papá, a tu mamá o a tu catequista. En «Para grandes» te pueden poner el sello verde.')));
  }

  // ───────── Una oración: leer, escuchar y sus dos retos ─────────
  function open(m) {
    view = 'item'; cur = m; tts.stop();
    sh.setTitle(m.title);
    const s = stamp(m.id);
    const list = m.type === 'list';
    sh.setChip(s ? { icon: s.by === 'grande' ? '✅' : '⭐', text: s.by === 'grande' ? 'Sello verde' : '¡Lo sé!', label: s.by === 'grande' ? 'Tienes el sello verde' : 'Tienes su sello' } : null);
    const reto = k => {
      const ok = passed(m.id, k);
      return h('button', { type: 'button', class: `mm-reto${ok ? ' is-done' : ''}`, dataset: { reto: k }, onclick: () => { sfx('pop'); play(m, k); } },
        h('span', { class: 'mm-reto__icon', 'aria-hidden': 'true' }, k === 'orden' ? '🧩' : '🔤'),
        h('span', { class: 'mm-reto__body' }, h('b', null, retoLabel(m, k)),
          h('span', null, ok ? '¡Superado! Puedes jugarlo otra vez.' : k === 'orden' ? (list ? 'Pon cada uno en su lugar' : 'Arma la oración en orden') : list ? 'Elige el que corresponde' : 'Completa los renglones')),
        h('span', { class: 'mm-reto__state', 'aria-hidden': 'true' }, ok ? '✅' : '▶️'));
    };
    sh.fill(
      h('header', { class: 'mm-head' },
        h('div', { class: 'mm-head__icon', 'aria-hidden': 'true' }, m.emoji),
        h('h2', null, m.title),
        s ? h('p', { class: `mm-badge mm-badge--${s.by}` }, s.by === 'grande' ? '✅ Sello verde: se la recitaste a un grande' : '⭐ ¡Ya tienes tu sello!') : null),
      h('section', { class: 'mm-read' },
        h(list ? 'ol' : 'div', { class: `mm-lines${list ? ' mm-lines--list' : ''}` }, m.lines.map(l => h(list ? 'li' : 'p', null, l))),
        m.parish ? h('p', { class: 'fe-tip' }, deco('⛪'), 'Es la versión que enseñan en tu parroquia.') : null,
        h('div', { class: 'mm-read__tools' },
          speakBtn(() => m.lines, { label: 'Escuchar' }),
          !list ? button('Practicar escondiendo palabras', { kind: 'ghost', small: true, icon: '🧠', onClick: () => go('bible', { prayer: m.id }) }) : null)),
      h('h3', { class: 'mm-h' }, deco('🎯'), 'Mis dos retos'),
      h('div', { class: 'mm-retos' }, reto('orden'), reto('falta')),
      !s ? h('p', { class: 'pq-small mm-hint' }, 'Supera los dos retos y gana el sello de esta oración.') : s.by !== 'grande'
        ? h('section', { class: 'fe-note fe-note--after' }, deco('✅'), h('p', null, 'Recítasela sin mirar a un grande: en «Para grandes» te pondrá el sello verde.')) : null,
      seenIndex ? null : button('Ver todo mi pasaporte', { kind: 'ghost', small: true, icon: '🎫', onClick: () => index() }));
  }

  // ───────── Reto 1: ordenar los renglones (por partes si es larga) ─────────
  function parts(lines) {
    if (lines.length <= 7) return [[0, lines.length]];
    const size = Math.ceil(lines.length / Math.ceil(lines.length / CHUNK));
    const out = [];
    for (let i = 0; i < lines.length; i += size) out.push([i, Math.min(lines.length, i + size)]);
    return out;
  }
  function playOrder(m) {
    view = 'game'; tts.stop();
    const list = m.type === 'list';
    const rounds = parts(m.lines);
    let r = 0, mistakes = 0;
    function round() {
      const [a, b] = rounds[r];
      const want = m.lines.slice(a, b);
      let next = 0, missHere = 0;
      const pool = shuffle(want.map((t, i) => ({ t, i })));
      if (pool.length > 1 && pool.every((x, k) => x.i === k)) pool.push(pool.shift());     // que nunca salga ya ordenado
      const built = h(list ? 'ol' : 'div', { class: `mm-built${list ? ' mm-built--list' : ''}`, start: list ? String(a + 1) : null });
      const status = h('p', { class: 'mm-status', role: 'status', 'aria-live': 'polite' }, list ? '¿Cuál va primero?' : '¿Cómo empieza?');
      const btns = pool.map(x => h('button', { type: 'button', class: 'mm-piece', onclick: e => tap(x, e.currentTarget) }, x.t));
      function tap(x, btn) {
        if (btn.disabled || next >= want.length) return;
        if (x.t === want[next]) {
          sfx('good');
          btn.disabled = true; btn.classList.add('is-used');
          built.append(h(list ? 'li' : 'p', { class: 'mm-built__line' }, x.t));
          next++; missHere = 0;
          btns.forEach(y => y.classList.remove('is-hint'));
          if (next >= want.length) {
            status.textContent = r + 1 < rounds.length ? '¡Muy bien! Sigamos con la otra parte.' : '¡Muy bien!';
            life.later(() => { r++; if (r < rounds.length) round(); else finish(); }, 900);
          } else status.textContent = '¡Bien! ¿Y después?';
        } else {
          sfx('wrong');
          mistakes++; missHere++;
          btn.classList.remove('is-shake'); void btn.offsetWidth; btn.classList.add('is-shake');
          if (missHere >= 2) {
            btns.find(y => !y.disabled && y.textContent === want[next])?.classList.add('is-hint');
            status.textContent = 'Mira el que brilla: ese va ahora.';
          } else status.textContent = 'Ese va más adelante. Prueba con otro.';
        }
      }
      sh.fill(h('div', { class: 'mm-game' },
        h('p', { class: 'eyebrow' }, rounds.length > 1 ? `${retoLabel(m, 'orden')} · parte ${r + 1} de ${rounds.length}` : retoLabel(m, 'orden')),
        h('h2', null, list ? 'Tócalos en orden, del primero al último' : 'Toca los renglones en orden'),
        a > 0 ? h('p', { class: 'mm-prev' }, h('span', { class: 'mm-prev__k' }, 'Viene después de:'), m.lines[a - 1]) : null,
        built,
        h('div', { class: 'mm-pool' }, btns),
        status));
    }
    // Unos tropiezos están bien: es para aprender.
    const finish = () => endReto(m, 'orden', mistakes <= Math.max(2, Math.ceil(m.lines.length / 4)), mistakes);
    round();
  }

  // ───────── Reto 2 (oraciones): ¿qué palabra falta? ─────────
  function blanks(m) {
    const lines = m.lines;
    const cand = lines.map(l => l.split(/\s+/).map((w, k) => ({ w, k })).filter(x => candidate(x.w)));
    const usable = lines.map((_, i) => i).filter(i => cand[i].length);
    const n = Math.min(BLANKS, usable.length);
    const pick = [];
    for (let j = 0; j < n; j++) pick.push(usable[Math.floor(((j + Math.random() * 0.999) * usable.length) / n)]);   // una por cada tramo
    const words = [...new Set(lines.flatMap(l => l.split(/\s+/)).filter(candidate).map(bare))];
    const extra = ['Señor', 'cielo', 'corazón', 'gracia', 'amor', 'tierra', 'santo'];
    return [...new Set(pick)].map(i => {
      const c = cand[i][Math.floor(Math.random() * cand[i].length)];
      const right = bare(c.w);
      const same = w => w.toLowerCase() === right.toLowerCase();
      const others = shuffle(words.filter(w => !same(w))).slice(0, 2);
      for (const w of extra) if (others.length < 2 && !same(w) && !others.some(o => o.toLowerCase() === w.toLowerCase())) others.push(w);
      // Al empezar el renglón la respuesta va con mayúscula: las otras también, para no dar pistas.
      const cap = w => (c.k === 0 && /^\p{Lu}/u.test(right) ? w[0].toUpperCase() + w.slice(1) : w);
      return { line: i, k: c.k, right, options: shuffle([right, ...others.map(cap)]) };
    });
  }
  function playBlanks(m) {
    view = 'game'; tts.stop();
    const qs = blanks(m);
    let i = 0, mistakes = 0;
    function ask() {
      const q = qs[i];
      const words = m.lines[q.line].split(/\s+/);
      const w = words[q.k];
      const pre = (w.match(/^[^\p{L}\p{N}]*/u) || [''])[0], post = (w.match(/[^\p{L}\p{N}]*$/u) || [''])[0];
      const blank = h('span', { class: 'mm-blank' }, '______');
      const status = h('p', { class: 'mm-status', role: 'status', 'aria-live': 'polite' });
      const opts = q.options.map((o, k) => h('button', { type: 'button', class: 'ct-opt mm-opt', onclick: e => choose(o, e.currentTarget) },
        h('span', { class: 'ct-opt__k', 'aria-hidden': 'true' }, 'ABC'[k]), h('span', { class: 'ct-opt__t' }, o)));
      function choose(o, btn) {
        if (btn.disabled) return;
        if (o.toLowerCase() === q.right.toLowerCase()) {
          sfx('good');
          blank.textContent = q.right; blank.classList.add('is-ok');
          opts.forEach(x => { x.disabled = true; });
          btn.classList.add('is-right');
          status.textContent = '¡Eso es!';
          life.later(() => { i++; if (i < qs.length) ask(); else finish(); }, 1000);
        } else {
          sfx('wrong');
          mistakes++;
          btn.disabled = true; btn.classList.add('is-wrong');
          status.textContent = 'Casi. Prueba con otra.';
        }
      }
      sh.fill(h('div', { class: 'mm-game' },
        h('p', { class: 'eyebrow' }, `¿Qué palabra falta? · ${i + 1} de ${qs.length}`),
        h('h2', null, 'Completa el renglón'),
        q.line > 0 ? h('p', { class: 'mm-prev' }, m.lines[q.line - 1]) : null,
        h('p', { class: 'mm-line' }, `${words.slice(0, q.k).join(' ')}${q.k ? ' ' : ''}${pre}`, blank, `${post}${q.k < words.length - 1 ? ` ${words.slice(q.k + 1).join(' ')}` : ''}`),
        h('div', { class: 'ct-opts mm-opts' }, opts),
        status));
    }
    const finish = () => endReto(m, 'falta', mistakes <= 1, mistakes);
    ask();
  }

  // ───────── Reto 2 (listas): ¿cuál va en su lugar? ─────────
  function playPlace(m) {
    view = 'game'; tts.stop();
    const noun = NOUN[m.id] || 'de la lista';
    const order = shuffle(m.lines.map((_, k) => k)).slice(0, Math.min(5, m.lines.length));
    let i = 0, mistakes = 0;
    function ask() {
      const pos = order[i];
      const right = m.lines[pos];
      const options = shuffle([right, ...shuffle(m.lines.filter((_, k) => k !== pos)).slice(0, 2)]);
      const status = h('p', { class: 'mm-status', role: 'status', 'aria-live': 'polite' });
      const question = NOUN[m.id] ? `¿Cuál es el ${ORD[pos] || `número ${pos + 1}`} ${noun}?` : `¿Cuál va en el lugar ${pos + 1}?`;
      const opts = options.map((o, k) => h('button', { type: 'button', class: 'ct-opt mm-opt', onclick: e => choose(o, e.currentTarget) },
        h('span', { class: 'ct-opt__k', 'aria-hidden': 'true' }, 'ABC'[k]), h('span', { class: 'ct-opt__t' }, o)));
      function choose(o, btn) {
        if (btn.disabled) return;
        if (o === right) {
          sfx('good');
          opts.forEach(x => { x.disabled = true; });
          btn.classList.add('is-right');
          status.textContent = `¡Eso es! ${pos + 1}. ${right}`;
          life.later(() => { i++; if (i < order.length) ask(); else finish(); }, 1100);
        } else {
          sfx('wrong');
          mistakes++;
          btn.disabled = true; btn.classList.add('is-wrong');
          status.textContent = 'Casi. Prueba con otro.';
        }
      }
      sh.fill(h('div', { class: 'mm-game' },
        h('p', { class: 'eyebrow' }, `¿Cuál va en su lugar? · ${i + 1} de ${order.length}`),
        h('div', { class: 'mm-place', 'aria-hidden': 'true' }, String(pos + 1)),
        h('h2', null, question),
        speakBtn(() => [question, ...options], { compact: true, label: 'Escuchar la pregunta' }),
        h('div', { class: 'ct-opts mm-opts' }, opts),
        status));
    }
    const finish = () => endReto(m, 'falta', mistakes <= 1, mistakes);
    ask();
  }

  // ───────── Al terminar un reto ─────────
  function endReto(m, kind, ok, mistakes) {
    tts.stop();
    view = 'game';
    const other = kind === 'orden' ? 'falta' : 'orden';
    if (ok) { state.setFlag(`memo:${m.id}:${kind}`, true); state.dailyOnce('learn'); state.logActivity(1); }
    let gains = [], won = false;
    if (ok && passed(m.id, other) && !stamp(m.id)) {
      state.setMemorized(m.id, 'nino');
      won = true;
      gains = grant(PRIZE);
      if (items.every(x => stamp(x.id)) && !state.flag('memo:all')) {
        state.setFlag('memo:all', true);
        gains = [...gains, ...grant(ALL_PRIZE)];
        toast('¡Completaste tu pasaporte de oraciones!', { icon: '🎫' });
      }
      sfx('win');
      celebrate(sh.page, [m.emoji, '⭐', '✨', '🎫']);
    } else sfx(ok ? 'sparkle' : 'tap');
    const msg = won ? 'Ahora recítasela sin mirar a un grande para ganar también el sello verde.'
      : ok ? (passed(m.id, other) ? '¡Qué bien lo sabes!' : 'Te falta el otro reto para ganar el sello.')
        : `Tuviste ${mistakes} ${mistakes === 1 ? 'tropiezo' : 'tropiezos'}. Léela otra vez con calma y vuelve a intentarlo: ¡así se aprende!`;
    sh.fill(
      h('div', { class: 'ct-intro ro-end' },
        h('div', { class: 'ro-end__icon', 'aria-hidden': 'true' }, won ? '🎫' : ok ? '🌟' : '💪'),
        h('h2', null, won ? `¡Ganaste el sello de «${m.title}»!` : ok ? '¡Reto superado!' : '¡Casi lo logras!'),
        h('p', null, msg),
        rewardRow(gains)),
      h('div', { class: 'ro-btns' },
        !ok ? button('Intentar otra vez', { kind: 'sun', icon: '🔄', onClick: () => play(m, kind) }) : null,
        ok && !passed(m.id, other) ? button(retoLabel(m, other), { kind: 'sun', icon: '▶️', onClick: () => play(m, other) }) : null,
        button(won || (ok && passed(m.id, other)) ? 'Ver mi pasaporte' : 'Volver a leerla', { kind: 'ghost', small: true, icon: won ? '🎫' : '📖',
          onClick: () => (won || (ok && passed(m.id, other)) ? index() : open(m)) })));
  }

  const first = params.id ? items.find(m => m.id === params.id) : null;
  if (first) open(first); else index();
  return {
    back() { if (view === 'game' || (view === 'item' && seenIndex)) { goBack(); return true; } return false; },
    unmount() { life.end(); sh.root.remove(); },
  };
}
