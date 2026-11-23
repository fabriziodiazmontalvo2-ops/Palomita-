// Pantalla "Juegos": lista de minijuegos con su parábola, récord y estampita.
import * as state from '../core/state.js';
import { h, clear, iconButton, modal } from '../core/ui.js';
import { sfx } from '../core/audio.js';
import { back } from '../core/router.js';
import { GAMES } from '../games/registry.js';
import { go } from '../core/router.js';
import { MAX_LEVEL, MEDALS } from '../games/levels.js';

let parables = null;
async function loadParables() {
  if (parables) return parables;
  try { parables = (await import('../data/parables.js')).PARABLES || {}; } catch { parables = {}; }
  return parables;
}

export async function mount(el, params = {}) {
  const P = await loadParables();
  const grid = h('div', { class: 'games-grid' });
  const stickersChip = h('button', { type: 'button', class: 'chip', 'aria-label': 'Ver mis premios', onclick: () => { sfx('tap'); album(); } });
  const coinsChip = h('span', { class: 'chip' });

  function render() {
    clear(grid);
    clear(stickersChip).append(h('span', { 'aria-hidden': 'true' }, '★'), String(state.totalStars()));
    clear(coinsChip).append(h('span', { 'aria-hidden': 'true' }, state.COIN.icon), String(state.get().coins));
    for (const def of GAMES) {
      const lp = state.levelProgress(def.id);
      const p = P[def.parable];
      const done = Math.min(MAX_LEVEL, lp.cleared);
      const card = h('button', { type: 'button', class: 'game-card', dataset: { game: def.id }, onclick: () => play(def.id) },
        h('span', { class: 'game-card__icon', 'aria-hidden': 'true' }, def.icon),
        h('span', { class: 'game-card__best' }, `Nivel ${lp.unlocked}`),
        h('span', { class: 'game-card__title' }, def.title),
        h('span', { class: 'game-card__sub' }, p ? `${p.kind === 'historia' ? 'Historia' : 'Parábola'}: ${p.title}` : ''),
        h('span', { class: 'game-card__prog', 'aria-label': `${done} de ${MAX_LEVEL} niveles, ${lp.total} estrellas` },
          h('span', { class: 'game-card__bar' }, h('i', { style: { width: `${done}%` } })),
          h('span', { class: 'game-card__stars' }, `★ ${lp.total}`),
          lp.medals.length ? h('span', { 'aria-hidden': 'true' }, lp.medals.map(m => MEDALS[m]?.icon || '').join('')) : null));
      card.style.setProperty('--c1', def.colors[0]);
      card.style.setProperty('--c2', def.colors[1]);
      grid.append(card);
    }
  }

  function play(id) {
    sfx('pop');
    go('levels', { game: id });
  }

  // Mis premios: medallas de cada juego y accesorios que se ganan con estrellas.
  async function album() {
    const { STAR_REWARDS, nextStarReward } = await import('../core/rewards.js');
    const { accessory } = await import('../data/items.js');
    const total = state.totalStars();
    const games = h('div', { class: 'gm-album' }, GAMES.map(def => {
      const lp = state.levelProgress(def.id);
      return h('div', { class: 'gm-album__row' },
        h('span', { class: 'gm-album__icon', 'aria-hidden': 'true' }, def.icon),
        h('span', { class: 'gm-album__name' }, def.title, h('small', null, `Nivel ${lp.unlocked} · ★ ${lp.total}`)),
        h('span', { class: 'gm-album__medals' }, [25, 50, 75, 100].map(m => h('span', { class: lp.medals.includes(m) ? 'is-on' : '', title: MEDALS[m].name }, MEDALS[m].icon))));
    }));
    const next = nextStarReward();
    const prizes = h('div', { class: 'gm-prizes' }, STAR_REWARDS.map(r => {
      const a = accessory(r.id), got = state.owns(r.id);
      return h('div', { class: `gm-prize${got ? ' is-on' : ''}` }, h('span', { 'aria-hidden': 'true' }, a?.emoji || '🎁'), h('small', null, got ? a?.name : `${r.stars} ★`));
    }));
    modal({ title: 'Mis premios', icon: '🏆', className: 'gm-album-modal',
      body: [h('p', { style: { textAlign: 'center' } }, `Tienes ★ ${total} estrellas.${next ? ` ${next.stars - total === 1 ? 'Te falta 1 estrella' : `Te faltan ${next.stars - total} estrellas`} para el próximo regalo.` : ''}`), prizes, games],
      buttons: [{ label: '¡Listo!', kind: 'sun' }] });
  }

  el.append(
    h('header', { class: 'topbar' },
      iconButton('↩️', 'Volver', () => back()),
      h('h1', null, 'Juegos'),
      coinsChip, stickersChip),
    h('div', { class: 'scroll' },
      h('p', { style: { color: 'var(--white)', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-md)', margin: '0 0 12px', textShadow: '0 1px 0 rgba(40,90,140,0.4)' } },
        'Cada juego tiene 100 niveles y guarda un mensaje de Jesús para ti. ¡Junta estrellas y gana premios!'),
      grid));
  render();
  const off = state.on('coins', () => { if (coinsChip.isConnected) render(); });

  if (params.play) setTimeout(() => go('levels', { game: params.play }, { replace: true }), 0);
  return { unmount() { off(); } };
}
