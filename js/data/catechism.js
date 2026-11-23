// «Mi camino a la Primera Comunión»: catequesis de Palomita para niños de 7 a 10 años.
// Itinerario general de preparación según el Catecismo de la Iglesia Católica y su Compendio,
// ordenado en sus cuatro partes: Creo (la fe), Celebro (los sacramentos), Vivo (la vida en Cristo)
// y Rezo (la oración). No es el temario oficial de ninguna diócesis: cada parroquia puede ajustar el orden.
// Módulo de datos puro: sin imports, sin lógica y sin HTML en los textos.
// Las frases bíblicas entre comillas son formulaciones propias, sencillas y fieles al sentido
// del pasaje citado (citas en formato católico: «Libro capítulo, versículos»).
// Cada tema: { id, title, emoji, unit, intro, items: [{ title, emoji, text }], closing, quiz: [3 preguntas] }.
// unit: 'creo' | 'celebro' | 'vivo' | 'rezo'. No cambies los id: el progreso guardado usa «cat:<id>».

export const CATECHISM = [
  // ═════════════ CREO · Lo que creemos ═════════════

  // 1 ────────────────────────────────────────────
  {
    id: 'dios',
    title: '¿Quién es Dios?',
    emoji: '☀️',
    unit: 'creo',
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

  // 2 ────────────────────────────────────────────
  {
    id: 'biblia',
    title: 'La Biblia, Palabra de Dios',
    emoji: '📖',
    unit: 'creo',
    intro: '¿Sabías que Dios quiso hablarnos con palabras que podemos leer? Lo hizo en la Biblia, el libro más querido de los cristianos. En realidad es como una biblioteca: muchos libros escritos a lo largo de cientos de años. Personas de fe los escribieron con sus palabras, y el Espíritu Santo las inspiró. ¡Por eso es Palabra de Dios!',
    items: [
      {
        title: 'Dos grandes partes',
        emoji: '📚',
        text: 'El Antiguo Testamento cuenta cómo Dios fue preparando a su pueblo, Israel, para la llegada del Salvador. El Nuevo Testamento nos habla de Jesús y de los primeros cristianos. En total son 73 libros: 46 del Antiguo Testamento y 27 del Nuevo.',
      },
      {
        title: 'Los Evangelios, el corazón de la Biblia',
        emoji: '✝️',
        text: 'Los cuatro Evangelios, escritos por Mateo, Marcos, Lucas y Juan, cuentan lo que Jesús hizo y enseñó. «Evangelio» quiere decir «buena noticia». ¡Y la mejor noticia es que Dios nos ama y nos salva en Jesús! Por eso, en la Misa, el Evangelio se escucha de pie.',
      },
      {
        title: 'Inspirada por el Espíritu Santo',
        emoji: '💡',
        text: 'Los autores de la Biblia escribieron con su propio estilo, pero el Espíritu Santo los iluminaba, y así pusieron por escrito la verdad que Dios quería enseñarnos para nuestra salvación. Por eso san Pablo enseña que toda la Escritura está inspirada por Dios (2 Timoteo 3, 16).',
      },
      {
        title: '¿Cómo busco una cita?',
        emoji: '🔎',
        text: 'En la cita «Lucas 15, 4», primero va el libro (Lucas), luego el capítulo (15) y, después de la coma, el versículo (4). ¡Haz la prueba con tu Biblia! Allí Jesús habla del pastor que deja a las demás para buscar a su oveja perdida.',
      },
      {
        title: 'Dios nos habla en la Misa',
        emoji: '⛪',
        text: 'Cada domingo escuchamos lecturas de la Biblia. Al terminar la primera y la segunda lectura, el lector dice «Palabra de Dios», y todos respondemos: «Te alabamos, Señor». ¡Es Dios mismo quien nos habla!',
      },
      {
        title: 'Una lámpara para tu camino',
        emoji: '🕯️',
        text: 'La Biblia dice: «Tu palabra es una lámpara para mis pasos» (Salmo 119, 105). Trátala con cariño: tenla en un lugar especial de tu casa y lee cada día un pedacito con tu familia.',
      },
    ],
    closing: 'Toda la Biblia nos lleva a Jesús, la Palabra de Dios hecha hombre (Juan 1, 14). Antes de leerla, dile: «Habla, Señor, que tu siervo escucha» (1 Samuel 3, 9).',
    quiz: [
      {
        q: '¿Por qué decimos que la Biblia es Palabra de Dios?',
        options: ['Porque cayó del cielo ya escrita', 'Porque el Espíritu Santo inspiró a quienes la escribieron', 'Porque es un libro muy antiguo'],
        answer: 1,
        explain: 'Personas de fe la escribieron con sus palabras, y el Espíritu Santo las inspiró. Así Dios nos habla en ella como un Padre que quiere a sus hijos.',
      },
      {
        q: '¿Qué libros de la Biblia cuentan la vida de Jesús?',
        options: ['Los Evangelios', 'Los Salmos', 'Los libros de los Reyes'],
        answer: 0,
        explain: 'Mateo, Marcos, Lucas y Juan escribieron los cuatro Evangelios. «Evangelio» quiere decir «buena noticia»: ¡Jesús es la mejor noticia!',
      },
      {
        q: 'En la cita «Lucas 15, 4», ¿qué indica el número 15?',
        options: ['El versículo', 'La página del libro', 'El capítulo'],
        answer: 2,
        explain: 'Primero va el libro, después el capítulo y, al final, el versículo. En Lucas, capítulo 15, versículo 4, Jesús habla de la oveja perdida.',
      },
    ],
  },

  // 3 ────────────────────────────────────────────
  {
    id: 'creacion',
    title: 'Dios creó todo con amor',
    emoji: '🌎',
    unit: 'creo',
    intro: 'Al principio no había nada… y Dios, con su palabra, lo creó todo: la luz, el cielo, el mar, las plantas, los animales y, por último, al hombre y a la mujer. No lo hizo porque le faltara algo, sino por amor, para compartir su bondad. Y al terminar, Dios miró todo lo que había hecho, y vio que era muy bueno (Génesis 1, 31).',
    items: [
      {
        title: 'Todo salió de sus manos',
        emoji: '🏔️',
        text: 'Los nevados de los Andes, el valle del Mantaro, la selva amazónica, el mar, el cóndor y la vicuña… ¡todo es obra de Dios! Cada criatura nos muestra algo de su belleza, como un cuadro nos habla del artista que lo pintó.',
      },
      {
        title: 'Creados a su imagen',
        emoji: '🧒',
        text: 'De todo lo que hizo, lo más querido para Dios somos las personas. Nos creó a su imagen: capaces de pensar, de elegir el bien, de amar y de ser sus amigos. Por eso cada persona vale muchísimo, sea como sea y venga de donde venga.',
      },
      {
        title: 'También los ángeles',
        emoji: '😇',
        text: 'Dios creó también a los ángeles. No los vemos porque no tienen cuerpo, pero existen: alaban a Dios y cumplen sus encargos. Cada uno de nosotros tiene un ángel de la guarda que lo acompaña y lo protege.',
      },
      {
        title: 'Dios nos confió su jardín',
        emoji: '🌳',
        text: 'Dios puso al hombre en el jardín para que lo cultivara y lo cuidara (Génesis 2, 15). Hoy nos confía el mundo entero. El papa Francisco lo llamó «nuestra casa común»: la casa de todos, la de hoy y la de los niños que vendrán.',
      },
      {
        title: '¿Cómo la cuido yo?',
        emoji: '🌱',
        text: 'Apaga la luz y cierra el caño cuando no los usas. No tires basura en la calle ni en el río. Recicla, cuida las plantas y trata con cariño a los animales. ¡Los pequeños gestos de muchos niños cambian el mundo!',
      },
      {
        title: 'Gracias, Señor, por tanto',
        emoji: '🙌',
        text: 'San Francisco de Asís alababa a Dios por el hermano sol, la hermana luna y la hermana agua. Tú también puedes rezar al ver un atardecer o al comer una fruta rica: «¡Gracias, Señor, por este regalo!».',
      },
    ],
    closing: 'El mundo es un regalo de Dios, y tú eres su obra más querida. Cuidar la creación es una manera de decirle: «Gracias, Padre, por tanto amor».',
    quiz: [
      {
        q: '¿Por qué creó Dios el mundo?',
        options: ['Porque se sentía solo y aburrido', 'Por casualidad, sin querer', 'Por amor, para compartir su bondad'],
        answer: 2,
        explain: 'Dios no necesitaba nada: creó todo por amor, para compartir su bondad con nosotros. ¡Tú también existes porque Dios te quiso!',
      },
      {
        q: '¿Qué tarea nos confió Dios con la creación?',
        options: ['Cuidarla como un jardín', 'Gastarla sin pensar', 'No preocuparnos por ella'],
        answer: 0,
        explain: 'Dios puso el mundo en nuestras manos para que lo cultivemos y lo cuidemos. Es la casa común de todos, ¡también de los niños que vendrán!',
      },
      {
        q: '¿Qué tienen de especial las personas en la creación?',
        options: ['Que son las más fuertes', 'Que fueron creadas a imagen de Dios', 'Que nunca se equivocan'],
        answer: 1,
        explain: 'Dios nos hizo a su imagen: capaces de pensar, de amar y de ser sus amigos. Por eso cada persona vale muchísimo.',
      },
    ],
  },

  // 4 ────────────────────────────────────────────
  {
    id: 'pecado-salvacion',
    title: 'El pecado y la promesa de salvación',
    emoji: '🌈',
    unit: 'creo',
    intro: 'Dios hizo un mundo muy bueno y creó al hombre y a la mujer para ser sus amigos. Entonces, ¿por qué hay peleas, mentiras y tristeza? La Biblia nos lo explica con la historia de Adán y Eva. Y nos da una noticia maravillosa: Dios nunca deja de amarnos, ¡y nos prometió un Salvador!',
    items: [
      {
        title: 'Adán y Eva dejaron de confiar',
        emoji: '🌳',
        text: 'Dios les regaló un jardín precioso y les pidió una sola cosa: no comer del fruto de un árbol. Pero escucharon las mentiras de la serpiente, dejaron de confiar en Dios y desobedecieron. Enseguida sintieron vergüenza y miedo, y se escondieron (Génesis 3, 1-10).',
      },
      {
        title: '¿Qué es el pecado?',
        emoji: '💔',
        text: 'Pecar es elegir lo malo sabiendo que está mal, y así alejarse del amor de Dios y de los demás. Es como soltarse de la mano de papá en medio de la multitud: uno se pierde y se pone triste. Pero Dios sale a buscarnos: «¿Dónde estás?» (Génesis 3, 9).',
      },
      {
        title: 'Una herida que todos traemos',
        emoji: '🌧️',
        text: 'Desde aquel primer pecado, todos nacemos sin la vida de gracia que Dios había regalado al principio, y con una herida que a veces nos hace difícil el bien: es el pecado original. Solo Jesús y la Virgen María estuvieron libres de él. El Bautismo lo borra y nos llena de la vida de Dios.',
      },
      {
        title: 'Dios hizo una promesa',
        emoji: '🌈',
        text: 'Dios no abandonó a Adán y Eva. Allí mismo anunció que un descendiente de la mujer vencería al mal (Génesis 3, 15). Durante siglos renovó su promesa por medio de Abraham, Moisés, David y los profetas, y su pueblo esperó con ilusión al Salvador.',
      },
      {
        title: 'Jesús, el Salvador',
        emoji: '✝️',
        text: 'La promesa se cumplió en Jesús, el hijo de María. Su nombre quiere decir «Dios salva». Con su muerte en la cruz y su resurrección venció al pecado y a la muerte, y nos abrió de nuevo el camino hacia el Padre.',
      },
      {
        title: 'Siempre podemos volver',
        emoji: '🤗',
        text: 'Aunque nos equivoquemos, Dios nunca deja de querernos. Su perdón es como un abrazo, y lo recibimos en la Reconciliación. San Pablo lo dice así: donde abundó el pecado, el amor de Dios fue todavía más grande (Romanos 5, 20).',
      },
    ],
    closing: 'El pecado no tiene la última palabra: la tiene el amor de Dios. Cuando te equivoques, no te escondas como Adán y Eva. ¡Corre a los brazos del Padre!',
    quiz: [
      {
        q: '¿Qué hicieron Adán y Eva después de desobedecer a Dios?',
        options: ['Se escondieron entre los árboles', 'Fueron a contárselo a sus amigos', 'Se pusieron a bailar de alegría'],
        answer: 0,
        explain: 'Sintieron vergüenza y miedo, y se escondieron. Pero Dios los buscó preguntando: «¿Dónde estás?». ¡Él siempre nos busca porque nos ama!',
      },
      {
        q: '¿Qué sacramento borra el pecado original?',
        options: ['El Matrimonio', 'El Bautismo', 'La Unción de los Enfermos'],
        answer: 1,
        explain: 'El Bautismo borra el pecado original y nos hace hijos de Dios. Aun así, seguimos necesitando su ayuda para elegir siempre el bien.',
      },
      {
        q: '¿Qué quiere decir el nombre de Jesús?',
        options: ['«Niño pequeño»', '«Hombre del campo»', '«Dios salva»'],
        answer: 2,
        explain: 'Jesús quiere decir «Dios salva». Él es el Salvador que Dios había prometido desde el principio: vino a vencer al pecado y a la muerte.',
      },
    ],
  },

  // 5 ────────────────────────────────────────────
  {
    id: 'jesus',
    title: 'Jesús, mi mejor amigo',
    emoji: '💛',
    unit: 'creo',
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

  // 6 ────────────────────────────────────────────
  {
    id: 'semana-santa',
    title: 'La Semana Santa y la Pascua',
    emoji: '🌿',
    unit: 'creo',
    intro: 'La semana más importante del año para los cristianos es la Semana Santa. En ella acompañamos a Jesús, que nos amó hasta el extremo (Juan 13, 1): entró en Jerusalén, cenó con sus amigos, dio su vida en la cruz… ¡y resucitó! Es un camino que va de la tristeza a la alegría más grande.',
    items: [
      {
        title: 'Domingo de Ramos',
        emoji: '🌿',
        text: 'Jesús entró en Jerusalén montado en un burrito. La gente extendía mantos y ramas en el camino y gritaba: «¡Hosanna! ¡Bendito el que viene en nombre del Señor!» (Mateo 21, 9). Ese día llevamos palmas o ramos de olivo a la iglesia para que los bendigan.',
      },
      {
        title: 'Jueves Santo: la Última Cena',
        emoji: '🍞',
        text: 'Jesús lavó los pies a sus apóstoles para enseñarnos a servir (Juan 13, 1-15). En esa cena nos dejó la Eucaristía, su Cuerpo y su Sangre, y también el sacerdocio. Esa noche, muchas familias del Perú visitan siete iglesias para acompañar a Jesús.',
      },
      {
        title: 'Viernes Santo: Jesús da su vida',
        emoji: '✝️',
        text: 'Jesús murió en la cruz por amor a todos nosotros, y aun allí perdonó: «Padre, perdónalos, porque no saben lo que hacen» (Lucas 23, 34). Ese día no se celebra la Misa: adoramos la cruz y acompañamos a Jesús rezando el vía crucis.',
      },
      {
        title: 'Sábado Santo: silencio y espera',
        emoji: '🕯️',
        text: 'Jesús descansa en el sepulcro, y la Iglesia espera en silencio junto a María. Por la noche se celebra la Vigilia Pascual, la noche más santa del año: se enciende el cirio pascual, vuelve a cantarse el Aleluya y renovamos las promesas de nuestro Bautismo.',
      },
      {
        title: 'Domingo de Resurrección',
        emoji: '🌅',
        text: 'Muy temprano, unas mujeres fueron al sepulcro y lo encontraron vacío. Dos hombres con ropas brillantes les dijeron: «¿Por qué buscan entre los muertos al que vive? ¡Ha resucitado!» (Lucas 24, 5-6). ¡Es el día más feliz del año!',
      },
      {
        title: 'Cincuenta días de fiesta',
        emoji: '🎉',
        text: '«Pascua» quiere decir «paso»: Jesús pasó de la muerte a la vida, ¡y nos lleva con Él! La alegría es tan grande que la celebramos durante cincuenta días, hasta Pentecostés. Y cada domingo del año es una pequeña Pascua.',
      },
    ],
    closing: 'El Viernes Santo nos muestra cuánto nos ama Jesús, y el Domingo de Pascua, que el amor de Dios es más fuerte que la muerte. ¡Aleluya!',
    quiz: [
      {
        q: '¿Cómo recibió la gente a Jesús cuando entró en Jerusalén?',
        options: ['Con ramas y gritos de «¡Hosanna!»', 'Con las puertas cerradas', 'Con un silencio triste'],
        answer: 0,
        explain: 'La gente extendía mantos y ramas y gritaba «¡Hosanna!». Por eso el Domingo de Ramos llevamos palmas para aclamar a Jesús como nuestro Rey.',
      },
      {
        q: '¿Qué nos dejó Jesús el Jueves Santo, en la Última Cena?',
        options: ['Una corona de oro', 'Un libro escrito por Él', 'La Eucaristía'],
        answer: 2,
        explain: 'En la Última Cena, el pan y el vino se convirtieron en su Cuerpo y su Sangre, y Jesús pidió: «Hagan esto en memoria mía». ¡Así se quedó con nosotros!',
      },
      {
        q: '¿Qué celebramos el Domingo de Resurrección?',
        options: ['Que empieza la Cuaresma', 'Que Jesús resucitó y está vivo', 'Que Jesús nació en Belén'],
        answer: 1,
        explain: '¡Jesús venció a la muerte y vive para siempre! Es la fiesta más grande de los cristianos, y la celebramos con alegría durante cincuenta días.',
      },
    ],
  },

  // 7 ────────────────────────────────────────────
  {
    id: 'iglesia',
    title: 'La Iglesia, familia de Dios',
    emoji: '⛪',
    unit: 'creo',
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

  // 8 ────────────────────────────────────────────
  {
    id: 'maria',
    title: 'La Virgen María, nuestra Madre',
    emoji: '🌹',
    unit: 'creo',
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
    closing: 'En el Perú la llamamos Virgen de la Candelaria, de Chapi, de la Puerta, de Cocharcas, del Carmen… Tiene muchos nombres, pero es siempre la misma: María, la Madre de Jesús y Madre tuya.',
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

  // 9 ────────────────────────────────────────────
  {
    id: 'vida-eterna',
    title: 'El cielo y la vida eterna',
    emoji: '🌅',
    unit: 'creo',
    intro: 'A veces nos preguntamos qué pasa cuando alguien muere. Jesús nos dio una respuesta llena de esperanza: «En la casa de mi Padre hay muchas habitaciones… Voy a prepararles un lugar» (Juan 14, 2). La muerte no es el final: ¡Dios nos creó para vivir con Él para siempre!',
    items: [
      {
        title: 'Jesús venció a la muerte',
        emoji: '✝️',
        text: 'Jesús murió de verdad y resucitó de verdad. Por eso, en el Credo de los Apóstoles, decimos que creemos en «la resurrección de la carne y la vida eterna». Al final de los tiempos, Jesús volverá lleno de gloria, y nuestros cuerpos también resucitarán.',
      },
      {
        title: '¿Qué es el cielo?',
        emoji: '☀️',
        text: 'El cielo no es un lugar entre las nubes: es estar para siempre con Dios, que es amor, junto a la Virgen María, los ángeles, los santos y las personas que queremos. Allí Dios secará toda lágrima, y ya no habrá muerte ni dolor (Apocalipsis 21, 4).',
      },
      {
        title: 'El purgatorio',
        emoji: '🕯️',
        text: 'Algunos mueren siendo amigos de Dios, pero su corazón todavía necesita quedar del todo limpio para entrar en el cielo. La Iglesia llama purgatorio a esa purificación. ¡Ya tienen asegurado el cielo! Podemos ayudarlos con nuestras oraciones y pidiendo una Misa por ellos.',
      },
      {
        title: 'Dios nos deja elegir',
        emoji: '🧭',
        text: 'Dios nos hizo libres y no obliga a nadie a quererlo. Quien rechaza su amor para siempre se queda lejos de Él: eso es el infierno. Pero Dios quiere que todos se salven (1 Timoteo 2, 4) y sale a nuestro encuentro con su perdón una y otra vez.',
      },
      {
        title: 'Seguimos unidos',
        emoji: '🤍',
        text: 'Los que murieron en la amistad de Dios siguen unidos a nosotros: es la comunión de los santos. El 1 de noviembre celebramos a Todos los Santos, y el 2 rezamos por los fieles difuntos. Muchas familias del Perú visitan esos días el cementerio con flores.',
      },
      {
        title: 'El camino al cielo',
        emoji: '👣',
        text: 'El camino al cielo empieza aquí: amando a Dios y a los demás, recibiendo los sacramentos y pidiendo perdón cuando fallamos. Jesús nos dijo: «Yo soy el camino, la verdad y la vida» (Juan 14, 6). ¡Vamos de su mano!',
      },
    ],
    closing: '«Lo que Dios ha preparado para los que lo aman, nadie lo ha visto ni lo ha imaginado» (1 Corintios 2, 9). ¡El cielo es más bonito que todos tus sueños juntos!',
    quiz: [
      {
        q: '¿Qué es el cielo?',
        options: ['Un lugar lleno de nubes y nada más', 'Estar para siempre con Dios y con los que lo aman', 'Un sueño que se olvida al despertar'],
        answer: 1,
        explain: 'El cielo es vivir para siempre con Dios, que es amor, junto a María, los ángeles y los santos. ¡Allí la alegría no se acaba nunca!',
      },
      {
        q: '¿Cómo podemos ayudar a nuestros seres queridos que ya murieron?',
        options: ['Rezando por ellos y pidiendo una Misa', 'Olvidándonos de ellos', 'No se puede hacer nada'],
        answer: 0,
        explain: 'Seguimos unidos a ellos en la comunión de los santos. Nuestras oraciones y la Misa los ayudan a llegar a los brazos de Dios.',
      },
      {
        q: '¿Qué dijo Jesús sobre la casa de su Padre?',
        options: ['Que estaba cerrada', 'Que era solo para los ángeles', 'Que allí nos prepara un lugar'],
        answer: 2,
        explain: 'Jesús dijo: «Voy a prepararles un lugar». Dios te creó para vivir con Él para siempre, ¡y te espera con los brazos abiertos!',
      },
    ],
  },

  // ═════════════ CELEBRO · Los sacramentos y la vida de la Iglesia ═════════════

  // 10 ───────────────────────────────────────────
  {
    id: 'parroquia',
    title: 'Mi parroquia y mi comunidad',
    emoji: '🏘️',
    unit: 'celebro',
    intro: 'Tu parroquia es como una casa grande donde vive la familia de Dios de tu barrio. Allí vas a la catequesis, allí celebras la Misa del domingo y allí harás tu Primera Comunión. ¡Vamos a conocerla por dentro y a descubrir quiénes forman parte de ella!',
    items: [
      {
        title: 'Parte de una Iglesia más grande',
        emoji: '🗺️',
        text: 'Cada parroquia pertenece a una diócesis, guiada por un obispo, sucesor de los apóstoles. Por ejemplo, las parroquias de Huancayo forman parte de la Arquidiócesis de Huancayo, cuyo pastor es un arzobispo. Y todas las diócesis del mundo están unidas al Papa. ¿Sabes cómo se llama la tuya?',
      },
      {
        title: 'Quiénes la cuidan',
        emoji: '👥',
        text: 'El párroco es el sacerdote que el obispo envía para cuidar la parroquia como un buen pastor. Lo ayudan otros sacerdotes, diáconos, religiosas, catequistas, el coro, los monaguillos y muchos voluntarios. ¡Cada uno pone sus talentos al servicio de todos!',
      },
      {
        title: 'Un paseo por el templo',
        emoji: '⛪',
        text: 'El altar es la mesa donde se celebra la Eucaristía. El ambón es el lugar desde donde se proclama la Palabra de Dios. En el sagrario está Jesús, y una lamparita encendida nos lo recuerda. En la pila bautismal se bautiza, y en el confesionario recibimos el perdón.',
      },
      {
        title: 'Cómo me porto en la iglesia',
        emoji: '🤫',
        text: 'Al entrar, te santiguas con agua bendita. Frente al sagrario haces una genuflexión. Hablas bajito, no corres y participas en la Misa cantando y respondiendo. Es la casa de Dios: ¡la cuidamos con cariño!',
      },
      {
        title: 'Una comunidad que celebra unida',
        emoji: '🎉',
        text: 'En la parroquia celebramos juntos las grandes fiestas: la Navidad, la Semana Santa, la fiesta del santo patrono y las procesiones. Y también compartimos la vida: rezamos por los enfermos, visitamos a los ancianos y ayudamos a las familias que lo necesitan.',
      },
      {
        title: 'Tú también tienes un lugar',
        emoji: '🙋',
        text: 'La parroquia no es solo de los mayores. Los niños pueden servir como monaguillos, cantar en el coro, llevar las ofrendas en la Misa o participar en la Infancia Misionera. Pregunta en tu parroquia cómo puedes ayudar.',
      },
    ],
    closing: 'Los primeros cristianos se reunían para escuchar a los apóstoles, partir el pan y rezar, y lo compartían todo con alegría (Hechos 2, 42-47). ¡Así queremos vivir en tu parroquia!',
    quiz: [
      {
        q: '¿Cómo se llama el sacerdote que cuida una parroquia?',
        options: ['El párroco', 'El monaguillo', 'El sacristán'],
        answer: 0,
        explain: 'El párroco es el pastor de la parroquia: el obispo lo envía para celebrar los sacramentos, enseñar y cuidar a la comunidad.',
      },
      {
        q: '¿Qué es el ambón?',
        options: ['El lugar donde se guarda a Jesús', 'El lugar desde donde se proclama la Palabra de Dios', 'La campana de la iglesia'],
        answer: 1,
        explain: 'Desde el ambón se proclaman las lecturas y el Evangelio. Es la mesa de la Palabra, así como el altar es la mesa de la Eucaristía.',
      },
      {
        q: '¿Pueden los niños participar en la vida de la parroquia?',
        options: ['No, es solo para los mayores', 'Solo cuando cumplan dieciocho años', 'Sí, como monaguillos o en el coro'],
        answer: 2,
        explain: 'En la Iglesia nadie sobra: los niños también sirven a Jesús como monaguillos, cantando en el coro o en la Infancia Misionera.',
      },
    ],
  },

  // 11 ───────────────────────────────────────────
  {
    id: 'ano-liturgico',
    title: 'El año de la Iglesia y sus colores',
    emoji: '🗓️',
    unit: 'celebro',
    intro: 'Así como tu año tiene clases, vacaciones y cumpleaños, la Iglesia tiene su propio calendario: el año litúrgico. En él recorremos toda la vida de Jesús, desde que esperamos su nacimiento hasta su Resurrección y el envío del Espíritu Santo. ¡Y cada tiempo tiene su color! Fíjate en la ropa del sacerdote.',
    items: [
      {
        title: 'Adviento: esperamos a Jesús',
        emoji: '💜',
        text: 'Con el Adviento empieza el año de la Iglesia. Son unas cuatro semanas antes de Navidad, en las que preparamos el corazón para recibir a Jesús. Su color es el morado. En muchas casas, cada domingo se enciende una vela más de la corona de Adviento.',
      },
      {
        title: 'Navidad: ¡Jesús nació!',
        emoji: '⭐',
        text: 'Celebramos que el Hijo de Dios nació en Belén para quedarse con nosotros. Su color es el blanco, señal de fiesta y de luz. En el Perú, muchas familias arman el nacimiento en casa. Este tiempo dura hasta la fiesta del Bautismo del Señor.',
      },
      {
        title: 'Cuaresma: cuarenta días con Jesús',
        emoji: '🌵',
        text: 'Empieza el Miércoles de Ceniza y dura cuarenta días, como los que Jesús pasó en el desierto. Es tiempo de rezar más, compartir con los que lo necesitan y hacer pequeños sacrificios. Su color es otra vez el morado. Nos prepara para la Pascua.',
      },
      {
        title: 'Semana Santa y Pascua',
        emoji: '🤍',
        text: 'La Semana Santa nos lleva a la Pascua, la fiesta más grande del año: ¡Jesús resucitó! El tiempo de Pascua dura cincuenta días y se viste de blanco. Termina en Pentecostés, cuando se usa el rojo, color del fuego del Espíritu Santo.',
      },
      {
        title: 'Tiempo ordinario: crecemos con Jesús',
        emoji: '💚',
        text: 'Es el tiempo más largo del año y tiene dos partes: una después de Navidad y otra después de Pentecostés. Escuchamos lo que Jesús hizo y enseñó, y crecemos en la fe como plantitas. Por eso su color es el verde. Su último domingo es la gran fiesta de Jesucristo, Rey del Universo.',
      },
      {
        title: 'Los colores, de un vistazo',
        emoji: '🎨',
        text: 'Morado: Adviento y Cuaresma. Blanco: Navidad, Pascua y las fiestas de Jesús, de María y de muchos santos. Rojo: Domingo de Ramos, Viernes Santo, Pentecostés y los mártires. Verde: tiempo ordinario. Y a veces rosado, en un domingo de Adviento y otro de Cuaresma.',
      },
    ],
    closing: 'La próxima vez que vayas a Misa, mira el color de la ropa del sacerdote y adivina en qué tiempo estamos. ¡Así vives todo el año al lado de Jesús!',
    quiz: [
      {
        q: '¿Con qué tiempo empieza el año de la Iglesia?',
        options: ['Con la Cuaresma', 'Con el Adviento', 'Con el tiempo ordinario'],
        answer: 1,
        explain: 'El año litúrgico empieza con el Adviento, unas cuatro semanas antes de Navidad, cuando nos preparamos con alegría para recibir a Jesús.',
      },
      {
        q: '¿Qué color usa el sacerdote en el tiempo ordinario?',
        options: ['Verde', 'Morado', 'Rojo'],
        answer: 0,
        explain: 'El verde es el color de las plantas que crecen: en el tiempo ordinario vamos creciendo en la fe junto a Jesús.',
      },
      {
        q: '¿Cuántos días dura la Cuaresma?',
        options: ['Siete días', 'Cien días', 'Cuarenta días'],
        answer: 2,
        explain: 'La Cuaresma dura cuarenta días, como los que Jesús pasó en el desierto. Empieza el Miércoles de Ceniza y nos prepara para la Pascua.',
      },
    ],
  },

  // 12 ───────────────────────────────────────────
  {
    id: 'sacramentos',
    title: 'Los siete sacramentos',
    emoji: '🎁',
    unit: 'celebro',
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

  // 13 ───────────────────────────────────────────
  {
    id: 'bautismo',
    title: 'El Bautismo',
    emoji: '💧',
    unit: 'celebro',
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

  // 14 ───────────────────────────────────────────
  {
    id: 'confirmacion',
    title: 'La Confirmación',
    emoji: '🌬️',
    unit: 'celebro',
    intro: 'Hay otro regalo de Dios que completa tu Bautismo: la Confirmación. En ella, el Espíritu Santo viene a ti con más fuerza, como vino sobre los apóstoles en Pentecostés, para que seas un amigo valiente de Jesús y lleves su amor a todas partes. Si todavía no la has recibido, ¡te espera más adelante!',
    items: [
      {
        title: 'Completa el Bautismo',
        emoji: '🧩',
        text: 'El Espíritu Santo, que ya vive en ti desde el Bautismo, te llena de sus dones y te une todavía más a Jesús y a la Iglesia. Junto con el Bautismo y la Eucaristía, la Confirmación es uno de los tres sacramentos de la iniciación cristiana.',
      },
      {
        title: 'La unción con el santo crisma',
        emoji: '✋',
        text: 'Normalmente la celebra el obispo. Con la mano sobre la cabeza del confirmando, le unge la frente con el santo crisma haciendo una cruz, y le dice: «Recibe por esta señal el don del Espíritu Santo». Él responde: «Amén».',
      },
      {
        title: 'Un sello para siempre',
        emoji: '🌟',
        text: 'Como el Bautismo, la Confirmación se recibe una sola vez, porque deja en el alma un sello que no se borra. Es como si Dios te dijera: «Eres mío para siempre, y cuento contigo».',
      },
      {
        title: 'Testigos valientes',
        emoji: '📣',
        text: 'Jesús prometió a sus apóstoles: «Recibirán la fuerza del Espíritu Santo y serán mis testigos» (Hechos 1, 8). Un confirmado da testimonio de Jesús con su vida: dice la verdad, ayuda a los demás y habla de Él sin vergüenza.',
      },
      {
        title: 'Con un padrino o una madrina',
        emoji: '🤝',
        text: 'Quien se confirma tiene un padrino o una madrina que lo acompaña con su ejemplo y su oración. Antes se prepara en la parroquia; tu catequista te contará a qué edad la celebran en tu diócesis.',
      },
    ],
    closing: 'Desde ahora puedes pedirle al Espíritu Santo: «Ven, Espíritu Santo, hazme un amigo valiente de Jesús». ¡Él ya está obrando en ti!',
    quiz: [
      {
        q: '¿Quién viene a nosotros con más fuerza en la Confirmación?',
        options: ['El ángel Gabriel', 'El Espíritu Santo', 'El profeta Elías'],
        answer: 1,
        explain: 'En la Confirmación el Espíritu Santo viene con más fuerza y nos regala sus dones, como a los apóstoles en Pentecostés.',
      },
      {
        q: '¿Con qué unge el obispo la frente del que se confirma?',
        options: ['Con ceniza', 'Con agua del río', 'Con el santo crisma'],
        answer: 2,
        explain: 'El santo crisma es un aceite perfumado que el obispo consagra en la Misa Crismal. Con él traza una cruz en la frente: ¡perteneces a Cristo!',
      },
      {
        q: '¿Para qué nos da su fuerza el Espíritu Santo en la Confirmación?',
        options: ['Para ser testigos valientes de Jesús', 'Para ganar todas las competencias', 'Para no tener que estudiar'],
        answer: 0,
        explain: 'Jesús prometió: «Recibirán la fuerza del Espíritu Santo y serán mis testigos». Con esa fuerza contamos a todos cuánto nos ama Dios.',
      },
    ],
  },

  // 15 ───────────────────────────────────────────
  {
    id: 'reconciliacion',
    title: 'La Reconciliación: cómo me confieso',
    emoji: '🤗',
    unit: 'celebro',
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
        text: 'El sacerdote extiende la mano, reza una oración y dice: «Yo te absuelvo de tus pecados en el nombre del Padre, y del Hijo, y del Espíritu Santo». ¡Es Jesús mismo quien te perdona! Respondes «Amén» y sales con el corazón limpio y ligero.',
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

  // 16 ───────────────────────────────────────────
  {
    id: 'eucaristia',
    title: 'La Eucaristía: Jesús, Pan de Vida',
    emoji: '🍞',
    unit: 'celebro',
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

  // 17 ───────────────────────────────────────────
  {
    id: 'misa',
    title: 'Las partes de la Misa',
    emoji: '🔔',
    unit: 'celebro',
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

  // 18 ───────────────────────────────────────────
  {
    id: 'comunion',
    title: 'Cómo recibo a Jesús en la Comunión',
    emoji: '🌟',
    unit: 'celebro',
    intro: '¡Se acerca el gran día! Vas a recibir a Jesús por primera vez. Cuando esperas a un amigo muy querido, preparas la casa con ilusión, ¿verdad? Aquí la casa es tu corazón. Mira qué sencillo es prepararlo y cómo recibir a Jesús con todo tu cariño.',
    items: [
      {
        title: 'Con el corazón en gracia',
        emoji: '🤍',
        text: 'Para comulgar hay que estar en gracia de Dios, es decir, en amistad con Él. Si alguien se ha alejado de su amor con un pecado grave, primero recibe su abrazo en la Reconciliación. Y antes de tu Primera Comunión harás tu primera confesión, para recibir a Jesús con el corazón limpio y en paz.',
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

  // ═════════════ VIVO · Vivir como Jesús ═════════════

  // 19 ───────────────────────────────────────────
  {
    id: 'mandamientos',
    title: 'Los Diez Mandamientos',
    emoji: '📜',
    unit: 'vivo',
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

  // 20 ───────────────────────────────────────────
  {
    id: 'amor',
    title: 'El mandamiento del amor',
    emoji: '❤️',
    unit: 'vivo',
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

  // 21 ───────────────────────────────────────────
  {
    id: 'misericordia',
    title: 'Las obras de misericordia',
    emoji: '🤲',
    unit: 'vivo',
    intro: 'Jesús nos dio una gran sorpresa: «Todo lo que hicieron por uno de estos hermanos míos más pequeños, por mí lo hicieron» (Mateo 25, 40). ¡Cuando ayudas a alguien, ayudas a Jesús! Las obras de misericordia son catorce maneras de amar: siete cuidan el cuerpo (corporales) y siete cuidan el alma (espirituales).',
    items: [
      {
        title: 'Dar de comer al hambriento',
        emoji: '🍞',
        text: 'Comparte tu lonchera con quien no trajo, no desperdicies la comida y colabora cuando en tu parroquia juntan alimentos para las familias que lo necesitan.',
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
        text: 'Explícale con paciencia a un compañero lo que no entiende, o enséñale a tu hermanito a amarrarse los zapatos y a rezar. Lo que sabes es para compartirlo.',
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

  // 22 ───────────────────────────────────────────
  {
    id: 'virtudes',
    title: 'Fe, esperanza y caridad',
    emoji: '⚓',
    unit: 'vivo',
    intro: 'Un deportista entrena cada día para ser más fuerte. En la vida cristiana, ese entrenamiento se llama virtud: la costumbre de hacer el bien. Hay tres virtudes que Dios mismo siembra en tu corazón desde el Bautismo: la fe, la esperanza y la caridad. Se llaman teologales, porque vienen de Dios y nos llevan a Él.',
    items: [
      {
        title: 'La fe: me fío de Dios',
        emoji: '✝️',
        text: 'Tener fe es fiarte de Dios y creer lo que Él nos ha enseñado, aunque no lo veas, como crees lo que te dice alguien que te quiere y nunca te engaña. Jesús le dijo a Tomás: «Felices los que creen sin haber visto» (Juan 20, 29).',
      },
      {
        title: 'La esperanza: confío en sus promesas',
        emoji: '⚓',
        text: 'La esperanza es estar seguro de que Dios cumple lo que promete: que nunca nos deja solos y que nos espera en el cielo. La Biblia dice que es como un ancla del alma, segura y firme (Hebreos 6, 19): así como el ancla sostiene al barco cuando hay olas, la esperanza nos sostiene en los días difíciles.',
      },
      {
        title: 'La caridad: amo como Jesús',
        emoji: '❤️',
        text: 'La caridad es amar a Dios sobre todas las cosas y a los demás como Él nos ama. Es la más grande de las tres: «Ahora quedan la fe, la esperanza y la caridad, pero la más grande de todas es la caridad» (1 Corintios 13, 13).',
      },
      {
        title: 'Una cruz, un ancla y un corazón',
        emoji: '🎨',
        text: 'Desde hace mucho tiempo, los cristianos dibujan estas virtudes con tres símbolos: la cruz para la fe, el ancla para la esperanza y el corazón para la caridad. ¿Te animas a dibujarlos en tu cuaderno?',
      },
      {
        title: 'Cómo hacerlas crecer',
        emoji: '🌱',
        text: 'Las virtudes crecen con la práctica, como los músculos. La fe crece cuando rezas y escuchas la Palabra; la esperanza, cuando confías en Dios en los días difíciles; la caridad, cuando ayudas, compartes y perdonas.',
      },
      {
        title: 'Otras cuatro virtudes importantes',
        emoji: '🧭',
        text: 'Se llaman cardinales: la prudencia, que te ayuda a pensar antes de actuar; la justicia, que te ayuda a dar a cada uno lo que le corresponde; la fortaleza, que te da valor para hacer el bien; y la templanza, que te ayuda a no exagerar con lo que te gusta.',
      },
    ],
    closing: 'Cada mañana puedes decirle a Dios: «Señor, creo en ti, espero en ti y te amo». ¡Así entrenas las tres virtudes antes de empezar el día!',
    quiz: [
      {
        q: '¿Cuáles son las tres virtudes teologales?',
        options: ['Fe, esperanza y caridad', 'Fuerza, rapidez y destreza', 'Paciencia, silencio y orden'],
        answer: 0,
        explain: 'Fe, esperanza y caridad: Dios las siembra en tu corazón desde el Bautismo, y crecen cuando las practicas.',
      },
      {
        q: 'Según san Pablo, ¿cuál es la más grande de las tres?',
        options: ['La fe', 'La esperanza', 'La caridad'],
        answer: 2,
        explain: '«La más grande de todas es la caridad», dice san Pablo. El amor nunca pasará: en el cielo ya no hará falta creer ni esperar, ¡solo amar!',
      },
      {
        q: '¿Con qué símbolo se representa la esperanza?',
        options: ['Con una corona', 'Con un ancla', 'Con una espada'],
        answer: 1,
        explain: 'El ancla mantiene firme el barco en la tormenta. Así nos sostiene la esperanza: confiamos en que Dios cumple sus promesas.',
      },
    ],
  },

  // 23 ───────────────────────────────────────────
  {
    id: 'dones',
    title: 'Los dones del Espíritu Santo',
    emoji: '🔥',
    unit: 'vivo',
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
    closing: 'Cada mañana puedes llamarlo con esta oración: «Ven, Espíritu Santo, llena los corazones de tus fieles y enciende en ellos el fuego de tu amor». ¡Él siempre viene!',
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

  // 24 ───────────────────────────────────────────
  {
    id: 'santos-peru',
    title: 'Los santos del Perú',
    emoji: '😇',
    unit: 'vivo',
    intro: '¿Sabías que el Perú es tierra de santos? Hace unos cuatrocientos años, en Lima, vivieron en la misma época varias personas que amaron tanto a Jesús que hoy la Iglesia las reconoce como santas. No eran superhéroes: eran gente sencilla que se dejó llenar del amor de Dios. ¡Conócelos!',
    items: [
      {
        title: 'Santa Rosa de Lima',
        emoji: '🌹',
        text: 'Nació en Lima en 1586. La bautizaron como Isabel, pero la llamaron Rosa porque, de bebé, su carita parecía una rosa. Rezaba muchísimo y cuidaba en su casa a enfermos y pobres. Fue la primera santa de América y es patrona del Perú y de América. En el Perú la celebramos el 30 de agosto.',
      },
      {
        title: 'San Martín de Porres',
        emoji: '🧹',
        text: 'Nació en Lima en 1579, hijo de un español y de una mujer afrodescendiente. Fue hermano dominico: curaba enfermos y daba de comer a los pobres, sin importar quiénes fueran. Lo llaman «fray Escoba» porque barría el convento con alegría y humildad. Su fiesta es el 3 de noviembre.',
      },
      {
        title: 'Santo Toribio de Mogrovejo',
        emoji: '⛰️',
        text: 'Llegó de España para ser arzobispo de Lima. Para conocer a su pueblo recorrió miles de kilómetros a pie y en mula, por montañas, ríos y desiertos. Aprendió quechua e impulsó un catecismo en castellano, quechua y aimara. Él confirmó a santa Rosa de Lima.',
      },
      {
        title: 'San Juan Macías',
        emoji: '🚪',
        text: 'Nació en España, quedó huérfano de niño y trabajó como pastor. Ya en Lima, se hizo hermano dominico y fue portero del convento: cada día daba de comer a muchísimos pobres. Rezaba el rosario por las almas del purgatorio y era muy amigo de san Martín de Porres.',
      },
      {
        title: 'San Francisco Solano',
        emoji: '🎻',
        text: 'Este fraile franciscano llegó de España como misionero. Anunció a Jesús en el norte de lo que hoy es Argentina y en Paraguay, y después en Lima, donde murió en 1610. Con su violín alegraba a los niños, a los enfermos y a los pueblos indígenas, y les hablaba de Dios.',
      },
      {
        title: 'Santos de carne y hueso',
        emoji: '🙋',
        text: 'Ninguno nació santo: se fueron haciendo santos poco a poco, rezando, sirviendo y dejando que Dios los cambiara. Tú también estás llamado a ser santo en tu casa, en tu colegio y en tu barrio. ¡El Perú necesita santos nuevos!',
      },
    ],
    closing: 'Elige a uno de estos santos como amigo especial. Lee su historia y pídele: «Ruega por mí, para que yo también ame mucho a Jesús».',
    quiz: [
      {
        q: '¿Quién fue la primera santa de América?',
        options: ['Santa Clara de Asís', 'Santa Teresa de Calcuta', 'Santa Rosa de Lima'],
        answer: 2,
        explain: 'Santa Rosa nació en Lima y fue la primera persona de América declarada santa. Es patrona del Perú y de América, y la celebramos el 30 de agosto.',
      },
      {
        q: '¿Por qué llaman «fray Escoba» a san Martín de Porres?',
        options: ['Porque vendía escobas en el mercado', 'Porque barría el convento con humildad', 'Porque coleccionaba escobas'],
        answer: 1,
        explain: 'San Martín hacía con amor los trabajos más sencillos y cuidaba a enfermos y pobres sin importar quiénes fueran. ¡Servir con humildad lo hizo santo!',
      },
      {
        q: '¿Qué hizo santo Toribio para anunciar a Jesús a todos?',
        options: ['Recorrió los pueblos y aprendió quechua', 'Nunca salió de su casa en Lima', 'Envió cartas sin conocer a nadie'],
        answer: 0,
        explain: 'Santo Toribio recorrió miles de kilómetros por montañas y ríos para visitar a su pueblo, y aprendió quechua para hablarle de Jesús en su propia lengua.',
      },
    ],
  },

  // ═════════════ REZO · Hablar con Dios ═════════════

  // 25 ───────────────────────────────────────────
  {
    id: 'oracion',
    title: 'La oración: hablar con Dios',
    emoji: '🙏',
    unit: 'rezo',
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

  // 26 ───────────────────────────────────────────
  {
    id: 'padre-nuestro',
    title: 'El Padre Nuestro, frase por frase',
    emoji: '👐',
    unit: 'rezo',
    intro: 'Es la oración que Jesús mismo enseñó a sus discípulos (Mateo 6, 9-13), y por eso la llamamos «la oración del Señor». Tiene siete peticiones: las tres primeras miran a Dios, y las otras cuatro, a lo que necesitamos. Cuando la rezas despacio, ¡descubres que en ella cabe toda tu vida!',
    items: [
      {
        title: '«Padre nuestro, que estás en el cielo»',
        emoji: '💛',
        text: 'Jesús nos invita a llamar a Dios «Padre», con la confianza de un niño en brazos de su papá. Decimos «nuestro» porque somos hermanos: nadie reza solo. Y «que estás en el cielo» no quiere decir que esté lejos: habla de su grandeza, y Él vive en el corazón de los que lo aman.',
      },
      {
        title: '«Santificado sea tu Nombre»',
        emoji: '✨',
        text: 'Pedimos que todos conozcan, respeten y amen el nombre de Dios. Lo santificamos cuando lo nombramos con cariño y cuando vivimos como buenos hijos suyos.',
      },
      {
        title: '«Venga a nosotros tu reino»',
        emoji: '👑',
        text: 'El reino de Dios es su amor reinando en el mundo: donde hay paz, justicia, perdón y alegría. Pedimos que llegue del todo, y que empiece ya en nuestro corazón y en nuestra casa.',
      },
      {
        title: '«Hágase tu voluntad en la tierra como en el cielo»',
        emoji: '🌍',
        text: 'Le decimos a Dios: «Lo que Tú quieras, porque sabes lo que es mejor». Como Jesús, que en el monte de los Olivos rezó: «Que no se haga mi voluntad, sino la tuya» (Lucas 22, 42).',
      },
      {
        title: '«Danos hoy nuestro pan de cada día»',
        emoji: '🍞',
        text: 'Pedimos lo que necesitamos para vivir: comida, casa, salud y trabajo para los papás. Y también el Pan de Vida, la Eucaristía. Decimos «nuestro» y no «mío»: por eso compartimos con los que no tienen.',
      },
      {
        title: '«Perdona nuestras ofensas…»',
        emoji: '🤗',
        text: '«…como también nosotros perdonamos a los que nos ofenden». Dios nos perdona siempre, y nos pide que nosotros también perdonemos. Un corazón que perdona queda libre para recibir todo su amor.',
      },
      {
        title: '«No nos dejes caer en la tentación, y líbranos del mal»',
        emoji: '🛡️',
        text: 'Son las dos últimas peticiones. La tentación es una invitación a hacer lo malo: pedimos a Dios fuerza para decirle «no» y que nos proteja de todo mal. Terminamos diciendo «Amén», que quiere decir: «¡Así sea, lo creo de corazón!».',
      },
    ],
    closing: 'No reces el Padre Nuestro corriendo: piensa en cada frase. Es la oración que une a todos los cristianos del mundo, ¡y la rezamos juntos en cada Misa, antes de la Comunión!',
    quiz: [
      {
        q: '¿Cuántas peticiones tiene el Padre Nuestro?',
        options: ['Tres', 'Siete', 'Diez'],
        answer: 1,
        explain: 'Tiene siete peticiones: las tres primeras miran a Dios y las cuatro últimas, a lo que necesitamos. ¡Jesús pensó en todo!',
      },
      {
        q: '¿Por qué decimos «Padre nuestro» y no «Padre mío»?',
        options: ['Porque somos hermanos y nadie reza solo', 'Porque así es más corto', 'Porque Dios solo escucha a los grupos'],
        answer: 0,
        explain: 'Todos somos hijos del mismo Padre. Cuando rezas el Padre Nuestro, rezas con toda la familia de Dios, ¡aunque estés solito en tu cuarto!',
      },
      {
        q: '¿Qué pedimos al decir «Danos hoy nuestro pan de cada día»?',
        options: ['Solo pan para el desayuno', 'Dulces y juguetes nuevos', 'Lo que necesitamos para vivir y la Eucaristía'],
        answer: 2,
        explain: 'Pedimos alimento, casa, salud y todo lo necesario, y también el Pan de Vida, Jesús en la Eucaristía. ¡Y nos comprometemos a compartir!',
      },
    ],
  },
];
