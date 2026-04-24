import Foundation

enum LogTab: String {
    case console
    case errors
    case lifecycle
    case scenarios
}

struct LogEntry {
    let timestamp: Date
    let tab: LogTab
    let level: String
    let message: String
}

final class AppState {
    static let shared = AppState()
    private init() {}

    // Log storage
    private var entries: [LogEntry] = []
    private let entriesLock = NSLock()
    private let maxEntries = 1000

    var onLogAppended: ((LogEntry) -> Void)?

    func log(_ tab: LogTab, _ level: String = "info", _ message: String) {
        let entry = LogEntry(timestamp: Date(), tab: tab, level: level, message: message)
        entriesLock.lock()
        entries.append(entry)
        if entries.count > maxEntries { entries.removeFirst(entries.count - maxEntries) }
        entriesLock.unlock()
        DispatchQueue.main.async { [weak self] in
            self?.onLogAppended?(entry)
        }
    }

    func entries(for tab: LogTab) -> [LogEntry] {
        entriesLock.lock()
        defer { entriesLock.unlock() }
        return entries.filter { $0.tab == tab }
    }

    func clear(tab: LogTab) {
        entriesLock.lock()
        entries.removeAll { $0.tab == tab }
        entriesLock.unlock()
    }

    // Audio-session "active" state, tracked client-side since AVAudioSession
    // doesn't expose whether setActive(true) has been called. Only reflects
    // activations/deactivations initiated by our own code.
    var audioSessionActive: Bool = false
}
