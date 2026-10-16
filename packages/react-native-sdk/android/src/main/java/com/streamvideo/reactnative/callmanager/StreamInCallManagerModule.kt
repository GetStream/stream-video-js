package com.streamvideo.reactnative.callmanager

import android.util.Log
import android.view.WindowManager
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.streamvideo.reactnative.NativeStreamInCallManagerSpec
import com.streamvideo.reactnative.audio.AudioDeviceManager
import com.streamvideo.reactnative.audio.utils.CallAudioRole
import com.streamvideo.reactnative.audio.utils.WebRtcAudioUtils
import com.streamvideo.reactnative.model.AudioDeviceEndpoint
import com.streamvideo.reactnative.util.SoundPlayer
import java.util.Locale


class StreamInCallManagerModule(reactContext: ReactApplicationContext) :
    NativeStreamInCallManagerSpec(reactContext), LifecycleEventListener {

    private var audioManagerActivated = false

    private val mAudioDeviceManager = AudioDeviceManager(reactContext)

    private val mSoundPlayer = SoundPlayer(reactContext)

    init {
        reactContext.addLifecycleEventListener(this)
        mAudioDeviceManager.onAudioDeviceChanged = { payload -> emitAudioDeviceChanged(payload) }
    }

    private fun emitAudioDeviceChanged(payload: ReadableMap) {
        // The emitter callback is set after initialize(); drop events fired before that (JS reads
        // the initial state through getAudioDeviceStatus)
        if (mEventEmitterCallback == null) return
        emitOnAudioDeviceChanged(payload)
    }

    override fun invalidate() {
        mAudioDeviceManager.onAudioDeviceChanged = null
        // Ensure we cleanup proximity and screen flags too
        stop()
        mSoundPlayer.stopSound()
        mAudioDeviceManager.close()
        super.invalidate()
    }

    override fun setAudioRole(audioRole: String) {
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

    override fun setTelecomManagedMode(enabled: Boolean) {
        AudioDeviceManager.runInAudioThread {
            if (audioManagerActivated) {
                Log.e(TAG, "setTelecomManagedMode(): AudioManager is already activated and so telecom-managed mode cannot be changed")
                return@runInAudioThread
            }
            Log.d(TAG, "setTelecomManagedMode(): $enabled")
            mAudioDeviceManager.telecomManagedMode = enabled
        }
    }

    override fun setDisableCommunicationModeWorkaround(disabled: Boolean) {
        AudioDeviceManager.runInAudioThread {
            if (audioManagerActivated) {
                Log.e(TAG, "setDisableCommunicationModeWorkaround(): AudioManager is already activated and so it cannot be changed")
                return@runInAudioThread
            }
            Log.d(TAG, "setDisableCommunicationModeWorkaround(): $disabled")
            mAudioDeviceManager.disableCommunicationModeWorkaround = disabled
        }
    }

    override fun setDefaultAudioDeviceEndpointType(endpointDeviceTypeName: String) {
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

    override fun setEnableStereoAudioOutput(enabled: Boolean) {
        AudioDeviceManager.runInAudioThread {
            if (audioManagerActivated) {
                Log.e(TAG, "setEnableStereoAudioOutput(): AudioManager is already activated and so enabling stereo audio output cannot be changed")
                return@runInAudioThread
            }
            mAudioDeviceManager.enableStereo = enabled
        }
    }

    override fun setup() {
        AudioDeviceManager.runInAudioThread {
            mAudioDeviceManager.setup()
        }
    }

    override fun start() {
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

    override fun stop() {
        AudioDeviceManager.runInAudioThread {
            if (audioManagerActivated) {
                Log.d(TAG, "stop() mAudioDeviceManager")
                mAudioDeviceManager.stop(reactApplicationContext.currentActivity)
                audioManagerActivated = false
                mAudioDeviceManager.setMicrophoneMute(false)
                setKeepScreenOn(false)
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

    override fun setForceSpeakerphoneOn(enable: Boolean) {
        AudioDeviceManager.runInAudioThread {
            if (mAudioDeviceManager.callAudioRole !== CallAudioRole.Communicator) {
                Log.e(
                    TAG,
                    "setForceSpeakerphoneOn() is not supported when audio role is not Communicator"
                )
                return@runInAudioThread
            }
            mAudioDeviceManager.setSpeakerphoneOn(enable)
        }
    }

    override fun getAudioDeviceStatus(promise: Promise) {
        promise.resolve(mAudioDeviceManager.audioStatusMap())
    }

    override fun logAudioState() {
        Log.d(TAG, getAudioStateLog())
    }

    override fun getAudioStateLog(): String {
        return WebRtcAudioUtils.getAudioStateLog(reactApplicationContext) +
            "Communication mode keep-alive: ${mAudioDeviceManager.communicationModeKeepAliveState()}\n"
    }

    override fun chooseAudioDeviceEndpoint(deviceId: String) {
        AudioDeviceManager.runInAudioThread {
            if (mAudioDeviceManager.callAudioRole !== CallAudioRole.Communicator) {
                Log.e(
                    TAG,
                    "chooseAudioDeviceEndpoint() is not supported when audio role is not Communicator"
                )
                return@runInAudioThread
            }
            mAudioDeviceManager.switchDeviceById(
                deviceId
            )
        }
    }

    override fun playSound(soundName: String?, playIfMuted: Boolean) {
        mSoundPlayer.playSound(soundName, playIfMuted)
    }

    override fun stopSound() {
        mSoundPlayer.stopSound()
    }

    override fun muteAudioOutput() {
        AudioDeviceManager.runInAudioThread {
            mAudioDeviceManager.muteAudioOutput()
        }
    }

    override fun unmuteAudioOutput() {
        AudioDeviceManager.runInAudioThread {
            mAudioDeviceManager.unmuteAudioOutput()
        }
    }

    // iOS-only methods, no-ops on Android

    override fun setMuteMode(mode: Double) {}

    override fun setRecordingAlwaysPreparedMode(enabled: Boolean) {}

    override fun showAudioRoutePicker() {}

    override fun reapplyAudioRoute() {}


    override fun onHostResume() {
    }

    override fun onHostPause() {
    }

    override fun onHostDestroy() {
        stop()
    }

    companion object {
        const val TAG = "StreamInCallManager"
    }
}

