import {
  StreamVideoProvider,
  StreamVideoProps,
  StreamI18nProviderProps,
} from '@stream-io/video-react-bindings';
import React, { PropsWithChildren, useEffect } from 'react';
import { StreamVideoStoreProvider } from '../contexts/StreamVideoContext';
import NetInfo from '@react-native-community/netinfo';
import { MediaDevices } from './MediaDevices';
import { usePushRegisterEffect } from '../hooks';

/**
 *
 * @param props
 * @returns
 *
 * @category Client State
 */
export const StreamVideo = (
  props: PropsWithChildren<StreamVideoProps & StreamI18nProviderProps>,
) => {
  const { client, children, translationsOverrides, i18nInstance, language } =
    props;

  /**
   * Effect to inform the coordinator about the online status of the app
   */
  useEffect(() => {
    let prevIsOnline = true;
    const unsubscribe = NetInfo.addEventListener((state) => {
      const { isConnected, isInternetReachable } = state;
      const isOnline = isConnected === true && isInternetReachable !== false;
      if (isOnline === prevIsOnline) {
        return;
      }
      prevIsOnline = isOnline;
      // @ts-expect-error - due to being incompatible with DOM event type
      client.streamClient.wsConnection?.onlineStatusChanged({
        type: isOnline ? 'online' : 'offline',
      });
    });

    return unsubscribe;
  }, [client]);

  return (
    <StreamVideoProvider
      client={client}
      language={language}
      translationsOverrides={translationsOverrides}
      i18nInstance={i18nInstance}
    >
      <StreamVideoStoreProvider>
        <MediaDevices />
        <PushRegister />
        {children}
      </StreamVideoStoreProvider>
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
