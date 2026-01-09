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
    private var enableStereo: Bool = false
    private var previousVolume: Float = 0.75

    private struct AudioSessionState {
        let category: AVAudioSession.Category
        let mode: AVAudioSession.Mode
        let options: AVAudioSession.CategoryOptions
    }

    private var hasRegisteredRouteObserver = false
    private var stereoRefreshWorkItem: DispatchWorkItem?

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
    
    @objc(setEnableStereoAudioOutput:)
    func setEnableStereoAudioOutput(enabled: Bool) {
        audioSessionQueue.async { [self] in
            if audioManagerActivated {
                log("AudioManager is already activated, enable stereo audio output cannot be changed.")
                return
            }
            self.enableStereo = enabled
        }
    }
    
    @objc
    func setup() {
        let intendedCategory: AVAudioSession.Category!
        let intendedMode: AVAudioSession.Mode!
        let intendedOptions: AVAudioSession.CategoryOptions!
        
        let adm = getAudioDeviceModule()
        adm.reset()

        if (callAudioRole == .listener) {
            // enables high quality audio playback but disables microphone
            intendedCategory = .playback
            intendedMode = .default
            intendedOptions = []
            // TODO: for stereo we should disallow BluetoothHFP and allow only allowBluetoothA2DP
            // note: this is the behaviour of iOS native SDK, but fails here with (OSStatus error -50.)
            // intendedOptions = self.enableStereo ? [.allowBluetoothA2DP] : []
            if (self.enableStereo) {
                adm.setStereoPlayoutPreference(true)
            }
        } else {
            intendedCategory = .playAndRecord
            intendedMode = defaultAudioDevice == .speaker ? .videoChat : .voiceChat
            
            // XCode 16 and older don't expose .allowBluetoothHFP
            // https://forums.swift.org/t/xcode-26-avaudiosession-categoryoptions-allowbluetooth-deprecated/80956
            #if compiler(>=6.2) // For Xcode 26.0+
                let bluetoothOption: AVAudioSession.CategoryOptions = .allowBluetoothHFP
            #else
                let bluetoothOption: AVAudioSession.CategoryOptions = .allowBluetooth
            #endif
            intendedOptions = defaultAudioDevice == .speaker ? [bluetoothOption, .defaultToSpeaker] : [bluetoothOption]
        }
        log("Setup with category: \(intendedCategory.rawValue), mode: \(intendedMode.rawValue), options: \(String(describing: intendedOptions))")
        let rtcConfig = RTCAudioSessionConfiguration.webRTC()
        rtcConfig.category = intendedCategory.rawValue
        rtcConfig.mode = intendedMode.rawValue
        rtcConfig.categoryOptions = intendedOptions
        RTCAudioSessionConfiguration.setWebRTC(rtcConfig)
        
        let session = RTCAudioSession.sharedInstance()
        session.lockForConfiguration()
        defer {
            session.unlockForConfiguration()
        }
        do {
            try session.setCategory(intendedCategory, mode: intendedMode, options: intendedOptions)
        } catch {
            log("Error setting audio session: \(error.localizedDescription)")
        }
        
    }

    @objc
    func start() {
        audioSessionQueue.async { [self] in
            if audioManagerActivated {
                return
            }
            setup()
            DispatchQueue.main.async {
                // Enable wake lock to prevent the screen from dimming/locking during a call
                UIApplication.shared.isIdleTimerDisabled = true
                // Register for audio route changes to turn off screen when earpiece is connected
                self.registerAudioRouteObserver()
                self.updateProximityMonitoring()
                self.log("Wake lock enabled (idle timer disabled)")
                self.log("defaultAudioDevice: \(self.defaultAudioDevice)")
            }
            let session = RTCAudioSession.sharedInstance()
            session.lockForConfiguration()
            defer {
                session.unlockForConfiguration()
            }
            do {
                try session.setActive(true)
                self.log("audio session activated")
            } catch {
                log("Error activating audio session: \(error.localizedDescription)")
            }
            
            audioManagerActivated = true
        }
    }

    @objc
    func stop() {
        audioSessionQueue.async { [self] in
            if !audioManagerActivated {
                return
            }
            let session = RTCAudioSession.sharedInstance()
            session.lockForConfiguration()
            defer {
                session.unlockForConfiguration()
            }
            do {
                try session.setActive(false)
            } catch {
                log("Error deactivating audio session: \(error.localizedDescription)")
            }
            audioManagerActivated = false
        }
        // Cancel any pending debounced stereo refresh
        stereoRefreshWorkItem?.cancel()
        stereoRefreshWorkItem = nil
        // Disable wake lock and proximity when call manager stops so the device can sleep again
        DispatchQueue.main.async {
            // Disable proximity monitoring to disable earpiece detection
            self.setProximityMonitoringEnabled(false)
            self.unregisterAudioRouteObserver()
            // Disable wake lock to allow the screen to dim/lock again
            UIApplication.shared.isIdleTimerDisabled = false
            self.log("Wake lock disabled (idle timer enabled)")
        }
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
        audioSessionQueue.async { [weak self] in
            let session = AVAudioSession.sharedInstance()
            do {
                try session.overrideOutputAudioPort(enable ? .speaker : .none)
                try session.setActive(true)
            } catch {
                self?.log("Error setting speakerphone: \(error)")
            }
        }
    }


    @objc(setMicrophoneMute:)
    func setMicrophoneMute(enable: Bool) {
        log("iOS does not support setMicrophoneMute()")
    }

    @objc
    func logAudioState() {
        let session = AVAudioSession.sharedInstance()
        let adm = getAudioDeviceModule()
        
        // WebRTC wraps AVAudioSession with RTCAudioSession; log its state as well.
        let rtcSession = RTCAudioSession.sharedInstance()
        rtcSession.lockForConfiguration()
        defer {
            rtcSession.unlockForConfiguration()
        }

        let rtcAVSession = rtcSession.session
        let logString = """
        Audio State:
          Category: \(session.category.rawValue)
          Mode: \(session.mode.rawValue)
          Output Port: \(session.currentRoute.outputs.first?.portName ?? "N/A")
          Input Port: \(session.currentRoute.inputs.first?.portName ?? "N/A")
          Category Options: \(session.categoryOptions)
          InputNumberOfChannels: \(session.inputNumberOfChannels)
          OutputNumberOfChannels: \(session.outputNumberOfChannels)
          AdmIsPlaying: \(adm.isPlaying)
          AdmIsRecording: \(adm.isRecording)
        
        RTC Audio State:
          Wrapped Category: \(rtcAVSession.category.rawValue)
          Wrapped Mode: \(rtcAVSession.mode.rawValue)
          Wrapped Output Port: \(rtcAVSession.currentRoute.outputs.first?.portName ?? "N/A")
          Wrapped Input Port: \(rtcAVSession.currentRoute.inputs.first?.portName ?? "N/A")
          Wrapped Category Options: \(rtcAVSession.categoryOptions)
          UseManualAudio: \(rtcSession.useManualAudio)
          IsAudioEnabled: \(rtcSession.isAudioEnabled)
          IsActive: \(rtcSession.isActive)
          ActivationCount: \(rtcSession.activationCount)
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

    // MARK: - Proximity Handling
    private func registerAudioRouteObserver() {
        if hasRegisteredRouteObserver { return }
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleAudioRouteChange(_:)),
            name: AVAudioSession.routeChangeNotification,
            object: nil
        )
        hasRegisteredRouteObserver = true
        log("Registered AVAudioSession.routeChangeNotification observer")
    }

    private func unregisterAudioRouteObserver() {
        if !hasRegisteredRouteObserver { return }
        NotificationCenter.default.removeObserver(self, name: AVAudioSession.routeChangeNotification, object: nil)
        hasRegisteredRouteObserver = false
        log("Unregistered AVAudioSession.routeChangeNotification observer")
    }

    @objc
    private func handleAudioRouteChange(_ notification: Notification) {
        guard let userInfo = notification.userInfo,
              let reasonValue = userInfo[AVAudioSessionRouteChangeReasonKey] as? UInt,
              let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue) else {
            return
        }
        
        log("Audio route change reason: \(routeChangeReasonDescription(reason))")
        
        if reason == .routeConfigurationChange {
            // Cancel any pending debounced refresh
            stereoRefreshWorkItem?.cancel()
            // Create a new debounced work item
            let workItem = DispatchWorkItem { [weak self] in
                self?.getAudioDeviceModule().refreshStereoPlayoutState()
                self?.log("Executed debounced refreshStereoPlayoutState")
            }
            stereoRefreshWorkItem = workItem
            // Schedule the work item after 2 seconds
            audioSessionQueue.asyncAfter(deadline: .now() + 2.0, execute: workItem)
        }

        logAudioState()
        
        // Route changes can arrive on arbitrary queues; ensure UI-safe work on main
        DispatchQueue.main.async { [weak self] in
            self?.updateProximityMonitoring()
        }
    }

    private func updateProximityMonitoring() {
        // Proximity is only meaningful while a call is active
        guard audioManagerActivated else {
            setProximityMonitoringEnabled(false)
            return
        }
        let session = AVAudioSession.sharedInstance()
        let port = session.currentRoute.outputs.first?.portType
        let isEarpiece = (port == .builtInReceiver)
        setProximityMonitoringEnabled(isEarpiece)
    }

    private func setProximityMonitoringEnabled(_ enabled: Bool) {
        // Always toggle on the main thread
        if Thread.isMainThread {
            if UIDevice.current.isProximityMonitoringEnabled != enabled {
                UIDevice.current.isProximityMonitoringEnabled = enabled
                log("Proximity monitoring \(enabled ? "ENABLED" : "DISABLED")")
            }
        } else {
            DispatchQueue.main.async { [weak self] in
                self?.setProximityMonitoringEnabled(enabled)
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
    private func getAudioDeviceModule() -> AudioDeviceModule {
        let webrtcModule = self.bridge.module(forName: "WebRTCModule") as! WebRTCModule
        return webrtcModule.audioDeviceModule
    }

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

    private func routeChangeReasonDescription(_ reason: AVAudioSession.RouteChangeReason) -> String {
        switch reason {
        case .unknown:
            return "unknown"
        case .newDeviceAvailable:
            return "newDeviceAvailable"
        case .oldDeviceUnavailable:
            return "oldDeviceUnavailable"
        case .categoryChange:
            return "categoryChange"
        case .override:
            return "override"
        case .wakeFromSleep:
            return "wakeFromSleep"
        case .noSuitableRouteForCategory:
            return "noSuitableRouteForCategory"
        case .routeConfigurationChange:
            return "routeConfigurationChange"
        @unknown default:
            return "unknown(\(reason.rawValue))"
        }
    }

    // MARK: - Logging Helper
    private func log(_ message: String) {
        NSLog("InCallManager: %@", message)
    }

}
