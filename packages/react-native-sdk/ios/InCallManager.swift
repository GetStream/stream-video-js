import Foundation
import React
import UIKit
import AVFoundation
import stream_react_native_webrtc
import AVKit

enum CallAudioRole {
    case listener
    case communicator
}

enum DefaultAudioDevice {
    case speaker
    case earpiece
}

@objc(InCallManager)
class InCallManager: RCTEventEmitter {

    private let audioSessionQueue = DispatchQueue(label: "io.getstream.rn.audioSessionQueue")
    
    private var audioManagerActivated = false
    private var callAudioRole: CallAudioRole = .communicator
    private var defaultAudioDevice: DefaultAudioDevice = .speaker
    
    private struct AudioSessionState {
        let category: AVAudioSession.Category
        let mode: AVAudioSession.Mode
        let options: AVAudioSession.CategoryOptions
    }

    private var previousAudioSessionState: AudioSessionState?
    
    override init() {
        super.init()
        let config = RTCAudioSessionConfiguration()
        config.category = AVAudioSession.Category.playAndRecord.rawValue
        config.categoryOptions = [.allowBluetooth, .defaultToSpeaker]
        config.mode = AVAudioSession.Mode.voiceChat.rawValue
        RTCAudioSessionConfiguration.setWebRTC(config)
    }
    
    deinit {
        stop()
    }
    
    override func invalidate() {
        stop()
        super.invalidate()
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    // MARK: - Logging Helper
    private func log(_ message: String) {
        NSLog("InCallManager: %@", message)
    }
    
    @objc(setAudioRole:)
    func setAudioRole(audioRole: String) {
        if audioManagerActivated {
            log("AudioManager is already activated, audio role cannot be changed.")
            return
        }
        self.callAudioRole = audioRole.lowercased() == "listener" ? .listener : .communicator
    }
    
    @objc(setDefaultAudioDeviceEndpointType:)
    func setDefaultAudioDeviceEndpointType(endpointType: String) {
        if audioManagerActivated {
            log("AudioManager is already activated, default audio device cannot be changed.")
            return
        }
        self.defaultAudioDevice = endpointType.lowercased() == "earpiece" ? .earpiece : .speaker
    }
    
    @objc
    func start() {
        audioSessionQueue.async { [self] in
            if audioManagerActivated {
                return
            }
            let session = AVAudioSession.sharedInstance()
            previousAudioSessionState = AudioSessionState(
                category: session.category,
                mode: session.mode,
                options: session.categoryOptions
            )
            configureAudioSession()
            audioManagerActivated = true
        }
    }
    
    @objc
    func stop() {
        audioSessionQueue.async { [self] in
            if !audioManagerActivated {
                return
            }
            if let prev = previousAudioSessionState {
                let session = AVAudioSession.sharedInstance()
                do {
                    try session.setCategory(prev.category, mode: prev.mode, options: prev.options)
                } catch {
                    log("Error restoring previous audio session: \(error.localizedDescription)")
                }
                previousAudioSessionState = nil
            }
            audioManagerActivated = false
        }
    }
    
    private func configureAudioSession() {
        let intendedCategory: AVAudioSession.Category = .playAndRecord
        var intendedMode: AVAudioSession.Mode = .voiceChat
        var intendedOptions: AVAudioSession.CategoryOptions = [.allowBluetooth]

        if (callAudioRole == .listener) {
            intendedMode = .default
            intendedOptions.formUnion([.allowBluetoothA2DP, .allowAirPlay, .defaultToSpeaker])
        } else {
            if (defaultAudioDevice == .speaker) {
                intendedOptions.insert(.defaultToSpeaker)
            }
        }
        
        // START: set the config that webrtc must use when it takes control
        let rtcConfig = RTCAudioSessionConfiguration.webRTC()
        log("configureAudioSession: rtcConfig \(rtcConfig.category) \(rtcConfig.mode) \(rtcConfig.categoryOptions)")
        rtcConfig.category = intendedCategory.rawValue
        rtcConfig.mode = intendedMode.rawValue
        rtcConfig.categoryOptions = intendedOptions
//        RTCAudioSessionConfiguration.setWebRTC(rtcConfig)
        // END
        
        // START: compare current audio session with intended, and update if different
        let session = RTCAudioSession.sharedInstance()
        let currentCategory = session.category
        let currentMode = session.mode
        let currentOptions = session.categoryOptions
        log("configureAudioSession: currentCategory \(currentCategory) \(currentMode) \(currentOptions)") 

        if currentCategory != intendedCategory.rawValue || currentMode != intendedMode.rawValue || currentOptions != intendedOptions {
            session.lockForConfiguration()
            do {
                try session.setCategory(intendedCategory, mode: intendedMode, options: intendedOptions)
                try session.setActive(true)
                log("configureAudioSession: setCategory success \(intendedCategory.rawValue) \(intendedMode.rawValue) \(intendedOptions)")
            } catch {
                log("configureAudioSession: setCategory failed due to: \(error.localizedDescription)")
                do {
                    try session.setMode(intendedMode)
                    try session.setActive(true)
                    log("configureAudioSession: setMode success \(intendedMode.rawValue)")
                } catch {
                    log("configureAudioSession: Error setting mode: \(error.localizedDescription)")
                }
            }
            session.unlockForConfiguration()
        } else {
            log("configureAudioSession: no change needed")
        }
        // END
    }
    
    @objc(showAudioRoutePicker)
    public func showAudioRoutePicker() {
        guard #available(iOS 11.0, tvOS 11.0, macOS 10.15, *) else {
               return
        }
        DispatchQueue.main.async {
            // AVRoutePickerView is the default UI with a
            // button that users tap to stream audio/video content to a media receiver
            let routePicker = AVRoutePickerView()
            // Send a touch up inside event to the button to trigger the audio route picker
            (routePicker.subviews.first { $0 is UIButton } as? UIButton)?
                .sendActions(for: .touchUpInside)
        }
    }
    
    @objc(setForceSpeakerphoneOn:)
    func setForceSpeakerphoneOn(enable: Bool) {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.overrideOutputAudioPort(enable ? .speaker : .none)
        } catch {
            log("Error setting speakerphone: \(error)")
        }
    }
    
    @objc(setMicrophoneMute:)
    func setMicrophoneMute(enable: Bool) {
        log("iOS does not support setMicrophoneMute()")
    }
    
    @objc
    func logAudioState() {
        let session = AVAudioSession.sharedInstance()
        let logString = """
        Audio State:
          Category: \(session.category.rawValue)
          Mode: \(session.mode.rawValue)
          Output Port: \(session.currentRoute.outputs.first?.portName ?? "N/A")
          Input Port: \(session.currentRoute.inputs.first?.portName ?? "N/A")
          Category Options: \(session.categoryOptions)
          InputNumberOfChannels: \(session.inputNumberOfChannels)
          OutputNumberOfChannels: \(session.outputNumberOfChannels)
        """
        log(logString)
    }
    
    // MARK: - RCTEventEmitter
    
    override func supportedEvents() -> [String]! {
        // TODO: list events that can be sent to JS
        return []
    }
    
    @objc
    override func addListener(_ eventName: String!) {
        super.addListener(eventName)
    }
    
    @objc
    override func removeListeners(_ count: Double) {
        super.removeListeners(count)
    }
}
