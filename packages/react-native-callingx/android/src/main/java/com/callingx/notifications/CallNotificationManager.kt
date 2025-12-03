package com.callingx.notifications

import android.Manifest
import android.app.Notification
import android.content.Context
import android.os.Build
import android.telecom.DisconnectCause
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.core.app.NotificationChannelCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.Person
import androidx.core.content.PermissionChecker
import androidx.core.graphics.drawable.IconCompat
import com.callingx.CallService
import com.callingx.CallingxModule
import com.callingx.R
import com.callingx.getDisconnectCauseString
import com.callingx.model.Call

/**
 * Handles call status changes and updates the notification accordingly. For more guidance around
 * notifications check https://developer.android.com/develop/ui/views/notifications
 *
 * @see updateCallNotification
 */
@RequiresApi(Build.VERSION_CODES.O)
class CallNotificationManager(
        private val context: Context,
        private val notificationManager: NotificationManagerCompat =
                NotificationManagerCompat.from(context)
) {

    internal companion object {
        private const val TAG = "[Callingx] CallNotificationManager"

        const val NOTIFICATION_ID = 200
        const val NOTIFICATION_ACTION = "notification_action"
    }

    private var notificationsConfig: NotificationsConfig.ChannelsConfig

    init {
        notificationsConfig = NotificationsConfig.loadNotificationsConfig(context)
        createNotificationChannels(notificationsConfig)
        Log.d(TAG, "CallNotificationManager: Notifications config: $notificationsConfig")
    }

    fun createNotification(call: Call.Registered): Notification {
        Log.d(TAG, "createNotification: Creating notification for call ID: ${call.id}")

        val contentIntent = NotificationIntentFactory.getLaunchActivityIntent(context, CallingxModule.CALL_ANSWERED_ACTION, call.id)
        val callStyle = createCallStyle(call)
        val channelId =
                if (call.isIncoming() && !call.isActive) {
                    notificationsConfig.incomingChannel.id
                } else {
                    notificationsConfig.outgoingChannel.id
                }

        val builder =
                NotificationCompat.Builder(context, channelId)
                        .setContentIntent(contentIntent)
                        .setFullScreenIntent(contentIntent, true)
                        .setStyle(callStyle)
                        .setSmallIcon(R.drawable.ic_round_call_24)
                        .setCategory(NotificationCompat.CATEGORY_CALL)
                        .setPriority(NotificationCompat.PRIORITY_MAX)
                        .setOngoing(true)

        call.displayOptions?.let {
            if (it.containsKey(CallService.EXTRA_DISPLAY_SUBTITLE)) {
                builder.setContentText(it.getString(CallService.EXTRA_DISPLAY_SUBTITLE))
            }
        }

        // if (call.isOnHold) {
        //     val activateAction = TelecomCallAction.Activate
        //     builder.addAction(
        //             R.drawable.ic_phone_paused_24,
        //             "Resume",
        //             getPendingIntent(activateAction)
        //     )
        // }

        return builder.build()
    }

    /** Updates, creates or dismisses a CallStyle notification based on the given [TelecomCall] */
    fun updateCallNotification(call: Call) {
        if (!canPostNotifications()) {
            Log.w(TAG, "updateCallNotification: Notifications are not granted, skipping update")
            return
        }

        when (call) {
            Call.None, is Call.Unregistered -> {
                Log.d(TAG, "Dismissing notification (call is None or Unregistered)")
                notificationManager.cancel(NOTIFICATION_ID)
            }
            is Call.Registered -> {
                val notification = createNotification(call)
                notificationManager.notify(NOTIFICATION_ID, notification)
                Log.d(TAG, "updateCallNotification: Notification posted successfully")
            }
        }
    }

    fun cancelNotifications() {
        notificationManager.cancel(NOTIFICATION_ID)
    }

    fun createNotificationChannels(notificationsConfig: NotificationsConfig.ChannelsConfig) {
        val incomingChannel = createNotificationChannel(notificationsConfig.incomingChannel)
        val ongoingChannel = createNotificationChannel(notificationsConfig.outgoingChannel)

        notificationManager.createNotificationChannelsCompat(
                listOf(
                        incomingChannel,
                        ongoingChannel,
                ),
        )
        Log.d(TAG, "createNotificationChannels: Notification channels registered")
    }

    private fun createNotificationChannel(config: NotificationsConfig.ChannelParams): NotificationChannelCompat {
        return NotificationChannelCompat.Builder(config.id, config.importance)
                .apply {
                    setName(config.name)
                    setVibrationEnabled(config.vibration)
                    ResourceUtils.getSoundUri(context, config.sound)?.let { setSound(it, null) }
                }
                .build()
    }

    private fun createCallStyle(call: Call.Registered): NotificationCompat.CallStyle {
        val caller = createPerson(call)

        if (call.isIncoming() && !call.isActive) {
            return NotificationCompat.CallStyle.forIncomingCall(
                    caller,
                    NotificationIntentFactory.getPendingBroadcastIntent(
                            context,
                            CallingxModule.CALL_END_ACTION,
                            call.id
                    ) {
                        putExtra(
                                CallingxModule.EXTRA_DISCONNECT_CAUSE,
                                getDisconnectCauseString(DisconnectCause(DisconnectCause.REJECTED))
                        )
                    },
                    NotificationIntentFactory.getPendingNotificationIntent(
                            context,
                            CallingxModule.CALL_ANSWERED_ACTION,
                            call.id
                    )
            )
        }

        return NotificationCompat.CallStyle.forOngoingCall(
                caller,
                NotificationIntentFactory.getPendingBroadcastIntent(
                        context,
                        CallingxModule.CALL_END_ACTION,
                        call.id
                ) {
                    putExtra(
                            CallingxModule.EXTRA_DISCONNECT_CAUSE,
                            getDisconnectCauseString(DisconnectCause(DisconnectCause.LOCAL))
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

    private fun canPostNotifications(): Boolean {
        // POST_NOTIFICATIONS permission is only required on Android 13+
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            return true
        }

        val permission = PermissionChecker.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS,
        )
        return permission == PermissionChecker.PERMISSION_GRANTED
    }
}
