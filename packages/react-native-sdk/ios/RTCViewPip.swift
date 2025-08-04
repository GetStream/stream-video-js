//
//  RTCViewPip.swift
//  stream-video-react-native
//
//  Created by santhosh vaiyapuri on 22/08/2024.
//

import Foundation
import React

@objc(RTCViewPip)
class RTCViewPip: UIView {
    
    private var pictureInPictureController = StreamPictureInPictureController()
    private var webRtcModule: WebRTCModule?
    
    private func setupNotificationObserver() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appBecameActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
    }
    
    func setWebRtcModule(_ module: WebRTCModule) {
        webRtcModule = module
    }
    
    @objc public var streamURL: NSString? = nil {
        didSet {
            // https://github.com/react-native-webrtc/react-native-webrtc/blob/8dfc9c394b4bf627c0214255466ebd3b160ca563/ios/RCTWebRTC/RTCVideoViewManager.m#L405-L418
            guard let streamURLString = streamURL as String? else {
                NSLog("PiP - No streamURL set")
                return
            }
            
            guard let stream = self.webRtcModule?.stream(forReactTag: streamURLString) else {
                NSLog("PiP - No stream for streamURL: -\(streamURLString)")
                return
            }
            
            guard let videoTrack = stream.videoTracks.first else {
                NSLog("PiP - No video track for streamURL: -\(streamURLString)")
                return
            }
            if (self.pictureInPictureController?.track == videoTrack) {
                NSLog("PiP - Skipping video track for streamURL: -\(streamURLString)")
                return
            }
            
            DispatchQueue.main.async {
                NSLog("PiP - Setting video track for streamURL: -\(streamURLString) trackId: \(videoTrack.trackId)")
                self.pictureInPictureController?.track = videoTrack
            }
        }
    }
    
    @objc func appBecameActive() {
        self.pictureInPictureController?.stopPictureInPicture()
    }
    
    
    @objc
    func onCallClosed() {
        NSLog("PiP - pictureInPictureController cleanup called")
        self.pictureInPictureController?.cleanup()
        self.pictureInPictureController = nil
    }
    
    @objc
    func setPreferredContentSize(_ size: CGSize) {
        NSLog("PiP - RTCViewPip setPreferredContentSize \(size)")
        self.pictureInPictureController?.setPreferredContentSize(size)
    }
    
    override func didMoveToSuperview() {
        super.didMoveToSuperview()
        if self.superview == nil {
            NSLog("PiP - RTCViewPip has been removed from its superview.")
            NotificationCenter.default.removeObserver(self)
            DispatchQueue.main.async {
                NSLog("PiP - onCallClosed called due to view detaching")
                self.onCallClosed()
            }
        } else {
            NSLog("PiP - RTCViewPip has been added to a superview.")
            setupNotificationObserver()
            DispatchQueue.main.async {
                self.pictureInPictureController?.sourceView = self
                if let reactTag = self.reactTag, let bridge = self.webRtcModule?.bridge {
                    if let manager = bridge.module(for: RTCViewPipManager.self) as? RTCViewPipManager,
                       let size = manager.getCachedSize(for: reactTag) {
                        NSLog("PiP - Applying cached size \(size) for reactTag \(reactTag)")
                        self.setPreferredContentSize(size)
                    }
                }
            }
        }
    }
}
