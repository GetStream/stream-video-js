package io.getstream.rn.callingx.model

import android.os.Bundle
import android.telecom.DisconnectCause
import android.util.Log
import androidx.core.telecom.CallAttributesCompat
import androidx.core.telecom.CallEndpointCompat
import kotlinx.coroutines.channels.Channel

private const val TAG = "[Callingx] Call"

/**
 * Custom representation of a call state.
 */
sealed class Call {

    /**
     * There is no current or past calls in the stack
     */
    object None : Call()

    /**
     * Represents a registered call with the telecom stack with the values provided by the
     * Telecom SDK
     */
    data class Registered(
        val id: String,
        val callAttributes: CallAttributesCompat,
        val displayOptions: Bundle?,
        val isActive: Boolean,
        val isOnHold: Boolean,
        val isMuted: Boolean,
        val isPending: Boolean,
        val errorCode: Int?,
        val currentCallEndpoint: CallEndpointCompat?,
        val availableCallEndpoints: List<CallEndpointCompat>,
        internal val actionSource: Channel<CallAction>,
    ) : Call() {

        /**
         * @return true if it's an incoming registered call, false otherwise
         */
        fun isIncoming() = callAttributes.direction == CallAttributesCompat.DIRECTION_INCOMING

        /**
         * Sends an action to the call session. Actions are queued and processed in order by the
         * call session.
         *
         * @return true if the action was queued, false only if the action channel is closed,
         * which callingx never does
         */
        fun processAction(action: CallAction): Boolean {
            val sent = actionSource.trySend(action).isSuccess
            if (!sent) {
                Log.w(TAG, "[call] processAction[$id]: Dropped ${action::class.simpleName}, action channel is closed")
            }
            return sent
        }
    }

    /**
     * Represent a previously registered call that was disconnected
     */
    data class Unregistered(
        val id: String,
        val callAttributes: CallAttributesCompat,
        val disconnectCause: DisconnectCause,
    ) : Call()
}
