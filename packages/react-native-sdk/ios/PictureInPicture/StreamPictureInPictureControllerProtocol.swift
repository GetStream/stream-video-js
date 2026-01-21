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
    /// A Boolean value that indicates whether Picture-in-Picture is currently active.
    var isPictureInPictureActive: Bool { get }

    /// Publisher that emits whenever the Picture-in-Picture active state changes.
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
