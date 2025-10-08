package com.streamvideo.reactnative.callmanager

import android.util.Log
import android.view.WindowManager
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil
import com.streamvideo.reactnative.audio.AudioDeviceManager
import com.streamvideo.reactnative.audio.utils.CallAudioRole
import com.streamvideo.reactnative.audio.utils.WebRtcAudioUtils
import com.streamvideo.reactnative.model.AudioDeviceEndpoint
import java.util.Locale


class StreamInCallManagerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), LifecycleEventListener {

    private var audioManagerActivated = false

    private val mAudioDeviceManager = AudioDeviceManager(reactContext)


    override fun getName(): String {
        return TAG
    }

    init {
        reactContext.addLifecycleEventListener(this)
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

    @ReactMethod
    fun setAudioRole(audioRole: String) {
        AudioDeviceManager.runInAudioThread {
            if (audioManagerActivated) {
                Log.e(TAG, "setAudioRole(): AudioManager is already activated and so Audio Role cannot be changed, current audio role is ${mAudioDeviceManager.callAudioRole}")
                return@runInAudioThread
            }
            val role = audioRole.lowercase(Locale.getDefault())
            Log.d(TAG, "setAudioRole(): $audioRole $role")
            if (role == "listener") {
                mAudioDeviceManager.callAudioRole = CallAudioRole.Listener
            } else {
                mAudioDeviceManager.callAudioRole = CallAudioRole.Communicator
            }
        }
    }

    @ReactMethod
    fun setDefaultAudioDeviceEndpointType(endpointDeviceTypeName: String) {
        AudioDeviceManager.runInAudioThread {
            if (audioManagerActivated) {
                Log.e(TAG, "setAudioRole(): AudioManager is already activated and so default audio device cannot be changed, current audio default device is ${mAudioDeviceManager.defaultAudioDevice}")
                return@runInAudioThread
            }
            val endpointType = endpointDeviceTypeName.lowercase(Locale.getDefault())
            Log.d(TAG, "runInAudioThread(): $endpointDeviceTypeName $endpointType")
            if (endpointType == "earpiece") {
                mAudioDeviceManager.defaultAudioDevice = AudioDeviceEndpoint.TYPE_EARPIECE
            } else {
                mAudioDeviceManager.defaultAudioDevice = AudioDeviceEndpoint.TYPE_SPEAKER
            }
        }
    }

    @ReactMethod
    fun start() {
        AudioDeviceManager.runInAudioThread {
            if (!audioManagerActivated) {
                reactApplicationContext.currentActivity?.let {
                    Log.d(TAG, "start() mAudioDeviceManager")
                    mAudioDeviceManager.start(it)
                    setKeepScreenOn(true)
                    audioManagerActivated = true
                }
            }
        }
    }

    @ReactMethod
    fun stop() {
        AudioDeviceManager.runInAudioThread {
            if (audioManagerActivated) {
                Log.d(TAG, "stop() mAudioDeviceManager")
                mAudioDeviceManager.stop()
                setMicrophoneMute(false)
                setKeepScreenOn(false)
                audioManagerActivated = false
            }
        }
    }

    private fun setKeepScreenOn(enable: Boolean) {
        Log.d(TAG, "setKeepScreenOn() $enable")
        UiThreadUtil.runOnUiThread {
            reactApplicationContext.currentActivity?.let {
                val window = it.window
                if (enable) {
                    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                } else {
                    window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                }
            }
        }
    }

    @Suppress("unused")
    @ReactMethod
    fun setForceSpeakerphoneOn(enable: Boolean) {
        if (mAudioDeviceManager.callAudioRole !== CallAudioRole.Communicator) {
            Log.e(TAG, "setForceSpeakerphoneOn() is not supported when audio role is not Communicator")
            return
        }
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

    @Suppress("unused")
    @ReactMethod
    fun chooseAudioDeviceEndpoint(endpointDeviceName: String) {
        if (mAudioDeviceManager.callAudioRole !== CallAudioRole.Communicator) {
            Log.e(TAG, "chooseAudioDeviceEndpoint() is not supported when audio role is not Communicator")
            return
        }
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
        const val TAG = "StreamInCallManager"
    }
}

