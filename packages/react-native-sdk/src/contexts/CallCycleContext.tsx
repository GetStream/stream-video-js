import {
  createContext,
  PropsWithChildren,
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
