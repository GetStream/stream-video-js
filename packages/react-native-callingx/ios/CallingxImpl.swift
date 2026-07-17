import Foundation
import CallKit
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
@objc public class CallingxImpl: NSObject, CXProviderDelegate {

    // MARK: - Shared State
    @objc public static var sharedProvider: CXProvider?
    @objc public static var uuidStorage: UUIDStorage?
    @objc public static var sharedInstance: CallingxImpl?
    /// Events stored before the module instance exists (e.g. VoIP from killed state). Drained in getInitialEvents().
    private static var delayedEvents: [[String: Any]] = []

    // MARK: - Instance Properties
    @objc public var callKeepCallController: CXCallController?
    @objc public var callKeepProvider: CXProvider?
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
        
        if CallingxImpl.sharedProvider == nil {
            CallingxImpl.sharedProvider = CXProvider(configuration: Settings.getProviderConfiguration())
        }
      
        callKeepCallController = CXCallController()
        
        callKeepProvider = CallingxImpl.sharedProvider
        callKeepProvider?.setDelegate(nil, queue: nil)
        callKeepProvider?.setDelegate(self, queue: nil)
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
        engineSubscription?.cancel()
        engineSubscription = nil

        callKeepProvider?.setDelegate(nil, queue: nil)
        callKeepProvider?.invalidate()
        CallingxImpl.sharedProvider = nil
        canSendEvents = false
        isSetup = false
    }
    
    // MARK: - Class Methods
    @objc public static func initializeIfNeeded() {
        _ = getSharedInstance() // ensures the shared instance is created and CXProvider delegate is set
        CallingxImpl.sharedProvider?.configuration = Settings.getProviderConfiguration()
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
        
        guard let storage = uuidStorage else { return }
        
        if storage.containsCid(callId) {
            CallingxLog.core.debugPublic("[reportNewIncomingCall] callId already exists")
            completion?()
            resolve?(true)
            return
        }
        
        let cxHandleType = Settings.getHandleType(handleType)
        let uuid = storage.getOrCreateUUID(forCid: callId)
        let callUpdate = CXCallUpdate()
        callUpdate.remoteHandle = CXHandle(type: cxHandleType, value: handle)
        callUpdate.supportsHolding = supportsHolding
        callUpdate.supportsDTMF = supportsDTMF
        callUpdate.supportsGrouping = supportsGrouping
        callUpdate.supportsUngrouping = supportsUngrouping
        callUpdate.hasVideo = hasVideo
        callUpdate.localizedCallerName = localizedCallerName
        
        sharedProvider?.reportNewIncomingCall(with: uuid, update: callUpdate) { error in
            CallingxLog.core.debugPublic("[reportNewIncomingCall] callId = \(callId), error = \(String(describing: error))")
            let errorCode = error != nil ? CallingxImpl.getIncomingCallErrorCode(error!) : ""
            
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
                resolve?(true)
            } else {
              reject?("DISPLAY_INCOMING_CALL_ERROR", error?.localizedDescription, error)
            }
            
            completion?()
        }
    }
    
    @objc public static func canRegisterCall() -> Bool {
        let shouldReject = Settings.getShouldRejectCallWhenBusy()
        guard shouldReject else { return true }
        return !hasRegisteredCall()
    }

    @objc public static func hasRegisteredCall() -> Bool {
        // Backed by the warm CXCallObserver maintained in UUIDStorage — no per-call observer
        // construction and no cold-snapshot misses. Intersects our calls with CallKit's live set.
        return uuidStorage?.hasRegisteredCall() ?? false
    }
    
    @objc public static func endCall(_ callId: String, reason: Int) {
        CallingxLog.core.debugPublic("[endCall] callId = \(callId) reason = \(reason)")
        
        guard let call = uuidStorage?.getCall(forCid: callId) else {
            CallingxLog.core.debugPublic("[endCall] callId not found")
            return
        }
        
        call.markEnded()
        
        // CXCallEndedReason raw values: failed=1, remoteEnded=2, unanswered=3, answeredElsewhere=4, declinedElsewhere=5
        let endedReason = CXCallEndedReason(rawValue: reason) ?? .failed
        
        sharedProvider?.reportCall(with: call.uuid, endedAt: call.endedAt ?? Date(), reason: endedReason)
        uuidStorage?.removeCid(callId)
    }
    
    @objc public static func getIncomingCallErrorCode(_ error: Error) -> String {
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
    
    // MARK: - Instance Methods
    @objc public func requestTransaction(_ transaction: CXTransaction) {
        CallingxLog.core.debugPublic("[requestTransaction] transaction = \(transaction)")
        
        if callKeepCallController == nil {
            callKeepCallController = CXCallController()
        }
        
        callKeepCallController?.request(transaction) { [weak self] error in
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
                       let call = CallingxImpl.uuidStorage?.getCallByUUID(callAction.callUUID) {
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
                    
                    self?.callKeepProvider?.reportCall(with: startCallAction.callUUID, updated: callUpdate)
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
        CallingxImpl.sharedProvider?.configuration = Settings.getProviderConfiguration()
        isSetup = true
    }

    /// Wires the ADM engine-lifecycle subscription. Call after `webRTCModule` is injected
    /// (it's nil during `setup()` on the callingx path). Re-wires when the ADM changes — a JS
    /// reload recreates WebRTCModule while this singleton persists; a no-op for the same ADM.
    @objc public func wireEngineSubscription() {
        guard let adm = getAudioDeviceModule() else { return }
        guard subscribedADM !== adm else { return } // already wired to this ADM
        engineSubscription?.cancel()                // ADM changed (e.g. JS reload) — rewire
        subscribedADM = adm
        CallingxLog.core.debugPublic("[wireEngineSubscription]")

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
    
    @objc public func displayIncomingCall(
        callId: String,
        phoneNumber: String,
        callerName: String,
        hasVideo: Bool,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        let uuid = CallingxImpl.uuidStorage?.getUUID(forCid: callId)
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
        
        let wasAlreadyAnswered = uuid != nil
        if !wasAlreadyAnswered {
            let settings = Settings.getSettings()
            if let timeout = settings["displayCallTimeout"] as? Int {
                let popTime = DispatchTime.now() + .milliseconds(timeout)
                DispatchQueue.main.asyncAfter(deadline: popTime) { [weak self] in
                    guard let self = self, !self.isSetup else { return }
                    CallingxLog.core.debugPublic("Displayed a call without a reachable app, ending the call: \(callId)")
                    CallingxImpl.endCall(callId, reason: CXCallEndedReason.failed.rawValue)
                }
            }
        }
    }
    
    @objc public func endCall(_ callId: String) -> Bool {
        CallingxLog.core.debugPublic("[endCall] callId = \(callId)")
        
        guard let call = CallingxImpl.uuidStorage?.getCall(forCid: callId) else {
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
    
    @objc public func isCallTracked(_ callId: String) -> Bool {
        // Backed by the warm CXCallObserver in UUIDStorage — no per-call observer construction
        // and no cold-snapshot misses. True when the call is tracked AND confirmed live by CallKit.
        return CallingxImpl.uuidStorage?.isCallTracked(forCid: callId) ?? false
    }
    
    @objc public func setCurrentCallActive(_ callId: String) -> Bool {
        CallingxLog.core.debugPublic("[setCurrentCallActive] callId = \(callId)")
      
        guard let call = CallingxImpl.uuidStorage?.getCall(forCid: callId) else {
            CallingxLog.core.debugPublic("[setCurrentCallActive] callId not found")
            return false
        }
        
        call.markConnected()
        
        // Report connected timestamp to CallKit.
        // startedConnectingAt is reported separately in the CXStartCallAction delegate.
        callKeepProvider?.reportOutgoingCall(with: call.uuid, connectedAt: call.connectedAt ?? Date())
        return true
    }
    
    @objc public func setMutedCall(_ callId: String, isMuted: Bool) -> Bool {
        CallingxLog.core.debugPublic("[setMutedCall] muted = \(isMuted)")
        guard let call = CallingxImpl.uuidStorage?.getCall(forCid: callId) else {
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
    
    @objc public func setOnHoldCall(_ callId: String, isOnHold: Bool) -> Bool {
        CallingxLog.core.debugPublic("[setOnHold] uuidString = \(callId), shouldHold = \(isOnHold)")
        
        guard let uuid = CallingxImpl.uuidStorage?.getUUID(forCid: callId) else {
            CallingxLog.core.debugPublic("[setOnHoldCall] callId not found")
            return false
        }
        
        let setHeldCallAction = CXSetHeldCallAction(call: uuid, onHold: isOnHold)
        let transaction = CXTransaction()
        transaction.addAction(setHeldCallAction)
        
        requestTransaction(transaction)
        return true
    }
    
    @objc public func startCall(
        callId: String,
        phoneNumber: String,
        callerName: String,
        hasVideo: Bool
    ) {
        CallingxLog.core.debugPublic("[startCall] uuidString = \(callId), phoneNumber = \(phoneNumber)")
        
        guard let storage = CallingxImpl.uuidStorage else { return }
      
        if (storage.containsCid(callId)) {
          CallingxLog.core.debugPublic("[startCall] Call \(callId) is already registered")
          return
        }
        
        CallingxImpl.sharedProvider?.configuration = Settings.getProviderConfiguration()
      
        let call = storage.getOrCreateCall(forCid: callId, isOutgoing: true)
        call.markStartedConnecting() // outgoing: will be reported via reportOutgoingCall(startedConnectingAt:)
        
        let handleTypeString = Settings.getSettings()["handleType"] as? String
        let handleType = Settings.getHandleType(handleTypeString ?? "generic")
        let callHandle = CXHandle(type: handleType, value: phoneNumber)
        let startCallAction = CXStartCallAction(call: call.uuid, handle: callHandle)
        startCallAction.isVideo = hasVideo
        startCallAction.contactIdentifier = callerName
        
        let transaction = CXTransaction(action: startCallAction)
        requestTransaction(transaction)
    }
    
    @objc public func updateDisplay(
        callId: String,
        phoneNumber: String,
        callerName: String
    ) -> Bool {
        CallingxLog.core.debugPublic("[updateDisplay] uuidString = \(callId) displayName = \(callerName) uri = \(phoneNumber)")
        
        guard let uuid = CallingxImpl.uuidStorage?.getUUID(forCid: callId) else {
            CallingxLog.core.debugPublic("[updateDisplay] callId not found")
            return false
        }
        
        let handleTypeString = Settings.getSettings()["handleType"] as? String
        let handleType = Settings.getHandleType(handleTypeString ?? "generic")
        let callHandle = CXHandle(type: handleType, value: phoneNumber)
        let callUpdate = CXCallUpdate()
        callUpdate.localizedCallerName = callerName
        callUpdate.remoteHandle = callHandle
        
        callKeepProvider?.reportCall(with: uuid, updated: callUpdate)
        return true
    }
    
    // MARK: - CXProviderDelegate
    public func provider(_ provider: CXProvider, perform action: CXStartCallAction) {
        CallingxLog.core.debugPublic("[CXProviderDelegate][provider:performStartCallAction]")

        guard let call = CallingxImpl.uuidStorage?.getCallByUUID(action.callUUID) else {
            CallingxLog.core.debugPublic("[CXProviderDelegate][provider:performStartCallAction] callId not found")
            action.fail()
            return
        }

        // Claim audio-session ownership BEFORE applyCallKitConfigurationSync:
        // both can synchronously fire .didDisableAudioEngine / .willEnableAudioEngine
        // through the ADM publisher. The engine sink gates on this flag.
        CallingxSessionOwnership.callingxOwnsSession = true
        // Gate the audio engine off until CallKit activates the AVAudioSession
        // (provider:didActivate:). Prevents the engine starting on the wrong,
        // CallKit-restricted timing.
        _ = getAudioDeviceModule()?.setEngineAvailability(.none)
        AudioSessionManager.shared.applyCallKitConfigurationSync()

        sendEvent(CallingxEvents.didReceiveStartCallAction, body: [
            "callId": call.cid,
            "handle": action.handle.value
        ])
        
        action.fulfill()
        
        // Report startedConnectingAt to CallKit now that the action is fulfilled.
        // The timestamp was set in startCall when the call was created.
        callKeepProvider?.reportOutgoingCall(with: call.uuid, startedConnectingAt: call.startedConnectingAt ?? Date())
    }
    
    public func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
        guard let call = CallingxImpl.uuidStorage?.getCallByUUID(action.callUUID) else {
            CallingxLog.core.debugPublic("[CXProviderDelegate][provider:performAnswerCallAction] callId not found")
            action.fail()
            return
        }
        
        CallingxLog.core.debugPublic("[CXProviderDelegate][provider:performAnswerCallAction] isSelfAnswered: \(call.isSelfAnswered)")
        // Claim audio-session ownership BEFORE applyCallKitConfigurationSync:
        // it can synchronously fire .didDisableAudioEngine / .willEnableAudioEngine
        // through the ADM publisher. The engine sink gates on this flag.
        CallingxSessionOwnership.callingxOwnsSession = true
        // Gate the audio engine off until CallKit activates the AVAudioSession
        // (provider:didActivate:). Prevents the engine starting on the wrong,
        // CallKit-restricted timing.
        _ = getAudioDeviceModule()?.setEngineAvailability(.none)
        AudioSessionManager.shared.applyCallKitConfigurationSync()

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

    public func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
        guard let call = CallingxImpl.uuidStorage?.getCallByUUID(action.callUUID) else {
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
        CallingxImpl.uuidStorage?.removeCid(call.cid)
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
    
    public func provider(_ provider: CXProvider, perform action: CXSetHeldCallAction) {
        CallingxLog.core.debugPublic("[CXProviderDelegate][provider:performSetHeldCallAction]")
        
        guard let callId = CallingxImpl.uuidStorage?.getCid(forUUID: action.callUUID) else {
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
    
    public func provider(_ provider: CXProvider, perform action: CXSetMutedCallAction) {
        guard let call = CallingxImpl.uuidStorage?.getCallByUUID(action.callUUID) else {
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
  
    public func provider(_ provider: CXProvider, perform action: CXPlayDTMFCallAction) {
        CallingxLog.core.debugPublic("[CXProviderDelegate][provider:performPlayDTMFCallAction]")
        
        guard let callId = CallingxImpl.uuidStorage?.getCid(forUUID: action.callUUID) else {
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
    
    public func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) {
        CallingxLog.core.debugPublic("[CXProviderDelegate][provider:didActivateAudioSession] category=\(audioSession.category) mode=\(audioSession.mode)")
        // Re-claim ownership BEFORE notifying WebRTC. Handles the PSTN/Siri
        // interruption-resume case: didDeactivate cleared the flag if the call
        // had ended, but for an interruption the call is still tracked and
        // ownership was preserved — re-asserting here is a no-op then, and
        // closes any edge case where it had been cleared.
        CallingxSessionOwnership.callingxOwnsSession = true

        // CallKit may activate with its own category/mode; re-apply VoIP preset
        AudioSessionManager.shared.applyCallKitConfigurationSync()

        // CallKit owns the session timing now — allow the audio engine to start.
        _ = getAudioDeviceModule()?.setEngineAvailability(.default)

        // When CallKit activates the AVAudioSession, inform WebRTC as well.
        RTCAudioSession.sharedInstance().audioSessionDidActivate(audioSession)

        // Enable wake lock to keep the device awake during the call
        DispatchQueue.main.async {
            UIApplication.shared.isIdleTimerDisabled = true
        }

        sendEvent(CallingxEvents.didActivateAudioSession, body: nil)
    }
    
    public func provider(_ provider: CXProvider, didDeactivate audioSession: AVAudioSession) {
        CallingxLog.core.debugPublic("[CXProviderDelegate][provider:didDeactivateAudioSession] category=\(audioSession.category) mode=\(audioSession.mode)")

        // do not let webrtc audio engine auto start until after provider:didActivate:.
        _ = getAudioDeviceModule()?.setEngineAvailability(.none)

        // When CallKit deactivates the AVAudioSession, inform WebRTC as well.
        RTCAudioSession.sharedInstance().audioSessionDidDeactivate(audioSession)

        // Invariant: callingx ships with maximumCallsPerCallGroup = maximumCallGroups = 1
        // (see packages/react-native-callingx/src/utils/constants.ts defaultiOSOptions).
        // So `UUIDStorage.count() == 0` reliably distinguishes:
        //   - true end-of-call (call removed in CXEndCallAction.perform before didDeactivate)
        //   - PSTN/Siri interruption (call still tracked, will resume via didActivate)
        // Do NOT "fix" this to handle multi-call semantics — the product does not support
        // concurrent CallKit calls. See plan: critically-review-the-implementation-zesty-spindle.
        if let storage = CallingxImpl.uuidStorage, storage.count() == 0 {
            CallingxSessionOwnership.callingxOwnsSession = false
        }

        // Disable wake lock when the call ends
        DispatchQueue.main.async {
            UIApplication.shared.isIdleTimerDisabled = false
        }

        sendEvent(CallingxEvents.didDeactivateAudioSession, body: nil)
    }
  
    public func provider(_ provider: CXProvider, timedOutPerforming action: CXAction) {
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
  
    public func providerDidReset(_ provider: CXProvider) {
        CallingxLog.core.debugPublic("[providerDidReset]")

        // Clear any pending actions to prevent memory leaks.
        // After a provider reset, all pending CXActions are invalid.
        pendingActionsQueue.sync {
            pendingAnswerActions.removeAll()
            pendingEndActions.removeAll()
            lastAppRequestedMute = nil
        }

        // Snapshot the tracked cids before wiping storage: JS leaves exactly the calls CallKit was tracking. 
        let trackedCids = CallingxImpl.uuidStorage?.allCids() ?? []
        CallingxSessionOwnership.callingxOwnsSession = false
        CallingxImpl.uuidStorage?.removeAllObjects()

        sendEvent(CallingxEvents.providerReset, body: ["callCids": trackedCids])
    }
    
    // MARK: - Pending Action Fulfillment

    @objc public func fulfillAnswerCallAction(_ callId: String, didFail: Bool) {
        pendingActionsQueue.sync { [weak self] in
            guard let pending = self?.pendingAnswerActions.removeValue(forKey: callId) else {
                CallingxLog.core.debugPublic("[fulfillAnswerCallAction] action not found for callId: \(callId)")
                return
            }
            let elapsedMs = elapsedMilliseconds(since: pending.enqueuedAt)
            CallingxLog.core.debugPublic("[fulfillAnswerCallAction] callId: \(callId), didFail: \(didFail), elapsedMs=\(elapsedMs)")
            if didFail { pending.action.fail() } else { pending.action.fulfill() }
        }
    }

    @objc public func fulfillEndCallAction(_ callId: String, didFail: Bool) {
        pendingActionsQueue.sync { [weak self] in
            guard let pending = self?.pendingEndActions.removeValue(forKey: callId) else {
                CallingxLog.core.debugPublic("[fulfillEndCallAction] action not found for callId: \(callId)")
                return
            }
            let elapsedMs = elapsedMilliseconds(since: pending.enqueuedAt)
            CallingxLog.core.debugPublic("[fulfillEndCallAction] callId: \(callId), didFail: \(didFail), elapsedMs=\(elapsedMs)")
            if didFail { pending.action.fail() } else { pending.action.fulfill() }
        }
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

    private func getAudioDeviceModule() -> AudioDeviceModule? {
        guard let adm = webRTCModule?.audioDeviceModule else {
            CallingxLog.core.errorPublic("WebRTCModule is not available. Ensure it was injected from the TurboModule host.")
            return nil
        }
        return adm
    }
}
