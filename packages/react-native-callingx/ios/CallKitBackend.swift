import Foundation
import CallKit
import AVFoundation
import UIKit
import stream_react_native_webrtc

// MARK: - CallKit Backend
/// `CallingxBackend` on CallKit (the default). Created once per process; it is the `CXProvider`
/// delegate and stays alive with `CallingxImpl`'s backend reference.
final class CallKitBackend: NSObject, CallingxBackend {

    let kind: CallingxBackendKind = .callKit

    private let provider: CXProvider
    private let callController = CXCallController()

    /// Warm, long-lived observer of CallKit's call state — a cold observer can report empty even for a
    /// call that's been live for a while.
    private let callObserver = CXCallObserver()
    /// CallKit's live view, maintained from observer callbacks. NOTE: contains UUIDs of ALL
    /// system calls. Only ever intersect it with our own UUIDs — never treat it as "our calls".
    /// Guarded by `callObserverQueue`.
    private var liveCallKitUUIDs: Set<UUID> = []
    private let callObserverQueue = DispatchQueue(label: "io.getstream.callingx.callObserver")

    // Pending CXActions awaiting JS fulfillment
    private var pendingAnswerActions: [String: (action: CXAnswerCallAction, enqueuedAt: DispatchTime)] = [:]
    private var pendingEndActions: [String: (action: CXEndCallAction, enqueuedAt: DispatchTime)] = [:]
    private let pendingActionsQueue = DispatchQueue(label: "io.getstream.callingx.pendingActions")
    // a large timeout to accomodate for cold start + metro server load time
    private let pendingActionTimeoutSeconds = 30

    /// UUIDs of mute actions the app requested via `setMutedCall`. Lets the perform delegate skip
    /// app-initiated mutes (vs system ones from the native CallKit UI). A set so concurrent toggles
    /// each match their own UUID. Guarded by `pendingActionsQueue`.
    private var appInitiatedMuteActionIds: Set<UUID> = []

    /// `true` while the audio engine is starting. Startup toggles `voiceProcessingInputMuted`, which
    /// iOS 17+ surfaces as system-initiated mutes — artifacts, not user intent, so we skip them.
    /// Set on `willEnableAudioEngine`, cleared on `willStartAudioEngine`. Guarded by `pendingActionsQueue`.
    private var isAudioEngineStarting = false

    /// Mute value of the last app-requested `CXSetMutedCallAction`. iOS 17+ round-trips it back as a
    /// system-initiated action of the same value; we skip that echo (a real UI toggle flips the value).
    /// Reset when the call ends. Guarded by `pendingActionsQueue`.
    private var lastAppRequestedMute: Bool?

    private var uuidStorage: UUIDStorage? { CallingxImpl.uuidStorage }

    // MARK: - Initialization
    override init() {
        provider = CXProvider(configuration: Settings.getProviderConfiguration())
        super.init()
        provider.setDelegate(self, queue: nil)

        callObserver.setDelegate(self, queue: callObserverQueue)
        callObserverQueue.async { [weak self] in
            guard let self = self else { return }
            self.liveCallKitUUIDs = Set(
                self.callObserver.calls.filter { !$0.hasEnded }.map { $0.uuid }
            )
        }
    }

    // MARK: - Configuration

    func applyConfiguration() {
        provider.configuration = Settings.getProviderConfiguration()
    }

    // MARK: - CallKit Queries

    func liveCallUUIDs() -> Set<UUID> {
        return callObserverQueue.sync { liveCallKitUUIDs }
    }

    /// Device-wide (any app's call): true when a call has connected.
    func hasAnyActiveCall() -> Bool {
        return CallKitBackend.hasConnectedCall(callObserver)
    }

    /// Also used by `CallingxImpl` before any backend exists (CallKit's view is device-wide and
    /// needs no provider).
    static func hasConnectedCall(_ observer: CXCallObserver = CXCallObserver()) -> Bool {
        return observer.calls.contains { $0.hasConnected }
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
        guard let storage = uuidStorage else { return }

        if storage.containsCid(callId) {
            CallingxLog.core.debugPublic("[reportNewIncomingCall] callId already exists")
            completion?()
            resolve?(true)
            return
        }

        let cxHandleType: CXHandle.HandleType = Settings.getHandleType(handleType)
        let uuid = storage.getOrCreateUUID(forCid: callId)
        let callUpdate = CXCallUpdate()
        callUpdate.remoteHandle = CXHandle(type: cxHandleType, value: handle)
        callUpdate.supportsHolding = supportsHolding
        callUpdate.supportsDTMF = supportsDTMF
        callUpdate.supportsGrouping = supportsGrouping
        callUpdate.supportsUngrouping = supportsUngrouping
        callUpdate.hasVideo = hasVideo
        callUpdate.localizedCallerName = localizedCallerName

        provider.reportNewIncomingCall(with: uuid, update: callUpdate) { error in
            CallingxLog.core.debugPublic("[reportNewIncomingCall] callId = \(callId), error = \(String(describing: error))")
            let errorCode = error != nil ? CallKitBackend.getIncomingCallErrorCode(error!) : ""

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
                self.scheduleUnansweredCallTimeout(callId: callId, uuid: uuid)
                resolve?(true)
            } else {
              reject?("DISPLAY_INCOMING_CALL_ERROR", error?.localizedDescription, error)
            }

            completion?()
        }
    }

    func endCall(_ callId: String, reason: Int) {
        CallingxLog.core.debugPublic("[endCall] callId = \(callId) reason = \(reason)")

        guard let call = uuidStorage?.getCall(forCid: callId) else {
            CallingxLog.core.debugPublic("[endCall] callId not found")
            return
        }

        call.markEnded()

        // CXCallEndedReason raw values: failed=1, remoteEnded=2, unanswered=3, answeredElsewhere=4, declinedElsewhere=5
        let endedReason = CXCallEndedReason(rawValue: reason) ?? .failed

        provider.reportCall(with: call.uuid, endedAt: call.endedAt ?? Date(), reason: endedReason)
        uuidStorage?.removeCid(callId)
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
            self.endCall(callId, reason: CXCallEndedReason.unanswered.rawValue)
        }
    }

    private static func getIncomingCallErrorCode(_ error: Error) -> String {
        let nsError = error as NSError
        switch nsError.code {
        case CXErrorCodeIncomingCallError.unentitled.rawValue:
            return "Unentitled"
        case CXErrorCodeIncomingCallError.callUUIDAlreadyExists.rawValue:
            return "CallUUIDAlreadyExists"
        case CXErrorCodeIncomingCallError.filteredByDoNotDisturb.rawValue:
            return "FilteredByDoNotDisturb"
        case CXErrorCodeIncomingCallError.filteredByBlockList.rawValue:
            return "FilteredByBlockList"
        default:
            return "Unknown"
        }
    }

    // MARK: - Call Management
    private func requestTransaction(_ transaction: CXTransaction) {
        CallingxLog.core.debugPublic("[requestTransaction] transaction = \(transaction)")

        callController.request(transaction) { [weak self] error in
            if let error = error {
                CallingxLog.core.errorPublic("[requestTransaction] Error requesting transaction (\(transaction.actions)): (\(error))")

                // Reset per-call action-source flags for all actions in the failed transaction
                for action in transaction.actions {
                    if let mutedAction = action as? CXSetMutedCallAction {
                        self?.pendingActionsQueue.sync {
                            _ = self?.appInitiatedMuteActionIds.remove(mutedAction.uuid)
                        }
                    }
                    if let callAction = action as? CXCallAction,
                       let call = self?.uuidStorage?.getCallByUUID(callAction.callUUID) {
                        call.resetAllSelfFlags()
                    }
                }
            } else {
                CallingxLog.core.debugPublic("[requestTransaction] Requested transaction successfully")

                if let startCallAction = transaction.actions.first as? CXStartCallAction {
                    let callUpdate = CXCallUpdate()
                    callUpdate.remoteHandle = startCallAction.handle
                    callUpdate.hasVideo = startCallAction.isVideo
                    callUpdate.localizedCallerName = startCallAction.contactIdentifier
                    callUpdate.supportsDTMF = false
                    callUpdate.supportsHolding = false
                    callUpdate.supportsGrouping = false
                    callUpdate.supportsUngrouping = false

                    self?.provider.reportCall(with: startCallAction.callUUID, updated: callUpdate)
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

        // Guard: already answered or ended — prevent duplicate CXAnswerCallAction transactions
        if call.isAnswered || call.hasEnded {
            CallingxLog.core.debugPublic("[answerIncomingCall] callId already answered/ended, skipping")
            return true
        }

        call.markSelfAnswered()
        call.markStartedConnecting() // internal state: incoming call is now connecting

        let answerCallAction = CXAnswerCallAction(call: call.uuid)
        let transaction = CXTransaction()
        transaction.addAction(answerCallAction)

        requestTransaction(transaction)
        return true
    }

    func endCall(_ callId: String) -> Bool {
        CallingxLog.core.debugPublic("[endCall] callId = \(callId)")

        guard let call = uuidStorage?.getCall(forCid: callId) else {
            CallingxLog.core.debugPublic("[endCall] callId not found")
            return false
        }

        // Guard: already ended — prevent duplicate CXEndCallAction transactions
        if call.hasEnded {
            CallingxLog.core.debugPublic("[endCall] callId already ended, skipping")
            return true
        }

        call.markSelfEnded()
        call.markEnded()

        let endCallAction = CXEndCallAction(call: call.uuid)
        let transaction = CXTransaction(action: endCallAction)

        requestTransaction(transaction)
        return true
    }

    func setCurrentCallActive(_ callId: String) -> Bool {
        CallingxLog.core.debugPublic("[setCurrentCallActive] callId = \(callId)")

        guard let call = uuidStorage?.getCall(forCid: callId) else {
            CallingxLog.core.debugPublic("[setCurrentCallActive] callId not found")
            return false
        }

        call.markConnected()

        // Report connected timestamp to CallKit.
        // startedConnectingAt is reported separately in the CXStartCallAction delegate.
        provider.reportOutgoingCall(with: call.uuid, connectedAt: call.connectedAt ?? Date())
        return true
    }

    func setMutedCall(_ callId: String, isMuted: Bool) -> Bool {
        CallingxLog.core.debugPublic("[setMutedCall] muted = \(isMuted)")
        guard let call = uuidStorage?.getCall(forCid: callId) else {
            CallingxLog.core.debugPublic("[setMutedCall] callId not found")
            return false
        }

        let setMutedAction = CXSetMutedCallAction(call: call.uuid, muted: isMuted)
        // Record the action UUID so the perform delegate can recognize this as app-initiated
        // (and skip echoing it back to JS) without racing on a shared per-call flag.
        pendingActionsQueue.sync {
            _ = appInitiatedMuteActionIds.insert(setMutedAction.uuid)
        }
        let transaction = CXTransaction()
        transaction.addAction(setMutedAction)

        requestTransaction(transaction)
        return true
    }

    func setOnHoldCall(_ callId: String, isOnHold: Bool) -> Bool {
        CallingxLog.core.debugPublic("[setOnHold] uuidString = \(callId), shouldHold = \(isOnHold)")

        guard let uuid = uuidStorage?.getUUID(forCid: callId) else {
            CallingxLog.core.debugPublic("[setOnHoldCall] callId not found")
            return false
        }

        let setHeldCallAction = CXSetHeldCallAction(call: uuid, onHold: isOnHold)
        let transaction = CXTransaction()
        transaction.addAction(setHeldCallAction)

        requestTransaction(transaction)
        return true
    }

    func startCall(
        callId: String,
        phoneNumber: String,
        callerName: String,
        hasVideo: Bool
    ) {
        CallingxLog.core.debugPublic("[startCall] uuidString = \(callId), phoneNumber = \(phoneNumber)")

        guard let storage = uuidStorage else { return }

        if (storage.containsCid(callId)) {
          CallingxLog.core.debugPublic("[startCall] Call \(callId) is already registered")
          return
        }

        provider.configuration = Settings.getProviderConfiguration()

        let call = storage.getOrCreateCall(forCid: callId, isOutgoing: true)
        call.markStartedConnecting() // outgoing: will be reported via reportOutgoingCall(startedConnectingAt:)

        let handleTypeString = Settings.getSettings()["handleType"] as? String
        let handleType: CXHandle.HandleType = Settings.getHandleType(handleTypeString ?? "generic")
        let callHandle = CXHandle(type: handleType, value: phoneNumber)
        let startCallAction = CXStartCallAction(call: call.uuid, handle: callHandle)
        startCallAction.isVideo = hasVideo
        startCallAction.contactIdentifier = callerName

        let transaction = CXTransaction(action: startCallAction)
        requestTransaction(transaction)
    }

    func updateDisplay(
        callId: String,
        phoneNumber: String,
        callerName: String
    ) -> Bool {
        CallingxLog.core.debugPublic("[updateDisplay] uuidString = \(callId) displayName = \(callerName) uri = \(phoneNumber)")

        guard let uuid = uuidStorage?.getUUID(forCid: callId) else {
            CallingxLog.core.debugPublic("[updateDisplay] callId not found")
            return false
        }

        let handleTypeString = Settings.getSettings()["handleType"] as? String
        let handleType: CXHandle.HandleType = Settings.getHandleType(handleTypeString ?? "generic")
        let callHandle = CXHandle(type: handleType, value: phoneNumber)
        let callUpdate = CXCallUpdate()
        callUpdate.localizedCallerName = callerName
        callUpdate.remoteHandle = callHandle

        provider.reportCall(with: uuid, updated: callUpdate)
        return true
    }

    // MARK: - Pending Action Fulfillment

    func fulfillAnswerCallAction(_ callId: String, didFail: Bool) {
        pendingActionsQueue.sync {
            guard let pending = pendingAnswerActions.removeValue(forKey: callId) else {
                CallingxLog.core.debugPublic("[fulfillAnswerCallAction] action not found for callId: \(callId)")
                return
            }
            let elapsedMs = elapsedMilliseconds(since: pending.enqueuedAt)
            CallingxLog.core.debugPublic("[fulfillAnswerCallAction] callId: \(callId), didFail: \(didFail), elapsedMs=\(elapsedMs)")
            if didFail { pending.action.fail() } else { pending.action.fulfill() }
        }
    }

    func fulfillEndCallAction(_ callId: String, didFail: Bool) {
        pendingActionsQueue.sync {
            guard let pending = pendingEndActions.removeValue(forKey: callId) else {
                CallingxLog.core.debugPublic("[fulfillEndCallAction] action not found for callId: \(callId)")
                return
            }
            let elapsedMs = elapsedMilliseconds(since: pending.enqueuedAt)
            CallingxLog.core.debugPublic("[fulfillEndCallAction] callId: \(callId), didFail: \(didFail), elapsedMs=\(elapsedMs)")
            if didFail { pending.action.fail() } else { pending.action.fulfill() }
        }
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

// MARK: - CXCallObserverDelegate
extension CallKitBackend: CXCallObserverDelegate {
    /// IMPORTANT: delivered on `callObserverQueue`, NEVER call `liveCallUUIDs()` from here —
    /// re-entering the serial queue would deadlock.
    func callObserver(_ callObserver: CXCallObserver, callChanged call: CXCall) {
        if call.hasEnded {
            liveCallKitUUIDs.remove(call.uuid)
        } else {
            liveCallKitUUIDs.insert(call.uuid)
        }
    }
}

// MARK: - CXProviderDelegate
extension CallKitBackend: CXProviderDelegate {
    func provider(_ provider: CXProvider, perform action: CXStartCallAction) {
        CallingxLog.core.debugPublic("[CXProviderDelegate][provider:performStartCallAction]")

        guard let call = uuidStorage?.getCallByUUID(action.callUUID) else {
            CallingxLog.core.debugPublic("[CXProviderDelegate][provider:performStartCallAction] callId not found")
            action.fail()
            return
        }

        // Claim audio-session ownership BEFORE applySystemCallConfigurationSync:
        // both can synchronously fire .didDisableAudioEngine / .willEnableAudioEngine
        // through the ADM publisher. The engine sink gates on this flag.
        CallingxSessionOwnership.callingxOwnsSession = true
        // Gate the audio engine off until CallKit activates the AVAudioSession
        // (provider:didActivate:). Prevents the engine starting on the wrong,
        // CallKit-restricted timing.
        setDesiredEngineAvailability(.none)
        AudioSessionManager.shared.applySystemCallConfigurationSync()

        sendEvent(CallingxEvents.didReceiveStartCallAction, body: [
            "callId": call.cid,
            "handle": action.handle.value
        ])

        action.fulfill()

        // Report startedConnectingAt to CallKit now that the action is fulfilled.
        // The timestamp was set in startCall when the call was created.
        provider.reportOutgoingCall(with: call.uuid, startedConnectingAt: call.startedConnectingAt ?? Date())
    }

    func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
        guard let call = uuidStorage?.getCallByUUID(action.callUUID) else {
            CallingxLog.core.debugPublic("[CXProviderDelegate][provider:performAnswerCallAction] callId not found")
            action.fail()
            return
        }

        CallingxLog.core.debugPublic("[CXProviderDelegate][provider:performAnswerCallAction] isSelfAnswered: \(call.isSelfAnswered)")
        // Claim audio-session ownership BEFORE applySystemCallConfigurationSync:
        // it can synchronously fire .didDisableAudioEngine / .willEnableAudioEngine
        // through the ADM publisher. The engine sink gates on this flag.
        CallingxSessionOwnership.callingxOwnsSession = true
        // Gate the audio engine off until CallKit activates the AVAudioSession
        // (provider:didActivate:). Prevents the engine starting on the wrong,
        // CallKit-restricted timing.
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
            action.fulfill()
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
                    CallingxLog.core.debugPublic("[CXProviderDelegate][provider:performAnswerCallAction] answer timeout for callId: \(cid)")
                    pending.action.fail()
                }
            }
        }
    }

    func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
        guard let call = uuidStorage?.getCallByUUID(action.callUUID) else {
            CallingxLog.core.debugPublic("[CXProviderDelegate][provider:performEndCallAction] callId not found")
            // End actions represent explicit user intent to close call UI.
            // Fulfill stale/duplicate end actions to avoid "Call Failed" UX.
            action.fulfill()
            return
        }

        CallingxLog.core.debugPublic("[CXProviderDelegate][provider:performEndCallAction] isSelfEnded: \(call.isSelfEnded)")

        let source = call.isSelfEnded ? "app" : "sys"
        sendEvent(CallingxEvents.performEndCallAction, body: [
            "callId": call.cid,
            "source": source
        ])

        call.resetSelfEnded()
        call.markEnded()
        uuidStorage?.removeCid(call.cid)
        // Forget this call's mute intent so its stale value can't be read as an echo next call.
        pendingActionsQueue.sync { lastAppRequestedMute = nil }

        if source == "app" {
            // App initiated this end — no need to wait for JS, fulfill immediately
            action.fulfill()
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
                    CallingxLog.core.debugPublic("[CXProviderDelegate][provider:performEndCallAction] end timeout for callId: \(cid)")
                    pending.action.fulfill()
                }
            }
        }
    }

    func provider(_ provider: CXProvider, perform action: CXSetHeldCallAction) {
        CallingxLog.core.debugPublic("[CXProviderDelegate][provider:performSetHeldCallAction]")

        guard let callId = uuidStorage?.getCid(forUUID: action.callUUID) else {
            CallingxLog.core.debugPublic("[CXProviderDelegate][provider:performSetHeldCallAction] callId not found")
            action.fail()
            return
        }

        sendEvent(CallingxEvents.didToggleHoldAction, body: [
            "hold": action.isOnHold,
            "callId": callId
        ])

        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXSetMutedCallAction) {
        guard let call = uuidStorage?.getCallByUUID(action.callUUID) else {
            CallingxLog.core.debugPublic("[CXProviderDelegate][provider:performSetMutedCallAction] callId not found")
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

        CallingxLog.core.debugPublic("[CXProviderDelegate][provider:performSetMutedCallAction] \(action.isMuted) isAppInitiated: \(isAppInitiated) suppressDuringStartup: \(suppressDuringStartup) isMuteEcho: \(isMuteEcho)")
        // Forward to JS only genuine system mutes (user tapped native CallKit UI). Skip app-initiated
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

    func provider(_ provider: CXProvider, perform action: CXPlayDTMFCallAction) {
        CallingxLog.core.debugPublic("[CXProviderDelegate][provider:performPlayDTMFCallAction]")

        guard let callId = uuidStorage?.getCid(forUUID: action.callUUID) else {
            CallingxLog.core.debugPublic("[CXProviderDelegate][provider:performPlayDTMFCallAction] callId not found")
            action.fail()
            return
        }

        sendEvent(CallingxEvents.performPlayDTMFCallAction, body: [
            "digits": action.digits,
            "callId": callId
        ])

        action.fulfill()
    }

    func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) {
        CallingxLog.core.debugPublic("[CXProviderDelegate][provider:didActivateAudioSession] category=\(audioSession.category) mode=\(audioSession.mode)")
        // Re-claim ownership BEFORE notifying WebRTC. Handles the PSTN/Siri
        // interruption-resume case: didDeactivate cleared the flag if the call
        // had ended, but for an interruption the call is still tracked and
        // ownership was preserved — re-asserting here is a no-op then, and
        // closes any edge case where it had been cleared.
        CallingxSessionOwnership.callingxOwnsSession = true

        // CallKit may activate with its own category/mode; re-apply VoIP preset
        AudioSessionManager.shared.applySystemCallConfigurationSync()

        // CallKit owns the session timing now — allow the audio engine to start.
        setDesiredEngineAvailability(.default)

        // When CallKit activates the AVAudioSession, inform WebRTC as well.
        RTCAudioSession.sharedInstance().audioSessionDidActivate(audioSession)

        // Enable wake lock to keep the device awake during the call
        DispatchQueue.main.async {
            UIApplication.shared.isIdleTimerDisabled = true
        }

        sendEvent(CallingxEvents.didActivateAudioSession, body: nil)
    }

    func provider(_ provider: CXProvider, didDeactivate audioSession: AVAudioSession) {
        CallingxLog.core.debugPublic("[CXProviderDelegate][provider:didDeactivateAudioSession] category=\(audioSession.category) mode=\(audioSession.mode)")

        // do not let webrtc audio engine auto start until after provider:didActivate:.
        setDesiredEngineAvailability(.none)

        // When CallKit deactivates the AVAudioSession, inform WebRTC as well.
        RTCAudioSession.sharedInstance().audioSessionDidDeactivate(audioSession)

        // Invariant: callingx ships with maximumCallsPerCallGroup = maximumCallGroups = 1
        // (see packages/react-native-callingx/src/utils/constants.ts defaultiOSOptions).
        // So `UUIDStorage.count() == 0` reliably distinguishes:
        //   - true end-of-call (call removed in CXEndCallAction.perform before didDeactivate)
        //   - PSTN/Siri interruption (call still tracked, will resume via didActivate)
        // Do NOT "fix" this to handle multi-call semantics — the product does not support
        // concurrent CallKit calls. See plan: critically-review-the-implementation-zesty-spindle.
        if let storage = uuidStorage, storage.count() == 0 {
            CallingxSessionOwnership.callingxOwnsSession = false
            AudioSessionManager.shared.stopRouteObserver()
        }

        // Disable wake lock when the call ends
        DispatchQueue.main.async {
            UIApplication.shared.isIdleTimerDisabled = false
        }

        sendEvent(CallingxEvents.didDeactivateAudioSession, body: nil)
    }

    func provider(_ provider: CXProvider, timedOutPerforming action: CXAction) {
        // note: in practice we should never be getting this callback as we already have a pending timeout set.
        // in our tests callkit timesout and exectutes this method in approximately 60 seconds.
        CallingxLog.core.debugPublic("[CXProviderDelegate][provider:timedOutPerformingAction]")

        guard let callAction = action as? CXCallAction else {
            return
        }

        pendingActionsQueue.sync {
            // cid mapping as soon as end is initiated, so cleanup by matching callUUID.
            if let answerEntry = pendingAnswerActions.first(where: { $0.value.action.callUUID == callAction.callUUID }) {
                pendingAnswerActions.removeValue(forKey: answerEntry.key)
                let elapsedMs = elapsedMilliseconds(since: answerEntry.value.enqueuedAt)
                CallingxLog.core.debugPublic("[CXProviderDelegate][provider:timedOutPerformingAction] removed pending answer action for callId: \(answerEntry.key), elapsedMs=\(elapsedMs)")
            }

            if let endEntry = pendingEndActions.first(where: { $0.value.action.callUUID == callAction.callUUID }) {
                pendingEndActions.removeValue(forKey: endEntry.key)
                let elapsedMs = elapsedMilliseconds(since: endEntry.value.enqueuedAt)
                CallingxLog.core.debugPublic("[CXProviderDelegate][provider:timedOutPerformingAction] removed pending end action for callId: \(endEntry.key), elapsedMs=\(elapsedMs)")
            }
        }
    }

    func providerDidReset(_ provider: CXProvider) {
        CallingxLog.core.debugPublic("[providerDidReset]")

        // Clear any pending actions to prevent memory leaks.
        // After a provider reset, all pending CXActions are invalid.
        pendingActionsQueue.sync {
            pendingAnswerActions.removeAll()
            pendingEndActions.removeAll()
            lastAppRequestedMute = nil
        }

        // Snapshot the tracked cids before wiping storage: JS leaves exactly the calls CallKit was tracking.
        let trackedCids = uuidStorage?.allCids() ?? []
        CallingxSessionOwnership.callingxOwnsSession = false
        uuidStorage?.removeAllObjects()
        AudioSessionManager.shared.stopRouteObserver()

        sendEvent(CallingxEvents.providerReset, body: ["callCids": trackedCids])
    }
}
