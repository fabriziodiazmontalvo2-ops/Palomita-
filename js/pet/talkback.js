// "Háblame": la palomita escucha unos segundos y repite lo que oyó con voz aguda, como un lorito simpático.
// Todo ocurre en el dispositivo: el sonido no se guarda ni se envía a ningún lado.
//   available()                          → true si el navegador permite grabar (no garantiza el permiso)
//   listenAndRepeat({ maxMs, onState, onLevel }) → Promise<boolean>   onState('listening' | 'speaking' | 'idle'), onLevel(0..1)
//   cancel()
import { context, duck } from '../core/audio.js';

let stream = null, recorder = null, source = null, raf = 0, stopTimer = 0, blocked = false;

export function available() {
  try {
    return !blocked && !!navigator.mediaDevices?.getUserMedia && typeof window.MediaRecorder === 'function' && window.isSecureContext !== false;
  } catch { return false; }
}

function cleanup() {
  clearTimeout(stopTimer); cancelAnimationFrame(raf);
  try { source?.stop(); } catch { /* ya terminó */ }
  source = null;
  try { stream?.getTracks().forEach(t => t.stop()); } catch { /* nada */ }
  stream = null; recorder = null;
  duck(false);
}
export function cancel() { try { if (recorder && recorder.state !== 'inactive') recorder.stop(); } catch { /* nada */ } cleanup(); }
// Termina de escuchar antes de tiempo (pasa a repetir).
export function finishListening() { try { if (recorder && recorder.state === 'recording') recorder.stop(); } catch { /* nada */ } }

export async function listenAndRepeat({ maxMs = 4000, onState = () => {}, onLevel = () => {} } = {}) {
  const ctx = context();
  if (!ctx || !available()) return false;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  } catch {
    blocked = true;            // sin permiso o bloqueado por el entorno: no se vuelve a ofrecer en esta sesión
    cleanup();
    return false;
  }
  try {
    const chunks = [];
    recorder = new MediaRecorder(stream);
    const done = new Promise(res => { recorder.onstop = res; recorder.onerror = res; });
    recorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    recorder.start();
    onState('listening');
    duck(true);
    stopTimer = setTimeout(finishListening, maxMs);
    await done;
    clearTimeout(stopTimer);
    try { stream.getTracks().forEach(t => t.stop()); } catch { /* nada */ }
    if (!chunks.length) { onState('idle'); cleanup(); return false; }
    const buf = await new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }).arrayBuffer();
    const audio = await new Promise((res, rej) => ctx.decodeAudioData(buf, res, rej));
    source = ctx.createBufferSource();
    source.buffer = audio;
    source.playbackRate.value = 1.45;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    const gain = ctx.createGain(); gain.gain.value = 1.4;
    source.connect(gain); gain.connect(analyser); analyser.connect(ctx.destination);
    const data = new Uint8Array(analyser.fftSize);
    onState('speaking');
    const ended = new Promise(res => { source.onended = res; });
    const loop = () => {
      analyser.getByteTimeDomainData(data);
      let peak = 0;
      for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i] - 128));
      onLevel(Math.min(1, peak / 50));
      raf = requestAnimationFrame(loop);
    };
    loop();
    source.start();
    await ended;
    onLevel(0);
    onState('idle');
    cleanup();
    return true;
  } catch {
    onLevel(0); onState('idle');
    cleanup();
    return false;
  }
}
