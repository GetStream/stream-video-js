package io.getstream.rn.callingx.utils

import android.content.Context
import androidx.core.content.edit

object SettingsStore {

    private const val PREF_NAME = "io.getstream.rn.callingx.settings"
    private const val KEY_REJECT_CALL_WHEN_BUSY = "reject_call_when_busy"
    private const val KEY_OPTIMISTIC_ACCEPTING_TEXT = "optimistic_accepting_text"
    private const val KEY_OPTIMISTIC_REJECTING_TEXT = "optimistic_rejecting_text"

    private const val DEFAULT_OPTIMISTIC_ACCEPTING_TEXT = "Connecting..."
    private const val DEFAULT_OPTIMISTIC_REJECTING_TEXT = "Declining..."

    fun setShouldRejectCallWhenBusy(context: Context, shouldReject: Boolean) {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        prefs.edit { putBoolean(KEY_REJECT_CALL_WHEN_BUSY, shouldReject) }
    }

    fun shouldRejectCallWhenBusy(context: Context): Boolean {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        return prefs.getBoolean(KEY_REJECT_CALL_WHEN_BUSY, false)
    }

    fun setOptimisticTexts(
        context: Context,
        acceptingText: String?,
        rejectingText: String?,
    ) {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        prefs.edit {
            if (acceptingText != null) {
                putString(KEY_OPTIMISTIC_ACCEPTING_TEXT, acceptingText)
            }
            if (rejectingText != null) {
                putString(KEY_OPTIMISTIC_REJECTING_TEXT, rejectingText)
            }
        }
    }

    fun getOptimisticAcceptingText(context: Context): String {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_OPTIMISTIC_ACCEPTING_TEXT, DEFAULT_OPTIMISTIC_ACCEPTING_TEXT) ?: DEFAULT_OPTIMISTIC_ACCEPTING_TEXT
    }

    fun getOptimisticRejectingText(context: Context): String {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_OPTIMISTIC_REJECTING_TEXT, DEFAULT_OPTIMISTIC_REJECTING_TEXT) ?: DEFAULT_OPTIMISTIC_REJECTING_TEXT
    }
}
