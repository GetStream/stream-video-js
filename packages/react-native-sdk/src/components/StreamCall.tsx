import {
  useActiveCall,
  useIncomingCalls,
  useOutgoingCalls,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { PropsWithChildren, useEffect } from 'react';
import InCallManager from 'react-native-incall-manager';
import { RNViewportTracker } from '../utils/RNViewportTracker';

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
  const activeCall = useActiveCall();

  // Effect to deal with the case that the outgoing call should be joined as soon as it is created by the user
  useEffect(() => {
    const startOutgoingCall = async () => {
      if (!(videoClient && outgoingCall?.call) || activeCall) {
        return;
      }
      try {
        const call = await videoClient.joinCall(
          {
            id: outgoingCall.call.id,
            type: outgoingCall.call.type,
            datacenterId: '',
          },
          {
            viewportTracker: RNViewportTracker,
          },
        );
        await call?.join();
        InCallManager.start({ media: 'video' });
        InCallManager.setForceSpeakerphoneOn(true);
      } catch (error) {
        console.log('Failed to join the call', error);
      }
    };
    startOutgoingCall();
  }, [videoClient, outgoingCall, activeCall]);

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
