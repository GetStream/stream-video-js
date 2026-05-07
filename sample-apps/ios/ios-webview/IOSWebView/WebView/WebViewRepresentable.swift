import Combine
import SwiftUI
import WebKit

/// Owns the `WKWebView` and the bridges that wire it into `AppState`. Held by
/// `ContentView` as a `@StateObject` so the same `WKWebView` instance survives
/// SwiftUI body re-evaluations.
final class WebController: ObservableObject {
    let webView: WKWebView
    let permissionCoordinator = PermissionCoordinator()
    let navigationInterceptor = NavigationInterceptor()
    let consoleBridge = ConsoleBridge()
    let errorBridge = ErrorBridge()

    private var audioSessionBridge: AudioSessionBridge?
    private var audioSessionBridgeCancellable: AnyCancellable?
    private var lifecycleBridge: LifecycleBridge?
    private var lifecycleBridgeCancellable: AnyCancellable?

    lazy var audioScenarios: AudioScenarios = AudioScenarios()

    init() {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

        let controller = WKUserContentController()
        controller.add(consoleBridge, name: ConsoleBridge.handlerName)
        controller.add(errorBridge, name: ErrorBridge.handlerName)

        for name in ["console-mirror", "error-capture"] {
            if let source = Self.loadScript(name) {
                let script = WKUserScript(source: source,
                                          injectionTime: .atDocumentStart,
                                          forMainFrameOnly: false)
                controller.addUserScript(script)
            } else {
                AppState.shared.log(.errors, "webview", "missing WebScripts/\(name).js resource")
            }
        }
        config.userContentController = controller

        let wv = WKWebView(frame: .zero, configuration: config)
        wv.allowsBackForwardNavigationGestures = true
        wv.uiDelegate = permissionCoordinator
        wv.navigationDelegate = navigationInterceptor
        if #available(iOS 16.4, *) { wv.isInspectable = true }
        self.webView = wv

        // Native AVAudioSession ground truth → page (consumed by the SDK's
        // AudioHealthMonitor) and into the Lifecycle tab for correlation.
        let bridge = AudioSessionBridge(webView: wv)
        audioSessionBridgeCancellable = bridge.snapshotPublisher
            .receive(on: DispatchQueue.main)
            .sink { snapshot in
                AppState.shared.log(.lifecycle, "bridge", Self.format(snapshot))
            }
        bridge.onDiagnostic = { line in
            DispatchQueue.main.async {
                AppState.shared.log(.lifecycle, "bridge", line)
            }
        }
        bridge.start()
        self.audioSessionBridge = bridge

        // UIApplication lifecycle transitions → page, so the SDK can correlate
        // "user came back to the app" with any pending audio recovery.
        let lifecycle = LifecycleBridge(webView: wv)
        lifecycleBridgeCancellable = lifecycle.snapshotPublisher
            .receive(on: DispatchQueue.main)
            .sink { snapshot in
                AppState.shared.log(.lifecycle, "lifecycle",
                    "transition=\(snapshot.state.transition)")
            }
        lifecycle.start()
        self.lifecycleBridge = lifecycle
    }

    deinit {
        audioSessionBridge?.stop()
        lifecycleBridge?.stop()
    }

    func load(_ url: URL) {
        webView.load(URLRequest(url: url))
        AppState.shared.log(.scenarios, "webview", "load \(url.absoluteString)")
    }

    func reload() {
        webView.reload()
        AppState.shared.log(.scenarios, "webview", "reload")
    }

    @discardableResult
    func eval(_ script: String, label: String? = nil,
              completion: ((Any?, Error?) -> Void)? = nil) -> Bool {
        webView.evaluateJavaScript(script) { result, error in
            if let label {
                if let error {
                    AppState.shared.log(.errors, "eval", "\(label) error: \(error.localizedDescription)")
                } else if let result {
                    AppState.shared.log(.console, "eval", "\(label) → \(result)")
                }
            }
            completion?(result, error)
        }
        return true
    }

    static func loadScript(_ name: String) -> String? {
        if let url = Bundle.main.url(forResource: name, withExtension: "js",
                                     subdirectory: "WebScripts")
            ?? Bundle.main.url(forResource: name, withExtension: "js") {
            return try? String(contentsOf: url, encoding: .utf8)
        }
        return nil
    }

    private static func format(_ snapshot: AudioSessionBridge.Snapshot) -> String {
        let optionsList = snapshot.session.options.isEmpty
            ? "[]"
            : "[\(snapshot.session.options.joined(separator: "|"))]"
        var parts: [String] = [
            "category=\(snapshot.session.category)",
            "mode=\(snapshot.session.mode)",
            "options=\(optionsList)",
        ]
        if let route = snapshot.route {
            parts.append("in=\(formatPorts(route.inputs))")
            parts.append("out=\(formatPorts(route.outputs))")
        }
        if let interruption = snapshot.interruption {
            if let reason = interruption.reason {
                parts.append("interruption=\(interruption.type)(reason=\(reason))")
            } else {
                parts.append("interruption=\(interruption.type)")
            }
        }
        if let routeChange = snapshot.routeChange {
            parts.append("routeChange=\(routeChange.reason)")
        }
        return parts.joined(separator: " ")
    }

    private static func formatPorts(_ ports: [AudioSessionBridge.Snapshot.Route.Port]) -> String {
        if ports.isEmpty { return "[]" }
        return "[" + ports.map { "\($0.type)[\($0.name)]" }.joined(separator: "|") + "]"
    }
}

struct WebViewRepresentable: UIViewRepresentable {
    let controller: WebController

    func makeUIView(context: Context) -> WKWebView { controller.webView }
    func updateUIView(_ uiView: WKWebView, context: Context) {}
}
