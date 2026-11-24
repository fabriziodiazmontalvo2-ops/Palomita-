// «Rincón de papás y padrinos»: orientaciones breves para la familia que acompaña al niño hacia la Primera Comunión,
// y la nota «Qué guarda Palomita y qué no». Textos para adultos (trato de «ustedes»).
// Módulo de datos puro: sin imports, sin lógica y sin HTML en los textos.
// Doctrina y disciplina: Catecismo 1656 y 2225 (la familia, iglesia doméstica; los padres, primeros educadores
// en la fe), 1467 (secreto de confesión); Código de Derecho Canónico 872 y 892 (padrinos de Bautismo y de
// Confirmación: para la Primera Comunión no hay padrinos obligatorios) y 919 (ayuno de una hora).
// La Línea 100 se confirmó vigente en 2026: la Resolución Ministerial 000363-2026-MIMP (24 de julio de 2026)
// aprobó el protocolo del servicio. Se describe sin más detalles que los comprobados.
//
// Forma:
//   PARENTS_CORNER = {
//     title, intro,
//     sections: [{ id, title, emoji, paragraphs: [2–4], tips?: [frases cortas] }],
//   }
//   PRIVACY_NOTE = 'texto de cinco frases'   // título sugerido en pantalla: «Qué guarda Palomita y qué no»

export const PARENTS_CORNER = {
  title: 'Rincón de papás y padrinos',
  intro: 'Gracias por acompañar a sus hijos en el camino a la Primera Comunión. Aquí encontrarán ideas sencillas para vivir la fe en familia, con alegría y sin presiones. No hace falta ser expertos: basta con caminar juntos y dejar que Jesús haga lo demás.',
  sections: [
    {
      id: 'acompanar',
      title: 'Acompañar sin presionar',
      emoji: '🤝',
      paragraphs: [
        'La fe no se aprende como una tarea más: se contagia. Los niños aprenden a querer a Dios cuando ven que sus papás rezan, van a Misa, piden perdón y ayudan a los demás. Ustedes son los primeros catequistas de sus hijos, y su ejemplo enseña más que muchas palabras.',
        'No hace falta saberlo todo ni ser perfectos. Basta con interesarse: preguntarle al niño qué aprendió en la catequesis, escucharlo con atención y aprender con él. Si no saben responder una pregunta, pueden decir con sencillez: «No lo sé; vamos a preguntárselo juntos a la catequista».',
        'Eviten usar a Dios como amenaza, con frases como «Dios te va a castigar», y no conviertan la Primera Comunión en premio o castigo por las notas o el comportamiento. Dios es un Padre que ama, y la fe crece mejor con cariño, paciencia y alegría.',
      ],
      tips: [
        'Respondan ustedes también las preguntas de «Para conversar en casa».',
        'Feliciten el esfuerzo, no solo los resultados.',
        'Recen por sus hijos, y díganles que rezan por ellos.',
        'Usen Palomita junto al niño, unos minutos al día.',
      ],
    },
    {
      id: 'misa-domingo',
      title: 'Ir juntos a Misa el domingo',
      emoji: '⛪',
      paragraphs: [
        'La Misa del domingo es el corazón de la vida cristiana. Para el niño, lo que más cuenta es ver que su familia va con gusto, no por obligación. Si hace tiempo que no van, este es un buen momento para volver: en la parroquia siempre hay un lugar para ustedes.',
        'Para ayudarlo a participar, lleguen unos minutos antes, siéntense donde pueda ver el altar y enséñenle las respuestas y las posturas; la Misa paso a paso de Palomita les puede servir. Si pueden, lean juntos en casa el Evangelio del domingo antes de salir.',
        'Es normal que un niño se distraiga o se canse. En vez de regañarlo en voz alta, díganle al oído algo que lo ayude a volver: «Mira, ahora el padre va a consagrar el pan». Mientras no haya hecho su Primera Comunión, en el momento de comulgar puede rezar en su sitio la comunión espiritual. Y al volver a casa, conversen sobre algo bonito que escucharon.',
      ],
      tips: [
        'Lleguen con tiempo y saluden juntos a Jesús en el sagrario.',
        'Siéntense donde el niño pueda ver: participa mejor.',
        'Hagan del domingo un día especial en casa.',
      ],
    },
    {
      id: 'primera-confesion',
      title: 'Acompañar la primera confesión',
      emoji: '🤗',
      paragraphs: [
        'La primera confesión es un encuentro con la misericordia de Dios, no un examen ni un castigo. Ayuden al niño a prepararse con calma: hablen del perdón como el abrazo del Padre, lean juntos la parábola del hijo pródigo (Lucas 15, 11-24) y, si él quiere, acompáñenlo en el examen de conciencia de Palomita sin mirar lo que marca.',
        'Nunca le pregunten qué va a confesar, qué confesó ni qué le dijo el sacerdote. Lo que pasa en la confesión queda entre él y Dios, y el sacerdote guarda siempre el secreto. Si el niño quiere contarles algo por su cuenta, escúchenlo con respeto, sin insistir. Al salir, basta un abrazo y una pequeña celebración.',
        'El mejor modo de prepararlo es el ejemplo. Si pueden, confiésense también ustedes en esos días: muchos papás aprovechan la primera confesión de sus hijos para volver a este sacramento después de años. Y si por algún motivo no pueden hacerlo, acompáñenlo igual con su oración y su cariño.',
      ],
      tips: [
        'Pregunten en la parroquia los horarios de confesión.',
        'Nunca usen la confesión como amenaza.',
        'Si anota sus pecados en un papelito, que lo rompa él mismo al salir, sin que nadie lo lea.',
      ],
    },
    {
      id: 'padrinos',
      title: 'Padrinos y madrinas de Primera Comunión',
      emoji: '🎁',
      paragraphs: [
        'En el Perú es una costumbre muy extendida elegir un padrino o una madrina de Primera Comunión. Es una tradición bonita, pero no es un requisito de la Iglesia: los padrinos que la Iglesia pide son los del Bautismo y los de la Confirmación. Antes de elegir, consulten en la parroquia o con la catequista qué piden o qué acostumbran allí.',
        'Si eligen padrinos, busquen a alguien que viva su fe y quiera de verdad al niño, más que a quien pueda hacer el regalo más grande. Su tarea es sencilla y hermosa: rezar por su ahijado, acompañarlo ese día y después, y mostrarle con su vida que seguir a Jesús hace feliz.',
        'Los regalos con sentido ayudan a recordar lo importante: una Biblia para niños, un rosario, un crucifijo, una imagen de la Virgen o un libro de oraciones. Y el mejor regalo es el tiempo: llevarlo a Misa, rezar con él y recordar juntos, cada año, la fecha de su Primera Comunión.',
      ],
      tips: [
        'Pregunten en la parroquia antes de comprometer a alguien.',
        'El mejor regalo de un padrino es su ejemplo.',
        'La fiesta no tiene que depender de cuánto se gaste.',
      ],
    },
    {
      id: 'celebracion',
      title: 'El día de la celebración',
      emoji: '🕊️',
      paragraphs: [
        'El centro de ese día es Jesús, que viene por primera vez al corazón del niño. La ropa, las fotos, el almuerzo y la fiesta son bonitos, pero que no tapen lo importante. Antes de salir de casa, recen juntos un momento y bendigan a su hijo.',
        'Lleguen con tiempo: la puntualidad ayuda a que el niño esté tranquilo y a que todos vivan la Misa en paz. Recuerden el ayuno eucarístico: quien va a comulgar no come ni bebe nada desde una hora antes de la Comunión, salvo agua o medicinas. Un desayuno tranquilo y a buena hora es suficiente.',
        'Sigan lo que pida la parroquia sobre la ropa, las velas, los recuerdos y las fotos. Una ropa sencilla y limpia basta: Jesús mira el corazón. Durante la Misa, guarden el celular, para que nada distraiga al niño de su encuentro con Jesús.',
        'Después de comulgar, déjenlo dar gracias en silencio. En casa, una celebración sencilla es suficiente: lo que el niño recordará es que su familia estaba feliz porque recibió a Jesús.',
      ],
      tips: [
        'Recen juntos antes de salir de casa.',
        'Una hora de ayuno antes de comulgar, salvo agua o medicinas.',
        'Celular guardado durante la Misa.',
      ],
    },
    {
      id: 'fe-en-casa',
      title: 'La fe en casa',
      emoji: '🏠',
      paragraphs: [
        'La familia es la primera escuela de la fe: la Iglesia la llama «iglesia doméstica». En casa el niño aprende a rezar, a perdonar y a compartir, mucho antes que en cualquier otro lugar.',
        'Pueden armar un rincón de oración: una mesita o una repisa con un mantel, una cruz, una imagen de la Virgen, la Biblia y una flor. No hace falta gastar: lo importante es que sea un lugar cuidado, donde la familia se reúna a rezar, aunque sea unos minutos.',
        'Hay gestos sencillos que dejan huella: rezar antes de comer, rezar con los hijos antes de dormir y bendecirlos haciéndoles la señal de la cruz en la frente. Es una costumbre antigua que los hijos pidan la bendición a sus papás y a sus abuelos: vale la pena conservarla.',
      ],
      tips: [
        'Bendigan la mesa antes de comer.',
        'Recen con sus hijos antes de dormir.',
        'Hagan la señal de la cruz en la frente de sus hijos.',
        'Tengan la Biblia a la vista.',
      ],
    },
    {
      id: 'pantallas',
      title: 'El celular y las pantallas',
      emoji: '📱',
      paragraphs: [
        'Palomita es una ayuda, pero no reemplaza a la familia ni a la catequesis de la parroquia. Lo mejor es usarla junto al niño, conversando sobre lo que aprende, unos 15 o 20 minutos al día. Funciona sin internet, así que no gasta datos.',
        'Pongan límites con cariño y con claridad: horarios para el celular, nada de pantallas en la mesa ni en la cama, y siempre en un lugar de la casa donde ustedes puedan ver. Explíquenle el porqué de cada límite y cúmplanlo también ustedes: el ejemplo vale más que la prohibición.',
        'En internet hay cosas que no son para niños. Revisen qué ve y a qué juega, y enséñenle a no conversar con desconocidos ni enviar fotos. Díganle que, si algo lo asusta o lo hace sentir incómodo, puede contárselo siempre, sin miedo a que lo castiguen.',
      ],
      tips: [
        'Nada de celular en la mesa ni en la cama.',
        'Usen Palomita junto al niño.',
        'Más juego al aire libre y más conversación.',
      ],
    },
    {
      id: 'cuidar-ninos',
      title: 'Cuidar a los niños',
      emoji: '🛡️',
      paragraphs: [
        'Enséñenle desde pequeño que su cuerpo es un regalo de Dios y que nadie tiene derecho a tocarlo de una manera que lo haga sentir mal. Explíquenle la diferencia entre una sorpresa, que es bonita y pronto se cuenta, y un secreto que lo hace sentir incómodo: ese secreto siempre se puede contar a los papás o a otro adulto de confianza.',
        'Si el niño les cuenta algo que lo hizo sentir mal, escúchenlo con calma y créanle. Agradézcanle que se lo haya contado, díganle que no es su culpa y no lo regañen. No le prometan guardar el secreto: explíquenle que van a buscar ayuda para protegerlo. No lo interroguen una y otra vez, y no lo dejen a solas con la persona de la que habla.',
        'Busquen ayuda pronto, en la parroquia y ante las autoridades: la comisaría, la fiscalía o la Demuna de su municipalidad. La Línea 100, del Ministerio de la Mujer y Poblaciones Vulnerables, es gratuita y atiende las 24 horas casos de violencia familiar y sexual, también contra niños y adolescentes. Si hay un peligro inmediato, llamen a la Policía al 105.',
        'Si lo que pasó involucra a alguien de la Iglesia, también pueden informarlo al Arzobispado de Huancayo, y siempre pueden denunciarlo ante las autoridades. Ningún adulto debería pedirle a un niño que guarde secretos ni buscar quedarse a solas con él: cuidar a los niños es tarea de todos.',
      ],
      tips: [
        'Escucharlo con calma y creerle.',
        'Nunca culparlo.',
        'No prometerle guardar el secreto.',
        'Estar atentos a los cambios: tristeza, miedo, no querer ir a algún lugar.',
        'Línea 100: gratuita, las 24 horas.',
      ],
    },
    {
      id: 'despues',
      title: 'Después de la Primera Comunión',
      emoji: '🌱',
      paragraphs: [
        'La Primera Comunión no es una graduación ni el final del camino: es la primera de muchas. Lo más importante viene después: seguir yendo a Misa cada domingo, en familia, y comulgar con frecuencia, acercándose a la confesión cuando haga falta.',
        'Ayúdenlo a seguir creciendo en la fe: que siga rezando en casa y que participe en la parroquia, si hay grupos para niños, como los monaguillos, el coro o la Infancia Misionera. Guarden juntos los recuerdos de ese día: la vela, el rosario, la Biblia, las fotos.',
        'Más adelante vendrá la Confirmación, que completa la iniciación cristiana. Pregunten en la parroquia a qué edad se prepara, y mientras tanto sigan cuidando juntos la amistad con Jesús.',
      ],
      tips: [
        'Misa cada domingo, en familia.',
        'Celebren cada año la fecha de su Primera Comunión.',
        'La Confirmación lo espera más adelante.',
      ],
    },
  ],
};

export const PRIVACY_NOTE = 'Palomita guarda todo solo en este teléfono: el avance, las figuritas, las fotos de la palomita y los avisos de Misa y catequesis; no hay cuentas, ni publicidad, ni compras. Funciona sin internet: la única conexión posible es al tablón de avisos de la parroquia, solo si un grande lo activa, y únicamente para traer esos avisos. El micrófono se usa solo en la pantalla de la palomita, si ustedes activan esa opción: lo que oye lo repite al instante, y no lo guarda ni lo envía. El examen de conciencia no se guarda nunca, y la copia de seguridad o el informe para el catequista salen del teléfono solo si ustedes los guardan o los envían. Si el teléfono tiene activada la copia de seguridad de Google, Android puede incluir en ella los datos de Palomita; si prefieren evitarlo, pueden desactivarla en los ajustes de copia de seguridad del teléfono.';
