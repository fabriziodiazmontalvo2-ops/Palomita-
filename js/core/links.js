// Enlaces de los textos de catequesis a otras partes de la app: { screen, tab?, label }.
// Algunos datos usan nombres de pestaña genéricos; aquí se traducen a los de cada pantalla.
import { go } from './router.js';

const TAB_ALIAS = {
  confesion: { practicar: 'pasos', practica: 'pasos', ensayo: 'pasos' },
  misa: { practicar: 'practica' },
};
export function goLink(link) {
  if (!link || typeof link.screen !== 'string') return;
  const tab = link.tab ? (TAB_ALIAS[link.screen]?.[link.tab] || link.tab) : undefined;
  go(link.screen, tab ? { tab } : {});
}
