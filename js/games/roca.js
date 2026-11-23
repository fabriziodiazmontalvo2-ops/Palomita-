// La casa sobre la roca (Mateo 7, 24-27) — minijuego de apilar.
//
// Cada piso se desliza de lado a lado; al tocar, cae. Lo que sobresale se recorta. Cada cinco pisos llega una
// tormenta: la casa sobre la roca sigue firme, mientras que la casita sobre arena del fondo se la lleva el agua.
export default {
  id: 'roca',
  create(api) {
    const { kit } = api;
    const { PAL, clamp, lerp, ease } = kit;
    const W = api.W;
    const FH = 36, START_W = 118, MIN_W = 36;
    const COLORS = ['#ffb38a', '#ffd97a', '#a8dcf5', '#c7b5f2', '#ffb0c8', '#a8e0a0'];

    let t = 0, cam = 0, camTo = 0;
    const floors = [];                  // { x (centro), w, color, pop }
    const debris = [];                  // trozos recortados que caen
    let cur = null;                     // piso en movimiento { x, w, dir, state: 'slide' | 'fall', y, color }
    let storm = 0, stormCount = 0, sandGone = 0, sway = 0;
    const L = {};
    function layout() { L.rockTop = api.bottom - clamp(api.H * 0.16, 70, 110); L.rockW = 170; }
    layout();

    const topOf = () => (floors.length ? floors[floors.length - 1] : { x: W / 2, w: L.rockW - 30 });
    const stackY = n => L.rockTop - n * FH;                     // y (mundo) de la base del piso n
    function newBlock() {
      const w = floors.length ? floors[floors.length - 1].w : START_W;
      const dir = api.rand() < 0.5 ? 1 : -1;
      cur = { w, x: dir > 0 ? w / 2 + 6 : W - w / 2 - 6, dir, state: 'slide', y: 0, color: COLORS[floors.length % COLORS.length] };
    }
    newBlock();
    api.hint('Toca para soltar el piso', 2800);

    function release() {
      if (!cur || cur.state !== 'slide') return;
      cur.state = 'fall';
      cur.y = stackY(floors.length) - FH - 30;       // desde donde se desliza
      api.sfx('drop');
    }
    function settle() {
      const base = topOf();
      const l = Math.max(cur.x - cur.w / 2, base.x - base.w / 2), r = Math.min(cur.x + cur.w / 2, base.x + base.w / 2);
      const overlap = r - l;
      const y = stackY(floors.length);
      if (overlap <= 5) {
        debris.push({ x: cur.x, y: y - FH, w: cur.w, vy: 40, vx: cur.x < base.x ? -60 : 60, rot: 0, vr: cur.x < base.x ? -2 : 2, color: cur.color });
        api.loseLife(cur.x, y - FH);
        newBlock();
        return;
      }
      let x = (l + r) / 2, w = overlap;
      const off = Math.abs(cur.x - base.x);
      if (off <= 6 && floors.length) {
        x = base.x; w = Math.min(START_W, cur.w + 5);
        api.floatText(x, y - FH - 14, '¡Perfecto!', { color: '#fff3b0', size: 20 });
        api.sfx('match'); api.burst(x, y - FH / 2, { color: PAL.sun, count: 12 });
      } else {
        const cutW = cur.w - overlap;
        if (cutW > 3) debris.push({ x: cur.x < base.x ? l - cutW / 2 : r + cutW / 2, y: y - FH, w: cutW, vy: 0, vx: cur.x < base.x ? -40 : 40, rot: 0, vr: cur.x < base.x ? -3 : 3, color: cur.color });
        if (w < MIN_W) { w = MIN_W; x = clamp(x, base.x - base.w / 2 + MIN_W / 2, base.x + base.w / 2 - MIN_W / 2); }
        api.sfx('pop');
      }
      floors.push({ x, w, color: cur.color, pop: 0 });
      api.addScore(1, x, y - FH - 2);
      api.shake(3, 120);
      if (floors.length % 5 === 0) { storm = 3.4; stormCount++; api.sfx('whoosh'); }
      newBlock();
    }
    function drawFloor(g, x, y, w, color, idx) {
      // y = base del piso
      kit.fillRR(g, x - w / 2, y - FH, w, FH, 6, color);
      kit.fillRR(g, x - w / 2, y - FH, w, 7, 4, 'rgba(255,255,255,0.35)');
      kit.fillRR(g, x - w / 2, y - 5, w, 5, 3, 'rgba(0,0,0,0.1)');
      const n = w > 92 ? 3 : w > 58 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const wx = x + (i - (n - 1) / 2) * (w / (n + 0.4));
        if (idx === 0 && i === Math.floor((n - 1) / 2)) { kit.fillRR(g, wx - 7, y - 24, 14, 24, 5, '#8a5a3c'); kit.circle(g, wx + 3, y - 11, 1.5, PAL.sun); }
        else { kit.fillRR(g, wx - 7, y - 26, 14, 15, 3, '#fff8d8'); kit.fillRR(g, wx - 1, y - 26, 2, 15, 0, 'rgba(120,90,60,0.4)'); }
      }
    }

    return {
      update(dt) {
        t += dt;
        const speed = clamp(118 + floors.length * 8, 118, 290);
        if (cur.state === 'slide') {
          cur.x += cur.dir * speed * dt;
          if (cur.x > W - cur.w / 2 - 4) { cur.x = W - cur.w / 2 - 4; cur.dir = -1; }
          if (cur.x < cur.w / 2 + 4) { cur.x = cur.w / 2 + 4; cur.dir = 1; }
        } else {
          cur.y += 620 * dt;
          if (cur.y >= stackY(floors.length) - FH) settle();
        }
        for (const f of floors) f.pop = Math.min(1, f.pop + dt * 5);
        for (let i = debris.length - 1; i >= 0; i--) {
          const d = debris[i];
          d.vy += 900 * dt; d.y += d.vy * dt; d.x += d.vx * dt; d.rot += d.vr * dt;
          if (d.y - cam > api.H + 80) debris.splice(i, 1);
        }
        // la cámara sube con la torre
        camTo = Math.min(0, (L.rockTop - floors.length * FH) - api.H * 0.52);
        cam = lerp(cam, camTo, Math.min(1, dt * 4));
        if (storm > 0) {
          storm -= dt;
          sway = Math.sin(t * 9) * 1.6 * clamp(storm, 0, 1);
          if (stormCount === 1) sandGone = clamp(sandGone + dt * 0.5, 0, 1);
          if (storm < 1.4 && storm + dt >= 1.4) api.floatText(W / 2, api.top + 80, '¡Firme sobre la roca!', { color: '#fff', size: 22 });
          if (storm <= 0) sway = 0;
        }
      },
      draw(g) {
        const H = api.H;
        const dark = clamp(storm > 0 ? Math.min(1, storm, (3.4 - storm) * 2) : 0);
        kit.sky(g, W, H, 'day');
        if (dark > 0) { g.save(); g.globalAlpha = dark * 0.85; kit.sky(g, W, H, 'storm'); g.restore(); }
        kit.sun(g, 300, api.top + 44, 22, t);
        kit.cloud(g, 70 + Math.sin(t * 0.2) * 20, api.top + 50, 0.9, 0.9);
        g.save(); g.translate(0, -cam * 0.35);
        kit.hills(g, W, H + 300, L.rockTop - 30, 16, '#bfe3a0', 40, 0.012);
        g.restore();
        g.save(); g.translate(0, -cam);
        // mar y arena al fondo, con la casita sobre arena
        kit.water(g, W, H + 200, L.rockTop + 34, t, '#7cc8f5', '#3f9fe0');
        g.fillStyle = PAL.sand; g.beginPath(); g.ellipse(52, L.rockTop + 40, 62, 22, 0, 0, 6.28); g.fill();
        if (sandGone < 1) {
          g.save(); g.translate(52 - sandGone * 70, L.rockTop + 22 + sandGone * 34); g.rotate(-sandGone * 0.9); g.globalAlpha = 1 - sandGone;
          kit.fillRR(g, -17, -26, 34, 26, 4, '#ffd0a8');
          g.fillStyle = '#d96a4a'; g.beginPath(); g.moveTo(-22, -26); g.lineTo(0, -44); g.lineTo(22, -26); g.closePath(); g.fill();
          kit.fillRR(g, -5, -13, 10, 13, 2, '#8a5a3c');
          g.restore();
        }
        // la roca
        const rx = W / 2, ry = L.rockTop;
        g.fillStyle = PAL.stoneDeep; g.beginPath(); g.moveTo(rx - L.rockW / 2 - 16, ry + 150); g.quadraticCurveTo(rx - L.rockW / 2 - 20, ry + 10, rx - L.rockW / 2 + 12, ry);
        g.lineTo(rx + L.rockW / 2 - 12, ry); g.quadraticCurveTo(rx + L.rockW / 2 + 22, ry + 12, rx + L.rockW / 2 + 16, ry + 150); g.closePath(); g.fill();
        g.fillStyle = PAL.stone; g.beginPath(); g.moveTo(rx - L.rockW / 2 - 6, ry + 150); g.quadraticCurveTo(rx - L.rockW / 2 - 8, ry + 14, rx - L.rockW / 2 + 14, ry + 2);
        g.lineTo(rx + L.rockW / 2 - 30, ry + 2); g.quadraticCurveTo(rx + L.rockW / 2 - 6, ry + 30, rx + L.rockW / 2 - 20, ry + 150); g.closePath(); g.fill();
        kit.ellipse(g, rx - 30, ry + 22, 26, 6, 'rgba(255,255,255,0.3)', -0.1);
        // la torre (con un leve vaivén en la tormenta)
        floors.forEach((f, i) => {
          const y = stackY(i), k = ease.outBack(f.pop);
          g.save(); g.translate(f.x + sway * (i + 1) * 0.12, y); g.scale(1 + (1 - k) * 0.12, k);
          drawFloor(g, 0, 0, f.w, f.color, i);
          g.restore();
        });
        // techito al terminar la partida
        if (api.lives <= 0 && floors.length) {
          const f = floors[floors.length - 1], y = stackY(floors.length);
          g.fillStyle = '#d96a4a'; g.beginPath(); g.moveTo(f.x - f.w / 2 - 10, y); g.lineTo(f.x, y - 34); g.lineTo(f.x + f.w / 2 + 10, y); g.closePath(); g.fill();
          kit.emoji(g, '🚩', f.x, y - 46, 18);
        }
        // piso en juego
        if (cur) {
          const y = cur.state === 'slide' ? stackY(floors.length) - 30 : cur.y + FH;
          if (cur.state === 'slide') {
            const base = topOf();
            g.save(); g.setLineDash([4, 6]); g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 2;
            g.beginPath(); g.moveTo(base.x - base.w / 2, y); g.lineTo(base.x - base.w / 2, stackY(floors.length)); g.moveTo(base.x + base.w / 2, y); g.lineTo(base.x + base.w / 2, stackY(floors.length)); g.stroke(); g.restore();
          }
          drawFloor(g, cur.x, y, cur.w, cur.color, floors.length);
        }
        for (const d of debris) { g.save(); g.translate(d.x, d.y + FH / 2); g.rotate(d.rot); kit.fillRR(g, -d.w / 2, -FH / 2, d.w, FH, 5, d.color); g.restore(); }
        g.restore();
        // tormenta: nubes, lluvia y viento
        if (storm > 0) {
          kit.stormCloud(g, 90, api.top + 46, 1.2, t); kit.stormCloud(g, 250, api.top + 66, 1.0, t + 1);
          g.save(); g.strokeStyle = 'rgba(210,230,255,0.75)'; g.lineWidth = 2; g.lineCap = 'round'; g.globalAlpha = clamp(storm, 0, 1);
          for (let i = 0; i < 46; i++) { const x = ((i * 71 + t * 420) % (W + 80)) - 40, y = ((i * 131 + t * 760) % (H - api.top)) + api.top; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 7, y + 15); g.stroke(); }
          g.restore();
        }
      },
      pointerDown() { release(); },
      keyDown(k) { if (k === 'action' || k === 'down') release(); },
      resize() { layout(); },
      get debug() { return { x: cur.x, w: cur.w, state: cur.state, baseX: topOf().x, baseW: topOf().w, floors: floors.length, storm }; },
    };
  },
};
