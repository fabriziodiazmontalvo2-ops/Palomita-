// Palomita sin conexión. ARCHIVO GENERADO por tools/build.mjs — no lo edites a mano.
const CACHE = 'palomita-1.0.0-202611230158';
const FILES = ["assets/icon-180.png","assets/icon-192.png","assets/icon-512.png","assets/icon-maskable-512.png","css/app.css","css/bible.css","css/fonts.css","css/home.css","css/shop.css","index.html","js/core/audio.js","js/core/router.js","js/core/state.js","js/core/tts.js","js/core/ui.js","js/data/bible-at.js","js/data/bible-nt.js","js/data/catechism.js","js/data/items.js","js/data/parables.js","js/data/phrases.js","js/data/prayers.js","js/data/trivia.js","js/data/verses.js","js/games/engine.js","js/games/kit.js","js/games/luz.js","js/games/mostaza.js","js/games/noe.js","js/games/oveja.js","js/games/panes.js","js/games/perla.js","js/games/prodigo.js","js/games/registry.js","js/games/roca.js","js/games/samaritano.js","js/games/sembrador.js","js/games/talentos.js","js/main.js","js/pet/accessories.js","js/pet/dove.js","js/pet/rooms.js","js/pet/talkback.js","js/pet/world.js","js/screens/bible.js","js/screens/games.js","js/screens/home.js","js/screens/settings.js","js/screens/shop.js","js/screens/welcome.js","manifest.webmanifest","vendor/fonts/baloo-2-latin-500-normal.woff2","vendor/fonts/baloo-2-latin-600-normal.woff2","vendor/fonts/baloo-2-latin-700-normal.woff2","vendor/fonts/baloo-2-latin-800-normal.woff2","vendor/fonts/nunito-latin-400-normal.woff2","vendor/fonts/nunito-latin-600-normal.woff2","vendor/fonts/nunito-latin-700-normal.woff2","vendor/fonts/nunito-latin-800-normal.woff2","vendor/fonts/nunito-latin-900-normal.woff2","vendor/three/RoundedBoxGeometry.js","vendor/three/three.module.min.js"];

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
  }).catch(() => caches.match('index.html'))));
});
