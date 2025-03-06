//
//  RTCViewPip.swift
//  stream-video-react-native
//
//  Created by santhosh vaiyapuri on 22/08/2024.
//

import Foundation

@objc(RTCViewPip)
class RTCViewPip: UIView {
    
    private lazy var pictureInPictureController = StreamPictureInPictureController()
    private var webRtcModule: WebRTCModule?
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupView()
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    private func setupView() {
        let videoView = UIView()
        self.addSubview(videoView)
        pictureInPictureController?.sourceView = videoView
        videoView.backgroundColor = UIColor.clear // make it transparent
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
            
            NSLog("PiP - Setting video track for streamURL: -\(streamURLString)")
            self.pictureInPictureController?.track = videoTrack
        }
    }
    
    
    @objc
    func onCallClosed() {
        self.pictureInPictureController?.cleanup()
        self.pictureInPictureController = nil
        
    }
    
    override func didMoveToWindow() {
        super.didMoveToWindow()
        let isVisible = self.superview != nil && self.window != nil;
        if (!isVisible) {
            NSLog("PiP - onCallClosed called due to view detaching")
            // view is detached so we cleanup the pip controller
            // taken from:  https://github.com/software-mansion/react-native-screens/blob/main/Example/ios/ScreensExample/RNSSampleLifecycleAwareView.m
            onCallClosed()
        }
    }
}
