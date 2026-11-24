#!/usr/bin/env node
// Fotos de la tienda: la palomita con cada prenda o accesorio puesto, de fondo transparente → assets/ropa/<id>.webp.
// Usa el laboratorio dev/dove-lab.html en un navegador de verdad (Playwright) y Python con Pillow para pasar a WebP.
//
//   node tools/serve.mjs &               (en otra terminal)
//   node tools/ropa-fotos.mjs [id …]     sin ids: todas las de js/data/items.js
//
// Si falta una foto, la tienda muestra el emoji de esa prenda (ver js/core/accart.js).
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); }
catch { ({ chromium } = createRequire('/opt/node-tools/node_modules/')('playwright')); }

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { ACCESSORIES } = await import(path.join(root, 'js/data/items.js'));
const base = process.env.PALOMITA_URL || 'http://localhost:8765';
const out = path.join(root, 'assets/ropa');
fs.mkdirSync(out, { recursive: true });
const want = process.argv.slice(2);
const list = ACCESSORIES.filter(a => !want.length || want.includes(a.id));

// Encuadre según dónde va: la ropa y el cuello de cuerpo entero; la cabeza y la cara de cerca; los zapatos, abajo.
const CAM = {
  body: { ty: 0.98, dist: 4.9, yaw: 20, pitch: 6 }, neck: { ty: 1.05, dist: 3.9, yaw: 18, pitch: 6 },
  head: { ty: 1.62, dist: 3.5, yaw: 22, pitch: 8 }, face: { ty: 1.48, dist: 3.4, yaw: 14, pitch: 4 },
  beak: { ty: 1.4, dist: 2.9, yaw: 32, pitch: 4 }, feet: { ty: 0.2, dist: 2.3, yaw: 34, pitch: 2 },
};
const SIZE = 240;
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: 1 });
const tmp = path.join(out, '.tmp.png');
let n = 0;
for (const a of list) {
  const c = CAM[a.slot] || CAM.body;
  const q = new URLSearchParams({ at: '0.2', hud: '0', bg: 'none', mood: 'happy', ty: c.ty, dist: c.dist, yaw: c.yaw, pitch: c.pitch, wear: `${a.slot}:${a.id}` });
  await page.goto(`${base}/dev/dove-lab.html?${q}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
  const err = await page.evaluate(() => window.__error || null);
  if (err) { console.log(`✗ ${a.id}: ${err.split('\n')[0]}`); continue; }
  await page.screenshot({ path: tmp, omitBackground: true });
  execFileSync('python3', ['-c', 'import sys; from PIL import Image; Image.open(sys.argv[1]).save(sys.argv[2], "WEBP", quality=82, method=6)', tmp, path.join(out, `${a.id}.webp`)]);
  n++;
}
fs.rmSync(tmp, { force: true });
await browser.close();
console.log(`${n} fotos en assets/ropa/`);
