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
# Sin ese archivo se firma con la llave de depuración del equipo (sirve para probar).
set -euo pipefail
cd "$(dirname "$0")/.."

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
echo "Listo: dist/palomita.apk ($(du -h dist/palomita.apk | cut -f1))"
