package com.streamvideo.reactnative.callmanager

import android.content.Context
import android.os.PowerManager
import android.util.Log
import android.view.WindowManager
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.streamvideo.reactnative.audio.AudioDeviceManager
import com.streamvideo.reactnative.audio.utils.CallAudioRole
import com.streamvideo.reactnative.callmanager.utils.InCallWakeLockUtils
import com.streamvideo.reactnative.util.WebRtcAudioUtils
import java.util.Locale


class InCallManagerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), LifecycleEventListener {

    private val mPowerManager: PowerManager

    private var audioManagerActivated = false

    private val mAudioDeviceManager = AudioDeviceManager(reactContext)

    private val proximityManager: InCallProximityManager

    private val wakeLockUtils: InCallWakeLockUtils

    override fun getName(): String {
        return TAG
    }

    init {
        reactContext.addLifecycleEventListener(this)
        mPowerManager = reactContext.getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLockUtils = InCallWakeLockUtils(reactContext)
        proximityManager = InCallProximityManager.create(
            reactContext, this
        )
        Log.d(TAG, "InCallManager initialized")
    }

    // This method was removed upstream in react-native 0.74+, replaced with invalidate
    // We will leave this stub here for older react-native versions compatibility
    // ...but it will just delegate to the new invalidate method
    @Deprecated("Deprecated in Java", ReplaceWith("invalidate()"))
    @Suppress("removal")
    override fun onCatalystInstanceDestroy() {
        invalidate()
    }

    override fun invalidate() {
        mAudioDeviceManager.close()
        super.invalidate()
    }

    fun sendEvent(eventName: String, params: WritableMap?) {
        try {
            val reactContext: ReactContext? = reactApplicationContext
            if (reactContext != null && reactContext.hasActiveReactInstance()) {
                reactContext.getJSModule(
                    DeviceEventManagerModule.RCTDeviceEventEmitter::class.java
                ).emit(eventName, params)
            } else {
                Log.e(TAG, "sendEvent(): reactContext is null or not having CatalystInstance yet.")
            }
        } catch (e: RuntimeException) {
            Log.e(
                TAG,
                "sendEvent(): java.lang.RuntimeException: Trying to invoke JS before CatalystInstance has been set!"
            )
        }
    }

    @ReactMethod
    fun setAudioRole(audioRole: String) {
        if (audioManagerActivated) {
            Log.e(TAG, "setAudioRole(): AudioManager is already activated and so Audio Role cannot be changed, current audio role is ${mAudioDeviceManager.callAudioRole}")
            return
        }
        if (audioRole.lowercase(Locale.getDefault()) === "listener") {
            mAudioDeviceManager.callAudioRole = CallAudioRole.Listener
        } else {
            mAudioDeviceManager.callAudioRole = CallAudioRole.Communicator
        }
    }

    @ReactMethod
    fun start() {
        if (!audioManagerActivated) {
            AudioDeviceManager.runInAudioThread {
                currentActivity?.let {
                    mAudioDeviceManager.start(it)
                    setKeepScreenOn(true)
                    Log.d(TAG, "start() audioRouteManager")
                    wakeLockUtils.acquirePartialWakeLock()
                    audioManagerActivated = true
                }
            }
        }
    }

    @ReactMethod
    fun stop() {
        if (audioManagerActivated) {
            AudioDeviceManager.runInAudioThread {
                Log.d(TAG, "stop() audioRouteManager")
                setKeepScreenOn(false)
                mAudioDeviceManager.stop()
                setMicrophoneMute(false)
                wakeLockUtils.releasePartialWakeLock()
                audioManagerActivated = false
            }
        }
    }

    private fun setKeepScreenOn(enable: Boolean) {
        Log.d(TAG, "setKeepScreenOn() $enable")
        UiThreadUtil.runOnUiThread {
            currentActivity?.let {
                val window = it.window
                if (enable) {
                    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                } else {
                    window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                }
            }
        }
    }

    @ReactMethod
    fun setForceSpeakerphoneOn(enable: Boolean) {
        mAudioDeviceManager.setSpeakerphoneOn(enable)
    }

    @ReactMethod
    fun setMicrophoneMute(enable: Boolean) {
        mAudioDeviceManager.setMicrophoneMute(enable)
    }

    @ReactMethod
    fun logAudioState() {
        WebRtcAudioUtils.logAudioState(
            TAG,
            reactApplicationContext,
        )
    }

    @ReactMethod
    fun chooseAudioDeviceEndpoint(endpointDeviceName: String) {
        mAudioDeviceManager.switchDeviceFromDeviceName(
            endpointDeviceName
        )
    }

    @ReactMethod
    fun muteAudioOutput() {
        mAudioDeviceManager.muteAudioOutput()
    }

    @ReactMethod
    fun unmuteAudioOutput() {
        mAudioDeviceManager.unmuteAudioOutput()
    }

    override fun onHostResume() {
    }

    override fun onHostPause() {
    }

    override fun onHostDestroy() {
        stop()
    }

    @ReactMethod
    fun addListener(eventName: String?) {
        // Keep: Required for RN built in Event Emitter Calls.
    }

    @ReactMethod
    fun removeListeners(count: Int?) {
        // Keep: Required for RN built in Event Emitter Calls.
    }

    companion object {
        const val TAG = "InCallManager"
    }
}

