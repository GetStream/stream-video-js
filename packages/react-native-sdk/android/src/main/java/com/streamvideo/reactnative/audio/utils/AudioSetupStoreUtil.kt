package com.streamvideo.reactnative.audio.utils

import android.media.AudioManager
import android.util.Log
import com.facebook.react.bridge.ReactContext
import com.streamvideo.reactnative.audio.AudioDeviceManager
import com.streamvideo.reactnative.callmanager.StreamInCallManagerModule.Companion.TAG

class AudioSetupStoreUtil(
    private val mReactContext: ReactContext,
    private val mAudioManager: AudioManager,
    private val mAudioDeviceManager: AudioDeviceManager
) {
    private var isOrigAudioSetupStored = false
    private var origIsSpeakerPhoneOn = false
    private var origIsMicrophoneMute = false
    private var origAudioMode = AudioManager.MODE_NORMAL

    fun storeOriginalAudioSetup() {
        if (!isOrigAudioSetupStored) {
            origAudioMode = mAudioManager.mode
            origIsSpeakerPhoneOn = AudioManagerUtil.isSpeakerphoneOn(mAudioManager)
            origIsMicrophoneMute = mAudioManager.isMicrophoneMute
            isOrigAudioSetupStored = true
        }
    }

    fun restoreOriginalAudioSetup() {
        if (isOrigAudioSetupStored) {
            if (origIsSpeakerPhoneOn) {
                mAudioDeviceManager.setSpeakerphoneOn(true)
            }
            mAudioManager.setMicrophoneMute(origIsMicrophoneMute)
            mAudioManager.mode = origAudioMode
            mReactContext.currentActivity?.apply {
                volumeControlStream = AudioManager.USE_DEFAULT_STREAM_TYPE
            }
            isOrigAudioSetupStored = false
        }
    }
}
