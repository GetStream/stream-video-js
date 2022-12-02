import { ReactNode, useEffect } from 'react';
import {
  useAcceptedCall,
  useActiveCall,
  useOutgoingCalls,
  useRejectedCallNotifications,
  useRemoteParticipants,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { MediaDevicesProvider } from '../../contexts';

export const StreamCall = ({ children }: { children: ReactNode }) => {
  const videoClient = useStreamVideoClient();
  const activeCall = useActiveCall();
  const outgoingCalls = useOutgoingCalls();
  const acceptedCall = useAcceptedCall();
  const remoteParticipants = useRemoteParticipants();
  const rejectedCallNotifications = useRejectedCallNotifications();

  useEffect(() => {
    if (!videoClient) return;
    const activeCallRejections = rejectedCallNotifications.filter(
      (notification) =>
        notification.call?.callCid === activeCall?.data.call?.callCid,
    );

    const acceptedOrInitiatedCall =
      acceptedCall?.call || outgoingCalls[0]?.call;
    if (!activeCall && acceptedOrInitiatedCall) {
      videoClient?.joinCall({
        id: acceptedOrInitiatedCall.id,
        type: acceptedOrInitiatedCall.type,
        // FIXME: OL optional, but it is marked as required in proto
        datacenterId: '',
      });
    } else if (
      activeCall &&
      activeCallRejections.length > 0 &&
      remoteParticipants.length === 0
    ) {
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
    rejectedCallNotifications,
  ]);

  if (!videoClient) return null;

  return <MediaDevicesProvider>{children}</MediaDevicesProvider>;
};
