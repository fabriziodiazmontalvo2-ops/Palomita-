// Palomita sin conexión. ARCHIVO GENERADO por tools/build.mjs — no lo edites a mano.
// Una versión nueva se instala en silencio y espera: la app avisa «Hay una versión nueva» y se cambia cuando
// el niño (o un grande) toca «Actualizar», o la próxima vez que se abra. Así nunca se recarga en medio de un juego.
const CACHE = 'palomita-1.3.0-3a44fe17ca20';
const VOZ = 'palomita-voz-45d1efad9ca2';
const FILES = ["assets/icon-180.png","assets/icon-192.png","assets/icon-512.png","assets/icon-maskable-512.png","assets/parroquia/altar.jpg","assets/parroquia/fachada.jpg","assets/voz/index.json","css/app.css","css/bible.css","css/catequesis.css","css/fe.css","css/figuritas.css","css/fonts.css","css/grandes.css","css/home.css","css/parroquia.css","css/shop.css","index.html","js/art/scenes.js","js/art/stickers-art.js","js/core/audio.js","js/core/backup.js","js/core/device.js","js/core/grown.js","js/core/links.js","js/core/liturgy.js","js/core/missions.js","js/core/narration.js","js/core/photos.js","js/core/profiles.js","js/core/reminders.js","js/core/report.js","js/core/review.js","js/core/rewards.js","js/core/router.js","js/core/state.js","js/core/stickers.js","js/core/tts.js","js/core/ui.js","js/core/update.js","js/core/version.js","js/data/bible-at.js","js/data/bible-milagros.js","js/data/bible-nt.js","js/data/catechism.js","js/data/confession.js","js/data/cura-ars.js","js/data/decor.js","js/data/dudas.js","js/data/familia.js","js/data/fiestas.js","js/data/gran-dia.js","js/data/items.js","js/data/lessons.js","js/data/mass.js","js/data/novedades.js","js/data/oraciones-extra.js","js/data/papas.js","js/data/parables.js","js/data/parroquia.js","js/data/phrases.js","js/data/prayers.js","js/data/ratito.js","js/data/stickers.js","js/data/trivia.js","js/data/verses.js","js/games/engine.js","js/games/kit.js","js/games/levels.js","js/games/luz.js","js/games/mostaza.js","js/games/noe.js","js/games/oveja.js","js/games/panes.js","js/games/perla.js","js/games/prodigo.js","js/games/registry.js","js/games/roca.js","js/games/samaritano.js","js/games/sembrador.js","js/games/talentos.js","js/home/midia.js","js/home/moments.js","js/home/play.js","js/home/ropero.js","js/home/season.js","js/main.js","js/pet/accessories.js","js/pet/arrival.js","js/pet/dove.js","js/pet/rooms.js","js/pet/talkback.js","js/pet/world.js","js/screens/bible.js","js/screens/calendario.js","js/screens/catequesis.js","js/screens/confesion.js","js/screens/credo.js","js/screens/diploma.js","js/screens/dudas.js","js/screens/figuritas.js","js/screens/games.js","js/screens/grandes.js","js/screens/grandia.js","js/screens/home.js","js/screens/lesson.js","js/screens/levels.js","js/screens/memoria.js","js/screens/misa.js","js/screens/novedades.js","js/screens/parroquia.js","js/screens/perfiles.js","js/screens/ratito.js","js/screens/repasos.js","js/screens/reto.js","js/screens/rosario.js","js/screens/settings.js","js/screens/shop.js","js/screens/welcome.js","manifest.webmanifest","vendor/fonts/baloo-2-latin-500-normal.woff2","vendor/fonts/baloo-2-latin-600-normal.woff2","vendor/fonts/baloo-2-latin-700-normal.woff2","vendor/fonts/baloo-2-latin-800-normal.woff2","vendor/fonts/nunito-latin-400-normal.woff2","vendor/fonts/nunito-latin-600-normal.woff2","vendor/fonts/nunito-latin-700-normal.woff2","vendor/fonts/nunito-latin-800-normal.woff2","vendor/fonts/nunito-latin-900-normal.woff2","vendor/three/RoundedBoxGeometry.js","vendor/three/three.module.min.js"];

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
