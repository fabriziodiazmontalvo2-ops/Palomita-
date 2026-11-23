// Narración grabada: cómo se parte un texto en frases y qué nombre de archivo tiene cada frase.
// Lo usan la app (js/core/tts.js) y la herramienta que graba las voces (tools/narration-texts.mjs),
// así las dos parten igual y la app encuentra el audio de cada frase.
//
//   clean(t)       quita emojis y espacios de más
//   sentences(t)   frases de un texto; también corta después de «:» («El sacerdote dice: …» → 2 piezas)
//   keyOf(frase)   nombre corto y estable del audio de esa frase (FNV-1a, base 36)

export function clean(t) {
  return String(t ?? '').replace(/\p{Extended_Pictographic}|️|‍/gu, '').replace(/\s+/g, ' ').trim();
}

const SENT = /[^.!?…]+(?:[.!?…]+[»”"')\]]*)?\s*/g;
// Un rótulo corto al comienzo («A:», «Tu misión de hoy:», «El sacerdote dice:») va en su propia pieza.
const LABEL = /^([^:«»"]{1,26}:)\s+(\S.*)$/u;
export function sentences(t) {
  const c = clean(t);
  if (!c) return [];
  const out = [];
  for (const raw of c.match(SENT) || [c]) {
    const s = raw.trim();
    if (!s) continue;
    // Un pedazo sin letras ni números (comillas o puntos sueltos) se pega al anterior.
    if (!/[\p{L}\p{N}]/u.test(s)) { if (out.length) out[out.length - 1] += s; continue; }
    // Puede haber más de un rótulo seguido («A: Su gracia: …»); lo que queda sin letras («…») es solo una pausa.
    let rest = s, m;
    while ((m = rest.match(LABEL)) && m[1].split(' ').length <= 4) { out.push(m[1]); rest = m[2]; }
    if (/[\p{L}\p{N}]/u.test(rest)) out.push(rest);
  }
  return out;
}

export function normalize(s) {
  return clean(s).normalize('NFC').replace(/[«»“”"]/g, '').replace(/\s+([.,;:!?…])/g, '$1').replace(/\s+/g, ' ').trim().toLowerCase();
}

export function keyOf(s) {
  const n = normalize(s);
  let h = 0x811c9dc5;
  for (let i = 0; i < n.length; i++) {
    h ^= n.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36).padStart(7, '0') + (n.length % 36).toString(36);
}
