import Foundation
import WebKit

final class ConsoleBridge: NSObject, WKScriptMessageHandler {
    static let handlerName = "consoleBridge"

    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any] else { return }
        let level = body["level"] as? String ?? "log"
        let args = body["args"] as? [String] ?? []
        AppState.shared.log(.console, level, args.joined(separator: " "))
    }
}
