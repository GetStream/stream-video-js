import { useEffect, useMemo } from 'react';
import {
  CallControls,
  CallingState,
  CallParticipantsView,
  LoadingIndicator,
  StreamCall,
  StreamVideo,
  useCall,
  useCallCallingState,
  useCreateStreamVideoClient,
  useMediaDevices,
} from '@stream-io/video-react-sdk';

import './style.css';

const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, property) => searchParams.get(property as string),
}) as unknown as Record<string, string | null>;

export default function App() {
  const client = useCreateStreamVideoClient({
    apiKey: import.meta.env.VITE_STREAM_API_KEY,
    tokenOrProvider: params.ut || import.meta.env.VITE_STREAM_USER_TOKEN,
    user: {
      id: params.user_id || import.meta.env.VITE_STREAM_USER_ID,
    },
  });

  const callId = useMemo(
    () => params.call_id || String(Math.round(Math.random() * 100000000)),
    [],
  );

  return (
    <StreamVideo client={client}>
      <StreamCall
        callType="default"
        callId={callId}
        autoJoin={false}
        data={{ create: true }}
      >
        <UI />
      </StreamCall>
    </StreamVideo>
  );
}

export const UI = () => {
  const call = useCall();
  const { publishVideoStream, publishAudioStream } = useMediaDevices();
  const callingState = useCallCallingState();

  useEffect(() => {
    if (callingState === CallingState.JOINED) {
      publishVideoStream();
      publishAudioStream();
    }
  }, [publishVideoStream, publishAudioStream, callingState]);

  return (
    <div className={`str-video light`}>
      {callingState === CallingState.JOINED ? (
        <div className="str-video__call">
          <div className="str-video__call__header">
            <h4 className="str-video__call__header-title">Call: {call.cid}</h4>
          </div>
          <CallParticipantsView call={call} />
          <CallControls call={call} />
        </div>
      ) : callingState === CallingState.JOINING ? (
        <LoadingIndicator text="Connecting ..." />
      ) : [CallingState.LEFT, CallingState.UNKNOWN, CallingState.IDLE].includes(
          callingState,
        ) ? (
        <button onClick={() => call.join()}>Join</button>
      ) : null}
    </div>
  );
};
