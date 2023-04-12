export type CallMode = 'ring' | 'meeting';

export type CallConfig = {
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
