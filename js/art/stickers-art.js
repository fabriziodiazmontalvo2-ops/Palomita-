// Ilustraciones de las figuritas, pintadas por código en un lienzo de 300 × 400 (se escala a cualquier tamaño).
// Cada figurita se pinta una sola vez y se guarda como imagen (URL de blob) para no repetir el trabajo.
//
//   stickerURL(sticker, { big })  → Promise<string>   URL de la imagen (big: el doble de resolución, para verla en grande)
//   paintSticker(canvas, sticker) → Promise<void>      pinta sobre un lienzo propio (cualquier tamaño 3:4)
//   releaseAll()                                      libera las imágenes guardadas
//
// Si la figurita trae `img` (una imagen pintada aparte, p. ej. assets/figuritas/<id>.webp), se usa esa en su lugar.
// Las fotos de la parroquia (assets/parroquia/*.jpg) se recortan y se decoran con marcos, brillos y luz dorada.

export const W = 300, H = 400;
const TAU = Math.PI * 2;

// ───────────── Colores ─────────────
function rgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a, b, t) {
  const A = rgb(a), B = rgb(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
const dark = (c, t = 0.35) => mix(c, '#1d0f08', t);
const light = (c, t = 0.35) => mix(c, '#ffffff', t);
function rgba(c, a) { const [r, g, b] = rgb(c); return `rgba(${r},${g},${b},${a})`; }

// ───────────── Azar estable ─────────────
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ───────────── Pinceles básicos ─────────────
function linear(g, x0, y0, x1, y1, stops) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  stops.forEach((c, i) => (Array.isArray(c) ? gr.addColorStop(c[0], c[1]) : gr.addColorStop(i / Math.max(1, stops.length - 1), c)));
  return gr;
}
function radial(g, x, y, r, stops, x0 = x, y0 = y, r0 = 0) {
  const gr = g.createRadialGradient(x0, y0, r0, x, y, r);
  stops.forEach((c, i) => (Array.isArray(c) ? gr.addColorStop(c[0], c[1]) : gr.addColorStop(i / Math.max(1, stops.length - 1), c)));
  return gr;
}
function rect(g, fill) { g.fillStyle = fill; g.fillRect(0, 0, W, H); }
function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
function ink(g, fill, stroke = dark(typeof fill === 'string' ? fill : '#7a4b2a', 0.5), lw = 3) {
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke && lw) { g.lineWidth = lw; g.strokeStyle = stroke; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
}
function ellipse(g, x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); }
function circle(g, x, y, r) { g.beginPath(); g.arc(x, y, Math.max(0.1, r), 0, TAU); }
function glow(g, x, y, r, color, a = 0.8) {
  g.save(); g.globalCompositeOperation = 'lighter';
  g.fillStyle = radial(g, x, y, r, [rgba(color, a), rgba(color, a * 0.35), rgba(color, 0)]);
  g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}
function rays(g, x, y, { n = 18, len = 420, color = '#fff2b3', a = 0.28, width = 0.45, spin = 0 } = {}) {
  g.save(); g.translate(x, y); g.rotate(spin);
  g.fillStyle = radial(g, 0, 0, len, [rgba(color, a), rgba(color, a * 0.5), rgba(color, 0)]);
  const step = TAU / n;
  g.beginPath();
  for (let i = 0; i < n; i++) { const a0 = i * step, a1 = a0 + step * width; g.moveTo(0, 0); g.arc(0, 0, len, a0, a1); g.closePath(); }
  g.fill(); g.restore();
}
function bokeh(g, rand, { n = 16, color = '#fff6c9', minR = 4, maxR = 16, a = 0.35, y0 = 0, y1 = H } = {}) {
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x = rand() * W, y = y0 + rand() * (y1 - y0), r = minR + rand() * (maxR - minR), al = a * (0.4 + rand() * 0.6);
    g.fillStyle = radial(g, x, y, r, [rgba(color, al), rgba(color, al * 0.7), rgba(color, 0)]);
    circle(g, x, y, r); g.fill();
  }
  g.restore();
}
function sparkle(g, x, y, s, color = '#ffffff', a = 1) {
  g.save(); g.translate(x, y); g.globalAlpha *= a;
  g.fillStyle = color;
  g.beginPath();
  for (let i = 0; i < 4; i++) {
    const ang = i * Math.PI / 2;
    g.lineTo(Math.cos(ang) * s, Math.sin(ang) * s);
    g.lineTo(Math.cos(ang + Math.PI / 4) * s * 0.22, Math.sin(ang + Math.PI / 4) * s * 0.22);
  }
  g.closePath(); g.fill();
  glow(g, 0, 0, s * 1.3, color, 0.5);
  g.restore();
}
function sparkles(g, rand, n, { color = '#ffffff', min = 4, max = 10, y0 = 0, y1 = H, x0 = 0, x1 = W } = {}) {
  for (let i = 0; i < n; i++) sparkle(g, x0 + rand() * (x1 - x0), y0 + rand() * (y1 - y0), min + rand() * (max - min), color, 0.6 + rand() * 0.4);
}
function stars(g, rand, n, y1 = H * 0.6) {
  for (let i = 0; i < n; i++) {
    const x = rand() * W, y = rand() * y1, r = 0.6 + rand() * 1.6;
    g.fillStyle = `rgba(255,255,240,${0.5 + rand() * 0.5})`; circle(g, x, y, r); g.fill();
    if (r > 1.8) sparkle(g, x, y, 5, '#fffbe0', 0.7);
  }
}
// Textura de papel pintado: puntitos claros y oscuros muy suaves.
function grain(g, rand, n = 1400, a = 0.05) {
  g.save();
  for (let i = 0; i < n; i++) {
    g.fillStyle = rand() < 0.5 ? `rgba(255,255,255,${a * (0.5 + rand())})` : `rgba(60,30,10,${a * (0.5 + rand())})`;
    g.fillRect(rand() * W, rand() * H, 1 + rand() * 1.6, 1 + rand() * 1.6);
  }
  g.restore();
}
function vignette(g, a = 0.32, color = '#2b1406') {
  g.fillStyle = radial(g, W / 2, H * 0.46, H * 0.72, [[0, rgba(color, 0)], [0.6, rgba(color, 0)], [1, rgba(color, a)]]);
  g.fillRect(0, 0, W, H);
}
function cloud(g, x, y, s, a = 0.9) {
  g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha *= a;
  g.fillStyle = linear(g, 0, -30, 0, 20, ['#ffffff', '#e8f1ff']);
  g.beginPath();
  g.arc(-28, 4, 18, 0, TAU); g.arc(-8, -10, 24, 0, TAU); g.arc(18, -4, 20, 0, TAU); g.arc(36, 8, 14, 0, TAU);
  g.rect(-30, 4, 66, 18);
  g.fill(); g.restore();
}
// Cerros andinos (el valle del Mantaro) con nieve en las cumbres.
function andes(g, y, { far = '#9fb7d9', near = '#7aa36a', snow = true, rand = Math.random } = {}) {
  g.fillStyle = linear(g, 0, y - 90, 0, y + 20, [light(far, 0.2), far]);
  g.beginPath(); g.moveTo(0, y + 10);
  const peaks = [[0, y - 30], [40, y - 70], [80, y - 40], [130, y - 95], [175, y - 50], [220, y - 80], [260, y - 45], [300, y - 66], [300, y + 10]];
  peaks.forEach(([px, py]) => g.lineTo(px, py)); g.closePath(); g.fill();
  if (snow) {
    g.fillStyle = 'rgba(255,255,255,0.92)';
    for (const [px, py] of [[40, y - 70], [130, y - 95], [220, y - 80]]) {
      g.beginPath(); g.moveTo(px, py); g.lineTo(px - 14, py + 16); g.lineTo(px - 5, py + 12); g.lineTo(px + 2, py + 18); g.lineTo(px + 14, py + 15); g.closePath(); g.fill();
    }
  }
  g.fillStyle = linear(g, 0, y - 30, 0, H, [light(near, 0.15), near, dark(near, 0.25)]);
  g.beginPath(); g.moveTo(0, y - 6);
  g.bezierCurveTo(70, y - 34, 120, y + 4, 180, y - 18); g.bezierCurveTo(230, y - 36, 270, y - 10, 300, y - 20);
  g.lineTo(300, H); g.lineTo(0, H); g.closePath(); g.fill();
}
function grass(g, rand, y, n = 50, color = '#4f9a48') {
  g.strokeStyle = color; g.lineWidth = 1.6; g.lineCap = 'round';
  for (let i = 0; i < n; i++) { const x = rand() * W, hgt = 6 + rand() * 10, yy = y + rand() * (H - y); g.beginPath(); g.moveTo(x, yy); g.quadraticCurveTo(x + 2, yy - hgt * 0.6, x + (rand() - 0.5) * 6, yy - hgt); g.stroke(); }
}
function flower(g, x, y, s, petal = '#ffffff', center = '#ffcf3a') {
  g.save(); g.translate(x, y); g.scale(s, s);
  for (let i = 0; i < 5; i++) { g.save(); g.rotate(i * TAU / 5); ellipse(g, 0, -6, 4, 6.5); g.fillStyle = petal; g.fill(); g.restore(); }
  circle(g, 0, 0, 3.2); g.fillStyle = center; g.fill(); g.restore();
}
function lily(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.strokeStyle = '#3f8a3c'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-2, 30, 2, 60); g.stroke();
  g.fillStyle = '#5aa64f'; ellipse(g, 8, 34, 4, 12, 0.6); g.fill();
  for (const r of [-0.9, 0, 0.9]) {
    g.save(); g.rotate(r);
    g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-9, -8, -6, -24, 0, -30); g.bezierCurveTo(6, -24, 9, -8, 0, 0);
    g.fillStyle = linear(g, 0, -30, 0, 0, ['#ffffff', '#fff6e8', '#f3e3c6']); g.fill(); g.strokeStyle = 'rgba(160,120,80,0.35)'; g.lineWidth = 1; g.stroke();
    g.restore();
  }
  g.fillStyle = '#f0a51e'; circle(g, -2, -14, 1.6); g.fill(); circle(g, 2, -15, 1.6); g.fill();
  g.restore();
}
function banner(g, text, x, y, w, { color = '#c0392b', textColor = '#fff8e6', size = 22, font = 'Baloo 2' } = {}) {
  const hgt = size * 1.55;
  g.save();
  // Colas del listón
  g.fillStyle = dark(color, 0.25);
  for (const s of [-1, 1]) {
    g.beginPath(); const ex = x + s * w / 2;
    g.moveTo(ex - s * 8, y - hgt / 2 + 6); g.lineTo(ex + s * 22, y - hgt / 2 + 6); g.lineTo(ex + s * 12, y + 4); g.lineTo(ex + s * 22, y + hgt / 2 + 6); g.lineTo(ex - s * 8, y + hgt / 2 + 6); g.closePath(); g.fill();
  }
  g.beginPath(); g.moveTo(x - w / 2, y - hgt / 2); g.quadraticCurveTo(x, y - hgt / 2 - 8, x + w / 2, y - hgt / 2); g.lineTo(x + w / 2, y + hgt / 2); g.quadraticCurveTo(x, y + hgt / 2 - 8, x - w / 2, y + hgt / 2); g.closePath();
  g.fillStyle = linear(g, 0, y - hgt / 2, 0, y + hgt / 2, [light(color, 0.15), color, dark(color, 0.12)]); g.fill();
  g.strokeStyle = dark(color, 0.4); g.lineWidth = 2; g.stroke();
  g.fillStyle = textColor; g.textAlign = 'center'; g.textBaseline = 'middle';
  let fs = size;
  g.font = `800 ${fs}px "${font}", system-ui, sans-serif`;
  while (g.measureText(text).width > w - 16 && fs > 10) { fs -= 1; g.font = `800 ${fs}px "${font}", system-ui, sans-serif`; }
  g.fillText(text, x, y - 2);
  g.restore();
}
function label(g, text, x, y, { size = 20, color = '#3d2b24', weight = 800, font = 'Baloo 2', align = 'center', maxW = 260, stroke = null, sw = 5 } = {}) {
  g.save(); g.textAlign = align; g.textBaseline = 'middle';
  let fs = size;
  g.font = `${weight} ${fs}px "${font}", system-ui, sans-serif`;
  while (g.measureText(text).width > maxW && fs > 9) { fs -= 1; g.font = `${weight} ${fs}px "${font}", system-ui, sans-serif`; }
  if (stroke) { g.lineWidth = sw; g.strokeStyle = stroke; g.lineJoin = 'round'; g.strokeText(text, x, y); }
  g.fillStyle = color; g.fillText(text, x, y); g.restore();
}

// ───────────── Fondos ─────────────
function bgGold(g, rand, { cx = W / 2, cy = H * 0.38 } = {}) {
  rect(g, radial(g, cx, cy, H * 0.75, ['#fff8dc', '#ffe39a', '#f2b84b', '#b9742a']));
  rays(g, cx, cy, { n: 22, color: '#fff7cf', a: 0.42, spin: rand() });
  bokeh(g, rand, { n: 18, color: '#fff1b8' });
}
function bgSky(g, rand, { top = '#7cc8f5', bottom = '#e9f7ff', mountains = true, hills = '#7fbf6a' } = {}) {
  rect(g, linear(g, 0, 0, 0, H, [top, bottom]));
  glow(g, W * 0.8, H * 0.12, 90, '#fff6cf', 0.6);
  cloud(g, 60, 70, 0.9); cloud(g, 230, 110, 0.7, 0.8);
  if (mountains) andes(g, H * 0.68, { near: hills, rand });
}
function bgDawn(g, rand) {
  rect(g, linear(g, 0, 0, 0, H, ['#5e6fcf', '#c38ad8', '#ffb38a', '#ffe3a1']));
  glow(g, W / 2, H * 0.62, 160, '#fff1c4', 0.9);
  rays(g, W / 2, H * 0.62, { n: 16, color: '#fff3c8', a: 0.35 });
}
function bgNight(g, rand) {
  rect(g, linear(g, 0, 0, 0, H, ['#1c2457', '#33407e', '#5b5596']));
  stars(g, rand, 60);
  glow(g, W * 0.78, H * 0.14, 50, '#fffbe0', 0.5);
  g.fillStyle = '#fffbe8'; circle(g, W * 0.78, H * 0.14, 16); g.fill();
  g.fillStyle = '#33407e'; circle(g, W * 0.78 + 7, H * 0.14 - 4, 14); g.fill();
}
// Interior de iglesia: muro cálido, ventanal en arco con vitral y piso.
function bgChurch(g, rand, { wall = '#f6e4c9', floor = '#c9925e' } = {}) {
  rect(g, linear(g, 0, 0, 0, H, [light(wall, 0.2), wall, dark(wall, 0.12)]));
  // Ventanal
  g.save();
  g.beginPath(); g.moveTo(110, 170); g.lineTo(110, 70); g.arc(150, 70, 40, Math.PI, 0); g.lineTo(190, 170); g.closePath();
  g.fillStyle = '#7a5a3a'; g.fill(); g.clip();
  const cols = ['#4aa3e0', '#ffc94a', '#ec6f90', '#6cc070', '#9b7be8'];
  for (let y = 20; y < 180; y += 18) for (let x = 105; x < 200; x += 18) { g.fillStyle = rgba(cols[Math.floor(rand() * cols.length)], 0.85); g.fillRect(x + 1, y + 1, 16, 16); }
  g.strokeStyle = '#5a3d22'; g.lineWidth = 2;
  for (let y = 20; y < 180; y += 18) { g.beginPath(); g.moveTo(100, y); g.lineTo(200, y); g.stroke(); }
  for (let x = 105; x < 200; x += 18) { g.beginPath(); g.moveTo(x, 20); g.lineTo(x, 180); g.stroke(); }
  g.restore();
  g.beginPath(); g.moveTo(110, 170); g.lineTo(110, 70); g.arc(150, 70, 40, Math.PI, 0); g.lineTo(190, 170);
  g.strokeStyle = '#8c6a48'; g.lineWidth = 6; g.stroke();
  glow(g, 150, 110, 120, '#fff3c2', 0.35);
  // Piso
  g.fillStyle = linear(g, 0, H * 0.7, 0, H, [floor, dark(floor, 0.25)]);
  g.fillRect(0, H * 0.7, W, H * 0.3);
  g.strokeStyle = rgba(dark(floor, 0.4), 0.35); g.lineWidth = 1.2;
  for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(W / 2 + i * 14, H * 0.7); g.lineTo(W / 2 + i * 60, H); g.stroke(); }
  for (let y = H * 0.74; y < H; y += (y - H * 0.66) * 0.35) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
}
function bgPastel(g, rand, c1, c2, { pattern = 'dots' } = {}) {
  rect(g, radial(g, W / 2, H * 0.42, H * 0.7, [light(c1, 0.4), c1, c2]));
  g.save(); g.globalAlpha = 0.16; g.fillStyle = '#ffffff';
  if (pattern === 'dots') for (let y = 12; y < H; y += 24) for (let x = (y / 24) % 2 ? 12 : 0; x < W; x += 24) { circle(g, x, y, 3); g.fill(); }
  if (pattern === 'stars') for (let i = 0; i < 26; i++) sparkle(g, rand() * W, rand() * H, 5 + rand() * 6, '#ffffff', 0.9);
  if (pattern === 'hearts') for (let i = 0; i < 18; i++) heartShape(g, rand() * W, rand() * H, 5 + rand() * 6, '#ffffff');
  g.restore();
}

// ───────────── Objetos ─────────────
function crossShape(g, x, y, w, hgt, t) {
  g.beginPath();
  const a = t / 2, arm = hgt * 0.3;
  g.moveTo(x - a, y); g.lineTo(x + a, y); g.lineTo(x + a, y + arm - a); g.lineTo(x + w / 2, y + arm - a); g.lineTo(x + w / 2, y + arm + a);
  g.lineTo(x + a, y + arm + a); g.lineTo(x + a, y + hgt); g.lineTo(x - a, y + hgt); g.lineTo(x - a, y + arm + a); g.lineTo(x - w / 2, y + arm + a);
  g.lineTo(x - w / 2, y + arm - a); g.lineTo(x - a, y + arm - a); g.closePath();
}
function cross(g, x, y, w, hgt, t, kind = 'gold') {
  crossShape(g, x, y, w, hgt, t);
  const fill = kind === 'gold' ? linear(g, x - w / 2, y, x + w / 2, y + hgt, ['#fff1a8', '#f4c542', '#c98a12', '#ffe08a'])
    : kind === 'wood' ? linear(g, x - w / 2, y, x + w / 2, y + hgt, ['#b77b45', '#8a5428', '#6d3f1c'])
      : kind === 'white' ? linear(g, x - w / 2, y, x + w / 2, y + hgt, ['#ffffff', '#f2ece0']) : kind;
  ink(g, fill, kind === 'gold' ? '#9a6510' : kind === 'wood' ? '#4f2c12' : '#bfae94', 2.5);
}
function host(g, x, y, r, { rays: withRays = true, cross: withCross = true } = {}) {
  if (withRays) { rays(g, x, y, { n: 24, len: r * 3.2, color: '#fff3b0', a: 0.6, width: 0.4 }); glow(g, x, y, r * 2.2, '#fff6cf', 0.8); }
  circle(g, x, y, r);
  ink(g, radial(g, x, y, r, ['#ffffff', '#fffaf0', '#f3e7cf'], x - r * 0.3, y - r * 0.3), '#d8c39b', 1.6);
  circle(g, x, y, r * 0.86); g.strokeStyle = 'rgba(200,170,120,0.5)'; g.lineWidth = 1; g.stroke();
  if (withCross) { g.save(); g.globalAlpha = 0.55; crossShape(g, x, y - r * 0.55, r * 0.7, r * 1.1, r * 0.16); g.fillStyle = '#d7bf93'; g.fill(); g.restore(); }
}
function chalice(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const gold = linear(g, -50, 0, 50, 0, ['#9a6510', '#ffe58a', '#f4c542', '#fff4c0', '#c98a12', '#8a5a0c']);
  // Copa
  g.beginPath(); g.moveTo(-48, -60); g.bezierCurveTo(-48, -10, -20, 6, -8, 10); g.lineTo(8, 10); g.bezierCurveTo(20, 6, 48, -10, 48, -60); g.closePath(); ink(g, gold, '#7d5208', 2.5);
  ellipse(g, 0, -60, 48, 9); ink(g, linear(g, 0, -69, 0, -51, ['#8a1d2a', '#5c0f18']), '#7d5208', 2.5);
  // Nudo y pie
  g.beginPath(); g.moveTo(-6, 10); g.lineTo(-5, 52); g.lineTo(5, 52); g.lineTo(6, 10); ink(g, gold, '#7d5208', 2);
  ellipse(g, 0, 30, 13, 8); ink(g, gold, '#7d5208', 2);
  g.beginPath(); g.moveTo(-5, 50); g.bezierCurveTo(-16, 60, -38, 64, -42, 74); g.lineTo(42, 74); g.bezierCurveTo(38, 64, 16, 60, 5, 50); g.closePath(); ink(g, gold, '#7d5208', 2.5);
  ellipse(g, 0, 74, 42, 7); ink(g, gold, '#7d5208', 2);
  // Brillos
  g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 4; g.beginPath(); g.moveTo(-34, -50); g.quadraticCurveTo(-32, -20, -14, -2); g.stroke();
  // Cruz grabada
  g.save(); g.globalAlpha = 0.65; crossShape(g, 0, -42, 16, 26, 4); g.fillStyle = '#a8740f'; g.fill(); g.restore();
  g.restore();
}
function candle(g, x, y, s, { color = '#fffaf0', flame = true, hgt = 90 } = {}) {
  g.save(); g.translate(x, y); g.scale(s, s);
  if (flame) glow(g, 0, -hgt - 18, 60, '#ffcf6b', 0.75);
  g.beginPath(); g.moveTo(-13, -hgt); g.lineTo(13, -hgt); g.lineTo(13, 0); g.lineTo(-13, 0); g.closePath();
  ink(g, linear(g, -13, 0, 13, 0, [dark(color, 0.08), light(color, 0.3), color, dark(color, 0.15)]), dark(color, 0.35), 2);
  // gotas de cera
  g.fillStyle = light(color, 0.2); g.beginPath(); g.moveTo(-13, -hgt); g.quadraticCurveTo(-12, -hgt + 16, -8, -hgt + 18); g.quadraticCurveTo(-4, -hgt + 10, -3, -hgt); g.fill();
  if (flame) {
    g.strokeStyle = '#3d2b24'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -hgt); g.lineTo(0, -hgt - 6); g.stroke();
    g.beginPath(); g.moveTo(0, -hgt - 34); g.bezierCurveTo(10, -hgt - 18, 9, -hgt - 4, 0, -hgt - 4); g.bezierCurveTo(-9, -hgt - 4, -10, -hgt - 18, 0, -hgt - 34);
    g.fillStyle = radial(g, 0, -hgt - 12, 16, ['#ffffff', '#fff3a0', '#ffb43a', '#ff7a1a']); g.fill();
  }
  g.restore();
}
function dove(g, x, y, s, { flip = false, wingsUp = true } = {}) {
  g.save(); g.translate(x, y); g.scale(flip ? -s : s, s);
  const white = linear(g, 0, -40, 0, 40, ['#ffffff', '#f4f6ff', '#dfe5f5']);
  // ala trasera
  g.beginPath(); g.moveTo(-4, -4); g.bezierCurveTo(10, -50, 40, -70, 64, -64); g.bezierCurveTo(50, -50, 40, -30, 20, -6); g.closePath(); ink(g, linear(g, 0, -60, 0, 0, ['#e7ecf8', '#cfd8ec']), '#9aa7c4', 2);
  // cuerpo
  g.beginPath(); g.moveTo(-46, -6); g.bezierCurveTo(-40, -24, -18, -20, 4, -12); g.bezierCurveTo(30, -4, 46, 6, 64, 22); g.lineTo(50, 24); g.lineTo(58, 34); g.bezierCurveTo(30, 26, 0, 18, -24, 10); g.bezierCurveTo(-36, 6, -44, 2, -46, -6); g.closePath();
  ink(g, white, '#8f9bb8', 2.2);
  // cabeza
  circle(g, -40, -14, 13); ink(g, white, '#8f9bb8', 2.2);
  g.beginPath(); g.moveTo(-52, -16); g.lineTo(-64, -10); g.lineTo(-51, -8); g.closePath(); ink(g, '#f4a742', '#c47a1c', 1.5);
  g.fillStyle = '#2b2440'; circle(g, -42, -17, 2.6); g.fill(); g.fillStyle = '#fff'; circle(g, -43, -18, 0.9); g.fill();
  // ala delantera
  if (wingsUp) { g.beginPath(); g.moveTo(-10, -8); g.bezierCurveTo(-6, -60, 20, -86, 46, -92); g.bezierCurveTo(40, -70, 34, -44, 18, -4); g.closePath(); }
  else { g.beginPath(); g.moveTo(-14, -6); g.bezierCurveTo(10, -14, 36, -6, 52, 12); g.bezierCurveTo(30, 12, 6, 10, -14, -6); g.closePath(); }
  ink(g, linear(g, 0, -90, 0, 0, ['#ffffff', '#eef1fb']), '#8f9bb8', 2.2);
  g.strokeStyle = 'rgba(140,150,180,0.5)'; g.lineWidth = 1.4;
  for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(6 + i * 7, -12 - i * 4); g.lineTo(18 + i * 8, -52 - i * 8); g.stroke(); }
  g.restore();
}
function heartShape(g, x, y, s, fill) {
  g.save(); g.translate(x, y); g.scale(s / 10, s / 10);
  g.beginPath(); g.moveTo(0, 8); g.bezierCurveTo(-14, -2, -10, -14, 0, -7); g.bezierCurveTo(10, -14, 14, -2, 0, 8); g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  g.restore();
}
function book(g, x, y, s, { cover = '#8a2b2b', open = true } = {}) {
  g.save(); g.translate(x, y); g.scale(s, s);
  if (open) {
    g.fillStyle = 'rgba(60,30,10,0.25)'; ellipse(g, 0, 40, 92, 12); g.fill();
    g.beginPath(); g.moveTo(-90, -40); g.quadraticCurveTo(-45, -52, 0, -38); g.quadraticCurveTo(45, -52, 90, -40); g.lineTo(90, 36); g.quadraticCurveTo(45, 24, 0, 38); g.quadraticCurveTo(-45, 24, -90, 36); g.closePath();
    ink(g, cover, dark(cover, 0.5), 2.5);
    for (const sgn of [-1, 1]) {
      g.beginPath(); g.moveTo(0, -34); g.quadraticCurveTo(sgn * 42, -48, sgn * 84, -36); g.lineTo(sgn * 84, 30); g.quadraticCurveTo(sgn * 42, 20, 0, 32); g.closePath();
      ink(g, linear(g, sgn * 84, 0, 0, 0, ['#fffaf0', '#fbf0d9', '#e9d7b4']), '#c9b28a', 1.5);
      g.strokeStyle = 'rgba(120,90,60,0.35)'; g.lineWidth = 2;
      for (let i = 0; i < 6; i++) { const yy = -22 + i * 9; g.beginPath(); g.moveTo(sgn * 14, yy + 2); g.quadraticCurveTo(sgn * 42, yy - 8 + i * 0.5, sgn * 72, yy); g.stroke(); }
    }
    g.fillStyle = '#c0392b'; g.beginPath(); g.moveTo(-3, 30); g.lineTo(3, 30); g.lineTo(4, 62); g.lineTo(0, 56); g.lineTo(-4, 62); g.closePath(); g.fill();
  } else {
    rr(g, -60, -76, 120, 152, 8); ink(g, linear(g, -60, 0, 60, 0, [dark(cover, 0.2), cover, light(cover, 0.1)]), dark(cover, 0.5), 2.5);
    rr(g, -50, -66, 100, 132, 4); g.strokeStyle = '#f4c542'; g.lineWidth = 2; g.stroke();
    cross(g, 0, -40, 36, 60, 9, 'gold');
  }
  g.restore();
}
function bell(g, x, y, s, swing = 0.25) {
  g.save(); g.translate(x, y); g.rotate(swing); g.scale(s, s);
  g.strokeStyle = '#6b4a2a'; g.lineWidth = 6; g.beginPath(); g.moveTo(0, -95); g.lineTo(0, -70); g.stroke();
  g.beginPath(); g.moveTo(-10, -72); g.bezierCurveTo(-34, -70, -36, -40, -40, -6); g.bezierCurveTo(-44, 14, -56, 22, -60, 30); g.lineTo(60, 30); g.bezierCurveTo(56, 22, 44, 14, 40, -6); g.bezierCurveTo(36, -40, 34, -70, 10, -72); g.closePath();
  ink(g, linear(g, -60, 0, 60, 0, ['#7a4a12', '#e7b54f', '#ffe9a6', '#d39a35', '#6d3f0c']), '#5a3508', 3);
  ellipse(g, 0, 30, 60, 9); ink(g, linear(g, 0, 22, 0, 38, ['#b07a26', '#6d3f0c']), '#5a3508', 2);
  g.fillStyle = '#8a5a1a'; circle(g, 8, 40, 10); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 5; g.beginPath(); g.moveTo(-22, -54); g.quadraticCurveTo(-28, -20, -34, 6); g.stroke();
  g.strokeStyle = '#a06a1c'; g.lineWidth = 2; g.beginPath(); g.moveTo(-44, 14); g.lineTo(44, 14); g.stroke();
  g.restore();
}
function rosary(g, cx, cy, rx, ry, rand) {
  const n = 46;
  g.save();
  for (let i = 0; i < n; i++) {
    const a = Math.PI / 2 + (i / n) * TAU * 0.92 + 0.25;
    const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
    const big = i % 11 === 0;
    circle(g, x, y, big ? 6.5 : 4.6);
    ink(g, radial(g, x, y, big ? 7 : 5, ['#e9f3ff', '#7aa7e8', '#3a5fae'], x - 2, y - 2), '#284480', 1.2);
  }
  const bx = cx, by = cy + ry + 4;
  g.strokeStyle = '#c9a04a'; g.lineWidth = 2; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx, by + 44); g.stroke();
  for (let i = 0; i < 3; i++) { circle(g, bx, by + 12 + i * 10, 4.6); ink(g, radial(g, bx, by + 12 + i * 10, 5, ['#e9f3ff', '#7aa7e8', '#3a5fae']), '#284480', 1.2); }
  ellipse(g, bx, by + 2, 9, 7); ink(g, '#f4c542', '#9a6510', 1.5);
  cross(g, bx, by + 46, 30, 46, 7, 'gold');
  g.restore();
}
function monstrance(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * TAU, long = i % 2 === 0 ? 92 : 70;
    g.beginPath(); g.moveTo(Math.cos(a - 0.05) * 40, Math.sin(a - 0.05) * 40); g.lineTo(Math.cos(a) * long, Math.sin(a) * long); g.lineTo(Math.cos(a + 0.05) * 40, Math.sin(a + 0.05) * 40); g.closePath();
    ink(g, linear(g, 0, -90, 0, 90, ['#fff1a8', '#f4c542', '#c98a12']), '#9a6510', 1.2);
  }
  circle(g, 0, 0, 42); ink(g, linear(g, -40, -40, 40, 40, ['#fff1a8', '#d9a21b', '#fff1a8']), '#9a6510', 2.5);
  host(g, 0, 0, 30, { rays: false });
  cross(g, 0, -126, 26, 38, 7, 'gold');
  g.beginPath(); g.moveTo(-6, 44); g.lineTo(-7, 110); g.lineTo(7, 110); g.lineTo(6, 44); ink(g, linear(g, -7, 0, 7, 0, ['#c98a12', '#fff1a8', '#c98a12']), '#9a6510', 2);
  ellipse(g, 0, 76, 12, 7); ink(g, '#f4c542', '#9a6510', 2);
  g.beginPath(); g.moveTo(-7, 108); g.bezierCurveTo(-20, 116, -46, 118, -50, 130); g.lineTo(50, 130); g.bezierCurveTo(46, 118, 20, 116, 7, 108); g.closePath(); ink(g, linear(g, -50, 0, 50, 0, ['#9a6510', '#fff1a8', '#d9a21b', '#9a6510']), '#7d5208', 2.5);
  g.restore();
}
function wheat(g, x, y, s, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.strokeStyle = '#c98a2a'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-2, -60, 0, -112); g.stroke();
  for (let i = 0; i < 8; i++) for (const sg of [-1, 1]) {
    ellipse(g, sg * 6, -104 + i * 8.5, 4.6, 8.5, -sg * 0.5); ink(g, linear(g, 0, -10, 0, 10, ['#ffe08a', '#e3a83a']), '#a8701c', 1.1);
  }
  ellipse(g, 0, -116, 4.2, 9); ink(g, '#ffe08a', '#a8701c', 1.1);
  g.strokeStyle = 'rgba(201,138,42,0.8)'; g.lineWidth = 1; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(0, -112 + i * 10); g.lineTo((i % 2 ? 1 : -1) * 12, -128 + i * 10); g.stroke(); }
  g.restore();
}
function grapes(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = '#5aa64f'; g.beginPath(); g.moveTo(0, -30); g.bezierCurveTo(20, -50, 40, -30, 30, -18); g.bezierCurveTo(20, -26, 10, -24, 0, -30); g.fill();
  const rows = [[-15, 0, 15], [-22, -7, 8, 23], [-15, 0, 15], [-7, 8], [0]];
  rows.forEach((row, j) => row.forEach(px => { circle(g, px, -14 + j * 13, 8); ink(g, radial(g, px, -14 + j * 13, 9, ['#c8a2f5', '#7a3fb5', '#4c1f7c'], px - 3, -17 + j * 13), '#3b1663', 1.2); }));
  g.restore();
}

// ───────────── Personajes (estilo dibujo animado, cabeza grande) ─────────────
const SKIN = { a: '#e2ad84', b: '#cf9367', c: '#b27650' };
function person(g, x, y, s, o = {}) {
  const {
    skin = SKIN.b, hair = '#3a2418', hairStyle = 'short', robe = '#ffffff', robe2 = null, stole = null, stoleDiag = false,
    collar = false, surplice = false, arms = 'down', face = 'smile', halo = false, beard = false, mantle = null, held = null, head = 1, cheeks = true, after = null,
  } = o;
  g.save(); g.translate(x, y); g.scale(s, s);
  const hy = -158, hr = 38 * head;
  if (halo) { glow(g, 0, hy, 76, '#fff1a8', 0.8); circle(g, 0, hy - 4, hr + 14); g.strokeStyle = 'rgba(244,197,66,0.95)'; g.lineWidth = 5; g.stroke(); }
  // Pelo de atrás
  if (hairStyle === 'long' || hairStyle === 'veil' || hairStyle === 'bun-long') {
    g.beginPath(); g.moveTo(-hr - 2, hy); g.quadraticCurveTo(-hr - 6, hy + 56, -hr + 6, hy + 66); g.lineTo(hr - 6, hy + 66); g.quadraticCurveTo(hr + 6, hy + 56, hr + 2, hy); g.arc(0, hy, hr + 2, 0, Math.PI, true); g.closePath();
    ink(g, hairStyle === 'veil' ? linear(g, 0, hy - 40, 0, hy + 70, ['#ffffff', '#eef0f8']) : hair, hairStyle === 'veil' ? '#bcc3d6' : dark(hair, 0.4), 2.5);
  }
  // Pies
  g.fillStyle = '#3d2b24'; ellipse(g, -14, -4, 12, 6); g.fill(); ellipse(g, 14, -4, 12, 6); g.fill();
  // Túnica
  const robeFill = linear(g, -42, 0, 42, 0, [dark(robe, 0.1), light(robe, 0.25), robe, dark(robe, 0.14)]);
  g.beginPath(); g.moveTo(-13, -124); g.quadraticCurveTo(-30, -122, -33, -108); g.lineTo(-43, -8); g.quadraticCurveTo(0, -2, 43, -8); g.lineTo(33, -108); g.quadraticCurveTo(30, -122, 13, -124); g.closePath();
  ink(g, robeFill, dark(robe, 0.45), 2.6);
  if (robe2) { g.save(); g.clip(); g.fillStyle = robe2; g.fillRect(-50, -60, 100, 60); g.restore(); }
  if (surplice) {
    g.beginPath(); g.moveTo(-30, -116); g.lineTo(-40, -44); g.quadraticCurveTo(0, -36, 40, -44); g.lineTo(30, -116); g.closePath(); ink(g, linear(g, 0, -116, 0, -44, ['#ffffff', '#f1f2f8']), '#b8bccd', 2);
    g.fillStyle = 'rgba(180,185,205,0.55)'; for (let i = -36; i <= 36; i += 8) { circle(g, i, -42 + Math.abs(i) * 0.05, 2.4); g.fill(); }
  }
  if (mantle) {
    g.beginPath(); g.moveTo(-30, -116); g.quadraticCurveTo(-8, -84, 18, -40); g.quadraticCurveTo(30, -26, 42, -12); g.lineTo(34, -106); g.quadraticCurveTo(10, -128, -30, -116); g.closePath();
    ink(g, linear(g, -30, -120, 40, -10, [light(mantle, 0.15), mantle, dark(mantle, 0.25)]), dark(mantle, 0.5), 2.4);
  }
  if (stole) {
    if (stoleDiag) { g.beginPath(); g.moveTo(-24, -120); g.lineTo(-12, -122); g.lineTo(34, -40); g.lineTo(26, -34); g.closePath(); ink(g, stole, dark(stole, 0.45), 2); }
    else for (const sg of [-1, 1]) { g.beginPath(); g.moveTo(sg * 6, -124); g.lineTo(sg * 16, -124); g.lineTo(sg * 18, -30); g.lineTo(sg * 8, -30); g.closePath(); ink(g, stole, dark(stole, 0.45), 2); cross(g, sg * 13, -48, 8, 12, 2.4, 'gold'); }
  }
  if (collar) { g.fillStyle = '#ffffff'; rr(g, -7, -126, 14, 8, 2); g.fill(); g.strokeStyle = '#b8bccd'; g.lineWidth = 1; g.stroke(); }
  // Brazos y manos
  const HANDS = {
    down: [[-40, -58], [40, -58]], pray: [[-4, -92], [4, -92]], up: [[-64, -176], [64, -176]], open: [[-66, -118], [66, -118]],
    hold: [[-16, -82], [16, -82]], candle: [[-50, -84], [-30, -76]], wave: [[-40, -58], [54, -168]], point: [[-40, -58], [72, -112]], give: [[-16, -84], [44, -104]],
  };
  const hands = HANDS[arms] || HANDS.down;
  const sh = [[-28, -110], [28, -110]];
  const sleeve = mantle && arms === 'up' ? robe : robe;
  for (let i = 0; i < 2; i++) {
    g.lineCap = 'round';
    g.strokeStyle = dark(sleeve, 0.45); g.lineWidth = 23; g.beginPath(); g.moveTo(...sh[i]); g.lineTo(...hands[i]); g.stroke();
    g.strokeStyle = i ? dark(sleeve, 0.06) : light(sleeve, 0.12); g.lineWidth = 18.5; g.beginPath(); g.moveTo(...sh[i]); g.lineTo(...hands[i]); g.stroke();
  }
  if (held) held(g);
  for (const [hx, hy2] of hands) { circle(g, hx, hy2, 9); ink(g, skin, dark(skin, 0.4), 2); }
  // Cabeza
  circle(g, 0, hy, hr); ink(g, radial(g, 0, hy, hr, [light(skin, 0.18), skin, dark(skin, 0.1)], -10, hy - 12), dark(skin, 0.42), 2.6);
  circle(g, -hr + 1, hy + 4, 7); ink(g, skin, dark(skin, 0.42), 2); circle(g, hr - 1, hy + 4, 7); ink(g, skin, dark(skin, 0.42), 2);
  circle(g, 0, hy, hr - 1.5); g.fillStyle = radial(g, 0, hy, hr, [light(skin, 0.18), skin, dark(skin, 0.08)], -10, hy - 12); g.fill();
  if (beard) {
    g.beginPath(); g.moveTo(-hr + 6, hy + 2); g.quadraticCurveTo(-hr + 4, hy + hr + 6, 0, hy + hr + 12); g.quadraticCurveTo(hr - 4, hy + hr + 6, hr - 6, hy + 2); g.quadraticCurveTo(hr - 12, hy + 22, 0, hy + 24); g.quadraticCurveTo(-hr + 12, hy + 22, -hr + 6, hy + 2); g.closePath();
    ink(g, hair, dark(hair, 0.4), 2);
  }
  // Cara
  const ey = hy + 2;
  if (face === 'closed' || face === 'pray') {
    g.strokeStyle = '#2b1d18'; g.lineWidth = 3; g.lineCap = 'round';
    for (const sg of [-1, 1]) { g.beginPath(); g.arc(sg * 13 * head, ey, 6, Math.PI * 0.15, Math.PI * 0.85); g.stroke(); }
  } else {
    for (const sg of [-1, 1]) {
      ellipse(g, sg * 13 * head, ey, 4.6, 6); g.fillStyle = '#2b1d18'; g.fill();
      circle(g, sg * 13 * head - 1.4, ey - 2.4, 1.7); g.fillStyle = '#ffffff'; g.fill();
    }
  }
  g.strokeStyle = rgba(dark(hair, 0.2), 0.8); g.lineWidth = 2.4;
  for (const sg of [-1, 1]) { g.beginPath(); g.moveTo(sg * 8 * head, ey - 11); g.quadraticCurveTo(sg * 13 * head, ey - 14, sg * 19 * head, ey - 11); g.stroke(); }
  if (cheeks) { g.fillStyle = 'rgba(240,110,110,0.33)'; ellipse(g, -22 * head, ey + 10, 7, 4.5); g.fill(); ellipse(g, 22 * head, ey + 10, 7, 4.5); g.fill(); }
  g.strokeStyle = '#7a3b2a'; g.lineWidth = 2.6; g.lineCap = 'round';
  if (face === 'talk') { g.beginPath(); g.ellipse(0, ey + 16, 6, 4.6, 0, 0, TAU); g.fillStyle = '#8a3b33'; g.fill(); }
  else { g.beginPath(); g.arc(0, ey + 9, 8, Math.PI * 0.2, Math.PI * 0.8); g.stroke(); }
  // Pelo de adelante
  g.save();
  if (hairStyle === 'short' || hairStyle === 'long' || hairStyle === 'bun' || hairStyle === 'bun-long') {
    g.beginPath(); g.moveTo(-hr - 1, hy + 2); g.bezierCurveTo(-hr - 4, hy - hr - 8, hr + 4, hy - hr - 8, hr + 1, hy + 2);
    g.quadraticCurveTo(hr - 6, hy - 18, hr * 0.3, hy - 22); g.quadraticCurveTo(0, hy - 14, -hr * 0.2, hy - 22); g.quadraticCurveTo(-hr + 4, hy - 20, -hr - 1, hy + 2); g.closePath();
    ink(g, linear(g, 0, hy - hr, 0, hy, [light(hair, 0.18), hair]), dark(hair, 0.45), 2.4);
    if (hairStyle === 'bun' || hairStyle === 'bun-long') { circle(g, 0, hy - hr - 6, 15); ink(g, hair, dark(hair, 0.45), 2.4); }
  } else if (hairStyle === 'white') {
    for (const sg of [-1, 1]) { g.beginPath(); g.moveTo(sg * (hr - 6), hy - 24); g.quadraticCurveTo(sg * (hr + 14), hy - 6, sg * (hr + 6), hy + 30); g.quadraticCurveTo(sg * (hr - 2), hy + 14, sg * (hr - 8), hy - 2); g.closePath(); ink(g, '#eef0f4', '#a9adb8', 2); }
    g.beginPath(); g.moveTo(-hr + 4, hy - 20); g.quadraticCurveTo(0, hy - hr - 10, hr - 4, hy - 20); g.quadraticCurveTo(0, hy - hr + 4, -hr + 4, hy - 20); ink(g, '#f4f5f8', '#a9adb8', 2);
  } else if (hairStyle === 'veil') {
    g.beginPath(); g.moveTo(-hr - 4, hy + 6); g.bezierCurveTo(-hr - 6, hy - hr - 10, hr + 6, hy - hr - 10, hr + 4, hy + 6); g.quadraticCurveTo(hr - 8, hy - 20, 0, hy - 24); g.quadraticCurveTo(-hr + 8, hy - 20, -hr - 4, hy + 6); g.closePath();
    ink(g, linear(g, 0, hy - hr, 0, hy, ['#ffffff', '#eef0f8']), '#bcc3d6', 2);
    for (let i = -3; i <= 3; i++) flower(g, i * 10, hy - hr + Math.abs(i) * 3 - 2, 0.6, i % 2 ? '#ffd0dc' : '#ffffff', '#ffcf3a');
  } else if (hairStyle === 'cap') {
    g.beginPath(); g.arc(0, hy - 6, hr + 1, Math.PI * 1.08, Math.PI * 1.92); g.closePath(); ink(g, hair, dark(hair, 0.45), 2.4);
  }
  g.restore();
  if (after) after(g);
  g.restore();
}

// ───────────── Escenas ─────────────
const scenes = {
  risen(g, r) {
    bgGold(g, r, { cy: H * 0.32 });
    glow(g, W / 2, H * 0.36, 150, '#ffffff', 0.55);
    for (let i = 0; i < 2; i++) cloud(g, 60 + i * 180, H * 0.86, 1.3, 0.95);
    person(g, W / 2, H * 0.86, 1.18, { skin: SKIN.b, hair: '#5a3622', hairStyle: 'long', beard: true, robe: '#ffffff', mantle: '#c8202f', arms: 'up', face: 'closed', halo: true, head: 0.94 });
    cloud(g, W / 2, H * 0.95, 1.6, 1);
    sparkles(g, r, 10, { color: '#fffbe6', min: 4, max: 9 });
  },
  tomb(g, r) {
    bgDawn(g, r);
    andes(g, H * 0.62, { far: '#8d8fc8', near: '#6aa060', rand: r });
    // Roca con la cueva
    g.beginPath(); g.moveTo(10, H * 0.78); g.bezierCurveTo(30, H * 0.4, 230, H * 0.36, 292, H * 0.76); g.closePath();
    ink(g, linear(g, 0, H * 0.4, 0, H * 0.8, ['#b9a48a', '#8b7560', '#6c5845']), '#4f3f30', 3);
    ellipse(g, 140, H * 0.66, 42, 50); ink(g, radial(g, 140, H * 0.7, 60, ['#fff4cc', '#e9c77a', '#6c5845']), '#4f3f30', 2.5);
    glow(g, 140, H * 0.66, 70, '#fff3c2', 0.8);
    // Piedra corrida
    circle(g, 222, H * 0.7, 40); ink(g, radial(g, 222, H * 0.7, 42, ['#cdbca5', '#9a8670', '#76634f'], 210, H * 0.66), '#4f3f30', 3);
    g.strokeStyle = 'rgba(80,60,40,0.45)'; g.lineWidth = 2; g.beginPath(); g.moveTo(204, H * 0.62); g.lineTo(214, H * 0.66); g.lineTo(208, H * 0.7); g.moveTo(236, H * 0.74); g.lineTo(244, H * 0.7); g.stroke();
    g.fillStyle = linear(g, 0, H * 0.78, 0, H, ['#6aa060', '#457a3e']); g.fillRect(0, H * 0.78, W, H * 0.22);
    grass(g, r, H * 0.78, 60, '#3f7f3a');
    lily(g, 40, H * 0.84, 1.0); lily(g, 70, H * 0.88, 0.8); lily(g, 262, H * 0.86, 0.95);
    sparkles(g, r, 6, { color: '#fffbe6', y1: H * 0.5 });
  },
  paschal(g, r) {
    bgChurch(g, r, { wall: '#efe2cf' });
    g.fillStyle = 'rgba(40,20,10,0.35)'; g.fillRect(0, 0, W, H);
    glow(g, W / 2, 96, 150, '#ffcf6b', 0.75);
    candle(g, W / 2, 330, 1.25, { hgt: 190, color: '#fffaf0' });
    // Decoración del cirio
    g.save(); g.translate(W / 2, 330 - 1.25 * 110);
    cross(g, 0, -40, 26, 56, 6, '#d63031');
    label(g, 'Α', -2, -60, { size: 20, color: '#c0392b', font: 'Nunito' });
    label(g, 'Ω', 0, 30, { size: 20, color: '#c0392b', font: 'Nunito' });
    for (const [px, py] of [[0, -40 + 17], [-10, -40 + 17], [10, -40 + 17], [0, -40 + 6], [0, -40 + 30]]) { circle(g, px, py, 2.6); g.fillStyle = '#9a1f1f'; g.fill(); }
    g.restore();
    // Candelero
    g.beginPath(); g.moveTo(W / 2 - 34, 330); g.lineTo(W / 2 + 34, 330); g.lineTo(W / 2 + 18, 350); g.lineTo(W / 2 + 22, 392); g.lineTo(W / 2 - 22, 392); g.lineTo(W / 2 - 18, 350); g.closePath();
    ink(g, linear(g, W / 2 - 34, 0, W / 2 + 34, 0, ['#8a5a0c', '#ffe58a', '#c98a12', '#8a5a0c']), '#5a3508', 2.5);
    lily(g, 58, 392, 1.1); lily(g, 244, 392, 1.1);
    bokeh(g, r, { n: 14, color: '#ffd27a', y1: H * 0.6 });
  },
  alleluia(g, r) {
    bgDawn(g, r);
    andes(g, H * 0.66, { far: '#a99ad6', near: '#7ab66a', rand: r });
    // Cruz vacía con el paño blanco
    cross(g, W / 2, 96, 96, 170, 14, 'wood');
    g.beginPath(); g.moveTo(W / 2 - 46, 140); g.quadraticCurveTo(W / 2, 168, W / 2 + 46, 140); g.lineTo(W / 2 + 36, 196); g.quadraticCurveTo(W / 2 + 26, 160, W / 2 + 8, 172); g.lineTo(W / 2 - 8, 172); g.quadraticCurveTo(W / 2 - 26, 160, W / 2 - 36, 196); g.closePath();
    ink(g, linear(g, 0, 140, 0, 196, ['#ffffff', '#eef0f8']), '#b8bccd', 2);
    for (let i = 0; i < 9; i++) flower(g, 30 + i * 30 + r() * 10, H * 0.86 + r() * 30, 1 + r() * 0.5, ['#ffffff', '#ffd0dc', '#ffe58a'][i % 3]);
    banner(g, '¡Aleluya!', W / 2, 46, 210, { color: '#e2643a', size: 30 });
    sparkles(g, r, 8, { color: '#fffbe6' });
  },
  bell(g, r) {
    bgSky(g, r, { mountains: true, hills: '#86c172' });
    // Arco del campanario
    g.beginPath(); g.moveTo(52, 400); g.lineTo(52, 130); g.arc(150, 130, 98, Math.PI, 0); g.lineTo(248, 400); g.lineTo(220, 400); g.lineTo(220, 140); g.arc(150, 140, 70, 0, Math.PI, true); g.lineTo(80, 400); g.closePath();
    ink(g, linear(g, 52, 0, 248, 0, ['#d98a73', '#f3b39c', '#e09a82']), '#9c5a46', 3);
    bell(g, 150, 210, 1.25, 0.3);
    g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 4; g.lineCap = 'round';
    for (const k of [1, 2]) { g.beginPath(); g.arc(150, 230, 70 + k * 18, -0.4, 0.4); g.stroke(); g.beginPath(); g.arc(150, 230, 70 + k * 18, Math.PI - 0.4, Math.PI + 0.4); g.stroke(); }
    label(g, '¡Tilín, tolón!', 150, 362, { size: 30, color: '#ffffff', stroke: '#c0392b', sw: 7 });
    for (const [nx, ny] of [[40, 200], [258, 180], [70, 300]]) label(g, '♪', nx, ny, { size: 28, color: '#ffffff', stroke: '#7556c9', sw: 5 });
  },
  doors(g, r) {
    rect(g, linear(g, 0, 0, 0, H, ['#f4b9a3', '#ef9b80']));
    // Fachada
    g.fillStyle = '#e58f73'; g.fillRect(0, 0, W, H * 0.82);
    for (let y = 18; y < H * 0.8; y += 22) { g.strokeStyle = 'rgba(160,80,60,0.18)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    // Arco
    g.beginPath(); g.moveTo(54, H * 0.8); g.lineTo(54, 150); g.arc(150, 150, 96, Math.PI, 0); g.lineTo(246, H * 0.8); g.closePath();
    ink(g, '#fff1e4', '#b66a52', 4);
    g.beginPath(); g.moveTo(70, H * 0.8); g.lineTo(70, 152); g.arc(150, 152, 80, Math.PI, 0); g.lineTo(230, H * 0.8); g.closePath();
    g.fillStyle = radial(g, 150, 200, 170, ['#fffbe8', '#ffe9a8', '#f2c46b']); g.fill();
    glow(g, 150, 210, 120, '#fff6cf', 0.8);
    // Altar al fondo
    g.fillStyle = 'rgba(200,140,60,0.55)'; g.fillRect(118, 232, 64, 32); cross(g, 150, 170, 26, 52, 6, 'gold');
    // Puertas abiertas
    for (const sg of [-1, 1]) {
      g.beginPath(); const ox = sg < 0 ? 70 : 230;
      g.moveTo(ox, 152 + 10); g.lineTo(ox - sg * 40, 132); g.lineTo(ox - sg * 40, H * 0.86); g.lineTo(ox, H * 0.8); g.closePath();
      ink(g, linear(g, ox, 0, ox - sg * 40, 0, ['#8a5428', '#b77b45', '#6d3f1c']), '#4f2c12', 3);
      g.strokeStyle = 'rgba(60,30,10,0.4)'; g.lineWidth = 2;
      for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(ox - sg * 10 * k, 150 - k * 5); g.lineTo(ox - sg * 10 * k, H * 0.8 + k * 1.5); g.stroke(); }
      circle(g, ox - sg * 32, 250, 4); g.fillStyle = '#f4c542'; g.fill();
    }
    // Escalones
    for (let k = 0; k < 3; k++) { g.fillStyle = k % 2 ? '#d8cdbf' : '#e9e0d3'; g.fillRect(20 - k * 10, H * 0.8 + k * 14 + 6, W - 40 + k * 20, 14); }
    // Pila de agua bendita
    g.beginPath(); g.moveTo(20, 236); g.quadraticCurveTo(36, 260, 52, 236); g.closePath(); ink(g, '#e9e0d3', '#9b8f80', 2);
    g.fillStyle = '#8cc8f0'; ellipse(g, 36, 238, 14, 3); g.fill();
    sparkles(g, r, 7, { color: '#ffffff', x0: 90, x1: 210, y0: 130, y1: 300 });
  },
  altar(g, r) {
    bgChurch(g, r);
    glow(g, 150, 220, 160, '#fff1c4', 0.5);
    cross(g, 150, 92, 70, 120, 11, 'gold');
    // Mesa
    g.fillStyle = 'rgba(70,40,20,0.25)'; ellipse(g, 150, 352, 140, 14); g.fill();
    rr(g, 34, 236, 232, 116, 6); ink(g, linear(g, 0, 236, 0, 352, ['#ffffff', '#f6f1e6', '#e6ddc8']), '#b9ab90', 2.5);
    g.fillStyle = '#ffffff'; g.fillRect(28, 230, 244, 22); g.strokeStyle = '#b9ab90'; g.strokeRect(28, 230, 244, 22);
    g.fillStyle = '#ffffff'; for (let x = 32; x < 270; x += 12) { g.beginPath(); g.arc(x + 6, 252, 6, 0, Math.PI); g.fill(); }
    // Frontal verde con cruz
    rr(g, 112, 262, 76, 74, 6); ink(g, linear(g, 0, 262, 0, 336, ['#4caf6e', '#2f7d4a']), '#1f5a33', 2);
    cross(g, 150, 272, 28, 52, 7, 'gold');
    candle(g, 66, 230, 0.62, { hgt: 90 }); candle(g, 234, 230, 0.62, { hgt: 90 });
    for (const fx of [104, 196]) { for (let i = 0; i < 6; i++) flower(g, fx + (r() - 0.5) * 26, 214 + (r() - 0.5) * 16, 0.9, i % 2 ? '#ffffff' : '#ffd0dc'); }
    book(g, 150, 218, 0.32);
    bokeh(g, r, { n: 10, color: '#ffe3a1', y1: H * 0.55 });
  },
  tabernacle(g, r) {
    rect(g, radial(g, 150, 180, 300, ['#7b1f2a', '#4d0f17', '#2a070c']));
    rays(g, 150, 190, { n: 20, color: '#ffd77a', a: 0.3 });
    bokeh(g, r, { n: 16, color: '#ffcf6b', a: 0.3 });
    // Lámpara del Santísimo
    g.strokeStyle = '#c9a04a'; g.lineWidth = 2; g.beginPath(); g.moveTo(246, 0); g.lineTo(246, 64); g.stroke();
    glow(g, 246, 82, 50, '#ff5a4a', 0.85);
    g.beginPath(); g.moveTo(232, 66); g.lineTo(260, 66); g.lineTo(254, 98); g.lineTo(238, 98); g.closePath(); ink(g, linear(g, 0, 66, 0, 98, ['#ff6b5a', '#b81d1d']), '#7a1010', 2);
    // Sagrario
    const gold = linear(g, 80, 0, 220, 0, ['#9a6510', '#ffe58a', '#f4c542', '#fff4c0', '#c98a12', '#8a5a0c']);
    g.beginPath(); g.moveTo(92, 140); g.quadraticCurveTo(150, 84, 208, 140); g.closePath(); ink(g, gold, '#7d5208', 3);
    cross(g, 150, 62, 30, 46, 8, 'gold');
    rr(g, 86, 138, 128, 150, 8); ink(g, gold, '#7d5208', 3);
    rr(g, 104, 158, 92, 112, 6); ink(g, linear(g, 104, 158, 196, 270, ['#fff1a8', '#e2b03a', '#fff1a8']), '#9a6510', 2.5);
    glow(g, 150, 200, 50, '#ffffff', 0.4);
    chalice(g, 150, 212, 0.42);
    host(g, 150, 176, 10, { rays: false });
    circle(g, 186, 214, 4); g.fillStyle = '#7d5208'; g.fill();
    // Base y mantel
    rr(g, 60, 288, 180, 20, 4); ink(g, gold, '#7d5208', 2.5);
    g.fillStyle = linear(g, 0, 306, 0, H, ['#ffffff', '#ece4d2']); g.fillRect(20, 306, 260, 94);
    g.fillStyle = '#c0392b'; g.fillRect(20, 306, 260, 8);
    candle(g, 40, 306, 0.55, { hgt: 80 }); candle(g, 260, 306, 0.55, { hgt: 80 });
    sparkles(g, r, 8, { color: '#fff4c0', y1: 300 });
  },
  font(g, r) {
    bgChurch(g, r, { wall: '#e8f2fb', floor: '#b7c4d4' });
    glow(g, 150, 120, 140, '#ffffff', 0.5);
    dove(g, 150, 92, 0.62, { flip: true });
    rays(g, 150, 100, { n: 14, color: '#ffffff', a: 0.3, len: 260 });
    // Pila
    g.beginPath(); g.moveTo(54, 214); g.bezierCurveTo(60, 290, 110, 300, 150, 300); g.bezierCurveTo(190, 300, 240, 290, 246, 214); g.closePath();
    ink(g, linear(g, 54, 0, 246, 0, ['#b9b4ac', '#f0ede8', '#d9d4cc', '#a9a49c']), '#7d7870', 3);
    ellipse(g, 150, 214, 96, 20); ink(g, linear(g, 0, 196, 0, 234, ['#e9e6e0', '#b9b4ac']), '#7d7870', 2.5);
    ellipse(g, 150, 216, 84, 14); g.fillStyle = radial(g, 150, 214, 90, ['#d8f1ff', '#7cc8f5', '#3a8fd0']); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.6; for (const k of [20, 40, 60]) { g.beginPath(); g.ellipse(150, 216, k, k * 0.16, 0, 0, TAU); g.stroke(); }
    g.beginPath(); g.moveTo(130, 300); g.lineTo(124, 356); g.lineTo(176, 356); g.lineTo(170, 300); ink(g, linear(g, 124, 0, 176, 0, ['#b9b4ac', '#f0ede8', '#a9a49c']), '#7d7870', 2.5);
    rr(g, 96, 352, 108, 22, 5); ink(g, linear(g, 96, 0, 204, 0, ['#b9b4ac', '#f0ede8', '#a9a49c']), '#7d7870', 2.5);
    // Concha con agua cayendo
    g.save(); g.translate(206, 150); g.rotate(-0.5);
    g.beginPath(); g.moveTo(0, 0); for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * Math.PI; g.lineTo(Math.cos(a) * 30, Math.sin(a) * 26); } g.closePath();
    ink(g, linear(g, -30, -26, 30, 0, ['#fff3e6', '#f3c9b0']), '#b88a72', 2);
    g.strokeStyle = 'rgba(184,138,114,0.7)'; g.lineWidth = 1.2; for (let i = 1; i < 8; i++) { const a = Math.PI + (i / 8) * Math.PI; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 28, Math.sin(a) * 24); g.stroke(); }
    g.restore();
    g.strokeStyle = 'rgba(124,200,245,0.9)'; g.lineWidth = 4; g.lineCap = 'round'; for (const k of [0, 6, 12]) { g.beginPath(); g.moveTo(186 + k * 0.4, 164 + k); g.quadraticCurveTo(178, 186, 176 - k * 0.3, 204); g.stroke(); }
    sparkles(g, r, 9, { color: '#ffffff', y0: 150, y1: 240, x0: 70, x1: 230, min: 3, max: 7 });
  },
  confessional(g, r) {
    bgChurch(g, r, { wall: '#efe0f6', floor: '#b99a7a' });
    // Mueble
    const wood = linear(g, 30, 0, 270, 0, ['#6d3f1c', '#a06a3a', '#8a5428', '#6d3f1c']);
    g.beginPath(); g.moveTo(30, 360); g.lineTo(30, 130); g.quadraticCurveTo(150, 70, 270, 130); g.lineTo(270, 360); g.closePath(); ink(g, wood, '#3e220d', 3);
    cross(g, 150, 70, 26, 40, 7, 'gold');
    // Tres arcos: cortinas a los lados, puerta al centro
    const arch = (x, w, top) => { g.beginPath(); g.moveTo(x, 350); g.lineTo(x, top + w / 2); g.arc(x + w / 2, top + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, 350); g.closePath(); };
    arch(42, 64, 150); ink(g, linear(g, 42, 0, 106, 0, ['#6b3fa0', '#9b7be8', '#6b3fa0']), '#3e2466', 2.5);
    arch(194, 64, 150); ink(g, linear(g, 194, 0, 258, 0, ['#6b3fa0', '#9b7be8', '#6b3fa0']), '#3e2466', 2.5);
    g.strokeStyle = 'rgba(40,20,70,0.35)'; g.lineWidth = 2; for (const x0 of [42, 194]) for (let k = 1; k < 5; k++) { g.beginPath(); g.moveTo(x0 + k * 13, 190); g.quadraticCurveTo(x0 + k * 13 + 4, 270, x0 + k * 13, 348); g.stroke(); }
    arch(116, 68, 130); ink(g, linear(g, 116, 0, 184, 0, ['#8a5428', '#c08a54', '#8a5428']), '#3e220d', 2.5);
    // Rejilla
    rr(g, 132, 176, 36, 40, 4); ink(g, '#3e220d', '#2a1608', 2);
    g.strokeStyle = '#c08a54'; g.lineWidth = 1.5; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(132 + k * 7, 176); g.lineTo(132 + k * 7, 216); g.stroke(); g.beginPath(); g.moveTo(132, 176 + k * 7); g.lineTo(168, 176 + k * 7); g.stroke(); }
    glow(g, 150, 190, 60, '#ffd77a', 0.35);
    heartShape(g, 150, 290, 44, '#ff8fa8'); glow(g, 150, 288, 50, '#ffb3c6', 0.6);
    g.fillStyle = 'rgba(40,20,10,0.3)'; g.fillRect(30, 360, 240, 8);
    label(g, 'Shhh… es un secreto', 150, 384, { size: 18, color: '#ffffff', stroke: '#6b3fa0', sw: 5 });
  },
  vianney(g, r) {
    bgPastel(g, r, '#d8ccff', '#8f7ad6', { pattern: 'stars' });
    rays(g, 150, 150, { n: 20, color: '#ffffff', a: 0.28 });
    // Iglesia de Ars al fondo
    g.fillStyle = 'rgba(80,60,140,0.35)';
    g.beginPath(); g.moveTo(10, 330); g.lineTo(10, 268); g.lineTo(60, 240); g.lineTo(110, 268); g.lineTo(110, 330); g.fill();
    g.fillRect(80, 200, 22, 70); g.beginPath(); g.moveTo(76, 202); g.lineTo(91, 168); g.lineTo(106, 202); g.fill();
    person(g, 168, 384, 1.22, { skin: SKIN.a, hairStyle: 'white', hair: '#cfd3dc', robe: '#2a2533', surplice: true, stole: '#7d4bc4', arms: 'pray', face: 'closed', halo: true });
    banner(g, 'Santo Cura de Ars', 150, 362, 230, { color: '#7556c9', size: 22 });
    sparkles(g, r, 8, { color: '#fffbe6' });
  },
  roadToArs(g, r) {
    bgSky(g, r, { top: '#9ad3f7', bottom: '#fff3dc', mountains: false });
    // Pueblito de Ars al fondo
    g.fillStyle = '#d9c9e8'; g.beginPath(); g.moveTo(0, 200); g.bezierCurveTo(80, 180, 200, 190, 300, 176); g.lineTo(300, 240); g.lineTo(0, 240); g.fill();
    g.fillStyle = '#b9a6d4';
    for (const [hx, hw] of [[150, 22], [178, 18], [206, 24]]) { g.fillRect(hx, 166, hw, 24); g.beginPath(); g.moveTo(hx - 3, 168); g.lineTo(hx + hw / 2, 154); g.lineTo(hx + hw + 3, 168); g.fill(); }
    g.fillRect(232, 140, 14, 50); g.beginPath(); g.moveTo(229, 142); g.lineTo(239, 116); g.lineTo(249, 142); g.fill();
    // Campos y camino
    g.fillStyle = linear(g, 0, 200, 0, H, ['#a9d77e', '#6aa64c']); g.beginPath(); g.moveTo(0, 214); g.bezierCurveTo(100, 196, 220, 210, 300, 196); g.lineTo(300, H); g.lineTo(0, H); g.fill();
    g.fillStyle = linear(g, 0, 210, 0, H, ['#e8d3a8', '#c9a46c']); g.beginPath(); g.moveTo(196, 206); g.bezierCurveTo(170, 260, 60, 300, 40, H); g.lineTo(170, H); g.bezierCurveTo(180, 300, 214, 250, 206, 206); g.fill();
    grass(g, r, 230, 50, '#4f8f3c');
    // Ovejitas
    for (const [sx, sy] of [[250, 262], [272, 280]]) { ellipse(g, sx, sy, 14, 10); ink(g, '#ffffff', '#9a9a9a', 1.5); circle(g, sx - 12, sy - 4, 5); g.fillStyle = '#3d2b24'; g.fill(); }
    person(g, 96, 384, 0.98, { skin: SKIN.a, hairStyle: 'white', robe: '#2a2533', arms: 'down', face: 'smile', halo: true });
    person(g, 176, 384, 0.72, { skin: SKIN.b, hair: '#6b3f1f', hairStyle: 'short', robe: '#c98a4a', arms: 'point', face: 'talk' });
  },
  vianneyConfessing(g, r) {
    bgChurch(g, r, { wall: '#f1e3d3' });
    // Fila de personas
    for (const [px, sc, sk, rb] of [[214, 0.62, SKIN.c, '#4aa3e0'], [250, 0.58, SKIN.a, '#ec6f90'], [282, 0.54, SKIN.b, '#6cc070']]) person(g, px, 380, sc, { skin: sk, robe: rb, hairStyle: 'short', hair: '#2b1d18', arms: 'pray', face: 'closed' });
    // Confesionario abierto
    g.beginPath(); g.moveTo(14, 380); g.lineTo(14, 150); g.quadraticCurveTo(90, 100, 166, 150); g.lineTo(166, 380); g.closePath(); ink(g, linear(g, 14, 0, 166, 0, ['#6d3f1c', '#a06a3a', '#6d3f1c']), '#3e220d', 3);
    rr(g, 30, 170, 120, 200, 6); g.fillStyle = 'rgba(40,20,10,0.55)'; g.fill();
    glow(g, 90, 240, 80, '#ffd77a', 0.45);
    person(g, 90, 376, 0.86, { skin: SKIN.a, hairStyle: 'white', robe: '#2a2533', surplice: true, stole: '#7d4bc4', arms: 'hold', face: 'smile', halo: true });
    // Reloj
    circle(g, 230, 96, 34); ink(g, '#fffaf0', '#7a5a3a', 4);
    g.strokeStyle = '#3d2b24'; g.lineWidth = 3; g.beginPath(); g.moveTo(230, 96); g.lineTo(230, 72); g.stroke(); g.beginPath(); g.moveTo(230, 96); g.lineTo(248, 104); g.stroke();
    for (let i = 0; i < 12; i++) { const a = i * TAU / 12; circle(g, 230 + Math.cos(a) * 27, 96 + Math.sin(a) * 27, 1.8); g.fillStyle = '#7a5a3a'; g.fill(); }
    label(g, '¡+10 horas!', 230, 148, { size: 18, color: '#ffffff', stroke: '#7556c9', sw: 5 });
  },
  vianneyPraying(g, r) {
    rect(g, radial(g, 200, 150, 320, ['#6b2632', '#3c1219', '#1e080c']));
    rays(g, 214, 150, { n: 18, color: '#ffd77a', a: 0.3 });
    bokeh(g, r, { n: 14, color: '#ffcf6b', a: 0.3 });
    // Sagrario pequeño
    const gold = linear(g, 170, 0, 260, 0, ['#9a6510', '#ffe58a', '#c98a12']);
    rr(g, 176, 130, 76, 86, 6); ink(g, gold, '#7d5208', 3);
    g.beginPath(); g.moveTo(180, 132); g.quadraticCurveTo(214, 96, 248, 132); g.closePath(); ink(g, gold, '#7d5208', 2.5);
    cross(g, 214, 82, 18, 28, 5, 'gold');
    host(g, 214, 172, 14, { rays: true });
    glow(g, 214, 172, 90, '#fff3c2', 0.5);
    candle(g, 164, 236, 0.5, { hgt: 80 }); candle(g, 266, 236, 0.5, { hgt: 80 });
    g.fillStyle = linear(g, 0, 236, 0, H, ['#7a4a2a', '#4d2c16']); g.fillRect(0, 236, W, H - 236);
    // Reclinatorio y el santo arrodillado
    person(g, 96, 392, 1.0, { skin: SKIN.a, hairStyle: 'white', robe: '#2a2533', arms: 'pray', face: 'closed', halo: true });
    rr(g, 40, 300, 112, 20, 4); ink(g, '#8a5428', '#3e220d', 2);
    label(g, '«Yo lo miro y Él me mira»', 150, 30, { size: 19, color: '#fff3c2', font: 'Baloo 2', maxW: 270 });
  },
  vianneyTeaching(g, r) {
    bgSky(g, r, { top: '#a6dcff', bottom: '#fff1d6', hills: '#8dcb72' });
    person(g, 214, 330, 1.0, { skin: SKIN.a, hairStyle: 'white', robe: '#2a2533', arms: 'hold', face: 'talk', halo: true, held: gg => book(gg, 0, -86, 0.28, { open: true }) });
    for (const [kx, ks, sk, rb, hs, hc] of [[60, 0.56, SKIN.b, '#ffc94a', 'short', '#2b1d18'], [112, 0.54, SKIN.c, '#ff9db5', 'bun', '#3a2418'], [150, 0.5, SKIN.a, '#4aa3e0', 'short', '#6b3f1f']]) {
      person(g, kx, 388, ks, { skin: sk, robe: rb, hairStyle: hs, hair: hc, arms: 'down', face: 'smile' });
    }
    for (const [hx, hy] of [[60, 250], [150, 268]]) heartShape(g, hx, hy, 14, '#ff6b8b');
    label(g, '¡Dios te ama!', 214, 56, { size: 24, color: '#ffffff', stroke: '#e2643a', sw: 6 });
  },
  vianneyRosary(g, r) {
    bgPastel(g, r, '#cfe6ff', '#6fa3e0', { pattern: 'stars' });
    glow(g, 150, 120, 120, '#ffffff', 0.6);
    scenes.marianMark(g, 150, 110, 0.62);
    person(g, 150, 396, 1.12, { skin: SKIN.a, hairStyle: 'white', robe: '#2a2533', surplice: true, arms: 'hold', face: 'closed', halo: true,
      held: gg => { gg.save(); rosary(gg, 0, -86, 26, 16, r); gg.restore(); } });
  },
  patron(g, r) {
    bgGold(g, r, { cy: H * 0.4 });
    // Estola cruzada detrás
    g.save(); g.translate(150, 200); g.rotate(-0.45);
    rr(g, -150, -14, 300, 28, 6); ink(g, linear(g, 0, -14, 0, 14, ['#ffffff', '#f1ece0']), '#c9b28a', 2);
    for (let x = -130; x <= 130; x += 52) cross(g, x, -10, 14, 20, 4, 'gold');
    g.restore();
    chalice(g, 150, 220, 1.25);
    host(g, 150, 118, 26);
    banner(g, 'Patrono de los sacerdotes', 150, 352, 250, { color: '#7556c9', size: 19 });
    sparkles(g, r, 9, { color: '#fffbe6' });
  },
  feast(g, r) {
    bgSky(g, r, { top: '#ffd1dc', bottom: '#fff6e6', mountains: false });
    // Banderines de fiesta
    const cols = ['#e2643a', '#ffc94a', '#4aa3e0', '#6cc070', '#9b7be8', '#ec6f90'];
    for (const [y0, y1] of [[24, 54], [70, 96]]) {
      g.strokeStyle = '#7a5a3a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, y0); g.quadraticCurveTo(150, y1 + 10, 300, y0); g.stroke();
      for (let i = 0; i < 9; i++) { const t = (i + 0.5) / 9, x = t * 300, y = (1 - t) * (1 - t) * y0 + 2 * t * (1 - t) * (y1 + 10) + t * t * y0;
        g.beginPath(); g.moveTo(x - 12, y); g.lineTo(x + 12, y); g.lineTo(x, y + 24); g.closePath(); g.fillStyle = cols[(i + (y0 > 30 ? 2 : 0)) % cols.length]; g.fill(); }
    }
    // Hoja de calendario
    g.save(); g.translate(150, 236); g.rotate(-0.06);
    g.fillStyle = 'rgba(60,30,10,0.2)'; rr(g, -86, -94, 180, 200, 14); g.fill();
    rr(g, -90, -100, 180, 200, 14); ink(g, '#ffffff', '#c9b28a', 2.5);
    g.save(); rr(g, -90, -100, 180, 54, 14); g.clip(); g.fillStyle = linear(g, 0, -100, 0, -46, ['#e2643a', '#c0392b']); g.fillRect(-90, -100, 180, 54); g.restore();
    label(g, 'AGOSTO', 0, -74, { size: 26, color: '#ffffff' });
    label(g, '4', 0, 8, { size: 92, color: '#3d2b24' });
    label(g, 'San Juan María Vianney', 0, 76, { size: 14, color: '#7556c9', font: 'Nunito' });
    g.restore();
    for (let i = 0; i < 30; i++) { g.fillStyle = cols[i % cols.length]; g.save(); g.translate(r() * W, 110 + r() * 290); g.rotate(r() * 3); g.fillRect(-3, -1.5, 6, 3); g.restore(); }
    sparkles(g, r, 6, { color: '#ffffff' });
  },
  pastor(g, r, art) {
    const priest = art.who !== 'deacon';
    bgPastel(g, r, priest ? '#e3f4ff' : '#fff1d9', priest ? '#7fbce6' : '#f1b05c', { pattern: 'dots' });
    // Fachada rosada de la parroquia al fondo
    g.fillStyle = 'rgba(229,143,115,0.55)'; g.fillRect(0, 236, W, 120);
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(8 + i * 76, 356); g.lineTo(8 + i * 76, 270); g.arc(38 + i * 76, 270, 30, Math.PI, 0); g.lineTo(68 + i * 76, 356); g.closePath(); g.fillStyle = 'rgba(255,241,228,0.55)'; g.fill(); }
    g.fillStyle = linear(g, 0, 350, 0, H, ['#d8b48c', '#b88f64']); g.fillRect(0, 350, W, 50);
    const outfit = priest
      ? { skin: SKIN.b, hair: '#2b1d18', hairStyle: 'short', robe: '#ffffff', stole: '#3f9a52' }
      : { skin: SKIN.c, hair: '#1f1612', hairStyle: 'short', robe: '#ffffff', stole: '#c0392b', stoleDiag: true };
    const prop = art.prop;
    const held = prop === 'baby' ? gg => { ellipse(gg, 4, -84, 36, 20, -0.15); ink(gg, linear(gg, 0, -104, 0, -64, ['#ffffff', '#e3eaf8']), '#aab3c8', 2); circle(gg, -22, -92, 15); ink(gg, radial(gg, -22, -92, 15, [light(SKIN.a, 0.2), SKIN.a]), dark(SKIN.a, 0.4), 1.5); gg.strokeStyle = '#2b1d18'; gg.lineWidth = 1.8; for (const sg of [-1, 1]) { gg.beginPath(); gg.arc(-22 + sg * 5, -92, 2.6, 0.2 * Math.PI, 0.8 * Math.PI); gg.stroke(); } gg.fillStyle = 'rgba(240,110,110,0.4)'; circle(gg, -14, -86, 3); gg.fill(); }
      : prop === 'form' ? gg => { rr(gg, -24, -112, 48, 60, 4); ink(gg, '#c08a54', '#6d3f1c', 2); rr(gg, -19, -104, 38, 48, 2); ink(gg, '#ffffff', '#c9b28a', 1); gg.strokeStyle = '#7aa7e8'; gg.lineWidth = 2; for (let i = 0; i < 4; i++) { gg.beginPath(); gg.moveTo(-14, -94 + i * 10); gg.lineTo(14, -94 + i * 10); gg.stroke(); } }
        : prop === 'heart' ? gg => { heartShape(gg, 0, -84, 40, '#ff6b8b'); glow(gg, 0, -86, 40, '#ffb3c6', 0.6); }
          : null;
    person(g, 150, 418, 1.5, { ...outfit, collar: priest, arms: held ? (prop === 'heart' ? 'hold' : 'hold') : 'wave', face: 'talk', held });
    // Globito de diálogo
    const text = art.bubble || '¡Hola!';
    g.save();
    g.font = '800 22px "Baloo 2", system-ui, sans-serif';
    const tw = Math.min(250, g.measureText(text).width + 34);
    const bx = W / 2 - tw / 2, by = 20;
    rr(g, bx, by, tw, 48, 22); ink(g, '#ffffff', '#3d2b24', 2.5);
    g.beginPath(); g.moveTo(W / 2 - 12, by + 47); g.lineTo(W / 2 + 2, by + 66); g.lineTo(W / 2 + 12, by + 47); g.closePath(); ink(g, '#ffffff', null, 0);
    g.strokeStyle = '#3d2b24'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(W / 2 - 12, by + 48); g.lineTo(W / 2 + 2, by + 66); g.lineTo(W / 2 + 12, by + 48); g.stroke();
    g.restore();
    label(g, text, W / 2, by + 24, { size: 22, maxW: tw - 20 });
    label(g, priest ? 'El padre te cuenta' : 'El diácono te cuenta', W / 2, 378, { size: 18, color: '#ffffff', stroke: priest ? '#3f7fb3' : '#b0661c', sw: 6 });
  },
  office(g, r) {
    rect(g, linear(g, 0, 0, 0, H, ['#fff4e4', '#f5dcc0']));
    // Puerta con letrero
    rr(g, 40, 60, 120, 300, 8); ink(g, linear(g, 40, 0, 160, 0, ['#8a5428', '#b77b45', '#8a5428']), '#4f2c12', 3);
    rr(g, 52, 80, 96, 110, 6); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fill();
    circle(g, 140, 220, 6); g.fillStyle = '#f4c542'; g.fill();
    rr(g, 34, 22, 132, 34, 8); ink(g, '#3f9a52', '#1f5a33', 2);
    label(g, 'Oficina parroquial', 100, 39, { size: 14, color: '#ffffff', maxW: 120 });
    // Cartel ABIERTO
    g.save(); g.translate(100, 120); g.rotate(0.05); rr(g, -38, -14, 76, 28, 6); ink(g, '#ffffff', '#c0392b', 2.5); label(g, '¡ABIERTO!', 0, 0, { size: 15, color: '#c0392b' }); g.restore();
    // Reloj
    circle(g, 232, 92, 40); ink(g, '#ffffff', '#7a5a3a', 5);
    g.strokeStyle = '#3d2b24'; g.lineWidth = 3.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(232, 92); g.lineTo(232, 64); g.stroke(); g.beginPath(); g.moveTo(232, 92); g.lineTo(210, 92); g.stroke();
    for (let i = 0; i < 12; i++) { const a = i * TAU / 12; circle(g, 232 + Math.cos(a) * 32, 92 + Math.sin(a) * 32, 2); g.fillStyle = '#7a5a3a'; g.fill(); }
    // Tarjeta de horarios
    g.save(); g.translate(228, 246); g.rotate(-0.04);
    rr(g, -66, -92, 132, 184, 10); ink(g, '#ffffff', '#c9b28a', 2.5);
    label(g, 'Horario', 0, -72, { size: 20, color: '#e2643a' });
    const lines = [['Lun – Vie', '#3d2b24', 15], ['9:00 – 1:00', '#3f7fb3', 17], ['3:00 – 6:00', '#3f7fb3', 17], ['Sábados', '#3d2b24', 15], ['9:00 – 1:00', '#3f7fb3', 17]];
    lines.forEach(([t, c, s], i) => label(g, t, 0, -42 + i * 27, { size: s, color: c, maxW: 120 }));
    g.restore();
    g.fillStyle = linear(g, 0, 360, 0, H, ['#c9925e', '#a87444']); g.fillRect(0, 360, W, 40);
  },
  phone(g, r) {
    bgPastel(g, r, '#e4f7ec', '#7cc49a', { pattern: 'dots' });
    g.save(); g.translate(150, 200); g.rotate(-0.08);
    g.fillStyle = 'rgba(30,40,30,0.25)'; rr(g, -78, -142, 164, 300, 26); g.fill();
    rr(g, -82, -150, 164, 300, 26); ink(g, linear(g, -82, 0, 82, 0, ['#3d4a6b', '#55648c', '#3d4a6b']), '#232b40', 3);
    rr(g, -70, -128, 140, 250, 12); g.fillStyle = linear(g, 0, -128, 0, 122, ['#fff6dc', '#ffe3a1']); g.fill();
    label(g, 'Parroquia', 0, -100, { size: 18, color: '#7556c9' });
    label(g, 'Santo Cura de Ars', 0, -78, { size: 14, color: '#7556c9', font: 'Nunito' });
    label(g, '941', 0, -30, { size: 40, color: '#3d2b24' });
    label(g, '489', 0, 10, { size: 40, color: '#3d2b24' });
    label(g, '017', 0, 50, { size: 40, color: '#3d2b24' });
    circle(g, 0, 96, 18); ink(g, '#4caf6e', '#2f7d4a', 2);
    label(g, '📞', 0, 97, { size: 18 });
    g.restore();
    for (const [nx, ny, a] of [[40, 90, -0.4], [262, 120, 0.4], [250, 300, 0.2]]) { g.save(); g.translate(nx, ny); g.rotate(a); g.strokeStyle = '#ffffff'; g.lineWidth = 4; g.lineCap = 'round'; for (const k of [10, 20]) { g.beginPath(); g.arc(0, 0, k, -0.7, 0.7); g.stroke(); } g.restore(); }
  },
  map(g, r) {
    rect(g, linear(g, 0, 0, 0, H, ['#e9f3dc', '#d5e8c4']));
    andes(g, 90, { far: '#b7c6dc', near: '#c8dfb0', rand: r });
    // Cuadras
    g.fillStyle = '#f7f1e3';
    for (let y = 120; y < H; y += 70) for (let x = -20; x < W; x += 84) rr(g, x + (y % 140 ? 20 : 0), y, 64, 50, 6), g.fill();
    // Río Mantaro
    g.strokeStyle = '#7cc8f5'; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(-10, 130); g.bezierCurveTo(60, 160, 20, 240, 40, 410); g.stroke();
    // Avenida Los Montes
    g.strokeStyle = '#ffffff'; g.lineWidth = 26; g.beginPath(); g.moveTo(80, H); g.bezierCurveTo(120, 300, 200, 230, 300, 190); g.stroke();
    g.strokeStyle = '#ffc94a'; g.lineWidth = 2.5; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(80, H); g.bezierCurveTo(120, 300, 200, 230, 300, 190); g.stroke(); g.setLineDash([]);
    g.save(); g.translate(210, 252); g.rotate(-0.45); label(g, 'Av. Los Montes', 0, 0, { size: 13, color: '#7a655c', font: 'Nunito' }); g.restore();
    // Iglesia y pin
    g.save(); g.translate(150, 250);
    g.fillStyle = '#e58f73'; g.fillRect(-30, -24, 60, 38); g.beginPath(); g.moveTo(-34, -22); g.lineTo(0, -46); g.lineTo(34, -22); g.fill();
    g.fillRect(14, -62, 14, 40); cross(g, 21, -84, 14, 22, 4, '#ffffff');
    g.fillStyle = '#fff1e4'; g.beginPath(); g.moveTo(-8, 14); g.lineTo(-8, -6); g.arc(0, -6, 8, Math.PI, 0); g.lineTo(8, 14); g.fill();
    g.restore();
    g.save(); g.translate(150, 170);
    g.fillStyle = 'rgba(0,0,0,0.2)'; ellipse(g, 0, 40, 12, 4); g.fill();
    g.beginPath(); g.moveTo(0, 38); g.bezierCurveTo(-30, 0, -28, -34, 0, -34); g.bezierCurveTo(28, -34, 30, 0, 0, 38); g.closePath(); ink(g, linear(g, 0, -34, 0, 38, ['#ff6b5a', '#c0392b']), '#7a1010', 2.5);
    circle(g, 0, -10, 10); g.fillStyle = '#ffffff'; g.fill();
    g.restore();
    rr(g, 20, 334, 260, 52, 14); ink(g, 'rgba(255,255,255,0.94)', '#c9b28a', 2);
    label(g, 'Av. Los Montes 340', 150, 352, { size: 18, color: '#3d2b24' });
    label(g, 'Pío Pata · El Tambo · Huancayo', 150, 372, { size: 13, color: '#7a655c', font: 'Nunito' });
  },
  chalice(g, r) {
    rect(g, radial(g, 150, 170, 320, ['#fff6dc', '#f7d27a', '#d48a2a', '#8a3f12']));
    rays(g, 150, 130, { n: 26, color: '#fff7cf', a: 0.45 });
    host(g, 150, 118, 38);
    chalice(g, 150, 262, 1.45);
    wheat(g, 40, 404, 0.85, -0.25); wheat(g, 260, 404, 0.85, 0.25);
    grapes(g, 64, 352, 0.9); grapes(g, 238, 352, 0.9);
    sparkles(g, r, 12, { color: '#ffffff' });
    vignette(g, 0.3, '#5a1f06');
  },
  spirit(g, r) {
    rect(g, radial(g, 150, 160, 300, ['#ffffff', '#ffe9b0', '#ff9a5a', '#c0392b']));
    rays(g, 150, 170, { n: 24, color: '#ffffff', a: 0.5 });
    glow(g, 150, 170, 120, '#ffffff', 0.7);
    dove(g, 150, 190, 1.25, { flip: true });
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (0.15 + (i / 6) * 0.7), x = 150 + Math.cos(a) * 120, y = 330 - Math.sin(a) * 40;
      g.save(); g.translate(x, y); g.beginPath(); g.moveTo(0, -24); g.bezierCurveTo(8, -12, 8, 0, 0, 0); g.bezierCurveTo(-8, 0, -8, -12, 0, -24);
      g.fillStyle = radial(g, 0, -8, 14, ['#fff7c0', '#ffb43a', '#ff6a1a']); g.fill(); glow(g, 0, -8, 22, '#ffb43a', 0.6); g.restore();
    }
    sparkles(g, r, 10, { color: '#ffffff' });
  },
  bible(g, r) {
    rect(g, radial(g, 150, 180, 320, ['#fff6e4', '#f6d8a8', '#d79a5a']));
    rays(g, 150, 190, { n: 20, color: '#ffffff', a: 0.4 });
    glow(g, 150, 190, 130, '#fff6cf', 0.8);
    book(g, 150, 220, 1.4, { cover: '#8a2b2b' });
    cross(g, 150, 64, 30, 48, 8, 'gold');
    for (let i = 0; i < 6; i++) heartShape(g, 40 + i * 44, 318 + (i % 2) * 12, 13, rgba('#ec6f90', 0.75));
    label(g, 'Palabra de Dios', 150, 372, { size: 24, color: '#ffffff', stroke: '#8a2b2b', sw: 6 });
    sparkles(g, r, 8, { color: '#ffffff' });
  },
  rosary(g, r) {
    bgPastel(g, r, '#dcecff', '#7aa7e8', { pattern: 'stars' });
    glow(g, 150, 160, 140, '#ffffff', 0.5);
    rosary(g, 150, 150, 96, 96, r);
    scenes.marianMark(g, 150, 150, 0.42);
  },
  marianMark(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    // Corona
    g.beginPath(); g.moveTo(-60, -60); g.lineTo(-60, -96); g.lineTo(-34, -76); g.lineTo(0, -112); g.lineTo(34, -76); g.lineTo(60, -96); g.lineTo(60, -60); g.closePath();
    ink(g, linear(g, -60, -110, 60, -60, ['#fff1a8', '#f4c542', '#c98a12']), '#9a6510', 3);
    for (const px of [-60, 0, 60]) { circle(g, px, px ? -98 : -114, 7); ink(g, '#ff6b8b', '#a8203f', 2); }
    rr(g, -64, -64, 128, 14, 4); ink(g, '#f4c542', '#9a6510', 2);
    // M
    g.font = '800 150px "Baloo 2", Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 10; g.strokeStyle = '#1f3f80'; g.strokeText('M', 0, 30);
    g.fillStyle = linear(g, 0, -30, 0, 90, ['#ffffff', '#cfe3ff', '#7aa7e8']); g.fillText('M', 0, 30);
    g.restore();
  },
  marian(g, r) {
    rect(g, radial(g, 150, 180, 320, ['#e3efff', '#7aa7e8', '#2b4f9e', '#16295c']));
    glow(g, 150, 190, 140, '#ffffff', 0.5);
    for (let i = 0; i < 12; i++) { const a = -Math.PI / 2 + (i / 12) * TAU; sparkle(g, 150 + Math.cos(a) * 120, 196 + Math.sin(a) * 120, 11, '#fff3b0'); }
    scenes.marianMark(g, 150, 196, 1.0);
    for (let i = 0; i < 5; i++) flower(g, 70 + i * 40, 360 + (i % 2) * 10, 1.3, '#ffffff', '#ffcf3a');
  },
  ihs(g, r) {
    rect(g, radial(g, 150, 190, 320, ['#7b1f2a', '#4d0f17', '#2a070c']));
    rays(g, 150, 196, { n: 32, color: '#ffd77a', a: 0.55, width: 0.5, len: 300 });
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * TAU, wav = i % 2 ? 110 : 136;
      g.beginPath(); g.moveTo(150 + Math.cos(a - 0.06) * 80, 196 + Math.sin(a - 0.06) * 80);
      g.quadraticCurveTo(150 + Math.cos(a + 0.05) * (wav * 0.85), 196 + Math.sin(a + 0.05) * (wav * 0.85), 150 + Math.cos(a) * wav, 196 + Math.sin(a) * wav);
      g.lineTo(150 + Math.cos(a + 0.06) * 80, 196 + Math.sin(a + 0.06) * 80); g.closePath();
      ink(g, linear(g, 0, 60, 0, 330, ['#fff1a8', '#f4c542', '#c98a12']), '#9a6510', 1);
    }
    circle(g, 150, 196, 84); ink(g, radial(g, 150, 190, 84, ['#fff8d8', '#ffe08a', '#e6a92a']), '#9a6510', 3);
    g.save(); g.font = '800 68px Georgia, "Baloo 2", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 6; g.strokeStyle = '#fff1c4'; g.strokeText('IHS', 150, 206); g.fillStyle = '#8a1d2a'; g.fillText('IHS', 150, 206); g.restore();
    cross(g, 150, 136, 22, 36, 5, '#8a1d2a');
    // Tres clavos
    for (const [dx, rot] of [[-16, 0.35], [0, 0], [16, -0.35]]) { g.save(); g.translate(150 + dx, 248); g.rotate(rot); g.fillStyle = '#8a1d2a'; g.fillRect(-2.2, 0, 4.4, 22); g.fillRect(-5, -2, 10, 4); g.restore(); }
    sparkles(g, r, 10, { color: '#fff3c2' });
  },
  lamb(g, r) {
    bgSky(g, r, { top: '#bfe6ff', bottom: '#fff8e8', hills: '#9ad07e' });
    glow(g, 150, 230, 140, '#fff6cf', 0.6);
    // Banderín de la resurrección
    g.strokeStyle = '#c9a04a'; g.lineWidth = 4; g.beginPath(); g.moveTo(196, 290); g.lineTo(226, 110); g.stroke();
    cross(g, 226, 92, 18, 26, 4, 'gold');
    g.beginPath(); g.moveTo(224, 118); g.quadraticCurveTo(262, 110, 286, 128); g.lineTo(270, 150); g.lineTo(284, 172); g.quadraticCurveTo(254, 158, 220, 166); g.closePath(); ink(g, '#ffffff', '#b8bccd', 2);
    crossShape(g, 252, 122, 22, 40, 6); g.fillStyle = '#d63031'; g.fill();
    // Cordero recostado
    g.save(); g.translate(140, 300);
    for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI; circle(g, Math.cos(a) * 62, Math.sin(a) * 30 + 6, 20); ink(g, '#ffffff', '#b9b9c6', 2); }
    ellipse(g, 0, 10, 64, 30); g.fillStyle = '#ffffff'; g.fill();
    for (let i = 0; i < 14; i++) { circle(g, -50 + (i % 7) * 16, -4 + Math.floor(i / 7) * 16, 9); g.fillStyle = '#f7f7fb'; g.fill(); }
    // cabeza
    glow(g, -60, -40, 40, '#fff3b0', 0.6); circle(g, -60, -40, 34); g.strokeStyle = 'rgba(244,197,66,0.95)'; g.lineWidth = 4; g.stroke();
    ellipse(g, -60, -36, 20, 24); ink(g, '#fffaf2', '#b9b9c6', 2);
    ellipse(g, -80, -42, 10, 5, 0.4); ink(g, '#fbe3e3', '#b9b9c6', 1.5); ellipse(g, -40, -42, 10, 5, -0.4); ink(g, '#fbe3e3', '#b9b9c6', 1.5);
    g.strokeStyle = '#2b1d18'; g.lineWidth = 2.4; for (const sg of [-1, 1]) { g.beginPath(); g.arc(-60 + sg * 8, -38, 4, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke(); }
    g.fillStyle = '#e9a7a7'; ellipse(g, -60, -24, 4, 3); g.fill();
    g.restore();
    for (let i = 0; i < 7; i++) flower(g, 24 + i * 42, 360 + (i % 2) * 16, 1.1, i % 2 ? '#ffffff' : '#ffe58a');
  },
  sacredHeart(g, r) {
    rect(g, radial(g, 150, 190, 320, ['#fff3e6', '#ffc2a8', '#e2643a', '#8a1d2a']));
    rays(g, 150, 200, { n: 24, color: '#fff3c2', a: 0.45 });
    glow(g, 150, 210, 130, '#fff3c2', 0.6);
    // Llamas
    for (let i = -2; i <= 2; i++) {
      g.save(); g.translate(150 + i * 13, 140 - (2 - Math.abs(i)) * 8); g.beginPath(); g.moveTo(0, -40); g.bezierCurveTo(14, -20, 12, 0, 0, 2); g.bezierCurveTo(-12, 0, -14, -20, 0, -40);
      g.fillStyle = radial(g, 0, -10, 24, ['#fff7c0', '#ffb43a', '#ff5a1a']); g.fill(); g.restore();
    }
    cross(g, 150, 70, 26, 44, 7, 'gold');
    g.save(); g.translate(150, 220); g.scale(1.25, 1.25);
    g.beginPath(); g.moveTo(0, 64); g.bezierCurveTo(-90, 10, -70, -70, 0, -38); g.bezierCurveTo(70, -70, 90, 10, 0, 64); g.closePath();
    ink(g, radial(g, -20, -20, 100, ['#ff8a8a', '#d62a3a', '#8a0f1f'], -30, -30), '#5a0812', 3);
    // Corona de espinas
    g.strokeStyle = '#5a8a2a'; g.lineWidth = 5; g.beginPath(); g.ellipse(0, 6, 62, 14, -0.08, 0, TAU); g.stroke();
    g.strokeStyle = '#3f6a1a'; g.lineWidth = 2; for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; const x = Math.cos(a) * 62, y = 6 + Math.sin(a) * 14; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a + 1) * 8, y + Math.sin(a + 1) * 8 - 4); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,0.65)'; g.lineWidth = 5; g.beginPath(); g.moveTo(-42, -24); g.quadraticCurveTo(-50, 0, -34, 18); g.stroke();
    g.restore();
    sparkles(g, r, 10, { color: '#ffffff' });
  },
  communion(g, r) {
    bgChurch(g, r, { wall: '#fff0dc' });
    glow(g, 150, 160, 150, '#fff3c2', 0.6);
    person(g, 96, 388, 1.0, { skin: SKIN.b, hair: '#2b1d18', hairStyle: 'short', robe: '#ffffff', stole: '#f4c542', collar: true, arms: 'give', face: 'smile',
      held: gg => { host(gg, 46, -120, 12, { rays: true }); } });
    person(g, 214, 388, 0.8, { skin: SKIN.c, hair: '#1f1612', hairStyle: 'veil', robe: '#ffffff', arms: 'pray', face: 'closed' });
    banner(g, '«El Cuerpo de Cristo» · «Amén»', 150, 44, 268, { color: '#c98a12', size: 17 });
    sparkles(g, r, 10, { color: '#ffffff', y0: 60, y1: 260 });
  },
  kidCandle(g, r) {
    bgNight(g, r);
    glow(g, 150, 200, 170, '#ffcf6b', 0.55);
    glow(g, 96, 170, 90, '#ffcf6b', 0.6);
    person(g, 158, 404, 1.15, { skin: SKIN.b, hair: '#2b1d18', hairStyle: 'short', robe: '#ffffff', arms: 'candle', face: 'smile',
      after: gg => { candle(gg, -54, -70, 0.85, { hgt: 96, color: '#fffaf0' }); gg.save(); gg.translate(-54, -112); flower(gg, 0, 0, 1.1, '#ffffff'); gg.restore(); for (const [hx, hy] of [[-50, -84], [-30, -76]]) { circle(gg, hx + (hx < -40 ? 0 : -14), hy, 9); ink(gg, SKIN.b, dark(SKIN.b, 0.4), 2); } } });
    bokeh(g, r, { n: 16, color: '#ffd27a' });
  },
  kids(g, r) {
    bgPastel(g, r, '#fff6e8', '#f5c9a8', { pattern: 'hearts' });
    glow(g, 150, 200, 160, '#ffffff', 0.6);
    person(g, 98, 388, 0.98, { skin: SKIN.b, hair: '#2b1d18', hairStyle: 'short', robe: '#ffffff', arms: 'pray', face: 'closed' });
    person(g, 204, 388, 0.98, { skin: SKIN.a, hair: '#3a2418', hairStyle: 'veil', robe: '#ffffff', arms: 'hold', face: 'smile',
      held: gg => { for (let i = 0; i < 5; i++) flower(gg, -10 + i * 5, -94 + (i % 2) * 6, 1, i % 2 ? '#ffd0dc' : '#ffffff'); } });
    dove(g, 150, 74, 0.48, { flip: true });
    sparkles(g, r, 10, { color: '#ffffff' });
  },
  monstrance(g, r) {
    rect(g, radial(g, 150, 180, 320, ['#fffaf0', '#ffe08a', '#e3a12f', '#8a4a12']));
    rays(g, 150, 170, { n: 30, color: '#ffffff', a: 0.5 });
    glow(g, 150, 170, 150, '#ffffff', 0.75);
    monstrance(g, 150, 182, 1.12);
    candle(g, 44, 392, 0.6, { hgt: 120 }); candle(g, 256, 392, 0.6, { hgt: 120 });
    sparkles(g, r, 12, { color: '#ffffff' });
  },
  family(g, r) {
    bgSky(g, r, { top: '#ffd9a8', bottom: '#fff6e6', hills: '#9ad07e' });
    // Fachada al fondo
    g.fillStyle = 'rgba(229,143,115,0.8)'; g.fillRect(96, 150, 140, 90); g.fillRect(210, 96, 30, 70);
    g.beginPath(); g.moveTo(90, 152); g.lineTo(166, 118); g.lineTo(242, 152); g.fill(); cross(g, 225, 66, 18, 30, 5, '#ffffff');
    person(g, 70, 392, 1.0, { skin: SKIN.c, hair: '#1f1612', hairStyle: 'short', robe: '#4a6fae', arms: 'open', face: 'smile' });
    person(g, 230, 392, 0.98, { skin: SKIN.b, hair: '#2b1d18', hairStyle: 'bun-long', robe: '#ec6f90', arms: 'open', face: 'smile' });
    person(g, 150, 392, 0.74, { skin: SKIN.b, hair: '#2b1d18', hairStyle: 'veil', robe: '#ffffff', arms: 'up', face: 'smile' });
    for (let i = 0; i < 7; i++) heartShape(g, 40 + r() * 220, 40 + r() * 120, 12 + r() * 10, rgba('#ff6b8b', 0.8));
  },
  catechist(g, r) {
    bgChurch(g, r, { wall: '#e9f4e4', floor: '#c9a57a' });
    person(g, 196, 380, 1.02, { skin: SKIN.b, hair: '#3a2418', hairStyle: 'bun-long', robe: '#6cc070', arms: 'hold', face: 'talk',
      held: gg => book(gg, 0, -88, 0.3, { open: true }) });
    person(g, 66, 392, 0.66, { skin: SKIN.c, hair: '#1f1612', hairStyle: 'short', robe: '#ffc94a', arms: 'up', face: 'smile' });
    person(g, 118, 392, 0.62, { skin: SKIN.a, hair: '#5a3622', hairStyle: 'bun', robe: '#ff9db5', arms: 'down', face: 'smile' });
    label(g, '¡Gracias!', 92, 200, { size: 28, color: '#ffffff', stroke: '#3f9a52', sw: 7 });
    for (let i = 0; i < 4; i++) heartShape(g, 40 + i * 32, 240 - (i % 2) * 14, 12, '#ff6b8b');
  },
  wheat(g, r) {
    rect(g, linear(g, 0, 0, 0, H, ['#ffe9b8', '#ffd27a', '#e9a24a']));
    rays(g, 150, 140, { n: 22, color: '#ffffff', a: 0.4 });
    for (let i = 0; i < 9; i++) wheat(g, 150, 392, 1.45, (i - 4) * 0.13);
    g.fillStyle = linear(g, 0, 330, 0, 346, ['#d9a24a', '#a8701c']); rr(g, 128, 328, 44, 16, 6); g.fill();
    grapes(g, 52, 360, 1.15); grapes(g, 248, 360, 1.15);
    host(g, 150, 110, 40);
    sparkles(g, r, 10, { color: '#ffffff' });
  },
  heartHost(g, r) {
    bgPastel(g, r, '#ffe3ec', '#f08aa8', { pattern: 'hearts' });
    glow(g, 150, 200, 150, '#ffffff', 0.6);
    g.save(); g.translate(150, 210); g.scale(1.55, 1.55);
    g.beginPath(); g.moveTo(0, 64); g.bezierCurveTo(-90, 10, -70, -70, 0, -38); g.bezierCurveTo(70, -70, 90, 10, 0, 64); g.closePath();
    ink(g, radial(g, -20, -20, 100, ['#ffb3c6', '#ff6b8b', '#d63a5f'], -30, -30), '#a8203f', 3);
    g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 5; g.beginPath(); g.moveTo(-42, -24); g.quadraticCurveTo(-50, 0, -34, 18); g.stroke();
    g.restore();
    host(g, 150, 206, 34);
    dove(g, 70, 90, 0.4); dove(g, 236, 70, 0.32, { flip: true });
    sparkles(g, r, 12, { color: '#ffffff' });
  },
};

// ───────────── Fotos de la parroquia ─────────────
const PHOTOS = { altar: 'assets/parroquia/altar.jpg', fachada: 'assets/parroquia/fachada.jpg' };
const imgCache = new Map();
function loadImage(src) {
  if (!imgCache.has(src)) {
    imgCache.set(src, new Promise((res, rej) => {
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => res(im);
      im.onerror = () => { imgCache.delete(src); rej(new Error(`No se pudo cargar ${src}`)); };
      im.src = src;
    }));
  }
  return imgCache.get(src);
}
function cover(g, im, [sx, sy, sw, sh], dx, dy, dw, dh) {
  const k = Math.max(dw / sw, dh / sh);
  const cw = dw / k, ch = dh / k;
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(im, sx + (sw - cw) / 2, sy + (sh - ch) / 2, cw, ch, dx, dy, dw, dh);
}
function warmGrade(g, a = 0.35, color = '#ffb347') {
  g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = rgba(color, a); g.fillRect(0, 0, W, H); g.restore();
}
function goldFrame(g, inset = 10, r = 18) {
  rr(g, inset, inset, W - inset * 2, H - inset * 2, r);
  g.lineWidth = 7; g.strokeStyle = linear(g, 0, 0, W, H, ['#fff1a8', '#c98a12', '#ffe58a', '#9a6510', '#fff1a8']); g.stroke();
  rr(g, inset + 6, inset + 6, W - inset * 2 - 12, H - inset * 2 - 12, r - 5);
  g.lineWidth = 1.5; g.strokeStyle = 'rgba(255,240,190,0.8)'; g.stroke();
}
const photoFx = {
  halo(g, im, art, r) {
    // Jesús Resucitado del altar: luz dorada detrás, recorte del muro blanco y brillo celestial.
    rect(g, radial(g, W / 2, H * 0.4, H * 0.7, ['#fffaf0', '#ffe9b0', '#f2c46b']));
    g.save(); g.filter = 'contrast(1.18) saturate(1.25)'; cover(g, im, art.crop, 0, 0, W, H); g.restore();
    warmGrade(g, 0.55, '#ffb347');
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = radial(g, W / 2, H * 0.4, H * 0.7, [[0, 'rgba(255,255,255,0)'], [0.55, 'rgba(255,236,200,0.2)'], [1, 'rgba(214,150,70,0.85)']]); g.fillRect(0, 0, W, H); g.restore();
    g.save(); g.globalCompositeOperation = 'screen';
    rays(g, W / 2, H * 0.3, { n: 22, color: '#fff3c2', a: 0.16, len: 360 });
    g.fillStyle = radial(g, W / 2, H * 0.12, 70, ['rgba(255,244,200,0.6)', 'rgba(255,244,200,0)']); g.fillRect(0, 0, W, H);
    g.restore();
    sparkles(g, r, 14, { color: '#fffbe6', min: 3, max: 8 });
    vignette(g, 0.38, '#6b3a0a');
    goldFrame(g);
    banner(g, 'Jesús Resucitado', W / 2, H - 46, 230, { color: '#c0392b', size: 22 });
  },
  words(g, im, art, r) {
    rect(g, linear(g, 0, 0, 0, H, ['#fff8e6', '#f6e4c2']));
    grain(g, r, 1600, 0.05);
    g.save(); rr(g, 20, 26, 260, 168, 16); g.clip();
    cover(g, im, art.crop, 20, 26, 260, 168);
    warmGrade(g, 0.35);
    g.restore();
    rr(g, 20, 26, 260, 168, 16); g.lineWidth = 5; g.strokeStyle = '#d9a74a'; g.stroke();
    glow(g, 150, 290, 140, '#fff3c2', 0.5);
    label(g, '«Yo soy', 150, 236, { size: 34, color: '#8a2b2b', font: 'Baloo 2' });
    label(g, 'la Resurrección', 150, 276, { size: 34, color: '#8a2b2b', font: 'Baloo 2' });
    label(g, 'y la Vida»', 150, 316, { size: 34, color: '#8a2b2b', font: 'Baloo 2' });
    label(g, 'Juan 11, 25', 150, 356, { size: 17, color: '#7a655c', font: 'Nunito' });
    lily(g, 34, 380, 0.8); lily(g, 266, 380, 0.8);
  },
  warm(g, im, art, r) {
    g.save(); g.filter = 'contrast(1.1) saturate(1.2)'; cover(g, im, art.crop, 0, 0, W, H); g.restore();
    warmGrade(g, 0.45, '#ffb347');
    bokeh(g, r, { n: 14, color: '#ffd27a', a: 0.4 });
    vignette(g, 0.45, '#3a1a05');
    goldFrame(g, 10, 16);
  },
  soft(g, im, art, r) {
    cover(g, im, art.crop, 0, 0, W, H);
    g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = 'rgba(255,236,200,0.18)'; g.fillRect(0, 0, W, H); g.restore();
    warmGrade(g, 0.3, '#ffd59a');
    bokeh(g, r, { n: 12, color: '#fff3d0', a: 0.35 });
    g.fillStyle = radial(g, W / 2, H / 2, H * 0.72, [[0, 'rgba(255,255,255,0)'], [0.7, 'rgba(255,255,255,0)'], [1, 'rgba(255,250,240,0.85)']]); g.fillRect(0, 0, W, H);
  },
  facade(g, im, art, r) {
    rect(g, linear(g, 0, 0, 0, H, ['#7cc8f5', '#cdeeff', '#fff1e4']));
    cloud(g, 70, 54, 0.8); cloud(g, 236, 80, 0.6, 0.8);
    g.save();
    g.beginPath(); g.moveTo(18, 330); g.lineTo(18, 160); g.arc(150, 160, 132, Math.PI, 0); g.lineTo(282, 330); g.closePath(); g.clip();
    cover(g, im, [70, 0, 400, 298], 18, 28, 264, 302);
    warmGrade(g, 0.28, '#ffcf9a');
    g.restore();
    g.beginPath(); g.moveTo(18, 330); g.lineTo(18, 160); g.arc(150, 160, 132, Math.PI, 0); g.lineTo(282, 330); g.closePath();
    g.lineWidth = 8; g.strokeStyle = linear(g, 0, 0, W, H, ['#fff1a8', '#c98a12', '#ffe58a', '#9a6510']); g.stroke();
    banner(g, 'Santo Cura de Ars', W / 2, 344, 236, { color: '#c0392b', size: 22 });
    label(g, 'Pío Pata · El Tambo · Huancayo', W / 2, 382, { size: 14, color: '#7a4b2a', font: 'Nunito' });
    sparkles(g, r, 6, { color: '#ffffff', y1: 120 });
  },
  sky(g, im, art, r) {
    g.save(); g.filter = 'contrast(1.08) saturate(1.15)'; cover(g, im, art.crop, 0, 0, W, H); g.restore();
    warmGrade(g, 0.3, '#ffd59a');
    glow(g, W * 0.45, H * 0.2, 90, '#fff6cf', 0.55);
    sparkles(g, r, 5, { color: '#ffffff', y1: H * 0.4 });
    vignette(g, 0.3, '#2b1a3a');
    goldFrame(g, 10, 16);
  },
};

// ───────────── Pintar ─────────────
let fontsReady = null;
function fonts() {
  if (!fontsReady) {
    fontsReady = Promise.all(['800 30px "Baloo 2"', '700 16px "Nunito"'].map(f => (document.fonts?.load ? document.fonts.load(f).catch(() => null) : null))).catch(() => null);
  }
  return fontsReady;
}

export async function paintSticker(canvas, sticker) {
  await fonts();
  const g = canvas.getContext('2d');
  const k = canvas.width / W;
  g.setTransform(k, 0, 0, k, 0, 0);
  g.clearRect(0, 0, W, H);
  const r = rng(hash(sticker.id));
  const art = sticker.art || {};
  // Imagen pintada aparte (si existe)
  if (sticker.img) {
    try { const im = await loadImage(sticker.img); cover(g, im, [0, 0, im.naturalWidth, im.naturalHeight], 0, 0, W, H); return; } catch { /* se pinta la ilustración */ }
  }
  try {
    if (art.photo) {
      const im = await loadImage(PHOTOS[art.photo]);
      (photoFx[art.fx] || photoFx.warm)(g, im, art, r);
    } else {
      (scenes[art.draw] || scenes.bible)(g, r, art);
    }
  } catch (e) {
    console.warn('[figuritas]', sticker.id, e);
    g.setTransform(k, 0, 0, k, 0, 0);
    bgGold(g, r);
    label(g, sticker.hint || '✨', W / 2, H / 2, { size: 120 });
  }
  g.setTransform(k, 0, 0, k, 0, 0);
  grain(g, r, 900, 0.035);
}

// ───────────── Caché de imágenes listas ─────────────
// Miniaturas: caben las 48 (unos 2–3 MB en total). Grandes: solo las últimas 4.
const urls = new Map();          // clave → Promise<string>
const order = { 1: [], 2: [] };
const LIMIT = { 1: 64, 2: 4 };
function remember(key, size, p) {
  urls.set(key, p); order[size].push(key);
  while (order[size].length > LIMIT[size]) {
    const old = order[size].shift();
    const op = urls.get(old); urls.delete(old);
    op?.then(u => { if (u.startsWith('blob:')) setTimeout(() => { try { URL.revokeObjectURL(u); } catch { /* nada */ } }, 4000); }).catch(() => {});
  }
}
export function stickerURL(sticker, { big = false } = {}) {
  const size = big ? 2 : 1;
  const key = `${sticker.id}@${size}`;
  if (urls.has(key)) return urls.get(key);
  const p = (async () => {
    const c = document.createElement('canvas');
    c.width = big ? 600 : 300; c.height = big ? 800 : 400;
    await paintSticker(c, sticker);
    const blob = await new Promise(res => { try { c.toBlob(res, 'image/webp', 0.9); } catch { res(null); } });
    if (blob) return URL.createObjectURL(blob);
    return c.toDataURL('image/png');
  })();
  remember(key, size, p);
  p.catch(() => { urls.delete(key); });
  return p;
}
export function releaseAll() {
  for (const p of urls.values()) p.then(u => { try { URL.revokeObjectURL(u); } catch { /* nada */ } }).catch(() => {});
  urls.clear(); order[1].length = 0; order[2].length = 0;
}
