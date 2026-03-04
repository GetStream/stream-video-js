package io.getstream.rn.callingx

import android.os.Handler
import android.os.Looper
import android.util.Log
import com.facebook.react.bridge.Promise
import java.util.concurrent.ConcurrentHashMap

object CallRegistrationStore {

    private const val TAG = "[Callingx] CallRegistrationStore"
    private const val DISPLAY_TIMEOUT_MS = 10_000L

    private val trackedCallIds: MutableSet<String> = ConcurrentHashMap.newKeySet()

    /** Pending disconnect cause code (android.telecom.DisconnectCause code) per callId. */
    private val pendingDisconnectCauseByCallId = ConcurrentHashMap<String, Int>()

    // Per-callId pending promises for displayIncomingCall awaiting CALL_REGISTERED_INCOMING_ACTION
    private val pendingDisplayPromises = mutableMapOf<String, Promise>()
    private val pendingTimeouts = mutableMapOf<String, Runnable>()
    private val mainHandler = Handler(Looper.getMainLooper())

    fun trackIncomingDisplay(callId: String, promise: Promise?) {
        debugLog(TAG, "[store] trackIncomingDisplay: Tracking incoming display for callId: $callId")
        trackedCallIds.add(callId)

        if (promise == null) return

        synchronized(pendingDisplayPromises) {
            // Cancel any existing timeout for this callId to avoid a stale runnable
            // rejecting the new promise after it overwrites the old one.
            pendingTimeouts.remove(callId)?.let { mainHandler.removeCallbacks(it) }

            pendingDisplayPromises[callId] = promise

            val timeoutRunnable = Runnable {
                synchronized(pendingDisplayPromises) {
                    pendingDisplayPromises.remove(callId)?.reject(
                        "TIMEOUT",
                        "Timed out waiting for call registration: $callId"
                    )
                    pendingTimeouts.remove(callId)
                }
            }
            pendingTimeouts[callId] = timeoutRunnable
            mainHandler.postDelayed(timeoutRunnable, DISPLAY_TIMEOUT_MS)
        }
    }

    fun onDisplayRegistrationSuccess(callId: String) {
        synchronized(pendingDisplayPromises) {
            pendingTimeouts.remove(callId)?.let { mainHandler.removeCallbacks(it) }
            pendingDisplayPromises.remove(callId)?.resolve(true)
        }
    }

    fun onRegistrationFailed(callId: String) {
        failDisplay(
            callId,
            "REGISTRATION_FAILED",
            "Failed to register call with telecom: $callId",
            null
        )
    }

    fun failDisplay(
        callId: String,
        code: String,
        message: String?,
        throwable: Throwable?
    ) {
        trackedCallIds.remove(callId)

        synchronized(pendingDisplayPromises) {
            pendingTimeouts.remove(callId)?.let { mainHandler.removeCallbacks(it) }
            val promise = pendingDisplayPromises.remove(callId)
            if (promise != null) {
                if (throwable != null) {
                    promise.reject(code, message, throwable)
                } else if (message != null) {
                    promise.reject(code, message)
                } else {
                    promise.reject(code, "Unknown error")
                }
            }
        }
    }

    fun addTrackedCall(callId: String) {
        debugLog(TAG, "[store] addTrackedCall: Adding tracked call: $callId")
        trackedCallIds.add(callId)
    }

    fun removeTrackedCall(callId: String) {
        debugLog(TAG, "[store] removeTrackedCall: Removing tracked call: $callId")
        trackedCallIds.remove(callId)
    }

    fun isCallTracked(callId: String): Boolean {
        val isTracked = trackedCallIds.contains(callId)
        debugLog(TAG, "[store] isCallTracked: Is call $callId tracked: $isTracked")
        return isTracked
    }

    fun hasRegisteredCall(): Boolean {
        return trackedCallIds.isNotEmpty()
    }

    /**
     * Records that a disconnect was requested for this call before it was registered.
     * When the call becomes registered, the service should take this and run the disconnect action.
     */
    fun setPendingDisconnect(callId: String, disconnectCauseCode: Int) {
        debugLog(TAG, "[store] setPendingDisconnect: callId=$callId causeCode=$disconnectCauseCode")
        pendingDisconnectCauseByCallId[callId] = disconnectCauseCode
    }

    /**
     * Returns and removes the pending disconnect cause code for this call, if any.
     * Used when the call has just become registered so the service can run the disconnect action.
     */
    fun takePendingDisconnect(callId: String): Int? {
        val code = pendingDisconnectCauseByCallId.remove(callId)
        if (code != null) {
            debugLog(TAG, "[store] takePendingDisconnect: callId=$callId causeCode=$code")
        }
        return code
    }

    fun clearAll() {
        synchronized(pendingDisplayPromises) {
            pendingTimeouts.values.forEach { mainHandler.removeCallbacks(it) }
            pendingTimeouts.clear()
            pendingDisplayPromises.clear()
        }
        trackedCallIds.clear()
        pendingDisconnectCauseByCallId.clear()
    }

    private fun debugLog(tag: String, message: String) {
        Log.d(tag, message)
    }
}

