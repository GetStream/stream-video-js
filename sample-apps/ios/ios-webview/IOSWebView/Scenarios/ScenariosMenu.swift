import AVFAudio
import UIKit

/// Builds the audio-scenarios `UIMenu` presented by the nav bar's Scenarios
/// button. Keeps menu construction out of ViewController.
struct ScenariosMenu {
    let audio: AudioScenarios

    func build() -> UIMenu {
        let liveState = UIMenu(title: "", options: .displayInline, children: [
            UIDeferredMenuElement.uncached { completion in
                completion(Self.audioSessionStateRows())
            },
        ])
        let recovery = UIMenu(title: "", options: .displayInline, children: [
            UIAction(title: "Restore audio (native)") { _ in audio.restoreForWebRTC() },
            UIAction(title: "Restore audio (JS-only)") { _ in audio.attemptJSRecovery() },
        ])
        // Generic category switcher: any AVAudioSession.Category + .default
        // mode + no options. For hostile single-knob changes, use the
        // "Dangerous" submenu below.
        let categoryChildren: [UIMenuElement] = AudioScenarios.allCategories.map { entry in
            UIAction(title: entry.label) { _ in audio.setCategory(entry.category) }
        }
        let categorySwitcher = UIMenu(
            title: "🎛 Set category",
            subtitle: "mode=.default, options=[]",
            children: categoryChildren,
        )
        let sounds = UIMenu(title: "", options: .displayInline, children: [
            UIAction(title: "Play ding (mix)") { _ in audio.playDing(mixWithOthers: true) },
            UIAction(title: "Play ding (exclusive)") { _ in audio.playDing(mixWithOthers: false) },
            UIAction(title: "Start ringtone") { _ in audio.playRingtone() },
            UIAction(title: "Stop ringtone") { _ in audio.stopRingtone() },
            UIAction(title: "Local notification") { _ in audio.fireNotificationSound() },
        ])
        let callKit = UIMenu(title: "", options: .displayInline, children: [
            UIAction(title: "CallKit incoming") { _ in audio.simulateCallKitIncoming() },
            UIAction(title: "End CallKit call") { _ in audio.endCallKitCall() },
            UIAction(title: "Toggle route") { _ in audio.toggleRoute() },
        ])
        let diagnostics = UIMenu(title: "🔍 Diagnostics", children: [
            UIAction(title: "Dump session state") { _ in audio.dumpSessionState(label: "manual") },
            UIAction(title: "Start mic meter") { _ in audio.startMicMeter() },
            UIAction(title: "Stop mic meter") { _ in audio.stopMicMeter() },
            UIAction(title: "Record + play 3s") { _ in audio.recordAndPlayback(seconds: 3) },
        ])
        let dangerous = UIMenu(title: "🔊 Dangerous", children: [
            UIMenu(title: "", options: .displayInline, children: [
                UIAction(title: "Force .playback", attributes: .destructive) { _ in audio.forcePlaybackCategory() },
                UIAction(title: "Force mode=.default", attributes: .destructive) { _ in audio.forceDefaultMode() },
                UIAction(title: "setActive(false)", attributes: .destructive) { _ in audio.silentDeactivation() },
            ]),
            UIMenu(title: "", options: .displayInline, children: [
                UIAction(title: "Start 440 Hz tone", attributes: .destructive) { _ in audio.startTone(frequency: 440) },
                UIAction(title: "Stop tone") { _ in audio.stopTone() },
            ]),
        ])
        return UIMenu(
            title: "🔊 Audio & session",
            children: [
                liveState,
                recovery,
                UIMenu(title: "", options: .displayInline, children: [categorySwitcher]),
                sounds,
                callKit,
                diagnostics,
                dangerous,
            ],
        )
    }

    // MARK: Live audio-session state rows (re-read on every menu open)

    static func audioSessionStateRows() -> [UIMenuElement] {
        let s = AVAudioSession.sharedInstance()
        let cat = s.category.rawValue
            .replacingOccurrences(of: "AVAudioSessionCategory", with: "")
        let mode = s.mode.rawValue
            .replacingOccurrences(of: "AVAudioSessionMode", with: "")
        let opts: String = {
            var parts: [String] = []
            let o = s.categoryOptions
            if o.contains(.mixWithOthers) { parts.append("mix") }
            if o.contains(.duckOthers) { parts.append("duck") }
            if o.contains(.allowBluetooth) { parts.append("bt") }
            if o.contains(.allowBluetoothA2DP) { parts.append("btA2DP") }
            if o.contains(.allowAirPlay) { parts.append("airplay") }
            if o.contains(.defaultToSpeaker) { parts.append("speaker") }
            return parts.isEmpty ? "none" : parts.joined(separator: "|")
        }()
        let routeOut = s.currentRoute.outputs.map(\.portName).joined(separator: ",")
        let routeIn = s.currentRoute.inputs.map(\.portName).joined(separator: ",")
        let active = AppState.shared.audioSessionActive
        // Disabled UIActions render as non-interactive rows — good for inline status.
        return [
            UIAction(title: "📊 \(cat) / \(mode)",
                     attributes: .disabled, handler: { _ in }),
            UIAction(title: "  active=\(active ? "true" : "false/unknown")  opts=\(opts)",
                     attributes: .disabled, handler: { _ in }),
            UIAction(title: "  route in=[\(routeIn)] out=[\(routeOut)]",
                     attributes: .disabled, handler: { _ in }),
        ]
    }
}
