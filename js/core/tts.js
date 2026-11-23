// Lectura en voz alta con la voz del dispositivo (si existe). Sirve para los niños que todavía leen despacio.
//   available()            → true si el navegador puede leer en voz alta
//   speak(texto | [textos], { onend })   lee en español; corta en frases para que no se interrumpa
//   stop() / speaking()
import { duck } from './audio.js';

let voice = null;
let queue = [];
let active = false;
let endCb = null;

const synth = () => (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null);
// En la app de Android la voz la pone el teléfono (TextToSpeech) por medio de un puente nativo.
const bridge = () => (typeof window !== 'undefined' && window.PalomitaAndroid ? window.PalomitaAndroid : null);
if (typeof window !== 'undefined') window.__palomitaTtsDone = () => { if (active && bridge()) finish(); };

function pickVoice() {
  const s = synth();
  if (!s) return null;
  const voices = s.getVoices().filter(v => /^es(-|_|$)/i.test(v.lang));
  if (!voices.length) return null;
  const score = v => (/(MX|US|419|CO|AR|PE|CL)/i.test(v.lang) ? 3 : 1) + (/(Google|Paulina|Mónica|Monica|Sabina|Helena|Natural)/i.test(v.name) ? 1 : 0) + (v.localService ? 0.5 : 0);
  return voices.sort((a, b) => score(b) - score(a))[0];
}

export function available() {
  const b = bridge();
  if (b) { try { return !!b.ttsAvailable(); } catch { return false; } }
  return !!synth() && typeof window.SpeechSynthesisUtterance === 'function';
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

function next() {
  const s = synth();
  if (!s || !queue.length) { finish(); return; }
  const u = new SpeechSynthesisUtterance(queue.shift());
  voice = voice || pickVoice();
  if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'es-MX';
  u.rate = 0.92; u.pitch = 1.12; u.volume = 1;
  u.onend = () => { if (active) next(); };
  u.onerror = () => finish();
  try { s.speak(u); } catch { finish(); }
}
function finish() {
  const cb = endCb;
  const was = active;
  active = false; queue = []; endCb = null;
  duck(false);
  if (was && cb) { try { cb(); } catch { /* nada */ } }
}

export function speak(text, { onend } = {}) {
  const s = synth();
  if (!available()) { onend?.(); return false; }
  stop();
  const list = (Array.isArray(text) ? text : [text]).filter(Boolean);
  // Los emojis no se leen.
  queue = list.flatMap(t => chunks(String(t).replace(/\p{Extended_Pictographic}|️|‍/gu, '')));
  if (!queue.length) { onend?.(); return false; }
  endCb = onend || null;
  active = true;
  duck(true);
  const b = bridge();
  if (b) {
    try { b.speak(JSON.stringify(queue)); queue = []; } catch { finish(); return false; }
    return true;
  }
  try { s.cancel(); } catch { /* nada */ }
  next();
  return true;
}
export function stop() {
  const s = synth();
  const cbWas = endCb;
  active = false; queue = []; endCb = null;
  duck(false);
  try { s?.cancel(); } catch { /* nada */ }
  try { bridge()?.stopSpeaking(); } catch { /* nada */ }
  if (cbWas) { try { cbWas(); } catch { /* nada */ } }
}
export function speaking() { return active; }

// Algunas plataformas cargan las voces más tarde.
try { synth()?.addEventListener?.('voiceschanged', () => { voice = pickVoice(); }); } catch { /* nada */ }
