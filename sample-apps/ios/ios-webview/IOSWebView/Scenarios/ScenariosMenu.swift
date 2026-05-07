import AVFAudio
import SwiftUI

/// SwiftUI replacement for the UIKit `UIMenu`-based scenarios menu. Bridges
/// nav-bar taps into `AudioScenarios`. The live-state rows reactively
/// re-render when `AppState.audioSessionActive` flips or
/// `AVAudioSession.routeChangeNotification` fires (tracked via
/// `audioRouteVersion`).
struct ScenariosMenuView: View {
    let audio: AudioScenarios
    @EnvironmentObject private var appState: AppState

    var body: some View {
        Menu {
            liveStateSection
            Divider()
            recoverySection
            Divider()
            categorySwitcher
            Divider()
            soundsSection
            Divider()
            callKitSection
            diagnosticsSubmenu
            dangerousSubmenu
        } label: {
            Text("Scenarios")
        }
    }

    // MARK: Sections

    @ViewBuilder
    private var liveStateSection: some View {
        let s = AVAudioSession.sharedInstance()
        let cat = s.category.rawValue
            .replacingOccurrences(of: "AVAudioSessionCategory", with: "")
        let mode = s.mode.rawValue
            .replacingOccurrences(of: "AVAudioSessionMode", with: "")
        let opts = describeOptions(s.categoryOptions)
        let routeOut = s.currentRoute.outputs.map(\.portName).joined(separator: ",")
        let routeIn = s.currentRoute.inputs.map(\.portName).joined(separator: ",")
        let active = appState.audioSessionActive

        // Disabled buttons render as non-interactive info rows, mirroring the
        // UIKit menu's `attributes: .disabled` actions.
        Button("📊 \(cat) / \(mode)") {}.disabled(true)
        Button("  active=\(active ? "true" : "false/unknown")  opts=\(opts)") {}
            .disabled(true)
        Button("  route in=[\(routeIn)] out=[\(routeOut)]") {}.disabled(true)
    }

    @ViewBuilder
    private var recoverySection: some View {
        Button("Restore audio (native)") { audio.restoreForWebRTC() }
    }

    private var categorySwitcher: some View {
        Menu("🎛 Set category") {
            ForEach(AudioScenarios.allCategories, id: \.label) { entry in
                Button(entry.label) { audio.setCategory(entry.category) }
            }
        }
    }

    @ViewBuilder
    private var soundsSection: some View {
        Button("Play ding (mix)") { audio.playDing(mixWithOthers: true) }
        Button("Play ding (exclusive)") { audio.playDing(mixWithOthers: false) }
        Button("Play ding (exclusive, auto-restore)") { audio.playDingWithAutoRestore() }
        Button("Play ding (exclusive, NO restore)") { audio.playDingExclusiveNoRestore() }
        Button("Start ringtone") { audio.playRingtone() }
        Button("Stop ringtone") { audio.stopRingtone() }
        Button("Local notification") { audio.fireNotificationSound() }
    }

    @ViewBuilder
    private var callKitSection: some View {
        Button("CallKit incoming") { audio.simulateCallKitIncoming() }
        Button("End CallKit call") { audio.endCallKitCall() }
        Button("Sim phone call (auto-end 5s)") {
            audio.simulatePhoneCallInterruption(holdSeconds: 5)
        }
        Button("Sim phone call (auto-end 15s)") {
            audio.simulatePhoneCallInterruption(holdSeconds: 15)
        }
        Button("Toggle route") { audio.toggleRoute() }
    }

    private var diagnosticsSubmenu: some View {
        Menu("🔍 Diagnostics") {
            Button("Dump session state") { audio.dumpSessionState(label: "manual") }
            Button("Start mic meter") { audio.startMicMeter() }
            Button("Stop mic meter") { audio.stopMicMeter() }
            Button("Record + play 3s") { audio.recordAndPlayback(seconds: 3) }
        }
    }

    private var dangerousSubmenu: some View {
        Menu("🔊 Dangerous") {
            Button(role: .destructive) { audio.forcePlaybackCategory() } label: {
                Text("Force .playback")
            }
            Button(role: .destructive) { audio.forceDefaultMode() } label: {
                Text("Force mode=.default")
            }
            Button(role: .destructive) { audio.silentDeactivation() } label: {
                Text("setActive(false)")
            }
            Divider()
            Button(role: .destructive) { audio.startTone(frequency: 440) } label: {
                Text("Start 440 Hz tone")
            }
            Button("Stop tone") { audio.stopTone() }
        }
    }

    // MARK: Helpers

    private func describeOptions(_ opts: AVAudioSession.CategoryOptions) -> String {
        var parts: [String] = []
        if opts.contains(.mixWithOthers) { parts.append("mix") }
        if opts.contains(.duckOthers) { parts.append("duck") }
        if opts.contains(.allowBluetooth) { parts.append("bt") }
        if opts.contains(.allowBluetoothA2DP) { parts.append("btA2DP") }
        if opts.contains(.allowAirPlay) { parts.append("airplay") }
        if opts.contains(.defaultToSpeaker) { parts.append("speaker") }
        return parts.isEmpty ? "none" : parts.joined(separator: "|")
    }
}
