import React, { useEffect, useState } from 'react';
import {
  ViewerLivestream as DefaultViewerLivestream,
  type ViewerLivestreamProps,
} from '../ViewerLivestream';
import { Call, CallingState, getLogger } from '@stream-io/video-client';
import { StreamCall } from '../../../providers/StreamCall';
import { useStreamVideoClient } from '@stream-io/video-react-bindings';

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
   * Component to override the ViewerLivestream component used under the hood.
   * **Default** [ViewerLivestream](https://github.com/GetStream/stream-video-js/blob/main/packages/react-native-sdk/src/components/Livestream/ViewerLivestream/ViewerLivestream.tsx)
   */
  ViewerLivestream?: React.ComponentType<ViewerLivestreamProps>;

  /**
   * Determines when the viewer joins the call.
   *
   * `"asap"` behavior means joining the call as soon as it is possible
   * (either the `join_ahead_time_seconds` setting allows it, or the user
   * has a the capability to join backstage).
   *
   * `"live"` behavior means joining the call when it goes live.
   *
   * @default "asap"
   */
  joinBehavior?: 'asap' | 'live';
};

export const LivestreamPlayer = ({
  callType,
  callId,
  ViewerLivestream = DefaultViewerLivestream,
  joinBehavior = 'asap',
}: LivestreamPlayerProps) => {
  const client = useStreamVideoClient();

  const [call, setCall] = useState<Call>();

  useEffect(() => {
    if (!client) {
      return;
    }
    const myCall = client.call(callType, callId);
    setCall(myCall);
    return () => {
      if (myCall.state.callingState !== CallingState.LEFT) {
        myCall.leave().catch((e) => {
          const logger = getLogger(['LivestreamPlayer']);
          logger('error', 'Error leaving call:', e);
        });
      }
      setCall(undefined);
    };
  }, [callId, callType, client]);

  useEffect(() => {
    return () => {
      // this handles unmount on metro reloads
      if (call?.state.callingState !== CallingState.LEFT) {
        call?.leave().catch((e) => {
          const logger = getLogger(['LivestreamPlayer']);
          logger('error', 'Error leaving call:', e);
        });
      }
    };
  }, [call]);

  if (!call) {
    return null;
  }

  return (
    <StreamCall call={call}>
      <ViewerLivestream joinBehavior={joinBehavior} />
    </StreamCall>
  );
};
