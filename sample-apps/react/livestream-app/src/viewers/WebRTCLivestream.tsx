import { useEffect, useState } from 'react';
import {
  Call,
  PaginatedGridLayout,
  StreamCall,
  StreamVideo,
} from '@stream-io/video-react-sdk';
import { useParams } from 'react-router-dom';
import { ViewerHeader } from './ui/ViewerHeader';
import { ViewerControls } from './ui/ViewerControls';
import { useInitVideoClient } from '../hooks/useInitVideoClient';

export const WebRTCLivestream = () => {
  const { callId } = useParams<{ callId: string }>();
  const client = useInitVideoClient({
    call_cids: `default:${callId}`,
    isAnon: true,
  });
  const [call, setCall] = useState<Call | undefined>(undefined);

  useEffect(() => {
    if (!callId) {
      return;
    }
    setCall(client.call('default', callId));
  }, [client, callId]);

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
