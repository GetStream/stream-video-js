package io.getstream.rn.callingx.model

import android.os.ParcelUuid
import android.os.Parcelable
import android.telecom.DisconnectCause
import kotlinx.parcelize.Parcelize

/**
 * Simple interface to represent related call actions to communicate with the registered call scope
 * in the [TelecomCallRepository.registerCall]
 *
 * Note: we are using [Parcelize] to make the actions parcelable so they can be directly used in the
 * call notification.
 */
sealed interface CallAction : Parcelable {
    @Parcelize
    data class Answer(val isAudioCall: Boolean) : CallAction

    @Parcelize
    data class Disconnect(val cause: DisconnectCause) : CallAction

    @Parcelize
    object Hold : CallAction

    @Parcelize
    object Activate : CallAction

    @Parcelize
    data class ToggleMute(val isMute: Boolean) : CallAction

    @Parcelize
    data class SwitchAudioEndpoint(val endpointId: ParcelUuid) : CallAction

    @Parcelize
    data class TransferCall(val endpointId: ParcelUuid) : CallAction
}
