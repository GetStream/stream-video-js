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

    private var notificationsConfig = NotificationsConfig.loadNotificationsConfig(context)

    private var ringtone: Ringtone? = null

    private var hasBecameActive = false

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
        val displayTitle: String?,
        val displaySubtitle: String?,
        val displayName: CharSequence,
        val address: Uri
    )

    private fun Call.Registered.toSnapshot() = NotificationSnapshot(
        id = id,
        isActive = isActive,
        isIncoming = isIncoming(),
        displayTitle = displayOptions?.getString(CallService.EXTRA_DISPLAY_TITLE),
        displaySubtitle = displayOptions?.getString(CallService.EXTRA_DISPLAY_SUBTITLE),
        displayName = callAttributes.displayName,
        address = callAttributes.address
    )

    fun createNotification(call: Call.Registered): Notification {
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
                        .setStyle(callStyle)
                        .setSmallIcon(R.drawable.ic_round_call_24)
                        .setCategory(NotificationCompat.CATEGORY_CALL)
                        .setPriority(NotificationCompat.PRIORITY_MAX)
                        .setOngoing(true)

        if (!hasBecameActive && call.isActive) {
            debugLog(TAG, "[notifications] createNotification: Setting when to current time")
            builder.setWhen(System.currentTimeMillis())
            builder.setUsesChronometer(true)
            builder.setShowWhen(true)
            hasBecameActive = true
        }

        call.displayOptions?.let {
            if (it.containsKey(CallService.EXTRA_DISPLAY_SUBTITLE)) {
                builder.setContentText(it.getString(CallService.EXTRA_DISPLAY_SUBTITLE))
            }
        }

        return builder.build()
    }

    fun updateCallNotification(call: Call) {
        when (call) {
            Call.None, is Call.Unregistered -> {
                debugLog(TAG, "[notifications] updateCallNotification: Dismissing notification (call is None or Unregistered)")
                notificationManager.cancel(NOTIFICATION_ID)
                lastPostedSnapshot = null
                hasBecameActive = false
            }
            is Call.Registered -> {
                val newSnapshot = call.toSnapshot()
                if (newSnapshot == lastPostedSnapshot) {
                    debugLog(TAG, "[notifications] updateCallNotification: Skipping - no state change")
                    return
                }

                lastPostedSnapshot = newSnapshot
                val notification = createNotification(call)
                notificationManager.notify(NOTIFICATION_ID, notification)
                debugLog(TAG, "[notifications] updateCallNotification: Notification posted successfully")
            }
        }
    }

    fun cancelNotifications() {
        notificationManager.cancel(NOTIFICATION_ID)
        hasBecameActive = false
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

    private fun getChannelId(call: Call.Registered): String {
        return if (call.isIncoming() && !call.isActive) {
            notificationsConfig.incomingChannel.id
        } else {
            notificationsConfig.ongoingChannel.id
        }
    }

    private fun createCallStyle(call: Call.Registered): NotificationCompat.CallStyle {
        val caller = createPerson(call)

        if (call.isIncoming() && !call.isActive) {
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
