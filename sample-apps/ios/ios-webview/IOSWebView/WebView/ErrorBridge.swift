import Foundation
import WebKit

final class ErrorBridge: NSObject, WKScriptMessageHandler {
    static let handlerName = "errorBridge"

    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any] else { return }
        let kind = body["kind"] as? String ?? "error"
        let msg = body["message"] as? String ?? ""
        let source = body["source"] as? String ?? ""
        let stack = body["stack"] as? String ?? ""
        let line = [kind.uppercased(), msg, source.isEmpty ? nil : "@\(source)",
                    stack.isEmpty ? nil : "\n\(stack)"]
            .compactMap { $0 }.joined(separator: " ")
        AppState.shared.log(.errors, kind, line)
    }
}
