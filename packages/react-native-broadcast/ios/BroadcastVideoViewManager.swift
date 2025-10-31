import Foundation
import React

@objc(BroadcastVideoViewManager)
class BroadcastVideoViewManager: RCTViewManager {

    override func view() -> UIView! {
        let view = BroadcastVideoView()
        print("[BroadcastVideoViewManager] View created")
        return view
    }

    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
}

