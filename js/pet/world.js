// Mundo 3D de la palomita: escena, cámara, luz, habitaciones, toques, efectos y accesorios.
//
//   const world = createWorld(canvas)
//   world.dove                         objeto Dove (js/pet/dove.js)
//   world.ROOMS / world.room           ids de habitaciones / habitación actual
//   world.setRoom(id, { instant }) → Promise      world.setLights(on) (dormitorio)      world.setCandle(on) (capilla)
//   world.start() / stop() / resize() / dispose() / setPaused(bool)
//   world.on(evento, fn) → off()       'tap' { part, x, y } · 'stroke' { part, x, y, dx, dy } · 'tapProp' { id }
//   world.project(nombre) → { x, y }   px CSS dentro del canvas: 'beak' | 'head' | 'body' | 'feet'
//   world.hitDove(x, y) → parte | null
//   world.fx.hearts(n) sparkles(n) crumbs() notes() stars() splash() confetti() · zzz(on) · foam(0..1) · shower(on)
//   world.wear(slot, id | null)        accesorios ('head' | 'neck' | 'beak')
//   world.stats() → { calls, triangles }
//   world.setGrowth(escala 0.5..1, { animate })   tamaño de la palomita (crece con su nivel)
//   world.startArrival() → Promise   escena de llegada en la jaulita (el niño toca para abrirla)
//   world.arrivalStage                 etapa de la llegada ('wait' = esperando el toque) o null
//   world.setBed(on, { instant })      la palomita se acuesta en su camita (dormitorio) y se tapa con la frazada
//   world.setDoveVisible(bool)         la palomita no está en este cuarto (p. ej. duerme en el dormitorio)
//   world.water(segundos)              abre la regadera un ratito (sin moverla)
//   Objetos que se arrastran (baño: 'shower' regadera, 'soap' jabón):
//     'grab' { id } · 'dragMove' { id, x, y, dist, part } · 'drop' { id, moved } · 'tapProp' { id } si solo se tocó
//     'wet' { amount, top } mientras el chorro moja a la palomita · 'waterStop' cuando se cierra el agua
import * as THREE from 'three';
import { createDove } from './dove.js';
import { buildRoom, ROOM_IDS, ROOM_LIGHT } from './rooms.js';
import { createAccessory } from './accessories.js';
import { createArrival } from './arrival.js';
import { sfx } from '../core/audio.js';

const MAX_SPRITES = 56;

export function createWorld(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0xcdeeff);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 0.5, 0.5, 40);
  const LOOK = new THREE.Vector3(0, 1.2, 0);
  camera.position.set(0, 2.65, 10.6);
  camera.lookAt(LOOK);

  const hemi = new THREE.HemisphereLight(0xffffff, 0xffe2c4, 1.85);
  const sun = new THREE.DirectionalLight(0xfff3df, 1.9);
  sun.position.set(2.6, 5.2, 4.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -3.2, right: 3.2, top: 4, bottom: -2.5, near: 0.5, far: 16 });
  sun.shadow.bias = -0.0006; sun.shadow.radius = 5;
  const rim = new THREE.DirectionalLight(0xcfe6ff, 0.9);
  rim.position.set(-3, 3, -4);
  scene.add(hemi, sun, rim);

  const dove = createDove(THREE);
  scene.add(dove.group);
  // Sombra de contacto suave bajo la palomita (la asienta en el piso aunque la sombra real caiga detrás).
  const blobTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 6, 64, 64, 62);
    gr.addColorStop(0, 'rgba(50,30,20,0.42)'); gr.addColorStop(0.6, 'rgba(50,30,20,0.18)'); gr.addColorStop(1, 'rgba(50,30,20,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.7), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.set(0, 0.012, 0.05); blob.renderOrder = 1;
  scene.add(blob);

  // ── Habitaciones (se construyen la primera vez que se visitan) ──
  const rooms = new Map();
  let room = null;
  function getRoom(id) {
    if (!rooms.has(id)) { const r = buildRoom(THREE, id); r.group.visible = false; scene.add(r.group); rooms.set(id, r); }
    return rooms.get(id);
  }
  const targetLight = { hemiSky: new THREE.Color(), hemiGround: new THREE.Color(), hemiI: 1.8, sun: new THREE.Color(), sunI: 1.9 };
  function aimLight(l, instant) {
    targetLight.hemiSky.set(l.hemi[0]); targetLight.hemiGround.set(l.hemi[1]); targetLight.hemiI = l.hemi[2];
    targetLight.sun.set(l.sun[0]); targetLight.sunI = l.sun[1];
    if (instant) stepLight(1);
  }
  function stepLight(k) {
    hemi.color.lerp(targetLight.hemiSky, k); hemi.groundColor.lerp(targetLight.hemiGround, k); hemi.intensity += (targetLight.hemiI - hemi.intensity) * k;
    sun.color.lerp(targetLight.sun, k); sun.intensity += (targetLight.sunI - sun.intensity) * k;
  }
  function showRoom(id, instant) {
    if (room) room.group.visible = false;
    room = getRoom(id);
    room.group.visible = true;
    aimLight(room.light, instant);
  }
  let switching = 0;
  function setRoom(id, { instant = false } = {}) {
    if (!ROOM_IDS.includes(id)) return Promise.resolve();
    if (room && room.id === id) return Promise.resolve();
    if (instant || !room) { showRoom(id, true); canvas.style.opacity = '1'; return Promise.resolve(); }
    const mine = ++switching;
    canvas.style.transition = 'opacity 0.16s';
    canvas.style.opacity = '0';
    return new Promise(res => setTimeout(() => {
      if (mine === switching) { showRoom(id, true); canvas.style.opacity = '1'; }
      setTimeout(res, 170);
    }, 170));
  }

  // ── Efectos con sprites reciclados ──
  const texCache = new Map();
  function spriteTex(key) {
    if (texCache.has(key)) return texCache.get(key);
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const em = ch => { g.font = '48px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 32, 35); };
    if (key === 'heart') em('❤️');
    else if (key === 'sparkle') em('✨');
    else if (key === 'note') em('🎵');
    else if (key === 'star') em('⭐');
    else if (key === 'z') { g.font = '900 50px "Baloo 2", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 8; g.strokeStyle = '#5a64b0'; g.strokeText('Z', 32, 34); g.fillStyle = '#fff'; g.fillText('Z', 32, 34); }
    else if (key === 'bubble') { g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.arc(32, 32, 26, 0, 6.2832); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 4; g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(22, 22, 6, 0, 6.2832); g.fill(); }
    else if (key === 'drop') { g.fillStyle = '#7fd0ff'; g.beginPath(); g.moveTo(32, 6); g.bezierCurveTo(52, 34, 48, 58, 32, 58); g.bezierCurveTo(16, 58, 12, 34, 32, 6); g.fill(); g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(26, 40, 4, 8, 0.3, 0, 6.2832); g.fill(); }
    else { g.fillStyle = '#fff'; g.beginPath(); g.arc(32, 32, 20, 0, 6.2832); g.fill(); }   // 'dot': se tiñe con el color del material
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    texCache.set(key, t);
    return t;
  }
  const fxGroup = new THREE.Group();
  scene.add(fxGroup);
  const pool = [], live = [];
  function spawn(key, x, y, z, o = {}) {
    let s = pool.pop();
    if (!s) {
      if (live.length >= MAX_SPRITES) return null;
      s = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false }));
      fxGroup.add(s);
    }
    s.material.map = spriteTex(key); s.material.color.set(o.color ?? 0xffffff); s.material.opacity = 1; s.material.rotation = o.rot ?? 0;
    s.material.needsUpdate = true;
    s.position.set(x, y, z); s.visible = true;
    const p = { s, vx: o.vx ?? 0, vy: o.vy ?? 0.8, vz: o.vz ?? 0, grav: o.grav ?? 0, life: o.life ?? 1.2, max: o.life ?? 1.2, s0: o.s0 ?? 0.25, s1: o.s1 ?? (o.s0 ?? 0.25), spin: o.spin ?? 0, wob: o.wob ?? 0, ph: Math.random() * 6.28 };
    s.scale.setScalar(p.s0);
    live.push(p);
    return p;
  }
  function stepFx(dt, t) {
    for (let i = live.length - 1; i >= 0; i--) {
      const p = live[i];
      p.life -= dt;
      if (p.life <= 0) { p.s.visible = false; pool.push(p.s); live.splice(i, 1); continue; }
      const k = 1 - p.life / p.max;
      p.vy -= p.grav * dt;
      p.s.position.x += (p.vx + Math.sin(t * 3 + p.ph) * p.wob) * dt; p.s.position.y += p.vy * dt; p.s.position.z += p.vz * dt;
      p.s.scale.setScalar(p.s0 + (p.s1 - p.s0) * k);
      p.s.material.rotation += p.spin * dt;
      p.s.material.opacity = Math.min(1, (1 - k) * 2.2);
    }
  }
  const R = (a, b) => a + Math.random() * (b - a);
  const around = () => [R(-0.75, 0.75), R(0.9, 1.9), R(0.5, 0.9)];
  let zzzOn = false, zzzT = 0, showerOn = false, showerT = 0, foamLevel = 0;
  const foamBubbles = [];
  const FOAM_SPOTS = [[0.35, 0.75, 0.6], [-0.4, 0.6, 0.55], [0, 0.95, 0.68], [0.5, 1.15, 0.35], [-0.5, 1.2, 0.3], [0.2, 1.75, 0.45], [-0.25, 1.85, 0.35], [0, 2.05, 0.1],
    [0.62, 0.8, 0.1], [-0.62, 0.85, 0.05], [0.3, 0.4, 0.6], [-0.2, 0.35, 0.62], [0.45, 1.55, 0.3], [-0.45, 1.5, 0.35], [0.1, 1.3, 0.62], [-0.1, 0.6, 0.72]];
  const fx = {
    hearts(n = 5) { for (let i = 0; i < n; i++) { const [x, y, z] = around(); spawn('heart', x, y, z, { vy: R(0.6, 1.2), wob: 0.5, life: R(1, 1.6), s0: 0.12, s1: R(0.26, 0.36) }); } },
    sparkles(n = 10) { for (let i = 0; i < n; i++) { const [x, y, z] = around(); spawn('sparkle', x * 1.2, y, z, { vy: R(0.1, 0.5), life: R(0.6, 1.1), s0: R(0.22, 0.34), s1: 0.05, spin: R(-2, 2) }); } },
    crumbs() { const b = beakPos(); for (let i = 0; i < 8; i++) spawn('dot', b.x + R(-0.1, 0.1), b.y, b.z + 0.1, { color: [0xe9b872, 0xd9a45f, 0xfff0c9][i % 3], vx: R(-0.8, 0.8), vy: R(0.5, 1.6), grav: 6, life: 0.7, s0: R(0.05, 0.09), s1: 0.03 }); },
    notes() { for (let i = 0; i < 5; i++) spawn('note', R(-0.9, 0.9), R(1.5, 2.1), 0.7, { vy: R(0.5, 0.9), wob: 0.6, life: R(1.1, 1.6), s0: 0.2, s1: 0.3, color: [0xffffff, 0xffd95e, 0xff9db5][i % 3] }); },
    stars() { for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.28; spawn('star', Math.cos(a) * 0.4, 1.3 + Math.sin(a) * 0.4, 0.9, { vx: Math.cos(a) * 1.5, vy: Math.sin(a) * 1.5, life: 0.8, s0: 0.3, s1: 0.1, spin: 3 }); } },
    splash() { for (let i = 0; i < 12; i++) spawn('drop', R(-0.5, 0.5), R(0.8, 1.6), 0.8, { vx: R(-1.6, 1.6), vy: R(1, 2.6), grav: 7, life: 0.8, s0: 0.14, s1: 0.08 }); },
    confetti() { for (let i = 0; i < 26; i++) spawn('dot', R(-1.2, 1.2), R(3, 3.8), R(0.3, 1), { color: [0xff8a5c, 0xffd95e, 0x6cc070, 0x7cc8f5, 0xc9a3ff, 0xff9db5][i % 6], vx: R(-0.4, 0.4), vy: R(-0.6, 0.4), grav: 1.6, wob: 0.8, life: R(1.6, 2.4), s0: R(0.07, 0.12) }); },
    zzz(on) { zzzOn = !!on; zzzT = 0.3; },
    shower(on) { showerOn = !!on; },
    foam(level) {
      foamLevel = Math.max(0, Math.min(1, level || 0));
      const want = Math.round(foamLevel * FOAM_SPOTS.length);
      while (foamBubbles.length < want) {
        const [x, y, z] = FOAM_SPOTS[foamBubbles.length];
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: spriteTex('bubble'), transparent: true, depthWrite: false }));
        s.position.set(x, y, z); s.userData.base = R(0.24, 0.42); s.userData.ph = R(0, 6.28);
        dove.group.add(s); foamBubbles.push(s);
      }
      while (foamBubbles.length > want) { const s = foamBubbles.pop(); dove.group.remove(s); s.material.dispose(); }
    },
  };
  function beakPos() { return dove.anchors.beak.getWorldPosition(new THREE.Vector3()); }

  // ── Accesorios ──
  const wearing = {};
  function wear(slot, id) {
    const anchor = dove.anchors[slot];
    if (!anchor) return;
    if (wearing[slot]) { anchor.remove(wearing[slot]); wearing[slot].userData.dispose?.(); wearing[slot] = null; }
    if (!id) return;
    const acc = createAccessory(THREE, id);
    if (acc) { anchor.add(acc); wearing[slot] = acc; }
  }

  // ── Proyección y toques ──
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let cssW = 1, cssH = 1;
  function toNdc(x, y) { ndc.set((x / cssW) * 2 - 1, -(y / cssH) * 2 + 1); return ndc; }
  function project(name) {
    const v = new THREE.Vector3();
    if (name === 'beak') dove.anchors.beak.getWorldPosition(v);
    else if (name === 'head') dove.anchors.head.getWorldPosition(v);
    else if (name === 'feet') v.set(0, 0.02, 0.3);
    else v.set(0, 0.95, 0.6);
    v.project(camera);
    return { x: (v.x * 0.5 + 0.5) * cssW, y: (-v.y * 0.5 + 0.5) * cssH };
  }
  function hitDove(x, y) {
    ray.setFromCamera(toNdc(x, y), camera);
    const hits = ray.intersectObjects(dove.hitParts, false);
    return hits.length ? hits[0].object.userData.part : null;
  }
  function hitProp(x, y) {
    if (!room) return null;
    ray.setFromCamera(toNdc(x, y), camera);
    const hits = ray.intersectObjects(room.props, true);
    for (const h of hits) { for (let o = h.object; o; o = o.parent) if (o.userData.prop) return o.userData.prop; }
    return null;
  }
  const listeners = new Map();
  function on(evt, fn) { if (!listeners.has(evt)) listeners.set(evt, new Set()); listeners.get(evt).add(fn); return () => listeners.get(evt)?.delete(fn); }
  function emit(evt, data) { for (const fn of listeners.get(evt) || []) { try { fn(data); } catch (e) { console.error(e); } } }

  const ptr = { id: null, x0: 0, y0: 0, x: 0, y: 0, t0: 0, moved: 0, part: null, drag: null };
  // ── Objetos que se arrastran (regadera y jabón del baño) ──
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.75);   // z = 0.75: delante de la palomita
  const dragHit = new THREE.Vector3();
  const draggables = () => (room && room.draggables) || [];
  function hitDrag(x, y) {
    const list = draggables();
    if (!list.length) return null;
    ray.setFromCamera(toNdc(x, y), camera);
    const hits = ray.intersectObjects(list.map(d => d.obj), true);
    if (!hits.length) return null;
    for (let o = hits[0].object; o; o = o.parent) { const d = list.find(q => q.obj === o); if (d) return d; }
    return null;
  }
  function aimDrag(d, x, y) {
    ray.setFromCamera(toNdc(x, y), camera);
    if (!ray.ray.intersectPlane(dragPlane, dragHit)) return;
    d.target = d.target || new THREE.Vector3();
    d.target.set(Math.max(-1.7, Math.min(1.7, dragHit.x)), Math.max(0.12, Math.min(3.7, dragHit.y + (d.lift || 0))), 0.75);
  }
  let lookReset = 0;
  const local = e => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  function lookAtPointer(x, y) {
    const h = project('head');
    dove.lookAt(Math.max(-1, Math.min(1, (x - h.x) / (cssW * 0.45))), Math.max(-1, Math.min(1, -(y - h.y) / (cssH * 0.3))));
    lookReset = 1.6;
  }
  // Suelta lo que se está arrastrando (siempre avisa con 'drop', aunque esté en pausa o se pierda el dedo).
  function releaseDrag() {
    const d = ptr.drag; ptr.drag = null;
    if (!d) return false;
    d.held = false; d.target = null;
    emit('drop', { id: d.id, moved: ptr.moved });
    return true;
  }
  function onDown(e) {
    if (paused) return;
    if (ptr.drag && ptr.id !== null && ptr.id !== e.pointerId) return;   // otro dedo mientras se arrastra: se ignora
    const [x, y] = local(e);
    const d = arrival ? null : hitDrag(x, y);
    Object.assign(ptr, { id: e.pointerId, x0: x, y0: y, x, y, t0: performance.now(), moved: 0, part: d ? null : hitDove(x, y), drag: d });
    if (d) { d.held = true; d.target = null; emit('grab', { id: d.id }); }
    try { canvas.setPointerCapture(e.pointerId); } catch { /* sin captura */ }
    lookAtPointer(x, y);
  }
  function onMove(e) {
    if (paused) return;
    const [x, y] = local(e);
    lookAtPointer(x, y);
    if (ptr.id !== e.pointerId) return;
    const dx = x - ptr.x, dy = y - ptr.y;
    ptr.moved += Math.hypot(dx, dy); ptr.x = x; ptr.y = y;
    if (ptr.drag) {
      if (ptr.moved > 10) {
        aimDrag(ptr.drag, x, y);
        // lo que toca la palomita es el objeto (que va un poquito más arriba que el dedo), no el dedo
        let part = null;
        if (dove.group.visible && ptr.drag.target) {
          const v = ptr.drag.target.clone().project(camera);
          part = hitDove((v.x * 0.5 + 0.5) * cssW, (-v.y * 0.5 + 0.5) * cssH) || hitDove(x, y);
        }
        emit('dragMove', { id: ptr.drag.id, x, y, dist: Math.hypot(dx, dy), part });
      }
      return;
    }
    if (ptr.moved > 10) { const part = hitDove(x, y); if (part) emit('stroke', { part, x, y, dx, dy }); }
  }
  function onUp(e) {
    if (ptr.id !== e.pointerId) return;
    ptr.id = null;
    if (ptr.drag) {
      const id = ptr.drag.id;
      releaseDrag();
      if (!paused && e.type === 'pointerup' && ptr.moved <= 10) emit('tapProp', { id });
      return;
    }
    if (paused) return;
    const [x, y] = local(e);
    if (arrival) { if (arrival.stage === 'wait') arrival.open(); return; }
    if (ptr.moved <= 10 && performance.now() - ptr.t0 < 600) {
      const part = hitDove(x, y);
      if (part) emit('tap', { part, x, y });
      else { const id = hitProp(x, y); if (id) { room.poke(id); emit('tapProp', { id }); } }
    }
  }
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  const onLost = e => { if (ptr.id === e.pointerId) onUp(e); };
  canvas.addEventListener('lostpointercapture', onLost);

  // ── Tamaño y bucle ──
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (w < 2 || h < 2) return;
    cssW = w; cssH = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // En pantallas muy angostas se aleja un poco para que quepan las alas abiertas.
    camera.position.z = 10.6 + Math.max(0, 0.5 - w / h) * 9;
    camera.lookAt(LOOK);
    camera.updateProjectionMatrix();
    if (!running) renderer.render(scene, camera);
  }
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
  ro?.observe(canvas);

  let running = false, paused = false, raf = 0, last = 0, time = 0;
  // Crecimiento y llegada
  let arrival = null, growthNow = 1, growthFrom = 1, growthTo = 1, growthT = 1;
  function applyGrowth(v) { growthNow = v; dove.group.scale.setScalar(v); blob.scale.setScalar(0.4 + v * 0.6); }
  // ── Arrastre suave y regreso a su lugar ──
  const tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler();
  function stepDrag(dt) {
    const k = 1 - Math.exp(-dt * 16), kb = 1 - Math.exp(-dt * 7);
    for (const d of draggables()) {
      const o = d.obj;
      if (d.held && d.target) {
        const vx = (d.target.x - o.position.x);
        o.position.lerp(d.target, k);
        // la regadera se endereza (chorro hacia abajo) y se ladea un poquito al moverla
        tmpE.set(0.1, 0, Math.max(-0.5, Math.min(0.5, -vx * 1.6)));
        tmpQ.setFromEuler(tmpE); o.quaternion.slerp(tmpQ, k);
      } else if (!d.held) {
        o.position.lerp(d.home, kb);
        tmpQ.setFromEuler(d.homeRot); o.quaternion.slerp(tmpQ, kb);
      }
    }
  }
  // ── Agua de la regadera ──
  let waterTimer = 0, waterWas = false, wetAcc = 0, splashT = 0, soundT = 0, dropT = 0;
  const nozzle = new THREE.Vector3(), wdir = new THREE.Vector3(), probe = new THREE.Vector3(), hitAt = new THREE.Vector3();
  function stepWater(dt) {
    const sh = draggables().find(d => d.id === 'shower');
    if (waterTimer > 0) waterTimer -= dt;
    const on = !!sh && (sh.held || waterTimer > 0);
    if (!on) { if (waterWas) { waterWas = false; emit('waterStop', {}); } return; }
    waterWas = true;
    nozzle.copy(sh.nozzle).applyMatrix4(sh.obj.matrixWorld);
    wdir.set(0, -1, 0).applyQuaternion(sh.obj.quaternion).normalize();
    dropT -= dt;
    while (dropT <= 0) {
      dropT += 0.018;
      const a = Math.random() * 6.2832, r = Math.sqrt(Math.random()) * 0.17;
      spawn('drop', nozzle.x + Math.cos(a) * r, nozzle.y, nozzle.z + Math.sin(a) * r,
        { vx: wdir.x * 4.6 + R(-0.25, 0.25), vy: wdir.y * 4.6, vz: wdir.z * 4.6 + R(-0.2, 0.2), grav: 5, life: 0.75, s0: 0.1, s1: 0.09 });
    }
    soundT -= dt;
    if (soundT <= 0) { soundT = 0.5; sfx('splash'); }
    // ¿El chorro le cae a la palomita? (elipsoide aproximado del cuerpo)
    if (!dove.group.visible || bedK > 0.05) return;
    const g = growthNow, c = dove.group.position;
    let hit = false;
    for (let t = 0.1; t < 4.2; t += 0.08) {
      probe.copy(wdir).multiplyScalar(t).add(nozzle);
      // Solo x e y: la regadera siempre va delante de la palomita y el chorro se ve encima de ella,
      // así que cuenta lo que el niño ve (con la profundidad, la palomita pequeñita nunca se mojaba).
      const ex = (probe.x - c.x) / (0.78 * g), ey = (probe.y - (c.y + 1.0 * g)) / (1.05 * g);
      if (ex * ex + ey * ey < 1) { hit = true; hitAt.copy(probe); break; }
    }
    if (!hit) return;
    wetAcc += dt;
    if (wetAcc >= 0.1) { emit('wet', { amount: wetAcc, top: hitAt.y > c.y + 1.4 * g }); wetAcc = 0; }
    splashT -= dt;
    if (splashT <= 0) {
      splashT = 0.05;
      for (let i = 0; i < 2; i++) spawn('drop', hitAt.x + R(-0.15, 0.15), hitAt.y, hitAt.z + 0.1, { vx: R(-1.4, 1.4), vy: R(0.6, 1.6), grav: 7, life: 0.45, s0: 0.07, s1: 0.04 });
    }
  }
  // ── Camita ──
  let bedOn = false, bedK = 0;
  const bedFrom = new THREE.Vector3();
  function stepBed(dt) {
    const target = bedOn ? 1 : 0;
    if (bedK === target) return;
    bedK = bedOn ? Math.min(1, bedK + dt * 1.3) : Math.max(0, bedK - dt * 1.6);
    placeInBed();
  }
  function placeInBed() {
    const r = getRoom('dormitorio');
    const spot = r.bed ? r.bed.spot : bedFrom;
    const k = bedK * bedK * (3 - 2 * bedK);
    dove.group.position.set(spot.x * k, spot.y * k + Math.sin(Math.PI * bedK) * 0.7, spot.z * k);
    blob.visible = dove.group.visible && bedK < 0.05;
    if (r.bed) r.bed.tuck(bedOn && bedK >= 0.92, growthNow);
  }
  function tick(dt) {
    time += dt;
    if (growthT < 1) {
      growthT = Math.min(1, growthT + dt / 1.6);
      const k = growthT < 1 ? 1 - Math.pow(1 - growthT, 3) + Math.sin(growthT * Math.PI * 3) * 0.04 * (1 - growthT) : 1;
      applyGrowth(growthFrom + (growthTo - growthFrom) * k);
    }
    if (arrival) {
      arrival.update(dt);
      if (arrival.stage === 'done') { arrival.dispose(); arrival = null; }
    }
    stepLight(Math.min(1, dt * 5));
    if (lookReset > 0) { lookReset -= dt; if (lookReset <= 0) dove.lookAt(0, 0); }
    dove.update(dt, time);
    room?.update(dt, time);
    if (zzzOn && dove.group.visible) { zzzT -= dt; if (zzzT <= 0) { zzzT = 1.1; const h = dove.anchors.head.getWorldPosition(new THREE.Vector3()); spawn('z', h.x + 0.35, h.y + 0.05, h.z + 0.3, { vx: 0.25, vy: 0.5, wob: 0.25, life: 2.2, s0: 0.14, s1: 0.4 }); } }
    if (showerOn) { showerT -= dt; while (showerT <= 0) { showerT += 0.03; spawn('drop', R(-0.7, 0.7), R(3.1, 3.5), R(0, 0.7), { vy: -5.5, grav: 4, life: 0.55, s0: 0.11, s1: 0.11 }); } }
    stepDrag(dt);
    stepWater(dt);
    stepBed(dt);
    for (const b of foamBubbles) b.scale.setScalar(b.userData.base * (1 + Math.sin(time * 3 + b.userData.ph) * 0.08));
    stepFx(dt, time);
  }
  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (document.hidden || paused) { last = now; return; }
    let dt = (now - last) / 1000; last = now;
    if (!(dt > 0)) dt = 0.001;
    tick(Math.min(dt, 0.05));
    renderer.render(scene, camera);
  }

  showRoom('sala', true);
  resize();

  return {
    dove, fx, on, project, hitDove, wear, setRoom, resize,
    ROOMS: ROOM_IDS,
    get room() { return room ? room.id : null; },
    setLights(on) { const r = getRoom('dormitorio'); r.setLights(on); if (room === r) aimLight(r.light, false); },
    setCandle(on) { getRoom('capilla').setCandle(on); },
    setBed(on, { instant = false } = {}) { bedOn = !!on; if (instant) { bedK = bedOn ? 1 : 0; placeInBed(); } },
    setDoveVisible(v) { dove.group.visible = !!v; blob.visible = !!v && bedK < 0.05; },
    get doveVisible() { return dove.group.visible; },
    water(seconds = 3) { waterTimer = Math.max(waterTimer, seconds); },
    // Dónde está en pantalla un objeto que se arrastra (px CSS), para pistas y pruebas.
    screenOf(id) {
      const d = draggables().find(q => q.id === id);
      if (!d) return null;
      const v = d.obj.getWorldPosition(new THREE.Vector3()).project(camera);
      return { x: (v.x * 0.5 + 0.5) * cssW, y: (-v.y * 0.5 + 0.5) * cssH };
    },
    start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); },
    stop() { running = false; cancelAnimationFrame(raf); ptr.id = null; releaseDrag(); waterTimer = 0; },
    setPaused(v) { paused = !!v; },
    setGrowth(v, { animate = false } = {}) {
      v = Math.max(0.4, Math.min(1, v));
      if (!animate) { growthT = 1; applyGrowth(v); return; }
      growthFrom = growthNow; growthTo = v; growthT = 0;
      fx.sparkles(14); fx.confetti(); sfx('grow');
    },
    get growth() { return growthNow; },
    get arrivalStage() { return arrival ? arrival.stage : null; },
    openArrival() { arrival?.open(); },
    startArrival() {
      return new Promise(resolve => {
        if (arrival) arrival.skip();
        showRoom('sala', true);
        arrival = createArrival(THREE, scene, dove, { sfx, fx });
        arrival.onDone(() => resolve());
      });
    },
    // Avanza la simulación sin reloj real (pruebas y capturas).
    simulate(seconds, step = 1 / 60) { for (let i = 0; i < Math.round(seconds / step); i++) tick(step); renderer.render(scene, camera); },
    // Foto de la escena (JPEG, ancho máximo `width`). Se dibuja un cuadro nuevo y se copia en el acto.
    snapshot(width = 480) {
      renderer.render(scene, camera);
      const src = renderer.domElement, k = Math.min(1, width / src.width);
      const c = document.createElement('canvas'); c.width = Math.round(src.width * k); c.height = Math.round(src.height * k);
      c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
      return c;
    },
    stats() { return { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures }; },
    dispose() {
      running = false; cancelAnimationFrame(raf); ro?.disconnect();
      canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp); canvas.removeEventListener('pointercancel', onUp); canvas.removeEventListener('lostpointercapture', onLost);
      for (const s of Object.keys(wearing)) wear(s, null);
      fx.foam(0);
      for (const r of rooms.values()) r.dispose();
      for (const t of texCache.values()) t.dispose();
      for (const p of live) p.s.material.dispose();
      for (const s of pool) s.material.dispose();
      blob.geometry.dispose(); blob.material.dispose(); blobTex.dispose();
      dove.dispose();
      renderer.dispose();
    },
  };
}
