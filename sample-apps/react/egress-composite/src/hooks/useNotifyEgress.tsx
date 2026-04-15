import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { CallingState, useCallStateHooks } from '@stream-io/video-react-sdk';

const EgressReadyNotificationContext = createContext((isReady: boolean) => {
  // no-op
  console.warn('EgressReadyNotificationContext not set', isReady);
});

export const EgressReadyNotificationProvider = (props: PropsWithChildren) => {
  const [isReady, setIsReady] = useState(false);
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  useEffect(() => {
    if (isReady || callingState !== CallingState.JOINED) return;
    // it could happen that components won't notify us that they are ready
    // in that case, we start recording anyway after 4 seconds.
    console.log('Egress: Started waiting for components to notify readiness');
    const timeout = setTimeout(() => {
      if (!isReady) {
        console.log('Timeout: Egress is ready');
        setIsReady(true);
        clearTimeout(timeout);
      }
    }, 4000);
    return () => {
      clearTimeout(timeout);
    };
  }, [callingState, isReady]);

  const spyIsReady = useCallback((value: boolean) => {
    setIsReady((current) => {
      if (current !== value) console.log('Egress is ready', value);
      return value;
    });
  }, []);

  return (
    <EgressReadyNotificationContext.Provider value={spyIsReady}>
      {props.children}
      {isReady && <span id="egress-ready-for-capture"></span>}
    </EgressReadyNotificationContext.Provider>
  );
};

export const useNotifyEgressReady = () => {
  return useContext(EgressReadyNotificationContext);
};
