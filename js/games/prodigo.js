// "De regreso a casa" — parábola del hijo pródigo (Lucas 15, 11-32).
//
// Carrera de 3 carriles vista desde atrás y un poco desde arriba. El hijo camina de regreso a la casa de su padre:
// sale de una tierra lejana, seca y gris (con cerditos y lodo, como en la historia) y, corazón a corazón, el paisaje
// se vuelve verde. Tocar la mitad izquierda / derecha (o deslizar, o las flechas) cambia de carril. Los charcos, las
// piedras, las zarzas, los cerditos, los toneles y el agua de los arroyos quitan una vida; los corazones suman.
// Al juntar la meta del nivel (api.goal) los estorbos del camino se vuelven flores y aparece la casa: el padre lo ve
// de lejos, SALE CORRIENDO y lo abraza → api.end({ won: true }). Si se acaban las vidas, el nivel se pierde.
//
// NIVELES (1..100). api.difficulty sube la velocidad, acerca las filas y hace más frecuentes las filas dobles y las
// novedades. Dentro de la partida todo sube un poquito más a medida que se juntan corazones (rampa suave).
// Novedades (con cartelito «¡Nuevo: …!» en el nivel en que aparecen; ese nivel las enseña pronto y sin apuro):
//    6 cerditos · 11 zarzas y filas con un solo carril libre · 16 pan (devuelve una vida) · 21 cerditos que cruzan
//   26 corazón dorado (vale 3) · 31 arroyos con puentecitos · 41 charcos grandes · 46 camino al atardecer
//   51 toneles que ruedan hacia ti · 56 Palomita te cuida de un tropiezo · 61 caminos en zigzag
//   66 arroyos con un solo puente · 71 de noche, con faroles y luciérnagas · 76 cerditos que cruzan todo el camino
//   81 cerditos que salen del campo en filas dobles · 91 el gran regreso, al amanecer dorado
//
// El recorrido se genera por delante del jugador (con api.rand) y cumple estas reglas de justicia:
//   · en cada fila queda al menos un carril libre, y desde cualquier carril libre de la fila anterior se llega a uno
//     libre de la siguiente con UN solo cambio (si no, la fila se aleja más);
//   · los cerditos que cruzan ya están quietos en su carril final mucho antes de llegar (SETTLE);
//   · después de un tonel solo viene una fila sencilla que deja libre su carril; ningún premio lleva a un obstáculo.
export default {
  id: 'prodigo',
  // Meta: corazones que hay que juntar para que aparezca la casa del padre (la partida sigue hasta lograrlo).
  levels: {
    goal: [5, 30], curve: 1, lives: 3, selfEnd: true,
    goalLabel: n => `Junta ${n} corazones y llega a casa`,
  },
  create(api) {
    const { kit } = api;
    const { PAL, clamp, lerp, ease } = kit;
    const W = api.W, CX = W / 2;

    // ───────────────────────── Nivel ─────────────────────────
    const LV = Math.max(1, Math.round(api.level || 1));
    const DF = clamp(api.difficulty || 0);
    const GOAL = Math.max(1, Math.round(api.goal || 15));
    const has = n => LV >= n;                                   // ¿ya apareció esta novedad?
    const ramp = (n, span) => clamp((LV - n) / span);           // 0 cuando aparece una novedad → 1 «span» niveles después
    const NEWS = {
      6: '🐷 ¡Nuevo: cerditos en el camino!',
      11: '🌿 ¡Nuevo: zarzas! A veces queda un solo carril libre',
      16: '🍞 ¡Nuevo: pan! Te devuelve una vida',
      21: '🐷 ¡Nuevo: cerditos que cruzan! Mira a dónde van',
      26: '💛 ¡Nuevo: corazón dorado! Vale 3',
      31: '🌉 ¡Nuevo: arroyos! Cruza por el puentecito',
      41: '💧 ¡Nuevo: charcos grandes!',
      46: '🌇 ¡Nuevo: camino al atardecer!',
      51: '👀 ¡Nuevo: toneles que ruedan hacia ti!',
      56: '🕊️ ¡Nuevo: {Palomita|Palomito} te cuida de un tropiezo!',
      61: '❤️ ¡Nuevo: caminos en zigzag! Sigue los corazones',
      66: '🌉 ¡Nuevo: arroyos con un solo puente!',
      71: '🌙 ¡Nuevo: camino de noche con luciérnagas!',
      76: '🐷 ¡Nuevo: cerditos que cruzan todo el camino!',
      81: '🐷 ¡Nuevo: cerditos que salen del campo!',
      91: '🌅 ¡Nuevo: el gran regreso al amanecer!',
    };
    // Cómo se enseña cada novedad en su nivel: una fila tranquila con ella al principio.
    const SHOW = { 6: 'pig', 11: 'double', 16: 'bread', 21: 'cross', 26: 'gold', 31: 'stream2', 41: 'big', 51: 'barrel', 56: 'dove', 61: 'zig', 66: 'stream1', 76: 'cross2', 81: 'mix' }[LV] || '';
    const THEME = LV >= 91 ? 'golden' : LV >= 71 ? 'night' : LV >= 46 ? 'sunset' : 'dawn';

    // ───────────────────────── Medidas del mundo ─────────────────────────
    // Unidades de mundo = píxeles lógicos a la altura del jugador. `d` es la distancia a lo largo del camino.
    const LANE = 84;                 // ancho de carril
    const ROAD_HALF = 136;           // medio ancho del camino
    const VIEW = 760;                // cuánto camino se ve por delante
    const FAR_S = 0.5, Q = 1 / FAR_S - 1;   // escala de las cosas en el horizonte
    const LOOK = VIEW + 420;         // hasta dónde se tiene generado el camino por delante
    const INVULN = 1.2;              // segundos de protección después de un tropiezo
    const MOVE0 = 700;               // los cerditos que cruzan empiezan a caminar a esta distancia…
    const HERO_S = 1.25, DAD_S = 1.42;
    const HUG_TIME = 2.5;

    // ───────────────────────── Dificultad del nivel ─────────────────────────
    const DH = clamp((DF - 0.6) / 0.4);                         // empujón extra para los niveles difíciles (60 → 100)
    const SETTLE = lerp(360, 310, DH);                          // …y a esta distancia ya están quietos en su carril final
    const V_START = lerp(185, 288, DF) + 45 * DH, V_GOAL = lerp(225, 345, DF) + 70 * DH;                     // velocidad al salir / cerca de la meta
    const G_START = lerp(1.9, 1.12, Math.pow(DF, 0.8)) - 0.12 * DH, G_GOAL = lerp(1.62, 0.98, Math.pow(DF, 0.8)) - 0.16 * DH;   // segundos entre filas
    const HPR = lerp(0.45, 0.29, clamp((DF - 0.2) / 0.8)) - 0.035 * DH;   // corazones por fila (alarga la carrera en los niveles altos)
    const P_DOUBLE = has(11) ? lerp(0.12, 0.46, ramp(11, 75)) + 0.12 * DH : 0;
    const P_CROSS = has(21) ? lerp(0.16, 0.34, ramp(21, 60)) : 0;
    const P_STREAM = has(31) ? lerp(0.07, 0.12, ramp(31, 60)) : 0;
    const P_BIG = has(41) ? 0.3 : 0;
    const P_BARREL = has(51) ? lerp(0.14, 0.28, ramp(51, 40)) : 0;
    const ROLL_K = lerp(0.45, 0.7, ramp(51, 49));               // qué tan rápido ruedan los toneles (respecto al hijo)
    const P_ZIG = has(61) ? lerp(0.05, 0.09, ramp(61, 35)) : 0;
    const P_ONE_BRIDGE = has(66) ? lerp(0.3, 0.6, ramp(66, 30)) : 0;
    const P_CROSS2 = has(76) ? lerp(0.3, 0.5, ramp(76, 20)) : 0;
    const P_MIX = has(81) ? lerp(0.25, 0.45, ramp(81, 19)) : 0;
    const BREAD_EVERY = Math.round(lerp(12, 34, DF));          // filas mínimas entre un pan y otro (más escaso arriba)
    const speedAt = q => lerp(V_START, V_GOAL, q);
    const gapAt = q => lerp(G_START, G_GOAL, q);
    const GOOD = { heart: 1, gold: 1, bread: 1, dove: 1 };

    // ───────────────────────── Estado ─────────────────────────
    let H = api.H, top = api.top, horY = 0, plY = 0, yv = 0, nearK = 1, gradDirty = true;
    let skyA = null, skyB = null, skyC = null, hazeG = null;
    let t = 0, dist = 0, curV = 0, vBase = V_START, walkT = 0, lastFoot = 0, lastPct = -1, land = 0;
    let state = 'run', stT = 0;           // run → seen → meet → hug
    let lane = 1, px = 0, pv = 0;         // carril, posición lateral (mundo) y su velocidad
    let invuln = 0, hurtT = 0, slowT = 0, joyT = 0, over = false, ended = false;
    let shield = false, shieldGone = 0;   // Palomita que cuida del siguiente tropiezo
    let touched = false, tipA = 0, bubbleT = 3;
    let first = 0, firstScen = 0, almostHome = false, sparkled = false, newRobe = 0;
    let homeSet = false, goalD = 0, D_HOUSE = Infinity, SEEN_AT = Infinity;
    let dadD = 0, dadX = 0, dadT = 0, gap0 = 1, rainT = 0;
    let gid = null, gx = 0, gy = 0, gLane = 1, gDir = 0, gSwiped = false;
    const puffs = [], rain = [], drawList = [];
    const hero = { cat: 'hero', z: 0 }, dad = { cat: 'dad', z: 0 }, house = { cat: 'house', d: 0, z: 0, X: 0 };
    const byDepth = (a, b) => b.z - a.z;

    // ───────────────────────── Recorrido (se genera por delante) ─────────────────────────
    const objs = [];                 // obstáculos, corazones y premios, ordenados por d
    let heartCount = 0, nextId = 1;
    function insertSorted(arr, o, from) {
      let i = arr.length;
      while (i > from && arr[i - 1].d > o.d) i--;
      arr.splice(i, 0, o);
      return o;
    }
    function put(kind, ln, d, extra) {
      const o = { cat: 'obj', id: nextId++, kind, lane: ln, d, z: d, X: (ln - 1) * LANE, done: false, taken: false, hit: false, fx: 0, ph: api.rand() * 6.28, good: !!GOOD[kind] };
      if (extra) Object.assign(o, extra);
      if (kind === 'heart') heartCount++;
      return insertSorted(objs, o, first);
    }
    // Dónde se dibuja algo a lo largo del camino: los toneles ruedan hacia el hijo; los arroyos van un poquito detrás
    // de lo que está en su fila (para que el puente quede debajo de los corazones).
    const zOf = o => (o.zf !== undefined ? o.zf : o.roll ? o.d + o.roll * (o.d - dist) : o.d + (o.zo || 0));
    function putPig(ln, d, x0) { return put('pig', ln, d, { mv: 1, x0, x1: (ln - 1) * LANE, X: x0, walking: false }); }

    // Lo que estorba cuenta la historia: cerditos y lodo en la tierra lejana, zarzas y piedras más cerca de casa.
    function obstacleKind(q) {
      const wMud = 1, wRock = 0.9 + 0.5 * q, wPig = has(6) ? 1.1 - 0.6 * q : 0, wBr = has(11) ? 0.8 + 0.3 * q : 0;
      let r = api.rand() * (wMud + wRock + wPig + wBr);
      if ((r -= wMud) < 0) return 'mud';
      if ((r -= wRock) < 0) return 'rock';
      if ((r -= wPig) < 0) return 'pig';
      return 'bramble';
    }

    let genD = 760, row = 0, prevD = 0, prevFree = [0, 1, 2], prevType = '', doubles = 0, acc = 1;
    let zigLeft = 0, zigLane = 1, zigDir = 1, avoid = -1, shown = false;
    let sinceStream = 0, sinceZig = 0, sinceBread = 0, sinceGold = 0, sinceDove = 0;
    const reach = l => prevFree.every(a => Math.abs(a - l) <= 1);
    const others = l => [0, 1, 2].filter(x => x !== l);

    function genRow() {
      const q = clamp(api.score / GOAL);
      let gap = speedAt(q) * gapAt(q);
      let d = genD, type, free = [0, 1, 2], nextAvoid = -1, force = '';
      const tut = LV <= 5;
      if (row === 0) type = 'h1c';
      else if (tut && row === 1) type = 'h1s';
      else if (tut && row === 2) type = 'mud1';
      else if (SHOW && !shown && row >= 2 && avoid < 0) {
        force = SHOW; shown = true;
        type = { pig: 'single', bread: 'single', cross: 'single', gold: 'single', barrel: 'single', dove: 'single', cross2: 'single',
          double: 'double', big: 'double', mix: 'double', stream2: 'stream', stream1: 'stream', zig: 'zigStart' }[SHOW];
        d += gap * 0.25;                          // la primera vez, con un poco más de espacio
      } else if (zigLeft > 0) type = 'zig';
      else if (avoid >= 0) type = 'single';        // después de un tonel: fila sencilla
      else {
        const wT = prevType === 'trail' || acc < 1.6 ? 0 : 0.14;
        const wS = sinceStream >= 6 ? P_STREAM : 0;
        const wZ = sinceZig >= 10 ? P_ZIG : 0;
        const wD = doubles >= 2 ? 0 : P_DOUBLE * (0.65 + 0.35 * q);
        let r = api.rand();
        if ((r -= wT) < 0) type = 'trail';
        else if ((r -= wS) < 0) type = 'stream';
        else if ((r -= wZ) < 0) type = 'zigStart';
        else if ((r -= wD) < 0) type = 'double';
        else type = 'single';
      }

      if (type === 'zigStart') {
        zigLeft = api.randInt(3, 5); sinceZig = 0;
        zigLane = api.pick([0, 1, 2].filter(reach));
        zigDir = zigLane === 0 ? 1 : zigLane === 2 ? -1 : (api.rand() < 0.5 ? 1 : -1);
        type = 'zig';
      } else if (type === 'zig') {
        if (zigLane + zigDir < 0 || zigLane + zigDir > 2) zigDir = -zigDir;
        zigLane += zigDir;
      }

      let reward = false;                         // ¿esta fila puede llevar corazón o premio?
      if (type === 'h1c') { put('heart', 1, d); acc -= 1; }
      else if (type === 'h1s') { put('heart', api.pick([0, 2]), d); acc -= 1; }
      else if (type === 'mud1') { put('mud', 1, d); free = [0, 2]; reward = true; }
      else if (type === 'trail') {
        // respiro: caminito de 2 o 3 corazones, recto o en diagonal
        const n = acc >= 2.6 ? 3 : 2;
        if (api.rand() < 0.55) {
          const ln = api.randInt(0, 2);
          for (let i = 0; i < n; i++) put('heart', ln, d + (i - (n - 1) / 2) * 96);
        } else {
          const dir = api.rand() < 0.5 ? 1 : -1;
          const a = n === 3 ? (dir > 0 ? 0 : 2) : (dir > 0 ? api.randInt(0, 1) : api.randInt(1, 2));
          for (let i = 0; i < n; i++) put('heart', a + dir * i, d + (i - (n - 1) / 2) * 150);
        }
        acc -= n;
      } else if (type === 'zig') {
        // fila doble que obliga a ir en zigzag; los corazones marcan el carril libre
        for (const l of others(zigLane)) put(api.rand() < 0.5 ? 'rock' : (has(11) ? 'bramble' : 'mud'), l, d);
        if (acc > -0.6) { put('heart', zigLane, d); acc -= 1; }
        free = [zigLane]; zigLeft--;
        gap *= 0.95 - 0.1 * DH;
      } else if (type === 'single') {
        let ln = api.randInt(0, 2);
        if (avoid >= 0 && ln === avoid) ln = api.pick(others(avoid));
        const r = api.rand();
        if (force === 'barrel' || (!force && r < P_BARREL)) {
          put('barrel', ln, d, { roll: ROLL_K, spin: 0 });
          nextAvoid = ln;
        } else if (force === 'cross' || force === 'cross2' || (!force && r < P_BARREL + P_CROSS)) {
          let x0;
          if (force === 'cross2' || (!force && api.rand() < P_CROSS2)) {
            // cruza todo el camino, de una orilla a la otra
            if (ln === 1) ln = api.pick([0, 2].filter(l => l !== avoid));
            x0 = (1 - ln) * LANE;
          } else if (ln !== 1 && has(81) && api.rand() < 0.4) x0 = (ln === 0 ? -1 : 1) * (ROAD_HALF + 70);   // sale del campo
          else x0 = ((ln === 1 ? api.pick([0, 2]) : 1) - 1) * LANE;                            // viene del carril de al lado
          putPig(ln, d, x0);
        } else {
          put(force === 'pig' ? 'pig' : force ? 'mud' : obstacleKind(q), ln, d);
        }
        free = others(ln); reward = true;
      } else if (type === 'double') {
        let big = force === 'big' || (!force && api.rand() < P_BIG), fl;
        if (big) {
          // el charco grande tapa dos carriles juntos: el libre es una orilla
          const e = [0, 2].filter(reach);
          if (e.length) fl = api.pick(e); else { fl = api.pick([0, 2]); d += gap * 0.4; }
        } else {
          fl = api.randInt(0, 2);
          if (!reach(fl)) { if (api.rand() < 0.5) fl = 1; else d += gap * 0.4; }
        }
        const blocked = others(fl);
        if (big) {
          const a = put('mud', blocked[0], d, { big: 1, main: 1 }), b = put('mud', blocked[1], d, { big: 1, main: 0 });
          a.pair = b; b.pair = a;
        } else {
          const pigLane = force === 'mix' || (!force && P_MIX && api.rand() < P_MIX) ? api.pick(blocked.filter(l => l !== 1)) : -1;
          for (const l of blocked) {
            if (l === pigLane) putPig(l, d, (l === 0 ? -1 : 1) * (ROAD_HALF + 70));
            else put(force === 'double' ? (l === blocked[0] ? 'bramble' : 'rock') : obstacleKind(q), l, d);
          }
        }
        free = [fl]; reward = true;
      } else if (type === 'stream') {
        let bridges;
        if (force === 'stream1' || (force !== 'stream2' && api.rand() < P_ONE_BRIDGE)) bridges = [api.pick([0, 1, 2].filter(reach))];
        else bridges = others(api.randInt(0, 2));
        put('stream', 1, d, { done: true, bridges, zo: 50, newB: 0 });
        for (let l = 0; l < 3; l++) if (!bridges.includes(l)) put('water', l, d);
        free = bridges; reward = true; sinceStream = 0;
      }

      // ── corazón o premio de la fila (siempre en un carril libre, al que se llega sin pasar por un obstáculo) ──
      if (reward) {
        acc += HPR;
        let spot = free.filter(l => prevFree.includes(l) && l !== avoid);
        if (!spot.length) spot = free;
        let special = '';
        if (force === 'bread' || (!force && has(16) && sinceBread >= BREAD_EVERY && api.lives < 3 && api.rand() < 0.35)) special = 'bread';
        else if (force === 'gold' || (!force && has(26) && sinceGold >= 14 && api.rand() < 0.3)) special = 'gold';
        else if (force === 'dove' || (!force && has(56) && sinceDove >= 22 && !shield && api.rand() < 0.3)) special = 'dove';
        if (special) {
          put(special, api.pick(spot), d);
          if (special === 'bread') sinceBread = 0;
          else if (special === 'gold') { sinceGold = 0; acc -= 2; }
          else sinceDove = 0;
        } else if (acc >= 1) {
          if (prevType !== 'trail' && avoid < 0 && type !== 'stream' && row > 4 && api.rand() < 0.45) put('heart', api.pick(spot), d - (d - prevD) / 2);
          else put('heart', api.pick(free), d);
          acc -= 1;
        }
      } else acc += HPR;

      doubles = type === 'double' ? doubles + 1 : type === 'zig' ? 2 : 0;
      avoid = nextAvoid;
      prevFree = free; prevType = type; prevD = d;
      genD = d + gap; row++;
      sinceStream++; sinceZig++; sinceBread++; sinceGold++; sinceDove++;
    }

    // Paisaje a los lados: de árboles secos y piedras… a olivos, flores y ovejitas (y faroles si es de noche).
    const scen = [];
    let scenD = 40, lampD = 160, lampSide = 1;
    function genScenery(limit) {
      while (scenD < limit) {
        const d = scenD, p = homeSet ? 0.9 : 0.85 * clamp(api.score / GOAL) + 0.05, r = api.rand();
        let type;
        if (p < 0.34) type = r < 0.3 ? 'dead' : r < 0.56 ? 'stone' : r < 0.86 ? 'dry' : 'pigS';
        else if (p < 0.64) type = r < 0.2 ? 'dead' : r < 0.38 ? 'stone' : r < 0.66 ? 'shrub' : r < 0.84 ? 'dry' : 'olive';
        else type = r < 0.26 ? 'tree' : r < 0.42 ? 'olive' : r < 0.58 ? 'bush' : r < 0.8 ? 'flower' : r < 0.92 ? 'grass' : 'sheep';
        const X = (api.rand() < 0.5 ? -1 : 1) * (ROAD_HALF + api.randRange(36, 215));
        const item = { cat: 'scen', type, X, d, z: d, k: api.randRange(0.85, 1.25), flip: api.rand() < 0.5 ? -1 : 1, ph: api.rand() * 6.28, col: api.randInt(0, 2) };
        if (!(homeSet && Math.abs(d - D_HOUSE) < 170 && Math.abs(X) < 260)) insertSorted(scen, item, firstScen);
        scenD += api.randRange(52, 118);
        if (THEME === 'night' && lampD < scenD && !(homeSet && Math.abs(lampD - D_HOUSE) < 200)) {
          insertSorted(scen, { cat: 'scen', type: 'lamp', X: lampSide * (ROAD_HALF + 30), d: lampD, z: lampD, k: 1, flip: 1, ph: lampD, col: 0 }, firstScen);
          lampD += 330; lampSide = -lampSide;
        }
      }
    }

    // ───────────────────────── Colores que cambian con el camino ─────────────────────────
    const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const RAMPS = {            // tierra lejana (gris) → campo seco → brotes → campos verdes de casa
      field: ['#b3aa9c', '#cdbd8c', '#b5cf7c', '#8fd16c'],
      band: ['#a9a092', '#c4b37e', '#aac671', '#84c860'],
      road: ['#8e8174', '#bd9c72', '#dcbb86', '#efd6a0'],
      edge: ['#7e7165', '#a98a62', '#c5a36f', '#d9bb80'],
      dash: ['#9d9084', '#cbab80', '#e8c994', '#f8e6b8'],
      hillA: ['#8d8d96', '#a8a68c', '#93bd7c', '#6cc070'],
      hillB: ['#a4a3aa', '#bdb99c', '#aed092', '#a8e08c'],
    };
    // Momento del día de cada tramo de niveles: cielo (lejos → camino → casa) y tinte del paisaje.
    const SKY = {
      dawn: { a: ['#78818f', '#a5abb6', '#cdccc8'], b: ['#8fb8f0', '#ffd9c2', '#fff0c4'], c: ['#6fc1f3', '#cdeeff', '#fff3d6'], tint: '#ffffff', k: 0, kr: 0, haze: 'rgba(255,255,255,0.42)', cloudA: '#8d95a6', cloudB: '#ffffff' },
      sunset: { a: ['#7d7a8c', '#a99ea6', '#d1c2b8'], b: ['#8f7be8', '#ff9e80', '#ffd49a'], c: ['#f08a6c', '#ffc27a', '#ffe9b0'], tint: '#ff8a5c', k: 0.16, kr: 0.1, haze: 'rgba(255,214,170,0.42)', cloudA: '#a68ea6', cloudB: '#ffd2bd' },
      night: { a: ['#2e3552', '#4a5274', '#6f7590'], b: ['#1c2550', '#34407e', '#6a64a8'], c: ['#1c2550', '#3a3f86', '#7a6bb8'], tint: '#26305e', k: 0.45, kr: 0.3, haze: 'rgba(150,150,215,0.3)', cloudA: '#4b5378', cloudB: '#5d6696' },
      golden: { a: ['#8a8790', '#b3aca6', '#d9cdbd'], b: ['#ff9f7a', '#ffcf9a', '#fff0c4'], c: ['#ffb45e', '#ffdc98', '#fff4d6'], tint: '#ffcf6a', k: 0.1, kr: 0.06, haze: 'rgba(255,240,200,0.45)', cloudA: '#a59a9a', cloudB: '#fff4dc' },
    }[THEME];
    {
      const tc = hex(SKY.tint);
      for (const key in RAMPS) {
        const k = key === 'road' || key === 'edge' || key === 'dash' ? SKY.kr : SKY.k;
        RAMPS[key] = RAMPS[key].map(c => hex(c).map((v, i) => v + (tc[i] - v) * k));
      }
    }
    const pal = {};
    let palKey = -1;
    function updatePalette(p) {
      const key = Math.round(p * 240);
      if (key === palKey) return;
      palKey = key;
      for (const k in RAMPS) {
        const st = RAMPS[k], f = clamp(p) * (st.length - 1), i = Math.min(st.length - 2, Math.floor(f)), m = f - i, a = st[i], b = st[i + 1];
        pal[k] = `rgb(${Math.round(a[0] + (b[0] - a[0]) * m)},${Math.round(a[1] + (b[1] - a[1]) * m)},${Math.round(a[2] + (b[2] - a[2]) * m)})`;
      }
    }

    // opciones reutilizadas de los dibujos del kit (para no crear objetos en cada cuadro)
    const SON = { robe: '#c98263', hair: '#4a3222', skin: '#e8b38a', walk: true, t: 0, sad: false, arms: 'down', dir: 1 };
    const DAD = { robe: '#6f8fd8', hair: '#b9b2ac', skin: '#e2a982', sash: '#ffc94a', beard: true, walk: false, t: 0, arms: 'open', dir: 1 };
    const TREE_ROUND = { kind: 'round', sway: 0 }, TREE_OLIVE = { kind: 'olive', sway: 0 }, SHEEP = { dir: 1, t: 0 };
    const DOVE = { dir: 1, flap: 0, mood: 'happy' };
    const FLOWERS = [PAL.rose, PAL.sun, '#ffffff'];
    const FLAGS = [PAL.coral, PAL.sun, PAL.leaf, PAL.sky, PAL.rose, PAL.grape];

    // ───────────────────────── Distribución y perspectiva ─────────────────────────
    function layout() {
      H = api.H; top = api.top;
      horY = top + clamp(H * 0.125, 62, 96);        // horizonte: donde el camino se pierde tras las colinas
      plY = H - clamp(H * 0.17, 88, 128);           // suelo bajo los pies del hijo (tercio inferior)
      yv = (horY - plY * FAR_S) / (1 - FAR_S);      // punto de fuga (queda por encima de la pantalla)
      nearK = (plY - yv) * Q / VIEW;                // px de pantalla por unidad de camino junto al jugador
      gradDirty = true;
    }
    function makeGradients(g) {
      const mk = (c, y0, y1) => { const gr = g.createLinearGradient(0, y0, 0, y1); c.forEach((col, i) => gr.addColorStop(i / (c.length - 1), col)); return gr; };
      skyA = mk(SKY.a, 0, horY);     // cielo gris de la tierra lejana
      skyB = mk(SKY.b, 0, horY);     // a medio camino
      skyC = mk(SKY.c, 0, horY);     // sobre la casa
      hazeG = mk([SKY.haze, 'rgba(255,255,255,0)'], horY, horY + 54);
      gradDirty = false;
    }
    const sc = d => 1 / (1 + Math.max((d - dist) / VIEW, -0.42) * Q);   // escala de algo que está en la distancia d
    const py = s => yv + (plY - yv) * s;                                 // su y en pantalla

    // ───────────────────────── Acciones ─────────────────────────
    function step(dir, from) {
      if (state !== 'run' || over) return;
      touched = true;
      const want = from + dir, nl = clamp(want, 0, 2);
      if (nl !== lane) { lane = nl; api.sfx('whoosh'); }
      else if (want !== nl) { pv += dir * 260; api.sfx('tap'); }       // en la orilla: un empujoncito que rebota
    }
    function collect(o) {
      o.done = true; o.taken = true; o.fx = 0.3; joyT = 0.28;
      const x = CX + px, y = plY - 44;
      if (o.kind === 'heart') {
        api.addScore(1, x, y - 24); api.sfx('coin');
        api.burst(x, y, { color: '#ff7fa3', count: 9, speed: 110, size: 4.5, life: 0.5 });
        api.burst(x, y, { color: '#fff3b0', count: 4, speed: 70, size: 3, life: 0.45 });
      } else if (o.kind === 'gold') {
        api.addScore(3, x, y - 24); api.sfx('sparkle');
        api.burst(x, y, { color: '#ffd24a', count: 16, speed: 140, size: 5, life: 0.6 });
        api.burst(x, y, { color: '#ffffff', count: 6, speed: 80, size: 3, life: 0.5 });
      } else if (o.kind === 'bread') {
        api.sfx('eat');
        if (api.lives < 3) { api.addLife(); api.floatText(x, y - 40, '¡Pan! +1 vida', { color: '#fff3b0', size: 18 }); }
        else api.floatText(x, y - 40, '¡Qué rico pan!', { color: '#fff3b0', size: 18 });
        api.burst(x, y, { color: '#e9a45a', count: 10, speed: 100, size: 4, life: 0.5 });
      } else if (o.kind === 'dove') {
        shield = true; shieldGone = 0; api.sfx('coo');
        api.floatText(x, y - 40, '¡{Palomita|Palomito} te cuida!', { color: '#ffffff', size: 18 });
        api.burst(x, y - 20, { color: '#ffffff', count: 12, speed: 110, size: 4, life: 0.6 });
      }
    }
    function hit(o) {
      o.done = true; o.hit = true; o.fx = 0.5;
      if (o.pair) { o.pair.done = true; o.pair.hit = true; o.pair.fx = 0.5; }
      invuln = INVULN;
      const x = CX + px, y = plY;
      if (o.kind === 'mud') { api.sfx('splash'); api.burst(x, y - 6, { color: '#7d5c48', count: 14, speed: 150, size: 5, life: 0.6 }); }
      else if (o.kind === 'water') { api.sfx('splash'); api.burst(x, y - 8, { color: '#8fd3ff', count: 16, speed: 160, size: 5, life: 0.6 }); }
      else if (o.kind === 'pig') { api.floatText(CX + o.X, y - 62, '¡Oink!', { color: '#ffd0dc', size: 20 }); api.burst(x, y - 10, { color: '#7d5c48', count: 8, speed: 120, size: 4, life: 0.5 }); }
      else if (o.kind === 'bramble') api.burst(x, y - 16, { color: '#6f9651', count: 12, speed: 130, size: 4, life: 0.55 });
      else if (o.kind === 'barrel') { api.sfx('drop'); api.burst(x, y - 16, { color: '#c08a57', count: 10, speed: 130, size: 4, life: 0.5 }); }
      else api.burst(x, y - 10, { color: '#c9cfd8', count: 10, speed: 130, size: 4, life: 0.5 });
      if (shield) {
        // Palomita recibe el golpe por él y sale volando
        shield = false; shieldGone = 0.9; api.sfx('flap');
        api.floatText(x, y - 110, '¡{Palomita|Palomito} te cuidó!', { color: '#ffffff', size: 18 });
        return;
      }
      hurtT = 0.9; slowT = 1;
      if (api.loseLife(x, y - 70) <= 0) over = true;
    }
    function collide() {
      for (let i = first; i < objs.length; i++) {
        const o = objs[i];
        if (o.d - dist > 60) break;
        if (o.done) continue;
        const dz = zOf(o) - dist, dx = Math.abs(o.X - px);
        if (o.good) {
          if (dz < 46 && dz > -40 && dx < 50) collect(o);          // los premios se atrapan con mucha manga ancha
          else if (dz <= -40) o.done = true;
        } else if (dz < 22 && dz > -26 && dx < 36 && invuln <= 0) { hit(o); if (over) return; }
        else if (dz <= -26) o.done = true;
      }
    }
    // ¡Meta lograda! Lo que estorba se vuelve flores, los arroyos tienen puente en todos los carriles y aparece la casa.
    function goHome() {
      homeSet = true; goalD = dist;
      D_HOUSE = dist + VIEW + 420;
      SEEN_AT = D_HOUSE - VIEW * 0.82;
      house.d = D_HOUSE;
      for (let i = first; i < objs.length; i++) {
        const o = objs[i];
        if (o.kind === 'stream') { if (o.d - dist > -40 && o.bridges.length < 3) o.newB = 0.01; continue; }
        if (o.good) { if (!o.done && o.d > SEEN_AT + 100) { o.done = true; o.gone = true; } continue; }   // donde se abrazan no quedan premios sueltos
        if (o.done || zOf(o) - dist < -20) continue;
        if (o.kind === 'water') { o.done = true; continue; }
        const z = zOf(o), s = sc(z);
        if (z - dist < VIEW) api.burst(CX + o.X * s, py(s) - 12 * s, { color: '#fff3b0', count: 5, speed: 80, size: 3.5 * s + 1, life: 0.5 });
        o.zf = z; o.done = true; o.roll = 0; o.mv = 0; o.walking = false;
        if (o.d > SEEN_AT - 60) { o.gone = true; continue; }        // cerca de la casa: el camino queda despejado
        o.kind = 'bloom'; o.fx = 0.7;
      }
      // jardín de la casa
      for (const [type, X, dd, k] of [['tree', -196, 20, 1.3], ['tree', 204, 30, 1.2], ['bush', -160, -40, 1], ['flower', 150, -46, 1.1], ['flower', -118, -60, 1], ['olive', 250, -90, 1.1]]) {
        insertSorted(scen, { cat: 'scen', type, X, d: D_HOUSE + dd, z: D_HOUSE + dd, k, flip: 1, ph: X, col: Math.abs(X) % 3 }, firstScen);
      }
      api.sfx('sparkle');
    }
    function puff(x, y, r) { if (puffs.length < 14) puffs.push({ x, y, r, life: 0.45 }); }

    // ───────────────────────── Dibujos propios (mismo estilo del kit) ─────────────────────────
    function drawMud(g, x, y, s, o, wide) {
      g.save(); g.translate(x, y); g.scale(s * wide, s);
      kit.ellipse(g, 0, 1, 37, 13.5, '#5f4435'); kit.ellipse(g, -23, 5, 14, 6.5, '#5f4435'); kit.ellipse(g, 25, -4, 13, 6, '#5f4435');
      kit.ellipse(g, 0, 0, 32, 10.5, '#7d5c48'); kit.ellipse(g, -22, 4.5, 10.5, 4.5, '#7d5c48'); kit.ellipse(g, 24, -4, 9.5, 4, '#7d5c48');
      kit.ellipse(g, -8, -3.6, 11, 2.6, 'rgba(255,255,255,0.24)');
      const b = (t * 0.6 + o.ph) % 1;                       // burbujita de lodo
      g.globalAlpha *= 0.5 * (1 - b); kit.circle(g, 11, 1.5, 1 + b * 3.4, '#ffffff');
      g.restore();
      if (o.hit && o.fx > 0) {                              // onda del chapuzón
        const k = 1 - o.fx / 0.5;
        g.save(); g.globalAlpha *= 1 - k; g.strokeStyle = '#a58468'; g.lineWidth = 3 * s;
        g.beginPath(); g.ellipse(x, y, (30 * wide + k * 26) * s, (9 + k * 8) * s, 0, 0, 6.283); g.stroke(); g.restore();
      }
    }
    function drawStones(g, x, y, s) {
      kit.shadow(g, x + 2 * s, y + 1 * s, 34 * s, 7 * s, 0.22);
      kit.rock(g, x + 19 * s, y + 2 * s, 0.72 * s, PAL.stoneDeep);
      kit.rock(g, x - 4 * s, y, 1.42 * s, PAL.stone);
    }
    function spiky(g, cx, cy, rx, ry, n, color, rot) {
      g.fillStyle = color; g.strokeStyle = color; g.lineWidth = 2.5; g.lineJoin = 'round';
      g.beginPath();
      for (let i = 0; i < n * 2; i++) { const a = rot + i * Math.PI / n, k = i % 2 ? 0.66 : 1; g.lineTo(cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k); }
      g.closePath(); g.fill(); g.stroke();
    }
    function drawBramble(g, x, y, s, o) {
      kit.shadow(g, x, y + 1 * s, 31 * s, 6.5 * s, 0.2);
      const shake = o.hit && o.fx > 0 ? Math.sin(o.fx * 60) * 3 * o.fx : 0;
      g.save(); g.translate(x + shake * s, y); g.scale(s, s);
      spiky(g, 0, -16, 32, 21, 13, '#4f7340', 0.2);
      spiky(g, -3, -19, 23, 15, 10, '#6f9651', 0.55);
      g.strokeStyle = '#8a6b4a'; g.lineWidth = 2.6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-25, -3); g.quadraticCurveTo(-9, -32, 15, -24); g.moveTo(24, -4); g.quadraticCurveTo(10, -21, -7, -10); g.stroke();
      kit.circle(g, -12, -21, 3.5, '#b8457e'); kit.circle(g, 9, -12, 3.3, '#b8457e'); kit.circle(g, 15, -26, 3, '#cf6396');
      g.restore();
    }
    function drawPig(g, x, y, s, ph, jump, flip) {
      kit.shadow(g, x, y, 22 * s, 5.5 * s, 0.2);
      g.save(); g.translate(x, y - jump * s); g.scale(s * flip, s);
      const bob = Math.sin(t * 4 + ph) * 1;
      g.strokeStyle = '#f08ea6'; g.lineWidth = 2.8; g.lineCap = 'round';
      g.beginPath(); g.arc(22, -25, 4, 0.6, 5.2); g.stroke();                               // colita rizada
      kit.fillRR(g, -15, -9, 8, 10, 3.5, '#ee8fa6'); kit.fillRR(g, 7, -9, 8, 10, 3.5, '#ee8fa6');
      kit.ellipse(g, 0, -19 + bob, 22, 15.5, '#ffb7c7');                                     // cuerpo
      g.fillStyle = '#f08ea6';                                                               // orejas
      g.beginPath(); g.moveTo(-15, -31 + bob); g.lineTo(-13, -45 + bob); g.lineTo(-3, -37 + bob); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(15, -31 + bob); g.lineTo(13, -45 + bob); g.lineTo(3, -37 + bob); g.closePath(); g.fill();
      kit.circle(g, 0, -25 + bob, 14.5, '#ffc6d2');                                          // cabeza
      kit.ellipse(g, 0, -21 + bob, 7.6, 5.6, '#f79bb0');                                     // hocico
      kit.circle(g, -2.7, -21 + bob, 1.3, '#c2607a'); kit.circle(g, 2.7, -21 + bob, 1.3, '#c2607a');
      kit.circle(g, -6.6, -29 + bob, 2, PAL.eye); kit.circle(g, 6.6, -29 + bob, 2, PAL.eye);
      kit.ellipse(g, -15, -14 + bob, 4.2, 2.8, '#8a6a52'); kit.ellipse(g, 13, -11 + bob, 3.2, 2.2, '#8a6a52');   // manchitas de lodo
      g.restore();
    }
    function drawDead(g, x, y, s, flip) {
      kit.shadow(g, x, y, 13 * s, 3.6 * s);
      g.save(); g.translate(x, y); g.scale(s * flip, s);
      g.strokeStyle = '#8a7768'; g.lineCap = 'round'; g.lineWidth = 7;
      g.beginPath(); g.moveTo(0, -1); g.lineTo(1, -34); g.stroke();
      g.lineWidth = 4.2;
      g.beginPath(); g.moveTo(1, -20); g.lineTo(-14, -37); g.moveTo(1, -29); g.lineTo(15, -45); g.moveTo(1, -34); g.lineTo(-4, -52);
      g.moveTo(-8, -30); g.lineTo(-19, -31); g.moveTo(9, -38); g.lineTo(20, -36); g.stroke();
      g.restore();
    }
    // Tonel de madera que rueda hacia el hijo: las duelas bajan (se ve rodar) y los aros quedan a los lados.
    function drawBarrel(g, x, y, s, o) {
      kit.shadow(g, x, y + 1 * s, 30 * s, 6 * s, 0.22);
      g.save(); g.translate(x, y - 23 * s); g.scale(s, s);
      kit.fillRR(g, -28, -22, 56, 44, 14, '#b7834f');
      g.save(); kit.rr(g, -28, -22, 56, 44, 14); g.clip();
      g.fillStyle = '#946238';
      for (let yy = -32 + o.spin; yy < 26; yy += 10) g.fillRect(-28, yy, 56, 2.4);
      g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(-28, -22, 56, 8);
      g.fillStyle = 'rgba(60,35,20,0.18)'; g.fillRect(-28, 12, 56, 10);
      g.restore();
      kit.fillRR(g, -21, -23, 6.5, 46, 3, '#7b7781'); kit.fillRR(g, 14.5, -23, 6.5, 46, 3, '#7b7781');
      g.restore();
    }
    // Arroyo que cruza el camino (franja de agua de lado a lado) con puentecitos de tablas en algunos carriles.
    function drawStream(g, o) {
      const sN = sc(o.d - 34), sF = sc(o.d + 34), yN = py(sN), yF = py(sF), hgt = yN - yF;
      if (yF > H || yN < horY) return;
      g.fillStyle = '#4fa6dc'; g.fillRect(0, yF - 2 * sF, W, hgt + 4 * sN);           // orillas
      g.fillStyle = '#6cc3f0'; g.fillRect(0, yF + 1.5 * sF, W, hgt - 1.5 * sF);
      g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2 * sN; g.lineCap = 'round';
      g.beginPath();
      for (let i = 0; i < 6; i++) {                                                // olitas que corren
        const xx = ((i * 71 + t * 22 + o.ph * 40) % (W + 40)) - 20, yy = yF + hgt * (0.3 + 0.45 * ((i * 37) % 10) / 10), w = 10 * sN;
        g.moveTo(xx - w, yy); g.quadraticCurveTo(xx, yy - 3 * sN, xx + w, yy);
      }
      g.stroke();
      for (const l of o.bridges) drawBridge(g, (l - 1) * LANE, o.d, 1);
      if (o.newB > 0) for (let l = 0; l < 3; l++) if (!o.bridges.includes(l)) drawBridge(g, (l - 1) * LANE, o.d, ease.outBack(clamp(o.newB)));
    }
    function drawBridge(g, X, d, k) {
      const d0 = d - 46, d1 = d + 46, s0 = sc(d0), s1 = sc(d1), y0 = py(s0), y1 = py(s1), hw = 34 * k;
      const quad = (a, sA, yA, b, sB, yB, e) => {
        g.beginPath(); g.moveTo(CX + (X - a) * sA, yA); g.lineTo(CX + (X + a) * sA, yA); g.lineTo(CX + (X + b) * sB, yB + e); g.lineTo(CX + (X - b) * sB, yB + e); g.closePath(); g.fill();
      };
      g.fillStyle = '#8a5a34'; quad(hw + 3, s0, y0 + 4 * s0, hw + 3, s1, y1, 0);
      g.fillStyle = '#c99660'; quad(hw, s0, y0, hw, s1, y1, 0);
      g.strokeStyle = '#9a6a40'; g.lineWidth = 1.6 * s0; g.beginPath();
      for (let i = 1; i < 5; i++) { const dd = lerp(d0, d1, i / 5), s = sc(dd), yy = py(s); g.moveTo(CX + (X - hw) * s, yy); g.lineTo(CX + (X + hw) * s, yy); }
      g.stroke();
      if (k >= 0.6) for (const side of [-1, 1]) {                                     // postecitos de la baranda
        kit.fillRR(g, CX + (X + side * hw) * s0 - 2.5 * s0, y0 - 12 * s0, 5 * s0, 13 * s0, 2 * s0, '#7a4f2e');
        kit.fillRR(g, CX + (X + side * hw) * s1 - 2.5 * s1, y1 - 12 * s1, 5 * s1, 13 * s1, 2 * s1, '#7a4f2e');
      }
    }
    function drawLamp(g, x, y, s) {
      kit.shadow(g, x, y, 9 * s, 2.6 * s);
      kit.circle(g, x, y - 60 * s, 22 * s, 'rgba(255, 214, 120, 0.22)');
      kit.fillRR(g, x - 2.6 * s, y - 54 * s, 5.2 * s, 54 * s, 2 * s, '#6e5236');
      kit.fillRR(g, x - 7 * s, y - 67 * s, 14 * s, 14 * s, 3.5 * s, '#ffd36e');
      kit.fillRR(g, x - 8.5 * s, y - 70 * s, 17 * s, 4.5 * s, 2 * s, '#5a4636');
    }
    function drawBloom(g, x, y, s, o) {
      const k = o.fx > 0 ? ease.outBack(clamp(1 - o.fx / 0.7)) : 1, q = s * k;
      if (q <= 0.02) return;
      kit.grass(g, x, y + 2 * q, q * 1.3, PAL.leafDeep);
      kit.flower(g, x - 10 * q, y, q * 1.4, FLOWERS[Math.floor(o.ph) % 3]);
      kit.flower(g, x + 9 * q, y + 3 * q, q * 1.2, FLOWERS[(Math.floor(o.ph) + 1) % 3]);
      kit.flower(g, x + 1 * q, y - 4 * q, q * 1.05, '#ffffff');
    }
    // Iconos de los premios (también se usan cuando el hijo los atrapa y suben).
    function drawItem(g, kind, x, y, s) {
      if (kind === 'heart') kit.heart(g, x, y, 1.6 * s, '#f2557f');
      else if (kind === 'gold') {
        kit.heart(g, x, y, 1.75 * s, '#f0a51e'); kit.heart(g, x, y - 1 * s, 1.45 * s, '#ffd24a');
        kit.star(g, x + 13 * s, y - 12 * s, 4.5 * s, '#ffffff', t * 2);
      } else if (kind === 'bread') {
        g.save(); g.translate(x, y); g.scale(s, s);
        kit.ellipse(g, 0, 3, 18, 11, '#b8743a'); kit.ellipse(g, 0, 0, 17, 10.5, '#e9a45a');
        g.strokeStyle = '#f9d9a4'; g.lineWidth = 2.6; g.lineCap = 'round'; g.beginPath();
        for (const bx of [-8, 0, 8]) { g.moveTo(bx - 3, -5); g.lineTo(bx + 3, 3); }
        g.stroke(); g.restore();
      } else if (kind === 'dove') {
        DOVE.dir = 1; DOVE.flap = 0.5 + 0.5 * Math.sin(t * 12); DOVE.mood = 'happy';
        kit.dove(g, x, y, 0.62 * s, DOVE);
      }
    }
    function drawGood(g, x, y, s, o) {
      if (o.taken) {                                          // recogido: sube, crece y se desvanece
        if (o.fx <= 0) return;
        const k = 1 - o.fx / 0.3;
        g.save(); g.globalAlpha *= 1 - k;
        drawItem(g, o.kind, CX + px, plY - 44 - k * 26, 1 + k * 0.75);
        g.restore();
        return;
      }
      const bob = Math.sin(t * 4 + o.ph) * 3 * s, hy = y - 27 * s + bob;
      kit.shadow(g, x, y, 12 * s, 3.4 * s, 0.16);
      kit.circle(g, x, hy, (o.kind === 'heart' ? 20 : 23) * s, o.kind === 'gold' ? 'rgba(255,236,150,0.5)' : 'rgba(255,255,255,0.36)');
      drawItem(g, o.kind, x, hy, s * (1 + 0.07 * Math.sin(t * 6 + o.ph)));
    }
    function drawHouse(g, x, y, s) {
      g.save(); g.translate(x, y); g.scale(s, s);
      kit.shadow(g, 0, 2, 140, 11, 0.14);
      if (THEME === 'night') kit.ellipse(g, 0, -40, 170, 80, 'rgba(255, 214, 120, 0.16)');           // luz cálida en la noche
      kit.fillRR(g, -132, -58, 64, 58, 8, '#f4e1b6'); kit.fillRR(g, 70, -66, 62, 66, 8, '#f4e1b6');     // alas
      kit.fillRR(g, -138, -66, 74, 13, 6, '#d96a4c'); kit.fillRR(g, 64, -74, 74, 13, 6, '#d96a4c');
      kit.fillRR(g, -113, -42, 22, 24, 7, '#ffe08a'); kit.fillRR(g, 93, -46, 22, 24, 7, '#ffe08a');
      kit.fillRR(g, -76, -86, 152, 86, 10, '#fff2d2');                                                    // cuerpo
      g.fillStyle = '#e8795a'; g.strokeStyle = '#e8795a'; g.lineJoin = 'round'; g.lineWidth = 8;        // techo
      g.beginPath(); g.moveTo(-82, -85); g.lineTo(-54, -111); g.lineTo(54, -111); g.lineTo(82, -85); g.closePath(); g.fill(); g.stroke();
      kit.fillRR(g, -50, -113, 100, 6, 3, 'rgba(255,255,255,0.28)');
      kit.fillRR(g, -59, -55, 24, 25, 8, '#ffe08a'); kit.fillRR(g, 35, -55, 24, 25, 8, '#ffe08a');     // ventanas con luz
      g.fillStyle = '#ffd36e';                                                                           // puerta abierta, con luz
      g.beginPath(); g.moveTo(-17, 0); g.lineTo(-17, -31); g.arc(0, -31, 17, Math.PI, 0); g.lineTo(17, 0); g.closePath(); g.fill();
      kit.fillRR(g, 17, -45, 11, 45, 4, PAL.wood);
      kit.ellipse(g, 0, 4, 27, 6, 'rgba(255, 224, 138, 0.6)');
      for (let i = 0; i < 7; i++) {                                                                      // banderines: ¡hay fiesta!
        const fx = -60 + i * 20, fy = -77 + Math.sin(i / 6 * Math.PI) * 6;
        g.fillStyle = FLAGS[i % FLAGS.length];
        g.beginPath(); g.moveTo(fx - 6.5, fy); g.lineTo(fx + 6.5, fy); g.lineTo(fx, fy + 11); g.closePath(); g.fill();
      }
      kit.flower(g, -64, 1, 1.3, PAL.rose); kit.flower(g, -50, 3, 1.1, PAL.sun); kit.flower(g, 52, 2, 1.2, PAL.rose); kit.flower(g, 66, 1, 1.1, '#ffffff');
      g.restore();
    }
    function drawScen(g, o, x, y, s) {
      const k = s * o.k;
      switch (o.type) {
        case 'dead': drawDead(g, x, y, k * 1.3, o.flip); break;
        case 'stone': kit.rock(g, x, y, k * 0.9, '#a49e99'); break;
        case 'dry': kit.grass(g, x, y, k * 1.6, '#8f8068'); break;
        case 'shrub': kit.bush(g, x, y, k * 0.9, '#a3a86e'); break;
        case 'pigS': kit.ellipse(g, x, y, 26 * k, 7 * k, '#7d5c48'); drawPig(g, x, y, k * 0.82, o.ph, 0, o.flip); break;
        case 'tree': TREE_ROUND.sway = Math.sin(t * 1.3 + o.ph); kit.tree(g, x, y, k * 1.25, TREE_ROUND); break;
        case 'olive': TREE_OLIVE.sway = Math.sin(t * 1.3 + o.ph); kit.tree(g, x, y, k * 1.15, TREE_OLIVE); break;
        case 'bush': kit.bush(g, x, y, k, PAL.leafDeep); break;
        case 'flower': kit.grass(g, x, y + 2 * k, k * 1.1, PAL.leafDeep); kit.flower(g, x - 8 * k, y, k * 1.35, FLOWERS[o.col]); kit.flower(g, x + 8 * k, y + 3 * k, k * 1.15, FLOWERS[(o.col + 1) % 3]); break;
        case 'grass': kit.grass(g, x, y, k * 1.6, PAL.leafDeep); break;
        case 'sheep': SHEEP.dir = o.flip; SHEEP.t = t + o.ph; kit.sheep(g, x, y, k * 1.05, SHEEP); break;
        case 'lamp': drawLamp(g, x, y, k); break;
      }
    }
    function drawObj(g, o, x, y, s) {
      if (o.good) { drawGood(g, x, y, s, o); return; }
      switch (o.kind) {
        case 'mud':
          if (!o.big) drawMud(g, x, y, s * 1.08, o, 1);
          else if (o.main) { const sx = CX + ((o.X + o.pair.X) / 2) * s; drawMud(g, sx, y, s * 1.08, o, 2.15); }
          break;
        case 'rock': drawStones(g, x, y, s); break;
        case 'bramble': drawBramble(g, x, y, s * 1.05, o); break;
        case 'barrel': drawBarrel(g, x, y, s, o); break;
        case 'stream': drawStream(g, o); break;
        case 'water':
          if (o.hit && o.fx > 0) {                                     // salpicón
            const k = 1 - o.fx / 0.5;
            g.save(); g.globalAlpha *= 1 - k; g.strokeStyle = '#ffffff'; g.lineWidth = 3 * s;
            g.beginPath(); g.ellipse(x, y, (24 + k * 26) * s, (8 + k * 8) * s, 0, 0, 6.283); g.stroke(); g.restore();
          }
          break;
        case 'bloom': drawBloom(g, x, y, s, o); break;
        case 'pig': {
          let j = o.hit && o.fx > 0 ? Math.sin((1 - o.fx / 0.5) * Math.PI) * 16 : 0;      // el cerdito brinca del susto
          if (o.walking) j += Math.abs(Math.sin(t * 13 + o.ph)) * 4;                     // trotecito al cruzar
          const onRoad = Math.abs(o.X) < ROAD_HALF + 20;
          if (!o.mv || !o.walking) kit.ellipse(g, x, y + 1 * s, 33 * s, 9 * s, '#7d5c48');
          else if (onRoad) kit.ellipse(g, x, y + 1 * s, 20 * s, 6 * s, 'rgba(125,92,72,0.5)');
          drawPig(g, x, y, s * 1.28, o.ph, j, o.mv ? (o.x1 >= o.x0 ? 1 : -1) : 1);
          break;
        }
      }
    }

    // ───────────────────────── Personajes ─────────────────────────
    function drawHero(g) {
      const hug = state === 'hug', x = CX + px + (hug ? 9 : 0), y = plY;
      const moving = !hug && !over;
      const bob = moving ? Math.abs(Math.sin(walkT * 9)) * 2.4 : 0;
      const lean = hug ? -0.1 * ease.outBack(clamp(stT / 0.3)) : api.reduceMotion ? 0 : clamp(pv / 1100, -0.2, 0.2);
      SON.walk = moving; SON.t = walkT; SON.sad = hurtT > 0 || over;
      SON.arms = hug ? 'reach' : state === 'meet' ? 'open' : state === 'seen' || joyT > 0 ? 'up' : 'down';
      SON.dir = hug ? -1 : 1;
      SON.robe = newRobe > 0 ? '#fbf7ea' : '#c98263';
      g.save();
      if (invuln > 0 && !over && Math.floor(invuln * 11) % 2 === 0) g.globalAlpha *= 0.4;      // parpadea mientras está protegido
      g.translate(x, y - bob); g.rotate(lean);
      kit.person(g, 0, 0, HERO_S, SON);
      g.restore();
      if (shield || shieldGone > 0) {
        // Palomita revolotea sobre su cabeza; si lo cuidó de un tropiezo, sale volando hacia arriba
        const a = t * 2.6, away = shieldGone > 0 ? 1 - shieldGone / 0.9 : 0;
        DOVE.dir = Math.sin(a) > 0 ? -1 : 1; DOVE.flap = 0.5 + 0.5 * Math.sin(t * 16); DOVE.mood = 'happy';
        g.save(); g.globalAlpha *= 1 - away;
        kit.dove(g, x + Math.cos(a) * 30 + away * 60, y - 96 + Math.sin(a * 2) * 5 - away * 150, 0.42, DOVE);
        g.restore();
      }
      if (hug) {
        // el brazo del padre rodea al hijo, y un corazón grande late sobre los dos
        const k = ease.outBack(clamp(stT / 0.3));
        g.save(); g.lineCap = 'round'; g.strokeStyle = DAD.robe; g.lineWidth = 8.5 * k + 1;
        const ax = x - 22, ay = y - 46, bx = x + 13, by = y - 37;
        g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo((ax + bx) / 2, ay - 10, bx, by); g.stroke();
        kit.circle(g, bx, by, 4.6, DAD.skin);
        g.restore();
        const beat = 1 + 0.1 * Math.sin(stT * 9);
        kit.circle(g, x - 10, y - 102, 23 * k, 'rgba(255,255,255,0.4)');
        kit.heart(g, x - 10, y - 102, 2.3 * k * beat, '#f2557f');
      }
    }
    function drawDad(g) {
      if (state === 'hug') {
        const x = CX + px - 13, k = ease.outBack(clamp(stT / 0.3));
        DAD.walk = false; DAD.arms = 'reach'; DAD.dir = 1; DAD.t = t;
        g.save(); g.translate(x, plY); g.rotate(0.09 * k);
        kit.person(g, 0, 0, DAD_S, DAD);
        g.restore();
        return;
      }
      const s = sc(dadD), x = CX + dadX * s, y = py(s);
      if (state === 'seen') {
        // sale a la puerta, lo ve y levanta los brazos
        const k = ease.outBack(clamp(stT / 0.3));
        DAD.walk = false; DAD.arms = stT > 0.18 ? 'up' : 'down'; DAD.t = t;
        kit.person(g, x, y, DAD_S * s * k, DAD);
        if (stT > 0.15) kit.heart(g, x, y - 96 * s, 1.3 * s * ease.outBack(clamp((stT - 0.15) / 0.25)), '#f2557f');
      } else {
        // ¡corre con los brazos abiertos!
        const hop = Math.abs(Math.sin(dadT * 15)) * 5 * s;
        DAD.walk = true; DAD.arms = 'open'; DAD.t = dadT * 1.7;
        g.save(); g.translate(x, y - hop); g.rotate(clamp((px - dadX) / 400, -0.12, 0.12) + Math.sin(dadT * 15) * 0.04);
        kit.person(g, 0, 0, DAD_S * s, DAD);
        g.restore();
      }
    }

    // ───────────────────────── Fondo ─────────────────────────
    function drawSky(g, p) {
      const hs = horY + 4;
      g.fillStyle = skyA; g.fillRect(0, 0, W, hs);
      const k1 = clamp(p * 2.2), k2 = clamp(p * 2.2 - 1.1);
      if (k1 > 0) { g.globalAlpha = k1; g.fillStyle = skyB; g.fillRect(0, 0, W, hs); }
      if (k2 > 0) { g.globalAlpha = k2; g.fillStyle = skyC; g.fillRect(0, 0, W, hs); }
      g.globalAlpha = 1;
      if (THEME === 'night') {
        g.save(); g.globalAlpha = 0.35 + 0.65 * clamp(p * 1.6); kit.stars(g, W, horY - 12, t, 34, 11); g.restore();
        kit.moon(g, 300, top + 34, 16);
      } else {
        const sunK = clamp((p - 0.18) / 0.7);
        if (THEME === 'sunset') kit.sun(g, 300, lerp(top + 34, horY - 4, ease.inOut(clamp(p))), 20, t);      // el sol se va poniendo
        else if (sunK > 0) kit.sun(g, 300, lerp(horY + 26, top + 26, ease.outCubic(sunK)), THEME === 'golden' ? 23 : 19, t);   // sale detrás de las colinas
      }
      if (p < 0.62) {                                          // nubes de la tierra lejana
        const a = 1 - p / 0.62;
        kit.cloud(g, 62 + Math.sin(t * 0.21) * 12, top + 24, 0.95, a * 0.9, SKY.cloudA);
        kit.cloud(g, 236 + Math.sin(t * 0.17 + 2) * 14, top + 36, 0.72, a * 0.8, SKY.cloudA);
      }
      if (p > 0.5) kit.cloud(g, 84 + Math.sin(t * 0.2) * 12, top + 28, 0.8, clamp((p - 0.5) / 0.3) * (THEME === 'night' ? 0.5 : 0.95), SKY.cloudB);
      kit.hills(g, W, hs, horY - 17, 9, pal.hillB, dist * 0.012 + 40, 0.021);
      kit.hills(g, W, hs, horY - 7, 6, pal.hillA, dist * 0.022, 0.03);
    }
    function dash(g, X, s0, y0, s1, y1) {
      g.moveTo(CX + (X - 3.5) * s0, y0); g.lineTo(CX + (X + 3.5) * s0, y0); g.lineTo(CX + (X + 3.5) * s1, y1); g.lineTo(CX + (X - 3.5) * s1, y1); g.closePath();
    }
    function drawGround(g) {
      g.fillStyle = pal.field; g.fillRect(0, horY, W, H - horY);
      // franjas del campo: se acercan y dan sensación de avanzar
      g.fillStyle = pal.band;
      const B = 190, far = dist + VIEW;
      for (let k = Math.floor((dist - 220) / B); ; k++) {
        const d0 = k * B; if (d0 >= far) break;
        const yA = py(sc(d0)), yB = py(sc(Math.min(d0 + B * 0.5, far)));
        g.fillRect(0, yB, W, yA - yB);
      }
      // el camino (termina en la puerta de la casa)
      const endD = Math.min(far, D_HOUSE - 6), sF = sc(endD), yF = py(sF), sN = 1.38, yN = py(sN);
      g.fillStyle = pal.edge; g.beginPath();
      g.moveTo(CX - (ROAD_HALF + 8) * sF, yF); g.lineTo(CX + (ROAD_HALF + 8) * sF, yF); g.lineTo(CX + (ROAD_HALF + 8) * sN, yN); g.lineTo(CX - (ROAD_HALF + 8) * sN, yN); g.closePath(); g.fill();
      g.fillStyle = pal.road; g.beginPath();
      g.moveTo(CX - ROAD_HALF * sF, yF); g.lineTo(CX + ROAD_HALF * sF, yF); g.lineTo(CX + ROAD_HALF * sN, yN); g.lineTo(CX - ROAD_HALF * sN, yN); g.closePath(); g.fill();
      // rayitas que separan los 3 carriles
      g.fillStyle = pal.dash; g.beginPath();
      const DL = 150;
      for (let k = Math.floor((dist - 220) / DL); ; k++) {
        const d0 = k * DL; if (d0 >= endD - 20) break;
        const s0 = sc(d0), s1 = sc(Math.min(d0 + 62, endD));
        dash(g, -LANE / 2, s0, py(s0), s1, py(s1)); dash(g, LANE / 2, s0, py(s0), s1, py(s1));
      }
      g.fill();
      // bruma en el horizonte: suaviza la aparición de las cosas
      g.fillStyle = hazeG; g.fillRect(0, horY, W, 54);
    }
    // Luciérnagas de la noche (solo adorno; posiciones fijas que se mecen con el tiempo).
    function drawFireflies(g) {
      const span = plY - horY - 20;
      for (let i = 0; i < 11; i++) {
        const x = ((i * 67.3 + t * (6 + (i % 3) * 3)) % (W + 40)) - 20 + Math.sin(t * 1.1 + i) * 10;
        const y = horY + 24 + ((i * 89) % 100) / 100 * span + Math.sin(t * 1.7 + i * 2.1) * 9;
        const a = 0.45 + 0.45 * Math.sin(t * 3 + i * 1.7);
        g.globalAlpha = a; kit.circle(g, x, y, 6, 'rgba(255, 240, 140, 0.3)'); kit.circle(g, x, y, 2, '#fff6b0');
      }
      g.globalAlpha = 1;
    }

    // ───────────────────────── Capas de encima ─────────────────────────
    function drawTips(g) {
      if (tipA <= 0.01) return;
      const y = plY - 34, pulse = 0.5 + 0.5 * Math.sin(t * 5);
      for (let i = 0; i < 2; i++) {
        const dir = i ? 1 : -1, x = CX + dir * (128 + pulse * 7);
        g.save(); g.globalAlpha = tipA * (0.6 + 0.3 * pulse);
        kit.circle(g, x, y, 26, 'rgba(255,255,255,0.92)');
        g.strokeStyle = PAL.coral; g.lineWidth = 6.5; g.lineCap = 'round'; g.lineJoin = 'round';
        g.beginPath(); g.moveTo(x - dir * 5, y - 11); g.lineTo(x + dir * 7, y); g.lineTo(x - dir * 5, y + 11); g.stroke();
        g.restore();
      }
    }
    function drawCaption(g) {
      const k = ease.outBack(clamp(stT / 0.4));
      const cy = plY + 18 + Math.min(34, (H - plY - 30) / 2);
      g.save(); g.translate(CX, cy); g.scale(k, k);
      kit.fillRR(g, -150, -29, 300, 62, 20, 'rgba(60, 40, 30, 0.16)');
      kit.fillRR(g, -150, -32, 300, 62, 20, '#fffaf0');
      kit.text(g, '¡Su padre corrió', 0, -13, { size: 22, color: PAL.ink });
      kit.text(g, 'a abrazarlo!', 0, 12, { size: 22, color: PAL.coralDeep });
      g.restore();
    }

    // ───────────────────────── Arranque ─────────────────────────
    while (genD < LOOK) genRow();
    genScenery(VIEW + 140);
    api.setProgress(0);
    layout();
    if (NEWS[LV]) api.hint(NEWS[LV], 3400);
    else if (LV <= 3) api.hint('👈 Toca a los lados para cambiar de carril 👉', 3000);
    else api.hint(`❤️ Junta ${GOAL} corazones y vuelve a casa`, 2600);

    return {
      update(dt) {
        t += dt;
        if (api.top !== top || api.H !== H) layout();
        if (over || ended) return;
        const q = clamp(api.score / GOAL);

        // ── el paisaje reverdece con los corazones (y del todo al llegar) ──
        const landT = homeSet ? lerp(0.85, 1, clamp((dist - goalD) / Math.max(1, SEEN_AT - goalD))) : 0.85 * q;
        land += (landT - land) * (1 - Math.exp(-dt * 1.4));

        // ── avance ──
        if (state === 'run') {
          if (!homeSet && api.score >= GOAL) goHome();
          vBase += (speedAt(q) - vBase) * (1 - Math.exp(-dt * 0.8));
          slowT = Math.max(0, slowT - dt / 0.9);
          curV = vBase * clamp(0.3 + t * 1.2) * (1 - 0.55 * ease.inOut(slowT));     // arranca despacito; tropezar frena
          dist += curV * dt;
          if (!almostHome && GOAL >= 8 && q >= 0.75 && !homeSet) { almostHome = true; api.hint('🏡 ¡Ya casi llegas a casa!', 1800); }
          if (dist >= SEEN_AT) { state = 'seen'; stT = 0; dadD = D_HOUSE - 24; dadX = 0; api.sfx('chirp'); }
        } else if (state === 'seen') {
          stT += dt;
          curV = lerp(curV, 125, 1 - Math.exp(-dt * 6));
          dist += curV * dt;
          if (stT >= 0.6) { state = 'meet'; stT = 0; gap0 = Math.max(1, dadD - dist); api.sfx('whoosh'); }
        } else if (state === 'meet') {
          stT += dt; dadT += dt;
          curV = lerp(curV, 105, 1 - Math.exp(-dt * 6));
          dist += curV * dt;
          dadD -= 330 * dt;
          const gap = dadD - dist;
          dadX = px * ease.inOut(clamp(1 - gap / gap0));
          if (Math.floor(dadT * 9) !== Math.floor((dadT - dt) * 9)) { const s = sc(dadD); puff(CX + dadX * s, py(s), 5 * s); }
          if (gap <= 16) {
            state = 'hug'; stT = 0; curV = 0; dadD = dist + 6;
            api.sfx('good');
            api.burst(CX + px, plY - 50, { color: '#ff9db5', count: 20, speed: 170, size: 5, life: 0.8 });
            api.burst(CX + px, plY - 50, { color: '#fff3b0', count: 10, speed: 120, size: 4, life: 0.7 });
            if (!api.reduceMotion) api.shake(3, 180);
          }
        } else {
          stT += dt;
          if (!sparkled && stT >= 0.7) { sparkled = true; api.sfx('sparkle'); }
          if (newRobe === 0 && stT >= 1.15) {        // «¡Traigan el mejor vestido y pónganselo!»
            newRobe = 1; api.sfx('sparkle');
            api.burst(CX + px + 9, plY - 30, { color: '#ffffff', count: 14, speed: 90, size: 4, life: 0.6, gravity: 40 });
            api.burst(CX + px + 9, plY - 30, { color: PAL.sun, count: 8, speed: 70, size: 3.5, life: 0.6, gravity: 40 });
          }
          // lluvia de corazones
          rainT -= dt;
          const maxRain = api.reduceMotion ? 8 : 26;
          while (rainT <= 0 && rain.length < maxRain) {
            rainT += 0.075;
            rain.push({ x: api.randRange(14, W - 14), y: top - api.randRange(10, 60), vy: api.randRange(130, 230), s: api.randRange(0.8, 1.7), ph: api.rand() * 6.28, col: api.rand() < 0.3 ? '#ff9db5' : '#f2557f' });
          }
          if (stT >= HUG_TIME) { ended = true; api.setProgress(1); api.end({ won: true }); return; }
        }

        // ── el camino se sigue armando por delante ──
        if (!homeSet) while (genD < dist + LOOK) genRow();
        genScenery(homeSet ? Math.min(dist + VIEW + 140, D_HOUSE + 420) : dist + VIEW + 140);

        // ── el hijo: cambio de carril suave (resorte con amortiguamiento crítico, solución exacta) ──
        const target = (lane - 1) * LANE, om = 21, e = Math.exp(-om * dt);
        const dx0 = px - target, tmp = (pv + om * dx0) * dt;
        pv = (pv - om * tmp) * e;
        px = target + (dx0 + tmp) * e;
        if (invuln > 0) invuln -= dt;
        if (hurtT > 0) hurtT -= dt;
        if (joyT > 0) joyT -= dt;
        if (bubbleT > 0) bubbleT -= dt;
        if (shieldGone > 0) shieldGone = Math.max(0, shieldGone - dt);
        tipA = clamp(tipA + (!touched && LV <= 3 && t > 0.9 && state === 'run' ? dt * 2.5 : -dt * 5));
        if (state !== 'hug') {
          walkT += dt * clamp(curV / 240, 0.45, 1.5);
          const foot = Math.floor(walkT * 9 / Math.PI);         // polvito en cada pisada
          if (foot !== lastFoot) { lastFoot = foot; puff(CX + px + (foot % 2 ? 5 : -5), plY + 1, 4); }
        }

        // ── cerditos que cruzan, toneles que ruedan, puentes que aparecen ──
        for (let i = first; i < objs.length && objs[i].d - dist < VIEW + 60; i++) {
          const o = objs[i];
          if (o.mv) {
            const k = ease.inOut(clamp((MOVE0 - (o.d - dist)) / (MOVE0 - SETTLE)));
            o.X = lerp(o.x0, o.x1, k); o.walking = k > 0.001 && k < 0.999;
          }
          if (o.roll) o.spin = (o.spin + curV * (1 + o.roll) * dt * 0.09) % 10;
          if (o.newB > 0 && o.newB < 1) o.newB = Math.min(1, o.newB + dt * 2.5);
        }

        // ── choques, premios y limpieza ──
        if (state !== 'hug') collide();
        if (over) return;
        for (let i = first; i < objs.length && objs[i].d - dist < VIEW; i++) if (objs[i].fx > 0) objs[i].fx -= dt;
        while (first < objs.length && objs[first].d < dist - 230 && objs[first].fx <= 0) first++;
        while (firstScen < scen.length && scen[firstScen].d < dist - 230) firstScen++;
        if (first > 160) { objs.splice(0, first); first = 0; }
        if (firstScen > 160) { scen.splice(0, firstScen); firstScen = 0; }
        const flow = curV * nearK;
        for (let i = puffs.length - 1; i >= 0; i--) { const pf = puffs[i]; pf.life -= dt; pf.y += flow * dt; pf.r += dt * 9; if (pf.life <= 0) puffs.splice(i, 1); }
        for (const r of rain) { r.y += r.vy * dt; if (r.y > H + 30) { r.y = top - 20; r.x = api.randRange(14, W - 14); } }

        const pct = Math.round(clamp(api.score / GOAL) * 100);
        if (pct !== lastPct) { lastPct = pct; api.setProgress(pct / 100); }
      },

      draw(g) {
        if (gradDirty) makeGradients(g);
        const p = land;
        updatePalette(p);
        drawSky(g, p);
        drawGround(g);

        // polvito de las pisadas (pegado al suelo)
        for (const pf of puffs) { g.globalAlpha = clamp(pf.life / 0.45) * 0.45; kit.circle(g, pf.x, pf.y, pf.r, '#ffffff'); }
        g.globalAlpha = 1;

        // todo lo que está sobre el suelo, de lo más lejano a lo más cercano
        drawList.length = 0;
        for (let i = firstScen; i < scen.length && scen[i].d - dist <= VIEW; i++) drawList.push(scen[i]);
        for (let i = first; i < objs.length && objs[i].d - dist <= VIEW; i++) {
          const o = objs[i];
          if (o.gone) continue;
          o.z = zOf(o);
          if (o.z - (o.zo || 0) - dist < VIEW) drawList.push(o);
        }
        if (D_HOUSE - dist <= VIEW) { house.z = D_HOUSE; drawList.push(house); }
        hero.z = dist; drawList.push(hero);
        if (state !== 'run') { dad.z = dadD; drawList.push(dad); }
        drawList.sort(byDepth);
        for (const o of drawList) {
          if (o.cat === 'hero') { drawHero(g); continue; }
          if (o.cat === 'dad') { drawDad(g); continue; }
          const zz = o.cat === 'obj' ? o.z - (o.zo || 0) : o.d;
          const u = (zz - dist) / VIEW, s = sc(zz), x = CX + o.X * s, y = py(s);
          if (y - 70 * s > H || (o.kind !== 'stream' && (x < -70 || x > W + 70))) continue;
          g.globalAlpha = u > 0.9 ? clamp((1 - u) * 10) : 1;        // aparece poco a poco tras la bruma
          if (o.cat === 'scen') drawScen(g, o, x, y, s);
          else if (o.cat === 'house') drawHouse(g, x, y, s);
          else drawObj(g, o, x, y, s);
        }
        g.globalAlpha = 1;
        if (THEME === 'night') drawFireflies(g);

        // al empezar: lo que decide el hijo
        if (bubbleT > 0 && state === 'run' && !over) {
          g.save(); g.globalAlpha = clamp(bubbleT * 3) * clamp((3 - bubbleT) * 5);
          kit.speech(g, CX + px, plY - 76, '¡Volveré con mi papá!', { size: 15, maxWidth: 190 });
          g.restore();
        }
        drawTips(g);
        if (state === 'hug') {
          for (const r of rain) {
            if (r.y < top - 14) continue;
            kit.heart(g, r.x + Math.sin(r.y * 0.03 + r.ph) * 8, r.y, r.s, r.col);
          }
          drawCaption(g);
        }
      },

      pointerDown(x, y, id) {
        gid = id; gx = x; gy = y; gLane = lane; gDir = x < CX ? -1 : 1; gSwiped = false;
        step(gDir, lane);
      },
      // Deslizar también vale: si el dedo se desliza hacia el lado contrario al toque, manda el deslizamiento.
      pointerMove(x, y, id) {
        if (id !== gid || gSwiped) return;
        const dx = x - gx, dy = y - gy;
        if (Math.abs(dx) < 26 || Math.abs(dx) < Math.abs(dy)) return;
        gSwiped = true;
        const dir = dx < 0 ? -1 : 1;
        if (dir !== gDir) step(dir, gLane);
      },
      pointerUp(x, y, id) { if (id === gid) gid = null; },
      keyDown(key) {
        if (key === 'left') step(-1, lane);
        else if (key === 'right') step(1, lane);
      },
      resize() { layout(); },

      // Solo lectura, para las pruebas automáticas. En `next`: lane = carril donde estará al llegar (los cerditos que
      // cruzan ya dicen su carril final), dz = distancia real hasta su fila, vz = dónde se ve, good = premio.
      get debug() {
        const next = [];
        for (let i = first; i < objs.length && objs[i].d - dist <= VIEW; i++) {
          const o = objs[i];
          if (o.done) continue;
          const z = zOf(o);
          if (z - dist > VIEW) continue;
          next.push({ id: o.id, kind: o.kind, lane: o.lane, dz: Math.round(o.d - dist), vz: Math.round(z - dist), x: Math.round(o.X), good: o.good, moving: !!o.walking });
        }
        return { state, level: LV, goal: GOAL, score: api.score, lives: api.lives, theme: THEME, news: NEWS[LV] || '', dist, lane, px, speed: curV, invuln, shield, homeSet, over, ended, hearts: heartCount, rows: row, next, horY, plY, top, H };
      },
      get course() {
        return objs.map(o => ({ id: o.id, kind: o.kind, lane: o.lane, d: Math.round(o.d), big: !!o.big, cross: o.mv ? Math.round(o.x0) : null, roll: o.roll || 0, bridges: o.bridges ? o.bridges.length : 0 }));
      },
    };
  },
};
