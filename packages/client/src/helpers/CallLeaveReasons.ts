/**
 * Standardized leave / rejection reason strings emitted by the SDK.
 */
export const CallLeaveReasons = {
  /** All callees have rejected; the creator's call leaves itself. */
  ringEveryoneRejected: 'ring:everyone-rejected',
  /** The creator rejected/cancelled; uninvited callees stop ringing. */
  ringCreatorRejected: 'ring:creator-rejected',
  /** Outgoing ring-timeout: nobody picked up. */
  ringTimeoutCreator: 'ring:timeout-creator',
  /** Incoming ring-timeout: the local user did not interact in time. */
  ringTimeoutCallee: 'ring:timeout-callee',
  /** A backend `call.ended` event arrived for this call. */
  eventCallEnded: 'event:call-ended',
  /** Builds an SFU `callEnded` reason from the SFU-provided code. */
  sfuCallEnded: (sfuReason: string) => `sfu:call-ended:${sfuReason}` as const,
  /** The same user accepted the ringing call on another device. */
  deviceAcceptedElsewhere: 'device:accepted-elsewhere',
  /**
   * The session reports the local user as a rejector. Covers both rejecting
   * locally (the API call updates the session, which triggers our reactive
   * leave) and rejecting on another device of the same user.
   */
  deviceRejectedElsewhere: 'device:rejected-elsewhere',
} as const;
