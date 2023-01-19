import {
  useAcceptedCall,
  useActiveCall,
  useIncomingCalls,
  useOutgoingCalls,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { PropsWithChildren, useEffect } from 'react';
import InCallManager from 'react-native-incall-manager';

export type StreamCallProps = {
  automaticHungupTime?: number;
  onAcceptCall?: () => void;
  onIncomingCall?: () => void;
  onHangupCall?: () => void;
  onOutgoingCall?: () => void;
};

export const StreamCall = ({
  children,
  onAcceptCall,
  onIncomingCall,
  onOutgoingCall,
}: PropsWithChildren<StreamCallProps>) => {
  const videoClient = useStreamVideoClient();
  const [incomingCall] = useIncomingCalls();
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
          await videoClient.joinCall({
            id: outgoingCall.call.id,
            type: outgoingCall.call.type,
            datacenterId: '',
          });
        } else if (
          acceptedCall?.call &&
          !videoClient.callConfig.joinCallInstantly
        ) {
          await videoClient.joinCall({
            id: acceptedCall.call.id,
            type: acceptedCall.call.type,
            datacenterId: '',
          });
        }
        InCallManager.start({ media: 'video' });
        InCallManager.setForceSpeakerphoneOn(true);
      } catch (error) {
        console.log('Failed to join the call', error);
      }
    };
    startOutgoingCall();
  }, [videoClient, outgoingCall, activeCall, acceptedCall]);

  // Effect to deal with incoming call notifications
  useEffect(() => {
    if (outgoingCall && onOutgoingCall) {
      onOutgoingCall();
    } else if (incomingCall && onIncomingCall) {
      onIncomingCall();
    } else if (activeCall && onAcceptCall) {
      onAcceptCall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingCall, outgoingCall, activeCall]);

  return <>{children}</>;
};
