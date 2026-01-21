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
            #if DEBUG
            print("[VoipNotificationsManager] voipRegistration is already registered. return _lastVoipToken = \(lastVoipToken)")
            #endif
            let voipPushManager = VoipNotificationsManager.shared()
            voipPushManager.sendEventWithNameWrapper(name: VoipNotificationsEvents.registered, body: ["token": lastVoipToken])
        } else {
            #if DEBUG
            print("[VoipNotificationsManager] voipRegistration enter")
            #endif
            DispatchQueue.main.async {
                let voipRegistry = PKPushRegistry(queue: DispatchQueue.main)
                // Set the registry's delegate to AppDelegate
                // Note: The original code casts the delegate, but this should be handled by AppDelegate
                if let appDelegate = RCTSharedApplication()?.delegate as? PKPushRegistryDelegate {
                    voipRegistry.delegate = appDelegate
                    // Set the push type to VoIP
                    // Store the registry to prevent deallocation
                    voipRegistry.desiredPushTypes = [.voIP]
                    VoipNotificationsManager.voipRegistry = voipRegistry
                    
                    isVoipRegistered = true
                } else {
                    #if DEBUG
                    print("[VoipNotificationsManager] voipRegistration appDelegate not found. return")
                    #endif
                }
            }
        }
    }
    
    @objc public static func didUpdatePushCredentials(_ credentials: PKPushCredentials, forType type: String) {
        #if DEBUG
        print("[VoipNotificationsManager] didUpdatePushCredentials credentials.token = \(credentials.token), type = \(type)")
        #endif
        
        let voipTokenLength = credentials.token.count
        if voipTokenLength == 0 {
            return
        }
        
        lastVoipToken = credentials.token.map { String(format: "%02x", $0) }.joined()
        
        let voipPushManager = VoipNotificationsManager.shared()
        voipPushManager.sendEventWithNameWrapper(name: VoipNotificationsEvents.registered, body: ["token": lastVoipToken])
    }
    
    @objc public static func didReceiveIncomingPushWithPayload(_ payload: PKPushPayload, forType type: String) {
        #if DEBUG
        print("[VoipNotificationsManager] didReceiveIncomingPushWithPayload payload.dictionaryPayload = \(payload.dictionaryPayload), type = \(type)")
        #endif
        
        let dictionaryPayload: [String: Any] = Dictionary(uniqueKeysWithValues: payload.dictionaryPayload.map { (key, value) in
            (String(describing: key), value)
        })
        
        let voipPushManager = VoipNotificationsManager.shared()
        voipPushManager.sendEventWithNameWrapper(name: VoipNotificationsEvents.newNotification, body: dictionaryPayload)
    }
    
    // MARK: - React Native Methods
    @objc public func getInitialEvents() -> [[String: Any]] {
        var events: [[String: Any]] = []
        DispatchQueue.main.sync {
            #if DEBUG
            print("[VoipNotificationsManager][getInitialEvents] delayedEvents = \(delayedEvents)")
            #endif
            
            events = self.delayedEvents
            self.delayedEvents = []
            self.canSendEvents = true
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
        #if DEBUG
        print("[VoipNotificationsManager] sendEventWithNameWrapper: \(name)")
        #endif
        
        let sendEventAction = {
            var dictionary: [String: Any] = ["eventName": name]
            if let body = body {
                dictionary["params"] = body
            }

            if self.canSendEvents {
                self.eventEmitter?.emitVoipEvent(dictionary)
            } else {
                self.delayedEvents.append(dictionary)
                #if DEBUG
                print("[VoipNotificationsManager] delayedEvents: \(self.delayedEvents)")
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
}

