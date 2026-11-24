// «Mi gran día»: la celebración de la Primera Comunión paso a paso, para niños de 7 a 10 años.
// Módulo de datos puro: sin imports, sin lógica y sin HTML en los textos (se insertan como texto y se leen en voz alta).
//
// Describe una celebración habitual en el Perú, pero las costumbres cambian de una parroquia a otra (ensayo,
// fecha de la Primera Confesión, ropa, vela, procesión, renovación de las promesas del Bautismo, comunión en
// la boca o en la mano): los textos lo dicen donde hace falta, y la parroquia puede ajustarlos.
// Doctrina: Catecismo 1385-1389; Código de Derecho Canónico 914 (Primera Confesión antes de la Primera
// Comunión) y 919 (ayuno de una hora hasta el momento de comulgar; el agua y las medicinas no lo rompen).
// Cómo comulgar está en js/data/mass.js (communion.steps): aquí solo se recuerda la idea.
// La renovación de las promesas del Bautismo usa la primera forma de las preguntas del Misal Romano y del Ritual
// del Bautismo en español de América Latina («¿Renuncian a Satanás?»…). Si la parroquia usa la otra forma
// («¿Renuncian al pecado, para vivir en la libertad de los hijos de Dios?»…), se cambian las tres primeras
// preguntas; las respuestas son las mismas.
//
// Forma: GRAN_DIA = {
//   title,
//   intro: [2 párrafos],
//   steps: [{ id, title, emoji, text, bg, emojis: [2–4], dialogue?: [{ who: 'sacerdote' | 'todos', text }], tip? }],
//     en orden; bg es un fondo de js/art/scenes.js (SCENE_IDS); 'noche', 'tormenta' y 'cenaculo' son oscuros
//   countdown: [{ daysLeft, emoji, text, link? }],   // 9 tareas cortitas: daysLeft 9 … 1 (1 = la víspera)
//   dayOf: { title, text },                           // lo dice la palomita el mismo día
//   after: { title, text },                           // lo dice la palomita los días siguientes
// }
// link: { screen, tab?, label }, igual que en js/data/dudas.js:
//   screen 'confesion' → tab 'pasos' | 'examen' | 'practicar' | 'preguntas'
//   screen 'misa'      → tab 'pasos' | 'practicar' | 'comulgar' | 'preguntas'
//   screen 'bible'     → tab 'oraciones'
// No cambies los id: la pantalla puede guardar con ellos qué pasos ya vio el niño.

export const GRAN_DIA = {
  title: 'Mi gran día',

  intro: [
    'Se acerca un día muy especial: ¡vas a recibir a Jesús en la Eucaristía por primera vez! Será en la Misa de tu parroquia, junto a tu familia, tus compañeros de catequesis y toda la comunidad. Es una fiesta de Jesús, que te invita a su mesa porque te quiere muchísimo.',
    'No tengas miedo ni te preocupes por hacerlo todo perfecto. Antes vas a ensayar, y ese día tu catequista, el sacerdote y tu familia te acompañarán en cada paso. Aquí puedes ver cómo será tu gran día, paso a paso. Lo más importante no es la ropa ni la fiesta: es abrirle tu corazón a Jesús.',
  ],

  // ───────────── Paso a paso ─────────────
  steps: [
    {
      id: 'ensayo',
      title: 'El ensayo con tu catequista',
      emoji: '👣',
      bg: 'iglesia',
      emojis: ['⛪', '👣', '🙋'],
      text: 'Unos días antes, tu grupo ensaya en la iglesia con tu catequista. Van a practicar por dónde entran, dónde se sientan, cuándo se ponen de pie y cómo se acercan a comulgar. Así, el gran día ya sabrás qué hacer y podrás estar en paz, pensando solo en Jesús.',
      tip: 'Pregunta en el ensayo todo lo que no entiendas: ¡para eso es! En algunas parroquias practican con una hostia sin consagrar, que todavía es solo pan.',
    },
    {
      id: 'primera-confesion',
      title: 'Tu Primera Confesión',
      emoji: '🤗',
      bg: 'dorado',
      emojis: ['🤗', '💛', '✨'],
      text: 'También en esos días harás tu Primera Confesión, para recibir a Jesús con el corazón limpio y en paz. Prepárala con tu examen de conciencia, cuéntale tus pecados al sacerdote con sencillez y recibe el abrazo del perdón. Jesús contó que en el cielo hay fiesta cada vez que alguien vuelve a Dios (Lucas 15, 7).',
      tip: 'En algunas parroquias la Primera Confesión es en un retiro o con más días de anticipación: tu catequista te dirá cuándo. En la guía de la Confesión puedes repasar cada paso.',
    },
    {
      id: 'vispera',
      title: 'La víspera del gran día',
      emoji: '🌙',
      bg: 'noche',
      emojis: ['🌙', '⭐', '🕯️', '🙏'],
      text: 'El día anterior, deja lista con tu familia tu ropa y tu vela. Muchos niños se visten de blanco, como el día de su Bautismo, y la vela recuerda la luz de Cristo que recibiste ese día. Pero lo más importante no se compra: es tu corazón. Antes de dormir, reza un ratito, dale gracias a Jesús y acuéstate temprano.',
      tip: 'La ropa, la vela y los recuerdos cambian de una parroquia a otra: haz lo que te indiquen. Nada tiene que ser caro ni nuevo, y la fiesta nunca es más importante que Jesús.',
    },
    {
      id: 'ayuno',
      title: 'El ayuno de una hora',
      emoji: '⏳',
      bg: 'amanecer',
      emojis: ['🌅', '⏳', '💧'],
      text: 'El gran día, desde una hora antes de comulgar no comes ni bebes nada, salvo agua o medicinas si las necesitas. Es el ayuno eucarístico: tu manera de decirle a Jesús que tienes hambre de Él. No hace falta quedarte en ayunas desde la noche anterior: basta una hora.',
      tip: 'Un truco: si tomas desayuno una hora antes de que empiece la Misa, cumples el ayuno de sobra. Si comes algo sin querer más tarde, pregúntale al sacerdote.',
    },
    {
      id: 'procesion',
      title: 'La procesión de entrada',
      emoji: '🚶',
      bg: 'templo',
      emojis: ['✝️', '🕯️', '🎶', '👣'],
      text: 'En muchas parroquias la Misa empieza con una procesión: los niños entran caminando despacio, detrás de la cruz, mientras todos cantan. Camina con calma, con las manos juntas o con tu vela, como lo ensayaron. ¡Vas al encuentro de Jesús! Luego te sientas con tu grupo o con tu familia, según se acostumbre en tu parroquia.',
      tip: 'Si ves a tu familia, regálales una sonrisa, pero sigue caminando con calma. Al llegar a tu lugar, saluda a Jesús en tu corazón.',
    },
    {
      id: 'promesas-del-bautismo',
      title: 'Renuevo las promesas de mi Bautismo',
      emoji: '💧',
      bg: 'rio',
      emojis: ['💧', '🕯️', '✨'],
      text: 'El día de tu Bautismo, tus papás y padrinos respondieron por ti. Ahora eres tú quien responde, con tu propia voz: le dices «no» al pecado y al mal, y «sí» a Dios. Muchas veces se hace con la vela encendida en el cirio pascual, que es signo de Jesús resucitado, la luz del mundo.',
      dialogue: [
        { who: 'sacerdote', text: '¿Renuncian a Satanás?' },
        { who: 'todos', text: 'Sí, renuncio.' },
        { who: 'sacerdote', text: '¿Y a todas sus obras?' },
        { who: 'todos', text: 'Sí, renuncio.' },
        { who: 'sacerdote', text: '¿Y a todas sus seducciones?' },
        { who: 'todos', text: 'Sí, renuncio.' },
        { who: 'sacerdote', text: '¿Creen en Dios, Padre todopoderoso, Creador del cielo y de la tierra?' },
        { who: 'todos', text: 'Sí, creo.' },
        { who: 'sacerdote', text: '¿Creen en Jesucristo, su único Hijo, nuestro Señor, que nació de santa María Virgen, murió, fue sepultado, resucitó de entre los muertos y está sentado a la derecha del Padre?' },
        { who: 'todos', text: 'Sí, creo.' },
        { who: 'sacerdote', text: '¿Creen en el Espíritu Santo, en la santa Iglesia católica, en la comunión de los santos, en el perdón de los pecados, en la resurrección de los muertos y en la vida eterna?' },
        { who: 'todos', text: 'Sí, creo.' },
      ],
      tip: 'No en todas las parroquias se renuevan las promesas del Bautismo en esta Misa, y las palabras pueden cambiar un poquito. Tu catequista te dirá cómo será en la tuya.',
    },
    {
      id: 'comunion',
      title: '¡Recibo a Jesús por primera vez!',
      emoji: '🌟',
      bg: 'iglesia',
      emojis: ['🌟', '🍞', '🙏'],
      text: 'Después de rezar con todos el «Señor, no soy digno», te acercas en la fila con calma y con las manos juntas, como lo practicaste. Haces una pequeña inclinación y, cuando el sacerdote te muestra la hostia y te dice «El Cuerpo de Cristo», respondes bien claro: «Amén». ¡Jesús viene a tu corazón!',
      dialogue: [
        { who: 'sacerdote', text: 'El Cuerpo de Cristo.' },
        { who: 'todos', text: 'Amén.' },
      ],
      tip: 'Recíbelo en la boca o en la mano, como te enseñaron. Si ese día te ofrecen también el cáliz, te dirán «La Sangre de Cristo» y respondes «Amén».',
    },
    {
      id: 'accion-de-gracias',
      title: 'Doy gracias a Jesús',
      emoji: '💛',
      bg: 'cielo',
      emojis: ['💛', '🙏', '✨'],
      text: 'De vuelta en tu lugar, cierra los ojos y habla con Jesús en silencio: ¡está en tu corazón! Dale gracias, cuéntale lo que sientes y pídele por tu familia y por las personas que quieres. Puedes rezar el «Alma de Cristo» o decirle con tus palabras: «Jesús, te quiero. Quédate siempre conmigo».',
      tip: 'Este ratito es solo tuyo y de Jesús: no lo cambies por nada, ni siquiera por una foto.',
    },
    {
      id: 'fiesta',
      title: 'La foto y la fiesta en familia',
      emoji: '🎉',
      bg: 'jardin',
      emojis: ['📸', '🎉', '🎂', '🤗'],
      text: 'Al terminar la Misa llegan los abrazos y las fotos con tu vela, tu familia, tus padrinos si los tienes y tus compañeros. Muchas familias preparan después un almuerzo o un compartir. ¡Disfrútalo y da gracias a todos los que te acompañaron! Y no olvides al Invitado más importante: Jesús, que hoy vino a tu corazón.',
      tip: 'Si en tu familia no hay una fiesta grande, no importa: lo más grande ya pasó en la Misa.',
    },
    {
      id: 'despues',
      title: 'La primera de muchas Comuniones',
      emoji: '📅',
      bg: 'monte',
      emojis: ['⛪', '🔔', '☀️'],
      text: 'Tu Primera Comunión es la primera de muchísimas. Jesús te espera cada domingo en la Misa para alimentarte con su amor y seguir creciendo juntos. Cuando lo necesites, vuelve a confesarte: su abrazo siempre te espera. ¡Y sigue viniendo a tu parroquia, que también es tu casa!',
      tip: 'Pregunta si en tu parroquia hay un grupo para niños después de la Primera Comunión, como los monaguillos o un grupo de perseverancia.',
    },
  ],

  // ───────────── Cuenta regresiva: una tarea cortita por día ─────────────
  countdown: [
    { daysLeft: 9, emoji: '🗣️', text: 'Practica cómo es la confesión: Jesús siempre te espera con un abrazo.', link: { screen: 'confesion', tab: 'practicar', label: 'Practicar mi confesión' } },
    { daysLeft: 8, emoji: '🤗', text: 'Repasa el Acto de contrición con alguien de tu familia.', link: { screen: 'bible', tab: 'oraciones', label: 'Acto de contrición' } },
    { daysLeft: 7, emoji: '🤝', text: 'Haz las paces con alguien con quien peleaste, como un hermano o un amigo: pide perdón o perdona de corazón.' },
    { daysLeft: 6, emoji: '🧹', text: 'Haz una buena obra por amor a Jesús: ayuda en tu casa sin que te lo pidan.' },
    { daysLeft: 5, emoji: '🏠', text: 'Aprende de memoria el «Señor, no soy digno», que dirás antes de comulgar.', link: { screen: 'bible', tab: 'oraciones', label: 'Señor, no soy digno' } },
    { daysLeft: 4, emoji: '🕯️', text: 'Prepara tu vela con tu familia y pídeles que te cuenten cómo fue tu Bautismo.' },
    { daysLeft: 3, emoji: '🍞', text: 'Practica cómo te acercas a comulgar: las manos juntas, la inclinación y el «Amén».', link: { screen: 'misa', tab: 'comulgar', label: 'Cómo me acerco a comulgar' } },
    { daysLeft: 2, emoji: '💌', text: 'Escríbele o dibújale una cartita a Jesús y cuéntale cuánto deseas recibirlo.' },
    { daysLeft: 1, emoji: '🌙', text: '¡Mañana es tu gran día! Deja todo listo, reza un ratito y acuéstate temprano.' },
  ],

  // ───────────── Lo que dice la palomita ─────────────
  dayOf: {
    title: '¡Hoy es tu gran día!',
    text: '¡Hoy recibes a Jesús por primera vez! Respira hondo y no tengas miedo: Él te espera con mucho amor. Acuérdate del ayuno de una hora y, después de comulgar, cuéntale todo lo que llevas en tu corazón. ¡Estoy muy feliz por ti!',
  },
  after: {
    title: 'Jesús te espera cada domingo',
    text: 'Tu Primera Comunión fue el comienzo de una gran amistad. Jesús te espera cada domingo en la Misa para alimentarte con su amor. Y cuando lo necesites, vuelve a confesarte: su abrazo siempre te espera. ¿Y si invitas a tu familia a ir juntos a Misa este domingo?',
  },
};
