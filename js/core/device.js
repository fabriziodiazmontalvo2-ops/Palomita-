// Lo que Palomita le pide al teléfono, con un plan B en el navegador.
// En la app de Android usa el puente PalomitaAndroid (MainActivity.java); en la web, lo que el navegador permita.
//
//   isNative()                          true dentro de la app de Android
//   keepAwake(motivo, on)               pantalla encendida mientras haya algún motivo activo ('voz', 'juego', 'oracion'…)
//   appVersion()                        versión instalada del APK, p. ej. «1.3 (4)» ('' en la web)
//   systemFontScale()                   tamaño de letra del teléfono (1 = normal) o null
//   shareText(texto, título)            → 'shared' | 'copied' | false   (selector del teléfono; si no, lo copia)
//   shareImage(dataUrl, nombre, texto)  → 'shared' | 'downloaded' | false
//   canShareApp() / shareApp()          → Promise<boolean>   pasar el APK a otra familia (solo Android)
//   saveFile(nombre, mime, texto)       → Promise<'saved' | 'downloaded' | false>
//   openFile()                          → Promise<string | null>   texto del archivo elegido
//   copyText(texto)                     → Promise<boolean>

const bridge = () => (typeof window !== 'undefined' ? window.PalomitaAndroid : null);
const has = name => { const b = bridge(); return !!(b && typeof b[name] === 'function'); };

export function isNative() { return has('scheduleReminders'); }

// ── Pantalla encendida solo cuando hace falta ──
const awake = new Set();
let wakeLock = null;
export function keepAwake(reason, on) {
  const before = awake.size > 0;
  if (on) awake.add(reason); else awake.delete(reason);
  const now = awake.size > 0;
  if (before === now) return;
  if (has('keepAwake')) { try { bridge().keepAwake(now); } catch { /* nada */ } return; }
  // Navegador: Screen Wake Lock (si existe).
  try {
    if (now && navigator.wakeLock && !document.hidden) navigator.wakeLock.request('screen').then(l => { wakeLock = l; }).catch(() => {});
    else if (!now && wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
  } catch { /* sin bloqueo de pantalla */ }
}
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    // El navegador suelta el bloqueo al ocultarse; al volver, se pide de nuevo si sigue haciendo falta.
    if (!document.hidden && awake.size && !has('keepAwake') && navigator.wakeLock) navigator.wakeLock.request('screen').then(l => { wakeLock = l; }).catch(() => {});
  });
}

export function appVersion() { try { return has('appVersion') ? String(bridge().appVersion() || '') : ''; } catch { return ''; } }
export function systemFontScale() {
  try { if (has('fontScale')) { const v = Number(bridge().fontScale()); return v > 0 ? v : null; } } catch { /* nada */ }
  return null;
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* sigue */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.append(ta); ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch { return false; }
}

export async function shareText(text, title = '') {
  if (has('shareText')) { try { bridge().shareText(text, title); return 'shared'; } catch { /* sigue */ } }
  try { if (navigator.share) { await navigator.share({ title, text }); return 'shared'; } } catch (e) { if (e && e.name === 'AbortError') return false; }
  return (await copyText(text)) ? 'copied' : false;
}

function dataUrlToBlob(dataUrl) {
  const [head, b64] = dataUrl.split(',');
  const mime = (head.match(/data:([^;]+)/) || [])[1] || 'application/octet-stream';
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
function download(blob, name) {
  try {
    if (window.top !== window) return false;              // dentro de un visor no se puede descargar
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.rel = 'noopener';
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return true;
  } catch { return false; }
}

export async function shareImage(dataUrl, name = 'palomita.png', text = '') {
  if (has('shareImage')) { try { if (bridge().shareImage(dataUrl, name, text)) return 'shared'; } catch { /* sigue */ } }
  try {
    const file = new File([dataUrlToBlob(dataUrl)], name, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text }); return 'shared'; }
  } catch (e) { if (e && e.name === 'AbortError') return false; }
  return download(dataUrlToBlob(dataUrl), name) ? 'downloaded' : false;
}

export function canShareApp() { return has('shareApp'); }
export function shareApp() {
  if (!has('shareApp')) return Promise.resolve(false);
  return new Promise(resolve => {
    const prev = window.__palomitaShared;
    const t = setTimeout(() => { window.__palomitaShared = prev; resolve(false); }, 60000);
    window.__palomitaShared = ok => { clearTimeout(t); window.__palomitaShared = prev; resolve(!!ok); };
    try { bridge().shareApp(); } catch { clearTimeout(t); window.__palomitaShared = prev; resolve(false); }
  });
}

// Respuestas del selector de archivos de Android: window.__palomitaFile('save' | 'open', ok)
const fileWaiters = { save: null, open: null };
if (typeof window !== 'undefined') {
  window.__palomitaFile = (op, ok) => { const w = fileWaiters[op]; fileWaiters[op] = null; w?.(!!ok); };
}

export function saveFile(name, mime, text) {
  if (has('saveFile')) {
    return new Promise(resolve => {
      fileWaiters.save?.(false);
      fileWaiters.save = ok => resolve(ok ? 'saved' : false);
      try { bridge().saveFile(name, mime, text); } catch { fileWaiters.save = null; resolve(false); }
    });
  }
  return Promise.resolve(download(new Blob([text], { type: mime || 'application/json' }), name) ? 'downloaded' : false);
}

export function openFile() {
  if (has('openFile')) {
    return new Promise(resolve => {
      fileWaiters.open?.(false);
      fileWaiters.open = ok => { let t = null; try { t = ok ? String(bridge().takeOpenedFile() || '') : null; } catch { t = null; } resolve(t || null); };
      try { bridge().openFile(); } catch { fileWaiters.open = null; resolve(null); }
    });
  }
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json,text/plain';
    input.style.display = 'none';
    let done = false;
    const finish = v => { if (done) return; done = true; input.remove(); resolve(v); };
    input.addEventListener('change', () => {
      const f = input.files && input.files[0];
      if (!f) return finish(null);
      const r = new FileReader();
      r.onload = () => finish(String(r.result || ''));
      r.onerror = () => finish(null);
      r.readAsText(f);
    });
    // Si la persona cierra el selector sin elegir, algunos navegadores no avisan: se da por cancelado al volver.
    window.addEventListener('focus', () => setTimeout(() => { if (!input.files || !input.files.length) finish(null); }, 800), { once: true });
    document.body.append(input);
    input.click();
  });
}

// ── Tamaño de letra de la app (Ajustes: A, A+, A++). Es del teléfono, no de cada niño. ──
const DKEY = 'palomita.device.v1';
export const FONT_STEPS = [1, 1.12, 1.25];
function readDevice() { try { return JSON.parse(localStorage.getItem(DKEY) || 'null') || {}; } catch { return {}; } }
export function fontStep() {
  const d = readDevice();
  if (Number.isInteger(d.font) && d.font >= 0 && d.font < FONT_STEPS.length) return d.font;
  // Primera vez en Android: se propone el tamaño que el teléfono ya usa.
  const sys = systemFontScale();
  return sys && sys >= 1.22 ? 2 : sys && sys >= 1.1 ? 1 : 0;
}
export function setFontStep(i) {
  const k = Math.max(0, Math.min(FONT_STEPS.length - 1, i | 0));
  try { localStorage.setItem(DKEY, JSON.stringify({ ...readDevice(), font: k })); } catch { /* nada */ }
  applyFont();
}
export function applyFont() {
  try { document.documentElement.style.setProperty('--font-k', String(FONT_STEPS[fontStep()])); } catch { /* nada */ }
}
