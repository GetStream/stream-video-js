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
  const [outgoingCall] = useOutgoingCalls();
  const acceptedCall = useAcceptedCall();
  const activeCall = useActiveCall();

  useEffect(() => {
    if (!videoClient || activeCall) return;

    if (outgoingCall?.call && videoClient.callConfig.joinCallInstantly) {
      videoClient.joinCall({
        id: outgoingCall.call.id,
        type: outgoingCall.call.type,
        // FIXME: OL optional, but it is marked as required in proto
        datacenterId: '',
      });
    } else if (
      acceptedCall?.call &&
      !videoClient.callConfig.joinCallInstantly
    ) {
      videoClient.joinCall({
        id: acceptedCall.call.id,
        type: acceptedCall.call.type,
        // FIXME: OL optional, but it is marked as required in proto
        datacenterId: '',
      });
    }
  }, [videoClient, outgoingCall, acceptedCall, activeCall]);

  if (!videoClient) return null;

  return (
    <MediaDevicesProvider enumerate={!!activeCall}>
      {children}
    </MediaDevicesProvider>
  );
};
