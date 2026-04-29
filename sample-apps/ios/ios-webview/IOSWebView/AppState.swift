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
/// the headless bridges (`AudioSessionBridge`, `LifecycleBridge`,
/// `AudioScenarios`, etc.). `@Published` mutations are bounced to the main
/// thread so that off-thread callers (e.g. CallKit / NotificationCenter) can
/// safely call `log(_:_:_:)`.
final class AppState: ObservableObject {
    static let shared = AppState()
    private init() {}

    @Published private(set) var entries: [LogEntry] = []
    private let maxEntries = 1000

    /// Audio-session "active" state, tracked client-side since AVAudioSession
    /// doesn't expose whether setActive(true) has been called. Only reflects
    /// activations/deactivations initiated by our own code.
    @Published var audioSessionActive: Bool = false

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
