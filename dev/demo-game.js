// Juego de demostración mínimo: sirve de EJEMPLO del contrato del motor (js/games/engine.js) y para probarlo.
// Mueve la canasta con el dedo y atrapa las estrellas; si se te cae una, pierdes una vida.
export default {
  id: 'demo',
  create(api) {
    const { kit } = api;
    const basket = { x: api.W / 2, w: 70 };
    const items = [];
    let spawn = 0.4, t = 0;
    api.hint('Mueve el dedo para atrapar las estrellas');
    return {
      update(dt) {
        t += dt;
        // objetivo: seguir al dedo con suavidad (o teclado)
        let target = api.pointer.x;
        if (api.keys.has('left')) target = basket.x - 300 * dt * 8;
        if (api.keys.has('right')) target = basket.x + 300 * dt * 8;
        basket.x = kit.clamp(kit.lerp(basket.x, target, Math.min(1, dt * 14)), basket.w / 2, api.W - basket.w / 2);
        spawn -= dt;
        if (spawn <= 0) {
          spawn = Math.max(0.35, 1.0 - api.time * 0.02);
          items.push({ x: api.randRange(24, api.W - 24), y: api.top - 10, vy: 110 + api.time * 4, rot: 0 });
        }
        const by = api.bottom - 40;
        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i];
          it.y += it.vy * dt; it.rot += dt * 3;
          if (it.y > by - 8 && it.y < by + 20 && Math.abs(it.x - basket.x) < basket.w / 2 + 6) {
            items.splice(i, 1);
            api.addScore(1, it.x, by - 14); api.sfx('coin'); api.burst(it.x, by, { color: kit.PAL.sun, count: 8 });
          } else if (it.y > api.H + 20) { items.splice(i, 1); api.loseLife(it.x, api.H - 30); }
        }
      },
      draw(g) {
        kit.sky(g, api.W, api.H, 'day');
        kit.sun(g, 300, api.top + 40, 26, t);
        kit.cloud(g, 80 + Math.sin(t * 0.3) * 20, api.top + 60, 1);
        kit.hills(g, api.W, api.H, api.H - 70, 16, kit.PAL.leafLight, t * 6);
        kit.ground(g, api.W, api.H, api.H - 34);
        for (const it of items) kit.star(g, it.x, it.y, 13, kit.PAL.sun, it.rot);
        const by = api.bottom - 40;
        kit.shadow(g, basket.x, api.H - 26, 34, 6);
        kit.fillRR(g, basket.x - basket.w / 2, by, basket.w, 26, 10, kit.PAL.wood);
        kit.fillRR(g, basket.x - basket.w / 2 - 4, by - 4, basket.w + 8, 9, 4, kit.PAL.woodDeep);
      },
    };
  },
};
