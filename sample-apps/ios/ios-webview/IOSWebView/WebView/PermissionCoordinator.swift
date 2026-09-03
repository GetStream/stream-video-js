import WebKit

/// Grants camera/microphone permission to the embedded webview.
/// The webview needs `.grant` for `navigator.mediaDevices.getUserMedia` to
/// succeed without showing iOS's native permission prompt inside the webview.
final class PermissionCoordinator: NSObject, WKUIDelegate {
    @available(iOS 15.0, *)
    func webView(_ webView: WKWebView,
                 requestMediaCapturePermissionFor origin: WKSecurityOrigin,
                 initiatedByFrame frame: WKFrameInfo,
                 type: WKMediaCaptureType,
                 decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        let typeName: String
        switch type {
        case .camera: typeName = "camera"
        case .microphone: typeName = "microphone"
        case .cameraAndMicrophone: typeName = "camera+mic"
        @unknown default: typeName = "unknown"
        }
        AppState.shared.log(.scenarios, "perm", "grant \(typeName) to \(origin.host)")
        decisionHandler(.grant)
    }

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        AppState.shared.log(.console, "alert", message)
        completionHandler()
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        AppState.shared.log(.console, "confirm", message)
        completionHandler(true)
    }
}
