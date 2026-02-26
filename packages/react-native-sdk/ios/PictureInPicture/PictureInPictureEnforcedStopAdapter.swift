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

    private enum DisposableKey: String {
        case stopEnforceOperation
    }

    private enum ApplicationState: Equatable {
        case foreground
        case background
        case unknown
    }

    /// Refresh-rate-based timer interval used for enforcement attempts.
    private let refreshRate: TimeInterval

    /// Lifecycle subscriptions.
    private var cancellables: Set<AnyCancellable> = []

    /// Keyed operations that can be replaced/cancelled independently.
    private var operationCancellables: [String: AnyCancellable] = [:]

    /// Initializes the adapter with a Picture-in-Picture controller and
    /// starts observing application state and PiP activity to enforce stop.
    ///
    /// - Parameter pictureInPictureController: The PiP controller to manage.
    init(_ pictureInPictureController: StreamPictureInPictureControllerProtocol) {
        refreshRate = Self.makeRefreshRate()

        // Keep enforcement strictly state-driven: we only run the stop loop
        // while the app is foregrounded *and* PiP is still active.
        Publishers
            .CombineLatest(
                Self.makeApplicationStatePublisher(),
                pictureInPictureController
                    .isPictureInPictureActivePublisher
                    .removeDuplicates()
            )
            .receive(on: DispatchQueue.main)
            .sink { [weak self, weak pictureInPictureController] applicationState, isActive in
                self?.didUpdate(
                    applicationState: applicationState,
                    isPictureInPictureActive: isActive,
                    pictureInPictureController: pictureInPictureController
                )
            }
            .store(in: &cancellables)
    }

    deinit {
        cancellables.removeAll()
        removeAllOperations()
    }

    // MARK: - Private helpers

    private func didUpdate(
        applicationState: ApplicationState,
        isPictureInPictureActive: Bool,
        pictureInPictureController: StreamPictureInPictureControllerProtocol?
    ) {
        switch (applicationState, isPictureInPictureActive) {
        case (.foreground, true):
            // Foreground + active PiP is the only state where we enforce stop.
            startStopEnforcement(for: pictureInPictureController)
        default:
            // Any other state (background/inactive PiP) should tear down the loop.
            removeOperation(for: DisposableKey.stopEnforceOperation.rawValue)
        }
    }

    private func startStopEnforcement(
        for pictureInPictureController: StreamPictureInPictureControllerProtocol?
    ) {
        guard let pictureInPictureController else {
            removeOperation(for: DisposableKey.stopEnforceOperation.rawValue)
            return
        }

        let operation = Timer
            .publish(every: refreshRate, on: .main, in: .common)
            .autoconnect()
            .filter { _ in
                UIApplication.shared.applicationState == .active
            }
            .sink { [weak pictureInPictureController] _ in
                // Calling stop repeatedly at display cadence covers cases where
                // AVKit does not settle PiP shutdown on the first attempt.
                pictureInPictureController?.stopPictureInPicture()
            }

        store(operation, key: DisposableKey.stopEnforceOperation.rawValue)
    }

    private func store(_ operation: AnyCancellable, key: String) {
        // Keyed replacement ensures exactly one enforcement loop is active.
        removeOperation(for: key)
        operationCancellables[key] = operation
    }

    private func removeOperation(for key: String) {
        operationCancellables[key]?.cancel()
        operationCancellables[key] = nil
    }

    private func removeAllOperations() {
        operationCancellables.values.forEach { $0.cancel() }
        operationCancellables.removeAll()
    }

    private static func makeApplicationStatePublisher(
        notificationCenter: NotificationCenter = .default
    ) -> AnyPublisher<ApplicationState, Never> {
        let foreground = Publishers.Merge(
            notificationCenter
                .publisher(for: UIApplication.willEnterForegroundNotification)
                .map { _ in ApplicationState.foreground },
            notificationCenter
                .publisher(for: UIApplication.didBecomeActiveNotification)
                .map { _ in ApplicationState.foreground }
        )
        let background = notificationCenter
            .publisher(for: UIApplication.didEnterBackgroundNotification)
            .map { _ in ApplicationState.background }

        return Publishers.Merge(foreground, background)
            // Emit the current app state immediately so newly created adapters
            // do not wait for the next lifecycle notification.
            .prepend(currentApplicationState())
            .removeDuplicates()
            .eraseToAnyPublisher()
    }

    private static func currentApplicationState() -> ApplicationState {
        switch UIApplication.shared.applicationState {
        case .active:
            return .foreground
        case .background:
            return .background
        case .inactive:
            return .unknown
        @unknown default:
            return .unknown
        }
    }

    private static func makeRefreshRate() -> TimeInterval {
        // Keep cadence aligned to the device's display refresh rate while
        // enforcing a practical minimum (30fps) for older/limited devices.
        let maximumFramesPerSecond = max(30, UIScreen.main.maximumFramesPerSecond)
        return 1.0 / Double(maximumFramesPerSecond)
    }
}
