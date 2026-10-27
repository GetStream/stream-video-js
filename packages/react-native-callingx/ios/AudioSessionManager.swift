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

    /// Serializes callingx's session writes (system call callbacks and the engine willEnable
    /// hook) in arrival order. Never calls `AudioDeviceModule` APIs, so the hook may `.sync` onto
    /// it from the WebRTC worker thread. The `RTCAudioSession` lock itself is taken only via
    /// `AudioSessionConfigLock`.
    private let audioSessionQueue = DispatchQueue(label: "io.getstream.callingx.audioSession")

    /// Whether the AVAudioSession route-change observer is registered.
    private var hasRouteObserver = false

    /// Sets the pre-join default endpoint (from `setPushConfig` / `start()`). Pure cache —
    /// `createAudioSessionIfNeeded` applies it when the call's session is established.
    public func setDefaultAudioDeviceEndpointType(_ endpointType: String) {
        let next: DefaultAudioDevice = endpointType.lowercased() == "earpiece" ? .earpiece : .speaker
        stateQueue.async { self.defaultAudioDevice = next }
    }

    /// Applies category/mode/options on the calling thread, blocking until complete.
    /// Serializes with `applyConfigurationForEngineEnable` via `audioSessionQueue`. Does not call
    /// `setActive` — the system call backend (CallKit/LiveCommunicationKit) owns activation.
    ///
    /// Call sites:
    /// - `StartConversationAction` / `JoinConversationAction` (before `fulfill`)
    /// - `conversationManager(_:didActivate:)` (after the system activates, before the engine starts)
    public func applySystemCallConfigurationSync() {
        audioSessionQueue.sync {
            _ = self.applySystemCallConfiguration(isRecordingEnabled: false, skipIfUnchanged: false)
        }
        startRouteObserver()
    }

    /// `AudioDeviceModule` willEnable hook body (see `CallingxImpl`), run synchronously on the
    /// WebRTC worker thread before every fresh engine (initial activation, interruption recovery,
    /// voice-processing retries, speaker-only fallback), so a rebuilt engine starts with the
    /// callingx category/mode. The system call backend owns activation, so we never call `setActive`.
    /// Cheap when nothing changed: `setConfiguration` is skipped.
    /// - Returns: `0`, or `-4100` when `setConfiguration` throws (WebRTC rolls the enable back).
    public func applyConfigurationForEngineEnable(isRecordingEnabled: Bool) -> Int {
        let applied = audioSessionQueue.sync {
            self.applySystemCallConfiguration(isRecordingEnabled: isRecordingEnabled, skipIfUnchanged: true)
        }
        return applied ? 0 : -4100
    }

    /// Called from the AudioDeviceModule publisher's `.didDisableAudioEngine` event.
    /// The system call backend owns deactivation — no-op on the callingx path.
    public func engineDidDisable() {
        // No-op: the system deactivates the session (`provider(_:didDeactivate:)` / `conversationManager(_:didDeactivate:)`).
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

    /// - Parameters:
    ///   - isRecordingEnabled: whether the engine being enabled records (`false` outside the hook).
    ///   - skipIfUnchanged: skip `setConfiguration` when category/mode/options already match.
    /// - Returns: `false` if `setConfiguration` threw.
    private func applySystemCallConfiguration(isRecordingEnabled: Bool, skipIfUnchanged: Bool) -> Bool {
        let currentDevice = stateQueue.sync { defaultAudioDevice }
        do {
            let (rtcConfig, changed) = try AudioSessionConfigLock.run { session in
                let rtcConfig = makeConfiguration(
                    device: currentDevice,
                    isRecordingEnabled: isRecordingEnabled,
                    currentCategory: session.category
                )
                let changed = session.category != rtcConfig.category
                    || session.mode != rtcConfig.mode
                    || session.categoryOptions != rtcConfig.categoryOptions
                if changed || !skipIfUnchanged {
                    try session.setConfiguration(rtcConfig)
                }
                return (rtcConfig, changed)
            }
            CallingxLog.audio.debugPublic("[applySystemCallConfiguration] category=\(rtcConfig.category) mode=\(rtcConfig.mode) changed=\(changed) recording=\(isRecordingEnabled)")
            return true
        } catch {
            CallingxLog.audio.errorPublic("[applySystemCallConfiguration] Error: \(error)")
            return false
        }
    }

    /// Builds the callingx audio config and sets it as WebRTC's default.
    private func makeConfiguration(
        device: DefaultAudioDevice,
        isRecordingEnabled: Bool,
        currentCategory: String
    ) -> RTCAudioSessionConfiguration {
        // Same rule as StreamInCallManager: .playAndRecord when the engine records, the mic
        // permission is granted, or the session is already .playAndRecord.
        let wantsPlayAndRecord = isRecordingEnabled
            || micPermissionGranted()
            || currentCategory == AVAudioSession.Category.playAndRecord.rawValue

        // webRTC() singleton hardcodes sampleRate=48000 / ioBufferDuration=0.02 — keep those.
        let rtcConfig = RTCAudioSessionConfiguration.webRTC()
        if !wantsPlayAndRecord {
            // No mic permission (denied or not yet asked) and nothing recording yet: a pure-output,
            // no-VPIO session so the output-only engine renders remote audio. Not self-healing on
            // its own: a later recording enable (mic published after the grant) runs the willEnable
            // hook with isRecordingEnabled=true, which upgrades to .playAndRecord before the engine
            // starts. Once in .playAndRecord we stay there: the speaker-only fallback enables with
            // isRecordingEnabled=false and must not downgrade the session mid-call.
            // Known gap: .playback can't route to the receiver (earpiece) — that route
            // only exists under .playAndRecord.
            rtcConfig.category = AVAudioSession.Category.playback.rawValue
            rtcConfig.mode = AVAudioSession.Mode.spokenAudio.rawValue
            rtcConfig.categoryOptions = [.mixWithOthers]
        } else {
            // XCode 16 and older don't expose .allowBluetoothHFP
            // https://forums.swift.org/t/xcode-26-avaudiosession-categoryoptions-allowbluetooth-deprecated/80956
            #if compiler(>=6.2) // For Xcode 26.0+
                let bluetoothOption: AVAudioSession.CategoryOptions = .allowBluetoothHFP
            #else
                let bluetoothOption: AVAudioSession.CategoryOptions = .allowBluetooth
            #endif

            var categoryOptions: AVAudioSession.CategoryOptions = [bluetoothOption, .allowBluetoothA2DP, .mixWithOthers]
            if device == .speaker {
                categoryOptions.insert(.defaultToSpeaker)
            }

            rtcConfig.category = AVAudioSession.Category.playAndRecord.rawValue
            rtcConfig.mode = AVAudioSession.Mode.voiceChat.rawValue
            rtcConfig.categoryOptions = categoryOptions
        }
        RTCAudioSessionConfiguration.setWebRTC(rtcConfig)
        return rtcConfig
    }

    private func micPermissionGranted() -> Bool {
        if #available(iOS 17.0, *) {
            return AVAudioApplication.shared.recordPermission == .granted
        } else {
            return AVAudioSession.sharedInstance().recordPermission == .granted
        }
    }
}
