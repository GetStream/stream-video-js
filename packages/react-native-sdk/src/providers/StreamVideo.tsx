import {
  StreamVideo as StreamVideoProvider,
  StreamVideoProps,
} from '@stream-io/video-react-bindings';
import React, { PropsWithChildren, useEffect } from 'react';
import { StreamVideoStoreProvider } from '../contexts/StreamVideoContext';
import NetInfo from '@react-native-community/netinfo';
import { MediaDevices } from './MediaDevices';

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
    const unsubscribe = NetInfo.addEventListener((state) => {
      const { isConnected, isInternetReachable } = state;
      const isOnline = isConnected !== false && isInternetReachable !== false;
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
        {children}
      </StreamVideoStoreProvider>
    </StreamVideoProvider>
  );
};
