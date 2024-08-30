//
//  RTCViewPipManager.swift
//  stream-video-react-native
//
//  Created by santhosh vaiyapuri on 22/08/2024.
//

import Foundation

@objc (RTCViewPipManager)
class RTCViewPipManager: RCTViewManager {
    
    override func view() -> UIView! {
        let view = RTCViewPip()
        view.setWebRtcModule(self.bridge.module(forName: "WebRTCModule") as! WebRTCModule)
        return view
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    @objc func onCallClosed(_ reactTag: NSNumber) {
        self.bridge!.uiManager.addUIBlock { (_: RCTUIManager?, viewRegistry: [NSNumber: UIView]?) in
            guard let view = viewRegistry?[reactTag] as? RTCViewPip else {
                if RCT_DEBUG == 1 {
                    print("Invalid view returned from registry, expecting RTCViewPip")
                }
                return
            }
            view.onCallClosed()
        }
    }
}
