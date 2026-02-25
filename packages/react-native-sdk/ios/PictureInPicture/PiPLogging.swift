//
// Copyright © 2024 Stream.io Inc. All rights reserved.
//

import Foundation

#if DEBUG
/// Logs PiP debug messages with a consistent prefix.
@inline(__always) func pipLog(_ message: String) {
    NSLog("PiP - \(message)")
}
#else
/// No-op in release builds to avoid log noise.
@inline(__always) func pipLog(_ message: String) {}
#endif
