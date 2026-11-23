// «Mis figuritas»: álbum coleccionable de la parroquia Santo Cura de Ars (como el álbum de las mascotas virtuales).
//
//   go('figuritas')                          álbum (página 1, o la de la última figurita nueva)
//   go('figuritas', { tab: 'sobres' })       abrir sobres
//   go('figuritas', { tab: 'repetidas' })    cambiar repetidas
//   go('figuritas', { page: 3 })             una página del álbum (1–6)
//
// Los sobres se ganan con el regalo diario, los cofres de los juegos y las lecciones (ver js/core/stickers.js),
// y también se pueden comprar con semillas. La primera vez que se abre el álbum regala un sobre de bienvenida.
import * as state from '../core/state.js';
import * as tts from '../core/tts.js';
import * as album from '../core/stickers.js';
import { h, clear, button, modal, toast, reduceMotion } from '../core/ui.js';
import { sfx } from '../core/audio.js';
import { back } from '../core/router.js';
import { showChest } from '../core/rewards.js';
import { lifecycle, shell, tabBar, speakBtn, celebrate, progressMeter, deco } from './catequesis.js';
import { PAGES, STICKERS, RARITY, PACK_PRICE, TRADE_COST, PAGE_PRIZE } from '../data/stickers.js';
import { stickerURL } from '../art/stickers-art.js';

const TABS = [
  { id: 'album', label: 'Álbum', icon: '📒' },
  { id: 'sobres', label: 'Sobres', icon: '✉️' },
  { id: 'repetidas', label: 'Repetidas', icon: '🔁' },
];
const RARE_ICON = { comun: '', especial: '💎', brillante: '🌟' };
const pageList = id => STICKERS.filter(s => s.page === id);

export async function mount(el, params = {}) {
  const life = lifecycle();
  const sh = shell(el, { title: 'Mis figuritas', onBack: () => back(), cls: 'fg' });
  const tabs = tabBar(TABS, id => show(id), 'Partes del álbum');
  tabs.classList.add('fg-tabs');
  sh.root.insertBefore(tabs, sh.page);
  const packBadge = h('span', { class: 'fg-tabs__badge', hidden: true });
  tabs.button('sobres').append(packBadge);

  // Sobre de bienvenida (una sola vez).
  if (album.grantPackOnce('welcome', 1, '¡Bienvenido a tu álbum!')) setTimeout(() => toast('¡Te regalamos tu primer sobre de figuritas!', { icon: '✉️', ms: 3200 }), 400);

  let tab = TABS.some(t => t.id === params.tab) ? params.tab : 'album';
  let pageIdx = Number.isInteger(params.page) ? Math.max(0, Math.min(PAGES.length - 1, params.page - 1)) : firstUnseenPage();
  let opening = null;      // capa del sobre abierto
  let pasted = new Set();  // figuritas recién pegadas (animación)

  function firstUnseenPage() {
    const s = STICKERS.find(x => album.isUnseen(x.id));
    return s ? PAGES.findIndex(p => p.id === s.page) : 0;
  }
  function refreshChrome() {
    const p = album.progress();
    sh.setChip({ icon: '📒', text: `${p.owned}/${p.total}`, label: `Tienes ${p.owned} de ${p.total} figuritas` });
    packBadge.hidden = !p.packs;
    packBadge.textContent = String(p.packs);
  }
  life.add(album.on('change', () => { refreshChrome(); if (tab === 'sobres' && !opening) show('sobres'); }));

  function show(id) {
    tab = id;
    tabs.select(id);
    tts.stop();
    refreshChrome();
    if (id === 'album') sh.fill(viewAlbum());
    else if (id === 'sobres') sh.fill(viewPacks());
    else sh.fill(viewDupes());
  }

  // ───────── Figurita (miniatura) ─────────
  function stickerThumb(s, { small = false, onClick = null } = {}) {
    const img = h('img', { alt: '', class: 'fg-st__img', draggable: 'false' });
    const node = h(onClick ? 'button' : 'div', { type: onClick ? 'button' : null, class: `fg-st fg-st--${s.rarity}${small ? ' fg-st--small' : ''} is-loading`,
      'aria-label': onClick ? `Figurita ${s.n}: ${s.title}` : null, onclick: onClick }, img,
    s.rarity !== 'comun' ? h('span', { class: 'fg-st__shine', 'aria-hidden': 'true' }) : null);
    stickerURL(s).then(u => { if (!life.dead) { img.src = u; img.decode?.().catch(() => {}).finally(() => node.classList.remove('is-loading')); } }).catch(() => node.classList.remove('is-loading'));
    return node;
  }

  // ───────── Vista grande ─────────
  function openBig(s) {
    sfx('pop');
    album.markSeen(s.id);
    const page = PAGES.find(p => p.id === s.page);
    const img = h('img', { alt: s.title, class: 'fg-big__img' });
    stickerURL(s).then(u => { if (!img.src) img.src = u; }).catch(() => {});
    stickerURL(s, { big: true }).then(u => { if (!life.dead) img.src = u; }).catch(() => {});
    const count = album.count(s.id);
    modal({
      className: 'fg-big',
      body: [
        h('div', { class: `fg-big__card fg-st--${s.rarity}` }, img, s.rarity !== 'comun' ? h('span', { class: 'fg-st__shine', 'aria-hidden': 'true' }) : null),
        h('div', { class: 'fg-big__meta' },
          h('span', { class: 'fg-num' }, `Nº ${s.n}`),
          h('span', { class: `fg-rare fg-rare--${s.rarity}` }, RARE_ICON[s.rarity] ? deco(RARE_ICON[s.rarity]) : null, RARITY[s.rarity].label),
          count > 1 ? h('span', { class: 'fg-rare' }, `Tienes ${count}`) : null),
        h('h2', { class: 'fg-big__title' }, s.title),
        h('p', { class: 'fg-big__page' }, deco(page.icon), page.title),
        h('p', { class: 'fg-big__caption' }, s.caption),
      ],
      buttons: [
        { label: 'Cerrar', kind: 'sun' },
      ],
    }).closed.then(() => { tts.stop(); if (!life.dead && tab === 'album') paintPage(false); });
    const actions = document.querySelector('.fg-big .modal__actions');
    const sp = speakBtn(() => [s.title, s.caption], { label: 'Escuchar' });
    if (actions && sp) actions.prepend(sp);
  }

  // ───────── Álbum ─────────
  let leaf = null, pageHead = null, nav = null;
  function viewAlbum() {
    pageHead = h('div', { class: 'fg-head' });
    leaf = h('div', { class: 'fg-leaf' });
    const book = h('div', { class: 'fg-book' }, leaf);
    swipe(book, dir => turn(dir));
    nav = h('div', { class: 'fg-nav' });
    paintPage(false);
    return [pageHead, book, nav];
  }
  function paintPage(fresh = true) {
    if (!leaf) return;
    const pg = PAGES[pageIdx];
    const list = pageList(pg.id);
    const prog = album.progress().pages[pg.id];
    leaf.style.setProperty('--c1', pg.c1);
    leaf.style.setProperty('--c2', pg.c2);
    clear(pageHead).append(
      h('span', { class: 'fg-head__icon', 'aria-hidden': 'true' }, pg.icon),
      h('div', { class: 'fg-head__col' },
        h('h2', null, pg.title),
        h('p', null, pg.sub),
        progressMeter((prog.owned / prog.total) * 100, 'var(--sun-deep)', `${prog.owned} de ${prog.total} figuritas de esta página`)),
      h('span', { class: 'fg-head__count' }, `${prog.owned}/${prog.total}`));
    clear(leaf).append(h('div', { class: 'fg-grid' },
      list.map(s => slot(s)),
      h('div', { class: `fg-prize${prog.done ? ' is-done' : ''}` },
        h('span', { class: 'fg-prize__icon', 'aria-hidden': 'true' }, prog.done ? '🏅' : '🎁'),
        h('span', { class: 'fg-prize__text' }, prog.done ? '¡Página completa!' : `Completa la página: +${PAGE_PRIZE.coins} ${state.COIN.icon}`))));
    if (fresh) sh.scroll.scrollTop = 0;
    clear(nav).append(
      h('button', { type: 'button', class: 'fg-arrow', 'aria-label': 'Página anterior', disabled: pageIdx === 0, onclick: () => turn(-1) }, '◀'),
      h('div', { class: 'fg-dots', role: 'group', 'aria-label': 'Páginas' }, PAGES.map((p, i) => {
        const pr = album.progress().pages[p.id];
        return h('button', { type: 'button', class: `fg-dot${i === pageIdx ? ' is-on' : ''}${pr.done ? ' is-done' : ''}`, 'aria-label': `Página ${i + 1}: ${p.title}`, 'aria-current': i === pageIdx ? 'true' : null,
          onclick: () => { if (i !== pageIdx) turn(i > pageIdx ? 1 : -1, i); } }, p.icon);
      })),
      h('button', { type: 'button', class: 'fg-arrow', 'aria-label': 'Página siguiente', disabled: pageIdx === PAGES.length - 1, onclick: () => turn(1) }, '▶'));
    // Se pinta la página siguiente por adelantado.
    const nxt = PAGES[pageIdx + 1];
    if (nxt) life.later(() => pageList(nxt.id).filter(s => album.has(s.id)).forEach(s => stickerURL(s).catch(() => {})), 500);
  }
  function slot(s) {
    if (!album.has(s.id)) {
      return h('div', { class: 'fg-slot', 'aria-label': `Espacio ${s.n}: ${s.title} (te falta)` },
        h('span', { class: 'fg-slot__hint', 'aria-hidden': 'true' }, s.hint),
        h('span', { class: 'fg-slot__n' }, String(s.n)),
        h('span', { class: 'fg-slot__t' }, s.title));
    }
    const isNew = album.isUnseen(s.id);
    const extra = album.count(s.id) - 1;
    const st = stickerThumb(s, { onClick: () => openBig(s) });
    const wrap = h('div', { class: `fg-slot is-owned${isNew ? ' is-new' : ''}${pasted.has(s.id) ? ' is-pasted' : ''}` }, st,
      isNew ? h('span', { class: 'fg-new' }, '¡Nueva!') : null,
      extra > 0 ? h('span', { class: 'fg-x' }, `×${extra + 1}`) : null);
    pasted.delete(s.id);
    return wrap;
  }
  let turning = false;
  function turn(dir, to = null) {
    const next = to ?? pageIdx + dir;
    if (turning || next < 0 || next >= PAGES.length || next === pageIdx) return;
    sfx('page');
    if (reduceMotion() || !leaf) { pageIdx = next; paintPage(); return; }
    turning = true;
    leaf.classList.add(dir > 0 ? 'is-out-next' : 'is-out-prev');
    life.later(() => {
      pageIdx = next;
      leaf.classList.remove('is-out-next', 'is-out-prev');
      paintPage();
      leaf.classList.add(dir > 0 ? 'is-in-next' : 'is-in-prev');
      life.later(() => { leaf?.classList.remove('is-in-next', 'is-in-prev'); turning = false; }, 260);
    }, 220);
  }
  function swipe(node, fn) {
    let x0 = null, y0 = 0, id = null;
    life.on(node, 'pointerdown', e => { x0 = e.clientX; y0 = e.clientY; id = e.pointerId; });
    life.on(node, 'pointerup', e => {
      if (x0 === null || e.pointerId !== id) return;
      const dx = e.clientX - x0, dy = e.clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) fn(dx < 0 ? 1 : -1);
    });
    life.on(node, 'pointercancel', () => { x0 = null; });
  }

  // ───────── Sobres ─────────
  function envelope(extra = '') {
    return h('div', { class: `fg-env ${extra}`.trim(), 'aria-hidden': 'true' },
      h('div', { class: 'fg-env__flap' }),
      h('div', { class: 'fg-env__body' },
        h('span', { class: 'fg-env__bird' }, '🕊️'),
        h('span', { class: 'fg-env__title' }, 'Figuritas'),
        h('span', { class: 'fg-env__sub' }, 'de la fe'),
        h('span', { class: 'fg-env__n' }, '3 figuritas')),
      h('span', { class: 'fg-env__foil' }));
  }
  function viewPacks() {
    const p = album.progress();
    const buy = button(`Comprar un sobre · ${PACK_PRICE} ${state.COIN.icon}`, { kind: p.packs ? 'ghost' : 'leaf', block: true, sound: null, onClick: () => {
      if (album.buyPack()) { sfx('coin'); toast('¡Un sobre nuevo!', { icon: '✉️' }); show('sobres'); }
      else { sfx('wrong'); toast(`Te faltan ${PACK_PRICE - state.get().coins} semillas. ¡Gánalas jugando!`, { icon: state.COIN.icon, ms: 2800 }); }
    } });
    return [
      h('div', { class: 'fg-packs' },
        h('div', { class: 'fg-packs__stage' }, envelope(p.packs ? 'is-wiggle' : 'is-empty'), p.packs > 1 ? h('span', { class: 'fg-packs__stack', 'aria-hidden': 'true' }) : null),
        h('p', { class: 'fg-packs__count' }, p.packs ? `Tienes ${p.packs} ${p.packs === 1 ? 'sobre' : 'sobres'}` : 'No tienes sobres por ahora'),
        p.packs ? button('¡Abrir un sobre!', { kind: 'sun', block: true, icon: '✨', sound: null, onClick: openPackFlow }) : null,
        buy,
        h('p', { class: 'fg-packs__coins' }, `Tienes ${state.get().coins} ${state.COIN.name} ${state.COIN.icon}`)),
      h('div', { class: 'fg-how' },
        h('h3', null, deco('🎁'), '¿Cómo gano sobres?'),
        h('ul', null,
          h('li', null, deco('📅'), 'Con el regalo de cada día.'),
          h('li', null, deco('🧰'), 'Con los cofres de los juegos.'),
          h('li', null, deco('🎬'), 'Al terminar una lección de catequesis.'),
          h('li', null, deco('🌱'), `Comprándolos con ${PACK_PRICE} semillas.`)),
        h('p', { class: 'fg-how__odds' }, 'Cada sobre trae 3 figuritas. Las 🌟 brillantes son las más difíciles de conseguir.')),
    ];
  }

  function openPackFlow() {
    if (opening) return;
    const res = album.openPack();
    if (!res) { toast('No tienes sobres', { icon: '✉️' }); return; }
    sfx('whoosh');
    let flipped = 0;
    const env = envelope('is-ready');
    const tear = h('button', { type: 'button', class: 'fg-open__tear', 'aria-label': 'Abrir el sobre' }, env, h('span', { class: 'fg-open__hint' }, '¡Toca para abrir!'));
    const cardsBox = h('div', { class: 'fg-open__cards' });
    const done = button('Pegar en el álbum', { kind: 'sun', block: true, icon: '📒', onClick: () => finish() });
    const allBtn = button('Voltear todas', { kind: 'ghost', small: true, onClick: () => cards.forEach(c => c.flip()) });
    const foot = h('div', { class: 'fg-open__foot', hidden: true }, allBtn, done);
    const layer = h('div', { class: 'fg-open', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Sobre de figuritas' },
      h('div', { class: 'fg-open__rays', 'aria-hidden': 'true' }), tear, cardsBox, foot);
    sh.root.append(layer);
    opening = { layer, finish };
    tear.focus({ preventScroll: true });
    const cards = res.cards.map((c, i) => revealCard(c, i, () => {
      flipped++;
      if (flipped === cards.length) { allBtn.hidden = true; done.focus({ preventScroll: true }); }
    }));
    let torn = false;
    tear.addEventListener('click', () => {
      if (torn) return;
      torn = true;
      sfx('whoosh');
      env.classList.add('is-torn');
      tear.querySelector('.fg-open__hint').hidden = true;
      life.later(() => {
        tear.hidden = true;
        cardsBox.append(...cards.map(c => c.node));
        foot.hidden = false;
        cards[0]?.node.focus({ preventScroll: true });
      }, reduceMotion() ? 0 : 520);
    });
    function finish() {
      if (!opening) return;
      cards.forEach(c => c.flip(true));
      layer.remove();
      opening = null;
      const fresh = res.cards.filter(c => c.isNew).map(c => c.sticker);
      fresh.forEach(s => pasted.add(s.id));
      if (fresh.length) {
        pageIdx = PAGES.findIndex(p => p.id === fresh[0].page);
        show('album');
        if (!reduceMotion()) celebrate(sh.page, ['✨', '⭐', '🕊️', '💛']);
        sfx('sticker');
      } else show('sobres');
      if (res.prizes.length) life.later(() => prizesChest(res.prizes), 700);
    }
  }
  function revealCard(c, i, onFlip) {
    const s = c.sticker;
    let open = false;
    const front = h('div', { class: 'fg-card__front' }, stickerThumb(s),
      c.isNew ? h('span', { class: 'fg-new fg-new--big' }, '¡Nueva!') : h('span', { class: 'fg-dup' }, `Repetida ×${c.count}`));
    const backFace = h('div', { class: 'fg-card__back', 'aria-hidden': 'true' }, h('span', null, '🕊️'));
    const node = h('button', { type: 'button', class: `fg-card fg-card--${s.rarity}`, 'aria-label': `Voltear la figurita ${i + 1}` },
      h('div', { class: 'fg-card__in' }, backFace, front),
      h('span', { class: 'fg-card__name' }, h('b', null, `Nº ${s.n}`), ` ${s.title}`));
    node.style.setProperty('--i', String(i));
    function flip(silent = false) {
      if (open) return;
      open = true;
      node.classList.add('is-flipped');
      node.setAttribute('aria-label', `${c.isNew ? 'Nueva' : 'Repetida'}: ${s.title}`);
      if (!silent) {
        sfx(s.rarity === 'brillante' ? 'sparkle' : c.isNew ? 'sticker' : 'pop');
        if (s.rarity === 'brillante') life.later(() => sfx('win'), 300);
      }
      onFlip?.();
    }
    node.addEventListener('click', () => (open ? openBig(s) : flip()));
    return { node, flip };
  }
  function prizesChest(prizes) {
    const items = prizes.flatMap(p => [{ icon: p.album ? '🏆' : '🏅', text: p.album ? '¡Completaste todo el álbum!' : `Página completa: ${p.page.title}`, big: true }, ...p.items]);
    showChest({ title: prizes.some(p => p.album) ? '¡Álbum completo!' : '¡Página completa!', icon: '🏅', items, note: 'Sigue juntando figuritas: las repetidas se pueden cambiar.' })
      .then(() => { if (!life.dead) show(tab); });
  }

  // ───────── Repetidas ─────────
  function viewDupes() {
    const d = album.duplicates();
    const total = d.reduce((a, x) => a + x.extra, 0);
    const miss = album.missing().length;
    const can = total >= TRADE_COST && miss > 0;
    const tradeBtn = button(`Cambiar ${TRADE_COST} repetidas por 1 nueva`, { kind: 'sun', block: true, icon: '🔁', sound: null, attrs: { disabled: !can }, onClick: trade });
    return [
      h('div', { class: 'fg-trade' },
        h('h2', null, '¿Te salió repetida?'),
        h('p', null, `Junta ${TRADE_COST} figuritas repetidas y cámbialas por una que te falte.`),
        h('div', { class: 'fg-trade__meter' },
          progressMeter(Math.min(100, (total / TRADE_COST) * 100), 'var(--grape)', `${total} repetidas`),
          h('span', null, `${Math.min(total, TRADE_COST)}/${TRADE_COST}`)),
        tradeBtn,
        !miss ? h('p', { class: 'fg-trade__note' }, '¡Ya tienes todas las figuritas! 🏆') : total < TRADE_COST ? h('p', { class: 'fg-trade__note' }, `Tienes ${total} ${total === 1 ? 'repetida' : 'repetidas'}.`) : null),
      d.length
        ? h('div', { class: 'fg-dupes' }, d.map(x => h('div', { class: 'fg-dupes__item' }, stickerThumb(x.sticker, { small: true, onClick: () => openBig(x.sticker) }), h('span', { class: 'fg-x' }, `+${x.extra}`))))
        : h('p', { class: 'fg-empty' }, deco('🗂️'), ' Aquí aparecerán tus figuritas repetidas.'),
    ];
  }
  function trade() {
    const r = album.tradeDuplicates();
    if (!r) return;
    sfx('good');
    const s = r.sticker;
    pasted.add(s.id);
    const card = revealCard({ sticker: s, isNew: true, count: 1 }, 0, null);
    let goAlbum = false;
    modal({ title: '¡Cambio hecho!', className: 'fg-trade-modal', body: [h('div', { class: 'fg-open__cards fg-open__cards--one' }, card.node), h('p', { style: { textAlign: 'center' } }, '¡Una figurita nueva para tu álbum!')],
      buttons: [{ label: 'Seguir', kind: 'ghost' }, { label: 'Ver en el álbum', kind: 'sun', onClick: () => { goAlbum = true; } }] }).closed.then(() => {
      if (life.dead) return;
      if (goAlbum) { pageIdx = PAGES.findIndex(p => p.id === s.page); show('album'); }
      if (r.prizes.length) life.later(() => prizesChest(r.prizes), 500);
    });
    life.later(() => card.flip(), reduceMotion() ? 0 : 450);
    show('repetidas');
  }

  show(tab);
  return {
    back() {
      if (opening) { opening.finish(); return true; }
      if (tab !== 'album') { show('album'); return true; }
      return false;
    },
    unmount() {
      opening?.layer.remove();
      opening = null;
      leaf = null;
      life.end();
      sh.root.remove();
    },
  };
}
