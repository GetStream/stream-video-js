package com.streamvideo.reactnative

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.media.projection.MediaProjectionManager
import android.os.BatteryManager
import android.os.Build
import android.os.PowerManager
import android.util.Base64
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.ReadableMap
import com.oney.WebRTCModule.WebRTCModule
import com.oney.WebRTCModule.WebRTCModuleOptions
import com.streamvideo.reactnative.recorder.TracksRecorderManager
import com.streamvideo.reactnative.screenshare.ScreenAudioCapture
import com.streamvideo.reactnative.keepalive.StreamCallKeepAliveHeadlessService
import com.streamvideo.reactnative.util.CallAlivePermissionsHelper
import com.streamvideo.reactnative.util.PiPHelper
import com.streamvideo.reactnative.util.YuvFrame
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import org.webrtc.VideoSink
import org.webrtc.VideoTrack
import java.io.ByteArrayOutputStream
import java.io.File
import kotlin.math.sin


class StreamVideoReactNativeModule(reactContext: ReactApplicationContext) :
    NativeStreamVideoReactNativeSpec(reactContext) {

    private val mPowerManager = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
    
    // Instance variables for busy tone (not static)
    private var busyToneAudioTrack: AudioTrack? = null
    private var busyToneJob: Job? = null

    // Screen share audio mixing
    private var screenAudioCapture: ScreenAudioCapture? = null

    private var thermalStatusListener: PowerManager.OnThermalStatusChangedListener? = null

    private var batteryChargingStateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent == null) return
            emitChargingState(getBatteryStatusFromIntent(intent))
        }
    }

    override fun initialize() {
        super.initialize()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            StreamVideoReactNative.addPipListener { isInPictureInPictureMode, newConfig ->
                PiPHelper.onPiPChange(
                    reactApplicationContext,
                    isInPictureInPictureMode,
                    newConfig,
                    ::emitPiPChange,
                )
            }
        }

        reactApplicationContext.registerReceiver(
            powerReceiver,
            IntentFilter(PowerManager.ACTION_POWER_SAVE_MODE_CHANGED)
        )

        reactApplicationContext.registerReceiver(batteryChargingStateReceiver, IntentFilter().apply {
            addAction(Intent.ACTION_POWER_CONNECTED)
            addAction(Intent.ACTION_POWER_DISCONNECTED)
        })
    }


    // Events can fire before the JSI wrapper sets the emitter callback (it is set after initialize()),
    // JS recovers the initial state through the getters
    private fun emitPiPChange(isInPictureInPictureMode: Boolean) {
        if (mEventEmitterCallback == null) return
        emitOnPiPChange(isInPictureInPictureMode)
    }

    private fun emitChargingState(state: WritableMap) {
        if (mEventEmitterCallback == null) return
        emitOnChargingStateChanged(state)
    }

    private fun emitLowPowerMode(isLowPowerMode: Boolean) {
        if (mEventEmitterCallback == null) return
        emitOnLowPowerModeChanged(isLowPowerMode)
    }

    private fun emitThermalState(thermalState: String) {
        if (mEventEmitterCallback == null) return
        emitOnThermalStateChanged(thermalState)
    }

    override fun isInPiPMode(): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            return PiPHelper.isInPiPMode(reactApplicationContext) ?: false
        }
        return false
    }

    override fun isCallAliveConfigured(): Boolean {
        // Service is declared in the SDK's own AndroidManifest and merged by default.
        // Permissions are expected to be provided by the app (or via Expo config plugin).
        return CallAlivePermissionsHelper.hasForegroundServicePermissionsDeclared(reactApplicationContext)
    }

    override fun startKeepCallAliveService(
        callCid: String,
        channelId: String,
        channelName: String,
        title: String,
        body: String,
        smallIconName: String?,
        promise: Promise
    ) {
        try {
            val intent = StreamCallKeepAliveHeadlessService.buildStartIntent(
                reactApplicationContext,
                callCid,
                channelId,
                channelName,
                title,
                body,
                smallIconName
            )
            ContextCompat.startForegroundService(reactApplicationContext, intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject(NAME, "Failed to start keep call alive foreground service", e)
        }
    }

    override fun stopKeepCallAliveService(promise: Promise) {
        try {
            val intent = StreamCallKeepAliveHeadlessService.buildStopIntent(reactApplicationContext)
            val stopped = reactApplicationContext.stopService(intent)
            promise.resolve(stopped)
        } catch (e: Exception) {
            promise.reject(NAME, "Failed to stop keep call alive foreground service", e)
        }
    }

    override fun invalidate() {
        StreamVideoReactNative.clearPipListeners()
        reactApplicationContext.unregisterReceiver(powerReceiver)
        reactApplicationContext.unregisterReceiver(batteryChargingStateReceiver)
        stopThermalStatusUpdates()
        stopBusyToneInternal() // Clean up busy tone on invalidate
        stopScreenShareAudioMixingInternal() // Clean up screen share audio on invalidate
        super.invalidate()
    }

    override fun canAutoEnterPipMode(value: Boolean) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            PiPHelper.canAutoEnterPipMode(reactApplicationContext, value)
        }
    }

    override fun exitPipMode(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val success = PiPHelper.exitPipMode(reactApplicationContext)
            promise.resolve(success)
        } else {
            promise.resolve(false)
        }
    }

    override fun startThermalStatusUpdates() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return
        try {
            // avoid leaking a previous listener if JS starts twice
            stopThermalStatusUpdates()
            val listener = PowerManager.OnThermalStatusChangedListener { status ->
                emitThermalState(thermalStatusToString(status))
            }
            thermalStatusListener = listener
            mPowerManager.addThermalStatusListener(listener)
        } catch (e: Exception) {
            Log.e(NAME, "Failed to start thermal status updates", e)
        }
    }

    override fun stopThermalStatusUpdates() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // Store the current listener in a local val for safe null checking
            val currentListener = thermalStatusListener
            if (currentListener != null) {
                mPowerManager.removeThermalStatusListener(currentListener)
                thermalStatusListener = null
            }
        }
    }

    private fun thermalStatusToString(status: Int): String = when (status) {
        PowerManager.THERMAL_STATUS_NONE -> "NONE"
        PowerManager.THERMAL_STATUS_LIGHT -> "LIGHT"
        PowerManager.THERMAL_STATUS_MODERATE -> "MODERATE"
        PowerManager.THERMAL_STATUS_SEVERE -> "SEVERE"
        PowerManager.THERMAL_STATUS_CRITICAL -> "CRITICAL"
        PowerManager.THERMAL_STATUS_EMERGENCY -> "EMERGENCY"
        PowerManager.THERMAL_STATUS_SHUTDOWN -> "SHUTDOWN"
        else -> "UNKNOWN"
    }

    override fun currentThermalState(): String {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return "NOT_SUPPORTED"
        return thermalStatusToString(mPowerManager.currentThermalStatus)
    }

    private val powerReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == PowerManager.ACTION_POWER_SAVE_MODE_CHANGED) {
                sendPowerModeEvent()
            }
        }
    }

    private fun sendPowerModeEvent() {
        emitLowPowerMode(mPowerManager.isPowerSaveMode)
    }

    override fun isLowPowerModeEnabled(): Boolean = mPowerManager.isPowerSaveMode

    private fun getVideoTrackForStreamURL(streamURL: String): VideoTrack {
        var videoTrack: VideoTrack? = null


        val module = reactApplicationContext.getNativeModule(WebRTCModule::class.java)
        val stream = module!!.getStreamForReactTag(streamURL)

        if (stream != null) {
            val videoTracks = stream.videoTracks

            if (videoTracks.isNotEmpty()) {
                videoTrack = videoTracks[0]
            }
        }

        if (videoTrack != null) {
            return videoTrack
        }

        throw Exception("No video stream for react tag: $streamURL")
    }

    override fun takeScreenshot(streamURL: String, promise: Promise) {
        try {
            val track = getVideoTrackForStreamURL(streamURL)
            var screenshotSink: VideoSink? = null
            screenshotSink = VideoSink { videoFrame -> // Remove the sink before asap
                // to avoid processing multiple frames.
                CoroutineScope(Dispatchers.IO).launch {
                    // This has to be launched asynchronously - removing the sink on the
                    // same thread as the videoframe is delivered will lead to a deadlock
                    // (needs investigation why)
                    track.removeSink(screenshotSink)
                }

                videoFrame.retain()
                val bitmap = YuvFrame.bitmapFromVideoFrame(videoFrame)
                videoFrame.release()

                bitmap?.let {
                    val byteArrayOutputStream = ByteArrayOutputStream()
                    it.compress(Bitmap.CompressFormat.PNG, 100, byteArrayOutputStream)
                    val base64Encoded = Base64.encodeToString(byteArrayOutputStream.toByteArray(), Base64.DEFAULT)
                    promise.resolve(base64Encoded)
                }
            }
            track.addSink(screenshotSink)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    override fun getBatteryState(): WritableMap {
        val filter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
        val batteryStatus = reactApplicationContext.registerReceiver(null, filter)
            ?: throw IllegalStateException("Failed to get battery status")
        return getBatteryStatusFromIntent(batteryStatus)
    }

    override fun hasAudioOutputHardware(): Boolean =
        reactApplicationContext.packageManager.hasSystemFeature(PackageManager.FEATURE_AUDIO_OUTPUT)

    override fun hasMicrophoneHardware(): Boolean =
        reactApplicationContext.packageManager.hasSystemFeature(PackageManager.FEATURE_MICROPHONE)

    override fun hasCameraHardware(): Boolean =
        reactApplicationContext.packageManager.hasSystemFeature(PackageManager.FEATURE_CAMERA_ANY)

    // iOS only
    override fun captureRef(reactTag: Double, options: ReadableMap, promise: Promise) {
        promise.reject(UNSUPPORTED_PLATFORM_CODE, "captureRef is only supported on iOS")
    }

    // iOS only
    override fun checkPermission(permission: String, promise: Promise) {
        promise.reject(UNSUPPORTED_PLATFORM_CODE, "checkPermission is only supported on iOS")
    }

    // iOS only
    override fun startInAppScreenCapture(includeAudio: Boolean, promise: Promise) {
        promise.reject(UNSUPPORTED_PLATFORM_CODE, "startInAppScreenCapture is only supported on iOS")
    }

    // iOS only
    override fun stopInAppScreenCapture(promise: Promise) {
        promise.reject(UNSUPPORTED_PLATFORM_CODE, "stopInAppScreenCapture is only supported on iOS")
    }

    private fun getBatteryStatusFromIntent(intent: Intent): WritableMap {
        val status = intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
        val level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
        val scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)

        val isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
                status == BatteryManager.BATTERY_STATUS_FULL

        val batteryLevel = if (level >= 0 && scale > 0) {
            (level.toFloat() / scale.toFloat()) * 100
        } else -1f

        return Arguments.createMap().apply {
            putBoolean("charging", isCharging)
            putInt("level", batteryLevel.toInt())
        }
    }

    override fun playBusyTone(promise: Promise) {
        try {
            stopBusyToneInternal()

            busyToneJob = CoroutineScope(Dispatchers.IO).launch {
                try {
                    val beepBuffer = generateBeepBuffer(0.5, 480.0)
                    val silenceBuffer = generateSilenceBuffer(0.5)

                    val minBuf = AudioTrack.getMinBufferSize(
                        SAMPLE_RATE,
                        AudioFormat.CHANNEL_OUT_MONO,
                        AudioFormat.ENCODING_PCM_16BIT
                    )
                    val bufferInShorts = maxOf(minBuf / 2, beepBuffer.size)

                    val audioTrack = AudioTrack.Builder()
                        .setAudioAttributes(
                            AudioAttributes.Builder()
                                .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                                .build()
                        )
                        .setAudioFormat(
                            AudioFormat.Builder()
                                .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                                .setSampleRate(SAMPLE_RATE)
                                .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                                .build()
                        )
                        .setBufferSizeInBytes(bufferInShorts * 2)
                        .setTransferMode(AudioTrack.MODE_STREAM)
                        .build()

                    if (audioTrack.state != AudioTrack.STATE_INITIALIZED) {
                        promise.reject("AUDIO_TRACK_ERROR", "AudioTrack not initialized for busy tone")
                        return@launch
                    }

                    busyToneAudioTrack = audioTrack
                    audioTrack.play()
                    promise.resolve(true)

                    while (isActive) {
                        val bw1 = audioTrack.write(beepBuffer, 0, beepBuffer.size, AudioTrack.WRITE_BLOCKING)
                        if (!isActive) break
                        val bw2 = audioTrack.write(silenceBuffer, 0, silenceBuffer.size, AudioTrack.WRITE_BLOCKING)
                        if (bw1 < 0 || bw2 < 0) {
                            Log.e(NAME, "Error writing to AudioTrack: $bw1, $bw2")
                            break
                        }
                    }
                } catch (e: Exception) {
                    promise.reject("AUDIO_PLAYBACK_ERROR", "Error in busy tone playback: ${e.message}")
                }
            }
        } catch (e: Exception) {
            promise.reject("AUDIO_PLAYBACK_ERROR", "Error playing busy tone: ${e.message}")
        }
    }

    override fun stopBusyTone(promise: Promise) {
        try {
            stopBusyToneInternal()
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(NAME, "Error stopping busy tone: ${e.message}")
            promise.reject("AUDIO_STOP_ERROR", "Error stopping busy tone: ${e.message}")
        }
    }

    private fun stopBusyToneInternal() {
        try {
            busyToneJob?.cancel()
            busyToneJob = null

            busyToneAudioTrack?.apply {
                try {
                    if (playState == AudioTrack.PLAYSTATE_PLAYING) {
                        stop()
                    }
                } catch (e: Exception) {
                    Log.e(NAME, "Error stopping AudioTrack: ${e.message}")
                } finally {
                    release()
                }
            }
            busyToneAudioTrack = null
        } catch (e: Exception) {
            Log.e(NAME, "Error stopping busy tone internally: ${e.message}")
        }
    }

    private fun generateBeepBuffer(durationSeconds: Double, frequency: Double): ShortArray {
        val totalSamples = (durationSeconds * SAMPLE_RATE).toInt()
        val twoPiF = 2.0 * Math.PI * frequency
        val amplitude = 0.3

        val data = ShortArray(totalSamples)
        for (i in 0 until totalSamples) {
            val t = i.toDouble() / SAMPLE_RATE
            val sample = (amplitude * sin(twoPiF * t) * Short.MAX_VALUE).toInt()
            data[i] = sample.toShort()
        }
        return data
    }

    private fun generateSilenceBuffer(durationSeconds: Double): ShortArray {
        val totalSamples = (durationSeconds * SAMPLE_RATE).toInt()
        return ShortArray(totalSamples)
    }

    override fun startScreenShareAudioMixing(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
                promise.reject("API_LEVEL", "Screen audio capture requires Android 10 (API 29)+")
                return
            }

            if (screenAudioCapture != null) {
                Log.w(NAME, "Screen share audio mixing is already active")
                promise.resolve(null)
                return
            }

            val module = reactApplicationContext.getNativeModule(WebRTCModule::class.java)!!

            // Get the MediaProjection permission result Intent from WebRTC
            val permissionIntent = module.userMediaImpl?.mediaProjectionPermissionResultData
            if (permissionIntent == null) {
                promise.reject("NO_PROJECTION", "No MediaProjection permission available. Start screen sharing first.")
                return
            }

            // Create a MediaProjection for audio capture
            val mediaProjectionManager = reactApplicationContext.getSystemService(
                Context.MEDIA_PROJECTION_SERVICE
            ) as MediaProjectionManager
            val mediaProjection = mediaProjectionManager.getMediaProjection(
                Activity.RESULT_OK, permissionIntent
            )
            if (mediaProjection == null) {
                promise.reject("PROJECTION_ERROR", "Failed to create MediaProjection for audio capture")
                return
            }

            screenAudioCapture = ScreenAudioCapture(mediaProjection).also { it.start() }

            // Register the screen audio bytes provider so the AudioBufferCallback
            // in WebRTCModule mixes screen audio into the mic buffer.
            WebRTCModuleOptions.getInstance().screenAudioBytesProvider =
                WebRTCModuleOptions.ScreenAudioBytesProvider { bytesRequested ->
                screenAudioCapture?.getScreenAudioBytes(bytesRequested)
            }

            Log.d(NAME, "Screen share audio mixing started")
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e(NAME, "Error starting screen share audio mixing: ${e.message}")
            promise.reject("ERROR", e.message, e)
        }
    }

    override fun stopScreenShareAudioMixing(promise: Promise) {
        try {
            stopScreenShareAudioMixingInternal()
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e(NAME, "Error stopping screen share audio mixing: ${e.message}")
            promise.reject("ERROR", e.message, e)
        }
    }

    private fun stopScreenShareAudioMixingInternal() {
        try {
            // Clear the provider so the AudioBufferCallback stops mixing
            WebRTCModuleOptions.getInstance().screenAudioBytesProvider = null

            screenAudioCapture?.stop()
            screenAudioCapture = null

            Log.d(NAME, "Screen share audio mixing stopped")
        } catch (e: Exception) {
            Log.e(NAME, "Error in stopScreenShareAudioMixingInternal: ${e.message}")
        }
    }

    // ── Track recorder bridge ────────────────────────────────────────────

    override fun startTrackRecording(options: ReadableMap, promise: Promise) {
        val videoTrackId = if (options.hasKey("videoTrackId") && !options.isNull("videoTrackId")) {
            options.getString("videoTrackId")
        } else {
            null
        }
        val maxDurationMs = if (options.hasKey("maxDurationMs") && !options.isNull("maxDurationMs")) {
            options.getInt("maxDurationMs").toLong()
        } else {
            DEFAULT_RECORDING_DURATION_MS
        }
        val targetWidth = if (options.hasKey("targetWidth") && !options.isNull("targetWidth")) {
            options.getInt("targetWidth")
        } else {
            0
        }
        val targetHeight = if (options.hasKey("targetHeight") && !options.isNull("targetHeight")) {
            options.getInt("targetHeight")
        } else {
            0
        }

        val webRTCModule = reactApplicationContext.getNativeModule(WebRTCModule::class.java)
        if (webRTCModule == null) {
            promise.reject(RECORDING_ERROR_CODE, "WebRTCModule not available")
            return
        }

        TracksRecorderManager.shared.startRecording(
            context = reactApplicationContext,
            webRTCModule = webRTCModule,
            videoTrackId = videoTrackId,
            maxDurationMs = maxDurationMs,
            targetWidth = targetWidth,
            targetHeight = targetHeight,
        ) { file, error ->
            if (error != null) {
                promise.reject(RECORDING_ERROR_CODE, error.message ?: "recording failed", error)
            } else {
                promise.resolve(file?.let { "file://${it.absolutePath}" })
            }
        }
    }

    override fun stopTrackRecording(promise: Promise) {
        TracksRecorderManager.shared.stopRecording {
            promise.resolve(null)
        }
    }

    override fun clearStreamRecordings(promise: Promise) {
        TracksRecorderManager.shared.clearRecordingsDirectory(reactApplicationContext) { error ->
            if (error != null) {
                promise.reject(RECORDING_CLEAR_ERROR_CODE, error.message ?: "clear failed", error)
            } else {
                promise.resolve(null)
            }
        }
    }

    override fun getStreamRecordings(promise: Promise) {
        val files: List<File> = TracksRecorderManager.shared.listRecordings(reactApplicationContext)
        val arr = Arguments.createArray()
        for (f in files) {
            arr.pushString("file://${f.absolutePath}")
        }
        promise.resolve(arr)
    }

    companion object {
        private const val UNSUPPORTED_PLATFORM_CODE = "UNSUPPORTED_PLATFORM"
        private const val SAMPLE_RATE = 22050
        private const val DEFAULT_RECORDING_DURATION_MS = 5000L
        private const val RECORDING_ERROR_CODE = "recording_error"
        private const val RECORDING_CLEAR_ERROR_CODE = "clear_error"
    }
}
