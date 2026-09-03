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
        let routeOut = s.currentRoute.outputs.map(\.portName).joined(separator: ", ")
        let routeIn = s.currentRoute.inputs.map(\.portName).joined(separator: ", ")
        let active = appState.audioSessionActive

        Section("Audio session") {
            Text("\(cat)/\(mode) · \(active ? "active" : "inactive") · \(routeIn) → \(routeOut)")
        }
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
    }
}
