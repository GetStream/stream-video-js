import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useCall } from '@stream-io/video-react-bindings';
import type { INoiseCancellation } from '@stream-io/audio-filters-web';

export type NoiseCancellationProviderProps = {
  /**
   * The noise cancellation instance to use.
   */
  noiseCancellation: INoiseCancellation;
};

export type NoiseCancellationAPI = {
  isSupported: boolean;
  isEnabled: boolean;
  setEnabled: (enabled: boolean | ((value: boolean) => boolean)) => void;
};

const NoiseCancellationContext = createContext<NoiseCancellationAPI | null>(
  null,
);

export const useNoiseCancellation = (): NoiseCancellationAPI => {
  const context = useContext(NoiseCancellationContext);
  if (!context) {
    throw new Error(
      'useNoiseCancellation must be used within a NoiseCancellationProvider',
    );
  }
  return context;
};

export const NoiseCancellationProvider = (
  props: PropsWithChildren<NoiseCancellationProviderProps>,
) => {
  const { children, noiseCancellation } = props;
  const call = useCall();
  const [isEnabled, setIsEnabled] = useState(false);
  const isSupported = useMemo(
    () => noiseCancellation.isSupported(),
    [noiseCancellation],
  );
  const deinit = useRef<Promise<void>>();
  useEffect(() => {
    if (!call || !isSupported) return;
    const unsubscribe = noiseCancellation.on('change', (v) => setIsEnabled(v));
    const init = (deinit.current || Promise.resolve())
      .then(() => noiseCancellation.init())
      .then(() => call.microphone.enableNoiseCancellation(noiseCancellation))
      .catch((err) => console.error(`Can't initialize noise suppression`, err));

    return () => {
      deinit.current = init
        .then(() => call.microphone.disableNoiseCancellation())
        .then(() => noiseCancellation.dispose())
        .then(() => unsubscribe());
    };
  }, [call, isSupported, noiseCancellation]);

  return (
    <NoiseCancellationContext.Provider
      value={{
        isSupported,
        isEnabled,
        setEnabled: (enabledOrSetter) => {
          if (!noiseCancellation) return;
          const enable =
            typeof enabledOrSetter === 'function'
              ? enabledOrSetter(isEnabled)
              : enabledOrSetter;
          if (enable) {
            noiseCancellation.enable();
          } else {
            noiseCancellation.disable();
          }
        },
      }}
    >
      {children}
    </NoiseCancellationContext.Provider>
  );
};
