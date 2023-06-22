import type { StreamVideoConfig } from '../StreamVideoRN/types';
import {
  pushAcceptedIncomingCallCId$,
  voipPushNotificationCallCId$,
  pushRejectedIncomingCallCId$,
} from './rxSubjects';
import { declineCallFromPushInBackground } from './utils';

type PushConfig = NonNullable<StreamVideoConfig['push']>;

export const iosCallkeepAcceptCall = (
  call_cid: string | undefined,
  callUUIDFromCallkeep: string,
  pushConfig: PushConfig,
) => {
  if (!shouldProcessCallFromCallkeep(call_cid, callUUIDFromCallkeep)) {
    return;
  }
  pushAcceptedIncomingCallCId$.next(call_cid);
  voipPushNotificationCallCId$.next(undefined);
  // navigate to the call screen
  pushConfig.navigateAcceptCall();
};

export const iosCallkeepRejectCall = async (
  call_cid: string | undefined,
  callUUIDFromCallkeep: string,
  pushConfig: PushConfig,
) => {
  if (!shouldProcessCallFromCallkeep(call_cid, callUUIDFromCallkeep)) {
    return;
  }
  pushRejectedIncomingCallCId$.next(call_cid);
  voipPushNotificationCallCId$.next(undefined);
  if (pushAcceptedIncomingCallCId$.observed) {
    // we have observed the rejected call cid, so nothing to do here
    return;
  }
  await declineCallFromPushInBackground(pushConfig, call_cid);
};

/**
 * Helper function to determine if the answer/end call event from callkeep must be processed
 * And also acts as a type guard for call_cid
 * */
const shouldProcessCallFromCallkeep = (
  call_cid: string | undefined,
  callUUIDFromCallkeep: string,
): call_cid is string => {
  if (!call_cid || !callUUIDFromCallkeep) {
    return false;
  }
  const [_callType, callId] = call_cid.split(':');
  return callId === callUUIDFromCallkeep;
};
