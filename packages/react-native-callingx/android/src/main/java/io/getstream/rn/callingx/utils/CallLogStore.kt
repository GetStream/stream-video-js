package io.getstream.rn.callingx.utils

import android.content.Context
import androidx.core.content.edit
import org.json.JSONObject

/**
 * Maps the Telecom call cid (the UUID the system sends back with `ACTION_CALL_BACK` when a
 * call log entry is tapped) to the call it belongs to.
 */
object CallLogStore {

    private const val PREF_NAME = "io.getstream.rn.callingx.call_log"

    private const val MAX_ENTRIES = 100

    private const val KEY_CALL_ID = "callId"
    private const val KEY_DISPLAY_NAME = "displayName"
    private const val KEY_IS_VIDEO = "isVideo"
    private const val KEY_CREATED_AT = "createdAt"

    data class Entry(
        val callId: String,
        val displayName: String,
        val isVideo: Boolean,
    )

    @Synchronized
    fun put(context: Context, uuid: String, entry: Entry) {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        val now = System.currentTimeMillis()
        val json = JSONObject()
            .put(KEY_CALL_ID, entry.callId)
            .put(KEY_DISPLAY_NAME, entry.displayName)
            .put(KEY_IS_VIDEO, entry.isVideo)
            .put(KEY_CREATED_AT, now)

        val stale = prefs.all
            .mapNotNull { (key, value) ->
                (value as? String)?.let { key to createdAt(it) }
            }
            .sortedByDescending { it.second }
            // Keep room for the new entry.
            .drop(MAX_ENTRIES - 1)
            .map { it.first }

        prefs.edit {
            stale.forEach { remove(it) }
            putString(uuid, json.toString())
        }
    }

    @Synchronized
    fun get(context: Context, uuid: String): Entry? {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        val value = prefs.getString(uuid, null) ?: return null
        return try {
            val json = JSONObject(value)
            Entry(
                callId = json.getString(KEY_CALL_ID),
                displayName = json.optString(KEY_DISPLAY_NAME),
                isVideo = json.optBoolean(KEY_IS_VIDEO),
            )
        } catch (e: Exception) {
            null
        }
    }

    @Synchronized
    fun clear(context: Context) {
        context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE).edit { clear() }
    }

    private fun createdAt(value: String): Long =
        try {
            JSONObject(value).optLong(KEY_CREATED_AT)
        } catch (e: Exception) {
            0L
        }
}
