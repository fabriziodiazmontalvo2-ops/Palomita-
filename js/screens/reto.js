// Reto de fe: cuestionario dinámico con preguntas de TODOS los bancos de la app (trivia, lecciones, catecismo,
// historias, milagros, parábolas, Confesión y Misa). Rondas de 10, sin repetir, opciones barajadas, reloj generoso,
// rachas ×2 / ×3, comodín 50:50 y premio según aciertos. Sin sopas de letras ni crucigramas.
//   go('reto')
import * as state from '../core/state.js';
import * as Rv from '../core/review.js';
import * as tts from '../core/tts.js';
import { h, clear, button, confirmDialog } from '../core/ui.js';
import { sfx } from '../core/audio.js';
import { back } from '../core/router.js';
import { arr, txt, deco, smooth, shuffle, loadData, lifecycle, shell, soon, speakBtn, rewardRow, grant, celebrate } from './catequesis.js';

export const TOPICS = [
  { id: 'todo', name: 'Todo', icon: '🌈' },
  { id: 'at', name: 'Antiguo Testamento', icon: '📜' },
  { id: 'jesus', name: 'Vida de Jesús', icon: '✝️' },
  { id: 'parabolas', name: 'Parábolas', icon: '🌾' },
  { id: 'sacramentos', name: 'Sacramentos', icon: '💧' },
  { id: 'misa', name: 'La Misa', icon: '⛪' },
  { id: 'oraciones', name: 'Oraciones', icon: '🙏' },
  { id: 'maria', name: 'María y los santos', icon: '💙' },
  { id: 'confesion', name: 'Confesión', icon: '🤗' },
  { id: 'camino', name: 'Mi camino', icon: '👣' },
];
const LEVELS = [
  { id: 'facil', name: 'Fácil', icon: '🐣', sub: 'Sin reloj', time: 0, trivia: [1] },
  { id: 'normal', name: 'Normal', icon: '🕊️', sub: '25 segundos', time: 25, trivia: [1, 2] },
  { id: 'experto', name: 'Experto', icon: '🦁', sub: '25 s · más difícil', time: 25, trivia: [2, 3] },
];
const ROUND = 10;
const FULL_ROUNDS = 5;              // rondas de cada día con el premio completo (después, un premio pequeño)
const MIN_POOL = 4;
const recent = [];                 // preguntas de las últimas rondas (en esta sesión) para no repetirlas pronto
const prefs = { topic: 'todo', level: 'normal' };

const norm = s => txt(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const valid = q => q && txt(q.q).trim() && arr(q.options).length >= 2 && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length;

// Temas de una lección o tema del catecismo según su id y su título (palabras clave precisas: «Espíritu Santo» o
// «Semana Santa» no son «María y los santos», y una lección de María no es de «Oraciones» solo por estar en la unidad Rezo).
function tagsFromWords(raw) {
  const t = new Set();
  const all = norm(raw).replace(/[-_]+/g, ' ');
  if (/jesus|cristo|semana santa|pascua|resucit|resurrecci|\bcruz\b|ultima cena|milagro/.test(all)) t.add('jesus');
  if (/creacion|\bnoe\b|abraham|moises|\badan\b|\bdavid\b|antiguo testamento/.test(all)) t.add('at');
  const s = all.replace(/espiritu santo|semana santa|jueves santo|viernes santo|sabado santo|santa misa|santo evangelio|santa cena/g, ' ');
  if (/bautis|confirmaci|sacramento|uncion|matrimonio|orden sacerdotal|eucarist|comunion|ultima cena/.test(s)) t.add('sacramentos');
  if (/reconcili|confes|penitencia|perdon de los pecados|examen de conciencia/.test(s)) { t.add('confesion'); t.add('sacramentos'); }
  if (/\bmisa\b|eucarist|comunion|consagr|homil|ofertorio|altar|ultima cena/.test(s)) t.add('misa');
  if (/\bmaria\b|virgen|\bsant[oa]s?\b|\bsan [a-z]/.test(s)) t.add('maria');
  if (/oracion|\brez[aoe]|padre nuestro|ave maria|\bcredo\b|gloria al padre/.test(s)) t.add('oraciones');
  return t;
}
function triviaTags(topic) {
  const s = norm(topic);
  const t = new Set();
  if (s.includes('antiguo')) t.add('at');
  if (s.includes('jesus')) t.add('jesus');
  if (s.includes('parabola')) t.add('parabolas');
  if (s.includes('sacramento')) t.add('sacramentos');
  if (s.includes('misa') || s.includes('eucarist')) t.add('misa');
  if (s.includes('oracion')) t.add('oraciones');
  if (s.includes('maria') || s.includes('santo')) t.add('maria');
  if (s.includes('confes') || s.includes('reconcili')) t.add('confesion');
  if (s.includes('mandamiento') || s.includes('camino') || s.includes('catecismo')) t.add('camino');
  return t;
}

async function buildBank() {
  const [trivia, lessons, cat, at, nt, mi, parables, conf, mass, ars] = await Promise.all(
    ['trivia', 'lessons', 'catechism', 'at', 'nt', 'milagros', 'parables', 'confession', 'mass', 'ars'].map(loadData));
  const bank = [];
  const seen = new Set();
  const add = (q, tags, src, level = 0) => {
    if (!valid(q)) return;
    const k = norm(q.q).replace(/[^a-z0-9ñ]+/g, '');
    if (seen.has(k)) return;
    seen.add(k);
    bank.push({ q: txt(q.q), options: arr(q.options).map(txt), answer: q.answer, explain: txt(q.explain), tags: new Set(['todo', ...tags]), src, level, key: k });
  };
  for (const q of arr(trivia)) add(q, triviaTags(q.topic), 'trivia', Number(q.level) || 2);
  for (const l of arr(lessons)) {
    const base = new Set(['camino', ...tagsFromWords(`${txt(l.id)} ${txt(l.title)}`)]);
    for (const q of arr(l.quiz)) add(q, base, 'lesson');
  }
  for (const c of arr(cat)) {
    const base = new Set(['camino', ...tagsFromWords(`${txt(c.id)} ${txt(c.title)}`)]);
    for (const q of arr(c.quiz)) add(q, base, 'catechism');
  }
  for (const s of arr(at)) for (const q of arr(s.quiz)) add(q, ['at'], 'story');
  for (const s of arr(nt)) {
    const extra = /anunciaci|visitaci|maria/.test(norm(`${s.id} ${s.title}`)) ? ['maria'] : [];
    for (const q of arr(s.quiz)) add(q, ['jesus', ...extra], 'story');
  }
  for (const s of arr(mi)) for (const q of arr(s.quiz)) add(q, ['jesus'], 'story');
  for (const s of arr(ars)) for (const q of arr(s.quiz)) add(q, ['maria', 'confesion'], 'story');   // el Santo Cura de Ars
  for (const p of Object.values(parables || {})) {
    if (!p) continue;
    const tags = p.kind === 'historia' ? (p.id === 'noe' ? ['at'] : ['jesus']) : ['parabolas'];
    for (const q of arr(p.quiz)) add(q, tags, 'parable');
  }
  for (const q of arr(conf?.quiz)) add(q, ['confesion', 'sacramentos'], 'confession');
  for (const q of arr(mass?.quiz)) add(q, ['misa'], 'mass');
  return bank;
}

export async function mount(el, params = {}) {
  const life = lifecycle();
  const sh = shell(el, { title: 'Reto de fe', onBack: () => goBack(), cls: 'rt' });
  sh.fill(h('p', { class: 'ct-loading' }, 'Preparando las preguntas…'));
  const bank = await buildBank();
  if (life.dead) return { unmount() {} };
  let view = 'setup';
  let game = null;        // ronda en curso
  const foot = h('div', { class: 'rt-foot' });
  sh.root.append(foot);

  const best = id => Number(state.flag(`reto:best:${id}`)) || 0;
  const poolFor = (topic, level) => {
    const lv = LEVELS.find(l => l.id === level) || LEVELS[1];
    const inTopic = bank.filter(q => q.tags.has(topic));
    const filtered = inTopic.filter(q => q.src !== 'trivia' || lv.trivia.includes(q.level));
    return filtered.length >= ROUND ? filtered : inTopic;
  };

  async function goBack() {
    if (view === 'play' && game && !game.over) {
      game.pause();
      const ok = await confirmDialog('Si sales ahora, esta ronda no cuenta. ¿Quieres salir del reto?', { title: '¿Salir del reto?', icon: '🏆', yes: 'Sí, salir', no: 'Seguir jugando' });
      if (life.dead) return;
      if (!ok) { game.resume(); return; }
      endGame();
      setup();
      return;
    }
    if (view !== 'setup') { endGame(); setup(); return; }
    back();
  }
  life.on(window, 'keydown', e => {
    if (e.key !== 'Escape' || !sh.root.isConnected || document.querySelector('.modal-scrim, .game')) return;
    goBack();
  });
  // Si el niño sale de la app, el reloj se detiene.
  life.on(document, 'visibilitychange', () => { if (!game || game.over) return; if (document.hidden) game.pause(); else game.resume(); });

  function endGame() { if (game) { game.stop(); game = null; } tts.stop(); }

  // ── 1. Elegir tema y dificultad ──
  function setup() {
    view = 'setup';
    sh.setTitle('Reto de fe');
    sh.setChip(null);
    const topicBtns = [];
    const levelBtns = [];
    const startBtn = button('¡Empezar el reto!', { kind: 'sun', block: true, icon: '🏁', sound: 'pop', onClick: () => startRound() });
    function paint() {
      for (const b of topicBtns) { const on = b.dataset.topic === prefs.topic; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; }
      for (const b of levelBtns) { const on = b.dataset.level === prefs.level; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; }
      const n = Math.min(ROUND, poolFor(prefs.topic, prefs.level).length);
      startBtn.disabled = n < MIN_POOL;
      const t = TOPICS.find(x => x.id === prefs.topic);
      startBtn.lastChild.textContent = n < MIN_POOL ? 'Este tema llega pronto' : `¡Empezar! ${t.icon} ${t.name}`;
    }
    const radioKeys = (list, set) => e => {
      const i = list.indexOf(e.target);
      if (i < 0) return;
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      let j = i;
      for (let k = 0; k < list.length; k++) { j = (j + d + list.length) % list.length; if (!list[j].disabled) break; }
      list[j].focus();
      set(list[j]);
    };
    const topics = TOPICS.map(t => {
      const size = poolFor(t.id, prefs.level).length;
      const rec = best(t.id);
      const b = h('button', { type: 'button', class: 'rt-topic', role: 'radio', 'aria-checked': 'false', dataset: { topic: t.id }, disabled: size < MIN_POOL,
        onclick: () => { sfx('tap'); prefs.topic = t.id; paint(); } },
      h('span', { class: 'rt-topic__icon', 'aria-hidden': 'true' }, t.icon),
      h('span', { class: 'rt-topic__name' }, t.name),
      h('span', { class: 'rt-topic__best' }, size < MIN_POOL ? 'Muy pronto' : rec ? `Récord ${rec}/${ROUND}` : 'Nuevo'),
      rec >= 6 ? h('span', { class: 'rt-topic__medal', 'aria-hidden': 'true' }, rec >= 9 ? '🏆' : '⭐') : null);
      topicBtns.push(b);
      return b;
    });
    const levels = LEVELS.map(l => {
      const b = h('button', { type: 'button', class: 'rt-level', role: 'radio', 'aria-checked': 'false', dataset: { level: l.id },
        onclick: () => { sfx('tap'); prefs.level = l.id; paint(); } },
      h('span', { class: 'rt-level__icon', 'aria-hidden': 'true' }, l.icon),
      h('span', { class: 'rt-level__name' }, l.name),
      h('span', { class: 'rt-level__sub' }, l.sub));
      levelBtns.push(b);
      return b;
    });
    if (!bank.length) { sh.fill(soon('Muy pronto', 'Las preguntas del reto están por llegar.', '🏆')); clear(foot); return; }
    if (poolFor(prefs.topic, prefs.level).length < MIN_POOL) prefs.topic = 'todo';
    sh.fill(
      h('div', { class: 'rt-hero' },
        h('span', { class: 'rt-hero__icon', 'aria-hidden': 'true' }, '🏆'),
        h('div', null,
          h('h2', null, '¿Cuánto sabes de tu fe?'),
          h('p', null, `Responde ${ROUND} preguntas. Haz rachas para ganar más puntos.`))),
      h('h2', { class: 'ct-h2' }, h('span', { class: 'rt-step' }, '1'), 'Elige un tema'),
      h('div', { class: 'rt-topics', role: 'radiogroup', 'aria-label': 'Tema', onkeydown: radioKeys(topicBtns, b => { prefs.topic = b.dataset.topic; paint(); }) }, topics),
      h('h2', { class: 'ct-h2' }, h('span', { class: 'rt-step' }, '2'), 'Elige la dificultad'),
      h('div', { class: 'rt-levels', role: 'radiogroup', 'aria-label': 'Dificultad', onkeydown: radioKeys(levelBtns, b => { prefs.level = b.dataset.level; paint(); }) }, levels));
    clear(foot).append(startBtn);
    foot.hidden = false;
    paint();
  }

  // ── 2. La ronda ──
  function pickRound(topic, level) {
    const pool = poolFor(topic, level);
    const fresh = pool.filter(q => !recent.includes(q.key));
    const list = shuffle(fresh.length >= ROUND ? fresh : pool).slice(0, ROUND);
    for (const q of list) { recent.push(q.key); if (recent.length > 60) recent.shift(); }
    // Opciones barajadas cuidando cuál es la correcta.
    return list.map(q => {
      const order = shuffle(q.options.map((o, i) => i));
      return { ...q, options: order.map(i => q.options[i]), answer: order.indexOf(q.answer) };
    });
  }

  function startRound() {
    endGame();
    const topic = TOPICS.find(t => t.id === prefs.topic) || TOPICS[0];
    const level = LEVELS.find(l => l.id === prefs.level) || LEVELS[1];
    const qs = pickRound(topic.id, level.id);
    if (qs.length < MIN_POOL) { setup(); return; }
    view = 'play';
    foot.hidden = true;
    sh.setTitle(`${topic.icon} ${topic.name}`);
    let i = 0, score = 0, streak = 0, bestStreak = 0, hits = 0, used5050 = false;
    let timerId = 0, left = level.time, lastT = 0, answered = false, paused = false;
    const g = {
      over: false,
      stop() { g.over = true; if (timerId) { clearInterval(timerId); timerId = 0; } },
      pause() { paused = true; },
      resume() { paused = false; lastT = performance.now(); },
    };
    game = g;

    const mult = s => (s >= 6 ? 3 : s >= 3 ? 2 : 1);
    function chip() { sh.setChip({ icon: '⭐', text: String(score), label: `${score} puntos` }); }

    function ask() {
      tts.stop();
      answered = false;
      const q = qs[i];
      left = level.time;
      const timeBar = level.time ? h('div', { class: 'rt-time', role: 'timer', 'aria-label': `${level.time} segundos` }, h('i'), h('span', { class: 'rt-time__n' }, String(level.time))) : null;
      const opts = q.options.map((o, k) => h('button', { type: 'button', class: 'ct-opt rt-opt', onclick: () => answer(k) },
        h('span', { class: 'ct-opt__k', 'aria-hidden': 'true' }, 'ABCD'[k]),
        h('span', { class: 'ct-opt__t' }, o)));
      const fifty = h('button', { type: 'button', class: 'rt-5050', disabled: used5050 || q.options.length < 3, 'aria-label': 'Comodín 50:50: quita una respuesta incorrecta', onclick: () => {
        if (used5050 || answered) return;
        used5050 = true;
        sfx('sparkle');
        const wrong = shuffle(q.options.map((_, k) => k).filter(k => k !== q.answer));
        const remove = wrong.slice(0, Math.max(1, q.options.length - 2));
        for (const k of remove) { opts[k].disabled = true; opts[k].classList.add('is-gone'); }
        fifty.disabled = true;
      } }, deco('✂️'), '50:50');
      const streakEl = h('span', { class: `rt-streak${streak >= 3 ? ' is-hot' : ''}`, 'aria-label': `Racha de ${streak}` }, deco('🔥'), String(streak), mult(streak) > 1 ? h('b', null, `×${mult(streak)}`) : null);
      const fb = h('div', { class: 'ct-fb', role: 'status', 'aria-live': 'polite', hidden: true });
      const dots = h('div', { class: 'rt-dots', 'aria-hidden': 'true' }, qs.map((_, k) => h('i', { class: k < i ? (qs[k].ok ? 'is-ok' : 'is-no') : k === i ? 'is-now' : '' })));
      sh.fill(
        h('div', { class: 'rt-hud' }, h('span', { class: 'rt-hud__n' }, `Pregunta ${i + 1} de ${qs.length}`), streakEl),
        dots,
        timeBar,
        h('section', { class: 'rt-card', 'aria-label': `Pregunta ${i + 1}` },
          h('div', { class: 'ct-quiz__qrow' },
            h('p', { class: 'rt-card__topic' }, deco(topic.icon), topic.id === 'todo' ? 'Pregunta de fe' : topic.name),
            speakBtn(() => [q.q, ...q.options.map((o, k) => `${'ABCD'[k]}: ${o}`)], { compact: true, label: 'Escuchar la pregunta' })),
          h('p', { class: 'ct-quiz__q rt-q' }, q.q),
          h('div', { class: 'ct-opts' }, opts)),
        h('div', { class: 'rt-tools' }, fifty),
        fb);
      chip();

      function tick() {
        if (answered || paused || g.over || !timeBar) { lastT = performance.now(); return; }
        const now = performance.now();
        left = Math.max(0, left - (now - lastT) / 1000);
        lastT = now;
        const frac = left / level.time;
        timeBar.firstChild.style.transform = `scaleX(${frac.toFixed(3)})`;
        timeBar.lastChild.textContent = String(Math.ceil(left));
        timeBar.classList.toggle('is-low', left <= 7);
        if (left <= 0) answer(-1);
      }
      if (timerId) { clearInterval(timerId); timerId = 0; }
      if (level.time) { lastT = performance.now(); timerId = setInterval(tick, 100); }

      function answer(k) {
        if (answered || g.over) return;
        answered = true;
        tts.stop();
        if (timerId) { clearInterval(timerId); timerId = 0; }
        const ok = k === q.answer;
        q.ok = ok;
        if (k !== -1) Rv.answered(q, ok);      // lo que se acabó por tiempo no va a «Mis repasos»
        let gained = 0;
        if (ok) { hits++; streak++; bestStreak = Math.max(bestStreak, streak); gained = 10 * mult(streak); score += gained; }
        else streak = 0;
        sfx(ok ? (mult(streak) > 1 ? 'match' : 'good') : 'wrong');
        opts.forEach((b, n) => {
          b.disabled = true;
          if (n === q.answer) { b.classList.add('is-right'); b.firstChild.textContent = '✓'; }
          else if (n === k) { b.classList.add('is-wrong'); b.firstChild.textContent = '✕'; }
        });
        fifty.disabled = true;
        chip();
        const last = i === qs.length - 1;
        const nextBtn = button(last ? 'Ver mi resultado' : 'Siguiente', { kind: last ? 'sun' : 'sky', small: true, icon: last ? '🏁' : '▶️',
          onClick: () => { if (last) finish(); else { i++; ask(); } } });
        const title = k === -1 ? `¡Se acabó el tiempo! Era: ${q.options[q.answer]}`
          : ok ? (mult(streak) > 1 ? `¡Racha de ${streak}! +${gained} puntos (×${mult(streak)})` : `¡Correcto! +${gained} puntos`)
            : `Casi. La respuesta es: ${q.options[q.answer]}`;
        fb.classList.add(ok ? 'is-ok' : 'is-no');
        fb.append(h('p', { class: 'ct-fb__title' }, deco(k === -1 ? '⏰' : ok ? '🌟' : '💡'), title));
        if (q.explain) fb.append(h('p', { class: 'ct-fb__text' }, q.explain));
        fb.append(nextBtn);
        fb.hidden = false;
        nextBtn.focus({ preventScroll: true });
        life.later(() => fb.scrollIntoView({ behavior: smooth(), block: 'nearest' }), 30);
        // Repintar la racha
        streakEl.replaceWith(h('span', { class: `rt-streak${streak >= 3 ? ' is-hot' : ''}${ok ? ' is-pop' : ''}`, 'aria-label': `Racha de ${streak}` }, deco('🔥'), String(streak), mult(streak) > 1 ? h('b', null, `×${mult(streak)}`) : null));
      }
    }

    function finish() {
      g.stop();
      view = 'result';
      const total = qs.length;
      const stars = hits >= Math.ceil(total * 0.9) ? 3 : hits >= Math.ceil(total * 0.6) ? 2 : 1;
      const prev = best(topic.id);
      const record = hits > prev;
      if (record) state.setFlag(`reto:best:${topic.id}`, hits);
      // Premio completo en las primeras rondas del día; después uno pequeño, para que no se pueda «cosechar» sin fin.
      let full = false;
      for (let k = 1; k <= FULL_ROUNDS && !full; k++) full = state.dailyOnce(`reto:ronda${k}`);
      const bonus = record && prev ? 2 : 0;
      const coins = full ? hits + (hits === total ? 5 : 0) + bonus : Math.ceil(hits / 4) + bonus;
      const gains = grant({ coins, xp: full ? 4 + hits : 1 + Math.floor(hits / 3) });
      sfx(stars === 3 ? 'win' : stars === 2 ? 'sticker' : 'sparkle');
      if (stars >= 2) celebrate(sh.page, ['⭐', '🏆', '✨', '🌟']);
      const msg = stars === 3 ? '¡Eres un campeón de la fe!' : stars === 2 ? '¡Muy bien! Sabes mucho.' : '¡Buen intento! Cada reto te ayuda a aprender.';
      sh.setTitle('Resultado');
      sh.fill(h('section', { class: 'rt-result' },
        h('div', { class: 'rt-result__stars', role: 'img', 'aria-label': `${stars} de 3 estrellas` },
          [1, 2, 3].map(k => h('span', { class: k <= stars ? 'is-on' : '', 'aria-hidden': 'true' }, '★'))),
        h('h2', null, msg),
        h('p', { class: 'rt-result__hits' }, `${hits} de ${total} correctas`),
        h('div', { class: 'rt-result__stats' },
          h('span', null, deco('⭐'), `${score} puntos`),
          h('span', null, deco('🔥'), `Mejor racha: ${bestStreak}`)),
        record ? h('p', { class: 'rt-record' }, deco('🏅'), `¡Nuevo récord en ${topic.name}!`) : prev ? h('p', { class: 'rt-result__best' }, `Tu récord: ${Math.max(prev, hits)}/${ROUND}`) : null,
        rewardRow(gains),
        full ? null : h('p', { class: 'rt-result__best' }, deco('🌙'), '¡Cuánto practicas! Hoy ya ganaste los premios grandes del reto. Mañana vuelven.'),
        h('div', { class: 'rt-result__row' },
          button('Jugar otra vez', { kind: 'sun', icon: '🔄', sound: 'pop', onClick: () => startRound() }),
          button('Cambiar tema', { kind: 'ghost', icon: '🎯', onClick: () => { endGame(); setup(); } }))));
    }

    ask();
  }

  setup();

  return {
    back() {
      if (view === 'setup') return false;
      goBack();
      return true;
    },
    unmount() { endGame(); life.end(); foot.remove(); sh.root.remove(); },
  };
}
