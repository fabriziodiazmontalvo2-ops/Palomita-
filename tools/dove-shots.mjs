#!/usr/bin/env node
// Captura un juego estándar de poses de una variante de la palomita y arma una hoja de contactos.
// Uso: node tools/dove-shots.mjs <variante: a|b|c|main> <carpeta-salida> [puerto=8765]
// Requiere el servidor de desarrollo (node tools/serve.mjs) corriendo.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); }
catch { ({ chromium } = createRequire('/opt/node-tools/node_modules/')('playwright')); }

const [variant = 'main', outDir = './dove-shots', port = '8765'] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });

const SHOTS = [
  ['01-frente-feliz', 'mood=happy&at=0.3'],
  ['02-tres-cuartos', 'mood=happy&yaw=35&at=0.3'],
  ['03-perfil', 'mood=neutral&yaw=90&at=0.3'],
  ['04-espalda', 'mood=neutral&yaw=160&at=0.3'],
  ['05-desde-arriba', 'mood=happy&yaw=20&pitch=35&at=0.3'],
  ['06-triste', 'mood=sad&yaw=15&at=1.2'],
  ['07-dormida', 'sleep=1&yaw=15&at=2.5'],
  ['08-sucia', 'mood=neutral&dirt=1&yaw=-15&at=0.3'],
  ['09-emocionada', 'mood=excited&yaw=10&at=0.55'],
  ['10-mira-izquierda', 'mood=happy&look=-1,0.3&at=1.2'],
  ['11-comer', 'mood=happy&action=eat&yaw=25&at=0.5'],
  ['12-hablar', 'mood=happy&talk=1&yaw=25&at=0.3'],
  ['13-saltar', 'mood=happy&action=hop&at=0.3'],
  ['14-aletear', 'mood=happy&action=flap&at=0.35'],
  ['15-bailar', 'mood=happy&action=dance&yaw=10&at=0.9'],
  ['16-rezar', 'mood=happy&action=pray&yaw=20&at=1.5'],
  ['17-cosquillas', 'mood=happy&action=giggle&at=0.4'],
  ['18-saludar', 'mood=happy&action=wave&at=0.5'],
];

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 420, height: 520 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

const files = [];
for (const [name, qs] of SHOTS) {
  await page.goto(`http://localhost:${port}/dev/dove-lab.html?v=${variant}&hud=0&${qs}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
  const err = await page.evaluate(() => window.__error || null);
  if (err) errors.push(`${name}: ${err}`);
  const file = path.join(outDir, `${variant}-${name}.png`);
  await page.screenshot({ path: file });
  files.push([name, file]);
}

// Hoja de contactos (6 columnas)
const sheet = await browser.newPage({ viewport: { width: 6 * 300 + 20, height: 100 }, deviceScaleFactor: 1 });
const cells = files.map(([name, file]) => {
  const b64 = fs.readFileSync(file).toString('base64');
  return `<figure><img src="data:image/png;base64,${b64}"><figcaption>${name}</figcaption></figure>`;
}).join('');
await sheet.setContent(`<style>body{margin:10px;font:14px system-ui;background:#222;color:#fff}
  h1{font-size:18px;margin:0 0 8px} .g{display:grid;grid-template-columns:repeat(6,300px);gap:0}
  figure{margin:0} img{width:300px;display:block} figcaption{text-align:center;padding:2px 0 8px}</style>
  <h1>Palomita — variante "${variant}"</h1><div class="g">${cells}</div>`);
const sheetFile = path.join(outDir, `${variant}-hoja.png`);
await sheet.screenshot({ path: sheetFile, fullPage: true });
await browser.close();

console.log(JSON.stringify({ variant, sheet: sheetFile, shots: files.map(f => f[1]), errors }, null, 2));
process.exit(errors.length ? 1 : 0);
