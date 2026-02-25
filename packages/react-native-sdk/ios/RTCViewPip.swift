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

    private var pictureInPictureController: StreamPictureInPictureController? = StreamPictureInPictureController()
    private var webRtcModule: WebRTCModule?

    @objc var onPiPChange: RCTBubblingEventBlock?

    // MARK: - Avatar Placeholder Properties

    /// The participant's name for the avatar placeholder
    @objc public var participantName: NSString? = nil {
        didSet {
            pipLog("RTCViewPip.participantName didSet: \(participantName as String? ?? "nil"), controller exists: \(pictureInPictureController != nil)")
            pictureInPictureController?.participantName = participantName as String?
        }
    }

    /// The URL string for the participant's profile image
    @objc public var participantImageURL: NSString? = nil {
        didSet {
            pipLog("RTCViewPip.participantImageURL didSet: \(participantImageURL as String? ?? "nil"), controller exists: \(pictureInPictureController != nil)")
            pictureInPictureController?.participantImageURL = participantImageURL as String?
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

    /// Whether screen sharing is active (used for content state tracking)
    @objc public var isScreenSharing: Bool = false {
        didSet {
            pictureInPictureController?.isScreenSharing = isScreenSharing
        }
    }

    // MARK: - Participant Overlay Properties

    /// Whether the participant has audio enabled (shown in participant overlay)
    @objc public var hasAudio: Bool = true {
        didSet {
            pictureInPictureController?.hasAudio = hasAudio
        }
    }

    /// Whether the video track is paused (shown in participant overlay)
    @objc public var isTrackPaused: Bool = false {
        didSet {
            pictureInPictureController?.isTrackPaused = isTrackPaused
        }
    }

    /// Whether the participant is pinned (shown in participant overlay)
    @objc public var isPinned: Bool = false {
        didSet {
            pictureInPictureController?.isPinned = isPinned
        }
    }

    /// Whether the participant is currently speaking (shows border highlight)
    @objc public var isSpeaking: Bool = false {
        didSet {
            pictureInPictureController?.isSpeaking = isSpeaking
        }
    }

    /// The connection quality level (0: unknown, 1: poor, 2: good, 3: excellent)
    @objc public var connectionQuality: Int = 0 {
        didSet {
            pictureInPictureController?.connectionQuality = connectionQuality
        }
    }

    @objc public var mirror: Bool = false {
        didSet {
            self.pictureInPictureController?.isMirrored = mirror
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
                pipLog("No streamURL set, clearing track")
                DispatchQueue.main.async {
                    self.pictureInPictureController?.track = nil
                    self.pictureInPictureController?.isVideoEnabled = false
                }
                return
            }

            guard let stream = self.webRtcModule?.stream(forReactTag: streamURLString) else {
                pipLog("No stream for streamURL: -\(streamURLString), clearing track")
                DispatchQueue.main.async {
                    self.pictureInPictureController?.track = nil
                    self.pictureInPictureController?.isVideoEnabled = false
                }
                return
            }

            guard let videoTrack = stream.videoTracks.first else {
                pipLog("No video track for streamURL: -\(streamURLString), clearing track")
                DispatchQueue.main.async {
                    self.pictureInPictureController?.track = nil
                    self.pictureInPictureController?.isVideoEnabled = false
                }
                return
            }
            if (self.pictureInPictureController?.track == videoTrack) {
                pipLog("Skipping video track for streamURL: -\(streamURLString)")
                return
            }

            DispatchQueue.main.async {
                pipLog("Setting video track for streamURL: -\(streamURLString) trackId: \(videoTrack.trackId)")
                self.pictureInPictureController?.track = videoTrack
                self.pictureInPictureController?.isVideoEnabled = true
            }
        }
    }
    
    @objc func appBecameActive() {
        self.pictureInPictureController?.stopPictureInPicture()
    }
    
    
    @objc
    func onCallClosed() {
        pipLog("pictureInPictureController cleanup called")
        self.pictureInPictureController?.cleanup()
        self.pictureInPictureController = nil
    }
    
    @objc
    func setPreferredContentSize(_ size: CGSize) {
        pipLog("RTCViewPip setPreferredContentSize \(size)")
        self.pictureInPictureController?.setPreferredContentSize(size)
    }
    
    override func didMoveToSuperview() {
        super.didMoveToSuperview()
        if self.superview == nil {
            pipLog("RTCViewPip has been removed from its superview.")
            NotificationCenter.default.removeObserver(self)
            DispatchQueue.main.async {
                pipLog("onCallClosed called due to view detaching")
                self.onCallClosed()
            }
        } else {
            pipLog("RTCViewPip has been added to a superview.")
            setupNotificationObserver()
            DispatchQueue.main.async {
                // Recreate controller if it was previously cleaned up
                // This allows PiP to work again for subsequent calls
                let wasNil = self.pictureInPictureController == nil
                if wasNil {
                    pipLog("Recreating pictureInPictureController for new session")
                    self.pictureInPictureController = StreamPictureInPictureController()
                    // Re-apply all current properties to the new controller
                    // This is necessary because React Native may have set props while controller was nil
                    self.applyCurrentPropertiesToController()
                }
                self.pictureInPictureController?.sourceView = self
                self.pictureInPictureController?.isMirrored = self.mirror
                // Set up PiP state change callback
                self.pictureInPictureController?.onPiPStateChange = { [weak self] isActive in
                    self?.sendPiPChangeEvent(isActive: isActive)
                }
                if let reactTag = self.reactTag, let bridge = self.webRtcModule?.bridge {
                    if let manager = bridge.module(for: RTCViewPipManager.self) as? RTCViewPipManager,
                       let size = manager.getCachedSize(for: reactTag) {
                        pipLog("Applying cached size \(size) for reactTag \(reactTag)")
                        self.setPreferredContentSize(size)
                    }
                }
            }
        }
    }

    /// Re-applies all current property values to the controller.
    /// This is needed after controller recreation because didSet doesn't fire
    /// when the property values haven't changed on the React Native side.
    ///
    /// NOTE: This reads from RTCViewPip's own properties (self.participantName, etc.)
    /// which retain their values even after controller cleanup.
    private func applyCurrentPropertiesToController() {
        guard let controller = pictureInPictureController else {
            pipLog("applyCurrentPropertiesToController: controller is nil, skipping")
            return
        }

        pipLog("applyCurrentPropertiesToController STARTING:")
        pipLog("  participantName: '\(participantName as String? ?? "nil")'")
        pipLog("  participantImageURL: '\(participantImageURL as String? ?? "nil")'")
        pipLog("  streamURL: '\(streamURL as String? ?? "nil")'")

        controller.participantName = participantName as String?
        controller.participantImageURL = participantImageURL as String?
        controller.isReconnecting = isReconnecting
        controller.isScreenSharing = isScreenSharing
        controller.hasAudio = hasAudio
        controller.isTrackPaused = isTrackPaused
        controller.isPinned = isPinned
        controller.isSpeaking = isSpeaking
        controller.connectionQuality = connectionQuality

        // Handle streamURL to set track and isVideoEnabled
        if let streamURLString = streamURL as String?,
           let stream = webRtcModule?.stream(forReactTag: streamURLString),
           let videoTrack = stream.videoTracks.first {
            pipLog("Re-applying track from streamURL: \(streamURLString), trackId: \(videoTrack.trackId)")
            controller.track = videoTrack
            controller.isVideoEnabled = true
        } else {
            // No stream URL or no track means video is disabled - show avatar
            pipLog("No valid stream/track, setting isVideoEnabled=false for avatar")
            controller.track = nil
            controller.isVideoEnabled = false
        }
        pipLog("applyCurrentPropertiesToController COMPLETED")
    }
    
    private func sendPiPChangeEvent(isActive: Bool) {
        guard let onPiPChange = onPiPChange else {
            return
        }
        
        pipLog("Sending PiP state change event: \(isActive)")
        onPiPChange(["active": isActive])
    }
}
