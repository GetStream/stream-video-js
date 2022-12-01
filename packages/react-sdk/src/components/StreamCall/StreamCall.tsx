import { ReactNode, useEffect } from 'react';
import {
  useAcceptedCall,
  useActiveCall,
  useOutgoingCalls,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { MediaDevicesProvider } from '../../contexts';

export const StreamCall = ({ children }: { children: ReactNode }) => {
  const videoClient = useStreamVideoClient();
  const activeCall = useActiveCall();
  const outgoingCalls = useOutgoingCalls();
  const acceptedCall = useAcceptedCall();

  useEffect(() => {
    if (!videoClient) return;

    const acceptedOrInitiatedCall =
      acceptedCall?.call || outgoingCalls[0]?.call;
    if (!activeCall && acceptedOrInitiatedCall) {
      videoClient?.joinCall({
        id: acceptedOrInitiatedCall.id,
        type: acceptedOrInitiatedCall.type,
        // FIXME: OL optional, but it is marked as required in proto
        datacenterId: '',
      });
    }
    return () => {
      activeCall?.leave();
    };
  }, [activeCall, videoClient, outgoingCalls, acceptedCall]);

  if (!videoClient) return null;

  return <MediaDevicesProvider>{children}</MediaDevicesProvider>;
};
