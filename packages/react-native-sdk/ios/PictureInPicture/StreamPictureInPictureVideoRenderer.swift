//
// Copyright © 2024 Stream.io Inc. All rights reserved.
//

import Combine
import Foundation

/// A view that can be used to render an instance of `RTCVideoTrack`
///
/// This view manages the display of different content types in the PiP window:
/// - Video content from a participant's camera or screen share
/// - Avatar placeholder when video is disabled
/// - Screen sharing indicator overlay
/// - Reconnection view during connection recovery
///
/// The content can be managed either through individual properties (legacy approach)
/// or through the unified `content` property using `PictureInPictureContent` enum.
final class StreamPictureInPictureVideoRenderer: UIView, RTCVideoRenderer {

    // MARK: - Content State (New unified approach)

    /// The current content being displayed, using the unified content enum.
    /// Setting this property automatically updates all overlay views and the video track.
    var content: PictureInPictureContent = .inactive {
        didSet {
            guard content != oldValue else { return }
            applyContent(content)
        }
    }

    /// The content state manager for reactive state updates.
    /// When set, the renderer subscribes to content changes automatically.
    var contentState: PictureInPictureContentState? {
        didSet {
            subscribeToContentState()
        }
    }

    /// Cancellable for content state subscription
    private var contentStateCancellable: AnyCancellable?

    // MARK: - Individual Properties (Legacy approach - still supported)

    /// The rendering track.
    var track: RTCVideoTrack? {
        didSet {
            // Whenever the track changes we perform the following operations if possible:
            // - stopFrameStreaming for the old track
            // - startFrameStreaming for the new track and only if we are already
            // in picture-in-picture.
            NSLog("PiP - Renderer: track changed from \(oldValue?.trackId ?? "nil") to \(track?.trackId ?? "nil")")
            guard oldValue != track else { return }
            trackSize = .zero
            prepareForTrackRendering(oldValue)
            // Update overlay visibility when track changes (may need to show avatar if track is nil)
            updateOverlayVisibility()
        }
    }

    /// The layer that renders the track's frames.
    var displayLayer: CALayer { contentView.layer }

    /// A policy defining how the Picture in Picture window should be resized in order to better fit
    /// the rendering frame size.
    var pictureInPictureWindowSizePolicy: PictureInPictureWindowSizePolicy

    // MARK: - Avatar Placeholder Properties

    /// The participant's name for the avatar and overlay
    var participantName: String? {
        didSet {
            NSLog("PiP - Renderer.participantName didSet: '\(participantName ?? "nil")', forwarding to avatarView")
            avatarView.participantName = participantName
            participantOverlayView.participantName = participantName
        }
    }

    /// The URL string for the participant's profile image
    var participantImageURL: String? {
        didSet {
            avatarView.imageURL = participantImageURL
        }
    }

    /// Whether video is enabled - when false, shows avatar placeholder
    var isVideoEnabled: Bool = true {
        didSet {
            NSLog("PiP - Renderer: isVideoEnabled changed from \(oldValue) to \(isVideoEnabled), avatarView.participantName='\(avatarView.participantName ?? "nil")'")
            updateOverlayVisibility()
        }
    }

    /// Whether the call is reconnecting - when true, shows reconnection view
    var isReconnecting: Bool = false {
        didSet {
            reconnectionView.isReconnecting = isReconnecting
            updateOverlayVisibility()
        }
    }

    /// Whether screen sharing is active (used for content state tracking)
    var isScreenSharing: Bool = false

    /// Whether the participant has audio enabled (shown in participant overlay)
    var hasAudio: Bool = true {
        didSet {
            participantOverlayView.hasAudio = hasAudio
        }
    }

    /// Whether the video track is paused (shown in participant overlay)
    var isTrackPaused: Bool = false {
        didSet {
            participantOverlayView.isTrackPaused = isTrackPaused
        }
    }

    /// Whether the participant is pinned (shown in participant overlay)
    var isPinned: Bool = false {
        didSet {
            participantOverlayView.isPinned = isPinned
        }
    }

    /// Whether the participant is currently speaking (shows border highlight)
    var isSpeaking: Bool = false {
        didSet {
            updateSpeakingIndicator()
        }
    }

    /// The connection quality level (0: unknown, 1: poor, 2: good, 3: excellent)
    var connectionQuality: Int = 0 {
        didSet {
            connectionQualityIndicator.connectionQuality = PictureInPictureConnectionQualityIndicator.ConnectionQuality(rawValue: connectionQuality) ?? .unspecified
        }
    }

    /// Whether the participant overlay is enabled
    var isParticipantOverlayEnabled: Bool = true {
        didSet {
            participantOverlayView.isOverlayEnabled = isParticipantOverlayEnabled
        }
    }

    /// The publisher which is used to streamline the frames received from the track.
    private let bufferPublisher: PassthroughSubject<CMSampleBuffer, Never> = .init()
    
    /// The view that contains the rendering layer.
    private lazy var contentView: SampleBufferVideoCallView = {
        let contentView = SampleBufferVideoCallView()
        contentView.translatesAutoresizingMaskIntoConstraints = false
        contentView.contentMode = .scaleAspectFill
        contentView.videoGravity = .resizeAspectFill
        contentView.preventsDisplaySleepDuringVideoPlayback = true
        return contentView
    }()
    
    /// The transformer used to transform and downsample a RTCVideoFrame's buffer.
    private var bufferTransformer = StreamBufferTransformer()
    
    /// The cancellable used to control the bufferPublisher stream.
    private var bufferUpdatesCancellable: AnyCancellable?
    
    /// The view's size.
    /// - Note: We are using this property instead for `frame.size` or `bounds.size` so we can
    /// access it from any thread.
    private var contentSize: CGSize = .zero
    
    /// The track's size.
    private var trackSize: CGSize = .zero {
        didSet {
            guard trackSize != oldValue else { return }
            didUpdateTrackSize()
        }
    }

    /// A property that defines if the RTCVideoFrame instances that will be rendered need to be resized
    /// to fid the view's contentSize.
    private var requiresResize = false {
        didSet { bufferTransformer.requiresResize = requiresResize }
    }
    
    /// As we are operate in smaller rendering bounds we skip frames depending on this property's value
    /// to improve performance.
    /// - Note: The number of frames to skip is being calculated based on the ``trackSize`` and
    /// ``contentSize``. It takes into account also the ``sizeRatioThreshold``
    private var noOfFramesToSkipAfterRendering = 1
    
    /// The number of frames that we have skipped so far. This is used as a step counter in the
    /// ``renderFrame(_:)``.
    private var skippedFrames = 0
    
    /// We render frames every time the stepper/counter value is 0 and have a valid trackSize.
    private var shouldRenderFrame: Bool { skippedFrames == 0 && trackSize != .zero }
    
    /// A size ratio threshold used to determine if resizing is required.
    /// - Note: It seems that Picture-in-Picture doesn't like rendering frames that are bigger than its
    /// window size. For this reason, we are setting the resizeThreshold to `1`.
    private let resizeRequiredSizeRatioThreshold: CGFloat = 1
    
    /// A size ratio threshold used to determine if skipping frames is required.
    private let sizeRatioThreshold: CGFloat = 15

    /// The avatar view shown when video is disabled
    /// Note: Uses alpha=0 for visibility instead of isHidden to match upstream SwiftUI behavior
    /// and ensure layoutSubviews is always called for proper constraint layout.
    private lazy var avatarView: PictureInPictureAvatarView = {
        let view = PictureInPictureAvatarView()
        view.translatesAutoresizingMaskIntoConstraints = false
        view.alpha = 0 // Initially invisible (video enabled by default)
        return view
    }()

    /// The reconnection view shown when connection is being recovered
    private lazy var reconnectionView: PictureInPictureReconnectionView = {
        let view = PictureInPictureReconnectionView()
        view.translatesAutoresizingMaskIntoConstraints = false
        view.isHidden = true // Initially hidden (not reconnecting by default)
        return view
    }()


    /// The participant overlay view showing name and mute status
    private lazy var participantOverlayView: PictureInPictureParticipantOverlayView = {
        let view = PictureInPictureParticipantOverlayView()
        view.translatesAutoresizingMaskIntoConstraints = false
        return view
    }()

    /// Connection quality indicator view (bottom-right)
    private lazy var connectionQualityIndicator: PictureInPictureConnectionQualityIndicator = {
        let view = PictureInPictureConnectionQualityIndicator()
        view.translatesAutoresizingMaskIntoConstraints = false
        return view
    }()

    /// Speaking indicator border layer
    private lazy var speakingBorderLayer: CAShapeLayer = {
        let layer = CAShapeLayer()
        layer.fillColor = UIColor.clear.cgColor
        layer.strokeColor = UIColor(red: 0.0, green: 0.8, blue: 0.6, alpha: 1.0).cgColor // Teal green
        layer.lineWidth = 2
        layer.isHidden = true
        return layer
    }()

    /// The speaking indicator corner radius (matches upstream)
    private var speakingCornerRadius: CGFloat {
        if #available(iOS 26.0, *) {
            return 32
        } else {
            return 16
        }
    }

    // MARK: - Lifecycle
    
    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }
    
    init(windowSizePolicy: PictureInPictureWindowSizePolicy) {
        pictureInPictureWindowSizePolicy = windowSizePolicy
        super.init(frame: .zero)
        setUp()
    }
    
    override func willMove(toWindow newWindow: UIWindow?) {
        super.willMove(toWindow: newWindow)
        // Depending on the window we are moving we either start or stop
        // streaming frames from the track.
        if newWindow != nil {
            NSLog("PiP - Renderer: willMove(toWindow:) - added to window, track=\(track?.trackId ?? "nil"), isVideoEnabled=\(isVideoEnabled)")
            trackSize = .zero
            updateOverlayVisibility()
            startFrameStreaming(for: track, on: newWindow)
        } else {
            NSLog("PiP - Renderer: willMove(toWindow:) - removed from window")
            stopFrameStreaming(for: track)
            trackSize = .zero
            updateOverlayVisibility()
        }
    }
    
    override func layoutSubviews() {
        super.layoutSubviews()
        contentSize = frame.size

        // Update speaking border frame
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        speakingBorderLayer.frame = bounds
        speakingBorderLayer.path = UIBezierPath(roundedRect: bounds.insetBy(dx: 1, dy: 1), cornerRadius: speakingCornerRadius).cgPath
        CATransaction.commit()
    }
    
    // MARK: - Rendering lifecycle
    
    /// This method is being called from WebRTC and asks the container to set its size to the track's size.
    func setSize(_ size: CGSize) {
        trackSize = size
    }
    
    func renderFrame(_ frame: RTCVideoFrame?) {
        guard let frame = frame else {
            return
        }

        // Ignore empty frames
        if frame.width <= 0 || frame.height <= 0 {
            return
        }

        // Update the trackSize and re-calculate rendering properties if the size
        // has changed.
        trackSize = .init(width: Int(frame.width), height: Int(frame.height))
        
        defer {
            handleFrameSkippingIfRequired()
        }
        
        guard shouldRenderFrame else {
            return
        }

        if
            let yuvBuffer = bufferTransformer.transformAndResizeIfRequired(frame, targetSize: contentSize)?
            .buffer as? StreamRTCYUVBuffer,
            let sampleBuffer = yuvBuffer.sampleBuffer {
            bufferPublisher.send(sampleBuffer)
        } 
    }
    
    // MARK: - Private helpers
    
    /// Set up the view's hierarchy.
    private func setUp() {
        // Add speaking border layer first (behind everything else)
        layer.addSublayer(speakingBorderLayer)

        addSubview(contentView)
        addSubview(avatarView)
        addSubview(reconnectionView)
        addSubview(participantOverlayView)
        addSubview(connectionQualityIndicator)

        NSLayoutConstraint.activate([
            contentView.leadingAnchor.constraint(equalTo: leadingAnchor),
            contentView.trailingAnchor.constraint(equalTo: trailingAnchor),
            contentView.topAnchor.constraint(equalTo: topAnchor),
            contentView.bottomAnchor.constraint(equalTo: bottomAnchor),

            avatarView.leadingAnchor.constraint(equalTo: leadingAnchor),
            avatarView.trailingAnchor.constraint(equalTo: trailingAnchor),
            avatarView.topAnchor.constraint(equalTo: topAnchor),
            avatarView.bottomAnchor.constraint(equalTo: bottomAnchor),

            reconnectionView.leadingAnchor.constraint(equalTo: leadingAnchor),
            reconnectionView.trailingAnchor.constraint(equalTo: trailingAnchor),
            reconnectionView.topAnchor.constraint(equalTo: topAnchor),
            reconnectionView.bottomAnchor.constraint(equalTo: bottomAnchor),

            // Participant overlay positioned at bottom
            participantOverlayView.leadingAnchor.constraint(equalTo: leadingAnchor),
            participantOverlayView.trailingAnchor.constraint(equalTo: trailingAnchor),
            participantOverlayView.topAnchor.constraint(equalTo: topAnchor),
            participantOverlayView.bottomAnchor.constraint(equalTo: bottomAnchor),

            // Connection quality indicator at bottom-right
            connectionQualityIndicator.trailingAnchor.constraint(equalTo: trailingAnchor),
            connectionQualityIndicator.bottomAnchor.constraint(equalTo: bottomAnchor),
            connectionQualityIndicator.widthAnchor.constraint(equalToConstant: 28),
            connectionQualityIndicator.heightAnchor.constraint(equalToConstant: 28)
        ])
    }

    /// Updates the visibility of overlay views based on current state.
    /// Priority: reconnection view > avatar view > video content
    ///
    /// The avatar view is shown when:
    /// - Video is explicitly disabled (isVideoEnabled = false), OR
    /// - Track is nil
    ///
    /// IMPORTANT: Participant overlay (name, mic, connection quality) is shown on top of BOTH
    /// video AND avatar views, matching the upstream stream-video-swift implementation.
    /// The overlay is only hidden during reconnection.
    private func updateOverlayVisibility() {
        // Reconnection view takes highest priority
        if isReconnecting {
            NSLog("PiP - updateOverlayVisibility: isReconnecting=true, hiding avatar, showing reconnection")
            reconnectionView.isHidden = false
            avatarView.alpha = 0
            avatarView.isVideoEnabled = true
            // Hide participant overlay ONLY during reconnection (matches upstream)
            participantOverlayView.isOverlayEnabled = false
        } else {
            reconnectionView.isHidden = true
            // Avatar view shows when video is disabled OR when we don't have a track
            let shouldShowVideo = isVideoEnabled && track != nil
            let shouldShowAvatar = !shouldShowVideo
            NSLog("PiP - updateOverlayVisibility: isVideoEnabled=\(isVideoEnabled), track=\(track?.trackId ?? "nil"), shouldShowAvatar=\(shouldShowAvatar)")

            // Update avatar visibility - setting isVideoEnabled triggers internal layout
            avatarView.isVideoEnabled = !shouldShowAvatar
            avatarView.alpha = shouldShowAvatar ? 1 : 0

            // Force layout when avatar becomes visible to ensure proper sizing
            if shouldShowAvatar {
                NSLog("PiP - updateOverlayVisibility: showing avatar, forcing layout. participantName=\(participantName ?? "nil"), avatarView.participantName='\(avatarView.participantName ?? "nil")'")
                avatarView.setNeedsLayout()
                avatarView.layoutIfNeeded()
            }

            // Participant overlay shows on BOTH video and avatar (matches upstream)
            // Only hide during reconnection
            participantOverlayView.isOverlayEnabled = true
        }
    }

    /// Updates the speaking indicator border visibility based on isSpeaking state.
    /// The border is shown when the participant is speaking, on BOTH video and avatar views
    /// (matching upstream behavior). Only hidden during reconnection.
    private func updateSpeakingIndicator() {
        let shouldShowBorder = isSpeaking && !isReconnecting
        speakingBorderLayer.isHidden = !shouldShowBorder
    }

    /// A method used to process the frame's buffer and enqueue on the rendering view.
    private func process(_ buffer: CMSampleBuffer) {
        guard
            bufferUpdatesCancellable != nil,
            let trackId = track?.trackId,
            buffer.isValid
        else {
            contentView.renderingComponent.flush()
            return
        }
        
        if #available(iOS 14.0, *) {
            if contentView.renderingComponent.requiresFlushToResumeDecoding == true {
                contentView.renderingComponent.flush()
            }
        }
        
        if contentView.renderingComponent.isReadyForMoreMediaData {
            contentView.renderingComponent.enqueue(buffer)
        }
    }
    
    /// A method used to start consuming frames from the track.
    /// - Note: In order to avoid unnecessary processing, we only start consuming track's frames when
    /// the view has been added on a window (which means that picture-in-picture view is visible).
    private func startFrameStreaming(
        for track: RTCVideoTrack?,
        on window: UIWindow?
    ) {
        guard window != nil, let track else { return }

        bufferUpdatesCancellable = bufferPublisher
            .receive(on: DispatchQueue.main)
            .sink { [weak self] in self?.process($0) }

        track.add(self)
    }

    /// A method that stops the frame consumption from the track. Used automatically when the rendering
    /// view move's away from the window or when the track changes.
    private func stopFrameStreaming(for track: RTCVideoTrack?) {
        guard bufferUpdatesCancellable != nil else { return }
        bufferUpdatesCancellable?.cancel()
        bufferUpdatesCancellable = nil
        track?.remove(self)
        contentView.renderingComponent.flush()
    }
    
    /// A method used to calculate rendering required properties, every time the trackSize changes.
    private func didUpdateTrackSize() {
        guard contentSize != .zero, trackSize != .zero else { return }
        
        let widthDiffRatio = trackSize.width / contentSize.width
        let heightDiffRatio = trackSize.height / contentSize.height
        requiresResize = widthDiffRatio >= resizeRequiredSizeRatioThreshold || heightDiffRatio >= resizeRequiredSizeRatioThreshold
        let requiresFramesSkipping = widthDiffRatio >= sizeRatioThreshold || heightDiffRatio >= sizeRatioThreshold
        
        /// Skipping frames is decided based on how much bigger is the incoming frame's size compared
        /// to PiP window's size.
        noOfFramesToSkipAfterRendering = requiresFramesSkipping ? max(Int(max(Int(widthDiffRatio), Int(heightDiffRatio)) / 2), 1) :
        0
        skippedFrames = 0

         /// We update the provided windowSizePolicy with the size of the track we received, transformed
        /// to the value that fits.
        pictureInPictureWindowSizePolicy.trackSize = trackSize
    }
    
    /// A method used to handle the frameSkipping(step) during frame consumption.
    private func handleFrameSkippingIfRequired() {
        if noOfFramesToSkipAfterRendering > 0 {
            if skippedFrames == noOfFramesToSkipAfterRendering {
                skippedFrames = 0
            } else {
                skippedFrames += 1
            }
        } else if skippedFrames > 0 {
            skippedFrames = 0
        }
    }
    
    /// A method used to prepare the view for a new track rendering.
    private func prepareForTrackRendering(_ oldValue: RTCVideoTrack?) {
        stopFrameStreaming(for: oldValue)
        noOfFramesToSkipAfterRendering = 0
        skippedFrames = 0
        requiresResize = false
        startFrameStreaming(for: track, on: window)
    }

    // MARK: - Content State System

    /// Subscribes to the content state manager for reactive updates.
    private func subscribeToContentState() {
        contentStateCancellable?.cancel()
        contentStateCancellable = nil

        guard let contentState = contentState else { return }

        contentStateCancellable = contentState.contentPublisher
            .receive(on: DispatchQueue.main)
            .sink { [weak self] newContent in
                self?.content = newContent
            }
    }

    /// Applies the given content state to update all view components.
    /// This method synchronizes the unified content enum with the individual properties
    /// for backward compatibility while providing a cleaner API.
    private func applyContent(_ content: PictureInPictureContent) {
        switch content {
        case .inactive:
            // Clear everything
            track = nil
            participantName = nil
            participantImageURL = nil
            isVideoEnabled = true
            isReconnecting = false
            isScreenSharing = false

        case let .video(newTrack, name, imageURL):
            // Show video content
            track = newTrack
            participantName = name
            participantImageURL = imageURL
            isVideoEnabled = true
            isReconnecting = false
            isScreenSharing = false

        case let .screenSharing(newTrack, name):
            // Show screen sharing content with indicator
            track = newTrack
            participantName = name
            participantImageURL = nil
            isVideoEnabled = true
            isReconnecting = false
            isScreenSharing = true

        case let .avatar(name, imageURL):
            // Show avatar placeholder (video disabled)
            // Keep existing track for potential quick re-enable
            participantName = name
            participantImageURL = imageURL
            isVideoEnabled = false
            isReconnecting = false
            isScreenSharing = false

        case .reconnecting:
            // Show reconnection view
            // Keep existing track and participant info for recovery
            isReconnecting = true
            isScreenSharing = false
        }
    }

    /// Returns the current content as a `PictureInPictureContent` enum value.
    /// This is useful for reading the current state in a unified way.
    func getCurrentContent() -> PictureInPictureContent {
        if isReconnecting {
            return .reconnecting
        } else if !isVideoEnabled {
            return .avatar(participantName: participantName, participantImageURL: participantImageURL)
        } else if isScreenSharing {
            return .screenSharing(track: track, participantName: participantName)
        } else if track != nil {
            return .video(track: track, participantName: participantName, participantImageURL: participantImageURL)
        } else {
            return .avatar(participantName: participantName, participantImageURL: participantImageURL)
        }
    }
}
