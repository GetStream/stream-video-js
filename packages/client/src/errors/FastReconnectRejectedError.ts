/**
 * Thrown when the SFU didn't resume the session after a fast reconnect: it
 * answered the join with `reconnected: false` or `PARTICIPANT_NOT_FOUND`
 * (the session was already cleaned up, e.g. while this client was frozen),
 * or it never sent the subscriber offer that restarts receiving. The call
 * must fall back to a full rejoin.
 */
export class FastReconnectRejectedError extends Error {}
