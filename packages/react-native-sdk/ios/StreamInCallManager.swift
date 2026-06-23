import Foundation
import React
import UIKit
import AVFoundation
import Combine
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

private enum Constants {
    /// Debounce interval for refreshing stereo playout state after audio route changes.
    ///
    /// When audio routes change rapidly (e.g., connecting/disconnecting Bluetooth devices),
    /// iOS can fire multiple `routeConfigurationChange` notifications in quick succession.
    /// This debounce prevents excessive calls to `refreshStereoPlayoutState()` which can
    /// cause audio glitches or unnecessary reconfiguration overhead.
    ///
    /// 500ms provides a good balance: long enough to coalesce rapid route change events,
    /// but short enough that users won't perceive a delay when switching audio devices.
    static let stereoRefreshDebounceSeconds: TimeInterval = 0.5
}

private enum StreamInCallManagerEvents {
    static let audioInterruption = "StreamInCallManagerAudioInterruption"
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
    private var hasRegisteredInterruptionObserver = false
    private var stereoRefreshWorkItem: DispatchWorkItem?
    /// Combine subscription to the AudioDeviceModule's engine-lifecycle publisher.
    /// Wired in `setup()`; torn down in `stop()`.
    private var engineSubscription: AnyCancellable?

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
    
    /// Builds the audio config for the current role/device and sets it as WebRTC's default.
    private func makeAudioConfiguration() -> RTCAudioSessionConfiguration {
        let category: AVAudioSession.Category
        let mode: AVAudioSession.Mode
        let options: AVAudioSession.CategoryOptions

        if callAudioRole == .listener {
            // High quality audio playback, microphone disabled.
            // .spokenAudio + .mixWithOthers: listener flow is passive spoken-audio
            // playback, so let other apps' audio coexist (music keeps playing under it)
            // and let the system handle ducking semantics for spoken content.
            category = .playback
            mode = .spokenAudio
            options = [.mixWithOthers]
            // TODO: for stereo we should disallow BluetoothHFP and allow only allowBluetoothA2DP
            // note: this is the behaviour of iOS native SDK, but fails here with (OSStatus error -50.)
            // options = self.enableStereo ? [.allowBluetoothA2DP] : []
        } else if !micPermissionGranted() {
            // Communicator without mic permission (denied or not yet asked): use a
            // pure-output, no-VPIO session so the output-only AVAudioEngine renders
            // remote audio. Mirrors stream-video-swift
            // (isRecordingEnabled ? .playAndRecord : .playback). We can't record anyway.
            // Self-heals: granting permission + unmuting rebuilds the engine.
            // Known gap: .playback can't route to the receiver (earpiece) — that route
            // only exists under .playAndRecord.
            category = .playback
            mode = .spokenAudio
            options = []
        } else {
            // XCode 16 and older don't expose .allowBluetoothHFP
            // https://forums.swift.org/t/xcode-26-avaudiosession-categoryoptions-allowbluetooth-deprecated/80956
            #if compiler(>=6.2) // For Xcode 26.0+
                let bluetoothOption: AVAudioSession.CategoryOptions = .allowBluetoothHFP
            #else
                let bluetoothOption: AVAudioSession.CategoryOptions = .allowBluetooth
            #endif
            category = .playAndRecord
            mode = .voiceChat
            options = defaultAudioDevice == .speaker ? [bluetoothOption, .defaultToSpeaker] : [bluetoothOption]
        }

        let rtcConfig = RTCAudioSessionConfiguration.webRTC()
        rtcConfig.category = category.rawValue
        rtcConfig.mode = mode.rawValue
        rtcConfig.categoryOptions = options
        // Keep WebRTC's internal state consistent during interruptions/route changes.
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

    @objc
    func setup() {
        audioSessionQueue.async { [self] in
            let adm = getAudioDeviceModule()

            // Stereo is listener-only and applies live. Cleared by stop()'s reset().
            if callAudioRole == .listener && enableStereo {
                adm.setStereoPlayoutPreference(true)
            }

            let rtcConfig = makeAudioConfiguration()
            log("Setup with category: \(rtcConfig.category), mode: \(rtcConfig.mode), options: \(rtcConfig.categoryOptions)")

            // Set category only — the sink owns setActive().
            let session = RTCAudioSession.sharedInstance()
            session.lockForConfiguration()
            defer { session.unlockForConfiguration() }
            do {
                try session.setConfiguration(rtcConfig)
            } catch {
                // String(describing:) shows the real error; localizedDescription prints a useless "error 0".
                log("Error setting audio session: \(String(describing: error))")
            }

            // Subscribe to the AudioDeviceModule's engine lifecycle (idempotent).
            // The sink does the authoritative reapply on every engine rebuild
            // (interruption recovery, mode swap) and owns `setActive(true/false)`
            // since there's no CallKit on this path.
            // Skipped when callingx owns the session (CallKit-managed call active).
            if engineSubscription == nil {
                #if DEBUG
                NSLog("%@","[StreamInCallManager][wireEngineSubscription]")
                #endif
                engineSubscription = adm.publisher.sink { [weak self] event in
                    guard let self else { return }
                    self.audioSessionQueue.async {
                        switch event {
                        case .willEnableAudioEngine:
                            self.applyConfigForEngineEnable()
                        case .didDisableAudioEngine:
                            self.applyConfigForEngineDisable()
                        default:
                            // .willStartAudioEngine / .didStopAudioEngine intentionally ignored:
                            // WebRTC's engine stop/restart around interruptions — it re-activates the
                            // session itself via AVAudioEngine.start(). We only (re)apply config +
                            // setActive on enable/disable.
                            break
                        }
                    }
                }
            }
        }
    }

    // MARK: - Engine Lifecycle Handlers (non-CallKit path)

    /// Reapplies the same `AVAudioSessionConfiguration` that `setup()` writes
    /// on every engine rebuild, then activates the session.
    /// No-ops when callingx owns the session.
    private func applyConfigForEngineEnable() {
        if Self.callingxOwnsSession() {
            log("engineWillEnable: callingx owns the session, skipping")
            return
        }

        let rtcConfig = makeAudioConfiguration()
        let session = RTCAudioSession.sharedInstance()
        session.lockForConfiguration()
        defer { session.unlockForConfiguration() }
        do {
            try session.setConfiguration(rtcConfig)
            try session.setActive(true)
            log("engineWillEnable: applied category=\(rtcConfig.category) mode=\(rtcConfig.mode) activated=true")
        } catch {
            log("engineWillEnable error: \(String(describing: error))")
        }
    }

    private func applyConfigForEngineDisable() {
        if Self.callingxOwnsSession() {
            return
        }

        let session = RTCAudioSession.sharedInstance()
        session.lockForConfiguration()
        defer { session.unlockForConfiguration() }
        do {
            try session.setActive(false)
            log("engineDidDisable: deactivated session")
        } catch {
            log("engineDidDisable error: \(String(describing: error))")
        }
    }

    /// Runtime KVC lookup of `CallingxSessionOwnership.callingxOwnsSession`.
    /// `@stream-io/react-native-callingx` is an optional peer dep, so a direct
    /// Swift `import` is not safe
    private static func callingxOwnsSession() -> Bool {
        guard let cls = NSClassFromString("Callingx.CallingxSessionOwnership") else {
            return false
        }
        return ((cls as AnyObject).value(forKey: "callingxOwnsSession") as? Bool) ?? false
    }

    @objc
    func start() {
        setup()
        audioSessionQueue.async { [self] in
            if audioManagerActivated {
                return
            }
            DispatchQueue.main.async {
                // Enable wake lock to prevent the screen from dimming/locking during a call
                UIApplication.shared.isIdleTimerDisabled = true
                // Register for audio route changes to turn off screen when earpiece is connected
                self.registerAudioRouteObserver()
                self.registerInterruptionObserver()
                self.updateProximityMonitoring()
                self.log("Wake lock enabled (idle timer disabled)")
                self.log("defaultAudioDevice: \(self.defaultAudioDevice)")
            }
            // setPlayout(true) triggers .willEnableAudioEngine, whose sink
            // applies the preset and calls setActive(true). No explicit
            // session.setActive(true) here.
            do {
                let adm = getAudioDeviceModule()
                try adm.setPlayout(true)
                self.log("adm.setPlayout(true) done")
            } catch {
                // String(describing:) surfaces the real error code (see setup()).
                log("Error starting playout: \(String(describing: error))")
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
            let adm = getAudioDeviceModule()
            adm.reset()
            // Deactivate directly: the .didDisableAudioEngine sink is async and we cancel it below.
            applyConfigForEngineDisable()
            // Tear down the engine-observer subscription so a re-setup wires a fresh one.
            engineSubscription?.cancel()
            engineSubscription = nil
            // Cancel any pending debounced stereo refresh
            stereoRefreshWorkItem?.cancel()
            stereoRefreshWorkItem = nil
            callAudioRole = .communicator
            defaultAudioDevice = .speaker
            enableStereo = false
            audioManagerActivated = false
        }
        // Disable wake lock and proximity when call manager stops so the device can sleep again
        DispatchQueue.main.async {
            // Disable proximity monitoring to disable earpiece detection
            self.setProximityMonitoringEnabled(false)
            self.unregisterAudioRouteObserver()
            self.unregisterInterruptionObserver()
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
            let session = RTCAudioSession.sharedInstance()
            session.lockForConfiguration()
            defer {
                session.unlockForConfiguration()
            }
            let avAudioSession = AVAudioSession.sharedInstance()
            do {
                try avAudioSession.overrideOutputAudioPort(enable ? .speaker : .none)
                try avAudioSession.setActive(true)
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
        log(getAudioStateLog())
    }
    
    @objc(getAudioStateLog)
    func getAudioStateLog() -> String {
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
        AVAudioSession State:
          Category: \(session.category.rawValue)
          Mode: \(session.mode.rawValue)
          Output Port: \(session.currentRoute.outputs.first?.portName ?? "N/A")
          Input Port: \(session.currentRoute.inputs.first?.portName ?? "N/A")
          Category Options: \(session.categoryOptions)
          InputNumberOfChannels: \(session.inputNumberOfChannels)
          OutputNumberOfChannels: \(session.outputNumberOfChannels)

        AudioDeviceModule State:
          IsPlaying: \(adm.isPlaying)
          IsRecording: \(adm.isRecording)
          IsVoiceProcessingAGCEnabled: \(adm.isVoiceProcessingAGCEnabled)
          IsVoiceProcessingBypassed: \(adm.isVoiceProcessingBypassed)
          IsVoiceProcessingEnabled: \(adm.isVoiceProcessingEnabled)
          IsStereoPlayoutEnabled: \(adm.isStereoPlayoutEnabled)
        
        RTCAudioSession State:
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
        return logString
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

    // MARK: - Interruption Handling

    /// Observes `AVAudioSession.interruptionNotification` to trace and log *why* an interruption fired
    /// (mic-mute / route-disconnect / PSTN-Siri). Recovery is NOT done here: WebRTC's
    /// AudioEngineDevice owns it — it stops the engine on interruption-begin and restarts it on
    /// interruption-end (re-activating the session itself via AVAudioEngine.start)
    private func registerInterruptionObserver() {
        if hasRegisteredInterruptionObserver { return }
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleAudioInterruption(_:)),
            name: AVAudioSession.interruptionNotification,
            object: nil
        )
        hasRegisteredInterruptionObserver = true
    }

    private func unregisterInterruptionObserver() {
        if !hasRegisteredInterruptionObserver { return }
        NotificationCenter.default.removeObserver(self, name: AVAudioSession.interruptionNotification, object: nil)
        hasRegisteredInterruptionObserver = false
    }

    @objc
    private func handleAudioInterruption(_ notification: Notification) {
        guard let info = notification.userInfo,
              let typeRaw = info[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeRaw) else {
            return
        }

        let reason = interruptionReason(info)
        var payload: [String: Any] = ["source": "callmanager"]
        if let reason {
            payload["reason"] = reason
        }

        switch type {
        case .began:
            payload["phase"] = "began"
            sendEvent(withName: StreamInCallManagerEvents.audioInterruption, body: payload)
            #if DEBUG
            log("Audio interruption began (reason=\(reason ?? "n/a")). Recovery owned by WebRTC AudioEngineDevice.")
            #endif
        case .ended:
            var shouldResume = false
            if let optsRaw = info[AVAudioSessionInterruptionOptionKey] as? UInt {
                shouldResume = AVAudioSession.InterruptionOptions(rawValue: optsRaw).contains(.shouldResume)
            }
            payload["phase"] = "ended"
            payload["shouldResume"] = shouldResume
            sendEvent(withName: StreamInCallManagerEvents.audioInterruption, body: payload)
            #if DEBUG
            log("Audio interruption ended (shouldResume=\(shouldResume)). WebRTC restarts the engine.")
            #endif
        @unknown default:
            break
        }
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
            audioSessionQueue.async { [weak self] in
                guard let self else { return }
                // Cancel any pending debounced refresh
                stereoRefreshWorkItem?.cancel()
                // Create a new debounced work item
                let workItem = DispatchWorkItem { [weak self] in
                    self?.getAudioDeviceModule().refreshStereoPlayoutState()
                    self?.log("Executed debounced refreshStereoPlayoutState")
                }
                stereoRefreshWorkItem = workItem
                // Schedule the work item after debounce interval
                audioSessionQueue.asyncAfter(deadline: .now() + Constants.stereoRefreshDebounceSeconds, execute: workItem)
            }
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
        return [StreamInCallManagerEvents.audioInterruption]
    }

    // MARK: - Helper Methods
    private func getAudioDeviceModule() -> AudioDeviceModule {
        guard let webrtcModule = moduleRegistry?.module(forName: "WebRTCModule") as? WebRTCModule else {
            fatalError("WebRTCModule is required but not registered with the module registry")
        }

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

    /// Best-effort name for the iOS 14.5+ `AVAudioSessionInterruptionReasonKey`.
    /// Names the iOS 17 cases we care about and falls back to the raw value otherwise.
    private func interruptionReason(_ info: [AnyHashable: Any]) -> String? {
        guard #available(iOS 14.5, *),
              let reasonRaw = info[AVAudioSessionInterruptionReasonKey] as? UInt,
              let reason = AVAudioSession.InterruptionReason(rawValue: reasonRaw) else {
            return nil
        }
        if #available(iOS 17.0, *) {
            switch reason {
            case .builtInMicMuted:
                return "builtInMicMuted"
            case .routeDisconnected:
                return "routeDisconnected"
            default:
                break
            }
        }
        if reason == .default {
            return "default"
        }
        return "raw(\(reason.rawValue))"
    }

    // MARK: - Logging Helper
    private func log(_ message: String) {
        NSLog("InCallManager: %@", message)
    }

}
