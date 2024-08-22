//
//  RTCViewPip.swift
//  stream-video-react-native
//
//  Created by santhosh vaiyapuri on 22/08/2024.
//

import Foundation

@objc (RTCViewPipManager)
class RTCViewPipManager: RCTViewManager {
    private var _parentView: UIView
    private var _videoView: UIView
    private lazy var pictureInPictureController = StreamPictureInPictureController()
    
    override init() {
        _parentView = UIView()
        _videoView = UIView()
        super.init()
        pictureInPictureController?.sourceView = _videoView
        _videoView.backgroundColor = UIColor.clear // make it transparent
        _parentView.addSubview(_videoView)
    }
    
    private func getWebRtcModule() -> WebRTCModule {
        return self.bridge.module(forName: "WebRTCModule") as! WebRTCModule
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    override func view() -> UIView! {
        let view = RTCViewPip()
        view.setWebRtcModule(self.bridge.module(forName: "WebRTCModule") as! WebRTCModule)
        return view
    }
    
    func setVideoTrack(streamReactTag: String) {
        let module = getWebRtcModule()

        module.workerQueue.async {
            let stream = module.stream(forReactTag: streamReactTag)
            let videoTracks = stream?.videoTracks ?? []
            let videoTrack = videoTracks.first
            if videoTrack == nil {
//                RCTLogWarn("No video stream for react tag: \(streamReactTag ?? "")")
                NSLog("No video stream for react tag: -\(streamReactTag)")
            } else {
                DispatchQueue.main.async {
                    self.pictureInPictureController?.track = videoTrack
                }
            }
        }
    }
}


@objc
class RTCViewPip: UIView {
  
    private var _parentView: UIView
    private var _videoView: UIView
    private lazy var pictureInPictureController = StreamPictureInPictureController()
    private var 
    
    override init(frame: CGRect) {
      super.init(frame: frame)
      setupView()
    }
   
    required init?(coder aDecoder: NSCoder) {
      super.init(coder: aDecoder)
      setupView()
    }
   
   private func setupView() {
       _parentView = UIView()
       _videoView = UIView()
       pictureInPictureController?.sourceView = _videoView
       _videoView.backgroundColor = UIColor.clear // make it transparent
   }
    
    func setWebRtcModule(_ module: WebRTCModule) {
        
    }
    
    @objc
    func setVideoTrack(streamReactTag: String) {
        let module = getWebRtcModule()

        module.workerQueue.async {
            let stream = module.stream(forReactTag: streamReactTag)
            let videoTracks = stream?.videoTracks ?? []
            let videoTrack = videoTracks.first
            if videoTrack == nil {
//                RCTLogWarn("No video stream for react tag: \(streamReactTag ?? "")")
                NSLog("No video stream for react tag: -\(streamReactTag)")
            } else {
                DispatchQueue.main.async {
                    self.pictureInPictureController?.track = videoTrack
                }
            }
        }
    }
}
