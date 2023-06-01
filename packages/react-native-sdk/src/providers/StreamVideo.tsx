import {
  StreamVideo as StreamVideoProvider,
  StreamVideoProps,
} from '@stream-io/video-react-bindings';
import React, { PropsWithChildren } from 'react';
import { StreamVideoStoreProvider } from '../contexts/StreamVideoContext';
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
