// La Misa paso a paso: línea de tiempo · práctica «¿Qué respondemos?» · Cómo comulgar · Preguntas.
//   go('misa')
import * as state from '../core/state.js';
import * as tts from '../core/tts.js';
import { h, clear, button, toast } from '../core/ui.js';
import { sfx } from '../core/audio.js';
import { go, back } from '../core/router.js';
import * as R from '../core/reminders.js';
import { arr, txt, deco, smooth, shuffle, loadData, lifecycle, shell, tabBar, soon, quiz, speakBtn, rewardRow, grant, celebrate } from './catequesis.js';

const TABS = [
  { id: 'pasos', label: 'Paso a paso', icon: '📜' },
  { id: 'practica', label: 'Practicar', icon: '🗣️' },
  { id: 'comulgar', label: 'Comulgar', icon: '🍞' },
  { id: 'preguntas', label: 'Preguntas', icon: '🎯' },
  { id: 'pasaporte', label: 'Pasaporte', icon: '🎫' },
];
// Partes de la Misa que tienen su oración completa en «Mis oraciones» (y el Credo, también frase por frase).
const PART_PRAYERS = {
  perdon: [['yo-confieso', 'El Yo confieso']],
  gloria: [['gloria-a-dios', 'Rezar el Gloria']],
  credo: [['credo-niceno', 'El Credo largo'], ['credo', 'El Credo de los Apóstoles'], ['@credo', 'Entenderlo frase por frase']],
  santo: [['santo', 'Rezar el Santo']],
  'padre-nuestro': [['padre-nuestro', 'Rezar el Padre Nuestro']],
  'cordero-de-dios': [['cordero-de-dios', 'Rezar el Cordero de Dios']],
  'dichosos-los-invitados': [['senor-no-soy-digno', 'Señor, no soy digno']],
  'accion-de-gracias': [['alma-de-cristo', 'Alma de Cristo']],
};
const MASS_COLORS = { morado: '#6b3fa0', blanco: '#f4efe2', verde: '#3f8f4e', rojo: '#c0392b', rosado: '#e48fb3' };
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const GROUPS = [
  { key: 'inicio', short: 'Inicio', title: 'Ritos iniciales', sub: 'Nos reunimos y pedimos perdón', icon: '🔔', c: '#4aa3e0', bg: '#e3f3ff' },
  { key: 'palabra', short: 'Palabra', title: 'Liturgia de la Palabra', sub: 'Dios nos habla', icon: '📖', c: '#3f9a52', bg: '#e4f6e2' },
  { key: 'eucaristia', short: 'Eucaristía', title: 'Liturgia eucarística', sub: 'El pan y el vino se hacen Jesús', icon: '🍞', c: '#d08a12', bg: '#fff1c9' },
  { key: 'comunion', short: 'Comunión', title: 'Comunión', sub: 'Recibimos a Jesús', icon: '✨', c: '#7556c9', bg: '#f1e9ff' },
  { key: 'despedida', short: 'Despedida', title: 'Despedida', sub: 'Vamos a compartir lo recibido', icon: '👋', c: '#e2643a', bg: '#ffe9df' },
];
const POSTURE = {
  'de pie': { icon: '🧍', label: 'De pie' },
  sentados: { icon: '🪑', label: 'Sentados' },
  'de rodillas': { icon: '🙇', label: 'De rodillas' },
};
const PRACTICE_SIZE = 10;
const PRIZE_PRACTICE = { coins: 10, fe: 5 };
const PRIZE_QUIZ = { coins: 10, fe: 5 };

const norm = s => txt(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]+/g, ' ').replace(/\s+/g, ' ').trim();
// Respuestas muy largas (Yo confieso, Padre nuestro…) se acortan en los botones; completas en la explicación.
function short(s, max = 110) {
  s = txt(s);
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 60)).replace(/[,;:.]+$/, '')}…`;
}

export async function mount(el, params = {}) {
  const life = lifecycle();
  const sh = shell(el, { title: 'La Misa', onBack: () => back(), cls: 'ms' });
  const M = await loadData('mass');
  if (!M) {
    sh.fill(soon('Muy pronto', 'La Misa paso a paso se está preparando con mucho cariño.', '⛪'));
    return { unmount() { life.end(); sh.root.remove(); } };
  }
  const parts = arr(M.parts).filter(p => p && p.id);
  const groupOf = p => GROUPS.find(g => g.key === p.group) || GROUPS[0];
  let tab = null;

  const tabs = tabBar(TABS, id => pick(id), 'Partes de la guía de la Misa');
  sh.root.insertBefore(tabs, sh.page);

  function pick(id) {
    if (tab === id) { sh.scroll.scrollTo({ top: 0, behavior: smooth() }); return; }
    sfx('page');
    show(id);
  }
  function show(id) {
    tts.stop();
    tab = id;
    params.tab = id;
    tabs.select(id);
    sh.scroll.setAttribute('role', 'tabpanel');
    sh.scroll.setAttribute('aria-labelledby', `ct-tab-${id}`);
    sh.fill({ pasos: viewPasos, practica: viewPractica, comulgar: viewComulgar, preguntas: viewPreguntas, pasaporte: viewPasaporte }[id]());
  }
  const goTab = (id, label, icon = '▶️') => button(label, { kind: 'sun', block: true, icon, sound: 'pop', onClick: () => { show(id); tabs.button(id)?.focus({ preventScroll: true }); } });

  // Quién dice la frase: en las lecturas y la oración de los fieles, el lector; en lo demás, el sacerdote.
  const LECTOR = new Set(['primera-lectura', 'segunda-lectura', 'salmo', 'oracion-de-los-fieles']);
  const who = part => (LECTOR.has(part?.id) ? 'El lector dice' : 'El sacerdote dice');

  // ── Paso a paso: línea de tiempo vertical ──
  function viewPasos() {
    let n = 0;
    const partEl = p => {
      n++;
      const pos = POSTURE[p.posture] || null;
      const dialogues = arr(p.dialogues).filter(d => d && (d.priest || d.people));
      const readAll = () => [txt(p.title), txt(p.text), ...dialogues.flatMap(d => [`${who(p)}: ${txt(d.priest)}`, `Todos respondemos: ${txt(d.people)}`]), p.tip ? `Un consejo: ${txt(p.tip)}` : ''];
      return h('li', { class: 'ms-part', id: `ms-${p.id}` },
        h('span', { class: 'ms-part__dot', 'aria-hidden': 'true' }, txt(p.emoji) || '⛪'),
        h('article', { class: 'ms-part__card' },
          h('div', { class: 'ms-part__head' },
            h('div', { class: 'ms-part__names' },
              h('span', { class: 'ms-part__n' }, `Momento ${n}`),
              h('h3', null, txt(p.title))),
            speakBtn(readAll, { compact: true, label: `Escuchar: ${txt(p.title)}` })),
          pos ? h('span', { class: `ms-posture ms-posture--${p.posture.replace(/\s+/g, '-')}` }, deco(pos.icon), pos.label) : null,
          h('p', { class: 'ms-part__text' }, txt(p.text)),
          dialogues.length ? h('div', { class: 'ms-dialogues' }, dialogues.map(d => h('div', { class: 'ms-dlg' },
            d.priest ? h('div', { class: 'ms-dlg__priest' }, h('span', { class: 'ms-dlg__who' }, deco(LECTOR.has(p.id) ? '📖' : '🧔'), who(p)), h('p', null, `«${txt(d.priest)}»`)) : null,
            d.people ? h('div', { class: 'ms-dlg__people' }, h('span', { class: 'ms-dlg__who' }, deco('🙋'), 'Todos respondemos'), h('p', null, `«${txt(d.people)}»`)) : null))) : null,
          p.tip ? h('p', { class: 'ms-tip' }, deco('💡'), txt(p.tip)) : null,
          PART_PRAYERS[p.id] ? h('div', { class: 'ms-pray' }, PART_PRAYERS[p.id].map(([id, label]) => button(label, { kind: 'ghost', small: true, icon: id === '@credo' ? '✝️' : '🙏',
            onClick: () => (id === '@credo' ? go('credo') : go('bible', { prayer: id })) }))) : null,
          p.id === 'cordero-de-dios' && R.customs().posture ? h('p', { class: 'ms-tip ms-tip--parish' }, deco('⛪'),
            `En nuestra parroquia, al terminar el «Cordero de Dios», nos ponemos ${R.customs().posture === 'pie' ? 'de pie' : 'de rodillas'}.`) : null));
    };
    const used = GROUPS.map(g => ({ g, items: parts.filter(p => groupOf(p) === g) })).filter(x => x.items.length);
    const jump = h('nav', { class: 'ms-jump', 'aria-label': 'Ir a una parte de la Misa' }, used.map(({ g }) => {
      const b = h('button', { type: 'button', class: 'ms-jump__btn', onclick: () => { sfx('tap'); document.getElementById(`ms-g-${g.key}`)?.scrollIntoView({ behavior: smooth(), block: 'start' }); } },
        h('span', { class: 'ms-jump__icon', 'aria-hidden': 'true' }, g.icon), h('span', { class: 'ms-jump__label' }, g.short));
      b.setAttribute('aria-label', `Ir a: ${g.title}`);
      b.style.setProperty('--gc', g.c);
      b.style.setProperty('--gb', g.bg);
      return b;
    }));
    return [
      h('div', { class: 'ct-intro' },
        h('h2', null, 'La fiesta de la familia de Dios'),
        M.intro ? h('p', null, txt(M.intro)) : null),
      h('div', { class: 'ms-legend', 'aria-label': 'Posturas' }, Object.values(POSTURE).map(p => h('span', null, deco(p.icon), p.label))),
      jump,
      used.map(({ g, items }) => {
        const sec = h('section', { class: 'ms-group', id: `ms-g-${g.key}`, 'aria-label': g.title },
          h('header', { class: 'ms-group__head' },
            h('span', { class: 'ms-group__icon', 'aria-hidden': 'true' }, g.icon),
            h('div', null, h('h2', null, g.title), h('p', null, g.sub))),
          h('ol', { class: 'ms-line' }, items.map(partEl)));
        sec.style.setProperty('--gc', g.c);
        sec.style.setProperty('--gb', g.bg);
        return sec;
      }),
      goTab('practica', '¿Practicamos las respuestas?', '🗣️'),
    ];
  }

  // ── Práctica «¿Qué respondemos?» ──
  function practiceItems() {
    const all = [];
    parts.forEach((p, pi) => arr(p.dialogues).forEach(d => {
      if (txt(d.priest).trim() && txt(d.people).trim()) all.push({ part: p, pi, priest: txt(d.priest), people: txt(d.people) });
    }));
    // Sin repetir la misma frase del sacerdote.
    const seen = new Set();
    return all.filter(it => { const k = norm(it.priest); if (seen.has(k)) return false; seen.add(k); return true; });
  }
  function distractors(item, pool) {
    const right = norm(item.people);
    const cand = [];
    const seen = new Set([right]);
    for (const it of pool) {
      const k = norm(it.people);
      if (seen.has(k) || it.part === item.part) continue;
      seen.add(k);
      cand.push(it.people);
    }
    const len = item.people.length;
    const near = cand.sort((a, b) => Math.abs(a.length - len) - Math.abs(b.length - len)).slice(0, 6);
    return shuffle(near).slice(0, 2);
  }

  function viewPractica() {
    const pool = practiceItems();
    if (pool.length < 3) return [soon('Muy pronto', 'La práctica de las respuestas está por llegar.', '🗣️')];
    const box = h('section', { class: 'ms-prac', 'aria-label': '¿Qué respondemos?' });

    function intro() {
      const won = state.quizDone('misa:practica');
      clear(box).append(
        h('div', { class: 'ms-prac__hero' },
          h('span', { class: 'ms-prac__icon', 'aria-hidden': 'true' }, '🗣️'),
          h('h2', null, '¿Qué respondemos?'),
          h('p', null, 'El sacerdote (o el lector) dice una frase y tú eliges qué respondemos todos. ¡Así participas en la Misa!')),
        won ? h('p', { class: 'ms-prac__won' }, deco('⭐'), '¡Ya ganaste el premio de la práctica! Puedes repetir cuando quieras.')
          : h('p', { class: 'ms-prac__goal' }, deco('🎁'), `Complétala sin errores y gana +${PRIZE_PRACTICE.coins} ${state.COIN.name} y +${PRIZE_PRACTICE.fe} de Fe.`),
        button('¡Empezar!', { kind: 'sun', block: true, icon: '▶️', sound: 'pop', onClick: play }));
    }

    function play() {
      const round = (pool.length <= PRACTICE_SIZE ? pool.slice() : shuffle(pool).slice(0, PRACTICE_SIZE)).sort((a, b) => a.pi - b.pi);
      let i = 0;
      const marks = [];
      function ask() {
        tts.stop();
        const it = round[i];
        const g = groupOf(it.part);
        const options = shuffle([it.people, ...distractors(it, pool)]);
        const right = options.indexOf(it.people);
        const stars = h('div', { class: 'ms-prac__stars', 'aria-label': `${marks.filter(Boolean).length} estrellas` },
          round.map((_, k) => h('span', { class: k < marks.length ? (marks[k] ? 'is-on' : 'is-miss') : k === i ? 'is-now' : '', 'aria-hidden': 'true' }, k < marks.length && !marks[k] ? '•' : '⭐')));
        const btns = options.map((o, k) => h('button', { type: 'button', class: 'ct-opt ms-opt', onclick: () => answer(k) },
          h('span', { class: 'ct-opt__k', 'aria-hidden': 'true' }, 'ABC'[k]),
          h('span', { class: 'ct-opt__t' }, short(o))));
        const fb = h('div', { class: 'ct-fb', role: 'status', 'aria-live': 'polite', hidden: true });
        const priest = h('div', { class: 'ms-say' },
          h('span', { class: 'ms-say__face', 'aria-hidden': 'true' }, '🧔'),
          h('div', { class: 'ms-say__box' },
            h('span', { class: 'ms-say__who' }, who(it.part)),
            h('p', null, `«${it.priest}»`)),
          speakBtn(() => it.priest, { compact: true, label: 'Escuchar al sacerdote' }));
        const eyebrow = h('p', { class: 'ms-prac__where' }, deco(g.icon), `${g.title} · ${txt(it.part.title)}`);
        eyebrow.style.setProperty('--gc', g.c);
        clear(box).append(
          h('div', { class: 'ms-prac__top' }, h('span', { class: 'ms-prac__n' }, `${i + 1} de ${round.length}`), stars),
          eyebrow, priest,
          h('p', { class: 'ms-prac__ask' }, deco('🙋'), '¿Qué respondemos todos?'),
          h('div', { class: 'ct-opts' }, btns), fb);
        function answer(k) {
          const ok = k === right;
          marks.push(ok);
          sfx(ok ? 'good' : 'wrong');
          btns.forEach((b, n) => {
            b.disabled = true;
            if (n === right) { b.classList.add('is-right'); b.firstChild.textContent = '✓'; }
            else if (n === k) { b.classList.add('is-wrong'); b.firstChild.textContent = '✕'; }
          });
          const starEl = stars.children[i];
          starEl.className = ok ? 'is-on is-pop' : 'is-miss';
          starEl.textContent = ok ? '⭐' : '•';
          const last = i === round.length - 1;
          const nextBtn = button(last ? 'Ver mi resultado' : 'Siguiente', { kind: last ? 'sun' : 'sky', small: true, icon: last ? '🏁' : '▶️',
            onClick: () => { if (last) result(); else { i++; ask(); box.scrollIntoView({ behavior: smooth(), block: 'start' }); } } });
          fb.classList.add(ok ? 'is-ok' : 'is-no');
          fb.append(
            h('p', { class: 'ct-fb__title' }, deco(ok ? '🌟' : '💡'), ok ? '¡Así se responde!' : 'Todos respondemos:'),
            h('p', { class: 'ct-fb__text ms-fb__answer' }, `«${it.people}»`),
            h('div', { class: 'ms-fb__row' }, speakBtn(() => it.people, { compact: true, label: 'Escuchar la respuesta' }), nextBtn));
          fb.hidden = false;
          nextBtn.focus({ preventScroll: true });
          fb.scrollIntoView({ behavior: smooth(), block: 'nearest' });
        }
      }
      function result() {
        tts.stop();
        const hits = marks.filter(Boolean).length;
        const perfect = hits === round.length;
        let gains = [];
        if (perfect && state.markQuiz('misa:practica')) { gains = grant(PRIZE_PRACTICE); sfx('win'); celebrate(sh.page, ['⭐', '✨', '🙌', '🌟']); }
        else sfx(perfect ? 'sticker' : 'sparkle');
        clear(box).append(h('div', { class: 'ct-result' },
          h('div', { class: 'ct-stars ms-result__stars', role: 'img', 'aria-label': `${hits} de ${round.length} respuestas correctas` },
            marks.map(ok => h('span', { class: ok ? '' : 'is-off', 'aria-hidden': 'true' }, '⭐'))),
          h('p', { class: 'ct-result__msg', role: 'status' }, perfect ? '¡Sin errores! Ya sabes responder en la Misa.'
            : hits >= Math.ceil(round.length * 0.7) ? `¡Muy bien! Acertaste ${hits} de ${round.length}.`
              : `¡Buen intento! Acertaste ${hits} de ${round.length}. Mira la Misa paso a paso y vuelve a practicar.`),
          rewardRow(gains),
          !perfect && !state.quizDone('misa:practica') ? h('p', { class: 'ct-result__hint' }, deco('🎁'), 'Complétala sin errores para ganar el premio.') : null,
          button('Practicar otra vez', { kind: 'sun', small: true, icon: '🔄', onClick: play }),
          button('Ver la Misa paso a paso', { kind: 'ghost', small: true, icon: '📜', onClick: () => show('pasos') })));
        box.scrollIntoView({ behavior: smooth(), block: 'start' });
      }
      ask();
    }
    intro();
    return [box];
  }

  // ── Cómo comulgar ──
  function viewComulgar() {
    const com = M.communion || {};
    const stepsList = arr(com.steps).filter(s => s && txt(s.text));
    if (!stepsList.length) return [soon('Muy pronto', 'Los pasos para comulgar están por llegar.', '🍞')];
    const title = txt(com.title) || 'Cómo comulgar';
    return [
      h('div', { class: 'ms-com__hero' },
        h('span', { class: 'ms-com__host', 'aria-hidden': 'true' }, '✨'),
        h('h2', null, title),
        h('p', null, 'Jesús viene a tu corazón. Hazlo con calma, con respeto y con mucha alegría.')),
      h('div', { class: 'ct-tools' }, speakBtn(() => [title, ...stepsList.map((s, k) => `Paso ${k + 1}. ${txt(s.text)}`)])),
      R.customs().communion ? h('p', { class: 'ms-tip ms-tip--parish' }, deco('⛪'), {
        boca: 'En nuestra parroquia los niños comulgan en la boca.',
        mano: 'En nuestra parroquia los niños comulgan en la mano.',
        ambas: 'En nuestra parroquia se puede comulgar en la boca o en la mano. Tu catequista te dirá cómo.' }[R.customs().communion]) : null,
      h('ol', { class: 'ms-com' }, stepsList.map((s, k) => {
        // Las dos formas de comulgar: se destaca la que usa la parroquia (si la eligió la catequista).
        const way = s.emoji === '👄' ? 'boca' : s.emoji === '🙌' ? 'mano' : '';
        const cw = R.customs().communion;
        const mark = way && (cw === 'boca' || cw === 'mano') ? (cw === way ? ' is-parish' : ' is-other') : '';
        return h('li', { class: `ms-com__step${mark}` },
          h('span', { class: 'ms-com__art', 'aria-hidden': 'true' }, h('span', { class: 'ms-com__emoji' }, txt(s.emoji) || '🙏'), h('span', { class: 'ms-com__n' }, String(k + 1))),
          h('p', null, txt(s.text), mark === ' is-parish' ? h('span', { class: 'ms-com__badge' }, 'Así lo hacemos aquí') : null));
      })),
      goTab('preguntas', 'Responder las preguntas', '🎯'),
    ];
  }

  // ── Preguntas ──
  function viewPreguntas() {
    const q = quiz(M.quiz, { key: 'misa:quiz', prize: PRIZE_QUIZ, perfectOnly: true, title: 'Preguntas de la Misa', fx: sh.page });
    return [
      h('div', { class: 'ct-intro' },
        h('h2', null, '¿Qué aprendiste?'),
        h('p', null, state.quizDone('misa:quiz') ? 'Ya ganaste el premio. ¡Repasa cuando quieras!' : 'Responde todo bien y gana un premio.')),
      q || soon('Muy pronto', 'Las preguntas están por llegar.', '🎯'),
    ];
  }

  // ── Mi pasaporte de la Misa del domingo ──
  function viewPasaporte() {
    const log = state.massLog();
    const keys = Object.keys(log).sort();
    const today = new Date();
    // Casillas: los domingos desde el primer sello (o desde hace 6 semanas) hasta la Primera Comunión (o 6 semanas más).
    const sun = d => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - x.getDay()); return x; };
    const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    let start = sun(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 42));
    if (keys.length) { const [y, m, d] = keys[0].split('-').map(Number); const f = new Date(y, m - 1, d); if (f < start) start = sun(f); }
    const ev = R.nextEvent('comunion');
    let end = sun(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 42));
    if (ev && ev.start > end) end = sun(ev.start);
    const cells = [];
    for (let d = new Date(start); d <= end && cells.length < 60; d.setDate(d.getDate() + 7)) cells.push(new Date(d));
    const n = keys.length;
    const nextPrize = 4 - (n % 4);
    const key = state.massKey();
    return [
      h('div', { class: 'ct-intro' }, h('h2', null, 'Mi pasaporte de la Misa'),
        h('p', null, 'Cada domingo que vas a Misa, tu palomita pone un sello. La Misa de la tarde del sábado también cuenta.')),
      h('div', { class: 'mp-sum' }, h('span', { class: 'chip' }, `⛪ ${n} ${n === 1 ? 'Misa' : 'Misas'}`),
        h('span', { class: 'chip' }, `🎁 Faltan ${nextPrize} para el próximo premio`),
        ev ? h('span', { class: 'chip' }, `🕊️ Primera Comunión: ${R.fmtDate(ev.start)}`) : null),
      h('div', { class: 'mp-grid' }, cells.map(d => {
        const k = iso(d), v = log[k], future = d > today, isCom = ev && iso(ev.start) === k;
        const c = h('div', { class: `mp-cell${v ? ' is-on' : ''}${future ? ' is-future' : ''}${isCom ? ' is-com' : ''}`, title: k },
          h('span', { class: 'mp-cell__d' }, `${d.getDate()} ${MONTHS[d.getMonth()]}`),
          h('span', { class: 'mp-cell__s', 'aria-hidden': 'true' }, v ? '⛪' : isCom ? '🕊️' : ''),
          v?.ok ? h('span', { class: 'mp-cell__ok', 'aria-label': 'Confirmado por un grande' }, '✔') : null);
        if (v?.color && MASS_COLORS[v.color]) c.style.setProperty('--mc', MASS_COLORS[v.color]);
        c.setAttribute('aria-label', `Domingo ${d.getDate()} de ${MONTHS[d.getMonth()]}: ${v ? 'fui a Misa' : future ? 'todavía no llega' : 'sin sello'}`);
        return c;
      })),
      key && !state.massStamped(key) ? button('¡Hoy fui a Misa!', { kind: 'leaf', block: true, icon: '⛪', onClick: () => {
        state.logMass(key, {});
        sfx('sticker');
        const total = Object.keys(state.massLog()).length;
        if (total % 4 === 0 && !state.owns('collar-cruz')) { state.own('collar-cruz'); toast('¡Premio! Crucecita de madera para tu palomita', { icon: '✝️', ms: 3200 }); }
        else toast('¡Sello en tu pasaporte!', { icon: '⛪' });
        show('pasaporte');
      } }) : null,
      h('p', { class: 'pq-small' }, '✔ = un grande lo confirmó en «Para grandes». Puedes mostrarle tu pasaporte a tu catequista.'),
    ];
  }

  show(TABS.some(t => t.id === params.tab) ? params.tab : 'pasos');

  return { unmount() { life.end(); sh.root.remove(); } };
}
