import Foundation
import AVFoundation
import stream_react_native_webrtc

enum DefaultAudioDevice {
    case speaker
    case earpiece
}

@objcMembers public class AudioSessionManager: NSObject {

    private static let stateQueue = DispatchQueue(label: "io.getstream.callingx.audioSessionManager")
    private static var defaultAudioDevice: DefaultAudioDevice = .speaker
    private static var configuredInCurrentActivationCycle: Bool = false

    public static func setDefaultAudioDeviceEndpointType(_ endpointType: String) {
        let next: DefaultAudioDevice = endpointType.lowercased() == "earpiece" ? .earpiece : .speaker
        stateQueue.async { defaultAudioDevice = next }
    }

    public static func reapplyForDidActivateIfNeeded() {
        if configuredInCurrentActivationCycle { return }
        createAudioSessionIfNeeded()
    }

    public static func resetActivationCycle() {
        configuredInCurrentActivationCycle = false
    }

    public static func createAudioSessionIfNeeded() {
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
            // Set inside do{} so a failure leaves the flag false and the next
            // didActivate reapply auto-recovers.
            configuredInCurrentActivationCycle = true
        } catch {
            #if DEBUG
            NSLog("%@","[Callingx][createAudioSessionIfNeeded] Error: \(error)")
            #endif
        }
    }
}
