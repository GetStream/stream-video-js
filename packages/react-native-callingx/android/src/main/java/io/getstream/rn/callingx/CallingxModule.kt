package io.getstream.rn.callingx

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap

class CallingxModule(reactContext: ReactApplicationContext) :
        NativeCallingxSpec(reactContext), CallingxEventEmitterAdapter {

    companion object {
        const val NAME = NativeCallingxSpec.NAME
    }

    private val impl = CallingxModuleImpl(reactContext, this)

    override fun emitNewEvent(value: WritableMap) {
        emitOnNewEvent(value)
    }

    override fun initialize() {
        super.initialize()
        impl.initialize()
    }

    override fun invalidate() {
        impl.invalidate()
        super.invalidate()
    }

    override fun setupiOS(options: ReadableMap): Boolean {
        // leave empty
        return true
    }

    override fun setDefaultAudioDeviceEndpointType(endpointType: String?): Boolean {
        impl.setDefaultAudioDeviceEndpointType(endpointType)
        return true
    }

    override fun isTelecomBacked(): Boolean {
        return impl.isTelecomBacked()
    }

    override fun getRegisteredCallIds(): WritableArray {
        return impl.getRegisteredCallIds()
    }

    override fun getAvailableAudioEndpoints(callId: String): String =
            impl.getAvailableAudioEndpoints(callId)

    override fun requestAudioEndpointChange(callId: String, endpointId: String): Boolean {
        impl.requestAudioEndpointChange(callId, endpointId)
        return true
    }

    override fun wireAudioEngineSubscription(): Boolean {
        // leave empty
        return true
    }

    override fun unwireAudioEngineSubscription(): Boolean {
        // leave empty
        return true
    }

    override fun setupAndroid(options: ReadableMap): Boolean {
        impl.setupAndroid(options)
        return true
    }

    override fun canPostNotifications(): Boolean {
        return impl.canPostNotifications()
    }

    override fun setShouldRejectCallWhenBusy(shouldReject: Boolean): Boolean {
        impl.setShouldRejectCallWhenBusy(shouldReject)
        return true
    }

    override fun getInitialVoipEvents(): WritableArray {
        // leave empty
        return com.facebook.react.bridge.Arguments.createArray()
    }

    override fun registerVoipToken(): Boolean {
        // leave empty
        return true
    }

    override fun getInitialEvents(): WritableArray {
        return impl.getInitialEvents()
    }

    override fun setCurrentCallActive(callId: String): Boolean {
        impl.setCurrentCallActive(callId)
        return true
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

    override fun answerIncomingCall(callId: String): Boolean {
        impl.answerIncomingCall(callId)
        return true
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
            displayOptions: ReadableMap?
    ): Boolean {
        impl.updateDisplay(callId, phoneNumber, callerName, displayOptions)
        return true
    }

    override fun endCallWithReason(callId: String, reason: Double): Boolean {
        impl.endCallWithReason(callId, reason)
        return true
    }

    override fun endCall(callId: String): Boolean {
        impl.endCall(callId)
        return true
    }

    override fun isCallTracked(callId: String): Boolean {
        return impl.isCallTracked(callId)
    }

    override fun hasRegisteredCall(): Boolean {
        return impl.hasRegisteredCall()
    }

    override fun setMutedCall(callId: String, isMuted: Boolean): Boolean {
        impl.setMutedCall(callId, isMuted)
        return true
    }

    override fun setOnHoldCall(callId: String, isOnHold: Boolean): Boolean {
        impl.setOnHoldCall(callId, isOnHold)
        return true
    }

    override fun startBackgroundTask(taskName: String, timeout: Double): Boolean {
        impl.startBackgroundTask(taskName, timeout)
        return true
    }

    override fun stopBackgroundTask(taskName: String): Boolean {
        impl.stopBackgroundTask(taskName)
        return true
    }

    override fun fulfillAnswerCallAction(callId: String, didFail: Boolean): Boolean {
        impl.fulfillAnswerCallAction(callId, didFail)
        return true
    }

    override fun fulfillEndCallAction(callId: String, didFail: Boolean): Boolean {
        impl.fulfillEndCallAction(callId, didFail)
        return true
    }

    override fun log(message: String, level: String): Boolean {
        impl.log(message, level)
        return true
    }

    override fun stopService(): Boolean {
        impl.stopService()
        return true
    }
}
