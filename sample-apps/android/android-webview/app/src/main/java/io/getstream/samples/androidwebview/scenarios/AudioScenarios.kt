package io.getstream.samples.androidwebview.scenarios

import android.Manifest
import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.media.AudioDeviceInfo
import android.media.AudioFocusRequest
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioRecord
import android.media.MediaPlayer
import android.media.MediaRecorder
import android.os.Build
import android.os.Handler
import android.os.Looper
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import io.getstream.samples.androidwebview.AppState
import io.getstream.samples.androidwebview.LogTab
import io.getstream.samples.androidwebview.R
import io.getstream.samples.androidwebview.webview.StreamVideoHostBridge
import kotlin.math.log10
import kotlin.math.sqrt

/**
 * Native-side actions that disturb the process audio state while the WebView
 * runs a call. Android counterpart of the iOS sample's `AudioScenarios`:
 * `AVAudioSession` categories map to `AudioManager` modes, and exclusive
 * playback maps to audio focus.
 */
class AudioScenarios(context: Context) {
    private val context: Context = context.applicationContext
    private val audioManager = this.context.getSystemService(AudioManager::class.java)
    private val handler = Handler(Looper.getMainLooper())

    private var dingPlayer: MediaPlayer? = null
    private var ringtonePlayer: MediaPlayer? = null
    private var ringtoneFocus: AudioFocusRequest? = null
    private val heldFocusRequests = mutableListOf<AudioFocusRequest>()

    private var micRecord: AudioRecord? = null
    private var micThread: Thread? = null

    @Volatile
    private var micLoopActive = false

    var ringtonePlaying by mutableStateOf(false)
        private set
    var micCaptureRunning by mutableStateOf(false)
        private set
    var foregroundServiceRunning by mutableStateOf(false)
        private set

    // Live state

    /** One-line summary for the menu header, re-read on every menu open. */
    fun liveState(): String {
        val recordings = audioManager.activeRecordingConfigurations
        val silenced = recordings.count { it.isClientSilenced }
        return "${StreamVideoHostBridge.modeName(audioManager.mode)} · " +
            "out=${communicationDeviceLabel()} · " +
            "music=${audioManager.isMusicActive} · " +
            "focus held=${heldFocusRequests.size} · " +
            "recordings=${recordings.size} (silenced=$silenced)"
    }

    @Suppress("DEPRECATION")
    fun dumpState(label: String = "dump") {
        val recordings = audioManager.activeRecordingConfigurations.joinToString {
            "source=${it.clientAudioSource} silenced=${it.isClientSilenced}"
        }
        val inputs = audioManager.getDevices(AudioManager.GET_DEVICES_INPUTS)
            .joinToString(",") { StreamVideoHostBridge.describe(it) }
        val outputs = audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS)
            .joinToString(",") { StreamVideoHostBridge.describe(it) }
        AppState.log(
            LogTab.LIFECYCLE,
            "audio",
            "audio-state[$label]: mode=${StreamVideoHostBridge.modeName(audioManager.mode)} " +
                "commDevice=${communicationDeviceLabel()} speakerphone=${audioManager.isSpeakerphoneOn} " +
                "micMute=${audioManager.isMicrophoneMute} music=${audioManager.isMusicActive} " +
                "voiceVol=${audioManager.getStreamVolume(AudioManager.STREAM_VOICE_CALL)}/" +
                "${audioManager.getStreamMaxVolume(AudioManager.STREAM_VOICE_CALL)} " +
                "focusHeld=${heldFocusRequests.size} recordings=[$recordings] " +
                "in=[$inputs] out=[$outputs]",
        )
    }

    // Recovery

    /**
     * Hands audio back to WebRTC after a hostile change: abandons any focus
     * this app still holds, returns to `MODE_IN_COMMUNICATION` and clears a
     * forced communication device so WebRTC picks its own route again.
     */
    fun restoreForWebRTC() {
        dumpState("before restore")
        abandonHeldFocus()
        audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            audioManager.clearCommunicationDevice()
        }
        AppState.log(LogTab.SCENARIOS, "audio", "restored: focus abandoned, mode=inCommunication, comm device cleared")
        dumpState("after restore")
    }

    // Mode switcher

    fun setMode(mode: Int) {
        dumpState("before setMode")
        audioManager.mode = mode
        val actual = audioManager.mode
        val requested = StreamVideoHostBridge.modeName(mode)
        if (actual == mode) {
            AppState.log(LogTab.SCENARIOS, "audio", "setMode($requested)")
        } else {
            AppState.log(
                LogTab.SCENARIOS,
                "audio",
                "setMode($requested) ignored by the OS; mode is ${StreamVideoHostBridge.modeName(actual)}",
            )
        }
        dumpState("after setMode")
    }

    // Sounds

    /** Plays the ding without requesting focus: mixes with WebRTC audio. */
    fun playDingMix() {
        AppState.log(LogTab.SCENARIOS, "audio", "play ding (no focus request, mixes)")
        playDing(onFinished = null)
    }

    /**
     * Requests `AUDIOFOCUS_GAIN` and never abandons it: the canonical
     * "webview audio goes quiet after a native sound" repro. Use
     * "Restore audio" to release it.
     */
    fun playDingExclusive() {
        val request = requestFocus(AudioManager.AUDIOFOCUS_GAIN, "ding (exclusive)") ?: return
        heldFocusRequests += request
        AppState.log(LogTab.SCENARIOS, "audio", "play ding (exclusive, focus kept)")
        playDing(onFinished = null)
    }

    /**
     * "Right way" companion to [playDingExclusive]: transient focus, abandoned
     * and restored as soon as the ding finishes.
     */
    fun playDingWithAutoRestore() {
        val request = requestFocus(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT, "ding (auto-restore)") ?: return
        AppState.log(LogTab.SCENARIOS, "audio", "play ding (exclusive, transient) - will restore on finish")
        playDing {
            audioManager.abandonAudioFocusRequest(request)
            audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
            AppState.log(LogTab.SCENARIOS, "audio", "ding finished - focus abandoned, mode=inCommunication")
        }
    }

    /**
     * Requests `AUDIOFOCUS_GAIN` and only abandons it when the ding finishes,
     * without restoring the mode. Checks whether WebView recovers on its own.
     */
    fun playDingExclusiveNoRestore() {
        val request = requestFocus(AudioManager.AUDIOFOCUS_GAIN, "ding (no restore)") ?: return
        AppState.log(LogTab.SCENARIOS, "audio", "play ding (exclusive, NO restore) - will abandon focus only")
        playDing {
            audioManager.abandonAudioFocusRequest(request)
            AppState.log(LogTab.SCENARIOS, "audio", "ding finished - focus abandoned only (NOT restored)")
        }
    }

    fun startRingtone() {
        if (ringtonePlaying) return
        val attributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
        ringtoneFocus = requestFocus(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT, "ringtone", attributes)
        val player = createPlayer(R.raw.ringtone, attributes) ?: return
        player.isLooping = true
        player.start()
        ringtonePlayer = player
        ringtonePlaying = true
        AppState.log(LogTab.SCENARIOS, "audio", "ringtone loop started")
    }

    fun stopRingtone() {
        ringtonePlayer?.run {
            stop()
            release()
        }
        ringtonePlayer = null
        ringtoneFocus?.let(audioManager::abandonAudioFocusRequest)
        ringtoneFocus = null
        ringtonePlaying = false
        AppState.log(LogTab.SCENARIOS, "audio", "ringtone stopped, focus abandoned")
    }

    /** Posts a notification with the default sound after [delayMs]. */
    fun scheduleNotification(delayMs: Long = 2000) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && !isGranted(Manifest.permission.POST_NOTIFICATIONS)) {
            AppState.log(LogTab.ERRORS, "notif", "POST_NOTIFICATIONS not granted")
            return
        }
        val manager = context.getSystemService(NotificationManager::class.java)
        if (manager.getNotificationChannel(ALERT_CHANNEL_ID) == null) {
            manager.createNotificationChannel(
                NotificationChannel(ALERT_CHANNEL_ID, "Scenario alerts", NotificationManager.IMPORTANCE_HIGH),
            )
        }
        AppState.log(LogTab.SCENARIOS, "notif", "notification scheduled in ${delayMs}ms")
        handler.postDelayed({
            val notification = NotificationCompat.Builder(context, ALERT_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("AndroidWebView")
                .setContentText("Scenario notification with sound")
                .setAutoCancel(true)
                .build()
            manager.notify(ALERT_NOTIFICATION_ID, notification)
            AppState.log(LogTab.SCENARIOS, "notif", "notification posted")
        }, delayMs)
    }

    // Android-specific

    /**
     * Opens a second `VOICE_COMMUNICATION` capture next to the WebView's and
     * logs its level about twice a second. Doubles as a mic meter and shows
     * whether either capture gets silenced (see the bridge's `micSilenced`).
     */
    @SuppressLint("MissingPermission")
    fun startMicCapture() {
        if (micCaptureRunning) return
        if (!isGranted(Manifest.permission.RECORD_AUDIO)) {
            AppState.log(LogTab.ERRORS, "mic", "RECORD_AUDIO not granted")
            return
        }
        val sampleRate = 48_000
        val minBuffer = AudioRecord.getMinBufferSize(
            sampleRate,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT,
        )
        val record = try {
            AudioRecord(
                MediaRecorder.AudioSource.VOICE_COMMUNICATION,
                sampleRate,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
                minBuffer * 2,
            )
        } catch (e: Exception) {
            AppState.log(LogTab.ERRORS, "mic", "AudioRecord failed: $e")
            return
        }
        if (record.state != AudioRecord.STATE_INITIALIZED) {
            AppState.log(LogTab.ERRORS, "mic", "AudioRecord not initialized")
            record.release()
            return
        }
        record.startRecording()
        micRecord = record
        micLoopActive = true
        micCaptureRunning = true
        AppState.log(LogTab.SCENARIOS, "mic", "second capture started (VOICE_COMMUNICATION)")
        micThread = Thread {
            val buffer = ShortArray(sampleRate / 2)
            while (micLoopActive) {
                val read = record.read(buffer, 0, buffer.size)
                if (read <= 0) continue
                var sum = 0.0
                for (i in 0 until read) sum += buffer[i].toDouble() * buffer[i]
                val rms = sqrt(sum / read)
                val db = if (rms > 0) 20 * log10(rms / Short.MAX_VALUE) else -120.0
                AppState.log(LogTab.SCENARIOS, "mic", "level %.1f dBFS".format(db))
            }
        }.apply {
            name = "mic-meter"
            start()
        }
    }

    fun stopMicCapture() {
        if (!micCaptureRunning) return
        micCaptureRunning = false
        micLoopActive = false
        micThread?.join(1000)
        micThread = null
        micRecord?.run {
            stop()
            release()
        }
        micRecord = null
        AppState.log(LogTab.SCENARIOS, "mic", "second capture stopped")
    }

    /** Speaker ↔ earpiece via the communication device (API 31+) or speakerphone. */
    @Suppress("DEPRECATION")
    fun toggleRoute() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val current = audioManager.communicationDevice?.type
            val targetType = if (current == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER) {
                AudioDeviceInfo.TYPE_BUILTIN_EARPIECE
            } else {
                AudioDeviceInfo.TYPE_BUILTIN_SPEAKER
            }
            val target = audioManager.availableCommunicationDevices.firstOrNull { it.type == targetType }
            if (target == null) {
                AppState.log(LogTab.ERRORS, "audio", "no ${StreamVideoHostBridge.deviceTypeName(targetType)} available")
                return
            }
            val ok = audioManager.setCommunicationDevice(target)
            AppState.log(LogTab.SCENARIOS, "audio", "setCommunicationDevice(${StreamVideoHostBridge.describe(target)}) = $ok")
        } else {
            audioManager.isSpeakerphoneOn = !audioManager.isSpeakerphoneOn
            AppState.log(LogTab.SCENARIOS, "audio", "speakerphone=${audioManager.isSpeakerphoneOn}")
        }
    }

    fun startForegroundService() {
        CallForegroundService.start(context)
        foregroundServiceRunning = true
    }

    fun stopForegroundService() {
        CallForegroundService.stop(context)
        foregroundServiceRunning = false
    }

    fun release() {
        stopRingtone()
        stopMicCapture()
        dingPlayer?.release()
        dingPlayer = null
        abandonHeldFocus()
        handler.removeCallbacksAndMessages(null)
    }

    // Helpers

    private fun playDing(onFinished: (() -> Unit)?) {
        dingPlayer?.release()
        val player = createPlayer(R.raw.ding, mediaAttributes) ?: return
        player.setOnCompletionListener {
            it.release()
            if (dingPlayer === it) dingPlayer = null
            onFinished?.invoke()
        }
        player.start()
        dingPlayer = player
    }

    private fun createPlayer(resId: Int, attributes: AudioAttributes): MediaPlayer? {
        val player = MediaPlayer.create(context, resId, attributes, audioManager.generateAudioSessionId())
        if (player == null) AppState.log(LogTab.ERRORS, "audio", "MediaPlayer.create failed for resource $resId")
        return player
    }

    private fun requestFocus(
        gain: Int,
        label: String,
        attributes: AudioAttributes = mediaAttributes,
    ): AudioFocusRequest? {
        val request = AudioFocusRequest.Builder(gain)
            .setAudioAttributes(attributes)
            .setOnAudioFocusChangeListener({ change ->
                AppState.log(LogTab.LIFECYCLE, "focus", "$label focus change: ${focusChangeName(change)}")
            }, handler)
            .build()
        val result = audioManager.requestAudioFocus(request)
        if (result != AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
            AppState.log(LogTab.ERRORS, "focus", "$label focus request denied (result=$result)")
            return null
        }
        AppState.log(LogTab.SCENARIOS, "focus", "$label focus granted (${focusChangeName(gain)})")
        return request
    }

    private fun abandonHeldFocus() {
        heldFocusRequests.forEach(audioManager::abandonAudioFocusRequest)
        heldFocusRequests.clear()
    }

    private fun communicationDeviceLabel(): String =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            audioManager.communicationDevice?.let { StreamVideoHostBridge.describe(it) } ?: "none"
        } else {
            @Suppress("DEPRECATION")
            if (audioManager.isSpeakerphoneOn) "speakerphone" else "default"
        }

    private fun isGranted(permission: String): Boolean =
        ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED

    companion object {
        private const val ALERT_CHANNEL_ID = "scenario-alerts"
        private const val ALERT_NOTIFICATION_ID = 2001

        /** Modes offered by the "Set mode" section. */
        val allModes: List<Int> = buildList {
            add(AudioManager.MODE_NORMAL)
            add(AudioManager.MODE_RINGTONE)
            add(AudioManager.MODE_IN_CALL)
            add(AudioManager.MODE_IN_COMMUNICATION)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) add(AudioManager.MODE_CALL_SCREENING)
        }

        private val mediaAttributes: AudioAttributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_MEDIA)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()

        private fun focusChangeName(change: Int): String = when (change) {
            AudioManager.AUDIOFOCUS_GAIN -> "GAIN"
            AudioManager.AUDIOFOCUS_GAIN_TRANSIENT -> "GAIN_TRANSIENT"
            AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK -> "GAIN_TRANSIENT_MAY_DUCK"
            AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE -> "GAIN_TRANSIENT_EXCLUSIVE"
            AudioManager.AUDIOFOCUS_LOSS -> "LOSS"
            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> "LOSS_TRANSIENT"
            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> "LOSS_TRANSIENT_CAN_DUCK"
            else -> "unknown($change)"
        }
    }
}
