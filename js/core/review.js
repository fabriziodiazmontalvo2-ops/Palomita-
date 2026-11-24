// «Mis repasos»: la pregunta que el niño contesta mal vuelve otro día (al día siguiente, a los 3 días, a la semana)
// hasta que la sabe; entonces sale sola de la lista (las cajitas están en js/core/state.js).
// La clave de cada pregunta sale de su texto: no depende del archivo, del orden ni de cómo se barajen las opciones.
//
//   answered(q, ok)   desde cualquier cuestionario. Si falló, entra (o vuelve) a los repasos. Si acertó y ese día
//                     le tocaba repasarla, avanza de cajita. Acertar justo después de ver la respuesta no cuenta.
//   keyOf(q)          'q:' + huella corta del texto de la pregunta
//   dueCount()        cuántas le tocan hoy
import * as state from './state.js';

const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '');

// FNV-1a de 32 bits en base 36: 6 o 7 letras por pregunta.
function hash(s) {
  let x = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 0x01000193) >>> 0; }
  return x.toString(36);
}

export function keyOf(q) {
  const t = norm(typeof q === 'string' ? q : q?.q);
  return t ? `q:${hash(t)}` : '';
}

export function answered(q, ok) {
  const key = keyOf(q);
  if (!key) return;
  if (!ok) { state.reviewMiss(key); return; }
  if (state.reviewDue().includes(key)) state.reviewHit(key);
}

export const dueCount = () => state.reviewDue().length;
