package com.palomita.app;

import android.Manifest;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Avisos de la parroquia (Misas y catequesis) como notificaciones del teléfono.
 * La app web calcula la lista de avisos de las próximas semanas ({ id, atMillis, title, text }) y la manda aquí;
 * se guarda para volver a programarla cuando el teléfono se reinicia. Las alarmas son inexactas a propósito
 * (no hace falta el permiso de alarmas exactas): el aviso puede llegar unos minutos antes o después.
 */
final class Avisos {
    static final String CHANNEL = "avisos";
    static final String ACTION = "com.palomita.app.AVISO";
    private static final String PREFS = "palomita_avisos";
    private static final String KEY_JSON = "json";
    private static final String KEY_IDS = "ids";

    private Avisos() {}

    /** Reemplaza todos los avisos programados por los de esta lista. */
    static synchronized void schedule(Context ctx, String json) {
        Context app = ctx.getApplicationContext();
        SharedPreferences prefs = app.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        cancelAll(app, prefs.getString(KEY_IDS, "[]"));
        JSONArray ids = new JSONArray();
        try {
            JSONArray list = new JSONArray(json == null ? "[]" : json);
            long now = System.currentTimeMillis();
            AlarmManager am = (AlarmManager) app.getSystemService(Context.ALARM_SERVICE);
            for (int i = 0; i < list.length(); i++) {
                JSONObject o = list.getJSONObject(i);
                String id = o.optString("id", "");
                long at = o.optLong("atMillis", 0);
                if (id.isEmpty() || at <= now) continue;
                PendingIntent pi = alarmIntent(app, id, o.optString("title", "Palomita"), o.optString("text", ""));
                if (am != null) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
                ids.put(id);
            }
            prefs.edit().putString(KEY_JSON, list.toString()).putString(KEY_IDS, ids.toString()).apply();
        } catch (Exception e) {
            prefs.edit().putString(KEY_JSON, "[]").putString(KEY_IDS, ids.toString()).apply();
        }
    }

    /** Después de reiniciar el teléfono o de actualizar la app: vuelve a programar lo guardado. */
    static void reschedule(Context ctx) {
        SharedPreferences prefs = ctx.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        schedule(ctx, prefs.getString(KEY_JSON, "[]"));
    }

    private static void cancelAll(Context app, String idsJson) {
        AlarmManager am = (AlarmManager) app.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        try {
            JSONArray ids = new JSONArray(idsJson);
            for (int i = 0; i < ids.length(); i++) {
                PendingIntent pi = alarmIntent(app, ids.getString(i), "", "");
                am.cancel(pi);
                pi.cancel();
            }
        } catch (Exception ignored) { }
    }

    private static PendingIntent alarmIntent(Context app, String id, String title, String text) {
        Intent i = new Intent(app, AvisoReceiver.class)
                .setAction(ACTION)
                .setData(Uri.parse("palomita://aviso/" + Uri.encode(id)))
                .putExtra("id", id)
                .putExtra("title", title)
                .putExtra("text", text);
        return PendingIntent.getBroadcast(app, id.hashCode(), i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static boolean allowed(Context ctx) {
        if (Build.VERSION.SDK_INT >= 33
                && ctx.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return false;
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        return nm != null && nm.areNotificationsEnabled();
    }

    static void ensureChannel(Context ctx) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null || nm.getNotificationChannel(CHANNEL) != null) return;
        NotificationChannel ch = new NotificationChannel(CHANNEL, "Misa y catequesis", NotificationManager.IMPORTANCE_DEFAULT);
        ch.setDescription("Te recuerda cuándo hay Misa y cuándo tienes catequesis.");
        nm.createNotificationChannel(ch);
    }

    @SuppressWarnings("deprecation")
    static void post(Context ctx, String id, String title, String text) {
        if (!allowed(ctx)) return;
        ensureChannel(ctx);
        Intent open = new Intent(ctx, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(ctx, 1, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(ctx, CHANNEL) : new Notification.Builder(ctx);
        b.setSmallIcon(R.drawable.ic_stat_palomita)
                .setColor(0xFF7556C9)
                .setContentTitle(title)
                .setContentText(text)
                .setStyle(new Notification.BigTextStyle().bigText(text))
                .setContentIntent(pi)
                .setAutoCancel(true)
                .setWhen(System.currentTimeMillis())
                .setShowWhen(true);
        if (Build.VERSION.SDK_INT < 26) b.setPriority(Notification.PRIORITY_DEFAULT).setDefaults(Notification.DEFAULT_ALL);
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.notify(id.hashCode(), b.build());
    }
}
