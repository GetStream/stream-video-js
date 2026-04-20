import { BehaviorSubject } from 'rxjs';
import type { NonRingingPushEvent } from '../../StreamVideoRN/types';

/**
 * This rxjs subject is used to store the call cid of the accepted incoming call from push notification
 * Note: it is should be subscribed only when a user has connected to the websocket of Stream
 */
export const pushNonRingingCallData$ = new BehaviorSubject<
  { cid: string; type: NonRingingPushEvent } | undefined
>(undefined);
