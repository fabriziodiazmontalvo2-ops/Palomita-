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
        // Llegó tarde (la Misa o la catequesis ya empezó, o ya es el día): ese aviso ya no sirve.
        long expires = intent.getLongExtra("expires", 0);
        if (expires > 0 && System.currentTimeMillis() >= expires) return;
        Avisos.post(ctx, id, title == null ? "Palomita" : title, text == null ? "" : text);
    }
}
