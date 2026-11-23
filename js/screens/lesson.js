// Lección animada: un reproductor tipo video.
//   go('lesson', { id })
//
// Cada escena es un cuadro con su fondo y emojis animados (x, y en %; y = 100 abajo; s = tamaño), un subtítulo grande,
// barra de avance por escenas y botones ⏮ ⏯ ⏭ 🔊. Avanza solo: con voz lee say || caption y sigue al terminar (+0,8 s);
// sin voz avanza por tiempo (2,5 s + 55 ms por letra). Tocar el cuadro pausa. Al final: «¡Muy bien!», premio la primera vez
// y el cuestionario de la lección.
import * as state from '../core/state.js';
import * as tts from '../core/tts.js';
import { h, clear, button, reduceMotion } from '../core/ui.js';
import { sfx } from '../core/audio.js';
import { go, back } from '../core/router.js';
import { sceneEl, isFloating, hasOrb, preload } from '../art/scenes.js';
import { grantPackOnce } from '../core/stickers.js';
import { arr, txt, deco, clamp, BGS, voiceReady, loadLessons, lifecycle, shell, soon, rewardRow, grant, celebrate, quiz, smooth } from './catequesis.js';

const ANIMS = ['pop', 'float', 'bounce', 'slide-left', 'slide-right', 'spin', 'pulse', 'glow', 'fall', 'grow', 'shake', 'none'];
const PRIZE = { read: { fe: 5, xp: 8, coins: 8 }, quiz: { coins: 10 } };
const TICK = 100;
let mutedThisSession = false;   // el 🔇 del reproductor dura mientras la app está abierta

const num = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const sayOf = sc => txt(sc.say).trim() || txt(sc.caption).trim();
const capOf = sc => txt(sc.caption).trim() || sayOf(sc);
const timeFor = sc => 2500 + 55 * capOf(sc).length;              // sin voz: el tiempo de leer el subtítulo
const voiceGuess = sc => 900 + 62 * sayOf(sc).length;             // lo que suele tardar la voz (solo para la barra)

export async function mount(el, params = {}) {
  const life = lifecycle();
  const sh = shell(el, { title: 'Lección', onBack: () => back(), cls: 'ls-screen' });
  const lessons = await loadLessons();
  const idx = lessons.findIndex(l => l.id === params.id);
  const L = lessons[idx];
  const scenes = L ? arr(L.scenes).filter(sc => sc && sayOf(sc)) : [];
  const bgOf = sc => (BGS.includes(sc.bg) ? sc.bg : 'cielo');
  const orbOf = sc => !hasOrb(arr(sc.actors).map(a => txt(a.e)));
  preload(scenes.map(sc => ({ bg: bgOf(sc), orb: orbOf(sc) })), 'stage');   // los fondos se pintan mientras el niño mira la portada
  if (!L || !scenes.length) {
    sh.fill(soon('Muy pronto', 'Esta lección todavía se está preparando. ¡Vuelve pronto!', '🎬'),
      button('Volver a las lecciones', { kind: 'sun', icon: '↩️', onClick: () => back() }));
    return { unmount() { life.end(); sh.root.remove(); } };
  }
  const next = lessons[idx + 1] || null;
  const n = scenes.length;
  sh.setTitle(txt(L.title) || 'Lección');
  if (/^#[0-9a-f]{6}$/i.test(L.color || '')) sh.root.style.setProperty('--lc', L.color);

  // ── Estado del reproductor ──
  let phase = 'intro';      // intro | play | done | quiz
  let cur = 0;
  let playing = false;
  let tok = 0;              // invalida voces y esperas de una escena anterior
  let elapsed = 0;          // ms reproducidos de la escena actual
  let dur = 1;              // duración prevista de la escena actual
  let mode = 'time';        // 'voice' | 'time'
  let lastTick = 0;
  let waitId = 0;
  let muted = mutedThisSession;
  const canVoice = () => voiceReady() && !muted;

  // ── Piezas ──
  const stage = h('div', { class: 'ls-stage', role: 'button', tabindex: '0', 'aria-label': 'Empezar la lección' });
  const sceneBox = h('div', { class: 'ls-scenes' });
  const pausedEl = h('div', { class: 'ls-paused', hidden: true, 'aria-hidden': 'true' }, h('span', { class: 'ls-paused__btn' }), h('span', { class: 'ls-paused__txt' }, 'En pausa · toca para seguir'));
  const introEl = h('div', { class: 'ls-intro', 'aria-hidden': 'true' },
    h('span', { class: 'ls-intro__emoji' }, txt(L.emoji) || '🎬'),
    h('span', { class: 'ls-intro__title' }, txt(L.title)),
    h('span', { class: 'ls-intro__play' }, deco('▶'), 'Ver lección'));
  stage.append(sceneBox, introEl, pausedEl);

  const segs = h('div', { class: 'ls-segs', 'aria-hidden': 'true' }, scenes.map(() => h('span', { class: 'ls-seg' }, h('i'))));
  const caption = h('p', { class: 'ls-caption', 'aria-live': 'polite' }, txt(L.summary));
  const counter = h('span', { class: 'ls-count' });                 // para lectores de pantalla (la barra superior ya lo muestra)

  const ctl = (icon, label, fn, cls = '') => h('button', { type: 'button', class: `ls-btn ${cls}`.trim(), 'aria-label': label, title: label, onclick: e => { e.stopPropagation(); fn(); } }, deco(icon));
  const prevBtn = ctl('⏮', 'Escena anterior', () => { sfx('tap'); prev(); });
  const playBtn = ctl('▶', 'Reproducir', () => { sfx('tap'); toggle(); }, 'ls-btn--play');
  const nextBtn = ctl('⏭', 'Escena siguiente', () => { sfx('tap'); skip(); });
  const muteBtn = ctl('🔊', 'Silenciar la voz', () => { sfx('tap'); toggleMute(); }, 'ls-btn--mute');
  const ctrls = h('div', { class: 'ls-ctrls' }, prevBtn, playBtn, nextBtn, muteBtn);
  const player = h('div', { class: 'ls-player' }, stage, segs, caption, h('div', { class: 'ls-bar' }, counter, ctrls));
  const endBox = h('div', { class: 'ls-end-wrap' });
  sh.fill(player, endBox);

  // ── Escena ──
  // Subtítulo como texto; las citas «(Lucas 22, 19-20)» no se parten en dos renglones.
  function setCaption(t) {
    const line = h('span', null);           // un solo bloque: el subtítulo es flex y centra su contenido
    for (const part of txt(t).split(/(\([^()]*\d[^()]*\))/)) {
      if (!part) continue;
      line.append(/^\(.*\d.*\)$/.test(part) && part.length < 40 ? h('span', { class: 'ls-ref' }, part) : part);
    }
    clear(caption).append(line);
  }
  function actorEl(a, k) {
    const anim = ANIMS.includes(a.anim) ? a.anim : 'pop';
    const s = clamp(num(a.s, 1), 0.4, 3);
    const y = clamp(num(a.y, 60), 0, 100);
    const grounded = y >= 56 && !['float', 'glow', 'spin', 'fall'].includes(anim) && !isFloating(a.e);
    const el = h('span', { class: `ls-actor ls-a--${anim}${grounded ? ' is-ground' : ''}` }, h('span', { class: 'ls-actor__in' }, h('span', { class: 'ls-actor__loop' }, txt(a.e))));
    el.style.setProperty('--x', clamp(num(a.x, 50), 0, 100));
    el.style.setProperty('--y', clamp(num(a.y, 60), 0, 100));
    el.style.setProperty('--s', s);
    el.style.setProperty('--d', `${(0.15 + k * 0.22).toFixed(2)}s`);
    el.style.zIndex = String(1 + Math.round(s * 10));
    return el;
  }
  function paintScene(i, { fade = true } = {}) {
    const sc = scenes[i];
    const cam = sceneEl(bgOf(sc), { shape: 'stage', ambient: 'full', cls: 'ls-cam', orb: orbOf(sc) });
    cam.append(...arr(sc.actors).slice(0, 6).filter(a => txt(a.e)).map(actorEl));
    cam.style.setProperty('--ox', i % 2 ? '35%' : '65%');
    cam.style.setProperty('--kb', `${Math.max(6, Math.round(voiceGuess(sc) / 1000) + 4)}s`);
    const layer = h('div', { class: `ls-scene${fade ? ' is-in' : ''}` }, cam);
    const old = [...sceneBox.children];
    sceneBox.append(layer);
    // El fundido: la escena nueva aparece encima y la anterior se quita después.
    if (old.length) life.later(() => old.forEach(o => o.remove()), reduceMotion() || !fade ? 0 : 700);
    setCaption(capOf(sc));
    caption.classList.remove('is-new');
    void caption.offsetWidth;
    caption.classList.add('is-new');
    counter.textContent = `Escena ${i + 1} de ${n}`;
    sh.setChip({ text: `${i + 1}/${n}`, label: `Escena ${i + 1} de ${n}` });
    paintSegs();
  }
  function paintSegs() {
    [...segs.children].forEach((s, k) => {
      s.classList.toggle('is-done', k < cur || phase === 'done' || phase === 'quiz');
      s.classList.toggle('is-now', k === cur && phase === 'play');
      const fill = k < cur || phase === 'done' || phase === 'quiz' ? 1 : k === cur ? fillNow() : 0;
      s.firstChild.style.transform = `scaleX(${fill.toFixed(3)})`;
    });
  }
  function fillNow() { return mode === 'voice' ? Math.min(0.97, elapsed / dur) : Math.min(1, elapsed / dur); }
  function paintButtons() {
    playBtn.firstChild.textContent = playing ? '⏸' : '▶';
    const label = phase === 'intro' ? 'Empezar la lección' : playing ? 'Pausar' : 'Seguir';
    playBtn.setAttribute('aria-label', label);
    playBtn.title = label;
    stage.setAttribute('aria-label', phase === 'intro' ? 'Empezar la lección' : playing ? 'Pausar la lección' : 'Seguir la lección');
    pausedEl.hidden = !(phase === 'play' && !playing);
    stage.classList.toggle('is-paused', phase === 'play' && !playing);
    prevBtn.disabled = phase !== 'play';
    nextBtn.disabled = phase !== 'play';
    const voiceOk = voiceReady();
    muteBtn.disabled = !voiceOk;
    muteBtn.firstChild.textContent = voiceOk && !muted ? '🔊' : '🔇';
    const ml = !voiceOk ? (tts.available() ? 'La voz está apagada en Ajustes' : 'La voz no está disponible en este teléfono') : muted ? 'Activar la voz' : 'Silenciar la voz';
    muteBtn.setAttribute('aria-label', ml);
    muteBtn.title = ml;
    muteBtn.setAttribute('aria-pressed', String(voiceOk && muted));
  }

  // ── Reproducción ──
  let cutAt = -1e9;         // cuándo se cortó la voz por última vez
  function stopVoice() { tok++; life.cancel(waitId); waitId = 0; cutAt = performance.now(); tts.stop(); }

  function begin(i, { fade = true } = {}) {
    stopVoice();
    cur = clamp(i, 0, n - 1);
    elapsed = 0;
    paintScene(cur, { fade });
    if (playing) run();
    else { mode = canVoice() ? 'voice' : 'time'; dur = mode === 'voice' ? voiceGuess(scenes[cur]) : timeFor(scenes[cur]); paintSegs(); }
  }
  // Empieza (o retoma) la escena actual.
  function run() {
    const my = ++tok;
    const sc = scenes[cur];
    lastTick = performance.now();
    if (canVoice()) {
      mode = 'voice';
      elapsed = 0;                                // la voz siempre lee la escena desde el principio
      dur = voiceGuess(sc);
      // Al cortar una voz (⏭, ⏮…), algunos navegadores avisan un instante después que la anterior «terminó».
      // Esperar un poquito evita confundir ese aviso tardío con el final de la escena nueva.
      const gap = Math.ceil(cutAt + 250 - performance.now());
      if (gap > 0) waitId = life.later(() => { if (my === tok && playing && phase === 'play') say(my, sc); }, gap);
      else say(my, sc);
    } else {
      mode = 'time';
      dur = timeFor(sc);
    }
    paintSegs();
  }
  function say(my, sc) {
    const t0 = Date.now();
    const text = sayOf(sc);
    const ok = tts.speak(text, { onend: () => {
      if (my !== tok || !playing || phase !== 'play') return;
      const spent = Date.now() - t0;
      if (spent < 400 && text.length > 24) {    // la voz no pudo hablar: seguimos por tiempo
        mode = 'time';
        dur = timeFor(sc);
        elapsed = Math.min(elapsed, dur - 1200);
        return;
      }
      elapsed = dur;
      paintSegs();
      waitId = life.later(() => { if (my === tok && playing) skip(true); }, 800);
    } });
    if (!ok && my === tok) { mode = 'time'; dur = timeFor(sc); }
  }
  function tick() {
    if (phase !== 'play' || !playing) return;
    const now = performance.now();
    elapsed += Math.min(400, now - lastTick);
    lastTick = now;
    if (mode === 'time' && elapsed >= dur) { skip(true); return; }
    // Seguro: si la voz se quedó callada sin avisar, la lección sigue igual.
    if (mode === 'voice' && elapsed > dur * 2.4 + 5000) { skip(true); return; }
    paintSegs();
  }
  life.every(tick, TICK);

  function start() {
    phase = 'play';
    playing = true;
    introEl.classList.add('is-gone');
    life.later(() => introEl.remove(), 500);
    begin(0, { fade: false });
    paintButtons();
  }
  function pause() {
    if (phase !== 'play' || !playing) return;
    playing = false;
    stopVoice();
    paintButtons();
    paintSegs();
  }
  function resume() {
    if (phase !== 'play' || playing) return;
    playing = true;
    run();
    paintButtons();
  }
  function toggle() {
    if (phase === 'intro') { start(); return; }
    if (phase !== 'play') return;
    if (playing) pause(); else resume();
  }
  function skip(auto = false) {
    if (phase !== 'play') return;
    if (cur >= n - 1) { finish(); return; }
    if (!auto) sfx('whoosh');
    begin(cur + 1);
  }
  function prev() {
    if (phase !== 'play') return;
    begin(cur > 0 && elapsed < 2500 ? cur - 1 : cur);
  }
  function toggleMute() {
    if (!voiceReady()) return;
    muted = !muted;
    mutedThisSession = muted;
    if (phase === 'play') {
      if (muted) {
        const keep = elapsed;
        stopVoice();
        mode = 'time';
        dur = timeFor(scenes[cur]);
        elapsed = Math.min(keep, dur - 600);
        lastTick = performance.now();
      } else if (playing) { stopVoice(); run(); }
    }
    paintButtons();
  }

  // Tocar el cuadro: empezar o pausar.
  stage.addEventListener('click', () => { sfx('tap'); toggle(); });
  stage.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  life.on(window, 'keydown', e => {
    if (!sh.root.isConnected || document.querySelector('.modal-scrim, .game')) return;
    if (e.key === 'Escape') { back(); return; }
    if (phase !== 'play' || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName || '')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); skip(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  });
  // Si el niño sale de la app, la lección se pausa.
  life.on(document, 'visibilitychange', () => { if (document.hidden) pause(); });

  // ── Final y cuestionario ──
  function finish() {
    stopVoice();
    playing = false;
    phase = 'done';
    cur = n - 1;
    paintSegs();
    paintButtons();
    const first = state.markRead(`lesson:${L.id}`);
    const gains = first ? grant(PRIZE.read) : [];
    // Un sobre de figuritas por cada lección terminada (una sola vez por lección).
    try { if (grantPackOnce(`lesson:${L.id}`, 1, 'Lección terminada')) gains.push(['✉️', '+1 sobre de figuritas']); } catch { /* sin álbum */ }
    sfx(first ? 'win' : 'good');
    stage.append(h('div', { class: 'ls-done', 'aria-hidden': 'true' },
      h('span', { class: 'ls-done__rays' }),
      h('span', { class: 'ls-done__dove' }, '🕊️'),
      h('span', { class: 'ls-done__title' }, '¡Muy bien!')));
    stage.setAttribute('aria-label', 'Lección terminada');
    stage.tabIndex = -1;
    if (first) celebrate(sh.page);
    player.classList.add('is-done');
    const hasQuiz = arr(L.quiz).length > 0;
    clear(endBox).append(h('section', { class: 'ls-end', 'aria-label': 'Lección terminada' },
      h('h2', { class: 'ls-end__title' }, deco('🎉'), first ? '¡Terminaste la lección!' : '¡Muy bien! La viste otra vez.'),
      rewardRow(gains),
      hasQuiz ? button('Responder las preguntas', { kind: 'sun', block: true, icon: '🎯', sound: 'pop', onClick: openQuiz }) : null,
      h('div', { class: 'ls-end__row' },
        button('Ver otra vez', { kind: 'ghost', small: true, icon: '🔄', onClick: replay }),
        nextLessonBtn(true))));
    life.later(() => endBox.scrollIntoView({ behavior: smooth(), block: 'nearest' }), 80);
  }
  function nextLessonBtn(small = false) {
    return next
      ? button('Siguiente lección', { kind: 'sky', small, icon: '▶️', onClick: () => go('lesson', { id: next.id }, { replace: true }) })
      : button('Volver a las lecciones', { kind: 'sky', small, icon: '📚', onClick: () => back() });
  }
  function replay() {
    phase = 'intro';
    player.classList.remove('is-done');
    stage.querySelector('.ls-done')?.remove();
    stage.tabIndex = 0;
    clear(endBox);
    sh.fill(player, endBox);
    start();
    stage.focus({ preventScroll: true });
  }
  function openQuiz() {
    phase = 'quiz';
    stopVoice();
    const q = quiz(L.quiz, { key: `lesson:${L.id}`, prize: PRIZE.quiz, perfectOnly: true, title: 'Preguntas de la lección', fx: sh.page,
      onFinish: slot => {
        slot.append(h('div', { class: 'ls-end__row' },
          button('Ver la lección', { kind: 'ghost', small: true, icon: '🎬', onClick: replay }),
          nextLessonBtn(true)));
      } });
    sh.setChip(null);
    sh.fill(
      h('header', { class: 'ls-qhead' },
        h('span', { class: 'ls-qhead__icon', 'aria-hidden': 'true' }, txt(L.emoji) || '🎬'),
        h('div', null, h('p', { class: 'eyebrow' }, 'Lección'), h('h2', null, txt(L.title)))),
      q || soon('Sin preguntas', 'Esta lección no tiene preguntas todavía.', '🎯'));
  }

  // Primer cuadro: la portada de la lección con su color; la primera escena ya está detrás, esperando.
  paintScene(0, { fade: false });
  setCaption(txt(L.summary) || 'Toca ▶ para ver la lección.');
  sh.setChip(null);
  counter.textContent = `${n} escenas`;
  mode = canVoice() ? 'voice' : 'time';
  dur = mode === 'voice' ? voiceGuess(scenes[0]) : timeFor(scenes[0]);
  paintSegs();
  paintButtons();
  stage.focus({ preventScroll: true });

  return {
    unmount() { playing = false; phase = 'gone'; stopVoice(); life.end(); sh.root.remove(); },
  };
}
