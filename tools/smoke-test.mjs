#!/usr/bin/env node
// Prueba de humo de toda la app con un navegador real (Playwright + Chromium).
// Recorre las pantallas y abre cada minijuego; falla si hay errores de consola, pantallas rotas o desbordes horizontales.
//
//   node tools/serve.mjs &            (en otra terminal)
//   node tools/smoke-test.mjs [carpeta-de-capturas] [url-base=http://localhost:8765/index.html]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); }
catch { ({ chromium } = createRequire('/opt/node-tools/node_modules/')('playwright')); }

const outDir = process.argv[2] || './smoke-shots';
const base = process.argv[3] || 'http://localhost:8765/index.html';
fs.mkdirSync(outDir, { recursive: true });

const problems = [];
const note = (where, msg) => { problems.push(`[${where}] ${msg}`); console.log(`  ✗ [${where}] ${msg}`); };

const SAVE = {
  v: 1, name: 'Palomita', kid: 'Ana', created: Date.now(), lastSeen: Date.now(),
  stats: { hambre: 55, energia: 70, limpieza: 45, alegria: 60, fe: 40 }, sleeping: false,
  coins: 400, xp: 0, level: 3, inventory: { pan: 3, agua: 2, manzana: 2, uvas: 1 }, owned: [], wearing: { head: null, neck: null, beak: null },
  decor: {}, games: {}, read: {}, quiz: {}, prayers: {}, daily: { date: '', done: {} }, days: 1,
  settings: { sound: false, music: false, voice: false, listen: false }, flags: { onboarded: true, tutorialHome: true, arrived: true, micAsked: true },
};

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });

const BOOT_BUDGET_MS = 20000;      // arranque hasta la primera pantalla (en una máquina de pruebas sin tarjeta de video)
const boots = [];
async function newPage(viewport, save = SAVE, { mic = false } = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, hasTouch: true, isMobile: true, permissions: mic ? ['microphone'] : [] });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  if (save) await page.addInitScript(s => { try { if (!localStorage.getItem('palomita.save.v1')) localStorage.setItem('palomita.save.v1', JSON.stringify(s)); } catch {} }, save);
  // Para la prueba del micrófono: se anotan los micrófonos que abre la app.
  await page.addInitScript(() => {
    window.__streams = [];
    const md = navigator.mediaDevices;
    if (md?.getUserMedia) { const orig = md.getUserMedia.bind(md); md.getUserMedia = async c => { const st = await orig(c); window.__streams.push(st); return st; }; }
  });
  const t0 = Date.now();
  await page.goto(base);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
  boots.push(Date.now() - t0);
  return { ctx, page, errors };
}
async function checkLayout(page, where) {
  const r = await page.evaluate(() => {
    const app = document.getElementById('app').getBoundingClientRect();
    const wide = [];
    for (const el of document.querySelectorAll('#app *')) {
      const b = el.getBoundingClientRect();
      if (b.width > 0 && b.height > 0 && (b.right > app.right + 2 || b.left < app.left - 2)) {
        let clipped = false;
        for (let p = el.parentElement; p && p.id !== 'app'; p = p.parentElement) {
          const o = getComputedStyle(p); if (/(hidden|auto|scroll|clip)/.test(o.overflowX)) { clipped = true; break; }
        }
        if (!clipped && !el.closest('canvas')) wide.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)}`);
      }
    }
    return { wide: wide.slice(0, 4), bootError: window.__bootError || null, screenError: window.__screenError || null,
      scrollX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 };
  });
  if (r.bootError) note(where, `error de arranque: ${r.bootError.split('\n')[0]}`);
  if (r.screenError) note(where, `error de pantalla: ${r.screenError.split('\n')[0]}`);
  if (r.scrollX) note(where, 'la página se desplaza en horizontal');
  if (r.wide.length) note(where, `elementos fuera de la columna: ${r.wide.join(', ')}`);
}
const flush = (errors, where) => { for (const e of errors.splice(0)) note(where, e); };

// ── 1. Bienvenida (partida nueva) ──
console.log('Bienvenida');
{
  const { ctx, page, errors } = await newPage({ width: 390, height: 844 }, null);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '01-bienvenida.png') });
  const name = await page.evaluate(() => window.__palomita?.current()?.name);
  if (name !== 'welcome') note('bienvenida', `se esperaba la pantalla welcome y se abrió ${name}`);
  await checkLayout(page, 'bienvenida'); flush(errors, 'bienvenida');
  await ctx.close();
}

// ── 2. Pantallas ──
const SCREENS = [
  ['home', {}], ['games', {}], ['bible', {}], ['bible', { tab: 'parabolas' }], ['bible', { tab: 'oraciones' }],
  ['bible', { tab: 'catecismo' }], ['bible', { tab: 'versiculos' }], ['shop', {}], ['shop', { tab: 'accesorios' }], ['settings', {}],
  ['levels', { game: 'noe' }], ['catequesis', {}], ['confesion', {}], ['misa', {}], ['reto', {}], ['parroquia', {}], ['figuritas', {}],
  // Versión 1.3
  ['dudas', {}], ['grandia', {}], ['rosario', {}], ['ratito', {}], ['ratito', { tab: 'diario' }], ['memoria', {}], ['memoria', { id: 'credo' }],
  ['repasos', {}], ['diploma', {}], ['calendario', {}], ['calendario', { tab: 'fiestas' }], ['calendario', { tab: 'tiempos' }], ['credo', {}],
  ['misa', { tab: 'pasaporte' }], ['bible', { story: 'primera-comunion-de-juanito', shelf: 'ars' }],
];
for (const vp of [{ width: 360, height: 640 }, { width: 390, height: 844 }, { width: 540, height: 750 }]) {
  console.log(`Pantallas ${vp.width}×${vp.height}`);
  const { ctx, page, errors } = await newPage(vp);
  let i = 0;
  for (const [name, params] of SCREENS) {
    const where = `${name}${params.tab ? ':' + params.tab : ''} ${vp.width}×${vp.height}`;
    await page.evaluate(([n, p]) => { window.__screenError = null; return window.__palomita.go(n, p); }, [name, params]);
    await page.waitForTimeout(name === 'home' ? 1800 : 700);
    await page.screenshot({ path: path.join(outDir, `02-${vp.width}-${String(++i).padStart(2, '0')}-${name}${params.tab ? '-' + params.tab : ''}.png`) });
    await page.evaluate(() => document.querySelectorAll('.modal-scrim').forEach(m => m.remove()));
    await checkLayout(page, where); flush(errors, where);
  }
  await ctx.close();
}

// ── 3. Minijuegos ──
console.log('Minijuegos');
{
  const { ctx, page, errors } = await newPage({ width: 390, height: 780 });
  const ids = await page.evaluate(async () => (await import('./js/games/registry.js')).GAMES.map(g => g.id));
  for (const id of ids) {
    const where = `juego ${id}`;
    await page.evaluate(() => window.__palomita.go('games'));
    await page.waitForTimeout(300);
    await page.evaluate(i => { window.__palomita.startGame(i, { skipIntro: true, seed: 11 }); }, id);
    await page.waitForFunction(() => window.__game && ['playing', 'error'].includes(window.__game.phase), null, { timeout: 15000 }).catch(() => note(where, 'no empezó'));
    // toques al azar durante unos segundos
    for (let k = 0; k < 24; k++) {
      const x = 40 + ((k * 97) % 310), y = 150 + ((k * 151) % 560);
      await page.mouse.move(x, y); await page.mouse.down(); await page.waitForTimeout(90); await page.mouse.up(); await page.waitForTimeout(110);
    }
    await page.screenshot({ path: path.join(outDir, `03-juego-${id}.png`) });
    const st = await page.evaluate(() => ({ phase: window.__game?.phase, err: window.__gameError }));
    if (st.err) note(where, `error: ${String(st.err).split('\n')[0]}`);
    if (st.phase === 'playing' || st.phase === 'paused') await page.evaluate(() => { window.__game.resume?.(); window.__game.finish({ won: true }); });
    await page.waitForFunction(() => !window.__game || ['result', 'message', 'error'].includes(window.__game.phase), null, { timeout: 8000 }).catch(() => note(where, 'no llegó a los resultados'));
    const msgBtn = page.locator('.game-panel .btn', { hasText: 'Mensaje' });
    if (await msgBtn.count()) { await msgBtn.click(); await page.waitForTimeout(300); await page.screenshot({ path: path.join(outDir, `03-mensaje-${id}.png`) }); }
    await page.evaluate(() => window.__game?.exit());
    await page.waitForTimeout(150);
    flush(errors, where);
  }
  await ctx.close();
}

// ── 4. Una partida avanzada: todo lleno (temas terminados, sellos, misas, intenciones, Primera Comunión cerca) ──
console.log('Partida avanzada');
{
  const { ctx, page, errors } = await newPage({ width: 390, height: 844 });
  await page.evaluate(async () => {
    const s = window.__palomita.state;
    const C = (await import('./js/data/catechism.js')).CATECHISM;
    for (const c of C) s.markQuiz('cat:' + c.id);
    for (const id of ['senal-de-la-cruz', 'padre-nuestro', 'ave-maria']) s.setMemorized(id, 'nino');
    s.setMemorized('gloria', 'grande');
    s.reviewMiss('q:yanoexiste');                      // una pregunta que ya no existe: se limpia sola
    s.addIntention({ id: 'mama', label: 'Por mi mamá', emoji: '👩' });
    s.addJournal({ thanks: ['familia', 'comida'] });
    s.acceptMission({ text: 'Ayuda en casa sin que te lo pidan', from: 'Prueba' });
    const sun = new Date(); sun.setDate(sun.getDate() - sun.getDay());
    s.logMass(s.todayKey(sun), { color: 'verde', ok: true });
    s.addCoins(2000);
    const R = await import('./js/core/reminders.js');
    const d = new Date(); d.setDate(d.getDate() + 5);
    R.addEvent({ kind: 'comunion', date: s.todayKey(d), time: '10:00', title: 'Primera Comunión' });
    s.save();
  });
  await page.reload();
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
  const RICH = [['home', {}], ['catequesis', {}], ['memoria', {}], ['repasos', {}], ['diploma', {}], ['ratito', { tab: 'diario' }],
    ['misa', { tab: 'pasaporte' }], ['grandia', {}], ['bible', { tab: 'catecismo' }], ['bible', { tab: 'oraciones' }], ['parroquia', {}], ['calendario', {}]];
  let i = 0;
  for (const [name, params] of RICH) {
    const where = `avanzada ${name}${params.tab ? ':' + params.tab : ''}`;
    await page.evaluate(([n, p]) => { window.__screenError = null; return window.__palomita.go(n, p); }, [name, params]);
    await page.waitForTimeout(name === 'home' ? 1800 : 900);
    await page.screenshot({ path: path.join(outDir, `04-avanzada-${String(++i).padStart(2, '0')}-${name}${params.tab ? '-' + params.tab : ''}.png`) });
    await page.evaluate(() => document.querySelectorAll('.modal-scrim').forEach(m => m.remove()));
    await checkLayout(page, where); flush(errors, where);
  }
  if (await page.evaluate(() => Object.keys(window.__palomita.state.get().review).includes('q:yanoexiste'))) note('avanzada', 'la pregunta vieja no salió de «Mis repasos»');
  await ctx.close();
}

// ── 5. El micrófono se apaga al salir de la casa y al pasar la app a segundo plano ──
console.log('Micrófono');
{
  const save = { ...SAVE, settings: { ...SAVE.settings, listen: true }, flags: { ...SAVE.flags, micOk: true } };
  const { ctx, page, errors } = await newPage({ width: 390, height: 844 }, save, { mic: true });
  const live = () => page.evaluate(() => window.__streams.some(st => st.getTracks().some(t => t.readyState === 'live')));
  const waitLive = async () => { for (let k = 0; k < 40; k++) { if (await live()) return true; await page.waitForTimeout(250); } return false; };
  await page.mouse.click(200, 120);                   // el primer toque enciende el audio
  if (!(await waitLive())) console.log('  (este navegador no abrió el micrófono de prueba: se omite)');
  else {
    await page.evaluate(() => window.__palomita.go('catequesis'));
    await page.waitForTimeout(800);
    if (await live()) note('micrófono', 'sigue encendido después de salir de la casa de la palomita');
    await page.evaluate(() => window.__palomita.go('home'));
    if (await waitLive()) {
      await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
      await page.waitForTimeout(800);
      if (await live()) note('micrófono', 'sigue encendido con la app en segundo plano');
    }
  }
  flush(errors, 'micrófono');
  await ctx.close();
}

// ── 6. Presupuesto de arranque ──
const slow = Math.max(...boots);
console.log(`Arranque: ${Math.min(...boots)}–${slow} ms (máximo permitido ${BOOT_BUDGET_MS} ms)`);
if (slow > BOOT_BUDGET_MS) note('arranque', `la app tardó ${slow} ms en abrir`);

await browser.close();
console.log(problems.length ? `\n${problems.length} problema(s) encontrados.` : '\nTodo bien: sin problemas.');
process.exit(problems.length ? 1 : 0);
