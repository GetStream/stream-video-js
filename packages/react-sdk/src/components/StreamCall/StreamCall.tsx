import { ReactNode, useEffect } from 'react';

import {
  StreamCallProvider,
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
      videoClient
        .joinCall(outgoingCall.call.id!, outgoingCall.call.type!)
        .catch((e) => {
          console.error('Error joining call', e);
        });
    } else if (acceptedCall && !videoClient.callConfig.joinCallInstantly) {
      videoClient
        .joinCall(outgoingCall.call.id!, outgoingCall.call.type!)
        .catch((e) => {
          console.error('Error joining call', e);
        });
    }
  }, [videoClient, outgoingCall, acceptedCall, activeCall]);

  if (!activeCall) return null;

  return (
    <StreamCallProvider call={activeCall}>
      <MediaDevicesProvider enumerate={!!activeCall}>
        {children}
      </MediaDevicesProvider>
    </StreamCallProvider>
  );
};
