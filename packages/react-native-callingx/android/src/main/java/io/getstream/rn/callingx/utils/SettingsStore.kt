package io.getstream.rn.callingx.utils

import android.content.Context
import androidx.core.content.edit

object SettingsStore {

    private const val PREF_NAME = "io.getstream.rn.callingx.settings"
    private const val KEY_REJECT_CALL_WHEN_BUSY = "reject_call_when_busy"
    private const val KEY_OPTIMISTIC_ACCEPTING_TEXT = "optimistic_accepting_text"
    private const val KEY_OPTIMISTIC_REJECTING_TEXT = "optimistic_rejecting_text"
    private const val KEY_SKIP_INCOMING_PUSH_IN_FOREGROUND = "skip_incoming_push_in_foreground"
    private const val KEY_DEFAULT_DEVICE_ENDPOINT_TYPE = "default_device_endpoint_type"

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

    fun setSkipIncomingPushInForeground(context: Context, skip: Boolean) {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        prefs.edit { putBoolean(KEY_SKIP_INCOMING_PUSH_IN_FOREGROUND, skip) }
    }

    fun shouldSkipIncomingPushInForeground(context: Context): Boolean {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        return prefs.getBoolean(KEY_SKIP_INCOMING_PUSH_IN_FOREGROUND, false)
    }

    /**
     * Persisted so it survives process death: the native cold-start push path
     * (startIncomingCallFromPush) registers calls before JS setup runs.
     */
    fun setDefaultDeviceEndpointType(context: Context, endpointType: String?) {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        prefs.edit {
            if (endpointType != null) {
                putString(KEY_DEFAULT_DEVICE_ENDPOINT_TYPE, endpointType)
            } else {
                remove(KEY_DEFAULT_DEVICE_ENDPOINT_TYPE)
            }
        }
    }

    fun getDefaultDeviceEndpointType(context: Context): String? {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_DEFAULT_DEVICE_ENDPOINT_TYPE, null)
    }
}
