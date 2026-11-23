// Los talentos (Mateo 25, 14-30) — memoria de parejas.
//
// Cada carta esconde un don. Al encontrar su pareja, el don "se multiplica", como los talentos de los servidores
// buenos y fieles que los hicieron crecer.
//
// NIVELES (1..100, js/games/levels.js). La meta (api.goal) es cuántas parejas hay que encontrar, con reloj.
// La meta se reparte en varios tableros seguidos (los últimos, un poquito más grandes). api.difficulty agranda los
// tableros, acorta la vista previa, acelera los barajeos y da menos tiempo de regalo por pareja; dentro de la partida
// cada tablero nuevo enseña las cartas un poco menos y se baraja un poco más rápido (rampa suave).
// Al llegar a la meta se celebra «¡Bien, siervo bueno y fiel!» y el juego llama api.end({ won: true }) (selfEnd).
// Novedades (cartelito «¡Nuevo: …!» al empezar el nivel en que aparecen; el primer tablero de ese nivel la enseña):
//    6 tableros más grandes              · 11 talento de oro (su pareja regala tiempo)  · 16 las cartas se barajan
//   21 cartas parecidas; tarde de campo  · 26 talentos enterrados (no se ven al principio)
//   31 talento que se multiplica (vale 2) · 36 atardecer; se cambian dos parejas a la vez
//   41 carta de Palomita (enseña una pareja) · 46 también se barajan a mitad del tablero
//   51 piedritas sin pareja              · 61 una fila entera da una vueltita            · 71 de noche; vistazo más corto
//   81 barajadas rapiditas               · 91 el gran banquete del Señor (todo junto, con luz dorada)
const NEWS = {
  6: '🃏 ¡Nuevo: tableros más grandes!',
  11: '⭐ ¡Nuevo: talento de oro! Su pareja te regala tiempo',
  16: '🔀 ¡Nuevo: las cartas se barajan! Síguelas con la mirada',
  21: '👀 ¡Nuevo: cartas parecidas! Mira bien cada dibujo',
  26: '🌱 ¡Nuevo: talentos enterrados! Tócalos para desenterrarlos',
  31: '🎁 ¡Nuevo: talento que se multiplica! Su pareja vale 2',
  36: '🌇 ¡Nuevo: atardecer! Se cambian dos parejas a la vez',
  41: '🕊️ ¡Nuevo: carta de Palomita! Te enseña una pareja',
  46: '🔀 ¡Nuevo: también se barajan a mitad del juego!',
  51: '🤔 ¡Nuevo: piedritas sin pareja! No te confundas',
  61: '🔄 ¡Nuevo: una fila entera da una vueltita!',
  71: '🌙 ¡Nuevo: de noche! Las cartas se enseñan menos',
  81: '⚡ ¡Nuevo: barajadas rapiditas!',
  91: '🏆 ¡Nuevo: el gran banquete del Señor!',
};
// Dones: emoji, nombre y color de la carta. Cada color es distinto para ayudar a recordar.
const GIFTS = [
  { e: '🎵', n: 'Cantar', c: '#d6ecff' }, { e: '📚', n: 'Estudiar', c: '#dff3d2' }, { e: '😊', n: 'Alegrar', c: '#fff0b8' },
  { e: '🙏', n: 'Rezar', c: '#ebdcff' }, { e: '⚽', n: 'Jugar', c: '#cff1e6' }, { e: '🎨', n: 'Pintar', c: '#ffdbe6' },
  { e: '✍️', n: 'Escribir', c: '#ffe3c7' }, { e: '🌱', n: 'Cuidar', c: '#e9f5c4' }, { e: '🤝', n: 'Ayudar', c: '#ffd5cc' },
  { e: '🍳', n: 'Cocinar', c: '#f3e6d3' }, { e: '👂', n: 'Escuchar', c: '#dde3ff' }, { e: '🤗', n: 'Abrazar', c: '#ffd6f1' },
  { e: '💃', n: 'Bailar', c: '#f1d6ff' }, { e: '🧩', n: 'Pensar', c: '#d4f4f7' }, { e: '🧹', n: 'Ordenar', c: '#e6ebef' },
  { e: '🍞', n: 'Compartir', c: '#fff4d9' },
];
// «Cartas parecidas»: cada uno de estos dones tiene un gemelo con dibujo parecido y el mismo color.
const TWINS = {
  Cantar: ['🎶', 'Tocar'], Estudiar: ['📖', 'Leer'], Alegrar: ['😄', 'Sonreír'], Rezar: ['🙌', 'Alabar'],
  Jugar: ['🏀', 'Encestar'], Pintar: ['🖍️', 'Colorear'], Escribir: ['✏️', 'Dibujar'], Cuidar: ['🌻', 'Sembrar'],
};
// Cartas especiales (se dibujan con el kit, sin emoji).
const SPECIAL = {
  gold: { n: 'Tiempo', c: '#ffe58f' },        // talento de oro: su pareja regala segundos
  multi: { n: 'Vale 2', c: '#ffd3ec' },       // talento que se multiplica: su pareja cuenta doble
  dove: { n: 'Palomita', c: '#dff0ff' },      // carta sola: Palomita enseña una pareja un momento
  stone: { n: 'Sin pareja', c: '#e4e7ec' },   // carta sola: no tiene pareja
};
// Paisaje según el momento del día.
const SCENES = {
  manana: { top: '#7fc6f2', bot: '#fdf1cf', hill: '#a8dc8c', hill2: '#86c97c', deco: 'sun' },
  tarde: { top: '#ffb27f', bot: '#ffe6ad', hill: '#cfd97f', hill2: '#a9c463', deco: 'sun' },
  atardecer: { top: '#8f7be8', bot: '#f5a6c8', hill: '#b48fdc', hill2: '#9574c6', deco: 'stars' },
  noche: { top: '#18214a', bot: '#4c3f8c', hill: '#3b3573', hill2: '#2d2961', deco: 'moon' },
  banquete: { top: '#ffcd66', bot: '#fff2cc', hill: '#f3c56f', hill2: '#e6ab52', deco: 'rays' },
};

export default {
  id: 'talentos',
  levels: {
    goal: [5, 30], curve: 1.1, time: [45, 74], selfEnd: true,
    goalLabel: n => `Encuentra ${n} parejas de talentos`,
  },
  create(api) {
    const { kit } = api;
    const { PAL, clamp, lerp, ease } = kit;
    const W = api.W;

    // ───────────────────────── Nivel ─────────────────────────
    const LV = Math.max(1, Math.round(api.level || 1));
    const D = clamp(api.difficulty || 0);
    const GOAL = Math.max(1, Math.round(api.goal || 5));
    const has = n => LV >= n;                                  // ¿ya apareció esta novedad?
    const ramp = (n, span) => clamp((LV - n) / span);          // 0 cuando aparece una novedad → 1 «span» niveles después
    const THEME = LV >= 91 ? 'banquete' : LV >= 71 ? 'noche' : LV >= 36 ? 'atardecer' : LV >= 21 ? 'tarde' : 'manana';
    const SC = SCENES[THEME];

    // ───────────────────────── Dificultad del nivel ─────────────────────────
    const BS = LV <= 5 ? 3 : Math.round(lerp(3, 10, Math.pow((LV - 1) / 99, 0.85)));   // parejas del tablero principal
    const PREV0 = lerp(2.4, 1.0, Math.pow(D, 0.8));            // vista previa: base…
    const PREV_CARD = lerp(0.1, 0.035, D);                     // …más un poquito por cada carta a la vista
    const MISS_T = lerp(0.95, 1.0, D);                         // cuánto se quedan boca arriba dos cartas distintas
    // Desde el nivel 31 dos cartas distintas se quedan un ratito mínimo a la vista: el toque que llegue antes se guarda
    // y se aplica al terminar (no se pierde). Así se mira lo que salió en vez de tocar a lo loco.
    const MISS_LOCK = has(31) ? lerp(0.5, 0.95, ramp(31, 69)) : 0;
    const PAIR_T = lerp(2, 0.7, D);                            // segundos de regalo por pareja…
    const CLEAR_T = lerp(4, 2, D);                             // …por tablero completo…
    const GOLD_T = lerp(6, 4, D);                              // …y por el talento de oro
    const MOVE_T0 = lerp(1.05, 0.62, ramp(16, 84)) * (has(81) ? 0.82 : 1);   // duración de un barajeo
    const PEEK_T = lerp(1.4, 0.9, ramp(41, 59));               // cuánto enseña Palomita una pareja
    const P_GOLD = has(11) ? lerp(0.5, 0.7, ramp(11, 89)) : 0;
    const P_MULTI = has(31) ? lerp(0.35, 0.5, ramp(31, 69)) : 0;
    const P_BURY = has(26) ? lerp(0.6, 0.9, ramp(26, 74)) : 0;
    const N_BURY = has(26) ? Math.round(lerp(2, 5, ramp(26, 74))) : 0;
    const P_DOVE = has(41) ? lerp(0.6, 0.4, ramp(41, 59)) : 0;
    const P_STONE = has(51) ? lerp(0.6, 0.9, ramp(51, 49)) : 0;
    const N_STONE = has(86) ? 2 : 1;
    const N_SIM = has(21) ? Math.round(lerp(1, 3, ramp(21, 79))) : 0;   // grupos de cartas parecidas por tablero
    const PRE_MOVES = has(16) ? 1 + (has(56) ? 1 : 0) + (has(91) ? 1 : 0) : 0;   // barajeos tras la vista previa
    const MID_EVERY = has(46) ? (has(81) ? 3 : 4) : 0;         // barajeo a mitad del tablero cada tantas parejas
    const MID_MOVES = has(91) ? 2 : 1;
    const P_DOUBLE = has(36) ? lerp(0.45, 0.6, ramp(36, 64)) : 0;
    const P_ROT = has(61) ? lerp(0.3, 0.4, ramp(61, 39)) : 0;
    const DOVE_FLY = 0.55;

    // Tableros del nivel: los que quepan del tamaño principal; lo que sobra va primero, como tablero de calentamiento
    // (si sobra una sola pareja, se suma al último tablero). Así el tamaño principal nunca baja al subir de nivel.
    const PLAN = Array(Math.floor(GOAL / BS)).fill(BS);
    const REST = GOAL % BS;
    if (REST >= 2 || !PLAN.length) PLAN.unshift(REST || GOAL);
    else if (REST === 1) PLAN[PLAN.length - 1]++;
    const NB = PLAN.length;
    const NOVEL_B = Math.max(0, PLAN.findIndex(p => p >= 4));   // tablero donde se enseña la novedad del nivel

    // ───────────────────────── Estado ─────────────────────────
    let t = 0, phase = 'deal', phaseT = 0, dealDur = 0, prevT = 0, bi = 0, rk = 0;
    let cards = [];                 // { id, kind, key, gift, single, slot, flip, up, matched, gone, fade, buried, glow, peek, mv, dl }
    let open = [];                  // cartas descubiertas sin resolver (0, 1 o 2)
    let missT = 0, lockT = 0, queued = null, pairsLeft = 0, movesLeft = 0, moveGap = 0, forceMove = null, sinceShuf = 0, moveT = MOVE_T0;
    let dove = null;                // vuelo de Palomita hacia una pareja
    let uid = 0;
    let G = { cols: 1, rows: 1, n: 0, w: 60, h: 70, gap: 8, y0: 0 };

    // ───────────────────────── Tablero ─────────────────────────
    // Elige columnas y filas para que las cartas sean lo más grandes posible en la pantalla de este momento.
    function layout() {
      const n = cards.length;
      if (!n) return;
      const top = api.top + 30, bottom = api.bottom - 6;
      const gap = n > 16 ? 6 : 8, aw = W - 20, ah = bottom - top;
      let best = null;
      for (let cols = n <= 4 ? 2 : 3; cols <= Math.min(5, n); cols++) {
        const rows = Math.ceil(n / cols);
        const cw = Math.min(n <= 6 ? 110 : 96, (aw - gap * (cols - 1)) / cols), ch = (ah - gap * (rows - 1)) / rows;
        const w = Math.min(cw, ch / 1.08), h = Math.min(ch, w * 1.24);
        const score = w * h * (1 - 0.02 * (cols * rows - n));   // cartas grandes y pocos huecos
        if (!best || score > best.score) best = { cols, rows, w, h, gap, score };
      }
      G = { ...best, n, y0: top + (ah - (best.rows * best.h + (best.rows - 1) * gap)) / 2 };
    }
    // Esquina superior izquierda de un lugar del tablero (la última fila, si está incompleta, va centrada).
    function slotXY(s) {
      const r = Math.floor(s / G.cols), col = s % G.cols;
      const inRow = r === G.rows - 1 ? G.n - r * G.cols : G.cols;
      const x0 = (W - (inRow * G.w + (inRow - 1) * G.gap)) / 2;
      return [x0 + col * (G.w + G.gap), G.y0 + r * (G.h + G.gap)];
    }
    // Posición actual de una carta (con el vuelo del reparto y el arco del barajeo) → [x, y, levantada]
    function pos(c) {
      let [x, y] = slotXY(c.slot), lift = 0;
      if (c.mv) {
        const p = ease.inOut(clamp(c.mv.t / c.mv.dur));
        const [fx, fy] = slotXY(c.mv.from), [tx, ty] = slotXY(c.mv.to);
        x = lerp(fx, tx, p); y = lerp(fy, ty, p);
        lift = Math.sin(p * Math.PI) * Math.min(G.h * 0.5, 10 + Math.hypot(tx - fx, ty - fy) * 0.2) * c.mv.sgn;
        lift = Math.min(lift, y - (api.top + 24));            // sin tapar el letrero de arriba
      }
      if (c.dl < 1) {
        const p = ease.outCubic(clamp(c.dl));
        x = lerp(W / 2 - G.w / 2, x, p); y = lerp(api.H + 10, y, p);
      }
      return [x, y - lift, lift];
    }
    const visible = c => !c.gone && (c.up || c.matched || c.peek > 0 || phase === 'won' || phase === 'end' || (phase === 'preview' && !c.buried));

    function deal() {
      const P = PLAN[bi] || BS;
      rk = NB > 1 ? bi / (NB - 1) : 0;
      const novel = n => LV === n && bi === NOVEL_B;          // la novedad se enseña seguro en el primer tablero grande
      const gold = P >= 3 && has(11) && (novel(11) || api.rand() < P_GOLD);
      const multi = P >= 4 && has(31) && (novel(31) || api.rand() < P_MULTI);
      const hasDove = P >= 4 && has(41) && (novel(41) || api.rand() < P_DOVE);
      const stones = has(51) && (novel(51) || api.rand() < P_STONE) ? N_STONE : 0;
      const bury = has(26) && (novel(26) || api.rand() < P_BURY);
      // Dones del tablero (con sus gemelos parecidos, si ya tocan)
      const normal = P - (gold ? 1 : 0) - (multi ? 1 : 0);
      const sims = Math.min(N_SIM, Math.floor(normal / 2));
      const twinKeys = api.shuffle(Object.keys(TWINS)).slice(0, sims);
      const chosen = [];
      for (const k of twinKeys) {
        const b = GIFTS.find(gf => gf.n === k);
        chosen.push(b, { e: TWINS[k][0], n: TWINS[k][1], c: b.c });
      }
      chosen.push(...api.shuffle(GIFTS.filter(gf => !twinKeys.includes(gf.n))).slice(0, normal - chosen.length));
      const deck = [];
      for (const gf of chosen) deck.push({ kind: 'gift', key: gf.n, gift: gf }, { kind: 'gift', key: gf.n, gift: gf });
      if (gold) deck.push({ kind: 'gold', key: '#oro', gift: SPECIAL.gold }, { kind: 'gold', key: '#oro', gift: SPECIAL.gold });
      if (multi) deck.push({ kind: 'multi', key: '#x2', gift: SPECIAL.multi }, { kind: 'multi', key: '#x2', gift: SPECIAL.multi });
      if (hasDove) deck.push({ kind: 'dove', key: '#paloma', gift: SPECIAL.dove, single: true });
      for (let i = 0; i < stones; i++) deck.push({ kind: 'stone', key: '#piedra' + i, gift: SPECIAL.stone, single: true });
      cards = api.shuffle(deck).map((d, i) => ({
        id: ++uid, single: false, ...d, slot: i, flip: 0, up: false, matched: false, gone: false, fade: 1,
        buried: false, glow: 0, peek: 0, mv: null, dl: -i * 0.03,
      }));
      if (bury) {
        const cand = api.shuffle(cards.filter(c => !c.single));
        for (const c of cand.slice(0, Math.min(N_BURY, Math.floor(cand.length / 3)))) c.buried = true;
      }
      layout();
      open = []; missT = 0; lockT = 0; queued = null; pairsLeft = P; movesLeft = 0; sinceShuf = 0; dove = null;
      forceMove = novel(61) ? 'rot' : novel(36) ? 'double' : null;
      moveT = MOVE_T0 * (1 - 0.1 * rk);
      const shown = cards.filter(c => !c.buried).length;
      prevT = (PREV0 + shown * PREV_CARD) * (has(71) ? 0.85 : 1) * (1 - 0.12 * rk);
      dealDur = 0.35 + cards.length * 0.03;
      phase = 'deal'; phaseT = 0;
      api.sfx('whoosh');
      // La novedad del nivel se cuenta al repartir el tablero que la trae, mientras las cartas están boca abajo.
      if (bi === NOVEL_B && NEWS[LV]) { api.hint(NEWS[LV], 2600); dealDur += 1.9; }
      else if (bi === 0 && LV <= 3) { api.hint('¡Memoriza dónde está cada talento!', 1900); dealDur += 1.6; }
    }
    deal();

    // ───────────────────────── Barajeos ─────────────────────────
    const movable = () => cards.filter(c => !c.gone && !c.matched && !c.up && !c.buried && c.peek <= 0);
    function moveCard(c, to, sgn) { c.mv = { from: c.slot, to, t: 0, dur: moveT, sgn }; c.slot = to; }
    function doMove() {
      const el = movable();
      if (el.length < 2) return false;
      let kind = forceMove || (api.rand() < P_ROT ? 'rot' : api.rand() < P_DOUBLE ? 'double' : 'swap');
      forceMove = null;
      if (kind === 'rot') {
        // Toda una fila corre un lugar (la del extremo da la vuelta por arriba).
        const rows = {};
        for (const c of el) (rows[Math.floor(c.slot / G.cols)] ||= []).push(c);
        const ok = Object.values(rows).filter(r => r.length >= 3);
        if (ok.length) {
          const row = api.pick(ok).sort((a, b) => a.slot - b.slot);
          const slots = row.map(c => c.slot), n = slots.length, dir = api.rand() < 0.5 ? 1 : -1;
          const arc = Math.floor(slots[0] / G.cols) === 0 ? -1 : 1;   // en la fila de arriba la vuelta va por abajo
          row.forEach((c, i) => {
            const j = i + dir, wrap = j < 0 || j >= n;
            moveCard(c, slots[(j + n) % n], wrap ? arc : -0.25 * arc);
          });
          api.sfx('whoosh');
          return true;
        }
        kind = 'double';
      }
      const s = api.shuffle(el);
      const pairs = kind === 'double' && s.length >= 4 ? 2 : 1;
      for (let i = 0; i < pairs; i++) {
        const a = s[2 * i], b = s[2 * i + 1], sa = a.slot;
        moveCard(a, b.slot, 1); moveCard(b, sa, -1);
      }
      api.sfx('whoosh');
      return true;
    }
    function startShuffle(n, wait) {
      if (movable().length < 4) return false;
      phase = 'shuffle'; phaseT = 0; movesLeft = n; moveGap = wait;
      return true;
    }

    // ───────────────────────── Jugadas ─────────────────────────
    const center = c => { const [x, y] = pos(c); return [x + G.w / 2, y + G.h / 2]; };
    function resolveMiss() {
      for (const c of open) c.up = false;
      open = []; missT = 0;
    }
    function useDove(c) {
      c.up = true;
      api.sfx('coo');
      // Palomita vuela hacia una pareja que todavía no se ha encontrado y la enseña un momento.
      const count = {};
      for (const k of cards) if (!k.single && !k.matched && !k.up && !k.buried && k.peek <= 0) count[k.key] = (count[k.key] || 0) + 1;
      const keys = Object.keys(count).filter(k => count[k] === 2);
      const key = keys.length ? api.pick(keys) : null;
      const pair = key ? cards.filter(k => k.key === key && !k.matched) : [];
      const [x0, y0] = center(c);
      dove = { x0, y0, pair, card: c, t: 0, done: false };
    }
    function tap(x, y) {
      if (phase !== 'play') return;
      const pad = G.gap / 2;
      const c = cards.find(k => {
        if (k.gone || k.matched || k.up || k.mv) return false;
        const [cx, cy] = center(k);
        return Math.abs(x - cx) <= G.w / 2 + pad && Math.abs(y - cy) <= G.h / 2 + pad;
      });
      if (!c) return;
      if (open.length === 2 && lockT > 0) { queued = c; return; }   // se aplica al terminar el ratito
      tapCard(c);
    }
    function tapCard(c) {
      if (phase !== 'play' || c.gone || c.matched || c.up || c.mv) return;
      if (c.kind === 'dove') { useDove(c); return; }
      if (open.length === 2) resolveMiss();       // el niño no tiene que esperar a que se volteen solas
      if (c.buried) {
        c.buried = false;
        const [cx, cy] = center(c);
        api.burst(cx, cy + G.h * 0.2, { color: PAL.earth, count: 10, speed: 80, size: 4 });
        api.sfx('step');
      }
      c.up = true; c.peek = 0; open.push(c);
      api.sfx('tap');
      if (open.length === 2) check();
    }
    function check() {
      const [a, b] = open;
      if (a.key !== b.key || a.single) { missT = MISS_T; lockT = MISS_LOCK; api.sfx('wrong'); return; }
      a.matched = b.matched = true; a.glow = b.glow = 1; open = [];
      pairsLeft--;
      const [ax, ay] = center(a), [bx, by] = center(b);
      const mx = (ax + bx) / 2, my = Math.max(api.top + 56, Math.min(ay, by) - G.h * 0.3);   // sin subir hasta el marcador
      api.addScore(a.kind === 'multi' ? 2 : 1, mx, my);
      let bonus = PAIR_T;
      if (a.kind === 'gold') {
        bonus += GOLD_T;
        api.floatText(mx, my + 26, `+${Math.round(bonus)} s`, { color: '#fff3a6', size: 22 });
        api.sfx('coin');
      } else if (a.kind === 'multi') api.sfx('good');
      api.addTime(bonus);
      api.sfx('match');
      for (const [x, y] of [[ax, ay], [bx, by]]) api.burst(x, y, { color: PAL.sun, count: a.kind === 'gift' ? 8 : 14, speed: 90 });
      if (api.score >= GOAL) { win(); return; }
      if (!pairsLeft) {
        phase = 'clear'; phaseT = 0;
        for (const c of cards) if (c.single) c.gone = true;
        api.addTime(CLEAR_T);
        api.floatText(W / 2, api.top + 60, `+${Math.round(CLEAR_T)} s`, { color: '#fff3a6', size: 22 });
        api.sfx('bell');
        return;
      }
      if (MID_EVERY && ++sinceShuf >= MID_EVERY && pairsLeft >= 2 && startShuffle(MID_MOVES, 0.55)) sinceShuf = 0;
    }
    function win() {
      phase = 'won'; phaseT = 0;
      for (const c of cards) { if (c.single) c.gone = true; else c.glow = 1; }
      for (let i = 0; i < 5; i++) api.burst(W * (0.15 + i * 0.175), api.top + 70, { emoji: '⭐', count: 3, speed: 140, size: 18, life: 1 });
    }

    // ───────────────────────── Dibujo ─────────────────────────
    function coin(g, x, y, r) {
      kit.circle(g, x, y + r * 0.12, r, PAL.sunDeep);
      kit.circle(g, x, y, r, PAL.sun);
      kit.circle(g, x, y, r * 0.72, null, PAL.sunDeep, Math.max(1.5, r * 0.1));
      kit.star(g, x, y, r * 0.42, '#fff6c9', 0);
    }
    function drawBack(g, c, w, h, r) {
      kit.fillRR(g, -w / 2, -h / 2, w, h, r, PAL.grape);
      kit.fillRR(g, -w / 2 + 4, -h / 2 + 4, w - 8, h - 8, r * 0.75, PAL.grapeDeep);
      const cr = Math.min(w, h) * 0.27;
      kit.circle(g, 0, 2, cr, PAL.sunDeep); kit.circle(g, 0, 0, cr, PAL.sun); kit.circle(g, 0, 0, cr * 0.72, null, PAL.sunDeep, 2);
      kit.star(g, 0, 0, cr * 0.45, '#fff6c9', t * 0.3);
      if (c.buried) {
        // Talento enterrado: un montoncito de tierra con un brote encima.
        g.save(); kit.rr(g, -w / 2, -h / 2, w, h, r); g.clip();
        kit.ellipse(g, 0, h * 0.42, w * 0.75, h * 0.42, PAL.earthDeep);
        kit.ellipse(g, 0, h * 0.46, w * 0.7, h * 0.38, PAL.earth);
        for (let i = 0; i < 4; i++) kit.circle(g, -w * 0.3 + i * w * 0.2, h * 0.3 + (i % 2) * h * 0.08, Math.max(1.5, w * 0.03), PAL.earthDeep);
        g.restore();
        kit.grass(g, 0, h * 0.06, Math.max(0.8, w / 60), PAL.leafDeep);
      }
    }
    function drawFace(g, c, w, h, r) {
      const k = c.kind;
      kit.fillRR(g, -w / 2, -h / 2, w, h, r, c.gift.c, c.matched ? PAL.sun : k === 'gold' ? PAL.sunDeep : null, 3);
      const es = Math.min(w * 0.5, h * 0.4), ey = -h * 0.1;
      if (k === 'gift') kit.emoji(g, c.gift.e, 0, ey, es);
      else if (k === 'gold') coin(g, 0, ey, es * 0.5);
      else if (k === 'multi') {
        coin(g, -es * 0.2, ey + 2, es * 0.36); coin(g, es * 0.2, ey - 2, es * 0.36);
        kit.text(g, '×2', 0, ey + es * 0.05, { size: Math.max(12, es * 0.42), color: '#fff', stroke: PAL.roseDeep, strokeWidth: 4 });
      } else if (k === 'dove') kit.dove(g, -es * 0.08, ey + es * 0.08, es / 50, { flap: 0.5 + 0.5 * Math.sin(t * 9), dir: 1 });
      else if (k === 'stone') kit.rock(g, 0, ey + es * 0.32, es / 46, PAL.stoneDeep);
      const lab = Math.max(12, Math.min(15, w * 0.19));
      kit.text(g, c.gift.n, 0, h / 2 - lab * 0.85 - 3, { size: lab, color: PAL.ink, maxWidth: w - 6 });
    }
    function drawCard(g, c) {
      if (c.fade <= 0.01 || c.dl <= 0) return;
      const [x, y, lift] = pos(c);
      const w = G.w, h = G.h, cx = x + w / 2, cy = y + h / 2, r = Math.min(12, w * 0.15);
      const sx = Math.abs(Math.cos(c.flip * Math.PI));          // giro: se encoge a la mitad y cambia de cara
      const up = Math.abs(lift) / (G.h * 5);
      g.save();
      g.globalAlpha = c.fade;
      g.translate(cx, cy);
      g.scale(Math.max(0.04, sx) * (1 + up), (1 + up) * (1 + (1 - sx) * 0.04));
      kit.fillRR(g, -w / 2, -h / 2 + 4 + Math.abs(lift) * 0.25, w, h, r, 'rgba(40,20,60,0.25)');
      if (c.flip > 0.5) drawFace(g, c, w, h, r); else drawBack(g, c, w, h, r);
      g.restore();
      const yy = y + (1 - (1 + up)) * h / 2;
      if (c.mv) kit.fillRR(g, x - 4, yy - 4, w + 8, h * (1 + up) + 8, r + 4, null, 'rgba(255, 246, 200, 0.8)', 3);
      if (c.peek > 0) kit.fillRR(g, x - 3, y - 3, w + 6, h + 6, r + 3, null, 'rgba(255, 255, 255, 0.9)', 3);
      if (c.glow > 0) { const e = (1 - c.glow) * 10; kit.fillRR(g, x - 3 - e, y - 3 - e, w + 6 + 2 * e, h + 6 + 2 * e, r + 3 + e, null, `rgba(255, 214, 90, ${c.glow})`, 4); }
    }
    function drawScene(g) {
      const H = api.H;
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, SC.top); gr.addColorStop(1, SC.bot);
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      if (SC.deco === 'sun') kit.sun(g, W - 48, api.top + 4, 24, t);
      else if (SC.deco === 'moon') { kit.stars(g, W, H * 0.7, t, 34, 5); kit.moon(g, W - 46, api.top + 6, 20); }
      else if (SC.deco === 'stars') kit.stars(g, W, H * 0.6, t, 26, 11);
      else {
        // Banquete: rayos de luz dorada que giran despacito.
        g.save(); g.translate(W / 2, api.top - 20); g.rotate(t * 0.08); g.fillStyle = 'rgba(255, 255, 255, 0.28)';
        for (let i = 0; i < 12; i++) { g.rotate(Math.PI / 6); g.beginPath(); g.moveTo(-14, 0); g.lineTo(0, -H * 1.2); g.lineTo(14, 0); g.fill(); }
        g.restore();
      }
      kit.hills(g, W, H, H - 46, 12, SC.hill, 40, 0.014);
      kit.hills(g, W, H, H - 26, 8, SC.hill2, 0, 0.018);
    }
    function label() {
      if (phase === 'won') return '¡Bien, siervo bueno y fiel!';
      if (phase === 'clear') return '¡Tablero completo!';
      if (phase === 'shuffle') return '¡Se barajan! Síguelas con la mirada';
      if (phase === 'preview') return '¡Memoriza los talentos!';
      return NB > 1 ? `Tablero ${bi + 1} de ${NB}` : 'Encuentra las parejas';
    }
    function drawDove(g) {
      if (!dove) return;
      const [a, b] = dove.pair;
      const [tx, ty] = a && b ? [(center(a)[0] + center(b)[0]) / 2, Math.max(api.top + 50, Math.min(center(a)[1], center(b)[1]) - G.h * 0.45)] : [W / 2, api.top + 60];
      const p = ease.inOut(clamp(dove.t / DOVE_FLY));
      const x = lerp(dove.x0, tx, p), y = Math.max(api.top + 50, lerp(dove.y0, ty, p) - Math.sin(p * Math.PI) * 40);
      const alpha = clamp(1 - (dove.t - DOVE_FLY - 0.5) / 0.4);
      g.save(); g.globalAlpha = alpha;
      kit.dove(g, x, y, 0.7, { flap: 0.5 + 0.5 * Math.sin(t * 16), dir: tx >= dove.x0 ? 1 : -1 });
      g.restore();
    }

    return {
      update(dt) {
        t += dt; phaseT += dt;
        for (const c of cards) {
          if (c.dl < 1) c.dl += dt / 0.35;
          const target = visible(c) ? 1 : 0;
          c.flip = clamp(c.flip + Math.sign(target - c.flip) * dt * 5.5, 0, 1);
          if (c.glow > 0) c.glow = Math.max(0, c.glow - dt * 1.8);
          if (c.peek > 0) c.peek = Math.max(0, c.peek - dt);
          if (c.gone && c.fade > 0) c.fade = Math.max(0, c.fade - dt * 3);
          if (c.mv) { c.mv.t += dt; if (c.mv.t >= c.mv.dur) c.mv = null; }
        }
        if (phase === 'deal' && phaseT >= dealDur) { phase = 'preview'; phaseT = 0; api.sfx('sparkle'); }
        else if (phase === 'preview' && phaseT >= prevT) {
          phase = 'play'; phaseT = 0;
          if (PRE_MOVES) startShuffle(PRE_MOVES, 0.4);
        } else if (phase === 'shuffle' && !cards.some(c => c.mv)) {
          moveGap -= dt;
          if (moveGap <= 0) {
            if (movesLeft > 0 && doMove()) { movesLeft--; moveGap = 0.16; }
            else { movesLeft = 0; phase = 'play'; phaseT = 0; }
          }
        } else if (phase === 'clear' && phaseT > 1.1) { bi++; deal(); }
        else if (phase === 'won' && (phaseT > 1.3 || api.timeLeft < 0.25)) { phase = 'end'; api.end({ won: true }); }
        if (lockT > 0) { lockT -= dt; if (lockT <= 0 && queued) { const q = queued; queued = null; tapCard(q); } }
        if (missT > 0) { missT -= dt; if (missT <= 0) resolveMiss(); }
        if (dove) {
          dove.t += dt;
          if (!dove.done && dove.t >= DOVE_FLY) {
            dove.done = true;
            for (const k of dove.pair) if (!k.up && !k.matched) { k.peek = PEEK_T; k.glow = 0.7; }
            dove.card.gone = true;
            api.sfx('sparkle');
          }
          if (dove.t > DOVE_FLY + 0.9) dove = null;
        }
      },
      draw(g) {
        drawScene(g);
        kit.text(g, label(), W / 2, api.top + 14, { size: 16, color: '#fff', stroke: 'rgba(60,30,90,0.55)', strokeWidth: 4, maxWidth: W - 20 });
        for (const c of cards) if (!c.mv) drawCard(g, c);
        for (const c of cards) if (c.mv) drawCard(g, c);   // las que se mueven, por encima
        drawDove(g);
      },
      pointerDown(x, y) { tap(x, y); },
      resize() { layout(); },
      // Solo lectura, para pruebas: la cara (key/kind) solo se ve cuando la carta está boca arriba.
      get debug() {
        return {
          phase, level: LV, goal: GOAL, board: bi, boards: NB, plan: PLAN.slice(), prevT, moveT, open: open.length,
          moving: cards.some(c => c.mv), cardW: G.w, cardH: G.h, top: api.top,
          cards: cards.filter(c => !c.gone).map(c => {
            const f = c.flip > 0.5, [x, y] = center(c);
            return { id: c.id, x, y, up: c.up, matched: c.matched, buried: c.buried, face: f, key: f ? c.key : null, kind: f ? c.kind : null, peek: c.peek > 0 };
          }),
        };
      },
    };
  },
};
