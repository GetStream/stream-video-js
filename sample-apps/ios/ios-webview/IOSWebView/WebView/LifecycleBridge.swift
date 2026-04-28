import Combine
import Foundation
import UIKit
import WebKit

/// Forwards UIApplication lifecycle transitions into the page as a
/// `CustomEvent`:
///
///     window.dispatchEvent(new CustomEvent(
///         'stream-video:host-lifecycle',
///         { detail: <HostLifecycleEvent> }
///     ));
///
/// Complements `AudioSessionBridge`. The audio-session bridge tells the page
/// "what just happened to AVAudioSession"; this one tells the page "the user
/// switched apps / locked the screen / came back." Some customer-reported
/// audio bugs (e.g., webinar audio failing to resume after a phone-call
/// interruption ends) need *both* signals to triage — the
/// `interruption=ended` snapshot can fire while the app is still in the
/// background, and the page only knows the user is back when
/// `didBecomeActive` arrives.
///
/// Re-publishes each transition on `snapshotPublisher` so the debug overlay
/// can log every transition alongside the audio-session bridge output.
final class LifecycleBridge {

    /// JSON payload mirroring the shape of `AudioSessionBridge.Snapshot`.
    /// Any breaking change requires bumping `schemaVersion` on both sides.
    struct Snapshot: Encodable, Equatable {
        let schemaVersion: Int
        let source: String
        let timestamp: Int64
        let state: State

        struct State: Encodable, Equatable {
            let transition: String
        }
    }

    var snapshotPublisher: AnyPublisher<Snapshot, Never> {
        subject.eraseToAnyPublisher()
    }

    private weak var webView: WKWebView?
    private let notificationCenter: NotificationCenter
    private let subject = PassthroughSubject<Snapshot, Never>()
    private var cancellables = Set<AnyCancellable>()
    private var started = false

    init(
        webView: WKWebView,
        notificationCenter: NotificationCenter = .default,
    ) {
        self.webView = webView
        self.notificationCenter = notificationCenter
    }

    deinit { stop() }

    func start() {
        guard !started else { return }
        started = true

        let transitions: [(Notification.Name, String)] = [
            (UIApplication.didBecomeActiveNotification, "didBecomeActive"),
            (UIApplication.willResignActiveNotification, "willResignActive"),
            (UIApplication.didEnterBackgroundNotification, "didEnterBackground"),
            (UIApplication.willEnterForegroundNotification, "willEnterForeground"),
        ]

        for (name, label) in transitions {
            notificationCenter
                .publisher(for: name)
                .sink { [weak self] _ in self?.dispatch(transition: label) }
                .store(in: &cancellables)
        }
    }

    func stop() {
        guard started else { return }
        started = false
        cancellables.removeAll()
    }

    // MARK: - Dispatch

    private func dispatch(transition: String) {
        let snapshot = Snapshot(
            schemaVersion: 1,
            source: "ios",
            timestamp: Int64(Date().timeIntervalSince1970 * 1000),
            state: .init(transition: transition),
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

        let script = """
        window.dispatchEvent(new CustomEvent('stream-video:host-lifecycle', { detail: \(json) }));
        """
        DispatchQueue.main.async { [weak webView] in
            webView?.evaluateJavaScript(script, completionHandler: nil)
        }
    }
}
