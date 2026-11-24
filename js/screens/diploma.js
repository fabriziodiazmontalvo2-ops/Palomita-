// «Mi diploma»: al terminar todos los temas de «Mi camino», un diploma con el nombre del niño y la parroquia,
// dibujado en un lienzo (tamaño A4 a 150 ppp, para compartir por WhatsApp o imprimir y firmar).
// Sin emojis en el dibujo: cada teléfono los pinta distinto (y algunos no los tienen), así que todo va con trazos.
//   go('diploma')
import * as state from '../core/state.js';
import * as R from '../core/reminders.js';
import { shareImage } from '../core/device.js';
import { h, button, toast } from '../core/ui.js';
import { sfx } from '../core/audio.js';
import { go, back } from '../core/router.js';
import { PARISH } from '../data/parroquia.js';
import { arr, txt, deco, loadData, lifecycle, shell, progressMeter, celebrate, grant, rewardRow } from './catequesis.js';

const W = 1240, H = 1754;
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const GOLD = '#d9a52e', GOLD_SOFT = '#ecc967', GRAPE = '#6d4fc2', INK = '#27325e', RED = '#b5393f';
const DISPLAY = '"Baloo 2", "Trebuchet MS", sans-serif', BODY = 'Nunito, "Segoe UI", sans-serif';
const PRIZE = { coins: 50, fe: 5, xp: 20 };

function roundRect(x, l, t, w, hh, r) {
  x.beginPath();
  x.moveTo(l + r, t); x.arcTo(l + w, t, l + w, t + hh, r); x.arcTo(l + w, t + hh, l, t + hh, r);
  x.arcTo(l, t + hh, l, t, r); x.arcTo(l, t, l + w, t, r); x.closePath();
}
function star(x, cx, cy, r, color) {
  x.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 - Math.PI / 2, rr = i % 2 ? r * 0.38 : r;
    x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  x.closePath(); x.fillStyle = color; x.fill();
}
// El cáliz con la hostia y sus rayos (centro del cáliz en 0,0).
function emblem(x) {
  x.lineCap = 'round';
  x.strokeStyle = '#f3d27a'; x.lineWidth = 7;
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    x.beginPath(); x.moveTo(Math.cos(a) * 74, -40 + Math.sin(a) * 74); x.lineTo(Math.cos(a) * 112, -40 + Math.sin(a) * 112); x.stroke();
  }
  const cup = x.createLinearGradient(-90, 0, 90, 0);
  cup.addColorStop(0, '#c9921e'); cup.addColorStop(0.45, '#f8dd84'); cup.addColorStop(1, '#c08616');
  x.fillStyle = cup;
  x.beginPath(); x.moveTo(-88, 8); x.quadraticCurveTo(-84, 98, 0, 104); x.quadraticCurveTo(84, 98, 88, 8); x.closePath(); x.fill();
  x.fillRect(-11, 100, 22, 56);
  x.beginPath(); x.ellipse(0, 128, 24, 12, 0, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.moveTo(-74, 196); x.quadraticCurveTo(0, 138, 74, 196); x.closePath(); x.fill();
  x.fillStyle = '#fffaf0'; x.strokeStyle = GOLD; x.lineWidth = 5;
  x.beginPath(); x.arc(0, -40, 60, 0, Math.PI * 2); x.fill(); x.stroke();
  x.lineWidth = 8;
  x.beginPath(); x.moveTo(0, -72); x.lineTo(0, -8); x.moveTo(-24, -50); x.lineTo(24, -50); x.stroke();
}
function wrap(x, text, maxW) {
  const out = [];
  let cur = '';
  for (const w of text.split(/\s+/)) {
    const t = cur ? `${cur} ${w}` : w;
    if (cur && x.measureText(t).width > maxW) { out.push(cur); cur = w; } else cur = t;
  }
  if (cur) out.push(cur);
  return out;
}
const fmtLong = d => `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;

async function fontsReady() {
  if (!document.fonts?.load) return;
  const want = [`800 110px ${DISPLAY}`, `700 52px ${DISPLAY}`, `600 34px ${BODY}`, `800 34px ${BODY}`];
  await Promise.race([Promise.all(want.map(f => document.fonts.load(f).catch(() => null))), new Promise(r => setTimeout(r, 1500))]);
}

export function draw(canvas, d) {
  canvas.width = W; canvas.height = H;
  const x = canvas.getContext('2d');
  x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  // Papel y marcos
  const paper = x.createRadialGradient(W / 2, H * 0.42, 120, W / 2, H / 2, H * 0.78);
  paper.addColorStop(0, '#fffdf6'); paper.addColorStop(1, '#f9ecd0');
  x.fillStyle = paper; x.fillRect(0, 0, W, H);
  roundRect(x, 34, 34, W - 68, H - 68, 36); x.lineWidth = 16; x.strokeStyle = GOLD; x.stroke();
  roundRect(x, 62, 62, W - 124, H - 124, 24); x.lineWidth = 4; x.strokeStyle = GOLD_SOFT; x.stroke();
  for (const [cx, cy] of [[108, 108], [W - 108, 108], [108, H - 108], [W - 108, H - 108]]) star(x, cx, cy, 24, GOLD);
  // Emblema
  x.save(); x.translate(W / 2, 236); x.scale(0.8, 0.8); emblem(x); x.restore();
  // Títulos
  x.fillStyle = GRAPE; x.font = `800 112px ${DISPLAY}`;
  if ('letterSpacing' in x) x.letterSpacing = '10px';
  x.fillText('DIPLOMA', W / 2 + 5, 488);
  if ('letterSpacing' in x) x.letterSpacing = '0px';
  x.fillStyle = '#5a4a8a'; x.font = `700 40px ${BODY}`;
  x.fillText('de preparación para la Primera Comunión', W / 2, 546);
  x.strokeStyle = GOLD_SOFT; x.lineWidth = 3;
  x.beginPath(); x.moveTo(W / 2 - 300, 590); x.lineTo(W / 2 - 30, 590); x.moveTo(W / 2 + 30, 590); x.lineTo(W / 2 + 300, 590); x.stroke();
  star(x, W / 2, 590, 16, GOLD);
  // La parroquia
  x.fillStyle = INK; x.font = `600 32px ${BODY}`;
  x.fillText('La comunidad de la', W / 2, 652);
  x.fillStyle = RED; x.font = `800 54px ${DISPLAY}`;
  x.fillText(d.parish, W / 2, 716);
  x.fillStyle = '#6b6b80'; x.font = `600 28px ${BODY}`;
  x.fillText(d.place, W / 2, 760);
  x.fillStyle = INK; x.font = `600 34px ${BODY}`;
  x.fillText('entrega con alegría este diploma a', W / 2, 840);
  // El nombre, tan grande como quepa
  let size = 124;
  do { x.font = `800 ${size}px ${DISPLAY}`; size -= 4; } while (size > 60 && x.measureText(d.name).width > 900);
  x.fillStyle = INK; x.fillText(d.name, W / 2, 966);
  x.strokeStyle = GOLD; x.lineWidth = 4;
  x.beginPath(); x.moveTo(W / 2 - 420, 996); x.lineTo(W / 2 + 420, 996); x.stroke();
  // Lo que hizo
  x.fillStyle = '#3d3d55'; x.font = `600 36px ${BODY}`;
  wrap(x, d.body, 920).slice(0, 4).forEach((line, i) => x.fillText(line, W / 2, 1066 + i * 52));
  // Logros
  const pills = d.pills.filter(p => p.n > 0);
  const pw = 320, gap = 26, total = pills.length * pw + (pills.length - 1) * gap;
  pills.forEach((p, i) => {
    const l = W / 2 - total / 2 + i * (pw + gap);
    roundRect(x, l, 1272, pw, 124, 26); x.fillStyle = '#fff6dc'; x.fill(); x.lineWidth = 3; x.strokeStyle = GOLD_SOFT; x.stroke();
    x.fillStyle = GRAPE; x.font = `800 52px ${DISPLAY}`; x.fillText(String(p.n), l + pw / 2, 1332);
    x.fillStyle = '#5a4a8a'; x.font = `700 26px ${BODY}`; x.fillText(p.label, l + pw / 2, 1372);
  });
  // Versículo, fecha y firmas
  x.fillStyle = GRAPE; x.font = `800 36px ${BODY}`;
  x.fillText('«Yo soy el pan de vida»', W / 2, 1478);
  x.fillStyle = '#6b6b80'; x.font = `600 26px ${BODY}`;
  x.fillText('Juan 6, 35', W / 2, 1514);
  x.fillStyle = INK; x.font = `700 28px ${BODY}`;
  x.fillText(d.date, W / 2, 1566);
  x.strokeStyle = '#9a9ab0'; x.lineWidth = 2;
  for (const cx of [W / 2 - 290, W / 2 + 290]) { x.beginPath(); x.moveTo(cx - 170, 1626); x.lineTo(cx + 170, 1626); x.stroke(); }
  x.fillStyle = '#6b6b80'; x.font = `600 26px ${BODY}`;
  x.fillText('Catequista', W / 2 - 290, 1660);
  x.fillText('Párroco', W / 2 + 290, 1660);
  return canvas;
}

export async function mount(el) {
  const life = lifecycle();
  const sh = shell(el, { title: 'Mi diploma', onBack: () => back(), cls: 'fe dp' });
  const topics = arr(await loadData('catechism')).filter(c => c && c.id);
  if (life.dead) return { unmount() {} };
  const done = topics.filter(c => state.quizDone(`cat:${c.id}`));
  const left = topics.length - done.length;

  if (!topics.length || left > 0) {
    sh.fill(
      h('div', { class: 'ct-intro dp-lock' },
        h('div', { class: 'dp-lock__icon', 'aria-hidden': 'true' }, '📜'),
        h('h2', null, 'Tu diploma te espera'),
        h('p', null, left === 1 ? '¡Te falta un solo tema de «Mi camino»! Respóndelo bien y tu diploma estará listo.'
          : `Cuando termines los ${topics.length} temas de «Mi camino», aquí tendrás tu diploma con tu nombre. Te faltan ${left}.`)),
      progressMeter(topics.length ? (done.length / topics.length) * 100 : 0, 'var(--leaf)', `Temas terminados: ${done.length} de ${topics.length}`),
      button('Seguir mi camino', { kind: 'sun', block: true, icon: '👣', onClick: () => go('bible', { tab: 'catecismo' }) }));
    return { unmount() { life.end(); sh.root.remove(); } };
  }

  // Fecha: el día en que respondió bien el último tema (si se sabe); si no, hoy.
  const lastAt = Math.max(0, ...done.map(c => state.quizAt(`cat:${c.id}`) || 0));
  const when = lastAt ? new Date(lastAt) : new Date();
  const memo = arr(await import('../data/oraciones-extra.js').then(m => m.MEMORY_SET).catch(() => [])).filter(m => state.memorized(m.id)).length;
  const masses = Object.keys(state.massLog()).length;
  const group = txt(R.group().name).trim();
  let name = txt(state.flag('diploma:name') || state.get().kid).trim();

  const canvas = document.createElement('canvas');
  const img = h('img', { class: 'dp-img', alt: '' });
  const nameInput = h('input', { class: 'pq-input dp-name', type: 'text', maxlength: '28', autocomplete: 'off', value: name, 'aria-label': 'Mi nombre en el diploma', placeholder: 'Escribe tu nombre' });
  await fontsReady();
  if (life.dead) return { unmount() {} };

  function paint() {
    draw(canvas, {
      name: name || 'Mi nombre',
      parish: PARISH.name,
      place: `${group && group.length <= 28 ? `${group} · ` : ''}${PARISH.place} · El Tambo · Huancayo`,
      body: `por recorrer con mucho cariño los ${topics.length} temas de «Mi\u00a0camino», aprender a rezar y preparar su corazón para recibir a Jesús en la Eucaristía.`,
      pills: [{ n: topics.length, label: topics.length === 1 ? 'tema del camino' : 'temas del camino' }, { n: memo, label: memo === 1 ? 'oración de memoria' : 'oraciones de memoria' },
        { n: masses, label: masses === 1 ? 'Misa del domingo' : 'Misas del domingo' }],
      date: `Huancayo, ${fmtLong(when)}`,
    });
    img.src = canvas.toDataURL('image/png');
    img.alt = `Diploma de ${name || 'preparación'}: terminó el camino de preparación para la Primera Comunión en la ${PARISH.name}.`;
  }
  paint();

  const first = !state.flag('diploma:visto');
  let gains = [];
  if (first) { state.setFlag('diploma:visto', true); gains = grant(PRIZE); sfx('win'); life.later(() => celebrate(sh.page, ['📜', '🎉', '⭐', '🕊️']), 200); }

  sh.fill(
    h('div', { class: 'ct-intro dp-hello' }, h('h2', null, name ? `¡Felicitaciones, ${name}!` : '¡Felicitaciones!'),
      h('p', null, 'Recorriste todo el camino. Muéstrale tu diploma a tu familia y a tu catequista.'), rewardRow(gains)),
    h('figure', { class: 'dp-frame' }, img),
    h('div', { class: 'dp-namebox' },
      h('label', { class: 'pq-small', for: 'dp-name' }, '¿Tu nombre está bien escrito?'),
      (() => { nameInput.id = 'dp-name'; return nameInput; })(),
      button('Cambiar', { kind: 'ghost', small: true, icon: '✏️', onClick: () => {
        const v = nameInput.value.trim().slice(0, 28);
        if (!v) { nameInput.focus(); return; }
        name = v; state.setFlag('diploma:name', v); sfx('pop'); paint(); toast('¡Listo!', { icon: '📜' });
      } })),
    h('div', { class: 'ro-btns' },
      button('Compartir o guardar', { kind: 'sun', icon: '📤', onClick: async () => {
        sfx('tap');
        const r = await shareImage(img.src, 'diploma-palomita.png', `¡${name || 'Terminé'} recorrió todo el camino de preparación para la Primera Comunión! 🕊️ ${PARISH.name}`);
        if (r === 'downloaded') toast('Se guardó la imagen del diploma', { icon: '📥' });
      } }),
      button('Mi gran día', { kind: 'grape', small: true, icon: '🕊️', onClick: () => go('grandia') })),
    h('p', { class: 'fe-tip' }, deco('🖨️'), 'Si lo imprimen, tiene espacio para la firma del catequista y del párroco.'));
  return { unmount() { life.end(); sh.root.remove(); } };
}
