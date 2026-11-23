// La palomita escucha y repite lo que oye con voz aguda, sin tocar ningún botón (como un lorito simpático).
// Funciona con detección de voz: mientras está activa, escucha el micrófono; cuando el niño habla, graba
// (incluido el comienzo de la frase), espera a que se calle y lo repite. Mientras repite no escucha (así no se repite a sí misma).
// Todo ocurre en el dispositivo: el sonido no se guarda ni se envía a ningún lado.
//
//   available()                       → true si el navegador o la app permiten usar el micrófono
//   const L = createListener({ onState, onLevel })
//        onState('off' | 'listening' | 'hearing' | 'speaking' | 'denied')    onLevel(0..1) volumen mientras repite (para mover el pico)
//   await L.start() → true si el micrófono quedó activo     L.stop()     L.pause() / L.resume()     L.state
import { context, duck } from '../core/audio.js';

let blocked = false;

export function available() {
  try {
    if (blocked || !navigator.mediaDevices?.getUserMedia || window.isSecureContext === false) return false;
    if (!(window.AudioContext || window.webkitAudioContext)) return false;
    // Dentro de visores que no permiten el micrófono no se ofrece.
    const policy = document.permissionsPolicy || document.featurePolicy;
    if (policy?.allowsFeature && !policy.allowsFeature('microphone')) return false;
    return true;
  } catch { return false; }
}

// Ajustes de la detección (en segundos y en nivel RMS 0..1)
const FRAME = 2048;
const PREROLL = 0.45;        // cuánto audio previo se guarda para no cortar la primera sílaba
const START_HOLD = 0.12;     // voz sostenida necesaria para empezar a grabar
const END_SILENCE = 0.75;    // silencio que indica que terminó de hablar
const MAX_LEN = 6;           // largo máximo de una frase
const MIN_LEN = 0.35;        // lo más corto que se repite
const COOLDOWN = 0.45;       // pausa después de repetir antes de volver a escuchar
const PITCH = 1.5;           // voz más aguda y rapidita

export function createListener({ onState = () => {}, onLevel = () => {} } = {}) {
  let ctx = null, stream = null, src = null, proc = null, sink = null, player = null, raf = 0;
  let state = 'off', paused = false;
  let floor = 0.008, loudFor = 0, quietFor = 0, recLen = 0, cool = 0;
  let ring = [], ringLen = 0, rec = [];

  const set = s => { if (state !== s) { state = s; try { onState(s); } catch { /* nada */ } } };

  function onAudio(e) {
    const input = e.inputBuffer.getChannelData(0);
    const dt = input.length / ctx.sampleRate;
    if (paused || state === 'speaking' || state === 'off') return;
    if (cool > 0) { cool -= dt; return; }
    let sum = 0;
    for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
    const rms = Math.sqrt(sum / input.length);
    const copy = new Float32Array(input);
    const thr = Math.max(0.018, floor * 3.2);
    if (state === 'listening') {
      // Guarda los últimos instantes por si empieza a hablar.
      ring.push(copy); ringLen += dt;
      while (ringLen > PREROLL && ring.length > 1) { ringLen -= ring[0].length / ctx.sampleRate; ring.shift(); }
      if (rms > thr) {
        loudFor += dt;
        if (loudFor >= START_HOLD) { rec = ring.slice(); recLen = ringLen; ring = []; ringLen = 0; quietFor = 0; set('hearing'); }
      } else {
        loudFor = Math.max(0, loudFor - dt);
        floor = floor * 0.97 + rms * 0.03;           // se adapta al ruido de fondo
      }
    } else if (state === 'hearing') {
      rec.push(copy); recLen += dt;
      quietFor = rms > thr * 0.6 ? 0 : quietFor + dt;
      if (quietFor >= END_SILENCE || recLen >= MAX_LEN) repeat();
    }
  }

  function repeat() {
    const chunks = rec; rec = []; loudFor = 0;
    const total = chunks.reduce((n, c) => n + c.length, 0);
    // Recorta el silencio del final.
    const trim = Math.max(0, total - Math.floor(END_SILENCE * 0.8 * ctx.sampleRate));
    if (trim / ctx.sampleRate < MIN_LEN) { set('listening'); return; }
    const buf = ctx.createBuffer(1, trim, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let o = 0, peak = 0.0001;
    for (const c of chunks) { for (let i = 0; i < c.length && o < trim; i++, o++) { data[o] = c[i]; peak = Math.max(peak, Math.abs(c[i])); } }
    const gain = Math.min(6, 0.8 / peak);           // normaliza el volumen
    set('speaking');
    duck(true);
    const s = ctx.createBufferSource();
    s.buffer = buf; s.playbackRate.value = PITCH;
    const g = ctx.createGain(); g.gain.value = gain;
    const an = ctx.createAnalyser(); an.fftSize = 256;
    s.connect(g); g.connect(an); an.connect(ctx.destination);
    player = s;
    const bins = new Uint8Array(an.fftSize);
    const tickLevel = () => {
      an.getByteTimeDomainData(bins);
      let p = 0;
      for (let i = 0; i < bins.length; i++) p = Math.max(p, Math.abs(bins[i] - 128));
      try { onLevel(Math.min(1, p / 45)); } catch { /* nada */ }
      raf = requestAnimationFrame(tickLevel);
    };
    tickLevel();
    s.onended = () => {
      cancelAnimationFrame(raf); player = null;
      try { onLevel(0); } catch { /* nada */ }
      duck(false);
      cool = COOLDOWN;
      if (state === 'speaking') set(paused ? 'listening' : 'listening');
    };
    s.start();
  }

  async function start() {
    if (state !== 'off' && state !== 'denied') return true;
    ctx = context();
    if (!ctx || !available()) { set('denied'); return false; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch {
      blocked = true;
      set('denied');
      return false;
    }
    try { if (ctx.state === 'suspended') await ctx.resume(); } catch { /* nada */ }
    src = ctx.createMediaStreamSource(stream);
    proc = ctx.createScriptProcessor(FRAME, 1, 1);
    sink = ctx.createGain(); sink.gain.value = 0;       // el procesador necesita estar conectado para funcionar
    proc.onaudioprocess = onAudio;
    src.connect(proc); proc.connect(sink); sink.connect(ctx.destination);
    ring = []; ringLen = 0; rec = []; loudFor = 0; cool = 0.3;
    set('listening');
    return true;
  }

  function stop() {
    try { player?.stop(); } catch { /* nada */ }
    player = null;
    cancelAnimationFrame(raf);
    try { proc && (proc.onaudioprocess = null); src?.disconnect(); proc?.disconnect(); sink?.disconnect(); } catch { /* nada */ }
    try { stream?.getTracks().forEach(t => t.stop()); } catch { /* nada */ }
    stream = src = proc = sink = null;
    try { onLevel(0); } catch { /* nada */ }
    duck(false);
    if (state !== 'denied') set('off');
  }

  return {
    start, stop,
    pause() { paused = true; if (state === 'hearing') { rec = []; set('listening'); } },
    resume() { paused = false; cool = Math.max(cool, 0.3); },
    get state() { return state; },
    get paused() { return paused; },
  };
}
