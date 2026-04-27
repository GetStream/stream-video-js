import Combine
import UIKit
import WebKit

/// Owns the WKWebView + its configuration, delegates, and injected scripts.
final class WebViewContainer: UIView {
    private(set) var webView: WKWebView!
    let permissionCoordinator = PermissionCoordinator()
    let navigationInterceptor = NavigationInterceptor()
    let consoleBridge = ConsoleBridge()
    let errorBridge = ErrorBridge()
    private var audioSessionBridge: AudioSessionBridge?
    private var audioSessionBridgeCancellable: AnyCancellable?

    override init(frame: CGRect) {
        super.init(frame: frame)
        build()
    }

    required init?(coder: NSCoder) { fatalError() }

    deinit { audioSessionBridge?.stop() }

    private func build() {
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

        let wv = WKWebView(frame: bounds, configuration: config)
        wv.translatesAutoresizingMaskIntoConstraints = false
        wv.allowsBackForwardNavigationGestures = true
        wv.uiDelegate = permissionCoordinator
        wv.navigationDelegate = navigationInterceptor
        if #available(iOS 16.4, *) { wv.isInspectable = true }
        self.webView = wv
        addSubview(wv)
        NSLayoutConstraint.activate([
            wv.topAnchor.constraint(equalTo: topAnchor),
            wv.bottomAnchor.constraint(equalTo: bottomAnchor),
            wv.leadingAnchor.constraint(equalTo: leadingAnchor),
            wv.trailingAnchor.constraint(equalTo: trailingAnchor),
        ])

        // Start pushing native AVAudioSession state into the page so the
        // SDK's AudioHealthMonitor sees ground-truth interruptions. Also
        // mirror each snapshot into the Lifecycle tab for correlation.
        let bridge = AudioSessionBridge(webView: wv)
        audioSessionBridgeCancellable = bridge.snapshotPublisher
            .receive(on: DispatchQueue.main)
            .sink { snapshot in
                AppState.shared.log(.lifecycle, "bridge", Self.format(snapshot))
            }
        bridge.start()
        self.audioSessionBridge = bridge
    }

    private static func format(_ snapshot: AudioSessionBridge.Snapshot) -> String {
        var parts: [String] = [
            "category=\(snapshot.state.category)",
            "mode=\(snapshot.state.mode)",
            "options=\(snapshot.state.categoryOptions)",
        ]
        if let interruption = snapshot.state.interruption {
            if let reason = interruption.reason {
                parts.append("interruption=\(interruption.type)(reason=\(reason))")
            } else {
                parts.append("interruption=\(interruption.type)")
            }
        }
        if let reason = snapshot.state.routeChangeReason {
            parts.append("routeChangeReason=\(reason)")
        }
        return parts.joined(separator: " ")
    }

    static func loadScript(_ name: String) -> String? {
        // First try the subdirectory (preserved via XcodeGen "path" resource)
        if let url = Bundle.main.url(forResource: name, withExtension: "js",
                                     subdirectory: "WebScripts") ?? Bundle.main.url(
                                        forResource: name, withExtension: "js") {
            return try? String(contentsOf: url, encoding: .utf8)
        }
        return nil
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
}
