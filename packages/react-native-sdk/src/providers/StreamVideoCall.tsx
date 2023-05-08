import { StreamVideoProps } from '@stream-io/video-react-bindings';
import React, { PropsWithChildren } from 'react';
import { StreamVideo } from './StreamVideo';
import { StreamCall, StreamCallProps } from './StreamCall';

/**
 * StreamVideoCall is a wrapper component that utilizes StreamVideo and StreamCall
 * components. It is a convenience component that can be used in cases where you have
 * a single call in your application.
 *
 * If you have multiple calls in your application you can use StreamVideo and StreamCall
 * components directly by mimicking the logic in this component.
 * @param PropsWithChildren<StreamVideoProps & StreamCallProps>
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
