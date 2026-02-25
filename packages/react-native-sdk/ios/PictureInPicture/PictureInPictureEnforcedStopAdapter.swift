//
// Copyright © 2024 Stream.io Inc. All rights reserved.
//

import AVKit
import Combine
import UIKit

/// An adapter responsible for enforcing the stop of Picture-in-Picture
/// playback when the application returns to the foreground.
///
/// This adapter listens to application state changes and PiP activity to ensure
/// PiP is stopped when the app becomes active (foreground). This behavior matches
/// iOS user expectations where PiP should dismiss when returning to the app.
final class PictureInPictureEnforcedStopAdapter {

    /// A bag to store Combine subscriptions for cancellation.
    private var cancellables: Set<AnyCancellable> = []

    /// Timer subscription for enforced stop attempts.
    private var stopTimerCancellable: AnyCancellable?

    /// Weak reference to the PiP controller.
    private weak var pictureInPictureController: StreamPictureInPictureControllerProtocol?

    /// Initializes the adapter with a Picture-in-Picture controller and
    /// starts observing application state and PiP activity to enforce stop.
    ///
    /// - Parameter pictureInPictureController: The PiP controller to manage.
    init(_ pictureInPictureController: StreamPictureInPictureControllerProtocol) {
        self.pictureInPictureController = pictureInPictureController
        let appActivePublisher = Publishers.Merge(
            NotificationCenter.default
                .publisher(for: UIApplication.didBecomeActiveNotification)
                .map { _ in true },
            NotificationCenter.default
                .publisher(for: UIApplication.willResignActiveNotification)
                .map { _ in false }
        )
        .prepend(UIApplication.shared.applicationState == .active)

        appActivePublisher
            .combineLatest(pictureInPictureController.isPictureInPictureActivePublisher)
            .sink { [weak self] isAppActive, isPiPActive in
                self?.handleStateUpdate(isAppActive: isAppActive, isPictureInPictureActive: isPiPActive)
            }
            .store(in: &cancellables)
    }

    deinit {
        cancellables.removeAll()
        stopTimerCancellable?.cancel()
        stopTimerCancellable = nil
    }

    // MARK: - Private helpers

    /// Handles the app becoming active while PiP may be active.
    ///
    /// - Parameter isPictureInPictureActive: Whether PiP is currently active.
    private func handleStateUpdate(isAppActive: Bool, isPictureInPictureActive: Bool) {
        guard isAppActive, isPictureInPictureActive else {
            stopTimerCancellable?.cancel()
            stopTimerCancellable = nil
            return
        }

        guard stopTimerCancellable == nil else { return }

        /// Use the screen refresh rate to match upstream enforcement cadence.
        let refreshRate = max(1, UIScreen.main.maximumFramesPerSecond)
        let interval = 1.0 / TimeInterval(refreshRate)
        stopTimerCancellable = Timer
            .publish(every: interval, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                guard let self = self,
                      let controller = self.pictureInPictureController else {
                    self?.stopTimerCancellable?.cancel()
                    self?.stopTimerCancellable = nil
                    return
                }

                guard UIApplication.shared.applicationState == .active else {
                    self.stopTimerCancellable?.cancel()
                    self.stopTimerCancellable = nil
                    return
                }

                guard controller.isPictureInPictureActive else {
                    pipLog("Picture-in-Picture has stopped, cancelling enforced stop timer.")
                    self.stopTimerCancellable?.cancel()
                    self.stopTimerCancellable = nil
                    return
                }

                pipLog("Attempting to forcefully stop Picture-in-Picture.")
                controller.stopPictureInPicture()
            }
    }
}
