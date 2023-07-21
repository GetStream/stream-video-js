import { useCallback, useEffect, useState } from 'react';
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
  const [client, setClient] = useState<StreamVideoClient | undefined>();
  const [call, setCall] = useState<Call | undefined>();

  useEffect(() => {
    const user = {
      id: import.meta.env.VITE_STREAM_USER_ID,
    };
    const token = import.meta.env.VITE_STREAM_USER_TOKEN;

    const client = new StreamVideoClient({
      apiKey: import.meta.env.VITE_STREAM_API_KEY,
      user,
      token,
    });
    setClient(client);

    return () => {
      client?.disconnectUser();
    };
  }, []);

  useEffect(() => {
    if (!client) {
      return;
    }
    setCall(client.call('default', import.meta.env.VITE_STREAM_CALL_ID));

    return () => {
      setCall(undefined);
    };
  }, [client]);

  useEffect(() => {
    call?.join({ create: true });

    return () => {
      call?.leave();
    };
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
