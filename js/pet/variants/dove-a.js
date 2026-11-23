// Palomita 3D — variante "a": JUGUETE DE VINILO
//
// Una palomita blanca y regordeta esculpida por código: el cuerpo y la cabeza son UNA sola superficie
// continua (una "piel" con huesos), generada a partir de elipsoides fundidos suavemente. Todo lo opaco
// (cuerpo, cabeza, alas, cola, copete, párpados, pico y patitas) vive en una única malla con esqueleto,
// así el personaje completo cuesta muy pocas llamadas de dibujo en un teléfono modesto.
//
// createDove(THREE, opts?) -> { group, anchors, hitParts, update, setMood, setSleeping, lookAt, play,
//                               setTalking, setDirt, dispose }      (contrato: ver js/pet/dove.js)
//
// - Sin imports, sin variables globales, sin relojes: toda la animación sale de update(dt, t).
// - hitParts son volúmenes invisibles muy baratos (elipsoides de pocos triángulos) pegados a cada hueso:
//   el raycast no tiene que recorrer la malla deformada. Cada uno lleva userData.part.
// - Es una palomita amiga (no es el Espíritu Santo): nada de aureolas ni rayos.

export function createDove(THREE, opts = {}) {
  const {
    Vector3, Matrix4, Quaternion, Color, Bone, Group, Object3D, Mesh, SkinnedMesh, Skeleton,
    BufferGeometry, BufferAttribute, SphereGeometry,
    MeshPhysicalMaterial, MeshLambertMaterial, MeshBasicMaterial,
  } = THREE;

  // ───────────────────────────── utilidades ─────────────────────────────
  const PI = Math.PI, TAU = PI * 2, RAD = PI / 180;
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  const sat = x => clamp(x, 0, 1);
  const lerp = (a, b, k) => a + (b - a) * k;
  const sstep = (a, b, x) => { const k = sat((x - a) / (b - a)); return k * k * (3 - 2 * k); };
  const ease = k => { k = sat(k); return k * k * (3 - 2 * k); };
  const bump = x => (x <= 0 || x >= 1 ? 0 : Math.sin(PI * x) ** 2);            // 0 → 1 → 0 suave
  const env = (p, a = 0.15, b = 0.85) => sstep(0, a, p) * (1 - sstep(b, 1, p)); // envolvente de acción
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const rgb = hex => { const c = new Color(hex); return [c.r, c.g, c.b]; };
  const mix3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

  // Paleta (la ficha del personaje)
  const WHITE = [1, 1, 1];
  const SHADE = rgb(0xe9ecfb);      // sombra lavanda muy leve (zonas bajas y pliegues)
  const TIP = rgb(0xdfe9f7);        // puntas de las alas y la cola, apenas azuladas
  const CORAL = rgb(0xff9b54);
  const CORAL_IN = rgb(0xc9553a);   // interior del pico
  const TONGUE = rgb(0xff8fa0);
  const EYE = rgb(0x2b1d16);
  const EYE_GLOW = rgb(0x7a4a2e);   // reflejo cálido en la parte baja del ojo (cuenta de vidrio)
  const LASH = rgb(0x2b1d16);
  const BLUSH = rgb(0xffb3c1);
  const MUD = rgb(0x8a5a3c);
  const MUD_DARK = rgb(0x6b4128);

  // ───────────────────── escultura: campo de distancias ─────────────────────
  // Elipsoides [cx, cy, cz, rx, ry, rz] fundidos con una unión suave. El resultado es una silueta
  // continua cuerpo–cuello–cabeza, como un juguete de vinilo de una sola pieza.
  const E_BELLY = [0, 0.63, -0.05, 0.70, 0.55, 0.66];
  const E_CHEST = [0, 0.80, 0.16, 0.50, 0.40, 0.48];
  const E_RUMP = [0, 0.50, -0.34, 0.46, 0.36, 0.46];
  const E_HEAD = [0, 1.48, 0.06, 0.58, 0.50, 0.54];
  const E_CHEEK_L = [0.22, 1.36, 0.14, 0.36, 0.30, 0.38];
  const E_CHEEK_R = [-0.22, 1.36, 0.14, 0.36, 0.30, 0.38];
  const HEAD_C = [0, 1.48, 0.06];   // centro de la cabeza
  const BODY_C = [0, 0.64, -0.02];  // centro del cuerpo

  function sdE(e, x, y, z) {
    const dx = x - e[0], dy = y - e[1], dz = z - e[2];
    const ax = dx / e[3], ay = dy / e[4], az = dz / e[5];
    const k0 = Math.sqrt(ax * ax + ay * ay + az * az);
    if (k0 < 1e-6) return -Math.min(e[3], e[4], e[5]);
    const bx = ax / e[3], by = ay / e[4], bz = az / e[5];
    return k0 * (k0 - 1) / Math.sqrt(bx * bx + by * by + bz * bz);
  }
  const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
  function sdf(x, y, z) {
    let b = smin(sdE(E_BELLY, x, y, z), sdE(E_CHEST, x, y, z), 0.22);
    b = smin(b, sdE(E_RUMP, x, y, z), 0.2);
    let h = smin(sdE(E_HEAD, x, y, z), sdE(E_CHEEK_L, x, y, z), 0.14);
    h = smin(h, sdE(E_CHEEK_R, x, y, z), 0.14);
    return smin(b, h, 0.15);
  }
  // Primer cruce de un rayo (desde un punto interior) con la superficie + normal.
  const HIT = { x: 0, y: 0, z: 0, nx: 0, ny: 0, nz: 0 };
  function surf(c, dx, dy, dz, out = HIT) {
    const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
    let t0 = 0, t1 = 0.03;
    while (t1 < 2.5 && sdf(c[0] + dx * t1, c[1] + dy * t1, c[2] + dz * t1) < 0) { t0 = t1; t1 += 0.03; }
    for (let i = 0; i < 22; i++) {
      const tm = (t0 + t1) * 0.5;
      if (sdf(c[0] + dx * tm, c[1] + dy * tm, c[2] + dz * tm) < 0) t0 = tm; else t1 = tm;
    }
    const t = (t0 + t1) * 0.5, x = c[0] + dx * t, y = c[1] + dy * t, z = c[2] + dz * t, e = 0.002;
    let nx = sdf(x + e, y, z) - sdf(x - e, y, z), ny = sdf(x, y + e, z) - sdf(x, y - e, z), nz = sdf(x, y, z + e) - sdf(x, y, z - e);
    const nl = Math.hypot(nx, ny, nz) || 1;
    out.x = x; out.y = y; out.z = z; out.nx = nx / nl; out.ny = ny / nl; out.nz = nz / nl;
    return out;
  }
  const dirYP = (yawDeg, pitchDeg) => {
    const a = yawDeg * RAD, p = pitchDeg * RAD;
    return [Math.sin(a) * Math.cos(p), Math.sin(p), Math.cos(a) * Math.cos(p)];
  };

  // ───────────────────── constructores de geometría ─────────────────────
  // "Gota": una esfera UV (polos en ±Y) cuyos vértices pasan por una función que los coloca y colorea.
  // Casi todas las piezas (alas, plumas, deditos, pico…) son gotas deformadas.
  function blob(seg, rings, map) {
    const pos = [], col = [], idx = [];
    const o = { x: 0, y: 0, z: 0, r: 1, g: 1, b: 1 };
    const put = (ux, uy, uz) => { o.r = o.g = o.b = 1; map(ux, uy, uz, o); pos.push(o.x, o.y, o.z); col.push(o.r, o.g, o.b); };
    put(0, -1, 0);
    for (let i = 1; i < rings; i++) {
      const th = PI * i / rings, y = -Math.cos(th), r = Math.sin(th);
      for (let j = 0; j < seg; j++) { const ph = TAU * j / seg; put(r * Math.sin(ph), y, r * Math.cos(ph)); }
    }
    put(0, 1, 0);
    const top = 1 + (rings - 1) * seg;
    for (let j = 0; j < seg; j++) idx.push(0, 1 + (j + 1) % seg, 1 + j);
    for (let i = 0; i < rings - 2; i++) for (let j = 0; j < seg; j++) {
      const a = 1 + i * seg + j, b = 1 + i * seg + (j + 1) % seg, c = a + seg, d = b + seg;
      idx.push(a, b, d, a, d, c);
    }
    for (let j = 0; j < seg; j++) idx.push(1 + (rings - 2) * seg + j, 1 + (rings - 2) * seg + (j + 1) % seg, top);
    return orientClosed({ pos, col, idx });
  }
  function flip(idx) { for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } }
  // Orienta una malla cerrada para que mire hacia fuera (volumen con signo positivo).
  function orientClosed(part) {
    const p = part.pos, ix = part.idx; let v = 0;
    for (let i = 0; i < ix.length; i += 3) {
      const a = ix[i] * 3, b = ix[i + 1] * 3, c = ix[i + 2] * 3;
      v += p[a] * (p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1]) + p[a + 1] * (p[b + 2] * p[c] - p[b] * p[c + 2]) + p[a + 2] * (p[b] * p[c + 1] - p[b + 1] * p[c]);
    }
    if (v < 0) flip(ix);
    return part;
  }
  // Orienta una malla abierta para que mire en sentido contrario a un punto interior.
  function orientFrom(part, cx, cy, cz) {
    const p = part.pos, ix = part.idx; let s = 0;
    for (let i = 0; i < ix.length; i += 3) {
      const a = ix[i] * 3, b = ix[i + 1] * 3, c = ix[i + 2] * 3;
      const e1x = p[b] - p[a], e1y = p[b + 1] - p[a + 1], e1z = p[b + 2] - p[a + 2];
      const e2x = p[c] - p[a], e2y = p[c + 1] - p[a + 1], e2z = p[c + 2] - p[a + 2];
      const nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
      s += nx * ((p[a] + p[b] + p[c]) / 3 - cx) + ny * ((p[a + 1] + p[b + 1] + p[c + 1]) / 3 - cy) + nz * ((p[a + 2] + p[b + 2] + p[c + 2]) / 3 - cz);
    }
    if (s < 0) flip(ix);
    return part;
  }
  // Disco con centro + anillos; map(rho 0..1, phi) coloca cada vértice.
  function disc(seg, rings, map, stride = 3) {
    const pos = [], col = [], idx = [];
    const o = { x: 0, y: 0, z: 0, r: 1, g: 1, b: 1, a: 1 };
    const put = (rho, phi) => { map(rho, phi, o); pos.push(o.x, o.y, o.z); col.push(o.r, o.g, o.b); if (stride === 4) col.push(o.a); };
    put(0, 0);
    for (let i = 1; i <= rings; i++) for (let j = 0; j < seg; j++) put(i / rings, TAU * j / seg);
    for (let j = 0; j < seg; j++) idx.push(0, 1 + j, 1 + (j + 1) % seg);
    for (let i = 0; i < rings - 1; i++) for (let j = 0; j < seg; j++) {
      const a = 1 + i * seg + j, b = 1 + i * seg + (j + 1) % seg, c = a + seg, d = b + seg;
      idx.push(a, c, d, a, d, b);
    }
    return { pos, col, idx };
  }
  function normalsOf(pos, idx) {
    const n = new Float32Array(pos.length);
    for (let i = 0; i < idx.length; i += 3) {
      const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
      const e1x = pos[b] - pos[a], e1y = pos[b + 1] - pos[a + 1], e1z = pos[b + 2] - pos[a + 2];
      const e2x = pos[c] - pos[a], e2y = pos[c + 1] - pos[a + 1], e2z = pos[c + 2] - pos[a + 2];
      const nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
      n[a] += nx; n[a + 1] += ny; n[a + 2] += nz; n[b] += nx; n[b + 1] += ny; n[b + 2] += nz; n[c] += nx; n[c + 1] += ny; n[c + 2] += nz;
    }
    for (let i = 0; i < n.length; i += 3) {
      const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1; n[i] /= l; n[i + 1] /= l; n[i + 2] /= l;
    }
    return n;
  }
  const _v = new Vector3();
  function xform(part, m) {
    const p = part.pos;
    for (let i = 0; i < p.length; i += 3) { _v.set(p[i], p[i + 1], p[i + 2]).applyMatrix4(m); p[i] = _v.x; p[i + 1] = _v.y; p[i + 2] = _v.z; }
    if (m.determinant() < 0) flip(part.idx);
    return part;
  }
  function mergeParts(parts) {
    const out = { pos: [], col: [], idx: [] };
    for (const p of parts) {
      const base = out.pos.length / 3;
      for (const v of p.pos) out.pos.push(v);
      for (const v of p.col) out.col.push(v);
      for (const v of p.idx) out.idx.push(v + base);
    }
    return out;
  }
  function toGeometry(part, colorSize = 3) {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(part.pos), 3));
    g.setAttribute('normal', new BufferAttribute(part.nor ? new Float32Array(part.nor) : normalsOf(part.pos, part.idx), 3));
    g.setAttribute('color', new BufferAttribute(new Float32Array(part.col), colorSize));
    g.setIndex(part.idx);
    return g;
  }

  // ───────────────────────────── esqueleto ─────────────────────────────
  const group = new Group();
  group.name = 'Palomita';
  const bones = [];                 // huesos que deforman la piel (su índice es el skinIndex)
  const restPos = new Map();        // posición de reposo de cada hueso en el espacio del modelo
  const ZERO = new Vector3();
  function mkBone(name, parent, x, y, z, skinned = true) {
    const b = new Bone(); b.name = name;
    const pr = restPos.get(parent) || ZERO;
    b.position.set(x - pr.x, y - pr.y, z - pr.z);
    parent.add(b); restPos.set(b, new Vector3(x, y, z));
    if (skinned) { b.userData.skin = bones.length; bones.push(b); }
    return b;
  }
  const P_BODY = [0, 0.08, 0], P_HEAD = [0, 1.12, 0.03];
  const root = mkBone('raiz', group, 0, 0, 0, false);
  const bBody = mkBone('cuerpo', root, ...P_BODY);
  const bHead = mkBone('cabeza', bBody, ...P_HEAD);
  bHead.rotation.order = 'YXZ';

  // Puntos clave sobre la superficie esculpida
  const pt = (c, d) => { const h = surf(c, d[0], d[1], d[2], {}); return h; };
  const hTop = pt(HEAD_C, [0, 1, -0.06]);
  const bCrest = mkBone('copete', bHead, hTop.x, hTop.y - 0.035, hTop.z);
  const hBeak = pt(HEAD_C, dirYP(0, -15));
  const BEAK_TILT = 0.2;                                      // el pico apunta un poco hacia abajo
  const beakO = [0, hBeak.y, hBeak.z - 0.03];                 // base del pico (ligeramente hundida)
  const bJaw = mkBone('mandibula', bHead, 0, beakO[1] - 0.004, beakO[2] - 0.01);
  const hTail = pt(BODY_C, [0, -0.2, -1]);
  const P_TAIL = [0, hTail.y, hTail.z + 0.1];
  const bTail = mkBone('cola', bBody, ...P_TAIL);
  const FOOT_X = 0.235, FOOT_Z = 0.1;
  const bFootL = mkBone('pataIzq', root, FOOT_X, 0, FOOT_Z);
  const bFootR = mkBone('pataDer', root, -FOOT_X, 0, FOOT_Z);

  // Cuencas de los ojos: orientadas con la normal de la cara y achatadas (el ojo es una cúpula baja).
  const EYE_R = 0.152, EYE_INSET = 0.046;
  const eyes = [];
  for (const s of [1, -1]) {
    const h = pt(HEAD_C, dirYP(28 * s, -3));
    const n = new Vector3(h.nx, h.ny, h.nz);
    const ex = new Vector3(0, 1, 0).cross(n).normalize(), ey = n.clone().cross(ex).normalize();
    const socket = new Bone(); socket.name = s > 0 ? 'ojoIzq' : 'ojoDer';
    const base = new Vector3(h.x - h.nx * EYE_INSET - P_HEAD[0], h.y - h.ny * EYE_INSET - P_HEAD[1], h.z - h.nz * EYE_INSET - P_HEAD[2]);
    socket.position.copy(base);
    socket.quaternion.setFromRotationMatrix(new Matrix4().makeBasis(ex, ey, n));
    socket.scale.set(EYE_R, EYE_R * 1.1, EYE_R * 0.56);
    bHead.add(socket);
    const up = new Bone(), lo = new Bone();
    up.name = 'parpadoSup'; lo.name = 'parpadoInf';
    up.rotation.order = lo.rotation.order = 'ZXY';
    socket.add(up, lo);
    up.userData.skin = bones.length; bones.push(up);
    lo.userData.skin = bones.length; bones.push(lo);
    eyes.push({ s, socket, base, ex, ey, up, lo, mesh: null });
  }

  // ───────────────────── piel: cuerpo + cabeza (una sola superficie) ─────────────────────
  const skin = { pos: [], nor: [], col: [], si: [], sw: [], idx: [] };
  function addSkin(part, weightOf) {
    // weightOf: hueso (rígido) o función (x, y, z) → [huesoA, pesoA, huesoB, pesoB]
    const base = skin.pos.length / 3, nor = part.nor || normalsOf(part.pos, part.idx);
    for (let i = 0; i < part.pos.length; i += 3) {
      const x = part.pos[i], y = part.pos[i + 1], z = part.pos[i + 2];
      skin.pos.push(x, y, z); skin.nor.push(nor[i], nor[i + 1], nor[i + 2]);
      skin.col.push(part.col[i], part.col[i + 1], part.col[i + 2]);
      if (typeof weightOf === 'function') { const w = weightOf(x, y, z); skin.si.push(w[0], w[2], 0, 0); skin.sw.push(w[1], w[3], 0, 0); }
      else { skin.si.push(weightOf.userData.skin, 0, 0, 0); skin.sw.push(1, 0, 0, 0); }
    }
    for (const v of part.idx) skin.idx.push(v + base);
  }

  {
    // Parametrización "cápsula": casquete inferior alrededor del centro del cuerpo, tramo cilíndrico a lo
    // largo de la columna y casquete superior alrededor del centro de la cabeza. Cada vértice se lanza
    // como un rayo hasta la superficie esculpida, así la malla queda limpia y bien repartida.
    const SEG = 72, NB = 13, NC = 24, NT = 15;
    const cb = [0, 0.62, -0.02], ch = [0, 1.5, 0.06];
    const pos = [], nor = [], col = [], idx = [];
    const h = {};
    const put = (c, dx, dy, dz) => {
      surf(c, dx, dy, dz, h);
      pos.push(h.x, h.y, h.z); nor.push(h.nx, h.ny, h.nz);
      // Sombreado pintado muy leve: lavanda en las zonas bajas y en el pliegue del cuello.
      const low = sstep(0.95, 0.1, h.y) * (0.35 + 0.65 * sat(0.5 - h.ny * 0.9));
      const ao = sat(1 - sdf(h.x + h.nx * 0.16, h.y + h.ny * 0.16, h.z + h.nz * 0.16) / 0.16);
      const c3 = mix3(WHITE, SHADE, sat(0.55 * low + 0.9 * ao));
      col.push(c3[0], c3[1], c3[2]);
    };
    put(cb, 0, -1, 0);
    const ring = (c, dy, dr) => { for (let j = 0; j < SEG; j++) { const ph = TAU * j / SEG; put(c, dr * Math.sin(ph), dy, dr * Math.cos(ph)); } };
    let rings = 0;
    for (let i = 1; i <= NB; i++) { const th = (i / NB) * PI / 2; ring(cb, -Math.cos(th), Math.sin(th)); rings++; }
    for (let i = 1; i < NC; i++) { const k = i / NC; ring([0, lerp(cb[1], ch[1], k), lerp(cb[2], ch[2], k)], 0, 1); rings++; }
    for (let i = 0; i < NT; i++) { const th = (i / NT) * PI / 2; ring(ch, Math.sin(th), Math.cos(th)); rings++; }
    put(ch, 0, 1, 0);
    const top = 1 + rings * SEG;
    for (let j = 0; j < SEG; j++) idx.push(0, 1 + (j + 1) % SEG, 1 + j);
    for (let i = 0; i < rings - 1; i++) for (let j = 0; j < SEG; j++) {
      const a = 1 + i * SEG + j, b = 1 + i * SEG + (j + 1) % SEG, c = a + SEG, d = b + SEG;
      idx.push(a, b, d, a, d, c);
    }
    for (let j = 0; j < SEG; j++) idx.push(1 + (rings - 1) * SEG + j, 1 + (rings - 1) * SEG + (j + 1) % SEG, top);
    const part = orientClosed({ pos, nor, col, idx });
    const iB = bBody.userData.skin, iH = bHead.userData.skin;
    addSkin(part, (x, y) => { const w = sstep(0.97, 1.25, y); return [iB, 1 - w, iH, w]; });
  }

  // ───────────────────────────── alas ─────────────────────────────
  // Cada ala es una gota achatada que se "calca" sobre el costado del cuerpo (relieve de juguete) y se
  // despega un poco hacia la punta. Gira en un hombro articulado; además puede deslizarse alrededor del
  // cuerpo (órbita) para juntarse con la otra delante del pecho al rezar.
  const WING_C = [0, 0.74, -0.02];
  const wings = [];
  for (const s of [1, -1]) {
    const sh = [84 * RAD, 26 * RAD], tp = [141 * RAD, -12 * RAD];       // hombro y punta (rumbo, elevación)
    const em = (sh[1] + tp[1]) / 2, ce = Math.cos(em);
    let ux = (tp[0] - sh[0]) * ce, uy = tp[1] - sh[1];
    const len = Math.hypot(ux, uy); ux /= len; uy /= len;
    const vx = -uy, vy = ux;
    const aSh = len * 0.4, aTip = len * 0.6, bw = 0.37;
    const c0 = [sh[0] + ux * aSh / ce, sh[1] + uy * aSh];
    const dirOf = (a, b) => {
      const psi = c0[0] + (a * ux + b * vx) / ce, eps = c0[1] + a * uy + b * vy;
      return [s * Math.sin(psi) * Math.cos(eps), Math.sin(eps), Math.cos(psi) * Math.cos(eps)];
    };
    const h = {};
    const part = blob(64, 20, (X, Y, Z, o) => {
      const rho = Math.hypot(X, Z);
      let phi = Math.atan2(X, Z);
      phi -= 0.5 * Math.sin(phi);                                         // más vértices hacia la punta
      const c = Math.cos(phi), sn = Math.sin(phi);
      const A = c > 0 ? aTip : aSh, pw = c > 0 ? 1.8 : 2;
      let R = Math.pow(Math.pow(Math.abs(c) / A, pw) + Math.pow(Math.abs(sn) / bw, pw), -1 / pw);
      const win = sstep(0.75, 0.5, Math.abs(phi));                        // ventana de las tres plumas de la punta
      R *= 1 - 0.07 * win * (0.5 - 0.5 * Math.cos(TAU * phi / 0.44));
      const a = rho * R * c, b = rho * R * sn;
      const d = dirOf(a, b);
      surf(WING_C, d[0], d[1], d[2], h);
      const an = (a + aSh) / (aSh + aTip);
      const groove = win * sstep(0.2, 0.75, rho) * Math.exp(-(((Math.abs(phi) - 0.22) / 0.075) ** 2));
      const off = -0.014 + 0.1 * an * an + (Y > 0 ? Y * 0.078 * (1 - 0.3 * groove) : Y * 0.03);
      o.x = h.x + h.nx * off; o.y = h.y + h.ny * off; o.z = h.z + h.nz * off;
      const c3 = mix3(WHITE, TIP, sstep(0.3, 1, an));
      o.r = c3[0]; o.g = c3[1]; o.b = c3[2];
    });
    // hombro (pivote) y órbita
    const dS = dirOf(-aSh * 0.62, 0); surf(WING_C, dS[0], dS[1], dS[2], h);
    const piv = [h.x - h.nx * 0.03, h.y - h.ny * 0.03, h.z - h.nz * 0.03];
    const orbit = mkBone(s > 0 ? 'orbitaIzq' : 'orbitaDer', bBody, 0, piv[1], WING_C[2], false);
    const bone = mkBone(s > 0 ? 'alaIzq' : 'alaDer', orbit, piv[0], piv[1], piv[2]);
    addSkin(part, bone);
    // datos para el volumen de toque
    const dC = dirOf(aTip * 0.12, 0); const hc = surf(WING_C, dC[0], dC[1], dC[2], {});
    const dT = dirOf(aTip, 0); const ht = surf(WING_C, dT[0], dT[1], dT[2], {});
    wings.push({ s, orbit, bone, center: hc, tip: ht, piv });
  }

  // ───────────────────────────── cola ─────────────────────────────
  {
    const fan = [-40, -20, 0, 20, 40], lens = [0.36, 0.43, 0.47, 0.43, 0.36], lift = [-0.018, 0, 0.018, 0, -0.018];
    const m = new Matrix4(), r = new Matrix4();
    const parts = fan.map((ang, i) => {
      const L = lens[i];
      const f = blob(14, 12, (X, Y, Z, o) => {
        const sN = (Y + 1) / 2;
        o.x = X * (0.07 + 0.045 * sN); o.y = Z * 0.036 + 0.05 * sN * sN; o.z = -sN * L;   // punta curvada hacia arriba
        const c3 = mix3(WHITE, TIP, sstep(0.35, 1, sN));
        o.r = c3[0]; o.g = c3[1]; o.b = c3[2];
      });
      m.makeRotationY(ang * RAD).multiply(r.makeRotationZ(-ang * RAD * 0.35));
      m.setPosition(0, lift[i], 0);
      return xform(f, m);
    });
    const tail = mergeParts(parts);
    m.makeRotationX(0.42).setPosition(P_TAIL[0], P_TAIL[1], P_TAIL[2]);
    addSkin(xform(tail, m), bTail);
  }

  // ───────────────────────────── copete ─────────────────────────────
  // Tres plumitas rizadas: la del centro se riza hacia atrás, las de los lados hacia fuera.
  {
    const plume = (L, rad, yaw, lean, curl) => {
      // curva plana: ángulo desde la vertical que crece hacia la punta (rizo)
      const N = 48, cx = [0], cy = [0], ang = [];
      for (let i = 0; i <= N; i++) ang.push(lean + curl * Math.pow(i / N, 1.7));
      for (let i = 1; i <= N; i++) { const a = (ang[i - 1] + ang[i]) / 2; cx.push(cx[i - 1] + Math.sin(a) * L / N); cy.push(cy[i - 1] + Math.cos(a) * L / N); }
      const p = blob(10, 18, (X, Y, Z, o) => {
        const sN = (Y + 1) / 2, f = sN * N, i0 = Math.min(N - 1, Math.floor(f)), k = f - i0;
        const px = lerp(cx[i0], cx[i0 + 1], k), py = lerp(cy[i0], cy[i0 + 1], k), a = lerp(ang[i0], ang[i0 + 1], k);
        const rr = rad * (0.8 + 0.45 * sstep(0, 0.7, sN)) / Math.pow(Math.max(1e-3, Math.hypot(X, Z)), 0.45);
        // sección: X = ancho (fuera del plano del rizo), Z = grosor (en el plano)
        const nx = Math.cos(a), ny = -Math.sin(a);
        o.x = X * rr * 1.25; o.y = py + Z * rr * 0.85 * ny; o.z = -(px + Z * rr * 0.85 * nx);   // se riza hacia −Z
        const c3 = mix3(WHITE, TIP, sstep(0.45, 1, sN) * 0.8);
        o.r = c3[0]; o.g = c3[1]; o.b = c3[2];
      });
      return xform(p, new Matrix4().makeRotationY(yaw));
    };
    const parts = [
      plume(0.46, 0.05, 0, -0.35, 4.3),
      xform(plume(0.33, 0.042, 1.25, 0.05, 3.9), new Matrix4().makeTranslation(0.07, -0.02, -0.01)),
      xform(plume(0.33, 0.042, -1.25, 0.05, 3.9), new Matrix4().makeTranslation(-0.07, -0.02, -0.01)),
    ];
    const cr = restPos.get(bCrest);
    addSkin(xform(mergeParts(parts), new Matrix4().makeTranslation(cr.x, cr.y, cr.z)), bCrest);
  }

  // ───────────────────────────── pico ─────────────────────────────
  // Dos piezas redondeadas (superior fija a la cabeza, inferior con bisagra), interior más oscuro y lengüita.
  {
    const mB = new Matrix4().makeRotationX(BEAK_TILT).setPosition(beakO[0], beakO[1], beakO[2]);
    const upper = blob(20, 14, (X, Y, Z, o) => {
      const t = sat(Z), w = 1 - 0.42 * sstep(0, 1, t);
      o.x = X * 0.112 * w; o.z = Z * 0.2;
      o.y = (Y > 0 ? Y * 0.082 : Y * 0.012) - 0.03 * t * t;       // punta apenas ganchuda
      const c3 = Y < -0.12 ? CORAL_IN : CORAL;
      o.r = c3[0]; o.g = c3[1]; o.b = c3[2];
    });
    const mouth = blob(12, 8, (X, Y, Z, o) => {
      o.x = X * 0.07; o.y = Y * 0.04 - 0.004; o.z = Z * 0.07 + 0.035;
      o.r = CORAL_IN[0] * 0.75; o.g = CORAL_IN[1] * 0.7; o.b = CORAL_IN[2] * 0.7;
    });
    addSkin(xform(mergeParts([upper, mouth]), mB), bHead);
    const lower = blob(18, 12, (X, Y, Z, o) => {
      const t = sat(Z), w = 1 - 0.4 * sstep(0, 1, t);
      o.x = X * 0.094 * w; o.z = Z * 0.155;
      o.y = (Y < 0 ? Y * 0.056 : Y * 0.01) + 0.006;
      const c3 = Y > 0.12 ? CORAL_IN : CORAL;
      o.r = c3[0]; o.g = c3[1]; o.b = c3[2];
    });
    const tongue = blob(10, 6, (X, Y, Z, o) => {
      o.x = X * 0.04; o.y = Y * 0.014 + 0.012; o.z = Z * 0.05 + 0.065;
      o.r = TONGUE[0]; o.g = TONGUE[1]; o.b = TONGUE[2];
    });
    addSkin(xform(mergeParts([lower, tongue]), mB), bJaw);
  }

  // ───────────────────────────── patitas ─────────────────────────────
  for (const s of [1, -1]) {
    const toe = (yaw, L) => xform(blob(10, 10, (X, Y, Z, o) => {
      const sN = (Y + 1) / 2, k = 1 / Math.pow(Math.max(1e-3, Math.hypot(X, Z)), 0.4);
      o.x = X * 0.05 * k * (0.9 + 0.25 * sN); o.y = 0.034 + Z * 0.034 * k; o.z = -0.03 + sN * L;
      o.r = CORAL[0]; o.g = CORAL[1]; o.b = CORAL[2];
    }), new Matrix4().makeRotationY(yaw));
    const leg = blob(10, 8, (X, Y, Z, o) => {
      o.x = X * 0.05; o.y = 0.13 + Y * 0.13; o.z = Z * 0.05 - 0.01;
      o.r = CORAL[0]; o.g = CORAL[1]; o.b = CORAL[2];
    });
    const foot = mergeParts([toe(0, 0.24), toe(0.5, 0.21), toe(-0.5, 0.21), leg]);
    addSkin(xform(foot, new Matrix4().makeTranslation(s * FOOT_X, 0, FOOT_Z)), s > 0 ? bFootL : bFootR);
  }

  // ───────────────────────────── párpados ─────────────────────────────
  // Dos cascarones por ojo que giran sobre el eje horizontal del ojo. Superior con línea de pestañas:
  // bajando dibuja un arco "‿" (dormir, rezar); si sube el inferior queda el arco "^" de la risa.
  group.updateMatrixWorld(true);
  const R_UP = 1.09, R_LO = 1.045;
  function lidShell(R, dirY) {
    const SEG = 28, NR = 7, pos = [], col = [], idx = [];
    pos.push(0, dirY * R, 0);
    for (let i = 1; i <= NR + 1; i++) {
      const th = Math.min(i, NR) / NR * PI / 2, lip = i > NR;
      const rr = lip ? 1.0 : R * Math.sin(th), y = lip ? -0.05 * dirY : dirY * R * Math.cos(th);
      for (let j = 0; j < SEG; j++) { const ph = TAU * j / SEG; pos.push(rr * Math.sin(ph), y, rr * Math.cos(ph)); }
    }
    for (let i = 0; i < pos.length / 3; i++) col.push(1, 1, 1);
    for (let j = 0; j < SEG; j++) idx.push(0, 1 + j, 1 + (j + 1) % SEG);
    for (let i = 0; i < NR; i++) for (let j = 0; j < SEG; j++) {
      const a = 1 + i * SEG + j, b = 1 + i * SEG + (j + 1) % SEG, c = a + SEG, d = b + SEG;
      idx.push(a, c, d, a, d, b);
    }
    return orientFrom({ pos, col, idx }, 0, 0, 0);
  }
  function lashArc() {
    return blob(8, 18, (X, Y, Z, o) => {
      const t = lerp(0.1 * PI, 0.9 * PI, (Y + 1) / 2), R = R_UP + 0.012;
      const nx = Math.cos(t), nz = Math.sin(t), rr = 0.085;
      o.x = (R + X * rr) * nx; o.z = (R + X * rr) * nz; o.y = -0.03 + Z * rr;
      o.r = LASH[0]; o.g = LASH[1]; o.b = LASH[2];
    });
  }
  for (const e of eyes) {
    const m = e.socket.matrixWorld;
    addSkin(xform(mergeParts([lidShell(R_UP, 1), lashArc()]), m), e.up);
    addSkin(xform(lidShell(R_LO, -1), m), e.lo);
  }

  // ───────────────────────────── materiales ─────────────────────────────
  // El color por vértice también modula la emisión (así el blanco se ve BLANCO sin "lavar" el coral
  // ni las pestañas) y las normales de la piel se corrigen para huesos con escala no uniforme.
  const canFixNormals = !!(THREE.ShaderChunk && typeof THREE.ShaderChunk.skinnormal_vertex === 'string' && THREE.ShaderChunk.skinnormal_vertex.includes('skinMatrix'));
  function patch(mat, key) {
    mat.onBeforeCompile = shader => {
      shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n#ifdef USE_COLOR\n\ttotalEmissiveRadiance *= vColor.rgb;\n#endif');
      if (canFixNormals) {
        shader.vertexShader = shader.vertexShader.replace('#include <skinnormal_vertex>',
          'vec3 palomitaN0 = objectNormal;\n#include <skinnormal_vertex>\n#ifdef USE_SKINNING\n\tobjectNormal = transpose( inverse( mat3( skinMatrix ) ) ) * palomitaN0;\n#endif');
      }
    };
    mat.customProgramCacheKey = () => key;
    return mat;
  }
  const matBody = patch(new MeshPhysicalMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.46, metalness: 0,
    clearcoat: 0.35, clearcoatRoughness: 0.38,
    sheen: 0.35, sheenRoughness: 0.55, sheenColor: 0xfff4ea,
    emissive: 0xffffff, emissiveIntensity: 0.16,
  }), 'palomita-a-piel');
  const matEye = patch(new MeshPhysicalMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.1, metalness: 0,
    clearcoat: 1, clearcoatRoughness: 0.04,
    emissive: 0xffffff, emissiveIntensity: 0.9,
  }), 'palomita-a-ojo');
  const overlay = { transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, vertexColors: true };
  const matBlush = new MeshLambertMaterial({ color: 0xffffff, ...overlay });
  const matMud = new MeshLambertMaterial({ color: 0xffffff, ...overlay });
  const matHit = new MeshBasicMaterial({ visible: false });

  // ───────────────────────────── malla con piel ─────────────────────────────
  const skinGeo = new BufferGeometry();
  skinGeo.setAttribute('position', new BufferAttribute(new Float32Array(skin.pos), 3));
  skinGeo.setAttribute('normal', new BufferAttribute(new Float32Array(skin.nor), 3));
  skinGeo.setAttribute('color', new BufferAttribute(new Float32Array(skin.col), 3));
  skinGeo.setAttribute('skinIndex', new BufferAttribute(new Uint16Array(skin.si), 4));
  skinGeo.setAttribute('skinWeight', new BufferAttribute(new Float32Array(skin.sw), 4));
  skinGeo.setIndex(skin.idx);
  const skinMesh = new SkinnedMesh(skinGeo, matBody);
  skinMesh.name = 'piel';
  skinMesh.frustumCulled = false;          // la piel se mueve con los huesos: nunca se descarta
  group.add(skinMesh);
  group.updateMatrixWorld(true);
  const skeleton = new Skeleton(bones);
  skinMesh.bind(skeleton);

  // ───────────────────────────── ojos ─────────────────────────────
  // Cuentas de vidrio: esfera muy brillante marrón oscuro con dos brillos blancos pintados.
  const eyeGeo = (() => {
    const ball = blob(32, 18, (X, Y, Z, o) => {
      o.x = X; o.y = Y; o.z = Z;
      const c3 = mix3(EYE, EYE_GLOW, 0.5 * sstep(0.15, -0.85, Y) * sstep(0.1, 0.7, Z));
      o.r = c3[0]; o.g = c3[1]; o.b = c3[2];
    });
    const shine = (dx, dy, dz, ang) => {
      const d = new Vector3(dx, dy, dz).normalize();
      const t1 = new Vector3(0, 1, 0).cross(d).normalize(), t2 = d.clone().cross(t1);
      return orientFrom(disc(16, 3, (rho, phi, o) => {
        const a = rho * ang;
        const p = d.clone().multiplyScalar(Math.cos(a)).addScaledVector(t1, Math.sin(a) * Math.cos(phi)).addScaledVector(t2, Math.sin(a) * Math.sin(phi));
        const R = 1.02 - 0.012 * rho * rho;
        o.x = p.x * R; o.y = p.y * R; o.z = p.z * R; o.r = o.g = o.b = 1;
      }), 0, 0, 0);
    };
    return toGeometry(mergeParts([ball, shine(0.36, 0.42, 0.84, 0.3), shine(-0.34, -0.3, 0.9, 0.14)]));
  })();
  for (const e of eyes) {
    e.mesh = new Mesh(eyeGeo, matEye);
    e.mesh.name = e.s > 0 ? 'ojoIzq' : 'ojoDer';
    e.socket.add(e.mesh);
  }

  // ───────────────────────────── rubor ─────────────────────────────
  // Parches que siguen la superficie de la cara, con transparencia por vértice (sin texturas).
  function patchOn(center, c, d0, radius, seg, rings, paint) {
    const d = new Vector3(d0[0], d0[1], d0[2]).normalize();
    const t1 = new Vector3(0, 1, 0).cross(d).normalize(), t2 = d.clone().cross(t1);
    const h = {}, q = new Vector3();
    return orientFrom(disc(seg, rings, (rho, phi, o) => {
      const R = radius(phi) * rho;
      q.copy(d).addScaledVector(t1, R * Math.cos(phi)).addScaledVector(t2, R * Math.sin(phi));
      surf(c, q.x, q.y, q.z, h);
      o.x = h.x + h.nx * 0.004 - center[0]; o.y = h.y + h.ny * 0.004 - center[1]; o.z = h.z + h.nz * 0.004 - center[2];
      paint(rho, phi, o);
    }, 4), c[0] - center[0], c[1] - center[1], c[2] - center[2]);
  }
  const blushGeo = toGeometry(mergeParts([1, -1].map(s => patchOn(P_HEAD, HEAD_C, dirYP(47 * s, -24), phi => 0.26 - 0.05 * Math.abs(Math.sin(phi)), 20, 5, (rho, phi, o) => {
    o.r = BLUSH[0]; o.g = BLUSH[1]; o.b = BLUSH[2]; o.a = (1 - sstep(0.15, 1, rho)) * 0.95;
  }))), 4);
  const blush = new Mesh(blushGeo, matBlush);
  blush.name = 'rubor'; blush.renderOrder = 2;
  bHead.add(blush);

  // ───────────────────────────── barro ─────────────────────────────
  // Manchitas irregulares que aparecen poco a poco con setDirt(0..1).
  const mudSpec = [
    // [hueso, centro de rayos, dirección, tamaño, umbral de aparición]
    [bBody, BODY_C, [0.38, 0.28, 0.9], 0.3, 0.0],
    [bBody, BODY_C, [-0.5, -0.3, 0.82], 0.34, 0.12],
    [bHead, HEAD_C, [-0.52, 0.5, 0.7], 0.24, 0.25],
    [bBody, BODY_C, [0.12, -0.5, 0.86], 0.26, 0.38],
    [bBody, BODY_C, [-0.2, 0.42, 0.9], 0.2, 0.5],
    [bHead, HEAD_C, [0.62, -0.42, 0.62], 0.17, 0.6],
    [bBody, BODY_C, [0.72, -0.35, 0.6], 0.24, 0.7],
  ];
  const muds = [];
  for (const bone of [bBody, bHead]) {
    const parts = [], thr = [];
    mudSpec.forEach((sp, k) => {
      if (sp[0] !== bone) return;
      const rp = restPos.get(bone), seed = k * 7.3 + 1.7;
      const part = patchOn([rp.x, rp.y, rp.z], sp[1], sp[2],
        phi => sp[3] * (0.8 + 0.16 * Math.sin(phi * 2 + seed) + 0.11 * Math.sin(phi * 3 + seed * 2.1) + 0.07 * Math.sin(phi * 5 + seed * 0.7)),
        20, 4, (rho, phi, o) => {
          const c3 = mix3(MUD_DARK, MUD, sstep(0.1, 0.9, rho));
          o.r = c3[0]; o.g = c3[1]; o.b = c3[2]; o.a = 1 - sstep(0.62, 1, rho);
        });
      for (let i = 0; i < part.pos.length / 3; i++) thr.push(sp[4]);
      parts.push(part);
    });
    const geo = toGeometry(mergeParts(parts), 4);
    const mesh = new Mesh(geo, matMud);
    mesh.name = 'barro'; mesh.renderOrder = 3; mesh.visible = false;
    bone.add(mesh);
    muds.push({ mesh, attr: geo.attributes.color, base: Float32Array.from(geo.attributes.color.array), thr });
  }

  // ───────────────────────────── volúmenes de toque ─────────────────────────────
  const hitGeo = new SphereGeometry(1, 12, 8);
  const hitParts = [];
  function hit(part, bone, cx, cy, cz, sx, sy, sz, quat) {
    const m = new Mesh(hitGeo, matHit);
    const rp = restPos.get(bone);
    m.position.set(cx - rp.x, cy - rp.y, cz - rp.z); m.scale.set(sx, sy, sz);
    if (quat) m.quaternion.copy(quat);
    m.userData.part = part; m.name = 'toque:' + part;
    bone.add(m); hitParts.push(m);
    return m;
  }
  hit('belly', bBody, 0, 0.66, -0.04, 0.72, 0.6, 0.72);
  hit('head', bHead, HEAD_C[0], HEAD_C[1] - 0.02, HEAD_C[2] + 0.02, 0.6, 0.52, 0.56);
  hit('beak', bHead, 0, beakO[1] - 0.03, beakO[2] + 0.1, 0.12, 0.1, 0.14);
  hit('tail', bTail, 0, P_TAIL[1] + 0.1, P_TAIL[2] - 0.22, 0.32, 0.1, 0.3, new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), 0.42));
  for (const w of wings) {
    const ax = new Vector3(w.tip.x - w.piv[0], w.tip.y - w.piv[1], w.tip.z - w.piv[2]);
    const L = ax.length(); ax.normalize();
    const n = new Vector3(w.center.nx, w.center.ny, w.center.nz);
    const side = n.clone().cross(ax).normalize(); n.copy(ax).cross(side).normalize();
    const q = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(ax, side, n));
    hit(w.s > 0 ? 'wingL' : 'wingR', w.bone, w.center.x + w.center.nx * 0.06, w.center.y + w.center.ny * 0.06, w.center.z + w.center.nz * 0.06, L * 0.56, 0.26, 0.11, q);
  }
  hit('feet', bFootL, FOOT_X, 0.05, FOOT_Z + 0.09, 0.15, 0.07, 0.19);
  hit('feet', bFootR, -FOOT_X, 0.05, FOOT_Z + 0.09, 0.15, 0.07, 0.19);

  // ───────────────────────────── anclas para accesorios ─────────────────────────────
  const anchor = (name, bone, x, y, z) => { const o = new Object3D(); o.name = 'ancla:' + name; const rp = restPos.get(bone); o.position.set(x - rp.x, y - rp.y, z - rp.z); bone.add(o); return o; };
  const hCrown = pt(HEAD_C, [0, 1, 0]);
  const hNeck = pt([0, 1.06, 0.05], [0, -0.1, 1]);
  const hBack = pt(BODY_C, [0, 0.62, -0.78]);
  const anchors = {
    head: anchor('head', bHead, hCrown.x, hCrown.y, hCrown.z),
    neck: anchor('neck', bBody, hNeck.x, hNeck.y, hNeck.z),
    beak: anchor('beak', bHead, 0, beakO[1] - Math.sin(BEAK_TILT) * 0.2 - 0.02, beakO[2] + Math.cos(BEAK_TILT) * 0.2),
    back: anchor('back', bBody, hBack.x, hBack.y, hBack.z),
  };

  group.traverse(o => { if (o.isMesh) o.castShadow = true; });

  // ═════════════════════════════ ANIMACIÓN ═════════════════════════════
  // Una "pose" es un vector de canales. Cada cuadro: pose base del ánimo (mezclada con suavizado) →
  // acción en curso (con envolvente que entra y sale de cero) → transición de la acción anterior →
  // reposo vivo (respiración, balanceo…) → mirada, parpadeo y habla → huesos.
  const NAMES = ['rootY', 'rootYaw', 'bodyY', 'bodyPitch', 'bodyRoll', 'bodyYaw', 'squash',
    'headPitch', 'headYaw', 'headRoll', 'headY', 'headZ',
    'wLUp', 'wRUp', 'wLOpen', 'wROpen', 'wLSwing', 'wRSwing', 'wLOrbit', 'wROrbit',
    'tailPitch', 'tailYaw', 'lidU', 'lidL', 'lidTilt', 'beak',
    'fLY', 'fRY', 'fLPitch', 'fRPitch', 'crestPitch', 'crestRoll', 'eyeX', 'eyeY', 'lookW', 'blush',
    'breath', 'breathRate', 'idle', 'bounce', 'flutter', 'beg', 'peep', 'nod', 'wag', 'blinkLen'];
  const C = {}; NAMES.forEach((n, i) => { C[n] = i; });
  const NCH = NAMES.length;
  const LID_OPEN = 1.15, LID_LOW = -1.2;
  const NEUTRAL = new Float32Array(NCH);
  NEUTRAL[C.lidU] = LID_OPEN; NEUTRAL[C.lidL] = LID_LOW; NEUTRAL[C.lookW] = 1; NEUTRAL[C.blush] = 1;
  NEUTRAL[C.breath] = 1; NEUTRAL[C.breathRate] = 2.4; NEUTRAL[C.idle] = 1; NEUTRAL[C.wag] = 1; NEUTRAL[C.blinkLen] = 0.17;
  const PAIRS = { wUp: ['wLUp', 'wRUp'], wOpen: ['wLOpen', 'wROpen'], wSwing: ['wLSwing', 'wRSwing'], wOrbit: ['wLOrbit', 'wROrbit'] };
  function mkPose(o) {
    const p = NEUTRAL.slice();
    for (const k in o) { if (PAIRS[k]) { p[C[PAIRS[k][0]]] = o[k]; p[C[PAIRS[k][1]]] = o[k]; } else p[C[k]] = o[k]; }
    return p;
  }
  const MOODS = ['happy', 'neutral', 'sad', 'sleepy', 'hungry', 'excited'];
  const POSES = [
    // feliz: erguida, pecho fuera, ojos sonrientes, piquito entreabierto
    mkPose({ headPitch: -0.05, squash: 0.012, lidU: 1.22, lidL: -0.5, beak: 0.1, tailPitch: 0.16, wUp: 0.03, blush: 1.15, crestPitch: 0.05 }),
    // neutral
    mkPose({}),
    // triste: encogida, cabeza gacha, párpados caídos, alas y cola abajo
    mkPose({ headPitch: 0.3, headZ: 0.02, bodyPitch: 0.07, squash: -0.05, lidU: 0.42, lidTilt: 0.4, lidL: -1.25, wUp: 0.05, wSwing: -0.1,
      tailPitch: -0.45, crestPitch: -0.5, eyeY: -0.5, breath: 0.8, breathRate: 1.8, idle: 0.5, wag: 0.12, blush: 0.45, lookW: 0.5 }),
    // soñolienta: ojos a medio cerrar, cabeceos lentos
    mkPose({ headPitch: 0.12, headRoll: 0.15, squash: -0.03, lidU: 0.2, lidL: -0.85, tailPitch: -0.2, idle: 0.45, nod: 1,
      breath: 1.3, breathRate: 1.6, wag: 0.2, crestPitch: -0.2, blinkLen: 0.45 }),
    // hambrienta: mira hacia arriba suplicante, pía y agita las alitas
    mkPose({ headPitch: -0.15, bodyPitch: 0.05, lidU: 1.32, lidTilt: 0.24, lidL: -1.3, beak: 0.1, peep: 1, beg: 1, tailPitch: -0.1, eyeY: 0.3, blush: 0.8 }),
    // emocionada: da saltitos, alas abiertas aleteando, ojos muy abiertos
    mkPose({ headPitch: -0.08, lidU: 1.42, lidL: -0.72, beak: 0.4, bounce: 1, flutter: 1, wOpen: 0.75, wUp: 0.55, tailPitch: 0.4, wag: 3,
      blush: 1.4, squash: 0.02, breathRate: 4.2, crestPitch: 0.12 }),
  ];
  // dormida: acurrucada, cabeza recostada, ojos cerrados, respiración lenta y profunda
  const SLEEP = mkPose({ bodyY: -0.075, squash: -0.075, headPitch: 0.34, headRoll: 0.2, headYaw: 0.22, lidU: -0.36, lidL: -0.5,
    tailPitch: -0.35, idle: 0, breath: 2.6, breathRate: 1.15, lookW: 0, wag: 0, wUp: 0.04, crestPitch: -0.3, blush: 0.9 });

  const DUR = { hop: 0.75, flap: 1.3, eat: 2.1, giggle: 1.5, nod: 1.0, shake: 1.1, dance: 2.8, pray: 3.0, wave: 1.6, spin: 1.2, sneeze: 1.4, surprise: 1.1, sad: 2.2 };
  const to = (P, ch, v, w) => { P[ch] += (v - P[ch]) * w; };
  const both = (P, a, b, v) => { P[a] += v; P[b] += v; };

  const ACTIONS = {
    // saltito: se agacha, salta con las alitas fuera y aterriza con rebote
    hop(P, t, p) {
      const q = sat((p - 0.18) / 0.54), air = Math.sin(PI * q);
      P[C.squash] += -0.14 * bump(p / 0.22) + 0.09 * air - 0.12 * bump((p - 0.7) / 0.3);
      P[C.rootY] += 0.42 * 4 * q * (1 - q);
      both(P, C.wLUp, C.wRUp, 0.55 * air); both(P, C.wLOpen, C.wROpen, 0.3 * air);
      both(P, C.fLPitch, C.fRPitch, 0.5 * air);
      P[C.headPitch] -= 0.1 * air; P[C.tailPitch] += 0.25 * air;
      to(P, C.lidL, -0.4, air);
    },
    // aleteo: abre las alas hacia la cámara y las bate
    flap(P, t, p) {
      const e = env(p, 0.14, 0.84), beat = Math.cos(TAU * (t - 0.2) / 0.3);
      both(P, C.wLOpen, C.wROpen, 0.92 * e);
      both(P, C.wLUp, C.wRUp, e * (0.72 - 0.88 * beat));
      P[C.rootY] += e * (0.1 + 0.045 * beat);
      P[C.squash] += e * (0.04 - 0.03 * beat);
      P[C.headPitch] -= 0.12 * e; P[C.tailPitch] += 0.3 * e;
      both(P, C.fLPitch, C.fRPitch, 0.4 * e);
      to(P, C.lidL, -0.5, e); P[C.beak] += 0.2 * e;
    },
    // comer: tres picotazos y un "¡ñam!" contento
    eat(P, t, p) {
      const u = (t - 0.2) / 0.5, k = u - Math.floor(u), on = u >= 0 && u < 3 ? 1 : 0;
      const d = on * Math.pow(Math.sin(PI * k), 1.5);
      P[C.headPitch] += 0.5 * d; P[C.bodyPitch] += 0.24 * d; P[C.headZ] += 0.04 * d;
      P[C.beak] += on * sstep(0.05, 0.3, k) * (1 - sstep(0.62, 0.72, k)) * 0.75;
      P[C.tailPitch] += 0.35 * d; P[C.lookW] *= 1 - 0.8 * env(p, 0.08, 0.8);
      to(P, C.lidU, 0.8, d * 0.7);
      const yum = env((t - 1.68) / 0.42, 0.25, 0.7);
      P[C.beak] += yum * 0.18 * (0.5 + 0.5 * Math.sin(t * 30));
      to(P, C.lidL, 0.2, yum); P[C.headRoll] += 0.1 * yum * Math.sin(t * 15); P[C.blush] += 0.5 * yum;
    },
    // cosquillas: se ríe con los ojos en arco "^ ^" y todo el cuerpo tiembla
    giggle(P, t, p) {
      const e = env(p, 0.12, 0.85);
      to(P, C.lidL, 0.52, e); to(P, C.lidU, 1.05, e);
      P[C.rootY] += e * 0.035 * Math.abs(Math.sin(t * 13));
      P[C.squash] += e * 0.035 * Math.sin(t * 26);
      P[C.bodyRoll] += e * 0.07 * Math.sin(t * 19);
      P[C.headPitch] -= 0.14 * e; P[C.headRoll] += e * 0.09 * Math.sin(t * 9.5);
      both(P, C.wLUp, C.wRUp, e * (0.2 + 0.12 * Math.sin(t * 30)));
      P[C.beak] += e * (0.4 + 0.25 * Math.sin(t * 13));
      P[C.blush] += 0.7 * e; P[C.tailYaw] += e * 0.35 * Math.sin(t * 22);
      P[C.lookW] *= 1 - 0.5 * e;
    },
    // sí
    nod(P, t, p) {
      const e = env(p, 0.12, 0.88), n = (0.5 - 0.5 * Math.cos(TAU * 2 * p));
      P[C.headPitch] += e * (0.34 * n - 0.05); P[C.bodyPitch] += e * 0.05 * n; P[C.headZ] += e * 0.02 * n;
      to(P, C.lidL, -0.5, e);
    },
    // no
    shake(P, t, p) {
      const e = env(p, 0.14, 0.86), s = Math.sin(TAU * 2.5 * p);
      P[C.headYaw] += e * 0.5 * s; P[C.bodyYaw] -= e * 0.07 * s; P[C.headRoll] += e * 0.05 * s;
      to(P, C.lidU, 0.62, e); P[C.lookW] *= 1 - e; P[C.tailYaw] -= e * 0.2 * s;
    },
    // baile: balanceo de lado a lado, alas arriba alternadas, pasitos
    dance(P, t, p) {
      const e = env(p, 0.09, 0.9), ph = t * TAU / 0.72, s = Math.sin(ph);
      P[C.bodyRoll] += e * 0.2 * s; P[C.bodyYaw] += e * 0.16 * Math.sin(ph * 0.5);
      P[C.rootY] += e * 0.06 * (0.5 - 0.5 * Math.cos(2 * ph)); P[C.squash] += e * 0.045 * Math.cos(2 * ph);
      P[C.headRoll] += e * 0.15 * Math.sin(ph - 0.5); P[C.headPitch] -= 0.06 * e;
      both(P, C.wLOpen, C.wROpen, 0.85 * e);
      P[C.wLUp] += e * (0.6 + 0.62 * s); P[C.wRUp] += e * (0.6 - 0.62 * s);
      P[C.fLY] += e * 0.07 * Math.max(0, s); P[C.fRY] += e * 0.07 * Math.max(0, -s);
      P[C.tailYaw] += e * 0.4 * Math.sin(ph + 1); P[C.tailPitch] += 0.2 * e;
      to(P, C.lidL, -0.25, e); P[C.beak] += 0.22 * e; P[C.blush] += 0.3 * e;
    },
    // rezar: inclina la cabeza, junta las alas delante del pecho y cierra los ojos en calma
    pray(P, t, p) {
      const w = sstep(0, 0.5 / 3, p) * (1 - sstep(1 - 0.6 / 3, 1, p));
      const lw = sstep(0.04, 0.2, p) * (1 - sstep(0.84, 0.96, p));
      P[C.headPitch] += 0.34 * w; P[C.headZ] += 0.02 * w; P[C.bodyPitch] += 0.05 * w;
      to(P, C.headRoll, 0, w); to(P, C.headYaw, 0, w);
      to(P, C.lidU, -0.3, lw); to(P, C.lidL, -0.4, lw); to(P, C.lidTilt, 0, lw);
      to(P, C.wLOrbit, 0.8, w); to(P, C.wROrbit, 0.8, w);
      to(P, C.wLSwing, 2.1, w); to(P, C.wRSwing, 2.1, w);
      to(P, C.wLUp, 0.0, w); to(P, C.wRUp, 0.0, w); to(P, C.wLOpen, 0, w); to(P, C.wROpen, 0, w);
      to(P, C.beak, 0, w); P[C.lookW] *= 1 - w; P[C.idle] *= 1 - 0.85 * w; P[C.wag] *= 1 - w;
      to(P, C.bounce, 0, w); to(P, C.flutter, 0, w); to(P, C.beg, 0, w); to(P, C.peep, 0, w); to(P, C.nod, 0, w);
      to(P, C.tailPitch, -0.15, w); to(P, C.breathRate, 1.7, w);
    },
    // saludo: levanta un ala y la agita
    wave(P, t, p) {
      const e = env(p, 0.2, 0.84), wv = Math.cos(TAU * (t - 0.5) / 0.42);
      to(P, C.wLOpen, 0.95, e); to(P, C.wLUp, 1.32 + 0.3 * wv, e);
      P[C.wRUp] += 0.08 * e;
      P[C.headRoll] -= 0.13 * e; P[C.bodyRoll] -= 0.05 * e; P[C.headPitch] -= 0.04 * e;
      to(P, C.lidL, -0.2, e); P[C.beak] += e * (0.25 + 0.1 * wv);
    },
    // giro: una vuelta completa con saltito
    spin(P, t, p) {
      const q = sat((p - 0.14) / 0.72), air = Math.sin(PI * q);
      P[C.squash] += -0.1 * bump(p / 0.2) + 0.05 * air - 0.09 * bump((p - 0.84) / 0.16);
      P[C.rootYaw] += TAU * ease(q); P[C.rootY] += 0.2 * air;
      both(P, C.wLUp, C.wRUp, 0.6 * air); both(P, C.wLOpen, C.wROpen, 0.45 * air);
      both(P, C.fLPitch, C.fRPitch, 0.4 * air); P[C.tailPitch] += 0.3 * air;
      to(P, C.lidL, -0.4, air); P[C.lookW] *= 1 - air;
    },
    // estornudo: "a… a… ¡achís!" y sacude la cabeza
    sneeze(P, t, p) {
      const b = sstep(0, 0.4, p) * (1 - sstep(0.47, 0.51, p));
      const s = bump((p - 0.47) / 0.2), a = sstep(0.64, 0.72, p) * (1 - sstep(0.86, 1, p));
      P[C.headPitch] += -0.3 * b + 0.55 * s; P[C.bodyPitch] += -0.07 * b + 0.2 * s;
      P[C.squash] += 0.055 * b - 0.1 * s; P[C.rootY] += 0.05 * s;
      P[C.beak] += 0.5 * b + 0.25 * s;
      to(P, C.lidU, 0.38, b); to(P, C.lidU, -0.15, s); to(P, C.lidL, 0.0, s); to(P, C.lidTilt, -0.3, Math.max(b * 0.6, s));
      both(P, C.wLUp, C.wRUp, 0.12 * b + 0.75 * s); both(P, C.wLOpen, C.wROpen, 0.35 * s);
      P[C.tailPitch] += 0.5 * s; P[C.headYaw] += a * 0.2 * Math.sin(t * 32);
      to(P, C.lidU, 0.7, a); P[C.lookW] *= 1 - Math.max(b, s);
    },
    // sorpresa: respingo con los ojos como platos
    surprise(P, t, p) {
      const e = sstep(0, 0.09, p) * (1 - sstep(0.68, 1, p));
      P[C.rootY] += 0.14 * bump(p / 0.36); P[C.squash] += 0.09 * e - 0.05 * bump((p - 0.3) / 0.2);
      P[C.headPitch] -= 0.1 * e; P[C.headY] += 0.02 * e; P[C.bodyPitch] -= 0.05 * e;
      to(P, C.lidU, 1.52, e); to(P, C.lidL, -1.5, e); to(P, C.lidTilt, 0, e);
      to(P, C.beak, 0.6, e);
      both(P, C.wLUp, C.wRUp, e * (0.6 + 0.04 * Math.sin(t * 42))); both(P, C.wLOpen, C.wROpen, 0.3 * e);
      P[C.tailPitch] += 0.45 * e; P[C.crestPitch] += 0.25 * e;
      both(P, C.fLPitch, C.fRPitch, 0.3 * bump(p / 0.36));
    },
    // pena: suspira, baja la cabeza y niega despacito
    sad(P, t, p) {
      const e = env(p, 0.2, 0.82);
      P[C.headPitch] += 0.4 * e; P[C.headYaw] += 0.1 * e * Math.sin(t * 4.2); P[C.bodyPitch] += 0.09 * e;
      P[C.squash] += -0.06 * e + 0.05 * bump((p - 0.25) / 0.2) - 0.03 * bump((p - 0.45) / 0.3);
      to(P, C.lidU, 0.34, e); to(P, C.lidTilt, 0.42, e); to(P, C.lidL, -1.25, e);
      both(P, C.wLUp, C.wRUp, 0.06 * e); both(P, C.wLSwing, C.wRSwing, -0.14 * e);
      P[C.tailPitch] -= 0.45 * e; P[C.crestPitch] -= 0.5 * e;
      to(P, C.beak, 0, e); P[C.lookW] *= 1 - 0.7 * e; P[C.eyeY] -= 0.5 * e; P[C.blush] *= 1 - 0.5 * e;
      P[C.wag] *= 1 - e; to(P, C.bounce, 0, e); to(P, C.flutter, 0, e);
    },
  };

  // Estado
  let moodIdx = 0, sleeping = false, sleepW = 0;
  const moodW = new Float32Array(MOODS.length); moodW[0] = 1;
  let action = null, actT = 0, actDur = 0, fadeK = 0;
  const base = new Float32Array(NCH), P = new Float32Array(NCH), fade = new Float32Array(NCH), lastDelta = new Float32Array(NCH);
  let lookTX = 0, lookTY = 0, lookX = 0, lookY = 0;
  let talkT = 0, talk = 0, dirt = 0, dirtShown = -1;
  let breathPh = 0;
  const spCrestP = { y: 0, v: 0, on: false }, spCrestR = { y: 0, v: 0, on: false }, spTail = { y: 0, v: 0, on: false };

  // Seguidor con muelle (movimiento secundario). Subpasos fijos: estable y determinista con cualquier dt.
  function follow(s, target, dt, k, c) {
    if (!s.on) { s.y = target; s.v = 0; s.on = true; return; }
    if (dt <= 0) return;
    const n = Math.max(1, Math.ceil(dt * 120)), h = dt / n;
    for (let i = 0; i < n; i++) { s.v += (k * (target - s.y) - c * s.v) * h; s.y += s.v * h; }
  }
  // Parpadeo: función pura del tiempo (pseudoaleatoria pero siempre igual). El primero llega pasados 3,3 s.
  function blinkAt(t, len) {
    const u = (t - 3.3) / 4.1;
    if (u < 0) return 0;
    const n = Math.floor(u), t0 = 3.3 + n * 4.1 + hash(n) * 1.7;
    let b = bump((t - t0) / len);
    if (hash(n + 57.3) > 0.72) b = Math.max(b, bump((t - t0 - len - 0.12) / len));
    return b;
  }

  function idleLayer(dt, t) {
    breathPh += dt * P[C.breathRate];
    const br = Math.sin(breathPh), amp = P[C.breath], id = P[C.idle];
    P[C.squash] += 0.014 * amp * br;
    P[C.headY] += 0.004 * amp * Math.sin(breathPh - 0.7);
    both(P, C.wLUp, C.wRUp, 0.016 * amp * (0.5 + 0.5 * br));
    P[C.tailPitch] += 0.03 * amp * Math.sin(breathPh - 1.2);
    // balanceo y microgestos de cabeza
    P[C.bodyRoll] += id * 0.016 * Math.sin(t * 0.83 + 0.4);
    P[C.bodyYaw] += id * 0.03 * Math.sin(t * 0.41 + 1.0);
    P[C.headRoll] += id * (0.035 * Math.sin(t * 0.57 + 2.0) + 0.02 * Math.sin(t * 1.31));
    P[C.headYaw] += id * 0.05 * Math.sin(t * 0.37 + 0.6);
    P[C.headPitch] += id * 0.02 * Math.sin(t * 0.73 + 1.1);
    // de vez en cuando ladea la cabeza con curiosidad
    { const u = (t - 4.6) / 6.4;
      if (u > 0) { const n = Math.floor(u), f = u - n, e = sstep(0, 0.07, f) * (1 - sstep(0.24, 0.32, f)), d = hash(n + 9.1) > 0.5 ? 1 : -1;
        P[C.headRoll] += id * 0.17 * e * d; P[C.headYaw] += id * 0.1 * e * d; } }
    // cola: vaivén suave y ráfagas de meneo
    { const u = (t - 2.9) / 4.7, f = u - Math.floor(u), e = u > 0 ? sstep(0, 0.04, f) * (1 - sstep(0.14, 0.2, f)) : 0;
      P[C.tailYaw] += P[C.wag] * (0.06 * Math.sin(t * 1.9) + 0.3 * e * Math.sin(t * 17) / Math.max(1, P[C.wag])) + (P[C.wag] > 1 ? 0.1 * (P[C.wag] - 1) * Math.sin(t * 15) : 0); }
    // emocionada: saltitos y aleteo
    const bo = P[C.bounce], fl = P[C.flutter];
    if (bo > 0.001) {
      const s = Math.sin(t * 6.2 + 1.53), up = Math.max(0, s);
      P[C.rootY] += bo * 0.15 * up; P[C.squash] += bo * (0.05 * up - 0.085 * Math.max(0, -s));
      both(P, C.fLPitch, C.fRPitch, bo * 0.4 * up); P[C.headPitch] -= bo * 0.05 * up;
    }
    if (fl > 0.001) both(P, C.wLUp, C.wRUp, fl * 0.5 * Math.sin(t * 19 + 0.64));
    // hambrienta: pía y pide con las alitas
    const pe = P[C.peep], bg = P[C.beg];
    if (pe > 0.001) { const k = Math.pow(0.5 + 0.5 * Math.sin(t * 5.5), 2); P[C.beak] += pe * 0.5 * k; P[C.headPitch] -= pe * 0.05 * k; P[C.headZ] += pe * 0.015 * k; }
    if (bg > 0.001) { both(P, C.wLUp, C.wRUp, bg * (0.14 + 0.1 * Math.sin(t * 23))); both(P, C.wLOpen, C.wROpen, bg * 0.12); P[C.squash] += bg * 0.012 * Math.sin(t * 5.5); }
    // soñolienta: se le cae la cabeza y la levanta de golpe
    const nd = P[C.nod];
    if (nd > 0.001) { const u = (t + 1.2) / 5.2, f = u - Math.floor(u), d = sstep(0.08, 0.78, f) * (1 - sstep(0.8, 0.9, f));
      P[C.headPitch] += nd * 0.2 * d; P[C.lidU] -= nd * 0.3 * d; P[C.headRoll] += nd * 0.05 * d; }
  }

  const qA = new Quaternion(), qB = new Quaternion();
  const AX = new Vector3(1, 0, 0), AY = new Vector3(0, 1, 0), AZ = new Vector3(0, 0, 1);
  const BODY_SHINE = matBody.emissiveIntensity;

  function update(dt, t) {
    dt = Number.isFinite(dt) ? clamp(dt, 0, 0.1) : 0;
    t = Number.isFinite(t) ? t : 0;

    // 1) pose base: mezcla suave de ánimos y de dormir
    const km = 1 - Math.exp(-dt * 6);
    let sum = 0;
    for (let i = 0; i < moodW.length; i++) { moodW[i] += ((i === moodIdx ? 1 : 0) - moodW[i]) * km; sum += moodW[i]; }
    base.fill(0);
    for (let i = 0; i < moodW.length; i++) { const w = moodW[i] / sum; if (w > 1e-4) { const m = POSES[i]; for (let c = 0; c < NCH; c++) base[c] += m[c] * w; } }
    sleepW += ((sleeping ? 1 : 0) - sleepW) * (1 - Math.exp(-dt * 3.2));
    const sw = ease(sleepW);
    if (sw > 1e-4) for (let c = 0; c < NCH; c++) base[c] = lerp(base[c], SLEEP[c], sw);

    // 2) acción en curso y transición desde la anterior
    P.set(base);
    if (action) {
      actT += dt;
      if (actT >= actDur) action = null; else ACTIONS[action](P, actT, actT / actDur);
    }
    if (fadeK > 0) {
      fadeK = Math.max(0, fadeK - dt / 0.24);
      const f = ease(fadeK);
      for (let c = 0; c < NCH; c++) P[c] += fade[c] * f;
    }
    for (let c = 0; c < NCH; c++) lastDelta[c] = P[c] - base[c];

    // 3) reposo vivo
    idleLayer(dt, t);

    // 4) mirada, parpadeo y habla
    const kl = 1 - Math.exp(-dt * 9);
    lookX += (lookTX - lookX) * kl; lookY += (lookTY - lookY) * kl;
    talk += (talkT - talk) * (1 - Math.exp(-dt * 30));
    const lw = sat(P[C.lookW]);
    const yaw = P[C.headYaw] + lookX * 0.4 * lw, pitch = P[C.headPitch] - lookY * 0.26 * lw;
    const ex = clamp(P[C.eyeX] + lookX * lw, -1, 1), ey = clamp(P[C.eyeY] + lookY * lw, -1, 1);
    let lidL = clamp(P[C.lidL], -1.5, 0.9);
    let lidU = clamp(P[C.lidU] + ey * 0.12, -0.6, 1.52);
    const bl = blinkAt(t, P[C.blinkLen]) * (1 - sw);
    lidU = lerp(lidU, Math.min(lidU, lidL - 0.1), bl);
    lidU = Math.max(lidU, -0.6);
    if (lidU < lidL - 0.1) lidL = Math.min(lidL, lidU + 0.1);   // el inferior nunca tapa la línea de pestañas

    // 5) huesos
    root.position.y = P[C.rootY];
    root.rotation.y = P[C.rootYaw];
    const sy = clamp(1 + P[C.squash], 0.6, 1.4), sx = 1 / Math.sqrt(sy);
    bBody.position.y = P_BODY[1] + P[C.bodyY];
    bBody.rotation.set(P[C.bodyPitch], P[C.bodyYaw], P[C.bodyRoll]);
    bBody.scale.set(sx, sy, sx);
    bHead.position.set(P_HEAD[0], P_HEAD[1] - P_BODY[1] + P[C.headY], P_HEAD[2] + P[C.headZ]);
    bHead.rotation.set(pitch, yaw, P[C.headRoll]);

    for (const w of wings) {
      const L = w.s > 0;
      const up = P[L ? C.wLUp : C.wRUp], open = P[L ? C.wLOpen : C.wROpen], swing = P[L ? C.wLSwing : C.wRSwing], orbit = P[L ? C.wLOrbit : C.wROrbit];
      w.orbit.rotation.y = -w.s * orbit;
      qA.setFromAxisAngle(AZ, w.s * up);
      qB.setFromAxisAngle(AY, -w.s * open * 1.45); qA.multiply(qB);
      qB.setFromAxisAngle(AX, -swing); qA.multiply(qB);
      w.bone.quaternion.copy(qA);
    }

    // movimiento secundario: copete y cola con retraso elástico
    const dP = pitch + P[C.bodyPitch] - P[C.rootY] * 1.6, dR = P[C.headRoll] + P[C.bodyRoll] + yaw * 0.6;
    follow(spCrestP, dP, dt, 150, 7.5); follow(spCrestR, dR, dt, 150, 7.5); follow(spTail, P[C.rootY], dt, 95, 8);
    bCrest.rotation.x = P[C.crestPitch] + clamp((spCrestP.y - dP) * 0.9, -0.7, 0.7);
    bCrest.rotation.z = P[C.crestRoll] + clamp((spCrestR.y - dR) * 0.9, -0.6, 0.6) + P[C.idle] * 0.03 * Math.sin(t * 1.7);
    bTail.rotation.x = P[C.tailPitch] + clamp((spTail.y - P[C.rootY]) * 2.4, -0.6, 0.6);
    bTail.rotation.y = P[C.tailYaw];

    bJaw.rotation.x = clamp(P[C.beak] + talk * 0.85, 0, 1.1) * 0.62;

    bFootL.position.y = P[C.fLY]; bFootR.position.y = P[C.fRY];
    bFootL.rotation.x = P[C.fLPitch]; bFootR.rotation.x = P[C.fRPitch];

    for (const e of eyes) {
      e.socket.position.copy(e.base).addScaledVector(e.ex, ex * 0.034).addScaledVector(e.ey, ey * 0.026);
      e.up.rotation.set(-lidU, 0, -e.s * P[C.lidTilt]);
      e.lo.rotation.set(-lidL, 0, -e.s * P[C.lidTilt] * 0.3);
    }

    matBlush.opacity = clamp(0.8 * P[C.blush], 0, 1);
  }

  function setDirt(v) {
    dirt = sat(Number(v) || 0);
    if (dirt === dirtShown) return;
    dirtShown = dirt;
    for (const m of muds) {
      m.mesh.visible = dirt > 0.001;
      const a = m.attr.array;
      for (let i = 0; i < m.thr.length; i++) a[i * 4 + 3] = m.base[i * 4 + 3] * sat((dirt - m.thr[i] * 0.8) / 0.22) * 0.92;
      m.attr.needsUpdate = true;
    }
  }
  setDirt(0);

  return {
    group,
    anchors,
    hitParts,
    update,
    setMood(m) { const i = MOODS.indexOf(m); if (i >= 0) moodIdx = i; },
    setSleeping(on) { sleeping = !!on; },
    lookAt(nx, ny) { lookTX = clamp(Number(nx) || 0, -1, 1); lookTY = clamp(Number(ny) || 0, -1, 1); },
    play(name) {
      if (!Object.prototype.hasOwnProperty.call(ACTIONS, name)) return 0;
      // la acción anterior (o su transición) se desvanece mientras entra la nueva: sin saltos
      fade.set(lastDelta);
      fade[C.rootYaw] = Math.atan2(Math.sin(fade[C.rootYaw]), Math.cos(fade[C.rootYaw]));
      fadeK = 1; action = name; actT = 0; actDur = DUR[name];
      return actDur;
    },
    setTalking(v) { talkT = sat(Number(v) || 0); },
    setDirt,
    dispose() {
      skinGeo.dispose(); eyeGeo.dispose(); blushGeo.dispose(); hitGeo.dispose();
      for (const m of muds) m.mesh.geometry.dispose();
      for (const m of [matBody, matEye, matBlush, matMud, matHit]) m.dispose();
      skeleton.dispose();
    },
  };
}
