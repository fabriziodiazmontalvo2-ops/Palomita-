// Catálogo de minijuegos. Cada juego está ligado a una parábola o historia (js/data/parables.js → PARABLES[parable]).
//
// Campos:
//   id        identificador y nombre del archivo: js/games/<id>.js
//   title     nombre del juego          parable  id en PARABLES
//   icon      emoji del juego           colors   [c1, c2] degradado de su tarjeta     scoreIcon  emoji del marcador
//   how       instrucciones cortas (2–3 renglones) que se muestran antes de jugar
//   hud       { lives: n } y/o { time: segundos } — lo administra el motor (engine.js)
//   goal      puntaje para ganar la estampita           goalText  texto de la meta
//   coinRate  semillas por punto         maxCoins  tope de semillas por partida
//   load      importación perezosa del módulo del juego
export const GAMES = [
  {
    id: 'noe', scoreIcon: '🌿', title: 'El vuelo de la paloma', parable: 'noe', icon: '🕊️', colors: ['#5db8ee', '#8f7be8'],
    how: ['Mantén presionada la pantalla para subir.', 'Suelta para bajar.', 'Junta ramitas de olivo y esquiva las nubes de tormenta.'],
    hud: { lives: 3 }, goal: 20, goalText: 'Junta 20 ramitas de olivo', coinRate: 1.5, maxCoins: 45,
    load: () => import('./noe.js'),
  },
  {
    id: 'oveja', scoreIcon: '🐑', title: 'Busca a la ovejita', parable: 'oveja', icon: '🐑', colors: ['#62c370', '#2f9c8f'],
    how: ['Desliza el dedo para mover al pastor por el laberinto.', 'Encuentra a la ovejita perdida antes de que se acabe el tiempo.'],
    hud: { time: 80 }, goal: 4, goalText: 'Encuentra 4 ovejitas', coinRate: 8, maxCoins: 45,
    load: () => import('./oveja.js'),
  },
  {
    id: 'sembrador', scoreIcon: '🌾', title: 'El sembrador', parable: 'sembrador', icon: '🌾', colors: ['#f0a93b', '#e2643a'],
    how: ['Toca la pantalla para soltar una semilla.', 'Apunta a la tierra buena: ahí crece el trigo.', 'Tienes 26 semillas: en el camino, las piedras y las espinas se pierden.'],
    hud: { time: 60 }, goal: 12, goalText: 'Siembra 12 semillas en tierra buena', coinRate: 2.5, maxCoins: 45,
    load: () => import('./sembrador.js'),
  },
  {
    id: 'samaritano', scoreIcon: '💛', title: 'Manos que ayudan', parable: 'samaritano', icon: '🩹', colors: ['#ff8a5c', '#ec6f90'],
    how: ['Mira lo que necesita cada persona del camino.', 'Arrastra hasta ella lo que le hace falta.', 'No dejes a nadie sin ayuda.'],
    hud: { lives: 3 }, goal: 12, goalText: 'Ayuda a 12 personas', coinRate: 2.5, maxCoins: 45,
    load: () => import('./samaritano.js'),
  },
  {
    id: 'roca', scoreIcon: '🧱', title: 'La casa sobre la roca', parable: 'roca', icon: '🏠', colors: ['#7d8fa8', '#4aa3e0'],
    how: ['Toca para soltar cada piso justo encima del anterior.', 'Si lo pones bien centrado, la casa queda firme.', '¡Construye lo más alto que puedas!'],
    hud: { lives: 3 }, goal: 10, goalText: 'Construye 10 pisos', coinRate: 3, maxCoins: 45,
    load: () => import('./roca.js'),
  },
  {
    id: 'talentos', scoreIcon: '🎁', title: 'Los talentos', parable: 'talentos', icon: '🎁', colors: ['#9b7be8', '#ec6f90'],
    how: ['Toca dos cartas para voltearlas.', 'Encuentra las parejas de talentos.', 'Cada pareja hace crecer tus dones.'],
    hud: { time: 80 }, goal: 10, goalText: 'Encuentra 10 parejas', coinRate: 3, maxCoins: 45,
    load: () => import('./talentos.js'),
  },
  {
    id: 'mostaza', scoreIcon: '💧', title: 'El grano de mostaza', parable: 'mostaza', icon: '🌱', colors: ['#8fd16a', '#3f9a52'],
    how: ['Mueve la plantita de lado a lado con el dedo.', 'Atrapa las gotas de agua y los rayos de sol.', 'Esquiva los bichitos y verás crecer un gran árbol.'],
    hud: { lives: 3 }, goal: 30, goalText: 'Atrapa 30 gotas y rayos de sol', coinRate: 1.2, maxCoins: 45,
    load: () => import('./mostaza.js'),
  },
  {
    id: 'prodigo', scoreIcon: '❤️', title: 'De regreso a casa', parable: 'prodigo', icon: '🏡', colors: ['#f0a93b', '#9b7be8'],
    how: ['Toca la izquierda o la derecha para cambiar de carril.', 'Esquiva los charcos y las piedras.', 'Junta corazones y llega a la casa del padre.'],
    hud: { lives: 3 }, goal: 15, goalText: 'Llega a casa con 15 corazones', coinRate: 2, maxCoins: 45,
    load: () => import('./prodigo.js'),
  },
  {
    id: 'perla', scoreIcon: '🦪', title: 'La perla escondida', parable: 'perla', icon: '🦪', colors: ['#3ecfc4', '#4aa3e0'],
    how: ['Mira bien en qué concha se guarda la perla.', 'Las conchas se van a mover.', 'Toca la concha donde quedó la perla.'],
    hud: { lives: 3 }, goal: 6, goalText: 'Encuentra la perla 6 veces', coinRate: 6, maxCoins: 45,
    load: () => import('./perla.js'),
  },
  {
    id: 'panes', scoreIcon: '🧺', title: 'Panes y peces', parable: 'panes', icon: '🧺', colors: ['#e9a04b', '#62c370'],
    how: ['La gente tiene hambre y pide pan o pescado.', 'Toca el pan o el pez de la canasta y luego a quien lo pidió.', 'Jesús hace que alcance para todos.'],
    hud: { time: 60 }, goal: 30, goalText: 'Comparte con 30 personas', coinRate: 1.2, maxCoins: 45,
    load: () => import('./panes.js'),
  },
  {
    id: 'luz', scoreIcon: '🕯️', title: 'Enciende la luz', parable: 'luz', icon: '🕯️', colors: ['#27325e', '#9b7be8'],
    how: ['Responde las preguntas sobre la Biblia.', 'Cada respuesta correcta enciende una velita.', 'Llena de luz toda la ciudad.'],
    hud: { lives: 3 }, goal: 10, goalText: 'Enciende 10 velitas', coinRate: 3.5, maxCoins: 45,
    load: () => import('./luz.js'),
  },
];

export function getGame(id) { return GAMES.find(g => g.id === id) || null; }
