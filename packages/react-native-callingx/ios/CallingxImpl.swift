import Foundation
import LiveCommunicationKit
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
    /// Shared LiveCommunicationKit manager. Its `configuration` is immutable, so a settings change
    /// recreates it. Its `delegate` is weak; `sharedInstance` keeps the delegate alive.
    /// Accessed from the JS thread, main (PushKit), the delegate queue and tasks: read it through
    /// `conversationManager` and swap it only under `conversationManagerLock`.
    private static var _conversationManager: ConversationManager?
    /// Set when a configuration change arrived while a call was tracked; applied once idle.
    private static var isConversationManagerRecreatePending = false
    private static let conversationManagerLock = NSLock()

    private static var conversationManager: ConversationManager? {
        conversationManagerLock.lock()
        defer { conversationManagerLock.unlock() }
        return _conversationManager
    }

    /// UUIDs of incoming reports not yet landed in `conversations`, and `.conversationEnded`
    /// events deferred until they land. Guarded by `incomingReportsLock`.
    private static var inFlightIncomingReports: Set<UUID> = []
    private static var deferredEndedEvents: [UUID: Conversation.Event] = [:]
    private static let incomingReportsLock = NSLock()

    /// Ended reason ints of the JS/ObjC contract (CallKit's historical raw values).
    private static let endedReasonUnanswered = 3

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
    /// Backing storage for the conversation-manager view of the desired engine gate.
    private var desiredEngineAvailability: RTCAudioEngineAvailability = .default
    private let engineAvailabilityQueue = DispatchQueue(label: "io.getstream.callingx.engineAvailability")

    // Pending conversation actions awaiting JS fulfillment
    private var pendingAnswerActions: [String: (action: JoinConversationAction, enqueuedAt: DispatchTime)] = [:]
    private var pendingEndActions: [String: (action: EndConversationAction, enqueuedAt: DispatchTime)] = [:]
    private let pendingActionsQueue = DispatchQueue(label: "io.getstream.callingx.pendingActions")
    // a large timeout to accomodate for cold start + metro server load time
    private let pendingActionTimeoutSeconds = 30

    /// UUIDs of mute actions the app requested via `setMutedCall`. Lets the perform delegate skip
    /// app-initiated mutes (vs system ones from the native call UI). A set so concurrent toggles
    /// each match their own UUID. Guarded by `pendingActionsQueue`.
    private var appInitiatedMuteActionIds: Set<UUID> = []

    /// Members/capabilities update of outgoing calls whose start action was fulfilled but whose
    /// conversation hasn't appeared in `conversations` yet. LCK adds it only after
    /// `fulfill(dateStarted:)` (`conversationChanged` follows), so the start events are reported
    /// from there. Guarded by `pendingActionsQueue`.
    private var pendingOutgoingConversationReports: [UUID: Conversation.Update] = [:]

    /// `true` while the audio engine is starting. Startup toggles `voiceProcessingInputMuted`, which
    /// iOS 17+ surfaces as system-initiated mutes — artifacts, not user intent, so we skip them.
    /// Set on `willEnableAudioEngine`, cleared on `willStartAudioEngine`. Guarded by `pendingActionsQueue`.
    private var isAudioEngineStarting = false

    /// Mute value of the last app-requested mute action. iOS 17+ round-trips it back as a
    /// system-initiated action of the same value; we skip that echo (a real UI toggle flips the value).
    /// Reset when the call ends. Guarded by `pendingActionsQueue`.
    private var lastAppRequestedMute: Bool?

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

        CallingxImpl.sharedInstance = self

        if CallingxImpl.uuidStorage == nil {
            CallingxImpl.uuidStorage = UUIDStorage()
        }
        CallingxImpl.uuidStorage?.liveConversationUUIDsProvider = { CallingxImpl.liveConversationUUIDs() }

        CallingxImpl.conversationManagerLock.lock()
        if CallingxImpl._conversationManager == nil {
            CallingxImpl._conversationManager = ConversationManager(configuration: Settings.getConversationManagerConfiguration())
        }
        CallingxImpl._conversationManager?.delegate = self
        CallingxImpl.conversationManagerLock.unlock()
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
        engineSubscription?.cancel()
        engineSubscription = nil

        // Swap under the lock, call into LCK after unlocking.
        CallingxImpl.conversationManagerLock.lock()
        var oldManager: ConversationManager?
        if CallingxImpl._conversationManager?.delegate === self {
            oldManager = CallingxImpl._conversationManager
            CallingxImpl._conversationManager = nil
        }
        CallingxImpl.conversationManagerLock.unlock()
        oldManager?.delegate = nil
        oldManager?.invalidate()
        canSendEvents = false
        isSetup = false
    }
    
    // MARK: - Class Methods
    @objc public static func initializeIfNeeded() {
        _ = getSharedInstance() // ensures the shared instance and the conversation manager exist
        applyConversationManagerConfiguration()
    }

    /// Recreates the manager when the settings changed its configuration (which is immutable).
    /// While any call is tracked or live the change is marked pending instead (a killed-state push
    /// report may not have landed in `conversations` yet, and invalidating would drop it) and
    /// applied by `applyPendingConversationManagerConfiguration()` once the last call ends.
    /// Callers register a call in `uuidStorage` before reading the manager, so the idle check and
    /// the swap (both under the lock) can't drop a call that's being reported or started.
    /// Never calls into LiveCommunicationKit while holding the lock: LCK may serialize on the queue
    /// of a delegate callback that is reading `conversationManager`.
    private static func applyConversationManagerConfiguration() {
        guard let instance = sharedInstance else { return }
        let configuration = Settings.getConversationManagerConfiguration()

        conversationManagerLock.lock()
        let snapshot = _conversationManager
        conversationManagerLock.unlock()

        var liveUUIDs: Set<UUID> = []
        if let snapshot {
            guard !isSameConfiguration(snapshot.configuration, configuration) else {
                conversationManagerLock.lock()
                if _conversationManager === snapshot { isConversationManagerRecreatePending = false }
                conversationManagerLock.unlock()
                return
            }
            liveUUIDs = liveConversationUUIDs(of: snapshot)
        }

        conversationManagerLock.lock()
        guard _conversationManager === snapshot else {
            // Swapped concurrently: keep any pending change for the next apply.
            conversationManagerLock.unlock()
            return
        }
        if snapshot != nil {
            guard (uuidStorage?.count() ?? 0) == 0, liveUUIDs.isEmpty else {
                isConversationManagerRecreatePending = true
                conversationManagerLock.unlock()
                CallingxLog.core.debugPublic("[recreateConversationManager] pending — a call is tracked or live")
                return
            }
        }
        let manager = ConversationManager(configuration: configuration)
        manager.delegate = instance
        _conversationManager = manager
        isConversationManagerRecreatePending = false
        conversationManagerLock.unlock()

        CallingxLog.core.debugPublic("[recreateConversationManager]")
        snapshot?.delegate = nil
        snapshot?.invalidate()
    }

    /// Applies a configuration change deferred while a call was live. Hops to main so the manager is
    /// never invalidated from inside its own delegate callback.
    private static func applyPendingConversationManagerConfiguration() {
        DispatchQueue.main.async {
            conversationManagerLock.lock()
            let isPending = isConversationManagerRecreatePending
            conversationManagerLock.unlock()
            guard isPending else { return }
            CallingxLog.core.debugPublic("[recreateConversationManager] applying pending configuration")
            applyConversationManagerConfiguration()
        }
    }

    /// `ConversationManager.Configuration` is not `Equatable`; compares the fields callingx sets.
    private static func isSameConfiguration(
        _ lhs: ConversationManager.Configuration,
        _ rhs: ConversationManager.Configuration
    ) -> Bool {
        return lhs.ringtoneName == rhs.ringtoneName
            && lhs.iconTemplateImageData == rhs.iconTemplateImageData
            && lhs.maximumConversationGroups == rhs.maximumConversationGroups
            && lhs.maximumConversationsPerConversationGroup == rhs.maximumConversationsPerConversationGroup
            && lhs.includesConversationInRecents == rhs.includesConversationInRecents
            && lhs.supportsVideo == rhs.supportsVideo
            && lhs.supportedHandleTypes == rhs.supportedHandleTypes
    }

    /// UUIDs of the manager's conversations that have not left yet.
    private static func liveConversationUUIDs() -> Set<UUID> {
        guard let manager = conversationManager else { return [] }
        return liveConversationUUIDs(of: manager)
    }

    private static func liveConversationUUIDs(of manager: ConversationManager) -> Set<UUID> {
        return Set(manager.conversations.filter { $0.state != .left }.map { $0.uuid })
    }

    @discardableResult
    private static func reportConversationEvent(_ event: Conversation.Event, uuid: UUID) -> Bool {
        guard let manager = conversationManager,
              let conversation = manager.conversations.first(where: { $0.uuid == uuid }) else {
            CallingxLog.core.errorPublic("[reportConversationEvent] conversation not found for uuid = \(uuid), event = \(event)")
            return false
        }
        manager.reportConversationEvent(event, for: conversation)
        return true
    }

    /// Reports `.conversationEnded`. If the incoming report hasn't landed yet (e.g. the caller hung up
    /// right after the push), defers it until the report completes so no ringing UI is left behind.
    private static func reportConversationEnded(_ event: Conversation.Event, uuid: UUID) {
        guard let manager = conversationManager,
              manager.conversations.contains(where: { $0.uuid == uuid }) else {
            incomingReportsLock.lock()
            let isReportInFlight = inFlightIncomingReports.contains(uuid)
            if isReportInFlight { deferredEndedEvents[uuid] = event }
            incomingReportsLock.unlock()

            if isReportInFlight {
                CallingxLog.core.debugPublic("[reportConversationEnded] incoming report in flight, deferring end for uuid = \(uuid)")
            } else {
                // The report may have landed since the lookup above: retry once.
                reportConversationEvent(event, uuid: uuid)
            }
            return
        }
        reportConversationEvent(event, uuid: uuid)
    }

    /// System handle for the remote party. The system call UI shows `Handle.value` and ignores
    /// `displayName` (Apple FB24933340, seen on iPadOS 27.0.1), so the value is the display name
    /// when there is one, else the given handle (e.g. the caller's user id).
    private static func makeRemoteHandle(handleType: String?, handle: String, displayName: String?) -> Handle {
        let name = displayName?.isEmpty == false ? displayName : nil
        return Handle(type: Settings.getHandleType(handleType), value: name ?? handle, displayName: name)
    }

    /// Maps the JS/ObjC ended reason ints (CallKit raw values) to LCK reasons.
    private static func conversationEndedReason(_ reason: Int) -> Conversation.EndedReason {
        switch reason {
        case 1: return .failed
        case 2: return .remoteEnded
        case 3: return .unanswered
        case 4: return .joinedElsewhere
        case 5: return .declinedElsewhere
        default: return .failed
        }
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

        guard let storage = uuidStorage else {
            CallingxLog.core.errorPublic("[reportNewIncomingCall] no storage")
            completion?()
            reject?("DISPLAY_INCOMING_CALL_ERROR", "Conversation manager is not available", nil)
            return
        }

        if storage.containsCid(callId) {
            CallingxLog.core.debugPublic("[reportNewIncomingCall] callId already exists")
            completion?()
            resolve?(true)
            return
        }

        // Register the call before reading the manager so a concurrent recreate sees it as busy.
        let uuid = storage.getOrCreateUUID(forCid: callId)
        guard let manager = conversationManager else {
            CallingxLog.core.errorPublic("[reportNewIncomingCall] no conversation manager")
            storage.removeCid(callId)
            completion?()
            reject?("DISPLAY_INCOMING_CALL_ERROR", "Conversation manager is not available", nil)
            return
        }
        let remoteHandle = makeRemoteHandle(handleType: handleType, handle: handle, displayName: localizedCallerName)
        var capabilities: Conversation.Capabilities = []
        if hasVideo { capabilities.insert(.video) }
        if supportsHolding { capabilities.insert(.pausing) }
        if supportsDTMF { capabilities.insert(.playingTones) }
        if supportsGrouping { capabilities.insert(.merging) }
        if supportsUngrouping { capabilities.insert(.unmerging) }
        let update = Conversation.Update(
            members: [remoteHandle],
            activeRemoteMembers: [remoteHandle],
            capabilities: capabilities
        )

        let onReported: (Error?) -> Void = { error in
            CallingxLog.core.debugPublic("[reportNewIncomingCall] callId = \(callId), error = \(String(describing: error))")
            incomingReportsLock.lock()
            inFlightIncomingReports.remove(uuid)
            let deferredEndedEvent = deferredEndedEvents.removeValue(forKey: uuid)
            incomingReportsLock.unlock()
            // LCK has no incoming-call error codes, unlike CallKit.
            let errorCode = error != nil ? "Unknown" : ""

            let body = [
                "error": error?.localizedDescription ?? "",
                "errorCode": errorCode,
                "callId": callId,
                "handle": handle,
                "localizedCallerName": localizedCallerName ?? "",
                "hasVideo": hasVideo ? "1" : "0",
                "supportsHolding": supportsHolding ? "1" : "0",
                "supportsDTMF": supportsDTMF ? "1" : "0",
                "supportsGrouping": supportsGrouping ? "1" : "0",
                "supportsUngrouping": supportsUngrouping ? "1" : "0",
                "payload": payload ?? ""
            ]

            if let instance = CallingxImpl.sharedInstance {
              instance.sendEvent(CallingxEvents.didDisplayIncomingCall, body: body)
            }

            if error == nil {
                CallingxLog.core.debugPublic("[reportNewIncomingCall] success callId = \(callId)")
                if let deferredEndedEvent {
                    // Ended (endCall(_:reason:)) while the report was in flight.
                    CallingxLog.core.debugPublic("[reportNewIncomingCall] reporting deferred end for callId = \(callId)")
                    reportConversationEvent(deferredEndedEvent, uuid: uuid)
                } else {
                    scheduleUnansweredCallTimeout(callId: callId, uuid: uuid)
                }
                resolve?(true)
            } else {
                // Only drop our entry if it still belongs to this report (cid not re-used).
                if uuidStorage?.getUUID(forCid: callId) == uuid {
                    uuidStorage?.removeCid(callId)
                }
                reject?("DISPLAY_INCOMING_CALL_ERROR", error?.localizedDescription, error)
            }
        }

        incomingReportsLock.lock()
        inFlightIncomingReports.insert(uuid)
        incomingReportsLock.unlock()

        let report: () async -> Void = {
            do {
                try await manager.reportNewIncomingConversation(uuid: uuid, update: update)
                onReported(nil)
            } catch {
                onReported(error)
            }
        }

        if resolve != nil || reject != nil {
            // JS path: no PushKit deadline, the promise settles after the report.
            Task { await report() }
            return
        }

        // Native path, assumed to be a PushKit delegate even with a nil completion
        // (Apple DTS workaround for FB16655952): the async report must be entered before
        // this PushKit delegate returns, or the app is killed for not reporting a call. Start it, stall
        // briefly so the task enters the report (Apple measured 5–7 ms), then complete the push.
        Task.detached { await report() }
        Thread.sleep(forTimeInterval: 0.05)
        completion?()
    }
    
    @objc public static func canRegisterCall() -> Bool {
        let shouldReject = Settings.getShouldRejectCallWhenBusy()
        guard shouldReject else { return true }
        return !hasRegisteredCall()
    }

    @objc public static func hasRegisteredCall() -> Bool {
        // Intersects our calls with the conversation manager's live conversations.
        return uuidStorage?.hasRegisteredCall() ?? false
    }

    /// Device-wide (any app's call): true when a conversation is joining, joined or paused.
    @objc public static func hasAnyActiveCall() -> Bool {
        guard let manager = conversationManager else { return false }
        return manager.conversations.contains { $0.state == .joining || $0.state == .joined || $0.state == .paused }
    }
    
    @objc public static func endCall(_ callId: String, reason: Int) {
        CallingxLog.core.debugPublic("[endCall] callId = \(callId) reason = \(reason)")
        
        guard let call = uuidStorage?.getCall(forCid: callId) else {
            CallingxLog.core.debugPublic("[endCall] callId not found")
            return
        }
        
        call.markEnded()
        
        reportConversationEnded(
            .conversationEnded(call.endedAt ?? Date(), conversationEndedReason(reason)),
            uuid: call.uuid
        )
        uuidStorage?.removeCid(callId)
        applyPendingConversationManagerConfiguration()
    }
    
    /// Native backstop: ends an incoming call still unanswered after `displayCallTimeout`, even
    /// when JS never ends it (e.g. it missed the caller's cancel while iOS kept the app suspended).
    private static func scheduleUnansweredCallTimeout(callId: String, uuid: UUID) {
        guard let timeout = Settings.getSettings()["displayCallTimeout"] as? Int, timeout > 0 else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + .milliseconds(timeout)) {
            // Same call (cid not re-used), never answered, not ended yet.
            guard let call = uuidStorage?.getCall(forCid: callId), call.uuid == uuid,
                  !call.isAnswered, !call.hasEnded else { return }
            CallingxLog.core.debugPublic("[displayCallTimeout] unanswered after \(timeout) ms, ending callId = \(callId)")
            endCall(callId, reason: endedReasonUnanswered)
        }
    }

    // MARK: - Instance Methods
    /// Performs a conversation action through the manager. On failure, resets the call's
    /// action-source flags (the delegate never ran for it) and drops a call that failed to start.
    private func performConversationAction(_ action: ConversationAction) {
        guard let manager = CallingxImpl.conversationManager else {
            CallingxLog.core.errorPublic("[performConversationAction] no conversation manager")
            return
        }
        CallingxLog.core.debugPublic("[performConversationAction] action = \(action)")

        Task { [weak self] in
            do {
                try await manager.perform([action])
                CallingxLog.core.debugPublic("[performConversationAction] performed action successfully")
            } catch {
                CallingxLog.core.errorPublic("[performConversationAction] Error performing action (\(action)): (\(error))")
                self?.pendingActionsQueue.sync {
                    _ = self?.appInitiatedMuteActionIds.remove(action.uuid)
                    _ = self?.pendingOutgoingConversationReports.removeValue(forKey: action.conversationUUID)
                }
                if let call = CallingxImpl.uuidStorage?.getCallByUUID(action.conversationUUID) {
                    call.resetAllSelfFlags()
                    if action is StartConversationAction {
                        CallingxImpl.uuidStorage?.removeCid(call.cid)
                        CallingxImpl.applyPendingConversationManagerConfiguration()
                    }
                }
            }
        }
    }
    
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
        Settings.setSettings(options)
        CallingxImpl.applyConversationManagerConfiguration()
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

        engineSubscription = adm.publisher.sink { [weak self] event in
            guard CallingxSessionOwnership.callingxOwnsSession else { return }
            switch event {
            case .willEnableAudioEngine:
                self?.pendingActionsQueue.sync { self?.isAudioEngineStarting = true }
                AudioSessionManager.shared.engineWillEnable()
            case .willStartAudioEngine:
                // Engine is now rendering; voice-processing mute reflects real intent again.
                self?.pendingActionsQueue.sync { self?.isAudioEngineStarting = false }
            case .didDisableAudioEngine:
                AudioSessionManager.shared.engineDidDisable()
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
        CallingxLog.core.debugPublic("[answerIncomingCall] callId = \(callId)")

        guard let call = CallingxImpl.uuidStorage?.getCall(forCid: callId) else {
            CallingxLog.core.debugPublic("[answerIncomingCall] callId not found")
            return false
        }
        
        // Guard: already answered or ended — prevent duplicate JoinConversationActions
        if call.isAnswered || call.hasEnded {
            CallingxLog.core.debugPublic("[answerIncomingCall] callId already answered/ended, skipping")
            return true
        }
        
        call.markSelfAnswered()
        call.markStartedConnecting() // internal state: incoming call is now connecting
        
        performConversationAction(JoinConversationAction(conversationUUID: call.uuid))
        return true
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
        CallingxLog.core.debugPublic("[endCall] callId = \(callId)")
        
        guard let call = CallingxImpl.uuidStorage?.getCall(forCid: callId) else {
            CallingxLog.core.debugPublic("[endCall] callId not found")
            return false
        }
        
        // Guard: already ended — prevent duplicate EndConversationActions
        if call.hasEnded {
            CallingxLog.core.debugPublic("[endCall] callId already ended, skipping")
            return true
        }
        
        call.markSelfEnded()
        call.markEnded()
        
        performConversationAction(EndConversationAction(conversationUUID: call.uuid))
        return true
    }
    
    @objc public func isCallTracked(_ callId: String) -> Bool {
        // True when the call is tracked AND confirmed live by the conversation manager.
        return CallingxImpl.uuidStorage?.isCallTracked(forCid: callId) ?? false
    }
    
    @objc public func setCurrentCallActive(_ callId: String) -> Bool {
        CallingxLog.core.debugPublic("[setCurrentCallActive] callId = \(callId)")

        guard let call = CallingxImpl.uuidStorage?.getCall(forCid: callId) else {
            CallingxLog.core.debugPublic("[setCurrentCallActive] callId not found")
            return false
        }

        call.markConnected()

        // Report the connected timestamp to the system.
        // startedConnectingAt is reported separately in the StartConversationAction delegate.
        CallingxImpl.reportConversationEvent(.conversationConnected(call.connectedAt ?? Date()), uuid: call.uuid)
        return true
    }
    
    @objc public func setMutedCall(_ callId: String, isMuted: Bool) -> Bool {
        CallingxLog.core.debugPublic("[setMutedCall] muted = \(isMuted)")
        guard let call = CallingxImpl.uuidStorage?.getCall(forCid: callId) else {
            CallingxLog.core.debugPublic("[setMutedCall] callId not found")
            return false
        }

        let muteAction = MuteConversationAction(conversationUUID: call.uuid, isMuted: isMuted)
        // Record the action UUID so the perform delegate can recognize this as app-initiated
        // (and skip echoing it back to JS) without racing on a shared per-call flag.
        pendingActionsQueue.sync {
            _ = appInitiatedMuteActionIds.insert(muteAction.uuid)
        }

        performConversationAction(muteAction)
        return true
    }
    
    @objc public func setOnHoldCall(_ callId: String, isOnHold: Bool) -> Bool {
        CallingxLog.core.debugPublic("[setOnHold] uuidString = \(callId), shouldHold = \(isOnHold)")

        guard let uuid = CallingxImpl.uuidStorage?.getUUID(forCid: callId) else {
            CallingxLog.core.debugPublic("[setOnHoldCall] callId not found")
            return false
        }

        performConversationAction(PauseConversationAction(conversationUUID: uuid, isPaused: isOnHold))
        return true
    }
    
    @objc public func startCall(
        callId: String,
        phoneNumber: String,
        callerName: String,
        hasVideo: Bool
    ) {
        CallingxLog.core.debugPublic("[startCall] callId = \(callId), phoneNumber = \(phoneNumber)")

        guard let storage = CallingxImpl.uuidStorage else { return }

        if storage.containsCid(callId) {
            CallingxLog.core.debugPublic("[startCall] Call \(callId) is already registered")
            return
        }

        // Pick up configuration changes; deferred while a call is tracked.
        CallingxImpl.applyConversationManagerConfiguration()

        let call = storage.getOrCreateCall(forCid: callId, isOutgoing: true)
        call.markStartedConnecting() // outgoing: reported as .conversationStartedConnecting in the delegate

        let callHandle = CallingxImpl.makeRemoteHandle(
            handleType: Settings.getSettings()["handleType"] as? String,
            handle: phoneNumber,
            displayName: callerName
        )
        performConversationAction(StartConversationAction(
            conversationUUID: call.uuid,
            handles: [callHandle],
            isVideo: hasVideo
        ))
    }
    
    @objc public func updateDisplay(
        callId: String,
        phoneNumber: String,
        callerName: String
    ) -> Bool {
        CallingxLog.core.debugPublic("[updateDisplay] callId = \(callId) displayName = \(callerName) uri = \(phoneNumber)")

        guard let uuid = CallingxImpl.uuidStorage?.getUUID(forCid: callId) else {
            CallingxLog.core.debugPublic("[updateDisplay] callId not found")
            return false
        }

        let callHandle = CallingxImpl.makeRemoteHandle(
            handleType: Settings.getSettings()["handleType"] as? String,
            handle: phoneNumber,
            displayName: callerName
        )
        CallingxImpl.reportConversationEvent(.conversationUpdated(Conversation.Update(members: [callHandle])), uuid: uuid)
        return true
    }
    
    // MARK: - Pending Action Fulfillment

    @objc public func fulfillAnswerCallAction(_ callId: String, didFail: Bool) {
        guard let pending = pendingActionsQueue.sync(execute: { pendingAnswerActions.removeValue(forKey: callId) }) else {
            CallingxLog.core.debugPublic("[fulfillAnswerCallAction] action not found for callId: \(callId)")
            return
        }
        let elapsedMs = elapsedMilliseconds(since: pending.enqueuedAt)
        CallingxLog.core.debugPublic("[fulfillAnswerCallAction] callId: \(callId), didFail: \(didFail), elapsedMs=\(elapsedMs)")
        if didFail {
            pending.action.fail()
        } else {
            let connectedAt = Date()
            pending.action.fulfill(dateConnected: connectedAt)
            CallingxImpl.reportConversationEvent(.conversationConnected(connectedAt), uuid: pending.action.conversationUUID)
        }
    }

    @objc public func fulfillEndCallAction(_ callId: String, didFail: Bool) {
        guard let pending = pendingActionsQueue.sync(execute: { pendingEndActions.removeValue(forKey: callId) }) else {
            CallingxLog.core.debugPublic("[fulfillEndCallAction] action not found for callId: \(callId)")
            return
        }
        let elapsedMs = elapsedMilliseconds(since: pending.enqueuedAt)
        CallingxLog.core.debugPublic("[fulfillEndCallAction] callId: \(callId), didFail: \(didFail), elapsedMs=\(elapsedMs)")
        if didFail { pending.action.fail() } else { pending.action.fulfill(dateEnded: Date()) }
    }

    // MARK: - Audio Configuration

    @objc public func setDefaultAudioDeviceEndpointType(_ endpointType: String) {
        AudioSessionManager.shared.setDefaultAudioDeviceEndpointType(endpointType)
    }

    // MARK: - Helper Methods
    private func elapsedMilliseconds(since start: DispatchTime) -> Int {
        let nowNs = DispatchTime.now().uptimeNanoseconds
        let startNs = start.uptimeNanoseconds
        guard nowNs >= startNs else { return 0 }
        return Int((nowNs - startNs) / 1_000_000)
    }

    /// Records the desired engine availability and applies it to the current call's ADM if one
    /// exists. When the ADM doesn't exist yet (a conversation manager callback landed before join built the
    /// per-call factory), the direct apply is a no-op and the stored value is replayed onto the
    /// ADM in `wireAudioEngineSubscription()`.
    private func setDesiredEngineAvailability(_ availability: RTCAudioEngineAvailability) {
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

// MARK: - ConversationManagerDelegate
// Swift-only: LiveCommunicationKit types have no ObjC representation.
extension CallingxImpl: ConversationManagerDelegate {

    public func conversationManager(_ manager: ConversationManager, conversationChanged conversation: Conversation) {
        CallingxLog.core.debugPublic("[ConversationManagerDelegate][conversationChanged] uuid = \(conversation.uuid) state = \(conversation.state)")
        reportOutgoingConversationStarted(conversation)
    }

    public func conversationManagerDidBegin(_ manager: ConversationManager) {
        CallingxLog.core.debugPublic("[ConversationManagerDelegate][conversationManagerDidBegin]")
    }

    public func conversationManager(_ manager: ConversationManager, perform action: ConversationAction) {
        switch action {
        case let startAction as StartConversationAction:
            performStartConversationAction(startAction)
        case let joinAction as JoinConversationAction:
            performJoinConversationAction(joinAction)
        case let endAction as EndConversationAction:
            performEndConversationAction(endAction)
        case let muteAction as MuteConversationAction:
            performMuteConversationAction(muteAction)
        case let pauseAction as PauseConversationAction:
            performPauseConversationAction(pauseAction)
        case let toneAction as PlayToneAction:
            performPlayToneAction(toneAction)
        default:
            // Includes MergeConversationAction/UnmergeConversationAction: grouping is not supported.
            CallingxLog.core.debugPublic("[ConversationManagerDelegate][perform] unsupported action \(action), failing")
            action.fail()
        }
    }

    private func performStartConversationAction(_ action: StartConversationAction) {
        CallingxLog.core.debugPublic("[ConversationManagerDelegate][performStartConversationAction]")

        guard let call = CallingxImpl.uuidStorage?.getCallByUUID(action.conversationUUID) else {
            CallingxLog.core.debugPublic("[ConversationManagerDelegate][performStartConversationAction] callId not found")
            action.fail()
            return
        }

        // Claim audio-session ownership BEFORE applySystemCallConfigurationSync:
        // both can synchronously fire .didDisableAudioEngine / .willEnableAudioEngine
        // through the ADM publisher. The engine sink gates on this flag.
        CallingxSessionOwnership.callingxOwnsSession = true
        // Gate the audio engine off until the system activates the AVAudioSession
        // (conversationManager:didActivate:). Prevents the engine starting on the wrong,
        // system-restricted timing.
        setDesiredEngineAvailability(.none)
        AudioSessionManager.shared.applySystemCallConfigurationSync()

        sendEvent(CallingxEvents.didReceiveStartCallAction, body: [
            "callId": call.cid,
            "handle": action.handles.first?.value ?? ""
        ])

        // The conversation appears in `conversations` only after the fulfill below; its start
        // events are reported from `conversationChanged`.
        let update = Conversation.Update(
            members: Set(action.handles),
            activeRemoteMembers: Set(action.handles),
            capabilities: action.isVideo ? [.video] : []
        )
        pendingActionsQueue.sync {
            pendingOutgoingConversationReports[call.uuid] = update
        }
        action.fulfill(dateStarted: Date())
    }

    /// Reports an outgoing call's members, capabilities and `startedConnectingAt` (set in
    /// startCall) once its conversation exists.
    private func reportOutgoingConversationStarted(_ conversation: Conversation) {
        let update = pendingActionsQueue.sync {
            pendingOutgoingConversationReports.removeValue(forKey: conversation.uuid)
        }
        guard let update, let call = CallingxImpl.uuidStorage?.getCallByUUID(conversation.uuid) else { return }

        CallingxImpl.reportConversationEvent(.conversationUpdated(update), uuid: call.uuid)
        CallingxImpl.reportConversationEvent(
            .conversationStartedConnecting(call.startedConnectingAt ?? Date()),
            uuid: call.uuid
        )
    }

    private func performMuteConversationAction(_ action: MuteConversationAction) {
        guard let call = CallingxImpl.uuidStorage?.getCallByUUID(action.conversationUUID) else {
            CallingxLog.core.debugPublic("[ConversationManagerDelegate][performMuteConversationAction] callId not found")
            action.fail()
            return
        }

        // Resolve all three suppression flags in one queue hop (serialized state).
        let (isAppInitiated, suppressDuringStartup, isMuteEcho) = pendingActionsQueue.sync { () -> (Bool, Bool, Bool) in
            let appInitiated = appInitiatedMuteActionIds.remove(action.uuid) != nil
            // Remember the value so its iOS 17+ system echo can be skipped below.
            if appInitiated { lastAppRequestedMute = action.isMuted }
            let echo = !appInitiated && lastAppRequestedMute == action.isMuted
            return (appInitiated, isAudioEngineStarting, echo)
        }

        CallingxLog.core.debugPublic("[ConversationManagerDelegate][performMuteConversationAction] \(action.isMuted) isAppInitiated: \(isAppInitiated) suppressDuringStartup: \(suppressDuringStartup) isMuteEcho: \(isMuteEcho)")
        // Forward to JS only genuine system mutes (user tapped the native call UI). Skip app-initiated
        // actions (feedback loop), their iOS 17+ system echoes, and engine-startup artifacts —
        // see each flag's field docs.
        if !isAppInitiated && !suppressDuringStartup && !isMuteEcho {
            sendEvent(CallingxEvents.didPerformSetMutedCallAction, body: [
                "muted": action.isMuted,
                "callId": call.cid
            ])
        }

        action.fulfill()
    }

    private func performPauseConversationAction(_ action: PauseConversationAction) {
        CallingxLog.core.debugPublic("[ConversationManagerDelegate][performPauseConversationAction]")

        guard let callId = CallingxImpl.uuidStorage?.getCid(forUUID: action.conversationUUID) else {
            CallingxLog.core.debugPublic("[ConversationManagerDelegate][performPauseConversationAction] callId not found")
            action.fail()
            return
        }

        sendEvent(CallingxEvents.didToggleHoldAction, body: [
            "hold": action.isPaused,
            "callId": callId
        ])

        action.fulfill()
    }

    private func performPlayToneAction(_ action: PlayToneAction) {
        CallingxLog.core.debugPublic("[ConversationManagerDelegate][performPlayToneAction]")

        guard let callId = CallingxImpl.uuidStorage?.getCid(forUUID: action.conversationUUID) else {
            CallingxLog.core.debugPublic("[ConversationManagerDelegate][performPlayToneAction] callId not found")
            action.fail()
            return
        }

        sendEvent(CallingxEvents.performPlayDTMFCallAction, body: [
            "digits": action.digits,
            "callId": callId
        ])

        action.fulfill()
    }

    private func performJoinConversationAction(_ action: JoinConversationAction) {
        guard let call = CallingxImpl.uuidStorage?.getCallByUUID(action.conversationUUID) else {
            CallingxLog.core.debugPublic("[ConversationManagerDelegate][performJoinConversationAction] callId not found")
            action.fail()
            return
        }
        
        CallingxLog.core.debugPublic("[ConversationManagerDelegate][performJoinConversationAction] isSelfAnswered: \(call.isSelfAnswered)")
        // Claim audio-session ownership BEFORE applySystemCallConfigurationSync:
        // it can synchronously fire .didDisableAudioEngine / .willEnableAudioEngine
        // through the ADM publisher. The engine sink gates on this flag.
        CallingxSessionOwnership.callingxOwnsSession = true
        // Gate the audio engine off until the system activates the AVAudioSession
        // (conversationManager:didActivate:). Prevents the engine starting on the wrong,
        // system-restricted timing.
        setDesiredEngineAvailability(.none)
        AudioSessionManager.shared.applySystemCallConfigurationSync()

        let source = call.isSelfAnswered ? "app" : "sys"
        sendEvent(CallingxEvents.performAnswerCallAction, body: [
            "callId": call.cid,
            "source": source
        ])
        
        call.resetSelfAnswered()
        call.markConnected() // incoming: call is now connected

        if source == "app" {
            // App initiated this answer — no need to wait for JS, fulfill immediately
            let connectedAt = call.connectedAt ?? Date()
            action.fulfill(dateConnected: connectedAt)
            CallingxImpl.reportConversationEvent(.conversationConnected(connectedAt), uuid: call.uuid)
        } else {
            // System initiated — defer fulfillment until JS reports back via fulfillAnswerCallAction
            let cid = call.cid
            pendingActionsQueue.sync {
                self.pendingAnswerActions[cid] = (action: action, enqueuedAt: DispatchTime.now())
            }
            // Safety timer: auto-fail if JS never responds.
            // Answer timeout = call never connected
            let timeout = DispatchTime.now() + DispatchTimeInterval.seconds(pendingActionTimeoutSeconds)
            pendingActionsQueue.asyncAfter(deadline: timeout) { [weak self] in
                if let pending = self?.pendingAnswerActions.removeValue(forKey: cid) {
                    CallingxLog.core.debugPublic("[ConversationManagerDelegate][performJoinConversationAction] answer timeout for callId: \(cid)")
                    pending.action.fail()
                }
            }
        }
    }

    private func performEndConversationAction(_ action: EndConversationAction) {
        guard let call = CallingxImpl.uuidStorage?.getCallByUUID(action.conversationUUID) else {
            CallingxLog.core.debugPublic("[ConversationManagerDelegate][performEndConversationAction] callId not found")
            // End actions represent explicit user intent to close call UI.
            // Fulfill stale/duplicate end actions to avoid "Call Failed" UX.
            action.fulfill(dateEnded: Date())
            return
        }

        CallingxLog.core.debugPublic("[ConversationManagerDelegate][performEndConversationAction] isSelfEnded: \(call.isSelfEnded)")

        let source = call.isSelfEnded ? "app" : "sys"
        sendEvent(CallingxEvents.performEndCallAction, body: [
            "callId": call.cid,
            "source": source
        ])

        call.resetSelfEnded()
        call.markEnded()
        CallingxImpl.uuidStorage?.removeCid(call.cid)
        CallingxImpl.applyPendingConversationManagerConfiguration()
        // Forget this call's mute intent so its stale value can't be read as an echo next call.
        pendingActionsQueue.sync { lastAppRequestedMute = nil }

        if source == "app" {
            // App initiated this end — no need to wait for JS, fulfill immediately
            action.fulfill(dateEnded: call.endedAt ?? Date())
        } else {
            // System initiated — defer fulfillment until JS reports back via fulfillEndCallAction
            let cid = call.cid
            pendingActionsQueue.sync {
                self.pendingEndActions[cid] = (action: action, enqueuedAt: DispatchTime.now())
            }
            // Safety timer: auto-fulfill if JS never responds.
            let timeout = DispatchTime.now() + DispatchTimeInterval.seconds(pendingActionTimeoutSeconds)
            pendingActionsQueue.asyncAfter(deadline: timeout) { [weak self] in
                if let pending = self?.pendingEndActions.removeValue(forKey: cid) {
                    CallingxLog.core.debugPublic("[ConversationManagerDelegate][performEndConversationAction] end timeout for callId: \(cid)")
                    pending.action.fulfill(dateEnded: Date())
                }
            }
        }
    }

    public func conversationManager(_ manager: ConversationManager, didActivate audioSession: AVAudioSession) {
        CallingxLog.core.debugPublic("[ConversationManagerDelegate][didActivateAudioSession] category=\(audioSession.category) mode=\(audioSession.mode)")
        // Re-claim ownership BEFORE notifying WebRTC. Handles the PSTN/Siri
        // interruption-resume case: didDeactivate cleared the flag if the call
        // had ended, but for an interruption the call is still tracked and
        // ownership was preserved — re-asserting here is a no-op then, and
        // closes any edge case where it had been cleared.
        CallingxSessionOwnership.callingxOwnsSession = true

        // The system may activate with its own category/mode; re-apply VoIP preset
        AudioSessionManager.shared.applySystemCallConfigurationSync()

        // The system owns the session timing now — allow the audio engine to start.
        setDesiredEngineAvailability(.default)

        // When the system activates the AVAudioSession, inform WebRTC as well.
        RTCAudioSession.sharedInstance().audioSessionDidActivate(audioSession)

        // Enable wake lock to keep the device awake during the call
        DispatchQueue.main.async {
            UIApplication.shared.isIdleTimerDisabled = true
        }

        sendEvent(CallingxEvents.didActivateAudioSession, body: nil)
    }
    
    public func conversationManager(_ manager: ConversationManager, didDeactivate audioSession: AVAudioSession) {
        CallingxLog.core.debugPublic("[ConversationManagerDelegate][didDeactivateAudioSession] category=\(audioSession.category) mode=\(audioSession.mode)")

        // do not let webrtc audio engine auto start until after conversationManager:didActivate:.
        setDesiredEngineAvailability(.none)

        // When the system deactivates the AVAudioSession, inform WebRTC as well.
        RTCAudioSession.sharedInstance().audioSessionDidDeactivate(audioSession)

        // Invariant: callingx ships with maximumCallsPerCallGroup = maximumCallGroups = 1
        // (see packages/react-native-callingx/src/utils/constants.ts defaultiOSOptions).
        // So `UUIDStorage.count() == 0` reliably distinguishes:
        //   - true end-of-call (call removed in the EndConversationAction perform before didDeactivate)
        //   - PSTN/Siri interruption (call still tracked, will resume via didActivate)
        // Do NOT "fix" this to handle multi-call semantics — the product does not support
        // concurrent system calls. See plan: critically-review-the-implementation-zesty-spindle.
        if let storage = CallingxImpl.uuidStorage, storage.count() == 0 {
            CallingxSessionOwnership.callingxOwnsSession = false
            AudioSessionManager.shared.stopRouteObserver()
            CallingxImpl.applyPendingConversationManagerConfiguration()
        }

        // Disable wake lock when the call ends
        DispatchQueue.main.async {
            UIApplication.shared.isIdleTimerDisabled = false
        }

        sendEvent(CallingxEvents.didDeactivateAudioSession, body: nil)
    }
  
    public func conversationManager(_ manager: ConversationManager, timedOutPerforming action: ConversationAction) {
        // note: in practice we should never be getting this callback as we already have a pending timeout set.
        CallingxLog.core.debugPublic("[ConversationManagerDelegate][timedOutPerformingAction]")

        let conversationUUID = action.conversationUUID
        pendingActionsQueue.sync {
            // cid mapping as soon as end is initiated, so cleanup by matching conversationUUID.
            if let answerEntry = pendingAnswerActions.first(where: { $0.value.action.conversationUUID == conversationUUID }) {
                pendingAnswerActions.removeValue(forKey: answerEntry.key)
                let elapsedMs = elapsedMilliseconds(since: answerEntry.value.enqueuedAt)
                CallingxLog.core.debugPublic("[ConversationManagerDelegate][timedOutPerformingAction] removed pending answer action for callId: \(answerEntry.key), elapsedMs=\(elapsedMs)")
            }

            if let endEntry = pendingEndActions.first(where: { $0.value.action.conversationUUID == conversationUUID }) {
                pendingEndActions.removeValue(forKey: endEntry.key)
                let elapsedMs = elapsedMilliseconds(since: endEntry.value.enqueuedAt)
                CallingxLog.core.debugPublic("[ConversationManagerDelegate][timedOutPerformingAction] removed pending end action for callId: \(endEntry.key), elapsedMs=\(elapsedMs)")
            }
        }
    }
  
    public func conversationManagerDidReset(_ manager: ConversationManager) {
        CallingxLog.core.debugPublic("[ConversationManagerDelegate][conversationManagerDidReset]")

        // Clear any pending actions to prevent memory leaks.
        // After a reset, all pending conversation actions are invalid.
        pendingActionsQueue.sync {
            pendingAnswerActions.removeAll()
            pendingEndActions.removeAll()
            lastAppRequestedMute = nil
        }

        // Snapshot the tracked cids before wiping storage: JS leaves exactly the calls the system was tracking.
        let trackedCids = CallingxImpl.uuidStorage?.allCids() ?? []
        CallingxSessionOwnership.callingxOwnsSession = false
        CallingxImpl.uuidStorage?.removeAllObjects()
        AudioSessionManager.shared.stopRouteObserver()

        sendEvent(CallingxEvents.providerReset, body: ["callCids": trackedCids])
        CallingxImpl.applyPendingConversationManagerConfiguration()
    }
}
