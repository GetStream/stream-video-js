package com.callingx

import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.ServiceConnection
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.telecom.DisconnectCause
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.core.net.toUri
import com.callingx.model.CallAction
import com.callingx.notifications.NotificationChannelsManager
import com.callingx.notifications.NotificationsConfig
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.DeviceEventManagerModule

@ReactModule(name = CallingxModule.NAME)
class CallingxModule(reactContext: ReactApplicationContext) : NativeCallingxSpec(reactContext) {

    companion object {
        const val TAG = "[Callingx] CallingxModule"
        const val NAME = "Callingx"

        const val EXTRA_CALL_ID = "call_id"
        const val EXTRA_MUTED = "is_muted"
        const val EXTRA_ON_HOLD = "hold"
        const val EXTRA_DISCONNECT_CAUSE = "disconnect_cause"
        const val EXTRA_AUDIO_ENDPOINT = "audio_endpoint"

        const val CALL_REGISTERED_ACTION = "call_registered"
        const val CALL_ANSWERED_ACTION = "call_answered"
        // const val CALL_DISCONNECTED_ACTION = "call_disconnected"
        const val CALL_INACTIVE_ACTION = "call_inactive"
        const val CALL_ACTIVE_ACTION = "call_active"
        const val CALL_MUTED_ACTION = "call_muted"
        const val CALL_ENDPOINT_CHANGED_ACTION = "call_endpoint_changed"
        const val CALL_END_ACTION = "call_end"

        const val SERVICE_READY_ACTION = "service_ready"
    }

    private enum class BindingState {
        UNBOUND,
        BINDING,
        BOUND
    }

    private var callService: CallService? = null
    private var bindingState = BindingState.UNBOUND

    private var delayedEvents = WritableNativeArray()
    private var isModuleInitialized = false

    private val notificationChannelsManager = NotificationChannelsManager(reactApplicationContext)
    private val callEventBroadcastReceiver = CallEventBroadcastReceiver()
    private val appStateListener =
            object : LifecycleEventListener {
                override fun onHostResume() {}

                override fun onHostPause() {}

                override fun onHostDestroy() {
                    // App destroyed - force unbind
                    Log.d(TAG, "[module] onHostDestroy: App destroyed")
                    unbindServiceSafely()
                }
            }

    init {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            reactContext.registerReceiver(
                    callEventBroadcastReceiver,
                    getReceiverFilter(),
                    Context.RECEIVER_NOT_EXPORTED
            )
        } else {
            @Suppress("UnspecifiedRegisterReceiverFlag")
            reactContext.registerReceiver(callEventBroadcastReceiver, getReceiverFilter())
        }
    }

    override fun getName(): String = NAME

    override fun initialize() {
        super.initialize()
        reactApplicationContext.addLifecycleEventListener(appStateListener)

        tryToBindIfNeeded()

        Log.d(TAG, "[module] initialize: Initializing module")
    }

    override fun invalidate() {
        super.invalidate()
        Log.d(TAG, "[module] invalidate: Invalidating module")

        unbindServiceSafely()

        reactApplicationContext.removeLifecycleEventListener(appStateListener)
        reactApplicationContext.unregisterReceiver(callEventBroadcastReceiver)
        isModuleInitialized = false
    }

    override fun setupiOS(options: ReadableMap) {
        // leave empty
    }

    override fun setupAndroid(options: ReadableMap) {
        Log.d(TAG, "[module] setupAndroid: Setting up Android: $options")
        val notificationsConfig =
                NotificationsConfig.saveNotificationsConfig(reactApplicationContext, options)
        notificationChannelsManager.setNotificationsConfig(notificationsConfig)
        notificationChannelsManager.createNotificationChannels()

        isModuleInitialized = true
    }

    override fun canPostNotifications(): Boolean {
        return notificationChannelsManager.getNotificationStatus().canPost
    }

    override fun getInitialEvents(): WritableArray {
        // NOTE: writabel native array can be consumed only once, think of getting rid from clear
        // event and clear eat immidiate after getting initial events
        val events = delayedEvents
        delayedEvents = WritableNativeArray()
        return events
    }

    override fun clearInitialEvents(promise: Promise) {
        delayedEvents = WritableNativeArray()
        promise.resolve(true)
    }

    override fun setCurrentCallActive(callId: String, promise: Promise) {
        Log.d(TAG, "[module] activateCall: Activating call: $callId")
        executeServiceAction(CallAction.Activate, promise)
    }

    override fun displayIncomingCall(
            callId: String,
            phoneNumber: String,
            callerName: String,
            hasVideo: Boolean,
            displayOptions: ReadableMap?,
            promise: Promise
    ) {
        Log.d(
                TAG,
                "[module] displayIncomingCall: Displaying incoming call: $callId, $phoneNumber, $callerName, $hasVideo"
        )
        if (!notificationChannelsManager.getNotificationStatus().canPost) {
            promise.reject("ERROR", "Notifications are not granted")
            return
        }

        startCallService(
                CallService.ACTION_INCOMING_CALL,
                callId,
                callerName,
                phoneNumber,
                hasVideo,
                displayOptions
        )
        promise.resolve(true)
    }

    override fun answerIncomingCall(callId: String, promise: Promise) {
        Log.d(TAG, "[module] answerIncomingCall: Answering call: $callId")
        // TODO: get the call type from the call attributes
        val isAudioCall = true // TODO: get the call type from the call attributes
        // registeredCall.callAttributes.callType ==
        //         CallAttributesCompat.CALL_TYPE_AUDIO_CALL
        // currentCall?.processAction(TelecomCallAction.Answer(isAudioCall))
        executeServiceAction(CallAction.Answer(isAudioCall), promise)
    }

    override fun startCall(
            callId: String,
            phoneNumber: String,
            callerName: String,
            hasVideo: Boolean,
            displayOptions: ReadableMap?,
            promise: Promise
    ) {
        Log.d(
                TAG,
                "[module] startCall: Starting outgoing call: $callId, $phoneNumber, $callerName, $hasVideo, $displayOptions"
        )
        if (!notificationChannelsManager.getNotificationStatus().canPost) {
            promise.reject("ERROR", "Notifications are not granted")
            return
        }

        startCallService(
                CallService.ACTION_OUTGOING_CALL,
                callId,
                callerName,
                phoneNumber,
                hasVideo,
                displayOptions
        )
        promise.resolve(true)
    }

    override fun updateDisplay(
            callId: String,
            phoneNumber: String,
            callerName: String,
            displayOptions: ReadableMap?,
            promise: Promise
    ) {
        Log.d(TAG, "[module] updateDisplay: Updating display: $callId, $phoneNumber, $callerName")
        if (!notificationChannelsManager.getNotificationStatus().canPost) {
            promise.reject("ERROR", "Notifications are not granted")
            return
        }

        startCallService(
                CallService.ACTION_UPDATE_CALL,
                callId,
                callerName,
                phoneNumber,
                false,
                displayOptions,
        )
        promise.resolve(true)
    }

    override fun endCallWithReason(callId: String, reason: Double, promise: Promise) {
        Log.d(TAG, "[module] endCallWithReason: Ending call: $callId, $reason")
        val action = CallAction.Disconnect(DisconnectCause(reason.toInt()))
        executeServiceAction(action, promise)
    }

    override fun endCall(callId: String, promise: Promise) {
        Log.d(TAG, "[module] endCall: Ending call: $callId")
        val action = CallAction.Disconnect(DisconnectCause(DisconnectCause.LOCAL))
        executeServiceAction(action, promise)
    }

    override fun isCallRegistered(callId: String): Boolean {
        Log.d(TAG, "[module] isCallRegistered: Checking if call is registered: $callId")
        return callService?.isCallRegistered(callId) ?: false
    }

    override fun setMutedCall(callId: String, isMuted: Boolean, promise: Promise) {
        Log.d(TAG, "[module] setMutedCall: Setting muted call: $callId, $isMuted")
        val action = CallAction.ToggleMute(isMuted)
        executeServiceAction(action, promise)
    }

    override fun setOnHoldCall(callId: String, isOnHold: Boolean, promise: Promise) {
        Log.d(TAG, "[module] setOnHoldCall: Setting on hold call: $callId, $isOnHold")
        val action = if (isOnHold) CallAction.Hold else CallAction.Activate
        executeServiceAction(action, promise)
    }

    override fun startBackgroundTask(taskName: String, timeout: Double, promise: Promise) {
        Log.d(TAG, "[module] startBackgroundTask: Starting background task: $taskName, $timeout")

        Intent(reactApplicationContext, CallService::class.java)
                .apply {
                    this.action = CallService.ACTION_START_BACKGROUND_TASK
                    putExtra(CallService.EXTRA_TASK_NAME, taskName)
                    putExtra(CallService.EXTRA_TASK_DATA, Bundle())
                    putExtra(CallService.EXTRA_TASK_TIMEOUT, timeout.toLong())
                }
                .also { ContextCompat.startForegroundService(reactApplicationContext, it) }

        promise.resolve(true)
    }

    override fun stopBackgroundTask(taskName: String, promise: Promise) {
        Log.d(TAG, "[module] stopBackgroundTask: Stopping background task: $taskName")

        Intent(reactApplicationContext, CallService::class.java)
                .apply {
                    this.action = CallService.ACTION_STOP_BACKGROUND_TASK
                    putExtra(CallService.EXTRA_TASK_NAME, taskName)
                }
                .also { ContextCompat.startForegroundService(reactApplicationContext, it) }

        promise.resolve(true)
    }

    override fun log(message: String, level: String) {
        Log.d(TAG, "[module] log: $message, $level")
        when (level) {
            "debug" -> Log.d(TAG, "[module] log: $message")
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

    private fun executeServiceAction(action: CallAction, promise: Promise) {
        Log.d(TAG, "[module] executeServiceAction: Executing service action: $action")
        when (bindingState) {
            BindingState.BOUND -> {
                if (callService != null) {
                    callService?.processAction(action)
                    promise.resolve(true)
                } else {
                    promise.reject("ERROR", "Service reference lost")
                }
            }
            BindingState.BINDING -> {
                Log.d(TAG, "executeServiceAction: Service binding, queueing action")
                promise.reject(
                        "SERVICE_BINDING",
                        "Service is connecting, please try again in a moment"
                )
            }
            BindingState.UNBOUND -> {
                promise.reject(
                        "SERVICE_NOT_CONNECTED",
                        "Service not connected. Call may not be active."
                )
            }
        }
    }

    private fun sendJSEvent(eventName: String, params: WritableMap? = null) {
        if (isModuleInitialized && reactApplicationContext.hasActiveReactInstance()) {
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
            emitOnNewEvent(value)
        } else {
            Arguments.createMap()
                    .apply {
                        putString("name", eventName)
                        putMap("params", params)
                    }
                    .also { delayedEvents.pushMap(it) }
        }
    }

    private fun getReceiverFilter(): IntentFilter =
            IntentFilter().apply {
                addAction(CALL_REGISTERED_ACTION)
                addAction(CALL_ANSWERED_ACTION)
                addAction(CALL_ACTIVE_ACTION)
                addAction(CALL_INACTIVE_ACTION)
                addAction(CALL_MUTED_ACTION)
                addAction(CALL_ENDPOINT_CHANGED_ACTION)
                addAction(CALL_END_ACTION)
                addAction(SERVICE_READY_ACTION)
            }

    private fun bindToServiceIfNeeded() {
        when (bindingState) {
            BindingState.BOUND -> {
                Log.d(TAG, "[module] bindToServiceIfNeeded: Already bound")
                return
            }
            BindingState.BINDING -> {
                Log.d(TAG, "[module] bindToServiceIfNeeded: Already binding")
                return
            }
            BindingState.UNBOUND -> {
                Log.d(TAG, "[module] bindToServiceIfNeeded: Attempting to bind")
                val intent = Intent(reactApplicationContext, CallService::class.java)
                try {
                    val success =
                            reactApplicationContext.bindService(
                                    intent,
                                    serviceConnection,
                                    Context.BIND_AUTO_CREATE or Context.BIND_IMPORTANT
                            )
                    if (success) {
                        bindingState = BindingState.BINDING
                        Log.d(TAG, "[module] bindToServiceIfNeeded: Bind request successful")
                    } else {
                        Log.e(TAG, "[module] bindToServiceIfNeeded: Bind request failed")
                        bindingState = BindingState.UNBOUND
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "[module] bindToServiceIfNeeded: Exception during bind", e)
                    bindingState = BindingState.UNBOUND
                }
            }
        }
    }

    private fun unbindServiceSafely() {
        Log.d(TAG, "[module] unbindServiceSafely: Unbinding service")
        if (bindingState == BindingState.BOUND || bindingState == BindingState.BINDING) {
            try {
                reactApplicationContext.unbindService(serviceConnection)
                Log.d(TAG, "[module] unbindServiceSafely: Successfully unbound")
            } catch (e: IllegalArgumentException) {
                Log.w(
                        TAG,
                        "[module] unbindServiceSafely: Service not registered or already unbound"
                )
            } catch (e: Exception) {
                Log.e(TAG, "[module] unbindServiceSafely: Error unbinding service", e)
            } finally {
                bindingState = BindingState.UNBOUND
                callService = null
            }
        }
    }

    private fun tryToBindIfNeeded() {
        val intent = Intent(reactApplicationContext, CallService::class.java)
        try {
            val success =
                    reactApplicationContext.bindService(
                            intent,
                            serviceConnection,
                            0 // No flags - only bind if service exists
                    )
            if (success) {
                bindingState = BindingState.BINDING
                Log.d(TAG, "[module] checkForExistingService: Service exists, binding")
            } else {
                Log.d(TAG, "[module] checkForExistingService: No existing service")
            }
        } catch (e: Exception) {
            Log.e(TAG, "[module] checkForExistingService: Error checking for service", e)
        }
    }

    private inner class CallEventBroadcastReceiver : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            val action = intent.action
            val callId = intent.getStringExtra(EXTRA_CALL_ID)

            Log.d(
                    TAG,
                    "[module] onReceive: Received intent: $action callId: $callId callService: ${callService != null}"
            )

            if (action == SERVICE_READY_ACTION) {
                Log.d(TAG, "[module] onReceive: Service is ready, initiating binding")
                bindToServiceIfNeeded()
                return
            }

            if (action == null) {
                Log.e(TAG, "[module] onReceive: Received intent with null action or callId")
                return
            }

            val params = Arguments.createMap()
            if (callId != null) {
                params.putString("callId", callId)
            }

            when (action) {
                CALL_REGISTERED_ACTION -> {
                    sendJSEvent("didReceiveStartCallAction", params)
                }
                CALL_ANSWERED_ACTION -> {
                    sendJSEvent("answerCall", params)
                }
                CALL_END_ACTION -> {
                    if (callId == null) {
                        // means the call was disconnected, we're ready to unbind the service
                        unbindServiceSafely()
                    } else {
                        params.putString("cause", intent.getStringExtra(EXTRA_DISCONNECT_CAUSE))
                        sendJSEvent("endCall", params)
                    }
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
                    if (intent.hasExtra(EXTRA_MUTED)) {
                        params.putBoolean("muted", intent.getBooleanExtra(EXTRA_MUTED, false))
                    }
                    sendJSEvent("didPerformSetMutedCallAction", params)
                }
                CALL_ENDPOINT_CHANGED_ACTION -> {
                    if (intent.hasExtra(EXTRA_AUDIO_ENDPOINT)) {
                        params.putString("output", intent.getStringExtra(EXTRA_AUDIO_ENDPOINT))
                    }
                    sendJSEvent("didChangeAudioRoute", params)
                }
            }
        }
    }

    private val serviceConnection =
            object : ServiceConnection {
                override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
                    Log.d(TAG, "[module] onServiceConnected: Service connected")
                    val binder = service as? CallService.CallServiceBinder
                    callService = binder?.getService()
                    bindingState = BindingState.BOUND
                }

                override fun onServiceDisconnected(name: ComponentName?) {
                    Log.d(TAG, "onServiceDisconnected: Service disconnected unexpectedly")
                    callService = null
                    bindingState = BindingState.UNBOUND
                }

                override fun onBindingDied(name: ComponentName?) {
                    Log.e(TAG, "[module] onBindingDied: Service binding died")
                    callService = null
                    bindingState = BindingState.UNBOUND

                    // Must unbind to clean up the dead binding
                    try {
                        reactApplicationContext.unbindService(this)
                    } catch (e: Exception) {
                        Log.w(TAG, "[module] onBindingDied: Error unbinding dead connection", e)
                    }
                }

                override fun onNullBinding(name: ComponentName?) {
                    Log.e(TAG, "[module] onNullBinding: Service returned null binding")
                    bindingState = BindingState.UNBOUND
                    callService = null
                }
            }
}
