import Foundation
import AVFoundation
import stream_react_native_webrtc

enum DefaultAudioDevice {
    case speaker
    case earpiece
}

@objcMembers public class AudioSessionManager: NSObject {

    public static let shared = AudioSessionManager()

    /// Guards the in-memory caches (`defaultAudioDevice`, `_requestedOutputDeviceId`).
    /// Strictly a state queue — session writes never run here (they'd risk a deadlock
    /// since `applyCallKitConfiguration` does `stateQueue.sync` to read the caches).
    private let stateQueue = DispatchQueue(label: "io.getstream.callingx.audioSessionManager")
    /// The pre-join default endpoint (from `setPushConfig` / `start()`).
    private var defaultAudioDevice: DefaultAudioDevice = .speaker
    /// The output device the user picked *during* an active CallKit call, or `nil` to use
    /// `defaultAudioDevice`. `"speaker"` = loudspeaker; any other value is an input port
    /// `uid` (the built-in mic = earpiece, or a Bluetooth/wired port). The SDK writes this
    /// through `CallingxSessionOwnership.requestedOutputDeviceId`; we re-apply it on every
    /// reconfigure so it survives engine rebuilds.
    private var _requestedOutputDeviceId: String?

    /// Serializes engine-driven session writes against each other (multiple
    /// `.willEnableAudioEngine` events in arrival order). Cross-path
    /// serialization vs `stateQueue` / WebRTC's own paths is via
    /// `RTCAudioSession.lockForConfiguration`, not via this queue.
    private let audioSessionQueue = DispatchQueue(label: "io.getstream.callingx.audioSession")

    /// Sets the pre-join default endpoint (from `setPushConfig` / `start()`). Pure cache —
    /// `createAudioSessionIfNeeded` applies it when the call's session is established. A
    /// runtime pick goes through `setRequestedOutputDeviceId` instead.
    public func setDefaultAudioDeviceEndpointType(_ endpointType: String) {
        let next: DefaultAudioDevice = endpointType.lowercased() == "earpiece" ? .earpiece : .speaker
        stateQueue.async { self.defaultAudioDevice = next }
    }

    /// The runtime output pick, read by the `CallingxSessionOwnership` bridge.
    public var requestedOutputDeviceId: String? {
        stateQueue.sync { _requestedOutputDeviceId }
    }

    /// Records the runtime output pick (written by the SDK via
    /// `CallingxSessionOwnership.requestedOutputDeviceId`). Store only — the SDK
    /// (`StreamInCallManager`) performs the live switch itself. callingx re-applies this
    /// pick on its next engine re-enable (`engineWillEnable` → `applyCallKitConfiguration`),
    /// so a rebuild doesn't clobber it back to the default.
    public func setRequestedOutputDeviceId(_ deviceId: String?) {
        stateQueue.async { self._requestedOutputDeviceId = deviceId }
    }

    /// Belt-and-braces config writer kept for the initial-activation window
    /// (called from `CXStartCallAction.perform` / `CXAnswerCallAction.perform`).
    /// Stays synchronous from the caller's perspective — `audioSessionQueue.sync`
    /// blocks until configuration completes so `action.fulfill()` runs on a configured
    /// session and `provider(_:didActivate:)` may fire imminently. Serializes with
    /// `engineWillEnable` (e.g. work queued by `adm.reset()` runs first on the queue).
    /// The engine-observer path is the authoritative reapply on subsequent activations.
    public func createAudioSessionIfNeeded() {
        audioSessionQueue.sync {
            self.applyCallKitConfiguration()
        }
    }

    /// Called from the AudioDeviceModule publisher's `.willEnableAudioEngine` event.
    /// Reapplies the callingx audio-session configuration on every engine rebuild
    /// (initial activation, interruption recovery, mode change). CallKit owns
    /// activation, so we never call `setActive`.
    ///
    /// Hops onto `audioSessionQueue` because the sink is Combine-driven with no
    /// synchronous caller waiting; this serializes back-to-back engine events
    /// against each other.
    public func engineWillEnable() {
        audioSessionQueue.async { [weak self] in
            CallingxLog.audio.debugPublic("[engineWillEnable]")
            self?.applyCallKitConfiguration()
        }
    }

    /// Called from the AudioDeviceModule publisher's `.didDisableAudioEngine` event.
    /// CallKit owns deactivation — no-op on the CallKit path.
    public func engineDidDisable() {
        // No-op: CallKit's `provider(_:didDeactivate:)` handles `setActive(false)`.
    }

    // MARK: - Private

    /// Whether `uid` is the built-in microphone (i.e. an earpiece pick, in the shared id scheme).
    /// Used to decide `.defaultToSpeaker`: the earpiece must drop it, but a Bluetooth/wired pick
    /// may keep it (following the configured default) for a graceful fallback.
    private func isBuiltInMicUid(_ uid: String) -> Bool {
        AVAudioSession.sharedInstance().availableInputs?
            .contains { $0.uid == uid && $0.portType == .builtInMic } ?? false
    }

    private func applyCallKitConfiguration() {
        let (currentDevice, requested) = stateQueue.sync { (defaultAudioDevice, _requestedOutputDeviceId) }

        // Resolve the effective output and drive it the same way StreamInCallManager does
        // (see its `makeAudioConfiguration` + `applyOutputRouting`):
        //   - explicit "speaker" pick → force the loudspeaker via overrideOutputAudioPort(.speaker)
        //     (even over connected Bluetooth/headphones — the user explicitly chose it);
        //   - explicit input port (earpiece / BT / wired) → overrideOutputAudioPort(.none) + setPreferredInput;
        //   - no explicit pick → headphone-aware default via the category flag only
        //     (.defaultToSpeaker for a speaker default, plain receiver for an earpiece default).
        // `.defaultToSpeaker` is present whenever the effective output is the speaker — the
        // default speaker OR an explicit speaker pick — as the durable, route-change-proof
        // backstop (it survives route changes/interruptions, unlike the temporary override).
        // An explicit speaker pick ALSO force-overrides to the speaker so it wins over a
        // currently-connected accessory. Everything else drops `.defaultToSpeaker` and uses
        // `overrideOutputAudioPort(.none)` (+ setPreferredInput for a specific input port).
        let forceSpeaker: Bool
        let preferredInputUid: String?
        let useDefaultToSpeaker: Bool
        if let requested {
            if requested == "speaker" {
                forceSpeaker = true; preferredInputUid = nil; useDefaultToSpeaker = true
            } else {
                forceSpeaker = false; preferredInputUid = requested
                // Earpiece (built-in mic) must drop `.defaultToSpeaker` — it's input-only with no
                // output coupling, so keeping it would route the earpiece to the speaker. A specific
                // Bluetooth/wired pick (output-coupled / auto-routing) instead follows the configured
                // default, so if its preferred input is later cleared it falls back to the call's
                // default (speaker/earpiece) rather than always the earpiece.
                useDefaultToSpeaker = !isBuiltInMicUid(requested) && currentDevice == .speaker
            }
        } else {
            forceSpeaker = false; preferredInputUid = nil; useDefaultToSpeaker = currentDevice == .speaker
        }

        let rtcSession = RTCAudioSession.sharedInstance()

        // Relax to a pure-output (.playback) session when mic permission is missing
        // same logic as in StreamInCallManager
        let usePlaybackFallback = !micPermissionGranted()

        // webRTC() singleton hardcodes sampleRate=48000 / ioBufferDuration=0.02 — keep those.
        let rtcConfig = RTCAudioSessionConfiguration.webRTC()
        if usePlaybackFallback {
            // Known gap: .playback can't route to the receiver (earpiece) — that route
            // only exists under .playAndRecord.
            rtcConfig.category = AVAudioSession.Category.playback.rawValue
            rtcConfig.mode = AVAudioSession.Mode.spokenAudio.rawValue
            rtcConfig.categoryOptions = []
        } else {
            // XCode 16 and older don't expose .allowBluetoothHFP
            // https://forums.swift.org/t/xcode-26-avaudiosession-categoryoptions-allowbluetooth-deprecated/80956
            #if compiler(>=6.2) // For Xcode 26.0+
                let bluetoothOption: AVAudioSession.CategoryOptions = .allowBluetoothHFP
            #else
                let bluetoothOption: AVAudioSession.CategoryOptions = .allowBluetooth
            #endif

            var categoryOptions: AVAudioSession.CategoryOptions = [bluetoothOption, .allowBluetoothA2DP]
            if useDefaultToSpeaker {
                categoryOptions.insert(.defaultToSpeaker)
            }

            rtcConfig.category = AVAudioSession.Category.playAndRecord.rawValue
            rtcConfig.mode = AVAudioSession.Mode.voiceChat.rawValue
            rtcConfig.categoryOptions = categoryOptions
        }
        RTCAudioSessionConfiguration.setWebRTC(rtcConfig)

        CallingxLog.audio.debugPublic("[applyCallKitConfiguration] category=\(rtcConfig.category) mode=\(rtcConfig.mode)")

        rtcSession.lockForConfiguration()
        defer { rtcSession.unlockForConfiguration() }

        do {
            try rtcSession.setConfiguration(rtcConfig)
            // Re-apply the explicit route AFTER setConfiguration (setCategory resets the
            // output-port override and doesn't reliably keep a preferred input, so an explicit
            // pick must be re-asserted on every reconfigure — mirrors StreamInCallManager /
            // Telegram). A no-explicit-pick call relies on the category flag above.
            // Skipped under the playback fallback: it's output-only (mic permission missing),
            // so there's no input to prefer and the receiver route is unavailable anyway.
            if !usePlaybackFallback {
                let avSession = AVAudioSession.sharedInstance()
                if forceSpeaker {
                    // Pin the built-in mic so a stale preferred Bluetooth input can't steal the
                    // route back, then force the loudspeaker.
                    if let mic = avSession.availableInputs?.first(where: { $0.portType == .builtInMic }) {
                        try avSession.setPreferredInput(mic)
                    }
                    try avSession.overrideOutputAudioPort(.speaker)
                } else if let preferredInputUid {
                    try avSession.overrideOutputAudioPort(.none)
                    if let port = avSession.availableInputs?.first(where: { $0.uid == preferredInputUid }) {
                        try avSession.setPreferredInput(port)
                    } else {
                        CallingxLog.audio.debugPublic("[applyCallKitConfiguration] no input for uid \(preferredInputUid)")
                    }
                }
            }
        } catch {
            CallingxLog.audio.errorPublic("[applyCallKitConfiguration] Error: \(error)")
        }
    }

    private func micPermissionGranted() -> Bool {
        if #available(iOS 17.0, *) {
            return AVAudioApplication.shared.recordPermission == .granted
        } else {
            return AVAudioSession.sharedInstance().recordPermission == .granted
        }
    }
}
