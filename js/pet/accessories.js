// Accesorios y ropa 3D de la palomita, modelados por código con formas simples.
//   dressSlot(THREE, dove, slot, id) → THREE.Group[] ya colgados de sus anclas (los zapatos van en las dos patitas)
//   createAccessory(THREE, id, ctx)  → THREE.Group (o null si el id no existe); ctx = { anchor, side }
// Los ids son los de ACCESSORIES en js/data/items.js. Cada accesorio se cuelga de un ancla del modelo:
//   head → origen en la coronilla (+Y hacia arriba) · neck → origen al frente del cuello (+Z hacia fuera) · beak → punta del pico
//   body → centro del cuerpo: la ropa se corta a la medida con anchor.userData.tailor (ver js/pet/dove.js)
//   face → frente de la cara a la altura de los ojos (anchor.userData.eyes) · footL / footR → cada pie (dedos hacia +Z).
// Medidas pensadas para una cabeza de radio ≈ 0.55 y un cuello de radio ≈ 0.6 (ver HEAD_R y NECK_R).
const HEAD_R = 0.55, NECK_R = 0.6;

export function dressSlot(THREE, dove, slot, id) {
  if (!id || !dove?.anchors) return [];
  const where = slot === 'feet' ? [['footL', 1], ['footR', -1]] : [[slot, 1]];
  const out = [];
  for (const [name, side] of where) {
    const anchor = dove.anchors[name];
    if (!anchor) continue;
    const acc = createAccessory(THREE, id, { anchor, side });
    if (acc) { anchor.add(acc); out.push(acc); }
  }
  return out;
}

export function createAccessory(THREE, id, { anchor = null, side = 1 } = {}) {
  const g = new THREE.Group();
  g.name = 'accesorio:' + id;
  const M = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.65, ...extra });
  const add = (geo, material, x = 0, y = 0, z = 0, { s, r, parent } = {}) => {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    if (s) m.scale.set(...s);
    if (r) m.rotation.set(...r);
    m.castShadow = true;
    (parent || g).add(m);
    return m;
  };
  const sph = (r, a = 16, b = 12) => new THREE.SphereGeometry(r, a, b);
  const cyl = (rt, rb, h, seg = 20, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);
  const torus = (R, r, seg = 28) => new THREE.TorusGeometry(R, r, 10, seg);
  const dome = r => new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);

  // ── Ropa ──
  const cloth = (extra = {}) => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide, ...extra });
  const hex3 = hx => { const c = new THREE.Color(hx); return [c.r, c.g, c.b]; };
  const mixc = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const noise = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
  const edge = (d, w, soft = 0.012) => { const k = Math.min(1, Math.max(0, (d - w + soft) / (2 * soft))); return k * k * (3 - 2 * k); };   // 0 adentro → 1 afuera, sin escalones
  // Una prenda cortada a la medida del cuerpo (solo en el ancla 'body').
  function garment(spec, mat = cloth()) {
    const tailor = anchor?.userData?.tailor;
    if (!tailor) return null;
    const cut = tailor(spec);
    const m = add(cut.geometry, mat);
    m.receiveShadow = true;
    return cut;
  }
  // Ribete, cuello o cinturón: un tubo que sigue un borde de la prenda (por tramos si la tela está cortada).
  function trim(ring, color, r = 0.025, extra = {}) {
    const n = ring.length, mat = M(color, extra);
    const tube = (pts, closed) => add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, closed), Math.min(160, pts.length * 2), r, 8, closed), mat);
    if (ring.every(Boolean)) { tube(ring, !ring.open); return; }
    // por tramos: la tela está cortada (debajo de las alas o en una abertura)
    const start = ring.open ? 0 : ring.findIndex((p, i) => p && !ring[(i - 1 + n) % n]);
    if (start < 0) return;
    for (let k = 0, i = start; k < n;) {
      const run = [];
      while (k < n && ring[i]) { run.push(ring[i]); i = (i + 1) % n; k++; }
      while (k < n && !ring[i]) { i = (i + 1) % n; k++; }
      if (run.length >= 3) tube(run, false);
    }
  }
  // Un botón (o adorno) apoyado en la tela.
  function stud(cut, u, phi, r, color, extra = {}) {
    const p = cut.at(u, phi), n = cut.normalAt(u, phi);
    return add(sph(r, 10, 8), M(color, extra), p.x + n.x * r * 0.4, p.y + n.y * r * 0.4, p.z + n.z * r * 0.4, { s: [1, 1, 0.55] });
  }
  // Un palito entre dos puntos (cadenas, tiras).
  function rod(a, b, r, mat) {
    const m = add(cyl(r, r, a.distanceTo(b), 6), mat, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    return m;
  }
  const heartShape = r => {
    const sh = new THREE.Shape();
    sh.moveTo(0, -r * 0.95);
    sh.bezierCurveTo(r * 1.25, -r * 0.15, r * 0.95, r * 0.98, 0, r * 0.42);
    sh.bezierCurveTo(-r * 0.95, r * 0.98, -r * 1.25, -r * 0.15, 0, -r * 0.95);
    return sh;
  };

  // Moño de dos lazos con nudo.
  function bow(color, knot, size = 1) {
    const b = new THREE.Group();
    const m = M(color);
    for (const s of [-1, 1]) add(sph(0.16 * size), m, s * 0.17 * size, 0, 0, { s: [1.15, 0.8, 0.45], r: [0, 0, s * 0.25], parent: b });
    add(sph(0.075 * size), M(knot), 0, 0, 0.02 * size, { parent: b });
    g.add(b);
    return b;
  }

  switch (id) {
    // ── cabeza ──
    case 'lazo': {
      const b = bow(0xff8fb1, 0xec6f90, 1.05);
      b.position.set(0.3, -0.07, 0.12); b.rotation.set(-0.25, 0.2, -0.45);
      break;
    }
    case 'gorra': {
      const red = M(0xe94b4b);
      add(dome(HEAD_R * 0.8), red, 0, -0.24, -0.03, { s: [1, 0.72, 1], r: [-0.14, 0, 0] });
      add(cyl(0.3, 0.32, 0.03, 24), M(0xc93a3a), 0, -0.2, 0.42, { s: [1, 1, 0.7], r: [0.05, 0, 0] });
      add(sph(0.045), M(0xffffff), 0, 0.075, -0.03);
      break;
    }
    case 'sombrero-paja': {
      const straw = M(0xf1cf7c, { roughness: 0.9 });
      add(cyl(0.34, 0.4, 0.3, 24), straw, 0, -0.03, 0);
      add(cyl(0.34, 0.34, 0.02, 24), straw, 0, 0.12, 0);
      add(cyl(0.78, 0.8, 0.035, 32), straw, 0, -0.19, 0, { r: [0.06, 0, 0] });
      add(cyl(0.405, 0.41, 0.09, 24, true), M(0xff8a5c), 0, -0.12, 0);
      break;
    }
    case 'corona-flores': {
      const cols = [0xff9db5, 0xffffff, 0xffd95e, 0xc9a3ff, 0xff8a5c];
      add(torus(0.42, 0.03), M(0x6cc070), 0, -0.14, 0, { r: [Math.PI / 2, 0, 0] });
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const f = add(sph(0.085, 10, 8), M(cols[i % cols.length]), Math.cos(a) * 0.42, -0.12, Math.sin(a) * 0.42, { s: [1, 0.75, 1] });
        add(sph(0.035, 8, 6), M(0xffc94a), 0, 0.05, 0, { parent: f });
      }
      break;
    }
    case 'gorro-lana': {
      add(dome(HEAD_R * 0.84), M(0x4aa3e0, { roughness: 0.95 }), 0, -0.27, -0.03, { s: [1, 0.86, 1], r: [-0.12, 0, 0] });
      add(torus(HEAD_R * 0.84, 0.07), M(0xffffff, { roughness: 0.95 }), 0, -0.25, -0.03, { r: [Math.PI / 2 - 0.12, 0, 0] });
      add(sph(0.12), M(0xffffff, { roughness: 1 }), 0, 0.2, -0.08);
      break;
    }
    case 'gorro-fiesta': {
      add(new THREE.ConeGeometry(0.27, 0.62, 24), M(0x9b7be8), 0, 0.2, 0);
      add(torus(0.2, 0.03, 20), M(0xffd95e), 0, 0.06, 0, { r: [Math.PI / 2, 0, 0] });
      add(torus(0.11, 0.028, 20), M(0xff9db5), 0, 0.28, 0, { r: [Math.PI / 2, 0, 0] });
      add(sph(0.075), M(0xffd95e), 0, 0.53, 0);
      g.rotation.z = -0.12;
      break;
    }
    case 'corona-rey': {
      const gold = M(0xf5c542, { metalness: 0.55, roughness: 0.3 });
      add(cyl(0.36, 0.33, 0.2, 24, true), gold, 0, 0.0, 0).material.side = THREE.DoubleSide;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        add(new THREE.ConeGeometry(0.085, 0.2, 4), gold, Math.cos(a) * 0.345, 0.19, Math.sin(a) * 0.345, { r: [0, -a + Math.PI / 4, 0] });
        add(sph(0.04, 8, 6), M([0xe74c3c, 0x3b82f6, 0x34c26a][i % 3], { roughness: 0.2 }), Math.cos(a + 0.52) * 0.355, 0.01, Math.sin(a + 0.52) * 0.355);
      }
      break;
    }
    // ── cuello (el origen está al frente; el centro del cuello queda en z = -NECK_R) ──
    case 'panuelo': {
      const red = M(0xe94b4b);
      add(torus(NECK_R * 0.93, 0.06, 32), red, 0, 0.05, -NECK_R * 0.93, { r: [Math.PI / 2 - 0.1, 0, 0] });
      add(new THREE.ConeGeometry(0.3, 0.42, 3), red, 0, -0.16, 0.03, { s: [1, 1, 0.3], r: [Math.PI + 0.25, Math.PI / 6, 0] });
      break;
    }
    case 'corbatin': {
      const b = bow(0x3d5aa8, 0x27325e, 0.95);
      b.position.set(0, 0, 0.05);
      break;
    }
    case 'bufanda': {
      const wool = M(0x3fb58a, { roughness: 0.95 });
      add(torus(NECK_R * 0.96, 0.11, 32), wool, 0, 0.06, -NECK_R * 0.96, { r: [Math.PI / 2 - 0.08, 0, 0] });
      add(new THREE.BoxGeometry(0.2, 0.46, 0.08), wool, 0.2, -0.2, 0.08, { r: [0.2, 0, -0.12] });
      add(new THREE.BoxGeometry(0.21, 0.06, 0.085), M(0xffffff, { roughness: 0.95 }), 0.225, -0.38, 0.115, { r: [0.2, 0, -0.12] });
      break;
    }
    case 'collar-cruz': {
      add(torus(NECK_R * 0.9, 0.018, 32), M(0x8a5a3c), 0, 0.1, -NECK_R * 0.88, { r: [Math.PI / 2 - 0.22, 0, 0] });
      const wood = M(0x9a6a44);
      add(new THREE.BoxGeometry(0.06, 0.26, 0.04), wood, 0, -0.14, 0.06, { r: [0.2, 0, 0] });
      add(new THREE.BoxGeometry(0.17, 0.06, 0.04), wood, 0, -0.1, 0.07, { r: [0.2, 0, 0] });
      break;
    }
    case 'medalla': {
      add(torus(NECK_R * 0.9, 0.03, 32), M(0x4aa3e0), 0, 0.1, -NECK_R * 0.88, { r: [Math.PI / 2 - 0.22, 0, 0] });
      const gold = M(0xf5c542, { metalness: 0.55, roughness: 0.3 });
      add(cyl(0.11, 0.11, 0.03, 24), gold, 0, -0.15, 0.07, { r: [Math.PI / 2 - 0.2, 0, 0] });
      add(cyl(0.065, 0.065, 0.035, 5), M(0xfff1b8, { metalness: 0.4, roughness: 0.35 }), 0, -0.15, 0.075, { r: [Math.PI / 2 - 0.2, 0, 0] });
      break;
    }
    case 'lazo-comunion': {
      const white = M(0xffffff, { roughness: 0.45 });
      const b = bow(0xffffff, 0xf5c542, 1.1);
      b.position.set(0, 0.02, 0.05);
      add(new THREE.BoxGeometry(0.1, 0.36, 0.03), white, -0.09, -0.22, 0.06, { r: [0.2, 0, 0.22] });
      add(new THREE.BoxGeometry(0.1, 0.36, 0.03), white, 0.09, -0.22, 0.06, { r: [0.2, 0, -0.22] });
      add(new THREE.BoxGeometry(0.1, 0.03, 0.032), M(0xf5c542), -0.127, -0.38, 0.095, { r: [0.2, 0, 0.22] });
      add(new THREE.BoxGeometry(0.1, 0.03, 0.032), M(0xf5c542), 0.127, -0.38, 0.095, { r: [0.2, 0, -0.22] });
      break;
    }
    // ── pico ──
    case 'ramita-olivo': {
      const stem = add(cyl(0.012, 0.014, 0.5, 6), M(0x6f8f3a), 0.12, -0.02, 0.03, { r: [0, 0, 1.25] });
      const leafA = M(0x8dbb4e), leafB = M(0x7aa83f);
      [[-0.2, 1], [-0.1, -1], [0, 1], [0.1, -1], [0.2, 1], [0.25, -1]].forEach(([y, side], i) => {
        add(sph(0.06, 10, 8), i % 2 ? leafA : leafB, side * 0.05, y, 0, { s: [0.45, 1.25, 0.25], r: [0, 0, -side * 0.9], parent: stem });
      });
      add(sph(0.03, 8, 6), M(0x5f6b3a), 0.02, -0.02, 0.03, { parent: stem });
      break;
    }
    case 'flor': {
      add(cyl(0.01, 0.01, 0.26, 6), M(0x6cc070), 0.1, -0.03, 0.02, { r: [0, 0, 1.1] });
      const head = new THREE.Group(); head.position.set(0.23, 0.03, 0.03); head.rotation.set(0.3, -0.5, 0); g.add(head);
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; add(sph(0.05, 10, 8), M(0xffffff), Math.cos(a) * 0.065, Math.sin(a) * 0.065, 0, { s: [1, 1, 0.45], parent: head }); }
      add(sph(0.045, 10, 8), M(0xffc94a), 0, 0, 0.02, { parent: head });
      break;
    }
    // ── Nuevos (se desbloquean por nivel o por estrellas) ──
    case 'boina': {
      const b = add(cyl(0.4, 0.43, 0.1, 28), M(0x3d5aa8, { roughness: 0.9 }), 0.06, -0.1, -0.02, { r: [-0.1, 0, -0.22] });
      add(cyl(0.025, 0.03, 0.07, 8), M(0x2c437f), 0, 0.08, 0, { parent: b });
      break;
    }
    case 'gorro-marinero': {
      const white = M(0xffffff, { roughness: 0.6 });
      add(cyl(0.33, 0.35, 0.17, 26), white, 0, -0.08, 0);
      add(cyl(0.37, 0.37, 0.05, 26), white, 0, 0.03, 0);
      add(torus(0.352, 0.035, 26), M(0x3d5aa8), 0, -0.12, 0, { r: [Math.PI / 2, 0, 0] });
      add(sph(0.045), M(0xe94b4b), 0, 0.07, 0);
      break;
    }
    case 'gorro-chef': {
      const white = M(0xffffff, { roughness: 0.7 });
      add(cyl(0.3, 0.32, 0.2, 24), white, 0, -0.06, 0);
      for (const [x, y, z, r] of [[0, 0.2, 0, 0.22], [-0.17, 0.15, 0.05, 0.16], [0.17, 0.15, 0.03, 0.16], [0, 0.15, -0.16, 0.16], [0.03, 0.13, 0.17, 0.15]]) add(sph(r), white, x, y, z);
      break;
    }
    case 'diadema-mariposa': {
      add(new THREE.TorusGeometry(0.53, 0.03, 8, 28, Math.PI), M(0xec6f90), 0, -0.47, 0.06, { r: [-0.15, 0, 0] });
      const fly = new THREE.Group(); fly.position.set(0.3, -0.02, 0.2); fly.rotation.set(0.15, 0.45, -0.35); fly.scale.setScalar(1.6); g.add(fly);
      for (const sx of [-1, 1]) {
        add(sph(0.09, 12, 8), M(0x9b7be8), sx * 0.08, 0.03, 0, { s: [1, 1.2, 0.25], r: [0, 0, sx * 0.4], parent: fly });
        add(sph(0.065, 12, 8), M(0xffc94a), sx * 0.07, -0.08, 0, { s: [1, 1, 0.25], r: [0, 0, -sx * 0.3], parent: fly });
        add(sph(0.025, 8, 6), M(0xffffff), sx * 0.09, 0.05, 0.02, { parent: fly });
      }
      add(sph(0.03, 8, 6), M(0x3d2b24), 0, 0, 0.01, { s: [0.6, 2.2, 0.6], parent: fly });
      break;
    }
    case 'chullo': {
      // Gorro andino tejido: copa con franjas de colores, orejeras con borlas y pompón.
      const R = HEAD_R * 0.9, cols = [0xe94b4b, 0xffc94a, 0x3fb58a, 0x3d5aa8, 0xffffff];
      const hat = new THREE.Group(); hat.position.set(0, -0.3, -0.03); hat.rotation.x = -0.12; g.add(hat);
      add(dome(R), M(0xe94b4b, { roughness: 1 }), 0, 0, 0, { s: [1, 0.92, 1], parent: hat });
      cols.forEach((c, k) => {
        const a = 0.18 + k * 0.24, rr = R * Math.cos(a) + 0.012;
        add(torus(rr, 0.028, 30), M(c, { roughness: 1 }), 0, R * 0.92 * Math.sin(a), 0, { r: [Math.PI / 2, 0, 0], parent: hat });
      });
      add(torus(R + 0.01, 0.045, 30), M(0x3d5aa8, { roughness: 1 }), 0, 0.01, 0, { r: [Math.PI / 2, 0, 0], parent: hat });
      for (const sx of [-1, 1]) {
        const flap = add(sph(0.15, 14, 10), M(0xffc94a, { roughness: 1 }), sx * (R + 0.02), -0.12, 0.04, { s: [0.38, 1.05, 0.85], parent: hat });
        add(cyl(0.012, 0.012, 0.18, 6), M(0xe94b4b), sx * 0.0, -0.24, 0, { parent: flap, s: [2.6, 0.95, 1.2] });
        add(sph(0.045, 8, 6), M(0x3fb58a, { roughness: 1 }), 0, -0.36, 0, { parent: flap, s: [2.6, 0.95, 1.2] });
      }
      add(sph(0.1, 12, 10), M(0xffffff, { roughness: 1 }), 0, R * 0.92 + 0.06, 0, { parent: hat });
      break;
    }
    case 'corona-olivo': {
      add(torus(0.4, 0.02, 28), M(0x6f8f3a), 0, -0.14, 0, { r: [Math.PI / 2, 0, 0] });
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        add(sph(0.06, 8, 6), M(i % 2 ? 0x8dbb4e : 0x7aa83f), Math.cos(a) * 0.4, -0.1 + (i % 2) * 0.03, Math.sin(a) * 0.4, { s: [0.5, 1.4, 0.3], r: [0.3, -a, (i % 2 ? 0.5 : -0.5)] });
      }
      break;
    }
    case 'gorro-estrellas': {
      const cone = add(new THREE.ConeGeometry(0.33, 0.7, 24), M(0x27325e, { roughness: 0.8 }), 0, 0.18, -0.06, { r: [-0.35, 0, 0.1] });
      add(torus(0.33, 0.05, 24), M(0xffffff, { roughness: 1 }), 0, -0.14, 0, { r: [Math.PI / 2 - 0.1, 0, 0] });
      for (const [x, y, z] of [[0.15, -0.15, 0.24], [-0.17, -0.02, 0.2], [0.08, 0.12, 0.15], [-0.05, -0.2, -0.27]]) add(sph(0.035, 8, 6), M(0xffd95e, { emissive: 0x8a6a10 }), x, y, z, { parent: cone });
      add(sph(0.08, 10, 8), M(0xffd95e), 0, 0.36, 0, { parent: cone });
      break;
    }
    case 'sombrero-pastor': {
      const felt = M(0x8a5a3c, { roughness: 0.95 });
      add(dome(0.32), felt, 0, -0.1, 0, { s: [1, 0.85, 1] });
      add(cyl(0.72, 0.74, 0.035, 32), felt, 0, -0.14, 0, { r: [0.05, 0, 0] });
      add(cyl(0.325, 0.33, 0.07, 24, true), M(0xe9c46a), 0, -0.08, 0);
      break;
    }
    case 'corona-trigo': {
      const gold = M(0xf0c35a, { roughness: 0.5, metalness: 0.2 });
      add(torus(0.37, 0.035, 28), gold, 0, -0.12, 0, { r: [Math.PI / 2, 0, 0] });
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2, ear = new THREE.Group();
        ear.position.set(Math.cos(a) * 0.37, -0.1, Math.sin(a) * 0.37); ear.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35); g.add(ear);
        for (let k = 0; k < 4; k++) for (const sx of [-1, 1]) add(sph(0.028, 6, 5), gold, sx * 0.022, 0.04 + k * 0.045, 0, { s: [0.8, 1.4, 0.8], parent: ear });
        add(sph(0.026, 6, 5), gold, 0, 0.23, 0, { s: [0.8, 1.6, 0.8], parent: ear });
      }
      break;
    }
    case 'collar-flores': {
      const cols = [0xff9db5, 0xffffff, 0xffd95e, 0xff8a5c, 0xc9a3ff];
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        add(sph(0.075, 10, 8), M(cols[i % cols.length]), Math.cos(a) * NECK_R * 0.95, 0.02 - Math.max(0, Math.sin(a)) * 0.0, -NECK_R * 0.95 + Math.sin(a) * NECK_R * 0.95, { s: [1, 0.7, 1] });
      }
      g.rotation.x = -0.12;
      break;
    }
    case 'pajarita-dorada': {
      const b = bow(0xf0c35a, 0xd9a23a, 0.95);
      b.traverse(o => { if (o.isMesh) { o.material.metalness = 0.5; o.material.roughness = 0.3; } });
      b.position.set(0, 0, 0.05);
      break;
    }
    case 'chalina-andina': {
      const cols = [0xe94b4b, 0xffc94a, 0x3fb58a, 0x3d5aa8, 0xff8a5c, 0xc9a3ff];
      cols.forEach((c, i) => add(torus(NECK_R * 0.96, 0.05, 32), M(c, { roughness: 1 }), 0, 0.15 - i * 0.045, -NECK_R * 0.96, { r: [Math.PI / 2 - 0.08, 0, 0] }));
      const end = new THREE.Group(); end.position.set(0.22, -0.2, 0.1); end.rotation.set(0.2, 0, -0.12); g.add(end);
      cols.forEach((c, i) => add(new THREE.BoxGeometry(0.2, 0.08, 0.07), M(c, { roughness: 1 }), 0, 0.17 - i * 0.08, 0, { parent: end }));
      for (let i = 0; i < 5; i++) add(cyl(0.008, 0.008, 0.08, 4), M(0xffc94a), -0.08 + i * 0.04, -0.3, 0, { parent: end });
      break;
    }
    case 'collar-estrellas': {
      add(torus(NECK_R * 0.9, 0.018, 32), M(0xf0c35a, { metalness: 0.4, roughness: 0.4 }), 0, 0.1, -NECK_R * 0.88, { r: [Math.PI / 2 - 0.22, 0, 0] });
      const star = new THREE.Shape();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.045 : 0.1; star[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, -Math.sin(a) * r); }
      const sg = new THREE.ExtrudeGeometry(star, { depth: 0.03, bevelEnabled: false });
      for (const [x, y, z, k] of [[0, -0.14, 0.07, 1.2], [-0.22, -0.07, 0.02, 0.8], [0.22, -0.07, 0.02, 0.8]]) add(sg, M(0xffd95e, { emissive: 0x6a5010, metalness: 0.3, roughness: 0.4 }), x, y, z, { s: [k, k, k], r: [0.2, 0, 0] });
      break;
    }
    case 'collar-perlas': {
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2;
        add(sph(0.04, 10, 8), M(0xfdfbff, { roughness: 0.2, metalness: 0.1 }), Math.cos(a) * NECK_R * 0.92, 0.08 - (Math.sin(a) > 0 ? Math.sin(a) * 0.14 : 0), -NECK_R * 0.92 + Math.sin(a) * NECK_R * 0.92);
      }
      break;
    }
    case 'bufanda-arcoiris': {
      const cols = [0xff6b6b, 0xffa94d, 0xffe066, 0x69db7c, 0x4dabf7, 0x9775fa];
      cols.forEach((c, i) => add(torus(NECK_R * 0.97, 0.045, 32), M(c, { roughness: 1 }), 0, 0.14 - i * 0.04, -NECK_R * 0.97, { r: [Math.PI / 2 - 0.08, 0, 0] }));
      cols.forEach((c, i) => add(new THREE.BoxGeometry(0.2, 0.075, 0.08), M(c, { roughness: 1 }), 0.2, -0.05 - i * 0.075, 0.09, { r: [0.2, 0, -0.12] }));
      break;
    }
    case 'campanita': {
      add(torus(NECK_R * 0.92, 0.04, 32), M(0xe94b4b), 0, 0.08, -NECK_R * 0.9, { r: [Math.PI / 2 - 0.2, 0, 0] });
      const pts = [[0, 0.16], [0.05, 0.15], [0.07, 0.1], [0.09, 0.02], [0.13, -0.04], [0.12, -0.06], [0, -0.06]].map(([x, y]) => new THREE.Vector2(x, y));
      add(new THREE.LatheGeometry(pts, 20), M(0xf0c35a, { metalness: 0.6, roughness: 0.3, side: THREE.DoubleSide }), 0, -0.16, 0.09, { r: [0.15, 0, 0] });
      add(sph(0.03, 8, 6), M(0xd9a23a), 0, -0.24, 0.1);
      break;
    }
    case 'corazon': {
      const red = M(0xff5c8a, { roughness: 0.4 });
      const hgrp = new THREE.Group(); hgrp.position.set(0.14, -0.02, 0.05); hgrp.rotation.set(0, -0.4, -0.25); g.add(hgrp);
      add(sph(0.055, 12, 10), red, -0.04, 0.03, 0, { parent: hgrp });
      add(sph(0.055, 12, 10), red, 0.04, 0.03, 0, { parent: hgrp });
      add(new THREE.ConeGeometry(0.083, 0.1, 16), red, 0, -0.035, 0, { r: [Math.PI, 0, 0], parent: hgrp });
      break;
    }
    case 'espiga': {
      const stem = add(cyl(0.01, 0.012, 0.42, 6), M(0xc9a857), 0.12, -0.02, 0.03, { r: [0, 0, 1.25] });
      for (let k = 0; k < 6; k++) for (const sx of [-1, 1]) add(sph(0.026, 6, 5), M(0xf0c35a), sx * 0.022, 0.06 + k * 0.03, 0, { s: [0.8, 1.5, 0.8], r: [0, 0, -sx * 0.4], parent: stem });
      break;
    }
    case 'estrella': {
      const star = new THREE.Shape();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.055 : 0.13; star[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, -Math.sin(a) * r); }
      add(new THREE.ExtrudeGeometry(star, { depth: 0.04, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2 }), M(0xffd95e, { emissive: 0x6a5010, roughness: 0.35 }), 0.16, 0.0, 0.03, { r: [0, -0.5, -0.2] });
      break;
    }
    // ═══════════════ Moda de varón ═══════════════
    case 'polo-seleccion': {
      // La blanquirroja: blanca con la banda roja del hombro derecho a la cadera izquierda.
      const white = hex3(0xf8f8f6), red = hex3(0xd7192a);
      const cut = garment({ y0: 0.3, y1: 0.97, inflate: 0.024, color: (u, phi, x, y) => mixc(red, white, edge(Math.abs((y - 0.68) + x * 0.62), 0.075)) });
      if (cut) { trim(cut.top, 0xd7192a, 0.03); trim(cut.bottom, 0xeeeeea, 0.02); }
      break;
    }
    case 'polera-capucha': {
      const base = hex3(0x4f7cc9), rib = hex3(0x2f5193), pocket = hex3(0x5a87d4);
      const cut = garment({ y0: 0.28, y1: 0.98, inflate: 0.032, color: (u, phi, x, y) => {
        if (u < 0.07) return rib;
        const knit = mixc(base, [1, 1, 1], noise((phi * 40) | 0, (y * 60) | 0) * 0.06);
        if (Math.abs(phi) > 1) return knit;
        // bolsillo canguro con su costura
        const d = Math.max(Math.abs(x) / 0.25, Math.abs(y - 0.465) / 0.105);
        return d < 1 ? mixc(pocket, rib, 1 - edge(1 - d, 0.1, 0.05)) : knit;
      } });
      if (cut) {
        trim(cut.top, 0x3a5fa3, 0.04);
        const bk = cut.at(1, -Math.PI), fr = cut.at(1, 0);
        add(sph(0.3, 22, 14), M(0x4f7cc9, { roughness: 0.9 }), bk.x, bk.y - 0.05, bk.z - 0.04, { s: [1.15, 0.6, 0.55], r: [0.4, 0, 0] });   // capucha
        for (const sx of [-1, 1]) {                                                                                                     // cordones
          add(cyl(0.012, 0.012, 0.2, 6), M(0xffffff), fr.x + sx * 0.09, fr.y - 0.12, fr.z + 0.07, { r: [0.35, 0, 0] });
          add(sph(0.022, 8, 6), M(0xffffff), fr.x + sx * 0.09, fr.y - 0.22, fr.z + 0.1);
        }
      }
      break;
    }
    case 'casaca-jean': {
      const denim = hex3(0x4f7fbf), dark = hex3(0x395f96), seam = hex3(0xe0b86c);
      const cut = garment({ y0: 0.3, y1: 0.98, inflate: 0.032, front: 0.2, color: (u, phi, x, y) => {
        if (u < 0.09) return dark;                                         // pretina
        if (Math.abs(u - 0.1) < 0.008 || Math.abs(Math.abs(phi) - 0.25) < 0.02) return seam;   // pespuntes
        return mixc(denim, dark, noise((phi * 70) | 0, (y * 110) | 0) * 0.4);
      } });
      if (cut) {
        trim(cut.top, 0x395f96, 0.045);                                     // cuello
        for (const u of [0.18, 0.4, 0.62, 0.84]) stud(cut, u, 0.27, 0.026, 0xc9a14a, { metalness: 0.7, roughness: 0.3 });
        for (const sx of [-1, 1]) stud(cut, 0.66, sx * 0.62, 0.022, 0xc9a14a, { metalness: 0.7, roughness: 0.3 });   // bolsillos del pecho
      }
      break;
    }
    case 'camisa-terno': {
      // Camisa blanca y chaleco con escote en V: para la fiesta de la Primera Comunión.
      const shirt = garment({ y0: 0.3, y1: 0.98, inflate: 0.018, color: () => [1, 1, 1] });
      const vest = garment({ y0: 0.31, y1: 0.95, inflate: 0.036, front: u => (u < 0.38 ? 0 : 0.62 * Math.pow((u - 0.38) / 0.62, 1.1)),
        color: u => (u < 0.06 ? hex3(0x23262f) : hex3(0x30364a)) });
      if (shirt) trim(shirt.top, 0xffffff, 0.035);
      if (vest) for (const u of [0.1, 0.2, 0.3]) stud(vest, u, 0, 0.022, 0xd9b45a, { metalness: 0.6, roughness: 0.35 });
      break;
    }
    case 'gorra-urbana': {
      // Gorra al revés, negra con verde flúor.
      const black = M(0x22252b);
      add(dome(HEAD_R * 0.8), black, 0, -0.24, -0.03, { s: [1, 0.72, 1], r: [-0.14, 0, 0] });
      add(cyl(0.3, 0.32, 0.03, 24), M(0x7cf05a), 0, -0.22, -0.45, { s: [1, 1, 0.7], r: [-0.04, 0, 0] });
      add(sph(0.045), M(0x7cf05a), 0, 0.075, -0.03);
      add(cyl(0.075, 0.075, 0.012, 18), M(0x7cf05a), 0, -0.1, 0.33, { r: [Math.PI / 2 - 0.55, 0, 0] });
      break;
    }
    case 'audifonos': {
      const H = anchor?.userData?.head || { x: 0, y: -0.5, z: 0, rx: 0.58, ry: 0.5, rz: 0.54 };
      add(new THREE.TorusGeometry(H.rx + 0.07, 0.035, 10, 32, Math.PI), M(0x2b2f3a, { roughness: 0.5 }), H.x, H.y, H.z + 0.05, { s: [1, (H.ry + 0.1) / (H.rx + 0.07), 1] });
      for (const sx of [-1, 1]) {
        add(cyl(0.15, 0.15, 0.1, 24), M(0xff5a5a, { roughness: 0.35 }), H.x + sx * (H.rx + 0.06), H.y - 0.03, H.z + 0.05, { r: [0, 0, Math.PI / 2] });
        add(cyl(0.09, 0.09, 0.11, 18), M(0xffffff, { roughness: 0.4 }), H.x + sx * (H.rx + 0.065), H.y - 0.03, H.z + 0.05, { r: [0, 0, Math.PI / 2] });
      }
      break;
    }
    case 'lentes-sol':
    case 'lentes-corazon':
    case 'lentes-aviador': {
      const eyes = anchor?.userData?.eyes || [{ x: 0.27, y: 0, z: -0.08, nx: 0.47, ny: 0, nz: 0.88 }, { x: -0.27, y: 0, z: -0.08, nx: -0.47, ny: 0, nz: 0.88 }];
      const heart = id === 'lentes-corazon', aviator = id === 'lentes-aviador';
      const frame = M(heart ? 0xff4f8b : aviator ? 0xd9a93a : 0x1d1f24, { roughness: 0.3, metalness: aviator ? 0.75 : 0.1 });
      const lens = M(heart ? 0xff8fb8 : aviator ? 0x5b4a2c : 0x1c2733, { roughness: 0.08, metalness: 0.35, transparent: true, opacity: 0.8 });
      const centers = [];
      for (const e of eyes) {
        const n = new THREE.Vector3(e.nx, e.ny, e.nz).normalize();
        const c = new THREE.Vector3(e.x, e.y, e.z).addScaledVector(n, 0.08);
        centers.push(c);
        const L = new THREE.Group(); L.position.copy(c); L.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n); g.add(L);
        if (heart) {
          add(new THREE.ExtrudeGeometry(heartShape(0.2), { depth: 0.025, bevelEnabled: false }), frame, 0, 0, -0.012, { parent: L });
          add(new THREE.ShapeGeometry(heartShape(0.165)), lens, 0, 0, 0.016, { parent: L });
        } else {
          const sx = aviator ? 1 : 1.15, sy = aviator ? 1.1 : 0.82;
          add(torus(0.165, aviator ? 0.012 : 0.024, 30), frame, 0, aviator ? -0.02 : 0, 0, { s: [sx, sy, 1], parent: L });
          add(new THREE.CircleGeometry(0.165, 30), lens, 0, aviator ? -0.02 : 0, 0.004, { s: [sx, sy, 1], parent: L });
        }
      }
      const [a, b] = centers, mid = a.clone().add(b).multiplyScalar(0.5);
      add(new THREE.BoxGeometry(Math.abs(a.x - b.x) - 0.33, aviator ? 0.012 : 0.026, 0.024), frame, mid.x, mid.y + 0.05, Math.max(a.z, b.z) + 0.01);
      for (const c of centers) {
        const sx = Math.sign(c.x) || 1, from = new THREE.Vector3(c.x + sx * 0.17, c.y + 0.03, c.z - 0.04), to = new THREE.Vector3(c.x + sx * 0.3, c.y + 0.06, c.z - 0.5);
        const len = from.distanceTo(to), mid2 = from.clone().add(to).multiplyScalar(0.5);
        const t = add(new THREE.BoxGeometry(0.022, 0.024, len), frame, mid2.x, mid2.y, mid2.z);
        t.lookAt(t.position.clone().add(to.clone().sub(from)));
      }
      break;
    }
    case 'corbata': {
      const red = M(0xc8202f, { roughness: 0.5 }), dark = M(0x9a1622, { roughness: 0.5 });
      add(new THREE.CylinderGeometry(0.065, 0.042, 0.09, 4), dark, 0, -0.03, 0.06, { s: [1, 1, 0.55], r: [0.15, Math.PI / 4, 0] });   // nudo
      const prof = (anchor?.userData?.front || []).filter(([y]) => y < -0.05 && y > -0.5);
      for (let i = 0; i + 1 < prof.length; i++) {
        const [y0, z0] = prof[i], [y1, z1] = prof[i + 1];
        const len = Math.hypot(y1 - y0, z1 - z0), w = 0.075 + 0.05 * (i / Math.max(1, prof.length - 2));
        add(new THREE.BoxGeometry(w * 2, len + 0.012, 0.022), red, 0, (y0 + y1) / 2, (z0 + z1) / 2 + 0.05, { r: [Math.atan2(z0 - z1, y0 - y1), 0, 0] });
      }
      const last = prof[prof.length - 1] || [-0.45, 0.12];
      add(new THREE.CylinderGeometry(0.17, 0.001, 0.12, 4), red, 0, last[0] - 0.05, last[1] + 0.05, { s: [0.88, 1, 0.13], r: [0, Math.PI / 4, 0] });   // punta
      break;
    }
    case 'zapatillas': {
      const upper = M(0x2f6fdd, { roughness: 0.5 }), sole = M(0xffffff, { roughness: 0.6 });
      add(sph(0.12, 20, 12), upper, 0, 0.072, 0.09, { s: [1.22, 0.7, 1.8] });
      add(sph(0.125, 20, 10), sole, 0, 0.03, 0.09, { s: [1.27, 0.3, 1.86] });
      add(sph(0.1, 16, 10), sole, 0, 0.06, 0.24, { s: [1.1, 0.55, 0.55] });                       // puntera
      add(torus(0.062, 0.026, 16), upper, 0, 0.135, -0.01, { r: [Math.PI / 2, 0, 0] });          // tobillo
      for (let k = 0; k < 3; k++) add(new THREE.BoxGeometry(0.12, 0.014, 0.022), sole, 0, 0.142 - k * 0.016, 0.05 + k * 0.045, { r: [-0.55, 0, 0] });   // pasadores
      for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.012, 0.035, 0.15), M(0xff5a3c), sx * 0.147, 0.075, 0.07);   // franjas
      break;
    }
    // ═══════════════ Moda de mujer ═══════════════
    case 'vestido-flores': {
      const base = hex3(0x8fd3ff), petal = hex3(0xffffff), pink = hex3(0xff9db5), mid = hex3(0xffd95e);
      const cut = garment({ y0: 0.13, y1: 0.97, inflate: 0.02, flare: 0.27, flareFrom: 0.56, ruffle: 0.07, ruffleN: 9, color: (u, phi, x, y) => {
        // florecitas de cinco pétalos, repartidas en filas alternadas
        const cv = y * 4.4, iv = Math.floor(cv), cu = phi * 8.5 / Math.PI + (iv % 2 ? 0.5 : 0), iu = Math.floor(cu);
        const fu = cu - iu - 0.5, fv = cv - iv - 0.5, d = Math.hypot(fu, fv);
        const petals = 0.24 + 0.09 * Math.cos(Math.atan2(fv, fu) * 5);
        const flower = mixc((iu + iv) % 2 ? petal : pink, base, edge(d, petals, 0.03));
        return mixc(mid, flower, edge(d, 0.085, 0.02));
      } });
      if (cut) { trim(cut.ringAt(0.5), 0xff8fb1, 0.034); trim(cut.bottom, 0xffffff, 0.02); trim(cut.top, 0xffffff, 0.026); }
      break;
    }
    case 'falda-tutu': {
      const a = hex3(0xff86ae), b = hex3(0xffb3cc);
      const top = garment({ y0: 0.3, y1: 0.52, inflate: 0.02, flare: 0.3, flareFrom: 0.52, ruffle: 0.16, ruffleN: 14, wings: false, rows: 10, color: u => mixc(a, b, u) }, cloth({ transparent: true, opacity: 0.93 }));
      garment({ y0: 0.36, y1: 0.52, inflate: 0.034, flare: 0.24, flareFrom: 0.52, ruffle: 0.2, ruffleN: 11, wings: false, rows: 8, color: u => mixc(b, [1, 0.9, 0.95], u) }, cloth({ transparent: true, opacity: 0.85 }));
      if (top) trim(top.top, 0xff6f9f, 0.03);
      break;
    }
    case 'chompa-corazones': {
      const base = hex3(0xff8fb1), rib = hex3(0xee6d97), white = hex3(0xffffff);
      const cut = garment({ y0: 0.28, y1: 0.98, inflate: 0.032, seg: 192, rows: 48, color: (u, phi, x, y) => {
        if (u < 0.07) return rib;
        // corazoncitos blancos en filas alternadas
        const cv = y * 3.7, iv = Math.floor(cv), cu = phi * 6.5 / Math.PI + (iv % 2 ? 0.5 : 0);
        const X = (cu - Math.floor(cu) - 0.5) * 2.9, Y = ((cv - iv) - 0.44) * 2.9;
        const H = Math.pow(X * X + Y * Y - 1, 3) - X * X * Y * Y * Y;
        return mixc(white, base, Math.min(1, Math.max(0, (H + 0.06) / 0.12)));
      } });
      if (cut) trim(cut.top, 0xee6d97, 0.04);
      break;
    }
    case 'vestido-comunion': {
      const white = hex3(0xffffff), lace = hex3(0xe9ecf5);
      const cut = garment({ y0: 0.12, y1: 0.97, inflate: 0.02, flare: 0.3, flareFrom: 0.54, ruffle: 0.06, ruffleN: 10,
        color: (u, phi, x, y) => (y < 0.5 && Math.sin(phi * 38) * Math.sin(y * 95) > 0.55 ? lace : white) });
      if (cut) {
        trim(cut.ringAt(0.49), 0xf0c35a, 0.03, { metalness: 0.4, roughness: 0.35 });   // cinturón dorado
        trim(cut.bottom, 0xf0c35a, 0.016, { metalness: 0.4, roughness: 0.35 });
        trim(cut.top, 0xffffff, 0.03);
        const p = cut.at(0.49, -Math.PI);
        const b = bow(0xffffff, 0xf0c35a, 0.85); b.position.set(p.x, p.y, p.z - 0.04); b.rotation.y = Math.PI;   // lazo en la espalda
      }
      break;
    }
    case 'vincha-brillos': {
      const band = new THREE.Group(); band.position.set(0, -0.47, 0.06); band.rotation.x = -0.15; g.add(band);
      add(new THREE.TorusGeometry(0.53, 0.032, 8, 28, Math.PI), M(0xb07be8, { roughness: 0.35 }), 0, 0, 0, { parent: band });
      [0xff5fa2, 0x5fd3ff, 0xffd95e, 0x8be07a, 0xff5fa2].forEach((c, i) => {
        const a = Math.PI * (0.3 + i * 0.1);
        add(new THREE.OctahedronGeometry(0.05), M(c, { roughness: 0.15, metalness: 0.2, emissive: c, emissiveIntensity: 0.18 }), Math.cos(a) * 0.53, Math.sin(a) * 0.53, 0.035, { parent: band });
      });
      break;
    }
    case 'tiara-princesa': {
      const silver = M(0xe3e9f2, { metalness: 0.75, roughness: 0.22 });
      const t = new THREE.Group(); t.position.set(0, -0.12, 0.01); t.rotation.x = -0.2; g.add(t);
      add(new THREE.TorusGeometry(0.4, 0.025, 8, 30, Math.PI), silver, 0, 0, 0, { r: [Math.PI / 2, 0, 0], parent: t });
      for (let k = 0; k < 5; k++) {
        const a = Math.PI * (0.18 + k * 0.16), h = k === 2 ? 0.2 : 0.12;
        add(new THREE.ConeGeometry(0.04, h, 4), silver, Math.cos(a) * 0.4, h / 2, Math.sin(a) * 0.4, { parent: t });
        add(sph(0.022, 8, 6), M(0xffffff, { roughness: 0.15 }), Math.cos(a) * 0.4, h + 0.015, Math.sin(a) * 0.4, { parent: t });
      }
      add(new THREE.OctahedronGeometry(0.055), M(0xff5fa2, { roughness: 0.1, metalness: 0.3, emissive: 0xff5fa2, emissiveIntensity: 0.2 }), 0, 0.07, 0.42, { parent: t });
      break;
    }
    case 'bolsito': {
      const gold = M(0xf0c35a, { metalness: 0.55, roughness: 0.3 });
      add(torus(NECK_R * 0.9, 0.014, 32), gold, 0, 0.1, -NECK_R * 0.88, { r: [Math.PI / 2 - 0.22, 0, 0] });
      const bag = new THREE.Group(); bag.position.set(0.3, -0.3, 0.24); bag.rotation.set(0.2, -0.35, 0.08); bag.scale.setScalar(1.3); g.add(bag);
      rod(new THREE.Vector3(0.16, -0.02, 0.04), new THREE.Vector3(0.29, -0.2, 0.23), 0.01, gold);   // cadenita
      add(sph(0.13, 18, 12), M(0x9b6bd6, { roughness: 0.4 }), 0, 0, 0, { s: [1, 0.78, 0.42], parent: bag });
      add(new THREE.SphereGeometry(0.13, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0x7d52bd, { roughness: 0.4 }), 0, 0.005, 0.012, { s: [1.02, 0.6, 0.44], r: [0.1, 0, 0], parent: bag });   // tapita
      add(sph(0.022, 10, 8), gold, 0, -0.02, 0.06, { parent: bag });
      break;
    }
    case 'zapatitos': {
      const patent = M(0xe8325a, { roughness: 0.12, metalness: 0.15 });
      add(sph(0.12, 20, 12), patent, 0, 0.06, 0.09, { s: [1.13, 0.56, 1.66] });
      add(sph(0.122, 20, 10), M(0x7a1830), 0, 0.022, 0.09, { s: [1.16, 0.22, 1.7] });           // suela
      add(torus(0.06, 0.014, 14), patent, 0, 0.1, 0.0, { r: [Math.PI / 2, 0, 0] });            // tira
      add(cyl(0.058, 0.058, 0.12, 16), M(0xffffff, { roughness: 0.9 }), 0, 0.155, -0.01);      // medias blancas
      add(torus(0.066, 0.02, 16), M(0xffffff, { roughness: 0.9 }), 0, 0.215, -0.01, { r: [Math.PI / 2, 0, 0] });
      const b = bow(0xffd1e1, 0xff8fb1, 0.36); b.position.set(0, 0.105, 0.17); b.rotation.x = -0.55;
      break;
    }
    default:
      return null;
  }
  g.userData.dispose = () => g.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  return g;
}
