// Enciende la luz (La luz del mundo, Mateo 5, 14-16) — trivia bíblica.
//
// Arriba, una ciudad sobre un monte, de noche. Cada respuesta correcta enciende una velita y una ventana, y el cielo
// se va aclarando. La pregunta y sus respuestas van en HTML (api.overlay) para que el texto se lea cómodo.
const FALLBACK = [
  { q: '¿Quién creó el cielo y la tierra?', options: ['Noé', 'Dios', 'Moisés'], answer: 1, explain: 'En el principio, Dios creó el cielo y la tierra (Génesis 1, 1).', level: 1 },
  { q: '¿En qué pueblo nació Jesús?', options: ['Belén', 'Nazaret', 'Jerusalén'], answer: 0, explain: 'Jesús nació en Belén (Lucas 2, 4-7).', level: 1 },
  { q: '¿Cómo se llama la mamá de Jesús?', options: ['Marta', 'Isabel', 'María'], answer: 2, explain: 'La Virgen María es la Madre de Jesús y nuestra Madre del cielo.', level: 1 },
  { q: '¿Qué oración nos enseñó Jesús?', options: ['El Padre Nuestro', 'La Salve', 'El Credo'], answer: 0, explain: 'Jesús enseñó el Padre Nuestro a sus discípulos (Mateo 6, 9-13).', level: 1 },
  { q: '¿Quién construyó un arca muy grande?', options: ['David', 'Noé', 'Abraham'], answer: 1, explain: 'Noé obedeció a Dios y construyó el arca (Génesis 6).', level: 1 },
  { q: '¿A quién recibimos en la Primera Comunión?', options: ['A un ángel', 'A san Pedro', 'A Jesús'], answer: 2, explain: 'En la Comunión recibimos a Jesús, realmente presente en la Eucaristía.', level: 1 },
  { q: '¿Quién bautizó a Jesús en el río Jordán?', options: ['Juan el Bautista', 'Pedro', 'Moisés'], answer: 0, explain: 'Juan bautizó a Jesús en el Jordán (Mateo 3, 13-17).', level: 2 },
  { q: '¿Cuántos apóstoles eligió Jesús?', options: ['Siete', 'Doce', 'Diez'], answer: 1, explain: 'Jesús eligió a doce apóstoles (Marcos 3, 14).', level: 2 },
  { q: '¿Qué mar abrió Dios para que pasara su pueblo?', options: ['El Mar Muerto', 'El mar de Galilea', 'El Mar Rojo'], answer: 2, explain: 'Dios abrió un camino en el Mar Rojo (Éxodo 14).', level: 2 },
  { q: '¿Qué día resucitó Jesús?', options: ['El domingo', 'El viernes', 'El lunes'], answer: 0, explain: 'Jesús resucitó el domingo, el día del Señor.', level: 2 },
];
const CSS = `
.luz-panel { position: absolute; left: var(--gutter-l); right: var(--gutter-r); bottom: calc(var(--safe-b) + 10px); max-height: 60%; overflow-y: auto; pointer-events: auto;
  display: flex; flex-direction: column; gap: 9px; padding: 14px; background: var(--paper); border-radius: 22px; box-shadow: 0 6px 0 var(--paper-edge), 0 14px 30px rgba(20, 15, 50, 0.45); }
.luz-top { display: flex; align-items: center; gap: 8px; }
.luz-tag { flex: 1; font-family: var(--font-display); font-weight: 700; font-size: 0.8rem; letter-spacing: 0.05em; text-transform: uppercase; color: var(--ink-soft); }
.luz-say { appearance: none; border: 0; cursor: pointer; width: 44px; height: 44px; border-radius: 50%; background: var(--sky-deep); color: #fff; font-size: 1.2rem; box-shadow: 0 3px 0 #2f7fb8; }
.luz-q { font-family: var(--font-display); font-weight: 800; font-size: 1.22rem; line-height: 1.2; color: var(--ink); }
.luz-opts { display: flex; flex-direction: column; gap: 8px; }
.luz-opt { appearance: none; border: 0; cursor: pointer; text-align: left; min-height: 50px; padding: 8px 14px; border-radius: 16px; background: var(--white); color: var(--ink);
  font-family: var(--font-body); font-weight: 800; font-size: 1.06rem; line-height: 1.2; box-shadow: 0 4px 0 var(--paper-edge); }
.luz-opt:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--paper-edge); }
.luz-opt:focus-visible, .luz-say:focus-visible { outline: 3px solid var(--ink); outline-offset: 2px; }
.luz-opt:disabled { cursor: default; opacity: 0.6; }
.luz-opt.is-right { background: #dff5dc; box-shadow: 0 4px 0 var(--leaf); opacity: 1; }
.luz-opt.is-wrong { background: #ffe4dc; box-shadow: 0 4px 0 var(--coral); opacity: 1; }
.luz-fb { display: flex; flex-direction: column; gap: 8px; }
.luz-fb p { font-size: 1.02rem; font-weight: 700; line-height: 1.3; color: var(--ink); }
.luz-fb b { font-family: var(--font-display); font-size: 1.12rem; }
`;

export default {
  id: 'luz',
  create(api) {
    const { kit } = api;
    const { PAL, clamp, lerp } = kit;
    const W = api.W;
    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

    let t = 0, lit = 0, glow = 0, dead = false, tts = null;
    let queue = [], current = null, answered = false, asked = 0;
    const houses = Array.from({ length: 9 }, (_, i) => ({ x: 28 + i * 38, w: api.randRange(26, 34), h: api.randRange(26, 46), roof: i % 3, lift: Math.sin((i / 8) * Math.PI) * 26 }));

    // ── Panel HTML ──
    const style = el('style'); style.textContent = CSS;
    const tag = el('span', 'luz-tag', '');
    const say = el('button', 'luz-say', '🔊'); say.type = 'button'; say.hidden = true; say.setAttribute('aria-label', 'Leer la pregunta en voz alta');
    const qEl = el('p', 'luz-q', 'Preparando las preguntas…');
    const opts = el('div', 'luz-opts');
    const fb = el('div', 'luz-fb'); fb.hidden = true;
    const top = el('div', 'luz-top'); top.append(tag, say);
    const panel = el('div', 'luz-panel'); panel.append(top, qEl, opts, fb);
    api.overlay.append(style, panel);
    say.addEventListener('click', () => { if (tts && current) { api.sfx('tap'); tts.speak([current.q, ...current.options]); } });

    function build(list) {
      const by = l => api.shuffle(list.filter(q => q.level === l));
      const l1 = by(1), l2 = by(2), l3 = by(3);
      queue = [...l1.splice(0, 4), ...l2.splice(0, 4), ...l3, ...api.shuffle([...l1, ...l2])];
    }
    function show() {
      tts?.stop();
      current = queue.shift();
      if (!current) { api.end({ won: true }); return; }
      asked++; answered = false;
      // Se barajan las opciones cuidando cuál es la correcta.
      const order = api.shuffle(current.options.map((_, i) => i));
      const right = order.indexOf(current.answer);
      tag.textContent = current.topic ? `${current.topic} · pregunta ${asked}` : `Pregunta ${asked}`;
      qEl.textContent = current.q;
      opts.replaceChildren(); fb.replaceChildren(); fb.hidden = true;
      const buttons = order.map((idx, pos) => {
        const b = el('button', 'luz-opt', current.options[idx]); b.type = 'button';
        b.addEventListener('click', () => answer(pos === right, pos, right, buttons));
        opts.append(b);
        return b;
      });
      panel.scrollTop = 0;
    }
    function answer(ok, pos, right, buttons) {
      if (answered || dead) return;
      answered = true;
      tts?.stop();
      buttons.forEach((b, i) => { b.disabled = true; if (i === right) b.classList.add('is-right'); else if (i === pos) b.classList.add('is-wrong'); });
      const title = el('b', '', ok ? '¡Muy bien! Encendiste una velita 🕯️' : 'Casi… mira la respuesta en verde.');
      const p = el('p'); p.append(title);
      fb.append(p);
      if (current.explain) fb.append(el('p', '', current.explain));
      if (ok) { lit++; glow = 1; api.addScore(1); api.sfx('good'); api.burst(candleX(lit - 1), L.candleY - 30, { color: PAL.sun, count: 10, speed: 80 }); }
      else { api.sfx('wrong'); if (api.loseLife() <= 0) { fb.hidden = false; return; } }
      const nextBtn = el('button', 'btn btn--sm btn--sun', 'Siguiente'); nextBtn.type = 'button';
      nextBtn.addEventListener('click', () => { api.sfx('tap'); show(); });
      fb.append(nextBtn);
      fb.hidden = false;
      panel.scrollTop = panel.scrollHeight;
    }

    import('../data/trivia.js').then(m => (Array.isArray(m.TRIVIA) && m.TRIVIA.length >= 10 ? m.TRIVIA : FALLBACK)).catch(() => FALLBACK)
      .then(list => { if (dead) return; build(list); show(); });
    import('../core/tts.js').then(m => { if (!dead && m.available()) { tts = m; say.hidden = false; } }).catch(() => {});

    const L = {};
    function layout() { L.sceneBot = api.top + (api.H - api.top) * 0.4; L.candleY = Math.max(api.top + 96, L.sceneBot - 6); }
    layout();
    const candleX = i => 26 + (i % 10) * ((W - 52) / 9);

    return {
      update(dt) { t += dt; if (glow > 0) glow -= dt; },
      draw(g) {
        const H = api.H, day = clamp(lit / 12);
        kit.sky(g, W, H, 'night');
        if (day > 0) { g.save(); g.globalAlpha = day * 0.85; kit.sky(g, W, H, 'dawn'); g.restore(); }
        g.save(); g.globalAlpha = 1 - day * 0.8; kit.stars(g, W, L.sceneBot - 40, t, 34, 5); kit.moon(g, 304, api.top + 34, 17); g.restore();
        // el monte y la ciudad
        const baseY = L.candleY - 34;
        g.fillStyle = lerpColor('#2f3a6e', '#5fa56a', day); g.beginPath(); g.moveTo(0, H);
        for (let x = 0; x <= W + 8; x += 8) g.lineTo(x, baseY + 26 - Math.sin((x / W) * Math.PI) * 30);
        g.lineTo(W, H); g.closePath(); g.fill();
        houses.forEach((hs, i) => {
          const y = baseY + 22 - hs.lift, on = i < lit;
          kit.fillRR(g, hs.x - hs.w / 2, y - hs.h, hs.w, hs.h, 3, lerpColor('#454f86', '#f3d9b0', day));
          g.fillStyle = lerpColor('#39406f', '#d96a4a', day); g.beginPath();
          if (hs.roof === 1) { g.arc(hs.x, y - hs.h, hs.w / 2, Math.PI, 0); } else { g.moveTo(hs.x - hs.w / 2 - 3, y - hs.h); g.lineTo(hs.x, y - hs.h - 13); g.lineTo(hs.x + hs.w / 2 + 3, y - hs.h); }
          g.closePath(); g.fill();
          if (on) kit.circle(g, hs.x, y - hs.h * 0.55, 13, 'rgba(255, 214, 110, 0.28)');
          kit.fillRR(g, hs.x - 5, y - hs.h * 0.55 - 6, 10, 12, 2, on ? '#ffe28a' : '#232a55');
        });
        g.fillStyle = lerpColor('#27325e', '#4c9a5c', day); g.fillRect(0, L.candleY - 2, W, H);
        // las velitas
        for (let i = 0; i < 10; i++) kit.candle(g, candleX(i), L.candleY + 8, 0.95, i < lit, t + i);
        if (lit > 10) kit.text(g, `+${lit - 10} 🕯️`, W - 30, L.candleY - 44, { size: 14, color: '#fff' });
        if (glow > 0) { g.save(); g.globalAlpha = glow * 0.25; g.fillStyle = '#ffe9a8'; g.fillRect(0, 0, W, H); g.restore(); }
      },
      resize() { layout(); },
      destroy() { dead = true; tts?.stop(); },
      get debug() { return { lit, asked, answered, left: queue.length, right: current ? current.options[current.answer] : null }; },
    };

    function lerpColor(a, b, k) {
      const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
      return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], k))).join(',')})`;
    }
  },
};
