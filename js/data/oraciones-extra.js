// Más oraciones y apoyos para rezar de Palomita: oraciones nuevas, versiones del Acto de contrición, el Rosario,
// intenciones para elegir antes de rezar, el Credo frase por frase y el «pasaporte» de lo que se aprende de memoria.
// Módulo de datos puro: sin imports, sin lógica y sin HTML en los textos.
// Las oraciones tradicionales van con su texto habitual en español de América Latina (las de la Misa, con el del
// Misal Romano), partidas en renglones cortos para aprenderlas poco a poco. Las que llevan en la nota
// «Oración sencilla para niños» son redacciones propias.
// Todo se puede leer en voz alta: palabras completas, sin abreviaturas ni números romanos.
// Ortografía actual: «solo» va sin tilde, también en el Gloria (el Misal impreso todavía dice «sólo»).
//
// Formas:
//   PRAYERS_EXTRA = [{ id, title, emoji, group, lines: [...], note }]   (la misma forma que PRAYERS de prayers.js)
//     group: misa | maria | parroquia   (parroquia es un grupo nuevo: nuestra parroquia y su patrono)
//     Ningún id repite uno de PRAYERS. En el Ángelus, el renglón «Dios te salve, María…» marca dónde se reza
//     un Ave María entero (id ave-maria de prayers.js).
//   CONTRITION_VARIANTS = [{ id, title, lines: [...], note }]
//     Versiones del Acto de contrición para que la catequista elija la que usa la app. La primera
//     (jesus-mi-senor) es idéntica, renglón por renglón, a 'acto-de-contricion' de prayers.js y al diálogo del
//     paso 'contricion' de confession.js: si se cambia una de las tres, hay que cambiar las otras dos.
//   ROSARY = {
//     intro: [2 párrafos],
//     howTo: [{ emoji, text }],                      cómo se reza, paso a paso
//     mysteries: [{ id, title, days, items: [5 × { title, ref, text, bg, emojis }] }],
//       id      gozosos | luminosos | dolorosos | gloriosos
//       days    días de la semana en que se rezan, como Date.getDay(): 0 = domingo … 6 = sábado
//       ref     cita bíblica en formato católico («Lucas 1, 26-38»)
//       text    2 o 3 frases: qué pasó y una invitación concreta para el niño
//       bg      un fondo pintado de SCENE_IDS (js/art/scenes.js); emojis: 2 a 4 que dibujan la escena
//       La Asunción y la Coronación de María no se cuentan en la Biblia: llevan la cita tradicional con que la
//       Iglesia las medita (Lucas 1, 48-49, del Magníficat, que se lee en la Misa de la Asunción, y
//       Apocalipsis 12, 1, la mujer vestida de sol con una corona de doce estrellas).
//     closing: { text, prayerIds: ['salve'] },       prayerIds: ids de PRAYERS que se rezan al final
//   }
//   INTENTIONS = [{ id, emoji, label, sick?: true }]   label en primera persona del niño («Por mi mamá»)
//   CREDO_PHRASES = [{ line, topic, explain }]
//     Una entrada por renglón de 'credo' (Credo de los Apóstoles) de prayers.js, con el mismo texto y en el mismo
//     orden. topic: id del tema de catechism.js que lo explica (o null); explain: una o dos frases para niños.
//   MEMORY_SET = [{ id, type: 'prayer' | 'list', title, emoji, lines? }]
//     Lo que se suele pedir de memoria antes de la Primera Comunión, de lo más fácil a lo más difícil.
//     type 'prayer': id de PRAYERS (prayers.js), sin lines: el texto se toma de allí. Si la catequista eligió otra
//     versión en CONTRITION_VARIANTS, el sello de 'acto-de-contricion' debería usar esa.
//     type 'list': trae sus lines, sin número delante (el orden de la lista es el número). Los Mandamientos
//     copian la fórmula del tema 'mandamientos' de catechism.js; los sacramentos, los nombres del tema 'sacramentos'.

export const PRAYERS_EXTRA = [
  // ───────────── Oraciones de la Misa ─────────────
  {
    id: 'gloria-a-dios',
    title: 'Gloria a Dios en el cielo',
    emoji: '🌟',
    group: 'misa',
    lines: [
      'Gloria a Dios en el cielo,',
      'y en la tierra paz a los hombres que ama el Señor.',
      'Por tu inmensa gloria te alabamos,',
      'te bendecimos, te adoramos,',
      'te glorificamos, te damos gracias,',
      'Señor Dios, Rey celestial,',
      'Dios Padre todopoderoso.',
      'Señor, Hijo único, Jesucristo.',
      'Señor Dios, Cordero de Dios, Hijo del Padre;',
      'tú que quitas el pecado del mundo,',
      'ten piedad de nosotros;',
      'tú que quitas el pecado del mundo,',
      'atiende nuestra súplica;',
      'tú que estás sentado a la derecha del Padre,',
      'ten piedad de nosotros;',
      'porque solo tú eres Santo,',
      'solo tú Señor,',
      'solo tú Altísimo, Jesucristo,',
      'con el Espíritu Santo',
      'en la gloria de Dios Padre.',
      'Amén.',
    ],
    note: 'Lo cantamos en la Misa de los domingos, menos en Adviento y en Cuaresma, y en las fiestas. Empieza con el canto de los ángeles en Navidad (Lucas 2, 14). No es el «Gloria al Padre», que es cortito.',
  },
  {
    id: 'credo-niceno',
    title: 'Credo largo (de Nicea y Constantinopla)',
    emoji: '🌍',
    group: 'misa',
    lines: [
      'Creo en un solo Dios,',
      'Padre todopoderoso,',
      'Creador del cielo y de la tierra,',
      'de todo lo visible y lo invisible.',
      'Creo en un solo Señor, Jesucristo,',
      'Hijo único de Dios,',
      'nacido del Padre antes de todos los siglos:',
      'Dios de Dios,',
      'Luz de Luz,',
      'Dios verdadero de Dios verdadero,',
      'engendrado, no creado,',
      'de la misma naturaleza del Padre,',
      'por quien todo fue hecho;',
      'que por nosotros, los hombres,',
      'y por nuestra salvación',
      'bajó del cielo,',
      'y por obra del Espíritu Santo',
      'se encarnó de María, la Virgen,',
      'y se hizo hombre;',
      'y por nuestra causa fue crucificado',
      'en tiempos de Poncio Pilato;',
      'padeció y fue sepultado,',
      'y resucitó al tercer día, según las Escrituras,',
      'y subió al cielo,',
      'y está sentado a la derecha del Padre;',
      'y de nuevo vendrá con gloria',
      'para juzgar a vivos y muertos,',
      'y su reino no tendrá fin.',
      'Creo en el Espíritu Santo,',
      'Señor y dador de vida,',
      'que procede del Padre y del Hijo,',
      'que con el Padre y el Hijo',
      'recibe una misma adoración y gloria,',
      'y que habló por los profetas.',
      'Creo en la Iglesia,',
      'que es una, santa, católica y apostólica.',
      'Confieso que hay un solo bautismo',
      'para el perdón de los pecados.',
      'Espero la resurrección de los muertos',
      'y la vida del mundo futuro.',
      'Amén.',
    ],
    note: 'En la Misa del domingo se reza este Credo o el de los Apóstoles, el cortito que ya sabes: los dos dicen la misma fe. Al decir «y por obra del Espíritu Santo se encarnó…» inclinamos la cabeza.',
  },

  // ───────────── Oraciones a la Virgen María ─────────────
  {
    id: 'angelus',
    title: 'El Ángelus',
    emoji: '🔔',
    group: 'maria',
    lines: [
      'El ángel del Señor anunció a María.',
      'Y concibió por obra y gracia del Espíritu Santo.',
      'Dios te salve, María…',
      'He aquí la esclava del Señor.',
      'Hágase en mí según tu palabra.',
      'Dios te salve, María…',
      'Y el Verbo se hizo carne.',
      'Y habitó entre nosotros.',
      'Dios te salve, María…',
      'Ruega por nosotros, santa Madre de Dios.',
      'Para que seamos dignos de alcanzar',
      'las promesas de nuestro Señor Jesucristo.',
      'Oremos.',
      'Infunde, Señor, tu gracia en nuestras almas,',
      'para que los que, por el anuncio del ángel,',
      'hemos conocido la encarnación de tu Hijo Jesucristo,',
      'por su pasión y su cruz',
      'seamos llevados a la gloria de la resurrección.',
      'Por el mismo Jesucristo, nuestro Señor.',
      'Amén.',
    ],
    note: 'Se reza al mediodía para recordar que el Hijo de Dios se hizo hombre. Uno dice la primera frase y todos responden la segunda. En el tiempo de Pascua, en su lugar, se reza el «Regina Coeli».',
  },
  {
    id: 'oh-jesus-mio',
    title: 'Oh Jesús mío (jaculatoria de Fátima)',
    emoji: '💗',
    group: 'maria',
    lines: [
      'Oh Jesús mío,',
      'perdona nuestros pecados,',
      'líbranos del fuego del infierno,',
      'lleva al cielo a todas las almas,',
      'especialmente a las más necesitadas',
      'de tu misericordia.',
    ],
    note: 'La Virgen se la enseñó en 1917 a tres pastorcitos de Fátima, en Portugal. La rezamos al final de cada misterio del Rosario, después del Gloria.',
  },
  {
    id: 'virgen-de-cocharcas',
    title: 'Oración a la Virgen de Cocharcas',
    emoji: '💐',
    group: 'maria',
    lines: [
      'Virgen de Cocharcas, Madre querida,',
      'que acompañas a las familias del valle del Mantaro:',
      'cúbreme con tu manto y cuida a mi familia.',
      'Enséñame a amar a Jesús con todo el corazón',
      'y a decirle «sí» a Dios, como tú.',
      'Acompáñame en mi camino a la Primera Comunión',
      'y llévame siempre de tu mano hacia Jesús.',
      'Virgen de Cocharcas, ruega por nosotros.',
      'Amén.',
    ],
    note: 'Oración sencilla para niños. La Virgen de Cocharcas es la Virgen María, nuestra Madre, muy querida en el valle del Mantaro. Su fiesta grande es el 8 de septiembre, por ejemplo en Sapallanga.',
  },

  // ───────────── Oraciones de nuestra parroquia ─────────────
  {
    id: 'oracion-al-cura-de-ars',
    title: 'Oración al Santo Cura de Ars',
    emoji: '😇',
    group: 'parroquia',
    lines: [
      'Santo Cura de Ars,',
      'san Juan María Vianney:',
      'tú amaste mucho a Jesús en la Eucaristía',
      'y en la Confesión perdonaste a muchos en su nombre.',
      'Ruega por nuestros sacerdotes,',
      'para que sean pastores buenos y santos,',
      'y cuida a nuestra parroquia, que lleva tu nombre.',
      'Y a nosotros, que nos preparamos',
      'para la Primera Comunión,',
      'ayúdanos a recibir a Jesús',
      'con un corazón limpio y alegre.',
      'Amén.',
    ],
    note: 'Oración sencilla para niños. San Juan María Vianney, el Santo Cura de Ars, es el patrono de nuestra parroquia y de los párrocos. Su fiesta es el 4 de agosto.',
  },
];

// ───────────── Versiones del Acto de contrición ─────────────
export const CONTRITION_VARIANTS = [
  {
    id: 'jesus-mi-senor',
    title: 'Jesús, mi Señor y Redentor',
    lines: [
      'Jesús, mi Señor y Redentor:',
      'yo me arrepiento de todos los pecados',
      'que he cometido hasta hoy,',
      'y me pesa de todo corazón,',
      'porque con ellos ofendí a un Dios tan bueno.',
      'Propongo firmemente no volver a pecar,',
      'y confío en que, por tu infinita misericordia,',
      'me has de conceder el perdón de mis culpas',
      'y me has de llevar a la vida eterna.',
      'Amén.',
    ],
    note: 'Es la versión que la app usa hoy en las oraciones y en la guía de la Confesión. Clara y completa: dolor de los pecados, propósito de no volver a pecar y confianza en la misericordia de Jesús.',
  },
  {
    id: 'senor-mio-jesucristo',
    title: 'Señor mío Jesucristo',
    lines: [
      'Señor mío Jesucristo,',
      'Dios y hombre verdadero,',
      'Creador, Padre y Redentor mío;',
      'por ser Vos quien sois, bondad infinita,',
      'y porque os amo sobre todas las cosas,',
      'me pesa de todo corazón haberos ofendido;',
      'también me pesa porque podéis castigarme',
      'con las penas del infierno.',
      'Ayudado de vuestra divina gracia,',
      'propongo firmemente nunca más pecar,',
      'confesarme y cumplir la penitencia',
      'que me fuere impuesta.',
      'Amén.',
    ],
    note: 'Es el Acto de contrición tradicional que rezaron nuestros abuelos, con el «Vos» del castellano antiguo. Algunas parroquias lo enseñan con «tú» («por ser tú quien eres») o con un final más largo.',
  },
  {
    id: 'pesame-dios-mio',
    title: 'Pésame, Dios mío',
    lines: [
      'Pésame, Dios mío,',
      'y me arrepiento de todo corazón de haberte ofendido.',
      'Pésame por el infierno que merecí',
      'y por el cielo que perdí;',
      'pero mucho más me pesa',
      'porque pecando ofendí a un Dios tan bueno',
      'y tan grande como Tú.',
      'Antes querría haber muerto que haberte ofendido,',
      'y propongo firmemente no pecar más',
      'y evitar todas las ocasiones próximas de pecado.',
      'Amén.',
    ],
    note: 'Versión breve y tradicional. «Pésame» quiere decir «me duele». Nos duele perder el cielo, pero mucho más haber ofendido a un Dios tan bueno.',
  },
  {
    id: 'dios-mio-me-arrepiento',
    title: 'Dios mío, me arrepiento (breve)',
    lines: [
      'Dios mío,',
      'me arrepiento de todo corazón de mis pecados,',
      'porque te ofendí a ti, que eres tan bueno.',
      'Con tu ayuda, propongo no volver a pecar.',
      'Amén.',
    ],
    note: 'Versión muy breve, para los más pequeños o para cuando los nervios aprietan. Tiene lo esencial: dolor de haber ofendido a Dios y propósito de no volver a pecar. Su redacción cambia un poco según la parroquia.',
  },
];

// ───────────── El Rosario ─────────────
export const ROSARY = {
  intro: [
    'El Rosario es una oración muy querida que rezamos junto a la Virgen María. Vamos pasando entre los dedos las cuentas del rosario, y en cada cuenta pequeña decimos un Ave María. Cada Ave María es como una rosa que le regalamos a nuestra Madre: por eso se llama «Rosario».',
    'Pero el Rosario no es solo repetir palabras. En cada misterio recordamos un momento de la vida de Jesús: cuando nació, cuando nos enseñó, cuando dio su vida por nosotros y cuando resucitó. Lo miramos con los ojos de María, que lo conoce mejor que nadie, y ella nos lleva de la mano hacia Jesús.',
  ],

  howTo: [
    { emoji: '✝️', text: 'Tomamos el crucifijo del rosario, hacemos la Señal de la Cruz y rezamos el Credo.' },
    { emoji: '🙏', text: 'En la primera cuenta grande rezamos un Padre Nuestro.' },
    { emoji: '🌹', text: 'En las tres cuentas pequeñas rezamos tres Avemarías, pidiendo a Dios más fe, más esperanza y más amor. Terminamos con un Gloria.' },
    { emoji: '🗣️', text: 'Anunciamos el primer misterio, por ejemplo: «Primer misterio gozoso: la Anunciación». Pensamos un momento en lo que pasó.' },
    { emoji: '📿', text: 'En la cuenta grande rezamos un Padre Nuestro y en las diez cuentas pequeñas, diez Avemarías, pensando en el misterio.' },
    { emoji: '✨', text: 'Al terminar las diez Avemarías rezamos el Gloria y el «Oh Jesús mío». ¡Ya rezaste una decena!' },
    { emoji: '🔁', text: 'Hacemos lo mismo con los otros cuatro misterios: cinco decenas dan la vuelta completa al rosario. Si recién empiezas, puedes rezar una sola decena.' },
    { emoji: '👑', text: 'Al final rezamos la Salve a nuestra Madre y terminamos con la Señal de la Cruz.' },
  ],

  mysteries: [
    // ───── Gozosos: lunes y sábado ─────
    {
      id: 'gozosos',
      title: 'Misterios gozosos',
      days: [1, 6],
      items: [
        {
          title: 'La Anunciación del ángel a María',
          ref: 'Lucas 1, 26-38',
          text: 'El ángel Gabriel le anuncia a María que Dios la eligió para ser la Madre de Jesús. María confía en Dios y responde: «Aquí está la servidora del Señor». Pídele a María que te ayude a decirle «sí» a Dios en las cosas de cada día.',
          bg: 'dorado',
          emojis: ['👼', '🌸', '✨'],
        },
        {
          title: 'La Visitación de María a su prima Isabel',
          ref: 'Lucas 1, 39-56',
          text: 'María va de prisa a un pueblo de la montaña para ayudar a su prima Isabel, que espera un bebé. Al oír su saludo, el bebé salta de alegría en el vientre de Isabel. Ayuda tú también hoy a alguien, sin esperar a que te lo pida.',
          bg: 'monte',
          emojis: ['⛰️', '🤗', '💛'],
        },
        {
          title: 'El Nacimiento de Jesús en Belén',
          ref: 'Lucas 2, 1-20',
          text: 'Jesús nace en Belén y María lo acuesta en un pesebre, porque no había lugar para ellos en el alojamiento. Los ángeles anuncian la gran noticia y los pastores corren a ver al Niño. Dale gracias a Jesús por hacerse pequeñito por amor a ti.',
          bg: 'noche',
          emojis: ['⭐', '👶', '🐑', '👼'],
        },
        {
          title: 'La Presentación de Jesús en el Templo',
          ref: 'Lucas 2, 22-38',
          text: 'María y José llevan al niño Jesús al Templo para ofrecérselo a Dios, con dos palomitas como ofrenda. El anciano Simeón lo toma en brazos y bendice a Dios, ¡porque ve al Salvador! Ofrécele tú también a Dios tu día: tus juegos, tus tareas y tu cariño.',
          bg: 'templo',
          emojis: ['🏛️', '👶', '🕊️'],
        },
        {
          title: 'El Niño Jesús perdido y hallado en el Templo',
          ref: 'Lucas 2, 41-52',
          text: 'A los doce años, Jesús se queda en el Templo de Jerusalén sin que sus papás lo sepan. María y José lo buscan muy preocupados y, al tercer día, lo encuentran escuchando y preguntando a los maestros. Busca tú también a Jesús cada día, en la oración y en la Misa.',
          bg: 'templo',
          emojis: ['🏛️', '📜', '👦'],
        },
      ],
    },

    // ───── Luminosos: jueves ─────
    {
      id: 'luminosos',
      title: 'Misterios luminosos',
      days: [4],
      items: [
        {
          title: 'El Bautismo de Jesús en el Jordán',
          ref: 'Mateo 3, 13-17',
          text: 'Jesús se hace bautizar por Juan en el río Jordán. El Espíritu Santo baja sobre Él como una paloma y se oye la voz del Padre: «Este es mi Hijo amado». Dale gracias a Dios porque en tu Bautismo también te hizo hijo suyo.',
          bg: 'rio',
          emojis: ['💧', '🕊️', '☁️'],
        },
        {
          title: 'Jesús en las bodas de Caná',
          ref: 'Juan 2, 1-11',
          text: 'En una boda se acaba el vino; María se da cuenta, se lo cuenta a Jesús y les dice a los sirvientes: «Hagan lo que Él les diga». Jesús convierte el agua en vino, ¡su primer milagro! Cuéntale a María lo que te preocupa: ella siempre te lleva a Jesús.',
          bg: 'campo',
          emojis: ['🏺', '🍇', '🎉'],
        },
        {
          title: 'Jesús anuncia el Reino de Dios',
          ref: 'Marcos 1, 14-15',
          text: 'Jesús recorre los pueblos de Galilea anunciando: «El Reino de Dios está cerca: conviértanse y crean en la Buena Noticia». Perdona a los pecadores y les cambia el corazón. Pídele a Jesús un corazón nuevo y acércate a su perdón en la Confesión.',
          bg: 'mar',
          emojis: ['👣', '👑', '💛'],
        },
        {
          title: 'La Transfiguración de Jesús',
          ref: 'Mateo 17, 1-8',
          text: 'Jesús sube a un monte alto con Pedro, Santiago y Juan, y su rostro brilla como el sol. Desde una nube, el Padre dice: «Este es mi Hijo amado: escúchenlo». Escucha tú también a Jesús: lee con tu familia un pedacito del Evangelio.',
          bg: 'monte',
          emojis: ['⛰️', '✨', '☁️'],
        },
        {
          title: 'La institución de la Eucaristía',
          ref: 'Mateo 26, 26-29',
          text: 'En la Última Cena, Jesús toma el pan y dice: «Tomen y coman: esto es mi Cuerpo»; luego toma el cáliz y dice: «Esta es mi Sangre». Así se queda con nosotros para siempre en la Eucaristía. Prepara tu corazón para recibirlo en tu Primera Comunión.',
          bg: 'cenaculo',
          emojis: ['🍞', '🍷', '🕯️'],
        },
      ],
    },

    // ───── Dolorosos: martes y viernes ─────
    {
      id: 'dolorosos',
      title: 'Misterios dolorosos',
      days: [2, 5],
      items: [
        {
          title: 'La oración de Jesús en el huerto',
          ref: 'Lucas 22, 39-46',
          text: 'Después de la Última Cena, Jesús va a rezar al monte de los Olivos. Siente mucha angustia, pero confía en su Padre y le dice: «Que no se haga mi voluntad, sino la tuya». Cuando estés triste o tengas miedo, cuéntaselo a Dios, como hizo Jesús.',
          bg: 'noche',
          emojis: ['🌙', '🙏', '🌳'],
        },
        {
          title: 'La flagelación de Jesús',
          ref: 'Juan 19, 1',
          text: 'Pilato manda que azoten a Jesús. Le hacen mucho daño, pero Él no responde con odio: lo soporta todo por amor a nosotros. Pide perdón por las veces que lastimaste a alguien y trata con cariño a quien sufre.',
          bg: 'ciudad',
          emojis: ['🏛️', '💔', '🤍'],
        },
        {
          title: 'La coronación de espinas',
          ref: 'Mateo 27, 27-31',
          text: 'Los soldados se burlan de Jesús: le ponen un manto rojo y una corona de espinas, y lo llaman «rey» para reírse de Él. Jesús, el verdadero Rey, lo soporta en silencio y sigue amando. Si ves que alguien se burla de otro, no te rías: defiéndelo con cariño.',
          bg: 'ciudad',
          emojis: ['👑', '🌵', '💔'],
        },
        {
          title: 'Jesús con la cruz a cuestas',
          ref: 'Lucas 23, 26-32',
          text: 'Jesús carga la cruz por el camino que sube al Calvario. Un hombre llamado Simón de Cirene la lleva detrás de Él y así lo ayuda. Ayuda tú también a quien lleva una carga pesada, en tu casa, en el colegio o en el barrio.',
          bg: 'monte',
          emojis: ['✝️', '👣', '🤝'],
        },
        {
          title: 'La crucifixión y muerte de Jesús',
          ref: 'Lucas 23, 33-46',
          text: 'Jesús muere en la cruz por amor a todos nosotros, y aun allí perdona: «Padre, perdónalos, porque no saben lo que hacen». Cuando mires una cruz, dale gracias a Jesús por su amor y perdona tú también a quien te ofendió.',
          bg: 'noche',
          emojis: ['✝️', '❤️', '🙏'],
        },
      ],
    },

    // ───── Gloriosos: miércoles y domingo ─────
    {
      id: 'gloriosos',
      title: 'Misterios gloriosos',
      days: [3, 0],
      items: [
        {
          title: 'La Resurrección de Jesús',
          ref: 'Lucas 24, 1-12',
          text: 'El domingo, muy temprano, unas mujeres van al sepulcro y lo encuentran vacío. Dos hombres con ropas brillantes les dicen: «¿Por qué buscan entre los muertos al que vive? ¡Ha resucitado!». Vive con alegría y cuéntale a alguien que Jesús está vivo.',
          bg: 'amanecer',
          emojis: ['🌅', '🌷', '✨'],
        },
        {
          title: 'La Ascensión de Jesús al cielo',
          ref: 'Hechos 1, 6-11',
          text: 'Cuarenta días después de resucitar, Jesús sube al cielo ante sus apóstoles, y una nube lo oculta. Antes les promete el Espíritu Santo y les pide que sean sus testigos en todo el mundo. Sé tú también su testigo, con tu alegría y tus buenas obras.',
          bg: 'monte',
          emojis: ['☁️', '⛰️', '✨'],
        },
        {
          title: 'La venida del Espíritu Santo (Pentecostés)',
          ref: 'Hechos 1, 14; 2, 1-4',
          text: 'Los apóstoles están reunidos rezando, junto con María. De pronto se oye un ruido como de viento fuerte, aparecen como lenguas de fuego sobre cada uno, y todos quedan llenos del Espíritu Santo. Pídele al Espíritu Santo valentía para hacer el bien, aunque cueste.',
          bg: 'dorado',
          emojis: ['🔥', '🕊️', '🌬️'],
        },
        {
          // Sin relato bíblico directo: cita tradicional (Magníficat, Evangelio de la Misa de la Asunción).
          title: 'La Asunción de María al cielo',
          ref: 'Lucas 1, 48-49',
          text: 'Cuando termina su vida en la tierra, María es llevada al cielo en cuerpo y alma, para estar para siempre con Jesús. ¡Allí nos espera, como una mamá espera a sus hijos en casa! Pídele a María que te ayude a caminar hacia el cielo, amando a Dios y a los demás.',
          bg: 'cielo',
          emojis: ['☁️', '🌹', '✨'],
        },
        {
          // Sin relato bíblico directo: cita tradicional (la mujer con una corona de doce estrellas).
          title: 'La Coronación de María, Reina del cielo y de la tierra',
          ref: 'Apocalipsis 12, 1',
          text: 'Dios corona a María como Reina del cielo y de la tierra. Es una Reina llena de ternura, que cuida a cada uno de sus hijos. Regálale hoy a María una flor, una oración o una buena obra hecha con amor.',
          bg: 'dorado',
          emojis: ['👑', '⭐', '🌹'],
        },
      ],
    },
  ],

  closing: {
    text: 'Al terminar los cinco misterios, rezamos la Salve a nuestra Madre. ¡De la mano de María, siempre llegamos a Jesús!',
    prayerIds: ['salve'],
  },
};

// ───────────── Intenciones para elegir antes de rezar ─────────────
export const INTENTIONS = [
  { id: 'mama', emoji: '👩', label: 'Por mi mamá' },
  { id: 'papa', emoji: '👨', label: 'Por mi papá' },
  { id: 'hermanos', emoji: '👫', label: 'Por mis hermanos' },
  { id: 'abuelitos', emoji: '👵', label: 'Por mis abuelitos' },
  { id: 'amigos', emoji: '🤝', label: 'Por mis amigos' },
  { id: 'enfermo', emoji: '🤒', label: 'Por alguien que está enfermo', sick: true },
  { id: 'tristes', emoji: '😢', label: 'Por los que están tristes' },
  { id: 'sin-comida', emoji: '🍞', label: 'Por los niños que no tienen qué comer' },
  { id: 'peru', emoji: '🏔️', label: 'Por el Perú' },
  { id: 'parroquia', emoji: '⛪', label: 'Por mi parroquia y los sacerdotes' },
  { id: 'difuntos', emoji: '🕯️', label: 'Por los que ya murieron, para que estén con Dios' },
  { id: 'me-cuesta-querer', emoji: '🤍', label: 'Por quien me cuesta querer' },
];

// ───────────── El Credo, frase por frase ─────────────
export const CREDO_PHRASES = [
  {
    line: 'Creo en Dios, Padre todopoderoso,',
    topic: 'dios',
    explain: 'Creer es fiarme de Dios con todo el corazón. Él es mi Padre, que me quiere muchísimo, y es todopoderoso: para Él no hay nada imposible.',
  },
  {
    line: 'Creador del cielo y de la tierra.',
    topic: 'creacion',
    explain: 'Dios hizo con amor todo lo que existe, lo que vemos y lo que no vemos. ¡Y también te creó a ti, a su imagen!',
  },
  {
    line: 'Creo en Jesucristo, su único Hijo, nuestro Señor,',
    topic: 'jesus',
    explain: 'Jesús es el Hijo de Dios, Dios igual que el Padre, que se hizo hombre por nosotros. Lo llamamos «Señor» porque le damos el primer lugar en nuestra vida.',
  },
  {
    line: 'que fue concebido por obra y gracia del Espíritu Santo,',
    topic: 'maria',
    explain: 'Por el poder del Espíritu Santo, el Hijo de Dios se hizo hombre en el vientre de la Virgen María. ¡Es un milagro que solo Dios podía hacer!',
  },
  {
    line: 'nació de santa María Virgen,',
    topic: 'maria',
    explain: 'Jesús nació en Belén de la Virgen María, la mamá que Dios eligió para su Hijo. Desde la cruz, Jesús nos la regaló también como Madre.',
  },
  {
    line: 'padeció bajo el poder de Poncio Pilato,',
    topic: 'semana-santa',
    explain: 'Jesús sufrió mucho por amor a nosotros. Poncio Pilato era el gobernador romano que lo condenó: nombrarlo nos recuerda que todo esto pasó de verdad.',
  },
  {
    line: 'fue crucificado, muerto y sepultado,',
    topic: 'semana-santa',
    explain: 'Jesús dio su vida en la cruz para salvarnos y lo pusieron en un sepulcro. Murió de verdad, y lo hizo por amor a ti.',
  },
  {
    line: 'descendió a los infiernos,',
    topic: 'semana-santa',
    explain: 'Aquí «los infiernos» no es el infierno: es el lugar donde esperaban las personas buenas que habían muerto antes de Jesús. Él bajó hasta allí para abrirles las puertas del cielo.',
  },
  {
    line: 'al tercer día resucitó de entre los muertos,',
    topic: 'semana-santa',
    explain: 'Al tercer día, el domingo, Jesús resucitó con un cuerpo glorioso que ya no puede morir: ¡venció a la muerte! Por eso el domingo es el día del Señor.',
  },
  {
    line: 'subió a los cielos',
    topic: 'vida-eterna',
    explain: 'Cuarenta días después de resucitar, Jesús subió al cielo, junto a su Padre. Fue a prepararnos un lugar, porque quiere que un día estemos con Él.',
  },
  {
    line: 'y está sentado a la derecha de Dios, Padre todopoderoso.',
    topic: 'jesus',
    explain: '«Sentado a la derecha» quiere decir que Jesús reina junto al Padre con todo su poder y su gloria. Desde allí nos cuida y pide al Padre por nosotros.',
  },
  {
    line: 'Desde allí ha de venir a juzgar a vivos y muertos.',
    topic: 'vida-eterna',
    explain: 'Al final de los tiempos, Jesús volverá lleno de gloria y se verá el amor que hubo en cada corazón. No tenemos miedo: el juez es Jesús, que nos ama, y lo esperamos amando.',
  },
  {
    line: 'Creo en el Espíritu Santo,',
    topic: 'dios',
    explain: 'El Espíritu Santo es Dios, igual que el Padre y el Hijo. Vive en tu corazón desde el Bautismo y te da fuerza y alegría para hacer el bien.',
  },
  {
    line: 'la santa Iglesia católica,',
    topic: 'iglesia',
    explain: 'La Iglesia es la gran familia de los que creemos en Jesús. Es santa porque Jesús la hace santa, y católica, que quiere decir «universal», porque es para todos, en todo el mundo.',
  },
  {
    line: 'la comunión de los santos,',
    topic: 'vida-eterna',
    explain: 'Los santos del cielo, los difuntos que se purifican para llegar a Dios y nosotros, en la tierra, formamos una sola familia. Nos ayudamos y rezamos unos por otros.',
  },
  {
    line: 'el perdón de los pecados,',
    topic: 'reconciliacion',
    explain: 'Dios siempre quiere perdonarnos. Nos perdona en el Bautismo y, cada vez que volvemos a Él arrepentidos, en la Confesión.',
  },
  {
    line: 'la resurrección de la carne',
    topic: 'vida-eterna',
    explain: '«Carne» quiere decir cuerpo. Al final de los tiempos, Dios resucitará nuestros cuerpos, como resucitó Jesús.',
  },
  {
    line: 'y la vida eterna.',
    topic: 'vida-eterna',
    explain: 'Dios nos creó para vivir con Él para siempre en el cielo, donde ya no habrá llanto ni dolor. ¡Es la alegría más grande que nos espera!',
  },
  {
    line: 'Amén.',
    topic: null,
    explain: '«Amén» quiere decir «así es, lo creo de verdad». Con esta palabra firmamos todo lo que acabamos de decir.',
  },
];

// ───────────── Pasaporte: lo que aprendo de memoria ─────────────
export const MEMORY_SET = [
  { id: 'senal-de-la-cruz', type: 'prayer', title: 'Señal de la Cruz', emoji: '✝️' },
  { id: 'gloria', type: 'prayer', title: 'Gloria al Padre', emoji: '✨' },
  { id: 'senor-no-soy-digno', type: 'prayer', title: 'Señor, no soy digno', emoji: '🏠' },
  { id: 'angel-de-la-guarda', type: 'prayer', title: 'Ángel de la Guarda', emoji: '👼' },
  { id: 'padre-nuestro', type: 'prayer', title: 'Padre Nuestro', emoji: '🙏' },
  { id: 'ave-maria', type: 'prayer', title: 'Ave María', emoji: '🌹' },
  {
    id: 'sacramentos',
    type: 'list',
    title: 'Los siete sacramentos',
    emoji: '🎁',
    lines: [
      'Bautismo',
      'Confirmación',
      'Eucaristía',
      'Reconciliación',
      'Unción de los Enfermos',
      'Orden Sacerdotal',
      'Matrimonio',
    ],
  },
  { id: 'yo-confieso', type: 'prayer', title: 'Yo confieso', emoji: '💜' },
  { id: 'acto-de-contricion', type: 'prayer', title: 'Acto de contrición', emoji: '🤗' },
  {
    id: 'mandamientos',
    type: 'list',
    title: 'Los Diez Mandamientos',
    emoji: '📜',
    lines: [
      'Amarás a Dios sobre todas las cosas',
      'No tomarás el nombre de Dios en vano',
      'Santificarás las fiestas',
      'Honrarás a tu padre y a tu madre',
      'No matarás',
      'No cometerás actos impuros',
      'No robarás',
      'No dirás falso testimonio ni mentirás',
      'No consentirás pensamientos ni deseos impuros',
      'No codiciarás los bienes ajenos',
    ],
  },
  { id: 'salve', type: 'prayer', title: 'La Salve', emoji: '👑' },
  { id: 'credo', type: 'prayer', title: 'Credo de los Apóstoles', emoji: '🕯️' },
];
