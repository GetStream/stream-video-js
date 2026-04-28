import AVFoundation
import AVFAudio
import AudioToolbox
import UIKit
import CallKit
import UserNotifications

final class AudioScenarios: NSObject {
    private var soundPlayer: AVAudioPlayer?
    private var ringPlayer: AVAudioPlayer?
    private var toneEngine: AVAudioEngine?
    private var toneNode: AVAudioSourceNode?
    private let webEval: (String, String?) -> Void

    // CallKit
    private var provider: CXProvider?
    private var currentCallUUID: UUID?

    init(eval: @escaping (String, String?) -> Void) {
        self.webEval = eval
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

    func playRingtone() {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try session.setActive(true, options: [])
            AppState.shared.audioSessionActive = true
        } catch {
            AppState.shared.log(.errors, "audio", "ringtone setCategory failed: \(error)")
        }
        AppState.shared.log(.scenarios, "audio", "ringtone start")
        playResource("ringtone", into: &ringPlayer, loops: -1)
        if ringPlayer == nil {
            // Fallback: use AudioEngine sine loop
            startTone(frequency: 660, stereo: false)
        }
    }

    func stopRingtone() {
        ringPlayer?.stop(); ringPlayer = nil
        stopTone()
        AppState.shared.log(.scenarios, "audio", "ringtone stop")
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

    // MARK: Notification sound

    func fireNotificationSound() {
        let center = UNUserNotificationCenter.current()
        center.requestAuthorization(options: [.alert, .sound]) { granted, err in
            if let err { AppState.shared.log(.errors, "audio", "notif auth error: \(err)") }
            AppState.shared.log(.scenarios, "audio", "notif auth granted=\(granted)")
            guard granted else { return }
            let content = UNMutableNotificationContent()
            content.title = "IOSWebView"
            content.body = "Simulated notification sound"
            content.sound = .default
            let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 2, repeats: false)
            center.add(UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger))
        }
    }

    // MARK: Audio route toggle

    func toggleRoute() {
        let session = AVAudioSession.sharedInstance()
        let isSpeaker = session.currentRoute.outputs.contains { $0.portType == .builtInSpeaker }
        do {
            try session.overrideOutputAudioPort(isSpeaker ? .none : .speaker)
        } catch {
            AppState.shared.log(.errors, "audio", "overrideOutputAudioPort failed: \(error)")
        }
        dumpSessionState(label: "after route toggle")
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

    // MARK: CallKit

    func simulateCallKitIncoming() {
        let config = CXProviderConfiguration(localizedName: "IOSWebView Sample")
        config.supportsVideo = false
        config.maximumCallsPerCallGroup = 1
        let prov = CXProvider(configuration: config)
        prov.setDelegate(self, queue: .main)
        provider = prov
        let uuid = UUID()
        currentCallUUID = uuid
        let update = CXCallUpdate()
        update.remoteHandle = CXHandle(type: .generic, value: "IOSWebView Test")
        update.hasVideo = false
        prov.reportNewIncomingCall(with: uuid, update: update) { error in
            if let error {
                AppState.shared.log(.errors, "audio", "callkit reportNewIncomingCall: \(error)")
            } else {
                AppState.shared.log(.scenarios, "audio", "callkit incoming reported uuid=\(uuid)")
            }
        }
    }

    func endCallKitCall() {
        guard let uuid = currentCallUUID else { return }
        provider?.reportCall(with: uuid, endedAt: nil, reason: .remoteEnded)
        currentCallUUID = nil
        AppState.shared.log(.scenarios, "audio", "callkit ended uuid=\(uuid)")
    }

    /// Composite repro for the customer "phone call received during a live
    /// call" scenario.
    ///
    /// Sequence:
    ///   1. Pre-snapshot at t=0 (label: "pre-interruption").
    ///   2. `simulateCallKitIncoming()` — CallKit hijacks AVAudioSession.
    ///   3. After `holdSeconds`, `endCallKitCall()` — releases the session.
    ///   4. Post-snapshot at +0.5s and +3s after end — "did the session
    ///      come back to .playAndRecord/.videoChat the way WebRTC needs?"
    ///
    /// The two post-snapshots make the delayed-restore window visible:
    /// WebKit's `RTCAudioSession` reactivates on
    /// `interruptionNotification(.ended + .shouldResume)`, which usually
    /// arrives within ~100ms but can take longer. If the +3s snapshot still
    /// shows drift from the pre-snapshot, that's the bug.
    func simulatePhoneCallInterruption(holdSeconds: TimeInterval = 5) {
        AppState.shared.log(.scenarios, "audio",
            "▶︎ phone-call interruption scenario (hold=\(holdSeconds)s)")
        dumpSessionState(label: "pre-interruption")
        simulateCallKitIncoming()
        DispatchQueue.main.asyncAfter(deadline: .now() + holdSeconds) { [weak self] in
            guard let self else { return }
            self.endCallKitCall()
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
                self?.dumpSessionState(label: "post-interruption +0.5s")
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) { [weak self] in
                self?.dumpSessionState(label: "post-recovery-window +3s")
                AppState.shared.log(.scenarios, "audio",
                    "▶︎ phone-call interruption scenario complete — compare snapshots")
            }
        }
    }

    // MARK: Category picker

    /// The full set of `AVAudioSession.Category` values, with short display
    /// names for the menu. Pairs with `setCategory(_:)` below.
    ///
    /// Use this to put the session into any category on demand, to observe
    /// how WebRTC, `navigator.audioSession`, and the debug overlay react.
    /// Applies `mode: .default` and no options — a clean switch. If you want
    /// options (`.mixWithOthers`, `.defaultToSpeaker`, etc.) or a specific
    /// mode, combine with the existing "Force mode=.default" / "Toggle route"
    /// actions afterward, or use "Restore audio (native)" to go back to
    /// `.playAndRecord/.voiceChat + [.allowBluetooth, .defaultToSpeaker]`.
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

    // MARK: Hostile switches

    func forcePlaybackCategory() {
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [])
            AppState.shared.log(.scenarios, "audio", "hostile → .playback/.default")
            dumpSessionState(label: "after hostile .playback")
        } catch {
            AppState.shared.log(.errors, "audio", "forcePlayback: \(error)")
        }
    }

    func forceDefaultMode() {
        do {
            try AVAudioSession.sharedInstance().setMode(.default)
            AppState.shared.log(.scenarios, "audio", "hostile → mode=.default (disables AEC/AGC)")
            dumpSessionState(label: "after mode=.default")
        } catch {
            AppState.shared.log(.errors, "audio", "forceDefaultMode: \(error)")
        }
    }

    func silentDeactivation() {
        do {
            try AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
            AppState.shared.audioSessionActive = false
            AppState.shared.log(.scenarios, "audio", "setActive(false, .notifyOthersOnDeactivation)")
        } catch {
            AppState.shared.log(.errors, "audio", "setActive(false): \(error)")
        }
    }

    // MARK: JS-only recovery

    /// Asks the webview to nudge its audio through pure JS APIs, without any
    /// native AVAudioSession changes. Compare the result with the native
    /// `restoreForWebRTC()` path to see how far a webview-only customer can get.
    ///
    /// Just writes `navigator.audioSession.type = 'play-and-record'` (iOS
    /// 16.4+ WKWebView) — the closest JS equivalent to `setCategory`.
    /// The SDK's `AudioHealthMonitor` already owns the probe `AudioContext`
    /// and a `getUserMedia` + `replaceTrack` recovery path lives in
    /// `call.resumeAudio()`; both are reachable through the tutorial's
    /// React surface, so we don't reach inside the webview for them here.
    func attemptJSRecovery() {
        let js = """
        (function() {
          try {
            if (!navigator.audioSession) {
              return 'navigator.audioSession unavailable (iOS <16.4?)';
            }
            var was = navigator.audioSession.type;
            navigator.audioSession.type = 'play-and-record';
            return 'navigator.audioSession.type: ' + was + ' → ' + navigator.audioSession.type;
          } catch(e) {
            return 'audioSession.type error: ' + (e && e.message);
          }
        })();
        """
        webEval(js, "JS-only audio recovery")
    }

    // MARK: Session restore

    /// Hands the audio session back to WebRTC after a hostile change.
    ///
    /// Sequence:
    ///   1. `setActive(false, .notifyOthersOnDeactivation)` — posts the
    ///      `AVAudioSession.interruptionNotification` `.ended + .shouldResume`
    ///      event that WebKit's embedded `RTCAudioSession` is listening for.
    ///   2. `setCategory(.playAndRecord, mode: .videoChat, options: …)` —
    ///      puts the session in the state WebRTC wants before it re-asserts.
    ///   3. `setActive(true)` — re-activates so input+output are live again.
    ///
    /// Use this after running **Play ding (no mixWithOthers)**, **Force .playback**,
    /// **Force mode=.default**, or **setActive(false)** — or any time WebRTC audio
    /// seems stuck after a native-side session change.
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
        } catch {
            AppState.shared.log(.errors, "audio", "restore failed: \(error)")
        }
        dumpSessionState(label: "after restore")
    }

    // MARK: Test tone

    func startTone(frequency: Double = 440, stereo: Bool = false) {
        stopTone()
        let engine = AVAudioEngine()
        let sampleRate: Double = 44_100
        let format = AVAudioFormat(commonFormat: .pcmFormatFloat32, sampleRate: sampleRate,
                                   channels: stereo ? 2 : 1, interleaved: false)!
        var phase: Double = 0
        let increment = 2 * .pi * frequency / sampleRate
        let node = AVAudioSourceNode(format: format) { _, _, frameCount, abl in
            let bufferListPointer = UnsafeMutableAudioBufferListPointer(abl)
            for frame in 0..<Int(frameCount) {
                let sample = Float(sin(phase)) * 0.2
                phase += increment
                if phase > 2 * .pi { phase -= 2 * .pi }
                for buffer in bufferListPointer {
                    let buf = buffer.mData?.assumingMemoryBound(to: Float.self)
                    buf?[frame] = sample
                }
            }
            return noErr
        }
        engine.attach(node)
        engine.connect(node, to: engine.mainMixerNode, format: format)
        do {
            try engine.start()
            toneEngine = engine
            toneNode = node
            AppState.shared.log(.scenarios, "audio", "tone \(frequency)Hz started")
        } catch {
            AppState.shared.log(.errors, "audio", "tone start: \(error)")
        }
    }

    func stopTone() {
        if let engine = toneEngine {
            engine.stop()
            if let node = toneNode { engine.detach(node) }
        }
        toneEngine = nil; toneNode = nil
    }

    // MARK: Mic level meter / record-playback

    private var meterRecorder: AVAudioRecorder?
    private var meterTimer: Timer?
    private var lastRecordingURL: URL?

    func startMicMeter() {
        stopMicMeter()
        do {
            try AVAudioSession.sharedInstance().setCategory(.playAndRecord, mode: .videoChat,
                                                            options: [.defaultToSpeaker, .allowBluetoothHFP, .allowBluetoothA2DP])
            try AVAudioSession.sharedInstance().setActive(true, options: [])
        } catch {
            AppState.shared.log(.errors, "audio", "meter session: \(error)"); return
        }
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("mic-meter.caf")
        let settings: [String: Any] = [
            AVFormatIDKey: kAudioFormatAppleIMA4,
            AVSampleRateKey: 22_050.0,
            AVNumberOfChannelsKey: 1,
        ]
        do {
            let rec = try AVAudioRecorder(url: url, settings: settings)
            rec.isMeteringEnabled = true
            rec.record()
            meterRecorder = rec
            lastRecordingURL = url
            meterTimer = Timer.scheduledTimer(withTimeInterval: 0.25, repeats: true) { [weak self] _ in
                guard let self, let rec = self.meterRecorder else { return }
                rec.updateMeters()
                AppState.shared.log(.lifecycle, "mic", String(format: "avgPower=%.1f dB  peak=%.1f dB",
                                                              rec.averagePower(forChannel: 0),
                                                              rec.peakPower(forChannel: 0)))
            }
            AppState.shared.log(.scenarios, "audio", "mic meter started")
        } catch {
            AppState.shared.log(.errors, "audio", "AVAudioRecorder: \(error)")
        }
    }

    func stopMicMeter() {
        meterTimer?.invalidate(); meterTimer = nil
        meterRecorder?.stop(); meterRecorder = nil
    }

    func recordAndPlayback(seconds: TimeInterval = 3) {
        stopMicMeter()
        do {
            try AVAudioSession.sharedInstance().setCategory(.playAndRecord, mode: .default,
                                                            options: [.defaultToSpeaker])
            try AVAudioSession.sharedInstance().setActive(true, options: [])
        } catch {
            AppState.shared.log(.errors, "audio", "rec/playback session: \(error)"); return
        }
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("rec.caf")
        let settings: [String: Any] = [
            AVFormatIDKey: kAudioFormatAppleIMA4,
            AVSampleRateKey: 22_050.0,
            AVNumberOfChannelsKey: 1,
        ]
        do {
            let rec = try AVAudioRecorder(url: url, settings: settings)
            rec.record()
            AppState.shared.log(.scenarios, "audio", "recording \(seconds)s…")
            DispatchQueue.main.asyncAfter(deadline: .now() + seconds) {
                rec.stop()
                AppState.shared.log(.scenarios, "audio", "playback…")
                do {
                    let p = try AVAudioPlayer(contentsOf: url)
                    p.prepareToPlay(); p.play()
                    self.soundPlayer = p
                } catch {
                    AppState.shared.log(.errors, "audio", "playback: \(error)")
                }
            }
        } catch {
            AppState.shared.log(.errors, "audio", "AVAudioRecorder: \(error)")
        }
    }

    // MARK: Interruption simulation

    func postInterruption(began: Bool) {
        var info: [AnyHashable: Any] = [
            AVAudioSessionInterruptionTypeKey: began
                ? AVAudioSession.InterruptionType.began.rawValue
                : AVAudioSession.InterruptionType.ended.rawValue,
        ]
        if !began {
            info[AVAudioSessionInterruptionOptionKey] = AVAudioSession.InterruptionOptions.shouldResume.rawValue
        }
        NotificationCenter.default.post(name: AVAudioSession.interruptionNotification,
                                        object: AVAudioSession.sharedInstance(),
                                        userInfo: info)
        AppState.shared.log(.scenarios, "audio", "simulated interruption=\(began ? "began" : "ended")")
    }
}

extension AudioScenarios: CXProviderDelegate {
    func providerDidReset(_ provider: CXProvider) {
        AppState.shared.log(.scenarios, "audio", "callkit provider reset")
    }

    func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
        AppState.shared.log(.scenarios, "audio", "callkit endCall")
        currentCallUUID = nil
        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
        AppState.shared.log(.scenarios, "audio", "callkit answerCall")
        action.fulfill()
    }
}
