// Motor de minijuegos de Palomita.
// Se encarga de TODO lo que rodea al juego: pantalla de instrucciones, lienzo, bucle, entrada táctil/teclado, marcador,
// vidas, reloj, pausa, efectos, pantalla de resultados, premios y la tarjeta con el mensaje de la parábola.
// Cada juego solo programa su mecánica.
//
// ───────────────────────── CONTRATO DE UN JUEGO (js/games/<id>.js) ─────────────────────────
//   export default {
//     id: 'oveja',
//     create(api) {            // se llama al empezar CADA partida (también al reiniciar); el estado del juego vive aquí dentro
//       return {
//         update(dt) {},       // lógica; dt en segundos (0 < dt ≤ 0.05). Solo se llama mientras se juega (no en pausa).
//         draw(g) {},          // dibuja TODO el cuadro (fondo incluido) en el CanvasRenderingContext2D `g`,
//                              // ya escalado a unidades lógicas: ancho api.W = 360, alto api.H (≈ 500–800, ¡varía!).
//         pointerDown(x, y, id) {}, pointerMove(x, y, id) {}, pointerUp(x, y, id) {},   // opcionales; coordenadas lógicas
//         keyDown(key) {}, keyUp(key) {},   // opcionales; key ∈ 'left' | 'right' | 'up' | 'down' | 'action'
//         resize(W, H) {},     // opcional; el alto puede cambiar (giro, teclado, ventana)
//         destroy() {},        // opcional; libera lo que haga falta
//       };
//     },
//   };
//
// ───────────────────────── api ─────────────────────────
//   api.W, api.H            tamaño lógico actual (W siempre 360)
//   api.top                 y lógica donde termina el marcador superior: no pongas nada importante por encima
//   api.bottom              y lógica máxima recomendada para elementos jugables (deja margen inferior)
//   api.time                segundos jugados (sin contar pausas)
//   api.score               puntaje actual        api.addScore(n, x?, y?)  (con x, y muestra "+n" flotante)   api.setScore(n)
//   api.lives               vidas (si hud.lives)  api.loseLife(x?, y?) → vidas restantes (al llegar a 0 el motor termina la partida)
//                                                 api.addLife()
//   api.timeLeft            segundos restantes (si hud.time; al llegar a 0 el motor termina la partida)   api.addTime(seg)
//   api.setProgress(p)      muestra una barra de avance 0..1 bajo el marcador (opcional)
//   api.end({ won })        termina la partida ahora (won: true si se cumplió el objetivo del juego)
//   api.level               nivel que se juega (1..100)      api.difficulty   0 (nivel 1) .. 1 (nivel 100)
//   api.goal                meta de ESTE nivel (la calcula levels.js con la config `levels` del juego)
//                           Al alcanzarla el motor da el nivel por ganado y termina la partida, salvo que el juego tenga
//                           levels.selfEnd = true: entonces el juego hace su propia celebración y llama api.end({ won: true }).
//   api.end({ won, stars })  stars (1..3) es opcional: si no se da, el motor la calcula con las vidas o el tiempo sobrantes.
//   api.best                mejor puntaje anterior
//   api.sfx(nombre)         sonidos de core/audio.js: tap pop coin good bad win lose jump flap eat splash bubble chirp coo
//                           sparkle tick drop grow match wrong step bell whoosh
//   api.rand()              aleatorio 0..1 (¡usa este, no Math.random!, para que las pruebas sean repetibles)
//   api.randRange(a, b)  api.randInt(a, b) (inclusive)  api.pick(arr)  api.shuffle(arr) (copia mezclada)
//   api.burst(x, y, { color, count, emoji, speed, size, gravity, life })   chispas/partículas
//   api.floatText(x, y, texto, { color, size })      texto que sube y se desvanece
//   api.shake(fuerza = 6, ms = 250)     api.flash(color = '#fff', ms = 160)
//   api.hint(texto, ms = 2600)          cartelito de ayuda al centro (p. ej. al empezar)
//   api.pointer             { x, y, down } del dedo principal          api.keys   Set con teclas presionadas
//   api.overlay             <div> sobre el lienzo para juegos que necesiten HTML (p. ej. preguntas con texto largo).
//                           Sus hijos reciben toques; el motor lo vacía al reiniciar o salir.
//   api.kit                 kit de dibujo (js/games/kit.js)
//   api.reduceMotion        true si el usuario pidió menos movimiento
//
// Depuración/pruebas: window.__game = { id, api, phase, instance, start(), finish(opts), restart(), exit() } y window.__gameError.
import * as state from '../core/state.js';
import * as audio from '../core/audio.js';
import * as tts from '../core/tts.js';
import * as kit from './kit.js';
import { h, clear, button, iconButton, appRoot, reduceMotion } from '../core/ui.js';
import { getGame } from './registry.js';
import { levelConfig, levelSpec, MAX_LEVEL } from './levels.js';
import { grantLevel, showChest } from '../core/rewards.js';

const LOGICAL_W = 360;
const KEYMAP = {
  ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right',
  ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ' ': 'action', Enter: 'action',
};
const FALLBACK_PARABLE = {
  title: '', ref: '', emoji: '🕊️', story: [],
  messages: ['Dios te ama muchísimo y siempre está contigo.'],
  missions: ['Haz hoy algo bueno por alguien de tu familia.'],
  verse: null, prayer: '',
};

let current = null;

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function isRunning() { return !!current; }
export function stopGame() { current?.exit(); }
// Botón "atrás" del teléfono: en juego pausa; en pausa o en los paneles, sale del juego. Devuelve true si lo usó.
export function handleBack() {
  if (!current) return false;
  if (current.phase === 'playing') current.pause(); else current.exit();
  return true;
}

// Inicia un minijuego. opts: { level (1..100; por defecto el último desbloqueado), onExit(), skipIntro, seed }
export async function startGame(id, { onExit, skipIntro = false, seed, level } = {}) {
  if (current) current.exit(true);
  const def = getGame(id);
  if (!def) throw new Error(`Juego desconocido: ${id}`);

  // ── DOM ──
  const canvas = h('canvas', { 'aria-label': def.title });
  const overlay = h('div', { class: 'layer', style: { pointerEvents: 'none' } });
  const scoreVal = h('b', null, '0');
  const levelChip = h('span', { class: 'chip game-hud__level' }, 'Nivel 1');
  const heartsEl = h('span', { class: 'chip game-hud__hearts', hidden: true });
  const timeVal = h('b', null, '');
  const timeEl = h('span', { class: 'chip game-hud__time', hidden: true }, h('span', { 'aria-hidden': 'true' }, '⏱️'), timeVal);
  const pauseBtn = iconButton('⏸️', 'Pausa', () => pause());
  const hud = h('div', { class: 'game-hud', hidden: true },
    pauseBtn,
    h('span', { class: 'chip' }, h('span', { 'aria-hidden': 'true' }, def.scoreIcon || '⭐'), scoreVal),
    levelChip,
    h('span', { class: 'game-hud__spacer' }), heartsEl, timeEl);
  const progress = h('div', { class: 'game-progress', hidden: true }, h('i'));
  const hintEl = h('div', { class: 'game-hint', hidden: true }, h('span'));
  const flashEl = h('div', { class: 'game-flash' });
  const panelWrap = h('div', { class: 'game-panel-wrap', hidden: true });
  const root = h('div', { class: 'game', dataset: { game: id } }, canvas, overlay, flashEl, progress, hud, hintEl, panelWrap);
  appRoot().append(root);
  const g = canvas.getContext('2d');

  // ── Estado del motor ──
  let phase = 'loading';       // loading | intro | playing | paused | ending | result | message | error
  let mod = null, instance = null, parable = FALLBACK_PARABLE;
  const levelN = Math.max(1, Math.min(MAX_LEVEL, Math.round(level) || state.levelProgress(id).unlocked));
  let spec = levelSpec(levelConfig(def, null), levelN);
  let W = LOGICAL_W, H = 640, scale = 1, pixelScale = 1, top = 64;
  let score = 0, lives = 0, timeLeft = 0, time = 0;
  let raf = 0, last = 0, hintTimer = 0, endTimer = 0, exited = false;
  let shakeAmt = 0, shakeLeft = 0, shakeDur = 1, goalHit = false;
  let rng = mulberry32((seed ?? (Date.now() ^ (Math.random() * 1e9))) | 0);
  const particles = [], floats = [];
  const keys = new Set();
  const pointer = { x: LOGICAL_W / 2, y: 320, down: false };
  const best0 = state.gameInfo(id).best;
  const motionOff = reduceMotion();

  const api = {
    get W() { return W; }, get H() { return H; }, get top() { return top; }, get bottom() { return H - 10; },
    get time() { return time; }, get score() { return score; }, get lives() { return lives; }, get timeLeft() { return timeLeft; },
    get goal() { return spec.goal; }, get level() { return spec.level; }, get difficulty() { return spec.difficulty; }, get levelSpec() { return spec; },
    best: best0, kit, overlay, pointer, keys, reduceMotion: motionOff,
    addScore(n = 1, x, y) {
      score = Math.max(0, score + n); renderScore();
      if (x !== undefined && y !== undefined && n) api.floatText(x, y, (n > 0 ? '+' : '') + n, { color: n > 0 ? '#ffffff' : '#ffd0d0' });
      checkGoal();
    },
    setScore(n) { score = Math.max(0, Math.round(n)); renderScore(); checkGoal(); },
    loseLife(x, y) {
      if (phase !== 'playing' || lives <= 0) return lives;
      lives--; renderHearts();
      audio.sfx('bad'); api.shake(7, 280); api.flash('#ff6b6b', 180);
      if (x !== undefined && y !== undefined) api.burst(x, y, { emoji: '💔', count: 1, speed: 30, life: 0.9, size: 22, gravity: -40 });
      if (lives <= 0) finish({ won: false });
      return lives;
    },
    addLife() { if (def.hud?.lives && lives < maxLives() + 2) { lives++; renderHearts(); audio.sfx('sparkle'); } return lives; },
    addTime(sec) { timeLeft = Math.max(0, timeLeft + sec); renderTime(); },
    setProgress(p) { progress.hidden = false; progress.firstChild.style.setProperty('--v', Math.round(Math.max(0, Math.min(1, p)) * 100)); measureTop(); },
    end(opts = {}) { finish(opts); },
    sfx(name) { audio.sfx(name); },
    rand: () => rng(),
    randRange: (a, b) => a + rng() * (b - a),
    randInt: (a, b) => Math.floor(a + rng() * (b - a + 1)),
    pick: arr => arr[Math.floor(rng() * arr.length)],
    shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    burst(x, y, { color = '#ffd24a', count = 12, emoji = '', speed = 120, size = 5, gravity = 260, life = 0.7 } = {}) {
      const n = motionOff ? Math.min(count, 3) : Math.min(count, 40);
      for (let i = 0; i < n && particles.length < 220; i++) {
        const a = Math.random() * Math.PI * 2, v = speed * (0.4 + Math.random() * 0.8);
        particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * 0.35, life, max: life, size: size * (0.6 + Math.random() * 0.8), color, emoji, gravity, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 8 });
      }
    },
    floatText(x, y, text, { color = '#ffffff', size = 20 } = {}) { if (floats.length < 30) floats.push({ x, y, text: String(text), color, size, life: 0.9, max: 0.9 }); },
    shake(amount = 6, ms = 250) { if (motionOff) return; shakeAmt = amount; shakeLeft = shakeDur = ms / 1000; },
    flash(color = '#fff', ms = 160) {
      if (motionOff) return;
      flashEl.style.transition = 'none'; flashEl.style.background = color; flashEl.style.opacity = '0.45';
      requestAnimationFrame(() => { flashEl.style.transition = `opacity ${ms}ms`; flashEl.style.opacity = '0'; });
    },
    hint(text, ms = 2600) {
      clearTimeout(hintTimer);
      hintEl.firstChild.textContent = text; hintEl.hidden = false;
      hintTimer = setTimeout(() => { hintEl.hidden = true; }, ms);
    },
  };

  // Al alcanzar la meta del nivel: el motor da el nivel por ganado (o, si el juego tiene su propio final, solo lo celebra).
  function checkGoal() {
    if (goalHit || phase !== 'playing' || !(spec.goal > 0) || score < spec.goal) return;
    goalHit = true;
    audio.sfx('sticker');
    api.burst(W / 2, H * 0.3, { emoji: '⭐', count: 8, speed: 170, size: 18, life: 1 });
    // Los juegos con final propio hacen su celebración; el resto termina aquí.
    if (!spec.selfEnd) finish({ won: true });
  }
  function renderScore() { scoreVal.textContent = spec.goal > 0 ? `${score}/${spec.goal}` : String(score); }
  const maxLives = () => (def.hud?.lives ? (spec.lives ?? def.hud.lives) : 0);
  const maxTime = () => (def.hud?.time ? (spec.time ?? def.hud.time) : 0);

  // ── Tamaño ──
  function measureTop() {
    const r = root.getBoundingClientRect();
    const ref = !progress.hidden ? progress : hud;
    const b = ref.hidden ? 56 : ref.getBoundingClientRect().bottom - r.top;
    top = (b > 0 ? b : 56) / scale + 6;
  }
  function resize() {
    const r = root.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    scale = r.width / LOGICAL_W;
    W = LOGICAL_W; H = r.height / scale;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    pixelScale = scale * dpr;
    measureTop();
    try { instance?.resize?.(W, H); } catch (e) { fail(e); }
    if (phase !== 'playing') draw();
  }
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
  ro?.observe(root);
  window.addEventListener('resize', resize);

  // ── Marcador ──
  function renderHearts() {
    if (!def.hud?.lives) return;
    heartsEl.hidden = false;
    heartsEl.textContent = '❤️'.repeat(Math.max(0, lives)) + '🤍'.repeat(Math.max(0, maxLives() - lives));
    heartsEl.setAttribute('aria-label', `${lives} vidas`);
  }
  function renderTime() {
    if (!def.hud?.time) return;
    timeEl.hidden = false;
    const s = Math.ceil(timeLeft);
    if (timeVal.textContent !== String(s)) {
      timeVal.textContent = String(s);
      timeEl.classList.toggle('is-low', s <= 10 && s > 0);
      if (s <= 5 && s > 0 && phase === 'playing') audio.sfx('tick');
    }
  }

  // ── Bucle ──
  function frame(now) {
    raf = requestAnimationFrame(frame);
    let dt = (now - last) / 1000; last = now;
    if (!(dt > 0)) dt = 0.001;
    if (dt > 0.05) dt = 0.05;
    if (phase === 'playing') {
      time += dt;
      if (def.hud?.time) {
        timeLeft -= dt;
        if (timeLeft <= 0) { timeLeft = 0; renderTime(); finish({}); } else renderTime();
      }
      if (phase === 'playing') { try { instance.update(dt); } catch (e) { fail(e); return; } }
    }
    if (phase === 'playing' || phase === 'ending') stepFx(dt);
    draw();
  }
  function stepFx(dt) {
    if (shakeLeft > 0) shakeLeft -= dt;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt; if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.vy += p.gravity * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.life -= dt; if (f.life <= 0) { floats.splice(i, 1); continue; }
      f.y -= 38 * dt;
    }
  }
  function draw() {
    if (!instance || phase === 'error') return;
    g.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
    g.globalAlpha = 1;
    g.save();
    if (shakeLeft > 0) { const k = shakeAmt * (shakeLeft / shakeDur); g.translate((Math.random() - 0.5) * 2 * k, (Math.random() - 0.5) * 2 * k); }
    try { instance.draw(g); } catch (e) { g.restore(); fail(e); return; }
    g.restore();
    g.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
    for (const p of particles) {
      const a = Math.max(0, p.life / p.max);
      if (p.emoji) kit.emoji(g, p.emoji, p.x, p.y, p.size, { rot: p.rot * 0.2, alpha: Math.min(1, a * 1.6) });
      else { g.globalAlpha = a; g.fillStyle = p.color; g.beginPath(); g.arc(p.x, p.y, p.size * (0.5 + a * 0.5), 0, 6.283); g.fill(); g.globalAlpha = 1; }
    }
    for (const f of floats) {
      const a = Math.max(0, f.life / f.max);
      kit.text(g, f.text, f.x, f.y, { size: f.size, color: f.color, stroke: 'rgba(61,43,36,0.75)', strokeWidth: 4, alpha: Math.min(1, a * 2) });
    }
  }

  // ── Entrada ──
  function toLogical(e) {
    const r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left) / scale, (e.clientY - r.top) / scale];
  }
  function onDown(e) {
    audio.unlock();
    if (phase !== 'playing') return;
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch { /* sin captura */ }
    const [x, y] = toLogical(e);
    pointer.x = x; pointer.y = y; pointer.down = true;
    try { instance.pointerDown?.(x, y, e.pointerId); } catch (err) { fail(err); }
  }
  function onMove(e) {
    if (phase !== 'playing') return;
    const [x, y] = toLogical(e);
    pointer.x = x; pointer.y = y;
    try { instance.pointerMove?.(x, y, e.pointerId); } catch (err) { fail(err); }
  }
  function onUp(e) {
    const [x, y] = toLogical(e);
    pointer.x = x; pointer.y = y; pointer.down = false;
    if (phase !== 'playing') return;
    try { instance.pointerUp?.(x, y, e.pointerId); } catch (err) { fail(err); }
  }
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  function onKeyDown(e) {
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') { if (phase === 'playing') pause(); else if (phase === 'paused') resume(); return; }
    const k = KEYMAP[e.key];
    if (!k || phase !== 'playing') return;
    e.preventDefault();
    if (keys.has(k)) return;
    keys.add(k);
    try { instance.keyDown?.(k); } catch (err) { fail(err); }
  }
  function onKeyUp(e) {
    const k = KEYMAP[e.key];
    if (!k) return;
    keys.delete(k);
    if (phase !== 'playing') return;
    try { instance.keyUp?.(k); } catch (err) { fail(err); }
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  function onVisibility() { if (document.hidden && phase === 'playing') pause(); }
  document.addEventListener('visibilitychange', onVisibility);

  // ── Paneles ──
  function showPanel(...content) {
    clear(panelWrap);
    const cls = content[0] && content[0].panelClass ? content.shift().panelClass : '';
    panelWrap.append(h('div', { class: `game-panel ${cls}`.trim(), role: 'dialog', 'aria-modal': 'true' }, content));
    panelWrap.hidden = false;
    panelWrap.querySelector('.btn')?.focus({ preventScroll: true });
  }
  function hidePanel() { panelWrap.hidden = true; clear(panelWrap); }

  function parableLine() {
    if (!parable.title) return null;
    const kind = parable.kind === 'historia' ? 'Historia' : 'Parábola';
    return h('p', { class: 'eyebrow' }, `${kind}: ${parable.title}${parable.ref ? ' · ' + parable.ref : ''}`);
  }
  function storyNodes() { return (parable.story || []).map(p => h('p', null, p)); }
  function listenButton(getText) {
    if (!tts.available() || state.setting('voice') === false) return null;
    let on = false;
    const b = button('Escuchar', { kind: 'sky', small: true, icon: '🔊', onClick: () => {
      if (on) { tts.stop(); return; }
      on = true; b.lastChild.textContent = 'Detener';
      tts.speak(getText(), { onend: () => { on = false; if (b.isConnected) b.lastChild.textContent = 'Escuchar'; } });
    } });
    return b;
  }

  function showIntro() {
    phase = 'intro';
    hud.hidden = true;
    showPanel(
      h('div', { class: 'game-panel__icon', 'aria-hidden': 'true' }, def.icon),
      h('p', { class: 'game-level-badge' }, `Nivel ${spec.level}`),
      h('h2', null, def.title),
      parableLine(),
      h('div', { class: 'game-panel__how' }, h('ul', null, def.how.map(t => h('li', null, t)))),
      h('p', { class: 'game-panel__goal' }, `🏅 Meta: ${spec.label}`),
      starsRow(state.levelProgress(id).stars(spec.level), 'Tu mejor resultado en este nivel'),
      h('div', { class: 'game-panel__row' },
        button('¡Jugar!', { kind: 'leaf', icon: '▶️', onClick: () => begin() })),
      h('div', { class: 'game-panel__row' },
        parable.story?.length ? button('La historia', { kind: 'ghost', small: true, icon: '📖', onClick: () => showStory(showIntro) }) : null,
        button('Volver', { kind: 'ghost', small: true, icon: '↩️', onClick: () => exit() })),
    );
  }
  function showStory(back) {
    tts.stop();
    showPanel({ panelClass: 'parable' },
      h('div', { class: 'parable__head' }, h('div', { class: 'parable__emoji', 'aria-hidden': 'true' }, parable.emoji || def.icon),
        h('div', null, h('h2', null, parable.title || def.title), parable.ref ? h('p', { class: 'parable__ref' }, parable.ref) : null)),
      h('div', { class: 'parable__story' }, storyNodes()),
      h('div', { class: 'game-panel__row' },
        listenButton(() => [parable.title, ...(parable.story || [])]),
        button('Volver', { kind: 'ghost', small: true, icon: '↩️', onClick: () => { tts.stop(); back(); } })),
    );
  }

  function begin() {
    tts.stop();
    hidePanel();
    clear(overlay);
    try { instance?.destroy?.(); } catch { /* nada */ }
    particles.length = 0; floats.length = 0; keys.clear(); pointer.down = false;
    score = 0; time = 0; goalHit = false; renderScore();
    lives = maxLives(); timeLeft = maxTime();
    levelChip.textContent = `Nivel ${spec.level}`;
    progress.hidden = true; hintEl.hidden = true;
    hud.hidden = false;
    renderHearts(); renderTime();
    resize();
    try { instance = mod.create(api); } catch (e) { fail(e); return; }
    phase = 'playing';
    last = performance.now();
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function pause() {
    if (phase !== 'playing') return;
    phase = 'paused';
    showPanel(
      h('div', { class: 'game-panel__icon', 'aria-hidden': 'true' }, '⏸️'),
      h('h2', null, 'Pausa'),
      h('p', { class: 'game-panel__goal' }, `Nivel ${spec.level} · Meta: ${spec.label}`),
      h('div', { class: 'game-panel__row' }, button('Seguir jugando', { kind: 'leaf', icon: '▶️', onClick: () => resume() })),
      h('div', { class: 'game-panel__row' },
        button('Empezar de nuevo', { kind: 'ghost', small: true, icon: '🔄', onClick: () => begin() }),
        button('Salir', { kind: 'ghost', small: true, icon: '↩️', onClick: () => exit() })),
    );
  }
  function resume() {
    if (phase !== 'paused') return;
    hidePanel();
    phase = 'playing';
    last = performance.now();
  }

  function finish({ won = false, stars } = {}) {
    if (phase !== 'playing') return;
    phase = 'ending';
    clearTimeout(hintTimer); hintEl.hidden = true;
    const didWin = spec.selfEnd ? !!won : (!!won || (spec.goal > 0 && score >= spec.goal));
    // Estrellas: las da el juego, o salen de las vidas o del tiempo que sobró.
    let st = stars;
    if (didWin && !(st >= 1)) {
      if (maxLives() > 0) st = Math.max(1, Math.min(3, lives));
      else if (maxTime() > 0) { const f = timeLeft / maxTime(); st = f >= 0.4 ? 3 : f >= 0.2 ? 2 : 1; }
      else st = 3;
    }
    const rec = state.recordLevel(id, spec.level, { won: didWin, stars: didWin ? st : 0, score });
    const prize = grantLevel(id, spec.level, rec, { won: didWin });
    state.addStat('alegria', didWin ? 14 : 8); state.addStat('energia', -5); state.addStat('hambre', -3);
    audio.sfx(didWin ? 'win' : 'lose');
    if (didWin) for (let i = 0; i < 4; i++) api.burst(W * (0.2 + 0.2 * i), H * 0.35, { emoji: ['🎉', '⭐', '✨', '🎊'][i], count: 4, speed: 160, size: 20, life: 1.1 });
    endTimer = setTimeout(() => showResult({ didWin, rec, prize }), motionOff ? 200 : 950);
  }

  function starsRow(n, label) {
    return h('div', { class: 'game-stars', role: 'img', 'aria-label': `${label}: ${n} de 3 estrellas` },
      [0, 1, 2].map(i => h('span', { class: `game-star${i < n ? ' is-on' : ''}`, style: { animationDelay: `${0.25 + i * 0.22}s` }, 'aria-hidden': 'true' }, '★')));
  }

  function showResult({ didWin, rec, prize }) {
    if (exited) return;
    phase = 'result';
    hud.hidden = true;
    const n = spec.level;
    const hasNext = didWin && n < MAX_LEVEL;
    showPanel(
      h('p', { class: 'game-level-badge' }, `Nivel ${n}`),
      h('h2', null, didWin ? (n === MAX_LEVEL ? '¡Completaste los 100 niveles!' : '¡Nivel superado!') : '¡Casi lo logras!'),
      didWin ? starsRow(rec.stars, 'Estrellas') : h('div', { class: 'game-panel__icon', 'aria-hidden': 'true' }, '💛'),
      h('div', { class: 'game-score-big', 'aria-label': `${score} de ${spec.goal}` }, `${score}`, h('small', null, ` / ${spec.goal} `), h('span', { style: { fontSize: '1.6rem' }, 'aria-hidden': 'true' }, def.scoreIcon || '⭐')),
      h('div', { class: 'game-rewards' },
        prize.items.map(it => h('span', { class: 'chip' }, h('span', { 'aria-hidden': 'true' }, it.icon), ` ${it.text}`)),
        rec.unlockedNow && hasNext ? h('span', { class: 'chip' }, `🔓 Nivel ${n + 1}`) : null),
      !didWin ? h('p', { class: 'game-panel__goal' }, `Meta: ${spec.label}. ¡Tú puedes!`) : null,
      h('div', { class: 'game-panel__row' },
        hasNext ? button('Siguiente nivel', { kind: 'leaf', icon: '▶️', onClick: () => gotoLevel(n + 1) })
          : button(didWin ? 'Jugar otra vez' : 'Intentar otra vez', { kind: 'leaf', icon: '🔄', onClick: () => begin() })),
      h('div', { class: 'game-panel__row' },
        button('Mensaje', { kind: 'sun', small: true, icon: '💌', onClick: () => showMessage() }),
        hasNext ? button('Repetir', { kind: 'ghost', small: true, icon: '🔄', onClick: () => begin() }) : null,
        button('Niveles', { kind: 'ghost', small: true, icon: '🗺️', onClick: () => exit() })),
    );
    if (prize.chest) setTimeout(() => { if (!exited) showChest(prize.chest); }, 700);
  }

  // Pasa a otro nivel sin volver al mapa.
  function gotoLevel(n) {
    exit(true);
    startGame(id, { level: n, onExit, seed, skipIntro: true }).catch(e => console.error(e));
  }

  function showMessage() {
    phase = 'message';
    const plays = state.gameInfo(id).plays;
    const msgs = parable.messages?.length ? parable.messages : FALLBACK_PARABLE.messages;
    const miss = parable.missions?.length ? parable.missions : FALLBACK_PARABLE.missions;
    const msg = msgs[(plays - 1 + msgs.length) % msgs.length];
    const mission = miss[(plays - 1 + miss.length) % miss.length];
    const first = state.dailyOnce('msg:' + id);
    const feGain = first ? 8 : 2;
    state.addStat('fe', feGain);
    audio.sfx('bell');
    const storyBox = h('div', { class: 'parable__story', hidden: true }, storyNodes());
    const storyBtn = parable.story?.length ? button('Leer la historia', { kind: 'ghost', small: true, icon: '📖', onClick: () => {
      storyBox.hidden = !storyBox.hidden;
      storyBtn.lastChild.textContent = storyBox.hidden ? 'Leer la historia' : 'Ocultar la historia';
    } }) : null;
    showPanel({ panelClass: 'parable' },
      h('div', { class: 'parable__head' }, h('div', { class: 'parable__emoji', 'aria-hidden': 'true' }, parable.emoji || def.icon),
        h('div', null, h('h2', null, parable.title || def.title), parable.ref ? h('p', { class: 'parable__ref' }, parable.ref) : null)),
      h('div', { class: 'parable__msg' }, h('p', { class: 'eyebrow' }, 'Mensaje para tu corazón'), h('p', null, msg)),
      h('div', { class: 'parable__mission' }, h('p', { class: 'eyebrow' }, 'Tu misión de hoy'), h('p', null, mission)),
      parable.verse ? h('blockquote', { class: 'parable__verse', style: { margin: 0 } }, h('p', null, `«${parable.verse.text}»`), h('cite', null, parable.verse.ref)) : null,
      storyBox,
      h('div', { class: 'game-rewards' }, h('span', { class: 'chip' }, `+${feGain} Fe 🕯️`)),
      h('div', { class: 'game-panel__row' },
        storyBtn,
        listenButton(() => [msg, 'Tu misión de hoy: ' + mission, parable.verse ? parable.verse.text : ''])),
      h('div', { class: 'game-panel__row' },
        spec.level < MAX_LEVEL && state.levelProgress(id).unlocked > spec.level ? button('Siguiente nivel', { kind: 'leaf', small: true, icon: '▶️', onClick: () => gotoLevel(spec.level + 1) })
          : button('Jugar otra vez', { kind: 'leaf', small: true, icon: '🔄', onClick: () => begin() }),
        button('Niveles', { kind: 'ghost', small: true, icon: '🗺️', onClick: () => exit() })),
    );
  }

  function fail(e) {
    console.error(`[juego ${id}]`, e);
    window.__gameError = String(e && e.stack || e);
    if (phase === 'error') return;
    phase = 'error';
    hud.hidden = true;
    showPanel(
      h('div', { class: 'game-panel__icon', 'aria-hidden': 'true' }, '🛠️'),
      h('h2', null, 'Este juego necesita un arreglito'),
      h('p', null, 'Algo no salió bien. Vuelve y prueba otro juego mientras lo componemos.'),
      h('div', { class: 'game-panel__row' }, button('Volver', { kind: 'ghost', icon: '↩️', onClick: () => exit() })),
    );
  }

  function exit(silent = false) {
    if (exited) return;
    exited = true;
    tts.stop();
    cancelAnimationFrame(raf); raf = 0;
    clearTimeout(hintTimer); clearTimeout(endTimer);
    try { instance?.destroy?.(); } catch { /* nada */ }
    instance = null;
    ro?.disconnect();
    window.removeEventListener('resize', resize);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('visibilitychange', onVisibility);
    root.remove();
    if (current === ctl) current = null;
    if (window.__game && window.__game.id === id) window.__game = null;
    state.save();
    if (!silent) { try { onExit?.(); } catch (e) { console.error(e); } }
  }

  const ctl = {
    id, api, exit,
    get level() { return spec.level; },
    get phase() { return phase; }, get instance() { return instance; }, get parable() { return parable; },
    start: () => begin(), finish: opts => finish(opts || {}), restart: () => begin(), pause, resume,
    setSeed(n) { rng = mulberry32(n | 0); },
  };
  current = ctl;
  window.__game = ctl;
  window.__gameError = null;

  // ── Carga ──
  showPanel(h('div', { class: 'game-panel__icon', 'aria-hidden': 'true' }, def.icon), h('h2', null, 'Preparando el juego…'));
  resize();
  try {
    const [m, data] = await Promise.all([
      def.load(),
      import('../data/parables.js').catch(() => null),
    ]);
    if (exited) return ctl;
    mod = m.default || m;
    if (!mod || typeof mod.create !== 'function') throw new Error('El módulo del juego no exporta create(api)');
    const p = data?.PARABLES?.[def.parable];
    if (p) parable = { ...FALLBACK_PARABLE, ...p };
    spec = levelSpec(levelConfig(def, mod), levelN);
  } catch (e) {
    if (exited) return ctl;
    console.warn(`[juego ${id}] no se pudo cargar`, e);
    window.__gameError = String(e && e.stack || e);
    phase = 'error';
    showPanel(
      h('div', { class: 'game-panel__icon', 'aria-hidden': 'true' }, '🚧'),
      h('h2', null, 'Muy pronto'),
      h('p', null, 'Este juego todavía se está preparando.'),
      h('div', { class: 'game-panel__row' }, button('Volver', { kind: 'ghost', icon: '↩️', onClick: () => exit() })),
    );
    return ctl;
  }
  if (skipIntro) begin(); else showIntro();
  return ctl;
}
