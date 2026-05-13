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
  User,
} from '@stream-io/video-react-sdk';

import '@stream-io/video-react-sdk/dist/css/styles.css';
import './style.css';

// For demo credentials, check out our video calling tutorial:
// https://getstream.io/video/sdk/react/tutorial/video-calling/
const userId = 'video-tutorial-' + Math.random().toString(16).substring(2);
const apiKey = 'mmhfdzb5evj2';

// Optional URL overrides - useful for joining a specific call from a webview
// host (e.g. the iOS WKWebView sample). Currently supports ?call_id=...;
// anything else falls back to the tutorial defaults.
const params =
  typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();
const callIdOverride = params.get('call_id')?.trim() || null;
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
    const callId =
      callIdOverride ??
      `video-tutorial-${Math.random().toString(16).substring(2)}`;
    if (callIdOverride) {
      console.info(`[tutorial] joining call from ?call_id=`, callId);
    } else {
      console.info(`[tutorial] joining newly-generated call`, callId);
    }
    // Reflect the active call id into the URL so it can be copied / shared /
    // reloaded without losing the room. Uses replaceState so the browser's
    // back button isn't affected.
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.get('call_id') !== callId) {
        url.searchParams.set('call_id', callId);
        window.history.replaceState(null, '', url.toString());
      }
    }
    const myCall = client.call('default', callId);
    myCall.join({ create: true }).catch((err) => {
      console.error(`Failed to join the call`, err);
    });
    // @ts-expect-error makes it easy to debug in the browser console
    window.call = myCall;

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
