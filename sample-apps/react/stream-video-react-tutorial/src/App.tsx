import { useCallback, useEffect, useState } from 'react';
import {
  CallControls,
  StreamCall,
  StreamTheme,
  StreamVideo,
  SpeakerLayout,
  StreamVideoClient,
  useCalls,
  CallingState,
  useStreamVideoClient,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import './style.css';

// NOTE: This will generate a new call on every reload
// Fork this CodeSandbox and set your own CallID if
// you want to test with multiple users or multiple tabs opened
const callId = () => 'csb-' + Math.random().toString(16).substring(2);
const user_id = 'zita';
const userCaller = { id: user_id };

const apiKey = 'par8f5s3gn2j';
const tokenProvider = async () => {
  const { token } = await fetch(
    'https://pronto.getstream.io/api/auth/create-token?' +
      new URLSearchParams({
        environment: 'pronto',
        user_id: user_id,
      }),
  ).then((res) => res.json());
  return token as string;
};

export default function CallerApp() {
  const [client, setClient] = useState<StreamVideoClient>();

  useEffect(() => {
    const myClient = new StreamVideoClient({
      apiKey,
      user: userCaller,
      tokenProvider,
      options: { logLevel: 'debug' },
    });
    setClient(myClient);
    return () => {
      myClient.disconnectUser();
      setClient(undefined);
    };
  }, []);

  if (!client) return null;

  return (
    <StreamVideo client={client}>
      <CallPanel />
    </StreamVideo>
  );
}

const CallPanel = () => {
  const client = useStreamVideoClient();
  const call = useCalls().filter((c) => c.ringing)[0];
  const [calleeId, setCalleeId] = useState('santhosh');

  const initiateRingCall = useCallback(() => {
    if (!client) return;
    const myCall = client.call('default', callId());
    myCall
      .getOrCreate({
        ring: true,
        data: {
          members: [
            // include self
            { user_id: user_id },
            // include the userId of the callee
            { user_id: calleeId },
          ],
        },
      })
      .catch((err) => {
        console.error(`Failed to join the call`, err);
      });

    return () => {
      if (myCall.state.callingState === CallingState.LEFT) return;
      myCall.leave().catch((err) => {
        console.error(`Failed to leave the call`, err);
      });
    };
  }, [client, calleeId]);

  function handleEnd() {
    call?.endCall();
  }

  return (
    <StreamTheme className="my-theme-overrides">
      {call && (
        <StreamCall call={call}>
          <label>callId: {call.cid}</label>
          <SpeakerLayout />
          <CallControls />
          <button type="button" onClick={handleEnd}>
            End call for all!
          </button>
        </StreamCall>
      )}
      {!call && (
        <>
          <label>Callee user_id: </label>
          <input
            type="text"
            value={calleeId}
            onChange={(e) => {
              setCalleeId(e.target.value);
            }}
          />
          <button onClick={initiateRingCall}>Ring</button>
        </>
      )}
    </StreamTheme>
  );
};
