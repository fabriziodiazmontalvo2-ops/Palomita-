// Calendario litúrgico de Palomita: tiempos del año de la Iglesia, colores, días especiales y fiestas.
// Lógica pura: sin DOM y sin estado. Solo lee las fiestas de js/data/fiestas.js (FEASTS).
//
// Fechas: Date locales a medianoche (new Date(año, mes, día)); los días se comparan por año, mes y día locales.
// Nunca se usa toISOString para comparar: en el Perú (UTC−5), desde las siete de la noche ya daría «mañana».
// Las funciones aceptan un Date con cualquier hora, un número de milisegundos o el texto 'AAAA-MM-DD' (leído como
// fecha local); sin fecha usan el día de hoy, y sin año, el año actual. Las fechas que devuelven son siempre
// objetos nuevos.
//
//   easter(year)             Domingo de Pascua (cómputo gregoriano de Meeus, Jones y Butcher)
//   adventStart(year)        primer domingo de Adviento: el domingo entre el 27 de noviembre y el 3 de diciembre
//   keyDates(year)           fechas clave del año civil (ver keyDates)
//   seasonOf(date)           { id, label, color, week, weekLabel, special } (ver seasonOf)
//   colorHex(color)          color para pintar: 'morado' → '#6b3fa0'…
//   adventWeek(date)         semana de Adviento (1–4), o null fuera de Adviento
//   adventCandles(date)      velas encendidas de la corona de Adviento (0–4)
//   novenaDay(date)          día de la novena de Navidad (1–9, del 16 al 24 de diciembre), o null
//   feastDate(feast, year)   fecha de una fiesta de FEASTS (el objeto o su id) en ese año civil, o null
//   feastsOn(date)           fiestas de FEASTS que caen ese día (los mismos objetos de FEASTS, en su orden)
//   nextFeasts(date, n = 3)  las n fiestas siguientes, después de ese día: [{ feast, date, days }]
//
// El calendario en el Perú
//   La app sigue el Calendario Romano General más el propio del Perú (Santa Rosa de Lima el 30 de agosto, en
//   js/data/fiestas.js). En el Perú, como en muchos países, tres solemnidades que en el calendario general caen entre
//   semana se celebran el domingo (así aparecen en los calendarios litúrgicos de la Conferencia Episcopal Peruana; la
//   parroquia puede confirmarlo). keyDates da las dos fechas y la app decide así:
//   · Epifanía. En el Perú, la Misa es el domingo entre el 2 y el 8 de enero (keyDates.epifaniaDomingo). La app la
//     marca el 6 de enero (keyDates.epifania, día especial 'epifania' y fiesta 'bajada-de-reyes'), porque ese día las
//     familias hacen la Bajada de Reyes.
//   · Bautismo del Señor: el domingo después del 6 de enero (keyDates.bautismo), como en el calendario general.
//     Cuando en el Perú la Epifanía cae el 7 o el 8 de enero (en 2029, 2034 y 2035, por ejemplo), el Bautismo pasa al
//     lunes siguiente y la Navidad dura un día más; la app no hace ese cambio de un día.
//   · Ascensión. Calendario general: jueves, 39 días después de la Pascua (keyDates.ascension). En el Perú: el
//     séptimo domingo de Pascua (keyDates.ascensionDomingo). El día especial 'ascension' es ese domingo
//     (ASCENSION_DAY), que es cuando la celebra la parroquia.
//   · Corpus Christi. Calendario general: jueves (keyDates.corpus). En el Perú: domingo (keyDates.corpusDomingo).
//     La fiesta 'corpus-christi' de FEASTS va el domingo.
//   Si la parroquia celebra alguno de estos días en otra fecha, se cambia aquí (ASCENSION_DAY) o en la regla de la
//   fiesta en js/data/fiestas.js.
import { FEASTS } from '../data/fiestas.js';

const DAY_MS = 86400000;
const MAX_AHEAD = 400;          // nextFeasts busca hasta 400 días adelante
const ASCENSION_DAY = 42;       // días después de la Pascua: 42 = domingo (Perú); 39 = jueves (calendario general)

// ── Días locales ──
function toDay(date) {
  let d;
  if (date === undefined || date === null) d = new Date();
  else if (date instanceof Date) d = date;
  else if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, dd] = date.split('-').map(Number);
    d = new Date(y, m - 1, dd);
  } else d = new Date(date);
  if (Number.isNaN(d.getTime())) throw new TypeError(`Fecha inválida: ${String(date)}`);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function toYear(year) {
  const y = year instanceof Date ? year.getFullYear() : Math.trunc(Number(year));
  if (!Number.isFinite(y)) throw new TypeError(`Año inválido: ${String(year)}`);
  return y;
}
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
// Número de día sin horas ni cambios de horario: sirve para restar fechas y compararlas.
const dayNum = d => Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS);
const diffDays = (a, b) => dayNum(a) - dayNum(b);
const sundayOnOrAfter = d => addDays(d, (7 - d.getDay()) % 7);

// ── Pascua y Adviento ──

// Cómputo gregoriano (algoritmo «anónimo» de Meeus, Jones y Butcher), válido desde 1583.
export function easter(year = new Date().getFullYear()) {
  const Y = toYear(year);
  const a = Y % 19;
  const b = Math.floor(Y / 100);
  const c = Y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const n = h + l - 7 * m + 114;
  return new Date(Y, Math.floor(n / 31) - 1, (n % 31) + 1);
}

// Primer domingo de Adviento del año civil: el cuarto domingo antes de Navidad.
export function adventStart(year = new Date().getFullYear()) {
  return sundayOnOrAfter(new Date(toYear(year), 10, 27));
}

// Fechas clave del año civil `year` (todas Date locales a medianoche).
//   cenizas, ramos, jueves, viernes, sabado (santos), pascua
//   ascension        jueves, 39 días después de la Pascua (calendario general)
//   ascensionDomingo séptimo domingo de Pascua (+42): la Ascensión en el Perú
//   pentecostes (+49), trinidad (+56)
//   corpus           jueves, +60 (calendario general);  corpusDomingo  +63: Corpus Christi en el Perú
//   sagradoCorazon   viernes, +68
//   cristoRey        domingo anterior al primer domingo de Adviento
//   adviento1 … adviento4, navidad (25 de diciembre)
//   epifania         6 de enero de ese año (Bajada de Reyes)
//   epifaniaDomingo  domingo entre el 2 y el 8 de enero: Misa de la Epifanía en el Perú
//   bautismo         Bautismo del Señor: domingo después del 6 de enero (si el 6 es domingo, el domingo siguiente)
export function keyDates(year = new Date().getFullYear()) {
  const y = toYear(year);
  const p = easter(y);
  const a1 = adventStart(y);
  const jan6 = new Date(y, 0, 6);
  return {
    cenizas: addDays(p, -46),
    ramos: addDays(p, -7),
    jueves: addDays(p, -3),
    viernes: addDays(p, -2),
    sabado: addDays(p, -1),
    pascua: p,
    ascension: addDays(p, 39),
    ascensionDomingo: addDays(p, 42),
    pentecostes: addDays(p, 49),
    trinidad: addDays(p, 56),
    corpus: addDays(p, 60),
    corpusDomingo: addDays(p, 63),
    sagradoCorazon: addDays(p, 68),
    cristoRey: addDays(a1, -7),
    adviento1: a1,
    adviento2: addDays(a1, 7),
    adviento3: addDays(a1, 14),
    adviento4: addDays(a1, 21),
    navidad: new Date(y, 11, 25),
    epifania: jan6,
    epifaniaDomingo: sundayOnOrAfter(new Date(y, 0, 2)),
    bautismo: addDays(jan6, 7 - jan6.getDay()),
  };
}

// ── Tiempos y colores ──

const SEASON = {
  adviento: { label: 'Tiempo de Adviento', color: 'morado' },
  navidad: { label: 'Tiempo de Navidad', color: 'blanco' },
  ordinario: { label: 'Tiempo ordinario', color: 'verde' },
  cuaresma: { label: 'Tiempo de Cuaresma', color: 'morado' },
  triduo: { label: 'Triduo Pascual', color: 'rojo' },
  pascua: { label: 'Tiempo de Pascua', color: 'blanco' },
};
// Días especiales cuyo color no es el de su tiempo.
const SPECIAL_COLOR = {
  gaudete: 'rosado',
  laetare: 'rosado',
  ramos: 'rojo',
  'jueves-santo': 'blanco',
  'viernes-santo': 'rojo',
  'sabado-santo': 'morado',   // no hay Misa durante el día: la Iglesia espera en silencio (la Vigilia ya es blanca)
  pentecostes: 'rojo',
  trinidad: 'blanco',
  'cristo-rey': 'blanco',
};
const ORDINAL = ['', 'Primera', 'Segunda', 'Tercera', 'Cuarta', 'Quinta', 'Sexta', 'Séptima'];
function weekLabelOf(id, week) {
  if (!week) return null;
  if (id === 'adviento') return `${ORDINAL[week]} semana de Adviento`;
  if (id === 'cuaresma') return week === 6 ? 'Semana Santa' : `${ORDINAL[week]} semana de Cuaresma`;
  if (id === 'pascua') return `${ORDINAL[week]} semana de Pascua`;
  if (id === 'ordinario') return `Semana ${week} del tiempo ordinario`;
  return null;
}

// seasonOf(date) → { id, label, color, week, weekLabel, special }
//   id        'adviento' | 'navidad' | 'ordinario' | 'cuaresma' | 'triduo' | 'pascua'
//   label     nombre del tiempo: «Tiempo de Adviento»… (igual al title de SEASONS en js/data/fiestas.js)
//   color     color litúrgico del día: 'morado' | 'blanco' | 'verde' | 'rojo' | 'rosado'. Es el del tiempo, o el del día
//             especial cuando cambia (Gaudete y Laetare rosado; Ramos, Viernes Santo y Pentecostés rojo; Jueves Santo,
//             Santísima Trinidad y Cristo Rey blanco; Sábado Santo morado). En la fiesta de un santo el sacerdote puede
//             vestir otro color: lo dice feastsOn(date)[i].color.
//   week      semana del tiempo, o null: Adviento 1–4; Cuaresma 1–5 y 6 = Semana Santa (del Domingo de Ramos al
//             Miércoles Santo; del Miércoles de Ceniza al sábado siguiente es null); Pascua 1–7 (el domingo de
//             Pentecostés es null); tiempo ordinario 1–34 (después de Pentecostés se cuenta hacia atrás desde la semana
//             de Cristo Rey, que es la 34, por eso a veces se salta una semana); Navidad y Triduo: null.
//   weekLabel la semana en palabras para mostrar o leer en voz alta («Tercera semana de Adviento», «Semana Santa»,
//             «Semana 12 del tiempo ordinario»), o null
//   special   id de SPECIAL_DAYS, o null: 'nochebuena' (24 de diciembre), 'navidad' (25 de diciembre), 'epifania'
//             (6 de enero), 'bautismo', 'cenizas', 'laetare' (cuarto domingo de Cuaresma), 'ramos', 'jueves-santo',
//             'viernes-santo', 'sabado-santo', 'pascua', 'ascension', 'pentecostes', 'trinidad', 'cristo-rey',
//             'gaudete' (tercer domingo de Adviento)
// Reglas: Navidad, del 25 de diciembre al Bautismo del Señor inclusive. Cuaresma, del Miércoles de Ceniza al Miércoles
// Santo (la Cuaresma termina el Jueves Santo antes de la Misa de la tarde, pero para la app el Jueves Santo ya es
// Triduo). Triduo: Jueves, Viernes y Sábado Santo. Pascua: del Domingo de Pascua a Pentecostés inclusive. Adviento:
// de su primer domingo al 24 de diciembre. Tiempo ordinario: el resto.
export function seasonOf(date = new Date()) {
  const d = toDay(date);
  const k = keyDates(d.getFullYear());
  const at = x => diffDays(d, x);          // días desde la fecha x (negativo: antes de x)
  let id = 'ordinario';
  let week = null;
  let special = null;
  if (at(k.bautismo) <= 0 || at(k.navidad) >= 0) {
    id = 'navidad';
    if (at(k.navidad) === 0) special = 'navidad';
    else if (at(k.epifania) === 0) special = 'epifania';
    else if (at(k.bautismo) === 0) special = 'bautismo';
  } else if (at(k.adviento1) >= 0) {
    id = 'adviento';
    week = Math.floor(at(k.adviento1) / 7) + 1;
    if (at(k.adviento3) === 0) special = 'gaudete';
    else if (d.getMonth() === 11 && d.getDate() === 24) special = 'nochebuena';
  } else if (at(k.cenizas) >= 0 && at(k.jueves) < 0) {
    id = 'cuaresma';
    const fromLent1 = at(k.cenizas) - 4;    // el primer domingo de Cuaresma es cuatro días después de Ceniza
    week = fromLent1 < 0 ? null : Math.floor(fromLent1 / 7) + 1;
    if (at(k.cenizas) === 0) special = 'cenizas';
    else if (at(k.pascua) === -21) special = 'laetare';
    else if (at(k.ramos) === 0) special = 'ramos';
  } else if (at(k.jueves) >= 0 && at(k.pascua) < 0) {
    id = 'triduo';
    special = ['jueves-santo', 'viernes-santo', 'sabado-santo'][at(k.jueves)];
  } else if (at(k.pascua) >= 0 && at(k.pentecostes) <= 0) {
    id = 'pascua';
    const n = at(k.pascua);
    week = n === 49 ? null : Math.floor(n / 7) + 1;
    if (n === 0) special = 'pascua';
    else if (n === ASCENSION_DAY) special = 'ascension';
    else if (n === 49) special = 'pentecostes';
  } else {
    week = at(k.cenizas) < 0
      ? Math.floor(at(k.bautismo) / 7) + 1                               // antes de la Cuaresma
      : 34 - diffDays(k.cristoRey, addDays(d, -d.getDay())) / 7;          // después de Pentecostés
    if (at(k.trinidad) === 0) special = 'trinidad';
    else if (at(k.cristoRey) === 0) special = 'cristo-rey';
  }
  const s = SEASON[id];
  return { id, label: s.label, color: SPECIAL_COLOR[special] || s.color, week, weekLabel: weekLabelOf(id, week), special };
}

const HEX = { morado: '#6b3fa0', blanco: '#f4efe2', verde: '#3f8f4e', rojo: '#c0392b', rosado: '#e48fb3' };
// Color para pintar. Un nombre desconocido devuelve el verde (el color del tiempo más largo).
export function colorHex(color) {
  return HEX[color] || HEX.verde;
}

// ── Corona de Adviento y novena ──

export function adventWeek(date = new Date()) {
  const d = toDay(date);
  const n = diffDays(d, adventStart(d.getFullYear()));
  if (n < 0 || (d.getMonth() === 11 && d.getDate() >= 25)) return null;
  return Math.floor(n / 7) + 1;
}
// Velas encendidas: 1 desde el primer domingo … 4 desde el cuarto, también el 24 de diciembre. Desde el 25 de
// diciembre devuelve 0, porque ya no es Adviento: en Navidad la pantalla puede mostrar el nacimiento en su lugar.
export function adventCandles(date = new Date()) {
  return adventWeek(date) ?? 0;
}

// Novena de Navidad: del 16 (día 1) al 24 de diciembre (día 9). Ver NOVENA en js/data/fiestas.js.
export function novenaDay(date = new Date()) {
  const d = toDay(date);
  return d.getMonth() === 11 && d.getDate() >= 16 && d.getDate() <= 24 ? d.getDate() - 15 : null;
}

// ── Fiestas ──

// n-ésimo día de la semana del mes (n = 1…5; n = −1 es el último). null si ese mes no lo tiene.
function nthWeekday(year, month, weekday, n) {
  let d = null;
  if (n > 0) {
    const first = new Date(year, month - 1, 1);
    d = addDays(first, ((weekday - first.getDay() + 7) % 7) + 7 * (n - 1));
  } else if (n < 0) {
    const last = new Date(year, month, 0);
    d = addDays(last, -((last.getDay() - weekday + 7) % 7) + 7 * (n + 1));
  }
  return d && d.getMonth() === month - 1 ? d : null;
}

// Traslado de una solemnidad impedida (Normas universales sobre el año litúrgico, número 60, y la decisión de la
// Congregación para el Culto Divino de 2008 sobre san José):
//   · en Semana Santa o en la Octava de Pascua → lunes después del segundo domingo de Pascua; con 'antes' (san José),
//     si cae en Semana Santa se adelanta al sábado anterior al Domingo de Ramos;
//   · en un domingo de Adviento, de Cuaresma o de Pascua → lunes siguiente.
// Ejemplos: san José 2028 (tercer domingo de Cuaresma) → lunes 20 de marzo; san José 2035 (Lunes Santo) → sábado 17 de
// marzo; la Anunciación 2027 (Jueves Santo) → lunes 5 de abril.
function transferSolemnity(d, mode) {
  const p = easter(d.getFullYear());
  const fromPalms = diffDays(d, addDays(p, -7));
  if (fromPalms >= 0 && fromPalms <= 14) return mode === 'antes' && fromPalms < 7 ? addDays(p, -8) : addDays(p, 8);
  if (d.getDay() === 0 && ['adviento', 'cuaresma', 'pascua'].includes(seasonOf(d).id)) return addDays(d, 1);
  return d;
}

// Fecha de la fiesta en el año civil `year` según su regla (ver FEASTS en js/data/fiestas.js), o null.
export function feastDate(feast, year = new Date().getFullYear()) {
  const f = typeof feast === 'string' ? FEASTS.find(x => x.id === feast) : feast;
  const r = f && f.rule;
  if (!r) return null;
  const y = toYear(year);
  let d = null;
  if (r.from === 'pascua') d = addDays(easter(y), Number(r.offset) || 0);
  else if (r.nthWeekday) d = nthWeekday(y, r.month, r.nthWeekday.weekday, r.nthWeekday.n);
  else if (r.month >= 1 && r.month <= 12 && r.day >= 1) {
    d = new Date(y, r.month - 1, r.day);
    if (d.getMonth() !== r.month - 1) d = null;     // 29 de febrero en un año que no es bisiesto
  }
  if (d && r.transfer) d = transferSolemnity(d, r.transfer);
  return d;
}

export function feastsOn(date = new Date()) {
  const d = toDay(date);
  const y = d.getFullYear();
  return FEASTS.filter(f => [y - 1, y, y + 1].some(yy => {
    const fd = feastDate(f, yy);
    return !!fd && diffDays(fd, d) === 0;
  }));
}

// Próximas fiestas después de `date` (las de ese mismo día se piden con feastsOn), hasta 400 días adelante.
// Cada fiesta sale una sola vez, en su fecha más próxima: [{ feast, date, days }], días = cuántos faltan.
export function nextFeasts(date = new Date(), n = 3) {
  const d = toDay(date);
  const y = d.getFullYear();
  const out = [];
  for (const feast of FEASTS) {
    let best = null;
    for (const yy of [y, y + 1, y + 2]) {
      const fd = feastDate(feast, yy);
      if (!fd) continue;
      const days = diffDays(fd, d);
      if (days > 0 && days <= MAX_AHEAD && (!best || days < best.days)) best = { feast, date: fd, days };
    }
    if (best) out.push(best);
  }
  out.sort((a, b) => a.days - b.days || FEASTS.indexOf(a.feast) - FEASTS.indexOf(b.feast));
  return out.slice(0, Math.max(0, n));
}
