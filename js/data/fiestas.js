// Tiempos del año de la Iglesia, días especiales y fiestas para Palomita: calendario romano con las fiestas y
// costumbres del Perú y del valle del Mantaro (Parroquia Santo Cura de Ars, Pío Pata, El Tambo, Huancayo).
// Módulo de datos puro: sin imports, sin lógica y sin HTML. Los textos se insertan como texto y se leen en voz alta,
// por eso no llevan abreviaturas ni números romanos. Qué día es cada cosa lo calcula js/core/liturgy.js.
//
//   SEASONS        los seis tiempos (las claves son los id de seasonOf): { title, color, emoji, text, kidLine, tip }
//                    text: qué celebramos y cómo vivirlo (2–3 frases); kidLine: lo que dice la palomita (90 caracteres
//                    como máximo); tip: algo concreto para hacer en familia (para los papás: «ustedes»).
//   SPECIAL_DAYS   días que marca seasonOf(date).special: { title, emoji, kidLine, text (1–2 frases), feast? }
//                    feast: id de la fiesta de FEASTS que cuenta lo mismo con más detalle (la pantalla puede mostrar
//                    solo una de las dos).
//   FEASTS         fiestas: { id, title, emoji, rule, color, bg, emojis, paragraphs, prayer, peru, local }
//     rule        { month: 1–12, day }                   fecha fija
//                 { from: 'pascua', offset: días }       móvil, contada desde el Domingo de Pascua
//                 { month, nthWeekday: { weekday: 0–6 (0 = domingo), n: 1–5, o −1 para el último } }
//                 transfer (opcional, solo solemnidades): si la fecha cae en Semana Santa, en la Octava de Pascua o en
//                 un domingo de Adviento, Cuaresma o Pascua, la Iglesia la traslada (ver feastDate en liturgy.js).
//                 'despues' es la regla general; 'antes' es la de san José, que en Semana Santa se adelanta al sábado
//                 anterior al Domingo de Ramos.
//     color       color de la Misa de esa fiesta: 'blanco' | 'rojo' | 'morado' | 'verde'. En el Señor de los
//                 Milagros es el morado del hábito de sus devotos.
//     bg, emojis  fondo pintado de js/art/scenes.js (SCENE_IDS) y 2–4 emojis para la escena.
//     paragraphs  2–3 párrafos cortos para niños. Sirven el mismo día y en la lista de próximas fiestas: no dicen «hoy».
//     prayer      oración de 1–2 frases.
//     peru        true: santo, devoción o costumbre propia del Perú.
//     local       true: de nuestra parroquia o muy viva en Huancayo y el valle del Mantaro.
//   ADVENT_WEEKS   las cuatro velas de la corona de Adviento: { week, candle, title, text, kidLine }
//   NOVENA         novena de Navidad (16 al 24 de diciembre): una figura del nacimiento por día { day, figure, emoji, text }
//   LENT_TIPS      pequeños sacrificios y obras de amor para la Cuaresma
//
// Fechas en el Perú (la parroquia puede confirmarlas o cambiarlas aquí):
//   · Santa Rosa de Lima: 30 de agosto, solemnidad y feriado en el Perú (en el calendario general es el 23).
//   · Corpus Christi: en el Perú se celebra el domingo, 63 días después de la Pascua (en el calendario general, el
//     jueves anterior).
//   · Epifanía: en el Perú la Misa de la Epifanía es el domingo entre el 2 y el 8 de enero, pero las familias hacen la
//     Bajada de Reyes el 6 de enero: la fiesta va el 6.
//   · Cruz de Mayo, Señor de los Milagros y Virgen de Cocharcas son fiestas populares: van en su fecha tradicional,
//     aunque cada pueblo, barrio o hermandad organiza sus celebraciones en los días cercanos.
//   · Inmaculada Concepción: siempre el 8 de diciembre (feriado). Cuando cae domingo, como en 2030, las normas
//     generales pasan la solemnidad al lunes 9; si la parroquia lo hace así, basta agregar transfer: 'despues'.

export const SEASONS = {
  adviento: {
    title: 'Tiempo de Adviento',
    color: 'morado',
    emoji: '🕯️',
    text: 'Adviento quiere decir «venida». Son cuatro semanas para preparar el corazón: Jesús vino en Belén, viene cada día a nuestra vida y volverá al final de los tiempos. Lo esperamos con alegría, rezando un poquito más y siendo más cariñosos con todos.',
    kidLine: '¡Jesús ya viene! Preparemos el corazón como una casita limpia y bonita.',
    tip: 'Armen en familia una corona de Adviento con cuatro velas: tres moradas y una rosada. Cada domingo enciendan una vela más y recen juntos un ratito.',
  },
  navidad: {
    title: 'Tiempo de Navidad',
    color: 'blanco',
    emoji: '⭐',
    text: 'Celebramos que el Hijo de Dios nació en Belén y se hizo niño como tú. ¡Dios está con nosotros! Por eso todo es fiesta y luz hasta el Bautismo del Señor, cuando termina este tiempo.',
    kidLine: '¡Jesús nació! Vamos al nacimiento a darle un abrazo con el corazón.',
    tip: 'Recen juntos frente al nacimiento de la casa y cántenle un villancico al Niño Jesús. Compartan una chocolatada con alguien que esté solo o que lo necesite.',
  },
  ordinario: {
    title: 'Tiempo ordinario',
    color: 'verde',
    emoji: '🌱',
    text: 'Es el tiempo más largo del año. Escuchamos lo que Jesús hizo y enseñó, y vamos creciendo en la fe como una plantita. Por eso su color es el verde, el color de la esperanza y de todo lo que crece.',
    kidLine: '¡A crecer con Jesús! Cada día un poquito más, como una plantita.',
    tip: 'Después de la Misa del domingo, conversen en familia sobre el Evangelio: ¿qué hizo o qué dijo Jesús? Elijan juntos una cosa para vivirla durante la semana.',
  },
  cuaresma: {
    title: 'Tiempo de Cuaresma',
    color: 'morado',
    emoji: '🌵',
    text: 'Son cuarenta días para prepararnos a la Pascua, como los cuarenta días que Jesús pasó rezando en el desierto. Rezamos más, compartimos con los que necesitan y hacemos pequeños sacrificios por amor. Así el corazón queda listo para celebrar que Jesús resucitó.',
    kidLine: '¡Cuarenta días para entrenar el corazón! ¿Qué buena obra harás hoy?',
    tip: 'Pongan en la mesa una alcancía. Cuando alguien deje un gustito, como una golosina, guarde ahí esa monedita; al final de la Cuaresma llévenla a la parroquia para ayudar a los que más lo necesitan.',
  },
  triduo: {
    title: 'Triduo Pascual',
    // Cada día tiene su color (Jueves Santo blanco, Viernes Santo rojo, Sábado Santo morado): este es el de la Pasión.
    color: 'rojo',
    emoji: '✝️',
    text: 'Son los días más santos del año. Empiezan el Jueves Santo en la noche, con la Última Cena, y llegan hasta el Domingo de Pascua. Recordamos que Jesús dio su vida en la cruz por amor a nosotros y esperamos en silencio su Resurrección.',
    kidLine: 'Jesús nos ama tanto que dio su vida por nosotros. Acompañémoslo.',
    tip: 'Participen juntos en las celebraciones de la parroquia: la Misa de la Cena del Señor, la celebración de la Pasión el Viernes Santo y la Vigilia Pascual. En casa, guarden un rato de silencio y recen el Vía Crucis.',
  },
  pascua: {
    title: 'Tiempo de Pascua',
    color: 'blanco',
    emoji: '🌅',
    text: '¡Jesús resucitó y está vivo! Durante cincuenta días celebramos la fiesta más grande del año: el sacerdote se viste de blanco y cantamos «¡Aleluya!». Este tiempo termina en Pentecostés, cuando Jesús nos envía el Espíritu Santo.',
    kidLine: '¡Aleluya! ¡Jesús está vivo! Todo canta de alegría.',
    tip: 'En la comida del domingo, enciendan una vela blanca en la mesa, como el cirio pascual de la iglesia, y den gracias juntos porque Jesús vive.',
  },
};

export const SPECIAL_DAYS = {
  // ── Adviento y Navidad ──
  gaudete: {
    title: 'Domingo «Gaudete»',
    emoji: '🌸',
    kidLine: '¡Ya falta poquito para Navidad! Hoy brilla la vela rosada.',
    text: 'Es el tercer domingo de Adviento. «Gaudete» quiere decir «¡Alégrense!», porque Jesús ya está cerca; por eso el sacerdote puede vestirse de rosado.',
  },
  nochebuena: {
    title: 'Nochebuena',
    emoji: '🌟',
    kidLine: '¡Esta noche nace Jesús! ¿Ya está listo su lugarcito en el nacimiento?',
    text: 'Esta noche celebramos que Jesús nace en Belén. Muchas familias van juntas a la Misa de Gallo y ponen al Niño Jesús en el nacimiento.',
  },
  navidad: {
    title: 'Navidad',
    emoji: '⭐',
    kidLine: '¡Feliz Navidad! ¡Jesús nació y vino a quedarse contigo!',
    text: '¡Nació el Niño Jesús en Belén! Dios se hizo pequeñito para estar cerca de nosotros.',
    feast: 'navidad',
  },
  epifania: {
    title: 'Epifanía: Bajada de Reyes',
    emoji: '👑',
    kidLine: '¡Llegaron los Reyes Magos! Tú también puedes regalarle a Jesús tu corazón.',
    text: 'Los Reyes Magos siguieron una estrella desde el Oriente y adoraron al Niño Jesús. Le regalaron oro, incienso y mirra.',
    feast: 'bajada-de-reyes',
  },
  bautismo: {
    title: 'Bautismo del Señor',
    emoji: '💧',
    kidLine: 'Jesús fue bautizado en el río Jordán. ¡Y tú también eres hijo de Dios!',
    text: 'Juan bautizó a Jesús en el río Jordán, y se oyó la voz del Padre: «Este es mi Hijo amado». Con esta fiesta termina el tiempo de Navidad.',
  },

  // ── Cuaresma y Semana Santa ──
  cenizas: {
    title: 'Miércoles de Ceniza',
    emoji: '🙏',
    kidLine: '¡Hoy empieza la Cuaresma! Cuarenta días para regalarle a Jesús un corazón nuevo.',
    text: 'Hoy empieza la Cuaresma. El sacerdote nos pone ceniza en la frente y nos dice: «Conviértete y cree en el Evangelio».',
  },
  laetare: {
    title: 'Domingo «Laetare»',
    emoji: '🌸',
    kidLine: '¡Ánimo, ya pasamos la mitad de la Cuaresma! La Pascua se acerca.',
    text: 'Es el cuarto domingo de Cuaresma. «Laetare» quiere decir «¡Alégrate!», porque ya se acerca la Pascua; por eso el sacerdote puede vestirse de rosado.',
  },
  ramos: {
    title: 'Domingo de Ramos',
    emoji: '🌿',
    kidLine: '¡Hosanna! Hoy saludamos a Jesús, nuestro Rey, con ramos en las manos.',
    text: 'Jesús entró en Jerusalén montado en un burrito y la gente lo recibió con ramos, gritando «¡Hosanna!». Hoy llevamos nuestros ramos a la iglesia para que los bendigan, y empieza la Semana Santa.',
  },
  'jueves-santo': {
    title: 'Jueves Santo',
    emoji: '🍞',
    kidLine: 'Hoy Jesús nos regaló la Eucaristía: ¡se queda con nosotros para siempre!',
    text: 'En la Misa de la tarde recordamos la Última Cena: Jesús lavó los pies a sus amigos y nos regaló la Eucaristía. En el Perú, muchas familias visitan esa noche siete iglesias para acompañar a Jesús.',
  },
  'viernes-santo': {
    title: 'Viernes Santo',
    emoji: '✝️',
    kidLine: 'Jesús dio su vida por ti porque te ama muchísimo. Dale gracias en silencio.',
    text: 'Jesús murió en la cruz por amor a nosotros. Es un día de silencio y oración: rezamos el Vía Crucis y, en la celebración de la tarde, adoramos la cruz.',
  },
  'sabado-santo': {
    title: 'Sábado Santo',
    emoji: '🕯️',
    kidLine: 'Hoy esperamos en silencio, con María. ¡Esta noche se enciende la luz!',
    text: 'Jesús descansa en el sepulcro y la Iglesia espera en silencio, junto a María. En la noche, en la Vigilia Pascual, se enciende el cirio y estalla la alegría: ¡Jesús resucitó!',
  },

  // ── Pascua ──
  pascua: {
    title: 'Domingo de Pascua',
    emoji: '🌅',
    kidLine: '¡Aleluya! ¡Jesús está vivo! ¡Es el día más feliz del año!',
    text: '¡Jesús resucitó! Venció a la muerte y está vivo para siempre: es la fiesta más grande de todo el año.',
    feast: 'pascua-de-resurreccion',
  },
  ascension: {
    title: 'Ascensión del Señor',
    emoji: '☁️',
    kidLine: 'Jesús subió al cielo, ¡pero nunca nos deja solos!',
    text: 'Cuarenta días después de resucitar, Jesús subió al cielo ante sus amigos. Antes les prometió: «Yo estaré con ustedes todos los días».',
  },
  pentecostes: {
    title: 'Pentecostés',
    emoji: '🔥',
    kidLine: '¡Ven, Espíritu Santo! Llena de tu fuego y de tu amor a toda la Iglesia.',
    text: 'El Espíritu Santo bajó sobre María y los apóstoles como lenguas de fuego, y ellos salieron con valentía a anunciar que Jesús vive. Con esta fiesta termina el tiempo de Pascua.',
  },

  // ── Tiempo ordinario ──
  trinidad: {
    title: 'Santísima Trinidad',
    emoji: '✨',
    kidLine: 'En el nombre del Padre, y del Hijo, y del Espíritu Santo. ¡Amén!',
    text: 'Celebramos que hay un solo Dios en tres Personas: el Padre, el Hijo y el Espíritu Santo. Cada vez que hacemos la señal de la cruz, lo recordamos.',
  },
  'cristo-rey': {
    title: 'Jesucristo, Rey del Universo',
    emoji: '👑',
    kidLine: '¡Viva Cristo Rey! Él es el Rey más bueno: reina con amor.',
    text: 'Es el último domingo del año de la Iglesia. Jesús es nuestro Rey, un Rey que reina con amor, sirviendo a todos y dando la vida por nosotros.',
  },
};

export const FEASTS = [
  {
    id: 'santa-maria-madre-de-dios',
    title: 'Santa María, Madre de Dios',
    emoji: '💙',
    rule: { month: 1, day: 1 },
    color: 'blanco',
    bg: 'cielo',
    emojis: ['⭐', '👶', '💙'],
    paragraphs: [
      'El primer día del año lo empezamos de la mano de María. Celebramos que ella es la Madre de Jesús, y como Jesús es Dios, la llamamos Madre de Dios.',
      'María cuidó a Jesús con mucho amor y guardaba en su corazón todo lo que pasaba. Desde la cruz, Jesús nos la regaló también como Madre nuestra.',
      'Este día la Iglesia reza por la paz en todo el mundo. Pídele a María que te ayude a sembrar paz en tu casa y en tu colegio.',
    ],
    prayer: 'Santa María, Madre de Dios y Madre nuestra, te entrego este año nuevo. Cuida a mi familia y enséñame a amar a Jesús como tú.',
    peru: false,
    local: false,
  },
  {
    id: 'bajada-de-reyes',
    title: 'Epifanía: la Bajada de Reyes',
    emoji: '👑',
    rule: { month: 1, day: 6 },
    color: 'blanco',
    bg: 'desierto',
    emojis: ['⭐', '👑', '🐪', '🎁'],
    paragraphs: [
      'Unos sabios de Oriente, los Reyes Magos, vieron una estrella nueva y la siguieron hasta Belén. Allí encontraron al Niño con María, su madre, se arrodillaron ante Él y le regalaron oro, incienso y mirra.',
      '«Epifanía» quiere decir «manifestación»: Jesús se da a conocer a todos los pueblos de la tierra, también a nosotros, en el Perú.',
      'En el Perú es la Bajada de Reyes: las familias se juntan a rezar y a cantarle al Niño, y guardan con cariño el nacimiento hasta la próxima Navidad. En el valle del Mantaro, la fiesta del Niño sigue durante enero, con música y danzas como la huaylijía.',
    ],
    prayer: 'Niño Jesús, como los Reyes Magos, yo también quiero adorarte. Te regalo lo mejor que tengo: mi corazón.',
    peru: true,
    local: false,
  },
  {
    id: 'candelaria',
    title: 'La Presentación del Señor: la Candelaria',
    emoji: '🕯️',
    rule: { month: 2, day: 2 },
    color: 'blanco',
    bg: 'templo',
    emojis: ['🕯️', '👶', '🕊️', '👴'],
    paragraphs: [
      'Cuarenta días después de la Navidad, María y José llevaron al Niño Jesús al Templo de Jerusalén para presentarlo a Dios. Como eran pobres, ofrecieron dos palomitas.',
      'En el Templo, el anciano Simeón tomó al Niño en sus brazos y dijo que Jesús es la luz que alumbra a todos los pueblos. Por eso en esta fiesta se bendicen las velas: ¡Jesús es nuestra luz!',
      'Las velas le dan su nombre de Candelaria. En Puno se celebra a la Virgen de la Candelaria con una de las fiestas más grandes del Perú, llena de música y danzas.',
    ],
    prayer: 'Jesús, luz del mundo, ilumina mi corazón y mi casa. María, enséñame a ofrecerle a Dios todo lo que soy.',
    peru: true,
    local: false,
  },
  {
    id: 'san-jose',
    title: 'San José',
    emoji: '🔨',
    rule: { month: 3, day: 19, transfer: 'antes' },
    color: 'blanco',
    bg: 'campo',
    emojis: ['🔨', '👶', '🏡', '💛'],
    paragraphs: [
      'San José era carpintero en Nazaret y fue el esposo de la Virgen María. Dios le confió una misión muy grande: cuidar al Niño Jesús y a su Madre.',
      'José era un hombre justo y silencioso. Cuando Dios le hablaba en sueños, obedecía enseguida, como cuando llevó a su familia a Egipto para salvar al Niño.',
      'Le enseñó a Jesús su oficio y lo vio crecer en su taller. Es el patrono de toda la Iglesia, de las familias y de los trabajadores.',
    ],
    prayer: 'San José, tú cuidaste a Jesús y a María: cuida también a mi familia y a mi casa. Enséñame a trabajar con alegría.',
    peru: false,
    local: false,
  },
  {
    id: 'anunciacion',
    title: 'La Anunciación del Señor',
    emoji: '👼',
    rule: { month: 3, day: 25, transfer: 'despues' },
    color: 'blanco',
    bg: 'jardin',
    emojis: ['👼', '🌷', '✨'],
    paragraphs: [
      'Dios envió al ángel Gabriel a Nazaret, a la casa de una joven llamada María. El ángel la saludó: «Alégrate, llena de gracia, el Señor está contigo».',
      'Le anunció que sería la Madre de Jesús, el Hijo de Dios. María respondió: «Hágase en mí según tu palabra». ¡Por su «sí», Jesús empezó a crecer en su vientre!',
      'Nueve meses después llega la Navidad. Con las palabras del ángel empieza el Ave María, y en el Perú el 25 de marzo es también el Día del Niño por Nacer.',
    ],
    prayer: 'María, tú le dijiste «sí» a Dios con todo tu corazón: ayúdame a decirle «sí» a Jesús cada día.',
    peru: false,
    local: false,
  },
  {
    id: 'pascua-de-resurreccion',
    title: 'Pascua de Resurrección',
    emoji: '🌅',
    rule: { from: 'pascua', offset: 0 },
    color: 'blanco',
    bg: 'amanecer',
    emojis: ['🌅', '👼', '🌷', '✨'],
    paragraphs: [
      'El domingo muy temprano, unas mujeres fueron al sepulcro de Jesús y lo encontraron vacío. Un ángel les dijo: «No está aquí: ¡ha resucitado!».',
      'Jesús venció a la muerte y está vivo para siempre. Por eso la Pascua es la fiesta más grande de todo el año, y cada domingo es una pequeña Pascua.',
      'La alegría dura cincuenta días, hasta Pentecostés. En la Misa cantamos «¡Aleluya!», que quiere decir «¡Alaben a Dios!».',
    ],
    prayer: 'Jesús resucitado, gracias porque estás vivo y caminas conmigo. ¡Aleluya!',
    peru: false,
    local: false,
  },
  {
    id: 'cruz-de-mayo',
    title: 'La Cruz de Mayo',
    emoji: '✝️',
    rule: { month: 5, day: 3 },
    color: 'rojo',
    bg: 'monte',
    emojis: ['✝️', '🌸', '⛰️', '🎶'],
    paragraphs: [
      'La cruz nos recuerda el amor más grande: Jesús dio su vida en ella para salvarnos. Una antigua tradición cuenta que santa Elena, la mamá del emperador Constantino, encontró en Jerusalén la cruz de Jesús.',
      'En el Perú, mayo es el mes de la Fiesta de las Cruces. En el valle del Mantaro es una fiesta muy grande: las cruces bajan de los cerros, las acompañan a Misa y en procesión, y hay música y danzas.',
      'La Iglesia celebra también la Exaltación de la Santa Cruz el 14 de septiembre. Cada vez que te persignas, llevas contigo la señal de los cristianos.',
    ],
    prayer: 'Te adoramos, oh Cristo, y te bendecimos, porque por tu santa cruz redimiste al mundo.',
    peru: true,
    local: true,
  },
  {
    id: 'corpus-christi',
    title: 'Corpus Christi',
    emoji: '🍞',
    // En el Perú, el domingo después de la Santísima Trinidad. En el calendario general es el jueves (offset: 60).
    rule: { from: 'pascua', offset: 63 },
    color: 'blanco',
    bg: 'iglesia',
    emojis: ['🍞', '🍷', '🌼', '✨'],
    paragraphs: [
      '«Corpus Christi» quiere decir «Cuerpo de Cristo». Celebramos que Jesús se quedó con nosotros en la Eucaristía: en la Hostia consagrada está Él mismo, vivo y real.',
      'En esta fiesta, el sacerdote lleva a Jesús Sacramentado en procesión por las calles, dentro de la custodia, que brilla como un sol. La gente lo acompaña con cantos y flores, y en el Cusco es una de las fiestas más grandes del año.',
      'Cuando vayas a la iglesia, salúdalo en el sagrario, donde siempre te espera, y dile cuánto lo quieres.',
    ],
    prayer: 'Jesús, que estás en la Eucaristía, te adoro y te quiero. Prepara mi corazón para recibirte.',
    peru: false,
    local: false,
  },
  {
    id: 'sagrado-corazon',
    title: 'Sagrado Corazón de Jesús',
    emoji: '❤️',
    rule: { from: 'pascua', offset: 68 },
    color: 'blanco',
    bg: 'dorado',
    emojis: ['❤️', '🔥', '✨'],
    paragraphs: [
      'El corazón de Jesús está lleno de amor por cada uno de nosotros. Jesús nos ama sin cansarse nunca, aunque a veces nos portemos mal.',
      'Jesús dijo: «Vengan a mí todos los que están cansados y agobiados, y yo los aliviaré». Su corazón siempre tiene un lugar para ti.',
      'Muchas familias tienen en casa una imagen del Sagrado Corazón y se consagran a Él. Es una manera de decirle: «Jesús, esta casa es tuya».',
    ],
    prayer: 'Sagrado Corazón de Jesús, en ti confío. Haz mi corazón parecido al tuyo.',
    peru: false,
    local: false,
  },
  {
    id: 'san-pedro-y-san-pablo',
    title: 'San Pedro y San Pablo',
    emoji: '🔑',
    rule: { month: 6, day: 29 },
    color: 'rojo',
    bg: 'mar',
    emojis: ['🔑', '⛵', '🐟', '📜'],
    paragraphs: [
      'Pedro era pescador en el lago de Galilea. Jesús lo llamó para ser «pescador de hombres», le dio las llaves del Reino y lo puso como cabeza de su Iglesia.',
      'Pablo al principio perseguía a los cristianos, pero Jesús le salió al encuentro en el camino a Damasco y cambió su vida. Después recorrió el mundo anunciando el Evangelio y escribió cartas que leemos en la Misa.',
      'Los dos dieron su vida por Jesús en Roma. En su fiesta rezamos por el Papa, el sucesor de Pedro. En el Perú es feriado y también el Día del Pescador: en muchas caletas sacan a san Pedro en procesión por el mar.',
    ],
    prayer: 'San Pedro y San Pablo, rueguen por el Papa y por toda la Iglesia. Ayúdenme a ser un amigo valiente de Jesús.',
    peru: false,
    local: false,
  },
  {
    id: 'cura-de-ars',
    title: 'Santo Cura de Ars',
    emoji: '⛪',
    // Patrono (titular) de nuestra parroquia: en su iglesia, este día es solemnidad.
    rule: { month: 8, day: 4 },
    color: 'blanco',
    bg: 'iglesia',
    emojis: ['⛪', '📖', '🙏', '💛'],
    paragraphs: [
      'San Juan María Vianney nació en Francia hace más de doscientos años. Le costaba mucho estudiar, pero nunca se rindió, rezó mucho y llegó a ser sacerdote.',
      'Lo enviaron a Ars, un pueblito donde casi nadie iba a Misa. Rezaba muchísimo, enseñaba el catecismo a los niños y pasaba horas y horas perdonando en la Confesión. ¡Llegaba gente de todas partes para verlo!',
      'Es el patrono de los párrocos y de nuestra parroquia, en Pío Pata. Por eso su fiesta es un día de alegría para toda nuestra comunidad.',
    ],
    prayer: 'Santo Cura de Ars, ruega por nuestra parroquia y por nuestros sacerdotes. Enséñame a decirle a Jesús, como tú: «Te amo, Dios mío».',
    peru: false,
    local: true,
  },
  {
    id: 'asuncion',
    title: 'La Asunción de la Virgen María',
    emoji: '☁️',
    rule: { month: 8, day: 15 },
    color: 'blanco',
    bg: 'cielo',
    emojis: ['☁️', '👑', '⭐', '💙'],
    paragraphs: [
      'Al terminar su vida en la tierra, la Virgen María fue llevada al cielo en cuerpo y alma. Allí está junto a Jesús, como Reina del cielo.',
      'María es nuestra Madre y nos espera en el cielo. Lo que Dios hizo con ella nos lo promete también a nosotros: estar un día con Él para siempre.',
    ],
    prayer: 'Virgen María, Madre del cielo, llévame de tu mano para que un día esté contigo y con Jesús para siempre.',
    peru: false,
    local: false,
  },
  {
    id: 'santa-rosa-de-lima',
    title: 'Santa Rosa de Lima',
    emoji: '🌹',
    // En el Perú es solemnidad el 30 de agosto; en el calendario general es memoria el 23 de agosto.
    rule: { month: 8, day: 30 },
    color: 'blanco',
    bg: 'jardin',
    emojis: ['🌹', '🌸', '🙏', '🏡'],
    paragraphs: [
      'Nació en Lima en 1586. La bautizaron como Isabel, pero la llamaron Rosa porque, de bebé, su carita parecía una rosa.',
      'Rosa rezaba muchísimo y amaba a Jesús con todo su corazón. En su casa cuidaba a enfermos y a pobres, y ayudaba a su familia con su trabajo. Fue la primera santa de América.',
      'Es la patrona del Perú y de América, y en el Perú su fiesta es feriado. En Lima, mucha gente visita su santuario y echa cartitas con sus pedidos en su pozo.',
    ],
    prayer: 'Santa Rosa de Lima, patrona del Perú, ruega por nuestra patria y por mi familia. Enséñame a amar a Jesús y a servir a los que sufren.',
    peru: true,
    local: false,
  },
  {
    id: 'virgen-de-cocharcas',
    title: 'Virgen de Cocharcas',
    emoji: '🌼',
    // Natividad de la Virgen María. Gran fiesta patronal en Sapallanga (Huancayo), con celebraciones en los días cercanos.
    rule: { month: 9, day: 8 },
    color: 'blanco',
    bg: 'monte',
    emojis: ['👑', '🌼', '🎺', '⛰️'],
    paragraphs: [
      'El 8 de septiembre la Iglesia celebra el nacimiento de la Virgen María: ¡es como su cumpleaños! Ese día, en muchos pueblos del Perú se honra a la Virgen de Cocharcas.',
      'Su devoción nació hace siglos en el pueblo de Cocharcas, en Apurímac. En el valle del Mantaro la llaman con cariño «Mamacha Cocharcas».',
      'En Sapallanga, muy cerca de Huancayo, su fiesta es una de las más grandes del valle: hay Misa, procesión, bandas de música y danzas. ¡Todo el pueblo celebra a la Mamacha!',
    ],
    prayer: 'Virgen de Cocharcas, Mamacha querida, cuida a las familias del valle del Mantaro. Llévanos siempre hacia tu Hijo Jesús.',
    peru: true,
    local: true,
  },
  {
    id: 'senor-de-los-milagros',
    title: 'Señor de los Milagros',
    emoji: '💜',
    // Fiesta popular de todo octubre. En Lima sale en procesión varias veces; las salidas más tradicionales son las del
    // 18, el 19 y el 28 de octubre (las fechas y rutas de cada año las publica la Hermandad de las Nazarenas).
    rule: { month: 10, day: 18 },
    color: 'morado',
    bg: 'ciudad',
    emojis: ['✝️', '💜', '🕯️', '🎶'],
    paragraphs: [
      'Hace más de trescientos años, en Lima, un hombre humilde llegado de Angola, en África, pintó en una pared la imagen de Jesús en la cruz. Vinieron terremotos muy fuertes y muchas casas se cayeron, ¡pero la pared con la imagen quedó en pie!',
      'Por eso lo llaman el Señor de los Milagros. En octubre, el mes morado, sus devotos se visten de morado y lo acompañan con cantos, rezos y sahumerios. En Lima sale varias veces en procesión, y las más tradicionales son las del 18, el 19 y el 28 de octubre.',
      'Muchas ciudades del Perú, y peruanos que viven en otros países, también lo sacan en procesión. ¡Y no falta el turrón de Doña Pepa!',
    ],
    prayer: 'Señor de los Milagros, cuida al Perú y a mi familia. Gracias por tu amor, que es el milagro más grande.',
    peru: true,
    local: false,
  },
  {
    id: 'todos-los-santos',
    title: 'Todos los Santos',
    emoji: '😇',
    rule: { month: 11, day: 1 },
    color: 'blanco',
    bg: 'cielo',
    emojis: ['😇', '✨', '⭐', '🙌'],
    paragraphs: [
      'Celebramos a todos los que ya están en el cielo con Dios: los santos que conocemos, como santa Rosa o san Martín, y muchísimos más que nadie conoce, quizás hasta alguien de tu familia.',
      'Los santos no nacieron santos: se dejaron llenar del amor de Dios poco a poco. ¡Tú también estás llamado a ser santo!',
      'En el Perú es feriado. Es un buen día para ir a Misa en familia y pedirles a los santos que nos ayuden.',
    ],
    prayer: 'Santos y santas de Dios, rueguen por nosotros. Ayúdenme a ser amigo de Jesús como ustedes.',
    peru: false,
    local: false,
  },
  {
    id: 'fieles-difuntos',
    title: 'Día de los Fieles Difuntos',
    emoji: '💐',
    rule: { month: 11, day: 2 },
    color: 'morado',
    bg: 'jardin',
    emojis: ['💐', '🕯️', '🙏', '✨'],
    paragraphs: [
      'Este día rezamos por todas las personas que ya murieron, sobre todo por nuestros familiares y amigos. Le pedimos a Dios que los tenga con Él en el cielo.',
      'En el Perú, muchas familias visitan el cementerio: llevan flores, limpian las tumbas y rezan juntas. Es una manera de decirles que los seguimos queriendo.',
      'Jesús nos prometió que la muerte no es el final. Por eso, aunque los extrañemos, tenemos esperanza: un día nos volveremos a encontrar en el cielo.',
    ],
    prayer: 'Dales, Señor, el descanso eterno, y brille para ellos la luz que no se acaba. Que descansen en paz.',
    peru: false,
    local: false,
  },
  {
    id: 'san-martin-de-porres',
    title: 'San Martín de Porres',
    emoji: '🧹',
    rule: { month: 11, day: 3 },
    color: 'blanco',
    bg: 'ciudad',
    emojis: ['🧹', '🐕', '🐈', '🐁'],
    paragraphs: [
      'Nació en Lima en 1579, hijo de un español y de una mujer afrodescendiente. Fue hermano dominico y cuidaba a los enfermos y a los pobres, sin importar quiénes fueran.',
      'Lo llaman «fray Escoba» porque barría el convento con alegría y humildad. Se cuenta que hasta un perro, un gato y un ratón comían juntos del mismo plato, ¡porque Martín los ponía en paz!',
      'Es uno de los santos más queridos del Perú. Nos enseña que ningún trabajo es pequeño cuando se hace por amor.',
    ],
    prayer: 'San Martín de Porres, enséñame a servir con alegría y a tratar a todos como hermanos. Ruega por los enfermos y por los pobres del Perú.',
    peru: true,
    local: false,
  },
  {
    id: 'inmaculada-concepcion',
    title: 'La Inmaculada Concepción',
    emoji: '🤍',
    rule: { month: 12, day: 8 },
    color: 'blanco',
    bg: 'cielo',
    emojis: ['🤍', '⭐', '🌙', '🌹'],
    paragraphs: [
      'Dios eligió a María para ser la Madre de Jesús. Por eso la preparó de una manera única: desde el primer momento de su vida, en el vientre de su mamá, santa Ana, la libró de toda mancha de pecado.',
      '«Inmaculada» quiere decir «sin mancha». No es la fiesta del nacimiento de Jesús: celebramos que María fue siempre toda de Dios, llena de gracia.',
      'La celebramos en pleno Adviento, porque nadie esperó a Jesús con tanto amor como ella. En el Perú es feriado.',
    ],
    prayer: 'María Inmaculada, tú eres toda limpia y llena de gracia. Ayúdame a tener un corazón limpio para recibir a Jesús.',
    peru: false,
    local: false,
  },
  {
    id: 'navidad',
    title: 'Navidad',
    emoji: '🌟',
    rule: { month: 12, day: 25 },
    color: 'blanco',
    bg: 'noche',
    emojis: ['⭐', '👶', '🐑', '🐂'],
    paragraphs: [
      'En Belén, en un establo muy sencillo, nació Jesús. María lo envolvió en pañales y lo acostó en un pesebre, porque no había lugar para ellos en la posada.',
      'Unos ángeles anunciaron la buena noticia a los pastores, que fueron corriendo a adorar al Niño. ¡Dios se hizo pequeñito para estar con nosotros!',
      'En el Perú, muchas familias van a la Misa de Gallo y comparten chocolate caliente con panetón. En el valle del Mantaro, en estas fiestas, pastoras y pastores bailan la huaylijía para adorar al Niño, como los pastores de Belén.',
    ],
    prayer: 'Niño Jesús, bienvenido a mi casa y a mi corazón. Gracias por venir a quedarte con nosotros.',
    peru: false,
    local: false,
  },
];

// La vela de cada semana se enciende el domingo y sigue encendida toda la semana (junto con las anteriores).
export const ADVENT_WEEKS = [
  {
    week: 1,
    candle: 'morado',
    title: 'Vela de la esperanza',
    text: 'Encendemos la primera vela: Jesús viene y queremos esperarlo despiertos y con ilusión, como quien espera a su mejor amigo.',
    kidLine: '¡Primera velita encendida! Jesús viene: ¡a esperarlo con alegría!',
  },
  {
    week: 2,
    candle: 'morado',
    title: 'Vela de la paz',
    text: 'Juan el Bautista nos dice: «Preparen el camino del Señor». Le preparamos el camino haciendo las paces y perdonando de corazón.',
    kidLine: '¡Dos velitas! Prepara el camino a Jesús: haz las paces con alguien.',
  },
  {
    week: 3,
    candle: 'rosado',
    title: 'Vela de la alegría',
    text: 'Es el domingo «Gaudete»: ¡alégrense, que Jesús está cerca! Por eso esta vela es rosada.',
    kidLine: '¡Ya brilla la vela rosada! Falta poquito para Navidad. ¡Qué alegría!',
  },
  {
    week: 4,
    candle: 'morado',
    title: 'Vela del amor',
    text: 'María esperó a Jesús con todo su amor. Le pedimos que nos ayude a preparar un lugarcito en el corazón para su Hijo.',
    kidLine: '¡Las cuatro velas brillan! Con María, preparamos el corazón para Jesús.',
  },
];

// Del 16 al 24 de diciembre se arma el nacimiento poco a poco: una figura cada día, y el Niño Jesús en Nochebuena.
export const NOVENA = [
  { day: 1, figure: 'El establo', emoji: '🌾', text: 'Hoy armamos el establo con su pesebre y su pajita. Jesús no buscó un palacio: le basta un corazón sencillo que lo reciba.' },
  { day: 2, figure: 'El burrito y el buey', emoji: '🐂', text: 'Llegan el burrito y el buey, que le darán calorcito al Niño. Tú también puedes dar calor a tu familia con tu cariño.' },
  { day: 3, figure: 'Las ovejitas', emoji: '🐑', text: 'Ponemos las ovejitas. Jesús es el Buen Pastor que cuida a cada una de sus ovejas, ¡y tú eres una de ellas!' },
  { day: 4, figure: 'Los pastores', emoji: '🧑‍🌾', text: 'Llegan los pastores, gente sencilla y trabajadora. Ellos fueron los primeros en visitar al Niño Jesús.' },
  { day: 5, figure: 'La estrella', emoji: '⭐', text: 'Colocamos la estrella sobre el establo. Ella guio a los Reyes Magos: pídele a Jesús que también guíe tu camino.' },
  { day: 6, figure: 'El ángel', emoji: '👼', text: 'Llega el ángel que anunció la buena noticia: «Les ha nacido un Salvador». ¡Tú también puedes ser un mensajero de alegría!' },
  { day: 7, figure: 'San José', emoji: '🧔', text: 'Ponemos a san José, que cuidó a María y al Niño con mucho amor. Pídele que cuide también a tu familia.' },
  { day: 8, figure: 'La Virgen María', emoji: '💙', text: 'Llega María, que espera a Jesús con todo su amor. Pídele que te ayude a preparar tu corazón para la Navidad.' },
  { day: 9, figure: 'El Niño Jesús', emoji: '👶', text: 'Esta noche es Nochebuena: a la medianoche ponemos al Niño Jesús en el pesebre. ¡Bienvenido, Jesús!' },
];

export const LENT_TIPS = [
  'Come lo que te sirvan sin quejarte, aunque no sea tu comida favorita.',
  'Guarda en tu alcancía lo de una golosina para ayudar a alguien que lo necesita.',
  'Apaga la tele o el celular un rato para rezar o jugar con tu familia.',
  'Ayuda en casa sin que te lo pidan: tiende tu cama o pon la mesa.',
  'Haz las paces con alguien con quien te peleaste.',
  'Reza un Padrenuestro por una persona enferma o que esté triste.',
  'Presta tus cosas con alegría a tus hermanos o a tus amigos.',
  'Busca a alguien que esté solo en el recreo y acompáñalo con cariño.',
];
