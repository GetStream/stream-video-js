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

    /// A full state snapshot that can be applied atomically.
    struct Snapshot: Sendable {
        var track: RTCVideoTrack?
        var participantName: String?
        var participantImageURL: String?
        var isVideoEnabled: Bool
        var isScreenSharing: Bool
        var isReconnecting: Bool

        static let `default` = Snapshot(
            track: nil,
            participantName: nil,
            participantImageURL: nil,
            isVideoEnabled: true,
            isScreenSharing: false,
            isReconnecting: false
        )
    }

    // MARK: - Published State

    /// The current content being displayed in the PiP window.
    @Published private(set) var content: PictureInPictureContent = .inactive

    /// Publisher for observing content changes.
    var contentPublisher: AnyPublisher<PictureInPictureContent, Never> {
        $content.eraseToAnyPublisher()
    }

    // MARK: - Private

    /// Serial queue for thread-safe state updates.
    private let stateQueue = DispatchQueue(label: "io.getstream.pip.content.state", qos: .userInteractive)
    private var snapshot: Snapshot = .default

    // MARK: - Initialization

    init() {}

    // MARK: - State Update

    /// Applies all content inputs in one step to avoid parallel update paths.
    func apply(_ snapshot: Snapshot) {
        stateQueue.async { [weak self] in
            guard let self else { return }
            self.snapshot = snapshot
            self.publishIfNeeded(for: snapshot)
        }
    }

    /// Resets all state to defaults.
    /// Called when cleaning up after a call ends.
    func reset() {
        stateQueue.async { [weak self] in
            guard let self else { return }
            self.snapshot = .default

            DispatchQueue.main.async { [weak self] in
                self?.content = .inactive
            }
        }
    }

    /// Computes and publishes content based on the latest snapshot.
    private func publishIfNeeded(for snapshot: Snapshot) {
        let newContent: PictureInPictureContent

        // Priority order: reconnecting > avatar (video disabled) > screen sharing > video > avatar fallback
        if snapshot.isReconnecting {
            newContent = .reconnecting
        } else if !snapshot.isVideoEnabled {
            newContent = .avatar(
                participantName: snapshot.participantName,
                participantImageURL: snapshot.participantImageURL
            )
        } else if snapshot.isScreenSharing {
            newContent = .screenSharing(
                track: snapshot.track,
                participantName: snapshot.participantName
            )
        } else if snapshot.track != nil {
            newContent = .video(
                track: snapshot.track,
                participantName: snapshot.participantName,
                participantImageURL: snapshot.participantImageURL
            )
        } else {
            newContent = .avatar(
                participantName: snapshot.participantName,
                participantImageURL: snapshot.participantImageURL
            )
        }

        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            guard self.content != newContent else { return }
            self.content = newContent
        }
    }
}
