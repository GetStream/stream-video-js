import Foundation
import AVFoundation
import stream_react_native_webrtc

enum DefaultAudioDevice {
    case speaker
    case earpiece
}

@objcMembers public class AudioSessionManager: NSObject {

    public static let shared = AudioSessionManager()

    /// Guards the `defaultAudioDevice` cache. Strictly an in-memory state queue
    private let stateQueue = DispatchQueue(label: "io.getstream.callingx.audioSessionManager")
    /// The pre-join default endpoint (from `setPushConfig` / `start()`).
    private var defaultAudioDevice: DefaultAudioDevice = .speaker

    /// Serializes engine-driven session writes against each other (multiple
    /// `.willEnableAudioEngine` events in arrival order). Cross-path
    /// serialization vs `stateQueue` / WebRTC's own paths is via
    /// `RTCAudioSession.lockForConfiguration`, not via this queue.
    private let audioSessionQueue = DispatchQueue(label: "io.getstream.callingx.audioSession")

    /// Whether the AVAudioSession route-change observer is registered.
    private var hasRouteObserver = false

    /// Sets the pre-join default endpoint (from `setPushConfig` / `start()`). Pure cache —
    /// `createAudioSessionIfNeeded` applies it when the call's session is established.
    public func setDefaultAudioDeviceEndpointType(_ endpointType: String) {
        let next: DefaultAudioDevice = endpointType.lowercased() == "earpiece" ? .earpiece : .speaker
        stateQueue.async { self.defaultAudioDevice = next }
    }

    /// Belt-and-braces config writer kept for the initial-activation window
    /// (called from `CXStartCallAction.perform` / `CXAnswerCallAction.perform`).
    public func createAudioSessionIfNeeded() {
        audioSessionQueue.sync {
            self.applyCallKitConfiguration()
        }
        startRouteObserver()
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

    // MARK: - Route-change observer

    /// Registers the AVAudioSession route-change observer for the current call.
    /// the change is sent to the JS side.
    public func startRouteObserver() {
        DispatchQueue.main.async { [weak self] in
            guard let self, !self.hasRouteObserver else { return }
            self.hasRouteObserver = true
            NotificationCenter.default.addObserver(
                self,
                selector: #selector(self.handleRouteChange(_:)),
                name: AVAudioSession.routeChangeNotification,
                object: nil
            )
        }
    }

    /// Removes the route-change observer. Called on end-of-call / provider reset.
    public func stopRouteObserver() {
        DispatchQueue.main.async { [weak self] in
            guard let self, self.hasRouteObserver else { return }
            self.hasRouteObserver = false
            NotificationCenter.default.removeObserver(self, name: AVAudioSession.routeChangeNotification, object: nil)
        }
    }

    @objc private func handleRouteChange(_ notification: Notification) {
        // Defensive: a stray notification after ownership is released must not emit.
        // Read-only — emits a bare signal; JS re-fetches the device status from the SDK.
        guard CallingxSessionOwnership.callingxOwnsSession else { return }
        CallingxImpl.sharedInstance?.sendEvent(CallingxEvents.didChangeAudioRoute, body: nil)
    }

    // MARK: - Private

    private func applyCallKitConfiguration() {
        let currentDevice = stateQueue.sync { defaultAudioDevice }

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

            // The default endpoint is driven purely by the category: `.defaultToSpeaker` for a
            // speaker default, plain `.playAndRecord` (receiver) for an earpiece default. This
            // is the durable, route-change-proof form — the category is sticky across
            // interruptions. Runtime device picks are owned by the SDK (`StreamInCallManager`),
            // not callingx.
            var categoryOptions: AVAudioSession.CategoryOptions = [bluetoothOption, .allowBluetoothA2DP]
            if currentDevice == .speaker {
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
