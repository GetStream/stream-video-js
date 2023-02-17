import {
  useAcceptedCall,
  useActiveCall,
  useOutgoingCalls,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { PropsWithChildren, useEffect } from 'react';
import InCallManager from 'react-native-incall-manager';

export type StreamCallProps = {
  automaticHungupTime?: number;
};

export const StreamCall = ({
  children,
}: PropsWithChildren<StreamCallProps>) => {
  const videoClient = useStreamVideoClient();
  const [outgoingCall] = useOutgoingCalls();
  const acceptedCall = useAcceptedCall();
  const activeCall = useActiveCall();

  // Effect to deal with the case that the outgoing call should be joined as soon as it is created by the user
  useEffect(() => {
    const startOutgoingCall = async () => {
      if (!videoClient || activeCall) {
        return;
      }
      try {
        if (outgoingCall?.call && videoClient.callConfig.joinCallInstantly) {
          videoClient.joinCall(outgoingCall.call.id!, outgoingCall.call.type!);
        } else if (acceptedCall && !videoClient.callConfig.joinCallInstantly) {
          videoClient.joinCall(outgoingCall.call.id!, outgoingCall.call.type!);
        }
        InCallManager.start({ media: 'video' });
        InCallManager.setForceSpeakerphoneOn(true);
      } catch (error) {
        console.log('Failed to join the call', error);
      }
    };
    startOutgoingCall();
  }, [videoClient, outgoingCall, activeCall, acceptedCall]);

  if (!videoClient) return null;

  return <>{children}</>;
};
