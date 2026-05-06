import AVFoundation
import Combine
import Foundation
import UIKit
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
///
/// Mutable state (`latestInterruption`, `latestRouteChange`, `started`,
/// `cancellables`) is only touched from the dedicated `processingQueue`
/// — Combine subscriptions hop onto it via `.receive(on:)` and the
/// `evaluateJavaScript` call hops to `@MainActor` with an already-built
/// snapshot. `@unchecked Sendable` is asserted on that contract so the
/// bridge can be retained across actor boundaries.
final class AudioSessionBridge: @unchecked Sendable {

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

    /// Optional sink for per-tick diagnostics from the recovery timer.
    /// Set this once at construction; the bridge invokes it from
    /// `processingQueue`, so the consumer is responsible for hopping to
    /// the main queue if needed.
    var onDiagnostic: ((String) -> Void)?

    private weak var webView: WKWebView?
    private let audioSession: AVAudioSession
    private let notificationCenter: NotificationCenter
    private let subject = PassthroughSubject<Snapshot, Never>()
    private var cancellables = Set<AnyCancellable>()
    private var latestInterruption: Snapshot.Interruption?
    private var latestRouteChange: Snapshot.RouteChange?
    private var started = false

    /// Timer armed while `latestInterruption?.type == "began"`. Polls
    /// `clearStaleInterruptionIfRecovered()` every second to catch the
    /// case where iOS / WebKit silently transitions the audio session
    /// back to a record-capable category without posting a notification
    /// the bridge can observe. Disarmed on any successful clear, on
    /// `interruption.ended`, on `stop()`, and after `maxRecoveryTicks`
    /// attempts so it can't run forever.
    private var recoveryTimer: DispatchSourceTimer?
    private var recoveryTicks = 0
    private let maxRecoveryTicks = 30
    private let recoveryTickInterval: DispatchTimeInterval = .seconds(1)
    /// After this many ticks, force-synthesize `interruption=ended`
    /// even if `clearStaleInterruptionIfRecovered()` still rejects:
    /// WebKit's internal RTCAudioSession reactivation can leave
    /// `AVAudioSession.sharedInstance()` reporting `category=playback`
    /// + `hint=true` + `otherAudio=true` indefinitely while WebRTC's
    /// own audio path keeps working. Without this escape hatch, the
    /// bridge stays pinned on `began` and the SDK keeps the page at
    /// `host-audio-session-interrupted` for the full
    /// `maxRecoveryTicks` window even though audio is observably alive.
    private let forceClearAfterTicks = 5

    /// Serial queue every notification handler hops onto via
    /// `.receive(on:)`. Keeps the mutable state above off the main
    /// thread and serialises updates regardless of which thread
    /// `NotificationCenter` happens to deliver on.
    private let processingQueue = DispatchQueue(
        label: "io.getstream.AudioSessionBridge"
    )
    /// Cached encoder (configured once) so `dispatch` doesn't allocate
    /// a fresh `JSONEncoder` per snapshot.
    private let encoder: JSONEncoder = {
        let encoder = JSONEncoder()
        encoder.outputFormatting = .withoutEscapingSlashes
        return encoder
    }()

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
            .receive(on: processingQueue)
            .sink { [weak self] in self?.handleInterruption($0) }
            .store(in: &cancellables)

        notificationCenter
            .publisher(for: AVAudioSession.routeChangeNotification)
            .receive(on: processingQueue)
            .sink { [weak self] in self?.handleRouteChange($0) }
            .store(in: &cancellables)

        // Recovery triggers for the case iOS never delivers
        // `interruption.ended`. See `clearStaleInterruptionIfRecovered()`.
        notificationCenter
            .publisher(for: AVAudioSession.silenceSecondaryAudioHintNotification)
            .receive(on: processingQueue)
            .sink { [weak self] _ in self?.handleSecondaryAudioHintChange() }
            .store(in: &cancellables)

        notificationCenter
            .publisher(for: UIApplication.didBecomeActiveNotification)
            .receive(on: processingQueue)
            .sink { [weak self] _ in self?.handleAppDidBecomeActive() }
            .store(in: &cancellables)

        // mediaservicesWereReset coincides with WebKit's `RTCAudioSession`
        // reactivating after a category-conflict interruption. The
        // category transition WebKit performs internally doesn't always
        // post a `routeChangeNotification` the bridge sees, but the
        // media-services reset does — so we treat it as another
        // recovery trigger.
        notificationCenter
            .publisher(for: AVAudioSession.mediaServicesWereResetNotification)
            .receive(on: processingQueue)
            .sink { [weak self] _ in self?.handleMediaServicesWereReset() }
            .store(in: &cancellables)

        // Initial snapshot so the page sees ground truth at page load,
        // even before any interruption or route change happens.
        dispatch()
    }

    func stop() {
        guard started else { return }
        started = false
        // Cancel each subscription explicitly before dropping the set —
        // ensures any in-flight `processingQueue` delivery sees the
        // cancellation immediately rather than waiting for ARC.
        cancellables.forEach { $0.cancel() }
        cancellables.removeAll()
        disarmRecoveryTimer()
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
        if typeString == "began" {
            armRecoveryTimer()
        } else {
            disarmRecoveryTimer()
        }
        dispatch()
    }

    private func handleRouteChange(_ notification: Notification) {
        guard
            let userInfo = notification.userInfo,
            let raw = userInfo[AVAudioSessionRouteChangeReasonKey] as? UInt,
            let reason = AVAudioSession.RouteChangeReason(rawValue: raw)
        else { return }
        latestRouteChange = .init(reason: Self.describe(routeChangeReason: reason))
        _ = clearStaleInterruptionIfRecovered()
        dispatch()
    }

    private func handleSecondaryAudioHintChange() {
        // The OS-level "another session should silence me" hint just
        // changed. When it flips false while we hold a record-capable
        // category, the conflicting session has released audio. Dispatch
        // only if this resolves a stale `began` so we don't spam the page
        // with redundant snapshots on healthy hint flips.
        guard clearStaleInterruptionIfRecovered() else { return }
        dispatch()
    }

    private func handleMediaServicesWereReset() {
        // mediaserverd reset typically pairs with WebKit's
        // `RTCAudioSession` reactivating its category after a
        // category-conflict interruption. WebKit's internal
        // `setCategory(.playAndRecord, ...)` during reactivation does
        // not always post `routeChangeNotification`, so the bridge can
        // be sitting on a stale `began` snapshot with `category=playback`
        // long after the session is observably back. Dispatch only if
        // recovery actually clears the stale `began`.
        guard clearStaleInterruptionIfRecovered() else { return }
        dispatch()
    }

    private func handleAppDidBecomeActive() {
        // Last-chance verification when the user returns to the app. iOS
        // can drop / coalesce notifications while suspended, so the
        // bridge may have missed the `.ended` (or its synthesized
        // equivalent) for an interruption that resolved in the
        // background. Dispatch only if this resolves a stale `began`.
        guard clearStaleInterruptionIfRecovered() else { return }
        dispatch()
    }

    /// iOS does not reliably post `interruption.ended` after a
    /// category-conflict interruption, even when the host runs the
    /// 3-step restore (`setActive(false, .notifyOthersOnDeactivation)`,
    /// `setCategory(.playAndRecord, ...)`, `setActive(true)`). Without a
    /// terminal event, `latestInterruption` stays at `began` forever and
    /// the SDK's `AudioHealthMonitor` keeps the page at
    /// `host-audio-session-interrupted` after the session is healthy
    /// again. This helper synthesizes `.ended` whenever the audio
    /// session is observably back: category is record-capable AND no
    /// secondary session is asking us to be silenced. Returns `true` if
    /// the stale `began` was cleared so the caller can decide whether
    /// to dispatch a fresh snapshot.
    @discardableResult
    private func clearStaleInterruptionIfRecovered() -> Bool {
        guard latestInterruption?.type == "began" else { return false }
        let category = audioSession.category
        guard category == .playAndRecord || category == .record else {
            return false
        }
        guard !audioSession.secondaryAudioShouldBeSilencedHint else {
            return false
        }
        latestInterruption = .init(type: "ended", reason: nil)
        disarmRecoveryTimer()
        return true
    }

    // MARK: - Recovery timer

    /// Arms the periodic resnapshot timer if not already armed.
    /// Resets the tick counter so each fresh `began` gets the full
    /// `maxRecoveryTicks` budget. Runs on `processingQueue`, so timer
    /// events serialise with notification handlers.
    private func armRecoveryTimer() {
        recoveryTicks = 0
        if recoveryTimer != nil { return }
        let timer = DispatchSource.makeTimerSource(queue: processingQueue)
        timer.schedule(
            deadline: .now() + recoveryTickInterval,
            repeating: recoveryTickInterval
        )
        timer.setEventHandler { [weak self] in self?.tickRecoveryTimer() }
        recoveryTimer = timer
        timer.resume()
    }

    private func disarmRecoveryTimer() {
        recoveryTimer?.cancel()
        recoveryTimer = nil
        recoveryTicks = 0
    }

    /// One tick of the resnapshot timer. Runs `clearStaleInterruptionIfRecovered()`;
    /// dispatches a fresh snapshot if the stale `began` actually cleared,
    /// disarms after `maxRecoveryTicks` if not. Always emits a diagnostic
    /// log line so the lifecycle tab shows the timer is alive and which
    /// guard is failing.
    private func tickRecoveryTimer() {
        // Defensive: if `began` is already gone (some other path cleared
        // it without calling `disarmRecoveryTimer()`), stop ticking.
        guard latestInterruption?.type == "began" else {
            disarmRecoveryTimer()
            return
        }
        recoveryTicks += 1
        let category = audioSession.category
        let hint = audioSession.secondaryAudioShouldBeSilencedHint
        let otherAudio = audioSession.isOtherAudioPlaying
        let cleared = clearStaleInterruptionIfRecovered()
        onDiagnostic?(
            "recovery tick=\(recoveryTicks)/\(maxRecoveryTicks)"
            + " category=\(Self.describe(category: category))"
            + " hint=\(hint) otherAudio=\(otherAudio)"
            + " cleared=\(cleared)"
        )
        if cleared {
            // `clearStaleInterruptionIfRecovered()` already disarmed.
            dispatch()
            return
        }
        if recoveryTicks >= forceClearAfterTicks {
            onDiagnostic?(
                "recovery force-clear after \(recoveryTicks) ticks"
                + " (category=\(Self.describe(category: category))"
                + " hint=\(hint) otherAudio=\(otherAudio))"
            )
            latestInterruption = .init(type: "ended", reason: nil)
            disarmRecoveryTimer()
            dispatch()
            return
        }
        if recoveryTicks >= maxRecoveryTicks {
            disarmRecoveryTimer()
        }
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
        guard
            let data = try? encoder.encode(snapshot),
            let json = String(data: data, encoding: .utf8)
        else { return }

        // JSON is a valid JS expression → safe to interpolate directly
        // as the `detail` of a CustomEvent. `evaluateJavaScript` must run
        // on the main thread; hop via `Task { @MainActor }` so the
        // call is awaited rather than fire-and-forgotten.
        let script = """
        window.dispatchEvent(new CustomEvent('stream-video:host-audio-session', { detail: \(json) }));
        """
        Task { @MainActor [weak webView] in
            try await webView?.evaluateJavaScript(script)
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
