package io.getstream.rn.callingx

import android.app.Notification
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.net.Uri
import android.os.Binder
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.telecom.DisconnectCause
import android.util.Log
import io.getstream.rn.callingx.model.Call
import io.getstream.rn.callingx.model.CallAction
import io.getstream.rn.callingx.notifications.CallNotificationManager
import io.getstream.rn.callingx.repo.CallRepository
import io.getstream.rn.callingx.repo.CallRepositoryFactory
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
        internal const val ACTION_REGISTRATION_FAILED = "registration_failed"
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
        debugLog(TAG, "[service] onCreate: TelecomCallService created")

        notificationManager = CallNotificationManager(applicationContext)
        headlessJSManager = HeadlessTaskManager(applicationContext)
        callRepository = CallRepositoryFactory.create(applicationContext)
        callRepository.setListener(this)

        sendBroadcastEvent(CallingxModuleImpl.SERVICE_READY_ACTION)
    }

    override fun onDestroy() {
        super.onDestroy()
        debugLog(TAG, "[service] onDestroy: TelecomCallService destroyed")

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
        debugLog(TAG, "[service] onTaskRemoved: Task removed")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        debugLog(TAG, "[service] onStartCommand: Received intent with action: ${intent?.action}")

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
                    debugLog(TAG, "[service] onStartCommand: Starting foreground for background task")
                    // for now bg task is intended to be used after a call registered and
                    // notification is shown, so we don't need to show a separate notification for
                    // bg task
                    // startForeground(CallNotificationManager.NOTIFICATION_ID, notification)
                    // isInForeground = true
                }

                startBackgroundTask(intent)
            }
            ACTION_STOP_BACKGROUND_TASK -> {
                stopBackgroundTask()
            }
            ACTION_UPDATE_CALL -> {
                updateCall(intent)
            }
            else -> {
                Log.e(TAG, "[service] onStartCommand: Unknown action: ${intent.action}")
                stopSelf()
                return START_NOT_STICKY
            }
        }

        return START_STICKY
    }

    override fun onBind(intent: Intent): IBinder? = binder

    override fun onUnbind(intent: Intent): Boolean {
        debugLog(TAG, "[service] onUnbind: Service unbound")
        return super.onUnbind(intent)
    }

    override fun onCallStateChanged(call: Call) {
        debugLog(TAG, "[service] onCallStateChanged: Call state changed: ${call::class.simpleName}")
        when (call) {
            is Call.Registered -> {
                debugLog(
                        TAG,
                        "[service] updateServiceState: Call registered - Active: ${call.isActive}, OnHold: ${call.isOnHold}, Muted: ${call.isMuted}"
                )

                if (call.isIncoming()) {
                    if (!call.isActive) notificationManager.startRingtone()
                    else notificationManager.stopRingtone()
                }
                // Update the call state.
                if (isInForeground) {
                    notificationManager.updateCallNotification(call)
                } else {
                    debugLog(
                            TAG,
                            "[service] updateServiceState: Fallback starting foreground for call: ${call.id}"
                    )
                    //fallback if for some reason startForeground method is not called in onStartCommand method
                    val notification = notificationManager.createNotification(call)
                    startForegroundSafely(notification)
                }
            }
            is Call.Unregistered -> {
                notificationManager.updateCallNotification(call)

                if (isInForeground) {
                    stopForeground(STOP_FOREGROUND_REMOVE)
                    isInForeground = false
                }

                notificationManager.stopRingtone()
                stopSelf()
            }
            is Call.None -> {
                notificationManager.updateCallNotification(call)

                if (isInForeground) {
                    stopForeground(STOP_FOREGROUND_REMOVE)
                    isInForeground = false
                }
                notificationManager.stopRingtone()
            }
        }
    }

    override fun onIsCallAnswered(callId: String, source: CallRepository.EventSource) {
        sendBroadcastEvent(CallingxModuleImpl.CALL_ANSWERED_ACTION) {
            putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callId)
            putExtra(CallingxModuleImpl.EXTRA_SOURCE, source.name.lowercase())
        }
    }

    override fun onIsCallDisconnected(
            callId: String?,
            cause: DisconnectCause,
            source: CallRepository.EventSource
    ) {
        // we're not passing the callId here to prevent infinite loops
        // callEnd event with callId will sent only when after interaction with notification buttons
        sendBroadcastEvent(CallingxModuleImpl.CALL_END_ACTION) {
            if (callId != null) {
                putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callId)
            }
            putExtra(CallingxModuleImpl.EXTRA_DISCONNECT_CAUSE, getDisconnectCauseString(cause))
            putExtra(CallingxModuleImpl.EXTRA_SOURCE, source.name.lowercase())
        }
    }

    override fun onIsCallInactive(callId: String) {
        sendBroadcastEvent(CallingxModuleImpl.CALL_INACTIVE_ACTION) {
            putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callId)
        }
    }

    override fun onIsCallActive(callId: String) {
        sendBroadcastEvent(CallingxModuleImpl.CALL_ACTIVE_ACTION) {
            putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callId)
        }
    }

    override fun onCallRegistered(callId: String, incoming: Boolean) {
        if (incoming) {
            sendBroadcastEvent(CallingxModuleImpl.CALL_REGISTERED_INCOMING_ACTION) {
                putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callId)
            }
        } else {
            sendBroadcastEvent(CallingxModuleImpl.CALL_REGISTERED_ACTION) {
                putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callId)
            }
        }
    }

    override fun onMuteCallChanged(callId: String, isMuted: Boolean) {
        sendBroadcastEvent(CallingxModuleImpl.CALL_MUTED_ACTION) {
            putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callId)
            putExtra(CallingxModuleImpl.EXTRA_MUTED, isMuted)
        }
    }

    override fun onCallEndpointChanged(callId: String, endpoint: String) {
        sendBroadcastEvent(CallingxModuleImpl.CALL_ENDPOINT_CHANGED_ACTION) {
            putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callId)
            putExtra(CallingxModuleImpl.EXTRA_AUDIO_ENDPOINT, endpoint)
        }
    }

    public fun hasRegisteredCall(): Boolean {
        val currentCall = callRepository.currentCall.value
        return currentCall is Call.Registered
    }

    public fun processAction(callId: String, action: CallAction) {
        debugLog(TAG, "[service] processAction: Processing action: ${action::class.simpleName}")
        val currentCall = callRepository.currentCall.value
        if (currentCall is Call.Registered && currentCall.id == callId) {
            currentCall.processAction(action)
        } else {
            Log.e(
                    TAG,
                    "[service] processAction: Call not registered or not the current call, ignoring action"
            )
        }
    }

    public fun startBackgroundTask(intent: Intent) {
        val taskName = intent.getStringExtra(EXTRA_TASK_NAME)!!
        val data = intent.getBundleExtra(EXTRA_TASK_DATA)!!
        val timeout = intent.getLongExtra(EXTRA_TASK_TIMEOUT, 0)
        headlessJSManager.startHeadlessTask(taskName, data, timeout)
    }

    public fun stopBackgroundTask() {
        headlessJSManager.stopHeadlessTask()
    }

    private fun registerCall(intent: Intent, incoming: Boolean) {
        debugLog(TAG, "[service] registerCall: ${if (incoming) "in" else "out"} call")
        val callInfo = extractIntentParams(intent)

        // If we have an ongoing call, notify the module that registration is
        // already done (so the pending promise resolves) and skip re-registration.
        if (callRepository.currentCall.value is Call.Registered) {
            Log.w(TAG, "[service] registerCall: Call already registered, ignoring new call request")
            if (incoming) {
                sendBroadcastEvent(CallingxModuleImpl.CALL_REGISTERED_INCOMING_ACTION) {
                    putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callInfo.callId)
                }
            } else {
                sendBroadcastEvent(CallingxModuleImpl.CALL_REGISTERED_ACTION) {
                    putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callInfo.callId)
                }
            }
            return
        }
        val tempCall = callRepository.getTempCall(callInfo, incoming)

        //it is better to invoke startForeground method synchronously inside onStartCommand method
        if (!isInForeground) {
            debugLog(
                    TAG,
                    "[service] registerCall: Starting foreground for call: ${callInfo.callId}"
            )
            val notification = notificationManager.createNotification(tempCall)
            startForegroundSafely(notification)
        }

        scope.launch {
            try {
                callRepository.registerCall(
                        callInfo.callId,
                        callInfo.name,
                        callInfo.uri,
                        incoming,
                        callInfo.isVideo,
                        callInfo.displayOptions,
                )
            } catch (e: Exception) {
                Log.e(TAG, "[service] registerCall: Error registering call: ${e.message}")

                sendBroadcastEvent(CallingxModuleImpl.CALL_REGISTRATION_FAILED_ACTION) {
                    putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callInfo.callId)
                }

                if (isInForeground) {
                    stopForeground(STOP_FOREGROUND_REMOVE)
                    isInForeground = false
                }

                notificationManager.cancelNotifications()
                notificationManager.stopRingtone()
                stopSelf()
            }
        }
    }

    private fun startForegroundSafely(notification: Notification) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(
                        CallNotificationManager.NOTIFICATION_ID,
                        notification,
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL
                )
            } else {
                startForeground(CallNotificationManager.NOTIFICATION_ID, notification)
            }
            isInForeground = true
        } catch (e: Exception) {
            // If starting the foreground service fails (for example due to background start
            // restrictions or notification issues), we log the error but avoid crashing the
            // process so the rest of the call flow can continue and be recovered by Telecom.
            Log.e(
                    TAG,
                    "[service] startForegroundSafely: Failed to start foreground service: ${e.message}",
                    e
            )
        }
    }

    private fun updateCall(intent: Intent) {
        val callInfo = extractIntentParams(intent)
        callRepository.updateCall(
                callInfo.callId,
                callInfo.name,
                callInfo.uri,
                callInfo.isVideo,
                callInfo.displayOptions
        )
    }

    private fun extractIntentParams(intent: Intent): CallInfo {
        val callId = intent.getStringExtra(EXTRA_CALL_ID)!!
        val name = intent.getStringExtra(EXTRA_NAME)!!
        val uri =
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    intent.getParcelableExtra(EXTRA_URI, Uri::class.java)!!
                } else {
                    @Suppress("DEPRECATION") intent.getParcelableExtra(EXTRA_URI)!!
                }
        val isVideo = intent.getBooleanExtra(EXTRA_IS_VIDEO, false)
        val displayOptions = intent.getBundleExtra(EXTRA_DISPLAY_OPTIONS)

        return CallInfo(callId, name, uri, isVideo, displayOptions)
    }

    private fun sendBroadcastEvent(action: String, applyParams: Intent.() -> Unit = {}) {
        val intent =
                Intent(action).apply {
                    setPackage(packageName)
                    applyParams(this)
                }
        sendBroadcast(intent)
    }

    data class CallInfo(
            val callId: String,
            val name: String,
            val uri: Uri,
            val isVideo: Boolean,
            val displayOptions: Bundle?,
    )
}
