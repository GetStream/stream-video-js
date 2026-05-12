//
// Copyright © 2024 Stream.io Inc. All rights reserved.
//

import AVKit
import Foundation

/// Describes an object that can be used to present picture-in-picture content.
protocol StreamAVPictureInPictureViewControlling: AnyObject {

    /// The closure to call whenever the picture-in-picture window size changes.
    var onSizeUpdate: ((CGSize) -> Void)? { get set }

    /// The track that will be rendered on picture-in-picture window.
    var track: RTCVideoTrack? { get set }

    /// The preferred size for the picture-in-picture window.
    /// - Important: This should **always** be greater to ``CGSize.zero``. If not, iOS throws
    /// a cryptic error with content `PGPegasus code:-1003`
    var preferredContentSize: CGSize { get set }

    /// Controls whether the rendered video should be mirrored.
    var isMirrored: Bool { get set }
    
    /// The layer that renders the incoming frames from WebRTC.
    var displayLayer: CALayer { get }

    // MARK: - Avatar Placeholder Properties

    /// The participant's name for the avatar placeholder
    var participantName: String? { get set }

    /// The URL string for the participant's profile image
    var participantImageURL: String? { get set }

    /// Whether video is enabled - when false, shows avatar placeholder
    var isVideoEnabled: Bool { get set }

    // MARK: - Reconnection Properties

    /// Whether the call is reconnecting - when true, shows reconnection view
    var isReconnecting: Bool { get set }

    // MARK: - Screen Sharing Properties

    /// Whether screen sharing is active (used for content state tracking)
    var isScreenSharing: Bool { get set }

    // MARK: - Participant Overlay Properties

    /// Whether the participant has audio enabled (shown in participant overlay)
    var hasAudio: Bool { get set }

    /// Whether the video track is paused (shown in participant overlay)
    var isTrackPaused: Bool { get set }

    /// Whether the participant is pinned (shown in participant overlay)
    var isPinned: Bool { get set }

    /// Whether the participant is currently speaking (shows border highlight)
    var isSpeaking: Bool { get set }

    /// The connection quality level (0: unknown, 1: poor, 2: good, 3: excellent)
    var connectionQuality: Int { get set }

    // MARK: - Content State System

    /// The content state manager for unified state handling.
    /// When set, the view controller subscribes to content changes automatically.
    var contentState: PictureInPictureContentState? { get set }

    /// The current content being displayed.
    /// Can be set directly for one-off updates or managed via contentState for reactive updates.
    var content: PictureInPictureContent { get set }
}

@available(iOS 15.0, *)
final class StreamAVPictureInPictureVideoCallViewController: AVPictureInPictureVideoCallViewController,
                                                             StreamAVPictureInPictureViewControlling {

    private let contentView: StreamPictureInPictureVideoRenderer =
        .init(windowSizePolicy: StreamPictureInPictureAdaptiveWindowSizePolicy())

    var onSizeUpdate: ((CGSize) -> Void)?

    var track: RTCVideoTrack? {
        get { contentView.track }
        set { contentView.track = newValue }
    }

    var isMirrored: Bool {
        get { contentView.isMirrored }
        set { contentView.isMirrored = newValue }
    }
    
    var displayLayer: CALayer { contentView.displayLayer }

    // MARK: - Avatar Placeholder Properties

    var participantName: String? {
        get { contentView.participantName }
        set { contentView.participantName = newValue }
    }

    var participantImageURL: String? {
        get { contentView.participantImageURL }
        set { contentView.participantImageURL = newValue }
    }

    var isVideoEnabled: Bool {
        get { contentView.isVideoEnabled }
        set { contentView.isVideoEnabled = newValue }
    }

    // MARK: - Reconnection Properties

    var isReconnecting: Bool {
        get { contentView.isReconnecting }
        set { contentView.isReconnecting = newValue }
    }

    // MARK: - Screen Sharing Properties

    var isScreenSharing: Bool {
        get { contentView.isScreenSharing }
        set { contentView.isScreenSharing = newValue }
    }

    // MARK: - Participant Overlay Properties

    var hasAudio: Bool {
        get { contentView.hasAudio }
        set { contentView.hasAudio = newValue }
    }

    var isTrackPaused: Bool {
        get { contentView.isTrackPaused }
        set { contentView.isTrackPaused = newValue }
    }

    var isPinned: Bool {
        get { contentView.isPinned }
        set { contentView.isPinned = newValue }
    }

    var isSpeaking: Bool {
        get { contentView.isSpeaking }
        set { contentView.isSpeaking = newValue }
    }

    var connectionQuality: Int {
        get { contentView.connectionQuality }
        set { contentView.connectionQuality = newValue }
    }

    // MARK: - Content State System

    var contentState: PictureInPictureContentState? {
        get { contentView.contentState }
        set { contentView.contentState = newValue }
    }

    var content: PictureInPictureContent {
        get { contentView.content }
        set { contentView.content = newValue }
    }

    // MARK: - Lifecycle

     @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    /// Initializes a new instance and sets the `preferredContentSize` to `Self.defaultPreferredContentSize`
    /// value.
    required init() {
        super.init(nibName: nil, bundle: nil)
        contentView.pictureInPictureWindowSizePolicy.controller = self
    }

    
    override func viewDidLoad() {
        super.viewDidLoad()
        setUp()
    }
    
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        contentView.bounds = view.bounds
        onSizeUpdate?(contentView.bounds.size)
    }
    
    // MARK: - Private helpers
    
    private func setUp() {
        view.subviews.forEach { $0.removeFromSuperview() }
        
        contentView.translatesAutoresizingMaskIntoConstraints = false
        
        view.addSubview(contentView)
        NSLayoutConstraint.activate([
            contentView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            contentView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            contentView.topAnchor.constraint(equalTo: view.topAnchor),
            contentView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        
        contentView.bounds = view.bounds
    }
}
