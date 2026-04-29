import SwiftUI
import UIKit

/// SwiftUI replacement for the UIKit `DebugOverlayView`. A collapsible bottom
/// panel with tabbed log views (Console / Errors / Lifecycle), backed by
/// `AppState.entries`.
struct DebugOverlay: View {
    @Binding var isExpanded: Bool
    @EnvironmentObject var appState: AppState
    @State private var selectedTab: LogTab = .console

    private let collapsedHeight: CGFloat = 40
    private let expandedHeight: CGFloat = 260

    var body: some View {
        VStack(spacing: 0) {
            header
            if isExpanded { logScroll }
        }
        .frame(height: isExpanded ? expandedHeight : collapsedHeight)
        .frame(maxWidth: .infinity)
        .background(Color.black.opacity(0.85))
        .clipShape(RoundedTopCorners(radius: 12))
    }

    private var header: some View {
        HStack(spacing: 8) {
            Button {
                withAnimation(.easeInOut(duration: 0.2)) { isExpanded.toggle() }
            } label: {
                Text(isExpanded ? "▼ Debug" : "▲ Debug")
                    .font(.system(size: 13, weight: .medium, design: .monospaced))
                    .foregroundColor(.white)
            }

            Picker("Tab", selection: $selectedTab) {
                Text("Console").tag(LogTab.console)
                Text("Errors").tag(LogTab.errors)
                Text("Lifecycle").tag(LogTab.lifecycle)
            }
            .pickerStyle(.segmented)
            .frame(maxWidth: .infinity)

            Button("Clear") { appState.clear(tab: selectedTab) }
                .font(.system(size: 13))
                .foregroundColor(.white)
        }
        .padding(.horizontal, 12)
        .frame(height: collapsedHeight)
    }

    private var logScroll: some View {
        let visible = appState.entries.filter { $0.tab == selectedTab }
        return ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 2) {
                    ForEach(visible) { entry in
                        Text(Self.format(entry))
                            .font(.system(size: 11, design: .monospaced))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .id(entry.id)
                    }
                }
                .padding(.horizontal, 8)
                .padding(.bottom, 8)
            }
            .onChange(of: visible.count) { _ in
                if let last = visible.last {
                    proxy.scrollTo(last.id, anchor: .bottom)
                }
            }
            .onAppear {
                if let last = visible.last {
                    proxy.scrollTo(last.id, anchor: .bottom)
                }
            }
        }
    }

    private static let timeFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "HH:mm:ss.SSS"
        return f
    }()

    private static func format(_ entry: LogEntry) -> String {
        "[\(timeFormatter.string(from: entry.timestamp))] \(entry.level): \(entry.message)"
    }
}

private struct RoundedTopCorners: Shape {
    let radius: CGFloat
    func path(in rect: CGRect) -> Path {
        Path(UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: [.topLeft, .topRight],
            cornerRadii: CGSize(width: radius, height: radius),
        ).cgPath)
    }
}

#if DEBUG
@available(iOS 17.0, *)
#Preview("DebugOverlay") {
    let state = AppState.shared
    state.log(.console, "info", "[tutorial] joining call from ?call_id=regression-repro-42")
    state.log(.console, "log", "[tutorial] audioHealth → healthy audio-session-active")
    state.log(.errors, "gUM.failure", "NotAllowedError: Permission denied")
    state.log(.lifecycle, "app", "UIApplicationDidEnterBackground")
    state.log(.lifecycle, "audio",
              "routeChange reason=newDeviceAvailable prev=[Speaker] → new=[Headphones]")

    return VStack {
        Spacer()
        StatefulPreviewWrapper(true) { binding in
            DebugOverlay(isExpanded: binding)
                .environmentObject(state)
        }
    }
    .background(Color(.systemBackground))
}

@available(iOS 17.0, *)
private struct StatefulPreviewWrapper<Value, Content: View>: View {
    @State private var value: Value
    let content: (Binding<Value>) -> Content

    init(_ value: Value, content: @escaping (Binding<Value>) -> Content) {
        _value = State(initialValue: value)
        self.content = content
    }

    var body: some View { content($value) }
}
#endif
