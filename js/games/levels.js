// Niveles de los minijuegos (1 a 100).
//
// Cada juego describe sus niveles en su propio módulo (export default { …, levels: {…} }) o, si no, en registry.js:
//   levels: {
//     goal: [metaNivel1, metaNivel100],      // puntaje que hay que alcanzar
//     curve: 1,                              // forma de la subida (1 = recta, >1 sube despacio al principio)
//     time: [seg1, seg100],                  // solo juegos con reloj (hud.time)
//     lives: 3,                              // solo juegos con vidas (hud.lives)
//     selfEnd: false,                        // true = el juego decide cuándo se gana (llama api.end({ won }))
//     goalLabel: n => `Junta ${n} ramitas`,  // texto de la meta
//   }
// levelSpec() convierte eso en lo que el motor necesita para un nivel concreto.
import { MAX_LEVEL } from '../core/state.js';

export { MAX_LEVEL };
const lerp = (a, b, t) => a + (b - a) * t;

// Configuración por defecto a partir de la meta del catálogo (por si un juego no trae la suya).
export function defaultLevels(def) {
  const g = Math.max(2, def.goal || 10);
  return {
    goal: [Math.max(2, Math.round(g * 0.4)), Math.round(g * 2.2)],
    curve: 1.15,
    time: def.hud?.time ? [def.hud.time, def.hud.time] : undefined,
    lives: def.hud?.lives,
    selfEnd: false,
    goalLabel: n => (def.goalText ? def.goalText.replace(/\d+/, String(n)) : `Consigue ${n} puntos`),
  };
}

export function levelConfig(def, mod) {
  const base = defaultLevels(def);
  const own = (mod && mod.levels) || def.levels || {};
  return { ...base, ...own };
}

export function levelSpec(cfg, n) {
  const level = Math.max(1, Math.min(MAX_LEVEL, Math.round(n) || 1));
  const difficulty = (level - 1) / (MAX_LEVEL - 1);
  const k = Math.pow(difficulty, cfg.curve || 1);
  const goal = Math.max(1, Math.round(lerp(cfg.goal[0], cfg.goal[1], k)));
  const time = Array.isArray(cfg.time) ? Math.round(lerp(cfg.time[0], cfg.time[1], difficulty)) : undefined;
  return {
    level, difficulty, goal, time,
    lives: cfg.lives,
    selfEnd: !!cfg.selfEnd,
    label: typeof cfg.goalLabel === 'function' ? cfg.goalLabel(goal, level) : `Consigue ${goal}`,
  };
}

// Hitos del camino de niveles.
export const isChest = n => n % 10 === 0;
export const MEDALS = { 25: { icon: '🥉', name: 'Medalla de bronce' }, 50: { icon: '🥈', name: 'Medalla de plata' }, 75: { icon: '🥇', name: 'Medalla de oro' }, 100: { icon: '🏆', name: 'Copa de campeón' } };
