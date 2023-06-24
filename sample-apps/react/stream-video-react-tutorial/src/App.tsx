import { useEffect, useState } from 'react';
import {
  Call,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  PaginatedGridLayout,
  CallControls,
} from '@stream-io/video-react-sdk';

import './style.css';

export default function App() {
  const [client] = useState<StreamVideoClient>(() => {
    const user = {
      id: import.meta.env.VITE_STREAM_USER_ID,
    };
    const token = import.meta.env.VITE_STREAM_USER_TOKEN;

    return new StreamVideoClient({
      apiKey: import.meta.env.VITE_STREAM_API_KEY,
      user,
      token,
    });
  });

  const [call] = useState<Call>(() =>
    client.call('default', import.meta.env.VITE_STREAM_CALL_ID),
  );

  useEffect(() => {
    call.join({ create: true });
  }, [call]);

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <StreamTheme className="video__call">
          <UI />
        </StreamTheme>
      </StreamCall>
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
