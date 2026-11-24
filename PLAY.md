# Publicar Palomita en Google Play — lista de pasos

Palomita ya se puede repartir como APK (la catequista lo pasa por WhatsApp o con un cable y la familia lo instala).
Esta lista es para cuando la parroquia quiera publicarla en Google Play. Revisen cada punto en la Play Console:
las reglas de Google cambian y lo que dice la consola es lo que vale.

## 1. Antes de empezar

- [ ] **La llave de firma.** Cada versión debe firmarse con la misma llave (`android/keystore.properties` y el archivo
      `.jks`, que no se suben al repositorio). Sin esa llave no se puede actualizar la app que ya tienen las familias.
      Guárdenla en dos lugares seguros. En Google Play conviene activar *Play App Signing* y subir esta misma llave
      como llave de subida.
- [ ] **Cuenta de desarrollador** de Google Play (pago único). Si es una cuenta personal nueva, Google pide primero
      una **prueba cerrada** con un grupo de testers durante dos semanas antes de publicar para todos (revisen en la
      consola cuántos testers piden hoy). Las familias del grupo de catequesis pueden ser esos testers.
      Una cuenta de organización (la parroquia o el obispado) pide sus propios documentos.
- [ ] **Versión de Android a la que apunta la app (`targetSdk`).** Google Play solo acepta apps que apuntan a una
      versión reciente de Android (desde agosto de 2025, como mínimo Android 15, API 35). Hoy Palomita apunta a la
      API 34, que sirve para repartir el APK directamente pero **no** para Google Play. Para subirla:
      1. instalar en el SDK `platforms;android-35` (o la que pida la consola) y `build-tools` de esa versión;
      2. en `android/app/build.gradle` subir `compileSdk` y `targetSdk`;
      3. desde Android 15 la app se dibuja de borde a borde: probar en un teléfono que la barra de arriba y los
         botones de abajo no tapen la app (la app ya deja espacio con `--safe-t` y `--safe-b` en `css/app.css`;
         si hiciera falta, pasar el alto de las barras del sistema desde `MainActivity.java`);
      4. volver a probar el micrófono, los avisos y compartir.

## 2. Compilar

```bash
npm install
npm test                       # contenidos y calendario
node tools/serve.mjs 8765 &    # en otra terminal
node tools/smoke-test.mjs      # recorre todas las pantallas y juegos
ANDROID_HOME=/ruta/al/sdk bash tools/build-apk.sh
```

- [ ] Subir `versionCode` (debe crecer en cada versión) y `versionName` en `android/app/build.gradle`, y la versión
      de `package.json` (la app la muestra en Ajustes).
- [ ] El script termina con «Firma correcta (la misma llave de siempre)». Si no, **no** repartan ese APK.
- [ ] Para Google Play se sube un **App Bundle** (`.aab`): `cd android && gradle bundleRelease`
      → `android/app/build/outputs/bundle/release/app-release.aab`.

## 3. Ficha de la tienda

- [ ] **Nombre:** «Palomita: mi Primera Comunión» (máximo 30 caracteres).
- [ ] **Descripción corta** (máximo 80): «Cuida a tu palomita, juega y prepárate con alegría para tu Primera Comunión».
- [ ] **Descripción completa:** qué es (mascota, juegos con parábolas, Biblia para niños, catequesis, Confesión y Misa
      paso a paso, oraciones con voz, calendario de la fe, avisos de la parroquia), que no tiene publicidad ni compras,
      que funciona sin internet y que es de la Parroquia Santo Cura de Ars.
- [ ] **Ícono** 512 × 512: `assets/icon-512.png`.
- [ ] **Gráfico destacado** 1024 × 500 (se puede hacer con la palomita y el cielo de la app).
- [ ] **Capturas** de teléfono (mínimo 2; mejor 6): la casa de la palomita, un juego, una historia de la Biblia,
      «Mi camino», la Misa paso a paso y «Lo sé de memoria». `tools/smoke-test.mjs` deja capturas en `smoke-shots/`.
- [ ] **Categoría:** Educación. **Correo y teléfono de contacto** de la parroquia.

## 4. Familias y niños

- [ ] **Público objetivo:** niños de 6 a 12 años (y también adultos: papás y catequistas). Al elegir edades menores
      de 13, la app entra en el **programa de Familias** de Google Play y debe cumplir sus reglas. Palomita ya las
      cumple: no tiene publicidad, ni compras, ni enlaces que salgan de la app, ni inicio de sesión.
- [ ] **Política de privacidad:** publicar `docs/privacidad.html` (por ejemplo con GitHub Pages) y poner su dirección
      en la consola y en la ficha.
- [ ] **Seguridad de los datos** (formulario de la consola). Respuestas, según lo que hace la app:
  - ¿Recopila datos? **No.** Todo queda en el teléfono; nada se envía a un servidor del desarrollador.
  - ¿Comparte datos con terceros? **No.**
  - El micrófono: el audio se procesa en el teléfono, en el momento, y no se guarda ni se envía (no cuenta como
    dato recopilado). Explicarlo igual en la descripción.
  - El tablón de avisos (opcional, lo activa un grande): solo **descarga** un archivo de la parroquia; no envía datos.
  - Los datos se pueden borrar: Ajustes → «Empezar de nuevo», o borrando los datos de la app.
- [ ] **Clasificación de contenido** (cuestionario IARC): sin violencia, sin miedo, sin lenguaje adulto, sin compras,
      sin interacción entre usuarios, sin ubicación. Debería salir «Para todos».
- [ ] **Anuncios:** marcar que la app **no** contiene anuncios.

## 5. Permisos que hay que explicar

| Permiso | Para qué | Notas |
| --- | --- | --- |
| `RECORD_AUDIO` | La palomita repite lo que dice el niño | Viene apagado; lo enciende un grande con su clave |
| `POST_NOTIFICATIONS` | Avisos de Misa, catequesis y eventos | Android 13 o más nuevo lo pregunta |
| `USE_EXACT_ALARM` / `SCHEDULE_EXACT_ALARM` | Que el aviso suene a la hora exacta | **Ojo:** Google Play reserva `USE_EXACT_ALARM` para apps cuya función principal es de alarma o calendario. Si la consola lo rechaza, cambiar a alarmas aproximadas (`setAndAllowWhileIdle`): un aviso de Misa que llega unos minutos antes o después sirve igual. |
| `RECEIVE_BOOT_COMPLETED` | Volver a programar los avisos al reiniciar el teléfono | — |
| `INTERNET` | Solo el tablón de avisos de la parroquia | Todo lo demás está bloqueado en `MainActivity.java` |

## 6. Antes de publicar para todos

- [ ] Probar en **un teléfono de verdad** (mejor uno sencillo): avisos y alarmas (con el teléfono bloqueado y
      después de reiniciarlo), micrófono, compartir el diploma y la copia de seguridad, la voz de la narradora
      y la de la palomita, y que se actualice encima de la versión anterior **sin perder el avance**.
- [ ] Prueba cerrada con las familias de un grupo de catequesis, durante las dos semanas que pide Google.
- [ ] Revisar con la parroquia los textos marcados para revisar (ver el final del README).
- [ ] Contar las novedades en `js/data/novedades.js` (la app las muestra al abrir la versión nueva).
