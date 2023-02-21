import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

const EgressReadyNotificationContext = createContext((isReady: boolean) => {
  // no-op
  console.warn('EgressReadyNotificationContext not set', isReady);
});

export const EgressReadyNotificationProvider = (props: PropsWithChildren) => {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    if (isReady) return;
    // it could happen that components won't notify us that they are ready
    // in that case, we start recording anyway after 4 seconds.
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
  }, [isReady]);

  const spyIsReady = useCallback((value: boolean) => {
    console.log('Egress is ready');
    setIsReady(value);
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
