// Bienvenida (solo la primera vez): primero el niño elige si su palomita es varón o mujer (así le aparece la ropa
// que le corresponde en la tienda), después le pone nombre y ve qué harán juntos.
import * as state from '../core/state.js';
import { sfx } from '../core/audio.js';
import { h, clear, button } from '../core/ui.js';
import { go } from '../core/router.js';
import { doveFront, doveLook } from '../games/kit.js';
import { G } from '../core/genero.js';

const DEFAULT_NAMES = ['Palomita', 'Palomito'];

export function mount(el) {
  el.classList.add('wel');
  let step = 0, raf = 0, alive = true;
  let gender = state.gender();
  let name = state.get().name || 'Palomita', kid = state.get().kid || '';

  // La palomita dibujada, saludando (con su gorra o su moño cuando ya eligió).
  const canvas = h('canvas', { class: 'wel__dove', width: 320, height: 300, 'aria-hidden': 'true' });
  const g = canvas.getContext('2d');
  const t0 = performance.now();
  (function loop(now) {
    if (!alive) return;
    const t = (now - t0) / 1000;
    const bob = Math.sin(t * 2.4) * 1.5;
    g.clearRect(0, 0, 320, 300);
    doveFront(g, 160, 262, 3.3, { mood: 'happy', wings: step === 2 ? 0.75 + Math.sin(t * 9) * 0.25 : Math.max(0, Math.sin(t * 2.2)) * 0.35, bob });
    doveLook(g, 160, 262, 3.3, step > 0 ? gender : null, bob);
    raf = requestAnimationFrame(loop);
  })(t0);

  const body = h('div', { class: 'wel__body' });
  const card = h('div', { class: 'wel__card panel' }, body);
  el.append(h('div', { class: 'wel__wrap' }, canvas, card));

  function finish() {
    state.setNames({ name: name.trim() || G('{Palomita|Palomito}'), kid });
    state.setFlag('onboarded');
    state.save();
    sfx('win');
    go('home', {}, { replace: true });
  }

  // Una tarjeta para elegir: la palomita dibujada con su gorra o su moño.
  function choice(g2, label, sub, color) {
    const c = h('canvas', { class: 'wel__pick-art', width: 150, height: 150, 'aria-hidden': 'true' });
    const cx = c.getContext('2d');
    doveFront(cx, 75, 136, 1.55, { mood: 'happy' });
    doveLook(cx, 75, 136, 1.55, g2);
    const b = h('button', { type: 'button', class: `wel__pick wel__pick--${g2}`, onclick: () => {
      sfx('pop');
      gender = g2;
      state.setGender(g2);
      if (DEFAULT_NAMES.includes(name.trim()) || !name.trim()) name = G('{Palomita|Palomito}');
      step = 1; render();
    } }, c, h('b', null, label), h('span', null, sub));
    b.style.setProperty('--pick', color);
    return b;
  }

  function render() {
    clear(body);
    if (step === 0) {
      body.append(
        h('h1', { class: 'wel__title' }, '¡Hola! Antes de empezar…'),
        h('p', { class: 'wel__text' }, '¿Tu palomita será varón o mujer? ¡Tú eliges!'),
        h('div', { class: 'wel__picks' },
          choice('varon', 'Varón', 'Palomito', '#3d7be0'),
          choice('mujer', 'Mujer', 'Palomita', '#ec5f8e')),
        h('p', { class: 'wel__hint' }, 'En la tienda le aparecerá la ropa que le corresponde. Después lo puedes cambiar en Ajustes.'));
    } else if (step === 1) {
      const nameIn = h('input', { id: 'wel-name', class: 'wel__input', type: 'text', maxlength: '14', value: name, autocomplete: 'off', enterkeyhint: 'next', 'aria-label': G('Nombre de tu {palomita|palomito}') });
      const kidIn = h('input', { id: 'wel-kid', class: 'wel__input', type: 'text', maxlength: '14', value: kid, autocomplete: 'off', enterkeyhint: 'done', placeholder: 'Tu nombre (si quieres)', 'aria-label': 'Tu nombre' });
      nameIn.addEventListener('input', () => { name = nameIn.value; });
      kidIn.addEventListener('input', () => { kid = kidIn.value; });
      body.append(
        h('h1', { class: 'wel__title' }, G('¡Hola! Soy tu {palomita|palomito}')),
        h('p', { class: 'wel__text' }, 'Voy a acompañarte en tu camino hacia la Primera Comunión.'),
        h('label', { class: 'wel__label', for: 'wel-name' }, '¿Cómo me quieres llamar?'), nameIn,
        h('label', { class: 'wel__label', for: 'wel-kid' }, '¿Y tú cómo te llamas?'), kidIn,
        button('Siguiente', { kind: 'leaf', block: true, icon: '➡️', onClick: () => { step = 2; render(); } }),
        button('Atrás', { kind: 'ghost', small: true, onClick: () => { step = 0; render(); } }));
    } else {
      const rows = [['🍞', 'Cuidarme', 'Dame de comer, báñame y llévame a dormir.'], ['👕', 'Vestirme a la moda', 'Ropa nueva en la tienda, con las semillas que ganes.'],
        ['🎮', 'Jugar', 'Cada juego trae una parábola de Jesús.'], ['📖', 'Leer la Biblia', 'Historias contadas para ti.'], ['🙏', 'Rezar', 'Aprenderemos las oraciones juntos.']];
      body.append(
        h('h1', { class: 'wel__title' }, kid.trim() ? `¡Qué alegría, ${kid.trim()}!` : '¡Qué alegría!'),
        h('p', { class: 'wel__text' }, `Yo soy ${name.trim() || G('{Palomita|Palomito}')}. Juntos vamos a:`),
        h('ul', { class: 'wel__list' }, rows.map(([i, t, d]) => h('li', null, h('span', { class: 'wel__icon', 'aria-hidden': 'true' }, i), h('div', null, h('b', null, t), h('span', null, d))))),
        button('¡Vamos!', { kind: 'sun', block: true, icon: '🕊️', onClick: finish }),
        button('Atrás', { kind: 'ghost', small: true, onClick: () => { step = 1; render(); } }));
    }
  }
  render();

  return { unmount() { alive = false; cancelAnimationFrame(raf); el.classList.remove('wel'); } };
}
