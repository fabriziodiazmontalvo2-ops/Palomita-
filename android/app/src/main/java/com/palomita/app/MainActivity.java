package com.palomita.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

import org.json.JSONArray;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Locale;

/**
 * Palomita para Android: muestra la app web (empaquetada en assets/) a pantalla completa.
 * Todo funciona sin internet. Además:
 *  - pone la voz del teléfono (TextToSpeech) a disposición de la app para leer historias y oraciones;
 *  - pide el micrófono solo cuando el niño toca «Háblame»;
 *  - el botón «atrás» del teléfono navega dentro de la app antes de cerrarla;
 *  - programa los avisos de Misa y catequesis (notificaciones, ver Avisos.java);
 *  - abre el marcador del teléfono o el mapa solo cuando la app lo pide (tarjeta «Mi parroquia»);
 *  - comparte textos, imágenes o la propia app con el selector del teléfono (Compartir.java);
 *  - guarda y abre copias de seguridad con el selector de archivos de Android;
 *  - la pantalla se queda encendida solo mientras la app lo pide (narración, juegos), no siempre;
 *  - la única conexión a internet posible es al tablón de avisos de la parroquia, y solo si un grande lo activa.
 */
public class MainActivity extends Activity {
    // Los archivos se sirven desde una dirección https local: así el guardado (localStorage) y el micrófono
    // funcionan igual que en un navegador, sin salir nunca del teléfono.
    private static final String LOCAL_HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + LOCAL_HOST + "/assets/index.html";

    private static String mimeOf(String path) {
        String p = path.toLowerCase(Locale.ROOT);
        if (p.endsWith(".js") || p.endsWith(".mjs")) return "text/javascript";
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".ogg")) return "audio/ogg";
        if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".webp")) return "image/webp";
        if (p.endsWith(".woff2")) return "font/woff2";
        return null;
    }
    private static final int REQ_MIC = 7;
    private static final int REQ_NOTIF = 8;
    private static final int REQ_SAVE = 21;
    private static final int REQ_OPEN = 22;
    private static final String PREFS_RED = "palomita_red";

    private WebView web;
    private TextToSpeech tts;
    private volatile boolean ttsReady = false;
    private PermissionRequest pendingMic;
    private String pendingSave;
    private volatile String openedText;
    private volatile String feedHost = "";

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        feedHost = getSharedPreferences(PREFS_RED, MODE_PRIVATE).getString("host", "");

        // La app va por módulos (main.js y c/*.js se piden cuando hacen falta): cada archivo sale con su tipo
        // exacto, porque el WebView no ejecuta un módulo que llegue sin «text/javascript».
        final WebViewAssetLoader.AssetsPathHandler assets = new WebViewAssetLoader.AssetsPathHandler(this);
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", path -> {
                    WebResourceResponse r = assets.handle(path);
                    String mime = mimeOf(path);
                    if (r != null && mime != null) {
                        r.setMimeType(mime);
                        if (mime.startsWith("text/") || mime.endsWith("json")) r.setEncoding("utf-8");
                    }
                    return r;
                })
                .build();

        web = new WebView(this);
        web.setBackgroundColor(0xFF7CC8F5);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setTextZoom(100);
        s.setSupportZoom(false);

        web.setWebViewClient(new WebViewClientCompat() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                String host = u.getHost();
                if (LOCAL_HOST.equals(host)) return loader.shouldInterceptRequest(u);
                // Lo único que puede salir a internet: el tablón de avisos de la parroquia, si un grande lo activó.
                if (host != null && !feedHost.isEmpty() && host.equalsIgnoreCase(feedHost) && "https".equals(u.getScheme())
                        && "GET".equalsIgnoreCase(request.getMethod())) return null;
                return blocked();
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                // Nada sale de la app: no se abren enlaces externos.
                Uri u = request.getUrl();
                return !LOCAL_HOST.equals(u.getHost());
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    boolean wantsMic = false;
                    for (String r : request.getResources()) {
                        if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(r)) wantsMic = true;
                    }
                    if (!wantsMic) { request.deny(); return; }
                    if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                        request.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
                    } else {
                        // Si quedó una petición anterior sin responder, se cierra antes de guardar la nueva.
                        if (pendingMic != null && pendingMic != request) { try { pendingMic.deny(); } catch (Exception ignored) { } }
                        pendingMic = request;
                        requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_MIC);
                    }
                });
            }
        });
        web.addJavascriptInterface(new Bridge(), "PalomitaAndroid");
        setContentView(web);

        tts = new TextToSpeech(this, status -> {
            if (status != TextToSpeech.SUCCESS) return;
            Locale[] prefs = {new Locale("es", "MX"), new Locale("es", "US"), new Locale("es", "419"), new Locale("es", "ES"), new Locale("es")};
            for (Locale l : prefs) {
                int r = tts.setLanguage(l);
                if (r != TextToSpeech.LANG_MISSING_DATA && r != TextToSpeech.LANG_NOT_SUPPORTED) { ttsReady = true; break; }
            }
            // Entre las voces en español del teléfono, la más natural que no necesite internet.
            try {
                android.speech.tts.Voice best = null;
                int bestScore = -1;
                for (android.speech.tts.Voice v : tts.getVoices()) {
                    Locale l = v.getLocale();
                    if (l == null || !"es".equals(l.getLanguage())) continue;
                    if (v.getFeatures() != null && v.getFeatures().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)) continue;
                    int sc = v.getQuality() / 100 + (v.isNetworkConnectionRequired() ? 0 : 3);
                    String c = l.getCountry();
                    if ("MX".equals(c) || "US".equals(c) || "PE".equals(c) || "419".equals(c) || "CO".equals(c)) sc += 2;
                    if (v.getName() != null && v.getName().toLowerCase(Locale.ROOT).contains("female")) sc += 1;
                    if (sc > bestScore) { bestScore = sc; best = v; }
                }
                if (best != null) { tts.setVoice(best); ttsReady = true; }
            } catch (Exception ignored) { /* algunos motores no listan voces */ }
            tts.setSpeechRate(0.9f);
            tts.setPitch(1.05f);
            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override public void onStart(String id) {
                    // id = "u<índice>" y termina en "L" si es la última pieza: avisa a la app qué renglón empieza.
                    final String n = id.replace("u", "").replace("L", "");
                    runOnUiThread(() -> { if (web != null) web.evaluateJavascript("window.__palomitaTtsLine && window.__palomitaTtsLine(" + n + ")", null); });
                }
                @Override public void onDone(String id) { if (id.endsWith("L")) notifyDone(); }
                @Override public void onError(String id) { notifyDone(); }
            });
        });

        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl(START_URL);
    }

    private static WebResourceResponse blocked() {
        WebResourceResponse r = new WebResourceResponse("text/plain", "utf-8", new ByteArrayInputStream(new byte[0]));
        r.setStatusCodeAndReasonPhrase(403, "Bloqueado");
        r.setResponseHeaders(new HashMap<>());
        return r;
    }

    private void notifyDone() {
        runOnUiThread(() -> { if (web != null) web.evaluateJavascript("window.__palomitaTtsDone && window.__palomitaTtsDone()", null); });
    }

    private void js(String code) {
        runOnUiThread(() -> { if (web != null) web.evaluateJavascript(code, null); });
    }

    /** Lo que la app web puede pedirle al teléfono. */
    private class Bridge {
        @JavascriptInterface
        public boolean ttsAvailable() { return ttsReady; }

        @JavascriptInterface
        public void speak(String json) {
            if (!ttsReady) { notifyDone(); return; }
            try {
                JSONArray parts = new JSONArray(json);
                tts.stop();
                for (int i = 0; i < parts.length(); i++) {
                    String id = "u" + i + (i == parts.length() - 1 ? "L" : "");
                    tts.speak(parts.getString(i), i == 0 ? TextToSpeech.QUEUE_FLUSH : TextToSpeech.QUEUE_ADD, null, id);
                }
                if (parts.length() == 0) notifyDone();
            } catch (Exception e) {
                notifyDone();
            }
        }

        @JavascriptInterface
        public void stopSpeaking() { if (tts != null) tts.stop(); }

        /** Lista de avisos [{ id, atMillis, expiresMillis?, title, text }]: reemplaza los programados. */
        @JavascriptInterface
        public void scheduleReminders(String json) { Avisos.schedule(MainActivity.this, json); }

        @JavascriptInterface
        public boolean notificationsAllowed() { return Avisos.allowed(MainActivity.this); }

        /** Pide permiso para notificaciones (Android 13+). Responde con window.__palomitaNotif(true|false). */
        @JavascriptInterface
        public void askNotifications() {
            runOnUiThread(() -> {
                Avisos.ensureChannel(MainActivity.this);
                if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIF);
                } else {
                    notifyPermission(Avisos.allowed(MainActivity.this));
                }
            });
        }

        /** Abre el marcador con el número escrito (no llama solo: la persona decide). */
        @JavascriptInterface
        public void openDial(String number) {
            String digits = number == null ? "" : number.replaceAll("[^0-9+]", "");
            if (digits.isEmpty()) return;
            openOutside(new Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + digits)));
        }

        /** Abre la app de mapas con la dirección (o el navegador si no hay app de mapas). */
        @JavascriptInterface
        public void openMap(String query) {
            String q = query == null ? "" : query;
            runOnUiThread(() -> {
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("geo:0,0?q=" + Uri.encode(q))));
                } catch (ActivityNotFoundException e) {
                    openOutside(new Intent(Intent.ACTION_VIEW, Uri.parse("https://www.google.com/maps/search/?api=1&query=" + Uri.encode(q))));
                }
            });
        }

        /** Mantener la pantalla encendida solo mientras hace falta (narración, juego, oración guiada). */
        @JavascriptInterface
        public void keepAwake(boolean on) {
            runOnUiThread(() -> {
                if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            });
        }

        /** Versión instalada, por ejemplo «1.3 (4)». */
        @JavascriptInterface
        public String appVersion() {
            try {
                PackageInfo pi = getPackageManager().getPackageInfo(getPackageName(), 0);
                long code = Build.VERSION.SDK_INT >= 28 ? pi.getLongVersionCode() : pi.versionCode;
                return pi.versionName + " (" + code + ")";
            } catch (Exception e) { return ""; }
        }

        /** Tamaño de letra elegido en el teléfono (1 = normal), para proponerlo dentro de la app. */
        @JavascriptInterface
        public float fontScale() { return getResources().getConfiguration().fontScale; }

        @JavascriptInterface
        public void shareText(String text, String title) { runOnUiThread(() -> Compartir.text(MainActivity.this, text, title)); }

        @JavascriptInterface
        public boolean shareImage(String dataUrl, String fileName, String text) { return Compartir.image(MainActivity.this, dataUrl, fileName, text); }

        /** Prepara una copia del APK y abre el selector (Quick Share, Bluetooth, WhatsApp…). Responde con window.__palomitaShared(ok). */
        @JavascriptInterface
        public void shareApp() {
            new Thread(() -> {
                boolean ok = Compartir.app(MainActivity.this);
                js("window.__palomitaShared && window.__palomitaShared(" + ok + ")");
            }).start();
        }

        /** Guarda un archivo donde la persona elija (Descargas, Drive…). Responde con window.__palomitaFile('save', ok). */
        @JavascriptInterface
        public void saveFile(String name, String mime, String content) {
            runOnUiThread(() -> {
                pendingSave = content == null ? "" : content;
                Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE)
                        .setType(mime == null || mime.isEmpty() ? "application/json" : mime)
                        .putExtra(Intent.EXTRA_TITLE, name == null || name.isEmpty() ? "palomita.json" : name);
                try { startActivityForResult(i, REQ_SAVE); }
                catch (ActivityNotFoundException e) { pendingSave = null; js("window.__palomitaFile && window.__palomitaFile('save', false)"); }
            });
        }

        /** Abre un archivo elegido por la persona. Responde con window.__palomitaFile('open', ok) y el texto se pide con takeOpenedFile(). */
        @JavascriptInterface
        public void openFile() {
            runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*")
                        .putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"application/json", "text/plain", "application/octet-stream"});
                try { startActivityForResult(i, REQ_OPEN); }
                catch (ActivityNotFoundException e) { js("window.__palomitaFile && window.__palomitaFile('open', false)"); }
            });
        }

        @JavascriptInterface
        public String takeOpenedFile() { String t = openedText; openedText = null; return t == null ? "" : t; }

        /** Tablón de avisos de la parroquia por internet: el único sitio al que la app puede conectarse (vacío = ninguno). */
        @JavascriptInterface
        public void setFeedHost(String host) {
            String h = host == null ? "" : host.trim().toLowerCase(Locale.ROOT);
            if (!h.matches("^[a-z0-9.-]{0,253}$")) h = "";
            feedHost = h;
            getSharedPreferences(PREFS_RED, MODE_PRIVATE).edit().putString("host", h).apply();
        }
    }

    private void openOutside(Intent i) {
        runOnUiThread(() -> {
            try { startActivity(i); } catch (ActivityNotFoundException ignored) { }
        });
    }

    private void notifyPermission(boolean granted) {
        js("window.__palomitaNotif && window.__palomitaNotif(" + granted + ")");
    }

    @Override
    @SuppressWarnings("deprecation")
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        final Uri uri = data == null ? null : data.getData();
        if (requestCode == REQ_SAVE) {
            final String content = pendingSave;
            pendingSave = null;
            if (resultCode != RESULT_OK || uri == null || content == null) { js("window.__palomitaFile && window.__palomitaFile('save', false)"); return; }
            new Thread(() -> {
                boolean ok = false;
                try (OutputStream out = getContentResolver().openOutputStream(uri, "wt")) {
                    if (out != null) { out.write(content.getBytes(StandardCharsets.UTF_8)); ok = true; }
                } catch (Exception ignored) { }
                js("window.__palomitaFile && window.__palomitaFile('save', " + ok + ")");
            }).start();
        } else if (requestCode == REQ_OPEN) {
            if (resultCode != RESULT_OK || uri == null) { js("window.__palomitaFile && window.__palomitaFile('open', false)"); return; }
            new Thread(() -> {
                boolean ok = false;
                try (InputStream in = getContentResolver().openInputStream(uri)) {
                    if (in != null) {
                        ByteArrayOutputStream buf = new ByteArrayOutputStream();
                        byte[] b = new byte[1 << 16];
                        int n, total = 0;
                        while ((n = in.read(b)) > 0) { total += n; if (total > 40 * 1024 * 1024) throw new Exception("muy grande"); buf.write(b, 0, n); }
                        openedText = buf.toString("UTF-8");
                        ok = true;
                    }
                } catch (Exception ignored) { }
                js("window.__palomitaFile && window.__palomitaFile('open', " + ok + ")");
            }).start();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(requestCode, permissions, results);
        if (requestCode == REQ_NOTIF) {
            boolean ok = results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED;
            if (ok) Avisos.reschedule(this);
            notifyPermission(ok);
            return;
        }
        if (requestCode != REQ_MIC || pendingMic == null) return;
        if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) {
            pendingMic.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
        } else {
            pendingMic.deny();
        }
        pendingMic = null;
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (web == null) { super.onBackPressed(); return; }
        web.evaluateJavascript("(window.__palomita && window.__palomita.androidBack) ? window.__palomita.androidBack() : false", value -> {
            if (!"true".equals(value)) finish();
        });
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        if (web != null) web.saveState(out);
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (tts != null) tts.stop();
        if (web != null) web.onPause();
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.onResume();
    }

    @Override
    protected void onDestroy() {
        if (tts != null) { tts.stop(); tts.shutdown(); }
        if (web != null) { web.destroy(); web = null; }
        super.onDestroy();
    }
}
