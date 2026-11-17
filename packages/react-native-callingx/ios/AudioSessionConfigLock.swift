import stream_react_native_webrtc

/// The only place in this package that may call `RTCAudioSession.lockForConfiguration()`. Same
/// shape as stream-video-swift's `RTCAudioSession.perform` (lock, body, unlock).
///
/// The lock is required: `RTCAudioSession` refuses `setConfiguration` / `setActive` / route
/// overrides from a thread that doesn't hold it. A locker on another thread waits, so the whole
/// `body` (e.g. configure, then activate) runs as one step.
///
/// - Never nest: `lockForConfiguration()` does `RTC_CHECK(!mutex_locked)` on a thread-local flag
///   (webrtc `RTCAudioSession.mm:38`, :254-258), so locking again on the same thread crashes. Don't
///   call anything from `body` that locks again.
/// - Never call `AudioDeviceModule` APIs inside `body`: they hop to the WebRTC worker thread, where
///   the engine hooks wait for this lock (deadlock).
enum AudioSessionConfigLock {
    static func run<T>(_ body: (RTCAudioSession) throws -> T) rethrows -> T {
        let session = RTCAudioSession.sharedInstance()
        session.lockForConfiguration()
        defer { session.unlockForConfiguration() }
        return try body(session)
    }
}
