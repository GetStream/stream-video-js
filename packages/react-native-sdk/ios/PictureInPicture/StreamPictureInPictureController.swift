//
// Copyright © 2024 Stream.io Inc. All rights reserved.
//

import AVKit
import Combine
import Foundation

/// A controller class for picture-in-picture whenever that is possible.
///
/// This controller manages the Picture-in-Picture window state and handles transitions
/// between foreground and background states. It uses the `PictureInPictureContentState`
/// for centralized state management and a delegate proxy pattern to enable reactive
/// handling of PiP lifecycle events.
@objc final class StreamPictureInPictureController: NSObject {

    // MARK: - Properties

    /// The RTCVideoTrack for which the picture-in-picture session is created.
    @objc public var track: RTCVideoTrack? {
        didSet {
            didUpdate(track) // Called when the `track` property changes
        }
    }

    /// The UIView that contains the video content.
    @objc public var sourceView: UIView? {
        didSet {
            didUpdate(sourceView) // Called when the `sourceView` property changes
        }
    }

    /// A closure called when the picture-in-picture view's size changes.
    public var onSizeUpdate: ((CGSize) -> Void)? {
        didSet {
            contentViewController?.onSizeUpdate = onSizeUpdate // Updates the onSizeUpdate closure of the content view controller
        }
    }

    /// A closure called when the picture-in-picture state changes.
    public var onPiPStateChange: ((Bool) -> Void)?

    /// A boolean value indicating whether the picture-in-picture session should start automatically when the app enters background.
    public var canStartPictureInPictureAutomaticallyFromInline: Bool

    // MARK: - Content State Properties
    // These properties update the centralized content state, which manages view switching

    /// The participant's name for the avatar placeholder
    @objc public var participantName: String? {
        didSet {
            NSLog("PiP - Controller.participantName didSet: '\(participantName ?? "nil")', contentViewController exists: \(contentViewController != nil)")
            contentState.participantName = participantName
            // Also update directly for immediate response (legacy path)
            contentViewController?.participantName = participantName
        }
    }

    /// The URL string for the participant's profile image
    @objc public var participantImageURL: String? {
        didSet {
            contentState.participantImageURL = participantImageURL
            // Also update directly for immediate response (legacy path)
            contentViewController?.participantImageURL = participantImageURL
        }
    }

    /// Whether video is enabled - when false, shows avatar placeholder
    @objc public var isVideoEnabled: Bool = true {
        didSet {
            contentState.isVideoEnabled = isVideoEnabled
            // Also update directly for immediate response (legacy path)
            contentViewController?.isVideoEnabled = isVideoEnabled
        }
    }

    /// Whether the call is reconnecting - when true, shows reconnection view
    @objc public var isReconnecting: Bool = false {
        didSet {
            contentState.isReconnecting = isReconnecting
            // Also update directly for immediate response (legacy path)
            contentViewController?.isReconnecting = isReconnecting
        }
    }

    /// Whether screen sharing is active (used for content state tracking)
    @objc public var isScreenSharing: Bool = false {
        didSet {
            contentState.isScreenSharing = isScreenSharing
            // Also update directly for immediate response (legacy path)
            contentViewController?.isScreenSharing = isScreenSharing
        }
    }

    /// Whether the participant has audio enabled (shown in participant overlay)
    @objc public var hasAudio: Bool = true {
        didSet {
            contentViewController?.hasAudio = hasAudio
        }
    }

    /// Whether the video track is paused (shown in participant overlay)
    @objc public var isTrackPaused: Bool = false {
        didSet {
            contentViewController?.isTrackPaused = isTrackPaused
        }
    }

    /// Whether the participant is pinned (shown in participant overlay)
    @objc public var isPinned: Bool = false {
        didSet {
            contentViewController?.isPinned = isPinned
        }
    }

    /// Whether the participant is currently speaking (shows border highlight)
    @objc public var isSpeaking: Bool = false {
        didSet {
            contentViewController?.isSpeaking = isSpeaking
        }
    }

    /// The connection quality level (0: unknown, 1: poor, 2: good, 3: excellent)
    @objc public var connectionQuality: Int = 0 {
        didSet {
            contentViewController?.connectionQuality = connectionQuality
        }
    }

    // MARK: - Private Properties

    /// The AVPictureInPictureController object.
    private var pictureInPictureController: AVPictureInPictureController?

    /// The StreamAVPictureInPictureViewControlling object that manages the picture-in-picture view.
    private var contentViewController: StreamAVPictureInPictureViewControlling?

    /// Centralized content state manager for unified state handling.
    /// This manages the content switching between video, avatar, reconnection, and screen share views.
    private let contentState = PictureInPictureContentState()

    /// A set of `AnyCancellable` objects used to manage subscriptions.
    private var cancellableBag: Set<AnyCancellable> = []

    /// Delegate proxy that publishes PiP lifecycle events via Combine.
    private let delegateProxy = PictureInPictureDelegateProxy()

    /// Adapter responsible for enforcing the stop of PiP when the app returns to foreground.
    private var enforcedStopAdapter: PictureInPictureEnforcedStopAdapter?

    /// A `StreamPictureInPictureTrackStateAdapter` object that manages the state of the
    /// active track.
    private let trackStateAdapter: StreamPictureInPictureTrackStateAdapter = .init()
    
    // MARK: - Content State Access

    /// Returns the current content being displayed in the PiP window.
    /// This is useful for debugging and logging purposes.
    var currentContent: PictureInPictureContent {
        contentState.content
    }

    // MARK: - Lifecycle

    /// Initializes the controller and creates the content view
    ///
    /// - Parameter canStartPictureInPictureAutomaticallyFromInline A boolean value
    /// indicating whether the picture-in-picture session should start automatically when the app enters
    /// background.
    ///
    /// - Returns `nil` if AVPictureInPictureController is not supported, or the controller otherwise.
    init?(canStartPictureInPictureAutomaticallyFromInline: Bool = true) {
        guard AVPictureInPictureController.isPictureInPictureSupported() else {
            return nil
        }

        let contentViewController: StreamAVPictureInPictureViewControlling? = {
            if #available(iOS 15.0, *) {
                return StreamAVPictureInPictureVideoCallViewController()
            } else {
                return nil
            }
        }()
        // Set a default preferred content size to avoid iOS PGPegasus code:-1003 error
        // This will be updated later when track dimensions become available
        contentViewController?.preferredContentSize = .init(width: 640, height: 480)
        self.contentViewController = contentViewController
        self.canStartPictureInPictureAutomaticallyFromInline = canStartPictureInPictureAutomaticallyFromInline
        super.init()

        // Wire up the content state to the view controller for reactive updates (US-008)
        // This enables the unified content view system where contentState changes
        // automatically drive view switching in the renderer
        contentViewController?.contentState = contentState

        // Subscribe to delegate proxy events for reactive PiP state handling
        setupDelegateProxySubscriptions()

        // Subscribe to content state changes for logging
        setupContentStateSubscriptions()
    }

    // MARK: - Private Setup

    /// Sets up subscriptions to the delegate proxy's event publisher.
    private func setupDelegateProxySubscriptions() {
        delegateProxy.publisher
            .sink { [weak self] event in
                self?.handleDelegateEvent(event)
            }
            .store(in: &cancellableBag)
    }

    /// Sets up subscriptions to content state changes for logging and debugging.
    private func setupContentStateSubscriptions() {
        contentState.contentPublisher
            .removeDuplicates()
            .sink { [weak self] content in
                NSLog("PiP - Content state changed to: \(content)")
            }
            .store(in: &cancellableBag)
    }

    /// Handles events from the delegate proxy.
    private func handleDelegateEvent(_ event: PictureInPictureDelegateProxy.Event) {
        switch event {
        case .didStart:
            onPiPStateChange?(true)
        case .didStop:
            onPiPStateChange?(false)
        case let .failedToStart(_, error):
            NSLog("PiP - failedToStartPictureInPictureWithError: \(error.localizedDescription)")
            // Notify JS that PiP failed to start so it can update its state accordingly
            onPiPStateChange?(false)
        case let .restoreUI(_, completionHandler):
            completionHandler(true)
        case .willStart, .willStop:
            // No action needed for will start/stop events
            break
        }
    }
    
    func setPreferredContentSize(_ size: CGSize) {
        // Guard against setting zero size to avoid iOS PGPegasus code:-1003 error
        guard size.width > 0, size.height > 0 else {
            NSLog("PiP - Ignoring setPreferredContentSize with zero dimensions: \(size)")
            return
        }
        contentViewController?.preferredContentSize = size
    }

    // MARK: - Private helpers

    private func didUpdate(_ track: RTCVideoTrack?) {
        // Update content state with new track
        contentState.track = track
        // Also update directly for immediate response (legacy path)
        contentViewController?.track = track
        trackStateAdapter.activeTrack = track
    }
    
    @objc private func didUpdate(_ sourceView: UIView?) {
        if let sourceView {
            // If picture-in-picture isn't active, just create a new controller.
            if pictureInPictureController?.isPictureInPictureActive != true {
                makePictureInPictureController(with: sourceView)
                
                pictureInPictureController?
                    .publisher(for: \.isPictureInPicturePossible)
                    .sink { NSLog("PiP - isPictureInPicturePossible:\($0)") }
                    .store(in: &cancellableBag)
                
                pictureInPictureController?
                    .publisher(for: \.isPictureInPictureActive)
                    .removeDuplicates()
                    .sink { [weak self] in self?.didUpdatePictureInPictureActiveState($0) }
                    .store(in: &cancellableBag)
            } else {
                // If picture-in-picture is active, simply update the sourceView.
                makePictureInPictureController(with: sourceView)
            }
        } else {
            if #available(iOS 15.0, *) {
                pictureInPictureController?.contentSource = nil
            }
        }
    }
    
    @objc func cleanup() {
        // Cancel all Combine subscriptions
        cancellableBag.removeAll()

        // Reset the content state to inactive
        contentState.reset()

        // Disable the track state adapter to stop its timer
        trackStateAdapter.isEnabled = false
        trackStateAdapter.activeTrack = nil

        // Release the enforced stop adapter
        enforcedStopAdapter = nil

        sourceView = nil
        contentViewController?.track = nil
        contentViewController = nil
        if #available(iOS 15.0, *) {
            pictureInPictureController?.contentSource = nil
        }
        pictureInPictureController?.delegate = nil
        pictureInPictureController = nil
    }
    
    private func makePictureInPictureController(with sourceView: UIView) {
        if #available(iOS 15.0, *),
           let contentViewController = contentViewController as? StreamAVPictureInPictureVideoCallViewController {
            pictureInPictureController = .init(
                contentSource: .init(
                    activeVideoCallSourceView: sourceView,
                    contentViewController: contentViewController
                )
            )
        }

        if #available(iOS 14.2, *) {
            pictureInPictureController?
                .canStartPictureInPictureAutomaticallyFromInline = canStartPictureInPictureAutomaticallyFromInline
        }

        // Use the delegate proxy for reactive event handling
        pictureInPictureController?.delegate = delegateProxy

        // Create the enforced stop adapter to handle app foreground transitions
        if let pipController = pictureInPictureController {
            enforcedStopAdapter = PictureInPictureEnforcedStopAdapter(pipController)
        }
    }
    
    private func didUpdatePictureInPictureActiveState(_ isActive: Bool) {
        trackStateAdapter.isEnabled = isActive
    }
    
    func stopPictureInPicture() {
        if (pictureInPictureController?.isPictureInPictureActive ?? false) {
            pictureInPictureController?.stopPictureInPicture()
        }
    }
}
