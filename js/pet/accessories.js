// Accesorios 3D de la palomita, modelados por código con formas simples.
//   createAccessory(THREE, id) → THREE.Group (o null si el id no existe)
// Los ids son los de ACCESSORIES en js/data/items.js. Cada accesorio se cuelga de un ancla del modelo:
//   head → origen en la coronilla (+Y hacia arriba) · neck → origen al frente del cuello (+Z hacia fuera) · beak → punta del pico.
// Medidas pensadas para una cabeza de radio ≈ 0.55 y un cuello de radio ≈ 0.6 (ver HEAD_R y NECK_R).
const HEAD_R = 0.55, NECK_R = 0.6;

export function createAccessory(THREE, id) {
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
    default:
      return null;
  }
  g.userData.dispose = () => g.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  return g;
}
