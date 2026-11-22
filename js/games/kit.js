// Kit de dibujo 2D compartido por los minijuegos (Canvas 2D). Da a todos los juegos el mismo estilo:
// formas planas y redondeadas, colores pastel, sin contornos duros, sombras suaves.
//
// Convenciones: todas las funciones reciben el contexto `g` primero y coordenadas en unidades lógicas del juego
// (ancho 360). Ninguna deja el contexto con estado cambiado (usan save/restore).
//
// Resumen
//   Matemáticas : clamp, lerp, map, dist, ease.{inOut, outCubic, outBack, outBounce, outElastic}, hitCircle, hitRect, inRect
//   Formas      : rr (ruta de rectángulo redondeado), fillRR, circle, ellipse, shadow, bar
//   Texto       : text, wrapText, emoji
//   Paisaje     : sky, sun, moon, stars, cloud, stormCloud, hills, ground, rainbow, water, tree, bush, rock, flower, grass
//   Personajes  : dove (perfil, vuela), doveFront (de frente), sheep, person
//   Objetos     : heart, star, seed, olive, drop, sunray, candle, bubble
//   Paleta      : PAL

export const PAL = {
  ink: '#3d2b24', inkSoft: '#7a655c', white: '#ffffff', paper: '#fffaf0',
  sky: '#7cc8f5', skySoft: '#cdeeff', skyDeep: '#4aa3e0', night: '#27325e',
  sun: '#ffc94a', sunDeep: '#f0a51e', coral: '#ff8a5c', coralDeep: '#e2643a',
  leaf: '#6cc070', leafDeep: '#3f9a52', leafLight: '#a8e08c',
  grape: '#9b7be8', grapeDeep: '#7556c9', rose: '#ff9db5', roseDeep: '#ec6f90',
  earth: '#b98556', earthDeep: '#8a5a3c', sand: '#f1d9a5', stone: '#aeb6c2', stoneDeep: '#8b94a3',
  water: '#58b7ea', waterDeep: '#2f8fd0', wood: '#c08a57', woodDeep: '#96643a',
  dove: '#ffffff', doveShade: '#e6edf8', doveTip: '#d4e1f4', beak: '#ff9b54', blush: '#ffb3c1', eye: '#2b1d16',
};
export const FONT = '"Baloo 2", ui-rounded, "Arial Rounded MT Bold", system-ui, sans-serif';
const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

// ── Matemáticas ──
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const map = (v, a, b, c, d) => c + (d - c) * clamp((v - a) / (b - a));
export const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
export const ease = {
  inOut: t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  outCubic: t => 1 - Math.pow(1 - t, 3),
  outBack: t => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
  outBounce: t => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  },
  outElastic: t => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1),
};
export const hitCircle = (ax, ay, ar, bx, by, br) => dist(ax, ay, bx, by) < ar + br;
export const hitRect = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
export const inRect = (px, py, r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;

// ── Formas ──
export function rr(g, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
export function fillRR(g, x, y, w, h, r, fill, stroke, lw = 2) {
  g.save();
  rr(g, x, y, w, h, r);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
  g.restore();
}
export function circle(g, x, y, r, fill, stroke, lw = 2) {
  g.save();
  g.beginPath(); g.arc(x, y, Math.max(0, r), 0, Math.PI * 2);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
  g.restore();
}
export function ellipse(g, x, y, rx, ry, fill, rot = 0) {
  g.save();
  g.beginPath(); g.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), rot, 0, Math.PI * 2);
  g.fillStyle = fill; g.fill();
  g.restore();
}
// Sombra ovalada en el suelo.
export function shadow(g, x, y, rx, ry = rx * 0.3, alpha = 0.18) {
  ellipse(g, x, y, rx, ry, `rgba(60, 40, 30, ${alpha})`);
}
// Barra de progreso.
export function bar(g, x, y, w, h, p, color = PAL.leaf, back = 'rgba(61,43,36,0.16)') {
  fillRR(g, x, y, w, h, h / 2, back);
  if (p > 0.01) fillRR(g, x, y, Math.max(h, w * clamp(p)), h, h / 2, color);
}

// ── Texto ──
export function text(g, str, x, y, { size = 18, color = PAL.ink, align = 'center', baseline = 'middle', weight = 800, stroke = null, strokeWidth = 4, maxWidth, alpha = 1 } = {}) {
  g.save();
  g.globalAlpha *= alpha;
  g.font = `${weight} ${size}px ${FONT}`;
  g.textAlign = align; g.textBaseline = baseline; g.lineJoin = 'round';
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = strokeWidth; g.strokeText(str, x, y, maxWidth); }
  g.fillStyle = color;
  g.fillText(str, x, y, maxWidth);
  g.restore();
}
// Texto con saltos de línea automáticos. Devuelve la altura total usada. valign: 'top' | 'middle'
export function wrapText(g, str, x, y, maxWidth, { size = 16, lineHeight = size * 1.25, color = PAL.ink, align = 'center', weight = 700, valign = 'top', measureOnly = false } = {}) {
  g.save();
  g.font = `${weight} ${size}px ${FONT}`;
  const lines = [];
  for (const para of String(str).split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const test = line ? `${line} ${word}` : word;
      if (g.measureText(test).width > maxWidth && line) { lines.push(line); line = word; } else line = test;
    }
    lines.push(line);
  }
  const total = lines.length * lineHeight;
  if (!measureOnly) {
    g.textAlign = align; g.textBaseline = 'middle'; g.fillStyle = color;
    let yy = (valign === 'middle' ? y - total / 2 : y) + lineHeight / 2;
    for (const l of lines) { g.fillText(l, x, yy); yy += lineHeight; }
  }
  g.restore();
  return total;
}
// Dibuja un emoji centrado en (x, y).
export function emoji(g, ch, x, y, size = 28, { rot = 0, alpha = 1, flip = false } = {}) {
  g.save();
  g.globalAlpha *= alpha;
  g.translate(x, y);
  if (rot) g.rotate(rot);
  if (flip) g.scale(-1, 1);
  g.font = `${size}px ${EMOJI_FONT}`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(ch, 0, size * 0.06);
  g.restore();
}

// ── Paisaje ──
const SKIES = {
  day: ['#6fc1f3', '#cdeeff', '#fff3d6'],
  dawn: ['#8fb8f0', '#ffd9c2', '#fff0c4'],
  sunset: ['#f08a6c', '#ffc27a', '#ffe9b0'],
  night: ['#1c2550', '#3a3f86', '#7a6bb8'],
  storm: ['#56637d', '#8b98ad', '#c3cbd6'],
  sea: ['#69bff2', '#bfe9ff', '#e9fbff'],
};
export function sky(g, W, H, kind = 'day') {
  const c = SKIES[kind] || SKIES.day;
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, c[0]); gr.addColorStop(0.65, c[1]); gr.addColorStop(1, c[2]);
  g.save(); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
}
export function sun(g, x, y, r = 30, t = 0) {
  g.save();
  g.translate(x, y);
  g.fillStyle = 'rgba(255, 220, 120, 0.35)';
  for (let i = 0; i < 10; i++) {
    g.rotate(Math.PI / 5);
    g.beginPath(); g.moveTo(-r * 0.22, -r * 1.15); g.lineTo(0, -r * (1.55 + 0.1 * Math.sin(t * 2 + i))); g.lineTo(r * 0.22, -r * 1.15); g.fill();
  }
  g.restore();
  circle(g, x, y, r * 1.18, 'rgba(255, 226, 140, 0.45)');
  circle(g, x, y, r, PAL.sun);
  circle(g, x - r * 0.25, y - r * 0.25, r * 0.55, 'rgba(255, 255, 255, 0.28)');
}
export function moon(g, x, y, r = 24) {
  circle(g, x, y, r * 1.3, 'rgba(255, 250, 220, 0.15)');
  circle(g, x, y, r, '#fff6cf');
  circle(g, x - r * 0.3, y - r * 0.2, r * 0.18, '#eadf9f');
  circle(g, x + r * 0.25, y + r * 0.3, r * 0.26, '#eadf9f');
}
export function stars(g, W, H, t = 0, count = 40, seed = 7) {
  g.save();
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < count; i++) {
    const x = rnd() * W, y = rnd() * H, r = 0.6 + rnd() * 1.4, ph = rnd() * 6.28;
    g.globalAlpha = 0.45 + 0.45 * Math.sin(t * 2 + ph);
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, r, 0, 6.28); g.fill();
  }
  g.restore();
}
export function cloud(g, x, y, s = 1, alpha = 1, color = '#ffffff') {
  g.save();
  g.globalAlpha *= alpha; g.fillStyle = color;
  g.beginPath();
  g.arc(x - 22 * s, y + 4 * s, 14 * s, 0, 6.28); g.arc(x - 6 * s, y - 6 * s, 18 * s, 0, 6.28);
  g.arc(x + 14 * s, y - 2 * s, 15 * s, 0, 6.28); g.arc(x + 28 * s, y + 5 * s, 11 * s, 0, 6.28);
  g.rect(x - 22 * s, y + 2 * s, 50 * s, 14 * s);
  g.fill();
  g.restore();
}
export function stormCloud(g, x, y, s = 1, t = 0, { bolt = true } = {}) {
  cloud(g, x, y + 3 * s, s, 1, '#59627a');
  cloud(g, x, y, s, 1, '#7b859c');
  if (bolt) {
    g.save(); g.fillStyle = PAL.sun; g.globalAlpha = 0.75 + 0.25 * Math.sin(t * 12);
    g.beginPath(); g.moveTo(x + 2 * s, y + 14 * s); g.lineTo(x - 7 * s, y + 30 * s); g.lineTo(x, y + 29 * s); g.lineTo(x - 5 * s, y + 42 * s);
    g.lineTo(x + 9 * s, y + 24 * s); g.lineTo(x + 2 * s, y + 25 * s); g.lineTo(x + 8 * s, y + 14 * s); g.closePath(); g.fill(); g.restore();
  }
  // carita enojada simpática
  circle(g, x - 8 * s, y + 2 * s, 2.2 * s, '#2f3547'); circle(g, x + 10 * s, y + 2 * s, 2.2 * s, '#2f3547');
}
// Colinas onduladas: baseY = altura media; amp = amplitud; phase desplaza el dibujo (parallax).
export function hills(g, W, H, baseY, amp = 18, color = PAL.leaf, phase = 0, freq = 0.012) {
  g.save(); g.fillStyle = color; g.beginPath(); g.moveTo(0, H);
  for (let x = 0; x <= W + 8; x += 8) g.lineTo(x, baseY + Math.sin((x + phase) * freq) * amp + Math.sin((x + phase) * freq * 2.3 + 1) * amp * 0.4);
  g.lineTo(W, H); g.closePath(); g.fill(); g.restore();
}
export function ground(g, W, H, y, color = PAL.leaf, edge = PAL.leafLight) {
  g.save(); g.fillStyle = color; g.fillRect(0, y, W, H - y);
  if (edge) { g.fillStyle = edge; g.fillRect(0, y, W, 5); }
  g.restore();
}
export function rainbow(g, cx, cy, r, w = 5, alpha = 0.85) {
  const cols = ['#ff6b6b', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#9775fa'];
  g.save(); g.globalAlpha *= alpha; g.lineWidth = w + 0.5;
  cols.forEach((c, i) => { g.strokeStyle = c; g.beginPath(); g.arc(cx, cy, Math.max(1, r - i * w), Math.PI, 0); g.stroke(); });
  g.restore();
}
// Agua con olas animadas desde y hasta el fondo.
export function water(g, W, H, y, t = 0, color = PAL.water, deep = PAL.waterDeep) {
  g.save();
  const gr = g.createLinearGradient(0, y, 0, H); gr.addColorStop(0, color); gr.addColorStop(1, deep);
  g.fillStyle = gr; g.beginPath(); g.moveTo(0, H);
  for (let x = 0; x <= W + 6; x += 6) g.lineTo(x, y + Math.sin(x * 0.045 + t * 2) * 3 + Math.sin(x * 0.021 - t * 1.3) * 3);
  g.lineTo(W, H); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 2; g.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const xx = ((i * 97 + t * 14) % (W + 60)) - 30, yy = y + 16 + ((i * 53) % Math.max(20, H - y - 20));
    g.beginPath(); g.moveTo(xx, yy); g.quadraticCurveTo(xx + 7, yy - 4, xx + 14, yy); g.stroke();
  }
  g.restore();
}
export function tree(g, x, y, s = 1, { kind = 'round', sway = 0 } = {}) {
  shadow(g, x, y, 22 * s, 6 * s);
  fillRR(g, x - 5 * s, y - 34 * s, 10 * s, 36 * s, 4 * s, PAL.wood);
  g.save(); g.translate(x, y - 34 * s); g.rotate(sway * 0.05);
  if (kind === 'palm') {
    g.strokeStyle = PAL.leafDeep; g.lineWidth = 7 * s; g.lineCap = 'round';
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(i * 14 * s, -22 * s, i * 24 * s, -4 * s + Math.abs(i) * 4 * s); g.stroke(); }
  } else if (kind === 'olive') {
    ellipse(g, -12 * s, -10 * s, 18 * s, 14 * s, '#7fae6a'); ellipse(g, 12 * s, -14 * s, 20 * s, 15 * s, '#8fbc78'); ellipse(g, 0, -26 * s, 18 * s, 13 * s, '#9cc888');
  } else {
    circle(g, -13 * s, -8 * s, 17 * s, PAL.leafDeep); circle(g, 13 * s, -10 * s, 18 * s, PAL.leaf); circle(g, 0, -26 * s, 19 * s, PAL.leafLight);
  }
  g.restore();
}
export function bush(g, x, y, s = 1, color = PAL.leafDeep) {
  circle(g, x - 12 * s, y - 6 * s, 11 * s, color); circle(g, x, y - 11 * s, 13 * s, color); circle(g, x + 12 * s, y - 6 * s, 10 * s, color);
  fillRR(g, x - 22 * s, y - 8 * s, 44 * s, 9 * s, 4 * s, color);
}
export function rock(g, x, y, s = 1, color = PAL.stone) {
  g.save(); g.fillStyle = color; g.beginPath();
  g.moveTo(x - 20 * s, y); g.quadraticCurveTo(x - 22 * s, y - 16 * s, x - 8 * s, y - 20 * s);
  g.quadraticCurveTo(x + 6 * s, y - 26 * s, x + 16 * s, y - 14 * s); g.quadraticCurveTo(x + 24 * s, y - 6 * s, x + 20 * s, y); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.28)'; g.beginPath(); g.ellipse(x - 4 * s, y - 15 * s, 8 * s, 3.5 * s, -0.3, 0, 6.28); g.fill();
  g.restore();
}
export function flower(g, x, y, s = 1, color = PAL.rose) {
  g.save(); g.strokeStyle = PAL.leafDeep; g.lineWidth = 2 * s; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 12 * s); g.stroke(); g.restore();
  for (let i = 0; i < 5; i++) circle(g, x + Math.cos(i * 1.257) * 4 * s, y - 12 * s + Math.sin(i * 1.257) * 4 * s, 3 * s, color);
  circle(g, x, y - 12 * s, 2.4 * s, PAL.sun);
}
export function grass(g, x, y, s = 1, color = PAL.leafDeep) {
  g.save(); g.strokeStyle = color; g.lineWidth = 2 * s; g.lineCap = 'round';
  for (const dx of [-4, 0, 4]) { g.beginPath(); g.moveTo(x + dx * s, y); g.quadraticCurveTo(x + dx * 1.6 * s, y - 6 * s, x + dx * 2.2 * s, y - 10 * s); g.stroke(); }
  g.restore();
}

// ── Personajes ──
// Palomita de perfil (para volar o caminar). Centro del cuerpo en (x, y). s = 1 → ≈ 62 de ancho.
// opts: dir (1 mira a la derecha, -1 izquierda), flap (0..1 posición del ala: 0 abajo, 1 arriba), tilt (rad),
//       mood ('happy' | 'sad' | 'hurt' | 'sleep'), carry ('olive' | null), feet (true si está posada), blink (bool)
export function dove(g, x, y, s = 1, { dir = 1, flap = 0, tilt = 0, mood = 'happy', carry = null, feet = false, blink = false } = {}) {
  g.save();
  g.translate(x, y); g.scale(dir * s, s); g.rotate(tilt);
  // cola en abanico
  g.fillStyle = PAL.doveShade;
  for (const a of [-0.35, 0, 0.35]) {
    g.save(); g.translate(-18, 3); g.rotate(a + 0.15);
    g.beginPath(); g.ellipse(-12, 0, 13, 5.2, 0, 0, 6.28); g.fill(); g.restore();
  }
  // patitas
  if (feet) {
    g.strokeStyle = PAL.beak; g.lineWidth = 2.6; g.lineCap = 'round';
    for (const fx of [-3, 6]) { g.beginPath(); g.moveTo(fx, 14); g.lineTo(fx, 21); g.moveTo(fx - 3, 22); g.lineTo(fx + 5, 22); g.stroke(); }
  }
  // cuerpo
  const bg = g.createLinearGradient(0, -18, 0, 18); bg.addColorStop(0, PAL.dove); bg.addColorStop(1, PAL.doveShade);
  g.fillStyle = bg; g.beginPath(); g.ellipse(0, 1, 22, 17, -0.08, 0, 6.28); g.fill();
  // cabeza
  g.fillStyle = PAL.dove; g.beginPath(); g.arc(15, -13, 13.5, 0, 6.28); g.fill();
  // copete
  g.strokeStyle = PAL.dove; g.lineWidth = 3.4; g.lineCap = 'round';
  g.beginPath(); g.moveTo(12, -25); g.quadraticCurveTo(8, -33, 3, -30); g.stroke();
  g.beginPath(); g.moveTo(15, -26); g.quadraticCurveTo(15, -35, 9, -36); g.stroke();
  // pico
  g.fillStyle = PAL.beak; g.beginPath(); g.moveTo(26.5, -14); g.quadraticCurveTo(37, -11.5, 27, -6.5); g.quadraticCurveTo(25, -10, 26.5, -14); g.fill();
  if (carry === 'olive') { g.save(); g.translate(34, -9); olive(g, 0, 0, 0.7, 0.5); g.restore(); }
  // rubor
  g.fillStyle = 'rgba(255, 150, 175, 0.55)'; g.beginPath(); g.ellipse(17, -6.5, 4.2, 2.8, 0, 0, 6.28); g.fill();
  // ojo
  if (mood === 'sleep' || blink) {
    g.strokeStyle = PAL.eye; g.lineWidth = 2; g.beginPath(); g.arc(19.5, -15, 3.6, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  } else if (mood === 'hurt') {
    g.strokeStyle = PAL.eye; g.lineWidth = 2.2; g.beginPath(); g.moveTo(16.5, -18); g.lineTo(22.5, -12.5); g.moveTo(22.5, -18); g.lineTo(16.5, -12.5); g.stroke();
  } else {
    g.fillStyle = PAL.eye; g.beginPath(); g.arc(19.5, -15.5, 4.3, 0, 6.28); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(21, -17.2, 1.5, 0, 6.28); g.arc(18.2, -13.8, 0.8, 0, 6.28); g.fill();
    if (mood === 'sad') { g.fillStyle = PAL.dove; g.beginPath(); g.moveTo(14, -21); g.lineTo(25, -17.5); g.lineTo(25, -22); g.closePath(); g.fill(); }
  }
  // ala (gira en el hombro)
  g.save();
  g.translate(-1, -5); g.rotate(lerp(0.55, -1.25, clamp(flap)));
  const wg = g.createLinearGradient(0, 0, -26, 6); wg.addColorStop(0, '#f6f9ff'); wg.addColorStop(1, PAL.doveTip);
  g.fillStyle = wg;
  g.beginPath(); g.moveTo(6, -4); g.quadraticCurveTo(-8, -12, -27, -4); g.quadraticCurveTo(-23, 0, -26, 4); g.quadraticCurveTo(-19, 6, -21, 10);
  g.quadraticCurveTo(-13, 10, -13, 14); g.quadraticCurveTo(0, 13, 7, 3); g.closePath(); g.fill();
  g.restore();
  g.restore();
}
// Palomita de frente, parada. (x, y) = punto del suelo entre las patitas. s = 1 → ≈ 64 de alto.
// opts: mood ('happy' | 'sad' | 'sleep' | 'wow'), wings (0 plegadas .. 1 arriba), bob (desplazamiento vertical)
export function doveFront(g, x, y, s = 1, { mood = 'happy', wings = 0, bob = 0 } = {}) {
  shadow(g, x, y, 20 * s, 5 * s);
  g.save(); g.translate(x, y + bob * s); g.scale(s, s);
  g.fillStyle = PAL.beak;
  for (const fx of [-8, 8]) { g.beginPath(); g.ellipse(fx, -1.5, 6, 3, 0, 0, 6.28); g.fill(); }
  // alas
  for (const d of [-1, 1]) {
    g.save(); g.translate(d * 15, -28); g.rotate(d * lerp(0.15, -1.9, clamp(wings)));
    const wg = g.createLinearGradient(0, 0, 0, 22); wg.addColorStop(0, '#f6f9ff'); wg.addColorStop(1, PAL.doveTip);
    g.fillStyle = wg; g.beginPath(); g.ellipse(d * 5, 11, 7.5, 15, d * 0.15, 0, 6.28); g.fill(); g.restore();
  }
  const bg = g.createLinearGradient(0, -40, 0, 0); bg.addColorStop(0, PAL.dove); bg.addColorStop(1, PAL.doveShade);
  g.fillStyle = bg; g.beginPath(); g.ellipse(0, -19, 19, 18, 0, 0, 6.28); g.fill();
  g.fillStyle = PAL.dove; g.beginPath(); g.arc(0, -43, 17, 0, 6.28); g.fill();
  g.strokeStyle = PAL.dove; g.lineWidth = 3.6; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-2, -58); g.quadraticCurveTo(-7, -67, -12, -63); g.stroke();
  g.beginPath(); g.moveTo(1, -59); g.quadraticCurveTo(2, -69, -4, -70); g.stroke();
  g.fillStyle = 'rgba(255, 150, 175, 0.55)';
  g.beginPath(); g.ellipse(-11, -37, 4.5, 3, 0, 0, 6.28); g.ellipse(11, -37, 4.5, 3, 0, 0, 6.28); g.fill();
  for (const d of [-1, 1]) {
    if (mood === 'sleep') { g.strokeStyle = PAL.eye; g.lineWidth = 2; g.beginPath(); g.arc(d * 7.5, -45, 3.4, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); }
    else if (mood === 'happy' && wings > 0.6) { g.strokeStyle = PAL.eye; g.lineWidth = 2.2; g.beginPath(); g.arc(d * 7.5, -43, 3.6, 1.15 * Math.PI, 1.85 * Math.PI); g.stroke(); }
    else {
      g.fillStyle = PAL.eye; g.beginPath(); g.arc(d * 7.5, -45, mood === 'wow' ? 5 : 4.3, 0, 6.28); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(d * 7.5 + 1.4, -46.6, 1.5, 0, 6.28); g.fill();
      if (mood === 'sad') { g.fillStyle = PAL.dove; g.beginPath(); g.moveTo(d * 13.5, -51); g.lineTo(d * 2, -48); g.lineTo(d * 2, -52.5); g.closePath(); g.fill(); }
    }
  }
  g.fillStyle = PAL.beak; g.beginPath(); g.moveTo(-4.5, -40.5); g.quadraticCurveTo(0, -43, 4.5, -40.5); g.quadraticCurveTo(0, -33, -4.5, -40.5); g.fill();
  g.restore();
}
// Ovejita. (x, y) = suelo. dir 1 mira a la derecha.
export function sheep(g, x, y, s = 1, { dir = 1, t = 0, sad = false, hop = 0 } = {}) {
  shadow(g, x, y, 17 * s, 4.5 * s);
  g.save(); g.translate(x, y - hop * s); g.scale(dir * s, s);
  g.fillStyle = '#4a3b35'; for (const lx of [-9, -3, 5, 11]) fillRR(g, lx - 2, -8, 4, 9, 2, '#4a3b35');
  g.fillStyle = '#fffdf6';
  const wob = Math.sin(t * 6) * 0.6;
  for (const [cx, cy, r] of [[-10, -17, 9], [0, -21 + wob, 10.5], [10, -17, 9], [-4, -12, 9], [7, -12, 8.5], [-14, -12, 6]]) { g.beginPath(); g.arc(cx, cy, r, 0, 6.28); g.fill(); }
  g.fillStyle = '#4a3b35'; g.beginPath(); g.ellipse(17, -19, 7, 8, 0.15, 0, 6.28); g.fill();
  g.beginPath(); g.ellipse(11.5, -24, 3.6, 2, -0.6, 0, 6.28); g.fill();
  g.fillStyle = '#fffdf6'; g.beginPath(); g.arc(14, -26, 4.5, 0, 6.28); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(19, -21, 2, 0, 6.28); g.fill();
  g.fillStyle = '#1e1512'; g.beginPath(); g.arc(19.5, -21, 1, 0, 6.28); g.fill();
  if (sad) { g.fillStyle = PAL.water; g.beginPath(); g.arc(20.5, -17, 1.4, 0, 6.28); g.fill(); }
  g.restore();
}
// Persona sencilla con túnica (estilo bíblico). (x, y) = suelo. Altura ≈ 56 × s.
// opts: robe, skin, hair, sash (color de faja o null), veil (color de manto en la cabeza o null), beard (bool),
//       arms: 'down' | 'up' | 'open' | 'reach', dir (1 | -1), t (para respirar/caminar), walk (bool), sad (bool), lying (bool)
export function person(g, x, y, s = 1, { robe = '#e9c46a', skin = '#e8b38a', hair = '#5a3b28', sash = null, veil = null, beard = false, arms = 'down', dir = 1, t = 0, walk = false, sad = false, lying = false } = {}) {
  if (!lying) shadow(g, x, y, 15 * s, 4 * s);
  g.save(); g.translate(x, y); g.scale(dir * s, s);
  if (lying) { g.translate(0, -8); g.rotate(-Math.PI / 2 * 0.92); }
  const sw = walk ? Math.sin(t * 9) * 4 : 0;
  // pies
  g.fillStyle = '#7a4f35'; g.beginPath(); g.ellipse(-5 + sw, -1.5, 5, 2.6, 0, 0, 6.28); g.ellipse(5 - sw, -1.5, 5, 2.6, 0, 0, 6.28); g.fill();
  // brazos
  g.strokeStyle = robe; g.lineWidth = 7; g.lineCap = 'round';
  const armTo = { down: [[-13, -16], [13, -16]], up: [[-15, -46], [15, -46]], open: [[-21, -30], [21, -30]], reach: [[-12, -16], [22, -32]] }[arms] || [[-13, -16], [13, -16]];
  g.beginPath(); g.moveTo(-9, -32); g.lineTo(armTo[0][0], armTo[0][1]); g.moveTo(9, -32); g.lineTo(armTo[1][0], armTo[1][1]); g.stroke();
  g.fillStyle = skin; g.beginPath(); g.arc(armTo[0][0], armTo[0][1], 3.4, 0, 6.28); g.arc(armTo[1][0], armTo[1][1], 3.4, 0, 6.28); g.fill();
  // túnica
  g.fillStyle = robe; g.beginPath(); g.moveTo(-10, -36); g.quadraticCurveTo(0, -40, 10, -36); g.lineTo(13, -3); g.quadraticCurveTo(0, 1, -13, -3); g.closePath(); g.fill();
  if (sash) { g.fillStyle = sash; g.fillRect(-11.5, -22, 23, 4.5); }
  // cabeza
  if (veil) { g.fillStyle = veil; g.beginPath(); g.arc(0, -45, 11.5, Math.PI * 0.95, Math.PI * 2.05); g.lineTo(11, -33); g.lineTo(-11, -33); g.closePath(); g.fill(); }
  else { g.fillStyle = hair; g.beginPath(); g.arc(0, -46.5, 10.2, 0, 6.28); g.fill(); }
  g.fillStyle = skin; g.beginPath(); g.arc(0, -44, 9.2, 0, 6.28); g.fill();
  if (!veil) { g.fillStyle = hair; g.beginPath(); g.arc(0, -47, 9.6, Math.PI * 1.05, Math.PI * 1.95); g.closePath(); g.fill(); }
  if (beard) { g.fillStyle = hair; g.beginPath(); g.arc(0, -42, 8.6, 0.12 * Math.PI, 0.88 * Math.PI); g.quadraticCurveTo(0, -33, 8, -40); g.fill(); }
  g.fillStyle = PAL.eye; g.beginPath(); g.arc(-3.2, -44.5, 1.3, 0, 6.28); g.arc(3.2, -44.5, 1.3, 0, 6.28); g.fill();
  g.strokeStyle = beard ? '#fff' : '#a0553f'; g.lineWidth = 1.3; g.beginPath();
  if (sad) g.arc(0, -38.5, 2.6, 1.15 * Math.PI, 1.85 * Math.PI); else g.arc(0, -41.5, 2.8, 0.15 * Math.PI, 0.85 * Math.PI);
  g.stroke();
  g.restore();
}

// ── Objetos ──
export function heart(g, x, y, s = 1, color = PAL.roseDeep) {
  g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = color;
  g.beginPath(); g.moveTo(0, 9); g.bezierCurveTo(-14, -1, -9, -12, 0, -5); g.bezierCurveTo(9, -12, 14, -1, 0, 9); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.ellipse(-4.5, -4.5, 2.4, 1.6, -0.6, 0, 6.28); g.fill();
  g.restore();
}
export function star(g, x, y, r = 10, color = PAL.sun, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = color; g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? r * 0.46 : r; g.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); }
  g.closePath(); g.fill(); g.restore();
}
// Semilla dorada (la moneda del juego).
export function seed(g, x, y, r = 8, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.fillStyle = PAL.sunDeep; g.beginPath(); g.ellipse(0, 0, r * 0.72, r, 0, 0, 6.28); g.fill();
  g.fillStyle = PAL.sun; g.beginPath(); g.ellipse(-r * 0.12, -r * 0.1, r * 0.5, r * 0.78, 0, 0, 6.28); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.ellipse(-r * 0.25, -r * 0.4, r * 0.14, r * 0.26, -0.3, 0, 6.28); g.fill();
  g.restore();
}
// Ramita de olivo. s = 1 → ≈ 34 de largo.
export function olive(g, x, y, s = 1, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.strokeStyle = '#6f8f3a'; g.lineWidth = 2.2; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-15, 4); g.quadraticCurveTo(0, -2, 17, -6); g.stroke();
  for (const [lx, ly, a] of [[-9, 1, -1.0], [-3, -0.5, 0.9], [3, -2, -1.0], [9, -3.5, 0.8], [16, -6, -0.2]]) {
    g.save(); g.translate(lx, ly); g.rotate(a); g.fillStyle = a < 0 ? '#8dbb4e' : '#7aa83f'; g.beginPath(); g.ellipse(0, -5.5, 2.7, 6.2, 0, 0, 6.28); g.fill(); g.restore();
  }
  circle(g, 0, 3.4, 2.4, '#5f6b3a');
  g.restore();
}
export function drop(g, x, y, s = 1, color = PAL.water) {
  g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = color;
  g.beginPath(); g.moveTo(0, -11); g.bezierCurveTo(9, 0, 8, 9, 0, 9); g.bezierCurveTo(-8, 9, -9, 0, 0, -11); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.ellipse(-2.6, 2, 1.6, 3, 0.3, 0, 6.28); g.fill();
  g.restore();
}
export function sunray(g, x, y, s = 1, t = 0) {
  g.save(); g.translate(x, y); g.rotate(t); g.scale(s, s);
  g.fillStyle = 'rgba(255, 214, 90, 0.5)';
  for (let i = 0; i < 8; i++) { g.rotate(Math.PI / 4); g.beginPath(); g.moveTo(-2.4, -8); g.lineTo(0, -14); g.lineTo(2.4, -8); g.fill(); }
  g.fillStyle = PAL.sun; g.beginPath(); g.arc(0, 0, 8, 0, 6.28); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(-2.4, -2.4, 3, 0, 6.28); g.fill();
  g.restore();
}
// Velita. lit = encendida. (x, y) = base.
export function candle(g, x, y, s = 1, lit = true, t = 0) {
  fillRR(g, x - 5 * s, y - 24 * s, 10 * s, 24 * s, 3 * s, '#fff6dd');
  fillRR(g, x - 5 * s, y - 24 * s, 3.4 * s, 24 * s, 1.5 * s, 'rgba(240, 200, 140, 0.45)');
  g.save(); g.strokeStyle = '#5a4636'; g.lineWidth = 1.4 * s; g.beginPath(); g.moveTo(x, y - 24 * s); g.lineTo(x, y - 28 * s); g.stroke(); g.restore();
  if (lit) {
    const f = 1 + Math.sin(t * 11 + x) * 0.08;
    circle(g, x, y - 33 * s, 13 * s, 'rgba(255, 210, 110, 0.22)');
    g.save(); g.translate(x, y - 28 * s); g.scale(s * f, s * (2 - f));
    g.fillStyle = PAL.sunDeep; g.beginPath(); g.moveTo(0, -12); g.bezierCurveTo(6, -4, 5, 2, 0, 2); g.bezierCurveTo(-5, 2, -6, -4, 0, -12); g.fill();
    g.fillStyle = '#fff3b0'; g.beginPath(); g.moveTo(0, -6.5); g.bezierCurveTo(3, -2, 2.4, 1, 0, 1); g.bezierCurveTo(-2.4, 1, -3, -2, 0, -6.5); g.fill();
    g.restore();
  }
}
export function bubble(g, x, y, r = 8, alpha = 0.8) {
  g.save(); g.globalAlpha *= alpha;
  circle(g, x, y, r, 'rgba(255,255,255,0.28)', 'rgba(255,255,255,0.9)', 1.4);
  circle(g, x - r * 0.35, y - r * 0.35, r * 0.2, '#fff');
  g.restore();
}
// Globito de diálogo con texto centrado. (x, y) = punta del globito (abajo al centro).
export function speech(g, x, y, str, { size = 14, maxWidth = 150, bg = '#ffffff', color = PAL.ink } = {}) {
  const h = wrapText(g, str, 0, 0, maxWidth, { size, measureOnly: true });
  g.save(); g.font = `700 ${size}px ${FONT}`;
  const w = Math.min(maxWidth, Math.max(...String(str).split('\n').map(l => g.measureText(l).width))) + 22;
  g.restore();
  const bh = h + 14, bx = x - w / 2, by = y - 9 - bh;
  shadowRect(g, bx, by + 3, w, bh, 12);
  fillRR(g, bx, by, w, bh, 12, bg);
  g.save(); g.fillStyle = bg; g.beginPath(); g.moveTo(x - 7, y - 10); g.lineTo(x, y); g.lineTo(x + 7, y - 10); g.closePath(); g.fill(); g.restore();
  wrapText(g, str, x, by + 7, w - 20, { size, color });
}
function shadowRect(g, x, y, w, h, r) { fillRR(g, x, y, w, h, r, 'rgba(60, 40, 30, 0.14)'); }
