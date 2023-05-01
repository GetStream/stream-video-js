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
import NetInfo from '@react-native-community/netinfo';
import { useCallCycleEffect } from '../hooks';
import { CallingState } from '@stream-io/video-client';

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

  /**
   * Effect to inform the coordinator about the online status of the app
   */
  useEffect(() => {
    if (!client) return;
    return NetInfo.addEventListener(({ isConnected, isInternetReachable }) => {
      const isOnline = isConnected === true && isInternetReachable !== false;
      // @ts-expect-error - due to being incompatible with DOM event type
      client?.streamClient.wsConnection?.onlineStatusChanged({
        type: isOnline ? 'online' : 'offline',
      });
    });
  }, [client]);

  /**
   * Effect to re-join to an existing call happens in case the user comes back online
   */
  useEffect(() => {
    if (!activeCall) return;
    return NetInfo.addEventListener(({ isConnected, isInternetReachable }) => {
      const isOnline = isConnected === true && isInternetReachable !== false;
      if (isOnline) {
        if (activeCall.state.callingState === CallingState.OFFLINE) {
          activeCall.rejoin?.().catch(() => {
            activeCall.state.setCallingState(CallingState.RECONNECTING_FAILED);
          });
        }
      } else {
        activeCall.state.setCallingState(CallingState.OFFLINE);
      }
    });
  }, [activeCall]);

  // Effect to deal with the case that the outgoing call should be joined as soon as it is created by the user
  useEffect(() => {
    const startOutgoingCall = async () => {
      if (!(client && acceptedCall) || activeCall) {
        return;
      }
      try {
        client.call(outgoingCall.type, outgoingCall.id).join();
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
