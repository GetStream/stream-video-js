/*
 * Copyright (c) 2017 Henry Lin @zxcpoiu
 * 
 * Permission to use, copy, modify, and distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */
package com.streamvideo.reactnative.callmanager

import android.annotation.SuppressLint
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.AudioManager.ACTION_HEADSET_PLUG
import android.media.AudioManager.OnAudioFocusChangeListener
import android.media.MediaPlayer
import android.media.ToneGenerator
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.Parcelable
import android.os.PowerManager
import android.provider.Settings
import android.util.Log
import android.view.Display
import android.view.KeyEvent
import android.view.WindowManager
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.streamvideo.reactnative.audio.AudioDeviceManager
import com.streamvideo.reactnative.audio.OnAudioDeviceChangedListener
import com.streamvideo.reactnative.audio.utils.AudioDeviceEndpointUtils
import com.streamvideo.reactnative.audio.utils.AudioManagerUtil
import com.streamvideo.reactnative.callmanager.utils.InCallWakeLockUtils
import com.streamvideo.reactnative.model.AudioDeviceEndpoint
import com.streamvideo.reactnative.model.AudioDeviceEndpoint.Companion.EndpointType
import java.io.File
import java.util.Random

class InCallManagerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext),
    LifecycleEventListener, OnAudioFocusChangeListener {

    // --- Screen Manager
    private val mPowerManager: PowerManager
    private var lastLayoutParams: WindowManager.LayoutParams? = null
    private val mWindowManager: WindowManager

    // --- AudioRouteManager
    private val audioManager: AudioManager
    private var audioManagerActivated = false
    private var isAudioFocused = false

    //private final Object mAudioFocusLock = new Object();
    private var isOrigAudioSetupStored = false
    private var origIsSpeakerPhoneOn = false
    private var origIsMicrophoneMute = false
    private var origAudioMode = AudioManager.MODE_NORMAL
    private val defaultAudioMode = AudioManager.MODE_IN_COMMUNICATION
    private var forceSpeakerOn = 0
    private var isProximityRegistered = false
    private val proximityIsNear = false
    private val noisyAudioReceiver: BroadcastReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (AudioManager.ACTION_AUDIO_BECOMING_NOISY == intent.action) {
                sendEvent("NoisyAudio", null)
            }
        }
    }
    private val mediaButtonReceiver: BroadcastReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (Intent.ACTION_MEDIA_BUTTON == intent.action) {
                val event =
                    intent.getParcelableExtra<Parcelable>(Intent.EXTRA_KEY_EVENT) as KeyEvent?
                val keyCode = event!!.keyCode
                var keyText = ""
                keyText = when (keyCode) {
                    KeyEvent.KEYCODE_MEDIA_PLAY -> "KEYCODE_MEDIA_PLAY"
                    KeyEvent.KEYCODE_MEDIA_PAUSE -> "KEYCODE_MEDIA_PAUSE"
                    KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE -> "KEYCODE_MEDIA_PLAY_PAUSE"
                    KeyEvent.KEYCODE_MEDIA_NEXT -> "KEYCODE_MEDIA_NEXT"
                    KeyEvent.KEYCODE_MEDIA_PREVIOUS -> "KEYCODE_MEDIA_PREVIOUS"
                    KeyEvent.KEYCODE_MEDIA_CLOSE -> "KEYCODE_MEDIA_CLOSE"
                    KeyEvent.KEYCODE_MEDIA_EJECT -> "KEYCODE_MEDIA_EJECT"
                    KeyEvent.KEYCODE_MEDIA_RECORD -> "KEYCODE_MEDIA_RECORD"
                    KeyEvent.KEYCODE_MEDIA_STOP -> "KEYCODE_MEDIA_STOP"
                    else -> "KEYCODE_UNKNOW"
                }
                val data = Arguments.createMap()
                data.putString("eventText", keyText)
                data.putInt("eventCode", keyCode)
                sendEvent("MediaButton", data)
            }
        }
    }
    private var mAudioAttributes: AudioAttributes? = null
    private var mAudioFocusRequest: AudioFocusRequest? = null

    // --- same as: RingtoneManager.getActualDefaultRingtoneUri(reactContext, RingtoneManager.TYPE_RINGTONE);
    private val defaultRingtoneUri: Uri = Settings.System.DEFAULT_RINGTONE_URI
    private val defaultRingbackUri: Uri = Settings.System.DEFAULT_RINGTONE_URI
    private val defaultBusytoneUri: Uri = Settings.System.DEFAULT_NOTIFICATION_URI

    //private Uri defaultAlarmAlertUri = Settings.System.DEFAULT_ALARM_ALERT_URI; // --- too annoying
    private var bundleRingtoneUri: Uri? = null
    private var bundleRingbackUri: Uri? = null
    private var bundleBusytoneUri: Uri? = null
    private val audioUriMap: MutableMap<String, Uri?>
    private var mRingtone: MyPlayerInterface? = null
    private var mRingback: MyPlayerInterface? = null
    private var mBusytone: MyPlayerInterface? = null
    private var mRingtoneCountDownHandler: Handler? = null
    private var media = "audio"

    /** AudioManager state.  */
    enum class AudioManagerState {
        UNINITIALIZED,
        PREINITIALIZED,
        RUNNING,
    }

    private val savedAudioMode = AudioManager.MODE_INVALID
    private val savedIsSpeakerPhoneOn = false
    private val savedIsMicrophoneMute = false

    // Default audio device; speaker phone for video calls or earpiece for audio
    // only calls
    @EndpointType
    private var defaultAudioDevice = AudioDeviceEndpoint.TYPE_UNKNOWN

    /** Returns the currently selected audio device.  */
    // Contains the currently selected audio device.
    // This device is changed automatically using a certain scheme where e.g.
    // a wired headset "wins" over speaker phone. It is also possible for a
    // user to explicitly select a device (and overrid any predefined scheme).
    // See |userSelectedAudioDevice| for details.
    @EndpointType
    private var selectedAudioDevice: Int? = null

    // Contains the user-selected audio device which overrides the predefined
    // selection scheme.
    // TODO(henrika): always set to AudioDevice.NONE today. Add support for
    // explicit selection based on choice by userSelectedAudioDevice.
    @EndpointType
    private var userSelectedAudioDevice: Int? = null

    // Contains speakerphone setting: auto, true or false
    private val useSpeakerphone = SPEAKERPHONE_AUTO

    // Handles all tasks related to Bluetooth headset devices.
    private var bluetoothManager: AppRTCBluetoothManager? = null

    private val proximityManager: InCallProximityManager

    private val wakeLockUtils: InCallWakeLockUtils

    private val audioDeviceManager = AudioDeviceManager(reactContext, object : OnAudioDeviceChangedListener {
        override fun onAudioDevicesChanged() {
            updateAudioDeviceState()
        }
    })

    internal interface MyPlayerInterface {
        val isPlaying: Boolean
        fun startPlay(data: Map<String, Any>)
        fun stopPlay()
    }

    override fun getName(): String {
        return TAG
    }

    init {
        reactContext.addLifecycleEventListener(this)
        mWindowManager = reactContext.getSystemService(Context.WINDOW_SERVICE) as WindowManager
        mPowerManager = reactContext.getSystemService(Context.POWER_SERVICE) as PowerManager
        audioManager = (reactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager)
        audioUriMap = HashMap()
        audioUriMap["defaultRingtoneUri"] = defaultRingtoneUri
        audioUriMap["defaultRingbackUri"] = defaultRingbackUri
        audioUriMap["defaultBusytoneUri"] = defaultBusytoneUri
        audioUriMap["bundleRingtoneUri"] = bundleRingtoneUri
        audioUriMap["bundleRingbackUri"] = bundleRingbackUri
        audioUriMap["bundleBusytoneUri"] = bundleBusytoneUri
        wakeLockUtils = InCallWakeLockUtils(reactContext)
        proximityManager = InCallProximityManager.create(
            reactContext,
            this
        )

        UiThreadUtil.runOnUiThread {
            bluetoothManager = AppRTCBluetoothManager(
                reactContext,
                this
            )
        }

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
        audioDeviceManager.close()
        super.invalidate()
    }

    private fun manualTurnScreenOff() {
        Log.d(TAG, "manualTurnScreenOff()")
        val mCurrentActivity = currentActivity

        if (mCurrentActivity == null) {
            Log.d(TAG, "ReactContext doesn't have any Activity attached.")
            return
        }

        UiThreadUtil.runOnUiThread {
            val window = mCurrentActivity.window
            val params = window.attributes
            lastLayoutParams = params // --- store last param
            params.screenBrightness =
                WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_OFF // --- Dim as dark as possible. see BRIGHTNESS_OVERRIDE_OFF
            window.attributes = params
            window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
    }

    private fun manualTurnScreenOn() {
        Log.d(TAG, "manualTurnScreenOn()")
        val mCurrentActivity = currentActivity

        if (mCurrentActivity == null) {
            Log.d(TAG, "ReactContext doesn't have any Activity attached.")
            return
        }

        UiThreadUtil.runOnUiThread {
            val window = mCurrentActivity.window
            if (lastLayoutParams != null) {
                window.attributes = lastLayoutParams
            } else {
                val params = window.attributes
                params.screenBrightness = -1f // --- Dim to preferable one
                window.attributes = params
            }
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
    }

    private fun storeOriginalAudioSetup() {
        Log.d(TAG, "storeOriginalAudioSetup()")
        if (!isOrigAudioSetupStored) {
            origAudioMode = audioManager.mode
            origIsSpeakerPhoneOn = AudioManagerUtil.isSpeakerphoneOn(audioManager)
            origIsMicrophoneMute = audioManager.isMicrophoneMute
            isOrigAudioSetupStored = true
        }
    }

    private fun restoreOriginalAudioSetup() {
        Log.d(TAG, "restoreOriginalAudioSetup()")
        if (isOrigAudioSetupStored) {
            if (origIsSpeakerPhoneOn) {
                audioDeviceManager.setSpeakerphoneOn(true, bluetoothManager!!)
            }
            setMicrophoneMute(origIsMicrophoneMute)
            audioManager.mode = origAudioMode
            if (currentActivity != null) {
                currentActivity!!.volumeControlStream = AudioManager.USE_DEFAULT_STREAM_TYPE
            }
            isOrigAudioSetupStored = false
        }
    }

    private fun startNoisyAudioEvent() {
        Log.d(TAG, "startNoisyAudioEvent()")
        val filter = IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY)
        registerReceiver(noisyAudioReceiver, filter)
    }

    private fun stopNoisyAudioEvent() {
        Log.d(TAG, "stopNoisyAudioEvent()")
        unregisterReceiver(this.noisyAudioReceiver)
    }

    private fun startMediaButtonEvent() {
        Log.d(TAG, "startMediaButtonEvent()")
        val filter = IntentFilter(Intent.ACTION_MEDIA_BUTTON)
        registerReceiver(mediaButtonReceiver, filter)
    }

    private fun stopMediaButtonEvent() {
        Log.d(TAG, "stopMediaButtonEvent()")
        this.unregisterReceiver(this.mediaButtonReceiver)
    }

    fun onProximitySensorChangedState(isNear: Boolean) {
        if (selectedAudioDevice == AudioDeviceEndpoint.TYPE_EARPIECE) {
            if (isNear) {
                turnScreenOff()
            } else {
                turnScreenOn()
            }
        }
        val data = Arguments.createMap()
        data.putBoolean("isNear", isNear)
        sendEvent("Proximity", data)
    }

    @ReactMethod
    fun startProximitySensor() {
        if (!proximityManager.isProximitySupported) {
            Log.d(TAG, "Proximity Sensor is not supported.")
            return
        }
        if (isProximityRegistered) {
            Log.d(TAG, "Proximity Sensor is already registered.")
            return
        }
        // --- SENSOR_DELAY_FASTEST(0 milisecs), SENSOR_DELAY_GAME(20 milisecs), SENSOR_DELAY_UI(60 milisecs), SENSOR_DELAY_NORMAL(200 milisecs)
        if (!proximityManager.start()) {
            Log.d(TAG, "proximityManager.start() failed. return false")
            return
        }
        Log.d(TAG, "startProximitySensor()")
        isProximityRegistered = true
    }

    @ReactMethod
    fun stopProximitySensor() {
        if (!proximityManager.isProximitySupported) {
            Log.d(TAG, "Proximity Sensor is not supported.")
            return
        }
        if (!isProximityRegistered) {
            Log.d(TAG, "Proximity Sensor is not registered.")
            return
        }
        Log.d(TAG, "stopProximitySensor()")
        proximityManager.stop()
        isProximityRegistered = false
    }

    // --- see: https://developer.android.com/reference/android/media/AudioManager
    override fun onAudioFocusChange(focusChange: Int) {
        val focusChangeStr = when (focusChange) {
            AudioManager.AUDIOFOCUS_GAIN -> "AUDIOFOCUS_GAIN"
            AudioManager.AUDIOFOCUS_GAIN_TRANSIENT -> "AUDIOFOCUS_GAIN_TRANSIENT"
            AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE -> "AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE"
            AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK -> "AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK"
            AudioManager.AUDIOFOCUS_LOSS -> "AUDIOFOCUS_LOSS"
            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> "AUDIOFOCUS_LOSS_TRANSIENT"
            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> "AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK"
            AudioManager.AUDIOFOCUS_NONE -> "AUDIOFOCUS_NONE"
            else -> "AUDIOFOCUS_UNKNOW"
        }

        Log.d(
            TAG,
            "onAudioFocusChange(): $focusChange - $focusChangeStr"
        )

        val data = Arguments.createMap()
        data.putString("eventText", focusChangeStr)
        data.putInt("eventCode", focusChange)
        sendEvent("onAudioFocusChange", data)
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        try {
            val reactContext: ReactContext? = reactApplicationContext
            if (reactContext != null && reactContext.hasActiveReactInstance()) {
                reactContext
                    .getJSModule(
                        DeviceEventManagerModule.RCTDeviceEventEmitter::class.java
                    )
                    .emit(eventName, params)
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
    fun start(_media: String, ringbackUriType: String) {
        media = _media
        if (!audioManagerActivated) {
            audioManagerActivated = true

            Log.d(TAG, "start audioRouteManager")
            wakeLockUtils.acquirePartialWakeLock()
            if (mRingtone != null && mRingtone!!.isPlaying) {
                Log.d(TAG, "stop ringtone")
                stopRingtone() // --- use brandnew instance
            }
            storeOriginalAudioSetup()
            requestAudioFocus()
            startEvents()
            UiThreadUtil.runOnUiThread {
                bluetoothManager!!.start()
            }
            // TODO: even if not acquired focus, we can still play sounds. but need figure out which is better.
            //getCurrentActivity().setVolumeControlStream(AudioManager.STREAM_VOICE_CALL);
            audioManager.mode = defaultAudioMode
            setMicrophoneMute(false)
            forceSpeakerOn = 0
            defaultAudioDevice =
                if (media == "video" || !hasEarpiece()) AudioDeviceEndpoint.TYPE_SPEAKER else AudioDeviceEndpoint.TYPE_EARPIECE
            userSelectedAudioDevice = null
            selectedAudioDevice = null
            // TODO: add quirk workarounds from Jetpack telecom
            updateAudioDeviceState()

            if (ringbackUriType.isNotEmpty()) {
                startRingback(ringbackUriType)
            }
        }
    }

    fun stop() {
        stop("")
    }

    @ReactMethod
    fun stop(busytoneUriType: String) {
        if (audioManagerActivated) {
            stopRingback()
            if (busytoneUriType.isNotEmpty() && startBusytone(busytoneUriType)) {
                // play busytone first, and call this func again when finish
                Log.d(TAG, "play busytone before stop InCallManager")
                return
            } else {
                Log.d(TAG, "stop() InCallManager")
                stopBusytone()
                stopEvents()
                audioDeviceManager.onCallManagerStop()
                setMicrophoneMute(false)
                UiThreadUtil.runOnUiThread {
                    bluetoothManager!!.stop()
                }
                restoreOriginalAudioSetup()
                abandonAudioFocus()
                audioManagerActivated = false
            }
            wakeLockUtils.releasePartialWakeLock()
        }
    }

    private fun startEvents() {
        startNoisyAudioEvent()
        startMediaButtonEvent()
        startProximitySensor() // --- proximity event always enable, but only turn screen off when audio is routing to earpiece.
        setKeepScreenOn(true)
    }

    private fun stopEvents() {
        stopNoisyAudioEvent()
        stopMediaButtonEvent()
        stopProximitySensor()
        setKeepScreenOn(false)
        turnScreenOn()
    }

    @ReactMethod
    fun requestAudioFocus(promise: Promise) {
        promise.resolve(requestAudioFocus())
    }

    private fun requestAudioFocus(): String {
        val requestAudioFocusResStr = if (Build.VERSION.SDK_INT >= 26)
            requestAudioFocusV26()
        else
            requestAudioFocusOld()
        Log.d(
            TAG,
            "requestAudioFocus(): res = $requestAudioFocusResStr"
        )
        return requestAudioFocusResStr
    }

    @RequiresApi(26)
    private fun requestAudioFocusV26(): String {
        if (isAudioFocused) {
            return ""
        }

        if (mAudioAttributes == null) {
            mAudioAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build()
        }

        if (mAudioFocusRequest == null) {
            mAudioFocusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                .setAudioAttributes(mAudioAttributes!!)
                .setAcceptsDelayedFocusGain(false)
                .setWillPauseWhenDucked(false)
                .setOnAudioFocusChangeListener(this)
                .build()
        }

        val requestAudioFocusRes = audioManager.requestAudioFocus(mAudioFocusRequest!!)

        val requestAudioFocusResStr: String
        when (requestAudioFocusRes) {
            AudioManager.AUDIOFOCUS_REQUEST_FAILED -> requestAudioFocusResStr =
                "AUDIOFOCUS_REQUEST_FAILED"

            AudioManager.AUDIOFOCUS_REQUEST_GRANTED -> {
                isAudioFocused = true
                requestAudioFocusResStr = "AUDIOFOCUS_REQUEST_GRANTED"
            }

            AudioManager.AUDIOFOCUS_REQUEST_DELAYED -> requestAudioFocusResStr =
                "AUDIOFOCUS_REQUEST_DELAYED"

            else -> requestAudioFocusResStr = "AUDIOFOCUS_REQUEST_UNKNOWN"
        }

        return requestAudioFocusResStr
    }

    private fun requestAudioFocusOld(): String {
        if (isAudioFocused) {
            return ""
        }

        val requestAudioFocusRes = audioManager.requestAudioFocus(
            this,
            AudioManager.STREAM_VOICE_CALL,
            AudioManager.AUDIOFOCUS_GAIN_TRANSIENT
        )

        val requestAudioFocusResStr: String
        when (requestAudioFocusRes) {
            AudioManager.AUDIOFOCUS_REQUEST_FAILED -> requestAudioFocusResStr =
                "AUDIOFOCUS_REQUEST_FAILED"

            AudioManager.AUDIOFOCUS_REQUEST_GRANTED -> {
                isAudioFocused = true
                requestAudioFocusResStr = "AUDIOFOCUS_REQUEST_GRANTED"
            }

            else -> requestAudioFocusResStr = "AUDIOFOCUS_REQUEST_UNKNOWN"
        }

        return requestAudioFocusResStr
    }

    @ReactMethod
    fun abandonAudioFocusJS(promise: Promise) {
        promise.resolve(abandonAudioFocus())
    }

    private fun abandonAudioFocus(): String {
        val abandonAudioFocusResStr = if (Build.VERSION.SDK_INT >= 26)
            abandonAudioFocusV26()
        else
            abandonAudioFocusOld()
        Log.d(
            TAG,
            "abandonAudioFocus(): res = $abandonAudioFocusResStr"
        )
        return abandonAudioFocusResStr
    }

    @RequiresApi(26)
    private fun abandonAudioFocusV26(): String {
        if (!isAudioFocused || mAudioFocusRequest == null) {
            return ""
        }

        val abandonAudioFocusRes = audioManager.abandonAudioFocusRequest(
            mAudioFocusRequest!!
        )
        val abandonAudioFocusResStr: String
        when (abandonAudioFocusRes) {
            AudioManager.AUDIOFOCUS_REQUEST_FAILED -> abandonAudioFocusResStr =
                "AUDIOFOCUS_REQUEST_FAILED"

            AudioManager.AUDIOFOCUS_REQUEST_GRANTED -> {
                isAudioFocused = false
                abandonAudioFocusResStr = "AUDIOFOCUS_REQUEST_GRANTED"
            }

            else -> abandonAudioFocusResStr = "AUDIOFOCUS_REQUEST_UNKNOWN"
        }

        return abandonAudioFocusResStr
    }

    private fun abandonAudioFocusOld(): String {
        if (!isAudioFocused) {
            return ""
        }

        val abandonAudioFocusRes = audioManager.abandonAudioFocus(this)

        val abandonAudioFocusResStr: String
        when (abandonAudioFocusRes) {
            AudioManager.AUDIOFOCUS_REQUEST_FAILED -> abandonAudioFocusResStr =
                "AUDIOFOCUS_REQUEST_FAILED"

            AudioManager.AUDIOFOCUS_REQUEST_GRANTED -> {
                isAudioFocused = false
                abandonAudioFocusResStr = "AUDIOFOCUS_REQUEST_GRANTED"
            }

            else -> abandonAudioFocusResStr = "AUDIOFOCUS_REQUEST_UNKNOWN"
        }

        return abandonAudioFocusResStr
    }

    @ReactMethod
    fun pokeScreen(timeout: Int) {
        Log.d(TAG, "pokeScreen()")
        wakeLockUtils.acquirePokeFullWakeLockReleaseAfter(timeout.toLong()) // --- default 3000 ms
    }

    private fun debugScreenPowerState() {
        var isDeviceIdleMode = "unknow" // --- API 23
        var isIgnoringBatteryOptimizations = "unknow" // --- API 23
        var isPowerSaveMode = "unknow" // --- API 21
        var isInteractive = "unknow" // --- API 20 ( before since API 7 is: isScreenOn())
        var screenState = "unknow" // --- API 20
        isDeviceIdleMode = String.format("%s", mPowerManager.isDeviceIdleMode)
        isIgnoringBatteryOptimizations =
            String.format("%s", mPowerManager.isIgnoringBatteryOptimizations(reactApplicationContext.packageName))
        isPowerSaveMode = String.format("%s", mPowerManager.isPowerSaveMode)
        isInteractive = String.format("%s", mPowerManager.isInteractive)
        val display = mWindowManager.defaultDisplay
        when (display.state) {
            Display.STATE_OFF -> screenState = "STATE_OFF"
            Display.STATE_ON -> screenState = "STATE_ON"
            Display.STATE_DOZE -> screenState = "STATE_DOZE"
            Display.STATE_DOZE_SUSPEND -> screenState = "STATE_DOZE_SUSPEND"
            else -> {}
        }
        Log.d(
            TAG,
            String.format(
                "debugScreenPowerState(): screenState='%s', isInteractive='%s', isPowerSaveMode='%s', isDeviceIdleMode='%s', isIgnoringBatteryOptimizations='%s'",
                screenState,
                isInteractive,
                isPowerSaveMode,
                isDeviceIdleMode,
                isIgnoringBatteryOptimizations
            )
        )
    }

    @ReactMethod
    fun turnScreenOn() {
        if (proximityManager.isProximityWakeLockSupported) {
            Log.d(TAG, "turnScreenOn(): use proximity lock.")
            proximityManager.releaseProximityWakeLock(true)
        } else {
            Log.d(TAG, "turnScreenOn(): proximity lock is not supported. try manually.")
            manualTurnScreenOn()
        }
    }

    @ReactMethod
    fun turnScreenOff() {
        if (proximityManager.isProximityWakeLockSupported) {
            Log.d(TAG, "turnScreenOff(): use proximity lock.")
            proximityManager.acquireProximityWakeLock()
        } else {
            Log.d(TAG, "turnScreenOff(): proximity lock is not supported. try manually.")
            manualTurnScreenOff()
        }
    }

    @ReactMethod
    fun setKeepScreenOn(enable: Boolean) {
        Log.d(TAG, "setKeepScreenOn() $enable")

        val mCurrentActivity = currentActivity

        if (mCurrentActivity == null) {
            Log.d(TAG, "ReactContext doesn't have any Activity attached.")
            return
        }

        UiThreadUtil.runOnUiThread {
            val window = mCurrentActivity.window
            if (enable) {
                window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            } else {
                window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            }
        }
    }

    @ReactMethod
    fun setForceSpeakerphoneOn(enable: Boolean) {
        Log.d(TAG, "setForceSpeakerphoneOn(): $enable")
        audioDeviceManager.setSpeakerphoneOn(enable, bluetoothManager!!)
    }

    @ReactMethod
    fun setMicrophoneMute(enable: Boolean) {
        if (enable != audioManager.isMicrophoneMute) {
            Log.d(TAG, "setMicrophoneMute(): $enable")
            audioManager.isMicrophoneMute = enable
        }
    }

    /**
     * This is part of start() process.
     * ringbackUriType must not empty. empty means do not play.
     */
    @ReactMethod
    fun startRingback(ringbackUriType: String) {
        if (ringbackUriType.isEmpty()) {
            return
        }
        try {
            Log.d(
                TAG,
                "startRingback(): UriType=$ringbackUriType"
            )

            if (mRingback != null) {
                if (mRingback!!.isPlaying) {
                    Log.d(TAG, "startRingback(): is already playing")
                    return
                }

                stopRingback() // --- use brandnew instance
            }
            val data = HashMap<String, Any>()
            data["name"] = "mRingback"

            // --- use ToneGenerator instead file uri
            if (ringbackUriType == "_DTMF_") {
                mRingback = myToneGenerator(ToneGeneratorConsts.RINGBACK)
                mRingback!!.startPlay(data)
                return
            }

            val ringbackUri = getRingbackUri(ringbackUriType)
            if (ringbackUri == null) {
                Log.d(TAG, "startRingback(): no available media")
                return
            }

            val myPlayer = myMediaPlayer()
            mRingback = myPlayer
            data["sourceUri"] = ringbackUri
            data["setLooping"] = true

            //data.put("audioStream", AudioManager.STREAM_VOICE_CALL); // --- lagacy
            // --- The ringback doesn't have to be a DTMF.
            // --- Should use VOICE_COMMUNICATION for sound during call or it may be silenced.
            data["audioUsage"] = AudioAttributes.USAGE_VOICE_COMMUNICATION
            data["audioContentType"] = AudioAttributes.CONTENT_TYPE_MUSIC

            setMediaPlayerEvents(myPlayer, "mRingback")
            myPlayer.startPlay(data)
        } catch (e: Exception) {
            Log.d(TAG, "startRingback() failed", e)
        }
    }

    @ReactMethod
    fun stopRingback() {
        try {
            if (mRingback != null) {
                mRingback!!.stopPlay()
                mRingback = null
            }
        } catch (e: Exception) {
            Log.d(TAG, "stopRingback() failed")
        }
    }

    /**
     * This is part of start() process.
     * busytoneUriType must not empty. empty means do not play.
     * return false to indicate play tone failed and should be stop() immediately
     * otherwise, it will stop() after a tone completed.
     */
    fun startBusytone(busytoneUriType: String): Boolean {
        if (busytoneUriType.isEmpty()) {
            return false
        }
        try {
            Log.d(
                TAG,
                "startBusytone(): UriType=$busytoneUriType"
            )
            if (mBusytone != null) {
                if (mBusytone!!.isPlaying) {
                    Log.d(TAG, "startBusytone(): is already playing")
                    return false
                }

                stopBusytone() // --- use brandnew instance
            }
            val data = HashMap<String, Any>()
            data["name"] = "mBusytone"

            // --- use ToneGenerator instead file uri
            if (busytoneUriType == "_DTMF_") {
                mBusytone = myToneGenerator(ToneGeneratorConsts.BUSY)
                mBusytone!!.startPlay(data)
                return true
            }

            val busytoneUri = getBusytoneUri(busytoneUriType)
            if (busytoneUri == null) {
                Log.d(TAG, "startBusytone(): no available media")
                return false
            }


            val myPlayer = myMediaPlayer()
            mBusytone = myPlayer

            data["sourceUri"] = busytoneUri
            data["setLooping"] = false
            //data.put("audioStream", AudioManager.STREAM_VOICE_CALL); // --- lagacy
            // --- Should use VOICE_COMMUNICATION for sound during a call or it may be silenced.
            data["audioUsage"] = AudioAttributes.USAGE_VOICE_COMMUNICATION
            data["audioContentType"] =
                AudioAttributes.CONTENT_TYPE_SONIFICATION // --- CONTENT_TYPE_MUSIC?

            setMediaPlayerEvents(myPlayer, "mBusytone")
            myPlayer.startPlay(data)
            return true
        } catch (e: Exception) {
            Log.d(TAG, "startBusytone() failed", e)
            return false
        }
    }

    fun stopBusytone() {
        try {
            if (mBusytone != null) {
                mBusytone!!.stopPlay()
                mBusytone = null
            }
        } catch (e: Exception) {
            Log.d(TAG, "stopBusytone() failed")
        }
    }

    @ReactMethod
    fun startRingtone(ringtoneUriType: String, seconds: Int) {
        val thread: Thread = object : Thread() {
            override fun run() {
                try {
                    Looper.prepare()

                    Log.d(
                        TAG,
                        "startRingtone(): UriType=$ringtoneUriType"
                    )
                    if (mRingtone != null) {
                        if (mRingtone!!.isPlaying) {
                            Log.d(TAG, "startRingtone(): is already playing")
                            return
                        } else {
                            stopRingtone() // --- use brandnew instance
                        }
                    }

                    //if (!audioManager.isStreamMute(AudioManager.STREAM_RING)) {
                    //if (origRingerMode == AudioManager.RINGER_MODE_NORMAL) {
                    if (audioManager.getStreamVolume(AudioManager.STREAM_RING) == 0) {
                        Log.d(TAG, "startRingtone(): ringer is silent. leave without play.")
                        return
                    }

                    // --- there is no _DTMF_ option in startRingtone()
                    val ringtoneUri = getRingtoneUri(ringtoneUriType)
                    if (ringtoneUri == null) {
                        Log.d(TAG, "startRingtone(): no available media")
                        return
                    }

                    if (audioManagerActivated) {
                        this@InCallManagerModule.stop()
                    }

                    wakeLockUtils.acquirePartialWakeLock()

                    storeOriginalAudioSetup()
                    val data = HashMap<String, Any>()
                    val myPlayer = myMediaPlayer()
                    mRingtone = myPlayer

                    data["name"] = "mRingtone"
                    data["sourceUri"] = ringtoneUri
                    data["setLooping"] = true

                    //data.put("audioStream", AudioManager.STREAM_RING); // --- lagacy
                    data["audioUsage"] =
                        AudioAttributes.USAGE_NOTIFICATION_RINGTONE // --- USAGE_NOTIFICATION_COMMUNICATION_REQUEST?
                    data["audioContentType"] = AudioAttributes.CONTENT_TYPE_MUSIC

                    setMediaPlayerEvents(myPlayer, "mRingtone")

                    myPlayer.startPlay(data)

                    if (seconds > 0) {
                        val handler = Handler(Looper.myLooper()!!)
                        mRingtoneCountDownHandler = handler
                        handler.postDelayed({
                            try {
                                Log.d(
                                    TAG,
                                    String.format(
                                        "mRingtoneCountDownHandler.stopRingtone() timeout after %d seconds",
                                        seconds
                                    )
                                )
                                stopRingtone()
                            } catch (e: Exception) {
                                Log.d(
                                    TAG,
                                    "mRingtoneCountDownHandler.stopRingtone() failed."
                                )
                            }
                        }, (seconds * 1000).toLong())
                    }

                    Looper.loop()
                } catch (e: Exception) {
                    wakeLockUtils.releasePartialWakeLock()
                    Log.e(TAG, "startRingtone() failed", e)
                }
            }
        }

        thread.start()
    }

    @ReactMethod
    fun stopRingtone() {
        val thread: Thread = object : Thread() {
            override fun run() {
                try {
                    if (mRingtone != null) {
                        mRingtone!!.stopPlay()
                        mRingtone = null
                        restoreOriginalAudioSetup()
                    }
                    if (mRingtoneCountDownHandler != null) {
                        mRingtoneCountDownHandler!!.removeCallbacksAndMessages(null)
                        mRingtoneCountDownHandler = null
                    }
                } catch (e: Exception) {
                    Log.d(TAG, "stopRingtone() failed")
                }
                wakeLockUtils.releasePartialWakeLock()
            }
        }

        thread.start()
    }

    private fun setMediaPlayerEvents(mp: MediaPlayer, name: String) {
        mp.setOnErrorListener { mp, what, extra ->

            //http://developer.android.com/reference/android/media/MediaPlayer.OnErrorListener.html
            Log.d(
                TAG,
                String.format(
                    "MediaPlayer %s onError(). what: %d, extra: %d",
                    name,
                    what,
                    extra
                )
            )
            //return True if the method handled the error
            //return False, or not having an OnErrorListener at all, will cause the OnCompletionListener to be called. Get news & tips 
            true
        }

        mp.setOnInfoListener { mp, what, extra ->

            //http://developer.android.com/reference/android/media/MediaPlayer.OnInfoListener.html
            Log.d(
                TAG,
                String.format(
                    "MediaPlayer %s onInfo(). what: %d, extra: %d",
                    name,
                    what,
                    extra
                )
            )
            //return True if the method handled the info
            //return False, or not having an OnInfoListener at all, will cause the info to be discarded.
            true
        }

        mp.setOnPreparedListener { mp ->
            Log.d(
                TAG,
                String.format(
                    "MediaPlayer %s onPrepared(), start play, isSpeakerPhoneOn %b",
                    name,
                    audioManager.isSpeakerphoneOn
                )
            )
            if (name == "mBusytone") {
                audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
            } else if (name == "mRingback") {
                audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
            } else if (name == "mRingtone") {
                audioManager.mode = AudioManager.MODE_RINGTONE
            }
            updateAudioDeviceState()
            mp.start()
        }

        mp.setOnCompletionListener {
            Log.d(
                TAG,
                String.format("MediaPlayer %s onCompletion()", name)
            )
            if (name == "mBusytone") {
                Log.d(
                    TAG,
                    "MyMediaPlayer(): invoke stop()"
                )
                stop()
            }
        }
    }


    // ===== File Uri Start =====
    @ReactMethod
    fun getAudioUriJS(audioType: String, fileType: String, promise: Promise) {
        var result: Uri? = null
        if (audioType == "ringback") {
            result = getRingbackUri(fileType)
        } else if (audioType == "busytone") {
            result = getBusytoneUri(fileType)
        } else if (audioType == "ringtone") {
            result = getRingtoneUri(fileType)
        }
        try {
            if (result != null) {
                promise.resolve(result.toString())
            } else {
                promise.reject("failed")
            }
        } catch (e: Exception) {
            promise.reject("failed")
        }
    }

    private fun getRingtoneUri(_type: String): Uri? {
        val fileBundle = "incallmanager_ringtone"
        val fileBundleExt = "mp3"
        val fileSysWithExt = "media_volume.ogg"
        val fileSysPath =
            "/system/media/audio/ui" // --- every devices all ships with different in ringtone. maybe ui sounds are more "stock"
        val type: String
        // --- _type MAY be empty
        if (_type == "_DEFAULT_" || _type.isEmpty()) {
            //type = fileSysWithExt;
            return getDefaultUserUri("defaultRingtoneUri")
        } else {
            type = _type
        }
        return getAudioUri(
            type,
            fileBundle,
            fileBundleExt,
            fileSysWithExt,
            fileSysPath,
            "bundleRingtoneUri",
            "defaultRingtoneUri"
        )
    }

    private fun getRingbackUri(_type: String): Uri? {
        val fileBundle = "incallmanager_ringback"
        val fileBundleExt = "mp3"
        val fileSysWithExt = "media_volume.ogg"
        val fileSysPath =
            "/system/media/audio/ui" // --- every devices all ships with different in ringtone. maybe ui sounds are more "stock"
        val type: String
        // --- _type would never be empty here. just in case.
        if (_type == "_DEFAULT_" || _type.isEmpty()) {
            //type = fileSysWithExt;
            return getDefaultUserUri("defaultRingbackUri")
        } else {
            type = _type
        }
        return getAudioUri(
            type,
            fileBundle,
            fileBundleExt,
            fileSysWithExt,
            fileSysPath,
            "bundleRingbackUri",
            "defaultRingbackUri"
        )
    }

    private fun getBusytoneUri(_type: String): Uri? {
        val fileBundle = "incallmanager_busytone"
        val fileBundleExt = "mp3"
        val fileSysWithExt = "LowBattery.ogg"
        val fileSysPath =
            "/system/media/audio/ui" // --- every devices all ships with different in ringtone. maybe ui sounds are more "stock"
        val type: String
        // --- _type would never be empty here. just in case.
        if (_type == "_DEFAULT_" || _type.isEmpty()) {
            //type = fileSysWithExt; // --- 
            return getDefaultUserUri("defaultBusytoneUri")
        } else {
            type = _type
        }
        return getAudioUri(
            type,
            fileBundle,
            fileBundleExt,
            fileSysWithExt,
            fileSysPath,
            "bundleBusytoneUri",
            "defaultBusytoneUri"
        )
    }

    private fun getAudioUri(
        _type: String,
        fileBundle: String,
        fileBundleExt: String,
        fileSysWithExt: String,
        fileSysPath: String,
        uriBundle: String,
        uriDefault: String
    ): Uri? {
        val type = _type
        if (type == "_BUNDLE_") {
            if (audioUriMap[uriBundle] == null) {
                var res = reactApplicationContext.resources.getIdentifier(fileBundle, "raw", reactApplicationContext.packageName)
                if (res <= 0) {
                    Log.d(
                        TAG,
                        String.format(
                            "getAudioUri() %s.%s not found in bundle.",
                            fileBundle,
                            fileBundleExt
                        )
                    )
                    audioUriMap[uriBundle] = null
                    //type = fileSysWithExt;
                    return getDefaultUserUri(uriDefault) // --- if specified bundle but not found, use default directlly
                } else {
                    audioUriMap[uriBundle] =
                        Uri.parse("android.resource://${reactApplicationContext.packageName}/$res")
                    //bundleRingtoneUri = Uri.parse("android.resource://" + reactContext.getPackageName() + "/" + R.raw.incallmanager_ringtone);
                    //bundleRingtoneUri = Uri.parse("android.resource://" + reactContext.getPackageName() + "/raw/incallmanager_ringtone");
                    Log.d(
                        TAG,
                        "getAudioUri() using: $type"
                    )
                    return audioUriMap[uriBundle]
                }
            } else {
                Log.d(
                    TAG,
                    "getAudioUri() using: $type"
                )
                return audioUriMap[uriBundle]
            }
        }

        // --- Check file every time in case user deleted.
        val target = "$fileSysPath/$type"
        val _uri = getSysFileUri(target)
        if (_uri == null) {
            Log.d(TAG, "getAudioUri() using user default")
            return getDefaultUserUri(uriDefault)
        } else {
            Log.d(
                TAG,
                "getAudioUri() using internal: $target"
            )
            audioUriMap[uriDefault] = _uri
            return _uri
        }
    }

    private fun getSysFileUri(target: String): Uri? {
        val file = File(target)
        if (file.isFile) {
            return Uri.fromFile(file)
        }
        return null
    }

    private fun getDefaultUserUri(type: String): Uri {
        // except ringtone, it doesn't suppose to be go here. and every android has different files unlike apple;
        return if (type == "defaultRingtoneUri") {
            Settings.System.DEFAULT_RINGTONE_URI
        } else if (type == "defaultRingbackUri") {
            Settings.System.DEFAULT_RINGTONE_URI
        } else if (type == "defaultBusytoneUri") {
            Settings.System.DEFAULT_NOTIFICATION_URI // --- DEFAULT_ALARM_ALERT_URI
        } else {
            Settings.System.DEFAULT_NOTIFICATION_URI
        }
    }


    // ===== File Uri End =====
    // ===== Internal Classes Start =====
    private inner class myToneGenerator(private val toneCategory: Int) : Thread(),
        MyPlayerInterface {

        private var toneType = 0
        override var isPlaying: Boolean = false
            private set

        var customWaitTimeMs: Int = ToneGeneratorConsts.maxWaitTimeMs
        var caller: String? = null

        fun setCustomWaitTime(ms: Int) {
            customWaitTimeMs = ms
        }

        override fun startPlay(data: Map<String, Any>) {
            val name = data?.get("name") as String?
            caller = name
            start()
        }

        override fun stopPlay() {
            synchronized(this) {
                if (isPlaying) {
                    (this as Object).notify()
                }
                isPlaying = false
            }
        }

        override fun run() {
            val toneWaitTimeMs: Int
            when (toneCategory) {
                ToneGeneratorConsts.SILENT -> {
                    //toneType = ToneGenerator.TONE_CDMA_SIGNAL_OFF;
                    toneType = ToneGenerator.TONE_CDMA_ANSWER
                    toneWaitTimeMs = 1000
                }

                ToneGeneratorConsts.BUSY -> {
                    //toneType = ToneGenerator.TONE_SUP_BUSY;
                    //toneType = ToneGenerator.TONE_SUP_CONGESTION;
                    //toneType = ToneGenerator.TONE_SUP_CONGESTION_ABBREV;
                    //toneType = ToneGenerator.TONE_CDMA_NETWORK_BUSY;
                    //toneType = ToneGenerator.TONE_CDMA_NETWORK_BUSY_ONE_SHOT;
                    toneType = ToneGenerator.TONE_SUP_RADIO_NOTAVAIL
                    toneWaitTimeMs = 4000
                }

                ToneGeneratorConsts.RINGBACK -> {
                    //toneType = ToneGenerator.TONE_SUP_RINGTONE;
                    toneType = ToneGenerator.TONE_CDMA_NETWORK_USA_RINGBACK
                    toneWaitTimeMs = ToneGeneratorConsts.maxWaitTimeMs // [STOP MANUALLY]
                }

                ToneGeneratorConsts.CALLEND -> {
                    toneType = ToneGenerator.TONE_PROP_PROMPT
                    toneWaitTimeMs = 200 // plays when call ended
                }

                ToneGeneratorConsts.CALLWAITING -> {
                    //toneType = ToneGenerator.TONE_CDMA_NETWORK_CALLWAITING;
                    toneType = ToneGenerator.TONE_SUP_CALL_WAITING
                    toneWaitTimeMs = ToneGeneratorConsts.maxWaitTimeMs // [STOP MANUALLY]
                }

                ToneGeneratorConsts.BEEP -> {
                    //toneType = ToneGenerator.TONE_SUP_PIP;
                    //toneType = ToneGenerator.TONE_CDMA_PIP;
                    //toneType = ToneGenerator.TONE_SUP_RADIO_ACK;
                    //toneType = ToneGenerator.TONE_PROP_BEEP;
                    toneType = ToneGenerator.TONE_PROP_BEEP2
                    toneWaitTimeMs = 1000 // plays when call ended
                }

                else -> {
                    // --- use ToneGenerator internal type.
                    Log.d(
                        TAG,
                        "myToneGenerator: use internal tone type: $toneCategory"
                    )
                    toneType = toneCategory
                    toneWaitTimeMs = customWaitTimeMs
                }
            }
            Log.d(
                TAG,
                String.format(
                    "myToneGenerator: toneCategory: %d ,toneType: %d, toneWaitTimeMs: %d",
                    toneCategory,
                    toneType,
                    toneWaitTimeMs
                )
            )

            var tg: ToneGenerator?
            try {
                tg = ToneGenerator(AudioManager.STREAM_VOICE_CALL, ToneGeneratorConsts.toneVolume)
            } catch (e: RuntimeException) {
                Log.d(
                    TAG,
                    "myToneGenerator: Exception caught while creating ToneGenerator: $e"
                )
                tg = null
            }

            if (tg != null) {
                synchronized(this) {
                    if (!isPlaying) {
                        isPlaying = true

                        // --- make sure audio routing, or it will be wired when switch suddenly
                        if (caller == "mBusytone") {
                            audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
                        } else if (caller == "mRingback") {
                            audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
                        } else if (caller == "mRingtone") {
                            audioManager.mode = AudioManager.MODE_RINGTONE
                        }
                        this@InCallManagerModule.updateAudioDeviceState()

                        tg.startTone(toneType)
                        try {
                            (this as Object).wait((toneWaitTimeMs + ToneGeneratorConsts.loadBufferWaitTimeMs).toLong())
                        } catch (e: InterruptedException) {
                            Log.d(
                                TAG,
                                "myToneGenerator stopped. toneType: $toneType"
                            )
                        }
                        tg.stopTone()
                    }
                    isPlaying = false
                    tg.release()
                }
            }
            Log.d(
                TAG,
                "MyToneGenerator(): play finished. caller=$caller"
            )
            if (caller == "mBusytone") {
                Log.d(TAG, "MyToneGenerator(): invoke stop()")
                this@InCallManagerModule.stop()
            }
        }
    }

    private inner class myMediaPlayer : MediaPlayer(), MyPlayerInterface {
        override val isPlaying: Boolean
            get() = super.isPlaying()

        override fun stopPlay() {
            stop()
            reset()
            release()
        }

        override fun startPlay(data: Map<String, Any>) {
            try {
                val reactContext: ReactContext = reactApplicationContext

                setDataSource(reactContext, (data["sourceUri"] as Uri?)!!)
                isLooping = (data["setLooping"] as Boolean?)!!

                // --- the `minSdkVersion` is 21 since RN 64,
                // --- if you want to suuport api < 21, comment out `setAudioAttributes` and use `setAudioStreamType((Integer) data.get("audioStream"))` instead
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage((data["audioUsage"] as Int?)!!)
                        .setContentType((data["audioContentType"] as Int?)!!)
                        .build()
                )

                // -- will start at onPrepared() event
                prepareAsync()
            } catch (e: Exception) {
                Log.d(TAG, "startPlay() failed", e)
            }
        }
    }

    // ===== Internal Classes End =====
    @ReactMethod
    fun chooseAudioDevice(endpointDeviceName: String, promise: Promise) {
        Log.d(
            TAG,
            "RNInCallManager.chooseAudioRoute(): user choose endpointDeviceName = $endpointDeviceName"
        )
        val chosenEndpoint = audioDeviceManager.switchDeviceFromDeviceName(endpointDeviceName, bluetoothManager!!)
        userSelectedAudioDevice = chosenEndpoint
        selectedAudioDevice = chosenEndpoint
        updateAudioDeviceState()
        promise.resolve(audioDeviceStatusMap)
    }

    private fun pause() {
        if (audioManagerActivated) {
            Log.d(TAG, "pause audioRouteManager")
            stopEvents()
        }
    }

    private fun resume() {
        if (audioManagerActivated) {
            Log.d(TAG, "resume audioRouteManager")
            startEvents()
        }
    }

    override fun onHostResume() {
        Log.d(TAG, "onResume()")
        //resume();
    }

    override fun onHostPause() {
        Log.d(TAG, "onPause()")
        //pause();
    }

    override fun onHostDestroy() {
        Log.d(TAG, "onDestroy()")
        stopRingtone()
        stopRingback()
        stopBusytone()
        stop()
    }

    /** Helper method for receiver registration.  */
    @SuppressLint("UnspecifiedRegisterReceiverFlag")
    private fun registerReceiver(receiver: BroadcastReceiver, filter: IntentFilter) {
        val reactContext: ReactContext? = reactApplicationContext
        if (reactContext != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                reactContext.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
            } else {
                reactContext.registerReceiver(receiver, filter)
            }
        } else {
            Log.d(TAG, "registerReceiver() reactContext is null")
        }
    }

    /** Helper method for unregistration of an existing receiver.  */
    private fun unregisterReceiver(receiver: BroadcastReceiver?) {
        val reactContext: ReactContext? = this.reactApplicationContext
        if (reactContext != null) {
            try {
                reactContext.unregisterReceiver(receiver)
            } catch (e: Exception) {
                Log.d(TAG, "unregisterReceiver() failed")
            }
        } else {
            Log.d(TAG, "unregisterReceiver() reactContext is null")
        }
    }

    /** Sets the speaker phone mode.  */ /*
    private void setSpeakerphoneOn(boolean on) {
        boolean wasOn = audioManager.isSpeakerphoneOn();
        if (wasOn == on) {
            return;
        }
        audioManager.setSpeakerphoneOn(on);
    }
    */
    /** Sets the microphone mute state.  */ /*
    private void setMicrophoneMute(boolean on) {
        boolean wasMuted = audioManager.isMicrophoneMute();
        if (wasMuted == on) {
            return;
        }
        audioManager.setMicrophoneMute(on);
    }
    */
    /** Gets the current earpiece state.  */
    private fun hasEarpiece(): Boolean {
        return reactApplicationContext.packageManager.hasSystemFeature(PackageManager.FEATURE_TELEPHONY)
    }

    @ReactMethod
    fun getIsWiredHeadsetPluggedIn(promise: Promise) {
        promise.resolve(audioDeviceManager.hasWiredHeadset())
    }

    /**
     * Updates list of possible audio devices and make new device selection.
     */
    fun updateAudioDeviceState() {
        UiThreadUtil.runOnUiThread {
            val audioDevices = audioDeviceManager.getCurrentDeviceEndpoints()
            Log.d(
                TAG, ("updateAudioDeviceState() Device status: "
                        + "available=" + audioDevices + ", "
                        + "selected=" + endpointTypeDebug(selectedAudioDevice) + ", "
                        + "user selected=" + endpointTypeDebug(userSelectedAudioDevice))
            )

            // Double-check if any Bluetooth headset is connected once again (useful for older android platforms)
            // TODO: we can possibly remove this, to be tested on older platforms
            if (bluetoothManager!!.bluetoothState == AppRTCBluetoothManager.State.HEADSET_AVAILABLE || bluetoothManager!!.bluetoothState == AppRTCBluetoothManager.State.HEADSET_UNAVAILABLE) {
                bluetoothManager!!.updateDevice()
            }
            /** sets newAudioDevice initially to this order: WH -> BT -> default(speaker or earpiece) */
            var newAudioDevice = defaultAudioDevice
            audioDevices.firstOrNull {
                it.isWiredHeadsetType() || it.isBluetoothType()
            }?.also {
                newAudioDevice = it.type
            }
            var deviceSwitched = false
            val userSelectedAudioDevice = this.userSelectedAudioDevice
            var selectedAudioDevice = this.selectedAudioDevice
            if (userSelectedAudioDevice !== null && userSelectedAudioDevice != AudioDeviceEndpoint.TYPE_UNKNOWN) {
                newAudioDevice = userSelectedAudioDevice
            }
            /** To be called when BT SCO connection fails
             * Will do the following:
             * 1 - revert user selection if needed
             * 2 - sets newAudioDevice to something other than BT
             * 3 - change the bt manager to device state from sco connection state
             * */
            fun revertBTSelection() {
                // BT connection, so revert user selection if needed
                if (userSelectedAudioDevice == AudioDeviceEndpoint.TYPE_BLUETOOTH) {
                    this.userSelectedAudioDevice = null
                }
                // prev selection was not BT, but new was BT
                // new can now be WiredHeadset or default if there was no selection before
                if (selectedAudioDevice != null
                    && selectedAudioDevice != AudioDeviceEndpoint.TYPE_UNKNOWN
                    && selectedAudioDevice != AudioDeviceEndpoint.TYPE_BLUETOOTH) {
                    newAudioDevice = selectedAudioDevice!!
                } else {
                    newAudioDevice = defaultAudioDevice
                    audioDevices.firstOrNull {
                        it.isWiredHeadsetType()
                    }?.also {
                        newAudioDevice = it.type
                    }
                }
                // change the bt manager to device state from sco connection state
                bluetoothManager!!.updateDevice()
            }
            if (selectedAudioDevice == null || newAudioDevice != selectedAudioDevice) {
                // --- stop bluetooth if prev selection was bluetooth
                if (
                    selectedAudioDevice == AudioDeviceEndpoint.TYPE_BLUETOOTH &&
                    (
                            bluetoothManager!!.bluetoothState == AppRTCBluetoothManager.State.SCO_CONNECTED
                                    || bluetoothManager!!.bluetoothState == AppRTCBluetoothManager.State.SCO_CONNECTING
                            )
                    ) {
                    bluetoothManager!!.stopScoAudio()
                    bluetoothManager!!.updateDevice()
                }

                // --- start bluetooth if new is BT and we have a headset
                if (newAudioDevice == AudioDeviceEndpoint.TYPE_BLUETOOTH && bluetoothManager!!.bluetoothState == AppRTCBluetoothManager.State.HEADSET_AVAILABLE) {
                    // Attempt to start Bluetooth SCO audio (takes a few second to start).
                    if (!bluetoothManager!!.startScoAudio()) {
                        revertBTSelection()
                    }

                    // already selected BT device
                    if (bluetoothManager!!.bluetoothState == AppRTCBluetoothManager.State.SCO_CONNECTED) {
                        selectedAudioDevice = AudioDeviceEndpoint.TYPE_BLUETOOTH
                        this.selectedAudioDevice = selectedAudioDevice
                        deviceSwitched = true
                    } else if (
                        // still connecting (happens on older Android platforms)
                        bluetoothManager!!.bluetoothState == AppRTCBluetoothManager.State.SCO_CONNECTING
                    ) {
                        // on older Android platforms
                        // it will call this update function again, once connected or disconnected
                        // so we can skip executing further
                        return@runOnUiThread
                    }
                }

                /** This check is meant for older Android platforms
                 * it would have called this device update function again on timer execution
                 * after two cases
                 * 1 - SCO_CONNECTED or
                 * 2 - SCO_DISCONNECTING
                 * Here we see if it was disconnected then we revert to non-bluetooth selection
                 * */
                if (newAudioDevice == AudioDeviceEndpoint.TYPE_BLUETOOTH
                    && selectedAudioDevice != AudioDeviceEndpoint.TYPE_BLUETOOTH
                    && bluetoothManager!!.bluetoothState == AppRTCBluetoothManager.State.SCO_DISCONNECTING
                ) {
                    revertBTSelection()
                }

                if (newAudioDevice != selectedAudioDevice) {
                    // BT sco would be already connected at this point, so no need to switch again
                    if (newAudioDevice != AudioDeviceEndpoint.TYPE_BLUETOOTH) {
                        audioDeviceManager.switchDeviceEndpointType(newAudioDevice, bluetoothManager!!)
                    }
                    deviceSwitched = true
                }

                if (deviceSwitched) {
                    Log.d(
                        TAG, ("New device status: "
                                + "available=" + audioDevices + ", "
                                + "selected=" + newAudioDevice)
                    )
                    sendEvent("onAudioDeviceChanged", audioDeviceStatusMap)
                }
                Log.d(
                    TAG,
                    "--- updateAudioDeviceState done"
                )
            } else {
                Log.d(
                    TAG,
                    "--- updateAudioDeviceState: no change"
                )
            }
        }
    }

    private val audioDeviceStatusMap: WritableMap
        get() {
            val data = Arguments.createMap()
            var audioDevicesJson = "["
            for (s in audioDeviceManager.getCurrentDeviceEndpoints()) {
                audioDevicesJson += "\"" + s.name + "\","
            }

            // --- strip the last `,`
            if (audioDevicesJson.length > 1) {
                audioDevicesJson = audioDevicesJson.substring(0, audioDevicesJson.length - 1)
            }
            audioDevicesJson += "]"

            data.putString("availableAudioDeviceList", audioDevicesJson)
            data.putString(
                "selectedAudioDevice",
                endpointTypeDebug(selectedAudioDevice)
            )

            return data
        }

    companion object {
        private const val TAG = "InCallManager"
        private const val SPEAKERPHONE_AUTO = "auto"
        private const val SPEAKERPHONE_TRUE = "true"
        private const val SPEAKERPHONE_FALSE = "false"

        object ToneGeneratorConsts {
            val maxWaitTimeMs = 3600000 // 1 hour fairly enough
            val loadBufferWaitTimeMs = 20
            val toneVolume =
                100 // The volume of the tone, given in percentage of maximum volume (from 0-100).

            // --- constant in ToneGenerator all below 100
            val BEEP: Int = 101
            val BUSY: Int = 102
            val CALLEND: Int = 103
            val CALLWAITING: Int = 104
            val RINGBACK: Int = 105
            val SILENT: Int = 106
        }

        private fun getRandomInteger(min: Int, max: Int): Int {
            require(min < max) { "max must be greater than min" }
            val random = Random()
            return random.nextInt((max - min) + 1) + min
        }

        private fun endpointTypeDebug(@EndpointType endpointType: Int?): String {
            if (endpointType == null) { return  "NULL" }
            return AudioDeviceEndpointUtils.endpointTypeToString(endpointType)
        }
    }
}

