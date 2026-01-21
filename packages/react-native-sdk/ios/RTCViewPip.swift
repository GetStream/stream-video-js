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
    
    @objc var onPiPChange: RCTBubblingEventBlock?

    // MARK: - Avatar Placeholder Properties

    /// The participant's name for the avatar placeholder
    @objc public var participantName: NSString? = nil {
        didSet {
            pictureInPictureController?.participantName = participantName as String?
        }
    }

    /// The URL string for the participant's profile image
    @objc public var participantImageURL: NSString? = nil {
        didSet {
            pictureInPictureController?.participantImageURL = participantImageURL as String?
        }
    }

    /// Whether video is enabled - when false, shows avatar placeholder
    @objc public var isVideoEnabled: Bool = true {
        didSet {
            pictureInPictureController?.isVideoEnabled = isVideoEnabled
        }
    }

    // MARK: - Reconnection Properties

    /// Whether the call is reconnecting - when true, shows reconnection view
    @objc public var isReconnecting: Bool = false {
        didSet {
            pictureInPictureController?.isReconnecting = isReconnecting
        }
    }

    // MARK: - Screen Sharing Properties

    /// Whether screen sharing is active - when true, shows screen share indicator
    @objc public var isScreenSharing: Bool = false {
        didSet {
            pictureInPictureController?.isScreenSharing = isScreenSharing
        }
    }

    // MARK: - Participant Overlay Properties

    /// Whether the participant's audio is muted - shown in participant overlay
    @objc public var isMuted: Bool = false {
        didSet {
            pictureInPictureController?.isMuted = isMuted
        }
    }

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
                // Recreate controller if it was previously cleaned up
                // This allows PiP to work again for subsequent calls
                if self.pictureInPictureController == nil {
                    NSLog("PiP - Recreating pictureInPictureController for new session")
                    self.pictureInPictureController = StreamPictureInPictureController()
                }
                self.pictureInPictureController?.sourceView = self
                // Set up PiP state change callback
                self.pictureInPictureController?.onPiPStateChange = { [weak self] isActive in
                    self?.sendPiPChangeEvent(isActive: isActive)
                }
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
    
    private func sendPiPChangeEvent(isActive: Bool) {
        guard let onPiPChange = onPiPChange else {
            return
        }
        
        NSLog("PiP - Sending PiP state change event: \(isActive)")
        onPiPChange(["active": isActive])
    }
}
