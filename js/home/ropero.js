// Ropero del Nido: probarle accesorios a la palomita antes de comprarlos (sin guardar nada hasta comprar o ponérselo).
//   const ropero = createRopero(ctx)   ctx: { el, world, dove, say, applyWear }
//   ropero.open(idInicial?)   ropero.close()
import * as state from '../core/state.js';
import { ACCESSORIES } from '../data/items.js';
import { h, clear, confirmDialog, toast } from '../core/ui.js';
import { sfx } from '../core/audio.js';

const SLOT = { head: 'Cabeza', neck: 'Cuello', beak: 'Pico' };

export function createRopero(ctx) {
  let box = null, sel = null;

  function canSee(a) { return state.owns(a.id) || (!a.reward && a.level <= state.get().level); }
  function list() {
    const mine = ACCESSORIES.filter(a => state.owns(a.id));
    const shop = ACCESSORIES.filter(a => !state.owns(a.id) && canSee(a)).sort((a, b) => a.price - b.price);
    return [...mine, ...shop];
  }
  function preview(a) {
    sel = a;
    ctx.applyWear();
    ctx.world.wear(a.slot, a.id);
    ctx.dove.play('spin');
    sfx('pop');
    ctx.say(state.owns(a.id) ? '¿Me lo pongo? 😊' : '¿Cómo me veo? 😊', 2400);
    paint();
  }
  function paint() {
    if (!box) return;
    const items = list();
    const strip = h('div', { class: 'rp-strip', role: 'listbox', 'aria-label': 'Accesorios' }, items.map(a => {
      const owned = state.owns(a.id), on = state.get().wearing[a.slot] === a.id;
      return h('button', { type: 'button', role: 'option', 'aria-selected': String(sel?.id === a.id), 'aria-label': `${a.name}${owned ? (on ? ', puesto' : ', tuyo') : `, ${a.price} semillas`}`,
        class: `rp-item${sel?.id === a.id ? ' is-sel' : ''}${on ? ' is-on' : ''}${owned ? ' is-owned' : ''}`, onclick: () => preview(a) },
        h('span', { class: 'rp-item__icon', 'aria-hidden': 'true' }, a.emoji),
        h('span', { class: 'rp-item__tag', 'aria-hidden': 'true' }, on ? '✓' : owned ? '♥' : `${a.price}`));
    }));
    let action = null;
    if (sel) {
      const owned = state.owns(sel.id), on = state.get().wearing[sel.slot] === sel.id;
      action = owned
        ? h('button', { type: 'button', class: 'btn btn--sm btn--leaf rp-act', onclick: () => { sfx('sticker'); state.wear(sel.slot, on ? null : sel.id); ctx.applyWear(); paint(); } }, on ? 'Quitar' : 'Ponérmelo')
        : h('button', { type: 'button', class: 'btn btn--sm btn--leaf rp-act', onclick: async () => {
          if (state.get().coins < sel.price) { sfx('wrong'); toast(`Te faltan ${sel.price - state.get().coins} semillas`, { icon: '🌱' }); return; }
          if (!(await confirmDialog(`¿Compramos «${sel.name}» por ${sel.price} semillas?`, { yes: '¡Sí!', no: 'Mejor no', icon: sel.emoji, kind: 'leaf' }))) return;
          if (!state.spendCoins(sel.price)) return;
          state.own(sel.id); state.wear(sel.slot, sel.id); sfx('sticker');
          toast(`¡${state.get().name} estrena ${sel.name.toLowerCase()}!`, { icon: sel.emoji });
          ctx.applyWear(); paint();
        } }, `Comprar ${sel.price} 🌱`);
    }
    clear(box).append(
      h('div', { class: 'rp-head' },
        h('span', { class: 'rp-title' }, sel ? h('b', null, sel.name) : h('b', null, '👗 Ropero'), h('span', { class: 'rp-coins' }, sel ? SLOT[sel.slot] : `Tienes ${state.get().coins} 🌱`)),
        action,
        h('button', { type: 'button', class: 'rp-close', 'aria-label': 'Cerrar el ropero', onclick: () => { sfx('tap'); close(); } }, '✖')),
      strip);
    strip.querySelector('.is-sel')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  function open(id) {
    if (!box) { box = h('div', { class: 'rp' }); ctx.el.append(box); }
    sel = null;
    paint();
    const a = id ? ACCESSORIES.find(x => x.id === id) : null;
    if (a) preview(a);
  }
  function close() {
    if (!box) return;
    box.remove(); box = null; sel = null;
    ctx.applyWear();          // vuelve a lo que tenía puesto
  }
  return { open, close, get isOpen() { return !!box; } };
}
