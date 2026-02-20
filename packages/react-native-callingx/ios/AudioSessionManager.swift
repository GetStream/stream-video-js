import Foundation
import AVFoundation
import stream_react_native_webrtc

@objcMembers public class AudioSessionManager: NSObject {

    public static func createAudioSessionIfNeeded() {
        #if DEBUG
        print("[Callingx][createAudioSessionIfNeeded] Creating audio session")
        #endif

        let categoryOptions: AVAudioSession.CategoryOptions
        #if compiler(>=6.2) // For Xcode 26.0+
            categoryOptions = [.allowBluetoothHFP, .defaultToSpeaker]
        #else
            categoryOptions = [.allowBluetooth, .defaultToSpeaker]
        #endif
        let mode: AVAudioSession.Mode = .voiceChat

        // Configure RTCAudioSessionConfiguration to match our intended settings
        // This ensures WebRTC's internal state stays consistent during interruptions/route changes
        let rtcConfig = RTCAudioSessionConfiguration.webRTC()
        rtcConfig.category = AVAudioSession.Category.playAndRecord.rawValue
        rtcConfig.mode = mode.rawValue
        rtcConfig.categoryOptions = categoryOptions
        RTCAudioSessionConfiguration.setWebRTC(rtcConfig)

        // Apply settings via RTCAudioSession (with lock) to keep WebRTC internal state consistent
        let rtcSession = RTCAudioSession.sharedInstance()
        rtcSession.lockForConfiguration()
        defer { rtcSession.unlockForConfiguration() }

        do {
            try rtcSession.setConfiguration(rtcConfig)
        } catch {
            #if DEBUG
            print("[Callingx][createAudioSessionIfNeeded] Error configuring audio session: \(error)")
            #endif
        }
    }
}
