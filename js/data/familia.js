// «Para conversar en casa»: guía breve para los papás en cada tema de «Mi camino a la Primera Comunión».
// Módulo de datos puro: sin imports, sin lógica y sin HTML en los textos.
// Las claves son los id de los temas de js/data/catechism.js, más cuatro temas nuevos:
// credo, mandamientos-iglesia, pecados-capitales y rosario.
//
// Forma: FAMILY = { <idTema>: { ask: [3 preguntas], do: 'actividad', pray: 'oración' } }
//   ask   tres preguntas abiertas para conversar en la mesa. Van dirigidas al niño (tú): los papás las leen
//         en voz alta y conviene que también ellos respondan. Invitan a contar y a escuchar, no a examinar.
//   do    una actividad en familia de unos diez minutos, con cosas que hay en cualquier casa (para los papás: «ustedes»).
//   pray  una oración en familia de una a tres frases, para rezarla todos juntos.

export const FAMILY = {
  // ═════════════ CREO ═════════════
  dios: {
    ask: [
      '¿Cómo te imaginas a Dios? ¿Qué te gustaría preguntarle?',
      '¿En qué momentos de tu día sientes que Dios te cuida?',
      '¿Por qué crees que Jesús nos enseñó a llamar «Padre» a Dios?',
    ],
    do: 'Asómense a la ventana o salgan un rato al patio o a la azotea, y miren juntos el cielo, los cerros y las plantas. Cada uno nombra algo hermoso que Dios creó y le da gracias por eso. Terminen haciendo juntos la Señal de la Cruz, despacio: con ella nombramos al Padre, al Hijo y al Espíritu Santo.',
    pray: 'Padre, Hijo y Espíritu Santo: gracias porque nos conoces por nuestro nombre y nos quieres tal como somos. Que en esta casa vivamos siempre en tu amor. Amén.',
  },

  biblia: {
    ask: [
      '¿Cuál es tu historia favorita de la Biblia? ¿Qué es lo que más te gusta de ella?',
      'Si Dios te escribiera una carta, ¿qué crees que te diría?',
      '¿A qué personaje de la Biblia te gustaría conocer? ¿Qué le preguntarías?',
    ],
    do: 'Busquen la Biblia de la casa y pónganla abierta en un lugar especial, con una flor al lado. Enséñenle al niño a buscar una cita, por ejemplo Lucas 15, 4-7, la oveja perdida. Léanla en voz alta, despacio, y que cada uno diga qué palabra o qué frase le llegó al corazón.',
    pray: 'Señor, tu Palabra es una lámpara para nuestros pasos. Ayúdanos a escucharla con el corazón abierto y a vivirla cada día en esta casa. Amén.',
  },

  creacion: {
    ask: [
      '¿Qué es lo más bonito que Dios creó, para ti? ¿Por qué?',
      'Si Dios te pidiera cuidar un rincón del mundo, ¿cuál elegirías?',
      '¿Qué podemos hacer en casa para cuidar el agua, las plantas y los animales?',
    ],
    do: 'Siembren juntos una semilla de frejol, de maíz o de lo que tengan en la cocina, en un vasito o una lata con tierra, y pónganla junto a la ventana. Cada día el niño la riega y mira cómo crece. Conversen sobre cómo Dios nos confía su creación para que la cuidemos.',
    pray: 'Gracias, Padre, por el valle del Mantaro, los cerros, la lluvia y el sol, y por cada persona de esta familia. Ayúdanos a cuidar tu creación, que es la casa de todos. Amén.',
  },

  'pecado-salvacion': {
    ask: [
      '¿Por qué crees que Adán y Eva se escondieron de Dios?',
      '¿Qué hace que una amistad se rompa? ¿Y qué ayuda a arreglarla?',
      '¿Cómo te imaginas la cara de Dios cuando alguien vuelve a Él después de equivocarse?',
    ],
    do: 'Cuéntenle al niño, con sencillez, alguna vez en que ustedes se equivocaron y alguien los perdonó. Luego dibujen juntos un arcoíris, señal de que Dios cumple sus promesas, y escriban debajo: «Dios nunca deja de amarnos». Péguenlo donde todos lo vean.',
    pray: 'Padre bueno, gracias porque nunca dejas de buscarnos cuando nos alejamos de ti, y gracias por Jesús, nuestro Salvador. Danos un corazón humilde para volver siempre a tus brazos. Amén.',
  },

  jesus: {
    ask: [
      '¿Qué es lo que más te gusta de Jesús?',
      'Si Jesús viniera hoy a comer a nuestra casa, ¿qué le contarías?',
      '¿Qué hace un buen amigo? ¿En qué se nota que Jesús es tu amigo?',
    ],
    do: 'Lean juntos Marcos 10, 13-16, cuando Jesús abraza y bendice a los niños. Luego cada uno le cuenta a Jesús, en voz alta y con sus palabras, algo de su día, como se lo contaría a un amigo. Terminen con un abrazo de familia.',
    pray: 'Jesús, amigo nuestro, gracias por estar con nosotros todos los días. Enséñanos a querernos como Tú nos quieres. Amén.',
  },

  'semana-santa': {
    ask: [
      '¿Qué momento de la Semana Santa te parece el más importante? ¿Por qué?',
      '¿Qué crees que sintieron los amigos de Jesús cuando lo vieron resucitado?',
      '¿Cómo te gustaría que vivamos en familia la próxima Semana Santa?',
    ],
    do: 'Armen juntos una pequeña cruz con dos palitos o ramitas amarradas con pita, y pónganla en un lugar visible de la casa. Conversen sobre cuánto nos amó Jesús. En Pascua, adórnenla con flores para celebrar que Jesús resucitó y está vivo.',
    pray: 'Señor Jesús, que diste tu vida por amor y resucitaste, gracias por amarnos hasta el extremo. Que en nuestra casa nunca falte la alegría de la Pascua. Amén.',
  },

  iglesia: {
    ask: [
      '¿Qué personas de la parroquia conoces? ¿Qué hace cada una?',
      '¿Por qué crees que Jesús quiso que lo siguiéramos juntos, como una familia?',
      '¿Cómo te gustaría ayudar tú en la Iglesia?',
    ],
    do: 'Dibujen una planta de uva, como la vid de la que habla Jesús en Juan 15, 5: Él es la vid y nosotros las ramas. En cada rama escriban un nombre: los de la familia, los padrinos, los catequistas, el párroco, los vecinos de la parroquia y el del niño. Conversen: todos estamos unidos a Jesús y entre nosotros.',
    pray: 'Señor, gracias por la gran familia de la Iglesia. Bendice al Papa, a nuestro arzobispo, a nuestro párroco y a toda nuestra comunidad, y haz que caminemos siempre unidos. Amén.',
  },

  maria: {
    ask: [
      '¿Qué crees que sintió María cuando el ángel le dio la noticia?',
      'Si pudieras conversar con la Virgen María, ¿qué le contarías?',
      '¿Qué fiesta de la Virgen se celebra en nuestro barrio o en el pueblo de los abuelos? ¿Cómo es?',
    ],
    do: 'Preparen juntos un pequeño altar a la Virgen con una estampa o una imagen que tengan en casa y una flor. Cada uno le cuenta a María, en silencio o en voz alta, por quién quiere que rece. Terminen rezando juntos un Ave María, despacio.',
    pray: 'Virgen María, Madre de Jesús y Madre nuestra, cuida a esta familia y llévanos siempre a tu Hijo. Enséñanos a decirle «sí» a Dios, como tú. Amén.',
  },

  'vida-eterna': {
    ask: [
      '¿Cómo te imaginas el cielo?',
      '¿A qué persona querida que ya murió te gustaría recordar hoy? ¿Qué recuerdas de ella?',
      '¿Qué cosas buenas podemos hacer aquí para caminar hacia el cielo?',
    ],
    do: 'Busquen la foto de un familiar o de alguien querido que ya murió, y cuéntenle al niño quién era y algo bonito de su vida. Recen juntos por esa persona. Si el niño hace preguntas difíciles, escúchenlo con calma; también se vale decir: «No lo sé, pero confiamos en Dios».',
    pray: 'Dales, Señor, el descanso eterno, y brille para ellos la luz perpetua. Que descansen en paz, y que un día nos encontremos todos contigo en el cielo. Amén.',
  },

  credo: {
    ask: [
      '¿Qué quiere decir para ti la palabra «creo»?',
      '¿En quién confías sin dudar? ¿Por qué?',
      'De todo lo que decimos en el Credo, ¿qué es lo que más te gusta o te sorprende?',
    ],
    do: 'Lean juntos el Credo de los Apóstoles en voz alta, frase por frase. El niño levanta la mano cada vez que se nombra al Padre, a Jesús o al Espíritu Santo. Elijan una frase para aprenderla de memoria esta semana y escríbanla en un papel pegado en la pared o en la puerta.',
    pray: 'Señor, creemos en ti y en todo lo que nos has enseñado. Aumenta nuestra fe, para que la vivamos con alegría y sepamos compartirla con los demás. Amén.',
  },

  // ═════════════ CELEBRO ═════════════
  parroquia: {
    ask: [
      '¿Qué es lo que más te gusta de nuestra parroquia?',
      '¿A quién de la parroquia te gustaría conocer mejor? ¿Por qué?',
      '¿Cómo podríamos ayudar como familia en nuestra parroquia?',
    ],
    do: 'Vayan juntos a la parroquia un ratito antes de Misa, o un día en que esté abierta, y recórranla sin apuro: el altar, el ambón, el sagrario con su lamparita, la pila bautismal y el confesionario. Dejen que el niño les explique lo que ya aprendió, y saluden juntos a Jesús en el sagrario.',
    pray: 'Señor, bendice a nuestra Parroquia Santo Cura de Ars, a nuestro párroco, a nuestro diácono, a los catequistas y a todas las familias de Pío Pata. San Juan María Vianney, ruega por nosotros. Amén.',
  },

  'ano-liturgico': {
    ask: [
      '¿De qué colores has visto la ropa del sacerdote en la Misa? ¿Qué crees que nos quieren decir?',
      '¿Cuál es tu fiesta favorita de la Iglesia? ¿Por qué?',
      '¿Qué costumbre de nuestra familia para Navidad o Semana Santa te gusta más?',
    ],
    do: 'Dibujen en una hoja un círculo grande, dividido en partes con los colores de los tiempos del año de la Iglesia: morado, blanco, verde y rojo. Pongan en el centro una flecha de cartón sujeta con un clip, para que el niño la mueva cada vez que vea un color nuevo en la Misa.',
    pray: 'Señor, queremos caminar contigo todo el año: esperarte en Adviento, alegrarnos en Navidad, acompañarte en Cuaresma y celebrar tu Pascua. Bendice este tiempo que vivimos. Amén.',
  },

  sacramentos: {
    ask: [
      '¿Qué sacramento has visto celebrar? ¿Qué recuerdas de ese día?',
      '¿Por qué crees que Jesús usó cosas sencillas, como el agua, el pan y el aceite, para darnos su amor?',
      '¿Qué sientes al pensar en los sacramentos que vas a recibir pronto?',
    ],
    do: 'Pongan en la mesa algunos signos sencillos: un vaso de agua, un pan, un poco de aceite, una vela y un anillo. El niño toma cada uno, cuenta con qué sacramento se relaciona y qué aprendió sobre él. Terminen nombrando juntos los siete sacramentos, contándolos con los dedos.',
    pray: 'Jesús, gracias por los sacramentos, regalos de tu amor para toda la vida. Prepara nuestro corazón para recibirlos siempre con fe y alegría. Amén.',
  },

  bautismo: {
    ask: [
      '¿Qué te gustaría saber del día de tu Bautismo?',
      '¿Qué sabes de tus padrinos de Bautismo? ¿Qué te gustaría preguntarles?',
      '¿Qué significa para ti ser hijo de Dios?',
    ],
    do: 'Busquen las fotos o la partida de Bautismo del niño y cuéntenle cómo fue ese día: dónde fue, quién lo bautizó y quiénes fueron sus padrinos. Anoten la fecha en el calendario para celebrarla cada año con una oración especial o un postre sencillo: ¡es su cumpleaños como hijo de Dios!',
    pray: 'Padre, gracias porque en el Bautismo nos hiciste tus hijos para siempre. Que la luz de la fe que recibimos ese día brille en esta casa y nunca se apague. Amén.',
  },

  confirmacion: {
    ask: [
      '¿Qué significa para ti ser valiente?',
      'Si el Espíritu Santo te diera fuerza para algo difícil, ¿para qué se la pedirías?',
      '¿Conoces a alguien que dé testimonio de Jesús con su vida? ¿Qué hace?',
    ],
    do: 'Cuéntenle al niño si ustedes están confirmados, quién fue su padrino o madrina y qué recuerdan de ese día. Si no se han confirmado, pueden decirle con sencillez que nunca es tarde y preguntar en la parroquia por la preparación de adultos. Luego dibujen juntos una llama de fuego y escriban debajo: «Ven, Espíritu Santo».',
    pray: 'Ven, Espíritu Santo, llena los corazones de tus fieles y enciende en ellos el fuego de tu amor. Haznos testigos valientes de Jesús en la casa, en el colegio y en el trabajo. Amén.',
  },

  reconciliacion: {
    ask: [
      '¿Cómo te sientes cuando alguien te perdona? ¿Y cuando tú perdonas?',
      '¿Qué crees que sintió el papá de la parábola cuando vio volver a su hijo?',
      '¿Qué te gustaría saber de la confesión? ¿Hay algo que te dé nervios?',
    ],
    do: 'Lean juntos Lucas 15, 11-24, el hijo que vuelve a casa, y conversen sobre el abrazo del padre. Si ustedes se confiesan, cuéntenle cómo se sienten después. Muy importante: nunca le pregunten qué va a confesar ni qué confesó. Eso queda entre él y Dios, y el sacerdote guarda siempre el secreto. Al salir, celébrenlo con un abrazo.',
    pray: 'Jesús, gracias por tu perdón, que nos devuelve la paz. Ayúdanos a pedirnos perdón en casa y a perdonarnos de corazón, como Tú nos perdonas. Amén.',
  },

  eucaristia: {
    ask: [
      '¿Por qué crees que Jesús quiso quedarse con nosotros en la Eucaristía?',
      '¿Qué le quieres decir a Jesús el día que lo recibas por primera vez?',
      '¿Por qué cosas de esta semana le podemos dar gracias a Dios?',
    ],
    do: 'Cuéntenle al niño cómo fue su propia Primera Comunión, o la de alguien de la familia: qué recuerdan, quién los acompañó y qué sintieron. Luego hagan juntos una lista de cosas por las que quieren dar gracias, porque «Eucaristía» quiere decir «acción de gracias».',
    pray: 'Jesús, Pan de Vida, creemos que estás realmente presente en la Eucaristía. Gracias por quedarte con nosotros. Prepara nuestros corazones para recibirte con amor. Amén.',
  },

  misa: {
    ask: [
      '¿Qué parte de la Misa te gusta más? ¿Por qué?',
      '¿Qué parte de la Misa te cuesta entender? Busquemos juntos la respuesta.',
      'Si pudieras invitar a alguien a la Misa del domingo, ¿a quién invitarías?',
    ],
    do: 'Este domingo vayan juntos a Misa y siéntense donde el niño pueda ver bien el altar. Después, en el almuerzo, cada uno cuenta algo que escuchó o que le llamó la atención. Empiecen ustedes, para que el niño vea que todos seguimos aprendiendo.',
    pray: 'Señor, gracias por reunirnos cada domingo alrededor de tu mesa. Ayúdanos a escuchar tu Palabra, a recibirte con amor y a llevar tu paz a todos. Amén.',
  },

  comunion: {
    ask: [
      '¿Cómo te imaginas el día de tu Primera Comunión?',
      '¿Qué quieres decirle a Jesús cuando lo recibas en tu corazón?',
      '¿Qué es lo que más ilusión te da de ese día? ¿Hay algo que te preocupe?',
    ],
    do: 'Ensayen en casa, con calma y sin presión, cómo acercarse a comulgar, tal como lo enseñan en la catequesis: caminar con las manos juntas, responder «Amén» bien claro y volver al lugar para hablar con Jesús en silencio. No usen pan ni galletas: bastan los gestos. Terminen escribiendo juntos una oración para ese día.',
    pray: 'Jesús, te esperamos con alegría. Prepara nuestros corazones para recibirte, y que la Primera Comunión sea el comienzo de una amistad contigo para toda la vida. Amén.',
  },

  // ═════════════ VIVO ═════════════
  mandamientos: {
    ask: [
      '¿Para qué crees que Dios nos dio los mandamientos?',
      '¿Qué mandamiento te parece más fácil de vivir? ¿Y cuál más difícil?',
      '¿Cómo cambiaría nuestro barrio si todos vivieran los mandamientos?',
    ],
    do: 'Dibujen dos tablas de piedra en una hoja. En la primera, el niño escribe o dibuja cómo amamos a Dios; en la segunda, cómo amamos a los demás. Al hablar del sexto mandamiento, recuérdenle con calma que su cuerpo es un regalo de Dios y que siempre puede contarles si algo lo hace sentir incómodo.',
    pray: 'Señor, tus mandamientos son camino de vida y de libertad. Ayúdanos a amarte sobre todas las cosas y a querernos en esta casa como Tú nos quieres. Amén.',
  },

  'mandamientos-iglesia': {
    ask: [
      '¿Por qué crees que la Iglesia, como una buena madre, nos da estos cinco mandamientos?',
      '¿Qué podríamos hacer en familia para que el domingo sea un día especial?',
      '¿Cómo puede un niño ayudar a su parroquia?',
    ],
    do: 'Que el niño dibuje el contorno de su mano en una hoja y escriba en cada dedo, con sus palabras, uno de los cinco mandamientos de la Iglesia. Luego elijan juntos uno para vivirlo en familia este mes, por ejemplo, ir a Misa todos los domingos o ayudar en alguna actividad de la parroquia.',
    pray: 'Señor, gracias por la Iglesia, que nos cuida como una madre. Ayúdanos a celebrar el domingo, a buscar tu perdón y tu Pan, y a compartir con generosidad lo que tenemos. Amén.',
  },

  'pecados-capitales': {
    ask: [
      '¿Qué virtud admiras en alguien de nuestra familia? ¿Por qué?',
      '¿Qué te ayuda a calmarte cuando te enojas?',
      '¿Cómo te sientes cuando compartes algo que te gusta mucho?',
    ],
    do: 'Pidan al niño que les cuente las virtudes que aprendió en este tema y escriban cada una en una tarjetita de papel. Cada noche de esta semana saquen una al azar, y cada uno cuenta un momento en que vio a alguien de la casa vivirla. Empiecen ustedes: así el niño aprende a fijarse en lo bueno de los demás.',
    pray: 'Señor, Tú conoces nuestro corazón. Danos humildad, paciencia y generosidad, para que en esta casa crezcan el amor y la alegría. Amén.',
  },

  amor: {
    ask: [
      '¿Cuándo te sentiste muy querido esta semana?',
      '¿Hay alguien en tu salón o en el barrio que necesite un poco más de cariño?',
      '¿Cómo nos amó Jesús? ¿Cómo podemos amarnos así en casa?',
    ],
    do: 'Escriban el nombre de cada miembro de la familia en un papelito y pónganlos en una bolsa. Cada uno saca un nombre y, durante la semana, hace algo bonito por esa persona sin que se dé cuenta: una ayuda, un dibujo, una nota de cariño. El domingo adivinan quién fue el amigo secreto de cada uno.',
    pray: 'Jesús, Tú nos amaste hasta dar la vida. Enséñanos a amarnos como Tú nos amas: con paciencia, con perdón y con alegría. Amén.',
  },

  misericordia: {
    ask: [
      '¿Conoces a alguien que esté pasando un momento difícil? ¿Cómo podríamos ayudarlo?',
      '¿Qué obra de misericordia te gustaría hacer esta semana?',
      '¿Te acuerdas de alguna vez que alguien te ayudó sin que se lo pidieras? ¿Cómo te sentiste?',
    ],
    do: 'Elijan juntos una obra de misericordia para hacer esta semana: separar ropa o juguetes en buen estado para regalar, visitar o llamar a un abuelito que vive solo, o rezar en familia por los enfermos del barrio. Que el niño ayude a decidir y participe en hacerla.',
    pray: 'Señor, abre nuestros ojos para ver a los que necesitan ayuda y nuestras manos para servirles. Que en cada uno de ellos te encontremos a ti. Amén.',
  },

  virtudes: {
    ask: [
      '¿En quién confías mucho? ¿Por qué?',
      '¿Qué te da esperanza cuando algo sale mal?',
      '¿Quién te enseña a amar con su ejemplo?',
    ],
    do: 'Dibujen juntos los tres símbolos de las virtudes: una cruz para la fe, un ancla para la esperanza y un corazón para la caridad. Al lado de cada uno, el niño dibuja un ejemplo de su vida. Péguenlo junto a la cama para rezar cada mañana: «Señor, creo en ti, espero en ti y te amo».',
    pray: 'Señor, creemos en ti, esperamos en ti y te amamos. Aumenta en nuestra familia la fe, la esperanza y la caridad. Amén.',
  },

  dones: {
    ask: [
      '¿Qué don del Espíritu Santo te gustaría pedir hoy? ¿Para qué?',
      '¿Cuándo sentiste valentía para hacer algo bueno que te costaba?',
      '¿Qué don ves en cada persona de nuestra familia?',
    ],
    do: 'Escriban los siete dones del Espíritu Santo en papelitos y dóblenlos. Cada uno saca uno, piensa en alguien de la familia que lo vive y se lo dice con cariño: «Veo en ti el don de…». Terminen rezando juntos «Ven, Espíritu Santo».',
    pray: 'Ven, Espíritu Santo, llena nuestros corazones con tus siete dones. Danos sabiduría para elegir el bien y fortaleza para vivirlo cada día. Amén.',
  },

  'santos-peru': {
    ask: [
      '¿Cuál de los santos del Perú te gustaría tener como amigo? ¿Por qué?',
      '¿Qué hacían los santos que nosotros también podemos hacer?',
      '¿Conoces a alguien bueno que te ayude a estar más cerca de Dios?',
    ],
    do: 'Elijan juntos un santo del Perú y relean lo que cuenta Palomita sobre él. Luego hagan una tarjeta con su nombre, un dibujo y una frase sobre lo que hizo, y pónganla en el rincón de oración. Durante la semana, intenten imitarlo en algo pequeño: servir como san Martín o rezar como santa Rosa.',
    pray: 'Santa Rosa de Lima, san Martín de Porres, santo Toribio de Mogrovejo, san Juan Macías y san Francisco Solano: rueguen por nuestra familia y por el Perú. Amén.',
  },

  // ═════════════ REZO ═════════════
  oracion: {
    ask: [
      '¿Cuándo te gusta más rezar: en la mañana, en la noche o en otro momento?',
      '¿Qué le contarías hoy a Dios si estuvieras a solas con Él?',
      '¿Te acuerdas de alguna vez que rezaste y te sentiste en paz?',
    ],
    do: 'Armen o renueven el rincón de oración de la casa: una mesita o una repisa con un mantel, una cruz, una imagen de la Virgen, la Biblia y una flor. Decidan juntos un momento fijo para rezar en familia cada día, aunque sean dos minutos, por ejemplo antes de dormir.',
    pray: 'Señor, enséñanos a orar. Que en esta casa nunca falte un momento para hablarte, escucharte y darte gracias. Amén.',
  },

  'padre-nuestro': {
    ask: [
      '¿Qué frase del Padre Nuestro te gusta más? ¿Por qué?',
      '¿Qué significa para ti que Dios sea Padre de todos?',
      '¿Qué es lo que más necesitamos pedirle a Dios como familia?',
    ],
    do: 'Antes de comer, recen el Padre Nuestro muy despacio, con una pausa después de cada frase. En cada pausa, alguien dice con sus palabras lo que esa frase le hace pensar. Por ejemplo, después de «Danos hoy nuestro pan de cada día», alguien puede añadir: «por la comida de hoy y por los que no tienen».',
    pray: 'Padre nuestro, gracias por hacernos tus hijos y hermanos entre nosotros. Danos hoy el pan, el perdón y la paz que necesitamos. Amén.',
  },

  rosario: {
    ask: [
      '¿Qué momento de la vida de Jesús te gusta recordar con María?',
      '¿Por quién te gustaría rezar un Ave María hoy?',
      '¿Has visto a alguien de la familia rezar el Rosario? ¿Qué te llamó la atención?',
    ],
    do: 'Recen juntos un misterio del Rosario: anuncien el misterio y recen un Padre Nuestro, diez avemarías y un Gloria. El niño puede contar las avemarías con los dedos o con un rosario. Antes de empezar, cada uno dice por quién quiere rezar.',
    pray: 'Virgen María, Madre nuestra, te ofrecemos estas avemarías con cariño. Acompaña a nuestra familia y enséñanos a mirar a Jesús con tus ojos. Amén.',
  },
};
