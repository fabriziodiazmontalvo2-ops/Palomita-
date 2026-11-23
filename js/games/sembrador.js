// El sembrador (Mateo 13, 1-9) — minijuego de puntería y ritmo.
//
// El terreno pasa por debajo como una cinta con cuatro tipos de suelo, igual que en la parábola:
//   camino (los pajaritos se comen la semilla) · piedras (el brote se seca) · espinas (lo ahogan) · tierra buena (da espigas).
// El niño toca para soltar una semilla y tiene que calcular que caiga en la tierra buena.
export default {
  id: 'sembrador',
  create(api) {
    const { kit } = api;
    const { PAL, clamp, lerp, ease } = kit;
    const W = api.W;
    const TYPES = ['buena', 'camino', 'piedras', 'espinas'];
    const FALL = 0.62;                 // segundos que tarda en caer la semilla (igual en todas las pantallas)

    const BAG = 26;                    // semillas de la bolsa: hay que apuntar, no soltar a lo loco
    let t = 0, cool = 0, throwT = 9, started = false, seedsLeft = BAG, endT = 0;
    const segs = [];                   // { x, w, type, items: [{ dx, kind, t }] }
    const seeds = [];                  // { x, y, t }
    const birds = [];                  // { x, y, t }
    const L = { strip: 0, stripH: 0, sowerX: W / 2, sowerY: 0, handY: 0 };

    function layout() {
      L.stripH = clamp(api.H * 0.17, 84, 120);
      L.strip = api.bottom - L.stripH + 6;
      L.sowerY = api.top + clamp(api.H * 0.2, 96, 150);
      L.handX = L.sowerX + 24;
      L.handY = L.sowerY - 34;
    }
    layout();

    const speed = () => 62 + Math.min(api.time, 60) * 1.15;
    function nextType(prev) {
      // Tierra buena frecuente al principio; nunca dos tramos iguales seguidos.
      const pGood = api.time < 15 ? 0.46 : api.time < 35 ? 0.36 : 0.3;
      if (prev !== 'buena' && api.rand() < pGood) return 'buena';
      let ty;
      do { ty = api.pick(TYPES.slice(1)); } while (ty === prev);
      return ty;
    }
    function addSeg() {
      const last = segs[segs.length - 1];
      const type = last ? nextType(last.type) : 'camino';
      const easy = clamp(1 - api.time / 55, 0, 1);
      const w = type === 'buena' ? api.randRange(74, 96) + easy * 46 : api.randRange(70, 110);
      segs.push({ x: last ? last.x + last.w : -20, w, type, items: [] });
    }
    while (!segs.length || segs[segs.length - 1].x + segs[segs.length - 1].w < W + 160) addSeg();
    api.hint('Toca para soltar la semilla en la tierra buena', 3200);

    function drop() {
      if (cool > 0 || seedsLeft <= 0) return;
      cool = 0.38; throwT = 0; started = true; seedsLeft--;
      seeds.push({ x: L.handX, y: L.handY, t: 0 });
      api.sfx('drop');
    }
    function land(seed) {
      const seg = segs.find(s => seed.x >= s.x && seed.x < s.x + s.w);
      if (!seg) return;
      const dx = seed.x - seg.x;
      const gy = L.strip + 16;
      if (seg.type === 'buena') {
        seg.items.push({ dx, kind: 'wheat', t: 0 });
        api.addScore(1, seed.x, L.strip - 26);
        api.floatText(seed.x, L.strip - 52, api.pick(['¡×30!', '¡×60!', '¡×100!']), { color: '#fff3b0', size: 18 });
        api.sfx('grow'); api.burst(seed.x, gy, { color: PAL.sun, count: 9, speed: 90 });
      } else if (seg.type === 'camino') {
        seg.items.push({ dx, kind: 'seed', t: 0 });
        birds.push({ seg, dx, t: 0 });
        api.sfx('chirp');
      } else if (seg.type === 'piedras') {
        seg.items.push({ dx, kind: 'wilt', t: 0 });
        api.sfx('tick');
      } else {
        seg.items.push({ dx, kind: 'choke', t: 0 });
        api.sfx('wrong');
      }
    }

    // ── Dibujo de cada tipo de suelo ──
    function drawSeg(g, s) {
      const y = L.strip, h = L.stripH + 30;
      const colors = { buena: ['#7a4a2a', '#5f3920'], camino: ['#e3cfa6', '#d2bb8c'], piedras: ['#b9bfc9', '#9aa2ae'], espinas: ['#8a9a62', '#6e7f4c'] }[s.type];
      g.fillStyle = colors[0]; g.fillRect(s.x, y, s.w + 1, h);
      g.fillStyle = colors[1]; g.fillRect(s.x, y + 26, s.w + 1, h);
      if (s.type === 'buena') {
        g.fillStyle = '#8f5a34';
        for (let x = 10; x < s.w - 6; x += 18) kit.fillRR(g, s.x + x, y + 9, 10, 5, 2.5, '#96623a');
        kit.fillRR(g, s.x, y - 3, s.w + 1, 7, 3, '#9a6a40');
      } else if (s.type === 'camino') {
        for (let x = 14; x < s.w - 8; x += 26) { kit.ellipse(g, s.x + x, y + 12 + (x % 3) * 3, 5, 2.6, '#c9b183'); kit.ellipse(g, s.x + x + 9, y + 20, 4, 2.2, '#c9b183'); }
        kit.fillRR(g, s.x, y - 2, s.w + 1, 5, 2, '#eedcb6');
      } else if (s.type === 'piedras') {
        for (let x = 16; x < s.w - 8; x += 30) kit.rock(g, s.x + x, y + 14 + (x % 2) * 6, 0.62, x % 4 ? PAL.stone : PAL.stoneDeep);
        kit.fillRR(g, s.x, y - 2, s.w + 1, 5, 2, '#cfd4dc');
      } else {
        for (let x = 14; x < s.w - 4; x += 22) thorn(g, s.x + x, y + 8, 1);
        kit.fillRR(g, s.x, y - 2, s.w + 1, 5, 2, '#9cab72');
      }
      for (const it of s.items) drawItem(g, s.x + it.dx, y, it);
    }
    function thorn(g, x, y, s) {
      g.save(); g.strokeStyle = '#4f6a3a'; g.lineWidth = 2.4 * s; g.lineCap = 'round';
      for (const a of [-0.9, -0.3, 0.3, 0.9]) { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.sin(a) * 9 * s, y - 12 * s, x + Math.sin(a) * 16 * s, y - 19 * s); g.stroke(); }
      g.fillStyle = '#b07ab8'; g.beginPath(); g.arc(x, y - 19 * s, 3 * s, 0, 6.28); g.fill();
      g.restore();
    }
    function wheat(g, x, y, k, wither = 0) {
      // k = 0..1 crecimiento; wither = 0..1 marchito
      const h = 44 * k;
      g.save(); g.translate(x, y); g.rotate(wither * 0.9);
      g.strokeStyle = wither > 0.3 ? '#b59a5a' : '#7fb24a'; g.lineWidth = 2.6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -h); g.stroke();
      if (k > 0.55) {
        g.fillStyle = wither > 0.3 ? '#c9a857' : PAL.sun;
        const n = Math.round(lerp(0, 4, (k - 0.55) / 0.45));
        for (let i = 0; i < n; i++) for (const d of [-1, 1]) { g.beginPath(); g.ellipse(d * 3.4, -h + 2 + i * 5.5, 2.8, 4.2, d * 0.5, 0, 6.28); g.fill(); }
        g.beginPath(); g.ellipse(0, -h - 3, 2.6, 4.4, 0, 0, 6.28); g.fill();
      } else if (k > 0.1) {
        g.fillStyle = '#8fd16a'; g.beginPath(); g.ellipse(-4, -h, 4.5, 2.4, -0.5, 0, 6.28); g.ellipse(4, -h, 4.5, 2.4, 0.5, 0, 6.28); g.fill();
      }
      g.restore();
    }
    function drawItem(g, x, y, it) {
      if (it.kind === 'wheat') wheat(g, x, y + 2, ease.outBack(clamp(it.t / 0.8)));
      else if (it.kind === 'seed') { if (it.t < 0.7) kit.seed(g, x, y + 2, 5); }
      else if (it.kind === 'wilt') {
        const grow = clamp(it.t / 0.35), dry = clamp((it.t - 0.6) / 0.6);
        if (it.t < 1.6) { g.save(); g.globalAlpha = 1 - clamp((it.t - 1.2) / 0.4); wheat(g, x, y + 2, grow * 0.45, dry); g.restore(); }
        if (it.t > 0.5 && it.t < 1.4) kit.emoji(g, '☀️', x + 12, y - 30, 14, { alpha: 0.9 });
      } else if (it.kind === 'choke') {
        const k = clamp(it.t / 0.5);
        if (it.t < 1.2) { g.save(); g.globalAlpha = 1 - clamp((it.t - 0.8) / 0.4); wheat(g, x, y + 2, 0.3 * (1 - k * 0.5), k * 0.6); thorn(g, x - 6, y + 4, 0.8 + k * 0.5); thorn(g, x + 7, y + 4, 0.8 + k * 0.5); g.restore(); }
      }
    }

    return {
      update(dt) {
        t += dt;
        cool -= dt; throwT += dt;
        const v = speed() * dt;
        for (const s of segs) { s.x -= v; for (const it of s.items) it.t += dt; }
        while (segs.length && segs[0].x + segs[0].w < -40) segs.shift();
        while (segs[segs.length - 1].x + segs[segs.length - 1].w < W + 160) addSeg();
        for (let i = seeds.length - 1; i >= 0; i--) {
          const s = seeds[i];
          s.t += dt;
          const k = clamp(s.t / FALL);
          s.y = lerp(L.handY, L.strip + 4, k * k);
          if (k >= 1) { seeds.splice(i, 1); land(s); }
        }
        for (let i = birds.length - 1; i >= 0; i--) {
          const b = birds[i];
          b.t += dt;
          if (b.t > 0.55 && !b.ate) { b.ate = true; b.seg.items = b.seg.items.filter(it => !(it.kind === 'seed' && it.dx === b.dx)); api.floatText(b.seg.x + b.dx, L.strip - 30, '¡Se la comió!', { color: '#fff', size: 15 }); }
          if (b.t > 1.5) birds.splice(i, 1);
        }
        if (api.keys.has('action') && cool <= 0) drop();
        // Sin semillas en la bolsa ni en el aire: termina la siembra.
        if (seedsLeft <= 0 && !seeds.length) { endT += dt; if (endT > 1.6) api.end({}); }
      },
      draw(g) {
        const H = api.H;
        kit.sky(g, W, H, 'day');
        kit.sun(g, 300, api.top + 46, 24, t);
        kit.cloud(g, ((t * 7) % (W + 120)) - 60, api.top + 34, 0.9, 0.95);
        kit.cloud(g, ((t * 4 + 200) % (W + 140)) - 70, api.top + 84, 0.7, 0.8);
        kit.hills(g, W, H, L.strip - 60, 20, '#bfe3a0', t * 5, 0.011);
        kit.hills(g, W, H, L.strip - 28, 14, PAL.leafLight, t * 9 + 90, 0.016);
        // la loma donde está el sembrador
        kit.fillRR(g, -30, L.sowerY + 22, L.sowerX + 64, 30, 14, '#a9744a');
        kit.fillRR(g, -30, L.sowerY + 36, L.sowerX + 50, 22, 11, '#96643a');
        kit.fillRR(g, -30, L.sowerY + 8, L.sowerX + 70, 22, 11, PAL.leaf);
        kit.fillRR(g, -30, L.sowerY + 8, L.sowerX + 70, 8, 4, PAL.leafLight);
        kit.tree(g, 40, L.sowerY + 12, 0.8); kit.bush(g, 96, L.sowerY + 12, 0.6);
        // guía de caída
        g.save(); g.setLineDash([3, 7]); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(L.handX, L.handY + 8); g.lineTo(L.handX, L.strip - 4); g.stroke(); g.restore();
        kit.circle(g, L.handX, L.strip - 2, 6 + Math.sin(t * 5) * 1.5, null, 'rgba(255,255,255,0.9)', 2);
        // terreno
        for (const s of segs) if (s.x < W + 2 && s.x + s.w > -2) drawSeg(g, s);
        // pajaritos que bajan al camino
        for (const b of birds) {
          const k = clamp(b.t / 0.5), out = clamp((b.t - 0.8) / 0.7);
          const bx = b.seg.x + b.dx + lerp(60, 6, ease.outCubic(k)) + out * 90, by = lerp(L.strip - 90, L.strip - 6, ease.outCubic(k)) - out * 110;
          kit.emoji(g, '🐦', bx, by, 22, { flip: true });
        }
        // semillas cayendo
        for (const s of seeds) kit.seed(g, s.x, s.y, 5.5, s.t * 8);
        // sembrador con su bolsa
        const reach = throwT < 0.3;
        kit.person(g, L.sowerX, L.sowerY + 12, 1.25, { robe: '#e9c46a', sash: '#b5651d', beard: true, hair: '#5a3b28', arms: reach ? 'reach' : 'down', t });
        kit.fillRR(g, L.sowerX - 22, L.sowerY - 26, 15, 18, 6, '#c9a36a');
        kit.fillRR(g, L.sowerX - 21, L.sowerY - 29, 13, 5, 2, '#a9824e');
        // semillas que quedan en la bolsa
        kit.fillRR(g, W - 96, L.sowerY - 46, 84, 30, 15, 'rgba(255,255,255,0.92)');
        kit.seed(g, W - 78, L.sowerY - 31, 8);
        kit.text(g, `× ${seedsLeft}`, W - 44, L.sowerY - 30, { size: 17, color: seedsLeft <= 5 ? PAL.coralDeep : PAL.ink });
        if (!started && Math.sin(t * 4) > 0) kit.emoji(g, '👆', W / 2, (L.sowerY + L.strip) / 2 + 20, 30);
        // leyenda de los suelos (primeros segundos)
        if (api.time < 9) {
          const a = clamp((9 - api.time) / 1.5);
          g.save(); g.globalAlpha = a;
          kit.fillRR(g, 60, L.strip - 104, 240, 30, 15, 'rgba(255,255,255,0.92)');
          kit.fillRR(g, 74, L.strip - 97, 30, 16, 5, '#7a4a2a');
          kit.text(g, '= tierra buena', 112, L.strip - 88, { size: 15, align: 'left' });
          kit.emoji(g, '🌾', 258, L.strip - 89, 18);
          g.restore();
        }
      },
      pointerDown() { drop(); },
      keyDown(k) { if (k === 'action' || k === 'down') drop(); },
      resize() { layout(); },
    };
  },
};
