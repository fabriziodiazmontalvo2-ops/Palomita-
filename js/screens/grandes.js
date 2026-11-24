// «Para grandes»: lo que necesitan los papás, los padrinos y el catequista (detrás de la clave de grandes).
//   Avance   informe del niño y «Enviar al catequista»
//   Sellos   oraciones que ya sabe de memoria (un grande pone el sello verde) y Misas del domingo
//   Familia  fechas especiales, hermanos (perfiles) y el Rincón de papás y padrinos
//   Cuidado  copias de seguridad, pasar la app, privacidad y la clave
import * as state from '../core/state.js';
import * as profiles from '../core/profiles.js';
import * as backup from '../core/backup.js';
import * as report from '../core/report.js';
import * as device from '../core/device.js';
import { grownGate, lock, hasPin, choosePin, clearPin } from '../core/grown.js';
import { h, clear, button, modal, toast, confirmDialog } from '../core/ui.js';
import { sfx } from '../core/audio.js';
import { back, go } from '../core/router.js';
import { deco, lifecycle, shell, tabBar } from './catequesis.js';

const TABS = [
  { id: 'avance', label: 'Avance', icon: '📊' },
  { id: 'sellos', label: 'Sellos', icon: '✅' },
  { id: 'familia', label: 'Familia', icon: '👪' },
  { id: 'cuidado', label: 'Cuidado', icon: '🛡️' },
];
const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const COLOR_NAME = { morado: 'morado', blanco: 'blanco', verde: 'verde', rojo: 'rojo', rosado: 'rosado' };
const fmtDay = iso => { const [y, m, d] = iso.split('-').map(Number); const dt = new Date(y, m - 1, d); return `${DAYS[dt.getDay()]} ${d} de ${MONTHS[m - 1]}`; };
const fmtMs = ms => { const d = new Date(ms); return `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`; };
async function safe(p, key, fb) { try { const m = await p; return m[key] ?? fb; } catch { return fb; } }

export async function mount(el, params = {}) {
  if (!(await grownGate({ reason: 'Esta parte es para papás, padrinos y catequistas.' }))) { setTimeout(() => back(), 0); return {}; }
  const life = lifecycle();
  const kidName = () => state.get().kid || 'tu hijo o hija';
  const sh = shell(el, { title: 'Para grandes', onBack: () => back(), cls: 'gr' });
  let tab = null;
  const tabs = tabBar(TABS, id => { if (id !== tab) { sfx('page'); show(id); } }, 'Secciones para grandes');
  sh.root.insertBefore(tabs, sh.page);

  const [MEMORY_SET, PRAYERS, EXTRA, CORNER, PRIVACY] = await Promise.all([
    safe(import('../data/oraciones-extra.js'), 'MEMORY_SET', null),
    safe(import('../data/prayers.js'), 'PRAYERS', []),
    safe(import('../data/oraciones-extra.js'), 'PRAYERS_EXTRA', []),
    safe(import('../data/papas.js'), 'PARENTS_CORNER', null),
    safe(import('../data/papas.js'), 'PRIVACY_NOTE', ''),
  ]);
  const memoList = (MEMORY_SET || [
    { id: 'senal-de-la-cruz', type: 'prayer' }, { id: 'padre-nuestro', type: 'prayer' }, { id: 'ave-maria', type: 'prayer' },
    { id: 'gloria', type: 'prayer' }, { id: 'credo', type: 'prayer' }, { id: 'yo-confieso', type: 'prayer' },
    { id: 'acto-de-contricion', type: 'prayer' }, { id: 'senor-no-soy-digno', type: 'prayer' },
  ]).map(m => {
    const p = [...PRAYERS, ...EXTRA].find(x => x.id === m.id);
    return { ...m, title: m.title || p?.title || m.id, emoji: m.emoji || p?.emoji || '🙏' };
  });

  function show(id) {
    tab = id;
    tabs.select(id);
    sh.fill(...({ avance: viewAvance, sellos: viewSellos, familia: viewFamilia, cuidado: viewCuidado }[id]()));
  }
  const refresh = () => { const y = sh.scroll.scrollTop; show(tab); sh.scroll.scrollTop = y; };
  const card = (title, icon, ...kids) => h('section', { class: 'gr-card' }, h('h2', { class: 'gr-card__h' }, deco(icon), title), kids);
  const note = text => h('p', { class: 'gr-note' }, text);

  // ───────── Avance ─────────
  function viewAvance() {
    const box = h('div', { class: 'gr-stack' }, h('p', { class: 'gr-loading' }, 'Preparando el informe…'));
    report.build().then(r => {
      if (life.dead) return;
      clear(box);
      const chips = h('div', { class: 'gr-chips' },
        h('span', { class: 'chip' }, `📖 ${r.topicsDone}/${r.topics.length} temas`),
        h('span', { class: 'chip' }, `🎬 ${r.lessonsSeen}/${r.lessons.length} lecciones`),
        h('span', { class: 'chip' }, `🙏 ${r.memoKid} de memoria`),
        h('span', { class: 'chip' }, `⛪ ${r.masses.length} Misas`),
        h('span', { class: 'chip' }, `🌸 ${r.deeds} buenas obras`),
        h('span', { class: 'chip' }, `📅 ${r.activeDays}/14 días`));
      const bars = h('div', { class: 'gr-bars', role: 'img', 'aria-label': `Uso de la app en los últimos 14 días: ${r.activeDays} días con actividad` },
        r.activity.map(a => { const b = h('span', { class: 'gr-bar', title: `${fmtDay(a.day)}: ${a.points ? 'usó la app' : 'sin uso'}` }); b.style.setProperty('--v', String(Math.min(1, a.points / 8))); return b; }));
      const units = [['creo', 'Creo'], ['celebro', 'Celebro'], ['vivo', 'Vivo'], ['rezo', 'Rezo']];
      const topicList = units.map(([u, label]) => {
        const list = r.topics.filter(t => t.unit === u);
        if (!list.length) return null;
        return h('div', { class: 'gr-unit' }, h('h3', null, label),
          h('ul', { class: 'gr-list' }, list.map(t => h('li', { class: t.done ? 'is-done' : '' },
            h('span', { 'aria-hidden': 'true' }, t.done ? '✅' : '⬜'), h('span', null, t.title),
            t.at ? h('small', null, fmtMs(t.at)) : null))));
      });
      box.append(
        card(`Avance de ${kidName()}`, '📊', chips,
          h('p', { class: 'gr-sub' }, 'Últimos 14 días'), bars,
          r.lastTopic ? note(`El último tema que terminó: ${r.lastTopic.title}.`) : null,
          button('Enviar al catequista', { kind: 'leaf', block: true, icon: '📤', onClick: async () => {
            const res = await device.shareText(report.text(r), `Avance de ${r.kid || 'mi hijo'} en Palomita`);
            if (res === 'copied') toast('Copiamos el informe: pégalo en WhatsApp', { icon: '📋', ms: 3200 });
            else if (!res) toast('No se pudo compartir', { icon: 'ℹ️' });
          } }),
          note('Se envía solo el primer nombre y un resumen. Lo privado (el examen de conciencia, las intenciones y el diario) nunca se incluye.')),
        card('Mi camino, tema por tema', '🗺️', ...topicList.filter(Boolean),
          note('Las fechas aparecen desde la versión 1.3; los temas terminados antes se ven sin fecha.')),
        card('Lecciones', '🎬', h('ul', { class: 'gr-list' }, r.lessons.map(l => h('li', { class: l.seen ? 'is-done' : '' },
          h('span', { 'aria-hidden': 'true' }, l.star ? '⭐' : l.seen ? '✅' : '⬜'), h('span', null, l.title))))),
        card('Práctica', '🎯', h('ul', { class: 'gr-list' },
          h('li', { class: r.confesionPractice ? 'is-done' : '' }, h('span', { 'aria-hidden': 'true' }, r.confesionPractice ? '✅' : '⬜'), h('span', null, 'Practicó la Confesión')),
          h('li', { class: r.misaPractice ? 'is-done' : '' }, h('span', { 'aria-hidden': 'true' }, r.misaPractice ? '✅' : '⬜'), h('span', null, 'Practicó las respuestas de la Misa')),
          h('li', { class: r.misaQuiz ? 'is-done' : '' }, h('span', { 'aria-hidden': 'true' }, r.misaQuiz ? '✅' : '⬜'), h('span', null, 'Respondió las preguntas de la Misa')))));
    });
    return [box];
  }

  // ───────── Sellos: de memoria y Misas ─────────
  function viewSellos() {
    const memo = card('Lo sé de memoria', '🙏',
      note(`Cuando ${kidName()} les recite una oración sin mirar, toquen «Me la recitó» para ponerle el sello verde. El niño también gana su propio sello jugando en «Mis oraciones».`),
      h('ul', { class: 'gr-rows' }, memoList.map(m => {
        const st = state.memorized(m.id);
        return h('li', { class: 'gr-row' },
          h('span', { class: 'gr-row__icon', 'aria-hidden': 'true' }, m.emoji),
          h('span', { class: 'gr-row__text' }, h('b', null, m.title),
            h('span', null, st?.by === 'grande' ? `✔ La recitó a un grande · ${fmtMs(st.at)}` : st ? `Sello del juego · ${fmtMs(st.at)}` : 'Todavía no')),
          st?.by === 'grande'
            ? h('button', { type: 'button', class: 'gr-mini', onclick: () => { sfx('tap'); state.setMemorized(m.id, null); refresh(); } }, 'Quitar')
            : h('button', { type: 'button', class: 'gr-mini gr-mini--ok', onclick: () => { sfx('sticker'); state.setMemorized(m.id, 'grande'); toast('¡Sello verde!', { icon: '✅' }); refresh(); } }, 'Me la recitó'));
      })));
    const log = Object.entries(state.massLog()).sort((a, b) => b[0].localeCompare(a[0]));
    const masses = card('Misas del domingo', '⛪',
      note('El niño anota cuando fue a Misa. Si ustedes lo acompañaron, confírmenlo: así el catequista sabe que un grande lo vio.'),
      log.length ? h('ul', { class: 'gr-rows' }, log.slice(0, 20).map(([day, v]) => h('li', { class: 'gr-row' },
        h('span', { class: 'gr-row__icon', 'aria-hidden': 'true' }, v.ok ? '✅' : '⛪'),
        h('span', { class: 'gr-row__text' }, h('b', null, fmtDay(day)), h('span', null, [v.color ? `El padre se vistió de ${COLOR_NAME[v.color] || v.color}` : '', v.ok ? 'confirmada por un grande' : ''].filter(Boolean).join(' · ') || 'Anotada por el niño')),
        v.ok ? h('button', { type: 'button', class: 'gr-mini', onclick: async () => { if (await confirmDialog('¿Quitamos esta Misa del pasaporte?', { yes: 'Sí, quitar', no: 'No' })) { state.unlogMass(day); refresh(); } } }, 'Quitar')
          : h('button', { type: 'button', class: 'gr-mini gr-mini--ok', onclick: () => { sfx('sticker'); state.logMass(day, { ok: true }); refresh(); } }, 'Confirmar'))))
        : note('Todavía no hay Misas anotadas.'),
      addSunday());
    return [memo, masses];
  }
  function addSunday() {
    const input = h('input', { type: 'date', class: 'gr-input', 'aria-label': 'Fecha del domingo' });
    const d = new Date(); d.setDate(d.getDate() - d.getDay());
    input.value = state.todayKey(d);
    input.max = state.todayKey();
    return h('div', { class: 'gr-inline' }, input, button('Anotar este domingo', { kind: 'ghost', small: true, icon: '➕', onClick: () => {
      const v = input.value;
      const [y, m, dd] = v.split('-').map(Number);
      const dt = new Date(y, m - 1, dd);
      if (!v || dt.getDay() !== 0) { toast('Elige un domingo', { icon: '📅' }); return; }
      state.logMass(v, { ok: true });
      toast('Misa anotada y confirmada', { icon: '✅' });
      refresh();
    } }));
  }

  // ───────── Familia ─────────
  function viewFamilia() {
    const cumple = h('input', { type: 'date', class: 'gr-input', value: state.date('cumple'), 'aria-label': 'Cumpleaños' });
    const bautismo = h('input', { type: 'date', class: 'gr-input', value: state.date('bautismo'), 'aria-label': 'Día del Bautismo' });
    const dates = card('Fechas especiales', '🎂',
      note(`La palomita celebra con ${kidName()} estas fechas (solo se guardan en este teléfono).`),
      h('label', { class: 'gr-label' }, 'Cumpleaños', cumple),
      h('label', { class: 'gr-label' }, 'Día de su Bautismo (si lo saben)', bautismo),
      button('Guardar fechas', { kind: 'leaf', small: true, icon: '💾', onClick: () => {
        state.setDate('cumple', cumple.value); state.setDate('bautismo', bautismo.value);
        toast('Fechas guardadas', { icon: '🎂' });
      } }),
      note('La fecha de la Primera Comunión, la Primera Confesión y el retiro se anotan en «Mi parroquia», para que lleguen los avisos.'),
      button('Ir a las fechas de la parroquia', { kind: 'ghost', small: true, icon: '⛪', onClick: () => go('parroquia', { tab: 'catequesis' }) }));

    const list = profiles.list();
    const kids = card('Hermanos en este teléfono', '👧',
      note('Cada niño tiene su palomita, su avance, sus figuritas y sus fotos. Al abrir la app se elige quién juega.'),
      h('ul', { class: 'gr-rows' }, list.map(p => h('li', { class: 'gr-row' },
        h('span', { class: 'gr-row__icon', 'aria-hidden': 'true' }, p.id === profiles.activeId() ? '🕊️' : '🪺'),
        h('span', { class: 'gr-row__text' }, h('b', null, p.kid || (p.created ? 'Niño nuevo' : 'Primer niño')), h('span', null, `${p.name} · nivel ${p.level}${p.id === profiles.activeId() ? ' · ahora' : ''}`)),
        p.id === profiles.activeId() ? null : h('button', { type: 'button', class: 'gr-mini', onclick: () => { sfx('tap'); profiles.switchTo(p.id); } }, 'Cambiar'),
        p.id === 'p1' || p.id === profiles.activeId() ? null : h('button', { type: 'button', class: 'gr-mini gr-mini--danger', onclick: async () => {
          if (await confirmDialog(`Se borrará la palomita de ${p.kid || 'este niño'} con todo su avance, figuritas y fotos. ¿Seguros?`, { title: '¿Borrar este perfil?', icon: '🗑️', yes: 'Sí, borrar', no: 'No' })) { profiles.remove(p.id); refresh(); }
        } }, 'Borrar')))),
      profiles.canAdd() ? button('Agregar otro niño', { kind: 'sun', small: true, icon: '➕', onClick: async () => {
        if (!(await confirmDialog('Se creará una palomita nueva para otro niño. La app se abrirá con su bienvenida.', { title: '¿Agregar otro niño?', icon: '🪺', yes: 'Sí, agregar', no: 'No' }))) return;
        const id = profiles.add();
        if (id) profiles.switchTo(id);
      } }) : note(`Se pueden tener hasta ${profiles.MAX_PROFILES} niños.`));

    const corner = CORNER && Array.isArray(CORNER.sections) ? card(CORNER.title || 'Rincón de papás y padrinos', '🤝',
      CORNER.intro ? h('p', { class: 'gr-p' }, CORNER.intro) : null,
      CORNER.sections.map((s, i) => h('details', { class: 'gr-acc', open: i === 0 ? true : null },
        h('summary', null, deco(s.emoji || '•'), s.title),
        (s.paragraphs || []).map(t => h('p', { class: 'gr-p' }, t)),
        Array.isArray(s.tips) && s.tips.length ? h('ul', { class: 'gr-tips' }, s.tips.map(t => h('li', null, t))) : null)))
      : null;
    return [dates, kids, corner].filter(Boolean);
  }

  // ───────── Cuidado: copias, compartir, privacidad, clave ─────────
  function viewCuidado() {
    const withPhotos = h('input', { type: 'checkbox', id: 'gr-photos' });
    const save = card('Copia de seguridad', '💾',
      note('Guarden todo el avance en un archivo (en Drive, en WhatsApp o en una memoria) para pasarlo a otro teléfono o por si algo se borra.'),
      h('label', { class: 'gr-check', for: 'gr-photos' }, withPhotos, h('span', null, 'Incluir las fotos de la palomita (el archivo pesa más)')),
      button('Guardar una copia', { kind: 'leaf', block: true, icon: '💾', onClick: async () => {
        const data = JSON.stringify(backup.collect({ photos: withPhotos.checked }));
        const res = await device.saveFile(backup.fileName(), 'application/json', data);
        if (res === 'saved' || res === 'downloaded') toast('Copia guardada', { icon: '✅' });
        else {
          // Sin descargas (por ejemplo, dentro de un visor): se ofrece copiar el texto.
          const ok = await device.copyText(data);
          toast(ok ? 'Copiamos la copia como texto: pégala en un mensaje para guardarla' : 'No se pudo guardar la copia', { icon: ok ? '📋' : 'ℹ️', ms: 3600 });
        }
      } }),
      button('Recuperar desde una copia', { kind: 'ghost', block: true, icon: '📂', onClick: restoreFromFile }),
      prevCard());
    const share = card('Pasar Palomita a otra familia', '📲',
      device.canShareApp()
        ? [note('Envía la app a otro teléfono sin usar datos (Quick Share, Bluetooth) o por WhatsApp. El otro teléfono pedirá permiso para instalar apps de origen desconocido.'),
          button('Pasar la app', { kind: 'sky', block: true, icon: '📲', onClick: async () => {
            toast('Preparando la app…', { icon: '⏳' });
            const ok = await device.shareApp();
            if (!ok) toast('No se pudo preparar la app', { icon: 'ℹ️' });
          } })]
        : note('En la app de Android aquí aparece un botón para pasarla a otro teléfono. En la web, compartan el enlace de la página.'));
    const privacy = card('Qué guarda Palomita y qué no', '🔒',
      h('p', { class: 'gr-p' }, PRIVACY || 'Todo se guarda solo en este teléfono: el avance, las figuritas, las fotos y los avisos. No hay cuentas, ni publicidad, ni compras. El micrófono solo se usa mientras el niño está con la palomita y no se graba ni se envía. Lo que se marca en el examen de conciencia no se guarda. Android puede incluir los datos de la app en la copia de seguridad de Google del teléfono, si la familia la tiene activada; se puede desactivar en los ajustes de copia de seguridad del teléfono.'));
    const pin = card('Clave de grandes', '🔐',
      note(hasPin() ? 'Hay una clave de 4 números. Se pide para entrar aquí, anotar fechas, empezar de nuevo y encender el micrófono por primera vez.' : 'No hay clave: se usa una pregunta de multiplicar. Les recomendamos crear una clave.'),
      button(hasPin() ? 'Cambiar la clave' : 'Crear una clave', { kind: 'sun', small: true, icon: '🔐', onClick: async () => { if (await choosePin()) refresh(); } }),
      hasPin() ? button('Quitar la clave', { kind: 'ghost', small: true, onClick: async () => { if (await confirmDialog('¿Quitamos la clave? Se volverá a usar la pregunta de multiplicar.', { yes: 'Sí, quitar', no: 'No' })) { clearPin(); refresh(); } } }) : null);
    return [save, share, privacy, pin];
  }
  function prevCard() {
    const p = state.prevInfo();
    if (!p) return null;
    return h('div', { class: 'gr-prev' },
      note(`También hay una copia automática anterior: ${p.name}, nivel ${p.level}${p.at ? `, del ${fmtMs(p.at)}` : ''}.`),
      button('Volver a la copia anterior', { kind: 'ghost', small: true, icon: '⏪', onClick: async () => {
        if (!(await confirmDialog('El avance de ahora se cambiará por la copia anterior (y lo de ahora quedará como copia anterior). ¿Seguimos?', { title: '¿Volver a la copia anterior?', icon: '⏪', yes: 'Sí, volver', no: 'No' }))) return;
        if (state.restorePrev()) location.reload(); else toast('No se pudo recuperar', { icon: 'ℹ️' });
      } }));
  }
  async function restoreFromFile() {
    const text = await device.openFile();
    if (!text) return;
    const info = backup.inspect(text);
    if (!info.ok) { modal({ title: 'No se pudo recuperar', icon: '📂', body: info.error, buttons: [{ label: 'Entendido', kind: 'sun' }] }); return; }
    const who = info.kids.map(k => `${k.kid || 'un niño'} (${k.name}, nivel ${k.level})`).join(', ');
    const ok = await confirmDialog(`La copia${info.at ? ` del ${fmtMs(info.at)}` : ''} trae: ${who}. Reemplazará el avance de este teléfono. ¿Seguimos?`, { title: '¿Recuperar esta copia?', icon: '📂', yes: 'Sí, recuperar', no: 'No' });
    if (!ok) return;
    if (backup.apply(info.data)) { toast('¡Listo! Abriendo Palomita…', { icon: '✅' }); setTimeout(() => location.reload(), 900); }
    else toast('No se pudo recuperar (¿falta espacio?)', { icon: 'ℹ️' });
  }

  show(TABS.some(t => t.id === params.tab) ? params.tab : 'avance');
  return { unmount() { life.end(); lock(); sh.root.remove(); } };
}
