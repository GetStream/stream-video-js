//
//  WKWebView+Observation.swift
//  IOSWebView
//
//  Created by Ilias Pavlidakis on 7/5/26.
//

import Foundation
import WebKit
import AVFoundation
import Combine

extension WKWebView {
    private static let snapshotEncoder: JSONEncoder = {
        let encoder = JSONEncoder()
        encoder.outputFormatting = .withoutEscapingSlashes
        return encoder
    }()

    private enum AudioSessionObserveKey {
        static var key: UInt8 = 0
    }

    var audioSessionObserver: AudioSessionObserver {
        if let observer = objc_getAssociatedObject(
            self,
            &AudioSessionObserveKey.key
        ) as? AudioSessionObserver {
            return observer
        }

        let observer = AudioSessionObserver(self)

        objc_setAssociatedObject(
            self,
            &AudioSessionObserveKey.key,
            observer,
            .OBJC_ASSOCIATION_RETAIN_NONATOMIC
        )

        return observer
    }

    func configureObservation() {
        _ = audioSessionObserver
    }

    fileprivate func forwardAudioSessionSnapshot(
        _ snapshot: AudioSessionObserver.Snapshot
    ) {
        guard
            let data = try? Self.snapshotEncoder.encode(snapshot),
            let json = String(data: data, encoding: .utf8)
        else { return }

        // JSON is a valid JS expression → safe to interpolate directly
        // as the `detail` of a CustomEvent. `evaluateJavaScript` must run
        // on the main thread; hop via `Task { @MainActor }` so the
        // call is awaited rather than fire-and-forgotten.
        let script = """
        window.dispatchEvent(new CustomEvent('stream-video:host-audio-session', { detail: \(json) }));
        """

        DispatchQueue.main.async { [weak self] in
            self?.evaluateJavaScript(script, completionHandler: { _,_  in  })
        }
    }
}

extension WKWebView {
    final class AudioSessionObserver {
        fileprivate struct Snapshot: Encodable, Equatable, CustomStringConvertible {
            let schemaVersion: Int
            let timestamp: Int64
            let session: Session
            let interruption: Interruption?
            let routeChange: RouteChange?
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
                let category: String
                let mode: String
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
                let type: String  // "began" | "ended"
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
                let inputs: [Port]
                let outputs: [Port]

                var description: String {
                    var result = "{"
                    result += " inputs:\(inputs)"
                    result += ", outputs:\(outputs)"
                    result += " }"
                    return result
                }

                struct Port: Encodable, Equatable, CustomStringConvertible {
                    /// Human-readable device name from
                    /// `AVAudioSessionPortDescription.portName`
                    /// (e.g. "OL AirPods Pro 3", "iPhone Microphone").
                    let name: String
                    /// `AVAudioSession.Port` raw value (e.g. "BluetoothHFP",
                    /// "MicrophoneBuiltIn", "Receiver", "Speaker").
                    let type: String

                    var description: String {
                        var result = "{"
                        result += " name:\(name)"
                        result += ", type:\(type)"
                        result += " }"
                        return result
                    }
                }
            }
        }

        private weak var webView: WKWebView?
        private var cancellables = Set<AnyCancellable>()
        private let audioSession: AVAudioSession
        private let notificationCenter: NotificationCenter
        private let processingQueue = DispatchQueue(label: "io.getstream.AudioSessionObserver")

        private var latestInterruption: Snapshot.Interruption?
        private var latestRouteChange: Snapshot.RouteChange?

        // Timer armed while `latestInterruption?.type == "began"`. Polls
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
        private let forceClearAfterTicks = 5

        init(
            _ webView: WKWebView,
            audioSession: AVAudioSession = .sharedInstance(),
            notificationCenter: NotificationCenter = .default
        ) {
            self.webView = webView
            self.audioSession = audioSession
            self.notificationCenter = notificationCenter

            configureAudioSession()
            configureObservation()
        }

        // MARK: - Private 
        // MARK: Configuration

        private func configureAudioSession() {
            do {
                try audioSession.setPrefersNoInterruptionsFromSystemAlerts(true)
                logInfo("Completed successfully!")
            } catch {
                logError(error)
            }
        }

        // MARK: Observation

        private func configureObservation() {
            notificationCenter
                .publisher(for: AVAudioSession.interruptionNotification)
                .receive(on: processingQueue)
                .sink { [weak self] in self?.handleInterruption($0) }
                .store(in: &cancellables)

            notificationCenter
                .publisher(for: AVAudioSession.silenceSecondaryAudioHintNotification)
                .receive(on: processingQueue)
                .sink { [weak self] _ in self?.handleSecondaryAudioHintChange() }
                .store(in: &cancellables)

            notificationCenter
                .publisher(for: AVAudioSession.mediaServicesWereResetNotification)
                .receive(on: processingQueue)
                .sink { [weak self] _ in self?.handleMediaServicesWereReset() }
                .store(in: &cancellables)

            notificationCenter
                .publisher(for: AVAudioSession.routeChangeNotification)
                .receive(on: processingQueue)
                .sink { [weak self] in self?.handleRouteChange($0) }
                .store(in: &cancellables)

            notificationCenter
                .publisher(for: UIApplication.didBecomeActiveNotification)
                .receive(on: processingQueue)
                .sink { [weak self] _ in self?.handleAppDidBecomeActive() }
                .store(in: &cancellables)
        }

        // MARK: Handlers

        private func handleInterruption(_ notification: Notification) {
            guard
                let userInfo = notification.userInfo,
                let typeRawValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
                let type = AVAudioSession.InterruptionType(rawValue: typeRawValue)
            else {
                logInfo("Invalid notification")
                return
            }

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
                logInfo("Recovery timer armed, interruptionType:began")
            } else {
                disarmRecoveryTimer()
                logInfo("Recovery timer disabled, interruptionType:ended")
            }
            webView?.forwardAudioSessionSnapshot(buildSnapshot())
        }

        private func handleSecondaryAudioHintChange() {
            // The OS-level "another session should silence me" hint just
            // changed. When it flips false while we hold a record-capable
            // category, the conflicting session has released audio. Dispatch
            // only if this resolves a stale `began` so we don't spam the page
            // with redundant snapshots on healthy hint flips.
            guard clearStaleInterruptionIfRecovered() else { return }
            webView?.forwardAudioSessionSnapshot(buildSnapshot())
            logInfo("Completed successfully.")
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
            webView?.forwardAudioSessionSnapshot(buildSnapshot())
            logInfo("Completed successfully.")
        }

        private func handleRouteChange(_ notification: Notification) {
            guard
                let userInfo = notification.userInfo,
                let raw = userInfo[AVAudioSessionRouteChangeReasonKey] as? UInt,
                let reason = AVAudioSession.RouteChangeReason(rawValue: raw)
            else {
                logInfo("Invalid route notification")
                return
            }
            let currentRoute = Snapshot.RouteChange(reason: Self.describe(routeChangeReason: reason))
            latestRouteChange = currentRoute
            _ = clearStaleInterruptionIfRecovered()
            logInfo("Route updated to \(currentRoute)")
            webView?.forwardAudioSessionSnapshot(buildSnapshot())
        }

        private func handleAppDidBecomeActive() {
            // Last-chance verification when the user returns to the app. iOS
            // can drop / coalesce notifications while suspended, so the
            // bridge may have missed the `.ended` (or its synthesized
            // equivalent) for an interruption that resolved in the
            // background. Dispatch only if this resolves a stale `began`.
            guard clearStaleInterruptionIfRecovered() else { return }
            webView?.forwardAudioSessionSnapshot(buildSnapshot())
            logInfo("Completed successfully.")
        }

        // MARK: Helpers

        /// Arms the periodic resnapshot timer if not already armed.
        /// Resets the tick counter so each fresh `began` gets the full
        /// `maxRecoveryTicks` budget. Runs on `processingQueue`, so timer
        /// events serialise with notification handlers.
        private func armRecoveryTimer() {
            recoveryTicks = 0
            if recoveryTimer != nil { return }
            let timer = DispatchSource.makeTimerSource(queue: DispatchQueue.global(qos: .userInteractive))
            timer.schedule(
                deadline: .now() + recoveryTickInterval,
                repeating: recoveryTickInterval
            )
            timer.setEventHandler { [weak self] in
                self?.processingQueue.async { [weak self] in
                    self?.tickRecoveryTimer()
                }
            }
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
                logInfo("Disarming recoveryTimer as latestInterruption.type != began")
                disarmRecoveryTimer()
                return
            }
            recoveryTicks += 1
            let cleared = clearStaleInterruptionIfRecovered()

            if cleared {
                logInfo("clearStaleInterruptionIfRecovered completed")
                // `clearStaleInterruptionIfRecovered()` already disarmed.
                webView?.forwardAudioSessionSnapshot(buildSnapshot())
                return
            }
            if recoveryTicks >= forceClearAfterTicks {
                logInfo("Timer expired. ending latest interruption")
                latestInterruption = .init(type: "ended", reason: nil)
                disarmRecoveryTimer()
                webView?.forwardAudioSessionSnapshot(buildSnapshot())
                return
            }
            if recoveryTicks >= maxRecoveryTicks {
                logInfo("MaxRecoveryTicks reached. Disarming timer")
                disarmRecoveryTimer()
            }
        }

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

        private func buildSnapshot() -> Snapshot {
            let snapshot = Snapshot(
                schemaVersion: 1,
                timestamp: Int64(Date().timeIntervalSince1970 * 1000),
                session: .init(
                    category: Self.describe(category: audioSession.category),
                    mode: Self.describe(mode: audioSession.mode),
                    options: Self.describe(options: audioSession.categoryOptions)
                ),
                interruption: latestInterruption,
                routeChange: latestRouteChange,
                route: Self.snapshotRoute(audioSession.currentRoute)
            )

            logInfo("Snapshot built \(snapshot)")

            return snapshot
        }

        private func logInfo(
            _ message: String,
            function: StaticString = #function,
            line: UInt = #line
        ) {
            print("(\(function):\(line)):\(message)")
        }

        private func logError(
            _ error: Error,
            function: StaticString = #function,
            line: UInt = #line
        ) {
            logInfo("Error:\(error)", function: function, line: line)
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

        private static func snapshotRoute(
            _ route: AVAudioSessionRouteDescription
        ) -> Snapshot.Route {
            .init(
                inputs: route.inputs.map { .init(name: $0.portName, type: $0.portType.rawValue) },
                outputs: route.outputs.map { .init(name: $0.portName, type: $0.portType.rawValue) }
            )
        }
    }
}
