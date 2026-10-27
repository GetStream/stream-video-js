import Foundation
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

/// Implemented by the `StreamInCallManagerModule` TurboModule adapter, which forwards
/// to the codegen `emitOn*` emitters.
@objc public protocol StreamInCallManagerEventEmitter: AnyObject {
    func emitAudioDeviceChanged(_ payload: [String: Any])
    func emitAudioInterruption(_ payload: [String: Any])
    func emitAudioSessionDiagnostic(_ payload: [String: Any])
}

/// Stable device-id scheme for the JS layer. The built-in speaker is synthetic; every
/// other device is keyed by its `AVAudioSessionPortDescription.uid` (the
/// built-in earpiece is the built-in mic input routed with `.none`).
private enum AudioDeviceId {
    static let speaker = "speaker"
}

@objc public class StreamInCallManagerImpl: NSObject {

    /// The TurboModule adapter; events are dropped when it is gone.
    @objc public weak var eventEmitter: StreamInCallManagerEventEmitter?
    /// Resolves the live `WebRTCModule` through the adapter's module registry.
    @objc public var webRTCModuleProvider: (() -> WebRTCModule?)?

    private let audioSessionQueue = DispatchQueue(label: "io.getstream.rn.audioSessionQueue")

    private var audioManagerActivated = false
    /// `start()` could not activate (no ADM or `setPlayout` threw); `waitForAudioSessionActive`
    /// resolves at once instead of polling. Only touched on `audioSessionQueue`.
    private var startFailed = false

    /// Inputs of the session config. Written on `audioSessionQueue`, read by the engine hooks on the
    /// WebRTC worker thread, so guarded by `configInputsLock`.
    private struct ConfigInputs {
        var callAudioRole: CallAudioRole = .communicator
        var defaultAudioDevice: DefaultAudioDevice = .speaker
        /// The user's explicit output pick, or `nil` to use the category default.
        /// Re-applied on every engine rebuild so the pick survives interruptions.
        var selectedOutput: OutputRouting?
    }
    private let configInputsLock = NSLock()
    private var configInputs = ConfigInputs()

    private var callAudioRole: CallAudioRole {
        get { configInputsSnapshot().callAudioRole }
        set { updateConfigInputs { $0.callAudioRole = newValue } }
    }
    private var defaultAudioDevice: DefaultAudioDevice {
        get { configInputsSnapshot().defaultAudioDevice }
        set { updateConfigInputs { $0.defaultAudioDevice = newValue } }
    }
    private var selectedOutput: OutputRouting? {
        get { configInputsSnapshot().selectedOutput }
        set { updateConfigInputs { $0.selectedOutput = newValue } }
    }

    /// Whether we hold an `RTCAudioSession` activation (activations are counted). Only read/written
    /// inside `AudioSessionConfigLock.run`.
    private var weActivatedSession = false
    /// Token of the process-wide ADM engine hooks; removed in `invalidate()`.
    private var engineHooksToken: NSObject?

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

    private let soundPlayer = SoundPlayer()

    override public init() {
        super.init()
        // Process-wide (every per-call ADM), run synchronously on the WebRTC worker thread.
        engineHooksToken = AudioDeviceModule.addEngineHooks(
            willEnable: { [weak self] isPlayoutEnabled, isRecordingEnabled in
                self?.handleEngineWillEnable(isPlayoutEnabled: isPlayoutEnabled, isRecordingEnabled: isRecordingEnabled) ?? 0
            },
            didDisable: { [weak self] isPlayoutEnabled, isRecordingEnabled in
                self?.handleEngineDidDisable(isPlayoutEnabled: isPlayoutEnabled, isRecordingEnabled: isRecordingEnabled)
            }
        )
    }

    @objc public func invalidate() {
        if let engineHooksToken {
            AudioDeviceModule.removeEngineHooks(engineHooksToken)
            self.engineHooksToken = nil
        }
        stopSound()
        stop()
    }

    private func configInputsSnapshot() -> ConfigInputs {
        configInputsLock.lock()
        defer { configInputsLock.unlock() }
        return configInputs
    }

    private func updateConfigInputs(_ update: (inout ConfigInputs) -> Void) {
        configInputsLock.lock()
        defer { configInputsLock.unlock() }
        update(&configInputs)
    }

    @objc(setAudioRole:)
    public func setAudioRole(audioRole: String) {
        audioSessionQueue.async { [self] in
            if audioManagerActivated {
                log("AudioManager is already activated, audio role cannot be changed.")
                return
            }
            self.callAudioRole = audioRole.lowercased() == "listener" ? .listener : .communicator
        }
    }

    @objc(setDefaultAudioDeviceEndpointType:)
    public func setDefaultAudioDeviceEndpointType(endpointType: String) {
        audioSessionQueue.async { [self] in
            if audioManagerActivated {
                log("AudioManager is already activated, default audio device cannot be changed.")
                return
            }
            self.defaultAudioDevice = endpointType.lowercased() == "earpiece" ? .earpiece : .speaker
        }
    }
    
    @objc(setEnableStereoAudioOutput:)
    public func setEnableStereoAudioOutput(enabled: Bool) {
        audioSessionQueue.async { [self] in
            if audioManagerActivated {
                log("AudioManager is already activated, enable stereo audio output cannot be changed.")
                return
            }
            self.enableStereo = enabled
        }
    }

    @objc(setMuteMode:)
    public func setMuteMode(mode: Int) {
        audioSessionQueue.async { [self] in
            guard let adm = getAudioDeviceModule() else {
                log("setMuteMode(\(mode)) skipped: no live call ADM")
                return
            }
            let muteMode = RTCAudioEngineMuteMode(rawValue: mode) ?? .voiceProcessing
            let result = adm.setMuteMode(muteMode)
            if result != 0 {
                log("setMuteMode(\(mode)) failed: \(result)")
                sendAudioSessionDiagnostic("setMuteModeError", extra: ["muteMode": mode, "result": result], includeSession: false)
            }
        }
    }

    @objc(setRecordingAlwaysPreparedMode:)
    public func setRecordingAlwaysPreparedMode(enabled: Bool) {
        audioSessionQueue.async { [self] in
            guard let adm = getAudioDeviceModule() else {
                log("setRecordingAlwaysPreparedMode(\(enabled)) skipped: no live call ADM")
                return
            }
            let result = adm.setRecordingAlwaysPreparedMode(enabled)
            if result != 0 {
                log("setRecordingAlwaysPreparedMode(\(enabled)) failed: \(result)")
                sendAudioSessionDiagnostic("setRecordingAlwaysPreparedModeError", extra: ["enabled": enabled, "result": result], includeSession: false)
            }
        }
    }

    /// Builds the audio config for the given role/device and sets it as WebRTC's default.
    /// - Parameters:
    ///   - isRecordingEnabled: whether the engine being enabled records (`false` outside the hook).
    ///   - currentCategory: the live `RTCAudioSession.category`, so an output-only enable never
    ///     downgrades a `.playAndRecord` session.
    private func makeAudioConfiguration(
        inputs: ConfigInputs,
        routing: OutputRouting?,
        isRecordingEnabled: Bool,
        currentCategory: String
    ) -> RTCAudioSessionConfiguration {
        let category: AVAudioSession.Category
        let mode: AVAudioSession.Mode
        let options: AVAudioSession.CategoryOptions
        let wantsPlayAndRecord = isRecordingEnabled
            || micPermissionGranted()
            || currentCategory == AVAudioSession.Category.playAndRecord.rawValue

        if inputs.callAudioRole == .listener {
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
        } else if !wantsPlayAndRecord {
            // Communicator without mic permission (denied or not yet asked) and nothing
            // recording yet: an output-only engine under .playAndRecord/.voiceChat (VPIO)
            // can render no remote audio. With the mic permission we keep the input chain
            // prepared (always-prepared mode) to avoid that; without it we can't, so use a
            // pure-output, no-VPIO .playback session to keep remote audio audible.
            // Not self-healing on its own: a later recording enable (mic published after
            // the grant) runs the willEnable hook with isRecordingEnabled=true, which
            // upgrades to .playAndRecord before the engine starts. Once in .playAndRecord we
            // stay there: the speaker-only fallback enables with isRecordingEnabled=false and
            // must not downgrade the session mid-call.
            // Known gap: .playback can't route to the receiver (earpiece) — that route
            // only exists under .playAndRecord.
            category = .playback
            mode = .spokenAudio
            options = [.mixWithOthers]
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
            
            var mustSetDefaultToSpeaker = inputs.defaultAudioDevice == .speaker
            if case .input(let uid) = routing, isBuiltInMicUid(uid) {
                // the selected output is a built-in mic
                // then we always can't use defaultToSpeaker
                mustSetDefaultToSpeaker = false
            }
            options = mustSetDefaultToSpeaker ? [bluetoothOption, .defaultToSpeaker, .mixWithOthers] : [bluetoothOption, .mixWithOthers]
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

    /// `granted` / `denied` / `undetermined`; anything but `granted` selects the `.playback` session.
    private func micPermissionState() -> String {
        if #available(iOS 17.0, *) {
            switch AVAudioApplication.shared.recordPermission {
            case .granted: return "granted"
            case .denied: return "denied"
            case .undetermined: return "undetermined"
            @unknown default: return "unknown"
            }
        } else {
            switch AVAudioSession.sharedInstance().recordPermission {
            case .granted: return "granted"
            case .denied: return "denied"
            case .undetermined: return "undetermined"
            @unknown default: return "unknown"
            }
        }
    }

    @objc
    public func setup() {
        audioSessionQueue.async { [self] in
            let adm = getAudioDeviceModule()
            // A repeated start() (join prepare, then the join-time start) keeps a user-picked route.
            if !audioManagerActivated {
                selectedOutput = nil
            }

            // This path (no system call UI) owns audio-session activation itself, so the
            // engine must be allowed to start. Restores availability in case a
            // prior system call had gated it off. Skipped while callingx owns the session:
            // its engine stays gated until CallKit's didActivate.
            if !Self.callingxOwnsSession() {
                _ = adm?.setEngineAvailability(.default)
            }

            // Stereo is listener-only and applies live. Cleared by stop()'s reset().
            if callAudioRole == .listener && enableStereo {
                adm?.setStereoPlayoutPreference(true)
            }

            let inputs = configInputsSnapshot()
            do {
                let rtcConfig = try AudioSessionConfigLock.run { session in
                    let rtcConfig = makeAudioConfiguration(
                        inputs: inputs,
                        routing: inputs.selectedOutput,
                        isRecordingEnabled: false,
                        currentCategory: session.category
                    )
                    try session.setConfiguration(rtcConfig)
                    return rtcConfig
                }
                log("Setup with category: \(rtcConfig.category), mode: \(rtcConfig.mode), options: \(rtcConfig.categoryOptions)")
            } catch {
                // String(describing:) shows the real error; localizedDescription prints a useless "error 0".
                log("Error setting audio session: \(String(describing: error))")
                sendAudioSessionDiagnostic("setupError", error: error)
            }
        }
    }

    // MARK: - Engine Hooks (non-callingx path)

    /// `AudioDeviceModule` willEnable hook: runs synchronously on the WebRTC worker thread on an
    /// enable edge only (input or output being enabled: initial enable, voice-processing retries,
    /// speaker-only fallback), so the session is configured and active before that engine starts.
    /// Not run for rebuilds without an enable edge (device change, stop recording with playout on,
    /// interruption-end restart). Idempotent and cheap.
    /// Must not touch `audioSessionQueue`, the main queue (sync) or ADM APIs.
    /// Non-zero fails the enable (configuration/activation errors only), so WebRTC rolls it back
    /// instead of starting a broken engine. A routing re-apply failure is logged and never fails
    /// the enable: WebRTC does not retry, so it would kill every voice-processing/speaker fallback.
    private func handleEngineWillEnable(isPlayoutEnabled: Bool, isRecordingEnabled: Bool) -> Int {
        if Self.callingxOwnsSession() {
            return 0
        }

        let inputs = configInputsSnapshot()
        do {
            let (rtcConfig, activated, routingError) = try AudioSessionConfigLock.run { session in
                let rtcConfig = makeAudioConfiguration(
                    inputs: inputs,
                    routing: inputs.selectedOutput,
                    isRecordingEnabled: isRecordingEnabled,
                    currentCategory: session.category
                )
                if session.category != rtcConfig.category
                    || session.mode != rtcConfig.mode
                    || session.categoryOptions != rtcConfig.categoryOptions {
                    try session.setConfiguration(rtcConfig)
                }
                var activated = false
                if !weActivatedSession {
                    try session.setActive(true)
                    weActivatedSession = true
                    activated = true
                }
                // Re-apply the explicit pick (if any) so it survives the engine rebuild.
                var routingError: Error?
                if let selectedOutput = inputs.selectedOutput {
                    do {
                        try applyOutputRouting(selectedOutput)
                    } catch {
                        log("engineWillEnable routing error: \(String(describing: error))")
                        routingError = error
                    }
                }
                return (rtcConfig, activated, routingError)
            }
            log("engineWillEnable: applied category=\(rtcConfig.category) mode=\(rtcConfig.mode) activated=\(activated) playout=\(isPlayoutEnabled) recording=\(isRecordingEnabled)")
            let extra: [String: Any] = routingError.map {
                ["routingError": String(String(describing: $0).prefix(200))]
            } ?? [:]
            DispatchQueue.main.async { [weak self] in
                self?.sendAudioSessionDiagnostic("engineEnableApplied", extra: extra)
            }
            return 0
        } catch {
            log("engineWillEnable error: \(String(describing: error))")
            DispatchQueue.main.async { [weak self] in
                self?.sendAudioSessionDiagnostic("engineEnableError", error: error)
            }
            return -4100
        }
    }

    /// `AudioDeviceModule` didDisable hook (WebRTC worker thread). Flags are the state after
    /// the disable: deactivate only on a full stop, never on a mic off → on toggle.
    private func handleEngineDidDisable(isPlayoutEnabled: Bool, isRecordingEnabled: Bool) {
        guard !isPlayoutEnabled && !isRecordingEnabled else { return }
        deactivateSessionIfNeeded(source: "engineDidDisable")
    }

    /// Releases our session activation, if we hold one. Idempotent; never throws.
    /// Runs even when callingx owns the session: ownership can flip to callingx mid-call after
    /// we activated, and skipping would leak our activation. CallKit's own activation also
    /// counts in RTCAudioSession, so our `setActive(false)` only decrements the count and never
    /// really deactivates a CallKit-owned session.
    private func deactivateSessionIfNeeded(source: String) {
        AudioSessionConfigLock.run { session in
            guard weActivatedSession else { return }
            // RTCAudioSession decrements its activation count even when deactivation fails.
            weActivatedSession = false
            do {
                try session.setActive(false)
                log("\(source): deactivated session")
            } catch {
                log("\(source) deactivate error: \(String(describing: error))")
            }
        }
    }

    private func clearOutputRouting() {
        if Self.callingxOwnsSession() {
            return
        }
        AudioSessionConfigLock.run { session in
            do {
                try session.overrideOutputAudioPort(.none)
                try AVAudioSession.sharedInstance().setPreferredInput(nil)
            } catch {
                log("clearOutputRouting error: \(String(describing: error))")
            }
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
    public func start() {
        setup()
        audioSessionQueue.async { [self] in
            if audioManagerActivated {
                return
            }
            startFailed = false
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
            // setPlayout(true) runs the willEnable hook, which synchronously applies the
            // preset and calls setActive(true). No explicit session.setActive(true) here.
            if let adm = getAudioDeviceModule() {
                do {
                    try adm.setPlayout(true)
                    self.log("adm.setPlayout(true) done")
                } catch {
                    // String(describing:) surfaces the real error code (see setup()).
                    log("Error starting playout: \(String(describing: error))")
                    sendAudioSessionDiagnostic("startPlayoutError", error: error)
                    startFailed = true
                }
            } else {
                log("start: no audio device module, playout not started")
                startFailed = true
            }

            audioManagerActivated = true
        }
    }

    /// Resolves whether the shared session is active. Enqueued on `audioSessionQueue`, so it runs
    /// after a pending `start()`; polls every 100 ms (without blocking the queue) until the timeout.
    /// Resolves at once when `start()` failed or callingx owns the session (we never activate it).
    @objc(waitForAudioSessionActiveWithTimeoutMs:resolve:)
    public func waitForAudioSessionActive(timeoutMs: Double, resolve: @escaping (Bool) -> Void) {
        audioSessionQueue.async { [self] in
            let deadline = DispatchTime.now() + .milliseconds(Int(max(timeoutMs, 0)))
            pollAudioSessionActive(until: deadline, resolve: resolve)
        }
    }

    private func pollAudioSessionActive(until deadline: DispatchTime, resolve: @escaping (Bool) -> Void) {
        let isActive = RTCAudioSession.sharedInstance().isActive
        if !isActive && (startFailed || Self.callingxOwnsSession()) {
            log("waitForAudioSessionActive: not waiting, \(startFailed ? "start failed" : "callingx owns the session")")
            resolve(isActive)
            return
        }
        if isActive || DispatchTime.now() >= deadline {
            if !isActive {
                log("waitForAudioSessionActive: session still inactive at timeout")
            }
            resolve(isActive)
            return
        }
        audioSessionQueue.asyncAfter(deadline: .now() + .milliseconds(100)) { [weak self] in
            guard let self else {
                resolve(false)
                return
            }
            self.pollAudioSessionActive(until: deadline, resolve: resolve)
        }
    }

    @objc
    public func stop() {
        audioSessionQueue.async { [self] in
            startFailed = false
            if !audioManagerActivated {
                // start() never ran, but the willEnable hook may have activated the session
                // (e.g. the engine enabled before start); release it. No-op otherwise.
                deactivateSessionIfNeeded(source: "stop")
                return
            }
            // Outside AudioSessionConfigLock: ADM calls hop to the worker thread (hooks).
            let adm = getAudioDeviceModule()
            adm?.reset()
            clearOutputRouting()
            // Usually already done by the didDisable hook during reset(); covers a missing ADM.
            deactivateSessionIfNeeded(source: "stop")
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
    public func setForceSpeakerphoneOn(enable: Bool) {
        audioSessionQueue.async { [self] in
            AudioSessionConfigLock.run { session in
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
    }


    // MARK: - Audio Device Picker

    @objc(getAudioDeviceStatus:)
    public func getAudioDeviceStatus(resolve: @escaping ([String: Any]) -> Void) {
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
    public func chooseAudioDeviceEndpoint(id: String) {
        audioSessionQueue.async { [self] in
            guard callAudioRole == .communicator else {
                log("chooseAudioDeviceEndpoint ignored: only supported in communicator role")
                return
            }

            let routing: OutputRouting = id == AudioDeviceId.speaker ? .speaker : .input(uid: id)

            let inputs = configInputsSnapshot()
            AudioSessionConfigLock.run { session in
                do {
                    // Reconfigure first so the live category matches the pick (e.g. the earpiece
                    // drops `.defaultToSpeaker`, otherwise overrideOutputAudioPort(.none) would
                    // resolve back to the speaker). Then drive the route.
                    try session.setConfiguration(makeAudioConfiguration(
                        inputs: inputs,
                        routing: routing,
                        isRecordingEnabled: false,
                        currentCategory: session.category
                    ))
                    try applyOutputRouting(routing)
                    selectedOutput = routing
                } catch {
                    // a failure leaves the previous route intact.
                    log("chooseAudioDeviceEndpoint error: \(String(describing: error))")
                }
            }
        }
    }

    /// Re-applies the current output pick (`selectedOutput`) — category untouched, no setActive.
    /// Called on interruption-end (via callingx's interruption event, forwarded from JS) to
    /// restore a Bluetooth/wired route
    @objc(reapplyAudioRoute)
    public func reapplyAudioRoute() {
        audioSessionQueue.async { [self] in
            guard callAudioRole == .communicator, let routing = selectedOutput else { return }
            AudioSessionConfigLock.run { _ in
                do {
                    try applyOutputRouting(routing)
                } catch {
                    log("reapplyAudioRoute error: \(String(describing: error))")
                }
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

    /// Compact snapshot of the shared audio session, attached to the JS-side diagnostics traces
    /// (stored with the call stats, so keep it small).
    @objc public func getAudioSessionState() -> [String: Any] {
        let session = AVAudioSession.sharedInstance()
        let route = session.currentRoute
        let inputs = route.inputs.map { $0.portType.rawValue }.joined(separator: ",")
        let outputs = route.outputs.map { $0.portType.rawValue }.joined(separator: ",")
        return [
            // e.g. "PlayAndRecord" / "VoiceChat" instead of "AVAudioSessionCategoryPlayAndRecord"
            "category": session.category.rawValue.replacingOccurrences(of: "AVAudioSessionCategory", with: ""),
            "mode": session.mode.rawValue.replacingOccurrences(of: "AVAudioSessionMode", with: ""),
            "options": session.categoryOptions.rawValue,
            "isActive": RTCAudioSession.sharedInstance().isActive,
            "isOtherAudioPlaying": session.isOtherAudioPlaying,
            "callingxOwnsSession": Self.callingxOwnsSession(),
            "route": "\(inputs)>\(outputs)",
            "micPermission": micPermissionState(),
        ]
    }

    @objc
    public func logAudioState() {
        log(getAudioStateLog())
    }
    
    @objc(getAudioStateLog)
    public func getAudioStateLog() -> String {
        let session = AVAudioSession.sharedInstance()
        
        guard let adm = getAudioDeviceModule() else {
            return "No audio device module found"
        }
        
        // Read the ADM first: its getters hop to the worker thread and must not run under
        // AudioSessionConfigLock.
        let admState = """
          IsPlaying: \(adm.isPlaying)
          IsRecording: \(adm.isRecording)
          IsVoiceProcessingAGCEnabled: \(adm.isVoiceProcessingAGCEnabled)
          IsVoiceProcessingBypassed: \(adm.isVoiceProcessingBypassed)
          IsVoiceProcessingEnabled: \(adm.isVoiceProcessingEnabled)
          IsStereoPlayoutEnabled: \(adm.isStereoPlayoutEnabled)
        """

        // WebRTC wraps AVAudioSession with RTCAudioSession; log its state as well.
        return AudioSessionConfigLock.run { rtcSession in
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
            \(admState)

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
    }

    @objc(muteAudioOutput)
    public func muteAudioOutput() {
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
    public func unmuteAudioOutput() {
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
            eventEmitter?.emitAudioInterruption(payload)
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
            eventEmitter?.emitAudioInterruption(payload)
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
                    guard let adm = self?.getAudioDeviceModule() else {
                        self?.log("Audio device module is not ready")
                        return
                    }
                    adm.refreshStereoPlayoutState()
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
            self.eventEmitter?.emitAudioDeviceChanged(self.buildAudioDevicesState())
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

    // MARK: - Call Sounds

    /// Starts the looping ringing tone. See `SoundPlayer`.
    /// - Parameter playIfMuted: Android-only, accepted so the spec signature matches across
    ///   platforms; iOS playback follows the call's audio session.
    @objc(playSound:playIfMuted:)
    public func playSound(soundName: String?, playIfMuted: Bool) {
        soundPlayer.playSound(soundName)
    }

    @objc(stopSound)
    public func stopSound() {
        soundPlayer.stopSound()
    }

    /// Surfaces native audio-session results/failures (otherwise only NSLog'd) to the JS call tracer.
    private func sendAudioSessionDiagnostic(
        _ event: String,
        error: Error? = nil,
        extra: [String: Any] = [:],
        includeSession: Bool = true
    ) {
        var body = includeSession ? getAudioSessionState() : [:]
        body.merge(extra) { _, new in new }
        body["event"] = event
        if let error {
            body["error"] = String(String(describing: error).prefix(200))
        }
        eventEmitter?.emitAudioSessionDiagnostic(body)
    }

    // MARK: - Helper Methods
    private func getAudioDeviceModule() -> AudioDeviceModule? {
        // nil while the TurboModule manager is invalidating (JS reload/teardown); callers handle a nil ADM
        guard let webrtcModule = webRTCModuleProvider?() else {
            log("getAudioDeviceModule(): WebRTCModule is not available")
            return nil
        }

        // Follow the live call's ADM; fall back to the default only when no call factory is
        // active (bare-fork, or an in-call-manager op firing outside the join↔leave window).
        return webrtcModule.currentAudioDeviceModuleOrNil()
    }

    private func getCurrentWindow() -> UIWindow? {
        // With multiple connected scenes the first one may be in the background,
        // so prefer the key window of a foreground-active scene that has windows.
        let windowScenes = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .filter { !$0.windows.isEmpty }
        let scene = windowScenes.first { $0.activationState == .foregroundActive } ?? windowScenes.first
        return scene?.windows.first { $0.isKeyWindow } ?? scene?.windows.first
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
        guard let reasonRaw = info[AVAudioSessionInterruptionReasonKey] as? UInt,
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
