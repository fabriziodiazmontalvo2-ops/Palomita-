// Mapa de niveles de un juego: un camino de 100 piedritas con estrellas, cofres cada 10 niveles y medallas.
//   go('levels', { game: 'noe' })
import * as state from '../core/state.js';
import { sfx } from '../core/audio.js';
import { h, clear, iconButton, button, reduceMotion } from '../core/ui.js';
import { back } from '../core/router.js';
import { getGame } from '../games/registry.js';
import { startGame } from '../games/engine.js';
import { MAX_LEVEL, MEDALS, isChest } from '../games/levels.js';

const STEP = 92;            // separación vertical entre niveles (px)

export function mount(el, params = {}) {
  const def = getGame(params.game);
  if (!def) { back(); return {}; }
  el.classList.add('lv');
  el.style.setProperty('--c1', def.colors[0]);
  el.style.setProperty('--c2', def.colors[1]);

  const starsChip = h('span', { class: 'chip' });
  const scroll = h('div', { class: 'lv-scroll' });
  const track = h('div', { class: 'lv-track' });
  scroll.append(track);
  const playBtn = button('Jugar', { kind: 'sun', icon: '▶️', block: true, sound: 'pop', onClick: () => play(state.levelProgress(def.id).unlocked) });
  el.append(
    h('header', { class: 'topbar' }, iconButton('↩️', 'Volver', () => back()), h('h1', null, def.title), starsChip),
    scroll,
    h('div', { class: 'lv-foot' }, playBtn));

  // x de cada nivel: el camino serpentea de lado a lado (abajo el nivel 1).
  const xOf = n => 50 + Math.sin(n * 0.62) * 30;
  const yOf = n => (MAX_LEVEL - n) * STEP + 70;

  function render() {
    const p = state.levelProgress(def.id);
    clear(starsChip).append(h('span', { 'aria-hidden': 'true' }, '★'), ` ${p.total}/${MAX_LEVEL * 3}`);
    starsChip.setAttribute('aria-label', `${p.total} de ${MAX_LEVEL * 3} estrellas`);
    playBtn.lastChild.textContent = `Jugar nivel ${p.unlocked}`;
    clear(track);
    track.style.height = `${yOf(1) + 110}px`;
    // camino
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'lv-path'); svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('viewBox', `0 0 100 ${yOf(1) + 110}`); svg.setAttribute('preserveAspectRatio', 'none');
    let d = '';
    for (let n = 1; n <= MAX_LEVEL; n++) d += `${n === 1 ? 'M' : 'L'} ${xOf(n).toFixed(2)} ${yOf(n)} `;
    for (const [cls, upTo] of [['lv-path__all', MAX_LEVEL], ['lv-path__done', p.unlocked]]) {
      const path = document.createElementNS(svgNS, 'path');
      let dd = '';
      for (let n = 1; n <= upTo; n++) dd += `${n === 1 ? 'M' : 'L'} ${xOf(n).toFixed(2)} ${yOf(n)} `;
      path.setAttribute('d', dd); path.setAttribute('class', cls); path.setAttribute('vector-effect', 'non-scaling-stroke');
      svg.append(path);
    }
    track.append(svg);
    for (let n = 1; n <= MAX_LEVEL; n++) {
      const stars = p.stars(n), locked = n > p.unlocked, current = n === p.unlocked;
      const milestone = MEDALS[n] ? MEDALS[n].icon : isChest(n) ? '🎁' : '';
      const node = h('button', {
        type: 'button', class: `lv-node${locked ? ' is-locked' : ''}${current ? ' is-current' : ''}${stars ? ' is-done' : ''}${milestone ? ' is-milestone' : ''}`,
        style: { left: `${xOf(n)}%`, top: `${yOf(n)}px` }, dataset: { level: n },
        'aria-label': `Nivel ${n}${locked ? ', bloqueado' : stars ? `, ${stars} estrellas` : ''}${milestone ? ', con premio' : ''}`,
        disabled: locked ? true : null,
        onclick: () => play(n),
      },
      h('span', { class: 'lv-node__n' }, locked ? '🔒' : String(n)),
      stars ? h('span', { class: 'lv-node__stars', 'aria-hidden': 'true' }, [0, 1, 2].map(i => h('i', { class: i < stars ? 'is-on' : '' }, '★'))) : null,
      milestone ? h('span', { class: `lv-node__gift${(MEDALS[n] ? p.medals.includes(n) : stars > 0) ? ' is-got' : ''}`, 'aria-hidden': 'true' }, milestone) : null);
      track.append(node);
      if (current) node.append(h('span', { class: 'lv-node__dove', 'aria-hidden': 'true' }, '🕊️'));
    }
    // adornos del paisaje a los lados
    for (let n = 3; n <= MAX_LEVEL; n += 7) {
      const left = xOf(n) > 50;
      track.append(h('span', { class: 'lv-deco', style: { left: left ? '9%' : '84%', top: `${yOf(n) + 20}px` }, 'aria-hidden': 'true' }, ['🌳', '🌸', '⛰️', '🌾', '🌼', '🪨', '🌿', '☁️'][Math.floor(n / 7) % 8]));
    }
  }

  function play(n) {
    sfx('pop');
    startGame(def.id, { level: n, onExit: () => { if (el.isConnected) { render(); focusCurrent(false); } } }).catch(e => console.error(e));
  }
  function focusCurrent(smooth) {
    const n = state.levelProgress(def.id).unlocked;
    const top = yOf(n) - scroll.clientHeight * 0.55;
    scroll.scrollTo({ top: Math.max(0, top), behavior: smooth && !reduceMotion() ? 'smooth' : 'auto' });
  }

  render();
  requestAnimationFrame(() => focusCurrent(false));
  if (params.autoplay) play(state.levelProgress(def.id).unlocked);
  return { unmount() { el.classList.remove('lv'); } };
}
