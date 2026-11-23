// «Mi primera confesión»: guía de Palomita para niños de 7 a 10 años que se preparan
// para recibir por primera vez el sacramento de la Reconciliación.
// Módulo de datos puro: sin imports, sin lógica y sin HTML en los textos.
// Las frases bíblicas entre comillas son formulaciones propias, sencillas y fieles al sentido
// del pasaje citado. Las fórmulas del sacramento (absolución, Acto de contrición) van con su texto
// habitual; el Acto de contrición es idéntico al de js/data/prayers.js (id: acto-de-contricion).
// El examen de conciencia está escrito en primera persona, para que el niño se lo pregunte a sí mismo.
//
// Forma: CONFESSION = {
//   intro: { title, paragraphs: [2–4] },
//   privacy,                                        // aviso: lo marcado en el examen no se guarda
//   exam: [{ id, title, emoji, questions: [...] }],  // dios | casa | colegio | amigos | yo
//   steps: [{ id, title, emoji, text, dialogue?: [{ who: 'sacerdote' | 'yo', text }] }],
//   quiz: [{ q, options: [3], answer, explain }],
// }

export const CONFESSION = {
  intro: {
    title: 'Mi primera confesión',
    paragraphs: [
      'La Reconciliación es el sacramento en el que Jesús perdona nuestros pecados por medio del sacerdote. También la llamamos Confesión o Penitencia. Es un regalo de Jesús resucitado, que dijo a sus apóstoles: «A quienes ustedes les perdonen los pecados, les quedarán perdonados» (Juan 20, 23).',
      'Pecar es alejarnos del amor de Dios y de los demás. Pero Dios nunca deja de querernos. Es como el papá de la parábola, que vio a su hijo cuando todavía estaba lejos, corrió a su encuentro y lo abrazó (Lucas 15, 20). Así te espera Jesús en la confesión: con los brazos abiertos.',
      'No tengas miedo. Es normal sentir nervios la primera vez, pero el sacerdote te recibe con cariño y te ayuda si no sabes qué decir. No vas a recibir un castigo, sino un abrazo. Jesús contó que en el cielo hay fiesta por cada persona que vuelve a Dios (Lucas 15, 7). ¡Esa fiesta también es por ti!',
      'Y algo muy importante: el sacerdote jamás puede contarle a nadie lo que le dices en la confesión. Ni a tus papás, ni a tu catequista, ni a nadie, nunca. Es el secreto de confesión, un secreto sagrado. Por eso puedes hablarle con toda confianza, como si hablaras con el mismo Jesús.',
    ],
  },

  privacy: 'Lo que marques en tu examen de conciencia es solo entre tú y Dios. No se guarda, no se envía a nadie y se borra apenas sales de esta pantalla.',

  // ───────────── Examen de conciencia ─────────────
  exam: [
    {
      id: 'dios',
      title: 'Con Dios',
      emoji: '🙏',
      questions: [
        '¿Recé por las mañanas o por las noches?',
        '¿Le di gracias a Dios por las cosas buenas de cada día?',
        '¿Me olvidé de Dios por estar con el celular, la tele o los videojuegos?',
        '¿Dije el nombre de Dios, de Jesús o de la Virgen de broma o con rabia?',
        '¿Me burlé de la oración, de la iglesia o de las cosas de Dios?',
        '¿Me quejé o me porté mal para no ir a Misa el domingo?',
        '¿Estuve atento en la Misa, o me puse a jugar y a conversar?',
        '¿Me porté con respeto en la iglesia y en la catequesis?',
      ],
    },
    {
      id: 'casa',
      title: 'En mi casa',
      emoji: '🏠',
      questions: [
        '¿Obedecí a mis papás o a quienes me cuidan, a la primera y sin renegar?',
        '¿Les contesté mal o les falté el respeto a mis papás, a mis abuelos o a otros mayores?',
        '¿Peleé con mis hermanos o mis primos, o los molesté a propósito?',
        '¿Ayudé en las tareas de la casa, como tender mi cama u ordenar mis cosas?',
        '¿Dije mentiras en mi casa para no tener problemas?',
        '¿Tomé algo sin permiso, como plata o golosinas?',
        '¿Compartí mis cosas con mis hermanos?',
        '¿Fui agradecido con mi familia y con la comida que hay en la mesa?',
      ],
    },
    {
      id: 'colegio',
      title: 'En el colegio',
      emoji: '🎒',
      questions: [
        '¿Hice mis tareas con esfuerzo, o fui flojo?',
        '¿Respeté y obedecí a mis profesores?',
        '¿Puse atención en clase, o interrumpí y no dejé aprender a los demás?',
        '¿Copié en un examen o en una tarea?',
        '¿Me burlé de algún compañero o le puse apodos feos?',
        '¿Dejé a alguien solo o lo aparté del juego a propósito?',
        '¿Empujé o le pegué a alguien?',
        '¿Tomé útiles o cosas de otros sin permiso, o los maltraté?',
      ],
    },
    {
      id: 'amigos',
      title: 'Con mis amigos',
      emoji: '🤝',
      questions: [
        '¿Fui un buen amigo, o solo pensé en mí?',
        '¿Compartí mis juguetes y mis cosas?',
        '¿Hice trampa en los juegos?',
        '¿Dije lisuras o palabras feas?',
        '¿Hablé mal de alguien a sus espaldas o inventé chismes?',
        '¿Me dejé llevar por otros para hacer algo que estaba mal?',
        '¿Supe perdonar cuando un amigo me pidió perdón?',
        '¿Ayudé a algún amigo que estaba triste o que me necesitaba?',
      ],
    },
    {
      id: 'yo',
      title: 'Conmigo mismo',
      emoji: '💛',
      questions: [
        '¿Cuidé mi cuerpo y respeté el de los demás?',
        '¿Miré o escuché cosas que no eran buenas?',
        '¿Usé el celular o internet a escondidas, sin permiso de mis papás?',
        '¿Dije siempre la verdad, aunque me costara?',
        '¿Me creí más que los demás o presumí de mis cosas?',
        '¿Fui caprichoso y quise todo para mí?',
        '¿Me enojé tanto que dije o hice cosas que lastimaron a otros?',
        '¿Cuidé los regalos de Dios: mi salud, mis cosas y la naturaleza?',
      ],
    },
  ],

  // ───────────── Paso a paso ─────────────
  steps: [
    {
      id: 'preparar',
      title: 'Prepara tu corazón',
      emoji: '🔥',
      text: 'Antes de confesarte, busca un ratito de silencio. Haz la Señal de la Cruz y pídele ayuda al Espíritu Santo: Él te da luz para mirar tu corazón con sinceridad y fuerza para cambiar. Puedes rezar el «Ven, Espíritu Santo» o decirle algo con tus propias palabras.',
      dialogue: [
        { who: 'yo', text: 'Ven, Espíritu Santo: ayúdame a recordar mis pecados, a sentir dolor de verdad y a contarlos con sencillez. Amén.' },
      ],
    },
    {
      id: 'examen',
      title: 'Haz tu examen de conciencia',
      emoji: '🔎',
      text: 'Repasa con calma cómo has vivido: con Dios, en tu casa, en el colegio, con tus amigos y contigo mismo. Las preguntas de esta guía te ayudan. No se trata de asustarte, sino de mirar tu corazón con los ojos buenos de Jesús. Si quieres, anota tus pecados en un papelito para no olvidarlos, y después lo rompes.',
    },
    {
      id: 'dolor',
      title: 'Dolor y propósito',
      emoji: '🌱',
      text: 'Piensa en lo mucho que Dios te quiere y dile que te pesa haberte alejado de su amor. Eso es el dolor de los pecados: no se trata de tener miedo, sino de sentir pena por haber fallado a quien tanto te ama. Luego haz un propósito: elige algo concreto para mejorar, con la ayuda de Jesús. Por ejemplo: «Voy a obedecer a la primera».',
    },
    {
      id: 'esperar',
      title: 'Espera tu turno con calma',
      emoji: '⏳',
      text: 'Mientras esperas en la fila o en la banca, reza en silencio y respira tranquilo. Si estás nervioso, cuéntaselo a Jesús: Él está contigo. Tu catequista y el sacerdote te van a ayudar. Y si en ese momento se te olvida algo, no pasa nada: el sacerdote te irá guiando con preguntas sencillas.',
    },
    {
      id: 'confesionario',
      title: 'En el confesionario',
      emoji: '⛪',
      text: 'Cuando llegue tu turno, acércate al sacerdote. Puedes arrodillarte en el confesionario o sentarte frente a él, como te indiquen. En el Perú es costumbre saludar diciendo «Ave María Purísima», y el sacerdote responde «Sin pecado concebida». También puedes empezar haciendo la Señal de la Cruz. Luego cuéntale que es tu primera confesión.',
      dialogue: [
        { who: 'yo', text: 'Ave María Purísima.' },
        { who: 'sacerdote', text: 'Sin pecado concebida.' },
        { who: 'yo', text: 'Padre, es mi primera confesión.' },
      ],
    },
    {
      id: 'pecados',
      title: 'Cuenta tus pecados con sencillez',
      emoji: '🗣️',
      text: 'Dile tus pecados con tus propias palabras, con sencillez y sin esconder nada. No hace falta contar detalles ni echarles la culpa a otros: solo lo que hiciste tú. Si no sabes cómo decir algo, el sacerdote te ayuda con cariño. Al terminar, avísale que ya acabaste.',
      dialogue: [
        { who: 'yo', text: 'Me acuso de que desobedecí a mi mamá, de que dije una mentira y de que peleé con mi hermano.' },
        { who: 'yo', text: 'Esos son mis pecados. Me arrepiento de ellos y también de los que no recuerdo.' },
      ],
    },
    {
      id: 'consejo',
      title: 'Escucha el consejo y la penitencia',
      emoji: '👂',
      text: 'El sacerdote te dirá unas palabras para ayudarte a ser mejor amigo de Jesús. Escúchalo con atención. Después te dará una penitencia: una oración o una buena obra que harás al salir. Si no entiendes algo, pregúntale sin vergüenza: «Padre, ¿me lo puede repetir?».',
    },
    {
      id: 'contricion',
      title: 'Reza el Acto de contrición',
      emoji: '🤗',
      text: 'Luego el sacerdote te pedirá que reces el Acto de contrición. Con esta oración le dices a Jesús, de todo corazón, que te duele haberte alejado de su amor y que quieres volver a su abrazo. Apréndela de memoria; y si te pones nervioso y se te olvida, el sacerdote te ayudará.',
      dialogue: [
        { who: 'yo', text: 'Jesús, mi Señor y Redentor: yo me arrepiento de todos los pecados que he cometido hasta hoy, y me pesa de todo corazón, porque con ellos ofendí a un Dios tan bueno.' },
        { who: 'yo', text: 'Propongo firmemente no volver a pecar, y confío en que, por tu infinita misericordia, me has de conceder el perdón de mis culpas y me has de llevar a la vida eterna. Amén.' },
      ],
    },
    {
      id: 'absolucion',
      title: 'La absolución: ¡estás perdonado!',
      emoji: '✨',
      text: 'Llega el momento más hermoso. El sacerdote extiende su mano hacia ti, reza una oración y dice las palabras del perdón mientras hace la Señal de la Cruz. ¡Es Jesús mismo quien te perdona por medio de él! Tú respondes «Amén». Tus pecados quedan perdonados y tu corazón queda limpio, como recién estrenado.',
      dialogue: [
        { who: 'sacerdote', text: 'Yo te absuelvo de tus pecados en el nombre del Padre, y del Hijo, y del Espíritu Santo.' },
        { who: 'yo', text: 'Amén.' },
      ],
    },
    {
      id: 'despedida',
      title: 'Vete en paz',
      emoji: '👋',
      text: 'Para despedirse, en muchas parroquias es costumbre que el sacerdote diga «Vete en paz», o bien «Da gracias al Señor porque es bueno», y tú respondes «Porque es eterna su misericordia», que son palabras de los salmos. Dale las gracias y sal con calma y con alegría.',
      dialogue: [
        { who: 'sacerdote', text: 'Da gracias al Señor porque es bueno.' },
        { who: 'yo', text: 'Porque es eterna su misericordia.' },
        { who: 'sacerdote', text: 'Vete en paz.' },
        { who: 'yo', text: 'Gracias, padre.' },
      ],
    },
    {
      id: 'gracias',
      title: 'Cumple tu penitencia y da gracias',
      emoji: '🎉',
      text: 'Busca un lugar en la iglesia y, si tu penitencia es una oración, rézala enseguida; si es una buena obra, hazla pronto. Dale gracias a Jesús por su perdón: ¡ya no tienes que preocuparte por esos pecados! Y si después recuerdas algo que olvidaste sin querer, tranquilo: Jesús también te lo perdonó. Lo cuentas en tu próxima confesión.',
    },
  ],

  // ───────────── ¿Qué aprendí? ─────────────
  quiz: [
    {
      q: '¿Quién te perdona los pecados en la confesión?',
      options: ['Tu catequista', 'Jesús, por medio del sacerdote', 'Nadie: uno se perdona solo'],
      answer: 1,
      explain: 'Jesús resucitado dio a sus apóstoles el poder de perdonar los pecados. Por eso, en la confesión, es Jesús quien te perdona por medio del sacerdote.',
    },
    {
      q: '¿Cómo te recibe Dios cuando vuelves a Él en la confesión?',
      options: ['Con un abrazo, como el papá del hijo pródigo', 'Con cara de enojo', 'Con un castigo muy duro'],
      answer: 0,
      explain: 'Dios es un Padre bueno que corre a abrazarte, como el papá de la parábola. ¡En el cielo hay fiesta cada vez que alguien vuelve a Él!',
    },
    {
      q: '¿Qué es el examen de conciencia?',
      options: ['Una prueba con nota del colegio', 'Una lista de castigos', 'Recordar con calma en qué me alejé del amor de Dios'],
      answer: 2,
      explain: 'Es mirar tu corazón con la luz del Espíritu Santo: cómo has amado a Dios, a tu familia, a tus amigos y a ti mismo. Así sabes qué contarle al sacerdote.',
    },
    {
      q: 'Si dices «Ave María Purísima», ¿qué te responde el sacerdote?',
      options: ['«Pueden ir en paz»', '«Buenos días, hijo»', '«Sin pecado concebida»'],
      answer: 2,
      explain: 'Es un saludo muy querido en el Perú: así recordamos que la Virgen María fue concebida sin pecado. ¡Ella también te acompaña en tu confesión!',
    },
    {
      q: '¿Qué oración rezas para decirle a Jesús que te duele haberte alejado de su amor?',
      options: ['El Acto de contrición', 'El Santo', 'La bendición de la mesa'],
      answer: 0,
      explain: 'En el Acto de contrición le dices a Jesús que te pesa de todo corazón haber pecado y que quieres volver a su abrazo. ¡Apréndelo de memoria!',
    },
    {
      q: '¿Qué puede contar el sacerdote de lo que le dijiste en tu confesión?',
      options: ['Solo lo más importante', 'Nada, nunca: es un secreto sagrado', 'Todo, si tus papás se lo preguntan'],
      answer: 1,
      explain: 'Es el secreto de confesión: el sacerdote jamás puede contarle a nadie lo que oye. Por eso puedes hablarle con toda confianza.',
    },
    {
      q: '¿Qué respondes cuando el sacerdote te da la absolución?',
      options: ['«Te alabamos, Señor»', '«Hasta luego»', '«Amén»'],
      answer: 2,
      explain: '«Amén» quiere decir «así es, lo creo». Con esa palabra recibes con fe el perdón de Jesús. ¡Tu corazón queda limpio!',
    },
    {
      q: '¿Qué haces después de confesarte?',
      options: ['Cumplo mi penitencia y le doy gracias a Jesús', 'Les cuento a todos mis pecados', 'Me preocupo todo el día'],
      answer: 0,
      explain: 'Cumples la penitencia que te dio el sacerdote y le das gracias a Jesús por su perdón. ¡Sales con el corazón ligero y feliz!',
    },
  ],
};
