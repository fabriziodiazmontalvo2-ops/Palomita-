// El patrono de la parroquia: san Juan María Vianney, el Santo Cura de Ars (1786-1859).
// Módulo de datos puro: sin imports, sin lógica y sin HTML en los textos (se insertan como texto y se leen en voz alta).
// Hechos tomados de su biografía clásica; los detalles dudosos se dejaron fuera. «Juanito» es un apodo
// cariñoso del narrador, no un nombre histórico.
//
// CURA_ARS_STORY: la misma forma que una historia de js/data/bible-nt.js:
//   { id, title, ref, emoji, art: { bg, emojis: [2–4] }, summary, paragraphs: [7], verse: { text, ref },
//     think, prayer, quiz: [3 × { q, options: [3], answer, explain }] }
//   ref y verse.ref no son citas bíblicas: la historia es de la vida del santo, y el versículo es una frase suya
//   de su catequesis sobre la oración («Hijitos, su corazón es pequeño, pero la oración lo agranda…»).
//   bg es un fondo de js/art/scenes.js (SCENE_IDS).
// CURA_ARS_FACTS: [6 frases «¿Sabías que…?»] para los globitos de la palomita (120 caracteres como máximo).

export const CURA_ARS_STORY = {
  id: 'primera-comunion-de-juanito',
  title: 'La Primera Comunión escondida de Juanito',
  ref: 'Vida de san Juan María Vianney',
  emoji: '🌾',
  art: { bg: 'campo', emojis: ['🌾', '🏡', '🕯️'] },
  summary: 'Juan María Vianney recibió a Jesús por primera vez a escondidas. ¡Hoy es el patrono de nuestra parroquia!',
  paragraphs: [
    'Hace más de doscientos años, en 1786, nació en Francia un niño llamado Juan María Vianney. Aquí lo vamos a llamar Juanito. Su familia vivía en Dardilly, un pueblito de campesinos cerca de la ciudad de Lyon. Eran gente sencilla y trabajadora que amaba mucho a Dios, y su mamá le enseñó a rezar desde muy pequeñito.',
    'Cuando Juanito era niño, empezaron en Francia tiempos muy difíciles: la Revolución francesa. Las iglesias se cerraron, y los sacerdotes tenían que esconderse porque podían llevarlos presos. Para participar en la Misa, las familias creyentes se reunían a escondidas, y un sacerdote llegaba en secreto.',
    'Juanito quería conocer más a Jesús y recibirlo en la Comunión. Pero en esos tiempos no había catequesis en la parroquia, como ahora. Por eso aprendió el catecismo a escondidas, con mucho cuidado de que nadie se diera cuenta. ¡Lo guardaba en su corazón como un tesoro!',
    'Por fin llegó el gran día. En 1799, cuando tenía 13 años, Juanito hizo su Primera Comunión en Écully, un pueblo cerca de Lyon. Fue en una casa, a escondidas. Delante de las ventanas pusieron carretas cargadas de heno, para que nadie de afuera pudiera ver lo que pasaba dentro.',
    'Allí, en silencio, Juanito recibió a Jesús por primera vez. No podía haber campanas ni una gran fiesta, porque todo era a escondidas. Pero tenía lo más importante: ¡Jesús venía a vivir en su corazón! Fue el comienzo de una amistad con Jesús que duró toda su vida.',
    'Juanito creció y quiso ser sacerdote. Le costó muchísimo estudiar, sobre todo el latín, pero no se rindió. En 1815 fue ordenado sacerdote, y en 1818 lo enviaron como cura a Ars, un pueblito pequeño. Allí rezaba mucho, enseñaba el catecismo a los niños y pasaba horas y horas en el confesionario. ¡Llegaba gente de todas partes!',
    'Murió en Ars el 4 de agosto de 1859, y por eso su fiesta es el 4 de agosto. Hoy es san Juan María Vianney, patrono de los párrocos, y nuestra parroquia de Pío Pata lleva su nombre: Santo Cura de Ars. Él recibió a Jesús a escondidas; tú lo vas a recibir con tu familia y tu comunidad. ¡Prepárate con el mismo amor!',
  ],
  verse: { text: 'Hijitos, su corazón es pequeño, pero la oración lo agranda y lo hace capaz de amar a Dios.', ref: 'San Juan María Vianney' },
  think: '¿Qué te gustaría decirle a Jesús el día de tu Primera Comunión? ¿Cómo puedes preparar tu corazón desde hoy, como Juanito?',
  prayer: 'San Juan María Vianney, patrono de nuestra parroquia, ruega por mí. Ayúdame a prepararme para recibir a Jesús con un corazón limpio y lleno de amor, como tú. Amén.',
  quiz: [
    {
      q: '¿Por qué pusieron carretas de heno delante de las ventanas?',
      options: ['Para dar sombra a la casa', 'Para que nadie viera lo que pasaba', 'Para adornar la casa por la fiesta'],
      answer: 1,
      explain: 'En esos tiempos los sacerdotes tenían que esconderse. Las carretas tapaban las ventanas para que nadie descubriera la Misa de la Primera Comunión de Juanito.',
    },
    {
      q: '¿Qué hizo Juanito cuando le costaba mucho estudiar?',
      options: ['Dejó de estudiar para siempre', 'Se escondió de sus maestros', 'No se rindió y siguió intentando'],
      answer: 2,
      explain: 'Le costaba mucho, sobre todo el latín, pero con esfuerzo y con la ayuda de Dios llegó a ser sacerdote. ¡Tú tampoco te rindas!',
    },
    {
      q: '¿Qué hacía el Santo Cura de Ars durante horas y horas?',
      options: ['Escuchaba confesiones', 'Viajaba por otros países', 'Construía casas nuevas'],
      answer: 0,
      explain: 'Gente de todas partes llegaba a Ars para confesarse con él. Así llevó el perdón y la paz de Dios a muchísimas personas.',
    },
  ],
};

export const CURA_ARS_FACTS = [
  '¿Sabías que el Santo Cura de Ars nació en Francia en 1786, en una familia de campesinos?',
  '¿Sabías que el Santo Cura de Ars hizo su Primera Comunión a escondidas, a los 13 años?',
  '¿Sabías que para su Primera Comunión taparon las ventanas con carretas de heno?',
  '¿Sabías que al Santo Cura de Ars le costaba mucho estudiar latín? ¡Pero no se rindió!',
  '¿Sabías que gente de todas partes viajaba a Ars para confesarse con él?',
  '¿Sabías que el Santo Cura de Ars es patrono de los párrocos? ¡Su fiesta es el 4 de agosto!',
];
