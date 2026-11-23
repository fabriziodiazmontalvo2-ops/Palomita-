#!/usr/bin/env bash
# Compila el APK de Android de Palomita → dist/palomita.apk
#
# Requisitos: Node.js, Java 17 o más nuevo, y el SDK de Android (variable ANDROID_HOME) con
#   "platforms;android-34" y "build-tools;34.0.0" (se instalan con sdkmanager, aceptando su licencia).
#
# Firma: para poder ACTUALIZAR la app ya instalada, cada versión debe firmarse con la misma llave.
# Crea android/keystore.properties (no se sube al repositorio) con:
#   storeFile=palomita-release.jks
#   storePassword=…
#   keyAlias=palomita
#   keyPassword=…
# ¡Guarda la llave (.jks) y ese archivo en dos lugares seguros! Sin la misma llave, ninguna versión nueva se
# puede instalar encima de la anterior y las familias perderían el avance de los niños.
# Sin keystore.properties el script se detiene; para una prueba local: PALOMITA_FIRMA_DEPURACION=1 bash tools/build-apk.sh
# Al terminar comprueba que el APK quedó firmado con la llave de siempre (huella en android/firma-sha256.txt).
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f android/keystore.properties ] && [ "${PALOMITA_FIRMA_DEPURACION:-}" != "1" ]; then
  echo "Falta android/keystore.properties (la llave para firmar). Sin ella el APK no actualiza el de las familias."
  echo "Para una prueba local: PALOMITA_FIRMA_DEPURACION=1 bash tools/build-apk.sh"
  exit 1
fi

: "${ANDROID_HOME:?Falta ANDROID_HOME (carpeta del SDK de Android)}"
echo "sdk.dir=$ANDROID_HOME" > android/local.properties

[ -d node_modules/esbuild ] || npm install --no-audit --no-fund
node tools/build.mjs
mkdir -p android/app/src/main/assets
cp dist/palomita.html android/app/src/main/assets/index.html
# Fotos de la parroquia, figuritas y la voz grabada de la narradora (la app las pide por ruta relativa).
rm -rf android/app/src/main/assets/assets
mkdir -p android/app/src/main/assets/assets
for d in parroquia figuritas voz; do
  [ -d "assets/$d" ] || continue
  mkdir -p "android/app/src/main/assets/assets/$d"
  find "assets/$d" -maxdepth 1 -type f ! -name '.*' -exec cp {} "android/app/src/main/assets/assets/$d/" \;
done

for d in mdpi:48 hdpi:72 xhdpi:96 xxhdpi:144 xxxhdpi:192; do
  [ -f "android/app/src/main/res/mipmap-${d%%:*}/ic_launcher.png" ] || { echo "Faltan los íconos de Android (mipmap-${d%%:*})"; exit 1; }
done

GRADLE="${GRADLE:-gradle}"
( cd android && "$GRADLE" --no-daemon -q assembleRelease )
cp android/app/build/outputs/apk/release/app-release.apk dist/palomita.apk

# ¿Quedó firmado con la llave de siempre?
APKSIGNER="$(ls -d "$ANDROID_HOME"/build-tools/*/ 2>/dev/null | sort -V | tail -1)apksigner"
if [ -x "$APKSIGNER" ] && [ -f android/firma-sha256.txt ]; then
  got="$("$APKSIGNER" verify --print-certs dist/palomita.apk 2>/dev/null | grep -i 'certificate SHA-256 digest' | head -1 | awk '{print $NF}')"
  want="$(tr -d ' \n' < android/firma-sha256.txt)"
  if [ "$got" != "$want" ]; then
    echo "ATENCIÓN: el APK NO está firmado con la llave de Palomita (huella $got)."
    echo "No lo repartas a las familias: no se instalaría encima de la versión que ya tienen."
    [ "${PALOMITA_FIRMA_DEPURACION:-}" = "1" ] || exit 1
  else
    echo "Firma correcta (la misma llave de siempre)."
  fi
fi
echo "Listo: dist/palomita.apk ($(du -h dist/palomita.apk | cut -f1))"
