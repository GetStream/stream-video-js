package io.getstream.rn.callingx

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.DeviceEventManagerModule

@ReactModule(name = CallingxModule.NAME)
class CallingxModule(private val reactContext: ReactApplicationContext) :
        ReactContextBaseJavaModule(reactContext), CallingxEventEmitterAdapter {

    companion object {
        const val NAME = CallingxModuleImpl.NAME
    }

    private val impl = CallingxModuleImpl(reactContext, this)

    override fun emitNewEvent(value: WritableMap) {
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onNewEvent", value)
    }

    override fun getName(): String = NAME

    override fun initialize() {
        super.initialize()
        impl.initialize()
    }

    override fun invalidate() {
        impl.invalidate()
        super.invalidate()
    }

    @ReactMethod
    fun setupiOS(options: ReadableMap) {
        // leave empty
    }

    @ReactMethod
    fun setupAndroid(options: ReadableMap) {
        impl.setupAndroid(options)
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun canPostNotifications(): Boolean {
        return impl.canPostNotifications()
    }

    @ReactMethod
    fun setShouldRejectCallWhenBusy(shouldReject: Boolean) {
        // leave empty
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun getInitialVoipEvents(): WritableArray {
        // leave empty
        return Arguments.createArray()
    }

    @ReactMethod
    fun registerVoipToken() {
        // leave empty
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun getInitialEvents(): WritableArray {
        return impl.getInitialEvents()
    }

    @ReactMethod
    fun setCurrentCallActive(callId: String, promise: Promise) {
        impl.setCurrentCallActive(callId, promise)
    }

    @ReactMethod
    fun displayIncomingCall(
            callId: String,
            phoneNumber: String,
            callerName: String,
            hasVideo: Boolean,
            displayOptions: ReadableMap?,
            promise: Promise
    ) {
        impl.displayIncomingCall(callId, phoneNumber, callerName, hasVideo, displayOptions, promise)
    }

    @ReactMethod
    fun answerIncomingCall(callId: String, promise: Promise) {
        impl.answerIncomingCall(callId, promise)
    }

    @ReactMethod
    fun startCall(
            callId: String,
            phoneNumber: String,
            callerName: String,
            hasVideo: Boolean,
            displayOptions: ReadableMap?,
            promise: Promise
    ) {
        impl.startCall(callId, phoneNumber, callerName, hasVideo, displayOptions, promise)
    }

    @ReactMethod
    fun updateDisplay(
            callId: String,
            phoneNumber: String,
            callerName: String,
            displayOptions: ReadableMap?,
            promise: Promise
    ) {
        impl.updateDisplay(callId, phoneNumber, callerName, displayOptions, promise)
    }

    @ReactMethod
    fun endCallWithReason(callId: String, reason: Double, promise: Promise) {
        impl.endCallWithReason(callId, reason, promise)
    }

    @ReactMethod
    fun endCall(callId: String, promise: Promise) {
        impl.endCall(callId, promise)
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun isCallRegistered(callId: String): Boolean {
        return impl.isCallRegistered(callId)
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun hasRegisteredCall(): Boolean {
        return impl.hasRegisteredCall()
    }

    @ReactMethod
    fun setMutedCall(callId: String, isMuted: Boolean, promise: Promise) {
        impl.setMutedCall(callId, isMuted, promise)
    }

    @ReactMethod
    fun setOnHoldCall(callId: String, isOnHold: Boolean, promise: Promise) {
        impl.setOnHoldCall(callId, isOnHold, promise)
    }

    @ReactMethod
    fun startBackgroundTask(taskName: String, timeout: Double, promise: Promise) {
        impl.startBackgroundTask(taskName, timeout, promise)
    }

    @ReactMethod
    fun stopBackgroundTask(taskName: String, promise: Promise) {
        impl.stopBackgroundTask(taskName, promise)
    }

    @ReactMethod
    fun registerBackgroundTaskAvailable() {
        impl.registerBackgroundTaskAvailable()
    }

    @ReactMethod
    fun isServiceStarted(promise: Promise) {
        impl.isServiceStarted(promise)
    }

    @ReactMethod
    fun log(message: String, level: String) {
        impl.log(message, level)
    }
}
