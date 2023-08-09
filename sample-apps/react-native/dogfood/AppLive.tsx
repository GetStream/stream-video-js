import React, { useEffect } from 'react';
import {
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  StreamVideoRN,
  User,
} from '@stream-io/video-react-native-sdk';
import { SafeAreaView, Text } from 'react-native';

// for simplicity, we assume that permission was granted through the native settings app
StreamVideoRN.setPermissions({
  isCameraPermissionGranted: true,
  isMicPermissionGranted: true,
});

const apiKey = 'REPLACE_WITH_API_KEY'; // the API key can be found in the "Credentials" section
const token = 'REPLACE_WITH_TOKEN'; // the token can be found in the "Credentials" section
const userId = 'REPLACE_WITH_USER_ID'; // the user id can be found in the "Credentials" section
const callId = 'REPLACE_WITH_CALL_ID'; // the call id can be found in the "Credentials" section

// initialize the user object
const user: User = {
  id: userId,
  name: 'Santhosh',
  image: `https://getstream.io/random_png/?id=${userId}&name=Santhosh`,
};

const client = new StreamVideoClient({ apiKey, user, token });
const call = client.call('livestream', callId);

export default function App() {
  useEffect(() => {
    call.join({ create: true }).catch((err) => {
      console.error('Failed to join the call', err);
    });

    return () => {
      call.leave().catch((err) => {
        console.error('Failed to leave the call', err);
      });
    };
  }, []);

  return <Livestream />;
}

const Livestream = () => (
  <StreamVideo client={client} language="en">
    <StreamCall call={call}>
      <SafeAreaView>
        <Text style={{ fontSize: 30, color: 'black' }}>TODO: render video</Text>
      </SafeAreaView>
    </StreamCall>
  </StreamVideo>
);
