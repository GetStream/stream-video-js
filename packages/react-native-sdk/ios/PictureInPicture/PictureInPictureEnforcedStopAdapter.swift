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

        // Observe app becoming active (foreground)
        NotificationCenter.default
            .publisher(for: UIApplication.didBecomeActiveNotification)
            .combineLatest(pictureInPictureController.isPictureInPictureActivePublisher)
            .sink { [weak self] _, isActive in
                self?.handleAppBecameActive(isPictureInPictureActive: isActive)
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
    private func handleAppBecameActive(isPictureInPictureActive: Bool) {
        // Cancel any existing timer
        stopTimerCancellable?.cancel()
        stopTimerCancellable = nil

        guard isPictureInPictureActive else {
            return
        }

        // Use a timer to repeatedly attempt to stop PiP
        // This handles cases where the stop might not take effect immediately
        let screenRefreshRate: TimeInterval = 1.0 / 60.0 // ~60 FPS
        stopTimerCancellable = Timer
            .publish(every: screenRefreshRate, on: .main, in: .common)
            .autoconnect()
            .filter { [weak self] _ in
                // Only continue if app is still in foreground
                UIApplication.shared.applicationState == .active
            }
            .sink { [weak self] _ in
                guard let self = self,
                      let controller = self.pictureInPictureController else {
                    self?.stopTimerCancellable?.cancel()
                    self?.stopTimerCancellable = nil
                    return
                }

                // Check if PiP is still active before attempting to stop
                // Only cancel the timer once PiP has actually stopped
                guard controller.isPictureInPictureActive else {
                    NSLog("PiP - Picture-in-Picture has stopped, cancelling enforced stop timer.")
                    self.stopTimerCancellable?.cancel()
                    self.stopTimerCancellable = nil
                    return
                }

                NSLog("PiP - Attempting to forcefully stop Picture-in-Picture.")
                controller.stopPictureInPicture()
            }
    }
}
