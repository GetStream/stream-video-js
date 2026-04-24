import UIKit
import WebKit

/// Owns the WKWebView + its configuration, delegates, and injected scripts.
final class WebViewContainer: UIView {
    private(set) var webView: WKWebView!
    let permissionCoordinator = PermissionCoordinator()
    let navigationInterceptor = NavigationInterceptor()
    let consoleBridge = ConsoleBridge()
    let errorBridge = ErrorBridge()

    override init(frame: CGRect) {
        super.init(frame: frame)
        build()
    }

    required init?(coder: NSCoder) { fatalError() }

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
