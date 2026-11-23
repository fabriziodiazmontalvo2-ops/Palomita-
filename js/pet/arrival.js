// Llegada de la palomita: una jaulita dorada baja del cielo colgada de globos con el pichón adentro.
// El niño la toca, se abre la puertita, el pichón sale saltando y la jaulita se va volando con los globos.
//
//   const a = createArrival(THREE, scene, dove)
//   a.update(dt)            → avanza la animación (llamar en cada cuadro)
//   a.stage                 'descend' | 'wait' | 'open' | 'out' | 'lift' | 'back' | 'done'
//   a.open()                abre la jaulita (solo cuando stage === 'wait')
//   a.onDone(fn)            se llama al terminar
//   a.dispose()
export function createArrival(THREE, scene, dove, { sfx = () => {}, fx = null } = {}) {
  const root = new THREE.Group();
  root.name = 'jaulita';
  scene.add(root);
  const disposables = [];
  const mat = (color, extra = {}) => { const m = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.35, ...extra }); disposables.push(m); return m; };
  const geo = g => { disposables.push(g); return g; };
  const gold = mat(0xe0b04a), wood = mat(0xb7794a, { metalness: 0, roughness: 0.8 }), red = mat(0xe94b4b, { metalness: 0, roughness: 0.6 });

  const R = 0.74, HGT = 1.42, BAR = 0.026, N = 18;
  const cage = new THREE.Group();
  root.add(cage);
  // Base de madera
  const base = new THREE.Mesh(geo(new THREE.CylinderGeometry(R + 0.08, R + 0.12, 0.14, 40)), wood);
  base.position.y = 0.07; base.castShadow = true; base.receiveShadow = true;
  cage.add(base);
  // Barrotes (una sola llamada de dibujo); los 3 de adelante son la puerta
  const doorIdx = [N / 2 - 1, N / 2, N / 2 + 1].map(i => (i + N / 4) % N);
  const angleOf = i => (i / N) * Math.PI * 2;
  const barGeo = geo(new THREE.CylinderGeometry(BAR, BAR, HGT, 6));
  const bars = new THREE.InstancedMesh(barGeo, gold, N - doorIdx.length);
  const m4 = new THREE.Matrix4();
  let k = 0;
  for (let i = 0; i < N; i++) {
    if (doorIdx.includes(i)) continue;
    const a = angleOf(i);
    m4.makeTranslation(Math.sin(a) * R, 0.14 + HGT / 2, Math.cos(a) * R);
    bars.setMatrixAt(k++, m4);
  }
  bars.castShadow = true;
  cage.add(bars);
  // Aros
  for (const y of [0.16, 0.16 + HGT * 0.5, 0.14 + HGT]) {
    const ring = new THREE.Mesh(geo(new THREE.TorusGeometry(R, 0.03, 8, 48)), gold);
    ring.rotation.x = Math.PI / 2; ring.position.y = y; cage.add(ring);
  }
  // Cúpula: arcos que se cruzan arriba
  for (let i = 0; i < 4; i++) {
    const arc = new THREE.Mesh(geo(new THREE.TorusGeometry(R, 0.024, 6, 32, Math.PI)), gold);
    arc.position.y = 0.14 + HGT; arc.rotation.y = (i / 4) * Math.PI; arc.scale.y = 0.62;
    cage.add(arc);
  }
  const topY = 0.14 + HGT + R * 0.62;
  const hook = new THREE.Mesh(geo(new THREE.TorusGeometry(0.1, 0.025, 8, 20)), gold);
  hook.position.y = topY + 0.1; cage.add(hook);
  // Moño rojo en la base
  for (const sx of [-1, 1]) {
    const loop = new THREE.Mesh(geo(new THREE.SphereGeometry(0.12, 12, 8)), red);
    loop.scale.set(1.2, 0.75, 0.4); loop.position.set(sx * 0.13, 0.12, R + 0.14); loop.rotation.z = sx * 0.3;
    cage.add(loop);
  }
  const knot = new THREE.Mesh(geo(new THREE.SphereGeometry(0.06, 10, 8)), red);
  knot.position.set(0, 0.12, R + 0.17); cage.add(knot);
  // Puerta: gira sobre una bisagra al costado
  const a0 = angleOf(doorIdx[0]), a2 = angleOf(doorIdx[2]);
  const hinge = new THREE.Group();
  hinge.position.set(Math.sin(a0) * R, 0, Math.cos(a0) * R);
  cage.add(hinge);
  const door = new THREE.Group();
  hinge.add(door);
  for (const i of doorIdx) {
    const a = angleOf(i);
    const b = new THREE.Mesh(barGeo, gold);
    b.position.set(Math.sin(a) * R - hinge.position.x, 0.14 + HGT * 0.42, Math.cos(a) * R - hinge.position.z);
    b.scale.y = 0.84;
    door.add(b);
  }
  for (const y of [0.2, 0.14 + HGT * 0.84]) {
    const cross = new THREE.Mesh(geo(new THREE.BoxGeometry(Math.hypot(Math.sin(a2) * R - Math.sin(a0) * R, Math.cos(a2) * R - Math.cos(a0) * R) + 0.04, 0.035, 0.035)), gold);
    const mx = (Math.sin(a0) + Math.sin(a2)) / 2 * R - hinge.position.x, mz = (Math.cos(a0) + Math.cos(a2)) / 2 * R - hinge.position.z;
    cross.position.set(mx, y, mz);
    cross.rotation.y = Math.atan2(Math.sin(a2) - Math.sin(a0), Math.cos(a2) - Math.cos(a0)) - Math.PI / 2;
    door.add(cross);
  }
  // Globos
  const balloons = new THREE.Group();
  balloons.position.y = topY + 0.1;
  root.add(balloons);
  const BCOL = [0xff8fb1, 0x7cc8f5, 0xffd95e];
  const strMat = new THREE.LineBasicMaterial({ color: 0xffffff }); disposables.push(strMat);
  const bal = BCOL.map((c, i) => {
    const g = new THREE.Group();
    const x = (i - 1) * 0.55, y = 1.6 + (i === 1 ? 0.35 : 0);
    const m = new THREE.Mesh(geo(new THREE.SphereGeometry(0.36, 22, 16)), mat(c, { metalness: 0.05, roughness: 0.35 }));
    m.scale.set(1, 1.18, 1); m.position.set(x, y, 0); m.castShadow = true;
    const tie = new THREE.Mesh(geo(new THREE.ConeGeometry(0.06, 0.1, 8)), m.material);
    tie.position.set(x, y - 0.44, 0);
    const line = new THREE.Line(geo(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y - 0.48, 0)])), strMat);
    g.add(m, tie, line);
    balloons.add(g);
    return { g, m, ph: i * 1.7 };
  });

  // ── Línea de tiempo ──
  const START_Y = 8.5;
  let stage = 'descend', t = 0, done = null, waitT = 0;
  root.position.set(0, START_Y, 0);
  dove.group.position.set(0, START_Y + 0.14, 0);
  const ease = x => 1 - Math.pow(1 - x, 3);
  const bounce = x => { const n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375; return n * (x -= 2.625 / d) * x + 0.984375; };
  const set = s => { stage = s; t = 0; };

  function update(dt) {
    t += dt;
    for (const b of bal) { b.g.rotation.z = Math.sin(t * 1.4 + b.ph) * 0.06; b.m.position.y += Math.sin(t * 2 + b.ph) * 0.0008; }
    if (stage === 'descend') {
      const k = Math.min(1, t / 2.8);
      const y = START_Y * (1 - bounce(k));
      root.position.y = y; root.rotation.z = Math.sin(t * 2.2) * 0.06 * (1 - k);
      dove.group.position.y = y + 0.14;
      if (k >= 1) { set('wait'); sfx('drop'); }
    } else if (stage === 'wait') {
      // El pichón mira curioso desde adentro y la jaulita se mueve un poquito.
      root.rotation.z = Math.sin(t * 3) * 0.015;
      waitT -= dt;
      if (waitT <= 0) { waitT = 2.2 + (t % 1.3); dove.play(['hop', 'nod', 'surprise', 'flap'][Math.floor(t) % 4]); sfx('chirp'); }
    } else if (stage === 'open') {
      hinge.rotation.y = -ease(Math.min(1, t / 0.7)) * 1.9;
      if (t > 0.8) { set('out'); dove.play('hop'); sfx('jump'); }
    } else if (stage === 'out') {
      // Sale saltando hacia adelante.
      const k = Math.min(1, t / 0.9);
      dove.group.position.set(0, 0.14 * (1 - k) + Math.sin(k * Math.PI) * 0.6, k * 1.25);
      if (k >= 1) { set('lift'); dove.play('flap'); sfx('flap'); fx?.hearts(6); fx?.sparkles(10); }
    } else if (stage === 'lift') {
      // La jaulita se va con los globos.
      const k = Math.min(1, t / 3.2);
      root.position.y = k * k * 10; root.rotation.z = Math.sin(t * 2) * 0.05;
      if (t > 0.6 && t - dt <= 0.6) { dove.play('wave'); sfx('coo'); }
      if (k >= 1) { root.visible = false; set('back'); dove.play('hop'); }
    } else if (stage === 'back') {
      const k = Math.min(1, t / 0.7);
      dove.group.position.set(0, Math.sin(k * Math.PI) * 0.35, 1.25 * (1 - k));
      if (k >= 1) { dove.group.position.set(0, 0, 0); set('done'); dove.play('giggle'); fx?.confetti(); sfx('win'); done?.(); }
    }
  }

  return {
    get stage() { return stage; },
    update,
    open() { if (stage === 'wait') { set('open'); sfx('pop'); } },
    onDone(fn) { done = fn; if (stage === 'done') fn(); },
    skip() { root.visible = false; dove.group.position.set(0, 0, 0); set('done'); done?.(); },
    dispose() {
      scene.remove(root);
      for (const d of disposables) d.dispose?.();
      bars.dispose?.();
      dove.group.position.set(0, 0, 0);
    },
  };
}

// Tamaño de la palomita según su nivel: llega como pichón y crece hasta ser grande.
export const GROWTH = [
  { from: 1, name: 'Pichón', scale: 0.56 },
  { from: 5, name: 'Palomita pequeña', scale: 0.68 },
  { from: 15, name: 'Palomita joven', scale: 0.82 },
  { from: 30, name: 'Palomita grande', scale: 0.93 },
  { from: 50, name: 'Palomita adulta', scale: 1 },
];
export function growthFor(level) {
  let i = 0;
  while (i + 1 < GROWTH.length && level >= GROWTH[i + 1].from) i++;
  const a = GROWTH[i], b = GROWTH[i + 1];
  // Crece un poquito con cada nivel dentro de la etapa.
  const k = b ? Math.min(1, (level - a.from) / (b.from - a.from)) : 0;
  return { stage: i, name: a.name, scale: b ? a.scale + (b.scale - a.scale) * k * 0.6 : a.scale };
}
