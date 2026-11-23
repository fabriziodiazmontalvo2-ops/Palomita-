// «Mi camino a la Primera Comunión»: catequesis de Palomita para niños de 7 a 10 años.
// Módulo de datos puro: sin imports, sin lógica y sin HTML en los textos.
// Las frases bíblicas entre comillas son formulaciones propias, sencillas y fieles al sentido
// del pasaje citado (citas en formato católico: «Libro capítulo, versículos»).
// Cada tema: { id, title, emoji, intro, items: [{ title, text, emoji }], closing, quiz: [3 preguntas] }.

export const CATECHISM = [
  // 1 ─────────────────────────────────────────────
  {
    id: 'dios',
    title: '¿Quién es Dios?',
    emoji: '☀️',
    intro: 'Mira el cielo, el mar, las estrellas… ¿Quién hizo todo eso? ¡Dios! Y también te hizo a ti. A Él nadie lo hizo: existe desde siempre y para siempre. Pero lo más hermoso que puedes saber es esto: «Dios es amor» (1 Juan 4, 8). Te conoce por tu nombre y te quiere muchísimo, tal como eres.',
    items: [
      {
        title: 'Un solo Dios, tres Personas',
        emoji: '✨',
        text: 'Hay un solo Dios, y en Él hay tres Personas: el Padre, el Hijo y el Espíritu Santo. A este misterio de amor lo llamamos la Santísima Trinidad. No es fácil de entender, ¡ni siquiera para los mayores!, pero lo creemos porque Jesús mismo nos lo enseñó.',
      },
      {
        title: 'Dios Padre, nuestro Creador',
        emoji: '🌍',
        text: 'El Padre creó todo lo que existe, lo que vemos y lo que no vemos: las montañas, los ríos, los animales, los ángeles… Y a ti te hizo a su imagen. Te cuida cada día y jamás se olvida de ti. Jesús nos enseñó a llamarlo con toda confianza: «Padre nuestro».',
      },
      {
        title: 'Dios Hijo, Jesús, nuestro Salvador',
        emoji: '✝️',
        text: 'El Hijo de Dios se hizo hombre y nació de la Virgen María: es Jesús. Vino a mostrarnos cuánto nos ama el Padre. Dio su vida por nosotros en la cruz y al tercer día resucitó. ¡Está vivo! Es nuestro Salvador y nuestro mejor amigo.',
      },
      {
        title: 'Dios Espíritu Santo, que nos da vida',
        emoji: '🔥',
        text: 'El Espíritu Santo es Dios que vive en tu corazón desde el Bautismo. Él te da fuerza para hacer el bien, luz para conocer a Jesús y ganas de rezar. No lo vemos, como tampoco vemos el viento, pero se nota todo lo bueno que hace en nosotros.',
      },
      {
        title: 'La Señal de la Cruz',
        emoji: '🙏',
        text: 'Cada vez que te santiguas diciendo «En el nombre del Padre, y del Hijo, y del Espíritu Santo», nombras a la Santísima Trinidad. Es como decirle: «Dios mío, soy tuyo; quédate conmigo». Hazla despacio y con cariño.',
      },
    ],
    closing: 'Fuiste bautizado en el nombre del Padre, y del Hijo, y del Espíritu Santo. Por eso nunca estás solo: ¡el Dios del amor vive en ti!',
    quiz: [
      {
        q: '¿Cuántos dioses hay?',
        options: ['Tres dioses distintos', 'Un solo Dios en tres Personas', 'Muchos dioses'],
        answer: 1,
        explain: 'Hay un solo Dios, y en Él hay tres Personas: el Padre, el Hijo y el Espíritu Santo. Es la Santísima Trinidad, un gran misterio de amor.',
      },
      {
        q: '¿Cómo nos enseñó Jesús a llamar a Dios?',
        options: ['Padre', 'Rey lejano', 'Señor desconocido'],
        answer: 0,
        explain: 'Jesús nos enseñó a decir «Padre nuestro». Dios es un Padre bueno que te conoce por tu nombre, te cuida y te quiere muchísimo.',
      },
      {
        q: '¿A quién nombras cuando haces la Señal de la Cruz?',
        options: ['A los doce apóstoles', 'A los ángeles del cielo', 'Al Padre, al Hijo y al Espíritu Santo'],
        answer: 2,
        explain: 'Al santiguarte nombras a la Santísima Trinidad. Es una oración cortita y muy grande: con ella le dices a Dios que eres suyo.',
      },
    ],
  },

  // 2 ─────────────────────────────────────────────
  {
    id: 'jesus',
    title: 'Jesús, mi mejor amigo',
    emoji: '💛',
    intro: '¿Tienes un amigo que te escucha, te entiende y nunca te deja solo? Jesús es ese amigo, ¡y muchísimo más! Es el Hijo de Dios, que se hizo hombre para estar cerca de nosotros y salvarnos. Él mismo se lo dijo a sus discípulos: «A ustedes los llamo amigos» (Juan 15, 15). Y hoy te lo dice a ti.',
    items: [
      {
        title: 'Nació en Belén',
        emoji: '🌟',
        text: 'Jesús nació de la Virgen María en Belén, y ella lo acostó en un pesebre. ¡El Hijo de Dios quiso ser un bebé pequeñito, como lo fuiste tú! Después creció en Nazaret, con María y José: se hacía grande y sabio, y los obedecía.',
      },
      {
        title: 'Pasó haciendo el bien',
        emoji: '👣',
        text: 'Ya de grande, Jesús recorrió pueblos y caminos anunciando que Dios nos ama. Sanaba a los enfermos, perdonaba los pecados, bendecía a los niños y contaba parábolas: historias sencillas con un mensaje enorme. Nadie quedaba fuera de su cariño.',
      },
      {
        title: 'Dio su vida por amor',
        emoji: '✝️',
        text: 'Jesús nos amó hasta el final: dio su vida en la cruz para salvarnos y abrirnos las puertas del cielo. Él había dicho: «Nadie tiene amor más grande que el que da la vida por sus amigos» (Juan 15, 13). Cada cruz que veas te recuerda cuánto te quiere.',
      },
      {
        title: '¡Resucitó y está vivo!',
        emoji: '🌅',
        text: 'Al tercer día, Jesús resucitó. ¡La muerte no pudo con Él! Se apareció a sus amigos y les prometió: «Yo estoy con ustedes todos los días, hasta el fin del mundo» (Mateo 28, 20). Por eso los cristianos vivimos con alegría y con esperanza.',
      },
      {
        title: '¿Dónde lo encuentro hoy?',
        emoji: '🔎',
        text: 'Jesús te espera en la oración, en su Palabra, en las personas que necesitan ayuda y, de la manera más grande, en la Eucaristía: allí está realmente presente. ¡Y pronto vas a recibirlo en tu Primera Comunión!',
      },
    ],
    closing: 'A un amigo se lo conoce pasando tiempo con él. Cuéntale a Jesús tu día, escucha su Palabra y visítalo en la iglesia. Él nunca se cansa de ti.',
    quiz: [
      {
        q: '¿Dónde nació Jesús?',
        options: ['En Jerusalén', 'En Nazaret', 'En Belén'],
        answer: 2,
        explain: 'Jesús nació en Belén y María lo acostó en un pesebre. Después creció en Nazaret, junto a María y José.',
      },
      {
        q: '¿Qué pasó al tercer día después de que Jesús murió en la cruz?',
        options: ['Resucitó: ¡está vivo!', 'Sus amigos se olvidaron de Él', 'Se terminó su historia'],
        answer: 0,
        explain: 'Jesús resucitó y vive para siempre. Por eso el domingo, día de la Resurrección, es el día más alegre de la semana.',
      },
      {
        q: '¿Qué les prometió Jesús resucitado a sus amigos?',
        options: ['Que ya no volvería a acompañarlos', 'Que estaría con ellos todos los días', 'Que les daría muchas riquezas'],
        answer: 1,
        explain: '«Yo estoy con ustedes todos los días», dijo Jesús. Y lo cumple: está contigo siempre, y de un modo especial en la Eucaristía.',
      },
    ],
  },

  // 3 ─────────────────────────────────────────────
  {
    id: 'iglesia',
    title: 'La Iglesia, familia de Dios',
    emoji: '⛪',
    intro: 'Cuando oyes la palabra «iglesia», quizás piensas en el templo con su campanario. Pero la Iglesia es, sobre todo, una gran familia: la de todos los bautizados que creemos en Jesús y lo seguimos. Está en todos los países del mundo, habla todos los idiomas… ¡y tú formas parte de ella!',
    items: [
      {
        title: 'Jesús la fundó',
        emoji: '🪨',
        text: 'Jesús eligió a doce apóstoles para que estuvieran con Él y anunciaran su Buena Noticia. Y a uno de ellos, Simón Pedro, le dijo: «Tú eres Pedro, y sobre esta piedra edificaré mi Iglesia» (Mateo 16, 18).',
      },
      {
        title: 'Pentecostés: el gran comienzo',
        emoji: '🔥',
        text: 'Después de la Ascensión de Jesús, los apóstoles rezaban unidos, junto con María (Hechos 1, 14). El día de Pentecostés, el Espíritu Santo bajó sobre ellos y los llenó de valentía. ¡Ese mismo día salieron a anunciar a Jesús por todas partes!',
      },
      {
        title: 'El Papa, los obispos y los sacerdotes',
        emoji: '🧑‍🌾',
        text: 'El Papa es el sucesor de san Pedro y cuida a toda la Iglesia. Los obispos son los sucesores de los apóstoles. Los sacerdotes los ayudan en las parroquias: celebran la Misa, perdonan los pecados en nombre de Jesús y nos acompañan como buenos pastores.',
      },
      {
        title: 'Tu parroquia, tu casa',
        emoji: '🏡',
        text: 'La parroquia es tu familia de fe más cercana. Allí vas a Misa y a la catequesis, allí celebras las fiestas de Jesús y allí harás tu Primera Comunión. Cada domingo, la familia de Dios se reúne alrededor del altar.',
      },
      {
        title: 'Todos tenemos una misión',
        emoji: '🤝',
        text: 'En la Iglesia nadie sobra y todos hacen falta: los niños, los papás, los abuelos, los catequistas, las religiosas… Tu misión es querer mucho a Jesús y contagiar su alegría con tu manera de vivir.',
      },
      {
        title: 'La familia del cielo',
        emoji: '🌤️',
        text: 'A la Iglesia también pertenecen la Virgen María y los santos, que ya están con Dios en el cielo. Son como hermanos mayores: nos dan ejemplo y rezan por nosotros.',
      },
    ],
    closing: 'Nadie sigue a Jesús solo. En la Iglesia caminamos juntos, nos ayudamos y nos alimentamos del mismo Pan. ¡Qué alegría tener una familia tan grande!',
    quiz: [
      {
        q: '¿Qué es, sobre todo, la Iglesia?',
        options: ['Solo un edificio con campanas', 'La gran familia de los bautizados que siguen a Jesús', 'Un grupo solo para personas mayores'],
        answer: 1,
        explain: 'El templo es la casa donde nos reunimos, pero la Iglesia somos todos los bautizados: la gran familia de Dios. ¡Y tú eres parte de ella!',
      },
      {
        q: '¿Quién es el Papa?',
        options: ['El sacerdote de mi parroquia', 'Uno de los doce apóstoles', 'El sucesor de san Pedro, que cuida a toda la Iglesia'],
        answer: 2,
        explain: 'Jesús le confió su Iglesia a Pedro. El Papa es su sucesor: un padre y pastor para los católicos del mundo entero.',
      },
      {
        q: '¿Qué día bajó el Espíritu Santo sobre los apóstoles?',
        options: ['El día de Navidad', 'El Domingo de Ramos', 'El día de Pentecostés'],
        answer: 2,
        explain: 'En Pentecostés el Espíritu Santo llenó de valentía a los apóstoles, y salieron a anunciar a Jesús. Así empezó la misión de la Iglesia.',
      },
    ],
  },

  // 4 ─────────────────────────────────────────────
  {
    id: 'sacramentos',
    title: 'Los siete sacramentos',
    emoji: '🎁',
    intro: 'Jesús quiso quedarse cerca de nosotros y darnos su fuerza. Por eso nos regaló los sacramentos: siete signos que podemos ver, oír y tocar —agua, aceite, pan, vino, palabras y gestos— por los que Él mismo nos da su gracia, es decir, su vida y su amistad. ¡Son siete encuentros con Jesús!',
    items: [
      {
        title: 'Bautismo',
        emoji: '💧',
        text: 'Con el agua del Bautismo nacemos a la vida de Dios: nos hace hijos suyos, nos limpia del pecado y nos abre la puerta de la Iglesia. Es el primero de todos los sacramentos.',
      },
      {
        title: 'Confirmación',
        emoji: '🔥',
        text: 'El Espíritu Santo nos llena de su fuerza y de sus dones para que seamos amigos valientes de Jesús. El obispo unge nuestra frente con un aceite perfumado que se llama santo crisma.',
      },
      {
        title: 'Eucaristía',
        emoji: '🍞',
        text: 'El pan y el vino se convierten en el Cuerpo y la Sangre de Jesús. Él mismo se hace nuestro alimento para vivir en nosotros. ¡Es el sacramento más grande, el corazón de la vida cristiana!',
      },
      {
        title: 'Reconciliación',
        emoji: '🤗',
        text: 'También se llama Penitencia o Confesión. Cuando nos alejamos del amor de Dios, Jesús nos perdona por medio del sacerdote y nos devuelve la paz. Es como el abrazo del padre al hijo que vuelve a casa.',
      },
      {
        title: 'Unción de los Enfermos',
        emoji: '🕯️',
        text: 'Jesús da consuelo, paz y fortaleza a quienes están muy enfermos o son muy ancianos. El sacerdote unge su frente y sus manos con aceite bendito y reza por ellos.',
      },
      {
        title: 'Orden Sacerdotal',
        emoji: '📖',
        text: 'Jesús llama a algunos hombres a servir a su pueblo como diáconos, sacerdotes u obispos. Gracias a los sacerdotes tenemos la Eucaristía y el perdón de los pecados.',
      },
      {
        title: 'Matrimonio',
        emoji: '💍',
        text: 'Un hombre y una mujer se prometen amor para toda la vida delante de Dios. Él bendice su unión y los ayuda a formar una familia, que es la primera escuela del amor.',
      },
      {
        title: 'Tres grupos fáciles de recordar',
        emoji: '🧩',
        text: 'Bautismo, Confirmación y Eucaristía son los sacramentos de la iniciación cristiana: con ellos empezamos y crecemos como cristianos. Reconciliación y Unción de los Enfermos son de sanación. Orden y Matrimonio son para servir a los demás.',
      },
    ],
    closing: 'Ya recibiste el Bautismo. Ahora te preparas para dos regalos más: la Reconciliación y la Eucaristía. ¡Jesús te espera con los brazos abiertos!',
    quiz: [
      {
        q: '¿Cuántos sacramentos nos regaló Jesús?',
        options: ['Cinco', 'Siete', 'Diez'],
        answer: 1,
        explain: 'Son siete: Bautismo, Confirmación, Eucaristía, Reconciliación, Unción de los Enfermos, Orden Sacerdotal y Matrimonio.',
      },
      {
        q: '¿Cuál es el primer sacramento que recibimos?',
        options: ['La Confirmación', 'El Matrimonio', 'El Bautismo'],
        answer: 2,
        explain: 'El Bautismo es la puerta de todos los demás sacramentos: nos hace hijos de Dios y miembros de su familia, la Iglesia.',
      },
      {
        q: '¿En qué sacramento el pan y el vino se convierten en el Cuerpo y la Sangre de Jesús?',
        options: ['En la Eucaristía', 'En la Unción de los Enfermos', 'En la Confirmación'],
        answer: 0,
        explain: 'En la Eucaristía Jesús mismo se hace nuestro alimento. Por eso es el sacramento más grande, el corazón de la vida cristiana.',
      },
    ],
  },

  // 5 ─────────────────────────────────────────────
  {
    id: 'bautismo',
    title: 'El Bautismo',
    emoji: '💧',
    intro: '¿Has visto fotos del día de tu Bautismo? Ese día pasó algo maravilloso, mucho más grande de lo que cabe en una foto: Dios te hizo hijo suyo para siempre y entraste en la gran familia de la Iglesia. ¡Fue tu segundo nacimiento!',
    items: [
      {
        title: 'Jesús también fue bautizado',
        emoji: '🕊️',
        text: 'Jesús fue al río Jordán y Juan lo bautizó. Al salir del agua, el Espíritu de Dios bajó sobre Él como una paloma, y se oyó una voz del cielo: «Este es mi Hijo amado» (Mateo 3, 16-17). En tu Bautismo, Dios también te miró así: como a un hijo muy amado.',
      },
      {
        title: 'El agua',
        emoji: '💦',
        text: 'El sacerdote o el diácono derramó agua sobre tu cabeza y dijo: «Yo te bautizo en el nombre del Padre, y del Hijo, y del Espíritu Santo». El agua limpia y da vida: el Bautismo borra el pecado original y nos hace nacer a la vida de Dios.',
      },
      {
        title: 'El santo crisma',
        emoji: '✨',
        text: 'Después ungieron tu cabeza con el santo crisma, un aceite perfumado. Es la señal de que el Espíritu Santo vive en ti y de que perteneces a Cristo para siempre.',
      },
      {
        title: 'La vestidura blanca',
        emoji: '🤍',
        text: 'Te vistieron de blanco porque quedaste revestido de Cristo: limpio, nuevo y lleno de su luz. Por eso muchos niños van de blanco también a su Primera Comunión.',
      },
      {
        title: 'La vela encendida',
        emoji: '🕯️',
        text: 'Encendieron tu vela en el cirio pascual, ese cirio grande que representa a Jesús resucitado. Es la luz de la fe. Tus papás y padrinos prometieron ayudarte a cuidarla para que nunca se apague.',
      },
      {
        title: 'Un regalo para siempre',
        emoji: '🎁',
        text: 'El Bautismo se recibe una sola vez, porque deja en el alma una marca que no se borra jamás: eres hijo de Dios para siempre. Y es la puerta por la que se entra a los demás sacramentos.',
      },
    ],
    closing: 'Pregunta en casa qué día te bautizaron y quiénes son tus padrinos. ¡Ese día es tu cumpleaños como hijo de Dios y merece una fiesta!',
    quiz: [
      {
        q: '¿Con qué se bautiza?',
        options: ['Con agua', 'Con vino', 'Con incienso'],
        answer: 0,
        explain: 'Se derrama agua sobre la cabeza diciendo: «Yo te bautizo en el nombre del Padre, y del Hijo, y del Espíritu Santo».',
      },
      {
        q: '¿Qué hace en nosotros el Bautismo?',
        options: ['Nos da un nombre distinto cada año', 'Nos convierte en sacerdotes de la parroquia', 'Nos hace hijos de Dios y miembros de la Iglesia'],
        answer: 2,
        explain: 'Por el Bautismo nacemos a la vida de Dios: somos sus hijos, quedamos limpios del pecado y entramos en su familia, la Iglesia.',
      },
      {
        q: '¿Cuántas veces se recibe el Bautismo?',
        options: ['Cada año, en Pascua', 'Una sola vez en la vida', 'Cada vez que uno quiere'],
        answer: 1,
        explain: 'Una sola vez, porque deja en el alma una marca que no se borra. ¡Eres hijo de Dios para siempre!',
      },
    ],
  },

  // 6 ─────────────────────────────────────────────
  {
    id: 'mandamientos',
    title: 'Los Diez Mandamientos',
    emoji: '📜',
    intro: 'Dios liberó a su pueblo de la esclavitud de Egipto y, en el monte Sinaí, le regaló por medio de Moisés diez palabras de vida: los Diez Mandamientos (Éxodo 20, 1-17). No son una lista para asustar: son las señales del camino que pone un Padre bueno para que sus hijos lleguen felices y seguros.',
    items: [
      {
        title: '1. Amarás a Dios sobre todas las cosas',
        emoji: '💛',
        text: 'Dios es lo primero y lo más importante. Lo amas cuando rezas, cuando confías en Él y cuando no dejas que nada —ni los juegos, ni las pantallas, ni las cosas— ocupe su lugar en tu corazón.',
      },
      {
        title: '2. No tomarás el nombre de Dios en vano',
        emoji: '🗣️',
        text: 'El nombre de Dios es santo. Lo dices con respeto y con cariño, nunca en burla ni con enojo. También respetas los nombres de Jesús, de María y de los santos.',
      },
      {
        title: '3. Santificarás las fiestas',
        emoji: '⛪',
        text: 'El domingo es el día del Señor, porque Jesús resucitó un domingo. Lo celebras yendo a Misa, descansando y compartiendo en familia. También vamos a Misa en las fiestas grandes de la Iglesia.',
      },
      {
        title: '4. Honrarás a tu padre y a tu madre',
        emoji: '👨‍👩‍👧',
        text: 'Quieres, respetas y obedeces a tus papás y a quienes te cuidan. Les das las gracias, ayudas en casa y rezas por ellos. También respetas a tus abuelos y a tus maestros.',
      },
      {
        title: '5. No matarás',
        emoji: '🌱',
        text: 'La vida es un regalo de Dios. Cuidas la tuya y la de los demás: no pegas, no insultas, no te burlas de nadie ni guardas rencor. Haces las paces, defiendes al que molestan y cuidas tu salud.',
      },
      {
        title: '6. No cometerás actos impuros',
        emoji: '🤍',
        text: 'Tu cuerpo es un regalo precioso de Dios y templo del Espíritu Santo (1 Corintios 6, 19). Lo cuidas y lo respetas, y respetas el de los demás. Si algo te hace sentir incómodo, cuéntaselo enseguida a tus papás o a un adulto de confianza.',
      },
      {
        title: '7. No robarás',
        emoji: '🤲',
        text: 'No tomas lo que no es tuyo, devuelves lo que te prestan y cuidas las cosas de todos: las de tu casa, las de tu escuela y la naturaleza. Y compartes con generosidad lo que tienes.',
      },
      {
        title: '8. No dirás falso testimonio ni mentirás',
        emoji: '💬',
        text: 'Dices siempre la verdad, aunque cueste. No inventas cosas de otros, no acusas en falso ni haces trampa. Quien dice la verdad tiene el corazón en paz, y todos pueden confiar en él.',
      },
      {
        title: '9. No consentirás pensamientos ni deseos impuros',
        emoji: '🌷',
        text: 'Cuidas tu corazón como un jardín. Eliges bien lo que miras, lo que escuchas y lo que piensas, y llenas tu mente de cosas buenas y limpias. Jesús dijo: «Felices los de corazón limpio, porque verán a Dios» (Mateo 5, 8).',
      },
      {
        title: '10. No codiciarás los bienes ajenos',
        emoji: '😊',
        text: 'No sientes envidia por lo que otros tienen. Te alegras con lo bueno que les pasa y das gracias por lo tuyo. ¡Un corazón agradecido siempre está contento!',
      },
    ],
    closing: 'Los tres primeros mandamientos nos enseñan a amar a Dios; los otros siete, a amar al prójimo. ¡Los diez caben en una sola palabra: amar!',
    quiz: [
      {
        q: '¿Por medio de quién entregó Dios los Diez Mandamientos en el monte Sinaí?',
        options: ['Por medio de Noé', 'Por medio de Moisés', 'Por medio de David'],
        answer: 1,
        explain: 'En el monte Sinaí, Dios dio a su pueblo los Diez Mandamientos por medio de Moisés. Son señales para caminar felices y seguros.',
      },
      {
        q: '¿Qué nos pide el cuarto mandamiento?',
        options: ['No robar', 'Santificar las fiestas', 'Honrar a nuestro padre y a nuestra madre'],
        answer: 2,
        explain: 'El cuarto mandamiento nos pide querer, respetar y obedecer a papá, a mamá y a quienes nos cuidan con tanto amor.',
      },
      {
        q: '¿Cuál es el día del Señor, en que vamos a Misa?',
        options: ['El domingo', 'El lunes', 'El viernes'],
        answer: 0,
        explain: 'Jesús resucitó un domingo. Por eso el tercer mandamiento nos invita a celebrar ese día con la Misa, el descanso y la familia.',
      },
    ],
  },

  // 7 ─────────────────────────────────────────────
  {
    id: 'amor',
    title: 'El mandamiento del amor',
    emoji: '❤️',
    intro: 'Un día le preguntaron a Jesús cuál era el mandamiento más importante de todos. ¿Sabes qué contestó? Que lo más grande es amar: amar a Dios con todo el corazón y amar al prójimo como a uno mismo (Mateo 22, 36-40). Todo lo demás cuelga de ahí, como la ropa de una cuerda.',
    items: [
      {
        title: 'Amar a Dios con todo el corazón',
        emoji: '💛',
        text: '«Amarás al Señor, tu Dios, con todo tu corazón, con toda tu alma y con toda tu mente» (Mateo 22, 37). Amas a Dios cuando le hablas, cuando le das gracias, cuando lo escuchas en su Palabra y cuando vas a su encuentro en la Misa.',
      },
      {
        title: 'Amar al prójimo como a ti mismo',
        emoji: '🧡',
        text: '«Amarás a tu prójimo como a ti mismo» (Mateo 22, 39). Tu prójimo es toda persona que Dios pone en tu camino: tu familia, tus compañeros, y también el que te cae mal o aquel a quien nadie invita a jugar.',
      },
      {
        title: 'El mandamiento nuevo de Jesús',
        emoji: '✝️',
        text: 'En la Última Cena, Jesús fue todavía más lejos: «Ámense los unos a los otros como yo los he amado» (Juan 13, 34). ¿Y cómo nos amó Él? Sirviendo, perdonando y dando la vida.',
      },
      {
        title: 'La regla de oro',
        emoji: '⭐',
        text: 'Jesús nos dejó una regla fácil de recordar: trata a los demás como quieres que te traten a ti (Mateo 7, 12). Antes de hacer o decir algo, pregúntate: «¿Me gustaría que me lo hicieran a mí?».',
      },
      {
        title: 'El amor se nota',
        emoji: '🤝',
        text: 'Amar no es solo sentir bonito: es hacer. Se nota cuando compartes, cuando ayudas sin que te lo pidan, cuando pides perdón y perdonas, cuando consuelas al que está triste. Jesús dijo que por ese amor todos sabrán que somos sus discípulos (Juan 13, 35).',
      },
    ],
    closing: 'Cada noche puedes preguntarte: «¿A quién quise hoy un poquito mejor?». Así, día a día, tu corazón se va pareciendo al de Jesús.',
    quiz: [
      {
        q: 'Según Jesús, ¿cuál es el mandamiento más importante?',
        options: ['Amar a Dios y al prójimo', 'Ganar siempre', 'No equivocarse nunca'],
        answer: 0,
        explain: 'Amar a Dios con todo el corazón y al prójimo como a uno mismo: de ese amor dependen todos los demás mandamientos.',
      },
      {
        q: '¿Cómo nos pide Jesús que nos amemos unos a otros?',
        options: ['Solo cuando nos tratan bien', 'Como Él nos ha amado', 'Únicamente entre amigos'],
        answer: 1,
        explain: '«Ámense los unos a los otros como yo los he amado». Jesús nos amó sirviendo, perdonando y dando la vida: ¡ese es el modelo!',
      },
      {
        q: '¿Qué dice la regla de oro?',
        options: ['Haz siempre lo que tú quieras', 'Piensa primero en ti', 'Trata a los demás como quieres que te traten'],
        answer: 2,
        explain: 'Jesús enseñó a tratar a los demás como nos gustaría que nos trataran. ¡Qué distinto sería el mundo si todos la viviéramos!',
      },
    ],
  },

  // 8 ─────────────────────────────────────────────
  {
    id: 'reconciliacion',
    title: 'La Reconciliación: cómo me confieso',
    emoji: '🤗',
    intro: 'A veces elegimos mal: mentimos, peleamos, desobedecemos… Eso es el pecado: alejarnos del amor de Dios y de los demás. Pero Dios jamás deja de querernos. Como el padre de la parábola, que corrió a abrazar a su hijo cuando volvió a casa (Lucas 15, 20), nos espera siempre en el sacramento de la Reconciliación.',
    items: [
      {
        title: 'Un regalo de Jesús resucitado',
        emoji: '🎁',
        text: 'La tarde del día de Pascua, Jesús resucitado dijo a sus apóstoles: «Reciban el Espíritu Santo. A quienes les perdonen los pecados, les quedarán perdonados» (Juan 20, 22-23). Por eso el sacerdote perdona en nombre de Jesús.',
      },
      {
        title: '1. Examen de conciencia',
        emoji: '🔎',
        text: 'Busca un ratito de silencio y pídele luz al Espíritu Santo. Luego repasa con calma: ¿cómo he amado a Dios?, ¿cómo traté a mi familia y a mis compañeros?, ¿dije la verdad?, ¿compartí?, ¿ayudé?',
      },
      {
        title: '2. Dolor de los pecados',
        emoji: '💧',
        text: 'Es sentir pena de corazón por haber fallado al amor de Dios, que es tan bueno. No es miedo ni vergüenza: es el deseo de volver a sus brazos. Se lo dices con el Acto de contrición.',
      },
      {
        title: '3. Propósito de enmienda',
        emoji: '🌱',
        text: 'Es decidir, con la ayuda de Jesús, que te vas a esforzar por no repetirlo. Elige algo concreto: «Voy a obedecer a la primera», «No voy a pelear con mi hermano».',
      },
      {
        title: '4. Decir los pecados al sacerdote',
        emoji: '🗣️',
        text: 'Te santiguas y le cuentas tus pecados al sacerdote con sencillez, sin esconder nada. Él te escucha con cariño, te da un consejo y jamás contará a nadie lo que le digas: es un secreto sagrado.',
      },
      {
        title: '5. Cumplir la penitencia',
        emoji: '🙏',
        text: 'El sacerdote te pide una oración o una buena obra. Es tu manera de dar gracias y de empezar a reparar lo que estuvo mal. Cúmplela pronto y con cariño.',
      },
      {
        title: 'El abrazo del perdón',
        emoji: '🤗',
        text: 'El sacerdote extiende la mano y dice: «Yo te absuelvo de tus pecados en el nombre del Padre, y del Hijo, y del Espíritu Santo». ¡Es Jesús mismo quien te perdona! Respondes «Amén» y sales con el corazón limpio y ligero.',
      },
    ],
    closing: 'Jesús contó que en el cielo hay una gran alegría por cada persona que vuelve a Dios (Lucas 15, 7). ¡Cada vez que te confiesas, el cielo se alegra por ti!',
    quiz: [
      {
        q: '¿Cuál es el primer paso para hacer una buena confesión?',
        options: ['Cumplir la penitencia', 'El examen de conciencia', 'Recibir la absolución'],
        answer: 1,
        explain: 'Primero repasas tu vida con la luz del Espíritu Santo. Después vienen el dolor, el propósito, decir los pecados y cumplir la penitencia.',
      },
      {
        q: '¿Quién te perdona cuando el sacerdote te da la absolución?',
        options: ['Nadie: uno se perdona solo', 'Solamente el sacerdote', 'Jesús mismo, por medio del sacerdote'],
        answer: 2,
        explain: 'Jesús dio a sus apóstoles el poder de perdonar los pecados. Por eso, cuando el sacerdote te absuelve, es Jesús quien te abraza y te perdona.',
      },
      {
        q: '¿Qué hace el sacerdote con lo que le cuentas en la confesión?',
        options: ['Lo guarda en secreto para siempre', 'Se lo cuenta a tus papás', 'Lo anota en un cuaderno'],
        answer: 0,
        explain: 'El sacerdote nunca puede contar a nadie lo que oye en la confesión: es un secreto sagrado. Puedes hablarle con toda confianza.',
      },
    ],
  },

  // 9 ─────────────────────────────────────────────
  {
    id: 'eucaristia',
    title: 'La Eucaristía: Jesús, Pan de Vida',
    emoji: '🍞',
    intro: 'La noche antes de dar su vida, Jesús cenó con sus apóstoles. Quería quedarse con nosotros para siempre, ¡y encontró la manera! Tomó pan y dijo: «Esto es mi Cuerpo». Tomó el cáliz y dijo: «Esta es mi Sangre» (Mateo 26, 26-28). Y les pidió: «Hagan esto en memoria mía» (Lucas 22, 19).',
    items: [
      {
        title: 'Jesús está realmente presente',
        emoji: '✨',
        text: 'En la Misa, cuando el sacerdote repite las palabras de Jesús, el pan y el vino se convierten en su Cuerpo y su Sangre por la fuerza del Espíritu Santo. Siguen pareciendo pan y vino, pero ya no lo son: ¡es Jesús vivo, de verdad!',
      },
      {
        title: 'El Pan de Vida',
        emoji: '🌾',
        text: 'Jesús dijo: «Yo soy el pan vivo bajado del cielo. El que coma de este pan vivirá para siempre» (Juan 6, 51). Así como la comida te hace crecer por fuera, la Eucaristía te hace crecer por dentro: en amor y en amistad con Jesús.',
      },
      {
        title: 'El amor de la cruz, hoy',
        emoji: '✝️',
        text: 'En cada Misa se hace presente el amor con que Jesús entregó su vida en la cruz y resucitó. No es un recuerdo lejano, como una foto vieja: es Jesús vivo, que hoy se entrega por ti.',
      },
      {
        title: '¿Qué pasa cuando comulgo?',
        emoji: '💛',
        text: 'Jesús viene a tu corazón y te une a Él, como la rama está unida a la vid. Te da fuerza para amar, te ayuda a alejarte del pecado y te une más a toda la Iglesia. ¡Es el abrazo más grande que puedes recibir!',
      },
      {
        title: 'Jesús se queda en el sagrario',
        emoji: '🕯️',
        text: 'Las hostias consagradas se guardan en el sagrario, y una lamparita encendida nos avisa que Jesús está allí. Por eso, al pasar frente a Él, hacemos una genuflexión: doblamos la rodilla para saludarlo.',
      },
      {
        title: 'Una palabra que significa «gracias»',
        emoji: '🙌',
        text: 'Eucaristía quiere decir «acción de gracias». En la Misa damos gracias al Padre por todo lo bueno que nos da y, sobre todo, por el regalo más grande: su Hijo Jesús.',
      },
    ],
    closing: 'La hostia es pequeña y sencilla, pero en ella está Jesús entero, con todo su amor. ¡Dios se hace pequeño para caber en tu corazón!',
    quiz: [
      {
        q: '¿En qué se convierten el pan y el vino en la Misa?',
        options: ['En un recuerdo de Jesús y nada más', 'En pan y vino con sabor distinto', 'En el Cuerpo y la Sangre de Jesús'],
        answer: 2,
        explain: 'Jesús está realmente presente en la Eucaristía: el pan y el vino se convierten en su Cuerpo y su Sangre. ¡Es Él mismo, vivo!',
      },
      {
        q: '¿Cuándo nos regaló Jesús la Eucaristía?',
        options: ['En la Última Cena', 'En las bodas de Caná', 'El día de su Bautismo'],
        answer: 0,
        explain: 'En la Última Cena, Jesús dijo «Esto es mi Cuerpo» y «Esta es mi Sangre», y pidió a sus apóstoles: «Hagan esto en memoria mía».',
      },
      {
        q: '¿Dónde se guarda a Jesús Eucaristía en la iglesia?',
        options: ['En el campanario', 'En el sagrario', 'En la pila bautismal'],
        answer: 1,
        explain: 'En el sagrario, donde una lamparita encendida nos avisa que Jesús está allí. Puedes visitarlo cuando quieras: siempre te espera.',
      },
    ],
  },

  // 10 ────────────────────────────────────────────
  {
    id: 'misa',
    title: 'Las partes de la Misa',
    emoji: '🔔',
    intro: 'La Misa es la fiesta más grande de la familia de Dios. Cada domingo, Jesús nos invita a su mesa: nos reúne, nos habla, se nos da como alimento y nos envía a llevar su amor. Si conoces sus partes, la vivirás mucho mejor. ¡Vamos paso a paso!',
    items: [
      {
        title: '1. Ritos iniciales: Jesús nos reúne',
        emoji: '🎶',
        text: 'Nos ponemos de pie y cantamos. Hacemos la Señal de la Cruz, pedimos perdón a Dios y, casi todos los domingos, lo alabamos con el Gloria. Así vamos preparando el corazón.',
      },
      {
        title: '2. Liturgia de la Palabra: Dios nos habla',
        emoji: '📖',
        text: 'Sentados, escuchamos las lecturas de la Biblia y respondemos con un salmo. Para el Evangelio nos ponemos de pie, porque en él nos habla Jesús. El sacerdote lo explica en la homilía; después rezamos el Credo y pedimos por todos.',
      },
      {
        title: '3. Presentación de los dones',
        emoji: '🍇',
        text: 'Comienza la Liturgia de la Eucaristía. Se llevan al altar el pan y el vino. Junto con ellos, tú puedes ofrecerle a Dios tu semana: tus alegrías, tus esfuerzos y también tus penas.',
      },
      {
        title: '4. La consagración: el momento más grande',
        emoji: '✨',
        text: 'Cantamos el «Santo» y nos arrodillamos. El sacerdote dice las palabras de Jesús en la Última Cena, y el pan y el vino se convierten en su Cuerpo y su Sangre. Míralo y dile bajito: «¡Señor mío y Dios mío!».',
      },
      {
        title: '5. El Padre Nuestro y la paz',
        emoji: '🤝',
        text: 'Rezamos juntos la oración que Jesús nos enseñó y nos damos la paz. Después decimos «Cordero de Dios» mientras el sacerdote parte el Pan consagrado.',
      },
      {
        title: '6. La Comunión: Jesús viene a nosotros',
        emoji: '🍞',
        text: 'Decimos: «Señor, no soy digno de que entres en mi casa, pero una palabra tuya bastará para sanarme». Luego nos acercamos a recibir a Jesús y volvemos a nuestro lugar para darle gracias en silencio.',
      },
      {
        title: '7. Rito de conclusión: Jesús nos envía',
        emoji: '🚪',
        text: 'El sacerdote nos bendice y dice: «Pueden ir en paz». Respondemos: «Demos gracias a Dios». La Misa termina, ¡pero la misión comienza! Llevamos a Jesús a casa, a la escuela y a los amigos.',
      },
    ],
    closing: 'En la Misa hay dos mesas que nos alimentan: la mesa de la Palabra y la mesa de la Eucaristía. ¡No te pierdas ninguna de las dos!',
    quiz: [
      {
        q: '¿En qué parte de la Misa escuchamos las lecturas de la Biblia?',
        options: ['En el rito de conclusión', 'En la Liturgia de la Palabra', 'En la Comunión'],
        answer: 1,
        explain: 'En la Liturgia de la Palabra Dios nos habla por medio de las lecturas, el salmo y, sobre todo, el Evangelio.',
      },
      {
        q: '¿Por qué nos ponemos de pie para escuchar el Evangelio?',
        options: ['Porque ya está por terminar la Misa', 'Para ver mejor a los que cantan', 'Porque en él nos habla Jesús'],
        answer: 2,
        explain: 'El Evangelio cuenta lo que Jesús hizo y dijo. Nos ponemos de pie como señal de respeto y de alegría: ¡es Él quien nos habla!',
      },
      {
        q: '¿Qué respondemos cuando el sacerdote dice «Pueden ir en paz»?',
        options: ['«Y con tu espíritu»', '«Demos gracias a Dios»', '«Te alabamos, Señor»'],
        answer: 1,
        explain: 'Respondemos «Demos gracias a Dios» y salimos contentos a llevar el amor de Jesús a todas partes.',
      },
    ],
  },

  // 11 ────────────────────────────────────────────
  {
    id: 'comunion',
    title: 'Cómo recibo a Jesús en la Comunión',
    emoji: '🌟',
    intro: '¡Se acerca el gran día! Vas a recibir a Jesús por primera vez. Cuando esperas a un amigo muy querido, preparas la casa con ilusión, ¿verdad? Aquí la casa es tu corazón. Mira qué sencillo es prepararlo y cómo recibir a Jesús con todo tu cariño.',
    items: [
      {
        title: 'Con el corazón en gracia',
        emoji: '🤍',
        text: 'Para comulgar hay que estar en gracia de Dios, es decir, en amistad con Él. Si alguien se ha alejado de su amor con un pecado grave, primero recibe su abrazo en la Reconciliación. Por eso te confiesas antes de tu Primera Comunión.',
      },
      {
        title: 'El ayuno eucarístico',
        emoji: '⏳',
        text: 'Desde una hora antes de comulgar no comemos ni bebemos nada, salvo agua o medicinas si hacen falta. Es una manera de decirle a Jesús: «Tengo hambre de ti; Tú eres lo más importante».',
      },
      {
        title: 'Vivo toda la Misa',
        emoji: '🎶',
        text: 'Llega a tiempo, canta, responde y escucha con atención. Todo lo que pasa en la Misa va preparando tu corazón para el encuentro con Jesús.',
      },
      {
        title: 'Me acerco y respondo «Amén»',
        emoji: '🚶',
        text: 'Camina en la fila con calma y con las manos juntas. Cuando te muestren la hostia y te digan «El Cuerpo de Cristo», inclina la cabeza y responde bien claro: «Amén». Quiere decir: «¡Sí, creo que eres Tú, Jesús!».',
      },
      {
        title: 'En la boca o en la mano',
        emoji: '🙌',
        text: 'Puedes recibir a Jesús en la boca o, donde está permitido, en la mano: pones una mano sobre la otra, como un pequeño trono, y llevas la hostia a tu boca allí mismo, antes de volver a tu lugar. Tu catequista te enseñará cómo se hace en tu parroquia.',
      },
      {
        title: 'Acción de gracias',
        emoji: '💛',
        text: 'De vuelta en tu lugar, cierra los ojos y habla con Jesús, que está en tu corazón: dale gracias, cuéntale lo que llevas dentro y pídele por las personas que quieres. ¡Es el mejor momento para estar con Él!',
      },
      {
        title: 'La primera de muchas',
        emoji: '📅',
        text: 'La Primera Comunión no es la última: ¡es la primera de muchísimas! Jesús te espera cada domingo en la Misa para seguir creciendo juntos.',
      },
    ],
    closing: 'Jesús lleva mucho tiempo esperando este encuentro contigo. Prepárate con alegría y sin nervios: Él solo te pide un corazón abierto.',
    quiz: [
      {
        q: '¿Cuánto dura el ayuno eucarístico antes de comulgar?',
        options: ['Una hora', 'Un día entero', 'Cinco minutos'],
        answer: 0,
        explain: 'Una hora antes de comulgar no comemos ni bebemos nada, salvo agua o medicinas. Así le decimos a Jesús que tenemos hambre de Él.',
      },
      {
        q: '¿Qué respondes cuando te dicen «El Cuerpo de Cristo»?',
        options: ['«Gracias»', '«Amén»', '«Aleluya»'],
        answer: 1,
        explain: '«Amén» quiere decir «así es, lo creo». Con esa palabra le dices a Jesús que crees que es Él a quien recibes.',
      },
      {
        q: '¿Qué haces después de comulgar, cuando vuelves a tu lugar?',
        options: ['Doy gracias a Jesús en silencio', 'Converso con mis amigos', 'Salgo enseguida de la iglesia'],
        answer: 0,
        explain: 'Jesús está en tu corazón: es el momento de hablarle con cariño, darle gracias y pedirle por las personas que quieres.',
      },
    ],
  },

  // 12 ────────────────────────────────────────────
  {
    id: 'maria',
    title: 'La Virgen María, nuestra Madre',
    emoji: '🌹',
    intro: 'Dios eligió a una joven sencilla de Nazaret para ser la madre de su Hijo: María. Ella le dijo que sí con toda su confianza. Y Jesús, desde la cruz, nos la regaló como madre. ¡Tienes una mamá en el cielo que te quiere y te cuida!',
    items: [
      {
        title: 'El «sí» de María',
        emoji: '🕯️',
        text: 'El ángel Gabriel le anunció que sería la madre del Hijo de Dios. María respondió: «Aquí está la servidora del Señor; que se cumpla en mí lo que has dicho» (Lucas 1, 38). Gracias a ese «sí», Jesús vino al mundo.',
      },
      {
        title: 'Madre de Dios',
        emoji: '👑',
        text: 'María es la madre de Jesús, y Jesús es Dios hecho hombre. Por eso la llamamos con un título muy grande: Madre de Dios. Lo decimos en cada Ave María: «Santa María, Madre de Dios».',
      },
      {
        title: '«Hagan lo que Él les diga»',
        emoji: '🍷',
        text: 'En una boda en Caná se acabó el vino. María se dio cuenta, se lo contó a Jesús y dijo a los sirvientes: «Hagan lo que Él les diga» (Juan 2, 5). Así es ella: ve lo que nos falta y siempre nos lleva a Jesús.',
      },
      {
        title: 'Madre nuestra',
        emoji: '💙',
        text: 'Junto a la cruz, Jesús dijo al discípulo a quien tanto quería: «Ahí tienes a tu madre» (Juan 19, 27). Desde entonces, María es madre de todos los amigos de Jesús. También es tu madre.',
      },
      {
        title: 'Está en el cielo y reza por nosotros',
        emoji: '🌤️',
        text: 'Cuando terminó su vida en la tierra, María fue llevada al cielo en cuerpo y alma. Desde allí nos acompaña con cariño de madre y le presenta a Jesús nuestras oraciones.',
      },
      {
        title: '¿Cómo le hablo a María?',
        emoji: '📿',
        text: 'Con el Ave María, con la Salve y con el Rosario, en el que recordamos la vida de Jesús de la mano de su Madre. Solo adoramos a Dios; a María la queremos, la honramos y le pedimos que rece por nosotros.',
      },
    ],
    closing: 'En cada lugar la llaman con un nombre distinto: Guadalupe, Luján, Aparecida, Chiquinquirá, del Carmen… Pero es siempre la misma: María, la Madre de Jesús y Madre tuya.',
    quiz: [
      {
        q: '¿Qué le respondió María al ángel Gabriel?',
        options: ['Que lo pensaría más adelante', 'Que sí, que se cumpliera lo que Dios quería', 'Que buscara a otra persona'],
        answer: 1,
        explain: 'María dijo: «Que se cumpla en mí lo que has dicho». Confió en Dios con todo su corazón, y por su «sí» Jesús vino al mundo.',
      },
      {
        q: '¿Qué dijo María a los sirvientes en la boda de Caná?',
        options: ['«Hagan lo que Él les diga»', '«Vayan a comprar más vino»', '«No se preocupen por nada»'],
        answer: 0,
        explain: 'María siempre nos lleva a Jesús. Su consejo también es para ti: escucha a Jesús y haz lo que Él te dice.',
      },
      {
        q: '¿Por qué decimos que María es también nuestra Madre?',
        options: ['Porque así lo decidieron los apóstoles', 'Porque lo cuenta una leyenda antigua', 'Porque Jesús nos la dio desde la cruz'],
        answer: 2,
        explain: 'Jesús dijo a su discípulo: «Ahí tienes a tu madre». Desde ese día, María cuida a todos los amigos de Jesús como una mamá.',
      },
    ],
  },

  // 13 ────────────────────────────────────────────
  {
    id: 'oracion',
    title: 'La oración: hablar con Dios',
    emoji: '🙏',
    intro: 'Orar es hablar con Dios como se habla con alguien que te quiere muchísimo. No hacen falta palabras difíciles: puedes contarle lo que te alegra, lo que te preocupa y lo que sueñas. Y también quedarte calladito, escuchando con el corazón. Dios siempre, siempre te escucha.',
    items: [
      {
        title: 'Jesús también oraba',
        emoji: '🌄',
        text: 'Jesús se levantaba muy temprano y buscaba un lugar tranquilo para hablar con su Padre (Marcos 1, 35). Un día, uno de sus discípulos le pidió: «Señor, enséñanos a orar» (Lucas 11, 1). Y Él les enseñó el Padre Nuestro.',
      },
      {
        title: 'Cuatro maneras de orar',
        emoji: '🍀',
        text: 'Alabar: «¡Qué grande y qué bueno eres, Señor!». Dar gracias: «Gracias por mi familia». Pedir perdón: «Perdóname, Jesús». Pedir ayuda: «Cuida a mi abuelita». Puedes hacer las cuatro con tus propias palabras.',
      },
      {
        title: '¿Cuándo oro?',
        emoji: '⏰',
        text: 'Al despertar, para ofrecerle el día. Antes de comer, para bendecir los alimentos. Antes de dormir, para dar gracias y pedir perdón. Y en cualquier momento, con una frase cortita: «Jesús, en ti confío».',
      },
      {
        title: '¿Dónde oro?',
        emoji: '🏠',
        text: 'En tu cuarto, con la puerta cerrada, como enseñó Jesús (Mateo 6, 6); con tu familia; camino a la escuela; y de un modo especial en la iglesia, frente al sagrario, donde Jesús te espera.',
      },
      {
        title: 'Oraciones que sabemos de memoria',
        emoji: '📿',
        text: 'El Padre Nuestro, el Ave María y el Gloria son tesoros que rezamos todos juntos, con las mismas palabras, en cualquier lugar del mundo. Apréndelas despacio, renglón por renglón, pensando en lo que dicen.',
      },
      {
        title: 'Orar con la Biblia',
        emoji: '📖',
        text: 'Dios nos habla en su Palabra. Lee un pedacito del Evangelio, cierra los ojos, imagina la escena y pregúntale a Jesús: «¿Qué me quieres decir hoy?».',
      },
      {
        title: '¿Y si me distraigo?',
        emoji: '🦋',
        text: 'A todos nos pasa. No te preocupes: vuelve a empezar con calma. A Dios le importa mucho más tu cariño que las palabras perfectas.',
      },
    ],
    closing: 'Jesús prometió: «Pidan y se les dará; busquen y encontrarán; llamen y se les abrirá» (Mateo 7, 7). ¡Háblale hoy mismo!',
    quiz: [
      {
        q: '¿Qué es orar?',
        options: ['Repetir palabras sin pensar', 'Hablar con Dios y escucharlo', 'Algo que solo hacen los sacerdotes'],
        answer: 1,
        explain: 'Orar es hablar con Dios, que te quiere muchísimo, y también escucharlo con el corazón. ¡Todos podemos hacerlo!',
      },
      {
        q: '¿Qué oración enseñó Jesús a sus discípulos?',
        options: ['El Ave María', 'El Credo', 'El Padre Nuestro'],
        answer: 2,
        explain: 'Cuando le pidieron «Señor, enséñanos a orar», Jesús les enseñó el Padre Nuestro. Es la oración de todos los hijos de Dios.',
      },
      {
        q: '¿Cuándo puedes hablar con Dios?',
        options: ['En cualquier momento del día', 'Solo los domingos en Misa', 'Solo cuando estás triste'],
        answer: 0,
        explain: 'Dios te escucha siempre: al despertar, al comer, al jugar, al dormir. Basta una frase cortita dicha con cariño.',
      },
    ],
  },

  // 14 ────────────────────────────────────────────
  {
    id: 'misericordia',
    title: 'Las obras de misericordia',
    emoji: '🤲',
    intro: 'Jesús nos dio una gran sorpresa: «Todo lo que hicieron por uno de estos hermanos míos más pequeños, por mí lo hicieron» (Mateo 25, 40). ¡Cuando ayudas a alguien, ayudas a Jesús! Las obras de misericordia son catorce maneras de amar: siete cuidan el cuerpo (corporales) y siete cuidan el alma (espirituales).',
    items: [
      {
        title: 'Dar de comer al hambriento',
        emoji: '🍞',
        text: 'Comparte tu merienda con quien no trajo, no desperdicies la comida y colabora cuando en tu parroquia juntan alimentos para las familias que lo necesitan.',
      },
      {
        title: 'Dar de beber al sediento',
        emoji: '💧',
        text: 'Ofrece un vaso de agua a quien llega cansado o tiene calor. Y cuida el agua, que es un regalo de Dios para todos: no la malgastes.',
      },
      {
        title: 'Vestir al desnudo',
        emoji: '🧥',
        text: 'Regala, limpia y en buen estado, la ropa y los zapatos que ya no te quedan. A otro niño le darán abrigo y alegría.',
      },
      {
        title: 'Dar posada al peregrino',
        emoji: '🏡',
        text: 'Recibe bien al que llega de otro lugar: al compañero nuevo de la clase, al vecino recién mudado, al que viene de otro país. Invítalo a jugar y hazlo sentir en casa.',
      },
      {
        title: 'Visitar a los enfermos',
        emoji: '🌼',
        text: 'Acompaña a quien está enfermo: una visita, una llamada, un dibujo o una oración pueden ser la mejor medicina para el ánimo.',
      },
      {
        title: 'Visitar a los presos',
        emoji: '🕊️',
        text: 'Reza por las personas que están en la cárcel y por sus familias: Dios nunca deja de quererlas. Y acércate a quien está como encerrado en su soledad, como el niño que siempre se queda aparte en el recreo.',
      },
      {
        title: 'Enterrar a los difuntos',
        emoji: '🕯️',
        text: 'Acompaña con cariño a quien está triste porque murió alguien que quería. Reza por los que ya partieron y recuérdalos con gratitud. Creemos que Jesús resucitó y que nos espera a todos en la casa del Padre.',
      },
      {
        title: 'Enseñar al que no sabe',
        emoji: '📚',
        text: 'Explícale con paciencia a un compañero lo que no entiende, o enséñale a tu hermanito a atarse los zapatos y a rezar. Lo que sabes es para compartirlo.',
      },
      {
        title: 'Dar buen consejo al que lo necesita',
        emoji: '💡',
        text: 'Cuando un amigo no sabe qué hacer, ayúdalo a elegir lo bueno: decir la verdad, pedir perdón, contarles a sus papás lo que le pasa.',
      },
      {
        title: 'Corregir al que se equivoca',
        emoji: '🧭',
        text: 'Si un amigo hace algo que está mal, díselo con cariño y a solas, sin burlarte ni acusarlo delante de todos. Corregir con amor es una manera de ayudar.',
      },
      {
        title: 'Perdonar al que nos ofende',
        emoji: '🤗',
        text: 'No guardes rencor ni devuelvas mal por mal. Perdona como Dios te perdona a ti, aunque cueste. ¡El perdón deja libre el corazón!',
      },
      {
        title: 'Consolar al triste',
        emoji: '💛',
        text: 'Siéntate al lado del que llora, escúchalo y dale un abrazo. A veces no hacen falta palabras: basta con estar.',
      },
      {
        title: 'Sufrir con paciencia los defectos del prójimo',
        emoji: '🐢',
        text: 'Todos tenemos cosas que molestan a los demás, ¡tú también! Ten paciencia con el que es lento, con el que habla mucho o con el que se enoja fácil, como Dios la tiene contigo.',
      },
      {
        title: 'Rezar por los vivos y por los difuntos',
        emoji: '🙏',
        text: 'Cada noche, nombra ante Dios a tu familia, a tus amigos, a los que sufren y a tus seres queridos que ya murieron. Rezar por alguien es una manera muy grande de quererlo.',
      },
    ],
    closing: 'No hace falta ser grande para ser misericordioso. Elige hoy una sola obra y hazla con mucho amor. ¡Jesús la recibe como hecha a Él!',
    quiz: [
      {
        q: 'Según Jesús, cuando ayudas a alguien que lo necesita, ¿a quién ayudas también?',
        options: ['A nadie más', 'Solo a ti mismo', 'A Jesús mismo'],
        answer: 2,
        explain: 'Jesús dijo: «Todo lo que hicieron por uno de estos hermanos míos más pequeños, por mí lo hicieron». ¡Él recibe tu cariño!',
      },
      {
        q: '¿Cuántas son las obras de misericordia?',
        options: ['Catorce: siete corporales y siete espirituales', 'Diez, igual que los mandamientos', 'Tres, una por cada día'],
        answer: 0,
        explain: 'Son catorce: siete corporales, que cuidan el cuerpo, y siete espirituales, que cuidan el alma. ¡Catorce maneras de amar!',
      },
      {
        q: '¿Cuál de estas es una obra de misericordia?',
        options: ['Guardar todo para mí', 'Consolar al triste', 'Ganar todos los juegos'],
        answer: 1,
        explain: 'Consolar al triste es una obra de misericordia espiritual. A veces basta con sentarte a su lado, escucharlo y darle un abrazo.',
      },
    ],
  },

  // 15 ────────────────────────────────────────────
  {
    id: 'dones',
    title: 'Los dones del Espíritu Santo',
    emoji: '🔥',
    intro: 'El Espíritu Santo vive en ti desde tu Bautismo. Y no llega con las manos vacías: trae siete regalos para ayudarte a vivir como amigo de Jesús. La Biblia los anuncia en el libro del profeta Isaías (Isaías 11, 2-3). Ya los tienes en tu corazón, y en la Confirmación crecerán con más fuerza.',
    items: [
      {
        title: 'Sabiduría',
        emoji: '🌟',
        text: 'Te ayuda a saborear las cosas de Dios y a descubrir qué es lo más importante en la vida: amar. Con ella prefieres lo que te acerca a Jesús.',
      },
      {
        title: 'Entendimiento',
        emoji: '💡',
        text: 'Te ayuda a comprender mejor la Palabra de Dios y lo que aprendes en la catequesis. Es como una luz que se enciende por dentro: «¡Ah, ahora entiendo!».',
      },
      {
        title: 'Consejo',
        emoji: '🧭',
        text: 'Te ayuda a elegir bien cuando tienes dudas y a dar buenos consejos a tus amigos. Antes de decidir, puedes preguntar: «Espíritu Santo, ¿qué haría Jesús?».',
      },
      {
        title: 'Fortaleza',
        emoji: '💪',
        text: 'Te da valentía para hacer el bien aunque cueste: decir la verdad, defender al que molestan y no rendirte ante lo difícil.',
      },
      {
        title: 'Ciencia',
        emoji: '🌻',
        text: 'Te ayuda a descubrir a Dios en todo lo que creó: en una flor, en las estrellas, en cada persona. Y a cuidar la creación como un regalo suyo.',
      },
      {
        title: 'Piedad',
        emoji: '🙏',
        text: 'Te hace sentir hijo querido de Dios y hermano de todos. Te da gusto por rezar y ternura para tratar a los demás.',
      },
      {
        title: 'Temor de Dios',
        emoji: '💛',
        text: 'No es tenerle miedo a Dios, ¡todo lo contrario! Es quererlo y admirarlo tanto, que no quieres hacer nada que te aleje de su amor.',
      },
      {
        title: 'La paloma, el viento y el fuego',
        emoji: '🕊️',
        text: 'Al Espíritu Santo no lo vemos; por eso la Biblia nos habla de Él con símbolos: la paloma en el bautismo de Jesús (Marcos 1, 10), y el viento y las lenguas como de fuego en Pentecostés (Hechos 2, 2-3). La paloma no es el Espíritu Santo: es un símbolo que nos lo recuerda.',
      },
    ],
    closing: 'Cada mañana puedes llamarlo con esta oración: «Ven, Espíritu Santo, llena mi corazón y enciende en mí el fuego de tu amor». ¡Él siempre viene!',
    quiz: [
      {
        q: '¿Cuántos son los dones del Espíritu Santo?',
        options: ['Siete', 'Tres', 'Doce'],
        answer: 0,
        explain: 'Son siete: sabiduría, entendimiento, consejo, fortaleza, ciencia, piedad y temor de Dios. ¡Siete regalos para tu corazón!',
      },
      {
        q: '¿Qué es el don del temor de Dios?',
        options: ['Tenerle miedo a Dios', 'Esconderse de Dios', 'Amarlo tanto que no quieres alejarte de Él'],
        answer: 2,
        explain: 'No es miedo: es amar y admirar tanto a Dios, que es Padre bueno, que no quieres hacer nada que te aleje de su amor.',
      },
      {
        q: '¿Qué don te da valentía para hacer el bien aunque cueste?',
        options: ['Fortaleza', 'Ciencia', 'Piedad'],
        answer: 0,
        explain: 'La fortaleza te ayuda a decir la verdad, a defender al que molestan y a no rendirte. ¡Pídesela al Espíritu Santo cuando la necesites!',
      },
    ],
  },
];
