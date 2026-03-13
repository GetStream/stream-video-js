package io.getstream.rn.callingx.notifications

import android.app.Notification
import android.content.Context
import android.media.Ringtone
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.telecom.DisconnectCause
import android.util.Log
import android.graphics.Color
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.Person
import androidx.core.graphics.drawable.IconCompat
import io.getstream.rn.callingx.CallService
import io.getstream.rn.callingx.CallingxModuleImpl
import io.getstream.rn.callingx.R
import io.getstream.rn.callingx.ResourceUtils
import io.getstream.rn.callingx.debugLog
import io.getstream.rn.callingx.getDisconnectCauseString
import io.getstream.rn.callingx.model.Call
import io.getstream.rn.callingx.repo.CallRepository
import io.getstream.rn.callingx.utils.SettingsStore

/**
 * Handles call status changes and updates the notification accordingly. For more guidance around
 * notifications check https://developer.android.com/develop/ui/views/notifications
 *
 * @see updateCallNotification
 */
class CallNotificationManager(
        private val context: Context,
        private val notificationManager: NotificationManagerCompat =
                NotificationManagerCompat.from(context)
) {

    internal companion object {
        private const val TAG = "[Callingx] CallNotificationManager"

        const val NOTIFICATION_ID = 200
    }

    enum class OptimisticState { NONE, ACCEPTING, REJECTING }

    private val lock = Any()

    private var notificationsConfig = NotificationsConfig.loadNotificationsConfig(context)

    private var ringtone: Ringtone? = null

    // Guarded by [lock]
    private var hasBecameActive = false
    private var activeWhen: Long = 0L
    private var optimisticState = OptimisticState.NONE
    private var lastPostedSnapshot: NotificationSnapshot? = null

    /**
     * Snapshot of call state used to detect notification changes.
     * Using a data class ensures immutable comparison and avoids issues
     * with mutable Call.Registered objects.
     */
    private data class NotificationSnapshot(
        val id: String,
        val isActive: Boolean,
        val isIncoming: Boolean,
        val optimisticState: OptimisticState,
        val displayTitle: String?,
        val displaySubtitle: String?,
        val displayName: CharSequence,
        val address: Uri
    )

    /**
     * Creates a snapshot of the call state used to detect notification changes.
     * @return NotificationSnapshot
     */
    private fun Call.Registered.toSnapshot() = NotificationSnapshot(
        id = id,
        isActive = isActive,
        isIncoming = isIncoming(),
        optimisticState = optimisticState,
        displayTitle = displayOptions?.getString(CallService.EXTRA_DISPLAY_TITLE),
        displaySubtitle = displayOptions?.getString(CallService.EXTRA_DISPLAY_SUBTITLE),
        displayName = callAttributes.displayName,
        address = callAttributes.address
    )

    /**
     * Sets the optimistic state of the call notification.
     * Optimistic state is used to update the notification text while the app is connecting or declining the call.
     * @param state The optimistic state to set.
     */
    fun setOptimisticState(state: OptimisticState) = synchronized(lock) {
        optimisticState = state
        if (state != OptimisticState.NONE) {
            lastPostedSnapshot = null
        }
    }

    /**
     * Creates a notification for the call.
     * Notification is created based on the call state and optimistic state.
     * @param call The call to create a notification for.
     * @return The notification.
     */
    fun createNotification(call: Call.Registered): Notification = synchronized(lock) {
        debugLog(TAG,"[notifications] createNotification: Creating notification for call ID: ${call.id}")

        val contentIntent =
                NotificationIntentFactory.getLaunchActivityIntent(
                        context,
                        CallingxModuleImpl.CALL_ANSWERED_ACTION,
                        call.id
                )
        val callStyle = createCallStyle(call)
        val channelId = getChannelId(call)
        debugLog(TAG, "[notifications] createNotification: Channel ID: $channelId")

        val builder =
                NotificationCompat.Builder(context, channelId)
                        .setContentIntent(contentIntent)
                        .setFullScreenIntent(contentIntent, true)
                        .setSmallIcon(R.drawable.ic_round_call_24)
                        .setCategory(NotificationCompat.CATEGORY_CALL)
                        .setPriority(NotificationCompat.PRIORITY_MAX)
                        .setOngoing(true)

        builder.setStyle(callStyle)

        // When call becomes active we need to set the when to current time and show the chronometer
        if (call.isActive && optimisticState == OptimisticState.NONE) {
            // We need to set the activation time once when call becomes active
            if (!hasBecameActive) {
                debugLog(TAG, "[notifications] createNotification: Setting when to current time")
                activeWhen = System.currentTimeMillis()
                hasBecameActive = true
            }
            builder.setWhen(activeWhen)
            builder.setUsesChronometer(true)
            builder.setShowWhen(true)
        }

        // If the call is not active and the optimistic state is not none, we need to set the notification text
        // based on exact action that is being taken (accepting or rejecting)
        if (optimisticState != OptimisticState.NONE && !call.isActive) {
            val text = when (optimisticState) {
                OptimisticState.ACCEPTING -> SettingsStore.getOptimisticAcceptingText(context)
                OptimisticState.REJECTING -> SettingsStore.getOptimisticRejectingText(context)
                else -> null
            }
            if (text != null) builder.setContentText(text)
        } else {
            // If the call is active, we need to set the notification text
            // based on the call display options (defined on js side)
            call.displayOptions?.let {
                if (it.containsKey(CallService.EXTRA_DISPLAY_SUBTITLE)) {
                    builder.setContentText(it.getString(CallService.EXTRA_DISPLAY_SUBTITLE))
                }
            }
        }

        return builder.build()
    }

    /**
     * Updates the call notification.
     * If the call is None or Unregistered, we need to dismiss the notification.
     * If the call is active and the optimistic state is not none, we need to reset the optimistic state.
     * If the call is active and the optimistic state is none, we need to create a new notification.
     * @param call The call to update the notification for.
     */
    fun updateCallNotification(call: Call) = synchronized(lock) {
        when (call) {
            Call.None, is Call.Unregistered -> {
                debugLog(TAG, "[notifications] updateCallNotification: Dismissing notification (call is None or Unregistered)")
                notificationManager.cancel(NOTIFICATION_ID)
                lastPostedSnapshot = null
                hasBecameActive = false
                activeWhen = 0L
                optimisticState = OptimisticState.NONE
            }
            is Call.Registered -> {
                if (call.isActive && optimisticState != OptimisticState.NONE) {
                    optimisticState = OptimisticState.NONE
                    debugLog(TAG, "[notifications] updateCallNotification: Resetting optimistic state")
                }

                // If the new snapshot is the same as the last posted snapshot, we need to skip the update
                val newSnapshot = call.toSnapshot()
                if (newSnapshot == lastPostedSnapshot) {
                    debugLog(TAG, "[notifications] updateCallNotification: Skipping - no state change")
                    return@synchronized
                }

                lastPostedSnapshot = newSnapshot
                val notification = createNotification(call)
                notificationManager.notify(NOTIFICATION_ID, notification)
                debugLog(TAG, "[notifications] updateCallNotification: Notification posted successfully")
            }
        }
    }

    fun cancelNotifications() = synchronized(lock) {
        notificationManager.cancel(NOTIFICATION_ID)
        hasBecameActive = false
        activeWhen = 0L
        optimisticState = OptimisticState.NONE
        lastPostedSnapshot = null
    }

    fun startRingtone() {
        if (ringtone?.isPlaying == true) {
            debugLog(TAG, "[notifications] startRingtone: Ringtone already playing")
            return
        }

        try {
            val soundUri =
                    ResourceUtils.getSoundUri(context, notificationsConfig.incomingChannel.sound)
                            ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)

            ringtone = RingtoneManager.getRingtone(context, soundUri)
        } catch (e: Exception) {
            Log.e(TAG, "[notifications] startRingtone: Error starting ringtone: ${e.message}")
            return
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            ringtone?.isLooping = true
        }

        ringtone?.play()
        debugLog(TAG, "[notifications] startRingtone: Ringtone started")
    }

    fun stopRingtone() {
        if (ringtone?.isPlaying == true) {
            ringtone?.stop()
            debugLog(TAG, "[notifications] stopRingtone: Ringtone stopped")
        }
        ringtone = null
    }

    fun resetOptimisticState() = synchronized(lock) {
        debugLog(TAG, "[notifications] resetOptimisticState: Resetting optimistic state")
        optimisticState = OptimisticState.NONE
        lastPostedSnapshot = null
    }

    private fun getChannelId(call: Call.Registered): String {
        return if (call.isIncoming() && !call.isActive && optimisticState == OptimisticState.NONE) {
            notificationsConfig.incomingChannel.id
        } else {
            notificationsConfig.ongoingChannel.id
        }
    }

    private fun createCallStyle(call: Call.Registered): NotificationCompat.CallStyle {
        val caller = createPerson(call)

        if (call.isIncoming() && !call.isActive && optimisticState == OptimisticState.NONE) {
            return NotificationCompat.CallStyle.forIncomingCall(
                    caller,
                    NotificationIntentFactory.getPendingBroadcastIntent(
                            context,
                            CallingxModuleImpl.CALL_END_ACTION,
                            call.id
                    ) {
                        putExtra(
                                CallingxModuleImpl.EXTRA_DISCONNECT_CAUSE,
                                getDisconnectCauseString(DisconnectCause(DisconnectCause.REJECTED))
                        )
                        putExtra(
                                CallingxModuleImpl.EXTRA_SOURCE,
                                CallRepository.EventSource.SYS.name.lowercase()
                        )
                    },
                    NotificationIntentFactory.getPendingNotificationIntent(
                            context,
                            CallingxModuleImpl.CALL_ANSWERED_ACTION,
                            call.id,
                            CallRepository.EventSource.SYS.name.lowercase()
                    )
            )
        }

        if (optimisticState == OptimisticState.REJECTING) {
            return NotificationCompat.CallStyle.forOngoingCall(
                    caller,
                    NotificationIntentFactory.getPendingBroadcastIntent(
                            context,
                            "io.getstream.CALL_END_NOOP",
                            call.id
                    ) ,
            ).setDeclineButtonColorHint(Color.GRAY)
        }

        return NotificationCompat.CallStyle.forOngoingCall(
                caller,
                NotificationIntentFactory.getPendingBroadcastIntent(
                        context,
                        CallingxModuleImpl.CALL_END_ACTION,
                        call.id
                ) {
                    putExtra(
                            CallingxModuleImpl.EXTRA_DISCONNECT_CAUSE,
                            getDisconnectCauseString(DisconnectCause(DisconnectCause.LOCAL))
                    )
                    putExtra(
                            CallingxModuleImpl.EXTRA_SOURCE,
                            CallRepository.EventSource.SYS.name.lowercase()
                    )
                },
        )
    }

    private fun createPerson(call: Call.Registered): Person {
        val displayCallerName = call.displayOptions?.getString(CallService.EXTRA_DISPLAY_TITLE)
        val address = call.callAttributes.address.toString()

        return Person.Builder()
                .setName(displayCallerName ?: call.callAttributes.displayName)
                .setUri(address)
                .setIcon(IconCompat.createWithResource(context, R.drawable.ic_user))
                .setImportant(true)
                .build()
    }

}
