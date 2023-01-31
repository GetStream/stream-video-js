export type CallType = 'ring' | 'meeting';

export type CallConfig = {
  /**
   * Optional parameter to define after how many milliseconds without receiving CallAccepted event should the outgoing call be cancelled.
   * If not defined, the call will not be cancelled automatically by the client and the user is expected to cancel or leave the call manually.
   * Note: Is relevant to outgoing calls only.
   */
  autoCancelTimeoutInMs?: number;
  /**
   * Optional parameter to define after how many milliseconds an incoming ring call should be automatically rejected.
   * If not defined, the call will not be rejected automatically by the client and the user is expected to reject the call manually.
   * Note: Is relevant to incoming calls only.
   */
  autoRejectTimeoutInMs?: number;
  /**
   * Optional parameter enabling automatic rejections of incoming calls while participating at an active call.
   */
  autoRejectWhenInCall?: boolean;
  /**
   * Flag signals to SDK components not to wait until CallAccepted event is received,
   * but join the call immediately upon emitting a new PendingCall by the stateStore.
   * Note: Is relevant to outgoing calls only. Once the caller joins an outgoing call it's not possible to cancel that call.
   */
  joinCallInstantly?: boolean;
  /**
   * Flag signals, whether sounds should be played upon initiation of a new call.
   */
  playSounds?: boolean;
};
