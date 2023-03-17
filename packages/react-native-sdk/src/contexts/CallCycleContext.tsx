import {
  useAcceptedCall,
  useActiveCall,
  useOutgoingCalls,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import InCallManager from 'react-native-incall-manager';
import { useCallCycleEffect } from '../hooks';

export type CallCycleHandlersType = {
  onActiveCall?: () => void;
  onIncomingCall?: () => void;
  /**
   * Handler called when the call is hanged up by the caller. Mostly used for navigation and related actions.
   */
  onHangupCall?: () => void;
  onOutgoingCall?: () => void;
  /**
   * Handler called when the call is rejected. Mostly used for navigation and related actions.
   */
  onRejectCall?: () => void;
};

export type CallCycleProviderProps = {
  callCycleHandlers: CallCycleHandlersType;
};

export const CallCycleContext = createContext<CallCycleProviderProps>({
  callCycleHandlers: {},
});

export const useCallCycleContext = () =>
  useContext<CallCycleProviderProps>(CallCycleContext);

export const CallCycleProvider = (
  props: PropsWithChildren<CallCycleProviderProps>,
) => {
  const [callCycleHandlers, setCallCycleHandlers] =
    useState<CallCycleHandlersType>({});
  const { children, callCycleHandlers: callCycleHandlersProp } = props;
  const client = useStreamVideoClient();
  const [outgoingCall] = useOutgoingCalls();
  const acceptedCall = useAcceptedCall();
  const activeCall = useActiveCall();

  // Effect to deal with the case that the outgoing call should be joined as soon as it is created by the user
  useEffect(() => {
    const startOutgoingCall = async () => {
      if (!client || activeCall) {
        return;
      }
      try {
        if (outgoingCall && client.callConfig.joinCallInstantly) {
          client.joinCall(outgoingCall.id, outgoingCall.type);
        } else if (acceptedCall && !client.callConfig.joinCallInstantly) {
          client.joinCall(outgoingCall.id, outgoingCall.type);
        }
        InCallManager.start({ media: 'video' });
        InCallManager.setForceSpeakerphoneOn(true);
      } catch (error) {
        console.log('Failed to join the call', error);
      }
    };
    startOutgoingCall();
  }, [client, outgoingCall, activeCall, acceptedCall]);

  useEffect(() => {
    setCallCycleHandlers(callCycleHandlersProp);
  }, [callCycleHandlersProp]);

  useCallCycleEffect(callCycleHandlers);

  return (
    <CallCycleContext.Provider value={{ callCycleHandlers }}>
      {children}
    </CallCycleContext.Provider>
  );
};
