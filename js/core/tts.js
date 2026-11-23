// Lectura en voz alta. Sirve para los niños que todavía leen despacio.
//
// Primero usa la VOZ GRABADA de la narradora (assets/voz: voz neuronal cálida, grabada frase por frase con
// tools/gen-voice.py). Lo que no esté grabado (textos nuevos, el nombre de la palomita…) lo lee la voz del
// teléfono: en Android con TextToSpeech por medio de un puente nativo, en el navegador con speechSynthesis.
//
//   available()            → true si hay alguna voz para leer
//   speak(texto | [textos], { onend, onIndex, keepLines })   lee en español; corta en frases para que no se interrumpa.
//        keepLines: true → cada texto del arreglo se lee como una pieza propia y onIndex(i) avisa cuál empieza
//        (sirve para resaltar el renglón de una oración mientras suena).
//   stop() / speaking()
//   recorded()             → true si la voz grabada está lista
import { duck, context } from './audio.js';
import { clean, sentences, keyOf } from './narration.js';

let voice = null;
let active = false;
let endCb = null;
let indexCb = null;
let gen = 0;          // cada lectura nueva invalida los avisos tardíos de la anterior

const synth = () => (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null);
// En la app de Android la voz del teléfono la pone TextToSpeech por medio de un puente nativo.
const bridge = () => (typeof window !== 'undefined' && window.PalomitaAndroid ? window.PalomitaAndroid : null);
let bridgeDone = null;
if (typeof window !== 'undefined') {
  window.__palomitaTtsDone = () => { const f = bridgeDone; bridgeDone = null; f?.(); };
  window.__palomitaTtsLine = () => {};
}

// ── Voz grabada ──
const VOZ = 'assets/voz/';
let clips = null;            // clave → [paquete, desde, largo]
const packs = new Map();     // paquete → Promise<ArrayBuffer>  (los últimos 8)
const decoded = new Map();   // clave → Promise<AudioBuffer>    (los últimos 40)
let current = null;          // AudioBufferSourceNode sonando
let voiceGain = null;

const loading = (typeof fetch === 'function' && typeof window !== 'undefined')
  ? fetch(VOZ + 'index.json').then(r => (r.ok ? r.json() : null)).then(ix => {
    if (!ix || !Array.isArray(ix.packs)) return;
    const map = new Map();
    for (const [pack, list] of ix.packs) {
      let off = 0;
      for (const item of String(list).split(' ')) {
        const [k, n] = item.split(':');
        const len = +n;
        if (k && len) { map.set(k, [pack, off, len]); off += len; }
      }
    }
    if (map.size) clips = map;
  }).catch(() => {})
  : Promise.resolve();

export function recorded() { return !!clips; }

function lru(map, key, make, max) {
  if (map.has(key)) { const v = map.get(key); map.delete(key); map.set(key, v); return v; }
  const v = make();
  map.set(key, v);
  while (map.size > max) map.delete(map.keys().next().value);
  return v;
}
function loadPack(name) {
  return lru(packs, name, () => fetch(VOZ + name + '.bin').then(r => { if (!r.ok) throw new Error('voz'); return r.arrayBuffer(); }), 8);
}
function decode(key) {
  const where = clips?.get(key);
  if (!where) return Promise.resolve(null);
  const p = lru(decoded, key, () => loadPack(where[0]).then(ab => {
    const c = context();
    if (!c) return null;
    const part = ab.slice(where[1], where[1] + where[2]);
    return new Promise(res => {
      try {
        const pr = c.decodeAudioData(part, b => res(b), () => res(null));
        if (pr && typeof pr.then === 'function') pr.then(res, () => res(null));
      } catch { res(null); }
    });
  }).catch(() => null), 40);
  p.then(b => { if (!b) decoded.delete(key); });
  return p;
}
const wait = ms => new Promise(r => setTimeout(r, ms));

async function ready() {
  const c = context();
  if (!c) return false;
  if (c.state !== 'running') { try { await Promise.race([c.resume(), wait(400)]); } catch { /* nada */ } }
  return c.state === 'running';
}
function playBuffer(my, buf) {
  return new Promise(res => {
    const c = context();
    if (!c || my !== gen) { res(); return; }
    if (!voiceGain) { voiceGain = c.createGain(); voiceGain.gain.value = 1; voiceGain.connect(c.destination); }
    const src = c.createBufferSource();
    src.buffer = buf;
    src.connect(voiceGain);
    current = src;
    let done = false;
    const end = () => { if (done) return; done = true; if (current === src) current = null; res(); };
    src.onended = end;
    setTimeout(end, buf.duration * 1000 + 800);   // por si el aviso de fin no llega
    try { src.start(); } catch { end(); }
  });
}
// Toca las frases grabadas de una pieza. Devuelve el texto que faltó leer (si algo falló), o '' si terminó.
async function playClips(my, piece) {
  let next = decode(piece.keys[0]);
  for (let i = 0; i < piece.keys.length; i++) {
    const buf = await next;
    if (my !== gen) return '';
    if (i + 1 < piece.keys.length) next = decode(piece.keys[i + 1]);
    if (!buf) return piece.sents.slice(i).join(' ');
    await playBuffer(my, buf);
    if (my !== gen) return '';
  }
  return '';
}

// ── Voz del teléfono ──
function pickVoice() {
  const s = synth();
  if (!s) return null;
  const voices = s.getVoices().filter(v => /^es(-|_|$)/i.test(v.lang));
  if (!voices.length) return null;
  const score = v => (/(MX|US|419|CO|AR|PE|CL)/i.test(v.lang) ? 3 : 1)
    + (/(Natural|Neural|Online|Premium|Enhanced|Google|Paulina|Mónica|Monica|Sabina|Helena|Dalia|Camila|Elvira)/i.test(v.name) ? 1.5 : 0)
    + (/(female|mujer|Paulina|Mónica|Monica|Sabina|Helena|Dalia|Camila|Elvira|Lucía|Lucia)/i.test(v.name) ? 0.5 : 0)
    + (v.localService ? 0.5 : 0);
  return voices.sort((a, b) => score(b) - score(a))[0];
}
function deviceAvailable() {
  const b = bridge();
  if (b) { try { return !!b.ttsAvailable(); } catch { return false; } }
  return !!synth() && typeof window.SpeechSynthesisUtterance === 'function';
}
function deviceSay(my, text) {
  return new Promise(res => {
    if (my !== gen || !text) { res(); return; }
    const b = bridge();
    if (b) {
      bridgeDone = res;
      try { b.speak(JSON.stringify([text])); } catch { bridgeDone = null; res(); }
      return;
    }
    const s = synth();
    if (!s || typeof window.SpeechSynthesisUtterance !== 'function') { res(); return; }
    const u = new SpeechSynthesisUtterance(text);
    voice = voice || pickVoice();
    if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'es-MX';
    u.rate = 0.9; u.pitch = 1.08; u.volume = 1;
    u.onend = () => res();
    u.onerror = () => res();
    try { s.speak(u); } catch { res(); }
  });
}

export function available() {
  return !!clips || deviceAvailable();
}

function chunks(text) {
  const parts = String(text).replace(/\s+/g, ' ').match(/[^.!?…]+[.!?…]*\s*/g) || [String(text)];
  const out = [];
  let cur = '';
  for (const p of parts) {
    if ((cur + p).length > 180 && cur) { out.push(cur.trim()); cur = p; } else cur += p;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function finish(my) {
  if (my !== gen) return;
  const cb = endCb;
  const was = active;
  active = false; endCb = null; indexCb = null;
  duck(false);
  if (was && cb) { try { cb(); } catch { /* nada */ } }
}

async function run(my, pieces) {
  await loading;
  const recordedOk = pieces.some(p => p.keys) && await ready();
  // Chrome avisa tarde el fin de una lectura cancelada: se empieza un instante después.
  await wait(60);
  for (let i = 0; i < pieces.length; i++) {
    if (my !== gen) return;
    const p = pieces[i];
    if (indexCb && (i === 0 || pieces[i - 1].idx !== p.idx)) { try { indexCb(p.idx); } catch { /* nada */ } }
    let rest = p.text;
    if (p.keys && recordedOk) rest = await playClips(my, p);
    if (my !== gen) return;
    if (rest) await deviceSay(my, rest);
    if (my !== gen) return;
    if (i + 1 < pieces.length) await wait(pieces[i + 1].idx !== p.idx ? 280 : 90);
  }
  finish(my);
}

export function speak(text, { onend, onIndex, keepLines = false } = {}) {
  if (!available()) { onend?.(); return false; }
  stop();
  const list = (Array.isArray(text) ? text : [text]).map(t => (t === null || t === undefined ? '' : String(t)));
  const pieces = [];
  list.forEach((t, idx) => {
    const c = clean(t);
    if (!c) return;
    for (const part of (keepLines ? [c] : chunks(c))) {
      const sents = sentences(part);
      const keys = clips && sents.length ? sents.map(keyOf) : null;
      pieces.push({ idx, text: part, sents, keys: keys && keys.every(k => clips.has(k)) ? keys : null });
    }
  });
  if (!pieces.length) { onend?.(); return false; }
  // Sin voz grabada para nada y sin voz en el teléfono: no hay cómo leer.
  if (!pieces.some(p => p.keys) && !deviceAvailable()) { onend?.(); return false; }
  endCb = onend || null;
  indexCb = onIndex || null;
  active = true;
  duck(true);
  const my = ++gen;
  run(my, pieces).catch(() => finish(my));
  return true;
}
export function stop() {
  gen++;
  const cbWas = active ? endCb : null;
  active = false; endCb = null; indexCb = null;
  duck(false);
  if (current) { try { current.stop(); } catch { /* nada */ } current = null; }
  const f = bridgeDone; bridgeDone = null;
  try { synth()?.cancel(); } catch { /* nada */ }
  try { bridge()?.stopSpeaking(); } catch { /* nada */ }
  f?.();
  if (cbWas) { try { cbWas(); } catch { /* nada */ } }
}
export function speaking() { return active; }

// Algunas plataformas cargan las voces más tarde.
try { synth()?.addEventListener?.('voiceschanged', () => { voice = pickVoice(); }); } catch { /* nada */ }
