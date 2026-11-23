package com.palomita.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Llega la hora de un aviso: muestra la notificación. */
public class AvisoReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent intent) {
        if (intent == null || !Avisos.ACTION.equals(intent.getAction())) return;
        String id = intent.getStringExtra("id");
        String title = intent.getStringExtra("title");
        String text = intent.getStringExtra("text");
        if (id == null) id = "aviso";
        Avisos.post(ctx, id, title == null ? "Palomita" : title, text == null ? "" : text);
    }
}
