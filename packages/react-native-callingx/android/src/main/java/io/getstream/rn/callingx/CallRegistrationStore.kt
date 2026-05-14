package io.getstream.rn.callingx

import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.Promise
import io.getstream.rn.callingx.model.CallAction
import java.util.Collections
import java.util.concurrent.ConcurrentHashMap
import kotlin.collections.emptyList

object CallRegistrationStore {

    private const val TAG = "[Callingx] CallRegistrationStore"
    private const val DISPLAY_TIMEOUT_MS = 10_000L

    private val trackedCallIds: MutableSet<String> = ConcurrentHashMap.newKeySet()

    /** Pending actions per callId, queued until the call is registered in Telecom. */
    private val pendingActionsByCallId = ConcurrentHashMap<String, MutableList<CallAction>>()

    // Per-callId pending promises for displayIncomingCall/startCall awaiting CALL_REGISTERED(_INCOMING)_ACTION.
    // Multiple concurrent callers for the same callId queue here and all resolve/reject together.
    private val pendingPromises = mutableMapOf<String, MutableList<Promise>>()
    private val pendingTimeouts = mutableMapOf<String, Runnable>()
    private val mainHandler = Handler(Looper.getMainLooper())

    fun trackCallRegistration(callId: String, promise: Promise?) {
        debugLog(
                TAG,
                "[store] trackCallRegistration: Tracking call registration for callId: $callId"
        )
        trackedCallIds.add(callId)

        if (promise == null) return

        synchronized(pendingPromises) {
            pendingPromises.getOrPut(callId) { mutableListOf() }.add(promise)

            // Schedule the registration timeout once per callId so concurrent callers
            // share the same deadline instead of resetting it on every track call.
            if (!pendingTimeouts.containsKey(callId)) {
                val timeoutRunnable = Runnable {
                    synchronized(pendingPromises) {
                        pendingPromises.remove(callId)?.forEach {
                            it.reject(
                                    "TIMEOUT",
                                    "Timed out waiting for call registration: $callId"
                            )
                        }
                        pendingTimeouts.remove(callId)
                        trackedCallIds.remove(callId)
                    }
                }
                pendingTimeouts[callId] = timeoutRunnable
                mainHandler.postDelayed(timeoutRunnable, DISPLAY_TIMEOUT_MS)
            }
        }
    }

    fun onRegistrationSuccess(callId: String) {
        synchronized(pendingPromises) {
            pendingTimeouts.remove(callId)?.let { mainHandler.removeCallbacks(it) }
            pendingPromises.remove(callId)?.forEach { it.resolve(true) }
        }
    }

    fun onRegistrationFailed(callId: String) {
        reportRegistrationFail(
                callId,
                "REGISTRATION_FAILED",
                "Failed to register call with telecom: $callId",
                null
        )
    }

    fun reportRegistrationFail(
            callId: String,
            code: String,
            message: String?,
            throwable: Throwable?
    ) {
        trackedCallIds.remove(callId)

        synchronized(pendingPromises) {
            pendingTimeouts.remove(callId)?.let { mainHandler.removeCallbacks(it) }
            val promises = pendingPromises.remove(callId).orEmpty()
            pendingActionsByCallId.remove(callId)
            promises.forEach { promise ->
                when {
                    throwable != null -> promise.reject(code, message, throwable)
                    message != null -> promise.reject(code, message)
                    else -> promise.reject(code, "Unknown error")
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
     * Queues an action for a call that is not yet registered.
     * Pending actions are drained and executed once registration completes.
     */
    fun addPendingAction(callId: String, action: CallAction) {
        debugLog(TAG, "[store] addPendingAction: callId=$callId action=${action::class.simpleName}")
        pendingActionsByCallId
                .computeIfAbsent(callId) { Collections.synchronizedList(mutableListOf()) }
                .add(action)
    }

    /**
     * Returns and removes all queued actions for this call.
     * Used once a call is registered so the service can replay pending actions.
     */
    fun takePendingActions(callId: String): List<CallAction> {
        val list = pendingActionsByCallId.remove(callId) ?: return emptyList()
        synchronized(list) { return list.toList() }
    }

    fun clearAll() {
        synchronized(pendingPromises) {
            pendingTimeouts.values.forEach { mainHandler.removeCallbacks(it) }
            pendingTimeouts.clear()
            pendingPromises.values.flatten().forEach {
                it.reject("CANCELLED", "Call registration store was cleared")
            }
            pendingPromises.clear()
        }
        trackedCallIds.clear()
        pendingActionsByCallId.clear()
    }
}
