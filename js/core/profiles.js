// Perfiles: varios niños (por ejemplo hermanos) en el mismo teléfono. Cada uno tiene su palomita, su avance,
// sus figuritas y sus fotos; los datos de la parroquia (horarios, fechas, avisos) se comparten.
// El perfil 1 usa las claves de siempre (así una partida anterior pasa a ser el perfil 1 sin migrar nada);
// los demás agregan «@p2», «@p3»… al final de la clave.
//
//   activeId() → 'p1' | 'p2' | …           keyFor(base, id?) → clave de localStorage de ese perfil
//   list() → [{ id, kid, name, level, created }]   (nombre del niño, de su palomita y su nivel, leídos de cada partida)
//   canAdd() / add() → id                  crea un perfil vacío (la bienvenida se muestra al entrar)
//   remove(id)                             borra un perfil y todos sus datos (no el perfil 1)
//   switchTo(id)                           cambia de perfil y recarga la app
//   PER_PROFILE                            claves que son de cada niño
const PKEY = 'palomita.profiles.v1';
export const MAX_PROFILES = 4;
export const PER_PROFILE = ['palomita.save.v1', 'palomita.stickers.v1', 'palomita.photos.v1'];

function read() {
  try {
    const p = JSON.parse(localStorage.getItem(PKEY) || 'null');
    if (p && Array.isArray(p.list) && p.list.length) {
      const list = p.list.filter(x => x && /^p\d+$/.test(x.id));
      if (!list.some(x => x.id === 'p1')) list.unshift({ id: 'p1', created: 0 });
      return { active: list.some(x => x.id === p.active) ? p.active : 'p1', list };
    }
  } catch { /* sin perfiles guardados */ }
  return { active: 'p1', list: [{ id: 'p1', created: 0 }] };
}
let P = read();
function write() { try { localStorage.setItem(PKEY, JSON.stringify(P)); } catch { /* sin espacio */ } }

export function activeId() { return P.active; }
export function keyFor(base, id = P.active) { return id === 'p1' ? base : `${base}@${id}`; }

export function list() {
  return P.list.map(x => {
    let kid = '', name = 'Palomita', level = 1;
    try {
      const s = JSON.parse(localStorage.getItem(keyFor('palomita.save.v1', x.id)) || 'null');
      if (s) { kid = String(s.kid || ''); name = String(s.name || 'Palomita'); level = Number(s.level) || 1; }
    } catch { /* partida ilegible */ }
    return { id: x.id, created: x.created || 0, kid, name, level };
  });
}
export function count() { return P.list.length; }
export function canAdd() { return P.list.length < MAX_PROFILES; }
export function add() {
  if (!canAdd()) return null;
  let n = 2;
  while (P.list.some(x => x.id === `p${n}`)) n++;
  const id = `p${n}`;
  P.list.push({ id, created: Date.now() });
  write();
  return id;
}
export function remove(id) {
  if (id === 'p1' || !P.list.some(x => x.id === id)) return false;
  for (const base of PER_PROFILE) {
    try { localStorage.removeItem(keyFor(base, id)); localStorage.removeItem(keyFor(base, id) + '.prev'); } catch { /* nada */ }
  }
  P.list = P.list.filter(x => x.id !== id);
  if (P.active === id) P.active = 'p1';
  write();
  return true;
}
export function switchTo(id) {
  if (!P.list.some(x => x.id === id)) return;
  P.active = id;
  write();
  try { sessionStorage.setItem('palomita.profilePicked', '1'); } catch { /* nada */ }
  location.reload();
}
// ¿Ya se eligió quién juega en esta apertura de la app? (para no preguntar en cada pantalla)
export function picked() { try { return sessionStorage.getItem('palomita.profilePicked') === '1'; } catch { return true; } }
export function markPicked() { try { sessionStorage.setItem('palomita.profilePicked', '1'); } catch { /* nada */ } }
