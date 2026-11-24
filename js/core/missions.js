// Botón «¡Acepto la misión!» para las misiones de buenas obras (juegos y parábolas).
// Al día siguiente la palomita pregunta si se cumplió (ver js/home/moments.js); cumplirla hace brotar una flor.
// Decir «sí» no da semillas: así nadie se siente invitado a decir que sí sin haberla hecho.
import * as state from './state.js';
import { h, toast } from './ui.js';
import { sfx } from './audio.js';

export function missionButton(text, from = '') {
  if (!text) return null;
  const on = () => state.mission()?.text === text;
  const b = h('button', { type: 'button', class: 'mission-accept', onclick: () => {
    if (on()) return;
    const had = !!state.mission();
    state.acceptMission({ text, from });
    sfx('sticker');
    toast(had ? 'Cambiaste tu misión. ¡Mañana te pregunto cómo te fue!' : '¡Misión aceptada! Mañana tu palomita te preguntará cómo te fue', { icon: '🌸', ms: 3400 });
    paint();
  } });
  const paint = () => {
    const ok = on();
    b.className = `mission-accept${ok ? ' is-on' : ''}`;
    b.textContent = '';
    b.append(h('span', { 'aria-hidden': 'true' }, ok ? '✅' : '🤝'), h('span', null, ok ? 'Misión aceptada' : '¡Acepto la misión!'));
    b.setAttribute('aria-pressed', String(ok));
  };
  paint();
  return b;
}
