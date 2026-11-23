// Arranque de Palomita: carga la partida, registra las pantallas y mantiene el paso del tiempo.
import * as state from './core/state.js';
import * as audio from './core/audio.js';
import * as tts from './core/tts.js';
import { fitApp, toast } from './core/ui.js';
import { register, go, back, setHome, current, screenBack } from './core/router.js';
import { startGame, isRunning, handleBack } from './games/engine.js';

register('home', () => import('./screens/home.js'));
register('welcome', () => import('./screens/welcome.js'));
register('games', () => import('./screens/games.js'));
register('bible', () => import('./screens/bible.js'));
register('shop', () => import('./screens/shop.js'));
register('settings', () => import('./screens/settings.js'));
register('levels', () => import('./screens/levels.js'));
register('catequesis', () => import('./screens/catequesis.js'));
register('lesson', () => import('./screens/lesson.js'));
register('confesion', () => import('./screens/confesion.js'));
register('misa', () => import('./screens/misa.js'));
register('reto', () => import('./screens/reto.js'));
setHome('home');

const TICK_SECONDS = 5;
let hiddenAt = 0;

function applySettings() {
  audio.setSound(state.setting('sound') !== false);
  audio.setMusic(state.setting('music') !== false);
}

// Botón "atrás" de Android (lo llama la app nativa). Devuelve true si Palomita lo manejó; false = salir de la app.
function androidBack() {
  const scrims = document.querySelectorAll('.modal-scrim');
  if (scrims.length) {
    const top = scrims[scrims.length - 1];
    if (top.__close) { top.__close(); return true; }
    const btns = top.querySelectorAll('.modal__actions .btn');
    const btn = top.querySelector('.modal__actions .btn--ghost') || btns[btns.length - 1];
    if (btn) btn.click(); else top.remove();
    return true;
  }
  if (handleBack()) return true;
  if (screenBack()) return true;
  const cur = current();
  if (cur && cur.name !== 'home' && cur.name !== 'welcome') { back(); return true; }
  return false;
}

async function boot() {
  fitApp();
  window.addEventListener('resize', fitApp);
  window.addEventListener('orientationchange', () => setTimeout(fitApp, 250));

  state.init();
  applySettings();
  state.on('settings', applySettings);
  state.on('level', ({ level }) => { audio.sfx('levelup'); toast(`¡Subiste al nivel ${level}! +25 ${state.COIN.icon}`, { icon: '⬆️', ms: 3200 }); });

  // El audio solo puede empezar después del primer toque.
  const firstTouch = () => { audio.unlock(); audio.music(true); };
  window.addEventListener('pointerdown', firstTouch, { once: true });
  window.addEventListener('keydown', firstTouch, { once: true });

  // Paso del tiempo: los medidores bajan despacito mientras la app está abierta (no durante un minijuego).
  setInterval(() => { if (!document.hidden && !isRunning()) state.tick(TICK_SECONDS); }, TICK_SECONDS * 1000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hiddenAt = Date.now(); state.save(); tts.stop(); }
    else if (hiddenAt) { state.tick(Math.min(12 * 3600, (Date.now() - hiddenAt) / 1000)); hiddenAt = 0; }
  });
  window.addEventListener('pagehide', () => state.save());

  // Para pruebas y depuración.
  window.__palomita = { state, audio, go, back, current, startGame, androidBack };

  // Espera breve a las tipografías para que nada "salte" al aparecer.
  try { await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]); } catch { /* sigue */ }

  await go(state.flag('onboarded') ? 'home' : 'welcome');
  window.__ready = true;

  // Sin conexión: solo cuando la app está publicada en un sitio https (no en pruebas locales ni dentro de visores).
  try {
    const local = ['localhost', '127.0.0.1', ''].includes(location.hostname);
    if ('serviceWorker' in navigator && location.protocol === 'https:' && !local && window.top === window) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  } catch { /* sin modo sin conexión */ }
}

boot().catch(e => {
  console.error(e);
  window.__bootError = String(e && e.stack || e);
  const s = document.getElementById('screen');
  if (s) s.innerHTML = '<div class="splash"><div class="splash__bird">🛠️</div><h2>No pudimos abrir Palomita</h2><p>Cierra y vuelve a abrir la app.</p></div>';
  window.__ready = true;
});
