import AVFoundation
import Combine
import Foundation
import WebKit

/// Reference implementation of the host → page audio-session bridge the
/// `@stream-io/video-client` SDK's `AudioHealthMonitor` consumes.
///
/// Observes `AVAudioSession.interruptionNotification` and
/// `AVAudioSession.routeChangeNotification`, builds a JSON snapshot, and
/// dispatches it into the `WKWebView` as a `CustomEvent`:
///
///     window.dispatchEvent(new CustomEvent(
///         'stream-video:host-audio-session',
///         { detail: <HostAudioSessionEvent> }
///     ));
///
/// The payload shape matches the SDK's `HostAudioSessionEvent` type. Any
/// breaking change requires bumping `schemaVersion` on both sides.
///
/// Also re-publishes each snapshot on `snapshotPublisher` so the debug
/// overlay can log native transitions alongside SDK-reported health.
final class AudioSessionBridge {

    /// JSON payload that matches the SDK's `HostAudioSessionEvent` contract.
    struct Snapshot: Encodable, Equatable {
        let schemaVersion: Int
        let source: String
        let timestamp: Int64
        let state: State

        struct State: Encodable, Equatable {
            let category: String
            let mode: String
            let categoryOptions: UInt
            let interruption: Interruption?
            let routeChangeReason: UInt?
        }

        struct Interruption: Encodable, Equatable {
            let type: String  // "began" | "ended"
            let reason: UInt?
        }
    }

    var snapshotPublisher: AnyPublisher<Snapshot, Never> {
        subject.eraseToAnyPublisher()
    }

    private weak var webView: WKWebView?
    private let audioSession: AVAudioSession
    private let notificationCenter: NotificationCenter
    private let subject = PassthroughSubject<Snapshot, Never>()
    private var cancellables = Set<AnyCancellable>()
    private var latestInterruption: Snapshot.Interruption?
    private var latestRouteChangeReason: UInt?
    private var started = false

    init(
        webView: WKWebView,
        audioSession: AVAudioSession = .sharedInstance(),
        notificationCenter: NotificationCenter = .default
    ) {
        self.webView = webView
        self.audioSession = audioSession
        self.notificationCenter = notificationCenter
    }

    deinit { stop() }

    func start() {
        guard !started else { return }
        started = true

        notificationCenter
            .publisher(for: AVAudioSession.interruptionNotification)
            .sink { [weak self] in self?.handleInterruption($0) }
            .store(in: &cancellables)

        notificationCenter
            .publisher(for: AVAudioSession.routeChangeNotification)
            .sink { [weak self] in self?.handleRouteChange($0) }
            .store(in: &cancellables)

        // Initial snapshot so the page sees ground truth at page load,
        // even before any interruption or route change happens.
        dispatch()
    }

    func stop() {
        guard started else { return }
        started = false
        cancellables.removeAll()
        latestInterruption = nil
        latestRouteChangeReason = nil
    }

    // MARK: - Notification handlers

    private func handleInterruption(_ notification: Notification) {
        guard
            let userInfo = notification.userInfo,
            let typeRawValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
            let type = AVAudioSession.InterruptionType(rawValue: typeRawValue)
        else { return }

        let typeString: String
        switch type {
        case .began: typeString = "began"
        case .ended: typeString = "ended"
        @unknown default: return
        }

        var reason: UInt?
        if #available(iOS 14.5, *) {
            reason = userInfo[AVAudioSessionInterruptionReasonKey] as? UInt
        }

        latestInterruption = .init(type: typeString, reason: reason)
        dispatch()
    }

    private func handleRouteChange(_ notification: Notification) {
        guard
            let userInfo = notification.userInfo,
            let raw = userInfo[AVAudioSessionRouteChangeReasonKey] as? UInt
        else { return }
        latestRouteChangeReason = raw
        dispatch()
    }

    // MARK: - Dispatch

    private func dispatch() {
        let snapshot = Snapshot(
            schemaVersion: 1,
            source: "ios",
            timestamp: Int64(Date().timeIntervalSince1970 * 1000),
            state: .init(
                category: audioSession.category.rawValue,
                mode: audioSession.mode.rawValue,
                categoryOptions: audioSession.categoryOptions.rawValue,
                interruption: latestInterruption,
                routeChangeReason: latestRouteChangeReason
            )
        )
        subject.send(snapshot)
        forwardToWebView(snapshot)
    }

    private func forwardToWebView(_ snapshot: Snapshot) {
        guard let webView else { return }
        let encoder = JSONEncoder()
        encoder.outputFormatting = .withoutEscapingSlashes
        guard
            let data = try? encoder.encode(snapshot),
            let json = String(data: data, encoding: .utf8)
        else { return }

        // JSON is a valid JS expression → safe to interpolate directly
        // as the `detail` of a CustomEvent. `evaluateJavaScript` must run
        // on the main thread.
        let script = """
        window.dispatchEvent(new CustomEvent('stream-video:host-audio-session', { detail: \(json) }));
        """
        DispatchQueue.main.async { [weak webView] in
            webView?.evaluateJavaScript(script, completionHandler: nil)
        }
    }
}
