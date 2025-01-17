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
        super.init(coder: aDecoder)
        setupView()
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
    
    @objc func setStreamURL(_ streamReactTag: NSString) {
        let tag = String(streamReactTag)
        webRtcModule?.workerQueue.async {
            let stream = self.webRtcModule?.stream(forReactTag: tag)
            let videoTracks = stream?.videoTracks ?? []
            let videoTrack = videoTracks.first
            if videoTrack == nil {
                NSLog("PiP - No video stream for react tag: -\(tag)")
            } else {
                DispatchQueue.main.async {
                    self.pictureInPictureController?.track = videoTrack
                }
            }
        }
    }
    
    @objc
    func onCallClosed() {
        DispatchQueue.main.async {
            self.pictureInPictureController?.cleanup()
            self.pictureInPictureController = nil
        }
    }
    
    override func didMoveToWindow() {
        super.didMoveToWindow()
        let isVisible = self.superview != nil && self.window != nil;
        if (!isVisible) {
            // view is detached so we cleanup the pip controller
            // taken from:  https://github.com/software-mansion/react-native-screens/blob/main/Example/ios/ScreensExample/RNSSampleLifecycleAwareView.m
            onCallClosed()
        }
    }
}
