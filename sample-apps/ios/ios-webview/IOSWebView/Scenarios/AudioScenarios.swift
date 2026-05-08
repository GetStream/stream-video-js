import AVFoundation
import AVFAudio
import AudioToolbox
import UIKit

final class AudioScenarios: NSObject {
    private var soundPlayer: AVAudioPlayer?
    private var autoRestoringDingPlayer: AVAudioPlayer?
    private var noRestoreDingPlayer: AVAudioPlayer?

    override init() {
        super.init()
        NotificationCenter.default.addObserver(self, selector: #selector(routeChanged(_:)),
                                               name: AVAudioSession.routeChangeNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(interruption(_:)),
                                               name: AVAudioSession.interruptionNotification, object: nil)
    }

    // MARK: Sounds

    func playDing(mixWithOthers: Bool) {
        let session = AVAudioSession.sharedInstance()
        do {
            var options: AVAudioSession.CategoryOptions = []
            if mixWithOthers { options.insert(.mixWithOthers) }
            try session.setCategory(.playback, mode: .default, options: options)
            try session.setActive(true, options: [])
            AppState.shared.audioSessionActive = true
        } catch {
            AppState.shared.log(.errors, "audio", "session setCategory failed: \(error)")
        }
        AppState.shared.log(.scenarios, "audio",
            "play ding (category=.playback, mixWithOthers=\(mixWithOthers))")
        playResource("ding", into: &soundPlayer, loops: 0)
        if soundPlayer == nil {
            AudioServicesPlaySystemSound(1005) // fallback
        }
    }

    /// "Right way" companion to `playDing(mixWithOthers: false)`.
    ///
    /// Same exclusive `.playback` claim, but releases the session via
    /// `setActive(false, .notifyOthersOnDeactivation)` from
    /// `AVAudioPlayerDelegate.audioPlayerDidFinishPlaying`. That single line is
    /// what makes WebKit's `RTCAudioSession` reactivate WebRTC automatically;
    /// the broken `playDing(false)` scenario skips it on purpose so the tester
    /// can see the difference.
    ///
    /// Use this to demonstrate point (2) from the AUDIO-SESSIONS.md
    /// host-app guidance: "If you must play exclusively, restore afterward."
    func playDingWithAutoRestore() {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.playback, mode: .default, options: [])
            try session.setActive(true, options: [])
            AppState.shared.audioSessionActive = true
        } catch {
            AppState.shared.log(.errors, "audio",
                "auto-restore ding setCategory failed: \(error)")
            return
        }
        guard let url = Bundle.main.url(forResource: "ding", withExtension: "caf") else {
            AppState.shared.log(.errors, "audio", "missing Resources/ding.caf")
            return
        }
        do {
            let p = try AVAudioPlayer(contentsOf: url)
            p.delegate = self
            p.numberOfLoops = 0
            p.prepareToPlay()
            p.play()
            autoRestoringDingPlayer = p
            AppState.shared.log(.scenarios, "audio",
                "▶︎ play ding (exclusive) - will release session on finish")
        } catch {
            AppState.shared.log(.errors, "audio",
                "auto-restore ding play failed: \(error)")
        }
    }

    /// Repro for the "stuck red audio-health badge" bug: claims `.playback`
    /// exclusively, plays the ding to completion, releases with
    /// `setActive(false, .notifyOthersOnDeactivation)` ONLY - does NOT
    /// re-set `.playAndRecord` and does NOT synthesize `.ended`. The
    /// host-bridge `latestInterruption` would stay at `began` indefinitely
    /// without the bridge's broader `clearStaleInterruptionIfRecovered()`
    /// triggers (route-change of any reason, secondary-audio hint flip,
    /// app foreground). With those triggers in place, the page-side
    /// `audioHealth$` should return to healthy within ~1 second of the
    /// ding finishing. Pre-fix: indicator stayed red until the user
    /// manually triggered another scenario.
    func playDingExclusiveNoRestore() {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.playback, mode: .default, options: [])
            try session.setActive(true, options: [])
            AppState.shared.audioSessionActive = true
        } catch {
            AppState.shared.log(.errors, "audio",
                "no-restore ding setCategory failed: \(error)")
            return
        }
        guard let url = Bundle.main.url(forResource: "ding", withExtension: "caf") else {
            AppState.shared.log(.errors, "audio", "missing Resources/ding.caf")
            return
        }
        do {
            let p = try AVAudioPlayer(contentsOf: url)
            p.delegate = self
            p.numberOfLoops = 0
            p.prepareToPlay()
            p.play()
            noRestoreDingPlayer = p
            AppState.shared.log(.scenarios, "audio",
                "▶︎ play ding (exclusive, NO restore) - will deactivate only on finish")
        } catch {
            AppState.shared.log(.errors, "audio",
                "no-restore ding play failed: \(error)")
        }
    }

    private func playResource(_ name: String,
                              into player: inout AVAudioPlayer?,
                              loops: Int) {
        guard let url = Bundle.main.url(forResource: name, withExtension: "caf") else {
            AppState.shared.log(.errors, "audio", "missing Resources/\(name).caf; using fallback")
            return
        }
        do {
            let p = try AVAudioPlayer(contentsOf: url)
            p.numberOfLoops = loops
            p.prepareToPlay()
            p.play()
            player = p
        } catch {
            AppState.shared.log(.errors, "audio", "play \(name) failed: \(error)")
        }
    }

    // MARK: Session state dump

    func dumpSessionState(label: String = "dump") {
        let s = AVAudioSession.sharedInstance()
        let outs = s.currentRoute.outputs.map { "\($0.portType.rawValue)[\($0.portName)]" }.joined(separator: ",")
        let ins = s.currentRoute.inputs.map { "\($0.portType.rawValue)[\($0.portName)]" }.joined(separator: ",")
        let line = """
        audio-session[\(label)]: \
        cat=\(s.category.rawValue) mode=\(s.mode.rawValue) opts=\(describeOptions(s.categoryOptions)) \
        sr=\(s.sampleRate) ioBuf=\(s.ioBufferDuration) vol=\(s.outputVolume) \
        otherAudio=\(s.isOtherAudioPlaying) \
        in=[\(ins)] out=[\(outs)]
        """
        AppState.shared.log(.lifecycle, "audio", line)
    }

    private func describeOptions(_ opts: AVAudioSession.CategoryOptions) -> String {
        var parts: [String] = []
        if opts.contains(.mixWithOthers) { parts.append("mixWithOthers") }
        if opts.contains(.duckOthers) { parts.append("duckOthers") }
        if opts.contains(.allowBluetooth) { parts.append("allowBluetooth") }
        if opts.contains(.allowBluetoothA2DP) { parts.append("allowBluetoothA2DP") }
        if opts.contains(.allowAirPlay) { parts.append("allowAirPlay") }
        if opts.contains(.defaultToSpeaker) { parts.append("defaultToSpeaker") }
        if opts.contains(.interruptSpokenAudioAndMixWithOthers) { parts.append("interruptSpokenAudio") }
        return parts.isEmpty ? "none" : parts.joined(separator: "|")
    }

    @objc private func routeChanged(_ note: Notification) {
        guard let reasonValue = note.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt,
              let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue) else { return }
        let reasonName: String
        switch reason {
        case .unknown: reasonName = "unknown"
        case .newDeviceAvailable: reasonName = "newDeviceAvailable"
        case .oldDeviceUnavailable: reasonName = "oldDeviceUnavailable"
        case .categoryChange: reasonName = "categoryChange"
        case .override: reasonName = "override"
        case .wakeFromSleep: reasonName = "wakeFromSleep"
        case .noSuitableRouteForCategory: reasonName = "noSuitableRouteForCategory"
        case .routeConfigurationChange: reasonName = "routeConfigurationChange"
        @unknown default: reasonName = "unknown"
        }
        let prev = (note.userInfo?[AVAudioSessionRouteChangePreviousRouteKey] as? AVAudioSessionRouteDescription)?
            .outputs.map(\.portName).joined(separator: ",") ?? ""
        let next = AVAudioSession.sharedInstance().currentRoute.outputs.map(\.portName).joined(separator: ",")
        AppState.shared.log(.lifecycle, "audio", "routeChange reason=\(reasonName) prev=[\(prev)] → new=[\(next)]")
    }

    @objc private func interruption(_ note: Notification) {
        guard let typeValue = note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeValue) else { return }
        AppState.shared.log(.lifecycle, "audio", "interruption=\(type == .began ? "began" : "ended")")
    }

    // MARK: Category picker

    /// The full set of `AVAudioSession.Category` values for the menu. Pairs
    /// with `setCategory(_:)`, which applies `mode: .default` and no options.
    /// Use "Restore audio (native)" to return to the WebRTC-friendly
    /// `.playAndRecord/.videoChat` configuration afterward.
    static let allCategories: [(label: String, category: AVAudioSession.Category)] = [
        (".ambient", .ambient),
        (".soloAmbient", .soloAmbient),
        (".playback", .playback),
        (".record", .record),
        (".playAndRecord", .playAndRecord),
        (".multiRoute", .multiRoute),
    ]

    /// Sets `AVAudioSession` to the given category with `mode: .default` and
    /// no options, then re-activates the session so the change takes effect.
    /// Logs state dumps before and after.
    func setCategory(_ category: AVAudioSession.Category) {
        let s = AVAudioSession.sharedInstance()
        dumpSessionState(label: "before setCategory")
        do {
            try s.setCategory(category, mode: .default, options: [])
            try s.setActive(true, options: [])
            AppState.shared.audioSessionActive = true
            AppState.shared.log(.scenarios, "audio",
                "setCategory(\(shortCategoryName(category)), .default, [])")
        } catch {
            AppState.shared.log(.errors, "audio",
                "setCategory(\(shortCategoryName(category))) failed: \(error)")
        }
        dumpSessionState(label: "after setCategory")
    }

    private func shortCategoryName(_ c: AVAudioSession.Category) -> String {
        let bare = c.rawValue
            .replacingOccurrences(of: "AVAudioSessionCategory", with: "")
        guard let first = bare.first else { return ".\(bare)" }
        return "." + first.lowercased() + bare.dropFirst()
    }

    // MARK: Session restore

    /// Hands the audio session back to WebRTC after a hostile change.
    ///
    /// Sequence:
    ///   1. `setActive(false, .notifyOthersOnDeactivation)` - posts the
    ///      `AVAudioSession.interruptionNotification` `.ended + .shouldResume`
    ///      event that WebKit's embedded `RTCAudioSession` is listening for.
    ///   2. `setCategory(.playAndRecord, mode: .videoChat, options: …)` -
    ///      puts the session in the state WebRTC wants before it re-asserts.
    ///   3. `setActive(true)` - re-activates so input+output are live again.
    ///
    /// Use this after running **Play ding (exclusive, NO restore)** - or any
    /// time WebRTC audio seems stuck after a native-side session change.
    func restoreForWebRTC() {
        let s = AVAudioSession.sharedInstance()
        dumpSessionState(label: "before restore")
        do {
            try s.setActive(false, options: [.notifyOthersOnDeactivation])
            AppState.shared.audioSessionActive = false
            try s.setCategory(.playAndRecord,
                              mode: .videoChat,
                              options: [.allowBluetoothHFP, .allowBluetoothA2DP, .defaultToSpeaker])
            try s.setActive(true, options: [])
            AppState.shared.audioSessionActive = true
            AppState.shared.log(.scenarios, "audio",
                "restored → .playAndRecord/.videoChat + active(true) (notifyOthersOnDeactivation fired)")
            synthesizeInterruptionEnded()
        } catch {
            AppState.shared.log(.errors, "audio", "restore failed: \(error)")
        }
        dumpSessionState(label: "after restore")
    }

    /// Posts a synthetic `AVAudioSession.interruptionNotification(.ended)`.
    ///
    /// iOS does not reliably deliver `.ended` to in-process observers after a
    /// host-initiated self-restore: `setActive(false, .notifyOthersOnDeactivation)`
    /// signals other processes, and `setCategory(.playAndRecord, ...)` may or may
    /// not fire a `routeChangeNotification(.categoryChange)` depending on iOS
    /// version, timing, and whether the system coalesces it with the prior
    /// `.began`. Without an `.ended`, `AudioSessionBridge.latestInterruption`
    /// stays at `began` and the page-side `AudioHealthMonitor` keeps reading
    /// `host-audio-session-interrupted` even after the session is healthy again.
    ///
    /// Posting one ourselves at the end of a successful self-restore makes the
    /// recovery deterministic: the bridge runs `handleInterruption`, updates
    /// `latestInterruption` to `ended`, and dispatches a fresh snapshot. Any
    /// other in-process observer (WebKit's `RTCAudioSession` included) treats
    /// it as a normal `.ended + .shouldResume`, which is consistent with the
    /// state we just put the session in.
    private func synthesizeInterruptionEnded() {
        let info: [AnyHashable: Any] = [
            AVAudioSessionInterruptionTypeKey:
                AVAudioSession.InterruptionType.ended.rawValue,
            AVAudioSessionInterruptionOptionKey:
                AVAudioSession.InterruptionOptions.shouldResume.rawValue,
        ]
        NotificationCenter.default.post(
            name: AVAudioSession.interruptionNotification,
            object: AVAudioSession.sharedInstance(),
            userInfo: info)
        AppState.shared.log(.lifecycle, "audio",
            "synthesized interruption=ended (host self-restore)")
    }

}

extension AudioScenarios: AVAudioPlayerDelegate {
    /// Two players set `delegate = self`: the auto-restore ding
    /// (`playDingWithAutoRestore`) and the no-restore ding
    /// (`playDingExclusiveNoRestore`). Identity check routes each to the
    /// correct finish handler and guards against accidental future reuse.
    ///
    /// Empirically the single `setActive(false, .notifyOthersOnDeactivation)`
    /// the AUDIO-SESSIONS.md doc once recommended is *not* enough when
    /// embedding WebRTC: iOS often only posts `interruption=began` (no
    /// matching `.ended`) for category-conflict interruptions, and WKWebView's
    /// `RTCAudioSession` does not re-assert `.playAndRecord` on its own. The
    /// session ends up "deactivated but still .playback," and the page-side
    /// `host-audio-session-interrupted` reason gets stuck.
    ///
    /// The reliably-recovering pattern is the same 3-step we use in
    /// `restoreForWebRTC()`: deactivate (with notify), re-set the WebRTC
    /// category, reactivate. That's what the auto-restore branch runs. The
    /// no-restore branch deliberately stops at the deactivate step so we can
    /// verify the bridge's recovery triggers (route-change, secondary-audio
    /// hint, foreground) clear the stale `began` on their own.
    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully: Bool) {
        if player === autoRestoringDingPlayer {
            autoRestoringDingPlayer = nil
            handleAutoRestoreDingFinished(successfully: successfully)
            return
        }
        if player === noRestoreDingPlayer {
            noRestoreDingPlayer = nil
            handleNoRestoreDingFinished(successfully: successfully)
            return
        }
    }

    private func handleAutoRestoreDingFinished(successfully: Bool) {
        AppState.shared.log(.scenarios, "audio",
            "ding finished (success=\(successfully)) - restoring session for WebRTC")
        let s = AVAudioSession.sharedInstance()
        do {
            try s.setActive(false, options: [.notifyOthersOnDeactivation])
            AppState.shared.audioSessionActive = false
            try s.setCategory(.playAndRecord,
                              mode: .videoChat,
                              options: [.allowBluetoothHFP, .allowBluetoothA2DP, .defaultToSpeaker])
            try s.setActive(true, options: [])
            AppState.shared.audioSessionActive = true
            AppState.shared.log(.scenarios, "audio",
                "restored → .playAndRecord/.videoChat + active(true)")
            synthesizeInterruptionEnded()
        } catch {
            AppState.shared.log(.errors, "audio",
                "release-on-finish restore failed: \(error)")
        }
    }

    private func handleNoRestoreDingFinished(successfully: Bool) {
        AppState.shared.log(.scenarios, "audio",
            "ding finished (success=\(successfully)) - deactivating only, NO restore")
        let s = AVAudioSession.sharedInstance()
        do {
            try s.setActive(false, options: [.notifyOthersOnDeactivation])
            AppState.shared.audioSessionActive = false
            AppState.shared.log(.scenarios, "audio",
                "deactivated; category=\(s.category.rawValue) (NOT restored)")
        } catch {
            AppState.shared.log(.errors, "audio",
                "no-restore deactivation failed: \(error)")
        }
    }
}

