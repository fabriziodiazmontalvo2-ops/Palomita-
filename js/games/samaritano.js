// Manos que ayudan (El buen samaritano, Lucas 10, 25-37) — minijuego de arrastrar, 100 niveles.
//
// En el camino de Jerusalén a Jericó aparecen personas que necesitan algo. El niño mira el globito y arrastra hasta
// cada una lo que le hace falta (o toca el objeto y luego a la persona). Si se acaba la paciencia, la persona se va
// triste y se pierde una vida. Dar algo equivocado (desde el nivel 6) gasta un poquito de su paciencia.
//
// Niveles (api.difficulty 0 → 1): más personas a la vez, llegan más seguido y esperan menos. Y cada pocos niveles algo nuevo:
//   1 agua, pan y venda · 6 manto · 11 abrazo · 16 aceite · 21 niños · 26 Palomita trae calma · 31 dos necesidades (de día)
//   41 abuelitos y el burrito · 51 viajeros con prisa (atardecer) · 56 el viento mueve la bandeja
//   61 te dicen cómo se sienten · 71 de noche: la lámpara · 81 caravana (4 a la vez) · 91 amanece: tres necesidades
// El juego hace su propia celebración al ayudar a api.goal personas (levels.selfEnd).

// ¿Este dispositivo sabe dibujar el emoji? (los más nuevos salen como un cuadrito en teléfonos viejos)
const EMOJI_OK = new Map();
function emojiOk(ch) {
  if (EMOJI_OK.has(ch)) return EMOJI_OK.get(ch);
  let ok = true;
  try {
    const c = document.createElement('canvas'); c.width = c.height = 28;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.font = '22px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(ch, 14, 15);
    const d = x.getImageData(0, 0, 28, 28).data;
    let n = 0, col = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 60) continue;
      n++;
      if (Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) > 30) col++;
    }
    ok = n > 50 && col > 6;
  } catch { ok = true; }
  EMOJI_OK.set(ch, ok);
  return ok;
}
const em = (ch, alt) => (alt && !emojiOk(ch) ? alt : ch);

// Burrito dibujado (por si el teléfono no tiene el emoji 🫏). (x, y) = suelo; mira a la derecha si dir = 1.
function donkey(g, x, y, s = 1, dir = 1) {
  g.save(); g.translate(x, y); g.scale(dir * s, s);
  g.fillStyle = 'rgba(60,40,30,0.16)'; g.beginPath(); g.ellipse(0, 0, 22, 4, 0, 0, 6.28); g.fill();
  g.fillStyle = '#7d7d88';
  for (const lx of [-14, -7, 8, 15]) { g.beginPath(); g.roundRect ? g.roundRect(lx - 2.2, -16, 4.4, 16, 2) : g.rect(lx - 2.2, -16, 4.4, 16); g.fill(); }
  g.strokeStyle = '#7d7d88'; g.lineWidth = 2.4; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-18, -24); g.quadraticCurveTo(-24, -18, -23, -11); g.stroke();
  g.fillStyle = '#4b4b55'; g.beginPath(); g.ellipse(-23, -10, 2.2, 3.4, 0, 0, 6.28); g.fill();
  g.fillStyle = '#a3a3ae'; g.beginPath(); g.ellipse(0, -21, 19, 10.5, 0, 0, 6.28); g.fill();
  g.fillStyle = '#c9c6cc'; g.beginPath(); g.ellipse(1, -16, 13, 5, 0, 0, 6.28); g.fill();
  g.fillStyle = '#e0645a'; g.beginPath(); g.ellipse(-2, -28, 9, 4.5, 0, 0, 6.28); g.fill();
  // cuello y cabeza
  g.fillStyle = '#a3a3ae'; g.beginPath(); g.moveTo(9, -29); g.lineTo(20, -42); g.lineTo(27, -36); g.lineTo(17, -20); g.closePath(); g.fill();
  g.strokeStyle = '#4b4b55'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(10, -31); g.lineTo(19, -43); g.stroke();
  g.fillStyle = '#a3a3ae'; g.beginPath(); g.ellipse(25, -39, 8.5, 6, 0.45, 0, 6.28); g.fill();
  g.fillStyle = '#ddd4cb'; g.beginPath(); g.ellipse(30.5, -35, 5, 4.4, 0.45, 0, 6.28); g.fill();
  for (const [ex, rot] of [[19, -0.35], [23.5, 0.05]]) {
    g.fillStyle = '#a3a3ae'; g.beginPath(); g.ellipse(ex, -50, 2.8, 8.5, rot, 0, 6.28); g.fill();
    g.fillStyle = '#e9b8be'; g.beginPath(); g.ellipse(ex, -50, 1.3, 5.6, rot, 0, 6.28); g.fill();
  }
  g.fillStyle = '#2b1d16'; g.beginPath(); g.arc(24, -41, 1.4, 0, 6.28); g.arc(32, -34.5, 0.9, 0, 6.28); g.fill();
  g.restore();
}

export default {
  id: 'samaritano',
  levels: {
    goal: [6, 40], curve: 1.15, lives: 3, selfEnd: true,
    goalLabel: n => `Ayuda a ${n} personas del camino`,
  },
  create(api) {
    const { kit } = api;
    const { PAL, clamp, lerp, ease } = kit;
    const W = api.W;

    // ───────────────────────── Nivel ─────────────────────────
    const LV = Math.max(1, Math.round(api.level || 1));
    const DF = clamp(api.difficulty || 0);
    const GOAL = Math.max(1, Math.round(api.goal || 12));
    const has = n => LV >= n;                                  // ¿ya apareció esta novedad?
    const ramp = (n, span) => clamp((LV - n) / span);          // 0 cuando aparece una novedad → 1 «span» niveles después

    // Lo que se puede dar. `from` = nivel en que aparece. feel/word = cómo lo dice la persona (desde el nivel 61).
    const ITEMS = [
      { k: 'agua', e: '💧', feel: '🥵', word: 'sed', from: 1 },
      { k: 'pan', e: '🍞', feel: '🤤', word: 'hambre', from: 1 },
      { k: 'venda', e: '🩹', feel: '🤕', word: 'herida', from: 1 },
      { k: 'manto', e: '🧥', feel: '🥶', word: 'frío', from: 6 },
      { k: 'abrazo', e: '❤️', feel: '😢', word: 'triste', from: 11 },
      { k: 'aceite', e: em('🫒', '🏺'), feel: '🤒', word: 'enfermo', from: 16 },
      { k: 'burro', e: '🫏', draw: emojiOk('🫏') ? null : 'donkey', feel: em('🥱', '😩'), word: 'cansado', from: 41 },
      { k: 'lampara', e: em('🪔', '🕯️'), feel: '🌑', word: 'no ve', from: 71 },
    ];
    const BY = Object.fromEntries(ITEMS.map(it => [it.k, it]));
    const ON = ITEMS.filter(it => has(it.from));
    const KID_NEEDS = ['agua', 'pan', 'manto', 'abrazo', 'lampara'];

    const NEWS = {
      6: '🧥 ¡Nuevo: el manto, para quien tiene frío!',
      11: '❤️ ¡Nuevo: un abrazo, para quien está triste!',
      16: '🫒 ¡Nuevo: aceite, para quien está enfermo!'.replace('🫒', BY.aceite.e),
      21: '👧 ¡Nuevo: niños en el camino! Se cansan rápido de esperar',
      26: '🕊️ ¡Nuevo: toca a Palomita y todos esperan con calma!',
      31: '☀️ ¡Nuevo: personas que necesitan dos cosas!',
      41: `👴 ¡Nuevo: abuelitos cansados! Llévalos en tu burrito${BY.burro.draw ? '' : ' 🫏'}`,
      51: '⏳ ¡Nuevo: viajeros con prisa al atardecer! Ayúdalos primero',
      56: '🌬️ ¡Nuevo: el viento del desierto mueve tu bandeja!',
      61: '💭 ¡Nuevo: te dicen cómo se sienten! Piensa qué necesitan',
      71: `🌙 ¡Nuevo: es de noche! Lleva una lámpara ${BY.lampara.e} a quien no ve`,
      81: '🐪 ¡Nuevo: llega una caravana! Hasta 4 personas a la vez',
      91: '🌅 ¡Nuevo: amanece! Hay quien necesita tres cosas',
    };
    // En el nivel de cada novedad, la primera persona la enseña.
    const SHOW = { 6: 'manto', 11: 'abrazo', 16: 'aceite', 21: 'kid', 31: 'two', 41: 'elder', 51: 'hurry', 61: 'feel', 71: 'lampara', 81: 'caravan', 91: 'three' }[LV] || '';
    const THEME = LV >= 91 ? 'alba' : LV >= 71 ? 'noche' : LV >= 51 ? 'tarde' : LV >= 31 ? 'dia' : 'aurora';

    // ───────────────────────── Dificultad del nivel ─────────────────────────
    const DE = Math.pow(DF, 0.65);
    const GAP0 = lerp(4.4, 2.75, DE), GAP1 = lerp(3.4, 2.15, DE);   // segundos entre llegadas (al empezar / cerca de la meta)
    const EMPTY_GAP = lerp(2.6, 1.5, DF);                          // si nadie espera, la siguiente persona llega antes
    const PAT = lerp(14, 6.6, Math.pow(DF, 0.9)) * (LV <= 5 ? lerp(1.35, 1.1, (LV - 1) / 4) : 1);   // paciencia con una necesidad (s); extra en los primeros niveles
    const PEN = LV < 6 ? 0 : lerp(0.1, 0.3, DF);                   // paciencia que gasta un objeto equivocado (fracción)
    const MAX_AT = LV < 6 ? 1 : LV < 21 ? 2 : LV < 81 ? 3 : 4;     // personas esperando a la vez
    const P_KID = has(21) ? lerp(0.18, 0.28, ramp(21, 60)) : 0;
    const P_ELDER = has(41) ? lerp(0.16, 0.22, ramp(41, 50)) : 0;
    const P_HURRY = has(51) ? lerp(0.12, 0.22, ramp(51, 49)) : 0;
    const P_TWO = has(31) ? lerp(0.18, 0.42, ramp(31, 60)) : 0;
    const P_THREE = has(91) ? lerp(0.08, 0.12, ramp(91, 9)) : 0;
    const P_FEEL = has(61) ? lerp(0.35, 0.7, ramp(61, 39)) : 0;
    const P_CARAVAN = has(81) ? lerp(0.22, 0.32, ramp(81, 19)) : 0;   // llegan 2 o 3 juntos (y luego hay más respiro)
    const DOVE_EVERY = has(26) ? lerp(16, 26, ramp(26, 74)) : 0;     // cada cuánto pasa Palomita (s)
    const WIND_EVERY = has(56) ? lerp(15, 9, ramp(56, 44)) : 0;      // cada cuánto sopla el viento (s)
    const KIND_K = { adult: 1, kid: 0.75, elder: 1.2, hurry: 0.6 };  // paciencia según quién es

    const ROBES = ['#c97b63', '#8fbc8f', '#7fb3d5', '#b08968', '#c9a3ff', '#e9a04b'];
    const KID_ROBES = ['#ff9db5', '#8fd16a', '#ffc94a', '#7cc8f5', '#c9a3ff'];
    const SKINS = ['#e8b38a', '#b9825a', '#f0c8a0', '#8d5a3b'];
    const HAIRS = ['#5a3b28', '#2f1e14', '#444', '#6b4a2f'];
    const THEMES = {
      aurora: { sky: 'dawn', h1: '#f0d7a8', h2: '#e9c58a', ground: '#ecd29c', r1: '#d6b678', r2: '#e3c88f', rock: '#c9b38a', bush: '#a9b56e' },
      dia: { sky: 'day', h1: '#e3d49a', h2: '#d6bf7e', ground: '#eed7a0', r1: '#d2b073', r2: '#e5cb91', rock: '#c4ae86', bush: '#94b064' },
      tarde: { sky: 'sunset', h1: '#e8b68a', h2: '#da9f72', ground: '#e8c290', r1: '#c99c6a', r2: '#dcb483', rock: '#b8926c', bush: '#9aa064' },
      noche: { sky: 'night', h1: '#454f86', h2: '#3b4476', ground: '#4b5384', r1: '#5f6896', r2: '#6c74a2', rock: '#6d7398', bush: '#3f5a63' },
      alba: { sky: 'dawn', h1: '#f3cf9b', h2: '#eab877', ground: '#f0cf94', r1: '#dcb26c', r2: '#e9c584', rock: '#cfae7e', bush: '#a3b56a' },
    };
    const TH = THEMES[THEME];

    // ───────────────────────── Estado ─────────────────────────
    let t = 0, spawnT = 0.6, helped = 0, spawned = 0, phase = 'play', winT = 0, ended = false;
    const people = [];       // { slot, kind, needs: [{ it, done }], feel, patience, max, state: 'wait' | 'happy' | 'leave', st, shake, look… }
    const SLOTS = [];        // posiciones en el camino
    const tray = ON.map((item, i) => ({ item, cell: i, x: 0, y: 0, tx: 0, ty: 0, isNew: item.from === LV && LV > 1 }));
    let drag = null;         // { item, x, y, moved, sx, sy }
    let selected = null;
    let dove = null, doveT = DOVE_EVERY ? (LV === 26 ? 3.5 : DOVE_EVERY * 0.55) : 0, calmT = 0;
    let windT = WIND_EVERY ? (LV === 56 ? 6 : WIND_EVERY * 0.7) : 0, gustT = 0, caravanT = 0, caravans = 0;
    const L = {};

    function layout(snap) {
      const top = api.top, H = api.H, n = tray.length;
      // bandeja: una fila; dos filas si hay muchos objetos y la pantalla es alta
      const rows = n > 6 && H >= 600 ? 2 : 1;
      const perRow = Math.ceil(n / rows);
      const sp = Math.min(70, (W - 20) / perRow);
      L.r = Math.min(30, sp / 2 - 4);
      const rowH = Math.max(58, L.r * 2 + 14);
      L.trayH = rows * rowH + 12;
      L.trayTop = api.bottom - L.trayH;
      L.cells = [];
      for (let i = 0; i < n; i++) {
        const row = Math.floor(i / perRow), col = i % perRow;
        const inRow = row === rows - 1 ? n - perRow * (rows - 1) : perRow;
        L.cells.push({ x: W / 2 - (sp * (inRow - 1)) / 2 + col * sp, y: L.trayTop + 6 + rowH * (row + 0.5) });
      }
      for (const b of tray) {
        const c = L.cells[b.cell];
        b.tx = c.x; b.ty = c.y;
        if (snap) { b.x = c.x; b.y = c.y; }
      }
      // camino: 4 lugares en zigzag, con sitio para el globito bajo el marcador
      const y0 = top + 122, y3 = Math.max(y0 + 150, L.trayTop - 12);
      const xs = [250, 110, 262, 120];
      SLOTS.length = 0;
      for (let i = 0; i < 4; i++) SLOTS.push({ x: xs[i], y: lerp(y0, y3, i / 3) });
      L.hor = Math.max(top + 36, y0 - 70);
      L.sam = { x: 26, y: L.trayTop - 8 };
      L.doveY = top + 26;
    }
    layout(true);
    const HINT_T = NEWS[LV] ? 3.8 : 3;
    api.hint(NEWS[LV] || (LV <= 5 ? 'Arrastra lo que necesita cada persona' : `Ayuda a ${GOAL} personas`), HINT_T * 1000);

    // ───────────────────────── Personas ─────────────────────────
    function weightOf(it, kind) {
      let w = 1;
      if (LV - it.from < 5 && it.from > 1) w = 2.2;                 // lo recién aprendido sale más
      if (it.k === 'lampara') w *= 1.4;
      if (it.k === 'burro' && kind !== 'elder') w *= 0.45;
      return w;
    }
    function pickNeed(kind, taken) {
      let pool = ON.filter(it => !taken.includes(it.k));
      if (kind === 'kid') { const kp = pool.filter(it => KID_NEEDS.includes(it.k)); if (kp.length) pool = kp; }
      let sum = 0;
      for (const it of pool) sum += weightOf(it, kind);
      let r = api.rand() * sum;
      for (const it of pool) { r -= weightOf(it, kind); if (r <= 0) return it; }
      return pool[pool.length - 1];
    }
    function spawn() {
      let free = [0, 1, 2, 3].filter(i => !people.some(p => p.slot === i));
      if (!free.length) return false;
      // mientras se ve el cartelito del principio (arriba), la gente llega abajo
      if (api.time < HINT_T) { const low = free.filter(i => i >= 2); if (low.length) free = low; }
      const q = helped / GOAL;
      let kind = 'adult';
      const r = api.rand();
      if (r < P_KID) kind = 'kid';
      else if (r < P_KID + P_ELDER) kind = 'elder';
      else if (r < P_KID + P_ELDER + P_HURRY) kind = 'hurry';
      let n = 1;
      const r2 = api.rand();
      if (r2 < P_THREE) n = 3; else if (r2 < P_THREE + P_TWO) n = 2;
      let feel = api.rand() < P_FEEL;
      let force = null;
      // la primera persona de un nivel con novedad la enseña
      if (spawned === 0 && SHOW) {
        if (SHOW === 'kid') kind = 'kid';
        else if (SHOW === 'elder') { kind = 'elder'; n = 1; }
        else if (SHOW === 'hurry') { kind = 'hurry'; n = 1; }
        else if (SHOW === 'two') n = 2;
        else if (SHOW === 'three') { kind = 'adult'; n = 3; }
        else if (SHOW === 'feel') { feel = true; n = 1; }
        else { force = BY[SHOW]; n = 1; kind = SHOW === 'lampara' ? 'kid' : 'adult'; }
      }
      if (kind === 'kid' || kind === 'hurry') n = Math.min(n, 2);
      const taken = [];
      if (force) taken.push(force.k);
      if (kind === 'elder' && has(41)) taken.push('burro');
      while (taken.length < n) taken.push(pickNeed(kind, taken).k);
      const needs = taken.map(k => ({ it: BY[k], done: false }));
      const pat = PAT * (1 + 0.55 * (needs.length - 1)) * KIND_K[kind] * lerp(1.08, 0.94, q);
      const female = api.rand() < 0.4;
      const lying = kind === 'adult' && needs.some(x => x.it.k === 'venda') && needs.length === 1;
      people.push({
        slot: api.pick(free), kind, needs, feel, patience: pat, max: pat, state: 'wait', st: 0, shake: 0, lying,
        robe: api.pick(kind === 'kid' ? KID_ROBES : ROBES), skin: api.pick(SKINS),
        hair: kind === 'elder' ? '#e2e2e2' : api.pick(HAIRS),
        veil: female ? api.pick(kind === 'elder' ? ['#ece6da', '#d9d4ea'] : ['#f4f1e8', '#ffd9c2', '#cfe6f5']) : null,
        beard: kind === 'elder' && !female,
        sash: kind === 'hurry' ? '#f0c35a' : null,
      });
      spawned++;
      api.sfx('pop');
      return true;
    }
    const scaleOf = p => (p.kind === 'kid' ? 0.92 : p.kind === 'elder' ? 1.12 : 1.18);
    const open = p => p.needs.filter(x => !x.done);
    function personAt(x, y) {
      let best = null, bd = 56;
      for (const p of people) {
        if (p.state !== 'wait') continue;
        const s = SLOTS[p.slot], d = kit.dist(x, y, s.x, s.y - 34);
        if (d < bd) { bd = d; best = p; }
      }
      return best;
    }
    function bubblePos(p) {
      const s = SLOTS[p.slot];
      return { x: s.x, y: p.lying ? s.y - 56 : s.y - (56 * scaleOf(p) + 24) };
    }
    function give(p, item) {
      if (phase !== 'play') return;
      const s = SLOTS[p.slot];
      const need = p.needs.find(x => !x.done && x.it.k === item.k);
      if (need) {
        need.done = true;
        if (!open(p).length) {
          p.state = 'happy'; p.st = 0; helped++;
          api.addScore(1, s.x, s.y - 96);
          api.sfx('good');
          api.burst(s.x, s.y - 50, { emoji: '❤️', count: 4, speed: 70, size: 16, life: 0.9, gravity: -30 });
          if (helped >= GOAL) win();
        } else {
          // ayuda a medias: le da ánimo y un poquito de paciencia
          p.patience = Math.min(p.max, p.patience + p.max * 0.12);
          api.sfx('match');
          api.floatText(s.x, s.y - 100, '¡Gracias!', { color: '#fff', size: 15 });
        }
      } else {
        p.shake = 0.45;
        if (PEN > 0) p.patience = Math.max(0.05, p.patience - p.max * PEN);
        api.sfx('wrong');
        api.floatText(s.x, s.y - 100, 'Eso no…', { color: '#ffe3d6', size: 15 });
      }
    }
    function win() {
      phase = 'win'; winT = 0; drag = null; selected = null; dove = null;
      for (const p of people) if (p.state === 'wait') { p.state = 'happy'; p.st = 0; }
      api.sfx('sparkle');
      api.burst(L.sam.x + 20, L.sam.y - 60, { emoji: '💛', count: 8, speed: 120, size: 18, life: 1.2, gravity: -20 });
    }
    function calm() {
      calmT = 1.2;
      api.sfx('coo');
      api.floatText(dove.x, dove.y + 20, '¡Calma!', { color: '#fff', size: 18 });
      api.burst(dove.x, dove.y, { emoji: '✨', count: 6, speed: 90, size: 14, life: 0.8, gravity: 0 });
      for (const p of people) if (p.state === 'wait') p.patience = Math.min(p.max, p.patience + p.max * 0.5);
      dove = null;
    }
    function gust() {
      // mezcla la bandeja (siempre cambia el orden)
      const cells = tray.map(b => b.cell);
      let order = api.shuffle(cells), tries = 0;
      while (tries++ < 6 && order.every((c, i) => c === cells[i])) order = api.shuffle(cells);
      tray.forEach((b, i) => { b.cell = order[i]; const c = L.cells[b.cell]; b.tx = c.x; b.ty = c.y; });
      gustT = 1.1;
      api.sfx('whoosh');
      api.floatText(W / 2, L.trayTop - 12, '¡Sopla el viento!', { color: '#fff', size: 16 });
    }
    const trayAt = (x, y) => {
      const rr = L.r + 5;
      let best = null, bd = 1e9;
      for (const b of tray) {
        const d = Math.abs(x - b.x) + Math.abs(y - b.y);
        if (Math.abs(x - b.x) < rr && Math.abs(y - b.y) < rr + 4 && d < bd) { bd = d; best = b; }
      }
      return best;
    };

    // ───────────────────────── Dibujo ─────────────────────────
    function ringColor(k) { return k > 0.5 ? PAL.leaf : k > 0.25 ? PAL.sun : PAL.coral; }
    // Dibuja un objeto de ayuda (emoji o, si falta, el burrito dibujado)
    function drawItem(g, it, x, y, size, alpha = 1) {
      if (it.draw === 'donkey') { g.save(); g.globalAlpha *= alpha; donkey(g, x - size * 0.12, y + size * 0.5, size / 56, 1); g.restore(); }
      else kit.emoji(g, it.e, x, y, size, { alpha });
    }
    function needGlyph(g, it, feel, x, y, size, alpha = 1) {
      if (feel) {
        kit.emoji(g, it.feel, x, y - size * 0.24, size * 0.8, { alpha });
        kit.text(g, it.word, x, y + size * 0.5, { size: 12, color: PAL.ink, weight: 800, maxWidth: 46, alpha });
      } else drawItem(g, it, x, y, size, alpha);
    }
    function drawBubble(g, p, bx, by) {
      const n = p.needs.length, k = clamp(p.patience / p.max);
      const pulse = k < 0.3 ? 1 + Math.sin(t * 14) * 0.05 : 1;
      const calmGlow = calmT > 0 ? calmT / 1.2 : 0;
      if (n === 1) {
        const r = (p.feel ? 27 : 24) * pulse;
        kit.circle(g, bx, by + 2, r + 1, 'rgba(60,40,30,0.14)');
        if (calmGlow) kit.circle(g, bx, by, r + 7, `rgba(255,255,255,${0.5 * calmGlow})`);
        kit.circle(g, bx, by, r, '#ffffff');
        g.fillStyle = '#fff'; g.beginPath(); g.moveTo(bx - 7, by + r - 3); g.lineTo(bx, by + r + 9); g.lineTo(bx + 7, by + r - 3); g.fill();
        g.strokeStyle = ringColor(k); g.lineWidth = 5; g.lineCap = 'round';
        g.beginPath(); g.arc(bx, by, r, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); g.stroke();
        needGlyph(g, p.needs[0].it, p.feel, bx, by, 26);
        if (p.kind === 'hurry') kit.emoji(g, '⏳', bx + r + 6, by - r + 4, 16);
        return;
      }
      // varias necesidades: un globito alargado con una barrita de paciencia
      const cw = 42, w = n * cw + 10, h = p.feel ? 54 : 46;
      const x0 = bx - w / 2, y0 = by - h / 2;
      kit.fillRR(g, x0, y0 + 2, w, h, 18, 'rgba(60,40,30,0.14)');
      if (calmGlow) kit.fillRR(g, x0 - 6, y0 - 6, w + 12, h + 12, 22, `rgba(255,255,255,${0.5 * calmGlow})`);
      kit.fillRR(g, x0, y0, w, h, 18, '#ffffff');
      g.fillStyle = '#fff'; g.beginPath(); g.moveTo(bx - 7, y0 + h - 2); g.lineTo(bx, y0 + h + 10); g.lineTo(bx + 7, y0 + h - 2); g.fill();
      p.needs.forEach((x, i) => {
        const cx = x0 + 5 + cw * (i + 0.5);
        needGlyph(g, x.it, p.feel, cx, by - 3, 24, x.done ? 0.28 : 1);
        if (x.done) kit.text(g, '✓', cx + 10, by - 12, { size: 18, color: PAL.leafDeep, weight: 800 });
      });
      kit.bar(g, x0 + 9, y0 + h - 9, w - 18, 5, k, ringColor(k));
      if (p.kind === 'hurry') kit.emoji(g, '⏳', x0 + w + 4, y0 + 4, 16);
    }
    function drawPerson(g, p) {
      const s = SLOTS[p.slot];
      const sx = s.x + (p.shake > 0 ? Math.sin(p.shake * 40) * 4 : 0);
      g.save();
      if (p.state === 'leave') g.globalAlpha = 1 - clamp(p.st / 1.1);
      const appear = p.state === 'wait' ? ease.outBack(clamp(p.st / 0.35)) : 1;
      const happy = p.state === 'happy';
      const hop = happy ? Math.abs(Math.sin(p.st * 9)) * 6 : 0;
      const sc = scaleOf(p) * appear;
      const lying = p.lying && !happy;
      const px = sx + (p.state === 'leave' ? p.st * 40 : 0), py = s.y - hop;
      if (THEME === 'noche' && happy) {
        const gr = g.createRadialGradient(px, py - 30, 4, px, py - 30, 60);
        gr.addColorStop(0, 'rgba(255,214,120,0.45)'); gr.addColorStop(1, 'rgba(255,214,120,0)');
        g.fillStyle = gr; g.fillRect(px - 60, py - 90, 120, 120);
      }
      kit.person(g, px, py, sc, { robe: p.robe, skin: p.skin, hair: p.hair, veil: p.veil, beard: p.beard, sash: p.sash, sad: !happy, arms: happy ? 'up' : 'down', lying, t, walk: p.state === 'leave' || (p.kind === 'hurry' && !happy) });
      if (p.kind === 'elder' && !lying) {
        // bastón del abuelito
        g.strokeStyle = '#8a5a3c'; g.lineWidth = 3 * sc; g.lineCap = 'round';
        g.beginPath(); g.moveTo(px + 14 * sc, py - 18 * sc); g.lineTo(px + 17 * sc, py); g.stroke();
      }
      if (p.state === 'wait') { const b = bubblePos(p); drawBubble(g, p, sx, b.y); }
      else if (happy) {
        p.needs.forEach((x, i) => drawItem(g, x.it, sx + 16 + i * 12, s.y - 30 - hop - i * 6, 18));
      }
      g.restore();
    }
    function drawScene(g) {
      const H = api.H;
      kit.sky(g, W, H, TH.sky);
      if (THEME === 'noche') { kit.stars(g, W, L.hor + 10, t, 34, 11); kit.moon(g, 300, api.top + 44, 18); }
      else if (THEME === 'alba') {
        const gr = g.createRadialGradient(250, L.hor + 6, 10, 250, L.hor + 6, 160);
        gr.addColorStop(0, 'rgba(255,236,170,0.85)'); gr.addColorStop(1, 'rgba(255,220,150,0)');
        g.fillStyle = gr; g.fillRect(60, L.hor - 160, 300, 180);
        kit.sun(g, 250, L.hor + 6, 26, t);
      } else if (THEME === 'dia') kit.sun(g, 300, api.top + 46, 20, t);
      else if (THEME === 'tarde') kit.sun(g, 70, L.hor - 6, 26, t);
      else kit.sun(g, 62, api.top + 44, 22, t);
      if (THEME !== 'noche') { kit.cloud(g, 150 + Math.sin(t * 0.1) * 20, api.top + 40, 0.7, 0.8); }
      if (caravanT > 0) {
        // camellos de la caravana por el horizonte
        const k = 1 - caravanT / 6, a = Math.min(1, caravanT, (6 - caravanT) * 2);
        for (let i = 0; i < 3; i++) kit.emoji(g, '🐪', W + 30 - k * (W + 120) + i * 30, L.hor - 2 + Math.abs(Math.sin(t * 4 + i)) * 2, 22, { alpha: a, flip: true });
      }
      kit.hills(g, W, H, L.hor + 4, 16, TH.h1, 30, 0.012);
      kit.hills(g, W, H, L.hor + 22, 12, TH.h2, 160, 0.017);
      g.fillStyle = TH.ground; g.fillRect(0, L.hor + 34, W, H);
      // el camino que serpentea
      g.save(); g.strokeStyle = TH.r1; g.lineWidth = 86; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(300, L.hor + 20);
      for (let i = 0; i < 4; i++) g.lineTo(SLOTS[i].x + (i % 2 ? 50 : -50), SLOTS[i].y);
      g.lineTo(200, H + 40); g.stroke();
      g.strokeStyle = TH.r2; g.lineWidth = 70; g.stroke();
      g.restore();
      kit.tree(g, 40, SLOTS[0].y - 18, 0.9, { kind: 'palm' });
      kit.rock(g, 330, lerp(SLOTS[1].y, SLOTS[2].y, 0.5), 0.85, TH.rock); kit.rock(g, 30, lerp(SLOTS[1].y, SLOTS[2].y, 0.55), 0.7, TH.rock);
      kit.bush(g, 334, SLOTS[3].y + 4, 0.7, TH.bush);
    }

    return {
      update(dt) {
        t += dt;
        if (calmT > 0) calmT -= dt;
        if (caravanT > 0) caravanT -= dt;
        if (gustT > 0) gustT -= dt;
        for (const b of tray) { const k = Math.min(1, dt * 9); b.x += (b.tx - b.x) * k; b.y += (b.ty - b.y) * k; }
        for (let i = people.length - 1; i >= 0; i--) {
          const p = people[i];
          p.st += dt; if (p.shake > 0) p.shake -= dt;
          if (p.state === 'wait' && phase === 'play') {
            p.patience -= dt;
            if (p.patience <= 0) { p.state = 'leave'; p.st = 0; const s = SLOTS[p.slot]; api.loseLife(s.x, s.y - 60); }
          } else if (p.state === 'happy' && p.st > 1.3) people.splice(i, 1);
          else if (p.state === 'leave' && p.st > 1.1) people.splice(i, 1);
        }
        if (phase === 'win') {
          winT += dt;
          if (winT > 1.8 && !ended) { ended = true; api.end({ won: true }); }
          return;
        }
        // Palomita que trae calma
        if (DOVE_EVERY) {
          if (dove) {
            dove.x += dove.dir * 62 * dt; dove.t += dt;
            dove.y = L.doveY + Math.sin(dove.t * 3) * 5;
            if (dove.x < -40 || dove.x > W + 40) dove = null;
          } else if ((doveT -= dt) <= 0) {
            const dir = api.rand() < 0.5 ? 1 : -1;
            dove = { x: dir > 0 ? -30 : W + 30, y: L.doveY, dir, t: 0 };
            doveT = DOVE_EVERY * api.randRange(0.85, 1.15);
            api.sfx('flap');
          }
        }
        // el viento que mueve la bandeja
        if (WIND_EVERY && (windT -= dt) <= 0) { gust(); windT = WIND_EVERY * api.randRange(0.85, 1.15); }
        // llegadas
        spawnT -= dt;
        const waiting = people.filter(p => p.state === 'wait').length;
        const q = helped / GOAL;
        const maxNow = q < 0.12 && MAX_AT > 1 ? MAX_AT - 1 : MAX_AT;
        if (spawnT <= 0 && waiting < maxNow) {
          // una caravana: llegan 2 o 3 juntos y después hay más respiro
          let k = 1;
          const room = Math.min(maxNow - waiting, 4 - people.length);
          if (P_CARAVAN && room >= 2 && ((SHOW === 'caravan' && !caravans) || api.rand() < P_CARAVAN)) k = Math.min(room, api.rand() < 0.4 ? 3 : 2);
          let made = 0;
          for (let i = 0; i < k; i++) if (spawn()) made++;
          if (made > 1) { caravans++; caravanT = 6; }
          if (made) spawnT = lerp(GAP0, GAP1, q) * api.randRange(0.88, 1.12) * (made > 1 ? 0.85 * made : 1);
        }
        if (spawnT > EMPTY_GAP && !people.some(p => p.state === 'wait')) spawnT = EMPTY_GAP;
      },
      draw(g) {
        drawScene(g);
        // el samaritano y su burrito
        const cheer = phase === 'win' || people.some(p => p.state === 'happy');
        const hopS = phase === 'win' ? Math.abs(Math.sin(winT * 8)) * 6 : 0;
        if (THEME === 'noche') {
          const gr = g.createRadialGradient(L.sam.x + 20, L.sam.y - 30, 6, L.sam.x + 20, L.sam.y - 30, 70);
          gr.addColorStop(0, 'rgba(255,214,120,0.5)'); gr.addColorStop(1, 'rgba(255,214,120,0)');
          g.fillStyle = gr; g.fillRect(L.sam.x - 60, L.sam.y - 110, 160, 150);
        }
        if (BY.burro.draw) donkey(g, L.sam.x + 34, L.sam.y - 2 - hopS * 0.6, 0.62, 1);
        else kit.emoji(g, BY.burro.e, L.sam.x + 26, L.sam.y - 26 - hopS * 0.6, 34, { flip: true });
        kit.person(g, L.sam.x, L.sam.y - hopS, 1.0, { robe: '#3fa7a0', sash: '#f0c35a', hair: '#2f1e14', skin: '#b9825a', beard: true, arms: cheer ? 'up' : 'down', t });
        if (THEME === 'noche') kit.emoji(g, BY.lampara.e, L.sam.x + 14, L.sam.y - 16, 16);
        // personas, de atrás hacia delante
        const order = people.slice().sort((a, b) => SLOTS[a.slot].y - SLOTS[b.slot].y);
        for (const p of order) drawPerson(g, p);
        // Palomita
        if (dove) {
          kit.circle(g, dove.x, dove.y, 26, 'rgba(255,255,255,0.35)');
          kit.dove(g, dove.x, dove.y, 0.62, { dir: dove.dir, flap: (Math.sin(dove.t * 12) + 1) / 2 });
          kit.heart(g, dove.x + dove.dir * 16, dove.y + 12, 0.7, PAL.sun);
        }
        // bandeja de ayuda
        const tt = L.trayTop;
        kit.fillRR(g, 6, tt, W - 12, L.trayH - 4, 22, 'rgba(255,255,255,0.86)');
        for (const b of tray) {
          const on = selected === b.item || (drag && drag.item === b.item);
          if (b.isNew && t < 6) kit.circle(g, b.x, b.y, L.r + 6 + Math.sin(t * 6) * 2, 'rgba(255,201,74,0.55)');
          kit.circle(g, b.x, b.y + 3, L.r, 'rgba(120,80,40,0.18)');
          kit.circle(g, b.x, b.y, L.r, on ? '#fff1c9' : '#ffffff', on ? PAL.sunDeep : null, 3.5);
          if (!(drag && drag.item === b.item && drag.moved)) drawItem(g, b.item, b.x, b.y, L.r * 1.05);
        }
        if (gustT > 0) {
          const a = clamp(gustT / 1.1);
          g.save(); g.globalAlpha = a * 0.8; g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.lineCap = 'round';
          for (let i = 0; i < 3; i++) {
            const yy = tt + 12 + i * (L.trayH / 3), xx = (1 - a) * W * 1.2 - 60 + i * 30;
            g.beginPath(); g.moveTo(xx - 50, yy); g.quadraticCurveTo(xx, yy - 10, xx + 50, yy); g.stroke();
          }
          g.restore();
          kit.emoji(g, '🌬️', 20 + (1 - a) * (W - 40), tt - 14, 22, { alpha: a });
        }
        if (drag && drag.moved) drawItem(g, drag.item, drag.x, drag.y - 26, 44);
        if (selected && !drag && LV <= 15) kit.text(g, 'Ahora toca a quien lo necesita', W / 2, tt - 14, { size: 14, color: '#fff', stroke: 'rgba(61,43,36,0.7)', strokeWidth: 4 });
        if (phase === 'win') {
          const a = clamp(winT / 0.4);
          const ty = lerp(SLOTS[2].y, SLOTS[3].y, 0.5) - 20;
          g.save(); g.globalAlpha = a * 0.55; kit.fillRR(g, 22, ty - 22, W - 44, 44, 22, '#3d2b24'); g.restore();
          kit.text(g, '¡Gracias, buen samaritano!', W / 2, ty, { size: 23, color: '#fff', stroke: 'rgba(61,43,36,0.75)', strokeWidth: 5, alpha: a, maxWidth: W - 60 });
        }
      },
      pointerDown(x, y) {
        if (phase !== 'play') return;
        if (dove && kit.dist(x, y, dove.x, dove.y) < 32) { calm(); return; }
        const b = trayAt(x, y);
        if (b) { drag = { item: b.item, x, y, sx: x, sy: y, moved: false }; api.sfx('tap'); return; }
        const p = personAt(x, y);
        if (p && selected) { give(p, selected); selected = null; }
      },
      pointerMove(x, y) {
        if (!drag) return;
        drag.x = x; drag.y = y;
        if (!drag.moved && kit.dist(x, y, drag.sx, drag.sy) > 12) drag.moved = true;
      },
      pointerUp(x, y) {
        if (!drag) return;
        const d = drag; drag = null;
        if (!d.moved) { selected = d.item; return; }   // tocar = elegir (tocarlo otra vez no lo suelta: los niños repiten toques)
        const p = personAt(x, y - 26) || personAt(x, y);
        if (p) give(p, d.item);
        selected = null;
      },
      resize() { layout(true); },
      get debug() {
        return {
          level: LV, goal: GOAL, helped, spawned, phase, maxAt: MAX_AT, theme: THEME,
          people: people.map(p => ({ x: SLOTS[p.slot].x, y: SLOTS[p.slot].y - 34, need: open(p)[0]?.it.k || null, needs: open(p).map(x => x.it.k), n: p.needs.length, kind: p.kind, feel: p.feel, state: p.state, patience: p.patience, max: p.max, bubble: bubblePos(p) })),
          tray: tray.map(b => ({ x: b.x, y: b.y, k: b.item.k, e: b.item.e, r: L.r })),
          dove: dove ? { x: dove.x, y: dove.y } : null,
          selected: selected ? selected.k : null,
          slots: SLOTS.map(s => ({ x: s.x, y: s.y })), trayTop: L.trayTop, top: api.top,
        };
      },
    };
  },
};
