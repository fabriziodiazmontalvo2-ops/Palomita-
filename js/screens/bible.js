// Pantalla "Mi Biblia": la sección de lectura de Palomita.
//
//   Pestañas: historias (Antiguo Testamento, Nuevo Testamento y Milagros de Jesús) · parábolas · oraciones
//   (con «Escuchar» renglón por renglón y «Rezar juntos») · catecismo ("Mi camino", por unidades) · versículos.
//   mount(el, params)
//     params.tab     'historias' | 'parabolas' | 'oraciones' | 'catecismo' | 'versiculos'
//     params.story / params.parable / params.prayer / params.topic   id de una lectura para abrirla directamente
//     params.shelf   'at' | 'nt' | 'mi'  (opcional, con params.story: estante de la historia)
//
// Los contenidos (js/data/*.js) se cargan con import() dinámico: si un archivo todavía no existe,
// su pestaña muestra "Muy pronto" y nada se rompe. Todos los textos se insertan como texto, nunca como HTML.
// La pantalla recuerda dónde está el niño escribiendo en `params` (el router los guarda para "volver").
import * as state from '../core/state.js';
import * as tts from '../core/tts.js';
import { h, clear, button, iconButton, toast, meter, reduceMotion } from '../core/ui.js';
import { sfx } from '../core/audio.js';
import { go, back } from '../core/router.js';
import * as R from '../core/reminders.js';
import { sceneEl, SCENE_IDS, isFloating, hasOrb } from '../art/scenes.js';

// ───────────────────────── Datos fijos de la pantalla ─────────────────────────

const TABS = [
  { id: 'historias', label: 'Historias', icon: '📖' },
  { id: 'parabolas', label: 'Parábolas', icon: '🌾' },
  { id: 'oraciones', label: 'Oraciones', icon: '🙏' },
  { id: 'catecismo', label: 'Mi camino', icon: '⛪' },
  { id: 'versiculos', label: 'Versículos', icon: '💌' },
];
const TAB_IDS = TABS.map(t => t.id);
const TAB_OF = { story: 'historias', parable: 'parabolas', prayer: 'oraciones', topic: 'catecismo' };

const SHELVES = [
  { key: 'at', title: 'Antiguo Testamento', sub: 'Dios prepara a su pueblo', icon: '📜', color: 'var(--sun-deep)' },
  { key: 'nt', title: 'Nuevo Testamento', sub: 'Jesús está con nosotros', icon: '✨', color: 'var(--sky-deep)' },
  { key: 'mi', title: 'Milagros de Jesús', sub: 'Jesús sana, ayuda y cuida', icon: '🌟', color: 'var(--grape)' },
];
const SHELF_KEYS = SHELVES.map(sh => sh.key);

// Unidades del camino a la Primera Comunión.
const UNITS = [
  { key: 'creo', title: 'Creo', sub: 'Lo que creemos', icon: '✝️' },
  { key: 'celebro', title: 'Celebro', sub: 'Los sacramentos', icon: '🍞' },
  { key: 'vivo', title: 'Vivo', sub: 'Vivir como Jesús', icon: '❤️' },
  { key: 'rezo', title: 'Rezo', sub: 'Hablar con Dios', icon: '🙏' },
];
const UNIT_KEYS = UNITS.map(u => u.key);

const PRAYER_GROUPS = [
  { key: 'basicas', title: 'Las primeras oraciones' },
  { key: 'dia', title: 'Durante el día' },
  { key: 'misa', title: 'En la Misa' },
  { key: 'maria', title: 'A María' },
  { key: 'comunion', title: 'Para comulgar' },
  { key: 'parroquia', title: 'De mi parroquia' },
];
const OTHER_GROUP = { key: 'otras', title: 'Más oraciones' };

const THEMES = [
  { key: 'amor', title: 'Amor', icon: '❤️' },
  { key: 'confianza', title: 'Confianza', icon: '🐑' },
  { key: 'alegria', title: 'Alegría', icon: '😊' },
  { key: 'perdon', title: 'Perdón', icon: '🤝' },
  { key: 'oracion', title: 'Oración', icon: '🙏' },
  { key: 'eucaristia', title: 'Eucaristía', icon: '🍞' },
  { key: 'paz', title: 'Paz', icon: '🕊️' },
  { key: 'valentia', title: 'Valentía', icon: '🦁' },
  { key: 'gratitud', title: 'Gratitud', icon: '🌻' },
  { key: 'servicio', title: 'Servicio', icon: '🤲' },
];

// Fondo pintado de cada parábola (js/art/scenes.js).
const PARABLE_BG = { noe: 'cielo', oveja: 'campo', sembrador: 'campo', samaritano: 'desierto', roca: 'tormenta', talentos: 'dorado',
  mostaza: 'jardin', prodigo: 'amanecer', perla: 'mar', panes: 'campo', luz: 'noche' };

const FONT_SCALES = [0.88, 1, 1.14, 1.3, 1.46];
const LEARN_STEPS = [0, 0.3, 0.55, 0.8, 1.01];   // fracción de palabras escondidas en cada paso del modo "Aprender"

// Premios (Fe, experiencia y semillas).
const PRIZE = {
  read: { fe: 6, xp: 8, coins: 5 },
  quiz: { coins: 10 },
  catechism: { coins: 10, fe: 5 },
  prayFirst: 4,
  prayAgain: 1,
};

// ───────────────────────── Carga perezosa de contenidos ─────────────────────────

const LOADERS = {
  at: () => import('../data/bible-at.js').then(m => m.STORIES_AT),
  nt: () => import('../data/bible-nt.js').then(m => m.STORIES_NT),
  mi: () => import('../data/bible-milagros.js').then(m => m.STORIES_MILAGROS),
  parables: () => import('../data/parables.js').then(m => m.PARABLES),
  // Las oraciones de siempre, más las nuevas (Gloria, Credo largo, Ángelus…). Si la catequista eligió otro
  // Acto de contrición (Mi parroquia → Costumbres), se muestra ese con el mismo id.
  prayers: () => Promise.all([import('../data/prayers.js'), import('../data/oraciones-extra.js').catch(() => ({}))]).then(([a, b]) => {
    const extra = Array.isArray(b.PRAYERS_EXTRA) ? b.PRAYERS_EXTRA : [];
    const cc = R.customs().contrition;
    const v = cc && cc !== 'jesus-mi-senor' && Array.isArray(b.CONTRITION_VARIANTS) ? b.CONTRITION_VARIANTS.find(x => x.id === cc) : null;
    const base = (a.PRAYERS || []).map(p => (p.id === 'acto-de-contricion' && v ? { ...p, lines: v.lines, note: 'Es la versión que enseñan en tu parroquia. Se reza en la Confesión y también por la noche.' } : p));
    return [...base, ...extra.filter(x => !base.some(p => p.id === x.id))];
  }),
  catechism: () => import('../data/catechism.js').then(m => m.CATECHISM),
  verses: () => import('../data/verses.js').then(m => m.VERSES),
  games: () => import('../games/registry.js').then(m => m.GAMES),
};
const cache = {};
async function load(key) {
  if (cache[key]) return cache[key];
  try {
    const data = await LOADERS[key]();
    if (data && typeof data === 'object') { if (key !== 'prayers') cache[key] = data; return data; }   // las oraciones dependen de las costumbres
  } catch { /* ese contenido todavía no existe: la pestaña dirá "Muy pronto" */ }
  return null;
}

// ───────────────────────── Utilidades pequeñas ─────────────────────────

const arr = v => (Array.isArray(v) ? v.filter(x => x !== null && x !== undefined) : []);
const txt = v => (typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v));
const deco = icon => h('span', { 'aria-hidden': 'true' }, icon);
const smooth = () => (reduceMotion() ? 'auto' : 'smooth');
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
// Número pseudoaleatorio estable (0..1) para un índice: así las palabras escondidas no cambian al repintar.
const stable = i => { const x = Math.sin((i + 1) * 12.9898) * 43758.5453; return x - Math.floor(x); };

function dayNumber() {
  const d = new Date();
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);
}
function todayLabel() {
  try {
    const s = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  } catch { return ''; }
}

const SVG_NS = 'http://www.w3.org/2000/svg';
function svg(viewBox, cls, d, attrs = {}) {
  const el = document.createElementNS(SVG_NS, 'svg');
  el.setAttribute('viewBox', viewBox);
  el.setAttribute('aria-hidden', 'true');
  el.setAttribute('focusable', 'false');
  el.setAttribute('class', cls);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', d);
  el.append(path);
  return el;
}
const heartIcon = () => svg('0 0 24 24', 'bb-heart__svg',
  'M12 20.6s-7.4-4.5-9.4-9.1C1.1 8 3 4.6 6.6 4.6c2 0 3.6 1 5.4 3 1.8-2 3.4-3 5.4-3 3.6 0 5.5 3.4 4 6.9-2 4.6-9.4 9.1-9.4 9.1z');
const trailIcon = () => svg('0 0 100 36', 'bb-trail', 'M2 0 C 2 26, 98 10, 98 36', { preserveAspectRatio: 'none' });

// Ilustración: un paisaje pintado (js/art/scenes.js) y los emojis compuestos como una pequeña escena.
// Los que vuelan (sol, estrellas, aves…) van arriba; los demás se apoyan en el suelo con su sombrita:
// el primero es el protagonista y los más pequeños quedan un poco más atrás (más arriba en el cuadro).
//   size  'card' (estantes) · 'thumb' (tarjeta «Sigue leyendo») · 'mini' (lista de parábolas) · 'hero' (portada del lector)
function art(spec, size = 'card') {
  const bg = SCENE_IDS.includes(spec?.bg) ? spec.bg : 'cielo';
  const sky = [], ground = [];
  for (const e of arr(spec?.emojis).map(txt).filter(Boolean).slice(0, size === 'mini' ? 1 : 4)) (isFloating(e) ? sky : ground).push(e);
  if (!ground.length && sky.length) ground.push(sky.shift());
  const box = sceneEl(bg, { shape: size === 'hero' ? 'hero' : 'card', ambient: size === 'hero' ? 'full' : false, cls: `bb-art bb-art--${size}`, orb: !hasOrb([...sky, ...ground]) });
  const G = { 1: [[50, 1.3]], 2: [[36, 1.22], [70, 0.9]], 3: [[50, 1.2], [19, 0.82], [81, 0.82]], 4: [[38, 1.14], [13, 0.72], [63, 0.92], [88, 0.72]] }[ground.length] || [];
  const K = { 1: [[80, 14]], 2: [[17, 16], [83, 10]], 3: [[15, 18], [85, 10], [50, 6]] }[sky.length] || [];
  const piece = (e, kind, x, k, y) => {
    const s = h('span', { class: `bb-art__e bb-art__e--${kind}` }, e);
    s.style.setProperty('--x', `${x}%`);
    s.style.setProperty('--k', k);
    if (y !== undefined) s.style.setProperty('--y', `${y}%`);
    return s;
  };
  ground.forEach((e, i) => box.append(piece(e, 'ground', G[i][0], G[i][1])));
  sky.forEach((e, i) => box.append(piece(e, 'sky', K[i][0], ground.length > 2 ? 0.62 : 0.72, K[i][1])));
  return box;
}

// Tarjeta amable para los contenidos que todavía no están.
function soon(title = 'Muy pronto', text = 'Estamos preparando esta parte con mucho cariño. ¡Vuelve pronto!', icon = '🪺') {
  return h('div', { class: 'bb-soon' },
    h('div', { class: 'bb-soon__icon', 'aria-hidden': 'true' }, icon),
    h('h2', null, title),
    h('p', null, text));
}

function progressCard({ icon, title, value, color, note }) {
  const m = meter(value, color);
  m.setAttribute('role', 'progressbar');
  m.setAttribute('aria-valuemin', '0');
  m.setAttribute('aria-valuemax', '100');
  m.setAttribute('aria-valuenow', String(Math.round(value)));
  m.setAttribute('aria-label', title);
  return h('div', { class: 'bb-progress' },
    h('p', { class: 'bb-progress__title' }, deco(icon), title),
    m,
    note ? h('p', { class: 'bb-progress__note' }, note) : null);
}

function verseCard(verse) {
  if (!verse || !txt(verse.text)) return null;
  return h('blockquote', { class: 'bb-verse' },
    h('span', { class: 'bb-verse__mark', 'aria-hidden': 'true' }, '“'),
    h('p', null, txt(verse.text)),
    verse.ref ? h('cite', null, txt(verse.ref)) : null);
}

function note(kind, icon, title, text) {
  if (!txt(text)) return null;
  return h('section', { class: `bb-note bb-note--${kind}` },
    h('h3', null, deco(icon), title),
    h('p', null, txt(text)));
}

function rewardRow(items) {
  return h('div', { class: 'bb-reward', role: 'status' },
    items.map(([icon, text]) => h('span', null, deco(icon), text)));
}

// ───────────────────────── Pantalla ─────────────────────────

export async function mount(el, params = {}) {
  let dead = false;
  let token = 0;          // cada cambio de vista invalida a las cargas anteriores
  let view = null;        // { kind: 'index' | 'story' | 'parable' | 'prayer' | 'topic', tab, id? }
  let viewOffs = [];      // limpieza de la vista actual
  const timers = new Set();
  const memo = {};        // posición de lectura de cada índice, para volver al mismo lugar

  const later = (fn, ms) => {
    const id = setTimeout(() => { timers.delete(id); if (!dead) fn(); }, ms);
    timers.add(id);
    return id;
  };

  // ── Armazón: barra superior, pestañas tipo separadores de libro y la hoja de papel ──
  const titleEl = h('h1', null, 'Mi Biblia');
  const chip = h('span', { class: 'chip bb-chip', hidden: true });
  const tabBtns = new Map();
  const tabsEl = h('div', { class: 'bb-tabs', role: 'tablist', 'aria-label': 'Secciones de Mi Biblia', onkeydown: onTabKey },
    TABS.map(t => {
      const b = h('button', { type: 'button', class: 'bb-tab', role: 'tab', id: `bb-tab-${t.id}`, 'aria-controls': 'bb-panel', 'aria-selected': 'false', tabindex: '-1',
        dataset: { tab: t.id }, onclick: () => pickTab(t.id) },
        h('span', { class: 'bb-tab__icon', 'aria-hidden': 'true' }, t.icon),
        h('span', { class: 'bb-tab__label' }, t.label));
      tabBtns.set(t.id, b);
      return b;
    }));
  const scroll = h('div', { class: 'scroll bb-scroll', id: 'bb-panel', tabindex: '-1' });
  let stopHook = null;      // lo que detiene la lectura en curso (voz o resaltado por tiempo)
  const stopPill = h('button', { type: 'button', class: 'bb-stop', hidden: true, onclick: () => { sfx('tap'); if (stopHook) stopHook(); else tts.stop(); } }, deco('⏹️'), 'Detener');
  const page = h('div', { class: 'bb-page' }, scroll, stopPill);
  const root = h('div', { class: 'bb' },
    h('header', { class: 'topbar bb-top' }, iconButton('↩️', 'Volver', () => goBack()), titleEl, chip),
    tabsEl, page);
  el.append(root);

  // ── Tamaño de letra (se recuerda en los ajustes) ──
  function scaleIndex() {
    const saved = Number(state.setting('fontScale')) || 1;
    let best = 1;
    FONT_SCALES.forEach((s, i) => { if (Math.abs(s - saved) < Math.abs(FONT_SCALES[best] - saved)) best = i; });
    return best;
  }
  function applyScale() { root.style.setProperty('--bb-fs', String(FONT_SCALES[scaleIndex()])); }
  applyScale();

  function fontControl() {
    const minus = h('button', { type: 'button', class: 'bb-font__btn bb-font__btn--minus', 'aria-label': 'Letra más pequeña', title: 'Letra más pequeña', onclick: () => step(-1) }, 'A', deco('−'));
    const plus = h('button', { type: 'button', class: 'bb-font__btn bb-font__btn--plus', 'aria-label': 'Letra más grande', title: 'Letra más grande', onclick: () => step(1) }, 'A', deco('+'));
    const sync = () => { const i = scaleIndex(); minus.disabled = i <= 0; plus.disabled = i >= FONT_SCALES.length - 1; };
    function step(d) {
      const i = Math.max(0, Math.min(FONT_SCALES.length - 1, scaleIndex() + d));
      sfx('tap');
      state.setSetting('fontScale', FONT_SCALES[i]);
      applyScale();
      sync();
    }
    sync();
    return h('div', { class: 'bb-font', role: 'group', 'aria-label': 'Tamaño de la letra' }, minus, plus);
  }

  // ── Lectura en voz alta: el botón se convierte en "Detener"; si el botón sale de la vista aparece una pastilla flotante ──
  function listenButton(getText, { label = 'Escuchar' } = {}) {
    if (!tts.available() || state.setting('voice') === false) return null;
    let on = false, visible = true;
    const icon = deco('🔊');
    const text = h('span', null, label);
    const b = h('button', { type: 'button', class: 'btn btn--sky btn--sm bb-listen', 'aria-pressed': 'false', onclick: toggle }, icon, text);
    const paint = () => { stopPill.hidden = !(on && !visible); };
    function set(v) {
      on = v;
      icon.textContent = v ? '⏹️' : '🔊';
      text.textContent = v ? 'Detener' : label;
      b.setAttribute('aria-pressed', String(v));
      b.classList.toggle('is-on', v);
      paint();
    }
    function toggle() {
      sfx('tap');
      if (on) { tts.stop(); return; }
      set(true);
      if (!tts.speak(getText(), { onend: () => set(false) })) set(false);
    }
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => { visible = entries[entries.length - 1].isIntersecting; paint(); }, { root: scroll });
      io.observe(b);
      viewOffs.push(() => io.disconnect());
    }
    viewOffs.push(() => { stopPill.hidden = true; });
    return b;
  }

  function tools(getText) {
    return h('div', { class: 'bb-tools' }, listenButton(getText), fontControl());
  }

  // ── Portada del lector: la ilustración se queda un poquito atrás al bajar (profundidad)
  //    y una barrita arriba muestra cuánto falta para terminar la lectura ──
  function readerHero(spec) {
    const pic = art(spec, 'hero');
    const wrap = h('div', { class: 'bb-hero' }, pic);
    const bar = h('div', { class: 'bb-readbar', 'aria-hidden': 'true' }, h('i'));
    page.append(bar);
    const still = reduceMotion();
    let raf = 0;
    const paint = () => {
      raf = 0;
      const y = scroll.scrollTop, max = scroll.scrollHeight - scroll.clientHeight;
      bar.firstChild.style.transform = `scaleX(${max > 8 ? Math.min(1, y / max).toFixed(4) : 0})`;
      if (!still && y < 420) pic.style.transform = `translate3d(0, ${(y * 0.42).toFixed(1)}px, 0) scale(${(1 + y * 0.00035).toFixed(4)})`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(paint); };
    scroll.addEventListener('scroll', onScroll, { passive: true });
    viewOffs.push(() => { scroll.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); bar.remove(); });
    return wrap;
  }

  // ── Pequeña celebración (no se muestra si el niño prefiere menos movimiento) ──
  function celebrate(icons = ['✨', '⭐', '💛', '🌟']) {
    if (reduceMotion()) return;
    const layer = h('div', { class: 'bb-burst', 'aria-hidden': 'true' });
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + stable(i) * 0.6;
      const r = 90 + stable(i + 20) * 90;
      const s = h('span', null, icons[i % icons.length]);
      s.style.setProperty('--dx', `${Math.round(Math.cos(a) * r)}px`);
      s.style.setProperty('--dy', `${Math.round(Math.sin(a) * r - 40)}px`);
      s.style.setProperty('--rot', `${Math.round((stable(i + 40) - 0.5) * 120)}deg`);
      s.style.animationDelay = `${Math.round(stable(i + 60) * 120)}ms`;
      layer.append(s);
    }
    page.append(layer);
    later(() => layer.remove(), 1500);
  }

  // ── Navegación interna ──
  const VIEWS = {
    index: v => INDEX[v.tab](),
    story: v => storyView(v.id, v.shelf),
    parable: v => parableView(v.id),
    prayer: v => prayerView(v.id),
    topic: v => topicView(v.id),
  };

  function endView() {
    tts.stop();
    for (const off of viewOffs.splice(0)) { try { off(); } catch (e) { console.error(e); } }
  }

  async function show(next, { restore = false } = {}) {
    const my = ++token;
    endView();
    if (view?.kind === 'index') memo[view.tab] = scroll.scrollTop;
    view = next;
    // Recordar el lugar: si el niño va a un juego y vuelve, la Biblia se abre donde la dejó.
    for (const k of Object.keys(TAB_OF)) delete params[k];
    delete params.shelf;
    params.tab = next.tab;
    if (next.kind !== 'index') params[next.kind] = next.id;
    if (next.kind === 'story' && next.shelf) params.shelf = next.shelf;
    root.dataset.view = next.kind === 'index' ? 'index' : 'reader';
    for (const [id, b] of tabBtns) {
      const sel = id === next.tab;
      b.setAttribute('aria-selected', String(sel));
      b.tabIndex = sel ? 0 : -1;
    }
    if (next.kind === 'index') { scroll.setAttribute('role', 'tabpanel'); scroll.setAttribute('aria-labelledby', `bb-tab-${next.tab}`); }
    else { scroll.removeAttribute('role'); scroll.removeAttribute('aria-labelledby'); }
    if (!scroll.firstChild) scroll.append(h('p', { class: 'bb-loading' }, 'Abriendo el libro…'));

    let out = null;
    try { out = await VIEWS[next.kind](next); } catch (e) { console.error('[biblia]', e); }
    if (dead || my !== token) return;
    if (!out && next.kind !== 'index') { await show({ kind: 'index', tab: next.tab }); return; }
    if (!out) out = { body: soon() };

    titleEl.textContent = out.title || 'Mi Biblia';
    clear(chip);
    chip.hidden = !out.chip;
    if (out.chip) {
      if (out.chip.icon) chip.append(deco(out.chip.icon));
      chip.append(out.chip.text);
      chip.setAttribute('aria-label', out.chip.label || out.chip.text);
    }
    clear(scroll).append(h('div', { class: `bb-view bb-view--${next.kind}` }, out.body));
    scroll.scrollTop = restore ? (memo[next.tab] || 0) : 0;
  }

  function open(kind, id) {
    sfx('page');
    return show({ kind, tab: TAB_OF[kind], id: String(id) });
  }
  function pickTab(id) {
    if (view?.kind === 'index' && view.tab === id) { scroll.scrollTo({ top: 0, behavior: smooth() }); return; }
    sfx('page');
    show({ kind: 'index', tab: id });
  }
  function goBack() {
    if (!view || view.kind === 'index') { back(); return; }
    show({ kind: 'index', tab: view.tab }, { restore: true });
  }
  function onTabKey(e) {
    const i = TAB_IDS.indexOf(e.target?.dataset?.tab);
    if (i < 0) return;
    const n = TAB_IDS.length;
    const j = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
    if (j < 0) return;
    e.preventDefault();
    tabBtns.get(TAB_IDS[j]).focus();
  }
  function onKey(e) {
    if (e.key !== 'Escape' || !root.isConnected) return;
    if (document.querySelector('.modal-scrim, .game')) return;   // primero se cierra lo que esté encima
    goBack();
  }
  window.addEventListener('keydown', onKey);

  // ── Piezas compartidas por los lectores ──

  // Preguntas: una por pantalla, botones grandes, explicación al responder y se puede repetir.
  function quizBlock(questions, { key, prize = PRIZE.quiz, title = '¿Qué aprendiste?' }) {
    const qs = arr(questions).filter(q => q && arr(q.options).length >= 2);
    if (!qs.length) return null;
    const box = h('section', { class: 'bb-quiz', 'aria-label': 'Preguntas' });
    let i = 0, marks = [];

    const head = () => h('div', { class: 'bb-quiz__head' },
      h('h3', null, deco('🎯'), title),
      h('div', { class: 'bb-dots', 'aria-hidden': 'true' }, qs.map((_, k) => h('i', {
        class: k < marks.length ? (marks[k] ? 'is-ok' : 'is-no') : k === i && marks.length < qs.length ? 'is-now' : '' }))));

    function ask() {
      const q = qs[i];
      const opts = arr(q.options).map((o, k) => h('button', { type: 'button', class: 'bb-opt', onclick: () => answer(k) },
        h('span', { class: 'bb-opt__k', 'aria-hidden': 'true' }, 'ABCD'[k] || '•'),
        h('span', { class: 'bb-opt__t' }, txt(o))));
      const fb = h('div', { class: 'bb-fb', role: 'status', 'aria-live': 'polite', hidden: true });
      clear(box).append(head(),
        h('p', { class: 'bb-quiz__n' }, `Pregunta ${i + 1} de ${qs.length}`),
        h('p', { class: 'bb-quiz__q' }, txt(q.q)),
        h('div', { class: 'bb-opts' }, opts), fb);

      function answer(k) {
        const right = k === q.answer;
        marks.push(right);
        sfx(right ? 'good' : 'wrong');
        opts.forEach((b, n) => {
          b.disabled = true;
          if (n === q.answer) { b.classList.add('is-right'); b.firstChild.textContent = '✓'; }
          else if (n === k) { b.classList.add('is-wrong'); b.firstChild.textContent = '✕'; }
        });
        box.replaceChild(head(), box.firstChild);
        const last = i === qs.length - 1;
        const nextBtn = button(last ? 'Ver mi resultado' : 'Siguiente pregunta', { kind: last ? 'sun' : 'sky', small: true, onClick: () => { if (last) finish(); else { i++; ask(); box.scrollIntoView({ behavior: smooth(), block: 'nearest' }); } } });
        fb.classList.add(right ? 'is-ok' : 'is-no');
        fb.append(h('p', { class: 'bb-fb__title' }, deco(right ? '🌟' : '💡'), right ? '¡Muy bien!' : `Casi. La respuesta es: ${txt(q.options[q.answer])}`));
        if (q.explain) fb.append(h('p', { class: 'bb-fb__text' }, txt(q.explain)));
        fb.append(nextBtn);
        fb.hidden = false;
        nextBtn.focus({ preventScroll: true });
        fb.scrollIntoView({ behavior: smooth(), block: 'nearest' });
      }
    }

    function finish() {
      const hits = marks.filter(Boolean).length;
      const first = state.markQuiz(key);
      const gains = [];
      if (first) {
        if (prize.coins) { state.addCoins(prize.coins); gains.push([state.COIN.icon, `+${prize.coins} ${state.COIN.name}`]); }
        if (prize.fe) { state.addStat('fe', prize.fe); gains.push(['🕯️', `+${prize.fe} de Fe`]); }
        sfx('win');
        celebrate();
      } else sfx(hits === qs.length ? 'sticker' : 'sparkle');
      const msg = hits === qs.length ? '¡Excelente! Respondiste todo muy bien.'
        : hits === 0 ? '¡Gracias por intentarlo! Vuelve a leer con calma y prueba otra vez.'
          : `¡Buen trabajo! Acertaste ${hits} de ${qs.length}.`;
      i = qs.length;
      clear(box).append(head(),
        h('div', { class: 'bb-result' },
          h('div', { class: 'bb-stars', role: 'img', 'aria-label': `${hits} de ${qs.length} respuestas correctas` },
            marks.map(ok => h('span', { class: ok ? '' : 'is-off', 'aria-hidden': 'true' }, '⭐'))),
          h('p', { class: 'bb-result__msg', role: 'status' }, msg),
          gains.length ? rewardRow(gains) : null,
          button('Responder otra vez', { kind: 'ghost', small: true, icon: '🔄', onClick: start })));
      box.scrollIntoView({ behavior: smooth(), block: 'nearest' });
      onProgress();
    }

    function start() { i = 0; marks = []; ask(); }
    start();
    return box;
  }

  // Cuando cambia algo del progreso mientras se lee, no hay nada más que repintar aquí:
  // los índices se vuelven a armar cada vez que se abren.
  function onProgress() { /* reservado */ }

  // Final de una lectura: "¡La leí!" (premia la primera vez) y después las preguntas.
  function ending({ readId, quizKey, quiz, what = 'esta historia' }) {
    const box = h('div', { class: 'bb-end' });
    const quizEl = quizBlock(quiz, { key: quizKey });
    function paint(how) {
      clear(box);
      if (!state.isRead(readId)) {
        box.append(h('p', { class: 'bb-end__ask' }, '¿Ya terminaste de leer?'),
          button('¡La leí!', { kind: 'leaf', icon: '✅', sound: null, onClick: done }));
        return;
      }
      box.append(h('p', { class: 'bb-end__done' }, deco('✅'), how ? '¡Muy bien! Terminaste de leer.' : `Ya leíste ${what}.`));
      if (how === 'first') {
        box.append(rewardRow([['🕯️', `+${PRIZE.read.fe} de Fe`], ['⭐', `+${PRIZE.read.xp} de experiencia`], [state.COIN.icon, `+${PRIZE.read.coins} ${state.COIN.name}`]]));
      }
      if (quizEl) box.append(quizEl);
    }
    function done() {
      const first = state.markRead(readId);
      if (first) {
        state.addStat('fe', PRIZE.read.fe);
        state.addXp(PRIZE.read.xp);
        state.addCoins(PRIZE.read.coins);
        sfx('win');
        celebrate();
      } else sfx('good');
      paint(first ? 'first' : 'again');
      later(() => box.scrollIntoView({ behavior: smooth(), block: 'start' }), 60);
    }
    paint();
    return box;
  }

  function navRow(prev, next) {
    if (!prev && !next) return null;
    const btn = (item, cls, label) => item
      ? h('button', { type: 'button', class: `bb-nav__btn ${cls}`, onclick: () => { sfx('page'); item.go(); } },
        h('span', { class: 'bb-nav__label' }, label), h('span', { class: 'bb-nav__title' }, item.title))
      : h('span');
    return h('nav', { class: 'bb-nav', 'aria-label': 'Más lecturas' }, btn(prev, 'bb-nav__btn--prev', 'Anterior'), btn(next, 'bb-nav__btn--next', 'Siguiente'));
  }

  // ───────────────────────── 1. Historias ─────────────────────────

  async function stories() {
    const data = await Promise.all(SHELF_KEYS.map(k => load(k)));
    const lists = {};
    SHELF_KEYS.forEach((k, i) => { lists[k] = arr(data[i]).filter(s => s.id); });
    return { lists, all: SHELVES.flatMap(sh => lists[sh.key].map(s => ({ s, shelf: sh }))) };
  }
  const openStory = (id, shelf) => { sfx('page'); return show({ kind: 'story', tab: 'historias', id: String(id), shelf }); };

  function storyCard(s, shelfKey) {
    const read = state.isRead(s.id);
    const star = state.quizDone(`story:${s.id}`);
    return h('button', { type: 'button', class: `bb-card${read ? ' is-read' : ''}`, dataset: { story: s.id, shelf: shelfKey },
      'aria-label': `${txt(s.title)}. ${txt(s.ref)}.${read ? ' Ya la leíste.' : ''}`, onclick: () => openStory(s.id, shelfKey) },
    art(s.art, 'card'),
    read ? h('span', { class: 'bb-card__done', 'aria-hidden': 'true' }) : null,
    star ? h('span', { class: 'bb-card__star', 'aria-hidden': 'true' }, '⭐') : null,
    h('span', { class: 'bb-card__body' },
      h('span', { class: 'bb-card__title' }, txt(s.title)),
      h('span', { class: 'bb-card__ref' }, txt(s.ref))));
  }

  function shelf(sh, list) {
    const done = list.filter(s => state.isRead(s.id)).length;
    const sec = h('section', { class: `bb-shelf bb-shelf--${sh.key}`, 'aria-label': sh.title, dataset: { shelf: sh.key } },
      h('div', { class: 'bb-shelf__head' },
        h('span', { class: 'bb-shelf__icon', 'aria-hidden': 'true' }, sh.icon),
        h('div', { class: 'bb-shelf__names' }, h('h2', null, sh.title), h('p', null, sh.sub)),
        list.length ? h('span', { class: 'bb-count', 'aria-label': `Leídas ${done} de ${list.length}` }, `${done}/${list.length}`) : null));
    if (!list.length) {
      sec.append(h('p', { class: 'bb-shelf__soon' }, deco('🪺'), 'Muy pronto habrá historias en este estante.'));
      return sec;
    }
    // Avance propio de cada estante.
    const m = meter((done / list.length) * 100, sh.color);
    m.classList.add('bb-shelf__meter');
    m.setAttribute('role', 'progressbar');
    m.setAttribute('aria-valuemin', '0');
    m.setAttribute('aria-valuemax', '100');
    m.setAttribute('aria-valuenow', String(Math.round((done / list.length) * 100)));
    m.setAttribute('aria-label', `${sh.title}: ${done} de ${list.length} leídas`);
    sec.append(m);
    // Las tarjetas van de dos en dos: cada pareja se apoya en su tabla del estante.
    for (let i = 0; i < list.length; i += 2) sec.append(h('div', { class: 'bb-row' }, list.slice(i, i + 2).map(s => storyCard(s, sh.key))));
    return sec;
  }

  async function indexHistorias() {
    const { lists, all } = await stories();
    if (!all.length) return { body: soon('Muy pronto', 'Las historias de la Biblia están por llegar a tus estantes.', '📚') };
    const read = all.filter(x => state.isRead(x.s.id)).length;
    const nextItem = all.find(x => !state.isRead(x.s.id));
    const upNext = nextItem?.s;
    const feature = upNext
      ? h('button', { type: 'button', class: 'bb-feature', onclick: () => openStory(upNext.id, nextItem.shelf.key) },
        art(upNext.art, 'thumb'),
        h('span', { class: 'bb-feature__body' },
          h('span', { class: 'eyebrow' }, read ? 'Sigue leyendo' : 'Empieza aquí'),
          h('span', { class: 'bb-feature__title' }, txt(upNext.title)),
          h('span', { class: 'bb-feature__sum' }, txt(upNext.summary))),
        h('span', { class: 'bb-chev', 'aria-hidden': 'true' }))
      : h('p', { class: 'bb-alldone' }, deco('🎉'), '¡Leíste todas las historias! Puedes volver a tus favoritas cuando quieras.');
    return {
      chip: { icon: '📖', text: `${read}/${all.length}`, label: `Historias leídas: ${read} de ${all.length}` },
      body: [
        progressCard({ icon: '📚', title: `Leídas ${read} de ${all.length}`, value: (read / all.length) * 100, color: 'var(--coral)' }),
        feature,
        SHELVES.map(sh => shelf(sh, lists[sh.key])),
      ],
    };
  }

  async function storyView(id, shelfKey) {
    const { lists, all } = await stories();
    const hit = all.find(x => x.s.id === id && (!shelfKey || x.shelf.key === shelfKey)) || all.find(x => x.s.id === id);
    if (!hit) return null;
    const { s, shelf: sh } = hit;
    // Anterior / Siguiente dentro del mismo estante.
    const list = lists[sh.key];
    const i = list.indexOf(s);
    const paragraphs = arr(s.paragraphs).map(txt);
    const link = x => x && { title: txt(x.title), go: () => show({ kind: 'story', tab: 'historias', id: x.id, shelf: sh.key }) };
    return {
      title: sh.key === 'mi' ? 'Milagros' : 'Historias',
      chip: { icon: sh.icon, text: `${i + 1} de ${list.length}`, label: `${sh.title}: historia ${i + 1} de ${list.length}` },
      body: h('article', { class: 'bb-reader' },
        readerHero(s.art),
        h('div', { class: 'bb-reader__body' },
          h('p', { class: 'bb-reader__eyebrow' }, deco(sh.icon), sh.title),
          h('h2', { class: 'bb-reader__title' }, txt(s.title)),
          s.ref ? h('p', { class: 'bb-ref' }, deco('📖'), txt(s.ref)) : null,
          tools(() => [txt(s.title), ...paragraphs]),
          h('div', { class: 'bb-text' }, paragraphs.map(p => h('p', null, p))),
          verseCard(s.verse),
          note('think', '💭', 'Para pensar', s.think),
          note('pray', '🙏', 'Oración', s.prayer),
          ending({ readId: s.id, quizKey: `story:${s.id}`, quiz: s.quiz, what: 'esta historia' }),
          navRow(link(list[i - 1]), link(list[i + 1])))),
    };
  }

  // ───────────────────────── 2. Parábolas ─────────────────────────

  async function parables() {
    const [P, games] = await Promise.all([load('parables'), load('games')]);
    const list = P ? Object.values(P).filter(p => p && p.id) : [];
    const gameOf = p => arr(games).find(g => g.parable === p.id) || null;
    return { list, gameOf };
  }
  const kindLabel = p => (p.kind === 'historia' ? 'Historia de la Biblia' : 'Parábola de Jesús');
  const parableRead = p => state.isRead(`parable:${p.id}`);

  async function indexParabolas() {
    const { list, gameOf } = await parables();
    if (!list.length) return { body: soon('Muy pronto', 'Las parábolas de Jesús están por llegar.', '🌾') };
    const read = list.filter(parableRead).length;
    return {
      chip: { icon: '🌾', text: `${read}/${list.length}`, label: `Parábolas leídas: ${read} de ${list.length}` },
      body: [
        h('div', { class: 'bb-intro' },
          h('h2', null, 'Las historias que contaba Jesús'),
          h('p', null, 'Jesús enseñaba con cuentos sencillos llamados parábolas. Lee cada una, descubre su mensaje… ¡y luego juégala!')),
        progressCard({ icon: '🌾', title: `Leídas ${read} de ${list.length}`, value: (read / list.length) * 100, color: 'var(--sun-deep)' }),
        h('div', { class: 'bb-list' }, list.map(p => {
          const g = gameOf(p);
          const item = h('button', { type: 'button', class: 'bb-item', dataset: { parable: p.id }, onclick: () => open('parable', p.id) },
            art({ bg: PARABLE_BG[p.id], emojis: [txt(p.emoji)] }, 'mini'),
            h('span', { class: 'bb-item__body' },
              h('span', { class: 'bb-item__title' }, txt(p.title)),
              h('span', { class: 'bb-item__sub' }, txt(p.ref), g ? h('span', { class: 'bb-item__tag' }, deco('🎮'), 'con juego') : null),
              h('span', { class: 'bb-item__text' }, txt(p.summary))),
            parableRead(p) ? h('span', { class: 'bb-item__done', role: 'img', 'aria-label': 'Ya la leíste' }) : h('span', { class: 'bb-chev', 'aria-hidden': 'true' }));
          if (g?.colors) { item.style.setProperty('--c1', g.colors[0]); item.style.setProperty('--c2', g.colors[1]); }
          return item;
        })),
      ],
    };
  }

  async function parableView(id) {
    const { list, gameOf } = await parables();
    const i = list.findIndex(p => p.id === id);
    if (i < 0) return null;
    const p = list[i];
    const g = gameOf(p);
    const story = arr(p.story).map(txt);
    const messages = arr(p.messages).map(txt);
    const missions = arr(p.missions).map(txt);
    const mission = missions.length ? missions[dayNumber() % missions.length] : '';
    const emojis = [...new Set([p.emoji, g?.icon, g?.scoreIcon].filter(Boolean))];
    const link = x => x && { title: txt(x.title), go: () => show({ kind: 'parable', tab: 'parabolas', id: x.id }) };
    let play = null;
    if (g) {
      play = h('section', { class: 'bb-play' },
        h('span', { class: 'bb-play__icon', 'aria-hidden': 'true' }, g.icon),
        h('div', { class: 'bb-play__text' }, h('p', { class: 'eyebrow' }, 'El juego de esta lectura'), h('h3', null, txt(g.title))),
        button('Jugar este juego', { kind: 'sun', icon: '🎮', block: true, sound: 'pop', onClick: () => { tts.stop(); go('games', { play: g.id }); } }));
      if (g.colors) { play.style.setProperty('--c1', g.colors[0]); play.style.setProperty('--c2', g.colors[1]); }
    }
    return {
      title: 'Parábolas',
      chip: { text: `${i + 1} de ${list.length}`, label: `Lectura ${i + 1} de ${list.length}` },
      body: h('article', { class: 'bb-reader' },
        readerHero({ bg: PARABLE_BG[p.id], emojis }),
        h('div', { class: 'bb-reader__body' },
          h('p', { class: 'bb-reader__eyebrow' }, deco(p.kind === 'historia' ? '📜' : '🌾'), kindLabel(p)),
          h('h2', { class: 'bb-reader__title' }, txt(p.title)),
          p.ref ? h('p', { class: 'bb-ref' }, deco('📖'), txt(p.ref)) : null,
          tools(() => [txt(p.title), ...story]),
          h('div', { class: 'bb-text' }, story.map(s => h('p', null, s))),
          verseCard(p.verse),
          messages.length ? h('section', { class: 'bb-hearts' },
            h('h3', null, deco('💛'), 'Para tu corazón'),
            h('ul', null, messages.map(m => h('li', null, m)))) : null,
          note('mission', '🌟', 'Tu misión de hoy', mission),
          note('pray', '🙏', 'Oración', p.prayer),
          ending({ readId: `parable:${p.id}`, quizKey: `parable:${p.id}`, quiz: p.quiz, what: 'esta lectura' }),
          play,
          navRow(link(list[i - 1]), link(list[i + 1])))),
    };
  }

  // ───────────────────────── 3. Oraciones ─────────────────────────

  const prayedToday = id => !!state.doneToday?.(`pray:${id}`);
  const prayCount = id => Number(state.get().prayers?.[id]) || 0;
  const groupOf = p => PRAYER_GROUPS.find(g => g.key === p.group) || OTHER_GROUP;

  async function indexOraciones() {
    const list = arr(await load('prayers')).filter(p => p.id);
    if (!list.length) return { body: soon('Muy pronto', 'Las oraciones están por llegar.', '🙏') };
    const today = list.filter(p => prayedToday(p.id)).length;
    const groups = [...PRAYER_GROUPS, OTHER_GROUP]
      .map(g => ({ g, items: list.filter(p => groupOf(p) === g) }))
      .filter(x => x.items.length);
    return {
      chip: { icon: '🙏', text: `${today} hoy`, label: `Oraciones que rezaste hoy: ${today}` },
      body: [
        h('div', { class: 'bb-intro' },
          h('h2', null, 'Hablar con Dios'),
          h('p', null, 'Rezar es conversar con Dios, que te quiere muchísimo. Elige una oración y dila despacio, con el corazón.')),
        groups.map(({ g, items }) => h('section', { class: `bb-group bb-group--${g.key}`, 'aria-label': g.title },
          h('h2', { class: 'bb-group__title' }, g.title),
          h('div', { class: 'bb-list' }, items.map(p => {
            const done = prayedToday(p.id);
            return h('button', { type: 'button', class: 'bb-item', dataset: { prayer: p.id }, onclick: () => open('prayer', p.id) },
              art({ bg: PARABLE_BG[p.id], emojis: [txt(p.emoji)] }, 'mini'),
              h('span', { class: 'bb-item__body' },
                h('span', { class: 'bb-item__title' }, txt(p.title)),
                h('span', { class: 'bb-item__text bb-item__text--one' }, `${txt(arr(p.lines)[0]).replace(/[,;:.]+$/, '')}…`)),
              done ? h('span', { class: 'bb-item__today', role: 'img', 'aria-label': 'La rezaste hoy' }, '🙏') : h('span', { class: 'bb-chev', 'aria-hidden': 'true' }));
          })))),
      ],
    };
  }

  async function prayerView(id) {
    const list = arr(await load('prayers')).filter(p => p.id);
    const i = list.findIndex(p => p.id === id);
    if (i < 0) return null;
    const p = list[i];
    const g = groupOf(p);
    const lines = arr(p.lines).map(txt).filter(Boolean);

    // Renglones: cada palabra va en su propio span para poder esconderla en el modo "Aprender".
    const words = [];
    const lineEls = lines.map(line => {
      const row = h('p', { class: 'bb-line' });
      line.split(/\s+/).filter(Boolean).forEach((w, k) => {
        const span = h('span', { class: 'bb-w' }, w);
        words.push({ el: span, rank: stable(words.length), keep: k === 0 });
        row.append(span, ' ');
      });
      row.addEventListener('click', () => peek(row));
      row.addEventListener('keydown', e => { if (learning && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); peek(row); } });
      return row;
    });

    let learning = false, level = 1;
    function peek(row) {
      if (!learning || !row.querySelector('.is-hid')) return;
      sfx('tick');
      row.classList.add('is-peek');
      later(() => row.classList.remove('is-peek'), 2600);
    }
    const pips = h('span', { class: 'bb-learn__pips', 'aria-hidden': 'true' }, LEARN_STEPS.slice(1).map(() => h('i')));
    const moreBtn = button('Esconder más', { kind: 'grape', small: true, icon: '🙈', onClick: () => { level = Math.min(LEARN_STEPS.length - 1, level + 1); paintLearn(); } });
    const lessBtn = button('Mostrar todo', { kind: 'ghost', small: true, icon: '👀', onClick: () => { level = 0; paintLearn(); } });
    const learnHint = h('p', { class: 'bb-learn__hint', role: 'status' });
    const learnPanel = h('div', { class: 'bb-learn__panel', hidden: true }, learnHint, h('div', { class: 'bb-learn__row' }, moreBtn, lessBtn, pips));
    const learnToggle = h('button', { type: 'button', class: 'btn btn--ghost btn--sm bb-learn__toggle', 'aria-pressed': 'false', onclick: () => {
      sfx('tap');
      learning = !learning;
      level = 1;
      paintLearn();
      if (learning) lineBox.scrollIntoView({ behavior: smooth(), block: 'start' });
    } }, deco('🧠'), h('span', null, 'Aprender de memoria'));
    const lineBox = h('div', { class: 'bb-lines' }, lineEls);
    const learnBox = h('div', { class: 'bb-learn' }, learnToggle, learnPanel);
    const karaoke = prayerKaraoke(lines, lineEls, lineBox);

    function paintLearn() {
      const cut = learning ? LEARN_STEPS[level] : 0;
      for (const w of words) w.el.classList.toggle('is-hid', !w.keep && w.rank < cut);
      for (const row of lineEls) {
        row.classList.remove('is-peek');
        const can = learning && !!row.querySelector('.is-hid');
        row.classList.toggle('is-tap', can);
        if (can) { row.setAttribute('role', 'button'); row.tabIndex = 0; row.setAttribute('aria-label', 'Renglón con palabras escondidas. Toca para verlas un momento.'); }
        else { row.removeAttribute('role'); row.removeAttribute('tabindex'); row.removeAttribute('aria-label'); }
      }
      learnBox.classList.toggle('is-on', learning);
      learnPanel.hidden = !learning;
      learnToggle.setAttribute('aria-pressed', String(learning));
      learnToggle.lastChild.textContent = learning ? 'Dejar de practicar' : 'Aprender de memoria';
      moreBtn.disabled = level >= LEARN_STEPS.length - 1;
      lessBtn.disabled = level === 0;
      [...pips.children].forEach((d, k) => d.classList.toggle('is-on', k < level));
      learnHint.textContent = level === 0 ? 'Aquí está completa. Léela otra vez y luego esconde palabras.'
        : level >= LEARN_STEPS.length - 1 ? '¡Casi de memoria! Solo queda la primera palabra de cada renglón.'
          : 'Dila en voz alta. Si no recuerdas una palabra, toca su renglón para verla.';
    }

    // "Amén": suma Fe (más la primera vez del día) y suena la campanita.
    const countEl = h('p', { class: 'bb-amen__count', role: 'status' });
    const paintCount = () => {
      const n = prayCount(p.id);
      countEl.textContent = n ? `Has rezado esta oración ${plural(n, 'vez', 'veces')}.` : 'Cuando termines de rezar, toca «Amén».';
    };
    const amen = h('button', { type: 'button', class: 'btn btn--grape btn--block bb-amen__btn', onclick: () => {
      const { firstToday } = state.prayed(p.id);
      const fe = firstToday ? PRIZE.prayFirst : PRIZE.prayAgain;
      state.addStat('fe', fe);
      sfx('bell');
      toast(`+${fe} de Fe`, { icon: '🕯️' });
      celebrate(['✨', '💜', '⭐', '🙏']);
      paintCount();
      amen.disabled = true;
      later(() => { amen.disabled = false; }, 2500);
    } }, 'Amén ', deco('🙏'));
    paintCount();

    const link = x => x && { title: txt(x.title), go: () => show({ kind: 'prayer', tab: 'oraciones', id: x.id }) };
    return {
      title: 'Oraciones',
      chip: prayedToday(p.id) ? { icon: '🙏', text: 'hoy', label: 'Ya rezaste esta oración hoy' } : null,
      body: h('article', { class: `bb-reader bb-prayer bb-group--${g.key}` },
        h('header', { class: 'bb-phead bb-phead--prayer' },
          h('div', { class: 'bb-phead__emoji', 'aria-hidden': 'true' }, txt(p.emoji)),
          h('p', { class: 'eyebrow' }, g.title),
          h('h2', { class: 'bb-reader__title' }, txt(p.title)),
          fontControl()),
        h('div', { class: 'bb-reader__body' },
          karaoke,
          lineBox,
          learnBox,
          note('tip', '💡', '¿Sabías que…?', p.note),
          h('div', { class: 'bb-amen' }, amen, countEl),
          navRow(link(list[i - 1]), link(list[i + 1])))),
    };
  }

  // «Escuchar»: la voz lee la oración renglón por renglón y se resalta el renglón que suena.
  // «Rezar juntos»: la voz dice un renglón, luego una pausa visible («Ahora tú», ~ el doble de lo que duró) para que el
  // niño lo repita, y sigue. Sin voz en el teléfono, el resaltado avanza por tiempo.
  function prayerKaraoke(lines, lineEls, lineBox) {
    const hasVoice = () => tts.available() && state.setting('voice') !== false;
    const est = line => 700 + 72 * txt(line).length;            // lo que tarda en leerse un renglón (sin voz)
    let mode = null, tok = 0;
    const timers = new Set();
    const wait = (fn, ms) => { const id = later(() => { timers.delete(id); fn(); }, ms); timers.add(id); };
    const you = h('span', { class: 'bb-you', 'aria-hidden': 'true' }, h('span', null, '🗣️ Ahora tú'), h('i'));
    const status = h('p', { class: 'bb-kar__status', role: 'status', 'aria-live': 'polite' });
    const mk = (cls, icon, label) => {
      const b = h('button', { type: 'button', class: `btn btn--sm ${cls}`, 'aria-pressed': 'false' }, deco(icon), h('span', null, label));
      b.dataset.icon = icon; b.dataset.label = label;
      return b;
    };
    const listenBtn = mk('btn--sky bb-kar__btn', hasVoice() ? '🔊' : '📖', hasVoice() ? 'Escuchar' : 'Leer conmigo');
    const togetherBtn = mk('btn--grape bb-kar__btn', '🗣️', 'Rezar juntos');
    listenBtn.addEventListener('click', () => { sfx('tap'); toggle('listen'); });
    togetherBtn.addEventListener('click', () => { sfx('tap'); toggle('together'); });
    const box = h('div', { class: 'bb-kar' }, h('div', { class: 'bb-kar__row' }, listenBtn, togetherBtn), status);
    let visible = true;
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => { visible = es[es.length - 1].isIntersecting; paintPill(); }, { root: scroll });
      io.observe(box);
      viewOffs.push(() => io.disconnect());
    }
    const paintPill = () => { stopPill.hidden = !(mode && !visible); };

    function mark(i, how) {
      lineEls.forEach((row, k) => {
        row.classList.toggle('is-say', k === i && how === 'say');
        row.classList.toggle('is-you', k === i && how === 'you');
        row.classList.toggle('is-past', i >= 0 && k < i);
      });
      lineBox.classList.toggle('is-kar', i >= 0);
      if (i < 0) { you.remove(); return; }
      const row = lineEls[i];
      if (how === 'you') row.append(you); else you.remove();
      const r = row.getBoundingClientRect(), sr = scroll.getBoundingClientRect();
      if (r.top < sr.top + 60 || r.bottom > sr.bottom - 80) row.scrollIntoView({ behavior: smooth(), block: 'center' });
    }
    function paint() {
      for (const [b, m] of [[listenBtn, 'listen'], [togetherBtn, 'together']]) {
        const on = mode === m;
        b.firstChild.textContent = on ? '⏹️' : b.dataset.icon;
        b.lastChild.textContent = on ? 'Detener' : b.dataset.label;
        b.setAttribute('aria-pressed', String(on));
        b.classList.toggle('is-on', on);
      }
      paintPill();
    }
    function stop(msg = '') {
      tok++;
      for (const id of timers) clearTimeout(id);
      timers.clear();
      const was = mode;
      mode = null;
      stopHook = null;
      if (was) tts.stop();
      mark(-1);
      status.textContent = msg;
      paint();
    }
    function done() {
      stop('¡Muy bien! Ahora di «Amén» con el corazón.');
      sfx('sparkle');
    }
    function toggle(m) {
      if (mode === m) { stop(); return; }
      stop();
      mode = m;
      stopHook = () => stop();
      const my = tok;
      paint();
      if (m === 'listen') listen(my); else together(my, 0);
    }
    // Escuchar: toda la oración seguida.
    function listen(my) {
      status.textContent = hasVoice() ? 'Escucha y sigue el renglón que brilla.' : 'Lee despacio el renglón que brilla.';
      if (hasVoice()) {
        const t0 = Date.now();
        let heard = false;
        const ok = tts.speak(lines, { keepLines: true,
          onIndex: i => { if (my === tok) { heard = true; mark(i, 'say'); } },
          onend: () => {
            if (my !== tok || document.hidden) return;   // si la app se fue al fondo, la oración no «terminó»
            if (!heard && Date.now() - t0 < 400) { byTime(my, 0); return; }   // la voz no pudo hablar
            done();
          } });
        if (ok) { mark(0, 'say'); return; }
      }
      byTime(my, 0);
    }
    function byTime(my, i) {
      if (my !== tok) return;
      if (i >= lines.length) { done(); return; }
      mark(i, 'say');
      wait(() => byTime(my, i + 1), est(lines[i]));
    }
    // Rezar juntos: un renglón la voz, luego «Ahora tú».
    function together(my, i) {
      if (my !== tok) return;
      if (i >= lines.length) { done(); return; }
      status.textContent = hasVoice() ? 'Escucha el renglón… y luego repítelo tú.' : 'Lee el renglón que brilla… y luego dilo tú en voz alta.';
      mark(i, 'say');
      const yourTurn = ms => {
        if (my !== tok) return;
        const pause = Math.max(1800, Math.min(10000, ms * 2));
        you.style.setProperty('--wait', `${pause}ms`);
        you.lastChild.remove();
        you.append(h('i'));                 // reinicia la barrita que se va vaciando
        mark(i, 'you');
        status.textContent = '¡Ahora tú! Repite el renglón.';
        wait(() => together(my, i + 1), pause);
      };
      if (hasVoice()) {
        const t0 = Date.now();
        const ok = tts.speak(lines[i], { onend: () => {
          if (my !== tok || document.hidden) return;
          const spent = Date.now() - t0;
          yourTurn(spent < 300 ? est(lines[i]) : spent);
        } });
        if (ok) return;
      }
      wait(() => yourTurn(est(lines[i])), est(lines[i]));
    }
    // Si la app se va al fondo (otra app, pantalla apagada), la oración se detiene: no sigue rezando sola.
    const onVis = () => { if (document.hidden && mode) stop(); };
    document.addEventListener('visibilitychange', onVis);
    viewOffs.push(() => { document.removeEventListener('visibilitychange', onVis); stop(); });
    return box;
  }

  // ───────────────────────── 4. Catecismo: "Mi camino a la Primera Comunión" ─────────────────────────

  const topicDone = c => state.quizDone(`cat:${c.id}`);
  // Los temas se ordenan por unidad (Creo · Celebro · Vivo · Rezo) sin perder el orden de cada unidad;
  // el camino numerado, «Sigue aquí» y Anterior/Siguiente usan este mismo orden.
  async function topics() {
    const list = arr(await load('catechism')).filter(c => c.id);
    const rank = c => { const r = UNIT_KEYS.indexOf(c.unit); return r < 0 ? UNIT_KEYS.length : r; };
    return list.map((c, i) => [c, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map(p => p[0]);
  }

  async function indexCatecismo() {
    const list = await topics();
    if (!list.length) return { body: soon('Muy pronto', 'Tu camino a la Primera Comunión se está preparando.', '⛪') };
    const done = list.filter(topicDone).length;
    const nextId = list.find(c => !topicDone(c))?.id;
    const step = (c, i) => {
      const isDone = topicDone(c), isNext = c.id === nextId;
      const status = isDone ? 'Terminada' : isNext ? 'Sigue aquí' : '';
      return h('li', { class: `bb-step${isDone ? ' is-done' : ''}${isNext ? ' is-next' : ''}` },
        h('button', { type: 'button', class: 'bb-step__btn', dataset: { topic: c.id },
          'aria-label': `Etapa ${i + 1}: ${txt(c.title)}.${status ? ` ${status}.` : ''}`, onclick: () => open('topic', c.id) },
        h('span', { class: 'bb-stone', 'aria-hidden': 'true' }, String(i + 1), isDone ? h('span', { class: 'bb-stone__star' }, '⭐') : null),
        h('span', { class: 'bb-step__card' },
          h('span', { class: 'bb-step__emoji', 'aria-hidden': 'true' }, txt(c.emoji)),
          h('span', { class: 'bb-step__names' },
            status ? h('span', { class: 'bb-step__status' }, status) : null,
            h('span', { class: 'bb-step__title' }, txt(c.title))))),
        trailIcon());
    };
    // Encabezados por unidad solo si los temas traen su unidad.
    const hasUnits = list.some(c => UNIT_KEYS.includes(c.unit));
    let path;
    if (!hasUnits) path = h('ol', { class: 'bb-path' }, list.map(step));
    else {
      const groups = [...UNITS, { key: '', title: 'Más temas', sub: 'Para seguir creciendo', icon: '🌟' }]
        .map(u => ({ u, items: list.filter(c => (u.key ? c.unit === u.key : !UNIT_KEYS.includes(c.unit))) }))
        .filter(g => g.items.length);
      path = h('div', { class: 'bb-units' }, groups.map(({ u, items }) => {
        const n = items.filter(topicDone).length;
        return h('section', { class: `bb-unit bb-unit--${u.key || 'mas'}`, 'aria-label': u.title },
          h('header', { class: 'bb-unit__head' },
            h('span', { class: 'bb-unit__icon', 'aria-hidden': 'true' }, u.icon),
            h('div', { class: 'bb-unit__names' }, h('h2', null, u.title), h('p', null, u.sub)),
            h('span', { class: 'bb-count', 'aria-label': `Terminadas ${n} de ${items.length}` }, `${n}/${items.length}`)),
          h('ol', { class: 'bb-path' }, items.map(c => step(c, list.indexOf(c)))));
      }));
    }
    return {
      chip: { icon: '⛪', text: `${done}/${list.length}`, label: `Etapas terminadas: ${done} de ${list.length}` },
      body: [
        h('div', { class: 'bb-intro' },
          h('h2', null, 'Mi camino a la Primera Comunión'),
          h('p', null, 'Paso a paso te preparas para recibir a Jesús. En cada etapa lees, aprendes y respondes tres preguntas.')),
        progressCard({ icon: '👣', title: `Llevas ${done} de ${plural(list.length, 'etapa', 'etapas')}`, value: (done / list.length) * 100, color: 'var(--leaf)' }),
        path,
        (() => {
          const ev = R.nextEvent('comunion');
          const won = done === list.length;
          return h('div', { class: `bb-goal${won ? ' is-won' : ''}` },
            h('div', { class: 'bb-goal__icon', 'aria-hidden': 'true' }, won ? '🎉' : '🕊️'),
            h('h3', null, won ? '¡Recorriste todo el camino!' : '¡Mi Primera Comunión!'),
            ev ? h('p', { class: 'bb-goal__count' }, ev.days === 0 ? '¡Es hoy!' : ev.days === 1 ? '¡Es mañana!' : `Faltan ${ev.days} días · ${R.fmtDate(ev.start)}`) : null,
            h('p', null, 'Al final del camino te espera Jesús en la Eucaristía.'),
            h('div', { class: 'bb-goal__btns' },
              button('Mi gran día', { kind: 'sun', small: true, icon: '🕊️', onClick: () => go('grandia') }),
              won ? button('Mi diploma', { kind: 'grape', small: true, icon: '📜', onClick: () => go('diploma') }) : null));
        })(),
        h('p', { class: 'bb-footnote' }, 'Temario general según el Catecismo. Tu catequista puede indicarte el orden de tu parroquia.'),
      ],
    };
  }

  async function topicView(id) {
    const list = await topics();
    const fam = await import('../data/familia.js').then(m => m.FAMILY || {}).catch(() => ({}));
    const i = list.findIndex(c => c.id === id);
    if (i < 0) return null;
    const c = list[i];
    const items = arr(c.items).filter(it => it && (it.title || it.text));
    const link = (x, n) => x && { title: `${n}. ${txt(x.title)}`, go: () => show({ kind: 'topic', tab: 'catecismo', id: x.id }) };
    const unit = UNITS.find(u => u.key === c.unit);
    return {
      title: 'Mi camino',
      chip: { icon: topicDone(c) ? '⭐' : '', text: `${i + 1} de ${list.length}`, label: `Etapa ${i + 1} de ${list.length}` },
      body: h('article', { class: 'bb-reader bb-topic' },
        h('header', { class: 'bb-phead bb-phead--topic' },
          h('div', { class: 'bb-phead__emoji', 'aria-hidden': 'true' }, txt(c.emoji)),
          h('p', { class: 'eyebrow' }, `Etapa ${i + 1} de ${list.length}${unit ? ` · ${unit.title}` : ''}`),
          h('h2', { class: 'bb-reader__title' }, txt(c.title))),
        h('div', { class: 'bb-reader__body' },
          tools(() => [txt(c.title), txt(c.intro), ...items.flatMap(it => [txt(it.title), txt(it.text)]), txt(c.closing)]),
          c.intro ? h('div', { class: 'bb-text bb-text--plain' }, h('p', null, txt(c.intro))) : null,
          h('ol', { class: 'bb-facts' }, items.map((it, k) => h('li', { class: 'bb-fact' },
            h('span', { class: 'bb-fact__n', 'aria-hidden': 'true' }, String(k + 1)),
            h('div', null, it.title ? h('h3', null, txt(it.title)) : null, it.text ? h('p', null, txt(it.text)) : null)))),
          note('closing', '✨', 'Para llevar en el corazón', c.closing),
          h('div', { class: 'bb-end' }, quizBlock(c.quiz, { key: `cat:${c.id}`, prize: PRIZE.catechism, title: 'Tres preguntas' })),
          familyCard(fam[c.id]),
          navRow(link(list[i - 1], i), link(list[i + 1], i + 2)))),
    };
  }
  // «Para conversar en casa»: para los papás, al final de cada tema (plegada para no distraer al niño).
  function familyCard(f) {
    if (!f || !arr(f.ask).length) return null;
    return h('details', { class: 'bb-family' },
      h('summary', null, h('span', { 'aria-hidden': 'true' }, '👪'), h('span', null, h('b', null, 'Para conversar en casa'), h('small', null, 'Para papás y padrinos'))),
      h('div', { class: 'bb-family__body' },
        h('h4', null, 'Pregúntenle (y respondan también ustedes)'),
        h('ul', null, arr(f.ask).map(q => h('li', null, txt(q)))),
        f.do ? [h('h4', null, 'Para hacer juntos'), h('p', null, txt(f.do))] : null,
        f.pray ? [h('h4', null, 'Recen en familia'), h('p', { class: 'bb-family__pray' }, `«${txt(f.pray)}»`)] : null));
  }

  // ───────────────────────── 5. Versículos ─────────────────────────

  const favKey = v => `fav:${txt(v.ref)}`;
  const isFav = v => !!state.flag(favKey(v));

  async function indexVersiculos() {
    const list = arr(await load('verses')).filter(v => v && txt(v.text) && txt(v.ref));
    if (!list.length) return { body: soon('Muy pronto', 'Los mensajes de la Biblia para cada día están por llegar.', '💌') };
    const today = list[dayNumber() % list.length];
    const favBox = h('section', { class: 'bb-favs', 'aria-label': 'Mis favoritos' });
    const hearts = new Set();

    function heart(v) {
      const b = h('button', { type: 'button', class: 'bb-heart', dataset: { ref: txt(v.ref) }, onclick: () => {
        const on = !isFav(v);
        state.setFlag(favKey(v), on);
        sfx(on ? 'sparkle' : 'tap');
        if (on) toast('Guardado en tus favoritos', { icon: '💗', ms: 1600 });
        sync();
      } }, heartIcon());
      hearts.add(b);
      b.sync = () => {
        const on = isFav(v);
        b.setAttribute('aria-pressed', String(on));
        b.setAttribute('aria-label', on ? `Quitar de favoritos: ${txt(v.ref)}` : `Guardar en favoritos: ${txt(v.ref)}`);
      };
      b.sync();
      return b;
    }
    const verseRow = v => h('div', { class: 'bb-v' },
      h('blockquote', null, h('p', null, `«${txt(v.text)}»`), h('cite', null, txt(v.ref))),
      heart(v));

    function sync() {
      for (const b of [...hearts]) { if (b.isConnected || !favBox.isConnected) b.sync(); else hearts.delete(b); }
      const favs = list.filter((v, k) => isFav(v) && list.findIndex(x => x.ref === v.ref) === k);
      clear(favBox);
      const n = favs.length;
      if (view?.kind === 'index' && view.tab === 'versiculos' && favBox.isConnected) {
        clear(chip).append(deco('💗'), String(n));
        chip.setAttribute('aria-label', `Versículos favoritos: ${n}`);
      }
      favBox.append(h('h2', { class: 'bb-group__title' }, 'Mis favoritos'));
      if (!n) { favBox.append(h('p', { class: 'bb-favs__empty' }, 'Toca el corazón de un versículo para guardarlo aquí.')); return; }
      favBox.append(h('div', { class: 'bb-vlist' }, favs.map(verseRow)));
    }

    const themes = THEMES.map(t => ({ t, items: list.filter(v => v.theme === t.key) })).filter(x => x.items.length);
    const rest = list.filter(v => !THEMES.some(t => t.key === v.theme));
    if (rest.length) themes.push({ t: { key: 'otros', title: 'Más mensajes', icon: '📖' }, items: rest });

    const themeEls = themes.map(({ t, items }) => {
      const panel = h('div', { class: 'bb-vlist', id: `bb-theme-${t.key}`, hidden: true });
      const head = h('button', { type: 'button', class: 'bb-theme__head', 'aria-expanded': 'false', 'aria-controls': panel.id, onclick: () => {
        const openNow = panel.hidden;
        sfx(openNow ? 'pop' : 'tap');
        if (openNow && !panel.firstChild) panel.append(...items.map(verseRow));
        panel.hidden = !openNow;
        head.setAttribute('aria-expanded', String(openNow));
        box.classList.toggle('is-open', openNow);
        if (openNow) later(() => box.scrollIntoView({ behavior: smooth(), block: 'nearest' }), 30);
      } },
      h('span', { class: 'bb-theme__icon', 'aria-hidden': 'true' }, t.icon),
      h('span', { class: 'bb-theme__title' }, t.title),
      h('span', { class: 'bb-count', 'aria-label': plural(items.length, 'versículo', 'versículos') }, String(items.length)),
      h('span', { class: 'bb-chev bb-chev--down', 'aria-hidden': 'true' }));
      const box = h('div', { class: `bb-theme bb-theme--${t.key}` }, head, panel);
      return box;
    });

    const todayCard = h('section', { class: 'bb-today', 'aria-label': 'Mensaje de hoy' },
      h('p', { class: 'eyebrow' }, deco('💌'), ' Mensaje de hoy'),
      h('p', { class: 'bb-today__date' }, todayLabel()),
      h('blockquote', null, h('p', null, `«${txt(today.text)}»`), h('cite', null, txt(today.ref))),
      h('div', { class: 'bb-today__row' }, listenButton(() => [txt(today.text)]), heart(today)));

    later(sync, 0);   // pinta favoritos y el contador cuando la vista ya está en la página
    sync();
    return {
      chip: { icon: '💗', text: String(list.filter(isFav).length), label: 'Versículos favoritos' },
      body: [todayCard, favBox,
        h('section', { class: 'bb-themes', 'aria-label': 'Versículos por tema' },
          h('h2', { class: 'bb-group__title' }, 'Busca por tema'),
          themeEls)],
    };
  }

  const INDEX = {
    historias: indexHistorias,
    parabolas: indexParabolas,
    oraciones: indexOraciones,
    catecismo: indexCatecismo,
    versiculos: indexVersiculos,
  };

  // ── Primera vista según los parámetros ──
  const first = params.story ? { kind: 'story', id: String(params.story), shelf: SHELF_KEYS.includes(params.shelf) ? params.shelf : undefined }
    : params.parable ? { kind: 'parable', id: String(params.parable) }
      : params.prayer ? { kind: 'prayer', id: String(params.prayer) }
        : params.topic ? { kind: 'topic', id: String(params.topic) }
          : { kind: 'index', tab: TAB_IDS.includes(params.tab) ? params.tab : 'historias' };
  if (first.kind !== 'index') first.tab = TAB_OF[first.kind];
  await show(first);

  return {
    back() { if (!view || view.kind === 'index') return false; goBack(); return true; },
    unmount() {
      dead = true;
      token++;
      endView();
      window.removeEventListener('keydown', onKey);
      for (const id of timers) clearTimeout(id);
      timers.clear();
      root.remove();
    },
  };
}
