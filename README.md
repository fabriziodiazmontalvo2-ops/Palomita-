# 🕊️ Palomita

Una app para niños que se preparan para su **Primera Comunión** (7 a 10 años).
El niño cuida a una palomita en 3D —come, se baña, duerme, juega y reza— y, mientras tanto, va conociendo a Jesús:

- **Mascota 3D** que reacciona cuando la tocas, con cinco habitaciones: el nido, la cocina, el baño, el dormitorio y el rincón de oración.
- **11 minijuegos**, cada uno nacido de una parábola o historia de la Biblia. Al terminar, cada juego regala un *mensaje para tu corazón*, una *misión de hoy* y un versículo.
- **Mi Biblia**: 40 historias del Antiguo y del Nuevo Testamento contadas para niños, las 11 parábolas e historias de los juegos, 22 oraciones (con un modo para aprenderlas de memoria), un camino de catequesis de 15 etapas hacia la Primera Comunión y 70 mensajes del día. Todo se puede **escuchar en voz alta**.
- **Tienda** de alimentos de la Biblia y accesorios para la palomita, que se consiguen con las semillas que se ganan jugando, leyendo y rezando.
- **Sin anuncios, sin compras y sin recolección de datos.** El progreso se guarda solo en el dispositivo.

| Juego | Parábola o historia | Cita |
| --- | --- | --- |
| El vuelo de la paloma | La paloma de Noé | Génesis 8, 6-12 |
| Busca a la ovejita | La oveja perdida | Lucas 15, 4-7 |
| El sembrador | El sembrador | Mateo 13, 1-9 |
| Manos que ayudan | El buen samaritano | Lucas 10, 25-37 |
| La casa sobre la roca | La casa sobre la roca | Mateo 7, 24-27 |
| Los talentos | Los talentos | Mateo 25, 14-30 |
| El grano de mostaza | El grano de mostaza | Mateo 13, 31-32 |
| De regreso a casa | El hijo pródigo | Lucas 15, 11-32 |
| La perla escondida | El tesoro y la perla | Mateo 13, 44-46 |
| Panes y peces | La multiplicación de los panes | Juan 6, 1-14 |
| Enciende la luz (trivia) | La luz del mundo | Mateo 5, 14-16 |

## Cómo abrirla

Es una página web estática: no necesita servidor propio ni base de datos.

**Para probarla en la computadora**

```bash
node tools/serve.mjs        # abre http://localhost:8765
```

(Cualquier servidor de archivos estáticos sirve. Abrir `index.html` con doble clic no funciona porque los navegadores bloquean los módulos en `file://`; para eso está la versión de un solo archivo, más abajo.)

**Para publicarla gratis con GitHub Pages**

1. En GitHub: *Settings → Pages → Build and deployment → Deploy from a branch*.
2. Elige la rama y la carpeta `/ (root)` y guarda.
3. En un par de minutos la app queda en `https://<usuario>.github.io/<repositorio>/`.

**Como app de Android (APK)**

El archivo `palomita.apk` se instala directo en el teléfono, sin tienda:

1. Copia `palomita.apk` al teléfono (por WhatsApp, correo, Drive o cable) y tócalo.
2. Si Android avisa que es de un «origen desconocido», permite instalar apps desde esa aplicación (WhatsApp, Archivos, Chrome…) y vuelve a tocarlo.
3. Toca **Instalar**. Palomita queda con su ícono en el teléfono y funciona sin internet.

Para compilar el APK tú mismo hace falta Java 17 o más nuevo y el SDK de Android (`platforms;android-34` y `build-tools;34.0.0`):

```bash
export ANDROID_HOME=/ruta/al/android-sdk
./tools/build-apk.sh        # crea dist/palomita.apk
```

Para que una versión nueva **actualice** la que ya está instalada, debe firmarse con la misma llave
(`palomita-release.jks` y `android/keystore.properties`, que no se suben al repositorio). Guárdalas en un lugar seguro:
sin ellas, para instalar una versión nueva habría que desinstalar la anterior y se perdería el avance guardado.

**Para instalarla en el teléfono como página web**

Abre la dirección publicada en Chrome (Android) o Safari (iPhone) y elige *Agregar a la pantalla de inicio*. Queda con su ícono, a pantalla completa y **funciona sin conexión**.

**Versión de un solo archivo**

```bash
npm install
npm run build               # crea dist/palomita.html
```

`dist/palomita.html` contiene toda la app en un archivo: se abre con doble clic y se puede enviar por correo o mensajería.
El mismo comando actualiza `sw.js`, la lista de archivos que la app guarda para funcionar sin conexión: conviene correrlo después de agregar o quitar archivos.

**Probar que todo sigue funcionando**

```bash
node tools/serve.mjs &
node tools/smoke-test.mjs   # recorre todas las pantallas y abre cada minijuego en un navegador real
```

## Cómo está hecha

- **Gráficos 3D en tiempo real** con WebGL y [Three.js](https://threejs.org/) (incluido en `vendor/`). La palomita, las habitaciones y los accesorios se modelan y animan por código: no hay archivos de modelos ni imágenes externas.
- **Minijuegos** en Canvas 2D sobre un motor propio (`js/games/engine.js`) que pone el marcador, las vidas, el reloj, la pausa, los premios y la tarjeta con el mensaje de la parábola.
- **Sonido** sintetizado con Web Audio y **lectura en voz alta** con la voz del dispositivo.
- JavaScript moderno en módulos, sin compilación obligatoria y sin dependencias en ejecución.

```
index.html              entrada de la app
css/                    estilos (app.css = sistema de diseño)
js/main.js              arranque
js/core/                partida guardada, sonido, voz, interfaz, navegación
js/pet/                 palomita 3D, habitaciones, accesorios
js/screens/             pantallas: mascota, juegos, Biblia, tienda, ajustes, bienvenida
js/games/               motor, kit de dibujo y un archivo por minijuego
js/data/                contenidos: parábolas, historias, oraciones, catequesis, versículos, trivia
tools/                  servidor de pruebas, validador de contenidos y empaquetador
dev/                    páginas de laboratorio para probar piezas sueltas
android/                app de Android que envuelve la app web (voz del teléfono, micrófono, botón atrás)
```

### Editar los contenidos

Todos los textos están en `js/data/` como datos sencillos. Después de cambiarlos:

```bash
npm run validate            # revisa la forma, las longitudes y las citas
```

## Sobre los textos bíblicos y la doctrina

- Las historias y parábolas son **adaptaciones para niños**, escritas para esta app, siempre con su **cita bíblica** para leer el texto completo en la Biblia de la familia o de la catequesis. No se reproduce ninguna traducción con derechos de autor.
- Las oraciones tradicionales van con su texto habitual en español de América Latina.
- Los contenidos siguen la enseñanza de la Iglesia católica y fueron revisados con cuidado, pero **conviene que un sacerdote o catequista los lea** antes de usarlos en un grupo.
- La palomita es una amiga del niño. La paloma nos recuerda al Espíritu Santo y la paz, pero la mascota **no** lo representa.

## Licencias

Código de la app: MIT. Three.js: MIT (`vendor/three/LICENSE`). Tipografías Baloo 2 y Nunito: SIL Open Font License (`vendor/fonts/`).
