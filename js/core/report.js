// Informe de avance para los papás y el catequista. Se arma con lo que el niño hizo en la app
// (solo en este teléfono) y, si la familia quiere, se envía como texto por WhatsApp u otra app.
// El texto lleva solo el primer nombre del niño y nada de lo que es privado (el examen de conciencia,
// las intenciones o el diario nunca entran).
//
//   build() → Promise<informe>      text(informe) → texto para compartir
import * as state from './state.js';
import * as stickers from './stickers.js';
import { PARISH } from '../data/parroquia.js';

const firstName = s => String(s || '').trim().split(/\s+/)[0] || '';
const fmt = ms => { const d = new Date(ms); return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`; };
async function safe(p, key, fb) { try { const m = await p; return m[key] ?? fb; } catch { return fb; } }

export async function build() {
  const [CATECHISM, LESSONS, PRAYERS, EXTRA, MEMORY_SET] = await Promise.all([
    safe(import('../data/catechism.js'), 'CATECHISM', []),
    safe(import('../data/lessons.js'), 'LESSONS', []),
    safe(import('../data/prayers.js'), 'PRAYERS', []),
    safe(import('../data/oraciones-extra.js'), 'PRAYERS_EXTRA', []),
    safe(import('../data/oraciones-extra.js'), 'MEMORY_SET', []),
  ]);
  const S = state.get();
  const prayerTitle = id => [...PRAYERS, ...EXTRA].find(p => p.id === id)?.title || id;
  const topics = CATECHISM.map(c => ({ id: c.id, title: c.title, unit: c.unit, emoji: c.emoji, done: state.quizDone(`cat:${c.id}`), at: state.quizAt(`cat:${c.id}`) }));
  const lessons = LESSONS.map(l => ({ id: l.id, title: l.title, emoji: l.emoji, seen: state.isRead(`lesson:${l.id}`), star: state.quizDone(`lesson:${l.id}`) }));
  const memo = (MEMORY_SET.length ? MEMORY_SET : [
    { id: 'senal-de-la-cruz', type: 'prayer' }, { id: 'padre-nuestro', type: 'prayer' }, { id: 'ave-maria', type: 'prayer' },
    { id: 'gloria', type: 'prayer' }, { id: 'credo', type: 'prayer' }, { id: 'yo-confieso', type: 'prayer' }, { id: 'acto-de-contricion', type: 'prayer' },
  ]).map(m => ({ id: m.id, title: m.title || prayerTitle(m.id), emoji: m.emoji || '🙏', state: state.memorized(m.id) }));
  const masses = Object.entries(state.massLog()).sort((a, b) => a[0].localeCompare(b[0]));
  const activity = state.activity(14);
  const lastDone = topics.filter(t => t.done && t.at).sort((a, b) => b.at - a.at)[0] || null;
  const st = stickers.progress();
  return {
    kid: firstName(S.kid), pet: S.name, level: S.level, days: S.days, since: S.created,
    topics, topicsDone: topics.filter(t => t.done).length, lastTopic: lastDone,
    lessons, lessonsSeen: lessons.filter(l => l.seen).length,
    confesionPractice: state.quizDone('confesion'), misaPractice: state.quizDone('misa:practica'), misaQuiz: state.quizDone('misa:quiz'),
    memo, memoKid: memo.filter(m => m.state).length, memoGrown: memo.filter(m => m.state?.by === 'grande').length,
    masses: masses.map(([day, v]) => ({ day, ...v })), massesOk: masses.filter(([, v]) => v.ok).length,
    deeds: state.deeds().length,
    activity, activeDays: activity.filter(a => a.points > 0).length,
    stickers: { owned: st.owned, total: st.total },
  };
}

export function text(r) {
  const who = r.kid || 'mi hijo o hija';
  const memoNames = r.memo.filter(m => m.state).map(m => m.title + (m.state.by === 'grande' ? ' ✔' : ''));
  const lines = [
    `Avance de ${who} en Palomita (${fmt(Date.now())})`,
    '',
    `📖 Mi camino a la Primera Comunión: ${r.topicsDone} de ${r.topics.length} temas${r.lastTopic ? ` (el último: ${r.lastTopic.title})` : ''}`,
    `🎬 Lecciones vistas: ${r.lessonsSeen} de ${r.lessons.length}`,
    `🙏 Oraciones que sabe de memoria: ${memoNames.length ? memoNames.join(', ') : 'todavía ninguna marcada'}`,
    memoNames.some(n => n.endsWith('✔')) ? '   (✔ = un grande lo escuchó recitarla)' : null,
    `⛪ Misas del domingo anotadas: ${r.masses.length}${r.massesOk ? ` (${r.massesOk} confirmadas por un grande)` : ''}`,
    `🤗 Practicó la Confesión: ${r.confesionPractice ? 'sí' : 'todavía no'} · Practicó la Misa: ${r.misaPractice ? 'sí' : 'todavía no'}`,
    `🌸 Buenas obras cumplidas: ${r.deeds}`,
    `📅 Días que usó la app en las últimas 2 semanas: ${r.activeDays} de 14`,
    '',
    `Enviado desde Palomita · ${PARISH?.name || 'mi parroquia'}`,
  ];
  return lines.filter(l => l !== null).join('\n');
}
