//
//  RTCViewPipManager.swift
//  stream-video-react-native
//
//  Created by santhosh vaiyapuri on 22/08/2024.
//

import Foundation

@objc(RTCViewPipManager)
class RTCViewPipManager: RCTViewManager {
    
    private var cachedSizes: [NSNumber: CGSize] = [:]
    
    override func view() -> UIView! {
        let view = RTCViewPip()
        view.setWebRtcModule(self.bridge.module(forName: "WebRTCModule") as! WebRTCModule)
        return view
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    @objc(onCallClosed:)
    func onCallClosed(_ reactTag: NSNumber) {
        
        bridge.uiManager.addUIBlock({ (uiManager, viewRegistry) in
            let view = uiManager?.view(forReactTag: reactTag)
            if let pipView = view as? RTCViewPip {
                DispatchQueue.main.async {
                    pipView.onCallClosed()
                }
            } else {
                NSLog("PiP - onCallClosed cant be called, Invalid view returned from registry, expecting RTCViewPip")
            }
        })
    }
    
    
    @objc(setPreferredContentSize:width:height:)
    func setPreferredContentSize(_ reactTag: NSNumber, width: CGFloat, height: CGFloat) {
        let size = CGSize(width: width, height: height)
        
        bridge.uiManager.addUIBlock({ (uiManager, viewRegistry) in
            let view = uiManager?.view(forReactTag: reactTag)
            if let pipView = view as? RTCViewPip {
                DispatchQueue.main.async {
                    pipView.setPreferredContentSize(size)
                }
            } else {
                // If the view is not found, cache the size.
                // this happens when this method is called before the view can attach react super view
                NSLog("PiP - View not found for reactTag \(reactTag), caching size.")
                self.cachedSizes[reactTag] = size
            }
        })
    }
    
    func getCachedSize(for reactTag: NSNumber) -> CGSize? {
        let size = self.cachedSizes.removeValue(forKey: reactTag)
        if size != nil {
            NSLog("PiP - Found and removed cached size for reactTag \(reactTag).")
        }
        return size
    }
}
