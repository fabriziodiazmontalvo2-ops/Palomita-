// Premios: niveles de los juegos, cofres, medallas, estrellas, subida de nivel de la palomita y regalo diario.
// Todo se paga con semillas, comida y accesorios del juego (nunca dinero real).
import * as state from './state.js';
import { sfx } from './audio.js';
import { h, modal, toast } from './ui.js';
import { FOODS, ACCESSORIES, accessory } from '../data/items.js';
import { MEDALS, isChest } from '../games/levels.js';

const COIN = state.COIN.icon;

// Accesorios que se ganan juntando estrellas en los juegos (no se venden en la tienda).
export const STAR_REWARDS = [
  { stars: 25, id: 'corona-olivo' },
  { stars: 75, id: 'collar-perlas' },
  { stars: 150, id: 'bufanda-arcoiris' },
  { stars: 300, id: 'gorro-estrellas' },
  { stars: 600, id: 'sombrero-pastor' },
  { stars: 1000, id: 'campanita' },
  { stars: 2000, id: 'corona-trigo' },
];

function randomFoods(count, maxLevel) {
  const pool = FOODS.filter(f => f.level <= Math.max(1, maxLevel));
  const out = [];
  // Elección variada pero sin Math.random de por medio en la lógica de juego: aquí no importa repetir.
  for (let i = 0; i < count; i++) out.push(pool[Math.floor(Math.random() * pool.length)]);
  return out;
}
function giveFoods(list) {
  for (const f of list) state.addItem(f.id, 1);
  const byId = {};
  for (const f of list) byId[f.id] = (byId[f.id] || 0) + 1;
  return Object.entries(byId).map(([id, n]) => { const f = FOODS.find(x => x.id === id); return { icon: f.emoji, text: `${f.name} ×${n}` }; });
}
function giveAccessory(id) {
  const a = accessory(id);
  if (!a || state.owns(id)) return null;
  state.own(id);
  return { icon: a.emoji, text: `¡${a.name}!`, big: true };
}

// ── Niveles de los juegos ──
// Entrega los premios de un nivel y devuelve { items: [{icon,text}], chest: {title, items} | null }.
export function grantLevel(game, n, rec, { won }) {
  const items = [];
  let coins = 0, xp = 0;
  if (won) {
    coins = rec.firstClear ? 5 + Math.floor(n / 2) : 2 + Math.floor(n / 10);
    xp = rec.firstClear ? 10 + Math.floor(n / 5) : 4;
    coins += rec.gainedStars * 3;
  } else {
    coins = 1; xp = 2;
  }
  state.addCoins(coins);
  items.push({ icon: COIN, text: `+${coins}` });
  if (xp) items.push({ icon: '⭐', text: `+${xp} exp.` });
  const lvl = state.addXp(xp);

  // Cofre cada 10 niveles y medallas en los niveles 25, 50, 75 y 100 (solo la primera vez).
  let chest = null;
  if (won && rec.firstClear && isChest(n)) {
    const extra = 20 + Math.floor(n / 2);
    state.addCoins(extra);
    const chestItems = [{ icon: COIN, text: `+${extra} ${state.COIN.name}` }, ...giveFoods(randomFoods(2, state.get().level + 2))];
    if (rec.medal && MEDALS[rec.medal]) chestItems.unshift({ icon: MEDALS[rec.medal].icon, text: MEDALS[rec.medal].name, big: true });
    chest = { title: `¡Cofre del nivel ${n}!`, icon: '🎁', items: chestItems };
  }
  // Accesorios por estrellas acumuladas.
  if (won && rec.gainedStars > 0) {
    const total = state.totalStars();
    for (const r of STAR_REWARDS) {
      if (total >= r.stars && !state.owns(r.id)) {
        const got = giveAccessory(r.id);
        if (got) {
          chest = chest || { title: `¡${r.stars} estrellas!`, icon: '🌟', items: [] };
          chest.items.push({ ...got, text: `${got.text} (por ${r.stars} ★)` });
        }
      }
    }
  }
  return { items, chest, leveled: lvl.leveled };
}

// ── Ventana de cofre: se toca para abrirlo y muestra lo que trae ──
export function showChest({ title = '¡Un regalo!', icon = '🎁', items = [], note = '' } = {}) {
  const list = h('div', { class: 'rw-items', hidden: true }, items.map(it =>
    h('div', { class: `rw-item${it.big ? ' rw-item--big' : ''}` }, h('span', { class: 'rw-item__icon', 'aria-hidden': 'true' }, it.icon), h('span', null, it.text))));
  const box = h('button', { type: 'button', class: 'rw-box', 'aria-label': 'Abrir el regalo' }, icon);
  const hint = h('p', { class: 'rw-hint' }, '¡Tócalo para abrirlo!');
  let opened = false;
  function open() {
    if (opened) return;
    opened = true;
    sfx('sticker');
    box.classList.add('is-open');
    hint.hidden = true;
    setTimeout(() => { list.hidden = false; sfx('coin'); }, 380);
  }
  box.addEventListener('click', open);
  const m = modal({ title, className: 'rw-modal', body: [h('div', { class: 'rw-stage' }, box), hint, list, note ? h('p', { class: 'rw-note' }, note) : null],
    buttons: [{ label: '¡Gracias!', kind: 'sun', onClick: () => { if (!opened) { open(); return false; } } }] });
  return m.closed;
}

// ── Subida de nivel de la palomita ──
export function levelUpRewards(level) {
  const coins = 20 + level * 2;
  state.addCoins(coins);
  const items = [{ icon: COIN, text: `+${coins} ${state.COIN.name}` }, ...giveFoods(randomFoods(level % 5 === 0 ? 3 : 2, level + 1))];
  const newFoods = FOODS.filter(f => f.level === level).map(f => ({ icon: f.emoji, text: `Nuevo en la tienda: ${f.name}` }));
  const newAcc = ACCESSORIES.filter(a => a.level === level && !a.reward).map(a => ({ icon: a.emoji, text: `Nuevo en la tienda: ${a.name}` }));
  return [...items, ...newFoods, ...newAcc];
}

// Cola de subidas de nivel: los premios se entregan al momento y la celebración se muestra al volver con la palomita.
const pendingLevelUps = [];
export function queueLevelUp(level) { pendingLevelUps.push({ level, items: levelUpRewards(level) }); }
export function takeLevelUps() { return pendingLevelUps.splice(0); }

// ── Regalo diario (7 días que se repiten; no se pierde nada si un día no se juega) ──
export const DAILY = [
  { icon: '🌱', coins: 15 },
  { icon: '🍞', foods: [['pan', 2], ['agua', 2]] },
  { icon: '🌱', coins: 25 },
  { icon: '🍇', foods: [['uvas', 2], ['miel', 1]] },
  { icon: '🌱', coins: 35 },
  { icon: '🍪', foods: [['galleta', 2], ['manzana', 2]] },
  { icon: '🎁', coins: 60, foods: [['torta', 1]] },
];
export function dailyGiftDue() {
  return !state.doneToday('dailyGift');
}
export function claimDailyGift() {
  if (!state.dailyOnce('dailyGift')) return null;
  const s = state.get();
  const idx = (s.flags.giftDay | 0) % DAILY.length;
  state.setFlag('giftDay', (s.flags.giftDay | 0) + 1);
  const g = DAILY[idx];
  const items = [];
  if (g.coins) { state.addCoins(g.coins); items.push({ icon: COIN, text: `+${g.coins} ${state.COIN.name}` }); }
  for (const [id, n] of g.foods || []) {
    state.addItem(id, n);
    const f = FOODS.find(x => x.id === id);
    if (f) items.push({ icon: f.emoji, text: `${f.name} ×${n}` });
  }
  return { day: idx, items };
}
export function showDailyGift() {
  const due = dailyGiftDue();
  const s = state.get();
  const idx = (s.flags.giftDay | 0) % DAILY.length;
  const days = h('div', { class: 'rw-week' }, DAILY.map((g, i) =>
    h('div', { class: `rw-day${i < idx ? ' is-done' : ''}${i === idx && due ? ' is-today' : ''}` },
      h('span', { class: 'rw-day__n' }, `Día ${i + 1}`), h('span', { class: 'rw-day__icon', 'aria-hidden': 'true' }, i < idx ? '✅' : g.icon))));
  if (!due) {
    modal({ title: 'Regalo del día', icon: '📅', body: [days, h('p', { style: { textAlign: 'center' } }, 'Ya abriste el regalo de hoy. ¡Vuelve mañana por otro!')], buttons: [{ label: '¡Listo!', kind: 'sun' }] });
    return Promise.resolve(null);
  }
  const res = claimDailyGift();
  return showChest({ title: `Regalo del día ${res.day + 1}`, icon: DAILY[res.day].icon === '🎁' ? '🎁' : '🎀', items: res.items, note: 'Cada día que vengas te espera un regalo nuevo.' }).then(() => res);
}

// Aviso amable al juntar estrellas suficientes para el próximo accesorio.
export function nextStarReward() {
  const t = state.totalStars();
  return STAR_REWARDS.find(r => !state.owns(r.id) && t < r.stars) || null;
}

export function toastReward(text, icon = '🎁') { toast(text, { icon, ms: 2800 }); }
