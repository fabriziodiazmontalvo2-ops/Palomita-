// Palomita 3D — CONTRATO DE LA API (este archivo es un marcador sencillo; lo reemplaza el modelo definitivo).
//
// createDove(THREE, opts?) -> Dove
//
// Dove = {
//   group    : THREE.Group. Origen = punto del suelo entre las patitas. Mira hacia +Z. Altura total ≈ 2.0 unidades
//              (el copete puede llegar a ≈ 2.2). Ancho ≈ 1.6. Sombras: las mallas usan castShadow = true.
//   anchors  : { head, neck, beak, back } → Object3D vacíos, hijos del hueso correcto para que los accesorios sigan la animación.
//              head = centro de la coronilla (su +Y sale de la cabeza hacia arriba; ahí se apoya un sombrero),
//              neck = frente del cuello, donde la cabeza se une al cuerpo (moños, bufandas, medallas),
//              beak = punta del pico (para llevar una ramita de olivo), back = parte alta de la espalda.
//   hitParts : Object3D[] para raycast. Cada malla lleva userData.part =
//              'head' | 'belly' | 'wingL' | 'wingR' | 'feet' | 'beak' | 'tail'.
//   update(dt, t)   : llamar en cada cuadro. dt = segundos desde el cuadro anterior, t = segundos totales.
//                     TODA la animación sale de aquí (nada de Date.now(), performance.now() ni setTimeout internos),
//                     así una simulación a paso fijo produce siempre la misma pose.
//   setMood(mood)   : expresión/postura base persistente:
//                     'happy' | 'neutral' | 'sad' | 'sleepy' | 'hungry' | 'excited'.
//   setSleeping(on) : true → ojos cerrados, se acurruca, respiración lenta. false → despierta.
//   lookAt(nx, ny)  : hacia dónde mira, normalizado -1..1 (x derecha, y arriba; 0,0 = a la cámara).
//                     La cabeza gira un poco y las pupilas siguen. Se suaviza dentro de update.
//   play(action)    : animación de una sola vez, mezclada sobre el reposo. Devuelve la duración en segundos.
//                     'hop' | 'flap' | 'eat' | 'giggle' | 'nod' | 'shake' | 'dance' | 'pray' | 'wave' | 'spin' |
//                     'sneeze' | 'surprise' | 'sad'
//   setTalking(v)   : 0..1 apertura del pico mientras "habla" (se llama en cada cuadro; 0 lo cierra).
//   setDirt(v)      : 0..1 manchitas de barro que aparecen sobre el cuerpo.
//   dispose()       : libera geometrías y materiales.
// }

export function createDove(THREE) {
  const group = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
  const orange = new THREE.MeshStandardMaterial({ color: 0xff9b54, roughness: 0.5 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2b1d16, roughness: 0.2 });
  const mud = new THREE.MeshStandardMaterial({ color: 0x8a5a3c, roughness: 0.9, transparent: true, opacity: 0 });

  const root = new THREE.Group();
  group.add(root);

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.72, 32, 24), white);
  body.scale.set(1, 0.95, 0.95);
  body.position.y = 0.78;
  body.userData.part = 'belly';
  root.add(body);

  const headPivot = new THREE.Group();
  headPivot.position.set(0, 1.25, 0.1);
  root.add(headPivot);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 24), white);
  head.position.y = 0.25;
  head.userData.part = 'head';
  headPivot.add(head);

  const eyes = [];
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), dark);
    eye.position.set(0.22 * s, 0.32, 0.47);
    headPivot.add(eye);
    eyes.push(eye);
  }
  const beakTop = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 12), orange);
  beakTop.rotation.x = Math.PI / 2;
  beakTop.position.set(0, 0.2, 0.6);
  beakTop.userData.part = 'beak';
  headPivot.add(beakTop);
  const beakLow = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 12), orange);
  beakLow.rotation.x = Math.PI / 2;
  beakLow.position.set(0, 0.14, 0.57);
  headPivot.add(beakLow);

  const wings = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(0.62 * s, 1.0, 0);
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.4, 20, 16), white);
    w.scale.set(0.28, 1, 0.75);
    w.position.y = -0.3;
    w.userData.part = s < 0 ? 'wingR' : 'wingL';
    pivot.add(w);
    root.add(pivot);
    wings.push({ pivot, s });
  }
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), white);
  tail.scale.set(0.9, 0.25, 1.2);
  tail.position.set(0, 0.6, -0.72);
  tail.rotation.x = -0.5;
  tail.userData.part = 'tail';
  root.add(tail);
  const feet = [];
  for (const s of [-1, 1]) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), orange);
    f.scale.set(1, 0.35, 1.5);
    f.position.set(0.25 * s, 0.05, 0.12);
    f.userData.part = 'feet';
    root.add(f);
    feet.push(f);
  }
  const spots = [];
  for (const [x, y, z] of [[0.3, 0.9, 0.62], [-0.35, 0.6, 0.6], [0.1, 0.5, 0.7]]) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), mud);
    m.scale.set(1, 0.8, 0.3);
    m.position.set(x, y, z);
    root.add(m);
    spots.push(m);
  }

  const mk = (parent, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); return o; };
  const anchors = {
    head: mk(headPivot, 0, 0.8, 0),
    neck: mk(root, 0, 1.2, 0.55),
    beak: mk(headPivot, 0, 0.18, 0.74),
    back: mk(root, 0, 1.3, -0.5),
  };
  group.traverse(o => { if (o.isMesh) o.castShadow = true; });

  let mood = 'happy', sleeping = false, talking = 0, dirt = 0;
  let lookX = 0, lookY = 0, curX = 0, curY = 0, eyeOpen = 1;
  let action = null, actionT = 0, actionDur = 0;
  const DUR = { hop: 0.6, flap: 1.0, eat: 1.6, giggle: 1.2, nod: 0.8, shake: 0.8, dance: 2.4, pray: 3.0, wave: 1.2, spin: 1.0, sneeze: 1.0, surprise: 0.8, sad: 1.6 };

  return {
    group, anchors,
    hitParts: [body, head, beakTop, tail, ...wings.map(w => w.pivot.children[0]), ...feet],
    setMood(m) { mood = m; },
    setSleeping(on) { sleeping = !!on; },
    lookAt(nx, ny) { lookX = Math.max(-1, Math.min(1, nx)); lookY = Math.max(-1, Math.min(1, ny)); },
    play(a) { action = a; actionT = 0; actionDur = DUR[a] || 1; return actionDur; },
    setTalking(v) { talking = Math.max(0, Math.min(1, v || 0)); },
    setDirt(v) { dirt = Math.max(0, Math.min(1, v || 0)); },
    update(dt, t) {
      const k = Math.min(1, dt * 8);
      curX += (lookX - curX) * k; curY += (lookY - curY) * k;
      const breath = Math.sin(t * (sleeping ? 1.2 : 2.4)) * 0.02;
      root.scale.set(1 - breath * 0.5, 1 + breath, 1 - breath * 0.5);
      root.position.y = 0; root.rotation.set(0, 0, 0);
      let flap = 0.08 + Math.sin(t * 2) * 0.03, beak = talking * 0.35, headTilt = 0, headPitch = 0;
      if (mood === 'sad') headPitch = 0.25;
      if (mood === 'excited') flap += Math.abs(Math.sin(t * 10)) * 0.4;
      if (action) {
        actionT += dt;
        const p = Math.min(1, actionT / actionDur);
        const s = Math.sin(p * Math.PI);
        if (action === 'hop' || action === 'giggle' || action === 'surprise') root.position.y = s * 0.35;
        if (action === 'flap' || action === 'dance' || action === 'wave') flap += Math.abs(Math.sin(p * Math.PI * 6)) * 1.1;
        if (action === 'dance') { root.rotation.z = Math.sin(p * Math.PI * 4) * 0.15; root.position.y = Math.abs(Math.sin(p * Math.PI * 4)) * 0.15; }
        if (action === 'spin') root.rotation.y = p * Math.PI * 2;
        if (action === 'eat') { beak = Math.abs(Math.sin(p * Math.PI * 5)) * 0.4; headPitch = 0.2 * s; }
        if (action === 'nod') headPitch = Math.sin(p * Math.PI * 4) * 0.3;
        if (action === 'shake') headTilt = Math.sin(p * Math.PI * 4) * 0.4;
        if (action === 'pray' || action === 'sad') headPitch = 0.45 * s;
        if (action === 'sneeze') headPitch = -0.3 * s;
        if (p >= 1) action = null;
      }
      const wantOpen = sleeping || action === 'pray' ? 0.05 : (Math.sin(t * 0.9) > 0.985 ? 0.05 : 1);
      eyeOpen += (wantOpen - eyeOpen) * Math.min(1, dt * 18);
      for (const e of eyes) e.scale.set(1, Math.max(0.08, eyeOpen), 1);
      headPivot.rotation.set(headPitch + (sleeping ? 0.4 : -curY * 0.25), curX * 0.45 + headTilt, 0);
      for (const w of wings) w.pivot.rotation.z = w.s * flap;
      beakLow.rotation.x = Math.PI / 2 + beak;
      mud.opacity = dirt * 0.9;
    },
    dispose() {
      group.traverse(o => { if (o.isMesh) { o.geometry.dispose(); } });
      for (const m of [white, orange, dark, mud]) m.dispose();
    },
  };
}
