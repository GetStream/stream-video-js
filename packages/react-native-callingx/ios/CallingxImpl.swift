import Foundation
import AVFoundation
import UIKit
import Combine
import stream_react_native_webrtc

// MARK: - Event Names
@objcMembers public class CallingxEvents: NSObject {
    public static let didReceiveStartCallAction = "didReceiveStartCallAction"
    public static let didToggleHoldAction = "didToggleHoldCallAction"
    public static let didPerformSetMutedCallAction = "didPerformSetMutedCallAction"
    public static let didAudioInterruption = "didAudioInterruption"
    public static let didChangeAudioRoute = "didChangeAudioRoute"
    public static let didDisplayIncomingCall = "didDisplayIncomingCall"
    public static let didActivateAudioSession = "didActivateAudioSession"
    public static let didDeactivateAudioSession = "didDeactivateAudioSession"
    public static let performAnswerCallAction = "answerCall"
    public static let performEndCallAction = "endCall"
    public static let performPlayDTMFCallAction = "didPerformDTMFAction"
    public static let providerReset = "providerReset"
}

// MARK: - Event Emitter Protocol
@objc public protocol CallingxEventEmitter {
    func emitEvent(_ dictionary: [String: Any])
}

// MARK: - Callingx Implementation
@objc public class CallingxImpl: NSObject {

    // MARK: - Shared State
    @objc public static var uuidStorage: UUIDStorage?
    @objc public static var sharedInstance: CallingxImpl?
    /// Events stored before the module instance exists (e.g. VoIP from killed state). Drained in getInitialEvents().
    private static var delayedEvents: [[String: Any]] = []
    /// The system call backend, created once per process by `currentBackend()`. Guarded by `backendLock`.
    private static var backend: CallingxBackend?
    private static let backendLock = NSLock()

    // MARK: - Instance Properties
    @objc public weak var eventEmitter: CallingxEventEmitter?
    @objc public weak var webRTCModule: WebRTCModule?

    private var canSendEvents: Bool = false
    private var isSetup: Bool = false
    /// Combine subscription to the AudioDeviceModule's engine-lifecycle publisher.
    /// Wired lazily in `setup()` because `webRTCModule` (the ADM source) is injected
    /// from the TurboModule host after `init`.
    private var engineSubscription: AnyCancellable?
    /// The ADM `engineSubscription` is bound to. Tracked so we can detect a new ADM
    /// (a JS reload recreates WebRTCModule) and re-wire instead of staying on a dead publisher.
    private weak var subscribedADM: AudioDeviceModule?
    /// Token for the process-wide ADM engine hooks registered in `init`.
    private var engineHooksToken: NSObject?
    /// Backing storage for the backend's view of the desired engine gate.
    private var desiredEngineAvailability: RTCAudioEngineAvailability = .default
    private let engineAvailabilityQueue = DispatchQueue(label: "io.getstream.callingx.engineAvailability")

    @objc public static func getSharedInstance() -> CallingxImpl {
        if sharedInstance == nil {
            sharedInstance = CallingxImpl()
        }

        return sharedInstance!
    }
    
    // MARK: - Initialization
    @objc public override init() {
        super.init()

        isSetup = false
        canSendEvents = false

        // Interruptions stay on NSNotificationCenter: the delegate's
        // `audioSessionDidBeginInterruption:` callback doesn't carry userInfo, and
        // `AVAudioSessionInterruptionReasonKey` (which we branch on for hardware
        // mic-mute / route-disconnect) lives there.
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onAudioInterruption(_:)),
            name: AVAudioSession.interruptionNotification,
            object: nil
        )

        // Process-wide (every per-call ADM), run synchronously on the WebRTC worker thread, so an
        // engine rebuild re-applies the callingx category/mode before it starts. Activation stays
        // with the system call backend (`didActivate`).
        engineHooksToken = AudioDeviceModule.addEngineHooks(
            willEnable: { _, isRecordingEnabled in
                guard CallingxSessionOwnership.callingxOwnsSession else { return 0 }
                return AudioSessionManager.shared.applyConfigurationForEngineEnable(isRecordingEnabled: isRecordingEnabled)
            },
            didDisable: nil
        )

        CallingxImpl.sharedInstance = self

        if CallingxImpl.uuidStorage == nil {
            CallingxImpl.uuidStorage = UUIDStorage()
        }
        CallingxImpl.uuidStorage?.liveCallUUIDsProvider = { CallingxImpl.existingBackend()?.liveCallUUIDs() ?? [] }
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
        if let engineHooksToken {
            AudioDeviceModule.removeEngineHooks(engineHooksToken)
        }
        engineSubscription?.cancel()
        engineSubscription = nil
        canSendEvents = false
        isSetup = false
    }
    
    // MARK: - Class Methods
    @objc public static func initializeIfNeeded() {
        currentBackend().applyConfiguration()
    }

    /// The process-wide backend, created on first use from the persisted settings and never switched
    /// afterwards. Ensures the shared instance exists first so the backend's events are delivered.
    static func currentBackend() -> CallingxBackend {
        _ = getSharedInstance()
        backendLock.lock()
        defer { backendLock.unlock() }
        if let backend { return backend }
        let created: CallingxBackend
        if #available(iOS 17.4, *), preferredBackendKind() == .liveCommunicationKit {
            created = LiveCommunicationKitBackend()
            CallingxLog.core.debugPublic("[backend] using LiveCommunicationKit")
        } else if Settings.getUseLiveCommunicationKit() {
            created = CallKitBackend()
            CallingxLog.core.debugPublic("[backend] using CallKit (useLiveCommunicationKit requires iOS 17.4)")
        } else {
            created = CallKitBackend()
            CallingxLog.core.debugPublic("[backend] using CallKit")
        }
        backend = created
        return created
    }

    /// The backend the persisted settings ask for: LiveCommunicationKit iff opted in and iOS 17.4+.
    private static func preferredBackendKind() -> CallingxBackendKind {
        guard #available(iOS 17.4, *), Settings.getUseLiveCommunicationKit() else { return .callKit }
        return .liveCommunicationKit
    }

    /// The backend if it was created already. Never creates one.
    static func existingBackend() -> CallingxBackend? {
        backendLock.lock()
        defer { backendLock.unlock() }
        return backend
    }
    
    @objc public static func reportNewIncomingCall(
        callId: String,
        handle: String,
        handleType: String,
        hasVideo: Bool,
        localizedCallerName: String?,
        supportsHolding: Bool,
        supportsDTMF: Bool,
        supportsGrouping: Bool,
        supportsUngrouping: Bool,
        payload: [String: Any]?,
        completion: (() -> Void)?,
        resolve: RCTPromiseResolveBlock?,
        reject: RCTPromiseRejectBlock?
    ) {
        initializeIfNeeded()
        currentBackend().reportNewIncomingCall(
            callId: callId,
            handle: handle,
            handleType: handleType,
            hasVideo: hasVideo,
            localizedCallerName: localizedCallerName,
            supportsHolding: supportsHolding,
            supportsDTMF: supportsDTMF,
            supportsGrouping: supportsGrouping,
            supportsUngrouping: supportsUngrouping,
            payload: payload,
            completion: completion,
            resolve: resolve,
            reject: reject
        )
    }
    
    @objc public static func canRegisterCall() -> Bool {
        let shouldReject = Settings.getShouldRejectCallWhenBusy()
        guard shouldReject else { return true }
        return !hasRegisteredCall()
    }

    @objc public static func hasRegisteredCall() -> Bool {
        // Intersects our calls with the backend's live calls.
        return uuidStorage?.hasRegisteredCall() ?? false
    }

    /// Whether a call is active, per the backend (see `CallingxBackend.hasAnyActiveCall`). Before a
    /// backend exists CallKit's observer answers (device-wide connected calls, needs no provider).
    @objc public static func hasAnyActiveCall() -> Bool {
        return existingBackend()?.hasAnyActiveCall() ?? CallKitBackend.hasConnectedCall()
    }
    
    @objc public static func endCall(_ callId: String, reason: Int) {
        currentBackend().endCall(callId, reason: reason)
    }

    // MARK: - Instance Methods
    @objc public func sendEvent(_ name: String, body: [String: Any]?) {
        CallingxLog.core.debugPublic("sendEventWithNameWrapper: \(name)")
        
        let sendEventAction = {
            var dictionary: [String: Any] = ["eventName": name]
            if let body = body {
                dictionary["params"] = body
            }
            
            if self.canSendEvents {
                self.eventEmitter?.emitEvent(dictionary)
            } else {
                CallingxImpl.delayedEvents.append(dictionary)
                CallingxLog.core.debugPublic("delayedEvents: \(CallingxImpl.delayedEvents)")
            }
        }

        if (Thread.isMainThread) {
            sendEventAction()
        } else {
            DispatchQueue.main.async {
                sendEventAction()
            }
        }
    }
    
    // MARK: - Audio Session Interruption

    // Observability + JS-event only; audio recovery is WebRTC's: AudioEngineDevice
    // restarts the engine on interruption-end. We do not touch the session here.
    @objc private func onAudioInterruption(_ notification: Notification) {
        guard CallingxSessionOwnership.callingxOwnsSession else {
            return
        }

        guard let info = notification.userInfo,
              let typeRaw = info[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeRaw) else {
            return
        }

        let reason = interruptionReason(info)
        var payload: [String: Any] = ["source": "callingx"]
        if let reason {
            payload["reason"] = reason
        }

        switch type {
        case .began:
            payload["phase"] = "began"
            sendEvent(CallingxEvents.didAudioInterruption, body: payload)
            CallingxLog.core.debugPublic("Audio interruption began (reason=\(reason ?? "n/a")). Recovery owned by WebRTC AudioEngineDevice.")
        case .ended:
            var shouldResume = false
            if let optsRaw = info[AVAudioSessionInterruptionOptionKey] as? UInt {
                shouldResume = AVAudioSession.InterruptionOptions(rawValue: optsRaw).contains(.shouldResume)
            }
            payload["phase"] = "ended"
            payload["shouldResume"] = shouldResume
            sendEvent(CallingxEvents.didAudioInterruption, body: payload)
            CallingxLog.core.debugPublic("Audio interruption ended (shouldResume=\(shouldResume)). WebRTC restarts the engine.")
        @unknown default:
            break
        }
    }

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

    // MARK: - Setup Methods
    @objc public func setup(options: [String: Any]) {
        // Persist first: the backend is chosen from the persisted settings when it is created.
        Settings.setSettings(options)
        let backend = CallingxImpl.currentBackend()
        backend.applyConfiguration()
        let requestedKind = CallingxImpl.preferredBackendKind()
        if backend.kind != requestedKind {
            CallingxLog.core.errorPublic("[backend] useLiveCommunicationKit changed to \(requestedKind == .liveCommunicationKit), it takes effect on next app launch")
        }
        isSetup = true
    }


    /// Wires the ADM engine-lifecycle subscription to the live call factory's ADM. A no-op when
    /// already wired to that ADM; re-wires when the ADM changes.
    @objc public func wireAudioEngineSubscription() {
        // Only wire when callingx (the system call layer) owns the session. For non-callingx calls the engine gate
        // and the sink below are irrelevant, so skipping keeps their ADM on `.default`.
        guard CallingxSessionOwnership.callingxOwnsSession else {
            CallingxLog.core.debugPublic("[wireEngineSubscription] skipped — callingx does not own the session")
            return
        }
        guard let adm = getCurrentAudioDeviceModule() else {
          CallingxLog.core.debugPublic("[wireEngineSubscription] skipped — adm is not instantiated")
          return
        }
        guard subscribedADM !== adm else { return } // already wired to this ADM
        engineSubscription?.cancel()                // ADM changed (e.g. JS reload) — rewire
        subscribedADM = adm
        CallingxLog.core.debugPublic("[wireEngineSubscription]")

        // Replay fixes potential race for a case when conversation manager callbacks are invoked before adm instance exists.
        // Serialized with setDesiredEngineAvailability so the read-then-apply pair can't interleave with a
        // concurrent delegate-queue write; otherwise a stale value could land on the ADM after the delegate applied a newer one.
        engineAvailabilityQueue.sync {
            _ = adm.setEngineAvailability(self.desiredEngineAvailability)
        }

        engineSubscription = adm.publisher.sink { event in
            guard CallingxSessionOwnership.callingxOwnsSession else { return }
            switch event {
            case .willEnableAudioEngine:
                // Session config is applied synchronously by the willEnable engine hook (see `init`).
                CallingxImpl.existingBackend()?.setAudioEngineStarting(true)
            case .willStartAudioEngine:
                // Engine is now rendering; voice-processing mute reflects real intent again.
                CallingxImpl.existingBackend()?.setAudioEngineStarting(false)
            default:
                break
            }
        }
    }

    /// Cancels the ADM engine-lifecycle subscription wired by `wireAudioEngineSubscription`.
    @objc public func unwireAudioEngineSubscription() {
        engineSubscription?.cancel()
        engineSubscription = nil
        subscribedADM = nil
        CallingxLog.core.debugPublic("[unwireEngineSubscription]")
    }
    
    @objc public func getInitialEvents() -> [[String: Any]] {
        var events: [[String: Any]] = []
        let action = {
            CallingxLog.core.debugPublic("[getInitialEvents] delayedEvents = \(CallingxImpl.delayedEvents)")
            
            events = CallingxImpl.delayedEvents
            CallingxImpl.delayedEvents = []
            self.canSendEvents = true
        }

        if (Thread.isMainThread) {
            action()
        } else {
            DispatchQueue.main.sync {
                action()
            }
        }
            
        return events
    }
        
    // MARK: - Call Management
    @objc public func answerIncomingCall(_ callId: String) -> Bool {
        return CallingxImpl.currentBackend().answerIncomingCall(callId)
    }
    
    @objc public func displayIncomingCall(
        callId: String,
        phoneNumber: String,
        callerName: String,
        hasVideo: Bool,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        CallingxImpl.reportNewIncomingCall(
            callId: callId,
            handle: phoneNumber,
            handleType: "generic",
            hasVideo: hasVideo,
            localizedCallerName: callerName,
            supportsHolding: false,
            supportsDTMF: false,
            supportsGrouping: false,
            supportsUngrouping: false,
            payload: nil,
            completion: nil,
            resolve: resolve,
            reject: reject
        )
    }
    
    @objc public func endCall(_ callId: String) -> Bool {
        return CallingxImpl.currentBackend().endCall(callId)
    }
    
    @objc public func isCallTracked(_ callId: String) -> Bool {
        // True when the call is tracked AND confirmed live by the backend.
        return CallingxImpl.uuidStorage?.isCallTracked(forCid: callId) ?? false
    }
    
    @objc public func setCurrentCallActive(_ callId: String) -> Bool {
        return CallingxImpl.currentBackend().setCurrentCallActive(callId)
    }
    
    @objc public func setMutedCall(_ callId: String, isMuted: Bool) -> Bool {
        return CallingxImpl.currentBackend().setMutedCall(callId, isMuted: isMuted)
    }
    
    @objc public func setOnHoldCall(_ callId: String, isOnHold: Bool) -> Bool {
        return CallingxImpl.currentBackend().setOnHoldCall(callId, isOnHold: isOnHold)
    }
    
    @objc public func startCall(
        callId: String,
        phoneNumber: String,
        callerName: String,
        hasVideo: Bool
    ) {
        CallingxImpl.currentBackend().startCall(callId: callId, phoneNumber: phoneNumber, callerName: callerName, hasVideo: hasVideo)
    }
    
    @objc public func updateDisplay(
        callId: String,
        phoneNumber: String,
        callerName: String
    ) -> Bool {
        return CallingxImpl.currentBackend().updateDisplay(callId: callId, phoneNumber: phoneNumber, callerName: callerName)
    }
    
    // MARK: - Pending Action Fulfillment

    @objc public func fulfillAnswerCallAction(_ callId: String, didFail: Bool) {
        CallingxImpl.currentBackend().fulfillAnswerCallAction(callId, didFail: didFail)
    }

    @objc public func fulfillEndCallAction(_ callId: String, didFail: Bool) {
        CallingxImpl.currentBackend().fulfillEndCallAction(callId, didFail: didFail)
    }

    // MARK: - Audio Configuration

    @objc public func setDefaultAudioDeviceEndpointType(_ endpointType: String) {
        AudioSessionManager.shared.setDefaultAudioDeviceEndpointType(endpointType)
    }

    // MARK: - Helper Methods
    /// Records the desired engine availability and applies it to the current call's ADM if one
    /// exists. When the ADM doesn't exist yet (a system call callback landed before join built the
    /// per-call factory), the direct apply is a no-op and the stored value is replayed onto the
    /// ADM in `wireAudioEngineSubscription()`.
    func setDesiredEngineAvailability(_ availability: RTCAudioEngineAvailability) {
        engineAvailabilityQueue.sync {
            self.desiredEngineAvailability = availability
            _ = self.getCurrentAudioDeviceModule()?.setEngineAvailability(availability)
        }
    }

    /// The live call factory's ADM, or nil when no call is active. Never triggers a default factory
    /// build, so wiring before a call exists (or after it ends) is a safe no-op.
    private func getCurrentAudioDeviceModule() -> AudioDeviceModule? {
        guard let adm = webRTCModule?.currentAudioDeviceModuleOrNil() else {
            CallingxLog.core.errorPublic("No live call factory ADM. WebRTCModule missing, or wired outside the join↔leave window.")
            return nil
        }
        return adm
    }
}
