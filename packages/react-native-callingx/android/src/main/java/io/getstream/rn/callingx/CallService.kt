package io.getstream.rn.callingx

import android.Manifest
import android.app.Notification
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.net.Uri
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
import io.getstream.rn.callingx.utils.AudioEndpointUtils
import io.getstream.rn.callingx.utils.LifecycleListener
import io.getstream.rn.callingx.utils.SettingsStore
import java.util.concurrent.ConcurrentHashMap
import kotlinx.coroutines.CancellationException
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

        internal const val DEFAULT_DISPLAY_NAME = "Unknown Caller"

        internal const val EXTRA_CALL_ID = "extra_call_id"
        internal const val EXTRA_NAME = "extra_name"
        internal const val EXTRA_URI = "extra_uri"
        internal const val EXTRA_IS_VIDEO = "extra_is_video"
        internal const val EXTRA_DISPLAY_TITLE = "displayTitle"
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

        /**
         * True while a [CallService] instance exists. Only meaningful in-process (the service has
         * no `android:process`), and used to avoid creating the service just to stop it.
         */
        @Volatile internal var isRunning: Boolean = false

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

            val createdById = data["created_by_id"]
            val createdName = data["created_by_display_name"].orEmpty()
            val displayName = data["call_display_name"].orEmpty()
            val callDisplayName = displayName.ifEmpty { createdName.ifEmpty { DEFAULT_DISPLAY_NAME } }

            val isVideo = data["video"] == "true"

            CallRegistrationStore.trackCallRegistration(callCid, null)

            val intent =
                    Intent(context, CallService::class.java).apply {
                        action = ACTION_INCOMING_CALL
                        putExtra(EXTRA_CALL_ID, callCid)
                        putExtra(EXTRA_URI, createdById?.toUri() ?: callDisplayName.toUri())
                        putExtra(EXTRA_NAME, callDisplayName)
                        putExtra(EXTRA_IS_VIDEO, isVideo)
                    }

            try {
                ContextCompat.startForegroundService(context, intent)
            } catch (e: Exception) {
                // The call was tracked above so a concurrent stop request could not race it. If
                // the service never starts, drop the tracked id — a stale entry would block every
                // subsequent stop and strand the foreground service.
                Log.e(
                        TAG,
                        "[service] startIncomingCallFromPush: Failed to start service: ${e.message}",
                        e
                )
                CallRegistrationStore.removeTrackedCall(callCid)
            }
        }
    }

    private lateinit var headlessJSManager: HeadlessTaskManager
    private lateinit var notificationManager: CallNotificationManager
    private lateinit var callRepository: CallRepository

    private val scope: CoroutineScope = CoroutineScope(SupervisorJob())
    private val actionProcessingLock = Object()

    /**
     * Calls this instance has launched a registration for that have not reached the repository yet.
     * Scoped to the instance on purpose: it vetoes stopping the service, so a stale entry must die
     * with the instance rather than outlive it in process-global state.
     */
    private val registeringCallIds: MutableSet<String> = ConcurrentHashMap.newKeySet()

    @Volatile
    private var isInForeground = false

    /**
     * Start id of the most recently *delivered* start command. ActivityManager bumps its own last
     * start id when `startService` is called, before delivery, so passing this to [stopSelfResult]
     * makes any stop lose against a start that is already queued.
     */
    @Volatile
    private var lastStartId = 0

    private val onAppForeground = Runnable { repromoteForegroundTypeIfNeeded() }

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
        callRepository = CallRepositoryFactory.create(applicationContext)
        callRepository.setListener(this)
        // Constructed after callRepository: onTaskFinished reads it, and a task can only finish
        // after onStartCommand has started one.
        headlessJSManager =
                HeadlessTaskManager(applicationContext) { stopServiceIfIdle(lastStartId) }

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

        LifecycleListener.addOnForegroundListener(onAppForeground)

        isRunning = true
    }

    override fun onDestroy() {
        super.onDestroy()
        debugLog(TAG, "[service] onDestroy: TelecomCallService destroyed")

        isRunning = false

        LifecycleListener.removeOnForegroundListener(onAppForeground)

        unregisterReceiver(optimisticNotificationReceiver)

        demoteForeground()

        notificationManager.cancelAllNotifications()
        notificationManager.stopRingtone()
        callRepository.release()
        headlessJSManager.release()

        scope.cancel()
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
        debugLog(TAG, "[service] onTaskRemoved: Task removed")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        debugLog(TAG, "[service] onStartCommand: Received intent with action: ${intent?.action}")

        lastStartId = startId

        if (intent == null || intent.action == null) {
            Log.w(TAG, "[service] onStartCommand: Intent is null, returning START_NOT_STICKY")
            stopServiceIfIdle(startId)
            return START_NOT_STICKY
        }

        when (intent.action) {
            ACTION_INCOMING_CALL -> {
                registerCall(intent, true)
                headlessJSManager.ensureReactContext()
            }
            ACTION_OUTGOING_CALL -> {
                registerCall(intent, false)
            }
            ACTION_START_BACKGROUND_TASK -> {
                startBackgroundTask(intent)
            }
            ACTION_STOP_BACKGROUND_TASK -> {
                stopBackgroundTask()
            }
            ACTION_UPDATE_CALL -> {
                updateCall(intent)
            }
            ACTION_PROCESS_ACTION -> {
                processAction(intent)
            }
            ACTION_STOP_SERVICE -> {
                stopServiceIfIdle(startId)
            }
            else -> {
                Log.e(TAG, "[service] onStartCommand: Unknown action: ${intent.action}")
                stopServiceIfIdle(startId)
            }
        }

        return START_NOT_STICKY
    }

    /** Started-only service: nothing binds to it. */
    override fun onBind(intent: Intent): IBinder? = null

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
                    // Recovery path: a registered call changed state while the service is not
                    // foreground (e.g. an earlier promote failed, or we demoted after a failed
                    // re-anchor). Promote here so the call keeps an FGS anchor.
                    val notification = notificationManager.createNotification(callId, call)
                    startForegroundSafely(callId, notificationId, notification)
                }
            }
            is Call.None, is Call.Unregistered -> {
                CallRegistrationStore.removeTrackedCall(callId)
                AudioEndpointStore.clear(callId)
                repromoteForegroundIfNeeded(callId)
                if (!callRepository.hasRingingCall()) notificationManager.stopRingtone()

                stopServiceIfIdle(lastStartId)
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
        // The repository now reports this call, so hasAnyCalls() takes over the veto. This has to
        // happen here rather than when registerCall returns: that only happens once the call has
        // already been removed and Call.None has run the stop check.
        registeringCallIds.remove(callId)

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

    override fun onCallAudioEndpointsChanged(callId: String) {
        val call = callRepository.getCall(callId) ?: return
        val snapshotJson =
                AudioEndpointUtils.snapshotJson(
                        call.currentCallEndpoint,
                        call.availableCallEndpoints,
                )
        AudioEndpointStore.setSnapshot(callId, snapshotJson)

        sendBroadcastEvent(CallingxModuleImpl.CALL_AUDIO_ENDPOINTS_CHANGED_ACTION) {
            putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callId)
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

        startForegroundForCall(callInfo, incoming)

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

        registeringCallIds.add(callInfo.callId)

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
            } catch (e: CancellationException) {
                // Swallow cancellation: nothing runs after this catch, and nobody awaits this launch.
                debugLog(
                        TAG,
                        "[service] registerCall: Registration canceled for ${callInfo.callId} during teardown"
                )
                // The call never made it into the repository, so nothing else will drop its tracked
                // id — and a stale one wrongly marks the user as busy for later pushes.
                CallRegistrationStore.removeTrackedCall(callInfo.callId)
                registeringCallIds.remove(callInfo.callId)
            } catch (e: Exception) {
                Log.e(TAG, "[service] registerCall: Error registering call: ${e.message}")

                sendBroadcastEvent(CallingxModuleImpl.CALL_REGISTRATION_FAILED_ACTION) {
                    putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callInfo.callId)
                }

                // CallingxModuleImpl also drops the tracked id when it receives the broadcast
                // above, but only if a JS module instance is alive — which it need not be in a
                // headless push flow. Removing it here too is idempotent.
                CallRegistrationStore.removeTrackedCall(callInfo.callId)
                registeringCallIds.remove(callInfo.callId)

                repromoteForegroundIfNeeded(callInfo.callId)

                stopServiceIfIdle(lastStartId)
            } finally {
                // Backstop for a registration that neither threw nor reached onCallRegistered.
                // A no-op otherwise: the handover happens there, long before registerCall returns.
                registeringCallIds.remove(callInfo.callId)
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

    /**
     * The only place this service stops itself. Callers are asking, not telling: the service hosts
     * every call, so it may only go down once nothing needs it.
     *
     * Each check catches a new call at a different stage, so none is enough alone:
     * - `hasAnyCalls` — registered in the repository.
     * - `registeringCallIds` — this instance launched a registration that has not landed yet.
     *   Registration spends up to 1.5s resolving Telecom endpoints before the repository sees it.
     * - `hasActiveTask` — JS still holds a keep-alive owner; stopping would end its task early.
     * - [stopSelfResult] — a newer start is already queued. ActivityManager bumps its last start id
     *   when `startService` is called, before we see the intent.
     *
     * Teardown is [onDestroy]'s job, which always runs since nothing binds here. Demoting from the
     * foreground here would also drop a still-valid anchor when the stop is refused.
     */
    private fun stopServiceIfIdle(startId: Int) {
        if (callRepository.hasAnyCalls() ||
                        registeringCallIds.isNotEmpty() ||
                        headlessJSManager.hasActiveTask()
        ) {
            debugLog(
                    TAG,
                    "[service] stopServiceIfIdle: Still in use (registering=$registeringCallIds, activeTask=${headlessJSManager.hasActiveTask()}), keeping service alive"
            )
            return
        }

        if (!stopSelfResult(startId)) {
            Log.w(
                    TAG,
                    "[service] stopServiceIfIdle: Stop refused (startId=$startId), a newer start is pending"
            )
        }
    }

    private fun demoteForeground() {
        if (!isInForeground) return
        debugLog(TAG, "[service] demoteForeground: leaving foreground")
        stopForeground(STOP_FOREGROUND_REMOVE)
        isInForeground = false
        notificationManager.clearAnchor()
    }

    /**
     * Promotes the service using [callId]'s notification, and records the resulting FGS anchor.
     *
     * @return true when the platform accepted the promotion. On failure the recorded anchor is left
     *   untouched: a previously valid anchor must not be discarded because a new promote failed.
     */
    private fun startForegroundSafely(
            callId: String,
            notificationId: Int,
            notification: Notification,
    ): Boolean {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(notificationId, notification, computeForegroundServiceType())
            } else {
                startForeground(notificationId, notification)
            }
            isInForeground = true
            notificationManager.commitAnchor(callId, notification)
            true
        } catch (e: Exception) {
            Log.e(
                    TAG,
                    "[service] startForegroundSafely: Failed to start foreground service: ${e.message}",
                    e
            )
            false
        }
    }

    /**
     * Always includes `phoneCall`. Adds the while-in-use types `microphone`/`camera` only when:
     *  - the platform is Android 11+ (R) — these FGS types were added in API 30; passing them to
     *    startForeground() on older versions is unsupported, so we keep `phoneCall`-only there, AND
     *  - the corresponding runtime permission is granted, AND
     *  - the app currently holds while-in-use access (foreground).
     */
    private fun computeForegroundServiceType(): Int {
        var type = ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL

        // microphone/camera FGS types require API 30 (R) — keep phoneCall-only below it.
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            return type
        }
        if (!LifecycleListener.isInForeground) {
            return type
        }

        val hasMicPermission =
                ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) ==
                        PackageManager.PERMISSION_GRANTED
        if (hasMicPermission) {
            type = type or ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
        }

        val hasCameraPermission =
                ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) ==
                        PackageManager.PERMISSION_GRANTED
        if (hasCameraPermission) {
            type = type or ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA
        }

        return type
    }

    /**
     * Re-issues [startForeground] for the current foreground call with the full
     * [computeForegroundServiceType] bitmask. Called when the app enters the foreground (via
     * [LifecycleListener]) so the microphone/camera types — which cannot be acquired from the
     * background — get activated during the foreground window and then persist when backgrounded.
     *
     * This does NOT recreate the service: calling startForeground again on a running FGS only
     * updates its active type and notification in place.
     */
    private fun repromoteForegroundTypeIfNeeded() {
        if (!isInForeground) return // service is not foreground yet — nothing to upgrade
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return

        if (computeForegroundServiceType() == ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL) {
            // Nothing extra to promote (no while-in-use permissions, or not foreground).
            return
        }

        val foregroundCallId = notificationManager.getForegroundCallId() ?: return
        val notification = notificationManager.lastPostedNotification(foregroundCallId)
        if (notification == null) {
            Log.w(
                    TAG,
                    "[service] repromoteForegroundType: nothing posted for anchor $foregroundCallId"
            )
            return
        }

        // Deliberately ignoring the result: a failed type upgrade leaves a valid FGS on the previous,
        // narrower type. Unlike repromoteForegroundIfNeeded, this must NOT demote.
        startForegroundSafely(
                foregroundCallId,
                notificationManager.getOrCreateNotificationId(foregroundCallId),
                notification,
        )
    }

    /**
     * Cancels the notification for [callId]. If that notification was the foreground one
     * and other calls remain, re-promotes the service with the next call's notification.
     */
    private fun repromoteForegroundIfNeeded(callId: String) {
        val wasAnchor = notificationManager.getForegroundCallId() == callId
        if (!isInForeground || !wasAnchor) {
            debugLog(TAG, "[service] repromoteForegroundIfNeeded: Another call still holds the anchor, not re-anchoring")
            notificationManager.cancelNotification(callId)
            return
        }

        val next = notificationManager.nextAnchorCandidate(excluding = callId)
        val anchored =
                if (next == null) {
                    debugLog(TAG, "[service] repromoteForegroundIfNeeded: No next anchor candidate, not re-anchoring")
                    false
                } else {
                    debugLog(
                            TAG,
                            "[service] repromoteForegroundIfNeeded: Re-anchoring to ${next.callId} (notificationId=${next.notificationId})"
                    )
                    startForegroundSafely(next.callId, next.notificationId, next.notification)
                }

        if (!anchored) {
            // Nothing to anchor to, or the promote failed. Never leave isInForeground claiming an
            // anchor we do not have — that is what surfaces later as
            // SecurityException: Invalid FGS notification.
            debugLog(TAG, "[service] repromoteForegroundIfNeeded: No anchor available, demoting")
            demoteForeground()
        }

        notificationManager.cancelNotification(callId)
    }

    private fun startForegroundForCall(callInfo: CallInfo, incoming: Boolean) {
        val tempCall = callRepository.getCall(callInfo.callId)
          ?: callRepository.getTempCall(callInfo, incoming)
        val notificationId = notificationManager.getOrCreateNotificationId(callInfo.callId)
        if (!isInForeground) {
            debugLog(
                    TAG,
                    "[service] registerCall: Starting foreground for call: ${callInfo.callId}"
            )
            val notification = notificationManager.createNotification(callInfo.callId, tempCall)
            startForegroundSafely(callInfo.callId, notificationId, notification)
        } else if (!notificationManager.isNotificationPosted(callInfo.callId)) {
            // Post only when this call has no notification yet (e.g. a second concurrent call).
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
