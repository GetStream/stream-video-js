import Foundation
import stream_react_native_webrtc

/// The only place in this package that may call `RTCAudioSession.lockForConfiguration()`.
///
/// `lockForConfiguration()` does `RTC_CHECK(!mutex_locked)` before taking its mutex, so a second
/// locker crashes instead of waiting, both on the same thread (re-entry) and on another thread while
/// the lock is held. The engine willEnable hook runs on the WebRTC worker thread while the system call
/// callbacks run on their own queues, so every lock goes through here: a process-wide recursive lock
/// serializes the threads, and a thread-local depth makes only the outermost entry lock/unlock the
/// session.
///
/// Never call `AudioDeviceModule` APIs inside `body`: they hop to the WebRTC worker thread, where the
/// engine hooks wait for this lock (deadlock).
enum AudioSessionConfigLock {
    private static let lock = NSRecursiveLock()
    private static let depthKey = "io.getstream.callingx.AudioSessionConfigLock.depth"

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
