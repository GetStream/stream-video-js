import {
  StreamVideo as StreamVideoProvider,
  StreamVideoProps,
} from '@stream-io/video-react-bindings';
import React, { PropsWithChildren } from 'react';
import { Provider } from '../contexts/StreamVideoContext';
import { MediaDevicesProvider } from '../contexts/MediaDevicesContext';

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
      <MediaDevicesProvider>
        <Provider>{children}</Provider>
      </MediaDevicesProvider>
    </StreamVideoProvider>
  );
};
