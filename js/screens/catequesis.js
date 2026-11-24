// Catequesis interactiva: el centro «Aprendo» / «Me preparo» y la lista de lecciones animadas.
//
//   go('catequesis')                         centro de catequesis
//   go('catequesis', { view: 'lecciones' })  lista de lecciones agrupadas por unidad (Creo · Celebro · Vivo · Rezo)
//
// Este módulo también exporta las piezas que comparten lesson.js, confesion.js, misa.js y reto.js
// (armazón de pantalla, carga de contenidos, botón de voz, cuestionario y celebración).
// Los contenidos se cargan con import() dinámico: si un archivo todavía no existe se muestra «Muy pronto».
// Todos los textos de los datos se insertan como texto (nunca como HTML).
import * as state from '../core/state.js';
import * as tts from '../core/tts.js';
import { h, clear, button, iconButton, meter, reduceMotion } from '../core/ui.js';
import { sfx } from '../core/audio.js';
import { go, back } from '../core/router.js';
import * as Rm from '../core/reminders.js';
import * as Rv from '../core/review.js';
import { sceneEl, SCENE_IDS, isFloating, hasOrb } from '../art/scenes.js';

// ───────────────────────── Utilidades compartidas ─────────────────────────

export const arr = v => (Array.isArray(v) ? v.filter(x => x !== null && x !== undefined) : []);
export const txt = v => (typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v));
export const deco = icon => h('span', { 'aria-hidden': 'true' }, icon);
export const smooth = () => (reduceMotion() ? 'auto' : 'smooth');
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const BGS = SCENE_IDS;   // fondos pintados (js/art/scenes.js)
export const voiceReady = () => state.setting('voice') !== false && tts.available();
export function shuffle(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export const UNITS = [
  { key: 'creo', title: 'Creo', sub: 'Lo que creemos', icon: '✝️', c1: '#8fd3ff', c2: '#4aa3e0' },
  { key: 'celebro', title: 'Celebro', sub: 'Los sacramentos', icon: '🍞', c1: '#ffe08a', c2: '#f0a51e' },
  { key: 'vivo', title: 'Vivo', sub: 'Vivir como Jesús', icon: '❤️', c1: '#ffc2d1', c2: '#ec6f90' },
  { key: 'rezo', title: 'Rezo', sub: 'Hablar con Dios', icon: '🙏', c1: '#d6c6ff', c2: '#7556c9' },
];
const UNIT_ORDER = UNITS.map(u => u.key);
// Orden estable por unidad (Creo, Celebro, Vivo, Rezo; al final las que no tienen unidad).
export function byUnit(list) {
  const rank = x => { const r = UNIT_ORDER.indexOf(x?.unit); return r < 0 ? UNIT_ORDER.length : r; };
  return list.map((x, i) => [x, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map(p => p[0]);
}

// ── Carga perezosa (rutas escritas tal cual para que el empaquetador las incluya) ──
const LOADERS = {
  lessons: () => import('../data/lessons.js').then(m => m.LESSONS),
  confession: () => import('../data/confession.js').then(m => m.CONFESSION),
  mass: () => import('../data/mass.js').then(m => m.MASS),
  catechism: () => import('../data/catechism.js').then(m => m.CATECHISM),
  trivia: () => import('../data/trivia.js').then(m => m.TRIVIA),
  at: () => import('../data/bible-at.js').then(m => m.STORIES_AT),
  nt: () => import('../data/bible-nt.js').then(m => m.STORIES_NT),
  milagros: () => import('../data/bible-milagros.js').then(m => m.STORIES_MILAGROS),
  ars: () => import('../data/cura-ars.js').then(m => (m.CURA_ARS_STORY ? [m.CURA_ARS_STORY] : [])),
  parables: () => import('../data/parables.js').then(m => m.PARABLES),
  prayers: () => import('../data/prayers.js').then(m => m.PRAYERS),
};
const cache = {};
export async function loadData(key) {
  if (cache[key]) return cache[key];
  try {
    const data = await LOADERS[key]();
    if (data && typeof data === 'object') { cache[key] = data; return data; }
  } catch { /* ese contenido todavía no existe */ }
  return null;
}
export async function loadLessons() { return byUnit(arr(await loadData('lessons')).filter(l => l && l.id && arr(l.scenes).length)); }

// ── Ciclo de vida de una pantalla: temporizadores y oyentes que se limpian al salir ──
export function lifecycle() {
  let dead = false;
  const timers = new Set();
  const offs = [];
  return {
    get dead() { return dead; },
    later(fn, ms) {
      const id = setTimeout(() => { timers.delete(id); if (!dead) fn(); }, ms);
      timers.add(id);
      return id;
    },
    cancel(id) { if (id) { clearTimeout(id); timers.delete(id); } },
    every(fn, ms) {
      const id = setInterval(() => { if (!dead) fn(); }, ms);
      offs.push(() => clearInterval(id));
      return id;
    },
    on(target, ev, fn, opts) { target.addEventListener(ev, fn, opts); offs.push(() => target.removeEventListener(ev, fn, opts)); },
    add(off) { offs.push(off); },
    end() {
      dead = true;
      tts.stop();
      for (const id of timers) clearTimeout(id);
      timers.clear();
      for (const off of offs.splice(0)) { try { off(); } catch (e) { console.error(e); } }
    },
  };
}

// ── Armazón: barra superior sobre el cielo y una hoja de papel con desplazamiento ──
export function shell(el, { title, onBack, cls = '' }) {
  const titleEl = h('h1', null, title);
  const chip = h('span', { class: 'chip ct-chip', hidden: true });
  const scroll = h('div', { class: 'scroll ct-scroll', tabindex: '-1' });
  const page = h('div', { class: 'ct-page' }, scroll);
  const top = h('header', { class: 'topbar ct-top' }, iconButton('↩️', 'Volver', onBack), titleEl, chip);
  const root = h('div', { class: `ct ${cls}`.trim() }, top, page);
  el.append(root);
  // Títulos largos (p. ej. el de una lección): letra más pequeña y hasta dos renglones, en vez de cortarse con «…».
  const fitTitle = t => {
    const n = [...txt(t)].length;
    titleEl.classList.toggle('is-long', n > 12);
    titleEl.classList.toggle('is-xlong', n > 30);
  };
  fitTitle(title);
  return {
    root, top, titleEl, chip, page, scroll,
    setTitle(t) { titleEl.textContent = t; fitTitle(t); },
    setChip(c) {
      clear(chip);
      chip.hidden = !c;
      if (!c) return;
      if (c.icon) chip.append(deco(c.icon));
      chip.append(c.text);
      chip.setAttribute('aria-label', c.label || c.text);
    },
    fill(...nodes) { clear(scroll).append(h('div', { class: 'ct-view' }, nodes)); scroll.scrollTop = 0; },
  };
}

// Pestañas tipo separador de libro, encima de la hoja. tabs: [{ id, label, icon }]
export function tabBar(tabs, onPick, label) {
  const btns = new Map();
  const bar = h('div', { class: 'ct-tabs', role: 'tablist', 'aria-label': label, onkeydown: e => {
    const ids = tabs.map(t => t.id);
    const i = ids.indexOf(e.target?.dataset?.tab);
    if (i < 0) return;
    const n = ids.length;
    const j = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
    if (j < 0) return;
    e.preventDefault();
    btns.get(ids[j]).focus();
    onPick(ids[j]);
  } }, tabs.map((t, k) => {
    const b = h('button', { type: 'button', class: 'ct-tab', role: 'tab', id: `ct-tab-${t.id}`, 'aria-selected': 'false', tabindex: '-1', dataset: { tab: t.id },
      onclick: () => onPick(t.id) },
    h('span', { class: 'ct-tab__icon', 'aria-hidden': 'true' }, t.icon),
    h('span', { class: 'ct-tab__label' }, t.label),
    t.step ? h('span', { class: 'ct-tab__n', 'aria-hidden': 'true' }, String(k + 1)) : null);
    btns.set(t.id, b);
    return b;
  }));
  bar.select = id => {
    for (const [k, b] of btns) { const on = k === id; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; }
  };
  bar.button = id => btns.get(id);
  return bar;
}

// Tarjeta amable para lo que todavía no está.
export function soon(title = 'Muy pronto', text = 'Estamos preparando esta parte con mucho cariño. ¡Vuelve pronto!', icon = '🪺') {
  return h('div', { class: 'ct-soon' },
    h('div', { class: 'ct-soon__icon', 'aria-hidden': 'true' }, icon),
    h('h2', null, title),
    h('p', null, text));
}

export function rewardRow(items) {
  if (!items.length) return null;
  return h('div', { class: 'ct-reward', role: 'status' }, items.map(([icon, text]) => h('span', null, deco(icon), text)));
}

// Entrega un premio { coins, fe, xp } y devuelve las etiquetas para mostrarlo.
export function grant({ coins = 0, fe = 0, xp = 0 } = {}) {
  const out = [];
  if (fe) { state.addStat('fe', fe); out.push(['🕯️', `+${fe} de Fe`]); }
  if (xp) { state.addXp(xp); out.push(['⭐', `+${xp} de experiencia`]); }
  if (coins) { state.addCoins(coins); out.push([state.COIN.icon, `+${coins} ${state.COIN.name}`]); }
  return out;
}

// Medidor accesible.
export function progressMeter(value, color, label) {
  const m = meter(clamp(value, 0, 100), color);
  m.setAttribute('role', 'progressbar');
  m.setAttribute('aria-valuemin', '0');
  m.setAttribute('aria-valuemax', '100');
  m.setAttribute('aria-valuenow', String(Math.round(clamp(value, 0, 100))));
  m.setAttribute('aria-label', label);
  return m;
}

// Pequeña celebración de estrellitas (no aparece si el niño prefiere menos movimiento).
export function celebrate(container, icons = ['✨', '⭐', '💛', '🌟']) {
  if (reduceMotion() || !container) return;
  const layer = h('div', { class: 'ct-burst', 'aria-hidden': 'true' });
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + Math.random() * 0.5;
    const r = 80 + Math.random() * 100;
    const s = h('span', null, icons[i % icons.length]);
    s.style.setProperty('--dx', `${Math.round(Math.cos(a) * r)}px`);
    s.style.setProperty('--dy', `${Math.round(Math.sin(a) * r - 40)}px`);
    s.style.setProperty('--rot', `${Math.round((Math.random() - 0.5) * 140)}deg`);
    s.style.animationDelay = `${Math.round(Math.random() * 140)}ms`;
    layer.append(s);
  }
  container.append(layer);
  setTimeout(() => layer.remove(), 1600);
}

// Botón de voz. compact: botoncito redondo 🔊 (para globitos y tarjetas). Devuelve null si no hay voz.
export function speakBtn(getText, { label = 'Escuchar', compact = false, kind = 'sky' } = {}) {
  if (!voiceReady()) return null;
  let on = false;
  const icon = deco('🔊');
  const text = compact ? null : h('span', null, label);
  const b = h('button', { type: 'button', class: compact ? 'ct-say' : `btn btn--${kind} btn--sm ct-listen`, 'aria-pressed': 'false',
    'aria-label': compact ? label : null, title: compact ? label : null, onclick: toggle }, icon, text);
  function set(v) {
    on = v;
    icon.textContent = v ? '⏹️' : '🔊';
    if (text) text.textContent = v ? 'Detener' : label;
    if (compact) b.setAttribute('aria-label', v ? 'Detener la voz' : label);
    b.setAttribute('aria-pressed', String(v));
    b.classList.toggle('is-on', v);
  }
  function toggle(e) {
    e?.stopPropagation();
    sfx('tap');
    if (on) { tts.stop(); return; }
    set(true);
    if (!tts.speak(getText(), { onend: () => set(false) })) set(false);
  }
  return b;
}

// ── Cuestionario: una pregunta por pantalla, botones grandes, explicación y se puede repetir ──
//   key: para state.markQuiz · prize: { coins, fe, xp } (se gana una sola vez)
//   perfectOnly: el premio solo se gana con todas correctas · fx: contenedor para la celebración
//   onFinish(slot, { hits, total, perfect, first }): para añadir botones al resultado
//   again: false quita «Responder otra vez» (en «Mis repasos») · q.from: de dónde viene la pregunta (se muestra chiquito)
export function quiz(questions, { key, prize = { coins: 10 }, perfectOnly = true, title = '¿Qué aprendiste?', fx = null, onFinish = null, again = true } = {}) {
  const qs = arr(questions).filter(q => q && arr(q.options).length >= 2 && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length);
  if (!qs.length) return null;
  const box = h('section', { class: 'ct-quiz', 'aria-label': title });
  let i = 0, marks = [];

  const dots = () => h('div', { class: 'ct-dots', 'aria-hidden': 'true' }, qs.map((_, k) => h('i', {
    class: k < marks.length ? (marks[k] ? 'is-ok' : 'is-no') : k === i && marks.length < qs.length ? 'is-now' : '' })));
  const head = () => h('div', { class: 'ct-quiz__head' }, h('h3', null, deco('🎯'), title), dots());

  function ask() {
    const q = qs[i];
    const opts = arr(q.options).map((o, k) => h('button', { type: 'button', class: 'ct-opt', onclick: () => answer(k) },
      h('span', { class: 'ct-opt__k', 'aria-hidden': 'true' }, 'ABCD'[k] || '•'),
      h('span', { class: 'ct-opt__t' }, txt(o))));
    const fb = h('div', { class: 'ct-fb', role: 'status', 'aria-live': 'polite', hidden: true });
    clear(box).append(head(),
      h('div', { class: 'ct-quiz__qrow' },
        h('p', { class: 'ct-quiz__n' }, `Pregunta ${i + 1} de ${qs.length}`),
        speakBtn(() => [txt(q.q), ...arr(q.options).map((o, k) => `${'ABCD'[k]}: ${txt(o)}`)], { compact: true, label: 'Escuchar la pregunta' })),
      q.from ? h('p', { class: 'ct-quiz__from' }, deco('📌'), txt(q.from)) : null,
      h('p', { class: 'ct-quiz__q' }, txt(q.q)),
      h('div', { class: 'ct-opts' }, opts), fb);

    function answer(k) {
      tts.stop();
      const right = k === q.answer;
      marks.push(right);
      Rv.answered(q, right);
      sfx(right ? 'good' : 'wrong');
      opts.forEach((b, n) => {
        b.disabled = true;
        if (n === q.answer) { b.classList.add('is-right'); b.firstChild.textContent = '✓'; }
        else if (n === k) { b.classList.add('is-wrong'); b.firstChild.textContent = '✕'; }
      });
      box.replaceChild(head(), box.firstChild);
      const last = i === qs.length - 1;
      const nextBtn = button(last ? 'Ver mi resultado' : 'Siguiente pregunta', { kind: last ? 'sun' : 'sky', small: true, icon: last ? '🏁' : '▶️',
        onClick: () => { if (last) finish(); else { i++; ask(); box.scrollIntoView({ behavior: smooth(), block: 'start' }); } } });
      fb.classList.add(right ? 'is-ok' : 'is-no');
      fb.append(h('p', { class: 'ct-fb__title' }, deco(right ? '🌟' : '💡'), right ? '¡Muy bien!' : `Casi. La respuesta es: ${txt(q.options[q.answer])}`));
      if (q.explain) fb.append(h('p', { class: 'ct-fb__text' }, txt(q.explain)));
      fb.append(nextBtn);
      fb.hidden = false;
      nextBtn.focus({ preventScroll: true });
      fb.scrollIntoView({ behavior: smooth(), block: 'nearest' });
    }
  }

  function finish() {
    const hits = marks.filter(Boolean).length;
    const perfect = hits === qs.length;
    let first = false, gains = [];
    if (key && (perfect || !perfectOnly)) {
      first = state.markQuiz(key);
      if (first) gains = grant(prize);
    }
    if (first) { sfx('win'); celebrate(fx); } else sfx(perfect ? 'sticker' : 'sparkle');
    const msg = perfect ? '¡Excelente! Respondiste todo muy bien.'
      : hits === 0 ? '¡Gracias por intentarlo! Repasa con calma y prueba otra vez.'
        : `¡Buen trabajo! Acertaste ${hits} de ${qs.length}.`;
    const won = key ? state.quizDone(key) : true;
    const prizeText = [prize.coins ? `+${prize.coins} ${state.COIN.name}` : '', prize.fe ? `+${prize.fe} de Fe` : ''].filter(Boolean).join(' y ');
    i = qs.length;
    const slot = h('div', { class: 'ct-quiz__more' });
    clear(box).append(head(),
      h('div', { class: 'ct-result' },
        h('div', { class: 'ct-stars', role: 'img', 'aria-label': `${hits} de ${qs.length} respuestas correctas` },
          marks.map(ok => h('span', { class: ok ? '' : 'is-off', 'aria-hidden': 'true' }, '⭐'))),
        h('p', { class: 'ct-result__msg', role: 'status' }, msg),
        rewardRow(gains),
        !won && prizeText ? h('p', { class: 'ct-result__hint' }, deco('🎁'), `Responde todas bien para ganar ${prizeText}.`) : null,
        again ? button('Responder otra vez', { kind: 'ghost', small: true, icon: '🔄', onClick: start }) : null,
        slot));
    onFinish?.(slot, { hits, total: qs.length, perfect, first });
    box.scrollIntoView({ behavior: smooth(), block: 'start' });
  }

  function start() { i = 0; marks = []; ask(); }
  start();
  return box;
}

// Pequeña escena ilustrada: paisaje pintado (js/art/scenes.js) + emojis colocados en % (x, y = centro; y = 100 abajo).
// Los que están en el suelo llevan su sombrita. cls con «wide» o «hero» pide la imagen grande (tarjetas anchas, portadas).
export function miniScene(bg, actors, cls = '') {
  const big = /wide|hero/.test(cls);
  const box = sceneEl(BGS.includes(bg) ? bg : 'cielo', { shape: big ? 'hero' : 'card', ambient: 'lite', cls: `ct-bg ${cls}`.trim(), orb: !hasOrb(actors.map(a => a.e)) });
  for (const a of actors) {
    const grounded = (Number(a.y) || 0) >= 56 && !a.anim && !isFloating(a.e);
    const s = h('span', { class: `ct-mini${a.anim ? ` ct-mini--${a.anim}` : ''}${grounded ? ' is-ground' : ''}` }, a.e);
    s.style.left = `${a.x}%`;
    s.style.top = `${a.y}%`;
    s.style.setProperty('--s', a.s || 1);
    box.append(s);
  }
  return box;
}

// ───────────────────────── Pantalla «Catequesis» ─────────────────────────

const RETO_TOPICS = 10;

export async function mount(el, params = {}) {
  const life = lifecycle();
  const sh = shell(el, { title: 'Catequesis', onBack: () => goBack(), cls: 'ct-hub' });
  let view = null;

  function goBack() {
    if (view === 'lecciones') { sfx('page'); show('hub'); return; }
    back();
  }
  life.on(window, 'keydown', e => {
    if (e.key !== 'Escape' || !sh.root.isConnected || document.querySelector('.modal-scrim, .game')) return;
    goBack();
  });

  async function show(v) {
    view = v;
    if (v === 'lecciones') params.view = 'lecciones'; else delete params.view;
    const out = v === 'lecciones' ? await lessonsView() : await hubView();
    if (life.dead || view !== v) return;
    sh.setTitle(out.title);
    sh.setChip(out.chip || null);
    sh.fill(out.body);
  }

  // ── Centro ──
  async function hubView() {
    const [lessons, cat, at, nt, mi] = await Promise.all([loadLessons(), loadData('catechism'), loadData('at'), loadData('nt'), loadData('milagros')]);
    const topics = arr(cat).filter(c => c && c.id);
    const stories = [...arr(at), ...arr(nt), ...arr(mi)].filter(s => s && s.id);
    const seen = lessons.filter(l => state.isRead(`lesson:${l.id}`)).length;
    const topicsDone = topics.filter(c => state.quizDone(`cat:${c.id}`)).length;
    const storiesRead = stories.filter(s => state.isRead(s.id)).length;
    let retos = 0;
    for (const t of ['todo', 'at', 'jesus', 'parabolas', 'sacramentos', 'misa', 'oraciones', 'maria', 'confesion', 'camino']) if ((Number(state.flag(`reto:best:${t}`)) || 0) >= 6) retos++;
    const kid = txt(state.get().kid).trim();
    // Para las tarjetas nuevas: sellos de memoria, repasos de hoy y el tiempo de la Iglesia.
    const [memoSet, L, F] = await Promise.all([
      import('../data/oraciones-extra.js').then(m => m.MEMORY_SET || []).catch(() => []),
      import('../core/liturgy.js').catch(() => null), import('../data/fiestas.js').catch(() => null)]);
    const memoTotal = memoSet.length, memoDone = memoSet.filter(m => state.memorized(m.id)).length;
    const dueNow = Rv.dueCount();
    let season = '', seasonHex = '', seasonEmoji = '', nextFeast = '';
    try {
      const so = L.seasonOf(new Date());
      season = F.SEASONS?.[so.id]?.title || so.label; seasonHex = L.colorHex(so.color); seasonEmoji = F.SEASONS?.[so.id]?.emoji || '';
      const nx = L.nextFeasts(new Date(), 1)[0];
      if (nx) nextFeast = nx.days === 1 ? `mañana, ${nx.feast.title}` : nx.feast.title;
    } catch { /* sin calendario */ }

    const stat = (icon, label, n, total, color) => h('div', { class: 'ct-stat' },
      h('span', { class: 'ct-stat__top' }, deco(icon), h('b', null, total ? `${n}/${total}` : '—')),
      h('span', { class: 'ct-stat__label' }, label),
      progressMeter(total ? (n / total) * 100 : 0, color, `${label}: ${n} de ${total}`));

    const card = ({ title, sub, bg, actors, onClick, note, wide = false, play = false, c }) => {
      const b = h('button', { type: 'button', class: `ct-card${wide ? ' ct-card--wide' : ''}`, onclick: () => { sfx('pop'); onClick(); } },
        h('span', { class: 'ct-card__art' }, miniScene(bg, actors, wide ? 'ct-bg--wide' : ''), play ? h('span', { class: 'ct-card__play', 'aria-hidden': 'true' }) : null),
        h('span', { class: 'ct-card__body' },
          h('span', { class: 'ct-card__title' }, title),
          h('span', { class: 'ct-card__sub' }, sub),
          note ? h('span', { class: 'ct-card__note' }, note) : null));
      if (c) b.style.setProperty('--c', c);
      return b;
    };

    const hello = h('section', { class: 'ct-hello' },
      h('div', { class: 'ct-hello__dove', 'aria-hidden': 'true' }, '🕊️'),
      h('div', { class: 'ct-hello__text' },
        h('h2', null, kid ? `¡Hola, ${kid}!` : '¡Hola!'),
        h('p', null, 'Aprende y prepárate con alegría para recibir a Jesús en tu Primera Comunión.')));

    const progress = h('section', { class: 'ct-panel ct-progress', 'aria-label': 'Mi avance' },
      h('h2', { class: 'ct-progress__title' }, deco('🌱'), 'Mi avance'),
      h('div', { class: 'ct-stats' },
        stat('🎬', 'Lecciones vistas', seen, lessons.length, 'var(--coral)'),
        stat('👣', 'Temas del camino', topicsDone, topics.length, 'var(--leaf)'),
        stat('🏆', 'Retos superados', retos, RETO_TOPICS, 'var(--grape)')));

    const learn = h('section', { class: 'ct-group', 'aria-label': 'Aprendo' },
      h('h2', { class: 'ct-group__title' }, deco('📚'), 'Aprendo'),
      h('div', { class: 'ct-grid' },
        card({ wide: true, play: true, title: 'Lecciones animadas', sub: 'Mira y escucha, como un video, y luego responde.', bg: 'amanecer', c: '#ff8a5c',
          actors: [{ e: '🧒', x: 22, y: 70, s: 1.1 }, { e: '⛪', x: 76, y: 60, s: 1.05 }, { e: '🕊️', x: 18, y: 26, s: 0.85, anim: 'float' }, { e: '🌟', x: 88, y: 22, s: 0.7, anim: 'twinkle' }],
          note: lessons.length ? `${seen} de ${lessons.length} vistas` : 'Muy pronto', onClick: () => { show('lecciones'); } }),
        card({ title: 'Mi camino', sub: 'Los temas para tu Primera Comunión', bg: 'campo', c: '#3f9a52',
          actors: [{ e: '⛪', x: 72, y: 56, s: 1.25 }, { e: '👣', x: 28, y: 76, s: 0.85 }, { e: '🌈', x: 30, y: 26, s: 0.8 }],
          note: topics.length ? `${topicsDone} de ${topics.length} temas` : '', onClick: () => go('bible', { tab: 'catecismo' }) }),
        card({ title: 'Historias y milagros', sub: 'La Biblia contada para ti', bg: 'dorado', c: '#f0a51e',
          actors: [{ e: '📖', x: 50, y: 62, s: 1.3 }, { e: '✨', x: 20, y: 28, s: 0.8, anim: 'twinkle' }, { e: '🌟', x: 80, y: 26, s: 0.8, anim: 'twinkle' }],
          note: stories.length ? `${storiesRead} de ${stories.length} leídas` : '', onClick: () => go('bible', { tab: 'historias' }) }),
        card({ title: 'Lo sé de memoria', sub: 'Mi pasaporte de oraciones', bg: 'jardin', c: '#7556c9',
          actors: [{ e: '🎫', x: 50, y: 60, s: 1.3 }, { e: '⭐', x: 20, y: 28, s: 0.75, anim: 'twinkle' }, { e: '🙏', x: 80, y: 30, s: 0.8, anim: 'float' }],
          note: memoTotal ? `${memoDone} de ${memoTotal} sellos` : '', onClick: () => go('memoria') }),
        card({ title: 'Mis repasos', sub: 'Lo que me costó vuelve otro día', bg: 'cielo', c: '#4aa3e0',
          actors: [{ e: '📚', x: 50, y: 62, s: 1.3 }, { e: '💡', x: 22, y: 28, s: 0.8, anim: 'float' }, { e: '✅', x: 80, y: 30, s: 0.75 }],
          note: dueNow ? `${dueNow} para hoy` : state.reviewCount() ? '¡Al día! ✓' : 'Nada pendiente', onClick: () => go('repasos') }),
        card({ title: 'El Credo frase por frase', sub: 'Entiende lo que creemos', bg: 'amanecer', c: '#e2643a',
          actors: [{ e: '✝️', x: 50, y: 58, s: 1.2 }, { e: '🌅', x: 22, y: 30, s: 0.8 }, { e: '💛', x: 80, y: 28, s: 0.75, anim: 'float' }],
          note: state.isRead('credo:frases') ? '⭐ Terminado' : '', onClick: () => go('credo') })));

    const confDone = state.quizDone('confesion');
    const allTopics = topics.length > 0 && topicsDone === topics.length;
    const prepare = h('section', { class: 'ct-group', 'aria-label': 'Me preparo' },
      h('h2', { class: 'ct-group__title' }, deco('🎒'), 'Me preparo'),
      h('div', { class: 'ct-grid' },
        card({ title: 'Mi Primera Confesión', sub: 'El abrazo de Dios que perdona', bg: 'jardin', c: '#ec6f90',
          actors: [{ e: '🤗', x: 50, y: 60, s: 1.3 }, { e: '💛', x: 80, y: 26, s: 0.8, anim: 'float' }, { e: '🕊️', x: 20, y: 28, s: 0.8, anim: 'float' }],
          note: confDone ? '⭐ Preguntas listas' : '', onClick: () => go('confesion') }),
        (() => {
          const ev = Rm.nextEvent('comunion');
          return card({ title: 'Mi gran día', sub: 'Así será tu Primera Comunión', bg: 'iglesia', c: '#9b7be8',
            actors: [{ e: '🕊️', x: 50, y: 30, s: 1.1, anim: 'float' }, { e: '🕯️', x: 28, y: 66, s: 1 }, { e: '🍞', x: 72, y: 66, s: 1 }],
            note: ev ? (ev.days === 0 ? '¡Es hoy!' : ev.days === 1 ? '¡Es mañana!' : `Faltan ${ev.days} días`) : '', onClick: () => go('grandia') });
        })(),
        card({ title: 'Mis dudas', sub: 'Lo que preguntan los niños', bg: 'cielo', c: '#4aa3e0',
          actors: [{ e: '💭', x: 50, y: 30, s: 1.1, anim: 'float' }, { e: '🧒', x: 36, y: 68, s: 1.05 }, { e: '❓', x: 70, y: 56, s: 0.9 }],
          onClick: () => go('dudas') }),
        card({ title: 'La Misa paso a paso', sub: 'Qué pasa y qué respondemos', bg: 'templo', c: '#7556c9',
          actors: [{ e: '🍞', x: 34, y: 66, s: 1.1 }, { e: '🍷', x: 64, y: 66, s: 1.1 }, { e: '✨', x: 50, y: 28, s: 0.8, anim: 'twinkle' }],
          note: state.quizDone('misa:practica') ? '⭐ Práctica superada' : '', onClick: () => go('misa') }),
        card({ title: 'Reto de fe', sub: '10 preguntas, rachas y premios', bg: 'cielo', c: '#4aa3e0',
          actors: [{ e: '🏆', x: 50, y: 60, s: 1.3 }, { e: '⭐', x: 20, y: 30, s: 0.75, anim: 'twinkle' }, { e: '⭐', x: 80, y: 28, s: 0.75, anim: 'twinkle' }],
          note: retos ? `${retos} de ${RETO_TOPICS} temas superados` : '', onClick: () => go('reto') }),
        card({ title: 'Mi diploma', sub: allTopics ? '¡Ya lo ganaste!' : 'Al final de «Mi camino»', bg: 'dorado', c: '#d08a12',
          actors: [{ e: '📜', x: 50, y: 60, s: 1.3 }, { e: allTopics ? '🎉' : '🔒', x: 80, y: 28, s: 0.8 }, { e: '⭐', x: 20, y: 28, s: 0.75, anim: 'twinkle' }],
          note: allTopics ? '⭐ Listo para compartir' : topics.length ? `Faltan ${topics.length - topicsDone} temas` : '', onClick: () => go('diploma') })));

    const pray = h('section', { class: 'ct-group', 'aria-label': 'Rezo y celebro' },
      h('h2', { class: 'ct-group__title' }, deco('🙏'), 'Rezo y celebro'),
      h('div', { class: 'ct-grid' },
        card({ title: 'Mis oraciones', sub: 'Escucha y reza conmigo', bg: 'noche', c: '#27325e',
          actors: [{ e: '🙏', x: 50, y: 62, s: 1.3 }, { e: '⭐', x: 20, y: 26, s: 0.7, anim: 'twinkle' }, { e: '🌙', x: 80, y: 26, s: 0.85 }],
          onClick: () => go('bible', { tab: 'oraciones' }) }),
        card({ title: 'El Rosario', sub: 'Un misterio o el Rosario completo', bg: 'jardin', c: '#ec6f90',
          actors: [{ e: '📿', x: 50, y: 60, s: 1.3 }, { e: '🌹', x: 22, y: 30, s: 0.8, anim: 'float' }, { e: '💙', x: 80, y: 28, s: 0.75, anim: 'float' }],
          note: state.doneToday('pray:rosario') ? '🙏 Rezado hoy' : '', onClick: () => go('rosario') }),
        card({ title: 'Mi ratito con Jesús', sub: 'Tres minutos para hablar con Él', bg: 'noche', c: '#7556c9',
          actors: [{ e: '🕯️', x: 50, y: 62, s: 1.25 }, { e: '💛', x: 22, y: 30, s: 0.8, anim: 'float' }, { e: '✨', x: 80, y: 28, s: 0.75, anim: 'twinkle' }],
          note: state.doneToday('pray:ratito') ? '🙏 Hecho hoy' : '', onClick: () => go('ratito') }),
        card({ title: 'Calendario de la fe', sub: season ? season : 'Los tiempos y las fiestas', bg: 'campo', c: seasonHex || '#3f9a52',
          actors: [{ e: '🗓️', x: 50, y: 60, s: 1.25 }, { e: seasonEmoji || '🌱', x: 22, y: 30, s: 0.85 }, { e: '🎉', x: 80, y: 28, s: 0.75, anim: 'float' }],
          note: nextFeast ? `Próxima fiesta: ${nextFeast}` : '', onClick: () => go('calendario') }),
        card({ wide: true, title: 'Mi parroquia', sub: 'Santo Cura de Ars · horarios de Misa, catequesis y avisos', bg: 'iglesia', c: '#b5393f',
          actors: [{ e: '⛪', x: 50, y: 60, s: 1.3 }, { e: '🔔', x: 18, y: 28, s: 0.8, anim: 'float' }, { e: '🕊️', x: 82, y: 26, s: 0.8, anim: 'float' }],
          onClick: () => go('parroquia') })));

    return { title: 'Catequesis', body: [hello, progress, learn, prepare, pray] };
  }

  // ── Lista de lecciones ──
  async function lessonsView() {
    const lessons = await loadLessons();
    if (!lessons.length) return { title: 'Lecciones', body: soon('Muy pronto', 'Las lecciones animadas están por llegar. ¡Vuelve pronto!', '🎬') };
    const seenOf = l => state.isRead(`lesson:${l.id}`);
    const seen = lessons.filter(seenOf).length;
    const upNext = lessons.find(l => !seenOf(l));

    const tile = l => {
      const t = h('span', { class: 'ct-lesson__icon', 'aria-hidden': 'true' }, txt(l.emoji) || '🎬');
      if (/^#[0-9a-f]{6}$/i.test(l.color || '')) t.style.setProperty('--lc', l.color);
      return t;
    };
    const item = l => {
      const done = seenOf(l), star = state.quizDone(`lesson:${l.id}`);
      return h('button', { type: 'button', class: `ct-lesson${done ? ' is-done' : ''}`, dataset: { lesson: l.id },
        'aria-label': `${txt(l.title)}.${done ? ' Ya la viste.' : ''}${star ? ' Preguntas perfectas.' : ''}`,
        onclick: () => { sfx('pop'); go('lesson', { id: l.id }); } },
      tile(l),
      h('span', { class: 'ct-lesson__body' },
        h('span', { class: 'ct-lesson__title' }, txt(l.title)),
        h('span', { class: 'ct-lesson__sum' }, txt(l.summary))),
      h('span', { class: 'ct-lesson__state', 'aria-hidden': 'true' },
        star ? h('span', { class: 'ct-lesson__star' }, '⭐') : null,
        done ? h('span', { class: 'ct-check' }) : h('span', { class: 'ct-lesson__go' })));
    };

    const feature = upNext ? h('button', { type: 'button', class: 'ct-next', onclick: () => { sfx('pop'); go('lesson', { id: upNext.id }); } },
      miniScene(arr(upNext.scenes)[0]?.bg, arr(arr(upNext.scenes)[0]?.actors).slice(0, 3).map(a => ({ e: txt(a.e), x: clamp(Number(a.x) || 50, 12, 88), y: clamp(Number(a.y) || 60, 22, 80), s: clamp((Number(a.s) || 1) * 0.8, 0.6, 1.2) })), 'ct-next__art'),
      h('span', { class: 'ct-next__body' },
        h('span', { class: 'eyebrow' }, seen ? 'Sigue aquí' : 'Empieza aquí'),
        h('span', { class: 'ct-next__title' }, txt(upNext.title)),
        h('span', { class: 'ct-next__btn' }, deco('▶️'), 'Ver lección')))
      : h('p', { class: 'ct-alldone' }, deco('🎉'), '¡Viste todas las lecciones! Puedes repetir tus favoritas cuando quieras.');

    const groups = [...UNITS, { key: '', title: 'Más lecciones', sub: '', icon: '🌟', c1: '#e6f6ff', c2: '#9fd8ff' }]
      .map(u => ({ u, items: lessons.filter(l => (u.key ? l.unit === u.key : !UNIT_ORDER.includes(l.unit))) }))
      .filter(g => g.items.length);

    return {
      title: 'Lecciones',
      chip: { icon: '🎬', text: `${seen}/${lessons.length}`, label: `Lecciones vistas: ${seen} de ${lessons.length}` },
      body: [
        h('div', { class: 'ct-intro' },
          h('h2', null, 'Lecciones animadas'),
          h('p', null, 'Mira, escucha y responde. Cada lección es como un pequeño video.')),
        progressMeter((seen / lessons.length) * 100, 'var(--coral)', `Lecciones vistas: ${seen} de ${lessons.length}`),
        feature,
        groups.map(({ u, items }) => {
          const n = items.filter(seenOf).length;
          const sec = h('section', { class: 'ct-unit', 'aria-label': u.title },
            h('div', { class: 'ct-unit__head' },
              h('span', { class: 'ct-unit__icon', 'aria-hidden': 'true' }, u.icon),
              h('div', { class: 'ct-unit__names' }, h('h2', null, u.title), u.sub ? h('p', null, u.sub) : null),
              h('span', { class: 'ct-count', 'aria-label': `Vistas ${n} de ${items.length}` }, `${n}/${items.length}`)),
            h('div', { class: 'ct-list' }, items.map(item)));
          sec.style.setProperty('--c1', u.c1);
          sec.style.setProperty('--c2', u.c2);
          return sec;
        }),
      ],
    };
  }

  await show(params.view === 'lecciones' ? 'lecciones' : 'hub');

  return {
    back() { if (view === 'lecciones') { show('hub'); return true; } return false; },
    unmount() { life.end(); sh.root.remove(); },
  };
}
