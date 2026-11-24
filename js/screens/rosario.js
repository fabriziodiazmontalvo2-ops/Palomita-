// «Rezo el Rosario contigo»: un misterio (un denario) o el Rosario completo, tocando las cuentas.
//   go('rosario')                    un misterio (el del día)
//   go('rosario', { full: true })    el Rosario completo (los cinco misterios del día y la Salve)
// Antes de empezar, el niño elige por quién reza (se guarda solo en el teléfono: js/core/state.js → intentions).
import * as state from '../core/state.js';
import * as tts from '../core/tts.js';
import { keepAwake } from '../core/device.js';
import { h, clear, button, toast } from '../core/ui.js';
import { sfx } from '../core/audio.js';
import { back } from '../core/router.js';
import { arr, txt, deco, lifecycle, shell, soon, miniScene, celebrate } from './catequesis.js';

const voiceOn = () => tts.available() && state.setting('voice') !== false;

export async function mount(el, params = {}) {
  const life = lifecycle();
  const sh = shell(el, { title: 'El Rosario', onBack: () => back(), cls: 'fe ro' });
  let O = {}, P = [];
  try { [O, P] = await Promise.all([import('../data/oraciones-extra.js'), import('../data/prayers.js').then(m => m.PRAYERS)]); } catch { /* sin datos */ }
  const R = O.ROSARY;
  if (!R || !arr(R.mysteries).length) { sh.fill(soon()); return { unmount() { life.end(); sh.root.remove(); } }; }
  keepAwake('oracion', true);
  const prayer = id => [...P, ...arr(O.PRAYERS_EXTRA)].find(p => p.id === id);
  const day = new Date().getDay();
  const group = arr(R.mysteries).find(g => arr(g.days).includes(day)) || R.mysteries[0];
  let full = !!params.full;
  let intention = null;

  // ── 1. ¿Por quién rezas? ──
  function viewIntention() {
    const other = h('input', { class: 'pq-input', type: 'text', maxlength: '40', placeholder: 'Escribe un nombre (si quieres)', autocomplete: 'off', 'aria-label': 'Por quién rezo' });
    const grid = h('div', { class: 'ro-ints' }, arr(O.INTENTIONS).map(it => h('button', { type: 'button', class: 'ro-int', onclick: () => {
      sfx('pop'); intention = { id: it.id, label: it.label, emoji: it.emoji, sick: !!it.sick };
      state.addIntention(intention);
      viewMystery();
    } }, h('span', { 'aria-hidden': 'true' }, it.emoji), h('span', null, it.label))));
    sh.fill(
      h('div', { class: 'ct-intro' }, h('h2', null, '¿Por quién quieres rezar?'), h('p', null, 'Elige a alguien. María lleva tu oración a Jesús.')),
      grid,
      h('div', { class: 'ro-other' }, other, button('Rezar por esta persona', { kind: 'ghost', small: true, icon: '🙏', onClick: () => {
        const v = other.value.trim();
        if (!v) { other.focus(); return; }
        intention = { id: 'otro', label: `Por ${v}`, emoji: '🙏', sick: false };
        state.addIntention(intention);
        viewMystery();
      } })),
      h('label', { class: 'ro-full' }, h('input', { type: 'checkbox', checked: full ? true : null, onchange: e => { full = e.target.checked; } }), h('span', null, 'Rezar el Rosario completo (los cinco misterios)')),
      h('details', { class: 'fe-acc' }, h('summary', null, deco('📿'), h('span', null, '¿Cómo se reza el Rosario?')),
        h('div', { class: 'fe-acc__body' }, arr(R.intro).map(p => h('p', null, txt(p))), h('ol', { class: 'ro-how' }, arr(R.howTo).map(s => h('li', null, deco(s.emoji || '•'), txt(s.text)))))));
  }

  // ── 2. El misterio y las cuentas ──
  let mIdx = 0;
  function viewMystery() {
    const items = arr(group.items);
    const it = full ? items[mIdx] : items[(new Date().getDate()) % items.length];
    const actors = arr(it.emojis).slice(0, 3).map((e, k) => ({ e, x: [30, 70, 50][k], y: [64, 62, 28][k], s: k < 2 ? 1.2 : 0.85 }));
    // Cuentas: Padre Nuestro, 10 Ave María, Gloria y «Oh Jesús mío».
    const beads = [{ id: 'padre-nuestro', big: true, label: 'Padre Nuestro' }, ...Array.from({ length: 10 }, (_, k) => ({ id: 'ave-maria', label: `Ave María ${k + 1}` })),
      { id: 'gloria', big: true, label: 'Gloria' }, { id: 'oh-jesus-mio', label: 'Oh Jesús mío' }];
    let cur = 0;
    const lineBox = h('div', { class: 'ro-lines', 'aria-live': 'polite' });
    const chain = h('div', { class: 'ro-chain', role: 'group', 'aria-label': 'Cuentas del Rosario' });
    const paint = () => {
      clear(chain).append(...beads.map((b, k) => h('button', { type: 'button', class: `ro-bead${b.big ? ' ro-bead--big' : ''}${k < cur ? ' is-done' : ''}${k === cur ? ' is-now' : ''}`,
        'aria-label': `${b.label}${k < cur ? ', rezada' : k === cur ? ', toca para rezar' : ''}`, disabled: k > cur ? true : null, onclick: () => tap(k) })));
      const b = beads[Math.min(cur, beads.length - 1)];
      const p = prayer(b.id);
      clear(lineBox).append(h('p', { class: 'ro-now' }, cur < beads.length ? `Toca la cuenta: ${b.label}` : '¡Terminaste el misterio!'),
        cur < beads.length && p ? h('div', { class: 'ro-text' }, arr(p.lines).map(l => h('p', null, txt(l)))) : null);
    };
    const tap = k => {
      if (k !== cur) return;
      const b = beads[k];
      const p = prayer(b.id);
      sfx(b.big ? 'bell' : 'pop');
      if (voiceOn() && p) tts.speak(arr(p.lines).map(txt), { keepLines: true });
      cur++;
      paint();
      if (cur >= beads.length) setTimeout(done, 600);
    };
    const done = () => {
      if (life.dead) return;
      if (full && mIdx < arr(group.items).length - 1) { mIdx++; toast(`Misterio ${mIdx + 1} de 5`, { icon: '📿' }); viewMystery(); return; }
      finish();
    };
    sh.fill(
      h('div', { class: 'ro-head' },
        miniScene(it.bg, actors, 'fe-step__art'),
        h('p', { class: 'eyebrow' }, `${txt(group.title)}${full ? ` · ${mIdx + 1} de 5` : ''}`),
        h('h2', null, txt(it.title)),
        it.ref ? h('p', { class: 'bb-ref' }, deco('📖'), txt(it.ref)) : null,
        h('p', { class: 'ro-myst' }, txt(it.text)),
        intention ? h('p', { class: 'ro-for' }, deco(intention.emoji || '🙏'), intention.label) : null,
        voiceOn() ? button('Escuchar el misterio', { kind: 'sky', small: true, icon: '🔊', onClick: () => tts.speak([txt(it.title), txt(it.text)]) }) : null),
      chain, lineBox);
    paint();
  }

  // ── 3. Al terminar ──
  function finish() {
    tts.stop();
    const { firstToday } = state.prayed('rosario');
    if (firstToday) { state.addStat('fe', 6); state.addXp(6); }
    sfx('win');
    celebrate(sh.page, ['🌹', '✨', '💙', '🕊️']);
    const salve = prayer('salve');
    sh.fill(
      h('div', { class: 'ct-intro ro-end' }, h('div', { class: 'ro-end__icon', 'aria-hidden': 'true' }, '🌹'),
        h('h2', null, full ? '¡Rezaste el Rosario completo!' : '¡Rezaste un misterio del Rosario!'),
        h('p', null, intention ? `María lleva tu oración ${intention.label.replace(/^Por /, 'por ').toLowerCase()} a Jesús.` : 'María lleva tu oración a Jesús.'),
        firstToday ? h('p', { class: 'home-prayer__note' }, '+6 Fe 🕯️') : null),
      full && salve ? h('section', { class: 'fe-acc', style: { padding: '12px 14px' } }, h('h3', null, txt(R.closing?.text || 'Terminamos con la Salve')),
        h('div', { class: 'ro-text' }, arr(salve.lines).map(l => h('p', null, txt(l)))),
        voiceOn() ? button('Rezar la Salve', { kind: 'sky', small: true, icon: '🔊', onClick: () => tts.speak(arr(salve.lines).map(txt), { keepLines: true }) }) : null) : null,
      h('div', { class: 'ro-btns' },
        button('Volver a la capilla', { kind: 'sun', icon: '🕯️', onClick: () => back() }),
        button('Rezar otro misterio', { kind: 'ghost', small: true, icon: '📿', onClick: () => { mIdx = 0; full = false; viewIntention(); } })));
  }

  viewIntention();
  return { unmount() { keepAwake('oracion', false); life.end(); sh.root.remove(); } };
}
