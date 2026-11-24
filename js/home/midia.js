// «Mi día»: tres tareas cortitas con dibujos que cambian cada día (cuidar a la palomita, rezar, aprender o jugar).
// Al completar las tres, la palomita baila y da un premio pequeño (una vez por día). El regalo del día sigue
// siendo libre: se abre desde aquí mismo, haya o no tareas hechas.
//
//   const midia = createMiDia(ctx)    ctx: { setRoom, showVerse, openGift, celebrate, go }
//   midia.tasks() → [{ id, icon, text, done }]    midia.count() → hechas (0–3)    midia.open()
import * as state from '../core/state.js';
import * as tts from '../core/tts.js';
import { h, modal, toast } from '../core/ui.js';
import { sfx } from '../core/audio.js';
import { dailyGiftDue } from '../core/rewards.js';

const anyRead = () => { state.doneToday('x'); return Object.keys(state.get().daily.done || {}).some(k => k.startsWith('read:') && !k.startsWith('read:lesson:')); };
const TASKS = {
  feed: { icon: '🍞', text: 'Dale de comer a tu palomita', room: 'cocina', done: () => state.doneToday('feed') },
  wash: { icon: '🛁', text: 'Báñala con jabón y agua', room: 'bano', done: () => state.doneToday('wash') },
  play: { icon: '🎾', text: 'Juega con ella en el Nido', room: 'sala', done: () => state.doneToday('play') },
  photo: { icon: '📷', text: 'Sácale una foto bonita', room: 'sala', done: () => state.doneToday('photo') },
  pray: { icon: '🙏', text: 'Reza una oración con ella', room: 'capilla', done: () => state.doneToday('prayed') },
  verse: { icon: '💌', text: 'Lee el mensaje de hoy', action: 'verse', done: () => state.doneToday('verse') },
  family: { icon: '👪', text: 'Reza o lee una historia con tu familia', manual: true, done: () => state.doneToday('family') },
  read: { icon: '📖', text: 'Lee una historia de la Biblia', go: ['bible', { tab: 'historias' }], done: anyRead },
  learn: { icon: '✝️', text: 'Aprende algo nuevo en Catequesis', go: ['catequesis', {}], done: () => state.doneToday('learn') },
  level: { icon: '🎮', text: 'Supera un nivel en un juego', go: ['games', {}], done: () => state.doneToday('level') },
};
const GROUPS = [['feed', 'wash', 'play', 'photo'], ['pray', 'verse', 'family', 'pray'], ['read', 'learn', 'level']];
const BONUS = { coins: 15, food: ['manzana', 1] };
const dayNumber = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);

export function createMiDia(ctx) {
  function ids() {
    const n = dayNumber();
    return GROUPS.map((g, i) => g[(n + i * 3) % g.length]);
  }
  function tasks() { return ids().map(id => ({ id, ...TASKS[id], done: !!TASKS[id].done() })); }
  function count() { return tasks().filter(t => t.done).length; }

  // Premio al completar las tres (una vez por día).
  function checkBonus() {
    if (count() < 3 || state.doneToday('midia')) return false;
    state.dailyOnce('midia');
    state.addCoins(BONUS.coins);
    state.addItem(BONUS.food[0], BONUS.food[1]);
    sfx('win');
    ctx.celebrate?.();
    toast(`¡Completaste tu día! +${BONUS.coins} ${state.COIN.name} y una manzana`, { icon: '🌟', ms: 3400 });
    return true;
  }

  function open() {
    const list = tasks();
    const done = list.filter(t => t.done).length;
    let m = null;
    const row = t => h('li', { class: `md-task${t.done ? ' is-done' : ''}` },
      h('span', { class: 'md-task__icon', 'aria-hidden': 'true' }, t.icon),
      h('span', { class: 'md-task__text' }, t.text),
      t.done ? h('span', { class: 'md-task__ok', 'aria-label': 'Hecho' }, '✅')
        : h('button', { type: 'button', class: 'md-task__go', onclick: () => {
          sfx('pop');
          if (t.manual) { state.dailyOnce(t.id); toast('¡Muy bien! Eso alegra a Jesús', { icon: '💛' }); m?.close(); setTimeout(() => { checkBonus(); ctx.repaint?.(); }, 200); return; }
          m?.close();
          if (t.room) ctx.setRoom?.(t.room);
          else if (t.action === 'verse') ctx.showVerse?.();
          else if (t.go) ctx.go?.(...t.go);
        } }, t.manual ? '¡Ya lo hice!' : 'Ir'));
    const gift = dailyGiftDue()
      ? h('button', { type: 'button', class: 'md-gift', onclick: () => { sfx('pop'); m?.close(); setTimeout(() => ctx.openGift?.(), 120); } }, h('span', { 'aria-hidden': 'true' }, '🎁'), h('span', null, 'Abrir el regalo del día'))
      : h('p', { class: 'md-gift is-done' }, h('span', { 'aria-hidden': 'true' }, '✅'), h('span', null, 'Ya abriste el regalo de hoy'));
    const canSpeak = tts.available() && state.setting('voice') !== false;
    m = modal({
      title: 'Mi día', icon: done >= 3 ? '🌟' : '☀️', className: 'md-modal',
      body: [
        h('p', { class: 'md-lead' }, done >= 3 ? '¡Hiciste las tres! Tu palomita está feliz.' : `Llevas ${done} de 3. ¡Tú puedes!`),
        h('ol', { class: 'md-list' }, list.map(row)),
        gift,
      ],
      buttons: [canSpeak ? { label: 'Escuchar', kind: 'sky', icon: '🔊', small: true, keepOpen: true, onClick: () => { tts.speak(['Mi día.', ...list.map(t => t.text + (t.done ? '. ¡Hecho!' : '.'))]); } } : null,
        { label: 'Cerrar', kind: 'ghost', small: true }].filter(Boolean),
    });
    m.closed.then(() => tts.stop());
    if (done >= 3) setTimeout(checkBonus, 400);
    return m;
  }
  return { tasks, count, open, checkBonus };
}
