// «Mi ratito con Jesús» y «Mi diario de gracias», para niños de 7 a 10 años.
// Módulo de datos puro: sin imports, sin lógica y sin HTML en los textos (se insertan como texto y se leen en voz alta).
//
// Doctrina: el ratito es oración personal en casa (o en la capilla de la palomita, con la vela encendida). No es
// adoración eucarística ni una «visita al sagrario»: Jesús está presente de un modo único en la Eucaristía, y por
// eso la sección «sagrario» invita a visitarlo en la parroquia (Catecismo 1378-1379 y 2715; Código de Derecho
// Canónico 940, la lámpara del sagrario). Las fórmulas de la Señal de la Cruz y del Gloria son las de js/data/prayers.js.
//
// Forma:
//   RATITO = {
//     title, intro,
//     steps: [{ id, title, emoji, text, seconds }],   // en orden; seconds = duración sugerida del paso, contando
//                                                     // la lectura en voz alta del texto (en total, unos tres minutos y medio)
//     closing,
//     sagrario: { title, paragraphs: [3] },
//   }
//   GRATITUDE = [{ id, emoji, label }]                // 14 opciones con dibujo para «Hoy doy gracias por…»
//   JOURNAL_PROMPTS = { gracias, pido, propongo }     // preguntas cortas del diario
// El diario es privado: lo que escribe el niño no entra en el informe para el catequista (js/core/report.js).

export const RATITO = {
  title: 'Mi ratito con Jesús',
  intro: 'Este es tu ratito para estar con Jesús, tu mejor amigo. Busca un lugar tranquilo de tu casa y siéntate cómodo. La vela encendida nos recuerda que Jesús es la luz del mundo (Juan 8, 12). Si en casa usan una vela de verdad, que la encienda una persona mayor.',
  steps: [
    {
      id: 'presencia',
      title: 'Me pongo en presencia de Jesús',
      emoji: '🕯️',
      text: 'Quédate quieto y respira despacio tres veces: toma aire por la nariz y suéltalo por la boca. Ahora haz con calma la Señal de la Cruz: «En el nombre del Padre, y del Hijo, y del Espíritu Santo. Amén». Jesús prometió estar con nosotros todos los días: ahora está contigo y te escucha.',
      seconds: 30,
    },
    {
      id: 'te-quiero',
      title: 'Te quiero, Jesús',
      emoji: '💛',
      text: 'Dile a Jesús, con tus palabras, cuánto lo quieres. Puedes decirle bajito: «Jesús, te quiero mucho. Gracias por ser mi amigo». Él se alegra cada vez que se lo dices.',
      seconds: 20,
    },
    {
      id: 'gracias',
      title: 'Gracias por…',
      emoji: '🙌',
      text: 'Piensa en tu día: ¿qué cosas bonitas pasaron?, ¿quién te quiso y te cuidó? Dale gracias a Jesús por cada una: «Gracias, Jesús, por…».',
      seconds: 25,
    },
    {
      id: 'perdon',
      title: 'Perdón por…',
      emoji: '🤗',
      text: '¿Hubo algo hoy en lo que no supiste amar? Díselo a Jesús con confianza: «Perdóname, Jesús, por…». Él te mira con cariño y te ayuda a empezar de nuevo. Piensa también cómo puedes arreglarlo mañana.',
      seconds: 25,
    },
    {
      id: 'pido',
      title: 'Te pido por…',
      emoji: '🙏',
      text: '¿Por quién quieres rezar hoy? Por tu familia, por un amigo, por alguien que está enfermo o triste. Di sus nombres a Jesús y pídele que los cuide.',
      seconds: 25,
    },
    {
      id: 'silencio',
      title: 'Silencio: escucho a Jesús',
      emoji: '🤫',
      text: 'Ahora no digas nada. Cierra los ojos y quédate en silencio con Jesús, como cuando estás al lado de alguien que quieres y no hacen falta palabras. Si no escuchas nada, no importa: estar con Él ya es rezar.',
      seconds: 60,
    },
    {
      id: 'despedida',
      title: 'Me despido',
      emoji: '👋',
      text: 'Despídete de Jesús con cariño: «Gracias por este ratito, Jesús. Quédate conmigo». Y termina alabando a Dios: «Gloria al Padre, y al Hijo, y al Espíritu Santo. Como era en el principio, ahora y siempre, por los siglos de los siglos. Amén».',
      seconds: 25,
    },
  ],
  closing: '¡Qué bonito ratito pasaste con Jesús! Él se queda contigo todo el día: en tu casa, en el colegio y cuando juegas. Y cuando vayas a tu parroquia, salúdalo en el sagrario: allí te espera de un modo muy especial.',
  sagrario: {
    title: 'Jesús te espera en el sagrario',
    paragraphs: [
      'Tu ratito en casa es oración: Jesús te escucha en todas partes. Pero en la iglesia te espera de un modo muy especial, en el sagrario. Allí se guardan las hostias consagradas en la Misa, y en ellas está Jesús de verdad, vivo, aunque no lo veamos. Junto al sagrario hay una lamparita encendida día y noche que nos avisa: «Jesús está aquí».',
      'Al pasar frente al sagrario, haz una genuflexión: dobla despacio la rodilla derecha hasta el suelo, como un saludo de cariño a tu Señor. Luego puedes quedarte un ratito, sentado o de rodillas, y hablarle como en tu casa. Un campesino de Ars le contó al santo cómo rezaba ante el sagrario: «Yo lo miro y Él me mira». Pide a tus papás que te lleven a visitarlo cuando la iglesia esté abierta.',
      'A veces la hostia consagrada se coloca en la custodia, una pieza dorada que muchas veces tiene forma de sol, para que todos puedan ver a Jesús y adorarlo: es la adoración del Santísimo. En la fiesta del Corpus Christi, la custodia sale en procesión por las calles, y el pueblo acompaña a Jesús con cantos y flores. Pregunta en tu parroquia cuándo hay adoración.',
    ],
  },
};

export const GRATITUDE = [
  { id: 'familia', emoji: '👪', label: 'Mi familia' },
  { id: 'abuelitos', emoji: '👵', label: 'Mis abuelitos' },
  { id: 'comida', emoji: '🍲', label: 'Mi comida' },
  { id: 'amigos', emoji: '🤝', label: 'Mis amigos' },
  { id: 'colegio', emoji: '🏫', label: 'Mi colegio' },
  { id: 'salud', emoji: '💪', label: 'Mi salud' },
  { id: 'naturaleza', emoji: '🌳', label: 'La naturaleza' },
  { id: 'mascota', emoji: '🐶', label: 'Mi mascota' },
  { id: 'juego', emoji: '⚽', label: 'Un juego divertido' },
  { id: 'lluvia', emoji: '🌧️', label: 'La lluvia' },
  { id: 'casa', emoji: '🏠', label: 'Mi casa' },
  { id: 'jesus', emoji: '✝️', label: 'Jesús' },
  { id: 'parroquia', emoji: '⛪', label: 'Mi parroquia' },
  { id: 'algo-bonito', emoji: '🌈', label: 'Algo bonito que pasó' },
];

export const JOURNAL_PROMPTS = {
  gracias: '¿Por qué le das gracias a Dios hoy?',
  pido: '¿Qué le quieres pedir a Jesús hoy?',
  propongo: '¿Qué cosa buena te propones hacer mañana?',
};
