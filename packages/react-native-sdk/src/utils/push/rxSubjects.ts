import { BehaviorSubject } from 'rxjs';
import { NonRingingPushEvent } from '../StreamVideoRN/types';

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

/** The pair of cid of a call and its corresponding uuid created in the native side */
type CallkeepMap = {
  uuid: string;
  cid: string;
};

/*
 * This rxjs subject should only used to store the CallkeepMap
 * for the incoming call when on foreground
 * or in other words, when we get didDisplayIncomingCall from callkeep lib
 */
export const voipCallkeepCallOnForegroundMap$ = new BehaviorSubject<
  CallkeepMap | undefined
>(undefined);

/*
 * This rxjs subject should only used to store the CallkeepMap when it was accepted in the native dialer
 */
export const voipCallkeepAcceptedCallOnNativeDialerMap$ = new BehaviorSubject<
  CallkeepMap | undefined
>(undefined);

type UnsubscribeCallback = () => void;

/**
 * This rxjs subject is used to store the unsubscribe callbacks (if any) of the push notification processing
 * Note: it should be used to clear it when app processes push notification from foreground
 */
export const pushUnsubscriptionCallbacks$ = new BehaviorSubject<
  UnsubscribeCallback[] | undefined
>(undefined);
