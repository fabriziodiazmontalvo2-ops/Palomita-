// «Busca a la ovejita» — parábola de la oveja perdida (Lucas 15, 4-7).
// El pastor deja a las 99 en el corral y recorre un laberinto de setos hasta encontrar a la ovejita que se perdió.
// Al encontrarla la carga sobre sus hombros, lleno de alegría, y sale a buscar a la siguiente en un laberinto más grande.
//
// Control: mantener el dedo en la pantalla (o tocar un punto): el pastor camina por los pasillos hacia el dedo.
//   · Si el dedo está cerca por un camino corto (≤ NEAR celdas) va por ese camino: así no se atasca en esquinas ni en curvas.
//   · Si está lejos, avanza por el eje dominante pastor→dedo y, si hay seto, prueba el otro eje.
// También funciona con las flechas del teclado.

const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];      // 0 arriba · 1 derecha · 2 abajo · 3 izquierda
const KEY_DIR = { up: 0, right: 1, down: 2, left: 3 };
const SPEED = 5;            // celdas por segundo
const NEAR = 7;             // largo máximo del "camino corto" hacia el dedo
const MARGIN = 10;          // margen lateral del laberinto
const MIN_CELL = 34;        // una celda nunca mide menos que esto
const FOUND_TIME = 1.2;     // segundos de celebración antes del siguiente laberinto
const BONUS = 10;           // segundos de regalo por cada ovejita

const FLOOR = '#e6f6bd', FLOOR_ALT = '#d8efa8', HOME = '#fbf0bb';
const HEDGE = '#3b9350', HEDGE_TOP = '#5bb56a', HEDGE_LEAF = '#93db8f', HEDGE_SHADE = 'rgba(38, 92, 54, 0.28)';
const FLOWERS = ['#ff9db5', '#ffffff', '#ffd75e', '#c9a7ff'];

// Generador sencillo con semilla (la semilla siempre sale de api.rand): sirve para repintar adornos idénticos.
function lcg(seed) {
  let s = (Math.floor(seed) % 2147483646) + 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

export default {
  id: 'oveja',
  create(api) {
    const { kit } = api;
    const { PAL, clamp, lerp, ease } = kit;
    const W = api.W;

    // ── Estado ──
    let t = 0;                    // reloj propio para animaciones
    let round = 0;                // 0 = primer laberinto
    let mode = 'play';            // 'play' | 'found'
    let foundT = 0, foundFx = 0;  // tiempo de celebración y efectos ya lanzados
    let introT = 1;               // 0..1 aparición del laberinto nuevo
    let roundT = 0;               // segundos en este laberinto
    let maze = null;
    let touched = false;          // ¿ya hubo algún toque o tecla?
    let cacheBuilds = 0;
    const L = { top: -1, H: -1 }; // medidas de la pantalla y del laberinto
    const p = { cx: 0, cy: 0, tx: 0, ty: 0, prog: 0, moving: false, face: 1, walkT: 0, bumpT: 0, bumpDir: 1 };
    const target = { x: 0, y: 0, active: false, stuck: 0 };
    const touch = { down: false, id: null };
    const held = [];              // flechas presionadas (la última manda)
    let queued = -1, queuedT = 0; // un toque corto de flecha también cuenta
    const bee = { next: 0.7, show: 0 };
    const ripple = { x: 0, y: 0, t: 1 };
    const decor = [];
    const decoSeed = 1 + Math.floor(api.rand() * 1e6);

    // Las "99" del corral (se ven unas cuantas): posición relativa, dirección y fase de animación.
    const flock = [];
    for (let i = 0; i < 9; i++) {
      const back = i < 5, n = back ? 5 : 4, j = back ? i : i - 5;
      flock.push({ u: (j + 0.5) / n + api.randRange(-0.05, 0.05), v: back ? api.randRange(0.12, 0.32) : api.randRange(0.68, 0.9), dir: api.rand() < 0.5 ? -1 : 1, ph: api.randRange(0, 6.28) });
    }
    flock.sort((a, b) => a.v - b.v);

    // ── Laberinto ──
    // Laberinto perfecto con búsqueda en profundidad (DFS). open[i] = bits de las salidas abiertas de la celda i.
    function carve(cols, rows) {
      const n = cols * rows, open = new Uint8Array(n), seen = new Uint8Array(n), stack = new Int16Array(n), opts = [0, 0, 0, 0];
      let sp = 0;
      const first = api.randInt(0, n - 1);
      stack[sp++] = first; seen[first] = 1;
      while (sp > 0) {
        const cur = stack[sp - 1], x = cur % cols, y = (cur / cols) | 0;
        let k = 0;
        for (let d = 0; d < 4; d++) {
          const nx = x + DX[d], ny = y + DY[d];
          if (nx >= 0 && ny >= 0 && nx < cols && ny < rows && !seen[ny * cols + nx]) opts[k++] = d;
        }
        if (!k) { sp--; continue; }
        const d = opts[Math.min(k - 1, Math.floor(api.rand() * k))];
        const nb = cur + DX[d] + DY[d] * cols;
        open[cur] |= 1 << d; open[nb] |= 1 << ((d + 2) & 3);
        seen[nb] = 1; stack[sp++] = nb;
      }
      return open;
    }
    // Distancias (BFS) desde una celda; devuelve la celda más lejana.
    function flood(open, cols, n, from, dist, queue) {
      dist.fill(-1);
      let qh = 0, qt = 0, far = from;
      queue[qt++] = from; dist[from] = 0;
      while (qh < qt) {
        const cur = queue[qh++], o = open[cur];
        if (dist[cur] > dist[far]) far = cur;
        for (let d = 0; d < 4; d++) {
          if (!(o & (1 << d))) continue;
          const nb = cur + DX[d] + DY[d] * cols;
          if (dist[nb] < 0) { dist[nb] = dist[cur] + 1; queue[qt++] = nb; }
        }
      }
      return far;
    }
    // Tamaño de la cuadrícula de la ronda: 5×6, 6×7, 7×8… En pantallas altas caben hasta 2 filas más (misma celda).
    function gridFor(r) {
      const aw = W - 2 * MARGIN, ah = L.areaY1 - L.areaY0;
      let cols = 5 + r;
      while (cols > 5 && Math.min(aw / cols, ah / (cols + 1)) < MIN_CELL) cols--;
      const cw = aw / cols;
      const rows = cols + 1 + clamp(Math.floor((ah - (cols + 1) * cw) / cw), 0, 2);
      return { cols, rows };
    }
    function newMaze() {
      const { cols, rows } = gridFor(round), n = cols * rows;
      const start = api.rand() < 0.5 ? 0 : cols - 1;           // el pastor sale de una esquina de arriba (junto al corral)
      // La ovejita espera en la celda más lejana. Entre varios laberintos se elige el que deja el camino cerca de un largo
      // pensado para la ronda: así la dificultad sube poco a poco y no depende de la suerte ni del alto de la pantalla.
      const wanted = Math.round(0.55 * cols * (cols + 1));
      const dist = new Int16Array(n), queue = new Int16Array(n);
      let best = null;
      for (let k = 0; k < 12; k++) {
        const open = carve(cols, rows);
        const far = flood(open, cols, n, start, dist, queue);
        const off = Math.abs(dist[far] - wanted);
        if (!best || off < best.off) best = { open, far, off, len: dist[far] };
        if (off <= 1) break;
      }
      const toSheep = new Int16Array(n);
      flood(best.open, cols, n, best.far, toSheep, queue);
      let gate = best.far;                                       // única celda vecina de la ovejita (está en un rincón sin salida)
      for (let d = 0; d < 4; d++) if (best.open[best.far] & (1 << d)) gate = best.far + DX[d] + DY[d] * cols;
      maze = {
        cols, rows, n, open: best.open, start, sheep: best.far, gate, len: best.len, toSheep,
        visited: new Uint8Array(n), near: new Int8Array(n), queue, seed: 1 + Math.floor(api.rand() * 2e9),
        sheepDir: (best.far % cols) < cols / 2 ? 1 : -1,
      };
      maze.visited[start] = 1;
      p.cx = p.tx = start; p.cy = p.ty = 0; p.prog = 0; p.moving = false; p.face = start === 0 ? 1 : -1; p.bumpT = 0;
      target.active = false; target.stuck = 0;
      roundT = 0; bee.next = 0.6; bee.show = 0;
      fit();
    }

    // ── Medidas ──
    function relayout() {
      const top = api.top, avail = api.bottom - top;
      L.top = top; L.H = api.H;
      L.bandH = clamp(avail - 424, 56, 150);                     // franja del paisaje con el corral
      const k = L.k = clamp((L.bandH - 56) / 94);                // 0 franja mínima · 1 franja completa
      L.horizon = top + lerp(14, 42, k);
      L.areaY0 = top + L.bandH + 6; L.areaY1 = api.bottom - 2;
      const w = lerp(150, 184, k), cx = W * 0.47, base = top + L.bandH - lerp(7, 16, k);
      L.corral = { x0: cx - w / 2, x1: cx + w / 2, base, back: base - lerp(22, 46, k), inset: lerp(8, 14, k), post: lerp(11, 19, k), fs: lerp(0.46, 0.7, k), signX: cx + w / 2 + lerp(24, 32, k) };
      if (maze) fit();
    }
    function fit() {
      const aw = W - 2 * MARGIN, ah = L.areaY1 - L.areaY0;
      L.cell = Math.max(14, Math.min(aw / maze.cols, ah / maze.rows));
      L.mw = L.cell * maze.cols; L.mh = L.cell * maze.rows;
      L.ox = (W - L.mw) / 2; L.oy = L.areaY0 + (ah - L.mh) / 2;
      L.wt = clamp(L.cell * 0.19, 6.5, 12);                      // grosor de los setos
      L.pad = L.wt / 2 + 2;
      L.ps = clamp(L.cell * 0.0125, 0.5, 0.86);                  // escala del pastor
      L.ss = clamp(L.cell * 0.0155, 0.6, 1.05);                  // escala de la ovejita
      makeDecor();
      cacheDirty = true;
    }
    function syncLayout() {
      if (api.top !== L.top || api.H !== L.H) { relayout(); target.active = false; }
    }
    const cellX = cx => L.ox + (cx + 0.5) * L.cell;
    const cellY = cy => L.oy + (cy + 0.5) * L.cell;
    const feetY = cy => L.oy + (cy + 0.8) * L.cell;

    // Flores y matitas en los huecos libres del prado.
    function makeDecor() {
      const rnd = lcg(decoSeed + round * 7919 + Math.round(L.H));
      decor.length = 0;
      const c = L.corral, mTop = L.oy - L.pad, mBot = L.oy + L.mh + L.pad + 5;
      const zones = [
        [50, c.back + 6, c.x0 - 16, c.base + 4],
        [c.signX + 26, c.back + 6, W - 8, c.base + 4],
        [12, c.base + 14, W - 12, mTop - 3],
        [12, mBot + 12, W - 12, L.H - 3],
      ];
      for (const [x0, y0, x1, y1] of zones) {
        if (x1 - x0 < 8 || y1 - y0 < 2) continue;
        const count = clamp(Math.round((x1 - x0) * (y1 - y0 + 10) / 1100), 1, 9);
        for (let i = 0; i < count; i++) {
          decor.push({ x: lerp(x0, x1, (i + 0.15 + rnd() * 0.7) / count), y: lerp(y0, y1, rnd()), flower: rnd() < 0.6, color: FLOWERS[Math.floor(rnd() * FLOWERS.length) % FLOWERS.length], s: 0.6 + rnd() * 0.3 });
        }
      }
    }

    // ── Capa fija (paisaje, corral y laberinto) pintada una sola vez en un lienzo aparte ──
    let cache = null, cacheDirty = true, cacheScale = 0, cacheW = 0, cacheH = 0;

    function fence(c, xa, xb, y, h) {
      const n = Math.max(2, Math.round((xb - xa) / 22));
      kit.fillRR(c, xa - 2, y - h * 0.82, xb - xa + 4, 3.2, 1.6, PAL.wood);
      kit.fillRR(c, xa - 2, y - h * 0.42, xb - xa + 4, 3.2, 1.6, PAL.wood);
      for (let i = 0; i <= n; i++) kit.fillRR(c, lerp(xa, xb, i / n) - 2.2, y - h, 4.4, h, 2, PAL.woodDeep);
    }
    // Silueta de los setos: franjas + hileras de arbustitos redondos, todo en una sola ruta (se rellena de una vez).
    function hedgeShape(c, walls, dy, half, rBump, rNode) {
      const m = maze, { ox, oy, cell, wt } = L;
      const nB = Math.max(2, Math.round(cell / (wt * 1.2)));
      c.beginPath();
      for (let i = 0; i < walls.length; i += 4) {
        const xa = walls[i], ya = walls[i + 1], xb = walls[i + 2], yb = walls[i + 3];
        if (ya === yb) c.rect(xa, ya - half + dy, xb - xa, half * 2); else c.rect(xa - half, ya + dy, half * 2, yb - ya);
        for (let j = 1; j < nB; j++) { const x = lerp(xa, xb, j / nB), y = lerp(ya, yb, j / nB) + dy; c.moveTo(x + rBump, y); c.arc(x, y, rBump, 0, 6.2832); }
      }
      for (let y = 0; y <= m.rows; y++) for (let x = 0; x <= m.cols; x++) { const nx = ox + x * cell, ny = oy + y * cell + dy; c.moveTo(nx + rNode, ny); c.arc(nx, ny, rNode, 0, 6.2832); }
    }
    function paintStatic(c) {
      const H = L.H, top = L.top, k = L.k, co = L.corral;
      // cielo y colinas
      const sky = c.createLinearGradient(0, 0, 0, L.horizon + 10);
      sky.addColorStop(0, '#6fc1f3'); sky.addColorStop(1, '#dcf3ff');
      c.fillStyle = sky; c.fillRect(0, 0, W, L.horizon + 14);
      if (k > 0.5) kit.sun(c, W - 30, top + 15, 12, 0.4);
      kit.hills(c, W, H, L.horizon, lerp(4, 8, k), '#b9e9a0', 30, 0.021);
      const meadow = c.createLinearGradient(0, L.horizon, 0, H);
      meadow.addColorStop(0, '#a2e08b'); meadow.addColorStop(1, '#82cd74');
      kit.hills(c, W, H, L.horizon + lerp(7, 12, k), lerp(2, 4, k), meadow, 140, 0.013);
      // árboles
      kit.tree(c, 28, co.base + 2, lerp(0.5, 0.92, k));
      kit.tree(c, W - 22, co.base - lerp(4, 22, k), lerp(0.4, 0.62, k), { kind: 'olive' });
      // corral: suelo de tierra clara, cerca del fondo y laterales (la cerca de delante se pinta encima de las ovejas)
      c.save();
      c.fillStyle = 'rgba(247, 232, 180, 0.6)';
      c.beginPath(); c.moveTo(co.x0 + co.inset, co.back - 2); c.lineTo(co.x1 - co.inset, co.back - 2); c.lineTo(co.x1 + 2, co.base + 2); c.lineTo(co.x0 - 2, co.base + 2); c.closePath(); c.fill();
      c.strokeStyle = PAL.wood; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath();
      c.moveTo(co.x0 + co.inset, co.back - co.post * 0.5); c.lineTo(co.x0, co.base - co.post * 0.6);
      c.moveTo(co.x1 - co.inset, co.back - co.post * 0.5); c.lineTo(co.x1, co.base - co.post * 0.6);
      c.stroke();
      c.restore();
      fence(c, co.x0 + co.inset, co.x1 - co.inset, co.back, co.post * 0.8);
      // letrero (el número se pinta en vivo)
      const sh = co.post * 1.9;
      kit.fillRR(c, co.signX - 2.2, co.base - sh, 4.4, sh, 2, PAL.woodDeep);
      kit.fillRR(c, co.signX - 21, co.base - sh - 12, 42, 25, 7, PAL.woodDeep);
      kit.fillRR(c, co.signX - 19, co.base - sh - 10, 38, 21, 5.5, '#f3d9a4');
      // flores y matitas
      for (const d of decor) { if (d.flower) kit.flower(c, d.x, d.y, d.s, d.color); else kit.grass(c, d.x, d.y, d.s + 0.2, '#5cb565'); }
      paintMaze(c);
    }
    function paintMaze(c) {
      const m = maze, { ox, oy, cell, mw, mh, wt, pad } = L;
      const rnd = lcg(m.seed);
      // tablero de prado claro
      kit.fillRR(c, ox - pad, oy - pad + 5, mw + pad * 2, mh + pad * 2, wt + 3, 'rgba(45, 100, 60, 0.25)');
      kit.fillRR(c, ox - pad, oy - pad, mw + pad * 2, mh + pad * 2, wt + 3, FLOOR);
      const ins = wt * 0.5 + 1.5, tile = cell - ins * 2, rad = Math.min(10, tile * 0.28);
      for (let y = 0; y < m.rows; y++) for (let x = 0; x < m.cols; x++) {
        const i = y * m.cols + x;
        if (i === m.start) kit.fillRR(c, ox + x * cell + ins, oy + y * cell + ins, tile, tile, rad, HOME);
        else if ((x + y) & 1) kit.fillRR(c, ox + x * cell + ins, oy + y * cell + ins, tile, tile, rad, FLOOR_ALT);
      }
      // setos: lista de tramos (borde + paredes interiores), y luego sombra, cuerpo y lomo más claro
      const walls = [];
      for (let x = 0; x < m.cols; x++) walls.push(ox + x * cell, oy, ox + (x + 1) * cell, oy, ox + x * cell, oy + mh, ox + (x + 1) * cell, oy + mh);
      for (let y = 0; y < m.rows; y++) walls.push(ox, oy + y * cell, ox, oy + (y + 1) * cell, ox + mw, oy + y * cell, ox + mw, oy + (y + 1) * cell);
      for (let y = 0; y < m.rows; y++) for (let x = 0; x < m.cols; x++) {
        const o = m.open[y * m.cols + x];
        if (x < m.cols - 1 && !(o & 2)) walls.push(ox + (x + 1) * cell, oy + y * cell, ox + (x + 1) * cell, oy + (y + 1) * cell);
        if (y < m.rows - 1 && !(o & 4)) walls.push(ox + x * cell, oy + (y + 1) * cell, ox + (x + 1) * cell, oy + (y + 1) * cell);
      }
      c.save();
      c.fillStyle = HEDGE_SHADE; hedgeShape(c, walls, wt * 0.36, wt * 0.42, wt * 0.58, wt * 0.66); c.fill();
      c.fillStyle = HEDGE; hedgeShape(c, walls, 0, wt * 0.42, wt * 0.58, wt * 0.66); c.fill();
      c.fillStyle = HEDGE_TOP; hedgeShape(c, walls, -wt * 0.16, wt * 0.2, wt * 0.36, wt * 0.42); c.fill();
      // hojitas claras y alguna flor sobre los setos
      const leaf = (x, y) => { c.moveTo(x + wt * 0.15, y); c.arc(x, y, wt * 0.15, 0, 6.2832); };
      const blooms = [];
      c.fillStyle = HEDGE_LEAF; c.beginPath();
      const sprinkle = (xa, ya, xb, yb) => {
        const u = 0.2 + rnd() * 0.6, r = rnd();
        const x = lerp(xa, xb, u), y = lerp(ya, yb, u) - wt * 0.2;
        if (r < 0.1) blooms.push(x, y, Math.floor(rnd() * 3)); else if (r < 0.75) leaf(x + (rnd() - 0.5) * wt * 0.3, y);
      };
      for (let i = 0; i < walls.length; i += 4) sprinkle(walls[i], walls[i + 1], walls[i + 2], walls[i + 3]);
      c.fill();
      for (let i = 0; i < blooms.length; i += 3) {
        const bx = blooms[i], by = blooms[i + 1], r = wt * 0.17;
        c.fillStyle = FLOWERS[blooms[i + 2]]; c.beginPath();
        for (let a = 0; a < 4; a++) { const px = bx + Math.cos(a * 1.5708 + 0.6) * r, py = by + Math.sin(a * 1.5708 + 0.6) * r; c.moveTo(px + r, py); c.arc(px, py, r, 0, 6.2832); }
        c.fill();
        c.fillStyle = '#ffb347'; c.beginPath(); c.arc(bx, by, r * 0.7, 0, 6.2832); c.fill();
      }
      c.restore();
    }
    // Devuelve true si la capa fija quedó lista en el lienzo aparte (y con la misma resolución que la pantalla).
    function ensureCache(g) {
      const cv = g.canvas;
      if (!cv || typeof document === 'undefined') return false;
      const ps = typeof g.getTransform === 'function' ? g.getTransform().a : cv.width / W;
      if (!(ps > 0)) return false;
      if (!cacheDirty && cache && cacheW === cv.width && cacheH === cv.height && Math.abs(ps - cacheScale) < 1e-4) return true;
      if (!cache) cache = document.createElement('canvas');
      if (cache.width !== cv.width || cache.height !== cv.height) { cache.width = cv.width; cache.height = cv.height; }
      const c = cache.getContext('2d');
      if (!c) return false;
      c.setTransform(ps, 0, 0, ps, 0, 0);
      c.globalAlpha = 1;
      paintStatic(c);
      cacheScale = ps; cacheW = cv.width; cacheH = cv.height; cacheDirty = false; cacheBuilds++;
      return true;
    }

    // ── Movimiento ──
    // Primer paso del camino corto (≤ NEAR celdas) desde `here` hasta `goal`, o -1 si no lo hay.
    function nearStep(here, goal) {
      const m = maze, near = m.near, q = m.queue;
      near.fill(-1);
      let qh = 0, qt = 0;
      q[qt++] = goal; near[goal] = 0;
      while (qh < qt) {
        const cur = q[qh++], dc = near[cur];
        if (cur === here) break;
        if (dc >= NEAR) continue;
        const o = m.open[cur];
        for (let d = 0; d < 4; d++) {
          if (!(o & (1 << d))) continue;
          const nb = cur + DX[d] + DY[d] * m.cols;
          if (near[nb] < 0) { near[nb] = dc + 1; q[qt++] = nb; }
        }
      }
      const dh = near[here];
      if (dh <= 0) return -1;
      const o = m.open[here];
      for (let d = 0; d < 4; d++) if ((o & (1 << d)) && near[here + DX[d] + DY[d] * m.cols] === dh - 1) return d;
      return -1;
    }
    function bump(d) { p.bumpT = 1; p.bumpDir = d; if (DX[d]) p.face = DX[d]; api.sfx('tap'); }
    // ¿Hacia dónde da el siguiente paso el pastor? (-1 = se queda quieto)
    function chooseDir() {
      const m = maze, here = p.cx + p.cy * m.cols, o = m.open[here];
      if (queued >= 0) { const d = queued; queued = -1; if (o & (1 << d)) return d; bump(d); }
      for (let i = held.length - 1; i >= 0; i--) if (o & (1 << held[i])) return held[i];
      if (held.length || !target.active) return -1;
      // posición del dedo en unidades de celda (los centros caen en números enteros)
      const fx = clamp((target.x - L.ox) / L.cell - 0.5, 0, m.cols - 1), fy = clamp((target.y - L.oy) / L.cell - 0.5, 0, m.rows - 1);
      const gx = Math.round(fx), gy = Math.round(fy);
      if (gx === p.cx && gy === p.cy) { if (!touch.down) target.active = false; target.stuck = 0; return -1; }
      let d = nearStep(here, gx + gy * m.cols);
      if (d < 0) {
        // lejos: eje dominante y, si hay seto, el otro eje (solo si el dedo está de verdad en otra fila/columna: así no baila)
        const dx = fx - p.cx, dy = fy - p.cy, ax = Math.abs(dx), ay = Math.abs(dy);
        const hx = ax > 0.5 ? (dx > 0 ? 1 : 3) : -1, hy = ay > 0.5 ? (dy > 0 ? 2 : 0) : -1;
        const first = ax >= ay ? hx : hy, second = ax >= ay ? hy : hx;
        if (first >= 0 && (o & (1 << first))) d = first; else if (second >= 0 && (o & (1 << second))) d = second;
      }
      return d;
    }
    function movePastor(dt) {
      if (queuedT > 0) { queuedT -= dt; if (queuedT <= 0) queued = -1; }
      let budget = SPEED * dt;
      for (let guard = 0; guard < 4 && budget > 1e-6 && mode === 'play'; guard++) {
        if (!p.moving) {
          const d = chooseDir();
          if (d < 0) break;
          p.moving = true; p.prog = 0; p.tx = p.cx + DX[d]; p.ty = p.cy + DY[d];
          if (DX[d]) p.face = DX[d];
          target.stuck = 0;
        }
        const use = Math.min(1 - p.prog, budget);
        p.prog += use; budget -= use; p.walkT += use;
        if (p.prog >= 1 - 1e-6) {
          p.cx = p.tx; p.cy = p.ty; p.prog = 0; p.moving = false;
          const idx = p.cx + p.cy * maze.cols;
          maze.visited[idx] = 1;
          api.sfx('step');
          if (idx === maze.gate) found();
        }
      }
      if (!p.moving && target.active && mode === 'play') {
        target.stuck += dt;
        if (!touch.down && target.stuck > 0.45) target.active = false;   // un toque suelto que no se puede alcanzar se olvida
      }
    }
    function found() {
      mode = 'found'; foundT = 0; foundFx = 0;
      target.active = false; queued = -1;
      const m = maze, sx = cellX(m.sheep % m.cols), sy = feetY((m.sheep / m.cols) | 0), px = cellX(p.cx), py = feetY(p.cy);
      if (Math.abs(sx - px) > 1) p.face = sx > px ? 1 : -1;
      api.addScore(1);
      api.addTime(BONUS);
      api.sfx('good'); api.sfx('jump');
      api.burst(sx, sy - 14, { color: PAL.sun, count: 12, speed: 110, size: 4, life: 0.6 });
      api.floatText(clamp(px, 74, W - 74), Math.max(L.top + 30, py - 62 * L.ps - 16), '¡La encontré!', { size: 22, color: '#fff8c9' });
      api.floatText(W - 52, L.top + 24, `+${BONUS} s`, { size: 18, color: '#ffe680' });
    }
    function nextRound() {
      round++;
      mode = 'play'; introT = 0;
      newMaze();
      api.sfx('whoosh');
      if (touch.down) { target.x = api.pointer.x; target.y = api.pointer.y; target.active = true; }
    }
    function setTarget(x, y) { target.x = x; target.y = y; target.active = true; target.stuck = 0; }
    // Celdas del camino desde `from` hacia la ovejita (hasta `max` pasos), sin incluir la celda de la ovejita.
    function pathAhead(from, max, out) {
      const m = maze;
      out.length = 0;
      let cur = from;
      for (let i = 0; i < max; i++) {
        const o = m.open[cur];
        let next = -1;
        for (let d = 0; d < 4; d++) if ((o & (1 << d)) && m.toSheep[cur + DX[d] + DY[d] * m.cols] === m.toSheep[cur] - 1) next = cur + DX[d] + DY[d] * m.cols;
        if (next < 0 || next === m.sheep) break;
        out.push(next); cur = next;
      }
      return out;
    }
    const ahead = [];

    // ── Dibujo de personajes ──
    function drawPastor(g, x, y, arms) {
      const s = L.ps;
      g.save();                                                  // cayado
      g.translate(x + p.face * 14 * s, y); g.scale(p.face * s, s);
      g.strokeStyle = PAL.woodDeep; g.lineWidth = Math.max(2.8, 1.9 / s); g.lineCap = 'round';
      g.beginPath(); g.moveTo(0, -1); g.lineTo(0, -51); g.arc(5.5, -51, 5.5, Math.PI, Math.PI * 2.3); g.stroke();
      g.restore();
      kit.person(g, x, y, s, { robe: '#f0a04b', sash: '#a85a2a', veil: '#fff4dc', hair: '#5a3b28', beard: true, arms, dir: p.face, t: p.walkT * 1.4, walk: p.moving });
    }
    function drawBubble(g, x, y, str, k, w = 52) {                // (x, y) = punta del globito
      if (k <= 0) return;
      const s = ease.outBack(clamp(k)), h = 25, bx = clamp(x - w / 2, 4, W - w - 4);
      g.save(); g.translate(x, y); g.scale(s, s); g.translate(-x, -y);
      kit.fillRR(g, bx, y - 7 - h, w, h, 11, 'rgba(60, 40, 30, 0.16)');
      kit.fillRR(g, bx, y - 9 - h, w, h, 11, '#ffffff');
      g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(x - 6, y - 10); g.lineTo(x, y); g.lineTo(x + 6, y - 10); g.closePath(); g.fill();
      kit.text(g, str, bx + w / 2, y - 9 - h / 2 + 1, { size: 14, color: PAL.ink });
      g.restore();
    }

    relayout();
    newMaze();
    api.hint('Pon el dedo y guía al pastor', 3200);

    return {
      update(dt) {
        t += dt;
        syncLayout();
        if (ripple.t < 1) ripple.t = Math.min(1, ripple.t + dt * 2.6);
        if (p.bumpT > 0) p.bumpT = Math.max(0, p.bumpT - dt * 5);
        if (introT < 1) introT = Math.min(1, introT + dt / 0.35);
        if (mode === 'found') {
          foundT += dt;
          if (foundFx === 0 && foundT >= 0.3) {                   // la ovejita ya está en sus hombros
            foundFx = 1;
            api.sfx('sparkle');
            api.burst(cellX(p.cx), feetY(p.cy) - 50 * L.ps, { emoji: '❤️', count: 7, speed: 95, size: 15, gravity: -70, life: 0.95 });
            const co = L.corral;
            api.burst((co.x0 + co.x1) / 2, co.back, { emoji: '💛', count: 4, speed: 70, size: 13, gravity: -60, life: 0.9 });
          }
          if (foundT >= FOUND_TIME) nextRound();
          return;
        }
        roundT += dt;
        bee.next -= dt;
        if (bee.show > 0) bee.show -= dt;
        if (bee.next <= 0) { bee.show = 1.5; bee.next = api.randRange(3.4, 4.8); api.sfx('bubble'); }
        movePastor(dt);
      },

      draw(g) {
        syncLayout();
        const m = maze, { ox, oy, cell, mw, mh, wt, pad } = L, co = L.corral;
        // capa fija
        if (ensureCache(g)) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(cache, 0, 0); g.restore(); }
        else paintStatic(g);
        if (L.k > 0.35) kit.cloud(g, ((t * 7 + 90) % (W + 140)) - 70, L.top + lerp(2, 18, L.k), 0.55, 0.9);

        // corral con las 99 (y fiesta cuando vuelve la que faltaba)
        const party = mode === 'found' && foundT > 0.3;
        for (const f of flock) {
          const fy = lerp(co.back + 3, co.base - 1, f.v), ins = co.inset * (1 - f.v) + 12 * co.fs;
          const fx = lerp(co.x0 + ins, co.x1 - ins, clamp(f.u));
          const hop = party ? Math.abs(Math.sin((foundT - 0.3) * 9 + f.ph)) * 7 : Math.max(0, Math.sin(t * 1.3 + f.ph) - 0.93) * 40;
          kit.sheep(g, fx, fy, co.fs, { dir: f.dir, t: t + f.ph, hop });
        }
        fence(g, co.x0, co.x1, co.base, co.post);
        const signY = co.base - co.post * 1.9 + 0.5;
        const pop = party ? 1 + 0.25 * (1 - ease.outElastic(clamp((foundT - 0.3) / 0.6))) : 1;
        kit.text(g, party ? '100' : '99', co.signX, signY, { size: (party ? 15 : 16) * pop, color: party ? PAL.coralDeep : PAL.ink });

        // huellas: celdas ya recorridas
        g.fillStyle = 'rgba(255, 255, 255, 0.6)'; g.beginPath();
        const here = p.cx + p.cy * m.cols, vr = Math.max(2, cell * 0.06);
        for (let i = 0; i < m.n; i++) {
          if (!m.visited[i] || i === here) continue;
          const vx = cellX(i % m.cols), vy = cellY((i / m.cols) | 0);
          g.moveTo(vx + vr, vy); g.arc(vx, vy, vr, 0, 6.2832);
        }
        g.fill();

        const sxc = m.sheep % m.cols, syc = (m.sheep / m.cols) | 0;
        const sx = cellX(sxc), sy = feetY(syc);
        const k = p.moving ? p.prog : 0;
        let px = cellX(lerp(p.cx, p.tx, k)), py = feetY(lerp(p.cy, p.ty, k));
        if (p.bumpT > 0) { const b = Math.sin(p.bumpT * Math.PI) * cell * 0.1; px += DX[p.bumpDir] * b; py += DY[p.bumpDir] * b; }

        if (mode === 'play') {
          // ayuda amable si tarda mucho: estrellitas que marcan los próximos pasos
          if (roundT > 12 + m.len * 0.45) {
            pathAhead(p.moving ? p.tx + p.ty * m.cols : here, 5, ahead);
            for (let i = 0; i < ahead.length; i++) {
              const a = 0.55 + 0.45 * Math.sin(t * 5 - i * 0.9);
              g.globalAlpha = 0.35 + 0.5 * a;
              kit.star(g, cellX(ahead[i] % m.cols), cellY((ahead[i] / m.cols) | 0), cell * (0.11 + 0.03 * a), PAL.sun, 0.2);
            }
            g.globalAlpha = 1;
          }
          // halo que marca dónde está la ovejita
          const pulse = 0.5 + 0.5 * Math.sin(t * 4);
          kit.circle(g, sx, sy - cell * 0.22, cell * (0.36 + 0.05 * pulse), `rgba(255, 255, 255, ${0.3 + 0.2 * pulse})`);
          // destino del dedo
          if (target.active && !touch.down) kit.circle(g, target.x, target.y, 9 + 2 * Math.sin(t * 9), null, 'rgba(255, 255, 255, 0.85)', 3);
        }
        if (ripple.t < 1) { g.globalAlpha = 1 - ripple.t; kit.circle(g, ripple.x, ripple.y, 8 + 22 * ease.outCubic(ripple.t), null, '#ffffff', 3); g.globalAlpha = 1; }

        // ovejita y pastor
        if (mode === 'found') {
          const j = clamp(foundT / 0.3), e = ease.inOut(j);
          const hopT = Math.max(0, foundT - 0.3);
          const joy = j < 1 ? 0 : Math.abs(Math.sin(hopT * 9.5)) * 7 * L.ps * Math.max(0.25, 1 - hopT * 0.7);
          const cx2 = lerp(sx, px, e), cy2 = lerp(sy, py - 35 * L.ps, e) - Math.sin(j * Math.PI) * cell * 0.3 - joy;
          const ss = lerp(L.ss, L.ss * 0.8, e);
          if (j < 1) { drawPastor(g, px, py, 'open'); kit.sheep(g, cx2, cy2, ss, { dir: -p.face, t, hop: 0 }); }
          else { kit.sheep(g, cx2, cy2, ss, { dir: p.face, t: t * 2 }); drawPastor(g, px, py - joy, 'up'); }
        } else {
          const closeBy = m.toSheep[here] <= 3;                  // ¡ya lo ve venir!
          const drawSheep = () => {
            const sdir = closeBy && Math.abs(px - sx) > 2 ? (px > sx ? 1 : -1) : m.sheepDir;
            const tremble = closeBy ? 0 : Math.sin(t * 17) * 0.5;
            kit.sheep(g, sx + tremble, sy, L.ss, { dir: sdir, t, sad: !closeBy, hop: closeBy ? Math.abs(Math.sin(t * 9)) * 4 : 0 });
          };
          const bob = p.moving ? Math.abs(Math.sin(p.walkT * Math.PI * 2)) * 2.4 * L.ps : 0;
          if (sy <= py) { drawSheep(); drawPastor(g, px, py - bob, 'down'); } else { drawPastor(g, px, py - bob, 'down'); drawSheep(); }
          // globitos
          if (bee.show > 0) drawBubble(g, sx + m.sheepDir * 6 * L.ss, sy - 31 * L.ss, '¡Bee!', Math.min(bee.show, 1.5 - bee.show) * 5);
          if (touch.down && target.stuck > 0.7) drawBubble(g, px, py - 58 * L.ps, '?', (target.stuck - 0.7) * 5, 30);
        }

        // demostración: un dedo que marca los primeros pasos (solo hasta el primer toque)
        if (!touched && round === 0 && mode === 'play' && t > 1) {
          pathAhead(m.start, 4, ahead);
          if (ahead.length >= 2) {
            const loop = (t - 1) % 2.4, u = ease.inOut(clamp(loop / 1.5)) * ahead.length;
            const i = Math.min(ahead.length - 1, Math.floor(u)), fr = u - i;
            const c0 = i === 0 ? m.start : ahead[i - 1], c1 = ahead[i];
            const hx = lerp(cellX(c0 % m.cols), cellX(c1 % m.cols), fr), hy = lerp(cellY((c0 / m.cols) | 0), cellY((c1 / m.cols) | 0), fr);
            const al = clamp(loop * 5) * clamp((2.3 - loop) * 3);
            g.globalAlpha = al;
            kit.circle(g, hx, hy, 13, 'rgba(255, 255, 255, 0.55)', '#ffffff', 3);
            g.globalAlpha = 1;
            kit.emoji(g, '👆', hx + 7, hy + 22, 32, { alpha: al });
          }
        }

        // cambio de laberinto: el tablero se aclara y aparece el nuevo
        const fade = mode === 'found' ? clamp((foundT - (FOUND_TIME - 0.22)) / 0.22) : (round > 0 ? 1 - introT : 0);
        if (fade > 0) { g.globalAlpha = fade; kit.fillRR(g, ox - pad, oy - pad, mw + pad * 2, mh + pad * 2, wt + 3, FLOOR); g.globalAlpha = 1; }
      },

      pointerDown(x, y, id) {
        touched = true;
        touch.down = true; touch.id = id;
        held.length = 0; queued = -1;
        ripple.x = x; ripple.y = y; ripple.t = 0;
        if (mode === 'play') setTarget(x, y);
      },
      pointerMove(x, y, id) {
        if (!touch.down || id !== touch.id) return;
        if (mode === 'play') setTarget(x, y);
      },
      pointerUp(x, y, id) {
        if (id !== touch.id) return;
        touch.down = false; touch.id = null;
      },
      keyDown(key) {
        const d = KEY_DIR[key];
        if (d === undefined) return;
        touched = true;
        target.active = false;
        const i = held.indexOf(d);
        if (i >= 0) held.splice(i, 1);
        held.push(d);
        queued = d; queuedT = 0.25;
      },
      keyUp(key) {
        const i = held.indexOf(KEY_DIR[key]);
        if (i >= 0) held.splice(i, 1);
      },
      resize() { L.top = -1; },                                  // se vuelve a medir en el siguiente cuadro
      destroy() { if (cache) { cache.width = cache.height = 0; cache = null; } },

      // Solo lectura, para las pruebas automáticas.
      get debug() {
        const m = maze;
        return {
          round, mode, cols: m.cols, rows: m.rows, cell: L.cell, ox: L.ox, oy: L.oy, len: m.len, roundT, cacheBuilds,
          pastor: { cx: p.cx, cy: p.cy, moving: p.moving, x: cellX(p.cx), y: cellY(p.cy) },
          sheep: { cx: m.sheep % m.cols, cy: (m.sheep / m.cols) | 0, x: cellX(m.sheep % m.cols), y: cellY((m.sheep / m.cols) | 0) },
          gate: m.gate, left: m.toSheep[p.cx + p.cy * m.cols], open: Array.from(m.open),
          path: pathAhead(p.cx + p.cy * m.cols, 400, []).map(i => ({ cx: i % m.cols, cy: (i / m.cols) | 0, x: cellX(i % m.cols), y: cellY((i / m.cols) | 0) })),
          target: { ...target }, touching: touch.down, layout: { top: L.top, H: L.H, bandH: L.bandH, areaY0: L.areaY0, areaY1: L.areaY1 },
        };
      },
    };
  },
};
