import { ReactNode, useEffect } from 'react';
import {
  useAcceptedCall,
  useActiveCall,
  useOutgoingCalls,
  useHangUpNotifications,
  useRemoteParticipants,
  useStreamVideoClient,
  useIncomingCalls,
} from '@stream-io/video-react-bindings';
import {
  LocalMediaStreamsContextProvider,
  MediaDevicesProvider,
} from '../../contexts';

export const StreamCall = ({ children }: { children: ReactNode }) => {
  const videoClient = useStreamVideoClient();
  const activeCall = useActiveCall();
  const incomingCalls = useIncomingCalls();
  const outgoingCalls = useOutgoingCalls();
  const acceptedCall = useAcceptedCall();
  const remoteParticipants = useRemoteParticipants();
  const hangupNotifications = useHangUpNotifications();

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
        .then((call) => call?.join());
    }
    return () => {
      // activeCall?.leave();
    };
  }, [
    activeCall,
    videoClient,
    outgoingCalls,
    acceptedCall,
    remoteParticipants,
    hangupNotifications,
    incomingCalls,
  ]);

  useEffect(() => {
    if (!(videoClient && hangupNotifications.length > 0)) return;
    const hangups = hangupNotifications.filter(
      (notification) =>
        notification.call?.callCid === activeCall?.data.call?.callCid,
    );

    if (hangups.length > 0 && remoteParticipants.length === 0) {
      activeCall?.leave();
    }
    return () => {
      // activeCall?.leave();
    };
  }, [
    activeCall,
    videoClient,
    outgoingCalls,
    acceptedCall,
    remoteParticipants,
    hangupNotifications,
    incomingCalls,
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
