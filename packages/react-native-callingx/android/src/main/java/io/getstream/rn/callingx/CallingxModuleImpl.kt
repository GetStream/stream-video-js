package io.getstream.rn.callingx

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.Bundle
import android.telecom.DisconnectCause
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.core.net.toUri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.modules.core.DeviceEventManagerModule
import io.getstream.rn.callingx.model.CallAction
import io.getstream.rn.callingx.notifications.NotificationChannelsManager
import io.getstream.rn.callingx.notifications.NotificationsConfig
import io.getstream.rn.callingx.utils.SettingsStore

class CallingxModuleImpl(
        private val reactApplicationContext: ReactApplicationContext,
        private val eventEmitter: CallingxEventEmitterAdapter
) : CallEventBus.Listener {

    companion object {
        const val TAG = "[Callingx] CallingxModule"
        const val NAME = "Callingx"

        const val EXTRA_CALL_ID = "call_id"
        const val EXTRA_MUTED = "is_muted"
        const val EXTRA_ON_HOLD = "hold"
        const val EXTRA_DISCONNECT_CAUSE = "disconnect_cause"
        const val EXTRA_AUDIO_ENDPOINT = "audio_endpoint"
        const val EXTRA_SOURCE = "source"
        const val EXTRA_ACTION = "action_name"

        // Action names must match intent-filter entries in AndroidManifest.xml
        const val CALL_REGISTERED_ACTION = "io.getstream.CALL_REGISTERED"
        const val CALL_REGISTERED_INCOMING_ACTION = "io.getstream.CALL_REGISTERED_INCOMING"
        const val CALL_ANSWERED_ACTION = "io.getstream.CALL_ANSWERED"
        const val CALL_INACTIVE_ACTION = "io.getstream.CALL_INACTIVE"
        const val CALL_ACTIVE_ACTION = "io.getstream.CALL_ACTIVE"
        const val CALL_MUTED_ACTION = "io.getstream.CALL_MUTED"
        const val CALL_ENDPOINT_CHANGED_ACTION = "io.getstream.CALL_ENDPOINT_CHANGED"
        const val CALL_END_ACTION = "io.getstream.CALL_END"
        const val CALL_REGISTRATION_FAILED_ACTION = "io.getstream.CALL_REGISTRATION_FAILED"
        const val CALL_OPTIMISTIC_ACCEPT_ACTION = "io.getstream.ACCEPT_CALL_OPTIMISTIC"
        // Background task name
        const val HEADLESS_TASK_NAME = "HandleCallBackgroundState"
        const val SERVICE_READY_ACTION = "io.getstream.SERVICE_READY"
    }

    private var delayedEvents = WritableNativeArray()
    private var isModuleInitialized = false
    private var canSendEvents = false

    private val notificationChannelsManager = NotificationChannelsManager(reactApplicationContext)
    private val serviceReadyBroadcastReceiver = ServiceReadyBroadcastReceiver()
    private val appStateListener =
            object : LifecycleEventListener {
                override fun onHostResume() {}

                override fun onHostPause() {}

                override fun onHostDestroy() {
                    // App destroyed - force unbind
                    debugLog(TAG, "[module] onHostDestroy: App destroyed")
                }
            }

    init {
        CallEventBus.subscribe(this)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            reactApplicationContext.registerReceiver(
                    serviceReadyBroadcastReceiver,
                    getServiceReadyReceiverFilter(),
                    Context.RECEIVER_NOT_EXPORTED
            )
        } else {
            @Suppress("UnspecifiedRegisterReceiverFlag")
            reactApplicationContext.registerReceiver(
                    serviceReadyBroadcastReceiver,
                    getServiceReadyReceiverFilter()
            )
        }
    }

    fun initialize() {
        reactApplicationContext.addLifecycleEventListener(appStateListener)

        debugLog(TAG, "[module] initialize: Initializing module")
    }

    fun invalidate() {
        debugLog(TAG, "[module] invalidate: Invalidating module")

        CallRegistrationStore.clearAll()

        CallEventBus.unsubscribe(this)

        reactApplicationContext.removeLifecycleEventListener(appStateListener)
        reactApplicationContext.unregisterReceiver(serviceReadyBroadcastReceiver)
        isModuleInitialized = false
    }

    fun setShouldRejectCallWhenBusy(shouldReject: Boolean) {
        debugLog(
                TAG,
                "[module] setShouldRejectCallWhenBusy: Updating rejectCallWhenBusy to $shouldReject"
        )
        SettingsStore.setShouldRejectCallWhenBusy(reactApplicationContext, shouldReject)
    }

    fun setupAndroid(options: ReadableMap) {
        debugLog(TAG, "[module] setupAndroid: Setting up Android: $options")
        val notificationsConfig =
                NotificationsConfig.saveNotificationsConfig(reactApplicationContext, options)
        notificationChannelsManager.setNotificationsConfig(notificationsConfig)
        notificationChannelsManager.createNotificationChannels()

        val notificationTexts = options.getMap("notificationTexts")
        if (notificationTexts != null) {
            val acceptingText = notificationTexts.getString("accepting")
            val rejectingText = notificationTexts.getString("rejecting")
            debugLog(TAG, "[module] $acceptingText $rejectingText")
            SettingsStore.setOptimisticTexts(
                    reactApplicationContext,
                    acceptingText,
                    rejectingText,
            )
        }

        isModuleInitialized = true
    }

    fun canPostNotifications(): Boolean {
        return notificationChannelsManager.getNotificationStatus().canPost
    }

    fun stopService(promise: Promise) {
        debugLog(TAG, "[module] stopService: Stopping CallService explicitly from JS")
        try {
            Intent(reactApplicationContext, CallService::class.java)
                    .apply { action = CallService.ACTION_STOP_SERVICE }
                    .also { reactApplicationContext.startService(it) }

            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "[module] stopService: Failed to stop service: ${e.message}", e)
            promise.reject("STOP_SERVICE_ERROR", e.message, e)
        }
    }

    fun getInitialEvents(): WritableArray {
        CallEventBus.drainPendingEvents().forEach { onCallEvent(it) }

        // NOTE: writable native array can be consumed only once, think of getting rid from clear
        // event and clear it immediately after getting initial events
        val events = delayedEvents
        debugLog(TAG, "[module] getInitialEvents: Getting initial events: $events")
        delayedEvents = WritableNativeArray()
        canSendEvents = true
        CallEventBus.markJsReady()
        return events
    }

    fun setCurrentCallActive(callId: String, promise: Promise) {
        debugLog(TAG, "[module] activateCall: Activating call: $callId")
        executeServiceAction(callId, CallAction.Activate, promise)
    }

    fun displayIncomingCall(
            callId: String,
            phoneNumber: String,
            callerName: String,
            hasVideo: Boolean,
            displayOptions: ReadableMap?,
            promise: Promise
    ) {
        debugLog(
                TAG,
                "[module] displayIncomingCall: Displaying incoming call: $callId, $phoneNumber, $callerName, $hasVideo"
        )
        if (!notificationChannelsManager.getNotificationStatus().canPost) {
            promise.reject("ERROR", "Cannot post notifications")
            return
        }

        CallRegistrationStore.trackCallRegistration(callId, promise)

        try {
            startCallService(
                    CallService.ACTION_INCOMING_CALL,
                    callId,
                    callerName,
                    phoneNumber,
                    hasVideo,
                    displayOptions
            )
        } catch (e: Exception) {
            Log.e(TAG, "[module] displayIncomingCall: Failed to start foreground service: ${e.message}", e)
            CallRegistrationStore.reportRegistrationFail(
                    callId,
                    "START_FOREGROUND_SERVICE_ERROR",
                    e.message,
                    e
            )
        }
    }

    fun answerIncomingCall(callId: String, promise: Promise) {
        debugLog(TAG, "[module] answerIncomingCall: Answering call: $callId")
        // TODO: get the call type from the call attributes
        val isAudioCall = true // TODO: get the call type from the call attributes
        // registeredCall.callAttributes.callType ==
        //         CallAttributesCompat.CALL_TYPE_AUDIO_CALL
        // currentCall?.processAction(TelecomCallAction.Answer(isAudioCall))
        executeServiceAction(callId, CallAction.Answer(isAudioCall), promise)
    }

    fun startCall(
            callId: String,
            phoneNumber: String,
            callerName: String,
            hasVideo: Boolean,
            displayOptions: ReadableMap?,
            promise: Promise
    ) {
        debugLog(
                TAG,
                "[module] startCall: Starting outgoing call: $callId, $phoneNumber, $callerName, $hasVideo, $displayOptions"
        )
        if (!notificationChannelsManager.getNotificationStatus().canPost) {
            promise.reject("ERROR", "Cannot post notifications")
            return
        }

        CallRegistrationStore.trackCallRegistration(callId, promise)

        try {
            startCallService(
                    CallService.ACTION_OUTGOING_CALL,
                    callId,
                    callerName,
                    phoneNumber,
                    hasVideo,
                    displayOptions
            )
        } catch (e: Exception) {
            Log.e(TAG, "[module] startCall: Failed to start foreground service: ${e.message}", e)
            CallRegistrationStore.reportRegistrationFail(
              callId,
              "START_FOREGROUND_SERVICE_ERROR",
              e.message,
              e
          )
        }
    }

    fun updateDisplay(
            callId: String,
            phoneNumber: String,
            callerName: String,
            displayOptions: ReadableMap?,
            promise: Promise
    ) {
        debugLog(TAG, "[module] updateDisplay: Updating display: $callId, $phoneNumber, $callerName")
        if (!notificationChannelsManager.getNotificationStatus().canPost) {
            promise.reject("ERROR", "Cannot post notifications")
            return
        }

        // for now only display options will be updated, rest of the parameters will be ignored
        try {
            startCallService(
                    CallService.ACTION_UPDATE_CALL,
                    callId,
                    callerName,
                    phoneNumber,
                    true,
                    displayOptions,
            )
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "[module] updateDisplay: Failed to start foreground service: ${e.message}", e)
            promise.reject("START_FOREGROUND_SERVICE_ERROR", e.message, e)
        }
    }

    fun endCallWithReason(callId: String, reason: Double, promise: Promise) {
        debugLog(TAG, "[module] endCallWithReason: Ending call: $callId, $reason")
        CallRegistrationStore.removeTrackedCall(callId)
        val action = CallAction.Disconnect(DisconnectCause(reason.toInt()))
        executeServiceAction(callId, action, promise)
    }

    fun endCall(callId: String, promise: Promise) {
        debugLog(TAG, "[module] endCall: Ending call: $callId")
        CallRegistrationStore.removeTrackedCall(callId)
        val action = CallAction.Disconnect(DisconnectCause(DisconnectCause.LOCAL))
        executeServiceAction(callId, action, promise)
    }

    fun isCallTracked(callId: String): Boolean {
        return CallRegistrationStore.isCallTracked(callId)
    }

    fun hasRegisteredCall(): Boolean {
        return CallRegistrationStore.hasRegisteredCall()
    }

    fun setMutedCall(callId: String, isMuted: Boolean, promise: Promise) {
        debugLog(TAG, "[module] setMutedCall: Setting muted call: $callId, $isMuted")
        val action = CallAction.ToggleMute(isMuted)
        executeServiceAction(callId, action, promise)
    }

    fun setOnHoldCall(callId: String, isOnHold: Boolean, promise: Promise) {
        debugLog(TAG, "[module] setOnHoldCall: Setting on hold call: $callId, $isOnHold")
        val action = if (isOnHold) CallAction.Hold else CallAction.Activate
        executeServiceAction(callId, action, promise)
    }

    fun startBackgroundTask(taskName: String, timeout: Double, promise: Promise) {
        try {
            Intent(reactApplicationContext, CallService::class.java)
                    .apply {
                        this.action = CallService.ACTION_START_BACKGROUND_TASK
                        putExtra(CallService.EXTRA_TASK_NAME, taskName)
                        putExtra(CallService.EXTRA_TASK_DATA, Bundle())
                        putExtra(CallService.EXTRA_TASK_TIMEOUT, timeout.toLong())
                    }
                    .also { reactApplicationContext.startService(it) }

            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "[module] startBackgroundTask: Failed to start service: ${e.message}", e)
            promise.reject("START_SERVICE_ERROR", e.message, e)
        }
    }

    fun stopBackgroundTask(taskName: String, promise: Promise) {
        try {
            Intent(reactApplicationContext, CallService::class.java)
                    .apply {
                        this.action = CallService.ACTION_STOP_BACKGROUND_TASK
                        putExtra(CallService.EXTRA_TASK_NAME, taskName)
                    }
                    .also { reactApplicationContext.startService(it) }

            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "[module] stopBackgroundTask: Failed to start service: ${e.message}", e)
            promise.reject("START_SERVICE_ERROR", e.message, e)
        }
    }

    fun registerBackgroundTaskAvailable() {
        debugLog(TAG, "[module] registerBackgroundTaskAvailable: Headless task registered")
    }


    fun fulfillAnswerCallAction(callId: String, didFail: Boolean) {
        // no-op: Android Telecom doesn't require explicit action fulfillment
    }

    fun fulfillEndCallAction(callId: String, didFail: Boolean) {
        // no-op: Android Telecom doesn't require explicit action fulfillment
    }

    fun log(message: String, level: String) {
        when (level) {
            "debug" -> debugLog(TAG, "[module] log: $message")
            "info" -> Log.i(TAG, "[module] log: $message")
            "warn" -> Log.w(TAG, "[module] log: $message")
            "error" -> Log.e(TAG, "[module] log: $message")
        }
    }

    private fun startCallService(
            action: String,
            callId: String,
            callerName: String,
            phoneNumber: String,
            hasVideo: Boolean,
            displayOptions: ReadableMap?
    ) {
        Intent(reactApplicationContext, CallService::class.java)
                .apply {
                    this.action = action
                    putExtra(CallService.EXTRA_CALL_ID, callId)
                    putExtra(CallService.EXTRA_NAME, callerName)
                    putExtra(CallService.EXTRA_URI, phoneNumber.toUri())
                    putExtra(CallService.EXTRA_IS_VIDEO, hasVideo)
                    putExtra(CallService.EXTRA_DISPLAY_OPTIONS, Arguments.toBundle(displayOptions))
                }
                .also { ContextCompat.startForegroundService(reactApplicationContext, it) }
    }

    private fun executeServiceAction(callId: String, action: CallAction, promise: Promise) {
        debugLog(TAG, "[module] executeServiceAction: Executing service action: $action")
        Intent(reactApplicationContext, CallService::class.java)
                .apply {
                    this.action = CallService.ACTION_PROCESS_ACTION
                    putExtra(CallService.EXTRA_CALL_ID, callId)
                    putExtra(CallService.EXTRA_ACTION, action)
                }
                .also { reactApplicationContext.startService(it) }
                .also { promise.resolve(true) }
    }

    private fun sendJSEvent(eventName: String, params: WritableMap? = null) {
        if (isModuleInitialized && reactApplicationContext.hasActiveReactInstance() && canSendEvents
        ) {
            val paramsMap =
                    Arguments.createMap().apply {
                        params?.let {
                            it.toHashMap().forEach { key, value ->
                                if (value is Boolean) {
                                    putBoolean(key, value)
                                } else {
                                    putString(key, value.toString())
                                }
                            }
                        }
                    }
            reactApplicationContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit(eventName, params)

            val value =
                    Arguments.createMap().apply {
                        putString("eventName", eventName)
                        putMap("params", paramsMap)
                    }
            eventEmitter.emitNewEvent(value)
        } else {
            debugLog(TAG, "[module] sendJSEvent: Queueing event: $eventName, $params")
            Arguments.createMap()
                    .apply {
                        putString("eventName", eventName)
                        putMap("params", params)
                    }
                    .also { delayedEvents.pushMap(it) }
        }
    }

    private fun getServiceReadyReceiverFilter(): IntentFilter =
            IntentFilter().apply {
                addAction(SERVICE_READY_ACTION)
            }

    override fun onCallEvent(event: CallEvent) {
        val action = event.action
        val extras = event.extras
        val callId = extras.getString(EXTRA_CALL_ID)

        val params = Arguments.createMap()
        if (callId != null) {
            params.putString("callId", callId)
        }

        when (action) {
            CALL_REGISTERED_ACTION -> {
                sendJSEvent("didReceiveStartCallAction", params)
                if (callId != null) {
                  CallRegistrationStore.onRegistrationSuccess(callId)
                }
            }
            CALL_REGISTERED_INCOMING_ACTION -> {
                if (callId != null) {
                    CallRegistrationStore.onRegistrationSuccess(callId)
                }
                sendJSEvent("didDisplayIncomingCall", params)
            }
            CALL_REGISTRATION_FAILED_ACTION -> {
                if (callId != null) {
                    CallRegistrationStore.onRegistrationFailed(callId)
                }
            }
            CALL_ANSWERED_ACTION -> {
                if (extras.containsKey(EXTRA_SOURCE)) {
                    params.putString("source", extras.getString(EXTRA_SOURCE))
                }
                sendJSEvent("answerCall", params)
            }
            CALL_END_ACTION -> {
                val source = extras.getString(EXTRA_SOURCE)
                if (source != null) {
                    params.putString("source", source)
                }
                if (source == "app") {
                    if (callId != null) {
                        CallRegistrationStore.removeTrackedCall(callId)
                    }
                }
                params.putString("cause", extras.getString(EXTRA_DISCONNECT_CAUSE))
                sendJSEvent("endCall", params)
            }
            CALL_INACTIVE_ACTION -> {
                params.putBoolean("hold", true)
                sendJSEvent("didToggleHoldCallAction", params)
            }
            CALL_ACTIVE_ACTION -> {
                params.putBoolean("hold", false)
                sendJSEvent("didToggleHoldCallAction", params)
            }
            CALL_MUTED_ACTION -> {
                if (extras.containsKey(EXTRA_MUTED)) {
                    params.putBoolean("muted", extras.getBoolean(EXTRA_MUTED, false))
                }
                sendJSEvent("didPerformSetMutedCallAction", params)
            }
            CALL_ENDPOINT_CHANGED_ACTION -> {
                if (extras.containsKey(EXTRA_AUDIO_ENDPOINT)) {
                    params.putString("output", extras.getString(EXTRA_AUDIO_ENDPOINT))
                }
                sendJSEvent("didChangeAudioRoute", params)
            }
        }
    }

    private inner class ServiceReadyBroadcastReceiver : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
          val action = intent.action ?: return

          if (action == SERVICE_READY_ACTION) {
                debugLog(
                        TAG,
                        "[module] ServiceReadyBroadcastReceiver: Service is ready"
                )
            }
        }
    }
}
