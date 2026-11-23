// Habitaciones de la palomita, estilo diorama: pared y piso PINTADOS por código (CanvasTexture) y unos pocos
// objetos 3D sencillos a los lados. Así cada cuarto cuesta muy pocas llamadas de dibujo en un teléfono.
//
//   buildRoom(THREE, id) → { id, group, props, light, update(dt, t), setLights(on), setCandle(on), dispose() }
//   props: mallas con userData.prop = 'ball' | 'duck' | 'lamp' | 'candle' | 'bible' (objetos que responden al toque)
//   light: { hemi: [cielo, suelo, intensidad], sun: [color, intensidad] } → receta de luz del cuarto
//
// Medidas (unidades del mundo): la palomita está en el origen mirando a +Z y mide ≈ 2 de alto.
// La pared está en z = -2.6 (9 de ancho × 6.4 de alto). En teléfonos angostos solo se ve x ∈ [-1.5, 1.5],
// y la palomita tapa el centro hasta y ≈ 2: por eso lo importante de la pared va ARRIBA (y 2.1–3.4) y a los lados.
export const ROOM_IDS = ['sala', 'cocina', 'bano', 'dormitorio', 'capilla'];
export const ROOM_NAMES = { sala: 'Nido', cocina: 'Cocina', bano: 'Baño', dormitorio: 'Dormitorio', capilla: 'Oración' };

const WALL_W = 9, WALL_H = 6.4, WALL_Z = -2.6, WU = 128;      // WU = píxeles por unidad en la pared
const FLOOR_W = 10, FLOOR_D = 9, FU = 64;                      // el piso va de z = -2.6 a z = 6.4

// Pequeño pintor en unidades del mundo (y hacia arriba) sobre un canvas 2D.
function painter(g, U, left, top) {
  const X = x => (x - left) * U, Y = y => (top - y) * U;
  const P = {
    g, X, Y, U,
    rect(x, y, w, h, fill, r = 0) {            // (x, y) = esquina inferior izquierda
      g.fillStyle = fill; g.beginPath();
      if (g.roundRect && r) g.roundRect(X(x), Y(y + h), w * U, h * U, r * U); else g.rect(X(x), Y(y + h), w * U, h * U);
      g.fill();
    },
    circ(x, y, r, fill) { g.fillStyle = fill; g.beginPath(); g.arc(X(x), Y(y), r * U, 0, 6.2832); g.fill(); },
    ell(x, y, rx, ry, fill, rot = 0) { g.fillStyle = fill; g.beginPath(); g.ellipse(X(x), Y(y), rx * U, ry * U, rot, 0, 6.2832); g.fill(); },
    line(x1, y1, x2, y2, color, w = 0.03) { g.strokeStyle = color; g.lineWidth = w * U; g.lineCap = 'round'; g.beginPath(); g.moveTo(X(x1), Y(y1)); g.lineTo(X(x2), Y(y2)); g.stroke(); },
    poly(pts, fill) { g.fillStyle = fill; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); g.closePath(); g.fill(); },
    vgrad(y0, y1, c0, c1) { const gr = g.createLinearGradient(0, Y(y1), 0, Y(y0)); gr.addColorStop(0, c1); gr.addColorStop(1, c0); return gr; },
    emoji(ch, x, y, size) { g.font = `${size * U}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, X(x), Y(y)); },
    star(x, y, r, fill) { g.fillStyle = fill; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.45 : r; g.lineTo(X(x) + Math.cos(a) * q * U, Y(y) + Math.sin(a) * q * U); } g.closePath(); g.fill(); },
  };
  return P;
}

// Ventana con marco, cielo y cortinas. day = false pinta la noche.
function windowArt(P, x, y, w, h, { frame = '#ffffff', curtain = null, day = true } = {}) {
  P.rect(x - 0.09, y - 0.09, w + 0.18, h + 0.18, frame, 0.1);
  P.rect(x, y, w, h, day ? P.vgrad(y, y + h, '#d8f1ff', '#7cc8f5') : P.vgrad(y, y + h, '#3a3f86', '#1c2550'), 0.05);
  if (day) {
    P.circ(x + w * 0.74, y + h * 0.72, 0.13, '#ffd95e');
    for (const [cx, cy, s] of [[0.28, 0.6, 1], [0.6, 0.3, 0.8]]) { P.circ(x + w * cx, y + h * cy, 0.11 * s, '#fff'); P.circ(x + w * cx + 0.12 * s, y + h * cy + 0.03, 0.09 * s, '#fff'); P.circ(x + w * cx - 0.11 * s, y + h * cy - 0.01, 0.08 * s, '#fff'); }
    P.ell(x + w * 0.5, y + 0.02, w * 0.6, 0.14, '#a8e08c');
  } else {
    P.circ(x + w * 0.7, y + h * 0.7, 0.16, '#fff6cf'); P.circ(x + w * 0.76, y + h * 0.74, 0.13, '#2a3068');
    for (const [sx, sy] of [[0.2, 0.8], [0.35, 0.45], [0.5, 0.85], [0.15, 0.3], [0.85, 0.3], [0.55, 0.2]]) P.star(x + w * sx, y + h * sy, 0.035, '#fff');
  }
  P.rect(x + w / 2 - 0.025, y, 0.05, h, frame); P.rect(x, y + h / 2 - 0.025, w, 0.05, frame);
  P.rect(x - 0.16, y - 0.16, w + 0.32, 0.1, frame, 0.04);
  if (curtain) {
    P.poly([[x - 0.14, y + h + 0.14], [x + 0.2, y + h + 0.14], [x + 0.06, y + h * 0.35], [x - 0.14, y + 0.02]], curtain);
    P.poly([[x + w + 0.14, y + h + 0.14], [x + w - 0.2, y + h + 0.14], [x + w - 0.06, y + h * 0.35], [x + w + 0.14, y + 0.02]], curtain);
    P.rect(x - 0.2, y + h + 0.1, w + 0.4, 0.07, '#b98556', 0.03);
  }
}
function frameArt(P, x, y, w, h, bg, draw) {
  P.rect(x - 0.06, y - 0.06, w + 0.12, h + 0.12, '#c08a57', 0.04);
  P.rect(x, y, w, h, bg, 0.02);
  draw?.();
}
function baseboard(P, color = '#fff6e8', edge = 'rgba(120,80,50,0.18)') {
  P.rect(-4.5, 0, 9, 0.3, color); P.rect(-4.5, 0.29, 9, 0.025, edge);
}
function tiles(P, y0, y1, size, c1, c2, grout) {
  P.rect(-4.5, y0, 9, y1 - y0, grout);
  for (let r = 0, y = y0; y < y1; y += size, r++) for (let c = 0, x = -4.5; x < 4.5; x += size, c++) P.rect(x + 0.015, y + 0.015, size - 0.03, size - 0.03, (r + c) % 2 ? c1 : c2, 0.03);
}

const WALLS = {
  sala(P) {
    P.rect(-4.5, 0, 9, 6.4, P.vgrad(0, 6.4, '#ffd3ad', '#ffe6cc'));
    for (let x = -4.5; x < 4.5; x += 0.5) P.rect(x, 0, 0.25, 6.4, 'rgba(255,255,255,0.16)');
    baseboard(P);
    windowArt(P, -1.42, 2.2, 1.2, 1.15, { curtain: '#ff9db5' });
    frameArt(P, 0.2, 2.55, 0.72, 0.62, '#cdeeff', () => { P.circ(0.72, 3.0, 0.08, '#ffd95e'); P.ell(0.45, 2.58, 0.36, 0.2, '#6cc070'); P.ell(0.78, 2.56, 0.26, 0.14, '#a8e08c'); });
    frameArt(P, 1.1, 2.3, 0.44, 0.52, '#fff1f4', () => P.emoji('❤️', 1.32, 2.56, 0.28));
    frameArt(P, 1.08, 3.02, 0.36, 0.32, '#fff6dd', () => P.emoji('⭐', 1.26, 3.18, 0.2));
    // estante con libros (pantallas anchas)
    P.rect(-3.9, 2.3, 1.7, 0.07, '#c08a57', 0.02);
    ['#ff8a5c', '#6cc070', '#9b7be8', '#ffc94a', '#4aa3e0', '#ec6f90'].forEach((c, i) => P.rect(-3.8 + i * 0.2, 2.37, 0.15, 0.42 + (i % 3) * 0.07, c, 0.02));
    P.emoji('🪴', -2.5, 2.62, 0.45);
    frameArt(P, 2.3, 2.4, 0.9, 0.9, '#e4f6e2', () => P.emoji('🌳', 2.75, 2.85, 0.6));
  },
  cocina(P) {
    P.rect(-4.5, 0, 9, 6.4, P.vgrad(1.9, 6.4, '#dff5ea', '#eefaf3'));
    tiles(P, 0, 1.95, 0.42, '#ffffff', '#f1fbf6', '#bfe6d2');
    P.rect(-4.5, 1.93, 9, 0.09, '#8fd1b3', 0.03);
    // repisa con frascos
    P.rect(-1.55, 2.5, 1.6, 0.07, '#c08a57', 0.02);
    [['#ffc94a', 0.3], ['#ff8a5c', 0.42], ['#a8e08c', 0.34], ['#ff9db5', 0.26], ['#9b7be8', 0.38]].forEach(([c, hh], i) => {
      P.rect(-1.45 + i * 0.3, 2.57, 0.22, hh, c, 0.05); P.rect(-1.43 + i * 0.3, 2.57 + hh, 0.18, 0.05, '#8a5a3c', 0.02); P.rect(-1.41 + i * 0.3, 2.62, 0.05, hh * 0.6, 'rgba(255,255,255,0.4)', 0.02);
    });
    P.rect(-1.55, 3.25, 1.6, 0.07, '#c08a57', 0.02);
    P.emoji('🍯', -1.25, 3.5, 0.34); P.emoji('🫖', -0.75, 3.52, 0.38); P.emoji('🥣', -0.25, 3.47, 0.3);
    windowArt(P, 0.35, 2.25, 1.15, 1.1, { curtain: '#ffd95e' });
    // utensilios y reloj (pantallas anchas)
    P.rect(-3.8, 3.1, 1.6, 0.05, '#8a5a3c', 0.02);
    ['🥄', '🍴', '🥄'].forEach((e, i) => P.emoji(e, -3.5 + i * 0.5, 2.8, 0.4));
    P.circ(2.7, 3.0, 0.42, '#ffffff'); P.circ(2.7, 3.0, 0.36, '#fff6dd'); P.line(2.7, 3.0, 2.7, 3.24, '#3d2b24', 0.035); P.line(2.7, 3.0, 2.87, 2.95, '#3d2b24', 0.035);
  },
  bano(P) {
    tiles(P, 0, 6.4, 0.46, '#cdeaf8', '#dff3fc', '#a9d8ee');
    P.rect(-4.5, 1.84, 9, 0.12, '#58b7ea', 0.03);
    baseboard(P, '#ffffff', 'rgba(60,120,160,0.2)');
    // espejo ovalado
    P.ell(-0.85, 2.85, 0.5, 0.64, '#ffffff'); P.ell(-0.85, 2.85, 0.42, 0.56, P.vgrad(2.3, 3.4, '#bfe6ff', '#eefaff'));
    P.line(-1.05, 3.12, -0.82, 3.3, 'rgba(255,255,255,0.9)', 0.05); P.line(-0.98, 2.95, -0.86, 3.05, 'rgba(255,255,255,0.8)', 0.035);
    // toallero con toalla
    P.rect(1.75, 3.05, 1.25, 0.06, '#aeb6c2', 0.03);
    P.rect(1.9, 2.25, 0.46, 0.84, '#ffd95e', 0.05); P.rect(1.9, 2.36, 0.46, 0.08, '#ffffff'); P.rect(1.9, 2.5, 0.46, 0.04, '#ffffff');
    P.rect(2.47, 2.45, 0.4, 0.64, '#ff9db5', 0.05); P.rect(2.47, 2.56, 0.4, 0.07, '#ffffff');

    // burbujas y repisa (pantallas anchas)
    for (const [x, y, r] of [[-2.2, 3.4, 0.14], [-2.6, 2.9, 0.09], [-1.9, 2.6, 0.07], [2.2, 3.5, 0.11], [2.6, 3.0, 0.16], [1.9, 3.75, 0.07]]) { P.circ(x, y, r, 'rgba(255,255,255,0.55)'); P.circ(x - r * 0.3, y + r * 0.3, r * 0.25, '#fff'); }
    P.rect(-3.3, 2.3, 1.3, 0.07, '#ffffff', 0.02); P.emoji('🧴', -3.0, 2.6, 0.4); P.emoji('🧽', -2.5, 2.55, 0.32);
  },
  dormitorio(P) {
    P.rect(-4.5, 0, 9, 6.4, P.vgrad(0, 6.4, '#d6ccf2', '#e7e0fa'));
    for (let i = 0; i < 46; i++) P.star(-4.4 + ((i * 1.93) % 8.8), 0.5 + ((i * 2.71) % 5.6), 0.045 + (i % 3) * 0.018, 'rgba(255,255,255,0.55)');
    baseboard(P, '#f6f1ff', 'rgba(80,60,140,0.2)');
    windowArt(P, -0.62, 2.22, 1.24, 1.2, { curtain: '#9b7be8' });
    // guirnalda de estrellas
    for (let i = 0; i < 9; i++) { const x = -3.6 + i * 0.9, y = 3.95 - Math.sin(i / 8 * Math.PI) * 0.22; P.star(x, y, 0.1, ['#ffc94a', '#ff9db5', '#7cc8f5'][i % 3]); }
    // repisa con juguetes (pantallas anchas)
    P.rect(-3.9, 2.4, 1.5, 0.07, '#c08a57', 0.02); P.emoji('🧸', -3.5, 2.75, 0.5); P.emoji('🚂', -2.85, 2.68, 0.4);
    frameArt(P, 2.2, 2.4, 0.9, 0.8, '#fff6dd', () => P.emoji('🌙', 2.65, 2.8, 0.5));
  },
  capilla(P) {
    P.rect(-4.5, 0, 9, 6.4, P.vgrad(0, 6.4, '#f1e0c0', '#fbf1dc'));
    for (let r = 0; r < 11; r++) for (let c = -1; c < 8; c++) P.rect(-4.5 + c * 1.3 + (r % 2) * 0.65 + 0.02, r * 0.6 + 0.02, 1.26, 0.56, 'rgba(255,255,255,0.22)', 0.05);
    baseboard(P, '#d9c29a', 'rgba(90,60,30,0.25)');
    // resplandor suave y cruz de madera sencilla
    const g = P.g, gr = g.createRadialGradient(P.X(0), P.Y(2.95), 0, P.X(0), P.Y(2.95), 1.25 * P.U);
    gr.addColorStop(0, 'rgba(255,236,170,0.75)'); gr.addColorStop(1, 'rgba(255,236,170,0)');
    g.fillStyle = gr; g.fillRect(P.X(-1.3), P.Y(4.3), 2.6 * P.U, 2.7 * P.U);
    P.rect(-0.085, 2.3, 0.17, 1.3, '#8a5a3c', 0.03); P.rect(-0.42, 3.08, 0.84, 0.17, '#8a5a3c', 0.03);
    P.rect(-0.05, 2.33, 0.05, 1.24, 'rgba(255,255,255,0.18)', 0.02);
    // dos vitrales de arco
    for (const s of [-1, 1]) {
      const cx = s * 1.22, w = 0.5, y0 = 2.1, hh = 1.0;
      P.rect(cx - w / 2 - 0.06, y0 - 0.06, w + 0.12, hh + 0.06, '#8b6f4e', 0.02); P.circ(cx, y0 + hh, w / 2 + 0.06, '#8b6f4e');
      const cols = ['#ff8a8a', '#ffd95e', '#7cc8f5', '#8fdc8f', '#c9a3ff', '#ffb36b'];
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) P.rect(cx - w / 2 + j * w / 2 + 0.012, y0 + i * hh / 4 + 0.012, w / 2 - 0.024, hh / 4 - 0.024, cols[(i * 2 + j + (s > 0 ? 3 : 0)) % 6], 0.015);
      g.save(); g.beginPath(); g.arc(P.X(cx), P.Y(y0 + hh), (w / 2) * P.U, Math.PI, 0); g.closePath(); g.clip();
      P.rect(cx - w / 2, y0 + hh, w / 2 - 0.012, w / 2, cols[s > 0 ? 1 : 4]); P.rect(cx + 0.012, y0 + hh, w / 2, w / 2, cols[s > 0 ? 2 : 0]);
      g.restore();
    }
    P.emoji('🕊️', -2.7, 3.0, 0.5); P.emoji('🌿', 2.7, 2.9, 0.5);
  },
};

function planks(F, c1, c2) {
  F.g.fillStyle = c1; F.g.fillRect(0, 0, FLOOR_W * FU, FLOOR_D * FU);
  for (let r = 0, z = -2.6; z < 6.4; z += 0.55, r++) {
    F.rect(-5, z, 10, 0.02, 'rgba(90,55,25,0.22)');
    for (let x = -5 + (r % 2) * 0.9; x < 5; x += 1.8) { F.rect(x, z, 0.02, 0.55, 'rgba(90,55,25,0.2)'); if ((r + Math.round(x)) % 3 === 0) F.rect(x + 0.02, z + 0.02, 1.76, 0.51, c2); }
  }
}
function floorTiles(F, size, c1, c2) {
  for (let r = 0, z = -2.6; z < 6.4; z += size, r++) for (let c = 0, x = -5; x < 5; x += size, c++) F.rect(x, z, size, size, (r + c) % 2 ? c1 : c2);
}
// En el piso el pintor usa (x, z): z crece hacia la cámara.
const FLOORS = {
  sala(F) {
    planks(F, '#e2b582', '#e8be8e');
    F.circ(0, -0.1, 1.75, '#ff8a5c'); F.circ(0, -0.1, 1.55, '#fff3e2'); F.circ(0, -0.1, 1.3, '#ffd3ad');
    for (let i = 0; i < 12; i++) F.circ(Math.cos(i * 0.5236) * 1.42, -0.1 + Math.sin(i * 0.5236) * 1.42, 0.07, '#ff8a5c');
  },
  cocina(F) {
    floorTiles(F, 0.7, '#fff6e2', '#d8f1e4');
    F.ell(0, -0.1, 1.7, 1.45, '#ffd95e'); F.ell(0, -0.1, 1.5, 1.25, '#fff3c4');
  },
  bano(F) {
    floorTiles(F, 0.6, '#e9f7ff', '#bfe2f5');
    F.rect(-1.5, -1.25, 3, 2.4, '#3ecfc4', 0.5); F.rect(-1.32, -1.07, 2.64, 2.04, '#8be5dc', 0.4);
    for (let i = 0; i < 5; i++) F.rect(-1.1 + i * 0.5, -0.85, 0.16, 1.6, 'rgba(255,255,255,0.45)', 0.08);
  },
  dormitorio(F) {
    planks(F, '#d8b48c', '#dfbd97');
    F.circ(0, -0.1, 1.75, '#9b7be8'); F.circ(0, -0.1, 1.55, '#e7e0fa');
    for (let i = 0; i < 8; i++) F.star(Math.cos(i * 0.7854) * 1.15, -0.1 + Math.sin(i * 0.7854) * 1.15, 0.13, '#ffc94a');
  },
  capilla(F) {
    floorTiles(F, 0.9, '#e6d9c2', '#dccdb2');
    for (let z = -2.6; z < 6.4; z += 0.9) F.rect(-5, z, 10, 0.03, 'rgba(90,60,30,0.18)');
    F.rect(-1.45, -2.2, 2.9, 7, '#b5393f', 0.2); F.rect(-1.3, -2.05, 2.6, 6.7, '#c9474b', 0.15);
    F.rect(-1.3, -2.05, 0.09, 6.7, '#f0c35a'); F.rect(1.21, -2.05, 0.09, 6.7, '#f0c35a');
  },
};

export const ROOM_LIGHT = {
  sala: { hemi: [0xffffff, 0xffe2c4, 1.85], sun: [0xfff3df, 1.9] },
  cocina: { hemi: [0xffffff, 0xe6fff0, 1.9], sun: [0xfffbea, 1.8] },
  bano: { hemi: [0xf4fbff, 0xd8f0ff, 1.9], sun: [0xffffff, 1.7] },
  dormitorio: { hemi: [0xfaf6ff, 0xe6dcff, 1.8], sun: [0xfff1e0, 1.7] },
  capilla: { hemi: [0xfff8ea, 0xf3dfba, 1.75], sun: [0xffe9c2, 1.9] },
  noche: { hemi: [0x9aa6ea, 0x464c8c, 1.3], sun: [0xb8c4ff, 0.7] },
};

export function buildRoom(THREE, id) {
  const group = new THREE.Group();
  group.name = 'cuarto:' + id;
  const disposables = [];
  const mats = new Map();
  const mat = (color, extra = {}) => {
    const key = color + JSON.stringify(extra);
    if (!mats.has(key)) { const m = new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...extra }); mats.set(key, m); disposables.push(m); }
    return mats.get(key);
  };
  function tex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'));
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    disposables.push(t);
    return t;
  }
  function add(geo, material, x = 0, y = 0, z = 0, opts = {}) {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    if (opts.s) m.scale.set(...opts.s);
    if (opts.r) m.rotation.set(...opts.r);
    m.castShadow = opts.shadow !== false; m.receiveShadow = !!opts.receive;
    (opts.parent || group).add(m);
    disposables.push(geo);
    return m;
  }
  const sphere = (r = 1) => new THREE.SphereGeometry(r, 20, 14);
  const cyl = (rt, rb, hh, seg = 20) => new THREE.CylinderGeometry(rt, rb, hh, seg);
  const box = (w, hh, d) => new THREE.BoxGeometry(w, hh, d);

  // Pared (sin luz: conserva los colores pintados) y piso (recibe la sombra de la palomita).
  const wallMat = new THREE.MeshBasicMaterial({ map: tex(WALL_W * WU, WALL_H * WU, g => WALLS[id](painter(g, WU, -WALL_W / 2, WALL_H))) });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(WALL_W, WALL_H), wallMat);
  wall.position.set(0, WALL_H / 2, WALL_Z);
  group.add(wall);
  const floorMat = new THREE.MeshStandardMaterial({ roughness: 1, map: tex(FLOOR_W * FU, FLOOR_D * FU, g => {
    // pintor con (x, z): arriba del canvas = fondo (z = -2.6)
    const F = painter(g, FU, -FLOOR_W / 2, 0);
    const X = F.X, Zp = z => (z + 2.6) * FU;
    F.Y = Zp;
    F.rect = (x, z, w, d, fill, r = 0) => { g.fillStyle = fill; g.beginPath(); if (g.roundRect && r) g.roundRect(X(x), Zp(z), w * FU, d * FU, r * FU); else g.rect(X(x), Zp(z), w * FU, d * FU); g.fill(); };
    F.circ = (x, z, r, fill) => { g.fillStyle = fill; g.beginPath(); g.arc(X(x), Zp(z), r * FU, 0, 6.2832); g.fill(); };
    F.ell = (x, z, rx, rz, fill) => { g.fillStyle = fill; g.beginPath(); g.ellipse(X(x), Zp(z), rx * FU, rz * FU, 0, 0, 6.2832); g.fill(); };
    F.star = (x, z, r, fill) => { g.fillStyle = fill; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.45 : r; g.lineTo(X(x) + Math.cos(a) * q * FU, Zp(z) + Math.sin(a) * q * FU); } g.closePath(); g.fill(); };
    FLOORS[id](F);
  }) });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_W, FLOOR_D), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, WALL_Z + FLOOR_D / 2); floor.receiveShadow = true;
  group.add(floor);
  disposables.push(wallMat, floorMat, wall.geometry, floor.geometry);

  const props = [];
  const prop = (mesh, name) => { mesh.userData.prop = name; props.push(mesh); return mesh; };
  const anim = [];            // funciones (dt, t) de animación del cuarto
  const room = { id, group, props, light: ROOM_LIGHT[id], lightsOn: true, candleOn: false };

  if (id === 'sala') {
    // pelota
    const ball = prop(add(sphere(0.25), mat(0xff8a5c), -1.18, 0.25, -0.55), 'ball');
    add(new THREE.TorusGeometry(0.25, 0.035, 8, 24), mat(0xffffff), 0, 0, 0, { parent: ball, r: [Math.PI / 2, 0, 0.5] });
    let bounce = 0;
    room.poke = name => { if (name === 'ball') bounce = 1; };
    anim.push((dt, t) => { if (bounce > 0) { bounce = Math.max(0, bounce - dt * 0.9); ball.position.y = 0.25 + Math.abs(Math.sin(bounce * 9.4)) * 0.7 * bounce; ball.rotation.z += dt * 6 * bounce; } });
    // maceta
    add(cyl(0.2, 0.15, 0.3), mat(0xc97b5a), 1.22, 0.15, -0.95);
    for (const [x, y, z, s] of [[0, 0.5, 0, 1], [-0.16, 0.42, 0.04, 0.8], [0.17, 0.44, -0.02, 0.85]]) add(sphere(0.16), mat(s === 1 ? 0x6cc070 : 0x8fd16a), 1.22 + x, y, -0.95 + z, { s: [s * 0.75, s * 1.35, s * 0.75] });
    // cojín y cubos
    add(sphere(0.3), mat(0x9b7be8), -1.3, 0.12, -1.35, { s: [1.1, 0.4, 0.9] });
    add(box(0.22, 0.22, 0.22), mat(0xffc94a), 1.12, 0.11, -0.25, { r: [0, 0.4, 0] });
    add(box(0.2, 0.2, 0.2), mat(0x5aa9ff), 1.3, 0.1, -0.05, { r: [0, -0.3, 0] });
  } else if (id === 'cocina') {
    // mesita con mantel y frutero
    add(box(0.95, 0.06, 0.62), mat(0xfff6e2), 1.32, 0.62, -1.0);
    add(box(0.99, 0.2, 0.66), mat(0xff8a5c), 1.32, 0.5, -1.0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(cyl(0.035, 0.035, 0.5, 8), mat(0xc08a57), 1.32 + sx * 0.4, 0.25, -1.0 + sz * 0.25);
    add(new THREE.SphereGeometry(0.2, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(0x5aa9ff, { side: THREE.DoubleSide }), 1.25, 0.86, -1.0);
    add(sphere(0.085), mat(0xe74c3c), 1.19, 0.83, -0.98); add(sphere(0.08), mat(0xffc94a), 1.31, 0.84, -1.02); add(sphere(0.07), mat(0x8e5fd0), 1.26, 0.9, -0.93);
    // panera
    add(cyl(0.27, 0.22, 0.2), mat(0xc08a57), -1.25, 0.1, -0.8);
    add(sphere(0.2), mat(0xe9b872), -1.25, 0.24, -0.8, { s: [1.25, 0.6, 0.8] });
    add(sphere(0.12), mat(0xf3cc8c), -1.1, 0.27, -0.72, { s: [1.2, 0.6, 0.8] });
    // jarrita
    add(cyl(0.08, 0.1, 0.22), mat(0xffffff), 1.62, 0.76, -0.88);
  } else if (id === 'bano') {
    // tina con espuma
    add(cyl(0.6, 0.5, 0.5, 28), mat(0xffffff), -1.35, 0.25, -1.15, { s: [1.25, 1, 0.8] });
    add(cyl(0.54, 0.54, 0.04, 28), mat(0x9fdcf5), -1.35, 0.48, -1.15, { s: [1.25, 1, 0.8], shadow: false });
    const foam = [];
    for (const [x, y, z, r] of [[-0.3, 0.56, 0.05, 0.17], [0, 0.6, -0.05, 0.2], [0.3, 0.56, 0.08, 0.16], [0.14, 0.7, 0.1, 0.12], [-0.12, 0.68, -0.1, 0.13]]) foam.push(add(sphere(r), mat(0xffffff, { roughness: 0.4 }), -1.35 + x, y, -1.15 + z, { shadow: false }));
    anim.push((dt, t) => foam.forEach((f, i) => { f.scale.setScalar(1 + Math.sin(t * 1.6 + i * 1.7) * 0.06); }));
    // patito de hule
    const duck = prop(add(sphere(0.19), mat(0xffd23f), 1.18, 0.17, -0.4, { s: [1.15, 0.9, 1] }), 'duck');
    add(sphere(0.12), mat(0xffd23f), 0.06, 0.2, 0.1, { parent: duck });
    add(new THREE.ConeGeometry(0.05, 0.1, 10), mat(0xff8a3c), 0.06, 0.18, 0.24, { parent: duck, r: [Math.PI / 2, 0, 0] });
    add(sphere(0.02), mat(0x2b1d16), 0.02, 0.25, 0.2, { parent: duck }); add(sphere(0.02), mat(0x2b1d16), 0.11, 0.25, 0.2, { parent: duck });
    let squeak = 0;
    room.poke = name => { if (name === 'duck') squeak = 1; };
    anim.push((dt, t) => { if (squeak > 0) { squeak = Math.max(0, squeak - dt * 2.2); const k = Math.sin(squeak * Math.PI); duck.scale.set(1.15 + k * 0.25, 0.9 - k * 0.3, 1 + k * 0.2); } duck.rotation.y = -0.5 + Math.sin(t * 0.8) * 0.15; });
    // banquito
    add(cyl(0.22, 0.22, 0.07), mat(0xff9db5), 1.4, 0.34, -1.2); add(cyl(0.05, 0.07, 0.32, 8), mat(0xffffff), 1.4, 0.16, -1.2);

    // ── Regadera de mano (se arrastra con el dedo; mientras se sostiene, sale agua) ──
    const chrome = mat(0xf4f8fb, { roughness: 0.28 });
    const rim = mat(0x3ecfc4, { roughness: 0.35 });
    const shower = new THREE.Group();
    shower.name = 'regadera';
    // el mango apunta hacia arriba y la cara de la regadera mira hacia abajo
    add(cyl(0.06, 0.075, 0.6, 18), chrome, 0, 0.38, 0, { parent: shower });
    add(cyl(0.085, 0.085, 0.07, 18), rim, 0, 0.7, 0, { parent: shower });
    add(cyl(0.085, 0.085, 0.05, 18), rim, 0, 0.16, 0, { parent: shower });
    add(cyl(0.3, 0.13, 0.17, 32), chrome, 0, 0, 0, { parent: shower });
    add(new THREE.TorusGeometry(0.29, 0.035, 10, 36), rim, 0, -0.07, 0, { parent: shower, r: [Math.PI / 2, 0, 0] });
    const faceMat = new THREE.MeshStandardMaterial({ roughness: 0.5, map: tex(128, 128, g => {
      g.fillStyle = '#eef4f8'; g.fillRect(0, 0, 128, 128);
      g.fillStyle = '#7fb6d6';
      for (let r = 0; r < 4; r++) { const n = r === 0 ? 1 : r * 7; for (let i = 0; i < n; i++) { const a = (i / n) * 6.2832 + r * 0.3, d = r * 15; g.beginPath(); g.arc(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, 3.2, 0, 6.2832); g.fill(); } }
    }) });
    disposables.push(faceMat);
    add(new THREE.CircleGeometry(0.28, 32), faceMat, 0, -0.086, 0, { parent: shower, r: [Math.PI / 2, 0, 0], shadow: false });
    shower.position.set(0.42, 2.42, 0.4);
    shower.rotation.set(0.12, 0, -0.32);
    group.add(shower);
    // manguera que baja desde arriba: se vuelve a dibujar cuando la regadera se mueve
    const hoseMat = mat(0xdfe8f0, { roughness: 0.3 });
    const hose = new THREE.Mesh(new THREE.BufferGeometry(), hoseMat);
    hose.castShadow = true;
    group.add(hose);
    const hoseFrom = new THREE.Vector3(1.05, 5.2, -0.2);
    const tip = new THREE.Vector3(), mid = new THREE.Vector3(), up = new THREE.Vector3();
    let hoseKey = '';
    function drawHose() {
      up.set(0, 0.7, 0).applyEuler(shower.rotation); tip.copy(shower.position).add(up);
      const key = tip.x.toFixed(3) + tip.y.toFixed(3) + tip.z.toFixed(3);
      if (key === hoseKey) return;
      hoseKey = key;
      mid.copy(hoseFrom).add(tip).multiplyScalar(0.5); mid.x += 0.45; mid.y -= 0.25;
      const curve = new THREE.QuadraticBezierCurve3(hoseFrom.clone(), mid.clone(), tip.clone());
      hose.geometry.dispose();
      hose.geometry = new THREE.TubeGeometry(curve, 28, 0.045, 8, false);
    }
    drawHose();
    disposables.push({ dispose: () => hose.geometry.dispose() });
    // ── Jabón en su jabonera ──
    const soap = new THREE.Group();
    soap.name = 'jabon';
    add(sphere(0.22), mat(0xff9db5, { roughness: 0.35 }), 0, 0.09, 0, { parent: soap, s: [1.15, 0.5, 0.75] });
    add(sphere(0.06), mat(0xffffff, { roughness: 0.3 }), 0.08, 0.2, 0.05, { parent: soap, s: [1, 0.5, 1] });
    add(sphere(0.04), mat(0xffffff, { roughness: 0.3 }), -0.1, 0.19, -0.02, { parent: soap, s: [1, 0.5, 1] });
    soap.position.set(-1.08, 0.07, 0.62);
    group.add(soap);
    add(cyl(0.34, 0.27, 0.07, 24), mat(0xffffff), -1.08, 0.035, 0.62, { s: [1.1, 1, 0.8] });
    room.draggables = [
      { id: 'shower', obj: shower, home: shower.position.clone(), homeRot: shower.rotation.clone(), lift: 0.55, nozzle: new THREE.Vector3(0, -0.12, 0) },
      { id: 'soap', obj: soap, home: soap.position.clone(), homeRot: soap.rotation.clone(), lift: 0.3 },
    ];
    anim.push(() => drawHose());
  } else if (id === 'dormitorio') {
    // ── Camita: cabecera, colchón, almohada y frazada de retazos ──
    const wood = mat(0xd39a62), woodDark = mat(0xb27a46);
    add(box(1.95, 0.26, 1.45), wood, 0, 0.2, -1.12);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(cyl(0.07, 0.06, 0.16, 10), woodDark, sx * 0.88, 0.08, -1.12 + sz * 0.62);
    const arch = new THREE.Shape();
    arch.moveTo(-1.02, 0); arch.lineTo(-1.02, 0.78); arch.absarc(-0.58, 0.78, 0.44, Math.PI, Math.PI / 2, true);
    arch.lineTo(0.58, 1.22); arch.absarc(0.58, 0.78, 0.44, Math.PI / 2, 0, true); arch.lineTo(1.02, 0); arch.closePath();
    const head = add(new THREE.ExtrudeGeometry(arch, { depth: 0.12, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2, curveSegments: 18 }), wood, 0, 0.1, -1.92);
    head.receiveShadow = true;
    // estrella y corazón en la cabecera
    const star = new THREE.Shape();
    for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? 0.08 : 0.19; i ? star.lineTo(Math.cos(a) * q, Math.sin(a) * q) : star.moveTo(Math.cos(a) * q, Math.sin(a) * q); }
    add(new THREE.ExtrudeGeometry(star, { depth: 0.04, bevelEnabled: false }), mat(0xffc94a, { emissive: 0x6a4a00, emissiveIntensity: 0.25 }), 0, 1.02, -1.76);
    add(sphere(0.055), mat(0xff9db5), -0.55, 0.95, -1.75); add(sphere(0.055), mat(0x7cc8f5), 0.55, 0.95, -1.75);
    add(box(1.82, 0.22, 1.32), mat(0xfff8ee, { roughness: 0.9 }), 0, 0.42, -1.1, { receive: true });
    add(sphere(0.4), mat(0xffffff, { roughness: 0.95 }), 0, 0.6, -1.5, { s: [1.35, 0.4, 0.7], receive: true });
    const quilt = tex(256, 256, g => {
      const cols = ['#b9a2f2', '#ffc6d6', '#bfe3f7', '#ffe39a'];
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = cols[(x + y * 2) % 4]; g.fillRect(x * 64, y * 64, 64, 64); }
      g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 3; g.setLineDash([7, 6]);
      for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 256); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(256, i * 64); g.stroke(); }
      g.setLineDash([]); g.fillStyle = 'rgba(255,255,255,0.7)';
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if ((x + y) % 2) { const cx = x * 64 + 32, cy = y * 64 + 32; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? 6 : 13; g.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } g.fill(); }
    });
    quilt.wrapS = quilt.wrapT = THREE.RepeatWrapping; quilt.repeat.set(2, 1);
    const quiltMat = new THREE.MeshStandardMaterial({ map: quilt, roughness: 0.95, side: THREE.DoubleSide });
    disposables.push(quiltMat);
    // doblada a los pies de la cama (despierta)
    const folded = add(box(1.86, 0.1, 0.5), quiltMat, 0, 0.58, -0.62);
    // tapadita sobre la palomita (dormida): un pedazo de cilindro acostado como frazada que cae
    const blanket = new THREE.Group();
    // Arco de cilindro acostado (eje X): cubre el frente de la palomita desde el colchón hasta el cuello.
    const drape = add(new THREE.CylinderGeometry(1, 1, 1.9, 30, 1, true, -0.78, 1.95), quiltMat, 0, 0, 0, { parent: blanket, r: [0, 0, -Math.PI / 2] });
    drape.receiveShadow = true;
    add(new THREE.CylinderGeometry(0.075, 0.075, 1.94, 12), mat(0xffffff, { roughness: 0.9 }), 0, Math.sin(0.78), Math.cos(0.78), { parent: blanket, r: [0, 0, Math.PI / 2] });
    blanket.visible = false;
    group.add(blanket);
    room.bed = {
      // dónde se acuesta la palomita (el origen de la palomita es el piso entre sus patitas)
      spot: new THREE.Vector3(0, 0.5, -1.02),
      tuck(on, scale = 1) {
        folded.visible = !on; blanket.visible = !!on;
        const s = 0.7 * scale;
        blanket.scale.set(1, s, s);
        blanket.position.set(0, 0.5 + 0.24 * scale, -0.98);
      },
    };
    // mesita y lámpara
    add(cyl(0.26, 0.26, 0.05), mat(0xc08a57), 1.28, 0.5, -0.95); add(cyl(0.05, 0.08, 0.5, 10), mat(0xa9744a), 1.28, 0.25, -0.95);
    add(cyl(0.09, 0.11, 0.05), mat(0xffffff), 1.28, 0.55, -0.95); add(cyl(0.02, 0.02, 0.26, 8), mat(0xffffff), 1.28, 0.68, -0.95);
    const shadeMat = new THREE.MeshStandardMaterial({ color: 0xffd95e, emissive: 0xffc94a, emissiveIntensity: 0.9, roughness: 0.6 });
    disposables.push(shadeMat);
    prop(add(cyl(0.12, 0.22, 0.26, 20), shadeMat, 1.28, 0.9, -0.95), 'lamp');
    // ventana de noche (se muestra al apagar la luz)
    const night = new THREE.Mesh(new THREE.PlaneGeometry(1.24 + 0.18, 1.2 + 0.18), new THREE.MeshBasicMaterial({ map: tex(256, 256, g => {
      const N = painter(g, 256 / 1.42, -0.71, 1.38); windowArt(N, -0.62, 0.09, 1.24, 1.2, { day: false, frame: '#cfc8ea' });
    }) }));
    night.position.set(0, 2.22 + 0.6, WALL_Z + 0.01); night.visible = false;
    group.add(night); disposables.push(night.geometry, night.material);
    room.setLights = on => {
      room.lightsOn = !!on;
      night.visible = !on;
      wallMat.color.set(on ? 0xffffff : 0x6a74c0); floorMat.color.set(on ? 0xffffff : 0x8088c8);
      shadeMat.emissiveIntensity = on ? 0.9 : 0.05; shadeMat.color.set(on ? 0xffd95e : 0x8c8fc0);
      room.light = on ? ROOM_LIGHT.dormitorio : ROOM_LIGHT.noche;
    };
  } else if (id === 'capilla') {
    // mesita con mantel blanco, vela y florero
    add(box(0.9, 0.62, 0.55), mat(0xc08a57), 1.3, 0.31, -1.0);
    add(box(0.96, 0.05, 0.6), mat(0xffffff), 1.3, 0.645, -1.0);
    add(box(0.5, 0.36, 0.02), mat(0xffffff), 1.3, 0.47, -0.715);
    add(box(0.5, 0.03, 0.022), mat(0xf0c35a), 1.3, 0.31, -0.714);
    const candle = prop(add(cyl(0.055, 0.06, 0.34, 14), mat(0xfff6dd), 1.1, 0.84, -1.0), 'candle');
    add(cyl(0.09, 0.1, 0.03, 14), mat(0xf0c35a), 1.1, 0.685, -1.0);
    const flameMat = new THREE.SpriteMaterial({ transparent: true, depthWrite: false, map: tex(64, 96, g => {
      const gr = g.createRadialGradient(32, 62, 2, 32, 56, 34); gr.addColorStop(0, '#fffbe0'); gr.addColorStop(0.35, '#ffd95e'); gr.addColorStop(0.7, 'rgba(255,150,40,0.85)'); gr.addColorStop(1, 'rgba(255,120,20,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(32, 4); g.bezierCurveTo(58, 44, 54, 88, 32, 90); g.bezierCurveTo(10, 88, 6, 44, 32, 4); g.fill();
    }) });
    const flame = new THREE.Sprite(flameMat); flame.position.set(1.1, 1.12, -1.0); flame.scale.set(0.16, 0.24, 1); flame.visible = false;
    group.add(flame); disposables.push(flameMat);
    const glow = new THREE.PointLight(0xffc37a, 0, 4.5, 1.6); glow.position.set(1.05, 1.25, -0.6); group.add(glow);
    room.setCandle = on => { room.candleOn = !!on; flame.visible = !!on; glow.intensity = on ? 2.2 : 0; };
    anim.push((dt, t) => { if (room.candleOn) { const k = 1 + Math.sin(t * 13) * 0.07 + Math.sin(t * 7.3) * 0.05; flame.scale.set(0.16 * k, 0.24 * (2 - k), 1); glow.intensity = 2.2 * k; } });
    add(cyl(0.06, 0.08, 0.2, 12), mat(0x7cc8f5), 1.55, 0.77, -0.95);
    for (const [x, y, c] of [[0, 1.02, 0xff9db5], [-0.07, 0.96, 0xffffff], [0.07, 0.95, 0xffd95e]]) add(sphere(0.06), mat(c), 1.55 + x, y, -0.95);
    // atril con la Biblia abierta
    add(cyl(0.05, 0.07, 0.85, 10), mat(0xa9744a), -1.3, 0.425, -0.95); add(cyl(0.2, 0.24, 0.05, 16), mat(0xa9744a), -1.3, 0.025, -0.95);
    const desk = add(box(0.62, 0.04, 0.42), mat(0xc08a57), -1.3, 0.92, -0.9, { r: [0.55, 0.25, 0] });
    const bible = prop(add(box(0.56, 0.04, 0.38), mat(0x8e2f3a), 0, 0.04, 0, { parent: desk }), 'bible');
    add(box(0.25, 0.03, 0.34), mat(0xfffaf0), -0.135, 0.035, 0, { parent: bible, r: [0, 0, 0.06] });
    add(box(0.25, 0.03, 0.34), mat(0xfffaf0), 0.135, 0.035, 0, { parent: bible, r: [0, 0, -0.06] });
    add(box(0.03, 0.01, 0.36), mat(0xf0c35a), 0.02, 0.055, 0.02, { parent: bible });
  }

  room.setLights ||= () => {};
  room.setCandle ||= () => {};
  room.poke ||= () => {};
  room.update = (dt, t) => { for (const f of anim) f(dt, t); };
  room.dispose = () => { for (const d of disposables) d.dispose?.(); };
  return room;
}
