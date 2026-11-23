// El grano de mostaza (Mateo 13, 31-32) — minijuego de atrapar.
//
// El niño lleva de lado a lado una macetita donde está sembrada la semilla más pequeña. Las gotas de agua y los
// rayitos de sol la hacen crecer poco a poco: semilla → brote → plantita → arbusto. Los bichitos y los cardos
// espinosos quitan una vida si caen sobre la planta (si pasan de largo no pasa nada, y dejar caer lo bueno no castiga).
// Al llegar a la meta la planta se siembra en el campo, se vuelve un gran árbol y los pajaritos vienen a posarse
// en sus ramas, como cuenta la parábola.
export default {
  id: 'mostaza',
  create(api) {
    const { kit } = api;
    const { PAL, clamp, lerp, ease } = kit;
    const W = api.W;
    const GOAL = api.goal || 30;
    const calm = !!api.reduceMotion;

    // ── Ajustes ──
    const STAGES = [
      { at: 5, text: '¡Brotó!' },
      { at: 10, text: '¡Qué linda plantita!' },
      { at: 20, text: '¡Ya es un arbusto!' },
    ];
    const CELEBRATE = 2.9;          // segundos de fiesta antes de terminar
    const PAD_GOOD = 14;            // margen indulgente para atrapar lo bueno
    const PAD_BAD = -4;             // lo malo tiene que caer bien encima para contar
    const POT = '#dc8d62', POT_RIM = '#eba57c', POT_SHADE = '#c17450', SOIL = '#6f4a33', SOIL_LIGHT = '#8a5f43';
    const STEM_GREEN = [86, 178, 98], STEM_WOOD = [166, 113, 72];
    // Copa: [x, y, radio, color, soloÁrbolGrande] en «unidades de copa» respecto a la punta del tronco (y negativa = arriba).
    const BLOBS = [
      [-37, 8, 15, PAL.leafDeep, 1], [37, 6, 16, '#58b565', 1],
      [-19, 2, 17, PAL.leafDeep, 0], [19, 0, 18, PAL.leaf, 0], [0, 5, 17, '#5fb968', 0],
      [-18, -21, 15, '#8ad37a', 1], [18, -20, 15, '#96d982', 1],
      [0, -15, 19, PAL.leafLight, 0],
    ];
    // Florecitas amarillas de mostaza: [x, y, nace con este crecimiento] (31 = solo en el árbol grande).
    const FLOWERS = [[-20, -3, 13], [12, -19, 15], [25, 3, 17], [-4, 6, 20], [-7, -27, 23], [-38, 4, 31], [38, 0, 31], [21, -29, 31], [-25, -28, 31], [2, -12, 31]];
    // Dónde se posan los pajaritos en el árbol grande (unidades de copa) y hacia dónde miran.
    const PERCHES = [[-38, -6, 1, 0.44], [-18, -35, 1, 0.4], [1, -33.5, -1, 0.46], [19, -34, -1, 0.4], [38, -9, -1, 0.44]];

    // ── Estado ──
    let t = 0;
    let mode = 'play';              // play | celebrate | done
    let px = W / 2, targetX = W / 2, vx = 0;
    let lean = 0, leanV = 0;        // inclinación de la planta (muelle)
    let grown = 0;                  // crecimiento mostrado (sigue al puntaje con suavidad)
    let stageIdx = 0, popT = 9, gulp = 0, hurtT = 0, invul = 0;
    const items = [];               // lo que cae
    let spawnT = 1.5, spawned = 0, badRun = 0, sinceBad = 0, lastGoodX = W / 2, lastKind = '', warned = false;
    let cT = 0, cFromX = W / 2, cBurst = 0;
    const birds = [];
    const L = { groundY: 0, potBase: 0, potTop: 0, potH: 0, potHalf: 0, spawnY: 0, playH: 300, baseY: 0 };
    const S = { stemH: 0, stemW: 2, cs: 0, e: 0, tipX: 0 };   // forma actual de la planta
    const fol = { on: false, cx: 0, cy: 0, rx: 0, ry: 0 };     // zona de follaje (para atrapar)
    // Adornos fijos del campo.
    const deco = [];
    for (let i = 0; i < 7; i++) {
      deco.push({ x: 20 + i * 54 + api.randRange(-12, 12), dy: api.randRange(18, 40), flower: i % 2 === 1, color: api.pick([PAL.rose, '#ffffff', PAL.sun, '#c9a7ff']), s: api.randRange(0.9, 1.2) });
    }
    const clouds = [
      { x: api.randRange(0, W), y: 0.08, s: 0.95, v: 5 },
      { x: api.randRange(0, W), y: 0.27, s: 0.7, v: 8 },
      { x: api.randRange(0, W), y: 0.45, s: 0.55, v: 4 },
    ];

    api.setProgress(0);
    api.hint('Mueve la maceta: atrapa 💧 y ☀️', 2300);

    // ── Utilidades ──
    // Curva por tramos: pts = [[x0, y0], [x1, y1], …]
    function pw(v, pts) {
      if (v <= pts[0][0]) return pts[0][1];
      for (let i = 1; i < pts.length; i++) {
        if (v <= pts[i][0]) return lerp(pts[i - 1][1], pts[i][1], (v - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
      }
      return pts[pts.length - 1][1];
    }
    const grow = (a, b) => clamp((grown - a) / (b - a));
    function mix(a, b, k) {
      return `rgb(${Math.round(lerp(a[0], b[0], k))},${Math.round(lerp(a[1], b[1], k))},${Math.round(lerp(a[2], b[2], k))})`;
    }
    function bigE() {               // 0 → 1 con un pequeño rebote: la planta se hace árbol
      if (mode === 'play') return 0;
      const u = clamp(cT / 0.85);
      return calm ? ease.outCubic(u) : ease.outBack(u);
    }

    // Calcula la distribución según el alto actual y el crecimiento. Se llama en cada cuadro (es barato).
    function layout() {
      const H = api.H;
      const k = clamp(grown / GOAL);
      const e = bigE(), e1 = clamp(e);
      L.groundY = H - clamp(H * 0.105, 52, 78);
      L.potBase = L.groundY + 14;
      L.potHalf = lerp(30, 40, k);
      L.potH = lerp(34, 40, k);
      L.potTop = L.potBase - L.potH;
      L.spawnY = api.top + 8;
      L.playH = Math.max(180, L.potTop - L.spawnY);
      // Base de la planta: sobre la tierra de la maceta; en la fiesta baja hasta el suelo (queda sembrada en el campo).
      L.baseY = lerp(L.potTop - 3, L.potBase - 9, e1);

      // Forma de la planta.
      let stemH = pw(grown, [[0, 0], [1, 3], [5, 19], [10, 38], [20, 52], [30, 66]]);
      let stemW = pw(grown, [[0, 2.4], [5, 3.4], [10, 4.6], [20, 8.5], [30, 11.5]]);
      let cs = pw(grown, [[8, 0], [10, 0.3], [20, 0.9], [30, 1.2]]);
      if (e > 0) {
        const room = L.potBase - 9 - (api.top + 50);
        const treeH = clamp(room * 0.76, 150, 280);
        const bigCs = Math.min(246, treeH * 1.04) / 106;
        stemH = lerp(stemH, treeH - 37 * bigCs, e);
        stemW = lerp(stemW, 21, e);
        cs = lerp(cs, bigCs, e);
      }
      S.stemH = stemH; S.stemW = stemW; S.cs = cs; S.e = e;
      S.tipX = Math.sin(lean) * stemH;

      // Zona de follaje: al principio son las hojitas del tallo; después, la copa.
      fol.on = stemH > 7;
      if (fol.on) {
        const leaf = 7 + 15 * grow(3.5, 8);
        const wgt = clamp((cs - 0.2) / 0.4);
        fol.rx = lerp(leaf, 37 * cs, wgt);
        fol.ry = lerp(stemH * 0.36 + 6, 27 * cs, wgt);
        fol.cx = px + S.tipX * lerp(0.7, 1, wgt);
        fol.cy = L.baseY - lerp(stemH * 0.72, stemH + 7 * cs, wgt);
      }
    }

    // ¿El objeto toca la boca de la maceta o el follaje? pad > 0 = indulgente; pad < 0 = estricto.
    function touches(it, pad) {
      if (it.y > L.potTop - 13 - pad && it.y < L.potTop + 8 + pad && Math.abs(it.x - px) < L.potHalf + pad) return true;
      if (fol.on) {
        const dx = (it.x - fol.cx) / Math.max(4, fol.rx + pad), dy = (it.y - fol.cy) / Math.max(4, fol.ry + pad);
        if (dx * dx + dy * dy < 1) return true;
      }
      return false;
    }

    // Dificultad 0..1: sube sobre todo con el puntaje (y un poquito con el tiempo).
    function difficulty() {
      return clamp(0.8 * Math.max(0, api.score - 3) / (GOAL - 3) + 0.2 * clamp((t - 12) / 60));
    }

    // ── Aparición de objetos ──
    function spawn() {
      const d = difficulty();
      const tall = clamp((L.playH - 340) / 290);
      const fallT = lerp(3.1 + tall * 0.9, 2.0 + tall * 0.6, d);
      const vy = (L.playH / fallT) * api.randRange(0.95, 1.05);

      // ¿Bueno o malo? Al principio no hay nada malo; después aparece poco a poco.
      let bad = false;
      let badsNow = 0;
      for (const it of items) if (!it.good && it.state === 'fall') badsNow++;
      if (api.score >= 3 && t > 7 && badRun < 2 && badsNow < 3) {
        bad = api.rand() < lerp(0.13, 0.34, d) || sinceBad >= 7;
      }
      let kind;
      if (bad) kind = api.rand() < 0.62 ? 'bug' : 'weed';
      else kind = lastKind === 'drop' ? (api.rand() < 0.6 ? 'sun' : 'drop') : (api.rand() < 0.6 ? 'drop' : 'sun');

      // ¿Dónde? Lo malo a veces apunta a la planta (para que haya que esquivar); lo bueno, a un lugar alcanzable.
      const lo = 30, hi = W - 30;
      const minSep = L.potHalf * 2 + 36;
      let x = W / 2;
      for (let tries = 0; tries < 10; tries++) {
        if (spawned < 3) x = px + api.pick([-1, 1]) * api.randRange(36, 96);
        else if (bad && !warned) x = px + api.pick([-1, 1]) * api.randRange(100, 150);
        else if (bad && api.rand() < lerp(0.3, 0.52, d)) x = px + api.randRange(-14, 14);
        else if (bad) x = api.randRange(lo, hi);
        else { const jump = lerp(150, 300, d); x = lastGoodX + api.randRange(-jump, jump); }
        if (x < lo) x = lo + (lo - x) * 0.5;
        if (x > hi) x = hi - (x - hi) * 0.5;
        x = clamp(x, lo, hi);
        // Nada malo pegadito a algo bueno recién salido (sería injusto), ni dos cosas encimadas.
        let ok = true;
        for (const it of items) {
          if (it.state !== 'fall' || it.y > L.spawnY + 110) continue;
          const sep = it.good !== !bad ? minSep : 34;
          if (Math.abs(it.x0 - x) < sep) { ok = false; break; }
        }
        if (ok) break;
        if (tries === 9 && bad) { bad = false; kind = 'drop'; x = clamp(lastGoodX + api.randRange(-60, 60), lo, hi); }
      }

      const it = {
        kind, good: !bad, x, x0: x, y: L.spawnY, vy, age: 0, state: 'fall', life: 1, max: 1, vx: 0, vy2: 0, rot: 0, vr: 0,
        ph: api.rand() * 6.28, wf: 0, wa: 0,
      };
      if (kind === 'sun') { it.wf = 2.2; it.wa = 7; }
      if (kind === 'bug') { it.wf = 5; it.wa = 4; }
      items.push(it);
      spawned++;
      if (bad) {
        badRun++; sinceBad = 0;
        if (!warned) { warned = true; api.hint('¡Esquiva bichitos 🐛 y espinas!', 1900); }
      } else { badRun = 0; sinceBad++; lastGoodX = x; lastKind = kind; }

      spawnT = lerp(1.08, 0.64, d) * api.randRange(0.88, 1.12);
    }

    // ── Sucesos ──
    function catchGood(it) {
      const water = it.kind === 'drop';
      api.addScore(1, it.x, it.y - 12);
      api.setProgress(api.score / GOAL);
      api.sfx(water ? 'drop' : 'coin');
      api.burst(it.x, it.y, { color: water ? '#bfe6ff' : PAL.sun, count: 8, speed: 110, size: 4.5, life: 0.5 });
      gulp = 1;
      if (stageIdx < STAGES.length && api.score >= STAGES[stageIdx].at) {
        let st = STAGES[stageIdx++];
        while (stageIdx < STAGES.length && api.score >= STAGES[stageIdx].at) st = STAGES[stageIdx++];
        popT = 0;
        api.sfx('grow');
        api.burst(px, L.potTop - S.stemH * 0.7 - 8, { emoji: '🍃', count: 7, speed: 130, size: 15, life: 0.8, gravity: 160 });
        api.floatText(clamp(px, 86, W - 86), L.potTop - S.stemH - 42, st.text, { color: '#fffbe0', size: 22 });
      }
      if (api.score >= GOAL) startCelebration();
    }
    function bounce(it, hard) {
      it.state = 'bounce';
      it.life = it.max = 0.7;
      const dir = it.x === px ? (api.rand() < 0.5 ? -1 : 1) : Math.sign(it.x - px);
      it.vx = dir * (hard ? 150 : 90); it.vy2 = hard ? -230 : -150; it.vr = dir * 7;
    }
    function hitBad(it) {
      invul = 1.25; hurtT = 0.9;
      leanV += (it.x < px ? 1 : -1) * 3.2;
      bounce(it, true);
      api.loseLife(it.x, it.y - 6);   // el motor pone el sonido, la sacudida y el corazón roto
    }
    function land(it) {
      if (it.good) {
        if (it.kind === 'drop') api.burst(it.x, L.groundY + 12, { color: '#bfe6ff', count: 4, speed: 60, size: 3.5, life: 0.35 });
        it.state = 'fade'; it.life = it.max = 0.25;
      } else {
        it.state = 'fade'; it.life = it.max = 0.6;
        it.vx = (it.x < W / 2 ? -1 : 1) * 26;
      }
      it.vy2 = 0;
    }
    function startCelebration() {
      mode = 'celebrate'; cT = 0; cFromX = px; cBurst = 0; invul = 0; hurtT = 0;
      for (const it of items) if (it.state === 'fall') { it.state = 'fade'; it.life = it.max = 0.35; it.vx = 0; it.vy2 = 0; }
      api.sfx('grow');
      birds.length = 0;
      const order = api.shuffle([0, 1, 2, 3, 4]);
      order.forEach((pi, n) => {
        const p = PERCHES[pi];
        birds.push({ ux: p[0], uy: p[1], dir: p[2], s: p[3], start: 0.55 + n * 0.24, side: p[0] < 0 ? -1 : 1, rise: api.randRange(50, 120), landed: false, landT: 0, ph: api.rand() * 6.28 });
      });
    }

    // Punto de la copa (unidades de copa) → coordenadas de pantalla, con la misma inclinación que la planta.
    function crownPoint(ux, uy, out) {
      const lx = ux * S.cs, ly = -S.stemH + uy * S.cs;
      const c = Math.cos(lean), s = Math.sin(lean);
      out.x = px + lx * c - ly * s;
      out.y = L.baseY + lx * s + ly * c;
      return out;
    }
    const tmpP = { x: 0, y: 0 };

    // ── Lógica ──
    function update(dt) {
      t += dt;
      for (const c of clouds) { c.x += c.v * dt; if (c.x > W + 70) c.x = -70; }
      if (popT < 9) popT += dt;
      gulp = Math.max(0, gulp - dt * 4.5);
      hurtT = Math.max(0, hurtT - dt);
      invul = Math.max(0, invul - dt);

      if (mode === 'play') {
        // La maceta sigue al dedo (o a las flechas) con suavidad.
        let dir = 0;
        if (api.keys.has('left')) dir -= 1;
        if (api.keys.has('right')) dir += 1;
        if (dir) targetX += dir * 340 * dt;
        targetX = clamp(targetX, L.potHalf + 6, W - L.potHalf - 6);
        const old = px;
        px = lerp(px, targetX, 1 - Math.exp(-dt * 15));
        if (Math.abs(targetX - px) < 0.3) px = targetX;
        vx = (px - old) / dt;
        grown += (api.score - grown) * (1 - Math.exp(-dt * 5));
      } else {
        // Fiesta: la planta va al centro, se siembra en el campo y se hace un gran árbol.
        cT += dt;
        const old = px;
        px = lerp(cFromX, W / 2, ease.inOut(clamp(cT / 0.7)));
        vx = (px - old) / dt;
        grown += (GOAL - grown) * (1 - Math.exp(-dt * 8));
      }
      // Inclinación con muelle: la planta se mece al moverse.
      const want = calm ? 0 : clamp(-vx * 0.0011, -0.3, 0.3) * (mode === 'play' ? 1 : 0.3) + Math.sin(t * 1.7) * 0.022;
      leanV += ((want - lean) * 90 - leanV * 11) * dt;
      lean = clamp(lean + leanV * dt, -0.5, 0.5);

      layout();

      if (mode === 'play') {
        spawnT -= dt;
        if (spawnT <= 0 && items.length < 14) spawn();
      }

      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        it.age += dt;
        if (it.state === 'fall') {
          it.y += it.vy * dt;
          it.x = it.x0 + Math.sin(it.ph + it.age * it.wf) * it.wa;
          if (mode === 'play') {
            if (it.good) {
              if (touches(it, PAD_GOOD)) { items.splice(i, 1); catchGood(it); continue; }
            } else if (touches(it, PAD_BAD)) {
              if (invul > 0) bounce(it, false); else hitBad(it);
              continue;
            }
          }
          if (it.y > L.groundY + 12) land(it);
        } else {
          it.life -= dt;
          if (it.life <= 0) { items.splice(i, 1); continue; }
          it.x += it.vx * dt; it.y += it.vy2 * dt; it.rot += it.vr * dt;
          if (it.state === 'bounce') it.vy2 += 620 * dt;
        }
      }

      if (mode === 'celebrate') {
        if (cBurst === 0 && cT > 0.12) { cBurst = 1; api.burst(px, L.baseY - 60, { emoji: '🍃', count: 10, speed: 190, size: 16, life: 1, gravity: 150 }); }
        if (cBurst === 1 && cT > 0.5) { cBurst = 2; api.sfx('sparkle'); api.burst(px, L.baseY - S.stemH, { color: '#fff3a8', count: 16, speed: 200, size: 5, life: 0.8, gravity: 120 }); }
        for (const b of birds) {
          const u = (cT - b.start) / 0.85;
          if (u >= 1 && !b.landed) {
            b.landed = true;
            crownPoint(b.ux, b.uy, tmpP);
            api.sfx('chirp');
            api.burst(tmpP.x, tmpP.y - 26, { emoji: '🎵', count: 1, speed: 26, size: 15, life: 0.9, gravity: -70 });
          }
          if (b.landed) b.landT += dt;
        }
        if (cT >= CELEBRATE) { mode = 'done'; api.end({ won: true }); }
      }
    }

    // ── Dibujo ──
    function drawBackground(g) {
      const H = api.H, top = api.top;
      kit.sky(g, W, H, 'day');
      kit.sun(g, W - 52, top + 44, 22, t);
      const span = Math.max(120, L.groundY - top - 120);
      for (const c of clouds) kit.cloud(g, c.x, top + 34 + c.y * span, c.s, 0.9);
      if (mode !== 'play') {
        // Arcoíris de fiesta detrás del árbol.
        const a = clamp((cT - 0.25) / 0.6) * 0.5;
        if (a > 0) kit.rainbow(g, W / 2, L.groundY + 6, Math.min(168, (L.groundY - top) * 0.62), 7, a);
      }
      kit.hills(g, W, H, L.groundY - 40, 15, '#c9eeb2', 40, 0.011);
      kit.hills(g, W, H, L.groundY - 14, 11, PAL.leafLight, 150, 0.014);
      kit.ground(g, W, H, L.groundY, PAL.leaf, '#8ad37a');
      for (const d of deco) {
        const y = Math.min(H - 6, L.groundY + d.dy);
        if (d.flower) kit.flower(g, d.x, y, d.s, d.color); else kit.grass(g, d.x, y, d.s, PAL.leafDeep);
      }
    }

    function drawPot(g, x, baseY, half, hgt) {
      const top = baseY - hgt, rim = 11;
      const tw = half * 0.9, bw = half * 0.64;
      g.save();
      g.fillStyle = POT;
      g.beginPath();
      g.moveTo(x - tw, top + rim - 3); g.lineTo(x + tw, top + rim - 3);
      g.lineTo(x + bw, baseY - 6); g.quadraticCurveTo(x + bw - 1, baseY, x + bw - 7, baseY);
      g.lineTo(x - bw + 7, baseY); g.quadraticCurveTo(x - bw + 1, baseY, x - bw, baseY - 6);
      g.closePath(); g.fill();
      // sombra suave a la derecha
      g.fillStyle = POT_SHADE; g.globalAlpha = 0.55;
      g.beginPath();
      g.moveTo(x + tw * 0.5, top + rim - 3); g.lineTo(x + tw, top + rim - 3);
      g.lineTo(x + bw, baseY - 6); g.quadraticCurveTo(x + bw - 1, baseY, x + bw - 7, baseY); g.lineTo(x + bw * 0.42, baseY);
      g.closePath(); g.fill();
      g.restore();
      kit.fillRR(g, x - half, top, half * 2, rim, 5.5, POT_RIM);
      kit.fillRR(g, x - half + 6, top + 2.5, half * 0.7, 3, 1.5, 'rgba(255,255,255,0.4)');
      kit.heart(g, x - half * 0.08, top + rim + (hgt - rim) * 0.45, 0.62, 'rgba(255,255,255,0.8)');
    }

    function drawLeaf(g, x, y, len, ang, color) {
      if (len < 0.6) return;
      g.save();
      g.translate(x, y); g.rotate(ang);
      g.fillStyle = color;
      g.beginPath(); g.moveTo(0, 0);
      g.quadraticCurveTo(len * 0.45, -len * 0.5, len, 0);
      g.quadraticCurveTo(len * 0.45, len * 0.5, 0, 0);
      g.fill();
      g.restore();
    }

    // La planta, de semilla a gran árbol. Se dibuja en coordenadas locales: (0, 0) = base, y negativa = arriba.
    function drawPlant(g) {
      const { stemH, stemW, cs } = S;
      const e = clamp(S.e, 0, 1.2);
      // «pop» al cambiar de etapa y «glup» al atrapar
      let sx = 1, sy = 1;
      if (!calm) {
        if (popT < 0.7) { const k = 1 - ease.outElastic(clamp(popT / 0.7)); sx += 0.3 * k; sy += 0.3 * k; }
        sx -= 0.07 * gulp; sy += 0.12 * gulp;
      }
      const blink = invul > 0 && Math.sin(t * 28) > 0.1;
      g.save();
      g.translate(px, L.baseY);
      if (blink) g.globalAlpha = 0.45;

      // Semillita (al principio) con un destello para que se note.
      const seedA = 1 - grow(3, 6);
      if (seedA > 0) {
        g.save(); g.globalAlpha *= seedA;
        const tw = 0.5 + 0.5 * Math.sin(t * 5);
        if (grown < 1.5) {
          kit.circle(g, 0, -4, 12 + tw * 4, `rgba(255, 246, 180, ${0.5 - tw * 0.2})`);
          kit.star(g, 12, -17 - tw * 2, 4.4 + tw, '#fffbe0', t);
          kit.star(g, -13, -12, 3.2 + (1 - tw), '#fffbe0', -t);
        }
        kit.ellipse(g, 0, -3.5, 6, 5, '#c98f2e', -0.3);
        kit.ellipse(g, -0.7, -4.3, 4.3, 3.4, '#ecbc4e', -0.3);
        kit.circle(g, -2.1, -5.4, 1.2, 'rgba(255,255,255,0.85)');
        g.restore();
      }

      g.rotate(lean);
      g.scale(sx, sy);
      if (stemH > 0.5) {
        const droop = hurtT > 0 ? Math.sin(Math.min(1, hurtT / 0.9) * Math.PI) * 0.55 : 0;
        const leafK = 1 - grow(18, 24);
        const wood = grow(13, 23);
        const stemColor = mix(STEM_GREEN, STEM_WOOD, wood);
        const wb = stemW * lerp(0.5, 0.78, wood), wt = stemW * lerp(0.5, 0.4, wood);

        // Ramas del árbol grande (asoman bajo la copa).
        if (e > 0.05) {
          g.strokeStyle = stemColor; g.lineCap = 'round'; g.lineWidth = stemW * 0.42 * Math.min(1, e);
          for (const d of [-1, 1]) {
            g.beginPath(); g.moveTo(0, -stemH * 0.56);
            g.quadraticCurveTo(d * 10 * cs * 0.6, -stemH * 0.8, d * 27 * cs * Math.min(1, e), -stemH + 12 * cs);
            g.stroke();
          }
        }
        // Tallo / tronco (más ancho abajo).
        g.fillStyle = stemColor;
        g.beginPath();
        g.moveTo(-wb, 0);
        g.quadraticCurveTo(-wb * 0.55, -stemH * 0.5, -wt, -stemH);
        g.arc(0, -stemH, wt, Math.PI, 0);
        g.quadraticCurveTo(wb * 0.55, -stemH * 0.5, wb, 0);
        g.closePath(); g.fill();
        if (wood > 0.5) {
          // brillo del tronco
          g.fillStyle = 'rgba(255,255,255,0.16)';
          g.beginPath(); g.moveTo(-wb * 0.6, -2); g.quadraticCurveTo(-wb * 0.3, -stemH * 0.5, -wt * 0.5, -stemH * 0.86);
          g.lineTo(-wt * 0.1, -stemH * 0.86); g.quadraticCurveTo(-wb * 0.05, -stemH * 0.5, -wb * 0.2, -2); g.closePath(); g.fill();
        }

        // Hojitas del tallo (brote y plantita).
        if (leafK > 0.01) {
          const lA = 16 * ease.outBack(grow(3.4, 6)) * (1 - grow(11, 15));
          const lB = 17 * ease.outBack(grow(7, 9.5)) * leafK;
          const lC = 16 * ease.outBack(grow(10.5, 13)) * leafK;
          const bud = 12 * ease.outBack(grow(6, 8.5)) * (1 - grow(10, 13));
          for (const d of [-1, 1]) {
            const a = d > 0 ? -0.5 + droop : Math.PI + 0.5 - droop;
            drawLeaf(g, 0, -stemH * 0.36, lC, a, d > 0 ? '#58b565' : PAL.leaf);
            drawLeaf(g, 0, -stemH * 0.64, lB, a, d > 0 ? PAL.leaf : '#58b565');
            drawLeaf(g, 0, -stemH + 1, lA, a + d * -0.12, d > 0 ? '#7fd07a' : '#8ad884');
          }
          drawLeaf(g, 0, -stemH + 1, bud, -Math.PI / 2 + droop * 0.6, PAL.leafLight);
        }

        // Copa (arbusto → árbol).
        if (cs > 0.01) {
          const sway = calm ? 0 : Math.sin(t * 2.1) * 0.8;
          for (let i = 0; i < BLOBS.length; i++) {
            const b = BLOBS[i];
            const k = b[4] ? Math.min(1, e) : 1;
            if (k < 0.02) continue;
            g.fillStyle = b[3];
            g.beginPath();
            g.arc(b[0] * cs * (b[4] ? lerp(0.5, 1, k) : 1) + (i % 2 ? sway : -sway) * cs * 0.5, -stemH + b[1] * cs + droop * 3, b[2] * cs * k, 0, 6.2832);
            g.fill();
          }
          // luz en la copa
          g.fillStyle = 'rgba(255,255,255,0.16)';
          g.beginPath(); g.ellipse(-6 * cs, -stemH - 22 * cs, 9 * cs, 5 * cs, -0.4, 0, 6.2832); g.fill();
          // florecitas de mostaza
          for (let i = 0; i < FLOWERS.length; i++) {
            const f = FLOWERS[i];
            const k = f[2] > 30 ? clamp((e - 0.4) / 0.5) : ease.outBack(grow(f[2], f[2] + 2));
            if (k < 0.05) continue;
            const r = (1.9 + 0.75 * Math.min(cs, 2.4)) * k;
            const fx = f[0] * cs, fy = -stemH + f[1] * cs;
            g.fillStyle = '#ffe873';
            g.beginPath(); g.arc(fx, fy, r, 0, 6.2832); g.fill();
            g.fillStyle = '#fff9d6';
            g.beginPath(); g.arc(fx - r * 0.25, fy - r * 0.25, r * 0.42, 0, 6.2832); g.fill();
          }
        }
      }
      g.restore();
    }

    // Cardo espinoso (la «mala hierba»): bolita morada con púas, hojas oscuras y cara de gruñón.
    function drawWeed(g, x, y, s, rot) {
      g.save();
      g.translate(x, y); g.rotate(rot); g.scale(s, s);
      g.fillStyle = '#4c7a55';
      for (const a of [-2.5, -1.57, -0.64]) {
        g.save(); g.rotate(a);
        g.beginPath(); g.moveTo(6, -4); g.lineTo(13, -6); g.lineTo(12, -2); g.lineTo(19, 0); g.lineTo(12, 2); g.lineTo(13, 6); g.lineTo(6, 4); g.closePath(); g.fill();
        g.restore();
      }
      g.fillStyle = '#6b4c93';
      g.beginPath();
      for (let i = 0; i < 22; i++) { const a = i * Math.PI / 11, r = i % 2 ? 9 : 14.5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r + 2); }
      g.closePath(); g.fill();
      g.fillStyle = '#8667b3';
      g.beginPath(); g.arc(0, 2, 9.4, 0, 6.2832); g.fill();
      // carita gruñona
      g.fillStyle = '#fff';
      g.beginPath(); g.arc(-3.6, 1.4, 2.7, 0, 6.2832); g.arc(3.6, 1.4, 2.7, 0, 6.2832); g.fill();
      g.fillStyle = '#2b1d16';
      g.beginPath(); g.arc(-3.2, 1.9, 1.3, 0, 6.2832); g.arc(3.2, 1.9, 1.3, 0, 6.2832); g.fill();
      g.strokeStyle = '#3a2755'; g.lineWidth = 1.8; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-7, -2.6); g.lineTo(-1.6, -0.4); g.moveTo(7, -2.6); g.lineTo(1.6, -0.4); g.stroke();
      g.beginPath(); g.arc(0, 8.6, 2.6, 1.2 * Math.PI, 1.8 * Math.PI); g.stroke();
      g.restore();
    }

    function drawItem(g, it) {
      const s = it.age < 0.25 ? Math.max(0.05, ease.outBack(it.age / 0.25)) : 1;
      const a = it.state === 'fall' ? 1 : clamp(it.life / it.max);
      g.save();
      g.globalAlpha = a;
      if (it.kind === 'drop') {
        kit.circle(g, it.x, it.y + 1, 19 * s, 'rgba(255,255,255,0.3)');
        kit.drop(g, it.x, it.y, 1.7 * s, '#ffffff');
        kit.drop(g, it.x, it.y + 0.7, 1.38 * s, PAL.waterDeep);
      } else if (it.kind === 'sun') {
        kit.circle(g, it.x, it.y, 20 * s, 'rgba(255,246,190,0.42)');
        kit.sunray(g, it.x, it.y, 1.42 * s, it.ph + it.age * 1.6);
      } else if (it.kind === 'bug') {
        kit.circle(g, it.x, it.y, 20 * s, 'rgba(120, 40, 60, 0.16)');
        kit.emoji(g, '🐛', it.x, it.y, 30 * s, { rot: it.rot + Math.sin(it.ph + it.age * 7) * 0.22, alpha: 1 });
      } else {
        kit.circle(g, it.x, it.y + 1, 20 * s, 'rgba(120, 40, 60, 0.16)');
        drawWeed(g, it.x, it.y, 1.14 * s, it.rot + Math.sin(it.ph + it.age * 3) * 0.3);
      }
      g.restore();
    }

    function drawBirds(g) {
      for (const b of birds) {
        const u = (cT - b.start) / 0.85;
        if (u <= 0) continue;
        crownPoint(b.ux, b.uy, tmpP);
        const tx = tmpP.x, ty = tmpP.y - 20 * b.s;
        if (u < 1) {
          // Llega volando en arco desde un lado.
          const k = ease.outCubic(u);
          const sx0 = b.side < 0 ? -40 : W + 40, sy0 = ty - b.rise;
          const x = lerp(sx0, tx, k), y = lerp(sy0, ty, k) - Math.sin(u * Math.PI) * 26;
          kit.dove(g, x, y, b.s, { dir: b.side < 0 ? 1 : -1, flap: 0.5 + 0.5 * Math.sin(t * 24 + b.ph), tilt: -0.12 });
        } else {
          const hop = calm ? 0 : Math.max(0, Math.sin(clamp(b.landT / 0.3) * Math.PI)) * 4 + Math.max(0, Math.sin(t * 5 + b.ph)) * 1.4;
          kit.dove(g, tx, ty - hop, b.s, { dir: b.dir, flap: b.landT < 0.3 ? 0.6 : 0, feet: true, blink: Math.sin(t * 1.3 + b.ph) > 0.94 });
        }
      }
    }

    function draw(g) {
      layout();
      drawBackground(g);
      const e1 = clamp(S.e);

      // Maceta (en la fiesta se hunde en la tierra: el árbol queda sembrado en el campo).
      const bob = calm ? 0 : gulp * 2;
      kit.shadow(g, px, L.potBase - 1, lerp(L.potHalf * 0.95, 52, e1), 5.5);
      if (e1 < 0.98) {
        kit.ellipse(g, px, L.potTop + 3 + bob, L.potHalf - 5, 8.5, SOIL);
        kit.ellipse(g, px - 6, L.potTop - 1 + bob, L.potHalf * 0.36, 2.6, SOIL_LIGHT);
      }
      if (e1 > 0) {
        kit.ellipse(g, px, L.potBase - 3, lerp(L.potHalf * 0.8, 50, e1), 13 * e1, SOIL);
        kit.ellipse(g, px - 12, L.potBase - 8 * e1 - 1, 16 * e1, 3.4 * e1, SOIL_LIGHT);
      }
      drawPlant(g);
      if (e1 < 0.98) {
        g.save();
        g.beginPath(); g.rect(0, 0, W, L.potBase + 1); g.clip();
        g.globalAlpha = 1 - e1 * 0.3;
        drawPot(g, px, L.potBase + bob * 0.5 + e1 * (L.potH + 6), L.potHalf, L.potH);
        g.restore();
      }
      if (e1 > 0.5) {
        kit.grass(g, px - 34, L.potBase + 2, 1.1, PAL.leafDeep);
        kit.grass(g, px + 30, L.potBase + 3, 1, PAL.leafDeep);
      }

      for (const it of items) drawItem(g, it);

      // Al empezar, un globito presenta a la protagonista: la semilla más pequeña.
      if (mode === 'play' && t < 4.2 && grown < 0.8) {
        const a = clamp(t / 0.3) * clamp((4.2 - t) / 0.5) * (1 - clamp(grown / 0.8));
        if (a > 0.02) {
          g.save(); g.globalAlpha = a;
          kit.speech(g, clamp(px, 92, W - 92), L.potTop - 24, 'La semilla más pequeña', { size: 14, maxWidth: 170 });
          g.restore();
        }
      }

      if (mode !== 'play') {
        drawBirds(g);
        // Cartel de fiesta, arriba del todo (debajo del marcador).
        const u = clamp((cT - 0.4) / 0.45);
        if (u > 0) {
          const sc = calm ? 1 : ease.outBack(u);
          g.save();
          g.translate(W / 2, api.top + 24); g.scale(sc, sc);
          kit.text(g, '¡Se hizo un gran árbol!', 0, 0, { size: 25, color: '#ffffff', stroke: PAL.leafDeep, strokeWidth: 7, maxWidth: W - 30, alpha: clamp(u * 2) });
          g.restore();
        }
      }
    }

    layout();

    return {
      update,
      draw,
      pointerDown(x) { if (mode === 'play') targetX = x; },
      pointerMove(x) { if (mode === 'play') targetX = x; },
      pointerUp() {},
      keyDown() {},
      keyUp() {},
      resize() {
        // El alto cambió: recoloca lo que cae en la misma proporción del recorrido.
        const oldSpawn = L.spawnY, oldSpan = Math.max(1, L.potTop - L.spawnY);
        layout();
        const span = Math.max(1, L.potTop - L.spawnY);
        for (const it of items) {
          if (it.state !== 'fall') continue;
          it.y = L.spawnY + (it.y - oldSpawn) * span / oldSpan;
          it.vy *= span / oldSpan;
        }
      },
      destroy() { items.length = 0; birds.length = 0; },
      // Solo lectura, para las pruebas automáticas.
      get debug() {
        return {
          mode, t, px, targetX, grown, cT, invul, spawned, stage: stageIdx,
          potHalf: L.potHalf, potTop: L.potTop, potBase: L.potBase, groundY: L.groundY, spawnY: L.spawnY, baseY: L.baseY,
          stemH: S.stemH, cs: S.cs, fol: fol.on ? { cx: fol.cx, cy: fol.cy, rx: fol.rx, ry: fol.ry } : null,
          items: items.map(it => ({ kind: it.kind, good: it.good, x: it.x, y: it.y, vy: it.vy, state: it.state })),
          birds: birds.map(b => b.landed),
        };
      },
    };
  },
};
