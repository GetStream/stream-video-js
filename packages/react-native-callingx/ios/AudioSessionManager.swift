import Foundation
import AVFoundation

@objcMembers public class AudioSessionManager: NSObject {

    public static func createAudioSessionIfNeeded() {
        let autoConfigureAudioSession = Settings.getAutoConfigureAudioSession()
        if !autoConfigureAudioSession {
            #if DEBUG
            print("[Callingx][createAudioSessionIfNeeded] Auto-configuration disabled, user handles audio session")
            #endif
            return
        }

        #if DEBUG
        print("[Callingx][createAudioSessionIfNeeded] Activating audio session")
        #endif

        var categoryOptions: AVAudioSession.CategoryOptions = [.allowBluetooth, .allowBluetoothA2DP]
        var mode: AVAudioSession.Mode = .default

      if let settings = Settings.getSettings(),
           let audioSessionSettings = settings["audioSession"] as? [String: Any] {
            if let options = audioSessionSettings["categoryOptions"] as? UInt {
                categoryOptions = AVAudioSession.CategoryOptions(rawValue: options)
            }

            if let modeString = audioSessionSettings["mode"] as? String {
                mode = AVAudioSession.Mode(rawValue: modeString)
            }
        }

        let audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession.setCategory(.playAndRecord, options: categoryOptions)
            try audioSession.setMode(mode)

            let sampleRate: Double = 44100.0
            try audioSession.setPreferredSampleRate(sampleRate)

            let bufferDuration: TimeInterval = 0.005
            try audioSession.setPreferredIOBufferDuration(bufferDuration)

            try audioSession.setActive(true)
        } catch {
            #if DEBUG
            print("[Callingx][createAudioSessionIfNeeded] Error configuring audio session: \(error)")
            #endif
        }
    }
}
