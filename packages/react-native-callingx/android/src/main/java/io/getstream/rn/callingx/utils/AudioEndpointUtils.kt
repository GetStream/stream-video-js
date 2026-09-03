package io.getstream.rn.callingx.utils

import androidx.core.telecom.CallEndpointCompat
import org.json.JSONArray
import org.json.JSONObject

/**
 * Serialization helpers to bridge Telecom [CallEndpointCompat] values across the
 * native <-> JS boundary. The JS SDK adapts these generic endpoint primitives into
 * its own audio-device status shape.
 */
object AudioEndpointUtils {

    /** Stable string type names shared with the JS layer. */
    const val TYPE_EARPIECE = "earpiece"
    const val TYPE_SPEAKER = "speaker"
    const val TYPE_WIRED_HEADSET = "wired_headset"
    const val TYPE_BLUETOOTH = "bluetooth"
    const val TYPE_UNKNOWN = "unknown"

    fun endpointTypeToString(type: Int): String = when (type) {
        CallEndpointCompat.TYPE_EARPIECE -> TYPE_EARPIECE
        CallEndpointCompat.TYPE_SPEAKER -> TYPE_SPEAKER
        CallEndpointCompat.TYPE_WIRED_HEADSET -> TYPE_WIRED_HEADSET
        CallEndpointCompat.TYPE_BLUETOOTH -> TYPE_BLUETOOTH
        else -> TYPE_UNKNOWN
    }

    fun isWiredOrBluetooth(type: Int): Boolean =
        type == CallEndpointCompat.TYPE_WIRED_HEADSET ||
            type == CallEndpointCompat.TYPE_BLUETOOTH

    fun toJson(endpoint: CallEndpointCompat): JSONObject = JSONObject().apply {
        put("id", endpoint.identifier.toString())
        put("name", endpoint.name.toString())
        put("type", endpointTypeToString(endpoint.type))
    }

    /** Serialize a current/available endpoints snapshot into a JSON string. */
    fun snapshotJson(
        current: CallEndpointCompat?,
        available: List<CallEndpointCompat>,
    ): String {
        val endpointsArray = JSONArray()
        available.forEach { endpointsArray.put(toJson(it)) }
        return JSONObject().apply {
            put("endpoints", endpointsArray)
            put("currentEndpoint", current?.let { toJson(it) } ?: JSONObject.NULL)
        }.toString()
    }

    val EMPTY_SNAPSHOT_JSON: String =
        JSONObject().apply {
            put("endpoints", JSONArray())
            put("currentEndpoint", JSONObject.NULL)
        }.toString()
}
