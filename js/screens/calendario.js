// «Calendario de la fe»: el tiempo de la Iglesia que vivimos hoy y su color, la corona de Adviento, la novena de
// Navidad, una buena obra para cada día de Cuaresma, las próximas fiestas (con las del Perú y las de Huancayo) y
// los seis tiempos del año. Las fechas las calcula js/core/liturgy.js; los textos están en js/data/fiestas.js.
//   go('calendario')                          hoy
//   go('calendario', { tab: 'fiestas' })      las próximas fiestas
//   go('calendario', { feast: 'id' })         una fiesta
//   go('calendario', { date: 'AAAA-MM-DD' })  ver otro día (para que la catequista lo pruebe)
import * as state from '../core/state.js';
import { h, button } from '../core/ui.js';
import { sfx } from '../core/audio.js';
import { back } from '../core/router.js';
import { missionButton } from '../core/missions.js';
import { G } from '../core/genero.js';
import { arr, txt, deco, lifecycle, shell, tabBar, soon, speakBtn, miniScene } from './catequesis.js';

const TABS = [{ id: 'hoy', label: 'Hoy', icon: '🗓️' }, { id: 'fiestas', label: 'Fiestas', icon: '🎉' }, { id: 'tiempos', label: 'El año', icon: '🌈' }];
const ORDER = ['adviento', 'navidad', 'ordinario', 'cuaresma', 'triduo', 'pascua'];
const COLOR_NAME = { morado: 'morado', blanco: 'blanco', verde: 'verde', rojo: 'rojo', rosado: 'rosado' };
const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const fmt = d => `${DAYS[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
const inDays = n => (n === 1 ? 'mañana' : n < 7 ? `en ${n} días` : n < 14 ? 'en una semana' : n < 60 ? `en ${Math.round(n / 7)} semanas` : `en ${Math.round(n / 30)} meses`);
const dayIndex = d => Math.floor((d - new Date(d.getFullYear(), 0, 1)) / 86400000);

function parseDay(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

export async function mount(el, params = {}) {
  const life = lifecycle();
  const sh = shell(el, { title: 'Calendario de la fe', onBack: () => goBack(), cls: 'fe cl' });
  let L = null, F = null;
  try { [L, F] = await Promise.all([import('../core/liturgy.js'), import('../data/fiestas.js')]); } catch { /* sin datos */ }
  if (life.dead) return { unmount() {} };
  if (!L || !F) { sh.fill(soon()); return { unmount() { life.end(); sh.root.remove(); } }; }
  const today = parseDay(params.date) || new Date();
  today.setHours(0, 0, 0, 0);
  const tabs = tabBar(TABS, id => { sfx('page'); show(id); }, 'Calendario de la fe');
  sh.root.insertBefore(tabs, sh.page);
  let tab = 'hoy', feastOpen = null, lentTip = dayIndex(today);

  function goBack() {
    if (feastOpen) { sfx('page'); feastOpen = null; show(tab); return; }
    back();
  }
  const season = L.seasonOf(today);
  const S = F.SEASONS?.[season.id] || {};
  const tint = hex => `color-mix(in srgb, ${hex} 22%, white)`;

  function show(id) {
    tab = id; feastOpen = null;
    tabs.select(id);
    sh.setTitle('Calendario de la fe');
    sh.fill(...({ hoy: viewHoy, fiestas: viewFiestas, tiempos: viewTiempos }[id] || viewHoy)());
  }

  // ───────── Hoy ─────────
  function viewHoy() {
    const hex = L.colorHex(season.color);
    const special = season.special ? F.SPECIAL_DAYS?.[season.special] : null;
    const feasts = L.feastsOn(today).filter(f => !special || special.feast !== f.id);
    const advent = L.adventWeek(today);
    const novena = L.novenaDay(today);
    const hero = h('section', { class: 'cl-hero' },
      h('div', { class: 'cl-hero__top' },
        h('span', { class: 'cl-hero__emoji', 'aria-hidden': 'true' }, S.emoji || '⛪'),
        h('div', null, h('p', { class: 'eyebrow' }, `Hoy, ${fmt(today)}`), h('h2', null, txt(S.title) || season.label),
          season.weekLabel ? h('p', { class: 'cl-hero__week' }, season.weekLabel) : null),
        speakBtn(() => [txt(S.title), season.weekLabel || '', txt(S.text)], { compact: true, label: 'Escuchar' })),
      h('p', { class: 'cl-color' }, h('i', { class: 'cl-dot', style: { background: hex }, 'aria-hidden': 'true' }),
        `El sacerdote se viste de ${COLOR_NAME[season.color] || season.color}`),
      h('p', { class: 'cl-hero__text' }, txt(S.text)),
      S.kidLine ? h('p', { class: 'cl-dove' }, deco('🕊️'), txt(S.kidLine)) : null);
    hero.style.setProperty('--cl-c', hex);
    hero.style.setProperty('--cl-bg', tint(hex));

    const blocks = [hero];
    if (special) blocks.push(h('section', { class: 'cl-card cl-card--special' },
      h('h3', null, deco(special.emoji || '🌟'), `Hoy es ${txt(special.title)}`),
      h('p', null, txt(special.text)),
      special.feast ? button('Leer más', { kind: 'ghost', small: true, icon: '📖', onClick: () => openFeast(special.feast) }) : null));
    for (const f of feasts) blocks.push(h('section', { class: 'cl-card cl-card--feast' },
      h('h3', null, deco(f.emoji || '🎉'), `¡Hoy es fiesta: ${txt(f.title)}!`),
      h('p', null, txt(arr(f.paragraphs)[0])),
      button('Leer más', { kind: 'ghost', small: true, icon: '📖', onClick: () => openFeast(f.id) })));
    if (advent) blocks.push(wreath(advent));
    if (novena) blocks.push(novenaCard(novena));
    if (season.id === 'cuaresma') blocks.push(lentCard());
    if (S.tip) blocks.push(h('section', { class: 'fe-note' }, deco('👪'), h('div', null, h('b', null, 'Para vivirlo en familia'), h('p', null, txt(S.tip)))));
    const next = L.nextFeasts(today, 3);
    if (next.length) blocks.push(h('section', { class: 'cl-next' }, h('h3', null, deco('🎉'), 'Las próximas fiestas'),
      h('ul', { class: 'cl-list' }, next.map(feastRow)),
      button('Ver todas las fiestas', { kind: 'sky', small: true, icon: '🎉', onClick: () => { sfx('page'); show('fiestas'); } })));
    return blocks;
  }

  // Corona de Adviento: tres velas moradas y una rosada (la tercera), encendidas según la semana.
  function wreath(week) {
    const W = arr(F.ADVENT_WEEKS);
    const cur = W.find(w => w.week === week) || W[0];
    const lit = L.adventCandles(today);
    return h('section', { class: 'cl-card cl-advent' },
      h('h3', null, deco('🕯️'), `Corona de Adviento · semana ${week} de 4`),
      h('div', { class: 'cl-wreath', role: 'img', 'aria-label': `${lit === 1 ? 'Una vela encendida' : `${lit} velas encendidas`} de cuatro` },
        W.map((w, i) => h('span', { class: `cl-candle cl-candle--${w.candle}${i < lit ? ' is-lit' : ''}` }, h('i')))),
      cur ? [h('p', { class: 'cl-advent__title' }, txt(cur.title)), h('p', null, txt(cur.text)), cur.kidLine ? h('p', { class: 'cl-dove' }, deco('🕊️'), txt(cur.kidLine)) : null] : null);
  }

  function novenaCard(n) {
    const N = arr(F.NOVENA);
    const d = N.find(x => x.day === n);
    return h('section', { class: 'cl-card cl-novena' },
      h('h3', null, deco('⭐'), `Novena de Navidad · día ${n} de 9`),
      h('div', { class: 'cl-crib', role: 'img', 'aria-label': `Nacimiento: ${n} de 9 figuras` }, N.map(x => h('span', { class: x.day <= n ? 'is-on' : '' }, x.emoji))),
      d ? [h('p', { class: 'cl-advent__title' }, txt(d.figure)), h('p', null, txt(d.text))] : null,
      h('p', { class: 'pq-small' }, G('En la capilla de tu {palomita|palomito}, el nacimiento también se arma figura por figura.')));
  }

  function lentCard() {
    const T = arr(F.LENT_TIPS);
    if (!T.length) return null;
    const box = h('section', { class: 'cl-card cl-lent' });
    const paint = () => {
      const tip = txt(T[((lentTip % T.length) + T.length) % T.length]);
      box.replaceChildren(
        h('h3', null, deco('🌵'), 'Mi buena obra de hoy'),
        h('p', { class: 'cl-lent__tip' }, tip),
        h('div', { class: 'ro-btns' },
          missionButton(tip, 'Cuaresma'),
          button('Otra idea', { kind: 'ghost', small: true, icon: '🔄', onClick: () => { sfx('tap'); lentTip++; paint(); } })));
    };
    paint();
    return box;
  }

  // ───────── Fiestas ─────────
  function feastRow({ feast: f, date, days }) {
    return h('li', null, h('button', { type: 'button', class: 'cl-feast', dataset: { feast: f.id }, onclick: () => openFeast(f.id) },
      h('span', { class: 'cl-feast__emoji', 'aria-hidden': 'true' }, f.emoji || '🎉'),
      h('span', { class: 'cl-feast__body' },
        h('b', null, txt(f.title)),
        h('span', null, `${fmt(date)} · ${inDays(days)}`),
        f.local || f.peru ? h('span', { class: 'cl-tags' }, f.local ? h('span', { class: 'cl-tag cl-tag--local' }, 'Huancayo') : null, f.peru ? h('span', { class: 'cl-tag' }, 'Perú') : null) : null),
      h('span', { class: 'bb-chev', 'aria-hidden': 'true' })));
  }
  function viewFiestas() {
    const list = L.nextFeasts(today, 40);
    const now = L.feastsOn(today);
    return [
      h('div', { class: 'ct-intro' }, h('h2', null, 'Las fiestas que vienen'), h('p', null, 'La Iglesia celebra a Jesús, a María y a los santos durante todo el año. ¡Estas son las fiestas que vienen!')),
      now.length ? h('section', { class: 'cl-next' }, h('h3', null, deco('🎉'), 'Hoy'), h('ul', { class: 'cl-list' }, now.map(f => feastRow({ feast: f, date: today, days: 0 })))) : null,
      list.length ? h('ul', { class: 'cl-list' }, list.map(feastRow)) : h('p', { class: 'pq-small' }, 'No hay fiestas en la lista.'),
      h('p', { class: 'bb-footnote' }, 'Las fechas son las del calendario de la Iglesia en el Perú. Cada pueblo y cada hermandad organiza sus fiestas populares en los días cercanos.'),
    ];
  }
  function openFeast(id) {
    const f = arr(F.FEASTS).find(x => x.id === id);
    if (!f) return;
    sfx('page');
    feastOpen = f;
    const next = L.feastsOn(today).includes(f) ? { date: today, days: 0 } : L.nextFeasts(today, 60).find(x => x.feast === f);
    const hex = L.colorHex(f.color);
    const actors = arr(f.emojis).slice(0, 4).map((e, k) => ({ e, x: [28, 72, 50, 84][k], y: [66, 64, 28, 30][k], s: k < 2 ? 1.15 : 0.85, anim: k >= 2 ? 'float' : undefined }));
    sh.setTitle(txt(f.title).length > 26 ? 'Fiesta' : txt(f.title));
    sh.fill(h('article', { class: 'cl-detail' },
      miniScene(f.bg, actors, 'cl-detail__art'),
      h('p', { class: 'eyebrow' }, next ? (next.days === 0 ? `Hoy, ${fmt(next.date)}` : `${fmt(next.date)} · ${inDays(next.days)}`) : 'Fiesta'),
      h('h2', null, deco(f.emoji || '🎉'), txt(f.title)),
      h('p', { class: 'cl-color' }, h('i', { class: 'cl-dot', style: { background: hex }, 'aria-hidden': 'true' }), `Color de la Misa: ${COLOR_NAME[f.color] || f.color}`),
      f.local || f.peru ? h('p', { class: 'cl-tags' }, f.local ? h('span', { class: 'cl-tag cl-tag--local' }, 'Muy querida en Huancayo') : null, f.peru ? h('span', { class: 'cl-tag' }, 'Del Perú') : null) : null,
      h('div', { class: 'ct-tools' }, speakBtn(() => [txt(f.title), ...arr(f.paragraphs).map(txt), f.prayer ? `Recemos: ${txt(f.prayer)}` : ''], { label: 'Escuchar' })),
      h('div', { class: 'bb-text' }, arr(f.paragraphs).map(p => h('p', null, txt(p)))),
      f.prayer ? h('section', { class: 'cl-prayer' }, h('h3', null, deco('🙏'), 'Recemos'), h('p', null, txt(f.prayer)),
        button('Amén', { kind: 'grape', small: true, icon: '🙏', onClick: e => {
          const { firstToday } = state.prayed('fiesta');
          if (firstToday) state.addStat('fe', 2);
          sfx('bell');
          e?.currentTarget?.setAttribute?.('disabled', '');
        } })) : null,
      button('Volver a las fiestas', { kind: 'ghost', small: true, icon: '↩️', onClick: () => goBack() })));
  }

  // ───────── El año de la Iglesia ─────────
  function viewTiempos() {
    return [
      h('div', { class: 'ct-intro' }, h('h2', null, 'El año de la Iglesia'),
        h('p', null, 'La Iglesia tiene su propio año, que empieza en Adviento. Cada tiempo tiene su color: míralo en la ropa del sacerdote y en el altar.')),
      h('div', { class: 'cl-ring', 'aria-hidden': 'true' }, ORDER.map(id => {
        const s = F.SEASONS?.[id];
        const c = L.colorHex(s?.color);
        const b = h('span', { class: `cl-ring__seg${id === season.id ? ' is-now' : ''}` }, s?.emoji || '•');
        b.style.setProperty('--seg', c);
        return b;
      })),
      h('div', { class: 'fe-list' }, ORDER.map(id => {
        const s = F.SEASONS?.[id];
        if (!s) return null;
        const now = id === season.id;
        const d = h('details', { class: `fe-acc cl-season${now ? ' is-now' : ''}`, open: now ? true : null },
          h('summary', null, h('i', { class: 'cl-dot', style: { background: L.colorHex(s.color) }, 'aria-hidden': 'true' }), deco(s.emoji || '⛪'),
            h('span', null, txt(s.title)), now ? h('span', { class: 'cl-now' }, 'Ahora') : null),
          h('div', { class: 'fe-acc__body' },
            h('p', null, txt(s.text)),
            h('p', { class: 'cl-color' }, `Color: ${COLOR_NAME[s.color] || s.color}`),
            s.tip ? h('p', { class: 'fe-tip' }, deco('👪'), txt(s.tip)) : null,
            h('div', { class: 'fe-acc__tools' }, speakBtn(() => [txt(s.title), txt(s.text)], { label: 'Escuchar' }))));
        return d;
      })),
    ];
  }

  const startFeast = params.feast ? arr(F.FEASTS).find(x => x.id === params.feast) : null;
  show(TABS.some(t => t.id === params.tab) ? params.tab : 'hoy');
  if (startFeast) openFeast(startFeast.id);
  return {
    back() { if (feastOpen) { goBack(); return true; } return false; },
    unmount() { life.end(); sh.root.remove(); },
  };
}
