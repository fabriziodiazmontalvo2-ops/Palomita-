// Versión nueva y datos guardados (solo en la web publicada; el APK se actualiza desde el teléfono).
//
//   watchUpdates()   registra el modo sin conexión (sw.js). Cuando el service worker baja una versión nueva, aparece
//                    una cintita «Hay una versión nueva · Actualizar». No se recarga sola: así nunca corta un juego a
//                    la mitad. Si nadie la toca, la versión nueva entra la próxima vez que se abra la app.
//   keepData()       pide al navegador que no borre el avance del niño cuando le falte espacio.
import * as state from './state.js';
import { h, overlayRoot } from './ui.js';
import { sfx } from './audio.js';

const inApk = () => !!window.PalomitaAndroid;

export function watchUpdates() {
  try {
    const local = ['localhost', '127.0.0.1', ''].includes(location.hostname);
    if (!('serviceWorker' in navigator) || location.protocol !== 'https:' || local || window.top !== window || inApk()) return;
    const sw = navigator.serviceWorker;
    let reloading = false;
    sw.addEventListener('controllerchange', () => { if (reloading) return; reloading = true; state.save(); location.reload(); });
    sw.register('sw.js').then(reg => {
      const offer = w => { if (w && sw.controller) banner(w); };       // la primera instalación no avisa nada
      if (reg.waiting) offer(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w?.addEventListener('statechange', () => { if (w.state === 'installed') offer(w); });
      });
      // Al volver a la app (como mucho una vez por hora) se pregunta si hay algo nuevo.
      let last = Date.now();
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && Date.now() - last > 3600e3) { last = Date.now(); reg.update().catch(() => {}); }
      });
    }).catch(() => {});
  } catch { /* sin modo sin conexión */ }
}

let shown = null;
function banner(worker) {
  if (shown?.isConnected) return;
  shown = h('div', { class: 'upd', role: 'status' },
    h('span', { class: 'upd__i', 'aria-hidden': 'true' }, '✨'),
    h('span', { class: 'upd__t' }, 'Hay una versión nueva de Palomita'),
    h('button', { type: 'button', class: 'btn btn--sun btn--sm', onclick: () => { sfx('tap'); state.save(); worker.postMessage('actualizar'); } }, 'Actualizar'),
    h('button', { type: 'button', class: 'upd__x', 'aria-label': 'Ahora no', onclick: () => { sfx('tap'); shown.remove(); } }, '✖'));
  overlayRoot().append(shown);
}

export function keepData() {
  try {
    if (inApk() || !navigator.storage?.persist || (Number(state.get().days) || 0) < 2) return;
    navigator.storage.persisted().then(p => { if (!p) navigator.storage.persist().catch(() => {}); }).catch(() => {});
  } catch { /* nada */ }
}
