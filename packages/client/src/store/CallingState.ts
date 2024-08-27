/**
 * Represents the state of the current call.
 */
export enum CallingState {
  /**
   * The call is in an unknown state.
   */
  UNKNOWN = 'unknown',

  /**
   * The call is in an idle state.
   */
  IDLE = 'idle',

  /**
   * The call is in the process of ringing.
   * (User hasn't accepted nor rejected the call yet.)
   */
  RINGING = 'ringing',

  /**
   * The call is in the process of joining.
   */
  JOINING = 'joining',

  /**
   * The call is currently active.
   */
  JOINED = 'joined',

  /**
   * The call has been left.
   */
  LEFT = 'left',

  /**
   * The call is in the process of reconnecting.
   */
  RECONNECTING = 'reconnecting',

  /**
   * The call is in the process of migrating from one node to another.
   */
  MIGRATING = 'migrating',

  /**
   * The call has failed to reconnect.
   */
  RECONNECTING_FAILED = 'reconnecting-failed',

  /**
   * The call is in offline mode.
   */
  OFFLINE = 'offline',
}
