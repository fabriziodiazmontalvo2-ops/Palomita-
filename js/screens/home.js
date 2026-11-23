// Pantalla principal: el niño cuida a su palomita (comer, baño, dormir, jugar, rezar) y entra a juegos, Biblia y tienda.
// El mundo 3D (js/pet/world.js) se crea una sola vez y se reutiliza cada vez que se vuelve a esta pantalla.
import * as state from '../core/state.js';
import * as tts from '../core/tts.js';
import { sfx } from '../core/audio.js';
import { h, clear, button, modal, toast, meter } from '../core/ui.js';
import { go } from '../core/router.js';
import { FOODS, food } from '../data/items.js';
import * as talkback from '../pet/talkback.js';

const ROOMS = [
  { id: 'sala', icon: '🏠', name: 'Nido' },
  { id: 'cocina', icon: '🍞', name: 'Cocina' },
  { id: 'bano', icon: '🛁', name: 'Baño' },
  { id: 'dormitorio', icon: '🌙', name: 'Dormir' },
  { id: 'capilla', icon: '🙏', name: 'Oración' },
];
const TIPS = {
  hambre: 'Ve a la cocina 🍞 y dale de comer.',
  energia: 'Llévala a dormir 🌙 y apaga la luz.',
  limpieza: 'En el baño 🛁: primero jabón y luego ducha.',
  alegria: 'Acaríciala, juega con ella o entra a los juegos 🎮.',
  fe: 'Reza con ella 🙏, lee la Biblia 📖 o mira el mensaje de hoy 💌.',
};
const FALLBACK_PHRASES = {
  greet: ['¡Hola! ¡Qué alegría verte!', '¡Llegaste! Te estaba esperando 💕'], morning: ['¡Buenos días! ☀️'], night: ['¡Buenas noches! 🌙'],
  hungry: ['¡Tengo hambre! 🍞', 'Mi pancita hace ruido…'], sleepy: ['Tengo sueñito… 😴'], dirty: ['¿Me das un bañito? 🫧'], bored: ['¿Jugamos? 🎈'],
  happy: ['¡Qué feliz estoy contigo!', '¡Eres mi mejor amigo!'], fed: ['¡Qué rico! Gracias 😋'], clean: ['¡Quedé brillante! ✨'], petted: ['¡Ji, ji! Me haces cosquillas'],
  pray: ['¿Rezamos juntos? 🙏'], afterGame: ['¡Qué divertido!'], levelUp: ['¡Subimos de nivel!'], wakeUp: ['¡Ya desperté! ☀️'], facts: [],
};
const FALLBACK_VERSES = [{ text: 'El Señor es mi pastor, nada me falta.', ref: 'Salmo 23, 1' }, { text: 'Dejen que los niños vengan a mí.', ref: 'Marcos 10, 14' }, { text: 'Ámense unos a otros como yo los he amado.', ref: 'Juan 15, 12' }];
const ANGEL = ['Ángel de mi guarda,', 'dulce compañía,', 'no me desampares', 'ni de noche ni de día.', 'No me dejes solo,', 'que me perdería. Amén.'];

let world = null, canvas = null, worldFailed = false;
let DATA = null;

async function loadData() {
  if (DATA) return DATA;
  // Las rutas van escritas tal cual (no en una variable) para que el empaquetador pueda incluir estos archivos.
  const safe = (promise, k, fb) => promise.then(m => m[k] || fb).catch(() => fb);
  const phrasesMod = import('../data/phrases.js');
  const [phrases, facts, verses, prayers] = await Promise.all([
    safe(phrasesMod, 'PHRASES', null), safe(phrasesMod, 'FOOD_FACTS', {}),
    safe(import('../data/verses.js'), 'VERSES', FALLBACK_VERSES), safe(import('../data/prayers.js'), 'PRAYERS', []),
  ]);
  DATA = { phrases: { ...FALLBACK_PHRASES, ...(phrases || {}) }, facts: facts || {}, verses: verses?.length ? verses : FALLBACK_VERSES, prayers: prayers || [] };
  return DATA;
}
// Mundo de reserva por si el dispositivo no tiene WebGL: la interfaz sigue funcionando.
function stubWorld() {
  const noop = () => {};
  const dove = { setMood: noop, setSleeping: noop, lookAt: noop, play: () => 1, setTalking: noop, setDirt: noop };
  return { dove, ROOMS: ROOMS.map(r => r.id), room: 'sala', setRoom(id) { this.room = id; return Promise.resolve(); }, setLights: noop, setCandle: noop, start: noop, stop: noop, resize: noop,
    setPaused: noop, on: () => noop, project: () => ({ x: innerWidth / 2, y: innerHeight * 0.3 }), hitDove: () => 'belly', wear: noop,
    fx: new Proxy({}, { get: () => noop }) };
}
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const dayNumber = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);

export async function mount(el, params = {}) {
  const D = await loadData();
  el.classList.add('home');

  // ── Mundo 3D ──
  if (!world) {
    canvas = h('canvas', { class: 'home__canvas', 'aria-label': 'Tu palomita' });
    el.append(canvas);
    try {
      const { createWorld } = await import('../pet/world.js');
      world = createWorld(canvas);
    } catch (e) {
      console.warn('Sin gráficos 3D:', e);
      worldFailed = true;
      world = stubWorld();
    }
    window.__world = world;
  } else el.append(canvas);
  if (worldFailed) el.append(h('div', { class: 'home__nogl', 'aria-hidden': 'true' }, '🕊️'));
  const dove = world.dove;

  const offs = [];
  let alive = true;
  let room = state.get().sleeping ? 'dormitorio' : (ROOMS.some(r => r.id === params.room) ? params.room : 'sala');
  let foam = 0, soapMode = false, showering = 0, joyBudget = 8, bubbleTimer = 0, nextTalk = 4, strokeAcc = 0, ghost = null, talking = false;

  // ── Interfaz ──
  const lvl = h('span', { class: 'home-level__n' });
  const nameEl = h('span', { class: 'home-level__name' });
  const xpBar = meter(0, 'var(--sun)');
  const coins = h('span', { class: 'chip home__coins' });
  const meters = {};
  const metersRow = h('div', { class: 'home__meters' }, state.STATS.map(n => {
    const m = meter(state.stat(n), state.STAT_META[n].color);
    const b = h('button', { type: 'button', class: 'home-meter', 'aria-label': state.STAT_META[n].label, onclick: () => { sfx('tap'); toast(`${state.STAT_META[n].label}: ${TIPS[n]}`, { icon: state.STAT_META[n].icon, ms: 3200 }); } },
      h('span', { class: 'home-meter__icon', 'aria-hidden': 'true' }, state.STAT_META[n].icon), m);
    meters[n] = { m, b };
    return b;
  }));
  const side = (icon, label, fn, cls = '') => h('button', { type: 'button', class: `home-side ${cls}`.trim(), onclick: () => { sfx('pop'); fn(); } },
    h('span', { class: 'home-side__icon', 'aria-hidden': 'true' }, icon), h('span', { class: 'home-side__label' }, label));
  const verseBtn = side('💌', 'Mensaje', () => showVerse(), 'home-side--verse');
  const bubble = h('button', { type: 'button', class: 'home__bubble', hidden: true, 'aria-live': 'polite', onclick: () => hideBubble() });
  const tray = h('div', { class: 'home__tray' });
  const tabs = h('nav', { class: 'home__tabs', 'aria-label': 'Habitaciones' }, ROOMS.map(r =>
    h('button', { type: 'button', class: 'home-tab', dataset: { room: r.id }, onclick: () => { sfx('tap'); setRoom(r.id); } },
      h('span', { class: 'home-tab__icon', 'aria-hidden': 'true' }, r.icon), h('span', { class: 'home-tab__label' }, r.name))));

  el.append(h('div', { class: 'home__ui' },
    h('div', { class: 'home__top' },
      h('div', { class: 'home-level' }, h('span', { class: 'home-level__badge' }, lvl), h('div', { class: 'home-level__col' }, nameEl, xpBar)),
      coins,
      h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Ajustes', onclick: () => { sfx('tap'); go('settings'); } }, '⚙️')),
    metersRow,
    h('div', { class: 'home__sides' },
      h('div', { class: 'home__side-col' }, side('🎮', 'Juegos', () => go('games')), side('🛍️', 'Tienda', () => go('shop'))),
      h('div', { class: 'home__side-col' }, side('📖', 'Biblia', () => go('bible')), verseBtn)),
    bubble,
    h('div', { class: 'home__bottom' }, tray, tabs)));

  // ── Refrescos ──
  function refreshTop() {
    const s = state.get();
    lvl.textContent = String(s.level);
    nameEl.textContent = s.name;
    xpBar.set(Math.min(100, (s.xp / state.xpForLevel(s.level)) * 100));
    clear(coins).append(h('span', { 'aria-hidden': 'true' }, state.COIN.icon), String(s.coins));
    verseBtn.classList.toggle('is-new', !state.doneToday('verse'));
  }
  function refreshMeters() {
    for (const n of state.STATS) { const v = state.stat(n); meters[n].m.set(v); meters[n].b.classList.toggle('is-low', v < 25); }
  }
  function refreshDove() {
    dove.setMood(state.mood());
    const clean = state.stat('limpieza');
    dove.setDirt(clean < 60 ? Math.min(1, (60 - clean) / 45) : 0);
  }
  function applyWear() { const w = state.get().wearing || {}; for (const slot of ['head', 'neck', 'beak']) world.wear(slot, w[slot] || null); }

  // ── Globito de diálogo ──
  function placeBubble() {
    const p = world.project('head');
    const r = el.getBoundingClientRect();
    bubble.style.left = `${Math.max(100, Math.min(r.width - 100, p.x))}px`;
    bubble.style.top = `${Math.max(150, p.y - 8)}px`;
  }
  function say(text, ms = 4200) {
    if (!alive || !text) return;
    bubble.textContent = text;
    bubble.hidden = false;
    placeBubble();
    bubbleTimer = ms / 1000;
  }
  function hideBubble() { bubble.hidden = true; bubbleTimer = 0; }
  function talkAboutNeeds() {
    if (state.get().sleeping || talking) return;
    const need = state.need();
    const key = { hambre: 'hungry', energia: 'sleepy', limpieza: 'dirty', alegria: 'bored' }[need];
    if (key) say(pick(D.phrases[key]));
    else if (state.stat('fe') < 35 && Math.random() < 0.5) say(pick(D.phrases.pray));
    else if (D.phrases.facts.length && Math.random() < 0.3) say(pick(D.phrases.facts), 7500);
    else say(pick(D.phrases.happy));
  }

  // ── Alegría con moderación (para que no se llene solo de tocarla) ──
  function joy(amount) {
    const a = Math.min(amount, joyBudget);
    if (a <= 0) return;
    joyBudget -= a;
    state.addStat('alegria', a);
  }
  function isAsleep(msg = true) {
    if (!state.get().sleeping) return false;
    if (msg) toast('Shh… está dormida. Toca ☀️ Despertar.', { icon: '😴' });
    return true;
  }

  // ── Habitaciones ──
  function setRoom(id, { silent = false } = {}) {
    if (id !== 'dormitorio' && state.get().sleeping) wake(true);
    if (id !== 'bano') { soapMode = false; if (foam > 0) { foam = 0; world.fx.foam(0); } world.fx.shower(false); showering = 0; }
    room = id;
    world.setRoom(id);
    for (const b of tabs.children) { const on = b.dataset.room === id; b.classList.toggle('is-on', on); b.setAttribute('aria-current', on ? 'true' : 'false'); }
    renderTray();
    hideBubble();
    if (!silent) nextTalk = 2.5;
  }

  function trayButton(icon, label, fn, { kind = '', cls = '' } = {}) {
    return h('button', { type: 'button', class: `home-tool ${kind ? 'home-tool--' + kind : ''} ${cls}`.trim(), onclick: () => { sfx('tap'); fn(); } },
      h('span', { class: 'home-tool__icon', 'aria-hidden': 'true' }, icon), h('span', { class: 'home-tool__label' }, label));
  }
  function renderTray() {
    clear(tray);
    tray.dataset.room = room;
    if (room === 'sala') {
      tray.append(trayButton('🎾', 'Jugar', playWithDove));
      if (talkback.available()) tray.append(trayButton('🎤', talking ? 'Te escucho…' : 'Háblame', talk, { cls: talking ? 'is-on' : '' }));
      tray.append(trayButton('🎮', 'Juegos', () => go('games'), { kind: 'accent' }));
    } else if (room === 'cocina') {
      const have = FOODS.filter(f => state.countItem(f.id) > 0);
      const strip = h('div', { class: 'home-foods' },
        have.length ? have.map(f => foodButton(f)) : h('p', { class: 'home-foods__empty' }, 'No queda comida. ¡Vamos a la tienda!'),
        h('button', { type: 'button', class: 'home-food home-food--add', 'aria-label': 'Comprar comida', onclick: () => { sfx('tap'); go('shop', { tab: 'comida' }); } }, '➕'));
      tray.append(strip, trayButton('🙏', 'Bendecir', blessTable, { cls: 'home-tool--small' }));
    } else if (room === 'bano') {
      const soap = trayButton('🧼', soapMode ? '¡Frótala!' : 'Jabón', () => { if (isAsleep()) return; soapMode = !soapMode; renderTray(); if (soapMode) say('Frótame con el dedo 🫧', 3000); }, { cls: soapMode ? 'is-on' : '' });
      dragSource(soap, '🧼', (x, y) => { if (world.hitDove(x, y)) addFoam(0.035); });
      tray.append(soap, trayButton('🚿', showering > 0 ? 'Enjuagando…' : 'Ducha', shower, { cls: showering > 0 ? 'is-on' : '' }));
    } else if (room === 'dormitorio') {
      const sleeping = state.get().sleeping;
      tray.append(trayButton(sleeping ? '☀️' : '💡', sleeping ? 'Despertar' : 'Apagar la luz', () => (sleeping ? wake() : goToSleep()), { kind: sleeping ? 'accent' : '', cls: 'home-tool--wide' }));
    } else if (room === 'capilla') {
      tray.append(trayButton('🙏', 'Rezar', choosePrayer, { kind: 'accent' }), trayButton('📖', 'Biblia', () => go('bible')), trayButton('🕯️', 'Mi camino', () => go('bible', { tab: 'catecismo' })));
    }
  }

  // ── Nido: jugar y hablar ──
  let playCool = 0;
  function playWithDove() {
    if (isAsleep()) return;
    dove.play(pick(['dance', 'hop', 'spin', 'flap', 'wave']));
    world.fx.notes(); sfx('chirp');
    if (playCool <= 0) { joy(4); state.addStat('energia', -1); playCool = 4; }
  }
  async function talk() {
    if (isAsleep()) return;
    if (talking) { talkback.finishListening(); return; }
    talking = true; renderTray();
    const ok = await talkback.listenAndRepeat({
      onState: st => { if (!alive) return; if (st === 'listening') { say('Te escucho… 👂', 4500); dove.play('surprise'); } else if (st === 'speaking') hideBubble(); },
      onLevel: v => dove.setTalking(v),
    });
    talking = false; dove.setTalking(0);
    if (!alive) return;
    if (!ok) toast('Ahora no puedo oírte. Revisa el permiso del micrófono.', { icon: '🎤', ms: 3200 }); else joy(2);
    renderTray();
  }

  // ── Cocina ──
  function foodButton(f) {
    const b = h('button', { type: 'button', class: 'home-food', 'aria-label': `${f.name}, tienes ${state.countItem(f.id)}`, title: f.name },
      h('span', { class: 'home-food__emoji', 'aria-hidden': 'true' }, f.emoji), h('span', { class: 'home-food__n' }, String(state.countItem(f.id))));
    dragSource(b, f.emoji, null, (x, y, dragged) => { if (!dragged || world.hitDove(x, y)) feed(f.id); });
    return b;
  }
  function feed(id) {
    if (isAsleep()) return;
    const f = food(id);
    if (!f || state.countItem(id) <= 0) return;
    if (state.stat('hambre') >= 98) { dove.play('shake'); sfx('wrong'); say('¡Estoy llenita! Gracias 😊'); return; }
    state.useItem(id);
    dove.play('eat'); sfx('eat');
    setTimeout(() => { if (alive) world.fx.crumbs(); }, 380);
    state.addStat('hambre', f.hambre); state.addStat('alegria', f.alegria); state.addXp(2);
    if (D.facts[id] && Math.random() < 0.4) say(D.facts[id], 7000); else say(pick(D.phrases.fed));
    renderTray();
  }
  function blessTable() {
    const p = D.prayers.find(x => x.id === 'bendicion-de-los-alimentos');
    prayerModal(p || { id: 'bendicion-de-los-alimentos', title: 'Bendición de los alimentos', emoji: '🍞', lines: ['Bendícenos, Señor,', 'y bendice estos alimentos', 'que por tu bondad vamos a recibir.', 'Amén.'] });
  }

  // ── Baño ──
  function addFoam(d) {
    if (isAsleep(false)) return;
    const before = foam;
    foam = Math.min(1, foam + d);
    world.fx.foam(foam);
    if (Math.floor(before * 8) !== Math.floor(foam * 8)) sfx('bubble');
    if (before < 1 && foam >= 1) say('¡Cuánta espuma! Ahora la ducha 🚿', 3500);
  }
  function shower() {
    if (isAsleep() || showering > 0) return;
    showering = 3.2; soapMode = false;
    world.fx.shower(true); sfx('splash');
    dove.play('giggle');
    renderTray();
  }
  function endShower() {
    world.fx.shower(false);
    const soaped = foam >= 0.45;
    foam = 0; world.fx.foam(0);
    if (soaped) {
      state.setStat('limpieza', 100); joy(3); state.addXp(3);
      world.fx.sparkles(12); sfx('sparkle'); dove.play('flap');
      say(pick(D.phrases.clean));
    } else {
      state.addStat('limpieza', 18);
      say('Primero enjabóname bien 🧼', 3500);
    }
    renderTray();
  }

  // ── Dormir ──
  function goToSleep() {
    const p = D.prayers.find(x => x.id === 'angel-de-la-guarda');
    const lines = p?.lines || ANGEL;
    let prayedNow = false;
    const m = modal({ title: 'Antes de dormir', icon: '🌙', dismissible: false,
      body: [h('p', { style: { textAlign: 'center' } }, 'Recemos juntos al Ángel de la Guarda:'), h('div', { class: 'home-prayer' }, lines.map(l => h('p', null, l)))],
      buttons: [{ label: 'Solo dormir', kind: 'ghost', small: true }, { label: 'Amén', kind: 'grape', icon: '🙏', onClick: () => { prayedNow = true; } }] });
    m.closed.then(() => {
      if (!alive) return;
      if (prayedNow) rewardPrayer('angel-de-la-guarda');
      state.setSleeping(true);
      applySleep(true);
      sfx('coo');
    });
  }
  function applySleep(on) {
    world.setLights(!on);
    dove.setSleeping(on);
    world.fx.zzz(on);
    hideBubble();
    renderTray();
  }
  function wake(silent = false) {
    if (!state.get().sleeping) return;
    state.setSleeping(false);
    applySleep(false);
    refreshDove();
    if (!silent) { sfx('chirp'); dove.play('flap'); say(pick(D.phrases.wakeUp)); }
  }

  // ── Oración ──
  function rewardPrayer(id) {
    const { firstToday } = state.prayed(id);
    const gain = firstToday ? 5 : 1;
    state.addStat('fe', gain); state.addXp(firstToday ? 5 : 1);
    sfx('bell');
    toast(`+${gain} Fe`, { icon: '🕯️' });
  }
  function prayerModal(p) {
    tts.stop();
    let amen = false;
    const canListen = tts.available() && state.setting('voice') !== false;
    const m = modal({ title: p.title, icon: p.emoji || '🙏',
      body: [h('div', { class: 'home-prayer' }, p.lines.map(l => h('p', null, l))), p.note ? h('p', { class: 'home-prayer__note' }, p.note) : null],
      buttons: [canListen ? { label: 'Escuchar', kind: 'sky', icon: '🔊', small: true, keepOpen: true, onClick: () => { tts.speak(p.lines); } } : null,
        { label: 'Amén', kind: 'grape', icon: '🙏', onClick: () => { amen = true; } }].filter(Boolean) });
    m.closed.then(() => {
      tts.stop();
      if (!alive || !amen) return;
      rewardPrayer(p.id);
      if (!state.get().sleeping) dove.play('pray');
      if (room === 'capilla') world.setCandle(true);
      world.fx.sparkles(6);
    });
  }
  function choosePrayer() {
    if (isAsleep()) return;
    const list = D.prayers.length ? D.prayers : [{ id: 'padre-nuestro', title: 'Padre Nuestro', emoji: '🙏', lines: ['Padre nuestro, que estás en el cielo,', 'santificado sea tu Nombre;', 'venga a nosotros tu reino;', 'hágase tu voluntad en la tierra como en el cielo.', 'Danos hoy nuestro pan de cada día;', 'perdona nuestras ofensas,', 'como también nosotros perdonamos a los que nos ofenden;', 'no nos dejes caer en la tentación,', 'y líbranos del mal. Amén.'] }];
    const m = modal({ title: '¿Qué rezamos?', icon: '🙏',
      body: h('div', { class: 'home-prayers' }, list.map(p => h('button', { type: 'button', class: 'home-prayers__item', onclick: () => { sfx('tap'); m.close(); prayerModal(p); } },
        h('span', { 'aria-hidden': 'true' }, p.emoji || '🙏'), h('span', null, p.title), state.doneToday('pray:' + p.id) ? h('span', { class: 'home-prayers__done', 'aria-label': 'Ya la rezaste hoy' }, '✓') : null))),
      buttons: [{ label: 'Cerrar', kind: 'ghost', small: true }] });
  }

  // ── Mensaje del día ──
  function showVerse() {
    const v = D.verses[dayNumber() % D.verses.length];
    const first = state.dailyOnce('verse');
    if (first) { state.addStat('fe', 5); state.addXp(3); }
    const canListen = tts.available() && state.setting('voice') !== false;
    const m = modal({ title: 'Mensaje de hoy', icon: '💌',
      body: [h('p', { class: 'home-verse__text' }, `«${v.text}»`), h('p', { class: 'home-verse__ref' }, v.ref), first ? h('p', { class: 'home-verse__gain' }, '+5 Fe 🕯️') : null],
      buttons: [canListen ? { label: 'Escuchar', kind: 'sky', icon: '🔊', small: true, keepOpen: true, onClick: () => { tts.speak(v.text); } } : null, { label: '¡Gracias, Jesús!', kind: 'sun' }].filter(Boolean) });
    m.closed.then(() => tts.stop());
    sfx('bell');
    refreshTop();
  }

  // ── Arrastrar desde la bandeja (comida, jabón) ──
  // onMove(x, y) mientras se arrastra; onEnd(x, y, arrastró) al soltar. Coordenadas relativas al canvas.
  function dragSource(btn, emoji, onMove, onEnd) {
    let id = null, sx = 0, sy = 0, dragged = false, justDragged = false;
    // Después de arrastrar, el clic que llega al soltar no cuenta como toque.
    btn.addEventListener('click', e => { if (justDragged) { justDragged = false; e.stopImmediatePropagation(); e.preventDefault(); } }, true);
    const rel = e => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    btn.addEventListener('pointerdown', e => {
      id = e.pointerId; sx = e.clientX; sy = e.clientY; dragged = false;
      try { btn.setPointerCapture(id); } catch { /* sin captura */ }
    });
    btn.addEventListener('pointermove', e => {
      if (e.pointerId !== id) return;
      if (!dragged && Math.hypot(e.clientX - sx, e.clientY - sy) > 12) {
        dragged = true;
        ghost = h('div', { class: 'home__ghost', 'aria-hidden': 'true' }, emoji);
        el.append(ghost);
      }
      if (dragged && ghost) {
        const r = el.getBoundingClientRect();
        ghost.style.left = `${e.clientX - r.left}px`; ghost.style.top = `${e.clientY - r.top}px`;
        const [x, y] = rel(e);
        world.dove.lookAt?.((x / canvas.clientWidth) * 2 - 1, 0.2);
        onMove?.(x, y);
      }
    });
    const end = e => {
      if (e.pointerId !== id) return;
      id = null;
      justDragged = dragged;
      ghost?.remove(); ghost = null;
      const [x, y] = rel(e);
      if (e.type === 'pointerup') onEnd?.(x, y, dragged);
    };
    btn.addEventListener('pointerup', end);
    btn.addEventListener('pointercancel', end);
  }

  // ── Toques sobre la palomita y los objetos ──
  offs.push(world.on('tap', ({ part }) => {
    if (isAsleep()) return;
    const act = { head: 'giggle', belly: 'giggle', feet: 'hop', wingL: 'wave', wingR: 'wave', beak: 'surprise', tail: 'spin' }[part] || 'giggle';
    dove.play(act); sfx(part === 'beak' ? 'chirp' : 'coo'); world.fx.hearts(3);
    joy(1.5);
    if (Math.random() < 0.3) say(pick(D.phrases.petted), 2600);
  }));
  offs.push(world.on('stroke', ({ dx, dy }) => {
    if (state.get().sleeping) return;
    const d = Math.hypot(dx, dy);
    if (room === 'bano' && soapMode) { addFoam(d * 0.0022); return; }
    strokeAcc += d;
    if (strokeAcc > 90) { strokeAcc = 0; world.fx.hearts(1); joy(0.6); sfx('pop'); }
  }));
  offs.push(world.on('tapProp', ({ id }) => {
    if (id === 'ball') { sfx('jump'); if (!isAsleep(false)) { dove.play('hop'); joy(1); } }
    else if (id === 'duck') sfx('chirp');
    else if (id === 'lamp') { sfx('tap'); state.get().sleeping ? wake() : goToSleep(); }
    else if (id === 'candle') { sfx('sparkle'); world.setCandle(true); say('¡Qué linda luz! 🕯️', 2600); }
    else if (id === 'bible') { sfx('page'); go('bible'); }
  }));

  // ── Eventos de la partida ──
  offs.push(state.on('stat', () => { refreshMeters(); }));
  offs.push(state.on('coins', refreshTop));
  offs.push(state.on('level', () => { refreshTop(); world.fx.confetti(); if (!state.get().sleeping) { dove.play('dance'); say(pick(D.phrases.levelUp)); } }));
  offs.push(state.on('change', ({ evt }) => { if (evt === 'xp' || evt === 'names') refreshTop(); }));
  offs.push(state.on('wear', applyWear));
  offs.push(state.on('inventory', () => { if (room === 'cocina') renderTray(); }));

  // ── Latido de la pantalla (4 veces por segundo) ──
  const STEP = 0.25;
  const timer = setInterval(() => {
    if (!alive || document.hidden) return;
    joyBudget = Math.min(8, joyBudget + STEP * (8 / 60));
    if (playCool > 0) playCool -= STEP;
    if (bubbleTimer > 0) { bubbleTimer -= STEP; if (bubbleTimer <= 0) bubble.hidden = true; else placeBubble(); }
    if (showering > 0) {
      showering -= STEP;
      if (foam > 0) { foam = Math.max(0.0001, foam - STEP * 0.12); world.fx.foam(Math.max(0, foam - (3.2 - showering) * 0.25)); }
      if (showering <= 0) endShower();
    }
    nextTalk -= STEP;
    if (nextTalk <= 0) { nextTalk = 16 + Math.random() * 10; if (bubble.hidden && !document.querySelector('.modal-scrim')) talkAboutNeeds(); }
    refreshDove();
    if (state.get().sleeping && state.stat('energia') >= 99.5) { wake(); toast('¡Ya descansó!', { icon: '☀️' }); }
  }, STEP * 1000);

  // ── Inicio ──
  refreshTop(); refreshMeters(); refreshDove(); applyWear();
  world.setRoom(room, { instant: true });
  for (const b of tabs.children) b.classList.toggle('is-on', b.dataset.room === room);
  applySleep(!!state.get().sleeping);
  world.resize(); world.start();
  renderTray();

  if (!state.get().sleeping) {
    if (!state.flag('tutorialHome')) {
      state.setFlag('tutorialHome');
      const tips = ['¡Hola! Tócame y acaríciame 💕', 'Mis barritas de arriba te dicen qué necesito', 'Abajo eliges mi cuarto: cocina, baño, dormir…', '¡Juega 🎮 y lee la Biblia 📖 conmigo!'];
      tips.forEach((t, i) => setTimeout(() => { if (alive) { say(t, 4300); nextTalk = 14; } }, 900 + i * 4600));
    } else if (params.from === 'game') { say(pick(D.phrases.afterGame)); dove.play('hop'); }
    else { const hr = new Date().getHours(); say(pick(hr < 11 ? D.phrases.morning : hr >= 19 ? D.phrases.night : D.phrases.greet)); dove.play('wave'); nextTalk = 12; }
  }

  return {
    unmount() {
      alive = false;
      clearInterval(timer);
      for (const off of offs) off();
      tts.stop(); talkback.cancel();
      ghost?.remove();
      world.fx.shower(false); world.fx.foam(0);
      world.stop();
      el.classList.remove('home');
    },
  };
}
