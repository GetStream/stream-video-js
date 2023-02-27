import {
  useAcceptedCall,
  useActiveCall,
  useOutgoingCalls,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { PropsWithChildren, useEffect } from 'react';
import InCallManager from 'react-native-incall-manager';

import { useCallCycleEffect } from '../hooks';

export type CallCycleHandlersType = {
  onActiveCall?: () => void;
  onIncomingCall?: () => void;
  onHangupCall?: () => void;
  onOutgoingCall?: () => void;
};

export type CallCycleProviderProps = {
  callCycleHandlers: CallCycleHandlersType;
};

export const CallCycleProvider = (
  props: PropsWithChildren<CallCycleProviderProps>,
) => {
  const client = useStreamVideoClient();
  const [outgoingCall] = useOutgoingCalls();
  const acceptedCall = useAcceptedCall();
  const activeCall = useActiveCall();
  const { callCycleHandlers, children } = props;

  useCallCycleEffect(callCycleHandlers);

  // Effect to deal with the case that the outgoing call should be joined as soon as it is created by the user
  useEffect(() => {
    const startOutgoingCall = async () => {
      if (!client || activeCall) {
        return;
      }
      try {
        if (outgoingCall?.call && client.callConfig.joinCallInstantly) {
          client.joinCall(outgoingCall.call.id!, outgoingCall.call.type!);
        } else if (acceptedCall && !client.callConfig.joinCallInstantly) {
          client.joinCall(outgoingCall.call.id!, outgoingCall.call.type!);
        }
        InCallManager.start({ media: 'video' });
        InCallManager.setForceSpeakerphoneOn(true);
      } catch (error) {
        console.log('Failed to join the call', error);
      }
    };
    startOutgoingCall();
  }, [client, outgoingCall, activeCall, acceptedCall]);

  return <>{children}</>;
};
