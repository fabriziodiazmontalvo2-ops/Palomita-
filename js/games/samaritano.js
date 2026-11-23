// Manos que ayudan (El buen samaritano, Lucas 10, 25-37) — minijuego de arrastrar.
//
// En el camino de Jerusalén a Jericó aparecen personas que necesitan algo. El niño mira el globito y arrastra hasta
// cada una lo que le hace falta (o toca el objeto y luego a la persona). Si se acaba la paciencia, la persona se va triste.
export default {
  id: 'samaritano',
  create(api) {
    const { kit } = api;
    const { PAL, clamp, lerp, ease } = kit;
    const W = api.W;
    const ITEMS = [
      { k: 'agua', e: '💧', why: 'tiene sed' }, { k: 'pan', e: '🍞', why: 'tiene hambre' }, { k: 'venda', e: '🩹', why: 'está herido' },
      { k: 'manto', e: '🧥', why: 'tiene frío' }, { k: 'amor', e: '❤️', why: 'está triste' },
    ];
    const ROBES = ['#c97b63', '#8fbc8f', '#7fb3d5', '#b08968', '#c9a3ff', '#e9a04b'];
    const SKINS = ['#e8b38a', '#b9825a', '#f0c8a0', '#8d5a3b'];

    let t = 0, spawnT = 0.6, helped = 0;
    const people = [];                 // { slot, need, patience, max, state: 'wait' | 'happy' | 'leave', st, shake, robe, skin }
    const SLOTS = [];                  // posiciones en el camino
    const tray = [];                   // { x, y, r, item }
    let drag = null;                   // { item, x, y, moved, sx, sy }
    let selected = null;
    const L = {};

    function layout() {
      const top = api.top + 30, trayY = api.bottom - 40;
      L.trayY = trayY;
      L.roadTop = top + (trayY - top) * 0.2; L.roadBot = trayY - 62;
      const ys = [0.12, 0.42, 0.72, 0.98].map(k => lerp(L.roadTop + 40, L.roadBot, k));
      const xs = [250, 110, 262, 120];
      SLOTS.length = 0;
      for (let i = 0; i < 4; i++) SLOTS.push({ x: xs[i], y: ys[i] });
      tray.length = 0;
      ITEMS.forEach((item, i) => tray.push({ x: 40 + i * 70, y: trayY, r: 30, item }));
    }
    layout();
    api.hint('Arrastra lo que necesita cada persona', 3200);

    const maxPeople = () => (api.time < 18 ? 1 : api.time < 50 ? 2 : 3);
    const patienceFor = () => clamp(11.5 - api.time * 0.05, 6.5, 11.5);
    function spawn() {
      const free = [0, 1, 2, 3].filter(i => !people.some(p => p.slot === i));
      if (!free.length) return;
      const kinds = api.time < 12 ? ITEMS.slice(0, 3) : ITEMS;
      const pat = patienceFor();
      people.push({ slot: api.pick(free), need: api.pick(kinds), patience: pat, max: pat, state: 'wait', st: 0, shake: 0, robe: api.pick(ROBES), skin: api.pick(SKINS), hair: api.pick(['#5a3b28', '#2f1e14', '#444', '#6b4a2f']), veil: api.rand() < 0.35 ? api.pick(['#f4f1e8', '#ffd9c2']) : null });
      api.sfx('pop');
    }
    function personAt(x, y) {
      let best = null, bd = 56;
      for (const p of people) {
        if (p.state !== 'wait') continue;
        const s = SLOTS[p.slot], d = kit.dist(x, y, s.x, s.y - 34);
        if (d < bd) { bd = d; best = p; }
      }
      return best;
    }
    function give(p, item) {
      const s = SLOTS[p.slot];
      if (item.k === p.need.k) {
        p.state = 'happy'; p.st = 0; helped++;
        api.addScore(1, s.x, s.y - 86);
        api.sfx('good');
        api.burst(s.x, s.y - 50, { emoji: '❤️', count: 4, speed: 70, size: 16, life: 0.9, gravity: -30 });
      } else {
        p.shake = 0.45;
        api.sfx('wrong');
        api.floatText(s.x, s.y - 92, 'Eso no…', { color: '#ffe3d6', size: 15 });
      }
    }
    const trayAt = (x, y) => tray.find(b => Math.abs(x - b.x) < 34 && Math.abs(y - b.y) < 36) || null;

    return {
      update(dt) {
        t += dt;
        spawnT -= dt;
        const waiting = people.filter(p => p.state === 'wait').length;
        if (spawnT <= 0 && waiting < maxPeople()) { spawn(); spawnT = clamp(3.4 - api.time * 0.02, 1.6, 3.4); }
        if (!people.length && spawnT > 0.8) spawnT = 0.8;
        for (let i = people.length - 1; i >= 0; i--) {
          const p = people[i];
          p.st += dt; if (p.shake > 0) p.shake -= dt;
          if (p.state === 'wait') {
            p.patience -= dt;
            if (p.patience <= 0) { p.state = 'leave'; p.st = 0; const s = SLOTS[p.slot]; api.loseLife(s.x, s.y - 60); }
          } else if (p.state === 'happy' && p.st > 1.3) people.splice(i, 1);
          else if (p.state === 'leave' && p.st > 1.1) people.splice(i, 1);
        }
      },
      draw(g) {
        const H = api.H;
        kit.sky(g, W, H, 'dawn');
        kit.sun(g, 62, api.top + 44, 22, t);
        kit.hills(g, W, H, L.roadTop + 4, 16, '#f0d7a8', 30, 0.012);
        kit.hills(g, W, H, L.roadTop + 22, 12, '#e9c58a', 160, 0.017);
        g.fillStyle = '#ecd29c'; g.fillRect(0, L.roadTop + 34, W, H);
        // el camino que serpentea
        g.save(); g.strokeStyle = '#d6b678'; g.lineWidth = 86; g.lineCap = 'round'; g.lineJoin = 'round';
        g.beginPath(); g.moveTo(300, L.roadTop + 20);
        for (let i = 0; i < 4; i++) g.lineTo(SLOTS[i].x + (i % 2 ? 50 : -50), SLOTS[i].y);
        g.lineTo(200, H + 40); g.stroke();
        g.strokeStyle = '#e3c88f'; g.lineWidth = 70; g.stroke();
        g.restore();
        kit.tree(g, 44, L.roadTop + 62, 0.95, { kind: 'palm' });
        kit.rock(g, 318, L.roadTop + 150, 0.9, '#c9b38a'); kit.rock(g, 36, L.roadBot - 20, 0.7, '#c9b38a');
        kit.bush(g, 330, L.roadBot + 6, 0.7, '#a9b56e');
        // el samaritano y su burrito
        const cheer = people.some(p => p.state === 'happy');
        kit.emoji(g, '🫏', 52, L.roadBot - 56, 34, { flip: true });
        kit.person(g, 26, L.roadBot - 30, 1.0, { robe: '#3fa7a0', sash: '#f0c35a', hair: '#2f1e14', skin: '#b9825a', beard: true, arms: cheer ? 'up' : 'down', t });
        // personas, de atrás hacia delante
        for (const p of [...people].sort((a, b) => SLOTS[a.slot].y - SLOTS[b.slot].y)) {
          const s = SLOTS[p.slot];
          const sx = s.x + (p.shake > 0 ? Math.sin(p.shake * 40) * 4 : 0);
          g.save();
          if (p.state === 'leave') g.globalAlpha = 1 - clamp(p.st / 1.1);
          const appear = p.state === 'wait' ? ease.outBack(clamp(p.st / 0.35)) : 1;
          const happy = p.state === 'happy';
          const hop = happy ? Math.abs(Math.sin(p.st * 9)) * 6 : 0;
          const lying = p.need.k === 'venda' && !happy;
          kit.person(g, sx + (p.state === 'leave' ? p.st * 40 : 0), s.y - hop, 1.18 * appear, { robe: p.robe, skin: p.skin, hair: p.hair, veil: p.veil, sad: !happy, arms: happy ? 'up' : 'down', lying, t, walk: p.state === 'leave' });
          if (p.state === 'wait') {
            // globito con lo que necesita y anillo de paciencia
            const bx = sx, by = s.y - (lying ? 54 : 84), k = clamp(p.patience / p.max);
            const pulse = k < 0.3 ? 1 + Math.sin(t * 14) * 0.06 : 1;
            kit.circle(g, bx, by + 2, 25 * pulse, 'rgba(60,40,30,0.14)');
            kit.circle(g, bx, by, 24 * pulse, '#ffffff');
            g.fillStyle = '#fff'; g.beginPath(); g.moveTo(bx - 7, by + 21); g.lineTo(bx, by + 33); g.lineTo(bx + 7, by + 21); g.fill();
            g.strokeStyle = k > 0.5 ? PAL.leaf : k > 0.25 ? PAL.sun : PAL.coral; g.lineWidth = 5; g.lineCap = 'round';
            g.beginPath(); g.arc(bx, by, 24 * pulse, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); g.stroke();
            kit.emoji(g, p.need.e, bx, by, 26);
          } else if (happy) kit.emoji(g, p.need.e, sx + 16, s.y - 34 - hop, 18);
          g.restore();
        }
        // bandeja de ayuda
        kit.fillRR(g, 6, L.trayY - 40, W - 12, 80, 22, 'rgba(255,255,255,0.86)');
        for (const b of tray) {
          const on = selected === b.item || (drag && drag.item === b.item);
          kit.circle(g, b.x, b.y + 3, b.r, 'rgba(120,80,40,0.18)');
          kit.circle(g, b.x, b.y, b.r, on ? '#fff1c9' : '#ffffff', on ? PAL.sunDeep : null, 3.5);
          if (!(drag && drag.item === b.item && drag.moved)) kit.emoji(g, b.item.e, b.x, b.y, 32);
        }
        if (drag && drag.moved) kit.emoji(g, drag.item.e, drag.x, drag.y - 26, 44);
        if (selected && !drag) kit.text(g, 'Ahora toca a quien lo necesita', W / 2, L.trayY - 54, { size: 14, color: '#fff', stroke: 'rgba(61,43,36,0.7)', strokeWidth: 4 });
      },
      pointerDown(x, y) {
        const b = trayAt(x, y);
        if (b) { drag = { item: b.item, x, y, sx: x, sy: y, moved: false }; api.sfx('tap'); return; }
        const p = personAt(x, y);
        if (p && selected) { give(p, selected); selected = null; }
      },
      pointerMove(x, y) {
        if (!drag) return;
        drag.x = x; drag.y = y;
        if (!drag.moved && kit.dist(x, y, drag.sx, drag.sy) > 12) drag.moved = true;
      },
      pointerUp(x, y) {
        if (!drag) return;
        const d = drag; drag = null;
        if (!d.moved) { selected = selected === d.item ? null : d.item; return; }
        const p = personAt(x, y - 26) || personAt(x, y);
        if (p) give(p, d.item);
        selected = null;
      },
      resize() { layout(); },
    };
  },
};
