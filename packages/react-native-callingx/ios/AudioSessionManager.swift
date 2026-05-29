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

    /// Belt-and-braces config writer kept for the initial-activation window
    /// (called from `CXStartCallAction.perform` / `CXAnswerCallAction.perform`).
    /// Stays synchronous — callers expect to `action.fulfill()` on a configured
    /// session, and `provider(_:didActivate:)` may fire imminently.
    /// The engine-observer path (`engineWillEnable`) is the authoritative reapply
    /// on subsequent activations.
    public func createAudioSessionIfNeeded() {
        applyCallKitConfiguration()
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

        // webRTC() singleton hardcodes sampleRate=48000 / ioBufferDuration=0.02 — keep those.
        let rtcConfig = RTCAudioSessionConfiguration.webRTC()
        rtcConfig.category = AVAudioSession.Category.playAndRecord.rawValue
        rtcConfig.mode = AVAudioSession.Mode.voiceChat.rawValue
        rtcConfig.categoryOptions = categoryOptions
        RTCAudioSessionConfiguration.setWebRTC(rtcConfig)

        let rtcSession = RTCAudioSession.sharedInstance()
        rtcSession.lockForConfiguration()
        defer { rtcSession.unlockForConfiguration() }

        do {
            try rtcSession.setConfiguration(rtcConfig)
        } catch {
            #if DEBUG
            NSLog("%@","[Callingx][createAudioSessionIfNeeded] Error: \(error)")
            #endif
        }
    }
}
