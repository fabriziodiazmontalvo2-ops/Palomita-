// Momentos especiales al abrir la casa de la palomita, uno a la vez y sin agobiar (como mucho dos por visita):
//   reunion        «¡Te extrañé!» después de muchas horas sin verla (nunca culpa al niño)
//   celebraciones  el día de la Primera Comunión, el cumpleaños y el aniversario del Bautismo
//   misa           el fin de semana: «¿Fuiste a Misa?» → sello en el pasaporte
//   mision         «¿Pudiste cumplir tu misión?» → una flor en la jardinera
//
//   const moments = createMoments(ctx)   ctx: { world, dove, say, celebrate, go, alive() }
//   await moments.run()                   muestra lo que toque (devuelve cuántos mostró)
import * as state from '../core/state.js';
import * as stickers from '../core/stickers.js';
import * as R from '../core/reminders.js';
import * as tts from '../core/tts.js';
import { h, modal, toast } from '../core/ui.js';
import { sfx } from '../core/audio.js';
import { showChest as chest } from '../core/rewards.js';

export const MASS_COLORS = [
  { id: 'morado', label: 'Morado', hex: '#6b3fa0' },
  { id: 'blanco', label: 'Blanco', hex: '#f4efe2' },
  { id: 'verde', label: 'Verde', hex: '#3f8f4e' },
  { id: 'rojo', label: 'Rojo', hex: '#c0392b' },
  { id: 'rosado', label: 'Rosado', hex: '#e48fb3' },
];
const COLOR_WHY = {
  morado: 'el morado es para prepararnos: en Adviento y en Cuaresma.',
  blanco: 'el blanco es de fiesta y alegría: en Navidad, en Pascua y en las fiestas de Jesús y de María.',
  verde: 'el verde es la esperanza: en el Tiempo Ordinario la fe crece como una plantita.',
  rojo: 'el rojo recuerda el fuego del Espíritu Santo y el amor de los mártires.',
  rosado: 'el rosado es un poquito de alegría en medio de la espera.',
};
const voiceOn = () => tts.available() && state.setting('voice') !== false;
const sameMD = (iso, d) => { if (!iso) return false; const [, m, dd] = iso.split('-').map(Number); return m === d.getMonth() + 1 && dd === d.getDate(); };

export function createMoments(ctx) {
  const name = () => state.get().name;
  const kid = () => (state.get().kid || '').split(' ')[0];

  // ── «¡Te extrañé!» ──
  function reunion(mins) {
    if (mins < 360 || !ctx.world.doveVisible) return false;
    ctx.dove.play('flap');
    sfx('chirp');
    const gift = state.countItem('pan') < 3;
    if (gift) state.addItem('pan', 1);
    setTimeout(() => ctx.say(`¡Te extrañé${kid() ? `, ${kid()}` : ''}! Qué bueno que volviste 💕${gift ? ' Te guardé un pancito 🍞' : ''}`, 4200), 400);
    return 'bubble';
  }

  // ── Celebraciones ──
  async function comunionDay() {
    const ev = R.nextEvent('comunion');
    if (!ev || ev.days !== 0 || state.flag(`com:${ev.date}`)) return false;
    state.setFlag(`com:${ev.date}`, true);
    let text = '¡Hoy recibes a Jesús por primera vez! Él viene a vivir en tu corazón.';
    try { const G = (await import('../data/gran-dia.js')).GRAN_DIA; if (G?.dayOf?.text) text = G.dayOf.text; } catch { /* sin datos */ }
    const items = [];
    if (!state.owns('lazo-comunion')) { state.own('lazo-comunion'); items.push({ icon: '🤍', text: 'Lazo de Primera Comunión' }); }
    state.wear('neck', 'lazo-comunion');
    const st = stickers.grantSticker('primera-comunion');
    if (st) items.push({ icon: '🙌', text: 'Figurita «¡Mi Primera Comunión!»' });
    ctx.celebrate?.(); ctx.dove.play('dance');
    await chest({ title: '¡Hoy es tu Primera Comunión!', icon: '🕊️', items, note: text });
    return true;
  }
  async function birthday() {
    const now = new Date();
    if (!sameMD(state.date('cumple'), now) || state.flag(`cumple:${now.getFullYear()}`)) return false;
    state.setFlag(`cumple:${now.getFullYear()}`, true);
    const items = [];
    if (!state.owns('gorro-fiesta')) { state.own('gorro-fiesta'); items.push({ icon: '🥳', text: 'Gorro de fiesta' }); }
    state.wear('head', 'gorro-fiesta');
    state.addItem('torta', 1); items.push({ icon: '🎂', text: 'Torta de fiesta para compartir' });
    ctx.celebrate?.(); ctx.dove.play('dance'); sfx('win');
    await chest({ title: `¡Feliz cumpleaños${kid() ? `, ${kid()}` : ''}!`, icon: '🎂', items, note: `${name()} da gracias a Dios por tu vida. ¡Que Jesús te bendiga mucho hoy!` });
    return true;
  }
  async function baptism() {
    const now = new Date();
    const iso = state.date('bautismo');
    if (!sameMD(iso, now) || state.flag(`bautismo:${now.getFullYear()}`)) return false;
    state.setFlag(`bautismo:${now.getFullYear()}`, true);
    const years = now.getFullYear() - Number(iso.slice(0, 4));
    state.addStat('fe', 5);
    ctx.celebrate?.(); ctx.dove.play('pray'); sfx('bell');
    const m = modal({ title: '¡Feliz cumpleaños de Bautismo!', icon: '💧',
      body: [h('p', { style: { textAlign: 'center' } }, `Hoy hace ${years > 0 ? `${years} ${years === 1 ? 'año' : 'años'}` : 'un tiempo'} que fuiste bautizado. ¡Ese día te volviste hijo de Dios para siempre!`),
        h('p', { class: 'home-prayer__note' }, '+5 Fe 🕯️')],
      buttons: [{ label: 'Ver la lección del Bautismo', kind: 'sky', small: true, value: 'go' }, { label: '¡Gracias, Jesús!', kind: 'sun' }] });
    const v = await m.closed;
    if (v === 'go') ctx.go?.('lesson', { id: 'bautismo' });
    return true;
  }

  // ── Pasaporte de la Misa del domingo ──
  async function massAsk() {
    const key = state.massKey();
    if (!key || state.massStamped(key) || state.doneToday(`massAsk:${key}`)) return false;
    state.dailyOnce(`massAsk:${key}`);
    const m = modal({ title: '¿Fuiste a Misa?', icon: '⛪',
      body: [h('p', { style: { textAlign: 'center' } }, `${name()} quiere saber si fuiste a la Misa del domingo.`),
        voiceOn() ? h('div', { style: { textAlign: 'center' } }, h('button', { type: 'button', class: 'ct-say', 'aria-label': 'Escuchar', onclick: () => tts.speak('¿Fuiste a Misa este domingo?') }, '🔊')) : null],
      buttons: [{ label: 'Todavía no', kind: 'ghost', small: true, value: 'no' }, { label: '¡Sí, fui!', kind: 'leaf', icon: '🙌', value: 'si' }] });
    const v = await m.closed;
    if (v !== 'si') {
      if (v === 'no') ctx.say(new Date().getDay() === 1 ? 'El próximo domingo vamos juntos a la Misa 💛' : '¡Todavía estás a tiempo! Jesús te espera en la Misa ⛪', 4000);
      return true;
    }
    // Color de la casulla: no hay respuesta equivocada, se aprende el porqué.
    let real = null;
    try {
      const L = await import('../core/liturgy.js');
      const [y, mo, d] = key.split('-').map(Number);
      real = L.seasonOf(new Date(y, mo - 1, d))?.color || null;
    } catch { /* sin calendario */ }
    const pickColor = () => new Promise(resolve => {
      const mm = modal({ title: '¿De qué color se vistió el padre?', icon: '🎨',
        body: h('div', { class: 'mp-colors' }, MASS_COLORS.map(c => h('button', { type: 'button', class: 'mp-color', 'aria-label': c.label, onclick: () => { sfx('pop'); resolve(c.id); mm.close(); } },
          h('span', { class: 'mp-color__dot', style: { background: c.hex } }), h('span', null, c.label)))),
        buttons: [{ label: 'No me fijé', kind: 'ghost', small: true }] });
      mm.closed.then(() => resolve(null));
    });
    const color = await pickColor();
    state.logMass(key, { color: color || '' });
    const n = Object.keys(state.massLog()).length;
    sfx('sticker');
    const items = [{ icon: '⛪', text: `Sello n.º ${n} en tu pasaporte de la Misa` }];
    if (n % 4 === 0) {
      if (!state.owns('collar-cruz')) { state.own('collar-cruz'); items.push({ icon: '✝️', text: 'Premio: Crucecita de madera' }); }
      else if (n >= 8 && !state.owns('d-parroquia')) { state.own('d-parroquia'); items.push({ icon: '⛪', text: 'Premio: el cuadro «Mi parroquia» para el Nido' }); }
      else if (stickers.grantPackOnce(`misa:${n}`, 1, 'Pasaporte de la Misa')) items.push({ icon: '✉️', text: '+1 sobre de figuritas' });
    }
    state.addStat('fe', 4); state.addXp(4);
    const note = color && real
      ? (color === real ? `¡Sí! Era ${real}: ${COLOR_WHY[real]}` : `¡Qué bien que te fijaste! Para la Iglesia hoy tocaba ${real}: ${COLOR_WHY[real]}`)
      : real ? `Este domingo la Iglesia usa el ${real}: ${COLOR_WHY[real]}` : 'Cada color de la Misa nos cuenta algo. ¡Fíjate el próximo domingo!';
    await chest({ title: '¡Sello en tu pasaporte!', icon: '⛪', items, note });
    return true;
  }

  // ── Misión de buenas obras ──
  async function missionAsk() {
    if (!state.missionDue()) return false;
    const mi = state.mission();
    const m = modal({ title: '¿Pudiste cumplir tu misión?', icon: '🌸',
      body: [h('p', { class: 'mi-mission' }, `«${mi.text}»`),
        voiceOn() ? h('div', { style: { textAlign: 'center' } }, h('button', { type: 'button', class: 'ct-say', 'aria-label': 'Escuchar la misión', onclick: () => tts.speak(['¿Pudiste cumplir tu misión?', mi.text]) }, '🔊')) : null,
        h('p', { class: 'home-prayer__note' }, 'Dilo con sinceridad: Jesús te quiere igual.')],
      buttons: [{ label: 'Todavía no', kind: 'ghost', small: true, value: 'later' }, { label: '¡Sí, la cumplí!', kind: 'leaf', icon: '🌸', value: 'si' }] });
    const v = await m.closed;
    if (v === 'si') {
      const n = state.missionDone();
      ctx.world.setFlowers(n);
      ctx.dove.play('dance'); sfx('sparkle'); ctx.world.fx.sparkles(10);
      ctx.say(n >= 7 && n % 7 === 0 ? '¡Siete buenas obras! ¡Tu jardín está lleno de flores! 🌸' : '¡Qué bien! Brotó una flor nueva en la ventana 🌸', 4200);
      if (n >= 7 && !state.owns('d-estrella-belen')) { state.own('d-estrella-belen'); toast('¡Ganaste el cuadro «La estrella de Belén» para el Nido! (Tienda → Casa)', { icon: '⭐', ms: 3800 }); }
      else if (n % 7 === 0 && stickers.grantPackOnce(`flores:${n}`, 1, 'Jardín de buenas obras')) toast('+1 sobre de figuritas por tu jardín', { icon: '✉️', ms: 3000 });
      state.addStat('alegria', 4);
    } else {
      state.missionLater();
      ctx.say('¡No pasa nada! Todavía puedes hacerlo hoy. Yo te acompaño 💛', 4000);
    }
    return true;
  }

  async function run({ awayMins = 0 } = {}) {
    let shown = 0;
    reunion(awayMins);           // el globito no cuenta como ventana
    for (const step of [comunionDay, birthday, baptism, massAsk, missionAsk]) {
      if (shown >= 2 || !ctx.alive()) break;
      try { if (await step()) shown++; } catch (e) { console.warn(e); }
    }
    return shown;
  }
  return { run, reunion, missionAsk, massAsk };
}
