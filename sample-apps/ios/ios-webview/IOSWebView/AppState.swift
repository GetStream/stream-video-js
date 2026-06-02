import AVFAudio
import Combine
import Foundation

enum LogTab: String {
    case console
    case errors
    case lifecycle
    case scenarios
}

struct LogEntry: Identifiable {
    let id = UUID()
    let timestamp: Date
    let tab: LogTab
    let level: String
    let message: String
}

/// Observable log + audio-session state shared between the SwiftUI views and
/// headless helpers such as `AudioScenarios`. `@Published` mutations are
/// bounced to the main thread so off-thread callers can safely call
/// `log(_:_:_:)`.
final class AppState: ObservableObject {
    static let shared = AppState()
    private init() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleRouteChange),
            name: AVAudioSession.routeChangeNotification,
            object: nil)
    }

    @Published private(set) var entries: [LogEntry] = []
    private let maxEntries = 1000

    /// Audio-session "active" state, tracked client-side since AVAudioSession
    /// doesn't expose whether setActive(true) has been called. Only reflects
    /// activations/deactivations initiated by our own code.
    @Published var audioSessionActive: Bool = false

    /// Re-render token bumped on every `AVAudioSession.routeChangeNotification`.
    /// SwiftUI views that read live `AVAudioSession.sharedInstance()` state
    /// (category, mode, options, route) observe `AppState` so this counter
    /// re-publishes them when iOS reports a route or category change.
    @Published private(set) var audioRouteVersion: Int = 0

    @objc private func handleRouteChange() {
        if Thread.isMainThread {
            audioRouteVersion &+= 1
        } else {
            DispatchQueue.main.async { [weak self] in
                self?.audioRouteVersion &+= 1
            }
        }
    }

    func log(_ tab: LogTab, _ level: String = "info", _ message: String) {
        let entry = LogEntry(timestamp: Date(), tab: tab, level: level, message: message)
        if Thread.isMainThread {
            append(entry)
        } else {
            DispatchQueue.main.async { [weak self] in self?.append(entry) }
        }
    }

    func clear(tab: LogTab) {
        if Thread.isMainThread {
            entries.removeAll { $0.tab == tab }
        } else {
            DispatchQueue.main.async { [weak self] in
                self?.entries.removeAll { $0.tab == tab }
            }
        }
    }

    private func append(_ entry: LogEntry) {
        entries.append(entry)
        if entries.count > maxEntries {
            entries.removeFirst(entries.count - maxEntries)
        }
    }
}
