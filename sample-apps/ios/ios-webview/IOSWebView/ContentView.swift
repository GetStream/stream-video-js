import SwiftUI
import UIKit

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    @AppStorage("lastURL") private var urlText: String = ""
    @State private var debugExpanded: Bool = false
    @StateObject private var web = WebController()

    var body: some View {
        VStack(spacing: 0) {
            urlBar
            WebViewRepresentable(controller: web)
            DebugOverlay(isExpanded: $debugExpanded)
        }
        .navigationTitle("IOSWebView")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                ScenariosMenuView(audio: web.audioScenarios)
            }
        }
    }

    private var urlBar: some View {
        HStack(spacing: 8) {
            TextField("https://<slug>.trycloudflare.com", text: $urlText)
                .textFieldStyle(.roundedBorder)
                .keyboardType(.URL)
                .autocorrectionDisabled(true)
                .textInputAutocapitalization(.never)
                .submitLabel(.go)
                .onSubmit(loadURL)

            chromeButton(title: "Load", width: 64, action: loadURL)
            chromeButton(title: "↻", width: 44) { web.reload() }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
    }

    private func chromeButton(
        title: String,
        width: CGFloat,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(.white)
                .frame(width: width, height: 34)
                .background(Color.accentColor)
                .cornerRadius(8)
        }
        .buttonStyle(.plain)
    }

    private func loadURL() {
        var text = urlText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        if !text.contains("://") { text = "https://" + text }
        guard let url = URL(string: text) else {
            AppState.shared.log(.errors, "url", "invalid URL: \(text)")
            return
        }
        urlText = text
        UIApplication.shared.sendAction(
            #selector(UIResponder.resignFirstResponder),
            to: nil, from: nil, for: nil,
        )
        web.load(url)
    }
}

#if DEBUG
@available(iOS 17.0, *)
#Preview("ContentView") {
    NavigationView {
        ContentView()
            .environmentObject(AppState.shared)
    }
    .navigationViewStyle(.stack)
}
#endif
