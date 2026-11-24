// Ajustes: sonido, música, voz, tamaño de letra, nombres, quién juega, reinicio y la entrada «Para grandes».
import * as state from '../core/state.js';
import { sfx } from '../core/audio.js';
import * as tts from '../core/tts.js';
import * as profiles from '../core/profiles.js';
import { fontStep, setFontStep, appVersion } from '../core/device.js';
import { grownGate } from '../core/grown.js';
import { VERSION } from '../core/version.js';
import { h, button, iconButton, confirmDialog, toast } from '../core/ui.js';
import { go, back } from '../core/router.js';
import { available as talkAvailableFn } from '../pet/talkback.js';
import { showNews } from './novedades.js';

export function mount(el) {
  const talkAvailable = talkAvailableFn();
  const toggle = (key, icon, label, note) => {
    const input = h('input', { type: 'checkbox', id: `set-${key}`, class: 'set-switch__input' });
    input.checked = key === 'listen' ? state.setting(key) === true : state.setting(key) !== false;
    input.addEventListener('change', async () => {
      // El micrófono: la primera vez lo enciende un grande.
      if (key === 'listen' && input.checked && !state.flag('micOk')) {
        input.checked = false;
        if (!(await grownGate({ reason: 'Para que la palomita use el micrófono y repita lo que el niño dice.' }))) return;
        state.setFlag('micOk');
        input.checked = true;
      }
      state.setSetting(key, input.checked);
      if (input.checked) sfx('pop');
      if (key === 'voice' && !input.checked) tts.stop();
    });
    return h('label', { class: 'set-row', for: `set-${key}` },
      h('span', { class: 'set-row__icon', 'aria-hidden': 'true' }, icon),
      h('span', { class: 'set-row__text' }, h('b', null, label), note ? h('span', null, note) : null),
      h('span', { class: 'set-switch' }, input, h('span', { class: 'set-switch__track', 'aria-hidden': 'true' })));
  };

  // Tamaño de letra: A · A+ · A++
  const fontRow = () => {
    const seg = h('div', { class: 'set-seg', role: 'radiogroup', 'aria-label': 'Tamaño de letra' });
    const paint = () => { [...seg.children].forEach((b, i) => b.setAttribute('aria-checked', String(i === fontStep()))); };
    ['A', 'A+', 'A++'].forEach((t, i) => seg.append(h('button', { type: 'button', role: 'radio', class: `set-seg__b set-seg__b--${i}`, onclick: () => { sfx('tap'); setFontStep(i); paint(); } }, t)));
    paint();
    return h('div', { class: 'set-row set-row--static' },
      h('span', { class: 'set-row__icon', 'aria-hidden': 'true' }, '🔠'),
      h('span', { class: 'set-row__text' }, h('b', null, 'Tamaño de letra'), h('span', null, 'Más grande para leer mejor')),
      seg);
  };

  const nameIn = h('input', { id: 'set-name', class: 'wel__input', type: 'text', maxlength: '14', value: state.get().name, autocomplete: 'off', 'aria-label': 'Nombre de tu palomita' });
  const kidIn = h('input', { id: 'set-kid', class: 'wel__input', type: 'text', maxlength: '14', value: state.get().kid, autocomplete: 'off', placeholder: 'Tu nombre', 'aria-label': 'Tu nombre' });

  async function reset() {
    if (!(await grownGate({ reason: 'Empezar de nuevo borra todo el avance del niño.' }))) return;
    const ok = await confirmDialog('Se borrará todo el avance: nivel, semillas, estampitas y lecturas. Queda una copia por si se arrepienten («Para grandes» → Cuidado). ¿Empezamos de nuevo?', { title: '¿Empezar de nuevo?', icon: '🧹', yes: 'Sí, borrar todo', no: 'No, me quedo', kind: '' });
    if (!ok) return;
    state.reset();
    go('welcome', {}, { replace: true });
  }

  const s = state.get();
  const apk = appVersion();
  const many = profiles.count() > 1;
  el.append(
    h('header', { class: 'topbar' }, iconButton('↩️', 'Volver', () => back()), h('h1', null, 'Ajustes')),
    h('div', { class: 'scroll set-scroll' },
      h('section', { class: 'panel set-card' },
        toggle('sound', '🔔', 'Sonidos'),
        toggle('music', '🎵', 'Música'),
        toggle('voice', '🔊', 'Voz de la narradora', tts.recorded() ? 'Una voz cálida lee en voz alta historias, lecciones y oraciones.' : tts.available() ? 'Lee en voz alta historias y oraciones.' : 'Este dispositivo no tiene voz para leer.'),
        talkAvailable ? toggle('listen', '👂', 'La palomita repite lo que digo', 'Usa el micrófono solo mientras estás con la palomita. Nada se guarda.') : null,
        fontRow()),
      h('section', { class: 'panel set-card' },
        h('h2', { class: 'set-title' }, 'Nombres'),
        h('label', { class: 'wel__label', for: 'set-name' }, 'Tu palomita se llama'), nameIn,
        h('label', { class: 'wel__label', for: 'set-kid' }, 'Y tú te llamas'), kidIn,
        button('Guardar nombres', { kind: 'leaf', small: true, onClick: () => { state.setNames({ name: nameIn.value, kid: kidIn.value }); toast('¡Guardado!', { icon: '✅' }); } })),
      many ? h('section', { class: 'panel set-card' },
        h('h2', { class: 'set-title' }, '¿Quién juega?'),
        h('p', { class: 'set-small' }, `Ahora juega ${s.kid || 'este niño'} con ${s.name}.`),
        button('Cambiar de niño', { kind: 'sky', small: true, icon: '👧👦', onClick: () => go('perfiles', { fromSettings: true }) })) : null,
      h('section', { class: 'panel set-card' },
        h('h2', { class: 'set-title' }, 'Mi avance'),
        h('div', { class: 'set-stats' },
          h('span', { class: 'chip' }, `⭐ Nivel ${s.level}`), h('span', { class: 'chip' }, `🏅 ${state.stickers().length} estampitas`),
          h('span', { class: 'chip' }, `📖 ${Object.keys(s.read).length} lecturas`), h('span', { class: 'chip' }, `📅 ${s.days} ${s.days === 1 ? 'día' : 'días'} juntos`)),
        button('Empezar de nuevo', { kind: 'ghost', small: true, icon: '🧹', onClick: reset })),
      h('section', { class: 'panel set-card set-parents' },
        h('h2', { class: 'set-title' }, 'Para papás y catequistas'),
        h('p', null, 'Palomita acompaña a niños de 7 a 10 años que se preparan para su Primera Comunión: cuidan a su mascota, juegan con las parábolas de Jesús, leen historias de la Biblia y aprenden a rezar. Les sugerimos acompañar al niño y usar la app unos 15 o 20 minutos al día.'),
        h('p', null, 'En «Para grandes» están el avance del niño (para enviarlo al catequista), los sellos de las oraciones y de la Misa, las fechas especiales, los hermanos, la copia de seguridad y el Rincón de papás y padrinos.'),
        button('Entrar a «Para grandes»', { kind: 'grape', block: true, icon: '🔐', onClick: () => go('grandes') })),
      h('p', { class: 'set-credits' },
        `Palomita ${VERSION}${apk ? ` · app ${apk}` : ''} · `,
        h('button', { type: 'button', class: 'set-link', onclick: () => { sfx('tap'); showNews({ all: true }); } }, '¿Qué hay de nuevo?'),
        h('br'), 'Hecha con Three.js (MIT) y las tipografías Baloo 2 y Nunito (SIL OFL). Voz: Piper (Apache 2.0).')));
  return {};
}
