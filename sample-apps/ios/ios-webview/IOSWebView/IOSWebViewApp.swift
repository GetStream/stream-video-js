import SwiftUI
import UIKit

@main
struct IOSWebViewApp: App {
    @StateObject private var appState = AppState.shared

    init() {
        UIDevice.current.isBatteryMonitoringEnabled = true
    }

    var body: some Scene {
        WindowGroup {
            NavigationView {
                ContentView()
                    .environmentObject(appState)
            }
            .navigationViewStyle(.stack)
        }
    }
}
