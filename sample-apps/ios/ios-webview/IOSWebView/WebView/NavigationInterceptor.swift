import WebKit

final class NavigationInterceptor: NSObject, WKNavigationDelegate {
    var blocklist: [NSRegularExpression] = []
    var captivePortalEnabled: Bool = false
    private(set) var captivePortalShown = false
    /// If true, the webview is reloaded automatically when the web-content
    /// process terminates (e.g. after an audio-unit crash). Off by default so
    /// that a crash is visible as a blank page and not silently papered over.
    var autoReloadOnWebContentCrash: Bool = false
    private(set) var webContentTerminationCount = 0

    func webView(_ webView: WKWebView,
                 decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.allow); return
        }
        let urlStr = url.absoluteString

        // Captive portal simulation: redirect the first non-data nav to a local HTML
        if captivePortalEnabled && !captivePortalShown,
           !url.scheme.isNilOrEmpty, url.scheme != "data", url.scheme != "about" {
            captivePortalShown = true
            AppState.shared.log(.scenarios, "net", "captive portal intercepts \(urlStr)")
            let html = captivePortalHTML(originalURL: urlStr)
            webView.loadHTMLString(html, baseURL: nil)
            decisionHandler(.cancel)
            return
        }

        // Blocklist
        for re in blocklist {
            let range = NSRange(location: 0, length: urlStr.utf16.count)
            if re.firstMatch(in: urlStr, options: [], range: range) != nil {
                AppState.shared.log(.scenarios, "net", "BLOCKED \(urlStr) (pattern: \(re.pattern))")
                decisionHandler(.cancel)
                return
            }
        }
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        AppState.shared.log(.errors, "nav", "provisional fail: \(error.localizedDescription)")
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        AppState.shared.log(.errors, "nav", "nav fail: \(error.localizedDescription)")
    }

    /// Called when the web-content process dies (OOM, sandbox violation,
    /// audio-unit crash, etc.). If this fires right after an audio-session
    /// scenario, the scenario crashed WebKit — that is the bug we want to see.
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        webContentTerminationCount += 1
        AppState.shared.log(.errors, "webkit",
            "⚠️  web-content process terminated (#\(webContentTerminationCount)) — last URL: \(webView.url?.absoluteString ?? "-")")
        if autoReloadOnWebContentCrash {
            AppState.shared.log(.scenarios, "webkit", "auto-reloading after crash")
            webView.reload()
        }
    }

    private func captivePortalHTML(originalURL: String) -> String {
        """
        <!doctype html><html><head><meta name=viewport content="width=device-width">
        <style>
          body{font:-apple-system-body;padding:24px;background:#111;color:#eee}
          h1{font-size:22px}
          a.btn{display:inline-block;margin-top:16px;padding:12px 20px;background:#2a8cff;color:#fff;text-decoration:none;border-radius:8px}
          code{background:#222;padding:2px 6px;border-radius:4px;font-size:12px}
        </style></head><body>
        <h1>Simulated Captive Portal</h1>
        <p>To reach the Internet you must accept these fake terms.</p>
        <p>Original destination: <code>\(originalURL)</code></p>
        <a class=btn href="\(originalURL)">Accept &amp; continue</a>
        </body></html>
        """
    }
}

private extension Optional where Wrapped == String {
    var isNilOrEmpty: Bool { self?.isEmpty ?? true }
}
