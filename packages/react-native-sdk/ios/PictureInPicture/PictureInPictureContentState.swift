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
///
/// Concurrency model:
/// - This state container is main-thread confined.
/// - `RTCVideoTrack` references are never sent across queues.
final class PictureInPictureContentState {

    /// A full state snapshot that can be applied atomically.
    struct Snapshot {
        var track: RTCVideoTrack?
        var participantName: String?
        var participantImageURL: String?
        var isVideoEnabled: Bool
        var isScreenSharing: Bool
        var isReconnecting: Bool
    }

    // MARK: - Published State

    /// The current content being displayed in the PiP window.
    @Published private(set) var content: PictureInPictureContent = .inactive

    /// Publisher for observing content changes.
    var contentPublisher: AnyPublisher<PictureInPictureContent, Never> {
        $content.eraseToAnyPublisher()
    }

    // MARK: - Private

    private var snapshot: Snapshot = makeDefaultSnapshot()

    // MARK: - Initialization

    init() {}

    // MARK: - State Update

    /// Applies all content inputs in one step to avoid parallel update paths.
    func apply(_ snapshot: Snapshot) {
        ensureMainThread()
        self.snapshot = snapshot
        publishIfNeeded(for: snapshot)
    }

    /// Resets all state to defaults.
    /// Called when cleaning up after a call ends.
    func reset() {
        ensureMainThread()
        snapshot = Self.makeDefaultSnapshot()
        if content != .inactive {
            content = .inactive
        }
    }

    /// Computes and publishes content based on the latest snapshot.
    private func publishIfNeeded(for snapshot: Snapshot) {
        let newContent: PictureInPictureContent

        // Priority order: reconnecting > screen sharing > avatar (video disabled) > video > avatar fallback
        if snapshot.isReconnecting {
            newContent = .reconnecting
        } else if snapshot.isScreenSharing {
            newContent = .screenSharing(
                track: snapshot.track,
                participantName: snapshot.participantName
            )
        } else if !snapshot.isVideoEnabled {
            newContent = .avatar(
                participantName: snapshot.participantName,
                participantImageURL: snapshot.participantImageURL
            )
        } else if snapshot.isVideoEnabled, snapshot.track != nil {
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

        if content != newContent {
            content = newContent
        }
    }

    /// PiP content state is expected to be mutated on the main thread only.
    private func ensureMainThread() {
        dispatchPrecondition(condition: .onQueue(.main))
    }

    private static func makeDefaultSnapshot() -> Snapshot {
        Snapshot(
            track: nil,
            participantName: nil,
            participantImageURL: nil,
            isVideoEnabled: true,
            isScreenSharing: false,
            isReconnecting: false
        )
    }
}
