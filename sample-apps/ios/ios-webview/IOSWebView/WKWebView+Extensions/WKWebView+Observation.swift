//
//  WKWebView+Observation.swift
//  IOSWebView
//
//  Created by Ilias Pavlidakis on 7/5/26.
//

import AVFoundation
import Combine
import Foundation
import WebKit
#if canImport(UIKit)
import UIKit
#endif

/// Configuration for `WKWebView.configureStreamVideoHostBridge(configuration:)`.
struct StreamVideoHostBridgeConfiguration {
    /// Enables diagnostic `print` output from the bridge.
    var logsEnabled: Bool
    /// Calls `AVAudioSession.setPrefersNoInterruptionsFromSystemAlerts(true)` during setup.
    var setPrefersNoInterruptionsFromSystemAlerts: Bool
    /// Interval used by short audio-session polling windows.
    var audioSessionPollingInterval: DispatchTimeInterval
    /// Number of unchanged polling ticks before a polling window stops.
    var stableAudioSessionPollingTicks: Int

    init(
        logsEnabled: Bool = false,
        setPrefersNoInterruptionsFromSystemAlerts: Bool = true,
        audioSessionPollingInterval: DispatchTimeInterval = .milliseconds(250),
        stableAudioSessionPollingTicks: Int = 4
    ) {
        self.logsEnabled = logsEnabled
        self.setPrefersNoInterruptionsFromSystemAlerts = setPrefersNoInterruptionsFromSystemAlerts
        self.audioSessionPollingInterval = audioSessionPollingInterval
        self.stableAudioSessionPollingTicks = stableAudioSessionPollingTicks
    }
}

/// JavaScript event names emitted by the host bridge.
enum StreamVideoHostBridgeEvent {
    /// Event carrying the current host `AVAudioSession` snapshot.
    static let audioSession = "stream-video:host-audio-session"
    /// Event carrying the current app lifecycle transition.
    static let lifecycle = "stream-video:host-lifecycle"
}

// MARK: - Entry Point

/// Adds host `AVAudioSession` observation to a `WKWebView`.
///
/// The observer is retained by the web view and dispatches
/// `stream-video:host-audio-session` and `stream-video:host-lifecycle` events
/// into the current page whenever the host process's audio session or app
/// lifecycle changes.
///
/// Events are fire-and-forget for the currently loaded document; this extension
/// does not buffer or replay snapshots across page loads.
///
/// Page-side listener example:
///
///     window.addEventListener('stream-video:host-audio-session', (event) => {
///       console.log(event.detail);
///     });
extension WKWebView {
    /// Starts forwarding host audio-session and lifecycle snapshots to the page.
    ///
    /// Call this once after creating the web view. The method is idempotent;
    /// repeated calls reuse the observer and configuration already attached to
    /// this instance.
    func configureStreamVideoHostBridge(
        configuration: StreamVideoHostBridgeConfiguration = .init()
    ) {
        _ = audioSessionObserver(configuration: configuration)
    }
}

// MARK: - AudioSessionObserver wire on WKWebView

extension WKWebView {

    /// Shared encoder for the JavaScript event payload.
    private static let snapshotEncoder: JSONEncoder = {
        let encoder = JSONEncoder()
        encoder.outputFormatting = .withoutEscapingSlashes
        return encoder
    }()

    private enum AudioSessionObserveKey {
        static var key: UInt8 = 0
    }

    private func audioSessionObserver(
        configuration: StreamVideoHostBridgeConfiguration
    ) -> AudioSessionObserver {
        if let observer = objc_getAssociatedObject(
            self,
            &AudioSessionObserveKey.key
        ) as? AudioSessionObserver {
            return observer
        }

        let observer = AudioSessionObserver(self, configuration: configuration)

        objc_setAssociatedObject(
            self,
            &AudioSessionObserveKey.key,
            observer,
            .OBJC_ASSOCIATION_RETAIN_NONATOMIC
        )

        return observer
    }

    fileprivate func forwardAudioSessionSnapshot(
        _ snapshot: AudioSessionObserver.Snapshot,
        configuration: StreamVideoHostBridgeConfiguration
    ) {
        forwardSnapshot(
            snapshot,
            eventName: StreamVideoHostBridgeEvent.audioSession,
            configuration: configuration
        )
    }

    fileprivate func forwardLifecycleSnapshot(
        _ snapshot: AudioSessionObserver.LifecycleSnapshot,
        configuration: StreamVideoHostBridgeConfiguration
    ) {
        forwardSnapshot(
            snapshot,
            eventName: StreamVideoHostBridgeEvent.lifecycle,
            configuration: configuration
        )
    }

    private func forwardSnapshot<T: Encodable>(
        _ snapshot: T,
        eventName: String,
        configuration: StreamVideoHostBridgeConfiguration
    ) {
        guard
            let data = try? Self.snapshotEncoder.encode(snapshot),
            let json = String(data: data, encoding: .utf8)
        else { return }

        // JSON is a valid JS expression, so it is safe to interpolate directly
        // as the `detail` of a CustomEvent.
        let script = """
        window.dispatchEvent(new CustomEvent('\(eventName)', { detail: \(json) }));
        """

        Task { @MainActor [weak self] in
            do {
                try await self?.evaluateJavaScript(script)
            } catch {
                Self.logError(error, function: #function, line: #line, configuration: configuration)
            }
        }
    }
}

// MARK: - Logging Helpers

extension WKWebView {
    fileprivate static func logInfo(
        _ message: String,
        function: StaticString = #function,
        line: UInt = #line,
        configuration: StreamVideoHostBridgeConfiguration?
    ) {
        guard configuration?.logsEnabled == true else { return }
        print("(\(function):\(line)):\(message)")
    }

    fileprivate static func logError(
        _ error: Error,
        function: StaticString = #function,
        line: UInt = #line,
        configuration: StreamVideoHostBridgeConfiguration?
    ) {
        logInfo("Error:\(error)", function: function, line: line, configuration: configuration)
    }
}

// MARK: - AudioSessionObserver

extension WKWebView {
    /// Observes the process-wide `AVAudioSession` and forwards snapshots to a web view.
    ///
    /// The observer listens for audio interruptions, route changes,
    /// media-service resets, direct session configuration changes, and app
    /// lifecycle transitions. Mutable state is serialized on `operationQueue`
    /// because notifications can arrive on different threads.
    final class AudioSessionObserver {
        // MARK: Adapters
        private lazy var interruptionAdapter: InterruptionsAdapter = .init(
            notificationCenter: notificationCenter,
            interruptionStarted: { [weak self] in self?.interruptionStarted($0) },
            interruptionEnded: { [weak self] in self?.interruptionEnded($0) }
        )
        private lazy var silenceSecondaryAudioHintAdapter: SilenceSecondaryAudioHintAdapter = .init(
            notificationCenter: notificationCenter,
            silenceSecondaryAudioHintReceived: { [weak self] in self?.silenceSecondaryAudioHintReceived() }
        )
        private lazy var mediaServicesWereResetAdapter: MediaServicesWereResetAdapter = .init(
            notificationCenter: notificationCenter,
            mediaServicesWereResetReceived: { [weak self] in self?.mediaServicesWereResetReceived() }
        )
        private lazy var routeChangeAdapter: RouteChangeAdapter = .init(
            notificationCenter: notificationCenter,
            routeChangeReceived: { [weak self] in self?.routeChangeReceived($0) }
        )
        private lazy var appLifecycleAdapter: AppLifecycleAdapter = .init(
            notificationCenter: notificationCenter,
            appLifecycleTransitionReceived: { [weak self] in self?.appLifecycleTransitionReceived($0) }
        )
        private lazy var audioSessionAdapter: AVAudioSessionAdapter = .init(
            audioSession: audioSession,
            pollingInterval: configuration.audioSessionPollingInterval,
            stableTickLimit: configuration.stableAudioSessionPollingTicks,
            audioSessionSnapshotUpdated: { [weak self] in self?.audioSessionSnapshotUpdated() }
        )

        // MARK: Lifecycle
        private weak var webView: WKWebView?
        private let configuration: StreamVideoHostBridgeConfiguration
        private let audioSession: AVAudioSession
        private let notificationCenter: NotificationCenter
        private let operationQueue: OperationQueue
        private let backgroundTimer: BackgroundTimer = .init()

        // MARK: State
        private var latestInterruption: Snapshot.Interruption?
        private var latestRouteChange: Snapshot.RouteChange?

        // MARK: Configuration
        /// Recovery timer state for a currently open `began` interruption.
        ///
        /// iOS and WebKit can recover audio without delivering
        /// `interruption.ended`. The timer periodically checks whether the
        /// session is record-capable again, then synthesizes `ended` after
        /// `forceClearAfterTicks` so the page is not pinned as interrupted.
        private var recoveryTicks = 0
        /// Hard upper bound for recovery polling if `forceClearAfterTicks` is raised.
        private let maxRecoveryTicks = 30
        /// Number of timer ticks to wait before synthesizing `interruption.ended`.
        private let forceClearAfterTicks = 5

        /// Creates and starts a host audio-session observer for the given web view.
        init(
            _ webView: WKWebView,
            configuration: StreamVideoHostBridgeConfiguration,
            audioSession: AVAudioSession = .sharedInstance(),
            notificationCenter: NotificationCenter = .default
        ) {
            let queue = OperationQueue()
            queue.maxConcurrentOperationCount = 1
            self.operationQueue = queue
            self.webView = webView
            self.configuration = configuration
            self.audioSession = audioSession
            self.notificationCenter = notificationCenter

            backgroundTimer.onTimerTick = { [weak self] in
                self?.tickRecoveryTimer()
            }

            // WarmUp adapters
            _ = interruptionAdapter
            _ = silenceSecondaryAudioHintAdapter
            _ = mediaServicesWereResetAdapter
            _ = routeChangeAdapter
            _ = appLifecycleAdapter
            _ = audioSessionAdapter

            if configuration.setPrefersNoInterruptionsFromSystemAlerts {
                do {
                    try audioSession.setPrefersNoInterruptionsFromSystemAlerts(true)
                    logInfo("AVAudioSession.setPrefersNoInterruptionsFromSystemAlerts(true) completed.")
                } catch {
                    logError(error)
                }
            }
        }

        deinit {
            backgroundTimer.stop()
        }

        // MARK: - Private

        private func enqueue(_ block: @escaping (AudioSessionObserver) -> Void) {
            operationQueue.addOperation { [weak self] in
                guard let self else { return }
                block(self)
            }
        }

        private func logInfo(
            _ message: String,
            function: StaticString = #function,
            line: UInt = #line
        ) {
            WKWebView.logInfo(message, function: function, line: line, configuration: configuration)
        }

        private func logError(
            _ error: Error,
            function: StaticString = #function,
            line: UInt = #line
        ) {
            WKWebView.logError(error, function: function, line: line, configuration: configuration)
        }

        // MARK: - Adapters
        // MARK: Interruptions

        private func interruptionStarted(_ interruption: Snapshot.Interruption) {
            guard interruption.type == "began" else { return }
            enqueue { strongSelf in
                strongSelf.logInfo("Interruption started \(interruption)")
                strongSelf.latestInterruption = interruption
                strongSelf.audioSessionAdapter.startPolling()
                strongSelf.backgroundTimer.start()
                strongSelf.sendSnapshot()
            }
        }

        private func interruptionEnded(_ interruption: Snapshot.Interruption) {
            guard interruption.type == "ended" else { return }
            enqueue { strongSelf in
                strongSelf.logInfo("Interruption ended \(interruption)")
                strongSelf.latestInterruption = nil
                strongSelf.audioSessionAdapter.startPolling()
                strongSelf.backgroundTimer.stop()
                strongSelf.sendSnapshot()
            }
        }

        // MARK: - SilenceSecondaryAudioHint

        private func silenceSecondaryAudioHintReceived() {
            enqueue { strongSelf in
                // The OS-level "another session should silence me" hint just
                // changed. When it flips false while we hold a record-capable
                // category, the conflicting session has released audio. Dispatch
                // only if this resolves a stale `began` so we don't spam the page
                // with redundant snapshots on healthy hint flips.
                strongSelf.logInfo("Secondary audio hint was silenced")
                strongSelf.audioSessionAdapter.startPolling()
                guard strongSelf.clearStaleInterruptionIfRecovered() else { return }
                strongSelf.sendSnapshot()
                strongSelf.logInfo("Completed successfully.")
            }
        }

        // MARK: - MediaServicesWereResetReceived

        private func mediaServicesWereResetReceived() {
            enqueue { strongSelf in
                // A media-services reset often accompanies WebKit restoring its
                // audio session without a matching `interruption.ended`.
                // Dispatch only if this resolves a stale `began`.
                strongSelf.audioSessionAdapter.startPolling()
                strongSelf.logInfo("MediaServices were ressetted")
                guard strongSelf.clearStaleInterruptionIfRecovered() else { return }
                strongSelf.sendSnapshot()
                strongSelf.logInfo("Completed successfully.")
            }
        }

        // MARK: - RouteChanged

        private func routeChangeReceived(_ routeChange: Snapshot.RouteChange) {
            enqueue { strongSelf in
                strongSelf.latestRouteChange = routeChange
                strongSelf.audioSessionAdapter.startPolling()
                _ = strongSelf.clearStaleInterruptionIfRecovered()
                strongSelf.logInfo("Route updated to \(routeChange)")
                strongSelf.sendSnapshot()
            }
        }

        // MARK: - AppLifecycle

        private func appLifecycleTransitionReceived(_ transition: String) {
            enqueue { strongSelf in
                strongSelf.logInfo("AppLifecycle transition:\(transition)")
                strongSelf.sendLifecycleSnapshot(transition: transition)

                guard transition == "didBecomeActive" else { return }
                // Foregrounding is a last-chance recovery check because iOS can
                // coalesce or drop audio-session notifications while suspended.
                strongSelf.audioSessionAdapter.startPolling()
                guard strongSelf.clearStaleInterruptionIfRecovered() else { return }
                strongSelf.sendSnapshot()
            }
        }

        // MARK: - AudioSessionUpdated

        private func audioSessionSnapshotUpdated() {
            enqueue { strongSelf in
                strongSelf.sendSnapshot()
            }
        }

        // MARK: BackgroundTimer

        /// One tick of the recovery timer.
        ///
        /// Clears stale interruptions when recovery is observable, otherwise
        /// force-synthesizes `ended` after `forceClearAfterTicks` and stops the
        /// timer so the page does not stay interrupted forever.
        private func tickRecoveryTimer() {
            enqueue { strongSelf in
                // Defensive: if `began` is already gone (some other path cleared
                // it without calling `disarmRecoveryTimer()`), stop ticking.
                guard strongSelf.latestInterruption?.type == "began" else {
                    strongSelf.logInfo("Disarming backgroundTimer as latestInterruption.type != began")
                    strongSelf.backgroundTimer.stop()
                    return
                }

                strongSelf.recoveryTicks += 1

                let cleared = strongSelf.clearStaleInterruptionIfRecovered()

                if cleared {
                    strongSelf.logInfo("clearStaleInterruptionIfRecovered completed")
                    // `clearStaleInterruptionIfRecovered()` already disarmed.
                    strongSelf.sendSnapshot()
                    return
                }
                if strongSelf.recoveryTicks >= strongSelf.forceClearAfterTicks {
                    strongSelf.logInfo("Timer expired. ending latest interruption")
                    strongSelf.latestInterruption = .init(type: "ended", reason: nil)
                    strongSelf.backgroundTimer.stop()
                    strongSelf.sendSnapshot()
                    return
                }
                if strongSelf.recoveryTicks >= strongSelf.maxRecoveryTicks {
                    strongSelf.logInfo("MaxRecoveryTicks reached. Disarming timer")
                    strongSelf.backgroundTimer.stop()
                }
            }
        }

        // MARK: Helpers

        @discardableResult
        private func clearStaleInterruptionIfRecovered() -> Bool {
            guard
                latestInterruption?.type == "began"
            else { return false }

            let hasRecordCapabilityCategory = audioSession.category == .playAndRecord || audioSession.category == .record
            let secondaryAudioShouldBeSilencedHint = audioSession.secondaryAudioShouldBeSilencedHint

            guard
                hasRecordCapabilityCategory,
                !secondaryAudioShouldBeSilencedHint
            else {
                return false
            }

            latestInterruption = .init(type: "ended", reason: nil)
            backgroundTimer.stop()
            return true
        }

        private func buildSnapshot() -> Snapshot {
            Snapshot(
                schemaVersion: 1,
                timestamp: Int64(Date().timeIntervalSince1970 * 1000),
                session: .init(
                    category: .init(audioSession.category),
                    mode: .init(audioSession.mode),
                    options: .init(audioSession.categoryOptions)
                ),
                interruption: latestInterruption,
                routeChange: latestRouteChange,
                route: .init(audioSession.currentRoute)
            )
        }

        private func sendSnapshot() {
            webView?.forwardAudioSessionSnapshot(buildSnapshot(), configuration: configuration)
        }

        private func buildLifecycleSnapshot(transition: String) -> LifecycleSnapshot {
            LifecycleSnapshot(
                schemaVersion: 1,
                source: "ios",
                timestamp: Int64(Date().timeIntervalSince1970 * 1000),
                state: .init(transition: transition)
            )
        }

        private func sendLifecycleSnapshot(transition: String) {
            webView?.forwardLifecycleSnapshot(
                buildLifecycleSnapshot(transition: transition),
                configuration: configuration
            )
        }
    }
}

// MARK: - AudioSessionObserver.InterruptionsAdapter

extension WKWebView.AudioSessionObserver {
    /// Converts `AVAudioSession.interruptionNotification` into snapshot updates.
    fileprivate final class InterruptionsAdapter {
        private let interruptionStarted: (Snapshot.Interruption) -> Void
        private let interruptionEnded: (Snapshot.Interruption) -> Void
        private var cancellable: AnyCancellable?

        convenience init(
            notificationCenter: NotificationCenter = .default,
            interruptionStarted: @escaping (Snapshot.Interruption) -> Void,
            interruptionEnded: @escaping (Snapshot.Interruption) -> Void
        ) {
            self.init(
                notificationPublisher: notificationCenter
                    .publisher(for: AVAudioSession.interruptionNotification)
                    .eraseToAnyPublisher(),
                interruptionStarted: interruptionStarted,
                interruptionEnded: interruptionEnded
            )
        }

        init(
            notificationPublisher: AnyPublisher<Notification, Never>,
            interruptionStarted: @escaping (Snapshot.Interruption) -> Void,
            interruptionEnded: @escaping (Snapshot.Interruption) -> Void
        ) {
            self.interruptionStarted = interruptionStarted
            self.interruptionEnded = interruptionEnded
            cancellable = notificationPublisher
                .sink { [weak self] in self?.process($0) }
        }

        private func process(_ notification: Notification) {
            guard
                let userInfo = notification.userInfo,
                let typeRawValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
                let type = AVAudioSession.InterruptionType(rawValue: typeRawValue)
            else {
                return
            }

            let typeString = {
                switch type {
                case .began:
                    return "began"
                case .ended:
                    return "ended"
                @unknown default:
                    return ""
                }
            }()

            var reasonString: String?
            if #available(iOS 14.5, *),
               let raw = userInfo[AVAudioSessionInterruptionReasonKey] as? UInt,
               let reason = AVAudioSession.InterruptionReason(rawValue: raw) {
                reasonString = {
                    switch reason {
                        case .default: return "default"
                        case .appWasSuspended: return "appWasSuspended"
                        case .builtInMicMuted: return "builtInMicMuted"
                        case .routeDisconnected: return "routeDisconnected"
                        @unknown default: return "default"
                    }
                }()
            }

            let interruption = Snapshot.Interruption(type: typeString, reason: reasonString)
            if typeString == "began" {
                interruptionStarted(interruption)
            } else if typeString == "ended" {
                interruptionEnded(interruption)
            }
        }
    }
}

// MARK: - AudioSessionObserver.SilenceSecondaryAudioHintAdapter

extension WKWebView.AudioSessionObserver {
    /// Emits a recovery signal when iOS changes the secondary-audio silence hint.
    fileprivate final class SilenceSecondaryAudioHintAdapter {
        private let silenceSecondaryAudioHintReceived: () -> Void
        private var cancellable: AnyCancellable?

        convenience init(
            notificationCenter: NotificationCenter = .default,
            silenceSecondaryAudioHintReceived: @escaping () -> Void
        ) {
            self.init(
                notificationPublisher: notificationCenter
                    .publisher(for: AVAudioSession.silenceSecondaryAudioHintNotification)
                    .eraseToAnyPublisher(),
                silenceSecondaryAudioHintReceived: silenceSecondaryAudioHintReceived
            )
        }

        init(
            notificationPublisher: AnyPublisher<Notification, Never>,
            silenceSecondaryAudioHintReceived: @escaping () -> Void
        ) {
            self.silenceSecondaryAudioHintReceived = silenceSecondaryAudioHintReceived
            cancellable = notificationPublisher
                .sink { [weak self] _ in self?.silenceSecondaryAudioHintReceived() }
        }
    }
}

// MARK: - AudioSessionObserver.MediaServicesWereResetAdapter

extension WKWebView.AudioSessionObserver {
    /// Emits a recovery signal after the system media services process resets.
    fileprivate final class MediaServicesWereResetAdapter {
        private let mediaServicesWereResetReceived: () -> Void
        private var cancellable: AnyCancellable?

        convenience init(
            notificationCenter: NotificationCenter = .default,
            mediaServicesWereResetReceived: @escaping () -> Void
        ) {
            self.init(
                notificationPublisher: notificationCenter
                    .publisher(for: AVAudioSession.mediaServicesWereResetNotification)
                    .eraseToAnyPublisher(),
                mediaServicesWereResetReceived: mediaServicesWereResetReceived
            )
        }

        init(
            notificationPublisher: AnyPublisher<Notification, Never>,
            mediaServicesWereResetReceived: @escaping () -> Void
        ) {
            self.mediaServicesWereResetReceived = mediaServicesWereResetReceived
            cancellable = notificationPublisher
                .sink { [weak self] _ in self?.mediaServicesWereResetReceived() }
        }
    }
}

// MARK: - AudioSessionObserver.RouteChangeAdapter

extension WKWebView.AudioSessionObserver {
    /// Converts `AVAudioSession.routeChangeNotification` into snapshot updates.
    fileprivate final class RouteChangeAdapter {
        private let routeChangeReceived: (Snapshot.RouteChange) -> Void
        private var cancellable: AnyCancellable?

        convenience init(
            notificationCenter: NotificationCenter = .default,
            routeChangeReceived: @escaping (Snapshot.RouteChange) -> Void
        ) {
            self.init(
                notificationPublisher: notificationCenter
                    .publisher(for: AVAudioSession.routeChangeNotification)
                    .eraseToAnyPublisher(),
                routeChangeReceived: routeChangeReceived
            )
        }

        init(
            notificationPublisher: AnyPublisher<Notification, Never>,
            routeChangeReceived: @escaping (Snapshot.RouteChange) -> Void
        ) {
            self.routeChangeReceived = routeChangeReceived
            cancellable = notificationPublisher
                .sink { [weak self] in self?.process($0) }
        }

        private func process(_ notification: Notification) {
            guard
                let userInfo = notification.userInfo,
                let raw = userInfo[AVAudioSessionRouteChangeReasonKey] as? UInt,
                let reason = AVAudioSession.RouteChangeReason(rawValue: raw)
            else {
                return
            }
            let reasonString = {
                switch reason {
                case .unknown: 
                    return "unknown"
                case .newDeviceAvailable: 
                    return "newDeviceAvailable"
                case .oldDeviceUnavailable: 
                    return "oldDeviceUnavailable"
                case .categoryChange: 
                    return "categoryChange"
                case .override: 
                    return "override"
                case .wakeFromSleep: 
                    return "wakeFromSleep"
                case .noSuitableRouteForCategory: 
                    return "noSuitableRouteForCategory"
                case .routeConfigurationChange: 
                    return "routeConfigurationChange"
                @unknown default: 
                    return "unknown"
                }
            }()
            routeChangeReceived(Snapshot.RouteChange(reason: reasonString))
        }
    }
}

// MARK: - AudioSessionObserver.AppLifecycleAdapter

extension WKWebView.AudioSessionObserver {
    /// Converts app lifecycle notifications into page lifecycle events.
    fileprivate final class AppLifecycleAdapter {
        private let appLifecycleTransitionReceived: (String) -> Void
        private var cancellable: AnyCancellable?

        convenience init(
            notificationCenter: NotificationCenter = .default,
            appLifecycleTransitionReceived: @escaping (String) -> Void
        ) {
            #if canImport(UIKit)
            let transitions: [(Notification.Name, String)] = [
                (UIApplication.didBecomeActiveNotification, "didBecomeActive"),
                (UIApplication.willResignActiveNotification, "willResignActive"),
                (UIApplication.didEnterBackgroundNotification, "didEnterBackground"),
                (UIApplication.willEnterForegroundNotification, "willEnterForeground"),
            ]

            let publisher = Publishers.MergeMany(
                transitions.map { name, transition in
                    notificationCenter
                        .publisher(for: name)
                        .map { _ in transition }
                        .eraseToAnyPublisher()
                }
            )
            .eraseToAnyPublisher()

            self.init(
                lifecyclePublisher: publisher,
                appLifecycleTransitionReceived: appLifecycleTransitionReceived
            )
            #else
            self.init(
                lifecyclePublisher: nil,
                appLifecycleTransitionReceived: appLifecycleTransitionReceived
            )
            #endif
        }

        private init(
            lifecyclePublisher: AnyPublisher<String, Never>?,
            appLifecycleTransitionReceived: @escaping (String) -> Void
        ) {
            self.appLifecycleTransitionReceived = appLifecycleTransitionReceived
            cancellable = lifecyclePublisher?
                .sink { [weak self] in self?.appLifecycleTransitionReceived($0) }
        }
    }
}

extension WKWebView.AudioSessionObserver {
    /// Polls `AVAudioSession` for category, mode, and option changes.
    ///
    /// `AVAudioSession` does not provide a single notification for every
    /// configuration mutation this bridge needs, so this adapter samples briefly
    /// around startup and notification-driven recovery windows.
    fileprivate final class AVAudioSessionAdapter {
        private let audioSession: AVAudioSession
        private let audioSessionSnapshotUpdated: () -> Void
        private let operationQueue: OperationQueue
        private let backgroundTimer: WKWebView.BackgroundTimer

        private var category: AVAudioSession.Category
        private var mode: AVAudioSession.Mode
        private var categoryOptions: AVAudioSession.CategoryOptions
        private var stableTicks = 0
        private let stableTickLimit: Int

        init(
            audioSession: AVAudioSession,
            pollingInterval: DispatchTimeInterval,
            stableTickLimit: Int,
            audioSessionSnapshotUpdated: @escaping () -> Void
        ) {
            let queue = OperationQueue()
            queue.maxConcurrentOperationCount = 1
            self.operationQueue = queue
            self.backgroundTimer = .init(tickInterval: pollingInterval)
            self.audioSession = audioSession
            self.audioSessionSnapshotUpdated = audioSessionSnapshotUpdated
            self.stableTickLimit = max(1, stableTickLimit)
            self.category = audioSession.category
            self.mode = audioSession.mode
            self.categoryOptions = audioSession.categoryOptions

            backgroundTimer.onTimerTick = { [weak self] in
                self?.enqueue { $0.process() }
            }
            startPolling()
        }

        deinit {
            backgroundTimer.stop()
        }

        func startPolling() {
            enqueue { strongSelf in
                strongSelf.stableTicks = 0
                strongSelf.backgroundTimer.start()
            }
        }

        private func enqueue(_ block: @escaping (AVAudioSessionAdapter) -> Void) {
            operationQueue.addOperation { [weak self] in
                guard let self else { return }
                block(self)
            }
        }

        private func process() {
            let updatedCategory = audioSession.category
            let updatedMode = audioSession.mode
            let updatedCategoryOptions = audioSession.categoryOptions

            guard updatedCategory != category || updatedMode != mode || updatedCategoryOptions != categoryOptions else {
                stableTicks += 1
                if stableTicks >= stableTickLimit {
                    backgroundTimer.stop()
                }
                return
            }

            stableTicks = 0
            category = updatedCategory
            mode = updatedMode
            categoryOptions = updatedCategoryOptions
            audioSessionSnapshotUpdated()
        }
    }
}

// MARK: - AudioSessionObserver.Snapshot

extension WKWebView.AudioSessionObserver {
    /// JSON payload sent as the `detail` of `stream-video:host-lifecycle`.
    fileprivate struct LifecycleSnapshot: Encodable, Equatable {
        /// Payload contract version understood by the web SDK.
        let schemaVersion: Int
        /// Native platform that produced the lifecycle event.
        let source: String
        /// Snapshot creation time in Unix milliseconds.
        let timestamp: Int64
        /// Current app lifecycle transition.
        let state: State

        struct State: Encodable, Equatable {
            /// App transition name, such as `didBecomeActive`.
            let transition: String
        }
    }

    /// JSON payload sent as the `detail` of `stream-video:host-audio-session`.
    ///
    /// The shape matches the web SDK's host audio-session event contract.
    /// Increment `schemaVersion` if this payload changes incompatibly.
    fileprivate struct Snapshot: Encodable, Equatable, CustomStringConvertible {
        /// Payload contract version understood by the web SDK.
        let schemaVersion: Int
        /// Snapshot creation time in Unix milliseconds.
        let timestamp: Int64
        /// Current process audio-session category, mode, and options.
        let session: Session
        /// Latest interruption state, when the host has one to report.
        let interruption: Interruption?
        /// Latest route-change reason, when available.
        let routeChange: RouteChange?
        /// Current audio input and output route.
        let route: Route?

        var description: String {
            var result = "{"
            result += " schemaVersion:\(schemaVersion)"
            result += ", timestamp:\(timestamp)"
            result += ", session:\(session)"
            result += ", interruption:\(interruption?.description ?? "-")"
            result += ", routeChange:\(routeChange?.description ?? "-")"
            result += ", route:\(route?.description ?? "-")"
            result += " }"
            return result
        }

        struct Session: Encodable, Equatable, CustomStringConvertible {
            /// Stable string form of `AVAudioSession.Category`.
            let category: String
            /// Stable string form of `AVAudioSession.Mode`.
            let mode: String
            /// Stable string forms of `AVAudioSession.CategoryOptions`.
            let options: [String]

            var description: String {
                var result = "{"
                result += " category:\(category)"
                result += ", mode:\(mode)"
                result += ", options:\(options)"
                result += " }"
                return result
            }
        }

        struct Interruption: Encodable, Equatable, CustomStringConvertible {
            /// Interruption phase: `"began"` or `"ended"`.
            let type: String
            /// Stable string form of `AVAudioSession.InterruptionReason`, when present.
            let reason: String?

            var description: String {
                var result = "{"
                result += " type:\(type)"
                result += ", reason:\(reason?.description ?? "-")"
                result += " }"
                return result
            }
        }

        struct RouteChange: Encodable, Equatable, CustomStringConvertible {
            /// Stable string form of `AVAudioSession.RouteChangeReason`.
            let reason: String

            var description: String {
                var result = "{"
                result += " reason:\(reason)"
                result += " }"
                return result
            }
        }

        /// Snapshot of `audioSession.currentRoute` so the page can label
        /// which device is actively capturing / playing back. Optional on
        /// the wire (older host builds may omit it); the SDK reads it
        /// opportunistically.
        struct Route: Encodable, Equatable, CustomStringConvertible {
            /// Current input ports reported by the process audio session.
            let inputs: [Port]
            /// Current output ports reported by the process audio session.
            let outputs: [Port]

            var description: String {
                var result = "{"
                result += " inputs:\(inputs)"
                result += ", outputs:\(outputs)"
                result += " }"
                return result
            }

            struct Port: Encodable, Equatable, CustomStringConvertible {
                /// Human-readable device name from `AVAudioSessionPortDescription.portName`.
                let name: String
                /// Raw `AVAudioSession.Port` value, such as `BluetoothHFP` or `Speaker`.
                let type: String

                var description: String {
                    var result = "{"
                    result += " name:\(name)"
                    result += ", type:\(type)"
                    result += " }"
                    return result
                }
            }

            init(_ source: AVAudioSessionRouteDescription) {
                self.init(
                    inputs: source.inputs.map { .init(name: $0.portName, type: $0.portType.rawValue) },
                    outputs: source.outputs.map { .init(name: $0.portName, type: $0.portType.rawValue) }
                )
            }

            init(inputs: [Port], outputs: [Port]) {
                self.inputs = inputs
                self.outputs = outputs
            }
        }
    }
}

// MARK: - BackgroundTimer

extension WKWebView {
    /// Lightweight repeating timer with serialized `start` and `stop` operations.
    fileprivate final class BackgroundTimer {

        /// Called on each timer tick.
        var onTimerTick: (() -> Void)?

        private var isRunning: Bool = false
        private let processingQueue: OperationQueue
        private let timerQueue: DispatchQueue
        private let tickInterval: DispatchTimeInterval

        private var timer: DispatchSourceTimer?

        init(
            timerQueue: DispatchQueue = .global(qos: .userInteractive),
            tickInterval: DispatchTimeInterval = .seconds(1)
        ) {
            let queue = OperationQueue()
            queue.maxConcurrentOperationCount = 1
            self.processingQueue = queue
            self.timerQueue = timerQueue
            self.tickInterval = tickInterval
        }

        func start() {
            enqueue { strongSelf in
                guard !strongSelf.isRunning else {
                    return
                }

                let timer = DispatchSource.makeTimerSource(
                    queue: strongSelf.timerQueue
                )
                timer.schedule(
                    deadline: .now() + strongSelf.tickInterval,
                    repeating: strongSelf.tickInterval
                )
                timer.setEventHandler { [weak strongSelf] in
                    strongSelf?.enqueue { nestedSelf in
                        nestedSelf.timerDidTick()
                    }
                }
                strongSelf.timer = timer
                timer.resume()
                strongSelf.isRunning = true
            }
        }

        func stop() {
            enqueue { strongSelf in
                guard strongSelf.isRunning else {
                    return
                }
                strongSelf.timer?.cancel()
                strongSelf.timer = nil
                strongSelf.isRunning = false
            }
        }

        // MARK: - Private Helpers

        private func enqueue(_ block: @escaping (BackgroundTimer) -> Void) {
            processingQueue.addOperation { [weak self] in
                guard let self else { return }
                block(self)
            }
        }

        private func timerDidTick() {
            onTimerTick?()
        }
    }
}

// MARK: - Extensions

extension Array where Element == String {

    fileprivate init(_ source: AVAudioSession.CategoryOptions) {
        var parts: [String] = []
        if source.contains(.mixWithOthers) { parts.append("mixWithOthers") }
        if source.contains(.duckOthers) { parts.append("duckOthers") }
        if source.contains(.allowBluetoothA2DP) { parts.append("allowBluetoothA2DP") }
        if source.contains(.allowAirPlay) { parts.append("allowAirPlay") }
        if source.contains(.defaultToSpeaker) { parts.append("defaultToSpeaker") }
        if source.contains(.interruptSpokenAudioAndMixWithOthers) {
            parts.append("interruptSpokenAudioAndMixWithOthers")
        }
        if #available(iOS 14.5, *),
           source.contains(.overrideMutedMicrophoneInterruption) {
            parts.append("overrideMutedMicrophoneInterruption")
        }
        // `.allowBluetoothHFP` is iOS 17+, but the underlying bit (1 << 2)
        // is the same as the legacy `.allowBluetooth`. We always emit the
        // new name; check the bit directly to avoid the deprecation
        // warning on the legacy case while still working back to iOS 15.
        let bluetoothHFPBit = AVAudioSession.CategoryOptions(rawValue: 1 << 2)
        if source.contains(bluetoothHFPBit) { parts.append("allowBluetoothHFP") }
        self = parts
    }
}

extension String {

    fileprivate init(_ source: AVAudioSession.Category) {
        switch source {
        case .ambient:
            self = "ambient"
        case .soloAmbient:
            self = "soloAmbient"
        case .playback:
            self = "playback"
        case .record:
            self = "record"
        case .playAndRecord:
            self = "playAndRecord"
        case .multiRoute:
            self = "multiRoute"
        default:
            self = source.rawValue
        }
    }

    fileprivate init(_ source: AVAudioSession.Mode) {
        switch source {
        case .default:
            self = "default"
        case .voiceChat:
            self = "voiceChat"
        case .gameChat:
            self = "gameChat"
        case .videoRecording:
            self = "videoRecording"
        case .measurement:
            self = "measurement"
        case .moviePlayback:
            self = "moviePlayback"
        case .videoChat:
            self = "videoChat"
        case .spokenAudio:
            self = "spokenAudio"
        case .voicePrompt:
            self = "voicePrompt"
        default:
            self = source.rawValue
        }
    }
}
