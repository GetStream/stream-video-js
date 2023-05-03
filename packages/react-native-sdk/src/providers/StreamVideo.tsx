import {
  StreamVideo as StreamVideoProvider,
  StreamVideoProps,
} from '@stream-io/video-react-bindings';
import React, { PropsWithChildren } from 'react';
import { Provider } from '../contexts/StreamVideoContext';
import { MediaDevicesProvider } from '../contexts/MediaDevicesContext';
import {
  CallCycleProvider,
  CallCycleHandlersType,
} from '../contexts/CallCycleContext';

/**
 *
 * @param props
 * @returns
 *
 * @category Client State
 */
export const StreamVideo = (
  props: PropsWithChildren<
    StreamVideoProps & { callCycleHandlers?: CallCycleHandlersType }
  >,
) => {
  const {
    callCycleHandlers = {},
    client,
    children,
    translationsOverrides,
    i18nInstance,
    language,
  } = props;

  return (
    <StreamVideoProvider
      client={client}
      translationsOverrides={translationsOverrides}
      i18nInstance={i18nInstance}
      language={language}
    >
      <CallCycleProvider callCycleHandlers={callCycleHandlers}>
        <MediaDevicesProvider>
          <Provider>{children}</Provider>
        </MediaDevicesProvider>
      </CallCycleProvider>
    </StreamVideoProvider>
  );
};
