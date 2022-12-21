import { ReactNode, useEffect } from 'react';

import {
  useActiveCall,
  useOutgoingCalls,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { MediaDevicesProvider } from '../../contexts';

export const StreamCall = ({ children }: { children: ReactNode }) => {
  const videoClient = useStreamVideoClient();
  const [outgoingCall] = useOutgoingCalls();
  const activeCall = useActiveCall();

  useEffect(() => {
    if (!(videoClient && outgoingCall?.call) || activeCall) return;

    videoClient
      ?.joinCall({
        id: outgoingCall.call.id,
        type: outgoingCall.call.type,
        // FIXME: OL optional, but it is marked as required in proto
        datacenterId: '',
      })
      .then((call) => {
        call?.join();
      });
  }, [videoClient, outgoingCall, activeCall]);

  if (!videoClient) return null;

  return <MediaDevicesProvider>{children}</MediaDevicesProvider>;
};
