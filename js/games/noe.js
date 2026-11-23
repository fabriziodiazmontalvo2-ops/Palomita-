// El vuelo de la paloma — historia: La paloma de Noé (Génesis 8).
// Vuelo lateral de un dedo: mantener presionado = subir, soltar = bajar suave.
// La palomita sale del arca, junta ramitas de olivo y esquiva las nubes de tormenta. Con cada ramita el cielo se
// despeja, deja de llover, asoman los montes y, al juntar las ramitas del nivel, aparece el arcoíris de la Alianza
// (Génesis 9, 13): ahí termina el nivel. El agua del diluvio no quita vida: la paloma salpica y rebota.
//
// 100 niveles (js/games/levels.js): api.difficulty (0 en el nivel 1, 1 en el 100) fija la velocidad, el tamaño de los
// huecos, cuántas nubes trae cada oleada y cada cuánto salen las novedades. Dentro del nivel todo sube un poquito más
// (según el tiempo jugado y las ramitas juntadas). Cada 10 niveles llega algo nuevo (ver FEAT):
//   11 nubes que suben y bajan · 21 ramitas doradas (valen 3) · 31 ráfagas de viento · 41 rayos que avisan antes de caer
//   51 aguaceros (la paloma pesa más) · 61 el cuervo que va y viene (Gn 8, 7) y el vuelo al atardecer (Gn 8, 11)
//   71 asoman las cimas de los montes (Gn 8, 5) · 81 túneles de nubes en la noche · 91 la luz de Dios que protege de un choque
//
// Cómo se arma el recorrido: las nubes llegan por "oleadas". Para cada oleada se colocan sus obstáculos, se calculan
// los huecos libres y se elige uno que la paloma pueda alcanzar desde el hueco anterior; las ramitas dibujan ese
// camino. Así siempre hay un paso claro, y seguir las ramitas es seguir el camino seguro. El cuervo también se suelta
// lejos de ese camino.

const DOVE_X = 90;      // la paloma vuela siempre en esta x
const DOVE_S = 0.92;    // tamaño de la paloma
const R = 13;           // radio de choque de la paloma (indulgente)
const SPAWN_X = 460;    // las oleadas nacen fuera de la pantalla (el ancho lógico es 360)
const EXT = 80;         // medio ancho de una oleada (desfase de las nubes + nube + paloma)
const WALL_HW = 30;     // medio ancho de una pared de nubes del túnel
const TAU = Math.PI * 2;

// A partir de qué nivel aparece cada novedad, y el cartelito que lo anuncia.
const FEAT = { move: 11, gold: 21, wind: 31, bolt: 41, rain: 51, raven: 61, peak: 71, tunnel: 81, shield: 91 };
const NEWS = {
  move: '¡Nuevo: nubes que suben y bajan!',
  gold: '¡Nuevo: ramitas doradas! Valen 3',
  wind: '¡Nuevo: ráfagas de viento! Mira las flechas',
  bolt: '¡Nuevo: rayos! Parpadean antes de caer',
  rain: '¡Nuevo: aguaceros! Bajo la lluvia, aletea más',
  raven: '¡Nuevo: el cuervo va y viene! Ya atardece',
  peak: '¡Nuevo: asoman las cimas de los montes!',
  tunnel: '¡Nuevo: túneles de nubes en la noche!',
  shield: '¡Nuevo: la luz de Dios te cuida de un choque!',
};

// Colores del cielo en cada momento de la historia: [arriba, medio, abajo].
const SKY = {
  storm: ['#5c6a8a', '#93a1ba', '#ccd4df'],
  dawn: ['#8fb8f0', '#ffd9c2', '#fff0c4'],
  day: ['#6fc1f3', '#cdeeff', '#fff3d6'],
  sunset: ['#f08a6c', '#ffc27a', '#ffe9b0'],
  nightStorm: ['#1d2440', '#38415f', '#5a637f'],
  night: ['#1c2550', '#3a3f86', '#7a6bb8'],
};
// Escenarios: niveles 1–60 de la tormenta al día; 61–80 al atardecer (la paloma volvió "al atardecer", Gn 8, 11);
// 81–100 de noche, hasta que amanece con el arcoíris.
const STORM_SEA = [[104, 146, 170], [58, 100, 134]];
const THEMES = {
  day: { sky: ['storm', 'dawn', 'day'], sea0: STORM_SEA, sea1: [[88, 183, 234], [47, 143, 208]], far0: [166, 177, 197], far1: [255, 255, 255],
    peaks: ['#8fca8b', '#a5d79c', '#84c285'], say: ['¡Ya no llueve!', '¡Sale el sol!'] },
  sunset: { sky: ['storm', 'dawn', 'sunset'], sea0: STORM_SEA, sea1: [[236, 158, 128], [136, 104, 158]], far0: [166, 177, 197], far1: [255, 228, 212],
    peaks: ['#9cb77f', '#b2c58e', '#8fae78'], say: ['¡Ya no llueve!', '¡Ya atardece!'] },
  night: { sky: ['nightStorm', 'night', 'dawn'], sea0: [[48, 64, 98], [24, 34, 62]], sea1: [[110, 156, 214], [58, 98, 166]], far0: [88, 96, 128], far1: [236, 240, 255],
    peaks: ['#6f9a86', '#7fa992', '#64907d'], say: ['¡Ya no llueve!', '¡Mira las estrellas!'] },
};

export default {
  id: 'noe',
  // Meta: ramitas por nivel (1 → 100). El juego hace su propio final: al juntarlas sale el arcoíris y termina.
  levels: {
    goal: [12, 80], curve: 1, lives: 3, selfEnd: true,
    goalLabel: n => `Junta ${n} ramitas de olivo`,
  },
  create(api) {
    const { kit } = api;
    const { PAL, clamp, lerp } = kit;
    const W = api.W;
    const smooth = v => { v = clamp(v); return v * v * (3 - 2 * v); };
    const mix = (a, b, k) => `rgb(${Math.round(lerp(a[0], b[0], k))},${Math.round(lerp(a[1], b[1], k))},${Math.round(lerp(a[2], b[2], k))})`;

    // ── Nivel ──
    const LV = api.level || 1, E = clamp(api.difficulty || 0), GOAL = Math.max(1, api.goal || 20);
    const has = k => LV >= FEAT[k];
    const fk = k => (has(k) ? clamp((LV - FEAT[k]) / (100 - FEAT[k])) : 0);   // 0 cuando aparece … 1 en el nivel 100
    const fresh = Object.keys(FEAT).find(k => FEAT[k] === LV) || null;          // la novedad que se estrena en este nivel
    const theme = LV > 80 ? THEMES.night : LV > 60 ? THEMES.sunset : THEMES.day;
    const night = theme === THEMES.night;
    const Tnom = lerp(24, 85, E);   // duración aproximada del nivel (para la rampa interna)
    // Rampa dentro del nivel: 0 al empezar → 1 cerca del final (mitad tiempo, mitad ramitas).
    const ramp = sec => clamp(0.5 * api.score / GOAL + 0.5 * sec / Tnom);
    const speedAt = sec => lerp(lerp(86, 148, E), lerp(100, 176, E), ramp(sec));   // avance en px/s

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
    const dove = { y: 0, vy: 0, wing: 0, tilt: 0, inv: 0, hurt: 0, pop: 0, carry: false, shield: 0 };
    const clouds = [];    // nubes de tormenta (obstáculos)
    const bolts = [];     // nubes de rayo: avisan y luego el rayo cae hasta la punta
    const hills = [];     // cimas de los montes que asoman del agua (obstáculos)
    const walls = [];     // paredes de nubes de los túneles
    const ravens = [];    // el cuervo
    const winds = [];     // ráfagas de viento (zonas que empujan hacia arriba o hacia abajo)
    const showers = [];   // aguaceros (zonas donde la paloma pesa más)
    const olives = [];    // ramitas (normales, doradas) y lucecitas que protegen
    const far = [];       // nubes lejanas de adorno (parallax)
    const peaks = [       // montes lejanos que asoman cuando bajan las aguas (adorno)
      { x: 300, w: 170, h: 78, tree: true, col: theme.peaks[0] },
      { x: 560, w: 120, h: 44, tree: false, col: theme.peaks[1] },
      { x: 860, w: 190, h: 96, tree: true, col: theme.peaks[2] },
    ];
    const marks = [];     // por dónde pasa el camino seguro en cada oleada
    const touches = new Set();
    let expectDown = false;
    let t = 0, dist = 0, clearS = 0, launch = 0.9, splashCd = 0, splashed = false, flapT = 0;
    let planN = 0, nextX = 330, plan = null, sinceLow = 1, sinceHigh = 0, arkX = 66;
    let tunnelLeft = 0, tunnelCd = 2, ravenT = fresh === 'raven' ? 5 : lerp(14, 8, fk('raven')), shieldCd = fresh === 'shield' ? 3 : 12;
    let goldSeen = false, finale = 0, curWind = 0, inShower = false;
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
      for (const b of bolts) { b.y = f(b.y); b.tip = f(b.tip); }
      for (const h of hills) h.top = f(h.top);
      for (const w of walls) w.edge = f(w.edge);
      for (const r of ravens) { r.by = f(r.by); r.y = f(r.y); }
      for (const o of olives) o.y = f(o.y);
      for (const m of marks) m.y = f(m.y);
      if (plan) {
        plan.y = f(plan.y);
        for (const c of plan.obs) {
          if (c.y !== undefined) c.y = f(c.y);
          if (c.tip !== undefined) c.tip = f(c.tip);
          if (c.top !== undefined) c.top = f(c.top);
          if (c.edge !== undefined) c.edge = f(c.edge);
          if (c.amp) c.amp *= k;
        }
      }
    }

    // Tramo de alturas que cada obstáculo le cierra al centro de la paloma.
    function blockOf(c) {
      if (c.kind === 'bolt') return [-1e4, c.tip + R + 4];
      if (c.kind === 'hill') return [c.top - R - 4, 1e4];
      if (c.kind === 'wall') return c.side === 'top' ? [-1e4, c.edge] : [c.edge, 1e4];
      return [c.y - c.amp - 18 * c.s - R - 2, c.y + c.amp + 35 * c.s + R + 2];   // nube (el rayito cuelga por debajo)
    }

    // ── Planear una oleada: obstáculos + hueco seguro alcanzable desde prevY ──
    function planWave(prevY, sec) {
      const n = ++planN;
      const u = ramp(sec), spd = speedAt(sec + 2.5);
      const cTop = api.top + 30, cBot = waterY - 24;   // límites para el centro de una nube
      if (tunnelLeft > 0) return planTunnel(prevY, spd, false);
      if (tunnelCd > 0) tunnelCd--;
      if (has('tunnel') && n >= 3 && tunnelCd <= 0 && (fresh === 'tunnel' || api.rand() < lerp(0.14, 0.24, fk('tunnel')))) {
        tunnelLeft = api.randInt(4, Math.round(lerp(5, 7, fk('tunnel'))));
        tunnelCd = Math.round(lerp(7, 5, fk('tunnel')));
        return planTunnel(prevY, spd, true);
      }
      const early = n === 2;   // la novedad del nivel se estrena en la segunda oleada
      // Zonas del tramo que lleva hasta esta oleada: ráfaga de viento o aguacero (no las dos a la vez).
      let wind = 0, shower = false;
      if (has('wind') && n >= 2 && ((fresh === 'wind' && early) || api.rand() < lerp(0.28, 0.45, fk('wind')))) {
        wind = (api.rand() < 0.5 ? -1 : 1) * lerp(300, 440, fk('wind'));
      } else if (has('rain') && n >= 2 && ((fresh === 'rain' && early) || api.rand() < lerp(0.2, 0.32, fk('rain')))) shower = true;
      const tGap = Math.max(0.8, lerp(1.7, 0.95, E) - 0.12 * u + api.randRange(0, 0.25));   // segundos sin nubes entre dos oleadas
      const D = 2 * EXT + spd * tGap;                                                     // distancia desde la oleada anterior
      const reach = Math.max(50, tGap * 165 * vs * 0.72 * (wind ? 0.85 : 1) * (shower ? 0.85 : 1));   // lo que la paloma puede subir o bajar en ese rato
      const minFree = Math.min(lerp(lerp(178, 124, E), lerp(160, 104, E), u), band * 0.4);   // hueco mínimo para el centro de la paloma
      let count = 1;
      if (n >= 3) {
        const ce = 1 + 1.55 * E + 0.5 * u * (0.2 + E);
        count = Math.floor(ce) + (api.rand() < ce % 1 ? 1 : 0);
        if (band > 500 && api.rand() < 0.5) count++;
      }
      count = Math.min(count, Math.max(1, Math.floor((band - minFree) / 88)));
      const pMove = has('move') && n >= 2 ? ((fresh === 'move' && early) ? 1 : lerp(0.3, 0.6, fk('move')) * (0.7 + 0.3 * u)) : 0;   // nubes que suben y bajan
      const ampLo = lerp(18, 26, fk('move')), ampHi = lerp(28, 42, fk('move'));
      const wantBolt = has('bolt') && n >= 2 && ((fresh === 'bolt' && early) || api.rand() < lerp(0.22, 0.42, fk('bolt')));
      const wantHill = has('peak') && n >= 2 && ((fresh === 'peak' && early) || api.rand() < lerp(0.25, 0.45, fk('peak')));
      // Nadie puede quedarse siempre pegado al agua ni al techo: cada tanto algo pasa por ahí.
      const forced = [];
      if (sinceLow >= 2) forced.push('low');
      if (sinceHigh >= 2) forced.push('high');
      if (forced.length === 2 && sinceHigh > sinceLow) forced.reverse();

      let list = null, y = prevY;
      for (let attempt = 0; attempt < 14 && !list; attempt++) {
        if (attempt === 7 && count > 1) count--;
        const tryList = [];
        let boltIn = !wantBolt || attempt >= 10, hillIn = !wantHill || attempt >= 10;
        for (let i = 0; i < count; i++) {
          const role = forced[i];
          if (role === 'high' && !boltIn) { tryList.push(makeBolt(cTop)); boltIn = true; continue; }
          if (role === 'low' && !hillIn) { tryList.push(makeHill()); hillIn = true; continue; }
          const s = api.randRange(0.95, 1.2);
          let amp = api.rand() < pMove ? api.randRange(ampLo, ampHi) : 0;
          let cy;
          if (role === 'low') { cy = api.randRange(waterY - 46, cBot); amp = 0; }
          else if (role === 'high') { cy = cTop + api.randRange(0, 12); amp = 0; }
          else if (api.rand() < lerp(0.3, 0.55, E)) cy = prevY + api.randRange(-28, 28);   // justo en el camino: hay que esquivarla
          else cy = api.randRange(cTop, cBot);
          if (cBot - cTop < 2 * amp + 10) amp = 0;
          tryList.push({ kind: 'cloud', dx: api.randRange(-30, 30), y: clamp(cy, cTop + amp, cBot - amp), s, amp });
        }
        // el rayo y el monte, si tocan y no entraron como "techo" o "piso", reemplazan una nube suelta o se suman
        for (const [want, make] of [[!boltIn, () => makeBolt(cTop)], [!hillIn, makeHill]]) {
          if (!want) continue;
          const j = tryList.findIndex((c, i) => c.kind === 'cloud' && !forced[i]);
          if (j >= 0 && tryList.length >= 2) tryList[j] = make(); else tryList.push(make());
        }
        const blocks = tryList.map(blockOf).sort((a, b) => a[0] - b[0]);
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
        list = [{ kind: 'cloud', dx: 0, y: prevY > (yTop + yBot) / 2 ? cTop + 6 : cBot - 6, s: 1, amp: 0 }];
        y = prevY; wind = 0; shower = false;
      }
      sinceLow = list.some(c => c.kind === 'hill' || (c.kind === 'cloud' && c.y + c.amp >= waterY - 50)) ? 0 : sinceLow + 1;
      sinceHigh = list.some(c => c.kind === 'bolt' || (c.kind === 'cloud' && c.y - c.amp <= cTop + 16)) ? 0 : sinceHigh + 1;
      return { obs: list, y, D, wind, shower };
    }
    // Nube de rayo: arriba, con un rayo que caerá hasta "tip".
    function makeBolt(cTop) {
      const s = api.randRange(1.0, 1.15), y = cTop + api.randRange(-4, 6);
      return { kind: 'bolt', dx: api.randRange(-20, 20), y, s, amp: 0, tip: y + band * api.randRange(0.28, lerp(0.42, 0.52, fk('bolt'))) };
    }
    // Cima de un monte que asoma del agua.
    function makeHill() {
      return { kind: 'hill', dx: api.randRange(-18, 18), top: waterY - band * api.randRange(0.2, lerp(0.34, 0.44, fk('peak'))), hw: api.randRange(40, 50) };
    }
    // Un tramo de túnel: paredes de nubes arriba y abajo con un pasillo que serpentea.
    function planTunnel(prevY, spd, first) {
      tunnelLeft--;
      const k = fk('tunnel');
      const G = Math.min(lerp(128, 102, k), band * 0.45);   // pasillo libre para el centro de la paloma
      const D = first ? 2 * EXT + spd * lerp(1.4, 1.05, E) : api.randRange(lerp(150, 136, k), lerp(166, 150, k));
      const drift = first ? 40 : lerp(22, 34, k);
      const y = clamp(prevY + api.randRange(-drift, drift), yTop + G / 2 + 4, yBot - G / 2 - 4);
      const obs = [];
      if (y - G / 2 > yTop + 8) obs.push({ kind: 'wall', side: 'top', dx: api.randRange(-6, 6), edge: y - G / 2 });
      if (y + G / 2 < yBot - 8) obs.push({ kind: 'wall', side: 'bot', dx: api.randRange(-6, 6), edge: y + G / 2 });
      sinceLow = 0; sinceHigh = 0;
      return { obs, y, D, wind: 0, shower: false, tunnel: true };
    }

    // Ramitas entre dos oleadas: en fila, en arco o en curva hacia el siguiente hueco.
    function placeOlives(x0, y0, x1, y1, tight) {
      const pts = [];
      if (tight) pts.push([(x0 + x1) / 2, (y0 + y1) / 2]);   // dentro del túnel: una por tramo
      else {
        const xa = x0 + EXT - 8, xb = x1 - EXT + 8, dy = y1 - y0;
        const few = api.rand() < lerp(0, 0.45, E);   // en niveles altos hay menos ramitas por tramo
        if (Math.abs(dy) < 34) {
          const ym = (y0 + y1) / 2;
          if (api.rand() < 0.5) {   // fila
            const xm = (xa + xb) / 2, n = few ? 1 : api.rand() < 0.5 ? 3 : 2;
            for (let i = 0; i < n; i++) pts.push([xm + (i - (n - 1) / 2) * 46, ym]);
          } else {                  // arco
            const up = ym - yTop > 60 && (yBot - ym < 60 || api.rand() < 0.6);
            const hump = api.randRange(28, 42) * (up ? 1 : -1);
            const n = few ? 2 : 3;
            for (let i = 0; i < n; i++) { const u = n === 3 ? i / 2 : 0.25 + i * 0.5; pts.push([lerp(xa + 14, xb - 14, u), lerp(y0, y1, u) - Math.sin(u * Math.PI) * hump]); }
          }
        } else {                    // curva hacia el siguiente hueco
          const n = few ? 2 : Math.abs(dy) > 90 ? 3 : 2;
          for (let i = 0; i < n; i++) { const u = (i + 0.5) / n; pts.push([lerp(xa, xb, u), lerp(y0, y1, smooth(u))]); }
        }
      }
      const kinds = pts.map(() => 'olive');
      // la lucecita que protege: en medio del camino, cada tanto
      if (has('shield') && shieldCd <= 0 && pts.length >= 2) { kinds[Math.floor(pts.length / 2)] = 'shield'; shieldCd = api.randRange(lerp(20, 15, fk('shield')), lerp(28, 21, fk('shield'))); }
      // premio por pasar justo por el hueco: ramita normal o dorada (vale 3)
      if (has('gold') && (!goldSeen || api.rand() < lerp(0.3, 0.45, fk('gold')))) { pts.push([x1, y1]); kinds.push('gold'); goldSeen = true; }
      else if (api.rand() < 0.15) { pts.push([x1, y1]); kinds.push('olive'); }
      const grp = { n: kinds.filter(k => k === 'olive').length, got: 0 };
      pts.forEach(([x, y], i) => olives.push({ x, y: clamp(y, yTop + 6, yBot - 8), ph: api.randRange(0, TAU), grp, kind: kinds[i] }));
    }

    function spawnWave() {
      const x = nextX, cur = plan;
      for (const c of cur.obs) {
        const cx = x + c.dx;
        if (c.kind === 'cloud') clouds.push({ x: cx, y: c.y, by: c.y, s: c.s, amp: c.amp, ph: api.randRange(0, TAU), w: TAU / api.randRange(lerp(3.8, 2.6, fk('move')), lerp(4.6, 3.4, fk('move'))), zap: 0, seed: api.randRange(0, 10) });
        else if (c.kind === 'bolt') bolts.push({ x: cx, y: c.y, s: c.s, tip: c.tip, warn: -1, on: false, zap: 0, seed: api.randRange(0, 10) });
        else if (c.kind === 'hill') hills.push({ x: cx, top: c.top, hw: c.hw, tree: api.rand() < 0.5 });
        else if (c.kind === 'wall') walls.push({ x: cx, side: c.side, edge: c.edge, seed: api.randRange(0, 10) });
      }
      marks.push({ x, y: cur.y });
      plan = planWave(cur.y, api.time);
      placeOlives(x, cur.y, x + plan.D, plan.y, !!(cur.tunnel && plan.tunnel));
      // zonas del tramo nuevo (entre esta oleada y la siguiente)
      const ov = lerp(0, 0.5, E) * EXT;
      if (plan.wind) winds.push({ x0: x + EXT - 12 - ov, x1: x + plan.D - EXT + 12 + ov, acc: plan.wind });
      if (plan.shower) showers.push({ x0: x + EXT - 30 - ov, x1: x + plan.D - EXT + 30 + ov, seed: api.randRange(0, 50) });
      nextX = x + plan.D;
    }

    // Altura del camino seguro en una x de la pantalla (para soltar al cuervo lejos de él).
    function pathYAt(x) {
      const pts = plan ? marks.concat([{ x: nextX, y: plan.y }]) : marks;
      if (!pts.length) return dove.y;
      if (x <= pts[0].x) return pts[0].y;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        if (x <= b.x) return lerp(a.y, b.y, smooth((x - a.x) / Math.max(1, b.x - a.x)));
      }
      return pts[pts.length - 1].y;
    }
    function spawnRaven() {
      const k = fk('raven'), spd = speedAt(api.time);
      const vx = lerp(60, 110, k), warnT = lerp(1.15, 0.8, k);
      const rel = spd + vx, x0 = W + 30 + rel * warnT;
      const tt = (x0 - DOVE_X) / rel;                       // cuándo llega a la x de la paloma
      const py = pathYAt(DOVE_X + spd * tt);                // dónde estará el camino seguro en ese momento
      const opts = [];
      for (let y = yTop + 12; y <= yBot - 12; y += 8) if (Math.abs(y - py) >= 88) opts.push(y);
      if (!opts.length) return false;
      const y = api.pick(opts);
      ravens.push({ x: x0, by: y, y, vx, ph: api.randRange(0, TAU) });
      return true;
    }

    // ── Inicio ──
    relayout();
    dove.y = yTop + band * 0.45;
    plan = { obs: [], y: dove.y, D: 0 };   // la primera "oleada" no trae nubes: unos segundos tranquilos
    {
      const solo = { n: 1, got: 0 }, row = { n: 2, got: 0 };
      olives.push({ x: 178, y: dove.y - 2, ph: 0, grp: solo, kind: 'olive' });   // una ramita regalada para empezar con alegría
      for (let i = 0; i < 2; i++) olives.push({ x: 268 + i * 48, y: dove.y + 6, ph: i + 1, grp: row, kind: 'olive' });
    }
    for (let i = 0; i < 6; i++) far.push({ x: api.randRange(-20, W + 60), f: (i + api.rand()) / 6, s: api.randRange(0.5, 1), par: 0 });
    for (const c of far) c.par = 0.1 + c.s * 0.2;
    if (fresh) api.hint(NEWS[fresh], 3600);
    else if (LV <= 3) api.hint('Mantén presionado para subir', 2600);

    function isHolding() { return touches.size > 0 || api.keys.has('up') || api.keys.has('action'); }
    function press() {
      launch = 0;
      dove.vy = Math.min(dove.vy, -85 * vs);   // respuesta inmediata al toque
      dove.wing = Math.PI * 0.5;
      flapT = 0.34;
      api.sfx('flap');
    }

    // Choque: quita una vida (o la luz protectora) y la paloma rebota hacia el lado libre (dir = -1 arriba, 1 abajo).
    function hit(dir, fx) {
      if (dove.shield > 0) {
        dove.shield = 0; dove.inv = 1.1;
        api.sfx('sparkle');
        api.burst(DOVE_X, dove.y, { color: '#fff1a8', count: 12, speed: 120, size: 4, gravity: 60, life: 0.6 });
        api.floatText(DOVE_X + 20, dove.y - 36, '¡Protegida!', { size: 18, color: '#fff4b8' });
      } else {
        api.loseLife(DOVE_X + 8, dove.y - 34);   // el motor pone el sonido, la sacudida y el destello
        dove.inv = 1.5; dove.hurt = 1;
        api.burst(DOVE_X, dove.y, { color: '#ffffff', count: 8, speed: 90, size: 4, gravity: 140, life: 0.6 });
      }
      dove.vy = dir * 120 * vs;
      if (fx) fx.zap = 0.4;
    }

    function collect(o) {
      if (o.kind === 'shield') {
        dove.shield = 1; dove.pop = 1;
        api.sfx('sparkle');
        api.burst(o.x, o.y, { color: '#fff1a8', count: 10, speed: 90, size: 4, life: 0.6 });
        api.floatText(o.x, o.y - 22, '¡Luz de Dios!', { size: 18, color: '#fff4b8' });
        return;
      }
      const gold = o.kind === 'gold';
      api.addScore(gold ? 3 : 1, o.x, o.y - 16);
      api.sfx(gold ? 'sparkle' : 'coin');
      api.burst(o.x, o.y, { color: gold ? '#ffd54a' : '#b9e07a', count: gold ? 11 : 7, speed: 80, size: 4, life: 0.5 });
      dove.carry = true; dove.pop = 1;
      if (!gold) {
        o.grp.got++;
        if (o.grp.n >= 3 && o.grp.got === o.grp.n) {   // ¡toda la fila!
          api.sfx('sparkle');
          api.burst(DOVE_X + 14, dove.y - 30, { emoji: '✨', count: 3, speed: 70, size: 14, life: 0.7, gravity: 40 });
        }
      }
      const sc = api.score;
      api.setProgress(sc / GOAL);
      // la historia avanza con las ramitas
      if (!told.rain && sc >= GOAL * 0.35) { told.rain = true; api.floatText(W / 2, api.top + 44, theme.say[0], { size: 22, color: '#eaf6ff' }); }
      if (!told.sun && sc >= GOAL * 0.65) { told.sun = true; api.sfx('chirp'); api.floatText(W / 2, api.top + 44, theme.say[1], { size: 22, color: '#fff3b0' }); }
      if (!told.bow && sc >= GOAL) {   // ¡meta! sale el arcoíris de la Alianza y termina el nivel
        told.bow = true; finale = 0.001; dove.inv = 0;
        api.sfx('chirp');
        api.floatText(W / 2, api.top + 76, night ? '¡Amanece! ¡El arcoíris!' : '¡El arcoíris!', { size: 24, color: '#ffffff' });
      }
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
    // Altura del suelo de una cima a una distancia dx de su centro (parábola: igual en el dibujo y en el choque).
    const hillBase = () => waterY + 14;
    const hillY = (h, dx) => h.top + (hillBase() - h.top) * Math.min(1, (dx / h.hw) * (dx / h.hw));
    function drawHill(g, h) {
      const base = hillBase();
      g.fillStyle = '#8b7a69'; g.beginPath(); g.moveTo(h.x - h.hw, base);
      for (let i = -8; i <= 8; i++) { const dx = (i / 8) * h.hw; g.lineTo(h.x + dx, hillY(h, dx)); }
      g.closePath(); g.fill();
      g.fillStyle = '#a3917d'; g.beginPath(); g.moveTo(h.x - h.hw * 0.15, base);   // luz en una ladera
      for (let i = 0; i <= 6; i++) { const dx = -h.hw * 0.15 + (i / 6) * h.hw * 0.9; g.lineTo(h.x + dx, hillY(h, dx) + 3); }
      g.lineTo(h.x + h.hw * 0.75, base); g.closePath(); g.fill();
      g.fillStyle = '#8fca8b'; g.beginPath();   // pasto en la cima
      for (let i = -4; i <= 4; i++) { const dx = (i / 4) * h.hw * 0.42; g.lineTo(h.x + dx, hillY(h, dx) - 1); }
      for (let i = 4; i >= -4; i--) { const dx = (i / 4) * h.hw * 0.42; g.lineTo(h.x + dx, hillY(h, dx) + 7 - Math.abs(i)); }
      g.closePath(); g.fill();
      if (h.tree) kit.olive(g, h.x + 6, h.top - 4, 0.6, -0.9);
    }
    function drawBolt(g, b) {
      const y0 = b.y + 14 * b.s, y1 = b.tip;
      if (b.on) {
        // el rayo: zigzag amarillo con centro blanco
        const flick = 0.8 + 0.2 * Math.sin(t * 30 + b.seed);
        g.save();
        g.globalAlpha = 0.28 * flick; g.fillStyle = '#fff3a0'; g.fillRect(b.x - 13, y0, 26, y1 - y0);
        g.globalAlpha = flick; g.lineJoin = 'round'; g.lineCap = 'round';
        for (const [col, lw] of [['#ffd23f', 9], ['#fffbe0', 3.5]]) {
          g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(b.x, y0);
          const segs = 6;
          for (let i = 1; i <= segs; i++) g.lineTo(b.x + (i === segs ? 0 : (i % 2 ? 7 : -7) * (1 + 0.3 * Math.sin(b.seed + i))), lerp(y0, y1, i / segs));
          g.stroke();
        }
        g.restore();
      } else if (b.warn >= 0) {
        // aviso: línea punteada que parpadea hasta donde caerá el rayo
        const blink = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 16));
        g.save(); g.globalAlpha = blink; g.strokeStyle = '#ffe066'; g.lineWidth = 3; g.setLineDash([7, 8]); g.lineDashOffset = -t * 40;
        g.beginPath(); g.moveTo(b.x, y0); g.lineTo(b.x, y1); g.stroke(); g.setLineDash([]);
        kit.circle(g, b.x, y1, 6, 'rgba(255, 230, 110, 0.9)');
        g.restore();
      }
      if (b.zap > 0) kit.circle(g, b.x, b.y + 10 * b.s, 32 * b.s, `rgba(255, 232, 130, ${(0.55 * b.zap / 0.4).toFixed(3)})`);
      kit.cloud(g, b.x, b.y + 3 * b.s, b.s * 1.08, 1, '#3f4660');
      kit.cloud(g, b.x, b.y, b.s * 1.08, 1, '#5b6380');
      kit.circle(g, b.x - 8 * b.s, b.y + 2 * b.s, 2.2 * b.s, '#262b3a'); kit.circle(g, b.x + 10 * b.s, b.y + 2 * b.s, 2.2 * b.s, '#262b3a');
      if (!b.on && b.warn >= 0) kit.text(g, '⚡', b.x + 26 * b.s, b.y - 14 * b.s, { size: 16 });
    }
    function drawWall(g, w) {
      const top = api.top;
      g.save();
      if (w.side === 'top') {
        for (let yy = w.edge - R + 2, i = 0; yy > top - 30; yy -= 27, i++) {
          const ox = Math.sin(w.seed + i * 1.7) * 6;
          kit.cloud(g, w.x + ox, yy - 14, 1.02, 1, '#59627a');
          kit.cloud(g, w.x + ox, yy - 17, 1.02, 1, '#7b859c');
        }
      } else {
        for (let yy = w.edge + R - 2, i = 0; yy < waterY + 20; yy += 27, i++) {
          const ox = Math.sin(w.seed + i * 1.7) * 6;
          kit.cloud(g, w.x + ox, yy + 4, 1.02, 1, '#59627a');
          kit.cloud(g, w.x + ox, yy + 1, 1.02, 1, '#7b859c');
        }
      }
      g.restore();
    }
    function drawRaven(g, r) {
      g.save(); g.translate(r.x, r.y); g.scale(-1, 1);   // mira hacia la izquierda: viene hacia la paloma
      const fl = Math.sin(t * 13 + r.ph);
      g.fillStyle = '#2c2934';
      g.beginPath(); g.moveTo(-14, 0); g.lineTo(-24, -5); g.lineTo(-23, 5); g.closePath(); g.fill();   // cola
      kit.ellipse(g, 0, 0, 15, 10, '#2c2934');                                                    // cuerpo
      kit.ellipse(g, 1, 3, 10, 5.5, '#433f4d');                                                   // pancita
      g.fillStyle = '#3a3644'; g.beginPath(); g.moveTo(-6, -3); g.quadraticCurveTo(0, -16 - fl * 9, 8, -4); g.closePath(); g.fill();   // ala
      kit.circle(g, 13, -4, 7.5, '#2c2934');                                                      // cabeza
      g.fillStyle = '#f2a33a'; g.beginPath(); g.moveTo(19, -6); g.lineTo(27, -3); g.lineTo(19, -1); g.closePath(); g.fill();   // pico
      kit.circle(g, 15, -6, 2.6, '#ffffff'); kit.circle(g, 15.6, -6, 1.4, '#1a1820');             // ojito
      g.restore();
    }

    // ¿Dónde está la paloma ahora? (zonas)
    function zoneAt(list, x) { for (const z of list) if (x >= z.x0 && x <= z.x1) return z; return null; }

    return {
      update(dt) {
        t += dt;
        relayout();
        if (finale > 0) {   // celebración final: ya no hay peligro; sale el arcoíris y termina el nivel
          finale += dt;
          if (finale >= 2) { finale = -1; api.end({ won: true }); return; }
        }
        if (finale < 0) return;
        const sec = api.time, speed = speedAt(sec) * (finale > 0 ? 0.7 : 1), dx = speed * dt;

        // ── Entrada: si se perdió un "soltar" (p. ej. durante la pausa), se corrige aquí ──
        if (api.pointer.down !== expectDown) { if (!api.pointer.down) touches.clear(); expectDown = api.pointer.down; }
        const hold = isHolding();

        // ── Vuelo flotante: velocidades limitadas, nada de caídas bruscas ──
        const px = DOVE_X + 4;
        const wz = zoneAt(winds, px), sz = zoneAt(showers, px);
        curWind = wz ? wz.acc * vs : 0;
        inShower = !!sz;
        const UP = inShower ? 820 : 1050, DOWN = inShower ? 780 : 560, MAXDOWN = inShower ? 200 : 165;
        if (launch > 0) launch -= dt;
        const dive = api.keys.has('down');
        if (hold) dove.vy -= UP * vs * dt;
        else if (launch <= 0) dove.vy += (dive ? 900 : DOWN) * vs * dt;
        if (launch <= 0) dove.vy += curWind * dt;
        dove.vy = clamp(dove.vy, -215 * vs, (dive ? 230 : MAXDOWN) * vs);
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
        if (shieldCd > 0) shieldCd -= dt;

        // ── Avance del mundo ──
        dist += dx;
        nextX -= dx;
        if (nextX <= SPAWN_X && finale === 0) spawnWave();
        for (const m of marks) m.x -= dx;
        while (marks.length && marks[0].x < -120) marks.shift();
        if (arkX > -200) arkX -= dx * 0.16;
        for (const p of peaks) { p.x -= dx * 0.25; if (p.x < -p.w) p.x += 900; }
        for (const c of far) { c.x -= dx * c.par; if (c.x < -60) { c.x += W + 120; c.f = api.rand(); } }
        for (const list of [winds, showers]) for (let i = list.length - 1; i >= 0; i--) { const z = list[i]; z.x0 -= dx; z.x1 -= dx; if (z.x1 < -20) list.splice(i, 1); }

        // ── Obstáculos ──
        const py = dove.y - 4;   // centro visual de la paloma
        const safe = dove.inv > 0 || finale > 0;
        for (let i = clouds.length - 1; i >= 0; i--) {
          const c = clouds[i];
          c.x -= dx;
          c.y = c.by + (c.amp ? Math.sin(c.ph + t * c.w) * c.amp : 0);
          if (c.zap > 0) c.zap -= dt;
          if (c.x < -70) { clouds.splice(i, 1); continue; }
          if (safe || Math.abs(c.x - px) > 70) continue;
          const ex = (px - (c.x + c.s)) / (30 * c.s + R), ey = (py - (c.y - 2 * c.s)) / (16 * c.s + R);
          const bx = px - (c.x + c.s), by = py - (c.y + 28 * c.s), br = 7 * c.s + R;
          if (ex * ex + ey * ey < 1 || bx * bx + by * by < br * br) hit(dove.y < c.y ? -1 : 1, c);
        }
        const warnT = lerp(1.4, 0.8, fk('bolt'));
        for (let i = bolts.length - 1; i >= 0; i--) {
          const b = bolts[i];
          b.x -= dx;
          if (b.zap > 0) b.zap -= dt;
          if (b.x < -70) { bolts.splice(i, 1); continue; }
          if (b.warn < 0 && b.x < W + 24) b.warn = 0;                               // se ve: empieza el aviso
          if (b.warn >= 0 && !b.on) { b.warn += dt; if (b.warn >= warnT && finale === 0) { b.on = true; api.sfx('whoosh'); } }
          if (safe || Math.abs(b.x - px) > 60) continue;
          const ex = (px - b.x) / (32 * b.s + R), ey = (py - (b.y - 2 * b.s)) / (17 * b.s + R);
          const inBolt = b.on && Math.abs(px - b.x) < 9 + R * 0.8 && py < b.tip + R * 0.7;
          if (ex * ex + ey * ey < 1 || inBolt) hit(1, b);
        }
        for (let i = hills.length - 1; i >= 0; i--) {
          const h = hills[i];
          h.x -= dx;
          if (h.x < -h.hw - 20) { hills.splice(i, 1); continue; }
          if (safe) continue;
          const ddx = Math.abs(px - h.x);
          if (ddx < h.hw + R * 0.5 && py + R * 0.7 > hillY(h, Math.max(0, ddx - R * 0.6))) hit(-1, null);
        }
        for (let i = walls.length - 1; i >= 0; i--) {
          const w = walls[i];
          w.x -= dx;
          if (w.x < -60) { walls.splice(i, 1); continue; }
          if (safe || Math.abs(px - w.x) > WALL_HW + R * 0.5) continue;
          if (w.side === 'top' ? py < w.edge - 1 : py > w.edge + 1) hit(w.side === 'top' ? 1 : -1, null);
        }
        // el cuervo: va más rápido que el mundo y se suelta lejos del camino seguro
        if (has('raven') && finale === 0) {
          ravenT -= dt;
          if (ravenT <= 0) {
            const busy = tunnelLeft > 0 || walls.length > 0;
            ravenT = !busy && spawnRaven() ? api.randRange(lerp(15, 8, fk('raven')), lerp(21, 12, fk('raven'))) : 1;
          }
        }
        for (let i = ravens.length - 1; i >= 0; i--) {
          const r = ravens[i];
          r.x -= dx + r.vx * dt;
          r.y = r.by + Math.sin(t * 3 + r.ph) * 6;
          if (r.x < -40) { ravens.splice(i, 1); continue; }
          if (safe) continue;
          const ax = px - r.x, ay = py - r.y;
          if (ax * ax + ay * ay < (R + 11) * (R + 11)) hit(dove.y < r.y ? -1 : 1, null);
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
        clearS += (clamp(api.score / GOAL) - clearS) * Math.min(1, dt * (finale > 0 ? 3 : 1.5));
      },

      draw(g) {
        if (!measured) relayout();
        const top = api.top;
        // ── Cielo: tres momentos de la historia según el escenario del nivel ──
        if (!sky || skyH !== H || skyG !== g) {
          sky = []; skyH = H; skyG = g;
          for (const k of theme.sky) {
            const gr = g.createLinearGradient(0, 0, 0, H);
            gr.addColorStop(0, SKY[k][0]); gr.addColorStop(0.65, SKY[k][1]); gr.addColorStop(1, SKY[k][2]);
            sky.push(gr);
          }
        }
        const p2 = clearS * 2;
        g.fillStyle = p2 < 1 ? sky[0] : sky[1]; g.fillRect(-12, -12, W + 24, H + 24);
        const over = p2 < 1 ? p2 : p2 - 1;
        if (over > 0.01) { g.globalAlpha = over; g.fillStyle = p2 < 1 ? sky[1] : sky[2]; g.fillRect(-12, -12, W + 24, H + 24); g.globalAlpha = 1; }

        // sol, luna, estrellas y arcoíris: señales de que la promesa se cumple
        if (night) {
          const nA = smooth((clearS - 0.2) / 0.2) * (1 - smooth((clearS - 0.78) / 0.16));
          if (nA > 0.01) {
            g.save(); g.globalAlpha = nA; kit.stars(g, W, Math.max(60, waterY - 40), t, 34, 11); kit.moon(g, W - 64, top + 56, 20); g.restore();
          }
          const dawnA = smooth((clearS - 0.82) / 0.16);
          if (dawnA > 0.01) { g.save(); g.globalAlpha = dawnA; kit.sun(g, W - 70, waterY - 26, 22, t); g.restore(); }
        } else {
          const sunA = clamp((clearS - 0.4) / 0.35);
          if (sunA > 0.01) {
            g.save(); g.globalAlpha = sunA;
            if (theme === THEMES.sunset) kit.sun(g, W - 70, lerp(top + 70, waterY - 70, clamp((clearS - 0.4) / 0.6)), 26, t);
            else kit.sun(g, W - 62, top + 52, 24, t);
            g.restore();
          }
        }
        const bowA = smooth((clearS - 0.78) / 0.2);
        if (bowA > 0.01) kit.rainbow(g, W * 0.6, waterY + 16, Math.min(W * 0.44, (waterY - top) * 0.62), 7, bowA * 0.8);

        // nubes lejanas
        const farCol = mix(theme.far0, theme.far1, clearS), farA = lerp(0.5, 0.72, clearS);
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

        // ── Zonas: ráfagas de viento (flechas) y aguaceros (nubarrón con lluvia fuerte) ──
        for (const z of winds) {
          if (z.x1 < -10 || z.x0 > W + 10) continue;
          const dir = z.acc < 0 ? -1 : 1;   // -1 empuja hacia arriba
          g.save();
          g.fillStyle = 'rgba(255, 255, 255, 0.1)'; g.fillRect(z.x0, top, z.x1 - z.x0, waterY - top);
          g.strokeStyle = 'rgba(255, 255, 255, 0.75)'; g.lineWidth = 3; g.lineCap = 'round'; g.lineJoin = 'round';
          g.beginPath();
          const sp = 46, off = (((t * 110 * dir) % sp) + sp) % sp;
          for (let xc = z.x0 + 26; xc < z.x1 - 14; xc += 52) {
            for (let yy = top + 8 + off; yy < waterY - 6; yy += sp) {
              g.moveTo(xc - 8, yy - 5 * dir); g.lineTo(xc, yy + 3 * dir); g.lineTo(xc + 8, yy - 5 * dir);
            }
          }
          g.stroke();
          g.restore();
        }
        for (const z of showers) {
          if (z.x1 < -10 || z.x0 > W + 10) continue;
          const w = z.x1 - z.x0, hh = waterY - top;
          g.save();
          g.fillStyle = 'rgba(36, 46, 76, 0.2)'; g.fillRect(z.x0, top, w, hh);
          g.globalAlpha = 0.75; g.strokeStyle = '#e4eeff'; g.lineWidth = 2; g.lineCap = 'round';
          g.beginPath();
          for (let i = 0; i < 30; i++) {
            const x = z.x0 + ((i * 47.3 + z.seed * 13) % w);
            const y = top + ((i * 97.1 + t * (560 + (i % 4) * 40)) % hh);
            g.moveTo(x, y); g.lineTo(x - 4, y + 18);
          }
          g.stroke();
          g.restore();
          for (let xx = z.x0 + 10; xx < z.x1; xx += 38) kit.circle(g, xx, top - 4, 26, '#4b546d');   // nubarrón
        }

        // ── Montes, nubes de tormenta, rayos y túneles ──
        for (const h of hills) if (h.x > -h.hw - 10 && h.x < W + h.hw + 10) drawHill(g, h);
        for (const c of clouds) {
          if (c.x < -70 || c.x > W + 70) continue;
          if (c.zap > 0) kit.circle(g, c.x, c.y + 24 * c.s, 30 * c.s, `rgba(255, 232, 130, ${(0.55 * c.zap / 0.4).toFixed(3)})`);
          kit.stormCloud(g, c.x, c.y, c.s, t + c.seed);
        }
        for (const w of walls) if (w.x > -60 && w.x < W + 60) drawWall(g, w);
        for (const b of bolts) if (b.x > -70 && b.x < W + 70) drawBolt(g, b);

        // ── Mar del diluvio ──
        g.save(); g.translate(-12, 0);
        kit.water(g, W + 24, H + 14, waterY, t, mix(theme.sea0[0], theme.sea1[0], clearS), mix(theme.sea0[1], theme.sea1[1], clearS));
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

        // ── Ramitas, ramitas doradas y lucecitas ──
        for (const o of olives) {
          if (o.x > W + 30) continue;
          const bob = Math.sin(t * 3 + o.ph) * 3;
          if (o.kind === 'shield') {
            const pulse = 1 + 0.12 * Math.sin(t * 5 + o.ph);
            kit.circle(g, o.x, o.y + bob, 22 * pulse, 'rgba(255, 244, 180, 0.3)');
            kit.circle(g, o.x, o.y + bob, 14 * pulse, 'rgba(255, 250, 220, 0.55)');
            kit.star(g, o.x, o.y + bob, 11, '#ffe066', t * 0.8);
            continue;
          }
          const gold = o.kind === 'gold';
          kit.circle(g, o.x, o.y + bob, gold ? 23 : 20, gold ? 'rgba(255, 220, 90, 0.3)' : 'rgba(244, 255, 226, 0.2)');
          kit.circle(g, o.x, o.y + bob, 14, gold ? 'rgba(255, 236, 150, 0.45)' : 'rgba(250, 255, 236, 0.3)');
          if (gold) {
            g.save(); g.translate(o.x, o.y + bob); g.rotate(-0.25 + Math.sin(t * 2 + o.ph) * 0.14); g.scale(1.3, 1.3);
            g.strokeStyle = '#b8860b'; g.lineWidth = 2.2; g.lineCap = 'round';
            g.beginPath(); g.moveTo(-15, 4); g.quadraticCurveTo(0, -2, 17, -6); g.stroke();
            for (const [lx, ly, a] of [[-9, 1, -1.0], [-3, -0.5, 0.9], [3, -2, -1.0], [9, -3.5, 0.8], [16, -6, -0.2]]) {
              g.save(); g.translate(lx, ly); g.rotate(a); g.fillStyle = a < 0 ? '#ffd54a' : '#f2b92a'; g.beginPath(); g.ellipse(0, -5.5, 2.7, 6.2, 0, 0, 6.28); g.fill(); g.restore();
            }
            g.restore();
            if (Math.sin(t * 4 + o.ph) > 0.6) kit.star(g, o.x + 13, o.y + bob - 13, 4, '#fffbe0', t);
          } else kit.olive(g, o.x, o.y + bob, 1.25, -0.25 + Math.sin(t * 2 + o.ph) * 0.14);
        }

        // ── El cuervo (con aviso en el borde antes de entrar) ──
        for (const r of ravens) {
          if (r.x > W + 6) {
            kit.circle(g, W - 18, r.y, 13, 'rgba(255, 255, 255, 0.85)', '#2c2934', 2);
            kit.text(g, '!', W - 18, r.y + 1, { size: 18, color: '#2c2934' });
          } else drawRaven(g, r);
        }

        // ── Palomita ──
        const hold = isHolding();
        const flap = hold ? 0.5 + 0.5 * Math.sin(dove.wing) : 0.66 + 0.14 * Math.sin(dove.wing);
        if (dove.shield > 0) {
          const pulse = 1 + 0.06 * Math.sin(t * 6);
          kit.circle(g, DOVE_X + 2, dove.y - 4, 30 * pulse, 'rgba(255, 240, 160, 0.22)', 'rgba(255, 226, 110, 0.85)', 2.5);
        }
        g.save();
        if (dove.inv > 0 && finale === 0) g.globalAlpha = api.reduceMotion ? 0.6 : (Math.floor(dove.inv * 11) % 2 ? 0.95 : 0.35);
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
      destroy() {
        for (const a of [clouds, bolts, hills, walls, ravens, winds, showers, olives, far, marks]) a.length = 0;
        touches.clear();
      },

      // Solo lectura, para las pruebas automáticas. "hazards": rectángulos (x0..x1, y0..y1) donde NO puede estar
      // el centro de la paloma (px = 94, py = y - 4); el cuervo trae su velocidad extra (vx) además del avance.
      get debug() {
        const pxc = DOVE_X + 4;
        const hz = [];
        for (const c of clouds) hz.push({ k: 'cloud', x0: c.x + c.s - 30 * c.s - R, x1: c.x + c.s + 30 * c.s + R, y0: c.by - c.amp - 18 * c.s - R, y1: c.by + c.amp + 35 * c.s + R });
        for (const b of bolts) hz.push({ k: b.on ? 'bolt' : b.warn >= 0 ? 'boltWarn' : 'boltCloud', x0: b.x - 32 * b.s - R, x1: b.x + 32 * b.s + R, y0: -1e4, y1: b.on || b.warn >= 0 ? b.tip + R * 0.7 : b.y + 19 * b.s + R });
        for (const h of hills) hz.push({ k: 'hill', x0: h.x - h.hw - R * 0.5, x1: h.x + h.hw + R * 0.5, y0: h.top - R * 0.7, y1: 1e4 });
        for (const w of walls) hz.push({ k: 'wall', x0: w.x - WALL_HW - R * 0.5, x1: w.x + WALL_HW + R * 0.5, y0: w.side === 'top' ? -1e4 : w.edge, y1: w.side === 'top' ? w.edge : 1e4 });
        return {
          level: LV, difficulty: E, goal: GOAL, finale, theme: night ? 'night' : theme === THEMES.sunset ? 'sunset' : 'day',
          y: dove.y, vy: dove.vy, inv: dove.inv, hold: isHolding(), carry: dove.carry, shield: dove.shield, px: pxc,
          yTop, yBot, waterY, band, vs, speed: speedAt(api.time), clear: clearS, dist, waves: planN,
          phys: { up: (inShower ? 820 : 1050) * vs, down: (inShower ? 780 : 560) * vs, maxUp: 215 * vs, maxDown: (inShower ? 200 : 165) * vs, wind: curWind, shower: inShower },
          hazards: hz,
          ravens: ravens.map(r => ({ x: r.x, y: r.y, by: r.by, vx: r.vx, r: 11 })),
          winds: winds.map(z => ({ x0: z.x0, x1: z.x1, acc: z.acc * vs })), showers: showers.map(z => ({ x0: z.x0, x1: z.x1 })),
          clouds: clouds.map(c => ({ x: c.x, y: c.y, by: c.by, s: c.s, amp: c.amp })),
          olives: olives.map(o => ({ x: o.x, y: o.y, kind: o.kind })),
          marks: marks.map(m => ({ x: m.x, y: m.y })), next: { x: nextX, y: plan ? plan.y : 0 },
        };
      },
    };
  },
};
