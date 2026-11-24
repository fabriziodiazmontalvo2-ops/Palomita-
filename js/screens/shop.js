// Tienda: comida, ropa y cosas para la casa que se compran con semillas (se ganan jugando, leyendo y rezando; nunca con
// dinero). La ropa depende del género de la palomita: solo aparece la de su género y la que es para todos.
//   go('shop', { tab: 'comida' | 'accesorios' | 'casa' | 'mis-cosas' })
import * as state from '../core/state.js';
import { sfx } from '../core/audio.js';
import { h, clear, iconButton, modal, confirmDialog, toast } from '../core/ui.js';
import { go, back } from '../core/router.js';
import { FOODS, ACCESSORIES, SLOTS, SLOT_SHORT } from '../data/items.js';
import { G, fits, gender } from '../core/genero.js';
import { accArt } from '../core/accart.js';
import { DECOR, DECOR_SLOTS, decorDefault } from '../data/decor.js';

const TABS = () => [['comida', '🍞', 'Comida'], ['accesorios', gender() === 'varon' ? '👕' : '👗', 'Ropa'], ['casa', '🏠', 'Casa'], ['mis-cosas', '🎒', 'Mis cosas']];
export async function mount(el, params = {}) {
  let tab = TABS().some(t => t[0] === params.tab) ? params.tab : 'comida';
  let facts = {};
  import('../data/phrases.js').then(m => { facts = m.FOOD_FACTS || {}; }).catch(() => {});

  const coins = h('span', { class: 'chip shop-coins' });
  const tabsEl = h('div', { class: 'shop-tabs', role: 'tablist' });
  const list = h('div', { class: 'scroll shop-scroll' });
  el.append(h('header', { class: 'topbar' }, iconButton('↩️', 'Volver', () => back()), h('h1', null, 'Tienda'), coins), tabsEl, list);

  const level = () => state.get().level;
  function refreshCoins() { clear(coins).append(h('span', { 'aria-hidden': 'true' }, state.COIN.icon), String(state.get().coins)); }
  function shake(node) { node.classList.remove('is-shake'); void node.offsetWidth; node.classList.add('is-shake'); }
  function bump(node) { node.classList.remove('is-bump'); void node.offsetWidth; node.classList.add('is-bump'); }
  function short(n) {
    sfx('wrong');
    toast(`Te faltan ${n} ${n === 1 ? 'semilla' : 'semillas'}. ¡Gánalas jugando!`, { icon: state.COIN.icon, ms: 2800 });
  }
  const button2 = (label, fn) => h('button', { type: 'button', class: 'btn btn--sm btn--ghost shop-see', onclick: () => { sfx('tap'); fn(); } }, h('span', { 'aria-hidden': 'true' }, '🏠'), label);
  const priceTag = (price, cls = '') => h('span', { class: `shop-price ${cls}`.trim() }, h('span', { 'aria-hidden': 'true' }, state.COIN.icon), String(price));

  function foodCard(f) {
    const locked = level() < f.level;
    const have = state.countItem(f.id);
    const count = h('span', { class: 'shop-card__have' }, have ? `Tienes ${have}` : ' ');
    const card = h('div', { class: `shop-card ${locked ? 'is-locked' : ''}`.trim() },
      h('button', { type: 'button', class: 'shop-card__art', 'aria-label': `${f.name}: ver un dato`, onclick: () => { sfx('tap'); modal({ title: f.name, icon: f.emoji, body: facts[f.id] || 'Un alimento rico para tu palomita.', buttons: [{ label: '¡Qué bien!', kind: 'sun' }] }); } }, f.emoji),
      h('span', { class: 'shop-card__name' }, f.name),
      h('span', { class: 'shop-card__info' }, `Llena ${f.hambre >= 26 ? 'mucho' : f.hambre >= 14 ? 'bastante' : 'un poquito'}`),
      count,
      locked ? h('span', { class: 'shop-lock' }, `🔒 Nivel ${f.level}`)
        : h('button', { type: 'button', class: 'btn btn--sm btn--leaf shop-buy', 'aria-label': `Comprar ${f.name} por ${f.price} semillas`, onclick: () => {
          if (!state.spendCoins(f.price)) { shake(card); short(f.price - state.get().coins); return; }
          state.addItem(f.id, 1); sfx('coin'); bump(card);
          count.textContent = `Tienes ${state.countItem(f.id)}`;
        } }, priceTag(f.price)));
    return card;
  }

  function accCard(a) {
    const owned = state.owns(a.id), locked = !owned && (a.reward ? true : level() < a.level);
    const on = state.get().wearing[a.slot] === a.id;
    const card = h('div', { class: `shop-card ${locked ? 'is-locked' : ''} ${on ? 'is-on' : ''}`.trim(), dataset: { acc: a.id } },
      accArt(a),
      h('span', { class: 'shop-card__name' }, a.name),
      // Probárselo antes de comprar: se lo pone en el ropero del Nido
      !owned && !a.reward ? h('button', { type: 'button', class: 'shop-try', 'aria-label': G(`Probarle ${a.name} a {la palomita|el palomito}`), onclick: () => { sfx('tap'); go('home', { room: 'sala', ropero: a.id }); } }, '👀 Probar') : null,
      owned ? h('button', { type: 'button', class: `btn btn--sm ${on ? 'btn--ghost' : 'btn--sky'} shop-buy`, onclick: () => { sfx('pop'); state.wear(a.slot, on ? null : a.id); render(); } }, on ? 'Quitar' : 'Poner')
        : a.reward ? h('span', { class: 'shop-lock' }, `🏆 ${a.reward} ★`)
        : locked ? h('span', { class: 'shop-lock' }, `🔒 Nivel ${a.level}`)
          : h('button', { type: 'button', class: 'btn btn--sm btn--leaf shop-buy', 'aria-label': `Comprar ${a.name} por ${a.price} semillas`, onclick: async () => {
            if (state.get().coins < a.price) { shake(card); short(a.price - state.get().coins); return; }
            const ok = await confirmDialog(`¿Compramos «${a.name}» por ${a.price} semillas?`, { yes: '¡Sí!', no: 'Mejor no', icon: a.emoji, kind: 'leaf' });
            if (!ok || !state.spendCoins(a.price)) return;
            state.own(a.id); state.wear(a.slot, a.id); sfx('sticker');
            toast(`¡${state.get().name} estrena ${a.name.toLowerCase()}!`, { icon: a.emoji });
            render();
          } }, priceTag(a.price)));
    return card;
  }

  // Decoración del Nido: cuadros, planta, alfombra y cortinas
  function decorCard(d) {
    const owned = d.default || state.owns(d.id);
    const chosen = (state.get().decor?.[d.slot] || decorDefault(d.slot)?.id) === d.id;
    const locked = !owned && (d.earn ? true : level() < d.level);
    const card = h('div', { class: `shop-card ${locked ? 'is-locked' : ''} ${chosen ? 'is-on' : ''}`.trim() },
      h('span', { class: 'shop-card__art', 'aria-hidden': 'true' }, d.emoji),
      h('span', { class: 'shop-card__name' }, d.name),
      owned ? h('button', { type: 'button', class: `btn btn--sm ${chosen ? 'btn--ghost' : 'btn--sky'} shop-buy`, attrs: null, disabled: chosen ? true : null,
        onclick: () => { sfx('pop'); state.setDecor(d.slot, d.id); toast(`¡Listo! Se ve en el Nido`, { icon: d.emoji }); render(); } }, chosen ? 'Puesto' : 'Poner')
        : d.earn ? h('span', { class: 'shop-lock shop-lock--earn' }, `🏆 ${d.note}`)
        : locked ? h('span', { class: 'shop-lock' }, `🔒 Nivel ${d.level}`)
          : h('button', { type: 'button', class: 'btn btn--sm btn--leaf shop-buy', 'aria-label': `Comprar ${d.name} por ${d.price} semillas`, onclick: async () => {
            if (state.get().coins < d.price) { shake(card); short(d.price - state.get().coins); return; }
            const ok = await confirmDialog(`¿Compramos «${d.name}» por ${d.price} semillas para el Nido?`, { yes: '¡Sí!', no: 'Mejor no', icon: d.emoji, kind: 'leaf' });
            if (!ok || !state.spendCoins(d.price)) return;
            state.own(d.id); state.setDecor(d.slot, d.id); sfx('sticker');
            toast('¡Nuevo en el Nido!', { icon: d.emoji });
            render();
          } }, priceTag(d.price)));
    return card;
  }

  function render() {
    refreshCoins();
    clear(tabsEl).append(...TABS().map(([id, icon, label]) => h('button', { type: 'button', role: 'tab', class: `shop-tab ${id === tab ? 'is-on' : ''}`.trim(), 'aria-selected': String(id === tab),
      onclick: () => { sfx('tap'); tab = id; render(); list.scrollTop = 0; } }, h('span', { 'aria-hidden': 'true' }, icon), label)));
    clear(list);
    if (tab === 'comida') {
      list.append(h('p', { class: 'shop-note' }, 'Las semillas se ganan jugando, leyendo y rezando. Toca un alimento para saber dónde aparece en la Biblia.'),
        h('div', { class: 'shop-grid' }, FOODS.map(foodCard)));
    } else if (tab === 'accesorios') {
      // Primero la moda de su género, después lo que es para todos (por lugar) y los premios de los juegos.
      const varon = gender() === 'varon';
      const sold = ACCESSORIES.filter(a => !a.reward && fits(a));
      const byPlace = list2 => list2.slice().sort((a, b) => SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot) || a.level - b.level || a.price - b.price);
      list.append(h('p', { class: 'shop-note' }, G('Ropa a la moda para tu {palomita|palomito}. Toca «👀 Probar» para vérsela puesta antes de comprar.')),
        h('h2', { class: 'shop-group shop-group--moda' }, varon ? '💙 Moda de varón' : '💗 Moda de mujer'),
        h('div', { class: 'shop-grid' }, byPlace(sold.filter(a => a.gender)).map(accCard)));
      for (const slot of SLOTS) {
        const items = sold.filter(a => !a.gender && a.slot === slot);
        if (items.length) list.append(h('h2', { class: 'shop-group' }, `Para todos · ${SLOT_SHORT[slot]}`), h('div', { class: 'shop-grid' }, byPlace(items).map(accCard)));
      }
      list.append(h('h2', { class: 'shop-group' }, 'Premios de los juegos'), h('p', { class: 'shop-note' }, `Se ganan juntando estrellas en los niveles. Tienes ★ ${state.totalStars()}.`),
        h('div', { class: 'shop-grid' }, ACCESSORIES.filter(a => a.reward && fits(a)).sort((a, b) => a.reward - b.reward).map(accCard)));
    } else if (tab === 'casa') {
      list.append(h('p', { class: 'shop-note' }, G('Decora el Nido de tu {palomita|palomito}. Lo que compres se ve al volver a casa.')),
        button2('Ver el Nido', () => go('home', { room: 'sala' })));
      for (const slot of DECOR_SLOTS) {
        list.append(h('h2', { class: 'shop-group' }, `${slot.icon} ${slot.name}`), h('div', { class: 'shop-grid' }, DECOR.filter(d => d.slot === slot.id).map(decorCard)));
      }
    } else {
      const mine = ACCESSORIES.filter(a => state.owns(a.id) && fits(a));
      const kept = ACCESSORIES.filter(a => state.owns(a.id) && !fits(a)).length;
      const foods = FOODS.filter(f => state.countItem(f.id) > 0);
      list.append(h('h2', { class: 'shop-group' }, 'Mi ropa'),
        mine.length ? h('div', { class: 'shop-grid' }, mine.map(accCard))
          : h('p', { class: 'shop-empty' }, 'Todavía no tienes ropa. ¡Junta semillas y elige la primera!'),
        kept ? h('p', { class: 'shop-note' }, `Hay ${kept === 1 ? 'una cosa guardada' : `${kept} cosas guardadas`} de ${gender() === 'varon' ? 'mujer' : 'varón'}: aparece${kept === 1 ? '' : 'n'} si en Ajustes cambias a ${gender() === 'varon' ? 'mujer' : 'varón'}.`) : null,
        h('h2', { class: 'shop-group' }, 'Mi despensa'),
        foods.length ? h('div', { class: 'shop-pantry' }, foods.map(f => h('span', { class: 'chip' }, h('span', { 'aria-hidden': 'true' }, f.emoji), `${f.name} × ${state.countItem(f.id)}`)))
          : h('p', { class: 'shop-empty' }, 'La despensa está vacía. Compra algo rico en «Comida».'));
    }
  }
  render();
  const offs = [state.on('coins', refreshCoins)];
  return { unmount() { for (const off of offs) off(); } };
}
