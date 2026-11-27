package io.getstream.rn.callingx

import android.app.Notification
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ServiceInfo
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.telecom.DisconnectCause
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.core.content.IntentCompat
import io.getstream.rn.callingx.model.CallAction
import io.getstream.rn.callingx.notifications.CallNotificationManager
import io.getstream.rn.callingx.notifications.NotificationChannelsManager
import io.getstream.rn.callingx.notifications.NotificationsConfig
import io.getstream.rn.callingx.repo.CallRepository
import io.getstream.rn.callingx.utils.ForegroundServiceTypes
import io.getstream.rn.callingx.utils.LifecycleListener
import io.getstream.rn.callingx.utils.SettingsStore
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.launch

/**
 * Hosts native call registration coroutines, foreground execution, and HeadlessJS background work.
 * Call requests from the app or incoming push notifications can start this service. Shared call
 * resources belong to [CallingxClient], which attaches this service while it is running.
 *
 * Normal shutdown after a call ends, is rejected, or is declined:
 * 1. The Telecom repository removes the disconnected call from its state.
 * 2. Its observer reports removal to [CallRepositoryListener], which clears the tracked call ID
 *    and audio endpoints, then notifies [CallingxClient].
 * 3. The client updates the foreground notification for any remaining call, stops the ringtone
 *    if no incoming call is ringing, and asks this service to [stopServiceIfIdle].
 * 4. The service stays alive while the repository contains calls, registrations are in progress,
 *    or the HeadlessJS manager owns a task slot. Task completion retries the idle check.
 * 5. Once idle, [stopSelfResult] requests shutdown only if no newer service start is pending.
 *    [onDestroy] unregisters service listeners and receivers, detaches from the client, removes
 *    the foreground notification, releases HeadlessJS resources, and cancels service coroutines.
 *
 * Stopping this service does not destroy [CallingxClient] or release its shared repository and
 * notification manager. SDK disconnect/logout explicitly terminates the client: it stops native
 * work and waits for service teardown before destroying those shared resources.
 */
class CallService : Service() {

    companion object {
        private const val TAG = "[Callingx] CallService"

        internal const val DEFAULT_DISPLAY_NAME = "Unknown Caller"

        internal const val EXTRA_CALL_ID = "extra_call_id"
        internal const val EXTRA_NAME = "extra_name"
        internal const val EXTRA_URI = "extra_uri"
        /**
         * A null-scheme address reboots ColorOS devices (Telecom NPE), so the handle is wrapped
         * with the package name ("$packageName:$callCid"). The address is never dialed; it is
         * only stored in the system call log when calls history is enabled.
         */
        internal fun toTelecomAddress(context: Context, handle: String): Uri =
                Uri.fromParts(context.packageName, handle, null)
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

            val createdName = data["created_by_display_name"].orEmpty()
            val displayName = data["call_display_name"].orEmpty()
            val callDisplayName = displayName.ifEmpty { createdName.ifEmpty { DEFAULT_DISPLAY_NAME } }

            val isVideo = data["video"] == "true"

            CallRegistrationStore.trackCallRegistration(callCid, null)

            val intent =
                    Intent(context, CallService::class.java).apply {
                        action = ACTION_INCOMING_CALL
                        putExtra(EXTRA_CALL_ID, callCid)
                        putExtra(EXTRA_URI, toTelecomAddress(context, callCid))
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
    private lateinit var client: CallingxClient

    private val notificationManager get() = client.notificationManager
    private val callRepository get() = client.callRepository

    private val scope: CoroutineScope = CoroutineScope(SupervisorJob())
    private val destroyed = CompletableDeferred<Unit>()
    private val actionProcessingLock get() = client.serviceState.actionProcessingLock
    private val registeringCallIds get() = client.serviceState.registeringCallIds

    @Volatile
    internal var isInForeground = false
        private set

    private val foregroundServiceTypes by lazy {
        ForegroundServiceTypes(this, CallService::class.java)
    }

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
                            // Hang up in Telecom here, right away. JavaScript still rejects the
                            // call on the server from the same broadcast, but it may take a while
                            // or not reach the native hang-up at all, and until Telecom ends the
                            // call it refuses every new incoming call from the app.
                            processAction(
                                    callId,
                                    CallAction.Disconnect(DisconnectCause(DisconnectCause.REJECTED))
                            )
                        }
                    }
                }
            }

    override fun onCreate() {
        super.onCreate()
        debugLog(TAG, "[service] onCreate: TelecomCallService created")

        client = CallingxClient.getOrCreate(applicationContext)
        // Constructed after callRepository: onTaskFinished reads it, and a task can only finish
        // after onStartCommand has started one.
        headlessJSManager =
                HeadlessTaskManager(applicationContext) { stopServiceIfIdle(lastStartId) }
        client.attachService(this)

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

        client.detachService(this)
        demoteForeground()
        headlessJSManager.release()
        notificationManager.cancelAllNotifications()
        notificationManager.stopRingtone()

        scope.cancel()
        destroyed.complete(Unit)
    }

    /** Stop registrations (including their Telecom scopes) before releasing shared resources. */
    internal suspend fun terminateClient() {
        callRepository.calls.value.keys.forEach { callId ->
            callRepository.endCall(callId, DisconnectCause.LOCAL)
        }
        scope.coroutineContext[Job]?.cancelAndJoin()
        headlessJSManager.release()
        stopSelf()
        destroyed.await()
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
        debugLog(TAG, "[service] onTaskRemoved: Task removed")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        debugLog(TAG, "[service] onStartCommand: Received intent with action: ${intent?.action}")

        lastStartId = startId

        if (client.isTerminating) {
            val callId = intent?.getStringExtra(EXTRA_CALL_ID)
            if (callId != null) {
                CallRegistrationStore.reportRegistrationFail(
                    callId, "CLIENT_TERMINATED", "Callingx client is terminating", null,
                )
                AudioEndpointStore.clear(callId)
            }
            stopSelf(startId)
            return START_NOT_STICKY
        }

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
            ACTION_UPDATE_CALL -> {
                updateCall(intent)
                // This action never registers anything, and plain startService may have created
                // the service just to deliver it, so re-check whether it has a reason to run.
                stopServiceIfIdle(startId)
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

    fun processAction(intent: Intent) {
        val callId = intent.getStringExtra(EXTRA_CALL_ID) ?: return
        val action =
                IntentCompat.getParcelableExtra(intent, EXTRA_ACTION, CallAction::class.java)
                        ?: return

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

    private fun registerCall(intent: Intent, incoming: Boolean) {
        debugLog(TAG, "[service] registerCall: ${if (incoming) "in" else "out"} call")

        val callInfo = extractIntentParams(intent)

        // Claimed before anything else: lastStartId is already this call's, so from here until the
        // registration lands, this entry is the only thing stopping another call's teardown from
        // taking the service down with a matching start id.
        registeringCallIds.add(callInfo.callId)

        startForegroundForCall(callInfo, incoming)

        // If this specific call is already registered, just notify
        val existingCall = callRepository.getCall(callInfo.callId)
        if (existingCall != null) {
            Log.w(
                    TAG,
                    "[service] registerCall: Call ${callInfo.callId} already registered, notifying"
            )
            if (incoming) {
                client.sendBroadcastEvent(CallingxModuleImpl.CALL_REGISTERED_INCOMING_ACTION) {
                    putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callInfo.callId)
                }
            } else {
                client.sendBroadcastEvent(CallingxModuleImpl.CALL_REGISTERED_ACTION) {
                    putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callInfo.callId)
                }
            }
            // hasAnyCalls() already covers an existing call, so hand the veto straight over.
            registeringCallIds.remove(callInfo.callId)
            return
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

                client.sendBroadcastEvent(CallingxModuleImpl.CALL_REGISTRATION_FAILED_ACTION) {
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

    /**
     * Requests normal shutdown once nothing needs the service. Explicit client termination uses
     * [terminateClient] to cancel native work before stopping, rather than waiting for idle state.
     *
     * Each check catches a new call at a different stage, so none is enough alone:
     * - `hasAnyCalls` — registered in the repository.
     * - `registeringCallIds` — a registration has been launched but has not landed yet.
     *   Registration spends up to 1.5s resolving Telecom endpoints before the repository sees it.
     * - `ownsTaskSlot` — JS still holds a keep-alive owner; stopping would end its task early.
     * - [stopSelfResult] — a newer start is already queued. ActivityManager bumps its last start id
     *   when `startService` is called, before we see the intent.
     *
     * Service teardown belongs to [onDestroy]. Demoting from the foreground here would drop a
     * still-valid anchor when the stop is refused.
     */
    internal fun stopServiceIfIdle(startId: Int = lastStartId) {
        if (callRepository.hasAnyCalls() ||
                        registeringCallIds.isNotEmpty() ||
                        headlessJSManager.ownsTaskSlot()
        ) {
            debugLog(
                    TAG,
                    "[service] stopServiceIfIdle: Still in use (registering=$registeringCallIds, taskSlot=${headlessJSManager.ownsTaskSlot()}), keeping service alive"
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
     * @param allowBaseFallback passed to [ForegroundServiceTypes.typesToTry].
     * @return true when the platform accepted the promotion. On failure the recorded anchor is left
     *   untouched: a previously valid anchor must not be discarded because a new promote failed.
     */
    internal fun startForegroundSafely(
            callId: String,
            notificationId: Int,
            notification: Notification,
            allowBaseFallback: Boolean = true,
    ): Boolean {
        val started =
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    foregroundServiceTypes.typesToTry(allowBaseFallback).any { type ->
                        debugLog(TAG, "[service] startForegroundSafely: Requesting type: ${ForegroundServiceTypes.describe(type)}")
                        tryStartForeground { startForeground(notificationId, notification, type) }
                    }
                } else {
                    tryStartForeground { startForeground(notificationId, notification) }
                }
        if (started) {
            isInForeground = true
            notificationManager.commitAnchor(callId, notification)
        }
        return started
    }

    private inline fun tryStartForeground(start: () -> Unit): Boolean {
        return try {
            start()
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
     * Re-issues [startForeground] for the current foreground call with the full
     * [ForegroundServiceTypes.compute] bitmask. Called when the app enters the foreground (via
     * [LifecycleListener]) so the microphone/camera types — which cannot be acquired from the
     * background — get activated during the foreground window and then persist when backgrounded.
     *
     * This does NOT recreate the service: calling startForeground again on a running FGS only
     * updates its active type and notification in place.
     */
    private fun repromoteForegroundTypeIfNeeded() {
        if (!isInForeground) return // service is not foreground yet — nothing to upgrade
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return

        if (foregroundServiceTypes.compute() == ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL) {
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
                allowBaseFallback = false,
        )
    }

    /**
     * Cancels the notification for [callId]. If that notification was the foreground one
     * and other calls remain, re-promotes the service with the next call's notification.
     */
    internal fun repromoteForegroundIfNeeded(callId: String) {
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

    data class CallInfo(
            val callId: String,
            val name: String,
            val uri: Uri,
            val isVideo: Boolean,
            val displayOptions: Bundle?,
    )
}
