// La perla escondida (El tesoro y la perla, Mateo 13, 44-46) — juego de las conchas.
//
// Una concha guarda la perla de gran valor. Las conchas se mezclan y el niño tiene que seguirla con la mirada,
// como el comerciante que no le quitó los ojos de encima a su tesoro.
//
// NIVELES (1..100, js/games/levels.js). La meta (api.goal) es cuántas perlas hay que encontrar, con 3 vidas.
// api.difficulty sube el número de cambios, su rapidez y acorta el tiempo en que se enseña la perla; dentro de la
// partida, cada perla encontrada sube todo un poquito más (rampa suave). Al llegar a la meta el comerciante celebra
// y el juego llama api.end({ won: true }) (selfEnd). Si se falla con la última vida, primero se enseña dónde estaba
// la perla y luego se pierde el nivel.
// Novedades (con cartelito «¡Nuevo: …!» en el nivel en que aparecen; la primera ronda de ese nivel la enseña):
//    6 una concha más (4)          · 11 dos cambios a la vez          · 16 concha brillante (señuelo: brilla, pero está vacía)
//   21 cinco conchas               · 26 la ola corre todas las conchas · 31 a veces hay dos perlas
//   36 perla dorada (vale 2)       · 41 atardecer; las conchas bailan en ronda (en círculo)
//   46 3 aciertos seguidos → Palomita trae un corazón                  · 51 pececitos que pasan por delante
//   56 seis conchas en dos filas   · 61 amagos (solo hacen como que se cambian) · 71 playa de noche, con luna
//   76 tres cambios a la vez       · 81 cambios rapiditos             · 91 el gran tesoro, al amanecer dorado
const NEWS = {
  6: '🐚 ¡Nuevo: una concha más!',
  11: '🔀 ¡Nuevo: dos cambios a la vez!',
  16: '✨ ¡Nuevo: concha brillante! Brilla, pero está vacía',
  21: '🐚 ¡Nuevo: cinco conchas!',
  26: '🌊 ¡Nuevo: la ola mueve todas las conchas!',
  31: '⚪ ¡Nuevo: a veces hay dos perlas! Encuentra las dos',
  36: '🟡 ¡Nuevo: perla dorada! Vale 2',
  41: '🌇 ¡Nuevo: atardecer! Las conchas bailan en ronda',
  46: '🕊️ ¡Nuevo: acierta 3 seguidas y Palomita te trae un corazón!',
  51: '🐟 ¡Nuevo: pececitos que pasan por delante!',
  56: '🐚 ¡Nuevo: seis conchas en dos filas!',
  61: '😄 ¡Nuevo: amagos! A veces solo hacen como que se cambian',
  71: '🌙 ¡Nuevo: playa de noche, con luna!',
  76: '🔀 ¡Nuevo: tres cambios a la vez!',
  81: '⚡ ¡Nuevo: cambios rapiditos!',
  91: '🌅 ¡Nuevo: el gran tesoro, al amanecer!',
};
// Movimiento que se enseña en el primer cambio de la primera ronda del nivel de la novedad.
const FORCE = { 11: 'double', 26: 'shift', 61: 'fake', 76: 'triple' };
// Cuánto dura cada tipo de cambio respecto al cambio sencillo.
const MUL = { swap: 1, double: 1.08, triple: 1.15, shift: 1.12, fake: 0.9 };
// Colores del paisaje según el momento del día.
const SCENES = {
  day: { sky: 'sea', water: ['#7fd4f0', '#3aa6dc'], sand: '#f6dfae', dots: '#e8c684' },
  sunset: { sky: 'sunset', water: ['#b49be0', '#4f6fc6'], sand: '#f3cf9b', dots: '#deb176' },
  night: { sky: 'night', water: ['#45619f', '#1f2d68'], sand: '#d3bd92', dots: '#b9a173' },
  gold: { sky: 'dawn', water: ['#a6dcf2', '#4f9fd6'], sand: '#f8dca0', dots: '#e9c27a' },
};

export default {
  id: 'perla',
  levels: {
    goal: [3, 18], curve: 1, lives: 3, selfEnd: true,
    goalLabel: n => `Encuentra ${n} perlas`,
  },
  create(api) {
    const { kit } = api;
    const { PAL, clamp, lerp, ease } = kit;
    const W = api.W;

    // ───────────────────────── Nivel ─────────────────────────
    const LV = Math.max(1, Math.round(api.level || 1));
    const D = clamp(api.difficulty || 0);
    const GOAL = Math.max(1, Math.round(api.goal || 6));
    const has = n => LV >= n;                                  // ¿ya apareció esta novedad?
    const ramp = (n, span) => clamp((LV - n) / span);          // 0 cuando aparece una novedad → 1 «span» niveles después
    const THEME = LV >= 91 ? 'gold' : LV >= 71 ? 'night' : LV >= 41 ? 'sunset' : 'day';
    const SCN = SCENES[THEME];
    const N = LV >= 56 ? 6 : LV >= 21 ? 5 : LV >= 6 ? 4 : 3;  // número de conchas
    const TWO_ROWS = N === 6;

    // ───────────────────────── Dificultad del nivel ─────────────────────────
    const DH = clamp((D - 0.6) / 0.4);                         // empujón extra para los niveles difíciles (60 → 100)
    const STEPS0 = lerp(2, 7, Math.pow(D, 0.9)) + 0.5 * DH;    // cambios por ronda al empezar el nivel…
    const STEPS_UP = lerp(0.8, 2.2, D);                        // …y cuántos más al acercarse a la meta
    const DUR0 = lerp(0.8, 0.33, Math.pow(D, 0.75));           // segundos que dura un cambio sencillo
    const ARC = lerp(1.4, 1, clamp(D / 0.5));                  // al principio las conchas se esquivan con saltos más altos (se siguen mejor)
    const GAP = lerp(0.16, 0.03, D);                           // respiro entre cambio y cambio
    const SHOW_T = lerp(1.7, 0.95, D);                         // cuánto se enseña la perla
    const CLOSE_T = lerp(0.42, 0.3, D);                        // las conchas se cierran antes de mezclarse
    const OK_T = lerp(1.25, 0.9, D);                           // celebración corta de cada acierto
    const NEAR = LV < 21 ? 1 : LV < 31 ? 2 : 9;               // en una fila, distancia máxima de un cambio (lugares)
    const P_INVOLVE = lerp(0.5, 0.62, D);                      // probabilidad de que el cambio mueva una concha con perla
    const P_DOUBLE = has(11) ? lerp(0.25, 0.45, ramp(11, 50)) : 0;
    const P_TRIPLE = has(76) ? lerp(0.2, 0.35, ramp(76, 20)) : 0;
    const P_SHIFT = has(26) ? lerp(0.1, 0.18, ramp(26, 50)) : 0;
    const P_FAKE = has(61) ? lerp(0.12, 0.2, ramp(61, 30)) : 0;
    const P_RAPID = has(81) ? lerp(0.15, 0.3, ramp(81, 19)) : 0;
    const P_RONDA = has(41) ? lerp(0.3, 0.55, ramp(41, 50)) : 0;
    const P_TWO = has(31) ? lerp(0.2, 0.4, ramp(31, 60)) : 0;
    const P_GOLD = has(36) ? lerp(0.15, 0.22, ramp(36, 60)) : 0;
    const P_DECOY = has(16) ? lerp(0.35, 0.75, ramp(16, 50)) : 0;
    const P_FISH = has(51) ? lerp(0.3, 0.5, ramp(51, 40)) : 0;

    // ───────────────────────── Estado ─────────────────────────
    let t = 0, round = 0, phase = 'show', phaseT = 0, showT = SHOW_T;
    let shells = [];                // { slot, x, y, open, ov, openTo, pearl, gold, decoy, found, bob }
    let pearls = 1, found = 0, steps = 0, stepIdx = 0, step = null, wait = 0;
    let rondaAt = -1, fishAt = -1, fish = null, dove = null, streak = 0;
    let picked = null, right = false, pendingLose = false;
    const first = n => LV === n && round === 0;               // primera ronda del nivel en que aparece la novedad n
    const bubbles = Array.from({ length: 9 }, (_, i) => ({ x: api.randRange(10, W - 10), y: api.randRange(0, 600), r: api.randRange(3, 7), v: api.randRange(14, 30), ph: i }));
    const L = {};

    // ───────────────────────── Lugares de las conchas ─────────────────────────
    // Una fila (3–5 conchas) o dos filas de 3 (6 conchas: 0-2 atrás, 3-5 adelante).
    const LOOP = TWO_ROWS ? [0, 1, 2, 5, 4, 3] : [...Array(N).keys()];   // orden en que «la ola» corre las conchas
    // Ronda: cada lugar va a un punto del círculo; se reparten por orden de izquierda a derecha para que nadie se cruce.
    const baseAng = c => -Math.PI / 2 + c * 2 * Math.PI / N;
    const byX = (a, b) => (Math.abs(a[0] - b[0]) > 1e-6 ? a[0] - b[0] : a[1] - b[1]);
    const circOrder = [...Array(N).keys()].sort((a, b) => byX([Math.cos(baseAng(a)), Math.sin(baseAng(a))], [Math.cos(baseAng(b)), Math.sin(baseAng(b))]));
    const slotOrder = TWO_ROWS ? [0, 3, 1, 4, 2, 5] : [...Array(N).keys()];
    const S2C = [], C2S = [];
    slotOrder.forEach((s, k) => { S2C[s] = circOrder[k]; C2S[circOrder[k]] = s; });

    function layout() {
      const top = api.top, bot = api.bottom;
      L.sand = top + (bot - top) * 0.36;
      L.y = top + (bot - top) * 0.56;
      if (TWO_ROWS) {
        L.size = 70;
        L.gap = (W - 28) / 3;
        L.rowGap = clamp((bot - L.sand) * 0.3, 74, 104);
        L.yB = L.y - L.rowGap * 0.25; L.yF = L.yB + L.rowGap;
      } else {
        L.size = Math.min(84, (W - 28) / N - 8);
        L.gap = (W - 28) / N;
        L.yB = L.yF = L.y;
      }
      L.cy = (L.yB + L.yF) / 2;
      L.rx = Math.min(140, W / 2 - L.size * 0.55 - 8);
      L.ry = TWO_ROWS ? L.rowGap * 0.62 : L.size * 0.75;
      if (!step) for (const s of shells) { const p = slotPos(s.slot); s.x = p.x; s.y = p.y; }
    }
    function slotPos(i) {
      if (TWO_ROWS) return { x: W / 2 + ((i % 3) - 1) * L.gap, y: i < 3 ? L.yB : L.yF };
      return { x: W / 2 + (i - (N - 1) / 2) * L.gap, y: L.y };
    }
    const ePos = a => ({ x: W / 2 + L.rx * Math.cos(a), y: L.cy + L.ry * Math.sin(a) });
    const mix = (a, b, u) => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) });

    // ───────────────────────── Rondas ─────────────────────────
    function startRound() {
      const prog = clamp(api.score / GOAL);
      pearls = has(31) && (first(31) || (!first(36) && api.rand() < P_TWO)) ? 2 : 1;
      const goldRound = pearls === 1 && has(36) && (first(36) || api.rand() < P_GOLD);
      const order = api.shuffle([...Array(N).keys()]);
      shells = Array.from({ length: N }, (_, i) => ({ slot: i, x: 0, y: 0, open: 0, ov: 0, openTo: 0, pearl: false, gold: false, decoy: false, found: false, bob: 0 }));
      for (let k = 0; k < pearls; k++) { const s = shells[order[k]]; s.pearl = true; s.gold = goldRound; }
      if (has(16) && (first(16) || api.rand() < P_DECOY)) shells[order[pearls]].decoy = true;
      found = 0; picked = null; right = false; step = null; wait = 0;
      layout();
      steps = Math.max(2, Math.round(STEPS0 + STEPS_UP * prog + (api.rand() - 0.5) * 1.2));
      if (pearls === 2) steps = Math.max(2, Math.round(steps * 0.8));
      stepIdx = 0;
      rondaAt = has(41) && (first(41) || api.rand() < P_RONDA) ? api.randInt(0, steps - 1) : -1;
      fishAt = has(51) && (first(51) || api.rand() < P_FISH) ? api.randInt(0, Math.max(0, steps - 2)) : -1;
      phase = 'show'; phaseT = 0;
      showT = SHOW_T + (round === 0 ? 0.5 : 0) + (pearls === 2 ? 0.35 : 0);
      for (const s of shells) if (s.pearl) s.openTo = 1;
      if (pearls === 2 && !(round === 0 && NEWS[LV])) api.hint('⚪⚪ ¡Dos perlas esta vez!', 1500);
    }

    // Dos conchas para cambiar; con P_INVOLVE una de ellas guarda perla (si no, la perla casi nunca se movería).
    function pickPair(used) {
      const free = shells.filter(s => !used.has(s));
      const withPearl = free.filter(s => s.pearl);
      const a = withPearl.length && api.rand() < P_INVOLVE ? api.pick(withPearl) : api.pick(free);
      let rest = free.filter(s => s !== a);
      if (!TWO_ROWS) { const near = rest.filter(s => Math.abs(s.slot - a.slot) <= NEAR); if (near.length) rest = near; }
      return [a, api.pick(rest)];
    }

    const pairMovers = (a, b) => [{ s: a, from: a.slot, to: b.slot, arc: 0.55 * ARC }, { s: b, from: b.slot, to: a.slot, arc: 0.4 * ARC }];
    // ¿Se encimarían las conchas a medio camino? Dos conchas iguales en el mismo sitio no se pueden seguir con la vista.
    function clashes(movers) {
      const moving = new Set(movers.map(m => m.s));
      const still = shells.filter(s => !moving.has(s)).map(s => slotPos(s.slot));
      const probe = { kind: 'swap', fake: false, t: 0, dur: 1 };
      for (const r of [0.2, 0.35, 0.5, 0.65, 0.8]) {
        probe.t = r;
        const ps = movers.map(m => stepPos(m, probe));
        for (let i = 0; i < ps.length; i++) {
          for (let j = i + 1; j < ps.length; j++) if ((i >> 1) !== (j >> 1) && Math.hypot(ps[i].x - ps[j].x, ps[i].y - ps[j].y) < L.size * 0.8) return true;
          for (const q of still) if (Math.hypot(ps[i].x - q.x, ps[i].y - q.y) < L.size * 0.5) return true;
        }
      }
      return false;
    }
    // `count` parejas que se cambian a la vez sin encimarse (o null si no se encontraron).
    function makePairs(count) {
      for (let tries = 0; tries < 12; tries++) {
        const ms = [], used = new Set();
        for (let p = 0; p < count; p++) {
          const [a, b] = pickPair(used);
          if (!a || !b) break;
          ms.push(...pairMovers(a, b));
          used.add(a); used.add(b);
          // en los niveles suaves las parejas no se cruzan entre sí (cada una cambia en su propio tramo)
          if (LV < 31 && !TWO_ROWS) { const lo = Math.min(a.slot, b.slot), hi = Math.max(a.slot, b.slot); for (const s of shells) if (s.slot >= lo && s.slot <= hi) used.add(s); }
        }
        if (ms.length === count * 2 && !clashes(ms)) return ms;
      }
      return null;
    }
    // Último recurso: dos vecinas de la misma fila.
    function nextDoorPair() {
      const a = api.pick(shells), col = TWO_ROWS ? a.slot % 3 : a.slot;
      const b = shells.find(s => s.slot === (col > 0 ? a.slot - 1 : a.slot + 1));
      return pairMovers(a, b);
    }

    function startStep() {
      const last = stepIdx === steps - 1;
      const prog = clamp(api.score / GOAL);
      const forced = round === 0 && stepIdx === 0 && FORCE[LV] && !(FORCE[LV] === 'triple' && N < 6) ? FORCE[LV] : null;
      let kind = 'swap';
      if (stepIdx === rondaAt) kind = 'ronda';
      else if (forced) kind = forced;
      else {
        let r = api.rand();
        if (N >= 6 && (r -= P_TRIPLE) < 0) kind = 'triple';
        else if (N >= 4 && (r -= P_DOUBLE) < 0) kind = 'double';
        else if ((r -= P_SHIFT) < 0) kind = 'shift';
        else if (!last && stepIdx > 0 && (r -= P_FAKE) < 0) kind = 'fake';
      }
      // cambios de parejas: si las conchas se fueran a encimar a medio camino se eligen otras parejas
      let movers = [];
      if (kind === 'triple') { movers = makePairs(3); if (!movers) kind = 'double'; }
      if (kind === 'double') { movers = makePairs(2); if (!movers) kind = 'swap'; }
      if (kind === 'swap' || kind === 'fake') movers = makePairs(1) || nextDoorPair();
      const rapid = kind !== 'ronda' && ((LV === 81 && round === 0 && stepIdx === 1) || api.rand() < P_RAPID);
      const slow = 1 - 0.12 * prog;
      const st = { kind, t: 0, dur: 1, movers, fake: kind === 'fake', rapid };
      if (kind === 'shift') {
        // la ola corre todas las conchas un lugar; en una fila, la de la punta da la vuelta por detrás
        const dir = api.rand() < 0.5 ? 1 : -1;
        for (const s of shells) {
          const to = LOOP[(LOOP.indexOf(s.slot) + dir + N) % N];
          st.movers.push({ s, from: s.slot, to, vert: !TWO_ROWS && Math.abs(to - s.slot) > 1 ? -1.25 : -0.14 });
        }
      } else if (kind === 'ronda') {
        // se juntan en círculo, giran k lugares y vuelven a su fila
        const k = api.randInt(1, N - 1), dir = api.rand() < 0.5 ? 1 : -1;
        st.g = Math.max(0.3, DUR0 * 0.85);
        st.sp = DUR0 * (0.9 + 0.38 * k) * slow;
        st.ang = dir * k * 2 * Math.PI / N;
        for (const s of shells) { const c = S2C[s.slot]; st.movers.push({ s, from: s.slot, to: C2S[(c + dir * k + N * 4) % N], c }); }
      }
      st.dur = kind === 'ronda' ? st.g * 2 + st.sp : DUR0 * slow * MUL[kind] * (rapid ? 0.68 : 1) * lerp(0.92, 1.08, api.rand());
      step = st;
      if (stepIdx === fishAt) spawnFish();
      api.sfx('whoosh');
    }

    // Posición de una concha durante un cambio.
    function stepPos(m, st) {
      if (st.kind === 'ronda') {
        const T = st.t, a0 = baseAng(m.c);
        if (T < st.g) return mix(slotPos(m.from), ePos(a0), ease.inOut(T / st.g));
        if (T < st.g + st.sp) return ePos(a0 + st.ang * ease.inOut((T - st.g) / st.sp));
        return mix(ePos(a0 + st.ang), slotPos(m.to), ease.inOut(clamp((T - st.g - st.sp) / st.g)));
      }
      const raw = clamp(st.t / st.dur);
      const k = st.fake ? Math.sin(Math.PI * raw) * 0.5 : ease.inOut(raw);   // el amago llega a la mitad y regresa
      const p0 = slotPos(m.from), p1 = slotPos(m.to);
      const x = lerp(p0.x, p1.x, k), y = lerp(p0.y, p1.y, k), h = Math.sin(Math.PI * k);
      if (m.vert !== undefined) return { x, y: y + m.vert * L.size * h };
      // las dos conchas que se cambian se esquivan: una por arriba y otra por abajo (más alto cuanto más lejos van)
      const dx = p1.x - p0.x, dy = p1.y - p0.y, len = Math.hypot(dx, dy) || 1;
      const a = m.arc * L.size * h * clamp(1 + 0.35 * (len / L.gap - 1), 1, 1.8);
      return { x: x + dy / len * a, y: y - dx / len * a };
    }

    function spawnFish() {
      const dir = api.rand() < 0.5 ? 1 : -1;
      fish = {
        t: 0, dur: lerp(2.0, 1.6, D), dir,
        list: Array.from({ length: 8 }, (_, i) => ({ dx: -140 + i * 40 + api.randRange(-12, 12), dy: api.randRange(-30, 24), size: api.randRange(24, 31), e: i % 3 === 1 ? '🐠' : '🐟', ph: api.randRange(0, 6) })),
      };
    }

    startRound();
    api.hint(NEWS[LV] || 'Mira dónde se guarda la perla', NEWS[LV] ? 3400 : 2200);

    // ───────────────────────── Dibujo ─────────────────────────
    function drawShell(g, s) {
      const z = L.size / 84;
      g.save(); g.translate(s.x, s.y - s.bob); g.scale(z, z);
      kit.shadow(g, 0, 26, 36, 8, 0.2);
      if (s.decoy) kit.circle(g, 0, 4, 46 + Math.sin(t * 5) * 3, 'rgba(255,236,150,0.28)');
      // valva de abajo
      g.fillStyle = s.decoy ? '#f5d98c' : '#f3c9b8'; g.beginPath(); g.ellipse(0, 14, 36, 14, 0, 0, Math.PI); g.fill();
      g.fillStyle = s.decoy ? '#e9c46a' : '#e8b09c'; g.beginPath(); g.ellipse(0, 14, 36, 6, 0, 0, 6.28); g.fill();
      // perla (blanca o dorada)
      if (s.pearl && s.open > 0.15) {
        const glow = 0.5 + Math.sin(t * 6) * 0.2, o = clamp(s.open);
        kit.circle(g, 0, 8, 20, s.gold ? `rgba(255,214,90,${0.5 * glow * o})` : `rgba(255,255,255,${0.35 * glow * o})`);
        kit.circle(g, 0, 8, 11, s.gold ? '#ffd24a' : '#fdfbff'); kit.circle(g, -3.5, 4.5, 3.4, '#ffffff');
        kit.circle(g, 2, 11, 7, s.gold ? 'rgba(230,150,30,0.35)' : 'rgba(210,190,255,0.35)');
      }
      // valva de arriba (abanico con estrías) que se levanta
      g.translate(0, 14); g.rotate(-clamp(s.open, -0.1, 1.2) * 1.05); g.translate(0, -14);
      const lift = -clamp(s.open, 0, 1.2) * 6;
      g.fillStyle = s.decoy ? '#ffd970' : '#ffb59a'; g.beginPath(); g.moveTo(-38, 14 + lift);
      for (let i = 0; i <= 6; i++) { const a = Math.PI + (i / 6) * Math.PI, r = 40 + (i % 2 ? 0 : 3); g.lineTo(Math.cos(a) * r * 0.95, 14 + lift + Math.sin(a) * r * 0.92); }
      g.closePath(); g.fill();
      g.strokeStyle = s.decoy ? '#e6ad2e' : '#f08f70'; g.lineWidth = 2.4; g.lineCap = 'round';
      for (let i = 1; i < 6; i++) { const a = Math.PI + (i / 6) * Math.PI; g.beginPath(); g.moveTo(0, 12 + lift); g.lineTo(Math.cos(a) * 34, 14 + lift + Math.sin(a) * 33); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(-12, -8 + lift, 9, 4, -0.6, 0, 6.28); g.fill();
      g.fillStyle = s.decoy ? '#e6ad2e' : '#f08f70'; g.beginPath(); g.ellipse(0, 15 + lift, 9, 4, 0, 0, 6.28); g.fill();
      if (s.decoy) {
        // destellos: la concha brillante llama la atención… pero no guarda la perla
        const tw = 0.5 + 0.5 * Math.sin(t * 7 + s.slot);
        kit.star(g, 14, -14 + lift, 4 + tw * 4, '#fffbe0', t * 2);
        kit.star(g, -20, -2 + lift, 3 + (1 - tw) * 3, '#fffbe0', -t * 2);
      }
      g.restore();
      // la perla dorada avisa que vale 2
      if (s.gold && s.pearl && s.open > 0.5) kit.text(g, '×2', s.x + L.size * 0.42, s.y - L.size * 0.72, { size: 18, color: '#ffd24a', stroke: '#8a5a1c', strokeWidth: 4 });
    }

    function drawScene(g) {
      const H = api.H, wy = L.sand - 60;
      kit.sky(g, W, H, SCN.sky);
      if (THEME === 'night') { kit.stars(g, W, wy, t, 34, 11); kit.moon(g, W - 70, api.top + 58, 20); }
      else if (THEME === 'sunset') kit.sun(g, W - 84, wy - 4, 26, t);
      else if (THEME === 'gold') kit.sun(g, W / 2 + 40, wy - 2, 30, t);
      else kit.sun(g, 56, api.top + 40, 20, t);
      kit.water(g, W, H, wy, t, SCN.water[0], SCN.water[1]);
      if (THEME !== 'day') {
        // reflejo de la luna o del sol sobre el mar
        const rx = THEME === 'night' ? W - 70 : THEME === 'sunset' ? W - 84 : W / 2 + 40;
        g.fillStyle = THEME === 'night' ? 'rgba(255,246,200,0.5)' : 'rgba(255,226,140,0.6)';
        for (let i = 0; i < 4; i++) { const w = 34 - i * 6 + Math.sin(t * 2 + i) * 4; kit.rr(g, rx - w / 2, wy + 10 + i * 10, w, 3.2, 2); g.fill(); }
      }
      // playa
      g.fillStyle = SCN.sand; g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W + 8; x += 8) g.lineTo(x, L.sand + Math.sin(x * 0.03 + 1) * 8);
      g.lineTo(W, H); g.closePath(); g.fill();
      for (let i = 0; i < 16; i++) kit.circle(g, (i * 83) % W, L.sand + 40 + ((i * 57) % Math.max(40, H - L.sand - 60)), 2.2, SCN.dots);
      kit.emoji(g, '🐚', 34, H - 46, 22, { rot: -0.4 }); kit.emoji(g, '⭐', W - 40, H - 36, 18, { rot: 0.3 }); kit.emoji(g, '🦀', W - 70, L.sand + 26, 20);
      for (const b of bubbles) if (b.y < L.sand - 30 && b.y > wy) kit.bubble(g, b.x + Math.sin(t * 2 + b.ph) * 4, b.y, b.r, 0.5);
      // el comerciante mira atento
      const happy = (phase === 'reveal' && right) || phase === 'celebrate', sad = phase === 'reveal' && !right;
      kit.person(g, 42, L.sand + 34, 1.15, { robe: '#3d7ea6', sash: '#f0c35a', beard: true, hair: '#3b2a20', skin: '#c99a6a', arms: happy ? 'up' : 'down', sad, t });
      kit.fillRR(g, 62, L.sand + 6, 22, 16, 5, '#a9744a'); kit.circle(g, 73, L.sand + 6, 4, PAL.sun);
      if (THEME === 'night') { g.fillStyle = 'rgba(20,28,80,0.2)'; g.fillRect(0, wy, W, H - wy); }
      if (THEME === 'gold') for (let i = 0; i < 6; i++) kit.star(g, (i * 67 + 30) % W, wy + 14 + ((i * 29) % 40), 2.5 + 1.5 * Math.sin(t * 3 + i), 'rgba(255,240,170,0.9)', t + i);
    }

    function drawFish(g) {
      const k = clamp(fish.t / fish.dur), cx = fish.dir > 0 ? lerp(-180, W + 180, k) : lerp(W + 180, -180, k);
      const y0 = L.cy - L.size * 0.25;
      for (const f of fish.list) kit.emoji(g, f.e, cx + f.dx, y0 + f.dy + Math.sin(t * 6 + f.ph) * 3, f.size, { flip: fish.dir > 0, alpha: 0.95 });
    }

    function drawDove(g) {
      const k = dove.t;
      let x, y;
      if (k < 0.9) { const u = ease.outCubic(k / 0.9); x = lerp(W + 40, 100, u); y = lerp(api.top + 30, L.sand - 44, u); }
      else { const u = (k - 0.9) / 0.8; x = lerp(100, -60, u); y = lerp(L.sand - 44, api.top + 10, u); }
      kit.dove(g, x, y, 0.75, { dir: -1, flap: (Math.sin(t * 16) + 1) / 2 });
      if (k < 0.9) kit.heart(g, x - 30, y - 2, 0.9);
    }

    // ───────────────────────── Toques ─────────────────────────
    function hitShell(x, y) {
      let best = null, bd = 1e9;
      for (const s of shells) {
        if (s.found) continue;
        const dx = Math.abs(x - s.x), dy = y - (s.y - L.size * 0.12);
        if (dx > L.size * 0.62 || dy < -L.size * 0.72 || dy > L.size * 0.55) continue;
        const d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = s; }
      }
      return best;
    }

    return {
      update(dt) {
        t += dt; phaseT += dt;
        for (const b of bubbles) { b.y -= b.v * dt; if (b.y < api.top - 10) { b.y = api.H + 10; b.x = api.randRange(10, W - 10); } }
        // tapas de las conchas: resorte suave (se abren con un saltito)
        for (const s of shells) {
          s.ov += ((s.openTo - s.open) * 220 - s.ov * 19) * dt;
          s.open = clamp(s.open + s.ov * dt, -0.15, 1.25);
        }
        if (fish) { fish.t += dt; if (fish.t > fish.dur) fish = null; }
        if (dove) {
          dove.t += dt;
          if (!dove.given && dove.t > 0.9) {
            dove.given = true;
            if (api.lives < 3) api.addLife();
            api.sfx('coo');
            api.burst(100, L.sand - 40, { emoji: '❤️', count: 4, speed: 90, size: 16, gravity: -30 });
          }
          if (dove.t > 1.7) dove = null;
        }

        if (phase === 'show') {
          if (phaseT > showT) { for (const s of shells) s.openTo = 0; phase = 'close'; phaseT = 0; }
        } else if (phase === 'close') {
          if (phaseT > CLOSE_T) { phase = 'shuffle'; phaseT = 0; startStep(); }
        } else if (phase === 'shuffle') {
          if (step) {
            step.t += dt;
            for (const m of step.movers) { const p = stepPos(m, step); m.s.x = p.x; m.s.y = p.y; }
            if (step.t >= step.dur) {
              if (!step.fake) for (const m of step.movers) m.s.slot = m.to;
              step = null; stepIdx++;
              for (const s of shells) { const p = slotPos(s.slot); s.x = p.x; s.y = p.y; }
              wait = GAP;
            }
          } else if ((wait -= dt) <= 0) {
            if (stepIdx < steps) startStep();
            else {
              phase = 'choose'; phaseT = 0; api.sfx('pop');
              if (round < 2) api.hint(pearls === 2 ? '¿Dónde están las dos perlas?' : '¿Dónde está la perla?', 1600);
            }
          }
        } else if (phase === 'choose') {
          for (const s of shells) s.bob = s.found ? 0 : Math.abs(Math.sin(t * 3 + s.slot)) * 4;
        } else if (phase === 'reveal') {
          // si se equivocó, se enseña dónde estaban las perlas
          if (!right && phaseT > 0.6) for (const s of shells) if (s.pearl) s.openTo = 1;
          if (pendingLose && phaseT > 1.6) { pendingLose = false; phase = 'done'; api.loseLife(picked.x, picked.y - 30); return; }
          if (phaseT > (right ? OK_T : 1.9)) {
            if (api.score >= GOAL) {
              phase = 'celebrate'; phaseT = 0;
              for (const s of shells) if (s.pearl) s.openTo = 1;
              api.sfx('sparkle');
            } else { phase = 'reset'; phaseT = 0; for (const s of shells) s.openTo = 0; }
          }
        } else if (phase === 'reset') {
          if (phaseT > 0.26) { round++; startRound(); }
        } else if (phase === 'celebrate') {
          if (phaseT < 1.2 && Math.floor((phaseT - dt) / 0.4) !== Math.floor(phaseT / 0.4)) api.burst(api.randRange(60, W - 60), L.yB - L.size * 0.6, { emoji: '✨', count: 5, speed: 120, size: 18 });
          if (phaseT > 1.9) { phase = 'done'; api.end({ won: true }); }
        }
      },

      draw(g) {
        drawScene(g);
        // conchas (las que van por detrás primero)
        for (const s of [...shells].sort((a, b) => a.y - b.y)) drawShell(g, s);
        if (fish) drawFish(g);
        if (dove) drawDove(g);
        const topY = L.yB - L.size * 0.95;
        if (phase === 'choose') {
          kit.text(g, '👇', W / 2, topY - Math.abs(Math.sin(t * 4)) * 6, { size: 26 });
          if (pearls === 2) kit.text(g, `Perlas: ${found} de 2`, W / 2, L.yF + L.size * 0.72, { size: 16, color: '#fff', stroke: 'rgba(30,90,140,0.7)', strokeWidth: 4 });
        }
        if (phase === 'reveal' && right && phaseT < 1) kit.text(g, pearls === 2 ? '¡Las dos!' : '¡La encontraste!', W / 2, topY - 8, { size: 22, color: '#fff', stroke: PAL.coralDeep, strokeWidth: 5 });
        if (phase === 'celebrate' || (phase === 'done' && right)) kit.text(g, '¡La perla de gran valor!', W / 2, topY - 8, { size: 22, color: '#fff', stroke: PAL.coralDeep, strokeWidth: 5 });
        kit.text(g, `Ronda ${round + 1}`, W - 16, api.top + 12, { size: 14, align: 'right', color: '#fff', stroke: 'rgba(30,90,140,0.6)', strokeWidth: 4 });
      },

      pointerDown(x, y) {
        if (phase !== 'choose') return;
        const s = hitShell(x, y);
        if (!s) return;
        s.openTo = 1; s.bob = 0;
        if (s.pearl) {
          s.found = true; found++;
          api.addScore(s.gold ? 2 : 1, s.x, s.y - L.size * 0.7);
          api.sfx('match');
          api.burst(s.x, s.y, { emoji: s.gold ? '🌟' : '✨', count: 6, speed: 110, size: 18 });
          if (found >= pearls || api.score >= GOAL) {
            picked = s; right = true; phase = 'reveal'; phaseT = 0;
            for (const k of shells) k.bob = 0;
            streak++;
            if (has(46) && streak >= 3 && api.lives < 3 && !dove) { dove = { t: 0, given: false }; streak = 0; }
          }
        } else {
          picked = s; right = false; phase = 'reveal'; phaseT = 0; streak = 0;
          for (const k of shells) k.bob = 0;
          api.sfx('wrong');
          if (s.decoy) api.floatText(s.x, s.y - L.size * 0.9, '¡Solo brillaba!', { size: 16 });
          // con la última vida, primero se enseña dónde estaba la perla
          if (api.lives > 1) api.loseLife(s.x, s.y - 30); else pendingLose = true;
        }
      },

      resize() { layout(); },

      // Solo lectura, para pruebas. `shells` va en orden fijo; `pearl` es la verdad (el bot solo la mira mientras se ve).
      get debug() {
        return {
          phase, round, level: LV, goal: GOAL, n: N, size: L.size, pearls, found, steps, stepIdx,
          step: step ? step.kind : null, theme: THEME, top: api.top, fish: !!fish, dove: !!dove,
          shells: shells.map(s => ({ x: s.x, y: s.y, open: s.open, pearl: s.pearl, found: s.found, decoy: s.decoy, gold: s.gold })),
        };
      },
    };
  },
};
