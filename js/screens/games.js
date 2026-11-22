// Pantalla "Juegos": lista de minijuegos con su parábola, récord y estampita.
import * as state from '../core/state.js';
import { h, clear, iconButton, modal } from '../core/ui.js';
import { sfx } from '../core/audio.js';
import { back } from '../core/router.js';
import { GAMES } from '../games/registry.js';
import { startGame } from '../games/engine.js';

let parables = null;
async function loadParables() {
  if (parables) return parables;
  try { parables = (await import('../data/parables.js')).PARABLES || {}; } catch { parables = {}; }
  return parables;
}

export async function mount(el, params = {}) {
  const P = await loadParables();
  const grid = h('div', { class: 'games-grid' });
  const stickersChip = h('button', { type: 'button', class: 'chip', 'aria-label': 'Ver mi álbum de estampitas', onclick: () => { sfx('tap'); album(); } });
  const coinsChip = h('span', { class: 'chip' });

  function render() {
    clear(grid);
    const won = state.stickers().length;
    clear(stickersChip).append(h('span', { 'aria-hidden': 'true' }, '🏅'), `${won}/${GAMES.length}`);
    clear(coinsChip).append(h('span', { 'aria-hidden': 'true' }, state.COIN.icon), String(state.get().coins));
    for (const def of GAMES) {
      const info = state.gameInfo(def.id);
      const p = P[def.parable];
      const card = h('button', { type: 'button', class: 'game-card', dataset: { game: def.id }, onclick: () => play(def.id) },
        h('span', { class: 'game-card__icon', 'aria-hidden': 'true' }, def.icon),
        info.sticker ? h('span', { class: 'game-card__badge', title: 'Estampita ganada', 'aria-label': 'Estampita ganada' }, '🏅')
          : info.best > 0 ? h('span', { class: 'game-card__best' }, `Récord ${info.best}`) : null,
        h('span', { class: 'game-card__title' }, def.title),
        h('span', { class: 'game-card__sub' }, p ? `${p.kind === 'historia' ? 'Historia' : 'Parábola'}: ${p.title}` : ''));
      card.style.setProperty('--c1', def.colors[0]);
      card.style.setProperty('--c2', def.colors[1]);
      grid.append(card);
    }
  }

  function play(id) {
    sfx('pop');
    startGame(id, { onExit: () => { if (grid.isConnected) render(); } }).catch(e => console.error(e));
  }

  function album() {
    const body = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' } },
      GAMES.map(def => {
        const has = state.gameInfo(def.id).sticker;
        return h('div', { style: { textAlign: 'center', padding: '10px 4px', borderRadius: '16px', background: has ? '#fff' : 'rgba(61,43,36,0.07)' } },
          h('div', { style: { fontSize: '2.2rem', lineHeight: '1.1', filter: has ? 'none' : 'grayscale(1) opacity(0.35)' }, 'aria-hidden': 'true' }, def.icon),
          h('div', { style: { fontSize: 'var(--fs-xs)', lineHeight: '1.15', marginTop: '4px' } }, has ? def.title : def.goalText));
      }));
    modal({ title: 'Mi álbum de estampitas', icon: '🏅', body, buttons: [{ label: '¡Listo!', kind: 'sun' }] });
  }

  el.append(
    h('header', { class: 'topbar' },
      iconButton('↩️', 'Volver', () => back()),
      h('h1', null, 'Juegos'),
      coinsChip, stickersChip),
    h('div', { class: 'scroll' },
      h('p', { style: { color: 'var(--white)', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-md)', margin: '0 0 12px', textShadow: '0 1px 0 rgba(40,90,140,0.4)' } },
        'Cada juego guarda un mensaje de Jesús para ti. ¡Gana sus estampitas!'),
      grid));
  render();
  const off = state.on('coins', () => { if (coinsChip.isConnected) render(); });

  if (params.play) play(params.play);
  return { unmount() { off(); } };
}
