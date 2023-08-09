import {
  StreamVideoClient,
  StreamVideoRN,
  Call,
  CallingState,
  StreamVideo,
  StreamCall,
  User,
} from '@stream-io/video-react-native-sdk';
import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text } from 'react-native';

// for simplicity, we assume that permission was granted through the native settings app
StreamVideoRN.setPermissions({
  isCameraPermissionGranted: false,
  isMicPermissionGranted: true,
});

const apiKey = 'REPLACE_WITH_API_KEY'; // the API key can be found in the "Credentials" section
const token = 'REPLACE_WITH_TOKEN'; // the token can be found in the "Credentials" section
const userId = 'REPLACE_WITH_USER_ID'; // the user_id can be found in the "Credentials" section
const callId = 'REPLACE_WITH_CALL_ID'; // the call_id can be found in the "Credentials" section

// initialize the user object
const user: User = {
  id: userId,
  name: 'Santhosh',
  image: `https://getstream.io/random_png/?id=${userId}&name=Santhosh`,
};

export default function App() {
  const [client, setClient] = useState<StreamVideoClient>();
  const [call, setCall] = useState<Call>();
  useEffect(() => {
    const _client = new StreamVideoClient({
      apiKey,
      token,
      user,
    });
    setClient(_client);

    return () => {
      _client.disconnectUser();
      setClient(undefined);
    };
  }, []);

  useEffect(() => {
    if (!client) {
      return;
    }
    const _call = client.call('audio_room', callId);
    _call
      .join({
        create: true,
        data: {
          members: [{ user_id: 'john_smith' }, { user_id: 'jane_doe' }],
          custom: {
            title: 'React Native test',
            description: 'We are doing a test of react native audio rooms',
          },
        },
      })
      .catch((err) => {
        console.error('Error joining the call', err);
        setCall(undefined);
      })
      .then(() => {
        console.log('Successfully joined the call');
      });
    setCall(_call);

    return () => {
      if (_call.state.callingState !== CallingState.LEFT) {
        _call.leave();
      }
      setCall(undefined);
    };
  }, [client]);

  if (!client || !call) {
    return null;
  }

  return (
    <StreamVideo client={client} language="en">
      <StreamCall call={call}>
        <SafeAreaView>
          <Text style={{ fontSize: 30, color: 'black' }}>
            Ready to render Audio room
          </Text>
        </SafeAreaView>
      </StreamCall>
    </StreamVideo>
  );
}
