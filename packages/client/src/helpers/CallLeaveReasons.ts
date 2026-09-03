/**
 * The `message` strings the SDK attaches to `call.leave()` and to the
 * matching `ClientEventReporter.abort()` call.
 *
 * These values are a shared cross-SDK vocabulary: the Swift SDK's
 * `StreamRejectionReasonProvider.HandledCallReason` emits the same strings
 * for the ringing cases, so backend analytics can group a given outcome
 * across platforms. Treat the values as a wire contract - rename a key
 * freely, but change a value only alongside the other SDKs.
 */
export const CallLeaveReasons = {
  /** All callees have rejected; the creator's call leaves itself. */
  ringEveryoneRejected: 'ring: everyone rejected',
  /** The creator rejected/cancelled; callees stop ringing. */
  ringCreatorRejected: 'ring: creator rejected',
  /** Outgoing ring-timeout: nobody picked up. */
  ringTimeoutCreator: 'ringing timeout - no one accepted',
  /** Incoming ring-timeout: the local user did not interact in time. */
  ringTimeoutCallee:
    "ringing timeout - user didn't interact with incoming call screen",
  /**
   * The same user accepted, rejected or missed the ringing call on another
   * device. Local accept/reject does not reach this path: `leave()` holds the
   * join/leave concurrency tag, which suppresses the reactive session leave.
   */
  userRespondedElsewhere: 'user-responded-elsewhere',

  /** A backend `call.ended` event arrived for this call. */
  eventCallEnded: 'call.ended event received',
  /** Builds an SFU `callEnded` reason from the SFU-provided code. */
  sfuCallEnded: (sfuReason: string) => `callEnded received: ${sfuReason}`,
  /** The SFU sent a `goAway` and the client could not migrate. */
  sfuGoAway: 'SFU instructed to disconnect',
  /** The livestream ended and the user cannot stay on backstage. */
  liveEnded: 'live ended',
  /** The local user was blocked from the call. */
  userBlocked: 'user blocked',

  /** Reconnect gave up: the network cannot carry WebRTC at all. */
  webrtcUnsupportedNetwork: 'webrtc_unsupported_network',
  /** Reconnect gave up: too many full rejoin attempts. */
  rejoinAttemptLimitExceeded: 'rejoin_attempt_limit_exceeded',
  /** Reconnect gave up: negotiation kept failing after reconnecting. */
  repeatedNegotiationFailures: 'repeated_negotiation_failures',

  /** `client.disconnectUser()` tore down the still-active calls. */
  disconnectUser: 'client.disconnectUser() called',
  /** Fallback when the caller passes neither `message` nor `reason`. */
  userLeaving: 'user is leaving the call',
} as const;
