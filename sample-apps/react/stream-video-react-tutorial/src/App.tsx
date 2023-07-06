import { useEffect, useState } from 'react';
import {
  Call,
  StreamCall,
  StreamTheme,
  StreamVideo,
  PaginatedGridLayout,
  CallControls,
} from '@stream-io/video-react-sdk';

import './style.css';
import { useCreateStreamVideoClient } from './useCreateStreamVideoClient';

export default function App() {
  const client = useCreateStreamVideoClient({
    apiKey: import.meta.env.VITE_STREAM_API_KEY,
    tokenOrProvider: import.meta.env.VITE_STREAM_USER_TOKEN,
    user: { id: import.meta.env.VITE_STREAM_USER_ID },
  });

  const [call, setCall] = useState<Call>();

  useEffect(() => {
    const call = client?.call('default', import.meta.env.VITE_STREAM_CALL_ID);
    call?.join({ create: true });
    setCall(call);

    return () => {
      call?.leave();
      setCall(undefined);
    };
  }, [client]);

  return (
    <StreamVideo client={client}>
      {call && (
        <StreamCall call={call}>
          <StreamTheme className="video__call">
            <UI />
          </StreamTheme>
        </StreamCall>
      )}
    </StreamVideo>
  );
}

export const UI = () => {
  return (
    <>
      <PaginatedGridLayout />
      <CallControls />
    </>
  );
};
