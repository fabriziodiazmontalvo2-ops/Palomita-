#!/usr/bin/env node
// Valida la forma de los archivos de contenido de js/data/.
// Uso: node tools/validate-content.mjs [parables|bible-at|bible-nt|prayers|catechism|verses|trivia|phrases ...]
// Sin argumentos valida todos los que existan. Sale con código 1 si hay errores.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warns = [];
const err = (f, m) => errors.push(`[${f}] ${m}`);
const warn = (f, m) => warns.push(`[${f}] ${m}`);

const isStr = (v, min = 1) => typeof v === 'string' && v.trim().length >= min;
const REF_RE = /^(?:[1-3] )?[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?: [a-záéíóúñ]+){0,3} \d+(?:, \d+[a-c]?(?:-\d+[a-c]?)?(?:\. ?\d+[a-c]?(?:-\d+[a-c]?)?)*)?(?: ?[–-] ?\d+, \d+)?(?:; ?\d+, \d+(?:-\d+)?)*$/;
const EMOJI_RE = /\p{Extended_Pictographic}/u;
const BGS = ['cielo', 'noche', 'desierto', 'mar', 'jardin', 'dorado', 'amanecer', 'tormenta', 'templo', 'campo', 'cenaculo', 'rio', 'monte', 'ciudad', 'iglesia'];   // = SCENE_IDS de js/art/scenes.js

function checkText(f, where, v, max, min = 8) {
  if (!isStr(v, min)) return err(f, `${where}: texto vacío o demasiado corto`);
  if (max && v.length > max) err(f, `${where}: ${v.length} caracteres (máximo ${max})`);
  if (/\s{2,}/.test(v)) warn(f, `${where}: espacios dobles`);
  if (/\?/.test(v) && !/¿/.test(v)) warn(f, `${where}: falta "¿" de apertura`);
  if (/!/.test(v) && !/¡/.test(v)) warn(f, `${where}: falta "¡" de apertura`);
  if (/[<>]/.test(v)) err(f, `${where}: no usar HTML ni < >`);
}
function checkRef(f, where, ref) {
  if (!isStr(ref, 4)) return err(f, `${where}: falta la cita bíblica`);
  if (!REF_RE.test(ref)) warn(f, `${where}: cita con formato inusual → "${ref}" (esperado p. ej. "Lucas 15, 4-7")`);
}
function checkQuiz(f, where, quiz, { count, minOpts = 3, maxOpts = 3 } = {}) {
  if (!Array.isArray(quiz)) return err(f, `${where}: quiz debe ser un arreglo`);
  if (!count && (quiz.length < 3 || quiz.length > 12)) err(f, `${where}: quiz debe tener 3–12 preguntas`);
  if (count && quiz.length !== count) err(f, `${where}: quiz debe tener ${count} preguntas (tiene ${quiz.length})`);
  quiz.forEach((q, i) => checkQuestion(f, `${where}.quiz[${i}]`, q, minOpts, maxOpts));
}
function checkQuestion(f, w, q, minOpts = 3, maxOpts = 4) {
  if (!q || typeof q !== 'object') return err(f, `${w}: pregunta inválida`);
  checkText(f, `${w}.q`, q.q, 150);
  if (!Array.isArray(q.options) || q.options.length < minOpts || q.options.length > maxOpts) err(f, `${w}: options debe tener ${minOpts}–${maxOpts} opciones`);
  else {
    q.options.forEach((o, j) => { if (!isStr(o) || o.length > 60) err(f, `${w}.options[${j}]: vacío o > 60 caracteres`); });
    if (new Set(q.options.map(o => String(o).trim().toLowerCase())).size !== q.options.length) err(f, `${w}: opciones repetidas`);
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) err(f, `${w}: answer fuera de rango`);
  }
  checkText(f, `${w}.explain`, q.explain, 200);
}
function uniqueIds(f, list) {
  const seen = new Set();
  for (const it of list) {
    if (!isStr(it.id) || !/^[a-z0-9-]+$/.test(it.id)) err(f, `id inválido: ${JSON.stringify(it.id)} (solo a-z, 0-9 y guiones)`);
    if (seen.has(it.id)) err(f, `id repetido: ${it.id}`);
    seen.add(it.id);
  }
}
function answerSpread(f, questions) {
  const counts = {};
  for (const q of questions) counts[q.answer] = (counts[q.answer] || 0) + 1;
  const total = questions.length;
  if (total >= 9) for (const k of Object.keys(counts)) if (counts[k] / total > 0.5) warn(f, `la respuesta correcta está en la posición ${k} en ${counts[k]} de ${total} preguntas: repartir mejor`);
}

const VALIDATORS = {
  parables(m, f) {
    const P = m.PARABLES;
    if (!P || typeof P !== 'object') return err(f, 'falta export const PARABLES = {…}');
    const need = ['noe', 'oveja', 'sembrador', 'samaritano', 'roca', 'talentos', 'mostaza', 'prodigo', 'perla', 'panes', 'luz'];
    for (const id of need) if (!P[id]) err(f, `falta la entrada "${id}"`);
    const allQ = [];
    for (const [id, p] of Object.entries(P)) {
      const w = `PARABLES.${id}`;
      if (p.id !== id) err(f, `${w}: id debe ser "${id}"`);
      checkText(f, `${w}.title`, p.title, 60, 3);
      checkRef(f, `${w}.ref`, p.ref);
      if (!isStr(p.emoji) || !EMOJI_RE.test(p.emoji)) err(f, `${w}.emoji: falta emoji`);
      if (!['parabola', 'historia'].includes(p.kind)) err(f, `${w}.kind debe ser 'parabola' o 'historia'`);
      checkText(f, `${w}.summary`, p.summary, 110);
      if (!Array.isArray(p.story) || p.story.length < 4 || p.story.length > 6) err(f, `${w}.story: 4–6 párrafos`);
      else p.story.forEach((s, i) => checkText(f, `${w}.story[${i}]`, s, 320, 30));
      for (const [k, n, max] of [['messages', 4, 160], ['missions', 4, 120]]) {
        if (!Array.isArray(p[k]) || p[k].length !== n) err(f, `${w}.${k}: deben ser ${n}`);
        else p[k].forEach((s, i) => checkText(f, `${w}.${k}[${i}]`, s, max, 15));
      }
      if (!p.verse) err(f, `${w}.verse: falta`); else { checkText(f, `${w}.verse.text`, p.verse.text, 140); checkRef(f, `${w}.verse.ref`, p.verse.ref); }
      checkText(f, `${w}.prayer`, p.prayer, 200, 20);
      checkQuiz(f, w, p.quiz, { count: 3 });
      if (Array.isArray(p.quiz)) allQ.push(...p.quiz);
    }
    answerSpread(f, allQ);
  },
  stories(list, f, name, min) {
    if (!Array.isArray(list)) return err(f, `falta export const ${name} = […]`);
    if (list.length < min) err(f, `${name}: se esperan al menos ${min} historias (hay ${list.length})`);
    uniqueIds(f, list);
    const allQ = [];
    list.forEach(s => {
      const w = `${name}.${s.id}`;
      checkText(f, `${w}.title`, s.title, 60, 3);
      checkRef(f, `${w}.ref`, s.ref);
      if (!isStr(s.emoji) || !EMOJI_RE.test(s.emoji)) err(f, `${w}.emoji: falta emoji`);
      if (!s.art || !BGS.includes(s.art.bg)) err(f, `${w}.art.bg debe ser uno de: ${BGS.join(', ')}`);
      if (!s.art || !Array.isArray(s.art.emojis) || s.art.emojis.length < 2 || s.art.emojis.length > 4) err(f, `${w}.art.emojis: 2–4 emojis`);
      checkText(f, `${w}.summary`, s.summary, 110);
      if (!Array.isArray(s.paragraphs) || s.paragraphs.length < 4 || s.paragraphs.length > 7) err(f, `${w}.paragraphs: 4–7 párrafos`);
      else s.paragraphs.forEach((p, i) => checkText(f, `${w}.paragraphs[${i}]`, p, 340, 30));
      if (!s.verse) err(f, `${w}.verse: falta`); else { checkText(f, `${w}.verse.text`, s.verse.text, 150); checkRef(f, `${w}.verse.ref`, s.verse.ref); }
      checkText(f, `${w}.think`, s.think, 160, 15);
      checkText(f, `${w}.prayer`, s.prayer, 200, 20);
      checkQuiz(f, w, s.quiz, { count: 3 });
      if (Array.isArray(s.quiz)) allQ.push(...s.quiz);
    });
    answerSpread(f, allQ);
  },
  'bible-at'(m, f) { VALIDATORS.stories(m.STORIES_AT, f, 'STORIES_AT', 14); },
  'bible-nt'(m, f) { VALIDATORS.stories(m.STORIES_NT, f, 'STORIES_NT', 20); },
  prayers(m, f) {
    const L = m.PRAYERS;
    if (!Array.isArray(L)) return err(f, 'falta export const PRAYERS = […]');
    if (L.length < 12) err(f, `PRAYERS: se esperan al menos 12 oraciones (hay ${L.length})`);
    uniqueIds(f, L);
    const groups = ['basicas', 'dia', 'misa', 'maria', 'comunion'];
    L.forEach(p => {
      const w = `PRAYERS.${p.id}`;
      checkText(f, `${w}.title`, p.title, 60, 3);
      if (!isStr(p.emoji) || !EMOJI_RE.test(p.emoji)) err(f, `${w}.emoji: falta emoji`);
      if (!groups.includes(p.group)) err(f, `${w}.group debe ser uno de: ${groups.join(', ')}`);
      if (!Array.isArray(p.lines) || p.lines.length < 1) err(f, `${w}.lines: arreglo de renglones`);
      else p.lines.forEach((s, i) => { if (!isStr(s, 2) || s.length > 220) err(f, `${w}.lines[${i}]: vacío o > 220 caracteres`); });
      if (p.note !== undefined) checkText(f, `${w}.note`, p.note, 220);
    });
  },
  catechism(m, f) {
    const L = m.CATECHISM;
    if (!Array.isArray(L)) return err(f, 'falta export const CATECHISM = […]');
    if (L.length < 10) err(f, `CATECHISM: se esperan al menos 10 temas (hay ${L.length})`);
    uniqueIds(f, L);
    const allQ = [];
    L.forEach(c => {
      const w = `CATECHISM.${c.id}`;
      checkText(f, `${w}.title`, c.title, 60, 3);
      if (!isStr(c.emoji) || !EMOJI_RE.test(c.emoji)) err(f, `${w}.emoji: falta emoji`);
      checkText(f, `${w}.intro`, c.intro, 360, 20);
      if (c.unit !== undefined && !['creo', 'celebro', 'vivo', 'rezo'].includes(c.unit)) err(f, `${w}.unit debe ser creo | celebro | vivo | rezo`);
      if (!Array.isArray(c.items) || c.items.length < 2) err(f, `${w}.items: al menos 2`);
      else c.items.forEach((it, i) => { checkText(f, `${w}.items[${i}].title`, it.title, 80, 2); checkText(f, `${w}.items[${i}].text`, it.text, 300, 8); });
      if (c.closing !== undefined) checkText(f, `${w}.closing`, c.closing, 240);
      checkQuiz(f, w, c.quiz, { count: 3 });
      if (Array.isArray(c.quiz)) allQ.push(...c.quiz);
    });
    answerSpread(f, allQ);
  },
  verses(m, f) {
    const L = m.VERSES;
    if (!Array.isArray(L)) return err(f, 'falta export const VERSES = […]');
    if (L.length < 60) err(f, `VERSES: se esperan al menos 60 (hay ${L.length})`);
    const themes = ['amor', 'confianza', 'alegria', 'perdon', 'oracion', 'eucaristia', 'paz', 'valentia', 'gratitud', 'servicio'];
    const seen = new Set();
    L.forEach((v, i) => {
      checkText(f, `VERSES[${i}].text`, v.text, 150);
      checkRef(f, `VERSES[${i}].ref`, v.ref);
      if (!themes.includes(v.theme)) err(f, `VERSES[${i}].theme debe ser uno de: ${themes.join(', ')}`);
      if (seen.has(v.ref)) warn(f, `VERSES[${i}]: cita repetida ${v.ref}`);
      seen.add(v.ref);
    });
  },
  trivia(m, f) {
    const L = m.TRIVIA;
    if (!Array.isArray(L)) return err(f, 'falta export const TRIVIA = […]');
    if (L.length < 90) err(f, `TRIVIA: se esperan al menos 90 preguntas (hay ${L.length})`);
    const byLevel = { 1: 0, 2: 0, 3: 0 };
    const seen = new Set();
    L.forEach((q, i) => {
      checkQuestion(f, `TRIVIA[${i}]`, q, 3, 3);
      if (![1, 2, 3].includes(q.level)) err(f, `TRIVIA[${i}].level debe ser 1, 2 o 3`); else byLevel[q.level]++;
      if (!isStr(q.topic)) err(f, `TRIVIA[${i}].topic: falta`);
      if (seen.has(q.q)) err(f, `TRIVIA[${i}]: pregunta repetida`);
      seen.add(q.q);
    });
    for (const k of [1, 2, 3]) if (byLevel[k] < 25) err(f, `TRIVIA: nivel ${k} tiene ${byLevel[k]} preguntas (mínimo 25)`);
    answerSpread(f, L);
  },
  'bible-milagros'(m, f) { VALIDATORS.stories(m.STORIES_MILAGROS, f, 'STORIES_MILAGROS', 8); },
  lessons(m, f) {
    const L = m.LESSONS;
    if (!Array.isArray(L)) return err(f, 'falta export const LESSONS = […]');
    if (L.length < 10) err(f, `LESSONS: se esperan al menos 10 lecciones (hay ${L.length})`);
    uniqueIds(f, L);
    const ANIMS = ['pop', 'float', 'bounce', 'slide-left', 'slide-right', 'spin', 'pulse', 'glow', 'fall', 'grow', 'shake', 'none'];
    const UNITS = ['creo', 'celebro', 'vivo', 'rezo'];
    const allQ = [];
    L.forEach(l => {
      const w = `LESSONS.${l.id}`;
      checkText(f, `${w}.title`, l.title, 60, 3);
      if (!isStr(l.emoji) || !EMOJI_RE.test(l.emoji)) err(f, `${w}.emoji: falta emoji`);
      if (!/^#[0-9a-f]{6}$/i.test(l.color || '')) err(f, `${w}.color: color #rrggbb`);
      if (!UNITS.includes(l.unit)) err(f, `${w}.unit debe ser uno de: ${UNITS.join(', ')}`);
      checkText(f, `${w}.summary`, l.summary, 140);
      if (!Array.isArray(l.scenes) || l.scenes.length < 6 || l.scenes.length > 12) err(f, `${w}.scenes: 6–12 escenas`);
      else l.scenes.forEach((sc, i) => {
        const ws = `${w}.scenes[${i}]`;
        if (!BGS.includes(sc.bg)) err(f, `${ws}.bg debe ser uno de: ${BGS.join(', ')}`);
        if (!Array.isArray(sc.actors) || sc.actors.length < 1 || sc.actors.length > 5) err(f, `${ws}.actors: 1–5`);
        else sc.actors.forEach((a, j) => {
          if (!isStr(a.e) || !EMOJI_RE.test(a.e)) err(f, `${ws}.actors[${j}].e: emoji`);
          for (const k of ['x', 'y']) if (typeof a[k] !== 'number' || a[k] < 0 || a[k] > 100) err(f, `${ws}.actors[${j}].${k}: 0–100`);
          if (a.s !== undefined && (typeof a.s !== 'number' || a.s < 0.4 || a.s > 3)) err(f, `${ws}.actors[${j}].s: 0.4–3`);
          if (a.anim !== undefined && !ANIMS.includes(a.anim)) err(f, `${ws}.actors[${j}].anim debe ser uno de: ${ANIMS.join(', ')}`);
        });
        checkText(f, `${ws}.caption`, sc.caption, 200, 10);
        if (sc.say !== undefined) checkText(f, `${ws}.say`, sc.say, 320, 10);
      });
      checkQuiz(f, w, l.quiz);
      if (Array.isArray(l.quiz) && (l.quiz.length < 3 || l.quiz.length > 5)) err(f, `${w}.quiz: 3–5 preguntas`);
      if (Array.isArray(l.quiz)) allQ.push(...l.quiz);
    });
    answerSpread(f, allQ);
  },
  confession(m, f) {
    const C = m.CONFESSION;
    if (!C || typeof C !== 'object') return err(f, 'falta export const CONFESSION = {…}');
    if (!C.intro || !Array.isArray(C.intro.paragraphs) || C.intro.paragraphs.length < 2) err(f, 'CONFESSION.intro.paragraphs: al menos 2');
    else C.intro.paragraphs.forEach((p, i) => checkText(f, `CONFESSION.intro.paragraphs[${i}]`, p, 360, 20));
    if (!Array.isArray(C.exam) || C.exam.length < 4) err(f, 'CONFESSION.exam: al menos 4 grupos');
    else { uniqueIds(f, C.exam); C.exam.forEach(g => {
      checkText(f, `CONFESSION.exam.${g.id}.title`, g.title, 50, 3);
      if (!isStr(g.emoji) || !EMOJI_RE.test(g.emoji)) err(f, `CONFESSION.exam.${g.id}.emoji`);
      if (!Array.isArray(g.questions) || g.questions.length < 4) err(f, `CONFESSION.exam.${g.id}.questions: al menos 4`);
      else g.questions.forEach((q, i) => checkText(f, `CONFESSION.exam.${g.id}.questions[${i}]`, q, 130, 8));
    }); }
    if (!Array.isArray(C.steps) || C.steps.length < 5) err(f, 'CONFESSION.steps: al menos 5 pasos');
    else { uniqueIds(f, C.steps); C.steps.forEach(st => {
      checkText(f, `CONFESSION.steps.${st.id}.title`, st.title, 60, 3);
      if (!isStr(st.emoji) || !EMOJI_RE.test(st.emoji)) err(f, `CONFESSION.steps.${st.id}.emoji`);
      checkText(f, `CONFESSION.steps.${st.id}.text`, st.text, 360, 15);
      if (st.dialogue !== undefined) {
        if (!Array.isArray(st.dialogue)) err(f, `CONFESSION.steps.${st.id}.dialogue: arreglo`);
        else st.dialogue.forEach((d, i) => { if (!['sacerdote', 'yo'].includes(d.who)) err(f, `CONFESSION.steps.${st.id}.dialogue[${i}].who: sacerdote | yo`); checkText(f, `CONFESSION.steps.${st.id}.dialogue[${i}].text`, d.text, 260, 2); });
      }
    }); }
    if (C.privacy !== undefined) checkText(f, 'CONFESSION.privacy', C.privacy, 220);
    checkQuiz(f, 'CONFESSION', C.quiz);
  },
  mass(m, f) {
    const M = m.MASS;
    if (!M || typeof M !== 'object') return err(f, 'falta export const MASS = {…}');
    checkText(f, 'MASS.intro', M.intro, 400, 20);
    const GROUPS = ['inicio', 'palabra', 'eucaristia', 'comunion', 'despedida'];
    const POSTURES = ['de pie', 'sentados', 'de rodillas'];
    if (!Array.isArray(M.parts) || M.parts.length < 12) err(f, 'MASS.parts: al menos 12 momentos');
    else { uniqueIds(f, M.parts); M.parts.forEach(p => {
      const w = `MASS.parts.${p.id}`;
      checkText(f, `${w}.title`, p.title, 60, 3);
      if (!isStr(p.emoji) || !EMOJI_RE.test(p.emoji)) err(f, `${w}.emoji`);
      if (!GROUPS.includes(p.group)) err(f, `${w}.group debe ser uno de: ${GROUPS.join(', ')}`);
      if (!POSTURES.includes(p.posture)) err(f, `${w}.posture debe ser uno de: ${POSTURES.join(', ')}`);
      checkText(f, `${w}.text`, p.text, 320, 15);
      if (!Array.isArray(p.dialogues)) err(f, `${w}.dialogues: arreglo (puede estar vacío)`);
      else p.dialogues.forEach((d, i) => { checkText(f, `${w}.dialogues[${i}].priest`, d.priest, 240, 2); checkText(f, `${w}.dialogues[${i}].people`, d.people, 300, 2); });
      if (p.tip !== undefined) checkText(f, `${w}.tip`, p.tip, 200, 10);
    }); }
    if (!M.communion || !Array.isArray(M.communion.steps) || M.communion.steps.length < 5) err(f, 'MASS.communion.steps: al menos 5');
    else M.communion.steps.forEach((st, i) => { if (!isStr(st.emoji) || !EMOJI_RE.test(st.emoji)) err(f, `MASS.communion.steps[${i}].emoji`); checkText(f, `MASS.communion.steps[${i}].text`, st.text, 240, 10); });
    checkQuiz(f, 'MASS', M.quiz);
  },
  phrases(m, f) {
    const P = m.PHRASES;
    if (!P || typeof P !== 'object') return err(f, 'falta export const PHRASES = {…}');
    const keys = ['greet', 'morning', 'night', 'hungry', 'sleepy', 'dirty', 'bored', 'happy', 'fed', 'clean', 'petted', 'pray', 'afterGame', 'levelUp', 'wakeUp', 'facts'];
    for (const k of keys) {
      if (!Array.isArray(P[k]) || P[k].length < (k === 'facts' ? 20 : 5)) { err(f, `PHRASES.${k}: mínimo ${k === 'facts' ? 20 : 5} frases`); continue; }
      P[k].forEach((s, i) => checkText(f, `PHRASES.${k}[${i}]`, s, k === 'facts' ? 150 : 70, 3));
    }
    const F = m.FOOD_FACTS;
    if (!F || typeof F !== 'object') return err(f, 'falta export const FOOD_FACTS = {…}');
    const foods = ['pan', 'uvas', 'pescado', 'miel', 'manzana', 'leche', 'agua', 'higos', 'datiles', 'aceitunas', 'queso', 'lentejas', 'granada', 'trigo', 'torta', 'galleta'];
    for (const id of foods) { if (!F[id]) err(f, `FOOD_FACTS.${id}: falta`); else checkText(f, `FOOD_FACTS.${id}`, F[id], 150); }
  },
};

const FILES = {
  parables: 'js/data/parables.js', 'bible-at': 'js/data/bible-at.js', 'bible-nt': 'js/data/bible-nt.js',
  prayers: 'js/data/prayers.js', catechism: 'js/data/catechism.js', verses: 'js/data/verses.js',
  trivia: 'js/data/trivia.js', phrases: 'js/data/phrases.js',
  'bible-milagros': 'js/data/bible-milagros.js', lessons: 'js/data/lessons.js', confession: 'js/data/confession.js', mass: 'js/data/mass.js',
};

const wanted = process.argv.slice(2);
const names = wanted.length ? wanted : Object.keys(FILES);
let checked = 0;
for (const name of names) {
  const rel = FILES[name];
  if (!rel) { err(name, 'nombre desconocido'); continue; }
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) { if (wanted.length) err(rel, 'el archivo no existe'); continue; }
  try {
    const mod = await import(pathToFileURL(file).href + `?t=${process.hrtime.bigint()}`);
    VALIDATORS[name](mod, rel);
    checked++;
  } catch (e) { err(rel, `no se pudo importar: ${e.message}`); }
}
for (const w of warns) console.log('AVISO  ' + w);
for (const e of errors) console.log('ERROR  ' + e);
console.log(`\n${checked} archivo(s) revisados · ${errors.length} error(es) · ${warns.length} aviso(s)`);
process.exit(errors.length ? 1 : 0);
