//
//  RTCViewPipManager.swift
//  stream-video-react-native
//
//  Created by santhosh vaiyapuri on 22/08/2024.
//

import Foundation

@objc(RTCViewPipManager)
class RTCViewPipManager: RCTViewManager {

    // A cached RTCViewPip reference.
    //
    // Often, the view unmounts before the `onCallClosed` command arrives and as a consequence
    // pipView.onCallClosed() method wasn't called, as the view can't be found in the ViewRegistry
    // causing dangling PiP window with the last video frame frozen.
    // Now, once this happens, instead forwarding the command to the view returned by the registry,
    // we manually apply it to the cached view. The current setup allows only one PipView, so we
    // don't have to introduce more complex view tracking mechanism.
    private var _view: RTCViewPip? = nil

    override func view() -> UIView! {
        let view = RTCViewPip()
        view.setWebRtcModule(self.bridge.module(forName: "WebRTCModule") as! WebRTCModule)
        self._view = view
        return view
    }

    override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    @objc func onCallClosed(_ reactTag: NSNumber) {
        self.bridge!.uiManager.addUIBlock { (_: RCTUIManager?, viewRegistry: [NSNumber: UIView]?) in
            guard let pipView = viewRegistry?[reactTag] as? RTCViewPip else {
                NSLog("PiP - onCallClosed cant be called, Invalid view returned from registry, expecting RTCViewPip. Disposing the cached view.")
                self._view?.onCallClosed()
                return
            }
            DispatchQueue.main.async {
                pipView.onCallClosed()
            }
        }
    }
}
