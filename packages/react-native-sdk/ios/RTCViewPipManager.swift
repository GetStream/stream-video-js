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

    // Swift equivalent of Obj-C `@synthesize moduleRegistry/viewRegistry_DEPRECATED`.
    private weak var injectedModuleRegistry: RCTModuleRegistry?
    @objc override var moduleRegistry: RCTModuleRegistry! {
        get { injectedModuleRegistry }
        set { injectedModuleRegistry = newValue }
    }
    private weak var injectedViewRegistry: RCTViewRegistry?
    @objc override var viewRegistry_DEPRECATED: RCTViewRegistry! {
        get { injectedViewRegistry }
        set { injectedViewRegistry = newValue }
    }

    override func view() -> UIView! {
        let view = RTCViewPip()
        view.manager = self
        view.setWebRtcModule(moduleRegistry.module(forName: "WebRTCModule") as! WebRTCModule)
        return view
    }

    override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    // Resolves the `RTCViewPip` backing a registry lookup, across both RN architectures.
    // Legacy interop stores the backing view in `contentView` since RN 0.73,
    // and newer RN versions also expose it via `paperView`.
    // Taken from https://github.com/rnmapbox/maps/blob/ab2a6dc183dff3a88527803c41edab7d29-2df9cb/ios/RNMBX/Utils/RNMBXViewResolver.mm#L110-L126
    private func resolvePipView(_ view: UIView?) -> RTCViewPip? {
        guard let view else { return nil }

        if let pipView = view as? RTCViewPip {
            return pipView
        }

        for selectorName in ["paperView", "contentView"] {
            let selector = NSSelectorFromString(selectorName)

            if view.responds(to: selector),
               let wrappedView = view.perform(selector)?.takeUnretainedValue() as? UIView,
               let pipView = wrappedView as? RTCViewPip {
                return pipView
            }
        }

        return nil
    }
    
    @objc(onCallClosed:)
    func onCallClosed(_ reactTag: NSNumber) {
        
        viewRegistry_DEPRECATED.addUIBlock({ viewRegistry in
            let view = viewRegistry?.view(forReactTag: reactTag)
            if let pipView = self.resolvePipView(view) {
                DispatchQueue.main.async {
                    pipView.onCallClosed()
                }
            } else {
                PictureInPictureLogger.log("onCallClosed cant be called, Invalid view returned from registry, expecting RTCViewPip")
            }
        })
    }
    
    
    @objc(setPreferredContentSize:width:height:)
    func setPreferredContentSize(_ reactTag: NSNumber, width: CGFloat, height: CGFloat) {
        let size = CGSize(width: width, height: height)
        
        viewRegistry_DEPRECATED.addUIBlock({ viewRegistry in
            let view = viewRegistry?.view(forReactTag: reactTag)
            if let pipView = self.resolvePipView(view) {
                DispatchQueue.main.async {
                    pipView.setPreferredContentSize(size)
                }
            } else {
                // If the view is not found, cache the size.
                // this happens when this method is called before the view can attach react super view
                PictureInPictureLogger.log("View not found for reactTag \(reactTag), caching size.")
                self.cachedSizes[reactTag] = size
            }
        })
    }
    
    func getCachedSize(for reactTag: NSNumber) -> CGSize? {
        let size = self.cachedSizes.removeValue(forKey: reactTag)
        if size != nil {
            PictureInPictureLogger.log("Found and removed cached size for reactTag \(reactTag).")
        }
        return size
    }
}
