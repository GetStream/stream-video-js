import Foundation
import AVFoundation
import stream_react_native_webrtc

enum DefaultAudioDevice {
    case speaker
    case earpiece
}

@objcMembers public class AudioSessionManager: NSObject {

    public static let shared = AudioSessionManager()

    /// Guards the `defaultAudioDevice` cache. Strictly an in-memory state queue —
    /// session writes never run here (they'd risk a deadlock since
    /// `applyCallKitConfiguration` does `stateQueue.sync` to read the cache).
    private let stateQueue = DispatchQueue(label: "io.getstream.callingx.audioSessionManager")
    private var defaultAudioDevice: DefaultAudioDevice = .speaker

    /// Serializes engine-driven session writes against each other (multiple
    /// `.willEnableAudioEngine` events in arrival order). Cross-path
    /// serialization vs `stateQueue` / WebRTC's own paths is via
    /// `RTCAudioSession.lockForConfiguration`, not via this queue.
    private let audioSessionQueue = DispatchQueue(label: "io.getstream.callingx.audioSession")

    public func setDefaultAudioDeviceEndpointType(_ endpointType: String) {
        let next: DefaultAudioDevice = endpointType.lowercased() == "earpiece" ? .earpiece : .speaker
        stateQueue.async { self.defaultAudioDevice = next }
    }

    /// Applies category/mode/options on the calling thread, blocking until complete.
    /// Serializes with `engineWillEnable` via `audioSessionQueue`. Does not call
    /// `setActive` — CallKit owns activation.
    ///
    /// Call sites:
    /// - `CXStartCallAction` / `CXAnswerCallAction` (before `fulfill`)
    /// - `provider(_:didActivate:)` (after CallKit activates, before the engine starts)
    public func applyCallKitConfigurationSync() {
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

    private func applyCallKitConfiguration() {
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
            let currentDevice = stateQueue.sync { defaultAudioDevice }

            // XCode 16 and older don't expose .allowBluetoothHFP
            // https://forums.swift.org/t/xcode-26-avaudiosession-categoryoptions-allowbluetooth-deprecated/80956
            #if compiler(>=6.2) // For Xcode 26.0+
                let bluetoothOption: AVAudioSession.CategoryOptions = .allowBluetoothHFP
            #else
                let bluetoothOption: AVAudioSession.CategoryOptions = .allowBluetooth
            #endif

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
