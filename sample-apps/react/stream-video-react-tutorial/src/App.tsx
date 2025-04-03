import {
  CallingState,
  RingingCall,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  useCalls,
  useCallStateHooks,
  User,
  useStreamVideoClient,
} from '@stream-io/video-react-sdk';
import { useEffect, useState } from 'react';

import '@stream-io/video-react-sdk/dist/css/styles.css';
import './style.css';

const isGuest = window.location.href.includes('?guest');

// For demo credentials, check out our video calling tutorial:
// https://getstream.io/video/sdk/react/tutorial/video-calling/
const apiKey = '2x2ms6uuwxcf';
const token = isGuest
  ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoicmluZ2luZy10ZXN0LWd1ZXN0In0.ofmlWemvzSAFplmv1cg3gUsxdlTQq-6NOALfu2SfgMY'
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoicmluZ2luZy10ZXN0LWhvc3QifQ.VGlI7CYjTYLowHbA58T2N6nXf_5NInB2IA3plLoRG5I';
const userId = isGuest ? 'ringing-test-guest' : 'ringing-test-host';
const callId = `ringing-test-call-${Math.random().toString(16).slice(2, 10)}`;

const user: User = {
  id: userId,
  name: isGuest ? 'Guest' : 'Host',
};

export default function App() {
  const [client, setClient] = useState<StreamVideoClient | undefined>(
    undefined,
  );

  useEffect(() => {
    let cancel = false;
    const myClient = new StreamVideoClient(apiKey, { logLevel: 'trace' });
    myClient.connectUser(user, token).then(() => {
      if (!cancel) setClient(myClient);
    });
    (window as any).client = myClient;
    return () => {
      cancel = true;
      myClient.disconnectUser();
    };
  }, []);

  if (!client) {
    return 'connecting';
  }

  return (
    <StreamTheme>
      <StreamVideo client={client}>
        {isGuest ? <GuestUI /> : <HostUI />}
      </StreamVideo>
    </StreamTheme>
  );
}

function HostUI() {
  const client = useStreamVideoClient();
  const { useRemoteParticipants } = useCallStateHooks();
  const participants = useRemoteParticipants();
  participants.forEach((p) => {
    const [track] = p.videoStream?.getVideoTracks() ?? [];
    if (track) {
      const trackSettings = track.getSettings();
      console.log(trackSettings.width, trackSettings.height);
    }
  });

  useEffect(() => {
    if (!client) return;
    const myCall = client.call('default', callId);

    const createPromise = myCall
      .getOrCreate({
        ring: true,
        data: {
          members: [
            { user_id: 'ringing-test-host' },
            { user_id: 'ringing-test-guest' },
          ],
          settings_override: {
            ring: {
              auto_cancel_timeout_ms: 5_000,
              incoming_call_timeout_ms: 60_000,
              missed_call_timeout_ms: 60_000,
            },
          },
        },
      })
      .catch((err) => {
        console.error(`Failed to join the call`, err);
      });

    return () => {
      createPromise.then(() =>
        myCall.leave().catch((err) => {
          console.error(`Failed to leave the call`, err);
        }),
      );
    };
  }, [client]);

  return <RingingCallUI />;
}

function GuestUI() {
  return <RingingCallUI />;
}

export const RingingCallUI = () => {
  const calls = useCalls();
  // handle incoming ring calls
  const incomingCalls = calls.filter(
    (call) =>
      call.isCreatedByMe === false &&
      call.state.callingState === CallingState.RINGING,
  );
  const [incomingCall] = incomingCalls;
  // handle outgoing ring calls
  const outgoingCalls = calls.filter(
    (call) =>
      call.isCreatedByMe === true &&
      call.state.callingState === CallingState.RINGING,
  );
  const [outgoingCall] = outgoingCalls;
  const call = incomingCall ?? outgoingCall;

  if (!call) {
    return 'No call';
  }

  return (
    <StreamCall call={call}>
      {user.name}
      <RingingCall />
    </StreamCall>
  );
};
