package io.getstream.rn.callingx

import android.app.Notification
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ServiceInfo
import android.net.Uri
import android.os.Binder
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.telecom.DisconnectCause
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.core.net.toUri
import io.getstream.rn.callingx.model.Call
import io.getstream.rn.callingx.model.CallAction
import io.getstream.rn.callingx.notifications.CallNotificationManager
import io.getstream.rn.callingx.notifications.NotificationChannelsManager
import io.getstream.rn.callingx.notifications.NotificationsConfig
import io.getstream.rn.callingx.repo.CallRepository
import io.getstream.rn.callingx.repo.CallRepositoryFactory
import io.getstream.rn.callingx.utils.SettingsStore
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
        internal const val EXTRA_ACTION = "action_name"
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
        internal const val ACTION_PROCESS_ACTION = "execute_action"
        internal const val ACTION_REGISTRATION_FAILED = "registration_failed"

        fun startIncomingCallFromPush(context: Context, data: Map<String, String>) {
            debugLog(TAG, "[service] startIncomingCallFromPush: Starting incoming call from push")

            // Check if we are allowed to post call notifications (moved from JS layer).
            val notificationsConfig = NotificationsConfig.loadNotificationsConfig(context)
            val notificationChannelsManager =
                    NotificationChannelsManager(context).apply {
                        setNotificationsConfig(notificationsConfig)
                    }
            val notificationStatus = notificationChannelsManager.getNotificationStatus()
            if (!notificationStatus.canPost) {
                debugLog(
                        TAG,
                        "[service] startIncomingCallFromPush: Cannot post notifications, skipping incoming call"
                )
                return
            }

            val shouldRejectCallWhenBusy = SettingsStore.shouldRejectCallWhenBusy(context)
            if (shouldRejectCallWhenBusy && CallRegistrationStore.hasRegisteredCall()) {
                debugLog(
                        TAG,
                        "[service] startIncomingCallFromPush: Registered call found and rejectCallWhenBusy is enabled, skipping incoming call"
                )
                return
            }

            val callCid = data["call_cid"]
            if (callCid.isNullOrEmpty()) {
                debugLog(
                        TAG,
                        "[service] startIncomingCallFromPush: Call CID is null or empty, skipping"
                )
                return
            }

            val callName = data["created_by_display_name"].orEmpty()
            val isVideo = data["video"] == "true"

            CallRegistrationStore.trackCallRegistration(callCid, null)

            val intent =
                    Intent(context, CallService::class.java).apply {
                        action = ACTION_INCOMING_CALL
                        putExtra(EXTRA_CALL_ID, callCid)
                        putExtra(EXTRA_URI, callCid.toUri())
                        putExtra(EXTRA_NAME, callName)
                        putExtra(EXTRA_IS_VIDEO, isVideo)
                    }

            ContextCompat.startForegroundService(context, intent)
        }
    }

    inner class CallServiceBinder : Binder() {
        fun getService(): CallService = this@CallService
    }

    private lateinit var headlessJSManager: HeadlessTaskManager
    private lateinit var notificationManager: CallNotificationManager
    private lateinit var callRepository: CallRepository

    private val binder = CallServiceBinder()
    private val scope: CoroutineScope = CoroutineScope(SupervisorJob())
    private val actionProcessingLock = Object()

    private var isInForeground = false

    private val optimisticNotificationReceiver =
            object : BroadcastReceiver() {
                override fun onReceive(context: Context, intent: Intent) {
                    val callId = intent.getStringExtra(CallingxModuleImpl.EXTRA_CALL_ID) ?: return
                    when (intent.action) {
                        CallingxModuleImpl.CALL_OPTIMISTIC_ACCEPT_ACTION -> {
                            debugLog(
                                    TAG,
                                    "[service] optimisticReceiver: Optimistic accept for $callId"
                            )
                            notificationManager.stopRingtone()
                            notificationManager.setOptimisticState(
                                    callId,
                                    CallNotificationManager.OptimisticState.ACCEPTING
                            )
                            val call = callRepository.getCall(callId)
                            if (call != null) {
                                notificationManager.updateCallNotification(callId, call)
                            }
                        }
                        CallingxModuleImpl.CALL_END_ACTION -> {
                            val source = intent.getStringExtra(CallingxModuleImpl.EXTRA_SOURCE)
                            val cause =
                                    intent.getStringExtra(CallingxModuleImpl.EXTRA_DISCONNECT_CAUSE)
                            val rejectedCause =
                                    getDisconnectCauseString(
                                            DisconnectCause(DisconnectCause.REJECTED)
                                    )
                            val call = callRepository.getCall(callId)

                            val isSysSource =
                                    source == CallRepository.EventSource.SYS.name.lowercase()

                            // we handle optimistic updates only if incoming call (non-answered) was rejected within notification action
                            if (!isSysSource ||
                                            cause != rejectedCause ||
                                            call == null ||
                                            !call.isIncoming() ||
                                            call.isActive
                            ) {
                              debugLog(
                                TAG,
                                "[service] optimisticReceiver: Skipping optimistic reject for $callId"
                              )
                                return
                            }

                            debugLog(
                                    TAG,
                                    "[service] optimisticReceiver: Optimistic reject for $callId"
                            )
                            notificationManager.stopRingtone()
                            notificationManager.setOptimisticState(
                                    callId,
                                    CallNotificationManager.OptimisticState.REJECTING
                            )
                            notificationManager.updateCallNotification(callId, call)
                        }
                    }
                }
            }

    override fun onCreate() {
        super.onCreate()
        debugLog(TAG, "[service] onCreate: TelecomCallService created")

        notificationManager = CallNotificationManager(applicationContext)
        headlessJSManager = HeadlessTaskManager(applicationContext)
        callRepository = CallRepositoryFactory.create(applicationContext)
        callRepository.setListener(this)

        val filter =
                IntentFilter().apply {
                    addAction(CallingxModuleImpl.CALL_OPTIMISTIC_ACCEPT_ACTION)
                    addAction(CallingxModuleImpl.CALL_END_ACTION)
                }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(optimisticNotificationReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            @Suppress("UnspecifiedRegisterReceiverFlag")
            registerReceiver(optimisticNotificationReceiver, filter)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        debugLog(TAG, "[service] onDestroy: TelecomCallService destroyed")

        unregisterReceiver(optimisticNotificationReceiver)

        notificationManager.cancelAllNotifications()
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
                startBackgroundTask(intent)
                return START_NOT_STICKY
            }
            ACTION_STOP_BACKGROUND_TASK -> {
                stopBackgroundTask()
                return START_NOT_STICKY
            }
            ACTION_UPDATE_CALL -> {
                updateCall(intent)
            }
            ACTION_PROCESS_ACTION -> {
                processAction(intent)
            }
            ACTION_STOP_SERVICE -> {
                if (isInForeground) {
                    stopForeground(STOP_FOREGROUND_REMOVE)
                    isInForeground = false
                }
                notificationManager.cancelAllNotifications()
                notificationManager.stopRingtone()
                stopSelf()
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

    override fun onCallStateChanged(callId: String, call: Call) {
        debugLog(
                TAG,
                "[service] onCallStateChanged[$callId]: Call state changed: ${call::class.simpleName}"
        )
        when (call) {
            is Call.Registered -> {
                debugLog(
                        TAG,
                        "[service] onCallStateChanged[$callId]: Call registered - Active: ${call.isActive}, OnHold: ${call.isOnHold}, Muted: ${call.isMuted}"
                )

                val shouldStopExecution = processPendingActions(call)
                if (shouldStopExecution) {
                    return
                }

                if (call.isIncoming()) {
                    // Play ringtone only if there is no active call
                    if (!call.isActive && !callRepository.hasActiveCall(excludeCallId = callId)) {
                        notificationManager.startRingtone()
                    } else {
                        notificationManager.stopRingtone()
                    }
                }
                // Update the call notification
                val notificationId = notificationManager.getOrCreateNotificationId(callId)
                if (isInForeground) {
                    notificationManager.updateCallNotification(callId, call)
                } else {
                    debugLog(
                            TAG,
                            "[service] onCallStateChanged[$callId]: Starting foreground for call"
                    )
                    notificationManager.resetOptimisticState(callId)
                    val notification = notificationManager.createNotification(callId, call)
                    startForegroundSafely(notificationId, notification)
                }
            }
            is Call.None, is Call.Unregistered -> {
                repromoteForegroundIfNeeded(callId)
                if (!callRepository.hasRingingCall()) notificationManager.stopRingtone()

                // Stop service only when no calls remain
                if (!callRepository.hasAnyCalls()) {
                    debugLog(
                            TAG,
                            "[service] onCallStateChanged[$callId]: No more calls, stopping service"
                    )
                    if (isInForeground) {
                        stopForeground(STOP_FOREGROUND_REMOVE)
                        isInForeground = false
                    }
                    stopSelf()
                }
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

    fun processAction(intent: Intent) {
        val callId = intent.getStringExtra(EXTRA_CALL_ID) ?: return
        val action = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
          intent.getParcelableExtra(EXTRA_ACTION, CallAction::class.java)
        } else {
          @Suppress("DEPRECATION") intent.getParcelableExtra(EXTRA_ACTION)
        } ?: return

        processAction(callId, action)
    }

    fun processAction(callId: String, action: CallAction) {
        debugLog(
                TAG,
                "[service] processAction[$callId]: Processing action: ${action::class.simpleName}"
        )
        synchronized(actionProcessingLock) {
            val call = callRepository.getCall(callId)
            if (call != null && !call.isPending) {
                call.processAction(action)
            } else {
                // this solves race condition, when action is requested before the call is
                // registered in Telecom
              debugLog(
                             TAG,
                             "[service] processAction: Add pending action for ${call?.id} to queue"
                     )
                CallRegistrationStore.addPendingAction(callId, action)
            }
        }
    }

    fun startBackgroundTask(intent: Intent) {
        val taskName = intent.getStringExtra(EXTRA_TASK_NAME)!!
        val data = intent.getBundleExtra(EXTRA_TASK_DATA)!!
        val timeout = intent.getLongExtra(EXTRA_TASK_TIMEOUT, 0)
        headlessJSManager.startHeadlessTask(taskName, data, timeout)
    }

    fun stopBackgroundTask() {
        headlessJSManager.stopHeadlessTask()
    }

    private fun registerCall(intent: Intent, incoming: Boolean) {
        debugLog(TAG, "[service] registerCall: ${if (incoming) "in" else "out"} call")

        val callInfo = extractIntentParams(intent)

        // If this specific call is already registered, just notify
        val existingCall = callRepository.getCall(callInfo.callId)
        if (existingCall != null) {
            Log.w(
                    TAG,
                    "[service] registerCall: Call ${callInfo.callId} already registered, notifying"
            )
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

        startForegroundForCall(callInfo, incoming)

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

                repromoteForegroundIfNeeded(callInfo.callId)

                // Only stop foreground/service when no other calls remain
                if (!callRepository.hasAnyCalls()) {
                    if (isInForeground) {
                        stopForeground(STOP_FOREGROUND_REMOVE)
                        isInForeground = false
                    }
                    notificationManager.stopRingtone()
                    stopSelf()
                }
            }
        }
    }

    private fun processPendingActions(call: Call.Registered): Boolean {
        synchronized(actionProcessingLock) {
            val pendingActions = CallRegistrationStore.takePendingActions(call.id)

            val disconnectAction = pendingActions.find { it is CallAction.Disconnect }
            if (disconnectAction != null) {
                // if queue contains Disconnect, execute it and ignore rest of the queue
                debugLog(TAG, "[service] processPendingActions: Executing pending disconnect for ${call.id}")
                call.processAction(disconnectAction)
                return true
            }

            // process pending actions in the order they were added
            for (action in pendingActions) {
                call.processAction(action)
                debugLog(
                             TAG,
                             "[service] processPendingActions: Executing pending action: $action for ${call.id}"
                     )
            }

            return false
        }
    }

    private fun startForegroundSafely(notificationId: Int, notification: Notification) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(
                        notificationId,
                        notification,
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL
                )
            } else {
                startForeground(notificationId, notification)
            }
            isInForeground = true
        } catch (e: Exception) {
            Log.e(
                    TAG,
                    "[service] startForegroundSafely: Failed to start foreground service: ${e.message}",
                    e
            )
        }
    }

    /**
     * Cancels the notification for [callId]. If that notification was the foreground one
     * and other calls remain, re-promotes the service with the next call's notification.
     */
    private fun repromoteForegroundIfNeeded(callId: String) {
        val newForegroundNotificationId = notificationManager.cancelNotification(callId)
        if (newForegroundNotificationId != null && isInForeground) {
            val newForegroundCallId = notificationManager.getForegroundCallId()
            val call = if (newForegroundCallId != null) callRepository.getCall(newForegroundCallId) else null
            if (call != null && newForegroundCallId != null) {
                debugLog(TAG, "[service] repromoteForegroundIfNeeded: Re-promoting with call $newForegroundCallId (notificationId=$newForegroundNotificationId)")
                val notification = notificationManager.createNotification(newForegroundCallId, call)
                startForegroundSafely(newForegroundNotificationId, notification)
            }
        }
    }

    private fun startForegroundForCall(callInfo: CallInfo, incoming: Boolean) {
        val tempCall = callRepository.getTempCall(callInfo, incoming)
        val notificationId = notificationManager.getOrCreateNotificationId(callInfo.callId)
        if (!isInForeground) {
            debugLog(
                    TAG,
                    "[service] registerCall: Starting foreground for call: ${callInfo.callId}"
            )
            val notification = notificationManager.createNotification(callInfo.callId, tempCall)
            startForegroundSafely(notificationId, notification)
        } else {
            // Already in foreground from another call — just post the notification
            val notification = notificationManager.createNotification(callInfo.callId, tempCall)
            notificationManager.postNotification(callInfo.callId, notification)
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
