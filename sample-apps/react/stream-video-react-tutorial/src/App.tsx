import { useEffect, useState } from 'react';
import {
  Call,
  CallControls,
  CallingState,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

import type { User }  from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import './style.css';

// For demo credentials, check out our video calling tutorial:
// https://getstream.io/video/sdk/react/tutorial/video-calling/
const userId = 'video-tutorial-' + Math.random().toString(16).substring(2);
const apiKey = 'mmhfdzb5evj2';
const tokenProvider = async () => {
  const provider = new URL('https://pronto.getstream.io/api/auth/create-token');
  provider.searchParams.set('api_key', apiKey);
  provider.searchParams.set('user_id', userId);
  const { token } = await fetch(provider).then((res) => res.json());
  return token as string;
};

const user: User = {
  id: userId,
  name: 'Oliver',
  image: 'https://getstream.io/random_svg/?id=oliver&name=Oliver',
};

// initialize the StreamVideoClient
const client = new StreamVideoClient({ apiKey, user, tokenProvider });

export default function App() {
  const [call, setCall] = useState<Call>();
  useEffect(() => {
    const myCall = client.call(
      'default',
      `video-tutorial-${Math.random().toString(16).substring(2)}`,
    );
    myCall.join({ create: true }).catch((err) => {
      console.error(`Failed to join the call`, err);
    });

    setCall(myCall);

    return () => {
      setCall(undefined);
      myCall.leave().catch((err) => {
        console.error(`Failed to leave the call`, err);
      });
    };
  }, []);

  if (!call) return null;

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <UILayout />
      </StreamCall>
    </StreamVideo>
  );
}

export const UILayout = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  if (callingState !== CallingState.JOINED) {
    return <div>Loading...</div>;
  }

  return (
    <StreamTheme>
      <SpeakerLayout participantsBarPosition="bottom" />
      <CallControls />
    </StreamTheme>
  );
};
