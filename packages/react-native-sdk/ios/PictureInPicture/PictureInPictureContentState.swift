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
        didSet { scheduleContentUpdate() }
    }

    /// The participant's name
    var participantName: String? {
        didSet { scheduleContentUpdate() }
    }

    /// The participant's profile image URL
    var participantImageURL: String? {
        didSet { scheduleContentUpdate() }
    }

    /// Whether video is enabled for the participant
    var isVideoEnabled: Bool = true {
        didSet { scheduleContentUpdate() }
    }

    /// Whether screen sharing is active
    var isScreenSharing: Bool = false {
        didSet { scheduleContentUpdate() }
    }

    /// Whether the call is reconnecting
    var isReconnecting: Bool = false {
        didSet { scheduleContentUpdate() }
    }

    // MARK: - Private

    /// Serial queue for thread-safe state updates
    private let stateQueue = DispatchQueue(label: "io.getstream.pip.content.state", qos: .userInteractive)
    /// Indicates whether a content update is already scheduled.
    private var isUpdateScheduled = false
    /// Indicates batched updates are in progress (to avoid redundant scheduling).
    private var isBatching = false

    // MARK: - Initialization

    init() {}

    // MARK: - State Update

    /// Schedules a coalesced content recalculation on the state queue.
    /// Priority order: reconnecting > avatar (video disabled) > screen sharing > video > inactive.
    private func scheduleContentUpdate() {
        stateQueue.async { [weak self] in
            guard let self = self else { return }
            self.scheduleContentUpdateLocked()
        }
    }

    /// Runs on the serial queue to ensure a single update per burst of changes.
    private func scheduleContentUpdateLocked() {
        guard !isBatching else { return }
        guard !isUpdateScheduled else { return }
        isUpdateScheduled = true

        let newContent = calculateContent()

        if content != newContent {
            DispatchQueue.main.async { [weak self] in
                self?.content = newContent
            }
        }

        isUpdateScheduled = false
    }

    /// Pure computation of the current content based on raw properties.
    private func calculateContent() -> PictureInPictureContent {
        // Priority 1: Reconnection takes precedence
        if isReconnecting {
            return .reconnecting
        }
        // Priority 2: Avatar when video is disabled
        if !isVideoEnabled {
            return .avatar(
                participantName: participantName,
                participantImageURL: participantImageURL
            )
        }
        // Priority 3: Screen sharing
        if isScreenSharing {
            return .screenSharing(
                track: track,
                participantName: participantName
            )
        }
        // Priority 4: Video when track is available
        if track != nil {
            return .video(
                track: track,
                participantName: participantName,
                participantImageURL: participantImageURL
            )
        }
        // Default: Avatar placeholder when video is expected but no track yet
        return .avatar(
            participantName: participantName,
            participantImageURL: participantImageURL
        )
    }

    /// Resets all state to defaults.
    /// Called when cleaning up after a call ends.
    func reset() {
        stateQueue.async { [weak self] in
            guard let self = self else { return }
            self.isBatching = true
            self.track = nil
            self.participantName = nil
            self.participantImageURL = nil
            self.isVideoEnabled = true
            self.isScreenSharing = false
            self.isReconnecting = false
            self.isBatching = false

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
            self.isBatching = true

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
            self.isBatching = false

            // Single content update after all properties are set
            self.scheduleContentUpdateLocked()
        }
    }
}
