import Foundation
import stream_react_native_webrtc

/// The only place in this package that may call `RTCAudioSession.lockForConfiguration()`.
///
/// `lockForConfiguration()` does `RTC_CHECK(!mutex_locked)` on a thread-local flag before taking its
/// non-reentrant mutex (webrtc `RTCAudioSession.mm:38`, :254-258): a locker on another thread waits,
/// but the same thread locking again crashes. So every lock goes through here: a thread-local depth
/// makes only the outermost entry lock/unlock the session, and the recursive lock keeps a compound
/// step (e.g. configure, then activate) together within this package.
///
/// Never call `AudioDeviceModule` APIs inside `body`: they hop to the WebRTC worker thread, where the
/// engine hooks wait for this lock (deadlock).
enum AudioSessionConfigLock {
    private static let lock = NSRecursiveLock()
    private static let depthKey = "io.getstream.rn.AudioSessionConfigLock.depth"

    static func run<T>(_ body: (RTCAudioSession) throws -> T) rethrows -> T {
        lock.lock()
        defer { lock.unlock() }

        let session = RTCAudioSession.sharedInstance()
        let threadDictionary = Thread.current.threadDictionary
        let depth = (threadDictionary[depthKey] as? Int) ?? 0
        if depth == 0 {
            session.lockForConfiguration()
        }
        threadDictionary[depthKey] = depth + 1
        defer {
            threadDictionary[depthKey] = depth
            if depth == 0 {
                session.unlockForConfiguration()
            }
        }
        return try body(session)
    }
}
