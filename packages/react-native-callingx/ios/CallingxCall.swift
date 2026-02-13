import Foundation

/// Represents a call tracked by the CallingxImpl module.
/// Holds per-call lifecycle state to guard against duplicate actions
/// and to track timestamps for CallKit reporting.
@objcMembers public class CallingxCall: NSObject {
    public let uuid: UUID
    public let cid: String
    public let isOutgoing: Bool

    // MARK: - Action-source flags
    // These flags track whether an action was initiated from the app (vs system UI).
    // They follow a "set-then-read-then-reset" pattern in the CXProviderDelegate methods
    // to determine the event source ("app" vs "sys") before being reset.

    /// Whether answerIncomingCall was initiated from the app (vs system UI)
    public private(set) var isSelfAnswered: Bool = false
    /// Whether endCall was initiated from the app (vs system UI)
    public private(set) var isSelfEnded: Bool = false
    /// Whether setMutedCall was initiated from the app (vs system UI)
    public private(set) var isSelfMuted: Bool = false

    // MARK: - Lifecycle timestamps

    /// When the call started connecting (outgoing: maps to reportOutgoingCall(startedConnectingAt:);
    /// incoming: set when answerIncomingCall is called, internal-only)
    public private(set) var startedConnectingAt: Date?
    /// When the call became connected (outgoing: maps to reportOutgoingCall(connectedAt:);
    /// incoming: set when CXAnswerCallAction delegate fires, internal-only)
    public private(set) var connectedAt: Date?
    /// When the call ended
    public private(set) var endedAt: Date?

    // MARK: - Derived states

    public var hasStartedConnecting: Bool { startedConnectingAt != nil }
    public var isConnected: Bool { connectedAt != nil }
    public var hasEnded: Bool { endedAt != nil }
    /// Whether the call has been answered (incoming) or started connecting (outgoing).
    /// Used as the primary guard against duplicate answerIncomingCall invocations.
    public var isAnswered: Bool { startedConnectingAt != nil }

    // MARK: - Initialization

    public init(uuid: UUID, cid: String, isOutgoing: Bool = false) {
        self.uuid = uuid
        self.cid = cid
        self.isOutgoing = isOutgoing
    }

    // MARK: - Action-source flag methods

    public func markSelfAnswered() { isSelfAnswered = true }
    public func markSelfEnded() { isSelfEnded = true }
    public func markSelfMuted() { isSelfMuted = true }

    public func resetSelfAnswered() { isSelfAnswered = false }
    public func resetSelfEnded() { isSelfEnded = false }
    public func resetSelfMuted() { isSelfMuted = false }

    /// Resets all action-source flags. Called when a CXTransaction fails.
    public func resetAllSelfFlags() {
        isSelfAnswered = false
        isSelfEnded = false
        isSelfMuted = false
    }

    // MARK: - Lifecycle transition methods

    public func markStartedConnecting() {
        if startedConnectingAt == nil {
            startedConnectingAt = Date()
        }
    }

    public func markConnected() {
        if connectedAt == nil {
            connectedAt = Date()
        }
    }

    public func markEnded() {
        if endedAt == nil {
            endedAt = Date()
        }
    }

    // MARK: - Debug description

    public override var description: String {
        let state: String
        if hasEnded {
            state = "ended"
        } else if isConnected {
            state = "connected"
        } else if hasStartedConnecting {
            state = "connecting"
        } else {
            state = "ringing"
        }
        return "CallingxCall(cid: \(cid), uuid: \(uuid.uuidString.lowercased()), outgoing: \(isOutgoing), state: \(state))"
    }
}
