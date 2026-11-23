// «La Misa paso a paso»: guía de Palomita para niños de 7 a 10 años.
// Módulo de datos puro: sin imports, sin lógica y sin HTML en los textos.
// Las respuestas del pueblo van con el texto del Misal Romano en español usado en el Perú y en
// América Latina (forma «ustedes»). Cuando una oración es muy larga para un globo de diálogo,
// se corta con «…» y la oración completa está en js/data/prayers.js.
// En «priest» va lo que dice quien preside o guía ese momento (el sacerdote, el diácono o el lector);
// en «people», lo que respondemos todos.
//
// Forma: MASS = {
//   intro,
//   parts: [{ id, title, emoji, group, posture, text, dialogues: [{ priest, people }], tip? }],
//     group: inicio | palabra | eucaristia | comunion | despedida
//     posture: 'de pie' | 'sentados' | 'de rodillas'
//   communion: { title, steps: [{ emoji, text }] },
//   quiz: [{ q, options: [3], answer, explain }],
// }

export const MASS = {
  intro: 'La Misa es la fiesta más grande de la familia de Dios: Jesús nos reúne, nos habla en su Palabra y se nos da como alimento. Aquí la vas a recorrer paso a paso: qué pasa en cada momento, cuándo estamos de pie, sentados o de rodillas, y qué respondemos todos juntos. ¡Así la vivirás con el corazón bien despierto!',

  parts: [
    // ───────────── Ritos iniciales: Jesús nos reúne ─────────────
    {
      id: 'entrada',
      title: 'Canto de entrada y Señal de la Cruz',
      emoji: '🎶',
      group: 'inicio',
      posture: 'de pie',
      text: 'Cuando el sacerdote entra, nos ponemos de pie y cantamos con alegría: ¡Jesús nos reúne como una gran familia! Al llegar, el sacerdote besa el altar, que es la mesa del Señor. Luego todos hacemos juntos la Señal de la Cruz.',
      dialogues: [
        { priest: 'En el nombre del Padre, y del Hijo, y del Espíritu Santo.', people: 'Amén.' },
      ],
      tip: 'Llega unos minutos antes. Al entrar, haz una genuflexión mirando al sagrario para saludar a Jesús y prepara tu corazón en silencio.',
    },
    {
      id: 'saludo',
      title: 'El saludo',
      emoji: '👋',
      group: 'inicio',
      posture: 'de pie',
      text: 'El sacerdote abre los brazos y nos saluda en nombre de Jesús. Nosotros le respondemos deseándole lo mismo: que el Señor esté también con él. ¡Es una manera de decir que Jesús está aquí, en medio de nosotros!',
      dialogues: [
        { priest: 'El Señor esté con ustedes.', people: 'Y con tu espíritu.' },
      ],
      tip: 'A veces el sacerdote usa un saludo más largo, como «La gracia de nuestro Señor Jesucristo… estén con todos ustedes». La respuesta es la misma.',
    },
    {
      id: 'perdon',
      title: 'Pedimos perdón',
      emoji: '💜',
      group: 'inicio',
      posture: 'de pie',
      text: 'Antes de escuchar a Dios y de acercarnos a su mesa, reconocemos con sencillez que a veces no hemos amado bien. Hacemos un momento de silencio y rezamos todos juntos el «Yo confieso». Dios, que es un Padre bueno, nos recibe siempre con un abrazo.',
      dialogues: [
        { priest: 'Hermanos: para celebrar dignamente estos sagrados misterios, reconozcamos nuestros pecados.', people: 'Yo confieso ante Dios todopoderoso y ante ustedes, hermanos, que he pecado mucho de pensamiento, palabra, obra y omisión. Por mi culpa, por mi culpa, por mi gran culpa…' },
        { priest: 'Dios todopoderoso tenga misericordia de nosotros, perdone nuestros pecados y nos lleve a la vida eterna.', people: 'Amén.' },
      ],
      tip: 'Al decir «por mi culpa» nos damos un golpecito en el pecho. El «Yo confieso» completo está en la sección de oraciones.',
    },
    {
      id: 'senor-ten-piedad',
      title: 'Señor, ten piedad',
      emoji: '🙏',
      group: 'inicio',
      posture: 'de pie',
      text: 'Después le pedimos a Jesús su misericordia, rezando o cantando. «Ten piedad» quiere decir: «Mírame con cariño y ayúdame». Es una súplica tan antigua que a veces se canta en griego: «Kyrie, eleison».',
      dialogues: [
        { priest: 'Señor, ten piedad.', people: 'Señor, ten piedad.' },
        { priest: 'Cristo, ten piedad.', people: 'Cristo, ten piedad.' },
        { priest: 'Señor, ten piedad.', people: 'Señor, ten piedad.' },
      ],
    },
    {
      id: 'gloria',
      title: 'Gloria',
      emoji: '✨',
      group: 'inicio',
      posture: 'de pie',
      text: 'Es un himno de alegría para alabar a Dios. Empieza con el canto de los ángeles en la noche de Navidad (Lucas 2, 14): «Gloria a Dios en el cielo, y en la tierra paz a los hombres que ama el Señor». Lo cantamos o lo rezamos todos juntos.',
      dialogues: [],
      tip: 'Se canta los domingos y en las fiestas grandes, pero no en los domingos de Adviento ni de Cuaresma. ¡Así lo cantamos con más ganas en Navidad y en Pascua!',
    },
    {
      id: 'colecta',
      title: 'Oración colecta',
      emoji: '🕯️',
      group: 'inicio',
      posture: 'de pie',
      text: 'El sacerdote dice «Oremos» y hacemos un momento de silencio para poner en el corazón lo que queremos pedirle a Dios. Luego él reúne las oraciones de todos en una sola y se la presenta al Padre. Por eso se llama «colecta»: ¡recoge las oraciones de todos!',
      dialogues: [
        { priest: '…Por nuestro Señor Jesucristo, tu Hijo, que vive y reina contigo en la unidad del Espíritu Santo y es Dios por los siglos de los siglos.', people: 'Amén.' },
      ],
      tip: 'Al responder «Amén» hacemos nuestra la oración del sacerdote. ¡Es como firmarla con nuestro nombre!',
    },

    // ───────────── Liturgia de la Palabra: Dios nos habla ─────────────
    {
      id: 'primera-lectura',
      title: 'Primera lectura',
      emoji: '📜',
      group: 'palabra',
      posture: 'sentados',
      text: 'Nos sentamos para escuchar a Dios, que nos habla en la Biblia. Casi siempre es un pasaje del Antiguo Testamento, que cuenta lo que Dios hizo con su pueblo antes de que naciera Jesús. Escucha con atención: ¡Dios tiene algo que decirte hoy!',
      dialogues: [
        { priest: 'Palabra de Dios.', people: 'Te alabamos, Señor.' },
      ],
      tip: 'Las lecturas no siempre las lee el sacerdote: muchas veces las lee un lector de la comunidad. ¡Igual respondemos todos juntos!',
    },
    {
      id: 'salmo',
      title: 'Salmo responsorial',
      emoji: '🎵',
      group: 'palabra',
      posture: 'sentados',
      text: 'Respondemos a Dios con un salmo, una oración cantada del libro de los Salmos. El salmista canta o lee una frase cortita, la respuesta, y todos la repetimos después de cada estrofa. Cambia cada domingo, ¡así que escúchala bien la primera vez!',
      dialogues: [],
    },
    {
      id: 'segunda-lectura',
      title: 'Segunda lectura',
      emoji: '✉️',
      group: 'palabra',
      posture: 'sentados',
      text: 'Luego escuchamos otra lectura del Nuevo Testamento, casi siempre de las cartas que los apóstoles, como san Pablo, escribieron a las primeras comunidades cristianas. ¡Son cartas que también fueron escritas para nosotros!',
      dialogues: [
        { priest: 'Palabra de Dios.', people: 'Te alabamos, Señor.' },
      ],
      tip: 'La segunda lectura se lee los domingos y en las fiestas grandes. En las Misas de entre semana hay una sola lectura antes del Evangelio.',
    },
    {
      id: 'aleluya',
      title: '¡Aleluya!',
      emoji: '🎺',
      group: 'palabra',
      posture: 'de pie',
      text: 'Nos ponemos de pie y cantamos «¡Aleluya!», que quiere decir «¡Alaben al Señor!». Es un grito de fiesta para recibir a Jesús, que nos va a hablar en el Evangelio.',
      dialogues: [],
      tip: 'En Cuaresma no se canta el Aleluya: en su lugar se dice otra aclamación, como «Honor y gloria a ti, Señor Jesús».',
    },
    {
      id: 'evangelio',
      title: 'El Evangelio',
      emoji: '📖',
      group: 'palabra',
      posture: 'de pie',
      text: 'Es el momento más importante de la Liturgia de la Palabra: ¡habla Jesús! El sacerdote o el diácono lee lo que Jesús hizo y enseñó, según uno de los cuatro evangelistas: Mateo, Marcos, Lucas o Juan. Al oír su nombre, nos hacemos tres crucecitas con el pulgar: en la frente, en la boca y en el pecho.',
      dialogues: [
        { priest: 'El Señor esté con ustedes.', people: 'Y con tu espíritu.' },
        { priest: 'Lectura del santo Evangelio según san Lucas.', people: 'Gloria a ti, Señor.' },
        { priest: 'Palabra del Señor.', people: 'Gloria a ti, Señor Jesús.' },
      ],
      tip: 'Las tres crucecitas quieren decir: «Jesús, que tu Palabra esté en mi mente, en mis labios y en mi corazón».',
    },
    {
      id: 'homilia',
      title: 'La homilía',
      emoji: '💬',
      group: 'palabra',
      posture: 'sentados',
      text: 'Nos sentamos y el sacerdote nos explica las lecturas, sobre todo el Evangelio, para que entendamos lo que Dios nos dice hoy y cómo vivirlo en la casa, en el colegio y con los amigos. Trata de descubrir una idea para llevártela a tu vida esta semana.',
      dialogues: [],
      tip: 'Un reto para la casa: al volver de Misa, cuéntale a tu familia una cosa que dijo el sacerdote en la homilía.',
    },
    {
      id: 'credo',
      title: 'El Credo',
      emoji: '✝️',
      group: 'palabra',
      posture: 'de pie',
      text: 'De pie, decimos todos juntos lo que creemos. A veces se reza el Credo largo, que empieza «Creo en un solo Dios…», y otras veces el Credo de los Apóstoles, el que aprendiste en las oraciones. Cuando decimos que el Hijo de Dios se hizo hombre en el seno de la Virgen María, inclinamos la cabeza.',
      dialogues: [],
      tip: 'El Credo se reza los domingos y en las fiestas grandes. ¡Es la fe de la Iglesia, la misma en todo el mundo!',
    },
    {
      id: 'oracion-de-los-fieles',
      title: 'Oración de los fieles',
      emoji: '🌍',
      group: 'palabra',
      posture: 'de pie',
      text: 'Ahora rezamos por las necesidades de todo el mundo: por la Iglesia y el Papa, por quienes gobiernan, por los enfermos, por los que sufren y por nuestra comunidad. Un lector dice cada petición y todos respondemos juntos.',
      dialogues: [
        { priest: 'Roguemos al Señor.', people: 'Te rogamos, óyenos.' },
      ],
      tip: 'A veces la respuesta es otra, como «Escúchanos, Señor, te rogamos». Escúchala la primera vez y repítela con todos. En silencio, pide también por los tuyos.',
    },

    // ───────────── Liturgia de la Eucaristía ─────────────
    {
      id: 'presentacion-de-los-dones',
      title: 'Presentación de los dones',
      emoji: '🍇',
      group: 'eucaristia',
      posture: 'sentados',
      text: 'Empieza la Liturgia de la Eucaristía. Se llevan al altar el pan y el vino, y muchas veces también la colecta para la parroquia y los pobres. El sacerdote pone unas gotitas de agua en el vino y bendice a Dios por estos regalos. Tú puedes ofrecerle tu semana: tus alegrías, tus esfuerzos y tus penas.',
      dialogues: [
        { priest: 'Bendito seas, Señor, Dios del universo, por este pan, fruto de la tierra y del trabajo del hombre, que recibimos de tu generosidad y ahora te presentamos; él será para nosotros pan de vida.', people: 'Bendito seas por siempre, Señor.' },
        { priest: 'Bendito seas, Señor, Dios del universo, por este vino, fruto de la vid y del trabajo del hombre, que recibimos de tu generosidad y ahora te presentamos; él será para nosotros bebida de salvación.', people: 'Bendito seas por siempre, Señor.' },
      ],
      tip: 'Si en ese momento se está cantando, el sacerdote dice estas oraciones en voz baja y no se responde: ¡cantamos con todos!',
    },
    {
      id: 'oren-hermanos',
      title: 'Oren, hermanos',
      emoji: '🎁',
      group: 'eucaristia',
      posture: 'de pie',
      text: 'Nos ponemos de pie. El sacerdote nos invita a rezar para que Dios reciba con agrado lo que le ofrecemos: el pan, el vino y también nuestra vida. Después dice la oración sobre las ofrendas y respondemos «Amén».',
      dialogues: [
        { priest: 'Oren, hermanos, para que este sacrificio, mío y de ustedes, sea agradable a Dios, Padre todopoderoso.', people: 'El Señor reciba de tus manos este sacrificio, para alabanza y gloria de su nombre, para nuestro bien y el de toda su santa Iglesia.' },
        { priest: '…Por Jesucristo, nuestro Señor.', people: 'Amén.' },
      ],
    },
    {
      id: 'prefacio',
      title: 'El prefacio',
      emoji: '❤️',
      group: 'eucaristia',
      posture: 'de pie',
      text: 'Empieza la Plegaria Eucarística, el corazón de la Misa. El sacerdote nos invita a levantar el corazón hacia Dios y a darle gracias. Luego reza el prefacio: una alabanza que recuerda las maravillas que Dios ha hecho por nosotros.',
      dialogues: [
        { priest: 'El Señor esté con ustedes.', people: 'Y con tu espíritu.' },
        { priest: 'Levantemos el corazón.', people: 'Lo tenemos levantado hacia el Señor.' },
        { priest: 'Demos gracias al Señor, nuestro Dios.', people: 'Es justo y necesario.' },
      ],
      tip: '«Lo tenemos levantado hacia el Señor» quiere decir: «Aquí está mi corazón, Señor, todo para ti».',
    },
    {
      id: 'santo',
      title: 'Santo',
      emoji: '👼',
      group: 'eucaristia',
      posture: 'de pie',
      text: 'Al terminar el prefacio, nos unimos a los ángeles y a los santos del cielo y cantamos: «Santo, Santo, Santo es el Señor, Dios del universo. Llenos están el cielo y la tierra de tu gloria. Hosanna en el cielo. Bendito el que viene en nombre del Señor. Hosanna en el cielo».',
      dialogues: [],
      tip: 'Al terminar el Santo nos arrodillamos, porque se acerca el momento más grande de la Misa.',
    },
    {
      id: 'consagracion',
      title: 'La consagración',
      emoji: '🍞',
      group: 'eucaristia',
      posture: 'de rodillas',
      text: 'El sacerdote pide al Padre que envíe el Espíritu Santo sobre el pan y el vino, y repite las palabras de Jesús en la Última Cena: «Tomen y coman todos de él, porque esto es mi Cuerpo, que será entregado por ustedes». Lo mismo hace con el cáliz. ¡El pan y el vino se convierten en el Cuerpo y la Sangre de Jesús!',
      dialogues: [],
      tip: 'Cuando el sacerdote levanta la Hostia y después el cáliz, míralos con amor y dile a Jesús en silencio: «¡Señor mío y Dios mío!».',
    },
    {
      id: 'aclamacion',
      title: 'El misterio de la fe',
      emoji: '🌅',
      group: 'eucaristia',
      posture: 'de pie',
      text: 'Después de la consagración, el sacerdote nos invita a proclamar nuestra fe en Jesús, que murió y resucitó por nosotros y que volverá al final de los tiempos. ¡Es una respuesta llena de alegría y de esperanza!',
      dialogues: [
        { priest: 'Éste es el Sacramento de nuestra fe.', people: 'Anunciamos tu muerte, proclamamos tu resurrección. ¡Ven, Señor Jesús!' },
      ],
      tip: 'Hay otras respuestas que también se pueden cantar. Y en algunas parroquias seguimos de rodillas hasta el gran «Amén»: haz lo que hace tu comunidad.',
    },
    {
      id: 'gran-amen',
      title: 'El gran Amén',
      emoji: '🙌',
      group: 'eucaristia',
      posture: 'de pie',
      text: 'La Plegaria Eucarística termina cuando el sacerdote eleva el Cuerpo y la Sangre de Jesús y alaba al Padre. Todos respondemos «Amén», que significa «¡Sí, así es, lo creemos!». Es el Amén más importante de la Misa: ¡dilo o cántalo con fuerza!',
      dialogues: [
        { priest: 'Por Cristo, con él y en él, a ti, Dios Padre omnipotente, en la unidad del Espíritu Santo, todo honor y toda gloria por los siglos de los siglos.', people: 'Amén.' },
      ],
    },

    // ───────────── Rito de la Comunión ─────────────
    {
      id: 'padre-nuestro',
      title: 'El Padre Nuestro',
      emoji: '🤲',
      group: 'comunion',
      posture: 'de pie',
      text: 'Empieza el rito de la Comunión. Todos juntos, como hijos de un mismo Padre, rezamos la oración que Jesús nos enseñó. Después el sacerdote pide a Dios que nos libre del mal y nos dé la paz, y respondemos con una alabanza.',
      dialogues: [
        { priest: 'Fieles a la recomendación del Salvador y siguiendo su divina enseñanza, nos atrevemos a decir:', people: 'Padre nuestro, que estás en el cielo, santificado sea tu Nombre; venga a nosotros tu reino…' },
        { priest: '…mientras esperamos la gloriosa venida de nuestro Salvador Jesucristo.', people: 'Tuyo es el reino, tuyo el poder y la gloria, por siempre, Señor.' },
      ],
      tip: 'En la Misa rezamos el Padre Nuestro completo, pero sin decir «Amén» al final, porque el sacerdote continúa con otra oración.',
    },
    {
      id: 'paz',
      title: 'La paz',
      emoji: '🤝',
      group: 'comunion',
      posture: 'de pie',
      text: 'El sacerdote pide a Jesús la paz y la unidad para toda la Iglesia, y nos desea su paz. Luego nos damos la paz con quienes están cerca, con un saludo sencillo y una sonrisa. ¡Antes de recibir a Jesús, queremos estar en paz con todos!',
      dialogues: [
        { priest: 'La paz del Señor esté siempre con ustedes.', people: 'Y con tu espíritu.' },
      ],
      tip: 'Basta con saludar a los que tienes cerca, sin salir de tu lugar. Puedes decir, por ejemplo: «La paz esté contigo».',
    },
    {
      id: 'cordero-de-dios',
      title: 'Cordero de Dios',
      emoji: '🐑',
      group: 'comunion',
      posture: 'de pie',
      text: 'Mientras el sacerdote parte la Hostia consagrada, cantamos o rezamos: «Cordero de Dios, que quitas el pecado del mundo, ten piedad de nosotros». Lo decimos tres veces, y la última terminamos con «danos la paz». Así llamó Juan el Bautista a Jesús (Juan 1, 29).',
      dialogues: [],
      tip: 'Jesús parte el pan para compartirlo, como en la Última Cena. Todos comemos del mismo Pan y formamos una sola familia.',
    },
    {
      id: 'dichosos-los-invitados',
      title: 'Dichosos los invitados',
      emoji: '🏠',
      group: 'comunion',
      posture: 'de rodillas',
      text: 'El sacerdote nos muestra el Cuerpo de Jesús y nos invita a su mesa. Respondemos con palabras parecidas a las de un centurión que confió de verdad en Jesús (Mateo 8, 8). Tu «casa» es tu corazón: ¡Jesús quiere entrar en él!',
      dialogues: [
        { priest: 'Éste es el Cordero de Dios, que quita el pecado del mundo. Dichosos los invitados a la cena del Señor.', people: 'Señor, no soy digno de que entres en mi casa, pero una palabra tuya bastará para sanarme.' },
      ],
      tip: 'En muchas parroquias nos arrodillamos al terminar el «Cordero de Dios»; en otras nos quedamos de pie. Haz lo que hace tu comunidad.',
    },
    {
      id: 'comunion',
      title: 'La Comunión',
      emoji: '🌟',
      group: 'comunion',
      posture: 'de pie',
      text: '¡Jesús viene a ti! Nos acercamos en fila, con calma y con las manos juntas, mientras todos cantamos. El sacerdote o el ministro te muestra la Hostia y te dice «El Cuerpo de Cristo». Respondes «Amén», que quiere decir: «¡Sí, creo que eres Tú, Jesús!».',
      dialogues: [
        { priest: 'El Cuerpo de Cristo.', people: 'Amén.' },
      ],
      tip: '¿Aún no haces tu Primera Comunión? Reza en tu lugar la Comunión espiritual. Y si algún día te ofrecen el cáliz, te dirán «La Sangre de Cristo» y respondes «Amén».',
    },
    {
      id: 'accion-de-gracias',
      title: 'Acción de gracias',
      emoji: '💛',
      group: 'comunion',
      posture: 'de rodillas',
      text: 'De vuelta en tu lugar, cierra los ojos y habla con Jesús, que está en tu corazón. Dale gracias, cuéntale tus cosas y pídele por las personas que quieres. Es un momento de silencio muy especial: ¡no lo cambies por nada!',
      dialogues: [],
      tip: 'Puedes rezar de rodillas o sentado, como se acostumbre en tu parroquia. La oración «Alma de Cristo» es muy linda para este momento.',
    },
    {
      id: 'oracion-despues-de-la-comunion',
      title: 'Oración después de la Comunión',
      emoji: '🕯️',
      group: 'comunion',
      posture: 'de pie',
      text: 'Nos ponemos de pie. El sacerdote dice «Oremos» y le pide a Dios que la Eucaristía que hemos recibido dé mucho fruto en nuestra vida. Respondemos «Amén». A veces, después, se dan los avisos de la parroquia.',
      dialogues: [
        { priest: '…Por Jesucristo, nuestro Señor.', people: 'Amén.' },
      ],
    },

    // ───────────── Rito de conclusión: Jesús nos envía ─────────────
    {
      id: 'bendicion',
      title: 'La bendición',
      emoji: '✋',
      group: 'despedida',
      posture: 'de pie',
      text: 'Antes de irnos, el sacerdote nos bendice en nombre de la Santísima Trinidad. Inclinamos un poquito la cabeza para recibir la bendición y hacemos la Señal de la Cruz.',
      dialogues: [
        { priest: 'El Señor esté con ustedes.', people: 'Y con tu espíritu.' },
        { priest: 'La bendición de Dios todopoderoso, Padre, Hijo y Espíritu Santo, descienda sobre ustedes.', people: 'Amén.' },
      ],
    },
    {
      id: 'despedida',
      title: 'Pueden ir en paz',
      emoji: '🚪',
      group: 'despedida',
      posture: 'de pie',
      text: 'La Misa termina, ¡pero la misión comienza! El sacerdote nos envía a llevar el amor de Jesús a la casa, al colegio y a los amigos. Respondemos con alegría y, mientras cantamos, el sacerdote besa el altar y se retira.',
      dialogues: [
        { priest: 'Pueden ir en paz.', people: 'Demos gracias a Dios.' },
      ],
      tip: 'A veces el sacerdote usa otras palabras para despedirnos, pero respondemos igual. Al salir, despídete de Jesús en el sagrario con una genuflexión.',
    },
  ],

  // ───────────── Cómo comulgar con respeto ─────────────
  communion: {
    title: 'Cómo me acerco a comulgar',
    steps: [
      { emoji: '⏳', text: 'Desde una hora antes de comulgar no como ni bebo nada, salvo agua o medicinas si las necesito. Es el ayuno eucarístico: mi manera de decirle a Jesús que tengo hambre de Él.' },
      { emoji: '🤍', text: 'Llego con el corazón en paz con Dios. Por eso me confieso antes de mi Primera Comunión, y vuelvo a confesarme cada vez que me alejo de su amor.' },
      { emoji: '🙏', text: 'Cuando llega el momento, camino en la fila con calma y con las manos juntas, sin empujar ni conversar, pensando en Jesús, que me espera.' },
      { emoji: '🙇', text: 'Al llegar mi turno, antes de recibirlo, hago una pequeña inclinación de cabeza: es mi saludo de respeto y de amor a Jesús.' },
      { emoji: '🗣️', text: 'Me muestran la Hostia y me dicen «El Cuerpo de Cristo». Respondo bien claro: «Amén». Quiere decir: «¡Sí, creo que eres Tú, Jesús!».' },
      { emoji: '👄', text: 'Si comulgo en la boca, abro la boca y saco un poquito la lengua para que me pongan allí la Hostia.' },
      { emoji: '🙌', text: 'Si comulgo en la mano, donde está permitido, pongo una mano sobre la otra, como un trono para Jesús. Con la mano de abajo tomo la Hostia y la llevo a mi boca allí mismo, antes de volver a mi lugar.' },
      { emoji: '💛', text: 'Vuelvo a mi lugar en silencio, me arrodillo o me siento, cierro los ojos y le doy gracias a Jesús, que ahora vive en mi corazón.' },
    ],
  },

  // ───────────── ¿Qué aprendí? ─────────────
  quiz: [
    {
      q: '¿Qué respondemos cuando el sacerdote dice «El Señor esté con ustedes»?',
      options: ['«Te alabamos, Señor»', '«Y con tu espíritu»', '«Bendito seas por siempre, Señor»'],
      answer: 1,
      explain: 'Respondemos «Y con tu espíritu»: le deseamos al sacerdote que el Señor esté también con él. ¡Lo decimos varias veces en cada Misa!',
    },
    {
      q: 'Al terminar el Evangelio, el sacerdote dice «Palabra del Señor». ¿Qué respondemos?',
      options: ['«Gloria a ti, Señor Jesús»', '«Y también contigo»', '«Hasta el próximo domingo»'],
      answer: 0,
      explain: 'Respondemos «Gloria a ti, Señor Jesús», porque en el Evangelio nos acaba de hablar Él mismo.',
    },
    {
      q: '¿Qué pasa con el pan y el vino en la consagración?',
      options: ['Solo nos recuerdan a Jesús', 'Se guardan para la fiesta', 'Se convierten en el Cuerpo y la Sangre de Jesús'],
      answer: 2,
      explain: 'Por las palabras de Jesús y la fuerza del Espíritu Santo, el pan y el vino se convierten en su Cuerpo y su Sangre. ¡Jesús está realmente presente!',
    },
    {
      q: '¿Cómo estamos durante la consagración?',
      options: ['Sentados y conversando', 'De rodillas, adorando a Jesús', 'Caminando por la iglesia'],
      answer: 1,
      explain: 'Nos arrodillamos porque Jesús se hace presente en el altar. Es el momento más grande de la Misa: lo adoramos con amor y en silencio.',
    },
    {
      q: 'El sacerdote dice «Levantemos el corazón». ¿Qué respondemos?',
      options: ['«Lo tenemos levantado hacia el Señor»', '«Te rogamos, óyenos»', '«Gloria a ti, Señor»'],
      answer: 0,
      explain: 'Respondemos «Lo tenemos levantado hacia el Señor»: es como decirle a Dios que nuestro corazón es todo para Él.',
    },
    {
      q: '¿Por qué nos hacemos tres crucecitas antes del Evangelio?',
      options: ['Para espantar el sueño', 'Porque ya se termina la Misa', 'Para llevar su Palabra en la mente, la boca y el corazón'],
      answer: 2,
      explain: 'Nos signamos la frente, la boca y el pecho para pedirle a Jesús que su Palabra llene lo que pensamos, lo que decimos y lo que amamos.',
    },
    {
      q: 'Si recibes a Jesús en la mano, ¿cuándo lo llevas a tu boca?',
      options: ['Cuando llegas a tu casa', 'Al terminar la Misa', 'Allí mismo, antes de volver a tu lugar'],
      answer: 2,
      explain: 'Comulgas allí mismo, frente al sacerdote o al ministro. Jesús se te da como alimento: ¡lo recibes enseguida y con mucho cariño!',
    },
    {
      q: '¿Qué decimos cuando el sacerdote nos muestra la Hostia antes de la Comunión?',
      options: ['«Y con tu espíritu»', '«Señor, no soy digno de que entres en mi casa…»', '«Te alabamos, Señor»'],
      answer: 1,
      explain: 'Decimos «Señor, no soy digno de que entres en mi casa, pero una palabra tuya bastará para sanarme». ¡Jesús quiere entrar en tu corazón!',
    },
  ],
};
