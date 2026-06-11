import Foundation
import PushKit
import React

@objcMembers public class VoipNotificationsEvents: NSObject {
    public static let registered = "voipNotificationsRegistered"
    public static let newNotification = "voipNotificationReceived"
}

typealias RNVoipPushNotificationCompletion = () -> Void

@objc public protocol VoipNotificationsEventEmitter {
    func emitVoipEvent(_ dictionary: [String: Any])
}

@objc public class VoipNotificationsManager: NSObject {
    
    @objc public weak var eventEmitter: VoipNotificationsEventEmitter?
    
    private static var isVoipRegistered = false
    private static var lastVoipToken = ""
    private static var voipRegistry: PKPushRegistry?

    private var canSendEvents: Bool = false
    private var delayedEvents: [[String:Any]] = []
    
    private static var sharedInstance: VoipNotificationsManager?
    
    @objc public static func shared() -> VoipNotificationsManager {
        if sharedInstance == nil {
            sharedInstance = VoipNotificationsManager()
        }
        return sharedInstance!
    }
    
    @objc public override init() {
        super.init()

        canSendEvents = false
        delayedEvents = []

        if VoipNotificationsManager.sharedInstance == nil {
            VoipNotificationsManager.sharedInstance = self
        }
    }

     deinit {
        NotificationCenter.default.removeObserver(self)
        
        canSendEvents = false
        delayedEvents = []
    }
    
    // MARK: - Class Methods
    
    @objc public static func voipRegistration() {
        if isVoipRegistered {
            CallingxLog.voip.debugPublic("voipRegistration is already registered. return _lastVoipToken = \(lastVoipToken)")
            let voipPushManager = VoipNotificationsManager.shared()
            voipPushManager.sendEventWithNameWrapper(name: VoipNotificationsEvents.registered, body: ["token": lastVoipToken])
            return
        }

        CallingxLog.voip.debugPublic("voipRegistration enter")

        DispatchQueue.main.async {
            let registry = PKPushRegistry(queue: DispatchQueue.main)
            registry.delegate = VoipPushHandler.sharedInstance()
            registry.desiredPushTypes = [.voIP]
            VoipNotificationsManager.voipRegistry = registry
            isVoipRegistered = true
        }
    }
    
    @objc public static func didUpdatePushCredentials(_ credentials: PKPushCredentials, forType type: String) {
        CallingxLog.voip.debug("didUpdatePushCredentials credentials.token = \(credentials.token, privacy: .private), type = \(type, privacy: .public)")

        let voipTokenLength = credentials.token.count
        if voipTokenLength == 0 {
            return
        }
        
        lastVoipToken = credentials.token.map { String(format: "%02x", $0) }.joined()
        
        let voipPushManager = VoipNotificationsManager.shared()
        voipPushManager.sendEventWithNameWrapper(name: VoipNotificationsEvents.registered, body: ["token": lastVoipToken])
    }
    
    @objc public static func didReceiveIncomingPushWithPayload(_ payload: PKPushPayload, forType type: String) {
        CallingxLog.voip.debug("didReceiveIncomingPushWithPayload payload.dictionaryPayload = \(payload.dictionaryPayload, privacy: .private), type = \(type, privacy: .public)")

        let dictionaryPayload: [String: Any] = Dictionary(uniqueKeysWithValues: payload.dictionaryPayload.map { (key, value) in
            (String(describing: key), value)
        })
        
        let voipPushManager = VoipNotificationsManager.shared()
        voipPushManager.sendEventWithNameWrapper(name: VoipNotificationsEvents.newNotification, body: dictionaryPayload)
    }
    
    // MARK: - React Native Methods
    @objc public func getInitialEvents() -> [[String: Any]] {
        var events: [[String: Any]] = []
        let action = {
            CallingxLog.voip.debugPublic("[getInitialEvents] delayedEvents = \(self.delayedEvents)")
            
            events = self.delayedEvents
            self.delayedEvents = []
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

    @objc public func registerVoipToken() {
        if RCTRunningInAppExtension() {
            return
        }
        DispatchQueue.main.async {
            VoipNotificationsManager.voipRegistration()
        }
    }

    private func sendEventWithNameWrapper(name: String, body: [String: Any]?) {
        CallingxLog.voip.debugPublic("sendEventWithNameWrapper: \(name)")
        
        let sendEventAction = {
            var dictionary: [String: Any] = ["eventName": name]
            if let body = body {
                dictionary["params"] = body
            }

            if self.canSendEvents {
                self.eventEmitter?.emitVoipEvent(dictionary)
            } else {
                self.delayedEvents.append(dictionary)
                CallingxLog.voip.debugPublic("delayedEvents: \(self.delayedEvents)")
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
}

