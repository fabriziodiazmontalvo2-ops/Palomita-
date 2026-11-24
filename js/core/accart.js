// La foto de la palomita con esa ropa puesta (assets/ropa/<id>.webp, la hace tools/ropa-fotos.mjs); si no está, el emoji.
//   accArt(cosa, clase) → <span> listo para la tienda o el ropero
import { h } from './ui.js';

export function accArt(a, cls = 'shop-card__art') {
  const box = h('span', { class: `${cls} acc-art`, 'aria-hidden': 'true' });
  const img = h('img', { src: `assets/ropa/${a.id}.webp`, alt: '', loading: 'lazy', decoding: 'async', draggable: 'false' });
  img.addEventListener('error', () => { img.remove(); box.classList.remove('has-img'); box.textContent = a.emoji; }, { once: true });
  img.addEventListener('load', () => box.classList.add('has-img'), { once: true });
  box.append(img);
  return box;
}
