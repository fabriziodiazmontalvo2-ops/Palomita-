// Junta todo lo que la app lee en voz alta, agrupado por documento (una historia, una lección, una oración…).
// Cada grupo se graba en un solo paquete de audio (assets/voz/<grupo>.bin) para que la app cargue de una vez
// todo lo que necesita al abrir esa historia.
//
//   node tools/narration-texts.mjs            → resumen (grupos, frases y caracteres)
//   node tools/narration-texts.mjs --json     → [{ group, sentences: [{ key, text }] }]
//
// Si una pantalla nueva lee textos con otra forma, agrégalos aquí; lo que no esté grabado lo lee la voz del teléfono.
import { sentences, keyOf } from '../js/core/narration.js';
import { STORIES_AT } from '../js/data/bible-at.js';
import { STORIES_NT } from '../js/data/bible-nt.js';
import { STORIES_MILAGROS } from '../js/data/bible-milagros.js';
import { PARABLES } from '../js/data/parables.js';
import { CATECHISM } from '../js/data/catechism.js';
import { CONFESSION } from '../js/data/confession.js';
import { MASS } from '../js/data/mass.js';
import { LESSONS } from '../js/data/lessons.js';
import { PRAYERS } from '../js/data/prayers.js';
import { VERSES } from '../js/data/verses.js';
import { TRIVIA } from '../js/data/trivia.js';

const arr = v => (Array.isArray(v) ? v.filter(x => x !== null && x !== undefined) : []);
const txt = v => (typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v));
const quiz = list => arr(list).flatMap(q => [txt(q.q), ...arr(q.options).map(txt)]);

const groups = [];
const add = (group, texts) => groups.push({ group, texts: arr(texts).map(txt).filter(Boolean) });

// Rótulos que las pantallas ponen delante de los textos.
add('rotulos', ['A:', 'B:', 'C:', 'D:', 'Tu misión de hoy:', 'El sacerdote dice:', 'El lector dice:', 'Todos respondemos:', 'Un consejo:',
  ...Array.from({ length: 14 }, (_, i) => `Paso ${i + 1}.`), '¿Qué es la Confesión?']);

for (const [pre, list] of [['at', STORIES_AT], ['nt', STORIES_NT], ['mi', STORIES_MILAGROS]]) {
  for (const s of arr(list)) add(`${pre}-${s.id}`, [s.title, ...arr(s.paragraphs), ...quiz(s.quiz)]);
}
for (const p of Object.values(PARABLES || {})) {
  add(`pa-${p.id}`, [p.title, ...arr(p.story), ...arr(p.messages), ...arr(p.missions), p.verse?.text, ...quiz(p.quiz)]);
}
for (const c of arr(CATECHISM)) {
  add(`ca-${c.id}`, [c.title, c.intro, ...arr(c.items).flatMap(it => [it.title, it.text]), c.closing, ...quiz(c.quiz)]);
}
for (const l of arr(LESSONS)) {
  add(`le-${l.id}`, [...arr(l.scenes).map(sc => txt(sc.say).trim() || txt(sc.caption).trim()), ...quiz(l.quiz)]);
}
{
  const C = CONFESSION || {};
  add('confesion', [C.intro?.title, ...arr(C.intro?.paragraphs), ...arr(C.steps).flatMap(st => [st.title, st.text, ...arr(st.dialogue).map(d => d.text)]), ...quiz(C.quiz)]);
}
{
  const M = MASS || {};
  add('misa', [M.communion?.title, ...arr(M.communion?.steps).map(s => s.text), ...quiz(M.quiz)]);
  for (const p of arr(M.parts)) add(`misa-${p.id}`, [p.title, p.text, ...arr(p.dialogues).flatMap(d => [d.priest, d.people]), p.tip]);
}
for (const p of arr(PRAYERS)) add(`or-${p.id}`, arr(p.lines));
add('versiculos', arr(VERSES).map(v => v.text));
for (let i = 0; i < arr(TRIVIA).length; i += 24) add(`trivia-${i / 24 + 1}`, quiz(arr(TRIVIA).slice(i, i + 24)));

// Cada frase se graba una sola vez, en el primer grupo donde aparece.
const seen = new Set();
const out = [];
for (const g of groups) {
  const list = [];
  for (const t of g.texts) {
    for (const s of sentences(t)) {
      const key = keyOf(s);
      if (seen.has(key)) continue;
      seen.add(key);
      list.push({ key, text: s });
    }
  }
  if (list.length) out.push({ group: g.group.replace(/[^a-z0-9-]/gi, '-').toLowerCase(), sentences: list });
}

if (process.argv.includes('--json')) process.stdout.write(JSON.stringify(out));
else {
  const n = out.reduce((a, g) => a + g.sentences.length, 0);
  const c = out.reduce((a, g) => a + g.sentences.reduce((b, s) => b + s.text.length, 0), 0);
  console.log(`${out.length} grupos · ${n} frases · ${c} caracteres (≈ ${Math.round(c / 13 / 60)} min de voz)`);
}
