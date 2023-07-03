import {
  StreamVideo as StreamVideoProvider,
  StreamVideoProps,
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
export const StreamVideo = (props: PropsWithChildren<StreamVideoProps>) => {
  const { client, children, translationsOverrides, i18nInstance, language } =
    props;

  /**
   * Effect to inform the coordinator about the online status of the app
   */
  useEffect(() => {
    let prevIsOnline = true;
    const unsubscribe = NetInfo.addEventListener((state) => {
      const { isConnected, isInternetReachable } = state;
      const isOnline = isConnected === true && isInternetReachable === true;
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
      translationsOverrides={translationsOverrides}
      i18nInstance={i18nInstance}
      language={language}
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
