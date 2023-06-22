import { BehaviorSubject } from 'rxjs';

/**
 * This rxjs subject is used to store the call cid of the accepted incoming call from push notification
 * Note: it is should be subscribed only when a user has connected to the websocket of Stream
 */
export const pushAcceptedIncomingCallCId$ = new BehaviorSubject<
  string | undefined
>(undefined);

/**
 * This rxjs subject is used to store the call cid of the accepted incoming call from push notification
 * Note: it should be subscribed only when a user has connected to the websocket of Stream
 */
export const pushRejectedIncomingCallCId$ = new BehaviorSubject<
  string | undefined
>(undefined);

/**
 * This rxjs subject is used to store the call cid of the incoming call from ios voip pushkit notification
 */
export const voipPushNotificationCallCId$ = new BehaviorSubject<
  string | undefined
>(undefined);
