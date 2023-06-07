import { useCallback } from 'react';
import {
  PaginatedGridLayout,
  StreamCall,
  StreamVideo,
  useCreateStreamVideoClient,
} from '@stream-io/video-react-sdk';
import { useParams } from 'react-router-dom';
import { ViewerHeader } from './ui/ViewerHeader';
import { ViewerControls } from './ui/ViewerControls';

const apiKey = import.meta.env.VITE_STREAM_API_KEY as string;

export const WebRTCLivestream = () => {
  const { callId } = useParams<{ callId: string }>();
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

  const client = useCreateStreamVideoClient({
    apiKey,
    tokenOrProvider: tokenProvider,
    isAnonymous: true,
    user: {
      id: 'anonymous',
    },
  });

  return (
    <StreamVideo client={client}>
      <StreamCall callType="default" callId={callId!} autoJoin={true}>
        <WebRTCLivestreamUI />
      </StreamCall>
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
