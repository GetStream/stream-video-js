import Foundation
import React
import UIKit
import AVFoundation
import stream_react_native_webrtc
import AVKit
import MediaPlayer

enum CallAudioRole {
    case listener
    case communicator
}

enum DefaultAudioDevice {
    case speaker
    case earpiece
}

@objc(StreamInCallManager)
class StreamInCallManager: RCTEventEmitter {
    
    private let audioSessionQueue = DispatchQueue(label: "io.getstream.rn.audioSessionQueue")
    
    private var audioManagerActivated = false
    private var callAudioRole: CallAudioRole = .communicator
    private var defaultAudioDevice: DefaultAudioDevice = .speaker
    private var previousVolume: Float = 0.75
    
    private struct AudioSessionState {
        let category: AVAudioSession.Category
        let mode: AVAudioSession.Mode
        let options: AVAudioSession.CategoryOptions
    }
    
    private var previousAudioSessionState: AudioSessionState?
    
    override func invalidate() {
        stop()
        super.invalidate()
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    
    @objc(setAudioRole:)
    func setAudioRole(audioRole: String) {
        audioSessionQueue.async { [self] in
            if audioManagerActivated {
                log("AudioManager is already activated, audio role cannot be changed.")
                return
            }
            self.callAudioRole = audioRole.lowercased() == "listener" ? .listener : .communicator
        }
    }
    
    @objc(setDefaultAudioDeviceEndpointType:)
    func setDefaultAudioDeviceEndpointType(endpointType: String) {
        audioSessionQueue.async { [self] in
            if audioManagerActivated {
                log("AudioManager is already activated, default audio device cannot be changed.")
                return
            }
            self.defaultAudioDevice = endpointType.lowercased() == "earpiece" ? .earpiece : .speaker
        }
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
        let intendedCategory: AVAudioSession.Category!
        let intendedMode: AVAudioSession.Mode!
        let intendedOptions: AVAudioSession.CategoryOptions!
        
        if (callAudioRole == .listener) {
            // enables high quality audio playback but disables microphone
            intendedCategory = .playback
            intendedMode = .default
            intendedOptions = []
        } else {
            intendedCategory = .playAndRecord
            intendedMode = .voiceChat
            
            if (defaultAudioDevice == .speaker) {
                // defaultToSpeaker will route to speaker if nothing else is connected
                intendedOptions = [.allowBluetooth, .defaultToSpeaker]
            } else {
                // having no defaultToSpeaker makes sure audio goes to earpiece if nothing is connected
                intendedOptions = [.allowBluetooth]
            }
        }
        
        // START: set the config that webrtc must use when it takes control
        let rtcConfig = RTCAudioSessionConfiguration.webRTC()
        rtcConfig.category = intendedCategory.rawValue
        rtcConfig.mode = intendedMode.rawValue
        rtcConfig.categoryOptions = intendedOptions
        RTCAudioSessionConfiguration.setWebRTC(rtcConfig)
        // END
        
        // START: compare current audio session with intended, and update if different
        let session = RTCAudioSession.sharedInstance()
        let currentCategory = session.category
        let currentMode = session.mode
        let currentOptions = session.categoryOptions
        let currentIsActive = session.isActive
        
        if currentCategory != intendedCategory.rawValue || currentMode != intendedMode.rawValue || currentOptions != intendedOptions || !currentIsActive {
            session.lockForConfiguration()
            do {
                try session.setCategory(intendedCategory, mode: intendedMode, options: intendedOptions)
                try session.setActive(true)
                log("configureAudioSession: setCategory success \(intendedCategory.rawValue) \(intendedMode.rawValue) \(intendedOptions.rawValue)")
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
            try session.setActive(true)
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
    
    @objc(muteAudioOutput)
    func muteAudioOutput() {
        DispatchQueue.main.async { [self] in
            let volumeView = MPVolumeView()
            
            // Add to a temporary view hierarchy to make it functional
            if let window = getCurrentWindow() {
                volumeView.frame = CGRect(x: -1000, y: -1000, width: 1, height: 1)
                window.addSubview(volumeView)
                
                // Give it a moment to initialize
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                    if let slider = volumeView.subviews.first(where: { $0 is UISlider }) as? UISlider {
                        self.previousVolume = slider.value
                        slider.setValue(0.0, animated: false)
                        slider.sendActions(for: .valueChanged)
                        self.log("Audio output muted via slider event")
                    } else {
                        self.log("Could not find volume slider")
                    }
                    
                    // Remove from view hierarchy after use
                    volumeView.removeFromSuperview()
                }
            }
        }
    }
    
    @objc(unmuteAudioOutput)
    func unmuteAudioOutput() {
        DispatchQueue.main.async { [self] in
            let volumeView = MPVolumeView()
            
            // Add to a temporary view hierarchy to make it functional
            if let window = getCurrentWindow() {
                volumeView.frame = CGRect(x: -1000, y: -1000, width: 1, height: 1)
                window.addSubview(volumeView)
                
                // Give it a moment to initialize
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                    if let slider = volumeView.subviews.first(where: { $0 is UISlider }) as? UISlider {
                        let targetVolume = self.previousVolume > 0 ? self.previousVolume : 0.75
                        slider.setValue(targetVolume, animated: false)
                        slider.sendActions(for: .valueChanged)
                        self.log("Audio output unmuted via slider event")
                    } else {
                        self.log("Could not find volume slider")
                    }
                    
                    // Remove from view hierarchy after use
                    volumeView.removeFromSuperview()
                }
            }
        }
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
    
    // MARK: - Helper Methods
    private func getCurrentWindow() -> UIWindow? {
        if #available(iOS 13.0, *) {
            return UIApplication.shared.connectedScenes
                .compactMap({ $0 as? UIWindowScene })
                .first?.windows
                .first(where: { $0.isKeyWindow })
        } else {
            return UIApplication.shared.keyWindow
        }
    }
    
    // MARK: - Logging Helper
    private func log(_ message: String) {
        NSLog("InCallManager: %@", message)
    }
    
}
