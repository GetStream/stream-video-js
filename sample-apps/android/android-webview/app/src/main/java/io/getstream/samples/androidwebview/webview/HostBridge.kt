package io.getstream.samples.androidwebview.webview

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.media.AudioDeviceCallback
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.media.AudioRecordingConfiguration
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.telephony.PhoneStateListener
import android.telephony.TelephonyCallback
import android.telephony.TelephonyManager
import android.util.Log
import android.webkit.WebView
import androidx.annotation.RequiresApi
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.ProcessLifecycleOwner
import org.json.JSONArray
import org.json.JSONObject
import java.lang.ref.WeakReference
import java.util.WeakHashMap

/** Configuration for [configureStreamVideoHostBridge]. */
data class StreamVideoHostBridgeConfiguration(
    /** Enables diagnostic output (logcat plus [logger]). */
    val logsEnabled: Boolean = false,
    /** Interval used by short audio-state polling windows. */
    val pollingIntervalMs: Long = 250,
    /** Number of unchanged polling ticks before a polling window stops. */
    val stablePollingTicks: Int = 4,
    /** Optional sink for diagnostic lines, called on the main thread. */
    val logger: ((String) -> Unit)? = null,
)

/** JavaScript event names emitted by the host bridge. */
object StreamVideoHostBridgeEvent {
    /** Event carrying the current host audio snapshot. */
    const val AUDIO_SESSION = "stream-video:host-audio-session"

    /** Event carrying the current app lifecycle transition. */
    const val LIFECYCLE = "stream-video:host-lifecycle"
}

private val bridges = WeakHashMap<WebView, StreamVideoHostBridge>()

/**
 * Starts forwarding host audio and lifecycle snapshots to the page as
 * `stream-video:host-audio-session` and `stream-video:host-lifecycle`
 * `CustomEvent`s. Must be called on the main thread. Idempotent: repeated
 * calls return the bridge already attached to this WebView.
 *
 * Events are fire-and-forget for the currently loaded document; snapshots are
 * not buffered or replayed across page loads.
 *
 * Page-side listener example:
 *
 *     window.addEventListener('stream-video:host-audio-session', (event) => {
 *       console.log(event.detail);
 *     });
 */
fun WebView.configureStreamVideoHostBridge(
    configuration: StreamVideoHostBridgeConfiguration = StreamVideoHostBridgeConfiguration(),
): StreamVideoHostBridge = bridges.getOrPut(this) {
    StreamVideoHostBridge(this, configuration).also { it.start() }
}

/** Stops the bridge attached to this WebView. Call before `WebView.destroy()`. */
fun WebView.releaseStreamVideoHostBridge() {
    bridges.remove(this)?.release()
}

/**
 * Observes the process-wide audio state and app lifecycle and forwards
 * snapshots to a WebView. Android has no equivalent of iOS
 * `AVAudioSession` interruptions, so an interruption is derived from state:
 * a cellular call ringing or off-hook, the audio mode switching to a call
 * mode, or one of this app's recordings being silenced by the system.
 *
 * All callbacks and state live on the main thread.
 */
class StreamVideoHostBridge internal constructor(
    webView: WebView,
    private val configuration: StreamVideoHostBridgeConfiguration,
) {
    private val webViewRef = WeakReference(webView)
    private val context: Context = webView.context.applicationContext
    private val audioManager = context.getSystemService(AudioManager::class.java)
    private val telephonyManager: TelephonyManager? = context.getSystemService(TelephonyManager::class.java)
    private val handler = Handler(Looper.getMainLooper())
    private val mainExecutor = ContextCompat.getMainExecutor(context)
    private val unregisterActions = mutableListOf<() -> Unit>()

    private var latestInterruption: Interruption? = null
    private var latestRouteChange: String? = null
    private var callState: Int? = null
    private var micSilenced = false
    private var lastSession: Session? = null
    private var telephonyObserved = false
    private var devicesPrimed = false
    private var released = false

    private var polling = false
    private var stableTicks = 0
    private var recoveryArmed = false

    private val pollTick = object : Runnable {
        override fun run() {
            if (released) return
            val session = currentSession()
            if (session != lastSession) {
                stableTicks = 0
                reconcileInterruption(session)
                sendSnapshot(session)
            } else if (++stableTicks >= configuration.stablePollingTicks.coerceAtLeast(1)) {
                polling = false
                return
            }
            handler.postDelayed(this, configuration.pollingIntervalMs)
        }
    }

    /**
     * Re-evaluates an open `began` interruption once per second, in case a
     * callback was missed (for example the mode returning to normal on API
     * 29-30, where there is no mode listener).
     */
    private val recoveryTick = object : Runnable {
        override fun run() {
            if (released || latestInterruption?.type != "began") {
                recoveryArmed = false
                return
            }
            val session = currentSession()
            if (reconcileInterruption(session)) sendSnapshot(session)
            if (latestInterruption?.type == "began") {
                handler.postDelayed(this, RECOVERY_INTERVAL_MS)
            } else {
                recoveryArmed = false
            }
        }
    }

    private val deviceCallback = object : AudioDeviceCallback() {
        override fun onAudioDevicesAdded(addedDevices: Array<out AudioDeviceInfo>) {
            // Registration immediately reports the devices that are already
            // connected; that is not a route change.
            if (!devicesPrimed) {
                devicesPrimed = true
                return
            }
            routeChanged("deviceAdded", addedDevices.joinToString { describe(it) })
        }

        override fun onAudioDevicesRemoved(removedDevices: Array<out AudioDeviceInfo>) {
            routeChanged("deviceRemoved", removedDevices.joinToString { describe(it) })
        }
    }

    private val recordingCallback = object : AudioManager.AudioRecordingCallback() {
        override fun onRecordingConfigChanged(configs: List<AudioRecordingConfiguration>) {
            val silenced = configs.any { it.isClientSilenced }
            log(
                "recordings changed: " + configs.joinToString {
                    "session=${it.clientAudioSessionId} source=${it.clientAudioSource} silenced=${it.isClientSilenced}"
                }.ifEmpty { "none active" },
            )
            if (silenced == micSilenced) return
            micSilenced = silenced
            onStateSignal()
        }
    }

    private val noisyReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            routeChanged("becomingNoisy", null)
        }
    }

    private val lifecycleObserver = LifecycleEventObserver { _, event ->
        val transition = when (event) {
            Lifecycle.Event.ON_START -> "willEnterForeground"
            Lifecycle.Event.ON_RESUME -> "didBecomeActive"
            Lifecycle.Event.ON_PAUSE -> "willResignActive"
            Lifecycle.Event.ON_STOP -> "didEnterBackground"
            else -> null
        } ?: return@LifecycleEventObserver
        lifecycleTransition(transition)
    }

    internal fun start() {
        micSilenced = audioManager.activeRecordingConfigurations.any { it.isClientSilenced }

        audioManager.registerAudioDeviceCallback(deviceCallback, handler)
        unregisterActions += { audioManager.unregisterAudioDeviceCallback(deviceCallback) }

        audioManager.registerAudioRecordingCallback(recordingCallback, handler)
        unregisterActions += { audioManager.unregisterAudioRecordingCallback(recordingCallback) }

        ContextCompat.registerReceiver(
            context,
            noisyReceiver,
            IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY),
            ContextCompat.RECEIVER_NOT_EXPORTED,
        )
        unregisterActions += { context.unregisterReceiver(noisyReceiver) }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            unregisterActions += registerApi31AudioListeners()
        }

        refreshTelephonyObservation()

        ProcessLifecycleOwner.get().lifecycle.addObserver(lifecycleObserver)
        unregisterActions += { ProcessLifecycleOwner.get().lifecycle.removeObserver(lifecycleObserver) }

        lastSession = currentSession()
        startPolling()
        log("started")
    }

    /**
     * Starts observing cellular call state if it is not observed yet. On API
     * 31+ this needs `READ_PHONE_STATE`; call again after the permission is
     * granted.
     */
    fun refreshTelephonyObservation() {
        if (released || telephonyObserved) return
        val tm = telephonyManager ?: return
        val unregister = try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (!hasPhoneStatePermission()) {
                    log("READ_PHONE_STATE not granted; phone-call interruptions come from the audio mode only")
                    return
                }
                registerTelephonyCallback(tm)
            } else {
                registerPhoneStateListener(tm)
            }
        } catch (e: SecurityException) {
            log("call-state observation failed: ${e.message}")
            return
        }
        telephonyObserved = true
        unregisterActions += unregister
        log("observing call state")
    }

    internal fun release() {
        if (released) return
        released = true
        handler.removeCallbacks(pollTick)
        handler.removeCallbacks(recoveryTick)
        unregisterActions.forEach { runCatching(it) }
        unregisterActions.clear()
        log("released")
    }

    // Signals

    private fun routeChanged(reason: String, detail: String?) {
        latestRouteChange = reason
        log("route change: $reason${detail?.let { " ($it)" } ?: ""}")
        val session = currentSession()
        reconcileInterruption(session)
        sendSnapshot(session)
        startPolling()
    }

    private fun callStateChanged(state: Int) {
        callState = state
        log("call state: ${callStateName(state)}")
        onStateSignal()
    }

    private fun onStateSignal() {
        val session = currentSession()
        if (reconcileInterruption(session)) sendSnapshot(session)
        startPolling()
    }

    private fun lifecycleTransition(transition: String) {
        log("app lifecycle: $transition")
        dispatch(
            StreamVideoHostBridgeEvent.LIFECYCLE,
            JSONObject()
                .put("schemaVersion", SCHEMA_VERSION)
                .put("source", SOURCE)
                .put("timestamp", System.currentTimeMillis())
                .put("state", JSONObject().put("transition", transition)),
        )
        if (transition != "didBecomeActive") return
        // Foregrounding is a last-chance recovery check: callbacks can be
        // delayed or coalesced while the app is in the background.
        onStateSignal()
    }

    // Interruption state

    /** Updates [latestInterruption] from [session]; returns `true` when it changed. */
    private fun reconcileInterruption(session: Session): Boolean {
        val reason = interruptionReason(session)
        val current = latestInterruption
        if (reason != null) {
            if (current?.type == "began" && current.reason == reason) return false
            latestInterruption = Interruption("began", reason)
            log("interruption began: $reason")
            armRecoveryTimer()
            return true
        }
        if (current?.type != "began") return false
        latestInterruption = Interruption("ended", current.reason)
        log("interruption ended: ${current.reason}")
        return true
    }

    private fun interruptionReason(session: Session): String? = when {
        session.callState == TelephonyManager.CALL_STATE_RINGING ||
            session.mode == AudioManager.MODE_RINGTONE -> "ringing"
        session.callState == TelephonyManager.CALL_STATE_OFFHOOK ||
            session.mode == AudioManager.MODE_IN_CALL ||
            session.mode == AudioManager.MODE_CALL_SCREENING -> "phoneCall"
        session.micSilenced -> "micSilenced"
        else -> null
    }

    private fun armRecoveryTimer() {
        if (recoveryArmed) return
        recoveryArmed = true
        handler.postDelayed(recoveryTick, RECOVERY_INTERVAL_MS)
    }

    private fun startPolling() {
        stableTicks = 0
        if (polling || released) return
        polling = true
        handler.postDelayed(pollTick, configuration.pollingIntervalMs)
    }

    // Snapshots

    @Suppress("DEPRECATION")
    private fun currentSession(): Session = Session(
        mode = audioManager.mode,
        communicationDevice = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            audioManager.communicationDevice?.let(::Port)
        } else {
            null
        },
        speakerphoneOn = audioManager.isSpeakerphoneOn,
        musicActive = audioManager.isMusicActive,
        micMuted = audioManager.isMicrophoneMute,
        micSilenced = micSilenced,
        callState = callState,
    )

    private fun sendSnapshot(session: Session = currentSession()) {
        lastSession = session
        val snapshot = JSONObject()
            .put("schemaVersion", SCHEMA_VERSION)
            .put("source", SOURCE)
            .put("timestamp", System.currentTimeMillis())
            .put("session", session.toJson())
            .put(
                "route",
                JSONObject()
                    .put("inputs", portsJson(AudioManager.GET_DEVICES_INPUTS))
                    .put("outputs", portsJson(AudioManager.GET_DEVICES_OUTPUTS)),
            )
        latestInterruption?.let { snapshot.put("interruption", it.toJson()) }
        latestRouteChange?.let { snapshot.put("routeChange", JSONObject().put("reason", it)) }
        dispatch(StreamVideoHostBridgeEvent.AUDIO_SESSION, snapshot)
    }

    private fun portsJson(flags: Int): JSONArray = JSONArray().apply {
        audioManager.getDevices(flags).forEach { put(Port(it).toJson()) }
    }

    private fun dispatch(eventName: String, detail: JSONObject) {
        val webView = webViewRef.get() ?: return
        log("dispatch $eventName $detail")
        // JSON is a valid JS expression, so it can be interpolated directly
        // as the `detail` of a CustomEvent.
        val script = "window.dispatchEvent(new CustomEvent('$eventName', { detail: $detail }));"
        webView.evaluateJavascript(script, null)
    }

    // Registration helpers

    @RequiresApi(Build.VERSION_CODES.S)
    private fun registerApi31AudioListeners(): () -> Unit {
        val modeListener = AudioManager.OnModeChangedListener { mode ->
            routeChanged("modeChanged", modeName(mode))
        }
        val deviceListener = AudioManager.OnCommunicationDeviceChangedListener { device ->
            routeChanged("communicationDeviceChanged", device?.let { describe(it) } ?: "none")
        }
        audioManager.addOnModeChangedListener(mainExecutor, modeListener)
        audioManager.addOnCommunicationDeviceChangedListener(mainExecutor, deviceListener)
        return {
            audioManager.removeOnModeChangedListener(modeListener)
            audioManager.removeOnCommunicationDeviceChangedListener(deviceListener)
        }
    }

    @RequiresApi(Build.VERSION_CODES.S)
    private fun registerTelephonyCallback(tm: TelephonyManager): () -> Unit {
        val callback = object : TelephonyCallback(), TelephonyCallback.CallStateListener {
            override fun onCallStateChanged(state: Int) = callStateChanged(state)
        }
        tm.registerTelephonyCallback(mainExecutor, callback)
        return { tm.unregisterTelephonyCallback(callback) }
    }

    @Suppress("DEPRECATION")
    private fun registerPhoneStateListener(tm: TelephonyManager): () -> Unit {
        val listener = object : PhoneStateListener(mainExecutor) {
            @Deprecated("Deprecated in Java")
            override fun onCallStateChanged(state: Int, phoneNumber: String?) = callStateChanged(state)
        }
        tm.listen(listener, PhoneStateListener.LISTEN_CALL_STATE)
        return { tm.listen(listener, PhoneStateListener.LISTEN_NONE) }
    }

    private fun hasPhoneStatePermission(): Boolean =
        ContextCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE) ==
            PackageManager.PERMISSION_GRANTED

    private fun log(message: String) {
        if (!configuration.logsEnabled) return
        Log.d(TAG, message)
        configuration.logger?.invoke(message)
    }

    // Payload types

    private data class Interruption(val type: String, val reason: String?) {
        fun toJson(): JSONObject = JSONObject().put("type", type).apply {
            reason?.let { put("reason", it) }
        }
    }

    private data class Port(val name: String, val type: String) {
        constructor(device: AudioDeviceInfo) : this(device.productName.toString(), deviceTypeName(device.type))

        fun toJson(): JSONObject = JSONObject().put("name", name).put("type", type)
    }

    private data class Session(
        val mode: Int,
        val communicationDevice: Port?,
        val speakerphoneOn: Boolean,
        val musicActive: Boolean,
        val micMuted: Boolean,
        val micSilenced: Boolean,
        val callState: Int?,
    ) {
        fun toJson(): JSONObject = JSONObject()
            .put("mode", modeName(mode))
            .put("speakerphoneOn", speakerphoneOn)
            .put("musicActive", musicActive)
            .put("micMuted", micMuted)
            .put("micSilenced", micSilenced)
            .put("callState", callState?.let(::callStateName) ?: "unknown")
            .apply { communicationDevice?.let { put("communicationDevice", it.toJson()) } }
    }

    companion object {
        private const val TAG = "StreamVideoHostBridge"
        private const val SCHEMA_VERSION = 1
        private const val SOURCE = "android"
        private const val RECOVERY_INTERVAL_MS = 1000L

        /** Stable string form of an `AudioManager.MODE_*` value. */
        fun modeName(mode: Int): String = when (mode) {
            AudioManager.MODE_NORMAL -> "normal"
            AudioManager.MODE_RINGTONE -> "ringtone"
            AudioManager.MODE_IN_CALL -> "inCall"
            AudioManager.MODE_IN_COMMUNICATION -> "inCommunication"
            AudioManager.MODE_CALL_SCREENING -> "callScreening"
            MODE_CALL_REDIRECT -> "callRedirect"
            MODE_COMMUNICATION_REDIRECT -> "communicationRedirect"
            else -> "unknown($mode)"
        }

        /** Stable string form of an `AudioDeviceInfo.TYPE_*` value. */
        fun deviceTypeName(type: Int): String = when (type) {
            AudioDeviceInfo.TYPE_BUILTIN_EARPIECE -> "builtinEarpiece"
            AudioDeviceInfo.TYPE_BUILTIN_SPEAKER -> "builtinSpeaker"
            AudioDeviceInfo.TYPE_BUILTIN_SPEAKER_SAFE -> "builtinSpeakerSafe"
            AudioDeviceInfo.TYPE_BUILTIN_MIC -> "builtinMic"
            AudioDeviceInfo.TYPE_WIRED_HEADSET -> "wiredHeadset"
            AudioDeviceInfo.TYPE_WIRED_HEADPHONES -> "wiredHeadphones"
            AudioDeviceInfo.TYPE_BLUETOOTH_SCO -> "bluetoothSco"
            AudioDeviceInfo.TYPE_BLUETOOTH_A2DP -> "bluetoothA2dp"
            AudioDeviceInfo.TYPE_BLE_HEADSET -> "bleHeadset"
            AudioDeviceInfo.TYPE_BLE_SPEAKER -> "bleSpeaker"
            AudioDeviceInfo.TYPE_HEARING_AID -> "hearingAid"
            AudioDeviceInfo.TYPE_USB_HEADSET -> "usbHeadset"
            AudioDeviceInfo.TYPE_USB_DEVICE -> "usbDevice"
            AudioDeviceInfo.TYPE_USB_ACCESSORY -> "usbAccessory"
            AudioDeviceInfo.TYPE_HDMI -> "hdmi"
            AudioDeviceInfo.TYPE_TELEPHONY -> "telephony"
            AudioDeviceInfo.TYPE_REMOTE_SUBMIX -> "remoteSubmix"
            AudioDeviceInfo.TYPE_BUS -> "bus"
            else -> "type$type"
        }

        /** Short human-readable label for a device, such as `builtinSpeaker[Pixel 10]`. */
        fun describe(device: AudioDeviceInfo): String =
            "${deviceTypeName(device.type)}[${device.productName}]"

        private fun callStateName(state: Int): String = when (state) {
            TelephonyManager.CALL_STATE_IDLE -> "idle"
            TelephonyManager.CALL_STATE_RINGING -> "ringing"
            TelephonyManager.CALL_STATE_OFFHOOK -> "offhook"
            else -> "unknown($state)"
        }

        // Added in API 33; inlined so the names resolve on older SDK levels.
        private const val MODE_CALL_REDIRECT = 5
        private const val MODE_COMMUNICATION_REDIRECT = 6
    }
}
