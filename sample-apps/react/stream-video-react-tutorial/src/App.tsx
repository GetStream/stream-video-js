import { useEffect, useMemo, useState } from 'react';
import {
  Call,
  CallControls,
  CallingState,
  LoadingIndicator,
  PaginatedGridLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  useCall,
  useCallCallingState,
  useConnectedUser,
  useMediaDevices,
} from '@stream-io/video-react-sdk';

import './style.css';

const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, property) => searchParams.get(property as string),
}) as unknown as Record<string, string | null>;

export default function App() {
  const [client] = useState<StreamVideoClient>(
    () => new StreamVideoClient(import.meta.env.VITE_STREAM_API_KEY),
  );
  const [call, setCall] = useState<Call | undefined>(undefined);

  const callId = useMemo(
    () => params.call_id || String(Math.round(Math.random() * 100000000)),
    [],
  );

  useEffect(() => {
    if (!callId) {
      return;
    }
    setCall(client.call('default', callId));
  }, [callId, client]);

  useEffect(() => {
    const user = {
      id: params.user_id || import.meta.env.VITE_STREAM_USER_ID,
    };
    const tokenProvider = params.ut || import.meta.env.VITE_STREAM_USER_TOKEN;
    client
      .connectUser(user, tokenProvider)
      .catch((err) => console.error('Failed to establish connection', err));

    return () => {
      client
        .disconnectUser()
        .catch((err) => console.error('Failed to disconnect', err));
    };
  }, [client]);

  return (
    <StreamVideo client={client}>
      {call && (
        <StreamCall call={call}>
          <StreamTheme>
            <UI />
          </StreamTheme>
        </StreamCall>
      )}
    </StreamVideo>
  );
}

export const UI = () => {
  const call = useCall();
  const { publishVideoStream, publishAudioStream } = useMediaDevices();
  const callingState = useCallCallingState();
  const user = useConnectedUser();

  useEffect(() => {
    if (callingState === CallingState.JOINED) {
      publishVideoStream();
      publishAudioStream();
    }
  }, [publishVideoStream, publishAudioStream, callingState]);

  return (
    <>
      {callingState === CallingState.JOINED ? (
        <div className="str-video__call">
          <div className="str-video__call__header">
            <h4 className="str-video__call__header-title">Call: {call.cid}</h4>
          </div>
          <PaginatedGridLayout />
          <CallControls />
        </div>
      ) : callingState === CallingState.JOINING ? (
        <LoadingIndicator text="Connecting ..." />
      ) : [CallingState.LEFT, CallingState.UNKNOWN, CallingState.IDLE].includes(
          callingState,
        ) ? (
        <button disabled={!user} onClick={() => call.join({ create: true })}>
          Join
        </button>
      ) : null}
    </>
  );
};
