//
//  RTCViewPip.swift
//  stream-video-react-native
//
//  Created by santhosh vaiyapuri on 22/08/2024.
//

import Foundation

@objc(RTCViewPip)
class RTCViewPip: UIView {
    
    private var pictureInPictureController = StreamPictureInPictureController()
    private var webRtcModule: WebRTCModule?
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupNotificationObserver()
        self.pictureInPictureController?.sourceView = self
    }
    
    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
        setupNotificationObserver()
    }
    
    private func setupNotificationObserver() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appBecameActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
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
                NSLog("PiP - Setting video track for streamURL: -\(streamURLString)")
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
    
    override func didMoveToWindow() {
        super.didMoveToWindow()
        let isVisible = self.superview != nil && self.window != nil;
        if (!isVisible) {
            // view is detached so we cleanup the pip controller
            // taken from:  https://github.com/software-mansion/react-native-screens/blob/main/Example/ios/ScreensExample/RNSSampleLifecycleAwareView.m
            DispatchQueue.main.async {
                NSLog("PiP - onCallClosed called due to view detaching")
                self.onCallClosed()
            }
        }
    }
}
