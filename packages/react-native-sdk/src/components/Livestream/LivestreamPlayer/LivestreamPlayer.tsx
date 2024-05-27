import React, { useMemo, useEffect } from 'react';
import {
  ViewerLivestream as DefaultViewerLivestream,
  ViewerLivestreamProps,
} from '..';
import { StreamCall, useStreamVideoClient } from '../../..';

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
};

export const LivestreamPlayer = ({
  callType,
  callId,
  ViewerLivestream = DefaultViewerLivestream,
}: LivestreamPlayerProps) => {
  const client = useStreamVideoClient();

  const call = useMemo(
    () => client?.call(callType, callId),
    [callType, callId, client],
  );

  useEffect(() => {
    if (!call) {
      return;
    }
    call.join().catch((e) => {
      console.error('Failed to join call', e);
    });
    return () => {
      call.leave().catch((e) => {
        console.error('Failed to leave call', e);
      });
    };
  }, [call]);

  if (!call) {
    return null;
  }

  return (
    <StreamCall call={call}>
      <ViewerLivestream />
    </StreamCall>
  );
};
