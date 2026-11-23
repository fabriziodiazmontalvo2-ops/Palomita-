// «Busca a la ovejita» — parábola de la oveja perdida (Lucas 15, 4-7).
// El pastor deja a las 99 en el corral y recorre un laberinto de setos hasta encontrar a la ovejita que se perdió.
// Al encontrarla la carga sobre sus hombros, lleno de alegría, y sale a buscar a la siguiente en un laberinto más grande.
//
// Niveles 1..100 (ver `levels` abajo): la meta va de 1 a 7 ovejitas y los laberintos crecen con api.difficulty y con
// cada ovejita encontrada. Cada ~10 niveles aparece algo nuevo (NOVEDADES): agua fresca, ovejita que camina, atardecer,
// arbustos en flor que se abren (atajos), niebla, portón con llave, noche con farol, charcos de barro, dos ovejitas a la
// vez, arroyo con puentecitos y, al final, llevarla en hombros de vuelta al corral. En su nivel la novedad sale segura en
// el primer laberinto y se anuncia con un cartelito; después se mezcla al azar con las demás.
//
// Control: mantener el dedo en la pantalla (o tocar un punto): el pastor camina por los pasillos hacia el dedo.
//   · Si el dedo está cerca por un camino corto (≤ NEAR celdas) va por ese camino: así no se atasca en esquinas ni en curvas.
//   · Si está lejos, avanza por el eje dominante pastor→dedo y, si hay seto, prueba el otro eje.
// También funciona con las flechas del teclado.

const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];      // 0 arriba · 1 derecha · 2 abajo · 3 izquierda
const KEY_DIR = { up: 0, right: 1, down: 2, left: 3 };
const NEAR = 7;             // largo máximo del "camino corto" hacia el dedo
const MARGIN = 10;          // margen lateral del laberinto
const MIN_CELL = 34;        // una celda nunca mide menos que esto
const MAX_COLS = 10;        // columnas del laberinto más grande
const FOUND_TIME = 1.2;     // segundos de celebración al encontrarla (o al llegar al corral)
const MUD_SLOW = 0.45;      // en el barro el pastor camina a menos de la mitad
const SHEEP_STEP = 0.55;    // segundos que tarda la ovejita que camina en pasar de una celda a otra

const FLOOR = '#e6f6bd', FLOOR_ALT = '#d8efa8', HOME = '#fbf0bb';
const HEDGE = '#3b9350', HEDGE_TOP = '#5bb56a', HEDGE_LEAF = '#93db8f', HEDGE_SHADE = 'rgba(38, 92, 54, 0.28)';
const FLOWERS = ['#ff9db5', '#ffffff', '#ffd75e', '#c9a7ff'];

// Momentos del día: cielo, colinas y prado del paisaje de arriba.
const SKIES = {
  day: { sky: ['#6fc1f3', '#dcf3ff'], hill: '#b9e9a0', meadow: ['#a2e08b', '#82cd74'] },
  sunset: { sky: ['#f39a74', '#ffe0a6'], hill: '#cfd88e', meadow: ['#addb82', '#86c46c'] },
  fog: { sky: ['#a9bccd', '#e9eff3'], hill: '#c7dcc2', meadow: ['#b3d8a6', '#94c78a'] },
  night: { sky: ['#1c2550', '#45508f'], hill: '#3e6270', meadow: ['#4f8063', '#3d6b52'] },
};

// Lo nuevo del camino de niveles (lv = nivel donde aparece por primera vez).
const NOVEDADES = [
  { lv: 8, key: 'water', hint: '¡Nuevo: agua fresca! Pasa por ella y ganas tiempo' },
  { lv: 11, key: 'walk', hint: '¡Nuevo: la ovejita camina! Síguela' },
  { lv: 16, key: 'sunset', hint: '¡Nuevo: atardecer en el prado!' },
  { lv: 21, key: 'bush', hint: '¡Nuevo: arbustos en flor! Se abren para dejarte pasar' },
  { lv: 31, key: 'fog', hint: '¡Nuevo: niebla! Sigue la lucecita de la ovejita' },
  { lv: 41, key: 'gate', hint: '¡Nuevo: un portón! Busca la llave dorada' },
  { lv: 51, key: 'night', hint: '¡Nuevo: de noche, con farol! Escucha su «¡Bee!»' },
  { lv: 61, key: 'mud', hint: '¡Nuevo: charcos de barro! Ahí se camina despacio' },
  { lv: 71, key: 'two', hint: '¡Nuevo: dos ovejitas perdidas en el mismo laberinto!' },
  { lv: 81, key: 'stream', hint: '¡Nuevo: un arroyo! Crúzalo por los puentecitos' },
  { lv: 91, key: 'home', hint: '¡Nuevo: llévala en hombros de vuelta al corral!' },
];
const DESDE = Object.fromEntries(NOVEDADES.map(n => [n.key, n.lv]));
const SKY_KEYS = ['sunset', 'fog', 'night'];

const bitsOf = o => (o & 1) + ((o >> 1) & 1) + ((o >> 2) & 1) + ((o >> 3) & 1);

// Generador sencillo con semilla (la semilla siempre sale de api.rand): sirve para repintar adornos idénticos.
function lcg(seed) {
  let s = (Math.floor(seed) % 2147483646) + 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

export default {
  id: 'oveja',
  // Nivel 1: una ovejita en un laberinto chico · nivel 100: siete ovejitas, laberintos grandes y todas las novedades.
  levels: {
    goal: [1, 7],
    curve: 1,
    time: [80, 105],
    selfEnd: true,          // el juego celebra la última ovejita y luego llama api.end({ won: true })
    goalLabel: n => (n === 1 ? 'Encuentra a la ovejita perdida' : `Encuentra ${n} ovejitas perdidas`),
  },
  create(api) {
    const { kit } = api;
    const { PAL, clamp, lerp, ease } = kit;
    const W = api.W;

    // ── Dificultad del nivel (api.difficulty: 0 en el nivel 1, 1 en el nivel 100) ──
    const LV = api.level || 1;
    const DIF = clamp(api.difficulty || 0);
    const GOAL = Math.max(1, api.goal || 1);
    const SPEED = lerp(5, 5.5, DIF);                 // celdas por segundo
    const BONUS = Math.round(lerp(10, 8, DIF));    // segundos de regalo por cada ovejita
    const WATER = Math.round(lerp(5, 3, DIF));     // segundos de regalo del agua fresca
    const FOG_R = lerp(3.5, 2.6, DIF);             // con niebla se ve hasta este radio (en celdas)
    const LAMP_R = lerp(3.4, 2.7, DIF);            // radio de luz del farol de noche (en celdas)
    const SHEEP_EVERY = lerp(2.8, 1.7, DIF);       // la ovejita que camina da un paso cada tantos segundos
    const HELP_K = lerp(1, 1.5, DIF);              // las estrellitas de ayuda tardan más en salir en niveles altos
    const has = k => LV >= DESDE[k];
    const NEWS = NOVEDADES.find(n => n.lv === LV) || null;

    // ── Estado ──
    let t = 0;                    // reloj propio para animaciones
    let round = 0;                // 0 = primer laberinto
    let mode = 'play';            // 'play' | 'found' | 'done'
    let foundT = 0, foundFx = 0;  // tiempo de celebración y efectos ya lanzados
    let foundKind = 'pick';       // 'pick' = la sube a los hombros · 'home' = llegó con ella al corral
    let foundSheep = null;
    let introT = 1;               // 0..1 aparición del laberinto nuevo
    let roundT = 0;               // segundos en este laberinto
    let seekT = 0, seekLen = 1;   // tiempo y largo del camino desde el último objetivo (para las estrellitas de ayuda)
    let carry = 0;                // ovejitas que lleva en hombros
    let goHome = false;           // true: ya la encontró y la lleva de vuelta al corral
    let maze = null, plan = null;
    let touched = false;          // ¿ya hubo algún toque o tecla?
    let cacheBuilds = 0;
    const L = { top: -1, H: -1 }; // medidas de la pantalla y del laberinto
    const p = { cx: 0, cy: 0, tx: 0, ty: 0, prog: 0, moving: false, face: 1, walkT: 0, bumpT: 0, bumpDir: 1, wait: 0 };
    const target = { x: 0, y: 0, active: false, stuck: 0 };
    const touch = { down: false, id: null };
    const held = [];              // flechas presionadas (la última manda)
    let queued = -1, queuedT = 0; // un toque corto de flecha también cuenta
    const bee = { next: 0.7, show: 0, who: 0 };
    const ripple = { x: 0, y: 0, t: 1 };
    const decor = [];
    const decoSeed = 1 + Math.floor(api.rand() * 1e6);

    // Las "99" del corral (se ven unas cuantas): posición relativa, dirección y fase de animación.
    const flock = [];
    for (let i = 0; i < 9; i++) {
      const back = i < 5, n = back ? 5 : 4, j = back ? i : i - 5;
      flock.push({ u: (j + 0.5) / n + api.randRange(-0.05, 0.05), v: back ? api.randRange(0.12, 0.32) : api.randRange(0.68, 0.9), dir: api.rand() < 0.5 ? -1 : 1, ph: api.randRange(0, 6.28) });
    }
    flock.sort((a, b) => a.v - b.v);

    // ── Plan de cada laberinto: tamaño, momento del día y novedades que salen ──
    function planRound(r) {
      const first = r === 0;
      const isNew = k => first && NEWS !== null && NEWS.key === k;
      const roll = (k, pr) => has(k) && (isNew(k) || api.rand() < pr);
      // en el primer laberinto de un nivel con novedad, las cosas "grandes" que no son la novedad se quedan fuera
      const big = (k, pr) => (first && NEWS && NEWS.key !== k ? false : roll(k, pr));
      const left = GOAL - api.score;
      const pl = { water: roll('water', 0.7), walk: roll('walk', 0.5), bush: roll('bush', 0.55), mud: roll('mud', 0.5), stream: big('stream', 0.4) };
      pl.two = left >= 2 && big('two', 0.4);
      pl.gate = !pl.two && big('gate', 0.4);
      pl.home = !pl.two && big('home', 0.3);
      let sky = 'day';
      if (NEWS && first && SKY_KEYS.includes(NEWS.key)) sky = NEWS.key;
      else if (!(NEWS && first)) {                               // si la novedad es otra cosa, de día para que se vea bien
        if (has('night') && api.rand() < 0.25) sky = 'night';
        else if (has('fog') && api.rand() < 0.25) sky = 'fog';
        else if (has('sunset') && api.rand() < 0.35) sky = 'sunset';
      }
      pl.sky = sky;
      pl.sheep = pl.two ? 2 : 1;
      // 5 columnas en el nivel 1 … 9 en el nivel 100, y media columna más por cada laberinto de la partida
      pl.cols = clamp(Math.floor(5.25 + 3.8 * Math.sqrt(DIF) + 0.5 * r), 5, MAX_COLS);
      return pl;
    }

    // ── Laberinto ──
    // Laberinto perfecto con búsqueda en profundidad (DFS). open[i] = bits de las salidas abiertas de la celda i.
    // Con arroyo (split ≥ 0) se tallan dos mitades por separado y se unen con 1 o 2 puentecitos.
    function carve(cols, rows, split) {
      const n = cols * rows, open = new Uint8Array(n), seen = new Uint8Array(n), stack = new Int16Array(n), opts = [0, 0, 0, 0];
      const part = y => (split >= 0 && y > split ? 1 : 0);
      for (let reg = 0; reg < (split >= 0 ? 2 : 1); reg++) {
        const y0 = reg === 0 ? 0 : split + 1, y1 = split >= 0 && reg === 0 ? split : rows - 1;
        const first = api.randInt(y0, y1) * cols + api.randInt(0, cols - 1);
        let sp = 0;
        stack[sp++] = first; seen[first] = 1;
        while (sp > 0) {
          const cur = stack[sp - 1], x = cur % cols, y = (cur / cols) | 0;
          let k = 0;
          for (let d = 0; d < 4; d++) {
            const nx = x + DX[d], ny = y + DY[d];
            if (nx >= 0 && ny >= 0 && nx < cols && ny < rows && part(ny) === reg && !seen[ny * cols + nx]) opts[k++] = d;
          }
          if (!k) { sp--; continue; }
          const d = opts[Math.min(k - 1, Math.floor(api.rand() * k))];
          const nb = cur + DX[d] + DY[d] * cols;
          open[cur] |= 1 << d; open[nb] |= 1 << ((d + 2) & 3);
          seen[nb] = 1; stack[sp++] = nb;
        }
      }
      if (split >= 0) {
        const two = api.rand() < lerp(0.75, 0.4, DIF);
        const xs = two ? [api.randInt(0, (cols >> 1) - 1), api.randInt((cols + 1) >> 1, cols - 1)] : [api.randInt(1, cols - 2)];
        for (const x of xs) { const a = split * cols + x; open[a] |= 4; open[a + cols] |= 1; }
      }
      return open;
    }
    // Distancias (BFS) desde una celda; devuelve la celda más lejana.
    function flood(open, cols, n, from, dist, queue) {
      dist.fill(-1);
      let qh = 0, qt = 0, far = from;
      queue[qt++] = from; dist[from] = 0;
      while (qh < qt) {
        const cur = queue[qh++], o = open[cur];
        if (dist[cur] > dist[far]) far = cur;
        for (let d = 0; d < 4; d++) {
          if (!(o & (1 << d))) continue;
          const nb = cur + DX[d] + DY[d] * cols;
          if (dist[nb] < 0) { dist[nb] = dist[cur] + 1; queue[qt++] = nb; }
        }
      }
      return far;
    }
    // Distancias desde varias celdas a la vez; `allow(c)` limita por dónde se puede pasar.
    function bfs(open, cols, srcs, dist, queue, allow) {
      dist.fill(-1);
      let qh = 0, qt = 0;
      for (const s of srcs) if (s >= 0 && dist[s] < 0) { dist[s] = 0; queue[qt++] = s; }
      while (qh < qt) {
        const cur = queue[qh++], o = open[cur];
        for (let d = 0; d < 4; d++) {
          if (!(o & (1 << d))) continue;
          const nb = cur + DX[d] + DY[d] * cols;
          if (dist[nb] < 0 && (!allow || allow(nb))) { dist[nb] = dist[cur] + 1; queue[qt++] = nb; }
        }
      }
    }
    // Vecino de `cur` que está un paso más cerca según `dist` (o -1).
    function stepDown(open, cols, cur, dist) {
      const o = open[cur];
      for (let d = 0; d < 4; d++) if (o & (1 << d)) { const nb = cur + DX[d] + DY[d] * cols; if (dist[nb] === dist[cur] - 1) return nb; }
      return -1;
    }
    const dirTo = (cols, a, b) => (b === a - cols ? 0 : b === a + 1 ? 1 : b === a + cols ? 2 : 3);
    // Un tramo entre dos celdas se guarda siempre como (celda de arriba/izquierda, 1 = derecha | 2 = abajo).
    const normEdge = (cols, a, d) => (d === 3 ? { a: a - 1, d: 1 } : d === 0 ? { a: a - cols, d: 2 } : { a, d });

    // Tamaño de la cuadrícula: `want` columnas si caben; en pantallas altas caben hasta 2 filas más (misma celda).
    function gridFor(want) {
      const aw = W - 2 * MARGIN, ah = L.areaY1 - L.areaY0;
      let cols = want;
      while (cols > 4 && Math.min(aw / cols, ah / (cols + 1)) < MIN_CELL) cols--;
      const cw = aw / cols;
      const rows = cols + 1 + clamp(Math.floor((ah - (cols + 1) * cw) / cw), 0, 2);
      return { cols, rows };
    }
    function newMaze() {
      plan = planRound(round);
      const { cols, rows } = gridFor(plan.cols), n = cols * rows;
      const split = plan.stream && rows >= 6 ? (rows >> 1) - 1 : -1;
      const start = api.rand() < 0.5 ? 0 : cols - 1;           // el pastor sale de una esquina de arriba (junto al corral)
      // Entre varios laberintos se elige el que tiene su rincón más lejano a un largo pensado para el tamaño: así la
      // dificultad sube poco a poco y no depende de la suerte ni del alto de la pantalla.
      const wanted = Math.round(0.55 * cols * (cols + 1));
      // Trabajo extra de este laberinto (volver al corral, buscar la llave, dos ovejitas, oscuridad, barro): la ovejita
      // se esconde un poco más cerca para que todos los laberintos de un nivel cuesten parecido.
      const work = (plan.home ? 1.85 : 1) * (plan.gate ? 1.25 : 1) * (plan.two ? 1.15 : 1) * (plan.mud ? 1.08 : 1)
        * (plan.sky === 'night' ? 1.3 : plan.sky === 'fog' ? 1.25 : 1);
      const reach = Math.max(6, Math.round(wanted / work));
      const dS = new Int16Array(n), dT = new Int16Array(n), tmp = new Int16Array(n), queue = new Int16Array(n);
      let best = null;
      for (let k = 0; k < 12; k++) {
        const open = carve(cols, rows, split);
        const far = flood(open, cols, n, start, dS, queue);
        const off = Math.abs(dS[far] - wanted);
        if (!best || off < best.off) best = { open, far, off };
        if (off <= 1) break;
      }
      const open = best.open;
      flood(open, cols, n, start, dS, queue);
      // La ovejita espera en un rincón sin salida a unos `reach` pasos de la salida (la más lejana si no hay trabajo extra).
      let sheep1 = best.far;
      if (reach < dS[best.far] - 1) {
        let bs = 1e9;
        for (let c = 0; c < n; c++) {
          if (c === start || bitsOf(open[c]) !== 1) continue;
          const sc = Math.abs(dS[c] - reach) + api.rand() * 1.5;
          if (sc < bs) { bs = sc; sheep1 = c; }
        }
      }
      const sheepCells = [sheep1];
      flood(open, cols, n, sheep1, dT, queue);
      // segunda ovejita: en otro rincón sin salida, a una distancia parecida de la salida y lejos de la primera
      if (plan.sheep === 2) {
        let pick = -1, bs = 1e9;
        for (let c = 0; c < n; c++) {
          if (c === start || c === sheep1 || bitsOf(open[c]) !== 1 || dT[c] < 4) continue;
          const sc = Math.abs(dS[c] - reach) + Math.max(0, reach * 0.6 - dT[c]) * 2 + api.rand() * 1.5;
          if (sc < bs) { bs = sc; pick = c; }
        }
        if (pick >= 0) sheepCells.push(pick); else plan.sheep = 1;
      }
      const len0 = dS[sheep1];
      const pathTo = (dist, out) => {                            // camino salida → ovejita según `dist` (distancias a la ovejita)
        out.length = 0; out.push(start);
        for (let cur = start, g = 0; cur !== sheep1 && cur >= 0 && g < n; g++) { cur = stepDown(open, cols, cur, dist); if (cur >= 0) out.push(cur); }
        return out;
      };
      const P = pathTo(dT, []);

      // Arbustos en flor: tramos de seto que se abren al empujarlos. El primero es un atajo del camino principal; ninguno
      // acorta el camino a la ovejita más de un 25 % (ayudan, pero no regalan el laberinto).
      const bushBits = new Uint8Array(n), bushes = [];
      if (plan.bush) {
        const want = 1 + Math.floor(DIF * 2.4);
        const onP = new Int16Array(n).fill(-1);
        P.forEach((c, i) => { onP[c] = i; });
        const helpful = [], other = [];
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
          const a = y * cols + x;
          for (let d = 1; d <= 2; d++) {
            if ((d === 1 && x === cols - 1) || (d === 2 && (y === rows - 1 || y === split))) continue;
            if (open[a] & (1 << d)) continue;
            const b = a + DX[d] + DY[d] * cols;
            if (sheepCells.includes(a) || sheepCells.includes(b) || a === start || b === start) continue;   // la ovejita sigue en su rincón
            const c = { a, b, d };
            if (onP[a] >= 0 && onP[b] >= 0 && Math.abs(onP[a] - onP[b]) - 1 >= 3) helpful.push(c);
            else if (Math.abs(dS[a] - dS[b]) - 1 >= 4) other.push(c);
          }
        }
        const used = new Set();
        for (const c of [...api.shuffle(helpful), ...api.shuffle(other)]) {
          if (bushes.length >= want) break;
          if (used.has(c.a) || used.has(c.b)) continue;
          const da = 1 << c.d, db = 1 << ((c.d + 2) & 3);
          open[c.a] |= da; open[c.b] |= db;
          flood(open, cols, n, start, tmp, queue);
          if (tmp[sheep1] < Math.ceil(len0 * 0.75) || sheepCells.some(sc => tmp[sc] < dS[sc] * 0.75)) { open[c.a] &= ~da; open[c.b] &= ~db; continue; }
          used.add(c.a); used.add(c.b);
          bushBits[c.a] |= da; bushBits[c.b] |= db;
          bushes.push({ a: c.a, d: c.d, t: 0, opened: false });
        }
        flood(open, cols, n, start, dS, queue);
        flood(open, cols, n, sheep1, dT, queue);
        pathTo(dT, P);
      }
      const len = dS[sheep1];
      const dS0 = dS.slice();

      // Portón con llave: cierra un tramo del camino principal; la llave está en un ramal del lado de acá.
      let gate = null, key = null;
      if (plan.gate && P.length >= 8) {
        const last = P.length - 1, idx = [];
        for (let i = Math.floor(last * 0.35); i <= Math.floor(last * 0.75); i++) idx.push(i);
        const offT = Math.round(lerp(2, 5, DIF));
        for (const i of api.shuffle(idx)) {
          const a = P[i], b = P[i + 1];
          if (b === sheepCells[0] || a === start) continue;
          const d = dirTo(cols, a, b), e = normEdge(cols, a, d);
          if ((bushBits[a] >> d) & 1) continue;
          if (e.d === 2 && ((e.a / cols) | 0) === split) continue;   // nunca en un puentecito
          open[a] &= ~(1 << d); open[b] &= ~(1 << ((d + 2) & 3));
          flood(open, cols, n, start, tmp, queue);
          let kc = -1;
          if (tmp[sheepCells[0]] < 0) {
            bfs(open, cols, P.slice(0, i + 1), dT, queue, c => tmp[c] >= 0);
            let bestScore = 1e9;
            for (let c = 0; c < n; c++) {
              if (c === start || tmp[c] < 0 || dT[c] < 1) continue;
              const sc = Math.abs(dT[c] - offT) + (dT[c] < 2 ? 3 : 0) + (bitsOf(open[c]) === 1 ? 0 : 0.6) + api.rand() * 0.9;
              if (sc < bestScore) { bestScore = sc; kc = c; }
            }
          }
          if (kc >= 0) { gate = { a: e.a, d: e.d, open: false, t: 0 }; key = { cell: kc, taken: false }; break; }
          open[a] |= 1 << d; open[b] |= 1 << ((d + 2) & 3);
        }
      }
      // Lo que se pinta abierto en la capa fija: pasillos, atajos y el hueco del portón (el portón se pinta encima).
      const draw = open.slice();
      if (gate) { draw[gate.a] |= 1 << gate.d; draw[gate.a + DX[gate.d] + DY[gate.d] * cols] |= 1 << ((gate.d + 2) & 3); }

      // Agua fresca: en el camino principal o a un paso de él, por la mitad del recorrido.
      const water = [];
      const busy = c => c === start || sheepCells.includes(c) || (key && key.cell === c);
      if (plan.water) {
        bfs(draw, cols, P, tmp, queue);
        const opts = [];
        for (let c = 0; c < n; c++) if (!busy(c) && tmp[c] >= 0 && tmp[c] <= 1 && dS0[c] >= Math.max(3, len * 0.2) && dS0[c] <= len * 0.7) opts.push(c);
        if (opts.length) water.push({ cell: api.pick(opts), taken: false });
      }
      // Charcos de barro: la mitad en el camino principal, el resto en cualquier parte.
      const mud = new Uint8Array(n);
      if (plan.mud) {
        const count = Math.round(lerp(2, 5, clamp((DIF - 0.6) / 0.4)));
        const free = c => !busy(c) && !mud[c] && !water.some(w => w.cell === c) && !(gate && (c === gate.a || c === gate.a + DX[gate.d] + DY[gate.d] * cols));
        let put = 0;
        for (const c of api.shuffle(P.slice(2, -2))) { if (put >= Math.ceil(count / 2)) break; if (free(c)) { mud[c] = 1; put++; } }
        for (let g = 0; g < 60 && put < count; g++) { const c = api.randInt(0, n - 1); if (free(c)) { mud[c] = 1; put++; } }
      }

      const sheep = sheepCells.map(c => ({
        cell: c, from: c, prog: 1, found: false, dir: (c % cols) < cols / 2 ? 1 : -1, prev: -1,
        wait: SHEEP_EVERY * api.randRange(0.8, 1.3), minD: Math.min(Math.floor(len * 0.5), dS0[c]),
      }));
      maze = {
        cols, rows, n, open, draw, bushBits, start, len, split, sheep, dS: dS0, toGoal: new Int16Array(n),
        visited: new Uint8Array(n), near: new Int8Array(n), queue, seed: 1 + Math.floor(api.rand() * 2e9),
        bushes, gate, key, water, mud, sky: plan.sky,
      };
      maze.visited[start] = 1;
      p.cx = p.tx = start % cols; p.cy = p.ty = 0; p.prog = 0; p.moving = false; p.face = start === 0 ? 1 : -1; p.bumpT = 0; p.wait = 0;
      target.active = false; target.stuck = 0;
      roundT = 0; bee.next = 0.6; bee.show = 0; carry = 0; goHome = false;
      computeGoal(); seekStart();
      fit();
    }

    // Distancias hasta lo que hay que alcanzar ahora: la llave, el corral (de vuelta) o las ovejitas que faltan.
    const goalSrc = [];
    function computeGoal() {
      const m = maze;
      goalSrc.length = 0;
      if (m.key && !m.key.taken) goalSrc.push(m.key.cell);
      else if (goHome) goalSrc.push(m.start);
      else for (const s of m.sheep) if (!s.found) goalSrc.push(s.cell);
      bfs(m.open, m.cols, goalSrc, m.toGoal, m.queue);
    }
    function seekStart() { seekT = 0; seekLen = Math.max(1, maze.toGoal[p.cx + p.cy * maze.cols]); }

    // ── Medidas ──
    function relayout() {
      const top = api.top, avail = api.bottom - top;
      L.top = top; L.H = api.H;
      L.bandH = clamp(avail - 424, 56, 150);                     // franja del paisaje con el corral
      const k = L.k = clamp((L.bandH - 56) / 94);                // 0 franja mínima · 1 franja completa
      L.horizon = top + lerp(14, 42, k);
      L.areaY0 = top + L.bandH + 6; L.areaY1 = api.bottom - 2;
      const w = lerp(150, 184, k), cx = W * 0.47, base = top + L.bandH - lerp(7, 16, k);
      L.corral = { x0: cx - w / 2, x1: cx + w / 2, base, back: base - lerp(22, 46, k), inset: lerp(8, 14, k), post: lerp(11, 19, k), fs: lerp(0.46, 0.7, k), signX: cx + w / 2 + lerp(24, 32, k) };
      if (maze) fit();
    }
    function fit() {
      const aw = W - 2 * MARGIN, ah = L.areaY1 - L.areaY0;
      L.cell = Math.max(14, Math.min(aw / maze.cols, ah / maze.rows));
      L.mw = L.cell * maze.cols; L.mh = L.cell * maze.rows;
      L.ox = (W - L.mw) / 2; L.oy = L.areaY0 + (ah - L.mh) / 2;
      L.wt = clamp(L.cell * 0.19, 6.5, 12);                      // grosor de los setos
      L.pad = L.wt / 2 + 2;
      L.ps = clamp(L.cell * 0.0125, 0.5, 0.86);                  // escala del pastor
      L.ss = clamp(L.cell * 0.0155, 0.6, 1.05);                  // escala de la ovejita
      L.darkY = Math.min(L.areaY0, L.oy - L.pad) - 6;            // desde aquí baja la oscuridad de la noche
      makeDecor();
      cacheDirty = true;
    }
    function syncLayout() {
      if (api.top !== L.top || api.H !== L.H) { relayout(); target.active = false; }
    }
    const cellX = cx => L.ox + (cx + 0.5) * L.cell;
    const cellY = cy => L.oy + (cy + 0.5) * L.cell;
    const feetY = cy => L.oy + (cy + 0.8) * L.cell;
    const ix = c => c % maze.cols, iy = c => (c / maze.cols) | 0;
    // Tramo de pared entre dos celdas (para portón y arbustos): segmento en coordenadas de pantalla.
    function edgeLine(a, d) {
      const x = ix(a), y = iy(a), c = L.cell;
      if (d === 1) { const X = L.ox + (x + 1) * c, Y = L.oy + y * c; return { x0: X, y0: Y, x1: X, y1: Y + c }; }
      const X = L.ox + x * c, Y = L.oy + (y + 1) * c;
      return { x0: X, y0: Y, x1: X + c, y1: Y };
    }

    // Flores y matitas en los huecos libres del prado.
    function makeDecor() {
      const rnd = lcg(decoSeed + round * 7919 + Math.round(L.H));
      decor.length = 0;
      const c = L.corral, mTop = L.oy - L.pad, mBot = L.oy + L.mh + L.pad + 5;
      const zones = [
        [50, c.back + 6, c.x0 - 16, c.base + 4],
        [c.signX + 26, c.back + 6, W - 8, c.base + 4],
        [12, c.base + 14, W - 12, mTop - 3],
        [12, mBot + 12, W - 12, L.H - 3],
      ];
      for (const [x0, y0, x1, y1] of zones) {
        if (x1 - x0 < 8 || y1 - y0 < 2) continue;
        const count = clamp(Math.round((x1 - x0) * (y1 - y0 + 10) / 1100), 1, 9);
        for (let i = 0; i < count; i++) {
          decor.push({ x: lerp(x0, x1, (i + 0.15 + rnd() * 0.7) / count), y: lerp(y0, y1, rnd()), flower: rnd() < 0.6, color: FLOWERS[Math.floor(rnd() * FLOWERS.length) % FLOWERS.length], s: 0.6 + rnd() * 0.3 });
        }
      }
    }

    // ── Capa fija (paisaje, corral y laberinto) pintada una sola vez en un lienzo aparte ──
    let cache = null, cacheDirty = true, cacheScale = 0, cacheW = 0, cacheH = 0;

    function fence(c, xa, xb, y, h) {
      const n = Math.max(2, Math.round((xb - xa) / 22));
      kit.fillRR(c, xa - 2, y - h * 0.82, xb - xa + 4, 3.2, 1.6, PAL.wood);
      kit.fillRR(c, xa - 2, y - h * 0.42, xb - xa + 4, 3.2, 1.6, PAL.wood);
      for (let i = 0; i <= n; i++) kit.fillRR(c, lerp(xa, xb, i / n) - 2.2, y - h, 4.4, h, 2, PAL.woodDeep);
    }
    // Silueta de los setos: franjas + hileras de arbustitos redondos, todo en una sola ruta (se rellena de una vez).
    function hedgeShape(c, walls, dy, half, rBump, rNode) {
      const m = maze, { ox, oy, cell, wt } = L;
      const nB = Math.max(2, Math.round(cell / (wt * 1.2)));
      c.beginPath();
      for (let i = 0; i < walls.length; i += 4) {
        const xa = walls[i], ya = walls[i + 1], xb = walls[i + 2], yb = walls[i + 3];
        if (ya === yb) c.rect(xa, ya - half + dy, xb - xa, half * 2); else c.rect(xa - half, ya + dy, half * 2, yb - ya);
        for (let j = 1; j < nB; j++) { const x = lerp(xa, xb, j / nB), y = lerp(ya, yb, j / nB) + dy; c.moveTo(x + rBump, y); c.arc(x, y, rBump, 0, 6.2832); }
      }
      for (let y = 0; y <= m.rows; y++) for (let x = 0; x <= m.cols; x++) {
        if (y === m.split + 1 && x > 0 && x < m.cols) continue;   // sobre el arroyo no hay arbustitos
        const nx = ox + x * cell, ny = oy + y * cell + dy; c.moveTo(nx + rNode, ny); c.arc(nx, ny, rNode, 0, 6.2832);
      }
    }
    function paintStatic(c) {
      const H = L.H, top = L.top, k = L.k, co = L.corral, S = SKIES[maze.sky] || SKIES.day;
      // cielo y colinas (según el momento del día)
      const sky = c.createLinearGradient(0, 0, 0, L.horizon + 10);
      sky.addColorStop(0, S.sky[0]); sky.addColorStop(1, S.sky[1]);
      c.fillStyle = sky; c.fillRect(0, 0, W, L.horizon + 14);
      if (maze.sky === 'day' && k > 0.5) kit.sun(c, W - 30, top + 15, 12, 0.4);
      if (maze.sky === 'sunset') kit.sun(c, W - 62, L.horizon + 4, lerp(9, 14, k), 0.4);
      if (maze.sky === 'fog') kit.circle(c, W - 36, top + lerp(10, 18, k), lerp(7, 11, k), 'rgba(255, 255, 255, 0.7)');
      kit.hills(c, W, H, L.horizon, lerp(4, 8, k), S.hill, 30, 0.021);
      const meadow = c.createLinearGradient(0, L.horizon, 0, H);
      meadow.addColorStop(0, S.meadow[0]); meadow.addColorStop(1, S.meadow[1]);
      kit.hills(c, W, H, L.horizon + lerp(7, 12, k), lerp(2, 4, k), meadow, 140, 0.013);
      // árboles
      kit.tree(c, 28, co.base + 2, lerp(0.5, 0.92, k));
      kit.tree(c, W - 22, co.base - lerp(4, 22, k), lerp(0.4, 0.62, k), { kind: 'olive' });
      // corral: suelo de tierra clara, cerca del fondo y laterales (la cerca de delante se pinta encima de las ovejas)
      c.save();
      c.fillStyle = 'rgba(247, 232, 180, 0.6)';
      c.beginPath(); c.moveTo(co.x0 + co.inset, co.back - 2); c.lineTo(co.x1 - co.inset, co.back - 2); c.lineTo(co.x1 + 2, co.base + 2); c.lineTo(co.x0 - 2, co.base + 2); c.closePath(); c.fill();
      c.strokeStyle = PAL.wood; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath();
      c.moveTo(co.x0 + co.inset, co.back - co.post * 0.5); c.lineTo(co.x0, co.base - co.post * 0.6);
      c.moveTo(co.x1 - co.inset, co.back - co.post * 0.5); c.lineTo(co.x1, co.base - co.post * 0.6);
      c.stroke();
      c.restore();
      fence(c, co.x0 + co.inset, co.x1 - co.inset, co.back, co.post * 0.8);
      // letrero (el número se pinta en vivo)
      const sh = co.post * 1.9;
      kit.fillRR(c, co.signX - 2.2, co.base - sh, 4.4, sh, 2, PAL.woodDeep);
      kit.fillRR(c, co.signX - 21, co.base - sh - 12, 42, 25, 7, PAL.woodDeep);
      kit.fillRR(c, co.signX - 19, co.base - sh - 10, 38, 21, 5.5, '#f3d9a4');
      // flores y matitas
      for (const d of decor) { if (d.flower) kit.flower(c, d.x, d.y, d.s, d.color); else kit.grass(c, d.x, d.y, d.s + 0.2, '#5cb565'); }
      paintMaze(c);
    }
    function paintMaze(c) {
      const m = maze, { ox, oy, cell, mw, mh, wt, pad } = L;
      const rnd = lcg(m.seed);
      // tablero de prado claro
      kit.fillRR(c, ox - pad, oy - pad + 5, mw + pad * 2, mh + pad * 2, wt + 3, 'rgba(45, 100, 60, 0.25)');
      kit.fillRR(c, ox - pad, oy - pad, mw + pad * 2, mh + pad * 2, wt + 3, FLOOR);
      const ins = wt * 0.5 + 1.5, tile = cell - ins * 2, rad = Math.min(10, tile * 0.28);
      for (let y = 0; y < m.rows; y++) for (let x = 0; x < m.cols; x++) {
        const i = y * m.cols + x;
        if (i === m.start) kit.fillRR(c, ox + x * cell + ins, oy + y * cell + ins, tile, tile, rad, HOME);
        else if ((x + y) & 1) kit.fillRR(c, ox + x * cell + ins, oy + y * cell + ins, tile, tile, rad, FLOOR_ALT);
      }
      // charcos de barro
      for (let i = 0; i < m.n; i++) {
        if (!m.mud[i]) continue;
        const x = cellX(ix(i)), y = cellY(iy(i)) + cell * 0.08;
        kit.ellipse(c, x, y, cell * 0.36, cell * 0.25, '#b08458', 0.2);
        kit.ellipse(c, x + cell * 0.03, y + cell * 0.02, cell * 0.25, cell * 0.16, '#8f6440', 0.2);
        kit.circle(c, x - cell * 0.1, y - cell * 0.05, cell * 0.04, 'rgba(255, 255, 255, 0.35)');
        kit.circle(c, x + cell * 0.12, y + cell * 0.06, cell * 0.03, 'rgba(255, 255, 255, 0.3)');
      }
      // arroyo con puentecitos
      if (m.split >= 0) {
        const Y = oy + (m.split + 1) * cell, th = cell * 0.17;
        c.save();
        c.fillStyle = '#5fb3e6'; c.beginPath();
        c.moveTo(ox - pad, Y - th);
        for (let x = ox - pad; x <= ox + mw + pad + 6; x += 6) c.lineTo(x, Y - th + Math.sin(x * 0.11) * 1.6);
        for (let x = ox + mw + pad; x >= ox - pad - 6; x -= 6) c.lineTo(x, Y + th + Math.sin(x * 0.13 + 1) * 1.6);
        c.closePath(); c.fill();
        c.strokeStyle = 'rgba(255, 255, 255, 0.55)'; c.lineWidth = 1.6; c.lineCap = 'round'; c.beginPath();
        for (let x = ox; x < ox + mw; x += cell * 0.5) { c.moveTo(x + 4, Y - 1 + Math.sin(x) * 2); c.lineTo(x + cell * 0.22, Y - 1 + Math.sin(x) * 2); }
        c.stroke();
        c.restore();
        for (let x = 0; x < m.cols; x++) {
          if (!(m.draw[m.split * m.cols + x] & 4)) continue;
          const bx = ox + x * cell + cell * 0.2, bw = cell * 0.6;
          kit.fillRR(c, bx, Y - th - 4, bw, th * 2 + 8, 3, PAL.wood);
          c.save(); c.strokeStyle = PAL.woodDeep; c.lineWidth = 1.4; c.beginPath();
          for (let j = 1; j < 4; j++) { const yy = Y - th - 4 + (th * 2 + 8) * j / 4; c.moveTo(bx + 2, yy); c.lineTo(bx + bw - 2, yy); }
          c.stroke(); c.restore();
          kit.fillRR(c, bx - 2, Y - th - 6, 3.4, th * 2 + 12, 1.7, PAL.woodDeep);
          kit.fillRR(c, bx + bw - 1.4, Y - th - 6, 3.4, th * 2 + 12, 1.7, PAL.woodDeep);
        }
      }
      // setos: lista de tramos (borde + paredes interiores), y luego sombra, cuerpo y lomo más claro
      const walls = [];
      for (let x = 0; x < m.cols; x++) walls.push(ox + x * cell, oy, ox + (x + 1) * cell, oy, ox + x * cell, oy + mh, ox + (x + 1) * cell, oy + mh);
      for (let y = 0; y < m.rows; y++) walls.push(ox, oy + y * cell, ox, oy + (y + 1) * cell, ox + mw, oy + y * cell, ox + mw, oy + (y + 1) * cell);
      for (let y = 0; y < m.rows; y++) for (let x = 0; x < m.cols; x++) {
        const o = m.draw[y * m.cols + x];
        if (x < m.cols - 1 && !(o & 2)) walls.push(ox + (x + 1) * cell, oy + y * cell, ox + (x + 1) * cell, oy + (y + 1) * cell);
        if (y < m.rows - 1 && y !== m.split && !(o & 4)) walls.push(ox + x * cell, oy + (y + 1) * cell, ox + (x + 1) * cell, oy + (y + 1) * cell);
      }
      c.save();
      c.fillStyle = HEDGE_SHADE; hedgeShape(c, walls, wt * 0.36, wt * 0.42, wt * 0.58, wt * 0.66); c.fill();
      c.fillStyle = HEDGE; hedgeShape(c, walls, 0, wt * 0.42, wt * 0.58, wt * 0.66); c.fill();
      c.fillStyle = HEDGE_TOP; hedgeShape(c, walls, -wt * 0.16, wt * 0.2, wt * 0.36, wt * 0.42); c.fill();
      // hojitas claras y alguna flor sobre los setos
      const leaf = (x, y) => { c.moveTo(x + wt * 0.15, y); c.arc(x, y, wt * 0.15, 0, 6.2832); };
      const blooms = [];
      c.fillStyle = HEDGE_LEAF; c.beginPath();
      const sprinkle = (xa, ya, xb, yb) => {
        const u = 0.2 + rnd() * 0.6, r = rnd();
        const x = lerp(xa, xb, u), y = lerp(ya, yb, u) - wt * 0.2;
        if (r < 0.1) blooms.push(x, y, Math.floor(rnd() * 3)); else if (r < 0.75) leaf(x + (rnd() - 0.5) * wt * 0.3, y);
      };
      for (let i = 0; i < walls.length; i += 4) sprinkle(walls[i], walls[i + 1], walls[i + 2], walls[i + 3]);
      c.fill();
      for (let i = 0; i < blooms.length; i += 3) {
        const bx = blooms[i], by = blooms[i + 1], r = wt * 0.17;
        c.fillStyle = FLOWERS[blooms[i + 2]]; c.beginPath();
        for (let a = 0; a < 4; a++) { const px = bx + Math.cos(a * 1.5708 + 0.6) * r, py = by + Math.sin(a * 1.5708 + 0.6) * r; c.moveTo(px + r, py); c.arc(px, py, r, 0, 6.2832); }
        c.fill();
        c.fillStyle = '#ffb347'; c.beginPath(); c.arc(bx, by, r * 0.7, 0, 6.2832); c.fill();
      }
      c.restore();
    }
    // Devuelve true si la capa fija quedó lista en el lienzo aparte (y con la misma resolución que la pantalla).
    function ensureCache(g) {
      const cv = g.canvas;
      if (!cv || typeof document === 'undefined') return false;
      const ps = typeof g.getTransform === 'function' ? g.getTransform().a : cv.width / W;
      if (!(ps > 0)) return false;
      if (!cacheDirty && cache && cacheW === cv.width && cacheH === cv.height && Math.abs(ps - cacheScale) < 1e-4) return true;
      if (!cache) cache = document.createElement('canvas');
      if (cache.width !== cv.width || cache.height !== cv.height) { cache.width = cv.width; cache.height = cv.height; }
      const c = cache.getContext('2d');
      if (!c) return false;
      c.setTransform(ps, 0, 0, ps, 0, 0);
      c.globalAlpha = 1;
      paintStatic(c);
      cacheScale = ps; cacheW = cv.width; cacheH = cv.height; cacheDirty = false; cacheBuilds++;
      return true;
    }

    // ── Movimiento ──
    // Primer paso del camino corto (≤ NEAR celdas) desde `here` hasta `goal`, o -1 si no lo hay.
    function nearStep(here, goal) {
      const m = maze, near = m.near, q = m.queue;
      near.fill(-1);
      let qh = 0, qt = 0;
      q[qt++] = goal; near[goal] = 0;
      while (qh < qt) {
        const cur = q[qh++], dc = near[cur];
        if (cur === here) break;
        if (dc >= NEAR) continue;
        const o = m.open[cur];
        for (let d = 0; d < 4; d++) {
          if (!(o & (1 << d))) continue;
          const nb = cur + DX[d] + DY[d] * m.cols;
          if (near[nb] < 0) { near[nb] = dc + 1; q[qt++] = nb; }
        }
      }
      const dh = near[here];
      if (dh <= 0) return -1;
      const o = m.open[here];
      for (let d = 0; d < 4; d++) if ((o & (1 << d)) && near[here + DX[d] + DY[d] * m.cols] === dh - 1) return d;
      return -1;
    }
    function bump(d) { p.bumpT = 1; p.bumpDir = d; if (DX[d]) p.face = DX[d]; api.sfx('tap'); }
    // ¿Hacia dónde da el siguiente paso el pastor? (-1 = se queda quieto)
    function chooseDir() {
      const m = maze, here = p.cx + p.cy * m.cols, o = m.open[here];
      if (queued >= 0) { const d = queued; queued = -1; if (o & (1 << d)) return d; bump(d); }
      for (let i = held.length - 1; i >= 0; i--) if (o & (1 << held[i])) return held[i];
      if (held.length || !target.active) return -1;
      // posición del dedo en unidades de celda (los centros caen en números enteros)
      const fx = clamp((target.x - L.ox) / L.cell - 0.5, 0, m.cols - 1), fy = clamp((target.y - L.oy) / L.cell - 0.5, 0, m.rows - 1);
      const gx = Math.round(fx), gy = Math.round(fy);
      if (gx === p.cx && gy === p.cy) { if (!touch.down) target.active = false; target.stuck = 0; return -1; }
      let d = nearStep(here, gx + gy * m.cols);
      if (d < 0) {
        // lejos: eje dominante y, si hay seto, el otro eje (solo si el dedo está de verdad en otra fila/columna: así no baila)
        const dx = fx - p.cx, dy = fy - p.cy, ax = Math.abs(dx), ay = Math.abs(dy);
        const hx = ax > 0.5 ? (dx > 0 ? 1 : 3) : -1, hy = ay > 0.5 ? (dy > 0 ? 2 : 0) : -1;
        const first = ax >= ay ? hx : hy, second = ax >= ay ? hy : hx;
        if (first >= 0 && (o & (1 << first))) d = first; else if (second >= 0 && (o & (1 << second))) d = second;
      }
      return d;
    }
    // Arbusto en flor (todavía cerrado) en la salida `d` de la celda `a`, o null.
    function closedBush(a, d) {
      const m = maze;
      if (!((m.bushBits[a] >> d) & 1)) return null;
      const e = normEdge(m.cols, a, d);
      return m.bushes.find(b => b.a === e.a && b.d === e.d && !b.opened) || null;
    }
    function openBush(b) {
      const m = maze, nb = b.a + DX[b.d] + DY[b.d] * m.cols;
      b.opened = true; b.t = 0;
      m.bushBits[b.a] &= ~(1 << b.d); m.bushBits[nb] &= ~(1 << ((b.d + 2) & 3));
      const { x0, y0, x1, y1 } = edgeLine(b.a, b.d);
      api.sfx('grow');
      api.burst((x0 + x1) / 2, (y0 + y1) / 2, { color: '#ff9db5', count: 9, speed: 80, size: 3.5, gravity: 60, life: 0.7 });
    }
    function movePastor(dt) {
      if (queuedT > 0) { queuedT -= dt; if (queuedT <= 0) queued = -1; }
      if (p.wait > 0) { p.wait -= dt; return; }                 // el arbusto se está abriendo
      const m = maze;
      let budget = SPEED * dt;
      for (let guard = 0; guard < 4 && budget > 1e-6 && mode === 'play'; guard++) {
        if (!p.moving) {
          const d = chooseDir();
          if (d < 0) break;
          const bush = closedBush(p.cx + p.cy * m.cols, d);
          if (bush) { openBush(bush); p.wait = 0.3; if (DX[d]) p.face = DX[d]; break; }
          p.moving = true; p.prog = 0; p.tx = p.cx + DX[d]; p.ty = p.cy + DY[d];
          if (DX[d]) p.face = DX[d];
          target.stuck = 0;
          if (m.mud[p.tx + p.ty * m.cols]) api.sfx('splash');
        }
        const f = m.mud[p.cx + p.cy * m.cols] || m.mud[p.tx + p.ty * m.cols] ? MUD_SLOW : 1;
        const use = Math.min(1 - p.prog, budget * f);
        p.prog += use; budget -= use / f; p.walkT += use;
        if (p.prog >= 1 - 1e-6) {
          p.cx = p.tx; p.cy = p.ty; p.prog = 0; p.moving = false;
          arrive(p.cx + p.cy * m.cols);
        }
      }
      if (!p.moving && target.active && mode === 'play') {
        target.stuck += dt;
        if (!touch.down && target.stuck > 0.45) target.active = false;   // un toque suelto que no se puede alcanzar se olvida
      }
    }
    // El pastor llega a una celda: agua, llave, corral u ovejita.
    function arrive(idx) {
      const m = maze;
      m.visited[idx] = 1;
      api.sfx('step');
      const x = cellX(ix(idx)), y = cellY(iy(idx));
      for (const w of m.water) {
        if (w.taken || w.cell !== idx) continue;
        w.taken = true;
        api.addTime(WATER);
        api.sfx('drop'); api.sfx('coin');
        api.burst(x, y, { color: PAL.water, count: 10, speed: 90, size: 3.5, life: 0.6 });
        say(x, y - L.cell * 0.4, `+${WATER} s`, 18, '#c9f0ff');
      }
      if (m.key && !m.key.taken && m.key.cell === idx) {
        m.key.taken = true;
        const gt = m.gate, nb = gt.a + DX[gt.d] + DY[gt.d] * m.cols;
        m.open[gt.a] |= 1 << gt.d; m.open[nb] |= 1 << ((gt.d + 2) & 3);
        gt.open = true; gt.t = 0;
        api.sfx('bell'); api.sfx('sparkle');
        api.burst(x, y, { color: PAL.sun, count: 12, speed: 100, size: 4, life: 0.7 });
        say(x, y - L.cell * 0.5, '¡La llave!', 20, '#fff2a8');
        const g = edgeLine(gt.a, gt.d);
        api.burst((g.x0 + g.x1) / 2, (g.y0 + g.y1) / 2, { emoji: '✨', count: 4, speed: 60, size: 14, gravity: -20, life: 0.9 });
        computeGoal(); seekStart();
      }
      if (goHome) { if (idx === m.start) arriveHome(); return; }
      const s = sheepNear(idx);
      if (s) found(s);
    }
    // ¿Hay una ovejita en esta celda o al lado (sin seto de por medio)?
    function sheepNear(here) {
      const m = maze, o = m.open[here];
      for (const s of m.sheep) {
        if (s.found) continue;
        if (s.cell === here) return s;
        for (let d = 0; d < 4; d++) if ((o & (1 << d)) && here + DX[d] + DY[d] * m.cols === s.cell) return s;
      }
      return null;
    }
    function sheepPos(s) {
      const e = ease.inOut(clamp(s.prog));
      return { x: lerp(cellX(ix(s.from)), cellX(ix(s.cell)), e), y: lerp(feetY(iy(s.from)), feetY(iy(s.cell)), e) };
    }
    function found(s) {
      s.found = true; s.prog = 1; s.from = s.cell;
      mode = 'found'; foundKind = 'pick'; foundSheep = s; foundT = 0; foundFx = 0;
      target.active = false; queued = -1;
      const m = maze, sx = cellX(ix(s.cell)), sy = feetY(iy(s.cell)), px = cellX(p.cx), py = feetY(p.cy);
      if (Math.abs(sx - px) > 1) p.face = sx > px ? 1 : -1;
      api.sfx('good'); api.sfx('jump');
      api.burst(sx, sy - 14, { color: PAL.sun, count: 12, speed: 110, size: 4, life: 0.6 });
      say(px, Math.max(L.top + 30, py - 62 * L.ps - 16), '¡La encontré!', 22, '#fff8c9');
      if (!plan.home) {                                          // cuenta ya; si hay que llevarla al corral, cuenta al llegar
        api.addScore(1);
        api.addTime(BONUS);
        api.floatText(W - 52, L.top + 24, `+${BONUS} s`, { size: 18, color: '#ffe680' });
      }
      if (m.sheep.every(o => o.found)) bee.show = 0;
    }
    function arriveHome() {
      mode = 'found'; foundKind = 'home'; foundT = 0; foundFx = 0;
      goHome = false; target.active = false; queued = -1;
      const px = cellX(p.cx), py = feetY(p.cy);
      api.addScore(1);
      api.addTime(BONUS);
      api.sfx('good'); api.sfx('bell');
      say(px, Math.max(L.top + 30, py - 62 * L.ps - 16), '¡En casa!', 22, '#fff8c9');
      api.floatText(W - 52, L.top + 24, `+${BONUS} s`, { size: 18, color: '#ffe680' });
    }
    // Después de la celebración: a casa, a buscar a la otra, al siguiente laberinto o fin del nivel.
    function afterFound() {
      if (foundKind === 'pick') {
        carry++;
        if (plan.home) {
          goHome = true; mode = 'play'; computeGoal(); seekStart();
          say(cellX(p.cx), Math.max(L.top + 30, feetY(p.cy) - 70 * L.ps), '¡Al corral!', 20, '#ffffff');
          return;
        }
        if (api.score >= GOAL) { finishLevel(); return; }
        if (maze.sheep.some(s => !s.found)) {
          mode = 'play'; computeGoal(); seekStart();
          if (touch.down) setTarget(api.pointer.x, api.pointer.y);
          return;
        }
      } else if (api.score >= GOAL) { finishLevel(); return; }
      nextRound();
    }
    function finishLevel() {
      mode = 'done';
      api.end({ won: true });
    }
    function nextRound() {
      round++;
      mode = 'play'; introT = 0;
      newMaze();
      roundHint();
      api.sfx('whoosh');
      if (touch.down) setTarget(api.pointer.x, api.pointer.y);
    }
    // Texto flotante que nunca se sale por los lados.
    function say(x, y, text, size, color) {
      const half = String(text).length * size * 0.28 + 6;
      api.floatText(clamp(x, half, W - half), y, text, { size, color });
    }
    function setTarget(x, y) { target.x = x; target.y = y; target.active = true; target.stuck = 0; }
    // Celdas del camino desde `from` hasta lo que hay que alcanzar (hasta `max` pasos), incluida la celda final.
    function pathAhead(from, max, out) {
      const m = maze, dist = m.toGoal;
      out.length = 0;
      let cur = from;
      for (let i = 0; i < max && dist[cur] > 0; i++) {
        const next = stepDown(m.open, m.cols, cur, dist);
        if (next < 0) break;
        out.push(next); cur = next;
      }
      return out;
    }
    const ahead = [];

    // La ovejita que camina: da un pasito cada tanto por su zona (lejos de la salida); si oye cerca al pastor, se queda quieta.
    function walkSheep(dt) {
      const m = maze;
      if (!plan.walk || goHome) return;
      const tx = p.moving ? p.tx : p.cx, ty = p.moving ? p.ty : p.cy;
      for (const s of m.sheep) {
        if (s.found) continue;
        if (s.prog < 1) { s.prog = Math.min(1, s.prog + dt / SHEEP_STEP); continue; }
        s.wait -= dt;
        if (s.wait > 0) continue;
        s.wait = SHEEP_EVERY * api.randRange(0.8, 1.25);
        if (Math.abs(ix(s.cell) - p.cx) + Math.abs(iy(s.cell) - p.cy) <= 3) continue;   // ¡ya lo oye venir!
        const o = m.open[s.cell] & ~m.bushBits[s.cell];
        let pick = -1, alt = -1;
        for (const d of api.shuffle([0, 1, 2, 3])) {
          if (!(o & (1 << d))) continue;
          const nb = s.cell + DX[d] + DY[d] * m.cols;
          if (m.dS[nb] < s.minD || nb === p.cx + p.cy * m.cols || nb === tx + ty * m.cols) continue;
          if (m.sheep.some(q => q !== s && !q.found && q.cell === nb)) continue;
          if (Math.abs(ix(nb) - p.cx) + Math.abs(iy(nb) - p.cy) <= 1) continue;
          if (nb === s.prev) { alt = nb; continue; }
          pick = nb;
          break;
        }
        if (pick < 0) pick = alt;
        if (pick < 0) continue;
        s.prev = s.cell; s.from = s.cell; s.cell = pick; s.prog = 0;
        if (ix(pick) !== ix(s.from)) s.dir = ix(pick) > ix(s.from) ? 1 : -1;
        computeGoal();
      }
    }

    // ── Dibujo de personajes y objetos ──
    function drawPastor(g, x, y, arms) {
      const s = L.ps;
      g.save();                                                  // cayado
      g.translate(x + p.face * 14 * s, y); g.scale(p.face * s, s);
      g.strokeStyle = PAL.woodDeep; g.lineWidth = Math.max(2.8, 1.9 / s); g.lineCap = 'round';
      g.beginPath(); g.moveTo(0, -1); g.lineTo(0, -51); g.arc(5.5, -51, 5.5, Math.PI, Math.PI * 2.3); g.stroke();
      g.restore();
      kit.person(g, x, y, s, { robe: '#f0a04b', sash: '#a85a2a', veil: '#fff4dc', hair: '#5a3b28', beard: true, arms, dir: p.face, t: p.walkT * 1.4, walk: p.moving });
    }
    function drawBubble(g, x, y, str, k, w = 52) {                // (x, y) = punta del globito
      if (k <= 0) return;
      const s = ease.outBack(clamp(k)), h = 25, bx = clamp(x - w / 2, 4, W - w - 4);
      g.save(); g.translate(x, y); g.scale(s, s); g.translate(-x, -y);
      kit.fillRR(g, bx, y - 7 - h, w, h, 11, 'rgba(60, 40, 30, 0.16)');
      kit.fillRR(g, bx, y - 9 - h, w, h, 11, '#ffffff');
      g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(x - 6, y - 10); g.lineTo(x, y); g.lineTo(x + 6, y - 10); g.closePath(); g.fill();
      kit.text(g, str, bx + w / 2, y - 9 - h / 2 + 1, { size: 14, color: PAL.ink });
      g.restore();
    }
    function drawWater(g, w) {
      const x = cellX(ix(w.cell)), y = cellY(iy(w.cell)), c = L.cell;
      kit.ellipse(g, x, y + c * 0.17, c * 0.28, c * 0.13, '#4fa9dc');
      kit.ellipse(g, x - c * 0.03, y + c * 0.15, c * 0.18, c * 0.07, '#a9e1fb');
      kit.drop(g, x, y - c * 0.08 + Math.sin(t * 3 + w.cell) * 2, clamp(c / 62, 0.55, 1), PAL.water);
    }
    function drawKey(g, x, y, s) {
      g.save(); g.translate(x, y); g.rotate(-0.45); g.scale(s, s);
      g.fillStyle = PAL.sunDeep;
      g.beginPath(); g.arc(-7, 0, 6.2, 0, 6.2832); g.fill();
      kit.fillRR(g, -2, -2, 17, 4, 1.5, PAL.sunDeep);
      g.fillRect(8.5, 1, 2.8, 4.6); g.fillRect(12.4, 1, 2.8, 5.6);
      g.fillStyle = PAL.sun; g.beginPath(); g.arc(-7, 0, 4.4, 0, 6.2832); g.fill();
      g.fillStyle = '#9a6a1c'; g.beginPath(); g.arc(-7, 0, 1.9, 0, 6.2832); g.fill();
      g.restore();
    }
    function drawKeyGlow(g) {
      const k = maze.key, x = cellX(ix(k.cell)), y = cellY(iy(k.cell)) + Math.sin(t * 3) * 2, c = L.cell;
      kit.circle(g, x, y, c * (0.3 + 0.03 * Math.sin(t * 4)), 'rgba(255, 240, 160, 0.45)');
      kit.star(g, x + c * 0.2, y - c * 0.2, c * 0.08, '#fff6c2', t * 2);
      drawKey(g, x, y, clamp(c / 44, 0.75, 1.4));
    }
    function drawGate(g, gt) {
      const { x0, y0, x1, y1 } = edgeLine(gt.a, gt.d), wt = L.wt;
      const len = Math.hypot(x1 - x0, y1 - y0);
      const swing = gt.open ? ease.outCubic(clamp(gt.t)) : 0;
      g.save(); g.translate(x0, y0); g.rotate(Math.atan2(y1 - y0, x1 - x0));
      g.save(); g.rotate(swing * 1.35);                          // al abrirse gira sobre el primer poste
      kit.fillRR(g, wt * 0.3, -wt * 0.62, len - wt * 0.6, wt * 0.46, 2, PAL.wood);
      kit.fillRR(g, wt * 0.3, wt * 0.16, len - wt * 0.6, wt * 0.46, 2, PAL.wood);
      g.strokeStyle = PAL.woodDeep; g.lineWidth = wt * 0.28; g.lineCap = 'round';
      g.beginPath(); g.moveTo(wt * 0.6, wt * 0.38); g.lineTo(len - wt * 0.6, -wt * 0.4); g.stroke();
      g.restore();
      kit.fillRR(g, -wt * 0.45, -wt * 0.8, wt * 0.9, wt * 1.6, 2.5, PAL.woodDeep);
      kit.fillRR(g, len - wt * 0.45, -wt * 0.8, wt * 0.9, wt * 1.6, 2.5, PAL.woodDeep);
      if (!gt.open) {                                            // candadito
        g.strokeStyle = '#9a6a1c'; g.lineWidth = 2; g.beginPath(); g.arc(len / 2, -wt * 0.25, wt * 0.32, Math.PI, 0); g.stroke();
        kit.fillRR(g, len / 2 - wt * 0.45, -wt * 0.25, wt * 0.9, wt * 0.75, 2, PAL.sunDeep);
      }
      g.restore();
    }
    function drawBush(g, b) {
      const k = b.opened ? ease.inOut(clamp(b.t)) : 0;
      if (k >= 1) return;
      const { x0, y0, x1, y1 } = edgeLine(b.a, b.d), r = L.cell * 0.19 * (1 - k * 0.5);
      g.save(); g.globalAlpha = 1 - k;
      for (const u of [0.2, 0.5, 0.8]) {
        const v = u + (u - 0.5) * k * 1.4;                         // al abrirse las matas se apartan hacia los lados
        const x = lerp(x0, x1, v), y = lerp(y0, y1, v);
        kit.circle(g, x, y + r * 0.3, r, '#3f9a52');
        kit.circle(g, x, y, r * 0.92, '#7ccf72');
        kit.circle(g, x - r * 0.3, y - r * 0.32, r * 0.36, '#a8e59a');
        kit.circle(g, x + r * 0.35, y + r * 0.05, r * 0.24, u === 0.5 ? '#ffffff' : '#ff9db5');
        kit.circle(g, x + r * 0.35, y + r * 0.05, r * 0.1, '#ffd75e');
      }
      g.restore();
    }
    // Niebla (se ve cerca del pastor) o noche (luz del farol).
    function drawDark(g, px, py) {
      const m = maze, c = L.cell;
      if (m.sky === 'fog') {
        const R = c * FOG_R, cy = py - c * 0.3;
        const gr = g.createRadialGradient(px, cy, R * 0.2, px, cy, R);
        gr.addColorStop(0, 'rgba(236, 242, 246, 0)'); gr.addColorStop(0.55, 'rgba(236, 242, 246, 0.5)'); gr.addColorStop(1, 'rgba(236, 242, 246, 0.95)');
        g.fillStyle = gr;
        g.fillRect(L.ox - L.pad - 8, L.oy - L.pad - 8, L.mw + L.pad * 2 + 16, L.mh + L.pad * 2 + 16);
        for (let i = 0; i < 3; i++) {                            // jirones de niebla que pasan
          const x = ((t * (7 + i * 3) + i * 140) % (W + 160)) - 80, y = L.oy + L.mh * (0.18 + 0.32 * i);
          kit.cloud(g, x, y, 1.1, 0.28, '#f4f8fa');
        }
      } else {
        const R = c * LAMP_R, cy = py - 24 * L.ps;
        const gr = g.createRadialGradient(px, cy, 0, px, cy, R);
        gr.addColorStop(0, 'rgba(255, 214, 130, 0.14)'); gr.addColorStop(0.5, 'rgba(14, 18, 48, 0.2)'); gr.addColorStop(1, 'rgba(14, 18, 48, 0.8)');
        g.fillStyle = gr;
        g.fillRect(0, L.darkY, W, L.H - L.darkY);
      }
    }
    function drawLantern(g, px, py) {
      const s = L.ps, x = px - p.face * 13 * s, y = py - 12 * s;
      kit.circle(g, x, y, 12 * s + 4, 'rgba(255, 210, 110, 0.35)');
      g.save(); g.strokeStyle = '#5a4636'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y - 9 * s); g.lineTo(x, y - 5 * s); g.stroke(); g.restore();
      kit.fillRR(g, x - 4.5 * s, y - 6 * s, 9 * s, 11 * s, 2.5 * s, '#ffd36b');
      kit.fillRR(g, x - 5.5 * s, y - 7.5 * s, 11 * s, 2.6 * s, 1.2 * s, '#5a4636');
      kit.fillRR(g, x - 5.5 * s, y + 4.5 * s, 11 * s, 2.4 * s, 1.2 * s, '#5a4636');
    }

    // ── Cartelitos ──
    function roundHint() {
      const txt = plan.gate ? '🔑 Busca la llave del portón'
        : plan.home ? '🏠 Encuéntrala y llévala al corral'
          : plan.sky === 'night' ? '🌙 De noche: escucha su «¡Bee!»'
            : plan.sky === 'fog' ? '🌫️ Niebla: sigue su lucecita'
              : plan.two ? '🐑🐑 ¡Dos ovejitas!' : '';
      if (txt) api.hint(txt, 2200);
      return !!txt;
    }

    relayout();
    newMaze();
    if (NEWS) api.hint(NEWS.hint, 3600);
    else if (LV <= 3) api.hint('Pon el dedo y guía al pastor', 3200);
    else if (!roundHint()) api.hint(GOAL === 1 ? '🐑 Busca a la ovejita perdida' : `🐑 Busca ${GOAL} ovejitas perdidas`, 2200);

    return {
      update(dt) {
        t += dt;
        syncLayout();
        const m = maze;
        if (ripple.t < 1) ripple.t = Math.min(1, ripple.t + dt * 2.6);
        if (p.bumpT > 0) p.bumpT = Math.max(0, p.bumpT - dt * 5);
        if (introT < 1) introT = Math.min(1, introT + dt / 0.35);
        for (const b of m.bushes) if (b.opened && b.t < 1) b.t = Math.min(1, b.t + dt / 0.35);
        if (m.gate && m.gate.open && m.gate.t < 1) m.gate.t = Math.min(1, m.gate.t + dt / 0.5);
        if (mode === 'done') return;
        if (mode === 'found') {
          foundT += dt;
          if (foundFx === 0 && foundT >= 0.3) {                   // la ovejita ya está en sus hombros (o en el corral)
            foundFx = 1;
            api.sfx('sparkle');
            api.burst(cellX(p.cx), feetY(p.cy) - 50 * L.ps, { emoji: '❤️', count: 7, speed: 95, size: 15, gravity: -70, life: 0.95 });
            const co = L.corral;
            if (!plan.home || foundKind === 'home') api.burst((co.x0 + co.x1) / 2, co.back, { emoji: '💛', count: 4, speed: 70, size: 13, gravity: -60, life: 0.9 });
          }
          if (foundT >= FOUND_TIME) afterFound();
          return;
        }
        roundT += dt; seekT += dt;
        bee.next -= dt;
        if (bee.show > 0) bee.show -= dt;
        if (bee.next <= 0 && !goHome) {
          const left = m.sheep.filter(s => !s.found);
          if (left.length) { bee.who = m.sheep.indexOf(api.pick(left)); bee.show = 1.5; api.sfx('bubble'); }
          bee.next = m.sky === 'night' ? api.randRange(2.6, 3.4) : api.randRange(3.4, 4.8);
        }
        walkSheep(dt);
        movePastor(dt);
        // la ovejita que camina pudo quedar al lado del pastor quieto
        if (mode === 'play' && !p.moving && !goHome) { const s = sheepNear(p.cx + p.cy * m.cols); if (s) found(s); }
      },

      draw(g) {
        syncLayout();
        const m = maze, { ox, oy, cell, mw, mh, wt, pad } = L, co = L.corral;
        const dark = m.sky === 'fog' || m.sky === 'night';
        // capa fija
        if (ensureCache(g)) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(cache, 0, 0); g.restore(); }
        else paintStatic(g);
        if ((m.sky === 'day' || m.sky === 'sunset') && L.k > 0.35) kit.cloud(g, ((t * 7 + 90) % (W + 140)) - 70, L.top + lerp(2, 18, L.k), 0.55, 0.9);

        // corral con las 99 (y fiesta cuando vuelve la que faltaba)
        const party = (mode === 'found' && foundT > 0.3 && (foundKind === 'home' || !plan.home)) || mode === 'done';
        const pt = mode === 'done' ? t : foundT;
        for (const f of flock) {
          const fy = lerp(co.back + 3, co.base - 1, f.v), ins = co.inset * (1 - f.v) + 12 * co.fs;
          const fx = lerp(co.x0 + ins, co.x1 - ins, clamp(f.u));
          const hop = party ? Math.abs(Math.sin((pt - 0.3) * 9 + f.ph)) * 7 : Math.max(0, Math.sin(t * 1.3 + f.ph) - 0.93) * 40;
          kit.sheep(g, fx, fy, co.fs, { dir: f.dir, t: t + f.ph, hop });
        }
        fence(g, co.x0, co.x1, co.base, co.post);
        const signY = co.base - co.post * 1.9 + 0.5;
        const pop = party && mode !== 'done' ? 1 + 0.25 * (1 - ease.outElastic(clamp((foundT - 0.3) / 0.6))) : 1;
        kit.text(g, party ? '100' : '99', co.signX, signY, { size: (party ? 15 : 16) * pop, color: party ? PAL.coralDeep : PAL.ink });
        if (m.sky === 'night') {                                 // cielo de noche: estrellas y luna
          g.fillStyle = 'rgba(14, 18, 48, 0.32)'; g.fillRect(0, 0, W, L.darkY);
          kit.stars(g, W, L.horizon, t, 14, 11);
          kit.moon(g, W - 34, L.top + lerp(10, 18, L.k), lerp(7, 11, L.k));
        }

        // objetos del laberinto
        for (const w of m.water) if (!w.taken) drawWater(g, w);
        for (const b of m.bushes) drawBush(g, b);
        if (m.gate) drawGate(g, m.gate);
        if (m.key && !m.key.taken && !dark) drawKeyGlow(g);

        // huellas: celdas ya recorridas
        const here = p.cx + p.cy * m.cols, vr = Math.max(2, cell * 0.06);
        const steps = alpha => {
          g.globalAlpha = alpha; g.fillStyle = '#ffffff'; g.beginPath();
          for (let i = 0; i < m.n; i++) {
            if (!m.visited[i] || i === here) continue;
            const vx = cellX(ix(i)), vy = cellY(iy(i));
            g.moveTo(vx + vr, vy); g.arc(vx, vy, vr, 0, 6.2832);
          }
          g.fill(); g.globalAlpha = 1;
        };
        if (!dark) steps(0.6);

        const k = p.moving ? p.prog : 0;
        let px = cellX(lerp(p.cx, p.tx, k)), py = feetY(lerp(p.cy, p.ty, k));
        if (p.bumpT > 0) { const b = Math.sin(p.bumpT * Math.PI) * cell * 0.1; px += DX[p.bumpDir] * b; py += DY[p.bumpDir] * b; }

        // ayuda amable si tarda mucho: estrellitas que marcan los próximos pasos
        const helpStars = () => {
          if (mode !== 'play' || seekT <= (10 + seekLen * 0.45) * HELP_K) return;
          pathAhead(p.moving ? p.tx + p.ty * m.cols : here, 5, ahead);
          for (let i = 0; i < ahead.length; i++) {
            if (m.toGoal[ahead[i]] === 0 && !goHome && !(m.key && !m.key.taken)) break;   // no encima de la ovejita
            const a = 0.55 + 0.45 * Math.sin(t * 5 - i * 0.9);
            g.globalAlpha = 0.35 + 0.5 * a;
            kit.star(g, cellX(ix(ahead[i])), cellY(iy(ahead[i])), cell * (0.11 + 0.03 * a), PAL.sun, 0.2);
          }
          g.globalAlpha = 1;
        };
        const halo = (s, alpha) => {
          const { x, y } = sheepPos(s), pulse = 0.5 + 0.5 * Math.sin(t * 4);
          kit.circle(g, x, y - cell * 0.22, cell * (0.36 + 0.05 * pulse), `rgba(255, 255, 255, ${(0.3 + 0.2 * pulse) * alpha})`);
        };
        // con niebla: lucecita dorada que se ve a través de la niebla
        const glow = s => {
          const { x, y } = sheepPos(s), pulse = 0.5 + 0.5 * Math.sin(t * 4), yy = y - cell * 0.25;
          kit.circle(g, x, yy, cell * (0.5 + 0.08 * pulse), `rgba(255, 214, 90, ${0.22 + 0.12 * pulse})`);
          kit.circle(g, x, yy, cell * (0.28 + 0.04 * pulse), `rgba(255, 236, 150, ${0.45 + 0.2 * pulse})`);
          kit.star(g, x, yy, cell * 0.13, '#fff6c2', t * 1.5);
        };
        // de vuelta: la casilla de salida brilla (ahí está la puerta del corral)
        const homeGlow = () => {
          const x = cellX(ix(m.start)), y = cellY(iy(m.start)), pulse = 0.5 + 0.5 * Math.sin(t * 4);
          kit.circle(g, x, y, cell * (0.42 + 0.06 * pulse), `rgba(255, 214, 90, ${0.25 + 0.15 * pulse})`);
          kit.star(g, x, y - cell * 0.05, cell * 0.16, '#fff6c2', t);
        };
        if (!dark) {
          helpStars();
          if (mode === 'play' && goHome) homeGlow();
          if (mode === 'play' && !goHome) for (const s of m.sheep) if (!s.found) halo(s, 1);    // halo que marca dónde está
          if (mode === 'play' && target.active && !touch.down) kit.circle(g, target.x, target.y, 9 + 2 * Math.sin(t * 9), null, 'rgba(255, 255, 255, 0.85)', 3);
        }
        if (ripple.t < 1) { g.globalAlpha = 1 - ripple.t; kit.circle(g, ripple.x, ripple.y, 8 + 22 * ease.outCubic(ripple.t), null, '#ffffff', 3); g.globalAlpha = 1; }

        // ovejitas y pastor (el de más arriba se pinta primero)
        const bob = p.moving ? Math.abs(Math.sin(p.walkT * Math.PI * 2)) * 2.4 * L.ps : 0;
        if (mode === 'found' && foundKind === 'pick') {
          const s = foundSheep, sx = cellX(ix(s.cell)), sy = feetY(iy(s.cell));
          const j = clamp(foundT / 0.3), e = ease.inOut(j);
          const hopT = Math.max(0, foundT - 0.3);
          const joy = j < 1 ? 0 : Math.abs(Math.sin(hopT * 9.5)) * 7 * L.ps * Math.max(0.25, 1 - hopT * 0.7);
          const cx2 = lerp(sx, px, e), cy2 = lerp(sy, py - 35 * L.ps, e) - Math.sin(j * Math.PI) * cell * 0.3 - joy;
          const ss = lerp(L.ss, L.ss * 0.8, e);
          drawOtherSheep(g, px, py, s);
          if (j < 1) { drawPastor(g, px, py, 'open'); kit.sheep(g, cx2, cy2, ss, { dir: -p.face, t, hop: 0 }); }
          else { kit.sheep(g, cx2, cy2, ss, { dir: p.face, t: t * 2 }); drawPastor(g, px, py - joy, 'up'); }
        } else if (mode === 'found' || mode === 'done' || carry > 0) {
          const hopT = mode === 'found' ? Math.max(0, foundT - 0.3) : 0;
          const joy = mode === 'found' && foundKind === 'home' ? Math.abs(Math.sin(hopT * 9.5)) * 7 * L.ps * Math.max(0.25, 1 - hopT * 0.7) : 0;
          drawOtherSheep(g, px, py, null);
          kit.sheep(g, px, py - 35 * L.ps - bob - joy, L.ss * 0.8, { dir: p.face, t: t * 2 });
          drawPastor(g, px, py - bob - joy, 'up');
        } else {
          drawOtherSheep(g, px, py, null, () => drawPastor(g, px, py - bob, 'down'));
        }

        if (dark) {
          drawDark(g, px, py - bob);
          steps(m.sky === 'night' ? 0.3 : 0.45);
          helpStars();
          if (m.key && !m.key.taken) drawKeyGlow(g);
          if (m.sky === 'fog' && mode === 'play' && !goHome) for (const s of m.sheep) if (!s.found) glow(s);
          if (mode === 'play' && goHome) homeGlow();
          if (m.sky === 'night') drawLantern(g, px, py - bob);
          if (mode === 'play' && target.active && !touch.down) kit.circle(g, target.x, target.y, 9 + 2 * Math.sin(t * 9), null, 'rgba(255, 255, 255, 0.85)', 3);
        }

        // globitos
        if (mode === 'play') {
          const s = m.sheep[bee.who];
          if (bee.show > 0 && s && !s.found) {
            const { x, y } = sheepPos(s), kk = Math.min(bee.show, 1.5 - bee.show) * 5;
            if (m.sky === 'night') kit.circle(g, x, y - cell * 0.25, cell * (0.42 + 0.08 * Math.sin(t * 8)), `rgba(255, 236, 150, ${0.35 * clamp(kk)})`);
            drawBubble(g, x + s.dir * 6 * L.ss, y - 31 * L.ss, '¡Bee!', kk);
          }
          if (touch.down && target.stuck > 0.7) drawBubble(g, px, py - 58 * L.ps, '?', (target.stuck - 0.7) * 5, 30);
        }

        // demostración: un dedo que marca los primeros pasos (solo hasta el primer toque, en los primeros niveles)
        if (!touched && round === 0 && LV <= 3 && mode === 'play' && t > 1) {
          pathAhead(m.start, 4, ahead);
          if (ahead.length >= 2) {
            const loop = (t - 1) % 2.4, u = ease.inOut(clamp(loop / 1.5)) * ahead.length;
            const i = Math.min(ahead.length - 1, Math.floor(u)), fr = u - i;
            const c0 = i === 0 ? m.start : ahead[i - 1], c1 = ahead[i];
            const hx = lerp(cellX(ix(c0)), cellX(ix(c1)), fr), hy = lerp(cellY(iy(c0)), cellY(iy(c1)), fr);
            const al = clamp(loop * 5) * clamp((2.3 - loop) * 3);
            g.globalAlpha = al;
            kit.circle(g, hx, hy, 13, 'rgba(255, 255, 255, 0.55)', '#ffffff', 3);
            g.globalAlpha = 1;
            kit.emoji(g, '👆', hx + 7, hy + 22, 32, { alpha: al });
          }
        }

        // cambio de laberinto: el tablero se aclara y aparece el nuevo
        const lastPick = mode === 'found' && foundT > FOUND_TIME - 0.22 && (foundKind === 'home' || (!plan.home && !m.sheep.some(s => !s.found))) && api.score < GOAL;
        const fade = lastPick ? clamp((foundT - (FOUND_TIME - 0.22)) / 0.22) : (round > 0 && mode !== 'found' ? 1 - introT : 0);
        if (fade > 0) { g.globalAlpha = fade; kit.fillRR(g, ox - pad, oy - pad, mw + pad * 2, mh + pad * 2, wt + 3, FLOOR); g.globalAlpha = 1; }

        // Ovejitas que siguen perdidas, ordenadas por altura junto con el pastor (`pastor` se pinta en su turno).
        function drawOtherSheep(g2, px2, py2, skip, pastor) {
          let drawn = !pastor;
          for (const s of m.sheep) {
            if (s.found || s === skip) continue;
            const { x, y } = sheepPos(s);
            if (!drawn && y > py2) { pastor(); drawn = true; }
            const closeBy = Math.abs(ix(s.cell) - p.cx) + Math.abs(iy(s.cell) - p.cy) <= 2;   // ¡ya lo ve venir!
            const sdir = closeBy && Math.abs(px2 - x) > 2 ? (px2 > x ? 1 : -1) : s.dir;
            const tremble = closeBy || s.prog < 1 ? 0 : Math.sin(t * 17) * 0.5;
            const hop = closeBy ? Math.abs(Math.sin(t * 9)) * 4 : s.prog < 1 ? Math.sin(s.prog * Math.PI) * 3 : 0;
            kit.sheep(g2, x + tremble, y, L.ss, { dir: sdir, t, sad: !closeBy, hop });
          }
          if (!drawn) pastor();
        }
      },

      pointerDown(x, y, id) {
        touched = true;
        touch.down = true; touch.id = id;
        held.length = 0; queued = -1;
        ripple.x = x; ripple.y = y; ripple.t = 0;
        if (mode === 'play') setTarget(x, y);
      },
      pointerMove(x, y, id) {
        if (!touch.down || id !== touch.id) return;
        if (mode === 'play') setTarget(x, y);
      },
      pointerUp(x, y, id) {
        if (id !== touch.id) return;
        touch.down = false; touch.id = null;
      },
      keyDown(key) {
        const d = KEY_DIR[key];
        if (d === undefined) return;
        touched = true;
        target.active = false;
        const i = held.indexOf(d);
        if (i >= 0) held.splice(i, 1);
        held.push(d);
        queued = d; queuedT = 0.25;
      },
      keyUp(key) {
        const i = held.indexOf(KEY_DIR[key]);
        if (i >= 0) held.splice(i, 1);
      },
      resize() { L.top = -1; },                                  // se vuelve a medir en el siguiente cuadro
      destroy() { if (cache) { cache.width = cache.height = 0; cache = null; } },

      // Solo lectura, para las pruebas automáticas.
      get debug() {
        const m = maze, here = p.cx + p.cy * m.cols;
        const cellInfo = c => ({ cx: ix(c), cy: iy(c), x: cellX(ix(c)), y: cellY(iy(c)) });
        const left = m.sheep.filter(s => !s.found);
        return {
          level: LV, difficulty: DIF, goal: GOAL, speed: SPEED, bonus: BONUS,
          round, mode, cols: m.cols, rows: m.rows, cell: L.cell, ox: L.ox, oy: L.oy, len: m.len, roundT, seekT, cacheBuilds,
          sky: m.sky, plan: { ...plan }, goHome, carry,
          pastor: { cx: p.cx, cy: p.cy, moving: p.moving, x: cellX(p.cx), y: cellY(p.cy) },
          sheep: left.length ? cellInfo(left[0].cell) : null,
          sheepAll: m.sheep.map(s => ({ ...cellInfo(s.cell), found: s.found })),
          key: m.key ? { ...cellInfo(m.key.cell), taken: m.key.taken } : null,
          gate: m.gate ? { a: m.gate.a, d: m.gate.d, open: m.gate.open } : null,
          bushes: m.bushes.map(b => ({ a: b.a, d: b.d, opened: b.opened })),
          water: m.water.map(w => ({ ...cellInfo(w.cell), taken: w.taken })),
          mud: Array.from(m.mud).reduce((n, v) => n + v, 0), split: m.split,
          left: m.toGoal[here], open: Array.from(m.open),
          path: pathAhead(here, 400, []).map(cellInfo),
          target: { ...target }, touching: touch.down, layout: { top: L.top, H: L.H, bandH: L.bandH, areaY0: L.areaY0, areaY1: L.areaY1 },
        };
      },
    };
  },
};
