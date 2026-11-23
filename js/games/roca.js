// La casa sobre la roca (Mateo 7, 24-27) — minijuego de apilar.
//
// Cada piso se desliza de lado a lado; al tocar, cae. Lo que sobresale se recorta y, si casi nada queda apoyado,
// el piso se cae (se pierde una vida). Cada pocos pisos llega una tormenta: la casa sobre la roca sigue firme,
// mientras que la casita sobre arena del fondo se la lleva el agua. Al llegar a la meta se pone el techito y llega
// la gran prueba: «cayó la lluvia, crecieron los ríos, soplaron los vientos… y la casa no se cayó».
//
// NIVELES (1..100, ver js/games/levels.js). Meta = api.goal pisos (9 → 50), 3 vidas y final propio (selfEnd: el
// juego pone el techo, hace pasar la tormenta y llama api.end({ won: true })).
// api.difficulty (D: 0 en el nivel 1, 1 en el 100) fija la velocidad del piso, la tolerancia del «¡Perfecto!», cuánto
// tiene que quedar apoyado un piso para no caerse, el ancho inicial y mínimo, cada cuánto llega la tormenta y la fuerza
// del viento. Dentro de la partida la velocidad sube un poquito con cada piso.
// Novedades (se anuncian con api.hint al empezar el nivel en que aparecen; ver NEWS):
//    6 piso de roca (ancho, se queda entero)       11 piso con corazón (bien puesto = +1 vida)
//   16 viento en la tormenta (empuja el piso)       21 tarde dorada, tormentas más seguidas
//   26 piso veloz                                   31 la polea: pisos que se mecen colgados
//   36 piso angosto                                 41 atardecer: el río crece en la tormenta
//   46 ráfagas de viento sin tormenta               56 noche con ventanitas encendidas
//   66 piso travieso (a ratos corre y a ratos frena) 76 amanecer: el viento cambia de lado
//   86 campanario: un balcón cada 10 pisos          91 la gran tormenta (todo junto)
// En el nivel en que se presenta una novedad, sale sí o sí en el segundo piso (SHOW).
// El techito del final cambia según el nivel (rojo, azul, con cruz, cúpula, campanario, dorado con estrella); en el
// final la cámara se aleja hasta mostrar toda la casa sobre la roca, sale el arcoíris y la palomita se posa en el techo.
// Curva medida con bots (niños de 7–10): 1–5 casi tutorial, 6–30 suave, 30–70 retador, 70–100 difícil pero justo.
// Duración de una partida ganada: ≈ 23 s (nivel 1) … ≈ 70 s (nivel 100).
//
// Movimiento con paso fijo (STEP) para que la predicción de debug.landingAt(t) coincida con lo que de verdad pasa.

const NEWS = {
  1: 'Toca para soltar el piso justo encima del otro',
  2: 'Si cae bien centrado: ¡Perfecto! y el piso no se achica',
  3: 'Cuando las líneas brillan, ¡es el momento de tocar!',
  6: '¡Nuevo: piso de roca 🪨! Es ancho y se queda entero',
  11: '¡Nuevo: piso con corazón 💛! Ponlo bien centrado y recuperas una vida',
  16: '¡Nuevo: viento en la tormenta 💨! Empuja el piso al caer',
  21: '¡Nuevo: la tarde dorada ☀️! Las tormentas llegan más seguido',
  26: '¡Nuevo: piso veloz ⚡! Ese corre más rápido',
  31: '¡Nuevo: la polea 🪢! Algunos pisos se mecen colgados',
  36: '¡Nuevo: piso angosto! Es más chiquito: apunta bien',
  41: '¡Nuevo: atardecer 🌅! En la tormenta crece el río',
  46: '¡Nuevo: ráfagas 🍃! El viento sopla aunque no llueva',
  56: '¡Nuevo: la noche 🌙! Las ventanitas se encienden',
  66: '¡Nuevo: piso travieso 🐢🐇! A ratos corre y a ratos frena',
  76: '¡Nuevo: amanecer 🌄! El viento cambia de lado',
  86: '¡Nuevo: campanario 🔔! Cada 10 pisos, un balcón',
  91: '¡La gran tormenta ⛈️! Lluvia, ríos y viento… ¡la roca no se mueve!',
  100: '¡Nivel 100! 🏆 La casa más alta sobre la roca',
};

export default {
  id: 'roca',
  levels: {
    goal: [9, 50], curve: 1.1, lives: 3, selfEnd: true,
    goalLabel: n => `Construye ${n} pisos sobre la roca`,
  },
  create(api) {
    const { kit } = api;
    const { PAL, clamp, lerp, ease } = kit;
    const W = api.W;
    const D = clamp(api.difficulty || 0);
    const LV = Math.max(1, Math.round(api.level || 1));
    const GOAL = Math.max(1, Math.round(api.goal || 10));
    const MAXL = Math.max(1, api.lives || 3);

    // ── Ajustes del nivel ──
    const FH = 36, DROP = 46, STEP = 1 / 240, G = 2600, FALL_V0 = 120;
    const DC = Math.pow(D, 0.8);                // curva: suave hasta el 30, más empinada del 30 al 70
    const START_W = lerp(124, 104, D), MIN_W = lerp(46, 28, Math.pow(D, 0.6));
    const V0 = lerp(78, 215, Math.pow(D, 0.55));                 // velocidad del piso (px/s) al empezar
    const RAMP = lerp(0.012, 0.008, D);          // +% de velocidad por piso (tope +30 %)
    const TOL_P = lerp(11, 3.5, DC);              // distancia al centro para «¡Perfecto!»
    const GROW = lerp(10, 3, Math.pow(D, 0.7));                 // cuánto se ensancha el piso con un perfecto
    const LOSE_K = lerp(0.05, 0.5, Math.pow(D, 0.45));          // parte del piso que debe quedar apoyada para no caerse
    const POP = lerp(0.5, 0.28, D);              // pausita en que aparece cada piso (no se puede soltar)
    const STORM_LEN = 3.4;
    const WIND = lerp(45, 105, Math.pow(D, 0.8)), WIND_K = lerp(0.1, 0.3, D);
    const STONE_EVERY = Math.round(lerp(6, 15, Math.pow(D, 0.7)));
    const HAS = {
      help: LV <= 5, stone: LV >= 6, heart: LV >= 11, wind: LV >= 16, fast: LV >= 26, swing: LV >= 31, narrow: LV >= 36,
      flood: LV >= 41, gust: LV >= 46, trav: LV >= 66, flip: LV >= 76, balcony: LV >= 86, great: LV >= 91,
    };
    const STORM_EVERY = HAS.great ? 3 : LV >= 21 ? Math.round(lerp(4.6, 3.4, D)) : 5;
    const SCENE = LV >= 76 ? 'dawn' : LV >= 56 ? 'night' : LV >= 41 ? 'sunset' : LV >= 21 ? 'tarde' : 'day';
    const COLORS = ['#ffb38a', '#ffd97a', '#a8dcf5', '#c7b5f2', '#ffb0c8', '#a8e0a0'];
    // En el nivel en que se presenta una novedad, sale sí o sí en el segundo piso (para que se vea lo que anuncia el cartel).
    const SHOW = { 6: 'stone', 11: 'heart', 26: 'fast', 31: 'swing', 36: 'narrow', 46: 'gust', 66: 'trav' }[LV] || null;
    const ROOF = LV >= 91 ? 'gold' : LV >= 76 ? 'bell' : LV >= 56 ? 'dome' : LV >= 41 ? 'cross' : LV >= 21 ? 'blue' : 'red';

    let t = 0, cam = 0, acc = 0;
    const floors = [];                  // { x (centro), w, color, pop, kind, balcony }
    const debris = [];                  // trozos recortados o pisos que se cayeron
    let cur = null;                     // piso en juego (ver newBlock)
    let storm = 0, stormMax = STORM_LEN, stormCount = 0, sandGone = 0, sway = 0, flood = 0;
    const wind = { v: 0, left: 0, flipAt: -1 };   // viento: px/s con signo, segundos que le quedan, cuándo cambia de lado
    let sinceStone = 0, sinceHeart = 99, perfectRun = 0, blocks = 0, falls = 0, perfects = 0;
    let fin = null;                     // final del nivel: techito + gran prueba
    let caption = '';
    const L = {};
    function layout() { L.rockTop = api.bottom - clamp(api.H * 0.16, 70, 110); L.rockW = 170; }
    layout();

    const topOf = () => (floors.length ? floors[floors.length - 1] : { x: W / 2, w: L.rockW - 30 });
    const stackY = n => L.rockTop - n * FH;                     // y (mundo) de la base del piso n
    const slideY = () => stackY(floors.length) - DROP;           // base del piso que se desliza
    const speedOf = c => c.v * (c.fast ? 1.35 : 1);
    const sy = wy => wy - cam;                                  // y del mundo → y de pantalla (textos y chispas del motor)

    // ── Movimiento (paso fijo; lo usa también la predicción) ──
    function windStep(wd, dt) {
      if (wd.left <= 0) return;
      wd.left -= dt;
      if (wd.flipAt > 0 && wd.left < wd.flipAt) { wd.v = -wd.v; wd.flipAt = -1; }
      if (wd.left <= 0) { wd.left = 0; wd.v = 0; }
    }
    function moveStep(m, c, wv, dt) {
      m.age += dt;
      if (c.motion === 'swing') { m.ph += c.omega * dt; m.x = W / 2 + c.amp * Math.sin(m.ph); return; }
      let sp = speedOf(c);
      if (c.motion === 'trav') sp *= 1 + 0.4 * Math.sin(m.age * 5.2);
      if (wv) sp *= Math.max(0.5, 1 + WIND_K * (wv / WIND) * m.dir);
      m.x += m.dir * sp * dt;
      const lo = c.w / 2 + 4, hi = W - c.w / 2 - 4;
      if (m.x > hi) { m.x = 2 * hi - m.x; m.dir = -1; } else if (m.x < lo) { m.x = 2 * lo - m.x; m.dir = 1; }
    }
    // Dónde caería el centro del piso si se tocara dentro de tAhead segundos (null si en ese momento no se puede).
    function predict(tAhead) {
      if (!cur || fin || cur.state !== 'slide') return null;
      const m = { x: cur.x, dir: cur.dir, ph: cur.ph, age: cur.age };
      const wd = { v: wind.v, left: wind.left, flipAt: wind.flipAt };
      let pop = cur.pop;
      let n = Math.floor((acc + Math.max(0, tAhead)) / STEP);
      while (n-- > 0) { if (pop > 0) pop -= STEP; else moveStep(m, cur, wd.v, STEP); windStep(wd, STEP); }
      if (pop > 0) return null;
      let y = slideY(), vy = FALL_V0;
      const yEnd = stackY(floors.length);
      for (let i = 0; i < 400 && y < yEnd; i++) { vy += G * STEP; y += vy * STEP; m.x += wd.v * STEP; windStep(wd, STEP); }
      return m.x;
    }

    function newBlock() {
      const top = topOf(), n = floors.length;
      sinceStone++; sinceHeart++;
      const show = n === 1 ? SHOW : null;
      let kind = 'normal';
      if (show === 'stone' || show === 'heart' || show === 'narrow') kind = show;
      else if (HAS.stone && n > 0 && sinceStone >= STONE_EVERY && (top.w < START_W * 0.6 || sinceStone >= STONE_EVERY * 2)) kind = 'stone';
      else if (HAS.heart && n > 0 && api.lives < MAXL && sinceHeart >= 5 && api.rand() < 0.45) kind = 'heart';
      else if (HAS.narrow && n > 1 && top.w > MIN_W * 1.45 && api.rand() < lerp(0.1, 0.2, D)) kind = 'narrow';
      if (kind === 'stone') sinceStone = 0;
      if (kind === 'heart') sinceHeart = 0;
      const w = kind === 'stone' ? START_W : kind === 'narrow' ? Math.max(MIN_W, Math.round(top.w * 0.68)) : top.w;
      let motion = 'line';
      if (show === 'swing' || show === 'trav') motion = show;
      else if (n > 0 && !show && HAS.swing && kind !== 'stone' && api.rand() < lerp(0.3, 0.42, D)) motion = 'swing';
      else if (n > 0 && !show && HAS.trav && api.rand() < 0.25) motion = 'trav';
      const fast = show === 'fast' || (n > 0 && !show && HAS.fast && motion === 'line' && kind === 'normal' && api.rand() < lerp(0.18, 0.3, D));
      const v = V0 * (1 + Math.min(0.3, n * RAMP));
      const dir = api.rand() < 0.5 ? 1 : -1;
      const amp = (W - w) / 2 - 8;
      cur = {
        kind, motion, fast, w, v, amp, omega: (v * 1.05) / amp, color: COLORS[n % COLORS.length],
        balcony: HAS.balcony && n % 10 === 9,
        x: dir > 0 ? w / 2 + 6 : W - w / 2 - 6, dir, ph: dir > 0 ? -Math.PI / 2 : Math.PI / 2, age: 0,
        pop: POP + (blocks === 0 ? 0.7 : 0), popMax: POP + (blocks === 0 ? 0.7 : 0),
        state: 'slide', y: 0, vy: 0,
      };
      if (motion === 'swing') cur.x = W / 2 + amp * Math.sin(cur.ph);
      blocks++;
      // ráfaga de viento sin tormenta
      if (show === 'gust' || (HAS.gust && n > 0 && storm <= 0 && wind.left <= 0 && api.rand() < lerp(0.12, 0.28, D))) {
        wind.v = (api.rand() < 0.5 ? 1 : -1) * WIND * 0.75; wind.left = 2.6; wind.flipAt = -1;
        api.floatText(W / 2, sy(slideY() - FH - 34), '🍃 ¡Ráfaga!', { color: '#eafff0', size: 18 });
      }
      const label = kind === 'stone' ? '🪨 ¡Piso de roca!' : kind === 'heart' ? '💛 ¡Piso con corazón!' : kind === 'narrow' ? '📏 Piso angosto'
        : fast ? '⚡ ¡Veloz!' : null;
      if (label) api.floatText(clamp(cur.x, 80, W - 80), sy(slideY() - FH - 14), label, { color: '#fff3b0', size: 16 });
    }

    function release() {
      if (!cur || fin || cur.state !== 'slide' || cur.pop > 0) return;
      cur.state = 'fall'; cur.y = slideY(); cur.vy = FALL_V0;
      api.sfx('drop');
    }
    function startStorm(len = STORM_LEN) {
      storm = stormMax = len; stormCount++; api.sfx('whoosh');
      if (HAS.wind && !fin) {
        wind.v = (api.rand() < 0.5 ? 1 : -1) * WIND;
        wind.left = len - 0.2; wind.flipAt = HAS.flip ? len / 2 : -1;
      }
    }
    function settle() {
      const base = topOf();
      const y = stackY(floors.length);
      const l = Math.max(cur.x - cur.w / 2, base.x - base.w / 2), r = Math.min(cur.x + cur.w / 2, base.x + base.w / 2);
      const overlap = r - l;
      if (overlap < Math.max(5, LOSE_K * Math.min(cur.w, base.w))) {
        // quedó casi en el aire: se cae
        const side = cur.x < base.x ? -1 : 1;
        debris.push({ x: cur.x, y, w: cur.w, vy: 40, vx: side * 70, rot: 0, vr: side * 2.2, color: cur.kind === 'stone' ? '#b7bfcb' : cur.color });
        perfectRun = 0; falls++;
        api.floatText(clamp(cur.x, 60, W - 60), sy(y - FH - 10), '¡Uy! Se cayó', { color: '#ffd0d0', size: 18 });
        const left = api.loseLife(cur.x, sy(y - FH));
        if (left > 0) newBlock(); else cur = null;
        return;
      }
      const off = Math.abs(cur.x - base.x);
      let x, w, perfect = off <= TOL_P;
      if (cur.kind === 'stone') {
        // la roca se queda entera, con el centro sobre el piso de abajo
        x = perfect ? base.x : clamp(cur.x, base.x - base.w / 2, base.x + base.w / 2); w = cur.w;
      } else if (perfect) {
        perfectRun++;
        x = base.x; w = Math.min(START_W, cur.w + GROW * (perfectRun >= 3 ? 1.5 : 1));
      } else {
        perfectRun = 0;
        x = (l + r) / 2; w = overlap;
        const cutW = cur.w - overlap;
        if (cutW > 3) {
          const side = cur.x < base.x ? -1 : 1;
          debris.push({ x: side < 0 ? l - cutW / 2 : r + cutW / 2, y, w: cutW, vy: 0, vx: side * 40, rot: 0, vr: side * 3, color: cur.color });
        }
        if (w < MIN_W) { w = MIN_W; x = clamp(x, base.x - base.w / 2 + MIN_W / 2, base.x + base.w / 2 - MIN_W / 2); }
      }
      if (perfect) {
        perfects++;
        api.floatText(x, sy(y - FH - 14), perfectRun >= 3 ? `¡Perfecto x${perfectRun}!` : '¡Perfecto!', { color: '#fff3b0', size: 20 });
        api.sfx('match'); api.burst(x, sy(y - FH / 2), { color: PAL.sun, count: perfectRun >= 3 ? 18 : 12 });
      } else api.sfx(cur.kind === 'stone' ? 'step' : 'pop');
      if (cur.kind === 'heart') {
        if (off <= TOL_P * 1.6 && api.lives < MAXL) { api.addLife(); api.floatText(x, sy(y - FH - 36), '💛 ¡Una vida más!', { color: '#fff3b0', size: 18 }); }
        else if (off <= TOL_P * 1.6) { api.burst(x, sy(y - FH / 2), { emoji: '💛', count: 3, speed: 60, size: 16 }); api.floatText(x, sy(y - FH - 36), '💛 ¡Muy bien!', { color: '#fff3b0', size: 18 }); }
      }
      if (cur.balcony) api.sfx('bell');
      floors.push({ x, w, color: cur.color, pop: 0, kind: cur.kind, balcony: cur.balcony });
      cur = null;
      api.addScore(1, x, sy(y - FH - 2));
      api.shake(3, 120);
      if (floors.length >= GOAL) { startFinale(); return; }
      if (floors.length % STORM_EVERY === 0) startStorm();
      newBlock();
    }

    // ── Final: techito, la gran prueba y la palomita que se posa en el techo ──
    const FIN_CALM = 2.6;               // segundos (desde que cae el techo) en que pasa la tormenta
    function startFinale() {
      fin = { t: 0, roofY: stackY(floors.length) - 240, roofVy: 0, landT: -1, storm: false, calm: false, done: false };
      wind.v = 0; wind.left = 0; wind.flipAt = -1;
    }
    function updateFinale(dt) {
      fin.t += dt;
      const yEnd = stackY(floors.length);
      if (fin.landT < 0) {
        fin.roofVy += 1800 * dt; fin.roofY += fin.roofVy * dt;
        if (fin.roofY >= yEnd) {
          fin.roofY = yEnd; fin.landT = fin.t;
          api.sfx('drop'); api.shake(4, 150);
          api.burst(topOf().x, sy(yEnd), { color: '#ffffff', count: 10, speed: 90 });
        }
        return;
      }
      const k = fin.t - fin.landT;
      if (k > 0.2 && !fin.storm) { fin.storm = true; startStorm(2.5); caption = 'Cayó la lluvia, crecieron los ríos y soplaron los vientos…'; }
      if (k > FIN_CALM && !fin.calm) {
        fin.calm = true; caption = '¡La casa no se cayó: estaba sobre la roca!';
        api.sfx('sparkle');
        api.burst(W / 2, api.top + 120, { emoji: '✨', count: 6, speed: 120, size: 18, life: 1 });
      }
      if (fin.calm && !fin.coo && k > FIN_CALM + 0.9) { fin.coo = true; api.sfx('coo'); }
      if (k > FIN_CALM + 1.5 && !fin.done) { fin.done = true; api.end({ won: true }); }
    }

    if (NEWS[LV]) api.hint(NEWS[LV], LV <= 3 ? 3000 : 3600);
    newBlock();

    // ── Dibujo ──
    const winColor = SCENE === 'night' ? '#ffe27a' : '#fff8d8';
    function drawFloor(g, x, y, w, color, idx, kind, balcony) {
      // y = base del piso
      const stone = kind === 'stone';
      kit.fillRR(g, x - w / 2, y - FH, w, FH, 6, stone ? '#b7bfcb' : color);
      if (stone) {
        g.fillStyle = 'rgba(90,100,120,0.25)';
        for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(x - w / 2 + 14 + i * (w - 28) / 3, y - 8 - (i % 2) * 18, 7, 4, 0.3, 0, 6.28); g.fill(); }
      }
      kit.fillRR(g, x - w / 2, y - FH, w, 7, 4, 'rgba(255,255,255,0.35)');
      kit.fillRR(g, x - w / 2, y - 5, w, 5, 3, 'rgba(0,0,0,0.1)');
      const n = w > 92 ? 3 : w > 58 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const wx = x + (i - (n - 1) / 2) * (w / (n + 0.4));
        if (idx === 0 && i === Math.floor((n - 1) / 2)) { kit.fillRR(g, wx - 7, y - 24, 14, 24, 5, '#8a5a3c'); kit.circle(g, wx + 3, y - 11, 1.5, PAL.sun); }
        else { kit.fillRR(g, wx - 7, y - 26, 14, 15, 3, winColor); kit.fillRR(g, wx - 1, y - 26, 2, 15, 0, 'rgba(120,90,60,0.4)'); }
      }
      if (kind === 'heart') { kit.circle(g, x, y - FH / 2, 11, 'rgba(255,255,255,0.8)'); kit.heart(g, x, y - FH / 2 - 1, 0.85, PAL.roseDeep); }
      if (balcony) {
        kit.fillRR(g, x - w / 2 - 6, y - 7, w + 12, 6, 3, PAL.woodDeep);
        g.fillStyle = PAL.wood;
        for (let bx = x - w / 2 - 2; bx <= x + w / 2 + 2; bx += 8) g.fillRect(bx, y - 15, 2, 9);
        kit.fillRR(g, x - w / 2 - 6, y - 17, w + 12, 3, 2, PAL.wood);
        kit.emoji(g, '🔔', x, y - FH - 2, 14);
      }
    }
    function drawRoof(g, f, y, s) {
      // y = base del techo (encima del último piso)
      const x = f.x, hw = f.w / 2 + 10;
      if (ROOF === 'dome' || ROOF === 'gold') {
        g.fillStyle = ROOF === 'gold' ? '#ffcf4a' : '#8fb8f0';
        g.beginPath(); g.ellipse(x, y, hw * 0.85, 34 * s, 0, Math.PI, 0); g.closePath(); g.fill();
        kit.ellipse(g, x - hw * 0.3, y - 20 * s, 8, 4, 'rgba(255,255,255,0.4)', -0.4);
      } else {
        g.fillStyle = ROOF === 'blue' ? '#5b8fd9' : ROOF === 'bell' ? '#b7774a' : '#d96a4a';
        g.beginPath(); g.moveTo(x - hw, y); g.lineTo(x, y - 36 * s); g.lineTo(x + hw, y); g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.18)';
        g.beginPath(); g.moveTo(x - hw, y); g.lineTo(x, y - 36 * s); g.lineTo(x - hw * 0.4, y); g.closePath(); g.fill();
      }
      if (ROOF === 'blue') kit.fillRR(g, x + hw * 0.4, y - 34 * s, 10, 18 * s, 2, '#8a5a3c');
      if (ROOF === 'bell') { kit.fillRR(g, x - 10, y - 62 * s, 20, 28 * s, 4, '#e9d3b0'); kit.emoji(g, '🔔', x, y - 50 * s, 15); }
      const crossY = ROOF === 'bell' ? y - 62 * s : ROOF === 'dome' || ROOF === 'gold' ? y - 34 * s : y - 36 * s;
      if (ROOF !== 'red' && ROOF !== 'blue') {
        g.fillStyle = ROOF === 'gold' ? '#fff3b0' : '#fff8e6';
        g.fillRect(x - 1.5, crossY - 18, 3, 18); g.fillRect(x - 6, crossY - 13, 12, 3);
      }
      if (ROOF === 'gold') kit.star(g, x, crossY - 26, 7, '#fff3b0', t);
    }
    function drawSky(g, H) {
      if (SCENE === 'tarde') {
        const gr = g.createLinearGradient(0, 0, 0, H);
        gr.addColorStop(0, '#79bdf0'); gr.addColorStop(0.65, '#ffe2a6'); gr.addColorStop(1, '#fff2cf');
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
      } else kit.sky(g, W, H, SCENE);
      if (SCENE === 'night') { kit.stars(g, W, H * 0.6, t, 36); kit.moon(g, 296, api.top + 48, 20); }
      else if (SCENE === 'sunset') kit.sun(g, 290, api.top + 130, 30, t);
      else if (SCENE === 'dawn') kit.sun(g, 70, api.top + 150, 26, t);
      else kit.sun(g, 300, api.top + 44, 22, t);
      if (SCENE !== 'night') kit.cloud(g, 70 + Math.sin(t * 0.2) * 20, api.top + 50, 0.9, 0.9);
    }

    // Vista: en el juego la cámara sigue la torre (z = 1); en el final se aleja para mostrar toda la casa sobre la roca.
    // pantalla = (W/2 + (x − W/2)·z, y·z + oy)
    function view() {
      if (!fin || fin.landT < 0) return { z: 1, oy: -cam, q: 0 };
      const q = ease.inOut(clamp((fin.t - fin.landT - 0.2) / 1.2));
      const top = stackY(floors.length) - 100, bot = L.rockTop + 80;
      const a0 = api.top + 74, a1 = api.H - 10;
      const zf = Math.min(1, (a1 - a0) / (bot - top));
      const oyf = (a0 + a1) / 2 - ((top + bot) / 2) * zf;
      return { z: lerp(1, zf, q), oy: lerp(-cam, oyf, q), q };
    }
    // Punto del techo donde se posa la palomita (mundo) y su tamaño.
    function perch() {
      const f = floors[floors.length - 1], hw = f.w / 2 + 10, dx = -hw * 0.5;
      const rise = ROOF === 'dome' || ROOF === 'gold' ? 34 * Math.sqrt(Math.max(0, 1 - (dx / (hw * 0.85)) ** 2)) : 36 * (1 - Math.abs(dx) / hw);
      return { x: f.x + dx, y: fin.roofY - rise + 2 };
    }
    function drawDove(g, z) {
      const k = fin.t - fin.landT - FIN_CALM - 0.05;
      if (k <= 0) return;
      const p = clamp(k / 0.9), e = ease.outCubic(p), P = perch();
      const s = 0.45 / Math.pow(Math.max(0.25, z), 0.75);
      const sx = P.x - 230, syy = P.y - 170;
      const x = lerp(sx, P.x, e), y = lerp(syy, P.y, e) - Math.sin(e * Math.PI) * 30 - 22 * s;
      kit.dove(g, x, y, s, { dir: 1, flap: p < 1 ? (Math.sin(t * 20) + 1) / 2 : 0.1, feet: p >= 1, tilt: p < 1 ? 0.15 : 0, carry: 'olive' });
    }

    return {
      update(dt) {
        t += dt;
        acc += dt;
        while (acc >= STEP) {
          acc -= STEP;
          if (cur && !fin) {
            if (cur.state === 'slide') { if (cur.pop > 0) cur.pop -= STEP; else moveStep(cur, cur, wind.v, STEP); }
            else { cur.vy += G * STEP; cur.y += cur.vy * STEP; cur.x += wind.v * STEP; if (cur.y >= stackY(floors.length)) settle(); }
          }
          windStep(wind, STEP);
        }
        if (fin) updateFinale(dt);
        for (const f of floors) f.pop = Math.min(1, f.pop + dt * 5);
        for (let i = debris.length - 1; i >= 0; i--) {
          const d = debris[i];
          d.vy += 900 * dt; d.y += d.vy * dt; d.x += d.vx * dt; d.rot += d.vr * dt;
          if (d.y - cam > api.H + 80) debris.splice(i, 1);
        }
        // la cámara sube con la torre
        const camTo = Math.min(0, (L.rockTop - floors.length * FH - (fin ? 30 : 0)) - api.H * 0.52);
        cam = lerp(cam, camTo, Math.min(1, dt * 4));
        if (storm > 0) {
          storm -= dt;
          sway = Math.sin(t * 9) * (fin ? 2.6 : 1.6) * clamp(storm, 0, 1);
          if (stormCount === 1 || fin) sandGone = clamp(sandGone + dt * 0.5, 0, 1);
          if (!fin && storm < 1.4 && storm + dt >= 1.4) api.floatText(W / 2, api.top + 80, '¡Firme sobre la roca!', { color: '#fff', size: 22 });
          if (storm <= 0) { storm = 0; sway = 0; }
        }
        const floodTo = storm > 0 && (HAS.flood || fin) ? 1 : 0;
        flood += (floodTo - flood) * Math.min(1, dt * 0.9);
      },
      draw(g) {
        const H = api.H;
        const dark = clamp(storm > 0 ? Math.min(1, storm, (stormMax - storm) * 2) : 0);
        drawSky(g, H);
        const tint = Math.max(dark * 0.85, HAS.great ? 0.22 : 0);
        if (tint > 0) { g.save(); g.globalAlpha = tint; kit.sky(g, W, H, 'storm'); g.restore(); }
        if (fin && fin.calm) {
          const a = clamp((fin.t - fin.landT - FIN_CALM) * 2);
          kit.rainbow(g, W / 2, api.top + 250, 150, 6, 0.8 * a);
        }
        const V = view();
        const X0 = W / 2 - W / 2 / V.z - 6, X1 = W / 2 + W / 2 / V.z + 6;   // x del mundo visibles
        // colinas (con parallax mientras se juega)
        const oyH = lerp(-cam * 0.35, V.oy, V.q);
        g.save(); g.translate(W / 2, oyH); g.scale(V.z, V.z); g.translate(-W / 2, 0); g.translate(X0, 0);
        kit.hills(g, X1 - X0, (H - oyH) / V.z + 20, L.rockTop - 30, 16, SCENE === 'night' ? '#5f8a72' : SCENE === 'sunset' ? '#c9c98a' : '#bfe3a0', 40 + X0, 0.012);
        g.restore();
        g.save(); g.translate(W / 2, V.oy); g.scale(V.z, V.z); g.translate(-W / 2, 0);
        // mar y arena al fondo, con la casita sobre arena
        const waterY = L.rockTop + 34 - flood * 38;
        g.save(); g.translate(X0, 0);
        kit.water(g, X1 - X0, (H - V.oy) / V.z + 20, waterY, t, SCENE === 'night' ? '#4f86c9' : '#7cc8f5', SCENE === 'night' ? '#2b5c9e' : '#3f9fe0');
        g.restore();
        g.fillStyle = PAL.sand; g.beginPath(); g.ellipse(52, L.rockTop + 40, 62, 22, 0, 0, 6.28); g.fill();
        if (sandGone < 1) {
          g.save(); g.translate(52 - sandGone * 70, L.rockTop + 22 + sandGone * 34); g.rotate(-sandGone * 0.9); g.globalAlpha = 1 - sandGone;
          kit.fillRR(g, -17, -26, 34, 26, 4, '#ffd0a8');
          g.fillStyle = '#d96a4a'; g.beginPath(); g.moveTo(-22, -26); g.lineTo(0, -44); g.lineTo(22, -26); g.closePath(); g.fill();
          kit.fillRR(g, -5, -13, 10, 13, 2, '#8a5a3c');
          g.restore();
        }
        // la roca
        const rx = W / 2, ry = L.rockTop;
        g.fillStyle = PAL.stoneDeep; g.beginPath(); g.moveTo(rx - L.rockW / 2 - 16, ry + 150); g.quadraticCurveTo(rx - L.rockW / 2 - 20, ry + 10, rx - L.rockW / 2 + 12, ry);
        g.lineTo(rx + L.rockW / 2 - 12, ry); g.quadraticCurveTo(rx + L.rockW / 2 + 22, ry + 12, rx + L.rockW / 2 + 16, ry + 150); g.closePath(); g.fill();
        g.fillStyle = PAL.stone; g.beginPath(); g.moveTo(rx - L.rockW / 2 - 6, ry + 150); g.quadraticCurveTo(rx - L.rockW / 2 - 8, ry + 14, rx - L.rockW / 2 + 14, ry + 2);
        g.lineTo(rx + L.rockW / 2 - 30, ry + 2); g.quadraticCurveTo(rx + L.rockW / 2 - 6, ry + 30, rx + L.rockW / 2 - 20, ry + 150); g.closePath(); g.fill();
        kit.ellipse(g, rx - 30, ry + 22, 26, 6, 'rgba(255,255,255,0.3)', -0.1);
        // la torre (con un leve vaivén en la tormenta); solo los pisos que se ven
        const yMin = -V.oy / V.z - FH * 2, yMax = (H - V.oy) / V.z + FH;
        for (let i = 0; i < floors.length; i++) {
          const f = floors[i], y = stackY(i);
          if (y < yMin || y - FH > yMax) continue;
          const k = ease.outBack(f.pop);
          g.save(); g.translate(f.x + sway * (i + 1) * 0.12, y); g.scale(1 + (1 - k) * 0.12, k);
          drawFloor(g, 0, 0, f.w, f.color, i, f.kind, f.balcony);
          g.restore();
        }
        // techito del final
        if (fin && floors.length) {
          const f = floors[floors.length - 1];
          g.save(); g.translate(sway * (floors.length + 1) * 0.12, 0);
          drawRoof(g, f, fin.roofY, 1);
          if (fin.calm) drawDove(g, V.z);
          g.restore();
        }
        // piso en juego
        if (cur) {
          const base = topOf();
          const y = cur.state === 'slide' ? slideY() : cur.y;
          if (cur.state === 'slide') {
            const lead = (base.x - cur.x) * cur.dir;
            const ready = HAS.help && cur.pop <= 0 && cur.motion === 'line' && lead > -TOL_P && lead < speedOf(cur) * 0.3;
            g.save(); g.setLineDash([4, 6]); g.strokeStyle = ready ? '#ffe066' : 'rgba(255,255,255,0.6)'; g.lineWidth = ready ? 3.5 : 2;
            g.beginPath(); g.moveTo(base.x - base.w / 2, y - FH); g.lineTo(base.x - base.w / 2, stackY(floors.length)); g.moveTo(base.x + base.w / 2, y - FH); g.lineTo(base.x + base.w / 2, stackY(floors.length)); g.stroke(); g.restore();
            if (ready && LV <= 2) kit.text(g, '¡Ahora!', base.x, y - FH - 18, { size: 18, color: '#fff3b0', stroke: 'rgba(61,43,36,0.75)', strokeWidth: 4 });
            if (cur.motion === 'swing') {
              const py = cam + api.top + 16;
              g.save(); g.strokeStyle = '#8a5a3c'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(W / 2, py); g.lineTo(cur.x, y - FH); g.stroke(); g.restore();
              kit.fillRR(g, W / 2 - 34, py - 7, 68, 7, 3, PAL.woodDeep);
              kit.circle(g, W / 2, py, 7, PAL.wood); kit.circle(g, W / 2, py, 2.5, PAL.woodDeep);
            }
            if (cur.fast) {
              g.save(); g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 2.5; g.lineCap = 'round'; g.beginPath();
              for (let i = 0; i < 3; i++) { const sx = cur.x - cur.dir * (cur.w / 2 + 6), sy = y - 9 - i * 9; g.moveTo(sx, sy); g.lineTo(sx - cur.dir * (12 + i * 4), sy); }
              g.stroke(); g.restore();
            }
          }
          const pk = cur.state === 'slide' && cur.pop > 0 ? ease.outBack(clamp(1 - cur.pop / cur.popMax)) : 1;
          g.save(); g.translate(cur.x, y); g.scale(Math.max(0.2, pk), Math.max(0.2, pk));
          drawFloor(g, 0, 0, cur.w, cur.color, floors.length, cur.kind, cur.balcony);
          g.restore();
          if (cur.motion === 'trav' && cur.state === 'slide' && cur.pop <= 0) {
            kit.emoji(g, Math.sin(cur.age * 5.2) > 0 ? '🐇' : '🐢', cur.x, y - FH - 12, 16);
          }
        }
        for (const d of debris) { g.save(); g.translate(d.x, d.y - FH / 2); g.rotate(d.rot); kit.fillRR(g, -d.w / 2, -FH / 2, d.w, FH, 5, d.color); g.restore(); }
        g.restore();
        // tormenta: nubes, lluvia y viento
        const wv = wind.v / WIND;
        if (storm > 0 || HAS.great) {
          const a = storm > 0 ? clamp(storm, 0, 1) : 0;
          if (storm > 0) { kit.stormCloud(g, 90, api.top + 46, 1.2, t); kit.stormCloud(g, 250, api.top + 66, 1.0, t + 1); }
          const drops = storm > 0 ? 46 : 16;
          g.save(); g.strokeStyle = 'rgba(210,230,255,0.75)'; g.lineWidth = 2; g.lineCap = 'round'; g.globalAlpha = storm > 0 ? a : 0.45;
          g.beginPath();
          for (let i = 0; i < drops; i++) {
            const x = ((i * 71 + t * (420 + wv * 160)) % (W + 80) + W + 80) % (W + 80) - 40, y = ((i * 131 + t * 760) % (H - api.top)) + api.top;
            g.moveTo(x, y); g.lineTo(x - 7 + wv * 9, y + 15);
          }
          g.stroke(); g.restore();
        }
        if (wind.left > 0 && wind.v) {
          // hojitas que vuelan y un cartelito con la dirección del viento
          const s = Math.sign(wind.v);
          for (let i = 0; i < 7; i++) {
            const x = s > 0 ? ((i * 83 + t * 230) % (W + 40)) - 20 : W + 20 - ((i * 83 + t * 230) % (W + 40));
            const y = api.top + 90 + ((i * 97) % Math.max(60, H - api.top - 200)) + Math.sin(t * 3 + i) * 8;
            kit.ellipse(g, x, y, 5, 2.5, i % 2 ? '#8fd16a' : '#6cc070', t * 4 + i);
          }
          const cx = 66, cy = api.top + 20;
          kit.fillRR(g, cx - 52, cy - 13, 104, 26, 13, 'rgba(255,255,255,0.88)');
          kit.text(g, s > 0 ? '💨 viento ›››' : '‹‹‹ viento 💨', cx, cy + 1, { size: 14, color: PAL.ink });
        }
        if (caption) {
          const cy = api.top + 34;
          kit.fillRR(g, 14, cy - 24, W - 28, 50, 14, 'rgba(255,255,255,0.9)');
          kit.wrapText(g, caption, W / 2, cy + 1, W - 52, { size: 16, weight: 800, color: PAL.ink, valign: 'middle' });
        }
      },
      pointerDown() { release(); },
      keyDown(k) { if (k === 'action' || k === 'down') release(); },
      resize() { layout(); },
      // Solo lectura, para las pruebas: estado del piso en juego y predicción de dónde caería.
      get debug() {
        const base = topOf();
        return {
          level: LV, difficulty: D, goal: GOAL, floors: floors.length, lives: api.lives, finale: !!fin,
          state: cur ? cur.state : 'none', canTap: !!(cur && !fin && cur.state === 'slide' && cur.pop <= 0),
          pop: cur ? cur.pop : 0, x: cur ? cur.x : null, w: cur ? cur.w : null, dir: cur ? cur.dir : 0,
          kind: cur ? cur.kind : null, motion: cur ? cur.motion : null, fast: cur ? cur.fast : false,
          speed: cur ? speedOf(cur) : 0, baseX: base.x, baseW: base.w, tolPerfect: TOL_P, loseK: LOSE_K, minW: MIN_W,
          wind: wind.v, windLeft: wind.left, storm, blocks, falls, perfects,
          landingAt: tAhead => predict(tAhead),
        };
      },
    };
  },
};
