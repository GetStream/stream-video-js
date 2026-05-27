import Foundation
import AVFoundation
import stream_react_native_webrtc

enum DefaultAudioDevice {
    case speaker
    case earpiece
}

@objcMembers public class AudioSessionManager: NSObject {

    public static let shared = AudioSessionManager()

    private let stateQueue = DispatchQueue(label: "io.getstream.callingx.audioSessionManager")
    private var defaultAudioDevice: DefaultAudioDevice = .speaker

    public func setDefaultAudioDeviceEndpointType(_ endpointType: String) {
        let next: DefaultAudioDevice = endpointType.lowercased() == "earpiece" ? .earpiece : .speaker
        stateQueue.async { self.defaultAudioDevice = next }
    }

    /// Belt-and-braces config writer kept for the initial-activation window
    /// (called from `CXStartCallAction.perform` / `CXAnswerCallAction.perform`).
    /// The engine-observer path (`engineWillEnable`) is the authoritative reapply
    /// on subsequent activations.
    public func createAudioSessionIfNeeded() {
        applyCallKitConfiguration()
    }

    /// Called from the AudioDeviceModule publisher's `.willEnableAudioEngine` event.
    /// Reapplies the callingx audio-session configuration on every engine rebuild
    /// (initial activation, interruption recovery, mode change). CallKit owns
    /// activation, so we never call `setActive`.
    public func engineWillEnable() {
        applyCallKitConfiguration()
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
