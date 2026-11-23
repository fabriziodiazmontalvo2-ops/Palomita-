// "De regreso a casa" — parábola del hijo pródigo (Lucas 15, 11-32).
//
// Carrera de 3 carriles vista desde atrás y un poco desde arriba. El hijo camina de regreso a la casa de su padre:
// sale de una tierra lejana, seca y gris (con cerditos y lodo, como en la historia) y, poco a poco, el paisaje se
// vuelve verde. Tocar la mitad izquierda / derecha (o deslizar, o las flechas) cambia de carril. Los charcos, las
// piedras, las zarzas y los cerditos quitan una vida; los corazones suman. Al final aparece la casa: el padre lo ve
// de lejos, SALE CORRIENDO y lo abraza. Llegar a casa siempre es ganar (el padre no cuenta los corazones).
//
// Todo el recorrido se genera al empezar (con api.rand) y cumple estas reglas de justicia:
//   · en cada fila queda al menos un carril libre, y desde cualquier carril libre de la fila anterior se llega a uno
//     libre de la siguiente con UN solo cambio (si no, la fila se aleja más);
//   · entre fila y fila hay siempre ≥ 1.08 s (≥ 1.75 s al principio);
//   · hay exactamente 28 corazones, repartidos parejo; ninguno lleva hacia un obstáculo.
export default {
  id: 'prodigo',
  create(api) {
    const { kit } = api;
    const { PAL, clamp, lerp, ease } = kit;
    const W = api.W, CX = W / 2;

    // ───────────────────────── Medidas del mundo ─────────────────────────
    // Unidades de mundo = píxeles lógicos a la altura del jugador. `d` es la distancia a lo largo del camino.
    const LANE = 84;                 // ancho de carril
    const ROAD_HALF = 136;           // medio ancho del camino
    const VIEW = 760;                // cuánto camino se ve por delante
    const FAR_S = 0.5, Q = 1 / FAR_S - 1;   // escala de las cosas en el horizonte
    const TOTAL = 18400;             // largo del camino (≈ 71 s de carrera + el encuentro)
    const V0 = 200, V1 = 330;        // velocidad al salir y al llegar
    const HEARTS = 28;               // corazones en todo el recorrido (la meta del catálogo es 15)
    const INVULN = 1.2;              // segundos de protección después de un tropiezo
    const LAST_ROW = TOTAL - 900;    // después de aquí ya no hay obstáculos: solo el tramo final a casa
    const SEEN_AT = TOTAL - 230;     // aquí el padre ve al hijo («todavía estaba lejos cuando su padre lo vio»)
    const D_HOUSE = SEEN_AT + VIEW * 0.82;
    const HERO_S = 1.25, DAD_S = 1.42;
    const HUG_TIME = 2.5;

    const speedAt = p => V0 + (V1 - V0) * clamp(p);
    const gapTime = p => lerp(1.75, 1.08, Math.pow(clamp(p), 0.8));   // segundos entre fila y fila

    // ───────────────────────── Recorrido ─────────────────────────
    const objs = [];                 // obstáculos y corazones, ordenados por d
    let heartCount = 0;
    function put(kind, ln, d) {
      objs.push({ cat: 'obj', kind, lane: ln, d, X: (ln - 1) * LANE, done: false, taken: false, hit: false, fx: 0, ph: api.rand() * 6.28 });
      if (kind === 'heart') heartCount++;
    }
    // Lo que estorba cuenta la historia: cerditos y lodo en la tierra lejana, zarzas a medio camino, piedras cerca de casa.
    function obstacleKind(p) {
      const r = api.rand();
      if (p < 0.38) return r < 0.34 ? 'pig' : r < 0.72 ? 'mud' : 'rock';
      if (p < 0.7) return r < 0.36 ? 'bramble' : r < 0.64 ? 'rock' : r < 0.88 ? 'mud' : 'pig';
      return r < 0.36 ? 'rock' : r < 0.7 ? 'bramble' : 'mud';
    }
    function buildCourse() {
      const BUDGET = HEARTS - 3;     // 3 se guardan para el caminito final
      const side = api.rand() < 0.5 ? 0 : 2;
      let d = 760, row = 0, prevD = 0, prevFree = [0, 1, 2], prevType = '', doubles = 0;
      const rows = Math.round((LAST_ROW - d) / 358) + 1;
      while (d <= LAST_ROW) {
        const p = d / TOTAL;
        const gap = speedAt(p) * gapTime(p);
        const left = BUDGET - heartCount;
        const need = row < 4 ? 0 : Math.min(left, 5 + (BUDGET - 5) * (row - 3) / Math.max(1, rows - 4) - heartCount);
        let type, free;
        // Las primeras filas enseñan a jugar: corazón delante, corazón a un lado, primer charco, caminito de corazones.
        if (row === 0) type = 'h1c';
        else if (row === 1) type = 'h1s';
        else if (row === 2) type = 'mud1';
        else if (row === 3) type = 'trail';
        else {
          const wB = prevType === 'trail' || left < 2 ? 0 : 0.17;
          const wD = doubles >= 2 ? 0 : clamp((p - 0.16) * 0.8, 0, 0.5);
          const r = api.rand();
          type = r < wB ? 'trail' : r < wB + wD ? 'double' : 'single';
        }

        if (type === 'h1c') { put('heart', 1, d); free = [0, 1, 2]; }
        else if (type === 'h1s') { put('heart', side, d); free = [0, 1, 2]; }
        else if (type === 'mud1') { put('mud', 1, d); put('heart', side, d); free = [0, 2]; }
        else if (type === 'trail') {
          // respiro: caminito de 2 o 3 corazones, recto o en diagonal
          const n = row === 3 ? 2 : Math.min(left, need >= 2.2 ? 3 : 2);
          if (row === 3 || api.rand() < 0.55) {
            const ln = row === 3 ? 1 : api.randInt(0, 2);
            for (let i = 0; i < n; i++) put('heart', ln, d + (i - (n - 1) / 2) * 96);
          } else {
            const dir = api.rand() < 0.5 ? 1 : -1;
            const a = n === 3 ? (dir > 0 ? 0 : 2) : (dir > 0 ? api.randInt(0, 1) : api.randInt(1, 2));
            for (let i = 0; i < n; i++) put('heart', a + dir * i, d + (i - (n - 1) / 2) * 150);
          }
          free = [0, 1, 2];
        } else if (type === 'single') {
          const ln = api.randInt(0, 2);
          put(obstacleKind(p), ln, d);
          free = [0, 1, 2].filter(l => l !== ln);
          if (need >= 0.5) {
            const both = free.filter(l => prevFree.includes(l));
            if (prevType !== 'trail' && row > 4 && api.rand() < 0.45) put('heart', api.pick(both.length ? both : free), d - (d - prevD) / 2);
            else put('heart', api.pick(free), d);
          }
        } else {
          // dos obstáculos: el carril libre debe alcanzarse con un solo cambio desde cualquier carril libre anterior
          let fl = api.randInt(0, 2);
          if (!prevFree.every(a => Math.abs(a - fl) <= 1)) { if (api.rand() < 0.5) fl = 1; else d += gap * 0.35; }
          for (let l = 0; l < 3; l++) if (l !== fl) put(obstacleKind(p), l, d);
          free = [fl];
          if (need >= 0.5) put('heart', fl, prevType !== 'trail' && api.rand() < 0.45 ? d - (d - prevD) / 2 : d);
        }
        doubles = type === 'double' ? doubles + 1 : 0;
        prevFree = free; prevType = type; prevD = d;
        d += gap; row++;
      }
      // caminito final de corazones hasta la casa (por el centro, sin nada que estorbe)
      const n = Math.max(1, HEARTS - heartCount), a = TOTAL - 640, b = TOTAL - 300;
      for (let i = 0; i < n; i++) put('heart', 1, n === 1 ? (a + b) / 2 : lerp(a, b, i / (n - 1)));
      objs.sort((u, v) => u.d - v.d);
    }

    // Paisaje a los lados: de árboles secos y piedras… a olivos, flores y ovejitas.
    const scen = [];
    function buildScenery() {
      let d = 40;
      while (d < D_HOUSE + 420) {
        const p = d / TOTAL, r = api.rand();
        let type;
        if (p < 0.34) type = r < 0.3 ? 'dead' : r < 0.56 ? 'stone' : r < 0.86 ? 'dry' : 'pigS';
        else if (p < 0.64) type = r < 0.2 ? 'dead' : r < 0.38 ? 'stone' : r < 0.66 ? 'shrub' : r < 0.84 ? 'dry' : 'olive';
        else type = r < 0.26 ? 'tree' : r < 0.42 ? 'olive' : r < 0.58 ? 'bush' : r < 0.8 ? 'flower' : r < 0.92 ? 'grass' : 'sheep';
        const X = (api.rand() < 0.5 ? -1 : 1) * (ROAD_HALF + api.randRange(36, 215));
        const item = { cat: 'scen', type, X, d, k: api.randRange(0.85, 1.25), flip: api.rand() < 0.5 ? -1 : 1, ph: api.rand() * 6.28, col: api.randInt(0, 2) };
        if (!(Math.abs(d - D_HOUSE) < 170 && Math.abs(X) < 260)) scen.push(item);
        d += api.randRange(52, 118);
      }
      // jardín de la casa
      for (const [type, X, dd, k] of [['tree', -196, 20, 1.3], ['tree', 204, 30, 1.2], ['bush', -160, -40, 1], ['flower', 150, -46, 1.1], ['flower', -118, -60, 1], ['olive', 250, -90, 1.1]]) {
        scen.push({ cat: 'scen', type, X, d: D_HOUSE + dd, k, flip: 1, ph: X, col: Math.abs(X) % 3 });
      }
      scen.sort((u, v) => u.d - v.d);
    }

    // ───────────────────────── Estado ─────────────────────────
    let H = api.H, top = api.top, horY = 0, plY = 0, yv = 0, nearK = 1, gradDirty = true;
    let skyA = null, skyB = null, skyC = null, hazeG = null;
    let t = 0, dist = 0, curV = 0, walkT = 0, lastFoot = 0, lastPct = -1;
    let state = 'run', stT = 0;           // run → seen → meet → hug
    let lane = 1, px = 0, pv = 0;         // carril, posición lateral (mundo) y su velocidad
    let invuln = 0, hurtT = 0, slowT = 0, joyT = 0, over = false, ended = false;
    let touched = false, tipA = 0, bubbleT = 3;
    let first = 0, firstScen = 0, almostHome = false, sparkled = false, newRobe = 0;
    let dadD = D_HOUSE - 24, dadX = 0, dadT = 0, gap0 = 1, rainT = 0;
    let gid = null, gx = 0, gy = 0, gLane = 1, gDir = 0, gSwiped = false;
    const puffs = [], rain = [], drawList = [];
    const hero = { cat: 'hero', d: 0 }, dad = { cat: 'dad', d: 0 }, house = { cat: 'house', d: D_HOUSE, X: 0 };
    const byDepth = (a, b) => b.d - a.d;

    // opciones reutilizadas de los dibujos del kit (para no crear objetos en cada cuadro)
    const SON = { robe: '#c98263', hair: '#4a3222', skin: '#e8b38a', walk: true, t: 0, sad: false, arms: 'down', dir: 1 };
    const DAD = { robe: '#6f8fd8', hair: '#b9b2ac', skin: '#e2a982', sash: '#ffc94a', beard: true, walk: false, t: 0, arms: 'open', dir: 1 };
    const TREE_ROUND = { kind: 'round', sway: 0 }, TREE_OLIVE = { kind: 'olive', sway: 0 }, SHEEP = { dir: 1, t: 0 };
    const FLOWERS = [PAL.rose, PAL.sun, '#ffffff'];
    const FLAGS = [PAL.coral, PAL.sun, PAL.leaf, PAL.sky, PAL.rose, PAL.grape];

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
    for (const k in RAMPS) RAMPS[k] = RAMPS[k].map(hex);
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
      skyA = mk(['#78818f', '#a5abb6', '#cdccc8'], 0, horY);     // cielo gris de la tierra lejana
      skyB = mk(['#8fb8f0', '#ffd9c2', '#fff0c4'], 0, horY);     // amanecer
      skyC = mk(['#6fc1f3', '#cdeeff', '#fff3d6'], 0, horY);     // día claro sobre la casa
      hazeG = mk(['rgba(255,255,255,0.42)', 'rgba(255,255,255,0)'], horY, horY + 54);
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
      api.addScore(1, x, y - 24); api.sfx('coin');
      api.burst(x, y, { color: '#ff7fa3', count: 9, speed: 110, size: 4.5, life: 0.5 });
      api.burst(x, y, { color: '#fff3b0', count: 4, speed: 70, size: 3, life: 0.45 });
    }
    function hit(o) {
      o.done = true; o.hit = true; o.fx = 0.5;
      invuln = INVULN; hurtT = 0.9; slowT = 1;
      const x = CX + px, y = plY;
      if (o.kind === 'mud') { api.sfx('splash'); api.burst(x, y - 6, { color: '#7d5c48', count: 14, speed: 150, size: 5, life: 0.6 }); }
      else if (o.kind === 'pig') { api.floatText(CX + o.X, y - 62, '¡Oink!', { color: '#ffd0dc', size: 20 }); api.burst(x, y - 10, { color: '#7d5c48', count: 8, speed: 120, size: 4, life: 0.5 }); }
      else if (o.kind === 'bramble') api.burst(x, y - 16, { color: '#6f9651', count: 12, speed: 130, size: 4, life: 0.55 });
      else api.burst(x, y - 10, { color: '#c9cfd8', count: 10, speed: 130, size: 4, life: 0.5 });
      if (api.loseLife(x, y - 70) <= 0) over = true;
    }
    function collide() {
      for (let i = first; i < objs.length; i++) {
        const o = objs[i], dz = o.d - dist;
        if (dz > 60) break;
        if (o.done) continue;
        const dx = Math.abs(o.X - px);
        if (o.kind === 'heart') {
          if (dz < 46 && dz > -40 && dx < 50) collect(o);          // los corazones se atrapan con mucha manga ancha
          else if (dz <= -40) o.done = true;
        } else if (dz < 22 && dz > -26 && dx < 36 && invuln <= 0) { hit(o); if (over) return; }
        else if (dz <= -26) o.done = true;
      }
    }
    function puff(x, y, r) { if (puffs.length < 14) puffs.push({ x, y, r, life: 0.45 }); }

    // ───────────────────────── Dibujos propios (mismo estilo del kit) ─────────────────────────
    function drawMud(g, x, y, s, o) {
      g.save(); g.translate(x, y); g.scale(s, s);
      kit.ellipse(g, 0, 1, 37, 13.5, '#5f4435'); kit.ellipse(g, -23, 5, 14, 6.5, '#5f4435'); kit.ellipse(g, 25, -4, 13, 6, '#5f4435');
      kit.ellipse(g, 0, 0, 32, 10.5, '#7d5c48'); kit.ellipse(g, -22, 4.5, 10.5, 4.5, '#7d5c48'); kit.ellipse(g, 24, -4, 9.5, 4, '#7d5c48');
      kit.ellipse(g, -8, -3.6, 11, 2.6, 'rgba(255,255,255,0.24)');
      const b = (t * 0.6 + o.ph) % 1;                       // burbujita de lodo
      g.globalAlpha *= 0.5 * (1 - b); kit.circle(g, 11, 1.5, 1 + b * 3.4, '#ffffff');
      g.restore();
      if (o.hit && o.fx > 0) {                              // onda del chapuzón
        const k = 1 - o.fx / 0.5;
        g.save(); g.globalAlpha *= 1 - k; g.strokeStyle = '#a58468'; g.lineWidth = 3 * s;
        g.beginPath(); g.ellipse(x, y, (30 + k * 26) * s, (9 + k * 8) * s, 0, 0, 6.283); g.stroke(); g.restore();
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
    function drawHeart(g, x, y, s, o) {
      if (o.taken) {                                          // recogido: sube, crece y se desvanece
        if (o.fx <= 0) return;
        const k = 1 - o.fx / 0.3;
        g.save(); g.globalAlpha *= 1 - k;
        kit.heart(g, CX + px, plY - 44 - k * 26, 1.6 + k * 1.2, '#ff7fa3');
        g.restore();
        return;
      }
      const bob = Math.sin(t * 4 + o.ph) * 3 * s, hy = y - 27 * s + bob;
      kit.shadow(g, x, y, 12 * s, 3.4 * s, 0.16);
      kit.circle(g, x, hy, 20 * s, 'rgba(255,255,255,0.34)');
      kit.heart(g, x, hy, 1.6 * s * (1 + 0.07 * Math.sin(t * 6 + o.ph)), '#f2557f');
    }
    function drawHouse(g, x, y, s) {
      g.save(); g.translate(x, y); g.scale(s, s);
      kit.shadow(g, 0, 2, 140, 11, 0.14);
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
      }
    }
    function drawObj(g, o, x, y, s) {
      switch (o.kind) {
        case 'heart': drawHeart(g, x, y, s, o); break;
        case 'mud': drawMud(g, x, y, s * 1.08, o); break;
        case 'rock': drawStones(g, x, y, s); break;
        case 'bramble': drawBramble(g, x, y, s * 1.05, o); break;
        case 'pig': {
          const j = o.hit && o.fx > 0 ? Math.sin((1 - o.fx / 0.5) * Math.PI) * 16 : 0;      // el cerdito brinca del susto
          kit.ellipse(g, x, y + 1 * s, 33 * s, 9 * s, '#7d5c48');
          drawPig(g, x, y, s * 1.28, o.ph, j, 1);
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
      const sunK = clamp((p - 0.18) / 0.7);                    // el sol va saliendo detrás de las colinas
      if (sunK > 0) kit.sun(g, 300, lerp(horY + 26, top + 26, ease.outCubic(sunK)), 19, t);
      if (p < 0.62) {                                          // nubes grises de la tierra lejana
        const a = 1 - p / 0.62;
        kit.cloud(g, 62 + Math.sin(t * 0.21) * 12, top + 24, 0.95, a * 0.9, '#8d95a6');
        kit.cloud(g, 236 + Math.sin(t * 0.17 + 2) * 14, top + 36, 0.72, a * 0.8, '#9aa2b2');
      }
      if (p > 0.5) kit.cloud(g, 84 + Math.sin(t * 0.2) * 12, top + 28, 0.8, clamp((p - 0.5) / 0.3) * 0.95, '#ffffff');
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
    buildCourse();
    buildScenery();
    api.setProgress(0);
    layout();
    api.hint('👈 Toca a los lados para cambiar de carril 👉', 3000);

    return {
      update(dt) {
        t += dt;
        if (api.top !== top || api.H !== H) layout();
        if (over || ended) return;
        const p = clamp(dist / TOTAL);

        // ── avance ──
        if (state === 'run') {
          slowT = Math.max(0, slowT - dt / 0.9);
          curV = speedAt(p) * clamp(0.3 + t * 1.2) * (1 - 0.55 * ease.inOut(slowT));     // arranca despacito; tropezar frena
          dist += curV * dt;
          if (!almostHome && p >= 0.74) { almostHome = true; api.hint('🏡 ¡Ya casi llegas a casa!', 1800); }
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

        // ── el hijo: cambio de carril suave (resorte con amortiguamiento crítico, solución exacta) ──
        const target = (lane - 1) * LANE, om = 21, e = Math.exp(-om * dt);
        const dx0 = px - target, tmp = (pv + om * dx0) * dt;
        pv = (pv - om * tmp) * e;
        px = target + (dx0 + tmp) * e;
        if (invuln > 0) invuln -= dt;
        if (hurtT > 0) hurtT -= dt;
        if (joyT > 0) joyT -= dt;
        if (bubbleT > 0) bubbleT -= dt;
        tipA = clamp(tipA + (!touched && t > 0.9 && state === 'run' ? dt * 2.5 : -dt * 5));
        if (state !== 'hug') {
          walkT += dt * clamp(curV / 240, 0.45, 1.5);
          const foot = Math.floor(walkT * 9 / Math.PI);         // polvito en cada pisada
          if (foot !== lastFoot) { lastFoot = foot; puff(CX + px + (foot % 2 ? 5 : -5), plY + 1, 4); }
        }

        // ── choques, corazones y limpieza ──
        if (state !== 'hug') collide();
        if (over) return;
        for (let i = first; i < objs.length && objs[i].d - dist < VIEW; i++) if (objs[i].fx > 0) objs[i].fx -= dt;
        while (first < objs.length && objs[first].d < dist - 230 && objs[first].fx <= 0) first++;
        while (firstScen < scen.length && scen[firstScen].d < dist - 230) firstScen++;
        const flow = curV * nearK;
        for (let i = puffs.length - 1; i >= 0; i--) { const q = puffs[i]; q.life -= dt; q.y += flow * dt; q.r += dt * 9; if (q.life <= 0) puffs.splice(i, 1); }
        for (const r of rain) { r.y += r.vy * dt; if (r.y > H + 30) { r.y = top - 20; r.x = api.randRange(14, W - 14); } }

        const pct = Math.round(clamp(dist / TOTAL) * 100);
        if (pct !== lastPct) { lastPct = pct; api.setProgress(pct / 100); }
      },

      draw(g) {
        if (gradDirty) makeGradients(g);
        const p = clamp(dist / TOTAL);
        updatePalette(p);
        drawSky(g, p);
        drawGround(g);

        // polvito de las pisadas (pegado al suelo)
        for (const q of puffs) { g.globalAlpha = clamp(q.life / 0.45) * 0.45; kit.circle(g, q.x, q.y, q.r, '#ffffff'); }
        g.globalAlpha = 1;

        // todo lo que está sobre el suelo, de lo más lejano a lo más cercano
        drawList.length = 0;
        for (let i = firstScen; i < scen.length && scen[i].d - dist <= VIEW; i++) drawList.push(scen[i]);
        for (let i = first; i < objs.length && objs[i].d - dist <= VIEW; i++) drawList.push(objs[i]);
        if (D_HOUSE - dist <= VIEW) drawList.push(house);
        hero.d = dist; drawList.push(hero);
        if (state !== 'run') { dad.d = dadD; drawList.push(dad); }
        drawList.sort(byDepth);
        for (const o of drawList) {
          if (o.cat === 'hero') { drawHero(g); continue; }
          if (o.cat === 'dad') { drawDad(g); continue; }
          const u = (o.d - dist) / VIEW, s = sc(o.d), x = CX + o.X * s, y = py(s);
          if (y - 70 * s > H || x < -70 || x > W + 70) continue;
          g.globalAlpha = u > 0.9 ? clamp((1 - u) * 10) : 1;        // aparece poco a poco tras la bruma
          if (o.cat === 'scen') drawScen(g, o, x, y, s);
          else if (o.cat === 'house') drawHouse(g, x, y, s);
          else drawObj(g, o, x, y, s);
        }
        g.globalAlpha = 1;

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

      // Solo lectura, para las pruebas automáticas.
      get debug() {
        const next = [];
        for (let i = first; i < objs.length && objs[i].d - dist <= VIEW; i++) {
          const o = objs[i];
          if (!o.done) next.push({ kind: o.kind, lane: o.lane, dz: Math.round(o.d - dist) });
        }
        return { state, dist, total: TOTAL, lane, px, speed: curV, invuln, over, ended, hearts: heartCount, next, horY, plY, top, H };
      },
      get course() { return objs.map(o => ({ kind: o.kind, lane: o.lane, d: Math.round(o.d) })); },
    };
  },
};
