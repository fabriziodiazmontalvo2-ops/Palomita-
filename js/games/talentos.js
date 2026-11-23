// Los talentos (Mateo 25, 14-30) — memoria de parejas.
//
// Cada carta esconde un don. Al encontrar su pareja, el don "se multiplica", como los talentos de los servidores
// que los hicieron crecer. Las rondas van teniendo más cartas.
export default {
  id: 'talentos',
  create(api) {
    const { kit } = api;
    const { PAL, clamp, ease } = kit;
    const W = api.W;
    const GIFTS = [['🎵', 'Cantar'], ['🎨', 'Dibujar'], ['⚽', 'Jugar'], ['📚', 'Estudiar'], ['🤝', 'Ayudar'], ['🙏', 'Rezar'], ['😊', 'Alegrar'], ['🍳', 'Cocinar'],
      ['🌱', 'Cuidar'], ['👂', 'Escuchar'], ['🤗', 'Abrazar'], ['✍️', 'Escribir'], ['💃', 'Bailar'], ['🧩', 'Pensar']];
    const ROUNDS = [[3, 2], [4, 2], [4, 3], [4, 4]];        // [columnas, filas]

    let t = 0, round = 0, phase = 'preview', phaseT = 0, pairsLeft = 0;
    let cards = [];                 // { gift, col, row, x, y, w, h, flip (0 boca abajo .. 1 boca arriba), up, matched, glow }
    let open = [];                  // cartas descubiertas sin resolver
    let missT = 0;

    function layoutCards() {
      const [cols, rows] = ROUNDS[Math.min(round, ROUNDS.length - 1)];
      const top = api.top + 34, bottom = api.bottom - 8;
      const gap = 8;
      const cw = Math.min(96, (W - 24 - gap * (cols - 1)) / cols), ch = Math.min(cw * 1.22, (bottom - top - gap * (rows - 1)) / rows);
      const w = Math.min(cw, ch / 1.05), totalW = cols * w + gap * (cols - 1), totalH = rows * ch + gap * (rows - 1);
      const x0 = (W - totalW) / 2, y0 = top + (bottom - top - totalH) / 2;
      for (const c of cards) { c.w = w; c.h = ch; c.x = x0 + c.col * (w + gap); c.y = y0 + c.row * (ch + gap); }
    }
    function deal() {
      const [cols, rows] = ROUNDS[Math.min(round, ROUNDS.length - 1)];
      const n = (cols * rows) / 2;
      const gifts = api.shuffle(GIFTS).slice(0, n);
      const deck = api.shuffle([...gifts, ...gifts]);
      cards = deck.map((gift, i) => ({ gift, col: i % cols, row: Math.floor(i / cols), x: 0, y: 0, w: 0, h: 0, flip: 0, up: true, matched: false, glow: 0 }));
      layoutCards();
      open = []; pairsLeft = n; phase = 'preview'; phaseT = 0; missT = 0;
    }
    deal();
    api.hint('Mira bien las cartas…', 1600);

    function resolveMiss() {
      for (const c of open) c.up = false;
      open = []; missT = 0;
    }
    function tap(x, y) {
      if (phase !== 'play') return;
      const c = cards.find(k => !k.matched && !k.up && x >= k.x && x <= k.x + k.w && y >= k.y && y <= k.y + k.h);
      if (!c) return;
      if (open.length === 2) resolveMiss();       // el niño no tiene que esperar
      c.up = true; open.push(c);
      api.sfx('tap');
      if (open.length === 2) {
        const [a, b] = open;
        if (a.gift === b.gift) {
          a.matched = b.matched = true; a.glow = b.glow = 1; open = [];
          pairsLeft--;
          api.addScore(1, (a.x + b.x) / 2 + a.w / 2, Math.min(a.y, b.y) + 10);
          api.addTime(2);
          api.sfx('match');
          for (const k of [a, b]) api.burst(k.x + k.w / 2, k.y + k.h / 2, { color: PAL.sun, count: 8, speed: 90 });
          if (!pairsLeft) { phase = 'done'; phaseT = 0; api.addTime(5); api.sfx('win'); api.hint('¡Tus talentos se multiplican! +5 s', 1500); }
        } else { missT = 0.85; api.sfx('wrong'); }
      }
    }
    function drawCard(g, c) {
      const k = c.flip, sx = Math.abs(Math.cos(k * Math.PI));      // giro: se encoge a la mitad y cambia de cara
      const face = k > 0.5;
      const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
      g.save(); g.translate(cx, cy); g.scale(Math.max(0.04, sx), 1 + (1 - sx) * 0.04);
      kit.fillRR(g, -c.w / 2, -c.h / 2 + 4, c.w, c.h, 12, 'rgba(40,20,60,0.25)');
      if (face) {
        kit.fillRR(g, -c.w / 2, -c.h / 2, c.w, c.h, 12, c.matched ? '#fff6d6' : '#ffffff', c.matched ? PAL.sun : null, 3);
        kit.emoji(g, c.gift[0], 0, -c.h * 0.1, Math.min(c.w * 0.5, c.h * 0.42));
        kit.text(g, c.gift[1], 0, c.h / 2 - 15, { size: Math.max(12, Math.min(15, c.w * 0.19)), color: PAL.ink });
      } else {
        kit.fillRR(g, -c.w / 2, -c.h / 2, c.w, c.h, 12, PAL.grape);
        kit.fillRR(g, -c.w / 2 + 5, -c.h / 2 + 5, c.w - 10, c.h - 10, 9, PAL.grapeDeep);
        const r = Math.min(c.w, c.h) * 0.27;
        kit.circle(g, 0, 2, r, PAL.sunDeep); kit.circle(g, 0, 0, r, PAL.sun); kit.circle(g, 0, 0, r * 0.72, null, PAL.sunDeep, 2);
        kit.star(g, 0, 0, r * 0.45, '#fff6c9', t * 0.3);
      }
      g.restore();
      if (c.glow > 0) kit.circle(g, cx, cy, c.w * (0.5 + (1 - c.glow) * 0.5), null, `rgba(255, 214, 90, ${c.glow})`, 4);
    }

    return {
      update(dt) {
        t += dt; phaseT += dt;
        for (const c of cards) {
          const target = c.up || c.matched ? 1 : 0;
          c.flip = clamp(c.flip + Math.sign(target - c.flip) * dt * 5.5, 0, 1);
          if (c.glow > 0) c.glow = Math.max(0, c.glow - dt * 1.8);
        }
        if (phase === 'preview' && phaseT > 1.7) { for (const c of cards) c.up = false; phase = 'play'; api.hint('¡Encuentra las parejas!', 1500); }
        if (missT > 0) { missT -= dt; if (missT <= 0) resolveMiss(); }
        if (phase === 'done' && phaseT > 1.4) { round++; deal(); }
      },
      draw(g) {
        const H = api.H;
        const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#8f7be8'); gr.addColorStop(1, '#f5a6c8');
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
        kit.stars(g, W, H * 0.6, t, 26, 11);
        for (let i = 0; i < 5; i++) kit.seed(g, 30 + i * 76 + Math.sin(t + i) * 6, H - 26 - Math.abs(Math.sin(t * 1.3 + i * 1.7)) * 8, 7, t * 0.6 + i);
        kit.text(g, `Ronda ${round + 1}`, W / 2, api.top + 14, { size: 16, color: '#fff', stroke: 'rgba(60,30,90,0.5)', strokeWidth: 4 });
        for (const c of cards) drawCard(g, c);
      },
      pointerDown(x, y) { tap(x, y); },
      resize() { layoutCards(); },
    };
  },
};
