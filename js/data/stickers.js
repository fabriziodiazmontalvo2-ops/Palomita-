// Álbum «Mis figuritas»: 48 figuritas en 6 páginas de 8, para coleccionar como en un álbum de verdad.
// Módulo de datos puro (sin imports ni lógica). Las ilustraciones se pintan en js/art/stickers-art.js.
//
// PAGES:    { id, title, sub, icon, c1, c2 }         c1/c2: colores de la página
// STICKERS: { id, n, page, title, caption, rarity, hint, art, img? }
//   rarity  'comun' | 'especial' | 'brillante'  (brillante: brillo holográfico; sale menos en los sobres)
//   hint    emoji que se ve en el espacio vacío del álbum
//   art     { photo: 'altar' | 'fachada', crop: [x, y, ancho, alto], fx }  → recorte artístico de una foto de la parroquia
//           { draw: '<nombre>', ... }                                     → ilustración pintada por código
//   img     (opcional) 'assets/figuritas/<id>.webp': una imagen pintada aparte que reemplaza a la ilustración.
//
// Parroquia Santo Cura de Ars — Pío Pata, El Tambo, Huancayo.
// Los personajes «El padre» y «El diácono» son dibujos genéricos: no retratan a nadie en particular.

export const PAGES = [
  { id: 'resucitado', title: 'Jesús Resucitado', sub: 'El Jesús de nuestra parroquia', icon: '✨', c1: '#fff3d1', c2: '#f5c76a' },
  { id: 'parroquia', title: 'Mi parroquia', sub: 'Santo Cura de Ars · Pío Pata', icon: '⛪', c1: '#ffe3d6', c2: '#f29a7b' },
  { id: 'cura-ars', title: 'El Santo Cura de Ars', sub: 'San Juan María Vianney', icon: '🙏', c1: '#e7e1ff', c2: '#9a86e0' },
  { id: 'pastores', title: 'Nuestros pastores explican', sub: 'Cómo funciona la parroquia', icon: '🧑‍🦳', c1: '#dcf3ff', c2: '#6fb6e6' },
  { id: 'iconos', title: 'Íconos de la parroquia', sub: 'Signos que nos hablan de Dios', icon: '✝️', c1: '#fff0f3', c2: '#e98aa3' },
  { id: 'comunion', title: 'Mi Primera Comunión', sub: 'Mi gran encuentro con Jesús', icon: '🕊️', c1: '#e6f7e6', c2: '#79c27e' },
];

export const STICKERS = [
  // ── 1. Jesús Resucitado ──
  { id: 'resucitado', page: 'resucitado', rarity: 'brillante', hint: '✨', title: 'Jesús Resucitado',
    caption: 'Así recibe Jesús a todos en nuestra parroquia: con los brazos abiertos. Él venció a la muerte y está vivo para siempre.',
    art: { photo: 'altar', crop: [262, 138, 236, 316], fx: 'halo' } },
  { id: 'resurreccion-vida', page: 'resucitado', rarity: 'especial', hint: '📜', title: '«Yo soy la Resurrección y la Vida»',
    caption: 'Estas palabras de Jesús están escritas en la pared de nuestra iglesia. Él se las dijo a su amiga Marta (Juan 11, 25).',
    art: { photo: 'altar', crop: [0, 330, 300, 190], fx: 'words' } },
  { id: 'brazos-abiertos', page: 'resucitado', rarity: 'comun', hint: '🤗', title: 'Brazos abiertos',
    caption: 'Jesús abre sus brazos para abrazarte. Siempre puedes volver a Él, pase lo que pase.',
    art: { draw: 'risen' } },
  { id: 'sepulcro-vacio', page: 'resucitado', rarity: 'comun', hint: '🪨', title: 'El sepulcro vacío',
    caption: 'El domingo muy temprano, las mujeres encontraron la piedra corrida y el sepulcro vacío. ¡Jesús había resucitado!',
    art: { draw: 'tomb' } },
  { id: 'altar-pascua', page: 'resucitado', rarity: 'comun', hint: '🕯️', title: 'El altar de nuestra iglesia',
    caption: 'En este altar, en cada Misa, Jesús se hace presente en el pan y el vino consagrados.',
    art: { photo: 'altar', crop: [292, 492, 236, 262], fx: 'warm' } },
  { id: 'cirio-pascual', page: 'resucitado', rarity: 'especial', hint: '🕯️', title: 'El cirio pascual',
    caption: 'Esta vela grande se enciende en la Vigilia de Pascua. Su luz nos recuerda que Jesús resucitado es la luz del mundo.',
    art: { draw: 'paschal' } },
  { id: 'aleluya', page: 'resucitado', rarity: 'comun', hint: '🌅', title: '¡Aleluya!',
    caption: '«Aleluya» quiere decir «¡Alaben a Dios!». En Pascua lo cantamos con mucha alegría.',
    art: { draw: 'alleluia' } },
  { id: 'nos-espera', page: 'resucitado', rarity: 'comun', hint: '💐', title: 'Jesús nos espera',
    caption: 'Todo está listo y adornado con flores: Jesús nos espera cada domingo en la Misa.',
    art: { photo: 'altar', crop: [118, 470, 410, 430], fx: 'soft' } },

  // ── 2. Mi parroquia ──
  { id: 'iglesia', page: 'parroquia', rarity: 'brillante', hint: '⛪', title: 'Parroquia Santo Cura de Ars',
    caption: 'Nuestra casa de oración en Pío Pata, El Tambo, Huancayo. Aquí la comunidad se reúne para alabar a Dios.',
    art: { photo: 'fachada', crop: [0, 0, 529, 298], fx: 'facade' } },
  { id: 'torre', page: 'parroquia', rarity: 'comun', hint: '✝️', title: 'La torre y su cruz',
    caption: 'La cruz en lo alto de la torre se ve desde lejos: nos dice que ahí está la casa de Dios.',
    art: { photo: 'fachada', crop: [296, 0, 136, 176], fx: 'sky' } },
  { id: 'campana', page: 'parroquia', rarity: 'comun', hint: '🔔', title: 'La campana',
    caption: '¡Tilín, tolón! La campana llama a la comunidad: «¡Vengan, que ya empieza la Misa!».',
    art: { draw: 'bell' } },
  { id: 'puerta', page: 'parroquia', rarity: 'comun', hint: '🚪', title: 'La puerta abierta',
    caption: 'La puerta de la iglesia está abierta para todos. Al entrar, mojamos los dedos en agua bendita y hacemos la señal de la cruz.',
    art: { draw: 'doors' } },
  { id: 'altar', page: 'parroquia', rarity: 'comun', hint: '🕯️', title: 'El altar',
    caption: 'El altar es la mesa del Señor. Lo cubrimos con un mantel blanco y encendemos velas para la Misa.',
    art: { draw: 'altar' } },
  { id: 'sagrario', page: 'parroquia', rarity: 'especial', hint: '🏛️', title: 'El sagrario',
    caption: 'En el sagrario se guarda a Jesús en la Eucaristía. La lamparita encendida nos avisa: «Jesús está aquí».',
    art: { draw: 'tabernacle' } },
  { id: 'pila', page: 'parroquia', rarity: 'comun', hint: '💧', title: 'La pila bautismal',
    caption: 'Aquí nos bautizan. Con el agua y el Espíritu Santo nos volvemos hijos de Dios y entramos en la Iglesia.',
    art: { draw: 'font' } },
  { id: 'confesionario', page: 'parroquia', rarity: 'especial', hint: '🤫', title: 'El confesionario',
    caption: 'Aquí el sacerdote nos escucha y nos da el perdón de Dios. Lo que le contamos es un secreto que nunca dirá.',
    art: { draw: 'confessional' } },

  // ── 3. El Santo Cura de Ars ──
  { id: 'vianney', page: 'cura-ars', rarity: 'brillante', hint: '😇', title: 'San Juan María Vianney',
    caption: 'Es el Santo Cura de Ars, el patrono de nuestra parroquia y de todos los párrocos. Vivió en Francia hace unos 200 años.',
    art: { draw: 'vianney' } },
  { id: 'camino-ars', page: 'cura-ars', rarity: 'comun', hint: '🧭', title: 'El camino a Ars',
    caption: 'Un niño pastor le enseñó el camino al pueblo de Ars. El santo le dijo: «Tú me mostraste el camino a Ars; yo te mostraré el camino al Cielo».',
    art: { draw: 'roadToArs' } },
  { id: 'confesor', page: 'cura-ars', rarity: 'especial', hint: '🕰️', title: 'Horas y horas confesando',
    caption: 'Muchísima gente viajaba para confesarse con él. ¡A veces pasaba más de diez horas al día en el confesionario!',
    art: { draw: 'vianneyConfessing' } },
  { id: 'ante-sagrario', page: 'cura-ars', rarity: 'comun', hint: '🙏', title: 'Rezando ante el sagrario',
    caption: 'Le encantaba quedarse en silencio delante de Jesús. Un campesino de Ars le explicó así su oración: «Yo lo miro y Él me mira». ¡Al santo le encantaba repetirlo!',
    art: { draw: 'vianneyPraying' } },
  { id: 'catecismo-ars', page: 'cura-ars', rarity: 'comun', hint: '📖', title: 'Catequista de los niños',
    caption: 'Cada día enseñaba el catecismo a los niños del pueblo con palabras sencillas y mucho cariño.',
    art: { draw: 'vianneyTeaching' } },
  { id: 'rosario-ars', page: 'cura-ars', rarity: 'comun', hint: '📿', title: 'Amigo de la Virgen María',
    caption: 'Amaba mucho a la Virgen María y rezaba el rosario. Ella nos lleva siempre a Jesús.',
    art: { draw: 'vianneyRosary' } },
  { id: 'patrono', page: 'cura-ars', rarity: 'especial', hint: '🍷', title: 'Patrono de los sacerdotes',
    caption: 'Él decía: «El sacerdocio es el amor del Corazón de Jesús». Recemos por nuestros sacerdotes.',
    art: { draw: 'patron' } },
  { id: 'fiesta-ars', page: 'cura-ars', rarity: 'comun', hint: '🎉', title: 'Su fiesta: 4 de agosto',
    caption: 'Cada 4 de agosto celebramos al Santo Cura de Ars. ¡Es la fiesta de nuestra parroquia!',
    art: { draw: 'feast' } },

  // ── 4. Nuestros pastores explican ──
  { id: 'padre', page: 'pastores', rarity: 'brillante', hint: '👋', title: 'El padre te cuenta: el párroco',
    caption: 'El párroco es el pastor que cuida a la parroquia. Celebra la Misa, perdona en nombre de Jesús y acompaña a todos. Nuestro párroco es el Pbro. César Palacios Carhuamaca.',
    art: { draw: 'pastor', who: 'priest', bubble: '¡Bienvenido!' } },
  { id: 'diacono', page: 'pastores', rarity: 'especial', hint: '📖', title: 'El diácono te cuenta',
    caption: 'El diácono ayuda en el altar, proclama el Evangelio, puede bautizar y sirve a los más necesitados. Nuestro diácono es Julio Díaz Espinoza.',
    art: { draw: 'pastor', who: 'deacon', bubble: '¡Te ayudo!' } },
  { id: 'oficina', page: 'pastores', rarity: 'comun', hint: '🕘', title: 'La oficina parroquial',
    caption: 'El padre te cuenta: la oficina atiende de lunes a viernes de 9:00 a. m. a 1:00 p. m. y de 3:00 p. m. a 6:00 p. m.; los sábados de 9:00 a. m. a 1:00 p. m.',
    art: { draw: 'office' } },
  { id: 'inscripcion', page: 'pastores', rarity: 'comun', hint: '✍️', title: '¿Cómo me inscribo en catequesis?',
    caption: 'El diácono te cuenta: tus papás pueden ir a la oficina parroquial y preguntar cuándo son las inscripciones y qué documentos piden, como tu fe de bautismo.',
    art: { draw: 'pastor', who: 'deacon', bubble: '¡Inscríbete!', prop: 'form' } },
  { id: 'bautizo', page: 'pastores', rarity: 'comun', hint: '👶', title: 'Para un bautizo',
    caption: 'El padre te cuenta: los papás y padrinos se acercan a la oficina parroquial para inscribir al bebé y recibir una charla de preparación.',
    art: { draw: 'pastor', who: 'priest', bubble: '¡Un nuevo hijo de Dios!', prop: 'baby' } },
  { id: 'confesarme', page: 'pastores', rarity: 'especial', hint: '💛', title: '¿Dónde me confieso?',
    caption: 'El padre te cuenta: pregunta en la oficina los horarios de confesión. El sacerdote te escucha con cariño y guarda tu secreto siempre.',
    art: { draw: 'pastor', who: 'priest', bubble: 'Dios te perdona', prop: 'heart' } },
  { id: 'telefono', page: 'pastores', rarity: 'comun', hint: '📞', title: 'Llama a la parroquia',
    caption: 'El diácono te cuenta: con ayuda de tus papás puedes llamar a la parroquia al 941 489 017.',
    art: { draw: 'phone' } },
  { id: 'direccion', page: 'pastores', rarity: 'comun', hint: '📍', title: '¿Dónde estamos?',
    caption: 'El padre te cuenta: estamos en la Av. Los Montes 340, Pío Pata, El Tambo, Huancayo. ¡Te esperamos!',
    art: { draw: 'map' } },

  // ── 5. Íconos de la parroquia ──
  { id: 'caliz', page: 'iconos', rarity: 'brillante', hint: '🍷', title: 'El cáliz y la hostia',
    caption: 'En la Misa, el pan y el vino se convierten en el Cuerpo y la Sangre de Jesús. ¡Es el regalo más grande!',
    art: { draw: 'chalice' } },
  { id: 'espiritu', page: 'iconos', rarity: 'especial', hint: '🕊️', title: 'La paloma del Espíritu Santo',
    caption: 'Cuando Jesús fue bautizado, el Espíritu Santo bajó como una paloma. Él nos llena de amor y de fuerza.',
    art: { draw: 'spirit' } },
  { id: 'biblia', page: 'iconos', rarity: 'comun', hint: '📖', title: 'La Biblia',
    caption: 'Es la Palabra de Dios. En ella Dios nos cuenta cuánto nos ama.',
    art: { draw: 'bible' } },
  { id: 'rosario', page: 'iconos', rarity: 'comun', hint: '📿', title: 'El rosario',
    caption: 'Con el rosario rezamos junto a María y recordamos la vida de Jesús.',
    art: { draw: 'rosary' } },
  { id: 'ihs', page: 'iconos', rarity: 'especial', hint: '☀️', title: 'IHS: el nombre de Jesús',
    caption: 'Son las primeras letras del nombre de Jesús en griego. Lo vemos en las hostias y en los altares.',
    art: { draw: 'ihs' } },
  { id: 'cordero', page: 'iconos', rarity: 'comun', hint: '🐑', title: 'El Cordero de Dios',
    caption: 'Juan el Bautista dijo de Jesús: «Este es el Cordero de Dios, que quita el pecado del mundo».',
    art: { draw: 'lamb' } },
  { id: 'corazon', page: 'iconos', rarity: 'comun', hint: '❤️', title: 'El Sagrado Corazón',
    caption: 'El Corazón de Jesús arde de amor por cada uno de nosotros.',
    art: { draw: 'sacredHeart' } },
  { id: 'maria', page: 'iconos', rarity: 'comun', hint: '👑', title: 'La M de María',
    caption: 'La M con corona y estrellas es el signo de la Virgen María, la mamá de Jesús y nuestra mamá del Cielo.',
    art: { draw: 'marian' } },

  // ── 6. Mi Primera Comunión ──
  { id: 'primera-comunion', page: 'comunion', rarity: 'brillante', hint: '🙌', title: '¡Mi Primera Comunión!',
    caption: '«El Cuerpo de Cristo». «Amén». Ese día recibo a Jesús por primera vez. ¡Mi corazón se vuelve su casa!',
    art: { draw: 'communion' } },
  { id: 'vela', page: 'comunion', rarity: 'comun', hint: '🕯️', title: 'Mi vela encendida',
    caption: 'La vela me recuerda mi bautismo: Jesús es mi luz y quiero brillar para los demás.',
    art: { draw: 'kidCandle' } },
  { id: 'traje', page: 'comunion', rarity: 'comun', hint: '🤍', title: 'Vestidos de blanco',
    caption: 'Vamos de blanco porque el blanco es el color de la fiesta y de un corazón limpio.',
    art: { draw: 'kids' } },
  { id: 'custodia', page: 'comunion', rarity: 'especial', hint: '🌞', title: 'La custodia',
    caption: 'En la custodia se muestra a Jesús en la hostia para adorarlo. ¡Brilla como un sol!',
    art: { draw: 'monstrance' } },
  { id: 'familia', page: 'comunion', rarity: 'comun', hint: '👨‍👩‍👧', title: 'Mi familia me acompaña',
    caption: 'Mis papás, mis padrinos y mi familia rezan por mí y celebran conmigo.',
    art: { draw: 'family' } },
  { id: 'catequista', page: 'comunion', rarity: 'comun', hint: '🧑‍🏫', title: 'Mis catequistas',
    caption: 'Mis catequistas me enseñaron a conocer y a amar a Jesús. ¡Gracias por su paciencia!',
    art: { draw: 'catechist' } },
  { id: 'pan-vida', page: 'comunion', rarity: 'especial', hint: '🌾', title: 'Pan de vida',
    caption: 'Jesús dijo: «Yo soy el pan de vida; el que viene a mí nunca tendrá hambre» (Juan 6, 35).',
    art: { draw: 'wheat' } },
  { id: 'en-mi-corazon', page: 'comunion', rarity: 'comun', hint: '💛', title: 'Jesús vive en mi corazón',
    caption: 'Después de comulgar hablo con Jesús en silencio: le doy gracias y le cuento mis cosas.',
    art: { draw: 'heartHost' } },
].map((s, i) => ({ ...s, n: i + 1 }));

export const RARITY = {
  comun: { label: 'Común', weight: 68 },
  especial: { label: 'Especial', weight: 24 },
  brillante: { label: 'Brillante', weight: 8 },
};

// Premios al completar una página (se entregan una sola vez) y el álbum entero.
export const PAGE_PRIZE = { coins: 60, xp: 20, fe: 5 };
export const ALBUM_PRIZE = { coins: 300, xp: 80, fe: 20, accessory: 'campanita' };
export const PACK_SIZE = 3;
export const PACK_PRICE = 45;        // semillas por sobre en el álbum
export const TRADE_COST = 3;         // repetidas que se entregan por una figurita nueva
export const TRADE_COINS = 15;       // con el álbum completo, 3 repetidas se cambian por semillas
