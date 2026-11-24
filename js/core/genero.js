// El género de la palomita: «mujer» (la palomita) o «varón» (el palomito). El niño lo elige al empezar
// (js/screens/welcome.js); quien ya tenía la app lo elige la primera vez que abre la casa. Mientras no lo elija,
// se habla como siempre: palomita.
//   gender()        'mujer' | 'varon'
//   chosen()        ¿ya lo eligió?
//   G(texto)        resuelve las partes {femenino|masculino}: G('Estoy aburrid{a|o}') → «aburrida» o «aburrido»
//   fits(cosa)      ¿esta ropa es para su género? (lo que no tiene gender es para todos)
// Los textos con {a|o} se graban con las dos voces (tools/narration-texts.mjs los abre en las dos formas).
import * as state from './state.js';

export const gender = () => (state.gender() === 'varon' ? 'varon' : 'mujer');
export const chosen = () => !!state.gender();
export const G = (s, g = gender()) => String(s ?? '').replace(/\{([^{}|]*)\|([^{}|]*)\}/g, (_, f, m) => (g === 'varon' ? m : f));
export const fits = (item, g = gender()) => !!item && (!item.gender || item.gender === g);
// Las dos formas de un texto (para grabar la voz y para las pruebas).
export const both = s => [...new Set([G(s, 'mujer'), G(s, 'varon')])];
