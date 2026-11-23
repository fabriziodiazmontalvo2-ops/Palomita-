// Escenas ilustradas de Palomita: paisajes pintados con canvas 2D (cielo, desierto, mar de Galilea, cenáculo…).
//
//   sceneEl(bg, { shape, ambient, cls })  → <span class="sc …"> con tres capas: fondo pintado, ambiente animado
//                                           (nubes, estrellas, brillos del agua, polvo de luz, lluvia) y primer plano.
//                                           Los personajes (emojis) se agregan como hijos y quedan entre el fondo y
//                                           el primer plano (z-index), así el pasto les tapa un poquito los pies.
//        shape   'card' (tarjetas, 1,6:1) · 'hero' (portadas, 1,6:1) · 'stage' (lecciones, 4:3)
//        ambient false | 'lite' (solo nubes y estrellas) | 'full'
//        orb     false → sin sol ni luna pintados (cuando la escena trae los suyos como emoji; ver hasOrb)
//   SCENE_IDS        todos los fondos que existen (los datos usan estos nombres en `bg`)
//   isFloating(e)    true si el emoji «vuela» (sol, estrellas, aves…) y no lleva sombra en el suelo
//
// Cada fondo se pinta una sola vez por tamaño y se guarda como imagen (blob WebP) para que desplazarse sea fluido.
// Mientras se pinta, la escena muestra un degradado del mismo color (sin saltos). Todo es determinista: el mismo
// fondo sale siempre igual. Sin dependencias del DOM al cargar el módulo (lo puede importar Node para validar).

export const SCENE_IDS = ['cielo', 'noche', 'desierto', 'mar', 'jardin', 'dorado', 'amanecer', 'tormenta', 'templo', 'campo',
  'cenaculo', 'rio', 'monte', 'ciudad', 'iglesia'];
const DARK = new Set(['noche', 'tormenta', 'cenaculo']);
const FLOATING = new Set(['🌞', '☀', '🌙', '🌛', '🌜', '⭐', '🌟', '✨', '💫', '🌠', '☁', '⛅', '🌤', '🌥', '🌦', '🌧', '⛈', '🌈', '⚡', '🌬',
  '🕊', '🐦', '👼', '🎶', '🎵', '❤', '💛', '💜', '💙', '💚', '🧡', '🍃', '🎉', '🌅', '💨', '💭', '❓']);
export const isFloating = e => FLOATING.has(String(e || '').replace(/\uFE0F/g, ''));
// Si la escena ya trae su propio sol o luna (emoji), el paisaje se pinta sin el suyo: así no salen dos.
const ORBS = new Set(['☀', '🌞', '🌙', '🌛', '🌜', '🌝', '🌕', '🌤', '⛅', '🌅', '🌄']);
export const hasOrb = list => [...(list || [])].some(e => ORBS.has(String(e || '').replace(/\uFE0F/g, '')));

const TAU = Math.PI * 2;

// ───────────────────────── Utilidades de pintura ─────────────────────────

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const seedOf = s => { let x = 2166136261; for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619); return x >>> 0; };

function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function lin(g, x0, y0, x1, y1, stops) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  return gr;
}
function rad(g, x, y, r0, r1, stops) {
  const gr = g.createRadialGradient(x, y, r0, x, y, r1);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  return gr;
}
function fillSky(g, w, h, stops) { g.fillStyle = lin(g, 0, 0, 0, h, stops); g.fillRect(0, 0, w, h); }
function glow(g, x, y, r, hex, a = 1, comp = 'source-over') {
  g.save();
  g.globalCompositeOperation = comp;
  g.fillStyle = rad(g, x, y, 0, r, [[0, rgba(hex, a)], [0.35, rgba(hex, a * 0.45)], [1, rgba(hex, 0)]]);
  g.fillRect(x - r, y - r, r * 2, r * 2);
  g.restore();
}
function sun(g, x, y, r, { core = '#fffbe6', rim = '#ffe08a', halo = '#fff2b8', haloR = 4.2 } = {}) {
  glow(g, x, y, r * haloR, halo, 0.75);
  glow(g, x, y, r * 1.9, '#ffffff', 0.55);
  g.fillStyle = rad(g, x, y, 0, r, [[0, core], [0.75, core], [1, rim]]);
  g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
}

// Línea de cerros suave (suma de senos). Devuelve la altura del borde en cada x, para plantar árboles encima.
function ridge(g, w, h, { y, amp, n = 3, seed = 1, fill, rim = null, rimW = 2, bottom = h, step = 0, flat = 0 }) {
  const r = rng(seed);
  const waves = Array.from({ length: n }, (_, i) => ({ f: (i + 1) * (0.55 + r() * 0.9), p: r() * TAU, a: (amp / (i + 1)) * (0.55 + r() * 0.7) }));
  const yAt = x => y + waves.reduce((s, v) => s + Math.sin((x / w) * Math.PI * v.f + v.p) * v.a, 0) * (1 - flat);
  g.beginPath();
  g.moveTo(-2, bottom + 2);
  const dx = step || w / 72;
  for (let x = -2; x <= w + dx; x += dx) g.lineTo(x, yAt(x));
  g.lineTo(w + 2, bottom + 2);
  g.closePath();
  g.fillStyle = Array.isArray(fill) ? lin(g, 0, y - amp, 0, bottom, fill) : fill;
  g.fill();
  if (rim) {
    g.save();
    g.beginPath();
    for (let x = -2; x <= w + dx; x += dx) (x === -2 ? g.moveTo(x, yAt(x) + rimW * 0.5) : g.lineTo(x, yAt(x) + rimW * 0.5));
    g.strokeStyle = rim; g.lineWidth = rimW; g.stroke();
    g.restore();
  }
  return yAt;
}

// Montaña con picos: lado iluminado y lado en sombra.
function peak(g, x, y, wd, ht, { light, dark, snow = null, seed = 3, foot = null }) {
  const r = rng(seed);
  const top = [x + (r() - 0.5) * wd * 0.08, y - ht];
  const pts = [[x - wd / 2, y]];
  const steps = 7;
  for (let i = 1; i < steps; i++) { const t = i / steps; pts.push([x - wd / 2 + (top[0] - (x - wd / 2)) * t + (r() - 0.5) * wd * 0.03, y - ht * t + (r() - 0.5) * ht * 0.06]); }
  pts.push(top);
  for (let i = 1; i < steps; i++) { const t = i / steps; pts.push([top[0] + (x + wd / 2 - top[0]) * t + (r() - 0.5) * wd * 0.03, y - ht + ht * t + (r() - 0.5) * ht * 0.06]); }
  pts.push([x + wd / 2, y]);
  const path = () => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts) g.lineTo(p[0], p[1]); g.closePath(); };
  path(); g.fillStyle = lin(g, 0, y - ht, 0, y, [[0, light], [1, dark]]); g.fill();
  // lado en sombra (derecha del pico)
  g.save(); path(); g.clip();
  g.beginPath(); g.moveTo(top[0], top[1]); g.lineTo(top[0] + wd * 0.06, y); g.lineTo(x + wd, y); g.lineTo(x + wd, y - ht * 1.2); g.closePath();
  g.fillStyle = rgba('#2a2040', 0.16); g.fill();
  g.strokeStyle = rgba('#ffffff', 0.18); g.lineWidth = Math.max(1, wd / 260);
  for (let i = 0; i < 7; i++) { const t = 0.25 + i * 0.1, yy = y - ht * (1 - t); g.beginPath(); g.moveTo(top[0] - wd * 0.5 * t + r() * wd * 0.05, yy + r() * ht * 0.04); g.lineTo(top[0] - wd * 0.12 * t, yy - ht * 0.05); g.stroke(); }
  if (foot) { g.fillStyle = lin(g, 0, y - ht * 0.55, 0, y, [[0, rgba(foot, 0)], [0.45, rgba(foot, 0.75)], [1, foot]]); g.fillRect(x - wd, y - ht * 0.55, wd * 2, ht * 0.56); }
  if (snow) {
    g.beginPath(); g.moveTo(top[0] - wd * 0.13, top[1] + ht * 0.2);
    for (let i = 0; i <= 6; i++) g.lineTo(top[0] - wd * 0.13 + (wd * 0.26 * i) / 6, top[1] + ht * (0.2 + (i % 2 ? 0.06 : -0.01)));
    g.lineTo(top[0], top[1] - 2); g.closePath();
    g.fillStyle = snow; g.fill();
  }
  g.restore();
}

function cloud(g, x, y, s, { light = '#ffffff', shade = '#dbe6f4', alpha = 1, seed = 1 } = {}) {
  const r = rng(seed);
  const puffs = [[-0.92, 0.04, 0.36], [-0.5, -0.22, 0.5], [0.02, -0.4, 0.62], [0.55, -0.2, 0.5], [0.95, 0.04, 0.36], [-0.2, 0.06, 0.46], [0.35, 0.06, 0.44]];
  g.save();
  g.globalAlpha = alpha;
  g.fillStyle = lin(g, 0, y - s, 0, y + s * 0.42, [[0, light], [0.55, light], [1, shade]]);
  g.beginPath();
  for (const [dx, dy, rr] of puffs) {
    const cx = x + (dx + (r() - 0.5) * 0.12) * s, cy = y + (dy + (r() - 0.5) * 0.1) * s, R = rr * s * (0.9 + r() * 0.2);
    g.moveTo(cx + R, cy); g.arc(cx, cy, R, 0, TAU);
  }
  g.fill();
  g.restore();
}

function stars(g, w, h, n, r, { maxY = 1, big = 8, tint = '#fffbe8' } = {}) {
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = Math.pow(r(), 1.3) * h * maxY, s = 0.5 + r() * 1.4 * (w / 900 + 0.4);
    g.fillStyle = rgba(i % 5 ? '#ffffff' : tint, 0.35 + r() * 0.65);
    g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill();
  }
  for (let i = 0; i < big; i++) sparkle(g, r() * w, Math.pow(r(), 1.2) * h * maxY * 0.9, (3 + r() * 5) * (w / 900 + 0.5), '#ffffff', 0.9);
}
function sparkle(g, x, y, s, hex = '#ffffff', a = 1) {
  glow(g, x, y, s * 2.4, hex, a * 0.35);
  g.save();
  g.fillStyle = rgba(hex, a);
  g.beginPath();
  g.moveTo(x, y - s); g.quadraticCurveTo(x, y, x + s, y); g.quadraticCurveTo(x, y, x, y + s); g.quadraticCurveTo(x, y, x - s, y); g.quadraticCurveTo(x, y, x, y - s);
  g.fill();
  g.restore();
}

function rays(g, cx, cy, n, len, hex, { a = 0.35, a0 = 0, spread = TAU, width = 0.45 } = {}) {
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.fillStyle = rad(g, cx, cy, 0, len, [[0, rgba(hex, a)], [0.5, rgba(hex, a * 0.35)], [1, rgba(hex, 0)]]);
  for (let i = 0; i < n; i++) {
    const ang = a0 + (spread * (i + 0.5)) / n, dw = (spread / n) * width * 0.5;
    g.beginPath(); g.moveTo(cx, cy);
    g.lineTo(cx + Math.cos(ang - dw) * len, cy + Math.sin(ang - dw) * len);
    g.lineTo(cx + Math.cos(ang + dw) * len, cy + Math.sin(ang + dw) * len);
    g.closePath(); g.fill();
  }
  g.restore();
}

function palm(g, x, y, ht, { lean = 0.12, trunk = '#8b6a49', trunk2 = '#6f5238', leaf = '#4f9a45', leaf2 = '#3a7a37', seed = 5 } = {}) {
  const r = rng(seed);
  const tx = x + lean * ht, ty = y - ht, cx = x + lean * ht * 0.15, cy = y - ht * 0.55;
  const at = t => [(1 - t) * (1 - t) * x + 2 * (1 - t) * t * cx + t * t * tx, (1 - t) * (1 - t) * y + 2 * (1 - t) * t * cy + t * t * ty];
  g.save(); g.lineCap = 'round';
  const seg = 12;
  for (let i = 0; i < seg; i++) {
    const [x0, y0] = at(i / seg), [x1, y1] = at((i + 1) / seg);
    g.strokeStyle = i % 2 ? trunk : trunk2;
    g.lineWidth = ht * (0.075 - 0.035 * (i / seg));
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  }
  const fronds = 8;
  for (let k = 0; k < fronds; k++) {
    const ang = -Math.PI / 2 + (k - (fronds - 1) / 2) * 0.42 + (r() - 0.5) * 0.2;
    const len = ht * (0.42 + r() * 0.12);
    const ex = tx + Math.cos(ang) * len, ey = ty + Math.sin(ang) * len * 0.55 + len * 0.42;
    const mx = tx + Math.cos(ang) * len * 0.55, my = ty + Math.sin(ang) * len * 0.75 - len * 0.12;
    const nx = -(ey - ty), ny = ex - tx, nl = Math.hypot(nx, ny) || 1, wd = ht * 0.06;
    g.fillStyle = k % 2 ? leaf : leaf2;
    g.beginPath(); g.moveTo(tx, ty);
    g.quadraticCurveTo(mx + (nx / nl) * wd, my + (ny / nl) * wd, ex, ey);
    g.quadraticCurveTo(mx - (nx / nl) * wd * 0.4, my - (ny / nl) * wd * 0.4, tx, ty);
    g.fill();
  }
  g.fillStyle = trunk2; g.beginPath(); g.arc(tx, ty + ht * 0.02, ht * 0.035, 0, TAU); g.fill();
  g.restore();
}

function olive(g, x, y, ht, { trunk = '#7a5a3d', c1 = '#93b06e', c2 = '#6c8d50', c3 = '#c2d49c', seed = 7 } = {}) {
  const r = rng(seed);
  g.save(); g.lineCap = 'round';
  g.strokeStyle = trunk;
  for (const [ox, w0] of [[-0.05, 0.07], [0.04, 0.05]]) {
    g.lineWidth = ht * w0;
    g.beginPath(); g.moveTo(x + ox * ht, y);
    g.bezierCurveTo(x + (ox - 0.08) * ht, y - ht * 0.25, x + (ox + 0.1) * ht, y - ht * 0.35, x + (ox * 2) * ht, y - ht * 0.55);
    g.stroke();
  }
  const cx = x, cy = y - ht * 0.66, rx = ht * 0.48, ry = ht * 0.3;
  const blob = (col, n, sc, oy = 0) => {
    g.fillStyle = col;
    for (let i = 0; i < n; i++) {
      const a = r() * TAU, d = Math.sqrt(r());
      g.beginPath(); g.ellipse(cx + Math.cos(a) * rx * d * 0.85, cy + oy + Math.sin(a) * ry * d * 0.85, rx * sc * (0.6 + r() * 0.5), ry * sc * (0.5 + r() * 0.5), 0, 0, TAU); g.fill();
    }
  };
  blob(c2, 9, 0.42, ry * 0.12);
  blob(c1, 9, 0.36, -ry * 0.04);
  blob(c3, 6, 0.16, -ry * 0.22);
  g.restore();
}

function roundTree(g, x, y, ht, { trunk = '#7b5a3c', c1 = '#6cbd5a', c2 = '#4f9e48', hi = '#9ad67e', seed = 9 } = {}) {
  const r = rng(seed);
  g.fillStyle = trunk;
  g.beginPath(); g.moveTo(x - ht * 0.05, y); g.lineTo(x - ht * 0.03, y - ht * 0.5); g.lineTo(x + ht * 0.03, y - ht * 0.5); g.lineTo(x + ht * 0.05, y); g.closePath(); g.fill();
  const cy = y - ht * 0.64, R = ht * 0.3;
  const puffs = [[0, -0.2, 1], [-0.62, 0.15, 0.78], [0.62, 0.15, 0.78], [-0.3, 0.38, 0.72], [0.32, 0.4, 0.7]];
  g.fillStyle = c2;
  for (const [dx, dy, s] of puffs) { g.beginPath(); g.arc(x + dx * R, cy + dy * R + R * 0.08, R * s * (0.9 + r() * 0.2), 0, TAU); g.fill(); }
  g.fillStyle = c1;
  for (const [dx, dy, s] of puffs) { g.beginPath(); g.arc(x + dx * R - R * 0.06, cy + dy * R - R * 0.04, R * s * 0.86, 0, TAU); g.fill(); }
  g.fillStyle = rgba(hi, 0.8);
  g.beginPath(); g.arc(x - R * 0.3, cy - R * 0.38, R * 0.32, 0, TAU); g.fill();
}

function cypress(g, x, y, ht, col = '#3f7a4a', col2 = '#2f6340') {
  g.fillStyle = col2;
  g.beginPath(); g.moveTo(x, y - ht); g.bezierCurveTo(x + ht * 0.16, y - ht * 0.6, x + ht * 0.14, y - ht * 0.1, x, y); g.bezierCurveTo(x - ht * 0.14, y - ht * 0.1, x - ht * 0.16, y - ht * 0.6, x, y - ht); g.fill();
  g.fillStyle = col;
  g.beginPath(); g.moveTo(x - ht * 0.01, y - ht * 0.98); g.bezierCurveTo(x - ht * 0.15, y - ht * 0.6, x - ht * 0.12, y - ht * 0.1, x, y); g.lineTo(x, y - ht); g.fill();
}

function bush(g, x, y, s, { c1 = '#5fae53', c2 = '#4a9446', flowers = null, seed = 11 } = {}) {
  const r = rng(seed);
  g.fillStyle = c2;
  for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(x + (i - 2) * s * 0.42, y - s * (0.35 + r() * 0.2), s * (0.42 + r() * 0.15), 0, TAU); g.fill(); }
  g.fillStyle = c1;
  for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(x + (i - 1.5) * s * 0.42 - s * 0.05, y - s * (0.48 + r() * 0.2), s * (0.32 + r() * 0.1), 0, TAU); g.fill(); }
  if (flowers) for (let i = 0; i < 9; i++) flower(g, x + (r() - 0.5) * s * 1.9, y - s * (0.2 + r() * 0.7), s * 0.09, flowers[i % flowers.length]);
}
function flower(g, x, y, s, col, center = '#ffe066') {
  g.fillStyle = col;
  for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU; g.beginPath(); g.arc(x + Math.cos(a) * s, y + Math.sin(a) * s, s * 0.8, 0, TAU); g.fill(); }
  g.fillStyle = center; g.beginPath(); g.arc(x, y, s * 0.7, 0, TAU); g.fill();
}

function grass(g, x0, x1, base, ht, r, { cols = ['#5aa64a', '#6fbf58', '#4a8f3f'], lean = 0, step = 4, alpha = 1 } = {}) {
  g.save(); g.globalAlpha = alpha;
  for (let x = x0; x < x1; x += step * (0.5 + r())) {
    const hh = ht * (0.45 + r() * 0.65), l = (lean + (r() - 0.5) * 0.5) * hh, wd = step * (0.5 + r() * 0.5);
    g.fillStyle = cols[(r() * cols.length) | 0];
    g.beginPath(); g.moveTo(x - wd, base + 1); g.quadraticCurveTo(x + l * 0.3, base - hh * 0.6, x + l, base - hh); g.quadraticCurveTo(x + l * 0.2, base - hh * 0.4, x + wd, base + 1); g.fill();
  }
  g.restore();
}

function house(g, x, y, wd, ht, { wall = '#f7ecd6', side = '#e2cfac', roof = '#d9c299', door = '#8a5a3a', win = '#5a4a6a', lit = false, dome = null } = {}) {
  const d = wd * 0.28;
  g.fillStyle = side;
  g.beginPath(); g.moveTo(x + wd, y); g.lineTo(x + wd + d, y - d * 0.35); g.lineTo(x + wd + d, y - ht - d * 0.35); g.lineTo(x + wd, y - ht); g.closePath(); g.fill();
  g.fillStyle = roof;
  g.beginPath(); g.moveTo(x, y - ht); g.lineTo(x + wd, y - ht); g.lineTo(x + wd + d, y - ht - d * 0.35); g.lineTo(x + d, y - ht - d * 0.35); g.closePath(); g.fill();
  g.fillStyle = wall; g.fillRect(x, y - ht, wd, ht);
  g.fillStyle = rgba('#000000', 0.06); g.fillRect(x, y - ht * 0.12, wd, ht * 0.12);
  if (dome) {
    g.fillStyle = dome; g.beginPath(); g.ellipse(x + wd / 2 + d * 0.5, y - ht - d * 0.18, wd * 0.3, wd * 0.28, 0, Math.PI, TAU); g.fill();
  }
  const arch = (ax, ay, aw, ah, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax, ay - ah + aw / 2); g.arc(ax + aw / 2, ay - ah + aw / 2, aw / 2, Math.PI, TAU); g.lineTo(ax + aw, ay); g.closePath(); g.fill(); };
  if (wd > 10) {
    arch(x + wd * 0.38, y, wd * 0.24, ht * 0.45, door);
    const wc = lit ? '#ffd77a' : win;
    if (ht > wd * 0.7) arch(x + wd * 0.14, y - ht * 0.58, wd * 0.16, ht * 0.2, wc);
    arch(x + wd * 0.7, y - ht * 0.58, wd * 0.16, ht * 0.2, wc);
    if (lit) glow(g, x + wd * 0.78, y - ht * 0.48, wd * 0.5, '#ffcf66', 0.35, 'lighter');
  }
}

function waterBand(g, x0, y0, x1, y1, stops, r, { glints = 70, col = '#ffffff', a = 0.5 } = {}) {
  g.fillStyle = lin(g, 0, y0, 0, y1, stops);
  g.fillRect(x0, y0, x1 - x0, y1 - y0);
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < glints; i++) {
    const t = Math.pow(r(), 0.8), y = y0 + (y1 - y0) * t, len = (6 + r() * 26) * (0.4 + t * 1.6) * ((x1 - x0) / 700);
    const x = x0 + r() * (x1 - x0);
    g.strokeStyle = rgba(col, a * (0.3 + r() * 0.7) * (1 - t * 0.4));
    g.lineWidth = 1 + t * 2.2 * ((x1 - x0) / 900);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y); g.stroke();
  }
  g.restore();
}

function stones(g, x0, x1, y0, y1, n, r, cols = ['#cdb89a', '#b9a17f', '#e1d0b2']) {
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), s = (2 + r() * 6) * (1 + (y - y0) / Math.max(1, y1 - y0)) * ((x1 - x0) / 700);
    g.fillStyle = cols[i % cols.length];
    g.beginPath(); g.ellipse(x, y, s * 1.4, s * 0.8, 0, 0, TAU); g.fill();
    g.fillStyle = rgba('#ffffff', 0.25); g.beginPath(); g.ellipse(x - s * 0.3, y - s * 0.25, s * 0.6, s * 0.3, 0, 0, TAU); g.fill();
  }
}

function grain(g, w, h, r, a = 0.035) {
  const n = Math.round((w * h) / 520);
  for (let i = 0; i < n; i++) {
    g.fillStyle = i % 2 ? `rgba(255,255,255,${a})` : `rgba(60,30,20,${a})`;
    g.fillRect(r() * w, r() * h, 1.6, 1.6);
  }
}

function lamp(g, x, y0, y, s) {
  g.strokeStyle = rgba('#4a3220', 0.7); g.lineWidth = Math.max(1, s * 0.06);
  g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y - s * 0.4); g.stroke();
  glow(g, x, y - s * 0.55, s * 5.5, '#ffc95c', 0.5, 'lighter');
  g.fillStyle = '#8a5a32'; g.beginPath(); g.ellipse(x, y, s * 0.9, s * 0.38, 0, 0, Math.PI); g.fill();
  g.fillStyle = '#a8703e'; g.beginPath(); g.ellipse(x, y, s * 0.9, s * 0.2, 0, 0, TAU); g.fill();
  flame(g, x + s * 0.55, y - s * 0.2, s * 0.5);
}
function flame(g, x, y, s) {
  glow(g, x, y - s * 0.6, s * 3.2, '#ffd36b', 0.55, 'lighter');
  g.fillStyle = '#ffb02e';
  g.beginPath(); g.moveTo(x, y - s * 1.7); g.quadraticCurveTo(x + s * 0.75, y - s * 0.4, x, y); g.quadraticCurveTo(x - s * 0.75, y - s * 0.4, x, y - s * 1.7); g.fill();
  g.fillStyle = '#fff3b8';
  g.beginPath(); g.moveTo(x, y - s * 1.1); g.quadraticCurveTo(x + s * 0.35, y - s * 0.25, x, y - s * 0.05); g.quadraticCurveTo(x - s * 0.35, y - s * 0.25, x, y - s * 1.1); g.fill();
}
function candle(g, x, y, ht, wd) {
  g.fillStyle = lin(g, x - wd / 2, 0, x + wd / 2, 0, [[0, '#e9e1d0'], [0.4, '#fffdf6'], [1, '#d8cdb8']]);
  g.fillRect(x - wd / 2, y - ht, wd, ht);
  g.fillStyle = '#c9a24a'; g.fillRect(x - wd * 0.9, y - wd * 0.3, wd * 1.8, wd * 0.5);
  flame(g, x, y - ht - 1, wd * 0.55);
}
function archPath(g, x, y, wd, ht) {
  g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - ht + wd / 2); g.arc(x + wd / 2, y - ht + wd / 2, wd / 2, Math.PI, TAU); g.lineTo(x + wd, y); g.closePath();
}
function column(g, x, y0, y1, wd, { base = '#e9d9b8', light = '#fbf3df', dark = '#c4a97c' } = {}) {
  g.fillStyle = lin(g, x - wd / 2, 0, x + wd / 2, 0, [[0, dark], [0.3, light], [0.55, base], [1, dark]]);
  g.fillRect(x - wd / 2, y0, wd, y1 - y0);
  g.fillStyle = rgba('#000000', 0.06);
  for (let k = -1; k <= 1; k++) g.fillRect(x + k * wd * 0.26 - 0.5, y0, 1.2, y1 - y0);
  g.fillStyle = dark; g.fillRect(x - wd * 0.7, y0 - wd * 0.22, wd * 1.4, wd * 0.24);
  g.fillStyle = light; g.fillRect(x - wd * 0.62, y0 - wd * 0.3, wd * 1.24, wd * 0.1);
  g.fillStyle = dark; g.fillRect(x - wd * 0.66, y1 - wd * 0.1, wd * 1.32, wd * 0.22);
}
// Suelo en perspectiva (baldosas que se juntan en el punto de fuga).
function tiles(g, w, h, y0, { c1, c2, vx = w / 2, lines = 14, rows = 7, a = 0.16 }) {
  g.fillStyle = lin(g, 0, y0, 0, h, [[0, c1], [1, c2]]);
  g.fillRect(0, y0, w, h - y0);
  g.save();
  g.beginPath(); g.rect(0, y0, w, h - y0); g.clip();
  g.strokeStyle = rgba('#5a3a20', a); g.lineWidth = Math.max(1, w / 700);
  const vy = y0 - (h - y0) * 1.6;
  for (let i = -lines; i <= lines; i++) { const bx = vx + (i / lines) * w * 1.6; g.beginPath(); g.moveTo(vx + (bx - vx) * ((y0 - vy) / (h - vy)), y0); g.lineTo(bx, h); g.stroke(); }
  for (let j = 1; j <= rows; j++) { const t = Math.pow(j / rows, 1.8); const y = y0 + (h - y0) * t; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.restore();
  g.fillStyle = lin(g, 0, y0, 0, y0 + (h - y0) * 0.4, [[0, rgba('#3a2010', 0.18)], [1, rgba('#3a2010', 0)]]);
  g.fillRect(0, y0, w, (h - y0) * 0.4);
}

// ───────────────────────── Los fondos ─────────────────────────
// Cada fondo pinta `back` (todo el cuadro) y, si quiere, `front` (primer plano transparente: pasto, flores, ramas).
// Medidas relativas: w × h del lienzo; H = horizonte. Los emojis «de suelo» se apoyan cerca del 90 % de la altura.

const PAINT = {
  cielo: {
    back(g, w, h, r, o) {
      fillSky(g, w, h, [[0, '#3fa2ea'], [0.42, '#8fd0fa'], [0.6, '#d8f1ff'], [0.66, '#eefaff']]);
      if (o.orb) sun(g, w * 0.83, h * 0.17, h * 0.07);
      cloud(g, w * 0.2, h * 0.2, h * 0.11, { seed: 1, alpha: 0.95 });
      cloud(g, w * 0.58, h * 0.13, h * 0.07, { seed: 2, alpha: 0.85 });
      cloud(g, w * 0.42, h * 0.36, h * 0.05, { seed: 3, alpha: 0.6 });
      ridge(g, w, h, { y: h * 0.6, amp: h * 0.05, seed: 11, fill: [[0, '#a9d9c6'], [1, '#c8ead8']] });
      const mid = ridge(g, w, h, { y: h * 0.67, amp: h * 0.05, seed: 12, fill: [[0, '#8fcf72'], [1, '#79bd5f']], rim: rgba('#d8f7b8', 0.7), rimW: h * 0.006 });
      for (let i = 0; i < 6; i++) { const x = w * (0.08 + i * 0.17 + r() * 0.06); roundTree(g, x, mid(x) + h * 0.02, h * (0.08 + r() * 0.04), { seed: 20 + i }); }
      ridge(g, w, h, { y: h * 0.78, amp: h * 0.03, seed: 13, fill: [[0, '#7ccb62'], [1, '#55a845']] });
      for (let i = 0; i < 26; i++) flower(g, r() * w, h * (0.82 + r() * 0.16), h * 0.008 * (1 + r()), ['#ffffff', '#ffd84a', '#ff9db5'][i % 3]);
    },
    front(g, w, h, r) { grass(g, -5, w + 5, h, h * 0.07, r, { step: w / 180 }); },
  },

  campo: {
    back(g, w, h, r, o) {
      fillSky(g, w, h, [[0, '#54b4f2'], [0.45, '#a6dcfb'], [0.6, '#e4f6ff']]);
      if (o.orb) sun(g, w * 0.14, h * 0.16, h * 0.06);
      cloud(g, w * 0.55, h * 0.18, h * 0.09, { seed: 4 });
      cloud(g, w * 0.86, h * 0.28, h * 0.06, { seed: 5, alpha: 0.8 });
      ridge(g, w, h, { y: h * 0.52, amp: h * 0.06, seed: 21, n: 4, fill: [[0, '#a9c7dc'], [1, '#c9def0']] });
      const vill = ridge(g, w, h, { y: h * 0.6, amp: h * 0.05, seed: 22, fill: [[0, '#a8d48a'], [1, '#93c776']] });
      // aldea blanca sobre la colina
      for (let i = 0; i < 9; i++) {
        const x = w * (0.16 + i * 0.026 + r() * 0.01), hh = h * (0.035 + r() * 0.025);
        house(g, x, vill(x) + h * 0.012, hh * (1 + r() * 0.5), hh, { wall: i % 3 ? '#fbf3e2' : '#f3e3c4', side: '#dccaa6' });
      }
      cypress(g, w * 0.4, vill(w * 0.4) + h * 0.01, h * 0.09);
      cypress(g, w * 0.43, vill(w * 0.43) + h * 0.01, h * 0.07);
      // campos de trigo y verdes en franjas
      const field = ridge(g, w, h, { y: h * 0.68, amp: h * 0.03, seed: 23, fill: [[0, '#e9cf6c'], [1, '#d9b54f']] });
      g.save();
      g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += w / 60) g.lineTo(x, field(x)); g.lineTo(w, h); g.closePath(); g.clip();
      for (let k = 0; k < 6; k++) {
        const y = h * (0.7 + k * 0.035);
        g.fillStyle = k % 2 ? rgba('#8cc76a', 0.9) : rgba('#f0d878', 0.5);
        g.beginPath(); g.moveTo(0, y + h * 0.02); g.bezierCurveTo(w * 0.3, y - h * 0.02, w * 0.7, y + h * 0.03, w, y); g.lineTo(w, y + h * 0.018); g.bezierCurveTo(w * 0.7, y + h * 0.05, w * 0.3, y, 0, y + h * 0.04); g.fill();
      }
      g.restore();
      olive(g, w * 0.82, field(w * 0.82) + h * 0.03, h * 0.17, { seed: 31 });
      ridge(g, w, h, { y: h * 0.84, amp: h * 0.025, seed: 24, fill: [[0, '#86cc68'], [1, '#5eab4b']] });
      for (let i = 0; i < 18; i++) flower(g, r() * w, h * (0.87 + r() * 0.12), h * 0.007 * (1 + r()), ['#ffffff', '#ffd84a'][i % 2]);
    },
    front(g, w, h, r) {
      grass(g, -5, w + 5, h, h * 0.065, r, { step: w / 170 });
      grass(g, -5, w * 0.14, h, h * 0.16, r, { step: w / 260, cols: ['#e1c25a', '#d2ad42', '#efd679'], lean: 0.25 });
      grass(g, w * 0.88, w + 5, h, h * 0.15, r, { step: w / 260, cols: ['#e1c25a', '#d2ad42', '#efd679'], lean: -0.25 });
    },
  },

  jardin: {
    back(g, w, h, r, o) {
      fillSky(g, w, h, [[0, '#8fd6ff'], [0.4, '#c7ecff'], [0.58, '#f2fce9']]);
      if (o.orb) sun(g, w * 0.7, h * 0.12, h * 0.05, { halo: '#fff7d0' });
      cloud(g, w * 0.3, h * 0.14, h * 0.07, { seed: 6, alpha: 0.9 });
      // muro de árboles al fondo
      const back = ridge(g, w, h, { y: h * 0.5, amp: h * 0.04, seed: 41, fill: [[0, '#8cc98a'], [1, '#78b876']] });
      for (let i = 0; i < 26; i++) { const x = w * (i / 25) + (r() - 0.5) * w * 0.03, R = h * (0.035 + r() * 0.06); g.fillStyle = ['#7dbd7b', '#6aae6c', '#86c483', '#5f9f63'][i % 4]; g.beginPath(); g.arc(x, back(x) + h * 0.03 - R * 0.3, R, 0, TAU); g.fill(); g.fillStyle = rgba('#c9ecb0', 0.35); g.beginPath(); g.arc(x - R * 0.3, back(x) + h * 0.03 - R * 0.75, R * 0.35, 0, TAU); g.fill(); }
      cypress(g, w * 0.3, back(w * 0.3) + h * 0.06, h * 0.2, '#4f8f5a', '#3d7a4b');
      cypress(g, w * 0.68, back(w * 0.68) + h * 0.06, h * 0.17, '#4f8f5a', '#3d7a4b');
      ridge(g, w, h, { y: h * 0.6, amp: h * 0.02, seed: 42, fill: [[0, '#86cf72'], [1, '#6dbb5e']] });
      for (let i = 0; i < 5; i++) bush(g, w * (0.1 + i * 0.2 + r() * 0.05), h * (0.64 + r() * 0.02), h * 0.06, { flowers: ['#ff9db5', '#ffd84a', '#ffffff', '#c59bff'], seed: 50 + i });
      olive(g, w * 0.1, h * 0.8, h * 0.42, { seed: 61 });
      olive(g, w * 0.9, h * 0.78, h * 0.38, { seed: 62 });
      // césped y senderito de piedras
      ridge(g, w, h, { y: h * 0.72, amp: h * 0.015, seed: 43, fill: [[0, '#7fcf6c'], [1, '#56aa4e']] });
      g.fillStyle = lin(g, 0, h * 0.72, 0, h, [[0, '#efe3c6'], [1, '#e2cfa4']]);
      g.beginPath(); g.moveTo(w * 0.47, h * 0.72); g.bezierCurveTo(w * 0.56, h * 0.8, w * 0.36, h * 0.88, w * 0.42, h); g.lineTo(w * 0.66, h); g.bezierCurveTo(w * 0.56, h * 0.88, w * 0.64, h * 0.8, w * 0.53, h * 0.72); g.closePath(); g.fill();
      stones(g, w * 0.42, w * 0.62, h * 0.8, h * 0.98, 10, r, ['#d8c7a4', '#cbb68f']);
      for (let i = 0; i < 30; i++) flower(g, r() * w, h * (0.76 + r() * 0.22), h * 0.008 * (1 + r()), ['#ff9db5', '#ffffff', '#ffd84a', '#c59bff'][i % 4]);
    },
    front(g, w, h, r) {
      grass(g, -5, w + 5, h, h * 0.06, r, { step: w / 170 });
      // ramitas que asoman por arriba
      for (const [x0, dir] of [[-w * 0.02, 1], [w * 1.02, -1]]) {
        g.strokeStyle = '#6b4c33'; g.lineWidth = h * 0.012; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x0, h * 0.02); g.quadraticCurveTo(x0 + dir * w * 0.08, h * 0.03, x0 + dir * w * 0.15, h * 0.09); g.stroke();
        for (let i = 0; i < 12; i++) {
          const t = i / 11, x = x0 + dir * w * 0.15 * t, y = h * (0.02 + 0.07 * t * t) + (r() - 0.5) * h * 0.03;
          g.fillStyle = i % 2 ? '#7cbf5f' : '#5ea24e';
          g.beginPath(); g.ellipse(x, y + h * 0.015, h * 0.028, h * 0.012, dir * (0.6 + r()), 0, TAU); g.fill();
        }
        flower(g, x0 + dir * w * 0.1, h * 0.07, h * 0.012, '#ffffff');
      }
    },
  },

  noche: {
    back(g, w, h, r, o) {
      fillSky(g, w, h, [[0, '#0b1036'], [0.45, '#232a6b'], [0.62, '#4a3f8a'], [0.7, '#6a4f96']]);
      // vía láctea tenue
      g.save(); g.translate(w * 0.5, h * 0.3); g.rotate(-0.35);
      g.fillStyle = rad(g, 0, 0, 0, w * 0.6, [[0, 'rgba(200,190,255,0.16)'], [1, 'rgba(200,190,255,0)']]);
      g.scale(1, 0.18); g.beginPath(); g.arc(0, 0, w * 0.6, 0, TAU); g.fill();
      g.restore();
      stars(g, w, h, Math.round(w / 4), r, { maxY: 0.62, big: 9 });
      // luna creciente
      const mx = w * 0.16, my = h * 0.18, mr = h * 0.06;
      glow(g, mx, my, mr * 5, '#cfd8ff', o.orb ? 0.35 : 0.2);
      if (o.orb) {
        g.save(); g.beginPath(); g.arc(mx, my, mr, 0, TAU); g.clip();
        g.beginPath(); g.arc(mx, my, mr, 0, TAU); g.arc(mx + mr * 0.45, my - mr * 0.2, mr * 0.88, 0, TAU);
        g.fillStyle = '#fff6cf'; g.fill('evenodd'); g.restore();
      }
      ridge(g, w, h, { y: h * 0.62, amp: h * 0.05, seed: 51, fill: [[0, '#34367a'], [1, '#2b2d6c']], rim: rgba('#8f86d8', 0.35), rimW: h * 0.005 });
      // Belén: casitas con ventanas encendidas
      const town = ridge(g, w, h, { y: h * 0.7, amp: h * 0.04, seed: 52, fill: [[0, '#272c66'], [1, '#1e2250']], rim: rgba('#a59ae6', 0.3), rimW: h * 0.004 });
      for (let i = 0; i < 9; i++) {
        const x = w * (0.5 + i * 0.05 + r() * 0.012), hh = h * (0.06 + r() * 0.045);
        house(g, x, town(x) + h * 0.02, hh * (1 + r() * 0.4), hh, { wall: '#3d4588', side: '#323a76', roof: '#4a5399', door: '#1f2450', win: '#262c5e', lit: r() > 0.2, dome: i === 4 ? '#4a5399' : null });
      }
      palm(g, w * 0.44, town(w * 0.44) + h * 0.02, h * 0.16, { trunk: '#2a2c5c', trunk2: '#23264f', leaf: '#2a3a62', leaf2: '#223156', seed: 3 });
      ridge(g, w, h, { y: h * 0.82, amp: h * 0.03, seed: 53, fill: [[0, '#1d2350'], [1, '#141838']] });
      for (let i = 0; i < 6; i++) glow(g, r() * w, h * (0.74 + r() * 0.18), h * 0.014, '#f4ff8a', 0.8, 'lighter');
    },
    front(g, w, h, r) { grass(g, -5, w + 5, h, h * 0.07, r, { step: w / 170, cols: ['#1a1f45', '#232a58', '#151a3a'] }); },
  },

  desierto: {
    back(g, w, h, r, o) {
      fillSky(g, w, h, [[0, '#f2a865'], [0.35, '#fbcf8e'], [0.56, '#ffe8bd'], [0.62, '#fff3d6']]);
      if (o.orb) sun(g, w * 0.76, h * 0.24, h * 0.08, { core: '#fffaf0', rim: '#ffe7b0', halo: '#fff0c4', haloR: 5 });
      // mesetas lejanas
      g.fillStyle = rgba('#d9a57a', 0.55);
      g.beginPath(); g.moveTo(w * 0.02, h * 0.6); g.lineTo(w * 0.06, h * 0.5); g.lineTo(w * 0.22, h * 0.49); g.lineTo(w * 0.27, h * 0.6); g.fill();
      g.beginPath(); g.moveTo(w * 0.55, h * 0.6); g.lineTo(w * 0.6, h * 0.53); g.lineTo(w * 0.7, h * 0.52); g.lineTo(w * 0.74, h * 0.6); g.fill();
      ridge(g, w, h, { y: h * 0.6, amp: h * 0.03, seed: 61, fill: [[0, '#efc48e'], [1, '#ebbd82']] });
      const mid = ridge(g, w, h, { y: h * 0.68, amp: h * 0.05, seed: 62, fill: [[0, '#f3c483'], [1, '#e3a964']], rim: rgba('#fff0c8', 0.7), rimW: h * 0.006 });
      // oasis
      for (const [x, s, sd] of [[0.86, 0.17, 1], [0.92, 0.13, 2], [0.81, 0.11, 3]]) palm(g, w * x, mid(w * x) + h * 0.03, h * s, { seed: sd, lean: sd === 2 ? -0.15 : 0.12 });
      g.fillStyle = rgba('#58b6d8', 0.85); g.beginPath(); g.ellipse(w * 0.86, mid(w * 0.86) + h * 0.035, w * 0.07, h * 0.012, 0, 0, TAU); g.fill();
      const near = ridge(g, w, h, { y: h * 0.8, amp: h * 0.04, seed: 63, fill: [[0, '#ecb874'], [1, '#d49650']] });
      // ondas de arena
      g.strokeStyle = rgba('#b87a3c', 0.28); g.lineWidth = Math.max(1, h * 0.004);
      for (let k = 0; k < 9; k++) { const y0 = h * (0.84 + k * 0.018); g.beginPath(); for (let x = 0; x <= w; x += w / 40) g.lineTo(x, Math.max(near(x) + h * 0.01, y0 + Math.sin(x / w * 9 + k) * h * 0.006)); g.stroke(); }
      stones(g, 0, w, h * 0.84, h * 0.98, 8, r, ['#c8945a', '#b8864f', '#deb07a']);
    },
    front(g, w, h, r) {
      g.fillStyle = lin(g, 0, h * 0.9, 0, h, [[0, '#e3a962'], [1, '#c98a45']]);
      g.beginPath(); g.moveTo(-2, h); g.quadraticCurveTo(w * 0.06, h * 0.9, w * 0.18, h + 2); g.fill();
      g.beginPath(); g.moveTo(w * 0.8, h + 2); g.quadraticCurveTo(w * 0.94, h * 0.91, w + 2, h); g.fill();
      grass(g, w * 0.02, w * 0.12, h * 0.96, h * 0.07, r, { step: w / 300, cols: ['#a3a05a', '#8d8a46', '#bdb46a'] });
      grass(g, w * 0.88, w * 0.97, h * 0.97, h * 0.06, r, { step: w / 300, cols: ['#a3a05a', '#8d8a46', '#bdb46a'] });
    },
  },

  mar: {
    back(g, w, h, r, o) {
      fillSky(g, w, h, [[0, '#4cb0f0'], [0.35, '#9ad8fb'], [0.5, '#e4f7ff']]);
      cloud(g, w * 0.24, h * 0.16, h * 0.08, { seed: 7 });
      cloud(g, w * 0.7, h * 0.24, h * 0.06, { seed: 8, alpha: 0.85 });
      if (o.orb) sun(g, w * 0.88, h * 0.1, h * 0.05);
      ridge(g, w, h, { y: h * 0.47, amp: h * 0.045, seed: 71, n: 4, fill: [[0, '#9fbfce'], [1, '#b8d3df']] });
      ridge(g, w, h, { y: h * 0.505, amp: h * 0.015, seed: 72, fill: '#a7c9b8' });
      waterBand(g, 0, h * 0.5, w, h * 0.82, [[0, '#8ad3f0'], [0.35, '#52b0e4'], [1, '#2b84c8']], r, { glints: Math.round(w / 9) });
      // velita lejana
      const bx = w * 0.62, by = h * 0.555, bs = h * 0.035;
      g.fillStyle = '#6a4a30'; g.beginPath(); g.moveTo(bx - bs, by); g.lineTo(bx + bs, by); g.lineTo(bx + bs * 0.7, by + bs * 0.35); g.lineTo(bx - bs * 0.7, by + bs * 0.35); g.fill();
      g.fillStyle = '#fff8ea'; g.beginPath(); g.moveTo(bx, by - bs * 1.4); g.lineTo(bx, by - bs * 0.05); g.lineTo(bx + bs * 0.9, by - bs * 0.05); g.fill();
      // orilla
      g.fillStyle = rgba('#ffffff', 0.75);
      g.beginPath(); g.moveTo(0, h * 0.82); for (let x = 0; x <= w; x += w / 50) g.lineTo(x, h * 0.8 + Math.sin(x / w * 14) * h * 0.008 + (x / w) * h * 0.02); g.lineTo(w, h * 0.86); g.lineTo(0, h * 0.86); g.fill();
      g.fillStyle = lin(g, 0, h * 0.82, 0, h, [[0, '#f3dfb2'], [1, '#e3c48c']]);
      g.beginPath(); g.moveTo(0, h * 0.835); for (let x = 0; x <= w; x += w / 50) g.lineTo(x, h * 0.82 + Math.sin(x / w * 14 + 1) * h * 0.008 + (x / w) * h * 0.022); g.lineTo(w, h); g.lineTo(0, h); g.fill();
      stones(g, 0, w, h * 0.87, h * 0.98, 12, r, ['#e7d2a6', '#d6bb88', '#f7ead0']);
    },
    front(g, w, h, r) {
      grass(g, -5, w * 0.1, h, h * 0.12, r, { step: w / 260, cols: ['#86b05a', '#6f9a49', '#a2c46e'], lean: 0.2 });
      grass(g, w * 0.9, w + 5, h, h * 0.1, r, { step: w / 260, cols: ['#86b05a', '#6f9a49', '#a2c46e'], lean: -0.2 });
    },
  },

  tormenta: {
    back(g, w, h, r, o) {
      fillSky(g, w, h, [[0, '#262d48'], [0.4, '#434d6c'], [0.58, '#66718f']]);
      for (let i = 0; i < 6; i++) cloud(g, w * (i / 5) + (r() - 0.5) * w * 0.1, h * (0.02 + r() * 0.08), h * (0.2 + r() * 0.08), { light: '#4f5875', shade: '#30374f', seed: 80 + i });
      for (let i = 0; i < 5; i++) cloud(g, w * (0.1 + i * 0.22) + (r() - 0.5) * w * 0.06, h * (0.22 + r() * 0.06), h * (0.15 + r() * 0.05), { light: '#6f7896', shade: '#414a66', seed: 90 + i, alpha: 0.95 });
      glow(g, w * 0.7, h * 0.2, h * 0.3, '#c9d4ff', 0.18, 'lighter');
      // lluvia lejana
      g.strokeStyle = rgba('#c8d2ea', 0.18); g.lineWidth = Math.max(1, w / 900);
      for (let i = 0; i < w / 5; i++) { const x = r() * w, y = r() * h * 0.7, l = h * (0.03 + r() * 0.05); g.beginPath(); g.moveTo(x, y); g.lineTo(x - l * 0.25, y + l); g.stroke(); }
      ridge(g, w, h, { y: h * 0.56, amp: h * 0.03, seed: 91, fill: '#4b5572' });
      waterBand(g, 0, h * 0.58, w, h * 0.76, [[0, '#56627e'], [1, '#3c4762']], r, { glints: Math.round(w / 14), col: '#dfe6f6', a: 0.35 });
      // crestas de olas
      g.strokeStyle = rgba('#e6ecf8', 0.6); g.lineCap = 'round';
      for (let i = 0; i < 22; i++) { const t = r(), x = r() * w, y = h * (0.6 + t * 0.15), s = h * (0.012 + t * 0.02); g.lineWidth = Math.max(1, h * (0.003 + t * 0.004)); g.beginPath(); g.arc(x, y + s * 2, s * 2.6, Math.PI * 1.32, Math.PI * 1.68); g.stroke(); }
      const near = ridge(g, w, h, { y: h * 0.8, amp: h * 0.04, seed: 92, fill: [[0, '#4d566b'], [1, '#2f3547']], rim: rgba('#8a94ad', 0.5), rimW: h * 0.006 });
      // rocas
      for (let i = 0; i < 5; i++) {
        const x = w * (0.06 + i * 0.22 + r() * 0.05), y = near(x) + h * 0.05, s = h * (0.05 + r() * 0.04);
        g.fillStyle = '#3a4152'; g.beginPath(); g.moveTo(x - s * 1.5, y); g.quadraticCurveTo(x - s * 1.3, y - s * 1.1, x - s * 0.2, y - s * 1.15); g.quadraticCurveTo(x + s * 1.2, y - s * 1.0, x + s * 1.4, y); g.closePath(); g.fill();
        g.fillStyle = rgba('#9aa4bd', 0.3); g.beginPath(); g.ellipse(x - s * 0.4, y - s * 0.85, s * 0.6, s * 0.18, -0.15, 0, TAU); g.fill();
      }
    },
    front(g, w, h, r) { grass(g, -5, w + 5, h, h * 0.07, r, { step: w / 170, cols: ['#2b3242', '#384055', '#232838'], lean: 0.45 }); },
  },

  dorado: {
    back(g, w, h, r, o) {
      g.fillStyle = rad(g, w * 0.5, h * 0.4, 0, Math.max(w, h) * 0.8, [[0, '#fffdf2'], [0.18, '#fff1bf'], [0.45, '#fbd77a'], [0.8, '#efb448'], [1, '#e39d32']]);
      g.fillRect(0, 0, w, h);
      rays(g, w * 0.5, h * 0.4, 22, Math.max(w, h) * 0.9, '#ffffff', { a: 0.28, width: 0.5 });
      glow(g, w * 0.5, h * 0.4, h * 0.4, '#ffffff', 0.7);
      for (let i = 0; i < 26; i++) sparkle(g, r() * w, r() * h * 0.7, h * (0.008 + r() * 0.014), '#ffffff', 0.7 + r() * 0.3);
      // suelo de nubes doradas
      for (let i = 0; i < 9; i++) cloud(g, w * (i / 8), h * (0.86 + r() * 0.04), h * (0.13 + r() * 0.05), { light: '#fff7de', shade: '#f1cf86', seed: 100 + i });
      for (let i = 0; i < 6; i++) cloud(g, w * (0.1 + i * 0.18), h * (0.97 + r() * 0.03), h * (0.12 + r() * 0.05), { light: '#fffaf0', shade: '#f5dca0', seed: 110 + i });
    },
    front(g, w, h, r) {
      cloud(g, w * 0.02, h * 0.99, h * 0.14, { light: '#fffaf0', shade: '#f2d28c', seed: 120 });
      cloud(g, w * 0.98, h * 1.0, h * 0.13, { light: '#fffaf0', shade: '#f2d28c', seed: 121 });
    },
  },

  amanecer: {
    back(g, w, h, r, o) {
      fillSky(g, w, h, [[0, '#5e6cc4'], [0.22, '#b58bc6'], [0.4, '#f59fa6'], [0.54, '#ffc68a'], [0.64, '#ffe7a8']]);
      const sx = w * 0.5, sy = h * 0.62;
      glow(g, sx, sy, h * 0.7, '#ffd98a', 0.65);
      rays(g, sx, sy, 16, h * 0.95, '#fff2c4', { a: 0.22, a0: Math.PI, spread: Math.PI, width: 0.5 });
      if (o.orb) { g.fillStyle = rad(g, sx, sy, 0, h * 0.1, [[0, '#fffdf0'], [0.8, '#fff2b8'], [1, '#ffd36b']]); g.beginPath(); g.arc(sx, sy, h * 0.1, 0, TAU); g.fill(); }
      for (let i = 0; i < 5; i++) cloud(g, w * (0.1 + i * 0.2 + r() * 0.05), h * (0.18 + r() * 0.18), h * (0.05 + r() * 0.04), { light: '#ffd2b8', shade: '#e48a9a', seed: 130 + i, alpha: 0.9 });
      ridge(g, w, h, { y: h * 0.63, amp: h * 0.045, seed: 131, fill: [[0, '#c9a1be'], [1, '#d7b4c2']] });
      ridge(g, w, h, { y: h * 0.69, amp: h * 0.04, seed: 132, fill: [[0, '#a4c086'], [1, '#8cb575']], rim: rgba('#ffe7a8', 0.8), rimW: h * 0.007 });
      const near = ridge(g, w, h, { y: h * 0.79, amp: h * 0.03, seed: 133, fill: [[0, '#8fc873'], [1, '#62a856']] });
      roundTree(g, w * 0.14, near(w * 0.14) + h * 0.02, h * 0.18, { c1: '#79b85f', c2: '#5d9a4e', hi: '#ffe0a0', seed: 134 });
      for (let i = 0; i < 24; i++) flower(g, r() * w, h * (0.83 + r() * 0.15), h * 0.009 * (1 + r()), ['#ff8fb0', '#ffffff', '#ffd84a', '#ff6f8a'][i % 4]);
    },
    front(g, w, h, r) {
      grass(g, -5, w + 5, h, h * 0.065, r, { step: w / 170 });
      for (let i = 0; i < 6; i++) { const x = (i < 3 ? w * 0.03 : w * 0.85) + r() * w * 0.12, y = h * (0.93 + r() * 0.04); g.strokeStyle = '#4f9a45'; g.lineWidth = h * 0.006; g.beginPath(); g.moveTo(x, h); g.lineTo(x, y); g.stroke(); g.fillStyle = ['#ff6f8a', '#ffd84a', '#ff9db5'][i % 3]; g.beginPath(); g.moveTo(x - h * 0.018, y); g.lineTo(x - h * 0.02, y - h * 0.035); g.lineTo(x - h * 0.006, y - h * 0.022); g.lineTo(x, y - h * 0.04); g.lineTo(x + h * 0.006, y - h * 0.022); g.lineTo(x + h * 0.02, y - h * 0.035); g.lineTo(x + h * 0.018, y); g.closePath(); g.fill(); }
    },
  },

  templo: {
    back(g, w, h, r, o) {
      g.fillStyle = lin(g, 0, 0, 0, h * 0.66, [[0, '#d9c29a'], [1, '#ecdcbc']]);
      g.fillRect(0, 0, w, h);
      // cornisa
      g.fillStyle = '#c9ad80'; g.fillRect(0, h * 0.05, w, h * 0.04);
      g.fillStyle = '#f3e6cc'; g.fillRect(0, h * 0.09, w, h * 0.012);
      for (let x = 0; x < w; x += w / 40) { g.fillStyle = rgba('#8a6a40', 0.25); g.fillRect(x, h * 0.055, w / 90, h * 0.03); }
      // tres arcos con luz
      for (const cx of [0.2, 0.5, 0.8]) {
        const aw = w * 0.15, ax = w * cx - aw / 2;
        archPath(g, ax - w * 0.012, h * 0.62, aw + w * 0.024, h * 0.47); g.fillStyle = '#c4a77a'; g.fill();
        archPath(g, ax, h * 0.62, aw, h * 0.45); g.fillStyle = lin(g, 0, h * 0.17, 0, h * 0.62, [[0, '#fff8e4'], [1, '#ffe3a8']]); g.fill();
        glow(g, w * cx, h * 0.35, h * 0.32, '#fff3c8', 0.55, 'lighter');
        g.fillStyle = rgba('#e6c98d', 0.6); g.fillRect(ax, h * 0.58, aw, h * 0.04);
      }
      for (const cx of [0.05, 0.35, 0.65, 0.95]) column(g, w * cx, h * 0.14, h * 0.66, w * 0.055);
      tiles(g, w, h, h * 0.66, { c1: '#dcc08f', c2: '#c8a670', a: 0.18 });
      // rayos de luz que bajan de los arcos
      g.save(); g.globalCompositeOperation = 'lighter';
      for (const cx of [0.2, 0.5, 0.8]) {
        g.fillStyle = lin(g, 0, h * 0.3, 0, h, [[0, 'rgba(255,244,205,0.32)'], [1, 'rgba(255,244,205,0)']]);
        g.beginPath(); g.moveTo(w * (cx - 0.07), h * 0.3); g.lineTo(w * (cx + 0.07), h * 0.3); g.lineTo(w * (cx + 0.2), h); g.lineTo(w * (cx - 0.0), h); g.closePath(); g.fill();
      }
      g.restore();
      lamp(g, w * 0.35, 0, h * 0.24, h * 0.03);
      lamp(g, w * 0.65, 0, h * 0.24, h * 0.03);
    },
  },

  iglesia: {
    back(g, w, h, r, o) {
      g.fillStyle = lin(g, 0, 0, 0, h * 0.66, [[0, '#ead9bd'], [1, '#f6ead4']]);
      g.fillRect(0, 0, w, h);
      // vitrales a los lados
      const glass = (x, y, ww, hh) => {
        archPath(g, x - ww * 0.12, y, ww * 1.24, hh * 1.06); g.fillStyle = '#b89462'; g.fill();
        g.save(); archPath(g, x, y, ww, hh); g.clip();
        const cols = ['#4f7fd9', '#e25d5d', '#f2c14e', '#5fb36a', '#9b6fd6', '#58b8d8'];
        const cw = ww / 3, ch = hh / 6;
        for (let i = 0; i < 3; i++) for (let j = 0; j < 7; j++) { g.fillStyle = cols[(i * 7 + j * 2 + (i === 1 ? 3 : 0)) % cols.length]; g.fillRect(x + i * cw, y - hh + j * ch, cw + 1, ch + 1); }
        g.strokeStyle = '#3a2a1a'; g.lineWidth = Math.max(1, ww * 0.04);
        for (let i = 1; i < 3; i++) { g.beginPath(); g.moveTo(x + i * cw, y - hh); g.lineTo(x + i * cw, y); g.stroke(); }
        for (let j = 1; j < 7; j++) { g.beginPath(); g.moveTo(x, y - hh + j * ch); g.lineTo(x + ww, y - hh + j * ch); g.stroke(); }
        g.restore();
        glow(g, x + ww / 2, y - hh * 0.5, hh * 0.9, '#fff3d0', 0.35, 'lighter');
      };
      glass(w * 0.08, h * 0.52, w * 0.08, h * 0.36);
      glass(w * 0.84, h * 0.52, w * 0.08, h * 0.36);
      // ábside con la cruz
      archPath(g, w * 0.27, h * 0.6, w * 0.46, h * 0.58); g.fillStyle = '#c9a46a'; g.fill();
      archPath(g, w * 0.29, h * 0.6, w * 0.42, h * 0.55); g.fillStyle = lin(g, 0, h * 0.05, 0, h * 0.6, [[0, '#f9eed6'], [1, '#e7d2ab']]); g.fill();
      glow(g, w * 0.5, h * 0.27, h * 0.34, '#fff6d6', 0.9);
      rays(g, w * 0.5, h * 0.27, 14, h * 0.4, '#fff4c4', { a: 0.4, width: 0.4 });
      const cx = w * 0.5, cy = h * 0.27, cw = h * 0.035;
      g.fillStyle = lin(g, cx - cw, 0, cx + cw, 0, [[0, '#a06a2c'], [0.5, '#e8b85a'], [1, '#a06a2c']]);
      g.fillRect(cx - cw / 2, cy - h * 0.15, cw, h * 0.3);
      g.fillRect(cx - h * 0.09, cy - h * 0.09, h * 0.18, cw);
      // altar
      const ay = h * 0.6;
      g.fillStyle = '#d9c39b'; g.fillRect(w * 0.26, ay + h * 0.04, w * 0.48, h * 0.035);
      g.fillStyle = '#e8d6b4'; g.fillRect(w * 0.3, ay + h * 0.01, w * 0.4, h * 0.035);
      g.fillStyle = '#ffffff'; g.fillRect(w * 0.37, ay - h * 0.075, w * 0.26, h * 0.025);
      g.fillStyle = lin(g, 0, ay - h * 0.05, 0, ay + h * 0.01, [[0, '#f7f2e6'], [1, '#e3d8c2']]); g.fillRect(w * 0.375, ay - h * 0.05, w * 0.25, h * 0.06);
      g.fillStyle = '#c94b4b'; g.fillRect(w * 0.47, ay - h * 0.05, w * 0.06, h * 0.06);
      g.fillStyle = '#e8b85a'; g.fillRect(w * 0.375, ay - h * 0.052, w * 0.25, h * 0.006);
      candle(g, w * 0.39, ay - h * 0.075, h * 0.07, h * 0.014);
      candle(g, w * 0.61, ay - h * 0.075, h * 0.07, h * 0.014);
      for (const fx of [0.3, 0.7]) { g.fillStyle = '#b98a4a'; g.fillRect(w * fx - h * 0.012, ay - h * 0.02, h * 0.024, h * 0.05); for (let i = 0; i < 6; i++) flower(g, w * fx + (r() - 0.5) * h * 0.06, ay - h * (0.03 + r() * 0.04), h * 0.008, '#ffffff', '#ffe9a0'); }
      tiles(g, w, h, h * 0.66, { c1: '#e2cda6', c2: '#cfb488', a: 0.12 });
      // pasillo rojo
      g.fillStyle = lin(g, 0, h * 0.66, 0, h, [[0, '#b33f3f'], [1, '#9a2f33']]);
      g.beginPath(); g.moveTo(w * 0.45, h * 0.66); g.lineTo(w * 0.55, h * 0.66); g.lineTo(w * 0.68, h); g.lineTo(w * 0.32, h); g.closePath(); g.fill();
      g.fillStyle = rgba('#e8b85a', 0.7);
      g.beginPath(); g.moveTo(w * 0.455, h * 0.66); g.lineTo(w * 0.462, h * 0.66); g.lineTo(w * 0.345, h); g.lineTo(w * 0.332, h); g.fill();
      g.beginPath(); g.moveTo(w * 0.545, h * 0.66); g.lineTo(w * 0.538, h * 0.66); g.lineTo(w * 0.655, h); g.lineTo(w * 0.668, h); g.fill();
      // bancas
      for (let k = 0; k < 4; k++) {
        const t = k / 3, y = h * (0.72 + t * t * 0.2), bh = h * (0.02 + t * 0.035), inner = w * (0.42 - t * 0.1);
        for (const side of [-1, 1]) {
          const x0 = side < 0 ? -w * 0.05 : w - inner + w * 0.0, x1 = side < 0 ? inner - w * 0.02 * (1 + t) : w + w * 0.05;
          const xa = side < 0 ? x0 : w - inner + w * 0.02 * (1 + t);
          g.fillStyle = '#7a4b2a'; g.fillRect(Math.min(xa, x1), y, Math.abs(x1 - xa), bh);
          g.fillStyle = '#9a6238'; g.fillRect(Math.min(xa, x1), y, Math.abs(x1 - xa), bh * 0.3);
        }
      }
      for (const cx2 of [0.02, 0.98]) column(g, w * cx2, h * 0.1, h * 0.7, w * 0.05, { base: '#efe2c8', light: '#fff8ea', dark: '#cbb08a' });
    },
  },

  cenaculo: {
    back(g, w, h, r, o) {
      g.fillStyle = lin(g, 0, 0, 0, h * 0.64, [[0, '#a8683a'], [1, '#d8a066']]);
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) { g.fillStyle = rgba(i % 2 ? '#f0c08a' : '#8a5530', 0.08); g.beginPath(); g.ellipse(r() * w, r() * h * 0.62, w * 0.03 * (0.5 + r()), h * 0.02, 0, 0, TAU); g.fill(); }
      // viga y techo
      g.fillStyle = '#5e3a20'; g.fillRect(0, 0, w, h * 0.06);
      for (let x = w * 0.05; x < w; x += w * 0.16) { g.fillStyle = '#6e4628'; g.fillRect(x, 0, w * 0.03, h * 0.1); }
      // ventana con la noche de Jerusalén
      const wx = w * 0.66, wy = h * 0.5, ww = w * 0.2, wh = h * 0.34;
      archPath(g, wx - w * 0.015, wy + h * 0.02, ww + w * 0.03, wh + h * 0.03); g.fillStyle = '#6a4224'; g.fill();
      g.save(); archPath(g, wx, wy, ww, wh); g.clip();
      g.fillStyle = lin(g, 0, wy - wh, 0, wy, [[0, '#16205a'], [1, '#3c3f8a']]); g.fillRect(wx, wy - wh, ww, wh);
      for (let i = 0; i < 26; i++) { g.fillStyle = rgba('#ffffff', 0.5 + r() * 0.5); g.beginPath(); g.arc(wx + r() * ww, wy - wh + r() * wh * 0.6, 0.8 + r() * 1.2, 0, TAU); g.fill(); }
      if (o.orb) { g.fillStyle = '#fff3c8'; g.beginPath(); g.arc(wx + ww * 0.75, wy - wh * 0.72, h * 0.02, 0, TAU); g.fill(); }   // sin luna pintada si la escena ya trae 🌙
      for (let i = 0; i < 7; i++) { const hx = wx + i * ww * 0.15 - ww * 0.04, hh = h * (0.04 + r() * 0.05); house(g, hx, wy, ww * 0.13, hh, { wall: '#1f2656', side: '#1a2048', roof: '#283070', door: '#141838', lit: r() > 0.3 }); }
      g.restore();
      g.fillStyle = '#7a4a28'; g.fillRect(wx - w * 0.02, wy, ww + w * 0.04, h * 0.025);
      g.fillStyle = '#5e3a20'; g.fillRect(wx + ww / 2 - w * 0.005, wy - wh, w * 0.01, wh);
      // nicho con cántaro
      archPath(g, w * 0.08, h * 0.42, w * 0.1, h * 0.16); g.fillStyle = '#9a5f33'; g.fill();
      g.fillStyle = '#c87a45'; g.beginPath(); g.ellipse(w * 0.13, h * 0.39, w * 0.025, h * 0.045, 0, 0, TAU); g.fill();
      g.fillStyle = '#c87a45'; g.fillRect(w * 0.12, h * 0.33, w * 0.02, h * 0.02);
      // piso y alfombra
      g.fillStyle = lin(g, 0, h * 0.64, 0, h, [[0, '#8a5733'], [1, '#6a3f22']]); g.fillRect(0, h * 0.64, w, h * 0.36);
      g.fillStyle = '#9b3b2c'; g.beginPath(); g.moveTo(w * 0.08, h * 0.76); g.lineTo(w * 0.92, h * 0.76); g.lineTo(w * 1.02, h); g.lineTo(-w * 0.02, h); g.closePath(); g.fill();
      for (let k = 0; k < 4; k++) { const y = h * (0.79 + k * 0.05); g.fillStyle = k % 2 ? rgba('#e0a44f', 0.8) : rgba('#5a1f1a', 0.5); g.fillRect(0, y, w, h * 0.008); }
      // mesa larga con mantel
      const ty = h * 0.64;
      g.fillStyle = '#6b4024'; g.fillRect(w * 0.12, ty + h * 0.07, w * 0.02, h * 0.06); g.fillRect(w * 0.86, ty + h * 0.07, w * 0.02, h * 0.06);
      g.fillStyle = lin(g, 0, ty - h * 0.02, 0, ty + h * 0.09, [[0, '#fffaf0'], [0.4, '#f3e6cc'], [1, '#dcc9a6']]);
      g.beginPath(); g.moveTo(w * 0.1, ty); g.lineTo(w * 0.9, ty); g.lineTo(w * 0.93, ty + h * 0.09); g.lineTo(w * 0.07, ty + h * 0.09); g.closePath(); g.fill();
      g.fillStyle = rgba('#c9b28a', 0.5); for (let x = w * 0.1; x < w * 0.9; x += w * 0.06) g.fillRect(x, ty + h * 0.03, w * 0.004, h * 0.06);
      g.fillStyle = '#b86a3a'; g.beginPath(); g.ellipse(w * 0.2, ty - h * 0.035, w * 0.022, h * 0.04, 0, 0, TAU); g.fill();
      g.fillRect(w * 0.192, ty - h * 0.09, w * 0.016, h * 0.025);
      for (const px of [0.33, 0.67]) { g.fillStyle = '#d7b98a'; g.beginPath(); g.ellipse(w * px, ty + h * 0.005, w * 0.04, h * 0.012, 0, 0, TAU); g.fill(); }
      lamp(g, w * 0.3, 0, h * 0.26, h * 0.035);
      lamp(g, w * 0.52, 0, h * 0.22, h * 0.035);
      glow(g, w * 0.45, h * 0.45, h * 0.6, '#ffcf7a', 0.25, 'lighter');
    },
  },

  rio: {
    back(g, w, h, r, o) {
      fillSky(g, w, h, [[0, '#56b6f2'], [0.4, '#a9defb'], [0.52, '#eaf8ff']]);
      if (o.orb) sun(g, w * 0.2, h * 0.14, h * 0.05);
      cloud(g, w * 0.62, h * 0.15, h * 0.08, { seed: 9 });
      ridge(g, w, h, { y: h * 0.5, amp: h * 0.05, seed: 141, n: 4, fill: [[0, '#cbbf9c'], [1, '#d8cfb2']] });
      const mid = ridge(g, w, h, { y: h * 0.57, amp: h * 0.03, seed: 142, fill: [[0, '#a9cc8a'], [1, '#93be76']] });
      for (let i = 0; i < 4; i++) { const x = w * (0.05 + i * 0.07); palm(g, x, mid(x) + h * 0.03, h * (0.12 + r() * 0.05), { seed: 143 + i }); }
      for (let i = 0; i < 3; i++) { const x = w * (0.78 + i * 0.08); palm(g, x, mid(x) + h * 0.03, h * (0.12 + r() * 0.05), { seed: 150 + i, lean: -0.12 }); }
      ridge(g, w, h, { y: h * 0.66, amp: h * 0.02, seed: 144, fill: [[0, '#8fcb6c'], [1, '#62ad52']] });
      // el río que serpentea hacia nosotros
      g.save();
      g.beginPath();
      g.moveTo(w * 0.47, h * 0.58); g.lineTo(w * 0.53, h * 0.58);
      g.bezierCurveTo(w * 0.62, h * 0.66, w * 0.5, h * 0.74, w * 0.72, h * 0.84);
      g.quadraticCurveTo(w * 0.86, h * 0.92, w * 0.9, h);
      g.lineTo(w * 0.18, h);
      g.quadraticCurveTo(w * 0.3, h * 0.9, w * 0.36, h * 0.82);
      g.bezierCurveTo(w * 0.46, h * 0.72, w * 0.4, h * 0.65, w * 0.47, h * 0.58);
      g.closePath();
      g.fillStyle = lin(g, 0, h * 0.58, 0, h, [[0, '#bfe9f6'], [0.4, '#6cc1e6'], [1, '#2f8fc9']]);
      g.fill();
      g.clip();
      waterBand(g, 0, h * 0.58, w, h, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0)']], r, { glints: Math.round(w / 7) });
      g.restore();
      // juncos en las orillas
      grass(g, w * 0.14, w * 0.34, h * 0.86, h * 0.09, r, { step: w / 320, cols: ['#5f9a4a', '#4c8540', '#7db35c'] });
      grass(g, w * 0.7, w * 0.88, h * 0.84, h * 0.09, r, { step: w / 320, cols: ['#5f9a4a', '#4c8540', '#7db35c'] });
      stones(g, w * 0.2, w * 0.8, h * 0.9, h * 0.99, 10, r, ['#d9cdb4', '#c4b496']);
    },
    front(g, w, h, r) {
      grass(g, -5, w * 0.2, h, h * 0.2, r, { step: w / 300, cols: ['#4f8a40', '#64a04c', '#3e7535'], lean: 0.1 });
      grass(g, w * 0.82, w + 5, h, h * 0.18, r, { step: w / 300, cols: ['#4f8a40', '#64a04c', '#3e7535'], lean: -0.1 });
      for (const [x, y] of [[0.06, 0.82], [0.12, 0.85], [0.9, 0.84]]) { g.fillStyle = '#6b4a2a'; g.beginPath(); g.ellipse(w * x, h * y, h * 0.01, h * 0.03, 0, 0, TAU); g.fill(); }
    },
  },

  monte: {
    back(g, w, h, r, o) {
      fillSky(g, w, h, [[0, '#4ea9ec'], [0.45, '#a8dcfb'], [0.62, '#effaff']]);
      const px = w * 0.46, py = h * 0.14;
      glow(g, px, py, h * 0.55, '#fff3c4', 0.8);
      rays(g, px, py, 18, h * 1.1, '#fff6d0', { a: 0.25, width: 0.45 });
      ridge(g, w, h, { y: h * 0.56, amp: h * 0.05, seed: 161, fill: [[0, '#b4cfe2'], [1, '#c8def0']] });
      peak(g, w * 0.84, h * 0.64, w * 0.4, h * 0.26, { light: '#b9c3b4', dark: '#93ab88', seed: 168, foot: '#86b873' });
      peak(g, px, h * 0.68, w * 0.66, h * 0.56, { light: '#d2b996', dark: '#9a8a6c', seed: 162, foot: '#79b65d' });
      cloud(g, px - w * 0.18, h * 0.38, h * 0.06, { seed: 163, alpha: 0.95 });
      cloud(g, px + w * 0.2, h * 0.32, h * 0.05, { seed: 164, alpha: 0.9 });
      cloud(g, w * 0.85, h * 0.14, h * 0.06, { seed: 165, alpha: 0.85 });
      const mid = ridge(g, w, h, { y: h * 0.7, amp: h * 0.035, seed: 166, fill: [[0, '#88c96a'], [1, '#6fb758']], rim: rgba('#e3ffc8', 0.6), rimW: h * 0.005 });
      for (let i = 0; i < 4; i++) { const x = w * (0.08 + i * 0.28 + r() * 0.05); olive(g, x, mid(x) + h * 0.04, h * (0.1 + r() * 0.04), { seed: 170 + i }); }
      ridge(g, w, h, { y: h * 0.8, amp: h * 0.025, seed: 167, fill: [[0, '#7cc762'], [1, '#55a547']] });
      stones(g, 0, w, h * 0.84, h * 0.98, 9, r, ['#c9c0ae', '#b2a891', '#ddd5c2']);
      for (let i = 0; i < 22; i++) flower(g, r() * w, h * (0.83 + r() * 0.15), h * 0.008 * (1 + r()), ['#ffffff', '#ffd84a', '#c59bff'][i % 3]);
    },
    front(g, w, h, r) {
      grass(g, -5, w + 5, h, h * 0.065, r, { step: w / 170 });
      for (const [x, s] of [[0.04, 0.07], [0.95, 0.06]]) { g.fillStyle = '#9a917c'; g.beginPath(); g.ellipse(w * x, h * 0.99, h * s * 1.5, h * s, 0, Math.PI, TAU); g.fill(); g.fillStyle = rgba('#ffffff', 0.25); g.beginPath(); g.ellipse(w * x - h * s * 0.4, h * 0.99 - h * s * 0.5, h * s * 0.6, h * s * 0.25, 0, 0, TAU); g.fill(); }
    },
  },

  ciudad: {
    back(g, w, h, r, o) {
      fillSky(g, w, h, [[0, '#5aaeea'], [0.38, '#a9d8f4'], [0.56, '#fde6bf'], [0.62, '#ffefd2']]);
      if (o.orb) sun(g, w * 0.84, h * 0.2, h * 0.055, { halo: '#fff0c8' });
      cloud(g, w * 0.22, h * 0.15, h * 0.07, { seed: 10, alpha: 0.9 });
      ridge(g, w, h, { y: h * 0.55, amp: h * 0.04, seed: 181, fill: [[0, '#d6c3a2'], [1, '#e2d2b4']] });
      const hill = ridge(g, w, h, { y: h * 0.63, amp: h * 0.025, seed: 182, fill: [[0, '#c9b38a'], [1, '#bda57a']] });
      // casas apiñadas detrás de la muralla
      for (let i = 0; i < 22; i++) {
        const x = w * (0.12 + (i / 21) * 0.74 + (r() - 0.5) * 0.02), hh = h * (0.05 + r() * 0.06);
        house(g, x, h * 0.6 - r() * h * 0.05, hh * (0.9 + r() * 0.6), hh, { wall: ['#fbf1dc', '#f1e0bd', '#f7e8cc'][i % 3], side: '#dcc59c', roof: '#e8d4ae', dome: i === 6 ? '#e6c06a' : null });
      }
      // el Templo
      const tx = w * 0.6, ty = h * 0.53, tw = w * 0.17, th = h * 0.13;
      g.fillStyle = '#efe2c4'; g.fillRect(tx - tw * 0.1, ty, tw * 1.2, h * 0.03);
      g.fillStyle = lin(g, 0, ty - th, 0, ty, [[0, '#fffaf0'], [1, '#eadbb8']]); g.fillRect(tx, ty - th, tw, th);
      g.fillStyle = '#e8c46a'; g.fillRect(tx - tw * 0.04, ty - th - h * 0.015, tw * 1.08, h * 0.018);
      for (let i = 0; i < 6; i++) { g.fillStyle = rgba('#c9b48a', 0.7); g.fillRect(tx + tw * (0.08 + i * 0.165), ty - th * 0.85, tw * 0.03, th * 0.85); }
      g.fillStyle = '#8a6a44'; archPath(g, tx + tw * 0.42, ty, tw * 0.16, th * 0.55); g.fill();
      // muralla con torres y puerta
      const wy = h * 0.68, wh = h * 0.1;
      g.fillStyle = lin(g, 0, wy - wh, 0, wy, [[0, '#ead6a8'], [1, '#d3b781']]); g.fillRect(w * 0.06, wy - wh, w * 0.88, wh);
      g.fillStyle = '#d3b781'; for (let x = w * 0.06; x < w * 0.94; x += w * 0.03) g.fillRect(x, wy - wh - h * 0.015, w * 0.016, h * 0.016);
      g.strokeStyle = rgba('#9a7a4a', 0.3); g.lineWidth = 1;
      for (let y = wy - wh + h * 0.02; y < wy; y += h * 0.02) { g.beginPath(); g.moveTo(w * 0.06, y); g.lineTo(w * 0.94, y); g.stroke(); }
      for (const tx2 of [0.06, 0.3, 0.7, 0.94]) {
        g.fillStyle = '#e0c894'; g.fillRect(w * tx2 - w * 0.03, wy - wh - h * 0.05, w * 0.06, wh + h * 0.05);
        g.fillStyle = '#c9ad78'; for (let k = 0; k < 3; k++) g.fillRect(w * tx2 - w * 0.03 + k * w * 0.022, wy - wh - h * 0.065, w * 0.014, h * 0.016);
      }
      g.fillStyle = '#6a4a2c'; archPath(g, w * 0.46, wy, w * 0.08, wh * 0.85); g.fill();
      g.fillStyle = rgba('#000000', 0.2); g.fillRect(w * 0.06, wy - h * 0.012, w * 0.88, h * 0.012);
      // camino hacia la puerta
      ridge(g, w, h, { y: h * 0.74, amp: h * 0.02, seed: 183, fill: [[0, '#a9cc7e'], [1, '#86b763']] });
      g.fillStyle = lin(g, 0, wy, 0, h, [[0, '#e6d2a4'], [1, '#d6b984']]);
      g.beginPath(); g.moveTo(w * 0.47, wy); g.lineTo(w * 0.53, wy); g.lineTo(w * 0.72, h); g.lineTo(w * 0.28, h); g.closePath(); g.fill();
      stones(g, w * 0.32, w * 0.68, h * 0.8, h * 0.98, 8, r, ['#cdb48a', '#e8d6b0']);
      palm(g, w * 0.17, h * 0.84, h * 0.32, { seed: 184 });
      palm(g, w * 0.85, h * 0.86, h * 0.28, { seed: 185, lean: -0.14 });
      olive(g, w * 0.04, h * 0.8, h * 0.2, { seed: 186 });
    },
    front(g, w, h, r) {
      grass(g, -5, w * 0.3, h, h * 0.06, r, { step: w / 170 });
      grass(g, w * 0.7, w + 5, h, h * 0.06, r, { step: w / 170 });
    },
  },
};

// Colores de respaldo mientras se pinta (y en las pantallas que no pueden pintar).
const FALLBACK = {
  cielo: ['#4fb0f0', '#d8f1ff', '#86cf6c'], campo: ['#58b6f2', '#e4f6ff', '#9fd27a'], jardin: ['#8fd6ff', '#f2fce9', '#78c766'],
  noche: ['#0d1238', '#3a3480', '#1b2048'], desierto: ['#f2a865', '#ffe8bd', '#e7b16c'], mar: ['#4cb0f0', '#e4f7ff', '#3f9fe0'],
  tormenta: ['#262d48', '#66718f', '#3c4558'], dorado: ['#fff1bf', '#fbd77a', '#f5dca0'], amanecer: ['#5e6cc4', '#ffc68a', '#8fc873'],
  templo: ['#d9c29a', '#ecdcbc', '#d0b27e'], iglesia: ['#ead9bd', '#f6ead4', '#d9c19a'], cenaculo: ['#a8683a', '#d8a066', '#7a4a2c'],
  rio: ['#56b6f2', '#eaf8ff', '#7fc0a0'], monte: ['#4ea9ec', '#effaff', '#7cc762'], ciudad: ['#5aaeea', '#fde6bf', '#c9b38a'],
};
export function fallbackCss(bg) {
  const [a, b, c] = FALLBACK[bg] || FALLBACK.cielo;
  return `linear-gradient(${a}, ${b} 64%, ${c} 64%)`;
}

// ───────────────────────── Caché de imágenes ─────────────────────────

const SHAPES = { card: { ratio: 1.6, w: () => 440 }, hero: { ratio: 1.6, w: () => clampW(1.0) }, stage: { ratio: 4 / 3, w: () => clampW(0.95) } };
function clampW(k) {
  const vw = Math.min(typeof window !== 'undefined' ? window.innerWidth || 400 : 400, 560);
  const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2, 2.6);
  return Math.round(Math.max(560, Math.min(1180, vw * dpr * k)));
}
const ready = new Map();     // clave → url (ya pintado)
const pending = new Map();   // clave → Promise<url|null>
let chain = Promise.resolve();
const idle = () => new Promise(res => (typeof requestIdleCallback === 'function' ? requestIdleCallback(() => res(), { timeout: 160 }) : setTimeout(res, 16)));

function encode(c) {
  return new Promise(res => {
    if (!c.toBlob) { res(c.toDataURL('image/png')); return; }
    c.toBlob(b => { res(b ? URL.createObjectURL(b) : null); c.width = 0; c.height = 0; }, 'image/webp', 0.9);
  });
}
function paintLayer(bg, layer, shape, orb = true) {
  const P = PAINT[bg];
  if (!P || !P[layer]) return null;
  const sh = SHAPES[shape] || SHAPES.card;
  const w = sh.w(), h = Math.round(w / sh.ratio);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  if (!g) return null;
  const r = rng(seedOf(`${bg}:${layer}`));
  P[layer](g, w, h, r, { orb });
  if (layer === 'back') grain(g, w, h, rng(7), DARK.has(bg) ? 0.03 : 0.025);
  return c;
}
const keyOf = (bg, layer, shape, orb) => `${bg}|${layer}|${shape}${layer === 'back' && !orb ? '|sin-astro' : ''}`;
function layerUrl(bg, layer, shape, urgent, orb = true) {
  const key = keyOf(bg, layer, shape, orb);
  if (ready.has(key)) return Promise.resolve(ready.get(key));
  if (pending.has(key)) return pending.get(key);
  const job = () => {
    let c = null;
    try { c = paintLayer(bg, layer, shape, orb); } catch (e) { console.warn('escena', bg, e); }
    return c ? encode(c) : null;
  };
  const p = (urgent ? Promise.resolve().then(job) : (chain = chain.then(idle).then(job).catch(() => null))).then(url => { ready.set(key, url); pending.delete(key); return url; });
  pending.set(key, p);
  return p;
}
// Pinta por adelantado (por ejemplo, los fondos de una lección mientras el niño mira la portada).
//   items: ['mar', …] o [{ bg: 'mar', orb: false }, …]
export function preload(items, shape = 'stage') {
  if (typeof document === 'undefined') return;
  const seen = new Set();
  for (const it of items) {
    const bg = typeof it === 'string' ? it : it?.bg, orb = typeof it === 'string' ? true : it?.orb !== false;
    if (!PAINT[bg] || seen.has(bg + orb)) continue;
    seen.add(bg + orb);
    for (const layer of ['back', 'front']) if (PAINT[bg][layer]) layerUrl(bg, layer, shape, false, orb);
  }
}

// ───────────────────────── Ambiente animado (CSS) ─────────────────────────

let cloudSprites = null;
function cloudSprite(warm) {
  if (!cloudSprites) {
    cloudSprites = {};
    for (const [k, opt] of [['white', { light: '#ffffff', shade: '#dfe8f5' }], ['warm', { light: '#ffe1cc', shade: '#efa7ae' }], ['gold', { light: '#fff9e8', shade: '#f6dc9c' }]]) {
      const c = document.createElement('canvas'); c.width = 320; c.height = 160;
      const g = c.getContext('2d');
      if (!g) continue;
      cloud(g, 160, 105, 82, { ...opt, seed: k.length });
      cloudSprites[k] = c.toDataURL('image/png');
    }
  }
  return cloudSprites[warm] || cloudSprites.white;
}
const AMB = {
  cielo: { clouds: 'white' }, campo: { clouds: 'white' }, jardin: { clouds: 'white', motes: 'pollen' }, mar: { clouds: 'white', glints: [52, 80] },
  rio: { clouds: 'white', glints: [66, 100, 30, 70] }, monte: { clouds: 'white', rays: 'peak' }, ciudad: { clouds: 'white' },
  amanecer: { clouds: 'warm', rays: 'dawn' }, noche: { stars: true, motes: 'firefly' }, dorado: { rays: 'glory', motes: 'gold', clouds: 'gold' },
  tormenta: { rain: true }, templo: { motes: 'dust', beams: true }, iglesia: { motes: 'dust', beams: true }, cenaculo: { motes: 'ember' }, desierto: { motes: 'heat' },
};
function ambientEl(bg, level) {
  const a = AMB[bg] || {};
  const box = document.createElement('span');
  box.className = 'sc__amb';
  const add = (cls, vars = {}) => {
    const s = document.createElement('span');
    s.className = cls;
    for (const [k, v] of Object.entries(vars)) s.style.setProperty(k, v);
    box.append(s);
    return s;
  };
  const r = rng(seedOf(bg + level));
  if (a.clouds) {
    const url = cloudSprite(a.clouds);
    const n = level === 'full' ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const dur = 60 + r() * 50;
      const d = add('sc__drift', { '--dur': `${dur.toFixed(0)}s`, '--del': `${(-r() * dur).toFixed(1)}s` });
      const c = document.createElement('span');
      c.className = 'sc__cloud';
      c.style.setProperty('--top', `${(4 + r() * 24).toFixed(1)}%`);
      c.style.setProperty('--w', `${(18 + r() * 16).toFixed(1)}%`);
      c.style.setProperty('--o', (0.55 + r() * 0.35).toFixed(2));
      if (url) c.style.backgroundImage = `url(${url})`;
      d.append(c);
    }
  }
  if (a.stars) {
    const n = level === 'full' ? 14 : 7;
    for (let i = 0; i < n; i++) add('sc__star', { left: `${(r() * 100).toFixed(1)}%`, top: `${(Math.pow(r(), 1.4) * 55).toFixed(1)}%`, '--del': `${(-r() * 4).toFixed(2)}s`, '--sz': `${(2 + r() * 2.5).toFixed(1)}px` });
  }
  if (level !== 'full') return box;
  if (a.glints) {
    const [t0, t1, x0 = 0, x1 = 100] = a.glints;
    for (let i = 0; i < 12; i++) add('sc__glint', { left: `${(x0 + r() * (x1 - x0)).toFixed(1)}%`, top: `${(t0 + Math.pow(r(), 0.8) * (t1 - t0)).toFixed(1)}%`, '--del': `${(-r() * 3).toFixed(2)}s`, '--len': `${(8 + r() * 22).toFixed(0)}px` });
  }
  if (a.motes) {
    for (let i = 0; i < 9; i++) add(`sc__mote sc__mote--${a.motes}`, { left: `${(4 + r() * 92).toFixed(1)}%`, '--del': `${(-r() * 12).toFixed(2)}s`, '--dur': `${(8 + r() * 7).toFixed(1)}s`, '--sz': `${(4 + r() * 6).toFixed(1)}px`, '--dx': `${((r() - 0.5) * 40).toFixed(0)}px`, '--b': `${(r() * 40).toFixed(0)}%` });
  }
  if (a.rays) add(`sc__rays sc__rays--${a.rays}`);
  if (a.beams) for (let i = 0; i < 3; i++) add('sc__beam', { left: `${[12, 42, 72][i]}%`, '--del': `${(-i * 1.7).toFixed(1)}s` });
  if (a.rain) { add('sc__rain'); add('sc__rain sc__rain--far'); add('sc__flash'); }
  return box;
}

// ───────────────────────── El elemento ─────────────────────────

const hasCanvas = () => typeof document !== 'undefined' && !!document.createElement('canvas').getContext;
export function sceneEl(bg, { shape = 'card', ambient = false, cls = '', urgent = shape !== 'card', orb = true } = {}) {
  const id = SCENE_IDS.includes(bg) ? bg : 'cielo';
  const root = document.createElement('span');
  root.className = `sc sc--${id} sc--${shape}${DARK.has(id) ? ' sc--dark' : ''}${cls ? ` ${cls}` : ''}`;
  root.setAttribute('aria-hidden', 'true');
  root.style.setProperty('--sc-fb', fallbackCss(id));
  const back = document.createElement('span'); back.className = 'sc__l sc__back';
  const front = document.createElement('span'); front.className = 'sc__l sc__front';
  const vig = document.createElement('span'); vig.className = 'sc__vig';
  root.append(back);
  const motion = !(typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (ambient && motion && hasCanvas()) root.append(ambientEl(id, ambient));
  root.append(front, vig);
  if (hasCanvas()) {
    for (const [el, layer] of [[back, 'back'], [front, 'front']]) {
      if (!PAINT[id][layer]) { el.remove(); continue; }
      const key = keyOf(id, layer, shape, orb);
      const set = (url, now) => { if (!url) return; el.style.backgroundImage = `url(${url})`; if (now) el.classList.add('is-now'); el.classList.add('is-ready'); };
      if (ready.has(key)) set(ready.get(key), true);
      else layerUrl(id, layer, shape, urgent, orb).then(url => set(url, false));
    }
  }
  return root;
}
