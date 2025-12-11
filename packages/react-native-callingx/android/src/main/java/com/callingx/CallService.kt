package com.callingx

import CallRepository
import android.app.Service
import android.content.Intent
import android.net.Uri
import android.os.Binder
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.telecom.DisconnectCause
import android.util.Log
import com.callingx.model.Call
import com.callingx.model.CallAction
import com.callingx.notifications.CallNotificationManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

/**
 * This service handles the app call logic (show notification, record mic, display audio, etc..). It
 * can get started by the user or by an upcoming push notification to start a call.
 *
 * It holds the call scope used to register a call with the Telecom SDK in our
 * TelecomCallRepository.
 *
 * When registering a call with the Telecom SDK and displaying a CallStyle notification, the SDK
 * will grant you foreground service delegation so there is no need to make this a FGS.
 *
 * Note: you could potentially make this service run in a different process since audio or video
 * calls can consume significant memory, although that would require more complex setup to make it
 * work across multiple process.
 */
class CallService : Service(), CallRepository.Listener {

    companion object {
        private const val TAG = "[Callingx] CallService"

        internal const val EXTRA_CALL_ID = "extra_call_id"
        internal const val EXTRA_NAME = "extra_name"
        internal const val EXTRA_URI = "extra_uri"
        internal const val EXTRA_IS_VIDEO = "extra_is_video"
        internal const val EXTRA_DISPLAY_TITLE = "displayTitle"
        internal const val EXTRA_DISPLAY_SUBTITLE = "displaySubtitle"
        internal const val EXTRA_DISPLAY_OPTIONS = "display_options"
        // Background task extras
        internal const val EXTRA_TASK_NAME = "task_name"
        internal const val EXTRA_TASK_DATA = "task_data"
        internal const val EXTRA_TASK_TIMEOUT = "task_timeout"

        internal const val ACTION_INCOMING_CALL = "incoming_call"
        internal const val ACTION_OUTGOING_CALL = "outgoing_call"
        internal const val ACTION_UPDATE_CALL = "update_call"
        internal const val ACTION_START_BACKGROUND_TASK = "start_background_task"
        internal const val ACTION_STOP_BACKGROUND_TASK = "stop_background_task"
        internal const val ACTION_STOP_SERVICE = "stop_service"
    }

    inner class CallServiceBinder : Binder() {
        fun getService(): CallService = this@CallService
    }

    private lateinit var headlessJSManager: HeadlessTaskManager
    private lateinit var notificationManager: CallNotificationManager
    private lateinit var callRepository: CallRepository

    private val binder = CallServiceBinder()
    private val scope: CoroutineScope = CoroutineScope(SupervisorJob())

    private var isInForeground = false

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "[service] onCreate: TelecomCallService created")

        notificationManager = CallNotificationManager(applicationContext)
        headlessJSManager = HeadlessTaskManager(applicationContext)
        callRepository = CallRepositoryFactory.create(applicationContext)
        callRepository.setListener(this)

        sendBroadcastEvent(CallingxModule.SERVICE_READY_ACTION)
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "[service] onDestroy: TelecomCallService destroyed")

        notificationManager.cancelNotifications()
        notificationManager.stopRingtone()
        callRepository.release()
        headlessJSManager.release()

        if (isInForeground) {
            stopForeground(STOP_FOREGROUND_REMOVE)
            isInForeground = false
        }

        scope.cancel()
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
        Log.d(TAG, "[service] onTaskRemoved: Task removed")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "[service] onStartCommand: Received intent with action: ${intent?.action}")

        if (intent == null || intent.action == null) {
            Log.w(TAG, "[service] onStartCommand: Intent is null, returning START_NOT_STICKY")
            return START_NOT_STICKY
        }

        when (intent.action) {
            ACTION_INCOMING_CALL -> {
                registerCall(intent, true)
            }
            ACTION_OUTGOING_CALL -> {
                registerCall(intent, false)
            }
            ACTION_START_BACKGROUND_TASK -> {
                if (!isInForeground) {
                    Log.d(TAG, "[service] onStartCommand: Starting foreground for background task")
                    //for now bg task is intended to be used after a call registered and notification is shown, so we don't need to show a separate notification for bg task
                    // startForeground(CallNotificationManager.NOTIFICATION_ID, notification)
                    isInForeground = true
                }

                val taskName = intent.getStringExtra(EXTRA_TASK_NAME)!!
                val taskData = intent.getBundleExtra(EXTRA_TASK_DATA)!!
                val taskTimeout = intent.getLongExtra(EXTRA_TASK_TIMEOUT, 0)
                startBackgroundTask(taskName, taskData, taskTimeout)
            }
            ACTION_STOP_BACKGROUND_TASK -> {
                stopBackgroundTask()
            }
            ACTION_UPDATE_CALL -> {
                // TODO: update the call details
                // updateServiceState(telecomRepository.currentCall.value) // not used for now
            }
            else -> {
                Log.e(TAG, "[service] onStartCommand: Unknown action: ${intent.action}")
                throw IllegalArgumentException("Unknown action")
            }
        }

        return START_STICKY
    }

    override fun onBind(intent: Intent): IBinder? = binder

    override fun onUnbind(intent: Intent): Boolean {
        Log.d(TAG, "[service] onUnbind: Service unbound")
        return super.onUnbind(intent)
    }

    override fun onCallStateChanged(call: Call) {
        Log.d(TAG, "[service] onCallStateChanged: Call state changed: ${call::class.simpleName}")
        Log.d(TAG, "[service] updateServiceState: Updating service state for call type: ${call}")
        when (call) {
            is Call.Registered -> {
                Log.d(
                        TAG,
                        "[service] updateServiceState: Call registered - Active: ${call.isActive}, OnHold: ${call.isOnHold}, Muted: ${call.isMuted}"
                )

                if (call.isIncoming()) {
                    if (!call.isActive) notificationManager.startRingtone()
                    else notificationManager.stopRingtone()
                }
                // Update the call state.
                if (isInForeground) {
                    Log.d(
                            TAG,
                            "[service] updateServiceState: Updating notification for call: ${call.id}"
                    )
                    notificationManager.updateCallNotification(call)
                } else {
                    Log.d(
                            TAG,
                            "[service] updateServiceState: Starting foreground for call: ${call.id}"
                    )
                    val notification = notificationManager.createNotification(call)
                    startForeground(CallNotificationManager.NOTIFICATION_ID, notification)
                    isInForeground = true
                }
            }
            is Call.Unregistered -> {
                Log.d(TAG, "[service] updateServiceState: Call unregistered, stopping service")
                notificationManager.updateCallNotification(call)

                if (isInForeground) {
                    stopForeground(STOP_FOREGROUND_REMOVE)
                    isInForeground = false
                }

                notificationManager.stopRingtone()
                stopSelf()
            }
            is Call.None -> {
                Log.d(TAG, "[service] updateServiceState: No active call, stopping audio loop")
                notificationManager.updateCallNotification(call)

                if (isInForeground) {
                    stopForeground(STOP_FOREGROUND_REMOVE)
                    isInForeground = false
                }
                notificationManager.stopRingtone()
            }
        }
    }

    override fun onIsCallAnswered(callId: String) {
        sendBroadcastEvent(CallingxModule.CALL_ANSWERED_ACTION) {
            putExtra(CallingxModule.EXTRA_CALL_ID, callId)
        }
    }

    override fun onIsCallDisconnected(callId: String?, cause: DisconnectCause) {
        // we're not passing the callId here to prevent infinite loops
        // callEnd event with callId will sent only when after interaction with notification buttons
        sendBroadcastEvent(CallingxModule.CALL_END_ACTION) {
            if (callId != null) {
                putExtra(CallingxModule.EXTRA_CALL_ID, callId)
            }
            putExtra(CallingxModule.EXTRA_DISCONNECT_CAUSE, getDisconnectCauseString(cause))
        }
    }

    override fun onIsCallInactive(callId: String) {
        sendBroadcastEvent(CallingxModule.CALL_INACTIVE_ACTION) {
            putExtra(CallingxModule.EXTRA_CALL_ID, callId)
        }
    }

    override fun onIsCallActive(callId: String) {
        sendBroadcastEvent(CallingxModule.CALL_ACTIVE_ACTION) {
            putExtra(CallingxModule.EXTRA_CALL_ID, callId)
        }
    }

    override fun onCallRegistered(callId: String) {
        Log.d(TAG, "[service] onCallRegistered: Call registered: $callId")
        sendBroadcastEvent(CallingxModule.CALL_REGISTERED_ACTION) {
            putExtra(CallingxModule.EXTRA_CALL_ID, callId)
        }
    }

    override fun onMuteCallChanged(callId: String, isMuted: Boolean) {
        Log.d(TAG, "[service] onMuteCallChanged: Call muted: $callId, $isMuted")
        sendBroadcastEvent(CallingxModule.CALL_MUTED_ACTION) {
            putExtra(CallingxModule.EXTRA_CALL_ID, callId)
            putExtra(CallingxModule.EXTRA_MUTED, isMuted)
        }
    }

    override fun onCallEndpointChanged(callId: String, endpoint: String) {
        Log.d(TAG, "[service] onCallEndpointChanged: Call endpoint changed: $callId, $endpoint")
        sendBroadcastEvent(CallingxModule.CALL_ENDPOINT_CHANGED_ACTION) {
            putExtra(CallingxModule.EXTRA_CALL_ID, callId)
            putExtra(CallingxModule.EXTRA_AUDIO_ENDPOINT, endpoint)
        }
    }

    public fun isCallRegistered(callId: String): Boolean {
        val currentCall = callRepository.currentCall.value
        return currentCall is Call.Registered && currentCall.id == callId
    }

    public fun processAction(action: CallAction) {
        Log.d(TAG, "[service] processAction: Processing action: ${action::class.simpleName}")
        val currentCall = callRepository.currentCall.value
        if (currentCall is Call.Registered) {
            currentCall.processAction(action)
        } else {
            Log.e(TAG, "[service] processAction: Call not registered, ignoring action")
        }
    }

    public fun startBackgroundTask(taskName: String, data: Bundle, timeout: Long) {
        Log.d(
                TAG,
                "[service] startBackgroundTask: Starting background task: $taskName, $data, $timeout"
        )
        headlessJSManager.startHeadlessTask(taskName, data, timeout)
    }

    public fun stopBackgroundTask() {
        Log.d(TAG, "[service] stopBackgroundTask: Stopping background task")
        headlessJSManager.stopHeadlessTask()
    }

    private fun registerCall(intent: Intent, incoming: Boolean) {
        Log.d(TAG, "[service] registerCall: ${if (incoming) "in" else "out"} call")

        // If we have an ongoing call ignore command
        if (callRepository.currentCall.value is Call.Registered) {
            Log.w(TAG, "[service] registerCall: Call already registered, ignoring new call request")
            return
        }

        val callId = intent.getStringExtra(EXTRA_CALL_ID)!!
        val name = intent.getStringExtra(EXTRA_NAME)!!
        val isVideo = intent.getBooleanExtra(EXTRA_IS_VIDEO, false)
        val uri =
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    intent.getParcelableExtra(EXTRA_URI, Uri::class.java)!!
                } else {
                    @Suppress("DEPRECATION") intent.getParcelableExtra(EXTRA_URI)!!
                }
        val displayOptions = intent.getBundleExtra(EXTRA_DISPLAY_OPTIONS)

        Log.d(TAG, "[service] registerCall: Call details - Name: $name, URI: $uri")

        scope.launch {
            callRepository.registerCall(
                    callId,
                    name,
                    uri,
                    incoming,
                    isVideo,
                    displayOptions,
            )
        }
    }

    private fun sendBroadcastEvent(action: String, applyParams: Intent.() -> Unit = {}) {
        val intent =
                Intent(action).apply {
                    setPackage(packageName)
                    applyParams(this)
                }
        Log.d(TAG, "[service] sendBroadcastEvent: Sending broadcast event: ${intent.action}")
        sendBroadcast(intent)
    }

    // private fun hasMicPermission(): Boolean {
    //     val hasPermission =
    //             PermissionChecker.checkSelfPermission(
    //                     this,
    //                     Manifest.permission.RECORD_AUDIO,
    //             ) == PermissionChecker.PERMISSION_GRANTED
    //     Log.d(TAG, "[service] hasMicPermission: Mic permission granted = $hasPermission")
    //     return hasPermission
    // }
}
