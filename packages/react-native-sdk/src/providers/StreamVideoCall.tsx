import { StreamVideoProps } from '@stream-io/video-react-bindings';
import React, { PropsWithChildren } from 'react';
import { StreamVideo } from './StreamVideo';
import { StreamCall, StreamCallProps } from './StreamCall';

// <StreamCall /> shouldn't be embedded in <StreamVideo />
// as otherwise it becomes hard to support multiple calls
// (call-watching scenario). eg: Audio Rooms use-case.
/**
 *
 * @param props
 * @returns
 *
 * @category Client State
 */
export const StreamVideoCall = ({
  callId,
  callType,
  callCycleHandlers,
  client,
  translationsOverrides,
  i18nInstance,
  language,
  children,
}: PropsWithChildren<StreamVideoProps & StreamCallProps>) => {
  return (
    <StreamVideo
      client={client}
      translationsOverrides={translationsOverrides}
      i18nInstance={i18nInstance}
      language={language}
    >
      <StreamCall
        callId={callId}
        callType={callType}
        callCycleHandlers={callCycleHandlers}
      >
        {children}
      </StreamCall>
    </StreamVideo>
  );
};
