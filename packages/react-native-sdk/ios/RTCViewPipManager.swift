//
//  RTCViewPipManager.swift
//  stream-video-react-native
//
//  Created by santhosh vaiyapuri on 22/08/2024.
//

import Foundation

@objc(RTCViewPipManager)
class RTCViewPipManager: RCTViewManager {
    
    override func view() -> UIView! {
        let view = RTCViewPip()
        view.setWebRtcModule(self.bridge.module(forName: "WebRTCModule") as! WebRTCModule)
        return view
    }
    
    override var methodQueue: DispatchQueue {
        return DispatchQueue.main
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    @objc func onCallClosed(_ reactTag: NSNumber) {
        self.bridge!.uiManager.addUIBlock { (_: RCTUIManager?, viewRegistry: [NSNumber: UIView]?) in
            guard let view = viewRegistry?[reactTag] as? RTCViewPip else {
                NSLog("onCallClosed cant be called, Invalid view returned from registry, expecting RTCViewPip")
                return
            }
            view.onCallClosed()
        }
    }
}
