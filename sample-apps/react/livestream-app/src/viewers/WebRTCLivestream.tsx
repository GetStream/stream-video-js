import { useEffect } from 'react';
import {
  PaginatedGridLayout,
  StreamCall,
  StreamVideo,
} from '@stream-io/video-react-sdk';
import { ViewerHeader } from './ui/ViewerHeader';
import { ViewerControls } from './ui/ViewerControls';
import { useInitVideoClient } from '../hooks/useInitVideoClient';
import { useSetCall } from '../hooks/useSetCall';

export const WebRTCLivestream = () => {
  const client = useInitVideoClient({
    isAnon: true,
  });
  const call = useSetCall(client);

  useEffect(() => {
    if (!call) {
      return;
    }
    call.join();
  }, [call]);

  return (
    <StreamVideo client={client}>
      {call && (
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
