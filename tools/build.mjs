#!/usr/bin/env node
// Construye las versiones empaquetadas de Palomita (la app también funciona SIN compilar: ver README).
//
//   npm install && npm run build
//
// Genera:
//   sw.js                   → lista de archivos para funcionar sin conexión (se regenera con la lista real del repo)
//   dist/palomita.html      → la app completa en UN solo archivo (se abre con doble clic, se puede compartir)
//   dist/artifact.html      → la misma app como fragmento para publicarla en visores que envuelven la página
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const pkg = JSON.parse(read('package.json'));

// ── 0. La versión que muestra la app (Ajustes, novedades) es la de package.json ──
{
  const want = `// Versión de Palomita. tools/build.mjs la mantiene igual a la de package.json (no la cambies a mano).\nexport const VERSION = '${pkg.version}';\n`;
  const file = path.join(root, 'js/core/version.js');
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== want) { fs.writeFileSync(file, want); console.log(`js/core/version.js → ${pkg.version}`); }
}

// ── 1. Service worker con la lista de archivos ──
function walk(dir, out = []) {
  for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.posix.join(dir, e.name);
    if (e.isDirectory()) walk(rel, out); else out.push(rel);
  }
  return out;
}
const precache = ['index.html', 'manifest.webmanifest',
  ...walk('css'), ...walk('js').filter(f => !f.includes('/variants/')),
  // La voz grabada pesa mucho: se guarda sin conexión a medida que se escucha (no toda de una vez).
  ...walk('assets').filter(f => !f.startsWith('assets/voz/') || f === 'assets/voz/index.json'),
  ...walk('vendor').filter(f => /\.(js|woff2)$/.test(f)),
].filter(f => !/\.(md|txt|map)$/.test(f)).sort();
const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
const sw = `// Palomita sin conexión. ARCHIVO GENERADO por tools/build.mjs — no lo edites a mano.
const CACHE = 'palomita-${pkg.version}-${stamp}';
const FILES = ${JSON.stringify(precache, null, 0)};

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', ...FILES])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('palomita-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Primero la copia guardada (rápido y sin conexión); si no está, la red.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
`;
fs.writeFileSync(path.join(root, 'sw.js'), sw);
console.log(`sw.js: ${precache.length} archivos en la lista sin conexión`);

// ── 2. Paquete de un solo archivo ──
let esbuild;
try { esbuild = createRequire(import.meta.url)('esbuild'); }
catch { console.log('esbuild no está instalado (npm install): se omite dist/.'); process.exit(0); }

const bundle = await esbuild.build({
  entryPoints: [path.join(root, 'js/main.js')],
  bundle: true, format: 'iife', minify: true, write: false, target: ['es2020'], legalComments: 'none',
  alias: { three: path.join(root, 'vendor/three/three.module.min.js') },
  logLevel: 'warning',
});
const js = bundle.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

const html = read('index.html');
const cssFiles = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(m => m[1]);
let css = cssFiles.map(f => read(f)).join('\n');
// Tipografías incrustadas
css = css.replace(/url\("\.\.\/vendor\/fonts\/([^"]+)"\)/g, (_, f) =>
  `url("data:font/woff2;base64,${fs.readFileSync(path.join(root, 'vendor/fonts', f)).toString('base64')}")`);
const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('<script type="module"')).trim();
const iconB64 = fs.existsSync(path.join(root, 'assets/icon-192.png')) ? fs.readFileSync(path.join(root, 'assets/icon-192.png')).toString('base64') : '';

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
const standalone = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
<title>Palomita</title>
<meta name="theme-color" content="#7cc8f5">
${iconB64 ? `<link rel="icon" href="data:image/png;base64,${iconB64}">` : ''}
<style>${css}</style>
</head>
<body>
${body}
<script>${js}</script>
</body>
</html>
`;
fs.writeFileSync(path.join(root, 'dist/palomita.html'), standalone);

// Fragmento para visores que añaden su propio <html>/<head>/<body> y ya reservan las zonas seguras del teléfono.
const fragment = `<title>Palomita</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>${css}
:root { --safe-t: 0px; --safe-b: 0px; }
</style>
${body}
<script>${js}</script>
`;
fs.writeFileSync(path.join(root, 'dist/artifact.html'), fragment);
const kb = f => (fs.statSync(path.join(root, f)).size / 1024).toFixed(0) + ' KB';
console.log(`dist/palomita.html ${kb('dist/palomita.html')} · dist/artifact.html ${kb('dist/artifact.html')}`);
