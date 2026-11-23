// El vuelo de la paloma — historia: La paloma de Noé (Génesis 8).
// Vuelo lateral de un dedo: mantener presionado = subir, soltar = bajar suave.
// La palomita sale del arca, junta ramitas de olivo y esquiva las nubes de tormenta. Con cada ramita el cielo se
// despeja (tormenta → amanecer → día), deja de llover, asoman los montes y, cerca de la meta, aparece el arcoíris.
// El agua del diluvio no quita vida: la paloma salpica y rebota.
//
// Cómo se arma el recorrido: las nubes llegan por "oleadas". Para cada oleada se colocan las nubes, se calculan los
// huecos libres y se elige uno que la paloma pueda alcanzar desde el hueco anterior; las ramitas dibujan ese camino.
// Así siempre hay un paso claro, y seguir las ramitas es seguir el camino seguro.

const DOVE_X = 90;      // la paloma vuela siempre en esta x
const DOVE_S = 0.92;    // tamaño de la paloma
const R = 13;           // radio de choque de la paloma (indulgente)
const SPAWN_X = 460;    // las oleadas nacen fuera de la pantalla (el ancho lógico es 360)
const EXT = 80;         // medio ancho de una oleada (desfase de las nubes + nube + paloma)
const TAU = Math.PI * 2;

// Colores del cielo y del mar en cada momento de la historia: [arriba, medio, abajo].
const SKY = {
  storm: ['#5c6a8a', '#93a1ba', '#ccd4df'],
  dawn: ['#8fb8f0', '#ffd9c2', '#fff0c4'],
  day: ['#6fc1f3', '#cdeeff', '#fff3d6'],
};
const SEA = { storm: [[104, 146, 170], [58, 100, 134]], day: [[88, 183, 234], [47, 143, 208]] };
const FAR = { storm: [166, 177, 197], day: [255, 255, 255] };

export default {
  id: 'noe',
  create(api) {
    const { kit } = api;
    const { PAL, clamp, lerp, map } = kit;
    const W = api.W;
    const smooth = v => { v = clamp(v); return v * v * (3 - 2 * v); };
    const mix = (a, b, k) => `rgb(${Math.round(lerp(a[0], b[0], k))},${Math.round(lerp(a[1], b[1], k))},${Math.round(lerp(a[2], b[2], k))})`;
    const speedAt = sec => lerp(105, 190, clamp(sec / 90));   // avance en px/s

    api.setProgress(0);   // la barra de avance mueve api.top: se pide antes de medir la pantalla

    // ── Medidas que dependen del alto de la pantalla ──
    let H = 0, waterY = 0, yTop = 0, yBot = 0, band = 1, vs = 1, measured = false;
    function measure() {
      H = api.H;
      waterY = H - clamp(H * 0.115, 56, 84);   // superficie del mar
      yTop = api.top + 24;                     // lo más alto que llega el centro de la paloma
      yBot = waterY - 13;                      // más abajo: chapuzón
      band = Math.max(140, yBot - yTop);
      vs = clamp(band / 430, 0.9, 1.35);       // en pantallas altas la paloma sube y baja un poco más rápido
    }

    // ── Estado ──
    const dove = { y: 0, vy: 0, wing: 0, tilt: 0, inv: 0, hurt: 0, pop: 0, carry: false };
    const clouds = [];    // nubes de tormenta (obstáculos)
    const olives = [];    // ramitas de olivo
    const far = [];       // nubes lejanas de adorno (parallax)
    const peaks = [       // montes que asoman cuando bajan las aguas (parallax)
      { x: 300, w: 170, h: 78, tree: true, col: '#8fca8b' },
      { x: 560, w: 120, h: 44, tree: false, col: '#a5d79c' },
      { x: 860, w: 190, h: 96, tree: true, col: '#84c285' },
    ];
    const marks = [];     // por dónde pasa el camino seguro en cada oleada (solo para pruebas)
    const touches = new Set();
    let expectDown = false;
    let t = 0, dist = 0, clearS = 0, launch = 0.9, splashCd = 0, splashed = false, flapT = 0;
    let planN = 0, nextX = 330, plan = null, sinceLow = 1, sinceHigh = 0, arkX = 66;
    const told = { rain: false, sun: false, bow: false };
    let sky = null, skyH = 0, skyG = null;

    // Si cambia el alto (o el marcador), se recolocan las cosas en proporción.
    function relayout() {
      const oTop = yTop, oBot = yBot;
      measure();
      if (!measured) { measured = true; return; }
      if (Math.abs(oTop - yTop) < 0.5 && Math.abs(oBot - yBot) < 0.5) return;
      const k = (yBot - yTop) / Math.max(1, oBot - oTop);
      const f = y => yTop + (y - oTop) * k;
      dove.y = f(dove.y);
      for (const c of clouds) { c.by = f(c.by); c.y = f(c.y); c.amp *= k; }
      for (const o of olives) o.y = f(o.y);
      for (const m of marks) m.y = f(m.y);
      if (plan) { plan.y = f(plan.y); for (const c of plan.clouds) { c.y = f(c.y); c.amp *= k; } }
    }

    // ── Planear una oleada: nubes + hueco seguro alcanzable desde prevY ──
    function planWave(prevY, sec) {
      const n = ++planN;
      const d = clamp(sec / 90), late = clamp((sec - 90) / 90);
      const D = 275 + 45 * d + api.randRange(0, 30);               // distancia desde la oleada anterior
      const tFree = (D - 2 * EXT) / speedAt(sec + 2.5);            // segundos sin nubes entre dos oleadas
      const reach = Math.max(50, tFree * 165 * vs * 0.72);         // lo que la paloma puede subir o bajar en ese rato
      const minFree = Math.min(lerp(150, 108, d) - 12 * late, band * 0.36);   // hueco mínimo para el centro de la paloma
      const cTop = api.top + 30, cBot = waterY - 24;               // límites para el centro de una nube
      let count = 1;
      if (n >= 3) {
        if (sec < 38) count = api.rand() < map(sec, 10, 38, 0.25, 0.75) ? 2 : 1;
        else if (sec < 75) count = api.rand() < map(sec, 38, 75, 0.2, 0.7) ? 3 : 2;
        else count = 3;
        if (band > 500 && api.rand() < 0.6) count++;
      }
      count = Math.min(count, Math.max(1, Math.floor((band - minFree) / 88)));
      const pMove = n >= 4 ? map(sec, 14, 80, 0.2, 0.5) : 0;       // algunas nubes suben y bajan despacio
      // Nadie puede quedarse siempre pegado al agua ni al techo: cada tanto una nube pasa por ahí.
      const forced = [];
      if (sinceLow >= 2) forced.push('low');
      if (sinceHigh >= 2) forced.push('high');
      if (forced.length === 2 && sinceHigh > sinceLow) forced.reverse();

      let list = null, y = prevY;
      for (let attempt = 0; attempt < 12 && !list; attempt++) {
        if (attempt === 7 && count > 1) count--;
        const tryList = [];
        for (let i = 0; i < count; i++) {
          const s = api.randRange(0.95, 1.2);
          let amp = api.rand() < pMove ? api.randRange(20, 36) : 0;
          let cy;
          if (forced[i] === 'low') { cy = api.randRange(waterY - 46, cBot); amp = 0; }
          else if (forced[i] === 'high') { cy = cTop + api.randRange(0, 12); amp = 0; }
          else if (api.rand() < 0.45) cy = prevY + api.randRange(-28, 28);   // justo en el camino: hay que esquivarla
          else cy = api.randRange(cTop, cBot);
          if (cBot - cTop < 2 * amp + 10) amp = 0;
          tryList.push({ dx: api.randRange(-30, 30), y: clamp(cy, cTop + amp, cBot - amp), s, amp });
        }
        // tramos de altura que cada nube le cierra al centro de la paloma (el rayo cuelga por debajo)
        const blocks = tryList.map(c => [c.y - c.amp - 18 * c.s - R - 2, c.y + c.amp + 35 * c.s + R + 2]).sort((a, b) => a[0] - b[0]);
        blocks.push([yBot, yBot]);
        const opts = [];
        let a = yTop;
        for (const [b0, b1] of blocks) {
          if (b0 - a >= minFree) {
            const pad = Math.min(42, (b0 - a) * 0.3);
            const lo = Math.max(a + pad, prevY - reach), hi = Math.min(b0 - pad, prevY + reach);
            if (lo <= hi) opts.push([lo, hi]);
          }
          a = Math.max(a, b1);
        }
        if (opts.length) { const [lo, hi] = api.pick(opts); list = tryList; y = api.randRange(lo, hi); }
      }
      if (!list) {   // respaldo: una sola nube, lejos del camino
        list = [{ dx: 0, y: prevY > (yTop + yBot) / 2 ? cTop + 6 : cBot - 6, s: 1, amp: 0 }];
        y = prevY;
      }
      sinceLow = list.some(c => c.y + c.amp >= waterY - 50) ? 0 : sinceLow + 1;
      sinceHigh = list.some(c => c.y - c.amp <= cTop + 16) ? 0 : sinceHigh + 1;
      return { clouds: list, y, D };
    }

    // Ramitas entre dos oleadas: en fila, en arco o en curva hacia el siguiente hueco.
    function placeOlives(x0, y0, x1, y1) {
      const xa = x0 + EXT - 8, xb = x1 - EXT + 8, dy = y1 - y0;
      const pts = [];
      if (Math.abs(dy) < 34) {
        const ym = (y0 + y1) / 2;
        if (api.rand() < 0.5) {   // fila
          const xm = (xa + xb) / 2, n = api.rand() < 0.5 ? 3 : 2;
          for (let i = 0; i < n; i++) pts.push([xm + (i - (n - 1) / 2) * 46, ym]);
        } else {                  // arco
          const up = ym - yTop > 60 && (yBot - ym < 60 || api.rand() < 0.6);
          const hump = api.randRange(28, 42) * (up ? 1 : -1);
          for (let i = 0; i < 3; i++) { const u = i / 2; pts.push([lerp(xa + 14, xb - 14, u), lerp(y0, y1, u) - Math.sin(u * Math.PI) * hump]); }
        }
      } else {                    // curva hacia el siguiente hueco
        const n = Math.abs(dy) > 90 ? 3 : 2;
        for (let i = 0; i < n; i++) { const u = (i + 0.5) / n; pts.push([lerp(xa, xb, u), lerp(y0, y1, smooth(u))]); }
      }
      if (api.rand() < 0.15) pts.push([x1, y1]);   // premio por pasar justo por el hueco
      const grp = { n: pts.length, got: 0 };
      for (const [x, y] of pts) olives.push({ x, y: clamp(y, yTop + 6, yBot - 8), ph: api.randRange(0, TAU), grp });
    }

    function spawnWave() {
      const x = nextX, cur = plan;
      for (const c of cur.clouds) {
        clouds.push({ x: x + c.dx, y: c.y, by: c.y, s: c.s, amp: c.amp, ph: api.randRange(0, TAU), w: TAU / api.randRange(2.6, 3.8), zap: 0, seed: api.randRange(0, 10) });
      }
      marks.push({ x, y: cur.y });
      plan = planWave(cur.y, api.time);
      placeOlives(x, cur.y, x + plan.D, plan.y);
      nextX = x + plan.D;
    }

    // ── Inicio ──
    relayout();
    dove.y = yTop + band * 0.45;
    plan = { clouds: [], y: dove.y, D: 0 };   // la primera "oleada" no trae nubes: unos segundos tranquilos
    {
      const solo = { n: 1, got: 0 }, row = { n: 2, got: 0 };
      olives.push({ x: 178, y: dove.y - 2, ph: 0, grp: solo });   // una ramita regalada para empezar con alegría
      for (let i = 0; i < 2; i++) olives.push({ x: 268 + i * 48, y: dove.y + 6, ph: i + 1, grp: row });
    }
    for (let i = 0; i < 6; i++) far.push({ x: api.randRange(-20, W + 60), f: (i + api.rand()) / 6, s: api.randRange(0.5, 1), par: 0 });
    for (const c of far) c.par = 0.1 + c.s * 0.2;
    api.hint('Mantén presionado para subir', 2600);

    function isHolding() { return touches.size > 0 || api.keys.has('up') || api.keys.has('action'); }
    function press() {
      launch = 0;
      dove.vy = Math.min(dove.vy, -85 * vs);   // respuesta inmediata al toque
      dove.wing = Math.PI * 0.5;
      flapT = 0.34;
      api.sfx('flap');
    }

    function hit(c) {
      api.loseLife(DOVE_X + 8, dove.y - 34);   // el motor pone el sonido, la sacudida y el destello
      dove.inv = 1.5; dove.hurt = 1;
      dove.vy = (dove.y < c.y ? -1 : 1) * 120 * vs;
      c.zap = 0.4;
      api.burst(DOVE_X, dove.y, { color: '#ffffff', count: 8, speed: 90, size: 4, gravity: 140, life: 0.6 });
    }

    function collect(o) {
      api.addScore(1, o.x, o.y - 16);
      api.sfx('coin');
      api.burst(o.x, o.y, { color: '#b9e07a', count: 7, speed: 80, size: 4, life: 0.5 });
      dove.carry = true; dove.pop = 1;
      o.grp.got++;
      if (o.grp.n >= 3 && o.grp.got === o.grp.n) {   // ¡toda la fila!
        api.sfx('sparkle');
        api.burst(DOVE_X + 14, dove.y - 30, { emoji: '✨', count: 3, speed: 70, size: 14, life: 0.7, gravity: 40 });
      }
      const goal = api.goal || 20, sc = api.score;
      api.setProgress(sc / goal);
      // la historia avanza con las ramitas
      if (!told.rain && sc >= goal * 0.35) { told.rain = true; api.floatText(W / 2, api.top + 44, '¡Ya no llueve!', { size: 22, color: '#eaf6ff' }); }
      if (!told.sun && sc >= goal * 0.65) { told.sun = true; api.sfx('chirp'); api.floatText(W / 2, api.top + 44, '¡Sale el sol!', { size: 22, color: '#fff3b0' }); }
      if (!told.bow && sc >= goal) { told.bow = true; api.floatText(W / 2, api.top + 76, '¡El arcoíris!', { size: 24, color: '#ffffff' }); }
    }

    // ── Dibujos propios (mismo estilo del kit) ──
    function drawArk(g, x, y, s) {
      g.save();
      g.translate(x, y + Math.sin(t * 1.6) * 2.5); g.rotate(Math.sin(t * 1.1) * 0.025); g.scale(s, s);
      kit.fillRR(g, -34, -52, 68, 32, 5, '#dcae7c');   // caseta
      g.fillStyle = '#b5654a'; g.beginPath(); g.moveTo(-43, -49); g.lineTo(-27, -64); g.lineTo(27, -64); g.lineTo(43, -49); g.closePath(); g.fill();   // techo
      kit.fillRR(g, -9, -44, 18, 15, 4, '#6b4a34');   // la ventana por donde salió la paloma
      kit.person(g, 50, -25, 0.44, { robe: '#8fbc8f', hair: '#f3efe6', beard: true, arms: 'up', dir: -1 });   // Noé la despide
      g.fillStyle = PAL.woodDeep; g.beginPath(); g.moveTo(-68, -24); g.lineTo(68, -24); g.quadraticCurveTo(62, 12, 38, 14);
      g.lineTo(-38, 14); g.quadraticCurveTo(-62, 12, -68, -24); g.closePath(); g.fill();   // casco
      kit.fillRR(g, -70, -28, 140, 8, 4, PAL.wood);
      g.restore();
    }
    function drawPeaks(g) {
      const e = smooth((clearS - 0.4) / 0.55);   // 0 = todo cubierto de agua, 1 = monte bien asomado
      if (e <= 0.01) return;
      for (const p of peaks) {
        if (p.x < -p.w || p.x > W + p.w) continue;
        const base = waterY + 12, top = waterY + 8 - (p.h + 8) * e;
        g.fillStyle = p.col; g.beginPath(); g.moveTo(p.x - p.w / 2, base);
        g.bezierCurveTo(p.x - p.w * 0.2, base, p.x - p.w * 0.22, top, p.x, top);
        g.bezierCurveTo(p.x + p.w * 0.22, top, p.x + p.w * 0.2, base, p.x + p.w / 2, base);
        g.closePath(); g.fill();
        if (p.tree && e > 0.45) kit.tree(g, p.x + 3, top + 8, 0.2 + 0.4 * smooth((e - 0.45) / 0.5), { kind: 'olive' });
      }
    }

    return {
      update(dt) {
        t += dt;
        relayout();
        const sec = api.time, speed = speedAt(sec), dx = speed * dt;

        // ── Entrada: si se perdió un "soltar" (p. ej. durante la pausa), se corrige aquí ──
        if (api.pointer.down !== expectDown) { if (!api.pointer.down) touches.clear(); expectDown = api.pointer.down; }
        const hold = isHolding();

        // ── Vuelo flotante: velocidades limitadas, nada de caídas bruscas ──
        if (launch > 0) launch -= dt;
        const dive = api.keys.has('down');
        if (hold) dove.vy -= 1050 * vs * dt;
        else if (launch <= 0) dove.vy += (dive ? 900 : 560) * vs * dt;
        dove.vy = clamp(dove.vy, -215 * vs, (dive ? 230 : 165) * vs);
        dove.y += dove.vy * dt;
        if (dove.y < yTop) { dove.y = yTop; if (dove.vy < 0) dove.vy = 0; }
        if (splashCd > 0) splashCd -= dt;
        if (dove.y > yBot) {   // chapuzón: no quita vida, salpica y rebota
          dove.y = yBot; dove.vy = -200 * vs;
          if (splashCd <= 0) {
            splashCd = 0.3;
            api.sfx('splash');
            api.burst(DOVE_X, waterY, { color: '#e8f7ff', count: 10, speed: 110, size: 4, gravity: 330, life: 0.5 });
            if (!splashed) { splashed = true; api.floatText(DOVE_X + 16, waterY - 34, '¡Splash!', { size: 16, color: '#e8f7ff' }); }
          }
        }
        dove.wing += dt * (hold ? 17 : 5.5);
        if (hold) { flapT -= dt; if (flapT <= 0) { flapT = 0.34; api.sfx('flap'); } }
        dove.tilt = lerp(dove.tilt, clamp(dove.vy / 520, -0.3, 0.3), Math.min(1, dt * 10));
        if (dove.inv > 0) dove.inv -= dt;
        if (dove.hurt > 0) dove.hurt -= dt;
        if (dove.pop > 0) dove.pop = Math.max(0, dove.pop - dt * 4);

        // ── Avance del mundo ──
        dist += dx;
        nextX -= dx;
        if (nextX <= SPAWN_X) spawnWave();
        for (const m of marks) m.x -= dx;
        while (marks.length && marks[0].x < -120) marks.shift();
        if (arkX > -200) arkX -= dx * 0.16;
        for (const p of peaks) { p.x -= dx * 0.25; if (p.x < -p.w) p.x += 900; }
        for (const c of far) { c.x -= dx * c.par; if (c.x < -60) { c.x += W + 120; c.f = api.rand(); } }

        // ── Nubes de tormenta ──
        const px = DOVE_X + 4, py = dove.y - 4;   // centro visual de la paloma
        for (let i = clouds.length - 1; i >= 0; i--) {
          const c = clouds[i];
          c.x -= dx;
          c.y = c.by + (c.amp ? Math.sin(c.ph + t * c.w) * c.amp : 0);
          if (c.zap > 0) c.zap -= dt;
          if (c.x < -70) { clouds.splice(i, 1); continue; }
          if (dove.inv > 0 || Math.abs(c.x - px) > 70) continue;
          const ex = (px - (c.x + c.s)) / (30 * c.s + R), ey = (py - (c.y - 2 * c.s)) / (16 * c.s + R);
          const bx = px - (c.x + c.s), by = py - (c.y + 28 * c.s), br = 7 * c.s + R;
          if (ex * ex + ey * ey < 1 || bx * bx + by * by < br * br) hit(c);
        }

        // ── Ramitas de olivo: se acercan solas cuando la paloma pasa cerca ──
        const ox = DOVE_X + 8, oy = dove.y - 5;
        for (let i = olives.length - 1; i >= 0; i--) {
          const o = olives[i];
          o.x -= dx;
          if (o.x < -30) { olives.splice(i, 1); continue; }
          const ax = ox - o.x, ay = oy - o.y, d2 = ax * ax + ay * ay;
          if (d2 < 31 * 31) { olives.splice(i, 1); collect(o); }
          else if (d2 < 58 * 58) { const dd = Math.sqrt(d2), pull = 160 * dt / dd; o.x += ax * pull; o.y += ay * pull; }
        }

        // el cielo se despeja con el puntaje
        clearS += (clamp(api.score / (api.goal || 20)) - clearS) * Math.min(1, dt * 1.5);
      },

      draw(g) {
        if (!measured) relayout();
        const top = api.top;
        // ── Cielo: de la tormenta al amanecer y al día ──
        if (!sky || skyH !== H || skyG !== g) {
          sky = {}; skyH = H; skyG = g;
          for (const k of Object.keys(SKY)) {
            const gr = g.createLinearGradient(0, 0, 0, H);
            gr.addColorStop(0, SKY[k][0]); gr.addColorStop(0.65, SKY[k][1]); gr.addColorStop(1, SKY[k][2]);
            sky[k] = gr;
          }
        }
        const p2 = clearS * 2;
        g.fillStyle = p2 < 1 ? sky.storm : sky.dawn; g.fillRect(-12, -12, W + 24, H + 24);
        const over = p2 < 1 ? p2 : p2 - 1;
        if (over > 0.01) { g.globalAlpha = over; g.fillStyle = p2 < 1 ? sky.dawn : sky.day; g.fillRect(-12, -12, W + 24, H + 24); g.globalAlpha = 1; }

        // sol y arcoíris: señales de que la promesa se cumple
        const sunA = clamp((clearS - 0.4) / 0.35);
        if (sunA > 0.01) { g.save(); g.globalAlpha = sunA; kit.sun(g, W - 62, top + 52, 24, t); g.restore(); }
        const bowA = smooth((clearS - 0.78) / 0.2);
        if (bowA > 0.01) kit.rainbow(g, W * 0.6, waterY + 16, Math.min(W * 0.44, (waterY - top) * 0.62), 7, bowA * 0.8);

        // nubes lejanas
        const farCol = mix(FAR.storm, FAR.day, clearS), farA = lerp(0.5, 0.72, clearS);
        for (const c of far) kit.cloud(g, c.x, top + 26 + c.f * Math.max(40, waterY - top - 130), c.s, farA, farCol);

        // lluvia que va cesando
        const rain = clamp(1 - clearS * 2.7);
        if (rain > 0.02) {
          g.save();
          g.globalAlpha = rain * 0.5; g.strokeStyle = '#eef4ff'; g.lineWidth = 1.6; g.lineCap = 'round';
          g.beginPath();
          const sx = W + 40, sy = waterY + 30;
          for (let i = 0; i < 26; i++) {
            const x = (((i * 67.3 - t * 120 - dist * 0.25) % sx) + sx) % sx - 20;
            const y = (i * 131.7 + t * (420 + (i % 5) * 34)) % sy;
            g.moveTo(x, y); g.lineTo(x - 5, y + 15);
          }
          g.stroke();
          g.restore();
        }

        drawPeaks(g);
        if (arkX > -90) drawArk(g, arkX, waterY + 5, 0.95);

        // ── Nubes de tormenta ──
        for (const c of clouds) {
          if (c.zap > 0) kit.circle(g, c.x, c.y + 24 * c.s, 30 * c.s, `rgba(255, 232, 130, ${(0.55 * c.zap / 0.4).toFixed(3)})`);
          kit.stormCloud(g, c.x, c.y, c.s, t + c.seed);
        }

        // ── Mar del diluvio ──
        g.save(); g.translate(-12, 0);
        kit.water(g, W + 24, H + 14, waterY, t, mix(SEA.storm[0], SEA.day[0], clearS), mix(SEA.storm[1], SEA.day[1], clearS));
        g.restore();
        // espumitas que pasan: dan sensación de avance
        g.save(); g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath();
        const wh = Math.max(12, H - waterY - 22);
        for (let i = 0; i < 4; i++) {
          const x = W + 30 - ((dist * 0.9 + i * 113) % (W + 60)), y = waterY + 14 + ((i * 37) % wh);
          g.moveTo(x, y); g.quadraticCurveTo(x + 8, y - 4, x + 16, y);
        }
        g.stroke(); g.restore();
        // sombra de la paloma sobre el agua
        const hgt = clamp((yBot - dove.y) / band);
        kit.ellipse(g, DOVE_X, waterY + 7, lerp(20, 9, hgt), lerp(4.5, 2.5, hgt), `rgba(30, 50, 80, ${lerp(0.22, 0.07, hgt).toFixed(3)})`);

        // ── Ramitas ──
        for (const o of olives) {
          if (o.x > W + 30) continue;
          const bob = Math.sin(t * 3 + o.ph) * 3;
          kit.circle(g, o.x, o.y + bob, 20, 'rgba(244, 255, 226, 0.2)');
          kit.circle(g, o.x, o.y + bob, 14, 'rgba(250, 255, 236, 0.3)');
          kit.olive(g, o.x, o.y + bob, 1.25, -0.25 + Math.sin(t * 2 + o.ph) * 0.14);
        }

        // ── Palomita ──
        const hold = isHolding();
        const flap = hold ? 0.5 + 0.5 * Math.sin(dove.wing) : 0.66 + 0.14 * Math.sin(dove.wing);
        g.save();
        if (dove.inv > 0) g.globalAlpha = api.reduceMotion ? 0.6 : (Math.floor(dove.inv * 11) % 2 ? 0.95 : 0.35);
        kit.dove(g, DOVE_X, dove.y, DOVE_S * (1 + 0.12 * kit.ease.outCubic(dove.pop)), {
          flap, tilt: dove.tilt, mood: dove.hurt > 0 ? 'hurt' : 'happy', carry: dove.carry ? 'olive' : null,
          blink: dove.hurt <= 0 && t % 3.4 < 0.12,
        });
        g.restore();
      },

      pointerDown(x, y, id) { touches.add(id); expectDown = true; press(); },
      pointerUp(x, y, id) {
        touches.delete(id); expectDown = false;
        if (!isHolding() && dove.vy < 0) dove.vy *= 0.55;   // al soltar deja de subir pronto: control más fino
      },
      keyDown(key) { if (key === 'up' || key === 'action') press(); },
      keyUp(key) { if ((key === 'up' || key === 'action') && !isHolding() && dove.vy < 0) dove.vy *= 0.55; },
      resize() { relayout(); },
      destroy() { clouds.length = 0; olives.length = 0; far.length = 0; marks.length = 0; touches.clear(); },

      // Solo lectura, para las pruebas automáticas.
      get debug() {
        return {
          y: dove.y, vy: dove.vy, inv: dove.inv, hold: isHolding(), carry: dove.carry,
          yTop, yBot, waterY, band, speed: speedAt(api.time), clear: clearS, dist, waves: planN,
          clouds: clouds.map(c => ({ x: c.x, y: c.y, by: c.by, s: c.s, amp: c.amp })),
          olives: olives.map(o => ({ x: o.x, y: o.y })),
          marks: marks.map(m => ({ x: m.x, y: m.y })), next: { x: nextX, y: plan ? plan.y : 0 },
        };
      },
    };
  },
};
