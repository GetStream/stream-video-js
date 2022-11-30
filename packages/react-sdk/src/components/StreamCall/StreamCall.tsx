import { ReactNode, useEffect } from 'react';
import {
  useActiveCall,
  useOutgoingCalls,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { MediaDevicesProvider } from '../../contexts';

export const StreamCall = ({ children }: { children: ReactNode }) => {
  const videoClient = useStreamVideoClient();
  const activeCall = useActiveCall();
  const outgoingCalls = useOutgoingCalls();

  useEffect(() => {
    if (!videoClient) return;

    const [outgoingCall] = outgoingCalls;
    if (!activeCall && outgoingCall?.call) {
      videoClient?.joinCall({
        id: outgoingCall.call.id,
        type: outgoingCall.call.type,
        // FIXME: OL optional, but it is marked as required in proto
        datacenterId: '',
      });
    }
    return () => {
      activeCall?.connection?.leave();
    };
  }, [activeCall, videoClient, outgoingCalls]);

  if (!videoClient) return null;

  return <MediaDevicesProvider>{children}</MediaDevicesProvider>;
};
