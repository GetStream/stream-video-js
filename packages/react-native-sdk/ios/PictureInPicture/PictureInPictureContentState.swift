//
// Copyright © 2024 Stream.io Inc. All rights reserved.
//
// Adapted from stream-video-swift PictureInPictureStore for React Native SDK
// The React Native SDK receives state from the JavaScript bridge rather than
// observing call state internally, so this is a simplified state container.
//

import Combine
import Foundation

/// Manages the content state for the Picture-in-Picture window.
///
/// This class provides centralized state management for the PiP content view system.
/// Unlike the upstream `PictureInPictureStore` which uses a Flux-like action/dispatch pattern,
/// this implementation is optimized for the React Native bridge where state updates come
/// from the JavaScript layer.
///
/// State changes are published via Combine to allow reactive updates in the view layer.
final class PictureInPictureContentState: @unchecked Sendable {

    // MARK: - Published State

    /// The current content being displayed in the PiP window
    @Published private(set) var content: PictureInPictureContent = .inactive

    /// Publisher for observing content changes
    var contentPublisher: AnyPublisher<PictureInPictureContent, Never> {
        $content.eraseToAnyPublisher()
    }

    // MARK: - Raw State Properties
    // These properties are set from the React Native bridge

    /// The current video track
    var track: RTCVideoTrack? {
        didSet { updateContent() }
    }

    /// The participant's name
    var participantName: String? {
        didSet { updateContent() }
    }

    /// The participant's profile image URL
    var participantImageURL: String? {
        didSet { updateContent() }
    }

    /// Whether video is enabled for the participant
    var isVideoEnabled: Bool = true {
        didSet { updateContent() }
    }

    /// Whether screen sharing is active
    var isScreenSharing: Bool = false {
        didSet { updateContent() }
    }

    /// Whether the call is reconnecting
    var isReconnecting: Bool = false {
        didSet { updateContent() }
    }

    // MARK: - Private

    /// Serial queue for thread-safe state updates
    private let stateQueue = DispatchQueue(label: "io.getstream.pip.content.state", qos: .userInteractive)

    // MARK: - Initialization

    init() {}

    // MARK: - State Update

    /// Updates the content based on current state properties.
    /// Priority order: reconnecting > avatar (video disabled) > screen sharing > video > inactive
    private func updateContent() {
        stateQueue.async { [weak self] in
            guard let self = self else { return }

            let newContent: PictureInPictureContent

            // Priority 1: Reconnection takes precedence
            if self.isReconnecting {
                newContent = .reconnecting
            }
            // Priority 2: Avatar when video is disabled
            else if !self.isVideoEnabled {
                newContent = .avatar(
                    participantName: self.participantName,
                    participantImageURL: self.participantImageURL
                )
            }
            // Priority 3: Screen sharing
            else if self.isScreenSharing {
                newContent = .screenSharing(
                    track: self.track,
                    participantName: self.participantName
                )
            }
            // Priority 4: Video when track is available
            else if self.track != nil {
                newContent = .video(
                    track: self.track,
                    participantName: self.participantName,
                    participantImageURL: self.participantImageURL
                )
            }
            // Default: Avatar placeholder when video is expected but no track yet
            else {
                newContent = .avatar(
                    participantName: self.participantName,
                    participantImageURL: self.participantImageURL
                )
            }

            // Only update if content actually changed
            if self.content != newContent {
                DispatchQueue.main.async {
                    self.content = newContent
                }
            }
        }
    }

    /// Resets all state to defaults.
    /// Called when cleaning up after a call ends.
    func reset() {
        stateQueue.async { [weak self] in
            guard let self = self else { return }
            self.track = nil
            self.participantName = nil
            self.participantImageURL = nil
            self.isVideoEnabled = true
            self.isScreenSharing = false
            self.isReconnecting = false

            DispatchQueue.main.async {
                self.content = .inactive
            }
        }
    }
}

// MARK: - Content State Convenience Extension

extension PictureInPictureContentState {

    /// Convenience method to update multiple properties at once.
    /// This batches the state update to avoid multiple content recalculations.
    func update(
        track: RTCVideoTrack? = nil,
        participantName: String? = nil,
        participantImageURL: String? = nil,
        isVideoEnabled: Bool? = nil,
        isScreenSharing: Bool? = nil,
        isReconnecting: Bool? = nil
    ) {
        stateQueue.async { [weak self] in
            guard let self = self else { return }

            // Update all provided properties
            if let track = track {
                self.track = track
            }
            if let name = participantName {
                self.participantName = name
            }
            if let imageURL = participantImageURL {
                self.participantImageURL = imageURL
            }
            if let videoEnabled = isVideoEnabled {
                self.isVideoEnabled = videoEnabled
            }
            if let screenSharing = isScreenSharing {
                self.isScreenSharing = screenSharing
            }
            if let reconnecting = isReconnecting {
                self.isReconnecting = reconnecting
            }

            // Single content update after all properties are set
            self.updateContent()
        }
    }
}
