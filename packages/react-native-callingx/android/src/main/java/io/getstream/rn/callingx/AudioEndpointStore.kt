package io.getstream.rn.callingx

import io.getstream.rn.callingx.utils.AudioEndpointUtils
import java.util.concurrent.ConcurrentHashMap

/**
 * Shared, process-wide store for Telecom audio-endpoint state.
 *
 * [CallService] owns the Telecom repository and writes endpoint snapshots here whenever they
 * change; [CallingxModuleImpl] reads them to answer synchronous JS queries
 * without cross-component coupling.
 *
 * Also holds the sticky default-endpoint preference, which is applied at call registration time by
 * resolving it against the pre-call endpoints and passing it as
 * `CallAttributesCompat.preferredStartingCallEndpoint`.
 */
object AudioEndpointStore {

    /** Last serialized endpoints snapshot per callId (see [AudioEndpointUtils.snapshotJson]). */
    private val snapshotByCallId = ConcurrentHashMap<String, String>()

    /** Sticky default preference: "speaker" or "earpiece". Null means "let Telecom decide". */
    @Volatile
    private var defaultEndpointPref: String? = null

    fun setSnapshot(callId: String, snapshotJson: String) {
        snapshotByCallId[callId] = snapshotJson
    }

    fun getSnapshot(callId: String): String =
        snapshotByCallId[callId] ?: AudioEndpointUtils.EMPTY_SNAPSHOT_JSON

    fun setDefaultEndpointPref(endpointType: String?) {
        defaultEndpointPref = endpointType
    }

    fun getDefaultEndpointPref(): String? = defaultEndpointPref

    fun clear(callId: String) {
        snapshotByCallId.remove(callId)
    }

    fun clearAll() {
        snapshotByCallId.clear()
        defaultEndpointPref = null
    }
}
