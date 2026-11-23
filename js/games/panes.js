// Panes y peces (la multiplicación de los panes, Juan 6, 1-14) — minijuego de repartir.
//
// La multitud está sentada en la ladera. La canasta del niño muestra un pan o un pez: hay que tocar a alguien que lo
// esté pidiendo. La canasta nunca se vacía: Jesús hace que alcance para todos.
export default {
  id: 'panes',
  create(api) {
    const { kit } = api;
    const { PAL, clamp, lerp, ease } = kit;
    const W = api.W;
    const FOOD = { pan: '🍞', pez: '🐟' };
    const ROBES = ['#c97b63', '#8fbc8f', '#7fb3d5', '#e9c46a', '#c9a3ff', '#e9a04b', '#f4a6b8', '#8ecae6', '#b08968', '#a8d5a2', '#f6bd60', '#d4a5a5'];
    const SKINS = ['#e8b38a', '#b9825a', '#f0c8a0', '#8d5a3b', '#d9a066'];
    const HAIRS = ['#5a3b28', '#2f1e14', '#444', '#6b4a2f', '#8a5a3c'];

    let t = 0, askT = 0.5, current = 'pan', next = 'pez', resetT = 0, sparkle = 0, fedTotal = 0;
    const people = [];              // { col, row, x, y, state: 'idle' | 'ask' | 'fed', want, st, shake, robe… }
    const flying = [];              // { food, fx, fy, tx, ty, t, target }
    const L = {};
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
      people.push({ col: c, row: r, x: 0, y: 0, state: 'idle', want: 'pan', st: 0, shake: 0, robe: ROBES[(r * 4 + c) % ROBES.length], skin: api.pick(SKINS), hair: api.pick(HAIRS), veil: api.rand() < 0.4 ? '#f4f1e8' : null, beard: api.rand() < 0.3 });
    }
    function layout() {
      const top = api.top, bottom = api.bottom;
      L.basketY = bottom - 44;
      L.lake = top + (bottom - top) * 0.17;
      L.jesusY = top + (bottom - top) * 0.3;
      const y0 = L.jesusY + 62, y1 = L.basketY - 62;
      for (const p of people) {
        p.x = 54 + p.col * 84 + (p.row % 2 ? 0 : 0) + (p.row === 1 ? 0 : 0);
        p.y = lerp(y0, y1, p.row / 2);
        p.s = 0.98 + p.row * 0.09;
      }
    }
    layout();
    api.hint('Toca a quien pide lo que hay en la canasta', 3200);

    const wanting = food => people.filter(p => p.state === 'ask' && p.want === food);
    const maxAsks = () => clamp(2 + Math.floor(api.time / 13), 2, 5);
    function ask(p, food) { p.state = 'ask'; p.want = food; p.st = 0; api.sfx('pop'); }
    // Siempre debe haber alguien pidiendo lo que tiene la canasta.
    function ensurePlayable() {
      if (resetT > 0 || wanting(current).length) return;
      const idle = people.filter(p => p.state === 'idle');
      if (idle.length) ask(api.pick(idle), current);
      else if (wanting(next).length) { const c = current; current = next; next = c; }
    }
    function pickNext() {
      const idle = people.filter(p => p.state === 'idle').length;
      const w = { pan: wanting('pan').length, pez: wanting('pez').length };
      if (!idle && w.pan + w.pez) return w.pan >= w.pez ? 'pan' : 'pez';
      return api.rand() < 0.5 ? 'pan' : 'pez';
    }
    function personAt(x, y) {
      let best = null, bd = 46;
      for (const p of people) { const d = kit.dist(x, y, p.x, p.y - 30 * p.s); if (d < bd) { bd = d; best = p; } }
      return best;
    }
    function tap(x, y) {
      if (resetT > 0) return;
      const p = personAt(x, y);
      if (!p) return;
      if (p.state === 'ask' && p.want === current) {
        p.state = 'fed'; p.st = 0; p.food = current; fedTotal++;
        flying.push({ food: current, fx: W / 2, fy: L.basketY - 10, tx: p.x, ty: p.y - 34 * p.s, t: 0 });
        api.addScore(1, p.x, p.y - 74 * p.s);
        api.sfx('good');
        current = next; next = pickNext(); sparkle = 1;
        if (people.every(k => k.state === 'fed')) {
          resetT = 1.9;
          api.addScore(3); api.sfx('win');
          api.hint('¡Todos comieron y sobraron 12 canastas!', 1900);
          api.burst(W / 2, L.jesusY + 60, { emoji: '🧺', count: 6, speed: 150, size: 20, life: 1.2 });
        } else ensurePlayable();
      } else {
        p.shake = 0.4;
        api.sfx('wrong');
        if (p.state === 'ask') api.floatText(p.x, p.y - 74 * p.s, `Pide ${FOOD[p.want]}`, { color: '#fff', size: 15 });
      }
    }
    function drawBubble(g, p) {
      const bx = p.x + 20 * p.s, by = p.y - 64 * p.s, k = ease.outBack(clamp(p.st / 0.25));
      const match = p.want === current;
      const r = 17 * k * (match ? 1 + Math.sin(t * 7) * 0.05 : 1);
      kit.circle(g, bx, by + 2, r, 'rgba(50,40,30,0.15)');
      kit.circle(g, bx, by, r, '#ffffff', match ? PAL.sunDeep : null, 3);
      g.fillStyle = '#fff'; g.beginPath(); g.moveTo(bx - 9, by + 12); g.lineTo(bx - 14, by + 22); g.lineTo(bx - 1, by + 15); g.fill();
      kit.emoji(g, FOOD[p.want], bx, by, 20 * k);
    }

    return {
      update(dt) {
        t += dt;
        if (sparkle > 0) sparkle -= dt * 2.5;
        for (const p of people) {
          p.st += dt; if (p.shake > 0) p.shake -= dt;
          if (p.state === 'ask' && p.st > 9 && p.want !== current) { p.state = 'idle'; p.st = 0; }
        }
        for (let i = flying.length - 1; i >= 0; i--) { flying[i].t += dt / 0.36; if (flying[i].t >= 1) flying.splice(i, 1); }
        if (resetT > 0) {
          resetT -= dt;
          if (resetT <= 0) { for (const p of people) { p.state = 'idle'; p.st = 0; } askT = 0.2; ensurePlayable(); }
          return;
        }
        askT -= dt;
        if (askT <= 0) {
          askT = clamp(1.7 - api.time * 0.018, 0.75, 1.7);
          const asks = people.filter(p => p.state === 'ask').length, idle = people.filter(p => p.state === 'idle');
          if (asks < maxAsks() && idle.length) ask(api.pick(idle), api.rand() < 0.5 ? 'pan' : 'pez');
        }
        ensurePlayable();
      },
      draw(g) {
        const H = api.H;
        kit.sky(g, W, H, 'day');
        kit.sun(g, 48, api.top + 36, 20, t);
        kit.cloud(g, 250 + Math.sin(t * 0.25) * 16, api.top + 30, 0.8, 0.9);
        kit.hills(g, W, H, L.lake - 14, 10, '#b7c9e8', 60, 0.014);
        kit.water(g, W, L.lake + 46, L.lake, t, '#7cc8f5', '#58b7ea');
        kit.emoji(g, '⛵', 290 + Math.sin(t * 0.4) * 8, L.lake + 14, 18);
        kit.hills(g, W, H, L.lake + 38, 12, PAL.leafLight, 120, 0.01);
        g.fillStyle = PAL.leaf; g.fillRect(0, L.lake + 56, W, H);
        kit.hills(g, W, H, L.jesusY + 30, 8, '#7ccf80', 200, 0.013);
        for (let i = 0; i < 7; i++) kit.flower(g, 18 + i * 54, L.jesusY + 44 + ((i * 37) % 30), 0.8, i % 2 ? PAL.rose : '#fff');
        // Jesús bendice; a su lado, el niño de la canasta
        kit.person(g, W / 2, L.jesusY + 18, 1.3, { robe: '#f8f4ea', sash: '#c0392b', beard: true, hair: '#6b4a2f', skin: '#e0ae84', arms: 'open', t });
        kit.person(g, W / 2 + 46, L.jesusY + 22, 0.85, { robe: '#7fb3d5', hair: '#3b2a20', skin: '#c99a6a', arms: 'up', t });
        // la multitud
        for (const p of people) {
          const sx = p.x + (p.shake > 0 ? Math.sin(p.shake * 42) * 4 : 0);
          const fed = p.state === 'fed', asking = p.state === 'ask';
          const hop = fed && p.st < 0.5 ? Math.sin(p.st / 0.5 * Math.PI) * 6 : 0;
          kit.person(g, sx, p.y - hop, p.s, { robe: p.robe, skin: p.skin, hair: p.hair, veil: p.veil, beard: p.beard, arms: asking ? 'up' : fed ? 'down' : 'down', sad: asking && p.st > 6, t: t + p.col });
          if (fed && p.st > 0.3) kit.emoji(g, FOOD[p.food], sx + 13 * p.s, p.y - 20 * p.s - hop, 14 * p.s);
          if (asking) drawBubble(g, p);
        }
        // comida volando
        for (const f of flying) {
          const k = ease.outCubic(clamp(f.t));
          kit.emoji(g, FOOD[f.food], lerp(f.fx, f.tx, k), lerp(f.fy, f.ty, k) - Math.sin(k * Math.PI) * 50, 26, { rot: k * 4 });
        }
        // la canasta: alimento actual (grande) y el que sigue (pequeño)
        const bx = W / 2, by = L.basketY;
        kit.shadow(g, bx, by + 30, 52, 9, 0.2);
        kit.emoji(g, FOOD[current], bx, by - 8 - sparkle * 6, 44 * (1 + Math.max(0, sparkle) * 0.15));
        kit.fillRR(g, bx - 46, by + 2, 92, 30, 13, '#b98556');
        g.save(); g.strokeStyle = '#96643a'; g.lineWidth = 2.5; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(bx + i * 12, by + 5); g.lineTo(bx + i * 12 + 5, by + 29); g.stroke(); } g.restore();
        kit.fillRR(g, bx - 50, by - 2, 100, 9, 4.5, '#c99562');
        if (sparkle > 0) kit.emoji(g, '✨', bx + 34, by - 26, 18, { alpha: clamp(sparkle) });
        kit.fillRR(g, bx + 62, by - 2, 64, 32, 16, 'rgba(255,255,255,0.9)');
        kit.text(g, 'Sigue', bx + 84, by + 14, { size: 12, color: PAL.inkSoft });
        kit.emoji(g, FOOD[next], bx + 110, by + 14, 18);
      },
      pointerDown(x, y) { tap(x, y); },
      resize() { layout(); },
    };
  },
};
