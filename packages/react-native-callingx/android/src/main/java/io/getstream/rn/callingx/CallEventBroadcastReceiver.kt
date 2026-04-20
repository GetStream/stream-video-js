package io.getstream.rn.callingx

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Bundle

class CallEventBroadcastReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        val extras = intent.extras ?: Bundle()

        CallEventBus.publish(CallEvent(action = action, extras = extras))
    }
}

