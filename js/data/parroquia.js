// Datos de la parroquia de los niños: Parroquia Santo Cura de Ars (Pío Pata, El Tambo – Huancayo).
// Módulo de datos puro: sin imports ni lógica. Las pantallas insertan todo como texto (nunca como HTML).
//
// Para actualizar los horarios de Misa cuando la parroquia los confirme, llena MASS_TIMES:
//   { day: 0–6 (0 = domingo … 6 = sábado), time: 'HH:MM' (24 horas), label: 'Misa de niños' }
// Los papás o catequistas también pueden agregarlos desde la app (pestaña «Horarios de Misa»).

export const PARISH = {
  name: 'Parroquia Santo Cura de Ars',
  place: 'Pío Pata',
  short: 'Santo Cura de Ars',
  pastor: { role: 'Párroco', name: 'Pbro. César Palacios Carhuamaca', icon: '🧔' },
  deacon: { role: 'Diácono', name: 'Julio Díaz Espinoza', icon: '🙋‍♂️' },
  address: 'Av. Los Montes 340 – Pío Pata, El Tambo – Huancayo',
  mapsQuery: 'Parroquia Santo Cura de Ars, Av. Los Montes 340, Pío Pata, El Tambo, Huancayo, Perú',
  phone: '941 489 017',
  phoneDial: '941489017',
  office: [
    { days: 'Lunes a viernes', hours: ['9:00 a. m. – 1:00 p. m.', '3:00 p. m. – 6:00 p. m.'] },
    { days: 'Sábados', hours: ['9:00 a. m. – 1:00 p. m.'] },
  ],
  photos: {
    fachada: { src: 'assets/parroquia/fachada.jpg', alt: 'Fachada de la Parroquia Santo Cura de Ars, en Pío Pata' },
    altar: { src: 'assets/parroquia/altar.jpg', alt: 'Altar de la parroquia con la imagen de Jesús resucitado y el lema «Yo soy la Resurrección y la Vida»' },
  },
  motto: { text: 'Yo soy la Resurrección y la Vida', ref: 'Juan 11, 25' },
};

// Para el niño: qué es una parroquia y quién es su patrono.
export const ABOUT = {
  parish: {
    title: '¿Qué es mi parroquia?',
    text: [
      'La parroquia es la casa de la familia de Dios en tu barrio. Ahí nos reunimos para la Misa, para aprender de Jesús en la catequesis y para ayudarnos unos a otros.',
      'El párroco es el sacerdote que cuida a esta familia, como un buen pastor cuida a sus ovejas. El diácono lo ayuda a servir a todos.',
    ],
  },
  patron: {
    title: '¿Quién es el Santo Cura de Ars?',
    text: [
      'Se llamaba Juan María Vianney y nació en Francia hace más de doscientos años. Le costaba mucho estudiar, pero nunca se rindió y llegó a ser sacerdote.',
      'Lo enviaron a un pueblito llamado Ars. Rezaba muchísimo, enseñaba el catecismo a los niños y pasaba horas y horas perdonando en la Confesión. ¡Gente de todas partes iba a verlo!',
      'Es el patrono de los párrocos. Su fiesta es el 4 de agosto.',
    ],
  },
};

// Horarios de Misa de la parroquia: todavía no confirmados (se llenan cuando la parroquia los dé).
export const MASS_TIMES = [];

// Redes sociales de la parroquia ({ icon, label, url }): todavía no confirmadas.
export const SOCIAL = [];

export const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
