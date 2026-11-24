#!/usr/bin/env node
// Pruebas del calendario litúrgico (js/core/liturgy.js) y de sus datos (js/data/fiestas.js). Sin librerías.
//   node tools/test-liturgy.mjs        → sale con código 1 si algo falla
//
// Las fechas esperadas están calculadas a mano (y las de años pasados son las que se celebraron). La Pascua se compara
// además con un segundo algoritmo (Oudin) de 1583 a 4099, y cada día de muchos años se revisa contra las reglas.
// Al final todo se repite en otras zonas horarias (TZ): los días no deben depender de la hora ni del horario de verano.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  easter, adventStart, keyDates, seasonOf, colorHex, adventCandles, adventWeek, feastsOn, nextFeasts, feastDate, novenaDay,
} from '../js/core/liturgy.js';
import { SEASONS, SPECIAL_DAYS, FEASTS, ADVENT_WEEKS, NOVENA, LENT_TIPS } from '../js/data/fiestas.js';
import { SCENE_IDS } from '../js/art/scenes.js';

const CHILD = process.env.PALOMITA_LITURGY_TZ_CHILD === '1';
let checks = 0;
const failures = [];
const fail = msg => { failures.push(msg); console.log(`  ✗ ${msg}`); };
function ok(cond, msg) { checks++; if (!cond) fail(msg); return !!cond; }
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const show = v => (v instanceof Date ? ymd(v) : JSON.stringify(v));
function eq(actual, expected, msg) { checks++; if (actual !== expected) fail(`${msg}: se esperaba ${show(expected)} y salió ${show(actual)}`); }
function eqDay(actual, expected, msg) {
  checks++;
  if (!(actual instanceof Date) || Number.isNaN(actual.getTime()) || ymd(actual) !== expected) fail(`${msg}: se esperaba ${expected} y salió ${show(actual)}`);
}
const D = (y, m, d) => new Date(y, m - 1, d);
const add = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const section = t => { if (!CHILD) console.log(t); };
const WEEKDAY = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

// ─────────────────────────── Pascua ───────────────────────────
section('Pascua');
const EASTERS = {
  1818: '1818-03-22', 1943: '1943-04-25', 2000: '2000-04-23', 2008: '2008-03-23', 2011: '2011-04-24', 2016: '2016-03-27',
  2019: '2019-04-21', 2020: '2020-04-12', 2021: '2021-04-04', 2022: '2022-04-17', 2023: '2023-04-09', 2024: '2024-03-31',
  2025: '2025-04-20', 2026: '2026-04-05', 2027: '2027-03-28', 2028: '2028-04-16', 2029: '2029-04-01', 2030: '2030-04-21',
  2031: '2031-04-13', 2032: '2032-03-28', 2033: '2033-04-17', 2034: '2034-04-09', 2035: '2035-03-25', 2038: '2038-04-25',
  2285: '2285-03-22',
};
for (const [y, s] of Object.entries(EASTERS)) eqDay(easter(Number(y)), s, `Pascua ${y}`);

// Segundo algoritmo, independiente: Oudin (1940), como en el «Calendar FAQ» de Claus Tøndering.
function easterOudin(Y) {
  const G = Y % 19;
  const C = Math.floor(Y / 100);
  const H = (C - Math.floor(C / 4) - Math.floor((8 * C + 13) / 25) + 19 * G + 15) % 30;
  const I = H - Math.floor(H / 28) * (1 - Math.floor(29 / (H + 1)) * Math.floor((21 - G) / 11));
  const J = (Y + Math.floor(Y / 4) + I + 2 - C + Math.floor(C / 4)) % 7;
  const L = I - J;
  const month = 3 + Math.floor((L + 40) / 44);
  return `${Y}-${pad(month)}-${pad(L + 28 - 31 * Math.floor(month / 4))}`;
}
{
  let bad = 0;
  for (let y = 1583; y <= 4099; y++) {
    const e = easter(y);
    const md = (e.getMonth() + 1) * 100 + e.getDate();
    if (ymd(e) !== easterOudin(y) || e.getDay() !== 0 || md < 322 || md > 425) {
      if (bad++ < 5) fail(`Pascua ${y}: ${ymd(e)} no coincide con Oudin (${easterOudin(y)}) o no es un domingo entre el 22 de marzo y el 25 de abril`);
    }
  }
  checks++;
  if (bad) fail(`Pascua: ${bad} años distintos entre los dos algoritmos`);
}

// ─────────────────────────── Adviento y fechas clave ───────────────────────────
section('Adviento y fechas clave');
eqDay(adventStart(2022), '2022-11-27', 'Primer domingo de Adviento 2022');
eqDay(adventStart(2025), '2025-11-30', 'Primer domingo de Adviento 2025');
eqDay(adventStart(2026), '2026-11-29', 'Primer domingo de Adviento 2026');
eqDay(adventStart(2027), '2027-11-28', 'Primer domingo de Adviento 2027');
eqDay(adventStart(2028), '2028-12-03', 'Primer domingo de Adviento 2028');

const EXPECTED = {
  2026: {
    cenizas: '2026-02-18', ramos: '2026-03-29', jueves: '2026-04-02', viernes: '2026-04-03', sabado: '2026-04-04',
    pascua: '2026-04-05', ascension: '2026-05-14', ascensionDomingo: '2026-05-17', pentecostes: '2026-05-24',
    trinidad: '2026-05-31', corpus: '2026-06-04', corpusDomingo: '2026-06-07', sagradoCorazon: '2026-06-12',
    cristoRey: '2026-11-22', adviento1: '2026-11-29', adviento2: '2026-12-06', adviento3: '2026-12-13', adviento4: '2026-12-20',
    navidad: '2026-12-25', epifania: '2026-01-06', epifaniaDomingo: '2026-01-04', bautismo: '2026-01-11',
  },
  2027: {
    cenizas: '2027-02-10', ramos: '2027-03-21', jueves: '2027-03-25', viernes: '2027-03-26', sabado: '2027-03-27',
    pascua: '2027-03-28', ascension: '2027-05-06', ascensionDomingo: '2027-05-09', pentecostes: '2027-05-16',
    trinidad: '2027-05-23', corpus: '2027-05-27', corpusDomingo: '2027-05-30', sagradoCorazon: '2027-06-04',
    cristoRey: '2027-11-21', adviento1: '2027-11-28', adviento2: '2027-12-05', adviento3: '2027-12-12', adviento4: '2027-12-19',
    navidad: '2027-12-25', epifania: '2027-01-06', epifaniaDomingo: '2027-01-03', bautismo: '2027-01-10',
  },
};
for (const [y, exp] of Object.entries(EXPECTED)) {
  const k = keyDates(Number(y));
  eq(Object.keys(k).sort().join(','), Object.keys(exp).sort().join(','), `keyDates(${y}): campos`);
  for (const [name, s] of Object.entries(exp)) eqDay(k[name], s, `keyDates(${y}).${name}`);
}
eqDay(keyDates(2026).cenizas, '2026-02-18', 'Miércoles de Ceniza 2026');
eqDay(keyDates(2026).pentecostes, '2026-05-24', 'Pentecostés 2026');
eqDay(keyDates(2028).epifaniaDomingo, '2028-01-02', 'Epifanía en domingo 2028');
eqDay(keyDates(2028).bautismo, '2028-01-09', 'Bautismo del Señor 2028');
eqDay(keyDates(2030).bautismo, '2030-01-13', 'Bautismo del Señor 2030 (el 6 de enero cae domingo)');
eqDay(keyDates(2029).bautismo, '2029-01-07', 'Bautismo del Señor 2029');
{
  const k = keyDates(2026);
  k.pascua.setDate(1);
  eqDay(keyDates(2026).pascua, '2026-04-05', 'keyDates devuelve fechas nuevas cada vez');
  eqDay(keyDates(D(2026, 7, 1)).pascua, '2026-04-05', 'keyDates también acepta un Date');
}
{
  const DOW = { cenizas: 3, ramos: 0, jueves: 4, viernes: 5, sabado: 6, pascua: 0, ascension: 4, ascensionDomingo: 0, pentecostes: 0,
    trinidad: 0, corpus: 4, corpusDomingo: 0, sagradoCorazon: 5, cristoRey: 0, adviento1: 0, adviento2: 0, adviento3: 0,
    adviento4: 0, epifaniaDomingo: 0, bautismo: 0 };
  let bad = 0;
  for (let y = 1900; y <= 2200; y++) {
    const k = keyDates(y);
    for (const [name, dow] of Object.entries(DOW)) if (k[name].getDay() !== dow && bad++ < 5) fail(`${y}: ${name} cae ${WEEKDAY[k[name].getDay()]}`);
    const a1 = (k.adviento1.getMonth() + 1) * 100 + k.adviento1.getDate();
    if (!(a1 >= 1127 && a1 <= 1203) && bad++ < 5) fail(`${y}: el Adviento empieza el ${ymd(k.adviento1)}`);
    const a4 = k.adviento4.getMonth() === 11 ? k.adviento4.getDate() : 0;
    if (!(a4 >= 18 && a4 <= 24) && bad++ < 5) fail(`${y}: el cuarto domingo de Adviento es el ${ymd(k.adviento4)}`);
    const e = k.epifaniaDomingo.getDate();
    if (!(k.epifaniaDomingo.getMonth() === 0 && e >= 2 && e <= 8) && bad++ < 5) fail(`${y}: domingo de Epifanía el ${ymd(k.epifaniaDomingo)}`);
    const b = k.bautismo.getDate();
    if (!(k.bautismo.getMonth() === 0 && b >= 7 && b <= 13) && bad++ < 5) fail(`${y}: Bautismo del Señor el ${ymd(k.bautismo)}`);
  }
  checks++;
  if (bad) fail(`keyDates: ${bad} problemas entre 1900 y 2200`);
}

// ─────────────────────────── Tiempos y colores ───────────────────────────
section('Tiempos y colores');
const CASES = [
  // [fecha, id, color, week, special]
  ['2026-11-22', 'ordinario', 'blanco', 34, 'cristo-rey'],
  ['2026-11-23', 'ordinario', 'verde', 34, null],
  ['2026-11-28', 'ordinario', 'verde', 34, null],
  ['2026-11-29', 'adviento', 'morado', 1, null],
  ['2026-12-06', 'adviento', 'morado', 2, null],
  ['2026-12-13', 'adviento', 'rosado', 3, 'gaudete'],
  ['2026-12-20', 'adviento', 'morado', 4, null],
  ['2026-12-24', 'adviento', 'morado', 4, 'nochebuena'],
  ['2026-12-25', 'navidad', 'blanco', null, 'navidad'],
  ['2026-12-31', 'navidad', 'blanco', null, null],
  ['2027-01-01', 'navidad', 'blanco', null, null],
  ['2027-01-06', 'navidad', 'blanco', null, 'epifania'],
  ['2027-01-10', 'navidad', 'blanco', null, 'bautismo'],
  ['2027-01-11', 'ordinario', 'verde', 1, null],
  ['2027-01-17', 'ordinario', 'verde', 2, null],
  ['2027-02-09', 'ordinario', 'verde', 5, null],
  ['2027-02-10', 'cuaresma', 'morado', null, 'cenizas'],
  ['2027-02-13', 'cuaresma', 'morado', null, null],
  ['2027-02-14', 'cuaresma', 'morado', 1, null],
  ['2027-03-07', 'cuaresma', 'rosado', 4, 'laetare'],
  ['2027-03-21', 'cuaresma', 'rojo', 6, 'ramos'],
  ['2027-03-24', 'cuaresma', 'morado', 6, null],
  ['2027-03-25', 'triduo', 'blanco', null, 'jueves-santo'],
  ['2027-03-26', 'triduo', 'rojo', null, 'viernes-santo'],
  ['2027-03-27', 'triduo', 'morado', null, 'sabado-santo'],
  ['2027-03-28', 'pascua', 'blanco', 1, 'pascua'],
  ['2027-04-04', 'pascua', 'blanco', 2, null],
  ['2027-05-06', 'pascua', 'blanco', 6, null],
  ['2027-05-09', 'pascua', 'blanco', 7, 'ascension'],
  ['2027-05-15', 'pascua', 'blanco', 7, null],
  ['2027-05-16', 'pascua', 'rojo', null, 'pentecostes'],
  ['2027-05-17', 'ordinario', 'verde', 7, null],
  ['2027-05-23', 'ordinario', 'blanco', 8, 'trinidad'],
  ['2027-11-21', 'ordinario', 'blanco', 34, 'cristo-rey'],
  ['2026-05-25', 'ordinario', 'verde', 8, null],
  ['2025-06-09', 'ordinario', 'verde', 10, null],
  ['2028-12-24', 'adviento', 'morado', 4, 'nochebuena'],
  ['2028-12-03', 'adviento', 'morado', 1, null],
];
for (const [s, id, color, week, special] of CASES) {
  const r = seasonOf(s);
  eq(r.id, id, `seasonOf(${s}).id`);
  eq(r.color, color, `seasonOf(${s}).color`);
  eq(r.week, week, `seasonOf(${s}).week`);
  eq(r.special, special, `seasonOf(${s}).special`);
}
eq(seasonOf('2027-03-21').weekLabel, 'Semana Santa', 'Domingo de Ramos: weekLabel');
eq(seasonOf('2026-12-13').weekLabel, 'Tercera semana de Adviento', 'Gaudete: weekLabel');
eq(seasonOf('2027-04-04').weekLabel, 'Segunda semana de Pascua', 'Segundo domingo de Pascua: weekLabel');
eq(seasonOf('2026-11-23').weekLabel, 'Semana 34 del tiempo ordinario', 'Tiempo ordinario: weekLabel');
eq(seasonOf('2026-12-25').weekLabel, null, 'Navidad: weekLabel');
eq(seasonOf('2026-11-29').label, 'Tiempo de Adviento', 'label de Adviento');
// Formas de pasar la fecha: Date con hora, milisegundos y 'AAAA-MM-DD' (como fecha local).
eq(seasonOf(new Date(2026, 11, 24, 23, 59, 59)).special, 'nochebuena', 'Date a las 23:59 sigue siendo el mismo día');
eq(seasonOf(new Date(2026, 11, 25, 0, 0, 1)).special, 'navidad', 'Date a las 00:00:01 ya es el día siguiente');
eq(seasonOf(new Date(2026, 11, 25, 12).getTime()).special, 'navidad', 'seasonOf acepta milisegundos');
eq(seasonOf().id, seasonOf(new Date()).id, 'seasonOf sin argumento usa hoy');
{
  let threw = false;
  try { seasonOf(new Date('no es fecha')); } catch (e) { threw = e instanceof TypeError; }
  ok(threw, 'una fecha inválida lanza TypeError');
}
eq(colorHex('morado'), '#6b3fa0', 'colorHex morado');
eq(colorHex('rosado'), '#e48fb3', 'colorHex rosado');
eq(colorHex('nada'), colorHex('verde'), 'colorHex de un color desconocido');
for (const c of ['morado', 'blanco', 'verde', 'rojo', 'rosado']) ok(/^#[0-9a-f]{6}$/.test(colorHex(c)), `colorHex(${c}) es #rrggbb`);

// ─────────────────────────── Corona de Adviento y novena ───────────────────────────
section('Corona de Adviento y novena');
const CANDLES = [
  ['2026-11-28', 0], ['2026-11-29', 1], ['2026-12-05', 1], ['2026-12-06', 2], ['2026-12-12', 2], ['2026-12-13', 3],
  ['2026-12-19', 3], ['2026-12-20', 4], ['2026-12-24', 4], ['2026-12-25', 0], ['2026-12-31', 0], ['2027-01-03', 0],
  ['2026-07-01', 0], ['2025-11-29', 0], ['2025-11-30', 1], ['2025-12-21', 4], ['2025-12-24', 4], ['2027-11-28', 1],
  ['2027-12-19', 4], ['2028-12-02', 0], ['2028-12-03', 1], ['2028-12-24', 4],
];
for (const [s, n] of CANDLES) {
  eq(adventCandles(s), n, `adventCandles(${s})`);
  eq(adventWeek(s), n || null, `adventWeek(${s})`);
}
eq(novenaDay('2026-12-15'), null, 'novenaDay 15 de diciembre');
eq(novenaDay('2026-12-16'), 1, 'novenaDay 16 de diciembre');
eq(novenaDay('2026-12-20'), 5, 'novenaDay 20 de diciembre');
eq(novenaDay('2026-12-24'), 9, 'novenaDay 24 de diciembre');
eq(novenaDay('2026-12-25'), null, 'novenaDay 25 de diciembre');
eq(novenaDay('2026-11-16'), null, 'novenaDay 16 de noviembre');

// ─────────────────────────── Fiestas ───────────────────────────
section('Fiestas');
const ids = list => list.map(f => f.id);
ok(ids(feastsOn('2026-08-04')).includes('cura-de-ars'), 'feastsOn(4 de agosto de 2026) incluye al Santo Cura de Ars');
ok(ids(feastsOn('2026-06-07')).includes('corpus-christi'), 'Corpus Christi 2026: domingo 7 de junio (Perú)');
ok(!ids(feastsOn('2026-06-04')).includes('corpus-christi'), 'Corpus Christi 2026 no es el jueves 4 de junio en la app');
ok(ids(feastsOn('2026-04-05')).includes('pascua-de-resurreccion'), 'feastsOn(Pascua 2026)');
ok(ids(feastsOn('2026-06-12')).includes('sagrado-corazon'), 'feastsOn(Sagrado Corazón 2026)');
ok(ids(feastsOn('2026-12-25')).includes('navidad'), 'feastsOn(Navidad 2026)');
ok(ids(feastsOn('2027-01-06')).includes('bajada-de-reyes'), 'feastsOn(6 de enero de 2027)');
eq(feastsOn('2026-11-23').length, 0, 'feastsOn(23 de noviembre de 2026) está vacío');
ok(feastsOn('2026-10-18')[0] === FEASTS.find(f => f.id === 'senor-de-los-milagros'), 'feastsOn devuelve los mismos objetos de FEASTS');

const FIXED = {
  'santa-maria-madre-de-dios': [1, 1], 'bajada-de-reyes': [1, 6], candelaria: [2, 2], 'cruz-de-mayo': [5, 3],
  'san-pedro-y-san-pablo': [6, 29], 'cura-de-ars': [8, 4], asuncion: [8, 15], 'santa-rosa-de-lima': [8, 30],
  'virgen-de-cocharcas': [9, 8], 'senor-de-los-milagros': [10, 18], 'todos-los-santos': [11, 1], 'fieles-difuntos': [11, 2],
  'san-martin-de-porres': [11, 3], 'inmaculada-concepcion': [12, 8], navidad: [12, 25],
};
for (const [id, [m, d]] of Object.entries(FIXED)) {
  for (const y of [2025, 2026, 2027, 2030, 2035]) eqDay(feastDate(id, y), `${y}-${pad(m)}-${pad(d)}`, `feastDate(${id}, ${y})`);
}
// Traslados de solemnidades (los años pasados son los que se celebraron así).
const MOVED = [
  ['san-jose', 2026, '2026-03-19'], ['san-jose', 2023, '2023-03-20'], ['san-jose', 2028, '2028-03-20'],
  ['san-jose', 2008, '2008-03-15'], ['san-jose', 2035, '2035-03-17'], ['san-jose', 2034, '2034-03-20'],
  ['anunciacion', 2026, '2026-03-25'], ['anunciacion', 2027, '2027-04-05'], ['anunciacion', 2029, '2029-04-09'],
  ['anunciacion', 2018, '2018-04-09'], ['anunciacion', 2008, '2008-03-31'], ['anunciacion', 2035, '2035-04-02'],
  ['anunciacion', 2024, '2024-04-08'],
];
for (const [id, y, s] of MOVED) eqDay(feastDate(id, y), s, `feastDate(${id}, ${y})`);
eqDay(feastDate(FEASTS.find(f => f.id === 'navidad'), 2026), '2026-12-25', 'feastDate acepta el objeto de la fiesta');
eq(feastDate('no-existe', 2026), null, 'feastDate de un id desconocido');
eq(feastDate({ id: 'x', rule: { month: 2, day: 29 } }, 2027), null, '29 de febrero en un año no bisiesto');
eqDay(feastDate({ id: 'x', rule: { month: 2, day: 29 } }, 2028), '2028-02-29', '29 de febrero en un año bisiesto');
eqDay(feastDate({ id: 'x', rule: { month: 10, nthWeekday: { weekday: 0, n: 1 } } }, 2026), '2026-10-04', 'primer domingo de octubre de 2026');
eqDay(feastDate({ id: 'x', rule: { month: 10, nthWeekday: { weekday: 0, n: -1 } } }, 2026), '2026-10-25', 'último domingo de octubre de 2026');
eqDay(feastDate({ id: 'x', rule: { month: 1, nthWeekday: { weekday: 1, n: 2 } } }, 2027), '2027-01-11', 'segundo lunes de enero de 2027');
eq(feastDate({ id: 'x', rule: { month: 2, nthWeekday: { weekday: 0, n: 5 } } }, 2026), null, 'quinto domingo de febrero de 2026 (no hay)');
{
  let bad = 0;
  for (let y = 1990; y <= 2110; y++) {
    if (ymd(feastDate('corpus-christi', y)) !== ymd(keyDates(y).corpusDomingo) && bad++ < 3) fail(`Corpus Christi ${y}`);
    if (ymd(feastDate('sagrado-corazon', y)) !== ymd(keyDates(y).sagradoCorazon) && bad++ < 3) fail(`Sagrado Corazón ${y}`);
    if (ymd(feastDate('pascua-de-resurreccion', y)) !== ymd(keyDates(y).pascua) && bad++ < 3) fail(`Pascua (fiesta) ${y}`);
    for (const f of FEASTS) {
      const d = feastDate(f, y);
      if (!(d instanceof Date) || d.getFullYear() !== y) { if (bad++ < 3) fail(`${f.id}: sin fecha válida en ${y}`); continue; }
      // Una solemnidad trasladada no puede quedar en Semana Santa, en la Octava de Pascua ni en un domingo impedido.
      if (f.rule.transfer) {
        const s = seasonOf(d);
        const p = keyDates(y).pascua;
        const fromPalms = Math.round((Date.UTC(y, d.getMonth(), d.getDate()) - Date.UTC(y, p.getMonth(), p.getDate() - 7)) / 864e5);
        if ((fromPalms >= 0 && fromPalms <= 14) || s.id === 'triduo' || (d.getDay() === 0 && ['adviento', 'cuaresma', 'pascua'].includes(s.id))) {
          if (bad++ < 3) fail(`${f.id} ${y}: quedó en un día impedido (${ymd(d)})`);
        }
      }
    }
  }
  checks++;
  if (bad) fail(`fechas de las fiestas: ${bad} problemas`);
}

// Próximas fiestas.
{
  const r = nextFeasts('2026-11-23');
  eq(r.length, 3, 'nextFeasts devuelve 3 por defecto');
  eq(r.map(x => x.feast.id).join(','), 'inmaculada-concepcion,navidad,santa-maria-madre-de-dios', 'nextFeasts desde el 23 de noviembre de 2026');
  eq(r.map(x => ymd(x.date)).join(','), '2026-12-08,2026-12-25,2027-01-01', 'nextFeasts: fechas');
  eq(r.map(x => x.days).join(','), '15,32,39', 'nextFeasts: días que faltan');
  eq(nextFeasts('2026-12-08', 1)[0].feast.id, 'navidad', 'nextFeasts no repite la fiesta de ese mismo día');
  eq(nextFeasts('2026-11-23', 0).length, 0, 'nextFeasts(fecha, 0)');
}
for (const start of ['2026-11-23', '2027-03-20', '2028-12-31', '2025-01-01']) {
  const list = nextFeasts(start, Infinity);
  const from = new Date(Number(start.slice(0, 4)), Number(start.slice(5, 7)) - 1, Number(start.slice(8, 10)));
  // Lo mismo, a la fuerza: recorrer los 400 días siguientes con feastsOn.
  const brute = [];
  const seen = new Set();
  for (let k = 1; k <= 400; k++) {
    const d = add(from, k);
    for (const f of feastsOn(d)) if (!seen.has(f.id)) { seen.add(f.id); brute.push(`${f.id}@${ymd(d)}#${k}`); }
  }
  eq(list.map(x => `${x.feast.id}@${ymd(x.date)}#${x.days}`).join(' '), brute.join(' '), `nextFeasts(${start}) coincide con recorrer día por día`);
  ok(list.every((x, i) => x.days > 0 && x.days <= 400 && (i === 0 || list[i - 1].days <= x.days)), `nextFeasts(${start}): fechas posteriores y ordenadas`);
  eq(new Set(list.map(x => x.feast.id)).size, list.length, `nextFeasts(${start}): cada fiesta una sola vez`);
}

// ─────────────────────────── Día por día ───────────────────────────
section('Día por día');
{
  const SEASON_IDS = ['adviento', 'navidad', 'ordinario', 'cuaresma', 'triduo', 'pascua'];
  const COLORS = ['morado', 'blanco', 'verde', 'rojo', 'rosado'];
  const NEXT = { navidad: 'ordinario', ordinario: ['cuaresma', 'adviento'], cuaresma: 'triduo', triduo: 'pascua', pascua: 'ordinario', adviento: 'navidad' };
  const SPECIAL_DOW = { gaudete: 0, laetare: 0, ramos: 0, pascua: 0, ascension: 0, pentecostes: 0, trinidad: 0, 'cristo-rey': 0, bautismo: 0,
    cenizas: 3, 'jueves-santo': 4, 'viernes-santo': 5, 'sabado-santo': 6 };
  const RUN = { cuaresma: [43, 43], triduo: [3, 3], pascua: [50, 50], adviento: [22, 28], navidad: [14, 20] };
  const [y0, y1] = CHILD ? [1995, 2045] : [1900, 2150];
  const specialsSeen = new Set();
  let bad = 0;
  const report = msg => { if (bad++ < 8) fail(msg); };
  let prev = null;
  let run = 0;
  let perYear = {};
  for (let d = D(y0, 1, 1); d.getFullYear() <= y1; d = add(d, 1)) {
    const s = seasonOf(d);
    const day = ymd(d);
    if (!SEASON_IDS.includes(s.id)) report(`${day}: tiempo desconocido ${s.id}`);
    if (!COLORS.includes(s.color)) report(`${day}: color desconocido ${s.color}`);
    if (s.label !== SEASONS[s.id]?.title) report(`${day}: label «${s.label}» distinto del title de SEASONS`);
    if ((s.week === null) !== (s.weekLabel === null)) report(`${day}: week y weekLabel no van juntos`);
    const W = { adviento: [1, 4], cuaresma: [1, 6], pascua: [1, 7], ordinario: [1, 34] }[s.id];
    if (s.week !== null && (!W || !Number.isInteger(s.week) || s.week < W[0] || s.week > W[1])) report(`${day}: semana ${s.week} fuera de rango en ${s.id}`);
    if (s.week === null && ['adviento', 'ordinario'].includes(s.id)) report(`${day}: falta la semana de ${s.id}`);
    if (s.week === null && s.id === 'cuaresma' && !['cenizas', null].includes(s.special)) report(`${day}: Cuaresma sin semana`);
    if (s.week === null && s.id === 'pascua' && s.special !== 'pentecostes') report(`${day}: Pascua sin semana`);
    if (s.special) {
      specialsSeen.add(s.special);
      if (!SPECIAL_DAYS[s.special]) report(`${day}: el día especial ${s.special} no está en SPECIAL_DAYS`);
      if (s.special in SPECIAL_DOW && d.getDay() !== SPECIAL_DOW[s.special]) report(`${day}: ${s.special} cae ${WEEKDAY[d.getDay()]}`);
      const y = d.getFullYear();
      perYear[y] = perYear[y] || {};
      perYear[y][s.special] = (perYear[y][s.special] || 0) + 1;
    }
    if (s.special === 'navidad' && day.slice(5) !== '12-25') report(`${day}: Navidad fuera del 25 de diciembre`);
    if (s.special === 'nochebuena' && day.slice(5) !== '12-24') report(`${day}: Nochebuena fuera del 24 de diciembre`);
    if (s.special === 'epifania' && day.slice(5) !== '01-06') report(`${day}: Epifanía fuera del 6 de enero`);
    if (day.slice(5) === '12-25' && s.special !== 'navidad') report(`${day}: el 25 de diciembre no es Navidad`);
    if (adventCandles(d) !== (s.id === 'adviento' ? s.week : 0)) report(`${day}: adventCandles ${adventCandles(d)} con ${s.id} semana ${s.week}`);
    if (adventWeek(d) !== (s.id === 'adviento' ? s.week : null)) report(`${day}: adventWeek ${adventWeek(d)}`);
    const nd = novenaDay(d);
    if (nd !== (d.getMonth() === 11 && d.getDate() >= 16 && d.getDate() <= 24 ? d.getDate() - 15 : null)) report(`${day}: novenaDay ${nd}`);
    if (prev) {
      if (prev.s.id === s.id) {
        run++;
        if (prev.s.week !== null && s.week !== null && prev.s.week !== s.week && (d.getDay() !== 0 || s.week !== prev.s.week + 1)) report(`${day}: la semana pasa de ${prev.s.week} a ${s.week} un ${WEEKDAY[d.getDay()]}`);
        if (prev.s.week === null && s.week !== null && s.id === 'cuaresma' && d.getDay() !== 0) report(`${day}: la primera semana de Cuaresma no empieza en domingo`);
      } else {
        const ok1 = [].concat(NEXT[prev.s.id]).includes(s.id);
        if (!ok1) report(`${day}: de ${prev.s.id} se pasa a ${s.id}`);
        const lim = RUN[prev.s.id];
        if (lim && prev.started && (run < lim[0] || run > lim[1])) report(`${ymd(prev.d)}: ${prev.s.id} duró ${run} días`);
        if (prev.s.id === 'ordinario' && s.id === 'adviento' && prev.s.week !== 34) report(`${ymd(prev.d)}: el último día antes del Adviento está en la semana ${prev.s.week}`);
        if (s.id === 'ordinario' && prev.s.id === 'navidad' && s.week !== 1) report(`${day}: el tiempo ordinario empieza en la semana ${s.week}`);
        run = 1;
      }
    } else run = 1;
    prev = { d, s, started: prev ? (prev.s.id === s.id ? prev.started : true) : false };
  }
  for (const [y, counts] of Object.entries(perYear)) {
    for (const sp of Object.keys(SPECIAL_DAYS)) if (counts[sp] !== 1) report(`${y}: el día especial ${sp} aparece ${counts[sp] || 0} veces`);
  }
  for (const sp of Object.keys(SPECIAL_DAYS)) if (!specialsSeen.has(sp)) report(`SPECIAL_DAYS.${sp} nunca lo marca seasonOf`);
  for (const sp of ['gaudete', 'laetare', 'cenizas', 'ramos', 'jueves-santo', 'viernes-santo', 'sabado-santo', 'pascua', 'pentecostes', 'navidad', 'epifania', 'cristo-rey']) {
    if (!SPECIAL_DAYS[sp]) report(`falta SPECIAL_DAYS.${sp}`);
  }
  checks++;
  if (bad) fail(`recorrido día por día ${y0}–${y1}: ${bad} problemas`);
}

// ─────────────────────────── Datos (js/data/fiestas.js) ───────────────────────────
section('Datos de las fiestas');
const COLORS4 = ['blanco', 'rojo', 'morado', 'verde'];
const EMOJI = /\p{Extended_Pictographic}/u;
const isStr = (v, min = 1) => typeof v === 'string' && v.trim().length >= min;
function sentences(s) {
  return s.trim().split(/(?<=[.!?…][»”)\]]*)\s+/u).filter(p => /[\p{L}\p{N}]/u.test(p)).length;
}
const count = (s, ch) => s.split(ch).length - 1;
function checkText(where, v, { max = 320, min = 3, sent = null } = {}) {
  if (!ok(isStr(v, min), `${where}: texto vacío o muy corto`)) return;
  ok(v.length <= max, `${where}: ${v.length} caracteres (máximo ${max})`);
  ok(v === v.trim() && !/\s{2,}/.test(v), `${where}: espacios de más`);
  ok(!/[<>]/.test(v), `${where}: sin HTML`);
  ok(!/["“”]/.test(v), `${where}: comillas «» y no " "`);
  ok(count(v, '«') === count(v, '»'), `${where}: comillas «» sin cerrar`);
  ok(count(v, '¿') === count(v, '?'), `${where}: falta «¿» o «?»`);
  ok(count(v, '¡') === count(v, '!'), `${where}: falta «¡» o «!»`);
  ok(!/(?<!\p{L})[IVXLCDM]{2,}(?!\p{L})|(?<!\p{L})[IVX](?!\p{L})/u.test(v), `${where}: sin números romanos`);
  ok(!/\d\s*\.?\s*[ºª°]/.test(v), `${where}: sin abreviaturas de ordinales («primero», no «1.º»)`);
  ok(!/(?<!\p{L})(?:Sto|Sta|Sr|Sra|Dr|Dra|Pbro|Mons|Fr|Hno|Hna|Nro|Av|Jr|etc|aprox|pág|S|N)\.(?=\s|$)|\bp\.\s?ej\.|(?<!\p{L})[ap]\.\s?m\./u.test(v), `${where}: sin abreviaturas`);
  if (sent) ok(sentences(v) >= sent[0] && sentences(v) <= sent[1], `${where}: ${sentences(v)} frases (se esperan ${sent[0]}–${sent[1]})`);
}

// SEASONS
eq(Object.keys(SEASONS).sort().join(','), 'adviento,cuaresma,navidad,ordinario,pascua,triduo', 'SEASONS: claves');
for (const [id, s] of Object.entries(SEASONS)) {
  const w = `SEASONS.${id}`;
  checkText(`${w}.title`, s.title, { max: 40 });
  ok(['morado', 'blanco', 'verde', 'rojo', 'rosado'].includes(s.color), `${w}.color`);
  ok(isStr(s.emoji) && EMOJI.test(s.emoji), `${w}.emoji`);
  checkText(`${w}.text`, s.text, { max: 330, sent: [2, 3] });
  checkText(`${w}.kidLine`, s.kidLine, { max: 90 });
  checkText(`${w}.tip`, s.tip, { max: 240, min: 30 });
}
// El color y el nombre de cada tiempo coinciden con lo que calcula liturgy.js en un día cualquiera de ese tiempo.
for (const [id, day] of [['adviento', '2027-11-29'], ['navidad', '2027-12-27'], ['ordinario', '2027-01-12'], ['cuaresma', '2027-02-11'], ['triduo', '2027-03-26'], ['pascua', '2027-03-29']]) {
  const s = seasonOf(day);
  eq(s.id, id, `día de muestra de ${id}`);
  eq(SEASONS[id].color, s.color, `SEASONS.${id}.color igual al de liturgy.js`);
  eq(SEASONS[id].title, s.label, `SEASONS.${id}.title igual al label de liturgy.js`);
}

// SPECIAL_DAYS
for (const [id, s] of Object.entries(SPECIAL_DAYS)) {
  const w = `SPECIAL_DAYS.${id}`;
  ok(/^[a-z0-9-]+$/.test(id), `${w}: id con a-z, 0-9 y guiones`);
  checkText(`${w}.title`, s.title, { max: 40 });
  ok(isStr(s.emoji) && EMOJI.test(s.emoji), `${w}.emoji`);
  checkText(`${w}.kidLine`, s.kidLine, { max: 90 });
  checkText(`${w}.text`, s.text, { max: 240, sent: [1, 2] });
  if (s.feast !== undefined) ok(FEASTS.some(f => f.id === s.feast), `${w}.feast apunta a una fiesta que existe (${s.feast})`);
}
// La fiesta enlazada cae el mismo día que el día especial.
for (let y = 2020; y <= 2040; y++) {
  const k = keyDates(y);
  for (const [sp, d] of [['pascua', k.pascua], ['navidad', k.navidad], ['epifania', k.epifania]]) {
    eq(seasonOf(d).special, sp, `${sp} ${y}`);
    ok(feastsOn(d).some(f => f.id === SPECIAL_DAYS[sp].feast), `${sp} ${y}: feastsOn incluye ${SPECIAL_DAYS[sp].feast}`);
  }
}

// FEASTS
{
  const seen = new Set();
  for (const f of FEASTS) {
    const w = `FEASTS.${f.id}`;
    ok(isStr(f.id) && /^[a-z0-9-]+$/.test(f.id), `${w}: id con a-z, 0-9 y guiones`);
    ok(!seen.has(f.id), `${w}: id repetido`);
    seen.add(f.id);
    checkText(`${w}.title`, f.title, { max: 60 });
    ok(isStr(f.emoji) && EMOJI.test(f.emoji), `${w}.emoji`);
    const r = f.rule || {};
    const fixed = Number.isInteger(r.month) && r.month >= 1 && r.month <= 12 && Number.isInteger(r.day) && r.day >= 1 && r.day <= 31 && !r.from && !r.nthWeekday;
    const movable = r.from === 'pascua' && Number.isInteger(r.offset) && r.month === undefined;
    const nth = Number.isInteger(r.month) && r.nthWeekday && Number.isInteger(r.nthWeekday.weekday) && Number.isInteger(r.nthWeekday.n) && r.day === undefined;
    ok(fixed || movable || nth, `${w}.rule: { month, day } | { from: 'pascua', offset } | { month, nthWeekday }`);
    ok(r.transfer === undefined || ['antes', 'despues'].includes(r.transfer), `${w}.rule.transfer: 'antes' | 'despues'`);
    ok(COLORS4.includes(f.color), `${w}.color: ${COLORS4.join(' | ')}`);
    ok(SCENE_IDS.includes(f.bg), `${w}.bg debe ser uno de SCENE_IDS (js/art/scenes.js)`);
    ok(Array.isArray(f.emojis) && f.emojis.length >= 2 && f.emojis.length <= 4 && f.emojis.every(e => isStr(e) && EMOJI.test(e)), `${w}.emojis: 2–4 emojis`);
    ok(Array.isArray(f.paragraphs) && f.paragraphs.length >= 2 && f.paragraphs.length <= 3, `${w}.paragraphs: 2–3 párrafos`);
    (f.paragraphs || []).forEach((p, i) => {
      checkText(`${w}.paragraphs[${i}]`, p, { max: 300, min: 40 });
      ok(!/(?<!\p{L})hoy(?!\p{L})/iu.test(p), `${w}.paragraphs[${i}]: sin «hoy» (se muestra también en próximas fiestas)`);
    });
    checkText(`${w}.prayer`, f.prayer, { max: 200, min: 20, sent: [1, 2] });
    ok(!/(?<!\p{L})hoy(?!\p{L})/iu.test(f.prayer || ''), `${w}.prayer: sin «hoy»`);
    ok(typeof f.peru === 'boolean' && typeof f.local === 'boolean', `${w}: peru y local son true o false`);
  }
  const NEED = ['bajada-de-reyes', 'candelaria', 'san-jose', 'cruz-de-mayo', 'corpus-christi', 'santa-rosa-de-lima', 'cura-de-ars',
    'virgen-de-cocharcas', 'senor-de-los-milagros', 'todos-los-santos', 'san-martin-de-porres', 'inmaculada-concepcion', 'navidad'];
  for (const id of NEED) ok(seen.has(id), `FEASTS: falta ${id}`);
  const byId = Object.fromEntries(FEASTS.map(f => [f.id, f]));
  ok(byId['cura-de-ars']?.local === true, 'el Santo Cura de Ars es local');
  ok(byId['virgen-de-cocharcas']?.local === true, 'la Virgen de Cocharcas es local');
  ok(byId['santa-rosa-de-lima']?.peru === true && byId['senor-de-los-milagros']?.peru === true && byId['san-martin-de-porres']?.peru === true, 'santos y devociones del Perú marcados con peru');
  ok(byId['senor-de-los-milagros'] && /18, el 19 y el 28 de octubre/.test(byId['senor-de-los-milagros'].paragraphs.join(' ')), 'el Señor de los Milagros menciona las procesiones del 18, 19 y 28 de octubre');
  ok(!FEASTS.some(f => /ramos/.test(f.id)), 'el Domingo de Ramos no está en FEASTS (está en SPECIAL_DAYS)');
}

// ADVENT_WEEKS
eq(ADVENT_WEEKS.length, 4, 'ADVENT_WEEKS: cuatro semanas');
ADVENT_WEEKS.forEach((a, i) => {
  const w = `ADVENT_WEEKS[${i}]`;
  eq(a.week, i + 1, `${w}.week`);
  eq(a.candle, i === 2 ? 'rosado' : 'morado', `${w}.candle`);
  checkText(`${w}.title`, a.title, { max: 40 });
  checkText(`${w}.text`, a.text, { max: 200, sent: [1, 2] });
  checkText(`${w}.kidLine`, a.kidLine, { max: 90 });
});
eq(seasonOf(keyDates(2026).adviento3).color, ADVENT_WEEKS[2].candle, 'la vela de la tercera semana tiene el color del domingo Gaudete');

// NOVENA
eq(NOVENA.length, 9, 'NOVENA: nueve días');
NOVENA.forEach((n, i) => {
  const w = `NOVENA[${i}]`;
  eq(n.day, i + 1, `${w}.day`);
  eq(novenaDay(D(2026, 12, 15 + n.day)), n.day, `${w}: novenaDay del ${15 + n.day} de diciembre`);
  checkText(`${w}.figure`, n.figure, { max: 40 });
  ok(isStr(n.emoji) && EMOJI.test(n.emoji), `${w}.emoji`);
  checkText(`${w}.text`, n.text, { max: 170, sent: [1, 2] });
});
ok(/Niño Jesús/.test(NOVENA[8]?.figure || ''), 'el noveno día (24 de diciembre) se pone al Niño Jesús');

// LENT_TIPS
ok(Array.isArray(LENT_TIPS) && LENT_TIPS.length >= 6 && LENT_TIPS.length <= 8, 'LENT_TIPS: 6–8 ideas');
LENT_TIPS.forEach((t, i) => checkText(`LENT_TIPS[${i}]`, t, { max: 110, min: 15, sent: [1, 1] }));
eq(new Set(LENT_TIPS).size, LENT_TIPS.length, 'LENT_TIPS: sin repetidas');

// ─────────────────────────── Zonas horarias ───────────────────────────
if (!CHILD) {
  section('Zonas horarias');
  // Lima (la de verdad), UTC, los dos extremos del planeta y zonas donde el cambio de horario se salta la medianoche.
  const ZONES = ['America/Lima', 'UTC', 'Pacific/Kiritimati', 'Pacific/Pago_Pago', 'America/Santiago', 'America/Sao_Paulo', 'Asia/Tehran'];
  for (const tz of ZONES) {
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], {
      env: { ...process.env, TZ: tz, PALOMITA_LITURGY_TZ_CHILD: '1' }, encoding: 'utf8', timeout: 120000,
    });
    const out = `${r.stdout || ''}${r.stderr || ''}`.trim().split('\n').filter(Boolean);
    ok(r.status === 0, `TZ=${tz}: ${out.slice(-4).join(' | ') || r.error?.message || 'falló'}`);
  }
}

const summary = `${checks} comprobaciones · ${failures.length} fallo(s)`;
console.log(CHILD ? `[TZ=${process.env.TZ}] ${summary}` : `\n${summary}`);
process.exit(failures.length ? 1 : 0);
