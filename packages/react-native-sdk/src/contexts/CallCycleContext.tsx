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
import { useCallCycleEffect } from '../hooks';

/**
 * Exclude types from documentaiton site, but we should still add doc comments
 * @internal
 */
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

/**
 * Exclude types from documentaiton site, but we should still add doc comments
 * @internal
 */
export type CallCycleProviderProps = {
  callCycleHandlers: CallCycleHandlersType;
};

/**
 * @internal
 */
export const CallCycleContext = createContext<CallCycleProviderProps>({
  callCycleHandlers: {},
});

/**
 *
 * @returns
 *
 * @category Client State
 */
export const useCallCycleContext = () =>
  useContext<CallCycleProviderProps>(CallCycleContext);

/**
 *
 * @param props
 * @returns
 *
 * @category Client State
 */
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
          client.call(outgoingCall.type, outgoingCall.id).join();
        } else if (acceptedCall && !client.callConfig.joinCallInstantly) {
          client.call(outgoingCall.type, outgoingCall.id).join();
        }
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
