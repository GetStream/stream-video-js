import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  NoiseCancellationSettingsModeEnum,
  OwnCapability,
} from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import type { INoiseCancellation } from '@stream-io/audio-filters-web';

export type NoiseCancellationProviderProps = {
  /**
   * The noise cancellation instance to use.
   */
  noiseCancellation: INoiseCancellation;
};

/**
 * The Noise Cancellation API.
 */
export type NoiseCancellationAPI = {
  /**
   * A boolean providing information whether Noise Cancelling functionalities
   * are supported on this platform and for the current user.
   */
  isSupported: boolean | undefined;
  /**
   * Provides information whether Noise Cancellation is active or not.
   */
  isEnabled: boolean;
  /**
   * Allows you to temporary enable or disable the Noise Cancellation filters.
   *
   * @param enabled a boolean or a setter.
   */
  setEnabled: (enabled: boolean | ((value: boolean) => boolean)) => void;
};

const NoiseCancellationContext = createContext<NoiseCancellationAPI | null>(
  null,
);

/**
 * Exposes the NoiseCancellation API.
 * Throws an error if used outside <NoiseCancellationProvider />.
 */
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
  const { useCallSettings, useHasPermissions } = useCallStateHooks();
  const settings = useCallSettings();
  const noiseCancellationAllowed = !!(
    settings &&
    settings.audio.noise_cancellation &&
    settings.audio.noise_cancellation.mode !==
      NoiseCancellationSettingsModeEnum.DISABLED
  );

  const hasCapability = useHasPermissions(
    OwnCapability.ENABLE_NOISE_CANCELLATION,
  );
  const [isSupportedByBrowser, setIsSupportedByBrowser] = useState<
    boolean | undefined
  >(undefined);

  useEffect(() => {
    const result = noiseCancellation.isSupported();

    if (typeof result === 'boolean') {
      setIsSupportedByBrowser(result);
    } else {
      result
        .then((_isSupportedByBrowser) =>
          setIsSupportedByBrowser(_isSupportedByBrowser),
        )
        .catch((err) =>
          console.error(
            `Can't determine if noise cancellation is supported`,
            err,
          ),
        );
    }
  }, [noiseCancellation]);

  const isSupported =
    isSupportedByBrowser && hasCapability && noiseCancellationAllowed;

  const [isEnabled, setIsEnabled] = useState(false);
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
