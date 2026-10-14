import Foundation

/// Cross-package handoff guard. `CallingxImpl` flips `callingxOwnsSession`
/// to `true` at conversation-action entry points (`StartConversationAction`,
/// `JoinConversationAction`, re-asserted in `conversationManager(_:didActivate:)`)
/// and back to `false` in `conversationManager(_:didDeactivate:)` when no calls remain
/// (`UUIDStorage.count() == 0`) or on `conversationManagerDidReset`.
///
/// `StreamInCallManager` (in `@stream-io/video-react-native-sdk`) consults this
/// flag from its AudioDeviceModule publisher sink and no-ops when callingx owns
/// the session, so the two packages don't write conflicting `AVAudioSession`
/// configurations during the transient overlap when a system (CallKit/LiveCommunicationKit) call is winding
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
