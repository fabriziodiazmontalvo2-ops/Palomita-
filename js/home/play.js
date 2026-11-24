// Jugar con la palomita dentro del Nido, sin leer:
//   «Simón dice»: la palomita mueve una parte (ala, ala, patitas, cabeza) con su sonido; el niño la repite tocándola.
//                 Cada ronda suma un paso. Al fallar, se muestra cuál era y se termina con un aplauso.
//   La pelota:    se arrastra y se suelta hacia la palomita; ella la devuelve con la cabeza (ver js/pet/world.js).
//
//   const play = createPlay(ctx)   ctx: { el, world, dove, say, joy, celebrate, alive(), setBusy(bool) }
//   play.choose()   ventanita para elegir el juego        play.simon()        play.stop()
import * as state from '../core/state.js';
import { h, modal, toast } from '../core/ui.js';
import { sfx, tone } from '../core/audio.js';

const PARTS = [
  { part: 'wingL', anim: 'wave', label: 'esta ala', freq: 523 },
  { part: 'wingR', anim: 'waveR', label: 'esta otra ala', freq: 659 },
  { part: 'feet', anim: 'hop', label: 'las patitas', freq: 392 },
  { part: 'head', anim: 'nod', label: 'la cabeza', freq: 784 },
];
const wait = ms => new Promise(r => setTimeout(r, ms));

export function createPlay(ctx) {
  let game = null;           // { seq, step, phase, banner, off }

  function choose() {
    const m = modal({ title: '¿A qué jugamos?', icon: '🎾', className: 'pl-modal',
      body: h('div', { class: 'pl-choices' },
        h('button', { type: 'button', class: 'pl-choice', onclick: () => { m.close(); setTimeout(simon, 150); } },
          h('span', { 'aria-hidden': 'true' }, '🪽'), h('b', null, 'Simón dice'), h('span', null, 'Mira lo que mueve y repítelo')),
        h('button', { type: 'button', class: 'pl-choice', onclick: () => { m.close(); ballHint(); } },
          h('span', { 'aria-hidden': 'true' }, '⚽'), h('b', null, 'La pelota'), h('span', null, 'Lánzasela y te la devuelve')),
        h('button', { type: 'button', class: 'pl-choice', onclick: () => { m.close(); ctx.dance?.(); } },
          h('span', { 'aria-hidden': 'true' }, '💃'), h('b', null, 'Bailar'), h('span', null, 'Un bailecito juntos'))),
      buttons: [{ label: 'Cerrar', kind: 'ghost', small: true }] });
  }

  function ballHint() {
    ctx.say('Arrastra la pelota con el dedo y suéltala hacia mí ⚽', 4200);
  }
  // La pelota volvió con un cabezazo
  function onBallHit(n) {
    state.dailyOnce('play');
    ctx.joy?.(1.2);
    if (n === 3 && state.dailyOnce('ball3')) { state.addCoins(2); toast('¡Tres cabezazos seguidos! +2 semillas', { icon: '⚽' }); }
    if (n >= 2) ctx.say(n >= 5 ? `¡${n} seguidos! ¡Somos un equipo! 🏆` : `¡${n} seguidos! ⚽`, 1800);
    else ctx.say(['¡Cabezazo! ⚽', '¡Otra vez, otra vez!', '¡Te la devuelvo!'][Math.floor(Math.random() * 3)], 1800);
  }

  // ── Simón dice ──
  function marker(part, kind = 'show') {
    const p = ctx.world.project(part);
    const m = h('span', { class: `sm-ring sm-ring--${kind}`, 'aria-hidden': 'true' });
    m.style.left = `${p.x}px`; m.style.top = `${p.y}px`;
    ctx.el.append(m);
    setTimeout(() => m.remove(), 900);
  }
  function perform(p, kind = 'show') {
    ctx.dove.play(p.anim);
    tone(p.freq, 0.35, { type: 'triangle', vol: 0.35 });
    marker(p.part, kind);
  }
  async function showSeq() {
    game.phase = 'show';
    game.banner.textContent = `Mira bien… (ronda ${game.seq.length})`;
    await wait(700);
    for (const p of game.seq) {
      if (!game || !ctx.alive()) return;
      perform(p);
      await wait(1150);
    }
    if (!game) return;
    game.phase = 'input'; game.step = 0;
    game.banner.textContent = '¡Tu turno! Toca lo que movió';
  }
  function onTap(part) {
    if (!game || game.phase !== 'input') return true;          // mientras mira, los toques no cuentan
    const p = PARTS.find(x => x.part === part);
    if (!p) return true;                                      // tocar la barriga no es error
    const want = game.seq[game.step];
    if (p.part === want.part) {
      perform(p, 'ok');
      game.step++;
      if (game.step >= game.seq.length) {
        game.phase = 'wait';
        sfx('good');
        game.banner.textContent = '¡Muy bien!';
        if (game.seq.length >= 8) { setTimeout(() => finish(true), 700); return true; }
        setTimeout(() => { if (!game) return; game.seq.push(PARTS[Math.floor(Math.random() * PARTS.length)]); showSeq(); }, 900);
      }
    } else {
      game.phase = 'wait';
      sfx('wrong');
      marker(want.part, 'want');
      game.banner.textContent = `¡Casi! Era ${want.label}`;
      setTimeout(() => finish(false), 1400);
    }
    return true;
  }
  function finish(won) {
    if (!game) return;
    const rounds = won ? game.seq.length : game.seq.length - 1;
    stop();
    state.dailyOnce('play');
    ctx.joy?.(Math.min(6, 2 + rounds));
    ctx.dove.play(rounds >= 3 ? 'dance' : 'giggle');
    if (rounds >= 3) { ctx.celebrate?.(); if (state.dailyOnce('simon3')) { state.addCoins(3); toast(`¡${rounds} rondas! +3 semillas`, { icon: '🏆' }); } }
    ctx.say(rounds >= 5 ? `¡Increíble! Llegaste a ${rounds} rondas 🏆` : rounds >= 1 ? `¡Hiciste ${rounds} ${rounds === 1 ? 'ronda' : 'rondas'}! ¿Otra vez?` : '¡Buen intento! Juguemos otra vez 💛', 3600);
  }
  function simon() {
    if (game) return;
    const banner = h('div', { class: 'sm-banner', role: 'status', 'aria-live': 'polite' }, 'Simón dice');
    const exit = h('button', { type: 'button', class: 'sm-exit', 'aria-label': 'Terminar el juego', onclick: () => { sfx('tap'); stop(); } }, '✖');
    const box = h('div', { class: 'sm-box' }, banner, exit);
    ctx.el.append(box);
    game = { seq: [PARTS[Math.floor(Math.random() * PARTS.length)]], step: 0, phase: 'show', banner, box };
    ctx.setBusy?.(true);
    ctx.say('¡Simón dice! Mira lo que muevo y repítelo tocándome', 3000);
    setTimeout(() => { if (game) showSeq(); }, 900);
  }
  function stop() {
    if (!game) return;
    game.box.remove();
    game = null;
    ctx.setBusy?.(false);
  }
  return { choose, simon, stop, onTap, onBallHit, get playing() { return !!game; } };
}
