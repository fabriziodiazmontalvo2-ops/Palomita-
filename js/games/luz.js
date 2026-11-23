// Enciende la luz (La luz del mundo, Mateo 5, 14-16) — trivia bíblica y de catequesis en 100 niveles.
//
// Arriba, una ciudad sobre un monte, de noche. Cada respuesta correcta enciende una velita y una ventana, y el cielo
// se va aclarando. La pregunta y sus respuestas van en HTML (api.overlay) para que el texto se lea cómodo.
//
// Niveles (api.difficulty 0 → 1): la meta (respuestas correctas) sube de 5 a 25 y las preguntas pasan de fáciles
// (nivel 1 del banco) a «de experto» (nivel 3). Cada ~10 niveles aparece algo nuevo (ver NOVEDADES y features()):
//    1  Otra oportunidad (hasta el 5): si fallas, vuelves a intentarlo sin perder corazón.
//    6  La lámpara de ayuda 💡: quita una respuesta equivocada (3 usos → 1).
//   12  Racha de luz: 4 aciertos seguidos (5 desde el 70, 6 desde el 90) te devuelven un corazón (y llega una luciérnaga).
//   20  Atardecer y el candelero (Mateo 5, 15) + rondas temáticas (La Misa, Oraciones, Vida de Jesús…).
//   30  La vela dorada ✨: pregunta de experto que vale 2 velitas.
//   40  Reloj suave por pregunta: si respondes rápido ganas ⭐ (una estrella extra al final).
//   50  Medianoche y las lámparas de aceite (Mateo 25, 1-13) + la jarrita de aceite 🏺 (te da una 💡).
//   60  El viento 🍃: si se acaba el reloj, se apaga la velita (cuenta como error).
//   70  La Vigilia pascual (el cirio) + la ronda relámpago ⚡ (preguntas cortas que valen 2).
//   80  La palomita del Espíritu Santo 🕊️ cruza el cielo: si la tocas, te trae una 💡.
//   90  El amanecer: «Ustedes son la luz del mundo». Todo junto: el gran final.
//
// El banco de preguntas junta la trivia (../data/trivia.js) con los cuestionarios de catequesis, de la Biblia y de las
// parábolas (cada import() tiene respaldo: si un archivo falla, se sigue con los demás). Nunca se repite una pregunta
// en la misma partida y, entre partidas, se prefieren las que no salieron hace poco.
const FALLBACK = [
  { q: '¿Quién creó el cielo y la tierra?', options: ['Noé', 'Dios', 'Moisés'], answer: 1, explain: 'En el principio, Dios creó el cielo y la tierra (Génesis 1, 1).', level: 1 },
  { q: '¿En qué pueblo nació Jesús?', options: ['Belén', 'Nazaret', 'Jerusalén'], answer: 0, explain: 'Jesús nació en Belén (Lucas 2, 4-7).', level: 1 },
  { q: '¿Cómo se llama la mamá de Jesús?', options: ['Marta', 'Isabel', 'María'], answer: 2, explain: 'La Virgen María es la Madre de Jesús y nuestra Madre del cielo.', level: 1 },
  { q: '¿Qué oración nos enseñó Jesús?', options: ['El Padre Nuestro', 'La Salve', 'El Credo'], answer: 0, explain: 'Jesús enseñó el Padre Nuestro a sus discípulos (Mateo 6, 9-13).', level: 1 },
  { q: '¿Quién construyó un arca muy grande?', options: ['David', 'Noé', 'Abraham'], answer: 1, explain: 'Noé obedeció a Dios y construyó el arca (Génesis 6).', level: 1 },
  { q: '¿A quién recibimos en la Primera Comunión?', options: ['A un ángel', 'A san Pedro', 'A Jesús'], answer: 2, explain: 'En la Comunión recibimos a Jesús, realmente presente en la Eucaristía.', level: 1 },
  { q: '¿Quién bautizó a Jesús en el río Jordán?', options: ['Juan el Bautista', 'Pedro', 'Moisés'], answer: 0, explain: 'Juan bautizó a Jesús en el Jordán (Mateo 3, 13-17).', level: 2 },
  { q: '¿Cuántos apóstoles eligió Jesús?', options: ['Siete', 'Doce', 'Diez'], answer: 1, explain: 'Jesús eligió a doce apóstoles (Marcos 3, 14).', level: 2 },
  { q: '¿Qué mar abrió Dios para que pasara su pueblo?', options: ['El Mar Muerto', 'El mar de Galilea', 'El Mar Rojo'], answer: 2, explain: 'Dios abrió un camino en el Mar Rojo (Éxodo 14).', level: 2 },
  { q: '¿Qué día resucitó Jesús?', options: ['El domingo', 'El viernes', 'El lunes'], answer: 0, explain: 'Jesús resucitó el domingo, el día del Señor.', level: 2 },
];

// Cartelito del nivel en el que aparece algo nuevo.
const NOVEDADES = {
  1: 'Responde bien y enciende una velita 🕯️',
  6: '¡Nuevo: la lámpara 💡! Quita una respuesta equivocada',
  12: '¡Nuevo: racha de luz! 4 aciertos seguidos te dan un ❤️',
  20: '¡Nuevo: el candelero y las rondas por temas!',
  30: '¡Nuevo: la vela dorada ✨ vale 2 velitas!',
  40: '¡Nuevo: responde rápido y gana estrellas ⭐!',
  50: '¡Nuevo: medianoche y la jarrita de aceite 🏺!',
  60: '¡Nuevo: el viento 🍃! Responde antes de que se acabe el reloj',
  70: '¡Nuevo: la Vigilia pascual y la ronda relámpago ⚡!',
  80: '¡Nuevo: toca a la palomita 🕊️ y te trae una ayuda!',
  90: '¡Gran final: «Ustedes son la luz del mundo»! ☀️',
};

const TOPIC_ICON = {
  'Antiguo Testamento': '📜', 'Vida de Jesús': '✝️', 'Parábolas': '🌾', 'Oraciones': '🙏', 'Sacramentos': '🕊️',
  'La Misa': '⛪', 'María y los santos': '🌹', 'Lo que creemos': '☀️', 'Vivir como Jesús': '❤️', 'Milagros de Jesús': '🙌',
  'Historias de la Biblia': '📖',
};
const UNIT_TOPIC = { creo: 'Lo que creemos', celebro: 'Sacramentos', vivo: 'Vivir como Jesús', rezo: 'Oraciones' };
const SHORT = 72;             // largo máximo (pregunta + opción más larga) de una pregunta «corta» (ronda relámpago)

// Mezcla de dificultad de preguntas [nivel 1, nivel 2, nivel 3] según api.difficulty (puntos clave, interpolados).
const MIX = [
  [0, [1, 0, 0]], [0.05, [1, 0, 0]], [0.12, [0.7, 0.3, 0]], [0.3, [0.3, 0.55, 0.15]],
  [0.5, [0.1, 0.5, 0.4]], [0.75, [0, 0.35, 0.65]], [1, [0, 0.2, 0.8]],
];

// ── Banco de preguntas (se carga una vez y queda en memoria) ──
let BANK = null;
const RECENT = [], RECENT_SET = new Set();   // preguntas de partidas anteriores (para no repetirlas pronto)

function prep(q, level, topic) {
  if (!q || typeof q.q !== 'string' || !Array.isArray(q.options) || q.options.length < 2) return null;
  if (!(q.answer >= 0 && q.answer < q.options.length)) return null;
  const opts = q.options.map(String);
  return {
    q: q.q, options: opts, answer: q.answer, explain: q.explain || '', level, topic: topic || q.topic || 'Historias de la Biblia',
    len: q.q.length + Math.max(...opts.map(o => o.length)),
    chars: q.q.length + opts.reduce((a, o) => a + o.length, 0),
  };
}
// Nivel de las preguntas: el nivel 1 (niveles 1–5 del juego, casi tutorial) sale solo de la trivia, que ya viene graduada.
// Catequesis → 2. Historias: la primera de cada cuestionario (la idea principal) → 2; las de detalle → 3.
function fromCatechism(list) {
  return (Array.isArray(list) ? list : []).flatMap(t => (t.quiz || []).map(q => prep(q, 2, UNIT_TOPIC[t.unit] || 'Lo que creemos')));
}
function fromStories(list, topic) {
  return (Array.isArray(list) ? list : []).flatMap(s => (s.quiz || []).map((q, i) => prep(q, i === 0 ? 2 : 3, topic)));
}
function loadBank() {
  if (BANK) return BANK;
  const get = (load, read) => load().then(read).catch(() => []);
  BANK = Promise.all([
    get(() => import('../data/trivia.js'), m => (m.TRIVIA || []).map(q => prep(q, [1, 2, 3].includes(q.level) ? q.level : 2, q.topic))),
    get(() => import('../data/catechism.js'), m => fromCatechism(m.CATECHISM)),
    get(() => import('../data/lessons.js'), m => fromCatechism(m.LESSONS)),
    get(() => import('../data/bible-at.js'), m => fromStories(m.STORIES_AT, 'Antiguo Testamento')),
    get(() => import('../data/bible-nt.js'), m => fromStories(m.STORIES_NT, 'Vida de Jesús')),
    get(() => import('../data/bible-milagros.js'), m => fromStories(m.STORIES_MILAGROS, 'Milagros de Jesús')),
    get(() => import('../data/parables.js'), m => Object.values(m.PARABLES || {}).flatMap(p => (p.quiz || [])
      .map((q, i) => prep(q, i === 0 ? 2 : 3, p.kind === 'historia' ? 'Historias de la Biblia' : 'Parábolas')))),
  ]).then(lists => {
    const seen = new Set(), out = [];
    for (const q of lists.flat()) {
      if (!q) continue;
      const key = q.q.toLowerCase().replace(/[^a-záéíóúñü0-9]/g, '');
      if (seen.has(key)) continue;
      seen.add(key); q.key = key; out.push(q);
    }
    if (out.length < 10) return FALLBACK.map(q => { const p = prep(q, q.level, 'Historias de la Biblia'); p.key = p.q; return p; });
    return out;
  });
  return BANK;
}
function remember(key) {
  if (RECENT_SET.has(key)) return;
  RECENT.push(key); RECENT_SET.add(key);
  while (RECENT.length > 160) RECENT_SET.delete(RECENT.shift());
}

// Qué trae cada nivel.
function features(lv) {
  return {
    retry: lv <= 5,                                          // otra oportunidad sin perder corazón
    lamp: lv < 6 ? 0 : lv < 20 ? 3 : lv < 50 ? 2 : 1,        // usos de la lámpara de ayuda
    streak: lv < 12 ? 0 : lv < 70 ? 4 : lv < 90 ? 5 : 6,     // aciertos seguidos para recuperar un corazón
    rounds: lv >= 20,                                        // rondas temáticas
    roundLen: lv >= 60 ? 5 : 4,
    golden: lv < 30 ? 0 : Math.round(5 - 2 * Math.min(1, (lv - 30) / 60)),   // cada cuántas preguntas sale la vela dorada
    timer: lv >= 40,                                         // reloj suave por pregunta
    oil: lv >= 50,                                           // jarrita de aceite
    wind: lv >= 60,                                          // si se acaba el reloj, cuenta como error
    flash: lv < 70 ? 0 : lv < 90 ? 3 : 2,                    // cada cuántas rondas hay una ronda relámpago
    dove: lv >= 80,                                          // la palomita del Espíritu Santo
    scene: lv < 20 ? 'monte' : lv < 50 ? 'candelero' : lv < 70 ? 'aceite' : lv < 90 ? 'pascua' : 'alba',
  };
}

const CSS = `
.luz-panel { position: absolute; left: var(--gutter-l); right: var(--gutter-r); bottom: calc(var(--safe-b) + 10px); max-height: 60%; overflow-y: auto; pointer-events: auto;
  display: flex; flex-direction: column; gap: 9px; padding: 14px; background: var(--paper); border-radius: 22px; box-shadow: 0 6px 0 var(--paper-edge), 0 14px 30px rgba(20, 15, 50, 0.45); }
.luz-panel.is-gold { background: #fff5d4; box-shadow: 0 0 0 3px #f5c542, 0 6px 0 #d9a520, 0 14px 30px rgba(20, 15, 50, 0.45); }
.luz-panel.is-flash { background: #eef6ff; box-shadow: 0 0 0 3px #7cc8f5, 0 6px 0 #4aa3e0, 0 14px 30px rgba(20, 15, 50, 0.45); }
.luz-panel.is-oil { background: #fbf0e2; box-shadow: 0 0 0 3px #d9a36a, 0 6px 0 #b8794a, 0 14px 30px rgba(20, 15, 50, 0.45); }
.luz-top { display: flex; align-items: center; gap: 8px; }
.luz-tag { flex: 1; font-family: var(--font-display); font-weight: 700; font-size: 0.8rem; line-height: 1.2; letter-spacing: 0.04em; text-transform: uppercase; color: var(--ink-soft); }
.luz-say, .luz-lamp { appearance: none; border: 0; cursor: pointer; flex: none; height: 44px; border-radius: 22px; font-size: 1.2rem; }
.luz-say { width: 44px; background: var(--sky-deep); color: #fff; box-shadow: 0 3px 0 #2f7fb8; }
.luz-lamp { min-width: 58px; padding: 0 10px; background: var(--sun); color: var(--ink); box-shadow: 0 3px 0 var(--sun-deep);
  font-family: var(--font-display); font-weight: 800; display: inline-flex; align-items: center; justify-content: center; gap: 3px; }
.luz-lamp small { font-size: 0.95rem; }
.luz-lamp:disabled { cursor: default; opacity: 0.45; }
.luz-clock { position: relative; height: 12px; border-radius: 99px; background: rgba(61, 43, 36, 0.14); overflow: hidden; }
.luz-clock > i { position: absolute; left: 0; top: 0; bottom: 0; width: 100%; border-radius: 99px; background: var(--sun); transform-origin: left center; }
.luz-clock.is-late > i { background: var(--sky-deep); }
.luz-clock.is-out > i { background: transparent; }
.luz-q { font-family: var(--font-display); font-weight: 800; font-size: 1.22rem; line-height: 1.2; color: var(--ink); }
.luz-opts { display: flex; flex-direction: column; gap: 8px; }
.luz-opt { appearance: none; border: 0; cursor: pointer; text-align: left; min-height: 50px; padding: 8px 14px; border-radius: 16px; background: var(--white); color: var(--ink);
  font-family: var(--font-body); font-weight: 800; font-size: 1.06rem; line-height: 1.2; box-shadow: 0 4px 0 var(--paper-edge); }
.luz-opt:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--paper-edge); }
.luz-opt:focus-visible, .luz-say:focus-visible, .luz-lamp:focus-visible { outline: 3px solid var(--ink); outline-offset: 2px; }
.luz-opt:disabled { cursor: default; opacity: 0.6; }
.luz-opt.is-off { opacity: 0.3; text-decoration: line-through; }
.luz-opt.is-right { background: #dff5dc; box-shadow: 0 4px 0 var(--leaf); opacity: 1; }
.luz-opt.is-wrong { background: #ffe4dc; box-shadow: 0 4px 0 var(--coral); opacity: 1; }
.luz-fb { display: flex; flex-direction: column; gap: 8px; }
.luz-fb p { font-size: 1.02rem; font-weight: 700; line-height: 1.3; color: var(--ink); }
.luz-fb b { font-family: var(--font-display); font-size: 1.12rem; }
`;

export default {
  id: 'luz',
  // Meta: respuestas correctas (la vela dorada y la ronda relámpago valen 2). Vidas: 3 (las administra el motor).
  levels: {
    goal: [5, 25],
    curve: 1.15,
    lives: 3,
    selfEnd: true,          // al llegar a la meta, la ciudad se enciende entera y luego termina el nivel
    goalLabel: n => `Enciende ${n} velitas`,
  },
  create(api) {
    const { kit } = api;
    const { PAL, clamp, lerp } = kit;
    const W = api.W;
    const lv = api.level, dif = api.difficulty;
    const F = features(lv);
    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

    let t = 0, glow = 0, dead = false, tts = null, shown = 0;
    let mode = 'loading';            // loading | question | feedback | celebrate | over
    let bank = [], byLevel = { 1: [], 2: [], 3: [] };
    const used = new Set();
    let current = null, order = [], rightPos = -1, buttons = [], asked = 0;
    let lamp = F.lamp, lampUsedNow = false, streak = 0, hearts = 0;
    let round = null, roundNo = 0, lastTopic = null;
    let qTime = 0, qLimit = 0, quickHits = 0, timed = 0, clockShown = -1, clockState = '';
    let goalReached = false, celebT = 0, ended = false;
    const candleKind = [];           // 'gold' | 'flash' por velita encendida
    const flies = [];                // luciérnagas de las rachas
    const dove = { on: false, x: 0, y: 0, vx: 0, wait: 0, next: 14, got: 0 };
    const houses = Array.from({ length: 9 }, (_, i) => ({ x: 28 + i * 38, w: api.randRange(26, 34), h: api.randRange(26, 46), roof: i % 3, lift: Math.sin((i / 8) * Math.PI) * 26 }));

    // ── Panel HTML ──
    const style = el('style'); style.textContent = CSS;
    const tag = el('span', 'luz-tag', `Nivel ${lv}`);
    const say = el('button', 'luz-say', '🔊'); say.type = 'button'; say.hidden = true; say.setAttribute('aria-label', 'Leer la pregunta en voz alta');
    const lampBtn = el('button', 'luz-lamp'); lampBtn.type = 'button'; lampBtn.hidden = !F.lamp;
    lampBtn.setAttribute('aria-label', 'Lámpara de ayuda: quita una respuesta equivocada');
    const lampN = el('small', '', '');
    lampBtn.append(el('span', '', '💡'), lampN);
    const clock = el('div', 'luz-clock'); clock.hidden = true; clock.setAttribute('aria-hidden', 'true');
    const clockBar = el('i'); clock.append(clockBar);
    const qEl = el('p', 'luz-q', 'Preparando las preguntas…');
    const opts = el('div', 'luz-opts');
    const fb = el('div', 'luz-fb'); fb.hidden = true;
    const top = el('div', 'luz-top'); top.append(tag, lampBtn, say);
    const panel = el('div', 'luz-panel'); panel.append(top, clock, qEl, opts, fb);
    api.overlay.append(style, panel);
    say.addEventListener('click', () => { if (tts && current) { api.sfx('tap'); tts.speak([current.q, ...order.map(i => current.options[i])]); } });
    lampBtn.addEventListener('click', () => useLamp());
    renderLamp();

    if (NOVEDADES[lv]) api.hint(NOVEDADES[lv], 3400);

    // ── Preguntas ──
    function mixFor(d) {
      for (let i = 1; i < MIX.length; i++) {
        const [d1, w1] = MIX[i];
        if (d <= d1) { const [d0, w0] = MIX[i - 1]; const k = (d - d0) / (d1 - d0 || 1); return w0.map((w, j) => lerp(w, w1[j], k)); }
      }
      return MIX[MIX.length - 1][1];
    }
    const weights = mixFor(dif);
    function rollLevel() {
      let r = api.rand() * (weights[0] + weights[1] + weights[2]);
      for (let l = 0; l < 3; l++) { r -= weights[l]; if (r <= 0 && weights[l] > 0) return l + 1; }
      return weights[2] > 0 ? 3 : weights[1] > 0 ? 2 : 1;
    }
    function choose(level, topic, short) {
      const ord = level === 1 ? [1, 2, 3] : level === 2 ? [2, 1, 3] : [3, 2, 1];
      const tries = [
        q => (!topic || q.topic === topic) && (!short || q.len <= SHORT),
        q => !short || q.len <= SHORT,
        () => true,
      ];
      for (const ok of tries) {
        for (const l of ord) {
          const c = byLevel[l].filter(q => !used.has(q.key) && ok(q));
          if (!c.length) continue;
          const fresh = c.filter(q => !RECENT_SET.has(q.key));
          return api.pick(fresh.length ? fresh : c);
        }
      }
      used.clear();                         // (solo con un banco diminuto) se vuelve a empezar
      return api.pick(bank);
    }
    // Una ronda: temática (4–5 preguntas de un mismo tema) o relámpago (3 preguntas cortas que valen 2).
    function newRound() {
      roundNo++;
      if (F.flash && roundNo % F.flash === 0) {
        round = { flash: true, topic: null, len: 3, left: 3 };
        api.hint('⚡ ¡Ronda relámpago! Cada acierto vale 2', 2200);
        return;
      }
      const okLevel = q => weights[q.level - 1] > 0 && !used.has(q.key);
      const count = {};
      for (const q of bank) if (okLevel(q)) count[q.topic] = (count[q.topic] || 0) + 1;
      let topics = Object.keys(count).filter(k => count[k] >= F.roundLen && k !== lastTopic);
      if (!topics.length) topics = Object.keys(count);
      const topic = topics.length ? api.pick(topics.sort()) : null;
      lastTopic = topic;
      round = { flash: false, topic, len: F.roundLen, left: F.roundLen };
      if (topic && roundNo > 1) api.hint(`${TOPIC_ICON[topic] || '📖'} Ronda: ${topic}`, 1600);
    }

    function show() {
      if (dead || mode === 'over' || mode === 'celebrate') return;
      tts?.stop();
      if (F.rounds && (!round || round.left <= 0)) newRound();
      // ¿pregunta especial?
      let special = null;
      if (!(round && round.flash)) {
        if (F.golden && asked % F.golden === F.golden - 1) special = 'gold';
        else if (F.oil && asked % 6 === 2 && lamp < 3) special = 'oil';
      }
      const level = special === 'gold' ? 3 : rollLevel();
      current = choose(level, round && !round.flash ? round.topic : null, !!(round && round.flash));
      current = { ...current, special, flash: !!(round && round.flash) };
      used.add(current.key); remember(current.key);
      if (round) round.left--;
      asked++;
      mode = 'question'; lampUsedNow = false;
      // Se barajan las opciones cuidando cuál es la correcta.
      order = api.shuffle(current.options.map((_, i) => i));
      rightPos = order.indexOf(current.answer);
      // Etiqueta y estilo del panel
      let label;
      if (current.special === 'gold') label = '✨ Vela dorada · vale 2';
      else if (current.flash) label = `⚡ Relámpago ${round.len - round.left}/${round.len} · vale 2`;
      else if (current.special === 'oil') label = '🏺 Jarrita de aceite · gana una 💡';
      else if (round && round.topic) label = `${TOPIC_ICON[round.topic] || '📖'} ${round.topic} · ${round.len - round.left}/${round.len}`;
      else label = current.topic ? `${current.topic} · pregunta ${asked}` : `Pregunta ${asked}`;
      tag.textContent = label;
      panel.classList.toggle('is-gold', current.special === 'gold');
      panel.classList.toggle('is-oil', current.special === 'oil');
      panel.classList.toggle('is-flash', current.flash);
      qEl.textContent = current.q;
      opts.replaceChildren(); fb.replaceChildren(); fb.hidden = true;
      buttons = order.map((idx, pos) => {
        const b = el('button', 'luz-opt', current.options[idx]); b.type = 'button';
        b.addEventListener('click', () => answer(pos));
        opts.append(b);
        return b;
      });
      // Reloj suave: más tiempo para preguntas largas (los niños leen despacio).
      qTime = 0; clockShown = -1; clockState = '';
      if (F.timer) {
        const e = clamp((lv - 40) / 60);
        qLimit = lerp(20, 12, e) + current.chars * lerp(0.13, 0.09, e);
        if (current.flash) qLimit = Math.max(9, qLimit * 0.55);
        clock.hidden = false; clock.className = 'luz-clock'; renderClock();
      }
      renderLamp();
      panel.scrollTop = 0;
    }

    function useLamp() {
      if (mode !== 'question' || lamp <= 0 || lampUsedNow) return;
      const wrong = buttons.map((b, i) => i).filter(i => i !== rightPos && !buttons[i].disabled);
      if (wrong.length < 2) return;          // siempre quedan al menos dos opciones
      const i = api.pick(wrong);
      buttons[i].disabled = true; buttons[i].classList.add('is-off');
      lamp--; lampUsedNow = true;
      api.sfx('sparkle');
      renderLamp();
    }
    function renderLamp() {
      if (!F.lamp) return;
      lampN.textContent = `×${lamp}`;
      lampBtn.disabled = mode !== 'question' || lamp <= 0 || lampUsedNow;
    }

    function answer(pos) {
      if (mode !== 'question' || dead) return;
      const b = buttons[pos];
      if (!b || b.disabled) return;
      const ok = pos === rightPos;
      if (!ok && F.retry) {
        // Niveles 1–5: otra oportunidad sin perder corazón.
        b.disabled = true; b.classList.add('is-wrong');
        api.sfx('wrong');
        streak = 0;
        fb.replaceChildren(el('p', '', '¡Casi! Piensa otra vez y elige otra respuesta 💪'));
        fb.hidden = false;
        return;
      }
      resolve(ok, pos, false);
    }
    function resolve(ok, pos, timeout) {
      mode = 'feedback';
      tts?.stop();
      buttons.forEach((b, i) => { b.disabled = true; if (i === rightPos) b.classList.add('is-right'); else if (i === pos) b.classList.add('is-wrong'); });
      renderLamp();
      fb.replaceChildren();
      const extra = [];
      if (ok) {
        const pts = current.special === 'gold' || current.flash ? 2 : 1;
        const quick = F.timer && qTime <= qLimit * 0.5;
        if (F.timer) { timed++; if (quick) quickHits++; }
        const first = api.score;
        for (let i = 0; i < pts; i++) candleKind[first + i] = current.special === 'gold' ? 'gold' : current.flash ? 'flash' : '';
        glow = 1; api.sfx('good');
        api.addScore(pts);                     // (al llegar a la meta el motor solo lo celebra: selfEnd)
        for (let i = 0; i < pts; i++) { const c = candlePos(first + i); if (c) api.burst(c.x, c.y - 26, { color: current.special === 'gold' ? '#ffe27a' : PAL.sun, count: 10, speed: 80 }); }
        if (quick) { const c = candlePos(first); if (c) api.floatText(clamp(c.x, 56, W - 56), c.y - 52, '⭐ ¡Rápido!', { color: '#fff3b0', size: 16 }); }
        if (current.special === 'oil') { lamp = Math.min(3, lamp + 1); extra.push('🏺 ¡Aceite para tu lámpara! +1 💡'); renderLamp(); }
        if (pts > 1) extra.push(current.flash ? '⚡ ¡Vale 2 velitas!' : '✨ ¡La vela dorada vale 2!');
        streak++;
        if (F.streak && streak % F.streak === 0) {
          if (flies.length < 10) flies.push({ x: api.randRange(30, W - 30), y: api.randRange(api.top + 20, L.baseY - 40), ph: api.rand() * 6.28 });
          if (api.lives < 3) { api.addLife(); hearts++; extra.push('❤️ ¡Racha de luz! Recuperas un corazón'); }
          else extra.push('✨ ¡Racha de luz! Llega una luciérnaga');
        }
        if (api.score >= api.goal) goalReached = true;
      } else {
        streak = 0;
        api.sfx('wrong');
        if (F.timer) timed++;
        const left = api.loseLife();
        if (left <= 0) {
          mode = 'over';
          const p = el('p'); p.append(el('b', '', timeout ? '🍃 Se acabó el tiempo…' : 'Casi… mira la respuesta en verde.'));
          fb.append(p);
          if (current.explain) fb.append(el('p', '', current.explain));
          fb.hidden = false; panel.scrollTop = panel.scrollHeight;
          return;
        }
      }
      const title = ok ? (goalReached ? '¡Lo lograste! La ciudad está llena de luz 🌟' : '¡Muy bien! Encendiste una velita 🕯️')
        : timeout ? '🍃 ¡Se acabó el tiempo! El viento apagó la velita.' : 'Casi… mira la respuesta en verde.';
      const p = el('p'); p.append(el('b', '', title));
      fb.append(p);
      for (const x of extra) fb.append(el('p', '', x));
      if (current.explain) fb.append(el('p', '', current.explain));
      const nextBtn = el('button', 'btn btn--sm btn--sun luz-next', goalReached ? '🎉 ¡Ver la ciudad encendida!' : 'Siguiente'); nextBtn.type = 'button';
      nextBtn.addEventListener('click', () => { if (mode !== 'feedback') return; api.sfx('tap'); if (goalReached) celebrate(); else show(); });
      fb.append(nextBtn);
      fb.hidden = false;
      clock.hidden = true;
      panel.scrollTop = panel.scrollHeight;
    }

    function celebrate() {
      mode = 'celebrate'; celebT = 0;
      tts?.stop();
      panel.hidden = true;
      api.sfx('bell');
      api.hint('«Ustedes son la luz del mundo» (Mateo 5, 14)', 2400);
      for (let i = 0; i < 5; i++) api.burst(W * (0.1 + 0.2 * i), L.candleY - 40, { emoji: ['✨', '🕯️', '⭐', '✨', '🌟'][i], count: 3, speed: 120, size: 18, life: 1.2 });
    }
    function stars() {
      let s = api.lives >= 3 ? 3 : api.lives >= 2 ? 2 : 1;
      if (F.timer && s < 3 && timed > 0 && quickHits / timed >= 0.6) s++;     // estrella extra por responder rápido
      return s;
    }

    function renderClock() {
      const f = clamp(1 - qTime / qLimit);
      const st = f <= 0 ? 'is-out' : qTime > qLimit * 0.5 ? 'is-late' : '';
      if (st !== clockState) { clockState = st; clock.className = 'luz-clock' + (st ? ' ' + st : ''); }
      const v = Math.round(f * 200) / 200;
      if (v !== clockShown) { clockShown = v; clockBar.style.transform = `scaleX(${v})`; }
    }

    loadBank().then(list => {
      if (dead) return;
      bank = list;
      byLevel = { 1: [], 2: [], 3: [] };
      for (const q of bank) (byLevel[q.level] || byLevel[2]).push(q);
      show();
    });
    import('../core/tts.js').then(m => { if (!dead && m.available()) { tts = m; say.hidden = false; } }).catch(() => {});

    // ── Escena ──
    const L = {};
    function layout() {
      const A = api.top, H = api.H;
      L.candleY = A + clamp((H - A) * 0.42, 150, 290);
      L.baseY = L.candleY - 34;
      // Filas de velitas: una (meta ≤ 12) o dos.
      const n = Math.max(1, api.goal);
      L.rows = n <= 12 ? [{ y: L.candleY + 10, s: n <= 8 ? 0.95 : 0.85, from: 0, count: n }]
        : [{ y: L.candleY + 36, s: 0.8, from: 0, count: Math.ceil(n / 2) }, { y: L.candleY + 4, s: 0.68, from: Math.ceil(n / 2), count: n - Math.ceil(n / 2) }];
      L.panelTop = (n <= 12 ? L.candleY + 18 : L.candleY + 44);
      const sc = (api.overlay.getBoundingClientRect().width || W) / W;
      panel.style.maxHeight = `${Math.max(220, Math.round((H - L.panelTop) * sc - 10))}px`;
    }
    layout();
    function candlePos(i) {
      for (const r of L.rows) {
        if (i >= r.from && i < r.from + r.count) {
          const j = i - r.from, m = r.count, back = r !== L.rows[0];
          const span = W - (back ? 70 : 44);
          return { x: m <= 1 ? W / 2 : (back ? 35 : 22) + j * (span / (m - 1)), y: r.y, s: r.s };
        }
      }
      return null;
    }

    function flame(g, x, y, s, tt) {
      const f = 1 + Math.sin(tt * 11 + x) * 0.08;
      kit.circle(g, x, y - 5 * s, 13 * s, 'rgba(255, 210, 110, 0.22)');
      g.save(); g.translate(x, y); g.scale(s * f, s * (2 - f));
      g.fillStyle = PAL.sunDeep; g.beginPath(); g.moveTo(0, -12); g.bezierCurveTo(6, -4, 5, 2, 0, 2); g.bezierCurveTo(-5, 2, -6, -4, 0, -12); g.fill();
      g.fillStyle = '#fff3b0'; g.beginPath(); g.moveTo(0, -6.5); g.bezierCurveTo(3, -2, 2.4, 1, 0, 1); g.bezierCurveTo(-2.4, 1, -3, -2, 0, -6.5); g.fill();
      g.restore();
    }
    // Lámpara de aceite de barro (parábola de las diez jóvenes, Mateo 25).
    function oilLamp(g, x, y, s, lit, tt) {
      g.fillStyle = '#b8794a';
      g.beginPath(); g.ellipse(x, y - 6 * s, 12 * s, 6 * s, 0, 0, 6.283); g.fill();
      g.beginPath(); g.moveTo(x + 7 * s, y - 10 * s); g.lineTo(x + 17 * s, y - 11 * s); g.lineTo(x + 16 * s, y - 6 * s); g.lineTo(x + 7 * s, y - 2 * s); g.closePath(); g.fill();
      g.strokeStyle = '#8e5a34'; g.lineWidth = 2.4 * s; g.beginPath(); g.arc(x - 12 * s, y - 7 * s, 4 * s, Math.PI * 0.5, Math.PI * 1.5); g.stroke();
      kit.ellipse(g, x - 1 * s, y - 9.5 * s, 3.6 * s, 1.6 * s, '#5a3620');
      if (lit) flame(g, x + 16 * s, y - 11 * s, s * 0.95, tt);
    }
    // El candelero sobre el monte (Mateo 5, 15).
    function lampstand(g, x, y, k, tt) {
      halo(g, x, y - 58, 24 + 56 * k, 0.15 + 0.55 * k);
      g.fillStyle = '#d4a23a';
      g.beginPath(); g.moveTo(x - 14, y); g.lineTo(x + 14, y); g.lineTo(x + 5, y - 8); g.lineTo(x - 5, y - 8); g.closePath(); g.fill();
      g.fillRect(x - 2.5, y - 48, 5, 42);
      g.beginPath(); g.ellipse(x, y - 49, 12, 3.5, 0, 0, 6.283); g.fill();
      oilLamp(g, x - 3, y - 50, 0.85, k > 0.01, tt);
    }
    function church(g, x, y, k) {
      const wall = lerpColor('#4a5490', '#f4e3c3', k), roof = lerpColor('#39406f', '#c75b45', k);
      kit.fillRR(g, x - 26, y - 38, 52, 38, 3, wall);
      g.fillStyle = roof; g.beginPath(); g.moveTo(x - 31, y - 37); g.lineTo(x, y - 58); g.lineTo(x + 31, y - 37); g.closePath(); g.fill();
      kit.fillRR(g, x + 13, y - 74, 15, 38, 2, wall);
      g.fillStyle = roof; g.beginPath(); g.moveTo(x + 11, y - 73); g.lineTo(x + 20.5, y - 84); g.lineTo(x + 30, y - 73); g.closePath(); g.fill();
      g.fillStyle = '#f3d27a'; g.fillRect(x + 19.5, y - 97, 2, 14); g.fillRect(x + 15.5, y - 92, 10, 2);
      g.fillStyle = k > 0.05 ? `rgba(255, 226, 138, ${(0.4 + 0.6 * k).toFixed(3)})` : '#232a55';
      g.beginPath(); g.moveTo(x - 8, y); g.lineTo(x - 8, y - 14); g.arc(x, y - 14, 8, Math.PI, 0); g.lineTo(x + 8, y); g.closePath(); g.fill();
      kit.circle(g, x - 14, y - 24, 4.5, g.fillStyle);
    }
    // El cirio pascual: la luz de Cristo resucitado.
    function cirio(g, x, y, tt) {
      halo(g, x, y - 58, 30, 0.6);
      kit.fillRR(g, x - 6, y - 50, 12, 50, 3, '#fffaf0');
      g.fillStyle = '#d0453a'; g.fillRect(x - 1, y - 44, 2, 14); g.fillRect(x - 4.5, y - 39, 9, 2);
      g.fillStyle = '#c9962e'; g.fillRect(x - 8, y - 2, 16, 4);
      g.save(); g.strokeStyle = '#5a4636'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y - 50); g.lineTo(x, y - 54); g.stroke(); g.restore();
      flame(g, x, y - 53, 1.05, tt);
    }

    // Resplandor cálido que se desvanece hacia afuera.
    function halo(g, x, y, r, a) {
      if (a <= 0.01) return;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(255, 228, 140, ${Math.min(1, a).toFixed(3)})`); gr.addColorStop(1, 'rgba(255, 214, 110, 0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill();
    }
    function skyLayer(g, kind, a) { if (a <= 0.003) return; g.save(); g.globalAlpha = Math.min(1, a); kit.sky(g, W, api.H, kind); g.restore(); }

    return {
      update(dt) {
        t += dt;
        if (glow > 0) glow -= dt;
        const target = mode === 'celebrate' ? 1 : clamp(api.score / Math.max(1, api.goal));
        shown += (target - shown) * Math.min(1, dt * 3);
        // Reloj suave por pregunta (se detiene mientras la voz lee la pregunta).
        if (mode === 'question' && F.timer && !(tts && tts.speaking && tts.speaking())) {
          qTime += dt;
          renderClock();
          if (F.wind && qTime >= qLimit) resolve(false, -1, true);
        }
        // La palomita del Espíritu Santo cruza el cielo de vez en cuando.
        if (F.dove) {
          if (dove.on) {
            dove.x += dove.vx * dt;
            if (dove.x < -50 || dove.x > W + 50) dove.on = false;
          } else if (mode === 'question') {
            dove.wait += dt;
            if (dove.wait >= dove.next) {
              const dir = api.rand() < 0.5 ? 1 : -1;
              dove.on = true; dove.wait = 0; dove.next = api.randRange(20, 30);
              dove.vx = dir * api.randRange(52, 64); dove.x = dir > 0 ? -40 : W + 40;
              dove.y = api.randRange(api.top + 28, Math.max(api.top + 34, L.baseY - 70));
            }
          }
        }
        if (mode === 'celebrate') {
          celebT += dt;
          if (celebT >= 1.8 && !ended) { ended = true; api.end({ won: true, stars: stars() }); }
        }
      },
      pointerDown(x, y) {
        if (F.dove && dove.on && kit.dist(x, y, dove.x, dove.y) < 40) {
          dove.on = false; dove.got++;
          api.sfx('coo');
          api.burst(dove.x, dove.y, { color: '#ffffff', count: 12, speed: 90 });
          if (lamp < 3 && F.lamp) { lamp++; renderLamp(); api.floatText(dove.x, dove.y - 20, '🕊️ +1 💡', { size: 18 }); }
          else api.floatText(dove.x, dove.y - 20, '🕊️ ¡Paz!', { size: 18 });
        }
      },
      draw(g) {
        const H = api.H, p = shown, sc = F.scene;
        const celebK = mode === 'celebrate' ? clamp(celebT / 1.2) : 0;
        // cielo y hora del día
        let day, starA, moon = null;
        if (sc === 'monte') { kit.sky(g, W, H, 'night'); skyLayer(g, 'dawn', p * 0.85); day = p; starA = 1 - p * 0.8; moon = [304, 34, 17]; }
        else if (sc === 'candelero') { kit.sky(g, W, H, 'sunset'); skyLayer(g, 'night', 0.35 + p * 0.45); day = 0.45 * (1 - p); starA = 0.25 + p * 0.6; }
        else if (sc === 'aceite') { kit.sky(g, W, H, 'night'); g.fillStyle = 'rgba(12, 14, 44, 0.35)'; g.fillRect(0, 0, W, H); day = 0; starA = 1; moon = [70, 40, 22]; }
        else if (sc === 'pascua') { kit.sky(g, W, H, 'night'); skyLayer(g, 'dawn', p * 0.9); day = p * 0.9; starA = 1 - p * 0.8; moon = [300, 32, 14]; }
        else { kit.sky(g, W, H, 'night'); skyLayer(g, 'dawn', Math.min(1, p * 1.6) * 0.9); skyLayer(g, 'day', (p - 0.5) * 1.8); day = p; starA = 1 - p; }
        if (starA > 0.02) { g.save(); g.globalAlpha = starA; kit.stars(g, W, L.baseY - 30, t, 34, 5); g.restore(); }
        if (moon) { g.save(); g.globalAlpha = sc === 'aceite' ? 1 : 1 - p * 0.8; kit.moon(g, moon[0], api.top + moon[1], moon[2]); g.restore(); }
        if (sc === 'alba') kit.sun(g, W * 0.76, lerp(L.baseY + 14, api.top + 48, p), 24, t);
        // el monte y la ciudad
        const baseY = L.baseY;
        g.fillStyle = lerpColor('#2f3a6e', '#5fa56a', day); g.beginPath(); g.moveTo(0, H);
        for (let x = 0; x <= W + 8; x += 8) g.lineTo(x, baseY + 26 - Math.sin((x / W) * Math.PI) * 30);
        g.lineTo(W, H); g.closePath(); g.fill();
        const litHouses = Math.ceil(p * 9 - 0.05);
        const wallC = lerpColor('#454f86', '#f3d9b0', day), roofC = lerpColor('#39406f', '#d96a4a', day);
        houses.forEach((hs, i) => {
          if (i === 4 && sc !== 'monte') return;     // en el centro va el candelero, la casa del banquete, la iglesia o la cruz
          if ((i === 3 || i === 5) && sc === 'pascua') return;
          const y = baseY + 22 - hs.lift, on = i < litHouses || celebK > 0;
          kit.fillRR(g, hs.x - hs.w / 2, y - hs.h, hs.w, hs.h, 3, wallC);
          g.fillStyle = roofC; g.beginPath();
          if (hs.roof === 1) { g.arc(hs.x, y - hs.h, hs.w / 2, Math.PI, 0); } else { g.moveTo(hs.x - hs.w / 2 - 3, y - hs.h); g.lineTo(hs.x, y - hs.h - 13); g.lineTo(hs.x + hs.w / 2 + 3, y - hs.h); }
          g.closePath(); g.fill();
          if (on) halo(g, hs.x, y - hs.h * 0.55, 18, 0.55);
          kit.fillRR(g, hs.x - 5, y - hs.h * 0.55 - 6, 10, 12, 2, on ? '#ffe28a' : '#232a55');
        });
        const cx = houses[4].x, cy = baseY + 22 - houses[4].lift;
        if (sc === 'candelero') lampstand(g, cx, cy, Math.max(p, celebK), t);
        else if (sc === 'aceite') {
          // la casa de la fiesta de bodas: su puerta se abre al final («¡Ya viene el novio!»)
          kit.fillRR(g, cx - 24, cy - 44, 48, 44, 3, '#5a5f99');
          g.fillStyle = '#3e4378'; g.beginPath(); g.moveTo(cx - 29, cy - 43); g.lineTo(cx, cy - 62); g.lineTo(cx + 29, cy - 43); g.closePath(); g.fill();
          const open = Math.max(p * 0.6, celebK);
          kit.fillRR(g, cx - 9, cy - 24, 18, 24, 3, open > 0.05 ? `rgba(255, 220, 130, ${(0.35 + 0.65 * open).toFixed(3)})` : '#232a55');
          for (const dx of [-15, 15]) oilLamp(g, cx + dx - 4, cy - 30, 0.55, p > 0.3 || celebK > 0, t + dx);
        } else if (sc === 'pascua') { church(g, cx, cy, Math.max(p, celebK)); cirio(g, cx - 46, cy + 4, t); }
        else if (sc === 'alba') {
          halo(g, cx, cy - 40, 22 + 40 * p, 0.1 + 0.6 * p);
          g.fillStyle = lerpColor('#6b4a32', '#a8743f', p); g.fillRect(cx - 3, cy - 58, 6, 58); g.fillRect(cx - 15, cy - 46, 30, 6);
        }
        g.fillStyle = lerpColor('#27325e', '#4c9a5c', day); g.fillRect(0, L.candleY - 2, W, H);
        // matitas en el suelo, al pie del monte
        const tuft = lerpColor('#34407a', '#3f9a52', day), fy = L.panelTop + 16;
        for (let i = 0; i < 7; i++) kit.grass(g, 24 + i * 52 + (i % 2) * 10, fy + (i % 3) * 14, 1.2, tuft);
        // las velitas (o lámparas de aceite)
        const n = Math.max(1, api.goal), lit = api.score;
        for (let ri = L.rows.length - 1; ri >= 0; ri--) {
          const r = L.rows[ri];
          for (let j = 0; j < r.count; j++) {
            const i = r.from + j, c = candlePos(i), on = i < lit || celebK > 0;
            if (sc === 'aceite') oilLamp(g, c.x - 4, c.y, c.s * 1.05, on, t + i);
            else kit.candle(g, c.x, c.y, c.s, on, t + i);
            if (on && candleKind[i] === 'gold') kit.star(g, c.x + 9 * c.s, c.y - 40 * c.s, 4.5, '#ffe27a', t);
            else if (on && candleKind[i] === 'flash') kit.star(g, c.x + 9 * c.s, c.y - 40 * c.s, 4, '#bfe6ff', -t);
          }
        }
        if (lit > n) kit.text(g, `+${lit - n} 🕯️`, W - 30, L.candleY - 46, { size: 14, color: '#fff' });
        // luciérnagas de las rachas
        for (const f of flies) {
          const fx = f.x + Math.sin(t * 0.9 + f.ph) * 14, fy = f.y + Math.cos(t * 1.3 + f.ph) * 8;
          kit.circle(g, fx, fy, 7, 'rgba(255, 240, 150, 0.25)'); kit.circle(g, fx, fy, 2.4, '#fff7c2');
        }
        // la palomita
        if (dove.on) {
          kit.circle(g, dove.x, dove.y, 30, 'rgba(255, 255, 255, 0.18)');
          kit.dove(g, dove.x, dove.y, 0.6, { dir: dove.vx > 0 ? 1 : -1, flap: (Math.sin(t * 14) + 1) / 2 });
        }
        if (glow > 0) { g.save(); g.globalAlpha = glow * 0.25; g.fillStyle = '#ffe9a8'; g.fillRect(0, 0, W, H); g.restore(); }
        if (celebK > 0) { g.save(); g.globalAlpha = 0.28 * celebK; g.fillStyle = '#fff4c8'; g.fillRect(0, 0, W, H); g.restore(); }
      },
      resize() { layout(); },
      destroy() { dead = true; tts?.stop(); },
      // Solo lectura, para las pruebas.
      get debug() {
        return {
          mode, level: lv, goal: api.goal, lit: api.score, asked, left: bank.length - used.size, bank: bank.length,
          right: current ? current.options[current.answer] : null, rightPos,
          options: current ? order.map(i => current.options[i]) : [], qLevel: current ? current.level : 0,
          special: current ? current.special || (current.flash ? 'flash' : null) : null,
          topic: current ? current.topic : null, round: round ? { topic: round.topic, flash: round.flash, left: round.left } : null,
          lamp, lampUsable: !lampBtn.disabled && !lampBtn.hidden, retry: F.retry, streak, hearts,
          qTime, qLimit: F.timer ? qLimit : 0, quickHits, timed,
          dove: dove.on ? { x: dove.x, y: dove.y } : null, doveGot: dove.got, scene: F.scene, features: F,
          goalReached, ended, candleY: L.candleY, panelTop: L.panelTop,
        };
      },
    };

    function lerpColor(a, b, k) {
      k = clamp(k);
      const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
      return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], k))).join(',')})`;
    }
  },
};
