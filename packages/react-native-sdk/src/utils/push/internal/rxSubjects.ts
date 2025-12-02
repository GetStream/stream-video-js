import { BehaviorSubject } from 'rxjs';
import type { NonRingingPushEvent } from '../../StreamVideoRN/types';

/**
 * This rxjs subject is used to store the call cid of the accepted incoming call from push notification
 * Note: it is should be subscribed only when a user has connected to the websocket of Stream
 */
export const pushNonRingingCallData$ = new BehaviorSubject<
  { cid: string; type: NonRingingPushEvent } | undefined
>(undefined);

/**
 * This rxjs subject is used to store the call cid of the accepted incoming call from push notification
 * Note: it is should be subscribed only when a user has connected to the websocket of Stream
 */
export const pushAcceptedIncomingCallCId$ = new BehaviorSubject<
  string | undefined
>(undefined);

/**
 * This rxjs subject is used to store the call cid of the tapped incoming call from push notification it is neither accepted nor rejected yet
 * Note: it should be subscribed only when a user has connected to the websocket of Stream
 */
export const pushTappedIncomingCallCId$ = new BehaviorSubject<
  string | undefined
>(undefined);

/**
 * This rxjs subject is used to store the call cid of the delivered incoming call from push notification it is neither accepted nor rejected yet
 * Used so that the call is navigated to when app is open from being killed
 * Note: it should be subscribed only when a user has connected to the websocket of Stream
 */
export const pushAndroidBackgroundDeliveredIncomingCallCId$ =
  new BehaviorSubject<string | undefined>(undefined);

/**
 * This rxjs subject is used to store the call cid of the accepted incoming call from push notification
 * Note: it should be subscribed only when a user has connected to the websocket of Stream
 */
export const pushRejectedIncomingCallCId$ = new BehaviorSubject<
  string | undefined
>(undefined);

/**
 * This rxjs subject is used to store the call cid of the incoming call from voip notification
 */
export const voipPushNotificationCallCId$ = new BehaviorSubject<
  string | undefined
>(undefined);
