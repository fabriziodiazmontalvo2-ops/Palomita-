// Junta todo lo que la app lee en voz alta, agrupado por documento (una historia, una lección, una oración…).
// Cada grupo se graba en un solo paquete de audio (assets/voz/<grupo>.ogg) para que la app cargue de una vez
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
import { PARISH, ABOUT } from '../js/data/parroquia.js';
import { STICKERS } from '../js/data/stickers.js';
import { PRAYERS_EXTRA, CONTRITION_VARIANTS, ROSARY, CREDO_PHRASES } from '../js/data/oraciones-extra.js';
import { DUDAS } from '../js/data/dudas.js';
import { GRAN_DIA } from '../js/data/gran-dia.js';
import { RATITO } from '../js/data/ratito.js';
import { CURA_ARS_STORY, CURA_ARS_FACTS } from '../js/data/cura-ars.js';
import { SEASONS, SPECIAL_DAYS, FEASTS, ADVENT_WEEKS, NOVENA, LENT_TIPS } from '../js/data/fiestas.js';
import { PHRASES, FOOD_FACTS } from '../js/data/phrases.js';
import { GAMES } from '../js/games/registry.js';
import { seasonOf } from '../js/core/liturgy.js';
import fs from 'node:fs';

const arr = v => (Array.isArray(v) ? v.filter(x => x !== null && x !== undefined) : []);
const txt = v => (typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v));
const quiz = list => arr(list).flatMap(q => [txt(q.q), ...arr(q.options).map(txt)]);

const groups = [];
// voice: 'palomita' → la vocecita de la palomita (claves con «p» delante; tools/gen-voice.py le sube el tono).
// Los textos con {femenino|masculino} (palomita o palomito, ver js/core/genero.js) se graban en las dos formas.
const TPL = /\{([^{}|]*)\|([^{}|]*)\}/g;
const both = t => { const f = t.replace(TPL, (_, a) => a), m = t.replace(TPL, (_, a, b) => b); return f === m ? [f] : [f, m]; };
const add = (group, texts, voice = '') => groups.push({ group, texts: arr(texts).map(txt).filter(Boolean).flatMap(both), voice });
const src = f => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

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
add('parroquia', [PARISH?.name, ...arr(ABOUT?.parish?.text), ABOUT?.patron?.title, ...arr(ABOUT?.patron?.text), PARISH?.motto?.text]);
add('figuritas', arr(STICKERS).flatMap(s => [s.title, s.caption]));
for (let i = 0; i < arr(TRIVIA).length; i += 24) add(`trivia-${i / 24 + 1}`, quiz(arr(TRIVIA).slice(i, i + 24)));

// ── Versión 1.3 ──
for (const p of arr(PRAYERS_EXTRA)) add(`or-${p.id}`, arr(p.lines));
for (const v of arr(CONTRITION_VARIANTS)) add(`or-cv-${v.id}`, arr(v.lines));
add('rosario', [...arr(ROSARY?.intro), ...arr(ROSARY?.howTo).map(x => x.text), ROSARY?.closing?.text]);
for (const g of arr(ROSARY?.mysteries)) add(`rosario-${g.id}`, [g.title, ...arr(g.items).flatMap(it => [it.title, it.text])]);
add('credo-frases', arr(CREDO_PHRASES).flatMap(p => [p.line, p.explain]));
add('dudas', arr(DUDAS).flatMap(d => [d.q, d.a]));
{
  const G = GRAN_DIA || {};
  add('gran-dia', [G.title, ...arr(G.intro), ...arr(G.steps).flatMap(st => [st.title, st.text, st.tip, ...arr(st.dialogue).map(d => d.text)]),
    ...arr(G.countdown).map(c => c.text), G.dayOf?.title, G.dayOf?.text, G.after?.title, G.after?.text]);
}
{
  const R = RATITO || {};
  add('ratito', [R.title, ...arr([R.intro].flat()), ...arr(R.steps).flatMap(st => [st.title, st.text]), R.closing, R.sagrario?.title, ...arr(R.sagrario?.paragraphs)]);
}
{
  const s = CURA_ARS_STORY || {};
  add(`ars-${s.id}`, [s.title, ...arr(s.paragraphs), ...quiz(s.quiz)]);
}
{
  const C = CONFESSION || {};
  add('confesion-cuidado', [C.safety, C.calm, ...arr(C.examen?.groups || C.groups).map(g => g?.note)]);
}
// El año de la Iglesia: tiempos, días especiales, fiestas, corona de Adviento, novena y Cuaresma.
add('tiempos', [...Object.values(SEASONS || {}).flatMap(x => [x.title, x.text]), 'Recemos:']);
{
  // Los rótulos de cada semana («Tercera semana de Adviento», «Semana 12 del tiempo ordinario»…), tal como los arma liturgy.js.
  const labels = new Set();
  for (let t = Date.UTC(2025, 0, 1); t < Date.UTC(2029, 0, 1); t += 86400000) { const w = seasonOf(new Date(t)).weekLabel; if (w) labels.add(w); }
  add('semanas', [...labels]);
}
add('dias-especiales', Object.values(SPECIAL_DAYS || {}).flatMap(x => [x.title, x.text]));
for (const f of arr(FEASTS)) add(`fiesta-${f.id}`, [f.title, ...arr(f.paragraphs), f.prayer]);
add('adviento', [...arr(ADVENT_WEEKS).flatMap(w => [w.title, w.text]), ...arr(NOVENA).flatMap(n => [n.figure, n.text]), ...arr(LENT_TIPS)]);
// Juegos: lo que se lee antes de jugar.
add('juegos', [...arr(GAMES).flatMap(g => [g.title, ...arr(g.how)]), 'Meta:']);
// Mi día, la pregunta de la Misa y de la misión, y los consejos de los medidores de la casa.
{
  const tasks = [...src('js/home/midia.js').matchAll(/text: '([^']+)'/g)].map(m => m[1]);
  const tips = [...src('js/screens/home.js').matchAll(/^\s+(?:hambre|energia|limpieza|alegria|fe): '([^']+)',$/gm)].map(m => m[1]);
  add('casa', ['Mi día.', '¡Hecho!', ...tasks, '¿Fuiste a Misa este domingo?', '¿Pudiste cumplir tu misión?', 'Comida.', 'Sueño.', 'Baño.', 'Alegría.', 'Fe.', ...tips]);
}

// ── La vocecita de la palomita: lo que dice en sus globitos ──
{
  const lines = new Set();
  for (const list of Object.values(PHRASES || {})) for (const t of arr(list)) lines.add(t);
  for (const t of Object.values(FOOD_FACTS || {})) lines.add(t);
  for (const t of arr(CURA_ARS_FACTS)) lines.add(t);
  for (const x of [...Object.values(SEASONS || {}), ...Object.values(SPECIAL_DAYS || {}), ...arr(ADVENT_WEEKS)]) if (x?.kidLine) lines.add(x.kidLine);
  // Los globitos fijos del código: say('…') y los textos que se eligen dentro de una llamada a say(…).
  for (const f of ['js/screens/home.js', ...fs.readdirSync(new URL('../js/home/', import.meta.url)).filter(n => n.endsWith('.js')).map(n => `js/home/${n}`)]) {
    for (const line of src(f).split('\n')) {
      if (!/\bsay\(/.test(line)) continue;
      for (const m of line.matchAll(/'((?:[^'\\]|\\.)*)'/g)) {
        const t = m[1];
        if (/\$\{/.test(t) || !/^[¡¿A-ZÁÉÍÓÚÑ]/.test(t) || !/\p{L}{3}/u.test(t)) continue;
        lines.add(t);
      }
    }
  }
  add('palomita', [...lines], 'palomita');
}

// Cada frase se graba una sola vez, en el primer grupo donde aparece (la vocecita de la palomita, aparte).
const seen = new Set();
const out = [];
for (const g of groups) {
  const list = [];
  const pre = g.voice === 'palomita' ? 'p' : '';
  for (const t of g.texts) {
    for (const s of sentences(t)) {
      const key = pre + keyOf(s);
      if (seen.has(key)) continue;
      seen.add(key);
      list.push({ key, text: s });
    }
  }
  if (list.length) out.push({ group: g.group.replace(/[^a-z0-9-]/gi, '-').toLowerCase(), ...(g.voice ? { voice: g.voice } : {}), sentences: list });
}

if (process.argv.includes('--json')) process.stdout.write(JSON.stringify(out));
else {
  const n = out.reduce((a, g) => a + g.sentences.length, 0);
  const c = out.reduce((a, g) => a + g.sentences.reduce((b, s) => b + s.text.length, 0), 0);
  console.log(`${out.length} grupos · ${n} frases · ${c} caracteres (≈ ${Math.round(c / 13 / 60)} min de voz)`);
}
