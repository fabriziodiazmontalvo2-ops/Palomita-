// Ajustes: sonido, música, voz, nombres, reinicio e información para papás y catequistas.
import * as state from '../core/state.js';
import { sfx } from '../core/audio.js';
import * as tts from '../core/tts.js';
import { h, button, iconButton, confirmDialog, toast } from '../core/ui.js';
import { go, back } from '../core/router.js';

export function mount(el) {
  const toggle = (key, icon, label, note) => {
    const input = h('input', { type: 'checkbox', id: `set-${key}`, class: 'set-switch__input' });
    input.checked = state.setting(key) !== false;
    input.addEventListener('change', () => { state.setSetting(key, input.checked); if (input.checked) sfx('pop'); if (key === 'voice' && !input.checked) tts.stop(); });
    return h('label', { class: 'set-row', for: `set-${key}` },
      h('span', { class: 'set-row__icon', 'aria-hidden': 'true' }, icon),
      h('span', { class: 'set-row__text' }, h('b', null, label), note ? h('span', null, note) : null),
      h('span', { class: 'set-switch' }, input, h('span', { class: 'set-switch__track', 'aria-hidden': 'true' })));
  };

  const nameIn = h('input', { id: 'set-name', class: 'wel__input', type: 'text', maxlength: '14', value: state.get().name, autocomplete: 'off', 'aria-label': 'Nombre de tu palomita' });
  const kidIn = h('input', { id: 'set-kid', class: 'wel__input', type: 'text', maxlength: '14', value: state.get().kid, autocomplete: 'off', placeholder: 'Tu nombre', 'aria-label': 'Tu nombre' });

  async function reset() {
    const ok = await confirmDialog('Se borrará todo tu avance: nivel, semillas, estampitas y lecturas. ¿Empezamos de nuevo?', { title: '¿Empezar de nuevo?', icon: '🧹', yes: 'Sí, borrar todo', no: 'No, me quedo', kind: '' });
    if (!ok) return;
    state.reset();
    go('welcome', {}, { replace: true });
  }

  const s = state.get();
  el.append(
    h('header', { class: 'topbar' }, iconButton('↩️', 'Volver', () => back()), h('h1', null, 'Ajustes')),
    h('div', { class: 'scroll set-scroll' },
      h('section', { class: 'panel set-card' },
        toggle('sound', '🔔', 'Sonidos'),
        toggle('music', '🎵', 'Música'),
        toggle('voice', '🔊', 'Voz que lee', tts.available() ? 'Lee en voz alta historias y oraciones.' : 'Este dispositivo no tiene voz para leer.')),
      h('section', { class: 'panel set-card' },
        h('h2', { class: 'set-title' }, 'Nombres'),
        h('label', { class: 'wel__label', for: 'set-name' }, 'Tu palomita se llama'), nameIn,
        h('label', { class: 'wel__label', for: 'set-kid' }, 'Y tú te llamas'), kidIn,
        button('Guardar nombres', { kind: 'leaf', small: true, onClick: () => { state.setNames({ name: nameIn.value, kid: kidIn.value }); toast('¡Guardado!', { icon: '✅' }); } })),
      h('section', { class: 'panel set-card' },
        h('h2', { class: 'set-title' }, 'Mi avance'),
        h('div', { class: 'set-stats' },
          h('span', { class: 'chip' }, `⭐ Nivel ${s.level}`), h('span', { class: 'chip' }, `🏅 ${state.stickers().length} estampitas`),
          h('span', { class: 'chip' }, `📖 ${Object.keys(s.read).length} lecturas`), h('span', { class: 'chip' }, `📅 ${s.days} ${s.days === 1 ? 'día' : 'días'} juntos`)),
        button('Empezar de nuevo', { kind: 'ghost', small: true, icon: '🧹', onClick: reset })),
      h('section', { class: 'panel set-card set-parents' },
        h('h2', { class: 'set-title' }, 'Para papás y catequistas'),
        h('p', null, 'Palomita acompaña a niños de 7 a 10 años que se preparan para su Primera Comunión: cuidan a su mascota, juegan con las parábolas de Jesús, leen historias de la Biblia y aprenden a rezar.'),
        h('p', null, 'Los textos bíblicos son adaptaciones para niños. Cada uno trae su cita para leer después el pasaje completo en la Biblia de la familia o de la catequesis.'),
        h('p', null, 'Les sugerimos acompañar al niño, conversar con él sobre el mensaje de cada juego y usar la app unos 15 o 20 minutos al día. Un sacerdote o catequista puede revisar los contenidos antes de usarlos en grupo.'),
        h('p', null, 'No hay anuncios, compras ni registro, y no se recoge ningún dato: el avance se guarda solo en este dispositivo. El botón «Háblame» usa el micrófono únicamente en ese momento; el sonido no se guarda ni se envía.')),
      h('p', { class: 'set-credits' }, 'Palomita 1.0 · Hecha con Three.js (MIT) y las tipografías Baloo 2 y Nunito (SIL OFL).')));
  return {};
}
