// La perla escondida (El tesoro y la perla, Mateo 13, 44-46) — juego de las conchas.
//
// Una concha guarda la perla de gran valor. Las conchas se mezclan y el niño tiene que seguirla con la mirada,
// como el comerciante que no le quitó los ojos de encima a su tesoro.
export default {
  id: 'perla',
  create(api) {
    const { kit } = api;
    const { PAL, clamp, lerp, ease } = kit;
    const W = api.W;

    let t = 0, round = 0, phase = 'show', phaseT = 0;
    let shells = [];                // { slot, x, y, open (0..1), pearl, bob }
    let swaps = 0, swapDur = 0.6, swap = null;      // swap: { a, b, t, ax, bx }
    let picked = null, right = false;
    const bubbles = Array.from({ length: 9 }, (_, i) => ({ x: api.randRange(10, W - 10), y: api.randRange(0, 600), r: api.randRange(3, 7), v: api.randRange(14, 30), ph: i }));
    const L = {};

    const count = () => (round < 2 ? 3 : round < 5 ? 4 : 5);
    function layout() {
      L.y = api.top + (api.bottom - api.top) * 0.56;
      L.sand = api.top + (api.bottom - api.top) * 0.36;
      const n = shells.length || count();
      L.size = Math.min(84, (W - 28) / n - 8);
      L.slotX = i => W / 2 + (i - (n - 1) / 2) * ((W - 28) / n);
      for (const s of shells) if (!swap) { s.x = L.slotX(s.slot); s.y = L.y; }
    }
    function startRound() {
      const n = count();
      const pearlAt = api.randInt(0, n - 1);
      shells = Array.from({ length: n }, (_, i) => ({ slot: i, x: 0, y: 0, open: 0, pearl: i === pearlAt, bob: 0 }));
      swap = null; picked = null;
      layout();
      swaps = Math.min(3 + round, 10);
      swapDur = clamp(0.62 - round * 0.04, 0.28, 0.62);
      phase = 'show'; phaseT = 0;
    }
    startRound();
    api.hint('Mira dónde se guarda la perla', 2200);

    function nextSwap() {
      const n = shells.length;
      const a = api.randInt(0, n - 1);
      let b; do { b = api.randInt(0, n - 1); } while (b === a);
      const sa = shells.find(s => s.slot === a), sb = shells.find(s => s.slot === b);
      swap = { a: sa, b: sb, t: 0, ax: sa.x, bx: sb.x };
      api.sfx('whoosh');
    }
    function drawShell(g, s) {
      const z = L.size / 84;
      g.save(); g.translate(s.x, s.y - s.bob); g.scale(z, z);
      kit.shadow(g, 0, 26, 36, 8, 0.2);
      // valva de abajo
      g.fillStyle = '#f3c9b8'; g.beginPath(); g.ellipse(0, 14, 36, 14, 0, 0, Math.PI); g.fill();
      g.fillStyle = '#e8b09c'; g.beginPath(); g.ellipse(0, 14, 36, 6, 0, 0, 6.28); g.fill();
      // perla
      if (s.pearl && s.open > 0.15) {
        const glow = 0.5 + Math.sin(t * 6) * 0.2;
        kit.circle(g, 0, 8, 20, `rgba(255,255,255,${0.35 * glow * s.open})`);
        kit.circle(g, 0, 8, 11, '#fdfbff'); kit.circle(g, -3.5, 4.5, 3.4, '#ffffff'); kit.circle(g, 2, 11, 7, 'rgba(210,190,255,0.35)');
      }
      // valva de arriba (abanico con estrías) que se levanta
      g.translate(0, 14); g.rotate(-s.open * 1.05); g.translate(0, -14);
      const lift = -s.open * 6;
      g.fillStyle = '#ffb59a'; g.beginPath(); g.moveTo(-38, 14 + lift);
      for (let i = 0; i <= 6; i++) { const a = Math.PI + (i / 6) * Math.PI, r = 40 + (i % 2 ? 0 : 3); g.lineTo(Math.cos(a) * r * 0.95, 14 + lift + Math.sin(a) * r * 0.92); }
      g.closePath(); g.fill();
      g.strokeStyle = '#f08f70'; g.lineWidth = 2.4; g.lineCap = 'round';
      for (let i = 1; i < 6; i++) { const a = Math.PI + (i / 6) * Math.PI; g.beginPath(); g.moveTo(0, 12 + lift); g.lineTo(Math.cos(a) * 34, 14 + lift + Math.sin(a) * 33); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(-12, -8 + lift, 9, 4, -0.6, 0, 6.28); g.fill();
      g.fillStyle = '#f08f70'; g.beginPath(); g.ellipse(0, 15 + lift, 9, 4, 0, 0, 6.28); g.fill();
      g.restore();
    }

    return {
      update(dt) {
        t += dt; phaseT += dt;
        for (const b of bubbles) { b.y -= b.v * dt; if (b.y < api.top - 10) { b.y = api.H + 10; b.x = api.randRange(10, W - 10); } }
        const pearl = shells.find(s => s.pearl);
        if (phase === 'show') {
          pearl.open = ease.outBack(clamp(phaseT / 0.4));
          if (phaseT > 1.5) { phase = 'close'; phaseT = 0; }
        } else if (phase === 'close') {
          pearl.open = 1 - clamp(phaseT / 0.3);
          if (phaseT > 0.45) { phase = 'shuffle'; phaseT = 0; nextSwap(); }
        } else if (phase === 'shuffle') {
          swap.t += dt / swapDur;
          const k = ease.inOut(clamp(swap.t)), arc = Math.sin(clamp(swap.t) * Math.PI) * L.size * 0.55;
          swap.a.x = lerp(swap.ax, swap.bx, k); swap.a.y = L.y - arc;
          swap.b.x = lerp(swap.bx, swap.ax, k); swap.b.y = L.y + arc * 0.7;
          if (swap.t >= 1) {
            const sa = swap.a.slot; swap.a.slot = swap.b.slot; swap.b.slot = sa;
            swap.a.x = L.slotX(swap.a.slot); swap.b.x = L.slotX(swap.b.slot); swap.a.y = swap.b.y = L.y;
            swap = null; swaps--;
            if (swaps > 0) nextSwap(); else { phase = 'choose'; phaseT = 0; api.hint('¿Dónde está la perla?', 1800); api.sfx('pop'); }
          }
        } else if (phase === 'choose') {
          for (const s of shells) s.bob = Math.abs(Math.sin(t * 3 + s.slot)) * 4;
        } else if (phase === 'reveal') {
          picked.open = ease.outBack(clamp(phaseT / 0.35));
          if (!right && phaseT > 0.7) pearl.open = ease.outBack(clamp((phaseT - 0.7) / 0.35));
          if (phaseT > (right ? 1.3 : 1.9)) { round++; startRound(); }
        }
      },
      draw(g) {
        const H = api.H;
        kit.sky(g, W, H, 'sea');
        kit.sun(g, 56, api.top + 40, 20, t);
        kit.water(g, W, H, L.sand - 60, t, '#7fd4f0', '#3aa6dc');
        // playa
        g.fillStyle = '#f6dfae'; g.beginPath(); g.moveTo(0, H);
        for (let x = 0; x <= W + 8; x += 8) g.lineTo(x, L.sand + Math.sin(x * 0.03 + 1) * 8);
        g.lineTo(W, H); g.closePath(); g.fill();
        g.fillStyle = '#efd193'; for (let i = 0; i < 16; i++) kit.circle(g, (i * 83) % W, L.sand + 40 + ((i * 57) % Math.max(40, H - L.sand - 60)), 2.2, '#e8c684');
        kit.emoji(g, '🐚', 34, H - 46, 22, { rot: -0.4 }); kit.emoji(g, '⭐', W - 40, H - 36, 18, { rot: 0.3 }); kit.emoji(g, '🦀', W - 70, L.sand + 26, 20);
        for (const b of bubbles) if (b.y < L.sand - 30) kit.bubble(g, b.x + Math.sin(t * 2 + b.ph) * 4, b.y, b.r, 0.5);
        // el comerciante mira atento
        const happy = phase === 'reveal' && right, sad = phase === 'reveal' && !right;
        kit.person(g, 42, L.sand + 34, 1.15, { robe: '#3d7ea6', sash: '#f0c35a', beard: true, hair: '#3b2a20', skin: '#c99a6a', arms: happy ? 'up' : 'down', sad, t });
        kit.fillRR(g, 62, L.sand + 6, 22, 16, 5, '#a9744a'); kit.circle(g, 73, L.sand + 6, 4, PAL.sun);
        // conchas (las que van por detrás primero)
        for (const s of [...shells].sort((a, b) => a.y - b.y)) drawShell(g, s);
        if (phase === 'choose') kit.text(g, '👇', W / 2, L.y - L.size * 0.95 - Math.abs(Math.sin(t * 4)) * 6, { size: 26 });
        if (phase === 'reveal' && right && phaseT < 1) kit.text(g, '¡La encontraste!', W / 2, L.y - L.size * 1.05, { size: 22, color: '#fff', stroke: PAL.coralDeep, strokeWidth: 5 });
        kit.text(g, `Ronda ${round + 1}`, W - 16, api.top + 12, { size: 14, align: 'right', color: '#fff', stroke: 'rgba(30,90,140,0.6)', strokeWidth: 4 });
      },
      pointerDown(x, y) {
        if (phase !== 'choose') return;
        const s = shells.find(k => Math.abs(x - k.x) < L.size * 0.6 && Math.abs(y - (k.y - 6)) < L.size * 0.75);
        if (!s) return;
        picked = s; right = s.pearl; phase = 'reveal'; phaseT = 0;
        for (const k of shells) k.bob = 0;
        if (right) { api.addScore(1, s.x, s.y - L.size * 0.7); api.sfx('match'); api.burst(s.x, s.y, { emoji: '✨', count: 6, speed: 110, size: 18 }); }
        else { api.sfx('wrong'); api.loseLife(s.x, s.y - 30); }
      },
      resize() { layout(); },
    };
  },
};
