import { useCallback, useEffect, useState } from 'react';
import {
  Call,
  PaginatedGridLayout,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
} from '@stream-io/video-react-sdk';
import { useParams } from 'react-router-dom';
import { ViewerHeader } from './ui/ViewerHeader';
import { ViewerControls } from './ui/ViewerControls';

const apiKey = import.meta.env.VITE_STREAM_API_KEY as string;

export const WebRTCLivestream = () => {
  const { callId } = useParams<{ callId: string }>();
  const [call, setCall] = useState<Call | undefined>(undefined);
  const tokenProvider = useCallback(async () => {
    const endpoint = new URL(
      'https://stream-calls-dogfood.vercel.app/api/auth/create-token',
    );
    endpoint.searchParams.set('api_key', apiKey);
    endpoint.searchParams.set('user_id', '!anon');
    endpoint.searchParams.set('call_cids', `default:${callId}`);
    const response = await fetch(endpoint).then((res) => res.json());
    return response.token as string;
  }, [callId]);

  const [client] = useState<StreamVideoClient>(
    () =>
      new StreamVideoClient({
        apiKey,
        tokenProvider,
        user: { type: 'anonymous' },
      }),
  );

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
