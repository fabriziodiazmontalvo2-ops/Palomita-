// Panes y peces (la multiplicación de los panes, Juan 6, 1-14) — minijuego de repartir, 100 niveles.
//
// La multitud está sentada en la ladera. La canasta del niño muestra un pan o un pez: hay que tocar a alguien que lo
// esté pidiendo. La canasta nunca se vacía: Jesús hace que alcance para todos. Quien ya comió se va contento y su lugar
// lo ocupa otra persona. Al llegar a la meta del nivel… ¡sobran 12 canastas!
//
// Niveles (api.difficulty 0 → 1): más gente, más pedidos a la vez y más seguidos, menos paciencia, y cada ~10 niveles
// algo nuevo (se anuncia con un cartelito al empezar ese nivel):
//    6  llega más gente (3 filas)                       11  canasta brillante: Jesús bendice y comen varios a la vez
//                                                           (y desde aquí, un toque equivocado hace esperar a la canasta)
//   21  hay quien cambia de idea                        31  hay quien pide los dos (pan y pez)
//   41  la canasta cambia sola (reloj en la canasta)    51  llegan familias con niños (5 columnas)
//   61  atardece y sopla el viento del lago             71  ¡la multitud es enorme! (4 filas)
//   81  ya no brilla quien pide lo de la canasta        91  anochece: llegan los cinco mil (todo más rápido)
export default {
  id: 'panes',
  levels: {
    goal: [10, 60], curve: 1, time: [60, 80], selfEnd: true,
    goalLabel: n => `Da de comer a ${n} personas`,
  },
  create(api) {
    const { kit } = api;
    const { PAL, clamp, lerp, ease } = kit;
    const W = api.W;
    const FOOD = { pan: '🍞', pez: '🐟' };
    const other = f => (f === 'pan' ? 'pez' : 'pan');
    const ROBES = ['#c97b63', '#8fbc8f', '#7fb3d5', '#e9c46a', '#c9a3ff', '#e9a04b', '#f4a6b8', '#8ecae6', '#b08968', '#a8d5a2', '#f6bd60', '#d4a5a5'];
    const SKINS = ['#e8b38a', '#b9825a', '#f0c8a0', '#8d5a3b', '#d9a066'];
    const HAIRS = ['#5a3b28', '#2f1e14', '#444', '#6b4a2f', '#8a5a3c'];

    // ── Nivel ──
    const LV = api.level || 1, D = clamp(api.difficulty || 0), GOAL = Math.max(1, api.goal || 10);
    const T0 = api.timeLeft > 0 ? api.timeLeft : 60;          // segundos de este nivel (para las estrellas)
    const at = n => (n - 1) / 99;                               // dificultad del nivel n
    const from = n => clamp((D - at(n)) / (1 - at(n)));        // 0..1 desde el nivel n hasta el 100
    const F = {
      rows: LV >= 71 ? 4 : LV >= 6 ? 3 : 2,
      cols: LV >= 51 ? 5 : 4,
      blessing: LV >= 11,                 // canasta brillante
      change: LV >= 21,                   // pedidos que cambian
      both: LV >= 31,                     // quien pide los dos
      alternate: LV >= 41,                // la canasta cambia sola
      kids: LV >= 51,                     // familias con niños (más pequeños)
      wind: LV >= 61 && !api.reduceMotion,
      glow: LV < 31 ? 2 : LV < 81 ? 1 : 0, // 2 brillo fuerte · 1 borde dorado · 0 nada
      sky: LV >= 91 ? 'dusk' : LV >= 61 ? 'sunset' : 'day',
    };
    const P = {
      maxAsks: lerp(2, 6.5, D),                     // pedidos a la vez al empezar…
      maxAsksAdd: lerp(0.5, 1.5, D),                // …y cuántos más con la rampa de la partida
      askEvery: lerp(1.4, 0.45, D),                 // segundos hasta que alguien más pide (al empezar)
      askEveryEnd: lerp(1.0, 0.3, D),               // …y al final de la rampa
      patience: lerp(11, 6, D),                     // cuánto espera quien pide algo que no está en la canasta
      penalty: F.blessing ? lerp(0.4, 0.95, D) : 0, // la canasta "se acomoda" tras un toque equivocado
      eat: lerp(1.9, 1.4, D),                       // segundos comiendo antes de irse contento
      arrive: lerp(0.8, 0.5, D),                    // segundos hasta que alguien ocupa el lugar vacío
      changeChance: F.change ? lerp(0.45, 0.65, from(21)) : 0,
      changeAfter: lerp(2.8, 2, from(21)),          // segundos pidiendo antes de cambiar de idea
      bothChance: F.both ? lerp(0.14, 0.3, from(31)) : 0,
      altEvery: lerp(5, 2.6, from(41)),             // segundos entre cambios de la canasta
      blessEvery: lerp(13, 22, D), blessLife: lerp(5.5, 3.2, D),
      kidChance: F.kids ? 0.3 : 0,
      wind: F.wind ? lerp(4, 9, from(61)) : 0,
      crowd: Math.round(lerp(8, 44, D)),            // gente lejana en la colina (la gran multitud)
    };
    const NEWS = {
      6: '¡Nuevo: llega más gente a escuchar a Jesús!',
      11: '¡Nuevo: canasta brillante ✨! Tócala y Jesús reparte a varios',
      21: '¡Nuevo: algunos cambian de idea! Mira bien su globito',
      31: '¡Nuevo: hay quien pide pan y pez! Dale los dos',
      41: '¡Nuevo: la canasta cambia sola! Mira su relojito',
      51: '¡Nuevo: llegan familias con niños!',
      61: '¡Nuevo: atardece y sopla el viento del lago!',
      71: '¡Nuevo: la multitud es enorme!',
      81: '¡Nuevo: ya nadie brilla! Mira bien qué pide cada uno',
      91: '¡Nuevo: anochece y llegan los cinco mil!',
      100: '¡Nivel 100! Ayuda a Jesús a dar de comer a todos',
    };

    let t = 0, askT = 0.6, current = 'pan', next = 'pez', prevFood = 'pan', sinceSwap = 9, sparkle = 0;
    let block = 0, blockMax = 1, altT = P.altEvery, blessT = LV === 11 ? 6.6 : api.randRange(6, 10), bless = null;
    let jesusUp = 0, celebT = 0, starsWon = 3, ended = false, fedTotal = 0;
    const CELEB = 2.1;
    const people = [];              // un asiento por persona: { col, row, x, y, s, state, want, need, st, pop, … }
    const flying = [];              // comida volando: { food, fx, fy, tx, ty, t }
    const hints = [];               // cartelitos pendientes: { at, text, ms }
    const leaves = [];              // hojitas del viento
    const crowd = [];               // la gran multitud a lo lejos
    const L = {};

    // ── Gente ──
    function dress(p) {
      p.robe = api.pick(ROBES); p.skin = api.pick(SKINS); p.hair = api.pick(HAIRS);
      p.kid = api.rand() < P.kidChance;
      p.veil = !p.kid && api.rand() < 0.4 ? '#f4f1e8' : null;
      p.beard = !p.kid && !p.veil && api.rand() < 0.35;
      p.ph = api.rand() * 6.28;
    }
    function setState(p, s) { p.state = s; p.st = 0; }
    for (let r = 0; r < F.rows; r++) for (let c = 0; c < F.cols; c++) {
      const p = { col: c, row: r, x: 0, y: 0, s: 1, state: 'idle', want: 'pan', need: {}, st: 0, pop: 0, shake: 0, warn: 0, changeT: Infinity, got: false, wait: 0, food: 'pan' };
      dress(p);
      people.push(p);
    }
    for (let i = 0; i < P.crowd; i++) crowd.push({ u: api.rand(), v: api.rand(), c: api.pick(ROBES), k: api.pick(SKINS) });
    if (F.wind) for (let i = 0; i < 4; i++) leaves.push({ x: api.rand() * W, v: api.randRange(40, 80), u: api.rand(), ph: api.rand() * 6 });

    function layout() {
      const top = api.top, bottom = api.bottom, avail = bottom - top;
      L.basketY = bottom - 40;
      L.lake = top + avail * (F.rows === 4 ? 0.1 : 0.13) + 8;
      L.js = clamp(avail / 520, 0.95, 1.3);
      L.jesusY = top + Math.max(92, avail * 0.27);
      const y0 = L.jesusY + 54, y1 = L.basketY - 56;
      const n = F.rows, sp = n > 1 ? Math.min(118, (y1 - y0) / (n - 1)) : 0;
      const first = y0 + (y1 - y0 - sp * (n - 1)) * 0.4;
      const colSp = F.cols === 5 ? 71 : 84, x0 = F.cols === 5 ? 38 : 54;
      const base = clamp(sp / 72, 0.8, 1.04);
      for (const p of people) {
        p.x = x0 + p.col * colSp + (F.cols === 5 ? (p.row % 2 ? 5 : -5) : 0);
        p.y = first + p.row * sp;
        p.s0 = base * (0.94 + p.row * 0.05);
      }
      L.hitR = clamp(Math.min(colSp, sp || 120) * 0.6, 30, 46);
      L.blessX = [W / 2 - 96, W / 2 + 104];
      L.blessY = L.jesusY - 52 * L.js;
    }
    layout();
    const scaleOf = p => p.s0 * (p.kid ? 0.78 : 1);

    // Pistas del comienzo
    if (LV <= 5) hints.push({ at: 0, text: 'Toca a quien pide lo que hay en la canasta', ms: 3200 });
    if (NEWS[LV]) hints.push({ at: LV <= 5 ? 3.4 : 0, text: NEWS[LV], ms: 3000 });
    if (LV === 11) hints.push({ at: 3.3, text: 'Si te equivocas, la canasta tarda un ratito', ms: 2800 });

    // ── Pedidos ──
    const wants = (p, food) => p.state === 'ask' && !!p.need[food];
    const asking = () => people.filter(p => p.state === 'ask');
    function ask(p, want) {
      setState(p, 'ask'); p.pop = 0; p.warn = 0; p.got = false;
      p.want = want;
      p.need = want === 'both' ? { pan: true, pez: true } : { [want]: true };
      p.changeT = want !== 'both' && api.rand() < P.changeChance ? P.changeAfter * api.randRange(0.75, 1.3) : Infinity;
      api.sfx('pop');
    }
    function randomWant() { return api.rand() < P.bothChance ? 'both' : api.rand() < 0.5 ? 'pan' : 'pez'; }
    // Cambia de idea: pide lo otro (después de un aviso con el globito temblando).
    function flip(p) {
      p.want = other(p.want); p.need = { [p.want]: true }; p.pop = 0;
      p.changeT = api.rand() < 0.35 ? P.changeAfter * api.randRange(0.9, 1.4) : Infinity;
      api.sfx('bubble');
    }
    // Siempre debe haber alguien pidiendo lo que tiene la canasta.
    function ensurePlayable() {
      if (celebT > 0 || people.some(p => wants(p, current))) return;
      if (!F.alternate && people.some(p => wants(p, next)) && !people.some(p => p.state === 'idle')) { const c = current; current = next; next = c; return; }
      // alguien libre pide lo de la canasta: primero quien está sentado sin pedir, si no quien va llegando o un lugar vacío
      let free = people.filter(p => p.state === 'idle');
      if (!free.length) free = people.filter(p => p.state === 'arrive');
      if (!free.length) { free = people.filter(p => p.state === 'empty'); free.forEach(dress); }
      if (free.length) ask(api.pick(free), current);
    }
    function pickNext() {
      const w = { pan: people.filter(p => wants(p, 'pan')).length, pez: people.filter(p => wants(p, 'pez')).length };
      if (!people.some(p => p.state === 'idle') && w.pan + w.pez) return w.pan >= w.pez ? 'pan' : 'pez';
      return api.rand() < 0.5 ? 'pan' : 'pez';
    }
    function advanceBasket() {
      current = next;
      next = F.alternate ? other(current) : pickNext();
      altT = P.altEvery; sparkle = 1;
    }

    // ── Posiciones para tocar ──
    function bubbleSide(p) { return p.x > W - 66 ? -1 : 1; }
    function bubblePos(p) {
      const s = scaleOf(p), side = bubbleSide(p), wide = p.want === 'both';
      let bx = p.x + side * (wide ? 27 : 21) * s, by = p.y - 62 * s;
      if (P.wind) { bx += Math.sin(t * 1.7 + p.ph) * P.wind; by += Math.cos(t * 1.2 + p.ph) * P.wind * 0.35; }
      return [clamp(bx, wide ? 30 : 20, W - (wide ? 30 : 20)), by];
    }
    function personAt(x, y) {
      let best = null, bd = L.hitR;
      for (const p of people) {
        if (p.state === 'empty' || p.state === 'leave') continue;
        const s = scaleOf(p);
        let d = kit.dist(x, y, p.x, p.y - 28 * s);
        if (p.state === 'ask') { const [bx, by] = bubblePos(p); d = Math.min(d, kit.dist(x, y, bx, by) * 0.9); }
        if (d < bd) { bd = d; best = p; }
      }
      return best;
    }

    // ── Repartir ──
    function give(p, food, fx, fy) {
      const s = scaleOf(p);
      p.need[food] = false;
      flying.push({ food, fx, fy, tx: p.x, ty: p.y - 34 * s, t: 0 });
      if (p.need.pan || p.need.pez) {            // pidió los dos: falta el otro
        p.got = true; p.pop = 0.12;
        api.sfx('pop');
        return;
      }
      setState(p, 'fed'); p.food = p.want; p.warn = 0; fedTotal++;
      api.addScore(1, p.x, p.y - 74 * s);
      api.sfx('good');
    }
    function wrong(p) {
      const s = scaleOf(p);
      p.shake = 0.4;
      api.sfx('wrong');
      if (p.state === 'ask') api.floatText(p.x, p.y - 82 * s, `Pide ${needText(p)}`, { color: '#fff', size: 15 });
      else if (p.state === 'fed') api.floatText(p.x, p.y - 72 * s, '¡Ya comió!', { color: '#fff', size: 15 });
      if (P.penalty > 0) { block = blockMax = P.penalty; }
    }
    const needText = p => (p.need.pan ? FOOD.pan : '') + (p.need.pez ? FOOD.pez : '');
    function useBlessing() {
      const list = people.filter(p => wants(p, current));
      bless = null; jesusUp = 1.3;
      api.sfx('sparkle');
      api.burst(W / 2, L.jesusY - 50 * L.js, { emoji: '✨', count: 8, speed: 120, size: 16, life: 0.9, gravity: 0 });
      for (const p of list) give(p, current, W / 2, L.jesusY - 40 * L.js);
      checkGoal();
    }
    function tap(x, y) {
      if (celebT > 0) return;
      if (bless && kit.dist(x, y, bless.x, bless.y + Math.sin(bless.t * 3) * 4) < 32) { useBlessing(); return; }
      if (block > 0) return;                       // la canasta se está acomodando
      const p = personAt(x, y);
      if (!p) return;
      if (wants(p, current)) { give(p, current, W / 2, L.basketY - 10); advanceBasket(); }
      else if (F.alternate && sinceSwap < 0.22 && wants(p, prevFood)) { give(p, prevFood, W / 2, L.basketY - 10); altT = P.altEvery; }
      else { wrong(p); return; }
      checkGoal();
      ensurePlayable();
    }

    // ── Final: ¡sobraron 12 canastas! ──
    function checkGoal() {
      if (celebT > 0 || ended || api.score < GOAL) return;
      celebT = CELEB;
      const f = api.timeLeft / T0;
      starsWon = f >= 0.4 ? 3 : f >= 0.2 ? 2 : 1;
      if (api.timeLeft < CELEB + 0.5) api.addTime(CELEB + 0.5 - api.timeLeft);
      bless = null; jesusUp = CELEB;
      for (const p of people) if (p.state === 'ask') setState(p, 'idle');
      api.hint('¡Todos comieron y sobraron 12 canastas! 🧺', 2400);
      api.sfx('sparkle');
    }

    function drawBubble(g, p) {
      const s = scaleOf(p), [bx, by] = bubblePos(p), k = ease.outBack(clamp(p.pop / 0.25));
      const match = !!p.need[current] && block <= 0;
      const wob = p.warn > 0 ? Math.sin(t * 30) * 0.22 : 0;
      const sz = p.kid ? 0.88 : 1;
      g.save(); g.translate(bx, by); g.rotate(wob); g.scale(k * sz, k * sz);
      const pulse = match && F.glow ? 1 + Math.sin(t * 7) * 0.05 : 1;
      const stroke = match && F.glow ? PAL.sunDeep : 'rgba(61,43,36,0.18)';
      if (p.want === 'both') {
        const w = 52 * pulse, hh = 34 * pulse;
        if (match && F.glow === 2) kit.fillRR(g, -w / 2 - 6, -hh / 2 - 6, w + 12, hh + 12, hh / 2 + 6, 'rgba(255,214,90,0.45)');
        kit.fillRR(g, -w / 2, -hh / 2 + 2, w, hh, hh / 2, 'rgba(50,40,30,0.15)');
        kit.fillRR(g, -w / 2, -hh / 2, w, hh, hh / 2, '#ffffff', stroke, 3);
        g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-14 * bubbleSide(p), 12); g.lineTo(-19 * bubbleSide(p), 22); g.lineTo(-5 * bubbleSide(p), 15); g.fill();
        kit.emoji(g, FOOD.pan, -12, 0, 19, { alpha: p.need.pan ? 1 : 0.3 });
        kit.emoji(g, FOOD.pez, 12, 0, 19, { alpha: p.need.pez ? 1 : 0.3 });
        if (!p.need.pan) kit.text(g, '✓', -12, 1, { size: 18, color: PAL.leafDeep });
        if (!p.need.pez) kit.text(g, '✓', 12, 1, { size: 18, color: PAL.leafDeep });
      } else {
        const r = 17 * pulse;
        if (match && F.glow === 2) kit.circle(g, 0, 0, r + 7, 'rgba(255,214,90,0.45)');
        kit.circle(g, 0, 2, r, 'rgba(50,40,30,0.15)');
        kit.circle(g, 0, 0, r, '#ffffff', stroke, 3);
        const sd = bubbleSide(p);
        g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-9 * sd, 12); g.lineTo(-14 * sd, 22); g.lineTo(-1 * sd, 15); g.fill();
        kit.emoji(g, FOOD[p.want], 0, 0, 20);
        if (p.warn > 0) kit.emoji(g, '❓', 15 * sd, -14, 13);
      }
      g.restore();
    }

    return {
      update(dt) {
        t += dt;
        if (sparkle > 0) sparkle -= dt * 2.5;
        if (jesusUp > 0) jesusUp -= dt;
        if (block > 0) block -= dt;
        sinceSwap += dt;
        for (let i = hints.length - 1; i >= 0; i--) if (t >= hints[i].at) { api.hint(hints[i].text, hints[i].ms); hints.splice(i, 1); }
        for (const l of leaves) { l.x += l.v * dt; if (l.x > W + 20) { l.x = -20; l.u = api.rand(); } }
        for (let i = flying.length - 1; i >= 0; i--) { flying[i].t += dt / 0.36; if (flying[i].t >= 1) flying.splice(i, 1); }
        for (const p of people) {
          p.st += dt; p.pop += dt; if (p.shake > 0) p.shake -= dt;
          if (p.state === 'arrive') { if (p.st >= 0.45) setState(p, 'idle'); }
          else if (p.state === 'fed') {
            if (p.st >= P.eat) {   // se va contento (y da las gracias con un corazoncito)
              setState(p, 'leave');
              api.burst(p.x, p.y - 62 * scaleOf(p), { emoji: '💛', count: 1, speed: 16, size: 14, gravity: -50, life: 0.8 });
            }
          }
          else if (p.state === 'leave') { if (p.st >= 0.4) { setState(p, 'empty'); p.wait = P.arrive * api.randRange(0.7, 1.3); } }
          else if (p.state === 'empty') { p.wait -= dt; if (p.wait <= 0 && celebT <= 0) { dress(p); setState(p, 'arrive'); } }
          else if (p.state === 'ask') {
            if (p.warn > 0) { p.warn -= dt; if (p.warn <= 0) flip(p); }
            else if (p.changeT < Infinity) { p.changeT -= dt; if (p.changeT <= 0) p.warn = 0.75; }
            // se cansa de esperar algo que no está en la canasta y se sienta (después volverá a pedir)
            if (!p.got && !p.need[current] && p.warn <= 0 && p.st > P.patience) setState(p, 'idle');
          }
        }
        if (celebT > 0) {
          celebT -= dt;
          if (celebT <= 0 && !ended) { ended = true; api.end({ won: true, stars: starsWon }); }
          return;
        }
        // la canasta cambia sola
        if (F.alternate) {
          altT -= dt;
          if (altT <= 0) { prevFood = current; current = next; next = other(current); altT = P.altEvery; sinceSwap = 0; api.sfx('tap'); }
        }
        // canasta brillante
        if (F.blessing) {
          if (bless) { bless.t += dt; bless.life -= dt; if (bless.life <= 0) bless = null; }
          else if ((blessT -= dt) <= 0) {
            const side = api.rand() < 0.5 ? 0 : 1;
            bless = { side, x: L.blessX[side], y: L.blessY, t: 0, life: P.blessLife };
            blessT = P.blessEvery * api.randRange(0.85, 1.15);
            api.sfx('sparkle');
          }
        }
        // pedidos nuevos (la partida se va poniendo más movida)
        const ramp = clamp(api.time / 45);
        const maxA = Math.min(people.length - 3, Math.round(P.maxAsks + P.maxAsksAdd * ramp));
        if (asking().length < maxA && (askT -= dt) <= 0) {   // el reloj solo corre si cabe otro pedido
          const idle = people.filter(p => p.state === 'idle');
          if (idle.length) { ask(api.pick(idle), randomWant()); askT = lerp(P.askEvery, P.askEveryEnd, ramp) * api.randRange(0.8, 1.2); }
        }
        ensurePlayable();
      },
      draw(g) {
        const H = api.H, top = api.top;
        // cielo según la hora del día (avanza con los niveles)
        if (F.sky === 'day') {
          kit.sky(g, W, H, 'day');
          kit.sun(g, lerp(48, 300, D / 0.6), Math.min(top + 30 + D * 12, L.lake - 30), 19, t);
          kit.cloud(g, 250 - D * 160 + Math.sin(t * 0.25) * 16, top + 30, 0.8, 0.9);
        } else {
          kit.sky(g, W, H, 'sunset');
          if (F.sky === 'dusk') {
            const gr = g.createLinearGradient(0, 0, 0, L.lake + 30);
            gr.addColorStop(0, 'rgba(28,37,80,0.85)'); gr.addColorStop(1, 'rgba(58,63,134,0.15)');
            g.fillStyle = gr; g.fillRect(0, 0, W, L.lake + 30);
            kit.stars(g, W, L.lake - 10, t, 22);
            kit.moon(g, 66, top + 30, 12);
          }
          kit.sun(g, 296, L.lake - (F.sky === 'dusk' ? 0 : 10), 20, t);
          kit.cloud(g, 120 + Math.sin(t * 0.25) * 14, top + 34, 0.7, 0.7, F.sky === 'dusk' ? '#c9b6e8' : '#ffe2c4');
        }
        const dusk = F.sky === 'dusk', warm = F.sky !== 'day';
        kit.hills(g, W, H, L.lake - 14, 10, dusk ? '#8c8fc4' : warm ? '#c6b3d8' : '#b7c9e8', 60, 0.014);
        kit.water(g, W, L.lake + 46, L.lake, t, dusk ? '#8d9ad6' : warm ? '#f2b98f' : '#7cc8f5', dusk ? '#5b6fb5' : warm ? '#7ab0dc' : '#58b7ea');
        kit.emoji(g, '⛵', 290 + Math.sin(t * 0.4) * 8, L.lake + 14, 18);
        kit.hills(g, W, H, L.lake + 38, 12, dusk ? '#8fc27f' : PAL.leafLight, 120, 0.01);
        // la gran multitud a lo lejos
        for (const c of crowd) {
          const x = 8 + c.u * (W - 16), y = L.lake + 50 + c.v * 12;
          kit.circle(g, x, y + 4, 4.6, c.c); kit.circle(g, x, y - 1.5, 3, c.k);
        }
        g.fillStyle = dusk ? '#5ea866' : PAL.leaf; g.fillRect(0, L.lake + 62, W, H);
        kit.hills(g, W, H, L.jesusY + 30, 8, dusk ? '#6dbd73' : '#7ccf80', 200, 0.013);
        for (let i = 0; i < 6; i++) kit.flower(g, i < 3 ? 22 + i * 38 : W - 22 - (i - 3) * 38, L.jesusY + 8 + ((i * 37) % 16), 0.75, i % 2 ? PAL.rose : '#fff');
        // Jesús bendice; a su lado, el niño de la canasta
        kit.person(g, W / 2, L.jesusY, L.js, { robe: '#f8f4ea', sash: '#c0392b', beard: true, hair: '#6b4a2f', skin: '#e0ae84', arms: jesusUp > 0 ? 'up' : 'open', t });
        kit.person(g, W / 2 + 40 * L.js, L.jesusY + 4, 0.65 * L.js, { robe: '#7fb3d5', hair: '#3b2a20', skin: '#c99a6a', arms: 'up', t });
        // canasta brillante
        if (bless) {
          const a = clamp(bless.life / 0.6) * clamp(bless.t / 0.3), by = bless.y + Math.sin(bless.t * 3) * 4;
          kit.circle(g, bless.x, by, 26 + Math.sin(t * 6) * 3, `rgba(255,214,90,${0.45 * a})`);
          kit.emoji(g, '🧺', bless.x, by, 30, { alpha: a });
          kit.emoji(g, '✨', bless.x + 16, by - 16, 15, { alpha: a * (0.6 + 0.4 * Math.sin(t * 8)) });
        }
        // la multitud (de atrás hacia adelante)
        for (const p of people) {
          if (p.state === 'empty') continue;
          const s = scaleOf(p);
          const sx = p.x + (p.shake > 0 ? Math.sin(p.shake * 42) * 4 : 0);
          const fed = p.state === 'fed', ask = p.state === 'ask';
          let dy = fed && p.st < 0.5 ? -Math.sin(p.st / 0.5 * Math.PI) * 6 : 0, alpha = 1;
          if (p.state === 'arrive') { alpha = clamp(p.st / 0.45); dy = -10 * (1 - alpha); }
          else if (p.state === 'leave') { alpha = 1 - clamp(p.st / 0.4); dy = -8 * (1 - alpha); }
          g.save(); g.globalAlpha = alpha;
          kit.person(g, sx, p.y + dy, s, { robe: p.robe, skin: p.skin, hair: p.hair, veil: p.veil, beard: p.beard, arms: ask ? 'up' : 'down', sad: ask && !p.need[current] && p.st > P.patience * 0.65, t: t + p.col });
          if ((fed && p.st > 0.3) || p.state === 'leave') {
            if (p.food === 'both') { kit.emoji(g, FOOD.pan, sx - 12 * s, p.y - 20 * s + dy, 13 * s); kit.emoji(g, FOOD.pez, sx + 13 * s, p.y - 20 * s + dy, 13 * s); }
            else kit.emoji(g, FOOD[p.food], sx + 13 * s, p.y - 20 * s + dy, 14 * s);
          }
          g.restore();
        }
        // hojitas del viento del lago (detrás de los globitos)
        for (const l of leaves) kit.emoji(g, '🍃', l.x, L.lake + 70 + l.u * (L.basketY - L.lake - 120) + Math.sin(t * 2 + l.ph) * 10, 14, { rot: Math.sin(t * 3 + l.ph), alpha: 0.85 });
        for (const p of people) if (p.state === 'ask') drawBubble(g, p);
        // comida volando
        for (const f of flying) {
          const k = ease.outCubic(clamp(f.t));
          kit.emoji(g, FOOD[f.food], lerp(f.fx, f.tx, k), lerp(f.fy, f.ty, k) - Math.sin(k * Math.PI) * 50, 26, { rot: k * 4 });
        }
        // la canasta: alimento actual (grande) y el que sigue (pequeño)
        const bx = W / 2, by = L.basketY;
        kit.shadow(g, bx, by + 30, 52, 9, 0.2);
        const wob = block > 0 ? Math.sin(block * 40) * 0.25 : 0;
        if (F.alternate && celebT <= 0) {
          const k = clamp(altT / P.altEvery);
          kit.circle(g, bx, by - 10, 31, 'rgba(255,255,255,0.55)');
          g.save(); g.strokeStyle = k < 0.3 ? PAL.coral : PAL.sunDeep; g.lineWidth = 5; g.lineCap = 'round';
          g.beginPath(); g.arc(bx, by - 10, 31, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); g.stroke(); g.restore();
        }
        kit.emoji(g, FOOD[current], bx, by - 8 - Math.max(0, sparkle) * 6, 44 * (1 + Math.max(0, sparkle) * 0.15), { rot: wob, alpha: block > 0 ? 0.45 : 1 });
        kit.fillRR(g, bx - 46, by + 2, 92, 30, 13, '#b98556');
        g.save(); g.strokeStyle = '#96643a'; g.lineWidth = 2.5; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(bx + i * 12, by + 5); g.lineTo(bx + i * 12 + 5, by + 29); g.stroke(); } g.restore();
        kit.fillRR(g, bx - 50, by - 2, 100, 9, 4.5, '#c99562');
        if (block > 0) {
          g.save(); g.strokeStyle = 'rgba(61,43,36,0.55)'; g.lineWidth = 4; g.lineCap = 'round';
          g.beginPath(); g.arc(bx, by - 10, 22, -Math.PI / 2, -Math.PI / 2 + (1 - block / blockMax) * Math.PI * 2); g.stroke(); g.restore();
        }
        if (sparkle > 0) kit.emoji(g, '✨', bx + 34, by - 26, 18, { alpha: clamp(sparkle) });
        kit.fillRR(g, bx + 62, by - 2, 64, 32, 16, 'rgba(255,255,255,0.9)');
        kit.text(g, 'Sigue', bx + 84, by + 14, { size: 12, color: PAL.inkSoft });
        kit.emoji(g, FOOD[next], bx + 110, by + 14, 18);
        // ¡sobraron 12 canastas!
        if (celebT > 0 || ended) {
          const e = ended ? CELEB : CELEB - celebT, cy = (L.jesusY + L.basketY) / 2 - 20;
          kit.fillRR(g, 10, cy - 30, W - 20, 104, 26, `rgba(255,250,240,${0.7 * clamp(e / 0.3)})`);
          for (let i = 0; i < 12; i++) {
            const k = clamp((e - i * 0.09) / 0.3);
            if (k <= 0) continue;
            kit.emoji(g, '🧺', 40 + (i % 6) * 56, cy + Math.floor(i / 6) * 44, 30 * ease.outBack(k));
          }
        }
      },
      pointerDown(x, y) { tap(x, y); },
      resize() { layout(); if (bless) { bless.x = L.blessX[bless.side]; bless.y = L.blessY; } },
      // Solo lectura, para las pruebas automáticas.
      get debug() {
        return {
          level: LV, goal: GOAL, current, next, block, fedTotal, celebrate: celebT > 0,
          swapIn: F.alternate ? altT : null, features: { ...F }, params: { ...P },
          blessing: bless ? { x: bless.x, y: bless.y + Math.sin(bless.t * 3) * 4, life: bless.life } : null,
          people: people.map(p => {
            const s = scaleOf(p), [bx, by] = p.state === 'ask' ? bubblePos(p) : [p.x, p.y];
            return { x: p.x, y: p.y - 28 * s, bx, by, state: p.state, want: p.want, need: Object.keys(p.need).filter(k => p.need[k]), st: p.st, changing: p.warn > 0, kid: p.kid };
          }),
        };
      },
    };
  },
};
