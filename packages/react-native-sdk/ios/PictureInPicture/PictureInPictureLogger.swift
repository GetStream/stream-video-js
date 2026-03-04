//
// Copyright © 2024 Stream.io Inc. All rights reserved.
//

import Foundation

/// Centralized logger for Picture in Picture diagnostics.
///
/// Logging is debug-only to avoid production noise and overhead.
enum PictureInPictureLogger {
    static func log(_ message: @autoclosure () -> String) {
        #if DEBUG
        NSLog("PiP - %@", message())
        #endif
    }
}
