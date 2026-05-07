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

        // This is important!!!!!
        wv.configureObservation()

        self.webView = wv
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

    static func loadScript(_ name: String) -> String? {
        if let url = Bundle.main.url(forResource: name, withExtension: "js",
                                     subdirectory: "WebScripts")
            ?? Bundle.main.url(forResource: name, withExtension: "js") {
            return try? String(contentsOf: url, encoding: .utf8)
        }
        return nil
    }
}

struct WebViewRepresentable: UIViewRepresentable {
    let controller: WebController

    func makeUIView(context: Context) -> WKWebView { controller.webView }
    func updateUIView(_ uiView: WKWebView, context: Context) {}
}
