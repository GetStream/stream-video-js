//
// Copyright © 2024 Stream.io Inc. All rights reserved.
//

import AVKit
import Combine
import Foundation

/// Protocol defining the interface for Picture-in-Picture controller functionality.
///
/// This abstraction allows for easier testing and decouples components from the
/// concrete `AVPictureInPictureController` implementation.
protocol StreamPictureInPictureControllerProtocol: AnyObject {
    /// Publisher that emits whenever the Picture-in-Picture active state changes.
    /// Consumers should rely on this stream instead of synchronous snapshots so
    /// lifecycle adapters can react to state transitions deterministically.
    var isPictureInPictureActivePublisher: AnyPublisher<Bool, Never> { get }

    /// Stops the Picture-in-Picture playback if it is currently active.
    func stopPictureInPicture()
}

/// Extends `AVPictureInPictureController` to conform to `StreamPictureInPictureControllerProtocol`.
///
/// This extension provides a Combine publisher for observing the `isPictureInPictureActive` property.
extension AVPictureInPictureController: StreamPictureInPictureControllerProtocol {
    var isPictureInPictureActivePublisher: AnyPublisher<Bool, Never> {
        publisher(for: \.isPictureInPictureActive).eraseToAnyPublisher()
    }
}
