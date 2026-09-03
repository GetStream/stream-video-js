import Foundation
import os

/// Unified-logging namespace for the Callingx package.
///
/// Replaces the previous `NSLog` usage. Each category maps to one of the
/// `[Tag]` prefixes that used to be hand-built into the log strings, so logs
/// can be filtered by subsystem/category in Console.app or `log stream`:
///
///     log stream --predicate 'subsystem == "io.getstream.callingx"' --level debug
///
/// The subsystem matches the queue-label convention already used across this
/// package (e.g. `io.getstream.callingx.pendingActions`).
enum CallingxLog {
    private static let subsystem = "io.getstream.callingx"

    static let core = Logger(subsystem: subsystem, category: "Callingx")
    static let uuid = Logger(subsystem: subsystem, category: "UUIDStorage")
    static let voip = Logger(subsystem: subsystem, category: "VoipNotifications")
    static let push = Logger(subsystem: subsystem, category: "VoipPush")
    static let settings = Logger(subsystem: subsystem, category: "Settings")
    static let audio = Logger(subsystem: subsystem, category: "AudioSession")
    static let js = Logger(subsystem: subsystem, category: "JS")
}

extension Logger {
    /// Logs a pre-built message at `.debug`, marking the whole string public so
    /// values stay readable when streaming logs (incl. release/TestFlight).
    /// `@autoclosure` keeps construction lazy: when the log is not being
    /// collected the string is never built.
    func debugPublic(_ message: @autoclosure @escaping () -> String) {
        debug("\(message(), privacy: .public)")
    }

    /// Public-message variant at `.error` (persisted by default in the unified log).
    func errorPublic(_ message: @autoclosure @escaping () -> String) {
        error("\(message(), privacy: .public)")
    }
}

/// Objective-C bridge so `Callingx.mm` and `VoipPushHandler.m` log through the
/// same `os.Logger` path. `Logger`'s interpolation API is Swift-only, hence the
/// thin `@objc` wrapper.
@objc public final class CallingxLogBridge: NSObject {
    @objc public static func pushDebug(_ message: String) {
        CallingxLog.push.debugPublic(message)
    }

    @objc public static func pushError(_ message: String) {
        CallingxLog.push.errorPublic(message)
    }

    /// Routes JS-originated logs (from the `log(message, level)` TurboModule
    /// method) to the matching os.Logger severity.
    @objc public static func js(_ message: String, level: String) {
        switch level {
        case "error":
            CallingxLog.js.error("\(message, privacy: .public)")
        case "warn":
            CallingxLog.js.warning("\(message, privacy: .public)")
        case "info":
            CallingxLog.js.info("\(message, privacy: .public)")
        default:
            CallingxLog.js.debug("\(message, privacy: .public)")
        }
    }
}
