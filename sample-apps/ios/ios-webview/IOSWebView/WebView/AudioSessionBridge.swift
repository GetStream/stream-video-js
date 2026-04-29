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
        let timestamp: Int64
        let session: Session
        let interruption: Interruption?
        let routeChange: RouteChange?

        struct Session: Encodable, Equatable {
            let category: String
            let mode: String
            let options: [String]
        }

        struct Interruption: Encodable, Equatable {
            let type: String  // "began" | "ended"
            let reason: String?
        }

        struct RouteChange: Encodable, Equatable {
            let reason: String
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
    private var latestRouteChange: Snapshot.RouteChange?
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
        latestRouteChange = nil
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

        var reasonString: String?
        if #available(iOS 14.5, *),
           let raw = userInfo[AVAudioSessionInterruptionReasonKey] as? UInt,
           let reason = AVAudioSession.InterruptionReason(rawValue: raw) {
            reasonString = Self.describe(interruptionReason: reason)
        }

        latestInterruption = .init(type: typeString, reason: reasonString)
        dispatch()
    }

    private func handleRouteChange(_ notification: Notification) {
        guard
            let userInfo = notification.userInfo,
            let raw = userInfo[AVAudioSessionRouteChangeReasonKey] as? UInt,
            let reason = AVAudioSession.RouteChangeReason(rawValue: raw)
        else { return }
        latestRouteChange = .init(reason: Self.describe(routeChangeReason: reason))
        dispatch()
    }

    // MARK: - Dispatch

    private func dispatch() {
        let snapshot = Snapshot(
            schemaVersion: 1,
            timestamp: Int64(Date().timeIntervalSince1970 * 1000),
            session: .init(
                category: Self.describe(category: audioSession.category),
                mode: Self.describe(mode: audioSession.mode),
                options: Self.describe(options: audioSession.categoryOptions)
            ),
            interruption: latestInterruption,
            routeChange: latestRouteChange
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

    // MARK: - String mappers
    //
    // Switch-based for predictability and stability across iOS versions:
    // a `default` fallback to the raw value means an Apple-added enum
    // case still produces a sensible (if non-normalized) string instead
    // of dropping the snapshot.

    private static func describe(category: AVAudioSession.Category) -> String {
        switch category {
        case .ambient: return "ambient"
        case .soloAmbient: return "soloAmbient"
        case .playback: return "playback"
        case .record: return "record"
        case .playAndRecord: return "playAndRecord"
        case .multiRoute: return "multiRoute"
        default: return category.rawValue
        }
    }

    private static func describe(mode: AVAudioSession.Mode) -> String {
        switch mode {
        case .default: return "default"
        case .voiceChat: return "voiceChat"
        case .gameChat: return "gameChat"
        case .videoRecording: return "videoRecording"
        case .measurement: return "measurement"
        case .moviePlayback: return "moviePlayback"
        case .videoChat: return "videoChat"
        case .spokenAudio: return "spokenAudio"
        case .voicePrompt: return "voicePrompt"
        default: return mode.rawValue
        }
    }

    private static func describe(options: AVAudioSession.CategoryOptions) -> [String] {
        var parts: [String] = []
        if options.contains(.mixWithOthers) { parts.append("mixWithOthers") }
        if options.contains(.duckOthers) { parts.append("duckOthers") }
        if options.contains(.allowBluetoothA2DP) { parts.append("allowBluetoothA2DP") }
        if options.contains(.allowAirPlay) { parts.append("allowAirPlay") }
        if options.contains(.defaultToSpeaker) { parts.append("defaultToSpeaker") }
        if options.contains(.interruptSpokenAudioAndMixWithOthers) {
            parts.append("interruptSpokenAudioAndMixWithOthers")
        }
        if #available(iOS 14.5, *),
           options.contains(.overrideMutedMicrophoneInterruption) {
            parts.append("overrideMutedMicrophoneInterruption")
        }
        // `.allowBluetoothHFP` is iOS 17+, but the underlying bit (1 << 2)
        // is the same as the legacy `.allowBluetooth`. We always emit the
        // new name; check the bit directly to avoid the deprecation
        // warning on the legacy case while still working back to iOS 15.
        let bluetoothHFPBit = AVAudioSession.CategoryOptions(rawValue: 1 << 2)
        if options.contains(bluetoothHFPBit) { parts.append("allowBluetoothHFP") }
        return parts
    }

    @available(iOS 14.5, *)
    private static func describe(
        interruptionReason reason: AVAudioSession.InterruptionReason
    ) -> String {
        switch reason {
        case .default: return "default"
        case .appWasSuspended: return "appWasSuspended"
        case .builtInMicMuted: return "builtInMicMuted"
        case .routeDisconnected: return "routeDisconnected"
        @unknown default: return "default"
        }
    }

    private static func describe(
        routeChangeReason reason: AVAudioSession.RouteChangeReason
    ) -> String {
        switch reason {
        case .unknown: return "unknown"
        case .newDeviceAvailable: return "newDeviceAvailable"
        case .oldDeviceUnavailable: return "oldDeviceUnavailable"
        case .categoryChange: return "categoryChange"
        case .override: return "override"
        case .wakeFromSleep: return "wakeFromSleep"
        case .noSuitableRouteForCategory: return "noSuitableRouteForCategory"
        case .routeConfigurationChange: return "routeConfigurationChange"
        @unknown default: return "unknown"
        }
    }
}
