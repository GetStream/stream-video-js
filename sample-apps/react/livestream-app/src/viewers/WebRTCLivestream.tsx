import { useEffect, useState } from 'react';
import {
  PaginatedGridLayout,
  StreamCall,
  StreamVideo,
  useIsCallLive,
} from '@stream-io/video-react-sdk';
import { ViewerHeader } from './ui/ViewerHeader';
import { ViewerControls } from './ui/ViewerControls';
import { useInitVideoClient } from '../hooks/useInitVideoClient';
import { useSetCall } from '../hooks/useSetCall';
import { Lobby } from './ui/Lobby';

export const WebRTCLivestream = () => {
  const isLive = useIsCallLive();
  const client = useInitVideoClient({
    isAnon: true,
  });
  const call = useSetCall(client);
  const [autoJoin, setAutoJoin] = useState(false);

  useEffect(() => {
    if (!(call && autoJoin)) {
      return;
    }
    call.join();
  }, [call, autoJoin]);

  return (
    <StreamVideo client={client}>
      {(!autoJoin || !isLive) && (
        <Lobby
          autoJoin={autoJoin}
          isStreaming={isLive}
          setAutoJoin={setAutoJoin}
        />
      )}
      {call && isLive && autoJoin && (
        <StreamCall call={call}>
          <WebRTCLivestreamUI />
        </StreamCall>
      )}
    </StreamVideo>
  );
};

const WebRTCLivestreamUI = () => {
  return (
    <>
      <ViewerHeader />
      <PaginatedGridLayout />
      <ViewerControls />
    </>
  );
};
