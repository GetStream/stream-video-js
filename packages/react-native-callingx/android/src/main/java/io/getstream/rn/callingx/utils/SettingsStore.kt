package io.getstream.rn.callingx.utils

import android.content.Context
import androidx.core.content.edit

object SettingsStore {

    private const val PREF_NAME = "io.getstream.rn.callingx.settings"
    private const val KEY_REJECT_CALL_WHEN_BUSY = "reject_call_when_busy"

    fun setShouldRejectCallWhenBusy(context: Context, shouldReject: Boolean) {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        prefs.edit { putBoolean(KEY_REJECT_CALL_WHEN_BUSY, shouldReject) }
    }

    fun shouldRejectCallWhenBusy(context: Context): Boolean {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        return prefs.getBoolean(KEY_REJECT_CALL_WHEN_BUSY, false)
    }
}
