import { PropsWithChildren, useEffect } from 'react';
import { CallCancelled, CallRejected } from '@stream-io/video-client';

import {
  useAcceptedCall,
  useActiveCall,
  useIncomingCalls,
  useOutgoingCalls,
  useRemoteParticipants,
  useStore,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import {
  LocalMediaStreamsContextProvider,
  MediaDevicesProvider,
} from '../../contexts';

type StreamCallProps = {
  leaveOnLeftAlone?: boolean;
};

export const StreamCall = ({
  children,
  leaveOnLeftAlone,
}: PropsWithChildren<StreamCallProps>) => {
  const videoClient = useStreamVideoClient();
  const activeCall = useActiveCall();
  const incomingCalls = useIncomingCalls();
  const outgoingCalls = useOutgoingCalls();
  const acceptedCall = useAcceptedCall();
  const remoteParticipants = useRemoteParticipants();
  const { myHangupNotifications$ } = useStore();
  const { remoteHangupNotifications$ } = useStore();

  useEffect(() => {
    if (!(videoClient && acceptedCall)) return;

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
          myHangupNotifications$.subscribe((notifications) => {
            const myHangups = notifications.reduce(
              filterActiveCallHangups,
              new Set(),
            );
            myHangups.size > 0 && call?.leave();
          });

          remoteHangupNotifications$.subscribe((notifications) => {
            const members = call?.data.details?.memberUserIds || [];
            const wasLeftAlone =
              notifications.reduce(filterActiveCallHangups, new Set()).size ===
              members.length - 1;

            if (wasLeftAlone && leaveOnLeftAlone) {
              call?.leave();
            }
          });
          return call;
        })
        .then((call) => {
          !call?.left && call?.join();
        });
    }
  }, [
    activeCall,
    videoClient,
    outgoingCalls,
    acceptedCall,
    remoteParticipants,
    myHangupNotifications$,
    remoteHangupNotifications$,
    incomingCalls,
    leaveOnLeftAlone,
  ]);

  if (!videoClient) return null;

  return (
    <MediaDevicesProvider>
      <LocalMediaStreamsContextProvider>
        {children}
      </LocalMediaStreamsContextProvider>
    </MediaDevicesProvider>
  );
};
