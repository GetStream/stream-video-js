import { useEffect, useState } from 'react';
import { Call } from '@stream-io/video-client';
import { useStreamVideoClient } from '@stream-io/video-react-bindings';
import {
  LivestreamLayout,
  LivestreamLayoutProps,
  StreamCall,
} from '../../core';

export type LivestreamPlayerProps = {
  /**
   * The call type. Usually `livestream`.
   */
  callType: string;
  /**
   * The call ID.
   */
  callId: string;
  /**
   * The props for the {@link LivestreamLayout} component.
   */
  layoutProps?: LivestreamLayoutProps;
};

export const LivestreamPlayer = (props: LivestreamPlayerProps) => {
  const { callType, callId, layoutProps } = props;
  const client = useStreamVideoClient();
  const [call, setCall] = useState<Call>();
  useEffect(() => {
    if (!client) return;
    const myCall = client.call(callType, callId);
    setCall(myCall);
    myCall.join().catch((e) => {
      console.error('Failed to join call', e);
    });
    return () => {
      myCall.leave().catch((e) => {
        console.error('Failed to leave call', e);
      });
      setCall(undefined);
    };
  }, [callId, callType, client]);

  return (
    <StreamCall call={call}>
      <LivestreamLayout {...layoutProps} />
    </StreamCall>
  );
};
