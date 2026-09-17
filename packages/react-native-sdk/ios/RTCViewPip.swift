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
    // Back-reference set by RTCViewPipManager
    weak var manager: RTCViewPipManager?

    @objc var onPiPChange: RCTBubblingEventBlock?
    /// Actual PiP window bounds in logical points.
    @objc var onPiPBoundsChange: RCTBubblingEventBlock?
    private var lastEmittedBounds: CGSize?

    // MARK: - Avatar Placeholder Properties

    /// The participant's name for the avatar placeholder
    @objc public var participantName: NSString? = nil {
        didSet {
            PictureInPictureLogger.log("RTCViewPip.participantName didSet: \(participantName as String? ?? "nil"), controller exists: \(pictureInPictureController != nil)")
            pictureInPictureController?.participantName = participantName as String?
        }
    }

    /// The URL string for the participant's profile image
    @objc public var participantImageURL: NSString? = nil {
        didSet {
            PictureInPictureLogger.log("RTCViewPip.participantImageURL didSet: \(participantImageURL as String? ?? "nil"), controller exists: \(pictureInPictureController != nil)")
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
                PictureInPictureLogger.log("No streamURL set, clearing track")
                DispatchQueue.main.async {
                    self.applyTrackStateToController(track: nil, isVideoEnabled: false)
                }
                return
            }

            guard let stream = self.webRtcModule?.stream(forReactTag: streamURLString) else {
                PictureInPictureLogger.log("No stream for streamURL: -\(streamURLString), clearing track")
                DispatchQueue.main.async {
                    self.applyTrackStateToController(track: nil, isVideoEnabled: false)
                }
                return
            }

            guard let videoTrack = stream.videoTracks.first else {
                PictureInPictureLogger.log("No video track for streamURL: -\(streamURLString), clearing track")
                DispatchQueue.main.async {
                    self.applyTrackStateToController(track: nil, isVideoEnabled: false)
                }
                return
            }
            if isSameTrackInstance(self.pictureInPictureController?.track, videoTrack) {
                PictureInPictureLogger.log("Skipping video track for streamURL: -\(streamURLString)")
                return
            }

            DispatchQueue.main.async {
                PictureInPictureLogger.log("Setting video track for streamURL: -\(streamURLString) trackId: \(videoTrack.trackId)")
                self.applyTrackStateToController(track: videoTrack, isVideoEnabled: true)
            }
        }
    }
    
    @objc func appBecameActive() {
        self.pictureInPictureController?.stopPictureInPicture()
    }
    
    
    @objc
    func onCallClosed() {
        PictureInPictureLogger.log("pictureInPictureController cleanup called")
        self.pictureInPictureController?.onPiPStateChange = nil
        self.pictureInPictureController?.onSizeUpdate = nil
        self.pictureInPictureController?.cleanup()
        self.pictureInPictureController = nil
        self.lastEmittedBounds = nil
    }
    
    @objc
    func setPreferredContentSize(_ size: CGSize) {
        PictureInPictureLogger.log("RTCViewPip setPreferredContentSize \(size)")
        self.pictureInPictureController?.setPreferredContentSize(size)
    }
    
    override func didMoveToSuperview() {
        super.didMoveToSuperview()
        if self.superview == nil {
            PictureInPictureLogger.log("RTCViewPip has been removed from its superview.")
            NotificationCenter.default.removeObserver(self)
            DispatchQueue.main.async {
                PictureInPictureLogger.log("onCallClosed called due to view detaching")
                self.onCallClosed()
            }
        } else {
            PictureInPictureLogger.log("RTCViewPip has been added to a superview.")
            setupNotificationObserver()
            DispatchQueue.main.async {
                // Recreate controller if it was previously cleaned up
                // This allows PiP to work again for subsequent calls
                let wasNil = self.pictureInPictureController == nil
                if wasNil {
                    PictureInPictureLogger.log("Recreating pictureInPictureController for new session")
                    self.pictureInPictureController = StreamPictureInPictureController()
                    // Re-apply all current properties to the new controller
                    // This is necessary because React Native may have set props while controller was nil
                    self.applyCurrentPropertiesToController()
                }
                self.pictureInPictureController?.sourceView = self
                self.pictureInPictureController?.isMirrored = self.mirror
                if let controller = self.pictureInPictureController {
                    self.installCallbacks(on: controller)
                }
                if let reactTag = self.reactTag,
                   let size = self.manager?.getCachedSize(for: reactTag) {
                    PictureInPictureLogger.log("Applying cached size \(size) for reactTag \(reactTag)")
                    self.setPreferredContentSize(size)
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
            PictureInPictureLogger.log("applyCurrentPropertiesToController: controller is nil, skipping")
            return
        }

        PictureInPictureLogger.log("applyCurrentPropertiesToController STARTING:")
        PictureInPictureLogger.log("  participantName: '\(participantName as String? ?? "nil")'")
        PictureInPictureLogger.log("  participantImageURL: '\(participantImageURL as String? ?? "nil")'")
        PictureInPictureLogger.log("  streamURL: '\(streamURL as String? ?? "nil")'")

        let resolvedTrack: RTCVideoTrack?
        let isVideoEnabled: Bool
        if let streamURLString = streamURL as String?,
           let stream = webRtcModule?.stream(forReactTag: streamURLString),
           let videoTrack = stream.videoTracks.first {
            PictureInPictureLogger.log("Re-applying track from streamURL: \(streamURLString), trackId: \(videoTrack.trackId)")
            resolvedTrack = videoTrack
            isVideoEnabled = true
        } else {
            // No stream URL or no track means video is disabled - show avatar
            PictureInPictureLogger.log("No valid stream/track, setting isVideoEnabled=false for avatar")
            resolvedTrack = nil
            isVideoEnabled = false
        }

        // Keep PiP content transitions store-driven with one snapshot update.
        controller.applyContentSnapshot(
            track: resolvedTrack,
            participantName: participantName as String?,
            participantImageURL: participantImageURL as String?,
            isVideoEnabled: isVideoEnabled,
            isScreenSharing: isScreenSharing,
            isReconnecting: isReconnecting
        )

        controller.hasAudio = hasAudio
        controller.isTrackPaused = isTrackPaused
        controller.isPinned = isPinned
        controller.isSpeaking = isSpeaking
        controller.connectionQuality = connectionQuality
        PictureInPictureLogger.log("applyCurrentPropertiesToController COMPLETED")
    }

    /// Applies track/video availability without splitting a single change into multiple setters.
    private func applyTrackStateToController(track: RTCVideoTrack?, isVideoEnabled: Bool) {
        pictureInPictureController?.applyContentSnapshot(
            track: track,
            participantName: participantName as String?,
            participantImageURL: participantImageURL as String?,
            isVideoEnabled: isVideoEnabled,
            isScreenSharing: isScreenSharing,
            isReconnecting: isReconnecting
        )
    }

    private func isSameTrackInstance(_ lhs: RTCVideoTrack?, _ rhs: RTCVideoTrack?) -> Bool {
        switch (lhs, rhs) {
        case (nil, nil):
            return true
        case let (lhsTrack?, rhsTrack?):
            return lhsTrack === rhsTrack
        default:
            return false
        }
    }
    
    // MARK: - Picture in Picture Events

    /// Ignore callbacks from a controller that has already been disposed.
    private func installCallbacks(on controller: StreamPictureInPictureController) {
        controller.onPiPStateChange = { [weak self, weak controller] isActive in
            guard let self, let controller,
                  self.pictureInPictureController === controller else { return }
            self.onPiPChange?(["active": isActive])
        }
        controller.onSizeUpdate = { [weak self, weak controller] size in
            guard let self, let controller,
                  self.pictureInPictureController === controller else { return }
            self.handleSizeUpdate(size)
        }
    }

    private func handleSizeUpdate(_ size: CGSize) {
        guard size.width.isFinite, size.height.isFinite else { return }
        // truncated to match the integer dimensions the inline views report.
        let bounds = CGSize(
            width: size.width.rounded(.towardZero),
            height: size.height.rounded(.towardZero)
        )
        guard bounds.width > 0, bounds.height > 0 else { return }
        guard let onPiPBoundsChange, lastEmittedBounds != bounds else { return }
        lastEmittedBounds = bounds
        onPiPBoundsChange(["width": bounds.width, "height": bounds.height])
    }
}
