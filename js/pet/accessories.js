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
    default:
      return null;
  }
  g.userData.dispose = () => g.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  return g;
}
