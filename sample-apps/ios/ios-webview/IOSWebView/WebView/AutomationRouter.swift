#if DEBUG
import AVFAudio
import Foundation
import WebKit

/// Debug-only `iowebview://` commands so a test run can drive the app from
/// the shell (`xcrun simctl openurl <udid> <url>` on the Simulator,
/// `xcrun devicectl device process launch --payload-url <url>` on a device):
///
/// - `iowebview://load?url=<percent-encoded URL>` loads a page.
/// - `iowebview://scenario?name=<id>` runs a scenario from `scenarios`.
/// - `iowebview://eval?js=<percent-encoded function body>` runs JS in the
///   page via `callAsyncJavaScript` (so `await` works; `return` a value to
///   log it) and logs the result to the Console tab. `simctl openurl` caps
///   URLs at about 2 KB, so longer scripts use
///   `iowebview://eval?src=<percent-encoded http URL>` instead.
struct AutomationRouter {
    let web: WebController
    let onLoad: (URL) -> Void

    func handle(_ url: URL) {
        guard url.scheme == "iowebview",
              let items = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems
        else { return }
        let query = Dictionary(items.map { ($0.name, $0.value ?? "") }, uniquingKeysWith: { _, last in last })
        switch url.host {
        case "load":
            guard let target = query["url"].flatMap(URL.init(string:)) else {
                AppState.shared.log(.errors, "automation", "load: missing or invalid url")
                return
            }
            onLoad(target)
            web.load(target)
        case "scenario":
            let name = query["name"] ?? ""
            guard let run = scenarios[name] else {
                AppState.shared.log(.errors, "automation",
                    "unknown scenario '\(name)'; known: \(scenarios.keys.sorted().joined(separator: ","))")
                return
            }
            AppState.shared.log(.scenarios, "automation", "scenario \(name)")
            run()
        case "eval":
            if let src = query["src"].flatMap(URL.init(string:)) {
                evaluate(contentsOf: src)
            } else {
                evaluate(query["js"] ?? "")
            }
        default:
            AppState.shared.log(.errors, "automation", "unknown command \(url.absoluteString)")
        }
    }

    private var scenarios: [String: () -> Void] {
        let audio = web.audioScenarios
        var all: [String: () -> Void] = [
            "restore": { audio.restoreForWebRTC() },
            "ding-mix": { audio.playDing(mixWithOthers: true) },
            "ding-exclusive": { audio.playDing(mixWithOthers: false) },
            "ding-auto-restore": { audio.playDingWithAutoRestore() },
            "ding-no-restore": { audio.playDingExclusiveNoRestore() },
            "ringtone-start": { audio.startRingtone() },
            "ringtone-stop": { audio.stopRingtone() },
            "notification": { audio.scheduleLocalNotification() },
            "dump": { audio.dumpSessionState() },
            "stale-offline": { web.networkScenarios.dispatchStaleOfflineEvent() },
        ]
        for entry in AudioScenarios.allCategories {
            all["category-\(entry.label.dropFirst())"] = { audio.setCategory(entry.category) }
        }
        for rate in AudioScenarios.sampleRates {
            all["sample-rate-\(Int(rate))"] = { audio.setPreferredSampleRate(rate) }
        }
        for duration in AudioScenarios.ioBufferDurations {
            all["io-buffer-\(Int(duration * 1000))"] = { audio.setPreferredIOBufferDuration(duration) }
        }
        return all
    }

    /// Fetches the script natively (no CORS, no URL length cap) and runs it
    /// like `evaluate(_:)`.
    private func evaluate(contentsOf src: URL) {
        URLSession.shared.dataTask(with: src) { data, _, error in
            guard let data, let js = String(data: data, encoding: .utf8) else {
                AppState.shared.log(.errors, "eval", "fetch \(src) failed: \(error.map { "\($0)" } ?? "no data")")
                return
            }
            DispatchQueue.main.async { evaluate(js) }
        }.resume()
    }

    private func evaluate(_ js: String) {
        web.webView.callAsyncJavaScript(js, arguments: [:], in: nil, in: .page) { result in
            switch result {
            case .success(let value):
                AppState.shared.log(.console, "eval", "→ \(value)")
            case .failure(let error):
                AppState.shared.log(.errors, "eval", "failed: \(error)")
            }
        }
    }
}
#endif
