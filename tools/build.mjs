#!/usr/bin/env node
// Construye las versiones empaquetadas de Palomita (la app también funciona SIN compilar: ver README).
//
//   npm install && npm run build
//
// Genera:
//   sw.js                   → lista de archivos para funcionar sin conexión (se regenera con la lista real del repo)
//   dist/palomita.html      → la app completa en UN solo archivo (se abre con doble clic, se puede compartir)
//   dist/artifact.html      → la misma app como fragmento para publicarla en visores que envuelven la página
//   dist/app/               → la app por módulos para el APK: al abrir carga solo lo necesario y el resto (historias,
//                             catecismo, juegos…) cuando se usa; así arranca más rápido en teléfonos sencillos
import fs from 'node:fs';
import crypto from 'node:crypto';
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
// El nombre de la caché es la huella del contenido: si nada cambió, no hay «versión nueva» que bajar.
const digest = files => { const h = crypto.createHash('sha256'); for (const f of files) h.update(f).update(fs.readFileSync(path.join(root, f))); return h.digest('hex').slice(0, 12); };
const appHash = digest(precache);
// La voz va en su propia caché: se guarda a medida que se escucha y no se borra con cada versión de la app,
// solo cuando se vuelve a grabar (cambia assets/voz/index.json).
const vozHash = fs.existsSync(path.join(root, 'assets/voz/index.json')) ? digest(['assets/voz/index.json']) : 'sin-voz';
const sw = `// Palomita sin conexión. ARCHIVO GENERADO por tools/build.mjs — no lo edites a mano.
// Una versión nueva se instala en silencio y espera: la app avisa «Hay una versión nueva» y se cambia cuando
// el niño (o un grande) toca «Actualizar», o la próxima vez que se abra. Así nunca se recarga en medio de un juego.
const CACHE = 'palomita-${pkg.version}-${appHash}';
const VOZ = 'palomita-voz-${vozHash}';
const FILES = ${JSON.stringify(precache, null, 0)};

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', ...FILES])));
});
self.addEventListener('message', e => { if (e.data === 'actualizar') self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('palomita-') && k !== CACHE && k !== VOZ).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Primero la copia guardada (rápido y sin conexión); si no está, la red. Solo se miran las cachés de ESTA versión.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const voz = url.pathname.includes('/assets/voz/') && !url.pathname.endsWith('/index.json');
  const store = voz ? VOZ : CACHE;
  e.respondWith(caches.open(store).then(c => c.match(req, { ignoreSearch: true })).then(hit => hit || fetch(req).then(res => {
    if (res.ok && res.status === 200) { const copy = res.clone(); caches.open(store).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => (req.mode === 'navigate' ? caches.open(CACHE).then(c => c.match('index.html')) : Response.error()))));
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

// ── 3. Por módulos, para el APK ──
// Cada import() de la app queda como un archivo aparte (c/…js) que el WebView pide solo cuando hace falta.
const appDir = path.join(root, 'dist/app');
fs.rmSync(appDir, { recursive: true, force: true });
const split = await esbuild.build({
  entryPoints: { main: path.join(root, 'js/main.js') },
  bundle: true, splitting: true, format: 'esm', minify: true, outdir: appDir, chunkNames: 'c/[name]-[hash]',
  target: ['es2020'], legalComments: 'none', metafile: true,
  alias: { three: path.join(root, 'vendor/three/three.module.min.js') },
  logLevel: 'warning',
});
fs.writeFileSync(path.join(appDir, 'index.html'), `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
<title>Palomita</title>
<meta name="theme-color" content="#7cc8f5">
<style>${css}</style>
<link rel="modulepreload" href="main.js">
</head>
<body>
${body}
<script>
// Red de seguridad: si este teléfono no pudiera cargar la app por módulos, se abre la versión de un solo archivo
// (palomita.html, que el APK también trae). Misma dirección, así que la partida guardada es la misma.
window.__palomitaPlanB = () => { try { if (!sessionStorage.getItem('palomita.planB')) { sessionStorage.setItem('palomita.planB', '1'); location.replace('palomita.html'); } } catch (e) { location.replace('palomita.html'); } };
setTimeout(() => { if (!window.__palomitaBoot) window.__palomitaPlanB(); }, 20000);
</script>
<script type="module" src="main.js" onerror="window.__palomitaPlanB()"></script>
</body>
</html>
`);
// Lo que se carga al abrir: main.js y lo que importa sin import() (los demás archivos esperan a que se usen).
{
  const outs = split.metafile.outputs;
  const key = Object.keys(outs).find(k => k.endsWith('/main.js'));
  const seen = new Set();
  const walkStatic = k => { if (seen.has(k) || !outs[k]) return; seen.add(k); for (const im of outs[k].imports || []) if (im.kind === 'import-statement') walkStatic(im.path); };
  walkStatic(key);
  const startKb = [...seen].reduce((a, k) => a + outs[k].bytes, 0) / 1024;
  const allKb = Object.values(outs).filter(o => o.bytes).reduce((a, o) => a + o.bytes, 0) / 1024;
  console.log(`dist/app: ${Object.keys(outs).length} archivos · al abrir ${startKb.toFixed(0)} KB de ${allKb.toFixed(0)} KB`);
  // Presupuesto: lo que se carga antes de la primera pantalla tiene que seguir siendo poco (teléfonos sencillos).
  const BUDGET_KB = 300;
  if (startKb > BUDGET_KB) { console.error(`✗ dist/app: al abrir se cargan ${startKb.toFixed(0)} KB (el máximo es ${BUDGET_KB} KB). ¿Un import() se volvió import fijo?`); process.exitCode = 1; }
}
