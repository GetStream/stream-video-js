import type { StreamVideoConfig } from '../StreamVideoRN/types';
import {
  pushAcceptedIncomingCallCId$,
  voipPushNotificationCallCId$,
  pushRejectedIncomingCallCId$,
  voipCallkeepCallOnForegroundMap$,
  voipCallkeepAcceptedCallOnNativeDialerMap$,
} from './rxSubjects';
import { processCallFromPushInBackground } from './utils';

type PushConfig = NonNullable<StreamVideoConfig['push']>;

export const iosCallkeepAcceptCall = (
  call_cid: string | undefined,
  callUUIDFromCallkeep: string,
) => {
  if (!shouldProcessCallFromCallkeep(call_cid, callUUIDFromCallkeep)) {
    return;
  }
  // to call end callkeep later if ended in app and not through callkeep
  voipCallkeepAcceptedCallOnNativeDialerMap$.next({
    uuid: callUUIDFromCallkeep,
    cid: call_cid,
  });
  // to process the call in the app
  pushAcceptedIncomingCallCId$.next(call_cid);
  // no need to keep these references anymore
  voipCallkeepCallOnForegroundMap$.next(undefined);
  // voipPushNotificationCallCId$.next(undefined);
};

export const iosCallkeepRejectCall = async (
  call_cid: string | undefined,
  callUUIDFromCallkeep: string,
  pushConfig: PushConfig,
) => {
  if (!shouldProcessCallFromCallkeep(call_cid, callUUIDFromCallkeep)) {
    return;
  }
  // no need to keep these references anymore
  voipCallkeepAcceptedCallOnNativeDialerMap$.next(undefined);
  voipCallkeepCallOnForegroundMap$.next(undefined);
  voipPushNotificationCallCId$.next(undefined);
  await processCallFromPushInBackground(pushConfig, call_cid, 'decline');
};

/**
 * Helper function to determine if the answer/end call event from callkeep must be processed
 * Just checks if we have a valid call_cid and acts as a type guard for call_cid
 */
const shouldProcessCallFromCallkeep = (
  call_cid: string | undefined,
  callUUIDFromCallkeep: string,
): call_cid is string => {
  if (!call_cid || !callUUIDFromCallkeep) {
    return false;
  }
  return true;
};
