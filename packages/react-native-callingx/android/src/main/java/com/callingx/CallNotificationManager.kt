/*
 * Copyright 2023 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.callingx

import android.Manifest
import android.app.Notification
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
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
        private const val TAG = "TelecomCallNotificationManager"

        const val NOTIFICATION_ID = 200
        const val NOTIFICATION_ACTION = "notification_action"
        const val DEFAULT_INCOMING_CHANNEL_ID = "incoming_channel"
        const val DEFAULT_INCOMING_CHANNEL_NAME = "Incoming calls"
        const val DEFAULT_ONGOING_CHANNEL_ID = "ongoing_channel"
        const val DEFAULT_ONGOING_CHANNEL_NAME = "Ongoing calls"

        private const val PREFS_NAME = "CallingxPrefs"
        private const val PREFIX_IN = "incoming_"
        private const val PREFIX_OUT = "outgoing_"
        private const val KEY_ID = "id"
        private const val KEY_NAME = "name"
        private const val KEY_SOUND = "sound"
        private const val KEY_VIBRATION = "vibration"

        fun saveNotificationsConfig(context: Context, config: NotificationsConfig) {
            Log.d(TAG, "saveNotificationsConfig: Saving notifications config: $config")

            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit()
                    .apply {
                        // Incoming channel
                        putString(PREFIX_IN + KEY_ID, config.incomingChannel.id)
                        putString(PREFIX_IN + KEY_NAME, config.incomingChannel.name)
                        putString(PREFIX_IN + KEY_SOUND, config.incomingChannel.sound)
                        putBoolean(PREFIX_IN + KEY_VIBRATION, config.incomingChannel.vibration)

                        // Outgoing channel
                        putString(PREFIX_OUT + KEY_ID, config.outgoingChannel.id)
                        putString(PREFIX_OUT + KEY_NAME, config.outgoingChannel.name)
                        putString(PREFIX_OUT + KEY_SOUND, config.outgoingChannel.sound)
                        putBoolean(PREFIX_OUT + KEY_VIBRATION, config.outgoingChannel.vibration)
                    }
                    .apply()
        }

        fun loadNotificationsConfig(context: Context): NotificationsConfig {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            Log.d(
                    TAG,
                    "loadNotificationsConfig: Loading notifications config ${prefs.getString(PREFIX_IN + KEY_ID, "")}"
            )
            return NotificationsConfig(
                    incomingChannel =
                            ChannelConfig(
                                    id = prefs.getString(PREFIX_IN + KEY_ID, "")
                                                    ?: DEFAULT_INCOMING_CHANNEL_ID,
                                    name = prefs.getString(PREFIX_IN + KEY_NAME, "")
                                                    ?: DEFAULT_INCOMING_CHANNEL_NAME,
                                    sound = prefs.getString(PREFIX_IN + KEY_SOUND, "") ?: "",
                                    vibration = prefs.getBoolean(PREFIX_IN + KEY_VIBRATION, false),
                                    importance = NotificationManagerCompat.IMPORTANCE_MAX
                            ),
                    outgoingChannel =
                            ChannelConfig(
                                    id = prefs.getString(PREFIX_OUT + KEY_ID, "")
                                                    ?: DEFAULT_ONGOING_CHANNEL_ID,
                                    name = prefs.getString(PREFIX_OUT + KEY_NAME, "")
                                                    ?: DEFAULT_ONGOING_CHANNEL_NAME,
                                    sound = prefs.getString(PREFIX_OUT + KEY_SOUND, "") ?: "",
                                    vibration = prefs.getBoolean(PREFIX_OUT + KEY_VIBRATION, false),
                                    importance = NotificationManagerCompat.IMPORTANCE_DEFAULT
                            )
            )
        }
    }

    private var notificationsConfig: NotificationsConfig

    init {
        notificationsConfig = CallNotificationManager.loadNotificationsConfig(context)
        createNotificationChannels(notificationsConfig)
        Log.d(TAG, "CallNotificationManager: Notifications config: $notificationsConfig")
    }

    fun createNotification(call: Call.Registered): Notification {
        Log.d(TAG, "createNotification: Creating notification for call ID: ${call.id}")

        val contentIntent = getActivityIntent(call.id)
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

    fun createNotificationChannels(notificationsConfig: NotificationsConfig) {
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

    private fun createNotificationChannel(config: ChannelConfig): NotificationChannelCompat {
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
                    getBroadcastIntent(call.id, CallingxModule.CALL_END_ACTION) {
                        putExtra(
                                CallingxModule.EXTRA_DISCONNECT_CAUSE,
                                getDisconnectCauseString(DisconnectCause(DisconnectCause.REJECTED))
                        )
                    },
                    getActivityIntent(call.id, CallingxModule.CALL_ANSWERED_ACTION)
            )
        }

        return NotificationCompat.CallStyle.forOngoingCall(
                caller,
                getBroadcastIntent(call.id, CallingxModule.CALL_END_ACTION) {
                    putExtra(
                            CallingxModule.EXTRA_DISCONNECT_CAUSE,
                            getDisconnectCauseString(DisconnectCause(DisconnectCause.LOCAL))
                    )
                }
        )
    }

    // this intent will send action directly to the module
    private fun getBroadcastIntent(
            callId: String,
            action: String,
            addExtras: Intent.() -> Unit = {}
    ): PendingIntent {
        val callIntent =
                Intent(action).apply {
                    setPackage(context.packageName)
                    putExtra(CallingxModule.EXTRA_CALL_ID, callId)
                    addExtras(this)
                }

        return PendingIntent.getBroadcast(
                context,
                callIntent.hashCode(),
                callIntent,
                PendingIntent.FLAG_IMMUTABLE,
        )
    }

    // this intent will send action to the launch activity, as for asnwering call case we need to
    // bring the app to foreground
    private fun getActivityIntent(
            callId: String,
            action: String? = null,
    ): PendingIntent {
        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        val callIntent =
                Intent(launchIntent).apply {
                    action?.let { this.action = it }
                    putExtra(CallingxModule.EXTRA_CALL_ID, callId)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                }

        return PendingIntent.getActivity(
                context,
                callIntent.hashCode(),
                callIntent,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
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
        val permission =
                PermissionChecker.checkSelfPermission(
                        context,
                        Manifest.permission.POST_NOTIFICATIONS,
                )
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                permission == PermissionChecker.PERMISSION_GRANTED
    }
}
