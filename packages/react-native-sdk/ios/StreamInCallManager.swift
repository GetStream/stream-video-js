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

/// An explicit output route chosen via the device picker.
///
/// `nil` (no explicit pick) means the call uses the category-driven default
/// (`.defaultToSpeaker` when the default device is the speaker), which keeps the
/// default route headphone-aware. Once the user picks a device we drive the route
/// explicitly instead — `.defaultToSpeaker` is dropped so `overrideOutputAudioPort(.none)`
/// can reach the earpiece (with `.defaultToSpeaker` present it resolves to the speaker).
private enum OutputRouting {
    case speaker
    /// Built-in earpiece (the built-in mic uid), wired headset, or Bluetooth — all
    /// reached via `overrideOutputAudioPort(.none)` + `setPreferredInput(port)`.
    case input(uid: String)
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
    static let audioDeviceChanged = "onAudioDeviceChanged"
}

/// Stable device-id scheme for the JS layer. The built-in speaker is synthetic; every
/// other device is keyed by its `AVAudioSessionPortDescription.uid` (the
/// built-in earpiece is the built-in mic input routed with `.none`).
private enum AudioDeviceId {
    static let speaker = "speaker"
}

@objc(StreamInCallManager)
class StreamInCallManager: RCTEventEmitter {

    private let audioSessionQueue = DispatchQueue(label: "io.getstream.rn.audioSessionQueue")

    private var audioManagerActivated = false
    private var callAudioRole: CallAudioRole = .communicator
    private var defaultAudioDevice: DefaultAudioDevice = .speaker
    /// The user's explicit output pick, or `nil` to use the category default.
    /// Re-applied on every engine rebuild so the pick survives interruptions.
    private var selectedOutput: OutputRouting?
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
    private func makeAudioConfiguration(for routing: OutputRouting?) -> RTCAudioSessionConfiguration {
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
            
            var mustSetDefaultToSpeaker = defaultAudioDevice == .speaker
            if case .input(let uid) = routing, isBuiltInMicUid(uid) {
                // the selected output is a built-in mic
                // then we always can't use defaultToSpeaker
                mustSetDefaultToSpeaker = false
            }
            options = mustSetDefaultToSpeaker ? [bluetoothOption, .defaultToSpeaker] : [bluetoothOption]
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
            selectedOutput = nil

            if callAudioRole == .listener && enableStereo {
                adm.setStereoPlayoutPreference(true)
            }

            let rtcConfig = makeAudioConfiguration(for: selectedOutput)
            log("Setup with category: \(rtcConfig.category), mode: \(rtcConfig.mode), options: \(rtcConfig.categoryOptions)")

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

        let rtcConfig = makeAudioConfiguration(for: selectedOutput)
        let session = RTCAudioSession.sharedInstance()
        session.lockForConfiguration()
        defer { session.unlockForConfiguration() }
        do {
            try session.setConfiguration(rtcConfig, active: true)
            // Re-apply the explicit pick (if any) so it survives the engine rebuild.
            if let selectedOutput {
                try applyOutputRouting(selectedOutput)
            }
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

    private func clearOutputRouting() {
        if Self.callingxOwnsSession() {
            return
        }
        let session = RTCAudioSession.sharedInstance()
        session.lockForConfiguration()
        defer { session.unlockForConfiguration() }
        do {
            try session.overrideOutputAudioPort(.none)
            try AVAudioSession.sharedInstance().setPreferredInput(nil)
        } catch {
            log("clearOutputRouting error: \(String(describing: error))")
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
            clearOutputRouting()
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
            selectedOutput = nil
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
        audioSessionQueue.async { [self] in
            let session = RTCAudioSession.sharedInstance()
            session.lockForConfiguration()
            defer {
                session.unlockForConfiguration()
            }
            do {
                if enable {
                    try applyOutputRouting(.speaker)
                } else {
                    try session.overrideOutputAudioPort(.none)
                    try AVAudioSession.sharedInstance().setPreferredInput(nil)
                }
            } catch {
                self.log("Error setting speakerphone: \(error)")
            }
        }
    }


    @objc(setMicrophoneMute:)
    func setMicrophoneMute(enable: Bool) {
        log("iOS does not support setMicrophoneMute()")
    }

    // MARK: - Audio Device Picker

    @objc(getAudioDeviceStatus:reject:)
    func getAudioDeviceStatus(resolve: @escaping RCTPromiseResolveBlock,
                              reject: @escaping RCTPromiseRejectBlock) {
        audioSessionQueue.async { [weak self] in
            guard let self else {
                resolve(["devices": [], "currentEndpointType": "Unknown"])
                return
            }
            resolve(self.buildAudioDevicesState())
        }
    }

    /// Switches the audio output to the device with the given id.
    @objc(chooseAudioDeviceEndpoint:)
    func chooseAudioDeviceEndpoint(id: String) {
        audioSessionQueue.async { [self] in
            guard callAudioRole == .communicator else {
                log("chooseAudioDeviceEndpoint ignored: only supported in communicator role")
                return
            }

            let routing: OutputRouting = id == AudioDeviceId.speaker ? .speaker : .input(uid: id)

            let session = RTCAudioSession.sharedInstance()
            session.lockForConfiguration()
            defer { session.unlockForConfiguration() }
            do {
                // Reconfigure first so the live category matches the pick (e.g. the earpiece
                // drops `.defaultToSpeaker`, otherwise overrideOutputAudioPort(.none) would
                // resolve back to the speaker). Then drive the route.
                try session.setConfiguration(makeAudioConfiguration(for: routing))
                try applyOutputRouting(routing)
                selectedOutput = routing
            } catch {
                // a failure leaves the previous route intact.
                log("chooseAudioDeviceEndpoint error: \(String(describing: error))")
            }
        }
    }

    /// Re-applies the current output pick (`selectedOutput`) — category untouched, no setActive.
    /// Called on interruption-end (via callingx's interruption event, forwarded from JS) to
    /// restore a Bluetooth/wired route
    @objc(reapplyAudioRoute)
    func reapplyAudioRoute() {
        audioSessionQueue.async { [self] in
            guard callAudioRole == .communicator, let routing = selectedOutput else { return }
            let session = RTCAudioSession.sharedInstance()
            session.lockForConfiguration()
            defer { session.unlockForConfiguration() }
            do {
                try applyOutputRouting(routing)
            } catch {
                log("reapplyAudioRoute error: \(String(describing: error))")
            }
        }
    }

    /// Whether `uid` is the built-in microphone (i.e. an earpiece pick, in our id scheme).
    private func isBuiltInMicUid(_ uid: String) -> Bool {
        AVAudioSession.sharedInstance().availableInputs?
            .contains { $0.uid == uid && $0.portType == .builtInMic } ?? false
    }

    /// Drives the audio route. Throws if a session command fails, so callers can gate
    /// committed state (e.g. `selectedOutput`) on the route actually being applied.
    private func applyOutputRouting(_ routing: OutputRouting) throws {
        let rtcSession = RTCAudioSession.sharedInstance()
        let availableInputs = AVAudioSession.sharedInstance().availableInputs
        switch routing {
            case .speaker:
                if let builtInMic = availableInputs?.first(where: { $0.portType == .builtInMic }) {
                    try rtcSession.setPreferredInput(builtInMic)
                }
                try rtcSession.overrideOutputAudioPort(.speaker)
            case .input(let uid):
                try rtcSession.overrideOutputAudioPort(.none)
                if let port = availableInputs?.first(where: { $0.uid == uid }) {
                    try rtcSession.setPreferredInput(port)
                } else {
                    log("applyOutputRouting: no input found for id \(uid)")
                }
        }
    }

    /// Canonical endpoint-type string shared with the JS layer.M ust match with the Android implementation.
    private func endpointType(for portType: AVAudioSession.Port) -> String {
        switch portType {
        case .builtInSpeaker: return "Speaker"
        case .builtInMic, .builtInReceiver: return "Earpiece"
        case .headphones, .headsetMic: return "Wired Headset"
        case .bluetoothA2DP, .bluetoothHFP, .bluetoothLE, .carAudio: return "Bluetooth Device"
        default: return "Unknown"
        }
    }

    private func hasExternalAudioDevice(_ session: AVAudioSession) -> Bool {
        let external: Set<AVAudioSession.Port> = [
            .headphones, .headsetMic, .bluetoothHFP, .bluetoothA2DP, .bluetoothLE, .carAudio,
        ]
        if session.availableInputs?.contains(where: { external.contains($0.portType) }) == true {
            return true
        }
        return session.currentRoute.outputs.contains { external.contains($0.portType) }
    }

    private func buildAudioDevicesState() -> [String: Any] {
        let session = AVAudioSession.sharedInstance()
        let inputs = session.availableInputs ?? []
        let hasExternal = hasExternalAudioDevice(session)

        var devices: [[String: String]] = [
            ["id": AudioDeviceId.speaker, "name": "Speaker", "type": "Speaker"]
        ]
        for port in inputs {
            let isBuiltInMic = port.portType == .builtInMic
            // Hide the earpiece when a wired/BT device is present — it can't be routed to
            // while one is connected, so listing it would be a dead, duplicate option.
            if isBuiltInMic && hasExternal { continue }
            devices.append([
                "id": port.uid,
                "name": isBuiltInMic ? "Earpiece" : port.portName,
                "type": endpointType(for: port.portType),
            ])
        }

        let output = session.currentRoute.outputs.first
        let currentEndpointType = output.map { endpointType(for: $0.portType) } ?? "Unknown"

        // Output-only routes (e.g. wired headphones without a mic) never appear in
        // availableInputs. Add the active output when no listed device already represents
        // its endpoint type, so it stays visible and selectable in the picker.
        if let output,
           output.portType != .builtInSpeaker,
           !devices.contains(where: { $0["type"] == currentEndpointType }) {
            devices.append([
                "id": output.uid,
                "name": output.portName,
                "type": currentEndpointType,
            ])
        }

        let selectedDeviceId: String?
        if output?.portType == .builtInSpeaker {
            selectedDeviceId = AudioDeviceId.speaker
        } else if let inputUid = session.currentRoute.inputs.first?.uid,
                  devices.contains(where: { $0["id"] == inputUid }) {
            // The active input maps to a listed device (earpiece / wired / BT).
            selectedDeviceId = inputUid
        } else {
            // Output is on a device whose active input differs from a listed one — e.g. BT is
            // the output while the input stayed built-in mic. Match by the output's endpoint
            // type so the picker highlights the actual output (not the earpiece).
            selectedDeviceId = devices.first(where: { $0["type"] == currentEndpointType })?["id"]
        }

        var result: [String: Any] = [
            "devices": devices,
            "currentEndpointType": currentEndpointType,
        ]
        if let selectedDeviceId {
            result["selectedDeviceId"] = selectedDeviceId
        }
        return result
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

        // Notify JS of the updated device list / selection.
        audioSessionQueue.async { [weak self] in
            guard let self,
                  self.audioManagerActivated,
                  self.callAudioRole == .communicator,
                  !Self.callingxOwnsSession() else { return }
            self.sendEvent(
                withName: StreamInCallManagerEvents.audioDeviceChanged,
                body: self.buildAudioDevicesState()
            )
        }

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
        return [
            StreamInCallManagerEvents.audioInterruption,
            StreamInCallManagerEvents.audioDeviceChanged,
        ]
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
