import Foundation

/// Cross-package handoff guard. `CallingxImpl` flips `callingxOwnsSession`
/// to `true` at CX-action entry points (`CXStartCallAction.perform`,
/// `CXAnswerCallAction.perform`, re-asserted in `provider(_:didActivate:)`)
/// and back to `false` in `provider(_:didDeactivate:)` when no calls remain
/// (`UUIDStorage.count() == 0`) or on `providerDidReset`.
///
/// `StreamInCallManager` (in `@stream-io/video-react-native-sdk`) consults this
/// flag from its AudioDeviceModule publisher sink and no-ops when callingx owns
/// the session, so the two packages don't write conflicting `AVAudioSession`
/// configurations during the transient overlap when a CallKit call is winding
/// down and the SDK is about to take over (or vice versa).
///
/// Exposed as an `@objcMembers NSObject` with an `@objc class var` so that
/// react-native-sdk can read it via `NSClassFromString("Callingx.CallingxSessionOwnership")`
/// + KVC on the class object — `@stream-io/react-native-callingx` is an *optional*
/// peer dependency of react-native-sdk, so a direct `import Callingx` is not safe.
@objcMembers
public class CallingxSessionOwnership: NSObject {

    private static let lock = NSLock()
    private static var _callingxOwnsSession: Bool = false

    @objc public class var callingxOwnsSession: Bool {
        get {
            lock.lock()
            defer { lock.unlock() }
            return _callingxOwnsSession
        }
        set {
            lock.lock()
            defer { lock.unlock() }
            _callingxOwnsSession = newValue
        }
    }
}
