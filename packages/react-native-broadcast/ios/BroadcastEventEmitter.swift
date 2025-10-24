import Foundation
import React

@objc(BroadcastEventEmitter)
class BroadcastEventEmitter: RCTEventEmitter {
    static var shared: BroadcastEventEmitter?

    override init() {
        super.init()
        BroadcastEventEmitter.shared = self
    }

    override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    override func supportedEvents() -> [String]! {
        return [
            "broadcast.started",
            "broadcast.mediaStateUpdated"
        ]
    }

    @objc public static func emit(_ name: String, body: Any) {
        DispatchQueue.main.async {
            BroadcastEventEmitter.shared?.sendEvent(withName: name, body: body)
        }
    }
}
