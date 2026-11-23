package com.palomita.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
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

import java.util.Locale;

/**
 * Palomita para Android: muestra la app web (empaquetada en assets/index.html) a pantalla completa.
 * Todo funciona sin internet. Además:
 *  - pone la voz del teléfono (TextToSpeech) a disposición de la app para leer historias y oraciones;
 *  - pide el micrófono solo cuando el niño toca «Háblame»;
 *  - el botón «atrás» del teléfono navega dentro de la app antes de cerrarla;
 *  - programa los avisos de Misa y catequesis (notificaciones, ver Avisos.java);
 *  - abre el marcador del teléfono o el mapa solo cuando la app lo pide (tarjeta «Mi parroquia»).
 */
public class MainActivity extends Activity {
    // Los archivos se sirven desde una dirección https local: así el guardado (localStorage) y el micrófono
    // funcionan igual que en un navegador, sin salir nunca del teléfono.
    private static final String START_URL = "https://appassets.androidplatform.net/assets/index.html";
    private static final int REQ_MIC = 7;
    private static final int REQ_NOTIF = 8;

    private WebView web;
    private TextToSpeech tts;
    private volatile boolean ttsReady = false;
    private PermissionRequest pendingMic;

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
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
                return loader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                // Nada sale de la app: no se abren enlaces externos.
                Uri u = request.getUrl();
                return !"appassets.androidplatform.net".equals(u.getHost());
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

    private void notifyDone() {
        runOnUiThread(() -> { if (web != null) web.evaluateJavascript("window.__palomitaTtsDone && window.__palomitaTtsDone()", null); });
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

        /** Lista de avisos [{ id, atMillis, title, text }]: reemplaza los programados. */
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
    }

    private void openOutside(Intent i) {
        runOnUiThread(() -> {
            try { startActivity(i); } catch (ActivityNotFoundException ignored) { }
        });
    }

    private void notifyPermission(boolean granted) {
        runOnUiThread(() -> { if (web != null) web.evaluateJavascript("window.__palomitaNotif && window.__palomitaNotif(" + granted + ")", null); });
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
