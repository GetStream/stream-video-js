import {
  type StreamVideoProviderProps,
  StreamVideoProvider,
} from '@stream-io/video-react-bindings';
import React, { type PropsWithChildren, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { usePushRegisterEffect } from '../hooks';
import {
  TranslationProvider,
  useStreami18n,
  type UseStreami18nParams,
} from '../i18n';
import { type DeepPartial, StreamTheme } from '../contexts/ThemeContext';
import { type Theme } from '../theme/theme';
import { ScreenshotIosContextProvider } from '../contexts/internal/ScreenshotIosContext';
import BusyTonePlayer from './BusyTonePlayer';

export type StreamVideoProps = StreamVideoProviderProps &
  UseStreami18nParams & {
    style?: DeepPartial<Theme>;
  };

/**
 * StreamVideo is the root provider of the SDK: it provides the client to the component tree and
 * mounts the SDK's translation context.
 *
 * The i18n runtime lives here rather than in `@stream-io/video-react-bindings` because the
 * translation key catalog is generated from *this* package's `t()` call sites.
 *
 * There used to be a `translationsOverrides = translations` default parameter here, which was a
 * bug: an integrator passing their own dictionaries *replaced* the SDK's bundled strings instead
 * of merging with them, leaving every untranslated key rendering as a raw dotted path.
 * `useStreami18n` layers integrator dictionaries over the SDK's own defaults, so a partial
 * dictionary is now safe.
 *
 * @param props
 * @returns
 *
 * @category Client State
 */
export const StreamVideo = (props: PropsWithChildren<StreamVideoProps>) => {
  const { client, children, i18nInstance, language, translations, style } =
    props;

  const translationContext = useStreami18n({
    i18nInstance,
    language,
    translations,
  });

  /**
   * Effect to inform the coordinator about the online status of the app
   */
  useEffect(() => {
    let prevIsOnline = true;
    return NetInfo.addEventListener((state) => {
      const { isConnected, isInternetReachable } = state;
      const isOnline = isConnected === true && isInternetReachable !== false;
      if (isOnline === prevIsOnline) {
        return;
      }
      prevIsOnline = isOnline;
      const type = isOnline ? 'online' : 'offline';
      client.streamClient.updateNetworkConnectionStatus({ type });
    });
  }, [client]);

  return (
    <StreamVideoProvider client={client}>
      <TranslationProvider value={translationContext}>
        <PushRegister />
        <BusyTonePlayer />
        <StreamTheme style={style}>
          <ScreenshotIosContextProvider>
            {children}
          </ScreenshotIosContextProvider>
        </StreamTheme>
      </TranslationProvider>
    </StreamVideoProvider>
  );
};

/**
 * The usePushRegisterEffect needs to be a child of StreamVideoStoreProvider
 * So we create a renderless component to use it
 */
const PushRegister = () => {
  usePushRegisterEffect();
  return null;
};
