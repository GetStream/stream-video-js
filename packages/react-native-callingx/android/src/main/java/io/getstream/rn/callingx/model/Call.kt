package io.getstream.rn.callingx.model

import android.os.Bundle
import android.telecom.DisconnectCause
import androidx.core.telecom.CallAttributesCompat
import androidx.core.telecom.CallEndpointCompat
import kotlinx.coroutines.channels.Channel

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
             * Sends an action to the call session. It will be processed if it's still registered.
         *
         * @return true if the action was sent, false otherwise
         */
        fun processAction(action: CallAction) = actionSource.trySend(action).isSuccess
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
