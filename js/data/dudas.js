// «Mis dudas»: preguntas reales de niños de 7 a 10 años sobre la Confesión y la Comunión, con respuestas
// cortas, claras y tranquilizadoras.
// Módulo de datos puro: sin imports, sin lógica y sin HTML en los textos (se insertan como texto y se leen en voz alta).
//
// Las respuestas siguen el Catecismo de la Iglesia Católica, su Compendio y el Código de Derecho Canónico,
// dichas con palabras para niños. La parroquia puede ajustarlas a su manera de hacer las cosas (por ejemplo,
// qué hacer si se cae la hostia o cada cuánto invita a los niños a confesarse). Referencias, para quien revise:
//   por-que-al-sacerdote  Juan 20, 22-23; Catecismo 1441-1442 y 1461
//   secreto-de-confesion  Catecismo 1467; Código 983-984. Repite la idea de protección de js/data/confession.js
//                         (safety): por el secreto, el niño tiene que contarle a un adulto de confianza, fuera de
//                         la confesión, lo que otra persona le hizo.
//   acto-de-contricion    Catecismo 1451-1453; el Ritual de la Penitencia admite decir el arrepentimiento con otras palabras
//   olvide-un-pecado      Catecismo 1456 (lo que se olvida sin querer también queda perdonado)
//   pecado-grave-leve     Catecismo 1857-1863, 1394 y 1458
//   la-penitencia         Catecismo 1459-1460
//   cada-cuanto           Catecismo 1458 y 2042; Código 989
//   jesus-en-la-hostia    Catecismo 1373-1377 (Cristo está entero en cada parte de la hostia)
//   mentirita-despues     Catecismo 1394 y 1863
//   comi-antes-de-misa    Código 919; Catecismo 1387
//   alguien-no-comulga    Catecismo 1861 (el juicio sobre las personas se lo dejamos a Dios); Mateo 7, 1
//
// Forma: DUDAS = [{ id, q, a, link? }]
//   q     la pregunta, como la haría un niño
//   a     la respuesta: 2–4 frases
//   link  { screen, tab?, label }: lleva a la parte de la app que ya lo explica
//           screen 'confesion' → tab 'pasos' | 'examen' | 'practicar' | 'preguntas'
//           screen 'misa'      → tab 'pasos' | 'practicar' | 'comulgar' | 'preguntas'
//           screen 'bible'     → tab 'oraciones'
// Orden: primero las dudas de la Confesión y después las de la Comunión. No cambies los id.

export const DUDAS = [
  // ───────────── La Confesión ─────────────
  {
    id: 'por-que-al-sacerdote',
    q: '¿Por qué le cuento mis pecados al sacerdote, si Dios ya los sabe?',
    a: 'Porque así lo quiso Jesús: después de resucitar, les dio a sus apóstoles el poder de perdonar los pecados en su nombre (Juan 20, 23). En la confesión es Jesús quien te escucha y te perdona por medio del sacerdote. Además, es un regalo oír con tus propios oídos las palabras «Yo te absuelvo de tus pecados». ¡Así sabes de verdad que Jesús te perdonó!',
    link: { screen: 'confesion', tab: 'pasos', label: 'Ver la confesión paso a paso' },
  },
  {
    id: 'secreto-de-confesion',
    q: '¿El sacerdote se va a enojar conmigo o le va a contar a alguien?',
    a: '¡No! El sacerdote te recibe con cariño, como Jesús, y se alegra de que vengas. Jamás puede contarle a nadie lo que le digas, ni a tus papás ni a tu catequista, y después te tratará igual que siempre: es el secreto de confesión, un secreto sagrado. Y si alguien te hizo daño, eso no es pecado tuyo: cuéntaselo a tus papás o a otro adulto de confianza, para que te puedan cuidar.',
  },
  {
    id: 'nervios',
    q: '¿Y si estoy nervioso y me olvido de lo que tengo que decir?',
    a: 'Es normal sentir nervios o un poco de vergüenza, ¡a los grandes también les pasa! Dile al sacerdote que es tu primera confesión y que estás nervioso: él te ayudará con cariño, con algunas preguntas sencillas. Si quieres, lleva tus pecados anotados en un papelito. Jesús no te pide palabras perfectas, sino un corazón sincero.',
    link: { screen: 'confesion', tab: 'practicar', label: 'Practicar mi confesión' },
  },
  {
    id: 'acto-de-contricion',
    q: '¿Puedo confesarme si no me acuerdo del Acto de contrición?',
    a: 'Sí: lo más importante es que te duela de verdad haberte alejado de Dios y que quieras mejorar. Puedes llevarlo escrito, el sacerdote te puede ayudar a rezarlo, o puedes decírselo a Jesús con tus propias palabras: «Jesús, perdóname; te quiero mucho y, con tu ayuda, voy a portarme mejor». Poco a poco lo aprenderás de memoria.',
    link: { screen: 'bible', tab: 'oraciones', label: 'Aprender el Acto de contrición' },
  },
  {
    id: 'olvide-un-pecado',
    q: '¿Y si se me olvida un pecado?',
    a: 'No te preocupes. Si lo olvidaste sin querer, también quedó perdonado, porque Jesús te perdona todo cuando te confiesas con sinceridad. Si después te acuerdas, lo cuentas con sencillez en tu próxima confesión. Para no olvidarte, puedes anotar tus pecados en un papelito y romperlo después de confesarte.',
    link: { screen: 'confesion', tab: 'examen', label: 'Hacer mi examen de conciencia' },
  },
  {
    id: 'pecado-grave-leve',
    q: '¿Qué es un pecado grave y qué es un pecado leve?',
    a: 'Un pecado es grave cuando se juntan tres cosas: es algo muy serio, sabes bien que está mal y aun así lo haces libremente, porque quieres. Si no se juntan las tres, es un pecado leve, también llamado venial; y lo que haces sin querer o sin saber que está mal no es pecado. Los leves se perdonan también al rezar con arrepentimiento, al pedir perdón al comienzo de la Misa y al comulgar con amor. Para un pecado grave está la confesión: te confiesas antes de volver a comulgar.',
  },
  {
    id: 'la-penitencia',
    q: '¿Qué es la penitencia que me da el sacerdote? ¿Y si se me olvida hacerla?',
    a: 'Es una oración o una buena obra que te pide el sacerdote: no es un castigo, sino una manera de dar gracias por el perdón y de empezar a reparar lo que estuvo mal. Hazla pronto, mejor apenas salgas del confesionario. Si se te olvidó, hazla en cuanto te acuerdes; y si ya no recuerdas cuál era, no te angusties: el perdón de Jesús no se pierde, y se lo cuentas al sacerdote la próxima vez.',
  },
  {
    id: 'cada-cuanto',
    q: '¿Cada cuánto tiempo me confieso?',
    a: 'Es muy bueno confesarse con frecuencia, por ejemplo una vez al mes, y siempre que sientas que lo necesitas. La Iglesia pide confesarse por lo menos una vez al año y, si alguna vez cometes un pecado grave, antes de volver a comulgar. Tu catequista y el sacerdote te pueden orientar. ¡Cada confesión es un nuevo abrazo de Jesús!',
  },

  // ───────────── La Comunión ─────────────
  {
    id: 'jesus-en-la-hostia',
    q: '¿Jesús está de verdad en esa hostia tan pequeñita?',
    a: '¡Sí, de verdad! En la Misa, por las palabras de Jesús que dice el sacerdote y por la fuerza del Espíritu Santo, el pan se convierte en el Cuerpo de Jesús. Por fuera sigue pareciendo pan, pero ya no lo es: es Jesús vivo y entero, aunque la hostia sea pequeñita o se parta en pedacitos. Lo creemos porque Él mismo lo dijo: «Esto es mi Cuerpo» (Lucas 22, 19).',
    link: { screen: 'misa', tab: 'pasos', label: 'La Misa paso a paso' },
  },
  {
    id: 'mentirita-despues',
    q: 'Si después de confesarme digo una mentirita, ¿puedo comulgar?',
    a: '¡Sí! Una mentirita es un pecado leve, y los pecados leves no rompen tu amistad con Jesús ni te impiden comulgar. No hace falta que vuelvas a confesarte: pídele perdón en tu corazón, di la verdad si puedes y comulga con amor, porque la Comunión también borra los pecados leves. Jesús no viene solo a los que nunca fallan: viene a ayudarte a ser mejor.',
  },
  {
    id: 'comi-antes-de-misa',
    q: '¿Qué pasa si comí antes de Misa?',
    a: 'Antes de comulgar hacemos el ayuno eucarístico: una hora sin comer ni beber nada, salvo agua o medicinas. Esa hora se cuenta hasta el momento de comulgar, no hasta que empieza la Misa. Si comiste sin querer muy cerca de ese momento, no te angusties: pregúntale al sacerdote y él te dirá qué hacer.',
    link: { screen: 'misa', tab: 'comulgar', label: 'Cómo me acerco a comulgar' },
  },
  {
    id: 'masticar-la-hostia',
    q: '¿Puedo masticar la hostia?',
    a: 'Sí, se puede: Jesús dijo «Tomen y coman», porque quiso ser nuestro alimento (Mateo 26, 26). Lo importante es recibirlo con respeto y con amor, sin jugar: puedes dejar que la hostia se deshaga en tu boca o comerla con calma. Y si se te pega en el paladar, no te asustes: se despega sola, poco a poco.',
  },
  {
    id: 'se-cae-la-hostia',
    q: '¿Qué hago si se me cae la hostia?',
    a: 'No te asustes: le puede pasar a cualquiera. No la recojas jugando ni la pises: quédate donde estás y avísale al sacerdote o al ministro, que la recogerá con respeto, y haz lo que él te indique. Jesús no se enoja contigo: lo que más le importa es tu amor.',
  },
  {
    id: 'alguien-no-comulga',
    q: '¿Por qué a veces alguien no se acerca a comulgar?',
    a: 'Cada persona habla con Dios a su manera y tiene sus razones, que son solo entre ella y Dios. Por ejemplo, los niños que todavía se preparan para su Primera Comunión se quedan en su lugar rezando. No preguntes ni pienses mal de nadie: Jesús nos pide no juzgar a los demás (Mateo 7, 1). Todos podemos hacer la comunión espiritual: decirle a Jesús desde el corazón cuánto deseamos recibirlo.',
    link: { screen: 'bible', tab: 'oraciones', label: 'Rezar la comunión espiritual' },
  },
];
