//
// Copyright © 2024 Stream.io Inc. All rights reserved.
//

import AVKit
import Combine

/// A wrapper around AVPictureInPictureControllerDelegate that publishes all
/// delegate method calls via a single Combine publisher.
///
/// This proxy enables reactive handling of PiP lifecycle events and allows
/// multiple subscribers to observe PiP state changes through a unified interface.
final class PictureInPictureDelegateProxy: NSObject, AVPictureInPictureControllerDelegate {

    /// Enum representing each AVPictureInPictureControllerDelegate method call
    /// with its respective associated values.
    enum Event: CustomStringConvertible {
        case willStart(AVPictureInPictureController)
        case didStart(AVPictureInPictureController)
        case failedToStart(AVPictureInPictureController, Error)
        case willStop(AVPictureInPictureController)
        case didStop(AVPictureInPictureController)
        case restoreUI(AVPictureInPictureController, (Bool) -> Void)

        var description: String {
            switch self {
            case .willStart:
                return ".willStart"
            case .didStart:
                return ".didStart"
            case let .failedToStart(_, error):
                return ".failedToStart(error: \(error.localizedDescription))"
            case .willStop:
                return ".willStop"
            case .didStop:
                return ".didStop"
            case .restoreUI:
                return ".restoreUI"
            }
        }
    }

    /// The Combine publisher that emits Picture-in-Picture delegate events.
    var publisher: AnyPublisher<Event, Never> {
        eventSubject.eraseToAnyPublisher()
    }

    private let eventSubject = PassthroughSubject<Event, Never>()

    // MARK: - AVPictureInPictureControllerDelegate

    func pictureInPictureControllerWillStartPictureInPicture(
        _ pictureInPictureController: AVPictureInPictureController
    ) {
        eventSubject.send(.willStart(pictureInPictureController))
    }

    func pictureInPictureControllerDidStartPictureInPicture(
        _ pictureInPictureController: AVPictureInPictureController
    ) {
        eventSubject.send(.didStart(pictureInPictureController))
    }

    func pictureInPictureController(
        _ pictureInPictureController: AVPictureInPictureController,
        failedToStartPictureInPictureWithError error: Error
    ) {
        eventSubject.send(.failedToStart(pictureInPictureController, error))
    }

    func pictureInPictureControllerWillStopPictureInPicture(
        _ pictureInPictureController: AVPictureInPictureController
    ) {
        eventSubject.send(.willStop(pictureInPictureController))
    }

    func pictureInPictureControllerDidStopPictureInPicture(
        _ pictureInPictureController: AVPictureInPictureController
    ) {
        eventSubject.send(.didStop(pictureInPictureController))
    }

    func pictureInPictureController(
        _ pictureInPictureController: AVPictureInPictureController,
        restoreUserInterfaceForPictureInPictureStopWithCompletionHandler completionHandler: @escaping (Bool) -> Void
    ) {
        eventSubject.send(.restoreUI(pictureInPictureController, completionHandler))
    }
}
