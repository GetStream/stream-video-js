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

  const [call, setCall] = useState<Call | undefined>();

  const joinCall = () => {
    const call = client.call('default', import.meta.env.VITE_STREAM_CALL_ID);
    call.join({ create: true });
    setCall(call);
  };

  const leaveCall = () => {
    setCall(undefined);
  };

  return (
    <StreamVideo client={client} onConnect={joinCall} onDisconnect={leaveCall}>
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
