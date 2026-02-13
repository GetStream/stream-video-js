import Foundation
import CallKit
import AVFoundation
import UIKit
import stream_react_native_webrtc

// MARK: - Event Names
@objcMembers public class CallingxEvents: NSObject {
    public static let didReceiveStartCallAction = "didReceiveStartCallAction"
    public static let didToggleHoldAction = "didToggleHoldCallAction"
    public static let didPerformSetMutedCallAction = "didPerformSetMutedCallAction"
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
@objc public class CallingxImpl: NSObject, CXProviderDelegate {
    
    // MARK: - Shared State
    @objc public static var sharedProvider: CXProvider?
    @objc public static var uuidStorage: UUIDStorage?
    @objc public static weak var sharedInstance: CallingxImpl?
    /// Events stored before the module instance exists (e.g. VoIP from killed state). Drained in getInitialEvents().
    private static var delayedEvents: [[String: Any]] = []
    
    // MARK: - Instance Properties
    @objc public var callKeepCallController: CXCallController?
    @objc public var callKeepProvider: CXProvider?
    @objc public weak var eventEmitter: CallingxEventEmitter?
    
    private var canSendEvents: Bool = false
    private var isSetup: Bool = false
    
    // MARK: - Initialization
    @objc public override init() {
        super.init()

        isSetup = false
        canSendEvents = false
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onAudioRouteChange(_:)),
            name: AVAudioSession.routeChangeNotification,
            object: nil
        )
        
        CallingxImpl.sharedInstance = self
        CallingxImpl.initializeIfNeeded()
        
        callKeepProvider = CallingxImpl.sharedProvider
        callKeepProvider?.setDelegate(nil, queue: nil)
        callKeepProvider?.setDelegate(self, queue: nil)
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
        
        callKeepProvider?.setDelegate(nil, queue: nil)
        callKeepProvider?.invalidate()
        CallingxImpl.sharedProvider = nil
        canSendEvents = false
        isSetup = false
    }
    
    // MARK: - Class Methods
    @objc public static func initializeIfNeeded() {
        if uuidStorage == nil {
            uuidStorage = UUIDStorage()
        }
        
        if sharedProvider == nil {
            sharedProvider = CXProvider(configuration: Settings.getProviderConfiguration())
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
        fromPushKit: Bool,
        payload: [String: Any]?,
        completion: (() -> Void)?
    ) {
        initializeIfNeeded()
        
        guard let storage = uuidStorage else { return }
        
        if storage.containsCid(callId) {
            #if DEBUG
            print("[Callingx][reportNewIncomingCall] callId already exists")
            #endif
            completion?()
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
            #if DEBUG
            print("[Callingx][reportNewIncomingCall] callId = \(callId), error = \(String(describing: error))")
            #endif
            
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
                "fromPushKit": fromPushKit ? "1" : "0",
                "payload": payload ?? ""
            ]
            
            if let instance = sharedInstance {
                instance.sendEvent(CallingxEvents.didDisplayIncomingCall, body: body)
            } else {
                let dictionary: [String: Any] = [
                    "eventName": CallingxEvents.didDisplayIncomingCall,
                    "params": body
                ]
                DispatchQueue.main.async {
                    CallingxImpl.delayedEvents.append(dictionary)
                }
            }
            
            if error == nil {
                #if DEBUG
                print("[Callingx][reportNewIncomingCall] success callId = \(callId)")
                #endif
            }
            
            completion?()
        }
    }
    
    @objc public static func canRegisterCall() -> Bool {
        let hasCall = hasRegisteredCall()
        let shouldReject = Settings.getShouldRejectCallWhenBusy()
        return !shouldReject || (shouldReject && !hasCall)
    }
    
    @objc public static func hasRegisteredCall() -> Bool {
        guard let storage = uuidStorage else { return false }
      
        let appUUIDs = storage.allUUIDs()
        if appUUIDs.isEmpty { return false }
        
        let observer = CXCallObserver()
        for call in observer.calls {
            for uuid in appUUIDs {
                if call.uuid == uuid {
                    return true
                }
            }
        }
        return false
    }
    
    @objc public static func getAudioOutput() -> String? {
        let outputs = AVAudioSession.sharedInstance().currentRoute.outputs
        if !outputs.isEmpty {
            return outputs[0].portType.rawValue
        }
        return nil
    }
    
    @objc public static func endCall(_ callId: String, reason: Int) {
        #if DEBUG
        print("[Callingx][endCall] callId = \(callId) reason = \(reason)")
        #endif
        
        guard let call = uuidStorage?.getCall(forCid: callId) else {
            #if DEBUG
            print("[Callingx][endCall] callId not found")
            #endif
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
        #if DEBUG
        print("[Callingx][requestTransaction] transaction = \(transaction)")
        #endif
        
        if callKeepCallController == nil {
            callKeepCallController = CXCallController()
        }
        
        callKeepCallController?.request(transaction) { [weak self] error in
            if let error = error {
                #if DEBUG
                print("[Callingx][requestTransaction] Error requesting transaction (\(transaction.actions)): (\(error))")
                #endif

                // Reset per-call action-source flags for all actions in the failed transaction
                for action in transaction.actions {
                    if let callAction = action as? CXCallAction,
                       let call = CallingxImpl.uuidStorage?.getCallByUUID(callAction.callUUID) {
                        call.resetAllSelfFlags()
                    }
                }
            } else {
                #if DEBUG
                print("[Callingx][requestTransaction] Requested transaction successfully")
                #endif
                
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
        #if DEBUG
        print("[Callingx] sendEventWithNameWrapper: \(name)")
        #endif
        
        let sendEventAction = {
            var dictionary: [String: Any] = ["eventName": name]
            if let body = body {
                dictionary["params"] = body
            }
            
            if self.canSendEvents {
                self.eventEmitter?.emitEvent(dictionary)
            } else {
                CallingxImpl.delayedEvents.append(dictionary)
                #if DEBUG
                print("[Callingx] delayedEvents: \(CallingxImpl.delayedEvents)")
                #endif
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
    
    @objc private func onAudioRouteChange(_ notification: Notification) {
        guard let info = notification.userInfo,
              let reasonValue = info[AVAudioSessionRouteChangeReasonKey] as? UInt,
              let output = CallingxImpl.getAudioOutput() else {
            return
        }
        
        let params: [String: Any] = [
            "output": output,
            "reason": reasonValue
        ]
     
        sendEvent(CallingxEvents.didChangeAudioRoute, body: params)
    }
    
    // MARK: - Setup Methods
    @objc public func setup(options: [String: Any]) {
        callKeepCallController = CXCallController()
        
        Settings.setSettings(options)
        
        CallingxImpl.initializeIfNeeded()
        
        callKeepProvider = CallingxImpl.sharedProvider
        callKeepProvider?.setDelegate(self, queue: nil)
        
        isSetup = true
    }
    
    @objc public func getInitialEvents() -> [[String: Any]] {
        var events: [[String: Any]] = []
        let action = {
            #if DEBUG
            print("[Callingx][getInitialEvents] delayedEvents = \(CallingxImpl.delayedEvents)")
            #endif
            
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
        #if DEBUG
        print("[Callingx][answerIncomingCall] callId = \(callId)")
        #endif
        
        guard let call = CallingxImpl.uuidStorage?.getCall(forCid: callId) else {
            #if DEBUG
            print("[Callingx][answerIncomingCall] callId not found")
            #endif
            return false
        }
        
        // Guard: already answered or ended — prevent duplicate CXAnswerCallAction transactions
        if call.isAnswered || call.hasEnded {
            #if DEBUG
            print("[Callingx][answerIncomingCall] callId already answered/ended, skipping")
            #endif
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
        hasVideo: Bool
    ) -> Bool {
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
            fromPushKit: false,
            payload: nil,
            completion: nil
        )
        
        let wasAlreadyAnswered = uuid != nil
        if !wasAlreadyAnswered {
            let settings = Settings.getSettings()
            if let timeout = settings["displayCallTimeout"] as? Int {
                let popTime = DispatchTime.now() + .milliseconds(timeout)
                DispatchQueue.main.asyncAfter(deadline: popTime) { [weak self] in
                    guard let self = self, !self.isSetup else { return }
                    #if DEBUG
                    print("[Callingx] Displayed a call without a reachable app, ending the call: \(callId)")
                    #endif
                    CallingxImpl.endCall(callId, reason: CXCallEndedReason.failed.rawValue)
                }
            }
        }
        return true
    }
    
    @objc public func endCall(_ callId: String) -> Bool {
        #if DEBUG
        print("[Callingx][endCall] callId = \(callId)")
        #endif
        
        guard let call = CallingxImpl.uuidStorage?.getCall(forCid: callId) else {
            #if DEBUG
            print("[Callingx][endCall] callId not found")
            #endif
            return false
        }
        
        // Guard: already ended — prevent duplicate CXEndCallAction transactions
        if call.hasEnded {
            #if DEBUG
            print("[Callingx][endCall] callId already ended, skipping")
            #endif
            return true
        }
        
        call.markSelfEnded()
        
        let endCallAction = CXEndCallAction(call: call.uuid)
        let transaction = CXTransaction(action: endCallAction)
        
        requestTransaction(transaction)
        return true
    }
    
    @objc public func isCallTracked(_ callId: String) -> Bool {
        guard let uuid = CallingxImpl.uuidStorage?.getUUID(forCid: callId) else {
            #if DEBUG
            print("[Callingx][isCallTracked] callId not found")
            #endif
            return false
        }
        
        let observer = CXCallObserver()
        for call in observer.calls {
            if call.uuid == uuid {
                return true
            }
        }
        return false
    }
    
    @objc public func setCurrentCallActive(_ callId: String) -> Bool {
        #if DEBUG
        print("[Callingx][setCurrentCallActive] callId = \(callId)")
        #endif
      
        guard let call = CallingxImpl.uuidStorage?.getCall(forCid: callId) else {
            #if DEBUG
            print("[Callingx][setCurrentCallActive] callId not found")
            #endif
            return false
        }
        
        call.markConnected()
        
        // Report connected timestamp to CallKit.
        // startedConnectingAt is reported separately in the CXStartCallAction delegate.
        callKeepProvider?.reportOutgoingCall(with: call.uuid, connectedAt: call.connectedAt ?? Date())
        return true
    }
    
    @objc public func setMutedCall(_ callId: String, isMuted: Bool) -> Bool {
        #if DEBUG
        print("[Callingx][setMutedCall] muted = \(isMuted)")
        #endif
        
        guard let call = CallingxImpl.uuidStorage?.getCall(forCid: callId) else {
            #if DEBUG
            print("[Callingx][setMutedCall] callId not found")
            #endif
            return false
        }
        
        call.markSelfMuted()
        let setMutedAction = CXSetMutedCallAction(call: call.uuid, muted: isMuted)
        let transaction = CXTransaction()
        transaction.addAction(setMutedAction)
        
        requestTransaction(transaction)
        return true
    }
    
    @objc public func setOnHoldCall(_ callId: String, isOnHold: Bool) -> Bool {
        #if DEBUG
        print("[Callingx][setOnHold] uuidString = \(callId), shouldHold = \(isOnHold)")
        #endif
        
        guard let uuid = CallingxImpl.uuidStorage?.getUUID(forCid: callId) else {
            #if DEBUG
            print("[Callingx][setOnHoldCall] callId not found")
            #endif
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
        #if DEBUG
        print("[Callingx][startCall] uuidString = \(callId), phoneNumber = \(phoneNumber)")
        #endif
        
        guard let storage = CallingxImpl.uuidStorage else { return }
      
        if (storage.containsCid(callId)) {
          #if DEBUG
          print("[Callingx][startCall] Call \(callId) is already registered")
          #endif
          return
        }
        
        let call = storage.getOrCreateCall(forCid: callId, isOutgoing: true)
        call.markStartedConnecting() // outgoing: will be reported via reportOutgoingCall(startedConnectingAt:)
        
        let handleType = Settings.getHandleType("generic")
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
        #if DEBUG
        print("[Callingx][updateDisplay] uuidString = \(callId) displayName = \(callerName) uri = \(phoneNumber)")
        #endif
        
        guard let uuid = CallingxImpl.uuidStorage?.getUUID(forCid: callId) else {
            #if DEBUG
            print("[Callingx][updateDisplay] callId not found")
            #endif
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
        #if DEBUG
        print("[Callingx][CXProviderDelegate][provider:performStartCallAction]")
        #endif
        
        guard let call = CallingxImpl.uuidStorage?.getCallByUUID(action.callUUID) else {
            #if DEBUG
            print("[Callingx][CXProviderDelegate][provider:performStartCallAction] callId not found")
            #endif
            action.fail()
            return
        }
        
        AudioSessionManager.createAudioSessionIfNeeded()
        
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
            #if DEBUG
            print("[Callingx][CXProviderDelegate][provider:performAnswerCallAction] callId not found")
            #endif
            action.fail()
            return
        }
        
        #if DEBUG
        print("[Callingx][CXProviderDelegate][provider:performAnswerCallAction] isSelfAnswered: \(call.isSelfAnswered)")
        #endif
        
        AudioSessionManager.createAudioSessionIfNeeded()
        
        let source = call.isSelfAnswered ? "app" : "sys"
        sendEvent(CallingxEvents.performAnswerCallAction, body: [
            "callId": call.cid,
            "source": source
        ])
        
        call.resetSelfAnswered()
        call.markConnected() // incoming: call is now connected
        // TODO: Use action.fulfill(withDateConnected: call.connectedAt ?? Date()) instead of bare
        // action.fulfill() to give CallKit more accurate call duration tracking in the system call log.
        // to be done with pending action fulfillment
        action.fulfill()
    }
    
    public func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
        guard let call = CallingxImpl.uuidStorage?.getCallByUUID(action.callUUID) else {
            #if DEBUG
            print("[Callingx][CXProviderDelegate][provider:performEndCallAction] callId not found")
            #endif
            action.fail()
            return
        }
        
        #if DEBUG
        print("[Callingx][CXProviderDelegate][provider:performEndCallAction] isSelfEnded: \(call.isSelfEnded)")
        #endif
        
        let source = call.isSelfEnded ? "app" : "sys"
        sendEvent(CallingxEvents.performEndCallAction, body: [
            "callId": call.cid,
            "source": source
        ])
        
        call.resetSelfEnded()
        call.markEnded()
        CallingxImpl.uuidStorage?.removeCid(call.cid)
        
        action.fulfill()
    }
    
    public func provider(_ provider: CXProvider, perform action: CXSetHeldCallAction) {
        #if DEBUG
        print("[Callingx][CXProviderDelegate][provider:performSetHeldCallAction]")
        #endif
        
        guard let callId = CallingxImpl.uuidStorage?.getCid(forUUID: action.callUUID) else {
            #if DEBUG
            print("[Callingx][CXProviderDelegate][provider:performSetHeldCallAction] callId not found")
            #endif
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
            #if DEBUG
            print("[Callingx][CXProviderDelegate][provider:performSetMutedCallAction] callId not found")
            #endif
            action.fail()
            return
        }
        
        let isAppInitiated = call.isSelfMuted
        call.resetSelfMuted()
        
        #if DEBUG
        print("[Callingx][CXProviderDelegate][provider:performSetMutedCallAction] \(action.isMuted) isAppInitiated: \(isAppInitiated)")
        #endif
        
        // Only send the event to JS when the mute was initiated by the system
        // (e.g. user tapped mute on the native CallKit UI).
        // Skip app-initiated actions to prevent the feedback loop:
        // app mutes mic → setMutedCall → CallKit delegate → event to JS → mic toggle → loop
        if !isAppInitiated {
            sendEvent(CallingxEvents.didPerformSetMutedCallAction, body: [
                "muted": action.isMuted,
                "callId": call.cid
            ])
        }
        
        action.fulfill()
    }
  
    public func provider(_ provider: CXProvider, perform action: CXPlayDTMFCallAction) {
        #if DEBUG
        print("[Callingx][CXProviderDelegate][provider:performPlayDTMFCallAction]")
        #endif
        
        guard let callId = CallingxImpl.uuidStorage?.getCid(forUUID: action.callUUID) else {
            #if DEBUG
            print("[Callingx][CXProviderDelegate][provider:performPlayDTMFCallAction] callId not found")
            #endif
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
        #if DEBUG
        print("[Callingx][CXProviderDelegate][provider:didActivateAudioSession] category=\(audioSession.category) mode=\(audioSession.mode)")
        #endif

        // When CallKit activates the AVAudioSession, inform WebRTC as well.
        RTCAudioSession.sharedInstance().audioSessionDidActivate(audioSession)

        // Enable wake lock to keep the device awake during the call
        DispatchQueue.main.async {
            UIApplication.shared.isIdleTimerDisabled = true
        }

        sendEvent(CallingxEvents.didActivateAudioSession, body: nil)
    }
    
    public func provider(_ provider: CXProvider, didDeactivate audioSession: AVAudioSession) {
        #if DEBUG
        print("[Callingx][CXProviderDelegate][provider:didDeactivateAudioSession] category=\(audioSession.category) mode=\(audioSession.mode)")
        #endif

        // When CallKit deactivates the AVAudioSession, inform WebRTC as well.
        RTCAudioSession.sharedInstance().audioSessionDidDeactivate(audioSession)

        // Disable wake lock when the call ends
        DispatchQueue.main.async {
            UIApplication.shared.isIdleTimerDisabled = false
        }

        sendEvent(CallingxEvents.didDeactivateAudioSession, body: nil)
    }
  
    public func provider(_ provider: CXProvider, timedOutPerforming action: CXAction) {
        #if DEBUG
        print("[Callingx][CXProviderDelegate][provider:timedOutPerformingAction]")
        #endif
    }
  
    public func providerDidReset(_ provider: CXProvider) {
        #if DEBUG
        print("[Callingx][providerDidReset]")
        #endif

        sendEvent(CallingxEvents.providerReset, body: nil)
    }
}

