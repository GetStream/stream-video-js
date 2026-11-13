import Foundation
import stream_react_native_webrtc

enum CallingxBackendKind {
    case callKit
    case liveCommunicationKit
}

/// The system call framework behind `CallingxImpl`. Swift-only: implementations use framework
/// types that have no ObjC representation. Created once per process by `CallingxImpl.currentBackend()`.
/// Backends reach the facade through `CallingxImpl.sharedInstance` (events, engine gating) and
/// `CallingxImpl.uuidStorage` (tracked calls).
protocol CallingxBackend: AnyObject {
    var kind: CallingxBackendKind { get }

    /// Applies the persisted settings (`Settings.getSettings()`) after `setup(options:)`.
    func applyConfiguration()

    // MARK: - Static entry points (ObjC `Callingx`, VoIP push, JS)

    /// PushKit path when `resolve`/`reject` are nil (`completion` called once the report is entered),
    /// JS path otherwise (the promise settles after the report).
    func reportNewIncomingCall(
        callId: String,
        handle: String,
        handleType: String,
        hasVideo: Bool,
        localizedCallerName: String?,
        supportsHolding: Bool,
        supportsDTMF: Bool,
        supportsGrouping: Bool,
        supportsUngrouping: Bool,
        payload: [String: Any]?,
        completion: (() -> Void)?,
        resolve: RCTPromiseResolveBlock?,
        reject: RCTPromiseRejectBlock?
    )
    /// `reason` is the JS/ObjC ended reason int contract (CallKit's raw values).
    func endCall(_ callId: String, reason: Int)
    /// CallKit: a connected call on the device (any app's). LiveCommunicationKit: this app's
    /// conversation is joined or paused, or CallKit reports a connected call on the device.
    func hasAnyActiveCall() -> Bool
    /// UUIDs of the system's live calls; feeds `UUIDStorage` liveness. Never called while
    /// `UUIDStorage` holds its queue.
    func liveCallUUIDs() -> Set<UUID>

    // MARK: - Call management

    func answerIncomingCall(_ callId: String) -> Bool
    func endCall(_ callId: String) -> Bool
    func setCurrentCallActive(_ callId: String) -> Bool
    func setMutedCall(_ callId: String, isMuted: Bool) -> Bool
    func setOnHoldCall(_ callId: String, isOnHold: Bool) -> Bool
    func startCall(callId: String, phoneNumber: String, callerName: String, hasVideo: Bool)
    func updateDisplay(callId: String, phoneNumber: String, callerName: String) -> Bool
    func fulfillAnswerCallAction(_ callId: String, didFail: Bool)
    func fulfillEndCallAction(_ callId: String, didFail: Bool)

    /// `true` while the audio engine is starting (its voice-processing mute toggles are not user intent).
    func setAudioEngineStarting(_ isStarting: Bool)
}
