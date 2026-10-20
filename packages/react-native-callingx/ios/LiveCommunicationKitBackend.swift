import Foundation
import LiveCommunicationKit
import CallKit
import AVFoundation
import UIKit
import stream_react_native_webrtc

// MARK: - LiveCommunicationKit Backend
/// `CallingxBackend` on Apple LiveCommunicationKit. Created once per process; it is the
/// conversation manager's delegate and stays alive with `CallingxImpl`'s backend reference.
@available(iOS 17.4, *)
final class LiveCommunicationKitBackend: CallingxBackend {

    let kind: CallingxBackendKind = .liveCommunicationKit

    /// Shared LiveCommunicationKit manager. Its `configuration` is immutable, so a settings change
    /// recreates it. Its `delegate` is weak; `CallingxImpl` keeps this backend (the delegate) alive.
    /// Accessed from the JS thread, main (PushKit), the delegate queue and tasks: read it through
    /// `conversationManager` and swap it only under `conversationManagerLock`.
    private var _conversationManager: ConversationManager?
    /// Set when a configuration change arrived while a call was tracked; applied once idle.
    private var isConversationManagerRecreatePending = false
    private let conversationManagerLock = NSLock()

    private var conversationManager: ConversationManager? {
        conversationManagerLock.lock()
        defer { conversationManagerLock.unlock() }
        return _conversationManager
    }

    /// UUIDs of incoming reports not yet landed in `conversations`, and `.conversationEnded`
    /// events deferred until they land. Guarded by `incomingReportsLock`.
    private var inFlightIncomingReports: Set<UUID> = []
    private var deferredEndedEvents: [UUID: Conversation.Event] = [:]
    private let incomingReportsLock = NSLock()

    /// Ended reason ints of the JS/ObjC contract (CallKit's historical raw values).
    private static let endedReasonUnanswered = 3

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

    /// `startCall` phone number per outgoing call UUID, reported as `didReceiveStartCallAction`'s
    /// handle: the action's handle value is the display name (see `makeRemoteHandle`).
    /// Guarded by `pendingActionsQueue`.
    private var outgoingCallPhoneNumbers: [UUID: String] = [:]

    /// Long-lived so its call list is current. LCK conversations are only this app's.
    private let callObserver = CXCallObserver()

    /// `true` while the audio engine is starting. Startup toggles `voiceProcessingInputMuted`, which
    /// iOS 17+ surfaces as system-initiated mutes — artifacts, not user intent, so we skip them.
    /// Set on `willEnableAudioEngine`, cleared on `willStartAudioEngine`. Guarded by `pendingActionsQueue`.
    private var isAudioEngineStarting = false

    /// Mute value of the last app-requested mute action. iOS 17+ round-trips it back as a
    /// system-initiated action of the same value; we skip that echo (a real UI toggle flips the value).
    /// Reset when the call ends. Guarded by `pendingActionsQueue`.
    private var lastAppRequestedMute: Bool?

    private var uuidStorage: UUIDStorage? { CallingxImpl.uuidStorage }

    // MARK: - Initialization
    init() {
        let manager = ConversationManager(configuration: Settings.getConversationManagerConfiguration())
        manager.delegate = self
        conversationManagerLock.lock()
        _conversationManager = manager
        conversationManagerLock.unlock()
    }

    // MARK: - Configuration

    func applyConfiguration() {
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
    private func applyConversationManagerConfiguration() {
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
        manager.delegate = self
        _conversationManager = manager
        isConversationManagerRecreatePending = false
        conversationManagerLock.unlock()

        CallingxLog.core.debugPublic("[recreateConversationManager]")
        snapshot?.delegate = nil
        snapshot?.invalidate()
    }

    /// Applies a configuration change deferred while a call was live. Hops to main so the manager is
    /// never invalidated from inside its own delegate callback.
    private func applyPendingConversationManagerConfiguration() {
        DispatchQueue.main.async {
            self.conversationManagerLock.lock()
            let isPending = self.isConversationManagerRecreatePending
            self.conversationManagerLock.unlock()
            guard isPending else { return }
            CallingxLog.core.debugPublic("[recreateConversationManager] applying pending configuration")
            self.applyConversationManagerConfiguration()
        }
    }

    /// `ConversationManager.Configuration` is not `Equatable`; compares the fields callingx sets.
    private func isSameConfiguration(
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

    // MARK: - Conversation Queries

    /// UUIDs of the manager's conversations that have not left yet.
    func liveCallUUIDs() -> Set<UUID> {
        guard let manager = conversationManager else { return [] }
        return liveConversationUUIDs(of: manager)
    }

    private func liveConversationUUIDs(of manager: ConversationManager) -> Set<UUID> {
        return Set(manager.conversations.filter { $0.state != .left }.map { $0.uuid })
    }

    /// True when this app's conversation is joined or paused, or CallKit reports a connected call
    /// on the device (other apps, cellular). LCK conversations may not appear in CallKit's observer.
    func hasAnyActiveCall() -> Bool {
        if let manager = conversationManager,
           manager.conversations.contains(where: { $0.state == .joined || $0.state == .paused }) {
            return true
        }
        return CallKitBackend.hasConnectedCall(callObserver)
    }

    @discardableResult
    private func reportConversationEvent(_ event: Conversation.Event, uuid: UUID) -> Bool {
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
    private func reportConversationEnded(_ event: Conversation.Event, uuid: UUID) {
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
    private func makeRemoteHandle(handleType: String?, handle: String, displayName: String?) -> Handle {
        let name = displayName?.isEmpty == false ? displayName : nil
        return Handle(type: Settings.getHandleType(handleType), value: name ?? handle, displayName: name)
    }

    /// Maps the JS/ObjC ended reason ints (CallKit raw values) to LCK reasons.
    private func conversationEndedReason(_ reason: Int) -> Conversation.EndedReason {
        switch reason {
        case 1: return .failed
        case 2: return .remoteEnded
        case 3: return .unanswered
        case 4: return .joinedElsewhere
        case 5: return .declinedElsewhere
        default: return .failed
        }
    }

    // MARK: - Incoming Calls

    func reportNewIncomingCall(
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
            self.incomingReportsLock.lock()
            self.inFlightIncomingReports.remove(uuid)
            let deferredEndedEvent = self.deferredEndedEvents.removeValue(forKey: uuid)
            self.incomingReportsLock.unlock()
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
                    self.reportConversationEvent(deferredEndedEvent, uuid: uuid)
                } else {
                    self.scheduleUnansweredCallTimeout(callId: callId, uuid: uuid)
                }
                resolve?(true)
            } else {
                // Only drop our entry if it still belongs to this report (cid not re-used).
                if self.uuidStorage?.getUUID(forCid: callId) == uuid {
                    self.uuidStorage?.removeCid(callId)
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

    func endCall(_ callId: String, reason: Int) {
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
    private func scheduleUnansweredCallTimeout(callId: String, uuid: UUID) {
        guard let timeout = Settings.getSettings()["displayCallTimeout"] as? Int, timeout > 0 else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + .milliseconds(timeout)) {
            // Same call (cid not re-used), never answered, not ended yet.
            guard let call = self.uuidStorage?.getCall(forCid: callId), call.uuid == uuid,
                  !call.isAnswered, !call.hasEnded else { return }
            CallingxLog.core.debugPublic("[displayCallTimeout] unanswered after \(timeout) ms, ending callId = \(callId)")
            self.endCall(callId, reason: LiveCommunicationKitBackend.endedReasonUnanswered)
        }
    }

    // MARK: - Call Management
    /// Performs a conversation action through the manager. On failure, resets the call's
    /// action-source flags (the delegate never ran for it) and drops a call that failed to start.
    private func performConversationAction(_ action: ConversationAction) {
        guard let manager = conversationManager else {
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
                    _ = self?.outgoingCallPhoneNumbers.removeValue(forKey: action.conversationUUID)
                }
                if let call = self?.uuidStorage?.getCallByUUID(action.conversationUUID) {
                    call.resetAllSelfFlags()
                    if action is StartConversationAction {
                        self?.uuidStorage?.removeCid(call.cid)
                        self?.applyPendingConversationManagerConfiguration()
                    }
                }
            }
        }
    }

    func answerIncomingCall(_ callId: String) -> Bool {
        CallingxLog.core.debugPublic("[answerIncomingCall] callId = \(callId)")

        guard let call = uuidStorage?.getCall(forCid: callId) else {
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

    func endCall(_ callId: String) -> Bool {
        CallingxLog.core.debugPublic("[endCall] callId = \(callId)")

        guard let call = uuidStorage?.getCall(forCid: callId) else {
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

    func setCurrentCallActive(_ callId: String) -> Bool {
        CallingxLog.core.debugPublic("[setCurrentCallActive] callId = \(callId)")

        guard let call = uuidStorage?.getCall(forCid: callId) else {
            CallingxLog.core.debugPublic("[setCurrentCallActive] callId not found")
            return false
        }

        call.markConnected()

        // Report the connected timestamp to the system.
        // startedConnectingAt is reported separately in the StartConversationAction delegate.
        reportConversationEvent(.conversationConnected(call.connectedAt ?? Date()), uuid: call.uuid)
        return true
    }

    func setMutedCall(_ callId: String, isMuted: Bool) -> Bool {
        CallingxLog.core.debugPublic("[setMutedCall] muted = \(isMuted)")
        guard let call = uuidStorage?.getCall(forCid: callId) else {
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

    func setOnHoldCall(_ callId: String, isOnHold: Bool) -> Bool {
        CallingxLog.core.debugPublic("[setOnHold] uuidString = \(callId), shouldHold = \(isOnHold)")

        guard let uuid = uuidStorage?.getUUID(forCid: callId) else {
            CallingxLog.core.debugPublic("[setOnHoldCall] callId not found")
            return false
        }

        performConversationAction(PauseConversationAction(conversationUUID: uuid, isPaused: isOnHold))
        return true
    }

    func startCall(
        callId: String,
        phoneNumber: String,
        callerName: String,
        hasVideo: Bool
    ) {
        CallingxLog.core.debugPublic("[startCall] callId = \(callId), phoneNumber = \(phoneNumber)")

        guard let storage = uuidStorage else { return }

        if storage.containsCid(callId) {
            CallingxLog.core.debugPublic("[startCall] Call \(callId) is already registered")
            return
        }

        // Pick up configuration changes; deferred while a call is tracked.
        applyConversationManagerConfiguration()

        let call = storage.getOrCreateCall(forCid: callId, isOutgoing: true)
        call.markStartedConnecting() // outgoing: reported as .conversationStartedConnecting in the delegate

        let callHandle = makeRemoteHandle(
            handleType: Settings.getSettings()["handleType"] as? String,
            handle: phoneNumber,
            displayName: callerName
        )
        pendingActionsQueue.sync {
            outgoingCallPhoneNumbers[call.uuid] = phoneNumber
        }
        performConversationAction(StartConversationAction(
            conversationUUID: call.uuid,
            handles: [callHandle],
            isVideo: hasVideo
        ))
    }

    func updateDisplay(
        callId: String,
        phoneNumber: String,
        callerName: String
    ) -> Bool {
        CallingxLog.core.debugPublic("[updateDisplay] callId = \(callId) displayName = \(callerName) uri = \(phoneNumber)")

        guard let uuid = uuidStorage?.getUUID(forCid: callId) else {
            CallingxLog.core.debugPublic("[updateDisplay] callId not found")
            return false
        }

        let callHandle = makeRemoteHandle(
            handleType: Settings.getSettings()["handleType"] as? String,
            handle: phoneNumber,
            displayName: callerName
        )
        reportConversationEvent(.conversationUpdated(Conversation.Update(members: [callHandle])), uuid: uuid)
        return true
    }

    // MARK: - Pending Action Fulfillment

    func fulfillAnswerCallAction(_ callId: String, didFail: Bool) {
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
            reportConversationEvent(.conversationConnected(connectedAt), uuid: pending.action.conversationUUID)
        }
    }

    func fulfillEndCallAction(_ callId: String, didFail: Bool) {
        guard let pending = pendingActionsQueue.sync(execute: { pendingEndActions.removeValue(forKey: callId) }) else {
            CallingxLog.core.debugPublic("[fulfillEndCallAction] action not found for callId: \(callId)")
            return
        }
        let elapsedMs = elapsedMilliseconds(since: pending.enqueuedAt)
        CallingxLog.core.debugPublic("[fulfillEndCallAction] callId: \(callId), didFail: \(didFail), elapsedMs=\(elapsedMs)")
        if didFail { pending.action.fail() } else { pending.action.fulfill(dateEnded: Date()) }
    }

    // MARK: - Audio Engine

    func setAudioEngineStarting(_ isStarting: Bool) {
        pendingActionsQueue.sync { isAudioEngineStarting = isStarting }
    }

    // MARK: - Helper Methods
    private func elapsedMilliseconds(since start: DispatchTime) -> Int {
        let nowNs = DispatchTime.now().uptimeNanoseconds
        let startNs = start.uptimeNanoseconds
        guard nowNs >= startNs else { return 0 }
        return Int((nowNs - startNs) / 1_000_000)
    }

    private func sendEvent(_ name: String, body: [String: Any]?) {
        CallingxImpl.sharedInstance?.sendEvent(name, body: body)
    }

    private func setDesiredEngineAvailability(_ availability: RTCAudioEngineAvailability) {
        CallingxImpl.sharedInstance?.setDesiredEngineAvailability(availability)
    }
}

// MARK: - ConversationManagerDelegate
@available(iOS 17.4, *)
extension LiveCommunicationKitBackend: ConversationManagerDelegate {

    func conversationManager(_ manager: ConversationManager, conversationChanged conversation: Conversation) {
        CallingxLog.core.debugPublic("[ConversationManagerDelegate][conversationChanged] uuid = \(conversation.uuid) state = \(conversation.state)")
        reportOutgoingConversationStarted(conversation)
    }

    func conversationManagerDidBegin(_ manager: ConversationManager) {
        CallingxLog.core.debugPublic("[ConversationManagerDelegate][conversationManagerDidBegin]")
    }

    func conversationManager(_ manager: ConversationManager, perform action: ConversationAction) {
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

        guard let call = uuidStorage?.getCallByUUID(action.conversationUUID) else {
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

        let phoneNumber = pendingActionsQueue.sync {
            outgoingCallPhoneNumbers.removeValue(forKey: action.conversationUUID)
        }
        sendEvent(CallingxEvents.didReceiveStartCallAction, body: [
            "callId": call.cid,
            "handle": phoneNumber ?? action.handles.first?.value ?? ""
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
        guard let update, let call = uuidStorage?.getCallByUUID(conversation.uuid) else { return }

        reportConversationEvent(.conversationUpdated(update), uuid: call.uuid)
        reportConversationEvent(
            .conversationStartedConnecting(call.startedConnectingAt ?? Date()),
            uuid: call.uuid
        )
    }

    private func performMuteConversationAction(_ action: MuteConversationAction) {
        guard let call = uuidStorage?.getCallByUUID(action.conversationUUID) else {
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

        guard let callId = uuidStorage?.getCid(forUUID: action.conversationUUID) else {
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

        guard let callId = uuidStorage?.getCid(forUUID: action.conversationUUID) else {
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
        guard let call = uuidStorage?.getCallByUUID(action.conversationUUID) else {
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
            reportConversationEvent(.conversationConnected(connectedAt), uuid: call.uuid)
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
        guard let call = uuidStorage?.getCallByUUID(action.conversationUUID) else {
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
        uuidStorage?.removeCid(call.cid)
        applyPendingConversationManagerConfiguration()
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

    func conversationManager(_ manager: ConversationManager, didActivate audioSession: AVAudioSession) {
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

    func conversationManager(_ manager: ConversationManager, didDeactivate audioSession: AVAudioSession) {
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
        if let storage = uuidStorage, storage.count() == 0 {
            CallingxSessionOwnership.callingxOwnsSession = false
            AudioSessionManager.shared.stopRouteObserver()
            applyPendingConversationManagerConfiguration()
        }

        // Disable wake lock when the call ends
        DispatchQueue.main.async {
            UIApplication.shared.isIdleTimerDisabled = false
        }

        sendEvent(CallingxEvents.didDeactivateAudioSession, body: nil)
    }

    func conversationManager(_ manager: ConversationManager, timedOutPerforming action: ConversationAction) {
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

    func conversationManagerDidReset(_ manager: ConversationManager) {
        CallingxLog.core.debugPublic("[ConversationManagerDelegate][conversationManagerDidReset]")

        // Clear any pending actions to prevent memory leaks.
        // After a reset, all pending conversation actions are invalid.
        pendingActionsQueue.sync {
            pendingAnswerActions.removeAll()
            pendingEndActions.removeAll()
            lastAppRequestedMute = nil
        }

        // Snapshot the tracked cids before wiping storage: JS leaves exactly the calls the system was tracking.
        let trackedCids = uuidStorage?.allCids() ?? []
        CallingxSessionOwnership.callingxOwnsSession = false
        uuidStorage?.removeAllObjects()
        AudioSessionManager.shared.stopRouteObserver()

        sendEvent(CallingxEvents.providerReset, body: ["callCids": trackedCids])
        applyPendingConversationManagerConfiguration()
    }
}
