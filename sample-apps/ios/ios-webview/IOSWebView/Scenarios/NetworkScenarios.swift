import WebKit

/// Network scenarios: dispatch browser network events into the page while the
/// real network keeps working, to exercise how the SDK reacts to them.
final class NetworkScenarios {
    private weak var webView: WKWebView?

    init(webView: WKWebView) {
        self.webView = webView
    }

    /// Dispatches `online`, then `offline` 0.5 s later, on a working network:
    /// the order a page can receive when it resumes from a frozen state. The
    /// call should stay joined, or be back within about 2 s, without a
    /// reconnect storm.
    func dispatchStaleOfflineEvent() {
        AppState.shared.log(.scenarios, "network",
            "stale offline event: online, then offline 0.5s later")
        dispatch("online")
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
            self?.dispatch("offline")
        }
    }

    private func dispatch(_ type: String) {
        guard let webView else {
            AppState.shared.log(.errors, "network", "no web view to dispatch '\(type)'")
            return
        }
        AppState.shared.log(.scenarios, "network", "dispatch window '\(type)'")
        webView.evaluateJavaScript("window.dispatchEvent(new Event('\(type)'))") { _, error in
            if let error {
                AppState.shared.log(.errors, "network", "dispatch '\(type)' failed: \(error)")
            }
        }
    }
}
