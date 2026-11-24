// «Mi ratito con Jesús»: oración guiada de unos 3 minutos con la vela encendida, y «Mi diario de gracias».
// Es oración personal en casa (no es adoración eucarística): al final invita a visitar a Jesús en el sagrario de la parroquia.
// El diario guarda solo en el teléfono los «gracias» del niño (con dibujos) y nunca pecados.
//   go('ratito')                      la oración guiada
//   go('ratito', { tab: 'diario' })   mi diario
import * as state from '../core/state.js';
import * as tts from '../core/tts.js';
import { keepAwake } from '../core/device.js';
import { h, clear, button, toast } from '../core/ui.js';
import { sfx } from '../core/audio.js';
import { back } from '../core/router.js';
import { arr, txt, deco, lifecycle, shell, tabBar, soon, celebrate } from './catequesis.js';

const TABS = [{ id: 'rezar', label: 'Mi ratito', icon: '🕯️' }, { id: 'diario', label: 'Mi diario', icon: '📔' }];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const voiceOn = () => tts.available() && state.setting('voice') !== false;

export async function mount(el, params = {}) {
  const life = lifecycle();
  const sh = shell(el, { title: 'Mi ratito con Jesús', onBack: () => back(), cls: 'fe rt' });
  let D = {}, O = {};
  try { [D, O] = await Promise.all([import('../data/ratito.js'), import('../data/oraciones-extra.js').catch(() => ({}))]); } catch { /* sin datos */ }
  const RT = D.RATITO;
  if (!RT) { sh.fill(soon()); return { unmount() { life.end(); sh.root.remove(); } }; }
  const tabs = tabBar(TABS, id => show(id), 'Mi ratito con Jesús');
  sh.root.insertBefore(tabs, sh.page);
  let tab = null, timer = 0;
  const thanks = new Set();
  const stopTimer = () => { clearInterval(timer); timer = 0; };
  function show(id) { stopTimer(); tts.stop(); tab = id; tabs.select(id); (id === 'diario' ? viewDiary : viewStart)(); }

  const flame = () => h('div', { class: 'rt-candle', 'aria-hidden': 'true' }, h('span', { class: 'rt-candle__flame' }), h('span', { class: 'rt-candle__body' }));

  function viewStart() {
    sh.fill(
      h('div', { class: 'rt-hero' }, flame(), h('h2', null, txt(RT.title)), arr(RT.intro ? [RT.intro].flat() : []).map(p => h('p', null, txt(p)))),
      h('p', { class: 'fe-tip' }, deco('🕯️'), 'Si en casa encienden una vela de verdad, que la encienda una persona mayor.'),
      button('Empezar mi ratito', { kind: 'sun', block: true, icon: '🙏', onClick: () => { keepAwake('oracion', true); step(0); } }));
  }

  function step(i) {
    stopTimer();
    const steps = arr(RT.steps);
    if (i >= steps.length) return finish();
    const st = steps[i];
    const secs = Math.max(10, Number(st.seconds) || 20);
    const bar = h('div', { class: 'rt-bar' }, h('i'));
    const extra = st.id === 'gracias' ? h('div', { class: 'rt-pick' }, arr(D.GRATITUDE).map(g => {
      const b = h('button', { type: 'button', class: `rt-chip${thanks.has(g.id) ? ' is-on' : ''}`, 'aria-pressed': String(thanks.has(g.id)), onclick: () => {
        if (thanks.has(g.id)) thanks.delete(g.id); else if (thanks.size < 3) thanks.add(g.id); else { toast('Elige hasta tres', { icon: '💛' }); return; }
        sfx('pop'); b.classList.toggle('is-on', thanks.has(g.id)); b.setAttribute('aria-pressed', String(thanks.has(g.id)));
      } }, h('span', { 'aria-hidden': 'true' }, g.emoji), h('span', null, g.label));
      return b;
    })) : st.id === 'pido' ? h('div', { class: 'rt-pick' }, arr(O.INTENTIONS).slice(0, 8).map(it => h('button', { type: 'button', class: 'rt-chip', onclick: e => {
      sfx('pop'); state.addIntention({ id: it.id, label: it.label, emoji: it.emoji, sick: !!it.sick }); e.currentTarget.classList.add('is-on');
    } }, h('span', { 'aria-hidden': 'true' }, it.emoji), h('span', null, it.label)))) : null;
    sh.fill(
      h('div', { class: `rt-step${st.id === 'silencio' ? ' is-silence' : ''}` },
        flame(),
        h('p', { class: 'eyebrow' }, `${i + 1} de ${steps.length}`),
        h('h2', null, deco(st.emoji || '🙏'), txt(st.title)),
        h('p', { class: 'rt-text' }, txt(st.text)),
        extra, bar,
        h('div', { class: 'ro-btns' },
          button(i + 1 < steps.length ? 'Seguir' : 'Terminar', { kind: 'sun', small: true, icon: '▶️', onClick: () => step(i + 1) }))));
    if (voiceOn() && st.id !== 'silencio') tts.speak([txt(st.title), txt(st.text)]);
    if (st.id === 'silencio') sfx('bell');
    let left = secs;
    const fill = bar.firstChild;
    fill.style.transition = `width ${secs}s linear`;
    requestAnimationFrame(() => { fill.style.width = '100%'; });
    timer = setInterval(() => { left--; if (left <= 0) { stopTimer(); if (st.id === 'silencio') sfx('bell'); } }, 1000);
  }

  function finish() {
    stopTimer(); tts.stop(); keepAwake('oracion', false);
    state.addJournal({ thanks: [...thanks] });
    const { firstToday } = state.prayed('ratito');
    if (firstToday) { state.addStat('fe', 5); state.addXp(4); }
    sfx('sparkle');
    celebrate(sh.page, ['🕯️', '💛', '✨']);
    const sag = RT.sagrario;
    sh.fill(
      h('div', { class: 'ct-intro ro-end' }, h('div', { class: 'ro-end__icon', 'aria-hidden': 'true' }, '💛'),
        h('h2', null, '¡Qué lindo ratito con Jesús!'), RT.closing ? h('p', null, txt(RT.closing)) : null, firstToday ? h('p', { class: 'home-prayer__note' }, '+5 Fe 🕯️') : null),
      sag ? h('section', { class: 'fe-note fe-note--after' }, deco('⛪'), h('div', null, h('b', null, txt(sag.title)), arr(sag.paragraphs).map(p => h('p', null, txt(p))))) : null,
      h('div', { class: 'ro-btns' },
        button('Ver mi diario', { kind: 'grape', small: true, icon: '📔', onClick: () => show('diario') }),
        button('Volver', { kind: 'sun', icon: '🏠', onClick: () => back() })));
  }

  function viewDiary() {
    const list = state.journal().slice().reverse();
    const byId = new Map(arr(D.GRATITUDE).map(g => [g.id, g]));
    const ints = state.intentions();
    sh.fill(
      h('div', { class: 'ct-intro' }, h('h2', null, 'Mi diario de gracias'), h('p', null, txt(D.JOURNAL_PROMPTS?.gracias) || '¿Por qué le das gracias a Dios hoy?')),
      ints.length ? h('section', { class: 'rt-ints' }, h('h3', null, deco('🙏'), 'Estoy rezando por'), h('ul', null, ints.map(x => h('li', null, deco(x.emoji || '🙏'), x.label,
        h('button', { type: 'button', class: 'pq-mini', 'aria-label': `Quitar ${x.label}`, onclick: () => { sfx('tap'); state.removeIntention(x.at); viewDiary(); } }, '✖'))))) : null,
      list.length ? h('ol', { class: 'rt-diary' }, list.map(e => {
        const [, m, d] = e.day.split('-').map(Number);
        return h('li', null, h('span', { class: 'rt-diary__day' }, h('b', null, String(d)), h('span', null, MONTHS[m - 1])),
          h('span', { class: 'rt-diary__thanks' }, arr(e.thanks).map(id => byId.get(id)).filter(Boolean).map(g => h('span', { title: g.label }, g.emoji)), arr(e.thanks).length ? null : h('span', { class: 'rt-muted' }, 'Rezaste un ratito')));
      })) : h('p', { class: 'pq-small' }, 'Cuando hagas tu ratito con Jesús, aquí aparecerán tus «gracias» de cada día.'),
      button('Hacer mi ratito ahora', { kind: 'sun', block: true, icon: '🕯️', onClick: () => show('rezar') }));
  }

  show(params.tab === 'diario' ? 'diario' : 'rezar');
  return { unmount() { stopTimer(); keepAwake('oracion', false); life.end(); sh.root.remove(); } };
}
