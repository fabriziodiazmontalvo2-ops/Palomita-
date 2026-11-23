// Sonido sintetizado con Web Audio (sin archivos). Efectos cortos + una musiquita suave opcional.
//
//   unlock()            llamar en el primer toque del usuario (los navegadores lo exigen)
//   sfx(nombre, opts?)  efectos: tap, pop, coin, good, bad, win, lose, jump, flap, eat, splash, bubble, chirp, coo, sparkle,
//                       tick, drop, levelup, bell, page, whoosh, snore, sticker, grow, match, wrong, step
//   setSound(bool) / setMusic(bool) / music(on)  (la música solo suena si está permitida en ajustes)
//   setTheme(null | 'cuna' | 'navidad')  musiquita de siempre, canción de cuna (Brahms) o villancico (Noche de paz)
//   Cuando la app se va al fondo, el sonido se detiene (contexto suspendido) y vuelve al regresar.
//   tone(freq, dur, opts) para efectos a medida en un juego

let ctx = null;
let master = null, sfxBus = null, musicBus = null;
let soundOn = true, musicOn = true, musicWanted = false;
let musicTimer = 0, nextNote = 0, step = 0, theme = null;
let noiseBuf = null;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try {
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = soundOn ? 0.55 : 0; sfxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.0; musicBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  } catch { ctx = null; }
  return ctx;
}

export function unlock() {
  const c = ensure();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
  if (musicWanted) music(true);
}

export function setSound(on) {
  soundOn = !!on;
  if (sfxBus) sfxBus.gain.value = soundOn ? 0.55 : 0;
}
export function setMusic(on) {
  musicOn = !!on;
  if (!musicOn) stopMusic(); else if (musicWanted) music(true);
}

// Nota simple con envolvente.
export function tone(freq, dur = 0.15, { type = 'sine', vol = 0.5, at = 0, slide = 0, attack = 0.005, bus = null } = {}) {
  const c = ensure();
  if (!c || (!soundOn && !bus)) return;
  const t0 = c.currentTime + at;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(Math.max(20, freq), t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(bus || sfxBus);
  o.start(t0); o.stop(t0 + dur + 0.03);
}

function noise(dur = 0.2, { vol = 0.3, at = 0, freq = 1200, q = 0.8, type = 'bandpass', slide = 0 } = {}) {
  const c = ensure();
  if (!c || !soundOn) return;
  const t0 = c.currentTime + at;
  const src = c.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t0); f.Q.value = q;
  if (slide) f.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(sfxBus);
  src.start(t0); src.stop(t0 + dur + 0.03);
}

const N = { C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5, G6: 1568 };

const SFX = {
  tap: () => tone(520, 0.06, { type: 'triangle', vol: 0.25 }),
  pop: () => tone(420, 0.09, { type: 'sine', vol: 0.5, slide: 380 }),
  coin: () => { tone(N.E6, 0.07, { type: 'square', vol: 0.16 }); tone(N.G6, 0.16, { type: 'square', vol: 0.16, at: 0.07 }); },
  good: () => { tone(N.C5, 0.09, { type: 'triangle', vol: 0.4 }); tone(N.E5, 0.09, { type: 'triangle', vol: 0.4, at: 0.08 }); tone(N.G5, 0.16, { type: 'triangle', vol: 0.4, at: 0.16 }); },
  match: () => { tone(N.G5, 0.08, { type: 'triangle', vol: 0.4 }); tone(N.C6, 0.2, { type: 'triangle', vol: 0.4, at: 0.08 }); },
  bad: () => { tone(220, 0.16, { type: 'sawtooth', vol: 0.2, slide: -80 }); },
  wrong: () => { tone(196, 0.1, { type: 'square', vol: 0.14 }); tone(156, 0.18, { type: 'square', vol: 0.14, at: 0.1 }); },
  win: () => [N.C5, N.E5, N.G5, N.C6, N.G5, N.C6].forEach((f, i) => tone(f, i === 5 ? 0.45 : 0.12, { type: 'triangle', vol: 0.42, at: i * 0.11 })),
  lose: () => [N.G4, N.E4, N.C4].forEach((f, i) => tone(f, 0.22, { type: 'triangle', vol: 0.35, at: i * 0.18 })),
  levelup: () => [N.C5, N.D5, N.E5, N.G5, N.A5, N.C6].forEach((f, i) => tone(f, 0.14, { type: 'triangle', vol: 0.4, at: i * 0.08 })),
  sticker: () => { [N.E5, N.G5, N.C6, N.E6].forEach((f, i) => tone(f, 0.18, { type: 'sine', vol: 0.4, at: i * 0.09 })); },
  jump: () => tone(300, 0.16, { type: 'sine', vol: 0.4, slide: 420 }),
  flap: () => noise(0.09, { vol: 0.22, freq: 700, q: 0.6, slide: -400 }),
  whoosh: () => noise(0.25, { vol: 0.2, freq: 500, q: 0.5, slide: 1800 }),
  eat: () => { noise(0.06, { vol: 0.3, freq: 900 }); noise(0.06, { vol: 0.3, freq: 700, at: 0.14 }); noise(0.06, { vol: 0.3, freq: 800, at: 0.28 }); },
  splash: () => noise(0.35, { vol: 0.35, freq: 1800, q: 0.4, slide: -1200 }),
  bubble: () => tone(500 + Math.random() * 500, 0.08, { type: 'sine', vol: 0.3, slide: 300 }),
  chirp: () => { tone(1500, 0.07, { type: 'sine', vol: 0.3, slide: 700 }); tone(1900, 0.09, { type: 'sine', vol: 0.3, at: 0.1, slide: 500 }); },
  coo: () => { tone(330, 0.22, { type: 'sine', vol: 0.4, slide: 60 }); tone(300, 0.3, { type: 'sine', vol: 0.4, at: 0.24, slide: -50 }); },
  sparkle: () => [N.C6, N.E6, N.G6].forEach((f, i) => tone(f, 0.14, { type: 'sine', vol: 0.22, at: i * 0.05 })),
  tick: () => tone(900, 0.03, { type: 'square', vol: 0.12 }),
  drop: () => tone(520, 0.14, { type: 'sine', vol: 0.35, slide: -300 }),
  grow: () => tone(260, 0.3, { type: 'triangle', vol: 0.3, slide: 400 }),
  step: () => noise(0.04, { vol: 0.14, freq: 400, q: 1 }),
  bell: () => { tone(N.C6, 0.9, { type: 'sine', vol: 0.3 }); tone(N.C6 * 2.01, 0.6, { type: 'sine', vol: 0.08 }); tone(N.G5, 1.0, { type: 'sine', vol: 0.15, at: 0.02 }); },
  page: () => noise(0.14, { vol: 0.14, freq: 2500, q: 0.4, slide: -1500 }),
  snore: () => noise(0.5, { vol: 0.12, freq: 180, q: 2, slide: 80 }),
  shutter: () => { noise(0.05, { vol: 0.35, freq: 3000, q: 0.5 }); noise(0.07, { vol: 0.3, freq: 1800, q: 0.6, at: 0.09 }); },
};

export function sfx(name) {
  if (!soundOn) return;
  const f = SFX[name];
  if (!f) return;
  try { f(); } catch { /* sin sonido */ }
}

// Musiquita: arpegio pentatónico suave, generado sobre la marcha.
const SCALE = [N.C4, N.D4, N.E4, N.G4, N.A4, N.C5, N.D5, N.E5, N.G5, N.A5];
const PATTERN = [0, 2, 4, 5, 4, 2, 3, 5, 7, 5, 4, 2, 1, 3, 4, 2];
const BASS = [N.C4 / 2, N.A4 / 4, N.F4 / 2, N.G4 / 2];

// Melodías de dominio público: [nota, duración en tiempos]. null = silencio.
const NOTE = { ...N, B4: 493.88, D4: 293.66, F4: 349.23, F5: 698.46, E5: 659.25, D5: 587.33, C4: 261.63 };
const TUNES = {
  // Canción de cuna (Wiegenlied), Johannes Brahms, 1868.
  cuna: { beat: 0.62, vol: 0.11, notes: [
    ['E4', 0.5], ['E4', 0.5], ['G4', 2], ['E4', 0.5], ['E4', 0.5], ['G4', 2], ['E4', 0.5], ['G4', 0.5], ['C5', 1], ['B4', 1.5], ['A4', 0.5], ['A4', 1], ['G4', 1],
    ['D4', 0.5], ['E4', 0.5], ['F4', 1], ['D4', 1], ['D4', 0.5], ['E4', 0.5], ['F4', 2], ['D4', 0.5], ['F4', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 1], ['B4', 1], ['C5', 3], [null, 2]] },
  // Noche de paz (Stille Nacht), Franz Xaver Gruber, 1818.
  navidad: { beat: 0.27, vol: 0.12, notes: [
    ['G4', 3], ['A4', 1], ['G4', 2], ['E4', 6], ['G4', 3], ['A4', 1], ['G4', 2], ['E4', 6],
    ['D5', 4], ['D5', 2], ['B4', 6], ['C5', 4], ['C5', 2], ['G4', 6],
    ['A4', 4], ['A4', 2], ['C5', 3], ['B4', 1], ['A4', 2], ['G4', 3], ['A4', 1], ['G4', 2], ['E4', 6],
    ['A4', 4], ['A4', 2], ['C5', 3], ['B4', 1], ['A4', 2], ['G4', 3], ['A4', 1], ['G4', 2], ['E4', 6],
    ['D5', 4], ['D5', 2], ['F5', 3], ['D5', 1], ['B4', 2], ['C5', 6], ['E5', 6],
    ['C5', 3], ['G4', 1], ['E4', 2], ['G4', 3], ['F4', 1], ['D4', 2], ['C4', 10], [null, 6]] },
};
const BASS_OF = { C: N.C4 / 2, D: N.D4 / 2, E: N.E4 / 2, F: N.F4 / 2, G: N.G4 / 2, A: N.A4 / 2, B: N.G4 / 2 };

function scheduleTune(t) {
  while (nextNote < ctx.currentTime + 0.5) {
    const [n, d] = t.notes[step % t.notes.length];
    const at = Math.max(0, nextNote - ctx.currentTime);
    const dur = d * t.beat;
    if (n) {
      tone(NOTE[n], Math.min(2.4, dur * 1.05 + 0.15), { type: 'sine', vol: t.vol, at, attack: 0.03, bus: musicBus });
      if (d >= 2) tone(BASS_OF[n[0]] || N.C4 / 2, Math.min(2.6, dur), { type: 'triangle', vol: t.vol * 0.55, at, attack: 0.06, bus: musicBus });
    }
    nextNote += dur;
    step++;
  }
}

function scheduleMusic() {
  if (!ctx || !musicWanted || !musicOn) return;
  if (theme && TUNES[theme]) { scheduleTune(TUNES[theme]); return; }
  while (nextNote < ctx.currentTime + 0.4) {
    const at = Math.max(0, nextNote - ctx.currentTime);
    const idx = PATTERN[step % PATTERN.length];
    const lift = Math.floor(step / 32) % 2 ? 1 : 0;
    tone(SCALE[Math.min(SCALE.length - 1, idx + lift)], 0.5, { type: 'sine', vol: 0.12, at, attack: 0.02, bus: musicBus });
    if (step % 4 === 0) tone(BASS[Math.floor(step / 8) % BASS.length], 1.3, { type: 'triangle', vol: 0.1, at, attack: 0.04, bus: musicBus });
    nextNote += 0.34;
    step++;
  }
}
export function music(on) {
  musicWanted = !!on;
  const c = ensure();
  if (!c) return;
  if (musicWanted && musicOn) {
    if (!musicTimer) {
      nextNote = c.currentTime + 0.1;
      musicBus.gain.cancelScheduledValues(c.currentTime);
      musicBus.gain.setTargetAtTime(0.5, c.currentTime, 0.6);
      musicTimer = setInterval(scheduleMusic, 120);
    }
  } else stopMusic();
}
function stopMusic() {
  if (musicTimer) { clearInterval(musicTimer); musicTimer = 0; }
  if (ctx && musicBus) musicBus.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.2);
}
// Cambia la musiquita (empieza desde el principio de la melodía).
export function setTheme(name) {
  const t = name && TUNES[name] ? name : null;
  if (t === theme) return;
  theme = t;
  step = 0;
  if (ctx && musicTimer) nextNote = ctx.currentTime + 0.4;
}
export function currentTheme() { return theme; }

// En segundo plano no suena nada (ni gasta batería); al volver, sigue la música si estaba encendida.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) {
      if (musicTimer) { clearInterval(musicTimer); musicTimer = 0; }
      try { ctx.suspend().catch(() => {}); } catch { /* nada */ }
    } else {
      try { ctx.resume().catch(() => {}); } catch { /* nada */ }
      if (musicWanted && musicOn) music(true);
    }
  });
}
// Baja la música mientras suena la voz o un juego.
export function duck(on) {
  if (ctx && musicBus && musicTimer) musicBus.gain.setTargetAtTime(on ? 0.15 : 0.5, ctx.currentTime, 0.3);
}
export function context() { return ensure(); }
