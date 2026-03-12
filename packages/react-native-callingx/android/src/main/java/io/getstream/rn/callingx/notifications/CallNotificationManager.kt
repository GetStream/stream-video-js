package io.getstream.rn.callingx.notifications

import android.app.Notification
import android.content.Context
import android.media.Ringtone
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.telecom.DisconnectCause
import android.util.Log
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
import androidx.core.graphics.toColorInt

/**
 * Handles call status changes and updates the notification accordingly. For more guidance around
 * notifications check https://developer.android.com/develop/ui/views/notifications
 *
 * Supports multiple simultaneous call notifications, each keyed by callId.
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
        private const val DISABLED_COLOR = "#757575" // NOTE: hint color might be ignored by OS

        /** Base notification ID. Per-call IDs start from this value. */
        private const val BASE_NOTIFICATION_ID = 200
    }

    enum class OptimisticState { NONE, ACCEPTING, REJECTING }

    private val lock = Any()

    private var notificationsConfig = NotificationsConfig.loadNotificationsConfig(context)

    private var ringtone: Ringtone? = null

    // Per-call state, all guarded by [lock]
    private val callNotificationIds = mutableMapOf<String, Int>()
    private var nextNotificationId = BASE_NOTIFICATION_ID

    private val optimisticStates = mutableMapOf<String, OptimisticState>()
    private val lastPostedSnapshots = mutableMapOf<String, NotificationSnapshot>()
    private val activeWhenMap = mutableMapOf<String, Long>()
    private val hasBecameActiveMap = mutableMapOf<String, Boolean>()

    /** The callId whose notification was used for startForeground(). */
    private var foregroundCallId: String? = null

    /**
     * Snapshot of call state used to detect notification changes.
     */
    data class NotificationSnapshot(
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
    private fun Call.Registered.toSnapshot(callId: String) = NotificationSnapshot(
        id = id,
        isActive = isActive,
        isIncoming = isIncoming(),
        optimisticState = optimisticStates[callId] ?: OptimisticState.NONE,
        displayTitle = displayOptions?.getString(CallService.EXTRA_DISPLAY_TITLE),
        displaySubtitle = displayOptions?.getString(CallService.EXTRA_DISPLAY_SUBTITLE),
        displayName = callAttributes.displayName,
        address = callAttributes.address
    )

    fun getOrCreateNotificationId(callId: String): Int = synchronized(lock) {
        callNotificationIds.getOrPut(callId) {
            val id = nextNotificationId
            nextNotificationId++
            if (foregroundCallId == null) {
                foregroundCallId = callId
            }
            id
        }
    }

    /**
     * Sets the optimistic state of the call notification.
     * Optimistic state is used to update the notification text while the app is connecting or declining the call.
     * @param state The optimistic state to set.
     */
    fun setOptimisticState(callId: String, state: OptimisticState) = synchronized(lock) {
        optimisticStates[callId] = state
        if (state != OptimisticState.NONE) {
            lastPostedSnapshots.remove(callId)
        }
    }

    /**
     * Creates a notification for the call.
     * Notification is created based on the call state and optimistic state.
     * @param call The call to create a notification for.
     * @return The notification.
     */
    fun createNotification(callId: String, call: Call.Registered): Notification = synchronized(lock) {
        debugLog(TAG,"[notifications] createNotification: Creating notification for call ID: ${call.id}")

        val optimisticState = optimisticStates[callId] ?: OptimisticState.NONE

        val contentIntent =
                NotificationIntentFactory.getLaunchActivityIntent(
                        context,
                        CallingxModuleImpl.CALL_ANSWERED_ACTION,
                        call.id
                )
        val callStyle = createCallStyle(call, optimisticState)
        val channelId = getChannelId(call, optimisticState)
        debugLog(TAG, "[notifications] createNotification: Channel ID: $channelId")

        val builder =
                NotificationCompat.Builder(context, channelId)
                        .setContentIntent(contentIntent)
                        .setFullScreenIntent(contentIntent, true)
                        .setSmallIcon(R.drawable.ic_round_call_24)
                        .setCategory(NotificationCompat.CATEGORY_CALL)
                        .setPriority(NotificationCompat.PRIORITY_MAX)
                        .setOngoing(optimisticState != OptimisticState.REJECTING)

        builder.setStyle(callStyle)

        // When call becomes active we need to set the when to current time and show the chronometer
        val hasBecameActive = hasBecameActiveMap[callId] ?: false
        if (call.isActive && optimisticState == OptimisticState.NONE) {
            // We need to set the activation time once when call becomes active
            if (!hasBecameActive) {
                debugLog(TAG, "[notifications] createNotification: Setting when to current time for $callId")
                activeWhenMap[callId] = System.currentTimeMillis()
                hasBecameActiveMap[callId] = true
            }
            builder.setWhen(activeWhenMap[callId] ?: System.currentTimeMillis())
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
    fun updateCallNotification(callId: String, call: Call.Registered) = synchronized(lock) {
        val optimisticState = optimisticStates[callId] ?: OptimisticState.NONE
        if (call.isActive && optimisticState != OptimisticState.NONE) {
            optimisticStates[callId] = OptimisticState.NONE
            debugLog(TAG, "[notifications] updateCallNotification[$callId]: Resetting optimistic state")
        }
        
        // If the new snapshot is the same as the last posted snapshot, we need to skip the update
        val newSnapshot = call.toSnapshot(callId)
        if (newSnapshot == lastPostedSnapshots[callId]) {
            debugLog(TAG, "[notifications] updateCallNotification[$callId]: Skipping - no state change")
            return@synchronized
        }

        lastPostedSnapshots[callId] = newSnapshot
        val notificationId = getOrCreateNotificationId(callId)
        val notification = createNotification(callId, call)
        notificationManager.notify(notificationId, notification)
        debugLog(TAG, "[notifications] updateCallNotification[$callId]: Notification posted (id=$notificationId)")
    }

    fun postNotification(callId: String, notification: Notification) = synchronized(lock) {
        val notificationId = getOrCreateNotificationId(callId)
        notificationManager.notify(notificationId, notification)
    }

    fun cancelNotification(callId: String) = synchronized(lock) {
        val notificationId = callNotificationIds.remove(callId)
        if (notificationId != null) {
            notificationManager.cancel(notificationId)
            debugLog(TAG, "[notifications] cancelNotification[$callId]: Cancelled (id=$notificationId)")
        }
        lastPostedSnapshots.remove(callId)
        optimisticStates.remove(callId)
        hasBecameActiveMap.remove(callId)
        activeWhenMap.remove(callId)

        if (foregroundCallId == callId) {
            foregroundCallId = callNotificationIds.keys.firstOrNull()
        }
    }

    fun cancelAllNotifications() = synchronized(lock) {
        for ((_, notificationId) in callNotificationIds) {
            notificationManager.cancel(notificationId)
        }
        callNotificationIds.clear()
        lastPostedSnapshots.clear()
        optimisticStates.clear()
        hasBecameActiveMap.clear()
        activeWhenMap.clear()
        foregroundCallId = null
        nextNotificationId = BASE_NOTIFICATION_ID
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

    fun resetOptimisticState(callId: String) = synchronized(lock) {
        debugLog(TAG, "[notifications] resetOptimisticState[$callId]: Resetting optimistic state")
        optimisticStates[callId] = OptimisticState.NONE
        lastPostedSnapshots.remove(callId)
    }

    private fun getChannelId(call: Call.Registered, optimisticState: OptimisticState): String {
        return if (call.isIncoming() && !call.isActive && optimisticState == OptimisticState.NONE) {
            notificationsConfig.incomingChannel.id
        } else {
            notificationsConfig.ongoingChannel.id
        }
    }

    private fun createCallStyle(call: Call.Registered, optimisticState: OptimisticState): NotificationCompat.CallStyle? {
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
            ).setDeclineButtonColorHint(DISABLED_COLOR.toColorInt())
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
