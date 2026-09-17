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

    /// Notifies JS about the picture-in-picture lifecycle. The payload keeps its
    /// `active` boolean and additionally carries the current `identity`.
    @objc var onPiPChange: RCTBubblingEventBlock? {
        didSet {
            // a freshly registered listener has to learn the current state.
            lastEmittedIsActive = nil
            replayCachedState()
        }
    }

    /// Notifies JS about the actual laid out bounds of the picture-in-picture
    /// window, in logical points, tagged with the current `identity`.
    @objc var onPiPBoundsChange: RCTBubblingEventBlock? {
        didSet {
            lastEmittedBounds = nil
            replayCachedState()
        }
    }

    /// Opaque identity issued by JS for this view and its window. It stays the
    /// same while the rendered participant or track changes, and every event is
    /// tagged with it, so that JS can reject the events of a view it replaced.
    @objc public var pipIdentity: NSString? = nil

    // MARK: - Cached Picture in Picture State

    /// The latest valid bounds reported by the current controller, in points.
    private var cachedBounds: CGSize?
    /// The latest lifecycle state reported by the current controller.
    private var cachedIsActive: Bool = false
    private var lastEmittedBounds: CGSize?
    private var lastEmittedIsActive: Bool?

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
        PictureInPictureLogger.log("pictureInPictureController cleanup called, identity: \(self.currentIdentity)")
        self.pictureInPictureController?.onPiPStateChange = nil
        self.pictureInPictureController?.onSizeUpdate = nil
        self.pictureInPictureController?.cleanup()
        self.pictureInPictureController = nil
        // the cached state describes the disposed controller, so it must not be
        // replayed to a listener or an identity registered afterwards.
        self.cachedBounds = nil
        self.cachedIsActive = false
        self.lastEmittedBounds = nil
        self.lastEmittedIsActive = nil
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

    private var currentIdentity: String {
        (pipIdentity as String?) ?? ""
    }

    /// Wires the controller callbacks. Both of them verify that they still come
    /// from the controller they were installed on, so that a queued callback of
    /// a disposed controller is dropped instead of being retagged with the
    /// identity of its replacement.
    private func installCallbacks(on controller: StreamPictureInPictureController) {
        controller.onPiPStateChange = { [weak self, weak controller] isActive in
            guard let self, let controller,
                  self.pictureInPictureController === controller else { return }
            self.cachedIsActive = isActive
            self.emitLifecycleIfNeeded()
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
        cachedBounds = bounds
        emitBoundsIfNeeded()
    }

    /// Replays the cached state, so that a newly registered listener does not
    /// have to wait for the next native change.
    ///
    /// An inactive lifecycle is deliberately not replayed: it tells a listener
    /// nothing it does not already assume, while re-emitting it would invoke
    /// the consumer facing callback for a size or selection only change.
    private func replayCachedState() {
        if cachedIsActive {
            emitLifecycleIfNeeded()
        }
        emitBoundsIfNeeded()
    }

    private func emitLifecycleIfNeeded() {
        guard let onPiPChange = onPiPChange else { return }
        guard lastEmittedIsActive != cachedIsActive else { return }
        lastEmittedIsActive = cachedIsActive

        PictureInPictureLogger.log(
            "Sending PiP state change event: \(cachedIsActive), identity: \(currentIdentity)"
        )
        onPiPChange(["active": cachedIsActive, "identity": currentIdentity])
    }

    private func emitBoundsIfNeeded() {
        guard let onPiPBoundsChange = onPiPBoundsChange, let bounds = cachedBounds else { return }
        guard lastEmittedBounds != bounds else { return }
        lastEmittedBounds = bounds

        PictureInPictureLogger.log(
            "Sending PiP bounds event: \(Int(bounds.width))x\(Int(bounds.height)) points"
                + " at displayScale \(traitCollection.displayScale), identity: \(currentIdentity)"
        )
        onPiPBoundsChange([
            "identity": currentIdentity,
            "width": bounds.width,
            "height": bounds.height
        ])
    }
}
