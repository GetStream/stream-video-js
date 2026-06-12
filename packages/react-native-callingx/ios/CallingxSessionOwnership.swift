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

    /// The audio output device the user picked during an active CallKit call —
    /// `"speaker"`, an input port `uid`, or `nil` to use the default. `StreamInCallManager`
    /// (in `@stream-io/video-react-native-sdk`) writes this via KVC on the class object
    /// (`setValue(_:forKey:"requestedOutputDeviceId")`), symmetric with how it reads
    /// `callingxOwnsSession`. The SDK performs the live switch itself; this tells callingx
    /// (which owns the session under CallKit) what to re-apply on its next engine re-enable,
    /// so a rebuild doesn't clobber the pick. Storage lives in `AudioSessionManager`; this
    /// is just the cross-package bridge.
    @objc public class var requestedOutputDeviceId: String? {
        get { AudioSessionManager.shared.requestedOutputDeviceId }
        set { AudioSessionManager.shared.setRequestedOutputDeviceId(newValue) }
    }
}
