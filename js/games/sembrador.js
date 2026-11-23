// El sembrador (Mateo 13, 1-9) — minijuego de puntería y ritmo.
//
// El terreno pasa por debajo como una cinta con cuatro tipos de suelo, igual que en la parábola:
//   camino (los pajaritos se comen la semilla) · piedras (el brote se seca) · espinas (lo ahogan) · tierra buena (da espigas).
// El niño toca para soltar una semilla y tiene que calcular que caiga en la tierra buena. La semilla tarda FALL segundos
// en caer, así que hay que soltarla un poquito antes; el circulito del suelo marca dónde va a caer.
// Una semilla en tierra buena «da fruto al ciento por uno»: todo ese surco se llena de trigo y ya no recibe más semillas,
// así que hay que esperar el siguiente tramo de tierra buena libre (eso marca el ritmo de la partida).
//
// NIVELES (1..100, ver js/games/levels.js). Meta = api.goal semillas en tierra buena (5 → 24). La bolsa trae la meta + unas semillas de
// sobra (muchas en el nivel 1, pocas en el 100): si se vacía la bolsa sin llegar a la meta, el nivel se pierde; el reloj
// también manda. api.difficulty (0 en el nivel 1, 1 en el 100) fija la velocidad del terreno, el ancho de la tierra buena,
// cada cuánto aparece y la holgura de la bolsa; dentro de la partida el terreno acelera un poco (rampa suave).
// Cada 10 niveles llega una novedad (con cartelito «¡Nuevo: …!» en el nivel en que aparece) y el paisaje cambia:
//   11 surco dorado (vale 2) · 21 pajaritos que vuelan y atrapan la semilla en el aire · 31 viento (mañanita)
//   41 lluvia: la tierra buena mojada regala una semilla · 51 piedras que ruedan (junto al lago de Galilea)
//   61 espinas que crecen: la tierra buena se achica · 71 atardecer con bandadas · 81 el sembrador camina (aldea)
//   91 la gran siembra bajo las estrellas (todo junto, con luciérnagas)
// Cada novedad empieza suave en su nivel y se vuelve más frecuente en los siguientes.
const NEWS = {
  11: '✨ ¡Nuevo: el surco dorado! Vale por 2',
  21: '🐦 ¡Nuevo: pajaritos que vuelan! Suelta la semilla cuando no pasen',
  31: '💨 ¡Nuevo: el viento! Empuja la semilla: mira el circulito',
  41: '🌧️ ¡Nuevo: la lluvia! La tierra mojada te regala semillas',
  51: '⚪ ¡Nuevo: piedras que ruedan! Si la semilla cae en una, rebota',
  61: '🌿 ¡Nuevo: las espinas crecen! Apunta al centro de la tierra buena',
  71: '🌅 ¡Nuevo: atardecer con bandadas de pajaritos!',
  81: '👣 ¡Nuevo: el sembrador camina! Sigue el circulito',
  91: '⭐ ¡Nuevo: la gran siembra bajo las estrellas!',
};

export default {
  id: 'sembrador',
  levels: {
    goal: [5, 24], curve: 1.1, time: [45, 100], selfEnd: false,
    goalLabel: n => `Siembra ${n} semillas en tierra buena`,
  },
  create(api) {
    const { kit } = api;
    const { PAL, clamp, lerp, ease } = kit;
    const W = api.W;

    // ───────────────────────── Nivel ─────────────────────────
    const LV = Math.max(1, Math.round(api.level || 1));
    const D = clamp(api.difficulty || 0);
    const GOAL = Math.max(1, Math.round(api.goal || 12));
    const has = n => LV >= n;                                   // ¿ya apareció esta novedad?
    const ramp = (n, span) => clamp((LV - n) / span);           // 0 cuando aparece una novedad → 1 «span» niveles después
    const F = {
      golden: has(11), fly: has(21), wind: has(31), rain: has(41), rocks: has(51),
      shrink: has(61), flock: has(71), walk: has(81), night: has(91),
    };
    const SKY = F.night ? 'night' : F.flock ? 'sunset' : (LV >= 31 && LV <= 40) ? 'dawn' : 'day';
    const SCENE = F.night ? 'night' : LV >= 81 ? 'village' : LV >= 51 && LV <= 60 ? 'lake' : LV >= 61 && LV <= 70 ? 'thorny' : 'field';

    // ───────────────────────── Dificultad del nivel ─────────────────────────
    const TYPES = ['buena', 'camino', 'piedras', 'espinas'];
    const FALL = 0.62;                                          // segundos que tarda en caer la semilla (igual en todas las pantallas)
    const COOL = 0.36;                                          // pausa mínima entre dos semillas
    const BAG = GOAL + Math.round(lerp(12, 5, D));              // la bolsa: meta + holgura (grande al principio, pequeña al final)
    const V0 = lerp(46, 92, Math.pow(D, 0.85));                 // velocidad del terreno al empezar la partida
    const VR = lerp(8, 24, D);                                  // lo que acelera dentro de la partida…
    const RAMP = 50;                                            // …en estos segundos
    const GOOD_W = lerp(122, 40, Math.pow(D, 0.8));             // ancho medio de la tierra buena
    const P_GOOD = lerp(0.68, 0.32, D);                         // probabilidad de tierra buena tras un tramo malo
    const MAX_BAD = Math.round(lerp(2, 4, D));                  // nunca más de estos tramos malos seguidos
    const BAD_W = [lerp(62, 74, D), lerp(98, 112, D)];          // ancho de los tramos malos
    const P_GOLD = F.golden ? lerp(0.24, 0.14, ramp(11, 89)) : 0;
    const P_SHRINK = F.shrink ? lerp(0.3, 0.6, ramp(61, 39)) : 0;
    const SHRINK = 0.27;                                        // cuánto se cierran las espinas por cada lado (fracción del ancho)
    const BIRD_EVERY = F.fly ? lerp(6.5, 3.2, ramp(21, 79)) : 0;   // segundos entre pajaritos (en promedio)
    const BIRD_V = lerp(52, 92, ramp(21, 79));
    const P_FLOCK = F.flock ? lerp(0.35, 0.65, ramp(71, 29)) : 0;
    const DRIFT = F.wind ? lerp(26, 56, ramp(31, 69)) : 0;      // desvío máximo de la semilla por el viento
    const WRATE = 0.5;                                          // qué tan rápido cambia el viento (por segundo)
    const ROCK_EVERY = F.rocks ? lerp(7.5, 4, ramp(51, 49)) : 0;
    const ROCK_V = lerp(24, 48, ramp(51, 49));                  // las piedras ruedan más rápido que el terreno
    const WALK_A = F.walk ? lerp(34, 56, ramp(81, 19)) : 0;     // el sembrador camina de un lado a otro
    const WALK_W = F.walk ? (Math.PI * 2) / lerp(9, 6.5, ramp(81, 19)) : 0;
    const WALK_C = W / 2 - (F.walk ? 10 : 0);

    // Distancia que avanza el terreno entre dos instantes de la partida (la velocidad sube en línea recta y luego se queda).
    const speedAt = tm => V0 + VR * clamp(tm / RAMP);
    const travelTo = tm => { const c = Math.min(tm, RAMP); return V0 * tm + VR * (c * c) / (2 * RAMP) + (tm > RAMP ? VR * (tm - RAMP) : 0); };
    const travel = (a, b) => travelTo(b) - travelTo(a);
    const sowerXAt = tm => WALK_C + WALK_A * Math.sin(WALK_W * tm);

    // ───────────────────────── Estado ─────────────────────────
    let t = 0, cool = 0, throwT = 9, started = false, seedsLeft = BAG, endT = 0, segId = 0, badRun = 0;
    let wind = 0, windTarget = 0, windT = 2.5;
    let birdT = F.fly ? 2.5 : 0, rockT = F.rocks ? 3 : 0, rainT = F.rain ? 1.5 : 0;
    const segs = [];                   // { x, w, type, golden, wet, shrink, planted, items: [{ dx, kind, gold, t }] }
    const seeds = [];                  // { x0, drift, x, y, t }
    const pecks = [];                  // pajaritos que bajan al camino a comerse la semilla { seg, dx, t }
    const flyers = [];                 // pajaritos que vuelan { x, y, vx, t, fed }
    const rocks = [];                  // piedras que ruedan { x, r, rot }
    const bounces = [];                // semillas que rebotan en una piedra { x, y, vx, vy, t }
    let rain = null;                   // nube de lluvia { x, v, w }
    const L = { strip: 0, stripH: 0, sowerX: WALK_C, sowerY: 0, handX: WALK_C + 24, handY: 0 };

    function layout() {
      L.stripH = clamp(api.H * 0.17, 84, 120);
      L.strip = api.bottom - L.stripH + 6;
      L.sowerY = api.top + clamp(api.H * 0.2, 96, 150);
      L.sowerX = sowerXAt(t);
      L.handX = L.sowerX + 24;
      L.handY = L.sowerY - 34;
    }
    layout();

    // ───────────────────────── Terreno ─────────────────────────
    function nextType(prev) {
      // Tierra buena frecuente al principio de la partida; nunca dos tramos iguales seguidos.
      const pGood = P_GOOD + 0.08 * clamp(1 - t / 15) - 0.05 * clamp(t / RAMP);
      if (prev !== 'buena' && (badRun >= MAX_BAD || api.rand() < pGood)) return 'buena';
      let ty;
      do { ty = api.pick(TYPES.slice(1)); } while (ty === prev);
      return ty;
    }
    function addSeg() {
      const last = segs[segs.length - 1];
      // Al empezar: camino, un tramo malo y enseguida tierra buena (el primer toque ya puede dar fruto).
      const type = !last ? 'camino' : segs.length === 1 ? api.pick(['piedras', 'espinas']) : segs.length === 2 ? 'buena' : nextType(last.type);
      const easy = clamp(1 - t / 20) * lerp(36, 6, D);         // en los primeros segundos la tierra buena es más ancha
      const seg = { id: ++segId, x: last ? last.x + last.w : -20, w: 0, type, golden: false, wet: false, shrink: false, planted: false, items: [] };
      if (type === 'buena') {
        seg.w = GOOD_W + api.randRange(-10, 14) + easy;
        if (segs.length > 2 && api.rand() < P_SHRINK) { seg.shrink = true; seg.w += 30; }
        else if (segs.length > 2 && api.rand() < P_GOLD) seg.golden = true;
      } else seg.w = api.randRange(BAD_W[0], BAD_W[1]);
      badRun = type === 'buena' ? 0 : badRun + 1;
      segs.push(seg);
    }
    // Se genera terreno de sobra a la derecha (también para poder prever dónde caerá la semilla).
    const fillSegs = () => { while (!segs.length || segs[segs.length - 1].x + segs[segs.length - 1].w < W + 300) addSeg(); };
    fillSegs();

    // Espinas que crecen: margen de espinas a cada lado de un tramo de tierra buena según dónde va (0 al entrar → máx. al pasar).
    function margin(seg, sx) {
      if (!seg.shrink) return 0;
      const c = sx + seg.w / 2;
      return seg.w * SHRINK * clamp((W + 40 - c) / 230);
    }
    // Qué hay en el suelo en la x de pantalla `x` si los tramos estuvieran corridos `shift` a la izquierda.
    function soilAt(x, shift = 0) {
      for (const s of segs) {
        const sx = s.x - shift;
        if (x >= sx && x < sx + s.w) {
          if (s.type !== 'buena') return { seg: s, kind: s.type, edge: 0 };
          const m = margin(s, sx);
          const a = sx + m, b = sx + s.w - m;
          if (x < a || x > b) return { seg: s, kind: 'espinas', edge: 0 };
          return { seg: s, kind: 'buena', edge: Math.min(x - a, b - x) };
        }
      }
      return null;
    }

    // ───────────────────────── Acciones ─────────────────────────
    if (LV <= 1) api.hint('Toca para soltar la semilla en la tierra buena', 3200);
    else if (LV === 2) api.hint('Una semilla basta: ¡todo el surco se llena de trigo!', 3000);
    else if (LV === 3) api.hint('El circulito marca dónde cae la semilla', 2800);
    else if (NEWS[LV]) api.hint(NEWS[LV], 3400);

    function drop() {
      if (cool > 0 || seedsLeft <= 0) return;
      cool = COOL; throwT = 0; started = true; seedsLeft--;
      seeds.push({ x0: L.handX, drift: wind * DRIFT, x: L.handX, y: L.handY, t: 0 });
      api.sfx('drop');
    }
    function land(seed) {
      const x = seed.x;
      // Piedra que rueda: la semilla rebota y se pierde.
      const rk = rocks.find(r => Math.abs(r.x - x) < r.r + 5);
      if (rk) {
        bounces.push({ x, y: L.strip - rk.r * 2, vx: api.randRange(-60, 60), vy: -170, t: 0 });
        api.floatText(x, L.strip - 40, '¡Rebotó!', { color: '#fff', size: 15 });
        api.sfx('tick');
        return;
      }
      const soil = soilAt(x);
      if (!soil) return;
      const seg = soil.seg;
      const dx = x - seg.x;
      const gy = L.strip + 16;
      if (soil.kind === 'buena' && seg.planted) {
        // Ese surco ya dio su trigo: hay que esperar la próxima tierra buena libre.
        api.floatText(x, L.strip - 64, 'Ya está sembrado', { color: '#fff', size: 14 });
        api.sfx('tick');
      } else if (soil.kind === 'buena') {
        // Una semilla en tierra buena da mucho fruto: brota trigo en todo el surco, empezando donde cayó.
        const pts = seg.golden ? 2 : 1;
        seg.planted = true;
        const m = margin(seg, seg.x), a = m + 9, b = seg.w - m - 9;
        const n = Math.max(1, Math.round((b - a) / 15));
        for (let i = 0; i <= n; i++) {
          const px = a + ((b - a) * i) / n;
          seg.items.push({ dx: px, kind: 'wheat', gold: seg.golden, main: false, t: -Math.abs(px - dx) / 150 });
        }
        seg.items.push({ dx, kind: 'wheat', gold: seg.golden, main: true, t: 0 });
        api.floatText(x, L.strip - 56, seg.golden ? '¡Vale por 2!' : api.pick(['¡×30!', '¡×60!', '¡×100!']), { color: '#fff3b0', size: seg.golden ? 20 : 18 });
        api.sfx('grow'); api.burst(x, gy, { color: seg.golden ? '#ffe27a' : PAL.sun, count: seg.golden ? 14 : 9, speed: 90 });
        if (seg.wet) {
          seedsLeft++;
          api.floatText(x + 30, L.strip - 30, '+1 semilla', { color: '#d6f0ff', size: 15 });
          api.sfx('bubble');
        }
        api.addScore(pts, x, L.strip - 26);           // puede terminar la partida (meta del nivel)
      } else if (soil.kind === 'camino') {
        seg.items.push({ dx, kind: 'seed', t: 0 });
        pecks.push({ seg, dx, t: 0 });
        api.sfx('chirp');
      } else if (soil.kind === 'piedras') {
        seg.items.push({ dx, kind: 'wilt', t: 0 });
        api.sfx('tick');
      } else {
        seg.items.push({ dx, kind: 'choke', t: 0 });
        api.sfx('wrong');
      }
    }

    // ───────────────────────── Novedades ─────────────────────────
    function spawnBirds() {
      const dir = api.rand() < 0.5 ? 1 : -1;
      const n = api.rand() < P_FLOCK ? api.randInt(2, 3) : 1;
      const y0 = api.randRange(L.handY + 48, L.strip - 54);
      const v = BIRD_V * api.randRange(0.88, 1.15);
      for (let i = 0; i < n; i++) {
        flyers.push({ x: dir > 0 ? -24 - i * 38 : W + 24 + i * 38, y: clamp(y0 + (i % 2) * 14, L.handY + 40, L.strip - 40), vx: dir * v, t: i * 0.7, fed: 0 });
      }
    }
    function newWind() {
      const r = api.rand();
      windTarget = r < 0.15 ? 0 : (api.rand() < 0.5 ? -1 : 1) * api.randRange(0.35, 1);
      windT = api.randRange(4, 7);
    }
    // El viento se mueve hacia su objetivo a WRATE por segundo (así se puede prever).
    const windAfter = dtau => {
      const diff = windTarget - wind, step = WRATE * dtau;
      return Math.abs(diff) <= step ? windTarget : wind + Math.sign(diff) * step;
    };

    // Previsión: qué pasaría con una semilla soltada dentro de `delay` segundos (para pruebas y bots; no cambia nada).
    function forecast(delay = 0) {
      const tDrop = t + delay, tLand = tDrop + FALL;
      const hx = sowerXAt(tDrop) + 24;
      const drift = windAfter(delay) * DRIFT;
      const lx = hx + drift;
      const shift = travel(t, tLand);
      const soil = soilAt(lx, shift);
      const rockHit = rocks.some(r => Math.abs(r.x - (travel(t, tLand) + ROCK_V * (tLand - t)) - lx) < r.r + 5);
      let birdHit = false;
      for (const b of flyers) {
        if (b.fed) continue;
        for (let i = 0; i <= 24 && !birdHit; i++) {
          const k = i / 24, tau = tDrop + k * FALL - t;
          const sx = hx + drift * k, sy = lerp(L.handY, L.strip + 4, k * k);
          if (Math.hypot(b.x + b.vx * tau - sx, b.y - sy) < 19) birdHit = true;
        }
      }
      const kind = soil ? soil.kind : null;
      let pending = false;
      if (kind === 'buena') {
        for (const sd of seeds) {
          const left = FALL - sd.t, fx = sd.x0 + sd.drift;
          const fs = soilAt(fx, travel(t, t + left));
          if (fs && fs.seg === soil.seg && fs.kind === 'buena') pending = true;
        }
      }
      return {
        x: lx, kind, golden: !!soil?.seg.golden, wet: !!soil?.seg.wet, edge: soil ? soil.edge : 0,
        planted: !!soil?.seg.planted || pending, rockHit, birdHit, ok: kind === 'buena' && !soil.seg.planted && !pending && !rockHit && !birdHit,
      };
    }

    // ───────────────────────── Dibujo de cada tipo de suelo ─────────────────────────
    const SOIL = {
      buena: ['#7a4a2a', '#5f3920'], gold: ['#b07a2e', '#8f5e22'], wet: ['#5a3520', '#47291a'],
      camino: ['#e3cfa6', '#d2bb8c'], piedras: ['#b9bfc9', '#9aa2ae'], espinas: ['#8a9a62', '#6e7f4c'],
    };
    function drawSeg(g, s) {
      const y = L.strip, h = L.stripH + 30;
      const key = s.type === 'buena' ? (s.golden ? 'gold' : s.wet ? 'wet' : 'buena') : s.type;
      const colors = SOIL[key];
      g.fillStyle = colors[0]; g.fillRect(s.x, y, s.w + 1, h);
      g.fillStyle = colors[1]; g.fillRect(s.x, y + 26, s.w + 1, h);
      if (s.type === 'buena') {
        for (let x = 10; x < s.w - 6; x += 18) kit.fillRR(g, s.x + x, y + 9, 10, 5, 2.5, s.golden ? '#cf9a3e' : s.wet ? '#6e4428' : '#96623a');
        kit.fillRR(g, s.x, y - 3, s.w + 1, 7, 3, s.golden ? '#e7b54a' : s.wet ? '#6f4a30' : '#9a6a40');
        if (s.golden) {
          for (let x = 12; x < s.w - 8; x += 26) kit.star(g, s.x + x, y + 34 + (x % 3) * 4, 3.6 + Math.sin(t * 5 + x) * 1.2, '#fff3b0', t + x);
        }
        if (s.wet) {
          for (let x = 14; x < s.w - 10; x += 30) kit.ellipse(g, s.x + x, y + 22 + (x % 4) * 2, 8, 2.6, 'rgba(140, 200, 255, 0.55)');
          kit.drop(g, s.x + s.w / 2, y + 46, 0.7, '#8fd0ff');
        }
        if (s.shrink) {
          const m = margin(s, s.x);
          if (m > 1) {
            for (const side of [0, 1]) {
              const x0 = side ? s.x + s.w - m : s.x;
              g.fillStyle = SOIL.espinas[0]; g.fillRect(x0, y - 2, m + 1, h);
              g.fillStyle = SOIL.espinas[1]; g.fillRect(x0, y + 26, m + 1, h);
              const n = Math.max(1, Math.floor(m / 16));
              for (let i = 0; i < n; i++) thorn(g, x0 + (i + 0.5) * (m / n), y + 8, 0.55 + 0.45 * clamp(m / 24));
            }
          }
        }
      } else if (s.type === 'camino') {
        for (let x = 14; x < s.w - 8; x += 26) { kit.ellipse(g, s.x + x, y + 12 + (x % 3) * 3, 5, 2.6, '#c9b183'); kit.ellipse(g, s.x + x + 9, y + 20, 4, 2.2, '#c9b183'); }
        kit.fillRR(g, s.x, y - 2, s.w + 1, 5, 2, '#eedcb6');
      } else if (s.type === 'piedras') {
        for (let x = 16; x < s.w - 8; x += 30) kit.rock(g, s.x + x, y + 14 + (x % 2) * 6, 0.62, x % 4 ? PAL.stone : PAL.stoneDeep);
        kit.fillRR(g, s.x, y - 2, s.w + 1, 5, 2, '#cfd4dc');
      } else {
        for (let x = 14; x < s.w - 4; x += 22) thorn(g, s.x + x, y + 8, 1);
        kit.fillRR(g, s.x, y - 2, s.w + 1, 5, 2, '#9cab72');
      }
      for (const it of s.items) drawItem(g, s.x + it.dx, y, it);
    }
    function thorn(g, x, y, s) {
      g.save(); g.strokeStyle = '#4f6a3a'; g.lineWidth = 2.4 * s; g.lineCap = 'round';
      for (const a of [-0.9, -0.3, 0.3, 0.9]) { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.sin(a) * 9 * s, y - 12 * s, x + Math.sin(a) * 16 * s, y - 19 * s); g.stroke(); }
      g.fillStyle = '#b07ab8'; g.beginPath(); g.arc(x, y - 19 * s, 3 * s, 0, 6.28); g.fill();
      g.restore();
    }
    function wheat(g, x, y, k, wither = 0, gold = false) {
      // k = 0..1 crecimiento; wither = 0..1 marchito
      const h = (gold ? 52 : 44) * k;
      g.save(); g.translate(x, y); g.rotate(wither * 0.9);
      g.strokeStyle = wither > 0.3 ? '#b59a5a' : '#7fb24a'; g.lineWidth = 2.6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -h); g.stroke();
      if (k > 0.55) {
        g.fillStyle = wither > 0.3 ? '#c9a857' : gold ? '#ffd65a' : PAL.sun;
        const n = Math.round(lerp(0, gold ? 5 : 4, (k - 0.55) / 0.45));
        for (let i = 0; i < n; i++) for (const d of [-1, 1]) { g.beginPath(); g.ellipse(d * 3.4, -h + 2 + i * 5.5, 2.8, 4.2, d * 0.5, 0, 6.28); g.fill(); }
        g.beginPath(); g.ellipse(0, -h - 3, 2.6, 4.4, 0, 0, 6.28); g.fill();
      } else if (k > 0.1) {
        g.fillStyle = '#8fd16a'; g.beginPath(); g.ellipse(-4, -h, 4.5, 2.4, -0.5, 0, 6.28); g.ellipse(4, -h, 4.5, 2.4, 0.5, 0, 6.28); g.fill();
      }
      g.restore();
    }
    function drawItem(g, x, y, it) {
      if (it.kind === 'wheat') {
        if (it.t <= 0) return;
        const k = ease.outBack(clamp(it.t / 0.8));
        if (it.gold && it.main && k > 0.6) kit.circle(g, x, y - 40, 13 + Math.sin(t * 4 + x) * 2, 'rgba(255, 236, 140, 0.4)');
        wheat(g, x, y + 2, it.main ? k : k * 0.88, 0, it.gold);
      } else if (it.kind === 'seed') { if (it.t < 0.7) kit.seed(g, x, y + 2, 5); }
      else if (it.kind === 'wilt') {
        const grow = clamp(it.t / 0.35), dry = clamp((it.t - 0.6) / 0.6);
        if (it.t < 1.6) { g.save(); g.globalAlpha = 1 - clamp((it.t - 1.2) / 0.4); wheat(g, x, y + 2, grow * 0.45, dry); g.restore(); }
        if (it.t > 0.5 && it.t < 1.4) kit.emoji(g, '☀️', x + 12, y - 30, 14, { alpha: 0.9 });
      } else if (it.kind === 'choke') {
        const k = clamp(it.t / 0.5);
        if (it.t < 1.2) { g.save(); g.globalAlpha = 1 - clamp((it.t - 0.8) / 0.4); wheat(g, x, y + 2, 0.3 * (1 - k * 0.5), k * 0.6); thorn(g, x - 6, y + 4, 0.8 + k * 0.5); thorn(g, x + 7, y + 4, 0.8 + k * 0.5); g.restore(); }
      }
    }
    // Piedra redonda que rueda (con su carita de piedra tranquila, nada de miedo).
    function rollingRock(g, r) {
      const y = L.strip - r.r + 3;
      kit.shadow(g, r.x, L.strip + 2, r.r * 0.9, 3, 0.22);
      kit.circle(g, r.x, y, r.r, PAL.stoneDeep);
      kit.circle(g, r.x - 1.5, y - 1.5, r.r - 2, PAL.stone);
      g.save(); g.translate(r.x, y); g.rotate(r.rot);
      g.strokeStyle = 'rgba(90, 98, 112, 0.55)'; g.lineWidth = 2; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-r.r * 0.5, -r.r * 0.1); g.lineTo(r.r * 0.1, r.r * 0.35); g.moveTo(r.r * 0.2, -r.r * 0.55); g.lineTo(r.r * 0.55, -r.r * 0.2); g.stroke();
      g.restore();
      kit.ellipse(g, r.x - r.r * 0.35, y - r.r * 0.45, r.r * 0.3, r.r * 0.14, 'rgba(255,255,255,0.4)', -0.4);
    }
    // Paisaje del fondo según el tramo de niveles.
    function drawScenery(g, H) {
      const night = SCENE === 'night', dusk = SKY === 'sunset';
      if (night) {
        kit.stars(g, W, L.sowerY + 40, t, 46, 11);
        kit.moon(g, 66, api.top + 40, 20);
      } else if (dusk) kit.sun(g, 296, L.strip - 120, 26, t);
      else kit.sun(g, 66, api.top + 40, 22, t);
      if (!night) {
        kit.cloud(g, ((t * 7) % (W + 120)) - 60, api.top + 34, 0.9, dusk ? 0.75 : 0.95, dusk ? '#ffe3cf' : '#ffffff');
        kit.cloud(g, ((t * 4 + 200) % (W + 140)) - 70, api.top + 84, 0.7, dusk ? 0.65 : 0.8, dusk ? '#ffe3cf' : '#ffffff');
      }
      const far = night ? '#3f5b78' : dusk ? '#d6b57c' : SKY === 'dawn' ? '#c9dfa8' : SCENE === 'thorny' ? '#b7cf8e' : '#bfe3a0';
      const near = night ? '#355a52' : dusk ? '#b9c27a' : SCENE === 'thorny' ? '#93bf74' : PAL.leafLight;
      if (SCENE === 'lake') {
        kit.water(g, W, H, L.strip - 74, t);
        // la barca desde donde Jesús enseñaba (Mateo 13, 2)
        const bx = 250 + Math.sin(t * 0.4) * 30, by = L.strip - 58 + Math.sin(t * 1.6) * 1.5;
        kit.person(g, bx, by - 4, 0.42, { robe: '#ffffff', sash: '#d0453b', beard: true, arms: 'open', t });
        g.save(); g.fillStyle = PAL.woodDeep; g.beginPath(); g.moveTo(bx - 22, by - 6); g.lineTo(bx + 22, by - 6); g.lineTo(bx + 15, by + 4); g.lineTo(bx - 15, by + 4); g.closePath(); g.fill(); g.restore();
        kit.hills(g, W, H, L.strip - 24, 10, near, t * 9 + 90, 0.016);
        return;
      }
      kit.hills(g, W, H, L.strip - 60, 20, far, t * 5, 0.011);
      if (SCENE === 'village') {
        // casitas de la aldea en la loma lejana
        for (let i = 0; i < 4; i++) {
          const hx = ((i * 97 - t * 5) % (W + 80) + W + 80) % (W + 80) - 40, hy = L.strip - 62 + (i % 2) * 6;
          kit.fillRR(g, hx - 14, hy - 18, 28, 20, 3, dusk ? '#f1d1a8' : '#f4e2c2');
          kit.fillRR(g, hx - 16, hy - 21, 32, 5, 2, '#c99a6a');
          kit.fillRR(g, hx - 4, hy - 9, 8, 11, 2, '#8a5a3c');
        }
      }
      kit.hills(g, W, H, L.strip - 28, 14, near, t * 9 + 90, 0.016);
      if (SCENE === 'thorny') for (let i = 0; i < 5; i++) kit.bush(g, ((i * 83 - t * 9) % (W + 60) + W + 60) % (W + 60) - 30, L.strip - 20, 0.5, '#5e7f4a');
    }
    function drawRain(g) {
      if (!rain) return;
      const top = api.top + 30;
      g.save();
      g.strokeStyle = 'rgba(120, 170, 230, 0.6)'; g.lineWidth = 2; g.lineCap = 'round';
      for (let i = 0; i < 14; i++) {
        const x = rain.x - rain.w / 2 + ((i * 37) % rain.w);
        const y = top + 20 + (((t * 260) + i * 53) % (L.strip - top - 20));
        g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y + 10); g.stroke();
      }
      g.restore();
      kit.cloud(g, rain.x - 26, top + 6, 1.05, 1, '#c4cedc');
      kit.cloud(g, rain.x + 22, top, 0.95, 1, '#d7dfe9');
    }

    return {
      update(dt) {
        t += dt;
        cool -= dt; throwT += dt;
        const v = travel(t - dt, t);
        for (const s of segs) { s.x -= v; for (const it of s.items) it.t += dt; }
        while (segs.length && segs[0].x + segs[0].w < -40) segs.shift();
        fillSegs();
        // el sembrador (camina en los niveles 81+)
        L.sowerX = sowerXAt(t); L.handX = L.sowerX + 24;
        // viento
        if (F.wind) {
          windT -= dt; if (windT <= 0) newWind();
          wind = windAfter(dt);
        }
        // semillas en el aire
        for (let i = seeds.length - 1; i >= 0; i--) {
          const s = seeds[i];
          s.t += dt;
          const k = clamp(s.t / FALL);
          s.y = lerp(L.handY, L.strip + 4, k * k);
          s.x = s.x0 + s.drift * k;
          const b = flyers.find(f => !f.fed && Math.hypot(f.x - s.x, f.y - s.y) < 19);
          if (b) {
            b.fed = 0.01; seeds.splice(i, 1);
            api.floatText(b.x, b.y - 22, '¡Ñam!', { color: '#fff', size: 15 }); api.sfx('chirp');
            continue;
          }
          if (k >= 1) { seeds.splice(i, 1); land(s); }
        }
        // pajaritos del camino
        for (let i = pecks.length - 1; i >= 0; i--) {
          const b = pecks[i];
          b.t += dt;
          if (b.t > 0.55 && !b.ate) { b.ate = true; b.seg.items = b.seg.items.filter(it => !(it.kind === 'seed' && it.dx === b.dx)); api.floatText(b.seg.x + b.dx, L.strip - 30, '¡Se la comió!', { color: '#fff', size: 15 }); }
          if (b.t > 1.5) pecks.splice(i, 1);
        }
        // pajaritos que vuelan (21+)
        if (F.fly) {
          birdT -= dt;
          if (birdT <= 0) { spawnBirds(); birdT = BIRD_EVERY * api.randRange(0.75, 1.3) * (1 - 0.15 * clamp(t / RAMP)); }
          for (let i = flyers.length - 1; i >= 0; i--) {
            const b = flyers[i];
            b.t += dt; b.x += b.vx * dt;
            if (b.fed) { b.fed += dt; b.y -= 70 * dt; }
            if (b.x < -60 || b.x > W + 60 || b.fed > 2.5) flyers.splice(i, 1);
          }
        }
        // piedras que ruedan (51+)
        if (F.rocks) {
          rockT -= dt;
          if (rockT <= 0) { rocks.push({ x: W + 30, r: api.randRange(11, 14), rot: 0 }); rockT = ROCK_EVERY * api.randRange(0.75, 1.3); }
          const rv = speedAt(t) + ROCK_V;
          for (let i = rocks.length - 1; i >= 0; i--) { const r = rocks[i]; r.x -= rv * dt; r.rot -= (rv * dt) / r.r; if (r.x < -40) rocks.splice(i, 1); }
        }
        // lluvia (41+): moja la tierra buena que pasa por debajo
        if (F.rain) {
          if (!rain) { rainT -= dt; if (rainT <= 0) rain = { x: W + 90, v: 58, w: 96 }; }
          else {
            rain.x -= rain.v * dt;
            for (const s of segs) if (s.type === 'buena' && !s.wet && !s.golden && s.x < rain.x + rain.w / 2 && s.x + s.w > rain.x - rain.w / 2) s.wet = true;
            if (rain.x < -90) { rain = null; rainT = api.randRange(8, 14) * lerp(1, 1.7, ramp(41, 59)); }
          }
        }
        // semillas que rebotan
        for (let i = bounces.length - 1; i >= 0; i--) {
          const b = bounces[i]; b.t += dt; b.vy += 600 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
          if (b.t > 0.9) bounces.splice(i, 1);
        }
        if (api.keys.has('action') && cool <= 0) drop();
        // Sin semillas en la bolsa ni en el aire: termina la siembra (si no se llegó a la meta, el nivel no se gana).
        if (seedsLeft <= 0 && !seeds.length) { endT += dt; if (endT > 1.6) api.end({}); } else endT = 0;
      },
      draw(g) {
        const H = api.H;
        kit.sky(g, W, H, SKY);
        drawScenery(g, H);
        drawRain(g);
        // la loma donde está el sembrador (si camina, la loma cruza todo el campo)
        if (F.walk) {
          kit.fillRR(g, -30, L.sowerY + 22, W + 60, 30, 14, '#a9744a');
          kit.fillRR(g, -30, L.sowerY + 8, W + 60, 22, 11, F.night ? '#4f8a5a' : PAL.leaf);
          kit.fillRR(g, -30, L.sowerY + 8, W + 60, 8, 4, F.night ? '#6fa06e' : PAL.leafLight);
          kit.bush(g, 22, L.sowerY + 12, 0.55); kit.bush(g, W - 18, L.sowerY + 12, 0.5);
        } else {
          kit.fillRR(g, -30, L.sowerY + 22, L.sowerX + 64, 30, 14, '#a9744a');
          kit.fillRR(g, -30, L.sowerY + 36, L.sowerX + 50, 22, 11, '#96643a');
          kit.fillRR(g, -30, L.sowerY + 8, L.sowerX + 70, 22, 11, PAL.leaf);
          kit.fillRR(g, -30, L.sowerY + 8, L.sowerX + 70, 8, 4, PAL.leafLight);
          kit.tree(g, 40, L.sowerY + 12, 0.8, { kind: SCENE === 'lake' ? 'olive' : 'round', sway: F.wind ? wind * 4 + Math.sin(t * 3) : 0 });
          kit.bush(g, 96, L.sowerY + 12, 0.6);
        }
        // guía de caída (con viento se curva hacia donde caerá)
        const drift = wind * DRIFT, lx = L.handX + drift;
        g.save(); g.setLineDash([3, 7]); g.strokeStyle = F.night ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.6)'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(L.handX, L.handY + 8);
        for (let i = 1; i <= 8; i++) { const k = i / 8; g.lineTo(L.handX + drift * k, lerp(L.handY + 8, L.strip - 4, k * k)); }
        g.stroke(); g.restore();
        kit.circle(g, lx, L.strip - 2, 6 + Math.sin(t * 5) * 1.5, null, 'rgba(255,255,255,0.9)', 2);
        // terreno
        for (const s of segs) if (s.x < W + 2 && s.x + s.w > -2) drawSeg(g, s);
        for (const r of rocks) if (r.x < W + 30) rollingRock(g, r);
        // pajaritos que bajan al camino
        for (const b of pecks) {
          const k = clamp(b.t / 0.5), out = clamp((b.t - 0.8) / 0.7);
          const bx = b.seg.x + b.dx + lerp(60, 6, ease.outCubic(k)) + out * 90, by = lerp(L.strip - 90, L.strip - 6, ease.outCubic(k)) - out * 110;
          kit.emoji(g, '🐦', bx, by, 22, { flip: true });
        }
        // pajaritos que vuelan (miran hacia donde van; el que comió sube contento)
        for (const b of flyers) {
          const bob = Math.sin(b.t * 9) * 3;
          kit.emoji(g, '🐦', b.x, b.y + bob, 24, { flip: b.vx > 0 });
          if (b.fed) kit.heart(g, b.x + 12, b.y - 18 - b.fed * 10, 0.6);
        }
        // semillas cayendo y semillas que rebotan
        for (const s of seeds) kit.seed(g, s.x, s.y, 5.5, s.t * 8);
        for (const b of bounces) kit.seed(g, b.x, b.y, 5, b.t * 14);
        // luciérnagas (91+)
        if (F.night) {
          for (let i = 0; i < 7; i++) {
            const fx = ((i * 61 + t * 10 + Math.sin(t * 0.8 + i) * 24) % (W + 20) + W + 20) % (W + 20) - 10;
            const fy = L.strip - 30 - ((i * 41) % 110) + Math.sin(t * 1.4 + i * 2) * 10;
            const a = 0.5 + 0.5 * Math.sin(t * 3 + i);
            kit.circle(g, fx, fy, 6, `rgba(255, 240, 150, ${0.25 * a})`); kit.circle(g, fx, fy, 2.2, `rgba(255, 246, 180, ${0.6 + 0.4 * a})`);
          }
        }
        // sembrador con su bolsa
        const reach = throwT < 0.3;
        kit.person(g, L.sowerX, L.sowerY + 12, 1.25, { robe: '#e9c46a', sash: '#b5651d', beard: true, hair: '#5a3b28', arms: reach ? 'reach' : 'down', t, walk: F.walk });
        kit.fillRR(g, L.sowerX - 22, L.sowerY - 26, 15, 18, 6, '#c9a36a');
        kit.fillRR(g, L.sowerX - 21, L.sowerY - 29, 13, 5, 2, '#a9824e');
        // semillas que quedan en la bolsa
        kit.fillRR(g, W - 96, L.sowerY - 46, 84, 30, 15, 'rgba(255,255,255,0.92)');
        kit.seed(g, W - 78, L.sowerY - 31, 8);
        kit.text(g, `× ${seedsLeft}`, W - 44, L.sowerY - 30, { size: 17, color: seedsLeft <= 5 ? PAL.coralDeep : PAL.ink });
        // veleta del viento (31+)
        if (F.wind) {
          const cx = W - 54, cy = L.sowerY - 2;
          kit.fillRR(g, W - 96, cy - 14, 84, 28, 14, 'rgba(255,255,255,0.9)');
          kit.emoji(g, '💨', W - 80, cy, 15);
          const len = 8 + Math.abs(wind) * 26, dir = wind >= 0 ? 1 : -1;
          if (Math.abs(wind) < 0.08) kit.circle(g, cx + 12, cy, 4, PAL.inkSoft);
          else {
            g.save(); g.strokeStyle = PAL.skyDeep; g.fillStyle = PAL.skyDeep; g.lineWidth = 4; g.lineCap = 'round';
            const x0 = cx + 12 - (len / 2) * dir, x1 = cx + 12 + (len / 2) * dir;
            g.beginPath(); g.moveTo(x0, cy); g.lineTo(x1, cy); g.stroke();
            g.beginPath(); g.moveTo(x1 + 4 * dir, cy); g.lineTo(x1 - 5 * dir, cy - 7); g.lineTo(x1 - 5 * dir, cy + 7); g.closePath(); g.fill();
            g.restore();
          }
        }
        if (!started && Math.sin(t * 4) > 0) kit.emoji(g, '👆', W / 2, (L.sowerY + L.strip) / 2 + 20, 30);
        // leyenda de los suelos (primeros segundos de los primeros niveles)
        if (LV <= 10 && t < 9) {
          const a = clamp((9 - t) / 1.5);
          g.save(); g.globalAlpha = a;
          const ly = Math.max(L.handY + 60, L.strip - 150);   // encima de donde salen los «¡×30!»
          kit.fillRR(g, 60, ly, 240, 30, 15, 'rgba(255,255,255,0.92)');
          kit.fillRR(g, 74, ly + 7, 30, 16, 5, '#7a4a2a');
          kit.text(g, '= tierra buena', 112, ly + 16, { size: 15, align: 'left' });
          kit.emoji(g, '🌾', 258, ly + 15, 18);
          g.restore();
        }
      },
      pointerDown() { drop(); },
      keyDown(k) { if (k === 'action' || k === 'down') drop(); },
      resize() { layout(); },
      // Solo lectura, para pruebas: estado del campo y una previsión de dónde caería una semilla.
      get debug() {
        return {
          level: LV, difficulty: D, goal: GOAL, bag: BAG, seedsLeft, t, speed: speedAt(t), fall: FALL, cool: Math.max(0, cool),
          handX: L.handX, handY: L.handY, strip: L.strip, landX: L.handX + wind * DRIFT, wind, drift: DRIFT, features: { ...F },
          segs: segs.map(s => ({ x: s.x, w: s.w, type: s.type, golden: s.golden, wet: s.wet, shrink: s.shrink, planted: s.planted, margin: margin(s, s.x) })),
          seedsInAir: seeds.length, flyers: flyers.map(b => ({ x: b.x, y: b.y, vx: b.vx, fed: !!b.fed })), rocks: rocks.map(r => ({ x: r.x, r: r.r })),
          rain: rain ? { x: rain.x, w: rain.w } : null,
          forecast,
        };
      },
    };
  },
};
