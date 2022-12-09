import { PropsWithChildren, useEffect, useRef } from 'react';
import { CallCancelled, CallRejected } from '@stream-io/video-client';

import {
  useAcceptedCall,
  useIncomingCalls,
  useOutgoingCalls,
  useStore,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { useStreamVideoStoreValue } from './StreamVideoContext';

/**
 * StreamCall is a wrapper component that handles incoming and outgoing calls.
 * Optionally leaves a call when the user is the only one left in the call.
 */
export const StreamCall = ({ children }: PropsWithChildren<{}>) => {
  const videoClient = useStreamVideoClient();
  const leaveOnLeftAlone = useStreamVideoStoreValue(
    (state) => state.leaveOnLeftAlone,
  );
  const incomingCalls = useIncomingCalls();
  const outgoingCalls = useOutgoingCalls();
  const acceptedCall = useAcceptedCall();
  const { myHangupNotifications$ } = useStore();
  const { remoteHangupNotifications$ } = useStore();

  const isJoiningRef = useRef(false);

  useEffect(() => {
    if (!(videoClient && acceptedCall) || isJoiningRef.current) return;

    /** functions to unsubscribe from rxjs subscriptions */
    const rxUnsubscribeFuncs = { current: [] as (() => void)[] };

    const callToJoin =
      outgoingCalls.length > 0
        ? outgoingCalls.find(
            (c) => c.call?.callCid === acceptedCall?.call?.callCid,
          )
        : incomingCalls.length > 0
        ? incomingCalls.find(
            (c) => c.call?.callCid === acceptedCall?.call?.callCid,
          )
        : undefined;

    if (callToJoin?.call) {
      videoClient
        ?.joinCall({
          id: callToJoin.call.id,
          type: callToJoin.call.type,
          // FIXME: OL optional, but it is marked as required in proto
          datacenterId: '',
        })
        .then((call) => {
          isJoiningRef.current = false;
          if (call?.left) return call;
          const filterActiveCallHangups = (
            acc: Set<string>,
            notification: CallCancelled | CallRejected,
          ) => {
            if (notification.call?.callCid === call?.data.call?.callCid) {
              acc.add(notification.senderUserId);
            }
            return acc;
          };
          const myHangupSub = myHangupNotifications$.subscribe(
            (notifications) => {
              const myHangups = notifications.reduce(
                filterActiveCallHangups,
                new Set(),
              );
              myHangups.size > 0 && call?.leave();
            },
          );

          const remoteHangupSub = remoteHangupNotifications$.subscribe(
            (notifications) => {
              const members = call?.data.details?.memberUserIds || [];
              const wasLeftAlone =
                notifications.reduce(filterActiveCallHangups, new Set())
                  .size ===
                members.length - 1;

              if (wasLeftAlone && leaveOnLeftAlone) {
                call?.leave();
              }
            },
          );
          rxUnsubscribeFuncs.current.push(
            () => myHangupSub.unsubscribe(),
            () => remoteHangupSub.unsubscribe(),
          );
          return call;
        })
        .then((call) => {
          !call?.left && call?.join();
        })
        .catch((err) => {
          isJoiningRef.current = false;
        });
      return () => {
        rxUnsubscribeFuncs.current.forEach((f) => f());
      };
    }
  }, [
    videoClient,
    outgoingCalls,
    incomingCalls,
    acceptedCall,
    myHangupNotifications$,
    remoteHangupNotifications$,
    leaveOnLeftAlone,
    isJoiningRef,
  ]);

  if (!videoClient) return null;

  return <>{children}</>;
};
