// Mi parroquia: Parroquia Santo Cura de Ars (Pío Pata). Datos, horarios de Misa, fechas de catequesis y avisos.
//   go('parroquia')                      pestaña «Mi parroquia»
//   go('parroquia', { tab: 'misas' })    'inicio' | 'misas' | 'catequesis' | 'avisos'
//
// Los horarios y las fechas los anota un grande (papá, mamá o catequista) detrás de una pregunta para grandes.
// Se guardan solo en este teléfono (js/core/reminders.js). Todos los textos se insertan como texto.
import { h, clear, button, modal, toast, confirmDialog } from '../core/ui.js';
import { sfx } from '../core/audio.js';
import { back } from '../core/router.js';
import * as tts from '../core/tts.js';
import * as R from '../core/reminders.js';
import { PARISH, ABOUT, SOCIAL, DAYS } from '../data/parroquia.js';
import { txt, deco, smooth, lifecycle, shell, tabBar, speakBtn } from './catequesis.js';

const TABS = [
  { id: 'inicio', label: 'Mi parroquia', icon: '⛪' },
  { id: 'misas', label: 'Misas', icon: '🔔' },
  { id: 'catequesis', label: 'Catequesis', icon: '📖' },
  { id: 'avisos', label: 'Avisos', icon: '⏰' },
];
const LEADS = [
  { id: 'hora', icon: '⏱️', label: '1 hora antes' },
  { id: 'dia', icon: '🌙', label: 'El día anterior (6 p. m.)' },
  { id: 'ambos', icon: '✨', label: 'Las dos veces' },
];

const dayDiff = (a, b) => Math.round((new Date(a.getFullYear(), a.getMonth(), a.getDate()) - new Date(b.getFullYear(), b.getMonth(), b.getDate())) / 86400000);
const hhmm = d => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
function countdown(start, now = new Date()) {
  const n = dayDiff(start, now);
  if (n <= 0) return start <= now ? '¡Ya empezó!' : '¡Es hoy!';
  if (n === 1) return '¡Es mañana!';
  return `Faltan ${n} días`;
}

// Foto con respaldo dibujado si el archivo no está.
function photo(p, cls) {
  const box = h('div', { class: `pq-photo ${cls}` });
  const img = h('img', { src: p.src, alt: p.alt, loading: 'lazy', decoding: 'async', draggable: 'false' });
  img.addEventListener('error', () => { img.remove(); box.classList.add('is-missing'); box.append(h('span', { class: 'pq-photo__ph', 'aria-hidden': 'true' }, '⛪')); });
  box.append(img);
  return box;
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* sigue */ }
  try {
    const t = h('textarea', { style: { position: 'fixed', opacity: '0', left: '-9999px' } });
    t.value = text;
    document.body.append(t);
    t.select();
    const ok = document.execCommand('copy');
    t.remove();
    return ok;
  } catch { return false; }
}

export async function mount(el, params = {}) {
  const life = lifecycle();
  const sh = shell(el, { title: 'Mi parroquia', onBack: () => back(), cls: 'pq' });
  let tab = null;
  let grown = false;             // ¿ya pasó la pregunta para grandes en esta visita?

  const tabs = tabBar(TABS, id => pick(id), 'Secciones de mi parroquia');
  sh.root.insertBefore(tabs, sh.page);

  function pick(id) {
    if (tab === id) { sh.scroll.scrollTo({ top: 0, behavior: smooth() }); return; }
    sfx('page');
    show(id);
  }
  function show(id, { keepScroll = false } = {}) {
    tts.stop();
    const y = sh.scroll.scrollTop;
    tab = id;
    params.tab = id;
    tabs.select(id);
    sh.scroll.setAttribute('role', 'tabpanel');
    sh.scroll.setAttribute('aria-labelledby', `ct-tab-${id}`);
    sh.fill({ inicio: viewInicio, misas: viewMisas, catequesis: viewCatequesis, avisos: viewAvisos }[id]());
    if (keepScroll) sh.scroll.scrollTop = y;
  }
  const refresh = () => show(tab, { keepScroll: true });
  // Después de marcar una Misa o anotar una fecha: si los avisos están apagados o falta el permiso del teléfono,
  // se dice (y se pide el permiso) en vez de prometer un aviso que no va a llegar.
  async function confirmAviso(okText, icon) {
    if (!R.avisos().on) { toast('Los avisos están apagados. Enciéndelos en la pestaña «Avisos».', { icon: '🔕' }); return; }
    if (R.nativeAvailable() && R.permissionState() !== 'granted') {
      const ok = await R.requestPermission();
      if (life.dead) return;
      if (!ok) { toast('Para avisarte, permite las notificaciones de Palomita en los ajustes del teléfono.', { icon: 'ℹ️' }); return; }
    }
    toast(okText, { icon });
  }
  const goTab = (id, label, icon) => button(label, { kind: 'sun', block: true, icon, sound: 'pop', onClick: () => { show(id); tabs.button(id)?.focus({ preventScroll: true }); } });

  // ── Pregunta para grandes (para anotar horarios y fechas) ──
  function grownGate() {
    if (grown) return Promise.resolve(true);
    return new Promise(resolve => {
      let a, b;
      const q = h('p', { class: 'pq-gate__q' });
      const input = h('input', { class: 'pq-input pq-gate__in', type: 'text', inputmode: 'numeric', pattern: '[0-9]*', maxlength: '4', autocomplete: 'off', 'aria-label': 'Respuesta' });
      const msg = h('p', { class: 'pq-gate__msg', role: 'status', 'aria-live': 'polite' });
      const ask = () => { a = 12 + Math.floor(Math.random() * 8); b = 3 + Math.floor(Math.random() * 7); q.textContent = `¿Cuánto es ${a} × ${b}?`; input.value = ''; };
      ask();
      let ok = false;
      const m = modal({
        title: 'Solo para grandes', icon: '🧑‍🏫', className: 'pq-modal',
        body: [h('p', { class: 'pq-gate__lead' }, 'Los horarios los anota papá, mamá o el catequista.'), q, input, msg],
        buttons: [
          { label: 'Cancelar', kind: 'ghost', small: true },
          { label: 'Entrar', kind: 'sun', small: true, onClick: () => {
            if (Number(input.value.trim()) === a * b) { ok = true; grown = true; return true; }
            sfx('wrong'); msg.textContent = 'Esa no es. Prueba con esta otra.'; ask(); input.focus(); return false;
          } },
        ],
      });
      input.addEventListener('keydown', e => { if (e.key === 'Enter') m.el.querySelector('.btn--sun')?.click(); });
      setTimeout(() => input.focus({ preventScroll: true }), 60);
      m.closed.then(() => resolve(ok));
    });
  }
  const grownButton = () => grown ? null : h('button', { type: 'button', class: 'pq-grown', onclick: async () => { sfx('tap'); if (await grownGate()) refresh(); } },
    deco('🧑‍🏫'), h('span', null, h('b', null, 'Soy grande'), h('span', null, 'Agregar o cambiar')), h('span', { class: 'pq-grown__lock', 'aria-hidden': 'true' }, '🔒'));

  // ── Tarjeta del próximo encuentro ──
  function nextCard() {
    const e = R.upcoming(14)[0];
    if (!e) return null;
    return h('div', { class: `pq-next pq-next--${e.kind}` },
      h('span', { class: 'pq-next__icon', 'aria-hidden': 'true' }, e.icon),
      h('div', { class: 'pq-next__body' },
        h('p', { class: 'pq-next__eyebrow' }, e.kind === 'misa' ? 'Tu próxima Misa' : 'Tu próxima catequesis'),
        h('p', { class: 'pq-next__when' }, `${R.fmtDate(e.start)} · ${R.fmtTime(hhmm(e.start))}`),
        e.note ? h('p', { class: 'pq-next__note' }, e.note) : null),
      h('span', { class: 'pq-next__count' }, countdown(e.start)));
  }

  // ── (1) Mi parroquia ──
  function viewInicio() {
    const office = PARISH.office.map(o => h('li', null, h('b', null, o.days), o.hours.map(x => h('span', null, x))));
    const callBtn = typeof window.PalomitaAndroid?.openDial === 'function'
      ? button('Llamar', { kind: 'leaf', small: true, icon: '📞', onClick: () => { if (!R.dial()) location.href = `tel:${PARISH.phoneDial}`; } })
      : h('a', { class: 'btn btn--leaf btn--sm', href: `tel:${PARISH.phoneDial}`, onclick: () => sfx('tap') }, deco('📞'), 'Llamar');
    const mapBtn = typeof window.PalomitaAndroid?.openMap === 'function'
      ? button('Cómo llegar', { kind: 'sky', small: true, icon: '🗺️', onClick: () => R.openMap() })
      : h('a', { class: 'btn btn--sky btn--sm', href: R.mapsUrl(), target: '_blank', rel: 'noopener', onclick: () => sfx('tap') }, deco('🗺️'), 'Cómo llegar');
    const person = p => h('div', { class: 'pq-person' },
      h('span', { class: 'pq-person__av', 'aria-hidden': 'true' }, h('i', { class: 'pq-cross' })),
      h('p', { class: 'pq-person__role' }, p.role),
      h('p', { class: 'pq-person__name' }, p.name));
    return [
      h('section', { class: 'pq-hero' },
        photo(PARISH.photos.fachada, 'pq-hero__img'),
        h('div', { class: 'pq-hero__shade', 'aria-hidden': 'true' }),
        h('div', { class: 'pq-hero__text' },
          h('span', { class: 'pq-pill' }, deco('📍'), `${PARISH.place} · El Tambo`),
          h('h2', null, PARISH.name))),
      nextCard(),
      h('div', { class: 'ct-tools' }, speakBtn(() => [PARISH.name, ...ABOUT.parish.text])),
      h('section', { class: 'pq-card pq-card--about' },
        h('h3', { class: 'pq-card__h' }, deco('🏡'), ABOUT.parish.title),
        h('div', { class: 'ct-text pq-text' }, ABOUT.parish.text.map(t => h('p', null, t)))),
      h('section', { class: 'pq-people', 'aria-label': 'Nuestros pastores' }, person(PARISH.pastor), person(PARISH.deacon)),
      h('figure', { class: 'pq-altar' },
        photo(PARISH.photos.altar, 'pq-altar__img'),
        h('figcaption', null,
          h('span', { class: 'pq-altar__glow', 'aria-hidden': 'true' }, '✨'),
          h('q', null, PARISH.motto.text),
          h('cite', null, PARISH.motto.ref),
          h('span', { class: 'pq-altar__note' }, 'Jesús resucitado nos recibe en el altar de nuestra parroquia.'))),
      h('section', { class: 'pq-card' },
        h('h3', { class: 'pq-card__h' }, deco('🕘'), 'Oficina parroquial'),
        h('ul', { class: 'pq-hours' }, office),
        h('p', { class: 'pq-small' }, 'Ahí te inscriben en la catequesis y te dan los horarios.')),
      h('section', { class: 'pq-card' },
        h('h3', { class: 'pq-card__h' }, deco('📞'), 'Teléfono'),
        h('p', { class: 'pq-phone' }, PARISH.phone),
        h('div', { class: 'pq-row' }, callBtn,
          button('Copiar', { kind: 'ghost', small: true, icon: '📋', onClick: async () => { toast(await copyText(PARISH.phoneDial) ? '¡Número copiado!' : 'Mantén presionado el número para copiarlo', { icon: '📋' }); } }))),
      h('section', { class: 'pq-card' },
        h('h3', { class: 'pq-card__h' }, deco('📍'), 'Dirección'),
        h('p', { class: 'pq-address' }, PARISH.address),
        h('div', { class: 'pq-row' }, mapBtn)),
      SOCIAL.length ? h('section', { class: 'pq-card' },
        h('h3', { class: 'pq-card__h' }, deco('💬'), 'Síguenos en'),
        h('div', { class: 'pq-row' }, SOCIAL.map(s => h('a', { class: 'btn btn--ghost btn--sm', href: s.url, target: '_blank', rel: 'noopener' }, deco(s.icon || '🔗'), txt(s.label))))) : null,
      h('section', { class: 'pq-card pq-card--saint' },
        h('div', { class: 'pq-saint__badge', 'aria-hidden': 'true' }, '😇'),
        h('h3', { class: 'pq-card__h' }, ABOUT.patron.title),
        h('div', { class: 'ct-text pq-text' }, ABOUT.patron.text.map(t => h('p', null, t))),
        h('div', { class: 'ct-tools' }, speakBtn(() => [ABOUT.patron.title, ...ABOUT.patron.text], { label: 'Escuchar su historia' }))),
      goTab('misas', 'Ver los horarios de Misa', '🔔'),
    ];
  }

  // ── (2) Horarios de Misa ──
  function viewMisas() {
    const list = R.masses();
    const days = [...new Set(list.map(m => m.day))];
    const rows = days.map(d => h('section', { class: 'pq-day' },
      h('h3', { class: 'pq-day__h' }, d === 0 ? deco('🌞') : null, DAYS[d]),
      h('ul', { class: 'pq-masses' }, list.filter(m => m.day === d).map(m => h('li', { class: `pq-mass${m.remind ? ' is-on' : ''}` },
        h('span', { class: 'pq-mass__main' },
          h('span', { class: 'pq-mass__time' }, R.fmtTime(m.time)),
          h('span', { class: 'pq-mass__label' }, m.label || 'Santa Misa')),
        grown ? h('span', { class: 'pq-mass__tools' },
          h('button', { type: 'button', class: 'pq-mini', 'aria-label': `Cambiar la Misa del ${DAYS[m.day]} a las ${R.fmtTime(m.time)}`, onclick: () => { sfx('tap'); massForm(m); } }, '✏️'),
          h('button', { type: 'button', class: 'pq-mini', 'aria-label': `Borrar la Misa del ${DAYS[m.day]} a las ${R.fmtTime(m.time)}`, onclick: async () => {
            sfx('tap');
            if (await confirmDialog(`¿Borramos la Misa del ${DAYS[m.day].toLowerCase()} a las ${R.fmtTime(m.time)}?`, { yes: 'Sí, borrar', no: 'No' })) { R.removeMass(m.id); refresh(); }
          } }, '🗑️')) : null,
        h('button', { type: 'button', class: 'pq-bell', 'aria-pressed': String(m.remind), 'aria-label': m.remind ? 'Ya te avisamos de esta Misa. Toca para no avisar.' : 'Avísame de esta Misa',
          onclick: () => { const on = !m.remind; sfx(on ? 'bell' : 'tap'); R.setRemind(m.id, on); refresh(); if (on) confirmAviso('¡Te avisaremos de esta Misa!', '🔔'); } },
        h('span', { 'aria-hidden': 'true' }, m.remind ? '🔔' : '🔕'), h('span', null, m.remind ? 'Me avisa' : 'Avísame')))))));
    return [
      h('div', { class: 'pq-intro' },
        h('span', { class: 'pq-intro__art', 'aria-hidden': 'true' }, '⛪'),
        h('div', null, h('h2', null, 'Horarios de Misa'), h('p', null, 'La Misa es el encuentro más bonito con Jesús. Toca 🔔 en la Misa a la que vas y te avisamos.'))),
      list.length ? rows : h('div', { class: 'pq-empty' },
        h('span', { class: 'pq-empty__icon', 'aria-hidden': 'true' }, '🕊️'),
        h('h3', null, 'Pronto pondremos los horarios'),
        h('p', null, 'Pregunta en la oficina parroquial: lunes a viernes de 9:00 a. m. a 1:00 p. m. y de 3:00 p. m. a 6:00 p. m.; sábados de 9:00 a. m. a 1:00 p. m.'),
        h('p', { class: 'pq-small' }, `Teléfono: ${PARISH.phone}`)),
      grown ? button('Agregar una Misa', { kind: 'leaf', block: true, icon: '➕', onClick: () => massForm(null) }) : grownButton(),
    ];
  }

  function massForm(m) {
    const day = h('select', { class: 'pq-input', 'aria-label': 'Día' }, DAYS.map((d, i) => h('option', { value: String(i) }, d)));
    day.value = String(m ? m.day : 0);
    const time = h('input', { class: 'pq-input', type: 'time', value: m ? m.time : '09:00', 'aria-label': 'Hora', required: true });
    const label = h('input', { class: 'pq-input', type: 'text', maxlength: '40', placeholder: 'Misa de niños, Misa de familias…', value: m ? m.label : '', autocomplete: 'off', 'aria-label': 'Nombre (opcional)' });
    const msg = h('p', { class: 'pq-gate__msg', role: 'status' });
    modal({
      title: m ? 'Cambiar la Misa' : 'Nueva Misa', icon: '⛪', className: 'pq-modal',
      body: h('div', { class: 'pq-form' }, field('Día', day), field('Hora', time), field('Nombre (opcional)', label), msg),
      buttons: [
        { label: 'Cancelar', kind: 'ghost', small: true },
        { label: 'Guardar', kind: 'leaf', small: true, onClick: () => {
          const v = { day: Number(day.value), time: time.value, label: label.value.trim() };
          const ok = m ? R.updateMass(m.id, v) : R.addMass(v);
          if (!ok) { msg.textContent = 'Revisa la hora, por favor.'; sfx('wrong'); return false; }
          toast(m ? 'Misa actualizada' : '¡Misa agregada!', { icon: '⛪' });
          refresh();
          return true;
        } },
      ],
    });
  }
  const field = (label, input) => h('label', { class: 'pq-field' }, h('span', null, label), input);

  // ── (3) Mi catequesis ──
  function viewCatequesis() {
    const all = R.classes();
    const today = R.isoDate(new Date());
    const future = all.filter(c => c.date && c.date >= today);
    const weekly = all.filter(c => !c.date);
    const past = all.filter(c => c.date && c.date < today);
    const next = R.upcoming(60).find(e => e.kind === 'catequesis');
    const row = c => {
      const d = c.date ? R.parseDate(c.date) : null;
      return h('li', { class: `pq-class${c.date && c.date < today ? ' is-past' : ''}` },
        h('span', { class: 'pq-class__cal', 'aria-hidden': 'true' },
          d ? [h('b', null, String(d.getDate())), h('span', null, R.fmtDate(d, { weekday: false }).split(' de ')[1].slice(0, 3))] : [h('b', null, '↻'), h('span', null, 'cada')]),
        h('div', { class: 'pq-class__body' },
          h('p', { class: 'pq-class__when' }, d ? `${DAYS[d.getDay()]} · ${R.fmtTime(c.time)}` : `Todos los ${DAYS[c.weekly].toLowerCase()}${c.weekly === 0 || c.weekly === 6 ? 's' : ''} · ${R.fmtTime(c.time)}`),
          c.note ? h('p', { class: 'pq-class__note' }, c.note) : null),
        grown ? h('span', { class: 'pq-mass__tools' },
          h('button', { type: 'button', class: 'pq-mini', 'aria-label': 'Cambiar esta fecha', onclick: () => { sfx('tap'); classForm(c); } }, '✏️'),
          h('button', { type: 'button', class: 'pq-mini', 'aria-label': 'Borrar esta fecha', onclick: async () => {
            sfx('tap');
            if (await confirmDialog('¿Borramos esta fecha de catequesis?', { yes: 'Sí, borrar', no: 'No' })) { R.removeClass(c.id); refresh(); }
          } }, '🗑️')) : null);
    };
    return [
      h('div', { class: 'pq-intro pq-intro--cat' },
        h('span', { class: 'pq-intro__art', 'aria-hidden': 'true' }, '📖'),
        h('div', null, h('h2', null, 'Mi catequesis'), h('p', null, 'Tu catequista te dirá los días. Un grande los anota aquí y la palomita te recuerda.'))),
      next ? h('div', { class: 'pq-countdown' },
        h('p', { class: 'pq-countdown__eyebrow' }, 'Tu próxima catequesis'),
        h('p', { class: 'pq-countdown__big' }, countdown(next.start)),
        h('p', { class: 'pq-countdown__when' }, `${R.fmtDate(next.start)} · ${R.fmtTime(hhmm(next.start))}`),
        next.note ? h('p', { class: 'pq-countdown__note' }, next.note) : null) : null,
      weekly.length ? h('section', { class: 'pq-day' }, h('h3', { class: 'pq-day__h' }, deco('↻'), 'Cada semana'), h('ul', { class: 'pq-classes' }, weekly.map(row))) : null,
      future.length ? h('section', { class: 'pq-day' }, h('h3', { class: 'pq-day__h' }, deco('🗓️'), 'Próximas fechas'), h('ul', { class: 'pq-classes' }, future.map(row))) : null,
      grown && past.length ? h('section', { class: 'pq-day' }, h('h3', { class: 'pq-day__h' }, deco('✔️'), 'Ya pasaron'), h('ul', { class: 'pq-classes' }, past.map(row))) : null,
      !weekly.length && !future.length ? h('div', { class: 'pq-empty' },
        h('span', { class: 'pq-empty__icon', 'aria-hidden': 'true' }, '🗓️'),
        h('h3', null, 'Todavía no hay fechas'),
        h('p', null, 'Pide a tu catequista o a un grande que las anote aquí.')) : null,
      grown ? button('Agregar una fecha', { kind: 'leaf', block: true, icon: '➕', onClick: () => classForm(null) }) : grownButton(),
      h('div', { class: 'pq-tip' }, deco('🎒'), h('p', null, 'Para la catequesis lleva tu cuaderno, tu lápiz y muchas ganas de conocer a Jesús.')),
    ];
  }

  function classForm(c) {
    let mode = c ? (c.date ? 'dia' : 'semana') : 'dia';
    const date = h('input', { class: 'pq-input', type: 'date', value: c?.date || R.isoDate(new Date()), 'aria-label': 'Fecha' });
    const wday = h('select', { class: 'pq-input', 'aria-label': 'Día de la semana' }, DAYS.map((d, i) => h('option', { value: String(i) }, d)));
    wday.value = String(c?.weekly ?? 6);
    const time = h('input', { class: 'pq-input', type: 'time', value: c ? c.time : '15:00', 'aria-label': 'Hora' });
    const note = h('input', { class: 'pq-input', type: 'text', maxlength: '80', placeholder: 'Tema, salón o qué llevar (opcional)', value: c?.note || '', autocomplete: 'off', 'aria-label': 'Nota (opcional)' });
    const msg = h('p', { class: 'pq-gate__msg', role: 'status' });
    const fDate = field('Fecha', date), fWeek = field('Día', wday);
    const seg = h('div', { class: 'pq-seg', role: 'radiogroup', 'aria-label': '¿Un día o cada semana?' });
    const paint = () => {
      fDate.hidden = mode !== 'dia'; fWeek.hidden = mode !== 'semana';
      for (const b of seg.children) b.setAttribute('aria-checked', String(b.dataset.v === mode));
    };
    for (const [v, label] of [['dia', 'Un día'], ['semana', 'Cada semana']]) {
      seg.append(h('button', { type: 'button', role: 'radio', class: 'pq-seg__b', dataset: { v }, onclick: () => { sfx('tap'); mode = v; paint(); } }, label));
    }
    paint();
    modal({
      title: c ? 'Cambiar la fecha' : 'Nueva fecha de catequesis', icon: '📖', className: 'pq-modal',
      body: h('div', { class: 'pq-form' }, seg, fDate, fWeek, field('Hora', time), field('Nota (opcional)', note), msg),
      buttons: [
        { label: 'Cancelar', kind: 'ghost', small: true },
        { label: 'Guardar', kind: 'leaf', small: true, onClick: () => {
          const v = { date: mode === 'dia' ? date.value : null, weekly: mode === 'semana' ? Number(wday.value) : null, time: time.value, note: note.value.trim() };
          const ok = c ? R.updateClass(c.id, v) : R.addClass(v);
          if (!ok) { msg.textContent = 'Revisa la fecha y la hora, por favor.'; sfx('wrong'); return false; }
          refresh();
          confirmAviso(c ? 'Fecha actualizada. Te avisaremos.' : '¡Fecha agregada! Te avisaremos.', '📖');
          return true;
        } },
      ],
    });
  }

  // ── (4) Avisos ──
  function viewAvisos() {
    const a = R.avisos();
    const native = R.nativeAvailable();
    const perm = R.permissionState();
    const sw = h('input', { type: 'checkbox', id: 'pq-on', class: 'set-switch__input' });
    sw.checked = a.on;
    sw.addEventListener('change', async () => {
      R.setAvisos({ on: sw.checked });
      if (sw.checked) { sfx('pop'); if (native && R.permissionState() !== 'granted') await R.requestPermission(); }
      refresh();
    });
    const list = R.upcoming(14);
    return [
      h('div', { class: 'pq-intro pq-intro--avisos' },
        h('span', { class: 'pq-intro__art', 'aria-hidden': 'true' }, '⏰'),
        h('div', null, h('h2', null, 'Avisos'), h('p', null, 'La palomita te recuerda cuándo hay Misa y cuándo tienes catequesis.'))),
      h('label', { class: 'pq-card pq-switch', for: 'pq-on' },
        h('span', { class: 'pq-switch__icon', 'aria-hidden': 'true' }, a.on ? '🔔' : '🔕'),
        h('span', { class: 'pq-switch__text' }, h('b', null, 'Avisarme'), h('span', null, a.on ? 'Los avisos están encendidos' : 'Los avisos están apagados')),
        h('span', { class: 'set-switch' }, sw, h('span', { class: 'set-switch__track', 'aria-hidden': 'true' }))),
      a.on ? h('section', { class: 'pq-card' },
        h('h3', { class: 'pq-card__h' }, deco('⏱️'), '¿Cuándo te aviso?'),
        h('div', { class: 'pq-leads', role: 'radiogroup', 'aria-label': '¿Cuándo te aviso?' }, LEADS.map(l => h('button', {
          type: 'button', role: 'radio', class: 'pq-lead', 'aria-checked': String(a.lead === l.id),
          onclick: () => { sfx('tap'); R.setAvisos({ lead: l.id }); refresh(); } }, deco(l.icon), h('span', null, l.label))))) : null,
      native && a.on && perm !== 'granted' ? h('div', { class: 'pq-perm' },
        h('p', null, deco('📱'), 'Para que los avisos lleguen aunque Palomita esté cerrada, el teléfono necesita tu permiso.'),
        button('Permitir avisos', { kind: 'sun', small: true, icon: '✅', onClick: async () => { const ok = await R.requestPermission(); toast(ok ? '¡Listo! Te avisaremos.' : 'Puedes darlo después en los ajustes del teléfono.', { icon: ok ? '🔔' : 'ℹ️' }); refresh(); } })) : null,
      !native ? h('p', { class: 'pq-small pq-note' }, deco('ℹ️'), ' En la app de Android los avisos llegan como notificaciones del teléfono. Aquí los verás cada vez que abras Palomita.') : null,
      h('section', { class: 'pq-card' },
        h('h3', { class: 'pq-card__h' }, deco('🗓️'), 'Próximos días'),
        list.length ? h('ul', { class: 'pq-agenda' }, list.slice(0, 10).map(e => h('li', { class: `pq-agenda__i pq-agenda__i--${e.kind}` },
          h('span', { class: 'pq-agenda__icon', 'aria-hidden': 'true' }, e.icon),
          h('span', { class: 'pq-agenda__what' }, h('b', null, e.title), e.note ? h('span', null, e.note) : null),
          h('span', { class: 'pq-agenda__when' }, h('b', null, countdown(e.start)), h('span', null, `${R.fmtDate(e.start)} · ${R.fmtTime(hhmm(e.start))}`)))))
          : h('p', { class: 'pq-small' }, 'No hay nada anotado para los próximos días. Marca una Misa con 🔔 o anota tu catequesis.')),
    ];
  }

  // Al volver del cuadro de permiso del teléfono (o de sus ajustes), la pestaña Avisos se repinta con lo que hay ahora.
  life.on(document, 'visibilitychange', () => { if (!document.hidden && tab === 'avisos') refresh(); });
  life.add(R.onChange(() => { if (tab === 'avisos' && !life.dead) refresh(); }));

  R.sync();
  show(TABS.some(t => t.id === params.tab) ? params.tab : 'inicio');
  return { unmount() { life.end(); sh.root.remove(); } };
}
