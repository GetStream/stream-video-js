package io.getstream.rn.callingx

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = CallingxModule.NAME)
class CallingxModule(reactContext: ReactApplicationContext) :
        NativeCallingxSpec(reactContext), CallingxEventEmitterAdapter {

    companion object {
        const val NAME = CallingxModuleImpl.NAME
    }

    private val impl = CallingxModuleImpl(reactContext, this)

    override fun emitNewEvent(value: WritableMap) {
        emitOnNewEvent(value)
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

    override fun setupiOS(options: ReadableMap) {
        // leave empty
    }

    override fun setupAndroid(options: ReadableMap) {
        impl.setupAndroid(options)
    }

    override fun canPostNotifications(): Boolean {
        return impl.canPostNotifications()
    }

    override fun setShouldRejectCallWhenBusy(shouldReject: Boolean) {
        // leave empty
    }

    override fun getInitialVoipEvents(): WritableArray {
        // leave empty
        return com.facebook.react.bridge.Arguments.createArray()
    }

    override fun registerVoipToken() {
        // leave empty
    }

    override fun getInitialEvents(): WritableArray {
        return impl.getInitialEvents()
    }

    override fun setCurrentCallActive(callId: String, promise: Promise) {
        impl.setCurrentCallActive(callId, promise)
    }

    override fun displayIncomingCall(
            callId: String,
            phoneNumber: String,
            callerName: String,
            hasVideo: Boolean,
            displayOptions: ReadableMap?,
            promise: Promise
    ) {
        impl.displayIncomingCall(callId, phoneNumber, callerName, hasVideo, displayOptions, promise)
    }

    override fun answerIncomingCall(callId: String, promise: Promise) {
        impl.answerIncomingCall(callId, promise)
    }

    override fun startCall(
            callId: String,
            phoneNumber: String,
            callerName: String,
            hasVideo: Boolean,
            displayOptions: ReadableMap?,
            promise: Promise
    ) {
        impl.startCall(callId, phoneNumber, callerName, hasVideo, displayOptions, promise)
    }

    override fun updateDisplay(
            callId: String,
            phoneNumber: String,
            callerName: String,
            displayOptions: ReadableMap?,
            promise: Promise
    ) {
        impl.updateDisplay(callId, phoneNumber, callerName, displayOptions, promise)
    }

    override fun endCallWithReason(callId: String, reason: Double, promise: Promise) {
        impl.endCallWithReason(callId, reason, promise)
    }

    override fun endCall(callId: String, promise: Promise) {
        impl.endCall(callId, promise)
    }

    override fun isCallTracked(callId: String): Boolean {
        return impl.isCallTracked(callId)
    }

    override fun hasRegisteredCall(): Boolean {
        return impl.hasRegisteredCall()
    }

    override fun setMutedCall(callId: String, isMuted: Boolean, promise: Promise) {
        impl.setMutedCall(callId, isMuted, promise)
    }

    override fun setOnHoldCall(callId: String, isOnHold: Boolean, promise: Promise) {
        impl.setOnHoldCall(callId, isOnHold, promise)
    }

    override fun startBackgroundTask(taskName: String, timeout: Double, promise: Promise) {
        impl.startBackgroundTask(taskName, timeout, promise)
    }

    override fun stopBackgroundTask(taskName: String, promise: Promise) {
        impl.stopBackgroundTask(taskName, promise)
    }

    override fun registerBackgroundTaskAvailable() {
        impl.registerBackgroundTaskAvailable()
    }

    override fun isServiceStarted(promise: Promise) {
        impl.isServiceStarted(promise)
    }

    override fun log(message: String, level: String) {
        impl.log(message, level)
    }
}
