package com.palomita.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;

import androidx.core.content.FileProvider;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * Compartir desde Palomita con las apps del teléfono (WhatsApp, Quick Share, Bluetooth, Drive…).
 * Siempre abre el selector del sistema: la persona elige a quién y por dónde; la app no envía nada por su cuenta.
 * Los archivos se preparan en la caché (carpeta «compartir») y se entregan con un FileProvider.
 */
final class Compartir {
    static final String AUTHORITY = "com.palomita.app.files";

    private Compartir() {}

    static void text(Activity a, String text, String title) {
        Intent send = new Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, text == null ? "" : text);
        if (title != null && !title.isEmpty()) send.putExtra(Intent.EXTRA_SUBJECT, title);
        open(a, Intent.createChooser(send, title == null || title.isEmpty() ? "Compartir" : title));
    }

    /** dataUrl: «data:image/png;base64,…» (por ejemplo, el diploma o el pasaporte). */
    static boolean image(Activity a, String dataUrl, String fileName, String text) {
        try {
            int comma = dataUrl.indexOf(',');
            if (comma < 0) return false;
            byte[] bytes = Base64.decode(dataUrl.substring(comma + 1), Base64.DEFAULT);
            File f = cacheFile(a, safeName(fileName, "palomita.png"));
            try (OutputStream out = new FileOutputStream(f)) { out.write(bytes); }
            Uri uri = FileProvider.getUriForFile(a, AUTHORITY, f);
            Intent send = new Intent(Intent.ACTION_SEND).setType("image/png").putExtra(Intent.EXTRA_STREAM, uri);
            if (text != null && !text.isEmpty()) send.putExtra(Intent.EXTRA_TEXT, text);
            send.setClipData(ClipData.newRawUri("", uri));
            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            open(a, Intent.createChooser(send, "Compartir"));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /** Copia el APK instalado y lo ofrece para pasarlo a otra familia (sin internet: Quick Share, Bluetooth…). */
    static boolean app(Activity a) {
        try {
            File src = new File(a.getApplicationInfo().sourceDir);
            File f = cacheFile(a, "Palomita.apk");
            if (!f.exists() || f.length() != src.length()) {
                try (InputStream in = new FileInputStream(src); OutputStream out = new FileOutputStream(f)) {
                    byte[] buf = new byte[1 << 16];
                    int n;
                    while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
                }
            }
            Uri uri = FileProvider.getUriForFile(a, AUTHORITY, f);
            Intent send = new Intent(Intent.ACTION_SEND).setType("application/vnd.android.package-archive").putExtra(Intent.EXTRA_STREAM, uri);
            send.putExtra(Intent.EXTRA_TEXT, "Palomita: la app para prepararse a la Primera Comunión. Ábrela para instalarla (el teléfono puede pedir permiso para instalar apps de origen desconocido).");
            send.setClipData(ClipData.newRawUri("", uri));
            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            a.runOnUiThread(() -> open(a, Intent.createChooser(send, "Pasar Palomita")));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private static File cacheFile(Activity a, String name) {
        File dir = new File(a.getCacheDir(), "compartir");
        if (!dir.exists()) dir.mkdirs();
        return new File(dir, name);
    }

    private static String safeName(String name, String fallback) {
        if (name == null) return fallback;
        String n = name.replaceAll("[^A-Za-z0-9._-]", "_");
        return n.isEmpty() ? fallback : n;
    }

    private static void open(Activity a, Intent i) {
        try { a.startActivity(i); } catch (ActivityNotFoundException ignored) { }
    }
}
